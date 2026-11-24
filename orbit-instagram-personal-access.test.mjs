import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script,runInNewContext} from 'node:vm';
import test from 'node:test';
const read=p=>readFileSync(new URL('./'+p,import.meta.url),'utf8');
const ig=read('instagram-orbit.js'),pages=read('module-pages.js');
test('default Instagram action does not launch Business Login; explicit sync still works',()=>{
 const start=ig.indexOf('  function connect(options)'),end=ig.indexOf('  async function restore(',start);
 assert(start>=0&&end>start);
 const routes=[],redirects=[];
 const window={openBIGLWAModule:key=>routes.push(key),location:{origin:'https://biglwa.com',assign:url=>redirects.push(url)}};
 const connect=runInNewContext(ig.slice(start,end)+'\nconnect',{window,API:'https://api.biglwa.com',status:()=>{}});
 connect();connect({professional:false});
 assert.deepEqual(routes,['orbit','orbit']);assert.equal(redirects.length,0);
 connect({professional:true});
 assert.equal(redirects.length,1);assert.match(redirects[0],/\/oauth\/start\?return_to=/);
});
test('personal links are explicitly distinct from authorized syncing',()=>{
 assert.doesNotThrow(()=>new Script(pages));assert.doesNotThrow(()=>new Script(ig));
 assert.match(pages,/Link personal account/);assert.match(pages,/Live sync · pro/);
 assert.match(pages,/Profile link saved · no automatic sync/);
 assert.match(pages,/does not verify ownership or sync media/);
 assert.match(pages,/await manager.save\(k,url\)/);
 assert.match(pages,/client.connect\(\{professional:true\}\)/);
 assert.match(ig,/biglwa:orbit-links-synced',render/);
 for(const shell of ['index.html','studio/index.html','404.html','live-studio-shell.html']){
  const s=read(shell);for(const file of ['instagram-orbit.js','module-pages.js','politc-route-guard.js'])assert(s.includes(file+'?')&&s.match(new RegExp(file.replaceAll('.','\\.')+'\\?[^"\\x27<> ]*igpersonal=20261124-1')));
 }
});
