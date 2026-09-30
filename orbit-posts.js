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
  const image = clean(item.media_url || item.thumbnail_url || item.image || item.image_url);
  if (!image) return null;
  return {
    source: source.toLowerCase(),
    sourcePostId: clean(item.id || item.pk || item.code || item.url || image),
    caption: caption.slice(0, 500),
    imageUrl: image,
    imageUrls: [image],
    sourceUrl: clean(item.permalink || item.share_url || item.url),
    sourceCreatedAt: clean(item.timestamp || item.create_time || item.created_at),
    sourceUsername: clean(item.username || item.author || ""),
    mediaType: clean(item.media_type || item.media_type_name || "IMAGE").toUpperCase()
  };
}

/* Saves provider media without ever making it public. Re-running Orbit is idempotent:
   the provider id hashes to the same Firestore document, so another device sees the same
   draft rather than creating a second copy. */
export async function importOrbitMedia(source, items, profile, identityRecord) {
  const { db, auth, doc, setDoc, getDoc, serverTimestamp } = await firebase();
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in to save Orbit imports to your feed.");
  if (!Array.isArray(items) || !items.length) return { imported: 0, skipped: 0 };

  const username = clean(identityRecord?.username);
  const authorName = clean(identityRecord?.name || username || profile?.username || profile?.name);
  let imported = 0;
  let skipped = 0;

  for (const raw of items.slice(0, 40)) {
    const item = mediaFromItem(source, raw);
    if (!item) { skipped += 1; continue; }

    const postId = await idFor(item.source, item.sourcePostId);
    const rootRef = doc(db, "posts", postId);
    const profileRef = doc(db, "users", user.uid, "posts", postId);
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

    /* Root post + account post are written separately but with the same deterministic id.
       If the second write fails, a later Orbit refresh repairs it rather than duplicating
       the import. */
    await setDoc(rootRef, data, { merge: true });
    await setDoc(profileRef, data, { merge: true });
    imported += 1;
  }

  return { imported, skipped };
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
  removeOrbitPost
};
