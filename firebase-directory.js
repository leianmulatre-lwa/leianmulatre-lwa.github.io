/* BIGLWA shared username directory
 * Firebase web config is public client configuration; access is controlled by Firebase Security Rules.
 */
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAPUT8_pLNxdh5tbGpAmXBJiID3jVcA9DY",
  authDomain: "biglwa.firebaseapp.com",
  projectId: "biglwa",
  appId: "1:83232670555:web:e04927b20458390b3b507e"
};

let dbPromise;
async function getDb(){
  if(!dbPromise){
    dbPromise=(async()=>{
      const [{initializeApp,getApps},{getFirestore}]=await Promise.all([
        import("https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js"),
        import("https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js")
      ]);
      const app=getApps()[0]||initializeApp(FIREBASE_CONFIG);
      return getFirestore(app);
    })();
  }
  return dbPromise;
}
const normalize=v=>String(v||"").trim().replace(/^@/,"").toLowerCase();
const clean=v=>String(v||"").trim();

export async function saveProfile(profile){
  const username=normalize(profile?.username);
  if(!username)return false;
  try{
    const [{collection,doc,setDoc,serverTimestamp},{getApps},{getAuth}]=await Promise.all([
      import("https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js"),
      import("https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js")
    ]);
    const db=await getDb();
    const app=getApps()[0];
    const user=getAuth(app).currentUser;
    if(!user)return false;
    await setDoc(doc(collection(db,"usernames"),username),{
      username,
      usernameLower:username,
      name:clean(profile.name),
      uid:user.uid,
      url:"/"+encodeURIComponent(username),
      updatedAt:serverTimestamp()
    },{merge:true});
    return true;
  }catch(err){
    console.warn("[BIGLWA] Firebase username save unavailable:",err);
    return false;
  }
}

export async function searchUsers(rawQuery){
  const q=normalize(rawQuery);
  if(!q)return [];
  try{
    const [{collection,query,orderBy,startAt,endAt,limit,getDocs}]=await Promise.all([
      import("https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js")
    ]);
    const db=await getDb();
    const snap=await getDocs(query(
      collection(db,"usernames"),
      orderBy("usernameLower"),
      startAt(q),
      endAt(q+"\\uf8ff"),
      limit(8)
    ));
    return snap.docs.map(d=>{
      const x=d.data()||{};
      return {username:x.username||d.id,name:x.name||"",url:x.url||("/"+encodeURIComponent(x.username||d.id))};
    });
  }catch(err){
    console.warn("[BIGLWA] Firebase username search unavailable:",err);
    return [];
  }
}

window.BigLWAUserDirectory={saveProfile,searchUsers};
window.dispatchEvent(new CustomEvent("biglwa:user-directory-ready"));
