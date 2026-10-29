/* BIG LWA Studio mark: one canonical tipi, always visible in the top-left.
   Clicking returns to Studio; it never silently switches to another module. */
(()=>{'use strict';
 const TIPI='/assets/studio-tipi-symbol.svg?v=20261026-1';
 const $=s=>document.querySelector(s);
 function sync(){
   const app=$('#studioApp'),brand=app?.querySelector('.studio-brand-row>a.brand.biglwa-block-brand');
   if(!brand)return false;
   let tipi=brand.querySelector('.biglwa-module-tipi');
   if(!tipi){
     tipi=document.createElement('img');tipi.className='biglwa-module-tipi';
     tipi.src=TIPI;tipi.alt='';tipi.setAttribute('aria-hidden','true');
     brand.append(tipi);
   }else if(tipi.getAttribute('src')!==TIPI){tipi.src=TIPI}
   // Any legacy active-module glyph is retired. There is exactly one Studio mark.
   brand.querySelectorAll('.biglwa-topbar-current').forEach(node=>node.remove());
   brand.dataset.biglwaTipiReady='1';
   brand.setAttribute('aria-label','Studio home');
   brand.title='Studio home';
   if(brand.dataset.biglwaTipiBound!=='1'){
     brand.dataset.biglwaTipiBound='1';
     brand.addEventListener('click',event=>{
       if(document.documentElement.classList.contains('biglwa-preview-mode'))return;
       event.preventDefault();event.stopImmediatePropagation();
       const back=$('#studioApp #moduleBack');
       if($('#studioApp .main.module-view #moduleWorkspace[data-module-key]')&&back)back.click();
       else if($('#studioApp .main.module-view #moduleWorkspace[data-module-key]')&&typeof history!=='undefined'){
         try{history.pushState({},'','/studio')}catch{}
         // Safely return home even if a fallback module did not mount Back.
         window.dispatchEvent(new PopStateEvent('popstate'));
       }
       sync();
     },true);
   }
   return true;
 }
 for(const event of ['biglwa:module-open','biglwa:module-close','biglwa:studio-update','biglwa:widget-symbols-ready']){
   document.addEventListener(event,()=>queueMicrotask(sync));
 }
 window.addEventListener('pageshow',sync);
 window.addEventListener('popstate',()=>queueMicrotask(sync));
 function boot(){
   sync();
   const timer=setInterval(()=>{if(sync())clearInterval(timer)},200);
   setTimeout(()=>clearInterval(timer),10000);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
 window.BigLWAStudioMark={sync};
})();
