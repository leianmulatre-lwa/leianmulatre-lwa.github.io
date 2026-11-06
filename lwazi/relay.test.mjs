import test from 'node:test';
import assert from 'node:assert/strict';
import {onRequestGet,onRequestPost} from '../functions/api/lwazi.js';

const request=(method,auth,body)=>new Request('https://staging.example/api/lwazi',{
 method,
 headers:{...(auth?{Authorization:auth}:{}),'Content-Type':'application/json'},
 ...(method==='POST'?{body}: {})
});
test('same-origin pilot health forwards only to fixed Worker',async()=>{
 let called='';
 const env={LWAZI_PILOT:{fetch:async url=>{called=String(url);return Response.json({service:'lwazi',identity:'lwazi-identity-1.0.0',ready:true})}}};
 {
  const response=await onRequestGet({env});
  assert.equal(response.status,200);
  assert.match(called,/^https:\/\/biglwa-lwazi-pilot\.leianmulatre-284\.workers\.dev\/health$/);
  assert.deepEqual(await response.json(),{service:'lwazi',identity:'lwazi-identity-1.0.0',ready:true});
 }
});
test('relay requires bearer and does not accept oversized requests',async()=>{
 const env={LWAZI_PILOT:{fetch:async()=>Response.json({})}};
 assert.equal((await onRequestPost({request:request('POST',null,'{}'),env})).status,401);
 assert.equal((await onRequestPost({request:request('POST','Bearer abc','x'.repeat(12001)),env})).status,413);
});
test('relay passes authenticated payload and streams response without storing credentials',async()=>{
 let target='',opts;
 const env={LWAZI_PILOT:{fetch:async(url,options)=>{
  target=String(url);opts=options;
  return new Response('data: {"type":"delta","text":"hi"}\n\n',{headers:{'Content-Type':'text/event-stream'}});
 };
 try{
  const response=await onRequestPost({request:request('POST','Bearer signed.payload.signature',JSON.stringify({question:'hello',mode:'fast'}))});
  assert.equal(response.status,200);
  assert.equal(response.headers.get('Cache-Control'),'no-store');
  assert.equal(target,'https://biglwa-lwazi-pilot.leianmulatre-284.workers.dev/api/lwazi');
  assert.equal(opts.headers.Authorization,'Bearer signed.payload.signature');
  assert.match(await response.text(),/"text":"hi"/);
 }
});
test('upstream errors become opaque error codes',async()=>{
 const env={LWAZI_PILOT:{fetch:async()=>{throw Error('do not leak upstream secrets')}}};
 {
  const response=await onRequestPost({request:request('POST','Bearer test','{}'),env});
  assert.equal(response.status,502);
  const txt=await response.text();
  assert.match(txt,/lwazi_pilot_unavailable/);
  assert.doesNotMatch(txt,/secret/);
 }
});
