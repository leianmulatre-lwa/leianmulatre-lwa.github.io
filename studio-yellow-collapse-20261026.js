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
  if(!document.getElementById('studioWidgetVisibilityMusicFix')){
   const link=document.createElement('link');
   link.id='studioWidgetVisibilityMusicFix';link.rel='stylesheet';
   link.href='/studio-widget-visibility-music-20261102.css?v=20261103-height-cascade-4';
   document.head.append(link);
  }
  // Last loaded: one authoritative layout, not another fixed-height stereo.
  if(!document.getElementById('studioUpperRailSizeContract')){
   const link=document.createElement('link');
   link.id='studioUpperRailSizeContract';link.rel='stylesheet';
   link.href='/studio-upper-rail-size-contract-20261103.css?v=20261103-preserve-squares-3';
   document.head.append(link);
  }
 }

 // The upper row has SIX square-width units. Full cards span two,
 // square cards span one; no resizing can exceed that capacity.
 // Yellow is a local size toggle, NEVER a Skeleton Key removal.
 const upperWidgets={
  music:'#studioApp .music-card',aura:'#studioApp .aura-card',
  avatar:'#studioApp #studioAvatarCard','guest-check':'#studioApp .guest-check-card'
 };
 const upperDefaults={music:'long',aura:'square',avatar:'square','guest-check':'square'};
 const upperLabel={music:'Music',aura:'Aura',avatar:'Avatar','guest-check':'Guest Check'};
 const UPPER_CAPACITY=6;
 const upperId=widget=>{
  if(!widget)return '';
  if(widget.id==='studioAvatarCard')return 'avatar';
  if(widget.classList.contains('music-card'))return 'music';
  if(widget.classList.contains('aura-card'))return 'aura';
  if(widget.classList.contains('guest-check-card'))return 'guest-check';
  return '';
 };
 const upperElement=id=>document.querySelector(upperWidgets[id]||'__no_upper_widget__');
 const upperRemoved=(id,widget)=>{
  if(!widget||widget.hidden||widget.classList.contains('widget-is-minimized')||
    widget.classList.contains('widget-is-docked'))return true;
  const pair=widget.closest('#biglwaAuraAvatarPair');
  if(pair?.classList.contains(id==='avatar'?'is-avatar-hidden':'is-aura-hidden'))return true;
  return false;
 };
 const upperView=(id,widget)=>{
  const value=widget?.dataset.upperWidgetView;
  if(value==='long'||value==='square')return value;
  if(widget?.classList.contains('studio-upper-square'))return 'square';
  return upperDefaults[id]||'square';
 };
 const upperUnits=(id,widget)=>upperRemoved(id,widget)?0:upperView(id,widget)==='long'?2:1;
 const upperTotal=()=>Object.keys(upperWidgets).reduce((sum,id)=>sum+upperUnits(id,upperElement(id)),0);
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
  announceTimer=setTimeout(()=>status.classList.remove('is-active'),2200);
 }
 function applyUpperView(id,widget,view){
  if(!widget)return;
  const square=view==='square';
  widget.dataset.upperWidgetView=square?'square':'long';
  widget.classList.toggle('studio-upper-square',square);
  // A square card still shows its contents. Header-only is an obsolete
  // lower-widget collapse mode and must not be set for upper widgets.
  widget.classList.remove('studio-header-only');
  if(id==='music'){
   widget.classList.toggle('studio-music-square',square);
   widget.dataset.musicVariant=square?'square':'long';
  }
 }
 function syncUpperPanel(){
  const app=document.querySelector('#studioApp'),dock=app?.querySelector('#minimizedWidgetDock');
  // Existing yellow restore tiles were the bug: the member never removed
  // those widgets. Remove old tiles including stale session duplicates.
  dock?.querySelectorAll('[data-upper-compact-row]').forEach(row=>row.remove());
  // Nothing about yellow size changes may light the red Skeleton Key LED.
 }
 function syncUpperRail(){
  const rail=document.querySelector('#studioApp #heroWidgetRail')||
   document.querySelector('#studioApp .hero-widget-rail');
  if(!rail)return;
  const pair=rail.querySelector('#biglwaAuraAvatarPair');
  const units=UPPER_CAPACITY;
  if(rail.style.getPropertyValue('--studio-upper-cols')!==String(units))
   rail.style.setProperty('--studio-upper-cols',String(units));
  for(const id of Object.keys(upperWidgets)){
   const widget=upperElement(id);if(!widget)continue;
   const size=upperUnits(id,widget);
   const unitsValue=String(size||1);
   if(widget.dataset.upperSpan!==unitsValue)widget.dataset.upperSpan=unitsValue;
  }
  // Keep the original five-track square width as the minimum footprint.
  // Expanded cards share the remaining width; six is the STATE capacity,
  // not permission to shrink every square when a second card expands.
  const railWidth=rail.getBoundingClientRect().width;
  const visible=Object.keys(upperWidgets).filter(id=>!upperRemoved(id,upperElement(id)));
  const squareCount=visible.filter(id=>upperView(id,upperElement(id))==='square').length;
  const longCount=visible.length-squareCount;
  const squareWidth=Math.max(0,(railWidth-56)/5);
  const longWidth=longCount?Math.max(squareWidth,(railWidth-14*Math.max(0,visible.length-1)-squareCount*squareWidth)/longCount):squareWidth;
  const cardWidth=id=>upperRemoved(id,upperElement(id))?0:upperView(id,upperElement(id))==='long'?longWidth:squareWidth;
  if(railWidth>0){
   const tracks=[...rail.children].filter(el=>el===pair?visible.includes('aura')||visible.includes('avatar'):visible.includes(upperId(el))).map(el=>{
    const size=el===pair?cardWidth('aura')+cardWidth('avatar')+(visible.includes('aura')&&visible.includes('avatar')?14:0):cardWidth(upperId(el));
    return size+'px';
   }).join(' ');
   rail.style.setProperty('--studio-upper-tracks',tracks||'1fr');
   if(pair)pair.style.setProperty('--studio-pair-tracks',['aura','avatar'].filter(id=>visible.includes(id)).map(id=>cardWidth(id)+'px').join(' ')||'1fr');
  }
  if(pair){
   const aura=upperElement('aura'),avatar=upperElement('avatar');
   const a=upperUnits('aura',aura),b=upperUnits('avatar',avatar);
   pair.dataset.upperSpan=String(Math.max(1,a+b));
   const aFlex=(a||1)+'fr',bFlex=(b||1)+'fr';
   if(pair.style.getPropertyValue('--studio-aura-cols')!==aFlex)
    pair.style.setProperty('--studio-aura-cols',aFlex);
   if(pair.style.getPropertyValue('--studio-avatar-cols')!==bFlex)
    pair.style.setProperty('--studio-avatar-cols',bFlex);
  }
 }
 function setUpperView(id,view,{save=true}={}){
  const widget=upperElement(id);if(!widget)return false;
  applyUpperView(id,widget,view);
  widget.dataset.yellowCollapseTouched='1';
  widget.dataset.yellowCollapseOwner=uid()||'';
  sync(widget);syncUpperRail();syncUpperPanel();
  if(save)persist();
  window.dispatchEvent(new CustomEvent('biglwa:studio-upper-state',{
   detail:{id,view,units:upperTotal()}
  }));
  return true;
 }
 function restoreUpper(id){
  if(!upperElement(id))return false;
  if(upperView(id,upperElement(id))==='long'){
   announce(upperLabel[id]+' is already full size.');return true;
  }
  if(upperTotal()+1>UPPER_CAPACITY){
   announce(upperLabel[id]+' is already minimized. This row is full.');return true;
  }
  setUpperView(id,'long');announce(upperLabel[id]+' restored to full size.');
  return true;
 }
 function minimizeUpper(id){
  const widget=upperElement(id);
  if(!widget||upperRemoved(id,widget))return false;
  if(upperView(id,widget)==='square')return restoreUpper(id);
  setUpperView(id,'square');
  announce(upperLabel[id]+' minimized to square.');
  return true;
 }
 window.BigLWAUpperWidgets={
  minimize:minimizeUpper,restore:restoreUpper,refresh:()=>{
   syncUpperRail();syncUpperPanel();
  },status:()=>{
   const entries={};for(const id of Object.keys(upperWidgets))
    entries[id]={view:upperView(id,upperElement(id)),units:upperUnits(id,upperElement(id))};
   return {capacity:UPPER_CAPACITY,used:upperTotal(),entries};
  }
 };

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
  const upper=upperId(widget);
  const compact=upper?upperView(upper,widget)==='square':
   widget.classList.contains('studio-upper-square');
  const collapsed=upper?compact:widget.classList.contains('studio-header-only');
  if(widget.classList.contains('music-card')){
   widget.classList.toggle('studio-music-square',compact);
   widget.dataset.musicVariant=compact?'square':'long';
  }
  widget.querySelectorAll('.widget-window-controls .window-light.yellow').forEach(button=>{
   const name=upper?upperLabel[upper]:label(widget);
   const title=upper?(compact?(upperTotal()+1<=UPPER_CAPACITY?name+' minimized · restore to full width':name+' already minimized · row full'):'Minimize '+name+' to square'):(collapsed?'Restore '+name:'Minimize '+name);
   button.title=title;button.setAttribute('aria-label',title);
   button.setAttribute('aria-expanded',String(!collapsed));
   button.setAttribute('aria-pressed',String(collapsed));
  });
 }
 function updateAll(){
  installFixStyles();installSymbolKnockout();applyIdentitySymbols();
  if(isVisitor())return;
  const snapshot=window.BigLWAStudioLayout?.snapshot?.()||{};
  const variants=snapshot.upperVariants||{};
  const legacy=getSaved();
  document.querySelectorAll(widgetSelector).forEach(widget=>{
   const id=key(widget),upper=upperId(widget);
   if(widget.dataset.yellowCollapseOwner!==(uid()||'')){
    delete widget.dataset.yellowCollapseTouched;
    widget.dataset.yellowCollapseOwner=uid()||'';
   }
   if(upper){
    if(upperRemoved(upper,widget)){sync(widget);return}
    if(widget.dataset.yellowCollapseTouched!=='1'){
     const accountValue=variants[upper];
     const selected=accountValue==='square'||accountValue==='long'?
      accountValue:legacy?.has(id)?'square':upperDefaults[upper];
     applyUpperView(upper,widget,selected);
    }
   }else if(legacy&&id&&widget.dataset.yellowCollapseTouched!=='1'&&
     !widget.classList.contains('widget-is-minimized')){
    widget.classList.toggle('studio-header-only',legacy.has(id));
   }
   sync(widget);
  });
  syncUpperRail();syncUpperPanel();
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
  // Red restore keeps the saved size when it fits. It may return as the
  // square minimum, but never displaces another visible widget or adds slot 7.
  const redRestore=event.target.closest('[data-restore-widget],[data-avatar-restore]');
  if(redRestore){
   const id=redRestore.hasAttribute('data-avatar-restore')?'avatar':redRestore.dataset.restoreWidget;
   const widget=upperElement(id);
   if(widget&&upperRemoved(id,widget)){
    const free=UPPER_CAPACITY-upperTotal();
    if(free<1){
     event.preventDefault();event.stopImmediatePropagation();
     announce('This row is full. Minimize or close a widget to restore '+upperLabel[id]+'.');return;
    }
    if(free===1)applyUpperView(id,widget,'square');
    widget.dataset.yellowCollapseTouched='1';
    widget.dataset.yellowCollapseOwner=uid()||'';
    // Let the established red restore handler own visibility and persistence.
    requestAnimationFrame(()=>{syncUpperRail();syncUpperPanel();persist()});
   }
  }
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
   if(widget){
    // Red removes the widget; remember its width without changing size.
    if(upperId(widget))widget.dataset.upperWidgetBeforeRemoval=
      upperView(upperId(widget),widget);
    if(widget.classList.contains('studio-header-only'))
      widget.classList.remove('studio-header-only');
    widget.dataset.yellowCollapseTouched='1';
    sync(widget);syncUpperPanel();
    // The existing red handler still performs the actual remove/save.
   }
  }
 },true);

 let queued=false;
 const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;updateAll()})};
 function start(){
  updateAll();
  const rail=document.querySelector('#studioApp #heroWidgetRail');
  if(rail&&typeof ResizeObserver==='function'){
   let lastWidth=0;
   new ResizeObserver(entries=>{
    const width=entries[0]?.contentRect.width;
    if(width!==lastWidth){lastWidth=width;schedule()}
   }).observe(rail);
  }
  const app=document.querySelector('#studioApp');
  if(app)new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
  else new MutationObserver((observer)=>{const root=document.querySelector('#studioApp');if(!root)return;observer.disconnect();start()}).observe(document.documentElement,{childList:true,subtree:true});
 }
 window.addEventListener('biglwa:studio-collapse-applied',schedule);
 window.addEventListener('biglwa:customization-remote',schedule);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
 else start();
})();