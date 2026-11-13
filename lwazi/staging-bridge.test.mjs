import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import test from 'node:test';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const files=['index.html','studio/index.html','404.html','live-studio-shell.html'];
const target='https://biglwa-lwazi-pilot.leianmulatre-284.workers.dev/api/lwazi';
const client=read('lwazi-client.js');
test('all production and staging shell variants wire the same live free-only Worker',()=>{
 for(const name of files){
  const shell=read(name);
  assert(shell.includes('location.hostname==="biglwa-web-staging.pages.dev"'),name+' supports exact staging hostname');
  assert(shell.includes('location.hostname.endsWith(".biglwa-web-staging.pages.dev")'),name+' supports staging previews');
  assert(shell.includes('location.hostname==="biglwa.com"'),name+' supports production domain');
  assert(shell.includes('window.__biglwaLwaziEndpoint="'+target+'"'),name+' uses direct healthy endpoint');
  assert(!shell.includes('window.__biglwaLwaziEndpoint=location.hostname.endsWith'),name+' does not use unhealthy relay');
  assert.match(shell,/user-search-results\.js\?v=20261113-command-promo-v2/,name+' loads optimized search');
  assert.match(shell,/lwazi-client\.js\?v=20261112-staging-direct-v6/,name+' loads live model bridge');
  assert.match(shell,/lwazi-search-ui\.js\?v=/,name+' loads card actions');
  assert(shell.indexOf('window.__biglwaLwaziEndpoint=')<shell.indexOf('lwazi-client.js?v='),name+' endpoint is set before bridge');
  assert.equal((shell.match(/lwazi-client\.js\?v=/g)||[]).length,1,name+' registers bridge once');
 }
});
test('the direct browser bridge registers only for configured HTTPS URLs',()=>{
 const win={__biglwaLwaziEndpoint:target};
 vm.runInNewContext(client,{window:win,URL,location:{origin:'https://biglwa-web-staging.pages.dev'},AbortController,console});
 assert.equal(typeof win.__biglwaAskLwazi,'function');
 assert.equal(win.__biglwaLwaziBridge?.endpoint,'https://biglwa-lwazi-pilot.leianmulatre-284.workers.dev');
 assert.equal(win.__biglwaLwaziBridge?.enabled,true);
 const blocked={__biglwaLwaziEndpoint:'http://insecure.example/api/lwazi'};
 vm.runInNewContext(client,{window:blocked,URL,location:{origin:'https://biglwa-web-staging.pages.dev'},AbortController,console});
 assert.equal(blocked.__biglwaAskLwazi,undefined);
});
test('fast requests are bounded; only explicit deep requests get extended inference',()=>{
 assert.match(client,/options\?\.mode==='deep'\?26000:12000/);
 assert.match(client,/const upstreamSignal=options\?\.signal/);
 assert.match(client,/upstreamSignal\?\.addEventListener\?\.\('abort',abortFromCaller/);
 const search=read('user-search-results.js');
 assert.match(search,/__biglwaLwaziDeepThinking\?27000:13000/);
 assert.doesNotMatch(search,/AI model is not configured for this browser yet/);
});
