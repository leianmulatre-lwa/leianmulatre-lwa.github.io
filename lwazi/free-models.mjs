/* L'wazi model registry: evidence/voice quality first, then latency and compute economy.
 * Multiple Workers AI models SHARE an account's free daily neuron allocation.
 * The router must NEVER interpret that shared limit as permission to use paid APIs. */
export const FREE_MODELS=Object.freeze([
  {id:'qwen',model:'@cf/qwen/qwen3.8-27b',label:'Qwen 3.8 27B',strength:'Evidence-rich analysis, multilingual research, deep reasoning and coding',scores:{research:5,code:5,voice:4,latency:2}},
  {id:'gemma',model:'@cf/google/gemma-4-26b-a4b-it',label:'Gemma 4 26B A4B',strength:'Nuanced conversational voice, care and balanced reasoning',scores:{research:4,code:4,voice:5,latency:4}},
  {id:'gptoss',model:'@cf/openai/gpt-oss-120b',label:'GPT-OSS 120B',strength:'Complex reasoning and code problem solving',scores:{research:5,code:5,voice:3,latency:2}},
  {id:'glm',model:'@cf/zai-org/glm-4.7-flash',label:'GLM 4.7 Flash',strength:'Fast multilingual and tool-related assistance',scores:{research:3,code:4,voice:3,latency:5}},
  {id:'mistral',model:'@cf/mistralai/mistral-small-3.1-24b-instruct',label:'Mistral Small 3.1 24B',strength:'Alternative multilingual, source-aware generalist',scores:{research:3,code:4,voice:4,latency:3}},
  {id:'llama',model:'@cf/meta/llama-4-scout-17b-16e-instruct',label:'Llama 4 Scout',strength:'General-purpose and multimodal fallback',scores:{research:3,code:3,voice:3,latency:3}},
  {id:'granite',model:'@cf/ibm-granite/granite-4.0-h-micro',label:'Granite 4.0 H Micro',strength:'Economical last-resort instruction following',scores:{research:2,code:3,voice:3,latency:5}}
]);
const MODES={
  fast:['gemma','glm','qwen','mistral','llama','granite','gptoss'],
  research:['qwen','gemma','gptoss','mistral','glm','llama','granite'],
  deep:['qwen','gptoss','gemma','glm','mistral','llama','granite'],
  code:['gptoss','qwen','glm','gemma','mistral','llama','granite']
};
export const MAX_INFERENCE_ATTEMPTS=3;
export const MODEL_COOLDOWN_MS=120000;
export function rankedFreeModels(mode){
  const ids=MODES[mode]||MODES.fast;
  return ids.map(id=>FREE_MODELS.find(m=>m.id===id)).filter(Boolean);
}
export function inferenceOptions(model,mode){
  const deep=mode==='deep';
  const opts={stream:true,messages:[],max_tokens:deep?1250:mode==='code'?950:mode==='research'?850:600};
  if(model.id==='gemma')opts.chat_template_kwargs={enable_thinking:deep};
  if(model.id==='qwen'){
    opts.reasoning_effort=deep?'xhigh':mode==='research'||mode==='code'?'medium':'low';
    opts.max_completion_tokens=opts.max_tokens;
    delete opts.max_tokens;
  }
  if(model.id==='gptoss')opts.reasoning_effort=deep?'high':mode==='research'||mode==='code'?'medium':'low';
  return opts;
}
export function classifyInferenceFailure(error){
  const text=String(error&&typeof error==='object'?(error.message||error.error||error):error||'').toLowerCase();
  const code=String(error?.code||error?.status||'').toLowerCase();
  if(/(neurons|neuron allocation|free allocation|daily quota|daily allowance|daily limit|quota exceeded|balance insufficient|billing|payment required|402)/i.test(text) || code==='402')return 'shared_quota_or_billing';
  if(/(5035|paid plan required|requires a paid|workers paid|paid model|upgrade your plan)/.test(text))return 'model_requires_paid_plan';
  if(/(3040|out of capacity|model unavailable|rate limit|429|503|502|504|busy|overloaded|timeout|temporarily unavailable)/.test(text)||['429','503','502','504'].includes(code))return 'temporary_model_failure';
  return 'model_failure';
}
export function maxAttempts(){return MAX_INFERENCE_ATTEMPTS}
