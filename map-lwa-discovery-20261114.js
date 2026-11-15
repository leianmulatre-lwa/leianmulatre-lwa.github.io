/* BIG LWA Map · opt-in public-place discovery and quote handoffs.
 * Place metadata: OpenStreetMap via Overpass, only on explicit visitor request.
 * No GPS access, no private pin writes, no fake rideshare or delivery quotes. */
(()=>{
 'use strict';
 const qs=new URLSearchParams(location.search);
 if(qs.has('preview')||(window.parent!==window&&window.parent.__biglwaPublicStorageView))return;
 if(window.BigLWAMapDiscover)return;
 const CATEGORIES={
  shops:{label:'Shops',icon:'🛍',tag:'["shop"]["name"]'},
  food:{label:'Food',icon:'🍜',tag:'["amenity"~"^(restaurant|cafe|fast_food|food_court)$"]["name"]'},
  landmarks:{label:'Landmarks',icon:'🏛',tag:'["tourism"~"^(museum|attraction|gallery|viewpoint|artwork)$"]["name"]'},
  neighborhoods:{label:'Neighborhoods',icon:'🏙',tag:'["place"~"^(neighbourhood|suburb|quarter)$"]["name"]'}
 };
 const CACHE_MS=10*60*1000,MAX_MARKERS=80;
 const memo=new Map();
 let bridge=null,active='landmarks',controller=null,requestId=0,nextRequestAt=0,rateLimitedUntil=0;
 let activeLayer=null,found=[],markerList=[];
 const valid=p=>p&&Number.isFinite(Number(p.lat))&&Number.isFinite(Number(p.lng))&&
  Math.abs(Number(p.lat))<=90&&Math.abs(Number(p.lng))<=180;
 const el=(tag,className,value)=>{
  const node=document.createElement(tag);if(className)node.className=className;
  if(value!=null)node.textContent=value;return node;
 };
 const stage=document.querySelector('.map-stage');
 if(!stage)return;
 const panel=el('section','map-discover');
 panel.id='mapDiscover';panel.setAttribute('aria-label','Explore nearby places');
 const top=el('div','map-discover-heading');
 top.append(el('strong','', 'Explore the neighborhood'),el('span','', 'OSM public places'));
 panel.append(top);
 const choices=el('div','map-discover-choices');
 choices.setAttribute('role','group');choices.setAttribute('aria-label','Place category');
 const buttons={};
 for(const [key,config] of Object.entries(CATEGORIES)){
  const button=el('button','map-discover-chip',config.icon+' '+config.label);
  button.type='button';button.dataset.category=key;
  button.setAttribute('aria-pressed',String(key===active));
  button.addEventListener('click',()=>load(key));
  buttons[key]=button;choices.append(button);
 }
 panel.append(choices);
 const help=el('p','map-discover-help','Choose a category to show places around the visible map center. Map data may be incomplete.');
 const status=el('p','map-discover-status','Zoom to a neighborhood, then choose a category.');
 status.setAttribute('role','status');
 const list=el('div','map-discover-results');
 list.setAttribute('aria-label','Places shown on the map');
 panel.append(help,status,list);
 // Positioned as an overlay, without changing the map or Studio iframe height.
 stage.append(panel);
 // Provider comparison and in-page navigation belong to the dedicated
 // transport hub, not the public-place discovery overlay.
 const setStatus=message=>{status.textContent=message;};
 const setActive=key=>{
  active=key;for(const [name,btn] of Object.entries(buttons))
   btn.setAttribute('aria-pressed',String(name===key));
 };
 function removeMarkers(){
  if(activeLayer&&bridge?.map)bridge.map.removeLayer(activeLayer);
  activeLayer=null;found=[];markerList=[];list.replaceChildren();
 }
 const focus=(index)=>{
  const row=markerList[index];if(!row||!bridge?.map)return;
  const point=row.marker.getLatLng();
  bridge.map.setView(point,Math.max(bridge.map.getZoom(),15),{animate:true});
  row.marker.openPopup();
 };
 function show(rows,key){
  removeMarkers();
  const {map,L}=bridge;
  activeLayer=L.layerGroup().addTo(map);
  found=rows.slice(0,MAX_MARKERS);
  found.forEach((entry,i)=>{
   const config=CATEGORIES[key];
   const icon=L.divIcon({
    className:'map-discovery-icon',
    html:'<span aria-hidden="true">'+config.icon+'</span>',
    iconSize:[31,31],iconAnchor:[15,28],popupAnchor:[0,-25]
   });
   const marker=L.marker([entry.lat,entry.lng],{
    icon,title:entry.name,alt:entry.name
   }).addTo(activeLayer);
   const popup=el('div','map-discover-popup');
   popup.append(el('strong','',entry.name));
   const subtitle=el('p','',config.label+' · OpenStreetMap');
   popup.append(subtitle);
   if(entry.address)popup.append(el('p','',entry.address));
   const actions=el('div','map-discover-popup-actions');
   const trip=el('button','', 'Route here');trip.type='button';
   trip.addEventListener('click',()=>{
    const to=document.getElementById('mapTripTo');
    const from=document.getElementById('mapTripFrom');
    if(!to){setStatus('Open the full Map page to plan a route.');return;}
    to.value=entry.lat.toFixed(6)+', '+entry.lng.toFixed(6);
    document.getElementById('mapTabplan')?.click();
    to.focus();marker.closePopup();
    setStatus('Destination selected: '+entry.name+'. Choose a starting point and Explore trip.');
    if(!from?.value)from?.focus();
   });
   actions.append(trip);
   if(/^(node|way|relation)$/.test(entry.osmType)&&/^\d+$/.test(entry.osmId)){
    const link=el('a','', 'OSM source ↗');
    link.href='https://www.openstreetmap.org/'+entry.osmType+'/'+entry.osmId;
    link.target='_blank';link.rel='noopener noreferrer';actions.append(link);
   }
   popup.append(actions);marker.bindPopup(popup,{maxWidth:250});
   markerList.push({marker,entry});
  });
  found.slice(0,10).forEach((row,i)=>{
   const button=el('button','map-discover-result',CATEGORIES[key].icon+' '+row.name);
   button.type='button';button.addEventListener('click',()=>focus(i));
   list.append(button);
  });
  setStatus(found.length?
   found.length+' mapped '+CATEGORIES[key].label.toLowerCase()+' nearby. Select a pin or name for details.':
   'No mapped '+CATEGORIES[key].label.toLowerCase()+' here. Try another nearby area.');
 }
 function parse(data){
  if(!Array.isArray(data?.elements))throw Error('OpenStreetMap returned an invalid place list.');
  const seen=new Set(),rows=[];
  for(const item of data.elements.slice(0,200)){
   const name=String(item.tags?.name||'').trim().slice(0,90);
   const lat=Number(item.lat??item.center?.lat),lng=Number(item.lon??item.center?.lon);
   const osmType=String(item.type||''),osmId=String(item.id||'');
   if(!name||!valid({lat,lng})||!/^(node|way|relation)$/.test(osmType)||!/^\d+$/.test(osmId))continue;
   const key=osmType+'/'+osmId;
   if(seen.has(key))continue;seen.add(key);
   const addr=[item.tags?.['addr:housenumber'],item.tags?.['addr:street']]
    .filter(Boolean).join(' ').slice(0,90);
   rows.push({name,lat,lng,address:addr,osmType,osmId});
   if(rows.length>=MAX_MARKERS)break;
  }
  return rows;
 }
 const round=(number)=>Number(number).toFixed(3);
 function query(key,lat,lng){
  // Cap to a walkable neighborhood (~900 m north/south), never query the globe.
  const latSize=.008,lonSize=Math.min(.03,.008/Math.max(.35,Math.cos(lat*Math.PI/180)));
  const box=[lat-latSize,lng-lonSize,lat+latSize,lng+lonSize]
   .map(number=>Number(number).toFixed(5)).join(',');
  return '[out:json][timeout:12];(nwr'+CATEGORIES[key].tag+'('+box+'););out center 140;';
 }
 async function load(key){
  if(!CATEGORIES[key])return;
  setActive(key);
  // Invalidate previous requests even when the next category is rate limited.
  requestId++;controller?.abort();controller=null;
  if(!bridge?.map){setStatus('Map is loading. Try again after it appears.');return;}
  if(bridge.map.getZoom()<12){
   setStatus('Zoom closer (street or neighborhood level) to discover nearby places.');
   removeMarkers();return;
  }
  const center=bridge.map.getCenter();
  const memoKey=key+':'+round(center.lat)+':'+round(center.lng);
  const cached=memo.get(memoKey);
  if(cached&&Date.now()-cached.at<CACHE_MS){show(cached.rows,key);return;}
  if(Date.now()<rateLimitedUntil){
   setStatus('Place provider is busy. Please try again in a little while.');return;
  }
  if(Date.now()<nextRequestAt){
   setStatus('Give the map a moment before checking another category.');return;
  }
  nextRequestAt=Date.now()+1600;
  const stamp=requestId;
  const activeController=new AbortController();
  controller=activeController;
  const signal=activeController.signal;
  setStatus('Finding mapped '+CATEGORIES[key].label.toLowerCase()+' around this spot…');
  const timeout=setTimeout(()=>activeController.abort(),14000);
  try{
   const endpoint='https://overpass-api.de/api/interpreter';
   const response=await fetch(endpoint,{
    method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},
    body:'data='+encodeURIComponent(query(key,center.lat,center.lng)),signal
   });
   if(response.status===429||response.status===503){
    rateLimitedUntil=Date.now()+30000;
    throw Error('The shared OpenStreetMap place service is busy. Try later.');
   }
   if(!response.ok)throw Error('Mapped places are temporarily unavailable ('+response.status+').');
   const data=await response.json();
   if(stamp!==requestId||signal.aborted)return;
   const rows=parse(data);
   memo.set(memoKey,{at:Date.now(),rows});
   if(memo.size>25)memo.delete(memo.keys().next().value);
   show(rows,key);
  }catch(error){
   if(stamp!==requestId||signal.aborted)return;
   setStatus(error?.message||'Nearby places could not be loaded.');
  }finally{
   clearTimeout(timeout);
   if(stamp===requestId&&controller===activeController)controller=null;
  }
 }
 function bindMap(){
  bridge=window.BigLWAMapBridge;
  if(!bridge?.L||!bridge?.map)return;
  bridge.map.on('moveend',()=>{
   controller?.abort();controller=null;requestId++;
   if(markerList.length){setStatus('Map moved. Select a category to refresh places here.');}
  });
  window.BigLWAMapDiscover=Object.freeze({load,clear:removeMarkers});
 }
 if(window.BigLWAMapBridge?.map)bindMap();
 else window.addEventListener('biglwa:map-ready-local',bindMap,{once:true});
})();