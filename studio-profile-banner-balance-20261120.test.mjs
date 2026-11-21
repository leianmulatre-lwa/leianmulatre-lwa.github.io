import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const read=path=>readFileSync(new URL('./'+path,import.meta.url),'utf8');
const css=read('studio-profile-banner-balance-20261120.css');
const shells=['index.html','studio/index.html','404.html','live-studio-shell.html'];

test('weekly mood is absent from nonediting profile, without deleting account data',()=>{
  assert.match(css,/\.hero:has\(>\.profile-card:not\(\.profile-is-editing\)\) #weeklyMoodCard/);
  assert.match(css,/display:none!important/);
  assert.doesNotMatch(css,/localStorage|setDoc|removeChild|replaceChildren/);
});

test('the banner and independent scoreboard share a short first row',()=>{
  assert.match(css,/grid-template-rows:224px 246px auto!important/);
  assert.match(css,/>\.profile-card:not\(\.profile-is-editing\) \{\s*height:224px!important;min-height:224px!important;max-height:224px!important/);
  assert.match(css,/\.profile-card:not\(\.profile-is-editing\) \.biglwa-profile-scoreboard \{\s*height:224px!important/);
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

test('scoreboard LWA uses Stitch while live counts retain Alarm Clock',()=>{
  const existing=read('profile-scoreboard-compact-20261118.css');
  assert.match(css,/\.biglwa-profile-scoreboard>\.stats\.stats::after \{\s*font-family:"CS Bergamot Stitched"/);
  assert.match(existing,/font-family:"BIGLWA Alarm Clock"/);
});

test('each Studio entry loads the cache-busted stylesheet',()=>{
  for(const shell of shells){
    const html=read(shell);
    assert.equal(html.split('studio-profile-banner-balance-20261120.css?v=20261120-globe-banner-shortcuts-1').length-1,1,shell);
  }
});
