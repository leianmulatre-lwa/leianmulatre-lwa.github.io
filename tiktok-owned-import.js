/* Owner-requested one-time import. Source files are hosted with the site; account records use the normal authenticated writer. */
import {TIKTOK_IMPORT_OWNER,buildTikTokSnapshotPost,snapshotPostId} from './tiktok-snapshot-model.mjs?v=1';
let running=false,finished=false,store;
const status={state:'waiting',saved:0,skipped:0,failed:0};
async function run(){
 if(running||finished||window.__biglwaPublicStorageView||store?.auth.currentUser?.uid!==TIKTOK_IMPORT_OWNER)return;
 running=true;Object.assign(status,{state:'importing',saved:0,skipped:0,failed:0});
 try{
  const response=await fetch('/assets/tiktok/leianstanley.json?v=1',{credentials:'omit'});if(!response.ok)throw Error('TikTok import data unavailable');const snapshot=await response.json();
  if(snapshot.ownerUid!==store.auth.currentUser?.uid)throw Error('TikTok import owner mismatch');
  const {savePostRecords}=await import('/orbit-posts.js?v=20261025-pin-origin-1');
  for(const item of snapshot.items){
   if(store.auth.currentUser?.uid!==TIKTOK_IMPORT_OWNER)throw Error('Account changed during import');
   try{
    const id=await snapshotPostId(TIKTOK_IMPORT_OWNER,item.id),ref=store.doc(store.db,'users',TIKTOK_IMPORT_OWNER,'posts',id),prior=await store.getDoc(ref);
    let data=buildTikTokSnapshotPost(snapshot,item,prior.exists()?prior.data():null);
    if(!data){
     const existing=prior.data();
     if(existing?.importSnapshotId===snapshot.snapshotId&&existing.state==='approved'&&existing.archiveState==='collective'){
      const root=await store.getDoc(store.doc(store.db,'posts',id));
      if(root.data()?.importSnapshotId!==snapshot.snapshotId)data=existing;
     }
     if(!data){status.skipped++;continue}
    }
    data.createdAt=prior.data()?.createdAt||store.serverTimestamp();data.updatedAt=store.serverTimestamp();
    await savePostRecords(TIKTOK_IMPORT_OWNER,id,data,{archiveState:'collective'});
    const saved=await store.getDoc(ref),published=await store.getDoc(store.doc(store.db,'posts',id));
    if(saved.data()?.importSnapshotId!==snapshot.snapshotId||published.data()?.importSnapshotId!==snapshot.snapshotId)throw Error('TikTok save verification failed');status.saved++;
   }catch(error){status.failed++;console.info('TikTok import deferred:',error.message)}
  }
  finished=status.failed===0;status.state=finished?'complete':'retry';
  window.dispatchEvent(new CustomEvent('biglwa:orbit-imported',{detail:{source:'tiktok',snapshot:true,...status}}));
 }catch(error){status.state='retry';status.message=error.message}
 finally{running=false}
}
window.BigLWATikTokImport={status,retry:run};
async function boot(){
 const [{getApps,initializeApp},{getAuth,onAuthStateChanged},db]=await Promise.all([import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'),import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js'),import('https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js')]);
 const app=getApps()[0]||initializeApp({apiKey:'AIzaSyAPUT8_pLNxdh5tbGpAmXBJiID3jVcA9DY',authDomain:'biglwa.firebaseapp.com',projectId:'biglwa',appId:'1:83232670555:web:e04927b20458390b3b507e'});
 store={...db,db:db.getFirestore(app),auth:getAuth(app)};onAuthStateChanged(store.auth,()=>run());
 window.addEventListener('biglwa:public-profile-ended',run);window.addEventListener('biglwa:session-verified',run);document.addEventListener('biglwa:module-open',run);
}
boot().catch(error=>{status.state='retry';status.message=error.message});
