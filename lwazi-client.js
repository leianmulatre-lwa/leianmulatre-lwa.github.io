/* Optional v1 L'wazi pilot bridge; no keys ever stored in browser JS.
 * Enable by setting window.__biglwaLwaziEndpoint before this script loads.
 * Until configured the existing L'wazi search and fallback are unchanged. */
(function(){
  'use strict';
  const url=String(window.__biglwaLwaziEndpoint||'').trim();
  if(!url||window.__biglwaAskLwazi)return;
  let endpoint;
  try{
    endpoint=new URL(url,location.origin);
    if(endpoint.protocol!=='https:'&&endpoint.hostname!=='localhost')return;
  }catch{return}
  const parse=function(chunk,onEvent){
    const blocks=chunk.replace(/\r\n/g,'\n').split('\n\n');
    return {blocks:blocks.slice(0,-1),rest:blocks[blocks.length-1]};
  };
  async function authToken(){
    const [{getApps},{getAuth}]=await Promise.all([
      import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js')
    ]);
    const app=getApps().find(app=>app.options?.projectId==='biglwa');
    if(!app)throw Error('Sign in to BIG LWA first.');
    const auth=getAuth(app);
    if(auth.authStateReady)await auth.authStateReady();
    if(!auth.currentUser)throw Error('Sign in to BIG LWA first.');
    return auth.currentUser.getIdToken();
  }
  async function ask(question,sources,_charter,onDelta,options){
    // Founder-only pilot: explicit session opt-in to external provider processing.
    let consented=false;
    try{consented=sessionStorage.getItem('biglwaLwaziExternalPilotConsentV1')==='yes'}catch{}
    if(!consented){
      const accepted=window.confirm('L’wazi’s private pilot sends your question and public discovery-source metadata to Cloudflare Workers AI. It tries free-allowance models only; paid DeepSeek and Claude are disabled. It does not include private Studio content. Continue for this session?');
      if(!accepted)throw Error('External AI was not enabled.');
      try{sessionStorage.setItem('biglwaLwaziExternalPilotConsentV1','yes')}catch{}
    }
    const token=await authToken();
    const controller=new AbortController();
    const upstreamSignal=options?.signal;
    const abortFromCaller=()=>controller.abort();
    if(upstreamSignal?.aborted)controller.abort();
    else upstreamSignal?.addEventListener?.('abort',abortFromCaller,{once:true});
    const timeout=setTimeout(()=>controller.abort(),options?.mode==='deep'?32000:19000);
    try{
      const publicSources=Array.isArray(sources)?sources.slice(0,6).map(x=>({
        title:String(x.title||'').slice(0,140),
        snippet:String(x.snippet||'').slice(0,400),
        url:String(x.url||'').slice(0,400)
      })):[];
      const response=await fetch(endpoint.href,{
        method:'POST',signal:controller.signal,cache:'no-store',
        headers:{Authorization:'Bearer '+token,'Content-Type':'application/json',Accept:'text/event-stream'},
        body:JSON.stringify({question:String(question||''),mode:options?.mode==='deep'?'deep':'auto',context:publicSources})
      });
      if(!response.ok){
        const info=await response.json().catch(()=>({}));
        throw Error('L’wazi API: '+String(info.error||response.status));
      }
      if(!response.body)throw Error('L’wazi API does not support streaming.');
      const reader=response.body.getReader();const decoder=new TextDecoder();
      let remainder='',output='',finished=false;
      while(!finished){
        const packet=await reader.read();
        if(packet.done)break;
        remainder+=decoder.decode(packet.value,{stream:true});
        const split=parse(remainder);remainder=split.rest;
        for(const block of split.blocks){
          const line=block.split('\n').find(x=>x.startsWith('data:'));
          if(!line)continue;
          let data;try{data=JSON.parse(line.slice(5).trim())}catch{continue}
          if(data.type==='error')throw Error('L’wazi stream interrupted: '+data.code);
          if(data.type==='delta'&&typeof data.text==='string'){
            output+=data.text;if(typeof onDelta==='function')onDelta(output);
          }
          if(data.type==='done'){finished=true;break}
        }
      }
      if(!output)throw Error('L’wazi produced an empty answer.');
      return output;
    }finally{clearTimeout(timeout);upstreamSignal?.removeEventListener?.('abort',abortFromCaller)}
  }
  window.__biglwaAskLwazi=ask;
  window.__biglwaLwaziBridge={version:'1.0.0',endpoint:endpoint.origin,enabled:true};
})();
