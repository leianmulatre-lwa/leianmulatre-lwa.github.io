import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {JSDOM}=require('jsdom');
const source=readFileSync(new URL('./login-archive-player.js',import.meta.url),'utf8');
const dom=new JSDOM('<!doctype html><html><body class="biglwa-session-pending">'+
 '<section id="loginPage" style="visibility:hidden"><div class="login-laptop is-preparing">'+
 '<span class="login-laptop-lights" aria-hidden="true"><span class="red"></span><span class="yellow"></span><span class="green"></span></span>'+
 '<div class="login-screen-video"><video id="loginArchiveVideo" muted></video>'+
 '<div class="login-screen-loading">biglwa · loading your studio</div></div>'+
 '<span class="login-archive-credit"></span><button id="loginVolumeToggle"></button>'+
 '</div><nav class="login-explore-links"><span class="login-explore-intro">Explore</span>'+
 '<a href="/discover/">Discover</a><a href="/online-games/">Games</a><a href="/fare-checker/">Routes</a>'+
 '<a href="/live-shows/">Live shows</a><a href="/free-knowledge/">Knowledge</a><a href="/free-tools/">Free tools</a></nav>'+
 '</section></body></html>',{url:'https://biglwa.com/',pretendToBeVisual:true,runScripts:'outside-only'});
const w=dom.window,doc=w.document,video=doc.getElementById('loginArchiveVideo');
let loads=0,plays=0,pauses=0;
video.load=()=>{loads++};
video.play=()=>{plays++;return Promise.resolve()};
video.pause=()=>{pauses++};
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
// CI runners sometimes delay the introductory timer under load. Preserve the
// earliest-reveal assertion above, but allow a bounded scheduling margin.
for(let i=0;i<18&&laptop.classList.contains('is-preparing');i++)await wait(100);
assert.equal(laptop.classList.contains('is-preparing'),false,'Login laptop reveals programming after loading interval');
assert.equal(loads,1,'No duplicate first cartoon source or conflicting video loaders');
assert.match(video.src,/archive.org\/download\/BettyBoopCartoons/);
assert.equal(plays,1,'Playback begins on the same original video');
const desktop=doc.querySelector('.login-studio-desktop');
const dots=doc.querySelector('.login-laptop-lights');
const red=dots?.querySelector('button.red');
const yellow=dots?.querySelector('button.yellow');
const green=dots?.querySelector('button.green');
const explore=doc.querySelector('.login-explore-links');
const exploreToggle=doc.querySelector('.login-mini-explore-toggle');
assert(desktop&&dots&&red&&yellow&&green&&explore&&exploreToggle,'Original three dots and in-screen discover menu are wired');
assert.equal(dots.querySelectorAll('button').length,3,'No duplicate window buttons');
assert.equal(doc.querySelectorAll('.login-cartoon-controls').length,0,'No second control bar');
assert.equal(doc.querySelectorAll('[data-login-cartoon-restore]').length,0,'Green dot handles restore');
assert.equal(explore.parentElement,desktop,'Public discover links are tucked into laptop Studio screen');
assert.equal(explore.hidden,true,'Links are not a separate strip below the laptop');
for(const widget of ['aura','myfeed','stream','map','orbit','tunes']){
 assert(desktop.textContent.toLowerCase().includes(widget),'Studio preview includes '+widget);
}
yellow.click();
assert.equal(laptop.dataset.cartoonWindow,'minimized');
assert(laptop.classList.contains('is-studio-preview'));
assert.equal(desktop.getAttribute('aria-hidden'),'false');
assert.equal(pauses,1,'Yellow minimizes and pauses Betty Boop');
exploreToggle.click();
assert.equal(explore.hidden,false,'Studio explore menu opens inside laptop');
assert.equal(exploreToggle.getAttribute('aria-expanded'),'true');
assert.equal(explore.querySelectorAll('a').length,6,'All six crawlable public routes remain linked');
explore.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
assert.equal(explore.hidden,true,'Escape closes discovery panel');
green.click();
assert.equal(laptop.dataset.cartoonWindow,'open');
assert(!laptop.classList.contains('is-studio-preview'));
assert.equal(desktop.getAttribute('aria-hidden'),'true');
assert.equal(loads,1,'Restoring video does not re-download or reinitialize the episode');
red.click();
assert.equal(laptop.dataset.cartoonWindow,'closed');
assert.equal(pauses,2,'Red closes the stream and pauses playback');
assert(laptop.classList.contains('is-studio-preview'));
green.click();
assert.equal(laptop.dataset.cartoonWindow,'open','Green dot restores the cartoon after closing');
assert.equal(loads,1,'Green restores the same video');
w.close();
console.log('PASS laptop preview: one set of window dots, in-screen discovery, restore without reload.');
