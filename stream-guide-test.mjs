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
const env={SITE_URL:'https://biglwa.com',STREAM_REQUESTS_ENABLED:'true',PINTEREST_APP_ID:'test',PINTEREST_APP_SECRET:'test',
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
await check('submissions are disabled by default until the programming feature launches',async()=>{
 env.STREAM_REQUESTS_ENABLED='false';
 const health=await call('/stream/health');
 assert.equal(health.status,200);
 assert.equal((await health.json()).requests,false);
 const disabled=await call('/stream/requests',{method:'POST',token:'owner-token',
  body:{title:'New episode',youtubeUrl:videoUrl,category:'lwa-tv',rights:'my-video'}});
 assert.equal(disabled.status,403);
 assert.match((await disabled.json()).error,/future release/i);
 env.STREAM_REQUESTS_ENABLED='true'; // Existing editorial workflow remains regression-tested.
});
await check('LWA Radio keeps three real channels without a request form',async()=>{
 assert.ok(stream.includes("['podcast','lwa radio'"));
 assert.ok(stream.includes("['lwa-tv','lwa tv'"));
 assert.ok(stream.includes("['live','live'"));
 const mount=stream.slice(stream.indexOf(' function mount(host){'),stream.indexOf(' function jumpNow()'));
 assert.ok(mount.includes('streamShuffleAgain'));
 assert.ok(mount.includes('stream-future'));
 assert.ok(!mount.includes('streamRequestForm'));
 assert.ok(!mount.includes('data-stream-scroll-request'));
 assert.ok(!stream.includes('awaiting the next live program'));
 assert.ok(pages.includes('feedStreamExplore'));
 assert.ok(!pages.includes('feedStreamRequest'));
});
await check('date-based shuffle is deterministic, changes by date, and manual shuffle works',async()=>{
 const win={};vm.runInNewContext(stream,{window:win,console,URL,Date});
 const app=win.BigLWAStreamGuide;
 const a=app.getDailyGuide('2026-10-13');
 const same=app.getDailyGuide('2026-10-13');
 const b=app.getDailyGuide('2026-10-14');
 const again=app.getDailyGuide('2026-10-13',1);
 const serial=value=>JSON.stringify(value);
 assert.equal(serial(a),serial(same),'same date must have stable rotation');
 assert.notEqual(serial(a),serial(b),'the next date should rearrange channels');
 assert.notEqual(serial(a),serial(again),'manual shuffle should change selection order');
 assert.equal(a.length,3);
 assert.ok(a.every(x=>x.slots.length===24));
 assert.ok(stream.includes("state.shuffleOffset++;renderGrid();renderFeaturedSlots()"));
});
await check('all sixteen unique campus stations and eight podcast/mixtape picks occupy LWA Radio',async()=>{
 const win={};vm.runInNewContext(stream,{window:win,console,URL,Date});
 const guide=win.BigLWAStreamGuide.getDailyGuide('2026-10-13').find(x=>x.category==='podcast').slots;
 const radio=guide.filter(x=>x.kind==='station');
 const audio=guide.filter(x=>x.kind==='feature');
 assert.equal(radio.length,16);
 assert.equal(new Set(radio.map(x=>x.index)).size,16);
 assert.equal(audio.length,8);
 assert.ok(audio.some(x=>x.title==='The Daily'));
 assert.ok(audio.some(x=>x.title.includes('Owen Thiele')));
 assert.equal(audio.filter(x=>x.status==='ORIGINAL MIXTAPE').length,5);
 assert.ok(guide.every(x=>x.title&&x.subtitle&&x.status));
});
await check('creator rotation uses authentic channel URLs and no hypothetical placeholders',async()=>{
 const win={};vm.runInNewContext(stream,{window:win,console,URL,Date});
 const catalog=win.BigLWAStreamGuide.featured;
 const names=['Tea Spill','Life With Olan','Larray','Quenlin Blackwell','Jacksepticeye',
  'Dream','iHasCupquake','Alissa Violet','Steyuh','Markiplier','CoryxKenshin','Cartoon Network'];
 for(const title of names)assert.ok(catalog.some(x=>x.title===title),'Missing creator '+title);
 const olandria=catalog.find(x=>x.id==='olandria');
 const tea=catalog.find(x=>x.id==='teaspill');
 assert.equal(olandria.channelUrl,'https://www.youtube.com/@X_Olan/videos');
 assert.equal(olandria.videoId,'lx1UP1nLMQw');
 assert.equal(tea.channelUrl,'https://www.youtube.com/@TeaSpill/videos');
 assert.equal(tea.videoId,'Qz5VZPMhw8Q');
 assert.ok(catalog.every(x=>x.url?.startsWith('https://')));
 assert.ok(!catalog.some(x=>/under review|channel link under|creator requested|suggested programming/i.test(x.source+' '+x.subtitle)));
 assert.ok(!catalog.some(x=>x.id==='mrsinformation'||x.id==='teaspill-request'||x.id==='olandria-request'));
 const tv=win.BigLWAStreamGuide.getDailyGuide('2026-10-13').find(x=>x.category==='lwa-tv').slots;
 assert.equal(tv.length,24);
 assert.ok(tv.every(x=>x.kind==='feature'));
 const allIds=new Set(tv.map(x=>x.id));
 for(const source of catalog.filter(x=>x.category==='lwa-tv'))
  assert.ok(allIds.has(source.id),'TV guide missing '+source.title);
});
await check('radio mixtapes link to actual Soulection releases',async()=>{
 const win={};vm.runInNewContext(stream,{window:win,console,URL,Date});
 const catalog=win.BigLWAStreamGuide.featured;
 const links=['https://soulection.lnk.to/RadioMixtape001','https://soulection.lnk.to/UNTITLED',
  'https://soulection.lnk.to/NeptunesTribute','https://radio.soulection.com/'];
 for(const link of links)assert.ok(catalog.some(x=>x.url===link),'missing real mixtape or radio page '+link);
});
await check('Live guide uses real Twitch channels rather than nonexistent live-show proposals',async()=>{
 const win={};vm.runInNewContext(stream,{window:win,console,URL,Date});
 const catalog=win.BigLWAStreamGuide.twitch;
 for(const name of ['hasanabi','pokimane','qtcinderella','kaicenat','fuslie'])
  assert.ok(catalog.some(x=>x.twitchChannel===name),'Missing Twitch channel '+name);
 assert.ok(catalog.every(x=>x.url==='https://www.twitch.tv/'+x.twitchChannel));
 const live=win.BigLWAStreamGuide.getDailyGuide('2026-10-13').find(x=>x.category==='live').slots;
 assert.equal(live.length,24);
 assert.ok(live.every(x=>x.kind==='twitch'&&x.status.includes('UNVERIFIED')));
 assert.ok(live.every(x=>x.id&&catalog.some(y=>y.id===x.id)));
 assert.ok(stream.includes('https://player.twitch.tv/?channel='));
 assert.ok(stream.includes('monitor.innerHTML=state.defaultMonitorMarkup'),'switching categories stops old embedded media');
 assert.ok(stream.includes("encodeURIComponent(window.location.hostname)"),'Twitch embed must pass the actual parent domain');
 assert.ok(stream.includes('autoplay=false&muted=true'));
 assert.ok(stream.includes("if(button.matches('[data-stream-twitch]'))"));
 assert.ok(!stream.includes('data-stream-concept'));
});
await check('curated Stream remains distinct from genuine approved programs',async()=>{
 assert.ok(stream.includes("const pick=show?null:guidePick(key,hour)"));
 assert.ok(stream.includes("show?'APPROVED / PROGRAMMED':pick.status"));
 assert.ok(stream.includes('not an assertion of live broadcasts'));
 assert.ok(style.includes('.stream-slot.is-curated'));
 assert.ok(style.includes('.stream-slot.is-twitch'));
 assert.ok(style.includes('.stream-slot.is-booked'));
});
await check('every discovery link leads directly to a secure original provider',async()=>{
 const win={};vm.runInNewContext(stream,{window:win,console,URL,Date});
 const a=win.BigLWAStreamGuide;
 const links=[
  ...a.stations.map(x=>x.url),
  ...a.featured.map(x=>x.url),
  ...a.twitch.map(x=>x.url)
 ];
 assert.equal(links.length,16+a.featured.length+a.twitch.length);
 for(const url of links) {
  const parsed=new URL(url);
  assert.equal(parsed.protocol,'https:');
  assert.ok(['youtube.com','www.youtube.com','twitch.tv','www.twitch.tv','linktr.ee',
   'soulection.lnk.to','radio.soulection.com','podcasts.apple.com',
   'uclaradio.com','kalx.berkeley.edu','kdvs.org','kcsbweb.as.ucsb.edu',
   'kzsc.org','kcr.sdsu.edu','ksjs.org','kzsu.stanford.edu','kvrx.org','radiok.org',
   'wsum.org','wcbn.org','wvfs.fsu.edu','wuog.org','kwva.uoregon.edu','kpsu.org']
   .includes(parsed.hostname),'unknown or fabricated host '+parsed.hostname);
 }
});
await check('Stream shares the same Studio header and page width as other widgets',async()=>{
 const moduleHeader=pages.includes("else if(key==='stream'){body.innerHTML=heading('stream')+");
 assert.ok(moduleHeader,'Stream must use the same heading() component as the other widgets');
 assert.ok(pages.includes("const heading = (key, extra='')"),'the common Studio heading still exists');
 assert.ok(pages.includes('.module-shell{max-width:1720px'),'shared Studio container width must remain 1720px');
 assert.ok(!style.includes('.module-workspace[data-module-key="stream"] .module-shell{max-width:1320px}'),
  'Stream must not override global Studio width with a narrower cap');
 assert.ok(style.includes('.biglwa-stream{width:100%;min-width:0;max-width:none}'));
 const mount=stream.slice(stream.indexOf(' function mount(host){'),stream.indexOf(' function jumpNow()'));
 assert.ok(mount.includes('class="stream-nav"'),'Stream retains a compact channel selector');
 assert.ok(mount.includes('class="stream-channels" role="tablist"'),'three channels remain navigable');
 assert.ok(!mount.includes('class="stream-mast"'),'duplicate hero header must be removed');
 assert.ok(!mount.includes('class="stream-testcard"'),'extra testcard masthead must be removed');
 assert.ok(!mount.includes('<h1>stream'),'Stream should use the shared H1 from heading()');
 assert.ok(mount.includes('stream-guide'),'retro TV guide remains intact');
 assert.ok(mount.includes('streamMonitor'),'TV player remains intact');
 assert.ok(mount.includes('streamShuffleAgain'),'daily shuffle stays available');
 assert.ok(style.includes('.stream-nav-meta'),'compact nav matches shared Studio geometry');
});
await check('frontend script versions and future features are intentional',async()=>{
 assert.ok(index.includes('stream-guide.js?v=20261014-shared-studio-layout-1'));
 assert.ok(index.includes('stream-guide.css?v=20261014-shared-studio-layout-1'));
 assert.ok(index.includes('module-pages.js?v=20261013-sqwip-editor-1'));
 assert.ok(style.includes('.stream-shuffle-button'));
 assert.ok(style.includes('.stream-future'));
 assert.ok(style.includes('.stream-player-footer'));
 assert.ok(worker.includes("env.STREAM_REQUESTS_ENABLED!=='true'"));
 assert.ok(!stream.includes('request a time slot</h2>'));
});
console.log(passed+' Stream integration checks passed');
