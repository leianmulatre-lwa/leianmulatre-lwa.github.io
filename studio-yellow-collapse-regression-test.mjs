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
 save:()=>{saveCount++; saved={...saved,
  collapsed:[...doc.querySelectorAll('.studio-header-only[data-widget-id]')].map(x=>x.dataset.widgetId),
  upperVariants:Object.fromEntries(['music','aura','avatar','guest-check'].map(id=>{
   const widget=id==='avatar'?doc.querySelector('#studioAvatarCard'):doc.querySelector(
    '.music-card[data-widget-id="'+id+'"],.aura-card[data-widget-id="'+id+'"],.guest-check-card[data-widget-id="'+id+'"]');
   return [id,widget?.dataset.upperWidgetView|| (id==='music'?'long':'square')];
  }))
 }}
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
assert(read('index.html').includes('studio-yellow-collapse-20261026.js?v=20261103-preserve-squares-3'),'Script included in actual Studio');
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
assert(read('index.html').includes('studio-spatial-drag-20261029.js?v=20261029-route-inset-4'),'Free-position drag handler loads on Studio');


// Upper row is six logical square slots, not four independently growing cards.
// Music starts LONG (two slots); Aura, Avatar and Check start SQUARE (one each).
const hero=doc.createElement('section');hero.className='hero';
const rail=doc.createElement('div');rail.className='hero-widget-rail';rail.id='heroWidgetRail';
const pair=doc.createElement('div');pair.id='biglwaAuraAvatarPair';pair.className='biglwa-aura-avatar-pair';
const actionBar=doc.createElement('nav');actionBar.className='hero-action-bar';
hero.append(rail,actionBar);doc.querySelector('#studioApp').append(hero);
const music=doc.createElement('section');music.className='customizable-widget music-card stereo-music-widget';
music.dataset.widgetId='music';music.dataset.widgetLabel='Now Playing';
music.innerHTML='<div class="widget-window-controls"><button class="window-light yellow" data-minimize-widget="music">Yellow</button><button class="window-light red" data-dock-widget="music">Red</button></div>'+
 '<h2 class="card-kicker">NOW PLAYING</h2><div class="stereo-shell"><div class="stereo-tuner"></div>'+
 '<div class="stereo-face"><div class="stereo-speaker"></div><div class="stereo-display"><strong id="studioMusicTitle">Almeda</strong><span id="studioMusicArtist">Solange</span></div></div>'+
 '<div class="stereo-control-deck"><button id="playBtn">Play</button></div></div>';
rail.append(music);
const aura=doc.createElement('section');aura.className='customizable-widget aura-card';
aura.dataset.widgetId='aura';aura.dataset.widgetLabel='Aura';
aura.innerHTML='<div class="widget-window-controls"><button class="window-light yellow" data-minimize-widget="aura">Yellow</button></div>'+
 '<h2 class="card-kicker">Aura</h2><div class="aura-orb">Focused</div>';
const avatar=doc.createElement('section');avatar.id='studioAvatarCard';avatar.dataset.widgetId='avatar';avatar.dataset.widgetLabel='Avatar';
avatar.innerHTML='<div class="biglwa-avatar-head"><h2 class="card-kicker">Avatar</h2>'+
 '<div class="widget-window-controls avatar-window-controls"><button class="window-light yellow" data-avatar-widget-action="minimize">Yellow</button><button class="window-light red" data-avatar-widget-action="remove">Red</button></div></div>'+
 '<div class="biglwa-avatar-media">360sona preview</div>';
pair.append(aura,avatar);rail.append(pair);
const guest=doc.createElement('section');guest.className='customizable-widget guest-check-card';
guest.dataset.widgetId='guest-check';guest.dataset.widgetLabel='Guest Check';
guest.innerHTML='<h2 class="card-kicker">Guest Check</h2>'+
 '<div class="widget-window-controls"><button class="window-light yellow" data-minimize-widget="guest-check">Yellow</button></div>'+
 '<div class="guest-check-sheet"><div class="guest-check-lines">Guest entries</div></div>';
rail.append(guest);
const miniDock=doc.createElement('section');miniDock.id='studioSidebarPrimary';
miniDock.innerHTML='<div id="minimizedWidgetDock"><div data-upper-compact-row="aura">Stale yellow row</div></div>';
doc.querySelector('#studioApp').append(miniDock);
w.dispatchEvent(new w.Event('biglwa:studio-collapse-applied'));
await new Promise(resolve=>setTimeout(resolve,90));
rail.getBoundingClientRect=()=>({width:1200});
w.BigLWAUpperWidgets.refresh();
assert.equal(rail.style.getPropertyValue('--studio-upper-tracks'),'471.5999999999999px 471.6px 228.8px','Original square footprint and full rail retained');
const status=()=>w.BigLWAUpperWidgets.status();
const shell=music.querySelector('.stereo-shell'),musicYellow=music.querySelector('[data-minimize-widget]');
assert.equal(status().capacity,6);
assert.equal(status().used,5,'Long music + three square widgets uses five of six slots');
assert.equal(status().entries.music.view,'long');
for(const id of ['aura','avatar','guest-check'])
 assert.equal(status().entries[id].view,'square',id+' starts at the Aura-sized square minimum');
assert.equal(rail.style.getPropertyValue('--studio-upper-cols'),'6');
assert.equal(music.dataset.upperSpan,'2','Long music uses two square widths');
assert.equal(pair.dataset.upperSpan,'2','Aura/Avatar together use two square widths');
assert.equal(guest.dataset.upperSpan,'1');
assert.equal(doc.querySelectorAll('[data-upper-compact-row]').length,0,
 'No yellow-sized widget has a Skeleton Key tile, including migrated stale rows');
musicYellow.click();
assert.equal(status().entries.music.view,'square','Yellow minimizes music to one square width');
assert.equal(music.dataset.musicVariant,'square');
assert.equal(music.dataset.upperSpan,'1');
assert(!music.classList.contains('studio-header-only')&&!music.classList.contains('widget-is-docked'),
 'Square keeps music visible and is not a red removal');
assert.strictEqual(music.querySelector('.stereo-shell'),shell,'Audio DOM survives resizing');
musicYellow.click();
assert.equal(status().entries.music.view,'long','Yellow again restores Music to full double-width');
assert.equal(music.dataset.upperSpan,'2');
assert.strictEqual(music.querySelector('.stereo-shell'),shell,'Restoration never remounts the player');
const auraYellow=aura.querySelector('.window-light.yellow');
const avatarYellow=avatar.querySelector('.window-light.yellow');
const guestYellow=guest.querySelector('.window-light.yellow');
auraYellow.click();
assert.equal(status().entries.aura.view,'long','Aura can grow to long using sixth slot');
assert.equal(status().used,6);
assert.equal(pair.style.getPropertyValue('--studio-pair-tracks'),'350.2px 228.8px','Expanding Aura preserves Avatar square width');
assert.equal(pair.dataset.upperSpan,'3','Pair consumes long Aura plus square Avatar');
assert.equal(pair.style.getPropertyValue('--studio-aura-cols'),'2fr');
avatarYellow.click();
assert.equal(status().entries.avatar.view,'square','Full row refuses a seventh slot');
assert.match(doc.querySelector('#studioUpperWidgetStatus').textContent,/already minimized.*row is full/i);
assert.equal(doc.querySelectorAll('[data-upper-compact-row]').length,0,'Full row never creates yellow Skeleton Key tiles');
auraYellow.click();
assert.equal(status().entries.aura.view,'square','Yellow restores long Aura to its square size');
avatarYellow.click();
assert.equal(status().entries.avatar.view,'long','Avatar can grow when Aura is square');
assert.equal(status().used,6);
guestYellow.click();
assert.equal(status().entries['guest-check'].view,'square','Check cannot expand beyond six occupied units');
avatarYellow.click();
assert.equal(status().entries.avatar.view,'square');
guestYellow.click();
assert.equal(status().entries['guest-check'].view,'long','Guest Check can take last free double-width slot');
assert.equal(status().used,6);
guestYellow.click();
assert.equal(status().entries['guest-check'].view,'square');
assert.equal(status().used,5);
assert.equal(saved.upperVariants.music,'long','Music full variant saves in account layout');
assert.equal(saved.upperVariants.aura,'square','Aura square variant saves in account layout');
assert(read('ui-coherence.js').includes('upperVariants:Object.fromEntries('),
 'Studio account snapshot stores upper variants independently of shortcut and red-dock state');
assert(read('ui-coherence.js').includes('const upperVariants=layout.upperVariants'),
 'Remote account hydration restores upper widths separately from collapsed widgets');
assert.equal(doc.querySelectorAll('[data-upper-compact-row]').length,0,
 'Only red-closing a widget should ever create a Skeleton Key restore entry');

// Red restoration must not sneak a seventh slot into the row. Closing a
// square lets the other three become long; its restore stays available.
let redRestores=0;
const restoreMusic=doc.createElement('button');restoreMusic.dataset.restoreWidget='music';
doc.querySelector('#studioApp').append(restoreMusic);
doc.addEventListener('click',e=>{
 if(e.target===restoreMusic){redRestores++;music.classList.remove('widget-is-minimized','widget-is-docked')}
},true);
music.classList.add('widget-is-minimized','widget-is-docked');
for(const id of ['aura','avatar','guest-check'])w.BigLWAUpperWidgets.restore(id);
assert.equal(status().used,6,'Three full widgets fill the row with Music closed');
restoreMusic.click();
assert.equal(redRestores,0,'Full row blocks red restoration without deleting its button');
assert(music.classList.contains('widget-is-docked'));
auraYellow.click();
assert.equal(status().used,5);
restoreMusic.click();
assert.equal(redRestores,1,'Restore works as soon as one square slot is available');
assert.equal(status().entries.music.view,'square','Red restore fits the available square slot');
assert.equal(status().used,6);
assert.equal(rail.style.getPropertyValue('--studio-upper-cols'),'6','Track widths do not change as cards close or resize');
// Restore original fixture state for the remaining checks.
for(const id of ['avatar','guest-check'])w.BigLWAUpperWidgets.minimize(id);
musicYellow.click();

w.dispatchEvent(new w.Event('biglwa:studio-collapse-applied'));
await new Promise(resolve=>setTimeout(resolve,70));
assert.equal(doc.querySelector('#studioAvatarCard .studio-heading-image-symbol')?.getAttribute('src'),'/sesa-wo-suban-medium.png','Avatar has the circular star symbol beside the heading');
assert.equal(doc.querySelector('.aura-card .studio-heading-image-symbol')?.getAttribute('src'),'/Sunsum.webp','Aura has native Sunsum art beside the heading');
assert.equal(doc.querySelectorAll('#studioAvatarCard .studio-heading-image-symbol').length,1,'Avatar symbols never double on refresh');
assert.equal(doc.querySelectorAll('.aura-card .studio-heading-image-symbol').length,1,'Aura symbols never double on refresh');
const whiteMask=doc.querySelector('#biglwaStudioSymbolWhiteKnockout filter#biglwaStudioWhiteToAlpha feColorMatrix');
assert(whiteMask,'An inline SVG knock-out filter exists for both Studio symbols');
const matrix=whiteMask.getAttribute('values').trim().split(/\s+/).map(Number);
assert.equal(matrix.length,20,'The luminance-to-alpha transformation has all 20 coefficients');
assert.deepEqual(matrix.slice(0,15),Array(15).fill(0),'White/black inputs become the same neutral black ink');
assert(Math.abs(matrix[15]+.2126)<1e-8&&Math.abs(matrix[16]+.7152)<1e-8&&Math.abs(matrix[17]+.0722)<1e-8&&matrix[18]===0&&matrix[19]===1,
 'White source pixels become transparent while dark pixels retain their edges');
const musicStyle=read('studio-widget-visibility-music-20261102.css');
assert(musicStyle.includes('.studio-header-only.studio-music-square'),'Square stereo has explicit visible layout');
assert(musicStyle.includes('Stereo rebuild v3: TWO true header rows'),'New stereo reserves an independent header shelf');
assert(musicStyle.includes('grid-auto-rows:max-content!important')&&
 musicStyle.includes('grid-template-rows:max-content!important'),
 'Upper rail now uses the tallest real widget instead of a fixed 206px row');
assert(musicStyle.includes('hero-action-bar.hero-action-bar')&&
 musicStyle.includes('grid-row:3!important')&&
 musicStyle.includes('margin:18px 0 0!important'),
 'Shortcut bar follows the full-height upper widget row with separation');
assert(musicStyle.includes('sidebar-upper-compact-row .sidebar-route-icon')&&
 musicStyle.includes('sidebar-upper-compact-row::after'),
 'Skeleton Key square icon geometry stays contained with no false red light');

assert(musicStyle.includes('.stereo-skip-button')&&musicStyle.includes('grid-template-columns:repeat(3,minmax(0,1fr)) 25px'),
 'Rewind, play, forward and eject have a compact four-button deck');
assert(musicStyle.includes('.guest-check-card.studio-upper-square')&&musicStyle.includes('#studioAvatarCard.studio-upper-square'),
 'Check and Avatar square layouts have explicit CSS');
assert(musicStyle.includes('.sidebar-upper-yellow-indicator')&&musicStyle.includes('.sidebar-widget-restore-row.is-red-docked'),
 'Skeleton Key distinguishes yellow compact from red removed lights');

assert(musicStyle.includes('img[src*="/Sunsum.webp"]')&&musicStyle.includes('img[src*="/sesa-wo-suban-medium.png"]'),
 'Aura and Avatar image layers both use the white-to-transparency mask');
assert(musicStyle.includes('filter:url("#biglwaStudioWhiteToAlpha")')&&musicStyle.includes('mix-blend-mode:multiply'),
 'Light mode neutralizes source image white pixels');
assert(musicStyle.includes('filter:url("#biglwaStudioWhiteToAlpha") invert(1)')&&musicStyle.includes('mix-blend-mode:screen'),
 'Dark mode uses inverted, screened-out white backgrounds');

assert(musicStyle.includes('.stereo-tuner')&&musicStyle.includes('padding:43px 12px 13px!important'),'Long stereo reserves header clearance');
assert(musicStyle.includes('.widget-window-controls')&&musicStyle.includes('#profileMusicOpen'),'Three dots and songs control are layered above radio');
assert.equal(doc.querySelector('#studioWidgetVisibilityMusicFix')?.getAttribute('href'),'/studio-widget-visibility-music-20261102.css?v=20261103-height-cascade-4');
assert.equal(doc.querySelector('#studioUpperRailSizeContract')?.getAttribute('href'),
 '/studio-upper-rail-size-contract-20261103.css?v=20261103-preserve-squares-3');
const fullMusicRule=musicStyle.match(/\.music-card\.stereo-music-widget:not\(\.widget-is-minimized\):not\(\.studio-upper-square\)\{([^}]+)\}/)[1];
assert(!fullMusicRule.includes('267px'),'The higher-specificity legacy rule cannot force Music below the shared row');
for(const property of ['height','min-height','max-height'])
 assert(fullMusicRule.includes(property+':var(--studio-upper-card-height,206px)!important'),property+' follows the actual shared card height');
const contract=read('studio-upper-rail-size-contract-20261103.css');
assert(contract.includes('grid-template-columns:repeat(var(--studio-upper-cols,6),minmax(0,1fr))'),
 'Upper rail uses one variable-size track per square-width unit');
assert(contract.includes('grid-auto-rows:var(--studio-upper-card-height)'),
 'Row is capped to shared square card height rather than tallest long music');
assert(contract.includes('height:var(--studio-upper-card-height)!important')&&contract.includes('grid-template-rows:23px 79px 25px!important'),
 'Long music has the same card height as Aura, and a compressed but functional stereo face');
assert(contract.includes('[data-upper-span="2"]')&&contract.includes('[data-upper-span="4"]'),
 'Full variants use two slots; both long Aura and Avatar can fill four');


await new Promise(resolve=>setTimeout(resolve,120));
dom.window.close();
console.log('PASS: lower widgets unchanged, upper six-slot sizing, yellow two-way size toggle, full-row guard, no yellow Skeleton Key entries, symbol masking');
