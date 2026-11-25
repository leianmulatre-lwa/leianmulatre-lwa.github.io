/* Real Studio Avatar input and iframe in Chromium, with a controlled provider. */
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1000,height:800}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  let requests=0;
  const u='https://360sona.com/w/test_case_123';
  await page.route('https://biglwa.test/**',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><main id="studioApp"><div id="wallpaperPanel"><div id="profileEditorTabs"></div></div></main><style>main{width:650px}body{margin:0}</style>'}));
  let release;
  const hold=new Promise(resolve=>{release=resolve});
  await page.route(/^https:\/\/360sona\.com\/[ws]\//,async route=>{
   if(++requests===1)await hold;
   await route.fulfill({contentType:'text/html',body:'<!doctype html><p id="test-avatar">Controlled avatar</p>'});
  });
  await page.goto('https://biglwa.test/studio');
  await page.addStyleTag({path:'studio-loading-pixel-20261029.css'});
  await page.addScriptTag({content:fs.readFileSync('avatar-studio-bitmoji-20261017-v3.js','utf8')});
  await page.locator('#profileAvatarEditor').evaluate(el=>el.hidden=false);
  await page.locator('[data-avatar-source="sona360"]').click();
  const input=page.locator('#biglwaSonaWidgetURL'),frame=page.locator('#biglwaSonaLivePreview iframe');
  await input.fill(u);await input.press('Enter');
  const loader=page.locator('#biglwaSonaLivePreview .biglwa-avatar-loading');
  await loader.waitFor({state:'visible'});
  assert.equal(await loader.evaluate(el=>getComputedStyle(el,'::after').animationName),'lwa-pixel-hover');
  release();
  await loader.waitFor({state:'detached'});
  await page.frameLocator('#biglwaSonaLivePreview iframe').locator('#test-avatar').waitFor({state:'visible'});
  assert.equal(await frame.getAttribute('src'),u);
  assert.equal(await frame.getAttribute('loading'),'eager');
  assert.equal(await frame.getAttribute('referrerpolicy'),'strict-origin');
  assert((await frame.boundingBox()).height>=160);
  assert.equal(await page.locator('[data-sona-open-preview]').getAttribute('href'),u);
  const before=requests;
  await input.press('Enter');
  await page.waitForFunction(n=>document.querySelector('#biglwaSonaLivePreview iframe')?.getAttribute('src')===n,u);
  await page.frameLocator('#biglwaSonaLivePreview iframe').locator('#test-avatar').waitFor({state:'visible'});
  assert(requests>before,'Enter must retry even when the URL has not changed');
  const share='https://360sona.com/s/Abc123def456';
  await input.fill(share);await input.press('Enter');
  await page.frameLocator('#biglwaSonaLivePreview iframe').locator('#test-avatar').waitFor({state:'visible'});
  assert.equal(await frame.getAttribute('src'),share);
  await input.fill('https://bad.test/w/test_case_123');await input.press('Enter');
  assert.match(await page.locator('#biglwaSonaFrameStatus').innerText(),/published 360sona/);
  assert.equal(await frame.getAttribute('src'),share,'Invalid links never replace the valid frame');
  assert.deepEqual(errors,[]);
  console.log('PASS actual Avatar input, Enter, visible iframe, retry and invalid link in Chromium (controlled provider)');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
