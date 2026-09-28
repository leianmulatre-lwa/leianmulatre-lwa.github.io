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

/* Each source gets its own colour, carried as a border and a soft outer glow rather than a
   fill, so a board of mixed cards still reads as one surface.
   These are the colours of the members' own posts, chosen by the `source` field on a Firestore
   document. The connected sources' live cards are painted from their marker class by
   orbit-feed.js, which carries the same values; the two lists have to agree or a board will
   show one shade for a post and another for the same account's live cards. */
const SOURCES = {
  biglwa:   { label: "BIGLWA",    accent: "#c1355a" },
  instagram:{ label: "Instagram", accent: "#c13584" },
  tiktok:   { label: "TikTok",    accent: "#0f8f95" },
  pinterest:{ label: "Pinterest", accent: "#cf4632" },
  facebook: { label: "Facebook",  accent: "#1877f2" },
  youtube:  { label: "YouTube",   accent: "#d0202f" },
  soundcloud:{ label: "SoundCloud", accent: "#e2622a" },
  google:   { label: "Google",    accent: "#4285f4" }
};
const accentOf = (id) => (SOURCES[id] || SOURCES.biglwa);

const STYLE = `
/* Masonry via columns, so cards of different heights pack tightly and read the way a
   pin board does. Break-inside keeps a caption attached to its own image.
   The count is fixed rather than a minimum width: the wall spans the page, and a
   minimum would quietly add a fifth column on a wide screen. The feed card is wide
   so it centres across the page instead of sitting in the narrow right-hand column,
   and it keeps filling downward for as many rows as there are posts. */
#feedPageList{columns:4;column-gap:18px;display:block}
#feedPageList>*{break-inside:avoid;margin:0 0 18px;width:100%}
@media (max-width:1100px){#feedPageList{columns:3}}
@media (max-width:760px){#feedPageList{columns:2}}
@media (max-width:460px){#feedPageList{columns:1}}
/* A member post wears the board colour. The connected sources are dressed by orbit-feed.js
   instead, because it already owns their marker classes and would otherwise be restyling
   cards it does not build. */
.biglwa-pin{--accent:var(--pin-accent,#c1355a);overflow:hidden;
  border:1px solid rgba(80,70,64,.14);border-left:4px solid var(--accent);
  border-radius:16px;background:#fffdf9;position:relative;display:block;width:100%;
  box-shadow:0 10px 22px -14px var(--accent),0 1px 2px rgba(48,43,40,.06)}
.biglwa-pin::before{content:"";display:block;height:3px;background:linear-gradient(90deg,var(--accent),transparent)}
.biglwa-pin>img{display:block;width:100%;height:auto;background:#efe7dd}
.biglwa-pin-body{padding:11px 13px 13px}
.biglwa-pin-body small{display:block;font:600 11px/1.4 system-ui;letter-spacing:.03em;text-transform:uppercase;color:#8a7a6c}
.biglwa-pin-body b{display:block;margin:5px 0 0;font:600 15px/1.45 system-ui;color:#2f2a27;overflow-wrap:anywhere}
.biglwa-pin-body a{display:inline-flex;margin-top:9px;font:600 12px/1 system-ui;color:#a53332}
.biglwa-pin-empty{padding:15px}
.biglwa-pin-del{margin-top:9px;background:none;border:0;padding:0;font:600 12px/1 system-ui;color:#9b8a7c;cursor:pointer}
/* A small tag sits on the image corner so the source is readable without reading text. */
.biglwa-pin-src{position:absolute;right:8px;top:8px;z-index:2;padding:3px 8px;border-radius:999px;
  background:var(--accent);color:#fff;font:700 9px/1.5 system-ui;letter-spacing:.05em;text-transform:uppercase;
  box-shadow:0 2px 8px rgba(0,0,0,.28)}
#biglwaFeedPicker{display:none}
.biglwa-pick{position:relative;display:inline-flex;align-items:center;gap:8px;cursor:pointer;
  border:1px dashed rgba(80,70,64,.4);border-radius:12px;padding:12px 14px;font:600 13px/1 system-ui;color:#5a4f47}
.biglwa-pick:hover{background:#fff6ec}
.biglwa-thumb{width:100%;border-radius:12px;margin-top:10px;display:block}
#biglwaFeedStatus{font:600 12px/1.5 system-ui;margin:9px 0 0;min-height:1em}
/* The preview strip sits front and centre above the board: four pictures in a single row,
   wider than a card so it reads as a header rather than another item in the feed. */
.biglwa-feed-hero{margin:0 0 20px;padding:14px;border:1px solid rgba(80,70,64,.16);border-radius:18px;
  background:linear-gradient(180deg,#fffdf9,#fff6ec);box-shadow:0 12px 28px -18px rgba(48,43,40,.4)}
.biglwa-feed-hero[hidden]{display:none}
.biglwa-feed-hero-head{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin:0 3px 11px}
.biglwa-feed-hero-head h3{margin:0;font:700 12px/1.3 system-ui;letter-spacing:.05em;text-transform:uppercase;color:#6f645c}
.biglwa-feed-hero-head span{font:600 10px/1.3 system-ui;color:#9b8a7c}
.biglwa-feed-hero-row{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
.biglwa-feed-hero-row a,.biglwa-feed-hero-row>div{position:relative;display:block;overflow:hidden;
  aspect-ratio:4/3;border-radius:14px;background:#efe7dd;text-decoration:none;
  border:1px solid rgba(80,70,64,.14);box-shadow:0 8px 18px -12px var(--accent,#c1355a)}
.biglwa-feed-hero-row img{width:100%;height:100%;object-fit:cover;display:block}
.biglwa-feed-hero-row .biglwa-pin-src{right:6px;top:6px;padding:2px 7px;font-size:8px}
.biglwa-feed-hero-cap{position:absolute;left:0;right:0;bottom:0;padding:16px 9px 8px;color:#fff;
  font:600 11px/1.35 system-ui;background:linear-gradient(180deg,transparent,rgba(24,16,14,.82));
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.biglwa-feed-hero-empty{display:grid;place-items:center;aspect-ratio:4/3;border-radius:14px;
  border:1px dashed rgba(80,70,64,.28);background:rgba(255,255,255,.5);
  font:600 10px/1.4 system-ui;color:#9b8a7c;text-align:center;padding:8px}
/* Matched on the row as well as the class, so the dashed edge wins against the border the
   shared tile rule sets. Without the second selector the slot renders as a solid card and
   reads as a real post with a broken picture. */
.biglwa-feed-hero-row>.biglwa-feed-hero-empty{border-style:dashed}
@media (max-width:760px){.biglwa-feed-hero-row{grid-template-columns:repeat(2,minmax(0,1fr))}}
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

/* The preview strip sits above the board. It shows the four newest pictures in a single
   row, so a visitor sees colour and activity before they start reading. It is decoration
   over the same data the list already holds, never a second query, so the two can never
   disagree about what the feed contains. Slots with no picture are left as dashed gaps
   rather than shrinking the row, which keeps the row four wide until there is something
   to put in it. */
const HERO_SLOTS = 4;
let heroOn = null;
let heroSignature = null;

function renderHero(force) {
  const anchor = document.getElementById("biglwaFeedHero");
  if (!anchor) return;
  /* The class lives on the markup in the module page, but it is asserted here as well so
     the strip is still a panel if that markup is ever built without it. */
  anchor.classList.add("biglwa-feed-hero");
  /* A feed with nothing in it at all stays clean: the strip is a preview of pictures, so
     showing four empty slots over an empty board would only add noise. Once a single post
     exists the strip appears and holds its width, gaps included. */
  anchor.hidden = !posts.length;
  if (anchor.hidden) {
    heroOn = null;
    heroSignature = null;
    return;
  }
  const signature = posts.map((p) => p.id + ":" + (p.imageUrl || "") + ":" + (p.caption || "")).join("|");
  if (!force && anchor === heroOn && signature === heroSignature) return;
  heroOn = anchor;
  heroSignature = signature;

  const withImage = posts.filter((p) => p.imageUrl);
  const slots = [];
  for (let i = 0; i < HERO_SLOTS; i++) slots.push(withImage[i] || null);
  const rest = Math.max(0, withImage.length - HERO_SLOTS);

  const cards = slots.map((post) => {
    if (!post) return '<div class="biglwa-feed-hero-empty">Nothing here yet</div>';
    const src = accentOf(post.source);
    const caption = (post.caption || "").trim();
    return '<a style="--accent:' + src.accent + '" href="' + esc(post.imageUrl) + '" target="_blank" rel="noopener noreferrer">' +
      '<span class="biglwa-pin-src">' + esc(src.label) + "</span>" +
      '<img src="' + esc(post.imageUrl) + '" alt="' + esc(caption || src.label + " post") + '" loading="lazy">' +
      (caption ? '<span class="biglwa-feed-hero-cap">' + esc(caption) + "</span>" : "") +
      "</a>";
  }).join("");

  anchor.innerHTML = '<div class="biglwa-feed-hero-head"><h3>Latest pictures</h3><span>' +
    (rest ? "+" + rest + " more below" : withImage.length + (withImage.length === 1 ? " picture" : " pictures")) +
    "</span></div>" + '<div class="biglwa-feed-hero-row">' + cards + "</div>";
}

/* Redrawing the list on every call would drop hover and focus state and pull the reader
   out of a card they are on, so the markup is only rebuilt when the posts or the viewer
   actually differ. A newly rendered feed route is a new list and still gets drawn. */
function renderPosts(force) {
  const list = document.getElementById("feedPageList");
  if (!list) return;
  const me = identity()?.uid;
  const signature = posts.map((p) => p.id + ":" + (p.imageUrl || "") + ":" + (p.caption || "") + ":" + (p.createdAt || "")).join("|") + "@" + (me || "");
  renderHero(force);
  if (!force && list === drawnOn && signature === drawnSignature) return;
  drawnOn = list;
  drawnSignature = signature;

  list.querySelectorAll(".biglwa-pin-post").forEach((node) => node.remove());
  if (!posts.length) return;
  const html = posts.map((post) => {
    const mine = post.uid && post.uid === me;
    const src = accentOf(post.source);
    const label = post.authorName ? esc(post.authorName) : (post.username ? "@" + esc(post.username) : "Member");
    const image = post.imageUrl
      ? '<img src="' + esc(post.imageUrl) + '" alt="' + esc(post.caption || "Feed post") + '" loading="lazy">'
      : '<div class="biglwa-pin-empty"><small>Note</small></div>';
    return '<article class="biglwa-pin biglwa-pin-post" style="--pin-accent:' + src.accent + '"><span class="biglwa-pin-src">' + esc(src.label) + "</span><div>" + image +
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
