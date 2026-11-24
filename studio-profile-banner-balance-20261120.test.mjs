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

test('center scoreboard emblem is the original pixel blocks, not stitched LWA text',()=>{
  const existing=read('profile-scoreboard-compact-20261118.css');
  assert.match(css,/\.biglwa-profile-scoreboard>\.stats\.stats::after \{\s*content:""!important/);
  assert.match(css,/background:transparent url\("\/assets\/loading-blocks-pixel-20261029\.png"\)/);
  assert.match(css,/\.biglwa-profile-scoreboard::after \{\s*content:""!important;display:block!important;position:absolute!important;\s*inset:5px!important/);
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
  assert.doesNotMatch(social,/grid-template-columns:repeat\(auto-fit,minmax\(58px,1fr\)\)/);
  assert.match(social,/biglwa-stories-track\{display:flex!important;flex-wrap:nowrap!important/);
  assert.match(css,/profile overlap repair/);
  for(const selector of [
    '.profile-identity-rail>.profile-avatar',
    '.profile-identity-rail>#editProfileBtn',
    '.profile-identity-rail>.profile-rail-location',
    '.profile-copy>.biglwa-stories-ribbon .biglwa-stories-track',
    '.profile-copy>.real-rank.real-rank'
  ])assert(css.includes(selector),selector+' is included in the profile layout contract');
  assert.match(css,/flex-flow:row nowrap!important/);
  assert.match(css,/grid-template-columns:140px minmax\(0,1fr\)!important/);
  assert.match(css,/margin:auto 0 0!important/);
  assert.match(css,/content:"★"!important/);
  assert.match(stats,/header\.textContent='REAL ★ RANKINGS'/);
  for(const shell of shells){
    const html=read(shell);
    for(const asset of ['profile-social-showcase.js','profile-stats-row-20261116.js','profile-scoreboard-compact-20261118.js','studio-profile-banner-balance-20261120.css']){
      assert(html.includes(asset+'?'),shell+': '+asset+' remains loaded');
    }
    assert.equal(html.split('&profilefit=20261121-3').length-1,4,shell+' has all 4 fresh asset versions');
  }
});

 test('rank stars and scoreboard square keys keep the stereo appearance and existing layout',()=>{
  const stats=read('profile-stats-row-20261116.js');
  const preview=read('profile-preview-repair.js');
  const payload=read('live-studio-payload.html');
  assert(stats.includes("rankLabel.textContent='REAL ★ RANK'"));
  assert(preview.includes("label.textContent='REAL ★ RANK'"));
  assert(payload.includes('class="rank-label">REAL ★ RANK</span>'));
  assert.match(css,/biglwa-scoreboard-lights>\.window-light \{[\s\S]*?width:18px!important;height:18px!important;[\s\S]*?border-radius:3px!important/);
  for(const shell of shells)for(const asset of ['profile-stats-row-20261116.js','profile-preview-repair.js','studio-profile-banner-balance-20261120.css'])assert.match(read(shell),new RegExp(asset.replace(/\./g,'\\.')+'\\?[^"\']*rankstars=20261124-1'),shell+' '+asset);
 });

test('clock replaces only globe and keeps private account preferences and non-editor green actions',()=>{
 const clock=read('profile-scoreboard-compact-20261118.js');
 assert.match(css,/biglwa-profile-scoreboard::before\{display:none!important\}/);
 assert(css.includes('biglwa-score-clock-face'));
 assert(clock.includes("hourCycle:prefs.format==='24h'?'h23':'h12'"));
 assert(clock.includes('Intl.supportedValuesOf'));
 assert(clock.includes('saveCustomizations({appearance:{scoreboardClock:next}})'));
 assert.doesNotMatch(clock,/localStorage|sessionStorage/);
 for(const source of ['studio-experience.js','ui-coherence.js']){
   const js=read(source);assert(js.includes("label:'Enlarge Aura widget'"));
   assert(js.includes("data-expand-widget"));
 }
 const avatar=read('avatar-studio-bitmoji-20261017-v3.js');
 assert.doesNotMatch(avatar,/if\(!a\?\.url\|\|!state\.loadedUid\|\|state\.loadedUid!==current\(\)\)\{openEditor\(\)/);
 assert(avatar.includes("if(control.dataset.avatarWidgetAction==='enlarge')openAvatarLarge()"));
 for(const shell of shells)for(const asset of ['profile-scoreboard-compact-20261118.js','studio-profile-banner-balance-20261120.css','studio-experience.js','ui-coherence.js','avatar-studio-bitmoji-20261017-v3.js'])assert(read(shell).includes('clock=20261124-1'),asset);
});

test('solid clock outline and paired metric face widths remain consistent',()=>{
 assert.match(css,/outline:1px solid rgba\(255,255,255,\.88\);outline-offset:2px/);
 assert.match(css,/\[data-profile-stat="followers"\],\[data-profile-stat="following"\],\[data-profile-stat="reach"\],\[data-profile-stat="likes"\]/);
 assert.match(css,/width:min\(100%,8ch\)!important/);
 assert.doesNotMatch(read('profile-scoreboard-compact-20261118.js'),/cloneNode|localStorage\.setItem|setDoc|replaceChildren/);
});

test('inner perimeter stitching and clock spacing preserve the tile; blocks animate only during profile loading',()=>{
 assert.match(css,/inset:5px!important;width:auto!important;height:auto!important/);
 assert.match(css,/border:1px dashed rgba\(255,255,255,\.72\)!important/);
 assert.match(css,/top:34px!important;left:50%!important/);
 assert.match(css,/flex:0 0 79px!important/);
 assert.match(css,/loading-blocks-pixel-20261029\.png"\) center\/contain no-repeat!important;[\s\S]*?animation:none!important/);
 assert.match(css,/@media \(prefers-reduced-motion:no-preference\) \{\s*#studioApp#studioApp#studioApp:has\(#lwaProfileLoading:not\(\[hidden\]\) \.lwa-profile-loading-label:not\(\[hidden\]\)\)/);
 for(const shell of shells)assert.match(read(shell),/studio-profile-banner-balance-20261120\.css\?[^"']*seam=20261124-2/);
});

test('rank rail and rank track use the same baseline and full available width',()=>{
 const rules=css.slice(css.indexOf('/* The rail already owns REAL ★ RANK'));
 assert.match(rules,/grid-template-columns:max-content minmax\(0,1fr\) max-content!important/);
 assert.match(rules,/\.rank-track\{\s*grid-row:1!important;grid-column:2!important;align-self:center!important;\s*justify-self:stretch!important;width:100%!important;max-width:none!important/);
 assert.match(rules,/\.real-rank-label\{\s*position:absolute!important;inset:auto 0 3px 0!important;\s*height:28px!important/);
 assert.match(rules,/flex:0 0 28px!important;height:28px!important/);
 assert.match(rules,/text-align:center!important;justify-content:center!important/);
 for(const shell of shells)assert.match(read(shell),/studio-profile-banner-balance-20261120\.css\?[^"']*rankline=20261124-3/);
});
