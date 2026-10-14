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
await check('YouTube requests are user-authenticated and moderation-gated',async()=>{
 assert.ok(stream.includes("await authRequest('requests',data)"));
 assert.ok(stream.includes("stream-editorial"));
 assert.ok(worker.includes('await streamEditor(request,user,env)'));
 assert.ok(worker.includes("entry.status")||worker.includes("status:decision"));
});
await check('page wires Stream controller and broadcast styles',async()=>{
 assert.ok(pages.includes("window.BigLWAStreamGuide?.mount"));
 assert.ok(index.includes('/stream-guide.js?v=20261013-retro-guide-1'));
 assert.ok(index.includes('/stream-guide.css?v=20261013-retro-guide-1'));
 assert.ok(style.includes('.stream-grid-scroll'));
 assert.ok(style.includes('.stream-mast'));
});
console.log(passed+' Stream integration checks passed');
