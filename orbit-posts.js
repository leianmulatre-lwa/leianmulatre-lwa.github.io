/* BIGLWA Orbit -> Feed persistence
 *
 * Provider media is imported into the signed-in member's Firestore account as a draft.
 * Nothing from Orbit becomes public just because an account was connected.
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

function mediaFromItem(source, item) {
  const caption = clean(item.caption || item.title || item.description || "Shared from " + source);
  const children = Array.isArray(item?.children?.data)
    ? item.children.data.filter(child => child && (child.media_url || child.thumbnail_url))
    : [];
  const pieces = children.length ? children : [item];
  const mediaItems = pieces.map((piece, index) => ({
    index,
    url: clean(piece.media_url || piece.thumbnail_url),
    thumbnailUrl: clean(piece.thumbnail_url || piece.media_url),
    mediaType: clean(piece.media_type || item.media_type || "IMAGE").toUpperCase()
  })).filter(piece => piece.url);
  const imageUrls = mediaItems.map(piece => piece.url);
  if (!imageUrls.length) return null;
  const sourcePostId = clean(item.id || item.pk || item.code || item.url || imageUrls[0]);
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

/* Imports belong to the owner's Archive first. A Collective Feed copy is still created,
   but it stays draft until the owner explicitly posts it. Carousel children remain together
   so the owner can publish the original post as one multi-image feed card. */
export async function importOrbitMedia(source, items, profile, identityRecord) {
  const { db, auth, doc, setDoc, getDoc, serverTimestamp } = await firebase();
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in to save Orbit imports to your account.");
  if (!Array.isArray(items) || !items.length) return { imported: 0, skipped: 0 };

  const username = clean(identityRecord?.username || user.displayName);
  const authorName = clean(identityRecord?.name || username || profile?.username || profile?.name);
  let imported = 0;
  let skipped = 0;

  for (const raw of items) {
    const item = mediaFromItem(source, raw);
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

    const state = existing?.state || "draft";
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
    await setDoc(doc(db, "users", user.uid), {
      archive: {
        visibility: "private",
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
  const { db, auth, collection, getDocs } = await firebase();
  const uid = ownerUid || auth.currentUser?.uid;
  if (!uid) return [];
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
