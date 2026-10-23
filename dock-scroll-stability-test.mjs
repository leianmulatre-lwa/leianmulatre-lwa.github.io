import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script,createContext} from 'node:vm';

const read=p=>readFileSync(new URL('./'+p,import.meta.url),'utf8');
const ui=read('ui-coherence.js');
const css=read('studio-alignment-20261020.css');
const home=read('index.html');
const start=ui.indexOf('  function synchronizeWidgetDockAnchor(){');
const end=ui.indexOf('  function run(){',start);
assert.ok(start>0&&end>start,'Canonical Studio dock anchor function exists');
const props=new Map(),listeners=[];
const app={dataset:{},style:{
  getPropertyValue:key=>props.get(key)||'',
  setProperty:(key,val)=>props.set(key,val)
}};
const header={height:64,offsetHeight:64,getBoundingClientRect(){return{height:this.height,bottom:this.height}}};
let observer;
const context=createContext({
  $:selector=>selector==='#studioApp'?app:selector==='.topbar'?header:null,
  window:{innerHeight:800,addEventListener:(event,callback)=>listeners.push([event,callback])},
  ResizeObserver:class{constructor(callback){this.callback=callback;observer=this}observe(target){assert.equal(target,header)}},
  console
});
new Script(ui.slice(start,end)+'\nthis.synchronizeWidgetDockAnchor=synchronizeWidgetDockAnchor;').runInContext(context);
context.synchronizeWidgetDockAnchor();
assert.equal(props.get('--biglwa-dock-top'),'64px','Dock starts precisely at live topbar height');
assert.deepEqual(listeners.map(([name])=>name),['resize'],'Dock follows only header resize; scroll bounce cannot move it');
header.height=78;header.offsetHeight=78;observer.callback();
assert.equal(props.get('--biglwa-dock-top'),'78px','Dock follows header resizing');
context.synchronizeWidgetDockAnchor();
assert.equal(listeners.length,1,'Repeated startup cannot multiply header resize handlers');
assert.match(css,/#studioApp \.topbar\{position:fixed!important;top:0!important;left:0!important;/,'Topbar is fixed to screen alongside sidebar, not sticky in page flow');
assert.match(css,/html,body\{overscroll-behavior-y:none\}/,'Elastic overscroll cannot drag site chrome apart');
assert.ok(!ui.includes("window.addEventListener('scroll',sync"),'Scroll does not change header-to-dock offset');
assert.match(css,/#studioApp \.sidebar\s*\{[^}]*position:fixed!important;[^}]*top:var\(--biglwa-dock-top,64px\)!important;/s,'The dock shares the measured header offset');
assert.match(css,/#studioApp \.sidebar \.sidebar-top\s*\{[^}]*overflow-y:auto!important;[^}]*overflow-x:hidden!important;/s,'Only inner dock content scrolls');
assert.match(css,/#studioApp \.sidebar \.sidebar-bottom\s*\{[^}]*flex:0 0 auto!important;/s,'Theme controls stay attached to the same dock');
assert.match(css,/#studioApp #moduleWorkspace\[data-module-key="notes"\] \.module-heading h1\s*\{[^}]*font-family:"Subwaygraph"/s,'Sqwidz module heading matches its widget font');
assert.match(css,/@font-face\{font-family:'Subwaygraph'/,'Subwaygraph font registered');
assert.ok(home.includes('/ui-coherence.js?v=20261022-followers-detail-5')&&home.includes('/studio-alignment-20261020.css?v=layout-fixed-header-19'),'Both updated files are on the current site build');
console.log('PASS: dock header offset remains stable after resize and repeated initialization; Sqwidz title uses Subwaygraph; both assets are loaded');
