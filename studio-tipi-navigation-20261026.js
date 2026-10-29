/* BIG LWA masthead: Studio crest at home, active module's native mark in a
   fixed optical square, and the canonical tipi ONLY on module hover/focus.
   Clicking always uses the existing Studio Back router. Never remount widgets. */
(()=>{'use strict';
 if(window.__biglwaMastheadMarkV4)return;window.__biglwaMastheadMarkV4=true;
 const TIPI='/assets/studio-tipi-symbol.svg?v=20261026-1';
 const $=(selector,root=document)=>root.querySelector(selector);
 const FALLBACK={
   politc:'/assets/politc-nyame-baatanpa.svg?v=20261014-1',
   projects:'/assets/projects-symbol.svg?v=20260924-projects-symbol-1',
   tools:'/assets/tools-hand-eye.svg',
   notes:'/assets/quick-notes-symbol-generated.png',
   feed:'/assets/feed-symbol-generated.png'
 };
 const GLYPHS={games:'♟',library:'▥',archive:'▤',calendar:'▦',map:'⌖',
   stream:'◌',veve:'✺',orbit:'◎',connect:'✣',camera:'◉',diary:'▱',
   boards:'⊞',rooms:'♧',closet:'♧',aura:'✧',avatar:'♟',
   music:'♫',learn:'✳',trophies:'★',profile:'◯'};
 const ALIASES={lwazi:'tools',visualizr:'projects',sqwibz:'notes',journal:'diary',
   myfeed:'feed',politic:'politc',room:'rooms',arcade:'games',boothi:'camera'};
 const $brand=()=>$('#studioApp .studio-brand-row>a.brand.biglwa-block-brand');
 const moduleKey=()=>{
   const app=$('#studioApp'),workspace=$('#studioApp #moduleWorkspace');
   if(!app||!workspace||workspace.hidden||!app.querySelector('.main.module-view'))return '';
   const raw=String(workspace.dataset.moduleKey||'').toLowerCase();
   return ALIASES[raw]||raw;
 };
 const copyMark=(source)=>{
   if(!source)return null;
   const mark=source.cloneNode(true);
   for(const node of [mark,...mark.querySelectorAll('*')]){
     if(node.removeAttribute){node.removeAttribute('id');node.removeAttribute('style');
       node.removeAttribute('data-heading-layout');node.removeAttribute('tabindex');}
   }
   mark.setAttribute('aria-hidden','true');
   return mark;
 };
 function iconFor(key){
   const app=$('#studioApp');if(!app)return null;
   // Prefer the icon that the *same page* already uses in its navigation.
   const selectors=[
     '[data-shortcut-route="'+key+'"] .hero-shortcut-icon',
     '[data-sidebar-route="'+key+'"] .sidebar-route-icon',
     '[data-sidebar-route-row="'+key+'"] .sidebar-route-icon',
     '#'+CSS.escape(key)+' .card-icon',
     '#'+CSS.escape(key)+' .studio-symbol-mark'
   ];
   if(key==='rooms')selectors.push('#room .card-icon');
   for(const selector of selectors){
     const source=$(selector,app);
     if(source){
       const value=copyMark(source);
       if(value && (value.textContent.trim()||value.querySelector('img,svg')))return value;
     }
   }
   const wrap=document.createElement('span');
   wrap.className='biglwa-module-mark-fallback';
   if(FALLBACK[key]){
     const img=document.createElement('img');img.src=FALLBACK[key];img.alt='';wrap.append(img);
   }else wrap.textContent=GLYPHS[key]||'✳';
   return wrap;
 }
 function sync(){
   const brand=$brand();if(!brand)return false;
   let tipi=$('.biglwa-module-tipi',brand);
   if(!tipi){tipi=document.createElement('img');tipi.className='biglwa-module-tipi';
     tipi.alt='';tipi.setAttribute('aria-hidden','true');brand.append(tipi);}
   if(tipi.getAttribute('src')!==TIPI)tipi.src=TIPI;
   let current=$('.biglwa-topbar-current',brand);
   if(!current){current=document.createElement('span');current.className='biglwa-topbar-current';
     current.setAttribute('aria-hidden','true');brand.append(current);}
   const key=moduleKey();
   if(key && (brand.dataset.biglwaActiveModule!==key||!current.firstElementChild)){
     current.replaceChildren(iconFor(key));
   }
   brand.dataset.biglwaActiveModule=key;
   brand.classList.toggle('biglwa-brand-in-module',Boolean(key));
   brand.dataset.biglwaTipiReady='1';
   brand.setAttribute('aria-label',key?'Return to Studio':'Studio home');
   brand.title=key?'Return to Studio':'Studio home';
   if(brand.dataset.biglwaTipiBound!=='1'){
     brand.dataset.biglwaTipiBound='1';
     brand.addEventListener('click',event=>{
       if(document.documentElement.classList.contains('biglwa-preview-mode'))return;
       event.preventDefault();event.stopImmediatePropagation();
       if(moduleKey()){
         const back=$('#studioApp #moduleBack');
         if(back)back.click();
         else {try{history.pushState({},'','/studio')}catch{}
           window.dispatchEvent(new PopStateEvent('popstate'));}
       }
       queueMicrotask(sync);
     },true);
   }
   return true;
 }
 let scheduled=false;
 function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;sync()})}
 for(const event of ['biglwa:module-open','biglwa:module-close',
   'biglwa:studio-update','biglwa:widget-symbols-ready','biglwa:widgets-restored']){
   document.addEventListener(event,schedule);
 }
 window.addEventListener('pageshow',schedule);
 window.addEventListener('popstate',schedule);
 function boot(){
   sync();
   // ui-coherence recreates the top-left link after hydration; rebind only if
   // the direct .studio-brand-row child changes, NOT on mouse hover or animation.
   const app=$('#studioApp');
   if(app){
     const row=$('.studio-brand-row',app);
     if(row)new MutationObserver(schedule).observe(row,{childList:true});
   }
   const timer=setInterval(()=>{if(sync())clearInterval(timer)},200);
   setTimeout(()=>clearInterval(timer),10000);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
 window.BigLWAStudioMark={sync};
})();
