/* BIGLWA Orbit connections
 *
 * Mirrors every connected Orbit source onto the member's own account so the connection
 * is visible and manageable from Settings and on their profile, rather than existing
 * only inside the browser that authorised it.
 *
/* Only public profile details are written. The provider session is a bearer credential
 * equivalent to a password: putting it in Firestore would place it behind a read rule
 * that governs more than just this member, so it stays in local storage. If that is lost,
 * the member reconnects; nothing is exposed by losing it.
 *
 * A connection recorded on the account outlives the device that made it. That is the
 * point of storing it: another device shows the connection and can be re-authorised, but
 * it must never treat its own missing local credential as a reason to erase the record.
 */
import { identity, onIdentityChange, startIdentity } from "./account-identity.js";

const WORKER = "https://biglwa-instagram-api.leianmulatre-284.workers.dev";

const SOURCES = [
  {
    id: "instagram",
    label: "Instagram",
    sessionKey: "biglwaInstagramSession",
    profile: "/instagram/profile",
    client: "__biglwaInstagramOrbit",
    read: (p) => ({
      username: p.username,
      name: p.name,
      avatarUrl: p.profile_picture_url,
      followers: p.followers_count,
      mediaCount: p.media_count,
      link: p.username ? "https://www.instagram.com/" + encodeURIComponent(p.username) + "/" : "https://www.instagram.com/"
    })
  },
  {
    id: "tiktok",
    label: "TikTok",
    sessionKey: "biglwaTikTokSession",
    profile: "/tiktok/profile",
    client: "__biglwaTikTokOrbit",
    read: (p) => ({
      username: p.display_name,
      name: p.display_name,
      avatarUrl: p.avatar_url,
      followers: p.follower_count,
      likes: p.likes_count,
      link: p.display_name ? "https://www.tiktok.com/@" + encodeURIComponent(p.display_name) : "https://www.tiktok.com/"
    })
  },
  {
    id: "pinterest",
    label: "Pinterest",
    sessionKey: "biglwaPinterestSession",
    profile: "/pinterest/profile",
    boardsUrl: "/pinterest/boards",
    client: "__biglwaPinterest",
    read: (p) => ({
      username: p.username,
      name: p.business_name || p.username,
      avatarUrl: p.profile_image,
      followers: p.follower_count,
      link: p.username ? "https://www.pinterest.com/" + encodeURIComponent(p.username) + "/" : "https://www.pinterest.com/"
    })
  }
];

const clean = (v) => String(v == null ? "" : v).trim();

/* Both the other sources keep their credential in local storage, and Pinterest now does
   too, but a session left behind by an older build is still worth finding. */
function readSession(key) {
  for (const store of [localStorage, sessionStorage]) {
    try {
      const value = store.getItem(key);
      if (value) return value;
    } catch { /* storage disabled */ }
  }
  return "";
}

let refs;
async function firebase() {
  if (!refs) {
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
    refs = { db: getFirestore(app), auth: getAuth(app), doc, getDoc, setDoc, serverTimestamp };
  }
  return refs;
}

const listeners = [];
let current = {};

export function onConnectionsChange(fn) {
  listeners.push(fn);
  fn(current);
}

function emit() {
  listeners.forEach((fn) => {
    try { fn(current); } catch { /* a listener must not stop the others */ }
  });
}

export function connections() { return current; }

export function connectedIds() {
  return SOURCES.filter((s) => current[s.id]).map((s) => s.id);
}

/* Pulls one source's profile through the Worker and stores the readable parts.
   The result says which of three things happened, because only one of them should remove
   the connection from the account:
     updated   the provider answered, so the record is current
     stale     the provider could not be reached, so the stored record is kept as it was
     rejected  the provider refused the credential, so the connection is no longer real
   A device with no local credential never gets this far: it keeps what the account says
   and reports the connection as needing to be re-authorised here. */
async function syncSource(source, uid) {
  const session = readSession(source.sessionKey);
  if (!session) return { outcome: "no-session" };
  const headers = { Authorization: "Bearer " + session };
  let profile;
  try {
    const response = await fetch(WORKER + source.profile, { headers });
    if (response.status === 401) return { outcome: "rejected" };
    if (!response.ok) return { outcome: "stale" };
    profile = await response.json();
  } catch {
    /* A network blip must not delete a working connection. */
    return { outcome: "stale" };
  }
  if (!profile || typeof profile !== "object") return { outcome: "stale" };

  const details = source.read(profile);
  const stats = {
    followers: details.followers ?? null,
    mediaCount: details.mediaCount ?? null,
    likes: details.likes ?? null,
    boards: null,
    pins: null
  };

  /* Pinterest does not put board or pin counts on the account, only on the boards list,
     and the count is the whole reason the connection is worth keeping. */
  if (source.boardsUrl) {
    try {
      const response = await fetch(WORKER + source.boardsUrl, { headers });
      if (response.ok) {
        const data = await response.json();
        const boards = Array.isArray(data) ? data : (data && data.items) || [];
        stats.boards = boards.length;
        stats.pins = boards.reduce((total, b) => total + (Number(b && b.pin_count) || 0), 0) || null;
      }
    } catch { /* the profile alone is still worth storing */ }
  }

  const record = {
    id: source.id,
    label: source.label,
    username: clean(details.username),
    name: clean(details.name),
    avatarUrl: clean(details.avatarUrl),
    link: clean(details.link),
    stats,
    connectedAt: current[source.id]?.connectedAt || new Date().toISOString(),
    lastCheckedAt: new Date().toISOString()
  };
  await write(uid, source.id, record);
  return { outcome: "updated", record };
}

async function write(uid, id, record) {
  if (!uid) return;
  try {
    const { db, doc, setDoc, serverTimestamp } = await firebase();
    await setDoc(doc(db, "users", uid), { connections: { [id]: record }, updatedAt: serverTimestamp() }, { merge: true });
  } catch {
    /* Firestore being unreachable should not stop the studio working. */
  }
}

/* Reads what the account already records, so a connection made on another device is
   visible before this device has refreshed it from the provider. */
async function load(uid) {
  if (!uid) { current = {}; emit(); return; }
  let stored = {};
  try {
    const { db, doc, getDoc } = await firebase();
    const snap = await getDoc(doc(db, "users", uid));
    stored = snap.exists() ? (snap.data().connections || {}) : {};
  } catch { /* fall back to whatever the sources report */ }
  current = stored && typeof stored === "object" ? stored : {};
  emit();
  await refresh(uid);
}

let refreshing = null;
export function refresh(uid) {
  const who = uid || identity()?.uid;
  if (!who) return Promise.resolve(current);
  if (refreshing) return refreshing;
  refreshing = (async () => {
    for (const source of SOURCES) {
      const { outcome, record } = await syncSource(source, who);
      const next = { ...current };
      if (outcome === "updated") {
        next[source.id] = record;
      } else if (outcome === "rejected") {
        /* The provider itself said this credential is dead, so the account should stop
           advertising it. */
        delete next[source.id];
        clearStored(who, source.id);
      } else {
        /* "no-session" keeps what the account recorded: this device simply has not been
           authorised, which is not evidence the connection is gone. "stale" keeps the last
           known good record for the same reason. */
        if (next[source.id]) next[source.id] = { ...next[source.id], needsReauth: outcome === "no-session" };
      }
      current = next;
      emit();
    }
    refreshing = null;
    return current;
  })();
  return refreshing;
}

async function clearStored(uid, id) {
  try {
    const { db, doc, setDoc, serverTimestamp } = await firebase();
    await setDoc(doc(db, "users", uid), { connections: { [id]: null }, updatedAt: serverTimestamp() }, { merge: true });
  } catch { /* the account entry is a convenience, not the credential */ }
}

/* Forgets a connection on the account and this device. The provider is asked to end the
   grant as well, so the credential it was holding stops working even before the browser
   drops it, and then both copies of the session key are cleared. */
export async function forget(id) {
  const source = SOURCES.find((s) => s.id === id);
  if (!source) return current;
  const session = readSession(source.sessionKey);
  if (session) {
    try {
      await fetch(WORKER + "/" + id + "/disconnect", {
        method: "POST",
        headers: { Authorization: "Bearer " + session }
      });
    } catch { /* the local copies are cleared regardless */ }
  }
  for (const store of [localStorage, sessionStorage]) {
    try { store.removeItem(source.sessionKey); } catch { /* storage disabled */ }
  }
  const who = identity()?.uid;
  if (who) await clearStored(who, id);
  const next = { ...current };
  delete next[id];
  current = next;
  emit();
  return current;
}

let started = false;
export async function startConnections() {
  /* The studio starts this and the Settings page starts it again, so a second call must
     not register a second identity listener and load the account twice. */
  if (started) return current;
  started = true;
  startIdentity();
  const begin = (who) => load(who?.uid);
  onIdentityChange(begin);
  return begin(identity());
}

export default { connections, onConnectionsChange, connectedIds, refresh, forget, startConnections };
