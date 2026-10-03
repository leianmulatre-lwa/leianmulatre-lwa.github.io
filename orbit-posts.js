/* BIGLWA Orbit -> Feed persistence
 *
 * Instagram Orbit media is copied into the signed-in member's Big LWA storage and
 * written to the member account, Archive, and Collective Feed. Other Orbit providers may
 * remain draft-first.
 *
 * Each imported item has one root /posts/{postId} record for the collective feed and one
 * /users/{uid}/posts/{postId} record for the member's profile. The two records use the
 * same id so publishing, archiving, and deletion can keep them in step.
 */
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAPUT8_pLNxdh5tbGpAmXBJiID3jVcA9DY",
  authDomain: "biglwa.firebaseapp.com",
  projectId: "biglwa",
  appId: "1:83232670555:web:e04927b20458390b3b507e"
};

const MEDIA_ENDPOINT = 'https://biglwa-instagram-api.leianmulatre-284.workers.dev';

let refs;
async function firebase() {
  if (!refs) {
    const [{ initializeApp, getApps }, store, { getAuth }] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js"),
      import("https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js")
    ]);
    const app = getApps()[0] || initializeApp(FIREBASE_CONFIG);
    refs = {
      db: store.getFirestore(app),
      auth: getAuth(app),
      collection: store.collection,
      doc: store.doc,
      getDoc: store.getDoc,
      setDoc: store.setDoc,
      getDocs: store.getDocs,
      query: store.query,
      where: store.where,
      serverTimestamp: store.serverTimestamp
    };
  }
  return refs;
}

function clean(value) {
  return String(value == null ? "" : value).trim();
}

async function idFor(source, externalId) {
  const raw = source + ":" + externalId;
  const bytes = new TextEncoder().encode(raw);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return "orbit_" + Array.from(digest).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 40);
}

function sourcePostIdFor(item, fallbackUrl) {
  return clean(item.id || item.pk || item.code || item.url || fallbackUrl);
}

function mediaPieces(item) {
  const children = Array.isArray(item?.children?.data)
    ? item.children.data.filter(child => child && (child.media_url || child.thumbnail_url))
    : [];
  return children.length ? children : [item];
}

function mediaFromItem(source, item, hostedMedia) {
  const caption = clean(item.caption || item.title || item.description || "Shared from " + source);
  const fallbackUrl = clean(item.media_url || item.thumbnail_url || item.url);
  const sourcePostId = sourcePostIdFor(item, fallbackUrl);
  const pieces = mediaPieces(item);
  const mediaItems = pieces.map((piece, index) => {
    const originalUrl = clean(piece.media_url || piece.thumbnail_url);
    const hosted = hostedMedia?.get(sourcePostId + ":" + index);
    return {
      index,
      url: hosted || originalUrl,
      thumbnailUrl: hosted || clean(piece.thumbnail_url || piece.media_url),
      mediaType: clean(piece.media_type || item.media_type || "IMAGE").toUpperCase()
    };
  }).filter(piece => piece.url);
  const imageUrls = mediaItems.map(piece => piece.url);
  if (!imageUrls.length) return null;
  return {
    source: source.toLowerCase(),
    sourcePostId,
    caption: caption.slice(0, 500),
    imageUrl: imageUrls[0],
    imageUrls,
    mediaItems,
    sourceUrl: clean(item.permalink || item.share_url || item.url),
    sourceCreatedAt: clean(item.timestamp || item.create_time || item.created_at),
    sourceUsername: clean(item.username || item.author || ""),
    mediaType: clean(item.media_type || item.media_type_name || "IMAGE").toUpperCase()
  };
}

/* Instagram imports are durable account media: the same post is written to the owner's
   profile, Archive, and Collective Feed. Carousel children remain together as one card. */

async function importInstagramMediaToR2(items, user) {
  const session = (() => { try { return localStorage.getItem('biglwaInstagramSession') || ''; } catch { return ''; } })();
  if (!session) throw new Error("Instagram Orbit is connected, but its media session is missing. Reconnect Instagram.");
  const firebaseIdToken = await user.getIdToken();
  if (!firebaseIdToken) throw new Error("Your BIGLWA login expired. Sign in again and reconnect Instagram.");

  const requestItems = [];
  for (const raw of items) {
    const pieces = mediaPieces(raw);
    const fallbackUrl = clean(raw.media_url || raw.thumbnail_url || raw.url);
    const sourcePostId = sourcePostIdFor(raw, fallbackUrl);
    pieces.forEach((piece, index) => {
      const url = clean(piece.media_url || piece.thumbnail_url);
      if (url) {
        requestItems.push({
          sourcePostId,
          index,
          url,
          mediaType: clean(piece.media_type || raw.media_type || "IMAGE").toUpperCase()
        });
      }
    });
  }

  const imported = [];
  const failed = [];
  for (let start = 0; start < requestItems.length; start += 100) {
    const batch = requestItems.slice(start, start + 100);
    const response = await fetch(MEDIA_ENDPOINT + "/media/orbit-import", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + firebaseIdToken,
        "X-Instagram-Session": session
      },
      body: JSON.stringify({ items: batch })
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || "BIGLWA could not save the Instagram media.");
    imported.push(...(Array.isArray(body.imported) ? body.imported : []));
    failed.push(...(Array.isArray(body.failed) ? body.failed : []));
  }

  if (failed.length) {
    const first = failed[0]?.error || "Some Instagram images could not be copied into BIGLWA storage.";
    throw new Error(first + " Reconnect Instagram and try again.");
  }

  const map = new Map();
  imported.forEach(entry => {
    if (entry && entry.sourcePostId != null && entry.index != null && entry.url) {
      map.set(String(entry.sourcePostId) + ":" + String(entry.index), String(entry.url));
    }
  });
  return map;
}

export async function importOrbitMedia(source, items, profile, identityRecord) {
  const { db, auth, doc, setDoc, getDoc, serverTimestamp } = await firebase();
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in to save Orbit imports to your account.");
  if (!Array.isArray(items) || !items.length) return { imported: 0, skipped: 0 };

  const username = clean(identityRecord?.username || user.displayName);
  const authorName = clean(identityRecord?.name || username || profile?.username || profile?.name);
  let imported = 0;
  let skipped = 0;

  let hostedMedia = null;
  if (source.toLowerCase() === "instagram") {
    hostedMedia = await importInstagramMediaToR2(items, user);
  }

  for (const raw of items) {
    const item = mediaFromItem(source, raw, hostedMedia);
    if (!item) { skipped += 1; continue; }

    const postId = await idFor(item.source, item.sourcePostId);
    const rootRef = doc(db, "posts", postId);
    const profileRef = doc(db, "users", user.uid, "posts", postId);
    const archiveRef = doc(db, "users", user.uid, "archive", postId);
    let existing = null;
    try {
      const snap = await getDoc(rootRef);
      if (snap.exists()) existing = snap.data() || {};
    } catch {}

    // Instagram Orbit imports are intentionally live in Collective Feed once the member connects:
    // the same import is also written to the member Archive. Reconnecting updates the
    // existing deterministic post instead of leaving an old draft behind.
    const state = item.source === "instagram" ? "approved" : (existing?.state || "draft");
    const data = {
      uid: user.uid,
      username,
      authorName,
      caption: item.caption,
      imageKey: null,
      imageUrl: item.imageUrl,
      imageKeys: [],
      imageUrls: item.imageUrls,
      mediaItems: item.mediaItems,
      source: item.source,
      sourcePostId: item.sourcePostId,
      sourceUrl: item.sourceUrl || null,
      sourceUsername: item.sourceUsername || clean(profile?.username),
      sourceCreatedAt: item.sourceCreatedAt || null,
      mediaType: item.mediaType,
      orbitImported: true,
      state,
      updatedAt: serverTimestamp()
    };
    if (!existing) data.createdAt = serverTimestamp();

    await setDoc(rootRef, data, { merge: true });
    await setDoc(profileRef, data, { merge: true });
    await setDoc(archiveRef, {
      ...data,
      archiveState: "saved",
      archivedAt: existing?.archivedAt || serverTimestamp()
    }, { merge: true });
    imported += 1;
  }

  try {
    const accountRef = doc(db, "users", user.uid);
    const accountSnap = await getDoc(accountRef);
    const existingAccount = accountSnap.exists() ? accountSnap.data() || {} : {};
    const existingVisibility = existingAccount.archive?.visibility === "friends" ? "friends" : "private";
    await setDoc(accountRef, {
      archive: {
        visibility: existingVisibility,
        instagram: {
          connected: true,
          username: clean(profile?.username),
          mediaCount: items.length,
          syncedAt: serverTimestamp()
        }
      },
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch {}

  return { imported, skipped };
}

export async function loadArchive(ownerUid) {
  const { db, auth, collection, getDocs, doc, setDoc } = await firebase();
  const uid = ownerUid || auth.currentUser?.uid;
  if (!uid) return [];

  /* One-time migration bridge: older builds stored Orbit imports only under
     users/{uid}/posts. Copy those Instagram records into the new Archive location
     before reading it, preserving the existing post id so publishing still works. */
  if (!ownerUid || auth.currentUser?.uid === uid) {
    try {
      const oldSnap = await getDocs(collection(db, "users", uid, "posts"));
      const instagram = oldSnap.docs.filter(d => String(d.data()?.source || "").toLowerCase() === "instagram");
      for (const old of instagram) {
        const data = old.data() || {};
        await setDoc(doc(db, "users", uid, "archive", old.id), {
          ...data,
          archiveState: "saved",
          migratedToArchive: true
        }, { merge: true });
      }
    } catch (error) {
      console.warn("BIGLWA Archive migration:", error);
    }
  }

  const snap = await getDocs(collection(db, "users", uid, "archive"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => {
    const av = a.sourceCreatedAt || "";
    const bv = b.sourceCreatedAt || "";
    return String(bv).localeCompare(String(av));
  });
}

export async function getArchiveSettings() {
  const { db, auth, doc, getDoc } = await firebase();
  const user = auth.currentUser;
  if (!user) return { visibility: "private", friends: [] };
  const snap = await getDoc(doc(db, "users", user.uid));
  const data = snap.exists() ? snap.data() || {} : {};
  return {
    visibility: data.archive?.visibility === "friends" ? "friends" : "private",
    friends: Array.isArray(data.archiveFriends) ? data.archiveFriends : []
  };
}

export async function setArchiveVisibility(visibility) {
  const { db, auth, doc, setDoc, serverTimestamp } = await firebase();
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in to change Archive visibility.");
  const value = visibility === "friends" ? "friends" : "private";
  await setDoc(doc(db, "users", user.uid), {
    archive: { visibility: value },
    updatedAt: serverTimestamp()
  }, { merge: true });
  try {
    const account = await getDoc(doc(db, "users", user.uid));
    const username = clean(account.data()?.usernameLower || account.data()?.username);
    if (username) await setDoc(doc(db, "usernames", username), { archiveVisibility: value, updatedAt: serverTimestamp() }, { merge: true });
  } catch {}
  return value;
}

export async function addArchiveFriend(rawUsername) {
  const { db, auth, doc, getDoc, setDoc, serverTimestamp } = await firebase();
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in to manage Archive friends.");
  const username = clean(rawUsername).replace(/^@/, "").toLowerCase();
  if (!/^[a-z0-9._-]{5,24}$/.test(username)) throw new Error("Enter a valid BIGLWA username.");
  const publicRef = doc(db, "usernames", username);
  const publicSnap = await getDoc(publicRef);
  if (!publicSnap.exists()) throw new Error("That BIGLWA username was not found.");
  const friendUid = clean(publicSnap.data()?.uid);
  if (!friendUid) throw new Error("That profile is not linked to an account yet.");
  if (friendUid === user.uid) throw new Error("You are already the owner of this Archive.");
  const accountRef = doc(db, "users", user.uid);
  const accountSnap = await getDoc(accountRef);
  const current = accountSnap.exists() ? accountSnap.data() || {} : {};
  const friends = Array.isArray(current.archiveFriends) ? current.archiveFriends.slice() : [];
  if (!friends.includes(friendUid)) friends.push(friendUid);
  await setDoc(accountRef, {
    archiveFriends: friends.slice(0, 100),
    updatedAt: serverTimestamp()
  }, { merge: true });
  return { uid: friendUid, username, friends: friends.slice(0, 100) };
}

export async function removeArchiveFriend(rawUsername) {
  const { db, auth, doc, getDoc, setDoc, serverTimestamp } = await firebase();
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in to manage Archive friends.");
  const username = clean(rawUsername).replace(/^@/, "").toLowerCase();
  const publicSnap = await getDoc(doc(db, "usernames", username));
  if (!publicSnap.exists()) throw new Error("That BIGLWA username was not found.");
  const friendUid = clean(publicSnap.data()?.uid);
  const accountRef = doc(db, "users", user.uid);
  const accountSnap = await getDoc(accountRef);
  const current = accountSnap.exists() ? accountSnap.data() || {} : {};
  const friends = (Array.isArray(current.archiveFriends) ? current.archiveFriends : []).filter(uid => uid !== friendUid);
  await setDoc(accountRef, { archiveFriends: friends, updatedAt: serverTimestamp() }, { merge: true });
  return friends;
}

export async function publishOrbitPost(postId) {
  return setOrbitState(postId, "approved");
}

export async function archiveOrbitPost(postId) {
  return setOrbitState(postId, "archived");
}

export async function setOrbitState(postId, state) {
  if (!["draft", "approved", "archived"].includes(state)) throw new Error("Invalid post state.");
  const { db, auth, doc, getDoc, setDoc, serverTimestamp } = await firebase();
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in to manage this post.");
  const rootRef = doc(db, "posts", postId);
  const profileRef = doc(db, "users", user.uid, "posts", postId);
  const snap = await getDoc(rootRef);
  if (!snap.exists()) throw new Error("That post is no longer available.");
  const current = snap.data() || {};
  if (current.uid !== user.uid) throw new Error("You can only manage your own posts.");
  const patch = { state, updatedAt: serverTimestamp() };
  await setDoc(rootRef, patch, { merge: true });
  await setDoc(profileRef, patch, { merge: true });
  await setDoc(doc(db, "users", user.uid, "archive", postId), {
    uid: user.uid,
    state,
    updatedAt: serverTimestamp()
  }, { merge: true });
  return { ...current, ...patch, id: postId };
}

export async function removeOrbitPost(postId) {
  const { db, auth, doc, getDoc, setDoc, serverTimestamp } = await firebase();
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in to manage this post.");
  const rootRef = doc(db, "posts", postId);
  const profileRef = doc(db, "users", user.uid, "posts", postId);
  const snap = await getDoc(rootRef);
  if (!snap.exists()) return;
  const current = snap.data() || {};
  if (current.uid !== user.uid) throw new Error("You can only remove your own posts.");
  /* Keep the account/profile record as an archive so the member's history survives a
     refresh on another device. The collective root is also archived rather than deleted. */
  const patch = { state: "archived", updatedAt: serverTimestamp() };
  await setDoc(rootRef, patch, { merge: true });
  await setDoc(profileRef, patch, { merge: true });
}

window.__biglwaOrbitPosts = {
  importOrbitMedia,
  publishOrbitPost,
  archiveOrbitPost,
  setOrbitState,
  removeOrbitPost,
  loadArchive,
  getArchiveSettings,
  setArchiveVisibility,
  addArchiveFriend,
  removeArchiveFriend
};
