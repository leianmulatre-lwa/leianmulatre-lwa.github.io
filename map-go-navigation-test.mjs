import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('./map-lwa-navigate-20261113.js',import.meta.url),'utf8');
function runtime(){
 const listeners=new Map(),nodes=new Map(),callbacks=new Map();
 const make=(id='')=>({
  id,hidden:false,disabled:false,textContent:'',innerHTML:'',value:'',
  children:[],className:'',attrs:{},
  addEventListener(type,fn){const k=id+':'+type;callbacks.set(k,fn)},
  append(...els){this.children.push(...els)},
  replaceChildren(...els){this.children=[...els]},
  querySelector(key){return nodes.get(key)==='none'?null:nodes.get(key)||make(key)},
  setAttribute(key,value){this.attrs[key]=value},
  getAttribute(key){return this.attrs[key]}
 });
 const planner=make('mapTripPlanner'),mapEl=make('map');
 const ids=['mapNavGo','mapNavStop','mapNavVoice','mapNavSpeakDestination','mapNavReplan',
  'mapNavStatus','mapNavDistance','mapNavNextText','mapNavTurns','mapTripFrom','mapTripPlan','mapTripTo'];
 ids.forEach(id=>nodes.set(id,make(id)));
 const nextBox=make('.map-nav-next');nodes.set('.map-nav-next',nextBox);
 let watchCallback,watchError,watchCount=0,cleared=[];
 const navigator={geolocation:{
  watchPosition(success,error){watchCallback=success;watchError=error;watchCount++;return 88},
  clearWatch(id){cleared.push(id)}
 }};
 const speech={spoken:[],cancel(){},speak(u){this.spoken.push(u.text)}};
 const window={
  BigLWAMapBridge:{map:{
   panTo:()=>{},removeLayer:()=>{}
  },L:{circleMarker:()=>({addTo(){return this},bindTooltip(){return this},setLatLng(){}})}},
  SpeechSynthesisUtterance:class{constructor(text){this.text=text}},
  speechSynthesis:speech,
  addEventListener(name,fn){listeners.set(name,fn)}
 };
 const document={
  getElementById(id){if(id==='mapTripPlanner')return planner;if(id==='map')return mapEl;
   if(id==='mapNavControls')return null;return nodes.get(id)||null;},
  createElement(name){const node=make(name);if(name==='section')node.querySelector=key=>nodes.get(key)||nextBox;return node;}
 };
 const context={window,document,navigator,URLSearchParams,location:{search:''},
  Math,Number,Array,Date,Map,Set,Event,console};
 vm.runInNewContext(source,context);
 return {window,nodes,callbacks,listeners,navigator,speech,
  fix:()=>watchCallback,errors:()=>watchError,watchCount:()=>watchCount,cleared};
}
test('Go stays disabled until a genuine route with maneuver geometry is ready',()=>{
 const r=runtime(),go=r.nodes.get('mapNavGo');
 assert.equal(go.disabled,true);
 assert.equal(r.watchCount(),0);
 assert.equal(r.nodes.get('mapNavSpeakDestination').hidden,true,'recognition missing is hidden');
 const reset=r.listeners.get('biglwa:map-navigation-reset');
 r.listeners.get('biglwa:map-navigation-route')({detail:{
  mode:'walking',points:[[34,-118],[34.0005,-118]],maneuvers:[{instruction:'Head east.',verbal:'Head east.',shapeIndex:0}],
  distanceLabel:'0.5 km'
 }});
 assert.equal(go.disabled,false);
 assert.equal(r.watchCount(),0,'no GPS before explicit Go click');
 reset();
 assert.equal(go.disabled,true);
});
test('Go requests GPS only on click, Stop ends watch, voice is opt-in',()=>{
 const r=runtime();
 r.listeners.get('biglwa:map-navigation-route')({detail:{
  mode:'bicycling',points:[[34,-118],[34.0004,-118],[34.0009,-118]],
  maneuvers:[{instruction:'Turn right.',verbal:'Turn right soon.',shapeIndex:1}],
  distanceLabel:'1 km'
 }});
 r.callbacks.get('mapNavGo:click')();
 assert.equal(r.watchCount(),1);
 assert.equal(r.nodes.get('mapNavStop').hidden,false);
 assert.equal(r.speech.spoken.length,0);
 r.callbacks.get('mapNavVoice:click')();
 assert(r.speech.spoken.length>=1);
 const fix=r.fix();assert.equal(typeof fix,'function');
 fix({coords:{latitude:34,longitude:-118,accuracy:12}});
 assert.match(r.nodes.get('mapNavNextText').textContent,/Turn right/);
 r.callbacks.get('mapNavStop:click')();
 assert.deepEqual(r.cleared,[88]);
 assert.equal(r.nodes.get('mapNavGo').hidden,false);
});
test('navigation geometry finds the closest road segment without a server call',()=>{
 const r=runtime();
 const p=r.window.BigLWAMapNavigationGeometry.onPath(
  [[34,-118],[34.001,-118],[34.002,-118]],[34.0011,-118.00001]);
 assert(p&&p.index>0.9&&p.index<1.2);
 assert(p.distance<20);
 assert(r.window.BigLWAMapNavigationGeometry.metersBetween([34,-118],[34.001,-118])>100);
});
