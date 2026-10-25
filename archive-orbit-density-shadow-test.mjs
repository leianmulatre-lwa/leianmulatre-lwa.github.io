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
const key=code.slice(code.indexOf('const shadowPalette=['),code.indexOf('const heading = (key, extra='));
assert.ok(code.includes('class="module-heading-right"'),'Shadow key is alongside title');
assert.ok(code.includes("heading('orbit')+"),'Orbit renders shared heading with key');
assert.ok(code.includes('.module-shadow-key-item>i{'),'One swatch style with Archive-style depth');
assert.ok(code.includes('box-shadow:2px 2px 0 var(--key-color'),'Layered Archive-style shadow swatch');
for(const [name,color] of [['Instagram','#f36b21'],['TikTok','#772dcc'],['Pinterest','#e60023'],
 ['Facebook','#1658be'],['YouTube','#fff1ec'],['Snapchat','#ffda00'],
 ['Tumblr','#1b304b'],['X','#0e0e0e'],['Google Drive','#e7be31'],
 ['Spotify','#1db954'],['SoundCloud','#ff7700'],['Letterboxd','#2c3440']]){
 assert.ok(key.includes('"'+name+'","'+color+'"'),'Shared palette '+name);
}
assert.ok(code.includes('aria-label="Platform shadow color key"'));
assert.ok(code.includes("key==='orbit'?shadowPalette.filter"),'Orbit lists all real provider destinations');
assert.ok(code.includes('id="feedComposerToggle"')&&code.includes('feedForm.hidden=!open'),'Feed collapsible form retains fields');
assert.ok(!code.includes('Archive by app</h2>'),'Archive redundant heading removed');
assert.ok(!code.includes('class="archive-color-guide" aria-label="Card shadow color key"'),'Archive no longer shows a second key');
console.log('PASS dense Archive cards and shared heading shadow keys');
