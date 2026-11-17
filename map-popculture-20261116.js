/* BIG LWA Map · Pop Culture: real, source-linked music and screen places.
 * Only selected venue geocodes through OSM Nominatim: one user click, one
 * request. No GPS, profile inference, stored search, or fabricated live events.
 * Markers live in a separate layer, never in the member's saved pins.
 */
(()=>{'use strict';
 if(window.BigLWAMapCulture)return;
 const venues=[
  {id:'leimert',group:'Culture',emoji:'🎨',name:'Leimert Park Plaza',address:'4343 Leimert Blvd, Los Angeles, CA 90008, USA',note:'A Los Angeles gathering place for Black creative and community life.',source:'https://culture.lacity.gov/venue/leimert-park-plaza'},
  {id:'griffith',group:'Film & TV',emoji:'🎬',name:'Griffith Observatory',address:'2800 E Observatory Rd, Los Angeles, CA 90027, USA',note:'La La Land and Rebel Without a Cause on location.',source:'https://griffithobservatory.lacity.gov/support/la-la-land-2026/'},
  {id:'chinese',group:'Film & TV',emoji:'🎞',name:'TCL Chinese Theatre',address:'6925 Hollywood Blvd, Los Angeles, CA 90028, USA',note:'Hollywood cinema and movie-premiere history.',source:'https://www.tclchinesetheatres.com/contact-us'},
  {id:'warner',group:'Film & TV',emoji:'📺',name:'Warner Bros. Studio Tour',address:'3400 Warner Blvd, Burbank, CA 91505, USA',note:'The backlots, screen history and TV sets.',source:'https://www.wbstudiotour.com/tour/studio/'},
  {id:'apollo',group:'Culture',emoji:'🎤',name:'Apollo Historic Theater',address:'253 W 125th St, New York, NY 10027, USA',note:'Harlem landmark for Black performance and music history.',source:'https://www.apollotheater.org/contact-us'},
  {id:'motown',group:'Music',emoji:'🎙',name:'Motown Museum',address:'2648 W Grand Blvd, Detroit, MI 48208, USA',note:'Hitsville U.S.A.: soul music history and Studio A.',source:'https://www.motownmuseum.org/visit/'},
  {id:'stax',group:'Music',emoji:'🎷',name:'Stax Museum',address:'926 E McLemore Ave, Memphis, TN 38106, USA',note:'The Stax Records legacy and American soul music.',source:'https://staxmuseum.org/'},
  {id:'firstavenue',group:'Music',emoji:'🎸',name:'First Avenue',address:'701 N 1st Ave, Minneapolis, MN 55403, USA',note:'Independent music landmark in Minneapolis.',source:'https://first-avenue.com/venue/first-avenue/'},
  {id:'paisley',group:'Music',emoji:'💜',name:'Paisley Park',address:'7801 Audubon Rd, Chanhassen, MN 55317, USA',note:'Prince’s home, studio and creative world.',source:'https://www.paisleypark.com/'}
 ];
 const el=(tag,cls,text)=>{
  const node=document.createElement(tag);if(cls)node.className=cls;
  if(text!==undefined)node.textContent=text;return node;
 };
 const cached=new Map();
 let layer=null,currentGroup='All',pending=false,lastRequest=0;
 const getMap=()=>window.BigLWAMapBridge;
 const source=(name,url)=>{
  const a=el('a','map-culture-source',name);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;
 };
 function clear(){
  const bridge=getMap();
  if(layer&&bridge?.map){bridge.map.removeLayer(layer);layer=null}
 }
 function markerFor(venue,coords){
  const bridge=getMap();if(!bridge?.map||!bridge.L)throw Error('The live Map is not ready.');
  clear();const L=bridge.L;
  const icon=L.divIcon({className:'map-culture-leaflet-marker',
   html:'<span aria-hidden="true">'+venue.emoji+'</span>',iconSize:[36,36],iconAnchor:[18,34]});
  layer=L.layerGroup().addTo(bridge.map);
  const marker=L.marker(coords,{icon}).addTo(layer);
  const popup=el('section','map-culture-popup');
  popup.append(el('strong','',venue.emoji+' '+venue.name),el('p','',venue.note));
  popup.append(source('Official venue/source ↗',venue.source));
  marker.bindPopup(popup,{maxWidth:240}).openPopup();
  bridge.map.flyTo(coords,14,{animate:true,duration:.65});
 }
 async function show(venue,status,button){
  if(pending){status.textContent='Another location is being checked. Please retry after it finishes.';return}
  if(!getMap()?.map){status.textContent='Map tiles are still opening. Retry when the map is ready.';return}
  pending=true;button.disabled=true;
  status.textContent='Finding '+venue.name+' on the real map…';
  try{
   let coords=cached.get(venue.id);
   if(!coords){
    // OSM usage: no bulk geocoding; a click initiates one named-place request.
    const lag=Math.max(0,1300-(Date.now()-lastRequest));
    if(lag)await new Promise(resolve=>setTimeout(resolve,lag));
    lastRequest=Date.now();
    const query=new URLSearchParams({format:'jsonv2',q:venue.address,limit:'1'});
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),9000);
    let response;
    try{response=await fetch('https://nominatim.openstreetmap.org/search?'+query,
      {headers:{Accept:'application/json'},signal:controller.signal});}
    finally{clearTimeout(timer)}
    if(!response.ok)throw Error('Map address lookup unavailable ('+response.status+').');
    const items=await response.json();
    const place=Array.isArray(items)?items[0]:null;
    const lat=Number(place?.lat),lon=Number(place?.lon);
    if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)
     throw Error('This address could not be located automatically.');
    coords=[lat,lon];cached.set(venue.id,coords);
   }
   markerFor(venue,coords);
   status.textContent='Located '+venue.name+'. The marker links to its official source.';
  }catch(error){
   status.textContent=String(error?.message||error)+
    ' Use the official source or enter its address in Routes.';
  }finally{pending=false;button.disabled=false}
 }
 function render(host,helpers={}){
  if(!host)return;host.replaceChildren();
  const title=el('h3','','Culture is a place, too.');
  const caption=el('p','map-culture-intro',
    'Follow the sounds, scenes and neighborhoods that shaped pop culture. Curated places, not live event listings.');
  host.append(title,caption);
  const history=el('section','map-culture-history');
  history.append(el('h3','','This day in pop culture'));
  const news=el('p','','Loading the latest history entry…');history.append(news);host.append(history);
  fetch('https://public-api.wordpress.com/rest/v1.1/sites/writerofpop.com/posts/?number=1&search=Pop%20Culture%20Flashback&fields=title,excerpt,URL,date', {signal:AbortSignal.timeout(9000)})
   .then(r=>{if(!r.ok)throw Error();return r.json()})
   .then(data=>{
    const post=data.posts?.[0];if(!post)throw Error();
    const url=new URL(post.URL);if(url.protocol!=='https:'||url.hostname!=='writerofpop.com')throw Error();
    const plain=html=>new DOMParser().parseFromString(String(html),'text/html').body.textContent.trim();
    const words=plain(post.title).split(/\s+/).slice(0,20);
    const excerpt=plain(post.excerpt).split(/\s+/).slice(0,Math.max(0,25-words.length)).join(' ');
    news.replaceChildren(el('strong','',words.join(' ')),el('p','',excerpt+'…'),source('Read the full story · Writer of Pop Culture ↗',url.href));
   }).catch(()=>{news.textContent='History is temporarily unavailable. Try Culture again shortly.';});
  const tabs=el('div','map-culture-categories');tabs.setAttribute('role','group');
  tabs.setAttribute('aria-label','Cultural location categories');host.append(tabs);
  const gallery=el('div','map-culture-grid');host.append(gallery);
  const status=el('p','map-culture-status','Choose a place to bring it onto this Map.');
  status.setAttribute('role','status');
  const attribution=el('p','map-culture-attribution',
    'Locations are sourced from venue websites. Map coordinates use OpenStreetMap Nominatim only when you select Show on map. No live opening status is implied.');
  host.append(status,attribution);
  function paint(){
   gallery.replaceChildren();
   [...tabs.children].forEach(tab=>tab.setAttribute('aria-pressed',String(tab.dataset.category===currentGroup)));
   const list=venues.filter(v=>currentGroup==='All'||v.group===currentGroup);
   for(const venue of list){
    const card=el('article','map-culture-card');
    const heading=el('strong','',venue.emoji+' '+venue.name);
    const group=el('small','',venue.group+' · '+venue.address.split(',').slice(-3,-1).join(',').trim());
    const note=el('p','',venue.note);
    const actions=el('div','map-culture-actions');
    const locate=el('button','map-culture-locate','⌖ Show on map');locate.type='button';
    locate.addEventListener('click',()=>show(venue,status,locate));
    const route=el('button','map-culture-route','↗ Route there');route.type='button';
    route.addEventListener('click',()=>{
     const to=document.getElementById('mapTripTo');
     if(!to){status.textContent='Route planner unavailable. Open Routes and enter the address.';return}
     to.value=venue.address;to.dispatchEvent(new Event('input',{bubbles:true}));
     helpers.onRoute?.();
     status.textContent='Destination set to '+venue.name+'. Choose your starting point and Explore trip.';
    });
    actions.append(locate,route,source('Source ↗',venue.source));
    card.append(heading,group,note,actions);gallery.append(card);
   }
  }
  for(const group of ['All','Music','Film & TV','Culture']){
   const button=el('button','map-culture-tab',group);button.type='button';
   button.dataset.category=group;button.addEventListener('click',()=>{currentGroup=group;paint()});
   tabs.append(button);
  }
  paint();
 }
 window.BigLWAMapCulture=Object.freeze({render,clear,venues:venues.length});
})();