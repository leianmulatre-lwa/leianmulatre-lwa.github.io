/* Studio owner preview regression: match annotated search length and display
   real imported Pinterest cover photos at widget scale, not the module grid. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {JSDOM}=require('jsdom');
const read=path=>readFileSync(new URL('./'+path,import.meta.url),'utf8');
const css=read('studio-header-gutters-20261029.css');
const boardCss=read('pinterest-red-consistency-20261016.css');
const pinterest=read('pinterest-orbit.js');
const html=read('index.html');
assert.match(css,/max-width:1100px!important/,'Search reaches the annotated endpoint (~1320px from the left at screenshot zoom) instead of 760px');
assert.doesNotMatch(css,/max-width:min\(100%,760px\)/,'Old cropped search width must be removed');
assert.ok(css.includes('#studioApp .topbar .search-wrap'),'Main and profile-preview use one width rule');
assert.ok(html.includes('studio-header-gutters-20261029.css?v=20261030-match-marked-preview-5'),'Live search asset cache is refreshed');
assert.ok(html.includes('studio-mosaic=20261030-1'),'Studio board runtime and styles are cache-refreshed');
assert.ok(boardCss.includes('#studioApp #boards .biglwa-studio-board-gallery'),'Widget rules target #boards rather than only #pinterestBoards');
assert.ok(boardCss.includes('flex:1 1 auto!important')&&boardCss.includes('object-fit:contain!important'),'One real photo can fill the widget without hard cropping');

const start=pinterest.indexOf(' // The Studio thumbnail is NOT the Boards module.');
const end=pinterest.indexOf('window.__biglwaPinterest={',start);
assert(start>0&&end>start,'Studio gallery behavior is installed in the Pinterest runtime');
const fixture='<!doctype html><html><body>'+
 '<main id="studioApp"><article id="boards" class="card"><header class="card-head"><h2>boards</h2></header>'+
 '<p>Collect. Curate. Be inspired.</p>'+
 '<div class="old-board-preview"><button type="button" class="original-board-cover"><img src="https://i.pinimg.com/original.jpg" alt="Original board cover"></button></div>'+
 '<button type="button" class="card-cta" data-open="boards">My Inspiration</button></article></main>'+
 '</body></html>';
const dom=new JSDOM(fixture,{url:'https://biglwa.com/studio',pretendToBeVisual:true,runScripts:'outside-only'});
const w=dom.window,d=w.document;
// Make the test deterministic and prevent a pending jsdom animation-frame
// callback from firing after its document is closed.
w.requestAnimationFrame=callback=>{callback(0);return 1};
w.cancelAnimationFrame=()=>{};
let photos=[
 {id:'1',url:'https://i.pinimg.com/photo-1.jpg'},
 {id:'2',url:'https://i.pinimg.com/photo-2.jpg'},
 {id:'3',url:'https://i.pinimg.com/photo-3.jpg'}
];
w.__biglwaPinterest={getPreview:()=>photos};
w.eval(pinterest.slice(start,end)+'\npaintStudioBoardGallery();');
const card=d.querySelector('#boards');
const gallery=card.querySelector('.biglwa-studio-board-gallery');
assert(gallery,'Studio gets one full-size preview gallery');
assert.equal(gallery.dataset.count,'4','Real Pinterest covers and previously displayed photo are retained');
assert.equal(gallery.querySelectorAll('.biglwa-studio-board-tile').length,4,'Mosaic uses available genuine photos');
assert.equal(card.querySelectorAll('.biglwa-studio-board-gallery').length,1,'Only one gallery is rendered');
assert(card.querySelector('.old-board-preview').classList.contains('biglwa-studio-board-legacy-thumb'),'Tiny old tile is hidden rather than duplicated');
assert.equal(card.querySelector('.card-cta').textContent,'My Inspiration','Existing Boards CTA is preserved');
assert.equal(gallery.querySelector('.biglwa-studio-board-tile').dataset.open,'boards','Click opens actual Boards module');
photos=[{id:'1',url:'https://i.pinimg.com/photo-1.jpg'}];
w.eval('paintStudioBoardGallery()');
assert.equal(gallery.dataset.count,'2','Preview adapts to the number of available photos');
assert.equal(card.querySelectorAll('.biglwa-studio-board-gallery').length,1,'Updates do not duplicate the gallery');
d.documentElement.classList.add('biglwa-preview-mode');
w.eval('paintStudioBoardGallery()');
assert.equal(card.querySelector('.biglwa-studio-board-gallery'),null,'Owner cover gallery is removed when switching to public preview');
assert(!card.querySelector('.old-board-preview').classList.contains('biglwa-studio-board-legacy-thumb'),'Public preview can use its own content');
dom.window.close();
console.log('PASS: marked search width, full-size real Studio Boards thumbnail, responsive mosaic, public-preview isolation.');
