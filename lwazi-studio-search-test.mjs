import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';

const {JSDOM} = createRequire(import.meta.url)('jsdom');
const read = name => readFileSync(new URL(name,import.meta.url),'utf8');
const dom = new JSDOM('<main id="studioApp"><header class="topbar"><div class="search-wrap"><input id="globalSearch"></div></header><section class="hero">Studio widgets</section></main>', {
  runScripts:'outside-only', url:'https://biglwa.com/studio'
});
const {window} = dom;
const {document} = window;
const input = document.querySelector('#globalSearch');
const panel = () => document.querySelector('#lwaziStudioSearch');
const calls = [];
let finishPosts;
window.openBIGLWAModule = route => calls.push(['route',route]);
window.BigLWAUserDirectory = {
  searchUsers: async name => name==='sample'?[{username:name,name:'A Studio member'}]:[],
  searchPublishedPosts: () => new Promise(resolve=>{finishPosts=resolve})
};
window.fetch = async url => {
  calls.push(['external',url]);
  return {ok:true,json:async()=>url.includes('openlibrary')?
    {docs:[{key:'/works/OL12W',title:'A relevant book',author_name:['An author']}]}:{query:{search:[]}}};
};
window.eval(read('user-search-results.js'));

function enter(value){
  input.value = value;
  input.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));
}
const flush = () => new Promise(resolve=>setImmediate(resolve));

enter('archive');
assert.deepEqual(calls,[['route','archive']]);
assert.equal(panel(),null);
enter('How can I find a hairstyle?');
assert.equal(document.querySelector('.topbar').nextElementSibling,panel());
assert.equal(panel().nextElementSibling.className,'hero');
assert.equal(document.querySelector('[role=dialog]'),null);
panel().querySelector('[data-hair-texture=coily]').click();
assert.match(panel().textContent,/two-strand twists/);
assert.equal(panel().querySelector('[data-hair-texture=coily]').getAttribute('aria-pressed'),'true');
panel().dispatchEvent(new window.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
assert.equal(panel(),null);
assert.equal(document.activeElement,input);

enter('@sample');
await flush();
assert.match(panel().textContent,/A Studio member/);
assert.equal(calls.length,1,'No external calls for a username or sensitive guide');
enter('FAFSA');
finishPosts([{caption:'stale published result'}]);
await flush();
assert.match(panel().textContent,/StudentAid.gov/);
assert.doesNotMatch(panel().textContent,/stale published result/);

enter('sample');
await flush();
finishPosts([{caption:'published Studio content'}]);
await flush();
assert.match(panel().textContent,/published Studio content/);
assert.equal(calls.length,1,'Exact username matches stay on BIG LWA');

enter('queer cinema');
await flush();
assert.equal(calls.length,1,'Outside lookup requires a separate click');
panel().querySelector('.bl-search-discovery button').click();
await flush();
assert.match(panel().textContent,/A relevant book/);
assert.match(panel().textContent,/Songs on Bandcamp/);
assert.equal(calls.filter(([type])=>type==='external').length,2);

const entry = read('index.html');
assert.match(entry,/user-search-results\.js\?v=20261104-studio-search-2/);
assert.match(entry,/lwazi-studio-search\.css\?v=20261104-studio-search-2/);
assert.doesNotMatch(entry,/__biglwaSearchBound/);
await flush();
console.log('PASS: Studio search placement, routing, published results, stale response protection and outside-search opt-in');
