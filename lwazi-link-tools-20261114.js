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
  zip:'archive',rar:'archive','7z':'archive',gz:'archive',tar:'archive',json:'document',webmjson:'document',
  heic:'image',heif:'image',bmp:'image',tiff:'image',mkv:'video',avi:'video',mpeg:'video',
  opus:'audio',aiff:'audio',odt:'document',ods:'document',rtf:'document',ics:'document',
  ttf:'file',otf:'file',woff:'file',woff2:'file',bin:'file',apk:'file'
 };
 const STREAMING=/^(?:www\.|m\.|music\.)?(?:youtube\.com|youtu\.be|tiktok\.com|vimeo\.com|instagram\.com|facebook\.com|soundcloud\.com|spotify\.com|twitter\.com|x\.com|dailymotion\.com|twitch\.tv|streamable\.com)$/i;
 const MAX_MANIFEST=8;
 // Source pages may resolve to a separately available, explicitly registered file.
 // This is not a streaming-platform extractor; only named first-party resources.
 const publishedVideoSources=Object.freeze({
  'y5-VFRw_uMQ':{path:'/super-8mm-film-effect-free-overlays-2160-ytshorts.savetube.me.mp4',title:'Super 8mm Film Effect free overlays'}
 });
 function resolveMedia(input){
  const u=typeof input==='string'?parse(input):input;if(!u)return null;
  const host=u.hostname.toLowerCase().replace(/^www\./,'').replace(/^m\./,'');
  const id=host==='youtu.be'?u.pathname.split('/')[1]:host==='youtube.com'?(u.pathname.startsWith('/shorts/')?u.pathname.split('/')[2]:u.searchParams.get('v')):'';
  const published=id&&Object.prototype.hasOwnProperty.call(publishedVideoSources,id)?publishedVideoSources[id]:null;
  if(published)return {url:new URL(published.path,location.origin).href,kind:'video',title:published.title};
  const linked=window.__biglwaFeed?.linkedMedia?.(u.href);
  return linked&&parse(linked.url)?linked:null;
 }

 const classify=(url,mime)=>{
  let path=url.pathname;
  try{path=decodeURIComponent(path)}catch{}
  const extension=(path.match(/\.([a-z0-9]{2,8})$/i)||[])[1]?.toLowerCase()||'';
  if(STREAMING.test(url.hostname)||['m3u8','mpd'].includes(extension))return {kind:'stream',extension};
  if(/\.media\.json$/i.test(path))return {kind:'manifest',extension:'json'};
  const type=String(mime||'').split(';')[0].trim().toLowerCase();
  if(/^(?:text\/html|application\/xhtml\+xml)$/.test(type))return {kind:'link',extension};
  const kind=type.startsWith('video/')?'video':type.startsWith('audio/')?'audio':
   type.startsWith('image/')?'image':type==='application/pdf'?'document':
   type&&/^(?:application\/|text\/|font\/)/.test(type)?(FILE_TYPES[extension]||'file'):
   FILE_TYPES[extension]||'link';
  return {kind,extension};
 };
 function parse(text){
  const raw=String(text||'').trim();
  // Links embedded in a search sentence are accepted, but a URL must be
  // explicitly present: never turn ordinary search keywords into downloads.
  const match=raw.match(/https?:\/\/[^\s<>"']{3,8192}/i)||raw.match(/^(?:www\.)[a-z0-9.-]+(?:\/[^\s<>"']*)?$/i);
  if(!match)return null;
  let candidate=match[0];
  // Preserve signed URLs and query values exactly when pasted by themselves.
  if(raw!==candidate)candidate=candidate.replace(/[.,;!?)}\]]+$/,'');
  let url;
  try{url=new URL(/^www\./i.test(candidate)?'https://'+candidate:candidate);}catch{return null}
  if(!['http:','https:'].includes(url.protocol)||url.username||url.password)return null;
  if(url.protocol!=='https:'&&url.hostname!=='localhost')return null;
  if(url.href.length>8192)return null;
  return url;
 }
 function tag(name,cls,label){
  const element=document.createElement(name);
  if(cls)element.className=cls;
  if(label!==undefined)element.textContent=label;
  return element;
 }
 function downloadable(name,content,type){
  const blob=content instanceof Blob?content:new Blob([content],{type:type||'text/plain;charset=utf-8'});
  const url=URL.createObjectURL(blob),a=tag('a');
  a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
 }
 const basename=url=>{
  let name=url.pathname.split('/').pop()||'resource';
  try{name=decodeURIComponent(name)}catch{}
  return name.replace(/[^a-z0-9._ -]/gi,'_').slice(0,100)||'resource';
 };
 const safeName=value=>String(value||'').replace(/[\\/\x00-\x1f\x7f<>:"|?*]/g,'_').replace(/^\.+/,'').trim().slice(0,180)||'download';
 function responseName(response,url,fallback){
  const disposition=response.headers.get('Content-Disposition')||'';
  const extended=disposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i)?.[1];
  if(extended){try{return safeName(decodeURIComponent(extended.trim()))}catch{}}
  const plain=disposition.match(/filename\s*=\s*(?:"([^"]+)"|([^;]+))/i);
  if(plain)return safeName(plain[1]||plain[2]);
  let name=safeName(fallback||basename(url));
  const mime=(response.headers.get('Content-Type')||'').split(';')[0].toLowerCase();
  const ext={'video/mp4':'mp4','video/webm':'webm','video/quicktime':'mov','audio/mpeg':'mp3','audio/mp4':'m4a','audio/wav':'wav','audio/ogg':'ogg','image/jpeg':'jpg','image/png':'png','image/webp':'webp','application/pdf':'pdf','application/zip':'zip','application/json':'json','text/plain':'txt','text/csv':'csv'}[mime];
  if(ext&&!/\.[a-z0-9]{1,8}$/i.test(name))name+='.'+ext;
  return name;
 }
 function originalLink(url,kind,filename){
  const a=tag('a','bl-link-action',kind==='stream'?'Open original platform ↗':kind==='link'?'Open page ↗':
   url.origin===location.origin?'Download original':'Open file / use browser Save As ↗');
  a.href=url.href;
  if(url.origin===location.origin&&!['stream','link'].includes(kind))a.download=filename;
  else {a.target='_blank';a.rel='noopener noreferrer'}
  return a;
 }
 function renderForQuery(panel,raw,options={}){
  let url=parse(raw);
  if(!url)return false;
  const supplied=url,linked=resolveMedia(url);
  if(linked&&parse(linked.url))url=parse(linked.url);
  const {kind:detected,extension}=classify(url),initial=linked?.kind||detected;
  let kind=initial,videoHeight=0,videoWidth=0;
  const compact=Boolean(options.inline);
  const card=tag('section','bl-link-inspector');
  card.setAttribute('aria-label','L’wazi link and download options');
  if(compact)card.className+=' bl-link-compact';
  const head=tag('div','bl-link-inspector-head');
  const title=tag('div');
  title.append(tag('span','bl-link-eyebrow','L’wazi · Link detected'),tag('h2','', linked?.title||'Convert and download'));
  const close=tag('button','bl-link-close','×');
  close.type='button';close.setAttribute('aria-label','Close link inspector');
  close.addEventListener('click',()=>{
   activeTransfer?.abort();releaseReady();for(const media of preview.querySelectorAll?.('video,audio')||[]){media.pause();media.removeAttribute('src');media.load?.()}
   if(!options.inline)window.__biglwaUserCardsClose?.();
   if(card.isConnected)card.remove();
  });
  head.append(title,close);card.append(head);
  const source=tag('p','bl-link-source',supplied.href);card.append(source);
  const verdict=tag('p','bl-link-verdict','Checking the kind of content this link points to…');
  verdict.setAttribute('role','status');card.append(verdict);
  const controls=tag('div','bl-link-actions');card.append(controls);
  const variants=tag('div','bl-link-variants');card.append(variants);
  const preview=tag('div','bl-link-preview');preview.hidden=true;card.append(preview);
  const note=tag('p','bl-link-note');
  note.textContent='Download files you own or have permission to save. Some external sites require their own download controls.';
  card.append(note);
  panel.replaceChildren(card);
  let filename=basename(url);
  const sameOrigin=url.origin===location.origin;
  let activeTransfer=null,readyURL='';
  const ready=tag('a','bl-link-action bl-link-ready','Save downloaded file');ready.hidden=true;
  card.append(ready);
  const releaseReady=()=>{if(readyURL)URL.revokeObjectURL(readyURL);readyURL='';ready.hidden=true;ready.removeAttribute('href')};
  const offerReady=file=>{releaseReady();readyURL=URL.createObjectURL(file);ready.href=readyURL;ready.download=file.name;ready.hidden=false;ready.textContent='Save '+file.name;ready.click()};
  const sponsor=tag('div','bl-link-sponsor');sponsor.hidden=true;card.append(sponsor);
  const showSponsor=()=>{try{const ad=window.BigLWAAds?.createDownloadCard?.();if(ad){sponsor.replaceChildren(ad);sponsor.hidden=false}}catch{}};
  const transferStatus=tag('div','bl-link-transfer');transferStatus.hidden=true;card.insertBefore?.(transferStatus,preview);
  if(!card.insertBefore)card.append(transferStatus);
  const progress=tag('progress','bl-link-progress');progress.max=100;progress.setAttribute('aria-label','Download progress');
  const cancel=tag('button','bl-link-action','Cancel transfer');cancel.type='button';cancel.addEventListener('click',()=>activeTransfer?.abort());transferStatus.append(progress,cancel);

  const add=(name,fn)=>{
   const button=tag('button','bl-link-action',name);button.type='button';
   button.addEventListener('click',fn);controls.append(button);return button;
  };
  const saveReference=()=>downloadable(filename+'.link.txt',url.href+'\n');
  const saveDetails=()=>downloadable(filename+'.info.json',JSON.stringify({
   source:url.href,type:kind,file:filename,checkedAt:new Date().toISOString(),
   note:'No conversion, download rights or unverified quality options implied.'
  },null,2),'application/json');
  const previewMedia=()=>{
   const element=document.createElement(kind==='video'?'video':kind==='audio'?'audio':'img');
   element.src=url.href;
   if(kind==='image'){
    element.alt='Image preview from supplied link';element.loading='lazy';
   }else{
    element.controls=true;element.preload='metadata';
    if(kind==='video'){element.playsInline=true;element.addEventListener('loadedmetadata',()=>{if(!card.isConnected)return;const changed=videoHeight!==element.videoHeight;videoHeight=element.videoHeight;videoWidth=element.videoWidth;if(changed&&!activeTransfer)setControls()})}
   }
   preview.replaceChildren(element);preview.hidden=false;
  };
  const openCraft=(route,label)=>{
   add(label,()=>{
    if(typeof window.BigLWAOpenCraftApp==='function'&&route!=='projects')window.BigLWAOpenCraftApp(route);
    else window.__biglwaOpenSearchRoute?.(route==='projects'?'projects':'tools');
   });
  };
  const setControls=()=>{
   if(activeTransfer)return;
   const previous=controls.querySelector?.('select')?.value;
   controls.replaceChildren();
   if(['image','audio','video','archive','document','file','link'].includes(kind)){
    const formats={image:['png','jpeg','webp'],video:['mp4','webm','mp3'],audio:['mp3','wav','m4a']};
    const qualities=kind==='video'&&videoHeight?[2160,1440,1080,720,480,360,240,144].filter(h=>h<videoHeight&&Math.floor(videoWidth*h/videoHeight)>=2):[];
    const select=tag('select','bl-link-action');select.setAttribute('aria-label','Download format');
    for(const format of ['original',...(formats[kind]||[]),...qualities.map(h=>'mp4-'+h)]){
     const label=format==='original'?(kind==='video'&&videoHeight?'Original · '+videoHeight+'p':'Original file'):format.startsWith('mp4-')?'MP4 · '+format.slice(4)+'p (convert)':format.toUpperCase();
     const option=tag('option','',label);option.value=format;select.append(option);
    }
    if(previous&&[...select.children].some(option=>option.value===previous))select.value=previous;
    controls.append(select);
    const save=add(compact&&kind==='video'?'Download video':'Download file',async()=>{
     if(activeTransfer)return;
     const format=select.value||'original',target=url,controller=new AbortController();
     activeTransfer=controller;releaseReady();save.disabled=true;transferStatus.hidden=false;progress.removeAttribute('value');
     // Start the transfer independently. The optional white sponsor card never
     // receives the URL and is never awaited, even when ads are unavailable.
     try{
      verdict.textContent='Connecting to the source file…';
      const pending=fetch(target.href,{credentials:target.origin===location.origin?'same-origin':'omit',referrerPolicy:'no-referrer',signal:controller.signal});
      showSponsor();
      const response=await pending;
      if(!response.ok)throw Error('The source returned HTTP '+response.status+'.');
      const mime=(response.headers.get('Content-Type')||'').split(';')[0].toLowerCase();
      if(/^(text\/html|application\/xhtml\+xml)$/.test(mime)){await response.body?.cancel();throw Error('This link returns a webpage, not a file. Use the source’s download link.')}
      const limit=(format==='original'?500:125)*1024*1024;
      const total=Number(response.headers.get('content-length'))||0;
      if(total>limit){await response.body?.cancel();throw Error('File exceeds the in-browser limit. Open the original and use your browser’s download controls.')}
      filename=responseName(response,target,basename(target));
      const pieces=[];let size=0;
      if(response.body?.getReader){
       const reader=response.body.getReader();
       try{for(;;){const {value,done}=await reader.read();if(done)break;if(!card.isConnected){controller.abort();await reader.cancel();return}size+=value.byteLength;if(size>limit){await reader.cancel();throw Error('File exceeds the in-browser limit.')}pieces.push(value);
        if(total>0)progress.value=Math.min(100,size/total*100);
        verdict.textContent='Downloading · '+(size/1048576).toFixed(1)+' MB'+(total>0?' / '+(total/1048576).toFixed(1)+' MB':'');
       }}finally{reader.releaseLock?.()}
      }else{const blob=await response.blob();size=blob.size;if(size>limit)throw Error('File exceeds the in-browser limit.');pieces.push(blob)}
      if(!size)throw Error('The source file is empty.');
      let file=new File(pieces,filename,{type:mime||'application/octet-stream'});
      // A mislabelled login/error document must not be saved as a movie.
      if(!mime||mime==='application/octet-stream'){
       const prefix=await file.slice(0,256).text();
       if(/^\s*(?:<!doctype\s+html|<html\b|<head\b)/i.test(prefix))throw Error('This link returns a webpage, not a file. Use the source’s download link.');
      }
      if(format!=='original'){
       verdict.textContent='Converting to '+format.toUpperCase()+'…';progress.removeAttribute('value');
       const converter=await import('/tools-studio.js?v=20261128-download-transfer-2&deviantart=20261128-1');
       file=await converter.convertLinkedMedia(file,kind,format);
      }
      if(controller.signal.aborted){verdict.textContent='Download canceled. You can try again.';return}
      if(!card.isConnected)return;
      offerReady(file);progress.value=100;verdict.textContent='File ready · '+file.name+'. If your browser did not save it, select the Save button below.';
     }catch(error){
      verdict.textContent=controller.signal.aborted?'Download canceled. You can try again.':error instanceof TypeError?'This host does not allow cross-origin file requests. Open the source and use Save As, or use its official download link.':String(error?.message||'Download failed.');
     }finally{if(activeTransfer===controller)activeTransfer=null;save.disabled=false;transferStatus.hidden=true}
    });
    if(compact)save.className+=' bl-link-primary';
   }
   controls.append(originalLink(url,kind,filename));
   if(!compact||kind==='stream'){add('Save link (.txt)',saveReference);add('File details (.json)',saveDetails)}
   if(compact&&kind==='stream')add('Use direct file link',()=>{const field=panel.closest?.('.tool-links')?.querySelector('#toolLinkForm input');if(field){field.focus();field.select()}});
   if(['video','audio','image'].includes(kind))add('Preview '+kind,previewMedia);
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
    videoHeight=video.videoHeight;videoWidth=video.videoWidth;
    finish(label+'. Smaller MP4 resolutions are generated locally, not separate source files.');setControls();
   };
   video.onerror=()=>finish('The source does not expose playable metadata to this browser. No unverified qualities will be offered.');
   video.src=url.href;
  }
  async function findPageMedia(){
   // Read only media the source publishes in a browser-readable page.
   const response=await fetch(url.href,{credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(8000)});
   if(!response.ok||!response.body)return false;
   const mime=response.headers.get('content-type')||'';
   if(!/text\/html/i.test(mime)){await response.body.cancel();return false}
   const reader=response.body.getReader(),decoder=new TextDecoder();let html='',size=0;
   try{while(size<512*1024){const {done,value}=await reader.read();if(done)break;html+=decoder.decode(value,{stream:true});size+=value.length}}finally{await reader.cancel().catch(()=>{})}
   // Template contents are inert, including embedded images and scripts.
   const template=document.createElement('template');template.innerHTML=html;
   const entries=[...template.content.querySelectorAll('a[download][href],video[src],video source[src],audio[src],audio source[src],meta[property="og:video:url"],meta[property="og:audio"]')];
   for(const entry of entries){
    const path=entry.getAttribute('src')||entry.getAttribute('href')||entry.getAttribute('content');
    if(!path)continue;
    let candidate;try{candidate=new URL(path,response.url||url.href)}catch{continue}
    if(candidate.protocol!=='https:'||candidate.username||candidate.password)continue;
    const type=classify(candidate,entry.getAttribute('type')).kind;
    if(!['video','audio','image','document','archive'].includes(type))continue;
    if(activeTransfer||!card.isConnected)return false;
    url=candidate;kind=type;filename=basename(url);setControls();
    verdict.textContent='Found a '+kind+' file published by this page.';return true;
   }
   return false;
  }
  async function inspect(){
   if(kind==='stream'){
    verdict.textContent='Streaming platform page · no downloadable file is connected. Open the source for its download options, or paste an authorized direct file URL.';
    setControls();
    return;
   }
   if(!sameOrigin&&kind!=='link'){
    verdict.textContent=kind==='video'?'Direct video link · quality and download permissions are source-controlled.':
     kind==='link'?'Web page · not a verified downloadable file.':
     'Detected '+kind+' link · download the original file or choose a supported format.';
    setControls();return;
   }
   try{
    const response=await fetch(url.href,{method:'HEAD',credentials:sameOrigin?'same-origin':'omit',cache:'no-store',referrerPolicy:'no-referrer'});
    if(!response.ok)throw Error('Source returned '+response.status);
    const mime=response.headers.get('Content-Type')||'';
    if(activeTransfer||!card.isConnected)return;
    const data=classify(url,mime);
    kind=data.kind;
    if(kind==='link'&&/attachment/i.test(response.headers.get('Content-Disposition')||''))kind='file';
    filename=responseName(response,url,basename(url));
    const length=Number(response.headers.get('Content-Length'));
    const size=Number.isFinite(length)&&length>0?' · '+(length/1024/1024).toFixed(1)+' MB':'';
    verdict.textContent=(kind==='link'?'Page or unknown file':kind[0].toUpperCase()+kind.slice(1))+
     (mime?' · '+mime.split(';')[0]:'')+size;
    setControls();
    if(kind==='manifest')await loadManifest();
    if(kind==='link'&&/text\/html/i.test(mime))await findPageMedia();
   }catch(error){
    if(activeTransfer||!card.isConnected)return;
    verdict.textContent='Source could not be checked in advance. Try Download file for a direct file link, or open the original.';
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
  if(compact&&kind==='video'&&typeof preview.querySelector==='function')previewMedia();
  return true;
 }
 window.BigLWALinkTools={parse,classify,renderForQuery,responseName,resolveMedia};
})();
