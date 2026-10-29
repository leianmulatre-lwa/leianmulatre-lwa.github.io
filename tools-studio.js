// Tool Pages: Workshop first, then local file intake; the kind of file is worked out
// and the conversions that suit it are offered. Anything that cannot be done
// inside a browser is offered as a link out instead of pretending otherwise.

const MAX_LOCAL_FILE_BYTES=500*1024*1024;
const MEMORY_HEAVY_TRANSCODE=125*1024*1024;
const ONLINE_TOOLS = [
  {name:'CloudConvert',best:'Almost anything to almost anything',url:'https://cloudconvert.com/'},
  {name:'Zamzar',best:'One-off odd formats, including archives and documents',url:'https://www.zamzar.com/'},
  {name:'Convertio',best:'Documents, images and audio in bulk',url:'https://convertio.co/'},
  {name:'EzGIF',best:'GIFs, video to GIF, and image repair',url:'https://ezgif.com/'},
  {name:'HandBrake',best:'Proper video compression and encoding',url:'https://www.handbrake.fr/'},
  {name:'TinyPNG',best:'PNG and JPEG made much smaller, losslessly where possible',url:'https://tinypng.com/'},
  {name:'VectorMagic',best:'SVG, EPS and AI artwork to PNG or PDF',url:'https://vectormagic.com/'},
  {name:'iLovePDF',best:'PDF page work: merge, split, rotate, repair',url:'https://www.ilovepdf.com/'}

];

const ONLINE_BY_KIND = {
  archive:{label:'Archives',note:'Opening and rebuilding zip, rar and 7z files needs a server-side tool.',tools:['CloudConvert','Zamzar','Convertio']},
  document:{label:'Documents',note:'Word, Pages, PowerPoint and PDF work is done by a hosted converter.',tools:['CloudConvert','Zamzar','iLovePDF','Convertio']},
  font:{label:'Fonts',note:'Font files are converted by a hosted converter.',tools:['CloudConvert','Zamzar']},
  video:{label:'Video',note:'A hosted encoder is faster and handles more codecs than a browser can.',tools:['HandBrake','CloudConvert','EzGIF']},
  audio:{label:'Audio',note:'A hosted converter handles rarer codecs and metadata.',tools:['CloudConvert','Zamzar','Convertio']},
  image:{label:'Images',note:'A hosted converter handles exotic formats and colour profiles.',tools:['CloudConvert','VectorMagic','TinyPNG','EzGIF']},
  unknown:{label:'Anything else',note:'This file is not one BIGLWA recognises, so it is passed to a hosted converter.',tools:['CloudConvert','Zamzar','Convertio']}
};

const VIDEO_OPS = {
  mp4:{label:'MP4 video',ext:'mp4',type:'video/mp4',args:()=>['-c:v','libx264','-preset','veryfast','-crf','22','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-movflags','+faststart']},
  mov:{label:'MOV video',ext:'mov',type:'video/quicktime',args:()=>['-c:v','libx264','-preset','veryfast','-crf','22','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k']},
  webm:{label:'WebM video',ext:'webm',type:'video/webm',args:()=>['-c:v','libvpx-vp9','-crf','34','-b:v','0','-deadline','realtime','-cpu-used','5','-c:a','libopus','-b:a','128k']},
  mp3:{label:'MP3 audio only',ext:'mp3',type:'audio/mpeg',args:()=>['-vn','-c:a','libmp3lame','-b:a','192k']},
  wav:{label:'WAV audio only',ext:'wav',type:'audio/wav',args:()=>['-vn','-c:a','pcm_s16le']},
  compress:{label:'Smaller MP4 (720p)',ext:'mp4',type:'video/mp4',args:()=>['-vf','scale=-2:720','-c:v','libx264','-preset','veryfast','-crf','30','-c:a','aac','-b:a','128k','-movflags','+faststart']},
  shrink:{label:'Smaller MP4 (480p)',ext:'mp4',type:'video/mp4',args:()=>['-vf','scale=-2:480','-c:v','libx264','-preset','veryfast','-crf','32','-c:a','aac','-b:a','96k','-movflags','+faststart']}
};

const AUDIO_OPS = {
  mp3:{label:'MP3 192 kbps',ext:'mp3',type:'audio/mpeg',args:()=>['-c:a','libmp3lame','-b:a','192k']},
  small:{label:'MP3 96 kbps (smaller)',ext:'mp3',type:'audio/mpeg',args:()=>['-c:a','libmp3lame','-b:a','96k']},
  wav:{label:'WAV lossless',ext:'wav',type:'audio/wav',args:()=>['-c:a','pcm_s16le']},
  m4a:{label:'M4A (AAC 256k)',ext:'m4a',type:'audio/mp4',args:()=>['-c:a','aac','-b:a','256k']},
  ogg:{label:'OGG Vorbis',ext:'ogg',type:'audio/ogg',args:()=>['-c:a','libvorbis','-q:a','5']}
};

const IMAGE_TARGETS = {
  jpeg:{label:'JPEG',mime:'image/jpeg',ext:'jpg'},
  png:{label:'PNG',mime:'image/png',ext:'png'},
  webp:{label:'WebP',mime:'image/webp',ext:'webp'}
};

const SIGNATURES = [
  {kind:'image',ext:['png'],test:b=>b[0]===0x89&&b[1]===0x50&&b[2]===0x4e&&b[3]===0x47},
  {kind:'image',ext:['jpg','jpeg'],test:b=>b[0]===0xff&&b[1]===0xd8&&b[2]===0xff},
  {kind:'image',ext:['gif'],test:b=>b.slice(0,3).toString('latin1')==='GIF'},
  {kind:'image',ext:['webp'],test:b=>b.slice(0,4).toString('latin1')==='RIFF'&&b.slice(8,12).toString('latin1')==='WEBP'},
  {kind:'video',ext:['mp4','m4v','mov','3gp'],test:b=>b.slice(4,8).toString('latin1')==='ftyp'},
  {kind:'audio',ext:['mp3'],test:b=>b.slice(0,3).toString('latin1')==='ID3'||(b[0]===0xff&&(b[1]&0xe0)===0xe0)},
  {kind:'audio',ext:['wav'],test:b=>b.slice(0,4).toString('latin1')==='RIFF'&&b.slice(8,12).toString('latin1')==='WAVE'},
  {kind:'audio',ext:['flac'],test:b=>b.slice(0,4).toString('latin1')==='fLaC'},
  {kind:'audio',ext:['ogg','oga','opus'],test:b=>b.slice(0,4).toString('latin1')==='OggS'},
  {kind:'archive',ext:['zip'],test:b=>b.slice(0,2).toString('latin1')==='PK'},
  {kind:'archive',ext:['gz','tar'],test:b=>b[0]===0x1f&&b[1]===0x8b},
  {kind:'archive',ext:['rar'],test:b=>b.slice(0,7).toString('latin1')==='Rar!'},
  {kind:'archive',ext:['7z'],test:b=>b.slice(0,2).toString('latin1')==='7z'},
  {kind:'document',ext:['pdf'],test:b=>b.slice(0,5).toString('latin1')==='%PDF-'},
  {kind:'document',ext:['doc','docx','odt','rtf'],test:b=>b.slice(0,2).toString('latin1')==='PK'||b.slice(0,5).toString('latin1')==='{\\rtf'},
  {kind:'font',ext:['ttf','otf','woff','woff2'],test:b=>b.slice(0,4).toString('latin1')==='wOFF'||b[0]===0x00&&b[1]===0x01&&b[2]===0x00&&b[3]===0x00||b.slice(0,4).toString('latin1')==='OTTO'}
];

const BY_EXTENSION = {
  mp4:'video',m4v:'video',mov:'video',webm:'video',mkv:'video',avi:'video',mpg:'video',mpeg:'video',wmv:'video',flv:'video','3gp':'video',
  mp3:'audio',wav:'audio',m4a:'audio',aac:'audio',ogg:'audio',oga:'audio',opus:'audio',flac:'audio',wma:'audio',aiff:'audio',
  png:'image',jpg:'image',jpeg:'image',webp:'image',gif:'image',bmp:'image',avif:'image',heic:'image',tiff:'image',tif:'image',svg:'image',
  zip:'archive',rar:'archive','7z':'archive',gz:'archive',tar:'archive',
  pdf:'document',doc:'document',docx:'document',odt:'document',rtf:'document',ppt:'document',pptx:'document',xls:'document',xlsx:'document',
  ttf:'font',otf:'font',woff:'font',woff2:'font'
};

const FFMPEG_JS = 'https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/dist/umd/ffmpeg.js';
const FFMPEG_CORE = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd';

function escapeHtml(value){
  return String(value==null?'':value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function baseName(name){
  return String(name||'file').replace(/\.[^.]+$/,'');
}
function readBytes(file,count){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(new Uint8Array(reader.result));
    reader.onerror=()=>reject(reader.error||new Error('Could not read that file.'));
    reader.readAsArrayBuffer(file.slice(0,count));
  });
}
async function sniff(file){
  const name=(file.name||'').toLowerCase();
  const ext=(name.split('.').pop()||'').split(/[?#]/)[0];
  let kind=BY_EXTENSION[ext]||null;
  try{
    const head=await readBytes(file,16);
    for(const sig of SIGNATURES){
      let hit=false;
      try{hit=sig.test(head)}catch(error){hit=false}
      if(hit){kind=sig.kind;break}
    }
  }catch(error){/* the extension is enough to carry on */}
  if((kind==='video'||kind==='audio')&&name.endsWith('.m4a'))kind='audio';
  return {ext,kind:kind||'unknown'};
}
function probeImage(file){
  return createImageBitmap(file).then(bitmap=>{const out={width:bitmap.width,height:bitmap.height};bitmap.close&&bitmap.close();return out}).catch(()=>null);
}
function probeMedia(file,kind){
  return new Promise(resolve=>{
    const url=URL.createObjectURL(file);
    const el=document.createElement(kind==='video'?'video':'audio');
    let settled=false;
    const done=value=>{if(settled)return;settled=true;URL.revokeObjectURL(url);resolve(value)};
    el.preload='metadata';
    el.onloadedmetadata=()=>done({
      width:el.videoWidth||null,
      height:el.videoHeight||null,
      seconds:isFinite(el.duration)?Math.round(el.duration):null
    });
    el.onerror=()=>done(null);
    setTimeout(()=>done(null),8000);
    el.src=url;
  });
}
function sizeText(bytes){
  if(!isFinite(bytes))return 'unknown size';
  const units=['bytes','KB','MB','GB'];
  let value=bytes,index=0;
  while(value>=1024&&index<units.length-1){value/=1024;index++}
  return (index===0?value:Math.round(value*10)/10)+' '+units[index];
}
function durationText(seconds){
  if(!isFinite(seconds)||seconds<=0)return '';
  const m=Math.floor(seconds/60),s=Math.round(seconds%60);
  return m+' min '+(s<10?'0':'')+s+' s';
}

function loadScript(src){
  return new Promise((resolve,reject)=>{
    if(document.querySelector('script[data-ffmpeg-js]'))return resolve();
    const el=document.createElement('script');
    el.src=src;el.async=true;el.dataset.ffmpegJs='1';
    el.onload=()=>resolve();
    el.onerror=()=>reject(new Error('The conversion engine could not be downloaded.'));
    document.head.appendChild(el);
  });
}
async function blobUrl(url,type){
  const response=await fetch(url);
  if(!response.ok)throw new Error('The conversion engine could not be downloaded.');
  return URL.createObjectURL(await response.blob());
}

let enginePromise=null;
function engine(){
  if(enginePromise)return enginePromise;
  enginePromise=(async()=>{
    await loadScript(FFMPEG_JS);
    const Ctor=window.FFmpegWASM&&window.FFmpegWASM.FFmpeg;
    if(!Ctor)throw new Error('The conversion engine did not start.');
    const ff=new Ctor();
    const core=await blobUrl(FFMPEG_CORE+'/ffmpeg-core.js','text/javascript');
    const wasm=await blobUrl(FFMPEG_CORE+'/ffmpeg-core.wasm','application/wasm');
    try{
      await ff.load({coreURL:core,wasmURL:wasm});
    }catch(error){
      /* Newer builds split the worker out; without this the engine never starts on some browsers. */
      const worker=await blobUrl('https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/dist/umd/814.ffmpeg.js','text/javascript');
      await ff.load({coreURL:core,wasmURL:wasm,classWorkerURL:worker});
    }
    return ff;
  })().catch(error=>{enginePromise=null;throw error});
  return enginePromise;
}

async function runEngine(file,op,onProgress){
  const ff=await engine();
  const input='input-'+(file.name||'file').replace(/[^\w.-]/g,'_');
  const output='output.'+op.ext;
  const listener=({progress})=>{if(onProgress&&isFinite(progress))onProgress(Math.max(0,Math.min(1,progress)))};
  ff.on('progress',listener);
  try{
    await ff.writeFile(input,new Uint8Array(await file.arrayBuffer()));
    const code=await ff.exec(['-i',input,...op.args(),output]);
    if(code&&code!==0)throw new Error('The conversion did not finish cleanly.');
    const data=await ff.readFile(output);
    await ff.deleteFile(input).catch(()=>{});
    await ff.deleteFile(output).catch(()=>{});
    const bytes=data instanceof Uint8Array?data:new Uint8Array(data);
    return new File([bytes],baseName(file.name)+'-converted.'+op.ext,{type:op.type});
  }finally{
    ff.off('progress',listener);
  }
}

async function convertImage(file,target,quality){
  const bitmap=await createImageBitmap(file).catch(()=>null);
  if(!bitmap)throw new Error('This image could not be opened.');
  const canvas=document.createElement('canvas');
  canvas.width=bitmap.width;canvas.height=bitmap.height;
  const ctx=canvas.getContext('2d');
  ctx.drawImage(bitmap,0,0);
  bitmap.close&&bitmap.close();
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,target.mime,quality));
  if(!blob)throw new Error('This image could not be re-encoded.');
  return new File([blob],baseName(file.name)+'.'+target.ext,{type:target.mime});
}
async function compressPdf(file){
  const mod=await import('https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.esm.min.js');
  const doc=await mod.PDFDocument.load(await file.arrayBuffer());
  const out=await doc.save({useObjectStreams:true});
  return new File([out],baseName(file.name)+'-compressed.pdf',{type:'application/pdf'});
}
async function audioToWav(file){
  const ctx=new (window.AudioContext||window.webkitAudioContext)();
  const buffer=await ctx.decodeAudioData(await file.arrayBuffer());
  const channels=buffer.numberOfChannels,frames=buffer.length,rate=buffer.sampleRate;
  const block=16,data=new ArrayBuffer(44+frames*channels*block),view=new DataView(data);
  const ascii=(offset,text)=>{for(let i=0;i<text.length;i++)view.setUint8(offset+i,text.charCodeAt(i))};
  ascii(0,'RIFF');view.setUint32(4,36+frames*channels*block,true);ascii(8,'WAVE');
  ascii(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,channels,true);
  view.setUint32(24,rate,true);view.setUint32(28,rate*channels*block,true);view.setUint16(32,channels*block,true);view.setUint16(34,16,true);
  ascii(36,'data');view.setUint32(40,frames*channels*block,true);
  const samples=[];
  for(let c=0;c<channels;c++)samples.push(buffer.getChannelData(c));
  let offset=44;
  for(let i=0;i<frames;i++)for(let c=0;c<channels;c++){const s=Math.max(-1,Math.min(1,samples[c][i]));view.setInt16(offset,s<0?s*0x8000:s*0x7fff,true);offset+=2}
  ctx.close();
  return new File([data],baseName(file.name)+'.wav',{type:'audio/wav'});
}

function toolLinks(names){
  return names.map(name=>ONLINE_TOOLS.find(tool=>tool.name===name)).filter(Boolean);
}

export function mountToolsStudio(root,helper){
  const download=helper&&helper.downloadBlob?helper.downloadBlob:(blob,name)=>{
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);a.download=name;
    document.body.appendChild(a);a.click();
    setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},0);
  };
  let current=null;
  let busy=false;
  let activeTrimmer=null;
  let trimmerImport=null;
  let craftApi=null;
  async function loadTrimmer(){
    if(!trimmerImport)trimmerImport=import('./tools-video-trim.js?v=20261014-local-trim-1').catch(error=>{trimmerImport=null;throw error});
    return trimmerImport;
  }

  if(!document.getElementById('biglwaToolsTrimCss')){
    const style=document.createElement('style');style.id='biglwaToolsTrimCss';
    style.textContent='.tool-trim-area{margin:16px 0;padding:15px;border:1px solid #bdaba0;border-radius:13px;background:#faf5ec}.tool-trim-area h3{margin:0 0 8px;font:700 20px Georgia,serif}.tool-trim-timeline{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin:10px 0}.tool-trim-timeline label{display:grid;gap:5px;min-width:0;font:700 12px system-ui}.tool-trim-timeline input{width:100%;box-sizing:border-box;padding:9px;border:1px solid #bfa99a;border-radius:7px;background:#fff}.tool-trim-area [data-trim-status]{font:600 11px/1.45 system-ui}.tool-trim-area .tool-actions{display:flex;flex-wrap:wrap;gap:8px}.tool-trim-area [data-trim-preview]:focus-visible,.tool-trim-area [data-trim-export]:focus-visible{outline:3px solid #b05769;outline-offset:2px}@media(max-width:500px){.tool-trim-timeline{grid-template-columns:1fr}}';
    document.head.appendChild(style);
  }
  root.innerHTML=`
    <section class="module-card wide" id="craftSuite" aria-label="BIG LWA creative workshop"><p role="status">Opening the BIG LWA workshop…</p></section>
    <section class="tool-intake">
      <div class="tool-drop" id="toolDrop" tabindex="0" role="button" aria-label="Drop a file here or choose one">
        <strong>Drop a file here</strong>
        <span>Video, audio, images, PDFs, archives, documents, anything.</span>
        <em>BIGLWA works out what it is and offers the conversions that suit it. Files up to 500 MB are accepted locally; large video trimming does not upload.</em>
        <button class="module-action" type="button" id="toolPick">Choose a file</button>
        <input id="toolFile" type="file" multiple hidden>
      </div>
      <div class="tool-status" id="toolStatus">Nothing loaded yet.</div>
      <div class="tool-progress" id="toolProgress" hidden><span id="toolProgressBar"></span><em id="toolProgressText"></em></div>
    </section>
    <section class="tool-result" id="toolResult"></section>
    <section class="tool-groups" id="toolGroups"></section>
    <section class="module-card wide tool-directory">
      <h2>Online converters</h2>
      <p>These run on someone else's server, so your file leaves this device. Use them for the conversions a browser cannot do.</p>
      <div class="tool-directory-grid">
        ${ONLINE_TOOLS.map(tool=>`<a class="tool-directory-item" href="${tool.url}" target="_blank" rel="noopener nofollow"><b>${escapeHtml(tool.name)}</b><span>${escapeHtml(tool.best)}</span></a>`).join('')}
      </div>
    </section>
    <section class="module-card wide tool-links">
      <h2>Media from a link</h2>
      <p>Preview supported YouTube, TikTok and SoundCloud posts here. The original creator hosts the media, and your file stays on its source site.</p>
      <form class="module-form two" id="toolLinkForm">
        <input class="module-input" name="url" type="url" placeholder="Paste a YouTube, TikTok or SoundCloud link…">
        <button class="module-action" type="submit">Preview media</button>
      </form>
      <div class="module-status" id="toolLinkStatus">No media selected.</div>
      <div class="tool-link-preview" id="toolLinkPreview" aria-live="polite"></div>
      <p class="tool-note">BIGLWA does not scrape or re-encode other people's posts, so it cannot strip a watermark off a TikTok or Reels someone else posted. For your own uploads, save them from the app, which gives you the clean copy without any added watermark, then convert that file here.</p>
    </section>`;

  // Independently load creative editors; file conversions and video trim still
  // work even when the external ArtCraft release build is unavailable.
  import('./tools-craft.js?v=20261029-weekly-red-3')
    .then(mod=>mod.mountCraftSuite(root.querySelector('#craftSuite')))
    .then(api=>{craftApi=api})
    .catch(error=>{
      console.warn('BIG LWA Workshop integration:',error);
      const el=root.querySelector('#craftSuite');
      if(el)el.innerHTML='<h2>the workshop</h2><p>The creative editor could not load. <a href="https://getartcraft.com/apps" target="_blank" rel="noopener noreferrer">GetArtCraft apps ↗</a></p>';
    });

  const statusEl=root.querySelector('#toolStatus');
  const resultEl=root.querySelector('#toolResult');
  const groupsEl=root.querySelector('#toolGroups');
  const progressEl=root.querySelector('#toolProgress');
  const barEl=root.querySelector('#toolProgressBar');
  const textEl=root.querySelector('#toolProgressText');
  const input=root.querySelector('#toolFile');
  const drop=root.querySelector('#toolDrop');

  root.querySelector('#toolPick').addEventListener('click',()=>input.click());
  drop.addEventListener('click',event=>{if(event.target===drop||event.target.tagName==='STRONG'||event.target.tagName==='SPAN'||event.target.tagName==='EM')input.click()});
  drop.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();input.click()}});
  input.addEventListener('change',()=>{if(input.files&&input.files[0])handle(input.files[0])});
  ['dragenter','dragover'].forEach(type=>drop.addEventListener(type,event=>{event.preventDefault();drop.classList.add('is-over')}));
  ['dragleave','drop'].forEach(type=>drop.addEventListener(type,event=>{event.preventDefault();drop.classList.remove('is-over')}));
  drop.addEventListener('drop',event=>{
    const file=event.dataTransfer&&event.dataTransfer.files&&event.dataTransfer.files[0];
    if(file)handle(file);
  });
  root.querySelector('#toolLinkForm').addEventListener('submit',event=>{
    event.preventDefault();
    const link=String(new FormData(event.target).get('url')||'').trim();
    const note=root.querySelector('#toolLinkStatus'),preview=root.querySelector('#toolLinkPreview');
    preview.replaceChildren();
    if(!link){note.textContent='Paste a link first.';return}
    let url;
    try{url=new URL(link)}catch{note.textContent='That needs to be a full link starting with https://';return}
    if(url.protocol!=='https:'||url.username||url.password||url.port){
      note.textContent='Use a secure https:// media link.';return
    }
    const host=url.hostname.toLowerCase();
    let embed='',label='';
    if(['youtube.com','www.youtube.com','m.youtube.com','youtu.be'].includes(host)){
      const id=host==='youtu.be'?url.pathname.slice(1):url.pathname.startsWith('/shorts/')?url.pathname.split('/')[2]:url.searchParams.get('v');
      if(/^[A-Za-z0-9_-]{11}$/.test(id||'')){embed='https://www.youtube-nocookie.com/embed/'+id;label='YouTube'}
    }else if(['tiktok.com','www.tiktok.com','m.tiktok.com'].includes(host)){
      const id=url.pathname.match(/^\/@[A-Za-z0-9._-]{1,80}\/video\/(\d{10,30})\/?$/)?.[1];
      if(id){embed='https://www.tiktok.com/player/v1/'+id;label='TikTok'}
    }else if(['soundcloud.com','www.soundcloud.com'].includes(host)){
      if(/^\/[^/]+\/[^/]+/.test(url.pathname)){embed='https://w.soundcloud.com/player/?url='+encodeURIComponent(url.href);label='SoundCloud'}
    }
    if(!embed){
      note.textContent='Preview is available for supported YouTube, TikTok and SoundCloud post links.';
      return;
    }
    const frame=document.createElement('iframe');
    frame.title=label+' media preview';frame.loading='lazy';
    frame.referrerPolicy='strict-origin-when-cross-origin';
    frame.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.style.cssText='display:block;width:100%;height:'+ (label==='SoundCloud'?'180px':'420px')+';max-height:76vh;border:0;border-radius:12px';
    frame.src=embed;
    const original=document.createElement('a');
    original.href=url.href;original.target='_blank';original.rel='noopener noreferrer';
    original.textContent='Open original on '+label+' ↗';
    original.className='module-action ghost';
    preview.append(frame,original);
    note.textContent='Previewing '+label+' · playback is provided by the original source.';
  });

  function setProgress(fraction,text){
    if(fraction==null){progressEl.hidden=true;return}
    progressEl.hidden=false;
    barEl.style.width=Math.round(fraction*100)+'%';
    textEl.textContent=text;
  }

  async function save(file,label){
    download(file,file.name);
    statusEl.textContent='Saved '+file.name+' — '+sizeText(file.size)+'.';
    resultEl.innerHTML='<div class="tool-done"><b>'+escapeHtml(label)+'</b><span>'+escapeHtml(file.name)+' · '+sizeText(file.size)+'</span></div>';
  }

  async function run(label,job){
    if(busy)return;
    busy=true;
    statusEl.textContent=label+'…';
    setProgress(0,label);
    const started=Date.now();
    try{
      const out=await job(progress=>setProgress(progress,label+'…'));
      setProgress(1,label+' done');
      await save(out,label);
    }catch(error){
      statusEl.textContent=label+' did not work: '+(error&&error.message?error.message:'unknown problem');
      console.error('BIGLWA Tools — '+label+' failed:',error);
      setProgress(null);
      root.querySelector('#toolGroups').querySelectorAll('button').forEach(button=>{button.disabled=false});
    }finally{
      busy=false;
      setTimeout(()=>setProgress(null),900);
      console.log(label+' took '+((Date.now()-started)/1000).toFixed(1)+'s');
    }
  }

  function operationButtons(entries){
    return entries.map(entry=>{
      const {op,label}=entry;
      return '<button class="module-action" type="button" data-op="'+escapeHtml(op)+'">'+escapeHtml(label)+'</button>';
    }).join('');
  }

  async function handle(file){
    if(!file)return;
    if(file.size>MAX_LOCAL_FILE_BYTES){
      statusEl.textContent='File too large: '+sizeText(file.size)+'. Maximum: 500 MB per file. Nothing was uploaded.';
      resultEl.innerHTML='';groupsEl.replaceChildren();return;
    }
    activeTrimmer?.dispose();activeTrimmer=null;
    current=file;
    statusEl.textContent='Looking at '+file.name+' ('+sizeText(file.size)+')…';
    resultEl.innerHTML='';
    const found=await sniff(file);
    const kind=found.kind;
    const meta=[];
    meta.push('Recognised as '+kind);
    meta.push(sizeText(file.size));
    if(found.ext)meta.push('.'+found.ext);
    let extra={};
    if(kind==='image'){
      extra=await probeImage(file)||{};
      if(extra.width)meta.push(extra.width+' × '+extra.height+' px');
    }else if(kind==='video'||kind==='audio'){
      extra=await probeMedia(file,kind)||{};
      if(extra.width)meta.push(extra.width+' × '+extra.height+' px');
      if(extra.seconds)meta.push(durationText(extra.seconds));
    }
    statusEl.textContent=file.name+' — '+meta.join(' · ');

    const online=ONLINE_BY_KIND[kind]||ONLINE_BY_KIND.unknown;
    const links=toolLinks(online.tools);
    let local=[];
    if(kind==='video')local=[
      {op:'mp4',label:'MP4 video'},
      {op:'mov',label:'MOV video'},
      {op:'mp3',label:'MP3 audio only'},
      {op:'wav',label:'WAV audio only'},
      {op:'compress',label:'Compress to 720p'},
      {op:'shrink',label:'Compress to 480p'},
      {op:'webm',label:'WebM video'}
    ];
    else if(kind==='audio')local=[
      {op:'mp3',label:'MP3 192 kbps'},
      {op:'small',label:'MP3 96 kbps'},
      {op:'m4a',label:'M4A'},
      {op:'wav',label:'WAV lossless'},
      {op:'browserwav',label:'WAV lossless (fast, browser decoder)'},
      {op:'ogg',label:'OGG'}
    ];
    else if(kind==='image')local=[
      {op:'jpeg',label:'JPEG'},
      {op:'png',label:'PNG'},
      {op:'webp',label:'WebP'},
      {op:'webp-small',label:'WebP, smaller file'},
      {op:'jpeg-small',label:'JPEG, smaller file'}
    ];
    else if(kind==='document'&&/\.pdf$/i.test(file.name))local=[{op:'pdf',label:'Compress PDF'}];
    else if(kind==='audio'&&/\.pdf$/i.test(file.name))local=[];

    let localHtml='';
    if(kind==='video'||kind==='audio'){
      localHtml='<p class="tool-note">Local conversion uses FFmpeg inside the browser, not an upload. Files over 125 MB may exceed available memory during full conversion. Use Trim video below or a desktop tool for large re-encoding; 500 MB is the local selection/trim limit, not a full conversion guarantee.</p>'+
        '<div class="tool-actions" data-kind="'+kind+'">'+operationButtons(local)+'</div>';
    }else if(kind==='image'){
      localHtml='<p class="tool-note">Image conversions are drawn and re-encoded in this tab, so nothing is uploaded.</p>'+
        '<div class="tool-actions" data-kind="image"><button class="module-action" type="button" data-lwa-edit-image>✎ Edit in BIG LWA sqwibblR</button>'+operationButtons(local)+'</div>';
    }else if(local.length){
      localHtml='<div class="tool-actions" data-kind="'+kind+'">'+operationButtons(local)+'</div>';
    }

    groupsEl.innerHTML=
      '<section class="module-card wide tool-group"><h2>'+escapeHtml(file.name)+'</h2>'+
      '<div class="tool-facts">'+meta.map(fact=>'<span>'+escapeHtml(fact)+'</span>').join('')+'</div>'+
      localHtml+
      (kind==='video'?'<section id="biglwaVideoTrim" class="tool-trim-area" aria-label="Trim selected video"><p role="status">Preparing trim…</p></section>':'')+
      '<h3>Or use a converter online</h3><p class="tool-note">'+escapeHtml(online.note)+'</p>'+
      '<div class="tool-actions">'+links.map(link=>'<a class="module-action ghost" href="'+link.url+'" target="_blank" rel="noopener nofollow">'+escapeHtml(link.name)+'</a>').join('')+'</div></section>';

    if(kind==='video'){
      try{
        const {mountVideoTrimmer}=await loadTrimmer();
        if(current!==file)return;
        activeTrimmer=mountVideoTrimmer(groupsEl.querySelector('#biglwaVideoTrim'),file,{
          download,
          onStatus:message=>{if(statusEl)statusEl.textContent=file.name+' · '+message},
          onProgress:value=>setProgress(value,'Trimming video…')
        });
      }catch(error){
        const area=groupsEl.querySelector('#biglwaVideoTrim');
        if(area)area.textContent='Trim tools could not load: '+(error.message||'reload and retry.');
      }
    }
    const editImage=groupsEl.querySelector('[data-lwa-edit-image]');
    if(editImage)editImage.addEventListener('click',()=>{
      if(!craftApi?.editFile?.(file)){
        statusEl.textContent='The Workshop is still opening. Use sqwibblR below, or select this photo again.';
        return;
      }
      statusEl.textContent='Opened '+file.name+' in your BIG LWA sqwibblR. The file stays in this browser.';
      root.querySelector('#craftSuite')?.scrollIntoView({behavior:'smooth',block:'start'});
    });
    groupsEl.querySelectorAll('button[data-op]').forEach(button=>{
      button.addEventListener('click',()=>{
        const key=button.dataset.op;
        const kindAttr=button.parentElement.dataset.kind;
        const label=button.textContent;
        if(kindAttr==='image'){
          if(key==='webp-small')return run(label,async progress=>{progress(0.4);const out=await convertImage(file,IMAGE_TARGETS.webp,0.72);progress(1);return out});
          if(key==='jpeg-small')return run(label,async progress=>{progress(0.4);const out=await convertImage(file,IMAGE_TARGETS.jpeg,0.72);progress(1);return out});
          const target=IMAGE_TARGETS[key];
          return run(label,async progress=>{progress(0.4);const out=await convertImage(file,target,0.92);progress(1);return out});
        }
        if(key==='browserwav'){
          /* The browser's own decoder handles a few codecs the FFmpeg build lacks, and needs
             no 30 MB engine download, so it stays available as a second way to get a WAV. */
          return run(label,async progress=>{progress(0.35);const out=await audioToWav(file);progress(1);return out});
        }
        const table=kindAttr==='video'?VIDEO_OPS:AUDIO_OPS;
        const op=table[key];
        if(!op)return;
        if(file.size>MEMORY_HEAVY_TRANSCODE){
          statusEl.textContent='This '+sizeText(file.size)+' file was accepted for preview/trim, but full FFmpeg conversion exceeds the safer 125 MB in-browser threshold and could crash the tab. Try Trim video above or HandBrake for full conversion.';
          return;
        }
        return run(label,progress=>runEngine(file,op,progress));
      });
    });
  }

  return {handle};
}