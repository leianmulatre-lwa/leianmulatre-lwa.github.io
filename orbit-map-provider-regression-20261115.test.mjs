import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('./'+p,import.meta.url),'utf8');
const google=read('google-orbit.js'),pages=read('module-pages.js'),
 map=read('map-transport-hub-20261114.js'),css=read('map-transport-hub-20261114.css');
const config=JSON.parse(read('config/orbit-provider-apps-20261115.json'));
test('Google token callback exposes active owner-scoped connection without browser token storage',async()=>{
 const events=new Map(),fired=[],timeouts=[];
 const document={
  readyState:'loading',body:{classList:{toggle(){}},appendChild(){}},head:{appendChild(){}},
  querySelector(){return null},querySelectorAll(){return []},
  createElement(){return {style:{},setAttribute(){},parentNode:{removeChild(){}},textContent:''}},
  addEventListener(type,fn){events.set(type,fn)},
  dispatchEvent(event){fired.push(event.type)}
 };
 const w={
  __biglwaIdentity:{uid:'member-123'},setTimeout(fn){timeouts.push(fn);return timeouts.length},clearTimeout(){},
  console:{error(){}},
  google:{accounts:{oauth2:{initTokenClient(conf){return {requestAccessToken(){conf.callback({access_token:'test-only-not-a-real-token',expires_in:3500})}}}}}}
 };
 const ctx={window:w,document,CustomEvent:class{constructor(type){this.type=type}},console,URL,URLSearchParams,Intl,Date,
   fetch:async url=>({ok:true,json:async()=>url.includes('/drive/')?{files:[]}:url.includes('/calendar/')?{items:[]}:{items:[]}})};
 vm.runInNewContext(google,ctx);
 const api=w.__biglwaGoogleOrbit;
 assert.equal(api.hasActiveToken(),false);
 api.connect();await Promise.resolve();await Promise.resolve();await Promise.resolve();
 assert.equal(api.state.uid,'member-123');
 assert.equal(api.hasActiveToken(),true);
 assert.equal(api.state.connected,true);
 assert(fired.includes('biglwa:google-state'));
 assert.doesNotMatch(google,/localStorage\.setItem\(|sessionStorage\.setItem\(/);
 w.__biglwaIdentity.uid='another-member';
 events.get('biglwa:session-verified')();
 assert.equal(api.hasActiveToken(),false,'old Google OAuth must not carry into the next BIG LWA identity');
 assert.equal(api.state.connected,false);
});
test('Full Orbit listens to successful Google OAuth and shows all three true token-backed services',()=>{
 assert.match(pages,/new Set\(\['instagram','tiktok','pinterest','facebook','youtube','calendar','drive'\]\)/);
 assert.match(pages,/hasActiveToken\?\.\(\)===true/);
 assert.match(pages,/google\?\.state\?\.uid===uid/);
 assert.match(pages,/if\(activeModuleKey==='orbit'\)renderOrbitPage\(\)/);
 assert.match(pages,/calendar:window\.__biglwaGoogleOrbit,drive:window\.__biglwaGoogleOrbit/);
 assert.match(pages,/else if\(\['youtube','calendar','drive'\]\.includes\(k\)\)/);
});
test('Map provider options are accessible on demand and the tall turn list is bounded',()=>{
 assert.match(map,/el\('details','map-service-links'\)/);
 assert.match(map,/el\('summary','map-service-head'\)/);
 assert.match(map,/services\.open=true/);
 assert.match(css,/\.map-service-links:not\(\[open\]\) > :not\(summary\)/);
 assert.match(css,/\.map-nav-turns\{\s*max-height:115px!important/);
 assert.match(css,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)!important/);
});
test('Only supplied public IDs are present; no secret values or live integration claims',()=>{
 assert.equal(config.providers.uber.appId,'PU1pFV9xuCjoYZhnsY0Ec-HSxvdcOCbg');
 assert.equal(config.providers.lyft.appId,'gsMJS3mFlGC9');
 assert.equal(config.providers.spotify.appId,'3c9ff8af3c00432fa3f11d84af9e72df');
 assert.equal(config.providers.soundcloud.appId,null);
 for(const [id,row] of Object.entries(config.providers)){
  assert.equal(row.callback,'https://api.biglwa.com/'+id+'/callback');
  assert(row.requiredCloudflareSecrets.every(name=>name.endsWith('_CLIENT_SECRET')));
  assert.notEqual(row.status,'connected');
  assert(!('access_token' in row)&&!('clientSecret' in row));
 }
 assert.match(config.callbackState,/not enabled/);
});
