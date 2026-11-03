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
 root.querySelectorAll('[data-connect-tab]').forEach(b=>{const on=b.dataset.connectTab===key;b.setAttribute('aria-selected',String(on));b.setAttribute('aria-pressed',String(on))});
 root.querySelectorAll('[data-connect-pane]').forEach(p=>p.hidden=p.dataset.connectPane!==key);
 if(key==='bookiniz')loadBookiniz(root);
 if(key==='share'){loadPosts(root);loadIncoming(root)}
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
function mount(){
 const root=$('#socialConnect');if(!root||root.dataset.bookinizReady)return;
 root.dataset.bookinizReady='1';root.classList.add('bookiniz-connect');
 const original=[...root.childNodes],nav=document.createElement('nav'),boos=pane(),kin=pane(),share=pane();
 nav.className='bookiniz-tabs';nav.setAttribute('aria-label','Connect sections');
 for(const [key,label] of [['boos','Boos'],['bookiniz','Bookiniz'],['share','Share']]){
  const b=button(label);b.dataset.connectTab=key;b.setAttribute('role','tab');b.onclick=()=>activate(root,key);nav.append(b);
 }
 for(const [node,key] of [[boos,'boos'],[kin,'bookiniz'],[share,'share']])node.dataset.connectPane=key;
 boos.append(...original);
 const title=document.createElement('h2');title.textContent='bookiniz';
 const intro=document.createElement('p');intro.className='bookiniz-intro';intro.textContent='First there’s your boos (your friends), then there’s bookiniz (your family). Choose your closest people from your boos.';
 const meta=document.createElement('div');meta.className='bookiniz-meta';meta.textContent='Your Bookiniz circle is private. Switch a Boo on to make them Bookini.';
 const count=document.createElement('strong');count.dataset.kinCount='';count.textContent='0 bookiniz';
 const roster=document.createElement('div');roster.className='bookiniz-members';roster.dataset.kinMembers='';
 kin.append(title,intro,meta,count,roster);
 const heading=document.createElement('h2');heading.textContent='leave a kin sqwib';
 const shareIntro=document.createElement('p');shareIntro.textContent='A private note or link for your people. Only the circle you choose can read it.';
 const form=document.createElement('form');form.className='bookiniz-share-form';
 const label=document.createElement('label');label.htmlFor='kinSqwibText';label.textContent='Your Kin Sqwib';
 const textarea=document.createElement('textarea');textarea.id='kinSqwibText';textarea.required=true;textarea.maxLength=3500;textarea.rows=4;textarea.placeholder='A note, invite, recommendation or link for your people…';
 const audience=document.createElement('div');audience.className='bookiniz-audience-switch';audience.setAttribute('role','group');audience.setAttribute('aria-label','Who can see this Kin Sqwib');
 for(const [key,labelText] of [['boos','Boos'],['bookiniz','Bookiniz']]){
  const b=button(labelText);b.dataset.kinAudience=key;b.setAttribute('aria-pressed',String(key==='bookiniz'));b.onclick=()=>audience.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));audience.append(b);
 }
 const caution=document.createElement('small');caution.className='bookiniz-caution';caution.textContent='Do not share account passwords or private access tokens. Use authorized sharing links instead.';
 const send=document.createElement('button');send.type='submit';send.textContent='Share Kin Sqwib';
 form.append(label,textarea,audience,caution,send);
 form.onsubmit=async e=>{e.preventDefault();send.disabled=true;notice('Sharing privately…',root);
  try{const selected=$('[data-kin-audience][aria-pressed="true"]',form)?.dataset.kinAudience||'bookiniz';await social().request('kin-sqwibs',{text:textarea.value,audience:selected});textarea.value='';notice('Shared with '+(selected==='bookiniz'?'Bookiniz':'Boos')+'.',root);await loadPosts(root)}
  catch(err){notice(err.message,root)}finally{send.disabled=false}
 };
 const listHeading=document.createElement('h3');listHeading.textContent='Kin Sqwibs';const posts=document.createElement('div');posts.dataset.kinPosts='';posts.className='bookiniz-posts';
 const incomingTitle=document.createElement('h3');incomingTitle.textContent='Shared with you';const incomingList=document.createElement('div');incomingList.dataset.kinIncoming='';incomingList.className='bookiniz-posts';share.append(heading,shareIntro,form,listHeading,posts,incomingTitle,incomingList);
 const live=document.createElement('p');live.className='bookiniz-status';live.dataset.kinStatus='';live.setAttribute('role','status');
 root.append(nav,boos,kin,share,live);
 const subtitle=document.createElement('p');subtitle.className='bookiniz-boos-copy';subtitle.textContent='Your boos are your friends. Bookiniz are the family you choose from them.';
 boos.prepend(subtitle);
 activate(root,'boos');loadBookiniz(root);
}
function schedule(){setTimeout(mount,0);setTimeout(mount,350)}
window.BigLWABookiniz={mount,loadBookiniz};
document.addEventListener('biglwa:module-open',e=>{if(e.detail?.key==='connect')schedule()});
window.addEventListener('biglwa:social-ready',schedule);
window.addEventListener('biglwa:identity-updated',()=>{members=[];const root=$('#socialConnect');if(root){renderBookiniz(root);loadBookiniz(root)}else schedule()});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
})();