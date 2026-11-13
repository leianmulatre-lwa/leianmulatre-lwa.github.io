import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {queryFreeVision} from './worker.mjs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('instant math parser handles arithmetic and linear equations without eval or network',()=>{
 const source=read('lwazi-math.js'),ctx={window:{},Math,Number,String,Intl,Date};
 vm.runInNewContext(source,ctx);
 const calc=q=>ctx.window.BigLWAMath.solve(q);
 for(const [q,expected] of [
   ['2+2','4'],['what is (8 + 2) * 3?','30'],['20% of 150','30'],
   ['sqrt(81) + 2^3','17'],['2x+3=11','x = 4'],['6/2','3'],
   ['2^3^2','512'],['5!','120'],['20÷4','5']
 ])assert.equal(calc(q)?.result,expected,q);
 for(const q of ['search for math books','2x^2=8','what is poetry?','https://example.org','1/0','process.exit(1)','42','x+2=3;alert(1)'])
   assert.equal(calc(q),null,q);
 assert.doesNotMatch(source,/\beval\(|\bFunction\(/);
});
test('math is shown automatically regardless of NPC or Deep and never forces inference',()=>{
 const source=read('user-search-results.js');
 assert.match(source,/var mathResult=window.BigLWAMath\?\.solve\(clean\)/);
 assert.match(source,/var aiActive=lwaziMode!=='off'&&!mathResult&&!options.imageOnly/);
 assert.match(source,/bl-lwazi-math-answer/);
 assert.match(source,/bl-lwazi-math-preview/);
 assert.match(source,/search\.addEventListener\('input',function\(\)/);
 assert.match(source,/openPanel\('Search by image',\{imageOnly:true\}\)/);
 assert.match(source,/if\(options\.imageOnly\|\|mathResult\)/);
 assert.match(source,/answer\.hidden=false/);
});
test('free Worker vision sends authenticated image messages to existing AI binding',async()=>{
 const image='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD';
 let called=0;
 const env={FREE_INFERENCE_ENABLED:'true',AI:{run:async(model,body)=>{
   called++;
   assert.equal(model,'@cf/google/gemma-4-26b-a4b-it');
   const message=body.messages.find(x=>x.role==='user');
   assert.equal(message.content[1].type,'image_url');
   assert.equal(message.content[1].image_url.url,image);
   assert.equal(message.content[0].text,'Describe flowers');
   return {response:'Two red flowers in a vase.'};
 }}};
 const success=await queryFreeVision('Describe flowers',image,env);
 assert.equal(success.answer,'Two red flowers in a vase.');
 assert.equal(called,1);
 assert.equal((await queryFreeVision('x',image,{FREE_INFERENCE_ENABLED:'false',AI:env.AI})).error,'free_inference_not_enabled');
 assert.equal((await queryFreeVision('x','https://untrusted.example/photo.jpg',env)).error,'invalid_image');
 assert.equal((await queryFreeVision('x','data:image/jpeg;base64,'+'a'.repeat(2800001),env)).error,'invalid_image');
});
test('image bridge requires consent, account authentication and local conversion',()=>{
 const bridge=read('lwazi-client.js'),worker=read('lwazi/worker.mjs');
 assert.match(bridge,/window\.__biglwaAskLwaziImage=askImage/);
 assert.match(bridge,/const token=await authToken\(\)/);
 assert.match(bridge,/window\.confirm\('Analyze this image with L’wazi/);
 assert.match(bridge,/canvas\.toDataURL\('image\/jpeg'/);
 assert.match(bridge,/\/api\/lwazi\/image/);
 assert.match(worker,/const identity=await verifyFirebaseToken\(token\)/);
 assert.match(worker,/if\(!allowlist\.has\(identity\.uid\)\)/);
 assert.match(worker,/const sizeLimit=isImageRequest\?MAX_IMAGE_BODY:MAX_BODY/);
 assert.match(worker,/if\(isImageRequest\)\{/);
 assert.match(worker,/VISION_MODELS/);
 assert.doesNotMatch(worker,/await queryProvider\([^)]*image/);
});
