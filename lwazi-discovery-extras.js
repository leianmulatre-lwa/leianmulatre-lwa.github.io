/* BIG LWA · L'wazi: real Studio destinations, curated Stream videos,
   and a consent-free (no geolocation required) transit directions handoff. */
(function(){
'use strict';
if(window.BigLWADiscoveryExtras)return;
const esc=value=>String(value==null?'':value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const names={
 aura:'Aura',avatar:'Avatar',music:'Jam · Tunes',diary:'Journal',notes:'Sqwidz',
 camera:'Booth',projects:'Projects',closet:'Closet',archive:'Archive',
 library:'Library',calendar:'Calendar',stream:'Stream',politic:'Politic',
 map:'Map',games:'Games',orbit:'Orbit',boards:'Boards',connect:'Connect',
 trophies:'Trophies',tools:'Lwazi · Workshop',feed:'MyFeed',room:'Rooms',
 rooms:'Rooms',veve:'Veve',logs:'Logs',learn:'Learn',didyouknow:'Did You Know'
};
const icons={
 aura:'◉',avatar:'◎',music:'♫',diary:'▤',notes:'♧',camera:'◉',
 projects:'▥',closet:'▧',archive:'▤',library:'▥',calendar:'▦',
 stream:'◌',politic:'△',map:'⌖',games:'▣',orbit:'◎',boards:'▦',
 connect:'✣',trophies:'♛',tools:'✋',feed:'▧',room:'⌂',veve:'✺'
};
function widgetCards(){
 const visible=new Map();
 document.querySelectorAll('#studioApp [data-sidebar-route-row],#studioApp [data-shortcut-row]').forEach(el=>{
  const route=el.getAttribute('data-sidebar-route-row')||el.getAttribute('data-shortcut-row');
  if(route&&names[route]&&!visible.has(route))visible.set(route,names[route]);
 });
 // Catalog includes widgets currently minimized or hidden in Skeleton Key.
 // No private account data or user-created widget values are collected.
 Object.entries(names).forEach(([id,name])=>{if(!visible.has(id))visible.set(id,name)});
 return [...visible].map(([id,title])=>
  '<article class="bl-search-card bl-widget-result" data-bl-route="'+esc(id)+'">'+
  '<div class="bl-widget-symbol" aria-hidden="true">'+esc(icons[id]||'◈')+'</div>'+
  '<div class="bl-search-card-body"><span class="bl-search-kicker">Skeleton Key · Widget</span>'+
  '<h3>'+esc(title)+'</h3><button type="button" class="bl-search-go bl-search-primary-action" data-lwazi-route="'+esc(id)+'">Open widget ↗</button>'+
  '</div></article>');
}
function allVideos(){
 const guide=window.BigLWAStreamGuide;
 const known=[
  {id:'cn-steven',title:'Cartoon Network',subtitle:'Steven Universe · Here Comes a Thought',creator:'Cartoon Network',source:'Official animation',videoId:'dHg50mdODFM',url:'https://www.youtube.com/watch?v=dHg50mdODFM'},
  {id:'markiplier-scary',title:'Markiplier',subtitle:'3 SCARY GAMES #9',creator:'Markiplier',source:'Gaming',videoId:'abHGyg4LKn4',url:'https://www.youtube.com/watch?v=abHGyg4LKn4'},
  {id:'cory-sss',title:'CoryxKenshin',subtitle:'Spooky Scary Sunday Is Back',creator:'CoryxKenshin',source:'Gaming',videoId:'edk2uac_x0Y',url:'https://www.youtube.com/watch?v=edk2uac_x0Y'},
  {id:'quenlin',title:'Quenlin Blackwell',subtitle:"Feeding Starving Celebrities ft. Charli D'Amelio",creator:'Quenlin Blackwell',source:'Official YouTube episode',videoId:'XC7XiNVk_M4',url:'https://www.youtube.com/watch?v=XC7XiNVk_M4'}
 ];
 // Fallback is a subset of the already-curated Stream guide, not made-up IDs.
 const all=[...(guide?.featured||known),...(guide?.ballroom||[])];
 const unique=new Set();
 return all.filter(item=>{
  if(!/^[a-zA-Z0-9_-]{11}$/.test(item.videoId||'')||!item.id||unique.has(item.videoId))return false;
  unique.add(item.videoId);return true;
 });
}
function videoCards(q,all=false){
 const words=String(q||'').toLowerCase().match(/[a-z0-9]{3,}/g)||[];
 const videos=allVideos();
 const matches=videos.filter(v=>words.length&&words.some(w=>
   [v.title,v.subtitle,v.creator,v.source].join(' ').toLowerCase().includes(w)));
 const chosen=(matches.length?matches:all?videos.slice(0,10):[]).slice(0,8);
 return chosen.map(v=>{
  const src='https://i.ytimg.com/vi/'+v.videoId+'/hqdefault.jpg';
  return '<article class="bl-search-card bl-media-card bl-stream-video" data-bl-destination="'+esc(v.url||'')+'">'+
   '<img class="bl-search-card-media" src="'+src+'" alt="" loading="lazy" decoding="async">'+
   '<div class="bl-search-card-body"><span class="bl-search-kicker">Stream · '+esc(v.source||'Video')+'</span>'+
   '<h3>'+esc(v.subtitle||v.title)+'</h3><p>'+esc(v.creator||v.title)+'</p>'+
   '<button class="bl-search-go bl-search-primary-action" type="button" data-bl-watch-stream="'+esc(v.id)+'">Watch on Stream ↗</button>'+
   '</div></article>';
 });
}
function placePromo(){
 return '<aside class="bl-lwazi-map-promo" aria-label="Try Places and Maps">'+
  '<div class="bl-lwazi-promo-art" role="img" aria-label="Stylized street map and location marker"><span class="bl-map-marker">⌖</span></div>'+
  '<div class="bl-lwazi-promo-content"><h3>⌖ Places & Maps <small>Beta</small></h3>'+
  '<p>Find places, get directions, and explore nearby.</p>'+
  '<div class="bl-lwazi-promo-actions">'+
  '<button type="button" data-bl-use-location>⌖ Use current location</button>'+
  '<button type="button" data-bl-open-places="transit">▣ Transit</button>'+
  '<button type="button" data-bl-open-places="walking">♙ Walk</button>'+
  '<button type="button" data-bl-open-places="driving">▱ Drive</button>'+
  '<button type="button" data-bl-open-places="bicycling">♧ Bike</button>'+
  '</div><p class="bl-trip-note" role="status" aria-live="polite"></p></div>'+
  '</aside>';
}
function placeCards(){
 return [
 '<article class="bl-search-card bl-route-result bl-lwazi-map-card"><div class="bl-search-card-body">'+
 '<span class="bl-search-kicker">BIG LWA · Maps & directions</span><h3>Plan a trip</h3>'+
 '<p>Explore the interactive map. Your location is optional and is used only after you ask.</p>'+
 '<div class="bl-lwazi-map-stage"><iframe loading="lazy" src="/map-app.html?preview=1&lwazi=1&v=20261113-stay-2" title="Interactive BIG LWA map preview" referrerpolicy="same-origin"></iframe>'+
 '<button type="button" class="bl-lwazi-use-location" data-bl-use-location>⌖ Use current location</button></div>'+
 '<form class="bl-lwazi-transit-form">'+
 '<label>From <input name="origin" type="text" maxlength="160" autocomplete="off" placeholder="Starting place or coordinates (optional)"></label>'+
 '<label>To <input name="destination" type="text" maxlength="160" required placeholder="Place or address"></label>'+
 '<label>Travel by <select name="mode"><option value="transit">Public transit</option><option value="walking">Walking</option><option value="driving">Driving</option><option value="bicycling">Cycling</option></select></label>'+
 '<button class="bl-search-go bl-search-primary-action" type="submit">Show route on BIG LWA ↗</button>'+
 '</form><p class="bl-trip-note" role="status" aria-live="polite">Routes display here on BIG LWA. Live traffic and transit arrival feeds are not connected yet.</p>'+
 '</div></article>',
 '<article class="bl-search-card bl-widget-result"><div class="bl-widget-symbol" aria-hidden="true">⌖</div><div class="bl-search-card-body">'+
 '<span class="bl-search-kicker">BIG LWA · Map</span><h3>Open the full map</h3><p>Explore places, save pins and see the complete map tools.</p>'+
 '<button type="button" class="bl-search-go bl-search-primary-action" data-lwazi-route="map">Open Map widget ↗</button>'+
 '</div></article>'
 ];
}
function watchOnStream(id){
 if(!/^[a-zA-Z0-9_-]{2,120}$/.test(id))return;
 window.__biglwaOpenSearchRoute?.('stream');
 let tried=0;
 const reveal=()=>{
  const target=document.querySelector('[data-stream-feature="'+id+'"]');
  if(target){target.click();return}
  if(++tried<7)setTimeout(reveal,180);
 };
 setTimeout(reveal,120);
}
function attach(panel){
 if(!panel||panel.dataset.lwaziExtrasBound)return;
 panel.dataset.lwaziExtrasBound='true';
 panel.addEventListener('click',event=>{
  const watch=event.target.closest('[data-bl-watch-stream]');
  if(watch&&panel.contains(watch)){event.preventDefault();watchOnStream(watch.dataset.blWatchStream)}
 });
 function revealPlaces(mode){
  window.__biglwaOpenSearchCategory?.('places');
  const select=panel.querySelector('.bl-lwazi-transit-form select[name="mode"]');
  if(select&&mode)select.value=mode;
 }
 panel.addEventListener('click',event=>{
  const choice=event.target.closest('[data-bl-open-places]');
  if(choice&&panel.contains(choice)){event.preventDefault();revealPlaces(choice.dataset.blOpenPlaces);return}
  const locate=event.target.closest('[data-bl-use-location]');
  if(!locate||!panel.contains(locate))return;
  event.preventDefault();
  if(!navigator.geolocation){
   const status=locate.closest('.bl-lwazi-map-card,.bl-lwazi-map-promo')?.querySelector('.bl-trip-note');
   if(status)status.textContent='Location unavailable. You can search for a city or landmark instead.';
   return;
  }
  const wrapper=locate.closest('.bl-lwazi-map-card,.bl-lwazi-map-promo');
  const status=wrapper?.querySelector('.bl-trip-note');
  if(status)status.textContent='Requesting your permission to locate approximately…';
  locate.disabled=true;
  navigator.geolocation.getCurrentPosition(position=>{
   // Coarse coordinates (about 1km resolution), never save or log precise GPS.
   const lat=Math.round(position.coords.latitude*100)/100;
   const lng=Math.round(position.coords.longitude*100)/100;
   if(!Number.isFinite(lat)||!Number.isFinite(lng)){if(status)status.textContent='Unable to read the location.';locate.disabled=false;return}
   if(wrapper?.classList.contains('bl-lwazi-map-promo'))revealPlaces();
   const destinationPanel=document.getElementById('bl-studio-search-results');
   const frame=destinationPanel?.querySelector('.bl-lwazi-map-stage iframe');
   const input=destinationPanel?.querySelector('.bl-lwazi-transit-form input[name="origin"]');
   const note=destinationPanel?.querySelector('.bl-lwazi-map-card .bl-trip-note');
   if(input)input.value=lat.toFixed(2)+','+lng.toFixed(2);
   if(note)note.textContent='Approximate location shown (about 1 km precision). No location saved.';
   const message={type:'biglwa:lwazi-map-location',lat,lng};
   if(frame){
     frame.contentWindow?.postMessage(message,location.origin);
     frame.addEventListener('load',()=>frame.contentWindow?.postMessage(message,location.origin),{once:true});
   }
   if(status)status.textContent='Approximate location found. View it in Places & Maps.';
   locate.disabled=false;
  },error=>{
   if(status)status.textContent=error?.code===1?'Location permission denied. Search for a place instead.':'Location is unavailable. Enter a city or landmark instead.';
   locate.disabled=false;
  },{enableHighAccuracy:false,timeout:11000,maximumAge:300000});
 });
 window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.data?.type!=='biglwa:lwazi-route-status')return;
  const frame=panel.querySelector('.bl-lwazi-map-card .bl-lwazi-map-stage iframe');
  if(!frame||event.source!==frame.contentWindow)return;
  const note=panel.querySelector('.bl-lwazi-map-card .bl-trip-note');
  if(note)note.textContent=String(event.data.text||'').slice(0,450);
 });
 panel.addEventListener('submit',event=>{
  const form=event.target.closest('.bl-lwazi-transit-form');
  if(!form||!panel.contains(form))return;
  event.preventDefault();
  const data=new FormData(form);
  const to=String(data.get('destination')||'').trim().slice(0,160);
  const from=String(data.get('origin')||'').trim().slice(0,160);
  const mode=String(data.get('mode')||'transit');
  if(!to||!['transit','walking','driving','bicycling'].includes(mode))return;
  // Keep the result in L'wazi's existing map iframe. No external tab.
  const stage=form.closest('.bl-lwazi-map-card')?.querySelector('.bl-lwazi-map-stage');
  const frame=stage?.querySelector('iframe');
  const note=form.parentElement?.querySelector('.bl-trip-note');
  if(!frame){if(note)note.textContent='Map preview unavailable. Open the BIG LWA Map widget instead.';return;}
  // A destination alone recenters the map; a starting place gives a route.
  if(note)note.textContent='Finding your route inside BIG LWA…';
  stage?.classList.add('bl-lwazi-route-active');
  const request={type:'biglwa:lwazi-map-trip',from,to,mode};
  const send=()=>frame.contentWindow?.postMessage(request,location.origin);
  try{
    if(frame.contentDocument?.readyState==='complete')send();
    else frame.addEventListener('load',send,{once:true});
  }catch{frame.addEventListener('load',send,{once:true});}
 });
}
window.BigLWADiscoveryExtras={widgetCards,videoCards,placeCards,placePromo,attach};
})();