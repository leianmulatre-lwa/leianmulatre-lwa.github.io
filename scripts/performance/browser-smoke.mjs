#!/usr/bin/env node
/* Public, unsigned Studio/Legal/Map route snapshots and web vital samples.
 * Uses a localhost static server and Playwright Chromium. No account login.
 * Usage: node scripts/performance/browser-smoke.mjs --base=http://127.0.0.1:8765 --out=... 
 */
import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';
const option=(prefix,fallback)=>process.argv.find(x=>x.startsWith(prefix+'='))?.slice(prefix.length+1)||fallback;
const base=option('--base','http://127.0.0.1:8765');
const out=path.resolve(option('--out','dist/browser-snapshots'));
fs.mkdirSync(out,{recursive:true});
const routes=[
 {path:'/',slug:'landing'},
 {path:'/studio/',slug:'studio'},
 {path:'/legal/',slug:'important'},
 {path:'/privacy/',slug:'privacy'},
 {path:'/terms/',slug:'terms'},
 {path:'/map-app.html',slug:'map'}
];
const devices=[
 {name:'desktop',viewport:{width:1440,height:900},isMobile:false},
 {name:'mobile',viewport:{width:390,height:844},isMobile:true,deviceScaleFactor:1}
];
const results=[];
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const device of devices){
  const context=await browser.newContext({viewport:device.viewport,isMobile:device.isMobile,
   deviceScaleFactor:device.deviceScaleFactor||1,serviceWorkers:'block'});
  for(const route of routes){
   const page=await context.newPage();
   const broken=[],consoleErrors=[],bytes={sameOrigin:0,scripts:0,styles:0,images:0};
   let shift=0,largestPaint=0;
   await page.addInitScript(()=>{
    window.__biglwaVitals={cls:0,lcp:0};
    try{
     new PerformanceObserver(list=>{
      for(const entry of list.getEntries())if(!entry.hadRecentInput)
       window.__biglwaVitals.cls+=entry.value;
     }).observe({type:'layout-shift',buffered:true});
     new PerformanceObserver(list=>{
      const entries=list.getEntries(),last=entries[entries.length-1];
      if(last)window.__biglwaVitals.lcp=last.startTime;
     }).observe({type:'largest-contentful-paint',buffered:true});
    }catch{}
   });
   page.on('response',resp=>{
    try{
     const u=new URL(resp.url());
     if(u.origin!==new URL(base).origin)return;
     const type=resp.request().resourceType();
     const contentLen=Number(resp.headers()['content-length']||0);
     bytes.sameOrigin+=contentLen;
     if(type==='script')bytes.scripts+=contentLen;
     else if(type==='stylesheet')bytes.styles+=contentLen;
     else if(type==='image')bytes.images+=contentLen;
     if(resp.status()>=400)broken.push({path:u.pathname,status:resp.status()});
    }catch{}
   });
   page.on('pageerror',error=>consoleErrors.push(String(error.message||error).slice(0,200)));
   let response=null,navError=null;
   try{
    response=await page.goto(new URL(route.path,base).href,{waitUntil:'domcontentloaded',timeout:25000});
    await page.waitForTimeout(1400);
   }catch(e){navError=String(e.message||e).slice(0,240)}
   const metrics=await page.evaluate(()=>{
    const nav=performance.getEntriesByType('navigation')[0];
    const paint=performance.getEntriesByType('paint');
    const pick=name=>Math.round(paint.find(x=>x.name===name)?.startTime||0);
    const timings={domContentLoaded:Math.round(nav?.domContentLoadedEventEnd||0),
     ttfb:Math.round(nav?.responseStart||0),fcp:pick('first-contentful-paint'),
     load:Math.round(nav?.loadEventEnd||0),
     jsResourceCount:performance.getEntriesByType('resource').filter(x=>x.initiatorType==='script').length};
    return {timings,cls:window.__biglwaVitals?.cls||0,
     lcp:Math.round(window.__biglwaVitals?.lcp||0),
     title:document.title,visibleH1:document.querySelector('h1')?.textContent?.trim()?.slice(0,100)||'',
     bodyText:document.body?.innerText?.slice(0,240)||''};
   }).catch(()=>({}));
   const screenshot=path.join(out,device.name+'-'+route.slug+'.png');
   try{await page.screenshot({path:screenshot,animations:'disabled',fullPage:route.slug==='important'||route.slug==='privacy',timeout:12000})}
   catch(e){consoleErrors.push('Screenshot '+String(e.message||e).slice(0,100))}
   results.push({device:device.name,route:route.path,httpStatus:response?.status()||0,
    navError,brokenSameOrigin:[...new Map(broken.map(x=>[x.path,x])).values()].slice(0,12),
    pageErrors:consoleErrors.slice(0,12),bytes,metrics,screenshot:path.basename(screenshot)});
   await page.close();
  }
  await context.close();
 }
}finally{await browser.close()}
const checks=results.filter(x=>x.httpStatus!==200||x.navError||
 (x.route==='/legal/'&&!/Know your space|Important/i.test(x.metrics?.bodyText||'')));
const report={schema:'biglwa.public-browser-audit.v1',capturedAt:new Date().toISOString(),
 base,authentication:'signed-out only; dedicated non-personal test account needed for signed-in',
 screenshots:'public pages; no user account information',
 summary:{routesTested:results.length,routeFailures:checks.length},
 results};
fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({summary:report.summary,failures:checks,results:results.map(r=>({route:r.route,device:r.device,status:r.httpStatus,ttfb:r.metrics?.timings?.ttfb,fcp:r.metrics?.timings?.fcp,lcp:r.metrics?.lcp,cls:r.metrics?.cls,bytes:r.bytes.sameOrigin,errors:r.pageErrors.length}))},null,2));
if(checks.length)process.exitCode=1;
