/* BIGLWA profile photo
 * Uploads a member's picture through the media Worker into R2, keeps the private copy on
 * the owner-only account doc, and mirrors just the URL into the public profile entry so a
 * visitor rendering a studio preview can show the picture without reading private data.
 */
import { identity, patchIdentity } from "./account-identity.js";
import { renderAvatar } from "./account-chrome.js?v=20261026-journal-cover-init-1";

const WORKER = "https://biglwa-instagram-api.leianmulatre-284.workers.dev";
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 8 * 1024 * 1024;

const clean = (v) => String(v || "").trim();
const clamp = v => Math.min(100,Math.max(0,Number.isFinite(Number(v))?Number(v):50));
const normalizePosition = value => ({x:clamp(value?.x),y:clamp(value?.y)});
const PHOTO_DEFAULT_POSITION = {x:50,y:50};
export function applyProfilePhotoPosition(position) {
  const {x,y}=normalizePosition(position);
  const value=x.toFixed(1)+'% '+y.toFixed(1)+'%';
  document.querySelectorAll('#studioApp .mini-avatar, #studioApp .profile-avatar, #studioApp .biglwa-photo-preview, #studioApp .highlight-profile-photo-preview').forEach(el=>{
    el.style.backgroundPosition=value;
    const img=el.matches('img')?el:el.querySelector('img');
    if(img)img.style.objectPosition=value;
  });
  return value;
}

let firebaseRefs;
async function firebase() {
  if (!firebaseRefs) {
    const [{ initializeApp, getApps }, { getFirestore, doc, getDoc, setDoc, serverTimestamp }, { getAuth }] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js"),
      import("https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js")
    ]);
    const app = getApps()[0] || initializeApp({
      apiKey: "AIzaSyAPUT8_pLNxdh5tbGpAmXBJiID3jVcA9DY",
      authDomain: "biglwa.firebaseapp.com",
      projectId: "biglwa",
      appId: "1:83232670555:web:e04927b20458390b3b507e"
    });
    firebaseRefs = { db: getFirestore(app), auth: getAuth(app), doc, getDoc, setDoc, serverTimestamp };
  }
  return firebaseRefs;
}

export function validatePhoto(file) {
  if (!file) throw new Error("Choose an image first.");
  if (!PHOTO_TYPES.includes(clean(file.type).toLowerCase())) throw new Error("Profile photos need to be a JPG, PNG, WebP, or GIF.");
  if (file.size > MAX_BYTES) throw new Error("That photo is larger than the 8 MB limit.");
  return true;
}

async function authHeaders() {
  const { auth } = await firebase();
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in to change your profile photo.");
  return { token: await user.getIdToken(), user };
}

export async function uploadProfilePhoto(file) {
  validatePhoto(file);
  const { token } = await authHeaders();
  const headers = { Authorization: "Bearer " + token };
  headers["Content-Type"] = file.type;
  const response = await fetch(WORKER + "/media/profile-photo", {
    method: "POST",
    headers,
    body: file
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    /* A bare 404 means the Worker predates this route, which is a deploy gap rather
       than anything wrong with the picture, so say so instead of echoing "Not found". */
    if (response.status === 404) throw new Error("Photo storage is not deployed yet. Please try again later.");
    throw new Error(payload.error || "That photo could not be uploaded.");
  }
  await persistPhoto(payload);
  return payload;
}

async function durablePhoto(values){
 const {token}=await authHeaders();const response=await fetch(WORKER+'/media/profile-state',{method:values?'POST':'GET',headers:{Authorization:'Bearer '+token,...(values?{'Content-Type':'application/json'}:{})},...(values?{body:JSON.stringify(values)}:{})});const data=await response.json();if(!response.ok)throw Error(data.error||'Account photo could not be saved.');return data;
}
async function persistPhoto(media) {
  const { db, user, doc, setDoc, serverTimestamp } = { ...(await firebase()), ...(await authHeaders()) };
  const record = {
    key: media.key, url: media.url, contentType: media.contentType,
    size: media.size, state: "approved", updatedAt: serverTimestamp()
  };
  await durablePhoto({profilePhotoUrl:media.url,profilePhotoPosition:PHOTO_DEFAULT_POSITION});
  const username=identity()?.username;
  void setDoc(doc(db,"users",user.uid),{profilePhoto:record,profilePhotoPosition:PHOTO_DEFAULT_POSITION,updatedAt:serverTimestamp()},{merge:true})
   .then(()=>username?setDoc(doc(db,"usernames",username),{profilePhotoUrl:media.url,profilePhotoPosition:PHOTO_DEFAULT_POSITION,updatedAt:serverTimestamp()},{merge:true}):null)
   .catch(error=>console.warn('[BIGLWA] Legacy photo mirror deferred:',error.message));
  patchIdentity({ avatarUrl: media.url });
  paint(media.url,PHOTO_DEFAULT_POSITION);
  return record;
}

export async function removeProfilePhoto() {
  const { db, user, doc, getDoc, setDoc, serverTimestamp } = { ...(await firebase()), ...(await authHeaders()) };
  const username = identity()?.username;
  await durablePhoto({profilePhotoUrl:null,profilePhotoPosition:PHOTO_DEFAULT_POSITION});
  void setDoc(doc(db,"users",user.uid),{profilePhoto:null,profilePhotoPosition:PHOTO_DEFAULT_POSITION,updatedAt:serverTimestamp()},{merge:true})
   .then(()=>username?setDoc(doc(db,"usernames",username),{profilePhotoUrl:null,profilePhotoPosition:PHOTO_DEFAULT_POSITION,updatedAt:serverTimestamp()},{merge:true}):null)
   .catch(error=>console.warn('[BIGLWA] Legacy photo mirror deferred:',error.message));
  patchIdentity({ avatarUrl: "" });
  paint("",PHOTO_DEFAULT_POSITION);
}
export async function getProfilePhotoDetails() {
  const {db,auth,doc,getDoc}=await firebase();
  if(!auth.currentUser)return {url:'',position:PHOTO_DEFAULT_POSITION};
  const durable=await durablePhoto();if(Object.hasOwn(durable,'profilePhotoUrl'))return {url:durable.profilePhotoUrl,position:normalizePosition(durable.profilePhotoPosition)};
  const snap=await getDoc(doc(db,'users',auth.currentUser.uid));
  const data=snap.exists()?snap.data()||{}:{};
  return {url:clean(data.profilePhoto?.url),position:normalizePosition(data.profilePhotoPosition)};
}
export async function saveProfilePhotoPosition(position) {
  const {db,auth,doc,getDoc,setDoc,serverTimestamp}=await firebase();
  const user=auth.currentUser;
  if(!user||!identity()?.uid||identity()?.uid!==user.uid)throw Error('Sign in to your own Studio to adjust your picture.');
  const durable=await durablePhoto();
  if(!durable.profilePhotoUrl){const snap=await getDoc(doc(db,'users',user.uid));if(!snap.exists()||!clean(snap.data()?.profilePhoto?.url))throw Error('Choose a profile picture before adjusting it.')}
  const values=normalizePosition(position);
  await durablePhoto({profilePhotoPosition:values});
  const username=identity()?.username;
  void setDoc(doc(db,'users',user.uid),{profilePhotoPosition:values,updatedAt:serverTimestamp()},{merge:true})
   .then(()=>username?setDoc(doc(db,'usernames',username),{profilePhotoPosition:values,updatedAt:serverTimestamp()},{merge:true}):null)
   .catch(error=>console.warn('[BIGLWA] Legacy photo position mirror deferred:',error.message));
  applyProfilePhotoPosition(values);
  window.dispatchEvent(new CustomEvent('biglwa:photo-position-changed',{detail:values}));
  return values;
}

function paint(url,position=PHOTO_DEFAULT_POSITION) {
  document.querySelectorAll("#studioApp .mini-avatar, #studioApp .profile-avatar").forEach((el) => {
    renderAvatar(el, url, identity()?.name && identity()?.name?.toLowerCase()!==identity()?.username?.toLowerCase()?identity().name:"");
  });
  applyProfilePhotoPosition(position);
  const preview = document.querySelector(".biglwa-photo-preview");
  if (preview) {
    preview.textContent = "";
    if (url) preview.style.backgroundImage = `url("${url}")`;
    else preview.style.backgroundImage = "";
  }
}

export async function loadProfilePhoto() {
  const { db, auth, doc, getDoc } = await firebase();
  const user = auth.currentUser;
  if (!user) return "";
  try {
    const durable=await durablePhoto();if(Object.hasOwn(durable,'profilePhotoUrl')){if(!document.documentElement.classList.contains('biglwa-preview-mode')){if(identity()?.uid===user.uid&&identity()?.avatarUrl!==durable.profilePhotoUrl)patchIdentity({avatarUrl:durable.profilePhotoUrl});paint(durable.profilePhotoUrl,durable.profilePhotoPosition)}return durable.profilePhotoUrl}
    const snap = await getDoc(doc(db, "users", user.uid));
    const url = clean(snap.exists() ? snap.data()?.profilePhoto?.url : "");
    if (url) paint(url,snap.data()?.profilePhotoPosition);
    return url;
  } catch {
    return "";
  }
}

export default { uploadProfilePhoto, removeProfilePhoto, loadProfilePhoto, validatePhoto, getProfilePhotoDetails, saveProfilePhotoPosition, applyProfilePhotoPosition };
