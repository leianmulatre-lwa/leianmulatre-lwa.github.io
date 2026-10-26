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
check("TikTok is purple", feed.includes('tiktok: { rim:"#772dcc"'));
check("Facebook is blue", feed.includes('facebook: { rim:"#1658be"'));
check("Instagram is orange", feed.includes('instagram: { rim:"#f36b21", glow:"#ffad52"'));
check("anything without a rim of its own falls back to blood orange", feed.includes('{ rim:FEED_RIM }'));
check("a card takes the rim of its source", feed.includes("const shadow=postShadow(post,managed,displaySource)") && feed.includes("shadow.rim"));
check("TikTok cards are marked", feed.includes("biglwa-tiktok-card"));
check("Facebook cards are marked", feed.includes("biglwa-facebook-card"));

console.log("\n=== THE ARCHIVE HOLDS EVERY SOURCE, COLOUR KEPT, GREY ONLY WHEN OFF ===");
check("a card is read for its own source", pages.includes("const source=String(item.source||'instagram').toLowerCase();"));
check("the rim comes from the source palette", pages.includes("const visualTheme=themes[source]") && pages.includes("instagram:{rim:'#f36b21'"));
check("the card is marked with its source and shadow", pages.includes("' archive-src-'+esc(source)+'\" style=\"--feed-card-rim:'+rim+';--feed-card-shadow:'+visualTheme.shadow"));
check("both stored states are grouped colour-first", pages.includes(".module-workspace[data-module-key=\"archive\"] .instagram-archive-card.is-collective,") && pages.includes(".module-workspace[data-module-key=\"archive\"] .instagram-archive-card.is-archived{"));
check("the colour keeps the source rim, not a blanket grey", pages.includes(".module-workspace[data-module-key=\"archive\"] .instagram-archive-card.is-collective,") && pages.includes("box-shadow:3px 3px 0 var(--feed-card-rim,#a52a0c)!important;filter:none;opacity:1}") && !pages.includes("filter:grayscale(1)!important;opacity:.86}"));
check("only the picture of an off card goes grey", pages.includes(".instagram-archive-card.is-off .instagram-archive-media,") && pages.includes(".instagram-archive-card.is-archived .instagram-archive-media{filter:grayscale(1);opacity:.7}"));
check("each card carries a Live switch", pages.includes("data-archive-live-input=\"'+esc(item.id)+'\""));
check("the switch label is interactive", pages.includes("(posted?'Live':'Not live')+'</b>'"));
check("the switch is wired to publish or archive", pages.includes("postsApi?.publishOrbitPost?.(id)") && pages.includes("postsApi?.setOrbitState?.(id,'archived')"));
check("a card on the Collective Feed is coloured here", pages.includes('aria-label="Platform shadow key: widget face and one source shadow"'));
check("the Archive no longer claims to be Instagram-only", !pages.includes("Instagram archive</h2>") && !pages.includes("Instagram posts imported"));

console.log("\n=== GROUPED, WITH REPEATS SPOTTED ===");
check("a card is fingerprinted", pages.includes("function archiveFingerprint(item)"));
check("cards are bucketed by that fingerprint", pages.includes("const groups=new Map();"));
check("cards are sorted into source blocks", pages.includes("const sa=String(items[a].source||'').toLowerCase(), sb=String(items[b].source||'').toLowerCase();"));
check("newest first inside a source", pages.includes("return (items[b].sourceCreatedAtMs||0)-(items[a].sourceCreatedAtMs||0);"));
check("a repeat is counted, not hidden", pages.includes("additional copies"));
check("each group is drawn under a source heading", pages.includes('class="archive-source-group"'));
check("the groups are styled as blocks", pages.includes(".archive-source-group{margin:0 0 26px}") && pages.includes(".archive-group-head{"));
check("a repeat group is called out", pages.includes(".archive-group-head .archive-group-repeats{"));
check("the card list is built first, then grouped", pages.includes("const cardList=mediaShown.map(") && pages.includes("const cards=groupCards(cardList,mediaShown,grouped,hideDupes);"));
check("the wall is four across on a wide screen", pages.includes(".instagram-archive-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))"));
check("the wall folds to 3, then 2, then 1", pages.includes(".instagram-archive-grid{grid-template-columns:repeat(3,minmax(0,1fr))}") && pages.includes(".instagram-archive-grid{grid-template-columns:repeat(2,minmax(0,1fr))}") && pages.includes(".instagram-archive-grid{grid-template-columns:1fr}"));
check("a flat card list still fills the same responsive wall", pages.includes(".archive-page-list:not(:has(.archive-source-group)){display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))"));

console.log("\n=== A TALL PICTURE CANNOT SWALLOW A ROW ===");
check("Archive derives each photo ratio, bounded against very wide images", pages.includes("aspect-ratio:var(--archive-photo-ratio,4/5)!important") && pages.includes("Math.max(.65,Math.min(1.55,w/h))"));
check("images fill their frames without grey letterboxing",pages.includes("object-fit:cover!important") && pages.includes("background:transparent!important"));
check("carousel media stays one card instead of showing a 2x2 tile wall", pages.includes("archive-carousel-actions") && pages.includes("function archivePieceMarkup(piece,index,total,cardIndex)"));
check("the card renders one media frame with navigation", pages.includes("const visualPieces=pieces.length?archivePieceMarkup(pieces[0]") && pages.includes("data-archive-step") && pages.includes("archive-carousel-actions"));
check("duplicate photos can hide repeated copies without breaking the source grid",pages.includes("const visible=hideDupes?indexes.slice(0,1):indexes;")&&pages.includes("if(!sourceGroups.has(source))sourceGroups.set(source,[]);"));

check("first load uses the updated Archive media array", pages.indexOf("const media=archiveMedia;")>pages.indexOf("if(!archiveInitialized) await loadInitial();"));
check("Pinterest images can fall back to known thumbnails", pages.includes("data-archive-fallback"));
check("Archive refresh includes Pinterest", pages.includes("window.__biglwaPinterest.syncAllBoards()"));
console.log("\n=== MANAGE POPUP FOR EVERY ORBIT CONNECTION ===");
check("the toolbar opens a connections popup", pages.includes('id="archiveConnections"') && pages.includes("()=>openConnectionsPopup()"));
check("the popup covers every Orbit source", pages.includes("[...ORBIT_APPS,...PLANETARY_APPS].map(([k,g,n,t])=>{") && pages.includes("root.className='biglwa-popup-backdrop'"));
check("OAuth rows connect, reconnect, and unlink in place", pages.includes("data-orbit-connect=") && pages.includes("data-orbit-unlink=") && pages.includes("window.__biglwaConnections?.forget?.(k)"));
check("plain-link rows hand over to the Orbit page", pages.includes('data-orbit-manage=') && pages.includes("dismiss();openModule('orbit')"));

console.log("\n=== SOURCE FILTERS ON THE ARCHIVE WALL ===");
check("filters persist in localStorage", pages.includes("const FILTER_KEY='biglwaArchiveFilters'"));
check("the wall renders only allowed sources", pages.includes("mediaShown=filtering?media.filter(item=>allowed.has(sourceNameOf(item))):media"));
check("a chip per source is offered", pages.includes("data-archive-source-filter=\"'+esc(k)+'\""));
check("chips and the duplicates toggle save then redraw", pages.includes("saveFilters(f);await draw()"));

console.log("\n=== ORBIT API CHIPS ===");
check("each API carries its own colour", pages.includes("['facebook','FB','Facebook','#1658be']") && pages.includes("['tiktok','TT','TikTok','#772dcc']") && pages.includes("['tumblr','T','Tumblr','#1b304b']"));
check("the chip is painted with it", pages.includes('class="orbit-platform-badge" aria-hidden="true" style="background:'));
check("the letter is pinned white so the widget colour cannot swallow it", pages.includes("color:#fff!important;font-size:8px;font-weight:800;-webkit-text-fill-color:#fff"));
check("the row colour rule can no longer outrank the chip", pages.includes(".module-workspace .module-orbit-row header span{"));
check("both row shapes use the coloured chip", pages.includes('${orbitBadge(g,t)}</div>') && pages.includes("+'</header>'+orbitBadge(g,t)"));
check("the row map unpacks the colour", pages.includes("[...ORBIT_APPS,...PLANETARY_APPS].map(([k,g,n,t])=>{"));
check("the old one-black-pill markup is gone", !pages.includes("<span>${g}</span>"));

check("Archive Instagram shadow uses orange tones", pages.includes("box-shadow:3px 3px 0 #f36b21,7px 7px 0 -2px #ffad52"));
check("Archive Pinterest shadow has red depth", pages.includes("box-shadow:3px 3px 0 #e60023,6px 6px 0 -2px #ff5269"));

check("Archive places its colored light controls within the image frame rather than a title strip",
 pages.includes("'<div class=\"instagram-archive-media\">'+") &&
 pages.includes("carouselControls+actions+") &&
 pages.includes("archive-card-overlay") &&
 !pages.includes("const strip='<div class=\"instagram-archive-strip\">"));
check("Archive has one source color key above the grid",
 pages.includes('class="module-shadow-key"') &&
 pages.includes('"instagram","Instagram","#f36b21"') && pages.includes('"pinterest","Pinterest","#e60023"'));
check("Archive grid groups by source not every photo",
 pages.includes('const sourceGroups=new Map()') && pages.includes('data-archive-group="\'+esc(source)'));
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

check("Pinterest legend is red, matching imported cards", pages.includes('"pinterest","Pinterest","#e60023"') && pages.includes("box-shadow:3px 3px 0 var(--key-shadow"));
check("archive control buttons are icons, not colored fake browser dots", pages.includes('data-archive-delete aria-label="Delete this post" title="Delete">×</button>') && pages.includes('data-archive-enlarge aria-label="Open this photo" title="Open this photo">↗</button>'));


// Orbit's colors are the canonical UI contract. Check both live Veve and Archive.
const orbitColors=readFileSync(new URL('./orbit-planets-20261015.css',import.meta.url),'utf8');
const veveColors=readFileSync(new URL('./veve.css',import.meta.url),'utf8');
const viewColors=readFileSync(new URL('./feed-view.js',import.meta.url),'utf8');
const palette=[['instagram','#f36b21'],['tiktok','#772dcc'],['pinterest','#e60023'],['facebook','#1658be'],['snapchat','#ffda00'],['tumblr','#1b304b'],['x','#0e0e0e']];
for(const [source,color]of palette){
  assert.ok(orbitColors.includes('0 '+color+'!important')||orbitColors.includes(color),'Orbit recognizes '+source+' '+color);
  assert.ok(veveColors.includes('data-veve-origin="'+source+'"]{--veve-rim:'+color),'Veve uses Orbit palette for '+source);
  assert.ok(pages.includes('"'+source+'"'),'Archive color key names '+source);
}
assert.ok(pages.includes('"instagram","Instagram","#f36b21"')&&!pages.includes('"instagram","Instagram","#772dcc"'),'Archive does not revert Instagram to purple');
assert.ok(pages.includes('"tiktok","TikTok","#772dcc"')&&!pages.includes('"tiktok","TikTok","#0e0e0e"'),'Archive agrees on TikTok purple');
assert.ok(viewColors.includes('Instagram", accent: "#f36b21"'),'myfeed metadata agrees on Instagram orange');
assert.ok(pages.includes("['orbit','archive','feed','veve'].includes(key)"),'Veve also presents an origin color key');
