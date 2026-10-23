/* BIG LWA production browser proof: Rust/WASM files must actually start
 * beneath the final /bigapps/<brand>/ URL, not merely at localhost /.
 */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { once } = require('node:events');
const root = path.resolve(process.argv[2] || '');
const named = ['lightR','paintR','keyframeR','fileR'];
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css',
 '.wasm':'application/wasm','.json':'application/json','.svg':'image/svg+xml',
 '.png':'image/png','.woff2':'font/woff2','.otf':'font/otf'};
const server = http.createServer((req,res)=>{
 let pathname;
 try {pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);}
 catch {res.writeHead(400);res.end();return;}
 let target = path.resolve(root,'.'+pathname);
 if(!target.startsWith(root + path.sep)){res.writeHead(403);res.end();return;}
 if(pathname.endsWith('/'))target=path.join(target,'index.html');
 fs.stat(target,(err,stat)=>{
   if(err||!stat.isFile()){res.writeHead(404);res.end();return;}
   res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');
   res.setHeader('Cache-Control','no-store');
   fs.createReadStream(target).pipe(res);
 });
});
(async()=>{
 server.listen(0,'127.0.0.1');await once(server,'listening');
 const url='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,args:[
  '--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader',
  '--enable-unsafe-swiftshader','--disable-gpu-sandbox']});
 let failed=false;
 try{
  for(const name of named){
   const page=await browser.newPage({viewport:{width:1440,height:900}});
   const broken=[],errors=[];
   page.on('response',r=>{
    if(r.status()>=400 && /\.(wasm|js|css|svg)(?:\?|$)/.test(r.url()))
      broken.push({status:r.status(),url:r.url()});
   });
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(url+'/bigapps/'+name+'/',{waitUntil:'domcontentloaded',timeout:60000});
   try{
     await page.waitForFunction(()=>{
       const c=document.querySelector('canvas');
       return !!c && c.width>=640 && c.height>=380;
     },null,{timeout:85000,polling:500});
     await page.waitForTimeout(1400);
     if(broken.length)throw Error('Missing required assets: '+JSON.stringify(broken.slice(0,8)));
     if(errors.some(e=>/WebAssembly|wasm|start.*failed|uncaught/i.test(e)))
        throw Error('Editor runtime errors: '+errors.slice(0,6).join(', '));
     const title=await page.title();
     if(!title.toLowerCase().includes(name.toLowerCase()))throw Error('Missing brand title: '+title);
     console.log('PASS '+name+': /bigapps/'+name+'/ rendered WebAssembly editing canvas and assets');
   }catch(e){failed=true;console.error('FAIL '+name+': '+e.message);}
   finally{await page.close();}
  }
 }finally{await browser.close();server.close();}
 if(failed)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
