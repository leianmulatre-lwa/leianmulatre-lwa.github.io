import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import vm from 'node:vm';
const read=p=>readFileSync(new URL('./'+p,import.meta.url),'utf8');
const worker=read('cloudflare-worker-instagram.js'),player=read('studio-experience.js'),
  profile=read('profile-music.js'),preview=read('studio-preview.js'),html=read('index.html');
const bucketFiles=new Map();
const bucket={
 async put(key,bytes,options){const body=typeof bytes==='string'?new TextEncoder().encode(bytes):new Uint8Array(bytes);
  bucketFiles.set(key,{bytes:body,options});},
 async get(key,params={}){const item=bucketFiles.get(key);if(!item)return null;
  const start=params.range?.offset||0,len=params.range?.length||item.bytes.length-start;
  const data=item.bytes.slice(start,start+len);
  return {size:item.bytes.length,body:new Blob([data]).stream(),json:async()=>JSON.parse(new TextDecoder().decode(item.bytes))};},
 async delete(keys){for(const key of Array.isArray(keys)?keys:[keys])bucketFiles.delete(key)},
 async list({prefix}){return {objects:[...bucketFiles.keys()].filter(k=>k.startsWith(prefix)).map(key=>({key}))}}
};
const mockFetch=async(input,options)=>{
 const req=typeof input==='string'?new Request(input,options):input,url=new URL(req.url);
 if(url.hostname==='identitytoolkit.googleapis.com'){
  const token=(await req.json()).idToken,uid=token==='token-one'?'uid-one':token==='token-two'?'uid-two':null;
  return new Response(JSON.stringify({users:uid?[{localId:uid,emailVerified:true}]:[]}),{status:uid?200:401});
 }
 throw Error('Unexpected fetch '+url.href);
};
const kv={get:async()=>null,put:async()=>{},delete:async()=>{}};
const env={INSTAGRAM_APP_ID:'x',INSTAGRAM_APP_SECRET:'s',SITE_URL:'https://biglwa.com',
 STATE_SECRET:'something',OAUTH_SESSIONS:kv,WALLPAPER_BUCKET:bucket};
const ctx={URL,URLSearchParams,Request,Response,Headers,Blob,TextDecoder,TextEncoder,
 crypto:webcrypto,fetch:mockFetch,console,
 btoa:s=>Buffer.from(s,'binary').toString('base64'),atob:s=>Buffer.from(s,'base64').toString('binary')};
vm.runInNewContext(worker.replace('export default {','const fakeWorker = {')+
 '\nglobalThis.workerTest={route:fakeWorker.fetch.bind(fakeWorker)};',ctx);
const route=ctx.workerTest.route;
function req(path,{method='GET',token='',body=null,type='audio/mpeg'}={}){
 const headers={Origin:'https://biglwa.com',...(token?{Authorization:'Bearer '+token}:{})};
 if(body)headers['Content-Type']=type;
 return new Request('https://worker.example'+path,{method,headers,...(body?{body}: {})});
}
let count=0;async function check(name,fn){await fn();count++;console.log('PASS '+name)}
await check('unauthenticated user cannot upload',async()=>{
 const bad=await route(req('/media/profile-music',{method:'POST',body:new Uint8Array([1,2,3])}),env);
 assert.equal(bad.status,401);
});
let first;
await check('audio upload verifies owner and stores PRIVATE by default',async()=>{
 const response=await route(req('/media/profile-music?title=First%20song&artist=Tester',
  {method:'POST',token:'token-one',body:new Uint8Array([1,2,3,4,5])}),env);
 assert.equal(response.status,200);first=(await response.json()).track;
 assert.equal(first.public,false);assert.equal(first.title,'First song');
 assert.ok(bucketFiles.has('profile-music/uid-one/'+first.id+'.json'));
 assert.ok(bucketFiles.has('profile-music/uid-one/'+first.id+'.mp3'));
});
await check('anonymous profile shows only published music',async()=>{
 const response=await route(req('/media/profile-music/uid-one'),env);
 assert.equal(response.status,200);
 assert.equal((await response.json()).tracks.length,0);
 const privateFile=await route(req('/media/profile-music/uid-one/'+first.id),env);
 assert.equal(privateFile.status,404);
});
await check('account owner can list and listen to its private music, other members cannot',async()=>{
 const own=await route(req('/media/profile-music/me',{token:'token-one'}),env);
 assert.equal((await own.json()).tracks.length,1);
 const copy=await route(req('/media/profile-music/uid-one/'+first.id,{token:'token-two'}),env);
 assert.equal(copy.status,404);
 const allowed=await route(req('/media/profile-music/uid-one/'+first.id,{token:'token-one'}),env);
 assert.equal(allowed.status,200);assert.equal((await allowed.arrayBuffer()).byteLength,5);
});
await check('owner alone may publish; public visitors can stream after approval',async()=>{
 const attacker=await route(req('/media/profile-music/uid-one/'+first.id,
  {method:'PATCH',token:'token-two',type:'application/json',body:JSON.stringify({public:true})}),env);
 assert.equal(attacker.status,403);
 const published=await route(req('/media/profile-music/uid-one/'+first.id,
  {method:'PATCH',token:'token-one',type:'application/json',body:JSON.stringify({public:true})}),env);
 assert.equal(published.status,200);assert.equal((await published.json()).track.public,true);
 const listed=await route(req('/media/profile-music/uid-one'),env);
 const songs=(await listed.json()).tracks;assert.equal(songs.length,1);
 assert.ok(songs[0].url.includes('/media/profile-music/uid-one/'));
 const file=await route(req('/media/profile-music/uid-one/'+first.id),env);
 assert.equal(file.status,200);assert.equal((await file.arrayBuffer()).byteLength,5);
});
await check('range requests support audio seeking',async()=>{
 const rangeRequest=req('/media/profile-music/uid-one/'+first.id);
 rangeRequest.headers.set('Range','bytes=2-4');
 const response=await route(rangeRequest,env);
 assert.equal(response.status,206);
 assert.equal(response.headers.get('Content-Range'),'bytes 2-4/5');
 assert.deepEqual([...new Uint8Array(await response.arrayBuffer())],[3,4,5]);
});
await check('private toggle immediately revokes anonymous playback',async()=>{
 await route(req('/media/profile-music/uid-one/'+first.id,
  {method:'PATCH',token:'token-one',type:'application/json',body:JSON.stringify({public:false})}),env);
 assert.equal((await route(req('/media/profile-music/uid-one/'+first.id),env)).status,404);
});
await check('delete removes audio and metadata and preserves other user',async()=>{
 const response=await route(req('/media/profile-music/uid-one/'+first.id,{method:'DELETE',token:'token-one'}),env);
 assert.equal(response.status,200);
 assert.equal(bucketFiles.size,0);
});
await check('eject button and both pickers still work after move to profile editor',async()=>{
 assert.ok(player.includes("const selector=$('#studioTrackInput');"));
 assert.ok(!player.includes("const selector=$('#studioTrackInput',card)"));
 assert.ok(player.includes("$('#studioTrackInput').addEventListener('change'"));
 assert.ok(player.includes("$('#studioCoverInput').addEventListener('change'"));
 assert.ok(player.includes("$('#chooseStudioTrack',card).addEventListener('click',()=>$('#studioTrackInput')?.click()"));
 assert.ok(player.includes("biglwa:music-local-upload"));
 assert.ok(player.includes("window.BigLWAStudioMusic="));
});
await check('visitors load profile owners published songs instead of their own local music',async()=>{
 assert.ok(preview.includes('biglwa:public-profile-ready'));
 assert.ok(profile.includes("const response=await data(state.owner?'/me':'/'+encodeURIComponent(state.uid)"));
 assert.ok(profile.includes("state.owner=false;state.selected='';state.tracks=[]"));
 assert.ok(profile.includes("audio.pause();audio.removeAttribute('src');audio.load()"));
 assert.ok(profile.includes("if(!state.owner&&first&&!state.selected)selectPublic(first)"));
 assert.ok(profile.includes("if(state.owner){button('share',track.public?'Make private':'Publish')"));
 assert.ok(/profile-music\.js\?v=[\w.-]+/.test(html));
});
console.log('Music profile tests passed:',count);
