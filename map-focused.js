/* Progressive map workspace. Moves original controls; keeps their account and provider handlers. */
(()=>{
'use strict';if(new URLSearchParams(location.search).has('preview'))return;
const $=id=>document.getElementById(id),planner=$('mapTripPlanner');if(!planner)return;
document.body.classList.add('map-focused');
const make=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
const button=(text,fn)=>{const n=make('button',text);n.type='button';n.addEventListener('click',fn);return n;};
planner.querySelector('h2').textContent='Take me to…';
$('mapTripPlan').textContent='Find my route';
const fields=planner.querySelector('.map-trip-fields'),modes=planner.querySelector('.map-mode-switch'),actions=planner.querySelector('.map-trip-actions');
const from=$('mapTripFrom'),to=$('mapTripTo');
from.closest('label').firstChild.textContent='📍 Starting point';to.closest('label').firstChild.textContent='📍 Destination';
to.placeholder='Address, station or place';
const inputs=make('div');inputs.id='mapJourneyInputs';
planner.querySelector('.map-plan-head').after(inputs);inputs.append(fields,actions,modes);
const transit=make('section');transit.id='mapTransitOptions';transit.hidden=true;inputs.append(transit);
const fare=make('p','LA Metro · $1.75 regular fare · transfers included for 2 hours. Other agencies vary.');fare.className='map-fare-summary';transit.append(fare);
const railKey=make('div');railKey.id='mapMetroLineKey';railKey.className='map-metro-line-key';railKey.hidden=true;
if(fare.parentNode)fare.after(railKey);else transit.append(railKey);
window.addEventListener('biglwa:metro-rail-loaded',event=>{
 const routes=event.detail?.routes||[];railKey.replaceChildren();
 if(!routes.length){railKey.hidden=true;return}
 railKey.hidden=false;
 railKey.append(make('small','Metro line key · colour and toward terminal'));
 const row=make('div');row.className='map-metro-line-row';
 for(const route of routes){
  const badge=make('span',String(route.name||'').replace(/^Metro\s+/,''));
  badge.className='map-metro-line-badge';badge.style.backgroundColor='#'+route.color;badge.style.color='#fff';
  badge.title=route.name+' · toward '+((route.stops||[]).at(-1)?.name||'terminal');
  row.append(badge);
 }
 railKey.append(row,make('small','Badge colour matches the rail map. Check the train destination sign before boarding.'));
});
const live=$('mapLiveTransit'),liveStatus=document.querySelector('.map-transit-status');if(live)transit.append(live);if(liveStatus)transit.append(liveStatus);const liveDetail=document.querySelector(".map-live-transit-detail");if(liveDetail)transit.append(liveDetail);
const desk=$('metroTransitDesk');if(desk){desk.open=false;transit.append(desk);}
const guide=make('details'),summary=make('summary','New to transit?');guide.append(summary);
const guideText=make('p','Board = get on. Transfer = switch to another line. Check the train’s destination sign to confirm its direction, then count the stops in your route. TAP is LA Metro’s payment card/app. Live dots show vehicle locations, not guaranteed arrival times.');guide.append(guideText);transit.append(guide);
// Booking and delivery are secondary to choosing a route.
const extras=make('details');extras.id='mapBookingExtras';extras.append(make('summary','Rideshare, food & delivery'));
for(const selector of ['.map-transport-switcher','.map-transport-trip-note','#mapServiceLinks']){const node=planner.querySelector(selector);if(node)extras.append(node);}
planner.append(extras);
planner.querySelector('.map-transport-intro')?.remove();
for(const node of [...planner.children])if(node.tagName==='P'&&node.id!=='mapTripResult')node.remove();
const nav=$('mapNavControls');nav.hidden=true;
const turns=$('mapNavTurns'),turnsDetails=make('details');turnsDetails.append(make('summary','All directions'));if(turns){turns.before(turnsDetails);turnsDetails.append(turns);}
const prefs=make('details');prefs.append(make('summary','Voice, orientation & street names'));
for(const id of ['mapNavHeading','mapNavVoice','mapNavSpeakDestination','mapNavLearnStreets']){const n=$(id);if(n)prefs.append(id==='mapNavLearnStreets'?n.closest('label'):n);}
nav.append(prefs);
const result=$('mapTripResult'),choices=make('section');choices.id='mapRouteChoices';choices.hidden=true;result.after(choices);
const journey=make('section');journey.id='mapChosenJourney';journey.hidden=true;inputs.before(journey);
let route=null,serial=0;
const label={walking:'Walk',bicycling:'Bike',driving:'Drive'};
function rideEstimatePreview(forRoute=route){
 const api=window.BigLWATransportHub;
 if(!api||!forRoute||forRoute.mode!=='driving')return null;
 const rows=(api.getEstimates?.(forRoute)||[]).filter(row=>['uber','lyft','waymo'].includes(row.id));
 if(!rows.length)return null;
 const box=make('div');box.className='map-ride-estimate-preview';
 box.append(make('strong','Ride cost · BIG LWA model estimates'));
 const values=make('div');values.className='map-ride-estimate-row';
 for(const row of rows)values.append(make('span',row.name+' '+row.range));
 box.append(values,make('small','Planning ranges only — not provider quotes or offers.'),
  button('Open ride options',()=>api.openRideOptions?.()));
 return box;
}
function reset(){if(transit.parentElement!==inputs)inputs.append(transit);serial++;route=null;choices.replaceChildren();choices.hidden=true;journey.hidden=true;inputs.hidden=false;nav.hidden=true;document.body.classList.remove('map-route-focused');}
function choose(){if(!route)return;inputs.hidden=true;choices.hidden=true;journey.hidden=false;nav.hidden=false;document.body.classList.add('map-route-focused');journey.replaceChildren(make('h3',label[route.mode]+' to your destination'),make('p',(route.durationMinutes??'—')+' min estimated · '+route.distanceLabel),button('Change trip',()=>{window.dispatchEvent(new Event('biglwa:map-navigation-reset'));}));}
function offer(r){
 route=r;result.textContent=label[r.mode]+' · '+(r.durationMinutes??'—')+' min estimated · '+r.distanceLabel+' · No live traffic';
 choices.replaceChildren(make('h3','Your route'),make('p',label[r.mode]+' · '+(r.durationMinutes??'—')+' min estimated · '+r.distanceLabel),make('small','Estimated travel time excludes live traffic and stops.'));
 const preview=rideEstimatePreview(r);if(preview)choices.append(preview);
 choices.append(button('Use this route',choose),button('Compare walk, bike & drive',compare));choices.hidden=false;nav.hidden=true;
}
async function compare(){
 const token=++serial,original=route;if(!original)return;
 choices.replaceChildren(make('p','Comparing available routes…'));
 const rows=[];
 for(const mode of ['walking','bicycling','driving']){
  try{const r=mode===original.mode?original:await window.BigLWAMapRouteProvider.getRoute({...original,mode});if(token!==serial)return;rows.push({...r,origin:original.origin,destination:original.destination,mode});}catch{}
 }
 if(token!==serial)return;
 rows.sort((a,b)=>(a.durationMinutes??Infinity)-(b.durationMinutes??Infinity));
 choices.replaceChildren(make('h3','Compare your trip'),make('small','Fastest among available estimates. No live traffic; ride cost ranges are BIG LWA planning estimates, not provider quotes.'));
 for(const [i,r] of rows.entries()){
  choices.append(button((i===0?'Fastest estimate · ':'')+label[r.mode]+' · '+(r.durationMinutes??'—')+' min · '+r.distanceLabel,()=>{window.dispatchEvent(new CustomEvent('biglwa:map-route-select',{detail:r}));choose();}));
  if(r.mode==='driving'){const preview=rideEstimatePreview(r);if(preview)choices.append(preview);}
 }
 if(!rows.length)choices.append(make('p','Route comparison unavailable. Try again shortly.'));
}
window.addEventListener('biglwa:map-navigation-reset',reset);
window.addEventListener('biglwa:map-navigation-route',event=>offer(event.detail));
window.addEventListener('biglwa:map-transit-route',()=>{if(desk)desk.open=false;choices.hidden=false;choices.replaceChildren(button('Use this rail route',()=>{inputs.hidden=true;choices.hidden=true;journey.hidden=false;document.body.classList.add('map-route-focused');journey.replaceChildren(make('h3','Your rail journey'),make('p','LA Metro · $1.75 regular fare. Check departures before boarding.'),button('Change trip',()=>window.dispatchEvent(new Event('biglwa:map-navigation-reset'))));journey.append(transit);}));});
modes.addEventListener('click',()=>{transit.hidden=!modes.querySelector('[data-map-travel="transit"][aria-pressed="true"]');if(!transit.hidden&&desk)desk.open=false;});
// Places search is relevant only when requested, rather than covering the map.
const discover=$('mapDiscover');if(discover){discover.hidden=true;$('mapPublicPane')?.prepend(discover);}
$('mapTabnearby')?.addEventListener('click',()=>{if(discover)discover.hidden=false;});
// Keep culture/music/connect content beside the map, never above its canvas.
const panel=$('mapPurposePanel');if(panel){document.querySelector('main>aside')?.append(panel);}
const rail=$('mapPurposeRail');rail?.addEventListener('click',()=>{
 const purpose=rail.querySelector('[aria-pressed="true"]')?.textContent||'';
 document.body.classList.toggle('map-browse-panel',/Culture|Music|Connect/.test(purpose));
});
$('mapActionTabs')?.addEventListener('click',()=>{document.body.classList.remove('map-browse-panel');if(panel)panel.hidden=true;});
// Layers use the existing Leaflet control's inputs, preserving saved selection.
function layers(){
 const native=document.querySelector('.leaflet-control-layers');if(!native)return;
 const box=make('div');box.className='map-layer-picker';const caption=make('label','Map view '),select=make('select');select.setAttribute('aria-label','Map view');caption.append(select);box.append(caption);document.querySelector('.map-stage')?.append(box);
 const update=()=>{
  const bridge=window.BigLWAMapBridge,was3D=select.value==='3d';
  select.replaceChildren();
  for(const name of bridge.layers||[]){const option=make('option',name);option.value=name;option.selected=name===bridge.activeLayer;select.append(option)}
  select.append(new Option('3D buildings','3d'));if(was3D)select.value='3d';
 };
 update();window.addEventListener('biglwa:map-layers-changed',update);
 window.BigLWAMapBridge.map.on('baselayerchange',update);
 select.addEventListener('change',()=>{
  const choice=select.value;
  if(choice==='3d'){window.BigLWAMap3D?.open();return;}
  window.BigLWAMap3D?.close();window.BigLWAMapBridge.selectBase(choice);select.value=choice;
 });
 window.addEventListener('biglwa:map-3d-closed',()=>{select.value='';update()});
 const overlays=native.querySelector('.leaflet-control-layers-overlays');if(overlays){const more=make('details');more.append(make('summary','Map overlays'),overlays);box.append(more);}
 native.hidden=true;
}
if(window.BigLWAMapBridge)layers();else window.addEventListener('biglwa:map-ready-local',layers,{once:true});
})();
