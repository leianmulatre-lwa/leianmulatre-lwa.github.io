import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import worker from './cloudflare-worker-instagram.js';
const env=new Proxy({BIGLWA_PREVIEW:'true'},{get(target,key){if(key in target)return target[key];throw Error('Preview touched production binding: '+String(key));}});
const health=await worker.fetch(new Request('https://preview.example/health'),env);
assert.equal(health.status,200);assert.equal((await health.json()).socialLoginEnabled,false);
for(const path of ['/facebook-personal/start','/oauth/callback','/media/orbit-import','/sqwip/library']){
 const response=await worker.fetch(new Request('https://preview.example'+path,{method:'POST'}),env);
 assert.equal(response.status,503);
}
const config=readFileSync('wrangler.toml','utf8').split('[previews.vars]')[1];
assert.ok(config.includes('BIGLWA_PREVIEW = "true"'));
assert.ok(!config.includes('e438b6eecb074f428d8a7f92122b3ad8'));
assert.ok(!config.includes('bucket_name = "wallpaper-bucket"'));
console.log('PASS isolated preview health, disabled account routes and separate storage');
