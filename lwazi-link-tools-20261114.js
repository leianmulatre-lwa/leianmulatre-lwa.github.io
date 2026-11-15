/* BIG LWA L'wazi · explicit file/link inspector.
 * Own/public direct files only: no DRM bypass, streaming extraction, or false
 * resolution options. Files are not uploaded. The browser owns every download.
 */
(function(){
 'use strict';
 if(window.BigLWALinkTools)return;
 const FILE_TYPES={
  mp4:'video',webm:'video',mov:'video',m4v:'video',ogv:'video',
  mp3:'audio',m4a:'audio',wav:'audio',flac:'audio',ogg:'audio',aac:'audio',
  png:'image',jpg:'image',jpeg:'image',gif:'image',webp:'image',avif:'image',svg:'image',
  pdf:'document',doc:'document',docx:'document',ppt:'document',pptx:'document',
  xls:'document',xlsx:'document',txt:'document',csv:'document',epub:'document',
  zip:'archive',json:'document',webmjson:'document'
 };
 const STREAMING=/^(?:www\.|m\.)?(?:youtube\.com|youtu\.be|tiktok\.com|vimeo\.com|instagram\.com|facebook\.com|soundcloud\.com|spotify\.com)$/i;
 const MAX_MANIFEST=8;
 const classify=(url,mime)=>{
  const path=decodeURIComponent(url.pathname.replace(/%2F/ig,'/'));
  const extension=(path.match(/\.([a-z0-9]{2,8})$/i)||[])[1]?.toLowerCase()||'';
  if(STREAMING.test(url.hostname))return {kind:'stream',extension};
  if(/\.media\.json$/i.test(path))return {kind:'manifest',extension:'json'};
  const type=String(mime||'').split(';')[0].toLowerCase();
  const kind=type.startsWith('video/')?'video':type.startsWith('audio/')?'audio':
   type.startsWith('image/')?'image':type==='application/pdf'?'document':
   FILE_TYPES[extension]||'link';
  return {kind,extension};
 };
 function parse(text){
  const raw=String(text||'').trim();
  // Links embedded in a search sentence are accepted, but a URL must be
  // explicitly present: never turn ordinary search keywords into downloads.
  const match=raw.match(/https?:\/\/[^\s<>"']{3,2048}/i);
  if(!match)return null;
  let candidate=match[0].replace(/[.,;!?)}\]]+$/,'');
  let url;
  try{url=new URL(candidate);}catch{return null}
  if(!['http:','https:'].includes(url.protocol)||url.username||url.password)return null;
  if(url.protocol!=='https:'&&url.hostname!=='localhost')return null;
  if(url.href.length>2048)return null;
  return url;
 }
 function tag(name,cls,label){
  const element=document.createElement(name);
  if(cls)element.className=cls;
  if(label!==undefined)element.textContent=label;
  return element;
 }
 function downloadable(name,content,type){
  const blob=new Blob([content],{type:type||'text/plain;charset=utf-8'});
  const url=URL.createObjectURL(blob),a=tag('a');
  a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1200);
 }
 const basename=url=>{
  let name=url.pathname.split('/').pop()||'resource';
  try{name=decodeURIComponent(name)}catch{}
  return name.replace(/[^a-z0-9._ -]/gi,'_').slice(0,100)||'resource';
 };
 function originalLink(url,kind,filename){
  const a=tag('a','bl-link-action',kind==='stream'?'Open original platform ↗':
   url.origin===location.origin?'Download original':'Open file at source ↗');
  a.href=url.href;
  if(url.origin===location.origin&&kind!=='stream')a.download=filename;
  else {a.target='_blank';a.rel='noopener noreferrer'}
  return a;
 }
 function renderForQuery(panel,raw){
  const url=parse(raw);
  if(!url)return false;
  const {kind:initial,extension}=classify(url);
  let kind=initial;
  const card=tag('section','bl-link-inspector');
  card.setAttribute('aria-label','L’wazi link and download options');
  const head=tag('div','bl-link-inspector-head');
  const title=tag('div');
  title.append(tag('span','bl-link-eyebrow','L’wazi · Link detected'),tag('h2','', 'Explore this link'));
  const close=tag('button','bl-link-close','×');
  close.type='button';close.setAttribute('aria-label','Close link inspector');
  close.addEventListener('click',()=>{
   window.__biglwaUserCardsClose?.();
   if(card.isConnected)card.remove();
  });
  head.append(title,close);card.append(head);
  const source=tag('p','bl-link-source',url.href);card.append(source);
  const verdict=tag('p','bl-link-verdict','Checking the kind of content this link points to…');
  verdict.setAttribute('role','status');card.append(verdict);
  const controls=tag('div','bl-link-actions');card.append(controls);
  const variants=tag('div','bl-link-variants');card.append(variants);
  const note=tag('p','bl-link-note');
  note.textContent='Download options depend on actual file access and source permissions. L’wazi does not bypass paywalls, DRM, or platform download restrictions.';
  card.append(note);
  panel.replaceChildren(card);
  const filename=basename(url);
  const sameOrigin=url.origin===location.origin;
  const add=(name,fn)=>{
   const button=tag('button','bl-link-action',name);button.type='button';
   button.addEventListener('click',fn);controls.append(button);return button;
  };
  const saveReference=()=>downloadable(filename+'.link.txt',url.href+'\n');
  const saveDetails=()=>downloadable(filename+'.info.json',JSON.stringify({
   source:url.href,type:kind,file:filename,checkedAt:new Date().toISOString(),
   note:'No conversion, download rights or unverified quality options implied.'
  },null,2),'application/json');
  const openCraft=(route,label)=>{
   add(label,()=>{
    if(typeof window.BigLWAOpenCraftApp==='function'&&route!=='projects')window.BigLWAOpenCraftApp(route);
    else window.__biglwaOpenSearchRoute?.(route==='projects'?'projects':'tools');
   });
  };
  const setControls=()=>{
   controls.replaceChildren();
   controls.append(originalLink(url,kind,filename));
   add('Save link (.txt)',saveReference);
   add('File details (.json)',saveDetails);
   if(kind==='video'){
    add('Check video resolution',()=>checkVideo());
   }else if(kind==='image'){openCraft('photocraft','Open lightR editor');}
   else if(kind==='document'&&/^(?:pdf|docx?|pptx?)$/.test(extension))
    openCraft(extension.startsWith('ppt')?'projects':'pdfcraft',
     extension.startsWith('ppt')?'Open visualslidez':'Open fileR');
  };
  const videoLabel=(width,height)=>{
   if(!Number.isFinite(height)||height<1)return 'Resolution unavailable';
   return width+' × '+height+' · '+(height>=2160?'4K or higher':height>=1440?'1440p':
    height>=1080?'1080p':height>=720?'720p':height>=480?'480p':'SD')+' source';
  };
  function checkVideo(){
   if(kind!=='video')return;
   verdict.textContent='Checking direct-file video metadata (no video is saved or uploaded)…';
   const video=document.createElement('video');
   video.preload='metadata';video.muted=true;
   let settled=false;
   const clean=()=>{video.removeAttribute('src');video.load?.()};
   const finish=message=>{
    if(settled)return;settled=true;clearTimeout(timer);
    verdict.textContent=message;clean();
   };
   const timer=setTimeout(()=>finish('Resolution could not be read. Original source remains available.'),8500);
   video.onloadedmetadata=()=>{
    const label=videoLabel(video.videoWidth,video.videoHeight);
    finish(label+'. The original is the only verified downloadable quality.');
   };
   video.onerror=()=>finish('The source does not expose playable metadata to this browser. No unverified qualities will be offered.');
   video.src=url.href;
  }
  async function inspect(){
   if(kind==='stream'){
    verdict.textContent='Streaming platform page · open it to use the provider’s own download or save controls, when allowed.';
    setControls();return;
   }
   if(!sameOrigin){
    verdict.textContent=kind==='video'?'Direct video link · quality and download permissions are source-controlled.':
     kind==='link'?'Web page · not a verified downloadable file.':
     'Detected '+kind+' link · open the source to download if permitted.';
    setControls();return;
   }
   try{
    const response=await fetch(url.href,{method:'HEAD',credentials:'same-origin',cache:'no-store'});
    if(!response.ok)throw Error('Source returned '+response.status);
    const mime=response.headers.get('Content-Type')||'';
    const data=classify(url,mime);
    kind=data.kind;
    const length=Number(response.headers.get('Content-Length'));
    const size=Number.isFinite(length)&&length>0?' · '+(length/1024/1024).toFixed(1)+' MB':'';
    verdict.textContent=(kind==='link'?'Page or unknown file':kind[0].toUpperCase()+kind.slice(1))+
     (mime?' · '+mime.split(';')[0]:'')+size;
    setControls();
    if(kind==='manifest')await loadManifest();
   }catch(error){
    verdict.textContent='Cannot verify this file ('+String(error?.message||'unavailable').slice(0,100)+'). Open the original to inspect it.';
    setControls();
   }
  }
  async function loadManifest(){
   variants.replaceChildren();
   // Only first-party explicit manifests can declare downloadable renditions.
   // The selected file still requires a successful HEAD before we expose it.
   if(kind!=='manifest'||!sameOrigin)return;
   try{
    const response=await fetch(url.href,{credentials:'same-origin',cache:'no-store'});
    if(!response.ok)throw Error('Manifest unavailable');
    const manifest=await response.json();
    const rows=Array.isArray(manifest.variants)?manifest.variants.slice(0,MAX_MANIFEST):[];
    const checked=[];
    for(const variant of rows){
     const height=Number(variant.height);
     if(!Number.isInteger(height)||height<144||height>8640)continue;
     let candidate;
     try{candidate=new URL(String(variant.url||''),url)}catch{continue}
     if(candidate.origin!==location.origin||candidate.username||candidate.password||!/^https?:$/.test(candidate.protocol))continue;
     const probe=await fetch(candidate.href,{method:'HEAD',credentials:'same-origin',cache:'no-store'}).catch(()=>null);
     if(!probe?.ok||!String(probe.headers.get('Content-Type')||'').toLowerCase().startsWith('video/'))continue;
     checked.push({height,url:candidate});
    }
    checked.sort((a,b)=>b.height-a.height);
    const unique=new Set();
    for(const row of checked){
     if(unique.has(row.height))continue;unique.add(row.height);
     const anchor=originalLink(row.url,'video',basename(row.url));
     anchor.textContent='Download '+(row.height>=2160?'4K':row.height+'p')+' · verified file';
     variants.append(anchor);
    }
    verdict.textContent=unique.size?
     'Verified '+unique.size+' downloadable video quality'+(unique.size===1?'':' options')+' (highest first).':
     'No accessible video renditions were verified in this manifest.';
   }catch{
    verdict.textContent='This site did not expose a usable video-quality manifest.';
   }
  }
  setControls();inspect();
  return true;
 }
 window.BigLWALinkTools={parse,classify,renderForQuery};
})();
