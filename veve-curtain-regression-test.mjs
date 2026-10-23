import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {JSDOM}=require('jsdom');
const source=readFileSync(new URL('./studio-loading-dots-20261021.js',import.meta.url),'utf8');
const veve=readFileSync(new URL('./veve.js',import.meta.url),'utf8');
const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
const dom=new JSDOM('<!doctype html><html><head></head><body>'+
 '<main id="studioApp" class="is-active"><div class="topbar"></div>'+
 '<div class="main module-view"><div class="module-workspace" data-module-key="veve">'+
 '<div class="module-shell"><h1 class="module-heading">Veve</h1>'+
 '<section id="biglwaVeve"><div class="veve-masonry"><img loading="lazy" src="https://example.com/offscreen.jpg"></div></section>'+
 '</div></div></div></main></body></html>',{
  url:'https://biglwa.com/studio?view=veve',pretendToBeVisual:true,runScripts:'outside-only'
 });
const w=dom.window,doc=w.document;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let stage='Connecting to public collections…',ready=false;
w.BigLWAVeve={status:()=>({stage,ready,mounted:true,loading:!ready})};
w.eval(source);
doc.dispatchEvent(new w.Event('DOMContentLoaded'));
await sleep(45);
const shell=doc.querySelector('.module-shell');
const curtain=shell.querySelector('.lwa-curtain[data-lwa-curtain="module"]');
assert.ok(curtain,'Veve creates the loading curtain');
assert.equal(curtain.hidden,false,'Curtain stays while public data is pending');
assert.ok(shell.classList.contains('lwa-curtain-veve-pending'),'An opaque Veve cover is active while data loads');
assert.ok(curtain.querySelector('.lwa-curtain-bypass'),'Always-available view anyway action');
assert.equal(curtain.querySelector('.lwa-curtain-bypass').textContent,'Who’s you? →');
assert.match(source,/\.lwa-curtain\[data-lwa-curtain="module"\] \.lwa-dot\{width:17px;height:17px/,'Dots enlarged');
assert.match(source,/font:400 clamp\(20px,2\.9vw,31px\)/,'Curtain heading uses lowercase stitched style');
assert.match(veve,/biglwa:veve-load-state/,'Veve reports its loading stages');
assert.match(veve,/status\(\)\{return \{ready:state\.initialReady/,'Veve exports authoritative readiness');
stage='Loading public Sqwidz…';
doc.dispatchEvent(new w.CustomEvent('biglwa:veve-load-state',{detail:{stage,ready:false}}));
await sleep(45);
assert.equal(curtain.querySelector('.lwa-curtain-progress').textContent,stage.toLowerCase(),'Curtain displays the real import stage in lowercase');
ready=true;stage='Public collections ready.';
doc.dispatchEvent(new w.CustomEvent('biglwa:veve-load-state',{detail:{stage,ready:true}}));
await sleep(45);
assert.equal(curtain.hidden,true,'Ready state dismisses curtain even when lazy photo is still incomplete');
assert.equal(shell.classList.contains('lwa-curtain-veve-pending'),false,'Feed tiles reappear after data completes');
ready=false;
const workspace=doc.querySelector('.module-workspace');
workspace.dataset.moduleKey='notes';
await sleep(45);
workspace.dataset.moduleKey='veve';
doc.dispatchEvent(new w.CustomEvent('biglwa:veve-load-state',{detail:{stage:'Loading public posts…',ready:false}}));
await sleep(45);
const reentered=shell.querySelector('.lwa-curtain[data-lwa-curtain="module"]');
assert.ok(reentered&&!reentered.hidden,'Veve loading curtain reopens on a fresh mount');
reentered.querySelector('.lwa-curtain-bypass').click();
assert.equal(reentered.hidden,true,'Who’s you? reveals the feed immediately');
assert.equal(shell.classList.contains('lwa-curtain-veve-pending'),false,'Bypass reveals existing feed content');
doc.dispatchEvent(new w.CustomEvent('biglwa:veve-load-state',{detail:{stage:'Loading public posts…',ready:false}}));
await sleep(45);
assert.equal(reentered.hidden,true,'Bypass remains respected until a different page is opened');
assert.ok(html.includes('studio-loading-dots-20261021.js?v=20261022-continuous-veve-13'));
assert.ok(html.includes('veve.js?v=20261022-board-save-3'));
w.close();
console.log('PASS: Veve curtain covers feed tiles, tracks requests, dismisses for lazy images, and allows view anyway.');
