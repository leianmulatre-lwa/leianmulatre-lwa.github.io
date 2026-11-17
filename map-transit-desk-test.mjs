import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url),{JSDOM}=require('jsdom');
const source=readFileSync('map-transit-desk.js','utf8'),data=JSON.parse(readFileSync('data/metro-rail-map.json','utf8'));
test('rail network loads only on request and shows real lines and stations',async()=>{
 const dom=new JSDOM('<section id="mapTripPlanner"></section>',{url:'https://biglwa.com/map-app.html',runScripts:'outside-only'}),w=dom.window;
 let requests=0,lines=0,stations=0,removed=0;
 const layer={addTo(){return this},remove(){removed++},getBounds(){return []}};
 w.fetch=async()=>{requests++;return {ok:true,json:async()=>data}};
 w.BigLWAMapBridge={map:{fitBounds(){},setView(){}},L:{featureGroup:()=>layer,polyline:()=>{lines++;return {addTo(){return this},bindTooltip(){return this}}},circleMarker:()=>{stations++;return {addTo(){return this},bindTooltip(){return this}}}}};
 w.eval(source);assert.equal(requests,0);
 w.document.querySelector('button').click();await new Promise(r=>setTimeout(r,0));
 assert.equal(requests,1);assert.equal(lines,6);assert(stations>100);
 const select=w.document.querySelector('select');select.value='802';select.dispatchEvent(new w.Event('change'));await new Promise(r=>setTimeout(r,0));
 assert.equal(requests,1);assert.equal(removed,1);assert.equal(w.document.querySelectorAll('ol li').length,14);
 dom.window.close();
});
test('rail data contains valid geographic coordinates and source provenance',()=>{
 assert.equal(data.routes.length,6);assert.match(data.source,/LACMTA/);
 for(const route of data.routes){assert.match(route.color,/^[0-9A-F]{6}$/);assert(route.points.length>2);for(const [lat,lng] of route.points){assert(lat>33&&lat<35);assert(lng>-120&&lng<-116)}}
});
