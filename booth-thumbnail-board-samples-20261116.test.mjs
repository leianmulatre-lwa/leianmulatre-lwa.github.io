import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const {JSDOM}=createRequire(import.meta.url)('jsdom');
const read=path=>readFileSync(new URL('./'+path,import.meta.url),'utf8');
const booth=read('studio-booth-preview.js');
const board=read('pinterest-orbit.js');
const css=read('studio-uploaded-thumbnails-20261110.css');

function scene({records=[],member='member-one',samples=null}={}){
 const dom=new JSDOM('<div id="studioApp"><article id="camera"><div class="contact-sheet photobooth-reference-preview"><img src="/assets/biglwa-booth-light-20261110.webp"></div></article></div>',
  {url:'https://biglwa.com/studio',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;let rotation=null,delay=0,readCount=0,authUid=member;
 w.__biglwaIdentity={uid:member};
 w.requestAnimationFrame=()=>0;
 w.setInterval=(fn,ms)=>{rotation=fn;delay=ms;return 1};
 w.clearInterval=()=>{rotation=null};
 const actual=JSON.parse(board.match(/const studioBoardsSamples=(\[[^\]]+\]);/)?.[1]||'[]');
 w.__biglwaBoardsTemporaryPhotos=()=>samples||actual;
 const auth={get currentUser(){return authUid?{uid:authUid}:null},authStateReady:async()=>{},app:{}};
 const modules={
  'firebase-app.js':{getApps:()=>[{}]},
  'firebase-auth.js':{getAuth:()=>auth,onAuthStateChanged:()=>{}},
  'firebase-firestore.js':{
   getFirestore:()=>({}),
   collection:()=>({}),where:()=>({}),query:()=>({}),
   getDocs:async()=>{readCount++;return {docs:records.map(data=>({data:()=>data}))}}
  }
 };
 w.testImport=async u=>modules[u.split('/').pop()];
 w.HTMLCanvasElement.prototype.getContext=()=>({drawImage(){}});
 w.HTMLCanvasElement.prototype.toDataURL=()=> 'data:image/jpeg;base64,dGVzdA==';
 w.eval(booth.replaceAll('import(','window.testImport('));
 const list=()=>[...w.document.querySelectorAll('.booth-recent-frame')];
 const photos=()=>list().map(frame=>frame.querySelector('img')?.getAttribute('src')||'');
 return {w,dom,auth,list,photos,actual,refresh:()=>w.BigLWABoothPreview.refresh(),
  capture:()=>{const c=w.document.createElement('canvas');c.width=800;c.height=600;w.BigLWABoothPreview.capture(c)},
  rotate:()=>rotation?.(),get rotationDelay(){return delay},get hasTimer(){return Boolean(rotation)},
  get reads(){return readCount},setMember:id=>{authUid=id},
  close:()=>dom.window.close()};
}

test('Booth reuses exactly the same local Boards temporary photo collection',()=>{
 const array=JSON.parse(board.match(/const studioBoardsSamples=(\[[^\]]+\]);/)?.[1]||'[]');
 const fallback=JSON.parse(booth.match(/const FALLBACK_SAMPLES=Object\.freeze\((\[[^\]]+\])\);/)?.[1]||'[]');
 assert.equal(array.length,11);
 assert.deepEqual(fallback,array,'Fallback is exactly the owner-approved Boards sample collection');
 assert.match(booth,/window\.__biglwaBoardsTemporaryPhotos\?\.\(\)/);
 assert(array.every(p=>p.startsWith('/boards%20temp%20thumbnail/')&&p.endsWith('.jpg')));
 assert.doesNotMatch(booth,/localStorage\.setItem|saveExternalOrbitDraft|setDoc\(/,
  'Temporary sample thumbnails are not persisted or published');
});

test('Four empty Booth slots receive rotating samples, never four No Signal thumbnails',async()=>{
 const s=scene();await s.refresh();
 const first=s.photos();
 assert.equal(first.length,4);
 assert.equal(new Set(first).size,4,'Four distinct temporary photos fill the strip');
 assert(first.every(u=>u.startsWith('/boards%20temp%20thumbnail/')));
 assert.equal(s.list().filter(f=>f.classList.contains('booth-temporary-frame')).length,4);
 assert.equal(s.rotationDelay,6800);
 assert.equal(s.hasTimer,true);
 s.rotate();
 const second=s.photos();
 assert.equal(second.length,4);
 assert.notDeepEqual(second,first,'Filmstrip rotation must visibly replace its images');
 assert(second.every(u=>s.actual.includes(u)),'Only locally hosted Boards sample art is displayed');
 s.close();
});

test('Saved member photos and active captures take priority over samples',async()=>{
 const records=[
  {uid:'member-one',source:'photobooth',state:'draft',sourceCreatedAtMs:5,imageUrl:'https://images.example/five.jpg'},
  {uid:'member-one',source:'photobooth',state:'draft',sourceCreatedAtMs:4,imageUrl:'https://images.example/four.jpg'}
 ];
 const s=scene({records});await s.refresh();
 assert.deepEqual(s.photos().slice(0,2),['https://images.example/five.jpg','https://images.example/four.jpg']);
 assert(s.photos().slice(2).every(u=>u.includes('/boards%20temp%20thumbnail/')));
 s.capture();
 assert(s.photos()[0].startsWith('data:image/jpeg;base64,'));
 assert.deepEqual(s.photos().slice(1,3),['https://images.example/five.jpg','https://images.example/four.jpg']);
 assert(s.photos()[3].includes('/boards%20temp%20thumbnail/'));
 s.rotate();
 assert(s.photos()[0].startsWith('data:image/jpeg;base64,'),'Rotation cannot move member photos');
 s.close();
});

test('Public profile previews show only samples, even if private captures exist',async()=>{
 const records=[{uid:'member-one',source:'photobooth',state:'draft',imageUrl:'https://secret.example/private.jpg'}];
 const s=scene({records});await s.refresh();s.capture();
 assert(s.photos().some(u=>u.includes('private.jpg')));
 const before=s.reads;
 s.w.document.documentElement.classList.add('biglwa-preview-mode');
 await s.refresh();
 assert.equal(s.reads,before,'No private Firestore queries in public preview');
 assert(s.photos().every(u=>u.includes('/boards%20temp%20thumbnail/')));
 assert.equal(s.w.document.querySelector('.booth-recent-film')?.dataset.samplesOnly,'true');
 assert.match(css,/booth-recent-film:not\(\[data-samples-only="true"\]\)/);
 assert.match(css,/booth-recent-film\[data-samples-only="true"\]\s*\{display:grid!important\}/);
 s.w.document.documentElement.classList.remove('biglwa-preview-mode');
 s.setMember('member-two');await s.refresh();
 assert(s.photos().every(u=>u.includes('/boards%20temp%20thumbnail/')),
  'Account switch clears previous account photos');
 s.close();
});

test('Reduced motion holds samples, broken samples fall back safely',async()=>{
 const s=scene();await s.refresh();
 const first=s.photos();
 s.w.matchMedia=()=>({matches:true});
 s.rotate();
 assert.deepEqual(s.photos(),first,'Reduced-motion setting should stop automatic rotation');
 s.w.matchMedia=()=>({matches:false});
 const broken=s.list()[0].querySelector('img');
 broken.dispatchEvent(new s.w.Event('error'));
 assert(!s.photos().includes(first[0]),'Unavailable sample should be removed from cycle');
 assert.match(css,/grayscale\(1\) contrast\(1\.07\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/biglwa-booth-light-20261110\.webp/);
 assert.match(css,/biglwa-booth-dark-20261110\.webp/);
 s.close();
});
