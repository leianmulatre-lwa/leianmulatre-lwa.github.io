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

function fakeStyle(){const properties=new Map();return {setProperty(k,v){properties.set(k,v)},removeProperty(k){properties.delete(k)},getPropertyValue(k){return properties.get(k)||''}}}
function fakeTarget(){
 const attached=[],events={},children=[],portals=[];
 const rect={width:460,height:310,left:50,right:510,top:120,bottom:430};
 const ctx={setTransform(){},clearRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},fill(){},arc(){}};
 return {
  isConnected:true,events,children,portals,style:fakeStyle(),dataset:{moduleKey:'orbit'},hidden:false,
  getBoundingClientRect:()=>rect,setRect:patch=>Object.assign(rect,patch),
  getClientRects:()=>[{}],
  addEventListener:(key,cb)=>{events[key]=cb},
  insertBefore:(child)=>{attached.push(child);children.unshift(child)},
  append(child){child.parentElement=this;portals.push(child);children.push(child)},
  get attached(){return attached}
 };
}
function harness(reducedMotion){
 const widget=fakeTarget(),page=fakeTarget(),scheduled=[];
 const doc={
  readyState:'complete',hidden:false,documentElement:{addEventListener(){}},
  querySelector:q=>q.includes('moduleWorkspace')?(q.includes('data-module-key')&&page.dataset.moduleKey!=='orbit'?null:page):q.includes('#orbit')?widget:null,
  addEventListener(){}
 };
 const win={
  devicePixelRatio:1,innerHeight:900,innerWidth:1300,
  matchMedia:()=>({matches:reducedMotion,addEventListener(){}}),
  events:{},
  addEventListener(key,fn){this.events[key]=fn}
 };
 const fakeCanvas=()=>{
  const calls=[];
  const ctx={calls,fillStyle:'',setTransform(){},clearRect(){},beginPath(){},moveTo(){},
    lineTo(){},stroke(){},fill(){calls.push(this.fillStyle)},arc(){}};
  return {
    className:'',width:0,height:0,isConnected:true,ctx,remove(){this.isConnected=false;},
    setAttribute(k,v){this[k]=v},getContext:()=>ctx
  };
 };
 doc.createElement=tag=>{if(tag==='div')return {style:fakeStyle(),setAttribute(k,v){this[k]=v},remove(){this.parentElement=null}};assert.equal(tag,'canvas');return fakeCanvas()};
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


test('lavender glass reveals the starfield and keeps status and app text legible',()=>{
 for(const path of ['index.html','studio/index.html','404.html','live-studio-shell.html'])
  assert.match(read(path),/orbit-space-20261114\.css\?v=20261114-visible-thumbnail-6/);
 assert.match(css,/background:rgba\(35,24,62,\.37\)!important/,'full Orbit pane is translucent instead of ivory');
 assert.match(css,/background:rgba\(90,65,128,\.22\)!important/,'app connection cards reveal space');
 assert.match(css,/\.orbit-quick-link\{\s*background:rgba\(151,123,191,\.19\)!important/);
 assert.match(css,/\.orbit-main>:is\(\.orbit-not-connected,\.orbit-link-summary\)\{/);
 assert.match(css,/\.orbit-main \.orbit-connected-card\{/);
 assert.match(css,/\.module-orbit-row\[data-orbit-row\]>header>b\{/);
 assert.match(css,/\.orbit-state\.is-on\{/);
 assert.match(css,/\.module-orbit-row \.orbit-platform-badge\{/,'provider planets keep original animated badges');
 assert.doesNotMatch(css,/background:rgba\(255,249,243,\.90\)/,'no opaque ivory full-page overlay');
});


test('Star density and mouse position affect only the canvas (not the buttons)',()=>{
 assert.match(js,/\['#studioApp #orbit','widget',260\]/);
 assert.match(js,/\['#studioApp #moduleWorkspace\[data-module-key="orbit"\]','page',500\]/);
 assert.match(js,/cursorTargetX/);
 assert.match(js,/cursorTargetY/);
 assert.match(js,/layer\.cursorMotion/);
 const env=harness(false);
 env.scheduled.shift()(10);
 assert.equal(typeof env.widget.events.pointermove,'function');
 assert.equal(typeof env.widget.events.pointerleave,'function');
 env.widget.events.pointermove({pointerType:'mouse',clientX:400,clientY:145});
 env.scheduled.shift()(60);
 assert.equal(env.widget.attached.length,1,'Pointer effects never add another DOM layer');
 env.widget.events.pointerleave();
 env.scheduled.shift()(100);
 assert.equal(env.widget.attached.length,1);
});
test('Orbit canvas disappears before a different module renders, and never reserves document height',()=>{
 assert.match(css,/#studioApp #moduleWorkspace>\.orbit-space-canvas\{/);
 assert.match(css,/position:absolute!important;inset:0!important/);
 assert.match(css,/display:none!important;width:100%!important;height:100%!important/);
 assert.match(css,/#studioApp #moduleWorkspace\[data-module-key="orbit"\]:not\(\[hidden\]\)>\.orbit-space-canvas/);
 assert.match(js,/function detachPage\(\)/);
 assert.match(js,/attributes:true,attributeFilter:\['data-module-key','hidden'\]/);
 const pages=read('module-pages.js');
 assert.match(pages,/if\(activeModuleKey==='orbit'&&key!=='orbit'\)window\.BigLWAOrbitSpace\?\.detachPage\?\.\(\)/);
 assert.match(pages,/if\(activeModuleKey==='orbit'\)window\.BigLWAOrbitSpace\?\.detachPage\?\.\(\)/);
 const env=harness(true);
 env.scheduled.shift()(10);
 const oldCanvas=env.page.attached[0];
 assert.equal(oldCanvas.isConnected,true);
 // The real Studio changes data-module-key on one reusable workspace.
 env.page.dataset.moduleKey='games';
 env.win.BigLWAOrbitSpace.refresh();
 env.scheduled.shift()(60);
 assert.equal(oldCanvas.isConnected,false,'Old Orbit backing bitmap removed');
 assert.equal(env.page.attached.length,1,'No new canvas mounted on the Games page');
 env.page.dataset.moduleKey='orbit';
 env.win.BigLWAOrbitSpace.refresh();
 env.scheduled.shift()(90);
 assert.equal(env.page.attached.length,2,'Returning to Orbit re-creates a fresh canvas');
 env.win.BigLWAOrbitSpace.detachPage();
 assert.equal(env.page.attached.at(-1).isConnected,false,'Immediate route cleanup works');
 for(const path of ['index.html','studio/index.html','404.html','live-studio-shell.html']){
  const html=read(path);
  assert.match(html,/orbit-space-20261114\.js\?v=20261114-visible-thumbnail-6/);
  assert.match(html,/orbit-space-20261114\.css\?v=20261114-visible-thumbnail-6/);
  assert.match(html,/&orbitcleanup=20261114-2/);
 }
});

test('bright Orbit stars survive Studio replacing the same card contents',()=>{
 assert.match(css,/background-size:59px 67px,97px 83px,131px 113px/);
 assert.match(js,/star\.alpha=\.68\+rand\(\)\*\.32/);
 assert.match(js,/ctx\.arc\(nx,ny,radius\*2\.6/);
 const env=harness(true);
 env.scheduled.shift()(10);
 const canvas=env.widget.attached[0];
 canvas.isConnected=false; // Studio kept #orbit but replaced its children.
 env.win.BigLWAOrbitSpace.refresh();
 env.scheduled.shift()(40);
 assert.equal(env.widget.attached.at(-1),canvas,'Reuse the existing 2D canvas');
 assert.equal(env.widget.attached.length,2,'Reattach rather than spawning another star layer');
 assert.equal(canvas.isConnected,false,'Fake DOM models detachment; real insertBefore reconnects it');
});

test('Studio Orbit thumbnail paints twinkling stars AND a decelerating launch warp',()=>{
 assert.match(css,/#studioApp #orbit::before,/,'Studio card has an animated fallback sky');
 assert.match(css,/animation:biglwa-orbit-twinkle-a 3\.7s/);
 assert.match(css,/animation:biglwa-orbit-twinkle-b 5\.3s/);
 assert.match(js,/seedTwinkle\(kind==='widget'\?80:130\)/,'Widget gets its own stars, not only page');
 assert.match(js,/Math\.pow\(\.5,layer\.elapsed\*1\.5\)\*8/,'Space-warp opening burst decelerates');
 assert.match(js,/star\.phase\+=dt\*star\.rate/,'Independent star phases update every frame');
 const env=harness(false);
 env.scheduled.shift()(10);
 const canvas=env.widget.attached[0];
 const ctx=canvas.ctx;
 assert(ctx.calls.length>100,'Widget draws visible particles at mounting');
 const before=ctx.calls.slice(0,25);
 env.scheduled.shift()(50);
 const after=ctx.calls.slice(-ctx.calls.length+before.length,-ctx.calls.length+before.length+25);
 const count=ctx.calls.length;
 env.scheduled.shift()(450);
 assert(ctx.calls.length>count,'Studio thumbnail keeps rendering over time');
 assert.equal(typeof env.widget.events.pointerenter,'function');
 env.widget.events.pointerenter();
 env.scheduled.shift()(850);
 assert(ctx.calls.length>count+200,'Hover produces a new rendered star-warp frame');
 assert(ctx.calls.some(color=>/^rgba\(/.test(color)),'Canvas uses visible rgba star colors');
});

test('both Orbit surfaces use the same cursor-steered camera, not hover speed-up',()=>{
 assert.match(js,/const speed=dt\*\.20\*Math\.min\(warp,12\)/);
 assert.match(js,/const parallaxX=-layer\.cursorX\*w\*\.22/);
 assert.match(js,/const parallaxY=-layer\.cursorY\*h\*\.22/);
 assert.match(js,/const length=Math\.min\(/,'Warp trails visibly stretch and then decay');
 assert.match(js,/ctx\.moveTo\(tx,ty\);ctx\.lineTo\(nx,ny\)/);
 assert.match(css,/var\(--orbit-cursor-x, 0\)/);
 assert.match(css,/var\(--orbit-cursor-y, 0\)/);
 assert.doesNotMatch(js,/pointerBurst\*6|const accelerated=layer\.hover/);
 const env=harness(false);
 env.scheduled.shift()(10);
 env.widget.events.pointermove({pointerType:'mouse',clientX:400,clientY:145});
 env.page.events.pointermove({pointerType:'mouse',clientX:400,clientY:145});
 env.scheduled.shift()(65);
 assert.equal(env.widget.attached.length,1);
 assert.equal(env.page.attached.length,1);
});

test('visible Studio Orbit animation outranks decorative dots and keeps planets clickable',()=>{
 const canvasRule=css.indexOf('#studioApp #orbit>.orbit-space-canvas,');
 const cssLayer=css.slice(canvasRule,canvasRule+780);
 assert.match(cssLayer,/z-index:2!important/,'Canvas must not sit underneath decorative stars');
 assert.match(css,/#studioApp #orbit>:not\(\.orbit-space-canvas\),[\s\S]*?z-index:3/);
 assert.match(css,/#studioApp article#orbit>\.orbit-space-canvas\{[\s\S]*?pointer-events:none!important/);
 assert.match(css,/@keyframes biglwa-orbit-twinkle-a\{[\s\S]*?translate3d\(/);
 const env=harness(false);
 env.scheduled.shift()(10);
 const bitmap=env.widget.attached[0].ctx;
 const count=bitmap.calls.length;
 env.scheduled.shift()(50);
 assert(bitmap.calls.length>count,'Visible Studio card paints actual new frame');
 assert.equal(env.widget.dataset.orbitSpaceMounted,'true');
 assert.equal(env.widget.attached.length,1,'Canvas remains separate from eight app buttons');
});

test('Orbit uses actual viewport geometry and wakes when scrolled back',()=>{
 assert.match(js,/return isInViewport\(layer\.target\)/);
 assert.match(js,/window\.addEventListener\('scroll',wake/);
 const env=harness(false);
 env.scheduled.shift()(10);
 env.scheduled.shift()(50);
 env.widget.setRect({top:1200,bottom:1510});
 env.page.setRect({top:1200,bottom:1510});
 env.scheduled.shift()(90);
 assert.equal(env.scheduled.length,0,'Animation stops rendering off-screen cards');
 env.widget.setRect({top:150,bottom:460});
 env.page.setRect({top:250,bottom:560});
 // Trigger the real window scroll listener through the VM harness.
 env.win.events.scroll?.();
 assert.equal(env.scheduled.length,1,'Returning card restarts requestAnimationFrame');
 const before=env.widget.attached[0].ctx.calls.length;
 env.scheduled.shift()(170);
 assert(env.widget.attached[0].ctx.calls.length>before);
});

test('Orbit portal is a separate square tile layer with a fading pointer opening',()=>{
 const env=harness(false);env.scheduled.shift()(10);
 const portal=env.widget.portals[0];
 assert.equal(portal.className,'orbit-portal-tiles');
 assert.equal(portal.style.getPropertyValue('--orbit-tile'),'230px');
 env.widget.events.pointermove({pointerType:'mouse',clientX:400,clientY:145});
 env.scheduled.shift()(60);
 assert.match(portal.style.getPropertyValue('mask-image'),/radial-gradient/);
 env.widget.events.pointerleave();
 env.scheduled.shift()(950);
 assert.equal(portal.style.getPropertyValue('mask-image'),'');
});
