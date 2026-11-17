/* Independent pitched MapLibre scene: Leaflet overlays stay in their own 2D projection. */
(()=>{
'use strict';if(new URLSearchParams(location.search).has('preview'))return;
let scene=null,container=null,notice=null,route=null,token=0,watchdog;
const stage=document.querySelector('.map-stage');if(!stage)return;
function close(notify=true){token++;clearTimeout(watchdog);if(scene){const c=scene.getCenter();window.BigLWAMapBridge?.map.setView([c.lat,c.lng],scene.getZoom());scene.remove();}scene=null;container?.remove();container=null;notice?.remove();notice=null;if(notify)window.dispatchEvent(new Event('biglwa:map-3d-closed'));}
function routeData(){const features=[];if(route?.points?.length){features.push({type:'Feature',properties:{},geometry:{type:'LineString',coordinates:route.points.map(p=>[p[1],p[0]])}});for(const [i,p] of [route.points[0],route.points.at(-1)].entries())features.push({type:'Feature',properties:{label:i?'B':'A'},geometry:{type:'Point',coordinates:[p[1],p[0]]}});}return {type:'FeatureCollection',features};}
async function open(){
 close(false);const current=++token;
 notice=document.createElement('div');notice.className='map-3d-notice';notice.setAttribute('role','status');notice.textContent='Loading 3D buildings…';stage.append(notice);
 const fail=()=>{if(current!==token)return;close();const message=document.createElement('p');message.className='map-3d-notice';message.setAttribute('role','status');message.textContent='3D is unavailable on this device or connection. Your 2D map is still ready.';const dismiss=document.createElement('button');dismiss.textContent='Dismiss';dismiss.onclick=()=>message.remove();message.append(dismiss);stage.append(message);};
 watchdog=setTimeout(fail,18000);
 try{
  if(!window.maplibregl)await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/maplibre-gl@5.24.1/dist/maplibre-gl.js';s.onload=resolve;s.onerror=reject;document.head.append(s);});
  if(current!==token)return;
  if(!window.maplibregl.supported())throw Error('WebGL unavailable');
  const map=window.BigLWAMapBridge?.map;if(!map)throw Error('Map loading');
  const center=map.getCenter();container=document.createElement('div');container.className='map-3d-canvas';stage.append(container);
  scene=new maplibregl.Map({container,style:'https://tiles.openfreemap.org/styles/liberty',center:[center.lng,center.lat],zoom:Math.max(15,map.getZoom()),pitch:60,bearing:-15,attributionControl:true});
  scene.addControl(new maplibregl.NavigationControl({visualizePitch:true}),'top-left');
  scene.once('load',()=>{
   if(current!==token)return;
   try{
    const style=scene.getStyle(),building=style.layers.find(l=>l['source-layer']==='building');
    if(!building)throw Error('Building source missing');
    for(const layer of style.layers)if(layer.type==='fill-extrusion'&&layer['source-layer']==='building')scene.setLayoutProperty(layer.id,'visibility','none');
    scene.addLayer({id:'lwa-buildings-3d',type:'fill-extrusion',source:building.source,'source-layer':'building',minzoom:14,paint:{'fill-extrusion-color':'#c4afa0','fill-extrusion-height':['coalesce',['get','render_height'],['get','height'],3],'fill-extrusion-base':['coalesce',['get','render_min_height'],0],'fill-extrusion-opacity':.85}});
    scene.addSource('lwa-route',{type:'geojson',data:routeData()});
    scene.addLayer({id:'lwa-route-line',type:'line',source:'lwa-route',filter:['==',['geometry-type'],'LineString'],paint:{'line-color':'#9b3952','line-width':6}});
    scene.addLayer({id:'lwa-route-pins',type:'circle',source:'lwa-route',filter:['==',['geometry-type'],'Point'],paint:{'circle-radius':12,'circle-color':'#9b3952','circle-stroke-color':'white','circle-stroke-width':2}});
    scene.addLayer({id:'lwa-route-labels',type:'symbol',source:'lwa-route',filter:['==',['geometry-type'],'Point'],layout:{'text-field':['get','label'],'text-size':13},paint:{'text-color':'white'}});
    clearTimeout(watchdog);notice.textContent='3D buildings · drag to explore, Ctrl + drag to tilt. Heights depend on mapped data. Pins, live vehicles and GPS navigation use 2D.';
   }catch{fail();}
  });
 }catch{fail();}
}
window.BigLWAMap3D={open,close};
window.addEventListener('biglwa:map-navigation-route',e=>{route=e.detail;if(scene?.getSource('lwa-route'))scene.getSource('lwa-route').setData(routeData());});
window.addEventListener('biglwa:map-navigation-reset',()=>{route=null;close();});
document.getElementById('mapNavGo')?.addEventListener('click',close);
document.getElementById('mapPurposeRail')?.addEventListener('click',close);
document.getElementById('mapActionTabs')?.addEventListener('click',close);
window.addEventListener('pagehide',close);
})();
