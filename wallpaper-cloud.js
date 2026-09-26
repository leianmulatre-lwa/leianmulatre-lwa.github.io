/* BIGLWA account media: Cloudflare R2 storage plus Firestore moderation.
 *
 * The device-only IndexedDB wallpaper is gone. Media now lives in the R2 bucket behind
 * the site's own Worker, and the account doc is the only source of truth, so a member
 * signs in on any device and their wallpaper is already there. Visitors see the
 * approved copy through the public usernames doc.
 *
 * Automated review: an on-device nsfwjs pass that is confident and clean publishes
 * immediately. Anything uncertain, adult-coded or unreadable is uploaded but never
 * published: it lands in the wallpaperReviews queue for the member and listed admins.
 */
const MEDIA_ENDPOINT = 'https://biglwa-instagram-api.leianmulatre-284.workers.dev';
const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAPUT8_pLNxdh5tbGpAmXBJiID3jVcA9DY',
  authDomain: 'biglwa.firebaseapp.com',
  projectId: 'biglwa',
  appId: '1:83232670555:web:e04927b20458390b3b507e'
};
const REVIEW_COLLECTION = 'wallpaperReviews';
const ADMIN_COLLECTION = 'moderationAdmins';
const PROFILE_COLLECTION = 'usernames';
const MAX_IMAGE_BYTES = 30 * 1024 * 1024;
const MAX_VIDEO_BYTES = 120 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const EXTENSIONS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov' };
/* Only a confident clean pass may publish without a human. */
const AUTO_PUBLISH_STATUS = 'general';

const clean = value => String(value == null ? '' : value).trim();
const isVideo = type => VIDEO_TYPES.includes(String(type || '').toLowerCase());
const isImage = type => IMAGE_TYPES.includes(String(type || '').toLowerCase());
const supported = type => isImage(type) || isVideo(type);

let dbPromise = null;
let authPromise = null;
let adminCache = { at: 0, value: false };

async function firebase() {
  if (!dbPromise || !authPromise) {
    const [{ initializeApp, getApps }, { getFirestore }, { getAuth }] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js'),
      import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js')
    ]);
    const app = getApps()[0] || initializeApp(FIREBASE_CONFIG);
    dbPromise = Promise.resolve(getFirestore(app));
    authPromise = Promise.resolve(getAuth(app));
  }
  return { db: await dbPromise, auth: await authPromise };
}

async function signedInUser() {
  try {
    const { auth } = await firebase();
    /* currentUser is null until the SDK finishes restoring a persisted session, so a
       signed-in member reads as signed-out on a cold load. authStateReady() settles
       that race instead of guessing. */
    if (typeof auth.authStateReady === 'function') { try { await auth.authStateReady(); } catch {} }
    return auth.currentUser || null;
  } catch { return null; }
}

function onAuthStateChange(handler) {
  return firebase().then(({ auth }) => {
    if (typeof auth.onAuthStateChanged !== 'function') return () => {};
    if (typeof auth.authStateReady === 'function') auth.authStateReady().catch(() => {});
    return auth.onAuthStateChanged((user) => { try { handler(user); } catch {} });
  }).catch(() => () => {});
}

function localUsername() {
  try {
    const saved = JSON.parse(localStorage.getItem('biglwaProfileDetails') || 'null');
    const value = clean(saved?.username).replace(/^@/, '').toLowerCase();
    if (value && /^[a-z0-9._-]{5,24}$/.test(value)) return value;
  } catch {}
  return clean(document.getElementById('loginUsername')?.value).replace(/^@/, '').toLowerCase();
}

async function isAdmin(force = false) {
  try {
    const user = await signedInUser();
    if (!user) return false;
    if (!force && Date.now() - adminCache.at < 30000) return adminCache.value;
    const { db } = await firebase();
    const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js');
    const snap = await getDoc(doc(db, ADMIN_COLLECTION, user.uid));
    const data = snap.exists() ? (snap.data() || {}) : null;
    const value = !!data && data.active !== false;
    adminCache = { at: Date.now(), value };
    return value;
  } catch { return false; }
}

async function mediaHeaders(user) {
  const token = await user.getIdToken();
  return { Authorization: 'Bearer ' + token };
}

/* Uploads raw bytes to the Worker, which streams them into R2 under the member's uid.
   The returned key is unguessable, so media held for review is not reachable by URL. */
async function uploadMedia(file, { state = 'pending' } = {}) {
  const user = await signedInUser();
  if (!user) throw new Error('Sign in to save a wallpaper to your account.');
  if (!supported(file.type)) throw new Error('Choose a JPG, PNG, WebP, GIF, MP4, WebM, or MOV file.');
  const limit = isVideo(file.type) ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > limit) throw new Error(`Keep videos under ${MAX_VIDEO_BYTES / 1024 / 1024} MB and images under ${MAX_IMAGE_BYTES / 1024 / 1024} MB.`);
  const headers = await mediaHeaders(user);
  const query = new URLSearchParams({ kind: isVideo(file.type) ? 'video' : 'image', state, name: clean(file.name).slice(0, 120) });
  const response = await fetch(`${MEDIA_ENDPOINT}/media/wallpaper?${query}`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': file.type || 'application/octet-stream' },
    body: file
  });
  const payload = await response.json().catch(() => ({}));
  if (response.status === 404 || response.status === 405) throw new Error('Account media is not available on the server yet, so this wallpaper was not saved.');
  if (response.status === 503) throw new Error('Account media storage is not configured yet, so this wallpaper was not saved.');
  if (!response.ok) throw new Error(payload.error || 'The media store did not accept this file.');
  return {
    key: clean(payload.key),
    url: clean(payload.url),
    kind: clean(payload.kind) || (isVideo(file.type) ? 'video' : 'image'),
    contentType: clean(payload.contentType) || clean(file.type),
    size: Number(payload.size) || file.size,
    state: clean(payload.state) || state,
    uploadedAt: Number(payload.createdAt) || Date.now()
  };
}

async function deleteMedia(ref) {
  const key = clean(ref?.key);
  if (!key) return false;
  try {
    const user = await signedInUser();
    if (!user) return false;
    const headers = await mediaHeaders(user);
    await fetch(`${MEDIA_ENDPOINT}/media/wallpaper/${key.split('/').map(encodeURIComponent).join('/')}`, { method: 'DELETE', headers });
    return true;
  } catch { return false; }
}

/* Public projection. The preview only ever reads the usernames doc, so an approved
   wallpaper is the single field a visitor can see. */
async function writePublicMedia(username, media, ownerUid) {
  const { db } = await firebase();
  const current = await signedInUser();
  const uid = ownerUid || current?.uid || null;
  if (!uid || !username) return;
  const { doc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js');
  const look = media
    ? { wallpaperMedia: { url: media.url, kind: media.kind, state: 'approved', updatedAt: Date.now() } }
    : { wallpaperMedia: null };
  const payload = { look, updatedAt: serverTimestamp() };
  /* A moderator publishing somebody else's approved media must leave the entry's uid and
     the owner's account doc alone: writing them would hand the entry to the moderator and
     make the rules reject the write, since moderators may only touch look and updatedAt. */
  if (!ownerUid || ownerUid === current?.uid) {
    await setDoc(doc(db, 'users', uid), { usernameLower: username, updatedAt: serverTimestamp() }, { merge: true });
    payload.uid = uid;
  }
  await setDoc(doc(db, PROFILE_COLLECTION, username), payload, { merge: true });
}

async function publishToAccount(media, extra = {}) {
  const user = await signedInUser();
  if (!user) throw new Error('Sign in to save a wallpaper to your account.');
  const { db } = await firebase();
  const { doc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js');
  const record = {
    key: media.key, url: media.url, kind: media.kind, contentType: media.contentType,
    size: media.size, state: 'approved', approvedBy: extra.approvedBy || 'auto',
    approvedAt: serverTimestamp(), updatedAt: serverTimestamp()
  };
  await setDoc(doc(db, 'users', user.uid), { wallpaper: record, updatedAt: serverTimestamp() }, { merge: true });
  const username = localUsername();
  if (username) await writePublicMedia(username, media);
  return record;
}

async function clearAccountMedia() {
  const user = await signedInUser();
  if (!user) return false;
  const { db } = await firebase();
  const { doc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js');
  await setDoc(doc(db, 'users', user.uid), { wallpaper: null, updatedAt: serverTimestamp() }, { merge: true });
  const username = localUsername();
  if (username) await writePublicMedia(username, null);
  return true;
}

async function loadAccountMedia() {
  try {
    const user = await signedInUser();
    if (!user) return null;
    const { db } = await firebase();
    const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js');
    const snap = await getDoc(doc(db, 'users', user.uid));
    const data = snap.exists() ? (snap.data() || {}).wallpaper : null;
    if (!data?.url || data.state !== 'approved') return null;
    return data;
  } catch { return null; }
}

/* Uncertain media still gets stored so a human can look at it, but it is never linked
   from the profile. */
async function openReview(entry) {
  const user = await signedInUser();
  if (!user) throw new Error('Sign in to send media for review.');
  const { db } = await firebase();
  const { collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js');
  const media = entry.media || null;
  const ref = await addDoc(collection(db, REVIEW_COLLECTION), {
    ownerUid: user.uid,
    username: localUsername() || null,
    mediaKey: media?.key || null,
    mediaUrl: media?.url || null,
    kind: media?.kind || (entry.kind || 'image'),
    verdict: clean(entry.verdict) || 'uncertain',
    scores: entry.scores && typeof entry.scores === 'object' ? entry.scores : {},
    context: clean(entry.context) || 'mixed',
    name: clean(entry.name) || 'wallpaper',
    state: 'pending',
    autoPublished: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return ref.id;
}

async function loadReviews({ pendingOnly = true } = {}) {
  try {
    const user = await signedInUser();
    if (!user) return [];
    const admin = await isAdmin();
    const { db } = await firebase();
    const { collection, query, where, orderBy, getDocs } = await import('https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js');
    /* Firestore rules cannot express "owner or admin" in one query, so a member without
       admin rights is always scoped to their own uid. */
    const constraints = admin
      ? [pendingOnly ? where('state', '==', 'pending') : where('state', 'in', ['pending', 'approved', 'rejected'])]
      : [where('ownerUid', '==', user.uid), ...(pendingOnly ? [where('state', '==', 'pending')] : [])];
    const snap = await getDocs(query(collection(db, REVIEW_COLLECTION), ...constraints, orderBy('createdAt', 'desc')));
    return snap.docs.map(item => ({ id: item.id, ...(item.data() || {}) }));
  } catch { return []; }
}

async function decideReview(id, decision, note = '') {
  const user = await signedInUser();
  if (!user) throw new Error('Sign in to review media.');
  const admin = await isAdmin();
  if (!admin) throw new Error('Only listed moderators can decide reviews.');
  const state = decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'pending';
  const { db } = await firebase();
  const { doc, getDoc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js');
  const ref = doc(db, REVIEW_COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('That review no longer exists.');
  const current = snap.data() || {};
  await setDoc(ref, {
    state,
    note: clean(note).slice(0, 400),
    reviewedBy: user.uid,
    reviewedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: true });
  if (state === 'approved' && current.mediaUrl) {
    const owner = current.ownerUid;
    if (owner && current.username) {
      const ownerSnap = await getDoc(doc(db, 'users', owner));
      await setDoc(doc(db, 'users', owner), {
        wallpaper: {
          key: current.mediaKey, url: current.mediaUrl, kind: current.kind,
          state: 'approved', approvedBy: user.uid, approvedAt: serverTimestamp(), updatedAt: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      }, { merge: true });
      await writePublicMedia(current.username, { url: current.mediaUrl, kind: current.kind }, owner);
    }
  }
  if (state === 'rejected' && current.mediaKey) await deleteMedia({ key: current.mediaKey });
  return state;
}

async function removeAccountWallpaper() {
  const existing = await loadAccountMedia();
  await clearAccountMedia();
  if (existing?.key) await deleteMedia(existing);
  return true;
}

window.BIGLWAWallpaperCloud = {
  endpoint: MEDIA_ENDPOINT,
  supported,
  isVideo,
  isAdmin,
  isSignedIn: async () => !!(await signedInUser()),
  onAuthStateChange,
  username: localUsername,
  upload: uploadMedia,
  remove: deleteMedia,
  publish: publishToAccount,
  clear: clearAccountMedia,
  load: loadAccountMedia,
  review: openReview,
  reviews: loadReviews,
  decide: decideReview,
  removeWallpaper: removeAccountWallpaper,
  /* studio-appearance asks this before it treats a scan as good enough to publish. */
  autoPublishStatus: AUTO_PUBLISH_STATUS
};

document.dispatchEvent(new CustomEvent('biglwa:wallpaper-cloud-ready', { detail: { endpoint: MEDIA_ENDPOINT } }));
