/* Big LWA Stream — independent programming guide and radio directory.
   No campus station is represented as an official BIG LWA partner.
   Submitted videos are not scheduled until a moderator approves them. */
(function(){
 'use strict';
 if(window.BigLWAStreamGuide)return;
 const API='https://biglwa-instagram-api.leianmulatre-284.workers.dev/stream/';
 const stations=[
  ['UCLA Radio','UCLA','California','https://uclaradio.com/'],
  ['KALX 90.7','UC Berkeley','California','https://kalx.berkeley.edu/'],
  ['KDVS 90.3','UC Davis','California','https://kdvs.org/'],
  ['KCSB 91.9','UC Santa Barbara','California','https://kcsbweb.as.ucsb.edu/'],
  ['KZSC 88.1','UC Santa Cruz','California','https://kzsc.org/'],
  ['KCR College Radio','San Diego State','California','https://kcr.sdsu.edu/'],
  ['KSJS 90.5','San José State','California','https://ksjs.org/'],
  ['KZSU 90.1','Stanford','California','https://kzsu.stanford.edu/'],
  ['KVRX 91.7','UT Austin','Texas','https://kvrx.org/'],
  ['Radio K / KUOM','University of Minnesota','Minnesota','https://radiok.org/'],
  ['WSUM 91.7','UW–Madison','Wisconsin','https://wsum.org/'],
  ['WCBN 88.3','University of Michigan','Michigan','https://wcbn.org/'],
  ['WVFS 89.7','Florida State','Florida','https://wvfs.fsu.edu/'],
  ['WUOG 90.5','University of Georgia','Georgia','https://wuog.org/'],
  ['KWVA 88.1','University of Oregon','Oregon','https://kwva.uoregon.edu/'],
  ['KPSU','Portland State','Oregon','https://kpsu.org/']
 ];
 // Direct HTTPS station audio. Station websites are not interchangeable
 // with stream endpoints; these URLs point to actual stream hosts or audio proxies.
 const audioStreams={
  0:'https://live.uclaradio.com/listen/ucla_radio/radio.mp3',
  1:'https://stream.kalx.berkeley.edu:8443/kalx-128.mp3',
  3:'https://kcsb.streamguys1.com/live',
  4:'https://kzscfms1-geckohost.radioca.st/kzschigh',
  6:'https://stream.rcast.net/263501',
  7:'https://kzsu-streams.stanford.edu/kzsu-1-128.mp3',
  11:'https://floyd.wcbn.org:8443/wcbn-hi.mp3'
 };
 let catalogReady=false;
 function recentVideos(){return window.BigLWADiscoveryCatalog?.data.videos||[]}
 function tvSources(){
  const recent=recentVideos(),creators=new Set(recent.map(v=>v.creator.toLowerCase()));
  return [...recent,...featured.filter(v=>!creators.has(String(v.creator||'').toLowerCase())),...ballroomChannels];
 }
 async function loadCatalog(){
  const service=window.BigLWADiscoveryCatalog;if(!service)return;
  const data=await service.load();
  window.BigLWAVeve?.loadInterests?.().then(()=>{if(root?.isConnected)renderFeaturedSlots()}).catch(()=>[]);
  for(const station of data.radio){
   const normalized=value=>String(value||'').toLowerCase().replace(/[^a-z0-9]/g,'');
   const existing=stations.findIndex(row=>normalized(row[3])===normalized(station.homepage)&&station.homepage||normalized(row[0])===normalized(station.name));
   const index=existing<0?stations.length:existing;
   if(existing<0)stations.push([station.name,station.school||'World radio',station.state,station.homepage||station.stream]);
   if(station.stream&&/^https:\/\//.test(station.stream)&&!audioStreams[index])audioStreams[index]=station.stream;
  }
  catalogReady=true;
  if(root?.isConnected){renderGrid();if(state.category==='lwa-tv'&&state.tvSection==='wla'&&root.querySelector('.wla-title-search'))return;if(!root.querySelector('#streamProgramQuery')?.value)renderCategory();else{renderStations(root.querySelector('#streamStationSearch')?.value||'');renderFeaturedSlots();}}
 }
 const categories=[['podcast','lwa radio','CH 01'],['lwa-tv','lwa tv','CH 02'],['live','live','CH 03'],['sqwibz','sqwidz','CH 04'],['music','music','CH 05']];
 const programmedCategories=()=>categories.filter(([id])=>id!=='music');
 // These are integration destinations, not connected OAuth sessions.
 // Keep playlist scopes and credentials server-side when providers approve them.
 const musicSources=[
  {id:'spotify',label:'Spotify',about:'Saved tracks and playlists',scope:'Playlist read / library access'},
  {id:'apple',label:'Apple Music',about:'Library and playlist sync',scope:'MusicKit user authorization'},
  {id:'soundcloud',label:'SoundCloud',about:'Artist sounds and saved links',scope:'Authorized user access'},
  {id:'youtube',label:'YouTube Music',about:'Playlist discovery and linking',scope:'Google/YouTube permissions to verify'}
 ];
 // Each destination is an actual publisher/creator channel or a specifically
 // identified release. We do NOT invent YouTube video IDs or live statuses.
 // The same five existing Internet Archive video files used by the login page.
 const bettyBoopEpisodes=[
  ["A Song a Day (1936)","https://archive.org/download/BettyBoopCartoons/Betty_Boop_A_Song_a_Day_1936_512kb.mp4"],
  ["Is My Palm Read (1932)","https://archive.org/download/BettyBoopCartoons/Betty_Boop_Is_My_Palm_Read_1932_512kb.mp4"],
  ["More Pep (1936)","https://archive.org/download/BettyBoopCartoons/Betty_Boop_More_Pep_1936_512kb.mp4"],
  ["Betty Boop's Ker-Choo (1932)","https://archive.org/download/BettyBoopCartoons/Betty_Boops_KerCho_1932_512kb.mp4"],
  ["The Candid Candidate (1937)","https://archive.org/download/BettyBoopCartoons/The_Candid_Candidate_1937_512kb.mp4"]
 ];
 const featured=[
  {id:'community-live-01',category:'lwa-tv',title:'Community live selection 01',creator:'Original YouTube uploader',subtitle:'Submitted live stream · availability determined by YouTube',videoId:'Q0zx1vpTghg',url:'https://www.youtube.com/watch?v=Q0zx1vpTghg',source:'Member-curated YouTube stream',provider:'youtube',chatEligible:true},
  {id:'courage-live',category:'lwa-tv',title:'Courage the Cowardly Dog · YouTube stream',creator:'Original YouTube uploader',subtitle:'Cartoon stream · availability not guaranteed',videoId:'_RdBYV6TLV0',url:'https://www.youtube.com/watch?v=_RdBYV6TLV0',source:'Member-curated cartoon stream',provider:'youtube',chatEligible:true},
  {id:'gravity-falls-live',category:'lwa-tv',title:'Gravity Falls · YouTube stream',creator:'Original YouTube uploader',subtitle:'Animation stream · availability not guaranteed',videoId:'eE1L08hNdW8',url:'https://www.youtube.com/watch?v=eE1L08hNdW8',source:'Member-curated cartoon stream',provider:'youtube',chatEligible:true},
  {id:'community-live-04',category:'lwa-tv',title:'Community live selection 04',creator:'Original YouTube uploader',subtitle:'Submitted live stream · availability determined by YouTube',videoId:'DuUUTvBihaU',url:'https://www.youtube.com/watch?v=DuUUTvBihaU',source:'Member-curated YouTube stream',provider:'youtube',chatEligible:true},
  {id:'owen-dreams',category:'podcast',title:'In Your Dreams with Owen Thiele',creator:'Unwell Network · Owen Thiele',subtitle:"Halsey's Mom Thought She Was Delusional",videoId:'iO9g2KEroiw',url:'https://www.youtube.com/watch?v=iO9g2KEroiw',source:'Podcast episode',provider:'youtube'},
  {id:'nyt-daily',category:'podcast',title:'The Daily',creator:'The New York Times',subtitle:'Daily news podcast · official listing',url:'https://podcasts.apple.com/us/podcast/the-daily/id1200361736',source:'Podcast',provider:'podcast'},
  {id:'soulection-001',category:'podcast',title:'Soulection Radio Mixtape 001',creator:'Soulection',subtitle:'13 Year Anniversary',url:'https://soulection.lnk.to/RadioMixtape001',source:'Mixtape / original release',provider:'mixtape'},
  {id:'soulection-002',category:'podcast',title:'Soulection Radio Mixtape 002',creator:'Soulection',subtitle:'UNTITLED',url:'https://soulection.lnk.to/UNTITLED',source:'Mixtape / original release',provider:'mixtape'},
  {id:'soulection-003',category:'podcast',title:'Soulection Radio Mixtape 003',creator:'Soulection',subtitle:'The Neptunes (Tribute)',url:'https://soulection.lnk.to/NeptunesTribute',source:'Mixtape / original release',provider:'mixtape'},
  {id:'soulection-radio',category:'podcast',title:'Soulection Radio',creator:'Soulection',subtitle:'Curated radio sessions and playlists',url:'https://radio.soulection.com/',source:'Music radio / episodes',provider:'mixtape'},
  {id:'boilerroom',category:'podcast',title:'Boiler Room Sets',creator:'Boiler Room',subtitle:'DJ sets and recordings',url:'https://www.youtube.com/@boilerroom/videos',source:'DJ sets / original channel',provider:'mixtape'},
  {id:'larray-podcast',category:'podcast',title:'Put a Sock in It',creator:'Larray',subtitle:'Podcast with Larray and Noah',url:'https://linktr.ee/larray',source:'Podcast / creator links',provider:'podcast'},
  {id:'cn-steven',category:'lwa-tv',title:'Cartoon Network',creator:'Cartoon Network',subtitle:'Steven Universe · Here Comes a Thought',videoId:'dHg50mdODFM',url:'https://www.youtube.com/watch?v=dHg50mdODFM',source:'Official cartoon clip',provider:'youtube'},
  {id:'cn-regular',category:'lwa-tv',title:'Cartoon Network · Regular Show',creator:'Cartoon Network',subtitle:'Streaming Wars · Regular Show',videoId:'Uimuwd0kX9g',url:'https://www.youtube.com/watch?v=Uimuwd0kX9g',source:'Official cartoon clip',provider:'youtube'},
  {id:'markiplier-scary',category:'lwa-tv',title:'Markiplier',creator:'Markiplier',subtitle:'3 SCARY GAMES #9',videoId:'abHGyg4LKn4',url:'https://www.youtube.com/watch?v=abHGyg4LKn4',source:'Gaming / original video',provider:'youtube'},
  {id:'cory-sss',category:'lwa-tv',title:'CoryxKenshin',creator:'CoryxKenshin',subtitle:'Spooky Scary Sunday Is Back',videoId:'edk2uac_x0Y',url:'https://www.youtube.com/watch?v=edk2uac_x0Y',source:'Gaming / original video',provider:'youtube'},
  {id:'teaspill',category:'lwa-tv',title:'Tea Spill',creator:'Tea Spill',subtitle:'Influencers have gone too far… (rage bait marketing)',videoId:'Qz5VZPMhw8Q',url:'https://www.youtube.com/watch?v=Qz5VZPMhw8Q',channelUrl:'https://www.youtube.com/@TeaSpill/videos',source:'Official YouTube episode',provider:'youtube'},
  {id:'olandria',category:'lwa-tv',title:'Life With Olan',creator:'Olandria Carthen',subtitle:'My first vlog | red carpet ready',videoId:'lx1UP1nLMQw',url:'https://www.youtube.com/watch?v=lx1UP1nLMQw',channelUrl:'https://www.youtube.com/@X_Olan/videos',source:'Creator YouTube vlog',provider:'youtube'},
  {id:'larray',category:'lwa-tv',title:'Larray',creator:'Larray',subtitle:'Comedy, creator culture and vlogs',url:'https://www.youtube.com/@LARRAY/videos',source:'Creator channel',provider:'youtube'},
  {id:'quenlin',category:'lwa-tv',title:'Quenlin Blackwell',creator:'Quenlin Blackwell',subtitle:"Feeding Starving Celebrities ft. Charli D'Amelio",videoId:'XC7XiNVk_M4',url:'https://www.youtube.com/watch?v=XC7XiNVk_M4',source:'Official YouTube episode',provider:'youtube'},
  {id:'jacksepticeye',category:'lwa-tv',title:'Jacksepticeye',creator:'Jacksepticeye',subtitle:'Gaming, horror and comedy',url:'https://www.youtube.com/@jacksepticeye/videos',source:'Creator channel',provider:'youtube'},
  {id:'dream',category:'lwa-tv',title:'Dream',creator:'Dream',subtitle:'Minecraft Speedrunner Swap VS 3 Hunters',videoId:'IqcS1d3eXYc',url:'https://www.youtube.com/watch?v=IqcS1d3eXYc',source:'Official YouTube episode',provider:'youtube'},
  {id:'cupquake',category:'lwa-tv',title:'iHasCupquake',creator:'iHasCupquake',subtitle:'Gaming, arts, DIY and adventures',url:'https://www.youtube.com/@ihascupquake/videos',source:'Creator channel',provider:'youtube'},
  {id:'alissa-violet',category:'lwa-tv',title:'Alissa Violet',creator:'Alissa Violet',subtitle:"I'm Back",videoId:'wdj19oCLpVw',url:'https://www.youtube.com/watch?v=wdj19oCLpVw',source:'Official YouTube video',provider:'youtube'},
  {id:'steyeuh',category:'lwa-tv',title:'Steyuh',creator:'Stei Campbell',subtitle:'Vlogs, humor and everyday adventures',url:'https://www.youtube.com/@steyeuh/videos',source:'Creator website-linked channel',provider:'youtube'},
  {id:'lofi-girl-tv',category:'lwa-tv',title:'Lofi Girl · study radio',creator:'Lofi Girl',subtitle:'Lofi hip-hop beats to study and unwind',videoId:'X4VbdwhkE10',url:'https://www.youtube.com/watch?v=X4VbdwhkE10',source:'Official Lofi Girl video',provider:'youtube'},
  {id:'betty-boop-classics',category:'lwa-tv',title:'Betty Boop · Classic Cartoons',creator:'Fleischer Studios · Internet Archive',subtitle:'Five animated shorts · choose an episode in the player',source:'Vintage cartoon collection',url:'https://archive.org/details/BettyBoopCartoons',provider:'archive-video',episodes:bettyBoopEpisodes}
 ];
 // Ballroom/CCTV = curated ballroom video archive, not real surveillance feeds.
 // Original channels keep attribution, playback control and embed restrictions.
 const ballroomChannels=[
  {id:'ballroom-throwbacks',category:'lwa-tv',title:'Ballroom Throwbacks Television',creator:'BRTB TV',subtitle:'Balls, performance, runway and archival footage',url:'https://www.youtube.com/@BALLROOMTHROWBACKS/videos',source:'Ballroom video archive',provider:'youtube'},
  {id:'open-to-all',category:'lwa-tv',title:'Open To All Entertainment',creator:'Open To All Entertainment',subtitle:'Ballroom event videos and community performances',url:'https://www.youtube.com/@opentoallent/videos',source:'Ballroom video channel',provider:'youtube'},
  {id:'kendrick-mugler',category:'lwa-tv',title:'Kendrick Mugler TV',creator:'Kendrick Mugler',subtitle:'Ballroom footage and European scene archives',url:'https://www.youtube.com/c/kendrickmugler/videos',source:'Ballroom video channel',provider:'youtube'},
  {id:'sugarchampagne',category:'lwa-tv',title:'Sugar Champagne',creator:'Sugar Champagne',subtitle:'Classic ballroom and historic event footage',url:'https://www.youtube.com/@sugarchampagne/videos',source:'Ballroom archive',provider:'youtube'},
  {id:'philly-prodigy',category:'lwa-tv',title:'Philly Prodigy',creator:'Philly Prodigy',subtitle:'Ballroom clips and community footage',url:'https://www.youtube.com/@phillyprodigy09/videos',source:'Ballroom video archive',provider:'youtube'},
  {id:'ballroom-in-focus',category:'lwa-tv',title:'Ballroom in Focus',creator:'Google Arts & Culture · Destination Tomorrow',subtitle:'Photography, oral history and archival storytelling',url:'https://artsandculture.google.com/project/ballroom',source:'Ballroom cultural archive',provider:'archive'}
 ];
 // These are destination channels, not assertions that the streamer is live.
 // Live YouTube programming is embedded, not opened in another tab. The labels are
 // intentionally "live-style" rather than guaranteed live: upstream broadcasts change.
 const youtubeLive=[
  {id:'lofi-girl-live',category:'live',title:'Lofi Girl · synthwave radio',creator:'Lofi Girl',subtitle:'Synthwave beats · original Lofi Girl stream',videoId:'MVPTGNGiI-4',url:'https://www.youtube.com/watch?v=MVPTGNGiI-4',source:'YouTube continuous music',provider:'youtube'},
  {id:'asmr-rain',category:'live',title:'Rain & thunder ASMR',creator:'Danny Louis',subtitle:'24/7-style rain and thunder ambience',videoId:'kBNaBktShA4',url:'https://www.youtube.com/watch?v=kBNaBktShA4',source:'ASMR · YouTube',provider:'youtube'},
  {id:'frequencies-528',category:'live',title:'528 Hz · forest ambience',creator:'Meditative Mind',subtitle:'528 Hz frequency-based ambient music · recording',videoId:'09r8XdHRWe8',url:'https://www.youtube.com/watch?v=09r8XdHRWe8',source:'Frequencies · 528 Hz',provider:'youtube'},
  {id:'frequencies-528-cosmic',category:'live',title:'528 Hz · cosmic meditation',creator:'Meditative Mind',subtitle:'Solfeggio frequency-inspired ambient music · recording',videoId:'HfTJ9j5fVl0',url:'https://www.youtube.com/watch?v=HfTJ9j5fVl0',source:'Frequencies · 528 Hz',provider:'youtube'}
 ];
 const twitchChannels=[
  {id:'hasanabi',category:'live',title:'Hasan Piker · HasanAbi',creator:'Hasan Piker',subtitle:'News, politics, commentary and culture',url:'https://www.twitch.tv/hasanabi',twitchChannel:'hasanabi',provider:'twitch',source:'Twitch channel'},
  {id:'pokimane',category:'live',title:'Pokimane',creator:'Pokimane',subtitle:'Games, chat and community',url:'https://www.twitch.tv/pokimane',twitchChannel:'pokimane',provider:'twitch',source:'Twitch channel'},
  {id:'qtcinderella',category:'live',title:'QTCinderella',creator:'QTCinderella',subtitle:'Shows, streaming and events',url:'https://www.twitch.tv/qtcinderella',twitchChannel:'qtcinderella',provider:'twitch',source:'Twitch channel'},
  {id:'kaicenat',category:'live',title:'Kai Cenat',creator:'Kai Cenat',subtitle:'Variety streams and community',url:'https://www.twitch.tv/kaicenat',twitchChannel:'kaicenat',provider:'twitch',source:'Twitch channel'},
  {id:'fuslie',category:'live',title:'Fuslie',creator:'Fuslie',subtitle:'Gaming and variety',url:'https://www.twitch.tv/fuslie',twitchChannel:'fuslie',provider:'twitch',source:'Twitch channel'}
 ];

 const escapeHTML=v=>String(v==null?'':v).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const workerFetch=async (path,options={})=>{
  const res=await fetch(API+path,options);
  const json=await res.json().catch(()=>({}));
  if(!res.ok)throw Error(json.error||'The Stream service is unavailable.');
  return json;
 };
 const localDay=(date=new Date())=>date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');
 const labelHour=hour=>String((hour%12)||12)+(hour>=12?' PM':' AM');
 const niceDate=day=>{
  const d=new Date(day+'T12:00:00');
  return Number.isFinite(d.valueOf())?d.toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'}):day;
 };
 const state={category:'podcast',radioSection:'music',tvSection:'entertainment',day:localDay(),shuffleOffset:0,programs:[],myRequests:[],editorial:[],isEditor:false,requestPrefill:'',selected:null,followGuide:true,discoveryMood:'all'};
 let discoveryCursor=Object.create(null);
 let root=null;
 let mediaPortal=null,mediaTarget=null,studioTarget=null;
 let dockShell=null,dockTarget=null,docked=false;
 let guideTimer=null,lastGuideHour='';
 let playing=false,twitchScript=null;
 const studioScreen=()=>document.querySelector('#studioApp #stream > .stream-screen');
 function setPlaying(value){
  playing=value;
  studioScreen()?.classList.toggle('is-playing',playing);
 }
 const LAST_PLAYED_KEY='biglwaStreamLastPlayedV1:';
 const accountUid=()=>String(window.__biglwaIdentity?.uid||'').trim();
 const playbackKey=()=>accountUid()?LAST_PLAYED_KEY+accountUid():'';
 function saveLastPlayed(source){
  const key=playbackKey();if(!key||!source)return;
  const entry=source.provider==='radio'
   ?{kind:'station',index:source.stationIndex}
   :source.isProgram?{kind:'program',id:source.id}
   :{kind:'feature',id:source.id};
  entry.title=String(source.title||'Stream').slice(0,120);
  if(entry.kind==='station'&&!Number.isInteger(entry.index))return;
  if(entry.kind!=='station'&&!entry.id)return;
  try{localStorage.setItem(key,JSON.stringify(entry))}catch{}
  document.dispatchEvent(new CustomEvent('biglwa:stream-updated',{detail:{title:source.title,source:entry}}));
 }
 function restoreLastPlayed(){
  const key=playbackKey();if(!key)return false;
  let saved;try{saved=JSON.parse(localStorage.getItem(key)||'null')}catch{return false}
  if(!saved)return false;
  if(saved.kind==='station'&&Number.isInteger(saved.index)&&stations[saved.index])selectStation(saved.index,{silent:true});
  else if(saved.kind==='feature'&&[...featured,...ballroomChannels,...youtubeLive,...twitchChannels].some(item=>item.id===saved.id)){
   if(twitchChannels.some(item=>item.id===saved.id))selectTwitch(saved.id,{silent:true});else selectFeature(saved.id,{silent:true});
  }else return false;
  state.followGuide=false;
  return true;
 }
 function ensureMediaPortal(){
  // Only one media surface exists. It is a child of the visible player frame,
  // NEVER a fixed, page-level overlay that can float over Studio's search bar.
  if(mediaPortal){
   mediaPortal.querySelector('#streamDiscoveryPicker')?.remove();
   if(!mediaPortal.isConnected&&(mediaTarget?.isConnected||document.body)){
    (mediaTarget?.isConnected?mediaTarget:document.body).appendChild(mediaPortal);
   }
   return mediaPortal;
  }
  mediaPortal=document.createElement('div');
  mediaPortal.id='biglwaPersistentStreamPlayer';
  mediaPortal.className='biglwa-stream biglwa-persistent-stream-player';
  mediaPortal.style.cssText='position:absolute;inset:0;width:100%;height:100%;z-index:2;overflow:hidden;pointer-events:auto;box-sizing:border-box;transform:none;';
  mediaPortal.setAttribute('aria-label','Big LWA continuing Stream playback');
  mediaPortal.addEventListener('click',onClick);
  mediaPortal.addEventListener('play',()=>{
   if(state.selected)saveLastPlayed(state.selected);
  },true);
  mediaPortal.addEventListener('playing',()=>setPlaying(true),true);
  // TikTok's PLAYING notification is exposed as a play event.
  mediaPortal.addEventListener('play',event=>{
   if(event.target.matches?.('tiktok-video'))setPlaying(true);
  },true);
  for(const name of ['pause','ended','waiting','emptied','error']){
   mediaPortal.addEventListener(name,()=>setPlaying(false),true);
  }
  (mediaTarget?.isConnected?mediaTarget:document.body).appendChild(mediaPortal);
  return mediaPortal;
 }
 let fullPlayerControls=null;
 function syncFullPlayerControls(){
  // Keep the same controls on the full-sized TV, never in the dock or thumbnail.
  if(typeof root==='undefined'||!root?.isConnected||!fullPlayerControls)return;
  const monitor=root.querySelector('#streamMonitor');if(!monitor)return;
  const label=mediaPortal?.parentElement===monitor?mediaPortal.querySelector('.stream-screen > .stream-player-label'):null;
  const target=label||monitor;
  if(fullPlayerControls.parentElement!==target){
   if(label)label.insertBefore(fullPlayerControls,label.querySelector('a'));
   else monitor.append(fullPlayerControls);
  }
 }
 function targetMedia(target){
  // Keep the *same live iframe/video element* when switching widgets.
  // The explicit docking choice takes priority until the user returns.
  mediaTarget=(docked&&dockTarget?.isConnected?dockTarget:target)||null;
  if(!mediaTarget?.isConnected)return;
  const portal=ensureMediaPortal();
  if(portal.parentElement!==mediaTarget){
   if(portal.isConnected&&mediaTarget.moveBefore)mediaTarget.moveBefore(portal,null);
   else mediaTarget.appendChild(portal);
  }
  if(studioTarget&&studioTarget!==mediaTarget){
   studioTarget.classList.remove('stream-preview-active');
   studioTarget=null;
  }
  portal.classList.toggle('is-studio-preview',studioTarget===mediaTarget);
  // Position is anchored to the card's own layout. No scroll listeners,
  // transforms, ResizeObserver or animation frames are required.
  portal.style.position='absolute';
  portal.style.inset='0';
  portal.style.width='100%';
  portal.style.height='100%';
  portal.style.transform='none';
  portal.style.visibility='visible';
  portal.style.pointerEvents='auto';
  portal.style.zIndex='2';
  syncFullPlayerControls();
 }
 function scheduleMediaPosition(){
  // Called by existing playback code; it must not re-measure or chase scrolling.
  if(mediaPortal&&mediaTarget?.isConnected&&mediaPortal.parentElement!==mediaTarget)
   mediaTarget.appendChild(mediaPortal);
  syncFullPlayerControls();
 }
 // The floating mini-TV holds the actual player DOM node. We never clone
 // an iframe, restart its src or collect a user's viewing history.
 function dockHost(){
  if(dockShell?.isConnected)return dockShell;
  dockShell=document.createElement('section');dockShell.id='biglwaStreamDock';
  dockShell.classList.toggle('stream-ornate-dock',!!window.__biglwaStreamFrameAssetsReady);
  dockShell.setAttribute('aria-label','Movable LWA TV mini player');
  dockShell.innerHTML='<header class="stream-dock-title" data-stream-dock-drag>'+
   '<span aria-hidden="true">⋮⋮</span><strong>BIG LWA · ON AIR</strong>'+
   '<button type="button" data-stream-return title="Return to full Stream">↗ Stream</button>'+
   '<button type="button" data-stream-undock title="Return to Studio preview" aria-label="Put player back in Studio">×</button></header>'+
   '<div class="stream-dock-stage"></div>';
  dockTarget=dockShell.querySelector('.stream-dock-stage');
  const bar=dockShell.querySelector('[data-stream-dock-drag]');
  let drag=null;
  bar.addEventListener('pointerdown',event=>{
   if(event.button!==0||event.target.closest('button,a'))return;
   const rect=dockShell.getBoundingClientRect();
   drag={id:event.pointerId,x:event.clientX-rect.left,y:event.clientY-rect.top};
   dockShell.style.right='auto';dockShell.style.bottom='auto';
   dockShell.style.left=rect.left+'px';dockShell.style.top=rect.top+'px';
   bar.setPointerCapture?.(event.pointerId);
   event.preventDefault();
  });
  bar.addEventListener('pointermove',event=>{
   if(!drag||event.pointerId!==drag.id)return;
   const left=Math.max(8,Math.min(window.innerWidth-dockShell.offsetWidth-8,event.clientX-drag.x));
   const top=Math.max(8,Math.min(window.innerHeight-dockShell.offsetHeight-8,event.clientY-drag.y));
   dockShell.style.left=left+'px';dockShell.style.top=top+'px';
  });
  const end=()=>{drag=null};
  bar.addEventListener('pointerup',end);bar.addEventListener('pointercancel',end);
  dockShell.querySelector('[data-stream-return]').addEventListener('click',()=>undockStream(true));
  dockShell.querySelector('[data-stream-undock]').addEventListener('click',()=>undockStream(false));
  document.body.append(dockShell);
  window.addEventListener('resize',()=>{
   if(!docked||!dockShell||dockShell.hidden)return;
   if(dockShell.style.left) dockShell.style.left=Math.min(Math.max(8,parseFloat(dockShell.style.left)||8),
      Math.max(8,window.innerWidth-dockShell.offsetWidth-8))+'px';
   if(dockShell.style.top) dockShell.style.top=Math.min(Math.max(8,parseFloat(dockShell.style.top)||8),
      Math.max(8,window.innerHeight-dockShell.offsetHeight-8))+'px';
  });
  return dockShell;
 }
 function dockStream(){
  if(!mediaPortal?.firstElementChild){return false}
  const host=dockHost();host.hidden=false;docked=true;state.followGuide=false;
  // Prevent the browser from immediately restarting playback.
  targetMedia(dockTarget);scheduleMediaPosition();
  host.querySelector('strong').textContent='BIG LWA · '+String(state.selected?.title||'ON AIR').slice(0,42);
  return true;
 }
 function undockStream(openFull=false){
  if(!docked)return false;
  docked=false;
  if(dockShell)dockShell.hidden=true;
  if(openFull){
   window.openBIGLWAModule?.('stream');
   const screen=document.querySelector('#streamMonitor');
   if(screen)targetMedia(screen);
  }else{
   const preview=document.querySelector('#studioApp #stream .stream-screen');
   if(preview){studioTarget=preview;preview.classList.add('stream-preview-active');targetMedia(preview)}
   else {const screen=document.querySelector('#streamMonitor');if(screen)targetMedia(screen)}
  }
  scheduleMediaPosition();
  return true;
 }
 function parkInStudio(){
  if(!mediaPortal?.isConnected||!mediaPortal.firstElementChild)return false;
  if(docked&&dockTarget?.isConnected){targetMedia(dockTarget);return true}
  const screen=document.querySelector('#studioApp #stream .stream-screen');
  if(!screen)return false;
  studioTarget=screen;
  screen.classList.add('stream-preview-active');
  // The Studio thumbnail now has one Dock Stream control at its bottom edge.
  mediaPortal.querySelector('.stream-preview-return')?.remove();
  state.followGuide=false;
  targetMedia(screen);
  scheduleMediaPosition();
  document.dispatchEvent(new CustomEvent('biglwa:stream-updated',{detail:{title:state.selected?.title||'Stream'}}));
  return true;
 }


 // Keep the visible dock action attached to the Studio thumbnail, whether
 // playback is inside Stream, the thumbnail, or already in its mini-window.
 function installStudioDockControl(){
  const preview=studioScreen();
  if(!preview)return;
  preview.classList.toggle('is-playing',playing);
  if(preview.querySelector(':scope > .stream-studio-dock'))return;
  const button=document.createElement('button');
  button.type='button';button.className='stream-studio-dock';
  button.textContent='Dock Stream';
  button.setAttribute('aria-label','Dock Stream player');
  button.title='Keep Stream playing while you browse BIG LWA';
  preview.appendChild(button);
 }
 let studioDockScheduled=false;
 function scheduleStudioDock(){
  if(studioDockScheduled)return;studioDockScheduled=true;
  requestAnimationFrame(()=>{studioDockScheduled=false;installStudioDockControl()});
 }
 document.addEventListener('click',event=>{
  const trigger=event.target.closest?.('#studioApp #stream .stream-studio-dock');
  if(!trigger)return;
  event.preventDefault();event.stopImmediatePropagation();
  if(!dockStream())window.openBIGLWAModule?.('stream');
 },true);
 document.addEventListener('biglwa:studio-opened',scheduleStudioDock);
 document.addEventListener('biglwa:stream-updated',scheduleStudioDock);
 document.addEventListener('biglwa:module-close',scheduleStudioDock);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scheduleStudioDock,{once:true});
 else scheduleStudioDock();
 if(typeof MutationObserver==='function'){
  const dockObserver=new MutationObserver(records=>{
   if(records.some(record=>[...record.addedNodes].some(node=>
     node.nodeType===1&&(node.matches?.('#stream,.stream-screen')||
     node.querySelector?.('#studioApp #stream .stream-screen')))))scheduleStudioDock();
  });
  dockObserver.observe(document.body,{childList:true,subtree:true});
 }
 let mostRecentUser='';
 async function getUserToken(){
  try{
   const [{getApps,initializeApp},{getAuth}]=await Promise.all([
    import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js')
   ]);
   const app=getApps()[0]||initializeApp({apiKey:'AIzaSyAPUT8_pLNxdh5tbGpAmXBJiID3jVcA9DY',
    authDomain:'biglwa.firebaseapp.com',projectId:'biglwa',appId:'1:83232670555:web:e04927b20458390b3b507e'});
   const auth=getAuth(app);
   await auth.authStateReady();
   mostRecentUser=auth.currentUser?.uid||'';
   return auth.currentUser?auth.currentUser.getIdToken():'';
  }catch(error){console.warn('Stream account lookup',error);return ''}
 }
 const authRequest=async (path,body,method='POST')=>{
  const token=await getUserToken();
  if(!token)throw Error('Sign in to BIG LWA to request programming.');
  return workerFetch(path,{method,headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},
   ...(body?{body:JSON.stringify(body)}:{})});
 };
 function mount(host){
  if(!host)return;
  // Opening Stream returns the existing player to its full-sized home.
  if(docked){docked=false;if(dockShell)dockShell.hidden=true}
  root=host;root.classList.add('biglwa-stream');
  if(typeof requestAnimationFrame==='function')requestAnimationFrame(syncYouTubeOrbitButton);
  else syncYouTubeOrbitButton();
  // Reopening Stream must not strand members in the Music setup-only view.
  // Radio stays the welcome channel; other tabs can be selected again.
  if(state.category==='music')state.category='podcast';
  state.day=localDay();
  root.innerHTML=[
   '<nav class="stream-nav" aria-label="Stream channel selector"><div class="stream-nav-meta"><span class="stream-eyebrow">BIG LWA / FOUR-CHANNEL GUIDE</span><span id="streamGuideClock" class="stream-nav-clock"></span>',
   '<div class="stream-nav-actions"><form id="streamMediaLinkForm" class="stream-media-link-form" aria-label="Play a creator-hosted video or audio"><label for="streamMediaLink">Tune a link</label><div><input id="streamMediaLink" type="url" inputmode="url" placeholder="YouTube, TikTok or Spotify URL" aria-describedby="streamMediaLinkStatus"><button type="submit">▶ Tune</button></div><small id="streamMediaLinkStatus" role="status" aria-live="polite">Play a public creator-hosted track or video inside Stream.</small></form><button class="stream-youtube-orbit" type="button" data-google-orbit-connect aria-label="Connect YouTube through Orbit" title="Connect YouTube through Orbit"><img src="/assets/orbit-icons/youtube.svg" alt="" width="19" height="19"><span data-stream-youtube-status>YouTube Orbit · Connect</span></button></div></div>',
   '<div class="stream-channels" role="tablist" aria-label="Stream category">',
   programmedCategories().map(c=>'<button class="stream-tab" role="tab" id="stream-tab-'+c[0]+'" data-stream-tab="'+c[0]+'" aria-controls="stream-category-content" aria-selected="false"><small>'+c[2]+'</small><b>'+c[1]+'</b></button>').join(''),
   '</div></nav>',
   '<section class="stream-spotlight" id="streamPlayerStage" aria-label="Channel player"><div class="stream-monitor" id="streamMonitor"><div class="stream-screen"><span class="stream-monitor-kicker">BIG LWA / TUNING IN</span><div class="stream-screen-center"><span>✳</span><strong>loading the current program</strong><small>today’s picks · original hosts</small></div><span class="stream-screen-bottom">BIG LWA · independent programming</span></div><div class="stream-dock-options" role="group" aria-label="TV player controls"><button type="button" class="stream-dock-open" data-stream-dock title="Keep watching while you browse" aria-label="Dock player, keep watching while you browse">▣ Dock player</button><button type="button" class="stream-dock-open" data-stream-no-signal title="Show no-signal screen" aria-label="No signal?">◉ No signal?</button></div></div>',
   '<div class="stream-channel-copy" id="streamCategoryCopy"></div></section>',
   
   '<section class="stream-guide" aria-label="Daily Stream program guide"><div class="stream-guide-head">',
   '<div><span class="stream-eyebrow">EPG / electronic program guide</span><h2>today’s rotation</h2><p>Daily shuffled picks from real channels, campus radio and DJ mixtapes. These are discovery slots, not an assertion of live broadcasts at specific hours.</p></div>',
   '<div class="stream-date-actions"><label>Discovery mood <select id="streamDiscoveryMood" class="stream-mood-select" aria-label="Choose a discovery mood"><option value="all">Everything</option><option value="gaming">Games &amp; horror</option><option value="culture">Culture &amp; commentary</option><option value="calm">Unwind</option><option value="cartoons">Cartoons</option><option value="surprise">Surprise me</option></select></label><label>Rotation date <input id="streamDate" type="date" aria-label="Rotation date" value="'+state.day+'"></label><button type="button" id="streamShuffleAgain" class="stream-shuffle-button">↻ shuffle again</button></div></div>',
   '<div class="stream-grid-scroll" tabindex="0" aria-label="Scroll through 24 daily discovery slots for the selected channel" id="streamGridScroll"><div class="stream-grid" id="streamGrid"></div></div>',
   '<div class="stream-guide-foot"><span><i class="stream-guide-key"></i> selected channel</span><span><i class="stream-guide-key scheduled"></i> future approved program</span><span><i class="stream-guide-key source"></i> daily curator picks</span><span><i class="stream-guide-key open"></i> Twitch channel · status unverified</span><button type="button" id="streamJumpNow">jump to this hour ↗</button></div></section>',
   '<section class="stream-body" id="stream-category-content" role="tabpanel" aria-labelledby="stream-tab-podcast">',
   '<div class="stream-section-detail" id="streamSectionDetail"></div></section>',
   '<section class="stream-future" aria-label="Future programming features"><span>COMING LATER · COMMUNITY PROGRAMMING</span><strong>creator time-slot requests</strong><p>Time-slot requests, premieres and scheduled submissions will arrive in a future Stream release. Explore the curated rotation for now.</p></section>',
   '<p class="stream-disclaimer">Station links lead to their respective operators; listing does not imply affiliation, permission to rebroadcast, or an official programming partnership. No affiliation or live-broadcast status is implied by the creator directory.</p>'
  ].join('');
  fullPlayerControls=root.querySelector('.stream-dock-options');
  state.defaultMonitorMarkup=root.querySelector('#streamMonitor > .stream-screen')?.outerHTML||'';
  const persistentPlayback=Boolean(mediaPortal?.firstElementChild&&state.selected);
  targetMedia(root.querySelector('#streamMonitor'));
  mediaPortal?.classList.remove('is-studio-preview');
  mediaPortal?.querySelector('[data-stream-return]')?.remove();
  const date=root.querySelector('#streamDate');
  const now=new Date();
  date.min=localDay(new Date(now.getFullYear(),now.getMonth(),now.getDate()-7));
  date.max=localDay(new Date(now.getFullYear()+1,now.getMonth(),now.getDate()));
  date.addEventListener('change',()=>{state.day=date.value||localDay();state.shuffleOffset=0;renderGrid();renderFeaturedSlots();tuneCurrent()});
  root.addEventListener('click',onClick);
  root.addEventListener('submit',onStreamMediaSubmit);
  root.querySelector('#streamDiscoveryMood').addEventListener('change',event=>{
    const next=String(event.target.value||'all');
    if(!['all','gaming','culture','calm','cartoons','surprise'].includes(next))return;
    // Only an explicit setting within the current session; do not track a
    // viewer's activity or silently rewrite their profile/Orbit data.
    state.discoveryMood=next;state.shuffleOffset=0;discoveryCursor=Object.create(null);
    renderGrid();renderFeaturedSlots();
  });
  root.querySelector('#streamShuffleAgain').onclick=()=>{state.shuffleOffset++;renderGrid();renderFeaturedSlots();tuneCurrent()};
  root.querySelector('#streamJumpNow').onclick=()=>{
   state.day=localDay();date.value=state.day;renderGrid();tuneCurrent();jumpNow();
  };
  state.followGuide=!persistentPlayback;
  paintCategories();renderGrid();renderCategory();
  loadCatalog();
  if(!persistentPlayback&&!restoreLastPlayed())tuneCurrent();
  renderFeaturedSlots();
  scheduleMediaPosition();
  lastGuideHour=localDay()+'|'+new Date().getHours();
  if(guideTimer)clearInterval(guideTimer);
  guideTimer=setInterval(()=>{
   if(!root?.isConnected){clearInterval(guideTimer);guideTimer=null;return;}
   const current=localDay()+'|'+new Date().getHours();
   if(current===lastGuideHour)return;
   const oldDay=lastGuideHour.split('|')[0];
   lastGuideHour=current;
   if(state.day===oldDay){state.day=localDay();date.value=state.day;}
   renderGrid();
   if(state.followGuide){const playing=mediaPortal?.querySelector('#streamRadioAudio');const resume=playing&&!playing.paused;tuneCurrent();if(resume){const next=mediaPortal?.querySelector('#streamRadioAudio');if(next)playRadio(next,mediaPortal.querySelector('[data-radio-play]'));}}
  },30000);
  refreshPublic();
 }
 function jumpNow(){
  const hour=new Date().getHours();
  const scroller=root?.querySelector('#streamGridScroll');
  if(!scroller)return;
  const node=root.querySelector('[data-stream-hour="'+hour+'"]');
  if(node)scroller.scrollTo({left:Math.max(0,node.offsetLeft-180),behavior:'smooth'});
 }
 function paintCategories(){
  // Music is an integration workbench, not a fabricated 24-hour broadcast.
  root.dataset.streamCategory=state.category;
  const grid=root.querySelector('.stream-guide');
  if(grid)grid.hidden=false;
  const dock=fullPlayerControls;
  if(dock)dock.hidden=state.category==='music';
  root.querySelectorAll('[data-stream-tab]').forEach(button=>{
   const current=button.dataset.streamTab===state.category||(button.dataset.streamTab==='podcast'&&state.category==='music');
   button.classList.toggle('is-active',current);
   button.setAttribute('aria-selected',String(current));
   button.tabIndex=current?0:-1;
  });
  const panel=root.querySelector('#stream-category-content');
  if(panel)panel.setAttribute('aria-labelledby','stream-tab-'+(state.category==='music'?'podcast':state.category));
  const select=root.querySelector('select[name="category"]');
  if(select&&!select.dataset.edited)select.value=state.category;
  syncSqwidzStage();
 }
 // Sqwidz is watched one post at a time on the ORIGINAL Stream screen.
 let sqPosts=[],sqIndex=0,sqLoading=false,sqDetailId=0;
 const sqCurrent=()=>sqPosts[sqIndex]||null;
 const sqEscape=x=>escapeHTML(String(x??''));
 const sqType=p=>({sqwib:'thought',essay:'long read',photo:'photo',video:'video',audio:'audio',live:'live'})[p?.kind]||'sqwib';
 const sqDate=p=>{const n=p?.createdAt?.toMillis?.()??p?.createdAt??0;const d=new Date(n&&n<1e11?n*1000:n||Date.now());return Number.isFinite(+d)?d.toLocaleDateString():''};
 function sqRight(p,info){
  if(state.category!=='sqwibz')return;
  const area=root?.querySelector('#streamCategoryCopy');if(!area)return;
  const text=String(p?.text||'').trim();
  const caption=text.slice(0,280)+(text.length>280?'…':'');
  const counts=info?.counts||{};
  const format=n=>Number.isFinite(n)?Number(n).toLocaleString():'—';
  const allowed=!!(p?.allowResqwib&&/^[A-Za-z0-9_-]{2,120}$/.test(p.id||''));
  area.innerHTML='<span class="stream-eyebrow">CH 04 / THE CONVERSATION</span><h2>sqwidz</h2>'+
    '<p class="stream-sq-intro">A screen for Sqwidz. Thoughts, threads, photos, audio and video from your community.</p>'+
    '<section class="stream-sq-caption"><small>NOW SHOWING'+(p?' / '+sqEscape(sqType(p)):'')+'</small>'+
    (p?'<strong>@'+sqEscape(p.username||'member')+'</strong><time>'+sqEscape(sqDate(p))+'</time>':'')+
    '<p>'+sqEscape(caption||(p?sqType(p)+' shared on Sqwidz':'No public Sqwidz are available yet.'))+'</p></section>'+
    '<div class="stream-sq-stats"><span><b>'+format(counts.float)+'</b><small>Floats</small></span>'+
    '<span><b>'+format(counts.resqwib)+'</b><small>Resqwibz</small></span>'+
    '<span><b>'+format(info?.replies?.length)+'</b><small>Replies</small></span></div>'+
    '<div class="stream-sq-nav"><button type="button" data-sq-prev aria-label="Previous Sqwib" '+(sqPosts.length<2?'disabled':'')+'>‹</button>'+
    '<span>'+((sqPosts.length?sqIndex+1:0)+' / '+sqPosts.length)+'</span>'+
    '<button type="button" data-sq-next aria-label="Next Sqwib" '+(sqPosts.length<2?'disabled':'')+'>›</button>'+
    '<button type="button" data-sq-refresh>↻ Refresh</button></div>'+
    '<div class="stream-sq-actions">'+(p?'<button type="button" data-sq-resqwib '+(!allowed?'disabled title="Resqwibs are unavailable for this post"':'')+' aria-pressed="'+String(!!info?.mine?.resqwib)+'">↻ '+(info?.mine?.resqwib?'Undo Resqwib':'Resqwib')+'</button>':'')+
    '<button type="button" data-sq-open>Open Sqwidz ↗</button></div><small class="stream-sq-status" role="status"></small>';
 }
 async function sqDetails(p){
  const current=++sqDetailId;
  if(!p||!/^[A-Za-z0-9_-]{2,120}$/.test(p.id||'')||!window.BigLWASocial?.request)return;
  try{const data=await window.BigLWASocial.request('post/'+encodeURIComponent(p.id));
   if(current===sqDetailId&&state.category==='sqwibz'&&sqCurrent()?.id===p.id)sqRight(p,data);
  }catch{const el=root?.querySelector('.stream-sq-status');if(current===sqDetailId&&el)el.textContent='Counts unavailable.'}
 }
 function sqDraw(){
  if(state.category!=='sqwibz')return;
  const stage=root?.querySelector('#streamSqwidzStage'),monitor=root?.querySelector('#streamMonitor');
  if(!stage||!monitor)return;
  const p=sqCurrent();
  const type=!p?'standby':p.kind==='audio'?'audio':p.portrait&&['photo','video','live'].includes(p.kind)?'portrait':p.kind==='photo'?'square':['video','live'].includes(p.kind)?'landscape':'text';
  monitor.dataset.sqwidzAspect=type;
  if(!p){
   stage.innerHTML='<div class="stream-sq-standby"><small>BIG LWA / SQWIDZ</small><strong>NO SQWIDZ ON AIR</strong><p>Public Sqwidz will appear on this screen.</p></div>';
   sqRight(null,null);return;
  }
  let media='';
  try{if(p.media&&new URL(p.media,location.href).protocol==='https:')media=window.BigLWASocial?.mediaMarkup?.({...p,text:String(p.text||'')})||''}catch{}
  const name=String(p.username||'member').replace(/^@/,'');
  stage.innerHTML='<div class="stream-sq-display"><header><span>BIG LWA / SQWIDZ</span><span>'+sqEscape(sqType(p))+'</span></header>'+
    '<article><div class="stream-sq-author">@'+sqEscape(name)+' <time>'+sqEscape(sqDate(p))+'</time></div>'+
    (p.text?'<p class="stream-sq-text">'+sqEscape(p.text)+'</p>':'')+
    (media?'<div class="stream-sq-media">'+media+'</div>':'')+'</article>'+
    '<footer><span>PEOPLE · IDEAS · SOUNDS · SELF</span><span>'+String(sqIndex+1).padStart(2,'0')+' / '+String(sqPosts.length).padStart(2,'0')+'</span></footer></div>';
  stage.scrollTop=0;sqRight(p,null);sqDetails(p);
 }
 async function sqLoad(force=false){
  if(state.category!=='sqwibz'||sqLoading||(!force&&sqPosts.length)||!window.BigLWASocial?.request)return;
  sqLoading=true;
  const stage=root?.querySelector('#streamSqwidzStage');
  if(stage&&!sqPosts.length)stage.innerHTML='<div class="stream-sq-standby"><small>BIG LWA / SQWIDZ</small><strong>TUNING IN…</strong></div>';
  try{
   const data=await window.BigLWASocial.request('posts');let legacy=[];
   try{legacy=await window.BigLWASqwibs?.publicSqwibs?.(50)||[]}catch{}
   const seen=new Set();
   sqPosts=[...(Array.isArray(data?.items)?data.items:[]),...legacy].filter(p=>p?.id&&p.visibility!=='private'&&!seen.has(p.id)&&seen.add(p.id))
    .sort((a,b)=>(b.createdAt?.toMillis?.()||b.createdAt||0)-(a.createdAt?.toMillis?.()||a.createdAt||0));
   sqIndex=Math.min(sqIndex,Math.max(0,sqPosts.length-1));
  }catch(error){
   if(stage&&!sqPosts.length)stage.innerHTML='<div class="stream-sq-standby"><strong>NO SIGNAL</strong><p>'+sqEscape(error?.message||'Try refreshing')+'</p></div>';
  }finally{sqLoading=false;sqDraw()}
 }
 function syncSqwidzStage(){
  if(!root)return;
  const active=state.category==='sqwibz';root.classList.toggle('is-sqwidz-channel',active);
  const monitor=root.querySelector('#streamMonitor');if(!monitor)return;
  let stage=monitor.querySelector('#streamSqwidzStage');
  if(active&&!stage){stage=document.createElement('section');stage.id='streamSqwidzStage';stage.className='stream-sqwidz-stage';stage.setAttribute('aria-label','Sqwidz viewing screen');monitor.append(stage)}
  if(stage&&!stage.dataset.verticalNavigation){
   stage.dataset.verticalNavigation='1';stage.tabIndex=0;
   stage.setAttribute('aria-label','Sqwidz viewing screen · swipe up or down for another post');
   let lastAdvance=0,touchY=null;
   const advance=direction=>{if(state.category!=='sqwibz'||sqPosts.length<2||Date.now()-lastAdvance<500)return;lastAdvance=Date.now();sqIndex=(sqIndex+direction+sqPosts.length)%sqPosts.length;sqDraw()};
   stage.addEventListener('wheel',e=>{if(Math.abs(e.deltaY)<20||e.target.closest('video,audio,input,button'))return;e.preventDefault();advance(e.deltaY>0?1:-1)},{passive:false});
   stage.addEventListener('touchstart',e=>{touchY=e.touches[0]?.clientY},{passive:true});
   stage.addEventListener('touchend',e=>{const y=e.changedTouches[0]?.clientY;if(touchY!==null&&Math.abs(touchY-y)>50)advance(touchY>y?1:-1);touchY=null},{passive:true});
   stage.addEventListener('keydown',e=>{if(e.target!==stage||!['ArrowDown','ArrowUp'].includes(e.key))return;e.preventDefault();advance(e.key==='ArrowDown'?1:-1)});
  }
  if(stage)stage.hidden=!active;
  if(!active){if(mediaPortal)mediaPortal.style.display='';return}
  setPlaying(false);
  if(mediaPortal){mediaPortal.querySelectorAll('video,audio').forEach(el=>{try{el.pause()}catch{}});mediaPortal.replaceChildren();mediaPortal.style.display='none'}
  sqDraw();sqLoad();
  if(!root.dataset.sqControls){
   root.dataset.sqControls='1';
   root.addEventListener('click',event=>{
    const b=event.target.closest('button');if(!b||!b.closest('.stream-sq-nav,.stream-sq-actions'))return;
    if(b.matches('[data-sq-open]')){window.openBIGLWAModule?.('notes');return}
    if(b.matches('[data-sq-prev],[data-sq-next]')){if(sqPosts.length>1){sqIndex=(sqIndex+(b.matches('[data-sq-next]')?1:-1)+sqPosts.length)%sqPosts.length;sqDraw()}return}
    if(b.matches('[data-sq-refresh]')){sqLoad(true);return}
    if(b.matches('[data-sq-resqwib]')){
     const p=sqCurrent();if(!p?.allowResqwib)return;
     const pressed=b.getAttribute('aria-pressed')==='true';b.disabled=true;
     Promise.resolve(window.BigLWASocial?.request('post/'+encodeURIComponent(p.id)+'/resqwib',{enabled:!pressed}))
       .then(()=>sqDetails(p)).catch(err=>{const e=root.querySelector('.stream-sq-status');if(e)e.textContent=err?.message||'Resqwib unavailable'})
       .finally(()=>{if(b.isConnected)b.disabled=false});
    }
   });
  }
 }
 if(typeof window.addEventListener==='function')window.addEventListener('biglwa:social-ready',()=>{if(state.category==='sqwibz')sqLoad()});
 // Deterministic daily shuffle: same date shows the same ordering after refresh.
 // The Shuffle Again control changes only the user's current view.
 function dailySeed(day,category,offset=0){
  const seedText=String(day)+'|'+String(category)+'|'+String(offset);
  let n=2166136261;
  for(let i=0;i<seedText.length;i++)n=Math.imul(n^seedText.charCodeAt(i),16777619);
  return n>>>0;
 }
 function shuffled(items,day,category,offset=0){
  const results=items.slice();
  let seed=dailySeed(day,category,offset)||1;
  for(let i=results.length-1;i>0;i--){
   seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;
   const j=(seed>>>0)%(i+1);
   [results[i],results[j]]=[results[j],results[i]];
  }
  return results;
 }
 function playableFeature(item){
  return Boolean(item&&(item.provider==='archive-video'&&Array.isArray(item.episodes)&&item.episodes.length||
   item.videoId&&/^[A-Za-z0-9_-]{11}$/.test(item.videoId)));
 }
 function discoveryPreference(items,category){
  // Playable, manually curated sources only. Never claim this is a harvested
  // YouTube watch history or a real-time verified stream status.
  if(category==='podcast')return items;
  if(state.discoveryMood==='all'){const interests=window.BigLWAVeve?.interests?.()||[];if(!interests.length)return items;const score=window.BigLWADiscoveryCatalog?.score;if(!score)return items;return items.slice().sort((a,b)=>score(b,interests.join(' '))-score(a,interests.join(' ')));}
  if(state.discoveryMood==='surprise')return items.filter((_,index)=>index%3===0);
  const matches={
   gaming:/markiplier|cory|dream|games|gaming|jacksepticeye|cupquake|pokimane|kaicenat|fuslie/i,
   culture:/teaspill|olandria|olan|quenlin|ballroom|hasan|qtcinderella|larray|alissa|ste(y|i)euh/i,
   calm:/lofi|asmr|rain|frequenc|meditat|ambient|cosmic|forest|synthwave/i,
   cartoons:/cartoon|steven|regular|boop|fleischer/i
  };
  const pattern=matches[state.discoveryMood];
  if(!pattern)return items;
  const filtered=items.filter(item=>pattern.test([item.id,item.title,item.subtitle].join(' ')));
  // No empty lineups or broken player promises when one category is sparse.
  return filtered.length?filtered:items;
 }
 function dailyPlaylist(category,day=state.day,offset=state.shuffleOffset){
  if(category==='podcast'){
   if(state.radioSection==='podcast')return shuffled(featured.filter(item=>item.category==='podcast'&&/podcast/i.test(item.source||'')&&playableFeature(item)).map(item=>({kind:'feature',id:item.id,title:item.title,subtitle:item.subtitle,status:'▶ PLAY EPISODE'})),day,category,offset);
   // Only direct HTTPS audio streams are treated as LWA Radio channels.
   const radio=stations.flatMap((station,index)=>audioStreams[index]&&/^https:\/\//.test(audioStreams[index])
    ?[{kind:'station',index,title:station[0],subtitle:station[1],status:'▶ PLAY IN BIG LWA'}]:[]);
   return shuffled(radio,day,category,offset);
  }
  if(category==='lwa-tv'){
   // Channel directory URLs are NOT playable TV programs. Exclude them until an
   // actual video ID or directly playable archive file is available.
   const videos=tvSources().filter(item=>item.category==='lwa-tv'&&(item.section||'entertainment')===state.tvSection)
    .filter(playableFeature).map(item=>({
     kind:'feature',id:item.id,title:item.title,subtitle:item.publishedAt?item.creator+' · '+new Date(item.publishedAt).toLocaleDateString():item.subtitle||item.creator,tags:item.tags,
     status:item.provider==='archive-video'?'CARTOONS · WATCH':'▶ WATCH VIDEO'
    }));
   return discoveryPreference(shuffled(videos,day,category,offset),category);
  }
  if(category==='live'){
   const youtube=youtubeLive.filter(playableFeature).map(item=>({kind:'feature',id:item.id,title:item.title,subtitle:item.subtitle,status:'YOUTUBE · WATCH HERE'}));
   const twitch=twitchChannels.map(channel=>({kind:'twitch',id:channel.id,title:channel.title,subtitle:channel.subtitle,status:'TWITCH · LIVE UNVERIFIED'}));
   return discoveryPreference(shuffled([...youtube,...twitch],day,category,offset),category);
  }
  return [];
 }
 function guidePick(category,hour,day=state.day,offset=state.shuffleOffset){
  const queue=dailyPlaylist(category,day,offset);
  if(category==='podcast'&&state.radioSection==='music'&&window.BigLWADiscoveryCatalog){return window.BigLWADiscoveryCatalog.radioPick(queue.map(p=>({...p,id:stations[p.index][0]})),day,hour)}
  return queue.length?queue[hour%queue.length]:null;
 }
 function renderGrid(){
  if(!root)return;
  const guide=root.querySelector('.stream-guide');
  const onDemand=state.category==='lwa-tv'&&state.tvSection==='wla';
  if(guide)guide.hidden=onDemand;
  if(onDemand)return;
  if(state.category==='music'){
   // Keep the other live sections discoverable even from the Music setup tab.
   const grid=root.querySelector('#streamGrid');
   if(grid)grid.innerHTML='<div class="stream-music-other-channels"><strong>OTHER STREAM CHANNELS</strong><p>Keep listening to campus radio or explore the original TV, Live, and Sqwidz sections.</p><div>'+categories.filter(([id])=>id!=='music').map(([id,label,channel])=>'<button type="button" data-stream-tab="'+id+'">'+channel+' · '+label+'</button>').join('')+'</div></div>';
   const stamp=root.querySelector('#streamGuideClock');if(stamp)stamp.textContent='STREAM / ALL CHANNELS';
   return;
  }
  const items=state.programs;
  const first='<div class="stream-grid-corner">BIG LWA<br>24 HRS</div>';
  const hourOrder=Array.from({length:24},(_,i)=>(i+(state.day===localDay()?new Date().getHours():0))%24);
  const hours=hourOrder.map(hour=>'<div class="stream-hour" data-stream-hour="'+hour+'"><span>'+labelHour(hour)+'</span><small>'+String(hour).padStart(2,'0')+':00</small></div>').join('');
  const rows=categories.filter(cat=>cat[0]===state.category).map(cat=>{
   const key=cat[0],chosen=key===state.category;
   const heading='<button type="button" class="stream-row-label'+(chosen?' is-current':'')+'" data-stream-tab="'+key+'"><small>'+cat[2]+'</small><b>'+cat[1]+'</b><span>'+(chosen?'TUNED IN':'TUNE IN')+'</span></button>';
   const squares=hourOrder.map(hour=>{
    const show=items.find(item=>{
     if(item.category!==key||!item.scheduledAt)return false;
     const date=new Date(item.scheduledAt);
     return localDay(date)===state.day&&date.getHours()===hour;
    });
    const pick=show?null:guidePick(key,hour);
    const current=localDay()===state.day&&new Date().getHours()===hour;
    const classes='stream-slot '+(show?'is-booked':pick?.kind==='twitch'?'is-twitch':'is-curated')+(chosen?' is-selected':'')+(current?' is-now':'');
    const title=show?show.title:pick.title;
    const details=show?(show.creditedCreator||'LWA programming'):pick.subtitle;
    const status=show?'APPROVED / PROGRAMMED':pick.status;
    const text='<span class="stream-slot-status">'+escapeHTML(status)+'</span>'+
      '<strong>'+escapeHTML(title)+'</strong><small>'+escapeHTML(details)+'</small>';
    const attrs=show?' data-stream-program="'+escapeHTML(show.id)+'"':
     pick.kind==='station'?' data-stream-station="'+pick.index+'"':
     pick.kind==='feature'?' data-stream-feature="'+escapeHTML(pick.id)+'"':
     pick.kind==='twitch'?' data-stream-twitch="'+escapeHTML(pick.id)+'"':
      ' data-stream-slot-fallback="'+hour+'"';
    const context=show?'Approved broadcast':cat[0]==='podcast'?'Radio rotation slot':'Daily discovery pick, not scheduled airtime';
    return '<button type="button" class="'+classes+'" data-stream-slot="'+key+'"'+attrs+
     ' aria-label="'+escapeHTML(title+', '+context+', '+cat[1]+' guide at '+labelHour(hour))+'">'+text+'</button>';
   }).join('');
   return heading+squares;
  }).join('');
  const stamp=root.querySelector('#streamGuideClock');
  if(stamp)stamp.textContent='RADIO ROTATION / TV DISCOVERY · '+niceDate(state.day)+(state.shuffleOffset?' · MIX '+(state.shuffleOffset+1):'');
  const grid=root.querySelector('#streamGrid');
  grid.innerHTML=first+hours+rows;
  const count=items.filter(x=>localDay(new Date(x.scheduledAt))===state.day).length;
  grid.setAttribute('aria-label',niceDate(state.day)+' daily shuffled guide, '+count+' approved programs, plus original-host channels and mixtapes');
 }
 // Compact Daily Discovery floats in the upper-left of the live monitor.
 // Browsing a thumbnail never interrupts the current media; Play tunes it.
 function discoveryItems(category=state.category){
  return dailyPlaylist(category).filter(item=>item.kind==='station'||item.kind==='feature'||item.kind==='twitch');
 }
 function discoveryThumb(pick){
  if(!pick)return '/assets/station-radio-room.webp';
  if(pick.kind==='station')return '/assets/station-radio-room.webp';
  const item=[...tvSources(),...featured,...youtubeLive].find(source=>source.id===pick.id);
  if(item?.videoId)return 'https://i.ytimg.com/vi/'+item.videoId+'/hqdefault.jpg';
  if(item?.provider==='archive-video')return 'https://archive.org/services/img/BettyBoopCartoons';
  if(pick.kind==='twitch'){
   const channel=twitchChannels.find(x=>x.id===pick.id)?.twitchChannel;
   if(channel)return 'https://static-cdn.jtvnw.net/previews-ttv/live_user_'+channel+'-320x180.jpg';
  }
  return '/assets/station-radio-room.webp';
 }
 function renderFeaturedSlots(){
  if(!root)return;
  if(state.category==='lwa-tv'&&state.tvSection==='wla')return;
  // The program is on the LEFT. Discovery lives only in the RIGHT channel box.
  const panel=root.querySelector('#streamDiscoveryPicker');
  if(!panel)return;
  const queue=discoveryItems();
  if(!queue.length){panel.hidden=true;panel.replaceChildren();return;}
  panel.hidden=false;
  const key=state.category;
  const start=((discoveryCursor[key]??(state.day===localDay()?new Date().getHours():0))%queue.length+queue.length)%queue.length;
  discoveryCursor[key]=start;
  const picks=Array.from({length:Math.min(3,queue.length)},(_,index)=>queue[(start+index)%queue.length]);
  const cards=picks.map((pick,index)=>{
   const position=(start+index)%queue.length;
   const label=pick.kind==='station'?'▶ LISTEN':pick.kind==='twitch'?'▶ TUNE IN':'▶ WATCH';
   return '<button type="button" class="stream-discovery-select" data-discovery-play="'+position+'" aria-label="'+escapeHTML(label+' '+pick.title)+'">'+
    '<img src="'+escapeHTML(discoveryThumb(pick))+'" alt="'+escapeHTML(pick.title)+' thumbnail" loading="eager" decoding="async">'+
    '<span class="stream-discovery-info"><b>'+escapeHTML(pick.title)+'</b><small>'+escapeHTML(pick.subtitle||'')+'</small><small>'+label+'</small></span></button>';
  }).join('');
  panel.innerHTML='<div class="stream-discovery-eyebrow"><span>DAILY DISCOVERY</span><span>'+String(start+1).padStart(2,'0')+' / '+String(queue.length).padStart(2,'0')+'</span></div>'+
   '<div class="stream-discovery-gallery">'+cards+'</div>'+
   '<div class="stream-discovery-pagination"><button type="button" class="stream-discovery-arrow" data-discovery-prev aria-label="Previous three discoveries">‹</button>'+
   '<span>browse more channels</span>'+
   '<button type="button" class="stream-discovery-arrow" data-discovery-next aria-label="Next three discoveries">›</button></div>';
  panel.querySelectorAll('img').forEach(img=>{img.onerror=()=>{
   img.onerror=null;img.src='/assets/station-radio-room.webp';
  };});
 }
 function browseDiscovery(direction){
  const queue=discoveryItems();if(!queue.length)return;
  const key=state.category;
  const current=discoveryCursor[key]??new Date().getHours();
  discoveryCursor[key]=((current+direction*3)%queue.length+queue.length)%queue.length;
  renderFeaturedSlots();
 }
 function playDiscovery(index){
  const queue=discoveryItems();if(!queue.length)return;
  const pick=queue[Number.isInteger(index)&&index>=0&&index<queue.length?index:(discoveryCursor[state.category]??0)%queue.length];
  if(!pick)return;
  state.followGuide=false;
  if(pick.kind==='station')selectStation(pick.index);
  else if(pick.kind==='feature')selectFeature(pick.id);
  else if(pick.kind==='twitch')selectTwitch(pick.id);
 }
 function showNoSignal(){
  // The embedded provider may deliberately refuse playback; the browser does
  // not always fire iframe error. Let members explicitly report a blank screen.
  // Do not imply the creator is live or publish any failed media data.
  if(!state.selected)return false;
  setPlaying(false);
  const portal=ensureMediaPortal();
  const title=escapeHTML(state.selected.title||'Stream');
  const url=String(state.selected.url||'');
  const link=/^https:\/\//i.test(url)?'<a href="'+escapeHTML(url)+'" target="_blank" rel="noopener noreferrer">View on original site ↗</a>':'';
  portal.innerHTML='<div class="stream-screen stream-signal-failed">'+
    '<img src="/assets/tv-no-signal.svg" alt="Television no-signal test pattern" width="336" height="208">'+
    '<strong>NO SIGNAL · '+title+'</strong><small>Stream unavailable here. You can retry or open the source.</small>'+
    '<button type="button" class="stream-monitor-open" data-stream-retry>↻ Retry player</button>'+link+'</div>';
  syncFullPlayerControls();
  return true;
 }
  // A unified optional player surface. Its provider embed remains hosted on the
  // original platform; no TikTok data scraping or Spotify auth scope is implied.
  function mediaTag(provider,src,title,extra=''){
    const tag={youtube:'youtube-video',tiktok:'tiktok-video',spotify:'spotify-audio'}[provider];
    if(!tag||!window.customElements?.get?.(tag))return '';
    return '<'+tag+' class="stream-source-media" controls '+(provider==='youtube'?'playsinline ':'')+
      'src="'+escapeHTML(src)+'" aria-label="'+escapeHTML(title)+'"'+extra+'></'+tag+'>';
  }
  function embeddedStreamLink(value){
    let u;try{u=new URL(String(value||''))}catch{return null}
    if(u.protocol!=='https:'||u.username||u.password||u.port)return null;
    const h=u.hostname.toLowerCase();
    if(['www.youtube.com','youtube.com','m.youtube.com','youtu.be'].includes(h)){
      const id=h==='youtu.be'?u.pathname.slice(1):/^\/(?:shorts|live)\//.test(u.pathname)?u.pathname.split('/')[2]:u.pathname==='/watch'?u.searchParams.get('v'):null;
      if(!/^[\w-]{11}$/.test(id||''))return null;
      return {provider:'youtube',category:'lwa-tv',videoId:id,title:'YouTube video',source:'Member-selected video',url:'https://www.youtube.com/watch?v='+id};
    }
    if(['tiktok.com','www.tiktok.com','m.tiktok.com'].includes(h)){
      const m=u.pathname.match(/^\/@[A-Za-z0-9._-]{1,80}\/video\/(\d{10,30})\/?$/);
      if(!m)return null;
      return {provider:'tiktok',category:'lwa-tv',tiktokId:m[1],title:'TikTok video',source:'Member-selected video',url:'https://www.tiktok.com'+u.pathname.replace(/\/$/,'')};
    }
    if(h==='open.spotify.com'){
      const m=u.pathname.match(/^\/(track|album|playlist|episode|show|artist)\/([A-Za-z0-9]{16,32})\/?$/);
      if(!m)return null;
      return {provider:'spotify',category:'podcast',spotifyType:m[1],spotifyId:m[2],title:'Spotify '+m[1],source:'Member-selected audio',url:'https://open.spotify.com/'+m[1]+'/'+m[2]};
    }
    return null;
  }
  function syncYouTubeOrbitButton(){
   const btn=root?.querySelector('.stream-youtube-orbit');
   if(!btn)return;
   const connected=!!window.__biglwaGoogleOrbit?.state?.connected;
   const name=window.__biglwaGoogleOrbit?.state?.youtube?.snippet?.title;
   btn.dataset.connected=connected?'1':'0';
   btn.querySelector('[data-stream-youtube-status]').textContent=connected?'YouTube Orbit · Connected':'YouTube Orbit · Connect';
   btn.title=connected?(name?'Connected to '+name:'YouTube connected through Google Orbit'):'Connect your YouTube account in Orbit';
 }
 if(typeof document!=='undefined')document.addEventListener('biglwa:google-state',syncYouTubeOrbitButton);
 function onStreamMediaSubmit(event){
  const form=event.target.closest?.('#streamMediaLinkForm');
  if(!form||!root?.contains(form))return;
  event.preventDefault();
  const status=root.querySelector('#streamMediaLinkStatus');
  const source=embeddedStreamLink(form.querySelector('input')?.value);
  if(!source){if(status)status.textContent='Paste an individual public YouTube, TikTok or Spotify link.';return}
  if(status)status.textContent='Tuning to original '+source.provider+' player. Playback depends on its provider.';
  state.followGuide=false;showSource(source);
 }

 function trackTwitchPlayback(host,channel){
  if(!window.Twitch?.Player&&!twitchScript){
   twitchScript=new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    script.src='https://player.twitch.tv/js/embed/v1.js';
    script.onload=resolve;
    script.onerror=reject;
    document.head.append(script);
   }).catch(()=>{twitchScript=null;});
  }
  Promise.resolve(twitchScript).then(()=>{
   const Player=window.Twitch?.Player;
   if(!Player||!mediaPortal?.contains(host))return;
   const fallback=host.firstElementChild;
   let player;
   try{
    host.replaceChildren();
    player=new Player(host.id,{channel,width:'100%',height:'100%',autoplay:false,muted:true});
   }catch{
    host.replaceChildren(fallback);
    return;
   }
   player.addEventListener(Player.PLAYING,()=>{if(mediaPortal?.contains(host))setPlaying(true);});
   for(const event of [Player.PAUSE,Player.ENDED,Player.OFFLINE,Player.PLAYBACK_BLOCKED]){
    player.addEventListener(event,()=>{if(mediaPortal?.contains(host))setPlaying(false);});
   }
  });
 }

 function showSource(source,options={}){
  const monitor=root?.querySelector('#streamMonitor');if(!monitor||!source)return;
  const surface=ensureMediaPortal();
  setPlaying(false);
  const title=escapeHTML(source.title);
  const url=source.url||'';
  const label=source.source||'Original creator channel';
  state.selected={...source,isDiscovery:true};
  if(!options.silent)saveLastPlayed(source);
  const changed=Boolean(source.category&&source.category!==state.category);
  state.category=source.category||state.category;
  paintCategories();
  if(changed){renderGrid();renderCategory();}
  const caption='<span>'+escapeHTML(label)+' / '+title+'</span>';
  const original=url?'<a href="'+escapeHTML(url)+'" target="_blank" rel="noopener noreferrer">Open original ↗</a>':'';
  const channelLink=source.channelUrl?'<a href="'+escapeHTML(source.channelUrl)+'" target="_blank" rel="noopener noreferrer">More videos ↗</a>':'';
  if(source.provider==='twitch'&&/^[a-z0-9_]{2,25}$/i.test(source.twitchChannel||'')){
   const parent=encodeURIComponent(window.location.hostname);
   const channel=encodeURIComponent(source.twitchChannel);
   // Twitch official embed requires the exact parent domain. No proxying or rehosting.
   const player='https://player.twitch.tv/?channel='+channel+'&parent='+parent+'&autoplay=false&muted=true';
   surface.innerHTML='<div class="stream-screen is-program is-twitch-player"><div class="stream-player-label">'+caption+original+'</div>'+
    '<div id="streamTwitchPlayer" class="stream-twitch-player"><iframe title="'+title+' on Twitch" src="'+escapeHTML(player)+'" allow="autoplay; fullscreen; encrypted-media" allowfullscreen loading="eager" referrerpolicy="strict-origin-when-cross-origin"></iframe></div>'+
    '<div class="stream-player-footer">TWITCH · stream availability is determined by the creator · '+original+'</div></div>';
   trackTwitchPlayback(surface.querySelector('#streamTwitchPlayer'),source.twitchChannel);
  }else if(source.provider==='radio'){
   const stream=source.audioUrl||'';
   const playable=stream&&/^https:\/\//i.test(stream);
   surface.innerHTML='<div class="stream-screen is-external"><span class="stream-monitor-kicker">'+caption+'</span>'+
    '<div class="stream-screen-center"><span>♫</span><strong>'+title+'</strong>'+
    (playable?'<button type="button" class="stream-radio-play" data-radio-play aria-label="Play or pause station">▶ Play</button><audio preload="none" id="streamRadioAudio" src="'+escapeHTML(stream)+'"></audio><small id="streamRadioStatus" role="status">Ready to listen here</small>':'<small>Not radio ready · no playable in-site audio stream</small>')+
    '</div><span class="stream-screen-bottom">DIRECT STATION STREAM · NO REHOSTING</span></div>';
  }else if(source.provider==='archive-video'&&Array.isArray(source.episodes)&&source.episodes.length){
   const episode=source.episodes[0];
   const choices=source.episodes.map((entry,index)=>
    '<button type="button" class="stream-episode-choice'+(index===0?' is-active':'')+'" data-stream-episode="'+index+'" aria-pressed="'+(index===0?'true':'false')+'">'+escapeHTML(entry[0])+'</button>').join('');
   surface.innerHTML='<div class="stream-screen is-program is-archive-player"><div class="stream-player-label">'+caption+original+'</div>'+
    '<video id="streamArchiveVideo" controls playsinline preload="metadata" src="'+escapeHTML(episode[1])+'" aria-label="'+title+'"></video>'+
    '<div class="stream-archive-episode-now" id="streamArchiveEpisodeNow">Now showing · '+escapeHTML(episode[0])+'</div>'+
    '<div class="stream-episode-list" aria-label="Betty Boop episodes">'+choices+'</div></div>';
   const video=surface.querySelector('#streamArchiveVideo');
   video?.addEventListener('ended',()=>{
    const active=Number(surface.querySelector('.stream-episode-choice.is-active')?.dataset.streamEpisode||0);
    changeArchiveEpisode((active+1)%source.episodes.length);
   });
   if(!options.silent)video?.play()?.catch(()=>{});
  }else if(source.provider==='spotify'&&/^[A-Za-z0-9]{16,32}$/.test(source.spotifyId||'')){
   const uri='https://open.spotify.com/'+source.spotifyType+'/'+source.spotifyId;
   const mux=mediaTag('spotify',uri,title);
   surface.innerHTML='<div class="stream-screen is-program is-spotify"><div class="stream-player-label">'+caption+original+'</div>'+
    (mux||'<iframe title="'+title+'" src="https://open.spotify.com/embed/'+source.spotifyType+'/'+source.spotifyId+'" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="eager" referrerpolicy="strict-origin-when-cross-origin"></iframe>')+'</div>';
  }else if(source.provider==='tiktok'&&/^\d{10,30}$/.test(source.tiktokId||'')){
   const player='https://www.tiktok.com/player/v1/'+source.tiktokId;
   const mux=mediaTag('tiktok',player,title);
   surface.innerHTML='<div class="stream-screen is-program is-tiktok"><div class="stream-player-label">'+caption+original+'</div>'+
    (mux||'<iframe title="'+title+'" src="'+player+'" allow="autoplay; fullscreen; encrypted-media; picture-in-picture" loading="eager" referrerpolicy="strict-origin-when-cross-origin"></iframe>')+'</div>';
  }else if(source.videoId&&/^[A-Za-z0-9_-]{11}$/.test(source.videoId)){
   const sourceUrl='https://www.youtube-nocookie.com/embed/'+source.videoId;
   const mux=mediaTag('youtube',sourceUrl,title);
   surface.innerHTML='<div class="stream-screen is-program"><div class="stream-player-label">'+caption+original+channelLink+'</div>'+
    (mux||'<iframe title="'+title+'" src="'+sourceUrl+'?rel=0&autoplay=1&playsinline=1" allow="autoplay; accelerometer; encrypted-media; picture-in-picture; fullscreen; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen loading="eager"></iframe>')+
    (source.chatEligible?
      '<div class="stream-chat-controls"><button type="button" data-stream-chat-toggle aria-expanded="false">Open YouTube live chat</button>'+
      '<small>Live chat only when the original uploader enables it. YouTube manages accounts and moderation.</small>'+
      '<a target="_blank" rel="noopener noreferrer" href="https://www.youtube.com/live_chat?v='+escapeHTML(source.videoId)+'">Chat on YouTube ↗</a></div>'+
      '<div class="stream-chat-host" hidden></div>':'')+'</div>';
  }else{
   const type=source.provider==='archive'?'cultural archive':source.provider==='youtube'?'creator channel':source.provider==='mixtape'?'mixtape':source.provider==='podcast'?'podcast':source.type||'radio station';
   const cta=source.provider==='archive'?'Explore original archive ↗':source.provider==='youtube'?'Browse original videos ↗':source.provider==='mixtape'?'Play on original release ↗':source.provider==='podcast'?'Listen with publisher ↗':'Listen on station website ↗';
   surface.innerHTML='<div class="stream-screen is-external"><span class="stream-monitor-kicker">'+caption+'</span>'+
    '<div class="stream-screen-center"><span>'+(source.provider==='mixtape'?'♫':'◉')+'</span><strong>'+title+'</strong>'+
    '<small>'+escapeHTML(source.subtitle||source.creator||type)+'. Original '+escapeHTML(type)+' remains on its own website.</small>'+
    (url?'<a class="stream-monitor-open" href="'+escapeHTML(url)+'" target="_blank" rel="noopener noreferrer">'+cta+'</a>':'')+
    '</div><span class="stream-screen-bottom">ORIGINAL PUBLISHER · NO MIRRORED CONTENT</span></div>';
  }
  // Use uploaded broadcast bars when the browser reports player failure.
  // Cross-origin players may silently block embedding; users can also use
  // the explicit "No signal?" control in the main Stream guide.
  surface.querySelectorAll('iframe,video').forEach(media=>{
    media.addEventListener('error',()=>{if(surface.contains(media))showNoSignal()},{once:true});
  });
  renderFeaturedSlots();
  scheduleMediaPosition();
  if(!options.silent)monitor.scrollIntoView({behavior:'smooth',block:'center'});
 }
 function changeArchiveEpisode(index){
  const entries=state.selected?.episodes;
  const video=mediaPortal?.querySelector('#streamArchiveVideo');
  if(!video||!Array.isArray(entries)||!Number.isInteger(index)||index<0||index>=entries.length)return;
  video.src=entries[index][1];
  video.load();
  const status=mediaPortal.querySelector('#streamArchiveEpisodeNow');
  if(status)status.textContent='Now showing · '+entries[index][0];
  mediaPortal.querySelectorAll('[data-stream-episode]').forEach(button=>{
   const active=Number(button.dataset.streamEpisode)===index;
   button.classList.toggle('is-active',active);
   button.setAttribute('aria-pressed',String(active));
  });
  video.play().catch(()=>{});
 }
 function playRadio(audio,button){
  if(!audio||!button)return;
  const status=mediaPortal?.querySelector('#streamRadioStatus');
  button.disabled=true;
  if(status)status.textContent='Connecting to station…';
  audio.addEventListener('error',()=>{
   button.disabled=false;button.textContent='▶ Play';
   if(status){
    status.textContent='This station stream is not playing.';
    if(Number.isInteger(state.selected?.stationIndex)&&!state.selected?.alternateStream){
     const retry=document.createElement('button');retry.type='button';
     retry.className='stream-radio-recovery';retry.dataset.streamRadioRetry=String(state.selected.stationIndex);
     retry.textContent='Check alternate stream';status.append(' ',retry);
    }else status.append(' Open the original station site for another listening option.');
   }
  },{once:true});
  Promise.resolve(audio.play()).then(()=>{
   button.textContent='Ⅱ Pause';button.disabled=false;
   if(status)status.textContent='Playing live · original station stream';
  }).catch(error=>{
   button.textContent='▶ Play';button.disabled=false;
   if(status){
    status.textContent='The stream is unavailable or your browser blocked playback.';
    if(Number.isInteger(state.selected?.stationIndex)&&!state.selected?.alternateStream){
     const retry=document.createElement('button');retry.type='button';
     retry.className='stream-radio-recovery';retry.dataset.streamRadioRetry=String(state.selected.stationIndex);
     retry.textContent='Find alternate stream';status.append(' ',retry);
    }
   }
   console.warn('Big LWA radio stream unavailable:',error?.name||'playback error');
  });
 }
 async function retryCollegeRadio(index){
  const station=stations[index];const recovery=window.BigLWARadioDirectory?.findCollegeStream;
  const status=mediaPortal?.querySelector('#streamRadioStatus');
  if(!station||!recovery){if(status)status.textContent='Alternate stream lookup is unavailable. Use the station website.';return}
  if(status)status.textContent='Checking the community directory for a working alternative…';
  try{
   const match=await recovery({name:station[0],state:station[2]});
   if(!match){if(status)status.textContent='No recently checked matching HTTPS audio stream found. Use the station website.';return}
   if(!root?.isConnected)return;
   showSource({title:station[0],category:'podcast',creator:station[1],
    subtitle:station[1]+' · '+station[2],source:'Campus radio / alternate directory stream',
    url:station[3],stationIndex:index,alternateStream:true,
    audioUrl:match.stream,type:'radio station',provider:'radio'}, {silent:true});
   const audio=mediaPortal?.querySelector('#streamRadioAudio'),button=mediaPortal?.querySelector('[data-radio-play]');
   if(audio&&button)playRadio(audio,button);
  }catch(error){if(status?.isConnected)status.textContent='Alternate source lookup failed. '+String(error?.message||'Try the station website.').slice(0,120)}
 }
 function playDirectoryRadio(source){
  if(!root||!source||source.provider!=='radio'||!/^https:\/\//.test(source.audioUrl||''))return false;
  state.followGuide=false;showSource(source,{silent:true});
  const audio=mediaPortal?.querySelector('#streamRadioAudio'),button=mediaPortal?.querySelector('[data-radio-play]');
  if(audio&&button)playRadio(audio,button);
  return true;
 }
 function selectStation(index,options={}){
  const station=stations[index];if(!station||!audioStreams[index])return;
  showSource({title:station[0],category:'podcast',creator:station[1],
   subtitle:station[1]+' · '+station[2],source:'Campus radio',
   url:station[3],stationIndex:index,audioUrl:audioStreams[index]||'',type:'radio station',provider:'radio'},options);
  const audio=mediaPortal?.querySelector('#streamRadioAudio');
  if(audio&&!options.silent)playRadio(audio,mediaPortal.querySelector('[data-radio-play]'));
 }
 function selectFeature(id,options={}){
  const source=[...tvSources(),...featured,...youtubeLive].find(item=>item.id===id);
  if(!source||!source.url||!playableFeature(source))return;
  showSource(source,options);
 }
 function selectTwitch(id,options={}){
  const source=twitchChannels.find(item=>item.id===id);
  if(!source||!source.url)return;
  showSource(source,options);
 }
 function tuneCurrent(){
  if(!root||state.category==='sqwibz'||state.category==='music'||(state.category==='lwa-tv'&&state.tvSection==='wla'))return;
  const hour=new Date().getHours();
  const selected=state.programs.find(item=>item.category===state.category&&item.scheduledAt&&localDay(new Date(item.scheduledAt))===state.day&&new Date(item.scheduledAt).getHours()===hour);
  if(selected)selectProgram(selected.id,{silent:true});
  else{
   const pick=guidePick(state.category,hour);
   if(!pick)return;
   if(pick.kind==='station')selectStation(pick.index,{silent:true});
   else if(pick.kind==='feature')selectFeature(pick.id,{silent:true});
   else if(pick.kind==='twitch')selectTwitch(pick.id,{silent:true});
  }
  state.followGuide=true;
 }
 function musicStandby(){
  if(!root||state.category!=='music')return;
  setPlaying(false);
  state.selected=null;
  const surface=ensureMediaPortal();
  surface.innerHTML='<div class="stream-screen stream-music-standby">'+
   '<span class="stream-monitor-kicker">CH 05 / MUSIC CONNECTIONS</span>'+
   '<div class="stream-screen-center"><span aria-hidden="true">♫</span>'+
   '<strong>your music, your orbit</strong>'+
   '<small>Music APIs are being prepared. No playlists or account data are syncing yet.</small>'+
   '<button type="button" class="stream-music-tunes-btn" data-stream-open-tunes>♫ Open Tunes</button></div>'+
   '<span class="stream-screen-bottom">BIG LWA · connect with consent · no scraped tracks</span></div>';
 }
 function musicSetupMarkup(){
  const linked=window.BigLWAOrbitAccountLinks?.get?.()||{};
  return '<div class="stream-music-setup"><div class="stream-section-head">'+
    '<div><span class="stream-eyebrow">SOUNDS / SOURCE CONNECTIONS</span>'+
    '<h3>music services</h3><p>Prepare your music sources here. Profile links are not playlist permissions, and none of these cards claims an active music API sync.</p></div>'+
    '</div><div class="stream-music-provider-grid">'+
    musicSources.map(provider=>{
      const hasLink=provider.id!=='apple'&&Boolean(linked[provider.id]);
      const label=hasLink?'Profile linked · API not connected':'Awaiting API authorization';
      return '<article class="stream-music-provider" data-music-source="'+provider.id+'">'+
        '<span class="stream-eyebrow">MUSIC API / '+provider.id.toUpperCase()+'</span>'+
        '<h4>'+provider.label+'</h4><p>'+provider.about+'</p>'+
        '<small>'+provider.scope+'</small>'+
        '<strong class="stream-music-provider-status">'+label+'</strong>'+
        '<a class="stream-music-setup-link" href="/studio/orbit" aria-label="Open Orbit to prepare '+provider.label+' connection">Open Orbit ↗</a>'+
        '</article>';
     }).join('')+'</div>'+
    '<div class="stream-music-coming"><b>Next stage</b><p>Provider OAuth on Cloudflare, approved scopes, private account-scoped tokens, playlist matching and opt-in importing. The existing Tunes CSV / JSON transfer and private music uploads stay separate.</p></div></div>';
 }
 function mountStreamSearch(copy){
  const form=document.createElement('form');form.className='stream-program-search';
  form.innerHTML='<label for="streamProgramQuery">Find your frequency</label><div><input id="streamProgramQuery" type="search" maxlength="180" placeholder="A campus, podcast, creator or vibe…" required><button type="submit">Find</button></div><small>Search the dial first; L’wazi can help route an unfamiliar request.</small><div class="stream-program-results" role="status" aria-live="polite"></div>';
  copy.querySelector('p').after(form);
  let request=0;
  form.addEventListener('submit',async event=>{
   event.preventDefault();const query=form.querySelector('input').value.trim(),serial=++request,results=form.querySelector('.stream-program-results');if(!query)return;
   results.textContent='Finding your frequency…';await loadCatalog();if(!form.isConnected||serial!==request)return;
   const score=window.BigLWADiscoveryCatalog?.score||((item,q)=>String(item.title).toLowerCase().includes(q.toLowerCase())?1:0);
   const candidates=stations.map((s,index)=>({title:s[0],school:s[1],state:s[2],kind:'station',index})).concat([...tvSources(),...featured.filter(s=>s.category==='podcast'),...youtubeLive].map(s=>({...s,kind:'feature'})));
   const seen=new Set();const matches=candidates.map(item=>({item,score:score(item,query)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).filter(x=>{const key=x.item.id||'station-'+x.item.index;if(seen.has(key))return false;seen.add(key);return true}).slice(0,8);
   results.replaceChildren();
   for(const {item} of matches){const button=document.createElement('button');button.type='button';button.textContent=item.title+(item.creator?' · '+item.creator:'')+(item.kind==='station'&&!audioStreams[item.index]?' · source pending':'');button.addEventListener('click',()=>{
    state.category=item.kind==='station'?'podcast':item.category||'lwa-tv';state.radioSection=item.kind==='station'?'music':state.category==='podcast'?'podcast':state.radioSection;state.tvSection=item.section||'entertainment';paintCategories();renderGrid();renderCategory();state.followGuide=false;
    if(item.kind==='station'){if(audioStreams[item.index])selectStation(item.index);else{const input=root.querySelector('#streamStationSearch');if(input){input.value=item.title;renderStations(item.title);input.scrollIntoView({block:'center',behavior:'smooth'});}}}else selectFeature(item.id);
   });results.append(button)}
   if(matches.length)return;
   let category=/podcast|episode|interview/i.test(query)?'podcast':/radio|college|campus|station|music/i.test(query)?'radio':/news|bernie|politic/i.test(query)?'news':/live|rain|asmr/i.test(query)?'live':/tv|video|cartoon|gaming|comedy/i.test(query)?'entertainment':'';
   if(!category&&window.__biglwaAskLwazi){try{results.textContent='Asking L’wazi which Stream shelf fits…';const reply=await window.__biglwaAskLwazi('Classify this Stream search as exactly one word: radio, podcast, entertainment, news, live. Query: '+query,[], '',null,{mode:'auto'});const value=String(reply?.answer||reply?.text||reply).trim().toLowerCase();if(/^(radio|podcast|entertainment|news|live)$/.test(value))category=value;}catch{}}
   if(!form.isConnected||serial!==request)return;
   results.textContent=category?'No exact program matched. Explore '+category+' programming:':'No catalog match yet. Try a creator, campus, podcast or mood.';
   if(category){const button=document.createElement('button');button.type='button';button.textContent='Open '+category;button.onclick=()=>{state.category=['radio','podcast'].includes(category)?'podcast':['news','entertainment'].includes(category)?'lwa-tv':'live';state.radioSection=category==='podcast'?'podcast':'music';state.tvSection=category==='news'?'news':'entertainment';paintCategories();renderGrid();renderCategory();tuneCurrent()};results.append(button)}
  });
 }
 // WLA is an on-demand discovery shelf, not a rebroadcast or third-party mirror.
 // Providers own their playback sessions; no external scripts or iframes are loaded.
 // Metadata is independent of playback authorization. No third-party player scripts.
 const wlaOpenFilms=[
  {kind:'film',title:'Sintel',year:'2010',description:'A young woman searches for a lost dragon.',source:'https://durian.blender.org/about/',credit:'© Blender Foundation | www.sintel.org · CC BY 3.0',license:'https://creativecommons.org/licenses/by/3.0/',video:'https://archive.org/download/Sintel/sintel-2048-surround.mp4'},
  {kind:'film',title:'Elephants Dream',year:'2006',description:'Two characters explore a surreal mechanical world.',source:'https://orange.blender.org/press/',credit:'© 2006 Blender Foundation / Netherlands Media Art Institute / www.elephantsdream.org · CC BY 2.5',license:'https://creativecommons.org/licenses/by/2.5/',video:'https://archive.org/download/ElephantsDream/ed_1024.mp4'},
  {kind:'film',title:'Tears of Steel',year:'2012',description:'Science-fiction adventure combining live action and visual effects.',source:'https://mango.blender.org/about/',credit:'© Blender Foundation / www.tearsofsteel.org · CC BY 3.0 · original credits retained',license:'https://creativecommons.org/licenses/by/3.0/',video:'https://archive.org/download/Tears-of-Steel/tears_of_steel_720p.mp4'},
  {kind:'film',title:'The General',year:'1926',description:'A silent comedy adventure starring Buster Keaton.',source:'https://archive.org/details/TheGeneral',credit:'The General (1926) · Internet Archive public-domain edition; rights may vary by country.',license:'https://creativecommons.org/publicdomain/mark/1.0/',video:'https://archive.org/download/TheGeneral/The_General_512kb.mp4',usPublicDomain:true}
 ];
 // Reviewed title links, not a sponsorship agreement or a playback license.
 // Provider availability can change; the provider owns its ad-supported session.
 const wlaTubiTitles=[
  {kind:'movie',title:'The General',year:'1926',tubi:'https://tubitv.com/movies/100011480/the-general'},
  {kind:'movie',title:'His Girl Friday',year:'1940',description:'A newspaper editor tries to persuade his former reporter to stay.',tubi:'https://tubitv.com/movies/100008716/his-girl-friday'},
  {kind:'movie',title:'Night of the Living Dead',year:'1968',description:'Survivors take shelter as the dead return.',tubi:'https://tubitv.com/movies/675222/night-of-the-living-dead'}
 ];
 const wlaFmhyGuide='https://fmhy.net/movies';
 // FMHY is a directory, not a playback license. Only reviewed, legal leads are
 // surfaced; WLA never embeds, scripts or proxies a third-party page.
 const wlaFmhySources=[
  {kind:'film',title:'Sintel',year:'2010',fmhy:wlaFmhyGuide,fmhySource:'Blender Foundation · Internet Archive'},
  {kind:'film',title:'Elephants Dream',year:'2006',fmhy:wlaFmhyGuide,fmhySource:'Blender Foundation · Internet Archive'},
  {kind:'film',title:'Tears of Steel',year:'2012',fmhy:wlaFmhyGuide,fmhySource:'Blender Foundation · Internet Archive'},
  {kind:'film',title:'The General',year:'1926',fmhy:wlaFmhyGuide,fmhySource:'Internet Archive · public-domain edition'},
  {kind:'movie',title:'His Girl Friday',year:'1940',fmhy:wlaFmhyGuide,fmhySource:'Tubi · free with ads'},
  {kind:'movie',title:'Night of the Living Dead',year:'1968',fmhy:wlaFmhyGuide,fmhySource:'Tubi · free with ads'}
 ];
 const wlaKey=item=>String(item.title||'').trim().toLowerCase()+'|'+String(item.year||'')+'|'+(item.kind==='series'?'series':'movie');
 const wlaLibraryItem=item=>({
  id:'wla:'+(/^tt\d+$/.test(item.imdb||'')?item.imdb:wlaKey(item)),
  kind:'movie',title:item.title,year:item.year||'',
  description:item.description||(item.fmhySource?item.fmhySource:''),
  url:item.source||(item.imdb?'https://www.imdb.com/title/'+item.imdb+'/':wlaFmhyGuide),
  source:item.fmhy?'WLA · FMHY reviewed':'WLA · CINEMA',
  imdb:/^tt\d+$/.test(item.imdb||'')?item.imdb:''
 });
 function wlaMerge(...groups){
  const map=new Map();
  for(const item of groups.flat()){
   if(!item?.title)continue;
   const key=wlaKey(item),old=map.get(key);
   if(!old){map.set(key,{...item});continue}
   // Only the explicit, reviewed shelf may confer playback or provider labels.
   const merged={...old};for(const [k,v] of Object.entries(item))if(v&&!merged[k])merged[k]=v;
   if(item.video){Object.assign(merged,item);merged.tubi=merged.tubi||old.tubi}
   map.set(key,merged);
  }
  return [...map.values()];
 }
 let wlaDaily={day:'',rows:[],promise:null};
 function wlaSeries(s){return {kind:'series',id:s.id,title:s.name,year:String(s.premiered||'').slice(0,4),description:wlaText(s.summary),image:wlaHttps(s.image?.medium),source:s.url,official:s.officialSite,imdb:s.externals?.imdb||''}}
 function wlaDailyTitles(){
  const day=new Date().toISOString().slice(0,10);
  if(wlaDaily.day===day&&(wlaDaily.promise||wlaDaily.rows.length))return wlaDaily.promise||Promise.resolve(wlaDaily.rows);
  const entry={day,rows:[],promise:null};wlaDaily=entry;
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),8000);
  entry.promise=wlaJSON('https://api.tvmaze.com/schedule?country=US&date='+encodeURIComponent(day),ctrl.signal).then(data=>{
   if(!Array.isArray(data))throw Error('Daily listings unavailable');
   entry.rows=wlaMerge(data.filter(e=>e.show?.name&&e.show?.id).map(e=>({...wlaSeries(e.show),daily:true}))).slice(0,24);return entry.rows;
  }).finally(()=>{clearTimeout(timer);entry.promise=null});
  return entry.promise;
 }
 const wlaHttps=value=>{try{const u=new URL(value);return u.protocol==='https:'?u.href:''}catch{return ''}};
 const wlaPosterFallback=item=>/^tt\d+$/.test(item.imdb||'')?'https://images.metahub.space/poster/medium/'+item.imdb+'/img':'';
 const wlaCatalogLookup=item=>'https://cinejoy.pk/?s='+encodeURIComponent(String(item.title||'').trim());
 const wlaText=value=>String(value||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
 async function wlaJSON(url,signal){
  const response=await fetch(url,{signal,credentials:'omit',referrerPolicy:'no-referrer'});
  if(!response.ok)throw Error('Catalog unavailable');
  return response.json();
 }
 // Cinemeta is a public, key-free metadata addon keyed by IMDb id. WLA uses it
 // only for display metadata; it never adds streams, trackers or player scripts.
 async function wlaRatings(rows,signal){
  const ids=rows.filter(item=>/^tt\d+$/.test(item.imdb||'')).sort((a,b)=>Number(!!a.image)-Number(!!b.image)).slice(0,24);
  await Promise.allSettled(ids.map(async item=>{
   const type=item.kind==='series'?'series':'movie';
   const data=await wlaJSON('https://v3-cinemeta.strem.io/meta/'+type+'/'+item.imdb+'.json',signal);
   const meta=data?.meta||{};
   const rating=Number(meta.imdbRating);
   if(Number.isFinite(rating)&&rating>0&&rating<=10)item.imdbRating=rating;
   const poster=wlaHttps(meta.poster);if(poster){if(item.image&&item.image!==poster)item.imageFallback=poster;else if(!item.image)item.image=poster}
   if(!item.description&&meta.description)item.description=wlaText(meta.description);
  }));
  for(const item of rows){const fallback=wlaPosterFallback(item);if(!item.image)item.image=fallback;else if(!item.imageFallback&&item.image!==fallback)item.imageFallback=fallback;}
  return rows;
 }
 async function wlaMovieSearch(query,signal){
  // Public-domain structured metadata only, not a streaming source.
  const base='https://www.wikidata.org/w/api.php?format=json&origin=*';
  const found=await wlaJSON(base+'&action=wbsearchentities&language=en&type=item&limit=25&search='+encodeURIComponent(query),signal);
  if(!Array.isArray(found.search))throw Error('Movie catalog unavailable');
  const ids=found.search.map(x=>x.id).filter(id=>/^Q\d+$/.test(id));
  if(!ids.length)return [];
  const data=await wlaJSON(base+'&action=wbgetentities&props=labels%7Cdescriptions%7Cclaims&languages=en&ids='+encodeURIComponent(ids.join('|')),signal);
  if(!data.entities)throw Error('Movie catalog unavailable');
  const filmTypes=new Set(['Q11424','Q24869','Q506240','Q202866','Q24862','Q226730']);
  return ids.map(id=>{
   const e=data.entities[id],match=found.search.find(x=>x.id===id);
   if(!e||!(e.claims?.P4947?.length||e.claims?.P31?.some(c=>filmTypes.has(c.mainsnak?.datavalue?.value?.id))))return null;
   const title=e.labels?.en?.value||match?.label;
   const description=e.descriptions?.en?.value||match?.description||'';
   if(!title)return null;
   return {kind:'movie',title,year:String(e.claims?.P577?.[0]?.mainsnak?.datavalue?.value?.time||'').match(/^\+(\d{4})-/)?.[1]||description.match(/\b(18\d{2}|19\d{2}|20\d{2})\b/)?.[1]||'',
    description,image:e.claims?.P18?.[0]?.mainsnak?.datavalue?.value?'https://commons.wikimedia.org/wiki/Special:FilePath/'+encodeURIComponent(e.claims.P18[0].mainsnak.datavalue.value)+'?width=450':'',source:'https://www.wikidata.org/wiki/'+id,sourceLabel:'Wikidata film information',
    imdb:e.claims?.P345?.[0]?.mainsnak?.datavalue?.value||''};
  }).filter(Boolean);
 }
 async function wlaSearchTitles(query,signal){
  const clean=String(query||'').trim().slice(0,180);
  if(!clean)return {rows:[],missing:[]};
  const ctrl=new AbortController(),abort=()=>ctrl.abort();
  if(signal?.aborted)abort();else signal?.addEventListener('abort',abort,{once:true});
  const timer=setTimeout(abort,10000);
  try{
   const [tv,movies]=await Promise.allSettled([
    wlaJSON('https://api.tvmaze.com/search/shows?q='+encodeURIComponent(clean),ctrl.signal),
    wlaMovieSearch(clean,ctrl.signal)
   ]);
   const local=wlaMerge(wlaOpenFilms,wlaTubiTitles,wlaFmhySources).filter(item=>item.title.toLowerCase().includes(clean.toLowerCase()));
   const shows=tv.status==='fulfilled'&&Array.isArray(tv.value)?tv.value.slice(0,24).filter(x=>x.show?.name).map(({show:s})=>wlaSeries(s)):[];
   const films=movies.status==='fulfilled'&&Array.isArray(movies.value)?movies.value:[];
   const rows=await wlaRatings(wlaMerge(local,shows,films),ctrl.signal);
   return {rows,missing:[tv.status==='rejected'?'Series':null,movies.status==='rejected'?'Movies':null].filter(Boolean)};
  }finally{clearTimeout(timer);signal?.removeEventListener('abort',abort)}
 }
 const wlaSearchHandles=new Map();
 let wlaNextHandle=0,wlaPending=null;
 async function wlaGlobalSearch(query){
  const clean=String(query||'').trim().replace(/^(?:where (?:can|to) (?:i )?watch|watch|stream|find (?:the )?(?:movie|show|series))\s+/i,'').replace(/\s+(?:movie|tv show|tv series|full movie|streaming)\s*\??$/i,'').replace(/\?$/,'').trim();
  if(clean.length<2||clean.length>120)return [];
  const found=await wlaSearchTitles(clean);
  const norm=v=>String(v||'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  const needle=norm(clean);if(!needle)return [];
  return found.rows.filter(item=>{const title=norm(item.title);return title===needle||(' '+title+' ').includes(' '+needle+' ')||(' '+needle+' ').includes(' '+title+' ')&&title.length>=4}).slice(0,12).map(item=>{
   const id='wla-'+(++wlaNextHandle);wlaSearchHandles.set(id,item);
   if(wlaSearchHandles.size>180)wlaSearchHandles.delete(wlaSearchHandles.keys().next().value);
   return {id,title:item.title,year:item.year,kind:item.kind,image:item.image,imageFallback:item.imageFallback||wlaPosterFallback(item),catalogLookup:wlaCatalogLookup(item),description:item.description,playable:!!item.video,tubi:!!item.tubi,fmhy:!!item.fmhy,imdb:item.imdb||'',imdbRating:item.imdbRating||0};
  });
 }
 function openWlaSearchResult(id){
  const item=wlaSearchHandles.get(id);
  if(!item||!root?.isConnected||!root.querySelector('#streamCategoryCopy'))return false;
  wlaPending=item;state.category='lwa-tv';state.tvSection='wla';state.selected=null;state.followGuide=false;
  paintCategories();renderGrid();renderCategory();return true;
 }
 function mountWla(copy,detail){
  state.followGuide=false;
  if(state.selected||!mediaPortal?.querySelector('.wla-cinema-standby,.wla-film-player')){
   setPlaying(false);state.selected=null;
   ensureMediaPortal().innerHTML='<div class="stream-screen wla-cinema-standby"><span class="stream-monitor-kicker">CH 02 / WLA</span><div class="wla-cinema-emblem wla-skull-mask" aria-hidden="true"></div><strong>wla</strong><small>cinema · on demand</small><span class="stream-screen-bottom">BIG LWA · ORIGINAL VIEWING SOURCES</span></div>';
  }
  copy.querySelector('h2').textContent='wla';
  copy.querySelector('.stream-eyebrow').textContent='CH 02 / THE CINEMA';
  copy.querySelector('p').textContent='Find a title, choose a season or episode, and watch when an authorized source is available.';
  const picker=copy.querySelector('#streamDiscoveryPicker');
  picker.innerHTML='<form class="wla-title-search"><label for="wlaTitleQuery">Find a movie or series</label><div><input id="wlaTitleQuery" name="q" type="search" maxlength="180" required placeholder="Title, movie or show…"><button type="submit">Find</button></div></form><nav class="wla-browse" aria-label="Filter catalog"><button type="button" data-wla-filter="all" aria-pressed="true">All</button><button type="button" data-wla-filter="movie" aria-pressed="false">Movies</button><button type="button" data-wla-filter="series" aria-pressed="false">Series</button><button type="button" data-wla-filter="film" aria-pressed="false">Watch here</button><button type="button" data-wla-filter="tubi" aria-pressed="false">Free on Tubi</button><button type="button" data-wla-filter="fmhy" aria-pressed="false">FMHY shelf</button><button type="button" data-wla-home>Browse today</button></nav>';
  picker.insertAdjacentHTML('beforeend','<div class="wla-fmhy-browser" hidden><div class="wla-fmhy-chrome"><span class="wla-fmhy-dot" aria-hidden="true"></span><span>fmhy.net / movies</span><span class="wla-fmhy-tab">reviewed guide · no embed</span></div><p>Reviewed, legal free-title leads from the FMHY guide. WLA shows the catalog here; each source keeps its own player and terms.</p></div><p class="wla-status" role="status" aria-live="polite"></p><div class="wla-carousel"><button type="button" class="wla-arrow" data-wla-step="-1" aria-label="Previous titles">‹</button><div class="wla-results" tabindex="0" aria-label="Movie and series titles"></div><button type="button" class="wla-arrow" data-wla-step="1" aria-label="Next titles">›</button></div><div class="wla-selection" hidden></div>');
  detail.innerHTML='<details class="wla-catalog-credits"><summary>Catalog sources</summary><small class="wla-attribution">Series data: <a href="https://www.tvmaze.com/api" target="_blank" rel="noopener noreferrer">TVmaze</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>. Movie metadata: <a href="https://www.wikidata.org/" target="_blank" rel="noopener noreferrer">Wikidata (CC0)</a>. Daily TV listings are refreshed from TVmaze’s US schedule; they do not imply streaming availability. Tubi links are reviewed listings, subject to provider availability; no sponsorship is implied. Ratings come from <a href="https://imdb.com/" target="_blank" rel="noopener noreferrer">IMDb</a> through Cinemeta. Cinejoy links open its own catalog; WLA does not extract, proxy or host third-party streams. FMHY leads are reviewed legal sources only.</small></details>';
  const form=picker.querySelector('form'),input=form.querySelector('input'),status=picker.querySelector('.wla-status'),results=picker.querySelector('.wla-results'),selection=picker.querySelector('.wla-selection');
  const arrows=[...picker.querySelectorAll('[data-wla-step]')];
  const updateArrows=()=>{const max=Math.max(0,results.scrollWidth-results.clientWidth);arrows[0].disabled=results.scrollLeft<2;arrows[1].disabled=results.scrollLeft>=max-2};
  arrows.forEach(btn=>btn.addEventListener('click',()=>{results.scrollBy({left:Number(btn.dataset.wlaStep)*Math.max(90,results.clientWidth-90),behavior:'smooth'});}));
  results.addEventListener('scroll',updateArrows,{passive:true});
  if(typeof ResizeObserver==='function'){const observer=new ResizeObserver(()=>{if(!picker.isConnected)observer.disconnect();else updateArrows()});observer.observe(results)}
  const shelf=wlaMerge(wlaOpenFilms,wlaTubiTitles,wlaFmhySources);let rows=shelf.slice(),filter='all',searchVersion=0,pickVersion=0,controller=null;
  const alive=()=>copy.contains(results)&&state.category==='lwa-tv'&&state.tvSection==='wla';
  function node(tag,text,cls){const el=document.createElement(tag);if(text)el.textContent=text;if(cls)el.className=cls;return el}
  function link(label,url){const safe=wlaHttps(url);if(!safe)return null;const a=node('a',label);a.href=safe;a.target='_blank';a.rel='noopener noreferrer';return a}
  function renderRows(){
   if(!alive())return;
   results.replaceChildren();results.scrollLeft=0;selection.hidden=true;pickVersion++;
   const fmhyBrowser=picker.querySelector('.wla-fmhy-browser');if(fmhyBrowser)fmhyBrowser.hidden=filter!=='fmhy';
   const visible=rows.filter(item=>filter==='all'||(filter==='tubi'?!!item.tubi:filter==='fmhy'?!!item.fmhy:filter===item.kind||(filter==='movie'&&item.kind==='film')));
   for(const item of visible){
    const card=node('button','','wla-result');card.type='button';
    const placeholder=()=>node('span',item.title.slice(0,70),'wla-poster-placeholder');
    if(item.image||wlaPosterFallback(item)){const image=node('img');image.alt=item.title+' poster';image.loading='lazy';image.referrerPolicy='no-referrer';image.addEventListener('error',()=>{const fallback=item.imageFallback||wlaPosterFallback(item);if(fallback&&image.src!==fallback&&!image.dataset.fallbackTried){image.dataset.fallbackTried='1';image.src=fallback}else image.replaceWith(placeholder())});image.src=item.image||wlaPosterFallback(item);card.append(image)}
    else card.append(placeholder());
    const labels=node('span','','wla-result-label');labels.append(node('strong',item.title),node('small',[item.year,item.kind==='series'?'Series':item.kind==='film'?'Full film · watch here':'Movie'].filter(Boolean).join(' · ')));
    const tags=node('span','','wla-source-tags');
    if(item.video){const tag=node('span','','wla-source-tag wla-source-own');const skull=node('span','','wla-skull-mask');skull.setAttribute('aria-hidden','true');tag.append(skull,node('span','WLA · free here'));tags.append(tag)}
    if(item.tubi)tags.append(node('span','Tubi · free with ads ↗','wla-source-tag wla-source-tubi'));
    if(item.fmhy)tags.append(node('span','FMHY · reviewed legal lead','wla-source-tag wla-source-fmhy'));
    if(item.imdbRating)tags.append(node('span','IMDb ★ '+Number(item.imdbRating).toFixed(1),'wla-source-tag wla-source-imdb'));
    if(!item.video&&!item.tubi&&!item.fmhy)tags.append(node('span',item.daily?'Today’s TV · info only':'Title info only','wla-source-tag wla-source-info'));
    labels.append(tags);card.append(labels);card.addEventListener('click',()=>select(item));results.append(card);
   }
   if(!visible.length)results.append(node('p','No matching titles in this filter.'));
   updateArrows();
  }
  async function select(item){
   const version=++pickVersion;
   selection.hidden=false;selection.replaceChildren(node('h3',item.title),node('p',item.description||'No synopsis available.'));
   if(item.imdbRating)selection.append(node('small','IMDb ★ '+Number(item.imdbRating).toFixed(1)+' / 10 · public rating','wla-imdb-rating'));
   const back=node('button','Close details','wla-close-details');back.type='button';back.addEventListener('click',()=>{pickVersion++;selection.hidden=true});selection.prepend(back);
   if(item.credit){const credit=node('p',item.credit);const license=link(item.usPublicDomain?'Public-domain information':'License',item.license);if(license)credit.append(' · ',license);selection.append(credit)}
   if(item.video){
    const play=node('button','Play full film here');play.type='button';
    play.addEventListener('click',()=>{
     if(!alive())return;
     const surface=ensureMediaPortal(),video=node('video');video.src=item.video;video.controls=true;video.playsInline=true;video.preload='metadata';video.className='wla-film-player';
     const credit=node('small',item.credit,'wla-player-credit');surface.replaceChildren(video,credit);
     video.addEventListener('error',()=>{status.textContent='This licensed source could not be played. Use its original source link below.'});
     Promise.resolve(video.play()).catch(()=>{});
    });selection.append(play);
    if(item.usPublicDomain)selection.append(node('small','Public-domain edition in the US; local rights may differ.'));
   }else selection.append(node('p','Full playback is not available in WLA for this title. Choose an original provider if available.'));
   if(item.tubi){const provider=link('Watch free on Tubi ↗',item.tubi);if(provider){provider.className='wla-tubi-watch';selection.append(provider,node('small','Opens Tubi’s own ad-supported player. Availability may vary by region or change over time.'));}}
   const source=link(item.kind==='series'?'TVmaze title information':item.kind==='film'?'Original film and rights information':(item.sourceLabel||'Movie information'),item.source);if(source)selection.append(source);
   const official=link('Official show website',item.official);if(official)selection.append(official);
   if(/^tt\d+$/.test(item.imdb||'')){const imdb=link('IMDb title page ↗','https://www.imdb.com/title/'+item.imdb+'/');if(imdb)selection.append(imdb)}
   const externalCatalog=link('☠',wlaCatalogLookup(item));if(externalCatalog){externalCatalog.className='wla-cinejoy-link wla-catalog-icon';externalCatalog.setAttribute('aria-label','External catalog search for '+item.title);externalCatalog.title='External catalog search · availability unverified';selection.append(externalCatalog)}
   if(item.fmhy){const guide=link('FMHY reviewed guide ↗',item.fmhy);if(guide){guide.className='wla-fmhy-link';selection.append(guide,node('small',item.fmhySource||'Reviewed legal lead from the FMHY guide.'))}}
   const libraryItem=wlaLibraryItem(item),catalog=window.__biglwaLibraryCatalog;
   const save=node('button',catalog?.hasTitle?.(libraryItem)?'Saved to Library':'Save to Library','wla-save-library');save.type='button';save.setAttribute('aria-pressed',String(!!catalog?.hasTitle?.(libraryItem)));
   save.addEventListener('click',async()=>{
    if(save.disabled)return;save.disabled=true;
    try{
     const account=window.BigLWAAccountStorage;
     if(!account||!window.__biglwaLibraryCatalog?.addTitle)throw Error('Library is still loading. Try again in a moment.');
     await account.ready;
     if(!account.uid)throw Error('Sign in to save titles to your Library.');
     const added=window.__biglwaLibraryCatalog.addTitle(libraryItem);
     save.textContent=added?'Saved to Library':'Already in Library';save.setAttribute('aria-pressed','true');
     status.textContent=added?'Added '+item.title+' to your private Library shelf.':item.title+' is already in your Library.';
    }catch(error){status.textContent=error.message||'Could not save this title.'}
    finally{save.disabled=false;}
   });selection.append(save);
   if(item.kind!=='series')return;
   const episodeBox=node('div','','wla-episode-box');episodeBox.append(node('p','Loading seasons…'));selection.append(episodeBox);
   try{
    const episodes=await wlaJSON('https://api.tvmaze.com/shows/'+encodeURIComponent(item.id)+'/episodes',controller?.signal);
    if(!alive()||version!==pickVersion)return;
    const seasons=[...new Set(episodes.map(e=>e.season))].filter(Number.isInteger).sort((a,b)=>a-b);
    episodeBox.replaceChildren();if(!seasons.length){episodeBox.append(node('p','No episodes listed.'));return}
    const label=node('label','Season '),season=node('select');season.setAttribute('aria-label','Season');
    for(const n of seasons){const opt=node('option','Season '+n);opt.value=String(n);season.append(opt)}
    label.append(season);const list=node('div','','wla-episodes');episodeBox.append(label,list);
    const draw=()=>{list.replaceChildren();for(const ep of episodes.filter(e=>e.season===Number(season.value))){
      const btn=node('button',(ep.number==null?'Special':'Episode '+ep.number)+' · '+ep.name);btn.type='button';
      btn.addEventListener('click',()=>{const old=episodeBox.querySelector('.wla-episode-detail');old?.remove();const info=node('div','','wla-episode-detail');info.append(node('strong',ep.name),node('p',[ep.airdate,wlaText(ep.summary)].filter(Boolean).join(' · ')),node('small','No authorized full-episode stream is connected.'));const a=link('Episode information',ep.url);if(a)info.append(a);episodeBox.append(info)});list.append(btn)
    }};season.addEventListener('change',draw);draw();
   }catch{if(alive()&&version===pickVersion)episodeBox.replaceChildren(node('p','Episode information unavailable. Try again.'))}
  }
  picker.querySelectorAll('[data-wla-filter]').forEach(btn=>btn.addEventListener('click',()=>{filter=btn.dataset.wlaFilter;picker.querySelectorAll('[data-wla-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===btn)));renderRows()}));
  form.addEventListener('submit',async event=>{
   event.preventDefault();const query=input.value.trim();if(!query)return;
   controller?.abort();controller=new AbortController();const version=++searchVersion;pickVersion++;selection.hidden=true;
   status.textContent='Searching titles…';results.replaceChildren();
   const found=await wlaSearchTitles(query,controller.signal);
   if(!alive()||version!==searchVersion)return;
   rows=found.rows;status.textContent=rows.length+' title matches'+(found.missing.length?' · '+found.missing.join(' and ')+' catalog temporarily unavailable.':'');
   renderRows();
  });
  function browseToday(){
   controller?.abort();const version=++searchVersion;input.value='';rows=shelf.slice();filter='all';
   picker.querySelectorAll('[data-wla-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.wlaFilter==='all')));
   status.textContent='Free films and provider listings · loading today’s TV titles…';renderRows();
   wlaDailyTitles().then(daily=>{
    if(!alive()||version!==searchVersion)return;
    rows=wlaMerge(shelf,daily);status.textContent='Browse '+rows.length+' titles · daily TV listings from TVmaze';renderRows();
   }).catch(()=>{if(alive()&&version===searchVersion)status.textContent='Free films and provider listings · daily TV listings unavailable.'});
  }
  picker.querySelector('[data-wla-home]').addEventListener('click',browseToday);
  if(wlaPending){
   const item=wlaPending;wlaPending=null;input.value=item.title;rows=wlaMerge([item],shelf.filter(x=>wlaKey(x)===wlaKey(item)));
   status.textContent='Opened from L’wazi search';renderRows();select(rows[0]);
   // Keep the title carousel and details beside the player.
  }else browseToday();
 }
 function renderCategory(){
  if(!root)return;
  const copy=root.querySelector('#streamCategoryCopy');
  const detail=root.querySelector('#streamSectionDetail');
  const cfg={
   podcast:['CH 01 / THE CAMPUS DIAL','lwa radio',
    'Play campus radio directly inside Big LWA. Only stations with a configured audio stream are radio ready.'],
   'lwa-tv':['CH 02 / THE PICTURE','lwa tv',
    'Recent creator uploads, community favorites and original programming. Choose Entertainment, News or WLA cinema.'],
   live:['CH 03 / YOUTUBE + TWITCH','live',
    'Watch YouTube music, ASMR and frequency recordings alongside Twitch channels. Current live availability is not guaranteed.'],
   sqwibz:['CH 04 / THE TIMELINE','sqwidz',
    'Short thoughts, long reads, photos and clips from the community. Float a post, reply and keep the conversation moving.'],
   music:['LWA RADIO / MUSIC','music',
    'Connect the sounds you love. Bring playlists and libraries into Stream once authorized music services are ready.'],
  }[state.category];
  copy.innerHTML=((state.category==='podcast'||state.category==='music')?'<nav class="stream-radio-modes" aria-label="Radio listening"><button type="button" data-radio-section="podcast" aria-pressed="'+(state.category==='podcast'&&state.radioSection==='podcast')+'">Podcasts</button><button type="button" data-radio-section="music" aria-pressed="'+(state.category==='music'||state.radioSection==='music')+'">Music</button></nav>':'')+'<span class="stream-eyebrow">'+cfg[0]+'</span><h2>'+cfg[1]+'</h2><p>'+cfg[2]+'</p>'+
   '<div id="streamDiscoveryPicker" class="stream-discovery-picker" aria-label="Daily Discovery playable choices"></div>';
  if(state.category==='podcast'&&state.radioSection==='podcast'){copy.querySelector('h2').textContent='podcasts';copy.querySelector('p').textContent='Conversations, stories and episodes from their original creators.';copy.querySelector('.stream-eyebrow').textContent='LWA RADIO / PODCASTS';}
  if(state.category==='lwa-tv'){const modes=document.createElement('nav');modes.className='stream-radio-modes stream-tv-modes';modes.setAttribute('aria-label','TV programming');modes.innerHTML=['entertainment','news','wla'].map(id=>'<button type="button" data-tv-section="'+id+'" aria-pressed="'+(state.tvSection===id)+'">'+(id==='wla'?'<span class="wla-skull-mask" aria-hidden="true"></span><span>WLA</span>':id==='news'?'News':'Entertainment')+'</button>').join('');copy.prepend(modes);if(state.tvSection==='news')copy.querySelector('h2').textContent='lwa news';}
  if(state.category==='lwa-tv'&&state.tvSection==='wla'){mountWla(copy,detail);return;}
  mountStreamSearch(copy);
  if(state.category==='sqwibz')sqRight(sqCurrent(),null);
  if(state.category==='music'){
   detail.innerHTML=musicSetupMarkup();
   root.querySelector('#streamDiscoveryPicker')?.replaceChildren();
   musicStandby();
  }else if(state.category==='podcast'&&state.radioSection==='podcast'){
   detail.innerHTML='<h3>podcasts</h3><p>Conversations, stories and original episodes.</p><div id="streamRadioExtras" class="stream-radio-extras-grid"></div>';renderRadioExtras();
  }else if(state.category==='podcast'){
   detail.innerHTML='<div class="stream-section-head"><div><span class="stream-eyebrow">LWA RADIO / COLLEGE DIAL</span><h3>college & world radio</h3><p>Press Play to listen directly in Big LWA. Includes all 16 campus stations, the 50-state directory and world stations share this dial; stations still missing an in-site audio source are marked pending rather than removed.</p></div><label>Find a station <input id="streamStationSearch" type="search" placeholder="School or call letters" autocomplete="off"></label></div><div class="stream-stations" id="streamStations"></div><p class="stream-directory-note">Audio streams remain hosted by their original broadcasters or listed stream relays. No partnership is implied.</p><section class="stream-radio-extras" aria-label="More LWA radio programs and mixtapes"><div class="stream-section-head"><div><span class="stream-eyebrow">LWA RADIO / EXTRA TUNES</span><h3>mixtapes, podcasts &amp; DJ sets</h3><p>Our additional original-source listening directory. Tracks with playable clips can tune into Stream; other entries open their credited publisher.</p></div></div><div id="streamRadioExtras" class="stream-radio-extras-grid"></div></section>';
   const filter=detail.querySelector('#streamStationSearch');
   filter.oninput=()=>renderStations(filter.value);
   renderStations('');
   renderRadioExtras();
   window.BigLWARadioDirectory?.mount?.(root,{play:playDirectoryRadio,unified:true});
   const math=document.createElement('details');math.className='stream-programming-math';
   const count=Object.keys(audioStreams).length,weight=count+1;
   math.innerHTML='<summary>How the radio rotation works · UCLA bias included 🤎</summary><p>'+count+' playable stations · one hour per slot. Each station gets weight 1; UCLA gets weight 2 ('+(200/weight).toFixed(1)+'% of slots; everyone else '+(100/weight).toFixed(1)+'%). Morning 6am–noon, midday noon–6pm, night 6pm–6am, in your device’s timezone.</p><p>For an unchanged playable lineup, separate rotating counters for each daypart cover every station within '+Math.ceil(weight/6)+' days. Over '+weight+' days each station gets the same morning, midday and night share within its weight. This schedules which original stream we tune to; it does not alter the station’s own shows. Manual picks interrupt guide following.</p><p>World starter selection: one recently directory-checked HTTPS stream from each of Haiti, Jamaica, Mexico, Brazil, France, UK, Ghana, Nigeria, Senegal, South Africa, India and Japan, ranked within each country by Radio Browser clicks. This is a disclosed editorial starting set, not global popularity. Unavailable sources remain listed, outside the playable rotation.</p><button type="button" data-follow-radio>Follow scheduled radio</button>';
   detail.prepend(math);
   const services=document.createElement('details');services.innerHTML='<summary>Music services & playlists</summary>'+musicSetupMarkup();detail.append(services);
  }else if(state.category==='lwa-tv'){
   detail.innerHTML='<div class="stream-section-head"><div><span class="stream-eyebrow">LWA TV / READY TO WATCH</span><h3>pick a video, stay here</h3><p>Use the thumbnail and arrows above to browse playable clips and cartoons. Channel-page links without a playable video are not shown as TV programs. Ballroom / CCTV remains within LWA TV.</p></div></div><p class="stream-directory-note">Original publishers control their own embedding permissions; this does not imply a Big LWA partnership.</p>';
  }else if(state.category==='sqwibz'){
   // Sqwidz is mounted in the existing monitor, never in a redundant body section.
   detail.replaceChildren();
  }else{
   detail.innerHTML='<div class="stream-section-head"><div><span class="stream-eyebrow">LIVE / YOUTUBE + TWITCH</span><h3>relax, listen & watch</h3><p>Lofi Girl, rain ASMR, frequency-based music and Twitch broadcasts can play inside the monitor. Recorded videos are labeled as recordings; channels may be offline.</p></div></div><p class="stream-directory-note">Original players retain publisher attribution and their own embed restrictions.</p>';
  }
  // Always populate the NEW channel-copy node after renderCategory recreates it;
  // otherwise switching tabs discards the previous Daily Discovery cards.
  renderFeaturedSlots();
 }
 function renderRadioExtras(){
  const host=root?.querySelector('#streamRadioExtras');if(!host)return;
  const extras=featured.filter(item=>item.category==='podcast'&&(state.radioSection==='podcast'?/podcast/i.test(item.source||''):!/podcast/i.test(item.source||''))&&/^https:\/\//.test(item.url||''));
  host.innerHTML=extras.map(item=>{
   const clip=item.videoId&&/^[A-Za-z0-9_-]{11}$/.test(item.videoId);
   return '<article class="stream-radio-extra"><span class="stream-eyebrow">'+escapeHTML(item.source||'ORIGINAL PROGRAM')+'</span><strong>'+escapeHTML(item.title)+'</strong><small>'+escapeHTML(item.creator||'')+'</small><p>'+escapeHTML(item.subtitle||'')+'</p><div class="stream-radio-extra-actions">'+
    (clip?'<button type="button" data-stream-feature="'+escapeHTML(item.id)+'">▶ Play in Stream</button>':'')+
    '<a href="'+escapeHTML(item.url)+'" target="_blank" rel="noopener noreferrer">Original source ↗</a></div></article>';
  }).join('');
 }
 function renderStations(query){
  const panel=root?.querySelector('#streamStations');if(!panel)return;
  const needle=String(query||'').toLowerCase().trim();
  // Keep ALL original campus stations findable. If no usable HTTPS audio
  // endpoint has been identified, explain that honestly instead of deleting it.
  const selected=stations.map((station,index)=>({station,index}))
   .filter(({station})=>station.join(' ').toLowerCase().includes(needle))
   .sort((a,b)=>Number(Boolean(audioStreams[b.index]))-Number(Boolean(audioStreams[a.index]))||a.index-b.index);
  panel.innerHTML=selected.map(({station,index})=>{
   const ready=Boolean(audioStreams[index]);
   const label='<span class="stream-station-no">'+String(index+1).padStart(2,'0')+'</span>'+
    '<span class="stream-station-details"><b>'+escapeHTML(station[0])+'</b><small>'+escapeHTML(station[1])+' · '+escapeHTML(station[2])+'</small></span>';
   return ready
    ?'<button type="button" class="stream-station is-ready" data-stream-station="'+index+'" aria-label="Play '+escapeHTML(station[0])+' in Big LWA">'+label+'<span class="stream-station-go">▶ Play</span></button>'
    :'<div class="stream-station is-pending">'+label+
      '<span class="stream-station-pending"><small>In-site audio source pending</small>'+
      '<a href="'+escapeHTML(station[3])+'" target="_blank" rel="noopener noreferrer" aria-label="Station website for '+escapeHTML(station[0])+'">Station info ↗</a></span></div>';
  }).join('')||
   '<p class="stream-station-empty">No college stations match that search.</p>';
 }
 async function refreshPublic(){
  try{
   const result=await workerFetch('programming');
   if(!root)return;
   state.programs=Array.isArray(result.items)?result.items.filter(item=>item&&item.videoId&&item.scheduledAt):[];
   renderGrid();
   if(state.followGuide)tuneCurrent();
  }catch(error){console.warn('Stream programming lookup',error)}
 }
 async function refreshAccount(){
  const token=await getUserToken();
  if(!root)return;
  if(!token){
   state.myRequests=[];state.editorial=[];state.isEditor=false;renderRequests();return;
  }
  try{
   const [mine,editorial]=await Promise.allSettled([
    workerFetch('requests',{headers:{Authorization:'Bearer '+token}}),
    workerFetch('editorial',{headers:{Authorization:'Bearer '+token}})
   ]);
   if(!root)return;
   state.myRequests=mine.status==='fulfilled'&&Array.isArray(mine.value.items)?mine.value.items:[];
   state.isEditor=editorial.status==='fulfilled'&&Array.isArray(editorial.value.items);
   state.editorial=state.isEditor?editorial.value.items:[];
   renderRequests();renderEditorial();
  }catch(error){console.warn('Stream account lookup',error)}
 }
 function renderRequests(){
  const panel=root?.querySelector('#streamMyRequests');if(!panel)return;
  if(!state.myRequests.length){panel.innerHTML='<p class="stream-request-hint">Submitted requests will appear here with their review status when you are signed in.</p>';return}
  panel.innerHTML='<h3>your programming requests</h3><div class="stream-request-list">'+
   state.myRequests.slice(0,12).map(item=>'<div><b>'+escapeHTML(item.title)+'</b><span class="stream-request-badge">'+escapeHTML(item.status||'pending')+'</span><small>'+escapeHTML(item.category)+'</small></div>').join('')+'</div>';
 }
 function renderEditorial(){
  const panel=root?.querySelector('#streamEditorial');if(!panel)return;
  panel.hidden=!state.isEditor;
  if(!state.isEditor)return;
  const pending=state.editorial.filter(x=>x.status==='pending');
  panel.innerHTML='<span class="stream-eyebrow">EDITORIAL CONTROL / MODERATORS ONLY</span><h2>programming requests</h2><p>Approve only content authorized for YouTube embedding or rebroadcast; verify creator credit and availability first.</p>'+
   (pending.length?'<div class="stream-editorial-list">'+pending.map(item=>
    '<article data-stream-review="'+escapeHTML(item.id)+'"><div><b>'+escapeHTML(item.title)+'</b> <small>'+escapeHTML(item.category)+' · '+escapeHTML(item.rights)+'</small><p>'+escapeHTML(item.note||'No notes provided')+'</p><a href="'+escapeHTML(item.youtubeUrl)+'" target="_blank" rel="noopener noreferrer">verify on YouTube ↗</a></div><label>Schedule (local time) <input type="datetime-local" data-stream-when="'+escapeHTML(item.id)+'"></label><div><button type="button" data-stream-approve="'+escapeHTML(item.id)+'" data-stream-owner="'+escapeHTML(item.uid)+'">Approve and schedule</button><button type="button" data-stream-decline="'+escapeHTML(item.id)+'" data-stream-owner="'+escapeHTML(item.uid)+'">Decline</button></div></article>').join('')+'</div>':
    '<p>No pending editorial requests.</p>')+'<p id="streamEditorialStatus" role="status"></p>';
 }
 function selectProgram(id,options={}){
  const item=state.programs.find(p=>p.id===id);
  if(!item)return;
  setPlaying(false);
  state.selected={...item,isProgram:true};if(!options.silent)saveLastPlayed({...item,isProgram:true});state.category=item.category;paintCategories();renderGrid();renderCategory();
  const monitor=root.querySelector('#streamMonitor');
  ensureMediaPortal().innerHTML='<div class="stream-screen is-program"><div class="stream-player-label">'+
   '<span>'+escapeHTML(categories.find(c=>c[0]===item.category)?.[2]||'CH')+' / '+escapeHTML(item.title)+'</span>'+
   '<a href="'+escapeHTML(item.youtubeUrl)+'" target="_blank" rel="noopener noreferrer">YouTube ↗</a></div>'+
   (mediaTag('youtube','https://www.youtube-nocookie.com/embed/'+item.videoId,item.title)||
   '<iframe title="'+escapeHTML(item.title)+'" src="https://www.youtube-nocookie.com/embed/'+escapeHTML(item.videoId)+'?rel=0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen loading="lazy"></iframe>')+
   '</div>';
  renderFeaturedSlots();
  scheduleMediaPosition();
  if(!options.silent)monitor.scrollIntoView({behavior:'smooth',block:'center'});
 }
 // Requests remain a future feature; the old routing hook is intentionally inert.
 function prefillRequest(_url){return false}
 async function onSubmit(event){
  event.preventDefault();
  const form=event.currentTarget;
  const status=root.querySelector('#streamRequestStatus');
  const button=form.querySelector('button[type=submit]');
  const data=Object.fromEntries(new FormData(form).entries());
  if(!['my-video','nomination'].includes(data.rights)){
   status.textContent='Please select whether the video is yours or a nomination.';return;
  }
  button.disabled=true;status.textContent='Sending your request for review…';
  try{
   const answer=await authRequest('requests',data);
   status.textContent='Request '+answer.id+' saved for editorial review. Scheduling is not automatic.';
   form.reset();form.elements.category.value=state.category;
   await refreshAccount();
  }catch(error){status.textContent=error.message||'Could not submit. Try again.'}
  finally{button.disabled=false}
 }
 async function review(entryId,uid,decision){
  const item=state.editorial.find(e=>e.id===entryId&&e.uid===uid);
  if(!item)return;
  const status=root.querySelector('#streamEditorialStatus');
  const picker=root.querySelector('[data-stream-when="'+entryId+'"]');
  let scheduledAt='';
  if(decision==='approved'){
   if(!picker?.value){status.textContent='Set a programming date and local time first.';return}
   const d=new Date(picker.value);if(!Number.isFinite(d.valueOf())){status.textContent='Select a valid date and time.';return}
   scheduledAt=d.toISOString();
  }
  status.textContent='Saving editorial decision…';
  try{
   await authRequest('editorial',{uid,id:entryId,decision,scheduledAt});
   status.textContent='Decision saved.';
   await Promise.all([refreshAccount(),refreshPublic()]);
  }catch(error){status.textContent=error.message||'Could not save the decision.'}
 }
 function onClick(event){
  // When the persistent player sits inside Stream, clicks bubble to the page
  // listener too. Handle Play/Pause only once or it will immediately pause.
  if(event.currentTarget===root&&mediaPortal?.contains(event.target))return;
  const button=event.target.closest('button');
  if(!button||!(root?.contains(button)||mediaPortal?.contains(button)))return;
  if(button.matches('[data-stream-return]')){undockStream(true);return;}
  if(button.matches('[data-stream-dock]')){dockStream();return;}
  if(button.matches('[data-stream-no-signal]')){showNoSignal();return;}
  if(button.matches('[data-stream-chat-toggle]')){
    const selected=state.selected;
    const host=mediaPortal?.querySelector('.stream-chat-host');
    if(!host||!selected?.chatEligible||!/^[A-Za-z0-9_-]{11}$/.test(selected.videoId||''))return;
    const opening=host.hidden;
    host.replaceChildren();
    if(opening){
      const frame=document.createElement('iframe');
      const hostname=['biglwa.com','www.biglwa.com','leianmulatre-lwa.github.io'].includes(location.hostname)?location.hostname:'biglwa.com';
      frame.src='https://www.youtube.com/live_chat?v='+encodeURIComponent(selected.videoId)+'&embed_domain='+encodeURIComponent(hostname);
      frame.title='YouTube chat for '+selected.title;
      frame.loading='lazy';frame.referrerPolicy='strict-origin-when-cross-origin';
      frame.allow='clipboard-write';host.append(frame);
    }
    host.hidden=!opening;
    button.textContent=opening?'Close YouTube live chat':'Open YouTube live chat';
    button.setAttribute('aria-expanded',String(opening));
    return;
  }
  if(button.matches('[data-stream-open-tunes]')){
   // Show the existing account-owned Tunes dialog; no new storage or fake login.
   const tunes=document.querySelector('#profileMusicOpen');
   if(tunes)tunes.click();
   else window.location.assign('/studio');
   return;
  }
  if(button.matches('[data-stream-radio-retry]')){retryCollegeRadio(Number(button.dataset.streamRadioRetry));return;}
  if(button.matches('[data-stream-retry]')){if(state.selected)showSource(state.selected,{silent:true});return;}
  if(button.matches('[data-discovery-prev]')){browseDiscovery(-1);return;}
  if(button.matches('[data-discovery-next]')){browseDiscovery(1);return;}
  if(button.matches('[data-discovery-play]')){playDiscovery(Number(button.dataset.discoveryPlay));return;}
  if(button.matches('[data-radio-play]')){saveLastPlayed(state.selected);const audio=mediaPortal?.querySelector('#streamRadioAudio');if(!audio)return;if(audio.paused)playRadio(audio,button);else{audio.pause();button.textContent='▶ Play';const status=mediaPortal.querySelector('#streamRadioStatus');if(status)status.textContent='Paused';}return;}
  if(button.matches('[data-stream-episode]')){state.followGuide=false;saveLastPlayed(state.selected);changeArchiveEpisode(Number(button.dataset.streamEpisode));return;}
  if(button.matches('[data-follow-radio]')){state.category='podcast';state.radioSection='music';tuneCurrent();const audio=mediaPortal?.querySelector('#streamRadioAudio');if(audio)playRadio(audio,mediaPortal.querySelector('[data-radio-play]'));state.followGuide=true;return;}
  if(button.matches('[data-tv-section]')){state.tvSection=button.dataset.tvSection;state.selected=null;renderGrid();renderCategory();tuneCurrent();return;}
  if(button.matches('[data-radio-section]')){state.category='podcast';state.radioSection=button.dataset.radioSection;state.selected=null;paintCategories();renderGrid();renderCategory();tuneCurrent();return;}
  if(button.matches('[data-stream-tab]')){
   const changing=state.category!==button.dataset.streamTab;
   state.category=button.dataset.streamTab;
   state.selected=null;
   paintCategories();renderGrid();renderCategory();
   if(changing||!state.selected)tuneCurrent();
   return;
  }
  if(button.matches('[data-stream-station]')){state.followGuide=false;selectStation(Number(button.dataset.streamStation));return}
  if(button.matches('[data-stream-feature]')){state.followGuide=false;selectFeature(button.dataset.streamFeature);return}
  if(button.matches('[data-stream-twitch]')){state.followGuide=false;selectTwitch(button.dataset.streamTwitch);return}
  if(button.matches('[data-stream-program]')){state.followGuide=false;selectProgram(button.dataset.streamProgram);return}
 }
 window.BigLWAStreamGuide={mount,searchWla:wlaGlobalSearch,openWlaSearchResult,async openFeature(id){await loadCatalog();const source=[...tvSources(),...featured,...youtubeLive].find(item=>item.id===id);if(!source||!root)return false;state.category=source.category;state.tvSection=source.section||'entertainment';if(state.category==='podcast')state.radioSection='podcast';paintCategories();renderGrid();renderCategory();state.followGuide=false;selectFeature(id);return true;},parkInStudio,dock:dockStream,undock:undockStream,showNoSignal,prefillRequest,get lastWatchedTitle(){return state.selected?.title||''},get stations(){return stations.map(s=>({name:s[0],school:s[1],state:s[2],url:s[3]}))},get featured(){return [...recentVideos(),...featured].map(f=>({...f}))},get ballroom(){return ballroomChannels.map(item=>({...item}))},get guideSlots(){return programmedCategories().map(([category])=>({category,slots:Array.from({length:24},(_,hour)=>guidePick(category,hour))}))},get twitch(){return twitchChannels.map(x=>({...x}))},get playlist(){return programmedCategories().map(([category])=>({category,slots:dailyPlaylist(category).map(x=>({...x}))}))},getDailyGuide(day,offset=0){return programmedCategories().map(([category])=>({category,slots:Array.from({length:24},(_,hour)=>guidePick(category,hour,day,offset))}))}};
})();

/* The approved illustration is reserved for the movable Dock.
   Do not re-skin, resize or replace the Studio preview. The real player
   is the same DOM instance across Dock, Studio and the full Stream page. */
(()=>{
 'use strict';
 const assets=['/assets/stream/stream-day.avif','/assets/stream/stream-night.avif'];
 function preload(src){return new Promise((resolve,reject)=>{
  const img=new Image();img.onload=()=>img.naturalWidth?resolve():reject(Error('Empty frame'));
  img.onerror=()=>reject(Error('Frame unavailable'));img.src=src;
 })}
 function start(){
  Promise.all(assets.map(preload)).then(()=>{
   window.__biglwaStreamFrameAssetsReady=true;
   document.getElementById('biglwaStreamDock')?.classList.add('stream-ornate-dock');
  }).catch(()=>{window.__biglwaStreamFrameAssetsReady=false});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
 else start();
})();
