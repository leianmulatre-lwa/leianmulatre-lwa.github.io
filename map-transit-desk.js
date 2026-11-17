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

 window.BigLWAMetroTransit={async plan(origin,destination,host,isCurrent=()=>true){
  const d=await load();if(!isCurrent())return false;
  const distance=(a,b)=>Math.hypot((a[0]-b[0])*111.2,(a[1]-b[1])*92.2);
  const nodes=[];
  d.routes.forEach(route=>route.stops.forEach((stop,index)=>nodes.push({...stop,route,index})));
  const nearest=p=>nodes.reduce((a,b)=>distance(a.point,p)<distance(b.point,p)?a:b);
  const fromPoint=[origin.lat,origin.lng],toPoint=[destination.lat,destination.lng];
  const first=nearest(fromPoint),last=nearest(toPoint);
  if(distance(first.point,fromPoint)>2||distance(last.point,toPoint)>2)return false;
  const start=nodes.indexOf(first),end=nodes.indexOf(last),cost=nodes.map(()=>Infinity),previous=new Map(),pending=new Set(nodes.map((_,i)=>i));cost[start]=0;
  while(pending.size){
   let current=-1;for(const i of pending)if(current<0||cost[i]<cost[current])current=i;
   if(!Number.isFinite(cost[current])||current===end)break;pending.delete(current);
   const a=nodes[current];
   for(const i of pending){
    const b=nodes[i],same=a.route.id===b.route.id;
    const adjacent=same&&Math.abs(a.index-b.index)===1;
    const transfer=!same&&distance(a.point,b.point)<.25;
    if(!adjacent&&!transfer)continue;
    const next=cost[current]+(transfer?5:1);
    if(next<cost[i]){cost[i]=next;previous.set(i,current)}
   }
  }
  if(!Number.isFinite(cost[end]))return false;
  const path=[];let i=end;while(i!==undefined){path.unshift(nodes[i]);i=previous.get(i)}
  if(path.length<2)return false;
  const summary=document.createElement('section');summary.className='metro-itinerary';
  const title=document.createElement('strong');title.textContent='Rail route · LA Metro';summary.append(title);
  const note=document.createElement('p');note.textContent='Rail-only suggestion from published station data. Walking distances are approximate straight-line distances; check pedestrian access, service alerts and departure times before travelling.';summary.append(note);
  const steps=document.createElement('ol');summary.append(steps);
  const step=text=>{const li=document.createElement('li');li.textContent=text;steps.append(li)};
  step('Start near '+first.name+' · about '+Math.round(distance(first.point,fromPoint)*1000)+' m from your starting point.');
  let begin=0;
  for(let j=1;j<=path.length;j++){
   if(j<path.length&&path[j].route.id===path[begin].route.id)continue;
   const a=path[begin],b=path[j-1];
   if(j-begin>1)step(a.route.name+': '+a.name+' → '+b.name+' · '+(j-begin-1)+' stops');
   if(j<path.length)step('Transfer at '+b.name+' to '+path[j].route.name+'.');
   begin=j;
  }
  step('Exit at '+last.name+' · destination about '+Math.round(distance(last.point,toPoint)*1000)+' m away.');
  host.prepend(summary);desk.open=true;
  const bridge=window.BigLWAMapBridge;
  if(bridge?.map){
   layer?.remove();layer=bridge.L.featureGroup().addTo(bridge.map);
   for(let j=1;j<path.length;j++){
    const a=path[j-1],b=path[j];
    if(a.route.id!==b.route.id)continue;
    const pts=a.route.points;
    const at=p=>pts.reduce((best,pt,k)=>distance(pt,p)<distance(pts[best],p)?k:best,0);
    const x=at(a.point),y=at(b.point),part=pts.slice(Math.min(x,y),Math.max(x,y)+1);
    if(part.length>1)bridge.L.polyline(part,{color:'#'+a.route.color,weight:6}).addTo(layer);
   }
   bridge.map.fitBounds(layer.getBounds(),{padding:[30,30]});
  }
  return true;
 }};
 button.addEventListener('click',show);select.addEventListener('change',show);
 window.addEventListener('pagehide',()=>layer?.remove());
})();
