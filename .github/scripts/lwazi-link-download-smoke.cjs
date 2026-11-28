/* Exercise actual Workshop paste, file transfer, and browser download events. */
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require('playwright');
const tools=fs.readFileSync('tools-studio.js','utf8'),inspector=fs.readFileSync('lwazi-link-tools-20261114.js','utf8');
const video=Buffer.from([0,0,0,16,102,116,121,112,109,112,52,50,0,0,0,0]);
const ordinary=Buffer.from('A real ordinary file.\n','utf8');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({acceptDownloads:true});
  await page.route('https://biglwa.com/**',async route=>{
   const request=route.request(),url=new URL(request.url()),path=url.pathname;
   if(path==='/download-test')return route.fulfill({contentType:'text/html',body:'<main id="workshop"></main>'});
   if(path==='/tools-studio.js')return route.fulfill({contentType:'application/javascript',body:tools});
   if(path==='/lwazi-link-tools-20261114.js')return route.fulfill({contentType:'application/javascript',body:inspector});
   if(path==='/tools-craft.js')return route.fulfill({contentType:'application/javascript',body:'export function mountCraftSuite(){}'});
   if(path==='/clip.mp4')return route.fulfill({contentType:'video/mp4',headers:{'Content-Disposition':'attachment; filename="sample.mp4"','Content-Length':String(video.length)},body:request.method()==='HEAD'?undefined:video});
   if(path==='/not-a-file.mp4')return route.fulfill({contentType:'text/html',body:'<html>Not a downloadable file</html>'});
   return route.fulfill({status:404,body:'Not found'});
  });
  await page.route('https://files.example/**',async route=>{
   if(route.request().method()==='HEAD')return route.fulfill({status:405,headers:{'Access-Control-Allow-Origin':'https://biglwa.com'}});
   return route.fulfill({contentType:'text/plain',headers:{'Access-Control-Allow-Origin':'https://biglwa.com','Access-Control-Expose-Headers':'Content-Disposition, Content-Length','Content-Disposition':"attachment; filename*=UTF-8''my%20notes.txt",'Content-Length':String(ordinary.length)},body:ordinary});
  });
  await page.goto('https://biglwa.com/download-test');
  // Deliberately do not preload the inspector; Workshop must load it on demand.
  await page.evaluate(async()=>{window.BigLWAAds={createDownloadCard(){throw Error('ad service unavailable')}};const mod=await import('/tools-studio.js');mod.mountToolsStudio(document.querySelector('#workshop'))});
  const field=page.locator('#toolLinkForm input');
  async function paste(url){await field.fill(url);await field.dispatchEvent('paste');await page.locator('#toolLinkDownloads .bl-link-inspector').waitFor()}
  async function download(expected,bytes){
   const event=page.waitForEvent('download');
   await page.getByRole('button',{name:'Download file',exact:true}).click();
   const file=await event;assert.equal(file.suggestedFilename(),expected);
   assert.deepEqual(fs.readFileSync(await file.path()),bytes);
   assert(await page.locator('.bl-link-ready').isVisible());
  }
  await paste('https://biglwa.com/clip.mp4');await download('sample.mp4',video);
  await paste('https://files.example/download?id=42');await download('my notes.txt',ordinary);
  await paste('https://biglwa.com/not-a-file.mp4');
  await page.getByRole('button',{name:'Download file',exact:true}).click();
  await page.getByRole('status').filter({hasText:'webpage, not a file'}).waitFor();
  assert.equal(await page.locator('.bl-link-ready').isVisible(),false);
  console.log('PASS Workshop paste, lazy inspector, actual MP4/file bytes, HEAD 405 fallback, ad failure independence, HTML rejection');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
