/* BIGLWA profile photo
 * Uploads a member's picture through the media Worker into R2, keeps the private copy on
 * the owner-only account doc, and mirrors just the URL into the public profile entry so a
 * visitor rendering a studio preview can show the picture without reading private data.
 */
import { identity, patchIdentity } from "./account-identity.js";
import { renderAvatar } from "./account-chrome.js";

const WORKER = "https://biglwa-instagram-api.leianmulatre-284.workers.dev";
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 8 * 1024 * 1024;

const clean = (v) => String(v || "").trim();

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
  if (!response.ok) throw new Error(payload.error || "That photo could not be uploaded.");
  await persistPhoto(payload);
  return payload;
}

async function persistPhoto(media) {
  const { db, user, doc, setDoc, serverTimestamp } = { ...(await firebase()), ...(await authHeaders()) };
  const record = {
    key: media.key, url: media.url, contentType: media.contentType,
    size: media.size, state: "approved", updatedAt: serverTimestamp()
  };
  await setDoc(doc(db, "users", user.uid), { profilePhoto: record, updatedAt: serverTimestamp() }, { merge: true });
  const username = identity()?.username;
  if (username) {
    await setDoc(doc(db, "usernames", username), { profilePhotoUrl: media.url, updatedAt: serverTimestamp() }, { merge: true });
  }
  patchIdentity({ avatarUrl: media.url });
  paint(media.url);
  return record;
}

export async function removeProfilePhoto() {
  const { db, user, doc, getDoc, setDoc, serverTimestamp } = { ...(await firebase()), ...(await authHeaders()) };
  const username = identity()?.username;
  await setDoc(doc(db, "users", user.uid), { profilePhoto: null, updatedAt: serverTimestamp() }, { merge: true });
  if (username) {
    await setDoc(doc(db, "usernames", username), { profilePhotoUrl: null, updatedAt: serverTimestamp() }, { merge: true });
  }
  patchIdentity({ avatarUrl: "" });
  paint("");
}

function paint(url) {
  document.querySelectorAll("#studioApp .mini-avatar, #studioApp .profile-avatar").forEach((el) => {
    renderAvatar(el, url, identity()?.name || identity()?.username);
  });
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
    const snap = await getDoc(doc(db, "users", user.uid));
    const url = clean(snap.exists() ? snap.data()?.profilePhoto?.url : "");
    if (url) paint(url);
    return url;
  } catch {
    return "";
  }
}

export default { uploadProfilePhoto, removeProfilePhoto, loadProfilePhoto, validatePhoto };
