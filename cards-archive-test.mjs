// Covers the source rims, the Archive holding every source in grey while keeping its own
// rim, the grouping that puts repeats of one picture together, and the orbit API chips.
import { readFileSync } from "node:fs";

const feed = readFileSync(new URL("./feed-view.js", import.meta.url), "utf8");
const pages = readFileSync(new URL("./module-pages.js", import.meta.url), "utf8");

let pass = 0, fail = 0;
function check(name, cond, extra = "") {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}  ${extra}`); }
}

console.log("=== EACH SOURCE KEEPS ITS OWN RIM ===");
check("TikTok is black", feed.includes('tiktok: "#111111"'));
check("Facebook is blue", feed.includes('facebook: "#1877f2"'));
check("Instagram is blood orange", feed.includes('instagram: "#a52a0c"'));
check("anything without a rim of its own falls back to blood orange", feed.includes('|| FEED_RIM'));
check("a card takes the rim of its source", feed.includes("--feed-card-rim:' + rimOf(post.source)"));
check("TikTok cards are marked", feed.includes("biglwa-tiktok-card"));
check("Facebook cards are marked", feed.includes("biglwa-facebook-card"));

console.log("\n=== THE ARCHIVE HOLDS EVERY SOURCE, IN GREY, RIM KEPT ===");
check("a card is read for its own source", pages.includes("const source=String(item.source||'instagram').toLowerCase();"));
check("the rim comes from the source", pages.includes("const rim={instagram:'#a52a0c',tiktok:'#111111',facebook:'#1877f2',pinterest:'#e60023'}[source]||'#a52a0c';"));
check("the card is marked with its source", pages.includes("' archive-src-'+esc(source)+'\" style=\"--feed-card-rim:'+rim+'\""));
check("both stored states are greyed together", pages.includes(".instagram-archive-card.is-archived,#studioApp[data-module-key=\"archive\"] .instagram-archive-card.is-collective{"));
check("the grey keeps the source rim", /is-collective\{[^}]*box-shadow:3px 3px 0 var\(--feed-card-rim,#a52a0c\)[^}]*filter:grayscale\(1\)/.test(pages));
check("a card on the Collective Feed is still grey here", pages.includes("Visible on Collective Feed · greyed here"));
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
check("the card list is built first, then grouped", pages.includes("const cardList=media.map(") && pages.includes("const cards=groupCards(cardList,media,grouped);"));

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