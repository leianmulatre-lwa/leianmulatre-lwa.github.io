/* BIG LWA Studio — yellow dot collapses IN PLACE; red still docks.
   No widget DOM, imported data, game carousel or drag handle is destroyed. */
(()=>{'use strict';
 if(window.__biglwaYellowHeaderOnlyV1)return;
 window.__biglwaYellowHeaderOnlyV1=true;

 const widgetSelector='#studioApp .masonry .card:not(.manifesto-card),#studioApp .customizable-widget,#studioApp .profile-card,#studioApp #studioAvatarCard,#studioApp .music-card,#studioApp .aura-card,#studioApp .guest-check-card';
 const isVisitor=()=>window.__biglwaPublicStorageView===true||document.documentElement.classList.contains('biglwa-preview-mode');
 const uid=()=>String(window.BigLWAAccountStorage?.uid||window.__biglwaIdentity?.uid||'').trim();
 const getSaved=()=>{const id=uid();if(!id)return null;try{
   const layout=window.BigLWAStudioLayout?.snapshot?.()||JSON.parse(localStorage.getItem('biglwaStudioLayoutV4:'+id)||'null');
   return Array.isArray(layout?.collapsed)?new Set(layout.collapsed.map(String)):new Set();
  }catch{return new Set()}};

 // These are the two real account assets committed to BIG LWA, not letter fallbacks.
 // Sesa Wo Suban = Avatar; Sunsum = Aura. Reapply only after a real DOM re-render.
 // Both original emblem files contain opaque white pixels. This SVG
 // luminance-to-alpha filter knocks out the white *inside* the image.
 // Unlike a CSS white background, it also works on tinted Aura wallpapers.
 function installSymbolKnockout(){
  if(document.getElementById('biglwaStudioSymbolWhiteKnockout'))return;
  const ns='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(ns,'svg');
  svg.id='biglwaStudioSymbolWhiteKnockout';
  svg.setAttribute('width','0');svg.setAttribute('height','0');
  svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');
  svg.style.cssText='position:absolute;overflow:hidden;pointer-events:none;width:0;height:0';
  const defs=document.createElementNS(ns,'defs');
  const filter=document.createElementNS(ns,'filter');
  filter.id='biglwaStudioWhiteToAlpha';
  filter.setAttribute('x','0');filter.setAttribute('y','0');
  filter.setAttribute('width','100%');filter.setAttribute('height','100%');
  filter.setAttribute('color-interpolation-filters','sRGB');
  const matrix=document.createElementNS(ns,'feColorMatrix');
  matrix.setAttribute('in','SourceGraphic');
  matrix.setAttribute('type','matrix');
  // Output RGB=black; opacity = 1 - perceived white luminance.
  // Pure white vanishes; antialiased gray edges retain smooth opacity.
  matrix.setAttribute('values',
   '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -0.2126 -0.7152 -0.0722 0 1');
  filter.append(matrix);defs.append(filter);svg.append(defs);
  (document.body||document.documentElement).append(svg);
 }
 function applyIdentitySymbols(){
  const targets=[
   ['#studioApp #studioAvatarCard .biglwa-avatar-head .card-kicker','/sesa-wo-suban-medium.png','avatar'],
   ['#studioApp .aura-card .card-kicker','/Sunsum.webp','aura']
  ];
  for(const [selector,src,key] of targets){
   const heading=document.querySelector(selector);if(!heading)continue;
   let mark=heading.querySelector(':scope > .studio-heading-image-symbol');
   if(!mark){
    mark=document.createElement('img');mark.className='studio-heading-image-symbol';
    mark.src=src;mark.alt='';mark.setAttribute('aria-hidden','true');
    mark.dataset.widgetSymbol=key;heading.prepend(mark);
   }else if(mark.getAttribute('src')!==src){mark.src=src}
  }
  const music=document.querySelector('#studioApp .music-card');
  if(music){
   const kicker=music.querySelector(':scope > .card-kicker');
   if(kicker&&/^n$/i.test(kicker.textContent.trim()))kicker.textContent='♫';
  }
 }
 function installFixStyles(){
  if(document.getElementById('studioWidgetVisibilityMusicFix'))return;
  const link=document.createElement('link');
  link.id='studioWidgetVisibilityMusicFix';link.rel='stylesheet';
  link.href='/studio-widget-visibility-music-20261102.css?v=20261103-rail-clearance-3';
  document.head.append(link);
 }

 // Compact is a real in-place SQUARE, not a removed/minimized-hidden widget.
 // The separate red action still docks and lights the Skeleton Key removal LED.
 const upperWidgets={
  music:'#studioApp .music-card',aura:'#studioApp .aura-card',
  avatar:'#studioApp #studioAvatarCard','guest-check':'#studioApp .guest-check-card'
 };
 const upperId=widget=>{
  if(!widget)return '';
  if(widget.id==='studioAvatarCard')return 'avatar';
  if(widget.classList.contains('music-card'))return 'music';
  if(widget.classList.contains('aura-card'))return 'aura';
  if(widget.classList.contains('guest-check-card'))return 'guest-check';
  return '';
 };
 const upperLabel={music:'Music',aura:'Aura',avatar:'Avatar','guest-check':'Guest Check'};
 const compactIcon={
  music:'♫',aura:'<img src="/Sunsum.webp" alt="" aria-hidden="true">',
  avatar:'<img src="/sesa-wo-suban-medium.png" alt="" aria-hidden="true">',
  'guest-check':'✉'
 };
 let announceTimer=0;
 function announce(message){
  const app=document.querySelector('#studioApp');if(!app)return;
  let status=app.querySelector('#studioUpperWidgetStatus');
  if(!status){
   status=document.createElement('p');status.id='studioUpperWidgetStatus';
   status.className='studio-upper-widget-status';status.setAttribute('role','status');
   status.setAttribute('aria-live','polite');app.append(status);
  }
  status.textContent=message;status.classList.add('is-active');
  clearTimeout(announceTimer);
  announceTimer=setTimeout(()=>status.classList.remove('is-active'),2400);
 }
 function compactPanel(){
  const app=document.querySelector('#studioApp');
  if(!app)return null;
  return app.querySelector('#minimizedWidgetDock');
 }
 function syncUpperPanel(){
  const dock=compactPanel();
  const app=document.querySelector('#studioApp');
  if(!app||!dock)return;
  for(const [id,selector] of Object.entries(upperWidgets)){
   const widget=app.querySelector(selector);
   let row=dock.querySelector('[data-upper-compact-row="'+id+'"]');
   const compact=!!widget?.classList.contains('studio-upper-square')&&
    !widget.classList.contains('widget-is-minimized')&&
    !widget.classList.contains('widget-is-docked')&&!widget.hidden;
   if(!compact){if(row)row.remove();continue}
   if(!row){
    row=document.createElement('div');row.className='sidebar-shortcut-row sidebar-upper-compact-row';
    row.dataset.upperCompactRow=id;
    const icon=document.createElement('span');icon.className='sidebar-route-icon';icon.setAttribute('aria-hidden','true');icon.innerHTML=compactIcon[id];
    const text=document.createElement('span');text.className='sidebar-upper-compact-text';text.textContent=upperLabel[id];
    const light=document.createElement('span');light.className='sidebar-upper-yellow-indicator';
    light.title='Square in Studio · not removed';light.setAttribute('aria-hidden','true');
    const restore=document.createElement('button');restore.type='button';
    restore.className='sidebar-upper-restore';restore.dataset.upperRestore=id;
    restore.textContent='+';restore.title='Restore '+upperLabel[id]+' to rectangle';
    restore.setAttribute('aria-label','Restore '+upperLabel[id]+' to full rectangle');
    row.append(icon,text,light,restore);dock.append(row);
   }
   // Reconcile the saved sidebar mark, never append another copy of the same symbol.
   const icon=row.querySelector('.sidebar-route-icon');
   if(icon&&icon.innerHTML!==compactIcon[id])icon.innerHTML=compactIcon[id];
   row.dataset.widgetView='square';
   row.dataset.widgetRemoved='false';
   row.title=upperLabel[id]+' · square in Studio · + restores rectangle';
  }
  const primary=app.querySelector('#studioSidebarPrimary');
  if(primary)primary.hidden=!dock.querySelector('[data-shortcut-row],.sidebar-upper-compact-row');
 }
 function restoreUpper(id){
  const widget=document.querySelector(upperWidgets[id]||'__missing_upper_widget__');
  if(!widget)return false;
  widget.classList.remove('studio-upper-square','studio-header-only');
  widget.dataset.upperWidgetView='rectangle';widget.dataset.yellowCollapseTouched='1';
  widget.dataset.yellowCollapseOwner=uid()||'';
  sync(widget);persist();syncUpperPanel();
  window.dispatchEvent(new CustomEvent('biglwa:studio-upper-state',{detail:{id,view:'rectangle'}}));
  announce(upperLabel[id]+' restored to rectangle.');
  return true;
 }
 function minimizeUpper(id){
  const widget=document.querySelector(upperWidgets[id]||'__missing_upper_widget__');
  if(!widget||widget.hidden||widget.classList.contains('widget-is-docked'))return false;
  if(widget.classList.contains('studio-upper-square')){
   announce(upperLabel[id]+' is already minimized. Use + in Skeleton Key to restore.');
   return true;
  }
  // Detect a genuinely square custom layout; never shrink it a second time.
  const rect=widget.getBoundingClientRect();
  const wasSquare=rect.width>55&&rect.height>55&&
   Math.abs(rect.width-rect.height)<=Math.max(12,Math.min(rect.width,rect.height)*.065);
  if(wasSquare){
   // Never change classes or layout when the natural card is already square.
   // The previous implementation showed this message AFTER applying a second
   // square layout, which caused the cards to trespass into the shortcut bar.
   widget.dataset.upperWidgetView='square';
   widget.dataset.yellowCollapseTouched='1';
   widget.dataset.yellowCollapseOwner=uid()||'';
   // A remembered header-only state must not be replayed after this no-op.
   sync(widget);persist();syncUpperPanel();
   announce(upperLabel[id]+' is already minimized.');
   return true;
  }
  widget.classList.remove('widget-is-expanded');
  widget.classList.add('studio-upper-square','studio-header-only');
  widget.dataset.upperWidgetView='square';
  widget.dataset.yellowCollapseTouched='1';widget.dataset.yellowCollapseOwner=uid()||'';
  sync(widget);persist();syncUpperPanel();
  window.dispatchEvent(new CustomEvent('biglwa:studio-upper-state',{detail:{id,view:'square'}}));
  announce('Minimized '+upperLabel[id]+' to square. Restore with + in Skeleton Key.');
  return true;
 }
 window.BigLWAUpperWidgets={minimize:minimizeUpper,restore:restoreUpper,refresh:syncUpperPanel};

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
  const compact=widget.classList.contains('studio-upper-square');
  const collapsed=widget.classList.contains('studio-header-only');
  const upper=upperId(widget);
  if(widget.classList.contains('music-card')){
   widget.classList.toggle('studio-music-square',compact);
   widget.dataset.musicVariant=compact?'square':'long';
  }
  widget.querySelectorAll('.widget-window-controls .window-light.yellow').forEach(button=>{
   const name=upper?upperLabel[upper]:label(widget);
   const title=upper?(compact?'Already minimized · restore with + in Skeleton Key':'Minimize '+name+' to square'):(collapsed?'Restore '+name:'Minimize '+name);
   button.title=title;button.setAttribute('aria-label',title);
   button.setAttribute('aria-expanded',String(!collapsed));
   button.setAttribute('aria-pressed',String(collapsed));
  });
 }
 function updateAll(){
  installFixStyles();installSymbolKnockout();applyIdentitySymbols();
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
    if(upperId(widget))widget.classList.toggle('studio-upper-square',saved.has(id));
   }
   sync(widget);
  });
  syncUpperPanel();
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
  const upperRestore=event.target.closest('[data-upper-restore]');
  if(upperRestore){
   event.preventDefault();event.stopImmediatePropagation();
   restoreUpper(upperRestore.dataset.upperRestore);return;
  }
  const yellow=event.target.closest('.widget-window-controls .window-light.yellow');
  if(yellow){
   const widget=yellow.closest(widgetSelector);
   if(!widget||!document.querySelector('#studioApp')?.contains(widget))return;
   findHead(widget);
   event.preventDefault();event.stopImmediatePropagation();
   const upper=upperId(widget);
   if(upper){minimizeUpper(upper);return}
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
    widget.classList.remove('studio-header-only','studio-upper-square');widget.dataset.yellowCollapseTouched='1';sync(widget);
    widget.dataset.upperWidgetView='removed';
    // Avatar's own red action stores its visibility outside canonical layout;
    // persist the cleared square state before that red removal proceeds.
    if(upperId(widget)==='avatar')persist();
    syncUpperPanel();
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