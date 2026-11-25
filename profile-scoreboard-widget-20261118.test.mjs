import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import vm from 'node:vm';

const read=path=>readFileSync(new URL('./'+path,import.meta.url),'utf8');
const shells=['index.html','studio/index.html','404.html','live-studio-shell.html'];
const css=read('profile-stats-row-20261116.css');
const js=read('profile-stats-row-20261116.js');

test('owner-uploaded Alarm Clock face is first-party and actually loaded',()=>{
 assert(existsSync(new URL('./alarm clock 2.ttf',import.meta.url)),'alarm clock 2.ttf must be published');
 assert.match(css,/@font-face\{[\s\S]*?font-family:"BIGLWA Alarm Clock"/);
 assert.match(css,/src:url\("\/alarm%20clock%202\.ttf"\) format\("truetype"\)/);
 assert.match(css,/font-display:swap/);
});

test('profile counts are moved into one scoreboard widget without cloning or storage',()=>{
 assert.match(js,/biglwa-profile-scoreboard/);
 assert.match(js,/board\.append\(stats\)/);
 assert.doesNotMatch(js,/cloneNode|setDoc|localStorage|sessionStorage/);
 assert.match(css,/\.biglwa-profile-scoreboard\{[\s\S]*?grid-template-columns:repeat\(5/);
 assert.match(css,/\.biglwa-profile-scoreboard>.stats\.stats\{[\s\S]*?display:contents/);
 assert.match(css,/#studioApp#studioApp#studioApp[\s\S]*?"BIGLWA Alarm Clock"/);
 assert.match(css,/font-variant-numeric:tabular-nums lining-nums/);
 assert.match(css,/body\.night-mode[\s\S]*?biglwa-profile-scoreboard/);
});

test('runtime relocation keeps the original stats node inside the scoreboard',()=>{
 const events={};
 const node=tag=>({
  tag,className:'',children:[],parentElement:null,attrs:{},textContent:'',
  setAttribute(key,value){this.attrs[key]=value},
  querySelector(selector){
   if(selector.includes('biglwa-profile-scoreboard'))return this.children.find(child=>child.className==='biglwa-profile-scoreboard')||null;
   if(selector.includes('biglwa-profile-bio-roles'))return this.children.find(child=>child.className==='biglwa-profile-bio-roles')||null;
   return null;
  },
  prepend(item){this.children.unshift(item);item.parentElement=this},
  append(...items){for(const item of items){this.children.push(item);item.parentElement=this}},
  after(){},
  matches(){return false},
  closest(){return null},
  addEventListener(){},
  compareDocumentPosition(){return 0}
 });
 const profile=node('div'),bio=node('p'),stats=node('div'),line=node('div');
 profile.className='profile-copy';bio.className='bio';stats.className='stats';
 line.className='biglwa-profile-role-statline';
 bio.parentElement=profile;stats.parentElement=profile;line.parentElement=profile;
 profile.querySelector=selector=>{
  if(selector.includes('.bio'))return bio;
  if(selector.includes('.stats'))return stats;
  if(selector.includes('biglwa-profile-role-statline'))return line;
  return null;
 };
 const document={
  readyState:'complete',
  querySelector(selector){return selector.includes('.profile-card')?profile:null},
  createElement:node,
  addEventListener(){}
 };
 const scope={window:{addEventListener(){}},document,MutationObserver:class{observe(){}},requestAnimationFrame(fn){fn()},Node:{DOCUMENT_POSITION_PRECEDING:4},console};
 vm.runInNewContext(js,scope,{timeout:2000});
 const board=line.children.find(child=>child.className==='biglwa-profile-scoreboard');
 assert(board,'scoreboard widget created');
 assert.equal(board.attrs['aria-label'],'Real rankings scoreboard');
 const header=board.children.find(child=>child.className==='biglwa-scoreboard-header');
 assert.equal(header.textContent,'REAL ★ RANKINGS');
 const lights=header.children.find(child=>child.className==='biglwa-scoreboard-lights');
 assert.equal(lights.attrs['aria-hidden'],'true');
 assert.deepEqual(lights.children.map(child=>child.className),['window-light green','window-light yellow','window-light red']);
 assert.equal(stats.parentElement,board,'original stats node moved into scoreboard');
 assert.equal(line.children.filter(child=>child.className==='biglwa-profile-scoreboard').length,1,'no duplicate widget');
});

test('all Studio shells bust the first-party scoreboard font cache',()=>{
 for(const path of shells){
  const html=read(path);
  assert.match(html,/profile-stats-row-20261116\.css\?v=20261116-roles-stats-row-v2&scoreboard=20261118-1&font=20261118-2/,path);
  assert.match(html,/profile-stats-row-20261116\.js\?v=20261116-snapshot-1&desk=20261116-2&navigation=20261117-1&font=20261118-2/,path);
  assert.match(html,/alarm%20clock%202\.ttf|scoreboard=20261118-1/,path);
 }
});

test('gym scoreboard paints real five-count stats at four corners + center in current Aura',()=>{
 assert.match(js,/biglwa-scoreboard-header/);
 assert.match(js,/header\.textContent='REAL ★ RANKINGS'/);
 assert.match(css,/grid-template-areas:"followers connections reach" "following connections likes"/);
 assert.match(css,/grid-area:connections;min-height:116px/);
 assert.match(css,/--score-aura:rgb\(var\(--aura-rgb,216,95,109\)\)/);
 assert.match(css,/rgb\(var\(--aura-rgb,216,95,109\)\)/);
 assert.match(css,/biglwa-scoreboard-header::after/);
 assert.match(css,/background:#e24850;box-shadow:14px 0 #e7b333,28px 0 #38be72/);
 assert.match(css,/font-family:"BIGLWA Alarm Clock"/);
 assert.doesNotMatch(js,/cloneNode|localStorage\.setItem|setDoc/);
 for(const path of shells){
  assert.match(read(path),/profile-stats-row-20261116\.css[^"']*gym=20261118-aura-gym-fivepoint-1/);
 }
});


test('compact gym redesign keeps labels ABOVE small Alarm Clock number windows',()=>{
 const compact=read('profile-scoreboard-compact-20261118.css');
 const script=read('profile-scoreboard-compact-20261118.js');
 assert.match(compact,/grid-template-areas:"followers connections reach" "following lwa likes"/);
 assert.match(compact,/\.stats\.stats::after\{\s*content:"LWA";grid-area:lwa/);
 assert.match(compact,/order:2!important;display:inline-flex/);
 assert.match(compact,/width:max-content!important;min-width:2\.2ch!important/);
 assert.match(compact,/font:650 clamp\(9px,.82vw,12px\)\/1\.2 Inter/);
 assert.match(compact,/font-family:"BIGLWA Alarm Clock"/);
 assert.match(compact,/background:linear-gradient\(155deg,#551b2e/);
 assert.match(compact,/data-scoreboard-plate="clear"/);
 assert.match(compact,/biglwa-scoreboard-ready:has\(>\.profile-card:not\(\.profile-is-editing\)\)/);
 assert.match(script,/hero\.classList\.add\('biglwa-scoreboard-ready'\)/);
 assert.doesNotMatch(script,/cloneNode|localStorage\.setItem|setDoc|replaceChildren/);
});
test('Skeleton Key changes scoreboard color on the account and restores public preview',()=>{
 const compact=read('profile-scoreboard-compact-20261118.css');
 const script=read('profile-scoreboard-compact-20261118.js');
 const directory=read('firebase-directory.js');
 const preview=read('studio-preview.js');
 assert.match(script,/skeletonScoreboardColor/);
 assert.match(script,/skeletonScoreboardUseAura/);
 assert.match(script,/skeletonScoreboardPlate/);
 assert.match(script,/BigLWAUserDirectory\.saveCustomizations\(\{appearance:/);
 assert.match(script,/biglwa:customization-remote/);
 assert.match(script,/auraHex\(\)/);
 assert.match(directory,/scoreboardTextColor:/);
 assert.match(directory,/scoreboardPlate:/);
 assert.match(preview,/mirror\.scoreboardTextColor/);
 assert.match(compact,/--biglwa-score-ink,rgb\(var\(--aura-rgb/);
 for(const path of shells){
  const html=read(path);
  assert.match(html,/profile-scoreboard-compact-20261118\.css\?v=202611(?:18|20)-/,path);
  assert.match(html,/profile-scoreboard-compact-20261118\.js\?v=202611(?:18|20)-/,path);
 }
});


test('scoreboard uses an independent right tile with responsive stacking',()=>{
 const compact=read('profile-scoreboard-compact-20261118.css');
 const controller=read('profile-scoreboard-compact-20261118.js');
 const balance=read('studio-profile-banner-balance-20261120.css');
 // The layout is keyed to the real board, never a duplicate stats node.
 assert.match(compact,/hero:has\(>\.profile-card:not\(\.profile-is-editing\) \.biglwa-profile-scoreboard\)/);
 assert.match(compact,/grid-template-columns:minmax\(0,2fr\) minmax\(0,1fr\)!important/);
 assert.match(compact,/grid-column:1!important;grid-row:1!important/);
 assert.match(compact,/left:calc\(100% \+ 16px\)!important/);
 assert.match(compact,/@media\(max-width:900px\)/);
 assert.match(controller,/function verifyOnscreen\(\)/);
 assert.match(controller,/boardRect\.left<profileRect\.right\+6/);
 assert.match(controller,/window\.addEventListener\('resize'/);
 // Keep the banner and scoreboard short without changing the lower row.
 assert.match(balance,/grid-template-rows:246px auto auto!important/);
 assert.match(balance,/\.biglwa-profile-scoreboard \{\s*height:246px!important/);
 // Late account hydration reuses live metrics.
 assert.match(js,/if\(!stats\)\{/);
 assert.match(js,/window\.__biglwaSyncProfileMetrics\?\.\(\)/);
 assert.match(js,/profile\.closest\('\.hero'\)\?\.classList\.add\('biglwa-scoreboard-ready'\)/);
 for(const path of shells){
  const html=read(path);
  for(const asset of ['profile-stats-row-20261116.js','profile-scoreboard-compact-20261118.css','profile-scoreboard-compact-20261118.js']){
   assert.match(html,new RegExp(asset.replace(/\./g,'\\.')+'\\?v='),path+' '+asset);
  }
  assert.match(html,/studio-profile-banner-balance-20261120\.css\?v=20261120-globe-banner-shortcuts-1&ranklayout=20261121-1/,path);
 }
});
