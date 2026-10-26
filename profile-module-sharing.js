/* Public snapshots are separate from private backups and never used as writable account state. */
(()=>{'use strict';
const sections={projects:uid=>'biglwaProjectCanvas:v1:'+uid,library:()=> 'biglwaLibraryCatalogV1',closet:()=> 'biglwaModule_closet',trophies:()=> 'biglwaModule_trophies'};
let visitor=null,sdkPromise;
const isVisitor=()=>Boolean(window.__biglwaPublicStorageView)||Boolean(visitor)||document.documentElement.classList.contains('biglwa-preview-mode');
async function sdk(){if(!sdkPromise)sdkPromise=Promise.all([import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'),import('https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js'),import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js')]).then(([a,f,u])=>({f,db:f.getFirestore(a.getApps()[0]),auth:u.getAuth(a.getApps()[0])}));return sdkPromise;}
function node(tag,text){const n=document.createElement(tag);n.textContent=String(text||'');return n;}
function safeImage(value){try{const u=new URL(String(value));return u.protocol==='https:'?u.href:''}catch{return ''}}
function projectSnapshot(rows){return rows.slice(0,100).map(b=>({title:String(b.title||'Project').slice(0,300),items:(Array.isArray(b.items)?b.items:[]).slice(0,300).map(i=>({title:String(i.title||'').slice(0,300),text:String(i.text||i.content||'').slice(0,10000),url:safeImage(i.url||i.src),type:String(i.type||'')}))}));}
function snapshot(kind,raw){const rows=JSON.parse(raw||'[]');if(!Array.isArray(rows))throw Error('Saved collection has an invalid format.');if(kind==='projects')return projectSnapshot(rows);return rows.slice(0,1500).map(i=>({title:String(i.title||i.name||'').slice(0,300),meta:String(i.meta||i.author||'').slice(0,2000),rating:String(i.rating||''),status:String(i.status||''),image:safeImage(i.cover||i.image||i.photo)}));}
async function share(kind,visible,status){
 const {f,db,auth}=await sdk();await auth.authStateReady();const uid=auth.currentUser?.uid;
 if(!uid||isVisitor())throw Error('Open your own Studio to change sharing.');
 const account=await f.getDoc(f.doc(db,'users',uid));
 if(visible&&account.data()?.accountVisibility==='private')throw Error('Your account is private. Change profile visibility before sharing a module.');
 const value=visible?JSON.stringify(snapshot(kind,localStorage.getItem(sections[kind](uid)))):'[]';
 if(!window.confirm(visible?'Publish a snapshot of this '+kind+' collection on your profile? Future private edits stay private until you publish again.':'Hide this shared collection from profile visitors?'))return;
 await f.setDoc(f.doc(db,'users',uid,'sharedModules',kind),{value,visibility:visible?'public':'private',updatedAt:f.serverTimestamp()});status.textContent=visible?'Snapshot published to your profile.':'Shared snapshot hidden.';
}
async function paintVisitor(kind,root){
 if(!root)return;if(!visitor){root.replaceChildren(node('p','Loading this member’s profile…'));return;}
 root.replaceChildren(node('h2',kind[0].toUpperCase()+kind.slice(1)),node('p','Loading this member’s shared collection…'));
 const owner=visitor.uid;
 try{const {f,db}=await sdk();const snap=await f.getDoc(f.doc(db,'users',owner,'sharedModules',kind));if(visitor?.uid!==owner||!root.isConnected)return;
 root.replaceChildren(node('h2',kind[0].toUpperCase()+kind.slice(1)));
 if(!snap.exists()||snap.data().visibility!=='public'){root.append(node('p','This member has not shared this collection.'));return;}
 const rows=JSON.parse(snap.data().value||'[]');
 for(const item of rows){const card=node('article','');card.className='module-card';card.append(node('h3',item.title),node('p',[item.meta,item.rating,item.status].filter(Boolean).join(' · ')));
 for(const entry of [item,...(Array.isArray(item.items)?item.items:[])]){if(entry.text)card.append(node('p',entry.text));const src=safeImage(entry.image||(entry.type==='image'?entry.url:''));if(src){const img=document.createElement('img');img.src=src;img.alt=entry.title||'';img.loading='lazy';img.style.maxWidth='100%';card.append(img)}}root.append(card)}
 if(!rows.length)root.append(node('p','This shared collection is empty.'));
 }catch{if(root.isConnected)root.replaceChildren(node('h2',kind),node('p','This collection is private or unavailable.'));}
}
function publicOrbit(root){
 root.replaceChildren(node('h2','Orbit connections'));
 const info=node('p','Public profile links · connections belong to this member and open separately.');root.append(info);
 const links=Array.isArray(visitor?.profile?.socials)?visitor.profile.socials:[];
 if(!links.length){root.append(node('p','No public Orbit links shared yet.'));return;}
 const list=node('div','');list.className='biglwa-public-orbit-links';
 for(const item of links){
  const url=safeImage(item.url);if(!url)continue;
  const link=node('a',item.label+(item.handle?' · '+item.handle:''));
  link.href=url;link.target='_blank';link.rel='noopener noreferrer';
  link.dataset.source=item.id||'';
  link.className='biglwa-public-orbit-link';
  list.append(link);
 }root.append(list);
}
async function publicBoards(root){
 root.replaceChildren(node('h2','Boards'));
 const subtitle=node('p','A peek at this member’s publicly shared Pins and collections.');root.append(subtitle);
 const grid=node('div','');grid.className='biglwa-public-board-grid';root.append(grid);
 const cards=[];
 if(visitor?.profile?.accountVisibility!=='private'&&visitor?.uid){
  try{
   const {f,db}=await sdk();
   const snap=await f.getDocs(f.query(f.collection(db,'users',visitor.uid,'posts'),f.where('state','==','approved'),f.limit(100)));
   for(const d of snap.docs){
    const item=d.data(),source=String(item.source||'').toLowerCase();
    const link=String(item.sourceUrl||'');
    if(source!=='pinterest'&&!/^https:\/\/(?:www\.)?pinterest\./i.test(link))continue;
    const photo=safeImage(item.thumbnailUrl||item.imageUrl||item.photo||item.media?.[0]?.url||item.images?.[0]?.url||item.images?.[0]);
    if(photo)cards.push({image:photo,title:String(item.title||item.caption||'Shared Pin').slice(0,80)});
    if(cards.length===6)break;
   }
  }catch{}
 }
 if(!root.isConnected)return;
 for(let i=0;i<6;i++){
  const card=node('div','');card.className='biglwa-public-board-tile';
  if(cards[i]){
   const img=document.createElement('img');img.src=cards[i].image;img.alt=cards[i].title;img.loading='lazy';card.append(img);
  }else{card.classList.add('is-placeholder');card.setAttribute('aria-label','Board preview placeholder');}
  grid.append(card);
 }
 root.append(node('p',cards.length?'Showing '+cards.length+' published Pinterest media preview'+(cards.length===1?'':'s')+'. Private Pins are never shown.':'Only public Pins appear here. Connect and curate your own Boards after joining.'));
}
async function paintPublicContent(kind,root){
 root.replaceChildren(node('h2',kind==='feed'?'Published posts':kind),node('p','Loading shared content…'));
 if(!visitor){root.replaceChildren(node('p','Loading this member’s profile…'));return;}
 if(kind==='orbit'){publicOrbit(root);return;}
 if(kind==='boards'){await publicBoards(root);return;}
 const owner=visitor.uid,profile=visitor.profile||{};
 if(profile.accountVisibility==='private'){root.replaceChildren(node('p','This member’s Studio is private.'));return;}
 try{
  if(kind==='diary'){root.replaceChildren(node('h2','Journal'),node('p',profile.journalVisibility==='public'?profile.publicJournal:'This Journal is private.'));return;}
  const {f,db}=await sdk();let rows=[];
  if(kind==='feed'){
   const snap=await f.getDocs(f.query(f.collection(db,'users',owner,'posts'),f.where('state','==','approved'),f.limit(100)));rows=snap.docs.map(d=>d.data());
  }else if(kind==='archive')rows=await window.BigLWAUserDirectory.loadArchiveForUsername(visitor.username);
  else if(kind==='map'){
   const snap=await f.getDocs(f.query(f.collection(db,'mapPins'),f.where('uid','==',owner),f.where('isPublic','==',true),f.limit(100)));rows=snap.docs.map(d=>d.data());
  }else{root.replaceChildren(node('h2',kind),node('p','This module contains private account data. Open your own Studio to use it.'));return;}
  if(visitor?.uid!==owner||!root.isConnected)return;
  root.replaceChildren(node('h2',kind==='feed'?'Published posts':kind));
  if(kind==='map'){
    const count=rows.length;
    root.append(node('p',count?'Read-only map · '+count+' place'+(count===1?'':'s')+' shared by this member. No editing or saving.':'No public map locations are shared yet.'));
    const first=rows.find(item=>Number.isFinite(Number(item.lat))&&Number.isFinite(Number(item.lng??item.long)));
    if(first){
      // Coarse rounding protects against accidentally implying house-level precision.
      const lat=Math.round(Number(first.lat)*1000)/1000,lng=Math.round(Number(first.lng??first.long)*1000)/1000;
      if(Math.abs(lat)<=85&&Math.abs(lng)<=180){
        const frame=document.createElement('iframe');
        frame.title='Read-only public location preview';
        frame.loading='lazy';frame.referrerPolicy='no-referrer';
        const bbox=[lng-.075,lat-.05,lng+.075,lat+.05];
        frame.src='https://www.openstreetmap.org/export/embed.html?bbox='+bbox.map(encodeURIComponent).join('%2C')+'&layer=mapnik&marker='+lat+'%2C'+lng;
        frame.style.cssText='display:block;border:1px solid #e0c7ba;border-radius:14px;width:100%;max-width:740px;height:315px;background:#e9e2d6;margin:8px 0 14px';
        frame.setAttribute('sandbox','allow-scripts allow-same-origin');root.append(frame);
      }
    }
  }
  for(const item of rows){const card=node('article','');card.className='module-card';card.append(node('h3',item.title||item.caption||item.linkTitle||item.source||'Shared item'),node('p',item.detail||item.city||''));
   const src=safeImage(item.thumbnailUrl||item.imageUrl||item.photo||item.media?.[0]?.url||item.images?.[0]?.url||item.images?.[0]);if(src){const img=document.createElement('img');img.src=src;img.alt='';img.loading='lazy';img.style.maxWidth='100%';card.append(img)}
   const url=safeImage(item.sourceUrl);if(url){const a=node('a','Original post ↗');a.href=url;a.target='_blank';a.rel='noopener noreferrer';card.append(a)}root.append(card);
  }
  if(!rows.length)root.append(node('p','No content is shared here yet.'));
 }catch{root.replaceChildren(node('p','Shared content is private or could not be loaded.'));}
}
function renderPublic(kind,root){
 if(!isVisitor())return false;
 if(['games','learn','tools'].includes(kind))return false;
 if(sections[kind])paintVisitor(kind,root);else paintPublicContent(kind,root);
 return true;
}

/* Visitor Orbit and Boards: six read-only slots; no connection prompts. */
const publicStyle=document.createElement('style');publicStyle.id='biglwa-public-modules-style';
publicStyle.textContent='.biglwa-public-orbit-links{display:flex;gap:9px;flex-wrap:wrap}.biglwa-public-orbit-link{display:inline-flex;padding:10px 14px;border-radius:12px;background:#fff8ef;color:#392934;text-decoration:none;box-shadow:2px 3px 0 #d7c1bd;font:700 12px system-ui;border-left:4px solid #d65c70}.biglwa-public-orbit-link[data-source="pinterest"]{border-color:#e60023}.biglwa-public-orbit-link[data-source="tiktok"]{border-color:#7e32a9}.biglwa-public-orbit-link[data-source="instagram"]{border-color:#f36b21}.biglwa-public-board-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin:12px 0 7px;max-width:520px}.biglwa-public-board-tile{aspect-ratio:1;overflow:hidden;border-radius:12px;background:linear-gradient(155deg,#dcb4a5,#584451);box-shadow:0 3px 0 #392c3333}.biglwa-public-board-tile img{width:100%;height:100%;object-fit:cover}.biglwa-public-board-tile.is-placeholder:nth-child(3n + 2){background:linear-gradient(145deg,#edd1c1,#bdaeb2)}.biglwa-public-board-tile.is-placeholder:nth-child(3n){background:repeating-radial-gradient(circle,#382f31 0 9px,#6b5552 10px 15px)}';
document.head.append(publicStyle);
window.BigLWAProfileModules={render:renderPublic,placeControls:controls};
window.addEventListener('biglwa:public-profile-ended',()=>{visitor=null;});
function controls(){
 const workspace=document.getElementById('moduleWorkspace'),kind=workspace?.dataset.moduleKey;
 const root=workspace.querySelector('.module-body')||workspace.querySelector('#moduleWorkspaceBody');if(!root)return;
 if(isVisitor()){renderPublic(kind,root);return;}
 if(!sections[kind])return;
 const visualButtons=kind==='projects'?
    (root.querySelector('#lwaVisualSlides .vs-buttons')||root.querySelector('#lwaProjects .lwa-project-controls')):null;
 if(kind==='projects'&&!visualButtons)return;
 const existing=root.querySelector('[data-profile-share]');
 if(existing){
   if(kind==='projects'&&existing.parentElement!==visualButtons){
     const lead=visualButtons.querySelector('[data-new],[data-new-board]');
     if(lead)lead.after(existing);else visualButtons.append(existing);
   }
   return;
 }
 const bar=node('section','');bar.dataset.profileShare=kind;
 bar.className=kind==='projects'?'visualz-share-controls':'module-card';
 const status=node('p',kind==='projects'?'':'Private account backup. Publish a snapshot only if you want profile visitors to see it.');
 status.setAttribute('role','status');
 if(kind==='projects')status.hidden=true;
 bar.append(status);
 for(const [label,visible] of [['Publish snapshot on my profile',true],['Hide shared snapshot',false]]){
   const b=node('button',kind==='projects'?(visible?'Publish snapshot':'Hide snapshot'):label);
   b.className='module-action';
   b.onclick=()=>{
     b.disabled=true;
     share(kind,visible,status).catch(e=>status.textContent=e.message).finally(()=>{
       b.disabled=false;
       if(kind==='projects')status.hidden=false;
     });
   };
   bar.append(b);
 }
 if(kind==='projects'){
   const lead=visualButtons.querySelector('[data-new],[data-new-board]');
   if(lead)lead.after(bar);else visualButtons.append(bar);
 }
 else if(kind==='closet'){const depop=root.querySelector('.module-grid .module-card:nth-child(2)');depop?.after(bar);if(!depop)root.append(bar)}
 else root.append(bar);
}
window.addEventListener('biglwa:public-profile-ready',e=>{visitor=e.detail;window.__biglwaPublicStorageView=true;controls()});
document.addEventListener('biglwa:module-open',()=>setTimeout(controls,0));
const visualzStyle=document.createElement('style');
visualzStyle.id='biglwa-visualz-share-layout';
visualzStyle.textContent=[
  '#lwaProjects .visualz-share-controls{display:inline-flex;align-items:center;gap:5px;flex-wrap:wrap;flex:0 1 auto;margin:0!important;padding:0!important;background:transparent!important;border:0!important;box-shadow:none!important;min-width:0}',
  '#lwaProjects .visualz-share-controls .module-action{margin:0!important;white-space:nowrap;font:700 10px/1.2 system-ui;padding:8px 9px;min-height:32px;border-radius:8px}',
  '#lwaProjects .visualz-share-controls p{order:9;flex-basis:100%;font:500 10px/1.4 system-ui;color:#6d4554;margin:2px 0 0}',
  '#lwaProjects .visualz-share-controls p[hidden]{display:none!important}',
  '#lwaProjects .vs-buttons{justify-content:flex-start!important;gap:6px!important}',
  '#lwaProjects .vs-toolbar{gap:12px!important}',
  '@media(max-width:760px){#lwaProjects .visualz-share-controls{flex-basis:100%}}'
].join('');
document.head.append(visualzStyle);
document.addEventListener('biglwa:visualz-render',()=>setTimeout(controls,0));
document.addEventListener('biglwa:visualz-toolbar-ready',()=>setTimeout(controls,0));
// A signed-in visitor still has no editing rights over another member's Studio.
for(const type of ['submit','input','change'])document.addEventListener(type,event=>{if(isVisitor()&&event.target.closest?.('#moduleWorkspace')){event.preventDefault();event.stopImmediatePropagation();}},true);
})();
