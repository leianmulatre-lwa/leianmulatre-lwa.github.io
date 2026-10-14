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
 const audioStreams={
  1:'https://stream.kalx.berkeley.edu:8443/kalx-128.mp3',
  3:'https://kcsb.streamguys1.com/live',
  4:'https://kzscfms1-geckohost.radioca.st/kzschigh'
 };
 const categories=[['podcast','lwa radio','CH 01'],['lwa-tv','lwa tv','CH 02'],['live','live','CH 03']];
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
 const state={category:'podcast',day:localDay(),shuffleOffset:0,programs:[],myRequests:[],editorial:[],isEditor:false,requestPrefill:'',selected:null,followGuide:true};
 let discoveryCursor=Object.create(null);
 let root=null;
 let mediaPortal=null,mediaTarget=null,studioTarget=null;
 let guideTimer=null,lastGuideHour='';
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
  // Retire the former overlay without recreating the running iframe/audio.
  if(mediaPortal?.isConnected){
   mediaPortal.querySelector('#streamDiscoveryPicker')?.remove();
   return mediaPortal;
  }
  mediaPortal=document.createElement('div');
  mediaPortal.id='biglwaPersistentStreamPlayer';
  mediaPortal.className='biglwa-stream biglwa-persistent-stream-player';
  mediaPortal.style.cssText='position:fixed;z-index:420;overflow:hidden;pointer-events:auto;box-sizing:border-box;';
  mediaPortal.setAttribute('aria-label','Big LWA continuing Stream playback');
  mediaPortal.addEventListener('click',onClick);
  mediaPortal.addEventListener('play',()=>{
   if(state.selected)saveLastPlayed(state.selected);
  },true);
  document.body.appendChild(mediaPortal);
  return mediaPortal;
 }
 // Fixed projection preserves the SAME active iframe/audio element while navigating.
 // Avoid flickering "hidden" visibility as Studio cards animate or scroll away.
 let mediaResizeObserver=null;
 function repositionMediaPortal(){
  if(!mediaPortal?.isConnected)return;
  let rect=mediaTarget?.isConnected?mediaTarget.getBoundingClientRect():null;
  const valid=Boolean(rect&&rect.width>1&&rect.height>1);
  const x=valid?rect.left:-20000,y=valid?rect.top:0;
  mediaPortal.style.left='0px';
  mediaPortal.style.top='0px';
  mediaPortal.style.transform='translate3d('+x.toFixed(2)+'px,'+y.toFixed(2)+'px,0)';
  if(valid){
   mediaPortal.style.width=rect.width.toFixed(2)+'px';
   mediaPortal.style.height=rect.height.toFixed(2)+'px';
  }
  mediaPortal.style.visibility='visible';
  mediaPortal.style.pointerEvents=valid&&rect.bottom>0&&rect.top<window.innerHeight?'auto':'none';
 }
 function targetMedia(target){
  if(mediaResizeObserver){mediaResizeObserver.disconnect();mediaResizeObserver=null;}
  mediaTarget=target||null;
  if(!mediaTarget)return;
  ensureMediaPortal();
  if(typeof ResizeObserver!=='undefined'){
   mediaResizeObserver=new ResizeObserver(scheduleMediaPosition);
   mediaResizeObserver.observe(mediaTarget);
  }
  scheduleMediaPosition();
  // CSS transformations settle over several frames when the Studio opens/closes.
  let frames=0;
  const settle=()=>{if(frames++>=15||mediaTarget!==target)return;repositionMediaPortal();requestAnimationFrame(settle);};
  requestAnimationFrame(settle);
 }
 let positionFrame=0;
 function scheduleMediaPosition(){
  if(positionFrame)return;
  positionFrame=requestAnimationFrame(()=>{positionFrame=0;repositionMediaPortal()});
 }
 window.addEventListener?.('scroll',scheduleMediaPosition,true);
 window.addEventListener?.('resize',scheduleMediaPosition);
 window.visualViewport?.addEventListener?.('resize',scheduleMediaPosition);
 window.visualViewport?.addEventListener?.('scroll',scheduleMediaPosition);
 if(typeof document!=='undefined')document.addEventListener('biglwa:stream-updated',scheduleMediaPosition);
 function parkInStudio(){
  if(!mediaPortal?.isConnected||!mediaPortal.firstElementChild)return false;
  const screen=document.querySelector('#studioApp #stream .stream-screen');
  if(!screen)return false;
  studioTarget=screen;
  screen.classList.add('stream-preview-active');
  mediaPortal.classList.add('is-studio-preview');
  if(!mediaPortal.querySelector('[data-stream-return]')){
   const back=document.createElement('button');
   back.type='button';back.className='stream-preview-return';back.dataset.streamReturn='';
   back.textContent='↗ Open Stream';back.setAttribute('aria-label','Return to Stream with playback preserved');
   mediaPortal.appendChild(back);
  }
  const oldPhoto=screen.querySelector('.stream-station-photo');
  if(oldPhoto)oldPhoto.hidden=true;
  state.followGuide=false;
  targetMedia(screen);
  scheduleMediaPosition();
  document.dispatchEvent(new CustomEvent('biglwa:stream-updated',{detail:{title:state.selected?.title||'Stream'}}));
  return true;
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
  root=host;root.classList.add('biglwa-stream');
  state.day=localDay();
  root.innerHTML=[
   '<nav class="stream-nav" aria-label="Stream channel selector"><div class="stream-nav-meta"><span class="stream-eyebrow">BIG LWA / THREE-CHANNEL GUIDE</span><span id="streamGuideClock" class="stream-nav-clock"></span></div>',
   '<div class="stream-channels" role="tablist" aria-label="Stream category">',
   categories.map(c=>'<button class="stream-tab" role="tab" id="stream-tab-'+c[0]+'" data-stream-tab="'+c[0]+'" aria-controls="stream-category-content" aria-selected="false"><small>'+c[2]+'</small><b>'+c[1]+'</b></button>').join(''),
   '</div></nav>',
   '<section class="stream-spotlight" id="streamPlayerStage" aria-label="Channel player"><div class="stream-monitor" id="streamMonitor"><div class="stream-screen"><span class="stream-monitor-kicker">BIG LWA / TUNING IN</span><div class="stream-screen-center"><span>✳</span><strong>loading the current program</strong><small>today’s picks · original hosts</small></div><span class="stream-screen-bottom">BIG LWA · independent programming</span></div></div>',
   '<div class="stream-channel-copy" id="streamCategoryCopy"></div></section>',
   '<section class="stream-guide" aria-label="Daily Stream program guide"><div class="stream-guide-head">',
   '<div><span class="stream-eyebrow">EPG / electronic program guide</span><h2>today’s rotation</h2><p>Daily shuffled picks from real channels, campus radio and DJ mixtapes. These are discovery slots, not an assertion of live broadcasts at specific hours.</p></div>',
   '<div class="stream-date-actions"><label>Rotation date <input id="streamDate" type="date" aria-label="Rotation date" value="'+state.day+'"></label><button type="button" id="streamShuffleAgain" class="stream-shuffle-button">↻ shuffle again</button></div></div>',
   '<div class="stream-grid-scroll" tabindex="0" aria-label="Scroll through 24 daily discovery slots for the selected channel" id="streamGridScroll"><div class="stream-grid" id="streamGrid"></div></div>',
   '<div class="stream-guide-foot"><span><i class="stream-guide-key"></i> selected channel</span><span><i class="stream-guide-key scheduled"></i> future approved program</span><span><i class="stream-guide-key source"></i> daily curator picks</span><span><i class="stream-guide-key open"></i> Twitch channel · status unverified</span><button type="button" id="streamJumpNow">jump to this hour ↗</button></div></section>',
   '<section class="stream-body" id="stream-category-content" role="tabpanel" aria-labelledby="stream-tab-podcast">',
   '<div class="stream-section-detail" id="streamSectionDetail"></div></section>',
   '<section class="stream-future" aria-label="Future programming features"><span>COMING LATER · COMMUNITY PROGRAMMING</span><strong>creator time-slot requests</strong><p>Time-slot requests, premieres and scheduled submissions will arrive in a future Stream release. Explore the curated rotation for now.</p></section>',
   '<p class="stream-disclaimer">Station links lead to their respective operators; listing does not imply affiliation, permission to rebroadcast, or an official programming partnership. No affiliation or live-broadcast status is implied by the creator directory.</p>'
  ].join('');
  state.defaultMonitorMarkup=root.querySelector('#streamMonitor')?.innerHTML||'';
  const persistentPlayback=Boolean(mediaPortal?.firstElementChild&&state.selected);
  targetMedia(root.querySelector('#streamMonitor'));
  mediaPortal?.classList.remove('is-studio-preview');
  mediaPortal?.querySelector('[data-stream-return]')?.remove();
  if(studioTarget){
   studioTarget.classList.remove('stream-preview-active');
   const photo=studioTarget.querySelector('.stream-station-photo');
   if(photo)photo.hidden=false;
   studioTarget=null;
  }
  const date=root.querySelector('#streamDate');
  const now=new Date();
  date.min=localDay(new Date(now.getFullYear(),now.getMonth(),now.getDate()-7));
  date.max=localDay(new Date(now.getFullYear()+1,now.getMonth(),now.getDate()));
  date.addEventListener('change',()=>{state.day=date.value||localDay();state.shuffleOffset=0;renderGrid();renderFeaturedSlots();tuneCurrent()});
  root.addEventListener('click',onClick);
  root.querySelector('#streamShuffleAgain').onclick=()=>{state.shuffleOffset++;renderGrid();renderFeaturedSlots();tuneCurrent()};
  root.querySelector('#streamJumpNow').onclick=()=>{
   state.day=localDay();date.value=state.day;renderGrid();tuneCurrent();jumpNow();
  };
  state.followGuide=!persistentPlayback;
  paintCategories();renderGrid();renderFeaturedSlots();renderCategory();
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
   if(state.followGuide)tuneCurrent();
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
  root.querySelectorAll('[data-stream-tab]').forEach(button=>{
   const current=button.dataset.streamTab===state.category;
   button.classList.toggle('is-active',current);
   button.setAttribute('aria-selected',String(current));
   button.tabIndex=current?0:-1;
  });
  const panel=root.querySelector('#stream-category-content');
  panel.setAttribute('aria-labelledby','stream-tab-'+state.category);
  const select=root.querySelector('select[name="category"]');
  if(select&&!select.dataset.edited)select.value=state.category;
 }
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
 function dailyPlaylist(category,day=state.day,offset=state.shuffleOffset){
  if(category==='podcast'){
   // Only direct HTTPS audio streams are treated as LWA Radio channels.
   const radio=stations.flatMap((station,index)=>audioStreams[index]&&/^https:\/\//.test(audioStreams[index])
    ?[{kind:'station',index,title:station[0],subtitle:station[1],status:'▶ PLAY IN BIG LWA'}]:[]);
   return shuffled(radio,day,category,offset);
  }
  if(category==='lwa-tv'){
   // Channel directory URLs are NOT playable TV programs. Exclude them until an
   // actual video ID or directly playable archive file is available.
   const videos=[...featured.filter(item=>item.category==='lwa-tv'),...ballroomChannels]
    .filter(playableFeature).map(item=>({
     kind:'feature',id:item.id,title:item.title,subtitle:item.subtitle,
     status:item.provider==='archive-video'?'CARTOONS · WATCH':'▶ WATCH VIDEO'
    }));
   return shuffled(videos,day,category,offset);
  }
  if(category==='live'){
   const youtube=youtubeLive.filter(playableFeature).map(item=>({kind:'feature',id:item.id,title:item.title,subtitle:item.subtitle,status:'YOUTUBE · WATCH HERE'}));
   const twitch=twitchChannels.map(channel=>({kind:'twitch',id:channel.id,title:channel.title,subtitle:channel.subtitle,status:'TWITCH · LIVE UNVERIFIED'}));
   return shuffled([...youtube,...twitch],day,category,offset);
  }
  return [];
 }
 function guidePick(category,hour,day=state.day,offset=state.shuffleOffset){
  const queue=dailyPlaylist(category,day,offset);
  return queue.length?queue[hour%queue.length]:null;
 }
 function renderGrid(){
  if(!root)return;
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
    const context=show?'Approved broadcast':'Daily discovery pick, not scheduled airtime';
    return '<button type="button" class="'+classes+'" data-stream-slot="'+key+'"'+attrs+
     ' aria-label="'+escapeHTML(title+', '+context+', '+cat[1]+' guide at '+labelHour(hour))+'">'+text+'</button>';
   }).join('');
   return heading+squares;
  }).join('');
  const stamp=root.querySelector('#streamGuideClock');
  if(stamp)stamp.textContent='DAILY SHUFFLE · '+niceDate(state.day)+(state.shuffleOffset?' · MIX '+(state.shuffleOffset+1):'');
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
  const item=[...featured,...ballroomChannels,...youtubeLive].find(source=>source.id===pick.id);
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
    '<span class="stream-discovery-info"><b>'+escapeHTML(pick.title)+'</b><small>'+label+'</small></span></button>';
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
 function showSource(source,options={}){
  const monitor=root?.querySelector('#streamMonitor');if(!monitor||!source)return;
  const surface=ensureMediaPortal();
  const title=escapeHTML(source.title);
  const url=source.url||'';
  const label=source.source||'Original creator channel';
  state.selected={...source,isDiscovery:true};
  if(!options.silent)saveLastPlayed(source);
  const changed=Boolean(source.category&&source.category!==state.category);
  state.category=source.category||state.category;
  paintCategories();
  if(changed){renderGrid();renderFeaturedSlots();renderCategory();}
  const caption='<span>'+escapeHTML(label)+' / '+title+'</span>';
  const original=url?'<a href="'+escapeHTML(url)+'" target="_blank" rel="noopener noreferrer">Open original ↗</a>':'';
  const channelLink=source.channelUrl?'<a href="'+escapeHTML(source.channelUrl)+'" target="_blank" rel="noopener noreferrer">More videos ↗</a>':'';
  if(source.provider==='twitch'&&/^[a-z0-9_]{2,25}$/i.test(source.twitchChannel||'')){
   const parent=encodeURIComponent(window.location.hostname);
   const channel=encodeURIComponent(source.twitchChannel);
   // Twitch official embed requires the exact parent domain. No proxying or rehosting.
   const player='https://player.twitch.tv/?channel='+channel+'&parent='+parent+'&autoplay=false&muted=true';
   surface.innerHTML='<div class="stream-screen is-program is-twitch-player"><div class="stream-player-label">'+caption+original+'</div>'+
    '<iframe title="'+title+' on Twitch" src="'+escapeHTML(player)+'" allow="autoplay; fullscreen; encrypted-media" allowfullscreen loading="eager" referrerpolicy="strict-origin-when-cross-origin"></iframe>'+
    '<div class="stream-player-footer">TWITCH · stream availability is determined by the creator · '+original+'</div></div>';
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
  }else if(source.videoId&&/^[A-Za-z0-9_-]{11}$/.test(source.videoId)){
   surface.innerHTML='<div class="stream-screen is-program"><div class="stream-player-label">'+caption+original+channelLink+'</div>'+
    '<iframe title="'+title+'" src="https://www.youtube-nocookie.com/embed/'+source.videoId+'?rel=0&autoplay=1&playsinline=1" allow="autoplay; accelerometer; encrypted-media; picture-in-picture; fullscreen; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen loading="eager"></iframe></div>';
  }else{
   const type=source.provider==='archive'?'cultural archive':source.provider==='youtube'?'creator channel':source.provider==='mixtape'?'mixtape':source.provider==='podcast'?'podcast':source.type||'radio station';
   const cta=source.provider==='archive'?'Explore original archive ↗':source.provider==='youtube'?'Browse original videos ↗':source.provider==='mixtape'?'Play on original release ↗':source.provider==='podcast'?'Listen with publisher ↗':'Listen on station website ↗';
   surface.innerHTML='<div class="stream-screen is-external"><span class="stream-monitor-kicker">'+caption+'</span>'+
    '<div class="stream-screen-center"><span>'+(source.provider==='mixtape'?'♫':'◉')+'</span><strong>'+title+'</strong>'+
    '<small>'+escapeHTML(source.subtitle||source.creator||type)+'. Original '+escapeHTML(type)+' remains on its own website.</small>'+
    (url?'<a class="stream-monitor-open" href="'+escapeHTML(url)+'" target="_blank" rel="noopener noreferrer">'+cta+'</a>':'')+
    '</div><span class="stream-screen-bottom">ORIGINAL PUBLISHER · NO MIRRORED CONTENT</span></div>';
  }
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
  Promise.resolve(audio.play()).then(()=>{
   button.textContent='Ⅱ Pause';button.disabled=false;
   if(status)status.textContent='Playing live · original station stream';
  }).catch(error=>{
   button.textContent='▶ Play';button.disabled=false;
   if(status)status.textContent='Stream unavailable or blocked. Try Play again.';
   console.warn('Big LWA radio stream unavailable:',error?.name||'playback error');
  });
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
  const source=[...featured,...ballroomChannels,...youtubeLive].find(item=>item.id===id);
  if(!source||!source.url||!playableFeature(source))return;
  showSource(source,options);
 }
 function selectTwitch(id,options={}){
  const source=twitchChannels.find(item=>item.id===id);
  if(!source||!source.url)return;
  showSource(source,options);
 }
 function tuneCurrent(){
  if(!root)return;
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
 function renderCategory(){
  if(!root)return;
  const copy=root.querySelector('#streamCategoryCopy');
  const detail=root.querySelector('#streamSectionDetail');
  const cfg={
   podcast:['CH 01 / THE CAMPUS DIAL','lwa radio',
    'Play campus radio directly inside Big LWA. Only stations with a configured audio stream are radio ready.'],
   'lwa-tv':['CH 02 / THE PICTURE','lwa tv',
    'Real creator channels and video picks—from Olandria and Tea Spill to gaming, animation and interviews. New selections every day.'],
   live:['CH 03 / YOUTUBE + TWITCH','live',
    'Watch YouTube music, ASMR and frequency recordings alongside Twitch channels. Current live availability is not guaranteed.'],
  }[state.category];
  copy.innerHTML='<span class="stream-eyebrow">'+cfg[0]+'</span><h2>'+cfg[1]+'</h2><p>'+cfg[2]+'</p>'+
   '<div id="streamDiscoveryPicker" class="stream-discovery-picker" aria-label="Daily Discovery playable choices"></div>';
  if(state.category==='podcast'){
   detail.innerHTML='<div class="stream-section-head"><div><span class="stream-eyebrow">LWA RADIO / PLAYABLE STATIONS</span><h3>press play, stay here</h3><p>Only direct audio streams are shown as ready. Stations requiring an external website are excluded until in-site playback is available.</p></div><label>Find ready station <input id="streamStationSearch" type="search" placeholder="School or call letters" autocomplete="off"></label></div><div class="stream-stations" id="streamStations"></div><p class="stream-directory-note">Original station audio is streamed directly; listing does not imply an official affiliation.</p>';
   const filter=detail.querySelector('#streamStationSearch');
   filter.oninput=()=>renderStations(filter.value);
   renderStations('');
  }else if(state.category==='lwa-tv'){
   detail.innerHTML='<div class="stream-section-head"><div><span class="stream-eyebrow">LWA TV / READY TO WATCH</span><h3>pick a video, stay here</h3><p>Use the thumbnail and arrows above to browse playable clips and cartoons. Channel-page links without a playable video are not shown as TV programs. Ballroom / CCTV remains within LWA TV.</p></div></div><p class="stream-directory-note">Original publishers control their own embedding permissions; this does not imply a Big LWA partnership.</p>';
  }else{
   detail.innerHTML='<div class="stream-section-head"><div><span class="stream-eyebrow">LIVE / YOUTUBE + TWITCH</span><h3>relax, listen & watch</h3><p>Lofi Girl, rain ASMR, frequency-based music and Twitch broadcasts can play inside the monitor. Recorded videos are labeled as recordings; channels may be offline.</p></div></div><p class="stream-directory-note">Original players retain publisher attribution and their own embed restrictions.</p>';
  }
  renderFeaturedSlots();
 }
 function renderStations(query){
  const panel=root?.querySelector('#streamStations');if(!panel)return;
  const needle=String(query||'').toLowerCase().trim();
  const selected=stations.map((station,index)=>({station,index})).filter(({station,index})=>Boolean(audioStreams[index])&&station.join(' ').toLowerCase().includes(needle));
  panel.innerHTML=selected.map(({station,index})=>
   '<button type="button" class="stream-station" data-stream-station="'+index+'"><span class="stream-station-no">'+String(index+1).padStart(2,'0')+'</span><div><b>'+escapeHTML(station[0])+'</b><small>'+escapeHTML(station[1])+' · '+escapeHTML(station[2])+'</small></div><span class="stream-station-go">'+(audioStreams[index]?'▶ Play':'Stream pending')+'</span></button>').join('')||
   '<p class="stream-station-empty">No station in this starter directory matches that search. Suggest a school below.</p>';
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
  state.selected=item;if(!options.silent)saveLastPlayed({...item,isProgram:true});state.category=item.category;paintCategories();renderGrid();renderFeaturedSlots();renderCategory();
  const monitor=root.querySelector('#streamMonitor');
  ensureMediaPortal().innerHTML='<div class="stream-screen is-program"><div class="stream-player-label">'+
   '<span>'+escapeHTML(categories.find(c=>c[0]===item.category)?.[2]||'CH')+' / '+escapeHTML(item.title)+'</span>'+
   '<a href="'+escapeHTML(item.youtubeUrl)+'" target="_blank" rel="noopener noreferrer">YouTube ↗</a></div>'+
   '<iframe title="'+escapeHTML(item.title)+'" src="https://www.youtube-nocookie.com/embed/'+escapeHTML(item.videoId)+'?rel=0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen loading="lazy"></iframe>'+
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
  const button=event.target.closest('button');
  if(!button||!(root?.contains(button)||mediaPortal?.contains(button)))return;
  if(button.matches('[data-stream-return]')){window.openBIGLWAModule?.('stream');return;}
  if(button.matches('[data-discovery-prev]')){browseDiscovery(-1);return;}
  if(button.matches('[data-discovery-next]')){browseDiscovery(1);return;}
  if(button.matches('[data-discovery-play]')){playDiscovery(Number(button.dataset.discoveryPlay));return;}
  if(button.matches('[data-radio-play]')){state.followGuide=false;saveLastPlayed(state.selected);const audio=mediaPortal?.querySelector('#streamRadioAudio');if(!audio)return;if(audio.paused)playRadio(audio,button);else{audio.pause();button.textContent='▶ Play';const status=mediaPortal.querySelector('#streamRadioStatus');if(status)status.textContent='Paused';}return;}
  if(button.matches('[data-stream-episode]')){state.followGuide=false;saveLastPlayed(state.selected);changeArchiveEpisode(Number(button.dataset.streamEpisode));return;}
  if(button.matches('[data-stream-tab]')){
   const changing=state.category!==button.dataset.streamTab;
   state.category=button.dataset.streamTab;
   state.selected=null;
   paintCategories();renderGrid();renderFeaturedSlots();renderCategory();
   if(changing||!state.selected)tuneCurrent();
   return;
  }
  if(button.matches('[data-stream-station]')){state.followGuide=false;selectStation(Number(button.dataset.streamStation));return}
  if(button.matches('[data-stream-feature]')){state.followGuide=false;selectFeature(button.dataset.streamFeature);return}
  if(button.matches('[data-stream-twitch]')){state.followGuide=false;selectTwitch(button.dataset.streamTwitch);return}
  if(button.matches('[data-stream-program]')){state.followGuide=false;selectProgram(button.dataset.streamProgram);return}
 }
 window.BigLWAStreamGuide={mount,parkInStudio,prefillRequest,get lastWatchedTitle(){return state.selected?.title||''},get stations(){return stations.map(s=>({name:s[0],school:s[1],state:s[2],url:s[3]}))},get featured(){return featured.map(f=>({...f}))},get ballroom(){return ballroomChannels.map(item=>({...item}))},get guideSlots(){return categories.map(([category])=>({category,slots:Array.from({length:24},(_,hour)=>guidePick(category,hour))}))},get twitch(){return twitchChannels.map(x=>({...x}))},get playlist(){return categories.map(([category])=>({category,slots:dailyPlaylist(category).map(x=>({...x}))}))},getDailyGuide(day,offset=0){return categories.map(([category])=>({category,slots:Array.from({length:24},(_,hour)=>guidePick(category,hour,day,offset))}))}};
})();
