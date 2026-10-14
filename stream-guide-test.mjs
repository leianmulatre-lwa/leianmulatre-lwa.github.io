import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';

const worker=readFileSync(new URL('./cloudflare-worker-instagram.js',import.meta.url),'utf8');
const stream=readFileSync(new URL('./stream-guide.js',import.meta.url),'utf8');
const style=readFileSync(new URL('./stream-guide.css',import.meta.url),'utf8');
const pages=readFileSync(new URL('./module-pages.js',import.meta.url),'utf8');
const index=readFileSync(new URL('./index.html',import.meta.url),'utf8');
const bucketRecords=new Map();
const fakeR2={
 async put(key,text){bucketRecords.set(key,String(text))},
 async get(key){if(!bucketRecords.has(key))return null;return {json:async()=>JSON.parse(bucketRecords.get(key))}},
 async delete(key){bucketRecords.delete(key)},
 async list({prefix,limit}){return {objects:[...bucketRecords.keys()].filter(k=>k.startsWith(prefix)).slice(0,limit||1000).map(key=>({key}))}}
};
const uidFromToken={'owner-token':'creator-one','other-token':'creator-two','editor-token':'editor-three'};
const requests=[];
const mockFetch=async (resource,options={})=>{
 const req=resource instanceof Request?resource:new Request(resource,options);
 const url=new URL(req.url);
 if(url.hostname==='identitytoolkit.googleapis.com'){
  const input=await req.json(),uid=uidFromToken[input.idToken];
  return new Response(JSON.stringify({users:uid?[{localId:uid,emailVerified:true}]:[]}),{status:uid?200:400});
 }
 if(url.hostname==='firestore.googleapis.com'){
  const editor=url.pathname.endsWith('/editor-three')&&(req.headers.get('Authorization')==='Bearer editor-token');
  return new Response(JSON.stringify(editor?{fields:{active:{booleanValue:true}}}:{}),{status:editor?200:404});
 }
 throw Error('Unexpected outbound request '+url.href);
};
const ctx={URL,URLSearchParams,Request,Response,Headers,TextEncoder,TextDecoder,crypto:webcrypto,fetch:mockFetch,console,
 btoa:s=>Buffer.from(s,'binary').toString('base64'),atob:s=>Buffer.from(s,'base64').toString('binary')};
vm.runInNewContext(worker.replace('export default {','const fakeWorker = {')+
 '\nglobalThis.streamTest={fetch:fakeWorker.fetch.bind(fakeWorker),videoId:streamVideoId};',ctx);
const {fetch:handler,videoId}=ctx.streamTest;
const env={SITE_URL:'https://biglwa.com',PINTEREST_APP_ID:'test',PINTEREST_APP_SECRET:'test',
 WALLPAPER_BUCKET:fakeR2,OAUTH_SESSIONS:{get:async()=>null,put:async()=>{},delete:async()=>{}}};
const call=(path,{token='',method='GET',body=null,origin='https://biglwa.com'}={})=>{
 const req=new Request('https://worker.test'+path,{
  method,headers:{Origin:origin,...(token?{Authorization:'Bearer '+token}:{}),...(body?{'Content-Type':'application/json'}:{})},
  ...(body?{body:JSON.stringify(body)}:{})
 });
 return handler(req,env);
};
let passed=0;
const check=async (name,fn)=>{await fn();passed++;console.log('PASS '+name)};
const videoUrl='https://www.youtube.com/watch?v=dQw4w9WgXcQ';
await check('source URLs accept real YouTube videos, refuse channel playlists and spoofing',async()=>{
 assert.equal(videoId(videoUrl),'dQw4w9WgXcQ');
 assert.equal(videoId('https://youtu.be/dQw4w9WgXcQ'),'dQw4w9WgXcQ');
 assert.equal(videoId('https://www.youtube.com/shorts/dQw4w9WgXcQ'),'dQw4w9WgXcQ');
 assert.equal(videoId('https://evil.example/youtube.com/watch?v=dQw4w9WgXcQ'),'');
 assert.equal(videoId('http://www.youtube.com/watch?v=dQw4w9WgXcQ'),'');
 assert.equal(videoId('https://www.youtube.com/@channel'),'');
});
await check('schedule remains empty until approval',async()=>{
 const response=await call('/stream/programming');
 assert.equal(response.status,200);
 assert.equal((await response.json()).items.length,0);
});
await check('anonymous visitor cannot submit or read private submissions',async()=>{
 assert.equal((await call('/stream/requests',{method:'POST',body:{title:'A new show',youtubeUrl:videoUrl,category:'lwa-tv',rights:'my-video'}})).status,401);
 assert.equal((await call('/stream/requests')).status,401);
});
await check('wrong-origin submission is refused',async()=>{
 assert.equal((await call('/stream/requests',{origin:'https://evil.example',token:'owner-token'})).status,403);
});
await check('verified creator requests LWA TV programming',async()=>{
 const res=await call('/stream/requests',{method:'POST',token:'owner-token',body:{
  title:'Cultural conversation from UCLA',youtubeUrl:videoUrl,creditedCreator:'A creator',
  category:'lwa-tv',rights:'my-video',note:'On campus life',timePreference:'Friday evening'
 }});
 assert.equal(res.status,201);
 const result=await res.json();assert.equal(result.status,'pending');assert.ok(result.id);
 requests.push(result);
});
await check('other account cannot read creator requests',async()=>{
 const owner=await call('/stream/requests',{token:'owner-token'}),other=await call('/stream/requests',{token:'other-token'});
 assert.equal((await owner.json()).items.length,1);
 assert.equal((await other.json()).items.length,0);
});
await check('invalid and unknown external video links are rejected',async()=>{
 const x=await call('/stream/requests',{method:'POST',token:'owner-token',body:{title:'Fake',youtubeUrl:'https://www.tiktok.com/@somebody/video/4',category:'podcast',rights:'nomination'}});
 assert.equal(x.status,400);
});
await check('regular creator cannot read editorial moderation queue',async()=>{
 assert.equal((await call('/stream/editorial',{token:'owner-token'})).status,403);
});
await check('moderator can review pending submission',async()=>{
 const result=await call('/stream/editorial',{token:'editor-token'});
 assert.equal(result.status,200);
 const entries=(await result.json()).items;
 assert.equal(entries.length,1);assert.equal(entries[0].status,'pending');
});
await check('moderator approval schedules a show and shows public video without exposing owner',async()=>{
 const scheduledAt=new Date(Date.now()+48*3600000).toISOString();
 const res=await call('/stream/editorial',{method:'POST',token:'editor-token',body:{uid:'creator-one',id:requests[0].id,decision:'approved',scheduledAt}});
 assert.equal(res.status,200);
 const publicResponse=await call('/stream/programming');
 const item=(await publicResponse.json()).items[0];
 assert.equal(item.videoId,'dQw4w9WgXcQ');
 assert.equal(item.category,'lwa-tv');
 assert.equal(item.scheduledAt,scheduledAt);
 assert.ok(!('uid' in item));assert.ok(!('note' in item));assert.ok(!('rights' in item));
});
await check('unapproved nominations never appear in public schedule',async()=>{
 const res=await call('/stream/requests',{method:'POST',token:'other-token',body:{title:'A nomination for community TV',youtubeUrl:'https://youtu.be/dQw4w9WgXcQ',category:'podcast',rights:'nomination'}});
 assert.equal(res.status,201);
 assert.equal((await (await call('/stream/programming')).json()).items.length,1);
});
await check('client displays 24 times and three independent channels',async()=>{
 assert.ok(stream.includes("Array.from({length:24}"));
 assert.ok(stream.includes("['podcast','podcast / radio'"));
 assert.ok(stream.includes("['lwa-tv','lwa tv'"));
 assert.ok(stream.includes("['live','live'"));
 assert.ok(stream.includes("const classes='stream-slot '"));
});
await check('campus directory includes official UCLA Radio and state school stations',async()=>{
 for(const school of ['https://uclaradio.com/','https://kvrx.org/','https://wcbn.org/','https://wsum.org/'])
  assert.ok(stream.includes(school));
 assert.ok(stream.includes('streamStationSearch'));
 assert.ok(stream.includes('listing does not imply affiliation'));
});
await check('each university radio station has an independent selectable guide slot',async()=>{
 const fakeWindow={};
 vm.runInNewContext(stream,{window:fakeWindow,console,Date,URL});
 const stations=fakeWindow.BigLWAStreamGuide.stations;
 assert.equal(stations.length,16);
 assert.equal(new Set(stations.map(station=>station.url)).size,stations.length);
 assert.ok(stations.every(station=>station.url.startsWith('https://')));
 assert.ok(stream.includes('data-stream-station'));
 assert.ok(stream.includes('function selectStation(index)'));
 assert.ok(stream.includes("renderFeaturedSlots();renderCategory();renderRequests()"));
 assert.ok(stream.includes('DIRECT LINKS · NO SIMULATED AIRTIME'));
 assert.ok(stream.includes('These tiles are hand-picked links, not scheduled airtime'));
});
await check('requested shows include real official video IDs and publisher links',async()=>{
 const fakeWindow={};vm.runInNewContext(stream,{window:fakeWindow,console,Date,URL});
 const entries=fakeWindow.BigLWAStreamGuide.featured;
 const urls=[
  'https://www.youtube.com/watch?v=dHg50mdODFM',
  'https://www.youtube.com/watch?v=abHGyg4LKn4',
  'https://www.youtube.com/watch?v=edk2uac_x0Y',
  'https://www.youtube.com/watch?v=iO9g2KEroiw',
  'https://podcasts.apple.com/us/podcast/the-daily/id1200361736'
 ];
 for(const url of urls)assert.ok(entries.some(x=>x.url===url),'missing '+url);
 assert.ok(entries.some(x=>x.title==='Mr & Mrsinformation'&&!x.url),'unverified creator cannot be given a fabricated channel URL');
 assert.ok(entries.some(x=>x.title==='The Daily'&&x.category==='podcast'));
 assert.ok(entries.some(x=>x.title==='Cartoon Network'&&x.category==='lwa-tv'));
 assert.ok(stream.includes('https://www.youtube-nocookie.com/embed/'));
 assert.ok(stream.includes("if(!source)return;"),'a source with no verified link still has a channel card');
});
await check('video and station buttons tune the existing monitor rather than creating bogus scheduled programs',async()=>{
 assert.ok(stream.includes("class=\"stream-source-slot is-radio\""));
 assert.ok(stream.includes("class=\"stream-source-slot is-creator"));
 assert.ok(stream.includes('function showSource(source)'));
 assert.ok(stream.includes('function selectFeature(id)'));
 assert.ok(stream.includes('function selectStation(index)'));
 assert.ok(stream.includes("if(button.matches('[data-stream-station]'))"));
 assert.ok(stream.includes("if(button.matches('[data-stream-feature]'))"));
 assert.ok(stream.includes('UNOFFICIAL DIRECTORY · NO REBROADCAST'));
 assert.ok(stream.includes("state.programs=Array.isArray(result.items)?result.items.filter"));
 assert.ok(!stream.includes("state.programs=featured"));
});
await check('every hourly cell in the three-channel grid is populated with a real directory pick or clear live idea',async()=>{
 const fakeWindow={};vm.runInNewContext(stream,{window:fakeWindow,console,Date,URL});
 const guide=fakeWindow.BigLWAStreamGuide.guideSlots;
 assert.equal(guide.length,3);
 for(const category of guide){
  assert.equal(category.slots.length,24,'24 hours for '+category.category);
  for(const [hour,pick] of category.slots.entries()){
   assert.ok(pick.title&&pick.title!=='—','missing title at '+category.category+' hour '+hour);
   assert.ok(pick.status,'missing status at '+category.category+' hour '+hour);
   assert.ok(!pick.status.includes('APPROVED')&&!pick.status.includes('ON AIR'),
    'directory pick should not be passed off as approved programming');
  }
 }
 assert.ok(!stream.includes("'<strong>—</strong><small>open slot</small>'"),
  'the old blank hourly cells must be removed');
 assert.ok(stream.includes("const pick=show?null:guidePick(key,hour)"),
  'approved real schedules must take precedence over directory picks');
 assert.ok(stream.includes("show?'APPROVED / PROGRAMMED':pick.status"));
});
await check('each campus radio station occupies a distinct numbered hour in the Podcast grid',async()=>{
 const fakeWindow={};vm.runInNewContext(stream,{window:fakeWindow,console,Date,URL});
 const guide=fakeWindow.BigLWAStreamGuide.guideSlots;
 const radio=guide.find(row=>row.category==='podcast').slots;
 const stations=fakeWindow.BigLWAStreamGuide.stations;
 assert.equal(stations.length,16);
 assert.deepEqual(Array.from(radio.slice(0,16),x=>x.title),Array.from(stations,x=>x.name));
 assert.equal(new Set(radio.slice(0,16).map(x=>x.index)).size,16);
 assert.ok(radio.some(x=>x.title.includes('Owen Thiele')));
 assert.ok(radio.some(x=>x.title==='The Daily'));
 assert.ok(radio.some(x=>x.title==='Mr & Mrsinformation'));
 assert.ok(radio.every(x=>['station','feature'].includes(x.kind)));
});
await check('LWA TV grid includes creator favorites while Live grid only shows explicitly unscheduled concepts',async()=>{
 const fakeWindow={};vm.runInNewContext(stream,{window:fakeWindow,console,Date,URL});
 const guide=fakeWindow.BigLWAStreamGuide.guideSlots;
 const tv=guide.find(row=>row.category==='lwa-tv').slots;
 for(const title of ['Cartoon Network','Markiplier','CoryxKenshin','TeaSpill','Olandria coverage'])
  assert.ok(tv.some(x=>x.title===title),'missing '+title+' in hourly TV grid');
 assert.ok(tv.every(x=>x.kind==='feature'),'LWA TV tiles should open videos or show a link-verification card');
 const live=guide.find(row=>row.category==='live').slots;
 assert.ok(live.every(x=>x.kind==='concept'));
 assert.ok(live.every(x=>x.status.includes('NOT ON AIR')));
 assert.ok(stream.includes("if(button.matches('[data-stream-concept]'))"),'Live ideas must open the request form');
 assert.ok(stream.includes("form.elements.timePreference.value=niceDate(state.day)+' · '+labelHour(hour)"));
});
await check('curated slots are visually distinct from green approved broadcasts',async()=>{
 assert.ok(style.includes('.stream-slot.is-curated'));
 assert.ok(style.includes('.stream-slot.is-concept'));
 assert.ok(style.includes('.stream-slot.is-booked'));
 assert.ok(style.includes('.stream-slot-status'));
 assert.ok(stream.includes("pick.kind==='concept'?'is-concept':'is-curated'"));
 assert.ok(stream.includes('not confirmed airtime'));
 assert.ok(stream.includes('Every hourly square now features a station'));
});
await check('YouTube requests are user-authenticated and moderation-gated',async()=>{
 assert.ok(stream.includes("await authRequest('requests',data)"));
 assert.ok(stream.includes("stream-editorial"));
 assert.ok(worker.includes('await streamEditor(request,user,env)'));
 assert.ok(worker.includes("entry.status")||worker.includes("status:decision"));
});
await check('page wires Stream controller and broadcast styles',async()=>{
 assert.ok(pages.includes("window.BigLWAStreamGuide?.mount"));
 assert.ok(index.includes('/stream-guide.js?v=20261013-populated-hourly-grid-1'));
 assert.ok(index.includes('/stream-guide.css?v=20261013-populated-hourly-grid-1'));
 assert.ok(style.includes('.stream-grid-scroll'));
 assert.ok(style.includes('.stream-mast'));
});
console.log(passed+' Stream integration checks passed');
