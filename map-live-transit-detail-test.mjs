import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createRequire} from 'node:module';const {JSDOM}=createRequire(import.meta.url)('jsdom');
test('live vehicle selection loads its named stops, direction and line without inventing lanes',async()=>{
 const w=new JSDOM('<div class="map-side"><div class="toolbar"></div></div>',{url:'https://biglwa.com',runScripts:'outside-only'}).window;
 const sockets=[],marks=[];w.WebSocket=class{constructor(){sockets.push(this)}addEventListener(t,fn){this[t]=fn}close(){}};
 const layer=()=>({addTo(){return this},addLayer(){},removeLayer(){},remove(){},getLayers(){return marks},getBounds(){return []}});
 const L={layerGroup:layer,featureGroup:layer,latLngBounds:()=>({contains:()=>true}),polyline:()=>({addTo(){}}),circleMarker:()=>{const m={addTo(){return this},setLatLng(){},bindTooltip(){return this},setTooltipContent(){},off(){},on(t,fn){this[t]=fn}};marks.push(m);return m}};
 w.BigLWAMapBridge={L,map:{getCenter(){return []},getZoom(){return 12},setView(){},fitBounds(){}}};
 const paths=[];w.fetch=async url=>{paths.push(url);return{ok:true,json:async()=>url.includes('route_overview')?[{route_long_name:'Metro Rapid',route_desc:'Wilshire',travel_direction_1:'Westbound'}]:[{stop_name:'Wilshire / Westwood',stop_id:1,direction_id:1,stop_sequence:1,geometry:{coordinates:[-118.44,34.06]}}]}};
 w.eval(readFileSync('map-live-transit.js','utf8'));w.document.querySelector('#mapLiveTransit').click();
 sockets[0].message({data:JSON.stringify({id:'bus1',vehicle:{timestamp:Date.now()/1000,position:{latitude:34.05,longitude:-118.24},trip:{route_id:'720-13172',direction_id:1}}})});
 marks[0].click();await new Promise(r=>setTimeout(r,10));
 assert(paths.some(p=>p.endsWith('route_stops/720')));assert.match(w.document.querySelector('.transit-line-detail').textContent,/Westbound/);assert.match(w.document.querySelector('.transit-line-detail').textContent,/Wilshire \/ Westwood/);assert.match(w.document.querySelector('.map-live-transit-detail').textContent,/do not identify a driving lane/);
 w.document.querySelector('#mapLiveTransit').click();assert(w.document.querySelector('.map-live-transit-detail').hidden);w.close();
});
