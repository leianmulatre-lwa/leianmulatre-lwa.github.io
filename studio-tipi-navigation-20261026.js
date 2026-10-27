/* BIG LWA: the tipi is the 'back to Studio' mark for every Studio module.
   Don't change the stitched crest used on the actual Studio landing. */
(()=>{'use strict';
 const active=()=>Boolean(document.querySelector('#studioApp .main.module-view #moduleWorkspace[data-module-key]'));
 function sync(){
  const brand=document.querySelector('#studioApp .studio-brand-row>a.brand.biglwa-block-brand');
  if(!brand)return false;
  let tipi=brand.querySelector('.biglwa-module-tipi');
  if(!tipi){
   tipi=document.createElement('img');
   tipi.className='biglwa-module-tipi';
   tipi.src='/assets/studio-tipi-symbol.svg?v=20261026-1';
   tipi.alt='';tipi.setAttribute('aria-hidden','true');
   const original=brand.querySelector('.biglwa-topbar-crest');
   if(original)original.insertAdjacentElement('afterend',tipi);
   else brand.appendChild(tipi);
  }
  if(brand.dataset.biglwaTipiBack!=='1'){
   brand.dataset.biglwaTipiBack='1';
   brand.addEventListener('click',event=>{
    if(!active())return; // keep the original Studio crest's existing behavior
    event.preventDefault();
    event.stopImmediatePropagation();
    const back=document.querySelector('#studioApp #moduleBack');
    if(back)back.click();
    else window.location.assign('/studio');
    sync();
   },true);
  }
  const onModule=active();
  brand.setAttribute('aria-label',onModule?'Back to Studio':'Open Veve');
  brand.title=onModule?'Back to Studio':'Open Veve';
  return true;
 }
 for(const event of ['biglwa:module-open','biglwa:module-close']){
  document.addEventListener(event,()=>queueMicrotask(sync));
 }
 window.addEventListener('popstate',()=>queueMicrotask(sync));
 window.addEventListener('pageshow',()=>queueMicrotask(sync));
 function boot(){
  sync();
  const timer=setInterval(()=>{if(sync())clearInterval(timer)},250);
  setTimeout(()=>clearInterval(timer),12000);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
