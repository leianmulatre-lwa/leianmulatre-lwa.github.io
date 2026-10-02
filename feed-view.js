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
/* A post may carry several photos. They are shown one at a time in a frame shaped like
   its first photo, so a multi-photo post reads like a slideshow rather than a stack.
   The ceiling keeps one post from turning the wall into a video. */
const MAX_SLIDES = 6;
const SLIDE_MS = 4200;

const esc = (value) => String(value == null ? "" : value).replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* One picture is the old shape and stays the common case, so it is read from either the
   list or the single field. The first photo is also written back to `imageUrl`, which is
   what the preview strip and anything older still read. */
const slideUrls = (post) => {
  const list = Array.isArray(post.imageUrls) ? post.imageUrls.filter((u) => typeof u === "string" && u) : [];
  if (list.length) return list.slice(0, MAX_SLIDES);
  return post.imageUrl ? [post.imageUrl] : [];
};

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
/* A pin-board wall: multi-column, so each card packs upward into the first gap of
   its column instead of lining up with the row of its neighbours. The count is fixed
   at four across, and each card holds its picture's own shape. */
#feedPageList{display:block;columns:4;column-gap:18px}
#feedPageList>*{break-inside:avoid;min-width:0;width:100%;margin:0 0 18px}
@media (max-width:980px){#feedPageList{columns:3}}
@media (max-width:700px){#feedPageList{columns:2}}
@media (max-width:480px){#feedPageList{columns:1}}
/* A member post wears the board colour. The connected sources are dressed by orbit-feed.js
   instead, because it already owns their marker classes and would otherwise be restyling
   cards it does not build. */
.biglwa-pin{--accent:var(--pin-accent,#bd3f47);overflow:hidden;
  border:1px solid #dfd4ca;border-left:1px solid #dfd4ca;
  border-radius:16px;background:#f1e9e1;position:relative;display:block;width:100%;
  box-shadow:3px 3px 0 var(--accent),0 10px 24px rgba(55,42,34,.07)}
.biglwa-pin::before{content:"";display:block;height:3px;background:linear-gradient(90deg,var(--accent),transparent)}
.biglwa-pin:nth-child(6n+1){--accent:#bd3f47}.biglwa-pin:nth-child(6n+2){--accent:#d77b30}.biglwa-pin:nth-child(6n+3){--accent:#d1ad2f}.biglwa-pin:nth-child(6n+4){--accent:#4e8f61}.biglwa-pin:nth-child(6n+5){--accent:#416fa9}.biglwa-pin:nth-child(6n+6){--accent:#7955a0}
#biglwaOrbitDrafts{border:1px solid #dfd4ca!important;border-radius:20px!important;background:#eee6de!important;box-shadow:3px 3px 0 #a74b59,0 12px 30px rgba(55,42,34,.06)!important}
#biglwaOrbitDrafts .biglwa-draft-card{border:1px solid #dfd4ca!important;background:#f8f2ec!important;box-shadow:3px 3px 0 #d77b30}
#biglwaOrbitDrafts .biglwa-draft-card:nth-child(6n+2){box-shadow:3px 3px 0 #d1ad2f}.biglwa-draft-card:nth-child(6n+3){box-shadow:3px 3px 0 #4e8f61}.biglwa-draft-card:nth-child(6n+4){box-shadow:3px 3px 0 #416fa9}
#feedPageList .biglwa-pin::before{background:var(--accent)!important}
/* A member's post keeps its own shape: the picture fills the column width at its true
   height and no caption sits on the card. The menu
   may drop below a short wide picture, so the card lets it escape and the picture itself
   is rounded instead of relying on the card to clip it. */
.biglwa-pin-post{overflow:visible}
.biglwa-pin::before{border-radius:16px 16px 0 0}
.biglwa-pin-img{display:block;width:100%;height:auto;background:#efe7dd;border-radius:15px 15px 0 0}
.biglwa-pin-body{padding:11px 13px 13px}
.biglwa-pin-body small{display:block;font:600 11px/1.4 system-ui;letter-spacing:.03em;text-transform:uppercase;color:#8a7a6c}
.biglwa-pin-empty{padding:15px}
/* The three dots carry the actions. Green opens the picture large, where the full-size
   link lives; yellow hides the post from the wall without removing it; red
   deletes it. The same colour naming is used by the linked accounts' green "view-site"
   pill, so green always means "go somewhere bigger" across the wall. */
.biglwa-post-dots{position:absolute;top:10px;right:10px;z-index:4;width:30px;height:30px;border:0;
  border-radius:50%;background:rgba(24,16,14,.52);color:#fff;display:grid;place-items:center;
  cursor:pointer;font:700 14px/1 system-ui;padding-bottom:2px;letter-spacing:.08em;
  box-shadow:0 2px 8px rgba(24,16,14,.28)}
.biglwa-post-dots:hover,.biglwa-post-dots[aria-expanded="true"]{background:#1d1613}
.biglwa-post-menu{position:absolute;top:46px;right:10px;z-index:5;min-width:158px;padding:6px;
  border-radius:12px;background:#fffdf9;border:1px solid rgba(80,70,64,.16);
  box-shadow:0 22px 46px -18px rgba(24,16,14,.55);display:none;flex-direction:column;gap:2px}
.biglwa-post-menu.is-open{display:flex}
.biglwa-post-menu button{display:flex;align-items:center;gap:9px;width:100%;border:0;background:none;
  padding:9px 10px;border-radius:8px;font:600 13px/1 system-ui;color:#3a322c;cursor:pointer;text-align:left}
.biglwa-post-menu button:hover{background:#f4ece2}
.biglwa-post-menu button:disabled{opacity:.55;cursor:default}
.biglwa-dot{width:9px;height:9px;border-radius:50%;flex:none;background:#8a7a6c}
.biglwa-post-menu button[data-post-enlarge] .biglwa-dot{background:#3f6b4a}
.biglwa-post-menu button[data-post-archive] .biglwa-dot{background:#c98a16}
.biglwa-post-menu button[data-post-delete] .biglwa-dot{background:#a53332}
.biglwa-post-menu button[data-post-delete]{color:#a53332}
/* The source is told by the colour along the edge of the card instead of by a name, so the
   label is no longer drawn. The accent border and the glow around it stay. */
.biglwa-pin-src{display:none}
/* A post with more than one photo becomes a slideshow shaped like its first photo, moving
   on by itself, with dots and arrows so it is still readable and pausable by hand. The
   frame's ratio is set from that first picture once it loads, so the card's shape already
   belongs to the post instead of to a fixed square. */
.biglwa-slide{position:relative;width:100%;aspect-ratio:4/3;background:#efe7dd;overflow:hidden;border-radius:15px 15px 0 0}
.biglwa-slide>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;
  opacity:0;transition:opacity .45s ease}
.biglwa-slide>img.is-on{opacity:1}
.biglwa-slide-dot{position:absolute;left:0;right:0;bottom:8px;display:flex;justify-content:center;gap:5px;z-index:3}
.biglwa-slide-dot i{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.55);
  box-shadow:0 0 0 1px rgba(24,16,14,.35);pointer-events:none}
.biglwa-slide-dot i.is-on{background:#fff;box-shadow:0 0 0 1px rgba(24,16,14,.6)}
.biglwa-slide-btn{position:absolute;top:50%;transform:translateY(-50%);z-index:3;
  width:28px;height:28px;border:0;border-radius:50%;background:rgba(24,16,14,.5);color:#fff;
  font:700 15px/1 system-ui;cursor:pointer;opacity:0;transition:opacity .2s ease}
.biglwa-slide:hover .biglwa-slide-btn,.biglwa-slide:focus-within .biglwa-slide-btn{opacity:1}
.biglwa-slide-btn.prev{left:6px}
.biglwa-slide-btn.next{right:6px}
.biglwa-slide-count{position:absolute;right:8px;top:8px;z-index:3;padding:3px 8px;border-radius:999px;
  background:rgba(24,16,14,.55);color:#fff;font:700 9px/1.5 system-ui;letter-spacing:.05em}
/* Someone who has asked their system for less motion gets a slideshow that holds still. */
@media (prefers-reduced-motion:reduce){.biglwa-slide>img{transition:none}}
#biglwaFeedPicker{display:none}
.biglwa-pick{position:relative;display:inline-flex;align-items:center;gap:8px;cursor:pointer;
  border:1px dashed rgba(80,70,64,.4);border-radius:12px;padding:12px 14px;font:600 13px/1 system-ui;color:#5a4f47}
.biglwa-pick:hover{background:#fff6ec}
.biglwa-thumb{width:100%;border-radius:12px;margin-top:10px;display:block}
.biglwa-thumbs{display:grid;grid-template-columns:repeat(auto-fill,minmax(64px,1fr));gap:6px;margin-top:10px}
.biglwa-thumbs .biglwa-thumb{margin-top:0;aspect-ratio:1/1;overflow:hidden;background:#efe7dd}
.biglwa-thumbs .biglwa-thumb img{width:100%;height:100%;object-fit:cover;display:block;border-radius:12px}
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
.biglwa-feed-hero-count{position:absolute;left:8px;top:8px;z-index:2;padding:3px 8px;border-radius:999px;
  background:rgba(24,16,14,.55);color:#fff;font:700 9px/1.5 system-ui;letter-spacing:.04em}
.biglwa-feed-hero-empty{display:grid;place-items:center;aspect-ratio:4/3;border-radius:14px;
  border:1px dashed rgba(80,70,64,.28);background:rgba(255,255,255,.5);
  font:600 10px/1.4 system-ui;color:#9b8a7c;text-align:center;padding:8px}
/* Matched on the row as well as the class, so the dashed edge wins against the border the
   shared tile rule sets. Without the second selector the slot renders as a solid card and
   reads as a real post with a broken picture. */
.biglwa-feed-hero-row>.biglwa-feed-hero-empty{border-style:dashed}
@media (max-width:760px){.biglwa-feed-hero-row{grid-template-columns:repeat(2,minmax(0,1fr))}}
/* The enlarged view. The picture keeps its own shape inside the bounds of the viewport,
   a straight link opens the full-size image, and arrow keys or the on-screen arrows
   move between the photos of a multi-photo post. */
.biglwa-lightbox{position:fixed;inset:0;z-index:9000;background:rgba(22,15,12,.86);
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:18px}
.biglwa-lightbox-close{position:absolute;top:14px;right:14px;z-index:2;width:38px;height:38px;border:0;
  border-radius:50%;background:rgba(24,16,14,.6);color:#fff;font:700 20px/1 system-ui;cursor:pointer}
.biglwa-lightbox-close:hover{background:#1d1613}
.biglwa-lightbox-stage{position:relative;display:grid;place-items:center;width:100%;max-width:min(960px,92vw)}
.biglwa-lightbox-stage img{display:block;max-width:100%;max-height:72vh;object-fit:contain;border-radius:10px;
  box-shadow:0 24px 60px -24px rgba(0,0,0,.7)}
.biglwa-lightbox-count{position:absolute;left:10px;top:10px;z-index:2;padding:4px 10px;border-radius:999px;
  background:rgba(24,16,14,.6);color:#fff;font:700 11px/1.5 system-ui;letter-spacing:.05em}
.biglwa-lightbox-arrow{position:absolute;top:50%;transform:translateY(-50%);z-index:2;width:40px;height:40px;
  border:0;border-radius:50%;background:rgba(24,16,14,.55);color:#fff;font:700 20px/1 system-ui;cursor:pointer}
.biglwa-lightbox-arrow:hover{background:#1d1613}
.biglwa-lightbox-arrow.prev{left:12px}
.biglwa-lightbox-arrow.next{right:12px}
.biglwa-lightbox-meta{display:flex;align-items:center;gap:16px;flex-wrap:wrap;justify-content:center;
  max-width:min(820px,92vw);background:#fffdf9;border:1px solid rgba(80,70,64,.14);border-radius:14px;
  padding:12px 16px;box-shadow:0 18px 44px -22px rgba(0,0,0,.55)}
.biglwa-lightbox-view{margin-left:auto;padding:8px 14px;border-radius:999px;font:700 12px/1 system-ui;
  text-decoration:none;background:rgba(31,142,74,.1);border:1px solid rgba(31,142,74,.34);color:#1f7a45;flex:none}
.biglwa-lightbox-view:hover{background:rgba(31,142,74,.16);color:#166238}
@media (max-width:640px){.biglwa-lightbox-stage img{max-height:62vh}}
`;

function installStyle() {
  if (document.getElementById("biglwaFeedStyle")) return;
  const style = document.createElement("style");
  style.id = "biglwaFeedStyle";
  style.textContent = STYLE + "\n/* Orbit imports are account drafts until the member explicitly publishes them. */\n#biglwaOrbitDrafts{margin:0 0 18px;padding:16px;border:1px solid rgba(80,70,64,.16);border-radius:18px;background:#fffdf9;box-shadow:0 10px 24px -18px rgba(48,43,40,.35)}\n#biglwaOrbitDrafts[hidden]{display:none}\n.biglwa-drafts-head{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:12px}\n.biglwa-drafts-head h3{margin:0;font:700 13px/1.2 system-ui;color:#2f2a27}\n.biglwa-drafts-head p{margin:4px 0 0;max-width:650px;font:500 10px/1.45 system-ui;color:#81766f}\n.biglwa-drafts-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}\n.biglwa-draft-card{position:relative;display:grid;gap:7px;padding:8px;border:1px solid #dfd6cd;border-radius:13px;background:#fff;cursor:pointer}\n.biglwa-draft-card input{position:absolute;left:9px;top:9px;z-index:2;width:17px;height:17px;accent-color:#c1355a}\n.biglwa-draft-card img{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:9px;background:#eee7df}\n.biglwa-draft-card b{display:block;font:700 10px/1.35 system-ui;color:#302b28;overflow:hidden;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2}\n.biglwa-draft-card small{display:block;margin-top:3px;font:600 9px/1.3 system-ui;color:#8b8179}\n@media(max-width:760px){.biglwa-drafts-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.biglwa-drafts-head{align-items:flex-start;flex-direction:column}}\n";
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
      limit: store.limit, getDocs: store.getDocs, serverTimestamp: store.serverTimestamp,
      updateDoc: store.updateDoc, setDoc: store.setDoc
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
let draftPosts = [];
let loading = false;
let drawnOn = null;
let drawnSignature = null;

async function loadPosts() {
  if (loading) return posts;
  loading = true;
  try {
    const { db, auth, collection, query, where, limit, getDocs } = await firebase();
    const publicSnap = await getDocs(query(collection(db, "posts"), where("state", "==", "approved"), limit(FEED_SIZE)));
    posts = publicSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
      .filter((p) => p.state === "approved")
      .sort((a, b) => timestampMs(b.createdAt) - timestampMs(a.createdAt));
    draftPosts = [];
    const user = auth.currentUser;
    if (user) {
      const draftSnap = await getDocs(query(
        collection(db, "posts"),
        where("uid", "==", user.uid),
        where("state", "==", "draft"),
        limit(40)
      ));
      draftPosts = draftSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => timestampMs(b.updatedAt || b.createdAt) - timestampMs(a.updatedAt || a.createdAt));
    }
  } catch (error) {
    console.error("BIGLWA feed load:", error);
    if (!posts.length) posts = [];
    draftPosts = [];
  } finally {
    loading = false;
  }
  renderDrafts();
  renderPosts();
  return posts;
}

function timestampMs(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
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
  const signature = posts.map((p) => p.id + ":" + slideUrls(p).join(",") + ":" + (p.caption || "")).join("|");
  if (!force && anchor === heroOn && signature === heroSignature) return;
  heroOn = anchor;
  heroSignature = signature;

  /* A post counts as having a picture whether it carries one photo or several: the strip
     shows the first photo of a slideshow, which is the same picture the card opens on. */
  const withImage = posts.filter((p) => slideUrls(p).length);
  const slots = [];
  for (let i = 0; i < HERO_SLOTS; i++) slots.push(withImage[i] || null);
  const rest = Math.max(0, withImage.length - HERO_SLOTS);

  const cards = slots.map((post) => {
    if (!post) return '<div class="biglwa-feed-hero-empty">Nothing here yet</div>';
    const src = accentOf(post.source);
    const caption = (post.caption || "").trim();
    const first = slideUrls(post)[0];
    const many = slideUrls(post).length > 1;
    return '<a style="--accent:' + src.accent + '" href="' + esc(first) + '" target="_blank" rel="noopener noreferrer">' +
      (many ? '<span class="biglwa-feed-hero-count">' + slideUrls(post).length + " photos</span>" : "") +
      '<img src="' + esc(first) + '" alt="' + esc(caption || "Feed picture") + '" loading="lazy">' +
      "</a>";
  }).join("");

  anchor.innerHTML = '<div class="biglwa-feed-hero-head"><h3>Latest pictures</h3><span>' +
    (rest ? "+" + rest + " more below" : withImage.length + (withImage.length === 1 ? " picture" : " pictures")) +
    "</span></div>" + '<div class="biglwa-feed-hero-row">' + cards + "</div>";
}

/* Redrawing the list on every call would drop hover and focus state and pull the reader
   out of a card they are on, so the markup is only rebuilt when the posts or the viewer
   actually differ. A newly rendered feed route is a new list and still gets drawn. */
function renderDrafts() {
  const anchor = document.getElementById("biglwaOrbitDrafts");
  if (!anchor) return;
  if (!identity()?.uid || !draftPosts.length) {
    anchor.hidden = true;
    anchor.innerHTML = "";
    return;
  }
  anchor.hidden = false;
  anchor.innerHTML =
    '<div class="biglwa-drafts-head"><div><h3>Imported from Orbit</h3><p>Saved to your account, not public yet. Choose what you want to post to the collective feed.</p></div>' +
    '<button type="button" class="module-action" data-orbit-publish-selected>Post selected</button></div>' +
    '<div class="biglwa-drafts-grid">' +
    draftPosts.map((post) =>
      '<label class="biglwa-draft-card" data-draft-id="' + esc(post.id) + '">' +
        '<input type="checkbox" data-orbit-draft-check value="' + esc(post.id) + '">' +
        '<img src="' + esc(slideUrls(post)[0] || "") + '" alt="' + esc(post.caption || "Imported post") + '" loading="lazy">' +
        '<div><b>' + esc(post.caption || "Imported from " + (post.source || "Orbit")) + '</b><small>' + esc((post.source || "Orbit") + (post.sourceUsername ? " · @" + post.sourceUsername : "")) + '</small></div>' +
      '</label>'
    ).join("") +
    '</div>';
}

async function publishDraft(postId) {
  const { db, auth, doc, setDoc, getDoc, serverTimestamp } = await firebase();
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in to publish this post.");
  const rootRef = doc(db, "posts", postId);
  const profileRef = doc(db, "users", user.uid, "posts", postId);
  const snap = await getDoc(rootRef);
  if (!snap.exists()) throw new Error("That imported post is no longer available.");
  const post = snap.data() || {};
  if (post.uid !== user.uid) throw new Error("You can only publish your own imports.");
  const patch = { state: "approved", publishedAt: serverTimestamp(), updatedAt: serverTimestamp() };
  await setDoc(rootRef, patch, { merge: true });
  await setDoc(profileRef, patch, { merge: true });
}
function renderPosts(force) {
  const list = document.getElementById("feedPageList");
  if (!list) return;
  const me = identity()?.uid;
    const signature = posts.map((p) => p.id + ":" + slideUrls(p).join(",") + ":" + (p.caption || "") + ":" + (p.createdAt || "")).join("|") + "@" + (me || "")
;
  renderDrafts();
  renderHero(force);
  if (!force && list === drawnOn && signature === drawnSignature) return;
  drawnOn = list;
  drawnSignature = signature;

  list.querySelectorAll(".biglwa-pin-post").forEach((node) => node.remove());
  stopSlideshows();
  if (!posts.length) return;
  const html = posts.map((post) => {
    const src = accentOf(post.source);
    const label = post.authorName ? esc(post.authorName) : (post.username ? "@" + esc(post.username) : "Member");
    const urls = slideUrls(post);
    /* The three-dot menu belongs to posts written by the collective-feed uploader: an
       image-list field marks one as made by it. Older content carries only the single
       picture fields and keeps the wall quiet, so the actions are never offered on
       content that was not posted through this feed. */
    const managed = Array.isArray(post.imageKeys);
    const image = !urls.length
      ? '<div class="biglwa-pin-empty"><small>Note</small></div>'
      : urls.length === 1
        ? '<img class="biglwa-pin-img" src="' + esc(urls[0]) + '" alt="' + esc(post.caption || "Feed post") + '" loading="lazy">'
        : slideshow(urls, post.caption || "Feed post");
    /* The picture stands alone; the actions live behind the dots on posts the feed
       manages, and every member picture still opens large on a tap, even without a
       menu of its own. */
    return '<article class="biglwa-pin biglwa-pin-post" data-post-id="' + esc(post.id) + '" style="--pin-accent:' + src.accent + '"><div>' + image + "</div>" +
      (managed
        ? '<button type="button" class="biglwa-post-dots" data-feed-dots aria-haspopup="menu" aria-label="Post options" aria-expanded="false">&#8230;</button>' +
          '<div class="biglwa-post-menu" role="menu">' +
          '<button type="button" role="menuitem" data-post-enlarge><i class="biglwa-dot" aria-hidden="true"></i>Enlarge</button>' +
          '<button type="button" role="menuitem" data-post-archive><i class="biglwa-dot" aria-hidden="true"></i>Archive</button>' +
          '<button type="button" role="menuitem" data-post-delete><i class="biglwa-dot" aria-hidden="true"></i>Delete</button>' +
          "</div>"
        : "") +
      '<div class="biglwa-pin-body"><small>' + label + " · " + esc(when(post.createdAt)) + "</small></div>" +
      "</article>";
  }).join("");
  list.insertAdjacentHTML("afterbegin", html);
  startSlideshows(list);
}

/* A multi-photo post is drawn as a stack of pictures inside one frame shaped like the
   first one. Only the active one is visible, so the card keeps the same height and the
   same column width as a single picture. The arrows and dots are real controls, so the
   slideshow can also be moved by hand or by keyboard rather than only on its own timer. */
function slideshow(urls, alt) {
  const frames = urls.map((url, i) =>
    '<img src="' + esc(url) + '" alt="' + esc(alt) + '" loading="lazy"' + (i ? ' aria-hidden="true"' : "") +
    (i ? "" : ' class="is-on"') + ">").join("");
  const dots = urls.map((_, i) => "<i" + (i ? "" : ' class="is-on"') + "></i>").join("");
  return '<div class="biglwa-slide" data-biglwa-slideshow aria-roledescription="carousel" aria-label="' +
    esc(alt) + '">' + frames +
    '<span class="biglwa-slide-count">1 / ' + urls.length + "</span>" +
    '<div class="biglwa-slide-dot">' + dots + "</div>" +
    '<button type="button" class="biglwa-slide-btn prev" data-slide-step="-1" aria-label="Previous photo">&#8249;</button>' +
    '<button type="button" class="biglwa-slide-btn next" data-slide-step="1" aria-label="Next photo">&#8250;</button>' +
    "</div>";
}

/* Every running slideshow is tracked so a redraw cannot leave a timer pointing at pictures
   that are no longer on the page. Each one stops itself when it is scrolled out of view, when
   the reader hovers or focuses it, and when the tab is hidden, and it never starts moving on
   its own for a reader who has asked their system for reduced motion. */
const running = new Set();
const calmMotion = () => {
  try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
  catch { return false; }
};

function stopSlideshows() {
  for (const timer of running) clearInterval(timer);
  running.clear();
}

function startSlideshows(root) {
  for (const frame of (root || document).querySelectorAll("[data-biglwa-slideshow]")) {
    const photos = Array.from(frame.querySelectorAll("img"));
    const dots = Array.from(frame.querySelectorAll(".biglwa-slide-dot i"));
    const count = frame.querySelector(".biglwa-slide-count");
    if (photos.length < 2) continue;
    /* The frame borrows the leading photo's shape once it can be measured, so the card is
       not stuck on a fixed square for a post whose pictures are a different ratio. */
    const shape = () => {
      const lead = photos[0];
      if (lead && lead.naturalWidth && lead.naturalHeight) {
        frame.style.aspectRatio = (lead.naturalWidth / lead.naturalHeight).toFixed(4);
      }
    };
    const lead = photos[0];
    if (lead && lead.complete) shape();
    else if (lead) lead.addEventListener("load", shape, { once: true });
    let at = 0;

    const show = (next) => {
      at = (next + photos.length) % photos.length;
      photos.forEach((img, i) => {
        img.classList.toggle("is-on", i === at);
        if (i === at) img.removeAttribute("aria-hidden");
        else img.setAttribute("aria-hidden", "true");
      });
      dots.forEach((dot, i) => dot.classList.toggle("is-on", i === at));
      if (count) count.textContent = at + 1 + " / " + photos.length;
    };

    const hold = () => {
      if (!timer) return;
      clearInterval(timer);
      running.delete(timer);
      timer = null;
    };
    const play = () => {
      if (timer || calmMotion() || !frame.isConnected) return;
      timer = setInterval(() => show(at + 1), SLIDE_MS);
      running.add(timer);
    };
    let timer = null;

    frame.addEventListener("click", (event) => {
      const step = event.target.closest("[data-slide-step]");
      if (!step) return;
      event.preventDefault();
      show(at + Number(step.dataset.slideStep));
    });
    /* Hovering or tabbing into a card means the reader is looking at it, so it holds still. */
    frame.addEventListener("mouseenter", hold);
    frame.addEventListener("mouseleave", play);
    frame.addEventListener("focusin", hold);
    frame.addEventListener("focusout", (event) => { if (!frame.contains(event.relatedTarget)) play(); });

    show(0);
    play();

    /* Off-screen cards are not watched: a wall of forty posts would otherwise run forty
       timers for pictures nobody is looking at. */
    if (typeof IntersectionObserver === "function") {
      const seen = new IntersectionObserver((entries) => {
        for (const entry of entries) entry.isIntersecting ? play() : hold();
      }, { rootMargin: "120px" });
      seen.observe(frame);
    }
  }
}

/* The tab being hidden should not leave pictures turning in the background. */
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopSlideshows();
    else startSlideshows(document);
  });
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
  const files = Array.from(document.getElementById("biglwaFeedPicker")?.files || []).slice(0, MAX_SLIDES);
  if (!caption && !files.length) { say("Add a photo or a caption first.", "bad"); return; }
  if (caption.length > 500) { say("Captions are limited to 500 characters.", "bad"); return; }

  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) submitButton.disabled = true;
  say("Posting…");

  /* Everything here needs an account, so it is settled before a byte is uploaded. */
  const { db, auth, addDoc, collection, doc, setDoc, deleteDoc, serverTimestamp } = await firebase();
  const user = auth.currentUser;
  if (!user) {
    say("Sign in to post to the feed.", "bad");
    if (submitButton) submitButton.disabled = false;
    return;
  }

  /* Photos are uploaded one at a time and the record is only written once every one of
     them is stored, so a post never points at a picture that is not there. */
  const uploaded = [];
  try {
    for (let i = 0; i < files.length; i++) {
      say("Uploading photo " + (i + 1) + " of " + files.length + "…");
      uploaded.push(await uploadImage(files[i], user));
    }
    const me = identity();
    const urls = uploaded.map((m) => m.url).filter(Boolean);
    const createdAt = serverTimestamp();
    const postData = {
      uid: user.uid,
      username: me?.username || "",
      authorName: me?.name || me?.username || "",
      caption: caption.slice(0, 500),
      imageKey: uploaded[0]?.key || null,
      imageUrl: urls[0] || null,
      imageKeys: uploaded.map((m) => m.key).filter(Boolean),
      imageUrls: urls,
      source: "biglwa",
      state: "approved",
      createdAt
    };
    const postRef = await addDoc(collection(db, "posts"), postData);
    await setDoc(doc(db, "users", user.uid, "posts", postRef.id), postData);
    form.reset();
    document.getElementById("biglwaFeedThumbs")?.remove();
    document.getElementById("biglwaFeedThumb")?.remove();
    say("Posted to the feed.", "good");
    await loadPosts();
  } catch (error) {
    /* Roll every picture back so a rejected post does not leave files behind. */
    for (const media of uploaded) await removeImage(media.key, user.uid);
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
  holder.innerHTML = '<input type="file" id="biglwaFeedPicker" accept="image/jpeg,image/png,image/webp,image/gif" multiple>Choose up to ' + MAX_SLIDES + ' photos';
  const text = form.querySelector("textarea");
  if (text) text.placeholder = "Say something, or add photos";
  form.appendChild(holder);
  const status = document.createElement("p");
  status.id = "biglwaFeedStatus";
  status.setAttribute("role", "status");
  form.appendChild(status);

  holder.querySelector("input").addEventListener("change", (event) => {
    document.getElementById("biglwaFeedThumbs")?.remove();
    const files = Array.from(event.target.files || []).slice(0, MAX_SLIDES);
    if (!files.length) return;
    /* Extra choices beyond the ceiling are reported rather than dropped silently. */
    const extra = event.target.files.length - files.length;
    const strip = document.createElement("div");
    strip.id = "biglwaFeedThumbs";
    strip.className = "biglwa-thumbs";
    for (const file of files) {
      const cell = document.createElement("span");
      cell.className = "biglwa-thumb";
      const img = document.createElement("img");
      img.alt = "";
      img.src = URL.createObjectURL(file);
      cell.appendChild(img);
      strip.appendChild(cell);
    }
    form.insertBefore(strip, status);
    const total = files.reduce((sum, file) => sum + file.size, 0);
    say(files.length + (files.length > 1 ? " photos" : " photo") + " · " +
      Math.round(total / 1024) + " KB" + (extra ? " · only the first " + MAX_SLIDES + " will post" : ""));
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submit(form);
  });
}

/* Yellow hides the post from the wall but keeps the record and its photos. The author can
   always change `state`, so no rules change is needed. The list stops drawing posts whose
   state is "archived" both here and in loadPosts. */
async function archivePost(post, action) {
  action.disabled = true;
  try {
    const { db, doc, updateDoc, setDoc, serverTimestamp } = await firebase();
    await updateDoc(doc(db, "posts", post.id), { state: "archived", updatedAt: serverTimestamp() });
    await setDoc(doc(db, "users", identity().uid, "posts", post.id), { state: "archived", updatedAt: serverTimestamp() }, { merge: true });
    posts = posts.filter((p) => p.id !== post.id);
    renderPosts();
    say("Post archived.", "good");
  } catch (error) {
    action.disabled = false;
    say(error.message || "That post could not be archived.", "bad");
  }
}

/* Red removes the post and every picture it carries. Earlier only the first key was
   cleared, so a multi-photo post left its other files behind; the whole list goes now. */
async function deletePost(post, action) {
  if (!window.confirm("Delete this post and its photos?")) return;
  action.disabled = true;
  try {
    const { db, doc, deleteDoc } = await firebase();
    await deleteDoc(doc(db, "posts", post.id));
    if (identity()?.uid === post.uid) await deleteDoc(doc(db, "users", post.uid, "posts", post.id));
    const keys = Array.isArray(post.imageKeys)
      ? post.imageKeys.filter(Boolean)
      : (post.imageKey ? [post.imageKey] : []);
    for (const key of keys) await removeImage(key);
    posts = posts.filter((p) => p.id !== post.id);
    renderPosts();
    say("Post removed.", "good");
  } catch (error) {
    action.disabled = false;
    say(error.message || "That post could not be removed.", "bad");
  }
}

/* Green opens the post large. A link opens whichever picture is showing at full size. */
let lightbox = null;
function openLightbox(post, index) {
  closeLightbox();
  const urls = slideUrls(post);
  if (!urls.length) return;
  const many = urls.length > 1;
  const box = document.createElement("div");
  box.className = "biglwa-lightbox";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.setAttribute("aria-label", "Show photo");
  box.innerHTML =
    '<button type="button" class="biglwa-lightbox-close" data-lightbox-close aria-label="Close">&#215;</button>' +
    '<div class="biglwa-lightbox-stage">' +
    '<img src="" alt="">' +
    '<span class="biglwa-lightbox-count"></span>' +
    (many
      ? '<button type="button" class="biglwa-lightbox-arrow prev" data-lightbox-step="-1" aria-label="Previous photo">&#8249;</button>' +
        '<button type="button" class="biglwa-lightbox-arrow next" data-lightbox-step="1" aria-label="Next photo">&#8250;</button>'
      : "") +
    "</div>" +
    '<div class="biglwa-lightbox-meta">' +
    '<a class="biglwa-lightbox-view" target="_blank" rel="noopener noreferrer">View full size</a>' +
    "</div>";
  document.body.appendChild(box);
  lightbox = { box, urls, index: 0 };

  const img = box.querySelector("img");

  const go = (next) => {
    if (!lightbox) return;
    lightbox.index = (next + urls.length) % urls.length;
    const url = urls[lightbox.index];
    img.src = url;
    img.alt = (post.caption ? post.caption : "Feed picture") + " (" + (lightbox.index + 1) + "/" + urls.length + ")";
    box.querySelectorAll("[data-lightbox-step]").forEach((button) => {
      button.disabled = !many;
      button.style.display = many ? "" : "none";
    });
    const count = box.querySelector(".biglwa-lightbox-count");
    count.textContent = (lightbox.index + 1) + " / " + urls.length;
    count.hidden = !many;
    const view = box.querySelector(".biglwa-lightbox-view");
    view.href = url;
  };

  box.addEventListener("click", (event) => {
    const step = event.target.closest("[data-lightbox-step]");
    if (step) { go(lightbox.index + Number(step.dataset.lightboxStep)); return; }
    if (event.target === box || event.target.closest("[data-lightbox-close]")) closeLightbox();
  });

  go(index || 0);
  box.querySelector(".biglwa-lightbox-close").focus({ preventScroll: true });
  document.documentElement.style.overflow = "hidden";
}

function closeLightbox() {
  if (!lightbox) return;
  lightbox.box.remove();
  lightbox = null;
  document.documentElement.style.overflow = "";
}

function closeMenus() {
  document.querySelectorAll(".biglwa-post-menu.is-open").forEach((menu) => {
    menu.classList.remove("is-open");
    const dots = menu.closest(".biglwa-pin-post")?.querySelector("[data-feed-dots]");
    if (dots) dots.setAttribute("aria-expanded", "false");
  });
}

function closeLightboxAndMenus() {
  closeLightbox();
  closeMenus();
}

/* Wires the composer and the three-dot menu exactly once per rendered feed, and only when
   the element is a new one. The route re-renders its markup on every visit, so identity of
   the element is what tells a fresh form from one that is already wired. */
let wiredList = null;
async function wire(list, form) {
  installStyle();
  if (!list) return;
  if (form) upgradeComposer(form);
  const draftPanel = document.getElementById("biglwaOrbitDrafts");
  if (draftPanel && !draftPanel.dataset.bigWired) {
    draftPanel.dataset.bigWired = "1";
    draftPanel.addEventListener("click", async (event) => {
      const bulk = event.target.closest("[data-orbit-publish-selected]");
      if (!bulk) return;
      const ids = Array.from(draftPanel.querySelectorAll("[data-orbit-draft-check]:checked")).map((input) => input.value);
      if (!ids.length) { say("Choose at least one imported post.", "bad"); return; }
      bulk.disabled = true;
      try {
        for (const id of ids) await publishDraft(id);
        say(ids.length + (ids.length === 1 ? " post" : " posts") + " added to the collective feed.", "good");
        await loadPosts();
      } catch (error) {
        say(error.message || "Those posts could not be published.", "bad");
      } finally {
        bulk.disabled = false;
      }
    });
  }
  if (list !== wiredList) {
    wiredList = list;
    list.addEventListener("click", (event) => {
      const dots = event.target.closest("[data-feed-dots]");
      if (dots) {
        event.preventDefault();
        event.stopPropagation();
        const menu = dots.closest(".biglwa-pin-post")?.querySelector(".biglwa-post-menu");
        if (menu && menu.classList.contains("is-open")) {
          menu.classList.remove("is-open");
          dots.setAttribute("aria-expanded", "false");
          return;
        }
        closeMenus();
        if (menu) {
          menu.classList.add("is-open");
          dots.setAttribute("aria-expanded", "true");
        }
        return;
      }
      const action = event.target.closest("[data-post-enlarge],[data-post-archive],[data-post-delete]");
      if (action) {
        const card = action.closest(".biglwa-pin-post");
        const post = card && posts.find((p) => p.id === card.dataset.postId);
        if (!post) return;
        closeMenus();
        if (action.hasAttribute("data-post-enlarge")) openLightbox(post, 0);
        else if (action.hasAttribute("data-post-archive")) archivePost(post, action);
        else if (action.hasAttribute("data-post-delete")) deletePost(post, action);
        return;
      }
      closeMenus();
      const card = event.target.closest(".biglwa-pin-post");
      if (!card || !event.target.closest("img,.biglwa-pin-empty")) return;
      const post = posts.find((p) => p.id === card.dataset.postId);
      if (post) openLightbox(post, 0);
    });
    if (!window.__biglwaMenuCloser) {
      window.__biglwaMenuCloser = true;
      /* A single shared closer keeps an open menu from surviving a click anywhere else,
         and gives the lightbox and the menu one Escape key each. */
      document.addEventListener("click", (event) => {
        if (event.target.closest("[data-feed-dots],.biglwa-post-menu")) return;
        closeMenus();
      });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeLightboxAndMenus();
        if (!lightbox) return;
        if (event.key === "ArrowLeft") {
          const prev = lightbox.box.querySelector("[data-lightbox-step='-1']");
          if (prev) prev.click();
        }
        if (event.key === "ArrowRight") {
          const next = lightbox.box.querySelector("[data-lightbox-step='1']");
          if (next) next.click();
        }
      });
    }
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
  onIdentityChange((who) => {
    watch();
    if (who) loadPosts();
    else {
      posts = [];
      draftPosts = [];
      renderDrafts();
      renderPosts(true);
    }
  });
  watch();
  if (identity()) await loadPosts();
  window.__biglwaFeed = { loadPosts, renderPosts, refresh: loadPosts };
  return window.__biglwaFeed;
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", startFeed, { once: true });
else startFeed();

export default startFeed;
