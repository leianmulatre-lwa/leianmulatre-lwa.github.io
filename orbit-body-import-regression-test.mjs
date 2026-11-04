import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {handleAdditionalOrbit} from './new-orbit-oauth.js';

const read=path=>readFileSync(new URL('./'+path,import.meta.url),'utf8');
const worker=read('cloudflare-worker-instagram.js');
const tiktok=read('tiktok-orbit.js');
const posts=read('orbit-posts.js');
const xPage=read('module-pages.js');
const tumblrClient=read('orbit-new-connect-20261018-v6.js');
const scopes=read('wrangler.toml');

// WebWorld-style state transitions are represented by real mocked endpoint
// calls, not by a simulated UI claiming to be authenticated.
const entries=new Map(),storage={
  async get(key,format) { const data=entries.get(key);return format==='json'?(data?JSON.parse(data):null):(data||null); },
  async put(key,value){entries.set(key,value)},
  async delete(key){entries.delete(key)}
};
const env={
  SITE_URL:'https://biglwa.com',OAUTH_SESSIONS:storage,
  TUMBLR_CONSUMER_KEY:'test-key',TUMBLR_CONSUMER_SECRET:'test-secret',
  X_CLIENT_ID:'test-client',X_CLIENT_SECRET:'test-secret'
};
const auth=async()=>({uid:'test-member'});
const originalFetch=globalThis.fetch;
let externalCalls=[];
globalThis.fetch=async(input,options={})=>{
  const url=String(input);externalCalls.push(url);
  if(url==='https://api.tumblr.com/v2/oauth2/token')
    return Response.json({access_token:'test-access',expires_in:3600});
  if(url==='https://api.tumblr.com/v2/user/info')
    return Response.json({response:{user:{name:'account-id',blogs:[
      {name:'art-blog',title:'Their creative world',primary:true,url:'https://custom.example/'},
      {name:'archive-blog',title:'Archive',primary:false,url:'https://archive-blog.tumblr.com/'}
    ]}}});
  if(url.startsWith('https://publish.twitter.com/oembed?'))
    return Response.json({author_name:'Artist',html:'<blockquote><p>Hello <b>world</b> &amp; culture!</p><script>unsafe()</script></blockquote>'});
  throw Error('Unexpected network dependency in integration test: '+url);
};
try{
  // Tumblr: user account identity is not necessarily its public blog identity.
  const started=await handleAdditionalOrbit(new Request('https://api.biglwa.com/tumblr/start',{
    method:'POST',headers:{Origin:'https://biglwa.com'}
  }),env,auth);
  assert.equal(started.status,200);
  const authorize=new URL((await started.json()).authorizeUrl);
  const state=authorize.searchParams.get('state');
  const callback=await handleAdditionalOrbit(
    new Request('https://api.biglwa.com/tumblr/callback?state='+state+'&code=test-code'),env,auth);
  assert.equal(callback.status,302);
  assert.match(callback.headers.get('location'),/orbit_status=connected/);
  const session=await handleAdditionalOrbit(new Request('https://api.biglwa.com/tumblr/session',{
    headers:{Origin:'https://biglwa.com'}
  }),env,auth);
  const tumblr=await session.json();
  assert.equal(tumblr.connected,true);
  assert.equal(tumblr.profile.sourceUserId,'account-id');
  assert.equal(tumblr.profile.sourceBlogName,'art-blog');
  assert.equal(tumblr.profile.username,'art-blog');
  assert.equal(tumblr.profile.link,'https://www.tumblr.com/art-blog');
  assert.equal(tumblr.profile.blogCount,2);
  assert.match(tumblrClient,/orbitConnectedProfiles/);
  assert.match(tumblrClient,/id==='tumblr'/);
  assert.match(worker,/sourceBlogName:blogName/);

  // X: public post import requires BIG LWA account consent, but NOT X OAuth.
  const xLink='https://x.com/artist/status/1234567890123456789';
  const url='https://api.biglwa.com/x/public-post?url='+encodeURIComponent(xLink);
  const xResult=await handleAdditionalOrbit(new Request(url,{
    headers:{Origin:'https://biglwa.com'}
  }),env,auth);
  assert.equal(xResult.status,200);
  const x=await xResult.json();
  assert.equal(x.count,1);
  assert.equal(x.items[0].url,xLink);
  assert.ok(x.items[0].text.includes('Hello'));
  assert.ok(!x.items[0].text.includes('<b>'));
  assert.ok(!x.items[0].text.includes('<script>'));
  assert.ok(xPage.includes('data-sqwibz-public-x'));
  const invalid=await handleAdditionalOrbit(new Request(
    'https://api.biglwa.com/x/public-post?url='+encodeURIComponent('https://attacker.example/artist/status/1234567890123456789'),{
      headers:{Origin:'https://biglwa.com'}
    }),env,auth);
  assert.equal(invalid.status,422);
  const anonymous=await handleAdditionalOrbit(new Request(url,{
    headers:{Origin:'https://biglwa.com'}
  }),env,async()=>null);
  assert.equal(anonymous.status,401);

  // TikTok: public post embed is separate from privileged video.list, stores
  // only official player URL and requires explicit consent to publish.
  assert.match(worker,/path === '\/tiktok\/oembed'/);
  assert.match(worker,/www\.tiktok\.com\/player\/v1\//);
  assert.match(worker,/page<5/);
  assert.match(worker,/has_more/);
  assert.match(tiktok,/data-tiktok-public-save/);
  assert.match(tiktok,/authorizedFromTikTokVideoList:true/);
  assert.match(tiktok,/publishToCollective:true/);
  assert.match(posts,/embedUrl/);
  assert.match(scopes,/keep_vars\s*=\s*true/);
  console.log('PASS Tumblr primary blog survives OAuth and user profile mirror');
  console.log('PASS X public post saves without provider OAuth; rejects invalid hosts and anonymous calls');
  console.log('PASS TikTok public media route, pagination, private drafts, and safe player metadata');
}finally{globalThis.fetch=originalFetch}
