/* LA Metro published rail network, separate from real-time vehicle positions. */
(()=>{'use strict';
 if(new URLSearchParams(location.search).has('preview'))return;
 const planner=document.getElementById('mapTripPlanner');if(!planner)return;
 const desk=document.createElement('details');desk.id='metroTransitDesk';
 desk.innerHTML='<summary>Transit · lines, stations & fares</summary><p class="metro-fare"><b>LA Metro: $1.75 regular fare</b><br>Free transfers within 2 hours (no round trips). TAP fare caps: $5/day · $18/7 days. Other agencies charge separately. <a href="https://www.metro.net/fares/" target="_blank" rel="noopener">Fare details & discounts ↗</a><br><small>Checked November 17, 2026.</small></p><label>Rail network<select aria-label="Metro rail line"><option value="all">All rail lines</option></select></label><button type="button">Show transit map</button><p role="status"></p><ol class="metro-stations"></ol>';
 planner.append(desk);
 const select=desk.querySelector('select'),button=desk.querySelector('button'),status=desk.querySelector('[role=status]'),list=desk.querySelector('ol');
 let data=null,layer=null,pending=false;
 async function load(){
  if(data)return data;
  const response=await fetch('/data/metro-rail-map.json');if(!response.ok)throw Error('Rail map unavailable.');
  data=await response.json();
  for(const r of data.routes){const option=document.createElement('option');option.value=r.id;option.textContent=r.name;select.append(option);}
  return data;
 }
 async function show(){
  if(pending)return;pending=true;button.disabled=true;
  try{
   const d=await load(),bridge=window.BigLWAMapBridge;if(!bridge?.map)throw Error('Map is still loading. Retry shortly.');
   layer?.remove();layer=bridge.L.featureGroup().addTo(bridge.map);list.replaceChildren();
   const routes=d.routes.filter(r=>select.value==='all'||r.id===select.value);
   for(const route of routes){
    bridge.L.polyline(route.points,{color:'#'+route.color,weight:5,opacity:.85}).addTo(layer).bindTooltip(route.name);
    for(const stop of route.stops){
     const label=document.createElement('span');label.textContent=stop.name+' · '+route.name;
     bridge.L.circleMarker(stop.point,{radius:4,color:'#'+route.color,fillColor:'#fff',fillOpacity:1,weight:2}).addTo(layer).bindTooltip(label);
     if(select.value!=='all'){
      const li=document.createElement('li'),b=document.createElement('button');b.type='button';b.textContent=stop.name;
      b.addEventListener('click',()=>bridge.map.setView(stop.point,16));li.append(b);list.append(li);
     }
    }
   }
   bridge.map.fitBounds(layer.getBounds(),{padding:[25,25]});
   status.textContent='LA Metro rail routes and stations · published GTFS, checked '+d.checked+'. Enable “LA Metro live” for current vehicles. Route maps do not include service disruptions or arrival predictions.';
  }catch(e){status.textContent=e.message;}finally{pending=false;button.disabled=false;}
 }
 button.addEventListener('click',show);select.addEventListener('change',show);
 window.addEventListener('pagehide',()=>layer?.remove());
})();
