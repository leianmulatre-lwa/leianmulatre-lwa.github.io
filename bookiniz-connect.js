/* BIG LWA Connect: Boos, Bookiniz & Kin Sqwibs. Account-only, no browser-stored roster. */
(()=>{'use strict';
if(window.BigLWABookiniz)return;
const $=(s,r=document)=>r.querySelector(s);
const social=()=>window.BigLWASocial;
let owner='',members=[],busy=false;
const status=(node,msg)=>{const x=$('[data-kin-status]',node);if(x)x.textContent=msg};
function button(label,cls){const b=document.createElement('button');b.type='button';b.textContent=label;if(cls)b.className=cls;return b}
function pane(){const p=document.createElement('section');p.className='bookiniz-pane';p.hidden=true;return p}
function activate(root,key){
 if(!['boos','bookiniz'].includes(key))key='boos';
 const workspace=root.closest('#moduleWorkspaceBody')||root.parentElement;
 workspace?.querySelectorAll('.bookiniz-tabs [data-connect-tab]').forEach(b=>{
  const on=b.dataset.connectTab===key;b.setAttribute('aria-selected',String(on));b.setAttribute('aria-pressed',String(on));b.tabIndex=on?0:-1;
 });
 root.querySelectorAll('[data-connect-pane]').forEach(p=>p.hidden=p.dataset.connectPane!==key);
 const slot=root.querySelector('[data-connect-pane="'+key+'"] [data-connect-invite-slot]');
 if(slot)for(const node of root._bookinizInviteParts||[])if(node)slot.append(node);
 if(key==='bookiniz'){loadBookiniz(root);loadPosts(root);loadIncoming(root)}
}
function notice(msg,node){if(node)status(node,msg)}
function makeSwitch(person,selected,root){
 const row=document.createElement('div');row.className='bookiniz-person';
 const who=document.createElement('span');const strong=document.createElement('strong');strong.textContent=person.name||person.username;
 const small=document.createElement('small');small.textContent='@'+person.username;who.append(strong,small);
 const toggle=button(selected?'On':'Off','bookiniz-toggle');toggle.setAttribute('role','switch');toggle.setAttribute('aria-label','Bookini for @'+person.username);
 toggle.setAttribute('aria-checked',String(selected));toggle.classList.toggle('is-on',selected);
 toggle.onclick=async()=>{if(busy)return;busy=true;toggle.disabled=true;notice('Saving your Bookiniz…',root);
  try{const desired=toggle.getAttribute('aria-checked')!=='true';const response=await social().request('bookiniz',{uid:person.uid,enabled:desired});members=response.uids||[];renderBookiniz(root);notice('Bookiniz saved to your account.',root)}
  catch(error){notice(error.message,root)}
  finally{busy=false;toggle.disabled=false}
 };
 row.append(who,toggle);return row;
}
function renderBookiniz(root){
 const list=$('[data-kin-members]',root);if(!list)return;list.replaceChildren();
 const friends=social()?.people||[];
 const count=$('[data-kin-count]',root);if(count)count.textContent=members.length+' bookiniz';
 if(!friends.length){const p=document.createElement('p');p.textContent='Find your boos first, then choose who becomes bookini.';list.append(p);return}
 for(const person of friends)list.append(makeSwitch(person,members.includes(person.uid),root));
}
async function loadBookiniz(root){
 if(root.dataset.kinLoading==='1')return;root.dataset.kinLoading='1';
 try{
  const result=await social().request('bookiniz');
  if(!root.isConnected)return;members=result.uids||[];renderBookiniz(root);notice('',root)
 }catch(error){notice('Bookiniz could not sync: '+error.message,root)}
 finally{root.dataset.kinLoading='0'}
}
function renderPosts(root,items){
 const list=$('[data-kin-posts]',root);if(!list)return;list.replaceChildren();
 if(!items.length){const p=document.createElement('p');p.className='bookiniz-empty';p.textContent='No Kin Sqwibs yet. Share a thought with your circle.';list.append(p);return}
 for(const item of items){
  const article=document.createElement('article');article.className='bookiniz-post';
  const top=document.createElement('div');top.className='bookiniz-post-top';
  const mark=document.createElement('strong');mark.textContent=item.audience==='bookiniz'?'Bookiniz only':'Boos';
  const time=document.createElement('time');time.textContent=new Date(item.createdAt).toLocaleString();
  const remove=button('Remove','bookiniz-remove');remove.setAttribute('aria-label','Remove Kin Sqwib');
  remove.onclick=async()=>{remove.disabled=true;try{await social().request('kin-sqwibs/remove',{id:item.id});await loadPosts(root);notice('Kin Sqwib removed.',root)}catch(e){notice(e.message,root);remove.disabled=false}};
  top.append(mark,time,remove);const p=document.createElement('p');p.textContent=item.text;article.append(top,p);list.append(article);
 }
}
async function loadPosts(root){
 const list=$('[data-kin-posts]',root);if(!list)return;
 try{const result=await social().request('kin-sqwibs');if(root.isConnected)renderPosts(root,result.items||[])}
 catch(error){notice('Could not load Kin Sqwibs: '+error.message,root)}
}
function renderIncoming(root,posts){
 const list=$('[data-kin-incoming]',root);if(!list)return;list.replaceChildren();
 if(!posts.length){const p=document.createElement('p');p.className='bookiniz-empty';p.textContent='No Kin Sqwibs have been shared with you yet.';list.append(p);return}
 for(const post of posts){
  const card=document.createElement('article');card.className='bookiniz-post';
  const top=document.createElement('div');top.className='bookiniz-post-top';
  const by=document.createElement('strong');by.textContent='@'+(post.sender||'member');
  const scope=document.createElement('small');scope.textContent=post.audience==='bookiniz'?'Bookiniz':'Boos';
  const time=document.createElement('time');time.textContent=new Date(post.createdAt).toLocaleString();
  const body=document.createElement('p');body.textContent=post.text;
  top.append(by,scope,time);card.append(top,body);list.append(card);
 }
}
async function loadIncoming(root){
 const friends=(social()?.people||[]).slice(0,25),list=$('[data-kin-incoming]',root);
 if(!list)return;
 if(!friends.length){renderIncoming(root,[]);return}
 list.textContent='Checking your circles…';
 const reads=await Promise.allSettled(friends.map(async person=>{
  const response=await social().request('kin-sqwibs?owner='+encodeURIComponent(person.uid));
  return (response.items||[]).map(post=>({...post,sender:person.username}));
 }));
 if(!root.isConnected)return;
 const posts=reads.filter(x=>x.status==='fulfilled').flatMap(x=>x.value).sort((a,b)=>b.createdAt-a.createdAt).slice(0,60);
 renderIncoming(root,posts);
 if(reads.every(x=>x.status==='rejected'))notice('Could not load shared Kin Sqwibs.',root);
}
function makeBookiniFind(root){
 const section=document.createElement('section');section.className='bookiniz-find';
 const heading=document.createElement('h2');heading.textContent='Find user';
 const form=document.createElement('form');form.className='social-find bookiniz-find-form';
 form.setAttribute('role','search');
 const search=document.createElement('input');search.type='search';search.name='username';search.placeholder='Find user · @username';search.setAttribute('aria-label','Find user to add to Bookiniz');search.required=true;search.minLength=2;search.maxLength=30;
 const go=document.createElement('button');go.type='submit';go.textContent='Find';
 const results=document.createElement('div');results.className='connect-user-results bookiniz-find-results';results.setAttribute('aria-live','polite');
 form.append(search,go);section.append(heading,form,results);
 form.addEventListener('submit',async event=>{
  event.preventDefault();const term=search.value.trim().replace(/^@/,'');if(term.length<2)return;
  results.textContent='Finding members…';go.disabled=true;
  try{
   const answer=await social().request('find?q='+encodeURIComponent(term));
   if(!section.isConnected||search.value.trim().replace(/^@/,'')!==term)return;
   results.replaceChildren();
   const people=(answer.items||[]).filter(p=>p?.username&&p.uid);
   if(!people.length){results.textContent='No matching members.';return}
   for(const person of people){
    const row=document.createElement('div');row.className='social-result bookiniz-search-result';
    const label=document.createElement('span');label.textContent=(person.name||person.username)+' · @'+person.username;
    const add=button(members.includes(person.uid)?'Bookini ✓':'Add to Bookiniz','bookiniz-add-result');
    add.disabled=members.includes(person.uid);
    add.onclick=async()=>{
     if(busy)return;busy=true;add.disabled=true;notice('Adding @'+person.username+' to Bookiniz…',root);
     try{
      if(!(social().people||[]).some(p=>p.uid===person.uid))await social().request('friends',{username:person.username});
      await social().request('bookiniz',{uid:person.uid,enabled:true});
      await social().refresh();await loadBookiniz(root);
      add.textContent='Bookini ✓';notice('@'+person.username+' is now Bookini.',root);
     }catch(error){add.disabled=false;notice(error.message,root)}
     finally{busy=false}
    };
    const link=document.createElement('a');link.href='/'+encodeURIComponent(person.username);link.textContent='Profile';link.setAttribute('aria-label','View @'+person.username+' profile');
    row.append(label,add,link);results.append(row);
   }
  }catch(error){results.textContent=error.message}
  finally{go.disabled=false}
 });
 return section;
}
function mount(){
 const root=$('#socialConnect');
 if(!root||root.dataset.bookinizReady)return;
 const workspace=root.closest('#moduleWorkspaceBody')||root.parentElement;
 const heading=workspace?.querySelector('.module-heading');
 if(!heading)return;
 root.dataset.bookinizReady='1';root.classList.add('bookiniz-connect');
 const original=[...root.childNodes],nav=document.createElement('nav'),boos=pane(),kin=pane();
 nav.className='bookiniz-tabs';nav.setAttribute('role','tablist');nav.setAttribute('aria-label','Connect sections');
 for(const [key,label] of [['boos','Boos'],['bookiniz','Bookiniz']]){
  const control=button(label);control.dataset.connectTab=key;
  control.setAttribute('role','tab');control.setAttribute('aria-controls','connectPanel-'+key);
  control.onclick=()=>activate(root,key);nav.append(control);
 }
 heading.querySelector('.module-heading-copy')?.after(nav);
 for(const [node,key] of [[boos,'boos'],[kin,'bookiniz']]){
  node.dataset.connectPane=key;node.id='connectPanel-'+key;node.setAttribute('role','tabpanel');
 }
 const copy='Your boos are your friends. Bookiniz are the family you choose from them.';
 const introBoo=document.createElement('p');introBoo.className='bookiniz-boos-copy';introBoo.textContent=copy;
 boos.append(introBoo,...original);
 const booInvite=document.createElement('div');booInvite.className='bookiniz-invite-slot';booInvite.dataset.connectInviteSlot='';boos.append(booInvite);

 const kinCopy=document.createElement('p');kinCopy.className='bookiniz-intro';kinCopy.textContent=copy;
 const find=makeBookiniFind(root);
 const title=document.createElement('h2');title.className='bookiniz-roster-title';title.textContent='Your bookiniz';
 const meta=document.createElement('p');meta.className='bookiniz-meta';meta.textContent='Switch a Boo on to make them Bookini. Switch off to remove them from your close circle.';
 const count=document.createElement('strong');count.dataset.kinCount='';count.textContent='0 bookiniz';
 const roster=document.createElement('div');roster.className='bookiniz-members';roster.dataset.kinMembers='';
 const kinInvite=document.createElement('div');kinInvite.className='bookiniz-invite-slot';kinInvite.dataset.connectInviteSlot='';
 kin.append(kinCopy,find,title,meta,count,roster,kinInvite);

 const headingShare=document.createElement('h2');headingShare.textContent='share with your people';
 headingShare.className='bookiniz-share-heading';
 const shareIntro=document.createElement('p');shareIntro.textContent='Leave a private Sqwib, recommendation or link for your boos or bookiniz.';
 const form=document.createElement('form');form.className='bookiniz-share-form';
 const label=document.createElement('label');label.htmlFor='kinSqwibText';label.textContent='Leave a Sqwib';
 const textarea=document.createElement('textarea');textarea.id='kinSqwibText';textarea.required=true;textarea.maxLength=3500;textarea.rows=4;textarea.placeholder='A note, invite, recommendation or link for your people…';
 const audience=document.createElement('div');audience.className='bookiniz-audience-switch';audience.setAttribute('role','group');audience.setAttribute('aria-label','Who can see your share');
 for(const [key,labelText] of [['boos','Boos'],['bookiniz','Bookiniz']]){
  const b=button(labelText);b.dataset.kinAudience=key;b.setAttribute('aria-pressed',String(key==='bookiniz'));
  b.onclick=()=>audience.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));audience.append(b);
 }
 const caution=document.createElement('small');caution.className='bookiniz-caution';caution.textContent='Do not share account passwords or private access tokens. Use authorized sharing links instead.';
 const send=document.createElement('button');send.type='submit';send.textContent='Share privately';
 form.append(label,textarea,audience,caution,send);
 form.onsubmit=async e=>{e.preventDefault();send.disabled=true;notice('Sharing privately…',root);
  try{const selected=$('[data-kin-audience][aria-pressed="true"]',form)?.dataset.kinAudience||'bookiniz';
   await social().request('kin-sqwibs',{text:textarea.value,audience:selected});textarea.value='';
   notice('Shared with '+(selected==='bookiniz'?'Bookiniz':'Boos')+'.',root);await loadPosts(root);
  }catch(error){notice(error.message,root)}finally{send.disabled=false}
 };
 const mineTitle=document.createElement('h3');mineTitle.textContent='Your shares';
 const posts=document.createElement('div');posts.dataset.kinPosts='';posts.className='bookiniz-posts';
 const incomingTitle=document.createElement('h3');incomingTitle.textContent='Shared with you';
 const incomingList=document.createElement('div');incomingList.dataset.kinIncoming='';incomingList.className='bookiniz-posts';
 const sharing=document.createElement('section');sharing.className='bookiniz-share-section';
 sharing.append(headingShare,shareIntro,form,mineTitle,posts,incomingTitle,incomingList);kin.append(sharing);
 const live=document.createElement('p');live.className='bookiniz-status';live.dataset.kinStatus='';live.setAttribute('role','status');
 root.append(boos,kin,live);
 // Keep the real invitation form (and its existing copy/email/CSV handlers).
 // Reparent it to the selected section instead of cloning dead controls.
 const inviteCard=workspace.querySelector('#copyBiglwaInvite')?.closest('section.module-card');
 const contactCard=[...workspace.querySelectorAll('section.module-card')].find(s=>s.querySelector('input[type="file"][accept*="csv"]'));
 root._bookinizInviteParts=[inviteCard,contactCard].filter(Boolean);
 activate(root,'boos');loadBookiniz(root);
}
function schedule(){setTimeout(mount,0);setTimeout(mount,350)}
window.BigLWABookiniz={mount,loadBookiniz};
document.addEventListener('biglwa:module-open',e=>{if(e.detail?.key==='connect')schedule()});
window.addEventListener('biglwa:social-ready',schedule);
window.addEventListener('biglwa:identity-updated',()=>{members=[];const root=$('#socialConnect');if(root){renderBookiniz(root);loadBookiniz(root)}else schedule()});
window.addEventListener('biglwa:social-roster-updated',()=>{const root=$('#socialConnect');if(root?.dataset.bookinizReady)renderBookiniz(root)});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
})();