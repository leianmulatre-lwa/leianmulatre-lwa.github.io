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
function placeCards(){
 return [
 '<article class="bl-search-card bl-route-result"><div class="bl-search-card-body">'+
 '<span class="bl-search-kicker">BIG LWA · Maps & directions</span><h3>Plan a trip</h3>'+
 '<p>Choose where you’re going and a travel mode. No location is read automatically.</p>'+
 '<form class="bl-lwazi-transit-form">'+
 '<label>From <input name="origin" type="text" maxlength="160" autocomplete="street-address" placeholder="Optional · current location"></label>'+
 '<label>To <input name="destination" type="text" maxlength="160" required placeholder="Place or address"></label>'+
 '<label>Travel by <select name="mode"><option value="transit">Public transit</option><option value="walking">Walking</option><option value="driving">Driving</option><option value="bicycling">Cycling</option></select></label>'+
 '<button class="bl-search-go bl-search-primary-action" type="submit">Get directions ↗</button>'+
 '</form><p class="bl-trip-note" role="status" aria-live="polite">Directions open in Google Maps. Live transit schedules and navigation are provided there.</p>'+
 '</div></article>',
 '<article class="bl-search-card bl-widget-result"><div class="bl-widget-symbol" aria-hidden="true">⌖</div><div class="bl-search-card-body">'+
 '<span class="bl-search-kicker">BIG LWA · Map</span><h3>Explore the map</h3><p>Discover places, save locations, and open your Map widget.</p>'+
 '<button type="button" class="bl-search-go bl-search-primary-action" data-lwazi-route="map">Open BIG LWA Map ↗</button>'+
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
 panel.addEventListener('submit',event=>{
  const form=event.target.closest('.bl-lwazi-transit-form');
  if(!form||!panel.contains(form))return;
  event.preventDefault();
  const data=new FormData(form);
  const to=String(data.get('destination')||'').trim().slice(0,160);
  const from=String(data.get('origin')||'').trim().slice(0,160);
  const mode=String(data.get('mode')||'transit');
  if(!to||!['transit','walking','driving','bicycling'].includes(mode))return;
  // This is an explicit handoff to a real routing engine, not fabricated
  // in-site live transit schedules. Addresses are not stored by L’wazi.
  const url=new URL('https://www.google.com/maps/dir/');
  url.searchParams.set('api','1');url.searchParams.set('destination',to);
  url.searchParams.set('travelmode',mode);
  if(from)url.searchParams.set('origin',from);
  window.open(url.href,'_blank','noopener,noreferrer');
  // noopener intentionally returns null in compliant browsers: never claim
  // the destination was blocked merely because the window is inaccessible.
  const note=form.parentElement?.querySelector('.bl-trip-note');
  if(note){
   note.textContent='Directions sent to Google Maps. If it did not open, use this link: ';
   const link=document.createElement('a');link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Open directions ↗';note.append(link);
  }
 });
}
window.BigLWADiscoveryExtras={widgetCards,videoCards,placeCards,attach};
})();