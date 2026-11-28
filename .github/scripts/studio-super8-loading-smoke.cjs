const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require('playwright');
const source=fs.readFileSync('studio-loading-super8-20261128.js','utf8'),css=fs.readFileSync('studio-loading-super8-20261128.css','utf8');
const media='/super-8mm-film-effect-free-overlays-2160-ytshorts.savetube.me.mp4';
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage();
  let requests=0;
  await page.route('https://biglwa.com/**',route=>{
   const path=new URL(route.request().url()).pathname;
   if(path===media){
     requests++;const bytes=fs.readFileSync('.'+media),range=route.request().headers()['range'];
     const match=range?.match(/^bytes=(\d+)-(\d*)$/);
     if(match){const start=Number(match[1]),end=Math.min(bytes.length-1,match[2]?Number(match[2]):bytes.length-1);return route.fulfill({status:206,contentType:'video/mp4',headers:{'Accept-Ranges':'bytes','Content-Range':'bytes '+start+'-'+end+'/'+bytes.length},body:bytes.subarray(start,end+1)})}
     return route.fulfill({contentType:'video/mp4',headers:{'Accept-Ranges':'bytes'},body:bytes})
   }
   if(path==='/studio-loading-super8-20261128.css')return route.fulfill({contentType:'text/css',body:css});
   return route.fulfill({contentType:'text/html',body:'<div id="biglwaStartupScreen" style="position:fixed;inset:0;background:#45080e"><div class="biglwa-startup-inner">loading</div></div><main id="studioApp"><div class="module-shell"><div class="lwa-curtain" data-lwa-curtain="module" hidden style="position:absolute;inset:0;background:#45080e"><span class="lwa-pixel-scene">pixel scene</span><button class="lwa-curtain-bypass">continue</button></div></div><div class="biglwa-avatar-loading">avatar</div></main>'})
  });
  await page.goto('https://biglwa.com/test');
  await page.addScriptTag({content:source});
  const startup=page.locator('#biglwaStartupScreen'),module=page.locator('.lwa-curtain');
  await startup.locator('video').waitFor({state:'attached'});
  const props=await startup.locator('video').evaluate(v=>({source:new URL(v.src).pathname,muted:v.muted,loop:v.loop,inline:v.playsInline,blend:getComputedStyle(v).mixBlendMode,fit:getComputedStyle(v).objectFit,pointer:getComputedStyle(v).pointerEvents,z:getComputedStyle(v).zIndex}));
  assert.deepEqual(props,{source:media,muted:true,loop:true,inline:true,blend:'screen',fit:'cover',pointer:'none',z:'1'});
  assert.equal(await startup.locator('.biglwa-startup-inner').evaluate(e=>getComputedStyle(e).zIndex),'2');
  // Unsupported codecs keep the original curtain visible instead of removing UI.
  await startup.locator('video').evaluate(v=>v.dispatchEvent(new Event('error')));
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('#biglwaStartupScreen video')).opacity==='0');
  await startup.evaluate(e=>e.setAttribute('aria-hidden','true'));
  await startup.locator('video').waitFor({state:'detached'});
  await module.evaluate(e=>e.hidden=false);
  await module.locator('video').waitFor({state:'attached'});
  assert.equal(await module.locator('button').evaluate(e=>getComputedStyle(e).zIndex),'2');
  assert.equal(await page.locator('.biglwa-avatar-loading video').count(),0);
  await page.emulateMedia({reducedMotion:'reduce'});
  await module.locator('video').waitFor({state:'detached'});
  await module.evaluate(e=>e.hidden=true);
  await page.waitForTimeout(100);
  await module.evaluate(e=>e.hidden=false);
  await page.waitForTimeout(350);
  assert.equal(await module.locator('video').count(),0);
  await page.emulateMedia({reducedMotion:'no-preference'});
  await module.locator('video').waitFor({state:'attached'});
  await module.evaluate(e=>e.hidden=true);
  await module.locator('video').waitFor({state:'detached'});
  assert(requests>0);
  console.log('PASS Super 8 curtain layering, silent playback setup, teardown, reduced motion, no mini widget loader');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
