/* BIG LWA Studio mark: active widget icon at rest, tipi when hovered/focused.
   Clicking always returns to Studio; never silently navigates to Veve. */
(()=>{'use strict';
 const TIPI='/assets/studio-tipi-symbol.svg?v=20261026-1';
 const aliases={lwazi:'tools',visualz:'projects',visualizr:'projects',project:'projects',
   politic:'politc',politics:'politc',room:'rooms',didyouknow:'learn',myfeed:'feed'};
 const fallback={
   politc:'<img src="/assets/politc-nyame-baatanpa.svg?v=20261014-1" alt="">',
   projects:'<img src="/assets/projects-symbol.svg?v=20260924-projects-symbol-1" alt="">',
   tools:'<img src="/assets/tools-hand-eye.svg" alt="">',
   archive:'▤',orbit:'◎',stream:'◌',calendar:'▦',map:'⌖',diary:'▱',games:'♟',
   notes:'▱',feed:'▤',veve:'✺',boards:'⊞',rooms:'♧',connect:'✣',camera:'◉'
 };
 const current=()=>document.querySelector('#studioApp .main.module-view #moduleWorkspace[data-module-key]');
 const $=s=>document.querySelector(s);
 function renderIcon(key){
   // Prefer exactly the glyph already displayed in the user's navigation.
   const selectors=[
     '#studioApp [data-sidebar-route-row="'+key+'"] .sidebar-route-icon',
     '#studioApp .hero-action-bar [data-shortcut-route="'+key+'"] .hero-shortcut-icon',
     '#studioApp #'+key+' .card-head .card-icon',
     '#studioApp #'+key+' .studio-symbol-mark'
   ];
   for(const selector of selectors){
     const node=$(selector);
     if(node&&node.innerHTML.trim())return node.innerHTML;
   }
   return fallback[key]||'<span aria-hidden="true">✳</span>';
 }
 function sync(){
   const app=$('#studioApp'),brand=app?.querySelector('.studio-brand-row>a.brand.biglwa-block-brand');
   if(!brand)return false;
   let tipi=brand.querySelector('.biglwa-module-tipi');
   if(!tipi){
     tipi=document.createElement('img');tipi.className='biglwa-module-tipi';
     tipi.src=TIPI;tipi.alt='';tipi.setAttribute('aria-hidden','true');
     brand.append(tipi);
   }
   let icon=brand.querySelector('.biglwa-topbar-current');
   if(!icon){
     icon=document.createElement('span');icon.className='biglwa-topbar-current';
     icon.setAttribute('aria-hidden','true');brand.append(icon);
   }
   const workspace=current(),raw=workspace?.dataset.moduleKey||'';
   const key=aliases[raw]||raw;const inModule=!!workspace;
   if(inModule&&(icon.dataset.moduleKey!==key||!icon.hasChildNodes())){
     icon.innerHTML=renderIcon(key);icon.dataset.moduleKey=key;
   }
   if(!inModule){icon.replaceChildren();delete icon.dataset.moduleKey;}
   brand.dataset.biglwaTipiReady='1';
   brand.dataset.biglwaActiveModule=inModule?key:'';
   brand.setAttribute('aria-label',inModule?'Return to Studio from '+key:'Studio home');
   brand.title=inModule?'Return to Studio':'Studio home';
   if(brand.dataset.biglwaTipiBound!=='1'){
     brand.dataset.biglwaTipiBound='1';
     brand.addEventListener('click',event=>{
       if(document.documentElement.classList.contains('biglwa-preview-mode'))return;
       event.preventDefault();event.stopImmediatePropagation();
       const back=$('#studioApp #moduleBack');
       if(current()&&back)back.click();
       else if(current()&&typeof history!=='undefined'){
         try{history.pushState({},'','/studio')}catch{}
         // Safely return home even if a fallback module did not mount Back.
         window.dispatchEvent(new PopStateEvent('popstate'));
       }
       sync();
     },true);
   }
   return true;
 }
 for(const event of ['biglwa:module-open','biglwa:module-close','biglwa:studio-update']){
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