/* BIGLWA feed
 *
 * Turns the feed page into a Pinterest-style masonry of cards and lets a member post an
 * image with a caption.
 *
 * Posts live in Firestore under the author, not in a per-device slot, so a post is
 * visible from any device and to anyone who can read the feed. The image goes to the
 * media Worker first, so the Firestore document only ever holds a URL and an owner
 * stamped uid rather than image data.
 *
 * The feed list is also where Instagram, TikTok, and Pinterest pour in, so this file
 * styles the shared list and leaves those sources to their own renderers. Cards are
 * marked so the shared mount does not mistake them for a missing source.
 */
import { identity, onIdentityChange, startIdentity } from "./account-identity.js";

const WORKER = "https://biglwa-instagram-api.leianmulatre-284.workers.dev";
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 8 * 1024 * 1024;
const FEED_SIZE = 40;

const esc = (value) => String(value == null ? "" : value).replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const STYLE = `
/* Masonry via columns, so cards of different heights pack tightly and read the way a
   pin board does. Break-inside keeps a caption attached to its own image. */
#feedPageList{columns:4 240px;column-gap:18px;display:block}
#feedPageList>*{break-inside:avoid;margin:0 0 18px;width:100%}
@media (max-width:900px){#feedPageList{columns:3 200px}}
@media (max-width:640px){#feedPageList{columns:2 150px}}
@media (max-width:400px){#feedPageList{columns:1}}
.biglwa-pin{overflow:hidden;border:1px solid rgba(80,70,64,.16);border-radius:16px;background:#fffdf9;
  box-shadow:0 1px 2px rgba(48,43,40,.06);display:block;width:100%}
/* The connected sources share the list, so their cards are dressed as pins too rather
   than sitting in the board as loose list rows. */
#feedPageList>.instagram-feed-item,#feedPageList>.tiktok-feed-item,#feedPageList>.pinterest-feed-item{
  overflow:hidden;border:1px solid rgba(80,70,64,.16);border-radius:16px;background:#fffdf9;padding:0}
#feedPageList>.instagram-feed-item>div,#feedPageList>.tiktok-feed-item>div,#feedPageList>.pinterest-feed-item>div{padding:11px 13px 13px}
#feedPageList>.instagram-feed-item small,#feedPageList>.tiktok-feed-item small,#feedPageList>.pinterest-feed-item small{
  display:block;font:600 11px/1.4 system-ui;letter-spacing:.03em;text-transform:uppercase;color:#8a7a6c}
#feedPageList>.instagram-feed-item b,#feedPageList>.tiktok-feed-item b,#feedPageList>.pinterest-feed-item b{
  display:block;margin:5px 0 0;font:600 15px/1.45 system-ui;color:#2f2a27;overflow-wrap:anywhere}
#feedPageList>.instagram-feed-item img,#feedPageList>.tiktok-feed-item img,#feedPageList>.pinterest-feed-item img{
  border-radius:0!important;max-height:520px}
.biglwa-pin>img{display:block;width:100%;height:auto;background:#efe7dd}
.biglwa-pin-body{padding:11px 13px 13px}
.biglwa-pin-body small{display:block;font:600 11px/1.4 system-ui;letter-spacing:.03em;text-transform:uppercase;color:#8a7a6c}
.biglwa-pin-body b{display:block;margin:5px 0 0;font:600 15px/1.45 system-ui;color:#2f2a27;overflow-wrap:anywhere}
.biglwa-pin-body a{display:inline-flex;margin-top:9px;font:600 12px/1 system-ui;color:#a53332}
.biglwa-pin-empty{padding:15px}
.biglwa-pin-del{margin-top:9px;background:none;border:0;padding:0;font:600 12px/1 system-ui;color:#9b8a7c;cursor:pointer}
#biglwaFeedPicker{display:none}
.biglwa-pick{position:relative;display:inline-flex;align-items:center;gap:8px;cursor:pointer;
  border:1px dashed rgba(80,70,64,.4);border-radius:12px;padding:12px 14px;font:600 13px/1 system-ui;color:#5a4f47}
.biglwa-pick:hover{background:#fff6ec}
.biglwa-thumb{width:100%;border-radius:12px;margin-top:10px;display:block}
.biglwa-preview{display:flex;align-items:center;gap:10px;margin-top:10px}
.biglwa-preview img{width:64px;height:64px;object-fit:cover;border-radius:10px;border:1px solid rgba(80,70,64,.18)}
.biglwa-preview span{font:600 12px/1.4 system-ui;color:#6b5f56}
#biglwaFeedStatus{font:600 12px/1.5 system-ui;margin:9px 0 0;min-height:1em}
`;

function installStyle() {
  if (document.getElementById("biglwaFeedStyle")) return;
  const style = document.createElement("style");
  style.id = "biglwaFeedStyle";
  style.textContent = STYLE;
  document.head.appendChild(style);
}

let refs;
async function firebase() {
  if (!refs) {
    const [{ initializeApp, getApps }, store, { getAuth }] = await Promise.all([
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
    refs = {
      db: store.getFirestore(app),
      auth: getAuth(app),
      doc: store.doc, getDoc: store.getDoc, deleteDoc: store.deleteDoc,
      addDoc: store.addDoc, collection: store.collection, query: store.query, orderBy: store.orderBy,
      limit: store.limit, getDocs: store.getDocs, serverTimestamp: store.serverTimestamp
    };
  }
  return refs;
}

function say(text, tone) {
  const node = document.getElementById("biglwaFeedStatus");
  if (!node) return;
  node.textContent = text || "";
  node.style.color = tone === "bad" ? "#a53332" : tone === "good" ? "#3f6b4a" : "#6b5f56";
}

function when(iso) {
  const then = Date.parse(iso || "");
  if (!then) return "";
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return mins + " min ago";
  const hours = Math.round(mins / 60);
  if (hours < 24) return hours + " hr ago";
  return new Date(then).toLocaleDateString();
}

let posts = [];
let loading = false;
let drawnOn = null;
let drawnSignature = null;

async function loadPosts() {
  if (loading) return posts;
  loading = true;
  try {
    const { db, collection, query, orderBy, limit, getDocs } = await firebase();
    const snap = await getDocs(query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(FEED_SIZE)));
    posts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch {
    /* A feed that cannot load should still show the connected sources below it. */
    posts = [];
  } finally {
    loading = false;
  }
  renderPosts();
  return posts;
}

/* Redrawing the list on every call would drop hover and focus state and pull the reader
   out of a card they are on, so the markup is only rebuilt when the posts or the viewer
   actually differ. A newly rendered feed route is a new list and still gets drawn. */
function renderPosts(force) {
  const list = document.getElementById("feedPageList");
  if (!list) return;
  const me = identity()?.uid;
  const signature = posts.map((p) => p.id + ":" + (p.imageUrl || "") + ":" + (p.caption || "") + ":" + (p.createdAt || "")).join("|") + "@" + (me || "");
  if (!force && list === drawnOn && signature === drawnSignature) return;
  drawnOn = list;
  drawnSignature = signature;

  list.querySelectorAll(".biglwa-pin-post").forEach((node) => node.remove());
  if (!posts.length) return;
  const html = posts.map((post) => {
    const mine = post.uid && post.uid === me;
    const label = post.authorName ? esc(post.authorName) : (post.username ? "@" + esc(post.username) : "Member");
    const image = post.imageUrl
      ? '<img src="' + esc(post.imageUrl) + '" alt="' + esc(post.caption || "Feed post") + '" loading="lazy">'
      : '<div class="biglwa-pin-empty"><small>Note</small></div>';
    return '<article class="biglwa-pin biglwa-pin-post"><div>' + image +
      '<div class="biglwa-pin-body"><small>' + label + " · " + esc(when(post.createdAt)) + "</small>" +
      (post.caption ? "<b>" + esc(post.caption) + "</b>" : "") +
      (mine ? '<button type="button" class="biglwa-pin-del" data-feed-delete="' + esc(post.id) + '">Delete</button>' : "") +
      "</div></div></article>";
  }).join("");
  list.insertAdjacentHTML("afterbegin", html);
}

/* The image is uploaded before the post is written, so a record is never created for a
   picture that failed to store. A stale image left behind by a failed write is removed
   through the same route rather than orphaned in the bucket. */
async function uploadImage(file, user) {
  if (!IMAGE_TYPES.includes(file.type)) throw new Error("Choose a JPG, PNG, WebP, or GIF.");
  if (file.size > MAX_BYTES) throw new Error("That image is larger than the 8 MB limit.");
  const response = await fetch(WORKER + "/media/feed-image", {
    method: "POST",
    headers: { Authorization: "Bearer " + (await user.getIdToken()), "Content-Type": file.type },
    body: file
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 404) throw new Error("Photo storage is not deployed yet. Please try again later.");
    throw new Error(payload.error || "That image could not be uploaded.");
  }
  return payload;
}

async function removeImage(key, uid) {
  try {
    const { auth } = await firebase();
    const user = auth.currentUser;
    if (!user || !key) return;
    await fetch(WORKER + "/media/feed-image/" + encodeURIComponent(uid || user.uid) + "/" + key.split("/").pop(), {
      method: "DELETE", headers: { Authorization: "Bearer " + (await user.getIdToken()) }
    });
  } catch { /* the post is what matters; a leftover file is harmless */ }
}

async function submit(form) {
  const caption = String(new FormData(form).get("text") || "").trim();
  const file = document.getElementById("biglwaFeedPicker")?.files?.[0];
  if (!caption && !file) { say("Add a picture or a caption first.", "bad"); return; }
  if (caption.length > 500) { say("Captions are limited to 500 characters.", "bad"); return; }

  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) submitButton.disabled = true;
  say("Posting…");

  /* Everything here needs an account, so it is settled before a byte is uploaded. */
  const { db, auth, addDoc, collection, serverTimestamp } = await firebase();
  const user = auth.currentUser;
  if (!user) {
    say("Sign in to post to the feed.", "bad");
    if (submitButton) submitButton.disabled = false;
    return;
  }

  let media = null;
  try {
    if (file) media = await uploadImage(file, user);
    const me = identity();
    await addDoc(collection(db, "posts"), {
      uid: user.uid,
      username: me?.username || "",
      authorName: me?.name || me?.username || "",
      caption: caption.slice(0, 500),
      imageKey: media?.key || null,
      imageUrl: media?.url || null,
      state: "approved",
      createdAt: serverTimestamp()
    });
    form.reset();
    document.getElementById("biglwaFeedThumb")?.remove();
    say("Posted to the feed.", "good");
    await loadPosts();
  } catch (error) {
    /* Roll the picture back so a rejected post does not leave a file behind. */
    if (media?.key) await removeImage(media.key, user.uid);
    say(error.message || "That post could not be published.", "bad");
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
}

/* Replaces the plain text-only composer with one that also takes a picture. The form
   element is reused so anything already listening to it keeps working. */
function upgradeComposer(form) {
  if (!form || form.dataset.bigUpgrade) return;
  form.dataset.bigUpgrade = "1";
  const holder = document.createElement("span");
  holder.className = "biglwa-pick";
  holder.innerHTML = '<input type="file" id="biglwaFeedPicker" accept="image/jpeg,image/png,image/webp,image/gif">Choose a picture';
  const text = form.querySelector("textarea");
  if (text) text.placeholder = "Say something, or add a picture";
  form.appendChild(holder);
  const status = document.createElement("p");
  status.id = "biglwaFeedStatus";
  status.setAttribute("role", "status");
  form.appendChild(status);

  holder.querySelector("input").addEventListener("change", (event) => {
    document.getElementById("biglwaFeedThumb")?.remove();
    const file = event.target.files?.[0];
    if (!file) return;
    const preview = document.createElement("img");
    preview.id = "biglwaFeedThumb";
    preview.className = "biglwa-thumb";
    preview.alt = "Selected picture";
    preview.src = URL.createObjectURL(file);
    form.insertBefore(preview, status);
    say(file.name + " · " + Math.round(file.size / 1024) + " KB");
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submit(form);
  });
}

/* Wires the composer and the delete button exactly once per rendered feed, and only when
   the element is a new one. The route re-renders its markup on every visit, so identity of
   the element is what tells a fresh form from one that is already wired. */
let wiredList = null;
async function wire(list, form) {
  installStyle();
  if (!list) return;
  if (form) upgradeComposer(form);
  if (list !== wiredList) {
    wiredList = list;
    list.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-feed-delete]");
      if (!button) return;
      const id = button.dataset.feedDelete;
      const post = posts.find((p) => p.id === id);
      if (!post) return;
      button.disabled = true;
      try {
        const { db, doc, deleteDoc } = await firebase();
        await deleteDoc(doc(db, "posts", id));
        if (post.imageKey) await removeImage(post.imageKey);
        await loadPosts();
        say("Post removed.", "good");
      } catch (error) {
        button.disabled = false;
        say(error.message || "That post could not be removed.", "bad");
      }
    });
  }
  renderPosts();
}

/* The feed is a route the studio renders on demand, so the composer does not exist yet when
   this module starts and nothing further would ever arrive to wake it. Watching for the
   form is what makes the picture picker turn up when the feed is opened.

   The observer is deliberately narrow. It fires on every mutation, including the ones this
   module makes itself when it draws a card, so it must not do any work unless it is looking
   at a form it has not seen before. Otherwise drawing a post triggers a load, which draws a
   post, and the feed never stops. */
let seenForm = null;
function observeFeed() {
  const tick = () => {
    const form = document.getElementById("feedComposer");
    if (!form || form === seenForm) return;
    seenForm = form;
    wire(document.getElementById("feedPageList"), form);
    if (identity()) loadPosts();
  };
  new MutationObserver(tick).observe(document.documentElement, { childList: true, subtree: true });
  tick();
}

function watch() {
  const form = document.getElementById("feedComposer");
  if (form && form !== seenForm) {
    seenForm = form;
    wire(document.getElementById("feedPageList"), form);
  }
  if (typeof window.BIGLWAFeedMount === "function") {
    /* Source cards join the same masonry. The marker keeps the shared mount from
       treating our own cards as a source that failed to render. */
    window.BIGLWAFeedMount("Feed posts", "biglwa-pin-post", () => renderPosts());
  }
}

/* The composer and the masonry are set up the moment the module evaluates. None of that
   needs an account: a visitor should see the same feed, and waiting on the identity to
   resolve is what previously left the picture picker missing for a signed-out reader.
   Only the parts that read or write posts wait for the account. */
installStyle();
observeFeed();

let booted = false;
export async function startFeed() {
  /* account-boot also starts this, so starting twice must not leave two observers and
     two sets of listeners fighting over the same list. */
  if (booted) return window.__biglwaFeed;
  booted = true;
  startIdentity();
  onIdentityChange(watch);
  watch();
  if (identity()) await loadPosts();
  window.__biglwaFeed = { loadPosts, renderPosts, refresh: loadPosts };
  return window.__biglwaFeed;
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", startFeed, { once: true });
else startFeed();

export default startFeed;
