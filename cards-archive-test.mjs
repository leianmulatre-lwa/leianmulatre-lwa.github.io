// Covers the source rims, the Archive holding every source in its own colour while
// greying only the picture of a card switched off, the grouping that puts repeats of one
// picture together, and the orbit API chips.
import { readFileSync } from "node:fs";

const feed = readFileSync(new URL("./feed-view.js", import.meta.url), "utf8");
const pages = readFileSync(new URL("./module-pages.js", import.meta.url), "utf8");

let pass = 0, fail = 0;
function check(name, cond, extra = "") {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}  ${extra}`); }
}

console.log("=== EACH SOURCE KEEPS ITS OWN RIM ===");
check("TikTok is black", feed.includes('tiktok: { rim:"#111111"'));
check("Facebook is blue", feed.includes('facebook: { rim:"#1877f2"'));
check("Instagram is blood orange", feed.includes('instagram: { rim:"#a52a0c"'));
check("anything without a rim of its own falls back to blood orange", feed.includes('{ rim:FEED_RIM }'));
check("a card takes the rim of its source", feed.includes("--feed-card-rim:' + rimOf(post.source)"));
check("TikTok cards are marked", feed.includes("biglwa-tiktok-card"));
check("Facebook cards are marked", feed.includes("biglwa-facebook-card"));

console.log("\n=== THE ARCHIVE HOLDS EVERY SOURCE, COLOUR KEPT, GREY ONLY WHEN OFF ===");
check("a card is read for its own source", pages.includes("const source=String(item.source||'instagram').toLowerCase();"));
check("the rim comes from the source", pages.includes("const rim={instagram:'#a52a0c',tiktok:'#111111',facebook:'#1877f2',pinterest:'#e60023'}[source]||'#a52a0c';"));
check("the card is marked with its source", pages.includes("' archive-src-'+esc(source)+'\" style=\"--feed-card-rim:'+rim+'\""));
check("both stored states are grouped colour-first", pages.includes(".module-workspace[data-module-key=\"archive\"] .instagram-archive-card.is-collective,") && pages.includes(".module-workspace[data-module-key=\"archive\"] .instagram-archive-card.is-archived{"));
check("the colour keeps the source rim, not a blanket grey", pages.includes(".module-workspace[data-module-key=\"archive\"] .instagram-archive-card.is-collective,") && pages.includes("box-shadow:3px 3px 0 var(--feed-card-rim,#a52a0c)!important;filter:none;opacity:1}") && !pages.includes("filter:grayscale(1)!important;opacity:.86}"));
check("only the picture of an off card goes grey", pages.includes(".instagram-archive-card.is-off .instagram-archive-media,") && pages.includes(".instagram-archive-card.is-archived .instagram-archive-media{filter:grayscale(1);opacity:.7}"));
check("each card carries a Live switch", pages.includes("data-archive-live-input=\"'+esc(item.id)+'\""));
check("the switch label is interactive", pages.includes("(posted?'Live':'Not live')+'</b>'"));
check("the switch is wired to publish or archive", pages.includes("postsApi?.publishOrbitPost?.(id)") && pages.includes("postsApi?.setOrbitState?.(id,'archived')"));
check("a card on the Collective Feed is coloured here", pages.includes("In color · on the Collective Feed"));
check("the Archive no longer claims to be Instagram-only", !pages.includes("Instagram archive</h2>") && !pages.includes("Instagram posts imported"));

console.log("\n=== GROUPED, WITH REPEATS SPOTTED ===");
check("a card is fingerprinted", pages.includes("function archiveFingerprint(item)"));
check("cards are bucketed by that fingerprint", pages.includes("const groups=new Map();"));
check("cards are sorted into source blocks", pages.includes("const sa=String(items[a].source||'').toLowerCase(), sb=String(items[b].source||'').toLowerCase();"));
check("newest first inside a source", pages.includes("return (items[b].sourceCreatedAtMs||0)-(items[a].sourceCreatedAtMs||0);"));
check("a repeat is counted, not hidden", pages.includes("copies of one picture"));
check("each group is drawn under a source heading", pages.includes('class="archive-source-group"'));
check("the groups are styled as blocks", pages.includes(".archive-source-group{margin:0 0 26px}") && pages.includes(".archive-group-head{"));
check("a repeat group is called out", pages.includes(".archive-group-head .archive-group-repeats{"));
check("the card list is built first, then grouped", pages.includes("const cardList=mediaShown.map(") && pages.includes("const cards=groupCards(cardList,mediaShown,grouped,hideDupes);"));

console.log("\n=== A TALL PICTURE CANNOT SWALLOW A ROW ===");
check("every Archive piece sits in a fixed frame", pages.includes("aspect-ratio:5/6;min-height:112px;max-height:430px"));
check("media fill the frame instead of sizing themselves", pages.includes("position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:inherit") && !pages.includes("width:100%;height:auto;max-height:none;aspect-ratio:auto"));
check("a four-piece carousel is laid out as tiles", pages.includes(".instagram-archive-media.is-tiles{grid-template-columns:repeat(2,minmax(0,1fr))}"));
check("the card marks a four-piece carousel", pages.includes("' is-tiles':'')+'\""));
check("repeats can be hidden to one copy while still counted", pages.includes("indexes.slice(0,1):indexes)"));

console.log("\n=== MANAGE POPUP FOR EVERY ORBIT CONNECTION ===");
check("the toolbar opens a connections popup", pages.includes('id="archiveConnections"') && pages.includes("()=>openConnectionsPopup()"));
check("the popup covers every Orbit source", pages.includes("ORBIT_APPS.map(([k,g,n,t])=>{") && pages.includes("root.className='biglwa-popup-backdrop'"));
check("OAuth rows connect, reconnect, and unlink in place", pages.includes("data-orbit-connect=") && pages.includes("data-orbit-unlink=") && pages.includes("window.__biglwaConnections?.forget?.(k)"));
check("plain-link rows hand over to the Orbit page", pages.includes('data-orbit-manage=') && pages.includes("dismiss();openModule('orbit')"));

console.log("\n=== SOURCE FILTERS ON THE ARCHIVE WALL ===");
check("filters persist in localStorage", pages.includes("const FILTER_KEY='biglwaArchiveFilters'"));
check("the wall renders only allowed sources", pages.includes("mediaShown=filtering?media.filter(item=>allowed.has(sourceNameOf(item))):media"));
check("a chip per source is offered", pages.includes("data-archive-source-filter=\"'+esc(k)+'\""));
check("chips and the duplicates toggle save then redraw", pages.includes("saveFilters(f);await draw()"));

console.log("\n=== ORBIT API CHIPS ===");
check("each API carries its own colour", pages.includes("['facebook','FB','Facebook','#1877f2']") && pages.includes("['tiktok','TT','TikTok','#111111']"));
check("the chip is painted with it", pages.includes("const orbitBadge=(g,tint)=>'<span style=\"background:'+tint+'\">'"));
check("the letter is pinned white so the widget colour cannot swallow it", pages.includes("color:#fff!important;font-size:8px;font-weight:800;-webkit-text-fill-color:#fff"));
check("the row colour rule can no longer outrank the chip", pages.includes(".module-workspace .module-orbit-row header span{"));
check("both row shapes use the coloured chip", pages.includes("${orbitBadge(g,t)}${row?") && pages.includes("${orbitBadge(g,t)}</header>"));
check("the row map unpacks the colour", pages.includes("ORBIT_APPS.map(([k,g,n,t])=>{"));
check("the old one-black-pill markup is gone", !pages.includes("<span>${g}</span>"));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);