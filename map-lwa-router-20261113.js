/* BIG LWA private route viewer and optional OSM/Valhalla community routing.
   Coordinates are sent to geocoding/routing providers only when the person
   submits a route, not on map load. Live traffic/GTFS are not claimed. */
(() => {
 'use strict';
 const query=new URLSearchParams(location.search);
 const isSearchPreview=query.has('preview')&&query.has('lwazi');
 const safePoint=p=>p&&Number.isFinite(+p.lat)&&Number.isFinite(+p.lng)&&
  Math.abs(+p.lat)<=90&&Math.abs(+p.lng)<=180;
 const coordPattern=/^(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)$/;
 const COST={bicycling:'bicycle',walking:'pedestrian',driving:'auto'};
 let budget=0,nextAllowed=0,activePreviewRoute=null,previewSerial=0;
 const memo=new Map();
 const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 function polyline6(shape){
  if(typeof shape!=='string'||shape.length>300000)throw Error('Invalid route geometry');
  const result=[];let lat=0,lng=0,index=0;
  function number(){
   let b,shift=0,value=0;
   do{
    if(index>=shape.length||shift>30)throw Error('Route geometry is incomplete');
    b=shape.charCodeAt(index++)-63;
    value|=(b&0x1f)<<shift;
    shift+=5;
   }while(b>=0x20);
   return value&1?~(value>>1):(value>>1);
  }
  while(index<shape.length){
   lat+=number();lng+=number();
   const point=[lat/1e6,lng/1e6];
   if(!safePoint({lat:point[0],lng:point[1]}))throw Error('Invalid route geometry');
   result.push(point);
   if(result.length>20000)throw Error('Route too detailed to show safely');
  }
  return result;
 }
 async function geocode(term){
  const q=String(term||'').trim().slice(0,160);
  if(!q)throw Error('Enter both your starting point and destination.');
  const match=q.match(coordPattern);
  if(match){
   const p={lat:+match[1],lng:+match[2]};
   if(safePoint(p))return p;
  }
  const url=new URL('https://photon.komoot.io/api');
  url.searchParams.set('q',q);url.searchParams.set('limit','1');
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),9000);
  try{
   const response=await fetch(url,{signal:controller.signal,headers:{Accept:'application/json'}});
   if(!response.ok)throw Error('Place lookup unavailable. Try coordinates or a more specific name.');
   const first=(await response.json())?.features?.[0]?.geometry?.coordinates;
   const p=first&&{lat:Number(first[1]),lng:Number(first[0])};
   if(!safePoint(p))throw Error('No location found for "'+q+'".');
   return p;
  }finally{clearTimeout(timer);}
 }
 async function getRoute({origin,destination,mode}){
  if(!safePoint(origin)||!safePoint(destination))throw Error('Both route points need valid locations.');
  if(mode==='transit')throw Error('Live transit schedules are not connected yet. Try cycling, walking, or driving.');
  if(!COST[mode])throw Error('Unsupported travel mode.');
  const key=[mode,+origin.lat.toFixed(4),+origin.lng.toFixed(4),
   +destination.lat.toFixed(4),+destination.lng.toFixed(4)].join(':');
  const cached=memo.get(key);
  if(cached&&Date.now()-cached.timestamp<300000)return cached.value;
  // The public Valhalla demo is rate-limited. A production route backend
  // should replace this endpoint before launching at large scale.
  if(budget>=20)throw Error('Community routing is temporarily limited. Try again later.');
  const hold=Math.max(0,nextAllowed-Date.now());
  if(hold)await sleep(hold);
  nextAllowed=Date.now()+1300;budget++;
  const request={
   locations:[{lat:+origin.lat,lon:+origin.lng},{lat:+destination.lat,lon:+destination.lng}],
   costing:COST[mode],units:'km',directions_options:{language:'en-US'},
   directions_type:'instructions'
  };
  const url=new URL('https://valhalla1.openstreetmap.de/route');
  url.searchParams.set('json',JSON.stringify(request));
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),13000);
  let response;
  try{
   response=await fetch(url,{signal:controller.signal,
    headers:{Accept:'application/json','X-Client-Id':'biglwa.com'}});
  }catch(error){
   throw Error('Community router is unreachable. Route preview is not a live ETA.');
  }finally{clearTimeout(timer);}
  if(!response.ok)throw Error(response.status===429?
   'Community router is busy. Try again in a little while.':
   'Community router returned '+response.status+'.');
  let data;
  try{data=await response.json();}catch{throw Error('Community router returned an unreadable route.');}
  const legs=data?.trip?.legs||[];
  const shape=legs.flatMap(leg=>polyline6(leg.shape||''));
  const seconds=Number(data?.trip?.summary?.time),km=Number(data?.trip?.summary?.length);
  if(shape.length<2||!Number.isFinite(km)||km<0)throw Error('Community router returned no street geometry.');
  const turns=legs.flatMap(leg=>(leg.maneuvers||[])
   .map(m=>String(m.instruction||'').slice(0,180)).filter(Boolean)).slice(0,20);
  const value={
   points:shape,distanceLabel:(km<10?km.toFixed(1):Math.round(km))+' km',
   durationMinutes:Number.isFinite(seconds)?Math.round(seconds/60):null,
   provider:'Valhalla · OpenStreetMap',trafficAware:false,maneuvers:turns
  };
  memo.set(key,{timestamp:Date.now(),value});
  return value;
 }
 if(!window.BigLWAMapRouteProvider)window.BigLWAMapRouteProvider={getRoute};
 if(!isSearchPreview)return;
 const notice=(message,state='info')=>{
  if(window.parent===window)return;
  try{window.parent.postMessage({
   type:'biglwa:lwazi-route-status',text:String(message).slice(0,450),state
  },location.origin);}catch{}
 };
 const bridgeReady=()=>new Promise((resolve,reject)=>{
  if(window.BigLWAMapBridge?.map)return resolve(window.BigLWAMapBridge);
  const timer=setTimeout(()=>{window.removeEventListener('biglwa:map-ready-local',ready);
   reject(Error('Map is still loading. Try again.'));},14000);
  function ready(){clearTimeout(timer);window.removeEventListener('biglwa:map-ready-local',ready);
   resolve(window.BigLWAMapBridge);}
  window.addEventListener('biglwa:map-ready-local',ready);
 });
 async function showRoute({from,to,mode}){
  const seq=++previewSerial;
  notice('Locating places on BIG LWA…','loading');
  try{
   if(!to)throw Error('Enter a destination to explore.');
   if(!['bicycling','walking','driving','transit'].includes(mode))throw Error('Unsupported travel mode.');
   const [start,end]=await Promise.all([from?geocode(from):Promise.resolve(null),geocode(to)]);
   if(seq!==previewSerial)return;
   const bridge=await bridgeReady();
   if(seq!==previewSerial)return;
   const {map,L}=bridge;
   if(activePreviewRoute){map.removeLayer(activePreviewRoute);activePreviewRoute=null;}
   if(!start){
     activePreviewRoute=L.circleMarker([end.lat,end.lng],{
      color:'#a93352',radius:9,fillColor:'#f7c2ce',fillOpacity:.9
     }).addTo(map);
     map.setView([end.lat,end.lng],14);
     notice('Showing '+to+' on BIG LWA. Add a starting place to draw a route.','success');
     return;
   }
   let info='';
   try{
    notice('Drawing your route on BIG LWA…','loading');
    const route=await getRoute({origin:start,destination:end,mode});
    if(seq!==previewSerial)return;
    activePreviewRoute=L.polyline(route.points,{color:'#ac3455',weight:5,opacity:.96}).addTo(map);
    info=String(route.distanceLabel)+' · '+String(route.durationMinutes)+' min estimated · '+
      route.provider+' · No live traffic';
   }catch(error){
    if(seq!==previewSerial)return;
    activePreviewRoute=L.polyline([[start.lat,start.lng],[end.lat,end.lng]],{
     color:'#ac3455',weight:3,opacity:.9,dashArray:'7 8'}).addTo(map);
    info=(error?.message||'Route service is unavailable.')+
      ' Dashed line shows direction only; not a road route or ETA.';
   }
   map.fitBounds(activePreviewRoute.getBounds(),{padding:[32,32],maxZoom:14});
   notice(info,info.includes('Dashed line')?'warning':'success');
  }catch(error){if(seq===previewSerial)notice(error?.message||'Unable to draw this route.','error');}
 }
 window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==window.parent)return;
  const data=event.data;
  if(!data||data.type!=='biglwa:lwazi-map-trip')return;
  showRoute({
   from:String(data.from||'').slice(0,160),
   to:String(data.to||'').slice(0,160),
   mode:String(data.mode||'bicycling')
  });
 });
})();