/* Three-body Studio navigation. Does not move cards or touch account layout data. */
(()=>{
 'use strict';
 if(window.BigLWAThreeBodies)return;
 const models={
  individual:{label:'Individual',color:'#d9c6ee',about:'Expression · identity · creative practice'},
  social:{label:'Social',color:'#f7cddd',about:'People · exchange · community'},
  political:{label:'Political',color:'#f8d4b0',about:'Civic life · culture · collective action'}
 };
 const assignments={
  diary:'individual',notes:'individual',projects:'individual',camera:'individual',music:'individual',
  aura:'individual',avatar:'individual',closet:'individual',library:'individual',tools:'individual',
  calendar:'individual',archive:'individual',trophies:'individual',
  orbit:'social',connect:'social',feed:'social',veve:'social',stream:'social',rooms:'social',
  room:'social',boards:'social','guest-check':'social',games:'social',
  politc:'political',politic:'political',map:'political',learn:'political',didyouknow:'political'
 };
 const $=(s,r=document)=>r.querySelector(s);
 const $$=(s,r=document)=>[...r.querySelectorAll(s)];
 let focus='all',pending=false;
 function style(){
  if($('#biglwaThreeBodiesCSS'))return;
  const node=document.createElement('style');node.id='biglwaThreeBodiesCSS';
  node.textContent=[
   // The hero used to leave 40px beneath the shortcut cards; reclaim that dead space.
   '#studioApp .hero{padding-bottom:5px!important;row-gap:12px!important;margin-bottom:0!important}',
   '#studioApp .hero .mobile-dock.hero-action-bar{margin-top:0!important;margin-bottom:0!important}',
   // A compact, intrinsic-size selector, not another full-width Studio section.
   '#studioApp .biglwa-body-guide{box-sizing:border-box!important;display:inline-flex!important;align-items:center!important;justify-content:flex-start!important;align-self:flex-start!important;justify-self:start!important;width:max-content!important;max-width:calc(100% - 16px)!important;min-height:0!important;gap:9px!important;flex-wrap:wrap;margin:0 0 8px 8px!important;padding:5px 7px!important;border:1px solid rgba(128,105,129,.18);border-radius:9px!important;background:var(--widget-bg,#fffaf5);color:var(--widget-ink,#382f36)}',
   '#studioApp .biglwa-body-guide-label{display:flex!important;align-items:center!important;gap:6px!important;white-space:nowrap}',
   '#studioApp .biglwa-body-guide-label strong{font:800 10px/1.15 Georgia,serif;letter-spacing:.02em}',
   '#studioApp .biglwa-body-guide-label small{font:550 9px/1.15 system-ui;opacity:.76}',
   '#studioApp .biglwa-body-keys{display:inline-flex!important;align-items:center!important;flex-wrap:wrap;gap:4px!important;width:auto!important;margin:0!important}',
   '#studioApp .biglwa-body-keys button{box-sizing:border-box!important;position:relative!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;flex:0 0 auto!important;height:25px!important;min-height:25px!important;min-width:0!important;gap:4px!important;padding:3px 8px!important;border:1px solid #a78b9b!important;border-radius:6px!important;background:var(--body-key-color,#f4e7f2)!important;color:#34282e!important;font:700 10px/1.1 system-ui!important;cursor:pointer!important;transform:none!important;outline:0;box-shadow:none!important;vertical-align:middle!important}',
   '#studioApp .biglwa-body-keys button:is(:hover,:focus-visible,[aria-pressed="true"]){box-shadow:inset 0 0 0 2px rgba(75,48,66,.38)!important;transform:none!important;outline-offset:0!important}',
   '#studioApp .biglwa-body-keys button:focus-visible{outline:2px solid #805a83!important;outline-offset:2px!important}',
   // Rings follow the card outline evenly on all four sides; no offset drop shadow.
   '#studioApp .masonry>.card[data-body-model]:not(.widget-is-expanded),#studioApp .hero-widget-rail .customizable-widget[data-body-model]:not(.widget-is-expanded){box-shadow:0 0 0 3px var(--three-body-color,#dfd4e7)!important;transition:box-shadow .18s ease,outline-color .18s ease!important}',
   '#studioApp .masonry>.card[data-body-model]:not(.widget-is-expanded):is(:hover,:focus-within),#studioApp .hero-widget-rail .customizable-widget[data-body-model]:not(.widget-is-expanded):is(:hover,:focus-within){box-shadow:0 0 0 5px var(--three-body-color,#dfd4e7)!important}',
   '#studioApp .masonry{margin-top:0!important;padding-top:0!important}',
   '#studioApp [data-body-model="individual"]{--three-body-color:#d9c6ee!important}',
   '#studioApp [data-body-model="social"]{--three-body-color:#f7cddd!important}',
   '#studioApp [data-body-model="political"]{--three-body-color:#f8d4b0!important}',
   '#studioApp .masonry>.card .biglwa-body-tag{position:relative;display:inline-flex;align-items:center;margin:4px 7px 2px 0;padding:3px 7px;border-radius:6px;background:var(--three-body-color,#eee);color:#433a40;font:650 9px/1.25 system-ui;letter-spacing:.02em}',
   '#studioApp[data-body-focus]:not([data-body-focus="all"]) .masonry>.card[data-body-model]:not([data-body-model-focus="true"]){opacity:.4;filter:saturate(.64)}',
   '#studioApp .masonry>.card[data-body-model-focus="true"]{opacity:1!important;filter:none!important}',
   '@media(max-width:600px){#studioApp .biglwa-body-guide{max-width:calc(100% - 12px)!important;gap:5px!important;margin-left:4px!important}#studioApp .biglwa-body-guide-label small{display:none}#studioApp .hero{padding-bottom:6px!important}}',
   '@media(prefers-reduced-motion:reduce){#studioApp [data-body-model]{transition:none!important}}'
   // Consistent spacing and hover-only category rings (the final overrides).
   '#studioApp .hero-widget-rail>#biglwaAuraAvatarPair{gap:14px!important}',
   '#studioApp:not(.profile-editor-wallpaper) .hero:has(#biglwaAuraAvatarPair)>.hero-widget-rail>#biglwaAuraAvatarPair{gap:14px!important}',
   '#studioApp .hero{padding-bottom:0!important;margin-bottom:-5px!important}',
   '#studioApp .mobile-dock.hero-action-bar{margin-bottom:0!important}',
   '#studioApp .biglwa-body-guide{margin:-3px 0 3px 4px!important;padding:4px 6px!important;gap:6px!important}',
   '#studioApp .masonry{margin-top:0!important;padding-top:0!important}',
   '#studioApp .masonry>.card[data-body-model]:not(.widget-is-expanded),#studioApp .hero-widget-rail .customizable-widget[data-body-model]:not(.widget-is-expanded){box-shadow:0 4px 12px rgba(44,31,34,.08)!important}',
   '#studioApp .masonry>.card[data-body-model]:not(.widget-is-expanded):is(:hover,:focus-within),#studioApp .hero-widget-rail .customizable-widget[data-body-model]:not(.widget-is-expanded):is(:hover,:focus-within){box-shadow:0 0 0 3px var(--three-body-color,#dfd4e7),0 6px 16px rgba(44,31,34,.1)!important}',
   '#studioApp .biglwa-body-keys button:not(:hover):not(:focus-visible){box-shadow:none!important}',
   '#studioApp .biglwa-body-keys button:is(:hover,:focus-visible){box-shadow:0 0 0 2px var(--body-key-color,#e4cbe9)!important;transform:none!important}',
   '#studioApp .music-card #profileMusicOpen{top:5px!important;left:auto!important;right:75px!important;max-width:94px!important;min-height:21px!important;padding:2px 6px!important;font:800 9px/1.1 system-ui!important;white-space:nowrap!important}',
   '#studioApp.profile-editor-wallpaper .hero:has(#biglwaAuraAvatarPair){grid-template-columns:minmax(0,1fr)!important;grid-template-rows:auto auto auto!important}',
   '#studioApp.profile-editor-wallpaper .hero:has(#biglwaAuraAvatarPair)>.profile-card{grid-column:1/-1!important;grid-row:1!important;width:100%!important;max-width:100%!important;min-width:0!important;position:relative!important;margin:0!important}',
   '#studioApp.profile-editor-wallpaper .hero:has(#biglwaAuraAvatarPair)>.hero-widget-rail{grid-column:1/-1!important;grid-row:2!important;width:100%!important;margin-top:12px!important}',
   '#studioApp.profile-editor-wallpaper .hero:has(#biglwaAuraAvatarPair)>.hero-action-bar{grid-column:1/-1!important;grid-row:3!important;margin-top:8px!important}',
   '#studioApp .profile-editor-tabs{display:flex!important;align-items:center!important;gap:7px!important;flex-wrap:wrap!important;padding:8px 0!important}',
   '#studioApp .profile-editor-tabs button{opacity:1!important;visibility:visible!important;min-height:32px!important;border:1px solid #826770!important;border-radius:8px!important;background:#f8edf0!important;color:#503744!important;font:800 11px/1.25 system-ui!important;padding:6px 12px!important;box-shadow:0 2px 5px rgba(40,24,32,.12)!important}',
   '#studioApp .profile-editor-tabs button[aria-selected="true"]{background:#d95b70!important;color:#fff!important;border-color:#b33c55!important;box-shadow:0 0 0 2px rgba(217,91,112,.18)!important}',
   '#studioApp .profile-editor-actions .profile-editor-save{background:#d95b70!important;color:#fff!important}',
   '#studioApp #profileMediaEditor .biglwa-media-aura-color{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:8px 0!important;max-width:330px;padding:9px 12px;border:1px solid rgba(101,75,78,.24);border-radius:10px;background:rgba(255,255,255,.2);font:750 12px system-ui}',
   '#studioApp #profileMediaEditor .biglwa-media-aura-color input{width:44px;min-width:44px;height:34px;border:0;background:transparent;cursor:pointer}'
  ].join('\n');
  document.head.append(node);
 }
 function modelOf(card){
  const key=String(card.dataset.widgetRoute||card.id||card.dataset.widgetId||'').toLowerCase();
  return assignments[key]||'individual';
 }
 function applyFocus(app){
  if(!app)return;app.dataset.bodyFocus=focus;
  $$('.masonry>.card[data-body-model]',app).forEach(card=>{
   const selected=focus==='all'||card.dataset.bodyModel===focus;
   if(card.dataset.bodyModelFocus!==String(selected))card.dataset.bodyModelFocus=String(selected);
  });
  $$('#biglwaBodyFilters button[data-body-filter]').forEach(button=>{
   const selected=button.dataset.bodyFilter===focus;
   if(button.getAttribute('aria-pressed')!==String(selected))button.setAttribute('aria-pressed',String(selected));
  });
 }
 function ensureGuide(masonry){
  let guide=$('#biglwaBodyGuide');
  if(guide&&guide.nextElementSibling===masonry)return guide;
  if(guide)guide.remove();
  guide=document.createElement('section');guide.className='biglwa-body-guide';guide.id='biglwaBodyGuide';
  guide.setAttribute('aria-label','Three-body widget organization');
  const head=document.createElement('div');head.className='biglwa-body-guide-label';
  const title=document.createElement('strong');title.textContent='Three bodies';
  const subtitle=document.createElement('small');subtitle.textContent='Sort widgets by body';
  head.append(title,subtitle);
  const nav=document.createElement('nav');nav.className='biglwa-body-keys';nav.id='biglwaBodyFilters';
  nav.setAttribute('aria-label','Focus by body model');
  for(const [key,entry]of [['all',{label:'All',color:'#e7e2e7'}],...Object.entries(models)]){
   const button=document.createElement('button');button.type='button';button.dataset.bodyFilter=key;
   button.style.setProperty('--body-key-color',entry.color);
   button.textContent=entry.label;button.title=entry.about||'Show all widgets';
   button.setAttribute('aria-pressed',String(focus===key));nav.append(button);
  }
  nav.addEventListener('click',event=>{
   const button=event.target.closest('button[data-body-filter]');if(!button)return;
   focus=button.dataset.bodyFilter;applyFocus($('#studioApp'));
  });
  guide.append(head,nav);masonry.parentNode.insertBefore(guide,masonry);return guide;
 }
 function refresh(){
  style();
  const app=$('#studioApp'),masonry=app?.querySelector('.masonry');if(!masonry)return;
  ensureGuide(masonry);
  for(const card of [...masonry.children]){
   if(!card.classList.contains('card'))continue;
   const model=modelOf(card);
   if(card.dataset.bodyModel!==model)card.dataset.bodyModel=model;
   let badge=card.querySelector(':scope > .biglwa-body-tag');
   if(!badge){
    badge=document.createElement('span');badge.className='biglwa-body-tag';
    badge.setAttribute('aria-hidden','true');
    const header=card.querySelector(':scope > .card-head');
    if(header)header.insertAdjacentElement('afterend',badge);else card.prepend(badge);
   }
   const label=models[model].label+' body';if(badge.textContent!==label)badge.textContent=label;
  }
  $$('#studioApp .hero-widget-rail .customizable-widget').forEach(card=>{
   const model=modelOf(card);if(card.dataset.bodyModel!==model)card.dataset.bodyModel=model;
  });
  applyFocus(app);
 }
 function schedule(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;refresh()});}
 window.BigLWAThreeBodies=Object.freeze({models,assignments,refresh,focusModel:model=>{
  if(model==='all'||models[model])focus=model;refresh();
 }});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});else refresh();
 new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true});
 document.addEventListener('biglwa:module-close',schedule);
 window.addEventListener('biglwa:identity-updated',()=>{focus='all';schedule()});
})();