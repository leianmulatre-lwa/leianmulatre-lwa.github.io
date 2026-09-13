(()=>{
  const TF_URL='https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js';
  const NSFW_URL='https://cdn.jsdelivr.net/npm/nsfwjs@4.4.0/dist/browser/nsfwjs.min.js';
  const ALLOWED=new Set(['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime']);
  const IMAGE_MAX=30*1024*1024;
  const VIDEO_MAX=120*1024*1024;
  let modelPromise=null;

  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const once=(target,event,timeout=12000)=>new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{cleanup();reject(new Error(`${event} timed out`))},timeout);
    const done=()=>{cleanup();resolve()};
    const fail=()=>{cleanup();reject(new Error(`Could not read ${event}`))};
    const cleanup=()=>{clearTimeout(timer);target.removeEventListener(event,done);target.removeEventListener('error',fail)};
    target.addEventListener(event,done,{once:true});target.addEventListener('error',fail,{once:true});
  });
  const withTimeout=(promise,ms,message)=>Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error(message)),ms))]);

  function loadScript(src,id){
    if(window[id])return Promise.resolve(window[id]);
    return new Promise((resolve,reject)=>{
      const prior=document.querySelector(`script[data-biglwa-safety="${id}"]`);
      if(prior){prior.addEventListener('load',()=>resolve(window[id]),{once:true});prior.addEventListener('error',()=>reject(new Error(`${id} failed to load`)),{once:true});return}
      const script=document.createElement('script');script.src=src;script.async=true;script.crossOrigin='anonymous';script.dataset.biglwaSafety=id;
      script.onload=()=>window[id]?resolve(window[id]):reject(new Error(`${id} did not initialize`));
      script.onerror=()=>reject(new Error(`${id} failed to load`));
      document.head.appendChild(script);
    });
  }

  async function getModel(){
    if(!modelPromise)modelPromise=(async()=>{
      await loadScript(TF_URL,'tf');
      const nsfw=await loadScript(NSFW_URL,'nsfwjs');
      if(window.tf?.ready)await window.tf.ready();
      return nsfw.load('MobileNetV2');
    })().catch(error=>{modelPromise=null;throw error});
    return modelPromise;
  }

  function ascii(bytes,start,length){return String.fromCharCode(...bytes.slice(start,start+length))}
  async function validate(file){
    const type=String(file?.type||'').toLowerCase();
    if(!ALLOWED.has(type))return {ok:false,message:'Choose a JPG, PNG, WebP, GIF, MP4, WebM, or MOV file.'};
    const limit=type.startsWith('video/')?VIDEO_MAX:IMAGE_MAX;
    if(file.size>limit)return {ok:false,message:`Keep ${type.startsWith('video/')?'videos under 120 MB':'images and GIFs under 30 MB'}.`};
    const bytes=new Uint8Array(await file.slice(0,16).arrayBuffer());
    const jpeg=bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff;
    const png=bytes[0]===0x89&&ascii(bytes,1,3)==='PNG';
    const gif=ascii(bytes,0,4)==='GIF8';
    const webp=ascii(bytes,0,4)==='RIFF'&&ascii(bytes,8,4)==='WEBP';
    const mp4=ascii(bytes,4,4)==='ftyp';
    const webm=bytes[0]===0x1a&&bytes[1]===0x45&&bytes[2]===0xdf&&bytes[3]===0xa3;
    const matches=(type==='image/jpeg'&&jpeg)||(type==='image/png'&&png)||(type==='image/gif'&&gif)||(type==='image/webp'&&webp)||(type==='video/webm'&&webm)||((type==='video/mp4'||type==='video/quicktime')&&mp4);
    return matches?{ok:true,type}:{ok:false,message:'That file does not match its reported media type.'};
  }

  function blankScores(){return {Drawing:0,Hentai:0,Neutral:0,Porn:0,Sexy:0}}
  function mergeScores(target,predictions){
    for(const item of predictions||[]){if(Object.prototype.hasOwnProperty.call(target,item.className))target[item.className]=Math.max(target[item.className],Number(item.probability)||0)}
    return target;
  }

  function containsMarker(bytes,marker){
    const target=[...marker].map(char=>char.charCodeAt(0));
    outer:for(let i=0;i<=bytes.length-target.length;i++){for(let j=0;j<target.length;j++)if(bytes[i+j]!==target[j])continue outer;return true}
    return false;
  }

  async function isAnimatedImage(file){
    if(file.type==='image/gif')return true;
    if(file.type!=='image/png'&&file.type!=='image/webp')return false;
    const bytes=new Uint8Array(await file.slice(0,Math.min(file.size,2*1024*1024)).arrayBuffer());
    return file.type==='image/png'?containsMarker(bytes,'acTL'):containsMarker(bytes,'ANIM');
  }

  function decide(scores,context='mixed'){
    const porn=scores.Porn||0,hentai=scores.Hentai||0,sexy=scores.Sexy||0,drawing=scores.Drawing||0,neutral=scores.Neutral||0;
    const risk=Math.max(porn,hentai,sexy);
    // A user-selected label is only context, never an exemption. The model must
    // also see a meaningful illustration signal before artwork gets its own path.
    const likelyArtwork=(drawing>=.52&&drawing>=porn*.72)||(context==='art'&&drawing>=.36&&porn<.70);
    if(likelyArtwork){
      if(hentai>=.64||porn>=.76||sexy>=.78)return {status:'age-restricted',reason:'adult-art'};
      if(risk>=.38)return {status:'age-restricted',reason:'ambiguous-art'};
      return {status:'allow',reason:'artwork'};
    }
    if(porn>=.48||(porn>=.36&&sexy>=.28))return {status:'block',reason:'explicit-photo'};
    if(hentai>=.58||risk>=.36)return {status:'age-restricted',reason:'ambiguous-adult'};
    const safe=Math.max(neutral,drawing);
    if(safe<.42)return {status:'age-restricted',reason:'low-confidence'};
    return {status:'allow',reason:'clear'};
  }

  function drawSquare(source){
    const width=source.videoWidth||source.naturalWidth||source.width||1,height=source.videoHeight||source.naturalHeight||source.height||1;
    const canvas=document.createElement('canvas');canvas.width=320;canvas.height=320;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.fillStyle='#000';ctx.fillRect(0,0,320,320);
    const scale=Math.min(320/width,320/height),w=width*scale,h=height*scale;
    ctx.drawImage(source,(320-w)/2,(320-h)/2,w,h);return canvas;
  }

  async function classifyCanvas(model,source,scores){return mergeScores(scores,await model.classify(drawSquare(source),5))}
  async function scanImage(file,model,scores,onProgress){
    const url=URL.createObjectURL(file),img=new Image();img.decoding='async';img.src=url;
    const holder=document.createElement('div');holder.style.cssText='position:fixed;left:-10000px;top:0;width:2px;height:2px;overflow:hidden;pointer-events:none';holder.appendChild(img);document.body.appendChild(holder);
    try{
      if(!img.complete)await once(img,'load');
      if((img.naturalWidth||0)*(img.naturalHeight||0)>60000000)throw new Error('Image dimensions are too large to check safely.');
      const animated=await isAnimatedImage(file),delays=animated?[0,360,440,520,620,720,820,940]:[0];
      for(let index=0;index<delays.length;index++){if(delays[index])await wait(delays[index]);await classifyCanvas(model,img,scores);onProgress?.(index+1,delays.length)}
    }finally{holder.remove();URL.revokeObjectURL(url)}
  }

  async function seek(video,time){
    if(Math.abs(video.currentTime-time)<.03)return;
    video.currentTime=time;await once(video,'seeked',9000);
  }
  async function scanVideo(file,model,scores,onProgress){
    const url=URL.createObjectURL(file),video=document.createElement('video');video.muted=true;video.playsInline=true;video.preload='auto';video.src=url;
    try{
      if(video.readyState<1)await once(video,'loadedmetadata',15000);
      if(video.readyState<2)await once(video,'loadeddata',15000);
      if((video.videoWidth||0)*(video.videoHeight||0)>16000000)throw new Error('Video dimensions are too large to check safely.');
      const duration=Number.isFinite(video.duration)&&video.duration>0?video.duration:1;
      if(duration>120)throw new Error('Keep wallpaper videos to two minutes or less so every section can be checked.');
      const sampleCount=Math.min(48,Math.max(12,Math.ceil(duration/2.5)));
      const points=Array.from({length:sampleCount},(_,index)=>Math.min((duration*index)/sampleCount,Math.max(0,duration-.06)));
      const unique=[...new Set(points.map(value=>value.toFixed(3)))];
      for(let index=0;index<unique.length;index++){await seek(video,Number(unique[index]));await classifyCanvas(model,video,scores);onProgress?.(index+1,unique.length)}
    }finally{video.removeAttribute('src');video.load();URL.revokeObjectURL(url)}
  }

  async function scan(file,{context='mixed',onProgress}={}){
    const valid=await validate(file);if(!valid.ok)return {status:'invalid',message:valid.message,scores:blankScores(),engine:'none'};
    try{
      const model=await withTimeout(getModel(),45000,'The safety model took too long to load.');
      const scores=blankScores();
      await withTimeout(file.type.startsWith('video/')?scanVideo(file,model,scores,onProgress):scanImage(file,model,scores,onProgress),120000,'The media safety check took too long.');
      return {...decide(scores,context),scores,engine:'NSFWJS 4.4.0 on-device',type:valid.type};
    }catch(error){
      const detail=String(error?.message||error),safeDetail=/dimensions are too large|two minutes or less/.test(detail)?detail:'Safety scanning is unavailable, so this file was not applied.';
      return {status:'unavailable',message:safeDetail,scores:blankScores(),engine:'unavailable',error:detail};
    }
  }

  async function hasVerifiedAdultClaim(){
    try{
      const [{getApps},{getAuth}]=await Promise.all([
        import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js')
      ]);
      const app=getApps()[0],user=app&&getAuth(app).currentUser;if(!user)return false;
      const token=await user.getIdTokenResult();
      return token.claims?.age_verified===true&&(token.claims?.age_over_18===true||token.claims?.age_band==='18+');
    }catch{return false}
  }

  window.BIGLWAWallpaperSafety={scan,validate,decide,hasVerifiedAdultClaim,allowedTypes:[...ALLOWED]};
})();
