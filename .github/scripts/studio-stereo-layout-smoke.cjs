/* Exercise the live player builder against the responsive layout CSS. */
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1600,height:900}});
  const styles=['studio-widget-visibility-music-20261102.css','studio-upper-rail-size-contract-20261103.css','studio-profile-banner-balance-20261120.css'].map(p=>fs.readFileSync(p,'utf8')).join('\n');
  const source=fs.readFileSync('studio-experience.js','utf8');
  const start=source.indexOf('  function upgradeMusic(){'),end=source.indexOf('\n  // Use the same audio element for tracks stored',start);
  assert(start>=0&&end>start);
  await page.setContent('<style>*{box-sizing:border-box}.hero{width:100%}#studioApp{width:100%}.music-row{display:flex}.progress{height:3px;background:#444}.progress i{display:block;height:100%;background:green}.stereo-time-scale{display:grid}.stereo-eq{display:flex}.stereo-eq i{flex:1}.music-copy strong,.music-copy span{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.stereo-speaker{position:relative}.stereo-display{display:flex;flex-direction:column}</style><style>'+styles+'</style><main id="studioApp"><div class="hero"><section class="profile-card"><div class="biglwa-profile-scoreboard"></div></section><div id="heroWidgetRail" class="hero-widget-rail"><section class="music-card" data-upper-span="2"><h2 class="card-kicker">NOW PLAYING</h2><div class="widget-window-controls"><button class="window-light green"></button><button class="window-light yellow"></button><button class="window-light red"></button></div><button class="widget-drag-handle">Drag</button><button id="profileMusicOpen">Tunes</button><div class="music-row"><div class="album-art">♪</div><div class="music-copy"><strong>Long track title for truncation</strong><span>Artist</span></div><button id="playBtn">▶</button></div><div class="progress"><i id="musicProgress"></i></div></section><div id="biglwaAuraAvatarPair" class="biglwa-aura-avatar-pair" data-upper-span="2"><div class="aura-card" data-upper-span="1"></div><div id="studioAvatarCard" data-upper-span="1"></div></div><div class="guest-check-card" data-upper-span="1"></div></div><nav class="mobile-dock hero-action-bar">Shortcuts</nav></div><div id="profileSongEditorMount"></div></main>');
  await page.evaluate(code=>{(0,eval)("(function(){const $=(s,r=document)=>r.querySelector(s);const setMusicStatus=()=>{};const restoreMusic=()=>{};const updateMusic=async()=>{};"+code+"\nupgradeMusic();})()");window.originalAudio=document.querySelector('#studioAudio');window.originalPlay=document.querySelector('#playBtn')},source.slice(start,end));
  for(const [width,square] of [[1600,false],[1280,false],[1024,false],[1600,true],[1024,true],[900,true],[390,true],[390,false]]){
   await page.setViewportSize({width,height:900});
   await page.evaluate(square=>{const card=document.querySelector('.music-card');for(const name of ['studio-upper-square','studio-header-only','studio-music-square'])card.classList.toggle(name,square);card.dataset.upperSpan=square?'1':'2';document.querySelector('#heroWidgetRail').style.setProperty('--studio-upper-tracks',square?'1fr 2fr 1fr':'2fr 2fr 1fr')},square);
   const r=await page.evaluate(()=>{const rect=s=>{const x=document.querySelector(s).getBoundingClientRect();return {x:x.x,y:x.y,w:x.width,h:x.height,right:x.right,bottom:x.bottom}};return {rail:rect('#heroWidgetRail'),dock:rect('.hero-action-bar'),guest:rect('.guest-check-card'),pair:rect('#biglwaAuraAvatarPair'),card:rect('.music-card'),aura:rect('.aura-card'),display:rect('.stereo-display'),left:rect('.stereo-speaker'),right:rect('.stereo-face>.stereo-speaker:last-child'),deck:rect('.stereo-control-deck'),progress:rect('.progress'),buttons:[...document.querySelectorAll('.stereo-control-deck button')].map(x=>({w:x.offsetWidth,h:x.offsetHeight})),same:window.originalAudio===document.querySelector('#studioAudio')&&window.originalPlay===document.querySelector('#playBtn')}});
   assert(r.dock.y>=r.rail.bottom-1 && Math.abs(r.rail.x-r.dock.x)<=1 &&
     Math.abs(r.rail.right-r.dock.right)<=1,JSON.stringify(r));
   for(const item of [r.card,r.pair,r.guest]) {
    assert(item.x>=r.rail.x-1 && item.right<=r.rail.right+1 && item.bottom<=r.rail.bottom+1,JSON.stringify(r));
   }
   for(const item of [r.pair,r.guest]) {
    assert(r.card.right<=item.x+1 || item.right<=r.card.x+1 ||
      r.card.bottom<=item.y+1 || item.bottom<=r.card.y+1,JSON.stringify(r));
   }
   assert(r.same,JSON.stringify(r));assert(Math.abs(r.card.h-r.aura.h)<=1,JSON.stringify(r));
   for(const panel of [r.display,r.left,r.right,r.deck,r.progress]){assert(panel.w>0&&panel.h>0,JSON.stringify(r));assert(panel.x>=r.card.x-1&&panel.right<=r.card.right+1&&panel.y>=r.card.y-1&&panel.bottom<=r.card.bottom+1,JSON.stringify(r))}
   assert.equal(r.buttons.length,4);assert(r.buttons.every(x=>x.w>=16&&x.h>=16),JSON.stringify(r));
   if(square){assert(r.display.bottom<=r.deck.y+1,JSON.stringify(r));assert(r.left.right<=r.deck.x+1,JSON.stringify(r))}
   else{assert(r.left.right<=r.display.x+1&&r.display.right<=r.right.x+1,JSON.stringify(r));assert(r.left.h>=r.display.h,JSON.stringify(r))}
   console.log('PASS stereo '+width+'px '+(square?'square':'long')+', same player and no clipping');
  }
  // Exercise each independent close state and restoration at every size.
  for(const square of [true,false]){
   await page.evaluate(square=>{const card=document.querySelector('.music-card');for(const name of ['studio-upper-square','studio-header-only','studio-music-square'])card.classList.toggle(name,square)},square);
   for(const state of ['hidden','widget-is-minimized','widget-is-docked']){
    await page.evaluate(state=>{const card=document.querySelector('.music-card');if(state==='hidden')card.hidden=true;else card.classList.add(state)},state);
    assert.equal(await page.locator('.music-card').isVisible(),false,state+' must hide stereo');
    await page.evaluate(state=>{const card=document.querySelector('.music-card');if(state==='hidden')card.hidden=false;else card.classList.remove(state)},state);
    assert.equal(await page.locator('.music-card').isVisible(),true,state+' must restore stereo');
    assert(await page.evaluate(()=>window.originalAudio===document.querySelector('#studioAudio')&&window.originalPlay===document.querySelector('#playBtn')));
   }
  }
  console.log('PASS long and square hidden, docked, minimized and restored states');
  // Exercise the actual stylesheet cascade, including a stale green LED value.
  const scoreboardCSS=['profile-stats-row-20261116.css','profile-scoreboard-compact-20261118.css','studio-profile-banner-balance-20261120.css'].map(p=>fs.readFileSync(p,'utf8')).join('\n');
  await page.setContent('<style>'+scoreboardCSS+'</style><main id="studioApp" style="--aura-rgb:239,148,45;--biglwa-score-ink:#58aa70"><div class="hero biglwa-scoreboard-ready"><div class="profile-card" style="--aura-rgb:88,170,112"><div class="biglwa-profile-role-statline"><div class="biglwa-profile-scoreboard" data-scoreboard-plate="maroon"><div class="biglwa-scoreboard-header">Real rankings</div><div class="stats"><span data-profile-stat="followers">Followers<b>123</b></span></div><button class="biglwa-score-clock"><span class="biglwa-score-clock-face"><b>12:28</b><small>AM</small></span></button></div></div></div></div></main>');
  for(const [mode,expected] of [['aura','rgb(239, 148, 45)'],['white','rgb(255, 255, 255)']]){
   await page.locator('#studioApp').evaluate((el,mode)=>{el.dataset.scoreboardInkMode=mode},mode);
   const actual=await page.locator('.biglwa-scoreboard-header,[data-profile-stat],[data-profile-stat] b,.biglwa-score-clock-face b,.biglwa-score-clock-face small').evaluateAll(nodes=>nodes.map(el=>[getComputedStyle(el).color,getComputedStyle(el).webkitTextFillColor]));
   assert(actual.every(pair=>pair.every(value=>value===expected)),JSON.stringify({mode,actual}));
  }
  await page.locator('#studioApp').evaluate(el=>{el.dataset.scoreboardInkMode='aura';el.style.setProperty('--aura-rgb','120,80,210')});
  assert.equal(await page.locator('[data-profile-stat] b').evaluate(el=>getComputedStyle(el).color),'rgb(120, 80, 210)');
  assert.match(await page.locator('.biglwa-profile-scoreboard').evaluate(el=>getComputedStyle(el).backgroundImage),/rgb\(112, 38, 43\)/);
  console.log('PASS scoreboard live Aura, white, stale green rejection and muted maroon finish');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
