/* Account-scoped Orbit profile URLs; credentials never enter Firestore. */
import { identity, onIdentityChange, startIdentity } from './account-identity.js';

const OPTIONS=new Set(['spotify','soundcloud','youtube','drive','calendar','google','goodreads','letterboxd','twitch','depop','facebook','instagram','tiktok','pinterest','x','snapchat','tumblr','imdb']);
const clean=(links)=>{
  const output={};
  for(const [k,v] of Object.entries(links&&typeof links==='object'?links:{})){
    if(!OPTIONS.has(k))continue;
    try{
      const url=new URL(String(v||'').trim());
      if(url.protocol==='https:'&&url.href.length<=1500)output[k]=url.href;
    }catch{}
  }
  return output;
};
// Keep legacy links available for an explicit one-time migration; never silently
// attribute an unscoped browser link to whichever person logs in next.
let localLegacy={};
try {
  localLegacy=clean(JSON.parse(localStorage.getItem('biglwaOrbitLinksLegacyBackupV1')||
    localStorage.getItem('biglwaOrbitLinks')||'{}'));
  if(Object.keys(localLegacy).length)
    localStorage.setItem('biglwaOrbitLinksLegacyBackupV1',JSON.stringify(localLegacy));
}catch{}
let refs,uid='',links={},ready=false,generation=0;
const broadcast=()=>{
  try{localStorage.setItem('biglwaOrbitLinks',JSON.stringify(links));}catch{}
  window.dispatchEvent(new CustomEvent('biglwa:orbit-links-synced',{detail:{uid,links:{...links}}}));
  const note=document.querySelector('#studioApp #orbit .orbit-note');
  if(note)note.textContent='Profile links are saved to your BIGLWA account. Imported media is stored separately in your archive.';
  document.querySelectorAll('#studioApp [data-orbit-app]').forEach(el=>{
    const id=el.dataset.orbitApp;
    if(['instagram','pinterest','tiktok','facebook'].includes(id))return;
    const text=el.querySelector('small');
    if(text)text.textContent=links[id]?'Linked':'Link';
    el.classList.toggle('is-linked',!!links[id]);
  });
};
async function firebase(){
  if(!refs){
    const [appMod,authMod,store]=await Promise.all([
      import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js')
    ]);
    const app=appMod.getApps()[0]||appMod.initializeApp({
      apiKey:'AIzaSyAPUT8_pLNxdh5tbGpAmXBJiID3jVcA9DY',
      authDomain:'biglwa.firebaseapp.com',projectId:'biglwa',
      appId:'1:83232670555:web:e04927b20458390b3b507e'
    });
    refs={auth:authMod.getAuth(app),db:store.getFirestore(app),...store};
  }
  return refs;
}
async function load(nextUid){
  const g=++generation;
  uid=nextUid||'';links={};ready=false;
  if(!uid){broadcast();return;}
  try{
    const f=await firebase();await f.auth.authStateReady();
    if(f.auth.currentUser?.uid!==uid||g!==generation)return;
    const snapshot=await f.getDoc(f.doc(f.db,'users',uid));
    if(g!==generation)return;
    links=clean(snapshot.exists()?snapshot.data()?.orbitLinks:{});
    ready=true;broadcast();
  }catch(err){
    if(g===generation){ready=false;links={};console.warn('Orbit account links:',err)}
  }
}
const normalizedDestination=(value)=>{
  try{
    const u=new URL(String(value||'').trim());
    const host=u.hostname.toLowerCase().replace(/^(?:www|m|mobile)\./,'').replace(/^twitter\.com$/,'x.com');
    const path=decodeURIComponent(u.pathname).replace(/\/+$/,'').toLowerCase();
    const identity=new URLSearchParams();
    for(const key of ['id','v','user','username','page_id','channel']){
      if(u.searchParams.has(key))identity.set(key,u.searchParams.get(key)||'');
    }
    return host+path+(identity.size?'?'+identity.toString():'');
  }catch{return ''}
};
async function save(id,value){
  if(!OPTIONS.has(id))throw Error('Unknown Orbit link destination.');
  if(!uid||!ready)throw Error('Your account links are loading. Sign in and retry.');
  const next={...links};if(String(value||'').trim()){
    const parsed=clean({[id]:value});
    if(!parsed[id])throw Error('Use a complete https:// profile URL.');
    const destination=normalizedDestination(parsed[id]);
    if(Object.entries(links).some(([other,existing])=>other!==id&&normalizedDestination(existing)===destination))
      throw Error('You already saved that destination under another Orbit planet.');
    next[id]=parsed[id];
  }else delete next[id];
  const f=await firebase();await f.auth.authStateReady();
  if(f.auth.currentUser?.uid!==uid)throw Error('Account changed; link not saved.');
  const checkUid=uid;
  await f.setDoc(f.doc(f.db,'users',uid),{
    orbitLinks:next,orbitLinksUpdatedAt:f.serverTimestamp()
  },{mergeFields:['orbitLinks','orbitLinksUpdatedAt']});
  if(uid!==checkUid)return;
  links=next;broadcast();
  return true;
}
async function importLocalLinks(){
  if(!ready||!uid)throw Error('Sign in before importing local profile links.');
  const candidate={...localLegacy};
  let imported=0;
  for(const [id,url] of Object.entries(candidate)){
    if(!links[id]){await save(id,url);imported++}
  }
  localLegacy={};
  try{localStorage.removeItem('biglwaOrbitLinksLegacyBackupV1')}catch{}
  return imported;
}
export function startOrbitAccountLinks(){
  if(window.BigLWAOrbitAccountLinks)return;
  const api={get:()=>({...links}),save,ready:()=>ready,owner:()=>uid,localPending:()=>Object.keys(localLegacy).filter(k=>!links[k]),importLocalLinks};
  window.BigLWAOrbitAccountLinks=api;
  startIdentity();onIdentityChange(who=>load(who?.uid||''));
  load(identity()?.uid||'');
  return api;
}
startOrbitAccountLinks();
