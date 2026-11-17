import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('./'+path,import.meta.url),'utf8');
const booth=read('studio-booth-preview.js');
const boards=read('pinterest-orbit.js');
const css=read('studio-uploaded-thumbnails-20261110.css');
const sourceSamples=JSON.parse(boards.match(/const studioBoardsSamples=(\[[^\]]+\]);/)?.[1]||'[]');

function harness({records=[],id='person-a',photos=sourceSamples}={}){
 const window={__biglwaIdentity:{uid:id}},events={},calls={reads:0},timers={};
 let signedId=id,hidden=false;
 class Element {
  constructor(tag){
   this.tag=tag;this.className='';this.children=[];this.dataset={};
   this.attributes={};this.events={};this.parent=null;
   this.width=320;this.height=240;this.src='';this.alt='';
  }
  get classList(){
   return {add:label=>{
    const values=new Set(this.className.split(/\s+/).filter(Boolean));values.add(label);
    this.className=[...values].join(' ');
   },contains:label=>this.className.split(/\s+/).includes(label)};
  }
  append(...nodes){for(const n of nodes){n.parent=this;this.children.push(n)}}
  replaceChildren(...nodes){this.children=[];this.append(...nodes)}
  setAttribute(name,value){this.attributes[name]=String(value)}
  querySelector(selector){
   if(selector==='.booth-recent-film')
    return this.children.find(e=>e.className.split(/\s+/).includes('booth-recent-film'))||null;
   if(selector==='img')return this.children.find(e=>e.tag==='img')||null;
   return null;
  }
  addEventListener(name,fn){this.events[name]=fn}
  fire(name){this.events[name]?.({type:name})}
  getContext(){return {drawImage(){}}}
  toDataURL(){return 'data:image/jpeg;base64,dGVzdA=='}
 }
 const host=new Element('div');host.className='contact-sheet';
 const root=new Element('html');
 const document={
  readyState:'loading',
  get hidden(){return hidden},
  documentElement:root,
  createElement:tag=>new Element(tag),
  querySelector:selector=>selector==='#studioApp #camera .contact-sheet'?host:null,
  addEventListener(name,fn){events[name]=fn}
 };
 const auth={get currentUser(){return signedId?{uid:signedId}:null},authStateReady:async()=>{},app:{}};
 const mock={
  'firebase-app.js':{getApps:()=>[{}]},
  'firebase-auth.js':{getAuth:()=>auth,onAuthStateChanged:()=>{}},
  'firebase-firestore.js':{
   getFirestore:()=>({}),collection:()=>({}),where:()=>({}),query:()=>({}),
   getDocs:async()=>{calls.reads++;return {docs:records.map(p=>({data:()=>p}))}}
  }
 };
 window.__biglwaBoardsTemporaryPhotos=()=>photos.slice();
 window.addEventListener=(name,fn)=>{events[name]=fn};
 window.setInterval=(fn,ms)=>{timers.tick=fn;timers.delay=ms;return 1};
 window.clearInterval=()=>{timers.tick=null};
 window.matchMedia=()=>({matches:false});
 const context={window,document,console,MutationObserver:class{observe(){}},
  requestAnimationFrame:()=>0,setTimeout:()=>0,
  __mockImport:async url=>mock[url.split('/').pop()]};
 vm.runInNewContext(booth.replaceAll('import(','__mockImport('),context,{timeout:2000});
 const strip=()=>host.querySelector('.booth-recent-film');
 const frames=()=>strip()?.children||[];
 const preview=()=>frames().map(frame=>frame.querySelector('img')?.src||'');
 return {window,document,host,strip,frames,preview,calls,timers,
  refresh:()=>window.BigLWABoothPreview.refresh(),
  capture:()=>window.BigLWABoothPreview.capture(new Element('canvas')),
  tick:()=>timers.tick?.(),setMember:member=>{signedId=member},
  setPublic:v=>{window.__biglwaPublicStorageView=Boolean(v)},
  setReducedMotion:v=>{window.matchMedia=()=>({matches:v})},
  setHidden:v=>{hidden=v}};
}

test('Booth placeholder pool is an exact fallback copy of the existing Boards temporary collection',()=>{
 const fallback=JSON.parse(booth.match(/const FALLBACK_SAMPLES=Object\.freeze\((\[[^\]]+\])\);/)?.[1]||'[]');
 assert.equal(sourceSamples.length,11);
 assert.deepEqual(fallback,sourceSamples);
 assert(sourceSamples.every(x=>/^\/boards%20temp%20thumbnail\/[a-f0-9]{32}\.jpg$/.test(x)));
 assert.match(booth,/window\.__biglwaBoardsTemporaryPhotos\?\.\(\)/);
 assert.doesNotMatch(booth,/localStorage\.setItem|saveExternalOrbitDraft|setDoc\(/,
  'Samples are never saved to an account or uploaded');
});

test('Empty Booth filmstrip displays four distinct local sample photos and holds them through repaint',async()=>{
 const ui=harness();await ui.refresh();
 const initial=ui.preview();
 assert.equal(initial.length,4);
 assert.equal(new Set(initial).size,4);
 assert(initial.every(x=>sourceSamples.includes(x)));
 assert(ui.frames().every(f=>f.classList.contains('booth-temporary-frame')));
 assert.equal(ui.timers.delay,undefined);
 await ui.refresh();
 assert.deepEqual(ui.preview(),initial);
 assert.equal(ui.strip().dataset.sampleCount,'4');
});

test('Saved owner photos and new captures take precedence; only empty slots use samples',async()=>{
 const records=[
  {uid:'person-a',source:'photobooth',state:'draft',sourceCreatedAtMs:5,imageUrl:'https://example.org/5.jpg'},
  {uid:'person-a',source:'photobooth',state:'draft',sourceCreatedAtMs:4,imageUrl:'https://example.org/4.jpg'}
 ];
 const ui=harness({records});await ui.refresh();
 assert.deepEqual(ui.preview().slice(0,2),['https://example.org/5.jpg','https://example.org/4.jpg']);
 assert(ui.preview().slice(2).every(x=>sourceSamples.includes(x)));
 ui.capture();
 assert(ui.preview()[0].startsWith('data:image/jpeg;base64,'));
 assert.deepEqual(ui.preview().slice(1,3),['https://example.org/5.jpg','https://example.org/4.jpg']);
 const top=ui.preview().slice(0,3);
 ui.tick();
 assert.deepEqual(ui.preview().slice(0,3),top,'Rotating samples must not displace real photos');
});

test('Public profile and account switches reveal only samples, never private captures',async()=>{
 const records=[{uid:'person-a',source:'photobooth',state:'draft',sourceCreatedAtMs:1,imageUrl:'https://secret.example/private.jpg'}];
 const ui=harness({records});await ui.refresh();ui.capture();
 assert(ui.preview().some(x=>x.includes('private.jpg')));
 const before=ui.calls.reads;
 ui.setPublic(true);await ui.refresh();
 assert.equal(ui.calls.reads,before,'No Firestore private read for a visitor');
 assert(ui.preview().every(x=>sourceSamples.includes(x)));
 assert.equal(ui.strip().dataset.samplesOnly,'true');
 ui.setPublic(false);ui.setMember('person-b');await ui.refresh();
 assert(ui.preview().every(x=>sourceSamples.includes(x)),"Old member's photographs are gone");
 assert.match(css,/booth-recent-film:not\(\[data-samples-only="true"\]\)/);
 assert.match(css,/booth-recent-film\[data-samples-only="true"\]\s*\{display:grid!important\}/);
});

test('Hidden documents stay stable; failed samples are replaced',async()=>{
 const ui=harness();await ui.refresh();
 const first=ui.preview();
 ui.setReducedMotion(true);ui.tick();
 assert.deepEqual(ui.preview(),first);
 ui.setReducedMotion(false);ui.setHidden(true);ui.tick();
 assert.deepEqual(ui.preview(),first);
 ui.setHidden(false);
 const failed=ui.frames()[0].querySelector('img');
 failed.fire('error');
 assert(!ui.preview().includes(first[0]),'Broken sample must be replaced, not repeatedly shown');
 assert.match(css,/grayscale\(1\) contrast\(1\.07\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/biglwa-booth-light-20261110\.webp/);
 assert.match(css,/biglwa-booth-dark-20261110\.webp/);
});


test('Cloudflare release publishes every Boards/Booth placeholder photo, not only the scripts',()=>{
 const builder=read('build-cloudflare-pages.mjs');
 assert.match(builder,/'boards temp thumbnail'/,'Public image folder must be explicitly allowed in dist');
 for(const src of sourceSamples){
  const relative=src.replace('/boards%20temp%20thumbnail/','boards temp thumbnail/');
  assert(builder.includes("'"+relative+"'"),'Builder must verify '+relative);
 }
});

test('Both live Studio loaders cache-bust the revised artwork and Booth rotation script',()=>{
 for(const path of ['index.html','studio/index.html']){
  const s=read(path);
  assert.match(s,/studio-booth-preview\.js\?v=20261116-boards-rotation-1/);
  assert.match(s,/studio-uploaded-thumbnails-20261110\.css\?[^"']*rotation=20261116-1/);
  assert(s.indexOf('pinterest-orbit.js')<s.indexOf('studio-booth-preview.js'),
   'Boards sample pool loads before Booth');
 }
});
