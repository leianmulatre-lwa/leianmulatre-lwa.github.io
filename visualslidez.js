/* BIG LWA visualslidez · independently stored from original visualeyez boards.
   PowerPoint interchange is text-only; proprietary layouts and animation are not retained. */
(()=>{'use strict';
if(window.BigLWAVisualSlidez)return;
const colors=['#c35665','#e69250','#ddb43e','#5a9675','#4f90bd','#966cb6'];
const key=()=> 'biglwaVisualSlidez:v1:'+String(window.__biglwaIdentity?.uid||window.BigLWAAccountStorage?.uid||'guest').replace(/[^A-Za-z0-9_-]/g,'');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const make=()=>({title:'New slide',body:'',notes:''});
let slides=[],selected=0,root=null,busy=false;
function save(){try{localStorage.setItem(key(),JSON.stringify({slides}))}catch{say('Browser storage full. Export a backup.')}}
function say(msg){const el=root?.querySelector('[data-status]');if(el)el.textContent=msg}
function draw(){
 if(!root?.isConnected)return;
 const current=slides[selected],edge=colors[selected%colors.length];
 let driveHref='https://drive.google.com/';
 try{
   const saved=window.BigLWAOrbitAccountLinks?.get?.()?.drive;
   const u=new URL(saved);
   if(u.protocol==='https:'&&!u.port&&!u.username&&!u.password&&
      (u.hostname==='drive.google.com'||u.hostname.endsWith('.drive.google.com')))driveHref=u.href;
 }catch{}
 
 root.innerHTML='<header class="vs-toolbar"><nav class="visualz-tabs" aria-label="Visualz workspaces"><button type="button" data-visualz-mode="visualeyez" aria-pressed="false">visual·eyez</button><button type="button" data-visualz-mode="visualslidez" class="active" aria-pressed="true">visual·slidez</button></nav><div class="vs-buttons"><button data-new>+ New slide</button><button data-remove>Delete slide</button><button data-backup>Backup</button><label>Import<input type="file" data-import accept=".json,.pptx" hidden></label><button data-pptx>Export PowerPoint</button><a data-drive-link target=\"_blank\" rel=\"noopener noreferrer\" href=\"'+esc(driveHref)+'\">Open Drive ↗</a></div></header>'+
 '<div class="vs-layout"><nav class="vs-pages" aria-label="Slides">'+slides.map((v,i)=>'<button class="'+(i===selected?'active':'')+'" data-select="'+i+'" style="--rainbow:'+colors[i%colors.length]+'">Slide '+(i+1)+'<strong>'+esc(v.title||'Untitled')+'</strong></button>').join('')+'</nav>'+
 '<div class="vs-editor"><div class="vs-slide" style="--rainbow:'+edge+'"><div class="vs-stitch"><input data-title aria-label="Slide title" maxlength="300" value="'+esc(current.title)+'"><textarea data-body aria-label="Slide contents" maxlength="6000">'+esc(current.body)+'</textarea><small>'+(selected+1)+' / '+slides.length+'</small></div></div><label class="vs-notes">Speaker notes<textarea data-notes maxlength="3000" rows="2">'+esc(current.notes||'')+'</textarea></label><div class="vs-bottom"><button data-prev>← Previous</button><span>'+(selected+1)+' / '+slides.length+'</span><button data-next>Next →</button></div><p data-status role="status">Private drafts in this browser. Export a backup to move devices.</p></div></div>';
  document.dispatchEvent(new CustomEvent('biglwa:visualz-toolbar-ready'));
}
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),12000)}
function dependency(url,test){if(test())return Promise.resolve();return new Promise((ok,bad)=>{const s=document.createElement('script');s.src=url;s.onload=()=>test()?ok():bad(Error('Library unavailable'));s.onerror=()=>bad(Error('Library download failed'));document.head.append(s)})}
async function writePptx(){
 await dependency('https://cdn.jsdelivr.net/gh/gitbrent/pptxgenjs@3.12.0/dist/pptxgen.bundle.js',()=>typeof window.pptxgen==='function');
 const pptx=new window.pptxgen();pptx.layout='LAYOUT_WIDE';pptx.author='BIG LWA';pptx.title='visualslidez';
 for(let i=0;i<slides.length;i++){
  const slide=pptx.addSlide(),color=colors[i%colors.length].slice(1),value=slides[i];slide.background={color:'FFFAEF'};
  slide.addShape(pptx.ShapeType.rect,{x:.28,y:.28,w:12.77,h:6.93,line:{color,width:6},fill:{color:'FFFAEF'}});
  slide.addShape(pptx.ShapeType.rect,{x:.46,y:.46,w:12.4,h:6.5,line:{color,width:1,dashType:'dash'},fill:{color:'FFFAEF',transparency:100}});
  slide.addText(value.title,{x:.92,y:1.05,w:11.4,h:1.25,fontFace:'Georgia',fontSize:35,bold:true,color:'372831'});
  slide.addText(value.body,{x:.92,y:2.4,w:11.4,h:3.9,fontFace:'Georgia',fontSize:20,color:'372831',valign:'top'});
  if(value.notes&&typeof slide.addNotes==='function')slide.addNotes(value.notes);
 }
 await pptx.writeFile({fileName:'visualslidez.pptx'});
}
async function importSlides(file){
 if(file.size>15*1024*1024)throw Error('Choose a presentation smaller than 15 MB.');
 if(/\.json$/i.test(file.name)){const obj=JSON.parse(await file.text());if(obj.type!=='BIGLWA.visualslidez'||!Array.isArray(obj.slides))throw Error('Invalid backup');return obj.slides.slice(0,120)}
 if(!/\.pptx$/i.test(file.name))throw Error('Choose a .pptx or visualslidez .json file');
 await dependency('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js',()=>!!window.JSZip);
 const zip=await window.JSZip.loadAsync(await file.arrayBuffer());
 const names=Object.keys(zip.files).filter(p=>/^ppt\/slides\/slide\d+\.xml$/.test(p)).sort((a,b)=>Number(a.match(/slide(\d+)/)[1])-Number(b.match(/slide(\d+)/)[1])).slice(0,120);
 if(!names.length)throw Error('No standard PowerPoint slides found');
 const next=[];for(const name of names){
  const xml=new DOMParser().parseFromString(await zip.file(name).async('text'),'application/xml');
  if(xml.querySelector('parsererror'))throw Error('Malformed slide XML');
  const texts=[...xml.getElementsByTagNameNS('http://schemas.openxmlformats.org/drawingml/2006/main','t')].map(n=>n.textContent||'').filter(Boolean);
  next.push({title:String(texts.shift()||'Slide').slice(0,300),body:texts.join('\n').slice(0,6000),notes:''});
 }
 return next;
}
function mount(host){
 if(!host)return;root=host;let saved;
 try{saved=JSON.parse(localStorage.getItem(key())||'null')}catch{}
 slides=Array.isArray(saved?.slides)?saved.slides.slice(0,120).map(v=>({title:String(v.title||'').slice(0,300),body:String(v.body||'').slice(0,6000),notes:String(v.notes||'').slice(0,3000)})):[];
 if(!slides.length)slides=[{title:'Your opening slide',body:'Your story starts here.',notes:''}];
 selected=Math.min(selected,slides.length-1);draw();
 if(host.dataset.bound==='1')return;host.dataset.bound='1';
 host.addEventListener('input',e=>{const slide=slides[selected];if(e.target.matches('[data-title]'))slide.title=e.target.value.slice(0,300);else if(e.target.matches('[data-body]'))slide.body=e.target.value.slice(0,6000);else if(e.target.matches('[data-notes]'))slide.notes=e.target.value.slice(0,3000);else return;save();const l=host.querySelector('[data-select="'+selected+'"] strong');if(l)l.textContent=slide.title;});
 host.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b||busy)return;try{
  if(b.hasAttribute('data-new')){if(slides.length>=120)throw Error('Maximum 120 slides');slides.push(make());selected=slides.length-1;save();draw()}
  else if(b.hasAttribute('data-remove')){if(slides.length>1&&confirm('Delete this slide?')){slides.splice(selected,1);selected=Math.min(selected,slides.length-1);save();draw()}}
  else if(b.hasAttribute('data-select')){selected=Number(b.dataset.select);draw()}
  else if(b.hasAttribute('data-prev')){selected=Math.max(0,selected-1);draw()}
  else if(b.hasAttribute('data-next')){selected=Math.min(slides.length-1,selected+1);draw()}
  else if(b.hasAttribute('data-backup'))download(new Blob([JSON.stringify({type:'BIGLWA.visualslidez',slides},null,2)],{type:'application/json'}),'visualslidez.json');
  else if(b.hasAttribute('data-pptx')){busy=true;say('Exporting .pptx…');await writePptx();say('Exported .pptx, importable by PowerPoint, Canva and Google Slides.');}
 }catch(err){say(err.message||'Action failed')}finally{busy=false}});
 host.addEventListener('change',async e=>{if(!e.target.matches('[data-import]')||busy)return;const file=e.target.files?.[0];e.target.value='';if(!file||!confirm('Replace the current slide deck? Download a backup first if needed.'))return;busy=true;try{const loaded=await importSlides(file);if(!loaded.length)throw Error('No slides found');slides=loaded.map(x=>({title:String(x.title||'').slice(0,300),body:String(x.body||'').slice(0,6000),notes:String(x.notes||'').slice(0,3000)}));selected=0;save();draw();say(file.name.endsWith('.pptx')?'Text imported. Original artwork, layouts and animations are not preserved.':'Backup restored.')}catch(err){say(err.message||'Import failed')}finally{busy=false}});
}
window.BigLWAVisualSlidez={mount};
const styles=document.createElement('style');styles.textContent=[
 '#lwaVisualSlides{font:500 13px system-ui;color:#38292c}',
 '#lwaVisualSlides .vs-toolbar,#lwaVisualSlides .vs-buttons,#lwaVisualSlides .vs-bottom{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}',
 '#lwaVisualSlides .vs-toolbar{padding:12px 0}#lwaVisualSlides .vs-toolbar h2{font:400 28px "CS Bergamot Stitched",Georgia,serif;margin:0}',
 '#lwaVisualSlides button,#lwaVisualSlides .vs-buttons label,#lwaVisualSlides .vs-buttons a{display:inline-flex;cursor:pointer;border:1px solid #c9ad9f;border-radius:8px;background:#fff8f0;padding:8px 11px;font:700 11px system-ui;text-decoration:none;color:#362832}',
 '#lwaVisualSlides .vs-layout{display:grid;grid-template-columns:145px minmax(0,1fr);gap:14px}',
 '#lwaVisualSlides .vs-pages{display:flex;flex-direction:column;gap:8px;overflow:auto;max-height:600px}',
 '#lwaVisualSlides .vs-pages button{display:grid;text-align:left;gap:6px;min-height:73px;border-left:6px solid var(--rainbow)}',
 '#lwaVisualSlides .vs-pages button.active{outline:2px solid #674159;outline-offset:-2px}',
 '#lwaVisualSlides .vs-pages strong{font:400 15px "CS Bergamot Stitched",Georgia,serif;overflow-wrap:anywhere}',
 '#lwaVisualSlides .vs-editor{min-width:0}#lwaVisualSlides .vs-slide{width:100%;box-sizing:border-box;aspect-ratio:16/9;border:12px solid var(--rainbow);border-radius:13px;padding:11px;background:#fff3e5}',
 '#lwaVisualSlides .vs-stitch{position:relative;height:100%;box-sizing:border-box;border:3px dashed var(--rainbow);padding:clamp(12px,3vw,43px);display:flex;flex-direction:column;gap:9px;background:#fffaf4}',
 '#lwaVisualSlides .vs-stitch input,#lwaVisualSlides .vs-stitch textarea{width:100%;box-sizing:border-box;border:0;outline:0;background:transparent;resize:none;color:#362832}',
 '#lwaVisualSlides .vs-stitch input{font:700 clamp(20px,3.7vw,48px) Georgia,serif}#lwaVisualSlides .vs-stitch textarea{flex:1;min-height:0;font:clamp(12px,1.8vw,23px)/1.4 Georgia,serif}',
 '#lwaVisualSlides .vs-stitch small{position:absolute;right:12px;bottom:7px;font:700 10px monospace;color:var(--rainbow)}',
 '#lwaVisualSlides .vs-notes{display:grid;gap:5px;margin:12px 0;font:700 11px system-ui}#lwaVisualSlides .vs-notes textarea{padding:8px;border-radius:7px;border:1px solid #d0b8a7;background:#fffcf5}',
 '#lwaVisualSlides .vs-bottom{margin:8px 0 11px}#lwaVisualSlides [data-status]{font:600 11px system-ui;color:#78636a}',
 '@media(max-width:690px){#lwaVisualSlides .vs-layout{grid-template-columns:1fr}#lwaVisualSlides .vs-pages{flex-direction:row;max-height:100px}#lwaVisualSlides .vs-pages button{min-width:118px}#lwaVisualSlides .vs-slide{border-width:7px;padding:6px}#lwaVisualSlides .vs-stitch{padding:8px}}'
].join('\n');document.head.append(styles);
})();
