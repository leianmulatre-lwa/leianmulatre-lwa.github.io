// Orbit regression checks: 8 selected Studio planets, dynamic refill after OAuth,
// personal Facebook by default, and unchanged 3D planets/full planetary directory.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=name=>readFileSync(new URL('./'+name,import.meta.url),'utf8');
const pages=read('module-pages.js');
const html=read('index.html');
const bootstrap=read('bootstrap-v2.html');
const widget=read('orbit-preview-eight-20261016.js');
const widgetCss=read('orbit-preview-eight-20261016.css');
const fullCss=read('orbit-cards-unified-20261016.css');
const planets=read('orbit-planets-20261015.css');
const legacy=read('facebook-orbit.js');
assert.doesNotThrow(()=>new vm.Script(pages),'Full Orbit JS parses');
assert.doesNotThrow(()=>new vm.Script(widget),'Studio Orbit JS parses');
assert.match(html,/bootstrap-v2\.html\?v=20261016-eight-planets-source-/,
  'Studio loads refreshed source rather than older static tiles');
assert.match(html,/orbit-preview-eight-20261016\.js\?v=/,
  'eight-planet preview behavior is loaded');
assert.match(html,/orbit-preview-eight-20261016\.css\?v=/,
  'eight-planet preview sizing and color is loaded');
const start=bootstrap.indexOf('<div class=\\"orbit-grid\\" id=\\"orbitGrid\\">');
assert.ok(start>=0,'Original Studio shell has a planet grid');
const end=bootstrap.indexOf('          </div>\\n          <p class=\\"orbit-note\\">',start);
assert.ok(end>start,'Original Studio planet grid has a known endpoint');
const ids=[...bootstrap.slice(start,end).matchAll(/data-orbit-app=\\"([^"\\]+)\\"/g)].map(match=>match[1]);
assert.deepEqual(ids,[
  'instagram','youtube','tumblr','pinterest','tiktok','snapchat','calendar','x'
],'Eight tiles are authored directly in the source in the requested order');
assert.ok(!ids.includes('facebook')&&!ids.includes('soundcloud')&&!ids.includes('drive'),
  'No old or inserted tiles replace the default eight');
assert.match(widget,/const MORE=\[/,'Connected planets have a refill queue');
assert.match(widget,/function rotated\(\)/,'Slots rotate after a successful connection');
assert.match(widget,/sessionStorage\.setItem\(storageKey\(currentOwner\)/,
  'Featured choices are scoped to the signed-in user session');
assert.match(widget,/case 'facebook':return window\.BigLWAFacebookPersonal\?\.connect/,
  'The Facebook suggestion connects through the personal OAuth app');
assert.ok(!legacy.includes("target.closest('[data-orbit-app=\"facebook\"],"),
  'Original Meta Business login cannot intercept a Studio Facebook tile');
assert.match(widgetCss,/#f1a4b0/,'YouTube has salmon-pink shadow');
assert.match(widgetCss,/grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/,
  'Studio tiles use four across on desktop');
assert.ok(planets.includes('--planet:radial-gradient(')&&
  planets.includes('button[data-orbit-app="youtube"]'),
  'Existing textured planet artwork remains');
assert.ok(pages.includes('...ORBIT_APPS,...PLANETARY_APPS') &&
  fullCss.includes('grid-template-columns:repeat(4,minmax(0,1fr))'),
  'Full Orbit still shows all platforms in uniform planetary cards');
assert.ok(pages.includes('data-facebook-legacy-connect') &&
  pages.includes('window.BigLWAFacebookPersonal'),
  'Both Meta Business and new personal Facebook routes remain available');
assert.match(fullCss,/position:absolute!important/,'Full Orbit badges remain anchored');
console.log('PASS eight default planets, personal Facebook, rotating suggestions, salmon YouTube, original 3D art');
