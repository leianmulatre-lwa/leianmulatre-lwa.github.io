import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import worker,{verifyFirebaseToken,extractText,normalizeStream,queryProvider,queryFreeModel} from './worker.mjs';
import {routeMode,publicContext,buildQuestion,SYSTEM_POLICY} from './policy.mjs';

globalThis.crypto ||= webcrypto;
const now=()=>Math.floor(Date.now()/1000);
const asUrl=value=>Buffer.from(value).toString('base64url');
const newKey=()=>crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
const baseEnv={LWAZI_ALLOWED_UIDS:'pilot-member',DEEPSEEK_API_KEY:'a-test-value',ANTHROPIC_API_KEY:'a-second-test-value'};
function req(body, token, origin='https://biglwa.com'){
  return new Request('https://pilot.example/api/lwazi',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(body)});
}
let nextKid=0;
async function tokenFixture(){
  const kid='test-key-'+(++nextKid);
  const pair=await newKey();const jwk=await crypto.subtle.exportKey('jwk',pair.publicKey);
  jwk.kid=kid;
  const make=async(overrides={})=>{
    const header=asUrl(JSON.stringify({typ:'JWT',alg:'RS256',kid}));
    const payload=asUrl(JSON.stringify({aud:'biglwa',iss:'https://securetoken.google.com/biglwa',sub:'pilot-member',iat:now()-30,exp:now()+300,...overrides}));
    const toSign=header+'.'+payload;
    const sig=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',pair.privateKey,new TextEncoder().encode(toSign));
    return toSign+'.'+Buffer.from(sig).toString('base64url');
  };
  return {jwk,make};
}
test('routing and identity are distinct from provider model',()=>{
  assert.equal(routeMode('hey'), 'fast');
  assert.equal(routeMode('can you refactor this CSS?'), 'code');
  assert.equal(routeMode('What is the history of political representation?'),'research');
  assert.equal(routeMode('hello','research'),'research');
  assert.match(SYSTEM_POLICY,/privacy/i);
  assert.match(SYSTEM_POLICY,/women/i);
  assert.match(SYSTEM_POLICY,/sources?/i);
  assert.doesNotMatch(SYSTEM_POLICY,/always agree with/i);
});
test('public context is bounded and excludes private or non-HTTPS references',()=>{
  const data=publicContext([
    {title:'Good',snippet:'a'.repeat(500),url:'https://example.org/study'},
    {title:'Local',snippet:'private',url:'file:///Users/me/journal'},
    {title:'HTTP',snippet:'private',url:'http://example.org'},
    {title:'Auth in URL',url:'https://user:pass@example.org'}
  ]);
  assert.equal(data.length,1);
  assert.equal(data[0].snippet.length,400);
  assert.match(buildQuestion('why',data),/discovery references/i);
});
test('adapters keep only displayed answer text, not internal reasoning',()=>{
  assert.equal(extractText('deepseek',{choices:[{delta:{content:'Hi',reasoning_content:'secret'}}]}),'Hi');
  assert.equal(extractText('anthropic',{type:'content_block_delta',delta:{type:'text_delta',text:'Hello'}}),'Hello');
  assert.equal(extractText('anthropic',{type:'content_block_delta',delta:{type:'thinking_delta',thinking:'not for display'}}),'');
});
test('stream transform reassembles chunks and emits model-neutral events',async()=>{
  const source=new ReadableStream({start(controller){
    controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Hel'));
    controller.enqueue(new TextEncoder().encode('lo"}}]}\n\ndata: {"choices":[{"delta":{"content":" there"}}]}\n\ndata: [DONE]\n\n'));
    controller.close();
  }});
  const text=await new Response(normalizeStream(source,'deepseek','fast')).text();
  assert.match(text,/Hello/);
  assert.match(text,/ there/);
  assert.match(text,/"type":"done"/);
});
test('provider calls are streamed and routed without leaking secrets in the model payload',async()=>{
  const seen=[];
  const fake=async(url,opts)=>{
    seen.push({url,headers:opts.headers,body:JSON.parse(opts.body)});
    return new Response('data: {"choices":[{"delta":{"content":"Yes."}}]}\n\ndata: [DONE]\n\n',{headers:{'content-type':'text/event-stream'}});
  };
  const result=await queryProvider('fast','hi',[{title:'Source',url:'https://example.org'}],baseEnv,fake);
  assert.equal(result.provider,'deepseek');
  assert.equal(seen[0].body.thinking.type,'disabled');
  assert.equal(seen[0].body.model,'deepseek-flash');
  assert.doesNotMatch(JSON.stringify(seen[0].body),/a-test-value/);
  assert.match(await new Response(result.body).text(),/Yes/);
});
test('DeepSeek 402 is reported as an actionable billing condition, without charging retry loops',async()=>{
  let calls=0;
  const fake=async()=>{calls++;return new Response(JSON.stringify({error:{message:'insufficient balance'}}),{status:402,headers:{'content-type':'application/json'}})};
  const result=await queryProvider('fast','hello',[],baseEnv,fake,'deepseek');
  assert.equal(result.error,'provider_billing_required');
  assert.equal(result.provider,'deepseek');
  assert.equal(result.upstream_status,402);
  assert.equal(calls,1);
});
test('staging origins receive CORS but arbitrary origins are denied',async()=>{
 const origins=['https://biglwa-web-staging.pages.dev','https://34bd76dd.biglwa-web-staging.pages.dev'];
 for(const origin of origins){
  const response=await worker.fetch(new Request('https://pilot.example/health',{headers:{Origin:origin}}),baseEnv);
  assert.equal(response.status,200);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'),origin);
  const preflight=await worker.fetch(new Request('https://pilot.example/api/lwazi',{method:'OPTIONS',headers:{Origin:origin,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'Authorization,Content-Type'}}),baseEnv);
  assert.equal(preflight.status,204);
  assert.match(preflight.headers.get('Access-Control-Allow-Headers'),/Authorization/);
 }
 const evil=await worker.fetch(new Request('https://pilot.example/health',{headers:{Origin:'https://evilbiglwa-web-staging.pages.dev.attacker.com'}}),baseEnv);
 assert.equal(evil.status,403);
});
test('Cloudflare Gemma streaming uses the observed choices delta content format',async()=>{
  const input='data: {"object":"chat.completion.chunk","choices":[{"delta":{"reasoning_content":null,"content":"Hello from Gemma"}}]}\n\n'
    +'data: {"choices":[{"delta":{"content":"!"}}]}\n\n'
    +'data: [DONE]\n\n';
  const stream=new ReadableStream({start(controller){controller.enqueue(new TextEncoder().encode(input));controller.close()}});
  const response=await new Response(normalizeStream(stream,'cloudflare','fast','@cf/google/gemma-4-26b-a4b-it')).text();
  assert.match(response,/Hello from Gemma/);
  assert.match(response,/"text":"!"/);
  assert.match(response,/"provider":"cloudflare"/);
  assert.match(response,/"type":"done"/);
  assert.doesNotMatch(response,/reasoning_content/);
});
test('free-only mode never invokes paid providers even when keys exist',async()=>{
 const env={...baseEnv};
 let called=0;
 const cloud={AI:{run:async(model,payload)=>{
   called++;assert.equal(model,'@cf/google/gemma-4-26b-a4b-it');
   assert.equal(payload.chat_template_kwargs.enable_thinking,false);
   const input=JSON.stringify(payload.messages);assert.match(input,/L’wazi/);
   return new ReadableStream({start(c){
     c.enqueue(new TextEncoder().encode('data: {"response":"A helpful answer."}\n\n'));
     c.close();
   }});
 }},FREE_INFERENCE_ENABLED:'true'};
 const res=await queryFreeModel('fast','Hi',[],cloud);
 assert.equal(called,1);
 assert.equal(res.provider,'cloudflare');
 const data=await new Response(res.body).text();
 assert.match(data,/A helpful answer/);
 assert.match(data,/"type":"meta"/);
 assert.match(data,/"type":"done"/);
 assert.equal((await queryFreeModel('fast','Hi',[],env)).error,'free_inference_not_enabled');
});
test('paid providers are blocked by default even with stored API keys',async()=>{
 const fixture=await tokenFixture(),valid=await fixture.make();
 const original=globalThis.fetch;let paidCalled=false;
 globalThis.fetch=async(url)=>{
  if(String(url).includes('googleapis.com'))return Response.json({keys:[fixture.jwk]});
  paidCalled=true;throw Error('paid request should never occur');
 };
 try{
   const res=await worker.fetch(req({question:'Hi',provider:'deepseek'},valid),baseEnv);
   assert.equal(res.status,403);
   assert.equal((await res.json()).error,'paid_providers_disabled');
   assert.equal(paidCalled,false);
 }finally{globalThis.fetch=original}
});
test('auth and isolated pilot are enforced, end-to-end response streams',async()=>{
  const fixture=await tokenFixture(),valid=await fixture.make();
  const original=globalThis.fetch;
  const requests=[];
  globalThis.fetch=async(url,opts)=>{
    requests.push(String(url));
    if(String(url).includes('googleapis.com'))return new Response(JSON.stringify({keys:[fixture.jwk]}),{headers:{'Content-Type':'application/json'}});
    if(String(url).includes('api.deepseek.com'))return new Response('data: {"choices":[{"delta":{"content":"L’wazi speaks."}}]}\n\ndata: [DONE]\n\n',{headers:{'Content-Type':'text/event-stream'}});
    throw Error('Unexpected remote request '+url);
  };
  try{
    assert.deepEqual(await verifyFirebaseToken(valid),{uid:'pilot-member'});
    assert.equal(await verifyFirebaseToken(await fixture.make({aud:'other'})),null);
    const denied=await worker.fetch(req({question:'hi'},'bad-token'),baseEnv);
    assert.equal(denied.status,401);
    const notEnabled=await worker.fetch(req({question:'hi'},valid),{DEEPSEEK_API_KEY:'a-test-value'});
    assert.equal(notEnabled.status,503);
    const wrongOrigin=await worker.fetch(req({question:'hi'},valid,'https://untrusted.example'),baseEnv);
    assert.equal(wrongOrigin.status,403);
    const long=await worker.fetch(req({question:'x'.repeat(1600)},valid),baseEnv);
    assert.equal(long.status,400);
    const ok=await worker.fetch(req({question:'hi',provider:'deepseek'},valid),{...baseEnv,ALLOW_PAID_PROVIDERS:'true'});
    assert.equal(ok.status,200);
    assert.equal(ok.headers.get('Access-Control-Allow-Origin'),'https://biglwa.com');
    const output=await ok.text();
    assert.match(output,/L’wazi speaks/);
    assert.match(output,/"type":"done"/);
    assert.equal(requests.some(x=>x.includes('api.deepseek.com')),true);
    const health=await worker.fetch(new Request('https://pilot.example/health'),baseEnv);
    assert.equal(health.status,200);
    assert.equal((await health.json()).ready,false);
  }finally{globalThis.fetch=original}
});
