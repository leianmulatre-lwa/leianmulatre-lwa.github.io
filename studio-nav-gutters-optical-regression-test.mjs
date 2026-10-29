/* Shared optical icon box and route-independent Studio gutters.
   Does not write any member layout or alter persisted card coordinates. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
import {createRequire} from 'node:module';
const {JSDOM}=createRequire(import.meta.url)('jsdom');
const read=p=>readFileSync(new URL('./'+p,import.meta.url),'utf8');
const css=read('studio-nav-gutters-optical-20261029.css');
const page=read('index.html');
const drag=read('studio-spatial-drag-20261029.js');
const nav=read('studio-tipi-navigation-20261026.js');
assert(page.includes('studio-nav-gutters-optical-20261029.css?v=20261029-uniform-archive-1'),'Final shared CSS is loaded');
assert.doesNotThrow(()=>new Script(drag),'Drag layout JavaScript syntax');
assert.doesNotThrow(()=>new Script(nav),'Top-left navigation JavaScript syntax');
assert(css.includes('#studioApp .main > .masonry'),'Side gutters do not depend on the active route');
assert(css.includes('#studioApp .main > .masonry.biglwa-free-layout'),'Same gutter applies when drag engine is enabled');
assert(css.includes('width:calc(100% - (2 * var(--biglwa-widget-edge)))!important'),'Real parent width excludes both margins');
assert(css.includes('margin-left:var(--biglwa-widget-edge)!important')&&css.includes('margin-right:var(--biglwa-widget-edge)!important'),'Equal insets on both sides');
assert(css.includes('.main.module-view > .masonry.biglwa-free-layout'),'Router can hide masonry when page open');
assert(drag.includes("main?.classList.contains('module-view')"),'Do not measure while on a module page');
assert(drag.includes("!(parent.clientWidth||parent.getBoundingClientRect().width)"),'Do not measure a hidden or disconnected masonry');
assert(drag.includes("document.addEventListener('biglwa:module-close',schedule)"),'On return, remeasure widgets');
assert(drag.includes("document.addEventListener('biglwa:module-open',schedule)"),'Module transitions are observed');
assert(drag.includes("parent.clientWidth||parent.getBoundingClientRect().width"),'Column math uses inset masonry content');
const masthead=read('studio-tipi-navigation-20261026.css');
assert(!css.includes('.biglwa-topbar-current'),'Gutter CSS cannot resize the masthead');
assert(masthead.includes('width:52px!important')&&masthead.includes('height:52px!important'),'Every masthead state uses the same anchor');
assert(!masthead.includes('[data-biglwa-active-module="trophies"]'),'No per-page optical exceptions');
assert(nav.includes('window.BigLWAWidgetSymbols?.markup(key)'),'Masthead reads the shared symbol catalog');
assert(!nav.includes('const GLYPHS=')&&!nav.includes('const FALLBACK='),'Masthead cannot invent page symbols');
const dom=new JSDOM(`<!doctype html><main id="studioApp">
<div class="studio-brand-row"><a class="brand biglwa-block-brand" href="/studio"><span class="biglwa-topbar-crest">crest</span></a></div>
<section class="main module-view"><div class="masonry">
<article data-widget-id="a" data-biglwa-grid-position="1:1"></article></div>
<div id="moduleWorkspace" data-module-key="library"></div></section>
<nav><a data-shortcut-route="library"><span class="hero-shortcut-icon"><svg viewBox="0 0 10 10"><path d="M0 0H10V10H0Z"/></svg></span></a>
<a data-shortcut-route="map"><span class="hero-shortcut-icon"><span>⌖</span></span></a>
<a data-shortcut-route="trophies"><span class="hero-shortcut-icon">★</span></a></nav></main>`,{url:'https://biglwa.com/studio',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window,d=w.document,workspace=d.querySelector('#moduleWorkspace'),brand=d.querySelector('.biglwa-block-brand');
w.eval(nav);
for(const key of ['library','map','trophies']){
 workspace.dataset.moduleKey=key;
 w.BigLWAStudioMark.sync();
 assert.equal(brand.dataset.biglwaActiveModule,key,key+' symbol tracks its page');
 const glyph=brand.querySelector('.biglwa-topbar-current');
 assert(glyph&&glyph.firstElementChild,key+' has a single bounded icon source');
 assert(glyph.querySelector('img,svg')||glyph.textContent.trim(),key+' artwork not blank');
 assert.equal(brand.querySelectorAll('.biglwa-module-tipi').length,1,'Single hover tipi across all modules');
}
// Reproduce the real bug: copying navigation classes let the shortcut sizing
// observer overwrite the masthead's dimensions after every widget update.
const canonical='<span class="biglwa-archive-horizontal-symbol"><svg viewBox="0 0 20 30"><path d="M0 0H20V30H0Z"/></svg></span>';
w.BigLWAWidgetSymbols={markup:key=>key==='archive'?canonical:'',keys:()=>['archive']};
workspace.dataset.moduleKey='archive';w.BigLWAStudioMark.sync();
const art=brand.querySelector('.masthead-native-symbol');
assert(art,'Masthead owns an independent artwork container');
assert.equal(brand.querySelectorAll('.hero-shortcut-icon,.sidebar-route-icon,.card-icon').length,0,'Navigation/heading sizing selectors cannot touch copied artwork');
assert.equal(art.dataset.symbolKey,'archive','Actual symbol record is associated with the active route');
assert.equal(art.querySelector('g').getAttribute('transform'),'rotate(90)','Archive keeps its canonical horizontal orientation instead of becoming Library');
assert(!art.querySelector('.heading-normalized-glyph'),'Copied small-icon layout metadata is not reused');
w.BigLWAWidgetSymbols={markup:()=>'<span class="biglwa-archive-horizontal-symbol"><svg class="heading-normalized-glyph" viewBox="2 -17 21 21"><text font-family="Georgia" font-size="26">▥</text></svg></span>',keys:()=>['archive']};
w.BigLWAStudioMark.sync();
assert.equal(brand.querySelector('.masthead-native-symbol svg').getAttribute('viewBox'),'-4 2 21 21','Archive rotates the measured ink box without replacing it with font line metrics');
assert(!brand.querySelector('.masthead-native-symbol svg').hasAttribute('data-heading-layout'),'Small navigation geometry is never copied');
workspace.dataset.moduleKey='unknown-module';w.BigLWAStudioMark.sync();
assert.equal(brand.querySelector('.biglwa-topbar-current').children.length,0,'A missing real record cannot be replaced by an invented glyph');
workspace.hidden=true;d.querySelector('.main').classList.remove('module-view');
w.BigLWAStudioMark.sync();
assert.equal(brand.dataset.biglwaActiveModule,'','Return to Studio restores crest state');
assert(!brand.classList.contains('biglwa-brand-in-module'),'Module glyph hidden on Studio home');
assert.equal(d.querySelector('[data-widget-id="a"]').dataset.biglwaGridPosition,'1:1','Saved widget position is not migrated or overwritten');
w.close();
console.log('PASS: bounded masthead marks across routes and stable inset after widget-page navigation');
