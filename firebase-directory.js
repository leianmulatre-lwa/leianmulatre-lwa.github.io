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
  pinterest:["pinterest.com","www.pinterest.com"],
  x:["x.com","www.x.com","twitter.com","www.twitter.com"],
  snapchat:["snapchat.com","www.snapchat.com"],
  tumblr:["tumblr.com","www.tumblr.com"]
};

function localUsername(){
  let saved=null;
  // Unscoped old profile data must never become the current member's username.
  try{const uid=window.BigLWAAccountStorage?.uid||window.__biglwaIdentity?.uid; if(uid)saved=JSON.parse(localStorage.getItem("biglwaOwnProfileV1:"+uid)||"null")}catch{}
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
    const {doc,getDoc,setDoc,deleteDoc,deleteField,runTransaction,serverTimestamp}=await import("https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js");

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
      const privateMode=previous.accountVisibility==='private';
      tx.set(newRef,{
        accountVisibility:privateMode?'private':'public',
        username,
        usernameLower:username,
        name:clean(profile.name)||clean(user.displayName),
        uid:user.uid,
        url:"/"+encodeURIComponent(username),
        bio:privateMode?deleteField():clean(profile.bio),
        location:privateMode?deleteField():clean(profile.location),
        website:privateMode?deleteField():clean(profile.website),
        mood:privateMode?deleteField():clean(profile.mood),
        moodStyle:privateMode?deleteField():clean(profile.moodStyle),
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
  if(document.documentElement.classList.contains('biglwa-preview-mode')||window.__biglwaPublicStorageView)return false;
  try{
    const {db,auth}=await getFirebase();await auth.authStateReady();const user=auth.currentUser;if(!user)return false;
    const {doc,runTransaction,serverTimestamp}=await import("https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js");
    const ref=doc(db,'users',user.uid);
    const customization=await runTransaction(db,async tx=>{
      const snap=await tx.get(ref),existing=snap.data()?.customization||{},next={...existing};
      for(const key of ['appearance','wallpaper','layout','session'])if(custom[key]&&typeof custom[key]==='object')next[key]={...(existing[key]||{}),...custom[key]};
      tx.set(ref,{customization:next,updatedAt:serverTimestamp()},{merge:true});return next;
    });
    await savePublicLook(customization);return true;
  }catch(err){console.warn('[BIGLWA] Customization sync unavailable:',err);return false;}
}

/* Public projection of a member's look. Written into the already-public
 * usernames doc so signed-out visitors can render a studio preview without
 * ever reading the owner-only users doc. Settings only, never media. */
function sanitizeLayout(raw){
 const value=raw&&typeof raw==='object'?raw:{},order={};
 const cleanIds=items=>Array.isArray(items)?[...new Set(items.filter(x=>typeof x==='string'&&/^[A-Za-z0-9_-]{1,80}$/.test(x)))].slice(0,80):[];
 for(const key of ['heroWidgetRail','biglwaStudioMasonry'])if(value.order?.[key])order[key]=cleanIds(value.order[key]);
 return {order,docked:cleanIds(value.docked)};
}
/* The small, explicitly edited Highlight presentation may be mirrored publicly.
   Never publish authentication state, full source archives, or private drafts. */
function sanitizeHighlightEdits(raw){
  if(!raw||typeof raw!=="object")return {version:1,imported:{},custom:[]};
  const cover=value=>{
    const u=String(value||"").trim();
    if(/^data:image\/jpeg;base64,[A-Za-z0-9+/=]{1,36000}$/.test(u))return u;
    if(/^\/assets\/highlights\/[\w.-]{1,180}$/.test(u))return u;
    try{const x=new URL(u);return x.protocol==="https:"&&!x.username&&!x.password&&x.href.length<1300?x.href:""}catch{return ""}
  };
  const media=value=>{
    const u=cover(value);
    return u.startsWith("https://")?u:"";
  };
  const keep=entry=>({
    title:safeText(entry?.title,48),cover:cover(entry?.cover),
    x:Math.max(0,Math.min(100,Number(entry?.x)||50)),y:Math.max(0,Math.min(100,Number(entry?.y)||50)),
    hidden:!!entry?.hidden,
    order:Array.isArray(entry?.order)?[...new Set(entry.order.filter(i=>Number.isInteger(i)&&i>=0&&i<100))].slice(0,50):null,
    added:Array.isArray(entry?.added)?entry.added.slice(0,12).flatMap(item=>{
      const url=media(item?.mediaUrl);
      return url?[{kind:item.kind==="video"?"video":"image",mediaUrl:url}]:[];
    }):[]
  });
  const imported={};
  for(const [key,value] of Object.entries(raw.imported||{})){
    if(/^\d{1,2}$/.test(key)&&Number(key)<24)imported[key]=keep(value);
  }
  const custom=Array.isArray(raw.custom)?raw.custom.slice(0,8).map(value=>({
    ...keep(value),id:safeText(value?.id,70).replace(/[^\w-]/g,"")
  })):[];
  return {version:1,imported,custom};
}
async function savePublicLook(custom={}){
  try{
    const {db,auth}=await getFirebase();
    const user=auth.currentUser;
    if(!user)return false;
    const sdk=await import("https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js");
    const account=(await sdk.getDoc(sdk.doc(db,'users',user.uid))).data()||{};
    const username=normalize(account.usernameLower||account.username);
    if(!username)return false;
    const {doc,setDoc,serverTimestamp}=await import("https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js");
    const appearance=(custom&&typeof custom.appearance==="object"&&custom.appearance)||{};
    const wallpaper=(custom&&typeof custom.wallpaper==="object"&&custom.wallpaper)||{};
    const look={
      widgetColor:safeText(appearance.color,32),
      widgetRadius:safeNumber(appearance.radius,16),
      widgetOpacity:safeNumber(appearance.opacity,100),
      widgetBlur:safeNumber(appearance.blur,0),
      auraColor:safeText(appearance.aura,32),
      layout:account.accountVisibility==='private'?{}:sanitizeLayout(custom.layout),
      highlights:account.accountVisibility==='private'?{version:1,imported:{},custom:[]}:sanitizeHighlightEdits(custom.session?.highlightEdits),
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
    const host=parsed.hostname.toLowerCase();
    if(!SOCIAL_HOSTS[id].includes(host)&&!((id==='tumblr'&&host.endsWith('.tumblr.com'))||(id==='snapchat'&&host.endsWith('.snapchat.com'))))return [];
    if(['x','snapchat','tumblr'].includes(id)&&(!parsed.pathname||parsed.pathname==='/'))return [];
    return [{
      id,
      label:safeText(entry.label,32)||id,
      handle:safeText(entry.handle,64),
      url:parsed.href
    }];
  }).slice(0,8);
}

/* The only journal publication endpoint: explicit owner action, private by
 * default. Never mirror local screenplay/Sqwip or Sqwib Note content here. */
async function publishJournal(rawText,viewable){
  const {db,auth}=await getFirebase();
  await auth.authStateReady();
  const user=auth.currentUser;
  if(!user)throw new Error('Sign in before changing Journal visibility.');
  const username=localUsername();
  if(!username)throw new Error('Save a username to share your Journal.');
  const ownerSnap=await (await import("https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js")).getDoc(
    (await import("https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js")).doc(db,'users',user.uid));
  if(viewable&&ownerSnap.data()?.accountVisibility==='private')throw new Error('Turn off Private Account before making Journal public.');
  const text=String(rawText||'').trim();
  if(viewable&&!text)throw new Error('Write a Journal entry before sharing it.');
  if(text.length>12000)throw new Error('Public Journal exceeds 12,000 characters.');
  const {doc,setDoc,getDoc,deleteField,serverTimestamp}=await import("https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js");
  const profileRef=doc(db,'usernames',username);
  const existing=await getDoc(profileRef);
  if(!existing.exists()||existing.data()?.uid!==user.uid)
   throw new Error('Your public username could not be verified. Save profile details and retry.');
  await setDoc(profileRef,{journalVisibility:viewable?'public':'private',
    publicJournal:viewable?text:deleteField(),updatedAt:serverTimestamp()},{merge:true});
  return {viewable:!!viewable,username,text:viewable?text:''};
}

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
      uid:clean(data.uid),
      accountVisibility:data.accountVisibility==='private'?'private':'public',
      username:clean(data.username)||username,
      name:clean(data.name),
      bio:clean(data.bio),
      location:clean(data.location),
      website:clean(data.website),
      mood:clean(data.mood),
      moodStyle:clean(data.moodStyle),
      auraText:clean(data.auraText),
      profilePhotoUrl:/^https:\/\/biglwa-instagram-api\.leianmulatre-284\.workers\.dev\/media\/profile-photo\//.test(String(data.profilePhotoUrl||''))?String(data.profilePhotoUrl):'',
      publicStats:data.accountVisibility==='private'?null:(data.publicStats&&typeof data.publicStats==='object'?{
        followers:Number.isFinite(data.publicStats.followers)&&data.publicStats.followers>=0?data.publicStats.followers:null,
        likes:Number.isFinite(data.publicStats.likes)&&data.publicStats.likes>=0?data.publicStats.likes:null,
        reach:Number.isFinite(data.publicStats.reach)&&data.publicStats.reach>=0?data.publicStats.reach:null,
        connections:Number.isFinite(data.publicStats.connections)&&data.publicStats.connections>=0?data.publicStats.connections:null,
        realRank:safeText(data.publicStats.realRank,48)||'Chopped',
        observedAt:safeText(data.publicStats.observedAt,40)
      }:null),
      url:clean(data.url)||("/"+encodeURIComponent(username)),
      socials:readSocials(data.socials),
      archiveVisibility:data.archiveVisibility==='friends'?'friends':'private',
      journalVisibility:data.journalVisibility==='public'?'public':'private',
      publicJournal:data.journalVisibility==='public'?String(data.publicJournal||'').slice(0,12000):'',
      look:look?{
        layout:data.accountVisibility==='private'?{}:sanitizeLayout(look.layout),
        highlights:data.accountVisibility==='private'?{version:1,imported:{},custom:[]}:sanitizeHighlightEdits(look.highlights),
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
      uid:user.uid,
      profile:{
        name:clean(data.name),
        username:clean(data.usernameLower||data.username),
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
    throw err;
  }
}

async function downloadAccountToDevice(){
  window.__biglwaAccountHydrated=false;
  try{
    const {auth}=await getFirebase();
    if(!auth.currentUser){window.__biglwaAccountHydrated=false;window.__biglwaRemoteCustomization=null;return false;}
    const owner=auth.currentUser.uid;
    const remote=await loadProfile();
    if(auth.currentUser?.uid!==owner)return false;
    if(remote&&typeof remote==="object"&&remote.uid===owner){
      window.__biglwaRemoteCustomization=remote;
      window.dispatchEvent(new CustomEvent("biglwa:customization-remote",{detail:remote}));
    }
    window.__biglwaAccountHydrated=true;
    if(remote?.uid===owner&&!window.__biglwaPublicStorageView&&auth.currentUser?.uid===owner)await savePublicLook(remote.customization);
    return !!remote;
  }catch(err){
    console.warn("[BIGLWA] Account download skipped:",err);
    window.__biglwaAccountHydrated=false;
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
      endAt(q+"\uf8ff"),
      limit(8)
    ));
    return snap.docs.map(d=>{
      const x=d.data()||{};
      return {username:x.username||d.id,name:x.name||"",url:x.url||("/"+encodeURIComponent(x.username||d.id)),bio:x.accountVisibility==='private'?'':x.bio||"",location:x.accountVisibility==='private'?'':x.location||"",website:x.accountVisibility==='private'?'':x.website||"",mood:x.accountVisibility==='private'?'':x.mood||"",moodStyle:x.accountVisibility==='private'?'':x.moodStyle||""};
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
    // Do not auto-publish another user's legacy device profile.
    try{const uid=window.BigLWAAccountStorage?.uid||window.__biglwaIdentity?.uid;if(uid===user.uid)saved=JSON.parse(localStorage.getItem("biglwaOwnProfileV1:"+uid)||"null")}catch{}
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

async function loadArchiveForUsername(rawUsername){
  const username=normalize(rawUsername);
  if(!validUsername(username))return [];
  try{
    const {db}=await getFirebase();
    const {doc,getDoc,collection,getDocs,query,where}=await import("https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js");
    const directorySnap=await getDoc(doc(db,"usernames",username));
    if(!directorySnap.exists())return [];
    const uid=clean(directorySnap.data()?.uid);
    if(!uid)return [];
    const ref=collection(db,"users",uid,"archive");
    const {auth}=await getFirebase();await auth.authStateReady();
    let snap;
    if(auth.currentUser?.uid===uid)snap=await getDocs(ref);
    else{
      try{snap=await getDocs(ref)}catch{snap=await getDocs(query(ref,where('state','==','approved')))}
    }
    return snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(b.sourceCreatedAt||"").localeCompare(String(a.sourceCreatedAt||"")));
  }catch(err){
    console.warn("[BIGLWA] Archive unavailable:",err);
    return [];
  }
}

// Private analytics and people added. These fields are never copied to usernames.
async function ownAccountContext(){
 const {db,auth}=await getFirebase();await auth.authStateReady();
 const owner=auth.currentUser?.uid;if(!owner)throw Error('Sign in to manage your connections.');
 const fire=await import('https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js');
 return {db,auth,owner,fire,ref:fire.doc(db,'users',owner)};
}
async function getAccountOverview(){
 const c=await ownAccountContext(),snapshot=await c.fire.getDoc(c.ref);
 if(c.auth.currentUser?.uid!==c.owner)throw Error('Account changed. Try again.');
 const data=snapshot.data()||{};
 return {uid:c.owner,peopleConnections:data.peopleConnections||{},analyticsMonths:data.analyticsMonths||{},connections:data.connections||{},orbitConnectedProfiles:data.orbitConnectedProfiles||{},realRank:data.realRank||null};
}
async function addPerson(username){
 const c=await ownAccountContext(),name=normalize(username);
 if(!/^[a-z0-9._-]{1,30}$/.test(name))throw Error('Invalid username.');
 const target=await c.fire.getDoc(c.fire.doc(c.db,'usernames',name)),person=target.data();
 if(!target.exists()||!person?.uid)throw Error('This account could not be found.');
 if(person.uid===c.owner)throw Error('This is your own account.');
 if(c.auth.currentUser?.uid!==c.owner)throw Error('Account changed. Try again.');
 await c.fire.setDoc(c.ref,{peopleConnections:{[person.uid]:{uid:person.uid,username:person.username||name,name:String(person.name||'').slice(0,100),addedAt:new Date().toISOString()}}},{merge:true});
 return getAccountOverview();
}
async function recordAnalyticsMonth(month,snapshot){
 if(!/^\d{4}-\d{2}$/.test(month))throw Error('Invalid analytics month.');
 const c=await ownAccountContext();
 const sources=(snapshot.sources||[]).slice(0,12).map(s=>({id:String(s.id).slice(0,24),handle:String(s.handle||'').slice(0,80),followers:Number.isFinite(s.followers)&&s.followers>=0?s.followers:null,likes:Number.isFinite(s.likes)&&s.likes>=0?s.likes:null,lastCheckedAt:String(s.lastCheckedAt||'').slice(0,40),reach:s.reach?.month===month&&s.reach?.metric==='reach'&&Number.isFinite(s.reach.value)&&s.reach.value>=0?{month,metric:'reach',value:s.reach.value}:null}));
 const data={sources,connections:Math.max(0,Number(snapshot.connections)||0),observedAt:new Date().toISOString()};
 await c.fire.setDoc(c.ref,{analyticsMonths:{[month]:data}},{merge:true});
 return data;
}

window.BigLWAUserDirectory={getAccountOverview,addPerson,recordAnalyticsMonth,saveProfile,searchUsers,syncAccountProfile,saveCustomizations,loadProfile,loadPublicProfile,loadArchiveForUsername,publishJournal};

(async()=>{
  try{
    const {auth}=await getFirebase();
    const {onAuthStateChanged}=await import("https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js");
    onAuthStateChanged(auth,()=>setTimeout(async()=>{
      try{await downloadAccountToDevice()}catch(error){console.warn('Account restore failed:',error)}
    },0));
  }catch(err){
    console.warn("[BIGLWA] Firebase auth bridge unavailable:",err);
  }
  window.dispatchEvent(new CustomEvent("biglwa:user-directory-ready"));
})();