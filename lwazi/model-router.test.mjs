import test from 'node:test';
import assert from 'node:assert/strict';
import {FREE_MODELS,rankedFreeModels,inferenceOptions,classifyInferenceFailure,MAX_INFERENCE_ATTEMPTS} from './free-models.mjs';
import {queryFreeModel,resetModelCooldownsForTest} from './worker.mjs';

function sse(message){
  return new ReadableStream({start(controller){
    controller.enqueue(new TextEncoder().encode('data: '+JSON.stringify({choices:[{delta:{content:message}}]})+'\n\ndata: [DONE]\n\n'));
    controller.close();
  }});
}
const envFrom=fn=>({FREE_INFERENCE_ENABLED:'true',AI:{run:fn}});
test('ranked model list excludes deprecated and paid-only releases; none can call proprietary providers',()=>{
  assert.equal(FREE_MODELS.length,7);
  const ids=FREE_MODELS.map(x=>x.model);
  assert.equal(new Set(ids).size,ids.length);
  assert.equal(ids.some(x=>/kimi-k2|glm-5|deepseek-v4|nemotron-3-120b-a12b|qwen3-30b-a3b/.test(x)),false);
  for(const mode of ['fast','research','deep','code'])assert.deepEqual(new Set(rankedFreeModels(mode).map(x=>x.id)),new Set(FREE_MODELS.map(x=>x.id)));
  assert.equal(rankedFreeModels('fast')[0].id,'gemma');
  assert.equal(rankedFreeModels('research')[0].id,'qwen');
  assert.equal(rankedFreeModels('code')[0].id,'gptoss');
  assert.equal(rankedFreeModels('deep')[0].id,'qwen');
  assert.equal(inferenceOptions(rankedFreeModels('deep')[0],'deep').reasoning_effort,'xhigh');
  assert.equal(inferenceOptions(rankedFreeModels('fast')[0],'fast').chat_template_kwargs.enable_thinking,false);
});
test('temporary model outage activates next-ranked free model; favorite returns after cooldown',async()=>{
  resetModelCooldownsForTest();
  const calls=[],base=4e6;
  let failPreferred=true;
  const env=envFrom(async model=>{
    calls.push(model);
    if(model.includes('/gemma-4')&&failPreferred)throw Error('3040 out of capacity');
    return sse('ready');
  });
  const first=await queryFreeModel('fast','hi',[],env,()=>base);
  assert.equal(first.model,rankedFreeModels('fast')[1].model);
  assert.equal(first.attempts,2);
  assert.match(await new Response(first.body).text(),/ready/);
  failPreferred=false;
  const next=await queryFreeModel('fast','hi',[],env,()=>base+1000);
  assert.equal(next.model,rankedFreeModels('fast')[1].model,'avoid thundering herd during temporary cooldown');
  const recovered=await queryFreeModel('fast','hi',[],env,()=>base+130000);
  assert.equal(recovered.model,rankedFreeModels('fast')[0].model,'top-rank model automatically recovers');
});
test('daily shared free-neuron exhaustion stops instead of walking the list',async()=>{
  resetModelCooldownsForTest();
  let calls=0;
  const env=envFrom(async()=>{calls++;throw Error('Workers AI daily quota exceeded: free allocation exhausted')});
  const result=await queryFreeModel('research','citations',[],env,()=>8e6);
  assert.equal(result.error,'shared_free_quota_exhausted');
  assert.equal(calls,1,'do not retry against any other free model when shared quota is gone');
  assert.equal(classifyInferenceFailure({message:'free neuron daily allowance reached'}),'shared_quota_or_billing');
});
test('unavailable models use bounded retries, no paid provider invocation',async()=>{
  resetModelCooldownsForTest();
  const calls=[];
  const env=envFrom(async model=>{calls.push(model);throw Error('429 out of capacity')});
  const result=await queryFreeModel('code','fix a syntax error',[],env,()=>13e6);
  assert.equal(result.error,'free_model_unavailable');
  assert.equal(result.attempts,MAX_INFERENCE_ATTEMPTS);
  assert.equal(calls.length,MAX_INFERENCE_ATTEMPTS);
  assert.equal(new Set(calls).size,MAX_INFERENCE_ATTEMPTS);
});
test('errors requiring paid access do not activate a billing path',async()=>{
  resetModelCooldownsForTest();
  const calls=[];
  const env=envFrom(async model=>{
    calls.push(model);
    if(calls.length===1)throw Error('5035 this model requires a paid plan');
    return sse('safe');
  });
  const result=await queryFreeModel('research','Explain',[],env,()=>18e6);
  assert.equal(result.provider,'cloudflare');
  assert.equal(calls.length,2);
  assert.match(await new Response(result.body).text(),/safe/);
});
