/* Non-destructive Studio cabinet regression checks.
 * Carousels are LIVE children of decorative PNG borders, never baked thumbnails.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('./'+p,import.meta.url));
const css=read('studio-cabinet-thumbnails-20261026.css').toString();
const js=read('studio-lwazi-thumbnail-20261026.js').toString();
const index=read('index.html').toString();
for(const [label,p] of [
 ['Games','assets/arcade/studio-games-cabinet-20261026.png'],
 ['Lwazi','assets/arcade/studio-lwazi-cabinet-20261026.png']
]){
 const img=read(p);
 assert.equal(img.subarray(0,8).toString('hex'),'89504e470d0a1a0a',label+' PNG signature');
 assert.equal(img[25],6,label+' should be an RGBA PNG with transparency');
 assert.ok(img.readUInt32BE(16)>=300,label+' PNG dimensions');
 assert.ok(img.readUInt32BE(20)>=350,label+' PNG dimensions');
}
assert.ok(css.includes('studio-games-cabinet-20261026.png'));
assert.ok(css.includes('studio-lwazi-cabinet-20261026.png'));
assert.ok(css.includes('#studioApp #games .arcade-library-viewport>.arcade-track'),'Games keeps existing carousel tracks');
assert.ok(css.includes('animation-play-state:paused'),'Carousel pause on hover/focus');
assert.ok(!css.includes('display:none!important;animation:none'),'No carousel hidden');
assert.ok(js.includes("className='arcade-library-viewport'"));
assert.ok(js.includes("track.className='arcade-track'"));
assert.ok(js.includes("className='arcade-game-tile lwazi-block-tile'"));
for(const name of ['sqwibblR','visualizr','lightR','paintR','keyframeR','fileR'])
 assert.ok(js.includes(name),name+' Workshop app block exists in carousel');
assert.ok(js.includes("window.openBIGLWAModule"),'Reuse the existing real module router');
assert.ok(js.includes("data-craft-open"),'Use original editor launchers');
assert.ok(index.includes('studio-cabinet-thumbnails-20261026.css?v=20261026-carousel-preserved-2'));
assert.ok(index.includes('studio-lwazi-thumbnail-20261026.js?v=20261026-block-carousel-2'));
console.log('PASS: RGBA PNG cabinet borders and both intact Studio carousels');
