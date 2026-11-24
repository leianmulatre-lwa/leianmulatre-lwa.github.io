/* Verify computed layout, not just CSS source strings. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1600,height:850}});
  const styles=['profile-preview-repair.css','profile-scoreboard-compact-20261118.css','studio-profile-banner-balance-20261120.css'].map(p=>fs.readFileSync(p,'utf8')).join('\n');
  await page.setContent('<style>*{box-sizing:border-box}#studioApp{width:100%}.hero{display:grid}.profile-card{background:#ccc}.profile-copy{display:flex;flex-direction:column}.profile-identity-rail{display:flex;flex-direction:column}.rank-track{height:10px;width:1px;max-width:1px}.real-rank{width:80px;position:absolute;bottom:0}.profile-avatar{width:108px;height:108px}.rank-track i{display:block;width:15%;height:100%;background:#5caf7c}</style><style>'+styles+'</style><main id="studioApp"><div class="hero biglwa-scoreboard-ready"><section class="profile-card"><div class="profile-identity-rail"><div class="profile-avatar"></div><button id="editProfileBtn">Edit profile</button><span class="profile-rail-location">Los Angeles, CA</span><span class="real-rank-label">REAL ★ RANK</span></div><div class="profile-copy"><div class="profile-name-line">Profile</div><div class="biglwa-profile-role-statline"><section class="biglwa-profile-scoreboard"></section></div><div class="biglwa-stories-ribbon"></div><div class="real-rank rank-under-note"><span class="rank-label rank-duplicate-label">REAL ★ RANK</span><strong>chopped</strong><span class="rank-track"><i></i></span><span class="rank-next">next: 007</span></div></div></section></div></main>');
  for(const width of [1200,1600,1920]){
   await page.setViewportSize({width,height:850});
   const r=await page.evaluate(()=>{const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom,cy:r.y+r.height/2}};return {card:rect('.profile-card'),label:rect('.real-rank-label'),title:rect('.real-rank strong'),track:rect('.rank-track'),next:rect('.rank-next')}});
   assert(Math.abs(r.label.cy-r.title.cy)<=2,JSON.stringify(r));
   assert(Math.abs(r.track.cy-r.title.cy)<=2,JSON.stringify(r));
   assert(r.track.w>100,JSON.stringify(r));
   assert(r.next.right<=r.card.right-10,JSON.stringify(r));
   assert(r.title.x>=r.label.right,JSON.stringify(r));
   assert(r.track.x>=r.title.right,JSON.stringify(r));
   console.log('PASS rank layout '+width+'px: shared baseline, '+Math.round(r.track.w)+'px progress track');
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
