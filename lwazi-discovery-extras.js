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
const icons={aura:'☥',avatar:'◎',music:'♫',diary:'⚘',notes:'♧',projects:'▥',closet:'⚯',archive:'▤',library:'▥',calendar:'▦',stream:'◌',politic:'△',politc:'△',map:'⌖',games:'♔',orbit:'◎',boards:'▦',connect:'⌘',trophies:'★',tools:'',feed:'',camera:'◉',room:'◇',veve:'✺'};
function symbol(id){
 const route=id==='politic'?'politc':id;
 const source=document.querySelector('#studioApp [data-sidebar-route-row="'+route+'"] .sidebar-route-icon,#studioApp [data-shortcut-row="'+route+'"] .sidebar-route-icon,#studioApp #'+route+' .card-icon');
 const artwork=source&&(source.matches('svg,img')?source:source.querySelector('svg,img'));
 if(artwork){const copy=artwork.cloneNode(true);[copy,...copy.querySelectorAll('*')].forEach(n=>{n.removeAttribute('id');n.removeAttribute('style');n.removeAttribute('class')});return copy.outerHTML}
 if(source?.textContent.trim())return esc(source.textContent.trim());
 const assets={tools:'tools-hand-eye.svg',politc:'politc-nyame-baatanpa.svg',studio:'studio-tipi-symbol.svg',feed:'feed-symbol-generated.png',diary:'diary-symbol-generated.png',notes:'quick-notes-symbol-generated.png',projects:'projects-symbol.svg',closet:'closet-symbol.png'};
 return assets[route]?'<img src="/assets/'+assets[route]+'" alt="">':esc(icons[route]||'◇');
}
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
  '<div class="bl-widget-symbol" aria-hidden="true">'+symbol(id)+'</div>'+
  '<div class="bl-search-card-body"><span class="bl-search-kicker">Skeleton Key · Widget</span>'+
  '<h3>'+esc(title)+'</h3><button type="button" class="bl-search-go bl-search-primary-action" data-lwazi-route="'+esc(id)+'">Open widget ↗</button>'+
  '</div></article>').concat([
   ['image-desk','sqwibblR','Draw, paint and edit locally'],
   ['visualizr','visualizr','Build visual boards and slides'],
   ['photocraft','lightR','Layered photo editor'],
   ['vectorcraft','paintR','Vector editor'],
   ['effectcraft','keyframeR','Timeline and effects editor'],
   ['pdfcraft','fileR','PDF and document editor']
  ].map(([id,title,description])=>
   '<article class="bl-search-card bl-widget-result bl-craft-app-result" data-bl-craft-app-card="'+esc(id)+'">'+
   '<img class="bl-craft-app-symbol" src="/assets/bigapps/icons/'+esc(title)+'.png?v=20261026-original-stitch-1" alt="">'+
   '<div class="bl-search-card-body"><span class="bl-search-kicker">L’wazi · R Workshop</span><h3>'+esc(title)+'</h3>'+
   '<p>'+esc(description)+'</p><button type="button" class="bl-search-go bl-search-primary-action" data-bl-craft-app="'+esc(id)+'">Open R app ↗</button></div></article>'
  ));
}
// Route recognizable tool-search intent to REAL first-party destinations.
 // These are alternatives for specific tasks, not claims of Adobe or Microsoft
 // compatibility, equivalent feature sets, or unrelated ad landing pages.
function toolIntentCards(query){
 const q=String(query||'').toLowerCase().trim();
 if(!q||q.length>220)return [];
 const visual=/(?:free\s+adobe|photoshop|illustrator|after\s*effects|photo\s*editor|image\s*editor|vector\s*editor|pdf\s*editor|free\s*design\s*tools?|creative\s*software)/i.test(q);
 const slides=/(?:powerpoint|power\s*point|google\s*slides?|slides?\s*(?:maker|editor|alternative)|presentation\s*(?:maker|editor|software)|visualslidez)/i.test(q);
 const games=/(?:free\s+(?:browser\s+|online\s+)?games?|browser\s+games?|arcade\s+games?|2048|play\s+games?)/i.test(q);
 if(!visual&&!slides&&!games)return [];
 const result=[];
 const make=(title,description,type,id)=>{
  const attribute=type==='app'?'data-bl-craft-app':'data-lwazi-route';
  return '<article class="bl-search-card bl-widget-result bl-free-tool-result"><div class="bl-search-card-body">'+
   '<span class="bl-search-kicker">BIG LWA · free creative tools</span>'+
   '<h3>'+esc(title)+'</h3><p>'+esc(description)+'</p>'+
   '<button type="button" class="bl-search-go bl-search-primary-action" '+attribute+'="'+esc(id)+'">Open in Studio ↗</button>'+
   '</div></article>';
 };
 if(visual){
  result.push(make('lightR · image editing','Photos, layers and compositing; not Adobe Photoshop.','app','photocraft'));
  result.push(make('paintR · vector drawing','Vector paths and editable artwork; not Adobe Illustrator.','app','vectorcraft'));
  result.push(make('keyframeR · motion','Timeline, effects and simple animation workflows.','app','effectcraft'));
  result.push(make('fileR · PDF work','Read and edit PDFs in the R workshop.','app','pdfcraft'));
 }
 if(slides)result.push(make('visualslidez · presentations','Build and edit slide decks inside visualize/r; PowerPoint import is supported.','route','projects'));
 if(games)result.push(make('Games · browser arcade','Open BIG LWA’s playable games, including the in-Studio arcade.','route','games'));
 result.push('<article class="bl-search-card bl-widget-result bl-free-tool-result"><div class="bl-search-card-body">'+
  '<span class="bl-search-kicker">BIG LWA · guide</span><h3>Free tools & alternatives</h3>'+
  '<p>What each editor can do, what it cannot, and where to begin.</p>'+
  '<a class="bl-search-go bl-search-primary-action" href="/free-tools/">Explore free tools ↗</a></div></article>');
 return result.slice(0,7);
}
// Search suggestions link genuine public guides to implemented Studio modules.
// They are not injected indiscriminately into unrelated questions.
function discoveryIntentCards(query){
 const q=String(query||'').toLowerCase().trim();
 if(!q||q.length>180)return [];
 const matches=[
  {test:/(?:multiplayer(?:\s+(?:games?|online))?|(?:free|online|browser)\s+games?|arcade\s+games?)/i,
   name:'Online games & multiplayer discovery',text:'BIG LWA arcade, external multiplayer listings and actual provider limits.',guide:'/online-games/',route:'games'},
  {test:/(?:fare\s+(?:checker|compare|comparison|estimate)|uber\s+(?:estimate|price|fare)|lyft\s+(?:fare|price)|ride\s+price|rideshare\s+compare|food\s+delivery\s+fees)/i,
   name:'Routes & fare-checking guide',text:'Map routes and provider choices; live fares require approved connections.',guide:'/fare-checker/',route:'map'},
  {test:/(?:live\s+(?:shows?|streams?|programming|music)|watch\s+live|streaming\s+shows?)/i,
   name:'Live shows & Stream',text:'Curated live-source broadcasts and music, with schedules controlled by their creators.',guide:'/live-shows/',route:'stream'},
  {test:/(?:eat\s+the\s+rich|wealth\s+inequality|political\s+power|income\s+distribution)/i,
   name:'Wealth, power & public-record research',text:'Examine rhetoric, inequality and policy with identifiable sources.',guide:'/power-and-politics/',route:'politc'},
  {test:/(?:free\s+(?:encyclop(?:edia|a?edia)|knowledge|research|books?)|open\s+encyclop(?:edia|a?edia)|public\s+domain\s+books?)/i,
   name:'Free knowledge & encyclopedias',text:'Books, archives, encyclopedias and first-party L’wazi research tools.',guide:'/free-knowledge/',route:'library'},
  {test:/(?:connect\s+(?:(?:my|your|our)\s+)?(?:social\s+)?(?:media|accounts?|platforms?)|social\s+body|link\s+instagram|import\s+(?:pinterest|instagram|tiktok))/i,
   name:'Connect your social platforms with Orbit',text:'Optional provider connections, permission boundaries and supported imports.',guide:'/connect-social-platforms/',route:'orbit'}
 ];
 return matches.filter(x=>x.test.test(q)).slice(0,3).map(x=>
  '<article class="bl-search-card bl-widget-result bl-feature-discovery-result"><div class="bl-search-card-body">'+
  '<span class="bl-search-kicker">BIG LWA · Explore</span><h3>'+esc(x.name)+'</h3>'+
  '<p>'+esc(x.text)+'</p><div class="bl-feature-discovery-actions">'+
  '<button class="bl-search-go bl-search-primary-action" type="button" data-lwazi-route="'+esc(x.route)+'">Open in Studio ↗</button> '+
  '<a class="bl-search-go" href="'+esc(x.guide)+'">Read feature guide ↗</a></div></div></article>'
 );
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
 const videos=[...new Map([...(window.BigLWADiscoveryCatalog?.data.videos||[]),...allVideos()].map(v=>[v.videoId,v])).values()];
 const score=window.BigLWADiscoveryCatalog?.score;
 const matches=score?videos.filter(v=>score(v,q)>0).sort((a,b)=>score(b,q)-score(a,q)):videos.filter(v=>words.some(w=>[v.title,v.subtitle,v.creator,v.source].join(' ').toLowerCase().includes(w)));
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
function mediaCards(items){return items.map(item=>'<article class="bl-search-card bl-media-card" data-bl-media-kind="'+(item.video?'video':'image')+'">'+(item.image?'<img class="bl-search-card-media" src="'+esc(item.image)+'" alt="" loading="lazy">':'')+'<div class="bl-search-card-body"><span class="bl-search-kicker">Public Veve · '+esc(item.source)+'</span><h3>'+esc(item.title)+'</h3><button type="button" data-bl-veve-view="'+esc(item.id)+'">'+(item.video?'Watch':'View')+' in Veve</button></div></article>')}
function herstoryCards(items,query,all){
 const score=window.BigLWADiscoveryCatalog?.score||(()=>0);
 const chosen=items.filter(item=>all||score(item,query)>0).sort((a,b)=>{
  const focus=x=>/black|brown|indigenous|native|latina|latinx|women of color/i.test(x.title+' '+x.excerpt)?1:0;
  return focus(b)-focus(a)||String(b.publishedAt).localeCompare(String(a.publishedAt));
 }).slice(0,10);
 return chosen.map(item=>'<article class="bl-search-card"><div class="bl-search-card-body"><span class="bl-search-kicker">Herstory · '+esc(item.source)+'</span><h3>'+esc(item.title)+'</h3><p>'+esc(item.excerpt.replace(/&[^;]+;/g,' ').slice(0,220))+'</p><small>'+esc(item.publishedAt?new Date(item.publishedAt).toLocaleDateString():'Publisher date unavailable')+' · Recent source stories, not a popularity ranking</small><a class="bl-search-go bl-search-primary-action" href="'+esc(item.url)+'" target="_blank" rel="noopener noreferrer">Read original story ↗</a></div></article>');
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
 '<article class="bl-search-card bl-widget-result bl-fare-card"><div class="bl-widget-symbol" aria-hidden="true">⌖</div><div class="bl-search-card-body">'+
 '<span class="bl-search-kicker">BIG LWA · Map</span><h3>Trip costs & tools</h3><p>Compare pricing information here; open the full map for saved places and navigation.</p>'+
 '<button type="button" class="bl-search-go bl-search-primary-action" data-lwazi-route="map">Open Map widget ↗</button>'+
 '</div></article>'
 ];
}
function watchOnStream(id){
 if(!/^[a-zA-Z0-9_-]{2,120}$/.test(id))return;
 window.__biglwaOpenSearchRoute?.('stream');
 let tried=0;
 const reveal=()=>{
  if(window.BigLWAStreamGuide?.openFeature){window.BigLWAStreamGuide.openFeature(id);return;}
  const target=document.querySelector('[data-stream-feature="'+id+'"]');
  if(target){target.click();return}
  if(++tried<7)setTimeout(reveal,180);
 };
 setTimeout(reveal,120);
}
function attach(panel){
 if(!panel||panel.dataset.lwaziExtrasBound)return;
 panel.dataset.lwaziExtrasBound='true';
 const mountFares=()=>{const host=panel.querySelector('.bl-fare-card .bl-search-card-body');if(host)window.BigLWASourceBrief?.fares(host);};
 if(typeof MutationObserver!=='undefined'){const fareObserver=new MutationObserver(mountFares);fareObserver.observe(panel,{childList:true,subtree:true});}mountFares();
 panel.addEventListener('click',event=>{
  const media=event.target.closest('[data-bl-veve-view]');if(media){event.preventDefault();window.BigLWAVeve?.openPost(media.dataset.blVeveView);return;}
  const rButton=event.target.closest('[data-bl-craft-app]');
  if(rButton&&panel.contains(rButton)){
    event.preventDefault();
    const id=rButton.dataset.blCraftApp;
    if(typeof window.BigLWAOpenCraftApp==='function')window.BigLWAOpenCraftApp(id);
    else window.__biglwaOpenSearchRoute?.('tools');
    return;
  }
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
  const fareHost=panel.querySelector('.bl-fare-card .bl-search-card-body');
  if(fareHost)window.BigLWASourceBrief?.fares(fareHost);
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
window.BigLWADiscoveryExtras={symbol,mediaCards,herstoryCards,widgetCards,videoCards,placeCards,placePromo,toolIntentCards,discoveryIntentCards,attach};
})();