// Proves a video child never reaches an <img src>, and that a legacy record which already
// has an .mp4 in imageUrls is repaired at read time instead of showing a broken icon.
import { readFileSync } from "node:fs";

const posts = readFileSync(new URL("./orbit-posts.js", import.meta.url), "utf8");
const feed = readFileSync(new URL("./feed-view.js", import.meta.url), "utf8");

function lift(source, header) {
  const at = source.indexOf(header);
  if (at < 0) throw new Error(`${header} not found`);
  const braceAt = source.indexOf("{", at);
  let depth = 0, end = -1;
  for (let n = braceAt; n < source.length; n++) {
    if (source[n] === "{") depth++;
    else if (source[n] === "}") { depth--; if (depth === 0) { end = n + 1; break; } }
  }
  return source.slice(at, end);
}

const clean = (v) => String(v == null ? "" : v).trim();
const isPicturePiece = new Function("clean", lift(posts, "function isPicturePiece") + "\nreturn isPicturePiece;")(clean);
const pictureSrc = new Function("lift", lift(posts, "function pictureSrc") + "\nreturn pictureSrc;")();
const looksLikeVideoFile = new Function(lift(feed, "const looksLikeVideoFile") + "\nreturn looksLikeVideoFile;")();
const MAX_SLIDES = 10;
const slideUrls = new Function("MAX_SLIDES", "looksLikeVideoFile",
  lift(feed, "const slideUrls = (post)") + "\nreturn slideUrls;")(MAX_SLIDES, looksLikeVideoFile);

let pass = 0, fail = 0;
function check(name, cond, extra = "") {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}  ${extra}`); }
}

console.log("=== PIECE CLASSIFICATION ===");
check("still image is a picture", isPicturePiece({ media_type: "IMAGE", media_url: "https://x/a.jpg" }, {}));
check("carousel child image is a picture", isPicturePiece({ media_type: "IMAGE", media_url: "https://x/b.jpg" }, { media_type: "CAROUSEL_ALBUM" }));
check("video child is not a picture", !isPicturePiece({ media_type: "VIDEO", media_url: "https://x/c.mp4" }, {}));
check("reel is not a picture", !isPicturePiece({ media_type: "REELS", media_url: "https://x/d.mp4" }, {}));
check("mp4 extension wins over missing type", !isPicturePiece({ media_url: "https://x/e.mp4?stp=x" }, {}));
check("photo with query string is a picture", isPicturePiece({ media_type: "IMAGE", media_url: "https://x/f.jpg?_nc=1" }, {}));

console.log("\n=== VIDEO FILES NEVER REACH AN <img> ===");
check("mp4 detected", looksLikeVideoFile("https://x/a.mp4"));
check("mp4 with query detected", looksLikeVideoFile("https://x/a.mp4?token=1"));
check("mov detected", looksLikeVideoFile("https://x/a.MOV"));
check("jpg is not a video", !looksLikeVideoFile("https://x/a.jpg"));
check("r2 jpg is not a video", !looksLikeVideoFile("https://w.dev/media/orbit/uid/a.jpg"));

console.log("\n=== LEGACY RECORD WITH A VIDEO IN imageUrls ===");
const legacy = {
  imageUrl: "https://cdn/a.mp4",
  imageUrls: ["https://cdn/a.mp4", "https://cdn/b.mp4"],
  mediaItems: [
    { index: 0, isPicture: false, url: "https://cdn/a.mp4", thumbnailUrl: "https://cdn/a-poster.jpg", mediaType: "VIDEO" },
    { index: 1, isPicture: false, url: "https://cdn/b.mp4", thumbnailUrl: "", mediaType: "VIDEO" }
  ]
};
const healed = slideUrls(legacy);
check("video-only post still draws its poster", healed.length === 1 && healed[0].endsWith("a-poster.jpg"), JSON.stringify(healed));
check("no mp4 survives into the render list", !healed.some(looksLikeVideoFile), JSON.stringify(healed));

const reel = {
  imageUrl: "https://cdn/reel.mp4",
  imageUrls: [],
  mediaItems: [{ index: 0, isPicture: false, url: "https://cdn/reel.mp4", thumbnailUrl: "https://w.dev/media/orbit/uid/reel.jpg", mediaType: "VIDEO" }]
};
check("a reel renders its poster, not an empty card", slideUrls(reel).length === 1 && slideUrls(reel)[0].includes("reel.jpg"), JSON.stringify(slideUrls(reel)));

const noPoster = { imageUrls: [], mediaItems: [{ index: 0, isPicture: false, url: "https://cdn/x.mp4", thumbnailUrl: "", mediaType: "VIDEO" }] };
check("a video with no poster yields nothing rather than a broken icon", slideUrls(noPoster).length === 0, JSON.stringify(slideUrls(noPoster)));

const legacyNoMediaItems = { imageUrls: ["https://cdn/a.mp4", "https://cdn/b.jpg"] };
const healed2 = slideUrls(legacyNoMediaItems);
check("mp4 dropped when only imageUrls exists", !healed2.some(looksLikeVideoFile), JSON.stringify(healed2));
check("the real picture is kept", healed2.includes("https://cdn/b.jpg"), JSON.stringify(healed2));

console.log("\n=== NORMAL RECORDS UNAFFECTED ===");
const good = { imageUrls: ["https://w.dev/media/orbit/uid/1.jpg", "https://w.dev/media/orbit/uid/2.jpg"] };
check("two pictures both returned", slideUrls(good).length === 2);
const single = { imageUrl: "https://w.dev/media/orbit/uid/only.jpg" };
check("single picture still works", slideUrls(single).length === 1);
const mixed = {
  imageUrls: ["https://w.dev/media/orbit/uid/1.jpg"],
  mediaItems: [
    { index: 0, isPicture: true, url: "https://w.dev/media/orbit/uid/1.jpg", thumbnailUrl: "" },
    { index: 1, isPicture: false, url: "https://w.dev/media/orbit/uid/2.mp4", thumbnailUrl: "https://w.dev/media/orbit/uid/2.jpg", mediaType: "VIDEO" }
  ]
};
check("mixed post shows the photo and the video's poster", slideUrls(mixed).length === 2, JSON.stringify(slideUrls(mixed)));
check("mixed post keeps the photo first", slideUrls(mixed)[0].endsWith("1.jpg"));
check("mixed post never yields a video file", !slideUrls(mixed).some(looksLikeVideoFile), JSON.stringify(slideUrls(mixed)));

console.log("\n=== POSTER PREFERENCE ===");
const piece = { isPicture: true, url: "https://cdn/a.jpg", thumbnailUrl: "https://w.dev/media/orbit/uid/a.jpg" };
check("uses the hosted copy over the CDN link", pictureSrc(piece) === "https://w.dev/media/orbit/uid/a.jpg");
check("uses the url when there is no separate poster", pictureSrc({ isPicture: true, url: "https://cdn/b.jpg", thumbnailUrl: "" }) === "https://cdn/b.jpg");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);