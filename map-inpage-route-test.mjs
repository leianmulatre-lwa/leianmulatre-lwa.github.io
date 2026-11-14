import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=path=>readFileSync(new URL('./'+path,import.meta.url),'utf8');
const extras=read('lwazi-discovery-extras.js'),router=read('map-lwa-router-20261113.js');
const map=read('map-app.html'),studio=read('module-pages.js');
function encode6(points){
 let last=[0,0],result='';
 for(const p of points){
  for(let i=0;i<2;i++){
   const v=Math.round(p[i]*1e6),diff=v-last[i];last[i]=v;
   let delta=diff<0?~(diff<<1):diff<<1;
   while(delta>=0x20){result+=String.fromCharCode((0x20|(delta&0x1f))+63);delta>>>=5;}
   result+=String.fromCharCode(delta+63);
  }
 }
 return result;
}
test('Lwazi form submit renders inside map iframe, never opens Google Maps',()=>{
 const handlers=new Map(),messages=[];
 const frame={contentDocument:{readyState:'complete'},
  contentWindow:{postMessage:(message,origin)=>messages.push({message,origin})}};
 const stage={classList:{add:className=>assert.equal(className,'bl-lwazi-route-active')},
  querySelector:()=>frame};
 const note={textContent:''};
 const card={querySelector:()=>stage};
 const form={closest:selector=>selector==='.bl-lwazi-map-card'?card:null,
  parentElement:{querySelector:()=>note}};
 const panel={dataset:{},addEventListener:(type,fn)=>handlers.set(type,fn),
  contains:()=>true,querySelector:()=>null};
 const window={addEventListener:(type,fn)=>handlers.set('window:'+type,fn)};
 const document={querySelectorAll:()=>[]};
 class MockFormData {get(key){return {origin:'Santa Monica, CA',destination:'UCLA',mode:'bicycling'}[key]||'';}}
 vm.runInNewContext(extras,{window,document,URL,FormData:MockFormData,
  location:{origin:'https://biglwa.com'},navigator:{},console,setTimeout});
 window.BigLWADiscoveryExtras.attach(panel);
 let prevented=false;
 handlers.get('submit')({target:{closest:()=>form},preventDefault:()=>{prevented=true;}});
 assert(prevented);assert.equal(messages.length,1);
 assert.equal(messages[0].origin,'https://biglwa.com');
 assert.deepEqual(JSON.parse(JSON.stringify(messages[0].message)),{
  type:'biglwa:lwazi-map-trip',from:'Santa Monica, CA',to:'UCLA',mode:'bicycling'});
 assert.match(note.textContent,/inside BIG LWA/);
 assert.doesNotMatch(extras,/window\.open\(/);
 assert.doesNotMatch(extras,/google\.com\/maps/);
});
test('community route response decodes 6-decimal road geometry without inventing traffic',async()=>{
 const points=[[34.019,-118.491],[34.026,-118.489],[34.032,-118.480]];
 const encoded=encode6(points),requests=[];
 const window={};
 const location={search:'',origin:'https://biglwa.com'};
 const fetch=async(url,options)=>{
  requests.push({url:String(url),headers:options.headers});
  return {ok:true,json:async()=>({trip:{summary:{time:540,length:2.4},
   legs:[{shape:encoded,maneuvers:[{instruction:'Turn left.',verbal_pre_transition_instruction:'Turn left in 100 meters.',begin_shape_index:1}]}]}})};
 };
 vm.runInNewContext(router,{window,location,URL,URLSearchParams,fetch,
  AbortController,Date,Math,Map,Number,Promise,setTimeout,clearTimeout,console});
 assert.equal(typeof window.BigLWAMapRouteProvider?.getRoute,'function');
 const params={origin:{lat:34.019,lng:-118.491},destination:{lat:34.032,lng:-118.480},mode:'bicycling'};
 const value=await window.BigLWAMapRouteProvider.getRoute(params);
 assert.equal(value.distanceLabel,'2.4 km');assert.equal(value.durationMinutes,9);
 assert.equal(value.trafficAware,false);
 assert.equal(value.maneuvers[0].instruction,'Turn left.');
 assert.equal(value.maneuvers[0].verbal,'Turn left in 100 meters.');
 assert.equal(value.maneuvers[0].shapeIndex,1);
 value.points.forEach((p,i)=>p.forEach((v,k)=>assert.ok(Math.abs(v-points[i][k])<.000001)));
 assert.match(requests[0].url,/valhalla1\.openstreetmap\.de\/route/);
 const json=JSON.parse(new URL(requests[0].url).searchParams.get('json'));
 assert.equal(json.costing,'bicycle');assert.equal(requests[0].headers['X-Client-Id'],'biglwa.com');
 await window.BigLWAMapRouteProvider.getRoute(params);
 assert.equal(requests.length,1,'recent identical route uses in-memory cache');
});
test('Map style source visible and never silently retains legacy default',()=>{
 assert.match(map,/biglwaMapOpenFreeMapOnboarded/);
 assert.match(map,/mapProviderIndicator/);
 assert.match(map,/OpenFreeMap vector unavailable/);
 assert.match(map,/map-lwa-router-20261113\.js/);
 assert.match(studio,/20261113-inpage-navigation-go-5/);
 assert.match(extras,/20261113-stay-2/);
});
