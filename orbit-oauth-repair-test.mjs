import assert from 'node:assert/strict';
import {handleAdditionalOrbit} from './new-orbit-oauth.js';
const data=new Map();
const env={SNAPCHAT_CLIENT_ID:'test-client',SNAPCHAT_CLIENT_SECRET:'test-secret',X_CLIENT_ID:'test-x',X_CLIENT_SECRET:'test-secret',NEW_ORBIT_CALLBACK_ORIGIN:'https://api.biglwa.com',OAUTH_SESSIONS:{put:async(k,v)=>data.set(k,JSON.parse(v)),get:async k=>data.get(k),delete:async k=>data.delete(k)}};
const request=provider=>new Request('https://api.biglwa.com/'+provider+'/start',{method:'POST',headers:{Origin:'https://biglwa.com'}});
const snap=await handleAdditionalOrbit(request('snapchat'),env,async()=>({uid:'test-user'}));
assert.equal(snap.status,200);const url=new URL((await snap.json()).authorizeUrl);
assert.equal(url.origin+url.pathname,'https://accounts.snapchat.com/accounts/oauth2/auth');
assert.equal(url.searchParams.get('code_challenge_method'),'S256');
assert.ok(url.searchParams.get('code_challenge'));
const saved=data.get('new-orbit:snapchat:state:'+url.searchParams.get('state'));assert.ok(saved.verifier);
const originalFetch=globalThis.fetch;let tokenChecked=false;
globalThis.fetch=async(target,options)=>{
 if(target==='https://accounts.snapchat.com/accounts/oauth2/token'){
  assert.equal(options.body.get('client_secret'),'test-secret');assert.equal(options.body.get('code_verifier'),saved.verifier);
  assert.equal(options.body.get('redirect_uri'),'https://api.biglwa.com/snapchat/callback');tokenChecked=true;
  return Response.json({access_token:'test-access',expires_in:3600});
 }
 assert.equal(target,'https://kit.snapchat.com/v1/me');return Response.json({data:{me:{externalId:'test-snap',displayName:'Test'}}});
};
try{
 const callback=await handleAdditionalOrbit(new Request('https://api.biglwa.com/snapchat/callback?state='+url.searchParams.get('state')+'&code=test-code'),env,async()=>({uid:'test-user'}));
 assert.ok(callback.headers.get('Location').includes('orbit_status=connected'));assert.ok(tokenChecked);
}finally{globalThis.fetch=originalFetch}
const x=await handleAdditionalOrbit(request('x'),env,async()=>({uid:'test-user'}));const xu=new URL((await x.json()).authorizeUrl);
assert.equal(xu.origin,'https://x.com');assert.equal(xu.searchParams.get('redirect_uri'),'https://api.biglwa.com/x/callback');
console.log('PASS Snap PKCE roundtrip and X registered callback');
