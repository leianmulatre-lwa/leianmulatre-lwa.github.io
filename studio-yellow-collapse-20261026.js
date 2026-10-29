/* BIG LWA Studio — yellow dot collapses IN PLACE; red still docks.
   No widget DOM, imported data, game carousel or drag handle is destroyed. */
(()=>{'use strict';
 if(window.__biglwaYellowHeaderOnlyV1)return;
 window.__biglwaYellowHeaderOnlyV1=true;

 const widgetSelector='#studioApp .masonry .card:not(.manifesto-card),#studioApp .customizable-widget,#studioApp .profile-card,#studioApp #studioAvatarCard';
 const isVisitor=()=>window.__biglwaPublicStorageView===true||document.documentElement.classList.contains('biglwa-preview-mode');
 const uid=()=>String(window.BigLWAAccountStorage?.uid||window.__biglwaIdentity?.uid||'').trim();
 const getSaved=()=>{const id=uid();if(!id)return null;try{
   const layout=window.BigLWAStudioLayout?.snapshot?.()||JSON.parse(localStorage.getItem('biglwaStudioLayoutV4:'+id)||'null');
   return Array.isArray(layout?.collapsed)?new Set(layout.collapsed.map(String)):new Set();
  }catch{return new Set()}};
 const key=widget=>widget.dataset.widgetId||widget.id||'';
 const label=widget=>widget.dataset.widgetLabel||widget.querySelector('h1,h2,.card-kicker')?.textContent?.trim()||key(widget)||'widget';
 const findHead=widget=>{
  const direct=[...widget.children].find(el=>el.matches('.biglwa-card-heading-row,.card-head,.card-header,.biglwa-avatar-head,.aura-head,.music-head,.widget-heading,.studio-widget-heading,.profile-head,.profile-header,.card-title,.card-kicker'));
  if(direct)return direct;
  const h=widget.querySelector('h1,h2,.card-kicker,.profile-name-line');
  if(!h){
   // Some dynamically hydrated widgets have no direct heading. Yellow must
   // never fall through to the legacy dock handler just because of markup.
   let fallback=widget.querySelector(':scope > .studio-collapse-fallback');
   if(!fallback){
    fallback=document.createElement('div');
    fallback.className='studio-collapse-fallback studio-collapse-keep';
    fallback.setAttribute('role','heading');
    fallback.setAttribute('aria-level','2');
    const badge=widget.querySelector('.card-icon,.studio-symbol-mark');
    const icon=badge?.cloneNode(true);
    if(icon){icon.removeAttribute('id');icon.setAttribute('aria-hidden','true');fallback.append(icon)}
    const heading=document.createElement('strong');
    heading.textContent=label(widget);fallback.append(heading);
    const controls=widget.querySelector(':scope > .widget-window-controls');
    if(controls)controls.insertAdjacentElement('afterend',fallback);
    else widget.prepend(fallback);
   }
   return fallback;
  }
  let ancestor=h;
  while(ancestor.parentElement&&ancestor.parentElement!==widget)ancestor=ancestor.parentElement;
  return ancestor.parentElement===widget?ancestor:null;
 };
 function sync(widget){
  if(!widget||!widget.isConnected)return;
  const head=findHead(widget);
  if(head&&!head.classList.contains('studio-collapse-keep'))head.classList.add('studio-collapse-keep');
  const collapsed=widget.classList.contains('studio-header-only');
  widget.querySelectorAll('.widget-window-controls .window-light.yellow').forEach(button=>{
   const action=collapsed?'Restore':'Minimize',name=label(widget);
   button.title=action+' '+name;
   button.setAttribute('aria-label',action+' '+name);
   button.setAttribute('aria-expanded',String(!collapsed));
   button.setAttribute('aria-pressed',String(collapsed));
  });
 }
 function updateAll(){
  if(isVisitor())return;
  const saved=getSaved();
  document.querySelectorAll(widgetSelector).forEach(widget=>{
   if(widget.dataset.yellowCollapseOwner!==(uid()||'')){
    delete widget.dataset.yellowCollapseTouched;
    widget.dataset.yellowCollapseOwner=uid()||'';
   }
   const id=key(widget);
   if(saved&&id&&widget.dataset.yellowCollapseTouched!=='1'&&!widget.classList.contains('widget-is-minimized')){
    widget.classList.toggle('studio-header-only',saved.has(id));
   }
   sync(widget);
  });
 }
 function persist(){
  if(isVisitor()||!uid())return;
  if(!window.__biglwaIdentity?.uid)return; // match the account ID used by Studio layout persistence
  window.BigLWAStudioLayout?.save?.();
 }
 // Capture at WINDOW level before legacy document-capture minimization.
 // Its handler previously moved yellow-minimized widgets into the toolbar.
 window.addEventListener('click',event=>{
  if(isVisitor()||!(event.target instanceof Element))return;
  const yellow=event.target.closest('.widget-window-controls .window-light.yellow');
  if(yellow){
   const widget=yellow.closest(widgetSelector);
   if(!widget||!document.querySelector('#studioApp')?.contains(widget))return;
   findHead(widget);
   event.preventDefault();event.stopImmediatePropagation();
   widget.classList.remove('widget-is-expanded');
   widget.classList.toggle('studio-header-only');
   widget.dataset.yellowCollapseTouched='1';
   widget.dataset.yellowCollapseOwner=uid()||'';
   sync(widget);
   persist();
   return;
  }
  const red=event.target.closest('.widget-window-controls [data-dock-widget],.avatar-window-controls [data-avatar-widget-action="remove"]');
  if(red){
   const widget=red.closest(widgetSelector);
   if(widget?.classList.contains('studio-header-only')){
    widget.classList.remove('studio-header-only');widget.dataset.yellowCollapseTouched='1';sync(widget);
    // Existing red handler continues unchanged and will persist dock state.
    // No extra save yet: red's own operation is the final transaction.
   }
  }
 },true);

 let queued=false;
 const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;updateAll()})};
 function start(){
  updateAll();
  const app=document.querySelector('#studioApp');
  if(app)new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
  else new MutationObserver((observer)=>{const root=document.querySelector('#studioApp');if(!root)return;observer.disconnect();start()}).observe(document.documentElement,{childList:true,subtree:true});
 }
 window.addEventListener('biglwa:studio-collapse-applied',schedule);
 window.addEventListener('biglwa:customization-remote',schedule);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
 else start();
})();