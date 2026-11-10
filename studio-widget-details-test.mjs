import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const {JSDOM}=createRequire(import.meta.url)('jsdom');
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
// Model browsers that round scrollLeft assignments to integer pixels.
const dom=new JSDOM('<main id="studioApp"><article id="tools"><header class="card-head">Lwazi</header></article></main>',{url:'https://biglwa.com/studio',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window;let queued=[],scroll=0,now=100;
w.requestAnimationFrame=fn=>{queued.push(fn);return 1};
w.eval(read('studio-lwazi-thumbnail-20261026.js'));w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
const viewport=w.document.querySelector('.arcade-library-viewport'),tiles=viewport.querySelector('.arcade-track').children;
Object.defineProperty(tiles[0],'offsetLeft',{value:0});Object.defineProperty(tiles[6],'offsetLeft',{value:600});
Object.defineProperty(viewport,'scrollLeft',{get:()=>scroll,set:v=>{scroll=Math.round(v)}});
function tick(count){for(let i=0;i<count;i++){now+=1000/60;const jobs=queued;queued=[];jobs.forEach(fn=>fn(now))}}
tick(121);assert(scroll>=23&&scroll<=25,'Carousel advances at 12 pixels/sec despite integer rounding');
viewport.dispatchEvent(new w.Event('pointerenter'));const stopped=scroll;tick(60);assert.equal(scroll,stopped);
viewport.dispatchEvent(new w.Event('pointerleave'));tick(60);assert(scroll>=stopped+11,'Carousel resumes after hover');
viewport.dispatchEvent(new w.Event('pointerenter'));viewport.dispatchEvent(new w.Event('pointercancel'));const cancelled=scroll;tick(60);assert(scroll>cancelled,'Cancelled pointer cannot leave animation permanently paused');w.close();
// Real saved Booth records plus unsaved current-session captures, scoped to owner.
const b=new JSDOM('<main id="studioApp"><article id="camera"><div class="contact-sheet"><img src="curtain.webp"></div></article></main>',{url:'https://biglwa.com/studio',runScripts:'outside-only'});
const bw=b.window;bw.requestAnimationFrame=()=>0;bw.__biglwaIdentity={uid:'a'};
const auth={currentUser:{uid:'a'},authStateReady:async()=>{},app:{}};
let reads=0;const photos=Array.from({length:6},(_,i)=>({uid:'a',source:'photobooth',state:'draft',sourceCreatedAtMs:i,imageUrl:'https://example.com/'+i+'.jpg'}));
const modules={'firebase-app.js':{getApps:()=>[{}]},'firebase-auth.js':{getAuth:()=>auth,onAuthStateChanged:()=>{}},'firebase-firestore.js':{getFirestore:()=>({}),collection:(...x)=>x,where:(...x)=>x,query:(...x)=>x,getDocs:async()=>{reads++;return {docs:photos.map(data=>({data:()=>data}))}}}};
bw.testImport=async url=>modules[url.split('/').pop()];
bw.HTMLCanvasElement.prototype.getContext=()=>({drawImage(){}});bw.HTMLCanvasElement.prototype.toDataURL=()=> 'data:image/jpeg;base64,YQ==';
bw.eval(read('studio-booth-preview.js').replaceAll('import(','window.testImport('));
await new Promise(r=>setTimeout(r,20));await bw.BigLWABoothPreview.refresh();
const urls=()=>[...bw.document.querySelectorAll('.booth-recent-frame img')].map(i=>i.src);
assert.deepEqual(urls(),[5,4,3,2].map(i=>'https://example.com/'+i+'.jpg'),'Newest saved account photos appear in descending order');
const canvas=bw.document.createElement('canvas');canvas.width=800;canvas.height=600;bw.BigLWABoothPreview.capture(canvas);assert(urls()[0].startsWith('data:image/jpeg'));
const priorReads=reads;bw.document.documentElement.classList.add('biglwa-preview-mode');await bw.BigLWABoothPreview.refresh();assert.equal(urls().length,0);assert.equal(reads,priorReads,'Public visitors cannot query private Booth records');
bw.document.documentElement.classList.remove('biglwa-preview-mode');auth.currentUser={uid:'b'};await bw.BigLWABoothPreview.refresh();assert.equal(urls().length,0,'Account switch clears previous member captures and saved photos');bw.close();
// Mini-calendar dates, including month boundaries, mark actual weekend columns.
const source=read('module-pages.js');const begin=source.indexOf('  function monthKey('),end=source.indexOf('  let calendarGeneration=',begin);
const calendar=new Function(source.slice(begin,end)+';return miniCalendarMarkup();')();
const c=new JSDOM(calendar);assert.equal(c.window.document.querySelectorAll('.calendar-mini-grid .weekend').length,4);assert.equal(c.window.document.querySelectorAll('.calendar-mini-weekdays .weekend').length,2);c.window.close();
console.log('PASS slower carousel resume with integer scroll, Booth recency/account isolation, and aura weekend markup');
// A restored Facebook connection refreshes once per account/page and does not
// publish private drafts merely because Studio was reloaded.
const fb=new JSDOM('<p id="orbitPageStatus"></p>',{url:'https://biglwa.com/studio',runScripts:'outside-only'});
const fw=fb.window,imports=[];let feedRefreshes=0;
const fbAuth={currentUser:{uid:'member',getIdToken:async()=> 'test-token'},authStateReady:async()=>{}};
fw.testImport=async url=>url.endsWith('firebase-app.js')?{getApps:()=>[{}]}:{getAuth:()=>fbAuth};
fw.fetch=async url=>({ok:true,json:async()=>url.endsWith('/health')?{configured:true}:url.endsWith('/session')?{connected:true,profile:{name:'Member'}}:url.endsWith('/media')?{items:[{id:'123',sourceUrl:'https://www.facebook.com/123',thumbnailUrl:'https://example.com/fresh.jpg'}]}:{}});
fw.__biglwaOrbitPosts={saveExternalOrbitDraft:async(source,item,options)=>{imports.push({source,item,options});return {refreshed:true}}};
fw.__biglwaFeed={refresh:async()=>{feedRefreshes++}};
fw.eval(read('facebook-personal-orbit-20261016.js').replaceAll('import(','window.testImport('));
fw.document.dispatchEvent(new fw.Event('DOMContentLoaded'));await new Promise(r=>setTimeout(r,30));
assert.equal(imports.length,1);assert.equal(imports[0].options.publishToCollective,false);assert.equal(feedRefreshes,1);
fw.dispatchEvent(new fw.Event('biglwa:session-verified'));await new Promise(r=>setTimeout(r,15));assert.equal(imports.length,1);
fw.document.documentElement.classList.add('biglwa-preview-mode');fbAuth.currentUser={uid:'different',getIdToken:async()=> 'other-token'};
fw.dispatchEvent(new fw.Event('biglwa:session-verified'));await new Promise(r=>setTimeout(r,15));assert.equal(imports.length,1,'Visitor preview cannot trigger owner imports');
fw.close();console.log('PASS restored Facebook connection refreshes once, updates Feed, and preserves private drafts');
