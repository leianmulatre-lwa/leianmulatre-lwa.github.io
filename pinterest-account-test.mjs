import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';

const worker=readFileSync(new URL('./cloudflare-worker-instagram.js',import.meta.url),'utf8');
const posts=readFileSync(new URL('./orbit-posts.js',import.meta.url),'utf8');
const ui=readFileSync(new URL('./pinterest-orbit.js',import.meta.url),'utf8');
const connections=readFileSync(new URL('./orbit-connections.js',import.meta.url),'utf8');
const pages=readFileSync(new URL('./module-pages.js',import.meta.url),'utf8');
const records=new Map();
const copied=new Map();
const kv={
 async get(k,type){const data=records.get(k);return data==null?null:type==='json'?JSON.parse(data):data},
 async put(k,v){records.set(k,v)},
 async delete(k){records.delete(k)}
};
const env={SITE_URL:'https://biglwa.com',PINTEREST_APP_ID:'fake-id',PINTEREST_APP_SECRET:'fake-secret',OAUTH_SESSIONS:kv,
 WALLPAPER_BUCKET:{async put(k,bytes,meta){copied.set(k,{bytes,meta})},async get(k){return copied.has(k)?copied.get(k):null}}};
const mockFetch=async (request,options)=>{
 const req=typeof request==='string'?new Request(request,options):request,url=new URL(req.url);
 if(url.hostname==='identitytoolkit.googleapis.com'){
  const input=await req.json(),uid=({'token-one':'uid-one','token-two':'uid-two'})[input.idToken];
  return new Response(JSON.stringify({users:uid?[{localId:uid}]:[]}),{status:uid?200:400});
 }
 if(url.hostname==='i.pinimg.com')
  return new Response(new Uint8Array([137,80,78,71,13,10,26,10]),{status:200,headers:{'content-type':'image/png'}});
 if(url.hostname==='api.pinterest.com'&&url.pathname==='/v5/user_account')
  return new Response(JSON.stringify({username:'pintest',profile_image:'https://i.pinimg.com/a.jpg'}),{status:200});
 throw Error('Unexpected request '+url.href);
};
const context={URL,URLSearchParams,Request,Response,Headers,TextEncoder,TextDecoder,crypto:webcrypto,fetch:mockFetch,console,
 btoa:s=>Buffer.from(s,'binary').toString('base64'),atob:s=>Buffer.from(s,'base64').toString('binary')};
assert.ok(worker.includes('export default {'));
vm.runInNewContext(worker.replace('export default {','const fakeWorker = {')+
 '\nglobalThis.testFns={route:fakeWorker.fetch.bind(fakeWorker),save:pnSave,pinImage:pnPinImage};',context);
const {route,save,pinImage}=context.testFns;
const req=(path,{method='GET',token='',body=null}={})=>new Request('https://worker.example'+path,{
 method,headers:{Origin:'https://biglwa.com',...(token?{Authorization:'Bearer '+token}:{}),...(body?{'Content-Type':'application/json'}:{})},
 ...(body?{body:JSON.stringify(body)}:{})
});
let checks=0;
async function check(name,fn){await fn();checks++;console.log('PASS '+name)}
const sid='s'.repeat(43),now=Date.now();
records.set('pn:session:'+sid,JSON.stringify({access_token:'access',refresh_token:'refresh',expiresAt:now+3600000,refreshExpiresAt:now+86400000}));
await check('Pinterest OAuth returns to the exact trusted Big LWA origin',async()=>{
 const challenge='p'.repeat(43);
 const callback=await route(req('/pinterest/start?challenge='+challenge+'&return_to='+encodeURIComponent('https://www.biglwa.com/studio/boards')),env);
 assert.equal(callback.status,302);
 const oauth=new URL(callback.headers.get('location'));
 const state=oauth.searchParams.get('state');
 const stored=JSON.parse(records.get('pn:state:'+state));
 assert.equal(stored.returnTo,'https://www.biglwa.com/studio/boards');
 assert.equal(stored.challenge,challenge);
 const untrusted=await route(req('/pinterest/start?challenge='+challenge+'&return_to='+encodeURIComponent('https://not-biglwa.com/studio/boards')),env);
 assert.equal(untrusted.status,302);
 const state2=new URL(untrusted.headers.get('location')).searchParams.get('state');
 assert.ok(JSON.parse(records.get('pn:state:'+state2)).returnTo.startsWith('https://biglwa.com/'));
});
await check('anonymous account recovery refused',async()=>{
 assert.equal((await route(req('/pinterest/session/account'),env)).status,401);
});
await check('verified account claims session',async()=>{
 const response=await route(req('/pinterest/session/claim',{method:'POST',token:sid,body:{firebaseIdToken:'token-one'}}),env);
 assert.equal(response.status,200);assert.equal((await response.json()).session,sid);
 assert.equal(records.get('pn:firebase:uid-one'),sid);
});
await check('correct user restores Pinterest across devices',async()=>{
 const response=await route(req('/pinterest/session/account',{token:'token-one'}),env);
 assert.equal(response.status,200);const payload=await response.json();
 assert.equal(payload.connected,true);assert.equal(payload.session,sid);
});
await check('different user cannot restore or claim same Pinterest session',async()=>{
 const other=await route(req('/pinterest/session/account',{token:'token-two'}),env);
 assert.equal((await other.json()).connected,false);
 const steal=await route(req('/pinterest/session/claim',{method:'POST',token:sid,body:{firebaseIdToken:'token-two'}}),env);
 assert.equal(steal.status,403);
 assert.equal(JSON.parse(records.get('pn:session:'+sid)).firebaseUid,'uid-one');
});
await check('refresh preserves Firebase account binding',async()=>{
 const previous=JSON.parse(records.get('pn:session:'+sid));
 await save(env,sid,{access_token:'new-access',refresh_token:'new-refresh',expires_in:3600,refresh_token_expires_in:86400},previous);
 assert.equal(JSON.parse(records.get('pn:session:'+sid)).firebaseUid,'uid-one');
 assert.equal(records.get('pn:firebase:uid-one'),sid);
});
await check('linked account can fetch its Pinterest profile',async()=>{
 const response=await route(req('/pinterest/profile',{token:sid}),env);
 assert.equal(response.status,200);assert.equal((await response.json()).username,'pintest');
});
await check('Pinterest Pin image copy requires matching Firebase uid and Pinterest account',async()=>{
 const items=[{sourcePostId:'123',index:0,url:'https://i.pinimg.com/originals/p1.png',mediaType:'IMAGE'}];
 const body=JSON.stringify({items});
 const good=new Request('https://worker.example/media/orbit-import',{method:'POST',
  headers:{Origin:'https://biglwa.com',Authorization:'Bearer token-one','X-Pinterest-Session':sid,'Content-Type':'application/json'},body});
 const ok=await route(good,env);
 assert.equal(ok.status,200);
 const data=await ok.json();
 assert.equal(data.imported.length,1);
 assert.ok(data.imported[0].url.includes('/media/orbit/uid-one/'));
 assert.ok(data.imported[0].key.startsWith('uid-one/'));
 assert.equal(copied.size,1);
 assert.equal([...copied.values()][0].meta.customMetadata.source,'pinterest');
 const mismatched=new Request('https://worker.example/media/orbit-import',{method:'POST',
  headers:{Origin:'https://biglwa.com',Authorization:'Bearer token-two','X-Pinterest-Session':sid,'Content-Type':'application/json'},body});
 assert.equal((await route(mismatched,env)).status,403);
 const unapproved=new Request('https://worker.example/media/orbit-import',{method:'POST',
  headers:{Origin:'https://biglwa.com',Authorization:'Bearer token-one','X-Pinterest-Session':sid,'Content-Type':'application/json'},
  body:JSON.stringify({items:[{sourcePostId:'bad',index:0,url:'https://www.pinterest.com/pin/1'}]})});
 assert.equal((await route(unapproved,env)).status,502);
 assert.equal(copied.size,1);
});
await check('PKCE handoff requires a matching verifier',async()=>{
 const handoff='h'.repeat(43),otherSid='n'.repeat(43),verifier='v'.repeat(43);
 const digest=await webcrypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier));
 const challenge=Buffer.from(digest).toString('base64url');
 records.set('pn:handoff:'+handoff,JSON.stringify({id:otherSid,challenge}));
 records.set('pn:session:'+otherSid,JSON.stringify({access_token:'new',refresh_token:'refresh',expiresAt:Date.now()+3600000}));
 const bad=await route(req('/pinterest/session',{method:'POST',body:{handoff,verifier:'wrong',firebaseIdToken:'token-one'}}),env);
 assert.equal(bad.status,401);
 assert.ok(records.has('pn:handoff:'+handoff));
 const good=await route(req('/pinterest/session',{method:'POST',body:{handoff,verifier,firebaseIdToken:'token-one'}}),env);
 assert.equal(good.status,200);
 assert.equal(JSON.parse(records.get('pn:session:'+otherSid)).firebaseUid,'uid-one');
 assert.equal(records.has('pn:session:'+sid),false,'Previous authorization revoked on reconnect');
});
await check('Pinterest worker chooses image CDN not pin-page URLs',async()=>{
 assert.equal(pinImage({image_url:'https://i.pinimg.com/originals/p1.jpg'}),'https://i.pinimg.com/originals/p1.jpg');
 assert.equal(pinImage({media:{images:{'600x':{url:'https://i.pinimg.com/600x/p2.jpg'}}}}),'https://i.pinimg.com/600x/p2.jpg');
 assert.equal(pinImage({url:'https://www.pinterest.com/pin/10'}),'');
});
await check('flat image_url saves as picture, plain Pin link does not',async()=>{
 const start=posts.indexOf('function pinterestImageUrl(item) {'),end=posts.indexOf('/* A carousel can mix',start);
 assert.ok(start!==-1 && end>start);
 const helpers=posts.slice(start,end);
 const fn=new Function('URL','const clean=v=>String(v??"").trim();'+helpers+';return {pinterestImageUrl,mediaPieces};')(URL);
 const pin={id:'123',image_url:'https://i.pinimg.com/originals/photo.jpg',url:'https://www.pinterest.com/pin/123'};
 assert.equal(fn.pinterestImageUrl(pin),'https://i.pinimg.com/originals/photo.jpg');
 assert.equal(fn.mediaPieces(pin,'pinterest')[0].media_url,'https://i.pinimg.com/originals/photo.jpg');
 assert.equal(fn.mediaPieces({id:'123',url:'https://www.pinterest.com/pin/123'},'pinterest').length,0);
});
await check('Orbit records and UI use verified Pinterest status',async()=>{
 assert.ok(ui.includes("const scopedKey=uid=>KEY+':'+uid"));
 assert.ok(!ui.includes('session()||storageGet(KEY)'), 'Legacy browser token must not attach to a new login');
 assert.ok(ui.includes('session/claim')&&ui.includes('session/account'));
 assert.ok(ui.includes('data-pn-sync')&&ui.includes('biglwa:orbit-imported'));
 assert.ok(ui.includes('syncAllBoards,disconnect,render'));
 assert.ok(ui.includes("biglwaPinterestPendingHandoffV2"),'failed handoff remains pending for safe retry');
 assert.ok(ui.includes('mapping.session!==result.session'),'connection mapping is verified after OAuth handoff');
 assert.ok(ui.includes("biglwa:pinterest-status"),'verified Pinterest client sends a status update');
 assert.ok(pages.includes("pn?.connected&&pn.uid"),'Orbit card consults the signed-in verified provider state');
 assert.ok(posts.includes('"X-Pinterest-Session"'));
 assert.ok(posts.includes("['instagram','pinterest'].includes(source.toLowerCase())"));
 assert.ok(pages.includes("window.__biglwaPinterest.syncAllBoards()"));
 assert.ok(pages.includes("const media=archiveMedia;"));
 assert.ok(!posts.slice(posts.indexOf("export async function loadArchive"),posts.indexOf("export async function getArchiveSettings")).includes('orderBy("sourceCreatedAtMs"'));
 assert.ok(connections.includes('recoverPinterestSession(uid)')&&connections.includes('refreshSource'));
 assert.ok(pages.includes('ORBIT_HANDS=key=>')&&pages.includes('filter(row=>row&&row.id&&row.link)'));
});
console.log(checks+' Pinterest integration checks passed');
