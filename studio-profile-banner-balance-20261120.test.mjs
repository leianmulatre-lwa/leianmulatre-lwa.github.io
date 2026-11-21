import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import vm from 'node:vm';

const read=path=>readFileSync(new URL('./'+path,import.meta.url),'utf8');
const css=read('studio-profile-banner-balance-20261120.css');
const shells=['index.html','studio/index.html','404.html','live-studio-shell.html'];

test('weekly mood is absent from nonediting profile, without deleting account data',()=>{
  assert.match(css,/\.hero:has\(>\.profile-card:not\(\.profile-is-editing\)\) #weeklyMoodCard/);
  assert.match(css,/display:none!important/);
  assert.doesNotMatch(css,/localStorage|setDoc|removeChild|replaceChildren/);
});

test('the banner and independent scoreboard share a 246px first row, lower widgets retain 206px',()=>{
  assert.match(css,/grid-template-rows:246px 206px auto!important/);
  assert.match(css,/>\.profile-card:not\(\.profile-is-editing\) \{\s*height:246px!important;min-height:246px!important;max-height:246px!important/);
  assert.match(css,/\.profile-card:not\(\.profile-is-editing\) \.biglwa-profile-scoreboard \{\s*height:246px!important/);
  assert.match(css,/grid-column:1\/-1!important;grid-row:3!important/);
});

test('loading globe and block sprites are reused, with accessible reduced motion',()=>{
  const loading=read('studio-loading-pixel-20261029.js');
  for(const asset of ['loading-globe-pixel-20261029.png','loading-blocks-pixel-20261029.png']){
    assert(existsSync(new URL('./assets/'+asset,import.meta.url)),asset+' exists');
    assert(loading.includes('/assets/'+asset),asset+' is the live loading-screen asset');
    assert(css.includes('/assets/'+asset),asset+' is reused for the scoreboard');
  }
  assert.match(css,/@keyframes biglwa-score-pixel-float/);
  assert.match(css,/@media \(prefers-reduced-motion:reduce\)/);
  assert.match(css,/pointer-events:none;user-select:none/);
});

test('center scoreboard emblem is the animated pixel blocks, not stitched LWA text',()=>{
  const existing=read('profile-scoreboard-compact-20261118.css');
  assert.match(css,/\.biglwa-profile-scoreboard>\.stats\.stats::after \{\s*content:""!important/);
  assert.match(css,/background:transparent url\("\/assets\/loading-blocks-pixel-20261029\.png"\)/);
  assert.match(css,/\.biglwa-profile-scoreboard::after \{\s*display:none!important/);
  assert.match(css,/\.biglwa-scoreboard-header::before \{\s*content:"★"!important/);
  assert.match(existing,/font-family:"BIGLWA Alarm Clock"/);
});

test('shortcut rail fills the masonry width and bottom widgets keep original height',()=>{
  assert.match(css,/\.hero:has\(>\.profile-card:not\(\.profile-is-editing\) \.biglwa-profile-scoreboard\)\s*>\.mobile-dock\.hero-action-bar \{[\s\S]*?width:100%!important/);
  assert.match(css,/--studio-upper-card-height:206px!important/);
  assert.doesNotMatch(css,/width:min\(980px/);
});


test('each Studio entry loads the cache-busted stylesheet',()=>{
  for(const shell of shells){
    const html=read(shell);
    assert.equal(html.split('studio-profile-banner-balance-20261120.css?v=20261120-globe-banner-shortcuts-1&ranklayout=20261121-1').length-1,1,shell);
  }
});

test('clicking Chopped opens the existing Trophies module, including keyboard access',()=>{
 const source=read('profile-stats-row-20261116.js');
 assert.match(source,/rankTitle\.setAttribute\('role','link'\)/);
 assert.match(source,/rankTitle\.setAttribute\('tabindex','0'\)/);
 assert.match(source,/rank\.insertBefore\(rankLabel,rankTitle\|\|rank\.firstChild\)/);
 const listeners={}; const opened=[]; let prevented=0;
 const profile={querySelector(){return null}};
 const document={
  readyState:'complete',
  body:{},
  querySelector(selector){
   if(selector==='#studioApp')return {};
   if(selector.includes('.profile-card:not(.profile-is-editing) .profile-copy'))return profile;
   return null;
  },
  addEventListener(type,callback){(listeners[type]??=[]).push(callback)}
 };
 const scope={
  window:{addEventListener(){},openBIGLWAModule(key){opened.push(key)}},
  document,
  MutationObserver:class{observe(){}},
  requestAnimationFrame(cb){cb()},
  Node:{DOCUMENT_POSITION_PRECEDING:4}
 };
 vm.runInNewContext(source,scope,{timeout:1500});
 const target={closest(selector){return selector.includes('real-rank strong[role="link"]')?{}:null}};
 const event={type:'click',target,preventDefault(){prevented++}};
 listeners.click[0](event);
 assert.deepEqual(opened,['trophies']);
 assert.equal(prevented,1);
 listeners.keydown[0]({...event,type:'keydown',key:'Escape'});
 assert.equal(opened.length,1);
 listeners.keydown[0]({...event,type:'keydown',key:'Enter'});
 assert.deepEqual(opened,['trophies','trophies']);
});

test('profile rail photo, Edit Profile and location stay separate; Highlights never wrap across Real Rank',()=>{
  const social=read('profile-social-showcase.js');
  const stats=read('profile-stats-row-20261116.js');
  assert.doesNotMatch(social,/grid-template-columns:repeat\\(auto-fit,minmax\\(58px,1fr\\)\\)/);
  assert.match(social,/biglwa-stories-track\\{display:flex!important;flex-wrap:nowrap!important/);
  assert.match(css,/profile overlap repair/);
  for(const selector of [
    '.profile-identity-rail>.profile-avatar',
    '.profile-identity-rail>#editProfileBtn',
    '.profile-identity-rail>.profile-rail-location',
    '.profile-copy>.biglwa-stories-ribbon .biglwa-stories-track',
    '.profile-copy>.real-rank.real-rank'
  ])assert(css.includes(selector),selector+' is included in the profile layout contract');
  assert.match(css,/flex-flow:row nowrap!important/);
  assert.match(css,/grid-template-columns:140px minmax\\(0,1fr\\)!important/);
  assert.match(css,/margin:auto 0 0!important/);
  assert.match(css,/content:"★"!important/);
  assert.match(stats,/header\\.textContent='REAL RANKINGS'/);
  for(const shell of shells){
    const html=read(shell);
    for(const asset of ['profile-social-showcase.js','profile-stats-row-20261116.js','profile-scoreboard-compact-20261118.js','studio-profile-banner-balance-20261120.css']){
      assert(html.includes(asset+'?'),shell+': '+asset+' remains loaded');
    }
    assert.equal(html.split('&profilefit=20261121-3').length-1,4,shell+' has all 4 fresh asset versions');
  }
});
