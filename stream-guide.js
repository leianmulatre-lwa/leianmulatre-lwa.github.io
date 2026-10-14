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
 const categories=[['podcast','lwa radio','CH 01'],['lwa-tv','lwa tv','CH 02'],['live','live','CH 03']];
 // Each destination is an actual publisher/creator channel or a specifically
 // identified release. We do NOT invent YouTube video IDs or live statuses.
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
  {id:'teaspill',category:'lwa-tv',title:'Tea Spill',creator:'Tea Spill',subtitle:'Beauty, creator news and pop-culture commentary · latest videos',url:'https://www.youtube.com/@TeaSpill/videos',source:'Official creator channel',provider:'youtube'},
  {id:'olandria',category:'lwa-tv',title:'Life With Olan',creator:'Olandria Carthen',subtitle:'Vlogs, travel, fashion and behind-the-scenes · latest videos',url:'https://www.youtube.com/@X_Olan/videos',source:'Creator-linked YouTube channel',provider:'youtube'},
  {id:'larray',category:'lwa-tv',title:'Larray',creator:'Larray',subtitle:'Comedy, creator culture and vlogs',url:'https://www.youtube.com/@LARRAY/videos',source:'Creator channel',provider:'youtube'},
  {id:'quenlin',category:'lwa-tv',title:'Quenlin Blackwell',creator:'Quenlin Blackwell',subtitle:"Feeding Starving Celebrities ft. Charli D'Amelio",videoId:'XC7XiNVk_M4',url:'https://www.youtube.com/watch?v=XC7XiNVk_M4',source:'Official YouTube episode',provider:'youtube'},
  {id:'jacksepticeye',category:'lwa-tv',title:'Jacksepticeye',creator:'Jacksepticeye',subtitle:'Gaming, horror and comedy',url:'https://www.youtube.com/@jacksepticeye/videos',source:'Creator channel',provider:'youtube'},
  {id:'dream',category:'lwa-tv',title:'Dream',creator:'Dream',subtitle:'Minecraft Speedrunner Swap VS 3 Hunters',videoId:'IqcS1d3eXYc',url:'https://www.youtube.com/watch?v=IqcS1d3eXYc',source:'Official YouTube episode',provider:'youtube'},
  {id:'cupquake',category:'lwa-tv',title:'iHasCupquake',creator:'iHasCupquake',subtitle:'Gaming, arts, DIY and adventures',url:'https://www.youtube.com/@ihascupquake/videos',source:'Creator channel',provider:'youtube'},
  {id:'alissa-violet',category:'lwa-tv',title:'Alissa Violet',creator:'Alissa Violet',subtitle:"I'm Back",videoId:'wdj19oCLpVw',url:'https://www.youtube.com/watch?v=wdj19oCLpVw',source:'Official YouTube video',provider:'youtube'},
  {id:'steyeuh',category:'lwa-tv',title:'Steyuh',creator:'Stei Campbell',subtitle:'Vlogs, humor and everyday adventures',url:'https://www.youtube.com/@steyeuh/videos',source:'Creator website-linked channel',provider:'youtube'}
 ];
 // These are destination channels, not assertions that the streamer is live.
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
 const state={category:'podcast',day:localDay(),shuffleOffset:0,programs:[],myRequests:[],editorial:[],isEditor:false,requestPrefill:'',selected:null};
 let root=null;
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
   '<section class="stream-top">',
   '<div class="stream-fine"><span><i class="stream-dot"></i> big lwa television network</span><span>original creators · daily rotation</span><span id="streamGuideClock"></span></div>',
   '<div class="stream-mast"><div><span class="stream-overline">THE PROGRAMMING GUIDE / VOL. 001</span><h1>stream<span class="stream-mast-spark">✳</span></h1><p>independent voices. endless channels. one collective.</p></div>',
   '<div class="stream-testcard" aria-hidden="true"><div class="stream-bars"><span></span><span></span><span></span><span></span><span></span><span></span></div><b>BIG LWA</b><small>CHANNEL SELECT / 03</small></div></div>',
   '<div class="stream-channels" role="tablist" aria-label="Stream category">',
   categories.map(c=>'<button class="stream-tab" role="tab" id="stream-tab-'+c[0]+'" data-stream-tab="'+c[0]+'" aria-controls="stream-category-content" aria-selected="false"><small>'+c[2]+'</small><b>'+c[1]+'</b></button>').join(''),
   '</div></section>',
   '<section class="stream-guide" aria-label="Daily Stream program guide"><div class="stream-guide-head">',
   '<div><span class="stream-eyebrow">EPG / electronic program guide</span><h2>today’s rotation</h2><p>Daily shuffled picks from real channels, campus radio and DJ mixtapes. These are discovery slots, not an assertion of live broadcasts at specific hours.</p></div>',
   '<div class="stream-date-actions"><label>Rotation date <input id="streamDate" type="date" aria-label="Rotation date" value="'+state.day+'"></label><button type="button" id="streamShuffleAgain" class="stream-shuffle-button">↻ shuffle again</button></div></div>',
   '<div class="stream-grid-scroll" tabindex="0" aria-label="Scroll through 24 daily discovery slots for each of three channels" id="streamGridScroll"><div class="stream-grid" id="streamGrid"></div></div>',
   '<div id="streamFeaturedSlots" class="stream-featured-band" aria-label="Station and creator directory slots"></div>',
   '<div class="stream-guide-foot"><span><i class="stream-guide-key"></i> selected channel</span><span><i class="stream-guide-key scheduled"></i> future approved program</span><span><i class="stream-guide-key source"></i> daily curator picks</span><span><i class="stream-guide-key open"></i> Twitch channel · status unverified</span><button type="button" id="streamJumpNow">jump to this hour ↗</button></div></section>',
   '<section class="stream-body" id="stream-category-content" role="tabpanel" aria-labelledby="stream-tab-podcast">',
   '<div class="stream-spotlight"><div class="stream-monitor" id="streamMonitor"><div class="stream-screen"><span class="stream-monitor-kicker">CHANNEL 00 / standby</span><div class="stream-screen-center"><span>✳</span><strong>choose a channel</strong><small>explore today’s shuffle · original hosts</small></div><span class="stream-screen-bottom">BIG LWA · independent programming</span></div></div>',
   '<div class="stream-channel-copy" id="streamCategoryCopy"></div></div>',
   '<div class="stream-section-detail" id="streamSectionDetail"></div></section>',
   '<section class="stream-future" aria-label="Future programming features"><span>COMING LATER · COMMUNITY PROGRAMMING</span><strong>creator time-slot requests</strong><p>Time-slot requests, premieres and scheduled submissions will arrive in a future Stream release. Explore the curated rotation for now.</p></section>',
   '<p class="stream-disclaimer">Station links lead to their respective operators; listing does not imply affiliation, permission to rebroadcast, or an official programming partnership. No affiliation or live-broadcast status is implied by the creator directory.</p>'
  ].join('');
  const date=root.querySelector('#streamDate');
  const now=new Date();
  date.min=localDay(new Date(now.getFullYear(),now.getMonth(),now.getDate()-7));
  date.max=localDay(new Date(now.getFullYear()+1,now.getMonth(),now.getDate()));
  date.addEventListener('change',()=>{state.day=date.value||localDay();state.shuffleOffset=0;renderGrid();renderFeaturedSlots()});
  root.addEventListener('click',onClick);
  root.querySelector('#streamShuffleAgain').onclick=()=>{state.shuffleOffset++;renderGrid();renderFeaturedSlots()};
  root.querySelector('#streamJumpNow').onclick=()=>{
   state.day=localDay();date.value=state.day;renderGrid();jumpNow();
  };
  paintCategories();renderGrid();renderFeaturedSlots();renderCategory();
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
 // Fill unused hourly squares with the actual station/video directory. Directory
 // picks are NOT scheduled broadcasts: only editor-approved entries are on-air.
 const liveIdeas=[
  'Creator premieres','Student DJ sets','Campus conversations','Community open mic',
  'Independent interviews','Live music sessions','Artist Q&A','Student news roundtable'
 ];
 function guidePick(category,hour){
  if(category==='podcast'){
   // Every station gets an actual square in the timeline, not just a tile below it.
   if(hour<stations.length){
    const station=stations[hour];
    return {kind:'station',index:hour,title:station[0],subtitle:station[1],status:'RADIO DIRECTORY'};
   }
   const podcasts=featured.filter(x=>x.category==='podcast');
   const choice=hour-stations.length;
   if(choice<podcasts.length){
    const entry=podcasts[choice];
    return {kind:'feature',id:entry.id,title:entry.title,subtitle:entry.subtitle,status:entry.url?'PODCAST PICK':'IDEA · LINK NEEDED'};
   }
   const stationIndex=(choice-podcasts.length)%stations.length;
   const station=stations[stationIndex];
   return {kind:'station',index:stationIndex,title:station[0],subtitle:station[1],status:'RADIO DIRECTORY'};
  }
  if(category==='lwa-tv'){
   const videos=featured.filter(x=>x.category==='lwa-tv');
   const entry=videos[hour%videos.length];
   return {kind:'feature',id:entry.id,title:entry.title,subtitle:entry.subtitle,
    status:entry.url?'VIDEO PICK':'IDEA · LINK NEEDED'};
  }
  const name=liveIdeas[hour%liveIdeas.length];
  return {kind:'concept',hour,title:name,subtitle:'Propose a live session',status:'LIVE IDEA · NOT ON AIR'};
 }
 function renderGrid(){
  if(!root)return;
  const items=state.programs;
  const first='<div class="stream-grid-corner">BIG LWA<br>24 HRS</div>';
  const hours=Array.from({length:24},(_,hour)=>'<div class="stream-hour" data-stream-hour="'+hour+'"><span>'+labelHour(hour)+'</span><small>'+String(hour).padStart(2,'0')+':00</small></div>').join('');
  const rows=categories.map(cat=>{
   const key=cat[0],chosen=key===state.category;
   const heading='<button type="button" class="stream-row-label'+(chosen?' is-current':'')+'" data-stream-tab="'+key+'"><small>'+cat[2]+'</small><b>'+cat[1]+'</b><span>'+(chosen?'TUNED IN':'TUNE IN')+'</span></button>';
   const squares=Array.from({length:24},(_,hour)=>{
    const show=items.find(item=>{
     if(item.category!==key||!item.scheduledAt)return false;
     const date=new Date(item.scheduledAt);
     return localDay(date)===state.day&&date.getHours()===hour;
    });
    const pick=show?null:guidePick(key,hour);
    const current=localDay()===state.day&&new Date().getHours()===hour;
    const classes='stream-slot '+(show?'is-booked':pick.kind==='concept'?'is-concept':'is-curated')+(chosen?' is-selected':'')+(current?' is-now':'');
    const title=show?show.title:pick.title;
    const details=show?(show.creditedCreator||'LWA programming'):pick.subtitle;
    const status=show?'APPROVED / PROGRAMMED':pick.status;
    const text='<span class="stream-slot-status">'+escapeHTML(status)+'</span>'+
      '<strong>'+escapeHTML(title)+'</strong><small>'+escapeHTML(details)+'</small>';
    const attrs=show?' data-stream-program="'+escapeHTML(show.id)+'"':
     pick.kind==='station'?' data-stream-station="'+pick.index+'"':
     pick.kind==='feature'?' data-stream-feature="'+escapeHTML(pick.id)+'"':
      ' data-stream-concept="'+hour+'"';
    const context=show?'Approved broadcast':'Directory suggestion, not confirmed airtime';
    return '<button type="button" class="'+classes+'" data-stream-slot="'+key+'"'+attrs+
     ' aria-label="'+escapeHTML(title+', '+context+', '+cat[1]+' guide at '+labelHour(hour))+'">'+text+'</button>';
   }).join('');
   return heading+squares;
  }).join('');
  const grid=root.querySelector('#streamGrid');
  grid.innerHTML=first+hours+rows;
  const count=items.filter(x=>localDay(new Date(x.scheduledAt))===state.day).length;
  grid.setAttribute('aria-label',niceDate(state.day)+' channel guide, '+count+' approved scheduled programs, plus curated sources and ideas');
 }
 // Every station gets its own independent selectable slot. These are not time bookings.
 function renderFeaturedSlots(){
  const panel=root?.querySelector('#streamFeaturedSlots');if(!panel)return;
  const current=state.category;
  const isRadio=current==='podcast';
  const picks=featured.filter(entry=>entry.category===current);
  const slots=isRadio?stations.map((station,index)=>
    '<button type="button" class="stream-source-slot is-radio" data-stream-station="'+index+'" aria-label="Tune '+escapeHTML(station[0])+' from '+escapeHTML(station[1])+'">'+
    '<small>RADIO · '+String(index+1).padStart(2,'0')+'</small><b>'+escapeHTML(station[0])+'</b><span>'+escapeHTML(station[1])+'</span></button>').join(''):'';
  const videoTiles=picks.map((entry,index)=>{
   const pending=!entry.url;
   // Unverified picks still open a channel card requesting a source; no fabricated URL.
   const attrs=' data-stream-feature="'+escapeHTML(entry.id)+'"';
   return '<button type="button" class="stream-source-slot is-creator'+(pending?' is-unverified':'')+'"'+attrs+'>'+
    '<small>'+escapeHTML(entry.source)+' / '+String(index+1).padStart(2,'0')+'</small>'+
    (entry.videoId?'<img loading="lazy" src="https://i.ytimg.com/vi/'+escapeHTML(entry.videoId)+'/mqdefault.jpg" alt="">':'')+
    '<b>'+escapeHTML(entry.title)+'</b><span>'+escapeHTML(entry.subtitle||entry.creator)+'</span></button>';
  }).join('');
  if(current==='live'){
    panel.innerHTML='<div class="stream-band-heading"><b>live channel selector</b><small>No public live broadcasts confirmed yet. Visit the hourly guide or propose an event.</small></div>';
    return;
  }
  panel.innerHTML='<div class="stream-band-heading"><div><small>BIG LWA / '+(isRadio?'CAMPUS DIAL':'VIDEO GUIDE')+'</small><b>'+(isRadio?'every station, its own slot':'creator channels + selected videos')+'</b></div>'+
   '<span>DIRECT LINKS · NO SIMULATED AIRTIME</span></div>'+
   (slots?'<div class="stream-source-slots" aria-label="Sixteen individual campus radio station slots">'+slots+'</div>':'')+
   (videoTiles?'<div class="stream-band-subtitle">'+(isRadio?'podcast video + publisher picks':'watch from the original YouTube creator')+'</div><div class="stream-source-slots is-video" aria-label="Curated independent creator slots">'+videoTiles+'</div>':'')+
   '<p class="stream-band-note">These tiles are hand-picked links, not scheduled airtime, live simulcasts, or formal partnerships. Playback depends on the original provider allowing embeds.</p>';
 }
 function showSource(source) {
  const monitor=root?.querySelector('#streamMonitor');if(!monitor||!source)return;
  const title=escapeHTML(source.title),url=source.url;
  const label=source.source||'Original provider';
  state.selected={...source,isDiscovery:true};
  const changed=Boolean(source.category&&source.category!==state.category);
  state.category=source.category||state.category;
  paintCategories();
  if(changed){renderGrid();renderFeaturedSlots();renderCategory();}
  const caption='<span>'+escapeHTML(label)+' / '+title+'</span>';
  const original=url?'<a href="'+escapeHTML(url)+'" target="_blank" rel="noopener noreferrer">Open original ↗</a>':'';
  if(source.videoId&&/^[A-Za-z0-9_-]{11}$/.test(source.videoId)){
    monitor.innerHTML='<div class="stream-screen is-program"><div class="stream-player-label">'+caption+original+'</div>'+
      '<iframe title="'+title+'" src="https://www.youtube-nocookie.com/embed/'+source.videoId+'?rel=0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen loading="lazy"></iframe></div>';
  } else {
    monitor.innerHTML='<div class="stream-screen is-external"><span class="stream-monitor-kicker">'+caption+'</span>'+
      '<div class="stream-screen-center"><span>◉</span><strong>'+title+'</strong>'+
      '<small>Independent '+escapeHTML(source.type||'source')+'. '+escapeHTML(source.subtitle||'Listen or watch at the official host.')+'</small>'+
      (url?'<a class="stream-monitor-open" href="'+escapeHTML(url)+'" target="_blank" rel="noopener noreferrer">Tune in at original website ↗</a>':'<button type="button" class="stream-monitor-open" data-stream-scroll-request>Suggest a video link ↗</button>')+
      '</div><span class="stream-screen-bottom">UNOFFICIAL DIRECTORY · NO REBROADCAST</span></div>';
  }
  monitor.scrollIntoView({behavior:'smooth',block:'center'});
 }
 function selectStation(index){
  const station=stations[index];if(!station)return;
  state.category='podcast';paintCategories();renderCategory();renderFeaturedSlots();renderGrid();
  showSource({title:station[0],category:'podcast',creator:station[1],subtitle:station[1]+' · '+station[2],source:'Campus radio station',url:station[3],type:'radio station'});
 }
 function selectFeature(id){
  const source=featured.find(item=>item.id===id);
  if(!source)return;
  showSource(source);
 }
 function renderCategory(){
  if(!root)return;
  const copy=root.querySelector('#streamCategoryCopy');
  const detail=root.querySelector('#streamSectionDetail');
  const cfg={
   podcast:['CH 01 / THE CAMPUS DIAL','podcast + radio',
    'College voices, student-run stations, recorded conversations, campus news and underground sounds. Explore independent stations on their own sites.'],
   'lwa-tv':['CH 02 / THE PICTURE','lwa tv',
    'Creator documentaries, commentary, music visuals, culture, style and stories that deserve a bigger screen. Videos enter the guide only after review.'],
   live:['CH 03 / THE LIVE WIRE','live',
    'Premieres, live sessions, town halls, creative sets and community broadcasts. Live listings are confirmed only once approved and scheduled.']
  }[state.category];
  copy.innerHTML='<span class="stream-eyebrow">'+cfg[0]+'</span><h2>'+cfg[1]+'</h2><p>'+cfg[2]+'</p><div class="stream-channel-actions"><button type="button" data-stream-scroll-request>request programming ↗</button></div>';
  if(state.category==='podcast'){
   detail.innerHTML='<div class="stream-section-head"><div><span class="stream-eyebrow">THE COLLEGE DIAL / UNIVERSITY RADIO DIRECTORY</span><h3>campus frequencies</h3><p>Browse official student and university stations. Their own websites handle listening, real playlists and current broadcast hours.</p></div><label>Find your school <input id="streamStationSearch" type="search" placeholder="School, call letters or state" autocomplete="off"></label></div><div class="stream-stations" id="streamStations"></div><p class="stream-directory-note">This is a growing starter directory, not a claim to cover every state school. <a href="mailto:leian@biglwa.com?subject=Suggest%20a%20campus%20radio%20station">Suggest a missing station ↗</a></p>';
   const filter=detail.querySelector('#streamStationSearch');
   filter.oninput=()=>renderStations(filter.value);
   renderStations('');
  }else if(state.category==='lwa-tv'){
   detail.innerHTML='<div class="stream-section-head"><div><span class="stream-eyebrow">CHANNEL 02 / COMMUNITY SCREENINGS</span><h3>make room for more voices.</h3><p>Artist profiles, social analysis, interviews, video essays and visual mixtapes belong here.</p></div></div><div class="stream-ideas"><article><span>01 / CULTURE</span><b>creator commentary</b><p>Pop-culture analysis and conversations—think TeaSpill-style breakdowns.</p></article><article><span>02 / PERSONALITIES</span><b>people to watch</b><p>Interviews, evolving stories and public figures, including Olandria-inspired coverage.</p></article><article><span>03 / VISUALS</span><b>short films + mixtapes</b><p>Filmmakers, visual artists and independent music creators.</p></article></div><p class="stream-directory-note">Examples are editorial inspiration, not announcements of partnerships with those creators.</p>';
  }else{
   detail.innerHTML='<div class="stream-section-head"><div><span class="stream-eyebrow">CHANNEL 03 / REAL-TIME SIGNAL</span><h3>the live wire</h3><p>Live premieres, community conversations and events can be proposed for the schedule. No audience or on-air figures are simulated.</p></div></div><div class="stream-live-wait"><span class="stream-live-lamp" aria-hidden="true"></span><div><strong>awaiting the next live program</strong><p>No event is presented as live until its broadcast has been verified and scheduled.</p></div><button type="button" data-stream-scroll-request>propose a live session ↗</button></div>';
  }
 }
 function renderStations(query){
  const panel=root?.querySelector('#streamStations');if(!panel)return;
  const needle=String(query||'').toLowerCase().trim();
  const selected=stations.filter(s=>s.join(' ').toLowerCase().includes(needle));
  panel.innerHTML=selected.map((station,index)=>
   '<a class="stream-station" target="_blank" rel="noopener noreferrer" href="'+escapeHTML(station[3])+'"><span class="stream-station-no">'+String(index+1).padStart(2,'0')+'</span><div><b>'+escapeHTML(station[0])+'</b><small>'+escapeHTML(station[1])+' · '+escapeHTML(station[2])+'</small></div><span class="stream-station-go">listen ↗</span></a>').join('')||
   '<p class="stream-station-empty">No station in this starter directory matches that search. Suggest a school below.</p>';
 }
 async function refreshPublic(){
  try{
   const result=await workerFetch('programming');
   if(!root)return;
   state.programs=Array.isArray(result.items)?result.items.filter(item=>item&&item.videoId&&item.scheduledAt):[];
   renderGrid();
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
 function selectProgram(id){
  const item=state.programs.find(p=>p.id===id);
  if(!item)return;
  state.selected=item;state.category=item.category;paintCategories();renderGrid();renderFeaturedSlots();renderCategory();
  const monitor=root.querySelector('#streamMonitor');
  monitor.innerHTML='<div class="stream-screen is-program"><div class="stream-player-label">'+
   '<span>'+escapeHTML(categories.find(c=>c[0]===item.category)?.[2]||'CH')+' / '+escapeHTML(item.title)+'</span>'+
   '<a href="'+escapeHTML(item.youtubeUrl)+'" target="_blank" rel="noopener noreferrer">YouTube ↗</a></div>'+
   '<iframe title="'+escapeHTML(item.title)+'" src="https://www.youtube-nocookie.com/embed/'+escapeHTML(item.videoId)+'?rel=0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen loading="lazy"></iframe>'+
   '</div>';
  monitor.scrollIntoView({behavior:'smooth',block:'center'});
 }
 function prefillRequest(url){
  const form=root?.querySelector('#streamRequestForm');
  state.requestPrefill=String(url||'');
  if(!form)return;
  form.elements.youtubeUrl.value=state.requestPrefill;
  form.elements.category.value=state.category;
  form.scrollIntoView({behavior:'smooth',block:'center'});
 }
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
  if(!button||!root.contains(button))return;
  if(button.matches('[data-stream-tab]')){
   state.category=button.dataset.streamTab;state.selected=null;paintCategories();renderGrid();renderFeaturedSlots();renderCategory();return;
  }
  if(button.matches('[data-stream-station]')){selectStation(Number(button.dataset.streamStation));return}
  if(button.matches('[data-stream-feature]')){selectFeature(button.dataset.streamFeature);return}
  if(button.matches('[data-stream-concept]')){
   const hour=Number(button.dataset.streamConcept);
   state.category='live';paintCategories();renderGrid();renderFeaturedSlots();renderCategory();
   const form=root.querySelector('#streamRequestForm');
   form.elements.category.value='live';
   if(!form.elements.timePreference.value)form.elements.timePreference.value=niceDate(state.day)+' · '+labelHour(hour);
   form.scrollIntoView({behavior:'smooth',block:'center'});
   return;
  }
  if(button.matches('[data-stream-program]')){selectProgram(button.dataset.streamProgram);return}
  if(button.matches('[data-stream-propose]')){
   state.category=button.dataset.streamPropose;paintCategories();renderGrid();renderFeaturedSlots();renderCategory();
   root.querySelector('#streamRequestForm').elements.category.value=state.category;
   root.querySelector('#streamRequest').scrollIntoView({behavior:'smooth',block:'center'});return;
  }
  if(button.matches('[data-stream-scroll-request]')){
   root.querySelector('#streamRequestForm').elements.category.value=state.category;
   root.querySelector('#streamRequest').scrollIntoView({behavior:'smooth',block:'center'});return;
  }
  if(button.matches('[data-stream-approve]'))review(button.dataset.streamApprove,button.dataset.streamOwner,'approved');
  if(button.matches('[data-stream-decline]'))review(button.dataset.streamDecline,button.dataset.streamOwner,'declined');
 }
 window.BigLWAStreamGuide={mount,prefillRequest,get stations(){return stations.map(s=>({name:s[0],school:s[1],state:s[2],url:s[3]}))},get featured(){return featured.map(f=>({...f}))},get guideSlots(){return categories.map(([category])=>({category,slots:Array.from({length:24},(_,hour)=>guidePick(category,hour))}))}};
})();
