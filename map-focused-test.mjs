import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const {JSDOM}=createRequire(import.meta.url)('jsdom');
function runtime(){
 const w=new JSDOM(readFileSync('map-app.html','utf8'),{url:'https://biglwa.com/map-app.html',runScripts:'outside-only'}).window;
 w.ResizeObserver=class{observe(){}};w.matchMedia=()=>({matches:false,addEventListener(){}});w.HTMLElement.prototype.scrollIntoView=function(){};
 for(const file of ['map-lwa-experience-20261113.js','map-lwa-navigate-20261113.js','map-transport-hub-20261114.js','map-transit-desk.js','map-focused.js','map-3d.js'])w.eval(readFileSync(file,'utf8'));
 return w;
}
test('planning hides navigation; Transit exposes its desk beside the mode; selected route and edit work',()=>{
 const w=runtime(),d=w.document;
 assert.equal(d.getElementById('mapNavControls').hidden,true);
 assert.equal(d.getElementById('mapTransitOptions').hidden,true);
 d.querySelector('[data-map-travel=transit]').click();
 assert.equal(d.getElementById('mapTransitOptions').hidden,false);
 assert.equal(d.getElementById('metroTransitDesk').parentElement.id,'mapTransitOptions');
 d.querySelector('[data-map-travel=walking]').click();assert.equal(d.getElementById('mapTransitOptions').hidden,true);
 const r={mode:'walking',points:[[34,-118],[34.01,-118]],maneuvers:[{instruction:'Walk north',shapeIndex:0}],durationMinutes:10,distanceLabel:'1 km'};
 w.dispatchEvent(new w.CustomEvent('biglwa:map-navigation-route',{detail:r}));
 assert.equal(d.getElementById('mapNavControls').hidden,true);
 [...d.querySelectorAll('button')].find(b=>b.textContent==='Use this route').click();
 assert.equal(d.getElementById('mapJourneyInputs').hidden,true);assert.equal(d.getElementById('mapNavControls').hidden,false);
 [...d.querySelectorAll('button')].find(b=>b.textContent==='Change trip').click();
 assert.equal(d.getElementById('mapJourneyInputs').hidden,false);assert.equal(d.getElementById('mapNavControls').hidden,true);assert(d.getElementById('mapNavGo').disabled);
 w.close();
});
test('unsupported 3D returns to usable 2D with explanation',async()=>{
 const w=runtime();w.maplibregl={supported:()=>false};await w.BigLWAMap3D.open();
 assert.equal(w.document.querySelector('.map-3d-canvas'),null);assert.match(w.document.querySelector('.map-3d-notice').textContent,/2D map is still ready/);w.close();
});
test('Studio thumbnail waits for trusted readiness; timeout and retry preserve the artwork',()=>{
 const w=new JSDOM('<article id="map"><div class="card-cta"></div></article>',{url:'https://biglwa.com/studio',runScripts:'outside-only'}).window;
 let timeout;w.setTimeout=fn=>{timeout=fn;return 1};w.clearTimeout=()=>{};
 const all=readFileSync('module-pages.js','utf8'),start=all.indexOf('  function syncMapCardPreview(){'),end=all.indexOf('\n  function enhanceStudioCards',start);
 w.eval("const $=(s,r=document)=>r.querySelector(s);const readMapPreviewPins=()=>[];"+all.slice(start,end)+';window.syncMini=syncMapCardPreview;');
 w.syncMini();const frame=w.document.querySelector('iframe'),image=w.document.querySelector('img');
 assert.equal(frame.style.visibility,'hidden');timeout();assert.equal(w.document.querySelector('button').hidden,false);assert(image.isConnected);
 w.syncMini();assert.equal(w.document.querySelectorAll('iframe').length,1);
 w.dispatchEvent(new w.MessageEvent('message',{origin:'https://other.example',source:frame.contentWindow,data:{type:'biglwa:map-ready'}}));assert.equal(frame.style.visibility,'hidden');
 w.dispatchEvent(new w.MessageEvent('message',{origin:w.location.origin,source:frame.contentWindow,data:{type:'biglwa:map-ready'}}));assert.equal(frame.style.visibility,'visible');
 w.dispatchEvent(new w.MessageEvent('message',{origin:w.location.origin,source:frame.contentWindow,data:{type:'biglwa:map-failed'}}));assert.equal(frame.style.visibility,'hidden');assert.equal(w.document.querySelector('button').hidden,false);
 w.document.querySelector('button').click();assert.equal(w.document.querySelector('button').hidden,true);w.close();
});
