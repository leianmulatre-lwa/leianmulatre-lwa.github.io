// Archive responsive density and Veve-matched first Orbit shadow key.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
const code=readFileSync(new URL('./module-pages.js',import.meta.url),'utf8');
assert.doesNotThrow(()=>new Script(code));
const css=code.slice(code.indexOf('/* Boards-density Archive:'),code.indexOf('    .module-workspace[data-module-key="archive"] .instagram-archive-card{',code.indexOf('/* Boards-density Archive:')));
assert.match(css,/\.archive-app-compartment>\.instagram-archive-grid/);
assert.match(css,/repeat\(8,minmax\(0,1fr\)\)!important/,'Eight across on wide desktops');
assert.match(css,/gap:10px!important/,'Compact gutters');
assert.match(css,/@media\(max-width:1600px\)[^\n]*repeat\(7,minmax\(0,1fr\)\)!important/);
assert.match(css,/@media\(max-width:1360px\)[^\n]*repeat\(6,minmax\(0,1fr\)\)!important/);
assert.match(css,/@media\(max-width:1130px\)[^\n]*repeat\(5,minmax\(0,1fr\)\)!important/);
assert.match(css,/@media\(max-width:920px\)[^\n]*repeat\(4,minmax\(0,1fr\)\)!important/);
assert.match(css,/@media\(max-width:700px\)[^\n]*repeat\(3,minmax\(0,1fr\)\)!important/);
assert.match(css,/@media\(max-width:465px\)[^\n]*repeat\(2,minmax\(0,1fr\)\)!important/);
assert.ok(code.includes('const visualPieces=pieces.length?archivePieceMarkup(pieces[0]'),'Carousel remains one interactive Archive post');
assert.ok(code.includes('data-archive-live-input='),'Existing Live toggle stays');
const o=code.slice(code.indexOf('function orbitShadowLegend(){'),code.indexOf('function renderOrbitPage(){'));
const v=code.slice(code.indexOf('function renderVeve(){'),code.indexOf('function renderCreate(){'));
assert.ok(code.includes("heading('orbit')+orbitShadowLegend()+"),'Orbit renders the shadow legend above its tiles');
assert.ok(code.includes('.orbit-shadow-legend{')&&code.includes('.orbit-shadow-key-item>i{'));
for(const [label,color] of [['Instagram','#f36b21'],['TikTok','#772dcc'],['Pinterest','#e60023'],
 ['Facebook','#1658be'],['YouTube','#fff1ec'],['Snapchat','#ffda00'],
 ['Tumblr','#1b304b'],['X','#0e0e0e']]){
 assert.ok(o.includes("['"+label+"','"+color+"']"),'Orbit palette '+label);
 assert.ok(v.includes("['"+label+"','"+color+"']"),'Veve palette '+label);
}
assert.ok(o.includes('aria-label="App shadow color key"'));
console.log('PASS dense Archive cards and compact Veve-style Orbit shadow key');
