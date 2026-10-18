/* Account-owned backups for formerly browser-only modules. Runs before Studio bootstrap. */
(()=>{'use strict';if(window.BigLWAAccountStorage)return;
const route=(new URLSearchParams(location.search).get('route')||location.pathname).replace(/^\/+|\/+$/g,'');
if(/^[a-z0-9._-]{5,24}$/i.test(route)&&!['studio','login','settings','privacy','terms','rights','about','data-deletion','map-app.html','index.html'].includes(route))window.__biglwaPublicStorageView=true;
const policy=window.BigLWAStoragePolicy,raw={get:Storage.prototype.getItem,set:Storage.prototype.setItem,remove:Storage.prototype.removeItem};
const disk=(key)=>raw.get.call(localStorage,key),put=(key,val)=>raw.set.call(localStorage,key,val),drop=key=>raw.remove.call(localStorage,key);
let uid='',fs,db,auth,ready=false,remoteReady=false,epoch=0,timer=0,busy=false,unsubscribe=null,notice='',changed=false;
let pending={},versions={};
const preview=()=>Boolean(window.parent!==window&&window.parent.__biglwaPublicStorageView)||document.documentElement.classList.contains('biglwa-preview-mode')||Boolean(window.__biglwaPublicStorageView);
const slot=(key)=>'biglwaAccountDataV1:'+uid+':'+key;
const pendingKey=()=> 'biglwaAccountPendingV1:'+uid;
const json=(s,fallback)=>{try{return JSON.parse(s)||fallback}catch{return fallback}};
function status(message){notice=message;window.dispatchEvent(new CustomEvent('biglwa:account-storage-status'));paint()}
function saveQueue(){put(pendingKey(),JSON.stringify(pending))}
function notifyChange(){changed=true;status('Account updates are available. Reload to show them.');}
Storage.prototype.getItem=function(key){
 if(this===localStorage&&preview()&&/^(biglwaDraft_|biglwaWritingCollection|biglwaSqwip|biglwaGuestChecks|biglwaVisitorNotes|biglwaRoomMessages)/.test(String(key)))return null;
 const name=this===localStorage?policy.canonical(key,uid):null;
 if(!name)return raw.get.call(this,key);
 if(preview())return null;
 return uid?disk(slot(name)):null;
};
function write(key,value){
 const name=policy.canonical(key,uid);if(!name)return false;
 if(preview())throw Error('This profile is read-only. Open your own Studio to edit.');
 if(!uid){throw Error('Sign in before saving this content to your account.');}
 if(!policy.validValue(value))throw Error('This collection is too large to sync or contains browser-only media. Export it before changing devices.');
 if(disk(slot(name))===value)return true;
 value===null?drop(slot(name)):put(slot(name),value);
 const previous=pending[name];
 pending[name]={value,base:previous?.base??versions[name]??0,editId:crypto.randomUUID()};
 saveQueue();status('Saving to your account…');clearTimeout(timer);timer=setTimeout(flush,600);return true;
}
Storage.prototype.setItem=function(key,value){if(this===localStorage&&write(key,String(value)))return;return raw.set.call(this,key,value)};
Storage.prototype.removeItem=function(key){if(this===localStorage&&write(key,null))return;return raw.remove.call(this,key)};
async function flush(){
 if(busy||!uid||!remoteReady||preview())return;
 busy=true;let retryNewer=false;const owner=uid,turn=epoch;
 try{
  for(const [key,edit] of Object.entries({...pending})){
   if(turn!==epoch||auth.currentUser?.uid!==owner)break;
   if(edit.conflict)continue;
   try{
    const revision=await fs.runTransaction(db,async tx=>{
     const ref=fs.doc(db,'users',owner,'studioState',key),snap=await tx.get(ref),prior=snap.data();
     const current=Number(prior?.revision)||0;
     if(prior?.editId===edit.editId)return current;
     if(current!==edit.base)throw Error('conflict');
     tx.set(ref,{value:edit.value,revision:current+1,editId:edit.editId,updatedAt:fs.serverTimestamp()});return current+1;
    });
    if(turn!==epoch)break;
    versions[key]=revision;
    if(pending[key]?.editId===edit.editId)delete pending[key];
    else if(pending[key]){pending[key].base=revision;retryNewer=true;}
    saveQueue();
   }catch(error){
    if(turn!==epoch)break;
    if(error.message==='conflict'){if(pending[key])pending[key].conflict=true;saveQueue();status('Another device changed the same collection. Your local edits are preserved; resolve this in Settings.');}
    else{status('Saved on this device; cloud sync needs retry. '+error.message);break;}
   }
  }
  if(!Object.keys(pending).length)status(changed?'Account updates are available. Reload to show them.':'Saved to your account');
 }finally{busy=false;if(retryNewer)setTimeout(flush,600)}
}
async function initialize(){
 try{
 const [app,a,s]=await Promise.all([import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'),import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js'),import('https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js')]);
 fs=s;const instance=app.getApps()[0]||app.initializeApp({apiKey:'AIzaSyAPUT8_pLNxdh5tbGpAmXBJiID3jVcA9DY',authDomain:'biglwa.firebaseapp.com',projectId:'biglwa',appId:'1:83232670555:web:e04927b20458390b3b507e'});auth=a.getAuth(instance);db=s.getFirestore(instance);await auth.authStateReady();uid=auth.currentUser?.uid||'';
 if(uid){
  pending=json(disk(pendingKey()),{});
  const ref=s.collection(db,'users',uid,'studioState');
  try{
   const snap=await s.getDocs(ref);
   for(const d of snap.docs){if(!policy.accepted(d.id))continue;const data=d.data();versions[d.id]=Number(data.revision)||0;if(!pending[d.id]){if(data.value===null)drop(slot(d.id));else if(policy.validValue(data.value))put(slot(d.id),data.value);}}
   remoteReady=true;
   let first=true;
   unsubscribe=s.onSnapshot(ref,snap=>{
    for(const d of snap.docs){if(!policy.accepted(d.id))continue;const data=d.data();versions[d.id]=Number(data.revision)||0;if(pending[d.id])continue;const value=data.value;if(!policy.validValue(value))continue;if(disk(slot(d.id))!==value){value===null?drop(slot(d.id)):put(slot(d.id),value);if(!first)notifyChange();}}
    first=false;
   },error=>status('Cloud updates unavailable: '+error.message));
  }catch(error){status('Cloud restore unavailable. Cached account data remains on this device. '+error.message)}
 }
 ready=true;
 a.onAuthStateChanged(auth,user=>{if((user?.uid||'')!==uid){epoch++;unsubscribe?.();location.reload();}});
 if(uid&&Object.keys(pending).length)setTimeout(flush,0);
 else if(!notice)status(uid?'Account data restored':'Sign in to sync your saved content.');
 return true;
 }catch(error){ready=true;status('Account sync could not start: '+error.message);return false;}
}
async function importLegacy(){
 if(!uid||preview()||!remoteReady)throw Error('Sign in and wait for account restore first.');
 const candidates=[...policy.keys,...policy.prefixes.map(p=>p+uid)];let count=0,skipped=0;
 for(const source of candidates){const key=policy.canonical(source,uid),value=disk(source);if(value===null||disk(slot(key))!==null||versions[key])continue;if(!policy.validValue(value)){skipped++;continue;}write(source,value);count++;}
 await flush();status(count+' browser collections queued for account sync. '+(skipped?skipped+' oversized or embedded-media collections skipped. ':'')+'Reload Studio after sync to show them.');return count;
}
async function resolve(useLocal){
 for(const [key,edit] of Object.entries(pending))if(edit.conflict){
  const snap=await fs.getDoc(fs.doc(db,'users',uid,'studioState',key));const data=snap.data();
  if(useLocal){pending[key]={...edit,base:Number(data?.revision)||0,editId:crypto.randomUUID(),conflict:false};}
  else{delete pending[key];const value=data?.value??null;value===null?drop(slot(key)):put(slot(key),value);}
 }
 saveQueue();await flush();status('Conflict choice saved. Reload to show the selected version.');
}
function exportLocal(){const values={};for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(policy.canonical(key,uid)||key.startsWith('biglwaAccountDataV1:'+uid+':')||key===pendingKey())values[key]=disk(key);}const a=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify(values,null,2)],{type:'application/json'}));a.href=url;a.download='biglwa-private-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function paint(){
 const el=document.getElementById('accountCloudStatus');if(el)el.textContent=notice;
}
function mount(){
 const host=document.getElementById('cache');if(!host||document.getElementById('accountCloudStatus'))return;
 const panel=document.createElement('div');panel.className='card';const title=document.createElement('h3');title.textContent='Account sync & browser migration';
 const info=document.createElement('p');info.textContent='Projects, library, map pins, saved collections and supported preferences are private account backups. Older unscoped browser data is imported only when you choose. Import only on a device that contains your own work; existing cloud collections are preserved.';
 const label=document.createElement('p');label.id='accountCloudStatus';label.setAttribute('role','status');panel.append(title,info,label);
 for(const [text,fn] of [['Import my existing browser data',importLegacy],['Retry sync',()=>remoteReady?flush():location.reload()],['Download private backup',exportLocal],['Keep my local conflicting edits',()=>resolve(true)],['Use cloud conflicting edits',()=>resolve(false)],['Reload saved data',()=>location.reload()]]){const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=()=>Promise.resolve().then(fn).catch(e=>status(e.message));panel.append(b);}
 host.prepend(panel);paint();
}
const api={ready:initialize(),flush,importLegacy,exportLocal,get uid(){return uid},get status(){return notice},get isReady(){return ready}};window.BigLWAAccountStorage=api;
window.addEventListener('online',flush);window.addEventListener('pagehide',()=>{if(uid)saveQueue()});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
