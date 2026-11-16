import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const {JSDOM}=createRequire(import.meta.url)('jsdom');
const read=p=>readFileSync(new URL('./'+p,import.meta.url),'utf8');
const js=read('map-purposes-20261115.js');
const css=read('map-purposes-20261115.css');
function fixture(preview=false){
 const dom=new JSDOM('<!doctype html><html><body>'+
  '<div class="map-side"><div class="map-brand-strip"></div></div>'+
  '<div id="mapTripPlanner"></div>'+
  '<button id="mapTabplan"></button><button id="mapTabnearby"></button><button id="mapTabsaved"></button>'+
  '</body></html>',{url:'https://biglwa.com/map-app.html?embed=1'+(preview?'&preview=1':''),
   pretendToBeVisual:true,runScripts:'outside-only'});
 const {window:w}=dom,events=[];
 for(const id of ['plan','nearby','saved']){
  w.document.getElementById('mapTab'+id).addEventListener('click',()=>events.push(id));
 }
 w.eval(js);
 return {w,dom,events};
}
test('Map mode rail navigates existing Plan, Places and Saved without replacing them',()=>{
 const {w,dom,events}=fixture();
 const node=w.document.querySelector('#mapPurposeRail');
 assert(node);
 const buttons=[...node.querySelectorAll('[data-map-purpose]')];
 assert.deepEqual(buttons.map(x=>x.dataset.mapPurpose),['routes','places','saved','music','connections']);
 buttons[1].click();buttons[2].click();buttons[0].click();
 assert.deepEqual(events,['nearby','saved','plan']);
 assert.equal(buttons[0].getAttribute('aria-pressed'),'true');
 assert.equal(node.querySelector('#mapPurposePanel').hidden,true);
 dom.window.close();
});
test('Provider setup controls visibly distinguish API readiness from booking links',()=>{
 const {w,dom}=fixture();
 const section=w.document.querySelector('#mapPurposePanel');
 w.document.querySelector('[data-map-purpose="connections"]').click();
 assert.equal(section.hidden,false);
 assert.equal(section.querySelectorAll('.map-purpose-connection').length,3);
 assert.match(section.textContent,/Uber/);
 assert.match(section.textContent,/Spotify/);
 assert.match(section.textContent,/OAuth setup required/);
 assert.match(section.textContent,/server callback/);
 assert.equal(section.querySelectorAll('a[href="/studio?view=orbit"]').length,3);
 const ext=[...section.querySelectorAll('a[href^="https://"]')];
 assert(ext.every(x=>x.rel.includes('noopener')));
 w.document.querySelector('[data-map-purpose="music"]').click();
 assert.match(section.textContent,/college radio by state/);
 assert(section.querySelector('a[href="/studio?view=stream"]'));
 assert(!/access_token|client_secret/.test(section.innerHTML));
 dom.window.close();
});
test('Public preview disables private Map provider controls',()=>{
 const {w,dom}=fixture(true);
 assert.equal(w.BigLWAMapPurposes,undefined);
 assert.equal(w.document.querySelector('#mapPurposeRail'),null);
 dom.window.close();
});
test('Map route and source modules stay connected; no live quotes or unauthorized OAuth fetches',()=>{
 const map=read('map-app.html');
 assert.equal(map.split('/map-purposes-20261115.js?v=').length-1,1);
 assert.equal(map.split('/map-purposes-20261115.css?v=').length-1,1);
 assert(map.indexOf('map-transport-hub-20261114.js')<map.indexOf('map-purposes-20261115.js'));
 assert(!/\bfetch\s*\(/.test(js),'Map provider entrypoints cannot secretly request tokens');
 assert.match(css,/\.map-purpose-connections/);
});
test('Public home links to unique crawlable guides rather than only authentication',()=>{
 const home=read('index.html'),sitemap=read('sitemap.xml');
 assert.match(home,/<meta name="twitter:title"/);
 assert.match(home,/<meta name="twitter:description"/);
 assert.match(home,/login-explore-intro/);
 assert.match(home,/Discover the platform/);
 for(const p of ['discover','online-games','fare-checker','live-shows','free-knowledge','free-tools']){
  assert(home.includes('href=\\"/'+p+'/'),p+' link must be visible in homepage markup');
  assert(sitemap.includes('https://biglwa.com/'+p+'/'),p+' indexed guide');
 }
 assert.match(home,/<link rel="canonical" href="https:\/\/biglwa.com\/">/);
});
