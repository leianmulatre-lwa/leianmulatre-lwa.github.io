import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=path=>readFileSync(new URL('./'+path,import.meta.url),'utf8');
const studio=read('module-pages.js'),boothCss=read('booth-room-20261114.css');
const hair=read('lwazi-hair-visuals-20261114.js'),hairCss=read('lwazi-hair-visuals-20261114.css');
const search=read('user-search-results.js'),map=read('map-app.html');
const rooms=read('room-discovery-signals-20261114.js'),stream=read('stream-guide.js');
const streamCss=read('stream-guide.css');
const shells=['index.html','studio/index.html','404.html','live-studio-shell.html'];

test('Booth presents only one circle and uses exterior LEDs with dynamic, effective slider',()=>{
 const start=studio.indexOf('function renderCamera(){'),end=studio.indexOf('function renderVideoBooth(){',start);
 const source=studio.slice(start,end>start?end:start+17000);
 assert(source.includes('id="boothProfilePhoto"')||source.includes('boothProfilePhoto'));
 assert.match(boothCss,/#boothProfileFallback\[hidden\]/,'Initial must be hidden whenever a portrait exists');
 assert.match(boothCss,/#boothProfilePhoto\[hidden\]/);
 assert.match(boothCss,/#boothVanity .light-bar.left/);
 assert.match(boothCss,/#boothVanity .light-bar.right/);
 assert.match(boothCss,/\.light-bar.top,[\s\S]*?\.light-bar.bottom\{\s*display:none!important/,'No lights on top of the video display');
 assert.match(boothCss,/aspect-ratio:16\/10!important/,'Camera mirror is much wider');
 assert.match(boothCss,/min-height:clamp\(330px,42vw,635px\)/,'Camera mirror is substantially larger');
 assert.match(boothCss,/--vanity-spill/);
 assert.match(boothCss,/--vanity-exposure/);
 assert.match(studio,/vanity\.style\.setProperty\('--vanity-spill'/);
 assert.match(studio,/level\.addEventListener\('input',refreshLights\)/);
 assert.match(studio,/level\.addEventListener\('change',refreshLights\)/);
 assert.match(boothCss,/data-lights="off"/);
 assert.doesNotMatch(boothCss,/display:block!important;[^}]*#boothProfileFallback/);
});
test('L’wazi hair visual library renders original SVG comparisons only when visual questions matter',()=>{
 const win={},context={window:win,Date};
 vm.runInNewContext(hair,context,{timeout:1000});
 const api=win.BigLWAHairVisuals;
 for(const q of ['what does 4c hair look like','is my hair 3c or 4a?','show me curl texture','compare density of curly hair']){
  assert.equal(api.isVisualPrompt(q),true,q);
 }
 for(const q of ['how often moisturize low porosity hair','my hair is shedding','hello']){
  assert.equal(api.isVisualPrompt(q),false,q);
 }
 const result=api.markup('compare hair type 4c');
 assert.equal((result.match(/class="lwazi-hair-type"/g)||[]).length,12,'1A through 4C visual grid');
 assert.match(result,/role="img"/);
 assert.match(result,/Fine · Medium · Coarse/);
 assert.match(result,/Low · Medium · High/);
 assert.match(result,/not a medical assessment/);
 assert.match(search,/section\('Hair visual models'/);
 assert.match(hairCss,/\.lwazi-hair-types/);
});
test('OpenFreeMap preview keeps pan/zoom and now has real same-window private pins',()=>{
 assert.match(map,/https:\/\/tiles\.openfreemap\.org\/styles\//);
 for(const id of ['studioMapPreviewTools','miniMapExplore','miniMapDrop','miniMapSaved','miniMapLayers','miniMapPinForm'])
  assert(map.includes('id="'+id+'"'),id);
 assert.match(map,/map\.getCenter\(\);stage\(center\.lat,center\.lng\)/);
 assert.match(map,/\$\('pinPublic'\)\.checked=false/,'Preview can only save private pins');
 assert.match(map,/\$\('pinForm'\)\.requestSubmit\(\)/,'Use existing validated pin-save flow');
 assert.match(map,/map-preview-pins-updated/);
 assert.match(studio,/map-app\.html\?embed=1&v=20261114-inline-pinning-1/);
 assert.match(map,/body\.preview #studioMapPreviewTools/);
 assert.match(map,/body\.embedded\.preview #map\{/,'Embedded Studio thumbnails must override full-page map sizing');
 assert.match(map,/body\.embedded\.preview \.map-stage\{/,'Preview map stage must fill the iframe');
 assert.match(map,/body\.embedded\.preview \.map-side>\.toolbar,[\s\S]*?display:none!important/,'Full-map toolbar must not cover mini-map controls');
 assert.match(map,/body\.embedded\.preview #studioMapPreviewTools\{/,'Mini-map tools must remain available');
});
test('Room and Lounge replace invented trending and online counts with sourced search routes',async()=>{
 assert.doesNotMatch(studio,/'minecraft','#minecraft','Trending room'/);
 assert.doesNotMatch(studio,/Trending rooms<\/h2>/);
 assert.doesNotMatch(read('live-studio-payload.html'),/1\.4K online/);
 assert.match(studio,/data-room-mode="room"/);
 assert.match(studio,/data-room-mode="lounge"/);
 assert.match(studio,/room-pixel-scene/);
 assert.doesNotMatch(studio,/id="roomRolePanel"/,'Roles editor moved off Room/Lounge');
 assert.match(studio,/BigLWACommunityProfile\?\.isReady/);
 assert.match(studio,/data-open-community-profile/);
 assert.match(studio,/biglwaRoomMessagesV2:/,'Account-isolated local room drafts');
 assert.match(boothCss,/room-dark-20261110\.webp/,'Reuse owner-approved Room artwork');
 assert.match(studio,/not verified global trending rankings/);
 const roomStart=studio.indexOf('function renderRoom(){');
 const roomEnd=studio.indexOf('function downloadBlob(',roomStart);
 const renderRoom=studio.slice(roomStart,roomEnd);
 const pixelSection=renderRoom.slice(renderRoom.indexOf('const roomView='),renderRoom.indexOf('const loungeView='));
 const loungeSection=renderRoom.slice(renderRoom.indexOf('const loungeView='),renderRoom.indexOf('const roomHeading='));
 assert.doesNotMatch(pixelSection,/roomTrendSources|roomTrendStatus/,'Room no longer renders trending searches');
 assert.match(loungeSection,/room-trend-grid" id="roomTrendSources"/,'Lounge owns source-linked searches');
 assert.match(loungeSection,/Trending searches &amp; topics/);
 assert.match(renderRoom,/if\(mode==='room'\)return;/,'The Room tab must not resolve trending feeds');
 assert.match(renderRoom,/if\(!profileReady\|\|\(mode==='lounge'&&!loungeReady\)\)return;/,
  'Blocked Lounge cannot bind unavailable inputs or fetch source data');
 const today=new Date(),month=today.getMonth()+1,day=today.getDate();
 const un={data:{items:[{month,day,title:'International Test Day',url:'https://www.un.org/en/observances/test-day'}]},
  dateOf(item,year){return new Date(year,item.month-1,item.day)},
  load(){return Promise.resolve(this.data)}
 };
 const win={BigLWAObservances:un,__biglwaIdentity:null,__biglwaPublicStorageView:false};
 vm.runInNewContext(rooms,{window:win,document:{documentElement:{classList:{contains:()=>false}}},Date,Intl,encodeURIComponent},{timeout:1000});
 const items=await win.BigLWARoomSignals.load();
 assert(items.some(item=>item.kind==='United Nations'&&item.links.x.includes('x.com/search')&&item.links.instagram.includes('instagram.com')));
 assert(items.every(item=>!/trending room|global trend/i.test(item.detail)||item.detail.includes('not a global trend')||item.detail.includes('not social-platform')));
});
test('Room/Lounge tabs share the title row rather than making a second toolbar',()=>{
 const begin=studio.indexOf('function renderRoom(){');
 const end=studio.indexOf('function render',begin+20);
 const room=studio.slice(begin,end>begin?end:begin+12000);
 assert.match(room,/const roomHeading=heading\('rooms'\)\.replace/);
 assert.match(room,/room-heading-tabs/);
 assert.match(room,/body\.innerHTML=roomHeading\+\(profileReady&&\(mode==='room'\|\|loungeReady\)/);
 assert.doesNotMatch(room,/body\.innerHTML=heading\('rooms'\)\+tabs/);
 assert.match(boothCss,/grid-template-areas:"room-title room-tabs" "room-meta room-meta"!important/);
 assert.match(boothCss,/grid-area:room-tabs/);
 assert.match(boothCss,/max-width:690px/);
 for(const path of shells){
  const html=read(path);
  assert.match(html,/booth-room-20261114\.css\?v=20261114-room-header-right-1/);
  assert.match(html,/&header=20261114-room-politic-1/);
 }
});

test('Four submitted LWA TV streams are explicitly opt-in to publisher-hosted YouTube live chat',()=>{
 for(const id of ['Q0zx1vpTghg','_RdBYV6TLV0','eE1L08hNdW8','DuUUTvBihaU'])
  assert(stream.includes("videoId:'"+id+"'"),id);
 assert.equal((stream.match(/chatEligible:true/g)||[]).length,4);
 assert.match(stream,/data-stream-chat-toggle/);
 assert.match(stream,/https:\/\/www\.youtube\.com\/live_chat\?v=/);
 assert.match(stream,/embed_domain=/);
 assert.match(stream,/YouTube manages accounts and moderation/);
 assert.match(stream,/Live chat only when the original uploader enables it/);
 assert.match(streamCss,/\.stream-chat-host/);
 assert.match(streamCss,/stream-chat-controls/);
});
test('Four Studio bootstraps load new assets once and bust stale cache versions',()=>{
 for(const path of shells){
  const html=read(path);
  for(const file of ['lwazi-hair-visuals-20261114.js','room-discovery-signals-20261114.js','booth-room-20261114.css']){
   assert.equal(html.split(file).length-1,1,path+' '+file);
  }
  assert(html.indexOf('lwazi-hair-visuals-20261114.js?v=')<html.indexOf('user-search-results.js?v='),path);
  assert(html.indexOf('room-discovery-signals-20261114.js?v=')<html.indexOf('module-pages.js?v='),path);
  assert.match(html,/stream-guide\.js\?v=[^"<>]*upgrade=20261114-roomboothmap-tv-hair1/);
  assert.match(html,/module-pages\.js\?v=[^"<>]*upgrade=20261114-roomboothmap-tv-hair1/);
 }
});
