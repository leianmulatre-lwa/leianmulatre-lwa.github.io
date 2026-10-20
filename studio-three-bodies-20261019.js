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
   '#studioApp .biglwa-body-guide{display:flex;align-items:center;justify-content:space-between;gap:6px;flex-wrap:wrap;margin:3px 0 6px;padding:5px 8px;border:1px solid rgba(128,105,129,.15);border-radius:12px;background:var(--widget-bg,#fffaf5);color:var(--widget-ink,#382f36)}',
   '#studioApp .biglwa-body-guide-label{display:grid;gap:3px}',
   '#studioApp .biglwa-body-guide-label strong{font:800 11px/1.15 Georgia,serif;letter-spacing:.02em}',
   '#studioApp .biglwa-body-guide-label small{font:550 9px/1.2 system-ui;opacity:.76}',
   '#studioApp .biglwa-body-keys{display:flex;align-items:center;flex-wrap:wrap;gap:4px}',
   '#studioApp .biglwa-body-keys button{display:inline-flex;gap:6px;align-items:center;justify-content:center;border:1px solid #a78b9b;border-radius:7px;min-height:28px;padding:4px 7px;background:var(--body-key-color,#f4e7f2);color:#34282e;font:700 10px/1.1 system-ui;cursor:pointer;box-shadow:none}',
   '#studioApp .biglwa-body-keys button[aria-pressed="true"]{border-color:#755767;box-shadow:inset 0 0 0 1px #775668}',
   '#studioApp .biglwa-body-keys button:focus-visible{outline:2px solid #805a83;outline-offset:2px}',
   '#studioApp .masonry>.card[data-body-model],#studioApp .hero-widget-rail .customizable-widget[data-body-model]{border-bottom:3px solid var(--three-body-color,#dfd4e7)!important}',
   '#studioApp .masonry>.card[data-body-model]:not(.widget-is-expanded),#studioApp .hero-widget-rail .customizable-widget[data-body-model]{box-shadow:4px 5px 0 color-mix(in srgb,var(--three-body-color,#dfd4e7) 90%,#ffffff 10%),0 12px 24px rgba(43,27,37,.09)!important;transition:box-shadow .2s ease,transform .2s ease}',
   '#studioApp .masonry>.card[data-body-model]:not(.widget-is-expanded):hover,#studioApp .hero-widget-rail .customizable-widget[data-body-model]:hover{box-shadow:6px 8px 0 var(--three-body-color,#dfd4e7),0 16px 30px rgba(43,27,37,.13)!important}',
   '#studioApp .masonry{margin-top:5px!important}',
   '#studioApp [data-body-model="individual"]{--three-body-color:#d9c6ee!important}',
   '#studioApp [data-body-model="social"]{--three-body-color:#f7cddd!important}',
   '#studioApp [data-body-model="political"]{--three-body-color:#f8d4b0!important}',
   '#studioApp .masonry>.card .biglwa-body-tag{position:relative;display:inline-flex;align-items:center;margin:4px 7px 2px 0;padding:3px 7px;border-radius:6px;background:var(--three-body-color,#eee);color:#433a40;font:650 9px/1.25 system-ui;letter-spacing:.02em}',
   '#studioApp[data-body-focus]:not([data-body-focus="all"]) .masonry>.card[data-body-model]:not([data-body-model-focus="true"]){opacity:.4;filter:saturate(.64)}',
   '#studioApp .masonry>.card[data-body-model-focus="true"]{opacity:1!important;filter:none!important}',
   '@media(max-width:600px){#studioApp .biglwa-body-guide{padding:8px}#studioApp .biglwa-body-keys{width:100%}}',
   '@media(prefers-reduced-motion:reduce){#studioApp [data-body-model]{transition:none!important}}'
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
  const title=document.createElement('strong');title.textContent='Three bodies · Studio';
  const subtitle=document.createElement('small');subtitle.textContent='Individual / Social / Political · your saved widget order stays yours';
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