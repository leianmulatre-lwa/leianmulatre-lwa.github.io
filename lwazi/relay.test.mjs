import test from 'node:test';
import assert from 'node:assert/strict';
import {onRequestGet,onRequestPost} from '../functions/api/lwazi.js';

const request=(method,auth,body)=>new Request('https://staging.example/api/lwazi',{
 method,
 headers:{...(auth?{Authorization:auth}:{}),'Content-Type':'application/json'},
 ...(method==='POST'?{body}: {})
});
test('same-origin pilot health forwards only to fixed Worker',async()=>{
 const original=globalThis.fetch;let called='';
 globalThis.fetch=async url=>{called=String(url);return Response.json({service:'lwazi',identity:'lwazi-identity-1.0.0',ready:true})};
 try{
  const response=await onRequestGet();
  assert.equal(response.status,200);
  assert.match(called,/^https:\/\/biglwa-lwazi-pilot\.leianmulatre-284\.workers\.dev\/health$/);
  assert.deepEqual(await response.json(),{service:'lwazi',identity:'lwazi-identity-1.0.0',ready:true});
 }finally{globalThis.fetch=original}
});
test('relay requires bearer and does not accept oversized requests',async()=>{
 assert.equal((await onRequestPost({request:request('POST',null,'{}')})).status,401);
 assert.equal((await onRequestPost({request:request('POST','Bearer abc','x'.repeat(12001))})).status,413);
});
test('relay passes authenticated payload and streams response without storing credentials',async()=>{
 const original=globalThis.fetch;let target='',opts;
 globalThis.fetch=async(url,options)=>{
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
 }finally{globalThis.fetch=original}
});
test('upstream errors become opaque error codes',async()=>{
 const original=globalThis.fetch;
 globalThis.fetch=async()=>{throw Error('do not leak upstream secrets')};
 try{
  const response=await onRequestPost({request:request('POST','Bearer test','{}')});
  assert.equal(response.status,502);
  const txt=await response.text();
  assert.match(txt,/lwazi_pilot_unavailable/);
  assert.doesNotMatch(txt,/secret/);
 }finally{globalThis.fetch=original}
});
