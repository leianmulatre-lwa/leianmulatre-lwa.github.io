/* BIGLWA account identity
 * One signed-in identity at a time, kept in sync with Firestore and cached per account.
 *
 * The studio used to keep the member profile in a single device-wide localStorage slot, so
 * whoever used the browser last owned the name on screen: a new account opened as the
 * previous one, and signing in as somebody else still showed the first person's username.
 * Everything here is keyed by uid instead, and Firestore is treated as the source of truth.
 */
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAPUT8_pLNxdh5tbGpAmXBJiID3jVcA9DY",
  authDomain: "biglwa.firebaseapp.com",
  projectId: "biglwa",
  appId: "1:83232670555:web:e04927b20458390b3b507e"
};

const FIRESTORE = "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
const AUTH = "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
const LEGACY_KEY = "biglwaProfileDetails";
const CACHE_PREFIX = "biglwaProfileDetails:";

let dbPromise;
let authPromise;
let current = null;
let started = false;
const listeners = new Set();

const clean = (v) => String(v || "").trim();
const normalize = (v) => clean(v).replace(/^@/, "").toLowerCase();

function validUsername(value) {
  const name = normalize(value);
  return name.length >= 5 && name.length <= 24 && /^[a-z0-9._-]+$/.test(name);
}

async function firebase() {
  if (!authPromise || !dbPromise) {
    const [{ initializeApp, getApps }, { getFirestore }, { getAuth }] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js"),
      import(FIRESTORE),
      import(AUTH)
    ]);
    const app = getApps()[0] || initializeApp(FIREBASE_CONFIG);
    dbPromise = Promise.resolve(getFirestore(app));
    authPromise = Promise.resolve(getAuth(app));
  }
  return { db: await dbPromise, auth: await authPromise };
}

function cacheKey(uid) {
  return CACHE_PREFIX + uid;
}

function cached(uid) {
  try {
    const saved = JSON.parse(localStorage.getItem(cacheKey(uid)) || "null");
    return saved && typeof saved === "object" ? saved : {};
  } catch {
    return {};
  }
}

function writeCache(record) {
  if (!record?.uid) return;
  try {
    localStorage.setItem(cacheKey(record.uid), JSON.stringify({
      username: record.username || "",
      name: record.name || "",
      avatarUrl: record.avatarUrl || ""
    }));
  } catch {}
}

function emit() {
  const snapshot = current ? { ...current } : null;
  listeners.forEach((fn) => {
    try { fn(snapshot); } catch {}
  });
}

export function identity() {
  return current;
}

export function onIdentityChange(fn) {
  if (typeof fn !== "function") return () => {};
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/* The username a member chose at sign-up, which is also what their public entry is keyed
 * by. Falls back through the uid cache, then the legacy device slot, so an account that
 * predates the uid cache still resolves instead of appearing nameless. */
export function identityUsername() {
  if (current?.username) return current.username;
  const uid = current?.uid;
  if (!uid) return "";
  const record = cached(uid);
  if (validUsername(record.username)) return normalize(record.username);
  try {
    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || "null");
    if (validUsername(legacy?.username)) return normalize(legacy.username);
  } catch {}
  return "";
}

export function patchIdentity(patch) {
  if (!current?.uid || !patch || typeof patch !== "object") return;
  writeCache({ ...cached(current.uid), ...patch, uid: current.uid });
  current = { ...current, ...patch };
  emit();
}

export async function refreshIdentity() {
  const { db, auth } = await firebase();
  const user = auth.currentUser;
  if (!user) {
    if (current) { current = null; emit(); }
    return null;
  }
  const record = cached(user.uid);
  let account = {};
  try {
    const { doc, getDoc } = await import(FIRESTORE);
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) account = snap.data() || {};
  } catch {}
  const username = normalize(account.usernameLower || record.username || "");
  current = {
    uid: user.uid,
    username: validUsername(username) ? username : "",
    name: clean(account.name || record.name) || (validUsername(username) ? username : ""),
    avatarUrl: clean(account.profilePhoto?.url || record.avatarUrl),
    email: clean(user.email),
    emailVerified: user.emailVerified === true
  };
  writeCache(current);
  emit();
  /* Sign-up sets the chosen username as the account display name but never wrote a profile,
     so a brand-new member had no public entry and opened as whoever used the browser last.
     A display name that is itself a legal username is the signup choice, so adopt it here.
     A real name fails this test, and an existing username is refused by claimUsername. */
  if (!current.username && validUsername(user.displayName)) {
    try {
      await claimUsername(user.displayName);
      return current;
    } catch {}
  }
  return current;
}

/* Publishes a username into the public directory so the account is previewable, and binds
 * it on the owner-only account doc. Called right after sign-up, where no profile exists yet
 * and without it a new member has no public entry at all. */
export async function claimUsername(username) {
  const name = normalize(username);
  if (!validUsername(name)) throw new Error("Usernames need 5-24 characters of letters, numbers, periods, underscores, or hyphens.");
  const { db, auth } = await firebase();
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in before choosing a username.");
  const { doc, getDoc, setDoc, serverTimestamp } = await import(FIRESTORE);
  const existing = await getDoc(doc(db, "usernames", name));
  if (existing.exists() && existing.data()?.uid && existing.data().uid !== user.uid) {
    throw new Error("That username is already taken.");
  }
  await setDoc(doc(db, "users", user.uid), {
    usernameLower: name,
    name: clean(current?.name) || clean(user.displayName) || name,
    updatedAt: serverTimestamp()
  }, { merge: true });
  await setDoc(doc(db, "usernames", name), {
    uid: user.uid,
    username: name,
    usernameLower: name,
    url: "/" + name,
    name: clean(current?.name) || clean(user.displayName) || name,
    look: (existing.exists() && existing.data()?.look) || {},
    updatedAt: serverTimestamp()
  }, { merge: true });
  writeCache({ ...cached(user.uid), username: name });
  current = { ...(current || {}), uid: user.uid, username: name, name: clean(current?.name) || name };
  emit();
  return name;
}

export function startIdentity() {
  if (started) return;
  started = true;
  (async () => {
    const { auth } = await firebase();
    try { await auth.authStateReady(); } catch {}
    await refreshIdentity();
    auth.onAuthStateChanged(() => { refreshIdentity(); });
  })();
}

export default { identity, onIdentityChange, identityUsername, patchIdentity, refreshIdentity, claimUsername, startIdentity };
