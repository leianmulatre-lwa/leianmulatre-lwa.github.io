/* BIG LWA Tools Workshop
 * Our own product shell and first-party editor; licensed Storytold Rust/WASM
 * engines are optional advanced workspaces, not Adobe products or BIG LWA
 * original engine implementations. Upstream LICENSE and NOTICE remain intact.
 */
const ENGINES=[
 {id:'photocraft',name:'Pixel Lab',credit:'PhotoCraft',letter:'𝖕',version:'0.7.0',
  description:'Advanced layers, compositing, image workflows',type:'Image',
  source:'https://github.com/storytold/photocraft'},
 {id:'vectorcraft',name:'Vector Studio',credit:'VectorCraft',letter:'𝖛',version:'0.9.0',
  description:'Paths, SVG drawing and vector artwork',type:'Vector',
  source:'https://github.com/storytold/vectorcraft'},
 {id:'effectcraft',name:'Motion Room',credit:'EffectCraft',letter:'𝖒',version:'0.8.0',
  description:'Keyframes, animation and motion composition',type:'Motion',
  source:'https://github.com/storytold/effectcraft'},
 {id:'pdfcraft',name:'Paper Desk',credit:'PdfCraft',letter:'𝖉',version:'0.6.0',
  description:'PDF viewing, annotation and editing',type:'Document',
  source:'https://github.com/storytold/pdfcraft'}
];
const FUTURE=[
 ['FilmCraft','Video editing'],['LightCraft','Photography and RAW'],['DesignCraft','Page layout'],
 ['FigCraft','Interface design'],['SoundCraft','Audio production']
];
const LOCAL={id:'image-desk',name:'Image Desk',letter:'𝖎',url:'/tools/image-desk.html',
 description:'Draw, paint, add text and layers, edit photos, save editable BIG LWA projects.',
 credit:'Original BIG LWA editor · works locally'};
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeId=id=>id===LOCAL.id||ENGINES.some(item=>item.id===id);
let stylesReady=false;
function installStyle(){
 if(stylesReady||document.getElementById('biglwaCraftCss'))return;
 stylesReady=true;
 const css=document.createElement('link');css.rel='stylesheet';css.id='biglwaCraftCss';
 css.href='/tools-craft.css?v=20261022-vintage-woodblocks-5';document.head.append(css);
}
function card(item,local=false){
 const title=local?'Made by BIG LWA':'Advanced · '+item.type;
 return '<article class="craft-tile'+(local?' craft-tile-home':'')+'" data-craft-card="'+item.id+'">'+
   '<div class="craft-tile-eyebrow">'+escapeHtml(title)+'</div>'+
   '<div class="craft-tile-icon craft-arcade-block craft-block-'+escapeHtml(item.id)+'" aria-hidden="true">'+
     '<span class="craft-block-front"><span class="craft-block-glyph">'+escapeHtml(item.letter)+'</span></span></div>'+
   '<h3>'+escapeHtml(item.name)+'</h3>'+
   '<p>'+escapeHtml(item.description)+'</p>'+
   '<div class="craft-engine-credits">'+escapeHtml(item.credit)+'</div>'+
   '<button type="button" data-craft-open="'+item.id+'"'+(local?'':' disabled')+'>'+
      (local?'Start creating →':'Checking engine…')+'</button>'+
   (local?'':('<a href="/craftapps/'+encodeURIComponent(item.id)+'/upstream-licenses/SOURCE.txt" target="_blank" rel="noopener noreferrer">Source & license notes ↗</a>'))+
  '</article>';
}
export async function mountCraftSuite(root){
 if(!root)return;
 installStyle();
 root.classList.add('craft-suite','craft-workshop');
 root.innerHTML=
  '<header class="craft-head">'+
   '<div class="craft-head-copy"><span class="craft-label">BIG LWA · maker\'s workspace</span>'+
   '<h2>the workshop</h2>'+
   '<p>A creative operating room that belongs to this community: make your own work, keep drafts to yourself, export what you choose. Start with our own Image Desk or step into an advanced open-source engine.</p></div>'+
   '<div class="craft-head-ornament" aria-hidden="true"><i></i><i></i><i></i><strong>✦</strong></div></header>'+
  '<div class="craft-toolbar"><span>01 / MAKE</span><span>02 / EDIT</span><span>03 / KEEP OR SHARE</span></div>'+
  '<p class="craft-status" id="craftInstallStatus" role="status">Image Desk ready · checking advanced browser engines…</p>'+
  '<div class="craft-directory" role="list" aria-label="BIG LWA creative applications">'+card(LOCAL,true)+ENGINES.map(x=>card(x,false)).join('')+'</div>'+
  '<div class="craft-panel" id="craftPanel" hidden>'+
    '<div class="craft-panel-head"><strong id="craftPanelTitle">BIG LWA editor</strong><div class="craft-panel-actions">'+
       '<button type="button" data-craft-webgl hidden>WebGL fallback</button>'+
       '<button type="button" data-craft-fullscreen>Fullscreen</button>'+
       '<a id="craftDirectLink" href="/tools/image-desk.html" target="_blank" rel="noopener noreferrer">Open in its own tab ↗</a>'+
       '<button type="button" data-craft-close>✕ Close</button></div></div>'+
    '<div class="craft-viewer" id="craftViewer"></div>'+
    '<p class="craft-panel-foot" role="status" id="craftEditorStatus">Your workspace is ready.</p>'+
  '</div>'+
  '<footer class="craft-smallprint">'+
    '<p><strong>Who made what?</strong> Image Desk and this Workshop are BIG LWA interfaces. Advanced Pixel Lab, Vector Studio, Motion Room, and Paper Desk run licensed Storytold Rust/WebAssembly editors (PhotoCraft, VectorCraft, EffectCraft and PdfCraft). The original engine creators retain their copyright; BIG LWA controls its own surrounding experience and original code. These are not Adobe applications.</p>'+
    '<p><strong>Privacy:</strong> File → Open, drawing, and exports happen inside your browser; the Workshop does not silently import anything to your BIG LWA feed or account. Download the project or finished asset to keep it. Some advanced builds need WebGPU/WebGL.</p>'+
    '<details><summary>More source projects for future BIG LWA editions</summary><div class="craft-more">'+
      FUTURE.map(([name,note])=>'<a href="https://github.com/storytold/'+name.toLowerCase()+'" target="_blank" rel="noopener noreferrer">'+name+' · '+note+' ↗</a>').join('')+
    '</div></details>'+
  '</footer>';
 const ready=new Set([LOCAL.id]),viewer=root.querySelector('#craftViewer'),panel=root.querySelector('#craftPanel');
 const title=root.querySelector('#craftPanelTitle'),direct=root.querySelector('#craftDirectLink'),info=root.querySelector('#craftEditorStatus');
 const status=root.querySelector('#craftInstallStatus');
 let current=null;
 const getUrl=(id,webgl=false)=>id===LOCAL.id?LOCAL.url:'/craftapps/'+id+'/'+(webgl?'?webgl':'');
 const findItem=id=>id===LOCAL.id?LOCAL:ENGINES.find(item=>item.id===id);
 function close(){
  current=null;viewer.replaceChildren();panel.hidden=true;
  root.querySelectorAll('[data-craft-card]').forEach(el=>el.classList.remove('is-selected'));
 }
 function open(id,webgl=false){
  const item=findItem(id);
  if(!item||!ready.has(id))return false;
  // Reuse the element for the same destination; don't restart editing on
  // unrelated clicks to the selected card.
  if(current===id&&viewer.querySelector('iframe')?.getAttribute('src')===getUrl(id,webgl)){
    panel.hidden=false;panel.scrollIntoView({block:'nearest',behavior:'smooth'});return true;
  }
  current=id;
  const frame=document.createElement('iframe');frame.src=getUrl(id,webgl);
  frame.title=item.name+' · BIG LWA Tools';
  frame.loading='eager';frame.referrerPolicy='no-referrer';
  // Native same-origin iframe needs scripts, storage, downloads and fonts.
  // Upstream WebAssembly applications are hosted on this site's own origin.
  frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-downloads allow-forms allow-popups');
  frame.setAttribute('allow','fullscreen; clipboard-read; clipboard-write');
  frame.setAttribute('allowfullscreen','');
  frame.addEventListener('error',()=>{info.textContent='The editor failed to start. Try its own tab or another browser.'});
  viewer.replaceChildren(frame);panel.hidden=false;
  title.textContent='BIG LWA · '+item.name;
  info.textContent=id===LOCAL.id?
    'Original BIG LWA editor · import an image, add layers or text, draw and export. Nothing is uploaded automatically.':
    'Open-source '+item.credit+' editing engine, hosted inside BIG LWA. Import/export inside the editor; it does not publish to the Collective Feed.';
  direct.href=getUrl(id,webgl);
  root.querySelector('[data-craft-webgl]').hidden=id===LOCAL.id;
  root.querySelectorAll('[data-craft-card]').forEach(el=>el.classList.toggle('is-selected',el.dataset.craftCard===id));
  panel.scrollIntoView({block:'nearest',behavior:'smooth'});
  return true;
 }
 root.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button||!root.contains(button))return;
  const id=button.dataset.craftOpen;
  if(id&&safeId(id)){open(id);return}
  if(button.hasAttribute('data-craft-close'))close();
  else if(button.hasAttribute('data-craft-webgl')&&current&&current!==LOCAL.id)open(current,true);
  else if(button.hasAttribute('data-craft-fullscreen')){
   viewer.requestFullscreen?.().catch(()=>{info.textContent='Fullscreen unavailable here. Open the editor in its own tab.'});
  }
 });
 try{
  const response=await fetch('/craftapps/manifest.json',{cache:'no-store'});
  if(!response.ok)throw Error('No advanced editor manifest');
  const manifest=await response.json();
  if(manifest.schema!==1||!Array.isArray(manifest.apps))throw Error('Invalid editor manifest');
  for(const item of ENGINES){
   const row=manifest.apps.find(x=>x.id===item.id);
   if(row?.available===true&&row.version===item.version)ready.add(item.id);
  }
  status.textContent='Image Desk ready · '+(ready.size-1)+' advanced open-source engines available in this deployment.';
 }catch(error){status.textContent='Image Desk ready · advanced engines are unavailable in this deployment.'}
 if(!root.isConnected)return;
 for(const app of ENGINES){
  const tile=root.querySelector('[data-craft-card="'+app.id+'"]');
  if(!tile)continue;
  const button=tile.querySelector('button[data-craft-open]');
  button.disabled=!ready.has(app.id);
  button.textContent=ready.has(app.id)?'Edit inside BIG LWA →':'Browser engine unavailable';
  if(!ready.has(app.id))tile.classList.add('craft-unavailable');
 }
 function editFile(file){
  if(!(file instanceof File)||!/^image\/(png|jpeg|webp|gif|avif)$/.test(file.type))return false;
  const alreadyOpen=current===LOCAL.id;
  if(!open(LOCAL.id))return false;
  const iframe=viewer.querySelector('iframe');
  if(!iframe)return false;
  const send=()=>iframe.contentWindow?.postMessage(
    {type:'BIGLWA_IMAGE_DESK_IMPORT',file},location.origin
  );
  if(alreadyOpen)send();else iframe.addEventListener('load',send,{once:true});
  return true;
 }
 return {open,close,editFile,available:()=>[...ready]};
}