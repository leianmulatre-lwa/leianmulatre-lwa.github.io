import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{JSDOM}=require('jsdom');
const read=p=>readFileSync(new URL('./'+p,import.meta.url),'utf8');
const stream=read('stream-guide.js'),css=read('stream-guide.css');
const profile=read('account-chrome.js'),fallback=read('tv-no-signal-fallback.js');
const shared=read('ui-coherence.js'),alignment=read('studio-alignment-20261020.css');
const signal=read('assets/tv-no-signal.svg');
assert.match(signal,/data:image\/png;base64,/,'Supplied picture embedded directly in SVG asset');
assert.match(profile,/lwa-default-tv-avatar/,'Profile and top-right use a single fallback');
assert.match(shared,/lwa-default-tv-avatar/,'Legacy Studio avatar reset keeps same fallback');
assert.match(alignment,/#studioApp \.topbar\{position:fixed!important;/,'Fixed header remains attached to dock on overscroll');
assert.match(alignment,/\.manifesto-card\.is-skeleton-open \.biglwa-tour-actions\{/,'Skeleton key close control is out of title row');
assert.match(css,/#biglwaStreamDock/,'Stream dock is styled');
assert.match(fallback,/addEventListener\('error'/,'Media error listener installed');
const dom=new JSDOM('<!doctype html><html><head></head><body>'+
  '<div id="studioApp"><div id="stream"><div class="stream-screen"></div></div>'+
  '<div id="streamMonitor"></div></div></body></html>',{url:'https://biglwa.com/studio',
  runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window,doc=w.document;
const start=stream.indexOf(' function ensureMediaPortal(){'),stop=stream.indexOf(' let mostRecentUser=',start);
const signalStart=stream.indexOf(' function showNoSignal(){'),signalEnd=stream.indexOf(' function showSource(',signalStart);
assert.ok(start>0&&stop>start&&signalStart>stop&&signalEnd>signalStart,'Extract authentic player dock functions');
w.openBIGLWAModule=key=>{w.__openedModule=key};
const harness=`(()=>{let mediaPortal=null,mediaTarget=null,studioTarget=null,
 dockShell=null,dockTarget=null,docked=false;
 const state={selected:{title:'Test Video',url:'https://www.youtube.com/watch?v=12345678901'},followGuide:false};
 const saveLastPlayed=()=>{},onClick=()=>{},escapeHTML=x=>String(x);
 ${stream.slice(start,stop)}
 ${stream.slice(signalStart,signalEnd)}
 window.streamTest={ensureMediaPortal,dockStream,undockStream,showNoSignal,
 targetMedia,parkInStudio,get portal(){return mediaPortal},get dock(){return dockShell}};
})()`;
w.eval(harness);
const x=w.streamTest;
const portal=x.ensureMediaPortal();
const active=doc.createElement('iframe');active.src='https://www.youtube-nocookie.com/embed/12345678901';
portal.append(active);
assert.equal(x.dockStream(),true,'User can dock an active player');
assert.ok(doc.querySelector('#biglwaStreamDock'),'Mini TV exists');
assert.equal(x.portal,portal,'Dock retains one original media surface');
assert.equal(portal.querySelector('iframe'),active,'Same iframe keeps playing; not cloned');
assert.equal(x.parkInStudio(),true,'Switching widgets does not detach a docked player');
assert.equal(portal.querySelector('iframe'),active,'Docked player preserves original iframe');
assert.equal(x.undockStream(false),true,'User can return to Studio preview');
assert.equal(doc.querySelector('#studioApp #stream .stream-screen').contains(portal),true);
assert.equal(portal.querySelector('iframe'),active,'Undocking never restarts iframe by rewriting src');
assert.equal(x.dockStream(),true);
assert.equal(x.showNoSignal(),true,'User can display no signal when an embed is blocked');
assert.equal(portal.querySelector('img').getAttribute('src'),'/assets/tv-no-signal.svg');
assert.equal(portal.querySelector('[data-stream-retry]').textContent,'↻ Retry player');
assert.match(portal.textContent,/View on original site/);
w.close();
console.log('PASS: one persistent player moves into draggable mini-TV and back; media failure displays supplied bars.');
