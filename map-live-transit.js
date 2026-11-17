/* Opt-in public vehicle positions. No location or account data is sent. */
(() => {
  const toolbar = document.querySelector('body:not(.preview) .map-side > .toolbar');
  if (!toolbar) return;
  const button = document.createElement('button');
  button.type = 'button';button.id='mapLiveTransit';
  button.textContent = 'LA Metro live';
  button.setAttribute('aria-pressed', 'false');
  const status = document.createElement('p');
  status.className = 'map-transit-status';
  status.setAttribute('role', 'status');
  status.hidden = true;
  toolbar.append(button);
  toolbar.after(status);
  const detail=document.createElement('section');detail.hidden=true;detail.className='map-live-transit-detail';
  detail.style.cssText='padding:10px;border:1px dashed #916d78;border-radius:10px;background:#fff8ee;font:13px/1.5 system-ui';
  detail.innerHTML='<b>Live transit key</b><div><span style="color:#166d53">●</span> Bus · <span style="color:#873c9a">●</span> Rail · ○ Stop · dashed line: stop sequence</div><p>Tap a vehicle to see its line, direction and named stops. GPS positions do not identify a driving lane.</p><label>Filter line <input aria-label="Filter live transit line" placeholder="e.g. 720" style="width:90px"></label><div class="transit-line-detail" role="status"></div>';
  status.after(detail);
  const filter=detail.querySelector('input'),lineDetail=detail.querySelector('.transit-line-detail');
  let stopLayer=null,selection=0;
  filter.addEventListener('input',()=>{for(const row of markers.values()){if(!filter.value.trim()||row.route.toLowerCase().includes(filter.value.trim().toLowerCase()))layer.addLayer(row.marker);else layer.removeLayer(row.marker);}});
  async function showLine(agency,route,direction){
    const token=++selection;stopLayer?.remove();stopLayer=null;lineDetail.textContent='Loading line '+route+' and stops…';
    try{
      if(!route)throw Error('This vehicle has no published line identifier.');
      const get=async path=>{const response=await fetch('https://api.metro.net/'+agency+'/'+path,{signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error('Line details unavailable. Try another vehicle.');return response.json()};
      const [overview,rows]=await Promise.all([get('route_overview/'+encodeURIComponent(route)),get('route_stops/'+encodeURIComponent(route))]);
      if(token!==selection||!sockets.length)return;
      const info=Array.isArray(overview)?overview[0]:overview;
      const stops=(Array.isArray(rows)?rows:[]).filter(r=>direction==null||String(r.direction_id)===String(direction));
      const seen=new Set(),unique=stops.sort((a,b)=>a.stop_sequence-b.stop_sequence).filter(r=>{const key=r.direction_id+':'+r.stop_id;if(seen.has(key))return false;seen.add(key);return true});
      lineDetail.replaceChildren();const title=document.createElement('h4');title.textContent='Line '+route+' · '+(info?.route_long_name||agency);lineDetail.append(title);
      const desc=document.createElement('p');desc.textContent=[info?.route_desc,info?.['travel_direction_'+direction],info?.['description_'+direction]].filter(Boolean).join(' · ');lineDetail.append(desc);
      const {L,map}=window.BigLWAMapBridge;stopLayer=L.featureGroup().addTo(map);const groups=new Map();
      const list=document.createElement('ol');list.style.cssText='max-height:180px;overflow:auto;padding-left:24px';lineDetail.append(list);
      for(const stop of unique){
        const point=stop.geometry?.coordinates;if(!Array.isArray(point)||!point.every(Number.isFinite))continue;
        const ll=[point[1],point[0]],label=document.createElement('span');label.textContent=stop.stop_name+' · line '+route;
        L.circleMarker(ll,{radius:5,color:'#166d53',fillColor:'#fff',fillOpacity:1,weight:2}).addTo(stopLayer).bindTooltip(label);
        if(!groups.has(stop.direction_id))groups.set(stop.direction_id,[]);groups.get(stop.direction_id).push(ll);
        const li=document.createElement('li'),button=document.createElement('button');button.type='button';button.textContent=stop.stop_name;button.addEventListener('click',()=>map.setView(ll,17));li.append(button);list.append(li);
      }
      for(const points of groups.values())if(points.length>1)L.polyline(points,{color:'#166d53',weight:3,dashArray:'5 7',opacity:.55}).addTo(stopLayer);
      if(stopLayer.getLayers().length)map.fitBounds(stopLayer.getBounds(),{padding:[30,30],maxZoom:14});
      if(!unique.length)lineDetail.append('No named stops returned for this direction.');
    }catch(error){if(token===selection)lineDetail.textContent=error.message;}
  }

  const feeds = [['LACMTA','Bus'], ['LACMTA_Rail','Rail']];
  const markers = new Map();
  let sockets = [], layer, timer, connectionTimer, received = false;
  const freshness = 3 * 60 * 1000;

  function stop() {
    for (const socket of sockets) socket.close();
    sockets = [];
    clearInterval(timer);
    clearTimeout(connectionTimer);
    layer?.remove();
    markers.clear();
    status.hidden = true;detail.hidden=true;selection++;stopLayer?.remove();stopLayer=null;
    button.setAttribute('aria-pressed', 'false');
  }

  function update() {
    for (const [key, row] of markers) {
      if (Date.now() - row.updated <= freshness) continue;
      layer.removeLayer(row.marker);
      markers.delete(key);
    }
    const count = markers.size;
    status.textContent = count
      ? count + ' LA Metro vehicles on the map · Source: LA Metro'
      : 'No current LA Metro positions received. Check again shortly.';
  }

  function start() {
    const bridge = window.BigLWAMapBridge;
    if (!bridge?.map || !window.WebSocket) {
      status.hidden = false;
      status.textContent = 'Live transit is unavailable in this view.';
      return;
    }
    const { map, L } = bridge;
    status.hidden = false;
    received = false;
    status.textContent = 'Connecting to LA Metro vehicle positions…';detail.hidden=false;
    button.setAttribute('aria-pressed', 'true');
    layer = L.layerGroup().addTo(map);
    const coverage = L.latLngBounds([33.65,-118.85], [34.45,-117.55]);
    if (!coverage.contains(map.getCenter()) || map.getZoom()<9) map.setView([34.05,-118.24],10);

    for (const [agency, label] of feeds) {
      const socket = new WebSocket('wss://api.metro.net/ws/' + agency + '/vehicle_positions');
      sockets.push(socket);
      socket.addEventListener('message', event => {
        if (!sockets.includes(socket)) return;
        let response;
        try { response = JSON.parse(event.data); } catch { return; }
        const vehicle = response?.vehicle;
        const id = String(response?.id ?? vehicle?.vehicle?.id ?? '').trim();
        const { latitude, longitude } = vehicle?.position || {};
        if (!id || !Number.isFinite(latitude) || !Number.isFinite(longitude) ||
            !coverage.contains([latitude,longitude])) return;
        const timestamp = Number(vehicle.timestamp ?? response.timestamp);
        const updated = timestamp > 0 ? timestamp * 1000 : Date.now();
        if (Math.abs(Date.now()-updated) > freshness) return;
        const key = agency + ':' + id;
        const existing = markers.get(key);
        if (existing && existing.updated > updated) return;
        const marker = existing?.marker || L.circleMarker([latitude,longitude], {
          radius: label === 'Rail' ? 7 : 5, color:'#ffffff',
          fillColor:label === 'Rail' ? '#873c9a' : '#166d53', fillOpacity:1, weight:2
        }).addTo(layer);
        marker.setLatLng([latitude,longitude]);
        const description = document.createElement('span');
        const route = String(response.route_code ?? vehicle.trip?.routeId ?? vehicle.trip?.route_id ?? '').split('-')[0].slice(0,24);
        const direction=vehicle.trip?.direction_id ?? vehicle.trip?.directionId;
        marker.off('click');marker.on('click',()=>showLine(agency,route,direction));
        description.textContent = 'LA Metro ' + label + (route ? ' · ' + route : '');
        if (existing) marker.setTooltipContent(description);
        else marker.bindTooltip(description);
        markers.set(key,{marker,updated,route});
        if(filter.value.trim()&&!route.toLowerCase().includes(filter.value.trim().toLowerCase()))layer.removeLayer(marker);else layer.addLayer(marker);
        if (!received) { received = true; update(); }
      });
    }
    connectionTimer = setTimeout(update,10000);
    timer = setInterval(update,15000);
  }

  button.addEventListener('click', () => sockets.length ? stop() : start());
  window.addEventListener('pagehide', stop);
})();
