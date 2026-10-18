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
async function paintPublicContent(kind,root){
 root.replaceChildren(node('h2',kind==='feed'?'Published posts':kind),node('p','Loading shared content…'));
 if(!visitor){root.replaceChildren(node('p','Loading this member’s profile…'));return;}
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
window.BigLWAProfileModules={render:renderPublic};
window.addEventListener('biglwa:public-profile-ended',()=>{visitor=null;});
function controls(){
 const workspace=document.getElementById('moduleWorkspace'),kind=workspace?.dataset.moduleKey;
 const root=workspace.querySelector('.module-body')||workspace.querySelector('#moduleWorkspaceBody');if(!root)return;
 if(isVisitor()){renderPublic(kind,root);return;}
 if(!sections[kind])return;
 if(root.querySelector('[data-profile-share]'))return;
 const bar=node('section','');bar.dataset.profileShare=kind;bar.className='module-card';const status=node('p','Private account backup. Publish a snapshot only if you want profile visitors to see it.');status.setAttribute('role','status');bar.append(status);
 for(const [label,visible] of [['Publish snapshot on my profile',true],['Hide shared snapshot',false]]){const b=node('button',label);b.className='module-action';b.onclick=()=>{b.disabled=true;share(kind,visible,status).catch(e=>status.textContent=e.message).finally(()=>b.disabled=false)};bar.append(b)}root.prepend(bar);
}
window.addEventListener('biglwa:public-profile-ready',e=>{visitor=e.detail;window.__biglwaPublicStorageView=true;controls()});
document.addEventListener('biglwa:module-open',()=>setTimeout(controls,0));
// A signed-in visitor still has no editing rights over another member's Studio.
for(const type of ['submit','input','change'])document.addEventListener(type,event=>{if(isVisitor()&&event.target.closest?.('#moduleWorkspace')){event.preventDefault();event.stopImmediatePropagation();}},true);
})();
