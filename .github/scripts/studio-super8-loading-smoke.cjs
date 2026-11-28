const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require('playwright');
const source=fs.readFileSync('studio-loading-super8-20261128.js','utf8'),css=fs.readFileSync('studio-loading-super8-20261128.css','utf8');
const media='/assets/loading-super8-20261128.webm',poster='/assets/loading-super8-poster-20261128.webp';
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage();
  await page.route('https://biglwa.com/**',route=>{
   const path=new URL(route.request().url()).pathname;
   if(path===media){const bytes=fs.readFileSync('.'+media),range=route.request().headers()['range'],match=range?.match(/^bytes=(\d+)-(\d*)$/);
    if(match){const start=Number(match[1]),end=Math.min(bytes.length-1,match[2]?Number(match[2]):bytes.length-1);return route.fulfill({status:206,contentType:'video/webm',headers:{'Accept-Ranges':'bytes','Content-Range':'bytes '+start+'-'+end+'/'+bytes.length},body:bytes.subarray(start,end+1)})}
    return route.fulfill({contentType:'video/webm',body:bytes})}
   if(path===poster)return route.fulfill({contentType:'image/webp',body:fs.readFileSync('.'+poster)});
   if(path==='/studio-loading-super8-20261128.css')return route.fulfill({contentType:'text/css',body:css});
   return route.fulfill({contentType:'text/html',body:'<style>'+css+'</style><div id="biglwaStartupScreen" style="position:fixed;inset:0;background:#45080e"><video class="biglwa-super8-overlay" poster="'+poster+'"></video><div class="biglwa-startup-inner">loading</div></div><main id="studioApp"><div class="module-shell"><div class="lwa-curtain" data-lwa-curtain="module" hidden style="position:absolute;inset:0;background:#45080e"><span class="lwa-pixel-scene">pixel scene</span><button class="lwa-curtain-bypass">continue</button></div></div><div class="biglwa-avatar-loading">avatar</div></main>'})
  });
  await page.goto('https://biglwa.com/test');
  const startup=page.locator('#biglwaStartupScreen'),module=page.locator('.lwa-curtain'),film=startup.locator('video');
  assert.equal(await film.evaluate(v=>getComputedStyle(v).opacity),'0.36');
  await page.addScriptTag({content:source});
  await page.waitForFunction(()=>{const v=document.querySelector('#biglwaStartupScreen video');return v.currentTime>0&&!v.paused});
  assert.equal(await film.evaluate(v=>getComputedStyle(v).mixBlendMode),'multiply');
  assert.equal(await film.evaluate(v=>getComputedStyle(v).opacity),'0.36');
  assert.equal(await film.evaluate(v=>getComputedStyle(v).transitionDuration),'0s');
  assert.equal(await startup.locator('.biglwa-startup-inner').evaluate(e=>getComputedStyle(e).zIndex),'2');
  await startup.evaluate(e=>e.setAttribute('aria-hidden','true'));
  await page.waitForFunction(()=>!document.querySelector('#biglwaStartupScreen video').hasAttribute('src'));
  await module.evaluate(e=>e.hidden=false);
  const moduleFilm=module.locator('video');await moduleFilm.waitFor({state:'attached'});
  assert.equal(await moduleFilm.evaluate(v=>getComputedStyle(v).opacity),'0.36');
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForFunction(()=>!document.querySelector('.lwa-curtain video').hasAttribute('src'));
  assert.equal(await moduleFilm.evaluate(v=>getComputedStyle(v).opacity),'0.36');
  assert.equal(await page.locator('.biglwa-avatar-loading video').count(),0);
  await module.evaluate(e=>e.hidden=true);
  assert.equal(await moduleFilm.isVisible(),false);
  console.log('PASS Super 8 first-paint poster, actual playback, same multiply layer, no independent fade, reduced motion still, hidden curtain');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
