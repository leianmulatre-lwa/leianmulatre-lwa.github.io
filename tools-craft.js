/* BIG LWA Tools Workshop
 * Our own product shell and first-party editor; licensed Storytold Rust/WASM
 * engines are optional advanced workspaces, not Adobe products or BIG LWA
 * original engine implementations. Upstream LICENSE and NOTICE remain intact.
 */
const ENGINES=[
 {id:'photocraft',name:'lightR',credit:'PhotoCraft',letter:'𝖑',version:'0.7.0',
  description:'Advanced layers, compositing, image workflows',type:'Image',
  source:'https://github.com/storytold/photocraft'},
 {id:'vectorcraft',name:'paintR',credit:'VectorCraft',letter:'𝖕',version:'0.9.0',
  description:'Paths, SVG drawing and vector artwork',type:'Vector',
  source:'https://github.com/storytold/vectorcraft'},
 {id:'effectcraft',name:'keyframeR',credit:'EffectCraft',letter:'𝖐',version:'0.8.0',
  description:'Keyframes, animation and motion composition',type:'Motion',
  source:'https://github.com/storytold/effectcraft'},
 {id:'pdfcraft',name:'fileR',credit:'PdfCraft',letter:'𝖋',version:'0.6.0',
  description:'PDF viewing, annotation and editing',type:'Document',
  source:'https://github.com/storytold/pdfcraft'}
];
const PUBLIC_APP_ROUTE={photocraft:'lightR',vectorcraft:'paintR',effectcraft:'keyframeR',pdfcraft:'fileR'};
const BIGLWA_GITHUB='https://github.com/leianmulatre-lwa/leianmulatre-lwa.github.io';
const BIGLWA_PATREON='https://www.patreon.com/cw/biglwa';
const LOCAL={id:'image-desk',name:'sqwibblR',letter:'𝖘',url:'/tools/image-desk.html',
 description:'Draw, paint, add text and layers, edit photos, save editable BIG LWA projects.',
 credit:'Original BIG LWA editor · works locally'};
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeId=id=>id===LOCAL.id||ENGINES.some(item=>item.id===id);
/* Original BIG LWA cube art: cushioned piping, textile panels and thread stitching.
   SVG stays inline so every icon is crisp at phone and desktop sizes. */
/* Transparent, matched embroidered blocks for all five creative apps. */
const CRAFT_ICON_NAME={
 'image-desk':'sqwibblR',photocraft:'lightR',vectorcraft:'paintR',effectcraft:'keyframeR',pdfcraft:'fileR'
};
function blockArtwork(item){
 const name=CRAFT_ICON_NAME[item.id]||'sqwibblR';
 return '<img class="craft-block-png" src="/assets/bigapps/'+(item.id==='image-desk'?'icons/':'blocks/')+name+(item.id==='image-desk'?'.png?v=20261023-stitch-png-1':'.svg?v=20261026-unified-blocks-1')+'" alt="" width="160" height="160" decoding="async" />';
}

let stylesReady=false;
function installStyle(){
 if(stylesReady||document.getElementById('biglwaCraftCss'))return;
 stylesReady=true;
 const css=document.createElement('link');css.rel='stylesheet';css.id='biglwaCraftCss';
 css.href='/tools-craft.css?v=20261023-color-coded-native-1';document.head.append(css);
}
function card(item,local=false){
 const title=local?'Made by BIG LWA':'Advanced · '+item.type;
 return '<article class="craft-tile'+(local?' craft-tile-home':'')+'" data-craft-card="'+item.id+'">'+
   '<div class="craft-tile-eyebrow">'+escapeHtml(title)+'</div>'+
   '<div class="craft-tile-icon craft-arcade-block craft-block-'+escapeHtml(item.id)+'" aria-hidden="true">'+
     blockArtwork(item)+'</div>'+
   '<h3 aria-label="'+escapeHtml(item.name)+'">'+escapeHtml(item.name.slice(0,-1))+'<span class="craft-capital-r" aria-hidden="true">R</span></h3>'+
   '<p>'+escapeHtml(item.description)+'</p>'+
   '<div class="craft-engine-credits">'+(local?'Made by BIG LWA':'BIG LWA edition · licensed editing engine')+'</div>'+
   '<button type="button" data-craft-open="'+item.id+'"'+(local?'':' disabled')+'>'+
      (local?'Start creating →':'Checking engine…')+'</button>'+
   (local?'':('<a href="/bigapps/'+encodeURIComponent(PUBLIC_APP_ROUTE[item.id])+'/upstream-licenses/SOURCE.txt" target="_blank" rel="noopener noreferrer">Source & license notes ↗</a>'))+
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
   '<p>A creative operating room that belongs to this community: make your own work, keep drafts to yourself, export what you choose.</p><nav class="craft-founder-links" aria-label="BIG LWA development and support"><a href="'+BIGLWA_GITHUB+'" target="_blank" rel="noopener noreferrer">BIG LWA GitHub ↗</a><a href="'+BIGLWA_PATREON+'" target="_blank" rel="noopener noreferrer">Support on Patreon ↗</a></nav></div>'+
   '<div class="craft-head-ornament" aria-hidden="true"><i></i><i></i><i></i><strong>✦</strong></div></header>'+
  '<div class="craft-toolbar"><span>01 / MAKE</span><span>02 / EDIT</span><span>03 / KEEP OR SHARE</span></div>'+
  '<p class="craft-status" id="craftInstallStatus" role="status">sqwibblR ready · checking advanced browser engines…</p>'+
  '<div class="craft-directory" role="list" aria-label="BIG LWA creative applications">'+card(LOCAL,true)+ENGINES.map(x=>card(x,false)).join('')+'</div>'+
  '<section class="craft-account-vault" id="craftAccountVault" aria-label="Private workshop image snapshots">'+
   '<div><span class="craft-vault-eyebrow">03 / PRIVATE SHELF</span><h3>Your BIG LWA snapshots</h3>'+
   '<p>Save a small preview to your signed-in account. This is a flattened image you can reopen in sqwibblR, not an editable WASM project.</p></div>'+
   '<div class="craft-vault-actions"><label class="craft-vault-file">Save an exported image<input id="craftVaultFile" type="file" accept="image/png,image/jpeg,image/webp"></label><span class="craft-vault-status" id="craftVaultStatus" role="status" aria-live="polite">Sign in to save across devices.</span></div>'+
   '<div class="craft-vault-gallery" id="craftVaultGallery" aria-label="Saved private previews"></div></section>'+
  '<div class="craft-panel" id="craftPanel" hidden>'+
    '<div class="craft-panel-head"><div class="craft-panel-identity"><span class="craft-panel-lights" aria-hidden="true"><i></i><i></i><i></i></span><strong id="craftPanelTitle">BIG LWA editor</strong></div><div class="craft-panel-actions">'+
       '<label class="craft-panel-save" title="Save a flattened exported image to your BIG LWA snapshot shelf">Save preview<input id="craftPanelSaveFile" type="file" accept="image/png,image/jpeg,image/webp"></label>'+ 
       '<button type="button" data-craft-webgl hidden>WebGL fallback</button>'+
       '<button type="button" data-craft-fullscreen>Fullscreen</button>'+
       '<a id="craftDirectLink" href="/tools/image-desk.html" target="_blank" rel="noopener noreferrer">Open in its own tab ↗</a>'+
       '<button type="button" data-craft-close>✕ Close</button></div></div>'+
    '<div class="craft-viewer" id="craftViewer"></div>'+
    '<p class="craft-panel-foot" role="status" id="craftEditorStatus">Your workspace is ready.</p>'+
  '</div>'+
  '<footer class="craft-smallprint">'+
    '<p><strong>Who made what?</strong> sqwibblR and this Workshop are original BIG LWA interfaces. lightR, paintR, keyframeR and fileR use attributed Storytold Rust/WebAssembly engines (PhotoCraft, VectorCraft, EffectCraft and PdfCraft). Original authors retain their copyrights; BIG LWA provides its own chrome, identity and account snapshot feature. No affiliation with Adobe.</p>'+
    '<p><strong>Privacy:</strong> Editing and exports stay inside your browser. Small image snapshots are saved privately to your BIG LWA account only when you select Save; native layered projects still require the editor’s download/export commands. Some advanced builds require WebGPU/WebGL.</p>'+
  '</footer>';
 const ready=new Set([LOCAL.id]),viewer=root.querySelector('#craftViewer'),panel=root.querySelector('#craftPanel');
 const vaultKey='biglwaWorkshopSnapshotsV1',vaultStatus=root.querySelector('#craftVaultStatus'),vaultFile=root.querySelector('#craftVaultFile');
 const vaultGallery=root.querySelector('#craftVaultGallery'),panelSaveFile=root.querySelector('#craftPanelSaveFile');
 let vaultBusy=false;
 const vaultAccount=()=>window.BigLWAAccountStorage?.uid||'';
 function vaultRows(){
  try{const value=JSON.parse(localStorage.getItem(vaultKey)||'{}');return Array.isArray(value.entries)?value.entries.filter(x=>x&&typeof x.data==='string'&&/^[a-zA-Z0-9+/=]+$/.test(x.data)).slice(0,3):[]}
  catch{return []}
 }
 function showVault(){
  vaultGallery.replaceChildren();
  const uid=vaultAccount(),rows=uid?vaultRows():[];
  vaultFile.disabled=!uid||vaultBusy;
  panelSaveFile.disabled=!uid||vaultBusy;
  vaultStatus.textContent=uid?(rows.length?rows.length+' private snapshot'+(rows.length===1?'':'s')+' saved to your account collection.':'No cloud snapshots yet. Export or create an image to save one.'):'Sign in to BIG LWA to save and reopen snapshots.';
  for(const item of rows){
   const card=document.createElement('article');card.className='craft-vault-card';
   const preview=document.createElement('img');preview.src='data:image/webp;base64,'+item.data;preview.alt='Private saved artwork';preview.loading='lazy';
   const caption=document.createElement('span');caption.textContent=item.name||'Workshop snapshot';
   const openButton=document.createElement('button');openButton.type='button';openButton.textContent='Open in sqwibblR';
   openButton.addEventListener('click',async()=>{
    const response=await fetch(preview.src),blob=await response.blob();
    if(editFile(new File([blob],(item.name||'artwork')+'.webp',{type:'image/webp'})))vaultStatus.textContent='Opened snapshot as one image layer in sqwibblR.';
   });
   const remove=document.createElement('button');remove.type='button';remove.textContent='Remove';remove.setAttribute('aria-label','Remove private snapshot '+(item.name||''));
   remove.addEventListener('click',()=>{
    if(!window.confirm('Remove this saved snapshot from your BIG LWA account?'))return;
    const updated=vaultRows().filter(row=>row.id!==item.id);
    try{localStorage.setItem(vaultKey,JSON.stringify({schema:1,entries:updated}));showVault()}
    catch(err){vaultStatus.textContent='Unable to remove snapshot: '+err.message}
   });
   card.append(preview,caption,openButton,remove);vaultGallery.append(card);
  }
 }
 async function saveVaultImage(blob,name='Artwork'){
  if(vaultBusy)return false;
  const storage=window.BigLWAAccountStorage;
  if(!storage){vaultStatus.textContent='Account storage has not loaded. Open your signed-in Studio first.';return false}
  await storage.ready;
  if(!storage.uid){vaultStatus.textContent='Sign in to BIG LWA before saving a cloud snapshot.';return false}
  if(!blob||!/^image\/(?:png|jpeg|webp)$/.test(blob.type)||blob.size>12*1024*1024){
   vaultStatus.textContent='Choose a JPG, PNG or WebP image smaller than 12 MB.';return false
  }
  vaultBusy=true;vaultFile.disabled=true;panelSaveFile.disabled=true;vaultStatus.textContent='Preparing a private account preview…';
  try{
   const bitmap=await createImageBitmap(blob);
   const scale=Math.min(1,640/bitmap.width,540/bitmap.height);
   const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
   const ctx=canvas.getContext('2d');ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close?.();
   const image=canvas.toDataURL('image/webp',.66);
   if(!image.startsWith('data:image/webp;base64,'))throw Error('WebP snapshot export is unavailable in this browser.');
   const encoded=image.slice('data:image/webp;base64,'.length);
   if(encoded.length>260000)throw Error('This image is too detailed for a private account snapshot. Download your full project locally.');
   const previous=vaultRows();
   const entry={id:crypto.randomUUID(),name:String(name).slice(0,80),app:current||LOCAL.id,createdAt:new Date().toISOString(),data:encoded};
   let entries=[entry,...previous].slice(0,3);
   while(entries.length&&new TextEncoder().encode(JSON.stringify({schema:1,entries})).length>450000)entries.pop();
   if(!entries.length)throw Error('Snapshot exceeds the account backup size limit.');
   localStorage.setItem(vaultKey,JSON.stringify({schema:1,entries}));
   await storage.flush();
   const outcome=String(storage.status||'');
   showVault();
   vaultStatus.textContent=/^Saved to your account/.test(outcome)?'Private image snapshot synced to BIG LWA. Editable layers must still be downloaded separately.':'Snapshot saved locally for this signed-in account; cloud sync status: '+outcome;
   return true;
  }catch(err){vaultStatus.textContent='Snapshot not saved: '+err.message;return false}
  finally{vaultBusy=false;vaultFile.disabled=!vaultAccount();panelSaveFile.disabled=!vaultAccount()}
 }
 for(const fileControl of [vaultFile,panelSaveFile]){
  fileControl.addEventListener('change',async event=>{
   const file=event.target.files?.[0];event.target.value='';
   if(!file)return;
   const saved=await saveVaultImage(file,file.name.replace(/\.[^.]+$/,''));
   if(fileControl===panelSaveFile)info.textContent=saved?'Preview added to your private Workshop shelf; native project files still export within the editor.':vaultStatus.textContent;
  });
 }
 window.addEventListener('biglwa:account-storage-status',()=>{if(root.isConnected&&!vaultBusy)showVault()});
 Promise.resolve(window.BigLWAAccountStorage?.ready).then(()=>{if(root.isConnected)showVault()});
 // Only accept an explicit save request from the currently active, same-origin editor iframe.
 window.addEventListener('message',async event=>{
  if(event.origin!==location.origin||!root.isConnected)return;
  const frame=viewer.querySelector('iframe');
  if(!frame||event.source!==frame.contentWindow||event.data?.type!=='BIGLWA_WORKSHOP_SAVE_IMAGE')return;
  // A result belongs only to the active, same-origin editor that requested it.
  const editor=current||LOCAL.id;
  if(event.data.app&&event.data.app!==editor)return;
  const name=typeof event.data.name==='string'
    ?event.data.name.replace(/\.[^.]+$/,'').slice(0,80)
    :(findItem(editor)?.name||'Workshop')+' artwork';
  const ok=await saveVaultImage(event.data.blob,name);
  const synced=ok&&/^Saved to your account/.test(String(window.BigLWAAccountStorage?.status||''));
  if(frame.isConnected&&viewer.contains(frame))
   frame.contentWindow?.postMessage({
    type:'BIGLWA_WORKSHOP_SAVE_RESULT',requestId:event.data.requestId||null,ok,synced
   },location.origin);
 });

 const title=root.querySelector('#craftPanelTitle'),direct=root.querySelector('#craftDirectLink'),info=root.querySelector('#craftEditorStatus');
 const status=root.querySelector('#craftInstallStatus');
 let current=null;
 const getUrl=(id,webgl=false)=>id===LOCAL.id?LOCAL.url:'/bigapps/'+PUBLIC_APP_ROUTE[id]+'/'+(webgl?'?webgl':'');
 const findItem=id=>id===LOCAL.id?LOCAL:ENGINES.find(item=>item.id===id);
 function close(){
  current=null;viewer.replaceChildren();panel.hidden=true;delete panel.dataset.craftEngine;
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
  panel.dataset.craftEngine=id;
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
  // The native canvas is WebAssembly. Brand the surrounding Workshop frame.
  title.replaceChildren();
  const mark=document.createElement('img');mark.src='/assets/bigapps/icons/'+item.name+'.png?v=20261023-stitch-png-1';
  mark.width=34;mark.height=34;mark.alt='';mark.className='craft-panel-block';
  const titleName=document.createElement('span');titleName.textContent=item.name;
  title.append(mark,titleName);
  info.textContent=id===LOCAL.id?
    'Original sqwibblR editor · work with layers and export a project. Choose Save to BIG LWA for a small private preview.':
    item.name+' · BIG LWA Workshop. Original source and licenses remain available in Source & license notes. Files stay local until you choose to export or save.';
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
  const response=await fetch('/bigapps/manifest.json',{cache:'no-store'});
  if(!response.ok)throw Error('No advanced editor manifest');
  const manifest=await response.json();
  if(manifest.schema!==1||!Array.isArray(manifest.apps))throw Error('Invalid editor manifest');
  for(const item of ENGINES){
   const row=manifest.apps.find(x=>x.id===item.id);
   if(row?.available===true&&row.version===item.version)ready.add(item.id);
  }
  status.textContent='sqwibblR ready · '+(ready.size-1)+' advanced open-source engines available in this deployment.';
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