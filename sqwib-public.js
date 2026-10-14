/* BIG LWA Sqwibs: explicit public publication, author-controlled resqwib permission.
 * Local Sqwib drafts in the editor remain private and are NEVER read by this module. */
(()=>{
  if(window.BigLWASqwibs)return;
  const CDN='https://www.gstatic.com/firebasejs/12.18.0/';
  let modules;
  async function api(){
    if(!modules)modules=Promise.all([
      import(CDN+'firebase-app.js'),import(CDN+'firebase-auth.js'),import(CDN+'firebase-firestore.js')
    ]).then(([apps,auth,db])=>{
      const app=apps.getApps()[0];if(!app)throw Error('Sign in to your BIG LWA account first.');
      return {auth:auth.getAuth(app),db:db.getFirestore(app),...db};
    }).catch(e=>{modules=null;throw e});
    const f=await modules;await f.auth.authStateReady();return f;
  }
  const text=v=>String(v||'').trim();
  const ts=v=>v?.toMillis?.()||Date.parse(v||'')||0;
  const uid=f=>f.auth.currentUser?.uid||'';
  const needUser=f=>{const id=uid(f);if(!id)throw Error('Sign in to Big LWA before publishing or resqwibing.');return id};
  const normalize=(d)=>({id:d.id,...d.data()});
  async function publicSqwibs(max=70){
    const f=await api();
    const q=f.query(f.collection(f.db,'sqwibs'),f.where('visibility','==','public'),f.limit(Math.min(90,Math.max(1,max))));
    const snap=await f.getDocs(q);
    return snap.docs.map(normalize).filter(p=>p.visibility==='public'&&p.text&&p.uid).sort((a,b)=>ts(b.createdAt)-ts(a.createdAt));
  }
  async function mySqwibs(){
    const f=await api(),me=needUser(f);
    const snap=await f.getDocs(f.query(f.collection(f.db,'sqwibs'),f.where('uid','==',me),f.limit(80)));
    return snap.docs.map(normalize).sort((a,b)=>ts(b.createdAt)-ts(a.createdAt));
  }
  async function publish(value,allowResqwib=false){
    const f=await api(),me=needUser(f),writing=text(value);
    if(writing.length<1||writing.length>1200)throw Error('Sqwibs must contain 1–1,200 characters.');
    const ref=await f.addDoc(f.collection(f.db,'sqwibs'),{
      uid:me,text:writing,visibility:'public',allowResqwib:allowResqwib===true,
      createdAt:f.serverTimestamp(),updatedAt:f.serverTimestamp()
    });
    document.dispatchEvent(new CustomEvent('biglwa:sqwib-published',{detail:{id:ref.id}}));
    return ref.id;
  }
  async function updateOwn(id,changes){
    const f=await api(),me=needUser(f),ref=f.doc(f.db,'sqwibs',String(id));
    const before=await f.getDoc(ref);if(!before.exists()||before.data().uid!==me)throw Error('Only the author can change this Sqwib.');
    await f.updateDoc(ref,{...changes,updatedAt:f.serverTimestamp()});
    document.dispatchEvent(new CustomEvent('biglwa:sqwib-published',{detail:{id}}));
  }
  async function unpublish(id){return updateOwn(id,{visibility:'private',allowResqwib:false})}
  async function permission(id,allowed){return updateOwn(id,{allowResqwib:allowed===true})}
  async function publicResqwibs(){
    const f=await api();
    const snap=await f.getDocs(f.query(f.collection(f.db,'sqwibReshares'),f.limit(160)));
    return snap.docs.map(normalize).filter(x=>x.uid&&x.sourceId);
  }
  async function resqwib(id){
    const f=await api(),me=needUser(f),sourceId=String(id||'');
    if(!/^[A-Za-z0-9_-]{2,120}$/.test(sourceId))throw Error('Invalid Sqwib.');
    const original=await f.getDoc(f.doc(f.db,'sqwibs',sourceId));
    if(!original.exists()||original.data().visibility!=='public'||original.data().allowResqwib!==true)
      throw Error('The author has not permitted this Sqwib to be reposted.');
    if(original.data().uid===me)throw Error('Your own Sqwib is already yours.');
    await f.setDoc(f.doc(f.db,'sqwibReshares',me+'_'+sourceId),{
      uid:me,sourceId,createdAt:f.serverTimestamp()
    });
    document.dispatchEvent(new CustomEvent('biglwa:sqwib-reshared',{detail:{sourceId}}));
  }
  async function undoResqwib(id){
    const f=await api(),me=needUser(f),sourceId=String(id||'');
    await f.deleteDoc(f.doc(f.db,'sqwibReshares',me+'_'+sourceId));
    document.dispatchEvent(new CustomEvent('biglwa:sqwib-reshared',{detail:{sourceId}}));
  }
  async function currentUser(){try{const f=await api();return uid(f)}catch{return ''}}
  window.BigLWASqwibs=Object.freeze({publicSqwibs,mySqwibs,publish,permission,unpublish,resqwib,undoResqwib,publicResqwibs,currentUser});
})();
