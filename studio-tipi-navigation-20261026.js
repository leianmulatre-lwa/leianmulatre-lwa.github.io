/* BIG LWA masthead: Studio crest at home, active module's native mark in a
   fixed optical square, and the canonical tipi ONLY on module hover/focus.
   Clicking always uses the existing Studio Back router. Never remount widgets. */
(()=>{'use strict';
 if(window.__biglwaMastheadMarkV4)return;window.__biglwaMastheadMarkV4=true;
 const TIPI='/assets/studio-tipi-symbol.svg?v=20261026-1';
 const $=(selector,root=document)=>root.querySelector(selector);
 const ALIASES={lwazi:'tools',visualizr:'projects',sqwibz:'notes',journal:'diary',
   myfeed:'feed',politic:'politc',room:'rooms',arcade:'games',boothi:'camera'};
 const $brand=()=>$('#studioApp .studio-brand-row>a.brand.biglwa-block-brand');
 const moduleKey=()=>{
   const app=$('#studioApp'),workspace=$('#studioApp #moduleWorkspace');
   if(!app||!workspace||workspace.hidden||!app.querySelector('.main.module-view'))return '';
   const raw=String(workspace.dataset.moduleKey||'').toLowerCase();
   return ALIASES[raw]||raw;
 };
 // Copy artwork only. Navigation classes carry their own 16/18px geometry and
 // must never enter the masthead or its shortcut normalizer will resize it.
 function iconFor(key){
   const app=$('#studioApp');if(!app)return null;
   const raw=document.createElement('span');
   const canonical=window.BigLWAWidgetSymbols?.markup(key);
   let source=null;
   if(canonical){raw.innerHTML=canonical;source=raw}
   else{
     const safe=key.replace(/[^a-z0-9_-]/g,'');
     source=$('[data-sidebar-route-row="'+safe+'"] .sidebar-route-icon',app)
       ||$('[data-shortcut-route="'+safe+'"] .hero-shortcut-icon',app)
       ||$('#'+safe+' .card-icon',app);
   }
   if(!source)return null; // Wait for the real registry; never invent a symbol.
   const mark=document.createElement('span');mark.className='masthead-native-symbol';
   mark.dataset.symbolKey=key;mark.setAttribute('aria-hidden','true');
   const rotated=!!source.querySelector('.biglwa-archive-horizontal-symbol');
   const art=source.matches('img,svg')?source:source.querySelector('img,svg');
   if(art){
     const clean=art.cloneNode(true);
     for(const node of [clean,...clean.querySelectorAll('*')]){
       if(node.hasAttribute('data-heading-layout'))node.removeAttribute('style');
       node.removeAttribute('data-heading-layout');node.removeAttribute('id');
       node.classList.remove('heading-normalized-glyph');
     }
     clean.removeAttribute('style');clean.removeAttribute('class');
     clean.setAttribute('aria-hidden','true');
     if(rotated&&clean.tagName.toLowerCase()==='svg'){
       const group=document.createElementNS('http://www.w3.org/2000/svg','g');
       group.setAttribute('transform','rotate(90)');group.append(...clean.childNodes);
       clean.append(group);mark.dataset.symbolRotation='90';
     }
     mark.append(clean);
   }else{
     mark.textContent=source.textContent.trim();
     if(rotated)mark.dataset.symbolRotation='90';
   }
   return mark;
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
   const canonical=key?window.BigLWAWidgetSymbols?.markup(key)||'':'';
   brand.classList.toggle('biglwa-brand-in-module',Boolean(key));
   if(key&&(brand.dataset.biglwaActiveModule!==key||current.dataset.symbolMarkup!==canonical||!current.firstElementChild)){
     const mark=iconFor(key);current.replaceChildren(...(mark?[mark]:[]));
     current.dataset.symbolMarkup=canonical;
   }
   const size=innerWidth<=720?44:52,ink=size-6;
   const mark=current.firstElementChild;
   if(key&&mark&&(mark.dataset.mastheadSize!==String(size)||!mark.dataset.headingLayout)){
     mark.dataset.mastheadSize=String(size);
     window.BigLWAHeadingRule?.normalize(mark,size,ink);
   }
   brand.dataset.biglwaActiveModule=key;
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
 window.addEventListener('resize',schedule);
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
 window.BigLWAStudioMark={sync,iconFor,get keys(){return window.BigLWAWidgetSymbols?.keys()||[]}};
})();
