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
    const timeout=setTimeout(()=>controller.abort(),options?.mode==='deep'?26000:12000);
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
  async function imageToJpeg(file){
    if(!file||!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)||file.size>10*1024*1024)
      throw Error('Select a JPG, PNG, WebP or GIF image under 10 MB.');
    let bitmap=null,objectUrl=null,img=null;
    try{
      if(typeof createImageBitmap==='function')bitmap=await createImageBitmap(file);
      else{
        objectUrl=URL.createObjectURL(file);
        img=new Image();img.src=objectUrl;
        await img.decode();
      }
      const width=bitmap?.width||img?.naturalWidth||0,height=bitmap?.height||img?.naturalHeight||0;
      if(!width||!height)throw Error('Could not open the image.');
      const ratio=Math.min(1,1280/Math.max(width,height));
      const canvas=document.createElement('canvas');
      canvas.width=Math.max(1,Math.round(width*ratio));
      canvas.height=Math.max(1,Math.round(height*ratio));
      const ctx=canvas.getContext('2d');
      if(!ctx)throw Error('Image conversion unavailable.');
      ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(bitmap||img,0,0,canvas.width,canvas.height);
      let data=canvas.toDataURL('image/jpeg',.82);
      if(data.length>2700000)data=canvas.toDataURL('image/jpeg',.60);
      if(data.length>2700000)throw Error('This image is too large to analyze. Choose a smaller image.');
      return data;
    }finally{try{bitmap?.close?.()}catch{}if(objectUrl)URL.revokeObjectURL(objectUrl)}
  }
  async function askImage(file,question){
    if(!window.confirm('Analyze this image with L’wazi? Its resized image and your question will be sent to Cloudflare Workers AI for this request. They will not be added to your public Studio.')){
      throw Error('Image analysis cancelled.');
    }
    const token=await authToken();
    const data=await imageToJpeg(file);
    const imageEndpoint=new URL('/api/lwazi/image',endpoint.origin);
    const controller=new AbortController();
    const stop=setTimeout(()=>controller.abort(),26000);
    try{
      const response=await fetch(imageEndpoint.href,{
        method:'POST',signal:controller.signal,cache:'no-store',
        headers:{Authorization:'Bearer '+token,'Content-Type':'application/json',Accept:'application/json'},
        body:JSON.stringify({
          image:data,
          question:String(question||'Describe what is visible in this image.').trim().slice(0,500)
        })
      });
      const json=await response.json().catch(()=>({}));
      if(!response.ok||typeof json.answer!=='string'||!json.answer.trim())
        throw Error('L’wazi vision: '+String(json.error||response.status));
      return {answer:json.answer,model:json.model||null};
    }finally{clearTimeout(stop)}
  }
  window.__biglwaAskLwaziImage=askImage;
  window.__biglwaAskLwazi=ask;
  window.__biglwaLwaziBridge={version:'1.0.0',endpoint:endpoint.origin,enabled:true};
})();
