/* Browser-level yellow-dot behavior, isolated from the rest of the Studio.
   Do not replace content or suppress the old red/green handlers. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const {JSDOM}=createRequire(import.meta.url)('jsdom');
const read=p=>readFileSync(new URL('./'+p,import.meta.url),'utf8');
const html=`<!doctype html><main id="studioApp"><section class="masonry">
<article class="card" id="archive" data-widget-id="archive" data-widget-label="archive">
  <div class="widget-window-controls">
    <button class="window-light green" data-open="archive">Green</button>
    <button class="window-light yellow" data-minimize-widget="archive">Yellow</button>
    <button class="window-light red" data-dock-widget="archive">Red</button>
  </div>
  <button class="widget-drag-handle" data-studio-drag-handle>Drag</button>
  <div class="biglwa-card-heading-row"><span class="card-icon">▥</span><h2>archive</h2></div>
  <p class="card-description">Keep memories, media, references close.</p>
  <img class="archive-preview" src="/archive.png" alt="Archive preview">
  <button class="open-archive">Open Archive</button>
</article></section></main>`;
const dom=new JSDOM(html,{url:'https://biglwa.com/studio',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window, doc=w.document;
w.__biglwaIdentity={uid:'owner-one'};
let saved={collapsed:[],order:{masonry:['archive']},docked:[]};
let saveCount=0,legacyYellow=0,legacyRed=0,green=0;
w.BigLWAStudioLayout={
 snapshot:()=>saved,
 save:()=>{saveCount++; saved={...saved,collapsed:[...doc.querySelectorAll('.studio-header-only[data-widget-id]')].map(x=>x.dataset.widgetId)}}
};
doc.addEventListener('click',e=>{
 if(e.target.matches('[data-minimize-widget]')){legacyYellow++;doc.querySelector('#archive').classList.add('widget-is-minimized')}
 if(e.target.matches('[data-dock-widget]'))legacyRed++;
 if(e.target.matches('[data-open="archive"]'))green++;
},true);
const style=doc.createElement('style');style.textContent=read('studio-yellow-collapse-20261026.css');doc.head.appendChild(style);
w.eval(read('studio-yellow-collapse-20261026.js'));
doc.dispatchEvent(new w.Event('DOMContentLoaded'));
const card=doc.querySelector('#archive'),yellow=card.querySelector('[data-minimize-widget]');
yellow.click();
assert(card.classList.contains('studio-header-only'),'Yellow collapses widget in place');
assert(!card.classList.contains('widget-is-minimized'),'Yellow does NOT hide or dock widget');
assert.equal(legacyYellow,0,'Legacy minimize handler is intercepted');
assert.equal(card.parentElement.className,'masonry','Card stays in its masonry position');
assert.equal(card.querySelector('h2').textContent,'archive','Title unchanged');
assert(card.querySelector('.card-icon'),'Symbol unchanged');
assert(card.querySelector('[data-studio-drag-handle]'),'Drag handle unchanged');
assert.equal(card.querySelectorAll('.window-light').length,3,'All three dots stay');
assert(card.querySelector('.archive-preview'),'Image content preserved in DOM');
assert.equal(saved.collapsed[0],'archive','State saved to account-scoped layout');
assert.equal(yellow.getAttribute('aria-expanded'),'false','Screenreader learns that the card is collapsed');
yellow.click();
assert(!card.classList.contains('studio-header-only'),'Yellow restores widget in place');
assert.equal(saved.collapsed.length,0,'Restore is saved');
assert.equal(yellow.getAttribute('aria-expanded'),'true');
card.querySelector('[data-open="archive"]').click();
assert.equal(green,1,'Green keeps its original action');
yellow.click();
card.querySelector('[data-dock-widget="archive"]').click();
assert.equal(legacyRed,1,'Red keeps its original action');
assert(!card.classList.contains('studio-header-only'),'Red clears the local header-only state');
assert.equal(saveCount,3,'Explicit yellow click writes; startup does not');
assert.equal(legacyYellow,0);
assert(read('ui-coherence.js').includes("collapsed:[...app.querySelectorAll('[data-widget-id].studio-header-only')]"),'Canonical account snapshot saves collapsed IDs');
assert(read('ui-coherence.js').includes("window.dispatchEvent(new Event('biglwa:studio-collapse-applied'))"),'Remote customizations reapply collapsed state');
assert(read('index.html').includes('studio-yellow-collapse-20261026.js?v=20261029-universal-1'),'Script included in actual Studio');
assert(read('index.html').includes('studio-yellow-collapse-20261026.css?v=20261026-1'),'Styles included in actual Studio');

/* Verify the two NEW cabinet widgets specifically. Their live content is
   preserved in place while yellow hides the large decorative machine. */
const masonry=doc.querySelector('.masonry');
for(const [id,title,bodyClass] of [
  ['games','games','games-library'],
  ['tools','lwazi','lwazi-cabinet-thumb']
]){
  const widget=doc.createElement('article');
  widget.className='card';widget.id=id;widget.dataset.widgetId=id;widget.dataset.widgetLabel=title;
  widget.innerHTML='<div class="widget-window-controls"><button class="window-light green" data-open="'+id+'">Green</button><button class="window-light yellow" data-minimize-widget="'+id+'">Yellow</button><button class="window-light red" data-dock-widget="'+id+'">Red</button></div>'+
    '<button class="widget-drag-handle" data-studio-drag-handle>Drag</button>'+
    '<div class="biglwa-card-heading-row"><span class="card-icon">♟</span><h2>'+title+'</h2></div>'+
    '<div class="'+bodyClass+'"><div class="arcade-library-viewport"><div class="arcade-track"><button class="arcade-game-tile">Game or app</button></div></div></div>';
  masonry.appendChild(widget);
  const yellowDot=widget.querySelector('.window-light.yellow'),carousel=widget.querySelector('.arcade-library-viewport');
  yellowDot.click();
  assert(widget.classList.contains('studio-header-only'),id+' yellow collapses within its card');
  assert(!widget.classList.contains('widget-is-minimized'),id+' yellow must not dock');
  assert.equal(widget.parentElement,masonry,id+' keeps its position');
  assert.equal(widget.querySelector('.widget-drag-handle').tagName,'BUTTON',id+' drag handle stays');
  assert.equal(widget.querySelectorAll('.window-light').length,3,id+' window dots stay');
  assert.equal(widget.querySelector('h2').textContent,title,id+' name stays');
  assert.strictEqual(widget.querySelector('.arcade-library-viewport'),carousel,id+' carousel is never destroyed');
  yellowDot.click();
  assert(!widget.classList.contains('studio-header-only'),id+' yellow restores');
  assert.strictEqual(widget.querySelector('.arcade-library-viewport'),carousel,id+' carousel restored without remount');
}
const cabinets=read('studio-cabinet-thumbnails-20261026.css');
assert(cabinets.includes('#studioApp #games.studio-header-only .games-library'),'Games CSS hides full machine during yellow collapse');
assert(cabinets.includes('#studioApp #tools.studio-header-only .lwazi-cabinet-thumb'),'Lwazi CSS hides keyboard during yellow collapse');
assert(cabinets.includes('studio-games-cabinet-open-20261026.png'),'Games uses real transparent HD cabinet');
assert(cabinets.includes('studio-lwazi-cabinet-open-20261026.png'),'Lwazi uses real transparent HD cabinet');
const lwaziSource=read('studio-lwazi-thumbnail-20261026.js');
assert(lwaziSource.includes('data.lwaziCarouselVersion')||lwaziSource.includes('dataset.lwaziCarouselVersion'),'Lwazi independent carousel version');
assert(lwaziSource.includes('aria-hidden'),'Repeated carousel tiles do not double-count for screenreaders');
assert(lwaziSource.includes("window.openBIGLWAModule"),'Workshop keeps its existing app router');
// Flush one animation frame: the Studio MutationObserver schedules header sync
// after the test inserts the Games and Lwazi fixtures.
// A widget that lacks recognizable heading markup must STILL collapse in place.
const headerless=doc.createElement('article');
headerless.className='card';headerless.id='headerless';headerless.dataset.widgetId='headerless';
headerless.dataset.widgetLabel='headless demo';
headerless.innerHTML='<div class="widget-window-controls"><button class="window-light yellow" data-minimize-widget="headerless">Yellow</button></div><section class="unexpected-body">Loaded content</section>';
masonry.append(headerless);
headerless.querySelector('.window-light.yellow').click();
assert(headerless.classList.contains('studio-header-only'),'Missing headings use a safe fallback and stay put');
assert(!headerless.classList.contains('widget-is-minimized'),'Missing headings never fall through to red dock');
assert(headerless.querySelector('.studio-collapse-fallback'),'A compact accessible header is created without removing content');
assert.equal(headerless.parentElement,masonry);
assert(read('index.html').includes('studio-spatial-drag-20261029.js?v=20261029-pinterest-masonry-2'),'Free-position drag handler loads on Studio');

await new Promise(resolve=>setTimeout(resolve,120));
dom.window.close();
console.log('PASS: yellow header-only toggle and account save; green/red/drag/image unaffected');
