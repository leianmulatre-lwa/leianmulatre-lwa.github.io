// Covers the wall itself: blood-orange rim on every card, a slideshow that cannot change
// the card's shape, a picture that fails to load changing nothing, and a thirteen-photo post
// settling on one picture instead of drawing thirteen tabs.
import { readFileSync } from "node:fs";

const feed = readFileSync(new URL("./feed-view.js", import.meta.url), "utf8");
const orbit = readFileSync(new URL("./instagram-orbit.js", import.meta.url), "utf8");
const pages = readFileSync(new URL("./module-pages.js", import.meta.url), "utf8");

let pass = 0, fail = 0;
function check(name, cond, extra = "") {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}  ${extra}`); }
}

console.log("=== THE WALL IS WIDE ===");
check("the page shell is no longer capped at 1160", pages.includes(".module-shell{max-width:1720px"), "");
check("the feed reaches closest to the edges", pages.includes('data-module-key="feed"]{padding-left:clamp(10px'));
check("the feed shell is allowed the full width", pages.includes('data-module-key="feed"] .module-shell{max-width:1920px}'));
check("five cards across on a wide screen", feed.includes("column-count:5!important"));
check("it steps down rather than staying five", /max-width:1560px\)\{#feedPageList\{column-count:4/.test(feed) && /max-width:1180px/.test(feed) && /max-width:820px/.test(feed) && /max-width:520px/.test(feed));

console.log("\n=== BLOOD ORANGE ON EVERY CARD ===");
check("blood orange is the fallback rim for the wall", feed.includes("const FEED_RIM = \"#a52a0c\""));
check("the rim is set on every card, from its own source", feed.includes("--feed-card-rim:' + rimOf(post.source)"));
check("the old per-position colour cycle is gone", !feed.includes("nth-child(6n+2){--feed-card-rim"));
check("the rim colour is not taken from the source accent any more", !feed.includes("esc(src.accent)"));
check("every card carries the hard rim and the soft glow", feed.includes(".biglwa-pin{--feed-card-rim:#a52a0c") && feed.includes("--feed-card-shadow:3px 3px 0 var(--feed-card-rim),0 12px") && feed.includes("box-shadow:var(--feed-card-shadow)"));
check("the live Instagram cards use the same rim", orbit.includes('style="--feed-card-rim:#a52a0c"'));

console.log("\n=== A SLIDESHOW CANNOT MOVE ITS CARD ===");
check("the frame starts at a fixed ratio", feed.includes(".biglwa-slide{position:relative;width:100%;aspect-ratio:4/5"));
check("no picture is in flow any more", !feed.includes(".biglwa-slide>img.is-on{position:relative"));
check("every picture fills the held frame", feed.includes(".biglwa-slide>img{display:block;position:absolute;inset:0"));
check("pictures are contained, so nothing runs past the card", feed.includes(".biglwa-slide>img{") && /\.biglwa-slide>img\{[^}]*object-fit:contain/.test(feed));
check("the frame is measured once and then left alone", feed.includes("let shaped = frame.style.aspectRatio !== \"\"") && feed.includes("if (shaped) return"));
check("only the first photo is ever measured", /photos\.forEach\(\(img, i\) => \{\s*\n\s*if \(i > 0\) return;/.test(feed));
check("a photo that fails leaves the frame as it was", feed.includes('img.addEventListener("error", () => { shaped = true; }'));
check("a single picture still pushes its card", /\.biglwa-pin-img,[^}]*height:auto[^}]*object-fit:contain/.test(feed));

console.log("\n=== A SAVED VIDEO PLAYS AS A VIDEO ===");
check("a video file draws a video element, not a still", feed.includes("? looksLikeVideoFile(shown[0])") && feed.includes("data-feed-video src=\"' + esc(shown[0])"));
check("the video keeps its poster as the stand-in", feed.includes('poster="\' + esc(fallbackSrc) + \'"') && feed.includes('preload="none" controls'));
check("the video has a quiet frame", feed.includes(".biglwa-pin-img[data-feed-video]") && feed.includes("background:#171310;min-height:140px"));
check("a picture file still draws an image", feed.includes("'<img class=\"biglwa-pin-img\" data-feed-media src=\"' + esc(shown[0])"));
check("broken feed pictures are guarded after each draw", feed.includes("startSlideshows(list);") && feed.includes("guardFeedPictures(list);"));

console.log("\n=== A POST WITH THIRTEEN PHOTOS IS A STACK ===");
check("there is a threshold for a stack", feed.includes("const MANY_PHOTOS = 8"));
check("every picture is counted before drawing", feed.includes("const everyPhoto = pictureUrls(post);") && feed.includes("const isStack = everyPhoto.length >= MANY_PHOTOS"));
check("a stack shows one picture", feed.includes("const shown = isStack ? urls.slice(0, 1) : urls;"));
check("a stack draws no tabs", feed.includes("const carousel = !isStack && shown.length > 1"));
check("the live Instagram cards use the same rule", orbit.includes("var manyPhotos = children.length >= 8") && orbit.includes("children.length > 1 && !manyPhotos"));

console.log("\n=== EVERY CARD HAS A + ===");
check("the tray markup is shareable", feed.includes("function sendBarMarkup()"));
check("the feed hands it out", feed.includes("window.__biglwaFeed = { loadPosts, renderPosts, refresh: loadPosts, sendBarMarkup, registerSendCard }"));
check("the live cards draw it", orbit.includes("window.__biglwaFeed.sendBarMarkup()"));
check("the live cards carry a post id and picture record", orbit.includes('data-post-id="\' + cardId + \'" data-send-record="\' + sendRecord + \'"'));
check("the live cards are registered with the feed", orbit.includes("window.__biglwaFeed.registerSendCard(card)"));
check("the tray is redrawn once the feed is ready", orbit.includes("document.addEventListener('biglwa:feed-ready'") && feed.includes('new CustomEvent("biglwa:feed-ready")'));
check("the tray works from any card, not just saved posts", feed.includes("function postForCard(card)") && !feed.includes('closest(".biglwa-pin-post")\n        const post'));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);