// The Studio Games graphic must stay a transparent overlay, never a dead screenshot.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const css=readFileSync(new URL('./arcade-cabinet-approved-20261025.css',import.meta.url),'utf8');
const index=readFileSync(new URL('./index.html',import.meta.url),'utf8');
const match=css.match(/data:image\/png;base64,([A-Za-z0-9+/=]+)/);
assert.ok(match,'Approved cabinet image is embedded in Games stylesheet');
const png=Buffer.from(match[1],'base64');
assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a','Image is a PNG');
assert.equal(png.readUInt32BE(16),250,'Optimized cabinet width');
assert.equal(png.readUInt32BE(20),298,'Optimized cabinet height');
let pos=8,chunks={};
while(pos+12<=png.length){
  const n=png.readUInt32BE(pos),id=png.toString('ascii',pos+4,pos+8);
  assert.ok(pos+12+n<=png.length,'PNG chunk remains in file');
  chunks[id]=png.subarray(pos+8,pos+8+n);
  pos+=12+n;
  if(id==='IEND')break;
}
assert.ok(chunks.tRNS?.includes(0),'PNG has transparent pixels for playable screen');
assert.ok(chunks.IDAT&&chunks.IEND,'PNG has complete image data');
assert.match(css,/\.games-library\.games-library::before\s*\{[^}]*pointer-events:none!important/s,
 'Cabinet artwork does not steal clicks');
assert.match(css,/\.arcade-library-viewport\.arcade-library-viewport\s*\{[^}]*position:absolute!important/s,
 'Live games are aligned in transparent opening');
assert.match(css,/\.arcade-game-tile\{pointer-events:auto!important\}/,
 'Game tiles remain interactive');
assert.ok(index.includes('arcade-cabinet-approved-20261025.css?v=1'),'Studio loads approved asset');
assert.ok(index.indexOf('arcade-cabinet-approved-20261025.css')>index.indexOf('arcade-curtain-folder-20261025.css'),
 'New cabinet overrides legacy decorative layers');
console.log('PASS approved arcade frame PNG, alpha opening, responsive live game click layer');
