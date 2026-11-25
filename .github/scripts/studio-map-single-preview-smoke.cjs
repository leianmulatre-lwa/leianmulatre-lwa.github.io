/* Exercise both real preview owners together with a controlled map iframe.
   No third-party tile requests, no account data, and no fabricated live claim. */
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1200,height:800}});
  const source=fs.readFileSync('module-pages.js','utf8');
  const start=source.indexOf('  function syncMapCardPreview(){'),end=source.indexOf('\n  function enhanceStudioCards(){',start);
  assert(start>=0&&end>start);
  const styles=fs.readFileSync('studio-default-images-20261029.css','utf8');
  await page.route('https://biglwa.test/**',route=>route.fulfill({contentType:'text/html',body:route.request().url().includes('map-app.html')?'<p>Controlled map iframe</p>':'<!doctype html><style>*{box-sizing:border-box}#map{width:350px}.studio-map-preview-slot{position:relative}</style><style>'+styles+'</style><main id="studioApp"><article id="map"><div class="studio-map-preview-slot"></div><button class="card-cta">Open Map</button></article></main>'}));
  await page.goto('https://biglwa.test/studio/');
  await page.evaluate(code=>{(0,eval)("(function(){const $=(s,r=document)=>r.querySelector(s);const readMapPreviewPins=()=>[];"+code+"\nwindow.syncPreview=syncMapCardPreview;syncMapCardPreview();})()")},source.slice(start,end));
  await page.addScriptTag({content:fs.readFileSync('studio-default-images-20261029.js','utf8')});
  const slot=page.locator('.studio-map-preview-slot'),frame=page.locator('#biglwaStudioMiniMap'),error=slot.locator('.studio-map-preview-error');
  const signal=type=>page.evaluate(type=>window.dispatchEvent(new MessageEvent('message',{origin:location.origin,source:document.querySelector('#biglwaStudioMiniMap').contentWindow,data:{type}})),type);
  await frame.waitFor({state:'attached'});
  assert.equal(await slot.locator('img').count(),1);
  assert.equal(await error.isVisible(),false);
  await signal('biglwa:map-failed');
  assert.equal(await error.isVisible(),true);
  assert.equal(await slot.locator('img').count(),1);
  assert.equal(await slot.locator('.biglwa-map-error-fallback').count(),0);
  assert.equal((await slot.boundingBox()).height,205);
  await error.getByRole('button',{name:'Retry map'}).click();
  assert.equal(await error.isVisible(),false);
  await signal('biglwa:map-ready');
  assert.equal(await frame.isVisible(),true);
  assert.equal(await slot.locator('.studio-map-still').isVisible(),false);
  await page.evaluate(()=>window.syncPreview());
  assert.equal(await slot.locator('iframe').count(),1);
  assert.equal(await slot.locator('img').count(),1);
  assert.equal((await slot.boundingBox()).height,205);
  await signal('biglwa:map-failed');
  assert.equal(await error.isVisible(),true);
  assert.equal(await slot.locator('.studio-map-still').isVisible(),true);
  console.log('PASS one map preview across load, failure, retry, readiness and refresh');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});

// Run the Avatar cross-origin preview smoke alongside the Map preview checks.
require('./studio-sona-preview-smoke.cjs');
