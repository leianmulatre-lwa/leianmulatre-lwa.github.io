import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const {JSDOM}=createRequire(import.meta.url)('jsdom');
const read=p=>readFileSync(new URL('./'+p,import.meta.url),'utf8');
const ui=read('module-version-header-20261026.js');
const layout=read('lwazi-header-series-20261026.css');
const loader=read('studio-loading-dots-20261021.js');
const overlay=read('studio-loading-consistency-20261026.css');
const html=read('index.html');
assert.ok(html.includes('module-version-header-20261026.js?v=20261026-visualizr-png-9'),'Fresh Stream layout loaded');
assert.ok(html.includes('studio-loading-consistency-20261026.css?v=20261026-header-isolation-5'),'Fresh header-only loading stage loaded');
assert.ok(html.includes('studio-loading-dots-20261021.js?v=20261026-persistent-brand-dots-5'),'Original stitched loading wordmark loaded');
assert.ok(!html.includes('<img class="biglwa-startup-logo"')&&!html.includes('<img class=\\"biglwa-startup-logo\\"'),'Both startup screens omit block logo');
assert.ok(!loader.includes('biglwa-stitched-cubes-loader.avif'),'Module loader omits block logo');
assert.ok(loader.includes('lwa-curtain-brand-b')&&loader.includes('lwa-curtain-brand-w'),'Original stitched letter wordmark restored');
assert.ok(overlay.includes('z-index:1505!important'),'Module headings render above content curtain');
assert.ok(overlay.includes('background:transparent!important'),'Loading shell no longer turns header maroon');
assert.ok(overlay.includes('top:calc(var(--lwa-loading-top,0px) + var(--lwa-loading-hero-height))'),'Battery back cover begins below top curtain');
assert.ok(overlay.includes('background-image:linear-gradient(rgba(14,3,9,.36)'), 'Curtain is visually softened rather than using raw glossy block image');
assert.ok(layout.includes('grid-row:1!important;grid-column:2!important'),'Stream versions occupy H1 right hand column');
assert.ok(layout.includes('.stream-nav{'),'Old oversized Stream controls are hidden');
assert.ok(layout.includes('min-width:66px!important'),'Stream version controls are compact');

const markup='<main id="studioApp"><div id="moduleWorkspace" data-module-key="stream"><div class="module-shell"><div class="module-top"><button class="module-back">Studio</button></div><div id="moduleWorkspaceBody"><header class="module-heading"><div class="module-heading-copy"><h1>Stream</h1></div><div class="module-heading-bottom"><p>Programming</p></div></header>'+
'<section class="biglwa-stream"><nav class="stream-nav"><div class="stream-channels" role="tablist">'+
'<button data-stream-tab="podcast" aria-selected="true"><b>lwa radio</b></button>'+
'<button data-stream-tab="lwa-tv" aria-selected="false"><b>lwa tv</b></button>'+
'<button data-stream-tab="live" aria-selected="false"><b>live</b></button>'+
'</div></nav></section></div></div></div></main>';
const dom=new JSDOM('<!doctype html><html><head></head><body>'+markup+'</body></html>',{
 url:'https://biglwa.com/studio/stream',pretendToBeVisual:true,runScripts:'outside-only'
});
const w=dom.window,d=w.document;
const root=d.querySelector('.biglwa-stream');
let activated='';
root.addEventListener('click',e=>{
 const button=e.target.closest('[data-stream-tab]');
 if(!button)return;
 activated=button.dataset.streamTab;
 root.querySelectorAll('[data-stream-tab]').forEach(b=>b.setAttribute('aria-selected',String(b===button)));
});
w.eval(ui);
d.dispatchEvent(new w.Event('DOMContentLoaded'));
await new Promise(resolve=>setTimeout(resolve,90));
const header=d.querySelector('.module-heading');
const row=header.querySelector('.module-heading-right .stream-heading-versions');
assert.ok(header.classList.contains('module-heading--with-versions'),'Stream header uses same Sqwibz layout');
assert.equal(row?.children.length,3,'Exactly three compact top-row Stream choices');
assert.ok(root.querySelector('.stream-nav .stream-channels'),'Original handlers stay inside Stream');
row.querySelector('[data-stream-heading-tab="lwa-tv"]').click();
await new Promise(resolve=>setTimeout(resolve,50));
assert.equal(activated,'lwa-tv','Header switch activates ORIGINAL Stream delegated player logic');
assert.equal(row.querySelector('[data-stream-heading-tab="lwa-tv"]').getAttribute('aria-selected'),'true','Active channel state reflected in header');
assert.equal(root.querySelectorAll('[data-stream-tab]').length,3,'No duplicate native Stream controls');
dom.window.close();
console.log('PASS Stream options align with title; original tabs work; wordmark-only loader and transparent header above masked content.');
