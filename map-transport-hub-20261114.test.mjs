import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('./'+path,import.meta.url),'utf8');
const js=read('map-transport-hub-20261114.js');
const css=read('map-transport-hub-20261114.css');
const html=read('map-app.html');

function harness(query='?embed=1'){
 const events={},calls={planning:0,navigation:0,food:0},nodes=[];
 const node=(tag='div')=>{
  const n={tag,children:[],events:{},attrs:{},dataset:{},style:{},hidden:false,textContent:'',
   parentNode:null,clicked:0,disabled:false,
   append(...items){for(const item of items){this.children.push(item);item.parentNode=this}},
   replaceChildren(...items){this.children=[];this.append(...items)},
   insertBefore(item,before){
    const position=this.children.indexOf(before);
    if(position<0)throw Error('Invalid insertBefore reference');
    this.children.splice(position,0,item);item.parentNode=this
   },
   setAttribute(k,v){this.attrs[k]=String(v)},
   getAttribute(k){return this.attrs[k]??null},
   addEventListener(k,cb){this.events[k]=cb},
   click(){this.clicked++;this.events.click?.({preventDefault(){}})},
   focus(){this.focused=true},
   scrollIntoView(){this.scrolled=true},
   closest(){return this.label||null},
   querySelector(){return null},
   querySelectorAll(){return []}
  };
  nodes.push(n);return n;
 };
 const planner=node('section'),fields=node('div'),head=node('div'),title=node('h2');
 head.querySelector=selector=>selector==='h2'?title:null;
 const modeSwitch=node('div');
 const from=node('input'),to=node('input'),plan=node('button'),navGo=node('button');
 from.label={firstChild:{nodeType:3,textContent:'From'}};
 to.label={firstChild:{nodeType:3,textContent:'To'}};
 from.value='';to.value='';
 plan.events.click=()=>{calls.planning++};
 navGo.disabled=true;
 navGo.events.click=()=>{calls.navigation++};
 const bike=node('button'),driving=node('button');
 bike.dataset.mapTravel='bicycling';driving.dataset.mapTravel='driving';
 bike.setAttribute('aria-pressed','true');
 driving.setAttribute('aria-pressed','false');
 const travelButtons=[bike,driving];
 driving.events.click=()=>{
  bike.setAttribute('aria-pressed','false');
  driving.setAttribute('aria-pressed','true');
  events['biglwa:map-navigation-reset']?.({});
 };
 planner.querySelector=selector=>({
  '.map-trip-fields':fields,'.map-plan-head h2':title,'.map-mode-switch':modeSwitch
 }[selector]||null);
 planner.querySelectorAll=selector=>selector==='[data-map-travel]'?travelButtons:[];
 planner.append(head,fields,modeSwitch);
 const stage=node('section');
 const elements={
  mapTripPlanner:planner,mapTripFrom:from,mapTripTo:to,mapTripPlan:plan,mapNavGo:navGo
 };
 const doc={
  getElementById:id=>elements[id]||null,
  querySelector:sel=>sel==='.map-stage'?stage:null,
  createElement:node
 };
 const win={addEventListener:(type,cb)=>{events[type]=cb},
  BigLWAMapDiscover:{load:kind=>{if(kind==='food')calls.food++}}
 };
 win.parent=win;
 const sandbox={window:win,document:doc,location:{search:query},URL,URLSearchParams,
  Array,Number,Math,String,Object,console};
 vm.runInNewContext(js,sandbox,{timeout:2500});
 const services=planner.children.find(x=>x.id==='mapServiceLinks');
 const byClass=(parent,klass)=>parent?.children.find(x=>x.className===klass);
 return {win,planner,fields,services,events,calls,nodes,stage,navGo,from,to,byClass,driving};
}

test('Preview skips transport desk; full Map mounts provider tabs without external content',()=>{
 const preview=harness('?embed=1&preview=1');
 assert.equal(preview.win.BigLWATransportHub,undefined);
 assert.equal(preview.services,undefined);
 const e=harness();
 assert(e.services,'In-page transport options present');
 assert.equal(e.calls.planning,0);
 assert.equal(e.calls.food,0);
 assert.equal(e.driving.getAttribute('aria-pressed'),'true');
 assert.match(js,/if\(qs.has\('preview'\)/);
 assert.match(html,/map-transport-hub-20261114\.js\?v=20261118-ride-estimates-v1/);
 assert.match(html,/map-transport-hub-20261114\.css\?v=20261118-ride-estimates-v1/);
 assert(html.indexOf('map-lwa-discovery-20261114.js')<html.indexOf('map-transport-hub-20261114.js'));
});

test('Provider choices and Ride/Food/Courier tabs change in-page only; no automatic provider requests',()=>{
 const e=harness(),api=e.win.BigLWATransportHub;
 assert.equal(api.getMode(),'rides');
 const providers=e.byClass(e.services,'map-provider-list');
 assert.equal(providers.children.length,3);
 providers.children[2].click();
 assert.equal(api.getSelected(),'apple');
 providers.children[1].click();
 assert.equal(api.getSelected(),'lyft');
 assert.equal(e.calls.planning,0);
 assert.equal(e.calls.food,0);
 api.chooseMode('food');
 assert.equal(api.getMode(),'food');
 assert.equal(providers.children.length,3);
 assert.equal(api.getSelected(),'ubereats');
 const info=e.byClass(e.services,'map-provider-info');
 const actions=e.byClass(info,'map-provider-actions');
 const browse=actions.children.find(x=>x.textContent==='Discover restaurants on map');
 browse.click();
 assert.equal(e.calls.food,1,'Food lookup begins only after user action');
 api.chooseMode('courier');
 assert.equal(providers.children.length,2);
 assert.match(e.byClass(info,'map-provider-route').textContent,/not connected/i);
 assert.equal(api.getSelected(),'uberdirect');
 assert.equal(e.calls.planning,0);
 assert.doesNotMatch(js,/fetch\s*\(|XMLHttpRequest|navigator\.geolocation/,'Provider selection never invokes unapproved APIs or GPS');
});

test('Rides use existing road route and foreground navigation without inventing fares or ETAs',()=>{
 const e=harness();
 const info=e.byClass(e.services,'map-provider-info');
 const actions=e.byClass(info,'map-provider-actions');
 const route=e.byClass(info,'map-provider-route');
 const explore=actions.children.find(x=>x.textContent==='Explore route');
 const go=actions.children.find(x=>x.textContent==='Start BIG LWA navigation');
 explore.click();
 assert.equal(e.from.focused,true,'Pickup is required before planning');
 e.from.value='Santa Monica';e.to.value='Westwood';
 explore.click();
 assert.equal(e.calls.planning,1);
 go.click();
 assert.equal(e.calls.navigation,0,'Navigation cannot start without an actual route');
 e.navGo.disabled=false;
 e.events['biglwa:map-navigation-route']({detail:{
  origin:{lat:34.02,lng:-118.48},destination:{lat:34.06,lng:-118.44},
  distanceLabel:'5.6 mi',durationMinutes:18,mode:'driving'
 }});
 assert.match(route.textContent,/about 18 min/);
 assert.match(route.textContent,/No live traffic|no live traffic/);
 assert.match(route.textContent,/Not a provider fare/);
 go.click();
 assert.equal(e.calls.navigation,1,'The explicit Go button delegates to real map navigation');
 e.events['biglwa:map-navigation-reset']({});
 assert.match(route.textContent,/Live fares and driver ETAs require provider approval/);
});

test('Ride cost ranges are individual BIG LWA models with quote links and clear caveats',()=>{
 const e=harness(),api=e.win.BigLWATransportHub;
 assert.equal(api.getEstimates().length,0);
 e.events['biglwa:map-navigation-route']({detail:{
  origin:{lat:34.02,lng:-118.48},destination:{lat:34.06,lng:-118.44},
  distanceLabel:'5.6 km',durationMinutes:18,mode:'driving'
 }});
 const rows=api.getEstimates();
 assert.equal(rows.map(r=>r.id).join(','),'uber,lyft,waymo');
 assert(rows.every(r=>/^\$\d+–\$\d+$/.test(r.range)));
 assert(rows.every(r=>/Illustrative BIG LWA planning estimate/i.test(r.disclaimer)));
 assert.notEqual(rows[0].range,rows[1].range,'Each provider has its own labelled model');
 assert.match(rows[0].quoteUrl,/^https:\/\/m\.uber\.com\/ul\//);
 assert.match(rows[1].quoteUrl,/^https:\/\/ride\.lyft\.com/);
 assert.equal(rows[2].quoteUrl,'https://waymo.com/');
 assert.match(rows[2].note,/No public quote API/);
 const panel=e.byClass(e.services,'map-fare-estimates');
 const list=e.byClass(panel,'map-fare-estimate-list');
 assert.equal(list.children.length,3);
 assert.match(e.byClass(panel,'map-fare-estimates-note').textContent,/Not a provider quote/);
 api.openRideOptions('lyft');
 assert.equal(api.getSelected(),'lyft');
 assert.equal(e.services.open,true);
 assert.equal(e.services.scrolled,true);
 e.events['biglwa:map-navigation-reset']({});
 assert.equal(api.getEstimates().length,0);
});

test('Only the final provider handoff navigates away, in the same tab, with optional route coordinates',()=>{
 const e=harness(),api=e.win.BigLWATransportHub;
 const info=e.byClass(e.services,'map-provider-info');
 const actions=e.byClass(info,'map-provider-actions');
 const final=actions.children.find(x=>x.tag==='a');
 assert(final,'A final provider link is visible after provider selection');
 assert.equal(final.target,'_top','No new tabs or third-party iframes');
 assert.equal(final.href,'https://m.uber.com/','Provider remains home until the user chooses handoff');
 e.events['biglwa:map-navigation-route']({detail:{
  origin:{lat:34.01,lng:-118.49},destination:{lat:34.04,lng:-118.41},
  distanceLabel:'7 km',durationMinutes:16
 }});
 assert.equal(final.href,'https://m.uber.com/','Coordinates are not exposed before deliberate handoff');
 final.click();
 assert.match(final.href,/^https:\/\/m\.uber\.com\/ul\/\?/);
 const params=new URL(final.href).searchParams;
 assert.equal(params.get('pickup[latitude]'),'34.01');
 assert.equal(params.get('dropoff[longitude]'),'-118.41');
 assert.equal(params.get('action'),'setPickup');
 api.chooseMode('food');
 const another=actions.children.find(x=>x.tag==='a');
 assert.equal(another.href,'https://www.ubereats.com/');
 assert.equal(another.target,'_top');
 assert.equal(e.calls.planning,0);
 assert.equal(e.calls.food,0);
});

test('Sleek desktop/mobile and dark mode remain first-party, accessible and non-clipped',()=>{
 assert.match(css,/\.map-transport-switcher\{/);
 assert.match(css,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(css,/\.map-provider-list\{/);
 assert.match(css,/body\.night-mode\.embedded\.map-workspace-split/);
 assert.match(css,/body\.dark-mode\.embedded\.map-workspace-split/);
 assert.match(css,/@media\(max-width:640px\)/);
 assert.match(css,/:focus-visible/);
 assert.match(js,/setAttribute\('aria-pressed',String\(p\.id===selected\)\)/);
 assert.match(js,/final\.target='_top'/);
 assert.doesNotMatch(js,/target='_blank'|<iframe|srcdoc/);
});
