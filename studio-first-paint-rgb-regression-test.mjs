import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
// Loading screen in the screenshot is not a DOM element. It is created from
// pseudo-elements before Studio JavaScript executes and again in the protected
// decompressed Studio shell. Verify both paths independently.
const first=html.match(/<style id="biglwa-first-paint">([\s\S]*?)<\/style>/)?.[1]||'';
const protectedCss=html.match(/const startupSafety='([\s\S]*?)';\s*html=html\.replace\('<\/head>'/)?.[1]||'';
assert.ok(first&&protectedCss,'Both startup stages have independent styles');
assert.ok(html.indexOf('<style id="biglwa-first-paint">')<html.indexOf('<body>'),'Dots render before Studio JS can start');
assert.match(first,/html::after\{content:"";position:fixed;/,'First-paint screen paints real dots from CSS');
assert.match(protectedCss,/html\.biglwa-startup-protected::after\{content:"";position:fixed;/,
  'Protected Studio screen paints dots before authentication finishes');
for(const [label,css] of [['first',first],['protected',protectedCss]]){
  assert.match(css,/biglwaOpeningRGB 1\.2s ease-in-out infinite/,label+' animation is active');
  assert.match(css,/#f36b79/,'Red dot');
  assert.match(css,/#f2cd39/,'Yellow dot');
  assert.match(css,/#58aa70/,'Green dot');
  assert.match(css,/@keyframes biglwaOpeningRGB/,label+' animates dots independently of JavaScript');
  assert.match(css,/font:400 clamp\(22px,4vw,40px\).*?"CS Bergamot Stitched"/,label+' uses stitched lettering');
}
assert.equal((first.match(/body::after\{content:"BIGLWA  ·  OPENING YOUR STUDIO"/g)||[]).length,1);
assert.equal((protectedCss.match(/body::after\{content:"BIGLWA  ·  OPENING YOUR STUDIO"/g)||[]).length,1);
console.log('PASS: Opening Your Studio first paint + protected startup both display RGB animated dots and stitched text.');
