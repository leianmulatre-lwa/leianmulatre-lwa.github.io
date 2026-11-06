/* L'wazi isolated inference Worker v1. Read-only conversation, no site mutations. */
import {IDENTITY_VERSION,SYSTEM_POLICY,routeMode,publicContext,buildQuestion} from './policy.mjs';

const PROJECT='biglwa';
const JWT_KEYS='https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
const encoder=new TextEncoder();
const JSON_HEADERS={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'};
const MAX_BODY=12000;
let jwksCache=null,jwksCacheUntil=0;
async function googleKeys(fetcher,force=false){
  if(!force&&jwksCache&&Date.now()<jwksCacheUntil)return jwksCache;
  const response=await fetcher(JWT_KEYS,{signal:AbortSignal.timeout(5000)});
  if(!response.ok)throw Error('Firebase verification keys unavailable');
  const data=await response.json();
  if(!Array.isArray(data.keys))throw Error('Invalid Firebase verification keys');
  jwksCache=data;jwksCacheUntil=Date.now()+5*60*1000;
  return data;
}

function origins(env){return new Set(String(env.ALLOWED_ORIGINS||'https://biglwa.com,https://www.biglwa.com').split(',').map(x=>x.trim()).filter(Boolean))}
function isAllowedOrigin(origin,env){
  if(!origin)return true;
  if(origins(env).has(origin))return true;
  try{
    const parsed=new URL(origin);
    return parsed.protocol==='https:' && !parsed.username && !parsed.password &&
      (parsed.hostname==='biglwa-web-staging.pages.dev'||parsed.hostname.endsWith('.biglwa-web-staging.pages.dev')) &&
      parsed.origin===origin;
  }catch{return false}
}
function cors(origin,env){
  const h={'Vary':'Origin','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
  if(origin&&isAllowedOrigin(origin,env)){h['Access-Control-Allow-Origin']=origin;h['Access-Control-Allow-Headers']='Authorization, Content-Type';h['Access-Control-Allow-Methods']='POST, GET, OPTIONS';h['Access-Control-Max-Age']='600'}
  return h;
}
function json(body,status=200,headers={}){return new Response(JSON.stringify(body),{status,headers:{...JSON_HEADERS,...headers}})}
function bearer(req){const auth=req.headers.get('Authorization')||'';return /^Bearer [^\s]+$/.test(auth)?auth.slice(7):''}
function b64u(segment){
  const padded=segment.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-segment.length%4)%4);
  const binary=atob(padded);return Uint8Array.from(binary,c=>c.charCodeAt(0));
}
export async function verifyFirebaseToken(jwt,fetcher=fetch){
  if(!jwt || jwt.length>5000) return null;
  const parts=jwt.split('.');if(parts.length!==3)return null;
  let header,payload;
  try {header=JSON.parse(new TextDecoder().decode(b64u(parts[0])));payload=JSON.parse(new TextDecoder().decode(b64u(parts[1])))}catch{return null}
  const now=Math.floor(Date.now()/1000);
  if(header.alg!=='RS256'||typeof header.kid!=='string'||!header.kid||
     payload.aud!==PROJECT||payload.iss!=='https://securetoken.google.com/'+PROJECT||
     typeof payload.sub!=='string'||!payload.sub||payload.sub.length>128||
     !Number.isFinite(payload.exp)||payload.exp<=now||
     !Number.isFinite(payload.iat)||payload.iat>now+30||payload.iat<now-14*24*3600) return null;
  try {
    let keys=await googleKeys(fetcher);
    let jwk=keys.keys.find(k=>k.kid===header.kid&&k.kty==='RSA'&&(!k.alg||k.alg==='RS256'));
    // A newly rotated Google signing key may not be in our short-lived cache.
    if(!jwk){keys=await googleKeys(fetcher,true);jwk=keys.keys.find(k=>k.kid===header.kid&&k.kty==='RSA'&&(!k.alg||k.alg==='RS256'))}
    if(!jwk)return null;
    const publicKey=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
    const valid=await crypto.subtle.verify('RSASSA-PKCS1-v1_5',publicKey,b64u(parts[2]),encoder.encode(parts[0]+'.'+parts[1]));
    return valid?{uid:payload.sub}:null;
  }catch{return null}
}
function buildProvider(provider, mode, question, context, env){
  const full=buildQuestion(question,context);
  const common=[{role:'system',content:SYSTEM_POLICY},{role:'user',content:full}];
  if(provider==='deepseek'){
    return {url:'https://api.deepseek.com/chat/completions',
      headers:{Authorization:'Bearer '+env.DEEPSEEK_API_KEY,'Content-Type':'application/json'},
      body:{model:env.DEEPSEEK_MODEL||'deepseek-flash',messages:common,stream:true,max_tokens:1300,thinking:{type:'disabled'}}};
  }
  return {url:'https://api.anthropic.com/v1/messages',
    headers:{'x-api-key':env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01','Content-Type':'application/json'},
    body:{model:mode==='code'?(env.CLAUDE_CODE_MODEL||'claude-opus-5'):(env.CLAUDE_RESEARCH_MODEL||'claude-sonnet-5'),
      max_tokens:1600,system:SYSTEM_POLICY,messages:[{role:'user',content:full}],stream:true}};
}
export function extractText(provider,data){
  if(!data||typeof data!=='object')return '';
  if(provider==='anthropic')return data.type==='content_block_delta'&&data.delta?.type==='text_delta'?String(data.delta.text||''):'';
  return typeof data.choices?.[0]?.delta?.content==='string'?data.choices[0].delta.content:'';
}
function writeEvent(controller,event){controller.enqueue(encoder.encode('data: '+JSON.stringify(event)+'\n\n'))}
export function normalizeStream(upstream,provider,mode,model){
  const decoder=new TextDecoder();let buffer='',outputChars=0,hasError=false;
  const transform=new TransformStream({
    start(controller){writeEvent(controller,{type:'meta',provider,model:model||null,mode})},
    transform(chunk,controller){
      buffer+=decoder.decode(chunk,{stream:true});
      buffer=buffer.replace(/\r\n/g,'\n');
      let end;
      while((end=buffer.indexOf('\n\n'))!==-1){
        const block=buffer.slice(0,end);buffer=buffer.slice(end+2);
        const data=block.split('\n').filter(line=>line.startsWith('data:')).map(line=>line.slice(5).trimStart()).join('\n');
        if(!data||data==='[DONE]')continue;
        let parsed;try{parsed=JSON.parse(data)}catch{continue}
        if(parsed.type==='error'||parsed.error){
          hasError=true;writeEvent(controller,{type:'error',code:'provider_stream_error'});continue;
        }
        const delta=extractText(provider,parsed);
        if(delta&&!hasError&&outputChars<12000){
          const safe=delta.slice(0,12000-outputChars);outputChars+=safe.length;
          writeEvent(controller,{type:'delta',text:safe});
        }
      }
    },
    flush(controller){
      if(!hasError&&outputChars===0)writeEvent(controller,{type:'error',code:'empty_response'});
      else if(!hasError)writeEvent(controller,{type:'done',mode});
    }
  });
  return upstream.pipeThrough(transform);
}
export async function queryProvider(mode,question,context,env,fetcher=fetch,requiredProvider=null){
  const preferred=requiredProvider?[requiredProvider]:(mode==='fast'?['deepseek','anthropic']:['anthropic','deepseek']);
  let attempted=false,lastCode='providers_unavailable',lastProvider=null,lastUpstreamStatus=null;
  for(const name of preferred){
    if(name==='deepseek'&&!env.DEEPSEEK_API_KEY)continue;
    if(name==='anthropic'&&!env.ANTHROPIC_API_KEY)continue;
    attempted=true;lastProvider=name;
    const spec=buildProvider(name,mode,question,context,env);
    try{
      // Per-provider deadline includes streamed output and cannot hang indefinitely.
      const response=await fetcher(spec.url,{method:'POST',headers:spec.headers,body:JSON.stringify(spec.body),signal:AbortSignal.timeout(30000)});
      if(!response.ok){
        lastUpstreamStatus=response.status;
        lastCode=response.status===402?'provider_billing_required':'provider_http_'+response.status;
        continue;
      }
      if(!response.body){lastCode='empty_provider_stream';continue}
      return {provider:name,model:spec.body.model,body:normalizeStream(response.body,name,mode,spec.body.model)};
    }catch{/* Try the other configured provider once; no client secrets or prompts logged. */}
  }
  return {error:attempted?lastCode:'no_model_configured',provider:lastProvider,upstream_status:lastUpstreamStatus};
}
export default {
  async fetch(request,env){
    const origin=request.headers.get('Origin');
    const allowed=isAllowedOrigin(origin,env);
    if(!allowed)return json({error:'origin_not_allowed'},403);
    const headers=cors(origin,env);
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
    const path=new URL(request.url).pathname;
    if(request.method==='GET'&&path==='/health'){
      return json({service:'lwazi',identity:IDENTITY_VERSION,ready:!!(env.DEEPSEEK_API_KEY||env.ANTHROPIC_API_KEY)},200,headers);
    }
    if(request.method!=='POST'||path!=='/api/lwazi')return json({error:'not_found'},404,headers);
    // Private pilot only. No production public inference until quotas/rate-limits exist.
    if(!env.LWAZI_ALLOWED_UIDS)return json({error:'pilot_access_not_configured'},503,headers);
    const token=bearer(request);
    const identity=await verifyFirebaseToken(token);
    if(!identity)return json({error:'authentication_required'},401,headers);
    const allowlist=new Set(String(env.LWAZI_ALLOWED_UIDS).split(',').map(x=>x.trim()));
    if(!allowlist.has(identity.uid))return json({error:'pilot_access_denied'},403,headers);
    if(Number(request.headers.get('Content-Length'))>MAX_BODY)return json({error:'request_too_large'},413,headers);
    let body;
    try{
      const raw=await request.text();if(raw.length>MAX_BODY)return json({error:'request_too_large'},413,headers);
      body=JSON.parse(raw);
    }catch{return json({error:'invalid_json'},400,headers)}
    if(!body||typeof body.question!=='string'||!body.question.trim()||body.question.length>1500) return json({error:'invalid_question'},400,headers);
    const mode=routeMode(body.question,body.mode);
    const context=publicContext(body.context);
    if(body.provider!=null&&!['deepseek','anthropic'].includes(body.provider))return json({error:'invalid_provider'},400,headers);
    const result=await queryProvider(mode,body.question.trim(),context,env,fetch,body.provider||null);
    if(result.error)return json({error:result.error,provider:result.provider||null,upstream_status:result.upstream_status||null},result.upstream_status===402?402:503,headers);
    return new Response(result.body,{status:200,headers:{...headers,'Content-Type':'text/event-stream; charset=utf-8','X-Accel-Buffering':'no'}});
  }
};
