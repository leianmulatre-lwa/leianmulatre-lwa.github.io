// Visual regression guard: Orbit platform badges belong bottom-right, never
// beside company names or connection-state pills, in Studio AND Archive popup.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const load=name=>readFileSync(new URL('./'+name,import.meta.url),'utf8');
const pages=load('module-pages.js');
const html=load('index.html');
assert.doesNotThrow(()=>new vm.Script(pages),'module-pages remains parseable');
assert.ok(html.includes('module-pages.js?v=20261015-politc-paper-tracker-10'),
 'site loads fresh layout rather than cached Orbit badge CSS');

const badges=['instagram','facebook','tiktok','pinterest','soundcloud','youtube',
 'drive','calendar','goodreads','letterboxd','imdb'];
for(const service of badges)
 assert.ok(pages.includes("['"+service+"',"),service+' has the original platform color');
assert.ok(pages.includes('<span class="orbit-platform-badge" aria-hidden="true"'));
assert.ok(pages.includes('.module-orbit-row>.orbit-platform-badge'));
assert.ok(pages.includes('position:absolute;right:11px;bottom:10px;top:auto;left:auto'));
assert.ok(pages.includes('padding:11px 11px 44px'),'badge has reserved room below actions');
assert.ok(pages.includes('pointer-events:none'),'badge cannot cover clickable controls');
assert.ok(pages.includes('.module-orbit-row header>.orbit-state{margin-left:auto}'));
assert.ok(pages.includes('.module-orbit{display:grid;grid-template-columns:repeat(2'));
assert.ok(pages.includes('@media(max-width:850px)'),'Orbit still stacks on smaller screens');

const main =pages.slice(pages.indexOf('function renderOrbitPage(){'),pages.indexOf('function renderConnect(){'));
assert.ok(main.includes('data-orbit-row="\${k}"><header><b>\${n}</b>\${row?'), 'OAuth name followed by status, not badge');
assert.ok(main.includes('</header>\${orbitBadge(g,t)}'), 'OAuth badge is a direct child after header');
assert.ok(main.includes('<header><b>\${n}</b></header>\${orbitBadge(g,t)}<label'), 'plain-link badge stays after header');
assert.ok(!main.includes('<b>\${n}</b>\${orbitBadge(g,t)}'), 'no remaining badge beside source name');
const popup = pages.slice(pages.indexOf('function openConnectionsPopup(){'),pages.indexOf('const root=document.createElement',pages.indexOf('function openConnectionsPopup(){')));
assert.ok(popup.includes("+'</header>'+orbitBadge(g,t)+"),'popup OAuth badge outside header');
assert.ok(popup.includes("+'</header>'+orbitBadge(g,t)+'<p"),'popup link badge outside header');
assert.ok(!popup.includes("+'</b>'+orbitBadge(g,t)"),'popup company label free of badge');
console.log('PASS 11 source colors, bottom-right reserved badge positions in Orbit and Archive manager');
console.log('PASS connection state stays top-right and mobile columns still stack');
