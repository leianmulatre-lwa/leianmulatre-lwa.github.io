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

const WORKER = "https://api.biglwa.com";

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
      username: p.username || '',
      sourceUserId: p.open_id,
      name: p.display_name,
      avatarUrl: p.avatar_url,
      followers: p.follower_count,
      likes: p.likes_count,
      link: p.username ? "https://www.tiktok.com/@" + encodeURIComponent(p.username) : "https://www.tiktok.com/"
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
function readSession(key, accountUid) {
  // The Pinterest session is bound to a Firebase UID; never read another person's
  // credential from the previous global browser-storage slot.
  const uid = accountUid || identity()?.uid;
  const scoped = ["biglwaPinterestSession","biglwaTikTokSession","biglwaInstagramSession"].includes(key)
    ? (uid ? key + ":" + uid : "")
    : key;
  if (!scoped) return "";
  for (const store of [localStorage, sessionStorage]) {
    try { const value = store.getItem(scoped); if (value) return value; }
    catch { /* storage disabled */ }
  }
  return "";
}
async function recoverInstagramSession(uid) {
  try{
    const {auth}=await firebase();
    await auth.authStateReady();
    if(!uid||auth.currentUser?.uid!==uid)return "";
    const firebaseIdToken=await auth.currentUser.getIdToken();
    const response=await fetch(WORKER+"/session/account",{
      headers:{Authorization:"Bearer "+firebaseIdToken}
    });
    if(!response.ok)return "";
    const body=await response.json().catch(()=>({}));
    if(!body?.connected||!body.session)return "";
    try{localStorage.setItem("biglwaInstagramSession:"+uid,body.session)}catch{}
    return body.session;
  }catch{return ""}
}
async function recoverTikTokSession(uid) {
  try{
    const {auth}=await firebase();
    await auth.authStateReady();
    if(!uid||auth.currentUser?.uid!==uid)return "";
    const token=await auth.currentUser.getIdToken();
    const response=await fetch(WORKER+"/tiktok/session/account",{headers:{Authorization:"Bearer "+token}});
    if(!response.ok)return "";
    const data=await response.json();
    if(!data?.connected||!data.session)return "";
    try{localStorage.setItem("biglwaTikTokSession:"+uid,data.session)}catch{}
    return data.session;
  }catch{return ""}
}
async function recoverPinterestSession(uid) {
  try {
    const { auth } = await firebase();
    await auth.authStateReady();
    if (!uid || auth.currentUser?.uid !== uid) return "";
    const token = await auth.currentUser.getIdToken();
    const result = await fetch(WORKER + "/pinterest/session/account", {
      headers: { Authorization: "Bearer " + token }
    });
    if (!result.ok) return "";
    const payload = await result.json();
    if (!payload?.connected || !payload.session) return "";
    try { localStorage.setItem("biglwaPinterestSession:" + uid, payload.session); } catch { }
    return payload.session;
  } catch (error) {
    console.warn("Pinterest account recovery:", error);
    return "";
  }
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
  // The account-linked Worker is authoritative for Instagram credentials;
  // local storage is only an optional per-device cache.
  let session=source.id==="instagram"
    ? await recoverInstagramSession(uid)
    : readSession(source.sessionKey,uid);
  if(!session && source.id==="instagram")session=readSession(source.sessionKey,uid);
  if (!session && source.id === "pinterest") session = await recoverPinterestSession(uid);
  if (!session && source.id === "tiktok") session = await recoverTikTokSession(uid);
  if (!session) return { outcome: "no-session" };
  let headers = { Authorization: "Bearer " + session };
  let profile;
  try {
    const response = await fetch(WORKER + source.profile, { headers });
    if(response.status===401 && source.id==="instagram"){
      // Recheck the account instead of deleting its public connection merely
      // because a cached browser token or provider request expired.
      session=await recoverInstagramSession(uid);
      if(!session)return {outcome:"no-session"};
      headers={Authorization:"Bearer "+session};
      const retry=await fetch(WORKER+source.profile,{headers});
      if(retry.status===401)return {outcome:"stale"};
      if(!retry.ok)return {outcome:"stale"};
      profile=await retry.json();
    }else if (response.status === 401 && source.id === "pinterest") {
      // A stale local credential is not proof that the account was disconnected.
      try { localStorage.removeItem("biglwaPinterestSession:" + uid); } catch {}
      session = await recoverPinterestSession(uid);
      if (!session) return { outcome: "no-session" };
      headers = { Authorization: "Bearer " + session };
      const retry = await fetch(WORKER + source.profile, { headers });
      if (retry.status === 401) {
        // Pinterest grant expiry requires reconnect, not removing the account link.
        try { localStorage.removeItem("biglwaPinterestSession:" + uid); } catch {}
        return { outcome: "no-session" };
      }
      if (!retry.ok) return { outcome: "stale" };
      profile = await retry.json();
    } else {
      if (response.status === 401) return { outcome: "rejected" };
      if (!response.ok) return { outcome: "stale" };
      profile = await response.json();
    }
  } catch {
    /* A network blip must not delete a working connection. */
    return { outcome: "stale" };
  }
  if (!profile || typeof profile !== "object") return { outcome: "stale" };

  const details = source.read(profile);
  // A successful basic-profile call is not proof that a provider returned its
  // optional follower metrics. Reuse only this *same account's* last verified
  // value; missing fields must never become zero or erase an older count.
  const count = value => value!==null&&value!==undefined&&value!==''&&
    Number.isSafeInteger(Number(value))&&Number(value)>=0?Number(value):null;
  const old=current[source.id];
  // TikTok's stable open_id survives changes to the visible display name.
  const sameAccount=!!old&&(
    (details.sourceUserId&&old.sourceUserId&&clean(details.sourceUserId)===clean(old.sourceUserId))||
    (!!details.username&&clean(old.username).toLowerCase()===clean(details.username).toLowerCase())
  );
  const followers=count(details.followers);
  const preserved=sameAccount?count(old.stats?.followers):null;
  const stats = {
    followers: followers ?? preserved,
    mediaCount: count(details.mediaCount)??(sameAccount?count(old.stats?.mediaCount):null),
    likes: count(details.likes)??(sameAccount?count(old.stats?.likes):null),
    boards: sameAccount?count(old.stats?.boards):null,
    pins: sameAccount?count(old.stats?.pins):null
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
    sourceUserId: clean(details.sourceUserId||old?.sourceUserId),
    name: clean(details.name),
    avatarUrl: clean(details.avatarUrl),
    link: clean(details.link),
    stats,
    connectedAt: sameAccount?old.connectedAt||new Date().toISOString():new Date().toISOString(),
    // lastCheckedAt tracks the account profile request, while countCheckedAt
    // tracks the most recent actual follower response (not a basic-only call).
    lastCheckedAt: new Date().toISOString(),
    countCheckedAt: followers!==null?new Date().toISOString():
      (sameAccount?String(old.countCheckedAt||old.lastCheckedAt||''):'')
  };
  const persisted = await write(uid, source.id, record);
  if (!persisted) window.dispatchEvent(new CustomEvent("biglwa:orbit-connection-save-error", { detail: { source: source.id } }));
  return { outcome: "updated", record };
}

async function write(uid, id, record) {
  if (!uid) return false;
  try {
    const { db, doc, setDoc, serverTimestamp } = await firebase();
    await setDoc(doc(db, "users", uid), { connections: { [id]: record }, updatedAt: serverTimestamp() }, { merge: true });
    return true;
  } catch (error) {
    console.warn("BIG LWA could not persist Orbit connection:", id, error);
    return false;
  }
}

/* ---------------------------------------------------------------------------
 * The public half.
 *
 * The account document is owner-only, so a visitor cannot see a member's connections from
 * there, and that is the right place for them: it holds counts, check times, and records
 * that outlive the device. A visitor should see the links and nothing else.
 *
 * So the links are mirrored into the already-public usernames document, and only the
 * links: a label, a handle, and an https address on the provider's own host. Counts, the
 * last-checked time, and the needs-reauth marker are all left behind. A visitor learns where
 * a member is, and nothing about how their account is wired.
 *
 * This is published rather than opt-in, because a link a member chose to put on their
 * profile is the whole point of a profile. A member who does not want a link on their
 * profile unlinks the account in Settings, which removes it here too.
 * ----------------------------------------------------------------------- */

/* A public link is only ever one of the provider hosts we already talk to. Anything else is
   dropped rather than echoed, so this mirror cannot become a way to publish an arbitrary
   address on someone's profile. */
const PUBLIC_HOSTS = {
  instagram: ["instagram.com", "www.instagram.com"],
  tiktok: ["tiktok.com", "www.tiktok.com"],
  pinterest: ["pinterest.com", "www.pinterest.com"],
  x: ["x.com", "www.x.com", "twitter.com", "www.twitter.com"],
  snapchat: ["snapchat.com", "www.snapchat.com"],
  tumblr: ["tumblr.com", "www.tumblr.com"]
};

function publicLink(id, record) {
  const raw = clean(record && record.link);
  if (!raw) return null;
  let url;
  try { url = new URL(raw); } catch { return null; }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.toLowerCase();
  const allowed=(PUBLIC_HOSTS[id]||[]).includes(host)
    || ((id==='tumblr' && host.endsWith('.tumblr.com')) || (id==='snapchat' && host.endsWith('.snapchat.com')));
  // A Tumblr subdomain's root is itself a valid public blog; other
  // provider roots are not account profiles.
  const tumblrBlogRoot=id==='tumblr'&&host.endsWith('.tumblr.com')&&host!=='www.tumblr.com';
  if(!allowed || (['snapchat','x','tumblr'].includes(id) &&
    (!url.pathname || url.pathname==='/') && !tumblrBlogRoot))return null;
  return {
    id,
    label: clean(record.label) || id,
    handle: clean(record.username),
    url: url.href
  };
}

async function mirrorPublic(uid, records) {
  if (!uid) return;
  try {
    const { db, doc, getDoc, setDoc, serverTimestamp } = await firebase();
    /* The username lives on the owner-only account doc; the rules trust that binding, so
       reading it here is also what makes this write look like it came from the owner. */
    const account = await getDoc(doc(db, "users", uid));
    if (!account.exists()) return;
    const username = clean(account.data().usernameLower || account.data().username);
    if (!username) return;

    const socials = {};
    // The Orbit profile tab saves manually selected links separately from OAuth.
    // Publish only provider-host links, not tokens, counts or account IDs.
    for (const [id, url] of Object.entries(account.data().orbitLinks || {})) {
      const link=publicLink(id,{link:url,label:id});
      if(link)socials[id]=link;
    }
    for (const [id, record] of Object.entries(account.data().orbitConnectedProfiles || {})) {
      const link=publicLink(id,record);
      if(link)socials[id]=link;
    }
    for (const [id, record] of Object.entries(records || {})) {
      const link = publicLink(id, record);
      if (link) socials[id] = link;
    }
    await setDoc(doc(db, "usernames", username), { socials, updatedAt: serverTimestamp() }, { merge: true });
  } catch {
    /* The public mirror is a convenience. Not being able to reach it must not disturb the
       connection itself, which has already been recorded on the account. */
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
    /* Mirrored once per pass rather than per source: three links arriving separately would
       make a visitor's profile flicker through a half-published state. */
    await mirrorPublic(who, current);
    refreshing = null;
    return current;
  })();
  return refreshing;
}

/* Refresh a single newly authorized source immediately rather than waiting for
 * a full Instagram/TikTok/Pinterest pass already in progress. */
export async function refreshSource(id, uid) {
  const who = uid || identity()?.uid;
  const source = SOURCES.find(entry => entry.id === id);
  if (!who || !source) return { outcome: "no-session" };
  const { auth } = await firebase();
  await auth.authStateReady();
  if (auth.currentUser?.uid !== who) return { outcome: "no-session" };
  const result = await syncSource(source, who);
  if (auth.currentUser?.uid !== who) return { outcome: "no-session" };
  const next = { ...current };
  if (result.outcome === "updated") next[id] = result.record;
  else if (result.outcome === "rejected") {
    delete next[id];
    await clearStored(who, id);
  } else if (next[id]) {
    next[id] = { ...next[id], needsReauth: result.outcome === "no-session" };
  }
  current = next;
  emit();
  await mirrorPublic(who, next);
  return result;
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
      const pinterestBody = id === "pinterest"
        ? JSON.stringify({ firebaseIdToken: await (await firebase()).auth.currentUser?.getIdToken() })
        : null;
      await fetch(WORKER + "/" + id + "/disconnect", {
        method: "POST",
        headers: { Authorization: "Bearer " + session, ...(pinterestBody ? { "Content-Type": "application/json" } : {}) },
        ...(pinterestBody ? { body: pinterestBody } : {})
      });
    } catch { /* the local copies are cleared regardless */ }
  }
  for (const store of [localStorage, sessionStorage]) {
    try {
      store.removeItem(source.sessionKey);
      if (["pinterest","tiktok","instagram"].includes(id) && identity()?.uid) store.removeItem(source.sessionKey + ":" + identity().uid);
    } catch { /* storage disabled */ }
  }
  const who = identity()?.uid;
  if (who) await clearStored(who, id);
  const next = { ...current };
  delete next[id];
  current = next;
  emit();
  /* The visitor's copy has to go at the same time, or an unlinked account would keep
     appearing on the public profile until the next sign-in. */
  if (who) await mirrorPublic(who, current);
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
  /* The Orbit page is a classic script and cannot import this module, so the connected
     accounts are published on the window for it to read and to subscribe to. */
  window.__biglwaConnections = { connections, onConnectionsChange, connectedIds, refresh, refreshSource, forget,
    publishPublicLinks:()=>mirrorPublic(identity()?.uid,current) };
  window.addEventListener('biglwa:orbit-links-synced',()=>{
    if(identity()?.uid)mirrorPublic(identity().uid,current).catch(()=>{});
  });
  return begin(identity());
}

export default { connections, onConnectionsChange, connectedIds, refresh, refreshSource, forget, startConnections };
