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
assert(css.includes('width:54px!important')&&css.includes('height:54px!important'),'Shared optical bounding box');
assert(css.includes('overflow:hidden!important'),'Excess symbol size cannot escape invisible box');
assert(css.includes('.biglwa-topbar-current :is(img,svg)'),'Images and SVGs share same constraint');
assert(css.includes('.biglwa-topbar-current :is(span,div,i,b,strong,em)'),'Nested text symbols share same constraint');
assert(css.includes('[data-biglwa-active-module="trophies"]'),'Already balanced trophy star remains its own small optical scale');
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
for(const key of ['library','map','trophies','tools','politc','feed']){
 workspace.dataset.moduleKey=key;
 w.BigLWAStudioMark.sync();
 assert.equal(brand.dataset.biglwaActiveModule,key,key+' symbol tracks its page');
 const glyph=brand.querySelector('.biglwa-topbar-current');
 assert(glyph&&glyph.firstElementChild,key+' has a single bounded icon source');
 assert(glyph.querySelector('img,svg')||glyph.textContent.trim(),key+' artwork not blank');
 assert.equal(brand.querySelectorAll('.biglwa-module-tipi').length,1,'Single hover tipi across all modules');
}
workspace.hidden=true;d.querySelector('.main').classList.remove('module-view');
w.BigLWAStudioMark.sync();
assert.equal(brand.dataset.biglwaActiveModule,'','Return to Studio restores crest state');
assert(!brand.classList.contains('biglwa-brand-in-module'),'Module glyph hidden on Studio home');
assert.equal(d.querySelector('[data-widget-id="a"]').dataset.biglwaGridPosition,'1:1','Saved widget position is not migrated or overwritten');
w.close();
console.log('PASS: bounded masthead marks across routes and stable inset after widget-page navigation');
