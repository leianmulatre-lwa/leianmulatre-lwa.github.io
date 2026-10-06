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
/* A post with a dozen photos is not a slideshow, it is a stack. Past this many the card
   settles on the first picture instead of drawing tabs and dots for every one of them,
   because thirteen numbered tabs in a strip a few pixels tall is noise rather than
   navigation. */
const MANY_PHOTOS = 8;
/* How many pictures are counted before a post is treated as a stack. Only the first
   MANY_PHOTOS are ever drawn, so this is just a ceiling on the counting work. */
const SLIDE_SCAN = 30;
const SLIDE_MS = 4200;

const esc = (value) => String(value == null ? "" : value).replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* One picture is the old shape and stays the common case, so it is read from either the
   list or the single field. The first photo is also written back to `imageUrl`, which is
   what the preview strip and anything older still read. */
/* Only real pictures are drawn. Records imported before the importer learned to tell a
   picture from a video can still carry an .mp4 in imageUrls, and pointing an <img> at one
   shows a broken image icon, so anything that is obviously a video file is dropped here too.
   A video contributes its poster instead, which is what keeps a reel or a video-only post
   from rendering as an empty card. */
const looksLikeVideoFile = (u) => /\.(mp4|mov|m4v|webm)(\?|$)/i.test(String(u || ""));
/* Every picture the post can show, so the card can tell a two-photo post from a
   thirteen-photo one before deciding what to draw. */
const pictureUrls = (post) => {
  const items = Array.isArray(post.mediaItems) ? post.mediaItems : [];
  const fromItems = items.map((piece) => {
    if (!piece) return "";
    /* A video can only ever be drawn by its poster. */
    if (piece.isPicture === false) return looksLikeVideoFile(piece.url) ? piece.thumbnailUrl || "" : "";
    const poster = piece.thumbnailUrl && !looksLikeVideoFile(piece.thumbnailUrl) ? piece.thumbnailUrl : "";
    return poster || piece.url;
  }).filter((u) => u && !looksLikeVideoFile(u));
  if (fromItems.length) return fromItems.slice(0, SLIDE_SCAN);
  const list = Array.isArray(post.imageUrls) ? post.imageUrls.filter((u) => typeof u === "string" && u && !looksLikeVideoFile(u)) : [];
  if (list.length) return list.slice(0, SLIDE_SCAN);
  return post.imageUrl && !looksLikeVideoFile(post.imageUrl) ? [post.imageUrl] : [];
};
/* What a card is actually allowed to draw. */
const slideUrls = (post) => pictureUrls(post).slice(0, MAX_SLIDES);

/* Each source gets its own colour, carried as a border and a soft outer glow rather than a
   fill, so a board of mixed cards still reads as one surface.
   These are the colours of the members' own posts, chosen by the `source` field on a Firestore
   document. The connected sources' live cards are painted from their marker class by
   orbit-feed.js, which carries the same values; the two lists have to agree or a board will
   show one shade for a post and another for the same account's live cards. */
const SOURCES = {
  biglwa:   { label: "BIGLWA",    accent: "#c1355a" },
  instagram:{ label: "Instagram", accent: "#f28c28" },
  tiktok:   { label: "TikTok",    accent: "#111111" },
  pinterest:{ label: "Pinterest", accent: "#e60023" },
  facebook: { label: "Facebook",  accent: "#1877f2" },
  youtube:  { label: "YouTube",   accent: "#d0202f" },
  soundcloud:{ label: "SoundCloud", accent: "#e2622a" },
  google:   { label: "Google",    accent: "#4285f4" }
};
/* One wall, one shadow, but each source keeps a rim you can recognise it by. Blood orange
   is the wall's own colour and the default for anything without a rim of its own; TikTok is
   black and Facebook is blue because those are the ones that were being mistaken for
   something else without it. */
const FEED_RIM = "#a52a0c";
const SOURCE_THEMES = {
  instagram: { rim:"#a52a0c", glow:"#962fbf", hot:"#fa7e1e" },
  tiktok: { rim:"#111111", glow:"#25f4ee", hot:"#fe2c55" },
  facebook: { rim:"#1877f2", glow:"#5aa0ff" },
  pinterest: { rim:"#e60023", glow:"#ff3554", hot:"#9f0018" },
  youtube: { rim:"#d0202f", glow:"#fff6ec", hot:"#ff0033" },
  soundcloud: { rim:"#ff5500", glow:"#ffb13b", hot:"#c93f00" },
  google: { rim:"#4285f4", glow:"#34a853", hot:"#fbbc04" },
  drive: { rim:"#4285f4", glow:"#34a853", hot:"#fbbc04" },
  calendar: { rim:"#4285f4", glow:"#fbbc04", hot:"#ea4335" }
};
const rimOf = (source) => (SOURCE_THEMES[String(source || "").toLowerCase()] || { rim:FEED_RIM }).rim;
const shadowOf = (source) => {
  const key = String(source || "").toLowerCase();
  const theme = SOURCE_THEMES[key] || { rim:FEED_RIM, glow:"#d95f6d" };
  if (key === "youtube") return "0 0 0 2px " + theme.rim + ",3px 3px 0 " + theme.glow + ",0 13px 28px -16px " + theme.rim;
  if (key === "instagram") return "3px 3px 0 " + theme.rim + ",-2px 9px 22px -15px " + theme.glow + ",8px 14px 26px -18px " + theme.hot;
  if (key === "tiktok") return "3px 3px 0 " + theme.rim + ",-2px 8px 20px -14px " + theme.glow + ",8px 13px 24px -16px " + theme.hot;
  if (theme.hot) return "3px 3px 0 " + theme.rim + ",0 12px 25px -16px " + theme.glow + ",0 0 18px -12px " + theme.hot;
  return "3px 3px 0 " + theme.rim + ",0 12px 25px -16px " + theme.glow;
};
const accentOf = (id) => (SOURCES[id] || SOURCES.biglwa);

const STYLE = `
/* A pin-board wall: multi-column, so each card packs upward into the first gap of
   its column instead of lining up with the row of its neighbours. The wall now takes the
   width the page gives it, so a wide window gets a wider wall instead of a narrow strip. */
#feedPageList{display:block!important;column-count:5!important;column-width:auto!important;column-gap:18px!important;column-fill:balance}
#feedPageList>*{break-inside:avoid;min-width:0;width:100%;margin:0 0 18px}
@media (max-width:1560px){#feedPageList{column-count:4!important}}
@media (max-width:1180px){#feedPageList{column-count:3!important}}
@media (max-width:820px){#feedPageList{column-count:2!important}}
@media (max-width:520px){#feedPageList{column-count:1!important}}
/* Every card wears the same blood-orange rim and the same soft glow. The cards that read
   best were the orange ones, and the rest were left on an old per-position colour cycle
   where only every sixth card happened to land on orange, so the wall looked accidental. */
.biglwa-pin{--feed-card-rim:#a52a0c;--feed-card-shadow:3px 3px 0 var(--feed-card-rim),0 12px 25px -16px rgba(216,95,109,.35);position:relative;min-width:0;overflow:hidden;border:1px solid #dfd4ca;border-radius:14px;background:#f1e9e1;display:block;width:100%;
  box-shadow:var(--feed-card-shadow)}
.biglwa-pin::before{content:none}
#biglwaOrbitDrafts{border:1px solid #dfd4ca!important;border-radius:20px!important;background:#eee6de!important;box-shadow:3px 3px 0 #a74b59,0 12px 30px rgba(55,42,34,.06)!important}
#biglwaOrbitDrafts .biglwa-draft-card{border:1px solid #dfd4ca!important;background:#f1e9e1!important;box-shadow:3px 3px 0 #d77b30}
#biglwaOrbitDrafts .biglwa-draft-card:nth-child(6n+2){box-shadow:3px 3px 0 #d1ad2f}.biglwa-draft-card:nth-child(6n+3){box-shadow:3px 3px 0 #4e8f61}.biglwa-draft-card:nth-child(6n+4){box-shadow:3px 3px 0 #416fa9}
/* A member's post keeps its own shape: the picture fills the column width at its true
   height and no caption sits on the card. The menu
   may drop below a short wide picture, so the card lets it escape and the picture itself
   is rounded instead of relying on the card to clip it. */
.biglwa-pin-post{overflow:hidden}
.biglwa-pin::before{border-radius:14px 14px 0 0}
/* A card carries a single + that opens a small tray underneath it, so a picture can be sent
   to a board, a project or the map without leaving the page. Boards and projects are the same
   local lists the module pages read, and the map is the same pin list map-app.html writes, so
   anything added here shows up in those places immediately. */
.biglwa-send{display:flex;justify-content:center;padding:6px 0 8px;background:rgba(var(--aura-rgb,216,95,109),.09)}
.biglwa-send-toggle{width:26px;height:26px;border:1px solid rgba(var(--aura-rgb,216,95,109),.35);border-radius:50%;
  background:#fffdf9;color:rgb(var(--aura-rgb,216,95,109));font:800 17px/1 system-ui;cursor:pointer}
.biglwa-send-toggle:hover{background:rgba(var(--aura-rgb,216,95,109),.14)}
.biglwa-send-tray{display:none;gap:8px;padding:4px 10px 10px;background:rgba(var(--aura-rgb,216,95,109),.09);
  border-top:1px solid rgba(var(--aura-rgb,216,95,109),.2)}
.biglwa-send[data-open="1"] .biglwa-send-tray{display:flex;flex-wrap:wrap}
.biglwa-send-tray button,.biglwa-send-tray input{border:1px solid rgba(var(--aura-rgb,216,95,109),.3);border-radius:999px;
  padding:5px 10px;background:#fffdf9;color:#3a332f;font:700 10px/1.2 system-ui;cursor:pointer}
.biglwa-send-tray button:hover{background:rgba(var(--aura-rgb,216,95,109),.14)}
.biglwa-send-tray input{flex:1;min-width:150px;cursor:text;font-weight:600}
.biglwa-send-tray .biglwa-send-status{width:100%;font:600 9px/1.4 system-ui;color:#6b605a}
/* An archived card is in colour but greyed back, so the Archive wall reads as stored rather
   than published. */
.biglwa-pin-post.is-archived{filter:grayscale(1);opacity:.82}
.biglwa-feed-hero-row{grid-template-columns:repeat(4,minmax(0,1fr))}
@media(max-width:760px){.biglwa-feed-hero-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
.bliglwa-pin-img{display:block;width:100%;height:auto;background:#efe7dd;border-radius:0}
/* Every card, single or multi-photo, takes its height from the picture it is showing, so the
   rim and shadow always end on the image instead of on a fixed frame. Single pictures already
   did this with height:auto; a slideshow was pinned to 4/3 with object-fit:cover, which is
   why some posts grew with their image and some were cropped to a fixed shape. The frame now
   follows the ratio of whichever photo is on show and contains it instead of cutting it. */
.biglwa-instagram-actions,.biglwa-instagram-browser-actions{order:2}
.biglwa-instagram-tabs,.biglwa-instagram-browser-tabs{order:1;margin-right:auto}
.biglwa-pin-body{padding:11px 13px 13px}
.biglwa-pin-body small{display:block;font:600 11px/1.4 system-ui;letter-spacing:.03em;text-transform:uppercase;color:#8a7a6c}
.biglwa-pin-empty{padding:15px}
.biglwa-pin-link{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px 12px;color:#302b28;text-decoration:none;border-top:1px solid #dfd4ca}
.biglwa-pin-link b{display:block;font:700 10px/1.35 system-ui;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.biglwa-pin-link small{display:block;margin-top:3px;font:600 8px/1.3 system-ui;color:#8b8179;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.biglwa-pin-link span{flex:none;border:1px solid #d8cec5;border-radius:999px;padding:5px 8px;font:700 8px/1 system-ui;color:#4f4742;background:#fffdf9}
/* Three actions sit in the top-right corner of every post the feed manages: green opens
   the picture large, yellow hides the post from the wall without removing it, and red
   deletes it. */
.biglwa-post-actions{position:absolute;top:8px;right:8px;z-index:8;display:flex;gap:4px}
.biglwa-post-actions button{width:20px;height:20px;border:1px solid rgba(255,255,255,.7);border-radius:50%;color:#fff;display:grid;place-items:center;font:800 9px/1 system-ui;cursor:pointer;box-shadow:0 2px 7px rgba(24,16,14,.24);transition:transform .15s ease,filter .15s ease}
.biglwa-post-actions button:hover{transform:translateY(-1px);filter:brightness(1.08)}
.biglwa-post-actions [data-post-delete]{background:#bd3f47}.biglwa-post-actions [data-post-archive]{background:#d1ad2f;color:#302719}.biglwa-post-actions [data-post-enlarge]{background:#4e8f61}
/* Instagram-imported cards get a tiny browser-window header. The strip is intentionally
   much thinner than the card itself: aura tint, three small traffic-light controls at right,
   and carousel tabs that sit in the same strip like browser tabs. */
/* Instagram uses one shared card treatment for both persisted Feed imports and the
   live Orbit cards. The live renderer no longer carries its own competing stylesheet. */
.biglwa-instagram-card,.instagram-feed-item{
  width:96%!important;margin-left:0!important;
  background:rgba(var(--aura-rgb,216,95,109),.09)!important;
  border-color:rgba(var(--aura-rgb,216,95,109),.2)!important;
  box-shadow:var(--feed-card-shadow,3px 3px 0 var(--feed-card-rim,var(--orbit-rim,#c13584)),0 12px 24px -16px rgba(216,95,109,.3))!important;
  border-radius:11px!important;overflow:hidden!important
}
.biglwa-instagram-card .biglwa-instagram-browser-strip,
.instagram-feed-item .biglwa-instagram-strip{
  height:15px!important;padding:1px 4px!important;gap:3px;
  box-sizing:border-box;display:flex;align-items:center;
  background:rgba(var(--aura-rgb,216,95,109),.17)!important;border:0!important;
  border-radius:10px 10px 0 0;position:relative;z-index:8
}
.biglwa-instagram-browser-tabs,.biglwa-instagram-tabs{
  display:flex;align-items:flex-end;gap:2px;min-width:0;height:12px;margin-right:auto
}
.biglwa-instagram-browser-tab,.biglwa-instagram-tab{
  height:11px;min-width:14px;padding:0 4px;border:0;
  border-radius:4px 4px 1px 1px;background:rgba(255,255,255,.22);
  color:rgba(75,45,20,.78);font:800 6px/11px system-ui;cursor:pointer
}
.biglwa-instagram-browser-tab.is-active,.biglwa-instagram-tab.is-active{
  height:12px;background:#fff3e2;color:#5a4c46;
  box-shadow:0 -1px 0 rgba(255,255,255,.5)
}
.biglwa-instagram-browser-actions,.biglwa-instagram-actions{
  display:flex;align-items:center;gap:3px;margin-left:auto
}
.biglwa-instagram-browser-actions button,
.biglwa-instagram-actions button,
.biglwa-instagram-actions a{
  width:8px!important;height:8px!important;min-width:8px!important;
  padding:0!important;border:0!important;border-radius:50%!important;
  display:block!important;color:transparent!important;font-size:0!important;
  line-height:0!important;cursor:pointer;box-shadow:none!important
}
.biglwa-instagram-browser-actions [data-post-delete],
.biglwa-instagram-actions button:nth-child(1){background:#bd3f47}
.biglwa-instagram-browser-actions [data-post-archive],
.biglwa-instagram-actions button:nth-child(2){background:#d1ad2f}
.biglwa-instagram-browser-actions [data-post-enlarge],
.biglwa-instagram-actions a{background:#4e8f61}
.biglwa-instagram-card .biglwa-slide,
.instagram-feed-item img,.instagram-feed-item video{
  border-radius:0!important;background:#c7c7c7
}
.biglwa-instagram-card .biglwa-slide>img{border-radius:0!important}
.biglwa-instagram-browser-actions button:hover,
.biglwa-instagram-actions button:hover,
.biglwa-instagram-actions a:hover{filter:brightness(1.08);transform:translateY(-1px)}
/* The source is told by the orange card treatment instead of an extra label. */
.biglwa-pin-src{display:none}
/* A post with more than one photo becomes a slideshow moving on by itself, with dots and
   arrows so it is still readable and pausable by hand. The frame holds one fixed shape for
   the whole life of the card: it starts at 4/5 and is measured once, from the first photo,
   when that photo arrives. Every picture then fills that fixed frame and is contained
   inside it, so advancing the slideshow cannot resize the card, cannot push the column
   around underneath the reader, and cannot leave a card sitting past its own ratio.
   The starting ratio is also why a picture that fails to load changes nothing: the frame
   is already the right size and simply stays empty. */
.biglwa-slide{position:relative;width:100%;aspect-ratio:4/5;min-height:120px;background:#efe7dd;overflow:hidden;border-radius:15px 15px 0 0}
.biglwa-slide>img{opacity:0;transition:opacity .45s ease}
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
.biglwa-slide-count{position:absolute;right:8px;top:8px;z-index:6;padding:3px 8px;border-radius:999px;
  background:rgba(24,16,14,.55);color:#fff;font:700 9px/1.5 system-ui;letter-spacing:.05em}
/* A single picture still pushes the card to its own height, because that shape is the
   picture's own and it is known before anything is drawn. A slideshow cannot: its shape
   would otherwise change every time a photo with a different ratio came on, which is what
   made cards drift while the page was being scrolled. So a slideshow frame is measured
   once and held, and its pictures are contained inside that shape. */
.biglwa-pin-img,.instagram-feed-item img,.instagram-feed-item video{
  display:block;width:100%;height:auto;max-height:none;aspect-ratio:auto;object-fit:contain
}
.biglwa-slide>img{display:block;position:absolute;inset:0;width:100%;height:100%;max-height:none;aspect-ratio:auto;object-fit:contain;z-index:1}
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
.biglwa-feed-hero-grid{display:grid;gap:12px}
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
      limit: store.limit, where: store.where, getDocs: store.getDocs, serverTimestamp: store.serverTimestamp,
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

let instagramHydrating = false;

/* Ordering and the owner fields are read consistently with orbit-posts.js. Sorting on the
   raw source string mis-ordered Instagram's epoch-seconds timestamps and put the newest
   card in the wrong place, which is what made the most recent Instagram card look like it
   had not uploaded. */
function postTimeMs(post) {
  const parse = window.__biglwaOrbitPosts?.sourceTimeMs;
  if (typeof parse === "function") {
    return parse(post.sourceCreatedAt) || parse(post.sourceCreatedAtMs) || timestampMs(post.createdAt);
  }
  return timestampMs(post.createdAt || post.sourceCreatedAt);
}

async function loadPosts() {
  if (loading) return posts;
  loading = true;
  try {
    const { db, auth, collection, query, where, limit, getDocs } = await firebase();
    const user = auth.currentUser;
    let rootPosts = [];
    let profilePosts = [];

    try {
      const publicSnap = await getDocs(query(collection(db, "posts"), where("state", "==", "approved"), limit(FEED_SIZE)));
      rootPosts = publicSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (error) {
      console.error("BIGLWA collective feed root load:", error);
    }

    if (user) {
      try {
        const profileSnap = await getDocs(collection(db, "users", user.uid, "posts"));
        profilePosts = profileSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        /* Exact recovery path for a connected Instagram account whose first restore
           happened before the account Feed persistence module was ready. */
        const instagram = window.__biglwaInstagramOrbit;
        const hasInstagram = profilePosts.some((p) => p.orbitImported && String(p.source || "").toLowerCase() === "instagram");
        if (!hasInstagram && !rootPosts.some((p) => p.orbitImported && String(p.source || "").toLowerCase() === "instagram")
            && instagram?.state?.connected && Array.isArray(instagram.state.media) && instagram.state.media.length && !instagramHydrating
            && typeof instagram.restore === "function") {
          instagramHydrating = true;
          try { await instagram.restore(); } catch (error) {
            console.warn("BIGLWA Instagram feed hydration:", error);
          } finally {
            instagramHydrating = false;
          }
          const refreshed = await getDocs(collection(db, "users", user.uid, "posts"));
          profilePosts = refreshed.docs.map((d) => ({ id: d.id, ...d.data() }));
        }

        const profileApproved = profilePosts.filter((p) => p.orbitImported && p.state === "approved");
        const rootIds = new Set(rootPosts.map((p) => p.id));
        const repair = window.__biglwaOrbitPosts?.savePostRecords;
        for (const profilePost of profileApproved) {
          if (rootIds.has(profilePost.id)) continue;
          rootIds.add(profilePost.id);
          rootPosts.push(profilePost);
          /* A card that reached the profile index but never the canonical record is written
             back through the shared writer, so the repair stamps the same owner fields and
             lands in the Archive too. Writing doc(db,"posts") directly from a reader is what
             left the two paths disagreeing. */
          if (typeof repair !== "function") continue;
          try {
            await repair(user.uid, profilePost.id, { ...profilePost, id: undefined }, { archiveState: profilePost.archiveState || "collective" });
          } catch (error) {
            console.warn("BIGLWA Orbit profile-to-feed repair:", error);
          }
        }
      } catch (error) {
        console.warn("BIGLWA account post load:", error);
      }
    }

    posts = rootPosts
      .filter((p) => p.state === "approved")
      .sort((a, b) => postTimeMs(b) - postTimeMs(a))
      .slice(0, FEED_SIZE);

    draftPosts = [];
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
  renderPosts(true);
  renderHero(true);
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
const HERO_SLOTS = 8;
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

  /* The widget is the latest eight POST slots, not eight arbitrary images, so the preview is
     two rows of four and always represents the same eight newest feed records. */
  const slots = posts.slice(0, HERO_SLOTS);
  const cards = slots.map((post) => {
    const src = accentOf(post.source);
    const caption = (post.caption || "").trim();
    const urls = slideUrls(post);
    const first = urls[0];
    if (!first) {
      return '<div class="biglwa-feed-hero-empty" style="--accent:' + src.accent + '">No thumbnail</div>';
    }
    const many = urls.length > 1;
    return '<a style="--accent:' + src.accent + '" href="' + esc(first) + '" target="_blank" rel="noopener noreferrer">' +
      (many ? '<span class="biglwa-feed-hero-count">' + urls.length + " photos</span>" : "") +
      '<img src="' + esc(first) + '" alt="' + esc(caption || "Feed picture") + '" loading="lazy">' +
      "</a>";
  }).join("");

  anchor.innerHTML = '<div class="biglwa-feed-hero-head"><h3>Latest pictures</h3><span>' +
    (rest ? "+" + rest + " more below" : withImage.length + (withImage.length === 1 ? " picture" : " pictures")) +
    "</span></div>" + '<div class="biglwa-feed-hero-grid">' +
    Array.from({ length: Math.ceil(cards.length / 4) }, (_, row) =>
      '<div class="biglwa-feed-hero-row">' +
      (cards ? cards.slice(row * 4, row * 4 + 4).join("") : "") +
      "</div>").join("") +
    "</div>";
}

/* Redrawing the list on every call would drop hover and focus state and pull the reader
   out of a card they are on, so the markup is only rebuilt when the posts or the viewer
   actually differ. A newly rendered feed route is a new list and still gets drawn. */
/* The + and its tray are pure markup so the card stays a string template, but the tray is
   built with the post's own picture and caption so the reader can see what they are sending. */
function sendBar(post) {
  void post;
  return sendBarMarkup();
}
function sendBarMarkup() {
  return '<div class="biglwa-send" data-open="0">' +
    '<button class="biglwa-send-toggle" type="button" data-send-toggle aria-expanded="false" ' +
    'aria-label="Send this picture to a board, project or the map" title="Send to boards, projects or map">+</button>' +
    '<div class="biglwa-send-tray">' +
      '<button type="button" data-send-to="boards">Send to a board</button>' +
      '<button type="button" data-send-to="projects">Send to a project</button>' +
      '<input type="text" data-send-map-field placeholder="Map address, e.g. Rotterdam or 51.92, 4.48" aria-label="Map address for this picture">' +
      '<button type="button" data-send-map>Pin on the map</button>' +
      '<span class="biglwa-send-status" data-send-status aria-live="polite"></span>' +
    "</div>" +
  "</div>";
}
/* Live source cards, such as the connected Instagram ones, are not in `posts`, so they
   hand their own picture record in here. That lets the same + tray sit under every card on
   the wall instead of only under the saved posts. */
const sentCards = new Map();
function registerSendCard(card) {
  if (!card || !card.dataset || !card.dataset.postId) return;
  sentCards.set(card.dataset.postId, card.dataset.sendRecord ? JSON.parse(card.dataset.sendRecord) : null);
}
function postForCard(card) {
  if (!card || !card.dataset || !card.dataset.postId) return null;
  return posts.find((p) => p.id === card.dataset.postId)
    || sentCards.get(card.dataset.postId)
    || null;
}
function sendStatus(tray, message) {
  const out = tray && tray.querySelector("[data-send-status]");
  if (out) out.textContent = message;
}
/* Boards and projects are the same local lists the module pages read and write, and a map pin
   is the same record map-app.html stores, so a picture added here is already in those places
   when the tray reports it is saved. No page change is involved. */
function readLocalList(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch { return []; }
}
function writeLocalList(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
/* An address typed into the card is turned into coordinates here, so pinning a place does not
   need the map page or its search box. Photon is the same geocoder map-app.html already uses. */
async function geocodeAddress(query) {
  const url = "https://photon.komoot.io/api/?limit=1&q=" + encodeURIComponent(query);
  const response = await fetch(url);
  if (!response.ok) throw new Error("The address could not be looked up.");
  const data = await response.json();
  const feature = data && data.features && data.features[0];
  if (!feature || !feature.geometry) throw new Error("No place matched that address.");
  const coords = feature.geometry.coordinates;
  const properties = feature.properties || {};
  return {
    lat: Number(coords[1]),
    lng: Number(coords[0]),
    label: [properties.name, properties.city, properties.country].filter(Boolean).join(", ")
  };
}
async function sendPostTo(post, destination, tray, address) {
  const picture = slideUrls(post)[0] || "";
  const caption = (post.caption || "").trim();
  const label = caption ? caption.split("\n")[0].slice(0, 60) : "Picture from Collective Feed";
  if (destination === "map") {
    if (!address) { sendStatus(tray, "Type a place or address to pin."); return; }
    sendStatus(tray, "Looking up that address…");
    try {
      const place = await geocodeAddress(address);
      const pins = readLocalList("biglwaMapPins");
      const pin = {
        id: (crypto.randomUUID ? crypto.randomUUID() : "pin-" + Date.now()),
        title: place.label || address,
        detail: label,
        category: "Memory",
        visibility: "private",
        lat: place.lat,
        lng: place.lng,
        photo: picture,
        sourceUrl: post.sourceUrl || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      writeLocalList("biglwaMapPins", [pin, ...pins]);
      document.dispatchEvent(new CustomEvent("biglwa:map-pin-added", { detail: pin }));
      sendStatus(tray, "Pinned on your map at " + (place.label || address) + ".");
      if (tray) tray.dataset.open = "0";
    } catch (error) {
      sendStatus(tray, error.message || "That address could not be pinned.");
    }
    return;
  }
  const key = destination === "projects" ? "biglwaModule_projects" : "biglwaModule_boards";
  const items = readLocalList(key);
  const title = destination === "projects" ? label : (caption ? label : "Collective Feed picture");
  items.unshift({
    title,
    meta: [picture, post.sourceUrl || ""].filter(Boolean).join(" · "),
    photo: picture,
    sourceUrl: post.sourceUrl || "",
    date: new Date().toLocaleDateString()
  });
  writeLocalList(key, items);
  sendStatus(tray, "Saved to your " + (destination === "projects" ? "projects" : "boards") + ".");
  document.dispatchEvent(new CustomEvent("biglwa:" + destination + "-updated"));
  if (tray) tray.dataset.open = "0";
}
async function publishDraft(postId) {
  /* Publishing went through its own two-path write that skipped the Archive entirely, so a
     draft promoted to the Collective Feed was missing from the account's Archive until the
     next reconnect happened to rewrite it. setOrbitState owns the approved transition and
     updates the canonical record, the profile index, and the Archive together. */
  const orbit = window.__biglwaOrbitPosts;
  if (typeof orbit?.setOrbitState !== "function") throw new Error("The feed is still loading. Try again in a moment.");
  return orbit.setOrbitState(postId, "approved");
}
function renderPosts(force) {
  const list = document.getElementById("feedPageList");
  if (!list) return;
  const me = identity()?.uid;
    const signature = posts.map((p) => p.id + ":" + pictureUrls(p).join(",") + ":" + (p.caption || "") + ":" + (p.createdAt || "")).join("|") + "@" + (me || "")
;
  if (!force && list === drawnOn && signature === drawnSignature) return;
  drawnOn = list;
  drawnSignature = signature;

  list.querySelectorAll(".biglwa-pin-post").forEach((node) => node.remove());
  stopSlideshows();
  if (!posts.length) return;
  const html = posts.map((post) => {
    const src = accentOf(post.source);
    void src;
    /* Counted before drawing, because a post with thirteen photos is a stack rather than
       a slideshow and should settle on one picture instead of drawing thirteen tabs. */
    const everyPhoto = pictureUrls(post);
    const urls = everyPhoto.slice(0, MAX_SLIDES);
    const isStack = everyPhoto.length >= MANY_PHOTOS;
    const managed = Boolean(me && post.uid === me);
    const isInstagram = String(post.source || "").toLowerCase() === "instagram";
    const shown = isStack ? urls.slice(0, 1) : urls;
    const image = !shown.length
      ? '<div class="biglwa-pin-empty"><small>Media</small></div>'
      : shown.length === 1
        ? '<img class="biglwa-pin-img" src="' + esc(shown[0]) + '" alt="Collective feed media" loading="lazy">'
        : slideshow(shown, "Collective feed media");
    const link = !isInstagram && post.sourceUrl ? '<a class="biglwa-pin-link" data-post-link href="' + esc(post.sourceUrl) + '" target="_blank" rel="noopener noreferrer"><span><b>' + esc(post.linkTitle || "Shared link") + '</b><small>' + esc(post.sourceUrl) + '</small></span><span>open</span></a>' : "";
    const carousel = !isStack && shown.length > 1;
    const tabs = carousel
      ? '<div class="biglwa-instagram-browser-tabs" aria-label="Instagram carousel tabs">' +
        shown.map((_, i) => '<button type="button" class="biglwa-instagram-browser-tab' + (i === 0 ? ' is-active' : '') + '" data-instagram-slide="' + i + '">' + (i + 1) + '</button>').join("") +
        '</div>'
      : '<span class="biglwa-instagram-browser-tabs" aria-hidden="true"></span>';
    const browserStrip = isInstagram
      ? '<div class="biglwa-instagram-browser-strip">' +
          tabs +
          (managed
            ? '<div class="biglwa-instagram-browser-actions" aria-label="Instagram post actions">' +
              '<button type="button" data-post-delete aria-label="Delete from Collective Feed" title="Delete"></button>' +
              '<button type="button" data-post-archive aria-label="Archive" title="Archive"></button>' +
              '<button type="button" data-post-enlarge aria-label="Enlarge" title="Enlarge"></button>' +
              '</div>'
            : '') +
        '</div>'
      : '';
    return '<article class="biglwa-pin biglwa-pin-post' + (isInstagram ? ' biglwa-instagram-card' : '') + (String(post.source || "").toLowerCase() === "tiktok" ? ' biglwa-tiktok-card' : '') + (String(post.source || "").toLowerCase() === "facebook" ? ' biglwa-facebook-card' : '') + '" style="--feed-card-rim:' + rimOf(post.source) + ';--feed-card-shadow:' + shadowOf(post.source) + '" data-post-id="' + esc(post.id) + '">' +
      '<div>' + browserStrip + image + "</div>" + link +
      sendBar(post) +
      (!isInstagram && managed
        ? '<div class="biglwa-post-actions">' +
          '<button type="button" data-post-delete aria-label="Delete from Collective Feed" title="Delete from Collective Feed">&#10005;</button>' +
          '<button type="button" data-post-archive aria-label="Archive" title="Archive">&#9662;</button>' +
          '<button type="button" data-post-enlarge aria-label="Enlarge" title="Enlarge">&#8599;</button>' +
          "</div>"
        : "") +
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
    /* The frame is measured once, from the first photo, and then left alone for good. It
       used to grow to whatever picture was on show, so every slide change resized the card
       and shoved everything below it along, which is what made the wall drift while being
       scrolled. A first photo that never arrives simply leaves the frame at the ratio the
       stylesheet gives it, so a picture that fails to load cannot change the card's shape
       either. Later photos are measured, never applied. */
    let at = 0;
    let shaped = frame.style.aspectRatio !== "";
    const shapeFrom = (img) => {
      if (shaped) return;
      const w = img.naturalWidth, h = img.naturalHeight;
      if (!w || !h) return;
      shaped = true;
      frame.style.aspectRatio = w + " / " + h;
    };
    if (photos[0].complete && photos[0].naturalWidth) shapeFrom(photos[0]);
    photos.forEach((img, i) => {
      if (i > 0) return;
      img.addEventListener("load", () => shapeFrom(img), { once: true });
      img.addEventListener("error", () => { shaped = true; }, { once: true });
    });

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
  const data = new FormData(form);
  const url = String(data.get("url") || "").trim();
  const picker = document.getElementById("biglwaFeedPicker");
  const file = picker?.files?.[0] || null;
  if (!url && !file) { say("Add a link or a photo first.", "bad"); return; }

  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) submitButton.disabled = true;
  say("Saving your post…");

  try {
    const publisher = window.__biglwaCollectivePublish;
    if (!publisher?.createFeedDraft) throw new Error("The collective feed uploader is still loading. Try again in a moment.");
    const draft = await publisher.createFeedDraft({ url, blob: file || null });
    await publishDraft(draft.id);
    form.reset();
    document.getElementById("biglwaFeedThumbs")?.remove();
    say("Posted to the Collective Feed.", "good");
    await loadPosts();
  } catch (error) {
    console.error("BIGLWA feed post:", error);
    say(error.message || "That post could not be published.", "bad");
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
}

/* The Feed composer is deliberately small: one link, plus one optional photo.
   A link gets its thumbnail from the server-side Open Graph preview; the photo replaces
   that thumbnail when supplied. No caption is collected or stored here. */
function upgradeComposer(form) {
  if (!form || form.dataset.bigUpgrade) return;
  form.dataset.bigUpgrade = "1";
  const picker = document.getElementById("biglwaFeedPicker");
  if (picker) {
    picker.addEventListener("change", (event) => {
      document.getElementById("biglwaFeedThumbs")?.remove();
      const file = event.target.files?.[0];
      if (!file) return;
      const strip = document.createElement("div");
      strip.id = "biglwaFeedThumbs";
      strip.className = "biglwa-thumbs";
      const cell = document.createElement("span");
      cell.className = "biglwa-thumb";
      const img = document.createElement("img");
      img.alt = "";
      img.src = URL.createObjectURL(file);
      cell.appendChild(img);
      strip.appendChild(cell);
      form.appendChild(strip);
      say("Photo selected · it will be attached to the post.");
    });
  }
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
    /* Every card goes through orbit-posts.js, not just imported ones. This used to branch
       on post.orbitImported and hand-roll the write for everything else, which updated
       /posts and the profile index but never the Archive, so a Studio or link post could
       be hidden from the feed and be missing from the Archive at the same time. */
    const orbit = window.__biglwaOrbitPosts;
    if (typeof orbit?.setOrbitState !== "function") throw new Error("The feed is still loading. Try again in a moment.");
    await orbit.setOrbitState(post.id, "archived");
    posts = posts.filter((p) => p.id !== post.id);
    renderPosts(true);
    renderHero(true);
    say("Post archived and moved to Archive.", "good");
    window.dispatchEvent(new CustomEvent("biglwa:orbit-state-changed", { detail: { id: post.id, state: "archived" } }));
  } catch (error) {
    action.disabled = false;
    say(error.message || "That post could not be archived.", "bad");
  }
}
/* Red removes the post and every picture it carries. Earlier only the first key was
   cleared, so a multi-photo post left its other files behind; the whole list goes now. */
async function deletePost(post, action) {
  if (!window.confirm("Remove this post from the Collective Feed? It will stay in your Archive for 30 days before deletion.")) return;
  action.disabled = true;
  try {
    const orbit = window.__biglwaOrbitPosts;
    if (typeof orbit?.setOrbitState !== "function") throw new Error("The feed is still loading. Try again in a moment.");
    await orbit.setOrbitState(post.id, "pending_delete");
    posts = posts.filter((p) => p.id !== post.id);
    renderPosts(true);
    renderHero(true);
    say("Removed from Collective Feed. Your Archive now shows a 30-day deletion warning.", "good");
    window.dispatchEvent(new CustomEvent("biglwa:orbit-state-changed", { detail: { id: post.id, state: "pending_delete" } }));
  } catch (error) {
    action.disabled = false;
    say(error.message || "That post could not be scheduled for deletion.", "bad");
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
    img.alt = "Collective feed media (" + (lightbox.index + 1) + "/" + urls.length + ")";
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

/* Wires the composer and the three card actions exactly once per rendered feed, and only
   when the element is a new one. The route re-renders its markup on every visit, so
   identity of the element is what tells a fresh form from one that is already wired. */
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
      const instaTab = event.target.closest("[data-instagram-slide]");
      if (instaTab) {
        const card = instaTab.closest(".biglwa-instagram-card");
        const post = card && posts.find((p) => p.id === card.dataset.postId);
        const index = Number(instaTab.dataset.instagramSlide);
        const frame = card && card.querySelector("[data-biglwa-slideshow]");
        if (post && frame && Number.isInteger(index)) {
          const photos = Array.from(frame.querySelectorAll("img"));
          const dots = Array.from(frame.querySelectorAll(".biglwa-slide-dot i"));
          const count = frame.querySelector(".biglwa-slide-count");
          if (photos[index]) {
            photos.forEach((img, i) => img.classList.toggle("is-on", i === index));
            dots.forEach((dot, i) => dot.classList.toggle("is-on", i === index));
            if (count) count.textContent = (index + 1) + " / " + photos.length;
            card.querySelectorAll("[data-instagram-slide]").forEach((tab) => tab.classList.toggle("is-active", tab === instaTab));
          }
        }
        return;
      }
      const sendToggle = event.target.closest("[data-send-toggle]");
      if (sendToggle) {
        const tray = sendToggle.closest(".biglwa-send");
        if (tray) tray.dataset.open = tray.dataset.open === "1" ? "0" : "1";
        return;
      }
      const sendTo = event.target.closest("[data-send-to]");
      if (sendTo) {
        const post = postForCard(sendTo.closest("[data-post-id]"));
        if (post) sendPostTo(post, sendTo.dataset.sendTo, sendTo.closest(".biglwa-send"));
        return;
      }
      const sendMap = event.target.closest("[data-send-map]");
      if (sendMap) {
        const field = sendMap.closest(".biglwa-send-tray").querySelector("[data-send-map-field]");
        const post = postForCard(sendMap.closest("[data-post-id]"));
        if (post && field) sendPostTo(post, "map", sendMap.closest(".biglwa-send"), field.value.trim());
        return;
      }
      const action = event.target.closest("[data-post-enlarge],[data-post-archive],[data-post-delete]");
      if (action) {
        const card = action.closest(".biglwa-pin-post");
        const post = card && posts.find((p) => p.id === card.dataset.postId);
        if (!post) return;
        if (action.hasAttribute("data-post-enlarge")) openLightbox(post, 0);
        else if (action.hasAttribute("data-post-archive")) archivePost(post, action);
        else if (action.hasAttribute("data-post-delete")) deletePost(post, action);
        return;
      }
      const card = event.target.closest(".biglwa-pin-post");
      if (!card || !event.target.closest("img,.biglwa-pin-empty")) return;
      const post = posts.find((p) => p.id === card.dataset.postId);
      if (post) openLightbox(post, 0);
    });
    if (!window.__biglwaMenuCloser) {
      window.__biglwaMenuCloser = true;
      /* A single shared handler gives the lightbox one Escape key and its own arrows. */
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeLightbox();
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

window.addEventListener("biglwa:orbit-imported", () => { loadPosts(); });
window.addEventListener("biglwa:instagram-restored", () => { loadPosts(); });

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
      renderPosts(true);
    }
  });
  watch();
  if (identity()) await loadPosts();
  window.__biglwaFeed = { loadPosts, renderPosts, refresh: loadPosts, sendBarMarkup, registerSendCard };
  /* The connected source cards render before this module finishes booting, so they are told
     the wall is ready and they can add their own + tray then. */
  document.dispatchEvent(new CustomEvent("biglwa:feed-ready"));
  return window.__biglwaFeed;
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", startFeed, { once: true });
else startFeed();

export default startFeed;
