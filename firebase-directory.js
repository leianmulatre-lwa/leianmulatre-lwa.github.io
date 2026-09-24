/* BIGLWA shared account + username directory
 * Firebase Authentication owns sign-in credentials. Firestore owns the member profile
 * and username directory so account data can live in one cloud-backed place.
 */
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAPUT8_pLNxdh5tbGpAmXBJiID3jVcA9DY",
  authDomain: "biglwa.firebaseapp.com",
  projectId: "biglwa",
  appId: "1:83232670555:web:e04927b20458390b3b507e"
};

let dbPromise;
let authPromise;

async function getFirebase(){
  if(!authPromise || !dbPromise){
    const [{initializeApp,getApps},{getFirestore},{getAuth,onAuthStateChanged}]=await Promise.all([
      import("https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js"),
      import("https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js")
    ]);
    const app=getApps()[0]||initializeApp(FIREBASE_CONFIG);
    dbPromise=Promise.resolve(getFirestore(app));
    authPromise=Promise.resolve(getAuth(app));
  }
  return {db:await dbPromise,auth:await authPromise};
}

const normalize=v=>String(v||"").trim().replace(/^@/,"").toLowerCase();
const clean=v=>String(v||"").trim();

function validUsername(value){
  const username=normalize(value);
  return username.length>=5 && username.length<=24 && /^[a-z0-9._-]+$/.test(username);
}

async function claimUsername(username,user){
  const {db}=await getFirebase();
  const {doc,getDoc,runTransaction,serverTimestamp}=await import("https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js");
  const ref=doc(db,"usernames",username);
  return runTransaction(db,async tx=>{
    const existing=await tx.get(ref);
    if(existing.exists() && existing.data()?.uid!==user.uid){
      throw new Error("That username is already taken.");
    }
    tx.set(ref,{
      username,
      usernameLower:username,
      uid:user.uid,
      name:clean(user.displayName),
      url:"/"+encodeURIComponent(username),
      updatedAt:serverTimestamp()
    },{merge:true});
    return true;
  });
}

async function syncAccountProfile(profile={},options={}){
  const username=normalize(profile.username);
  if(!username || !validUsername(username)) return false;
  try{
    const {db,auth}=await getFirebase();
    const user=auth.currentUser;
    if(!user)return false;
    const {doc,getDoc,setDoc,deleteDoc,runTransaction,serverTimestamp}=await import("https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js");

    const userRef=doc(db,"users",user.uid);
    const previousSnap=await getDoc(userRef);
    const previous=previousSnap.exists()?previousSnap.data():{};
    const previousUsername=normalize(previous.username);

    await runTransaction(db,async tx=>{
      const newRef=doc(db,"usernames",username);
      const existing=await tx.get(newRef);
      if(existing.exists() && existing.data()?.uid!==user.uid){
        throw new Error("That username is already taken.");
      }
      tx.set(newRef,{
        username,
        usernameLower:username,
        name:clean(profile.name)||clean(user.displayName),
        uid:user.uid,
        url:"/"+encodeURIComponent(username),
        updatedAt:serverTimestamp()
      },{merge:true});
      tx.set(userRef,{
        uid:user.uid,
        email:user.email||"",
        name:clean(profile.name)||clean(user.displayName),
        username,
        bio:clean(profile.bio),
        location:clean(profile.location),
        website:clean(profile.website),
        mood:clean(profile.mood),
        moodStyle:clean(profile.moodStyle),
        auraText:clean(profile.auraText),
        updatedAt:serverTimestamp()
      },{merge:true});
      if(previousUsername && previousUsername!==username){
        const oldRef=doc(db,"usernames",previousUsername);
        const old=await tx.get(oldRef);
        if(old.exists() && old.data()?.uid===user.uid) tx.delete(oldRef);
      }
    });
    return true;
  }catch(err){
    console.warn("[BIGLWA] Firebase account sync unavailable:",err);
    if(options.throwErrors) throw err;
    return false;
  }
}

export async function saveProfile(profile){
  return syncAccountProfile(profile,{throwErrors:false});
}

export async function searchUsers(rawQuery){
  const q=normalize(rawQuery);
  if(!q)return [];
  try{
    const [{collection,query,orderBy,startAt,endAt,limit,getDocs}]=await Promise.all([
      import("https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js")
    ]);
    const {db}=await getFirebase();
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

async function autoSyncSignedInAccount(){
  try{
    const {auth}=await getFirebase();
    const user=auth.currentUser;
    if(!user)return;
    const loginUsername=document.getElementById("loginUsername");
    let saved=null;
    try{saved=JSON.parse(localStorage.getItem("biglwaProfileDetails")||"null")}catch{}
    const username=clean(loginUsername?.value)||clean(saved?.username);
    if(!validUsername(username))return;
    await syncAccountProfile({
      username,
      name:clean(saved?.name)||clean(user.displayName),
      bio:saved?.bio,
      location:saved?.location,
      website:saved?.website,
      mood:saved?.mood,
      moodStyle:saved?.moodStyle,
      auraText:saved?.auraText
    });
  }catch(err){
    console.warn("[BIGLWA] Automatic account sync skipped:",err);
  }
}

window.BigLWAUserDirectory={saveProfile,searchUsers,syncAccountProfile};

(async()=>{
  try{
    const {auth}=await getFirebase();
    const {onAuthStateChanged}=await import("https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js");
    onAuthStateChanged(auth,()=>setTimeout(autoSyncSignedInAccount,0));
  }catch(err){
    console.warn("[BIGLWA] Firebase auth bridge unavailable:",err);
  }
  window.dispatchEvent(new CustomEvent("biglwa:user-directory-ready"));
})();