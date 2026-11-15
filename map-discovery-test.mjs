import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read=path=>readFileSync(new URL('./'+path,import.meta.url),'utf8');
const js=read('map-lwa-discovery-20261114.js');
const css=read('map-lwa-discovery-20261114.css');
const mapHtml=read('map-app.html');

function harness(search='?embed=1',zoom=14){
 const events={},mapEvents={},fetches=[],markers=[],panes={};
 const node=(tag='div')=>({
  tag,className:'',dataset:{},children:[],events:{},style:{},href:'',
  textContent:'',hidden:false,
  append(...items){this.children.push(...items)},
  appendChild(item){this.children.push(item);return item},
  replaceChildren(...items){this.children=items},
  setAttribute(key,value){this[key]=value},
  addEventListener(key,cb){this.events[key]=cb},
  focus(){this.focused=true},click(){this.events.click?.()},
  querySelector(){return null}
 });
 const stage=node(),routePanel=node();
 const to=node('input'),from=node('input'),routeTab=node('button');
 panes.mapTripPlanner=routePanel;panes.mapTripTo=to;panes.mapTripFrom=from;
 panes.mapTabplan=routeTab;
 const map={
  zoom,lat:34.0451,lng:-118.4862,
  getZoom(){return this.zoom},getCenter(){return {lat:this.lat,lng:this.lng}},
  on(key,cb){mapEvents[key]=cb},
  setView(place,nextZoom){this.zoom=nextZoom;this.lastPlace=place},
  removeLayer(){this.removed=true}
 };
 const L={
  layerGroup:()=>({addTo(){return this}}),
  divIcon:obj=>obj,
  marker:([lat,lng],props)=>{
   const marker={lat,lng,props,addTo(){markers.push(this);return this},
    getLatLng(){return {lat:this.lat,lng:this.lng}},
    bindPopup(popup){this.popup=popup;return this},
    openPopup(){this.opened=true},closePopup(){this.closed=true}};
   return marker;
  }
 };
 const win={BigLWAMapBridge:{map,L},addEventListener(key,cb){events[key]=cb}};
 win.parent=win;
 const document={
  querySelector:key=>key==='.map-stage'?stage:null,
  getElementById:key=>panes[key]||null,
  createElement:node
 };
 const sandbox={window:win,document,location:{search},URL,URLSearchParams,
  AbortController,setTimeout,clearTimeout,console,Math,Date,
  fetch:async(url,options)=>{
   fetches.push({url,options});
   return {ok:true,status:200,json:async()=>({elements:[
    {type:'node',id:123,lat:34.043,lon:-118.483,tags:{name:'Museum <markup>',tourism:'museum'}},
    {type:'way',id:456,center:{lat:34.042,lon:-118.482},tags:{name:'Local gallery',tourism:'gallery'}},
    {type:'node',id:123,lat:34.043,lon:-118.483,tags:{name:'duplicate'}}
   ]})};
  }
 };
 vm.runInNewContext(js,sandbox,{timeout:2000});
 return {stage,routePanel,to,from,routeTab,map,events,mapEvents,win,fetches,markers,panes};
}

test('Discovery loads only on the full Map, not the interactive Studio preview',()=>{
 const preview=harness('?embed=1&preview=1');
 assert.equal(preview.stage.children.length,0);
 assert.equal(preview.fetches.length,0);
 assert.equal(preview.win.BigLWAMapDiscover,undefined);
 assert.match(mapHtml,/map-lwa-discovery-20261114\.js\?v=20261114-inapp-desk-v2/);
 assert.match(mapHtml,/map-lwa-discovery-20261114\.css\?v=20261114-public-neighborhood-v1/);
});

test('Public POI lookup requires user action and a close neighborhood zoom',async()=>{
 const env=harness('?embed=1',9);
 assert.equal(env.fetches.length,0,'No automatic nearby request');
 assert.equal(env.stage.children.length,1,'One overlay, not a second map');
 await env.win.BigLWAMapDiscover.load('shops');
 assert.equal(env.fetches.length,0,'World/city-level map is never sent to the POI service');
 assert.match(env.stage.children[0].children[3].textContent,/Zoom closer/);
 env.map.zoom=14;
 await env.win.BigLWAMapDiscover.load('landmarks');
 assert.equal(env.fetches.length,1);
 assert.equal(env.fetches[0].url,'https://overpass-api.de/api/interpreter');
 const payload=new URLSearchParams(env.fetches[0].options.body).get('data');
 assert.match(payload,/\[timeout:12\]/);
 assert.match(payload,/nwr\["tourism"~"\^\(museum\|attraction/);
 assert.match(payload,/out center 140/);
 assert.equal(env.markers.length,2,'Duplicate OSM item removed');
 assert.equal(env.markers[0].popup.children[0].textContent,'Museum <markup>','Untrusted names remain text');
 await env.win.BigLWAMapDiscover.load('landmarks');
 assert.equal(env.fetches.length,1,'Ten-minute cache avoids repeated requests');
});

test('Marker trip selection keeps planning in BIG LWA with no immediate external ride or delivery tabs',async()=>{
 const env=harness();
 await env.win.BigLWAMapDiscover.load('landmarks');
 const marker=env.markers[0],popup=marker.popup;
 const actions=popup.children.find(c=>c.className==='map-discover-popup-actions');
 actions.children[0].events.click();
 assert.equal(env.to.value,'34.043000, -118.483000');
 assert.equal(env.routeTab.focused,undefined);
 assert.match(env.stage.children[0].children[3].textContent,/Destination selected/);
 assert(!env.routePanel.children.some(x=>x.id==='mapServiceLinks'),
  'Place lookup must not silently create third-party booking links');
 assert.doesNotMatch(js,/target='_blank'/,'No ride/provider links open external tabs from the discovery widget');
 assert.equal(env.fetches.length,1,'POI lookup never makes provider price or delivery requests');
});

test('Presentation keeps POI layers independent of private pins and prevents map reflow',()=>{
 assert.match(css,/#mapDiscover|\.map-discover\{/);
 assert.match(css,/position:absolute/);
 assert.match(css,/body:not\(\.preview\) \.map-discover/);
 assert.match(js,/if\(qs.has\('preview'\)/);
 assert.doesNotMatch(js,/navigator\.geolocation|getCurrentPosition|watchPosition/);
 assert.doesNotMatch(js,/biglwaMapPins|pinForm\.requestSubmit/);
 assert.match(js,/MAX_MARKERS=80/);
 assert.match(js,/rateLimitedUntil=Date\.now\(\)\+30000/);
});
