/* BIG LWA Map · first-party ride, food & courier desk.
 * Provider cards, road-model navigation and public-place discovery stay within
 * BIG LWA. Final transactions are intentional first-party provider handoffs.
 * No iframed third-party checkouts, secret APIs or manufactured quotes.
 */
(()=>{
 'use strict';
 const qs=new URLSearchParams(location.search);
 if(qs.has('preview')||(window.parent!==window&&window.parent.__biglwaPublicStorageView))return;
 if(window.BigLWATransportHub)return;
 const planner=document.getElementById('mapTripPlanner');
 const tripFields=planner?.querySelector('.map-trip-fields');
 if(!planner||!tripFields)return;
 const from=document.getElementById('mapTripFrom');
 const to=document.getElementById('mapTripTo');
 const plan=document.getElementById('mapTripPlan');
 const navGo=document.getElementById('mapNavGo');
 const travelButtons=Array.from(planner.querySelectorAll('[data-map-travel]'));
 if(!from||!to||!plan)return;
 const SERVICES={
  rides:[
   {id:'uber',name:'Uber',icon:'🚘',type:'ride',url:'https://m.uber.com/',
    detail:'Check actual fares, pickup times, driver availability and complete a ride with Uber.'},
   {id:'lyft',name:'Lyft',icon:'🚗',type:'ride',url:'https://www.lyft.com/rider',
    detail:'Check current prices and request rides on Lyft. No live Lyft quote is shown here.'},
   {id:'apple',name:'Apple Maps',icon:'↗',type:'ride',url:'https://maps.apple.com/',
    detail:'Open your route in Apple Maps for directions and supported transit options.'}
  ],
  food:[
   {id:'ubereats',name:'Uber Eats',icon:'🥡',type:'food',url:'https://www.ubereats.com/',
    detail:'Browse real menus, food prices, delivery fees and delivery ETAs directly with Uber Eats.'},
   {id:'doordash',name:'DoorDash',icon:'🛵',type:'food',url:'https://www.doordash.com/',
    detail:'Browse restaurant availability, food prices, fees and delivery ETAs with DoorDash.'},
   {id:'grubhub',name:'Grubhub',icon:'🍱',type:'food',url:'https://www.grubhub.com/',
    detail:'Browse restaurants and obtain actual checkout prices and delivery estimates with Grubhub.'}
  ],
  courier:[
   {id:'uberdirect',name:'Uber Direct',icon:'📦',type:'partner',url:'https://developer.uber.com/docs/deliveries/get-started',
    detail:'Business courier fulfillment requires a separately configured Uber Direct account and credentials.'},
   {id:'doordashdrive',name:'DoorDash Drive',icon:'🚚',type:'partner',url:'https://developer.doordash.com/en-US/docs/drive/how_to/quote_deliveries/',
    detail:'Delivery quotes require approved DoorDash Drive partner access. No consumer courier checkout is available here.'}
  ]
 };
 const el=(tag,cls,text)=>{
  const node=document.createElement(tag);
  if(cls)node.className=cls;
  if(text!=null)node.textContent=text;
  return node;
 };
 let mode='rides',selected='uber',planned=null;
 const heading=planner.querySelector('.map-plan-head h2');
 if(heading)heading.textContent='Find your way';
 const intro=el('p','map-transport-intro','Plan here, compare here. Book only when you choose a provider.');
 const switcher=el('div','map-transport-switcher');
 switcher.setAttribute('role','group');switcher.setAttribute('aria-label','Plan ride, food or courier');
 const switchButtons={};
 for(const [key,name] of [['rides','🚘 Ride'],['food','🥡 Food'],['courier','📦 Courier']]){
  const button=el('button','map-transport-switch',name);
  button.type='button';button.dataset.transport=key;
  button.setAttribute('aria-pressed',String(key===mode));
  button.addEventListener('click',()=>chooseMode(key));
  switchButtons[key]=button;switcher.append(button);
 }
 const tripInfo=el('p','map-transport-trip-note','Set pickup and dropoff, then select Explore trip for a road route. No GPS permission is requested.');
 // A native disclosure keeps route controls in view until provider details are needed.
 const services=el('details','map-service-links');
 services.id='mapServiceLinks';
 services.setAttribute('aria-label','In-app ride and delivery comparison');
 const titleBar=el('summary','map-service-head');
 const title=el('strong','', 'Ride options');
 const sub=el('small','', 'Expand to see providers and booking options');
 titleBar.append(title,sub);services.append(titleBar);
 const providerList=el('div','map-provider-list');
 providerList.setAttribute('role','group');providerList.setAttribute('aria-label','Choose provider');
 const providerInfo=el('section','map-provider-info');
 providerInfo.setAttribute('aria-label','Selected provider details');
 const providerTitle=el('h3','','');
 const providerText=el('p','map-provider-description');
 const routeStatus=el('p','map-provider-route');
 routeStatus.setAttribute('role','status');
 const controls=el('div','map-provider-actions');
 const explore=el('button','map-provider-internal','Explore route');
 explore.type='button';
 explore.addEventListener('click',()=>{
  const tab=document.getElementById('mapTabplan');
  if(tab?.getAttribute('aria-selected')!=='true')tab?.click();
  if(!from.value.trim()){from.focus();return}
  if(!to.value.trim()){to.focus();return}
  plan.click();
 });
 const directions=el('button','map-provider-internal','Start BIG LWA navigation');
 directions.type='button';
 directions.addEventListener('click',()=>{
  if(!planned||!navGo||navGo.disabled){
   routeStatus.textContent='Explore a road route first. Navigation requires an actual navigable route.';
   return;
  }
  // Existing navigation handler requests foreground GPS permission only
  // after the visitor explicitly selects Go.
  navGo.click();
  navGo.scrollIntoView?.({block:'nearest'});
 });
 const browse=el('button','map-provider-internal','Discover restaurants on map');
 browse.type='button';
 browse.addEventListener('click',()=>{
  window.BigLWAMapDiscover?.load?.('food');
  const map=document.querySelector('.map-stage');
  map?.scrollIntoView?.({block:'nearest',behavior:'smooth'});
 });
 const final=el('a','map-provider-handoff','Continue to provider ↗');
 final.target='_top'; // Map is a same-origin iframe. No new external tab.
 final.rel='noreferrer';
 final.addEventListener('click',()=>{
  // The destination is transmitted only after the explicit external handoff.
  final.href=providerUrl(currentProvider());
 });
 const warning=el('p','map-service-note',
  'BIG LWA shows road-model travel time when a route is available—not Uber fares, food prices, live driver pickup times, delivery charges or courier availability. Final quotes and transactions remain with each provider.');
 controls.append(explore,directions,browse,final);
 providerInfo.append(providerTitle,providerText,routeStatus,controls);
 services.append(providerList,providerInfo,warning);
 const before=tripFields;
 before.parentNode?.insertBefore(switcher,before);
 switcher.parentNode?.insertBefore(intro,switcher);
 const modeSwitch=planner.querySelector('.map-mode-switch');
 if(modeSwitch?.parentNode)modeSwitch.parentNode.insertBefore(tripInfo,modeSwitch);
 planner.append(services);
 const chosenProviders=()=>SERVICES[mode];
 const currentProvider=()=>chosenProviders().find(p=>p.id===selected)||chosenProviders()[0];
 const valid=p=>p&&Number.isFinite(Number(p.lat))&&Number.isFinite(Number(p.lng))&&
  Math.abs(Number(p.lat))<=90&&Math.abs(Number(p.lng))<=180;
 function providerUrl(provider){
  if(!planned||!valid(planned.origin)||!valid(planned.destination))
   return provider.url;
  if(provider.id==='apple'){
   const url=new URL('https://maps.apple.com/directions');
   url.searchParams.set('source',planned.origin.lat+','+planned.origin.lng);
   url.searchParams.set('destination',planned.destination.lat+','+planned.destination.lng);
   return url.href;
  }
  if(provider.id==='lyft'){
   const url=new URL('https://ride.lyft.com/u');
   url.searchParams.set('id','lyft');
   for(const [key,point] of [['pickup',planned.origin],['destination',planned.destination]]){
    url.searchParams.set(key+'[latitude]',String(point.lat));
    url.searchParams.set(key+'[longitude]',String(point.lng));
   }
   return url.href;
  }
  if(provider.id!=='uber')return provider.url;
  // Uber's documented optional ride-request handoff. It does not fetch fares,
  // authorize booking or guarantee that every client accepts prefilled fields.
  const url=new URL('https://m.uber.com/ul/');
  url.searchParams.set('action','setPickup');
  url.searchParams.set('pickup[latitude]',String(Number(planned.origin.lat)));
  url.searchParams.set('pickup[longitude]',String(Number(planned.origin.lng)));
  url.searchParams.set('pickup[nickname]','Pickup');
  url.searchParams.set('dropoff[latitude]',String(Number(planned.destination.lat)));
  url.searchParams.set('dropoff[longitude]',String(Number(planned.destination.lng)));
  url.searchParams.set('dropoff[nickname]','Destination');
  return url.href;
 }
 function displayRoute(){
  if(mode==='rides'){
   if(planned&&valid(planned.origin)&&valid(planned.destination)){
    const duration=Number(planned.durationMinutes);
    const minutes=Number.isFinite(duration)&&duration>0?' · about '+Math.round(duration)+' min':'';
    routeStatus.textContent='BIG LWA road route'+minutes+
     (planned.distanceLabel?' · '+String(planned.distanceLabel):'')+
     ' (no live traffic). Not a provider fare or pickup ETA.';
   }else routeStatus.textContent='Enter pickup and dropoff, then Explore trip. Live fares and driver ETAs require provider approval.';
  }else if(mode==='food'){
   routeStatus.textContent='Use Discover restaurants to see mapped food places in the current neighborhood. Prices and delivery times are only available from each ordering provider.';
  }else{
   routeStatus.textContent='Courier API quotes are not connected. Business partner credentials and approved production access are required before BIG LWA can request real delivery estimates.';
  }
 }
 function render(){
  for(const [key,button] of Object.entries(switchButtons))
   button.setAttribute('aria-pressed',String(key===mode));
  title.textContent=mode==='rides'?'Ride options':mode==='food'?'Food delivery options':'Courier services';
  providerList.replaceChildren();
  chosenProviders().forEach(p=>{
   const button=el('button','map-provider-choice');
   button.type='button';button.dataset.provider=p.id;
   button.setAttribute('aria-pressed',String(p.id===selected));
   const glyph=el('span','map-provider-glyph',p.icon);
   glyph.setAttribute('aria-hidden','true');
   const content=el('span','map-provider-copy');
   content.append(el('strong','',p.name),el('small','',p.type==='partner'?
    'Partner integration needed':'Real quote at provider checkout'));
   button.append(glyph,content);
   button.addEventListener('click',()=>{selected=p.id;render()});
   providerList.append(button);
  });
  const provider=currentProvider();
  providerTitle.textContent=provider.name+' · preview';
  providerText.textContent=provider.detail;
  displayRoute();
  explore.hidden=mode!=='rides';
  directions.hidden=mode!=='rides';
  browse.hidden=mode!=='food';
  final.textContent=provider.type==='partner'?'View partner requirements ↗':
   'Continue to '+provider.name+' for live quote ↗';
  final.href=provider.url; // Set the route-specific URL only upon click.
  const pickup=from.closest('label'),dropoff=to.closest('label');
  if(pickup?.firstChild?.nodeType===3)pickup.firstChild.textContent=mode==='rides'?'📍 Pickup location':'📍 Start';
  if(dropoff?.firstChild?.nodeType===3)dropoff.firstChild.textContent=mode==='rides'?'📍 Dropoff location':'📍 Destination';
  tripInfo.textContent=mode==='rides'?
   'Pickup now · For you · No live traffic or automatic location access.':
   mode==='food'?'Explore restaurants on the map without leaving BIG LWA. Orders happen with the provider.':
   'Courier quote integration is not yet connected; these are business partner services.';
 }
 function chooseMode(next){
  if(!SERVICES[next])return;
  mode=next;selected=SERVICES[next][0].id;
  services.open=true;
  if(next==='rides'){
   const driving=travelButtons.find(button=>button.dataset.mapTravel==='driving');
   if(driving&&driving.getAttribute('aria-pressed')!=='true')driving.click();
  }
  render();
 }
 window.addEventListener('biglwa:map-navigation-route',event=>{
  const route=event.detail;
  planned=valid(route?.origin)&&valid(route?.destination)?route:null;
  displayRoute();
 });
 window.addEventListener('biglwa:map-navigation-reset',()=>{
  planned=null;displayRoute();
 });
 // The first-party UI does not rely on any external provider API at launch.
 // A future approved adapter can populate quotes without changing this panel.
 window.BigLWATransportHub=Object.freeze({chooseMode,getMode:()=>mode,getSelected:()=>selected,
  getProviderUrl:()=>providerUrl(currentProvider())});
 const driving=travelButtons.find(button=>button.dataset.mapTravel==='driving');
 if(driving&&driving.getAttribute('aria-pressed')!=='true')driving.click();
 render();
})();
