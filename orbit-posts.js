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
      startAfter: store.startAfter,
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

function pinterestImageUrl(item) {
  const images = item?.media?.images || item?.media?.items?.[0]?.images || item?.images || {};
  const candidates = [
    images["600x"], images["400x300"], images["237x"], images.originals,
    images.original, ...Object.values(images),
    item?.image_url, item?.imageUrl, item?.image?.url,
    item?.media?.cover_image_url, item?.media?.image_url,
    item?.thumbnail_url, item?.media_url
  ];
  for (const entry of candidates) {
    const value = clean(typeof entry === "string" ? entry : entry?.url || entry?.src);
    try {
      const image = new URL(value);
      if (image.protocol === "https:" &&
          (image.hostname === "i.pinimg.com" || image.hostname.endsWith(".pinimg.com"))) {
        return image.href;
      }
    } catch { /* An invalid candidate is not a preview image. */ }
  }
  return "";
}
function mediaPieces(item, source = '') {
  const children = Array.isArray(item?.children?.data)
    ? item.children.data.filter(child => child && (child.media_url || child.thumbnail_url))
    : [];
  if (children.length) return children;
  if (source === "pinterest" || String(item?.source || "").toLowerCase() === "pinterest" || item?.media?.images || item?.media?.items?.[0]?.images || item?.image_url || item?.imageUrl || item?.images) {
    const src = pinterestImageUrl(item);
    return src ? [{ media_url: src, thumbnail_url: src, media_type: "IMAGE" }] : [];
  }
  return [item];
}

/* A carousel can mix stills and video, and a video's media_url is an .mp4. Those used to be
   written into imageUrls along with the pictures, and every reader puts imageUrls straight
   into an <img src>, so a video child became a broken image icon. A piece is only a picture
   when it says so, and a video contributes its poster so there is always something that can
   actually be drawn. */
function isPicturePiece(piece, parent) {
  const type = clean(piece?.media_type || parent?.media_type || "IMAGE").toUpperCase();
  if (type === "VIDEO" || type === "REELS" || type === "IGTV") return false;
  const url = clean(piece?.media_url || piece?.thumbnail_url || "");
  return !/\.(mp4|mov|m4v|webm)(\?|$)/i.test(url);
}
function isStoredOrbitUrl(url) {
  try {
    const parsed = new URL(String(url||''));
    return parsed.protocol==='https:' &&
      parsed.hostname==='biglwa-instagram-api.leianmulatre-284.workers.dev' &&
      /^\/media\/orbit\/[A-Za-z0-9_-]+\//.test(parsed.pathname);
  } catch { return false; }
}
function mediaFromItem(source, item, hostedMedia) {
  const normalizedSource = String(source || "").toLowerCase();
  const caption = clean(item.caption || item.title || item.description || item.alt_text || "Shared from " + source);
  const pinterestUrl = normalizedSource === "pinterest" ? pinterestImageUrl(item) : "";
  const fallbackUrl = normalizedSource === "pinterest" ? (pinterestUrl || clean(item.url)) : clean(item.media_url || item.thumbnail_url || item.url);
  const sourcePostId = sourcePostIdFor(item, fallbackUrl);
  const pieces = mediaPieces(item, normalizedSource);
  const mediaItems = pieces.map((piece, index) => {
    const picture = isPicturePiece(piece, item);
    const originalUrl = clean(picture ? (piece.media_url || piece.thumbnail_url) : (piece.thumbnail_url || piece.media_url));
    const slot = sourcePostId + ":" + index;
    const hosted = clean(hostedMedia?.urls?.get(slot));
    // Never store an expiring social CDN URL as a permanent Orbit image.
    // An uncopied item stays in the provider list for a future retry, but not
    // as a broken card in Collective Feed/Archive/Studio.
    const durable = ['instagram','pinterest'].includes(normalizedSource);
    if (durable && !hosted) return null;
    const poster = clean(hosted || piece.thumbnail_url || "");
    return {
      index,
      isPicture: picture || (!picture && !!piece.thumbnail_url && !!hosted),
      url: hosted || originalUrl,
      /* The Worker already stores Orbit media under orbit/<uid>/<name> and returns that
         owner-scoped key. It used to be discarded here, which left Firestore holding only
         a borrowed Instagram URL and no way to tie a picture back to the account that owns
         it. Keeping the key is what lets a later retrieval or ranking pass enumerate an
         account's own media straight from storage. */
      key: hostedMedia?.keys?.get(slot) || null,
      thumbnailUrl: poster || (picture ? hosted || originalUrl : ""),
      mediaType: clean(piece.media_type || item.media_type || "IMAGE").toUpperCase()
    };
  }).filter(piece => piece && piece.url);
  /* imageUrls is pictures only, so a feed card, the preview and the Archive never point an
     <img> at a video file. */
  const imageUrls = mediaItems.filter(piece => piece.isPicture && piece.thumbnailUrl)
    .map(piece => pictureSrc(piece));
  const imageKeys = mediaItems.filter(piece => piece.isPicture)
    .map(piece => piece.key).filter(Boolean);
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
/* A picture is drawn from its poster when it has one, so the hosted copy of a video's poster
   is preferred over re-fetching the short-lived Instagram CDN link. */
function pictureSrc(piece) {
  if (piece.isPicture && piece.thumbnailUrl && piece.thumbnailUrl !== piece.url) {
    return piece.thumbnailUrl;
  }
  return piece.url;
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
    const incomingKey = String(incoming || "").toLowerCase();
    // Count new records from the source only if not already represented.
    // This is informational; the Archive collection is the authoritative source.
    if (incomingKey) counts[incomingKey] = Math.max(Number(counts[incomingKey])||0,1);
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
async function importInstagramMediaToR2(items, user, source = 'instagram') {
  // The Firebase account and the linked external service have different
  // lifetimes. Token retrieval/network failures must not imply the member
  // signed out just because a Pinterest grant expired.
  let firebaseIdToken = '';
  try { firebaseIdToken = await user.getIdToken(); }
  catch (error) { console.warn('BIG LWA media token retrieval delayed:', error); }
  if (!firebaseIdToken) throw new Error("BIG LWA media authorization is temporarily unavailable. Your session was not signed out.");

  const requestItems = [];
  for (const raw of items) {
    const pieces = mediaPieces(raw, source);
    const fallbackUrl = source === 'pinterest' ? (pinterestImageUrl(raw) || clean(raw.url)) : clean(raw.media_url || raw.thumbnail_url || raw.url);
    const sourcePostId = sourcePostIdFor(raw, fallbackUrl);
    pieces.forEach((piece, index) => {
      // Video thumbnails belong in the image cache; copying the full MP4 wastes
      // the import request and cannot be displayed in an <img> preview.
      const video = !isPicturePiece(piece, raw);
      const url = clean(video ? piece.thumbnail_url : (piece.media_url || piece.thumbnail_url));
      if (url) {
        requestItems.push({
          sourcePostId,
          index,
          url,
          mediaType: video ? "IMAGE" : clean(piece.media_type || raw.media_type || "IMAGE").toUpperCase()
        });
      }
    });
  }

  const imported = [];
  let failedBatches = 0;
  // Small requests avoid Worker request timeouts: copying 100 remote CDN images
  // sequentially used to abort the batch and leave the feed with expiring URLs.
  for (let start = 0; start < requestItems.length; start += 10) {
    const batch = requestItems.slice(start, start + 10);
    let response;
    try {
      response = await fetch(MEDIA_ENDPOINT + "/media/orbit-import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + firebaseIdToken,
          "X-Orbit-Provider": source === 'pinterest' ? 'pinterest' : 'instagram',
          ...(source === 'pinterest'
            ? { "X-Pinterest-Session": (() => {
                const key='biglwaPinterestSession:'+user.uid;
                for(const store of [localStorage,sessionStorage]){try{const value=store.getItem(key);if(value)return value;}catch{}}
                return '';
              })() }
            : { "X-Instagram-Session": (() => {
                // The credential belongs to the signed-in Firebase member, never
                // to the last person who happened to use this browser.
                const key='biglwaInstagramSession:'+user.uid;
                for(const store of [localStorage,sessionStorage]){
                  try{const value=store.getItem(key);if(value)return value}catch{}
                }
                return '';
              })() })
        },
        body: JSON.stringify({ items: batch })
      });
    } catch (error) {
      /* One bad batch must not throw away the batches around it. Instagram feeds often
         carry a single unreachable video among dozens of fine pictures, and abandoning the
         rest meant a whole page of cards kept temporary links with no warning. */
      console.warn("BIGLWA Orbit media copy:", error);
      failedBatches += 1;
      continue;
    }
    if (!response.ok) {
      console.warn("BIGLWA Orbit media copy:", response.status);
      failedBatches += 1;
      continue;
    }
    const body = await response.json().catch(() => ({}));
    const batchImported = Array.isArray(body.imported) ? body.imported : [];
    if (batchImported.length < batch.length) failedBatches += 1;
    imported.push(...batchImported);
  }

  const map = { urls: new Map(), keys: new Map(), missing: 0, failedBatches };
  const requested = new Set();
  requestItems.forEach(item => requested.add(String(item.sourcePostId) + ":" + String(item.index)));
  imported.forEach(entry => {
    if (entry && entry.sourcePostId != null && entry.index != null && entry.url) {
      const slot = String(entry.sourcePostId) + ":" + String(entry.index);
      map.urls.set(slot, String(entry.url));
      if (entry.key) map.keys.set(slot, String(entry.key));
    }
  });
  map.missing = Math.max(0, requested.size - map.urls.size);
  return map;
}

export async function storedOrbitImageUrls(source = '') {
  const store=await firebase();
  await store.auth.authStateReady();
  const uid=store.auth.currentUser?.uid;
  if(!uid)return {};
  const expected=clean(source).toLowerCase();
  const result={};
  // Read only the account owner's existing post indexes, not other users' data.
  // R2 URLs are reconstructed from durable keys as well as saved media URLs.
  try{
    // Saved R2 copies may exist in Archive even when a post has never been
    // published to Collective Feed. Reading only /posts hid those pictures.
    const paths=['posts','archive'];
    for(const path of paths){
      const snap=await store.getDocs(store.query(store.collection(store.db,'users',uid,path),store.limit(500)));
      for(const doc of snap.docs){
      const post=doc.data()||{};
      if(expected&&clean(post.source).toLowerCase()!==expected)continue;
      const id=clean(post.sourcePostId);
      if(!id)continue;
      const urls=[];
      const add=value=>{
        const url=clean(value);
        if(isStoredOrbitUrl(url)&&!urls.includes(url))urls.push(url);
      };
      const fromKey=key=>{
        const value=clean(key).replace(/^orbit\//,'');
        if(!/^[A-Za-z0-9_-]+\/[A-Za-z0-9._-]+$/.test(value))return;
        add(MEDIA_ENDPOINT+'/media/orbit/'+value);
      };
      for(const piece of (Array.isArray(post.mediaItems)?post.mediaItems:[])){
        if(!piece||piece.isPicture===false)continue;
        add(piece.url);add(piece.thumbnailUrl);fromKey(piece.key);
      }
      for(const url of (Array.isArray(post.imageUrls)?post.imageUrls:[]))add(url);
      for(const key of (Array.isArray(post.imageKeys)?post.imageKeys:[]))fromKey(key);
      add(post.imageUrl);fromKey(post.imageUrlKey);
      if(urls.length)result[id]=[...new Set([...(result[id]||[]),...urls])];
      }
    }
  }catch(error){console.warn('BIGLWA stored media restore:',error)}
  return result;
}

export async function importOrbitMedia(source, items, profile, identityRecord) {
  const store = await firebase();
  const { db, auth, getDoc, serverTimestamp } = store;
  // A slow Firebase restore is not a sign-out. Wait for the authoritative
  // account state, independently of the Pinterest token/connection status.
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in to Big LWA to save account media. Connecting Pinterest is not required.");
  if (!Array.isArray(items) || !items.length) return { imported: 0, skipped: 0, partial: 0, warning: "" };

  /* Resolved once per import rather than per card, and it falls back to the account doc so
     a card can never be written with an empty owner just because the identity module had
     not finished booting. */
  const owner = await resolveOwner(user, identityRecord, profile);
  let imported = 0;
  let skipped = 0;
  let partial = 0;
  let copyFailures = 0;

  let hostedMedia = null;
  let warning = "";
  if (['instagram','pinterest'].includes(source.toLowerCase())) {
    try {
      hostedMedia = await importInstagramMediaToR2(items, user, source.toLowerCase());
    } catch (error) {
      console.warn('BIGLWA Orbit image copy:',error);
      hostedMedia = null;
    }
    const notCopied = hostedMedia ? (hostedMedia.missing || 0) : items.length;
    copyFailures = notCopied;
    if (!hostedMedia || !hostedMedia.urls.size) {
      warning = source + ' images could not be stored in BIGLWA. They were not republished with temporary links; reconnect Orbit and retry syncing once permissions are available.';
    } else if (notCopied > 0) {
      warning = notCopied + ' ' + source + ' image' + (notCopied === 1 ? '' : 's') + ' could not be copied into BIGLWA storage. Only successfully hosted images were saved; reconnect to retry the rest.';
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

    /* Pinterest imports are private drafts until explicitly published; Instagram retains its existing behavior. Once the owner has changed that card's
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
    // A healthy existing R2 copy must never be replaced by a failed/partial
    // refresh (which previously reintroduced expired third-party URLs).
    const managedExisting = Array.isArray(existing?.imageUrls) ? existing.imageUrls.filter(url=>isStoredOrbitUrl(url)) : [];
    if(managedExisting.length && managedExisting.length >= item.imageUrls.length) {
      item.imageUrls=managedExisting;
      item.imageUrl=managedExisting[0];
      item.imageKeys=Array.isArray(existing.imageKeys)?existing.imageKeys:[];
      item.imageUrlKey=existing.imageUrlKey||null;
      item.mediaItems=Array.isArray(existing.mediaItems)?existing.mediaItems:item.mediaItems;
    }
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

    if (auth.currentUser?.uid !== user.uid) throw new Error('Account changed during Orbit import. Sign in to the correct account and retry.');
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
    const sourceKey = String(source || "").toLowerCase();
    const archiveUpdate = {
      visibility: existingVisibility,
      updatedAt: serverTimestamp()
    };
    archiveUpdate[sourceKey] = {
      connected: true,
      username: clean(profile?.username),
      mediaCount: items.length,
      syncedAt: serverTimestamp()
    };
    await store.setDoc(accountRef, {
      archive: archiveUpdate,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch {}

  if (skipped && ['instagram','pinterest'].includes(source.toLowerCase())) {
    warning += (warning ? ' ' : '')+skipped+' item'+(skipped===1?'':'s')+
      ' skipped until their media can be safely copied. Existing saved copies were kept.';
  }
  if (partial) {
    warning += (warning ? ' ' : '')+partial+' card'+(partial===1?'':'s')+
      ' could not be written to every account list. Check your storage permissions.';
  }

  // The connected-source wall can immediately paint the same durable URLs as
  // the persisted account/Archive/Collective records, without borrowing a CDN link.
  const hostedById = await storedOrbitImageUrls(source);
  if(hostedMedia?.urls instanceof Map) {
    for(const raw of items){
      const sourceId = sourcePostIdFor(raw, source.toLowerCase()==='pinterest' ? pinterestImageUrl(raw) : clean(raw.media_url||raw.thumbnail_url||raw.url));
      const urls=mediaPieces(raw,source.toLowerCase()).map((_,index)=>hostedMedia.urls.get(sourceId+':'+index)||'');
      if(urls.some(Boolean))hostedById[sourceId]=[...new Set([...urls.filter(Boolean),...(hostedById[sourceId]||[])])];
    }
  }
  return { imported, skipped, partial, copyFailures, warning, hostedById };
}

export async function loadArchive(ownerUid, pageSize = 48, cursor = null) {
  const store = await firebase();
  const { db, auth, collection, getDocs, query, doc, getDoc, setDoc, deleteDoc, orderBy, limit, startAfter } = store;
  const uid = ownerUid || auth.currentUser?.uid;
  if (!uid) return [];

  const size = Math.max(1, Math.min(48, Number(pageSize) || 48));

  /* The Archive used to scan the entire posts collection every time it opened,
     even when the Archive already existed. That made an otherwise simple page wait on
     hundreds of Firestore documents before the first card could render. Only perform
     the old-data bridge when the Archive collection is actually empty. */
  if (!cursor && (!ownerUid || auth.currentUser?.uid === uid)) {
    try {
      const existingArchive = await getDocs(query(collection(db, "users", uid, "archive"), limit(1)));
      if (existingArchive.empty) {
        const oldSnap = await getDocs(collection(db, "users", uid, "posts"));
        // The bridge must include Pinterest, Facebook and other Orbit sources too;
        // previously it only restored Instagram into Archive.
        const imported = oldSnap.docs.filter(d => Boolean(d.data()?.orbitImported || d.data()?.source));
        for (const old of imported) {
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
      }
    } catch (error) {
      console.warn("BIGLWA Archive migration:", error);
    }
  }

  // Firestore orderBy(sourceCreatedAtMs) silently EXCLUDES older Archive docs
  // with no such field. Read all cards in stable document-ID pages, then sort
  // each page client-side. The nextCursor remains a Firestore document snapshot.
  // This preserves older Pinterest/Instagram cards without creating an index.
  const base = collection(db, "users", uid, "archive");
  const snap = cursor
    ? await getDocs(query(base, startAfter(cursor), limit(size)))
    : await getDocs(query(base, limit(size)));

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

  /* Arrays remain backward-compatible for callers, while the two paging fields let the
     Archive wall fetch another small page instead of loading hundreds of photos at once. */
  rows.nextCursor = snap.docs.length ? snap.docs[snap.docs.length - 1] : null;
  rows.hasMore = snap.docs.length === size;
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
/* Persist a user-selected Facebook photo/video or TikTok video as an account-owned,
 * private Orbit draft. Provider media remains at its source unless a durable R2 copy
 * exists; we save a working original-post link for those source-hosted previews.
 * Stable ids ensure reconnecting never duplicates a post or resets its visibility. */
export async function saveExternalOrbitDraft(source, raw) {
  const provider=clean(source).toLowerCase();
  if(!['facebook','tiktok'].includes(provider))throw Error('This source is not enabled for Orbit drafts.');
  const store=await firebase();
  await store.auth.authStateReady();
  const user=store.auth.currentUser;
  if(!user)throw Error('Sign in to Big LWA before importing account content.');
  const item=raw&&typeof raw==='object'?raw:{};
  const https=value=>{
    try{const u=new URL(clean(value));return u.protocol==='https:'?u.href:''}
    catch{return ''}
  };
  const original=https(item.sourceUrl||item.share_url||item.permalink_url||item.link);
  if(!original)throw Error('This '+provider+' item needs a public source link before it can be saved.');
  const host=new URL(original).hostname.toLowerCase();
  if(provider==='tiktok'&&!['tiktok.com','www.tiktok.com','m.tiktok.com'].includes(host))
    throw Error('Use the original TikTok video URL.');
  if(provider==='facebook'&&!['facebook.com','www.facebook.com','m.facebook.com','web.facebook.com','fb.watch'].includes(host))
    throw Error('Use a Facebook-owned original post URL.');
  const externalId=clean(item.sourcePostId||item.id||item.video_id||original);
  const postId=await idFor(provider+':'+user.uid,externalId);
  const refs=postRefs(store,user.uid,postId);
  const prior=await store.getDoc(refs.root);
  if(prior.exists()){
    const present=prior.data()||{};
    // Never silently publish, unpublish, archive or duplicate an existing post.
    return {id:postId,created:false,state:present.state||'draft',source:provider};
  }
  const name=clean(item.caption||item.title||item.video_description||provider+' media').slice(0,500);
  const thumbnail=https(item.thumbnailUrl||item.cover_image_url||item.picture||item.imageUrl);
  const mediaType=clean(item.mediaType||item.kind||(provider==='tiktok'?'video':'image')).toUpperCase();
  const owner=await resolveOwner(user,{},null);
  const created=store.serverTimestamp();
  const data={
    uid:user.uid,username:owner.username,usernameLower:owner.usernameLower,
    authorName:owner.authorName,
    source:provider,sourcePostId:externalId,sourceUrl:original,
    sourceUsername:clean(item.sourceUsername||item.username),
    sourceCreatedAtMs:Number(item.sourceCreatedAtMs)||Date.now(),
    caption:name,linkTitle:name,mediaType,
    thumbnailUrl:thumbnail||null,
    imageUrl:thumbnail||null,imageUrls:thumbnail?[thumbnail]:[],
    mediaItems:thumbnail?[{index:0,isPicture:true,url:thumbnail,thumbnailUrl:thumbnail,mediaType:'IMAGE'}]:[],
    orbitImported:true,sourceHostedMedia:true,
    state:'draft',archiveState:'saved',createdAt:created,updatedAt:created
  };
  const result=await writePostRecords(store,user.uid,postId,data,{archiveState:'saved'});
  if(result.denied.includes('root'))throw Error('Orbit draft could not reach the main Feed database. Try again.');
  window.dispatchEvent(new CustomEvent('biglwa:orbit-imported',{detail:{source:provider,postId,state:'draft'}}));
  return {id:postId,created:true,state:'draft',source:provider};
}

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
  storedOrbitImageUrls,
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
  saveExternalOrbitDraft,
  sourceTimeMs
};
