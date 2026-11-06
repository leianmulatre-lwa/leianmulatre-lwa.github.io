/* BIG LWA visualslidez · independently stored from original visualeyez boards.
   PowerPoint import preserves full source; browser scene preview is best effort. */
(()=>{'use strict';
if(window.BigLWAVisualSlidez)return;
const colors=['#c35665','#e69250','#ddb43e','#5a9675','#4f90bd','#966cb6'];
const key=()=> 'biglwaVisualSlidez:v1:'+String(window.__biglwaIdentity?.uid||window.BigLWAAccountStorage?.uid||'guest').replace(/[^A-Za-z0-9_-]/g,'');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const make=()=>({title:'New slide',body:'',notes:''});
let slides=[],selected=0,root=null,busy=false,sourcePptx=null,sourceMeta=null,userTouched=false;
function save(){
 userTouched=true;
 if(sourcePptx||slides.some(x=>x.imported)){
   // Save original OOXML and rich scene in IndexedDB, not quota-limited localStorage.
   window.BigLWAVisualPptx?.persist?.(key(),slides,sourcePptx,sourceMeta)?.catch?.(()=>say('Storage unavailable. Download Backup before leaving.'));
   try{localStorage.setItem(key(),JSON.stringify({imported:true,total:slides.length}))}catch{}
 }else try{localStorage.setItem(key(),JSON.stringify({slides}))}catch{say('Browser storage full. Export a backup.')}
}
function say(msg){const el=root?.querySelector('[data-status]');if(el)el.textContent=msg}
function draw(){
 if(!root?.isConnected)return;
 const current=slides[selected],edge=colors[selected%colors.length],imported=Boolean(current.imported&&current.scene);
 const types=['Normal','Title','Scene heading','Action','Character','Dialogue','Parenthetical','Transition','Shot'];
 const type=(current.textKind||'Normal');
 const typeSelect='<label class="vs-format-label">Text format <select data-text-kind aria-label="Text format">'+types.map(v=>'<option'+(v===type?' selected':'')+'>'+v+'</option>').join('')+'</select></label>';
 const content=imported?'<div class="vs-original-stage" data-imported-preview></div>':
  '<div class="vs-stitch vs-format-'+esc(type.toLowerCase().replace(/[^a-z]+/g,'-'))+'"><input data-title aria-label="Slide title" maxlength="300" value="'+esc(current.title)+'">'+typeSelect+'<textarea data-body aria-label="Slide contents" maxlength="6000">'+esc(current.body)+'</textarea><small>'+(selected+1)+' / '+slides.length+'</small></div>';
 const controls=sourcePptx?'<button data-original type="button">Original PPTX</button><button data-details type="button">Metadata</button>':'';
 const visualNote=imported?'<p class="vs-import-explainer">Visual preview of imported slide; pictures, positioned text and available font styles are retained. The exact original deck (including unsupported effects) can be downloaded above.</p><button data-plain-copy>Create editable text copy</button>':'';

 let driveHref='https://drive.google.com/';
 try{
   const saved=window.BigLWAOrbitAccountLinks?.get?.()?.drive;
   const u=new URL(saved);
   if(u.protocol==='https:'&&!u.port&&!u.username&&!u.password&&
      (u.hostname==='drive.google.com'||u.hostname.endsWith('.drive.google.com')))driveHref=u.href;
 }catch{}
 
 root.innerHTML='<div class="vs-nav-row"><nav class="visualz-tabs" aria-label="Visualz workspaces"><button type="button" data-visualz-mode="visualeyez" aria-pressed="false">visual·eyez</button><button type="button" data-visualz-mode="visualslidez" class="active" aria-pressed="true">visual·slidez</button></nav><small class="vs-private-label">Private slide drafts · backup and export to move devices</small></div><header class="vs-toolbar"><div class="vs-buttons"><button data-new>+ New slide</button><button data-remove>Delete slide</button><button data-backup>Backup</button><label>Import<input type="file" data-import accept=".json,.pptx" hidden></label><button data-pptx>Export PowerPoint</button>'+controls+'<a data-drive-link target=\"_blank\" rel=\"noopener noreferrer\" href=\"'+esc(driveHref)+'\">Open Drive ↗</a></div></header>'+
 '<div class="vs-layout"><nav class="vs-pages" aria-label="Slides">'+slides.map((v,i)=>'<button class="'+(i===selected?'active':'')+'" data-select="'+i+'" style="--rainbow:'+colors[i%colors.length]+'"><span>Slide '+(i+1)+'</span><strong>'+esc(v.title||'Untitled')+'</strong></button>').join('')+'</nav>'+
 '<div class="vs-editor"><div class="vs-slide" style="--rainbow:'+edge+'">'+content+'</div>'+visualNote+'<div data-details-host></div><label class="vs-notes">Speaker notes<textarea data-notes maxlength="3000" rows="2">'+esc(current.notes||'')+'</textarea></label><div class="vs-bottom"><button data-prev>← Previous</button><span>'+(selected+1)+' / '+slides.length+'</span><button data-next>Next →</button></div><p data-status role="status">Private drafts in this browser. Export a backup to move devices.</p></div></div>';
  if(imported)window.BigLWAVisualPptx?.paint(current,root.querySelector('[data-imported-preview]'));
  document.dispatchEvent(new CustomEvent('biglwa:visualz-toolbar-ready'));
}
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),12000)}
function dependency(url,test){if(test())return Promise.resolve();return new Promise((ok,bad)=>{const s=document.createElement('script');s.src=url;s.onload=()=>test()?ok():bad(Error('Library unavailable'));s.onerror=()=>bad(Error('Library download failed'));document.head.append(s)})}
async function writePptx(){
 if(sourcePptx&&slides.every(x=>x.imported)){
   download(new Blob([sourcePptx],{type:'application/vnd.openxmlformats-officedocument.presentationml.presentation'}),(sourceMeta?.fileName||'imported.pptx').replace(/\.pptx$/i,'')+'-preserved.pptx');
   say('Exported unchanged original PowerPoint. Notes edited here need a Backup to retain edits.');
   return;
 }
 await dependency('https://cdn.jsdelivr.net/gh/gitbrent/pptxgenjs@3.12.0/dist/pptxgen.bundle.js',()=>typeof window.pptxgen==='function');
 const pptx=new window.pptxgen();pptx.layout='LAYOUT_WIDE';pptx.author='BIG LWA';pptx.title='visualslidez';
 for(let i=0;i<slides.length;i++){
  const slide=pptx.addSlide(),color=colors[i%colors.length].slice(1),value=slides[i];slide.background={color:'FFFAEF'};
  slide.addShape(pptx.ShapeType.rect,{x:.28,y:.28,w:12.77,h:6.93,line:{color,width:6},fill:{color:'FFFAEF'}});
  slide.addShape(pptx.ShapeType.rect,{x:.46,y:.46,w:12.4,h:6.5,line:{color,width:1,dashType:'dash'},fill:{color:'FFFAEF',transparency:100}});
  if(value.imported&&value.scene){
     slide.background={color:(value.scene.background||'#ffffff').replace('#','')};
     for(const obj of value.scene.items||[]){
       const pos={x:(obj.x||0)*.13333,y:(obj.y||0)*.075,w:Math.max(.04,(obj.w||0)*.13333),h:Math.max(.04,(obj.h||0)*.075)};
       if(obj.kind==='image'&&obj.src){try{slide.addImage({data:obj.src,...pos})}catch{}}
       if(obj.kind==='text'){
         const run=obj.paragraphs?.flatMap(x=>x.runs||[]).find(x=>x.text);
         slide.addText(obj.text||'',{...pos,margin:0,fontFace:run?.font||'Georgia',fontSize:run?.size||18,color:(run?.color||'#372831').replace('#',''),bold:!!run?.bold,italic:!!run?.italic,fit:'shrink'});
       }
       if(obj.kind==='shape')slide.addShape(obj.geometry==='ellipse'?pptx.ShapeType.ellipse:pptx.ShapeType.rect,{...pos,line:{color:(obj.line||'#ffffff').replace('#',''),transparency:obj.line?0:100},fill:{color:(obj.fill||'#ffffff').replace('#',''),transparency:obj.fill?0:100}});
     }
  }else{
   slide.addText(value.title,{x:.92,y:1.05,w:11.4,h:1.25,fontFace:'Georgia',fontSize:35,bold:true,color:'372831'});
   slide.addText(value.body,{x:.92,y:2.4,w:11.4,h:3.9,fontFace:'Georgia',fontSize:20,color:'372831',valign:'top'});
  }
  if(value.notes&&typeof slide.addNotes==='function')slide.addNotes(value.notes);
 }
 await pptx.writeFile({fileName:'visualslidez.pptx'});
}
async function importSlides(file){
 if(file.size>25*1024*1024)throw Error('Presentation limit is 25 MB');
 if(/\.json$/i.test(file.name)){
   const backup=JSON.parse(await file.text());
   if(backup.type!=='BIGLWA.visualslidez'||!Array.isArray(backup.slides))throw Error('Invalid backup');
   return {slides:backup.slides.slice(0,120),binary:null,metadata:backup.metadata||null};
 }
 if(!/\.pptx$/i.test(file.name))throw Error('Choose .pptx or .json');
 await dependency('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js',()=>!!window.JSZip);
 await dependency('/visualslidez-pptx-import.js?v=20261026-package-1',()=>!!window.BigLWAVisualPptx);
 return window.BigLWAVisualPptx.load(file,window.JSZip);
}
function mount(host){
 if(!host)return;root=host;let saved;
 try{saved=JSON.parse(localStorage.getItem(key())||'null')}catch{}
 slides=Array.isArray(saved?.slides)?saved.slides.slice(0,120).map(v=>({title:String(v.title||'').slice(0,300),body:String(v.body||'').slice(0,6000),notes:String(v.notes||'').slice(0,3000)})):[];
 if(!slides.length)slides=[{title:'Your opening slide',body:'Your story starts here.',notes:''}];
 selected=Math.min(selected,slides.length-1);draw();
 dependency('/visualslidez-pptx-import.js?v=20261026-package-1',()=>!!window.BigLWAVisualPptx)
  .then(()=>window.BigLWAVisualPptx.restore(key()))
  .then(saved=>{if(!saved?.slides?.length||userTouched||!root?.isConnected)return;
     slides=saved.slides.slice(0,120);sourcePptx=saved.binary||null;sourceMeta=saved.metadata||null;
     selected=0;draw();
  }).catch(()=>{});

 if(host.dataset.bound==='1')return;host.dataset.bound='1';
 host.addEventListener('input',e=>{const slide=slides[selected];if(e.target.matches('[data-title]'))slide.title=e.target.value.slice(0,300);else if(e.target.matches('[data-body]'))slide.body=e.target.value.slice(0,6000);else if(e.target.matches('[data-notes]'))slide.notes=e.target.value.slice(0,3000);else return;save();const l=host.querySelector('[data-select="'+selected+'"] strong');if(l)l.textContent=slide.title;});
 host.addEventListener('change',e=>{if(!e.target.matches('[data-text-kind]'))return;
  slides[selected].textKind=e.target.value;save();draw();
 });
 host.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b||busy)return;try{
  if(b.hasAttribute('data-new')){if(slides.length>=120)throw Error('Maximum 120 slides');slides.push(make());selected=slides.length-1;save();draw()}
  else if(b.hasAttribute('data-remove')){if(slides.length>1&&confirm('Delete this slide?')){slides.splice(selected,1);selected=Math.min(selected,slides.length-1);save();draw()}}
  else if(b.hasAttribute('data-select')){selected=Number(b.dataset.select);draw()}
  else if(b.hasAttribute('data-prev')){selected=Math.max(0,selected-1);draw()}
  else if(b.hasAttribute('data-next')){selected=Math.min(slides.length-1,selected+1);draw()}
  else if(b.hasAttribute('data-backup'))download(new Blob([JSON.stringify({type:'BIGLWA.visualslidez',slides,metadata:sourceMeta},null,2)],{type:'application/json'}),'visualslidez.json');
  else if(b.hasAttribute('data-original')){
   if(!sourcePptx)throw Error('No source PowerPoint available');
   download(new Blob([sourcePptx],{type:'application/vnd.openxmlformats-officedocument.presentationml.presentation'}),sourceMeta?.fileName||'original.pptx');
  }
  else if(b.hasAttribute('data-details')){
   const host=root.querySelector('[data-details-host]');
   if(host.hasChildNodes()){host.replaceChildren();return;}
   const dl=document.createElement('dl');dl.className='vs-meta-panel';
   for(const [k,v] of Object.entries(sourceMeta||{})){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=k;dd.textContent=String(v);dl.append(dt,dd);}
   host.append(dl);
  }
  else if(b.hasAttribute('data-plain-copy')){
   if(!confirm('Convert a COPY to editable text? This new slide will not retain the imported artwork. Original PPTX remains available.'))return;
   slides.splice(selected+1,0,{title:slides[selected].title,body:slides[selected].body,notes:slides[selected].notes});
   selected++;save();draw();
  }
  else if(b.hasAttribute('data-pptx')){busy=true;say('Exporting .pptx…');await writePptx();say('Exported .pptx, importable by PowerPoint, Canva and Google Slides.');}
 }catch(err){say(err.message||'Action failed')}finally{busy=false}});
 host.addEventListener('change',async e=>{
 if(!e.target.matches('[data-import]')||busy)return;
 const file=e.target.files?.[0];e.target.value='';
 if(!file||!confirm('Replace the current slide deck? Download a backup first if needed.'))return;
 busy=true;
 try{
  const loaded=await importSlides(file);
  if(!loaded.slides?.length)throw Error('No slides found');
  slides=loaded.slides.map(x=>({...x,title:String(x.title||'').slice(0,300),body:String(x.body||'').slice(0,6000),notes:String(x.notes||'').slice(0,3000)}));
  sourcePptx=loaded.binary||null;sourceMeta=loaded.metadata||null;selected=0;
  save();draw();
  say(sourcePptx?'PowerPoint visuals, images, fonts and source metadata loaded. Original file preserved. Complex effects may be previewed approximately.':'Slide backup restored.');
 }catch(err){say(err.message||'Import failed')}finally{busy=false}
});
}
window.BigLWAVisualSlidez={mount};
const styles=document.createElement('style');styles.textContent=[
 '#lwaVisualSlides{font:500 13px system-ui;color:#38292c}',
 '#lwaVisualSlides .vs-toolbar,#lwaVisualSlides .vs-buttons,#lwaVisualSlides .vs-bottom{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}',
 '#lwaVisualSlides .vs-nav-row{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:4px 0 8px}#lwaVisualSlides .vs-private-label{font:500 11px/1.4 system-ui;color:#78656c;text-align:right;margin-left:auto}#lwaVisualSlides .vs-toolbar{padding:6px 0 11px;justify-content:flex-end!important}#lwaVisualSlides .vs-toolbar .vs-buttons{justify-content:flex-end!important}',
 '#lwaVisualSlides button,#lwaVisualSlides .vs-buttons label,#lwaVisualSlides .vs-buttons a{display:inline-flex;cursor:pointer;border:1px solid #c9ad9f;border-radius:8px;background:#fff8f0;padding:8px 11px;font:700 11px system-ui;text-decoration:none;color:#362832}',
 '#lwaVisualSlides .vs-layout{display:grid;grid-template-columns:145px minmax(0,1fr);gap:14px}',
 '#lwaVisualSlides .vs-pages{display:flex;flex-direction:column;gap:8px;overflow:auto;max-height:600px}',
 '#lwaVisualSlides .vs-pages button{display:grid;text-align:left;gap:6px;min-height:73px;border-left:6px solid var(--rainbow)}',
 '#lwaVisualSlides .vs-pages button.active{outline:2px solid #674159;outline-offset:-2px}',
 '#lwaVisualSlides .vs-pages button{display:flex;flex-direction:column;justify-content:center;align-items:flex-start;box-sizing:border-box;min-width:0;max-width:100%;width:100%;height:76px;min-height:76px;max-height:76px;overflow:hidden;gap:4px;white-space:normal}#lwaVisualSlides .vs-pages button>span{display:block;font:700 12px/1.2 system-ui}#lwaVisualSlides .vs-pages strong{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;max-width:100%;max-height:2.7em;font:650 13px/1.35 Georgia,serif;overflow-wrap:anywhere;white-space:normal}',
 '#lwaVisualSlides .vs-editor{min-width:0}#lwaVisualSlides .vs-slide{width:100%;box-sizing:border-box;aspect-ratio:16/9;border:12px solid var(--rainbow);border-radius:13px;padding:11px;background:#fff3e5}',
 '#lwaVisualSlides .vs-stitch{position:relative;height:100%;box-sizing:border-box;border:3px dashed var(--rainbow);padding:clamp(12px,3vw,43px);display:flex;flex-direction:column;gap:9px;background:#fffaf4}',
 '#lwaVisualSlides .vs-stitch input,#lwaVisualSlides .vs-stitch textarea{width:100%;box-sizing:border-box;border:0;outline:0;background:transparent;resize:none;color:#362832}',
 '#lwaVisualSlides .vs-stitch input{font:700 clamp(20px,3.7vw,48px) Georgia,serif}#lwaVisualSlides .vs-stitch textarea{flex:1;min-height:0;font:clamp(12px,1.8vw,23px)/1.4 Georgia,serif}',
 '#lwaVisualSlides .vs-format-label{font:600 11px/1.4 system-ui;display:flex;gap:9px;align-items:center}#lwaVisualSlides .vs-format-label select{border:1px solid #bfa6a0;background:#fff8ee;border-radius:5px;padding:4px}',
 '#lwaVisualSlides .vs-format-scene-heading textarea,#lwaVisualSlides .vs-format-transition textarea,#lwaVisualSlides .vs-format-character textarea{font-family:monospace;text-transform:uppercase}',
 '#lwaVisualSlides .vs-format-dialogue textarea,#lwaVisualSlides .vs-format-parenthetical textarea{font-family:monospace;padding:0 13%}',
 '#lwaVisualSlides .vs-import-explainer{font:500 11px/1.5 system-ui;color:#6d515b}#lwaVisualSlides .vs-meta-panel{display:grid;gap:4px;padding:9px;border:1px solid #d6afa7;background:#fff9ef}',

 '#lwaVisualSlides .vs-stitch small{position:absolute;right:12px;bottom:7px;font:700 10px monospace;color:var(--rainbow)}',
 '#lwaVisualSlides .vs-notes{display:grid;gap:5px;margin:12px 0;font:700 11px system-ui}#lwaVisualSlides .vs-notes textarea{padding:8px;border-radius:7px;border:1px solid #d0b8a7;background:#fffcf5}',
 '#lwaVisualSlides .vs-bottom{margin:8px 0 11px}#lwaVisualSlides [data-status]{font:600 11px system-ui;color:#78636a}',
 '@media(max-width:690px){#lwaVisualSlides .vs-layout{grid-template-columns:1fr}#lwaVisualSlides .vs-pages{flex-direction:row;max-height:100px}#lwaVisualSlides .vs-pages button{min-width:118px}#lwaVisualSlides .vs-slide{border-width:7px;padding:6px}#lwaVisualSlides .vs-stitch{padding:8px}}'
].join('\n');document.head.append(styles);
})();
