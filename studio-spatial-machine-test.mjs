import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const {JSDOM}=createRequire(import.meta.url)('jsdom');
const read=file=>readFileSync(new URL('./'+file,import.meta.url),'utf8');
const markup='<!doctype html><html><body><main id="studioApp"><div class="masonry" id="biglwaStudioMasonry"><article class="card" data-widget-id="one" data-widget-label="One"><button data-studio-drag-handle>Move One</button><h2>One</h2></article><article class="card" data-widget-id="two" data-widget-label="Two"><button data-studio-drag-handle>Move Two</button><h2>Two</h2></article></div><span id="biglwaStudioOrderStatus"></span></main></body></html>';
const dom=new JSDOM(markup,{url:'https://biglwa.com/studio',runScripts:'outside-only'});
const w=dom.window,d=w.document,masonry=d.querySelector('.masonry');
w.matchMedia=()=>({matches:false});
w.__biglwaIdentity={uid:'owner-1'};
let saves=0;
w.BigLWAStudioLayout={save:()=>{saves++}};
const rect=(x,y,width=200,height=140)=>({left:x,top:y,right:x+width,bottom:y+height,width,height});
masonry.getBoundingClientRect=()=>rect(10,10,840,760);
const one=d.querySelector('[data-widget-id=one]'),two=d.querySelector('[data-widget-id=two]');
one.getBoundingClientRect=()=>rect(15,20);
two.getBoundingClientRect=()=>rect(225,20);
w.eval(read('studio-spatial-drag-20261029.js'));
const handle=one.querySelector('button');
const emit=(type,x,y,target=handle)=>target.dispatchEvent(new w.MouseEvent(type,{bubbles:true,button:0,clientX:x,clientY:y}));
emit('pointerdown',26,30);
emit('pointermove',850,560);
emit('pointerup',850,560);
assert(saves>0,'Dropping into an empty area persists the layout');
assert(one.dataset.biglwaGridPosition,'Dragged widget gets a stable spatial slot');
assert(masonry.classList.contains('biglwa-free-layout'),'Free-grid layout activates after first spatial drag');
assert(!d.querySelector('.biglwa-spatial-ghost'),'Temporary ghost is cleaned up');
assert(!d.querySelector('.biglwa-spatial-tail'),'Trailing drop zone is cleaned up');
assert.equal([...masonry.querySelectorAll('[data-widget-id]')].length,2,'Both widgets remain mounted');

/* Regression: a collapsed Map must not leave the next card stranded below
   a tall Archive card in another column (Pinterest-style independent stacks). */
const map=d.createElement('article'),feed=d.createElement('article');
map.className='card';map.dataset.widgetId='map';map.dataset.biglwaGridPosition='1:3';
map.innerHTML='<button data-studio-drag-handle>Drag map</button><button class="window-light yellow">Minimize map</button><p>Map content</p>';
feed.className='card';feed.dataset.widgetId='myfeed';feed.dataset.biglwaGridPosition='2:3';
feed.innerHTML='<h2>MyFeed</h2><p>Feed content preserved</p>';
map.getBoundingClientRect=()=>rect(435,20,200,map.classList.contains('studio-header-only')?56:296);
feed.getBoundingClientRect=()=>rect(435,338,200,126);
masonry.append(map,feed);
await new Promise(resolve=>setTimeout(resolve,65));
const feedBefore=parseFloat(feed.style.top);
assert(feedBefore>=296+14,'Tall Map initially pushes only its own column down, without overlapping');
map.classList.add('studio-header-only');
await new Promise(resolve=>setTimeout(resolve,65));
const feedAfter=parseFloat(feed.style.top);
assert(feedAfter>=56+14&&feedAfter<feedBefore,'Minimizing Map pulls MyFeed up in its own column without any overlap');
assert.equal(map.dataset.biglwaGridPosition,'1:3','Map keeps its saved spatial position');
assert.equal(feed.dataset.biglwaGridPosition,'2:3','Following widget keeps its slot and content');
assert.equal(feed.parentElement,masonry,'No remount or reparenting breaks widget integrations');
assert(feed.querySelector('h2')?.textContent==='MyFeed');
map.classList.remove('studio-header-only');
await new Promise(resolve=>setTimeout(resolve,65));
assert(parseFloat(feed.style.top)>=296+14&&parseFloat(feed.style.top)>feedAfter,'Restoring Map re-expands only the affected column');

// Red-docking removes a card entirely from the visible column. Restore it
// without changing its saved spatial slot or leaving an empty reserved row.
map.classList.add('widget-is-minimized');
await new Promise(resolve=>setTimeout(resolve,65));
assert.equal(parseFloat(feed.style.top),0,'Red-docked Map occupies no visual space');
map.classList.remove('widget-is-minimized');
await new Promise(resolve=>setTimeout(resolve,65));
assert(parseFloat(feed.style.top)>=296+14,'Restored Map re-enters its column at full height');
assert.equal(map.dataset.biglwaGridPosition,'1:3','Red-docking preserves Map placement');


/* A drop must not reparent the mounted card (which restarts iframes/media).
   Drag preview and drop outline must represent the FULL original height. */
let movedNodes=0;
const origAppend=masonry.appendChild.bind(masonry);
masonry.appendChild=child=>{movedNodes++;return origAppend(child)};
const handleMap=map.querySelector('[data-studio-drag-handle]');
const event=(kind,x,y,target=handleMap)=>target.dispatchEvent(new w.MouseEvent(kind,{bubbles:true,button:0,clientX:x,clientY:y}));
event('pointerdown',443,31);
const ghost=d.querySelector('.biglwa-spatial-ghost'),target=d.querySelector('.biglwa-spatial-target');
assert(ghost,'Dragging produces a real-sized card preview');
assert.equal(ghost.style.height,'296px','Preview shows the FULL widget, never a 70px miniature');
assert.equal(target.style.height,'296px','Drop target reserves actual full widget height');
event('pointermove',700,580);
event('pointerup',700,580);
assert.equal(movedNodes,0,'No widget DOM nodes were reparented or remounted by dragging');
assert.equal(map.parentElement,masonry);
assert.equal(map.querySelector('p')?.textContent,'Map content');
assert(Number.isFinite(parseFloat(masonry.style.height)),'Parent reserves height of the tallest full content column');
assert(!d.querySelector('.biglwa-spatial-ghost'),'Full-sized drag ghost is cleaned up');

// Skeleton Key is not a movable widget, but still occupies the first column.
const guide=d.createElement('article');guide.className='card manifesto-card is-skeleton-open';
guide.getBoundingClientRect=()=>rect(10,10,200,420);masonry.prepend(guide);
two.dataset.biglwaGridPosition='1:1';
await new Promise(resolve=>setTimeout(resolve,65));
assert(parseFloat(two.style.top)>=434,'Skeleton Key reserves its full height before the first widget');
assert.equal(two.dataset.biglwaGridPosition,'1:1','Opening the key never changes saved slots');
guide.classList.remove('is-skeleton-open');guide.style.display='none';
await new Promise(resolve=>setTimeout(resolve,65));
assert.equal(parseFloat(two.style.top),0,'Closing the key reclaims the reserved space');
const css=read('studio-spatial-drag-20261029.css');
assert(css.includes('position:absolute!important'),'Full-size cards are positioned independently of shared grid rows');
assert(css.includes('display:block!important'),'Rigid grid-row sizing is disabled');
assert(!css.includes('grid-auto-rows:4px!important'),'Old overlapping four-pixel track loop is removed');

assert.match(read('ui-coherence.js'),/positions:Object\.fromEntries/,'Canonical account layout persists grid slots');
assert.match(read('ui-coherence.js'),/const positions=layout\.positions/,'Cloud account rehydrate restores slots');
assert.match(read('ui-coherence.js'),/parent\.classList\.contains\('masonry'\).*data-biglwa-grid-position/,'Saved masonry slots prevent account hydration from remounting widgets');
const index=read('index.html');
assert(index.includes('studio-spatial-drag-20261029.js?v=20261029-route-inset-4'));
assert(index.includes('studio-machine-pages-20261029.css?v=20261029-1'));
assert(!read('tools-craft.js').includes('<h2>your werkshopeR</h2>'),'Old Lwazi hero is removed');
assert(read('tools-craft.js').includes('class="craft-folder-front"'),'Lwazi folder face replaces it');
assert(read('studio-machine-pages-20261029.css').includes('module-arcade-folder-depth'),'Games cabinet is re-skinned');
dom.window.close();
console.log('PASS new Studio spatial drag into empty row, clean lifecycle, saved cloud layout, shared Lwazi/Games machine skin');
