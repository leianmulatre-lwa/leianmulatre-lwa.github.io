import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const {JSDOM}=createRequire(import.meta.url)('jsdom');
const dots=readFileSync(new URL('./studio-loading-dots-20261021.js',import.meta.url),'utf8');
const index=readFileSync(new URL('./index.html',import.meta.url),'utf8');
assert.match(index,/studio-loading-dots-20261021\.js\?v=20261026-curtain-sync-7/,'Current site loads fix');
assert.match(dots,/#lwaProfileLoading\{display:inline-flex!important/,'Loading dots share one consistent DOM node in both modes');
assert.match(dots,/if\(!profile\|\|!profile\.isConnected\)/,'Brand dots reattach after toolbar hydration');

async function verify(preview){
 const mode=preview?'biglwa-preview-mode':'';
 const dom=new JSDOM('<!doctype html><html class="'+mode+'"><head></head><body><main id="studioApp" class="is-active"><div class="topbar"><div class="studio-brand-row"><a class="brand biglwa-block-brand" href="/studio"><span class="biglwa-topbar-crest">LOGO</span></a></div></div><div class="main"></div></main></body></html>',{
  url:'https://biglwa.com/studio',pretendToBeVisual:true,runScripts:'outside-only'
 });
 const w=dom.window,d=w.document;
 w.eval(dots);d.dispatchEvent(new w.Event('DOMContentLoaded'));
 await new Promise(resolve=>setTimeout(resolve,60));
 let rail=d.getElementById('lwaProfileLoading');
 assert.ok(rail, 'Existing top-left dots mount with '+(preview?'preview':'signed-in owner'));
 assert.equal(rail.parentElement,d.querySelector('.studio-brand-row'),'Dots sit beside symbol logo');
 assert.equal(rail.hidden,true,'Idle logo loading dots are hidden at startup');
 assert.equal(rail.querySelectorAll('.lwa-dot').length,1,'Exactly one floating triple-dot indicator');
 assert.ok(d.getElementById('lwaLoadingDotsStyles').textContent.includes('background:#4ba76a'),'RGB animations preserved');
 w.BigLWALoadingDots.profile(true);
 assert.equal(rail.hidden,false,'Dots remain visible when profile is loading');
 assert.equal(rail.querySelector('.lwa-profile-loading-label').hidden,false,'Only while loading is text visible');
 w.BigLWALoadingDots.ready();
 assert.equal(rail.hidden,true,'Dots disappear once profile loading finishes');
 assert.equal(rail.querySelector('.lwa-profile-loading-label').hidden,true,'Idle dots do not falsely say loading profile');
 assert.equal(rail.getAttribute('aria-hidden'),'true','Decorative idle dots are hidden from screen readers');

 // Studio hydrates/redraws the topbar after Firebase signs in. Preserve dots.
 const brand=d.querySelector('.studio-brand-row');
 const replacement=d.createElement('div');
 replacement.className='studio-brand-row';
 replacement.innerHTML='<a class="brand biglwa-block-brand" href="/studio"><span class="biglwa-topbar-crest">LOGO</span></a>';
 brand.replaceWith(replacement);
 w.dispatchEvent(new w.Event('biglwa:studio-opened'));
 await new Promise(resolve=>setTimeout(resolve,80));
 const next=d.querySelector('#studioApp .studio-brand-row #lwaProfileLoading');
 assert.ok(next,'Dots reattach when signed-in toolbar remounts');
 assert.equal(d.querySelectorAll('#lwaProfileLoading').length,1,'No duplicate dots');
 assert.equal(next.hidden,true,'Finished loading stays hidden even after toolbar remount');

 // Opening a widget creates the EXISTING module curtain. The top-left crest
 // should follow that exact curtain, then turn off the moment it is finished.
 const main=d.querySelector('#studioApp .main');
 const moduleView=d.createElement('div');
 moduleView.className='main module-view';
 moduleView.innerHTML='<div class="module-workspace" data-module-key="stream">'+
  '<section class="module-shell"><header class="module-heading">Stream</header>'+
  '<div class="widget-payload" aria-busy="true">Loading radio</div></section></div>';
 main.replaceWith(moduleView);
 await new Promise(resolve=>setTimeout(resolve,85));
 const curtain=moduleView.querySelector('[data-lwa-curtain="module"]');
 assert.ok(curtain,'New widget opens its original loading curtain');
 assert.equal(curtain.hidden,false,'Module curtain is actively visible');
 assert.equal(d.querySelector('#lwaProfileLoading').hidden,false,'Top-left dots appear WHILE widget curtain appears');
 const busy=moduleView.querySelector('.widget-payload');
 busy.removeAttribute('aria-busy');
 await new Promise(resolve=>setTimeout(resolve,500));
 assert.equal(curtain.hidden,true,'Original module curtain disappears when widget finishes');
 assert.equal(d.querySelector('#lwaProfileLoading').hidden,true,'Top-left dots disappear in sync with curtain');
 // When a widget is loaded but starts requesting new data, it is permitted to
 // display the loading state again rather than becoming permanently stuck off.
 busy.setAttribute('aria-busy','true');
 await new Promise(resolve=>setTimeout(resolve,60));
 assert.equal(curtain.hidden,false,'Curtain reopens for a later widget request');
 assert.equal(d.querySelector('#lwaProfileLoading').hidden,false,'Top-left dots track later requests too');
 curtain.querySelector('.lwa-curtain-bypass').click();
 assert.equal(curtain.hidden,true,'View-anyway closes the curtain');
 assert.equal(d.querySelector('#lwaProfileLoading').hidden,true,'View-anyway stops the top-left dots as well');

 w.close();
}
await verify(false);
await verify(true);
console.log('PASS: RGB logo dots synchronize with widget curtain appearing, finishing, retrying and bypass, in owner and preview modes.');
