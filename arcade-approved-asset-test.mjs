// The Studio Games graphic must stay a transparent overlay, never a dead screenshot.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const css=readFileSync(new URL('./arcade-cabinet-approved-20261025.css',import.meta.url),'utf8');
const index=readFileSync(new URL('./index.html',import.meta.url),'utf8');
const png=readFileSync(new URL('./assets/arcade/approved-cabinet-full.png',import.meta.url));
assert.ok(css.includes('/assets/arcade/approved-cabinet-full.png?v=20261026'));
assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
assert.equal(png.readUInt32BE(16),1149);
assert.equal(png.readUInt32BE(20),1368);
assert.ok(css.includes('z-index:4!important;overflow:hidden'),'Live games render above the artwork screen');
assert.match(css,/\.games-library\.games-library::before\s*\{[^}]*pointer-events:none!important/s,
 'Cabinet artwork does not steal clicks');
assert.match(css,/\.arcade-library-viewport\.arcade-library-viewport\s*\{[^}]*position:absolute!important/s,
 'Live games are aligned in transparent opening');
assert.match(css,/\.arcade-game-tile\{pointer-events:auto!important\}/,
 'Game tiles remain interactive');
assert.ok(index.includes('arcade-cabinet-approved-20261025.css?v=4'),'Studio loads approved asset');
assert.ok(index.indexOf('arcade-cabinet-approved-20261025.css')>index.indexOf('arcade-curtain-folder-20261025.css'),
 'New cabinet overrides legacy decorative layers');
console.log('PASS full approved arcade PNG, responsive live game click layer');
