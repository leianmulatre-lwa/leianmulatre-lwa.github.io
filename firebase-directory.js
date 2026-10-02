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
const safeNumber=(v,fallback=0)=>{const n=Number(v);return Number.isFinite(n)?n:fallback};
const safeText=(v,max=64)=>clean(v).slice(0,max);

/* Which hosts a public social link is allowed to point at. A visitor clicking a link on
   someone else's profile is leaving the site, so the address has to be one we recognise
   rather than whatever string ended up in the document. */
const SOCIAL_HOSTS={
  instagram:["instagram.com","www.instagram.com"],
  tiktok:["tiktok.com","www.tiktok.com"],
  pinterest:["pinterest.com","www.pinterest.com"]
};

function localUsername(){
  let saved=null;
  try{saved=JSON.parse(localStorage.getItem("biglwaProfileDetails")||"null")}catch{}
  const username=clean(document.getElementById("loginUsername")?.value)||clean(saved?.username);
  return validUsername(username)?normalize(username):"";
}

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
        bio:clean(profile.bio),
        location:clean(profile.location),
        website:clean(profile.website),
        mood:clean(profile.mood),
        moodStyle:clean(profile.moodStyle),
        auraText:clean(profile.auraText),
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

async function saveCustomizations(custom={}){
  try{
    const {db,auth}=await getFirebase();
    const user=auth.currentUser;
    if(!user)return false;
    const {doc,getDoc,setDoc,serverTimestamp}=await import("https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js");
    const ref=doc(db,"users",user.uid);
    const snap=await getDoc(ref);
    const existing=snap.exists()&&snap.data()?.customization&&typeof snap.data().customization==="object"?snap.data().customization:{};
    const {appearance,wallpaper,layout,session}=custom||{};
    const customization={
      appearance:appearance&&typeof appearance==="object"?{...(existing.appearance||{}),...appearance}:(existing.appearance||{}),
      wallpaper:wallpaper&&typeof wallpaper==="object"?{...(existing.wallpaper||{}),...wallpaper}:(existing.wallpaper||{}),
      layout:layout&&typeof layout==="object"?{...(existing.layout||{}),...layout}:(existing.layout||{}),
      session:session&&typeof session==="object"?{...(existing.session||{}),...session}:(existing.session||{})
    };
    await setDoc(ref,{customization,updatedAt:serverTimestamp()},{merge:true});
    await savePublicLook({appearance,wallpaper});
    return true;
  }catch(err){
    console.warn("[BIGLWA] Customization sync unavailable:",err);
    return false;
  }
}

/* Public projection of a member's look. Written into the already-public
 * usernames doc so signed-out visitors can render a studio preview without
 * ever reading the owner-only users doc. Settings only, never media. */
async function savePublicLook(custom={}){
  try{
    const {db,auth}=await getFirebase();
    const user=auth.currentUser;
    const username=localUsername();
    if(!user||!username)return false;
    const {doc,setDoc,serverTimestamp}=await import("https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js");
    const appearance=(custom&&typeof custom.appearance==="object"&&custom.appearance)||{};
    const wallpaper=(custom&&typeof custom.wallpaper==="object"&&custom.wallpaper)||{};
    const look={
      widgetColor:safeText(appearance.color,32),
      widgetRadius:safeNumber(appearance.radius,16),
      widgetOpacity:safeNumber(appearance.opacity,100),
      widgetBlur:safeNumber(appearance.blur,0),
      auraColor:safeText(appearance.aura,32),
      wallpaper:{
        fit:safeText(wallpaper.fit,16),
        blur:safeNumber(wallpaper.blur,0),
        overlay:safeNumber(wallpaper.overlay,0)
      }
    };
    /* Record the username on the owner-only account doc first: that binding is what the
       security rules trust, and writing it repairs a public profile whose uid is stale. */
    await setDoc(doc(db,"users",user.uid),{usernameLower:username.toLowerCase(),updatedAt:serverTimestamp()},{merge:true});
    await setDoc(doc(db,"usernames",username),{uid:user.uid,look,updatedAt:serverTimestamp()},{merge:true});
    return true;
  }catch(err){
    console.warn("[BIGLWA] Public look mirror unavailable:",err);
    return false;
  }
}

/* The social links are written by the connection mirror, but a public document is not
 * trusted just because it is readable: a link is only kept if it is https and on the
 * provider's own host. Anything else is dropped here as well as on the way in, so a
 * hand-edited document still cannot put an arbitrary address in front of a visitor. */
function readSocials(raw){
  if(!raw||typeof raw!=="object")return [];
  return Object.entries(raw).flatMap(([id,entry])=>{
    if(!entry||typeof entry!=="object")return [];
    const url=safeText(entry.url,300);
    if(!url||!SOCIAL_HOSTS[id])return [];
    let parsed;
    try{parsed=new URL(url)}catch{return []}
    if(parsed.protocol!=="https:")return [];
    if(!SOCIAL_HOSTS[id].includes(parsed.hostname.toLowerCase()))return [];
    return [{
      id,
      label:safeText(entry.label,32)||id,
      handle:safeText(entry.handle,64),
      url:parsed.href
    }];
  }).slice(0,8);
}

/* Signed-out safe: usernames docs are world readable by Firestore rules. */
async function loadPublicProfile(rawUsername){
  const username=normalize(rawUsername);
  if(!validUsername(username))return null;
  try{
    const {db}=await getFirebase();
    const {doc,getDoc}=await import("https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js");
    const snap=await getDoc(doc(db,"usernames",username));
    if(!snap.exists())return null;
    const data=snap.data()||{};
    const look=data.look&&typeof data.look==="object"?data.look:null;
    return {
      username:clean(data.username)||username,
      name:clean(data.name),
      bio:clean(data.bio),
      location:clean(data.location),
      website:clean(data.website),
      mood:clean(data.mood),
      moodStyle:clean(data.moodStyle),
      auraText:clean(data.auraText),
      url:clean(data.url)||("/"+encodeURIComponent(username)),
      socials:readSocials(data.socials),
      look:look?{
        appearance:{
          widgetColor:clean(look.widgetColor),
          widgetRadius:safeNumber(look.widgetRadius,0),
          widgetOpacity:safeNumber(look.widgetOpacity,100),
          widgetBlur:safeNumber(look.widgetBlur,0),
          auraColor:clean(look.auraColor)
        },
        wallpaper:{
          fit:clean(look.wallpaper&&look.wallpaper.fit),
          blur:safeNumber(look.wallpaper&&look.wallpaper.blur,0),
          overlay:safeNumber(look.wallpaper&&look.wallpaper.overlay,0)
        },
        /* Only an approved wallpaper is ever mirrored here, so a signed-out visitor can
           render it while held or rejected media stays invisible. */
        wallpaperMedia:(()=>{
          const media=look.wallpaperMedia;
          if(!media||typeof media!=="object")return null;
          const url=clean(media.url);
          if(!url||clean(media.state)!=="approved")return null;
          if(!/^https:\/\/biglwa-instagram-api\.leianmulatre-284\.workers\.dev\/media\/wallpaper\//.test(url))return null;
          return {url,kind:clean(media.kind)==="video"?"video":"image"};
        })()
      }:null
    };
  }catch(err){
    console.warn("[BIGLWA] Public profile unavailable:",err);
    return null;
  }
}

async function loadProfile(){
  try{
    const {db,auth}=await getFirebase();
    const user=auth.currentUser;
    if(!user)return null;
    const {doc,getDoc}=await import("https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js");
    const snap=await getDoc(doc(db,"users",user.uid));
    if(!snap.exists())return null;
    const data=snap.data()||{};
    return {
      profile:{
        name:clean(data.name),
        username:clean(data.username),
        bio:clean(data.bio),
        location:clean(data.location),
        website:clean(data.website),
        mood:clean(data.mood),
        moodStyle:clean(data.moodStyle),
        auraText:clean(data.auraText)
      },
      customization:(data.customization&&typeof data.customization==="object")?data.customization:{},
      updatedAt:data.updatedAt||null
    };
  }catch(err){
    console.warn("[BIGLWA] Profile download unavailable:",err);
    return null;
  }
}

async function downloadAccountToDevice(){
  window.__biglwaAccountHydrated=false;
  try{
    const {auth}=await getFirebase();
    if(!auth.currentUser){window.__biglwaAccountHydrated=false;return false;}
    const remote=await loadProfile();
    if(remote&&typeof remote==="object"){
      window.__biglwaRemoteCustomization=remote;
      window.dispatchEvent(new CustomEvent("biglwa:customization-remote",{detail:remote}));
    }
    window.__biglwaAccountHydrated=true;
    return !!remote;
  }catch(err){
    console.warn("[BIGLWA] Account download skipped:",err);
    window.__biglwaAccountHydrated=true;
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
      return {username:x.username||d.id,name:x.name||"",url:x.url||("/"+encodeURIComponent(x.username||d.id)),bio:x.bio||"",location:x.location||"",website:x.website||"",mood:x.mood||"",moodStyle:x.moodStyle||""};
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

window.BigLWAUserDirectory={saveProfile,searchUsers,syncAccountProfile,saveCustomizations,loadProfile,loadPublicProfile};

(async()=>{
  try{
    const {auth}=await getFirebase();
    const {onAuthStateChanged}=await import("https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js");
    onAuthStateChanged(auth,()=>setTimeout(async()=>{
      await autoSyncSignedInAccount();
      await downloadAccountToDevice();
    },0));
  }catch(err){
    console.warn("[BIGLWA] Firebase auth bridge unavailable:",err);
  }
  window.dispatchEvent(new CustomEvent("biglwa:user-directory-ready"));
})();