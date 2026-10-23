import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {JSDOM}=require('jsdom');
const source=readFileSync(new URL('./login-archive-player.js',import.meta.url),'utf8');
const dom=new JSDOM('<!doctype html><html><body class="biglwa-session-pending">'+
 '<section id="loginPage" style="visibility:hidden"><div class="login-laptop is-preparing">'+
 '<div class="login-screen-video"><video id="loginArchiveVideo" muted></video>'+
 '<div class="login-screen-loading">biglwa · loading your studio</div></div>'+
 '<span class="login-archive-credit"></span><button id="loginVolumeToggle"></button>'+
 '</div></section></body></html>',{url:'https://biglwa.com/',pretendToBeVisual:true,runScripts:'outside-only'});
const w=dom.window,doc=w.document,video=doc.getElementById('loginArchiveVideo');
let loads=0,plays=0;
video.load=()=>{loads++};
video.play=()=>{plays++;return Promise.resolve()};
Object.defineProperty(video,'readyState',{get:()=>3});
w.eval(source);
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const laptop=doc.querySelector('.login-laptop');
assert.equal(loads,0,'No network video is requested before login is revealed');
await wait(35);
assert.equal(laptop.classList.contains('is-preparing'),true);
assert.equal(loads,0);
doc.body.classList.remove('biglwa-session-pending');
doc.getElementById('loginPage').style.visibility='visible';
await wait(1950);
assert.equal(loads,1,'One cartoon selection starts loading near the end of the intro');
assert.equal(laptop.classList.contains('is-preparing'),true,'Opening preview remains for at least a couple seconds');
await wait(850);
assert.equal(laptop.classList.contains('is-preparing'),false,'Login laptop reveals programming after loading interval');
assert.equal(loads,1,'No duplicate first cartoon source or conflicting video loaders');
assert.match(video.src,/archive.org\/download\/BettyBoopCartoons/);
assert.equal(plays,1,'Playback begins on the same original video');
w.close();
console.log('PASS laptop preview: private initial curtain, 2.6s single loader, one playable cartoon after intro.');
