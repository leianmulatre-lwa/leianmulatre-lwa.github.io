/* BIG LWA Map: opt-in foreground navigation.
   Requires an actual Valhalla road route, explicit GPS permission, and user
   action to enable speaking. No silent location storage or auto-reroutes.
   Not a substitute for observing road signs, closures and local conditions. */
(()=>{
 'use strict';
 const params=new URLSearchParams(location.search);
 if(params.has('preview'))return;
 const get=id=>document.getElementById(id);
 const planner=get('mapTripPlanner'),map=get('map');
 if(!planner||!map||get('mapNavControls'))return;
 const valid=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)&&
  Math.abs(p[0])<=90&&Math.abs(p[1])<=180;
 const km=(a,b)=>{
  const rad=Math.PI/180,lat1=a[0]*rad,lat2=b[0]*rad;
  const dLat=lat2-lat1,dLon=(b[1]-a[1])*rad;
  const h=Math.sin(dLat/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
  return 12742*Math.asin(Math.min(1,Math.sqrt(h)));
 };
 const metersBetween=(a,b)=>km(a,b)*1000;
 const onPath=(points,position)=>{
  if(!Array.isArray(points)||points.length<2||!valid(position))return null;
  const latRad=position[0]*Math.PI/180;
  const xScale=111320*Math.cos(latRad),yScale=111132;
  let best={distance:Infinity,index:0};
  for(let i=0;i<points.length-1;i++){
   const a=points[i],b=points[i+1];
   const ax=(a[1]-position[1])*xScale,ay=(a[0]-position[0])*yScale;
   const dx=(b[1]-a[1])*xScale,dy=(b[0]-a[0])*yScale;
   const denom=dx*dx+dy*dy,t=denom>0?
    Math.max(0,Math.min(1,-(ax*dx+ay*dy)/denom)):0;
   const d=Math.hypot(ax+t*dx,ay+t*dy);
   if(d<best.distance)best={distance:d,index:i+t};
  }
  return best;
 };
 const controls=document.createElement('section');
 controls.id='mapNavControls';controls.className='map-nav-controls';
 controls.setAttribute('aria-label','Turn-by-turn navigation');
 controls.innerHTML=
  '<div class="map-nav-head"><strong>Navigation</strong>'+
    '<span>Foreground GPS · no live traffic</span></div>'+
  '<div class="map-nav-actions">'+
    '<button type="button" id="mapNavGo" disabled>Go · start navigation</button>'+
    '<button type="button" id="mapNavStop" hidden>Stop navigation</button>'+
    '<button type="button" id="mapNavVoice" aria-pressed="false">🔇 Voice off</button>'+
    '<button type="button" id="mapNavSpeakDestination">🎙 Say destination</button>'+
    '<button type="button" id="mapNavReplan" hidden>Replan from my location</button>'+
  '</div>'+
  '<p id="mapNavStatus" role="status">Explore a real road route first to enable Go. No GPS tracking until you press Go.</p>'+
  '<div class="map-nav-next" hidden><span class="map-nav-distance" id="mapNavDistance"></span>'+
   '<strong id="mapNavNextText"></strong></div>'+
  '<ol class="map-nav-turns" id="mapNavTurns" hidden></ol>'+
  '<p class="map-nav-caveat">Navigation only runs while this page stays open. Check signs, closures and surroundings; never rely on the screen while cycling or driving.</p>';
 planner.append(controls);
 const go=get('mapNavGo'),stopButton=get('mapNavStop'),voiceButton=get('mapNavVoice');
 const speakInput=get('mapNavSpeakDestination'),replan=get('mapNavReplan');
 const status=get('mapNavStatus'),nextBox=controls.querySelector('.map-nav-next');
 const nextText=get('mapNavNextText'),distanceLabel=get('mapNavDistance'),list=get('mapNavTurns');
 let planned=null,watchId=null,locMarker=null,voiceEnabled=false,offCount=0,lastFix=null;
 let announced=new Set(),navigationToken=0;
 const showStatus=text=>{status.textContent=text;};
 function say(text){
  if(!voiceEnabled||!('speechSynthesis' in window)||!window.SpeechSynthesisUtterance)return;
  try{
   window.speechSynthesis.cancel();
   const utter=new window.SpeechSynthesisUtterance(String(text).slice(0,210));
   utter.lang='en-US';utter.rate=0.96;utter.volume=0.95;
   window.speechSynthesis.speak(utter);
  }catch{}
 }
 const navigable=route=>
  route&&Array.isArray(route.points)&&route.points.length>1&&route.points.length<=20000&&
  route.points.every(valid)&&Array.isArray(route.maneuvers)&&route.maneuvers.length>0&&
  ['bicycling','walking','driving'].includes(route.mode);
 function stop(silent=false){
  navigationToken++;
  if(watchId!==null&&navigator.geolocation){
   navigator.geolocation.clearWatch(watchId);watchId=null;
  }
  try{window.speechSynthesis?.cancel();}catch{}
  const bridge=window.BigLWAMapBridge;
  if(locMarker&&bridge?.map){bridge.map.removeLayer(locMarker);locMarker=null;}
  go.hidden=false;stopButton.hidden=true;go.disabled=!planned;replan.hidden=true;
  if(!silent)showStatus('Navigation stopped. Location tracking is off.');
  nextBox.hidden=true;
  offCount=0;announced=new Set();
 }
 function routeReady(event){
  stop(true);
  const route=event.detail;
  planned=navigable(route)?route:null;
  go.disabled=!planned;
  go.hidden=false;
  list.replaceChildren();
  if(!planned){
   list.hidden=true;showStatus('Navigation unavailable: a valid road route with turns is required.');
   return;
  }
  for(const maneuver of planned.maneuvers.slice(0,40)){
   const li=document.createElement('li');
   li.textContent=maneuver.instruction;list.append(li);
  }
  list.hidden=false;
  showStatus('Route ready · '+String(planned.distanceLabel||'')+
   ' · Select Go to grant location permission and follow your next turn.');
 }
 window.addEventListener('biglwa:map-navigation-route',routeReady);
 window.addEventListener('biglwa:map-navigation-reset',()=>{
  stop(true);planned=null;go.disabled=true;list.hidden=true;
  showStatus('Recalculating route…');
 });
 const nextManeuver=progress=>{
  const turns=planned?.maneuvers||[];
  // Valhalla maneuvers carry shape indices. A maneuver at the final
  // route point is an arrival rather than a turn to make.
  return turns.find((turn,index)=>index===turns.length-1||
   Number(turn.shapeIndex)>progress-0.25)||null;
 };
 function currentPosition(position,token){
  if(token!==navigationToken||watchId===null||!planned)return;
  const lat=position.coords.latitude,lng=position.coords.longitude;
  const accuracy=position.coords.accuracy;
  const where=[lat,lng],progress=onPath(planned.points,where);
  if(!valid(where)||!progress)return;
  lastFix={lat,lng};
  const bridge=window.BigLWAMapBridge;
  if(bridge?.map&&bridge?.L){
   if(!locMarker){
    locMarker=bridge.L.circleMarker(where,{
     radius:9,color:'#fff',weight:3,fillColor:'#a72f52',fillOpacity:1
    }).addTo(bridge.map).bindTooltip('Your approximate position');
   }else locMarker.setLatLng(where);
   bridge.map.panTo(where,{animate:true,duration:0.45});
  }
  if(!Number.isFinite(accuracy)||accuracy>100){
   showStatus('GPS accuracy is low ('+Math.round(accuracy||0)+' m). Keep checking surroundings.');
   return;
  }
  const arrived=metersBetween(where,planned.points.at(-1))<35&&
   progress.index>=planned.points.length-5;
  if(arrived){
   say('You have reached your destination.');
   stop(true);
   showStatus('Destination reached · navigation stopped.');
   return;
  }
  if(progress.distance>(planned.mode==='driving'?170:110)){
   offCount++;
   if(offCount>=2){
    showStatus('You may be off route ('+Math.round(progress.distance)+
     ' m from the route). Choose Replan; no automatic location upload.');
    replan.hidden=false;
   }
  }else{
   offCount=0;replan.hidden=true;
   showStatus('Following '+planned.mode+' directions · GPS ±'+Math.round(accuracy)+' m · No live traffic');
  }
  const turn=nextManeuver(progress.index);
  if(!turn){
   nextText.textContent='Continue to your destination';
   distanceLabel.textContent='';
   nextBox.hidden=false;return;
  }
  const target=planned.points[Math.min(planned.points.length-1,Math.max(0,Number(turn.shapeIndex)||0))];
  const meters=Math.round(metersBetween(where,target));
  const instruction=String(turn.instruction||'Continue along the route.');
  nextBox.hidden=false;nextText.textContent=instruction;
  distanceLabel.textContent=meters>1000?(meters/1000).toFixed(1)+' km to next instruction':
   Math.max(0,meters)+' m to next instruction';
  const id=planned.maneuvers.indexOf(turn);
  const threshold=planned.mode==='driving'?200:planned.mode==='bicycling'?110:65;
  if(meters<=threshold&&!announced.has(id)){
   announced.add(id);say(String(turn.verbal||instruction));
  }
 }
 go.addEventListener('click',()=>{
  if(watchId!==null||!planned)return;
  if(!navigator.geolocation?.watchPosition){
   showStatus('GPS navigation is unavailable in this browser. You can still read the directions.');
   return;
  }
  const token=++navigationToken;
  go.hidden=true;stopButton.hidden=false;replan.hidden=true;
  showStatus('Requesting location for this navigation session only…');
  try{
   watchId=navigator.geolocation.watchPosition(
    fix=>currentPosition(fix,token),
    error=>{
     if(token!==navigationToken)return;
     const message=error.code===1?'Location permission denied.':
      'GPS fix unavailable. Retry Go or review steps manually.';
     stop(true);showStatus(message);
    },
    {enableHighAccuracy:true,maximumAge:3000,timeout:15000}
   );
  }catch{
   stop(true);showStatus('Could not start GPS. Check your device/browser permissions.');
  }
 });
 stopButton.addEventListener('click',()=>stop());
 voiceButton.addEventListener('click',()=>{
  voiceEnabled=!voiceEnabled;
  if(!('speechSynthesis' in window)||!window.SpeechSynthesisUtterance)voiceEnabled=false;
  voiceButton.setAttribute('aria-pressed',String(voiceEnabled));
  voiceButton.textContent=voiceEnabled?'🔊 Voice on':'🔇 Voice off';
  if(voiceEnabled)say('Voice guidance is on. Watch your surroundings.');
  else window.speechSynthesis?.cancel();
  if(!voiceEnabled&&!('speechSynthesis' in window))
   showStatus('Spoken directions are not supported here. Visual navigation remains available.');
 });
 replan.addEventListener('click',()=>{
  if(!lastFix)return;
  const from=get('mapTripFrom'),request=get('mapTripPlan');
  stop(true);
  from.value=lastFix.lat.toFixed(6)+', '+lastFix.lng.toFixed(6);
  from.dispatchEvent(new Event('input',{bubbles:true}));
  showStatus('Requesting a new road route from the last GPS fix…');
  request?.click();
 });
 const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!Recognition){
  speakInput.hidden=true;
 }else{
  speakInput.addEventListener('click',()=>{
   const rec=new Recognition();rec.lang='en-US';rec.continuous=false;
   rec.interimResults=false;rec.maxAlternatives=1;
   showStatus('Listening once for a destination…');
   rec.onresult=event=>{
    const text=String(event.results?.[0]?.[0]?.transcript||'').trim()
     .replace(/^(?:take me|navigate|go|directions?)\s+to\s+/i,'').slice(0,175);
    if(text){
     get('mapTripTo').value=text;
     showStatus('Destination set to '+text+'. Select Explore trip to calculate.');
    }
   };
   rec.onerror=()=>showStatus('Voice input unavailable; type your destination instead.');
   try{rec.start();}catch{showStatus('Microphone permission or voice recognition unavailable.');}
  });
 }
 window.addEventListener('pagehide',()=>stop(true));
 window.BigLWAMapNavigationGeometry=Object.freeze({onPath,metersBetween});
})();
