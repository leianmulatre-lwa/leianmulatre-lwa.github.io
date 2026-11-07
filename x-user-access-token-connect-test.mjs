import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {handleAdditionalOrbit} from './new-orbit-oauth.js';

const read=name=>readFileSync(new URL('./'+name,import.meta.url),'utf8');
const source=read('new-orbit-oauth.js').replace(/\bexport\b/g,'').trim();
const worker=read('cloudflare-worker-instagram.js');
const start=worker.indexOf('/* BIG LWA additional Orbit OAuth');
const end=worker.indexOf('/* Separate personal Facebook Login',start);
assert.ok(start>=0&&end>start);
assert.equal(worker.slice(start,end).trim(),source,'Deployed entry must match the tested source');

const ui=read('module-pages.js');
const client=read('orbit-new-connect-20261018-v6.js');
assert.match(ui,/data-orbit-x-token-open/);
assert.match(ui,/data-orbit-x-token-value type="password"/);
assert.match(ui,/data-orbit-x-token-save/);
assert.match(client,/async function connectWithToken/);
assert.match(client,/query\('x','token-connect','POST',user\.idToken/);
assert.doesNotMatch(client,/localStorage\.setItem\([^)]*accessToken/);

const kv=new Map();
const env={
 X_CLIENT_ID:'test-id',X_CLIENT_SECRET:'test-secret',NEW_ORBIT_CALLBACK_ORIGIN:'https://api.biglwa.com',
 OAUTH_SESSIONS:{
  put:async(k,v,opts)=>{assert.ok(opts?.expirationTtl>0);kv.set(k,JSON.parse(v))},
  get:async(k)=>kv.get(k),
  delete:async(k)=>kv.delete(k)
 }
};
const signedIn=async()=>({uid:'member-one'});
const signedInTwo=async()=>({uid:'member-two'});
const anonymous=async()=>null;
const origin='https://biglwa.com';
const token='fake-oauth2-user-token-abcdefghijklmnopqrstuvwxyz';
const req=(accessToken,site=origin)=>new Request('https://api.biglwa.com/x/token-connect',{
 method:'POST',headers:{Origin:site,Authorization:'Bearer firebase-token','Content-Type':'application/json'},
 body:JSON.stringify({accessToken})
});

const original=globalThis.fetch;
try{
 const noAuth=await handleAdditionalOrbit(req(token),env,anonymous);
 assert.equal(noAuth.status,401);
 const crossSite=await handleAdditionalOrbit(req(token,'https://untrusted.example'),env,signedIn);
 assert.equal(crossSite.status,403);
 const malformed=await handleAdditionalOrbit(req('Bearer not-a-user-token'),env,signedIn);
 assert.equal(malformed.status,422);
 assert.equal(kv.size,0);

 let calls=0;
 globalThis.fetch=async(url,{headers}={})=>{
  calls++;
  assert.match(url,/^https:\/\/api\.x\.com\/2\/users\/me\?/);
  assert.equal(headers.Authorization,'Bearer '+token);
  return Response.json({title:'Forbidden',error:'app-only bearer not usable for users/me'},{status:403});
 };
 const invalid=await handleAdditionalOrbit(req(token),env,signedIn);
 assert.equal(invalid.status,502);
 assert.ok(!(await invalid.text()).includes(token));
 assert.equal(kv.size,0,'Rejected token must never create a session');

 globalThis.fetch=async(url,{headers}={})=>{
  calls++;
  assert.match(url,/^https:\/\/api\.x\.com\/2\/users\/me\?/);
  assert.equal(headers.Authorization,'Bearer '+token);
  return Response.json({data:{id:'91823',username:'examplecreator',name:'Example Creator',
   profile_image_url:'https://pbs.twimg.com/profile_images/test.jpg',public_metrics:{followers_count:18}}});
 };
 const accepted=await handleAdditionalOrbit(req(token),env,signedIn);
 assert.equal(accepted.status,200);
 const body=await accepted.json();
 assert.equal(body.connected,true);
 assert.equal(body.profile.username,'examplecreator');
 assert.ok(!JSON.stringify(body).includes(token),'Token must not be returned to client');
 assert.equal(kv.get('new-orbit:x:account:member-one').accessToken,token);
 assert.equal(kv.get('new-orbit:x:account:member-one').scopes,'users.read');
 assert.equal(kv.get('new-orbit:x:account:member-one').manualUserToken,true);
 assert.ok(!kv.has('new-orbit:x:account:member-two'));
 const sessionOne=await handleAdditionalOrbit(new Request('https://api.biglwa.com/x/session',{headers:{Origin:origin}}),env,signedIn);
 assert.equal((await sessionOne.json()).profile.username,'examplecreator');
 const sessionTwo=await handleAdditionalOrbit(new Request('https://api.biglwa.com/x/session',{headers:{Origin:origin}}),env,signedInTwo);
 assert.equal((await sessionTwo.json()).connected,false,'Another member must not inherit the X account');

 // OAuth2 token with tweet.read is allowed to attempt post import; X enforces the actual scope.
 globalThis.fetch=async(url,{headers}={})=>{
  assert.match(url,/^https:\/\/api\.x\.com\/2\/users\/91823\/tweets\?/);
  assert.equal(headers.Authorization,'Bearer '+token);
  return Response.json({data:[{id:'1111111111',text:'Example post',created_at:'2026-11-06T23:00:00Z'}]});
 };
 const imports=await handleAdditionalOrbit(new Request('https://api.biglwa.com/x/imports',{headers:{Origin:origin}}),env,signedIn);
 const posted=await imports.json();
 assert.equal(imports.status,200);
 assert.equal(posted.count,1);
 assert.equal(posted.items[0].text,'Example post');
 assert.ok(!JSON.stringify(posted).includes(token));

 const refreshToken='fake-refresh-token-abcdefghijklmnopqrstuvwxyz';
 globalThis.fetch=async(url,{headers}={})=>{
  assert.match(url,/^https:\/\/api\.x\.com\/2\/users\/me\?/);
  assert.equal(headers.Authorization,'Bearer '+token);
  return Response.json({data:{id:'91823',username:'examplecreator',name:'Example Creator'}});
 };
 const renewed=await handleAdditionalOrbit(new Request('https://api.biglwa.com/x/token-connect',{
  method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},
  body:JSON.stringify({accessToken:token,refreshToken})
 }),env,signedIn);
 assert.equal(renewed.status,200);
 assert.equal((await renewed.json()).refreshable,true);
 assert.equal(kv.get('new-orbit:x:account:member-one').refreshToken,refreshToken);
 kv.get('new-orbit:x:account:member-one').expiresAt=Date.now()-1000;
 let didRefresh=false;
 globalThis.fetch=async(url,opts={})=>{
  assert.equal(url,'https://api.x.com/2/oauth2/token');
  assert.equal(opts.body.get('grant_type'),'refresh_token');
  assert.equal(opts.body.get('refresh_token'),refreshToken);
  assert.match(opts.headers.Authorization,/^Basic /);
  didRefresh=true;
  return Response.json({access_token:'refreshed-test-token',refresh_token:'second-refresh-token',expires_in:3600});
 };
 const refreshed=await handleAdditionalOrbit(new Request('https://api.biglwa.com/x/session',{headers:{Origin:origin}}),env,signedIn);
 const freshBody=await refreshed.json();
 assert.equal(refreshed.status,200);
 assert.equal(freshBody.needsReauth,false);
 assert.ok(!JSON.stringify(freshBody).includes('refreshed-test-token'));
 assert.equal(kv.get('new-orbit:x:account:member-one').accessToken,'refreshed-test-token');
 assert.ok(didRefresh);

 const disconnected=await handleAdditionalOrbit(new Request('https://api.biglwa.com/x/disconnect',{
  method:'POST',headers:{Origin:origin}}),env,signedIn);
 assert.equal(disconnected.status,200);
 assert.ok(!kv.has('new-orbit:x:account:member-one'));
 console.log('PASS X user-token identity verification, per-account KV, no leak, scope delegation, expiry and disconnect');
}finally{globalThis.fetch=original}
