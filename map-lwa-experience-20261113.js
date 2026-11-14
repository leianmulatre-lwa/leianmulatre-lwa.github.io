/* BIG LWA Map workspace enhancement. Keeps pins/account ownership in map-app.html.
   Optional providers can implement BigLWAMapRouteProvider.getRoute and
   send same-origin biglwa:map-source-update messages for events, stores, etc. */
(() => {
  'use strict';
  const params=new URLSearchParams(location.search);
  if(params.has('preview') || (window.parent!==window && window.parent.__biglwaPublicStorageView))return;
  const byId=id=>document.getElementById(id);
  const mapSide=document.querySelector('.map-side');
  if(!mapSide||!byId('map')||byId('mapTripPlanner'))return;
  const escapeHtml=value=>String(value==null?'':value).replace(/[&<>"']/g,
    ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const brand=document.createElement('div');
  brand.className='map-brand-strip';
  brand.innerHTML='<b>⌖ BIG LWA · Map</b><span>Find your way, keep your places.</span>'+
    '<span class="map-brand-tag">Explore locally · share intentionally</span>';
  mapSide.prepend(brand);
  const planner=document.createElement('section');
  planner.id='mapTripPlanner';planner.className='map-plan';
  planner.setAttribute('aria-label','Plan your trip');
  planner.innerHTML=
    '<div class="map-plan-head"><h2>Where to, bookini?</h2><span aria-hidden="true">↗</span></div>'+
    '<div class="map-trip-fields">'+
      '<label>From<input id="mapTripFrom" type="search" autocomplete="off" maxlength="180" placeholder="A place, venue, or saved pin"></label>'+
      '<label>To<input id="mapTripTo" type="search" autocomplete="off" maxlength="180" placeholder="Where are we headed?"></label>'+
      '<button type="button" id="mapTripPlan">Explore trip</button>'+
    '</div>'+
    '<div class="map-mode-switch" role="group" aria-label="Travel mode">'+
      '<button type="button" data-map-travel="bicycling" aria-pressed="true">🚲 Bike</button>'+
      '<button type="button" data-map-travel="transit" aria-pressed="false">🚇 Transit</button>'+
      '<button type="button" data-map-travel="walking" aria-pressed="false">🚶 Walk</button>'+
      '<button type="button" data-map-travel="driving" aria-pressed="false">🚙 Drive</button>'+
    '</div>'+
    '<div class="map-trip-actions"><button type="button" id="mapTripLocate">Use my location for this trip</button>'+
      '<button type="button" id="mapTripSwap">Swap ↕</button>'+
      '</div>'+
    '<p class="map-plan-result" id="mapTripResult" role="status">Pick two places to compare a trip. Location is never requested automatically.</p>'+
    '<p>Map exploration stays here. Live traffic, bike-lane conditions and transit arrivals require dedicated routing/data providers.</p>';
  brand.after(planner);

  // Desk mode: keep the live map on the LEFT and tools on the RIGHT. Move
  // actual nodes, not copies, preserving saved-pin, sharing and search handlers.
  const sidebar=document.querySelector('main > aside');
  const main=document.querySelector('main');
  let selectDeskTab=()=>{};
  if(sidebar&&main){
    const tabbar=document.createElement('div');
    tabbar.id='mapActionTabs';
    tabbar.className='map-action-tabs';
    tabbar.setAttribute('role','tablist');
    tabbar.setAttribute('aria-label','Map tools');
    const deskHead=document.createElement('div');
    deskHead.className='map-desk-heading';
    deskHead.innerHTML='<span>MAP WORKSPACE</span><b>Explore · Plan · Keep</b>';
    const pane=(id,label)=>{
      const box=document.createElement('section');
      box.id=id;box.className='map-workspace-pane';
      box.setAttribute('role','tabpanel');box.setAttribute('aria-label',label);
      return box;
    };
    const planPane=pane('mapPlanPane','Plan a route');
    const editPane=pane('mapEditPane','Add or edit a pin');
    const savedPane=pane('mapSavedPane','Saved pins');
    const publicPane=pane('mapPublicPane','Nearby public pins');
    planPane.append(planner);
    const editTitle=sidebar.querySelector('#formTitle');
    const editForm=sidebar.querySelector('#pinForm');
    const editStatus=sidebar.querySelector('#saveStatus');
    const undo=sidebar.querySelector('#undo');
    [editTitle,editForm,editStatus,undo].forEach(el=>{if(el)editPane.append(el)});
    const saved=sidebar.querySelector('.saved');
    if(saved)savedPane.append(saved);
    const publicStrip=sidebar.querySelector('#publicStrip');
    if(publicStrip)publicPane.append(publicStrip);
    const tabs=[
      {key:'plan',name:'↗ Route',pane:planPane},
      {key:'pin',name:'＋ Add pin',pane:editPane},
      {key:'saved',name:'▣ Saved pins',pane:savedPane},
      {key:'nearby',name:'◉ Nearby',pane:publicPane}
    ];
    let activeTab='pin';
    const controls=tabs.map((item,i)=>{
      const button=document.createElement('button');button.type='button';
      button.className='map-action-tab';button.id='mapTab'+item.key;
      button.dataset.mapTab=item.key;
      button.setAttribute('role','tab');
      button.setAttribute('aria-controls',item.pane.id);
      button.setAttribute('aria-selected','false');
      button.textContent=item.name;tabbar.append(button);
      item.pane.setAttribute('aria-labelledby',button.id);
      button.addEventListener('click',()=>selectDeskTab(item.key,true));
      button.addEventListener('keydown',event=>{
        const next=event.key==='ArrowRight'?1:event.key==='ArrowLeft'?-1:0;
        if(!next)return;
        event.preventDefault();
        const target=controls[(i+next+controls.length)%controls.length];
        target.focus();selectDeskTab(tabs[(i+next+tabs.length)%tabs.length].key,true);
      });
      return button;
    });
    const panes=document.createElement('div');
    panes.className='map-tool-panels';
    tabs.forEach(item=>panes.append(item.pane));
    sidebar.replaceChildren(deskHead,tabbar,panes);
    selectDeskTab=(key,userAction=false)=>{
      const chosen=tabs.some(item=>item.key===key)?key:'pin';
      activeTab=chosen;
      tabs.forEach(item=>{
        const shown=item.key===chosen;
        item.pane.hidden=!shown;
        const button=controls[tabs.indexOf(item)];
        button.setAttribute('aria-selected',String(shown));
        button.tabIndex=shown?0:-1;
      });
      if(userAction)panes.scrollTop=0;
    };
    selectDeskTab(activeTab);
    // Map clicks and "Drop pin" reveal the relevant editor immediately.
    const drop=byId('drop');
    drop?.addEventListener('click',()=>selectDeskTab('pin',true));
    function mapReady(){
      const bridge=window.BigLWAMapBridge;
      if(!bridge?.map)return;
      bridge.map.on('click',()=>selectDeskTab('pin'));
      requestAnimationFrame(()=>bridge.map.invalidateSize({pan:false}));
    }
    window.addEventListener('biglwa:map-ready-local',mapReady,{once:true});
    if(window.BigLWAMapBridge?.map)mapReady();
    if(typeof ResizeObserver==='function'){
      new ResizeObserver(()=>window.BigLWAMapBridge?.map?.invalidateSize({pan:false}))
        .observe(mapSide.querySelector('.map-stage'));
    }
    document.body.classList.add('map-workspace-split');
  }

  const fullscreen=byId('fullscreenMap'),toolbar=mapSide.querySelector(':scope > .toolbar');
  if(fullscreen&&toolbar){fullscreen.textContent='Full screen ↗';toolbar.appendChild(fullscreen);}
  const tip=document.createElement('div');tip.className='map-layer-tip';
  tip.textContent='Street layers · OpenFreeMap when available';
  tip.setAttribute('aria-hidden','true');
  mapSide.querySelector('.map-stage')?.appendChild(tip);
  // Studio expands with this document; only a height number is reported.
  if(params.has('embed')&&window.parent!==window){
    const reportHeight=()=>{
      const height=Math.ceil(document.documentElement.scrollHeight);
      if(height>420&&height<=4200){
        try{window.parent.postMessage({type:'biglwa:map-height',height},location.origin);}catch{}
      }
    };
    if(typeof ResizeObserver==='function')new ResizeObserver(reportHeight).observe(document.body);
    window.addEventListener('load',reportHeight);
    window.addEventListener('resize',reportHeight);
    requestAnimationFrame(reportHeight);
  }
  let mode='bicycling',fromGps=null,routeLine=null,lastPlan=null;
  const result=byId('mapTripResult');
  const centerOf=point=>[Number(point.lat),Number(point.lng)];
  const valid=p=>p&&Number.isFinite(Number(p.lat))&&Number.isFinite(Number(p.lng))&&
    Math.abs(Number(p.lat))<=90&&Math.abs(Number(p.lng))<=180;
  const kmBetween=(a,b)=>{
    const r=Math.PI/180,dl=(Number(b.lng)-Number(a.lng))*r,
      dp=(Number(b.lat)-Number(a.lat))*r,p1=Number(a.lat)*r,p2=Number(b.lat)*r;
    return 6371*2*Math.asin(Math.sqrt(Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2));
  };
  const savedPins=()=>{try{
    const rows=JSON.parse(localStorage.getItem('biglwaMapPins')||'[]');
    return Array.isArray(rows)?rows.filter(valid):[];
  }catch{return [];}};
  function coordinates(text){
    const match=String(text).trim().match(/^(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)$/);
    if(match){const p={lat:+match[1],lng:+match[2]};if(valid(p))return p;}
    return null;
  }
  async function resolvePlace(label){
    const q=String(label||'').trim();
    if(!q)throw Error('Choose both places to start.');
    const fixed=coordinates(q);if(fixed)return fixed;
    const saved=savedPins().find(p=>String(p.title||'').trim().toLowerCase()===q.toLowerCase());
    if(saved)return {lat:Number(saved.lat),lng:Number(saved.lng)};
    const url=new URL('https://photon.komoot.io/api');
    url.searchParams.set('q',q);url.searchParams.set('limit','1');
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),9000);
    try{
      const response=await fetch(url,{signal:controller.signal,headers:{Accept:'application/json'}});
      if(!response.ok)throw Error('Place search is unavailable. Try a saved pin or coordinates.');
      const loc=(await response.json())?.features?.[0]?.geometry?.coordinates;
      const point=loc&&{lat:Number(loc[1]),lng:Number(loc[0])};
      if(!valid(point))throw Error('No matching place for "'+q+'". Try a more specific place name.');
      return point;
    }finally{clearTimeout(timer);}
  }
  const clearLine=()=>{const bridge=window.BigLWAMapBridge;
    if(routeLine&&bridge?.map){bridge.map.removeLayer(routeLine);}routeLine=null;};
  const travelLabel=()=>({'bicycling':'Bike','transit':'Transit','walking':'Walk','driving':'Drive'}[mode]||'Trip');

  function drawLine(coords,options){
    const bridge=window.BigLWAMapBridge;
    if(!bridge?.map||!bridge?.L)return;
    clearLine();
    routeLine=bridge.L.polyline(coords,Object.assign({
      color:'#9b3952',weight:4,opacity:.88,dashArray:'6 8'
    },options||{})).addTo(bridge.map);
    bridge.map.fitBounds(routeLine.getBounds(),{padding:[40,40],maxZoom:14});
  }
  async function plan(){
    window.dispatchEvent(new Event('biglwa:map-navigation-reset'));
    result.textContent='Finding both places on BIG LWA…';
    clearLine();
    const stamp=Symbol('plan');lastPlan=stamp;
    try{
      const origin=fromGps||await resolvePlace(byId('mapTripFrom').value);
      const destination=await resolvePlace(byId('mapTripTo').value);
      lastResolvedOrigin=origin;lastResolvedDestination=destination;
      if(lastPlan!==stamp)return;
      if(kmBetween(origin,destination)<.02)throw Error('Those points are effectively the same place.');
      // The route remains in this widget. No Google Maps handoff.
      const aerial=kmBetween(origin,destination),shortDistance=(aerial<10?aerial.toFixed(1):Math.round(aerial))+' km';
      const provider=window.BigLWAMapRouteProvider;
      if(provider&&typeof provider.getRoute==='function'){
        try{
          const route=await provider.getRoute({origin,destination,mode});
          if(lastPlan!==stamp)return;
          if(route&&Array.isArray(route.points)&&route.points.length>1&&
              route.points.length<20000&&route.points.every(p=>Array.isArray(p)&&p.length===2&&
                valid({lat:p[0],lng:p[1]}))){
            drawLine(route.points,{dashArray:null});
            const eta=Number.isFinite(Number(route.durationMinutes))?
              ' · '+Math.round(Number(route.durationMinutes))+' min':'';
            result.textContent=travelLabel()+' · '+String(route.distanceLabel||shortDistance)+eta+
              ' · '+String(route.provider||'Connected route provider')+
              (route.trafficAware?' · Traffic-aware':' · No live traffic');
            // A successful navigable road route (never a straight-line
            // fallback) unlocks Go. Data remains in page memory only.
            if(Array.isArray(route.maneuvers)&&route.maneuvers.length){
              window.dispatchEvent(new CustomEvent('biglwa:map-navigation-route',{
                detail:{
                  origin,destination,mode,
                  points:route.points,maneuvers:route.maneuvers,
                  distanceLabel:String(route.distanceLabel||shortDistance),
                  durationMinutes:Number(route.durationMinutes)||null,
                  provider:String(route.provider||'Road router')
                }
              }));
            }
            return;
          }
        }catch(e){console.info('[Map] Connected router unavailable, using orientation only.',e);}
      }
      drawLine([centerOf(origin),centerOf(destination)]);
      result.textContent=travelLabel()+' · '+shortDistance+
        ' straight-line distance. Dashed line is orientation only, not a street route or ETA. '+
        'Check live directions for bike lanes, traffic and departure times.';
    }catch(error){if(lastPlan!==stamp)return;
      result.textContent=error&&error.message?error.message:'Could not plan that trip.';}
  }
  byId('mapTripPlan').addEventListener('click',plan);
  byId('mapTripTo').addEventListener('keydown',event=>{
    if(event.key==='Enter'){event.preventDefault();plan();}
  });
  planner.querySelectorAll('[data-map-travel]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      mode=btn.dataset.mapTravel;
      window.dispatchEvent(new Event('biglwa:map-navigation-reset'));
      planner.querySelectorAll('[data-map-travel]').forEach(b=>
        b.setAttribute('aria-pressed',String(b===btn)));
      if(lastPlan){
        result.textContent='Travel mode changed. Select Explore trip to recalculate on this map.';
      }
    });
  });
  // Keep coordinates only in page memory; they are never persisted as a pin.
  let lastResolvedOrigin=null,lastResolvedDestination=null;
  byId('mapTripLocate').addEventListener('click',()=>{
    if(!navigator.geolocation){result.textContent='Location is unavailable here.';return;}
    result.textContent='Checking your location for this trip only…';
    navigator.geolocation.getCurrentPosition(
      pos=>{fromGps={lat:pos.coords.latitude,lng:pos.coords.longitude};
        byId('mapTripFrom').value='My current location';
        result.textContent='Starting point set for this trip. Not saved or shared.';},
      ()=>{result.textContent='Location was not shared. You can type a place instead.';},
      {enableHighAccuracy:false,timeout:10000,maximumAge:60000});
  });
  byId('mapTripFrom').addEventListener('input',()=>{fromGps=null;});
  byId('mapTripSwap').addEventListener('click',()=>{
    const from=byId('mapTripFrom'),to=byId('mapTripTo'),value=from.value;
    from.value=to.value;to.value=value;fromGps=null;
    window.dispatchEvent(new Event('biglwa:map-navigation-reset'));
    clearLine();result.textContent='Places swapped. Explore trip to recalculate.';
  });

  // First-party map source adapter: never turns partner data into personal pins.
  const sourceMarkers=new Map();
  function clearPlaces(source){
    for(const [id,row] of sourceMarkers){
      if(source&&row.source!==source)continue;
      try{row.marker.remove();}catch{}
      sourceMarkers.delete(id);
    }
  }
  function addPlaces(rows,{replaceSource=false,source='external'}={}){
    const bridge=window.BigLWAMapBridge;
    if(!bridge?.map||!bridge?.L)return 0;
    if(!Array.isArray(rows))return 0;
    source=String(source||'external').slice(0,60);
    if(replaceSource)clearPlaces(source);
    let created=0;
    for(const row of rows.slice(0,200)){
      if(!valid(row)||!row.title)continue;
      const id=String(row.id||row.title).slice(0,160),key=source+':'+id;
      if(sourceMarkers.has(key))sourceMarkers.get(key).marker.remove();
      const icon=bridge.L.divIcon({
        className:'map-event-marker',html:'<span aria-hidden="true">'+
          ({event:'🎟',store:'🛍',venue:'🎭',resource:'📍'}[row.type]||'📍')+'</span>',
        iconSize:[32,32],iconAnchor:[16,16]});
      const marker=bridge.L.marker([Number(row.lat),Number(row.lng)],{
        icon,title:String(row.title).slice(0,160),alt:String(row.title).slice(0,160)});
      const popup=document.createElement('div');
      const strong=document.createElement('strong');strong.textContent=String(row.title).slice(0,160);popup.appendChild(strong);
      if(row.subtitle){const p=document.createElement('p');p.textContent=String(row.subtitle).slice(0,220);popup.appendChild(p);}
      if(row.startTime){const p=document.createElement('p');const date=new Date(row.startTime);
        p.textContent=Number.isFinite(date.getTime())?date.toLocaleString():'';popup.appendChild(p);}
      try{const u=new URL(row.url);
        if(u.protocol==='https:'&&u.username===''&&u.password===''){
          const a=document.createElement('a');a.href=u.href;a.target='_blank';
          a.rel='noopener noreferrer';a.textContent='View source ↗';popup.appendChild(a);
        }
      }catch{}
      marker.addTo(bridge.map).bindPopup(popup);
      sourceMarkers.set(key,{source,marker});created++;
    }
    return created;
  }
  function attachBridge(){
    const bridge=window.BigLWAMapBridge;
    if(!bridge||bridge.addPlaces)return;
    Object.assign(bridge,{addPlaces,clearPlaces,routeProviderContract:{
      method:'getRoute',input:'{origin:{lat,lng},destination:{lat,lng},mode}',
      output:'{points:[[lat,lng],...],durationMinutes,distanceLabel,provider,trafficAware}'
    }});
  }
  window.addEventListener('biglwa:map-ready-local',attachBridge);
  attachBridge();
  window.addEventListener('message',event=>{
    if(event.origin!==location.origin||event.source!==window.parent)return;
    const data=event.data;
    if(!data||data.type!=='biglwa:map-source-update')return;
    attachBridge();
    addPlaces(data.places,{source:data.source,replaceSource:Boolean(data.replaceSource)});
  });
  window.BigLWAMapSourceContract=Object.freeze({
    messageType:'biglwa:map-source-update',
    fields:['id','lat','lng','title','type','subtitle','startTime','url'],
    kinds:['event','venue','store','resource'],
    note:'Only coordinates/public metadata; never pass API secrets or private user locations.'
  });
})();