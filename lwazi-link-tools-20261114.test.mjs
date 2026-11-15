import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('./'+path,import.meta.url),'utf8');
const src=read('lwazi-link-tools-20261114.js'),css=read('lwazi-link-tools-20261114.css');
function setup(responseFor){
 const nodes=[];
 class Node{
  constructor(type){this.type=type;this.children=[];this.events={};this.style={};this.dataset={};this.attrs={};this.hidden=false;this.textContent='';this.isConnected=true;nodes.push(this);}
  append(...args){this.children.push(...args)}
  replaceChildren(...args){this.children=args}
  setAttribute(name,value){this.attrs[name]=String(value)}
  addEventListener(name,fn){this.events[name]=fn}
  click(){this.events.click?.()}
  remove(){this.isConnected=false}
  removeAttribute(name){delete this.attrs[name]}
  getContext(){return null}
  load(){}
 }
 const doc={createElement:name=>new Node(name),body:new Node('body')};
 const url=new URL('https://biglwa.com/studio');
 const calls=[];
 const context={window:{},document:doc,location:url,console,URL,URLSearchParams,
  Blob,Date,Math,Number,encodeURIComponent,decodeURIComponent,
  setTimeout,clearTimeout,
  fetch:async(address,options)=>{
   calls.push({url:String(address),method:options?.method||'GET'});
   return responseFor(String(address),options?.method||'GET');
  }};
 vm.runInNewContext(src,context,{timeout:2000});
 return {api:context.window.BigLWALinkTools,nodes,calls,doc};
}
const response=(type='video/mp4',body)=>({
 ok:true,status:200,
 headers:{get:key=>(key.toLowerCase()==='content-type'?type:key.toLowerCase()==='content-length'?'3145728':null)},
 json:async()=>body||{}
});
const tick=()=>new Promise(resolve=>setImmediate(resolve));

test('only HTTP(S) links enter inspector; protected platform pages are not arbitrary files',()=>{
 const {api}=setup(()=>response());
 assert.equal(api.parse('what is free adobe'),null);
 assert.equal(api.parse('javascript:alert(1)'),null);
 assert.equal(api.parse('http://example.org/watch.mp4'),null);
 assert.equal(api.parse('https://user:pass@example.com/clip.mp4'),null);
 assert.equal(api.parse('Download https://biglwa.com/media/clip.mp4!').href,'https://biglwa.com/media/clip.mp4');
 assert.equal(api.classify(new URL('https://www.youtube.com/watch?v=123')).kind,'stream');
 assert.equal(api.classify(new URL('https://tiktok.com/@creator/video/123')).kind,'stream');
 assert.equal(api.classify(new URL('https://biglwa.com/video.mp4')).kind,'video');
 assert.equal(api.classify(new URL('https://biglwa.com/a.pdf')).kind,'document');
 assert.equal(api.classify(new URL('https://biglwa.com/c.media.json')).kind,'manifest');
 assert.equal(api.classify(new URL('https://biglwa.com/invalid%ZZ.mp4')).kind,'video');
});

test('direct first-party videos expose actual original, resolution probe, preview and file info',async()=>{
 const {api,calls,doc}=setup(()=>response());
 const panel=doc.createElement('aside');
 assert.equal(api.renderForQuery(panel,'download https://biglwa.com/media/film.mp4'),true);
 await tick();
 const card=panel.children[0];
 assert.equal(card.attrs['aria-label'],'L’wazi link and download options');
 const controls=card.children.find(x=>x.className==='bl-link-actions');
 assert(controls.children.some(x=>x.download==='film.mp4'&&x.href==='https://biglwa.com/media/film.mp4'));
 assert(controls.children.some(x=>x.textContent==='Check video resolution'));
 assert(controls.children.some(x=>x.textContent==='Preview video'));
 assert(controls.children.some(x=>x.textContent==='File details (.json)'));
 assert.equal(calls[0].method,'HEAD');
 assert(controls.children.every(x=>!/1080p|4K/.test(x.textContent)),'No invented quality selector');
 const videoPreview=controls.children.find(x=>x.textContent==='Preview video');
 videoPreview.click();
 const preview=card.children.find(x=>x.className==='bl-link-preview');
 assert.equal(preview.hidden,false);
 assert.equal(preview.children[0].type,'video');
 assert.equal(preview.children[0].controls,true);
});

test('external streaming pages receive open/save actions but no download or video scraping',async()=>{
 const {api,doc,calls}=setup(()=>{throw Error('Unexpected fetch')});
 const panel=doc.createElement('aside');
 assert(api.renderForQuery(panel,'https://www.youtube.com/watch?v=123456789ab'));
 await tick();
 const card=panel.children[0],controls=card.children.find(x=>x.className==='bl-link-actions');
 assert.equal(calls.length,0,'No remote probe');
 assert(controls.children.some(x=>x.textContent.includes('Open original platform')));
 assert(controls.children.every(x=>!x.download),'External sites never receive HTML download attribute');
 assert(!controls.children.some(x=>/Check video resolution|Download 4K/.test(x.textContent)));
 assert.match(card.children.find(x=>x.className==='bl-link-verdict').textContent,/Streaming platform/);
});

test('same-origin quality manifest exposes only verified available video renditions, highest first',async()=>{
 const {api,doc,calls}=setup((url,method)=>{
  if(method==='GET')return response('application/json',{variants:[
   {height:1080,url:'/media/clip-1080.mp4'},
   {height:2160,url:'/media/clip-4k.mp4'},
   {height:720,url:'https://malicious.example/thirdparty.mp4'},
   {height:4320,url:'/private/no.mp4'}
  ]});
  if(url.includes('/private/no.mp4'))return response('text/html');
  return response(url.endsWith('.media.json')?'application/json':'video/mp4');
 });
 const panel=doc.createElement('aside');
 api.renderForQuery(panel,'https://biglwa.com/media/clip.media.json');
 for(let i=0;i<10;i++)await tick();
 const card=panel.children[0],variants=card.children.find(x=>x.className==='bl-link-variants');
 assert.equal(variants.children.length,2,'Only actual accessible same-origin video files are offered');
 assert.match(variants.children[0].textContent,/Download 4K/);
 assert.match(variants.children[1].textContent,/Download 1080p/);
 assert(variants.children.every(x=>x.download&&x.href.startsWith('https://biglwa.com/')));
 assert(!calls.some(call=>call.url.includes('malicious.example')),'No external manifest calls');
});

test('search entry intercepts pasted links before general AI/results and preserves query search',()=>{
 const search=read('user-search-results.js');
 assert.match(search,/window\.BigLWALinkTools\?\.renderForQuery\(current,clean\)\)return;/);
 assert.match(search,/var mathResult=window\.BigLWAMath\?\.solve\(clean\)\|\|null;/);
 assert.match(css,/body\.night-mode #bl-studio-search-results \.bl-link-inspector/);
 assert.match(css,/body\.dark-mode #bl-studio-search-results \.bl-link-inspector/);
 assert.match(css,/\.bl-link-preview\[hidden\]\{display:none!important\}/);
 for(const path of ['index.html','studio/index.html','404.html','live-studio-shell.html']){
  const html=read(path);
  assert.match(html,/lwazi-link-tools-20261114\.js\?v=20261114-link-inspector-v1/,path);
  assert.match(html,/lwazi-link-tools-20261114\.css\?v=20261114-link-inspector-v1/,path);
  assert(html.indexOf('lwazi-link-tools-20261114.js')<html.indexOf('user-search-results.js'),path+' loads inspector first');
 }
});
