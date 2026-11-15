// Orbit visual enhancement regression: atmospheric layer only, no OAuth or card layout changes.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
const read=path=>readFileSync(new URL('./'+path,import.meta.url),'utf8');
const js=read('orbit-space-20261114.js');
const css=read('orbit-space-20261114.css');

test('all Studio shells include the cosmic assets once, after planet controls',()=>{
 for(const path of ['index.html','studio/index.html','404.html','live-studio-shell.html']){
  const source=read(path);
  assert.equal((source.match(/orbit-space-20261114\.js\?v=/g)||[]).length,1,path);
  assert.equal((source.match(/orbit-space-20261114\.css\?v=/g)||[]).length,1,path);
  assert(source.indexOf('orbit-preview-eight-20261016.js')<source.indexOf('orbit-space-20261114.js'),path);
 }
});
test('scope keeps the original planet grid, connect buttons and dark cosmic page',()=>{
 assert.match(css,/#studioApp #orbit #orbitGrid>button\[data-orbit-app\]>\.orbit-glyph/);
 assert.match(css,/#studioApp #moduleWorkspace\[data-module-key="orbit"\]/);
 assert.match(css, /prefers-reduced-motion:reduce/);
 assert.match(js,/document\.hidden/);
 assert.match(js,/IntersectionObserver/);
 assert.match(js,/ResizeObserver/);
 assert.doesNotMatch(js,/fetch\(|XMLHttpRequest|import\(|\.connect\(|localStorage|sessionStorage/);
 assert.match(read('orbit-preview-eight-20261016.css'),/grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
 assert.match(read('orbit-cards-unified-20261016.css'),/height:140px!important/);
});

function fakeTarget(){
 const attached=[],events={},children=[];
 const ctx={setTransform(){},clearRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},fill(){},arc(){}};
 return {
  isConnected:true,events,children,
  getBoundingClientRect:()=>({width:460,height:310}),
  getClientRects:()=>[{}],
  addEventListener:(key,cb)=>{events[key]=cb},
  insertBefore:(child)=>{attached.push(child);children.unshift(child)},
  get attached(){return attached}
 };
}
function harness(reducedMotion){
 const widget=fakeTarget(),page=fakeTarget(),scheduled=[];
 const doc={
  readyState:'complete',hidden:false,documentElement:{},
  querySelector:q=>q.includes('moduleWorkspace')?page:q.includes('#orbit')?widget:null,
  addEventListener(){}
 };
 const win={
  devicePixelRatio:1,
  matchMedia:()=>({matches:reducedMotion,addEventListener(){}}),
  addEventListener(){}
 };
 const fakeCanvas=()=>({
  className:'',width:0,height:0,
  setAttribute(k,v){this[k]=v},
  getContext:()=>({setTransform(){},clearRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},fill(){},arc(){}})
 });
 doc.createElement=tag=>{assert.equal(tag,'canvas');return fakeCanvas()};
 const sandbox={
  document:doc,window:win,
  MutationObserver:class{observe(){}},
  Math,console,
  requestAnimationFrame:cb=>{scheduled.push(cb);return scheduled.length},
  cancelAnimationFrame:()=>{}
 };
 vm.runInNewContext(js,sandbox,{timeout:2000});
 return {widget,page,win,scheduled};
}
test('static reduced-motion stars mount once, never insert controls',()=>{
 const env=harness(true);
 assert.equal(env.scheduled.length,1);
 env.scheduled.shift()(10);
 assert.equal(env.widget.attached.length,1);
 assert.equal(env.page.attached.length,1);
 assert.equal(env.widget.attached[0].className,'orbit-space-canvas');
 assert.equal(env.widget.attached[0]['aria-hidden'],'true');
 assert.equal(env.scheduled.length,0,'Reduced-motion mode has no continuing animation loop');
 assert.equal(typeof env.win.BigLWAOrbitSpace.refresh,'function');
 env.win.BigLWAOrbitSpace.refresh();
 assert.equal(env.scheduled.length,1);
 env.scheduled.shift()(30);
 assert.equal(env.widget.attached.length,1,'One canvas per card even after module refresh');
});
test('normal motion animates its own canvases without touching connection handlers',()=>{
 const env=harness(false);
 env.scheduled.shift()(10); // mount canvases
 assert.equal(env.widget.attached.length,1);
 assert.equal(env.page.attached.length,1);
 assert.equal(env.scheduled.length,1,'One shared render loop for both canvases');
 env.scheduled.shift()(50);
 assert.equal(env.scheduled.length,1,'Animation continues when visible');
 assert.equal(typeof env.widget.events.pointerenter,'function');
 assert.equal(typeof env.widget.events.pointerleave,'function');
 env.widget.events.pointerenter();env.widget.events.pointerleave();
});
