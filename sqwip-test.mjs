import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';

const read=n=>readFileSync(new URL('./'+n,import.meta.url),'utf8');
const client=read('sqwip.js'),style=read('sqwip.css'),pages=read('module-pages.js'),index=read('index.html'),worker=read('cloudflare-worker-instagram.js');
const records=new Map();
const bucket={
 async put(key,raw,metadata){records.set(key,{raw:String(raw),metadata})},
 async get(key){return records.has(key)?{json:async()=>JSON.parse(records.get(key).raw)}:null}
};
const fetchMock=async (resource,opts={})=>{
 const request=resource instanceof Request?resource:new Request(resource,opts);
 const url=new URL(request.url);
 if(url.hostname==='identitytoolkit.googleapis.com'){
  const data=await request.json();
  const uid=({'valid-one':'author-one','valid-two':'author-two'})[data.idToken];
  return new Response(JSON.stringify({users:uid?[{localId:uid,emailVerified:true}]:[]}),{status:uid?200:400});
 }
 throw Error('Unexpected fetch '+url.href);
};
const ctx={URL,URLSearchParams,Request,Response,Headers,TextEncoder,TextDecoder,crypto:webcrypto,fetch:fetchMock,console,
 btoa:v=>Buffer.from(v,'binary').toString('base64'),atob:v=>Buffer.from(v,'base64').toString('binary')};
vm.runInNewContext(worker.replace('export default {','const appWorker = {')+'\nglobalThis.testWorker=appWorker.fetch.bind(appWorker);',ctx);
const env={SITE_URL:'https://biglwa.com',WALLPAPER_BUCKET:bucket};
const call=(method,{token='',body,origin='https://biglwa.com',path='/sqwip/library'}={})=>ctx.testWorker(
 new Request('https://worker.example'+path,{method,headers:{
  Origin:origin,...(token?{Authorization:'Bearer '+token}:{}),...(body?{'Content-Type':'application/json'}:{})},
  ...(body?{body:JSON.stringify(body)}:{})}),env);
const original={version:1,selectedId:'script-one',deletedIds:[],documents:[{
 id:'script-one',title:'The New Wave',author:'BIG LWA',updatedAt:123456,
 blocks:[{id:'line-one',type:'scene',text:'INT. STUDIO - NIGHT'},
  {id:'line-two',type:'action',text:'Curtains part.'},
  {id:'line-three',type:'character',text:'LEYAN'},
  {id:'line-four',type:'dialogue',text:'The camera is rolling.'}]
}]};
let passed=0;
async function check(name,fn){await fn();passed++;console.log('PASS '+name)}
await check('anonymous access denied',async()=>{
 assert.equal((await call('GET')).status,401);
});
await check('untrusted Origin rejected',async()=>{
 assert.equal((await call('POST',{token:'valid-one',body:original,origin:'https://evil.example'})).status,403);
 assert.equal(records.size,0);
});
await check('authenticated author saves account-scoped library',async()=>{
 const res=await call('POST',{token:'valid-one',body:original});
 assert.equal(res.status,200);assert.equal((await res.json()).count,1);
 assert.ok(records.has('sqwip/author-one/library.json'));
});
await check('same member reads screenplay from any device',async()=>{
 const res=await call('GET',{token:'valid-one'});assert.equal(res.status,200);
 const data=(await res.json()).library;
 assert.equal(data.documents[0].title,'The New Wave');
 assert.equal(data.documents[0].blocks[3].text,'The camera is rolling.');
 assert.equal(data.selectedId,'script-one');
});
await check('another author cannot read somebody else scripts',async()=>{
 const res=await call('GET',{token:'valid-two'});assert.equal(res.status,200);
 assert.equal((await res.json()).library.documents.length,0);
});
await check('second users saves do not overwrite first user',async()=>{
 assert.equal((await call('POST',{token:'valid-two',body:original})).status,200);
 assert.equal(records.size,2);
 assert.equal((await (await call('GET',{token:'valid-one'})).json()).library.documents[0].title,'The New Wave');
});
await check('invalid screenplay block types, IDs and size are rejected',async()=>{
 const bad=structuredClone(original);bad.documents[0].blocks[0].type='javascript';
 assert.equal((await call('POST',{token:'valid-one',body:bad})).status,400);
 bad.documents[0].blocks[0].type='scene';bad.documents[0].id='../other';
 assert.equal((await call('POST',{token:'valid-one',body:bad})).status,400);
 bad.documents[0].id='script-one';bad.documents[0].blocks[0].text='x'.repeat(16000);
 assert.equal((await call('POST',{token:'valid-one',body:bad})).status,413);
});
await check('deletion tombstones prevent cross-device resurrection',async()=>{
 const erased={version:1,selectedId:'',documents:[],deletedIds:['script-one']};
 assert.equal((await call('POST',{token:'valid-one',body:erased})).status,200);
 const data=(await (await call('GET',{token:'valid-one'})).json()).library;
 assert.equal(data.documents.length,0);
 assert.deepEqual(Array.from(data.deletedIds),['script-one']);
});
await check('Diary journal remains separate and redundant cover label removed',async()=>{
 assert.ok(pages.includes('biglwaDraft_'));
 assert.ok(pages.includes('BigLWASqwip.mount(screenplay)'));
 assert.ok(pages.includes('Property of:'));
 assert.ok(!pages.includes('<strong>Diary</strong><span>Property of:'));
 assert.ok(pages.includes('diaryWritingSection')&&pages.includes('sqwipWritingSection'));
});
await check('Fountain screenplay roundtrip is functional',async()=>{
 const win={addEventListener(){}},doc={addEventListener(){}};
 vm.runInNewContext(client,{window:win,document:doc,console,crypto:webcrypto,URL,setTimeout,clearTimeout});
 const editor=win.BigLWASqwip;
 const imported=editor.parseFountain('Title: The Pilot\nAuthor: L. Writer\n\nINT. ROOM - NIGHT\n\n@EVELYN\nHello, world.\n\n> CUT TO:\n');
 assert.equal(imported.title,'The Pilot');assert.equal(imported.author,'L. Writer');
 assert.equal(imported.blocks[0].type,'scene');
 assert.ok(imported.blocks.some(x=>x.type==='character'&&x.text==='EVELYN'));
 assert.ok(imported.blocks.some(x=>x.type==='dialogue'&&x.text==='Hello, world.'));
 assert.ok(imported.blocks.some(x=>x.type==='transition'));
 const exported=editor.fountain({title:imported.title,author:imported.author,blocks:imported.blocks});
 assert.ok(exported.includes('Title: The Pilot')&&exported.includes('@EVELYN')&&exported.includes('> CUT TO:'));
 assert.ok(editor.wordCount({blocks:imported.blocks})>0);
 assert.ok(editor.estimatePages({blocks:imported.blocks})>=1);
});
await check('keyboard screenplay elements, backup/export, print, account sync are wired',async()=>{
 for(const text of ['function handleBlockKey','function handleEnter','function handleBackspace',
  'function scheduleCloudSave','async function syncFromCloud','async function pushToCloud',
  "event.key==='Tab'","event.key==='Enter'",'data-sqwip-jump','data-sqwip-add',
  "window.print()",'deletedIds','fountain','Sqwip account sync'])
  assert.ok(client.includes(text),'Missing client behavior '+text);
 assert.ok(style.includes('.sqwip-type-dialogue')&&style.includes('.sqwip-type-character'));
 assert.ok(style.includes('@media print')&&style.includes('.sqwip-print-title'));
});
await check('new assets load before Diary and updated module is cache-busted',async()=>{
 const file='/sqwip.js?v=20261014-screenplay-1';
 assert.ok(index.includes(file));
 assert.ok(index.includes('/sqwip.css?v=20261014-screenplay-1'));
 assert.ok(index.includes('/module-pages.js?v='));
 assert.ok(index.indexOf(file)<index.indexOf('/module-pages.js?v=20261014-stream-ballroom-1'));
});
console.log(passed+' Sqwip integration checks passed');