/* BIG LWA native editors: real headless Chromium smoke and screenshot proof.
 * Starts a localhost static server for the compiled Rust WebAssembly dist.
 * DOES NOT touch production, auth, live accounts, or user files.
 */
'use strict';
const {chromium}=require('playwright');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {once}=require('node:events');
const dist=path.resolve(process.argv[2]||'');
const name=String(process.argv[3]||'editor').replace(/[^a-zA-Z0-9_-]/g,'');
if(!fs.existsSync(path.join(dist,'index.html')))throw Error('No compiled editor HTML at '+dist);
const out=path.resolve(process.env.RUNNER_TEMP||'/tmp','biglwa-native-browser-proof');
fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8',
 '.json':'application/json','.wasm':'application/wasm','.svg':'image/svg+xml','.png':'image/png',
 '.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.webmanifest':'application/manifest+json'};
const server=http.createServer((req,res)=>{
  let relative;
  try{relative=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname)}catch{
    res.writeHead(400);res.end();return;
  }
  if(relative==='/__biglwa_host_test'){
    // Same-origin host fixture exercises Rust's native PDF inbox protocol.
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
    res.end(`<!doctype html><html lang="en"><head><title>BIG LWA native host proof</title></head><body style="margin:0">
<script>
window.__biglwaReady=false;window.__biglwaQueued='';
window.addEventListener('message',event=>{
 if(event.origin!==location.origin||event.source!==document.getElementById('editor')?.contentWindow)return;
 if(event.data?.type==='pdfcraft:ready')window.__biglwaReady=true;
 if(event.data?.type==='pdfcraft:queued')window.__biglwaQueued=event.data.requestId;
});
</script>
<iframe id="editor" src="/?biglwaHost=1" title="Native fileR integration" style="width:100vw;height:100vh;border:0"></iframe>
</body></html>`);
    return;
  }
  const target=path.resolve(dist,'.'+(relative==='/'?'/index.html':relative));
  if(!(target===dist||target.startsWith(dist+path.sep))){res.writeHead(403);res.end();return}
  fs.stat(target,(err,stat)=>{
    if(err||!stat.isFile()){res.writeHead(404);res.end();return}
    res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');
    res.setHeader('Cache-Control','no-store');
    fs.createReadStream(target).pipe(res);
  });
});
let browser;
async function main(){
  server.listen(0,'127.0.0.1');await once(server,'listening');
  const url='http://127.0.0.1:'+server.address().port+'/';
  const errors=[],httpFailures=[];
  browser=await chromium.launch({headless:true,args:[
    '--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader',
    '--enable-unsafe-swiftshader','--disable-gpu-sandbox'
  ]});
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
  page.on('pageerror',error=>errors.push('pageerror: '+error.message.slice(0,350)));
  page.on('response',response=>{if(response.status()>=400)httpFailures.push({status:response.status(),url:response.url()})});
  page.on('console',message=>{if(message.type()==='error')errors.push('console: '+message.text().slice(0,350))});
  page.on('crash',()=>errors.push('Chromium renderer crashed'));
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  let ready=false,problem='';
  try{
    await page.waitForFunction((app)=>{
      const c=document.querySelector('canvas');
      if(!c||c.width<640||c.height<380)return false;
      if(app==='keyframeR')return typeof window.effectcraftLoad?.readyMs==='number';
      if(app==='lightR'){
        const loading=document.querySelector('#photocraft_loading');
        return !loading||getComputedStyle(loading).display==='none'||loading.childElementCount===0;
      }
      if(app==='paintR'){
        const loading=document.querySelector('#vectorcraft_loading');
        return !loading||getComputedStyle(loading).display==='none'||loading.childElementCount===0;
      }
      return true;
    },name,{timeout:85000,polling:500});
    ready=true;
  }catch(error){problem=error.message.slice(0,400)}
  const canvas=await page.locator('canvas').first().evaluate(c=>({width:c.width,height:c.height,
    clientWidth:c.clientWidth,clientHeight:c.clientHeight})).catch(()=>null);
  const title=await page.title();
  const file=path.join(out,name+'.png');
  await page.screenshot({path:file,fullPage:false,timeout:30000});
  const result={name,url,ready,canvas,title,errors:errors.slice(0,15),httpFailures:httpFailures.slice(0,15),problem,
    screenshot:file,checkedAt:new Date().toISOString()};
  if(name==='fileR'&&ready){
    const host=await browser.newPage({viewport:{width:1440,height:900}});
    try{
      await host.goto(url+'__biglwa_host_test',{waitUntil:'domcontentloaded',timeout:60000});
      await host.waitForFunction(()=>window.__biglwaReady===true,null,{timeout:95000,polling:500});
      const fixture=fs.readFileSync('vendor/editors/pdfcraft/crates/ui-egui/tests/data/form.pdf');
      const received=await host.evaluate(arr=>{
        const data=Uint8Array.from(arr),bytes=data.buffer;
        document.getElementById('editor').contentWindow.postMessage(
          {type:'pdfcraft:open',name:'BIG LWA sample.pdf',requestId:'bridge-check',bytes},
          location.origin,[bytes]);
        return bytes.byteLength===0; // Transfer ownership to Rust app without duplicating it.
      },Array.from(fixture));
      if(!received)throw Error('Original PDF ArrayBuffer did not transfer to native editor');
      await host.waitForFunction(()=>window.__biglwaQueued==='bridge-check',null,{timeout:20000,polling:200});
      await host.waitForTimeout(1200);
      const opened=path.join(out,'fileR-import.png');
      await host.screenshot({path:opened,fullPage:false,timeout:30000});
      result.fileImport={ready:true,acknowledged:true,bytes:fixture.byteLength,screenshot:opened};
      console.log('FILE RUST IMPORT:',JSON.stringify(result.fileImport));
    }catch(error){
      result.fileImport={ready:false,error:String(error.message||error).slice(0,650)};
      throw error;
    }finally{
      fs.writeFileSync(path.join(out,name+'.json'),JSON.stringify(result,null,2));
      await host.close().catch(()=>{});
    }
  }
  fs.writeFileSync(path.join(out,name+'.json'),JSON.stringify(result,null,2));
  console.log('NATIVE BROWSER SMOKE:',JSON.stringify(result));
  if(!ready)throw Error(name+' did not reach a usable WASM canvas.');
  if(!title.toLowerCase().includes(name.toLowerCase()))throw Error('Missing BIG LWA editor title: '+title);
  if(errors.some(x=>x.includes('renderer crashed')))throw Error('Chromium editor renderer crashed.');
  if(httpFailures.some(f=>f.status>=400&&/\.wasm|\.js|favicon\.svg/.test(f.url)))throw Error(name+' native browser build has missing required assets: '+JSON.stringify(httpFailures));
  if(name==='keyframeR'&&errors.some(x=>/failed to start/i.test(x)))throw Error('keyframeR initialization failed.');
}
main().catch(error=>{console.error(error.stack||error);process.exitCode=1}).finally(async()=>{
  if(browser)await browser.close().catch(()=>{});
  server.close();
});
