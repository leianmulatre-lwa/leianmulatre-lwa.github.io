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
      deleteDoc: store.deleteDoc,
      getDocs: store.getDocs,
      query: store.query,
      where: store.where,
      orderBy: store.orderBy,
      limit: store.limit,
      writeBatch: store.writeBatch,
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
    const slot = sourcePostId + ":" + index;
    const hosted = hostedMedia?.urls?.get(slot);
    return {
      index,
      url: hosted || originalUrl,
      /* The Worker already stores Orbit media under orbit/<uid>/<name> and returns that
         owner-scoped key. It used to be discarded here, which left Firestore holding only
         a borrowed Instagram URL and no way to tie a picture back to the account that owns
         it. Keeping the key is what lets a later retrieval or ranking pass enumerate an
         account's own media straight from storage. */
      key: hostedMedia?.keys?.get(slot) || null,
      thumbnailUrl: hosted || clean(piece.thumbnail_url || piece.media_url),
      mediaType: clean(piece.media_type || item.media_type || "IMAGE").toUpperCase()
    };
  }).filter(piece => piece.url);
  const imageUrls = mediaItems.map(piece => piece.url);
  const imageKeys = mediaItems.map(piece => piece.key).filter(Boolean);
  if (!imageUrls.length) return null;
  return {
    source: source.toLowerCase(),
    sourcePostId,
    caption: caption.slice(0, 500),
    imageUrl: imageUrls[0],
    imageUrlKey: imageKeys[0] || null,
    imageUrls,
    imageKeys,
    mediaItems,
    sourceUrl: clean(item.permalink || item.share_url || item.url),
    sourceCreatedAt: clean(item.timestamp || item.create_time || item.created_at),
    sourceCreatedAtMs: sourceTimeMs(item.timestamp ?? item.create_time ?? item.created_at),
    sourceUsername: clean(item.username || item.author || ""),
    mediaType: clean(item.media_type || item.media_type_name || "IMAGE").toUpperCase()
  };
}

/* Instagram imports are durable account media: the same post is written to the owner's
   profile, Archive, and Collective Feed. Carousel children remain together as one card. */

/* ---- Shared helpers -------------------------------------------------------
   These three existed inline in three different files with three different
   behaviours, which is how the owner attribution and the ordering drifted apart.
   They live here now so every writer and reader agrees. */

/* Source timestamps arrive in three shapes depending on which Orbit provider and
   which endpoint produced them: ISO-8601 (Instagram Graph), Unix seconds as a
   number or numeric string (the internal feed endpoints), and Unix milliseconds.
   Date.parse() returns NaN for a bare numeric string, so an epoch-seconds post used
   to collapse to 0 and sort as if it were infinitely old. Every reader now funnels
   through this one function and orders on a stored numeric field. */
export function sourceTimeMs(value) {
  if (value == null) return 0;
  if (typeof value.toMillis === "function") { try { return value.toMillis(); } catch { return 0; } }
  if (value instanceof Date) { const ms = value.getTime(); return Number.isFinite(ms) ? ms : 0; }
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value <= 0) return 0;
    return value > 1e12 ? value : value * 1000;
  }
  const text = String(value).trim();
  if (!text) return 0;
  if (/^\d+$/.test(text)) {
    const n = Number(text);
    return n > 1e12 ? n : n * 1000;
  }
  const parsed = Date.parse(text);
  return Number.isFinite(parsed) ? parsed : 0;
}

/* Every card carries the same owner identity fields so the Collective Feed, the Archive,
   a profile page, and any future search or ranking pass can attribute and group a card
   without a second lookup. `usernameLower` is the join key used elsewhere in the app. */
async function resolveOwner(user, identityRecord, profile) {
  const username = clean(identityRecord?.username || profile?.username || user.displayName);
  const authorName = clean(identityRecord?.name || identityRecord?.displayName || profile?.name || username);
  let usernameLower = clean(identityRecord?.usernameLower || username).replace(/^@/, "").toLowerCase();
  if (!usernameLower) {
    try {
      const { db: rdb, doc: rdoc, getDoc: rgetDoc } = await firebase();
      const snap = await rgetDoc(rdoc(rdb, "users", user.uid));
      if (snap.exists()) {
        const account = snap.data() || {};
        usernameLower = clean(account.usernameLower || account.username).replace(/^@/, "").toLowerCase();
      }
    } catch {}
  }
  return { uid: user.uid, username, usernameLower, authorName };
}

/* One post is stored in three places by design: /posts/{id} is the canonical record the
   public Collective Feed reads, and users/{uid}/posts/{id} plus users/{uid}/archive/{id}
   are per-owner indexes so an account can retrieve everything it owns cheaply and in
   step. All three previously had separate ad-hoc write code in three files, so they
   drifted: the collective publisher never wrote the Archive, and the feed renderer
   wrote /posts back from a reader. Every write now goes through this function, which
   also commits all three in a single batch so a partial failure cannot leave the
   paths disagreeing. */
function postRefs(store, uid, postId) {
  return {
    root: store.doc(store.db, "posts", postId),
    profile: store.doc(store.db, "users", uid, "posts", postId),
    archive: store.doc(store.db, "users", uid, "archive", postId)
  };
}

/* Each path is committed on its own, owner indexes first and the canonical record last.
   These three used to share one writeBatch, which is all-or-nothing: if the deployed rules
   denied a single path, commit() rejected and the card was saved nowhere at all, so the
   Collective Feed, the profile and the Archive all stayed empty together. Writing them
   independently means a rule that has not been updated yet costs one index instead of the
   whole card, and the feed repair pass can still promote a profile hit into /posts. */
async function writePostRecords(store, uid, postId, data, archiveExtra = {}) {
  const refs = postRefs(store, uid, postId);
  const targets = [
    ["archive", refs.archive, { ...data, ...archiveExtra }],
    ["profile", refs.profile, data],
    ["root", refs.root, data]
  ];
  const denied = [];
  for (const [label, ref, payload] of targets) {
    try {
      await store.setDoc(ref, payload, { merge: true });
    } catch (error) {
      denied.push(label);
      console.warn("BIGLWA post write denied (" + label + "):", error);
    }
  }
  if (denied.length === targets.length) {
    const failure = new Error("BIGLWA could not save this card to your account.");
    failure.code = "post-write-failed";
    failure.denied = denied;
    throw failure;
  }
  if (denied.length) console.warn("BIGLWA post saved to some paths only; denied:", denied.join(", "));
  return { refs, denied };
}

/* Per-owner index doc. The app already needs "everything this account has published"
   for the Archive count and the profile header; keeping a single small counter doc means
   a future retrieval or ranking algorithm does not have to fan out across every post to
   learn what an account owns and what kind of media it holds. */
async function bumpOwnerIndex(store, uid, owner, incoming) {
  const ref = store.doc(store.db, "users", uid, "index", "media");
  try {
    const snap = await store.getDoc(ref);
    const current = snap.exists() ? snap.data() || {} : {};
    const counts = { ...(current.counts || {}) };
    const incomingCount = Object.keys(incoming || {}).length;
    if (incomingCount) counts[incoming] = (counts[incoming] || 0) + 1;
    await store.setDoc(ref, {
      uid,
      username: owner.username,
      usernameLower: owner.usernameLower,
      counts,
      lastImportedAt: store.serverTimestamp(),
      updatedAt: store.serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.warn("BIGLWA owner index:", error);
  }
}

/* The R2 copy is an enhancement, not a precondition for persistence.
   mediaFromItem() already falls back to each item's original source URL whenever this map
   has no hosted entry, so a missing or failing media endpoint must return null instead of
   throwing. Throwing here aborted the whole import before a single Firestore write, which
   left the Collective Feed, the member profile, and the Archive empty and left other
   devices with nothing to load. */
async function importInstagramMediaToR2(items, user) {
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
  for (let start = 0; start < requestItems.length; start += 100) {
    const batch = requestItems.slice(start, start + 100);
    let response;
    try {
      response = await fetch(MEDIA_ENDPOINT + "/media/orbit-import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + firebaseIdToken,
          "X-Instagram-Session": (() => { try { return localStorage.getItem('biglwaInstagramSession') || ''; } catch { return ''; } })()
        },
        body: JSON.stringify({ items: batch })
      });
    } catch (error) {
      console.warn("BIGLWA Orbit media copy:", error);
      return null;
    }
    if (!response.ok) {
      console.warn("BIGLWA Orbit media copy:", response.status);
      return null;
    }
    const body = await response.json().catch(() => ({}));
    imported.push(...(Array.isArray(body.imported) ? body.imported : []));
  }

  const map = { urls: new Map(), keys: new Map() };
  imported.forEach(entry => {
    if (entry && entry.sourcePostId != null && entry.index != null && entry.url) {
      const slot = String(entry.sourcePostId) + ":" + String(entry.index);
      map.urls.set(slot, String(entry.url));
      if (entry.key) map.keys.set(slot, String(entry.key));
    }
  });
  return map;
}

export async function importOrbitMedia(source, items, profile, identityRecord) {
  const store = await firebase();
  const { db, auth, getDoc, serverTimestamp } = store;
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in to save Orbit imports to your account.");
  if (!Array.isArray(items) || !items.length) return { imported: 0, skipped: 0, partial: 0, warning: "" };

  /* Resolved once per import rather than per card, and it falls back to the account doc so
     a card can never be written with an empty owner just because the identity module had
     not finished booting. */
  const owner = await resolveOwner(user, identityRecord, profile);
  let imported = 0;
  let skipped = 0;
  let partial = 0;

  let hostedMedia = null;
  let warning = "";
  if (source.toLowerCase() === "instagram") {
    hostedMedia = await importInstagramMediaToR2(items, user);
    if (!hostedMedia || !hostedMedia.urls.size) {
      warning = "Orbit media is linked from Instagram instead of copied into BIGLWA storage, so some pictures can stop loading when Instagram retires the link.";
    }
  }

  for (const raw of items) {
    const item = mediaFromItem(source, raw, hostedMedia);
    if (!item) { skipped += 1; continue; }

    const postId = await idFor(item.source, item.sourcePostId);
    const refs = postRefs(store, user.uid, postId);
    let existing = null;
    let existingArchive = null;
    try {
      const snap = await getDoc(refs.root);
      if (snap.exists()) existing = snap.data() || {};
    } catch {}
    try {
      const snap = await getDoc(refs.archive);
      if (snap.exists()) existingArchive = snap.data() || {};
    } catch {}

    /* First import is live in Collective Feed. Once the owner has changed that card's
       state, a reconnect must respect the saved lifecycle rather than silently undoing it. */
    const priorArchiveState = clean(existingArchive?.archiveState);
    const priorState = clean(existing?.state || existingArchive?.state);
    const preservedDeleteAt = existingArchive?.deletionAt || existing?.deletionAt || null;
    const state = priorArchiveState === "pending_delete"
      ? "archived"
      : priorArchiveState === "archived" || priorState === "archived"
        ? "archived"
        : item.source === "instagram"
          ? "approved"
          : (existing?.state || "draft");
    const archiveState = priorArchiveState === "pending_delete"
      ? "pending_delete"
      : priorArchiveState === "archived" || priorState === "archived"
        ? "archived"
        : state === "approved"
          ? "collective"
          : "saved";
    const data = {
      uid: owner.uid,
      username: owner.username,
      usernameLower: owner.usernameLower,
      authorName: owner.authorName,
      caption: item.caption,
      imageKey: item.imageUrlKey,
      imageUrl: item.imageUrl,
      imageKeys: item.imageKeys,
      imageUrls: item.imageUrls,
      mediaItems: item.mediaItems,
      source: item.source,
      sourcePostId: item.sourcePostId,
      sourceUrl: item.sourceUrl || null,
      sourceUsername: item.sourceUsername || clean(profile?.username),
      sourceCreatedAt: item.sourceCreatedAt || null,
      /* Stored numerically so every reader orders on the same real value. Sorting on the
         raw string is what put newest Instagram cards in the wrong order. */
      sourceCreatedAtMs: item.sourceCreatedAtMs || 0,
      mediaType: item.mediaType,
      orbitImported: true,
      state,
      archiveState,
      deletionAt: preservedDeleteAt,
      updatedAt: serverTimestamp()
    };
    if (!existing) data.createdAt = serverTimestamp();

    const written = await writePostRecords(store, user.uid, postId, data, {
      archiveState,
      archivedAt: archiveState === "collective" ? null : (existingArchive?.archivedAt || serverTimestamp()),
      deletionAt: preservedDeleteAt
    });
    if (written.denied.length) partial += 1;
    await bumpOwnerIndex(store, user.uid, owner, item.source);
    imported += 1;
  }

  try {
    const accountRef = store.doc(db, "users", user.uid);
    const accountSnap = await getDoc(accountRef);
    const existingAccount = accountSnap.exists() ? accountSnap.data() || {} : {};
    const existingVisibility = existingAccount.archive?.visibility === "friends" ? "friends" : "private";
    await store.setDoc(accountRef, {
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

  if (partial) {
    warning = (warning ? warning + " " : "")
      + partial + " card" + (partial === 1 ? "" : "s")
      + " could not be written to every list. Your BIGLWA security rules still need publishing.";
  }

  return { imported, skipped, partial, warning };
}

export async function loadArchive(ownerUid) {
  /* getDoc was missing from this destructure. The migration block below calls it, so the
     whole load threw "getDoc is not defined", the catch swallowed it as a warning, and the
     Archive silently stayed empty for every account whose Instagram posts predated the
     Archive collection. That was the actual reason imported media never appeared there. */
  const store = await firebase();
  const { db, auth, collection, getDocs, query, doc, getDoc, setDoc, deleteDoc, orderBy, limit } = store;
  const uid = ownerUid || auth.currentUser?.uid;
  if (!uid) return [];

  if (!ownerUid || auth.currentUser?.uid === uid) {
    try {
      const oldSnap = await getDocs(collection(db, "users", uid, "posts"));
      const instagram = oldSnap.docs.filter(d => String(d.data()?.source || "").toLowerCase() === "instagram");
      for (const old of instagram) {
        const data = old.data() || {};
        const archiveRef = doc(db, "users", uid, "archive", old.id);
        const archiveSnap = await getDoc(archiveRef);
        if (archiveSnap.exists()) continue;
        await setDoc(archiveRef, {
          ...data,
          archiveState: data.archiveState
            || (data.state === "approved" ? "collective" : data.state === "archived" ? "archived" : "saved"),
          migratedToArchive: true
        }, { merge: true });
      }
    } catch (error) {
      console.warn("BIGLWA Archive migration:", error);
    }
  }

  /* Ordered by the stored numeric source time so the newest card is genuinely first.
     Sorted on the raw string before, which mis-ordered epoch-seconds timestamps and put
     cards with no timestamp at an arbitrary point. */
  let snap;
  try {
    snap = await getDocs(query(
      collection(db, "users", uid, "archive"),
      orderBy("sourceCreatedAtMs", "desc"),
      limit(300)
    ));
  } catch (error) {
    /* Documents written before the numeric field existed are not returned by an
       orderBy on that field, so fall back to the unfiltered read rather than showing
       an empty Archive. */
    console.warn("BIGLWA Archive ordered read:", error);
    snap = await getDocs(collection(db, "users", uid, "archive"));
  }
  const now = Date.now();
  const rows = [];
  for (const d of snap.docs) {
    const data = d.data() || {};
    const deletionAt = data.deletionAt;
    const deletionMs = typeof deletionAt?.toMillis === "function"
      ? deletionAt.toMillis()
      : (deletionAt instanceof Date ? deletionAt.getTime() : Date.parse(deletionAt || ""));
    if (data.archiveState === "pending_delete" && Number.isFinite(deletionMs) && deletionMs <= now && (!ownerUid || auth.currentUser?.uid === uid)) {
      try {
        await deleteDoc(doc(db, "posts", d.id));
        await deleteDoc(doc(db, "users", uid, "posts", d.id));
        await deleteDoc(doc(db, "users", uid, "archive", d.id));
      } catch (error) {
        console.warn("BIGLWA Archive expired deletion:", error);
        rows.push({ id: d.id, ...data });
      }
      continue;
    }
    rows.push({
      id: d.id,
      ...data,
      archiveState: data.archiveState
        || (data.state === "approved" ? "collective" : data.state === "archived" ? "archived" : "saved")
    });
  }
  return rows.sort((a, b) => archiveTimeMs(b) - archiveTimeMs(a));
}

/* Newest first: the source's own time when it is known, otherwise when the card was
   imported. Falling back keeps undated cards from jumping to the top of the Archive. */
function archiveTimeMs(row) {
  return Number(row?.sourceCreatedAtMs) || sourceTimeMs(row?.sourceCreatedAt) || 0;
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
  if (!["draft", "approved", "archived", "pending_delete"].includes(state)) throw new Error("Invalid post state.");
  const store = await firebase();
  const { db, auth, getDoc, serverTimestamp } = store;
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in to manage this post.");

  const refs = postRefs(store, user.uid, postId);
  const snap = await getDoc(refs.root);
  if (!snap.exists()) throw new Error("That post is no longer available.");
  const current = snap.data() || {};
  if (current.uid !== user.uid) throw new Error("You can only manage your own posts.");

  const archiveSnap = await getDoc(refs.archive);
  const archiveCurrent = archiveSnap.exists() ? archiveSnap.data() || {} : {};
  let deletionAt = archiveCurrent.deletionAt || current.deletionAt || null;
  if (state === "pending_delete" && !deletionAt) deletionAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  if (state !== "pending_delete") deletionAt = null;

  const archiveState = state === "approved"
    ? "collective"
    : state === "archived"
      ? "archived"
      : state === "pending_delete"
        ? "pending_delete"
        : (archiveCurrent.archiveState || "saved");

  const persistedState = state === "pending_delete" ? "archived" : state;
  const patch = { state: persistedState, deletionAt, updatedAt: serverTimestamp() };

  /* The owner identity fields are re-stamped here as well. Older cards were written
     without usernameLower, so publishing one left a card in the Collective Feed that
     nothing could attribute to an account. */
  const owner = await resolveOwner(user, { username: current.username, name: current.authorName }, null);
  const full = {
    ...patch,
    uid: user.uid,
    username: current.username || owner.username,
    usernameLower: current.usernameLower || owner.usernameLower,
    authorName: current.authorName || owner.authorName
  };

  await writePostRecords(store, user.uid, postId, full, {
    archiveState,
    archivedAt: archiveState === "archived" || archiveState === "pending_delete"
      ? (archiveCurrent.archivedAt || serverTimestamp())
      : null
  });

  return { ...current, ...full, requestedState: state, archiveState, id: postId };
}

export async function removeOrbitPost(postId) {
  return setOrbitState(postId, "pending_delete");
}

/* Public entry point for the other writers. collective-publish.js and feed-view.js each
   had their own partial copy of this write, which is how a card could end up in the
   Collective Feed but missing from the Archive, or carry no owner at all. They now call
   this, so there is exactly one definition of what a post write means. */
export async function savePostRecords(ownerUid, postId, data, archiveExtra = {}) {
  const store = await firebase();
  const uid = ownerUid || store.auth.currentUser?.uid;
  if (!uid) throw new Error("Sign in to save this post.");
  if (String(data?.uid || "") !== uid) throw new Error("A post can only be saved to its owner's account.");
  const owner = await resolveOwner(store.auth.currentUser, data, null);
  const payload = {
    ...data,
    uid,
    username: clean(data.username) || owner.username,
    usernameLower: clean(data.usernameLower) || owner.usernameLower,
    authorName: clean(data.authorName) || owner.authorName
  };
  await writePostRecords(store, uid, postId, payload, archiveExtra);
  return payload;
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
  removeArchiveFriend,
  savePostRecords,
  sourceTimeMs
};
