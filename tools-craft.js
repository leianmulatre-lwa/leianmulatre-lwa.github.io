/* BIG LWA / Tools — embed original open-source ArtCraft WebAssembly releases.
 * These are independent Adobe-like editors, not Adobe products. No proxying,
 * simulated tool screens, silent file upload, or access to Firebase identity.
 */
const APPS = [
  {id:'photocraft',name:'PhotoCraft',letter:'Ps',version:'0.7.0',
    task:'Layers, photo compositing and image editing · Photoshop-style',
    about:'https://getartcraft.com/apps/photocraft'},
  {id:'vectorcraft',name:'VectorCraft',letter:'Ai',version:'0.9.0',
    task:'Pen tools, vector illustration and SVG · Illustrator-style',
    about:'https://getartcraft.com/apps/vectorcraft'},
  {id:'effectcraft',name:'EffectCraft',letter:'Ae',version:'0.8.0',
    task:'Timeline, keyframes and motion graphics · After Effects-style',
    about:'https://getartcraft.com/apps/effectcraft'},
  {id:'pdfcraft',name:'PdfCraft',letter:'Ac',version:'0.6.0',
    task:'Read, organize, annotate and export PDFs · Acrobat-style',
    about:'https://getartcraft.com/apps/pdfcraft'}
];
const MORE = [
  ['FilmCraft','Video editor (desktop build)','https://getartcraft.com/apps/filmcraft'],
  ['LightCraft','Photography and raw development','https://getartcraft.com/apps/lightcraft'],
  ['DesignCraft','Publishing and layout','https://getartcraft.com/apps/designcraft'],
  ['FigCraft','Interface and prototype design','https://getartcraft.com/apps/figcraft'],
  ['SoundCraft','Audio mixing','https://getartcraft.com/apps/soundcraft']
];
const BASE='/craftapps/';
const htmlEscape=value=>String(value??'').replace(/[&<>"']/g,
  c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const urlFor=id=>BASE+id+'/';
const safeId=id=>APPS.some(app=>app.id===id);
let styleInstalled=false;
function installStyle(){
  if(styleInstalled||document.getElementById('biglwaCraftCss'))return;
  styleInstalled=true;
  const link=document.createElement('link');
  link.id='biglwaCraftCss';link.rel='stylesheet';
  link.href='/tools-craft.css?v=20261014-craft-suite-1';
  document.head.append(link);
}
export async function mountCraftSuite(root){
  if(!root)return;
  installStyle();
  root.classList.add('craft-suite');
  root.innerHTML='<div class="craft-head"><div>'+
    '<span class="craft-label">BIG LWA · open-source creative tools</span>'+
    '<h2>artcraft · creative lab</h2>'+
    '<p>Real browser editions of independent creative apps, inspired by familiar Adobe workflows. Choose a tool to edit inside Big LWA. These are not Adobe software or an Adobe subscription.</p>'+
    '</div><a href="https://getartcraft.com/apps" target="_blank" rel="noopener noreferrer">About ArtCraft ↗</a></div>'+
    '<p class="craft-status" id="craftInstallStatus" role="status">Checking available browser editors…</p>'+
    '<div class="craft-directory" role="list" aria-label="Creative applications">'+APPS.map(app=>
       '<article class="craft-tile" role="listitem" data-craft-card="'+app.id+'">'+
       '<span class="craft-monogram" aria-hidden="true">'+htmlEscape(app.letter)+'</span>'+
       '<h3>'+htmlEscape(app.name)+'</h3><p>'+htmlEscape(app.task)+'</p>'+
       '<small id="craft-availability-'+app.id+'">Checking browser build…</small>'+
       '<button type="button" data-craft-open="'+app.id+'" disabled>Checking…</button>'+
       '<a href="'+app.about+'" target="_blank" rel="noopener noreferrer">About & downloads ↗</a></article>'
     ).join('')+'</div>'+
     '<div class="craft-panel" id="craftPanel" hidden>'+
       '<div class="craft-panel-head"><strong id="craftPanelTitle">Creative editor</strong>'+
         '<div class="craft-panel-actions"><button type="button" data-craft-webgl>Use WebGL</button>'+
         '<button type="button" data-craft-fullscreen>Fullscreen</button>'+
         '<a id="craftDirectLink" target="_blank" rel="noopener noreferrer">Open full tab ↗</a>'+
         '<button type="button" data-craft-close>Close</button></div></div>'+
       '<div class="craft-viewer" id="craftViewer"></div>'+
       '<p class="craft-panel-foot" role="status" id="craftEditorStatus">Select a browser editor to begin.</p>'+
     '</div>'+
     '<div class="craft-smallprint"><p><b>How files work:</b> Choose File → Open, or drag your file into the editor; use its own Save / Export to download the result. ArtCraft projects are not automatically stored in your Big LWA profile, Feed, or Archive.</p>'+
       '<p>Runs in your browser from the original developers’ open-source WebAssembly builds when installed. Some editing features are experimental and may need WebGPU or WebGL2. Never confuse these with official Adobe applications.</p>'+
       '<div class="craft-more" aria-label="Other ArtCraft desktop and web releases">'+MORE.map(([name,note,url])=>
         '<a href="'+url+'" target="_blank" rel="noopener noreferrer" title="'+htmlEscape(note)+'">'+htmlEscape(name)+' ↗</a>').join('')+
       '<a href="https://app.getartcraft.com/" target="_blank" rel="noopener noreferrer" title="Separate ArtCraft AI generation studio">ArtCraft AI Studio ↗</a></div>'+
     '</div>';
  const status=root.querySelector('#craftInstallStatus');
  const viewer=root.querySelector('#craftViewer');
  const panel=root.querySelector('#craftPanel');
  const label=root.querySelector('#craftPanelTitle');
  const editorStatus=root.querySelector('#craftEditorStatus');
  const direct=root.querySelector('#craftDirectLink');
  const ready=new Set();
  let current=null;
  let fallback=false;
  const setStatus=(message)=>{status.textContent=message;};
  function close(){
    current=null;viewer.replaceChildren();panel.hidden=true;
    root.querySelectorAll('[data-craft-card]').forEach(card=>card.classList.remove('is-selected'));
  }
  function load(id,webgl=false){
    const app=APPS.find(item=>item.id===id);
    if(!app||!ready.has(id))return;
    current=id;fallback=webgl;
    const url=urlFor(id)+(webgl?'?webgl':'');
    const frame=document.createElement('iframe');
    frame.title=app.name+' editor inside Big LWA';
    frame.src=url;
    frame.loading='eager';
    frame.referrerPolicy='no-referrer';
    // The upstream WebAssembly shell requires same-origin for file opening,
    // storage and export; PDFs/images are edited by the visitor's browser.
    // Hosting on a dedicated sandboxed subdomain is preferable long-term.
    frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-downloads allow-forms allow-popups');
    frame.setAttribute('allow','fullscreen; clipboard-read; clipboard-write');
    frame.setAttribute('allowfullscreen','');
    frame.addEventListener('error',()=>{editorStatus.textContent='The editor could not start. Use Open full tab or the original ArtCraft download.'});
    viewer.replaceChildren(frame);
    panel.hidden=false;label.textContent=app.name+' · browser editor';
    editorStatus.textContent='Loading '+app.name+'… Open, edit, then save/export from within the editor. If a renderer fails, try “Use WebGL” or “Open full tab”.';
    direct.href=urlFor(id)+(webgl?'?webgl':'');
    root.querySelectorAll('[data-craft-card]').forEach(card=>card.classList.toggle('is-selected',card.dataset.craftCard===id));
    panel.scrollIntoView({block:'nearest',behavior:'smooth'});
  }
  root.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button||!root.contains(button))return;
    const id=button.dataset.craftOpen;
    if(id&&safeId(id)){load(id);return}
    if(button.hasAttribute('data-craft-close')){close();return}
    if(button.hasAttribute('data-craft-webgl')){if(current)load(current,true);return}
    if(button.hasAttribute('data-craft-fullscreen')){
      const el=viewer;
      if(el.requestFullscreen)el.requestFullscreen().catch(()=>{editorStatus.textContent='Fullscreen unavailable in this browser. Use Open full tab instead.'});
    }
  });
  let manifest=null;
  try{
    const response=await fetch(BASE+'manifest.json',{cache:'no-store'});
    if(!response.ok)throw Error('No build manifest yet');
    const payload=await response.json();
    if(payload?.schema!==1||!Array.isArray(payload.apps))throw Error('Invalid build manifest');
    manifest=payload;
  }catch(error){
    setStatus('Creative editors are listed, but local browser builds have not yet been deployed. Official ArtCraft pages are linked below.');
  }
  if(!root.isConnected)return;
  for(const app of APPS){
    const row=manifest?.apps?.find(item=>item.id===app.id);
    const available=row?.available===true&&row.version===app.version;
    const tile=root.querySelector('[data-craft-card="'+app.id+'"]');
    const button=tile?.querySelector('[data-craft-open]');
    const hint=tile?.querySelector('small');
    if(!button||!hint)continue;
    if(available){
      ready.add(app.id);button.disabled=false;button.textContent='Edit inside Big LWA →';
      hint.textContent='Browser edition · v'+app.version;
    }else{
      button.disabled=true;button.textContent='Web edition unavailable';
      hint.textContent='Open-source release · v'+app.version;
    }
  }
  if(manifest)setStatus(ready.size?
    ready.size+' browser editor'+(ready.size===1?'':'s')+' installed · files stay on your device until you download/export them.':
    'ArtCraft browser builds are unavailable in this deployment. Use the original ArtCraft download links.');
  return {open:(id)=>load(id),close,available:()=>[...ready]};
}
