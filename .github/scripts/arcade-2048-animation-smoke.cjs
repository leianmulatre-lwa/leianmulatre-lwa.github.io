const assert=require('node:assert/strict'),fs=require('node:fs');const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:780,height:580}});
 await page.route('https://biglwa.com/**',route=>new URL(route.request().url()).pathname==='/arcade-puzzles.html'?route.fulfill({contentType:'text/html',body:fs.readFileSync('arcade-puzzles.html','utf8')}):route.fulfill({status:404,body:''}));
 await page.addInitScript(()=>{Math.random=()=>0});
 await page.goto('https://biglwa.com/arcade-puzzles.html?game=2048&embed=1');
 await page.locator('#grid2048').focus();
 await page.keyboard.press('ArrowRight');
 await page.locator('.tile-flight').first().waitFor({state:'attached'});
 assert.equal(await page.locator('.tile-flight').count(),2);
 await page.locator('.tile-flight').first().waitFor({state:'detached'});
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
