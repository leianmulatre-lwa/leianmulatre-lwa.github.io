import assert from 'node:assert/strict';
import {handleAdditionalOrbit} from './new-orbit-oauth.js';

// No real X credentials, personal tokens, or account information.
const store=new Map();
const env={
 X_CLIENT_ID:'test-client-id',X_CLIENT_SECRET:'test-client-secret',
 NEW_ORBIT_CALLBACK_ORIGIN:'https://api.biglwa.com',
 OAUTH_SESSIONS:{
  put:async(k,v)=>store.set(k,JSON.parse(v)),
  get:async k=>store.get(k),
  delete:async k=>store.delete(k)
 }
};
const user=async()=>({uid:'test-member'});
const start=async()=>{
 const r=await handleAdditionalOrbit(new Request('https://api.biglwa.com/x/start',{
  method:'POST',headers:{Origin:'https://biglwa.com',Authorization:'Bearer fake-test'}
 }),env,user);
 assert.equal(r.status,200);
 const d=await r.json(),auth=new URL(d.authorizeUrl),state=auth.searchParams.get('state');
 assert.equal(auth.origin+auth.pathname,'https://x.com/i/oauth2/authorize');
 assert.equal(auth.searchParams.get('redirect_uri'),'https://api.biglwa.com/x/callback');
 assert.equal(auth.searchParams.get('code_challenge_method'),'S256');
 assert.equal(auth.searchParams.get('scope'),'users.read tweet.read offline.access');
 assert.ok(auth.searchParams.get('code_challenge')?.length>=43);
 assert.ok(state?.length>=32);
 const saved=store.get('new-orbit:x:state:'+state);
 assert.ok(saved?.verifier);
 return {state,verifier:saved.verifier};
};
const originalFetch=globalThis.fetch;
let tokenExchanges=0,profileReads=0;
try{
 const granted=await start();
 globalThis.fetch=async(url,options={})=>{
  if(url==='https://api.x.com/2/oauth2/token'){
   tokenExchanges++;
   assert.equal(options.method,'POST');
   assert.equal(options.body.get('code_verifier'),granted.verifier);
   assert.equal(options.body.get('redirect_uri'),'https://api.biglwa.com/x/callback');
   assert.equal(options.body.get('grant_type'),'authorization_code');
   assert.ok(options.headers.Authorization?.startsWith('Basic '));
   return Response.json({access_token:'fake-test-access',refresh_token:'fake-test-refresh',expires_in:7200});
  }
  assert.match(url,/^https:\/\/api\.x\.com\/2\/users\/me\?/);
  assert.equal(options.headers.Authorization,'Bearer fake-test-access');
  profileReads++;
  return Response.json({data:{id:'12345',username:'creator',name:'Creator',
   profile_image_url:'https://pbs.twimg.com/profile_images/example.jpg',
   public_metrics:{followers_count:1492}}});
 };
 const cb=await handleAdditionalOrbit(new Request('https://api.biglwa.com/x/callback?state='+granted.state+'&code=fake-test-code'),env,user);
 assert.equal(cb.status,302);
 assert.match(cb.headers.get('location'),/orbit_status=connected/);
 assert.equal(tokenExchanges,1);assert.equal(profileReads,1);
 const saved=store.get('new-orbit:x:account:test-member');
 assert.equal(saved.profile.username,'creator');
 assert.equal(saved.profile.followers,1492);
 assert.equal(saved.profile.sourceUserId,'12345');
 assert.equal(saved.refreshToken,'fake-test-refresh');
 const session=await handleAdditionalOrbit(new Request('https://api.biglwa.com/x/session',{headers:{Origin:'https://biglwa.com'}}),env,user);
 const json=await session.json();
 assert.equal(json.connected,true);
 assert.equal(json.profile.link,'https://x.com/creator');
 assert.equal(json.profile.followers,1492);
 assert.ok(!JSON.stringify(json).includes('fake-test-access'),'X tokens cannot leak to browser');

 const denied=await start();
 const rejection=await handleAdditionalOrbit(new Request('https://api.biglwa.com/x/callback?state='+denied.state+'&error=invalid_scope'),env,user);
 assert.equal(rejection.status,302);
 assert.match(new URL(rejection.headers.get('location')).searchParams.get('orbit_error'),/invalid_scope/);
 assert.ok(!store.has('new-orbit:x:state:'+denied.state),'Denied X state cannot be replayed');

 const bad=await start();
 globalThis.fetch=async(url)=>Response.json({error:'invalid_client',error_description:'TOKEN MUST NEVER SHOW'}, {status:401});
 const failed=await handleAdditionalOrbit(new Request('https://api.biglwa.com/x/callback?state='+bad.state+'&code=bad-code'),env,user);
 assert.equal(failed.status,302);
 const info=new URL(failed.headers.get('location')).searchParams.get('orbit_error');
 assert.match(info,/invalid_client/);
 assert.ok(!info.includes('TOKEN MUST NEVER SHOW'));
}finally{globalThis.fetch=originalFetch}
console.log('PASS X OAuth 2.0 PKCE state, confidential token exchange, session mapping and redacted failure diagnostics');
