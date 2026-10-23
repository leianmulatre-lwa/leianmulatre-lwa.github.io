/* BIG LWA R-suite overlay — applies only to the original hosted HTML shell.
 * The Rust/WASM editor internals, native project formats and author notices stay intact. */
(()=>{
 'use strict';
 const matched=location.pathname.match(/^\/bigapps\/(lightR|paintR|keyframeR|fileR|photocraft|vectorcraft|effectcraft|pdfcraft)(?:\/|$)/i)?.[1];
 const ids={lightr:'photocraft',paintr:'vectorcraft',keyframer:'effectcraft',filer:'pdfcraft',photocraft:'photocraft',vectorcraft:'vectorcraft',effectcraft:'effectcraft',pdfcraft:'pdfcraft'};
 const id=ids[matched?.toLowerCase()];
 const links={github:'https://github.com/leianmulatre-lwa/leianmulatre-lwa.github.io',patreon:'https://www.patreon.com/cw/biglwa'};
 const apps={
  photocraft:{name:'lightR',letter:'𝖑',legacy:'PhotoCraft'},
  vectorcraft:{name:'paintR',letter:'𝖕',legacy:'VectorCraft'},
  effectcraft:{name:'keyframeR',letter:'𝖐',legacy:'EffectCraft'},
  pdfcraft:{name:'fileR',letter:'𝖋',legacy:'PdfCraft'}
 };
 if(!id||!apps[id])return;
 document.documentElement.dataset.biglwaEditor=id;
 document.documentElement.dataset.biglwaApp=matched;
 const item=apps[id];
 function setup(){
  if(document.querySelector('.biglwa-editor-chrome'))return;
  const dock=document.createElement('aside');dock.className='biglwa-editor-chrome';
  dock.setAttribute('aria-label','BIG LWA editor controls');
  dock.innerHTML='<div class="biglwa-editor-glyph" aria-hidden="true"><img src="/assets/bigapps/blocks/'+matched+'.svg" alt="" /></div>'+
   '<div class="biglwa-editor-name"><strong>'+item.name+'</strong><small>BIG LWA · licensed editing engine</small></div>'+
   '<div class="biglwa-editor-lights" role="group" aria-label="Window controls">'+
   '<button data-craft-chrome="exit" type="button" aria-label="Return to BIG LWA Tools" title="Back to Tools"></button>'+
   '<button data-craft-chrome="hide" type="button" aria-label="Hide toolbar" title="Hide toolbar"></button>'+
   '<button data-craft-chrome="fullscreen" type="button" aria-label="Fullscreen" title="Fullscreen editor"></button></div>'+
   '<div class="biglwa-editor-links">'+
   '<label title="Upload an image you exported from this editor to your private BIG LWA snapshots">Save exported image<input id="biglwaAdvancedSnapshot" type="file" accept="image/png,image/jpeg,image/webp"></label>'+
   '<a href="/studio?view=tools">Workshop ↗</a>'+
   '<a href="'+links.github+'" target="_blank" rel="noopener noreferrer">BIG LWA GitHub ↗</a><a href="'+links.patreon+'" target="_blank" rel="noopener noreferrer">Patreon ↗</a>'+
   '<a href="/bigapps/'+matched+'/upstream-licenses/SOURCE.txt" target="_blank" rel="noopener noreferrer">Licenses ↗</a></div>'+
   '<small class="biglwa-editor-status" role="status">Files stay local unless you choose to save a preview.</small>';
  const mini=document.createElement('button');mini.className='biglwa-editor-reopen';mini.hidden=true;
  mini.type='button';mini.textContent=item.name;mini.setAttribute('aria-label','Show BIG LWA toolbar');
  const status=dock.querySelector('.biglwa-editor-status');
  dock.addEventListener('click',async ev=>{
   const key=ev.target.closest('[data-craft-chrome]')?.dataset.craftChrome;
   if(key==='exit')location.assign('/studio?view=tools');
   if(key==='hide'){dock.hidden=true;mini.hidden=false}
   if(key==='fullscreen'){
    try{
     if(document.fullscreenElement)await document.exitFullscreen();
     else await document.documentElement.requestFullscreen();
    }catch{status.textContent='Fullscreen is blocked by this browser. You can still edit normally.'}
   }
  });
  mini.addEventListener('click',()=>{mini.hidden=true;dock.hidden=false});
  let pendingSnapshot=null;
  dock.querySelector('#biglwaAdvancedSnapshot').addEventListener('change',ev=>{
   const file=ev.target.files?.[0];ev.target.value='';
   if(!file)return;
   if(file.size>12*1024*1024||!/^image\/(?:png|jpeg|webp)$/.test(file.type)){
    status.textContent='Choose a PNG, JPG or WebP under 12 MB.';return;
   }
   if(window.parent===window){status.textContent='Open this app from BIG LWA Studio to save to your account.';return}
   const requestId=crypto.randomUUID();
   pendingSnapshot=requestId;
   window.parent.postMessage({
    type:'BIGLWA_WORKSHOP_SAVE_IMAGE',requestId,app:id,name:file.name,blob:file
   },location.origin);
   status.textContent='Saving a private preview to your BIG LWA shelf…';
  });
  window.addEventListener('message',ev=>{
   if(ev.origin!==location.origin||ev.source!==window.parent)return;
   if(ev.data?.type!=='BIGLWA_WORKSHOP_SAVE_RESULT'||!pendingSnapshot||
     ev.data.requestId!==pendingSnapshot)return;
   pendingSnapshot=null;
   status.textContent=!ev.data.ok
    ?'Preview was not saved. Check your Workshop shelf for details.'
    :ev.data.synced
      ?'Preview saved to your BIG LWA account.'
      :'Preview stored for this signed-in account on this device. Cloud sync still needs confirmation.';
  });
  // The Studio Workshop owns the editor's save and window controls. Never
  // float a second toolbar over native Rust/egui layers, tools or canvas.
  // Standalone tabs start with a small opt-in tools tab, not an open overlay.
  const embedded=window.parent!==window;
  document.documentElement.dataset.biglwaEmbedded=embedded?'true':'false';
  dock.hidden=true;
  mini.hidden=embedded;
  document.body.append(dock,mini);
  // Native credits stay visible. Avoid intrusive DOM mutation in the WebAssembly app.
  // Only correct a conventional top-level *exact* legacy title, when one exists.
  const fixTitle=()=>{
   for(const heading of document.querySelectorAll('h1,h2,[role=banner] strong')){
    if(heading.closest('.biglwa-editor-chrome'))continue;
    if(heading.children.length===0&&heading.textContent.trim()===item.legacy)
      heading.textContent=item.name;
   }
   for(const a of document.querySelectorAll('a[href]')){
    if(a.closest('.biglwa-editor-chrome'))continue;
    if(a.href&&/^https?:/i.test(a.href)&&a.origin!==location.origin){
     a.target='_blank';a.rel='noopener noreferrer';
    }
   }
  };
  fixTitle();
  const observer=new MutationObserver(fixTitle);
  observer.observe(document.body,{childList:true,subtree:true});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});
 else setup();
})();
