import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
const require=createRequire(import.meta.url),{JSDOM}=require('jsdom');
const read=path=>readFileSync(new URL('./'+path,import.meta.url),'utf8');
const discoveryJs=read('map-lwa-discovery-20261114.js');
const purposesJs=read('map-purposes-20261115.js');
const focusedJs=read('map-focused.js');
const focusedCss=read('map-focused.css');
const purposesCss=read('map-purposes-20261115.css');
const mapHtml=read('map-app.html');

function harness(fromValue=''){
 const events={},mapEvents={},fetches=[],markers=[],panes={};
 const node=(tag='div')=>({
  tag,className:'',dataset:{},children:[],events:{},style:{},href:'',
  textContent:'',hidden:false,value:'',clicks:0,
  append(...items){this.children.push(...items)},
  appendChild(item){this.children.push(item);return item},
  replaceChildren(...items){this.children=items},
  setAttribute(key,value){this[key]=value},
  addEventListener(key,cb){this.events[key]=cb},
  focus(){this.focused=true},click(){this.clicks++;this.events.click?.()},
  querySelector(){return null}
 });
 const stage=node(),to=node('input'),from=node('input'),routeTab=node('button'),plan=node('button');
 from.value=fromValue;
 panes.mapTripTo=to;panes.mapTripFrom=from;panes.mapTabplan=routeTab;panes.mapTripPlan=plan;
 const map={
  zoom:14,lat:34.0451,lng:-118.4862,
  getZoom(){return this.zoom},getCenter(){return {lat:this.lat,lng:this.lng}},
  on(key,cb){mapEvents[key]=cb},setView(){},removeLayer(){}
 };
 const L={layerGroup:()=>({addTo(){return this}}),divIcon:obj=>obj,
  marker:([lat,lng])=>{const marker={lat,lng,addTo(){markers.push(this);return this},
   getLatLng(){return {lat:this.lat,lng:this.lng}},bindPopup(p){this.popup=p;return this},
   openPopup(){},closePopup(){}};return marker;}};
 const win={BigLWAMapBridge:{map,L},addEventListener(key,cb){events[key]=cb}};
 win.parent=win;
 const document={querySelector:key=>key==='.map-stage'?stage:null,getElementById:key=>panes[key]||null,createElement:node};
 const sandbox={window:win,document,location:{search:'?embed=1'},URL,URLSearchParams,AbortController,
  setTimeout,clearTimeout,console,Math,Date,fetch:async(url,options)=>{
   fetches.push({url,options});return {ok:true,status:200,json:async()=>({elements:[
    {type:'node',id:123,lat:34.043,lon:-118.483,tags:{name:'Corner cafe',shop:'convenience'}},
    {type:'node',id:456,lat:34.044,lon:-118.482,tags:{name:'Museum',tourism:'museum'}}
   ]})};
  }};
 vm.runInNewContext(discoveryJs,sandbox,{timeout:2000});
 return {stage,plan,map,win,fetches,markers,status:()=>stage.children[0].children[3]};
}

test('Auto is one opt-in nearby layer covering stores, cafés and mapped locations',async()=>{
 const env=harness();
 assert.match(discoveryJs,/auto:\{label:'Nearby places',icon:'⌖',tags:\[/);
 assert.match(discoveryJs,/let bridge=null,active='auto'/);
 await env.win.BigLWAMapDiscover.load('auto');
 assert.equal(env.fetches.length,1);
 const payload=new URLSearchParams(env.fetches[0].options.body).get('data');
 for(const pattern of [
  /nwr\["name"\]\["shop"\]/,
  /nwr\["name"\]\["amenity"~"\^\(restaurant\|cafe/,
  /nwr\["name"\]\["tourism"~"\^\(museum/,
  /nwr\["name"\]\["place"~"\^\(neighbourhood/
 ])assert.match(payload,pattern);
 assert.match(env.status().textContent,/mapped stores, cafés and places nearby/);
});

test('Choosing a mapped place with a start point plans the trip and shows estimates',async()=>{
 const env=harness('34.000000, -118.000000');
 await env.win.BigLWAMapDiscover.load('auto');
 const actions=env.markers[0].popup.children.find(c=>c.className==='map-discover-popup-actions');
 actions.children[0].click();
 assert.equal(env.plan.clicks,1,'Fare/route planning runs from the place lookup');
 assert.match(env.status().textContent,/ride estimates updated/);
 const withoutStart=harness();
 await withoutStart.win.BigLWAMapDiscover.load('auto');
 const secondAction=withoutStart.markers[0].popup.children.find(c=>c.className==='map-discover-popup-actions');
 secondAction.children[0].click();
 assert.equal(withoutStart.plan.clicks,0,'No fake plan without a starting point');
 assert.match(withoutStart.status().textContent,/Choose a starting point/);
});

test('Places purpose reveals the existing panel and marks nearby places automatically',()=>{
 const w=new JSDOM(read('map-app.html'),{url:'https://biglwa.com/map-app.html',runScripts:'outside-only'}).window;
 w.ResizeObserver=class{observe(){}};w.matchMedia=()=>({matches:false,addEventListener(){}});
 w.HTMLElement.prototype.scrollIntoView=function(){};
 w.eval(read('map-lwa-experience-20261113.js'));
 w.eval(read('map-lwa-navigate-20261113.js'));
 const discover=w.document.createElement('section');discover.id='mapDiscover';
 w.document.querySelector('.map-stage').append(discover);
 w.eval(focusedJs);
 assert.equal(discover.hidden,true,'Focused map still keeps discovery out of the way by default');
 let loaded='';w.BigLWAMapDiscover={load:key=>{loaded=key}};
 w.eval(purposesJs);
 w.document.querySelector('[data-map-purpose="places"]').click();
 assert.equal(discover.hidden,false,'Places purpose restores the existing panel');
 assert.equal(loaded,'auto','Places purpose marks the combined nearby layer');
 w.close();
});

test('Purpose rail, mode buttons and toolbar fit one compact line or auto dropdown',()=>{
 assert.match(focusedCss,/grid-template-columns:repeat\(6,minmax\(0,1fr\)\)!important/);
 assert.match(focusedCss,/\.map-purpose-select/);
 assert.match(focusedCss,/@media\(max-width:980px\)\{[^}]*map-purpose-buttons\{display:none!important\}/);
 assert.match(focusedCss,/map-side>\.toolbar\{[^}]*flex-wrap:nowrap!important;overflow-x:auto!important/);
 assert.match(purposesCss,/\.map-side \.map-purpose-buttons\{grid-template-columns:repeat\(6,minmax\(0,1fr\)\)!important/);
 assert.match(focusedJs,/biglwa:map-discover-open/);
 assert.match(purposesJs,/BigLWAMapDiscover\?\.load\?\.\('auto'\)/);
});

test('Map cache-bust tokens keep earlier locked assets and add the places build',()=>{
 const required=[
  '/map-lwa-discovery-20261114.js?v=20261114-inapp-desk-v2',
  '/map-lwa-discovery-20261114.css?v=20261114-public-neighborhood-v1',
  '/map-transport-hub-20261114.js?v=20261118-ride-estimates-v1',
  '/map-transport-hub-20261114.css?v=20261118-ride-estimates-v1'
 ];
 for(const token of required)assert(mapHtml.includes(token),token+' preserved');
 assert.equal(mapHtml.split('places=20261118-1').length-1,6,'Six changed map assets are cache-busted once');
 assert.match(mapHtml,/map-lwa-discovery-20261114\.js\?v=20261114-inapp-desk-v2[^\s<>]*&places=20261118-1/);
 assert.match(mapHtml,/map-focused\.js\?thumbs=20261117-2&v=20261118-live-guide-v1[^\s<>]*&places=20261118-1/);
});
