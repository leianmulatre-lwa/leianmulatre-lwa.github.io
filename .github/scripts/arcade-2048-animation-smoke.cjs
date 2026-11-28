const assert=require('node:assert/strict'),fs=require('node:fs');const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:780,height:580},reducedMotion:'no-preference'});
 const errors=[];page.on('pageerror',error=>errors.push(String(error)));
 await page.route('https://biglwa.com/**',route=>new URL(route.request().url()).pathname==='/arcade-puzzles.html'?route.fulfill({contentType:'text/html',body:fs.readFileSync('arcade-puzzles.html','utf8')}):route.fulfill({status:404,body:''}));
 await page.addInitScript(()=>{Math.random=()=>0;window.tileFlights=[];const native=Element.prototype.animate;Element.prototype.animate=function(frames,options){if(this.classList.contains('tile-flight'))window.tileFlights.push({frames,options});return native.call(this,frames,options)}});
 await page.goto('https://biglwa.com/arcade-puzzles.html?game=2048&embed=1');
 await page.locator('#grid2048').focus();
 await page.keyboard.press('ArrowRight');
 await page.waitForFunction(()=>document.querySelector('#score').textContent==='4',null,{timeout:5000}).catch(async error=>{throw Error('Move failed: '+JSON.stringify({errors,state:await page.locator('#grid2048').innerText()}))});
 const animations=await page.evaluate(()=>window.tileFlights);
 assert.equal(animations.length,2,'Two real tile animations must have run, even if they finish before the test polls');
 assert(animations.every(a=>a.frames[0].transform!==a.frames[1].transform&&a.options.duration>0));
 assert.equal(await page.locator('.tile-flight').count(),0);
 assert.equal(await page.locator('#score').textContent(),'4');
 assert.equal(await page.locator('#best2048').textContent(),'4');
 assert.equal(await page.locator('#grid2048 [role="gridcell"]').count(),16);
 await page.getByRole('button',{name:'scores ★'}).click();
 assert.equal(await page.locator('#leader2048dialog').isVisible(),true);
 assert.match(await page.locator('#leader2048rows').innerText(),/1\s+4\s+4/);
 await page.getByRole('button',{name:'Close leaderboard'}).click();
 await page.reload();
 assert.equal(await page.locator('#best2048').textContent(),'4');
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.locator('#grid2048').focus();await page.keyboard.press('ArrowRight');
 assert.equal(await page.locator('.tile-flight').count(),0);
 assert.equal(await page.locator('#score').textContent(),'4');
 await page.getByRole('button',{name:'new game ↻'}).click();
 assert.equal(await page.locator('#score').textContent(),'0');
 assert.equal(await page.locator('#best2048').textContent(),'4');
 console.log('PASS 2048 moving blocks, score, saved personal leaderboard, reload, reduced motion and reset');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
