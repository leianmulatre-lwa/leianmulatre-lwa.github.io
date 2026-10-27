import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
const m=readFileSync(new URL('./module-pages.js',import.meta.url),'utf8');
const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
assert.doesNotThrow(()=>new Script(m));
const palette=m.slice(m.indexOf('const shadowPalette=['),m.indexOf('function shadowKey(key){'));
for(const app of ['instagram','facebook','tiktok','pinterest','x','snapchat','tumblr','youtube',
 'spotify','soundcloud','drive','calendar','goodreads','letterboxd','imdb','vsco','bereal','substack','xbox'])
 assert.ok(palette.includes('"'+app+'"'),'Orbit shadow key includes '+app);
assert.ok(palette.includes('"drive","Google Drive","#e7be31"'),'Drive key stays golden');
assert.ok(m.includes('class="module-heading-right"'),'Keys share row with heading');
assert.ok(m.includes('aria-label="Platform shadow key: widget face and one source shadow"'));
assert.ok(m.includes('box-shadow:3px 3px 0 var(--key-shadow'),'Source key has one shadow');
assert.ok(!m.includes('Archive by app</h2>'),'Remove redundant Archive by app copy');
assert.ok(!m.includes('class="archive-color-guide" aria-label="Card shadow color key"'),'No duplicate lower Archive shadow key');
assert.ok(!m.includes('Link <span>(optional)</span>'),'Link optional line removed');
assert.ok(!m.includes('Caption <span>(optional'),'Caption optional line removed');
assert.ok(m.includes('id="feedComposerToggle"')&&m.includes('feedForm.hidden=!open'),'Plus/minus toggles existing form');
assert.ok(m.includes("feedToggle.setAttribute('aria-expanded',String(open))"),'Toggle state accessible');
assert.ok(html.includes('module-pages.js?v=20261026-archive-flat-gallery-7'),'Cache busted');
assert.ok(html.includes('#studioApp .orbit-grid button[data-orbit-app="drive"] .orbit-glyph::after')&&html.includes('#34a853 65%'),'Drive planet keeps multicolor emblem');
console.log('PASS header shadow key, Drive planet, compact Archive, plus/minus feed form');
