/* BIG LWA · optional, dismissible Studio tutorial.
   The pink manifesto is not part of the movable widget grid. Dismissing it
   frees the masonry slot; it never rearranges or deletes user-made widgets. */
(()=>{
 'use strict';
 if(window.__biglwaStudioOnboarding)return;
 window.__biglwaStudioOnboarding=true;
 const DISMISSED='biglwaStudioTutorialDismissed:v1:';
 const steps=[
  {"title":"Your creative Studio","area":"Studio","body":"Your Studio holds your profile, projects, music and widgets. The left sidebar is your shortcut desk; the header opens full pages."},
  {"title":"Symbol key","area":"Studio icons","visual":"symbols","body":"These are the same symbols used across your Studio. Find the matching icon in the sidebar or shortcut bar."},
  {"title":"The three colored dots","area":"Widget and post controls","visual":"colored-dots-title","body":"Red removes or deletes (read the confirmation and any 30-day countdown). Yellow minimizes a window or archives a post. Green enlarges or opens the full workspace. Their action depends on the card."},
  {"title":"Your workspace","area":"Studio","body":"Drag widget handles to arrange the Studio, use controls to customize it, and view your own public profile as others see it. Layout preferences are attached to your Big LWA account."},
  {"title":"Connect your world","area":"Orbit","key":"orbit","body":"Orbit links external accounts such as Pinterest and Instagram. Imported media goes first to your account-linked private collection for review. If a provider session expires, reconnect only that provider."},
  {"title":"Where do imports go?","area":"Orbit → Archive","key":"archive","body":"Imported photos and Pins are saved in your Archive/import library, NOT posted publicly by connection alone. Select media and explicitly publish to Collective Feed. Archiving or switching Live off hides a published post."},
  {"title":"Collective Feed vs Veve","area":"Veve","key":"veve","body":"Collective Feed contains content users deliberately share. Veve is the wider discovery wall for public photos, Sqwibs, games, and ideas. Importing through Orbit does not automatically publish to Veve."},
  {"title":"Boards and privacy","area":"Boards","key":"boards","body":"Boards gather Pins and collections. Private and locked boards do not automatically publish; choose what to share."},
  {"title":"Journal, Sqwib and Sqwip","area":"Journal","key":"diary","body":"Journal entries are private until their owner turns on sharing. Sqwib sharing/reposting follows the author’s permissions. Sqwip creates screenplay pages to the right."},
  {"title":"Creative tools","area":"Tools","key":"tools","body":"Tools converts files and trims video locally. ArtCraft has browser creative editors when the installed versions are available. Export your result to keep a copy."},
  {"title":"All yours","area":"Studio","body":"The pink tutorial card can be removed with X. Reopen this guide anytime from the Studio sidebar. You control publication, deletion, and public visibility."}
 ];
 // Prefer the user's REAL rendered navigation symbols. Their shortcut bar can
 // be customized, so the guide also searches the Sidebar and Studio widgets.
 // Fallbacks match existing Big LWA assets/glyphs, never generic UI clip art.
 const symbolKey=[
  {label:'Projects',key:'projects',detail:'Your creative work',fallbackAsset:'/assets/projects-symbol.svg?v=20260924-projects-symbol-1'},
  {label:'Arcade',key:'games',detail:'Games and puzzles',fallback:'♟'},
  {label:'Journal',key:'diary',detail:'Entries and writing',fallback:'▱'},
  {label:'Map',key:'map',detail:'Pinned places',fallback:'⌖'},
  {label:'Orbit / Connect',key:'connect',detail:'Linked accounts and people',fallback:'⌘'},
  {label:'Collective Feed',key:'feed',detail:'Published posts',fallbackAsset:'/assets/feed-symbol-generated.png'},
  {label:'Archive',key:'archive',detail:'Your saved media',fallback:'▥'},
  {label:'Boards',key:'boards',detail:'Pins and collections',fallback:'⊞'},
  {label:'Sqwib Note',key:'notes',detail:'Quick notes',fallbackAsset:'/assets/quick-notes-symbol-generated.png'},
  {label:'Calendar',key:'calendar',detail:'Dates and events',fallback:'▦'},
  {label:'Veve',key:'veve',detail:'Discover what’s happening',fallback:'✺'},
  {label:'Library',key:'library',detail:'Books and collections',fallback:'▥'}
 ];
 function findRealSymbol(entry){
  const key=entry.key;
  const candidates=[
   '#studioApp .sidebar-navigation-row[data-sidebar-route-row="'+key+'"] .sidebar-route-icon',
   '#studioApp .sidebar-widget-restore-row[data-shortcut-row="'+key+'"] .sidebar-route-icon',
   '#studioApp .sidebar-navigation-open[data-sidebar-route="'+key+'"] .sidebar-route-icon',
   '#studioApp #'+key+' .card-head .card-icon',
   '#studioApp .hero-action-bar a[data-shortcut-route="'+key+'"]',
   '#studioApp .hero-action-bar a[href="#'+key+'"]',
   '#studioApp .mobile-dock a[href="#'+key+'"]'
  ];
  if(key==='diary')candidates.splice(3,0,'#studioApp #diary .card-icon');
  if(key==='connect')candidates.splice(3,0,'#studioApp #connect .card-icon');
  if(key==='games')candidates.splice(3,0,'#studioApp #games .card-icon');
  if(key==='veve')candidates.splice(3,0,'#studioApp [data-open="veve"] .card-icon');
  for(const selector of candidates){
   const source=$(selector);
   if(!source)continue;
   if(source.matches('a,button')){
    // Shortcut links contain the glyph AND its label. Copy only the symbol.
    const nodes=[...source.childNodes].filter(node=>{
     if(node.nodeType===3)return !!node.textContent.trim();
     if(node.nodeType!==1)return false;
     if(node.matches('span:last-child')&&node.textContent.trim()&&
        !node.querySelector('img,svg'))return false;
     return node.matches('img,svg,span')||!!node.querySelector('img,svg');
    });
    if(nodes.length)return nodes[0].cloneNode(true);
   }else if(source.querySelector('img,svg')){
    // Keep the site's project SVG / custom archive mark intact.
    return source.cloneNode(true);
   }else if(source.textContent?.trim()){
    return source.cloneNode(true);
   }
  }
  return null;
 }
 // Keep the stitched heading's typography intact. Only the three real "o"
 // characters in "colored dots" receive the traffic-light colors.
 // Build DOM nodes rather than inject HTML so screen readers still read a
 // normal heading and every other tutorial title stays unchanged.
 function renderTourTitle(root,step){
  root.replaceChildren();
  if(step.visual!=='colored-dots-title'){
   root.textContent=step.title;
   return;
  }
  const pieces=[
   {text:'The three c'},
   {text:'o',color:'red'},
   {text:'l'},
   {text:'o',color:'yellow'},
   {text:'red d'},
   {text:'o',color:'green'},
   {text:'ts'}
  ];
  for(const item of pieces){
   if(!item.color){
    root.append(document.createTextNode(item.text));
    continue;
   }
   const letter=document.createElement('span');
   letter.className='tour-dot-letter tour-dot-'+item.color;
   letter.textContent=item.text;
   root.append(letter);
  }
 }
 function renderSymbolKey(root){
  root.replaceChildren();
  for(const entry of symbolKey){
   const row=document.createElement('li');row.className='tour-symbol-item';
   const glyph=document.createElement('span');glyph.className='tour-symbol-mark';
   glyph.setAttribute('aria-hidden','true');
   const mark=findRealSymbol(entry);
   if(mark){glyph.append(mark);}
   else if(entry.fallbackAsset){
    const img=document.createElement('img');img.src=entry.fallbackAsset;img.alt='';
    img.loading='lazy';glyph.append(img);
   }else{
    glyph.textContent=entry.fallback||'•';
   }
   const description=document.createElement('span');description.className='tour-symbol-description';
   const name=document.createElement('strong');name.textContent=entry.label;
   const detail=document.createElement('small');detail.textContent=entry.detail;
   description.append(name,detail);row.append(glyph,description);root.append(row);
  }
 }
 let index=0,card=null,dialog=null,currentUid='guest';
 const $=(q,root=document)=>root.querySelector(q);
 const uid=()=>String(window.__biglwaIdentity?.uid||'guest');
 const key=()=>DISMISSED+uid();
 const readDismissed=()=>{
  try{return localStorage.getItem(key())==='1'}catch{return false}
 };
 function style(){
  if($('#biglwaTourStyles'))return;
  const css=document.createElement('style');css.id='biglwaTourStyles';
  css.textContent=`
   #studioApp .manifesto-card.is-tutorial-dismissed{display:none!important}
   #studioApp .manifesto-card{position:relative!important}
   #studioApp .manifesto-card .biglwa-tour-actions{
    position:absolute;right:15px;top:15px;z-index:8;
    display:flex;gap:7px;justify-content:end;align-items:center;max-width:calc(100% - 28px)
   }
   #studioApp .manifesto-card .biglwa-tour-actions button{
    display:inline-flex!important;align-items:center;justify-content:center;
    padding:8px 12px!important;border:1px solid #3d2d2a70!important;
    border-radius:99px!important;background:#fff5e4ed!important;color:#382827!important;
    font:750 11px/1.1 system-ui!important;cursor:pointer!important;min-height:32px!important
   }
   #studioApp .manifesto-card .biglwa-tour-actions{z-index:100!important}
   #studioApp .manifesto-card .biglwa-tour-actions button[data-tour-start]{min-width:136px!important}
   #studioApp .sidebar .biglwa-guide-launcher{
    display:flex!important;align-items:center!important;width:calc(100% - 20px)!important;
    margin:10px!important;padding:10px 12px!important;cursor:pointer!important;text-align:left!important;
    border:1px solid rgba(170,112,123,.45)!important;border-radius:11px!important;
    background:#f8e3e9!important;color:#422735!important;font:800 11px/1.35 system-ui!important;
    position:relative!important;z-index:10!important
   }
   #studioApp .sidebar .biglwa-guide-launcher:focus-visible{outline:3px solid #884652!important;outline-offset:2px}
   #studioApp .manifesto-card .biglwa-tour-actions button[data-tour-dismiss]{
    width:34px!important;min-width:34px!important;padding:7px!important;font-size:17px!important
   }
   #studioApp .manifesto-card .biglwa-tour-actions button:focus-visible{
    outline:3px solid #572f41!important;outline-offset:3px!important
   }
   #biglwaTutorialDialog{width:min(560px,calc(100vw - 26px));max-height:min(88vh,700px);
    border:1px solid #b9938a;border-radius:19px;background:#fff3e8;color:#322424;
    padding:26px 25px;box-shadow:0 22px 70px #21121677;overflow:auto}
   #biglwaTutorialDialog::backdrop{background:#1f1217bb}
   #biglwaTutorialDialog .tutorial-head{display:flex;align-items:start;gap:15px;justify-content:space-between}
   #biglwaTutorialDialog .tutorial-head button{border:1px solid #896d64;background:#fff5ed;border-radius:8px;
    width:34px;height:34px;cursor:pointer;font:700 20px system-ui}
   #biglwaTutorialDialog h2{font:700 clamp(25px,4vw,38px)/1.05 Georgia,serif;margin:12px 0 15px}
   #biglwaTutorialDialog p{font:500 15px/1.65 system-ui;margin:0 0 19px;overflow-wrap:anywhere}
   /* Three window lights in the heading — these spans inherit the heading
      font, weight, baseline and size, changing only the letters' colors. */
   #biglwaTutorialDialog h2 .tour-dot-letter{
    font:inherit;letter-spacing:inherit;line-height:inherit;
    display:inline;color:inherit
   }
   #biglwaTutorialDialog h2 .tour-dot-red{color:#d95762}
   #biglwaTutorialDialog h2 .tour-dot-yellow{color:#e0b92e}
   #biglwaTutorialDialog h2 .tour-dot-green{color:#56ae77}
   #biglwaTutorialDialog .tour-symbol-key:not([hidden]){
    display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;
    list-style:none;padding:0;margin:0 0 21px
   }
   #biglwaTutorialDialog .tour-symbol-key[hidden]{display:none!important}
   #biglwaTutorialDialog .tour-symbol-item{
    display:flex;align-items:center;gap:10px;min-width:0;
    padding:8px 9px;border:1px solid rgba(130,87,82,.28);
    border-radius:12px;background:rgba(255,255,255,.43)
   }
   #biglwaTutorialDialog .tour-symbol-mark{
    width:42px;height:42px;flex:0 0 42px;box-sizing:border-box;overflow:hidden;
    display:grid;place-items:center;border:1px solid rgba(130,87,82,.28);
    border-radius:10px;background:#fae6d8;color:#39272b;font:700 26px/1 Georgia,serif
   }
   #biglwaTutorialDialog .tour-symbol-mark>span,
   #biglwaTutorialDialog .tour-symbol-mark .sidebar-route-icon,
   #biglwaTutorialDialog .tour-symbol-mark .card-icon{
    display:grid;place-items:center;width:100%;height:100%;
    line-height:1!important;margin:0!important;padding:0!important;
    background:transparent!important;border:0!important;box-shadow:none!important;
    transform:none!important
   }
   #biglwaTutorialDialog .tour-symbol-mark .biglwa-archive-horizontal-symbol{transform:rotate(90deg)!important}
   #biglwaTutorialDialog .tour-symbol-mark img,
   #biglwaTutorialDialog .tour-symbol-mark svg{
    display:block;width:28px;max-width:28px;height:28px;max-height:28px;
    object-fit:contain;filter:brightness(0) saturate(100%);margin:auto
   }
   #biglwaTutorialDialog .tour-symbol-description{display:grid;gap:2px;min-width:0}
   #biglwaTutorialDialog .tour-symbol-description strong{font:700 13px/1.25 system-ui}
   #biglwaTutorialDialog .tour-symbol-description small{font:500 11px/1.35 system-ui;color:#765e5a}
      #biglwaTutorialDialog .tour-step{font:800 11px system-ui;letter-spacing:.08em;text-transform:uppercase}
   #biglwaTutorialDialog .tour-controls{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
   #biglwaTutorialDialog .tour-controls button{min-height:38px;padding:10px 13px;
    border-radius:10px;border:1px solid #9d7871;background:#fffaf4;color:#322424;
    font:700 12px system-ui;cursor:pointer}
   #biglwaTutorialDialog .tour-controls [data-tour-next]{background:#462830;color:#fff}
   #biglwaTutorialDialog .tour-controls [data-tour-try]{margin-left:auto}
   #biglwaTutorialDialog button:focus-visible{outline:3px solid #b35d78;outline-offset:3px}
   @media(max-width:480px){
    #biglwaTutorialDialog .tour-symbol-key:not([hidden]){grid-template-columns:1fr}
    #biglwaTutorialDialog .tour-symbol-item{padding:6px 8px}
    #biglwaTutorialDialog .tour-symbol-mark{width:36px;height:36px;flex-basis:36px}
   }
      @media(max-width:480px){#biglwaTutorialDialog{padding:18px}
    #studioApp .manifesto-card .biglwa-tour-actions{top:8px;right:8px}
    #studioApp .manifesto-card .biglwa-tour-actions button{padding:6px 8px!important;font-size:10px!important}}
   @media(prefers-reduced-motion:reduce){#biglwaTutorialDialog *{scroll-behavior:auto!important}}
  `;
  document.head.append(css);
 }
 async function dismiss(){
  currentUid=uid();
  try{localStorage.setItem(key(),'1')}catch{}
  card?.classList.add('is-tutorial-dismissed');
  dialog?.close();
  // Session customization is private and stored under the account. Do not
  // touch the arrangement of any other Studio card.
  try{await window.BigLWAUserDirectory?.saveCustomizations?.({session:{studioTutorialDismissed:true}})}catch{}
 }
 function renderStep(){
  if(!dialog)return;
  const step=steps[index];
  $('#biglwaTourPosition',dialog).textContent='Big LWA tutorial · '+(index+1)+' of '+steps.length+' · '+step.area;
  renderTourTitle($('#biglwaTourTitle',dialog),step);
  const body=$('#biglwaTourBody',dialog);
  body.textContent=step.body;
  body.hidden=step.visual==='symbols';
  const legend=$('#biglwaTourSymbolLegend',dialog);
  legend.hidden=step.visual!=='symbols';
  if(!legend.hidden)renderSymbolKey(legend);
  const back=$('[data-tour-back]',dialog),next=$('[data-tour-next]',dialog),tryIt=$('[data-tour-try]',dialog);
  back.disabled=index===0;next.textContent=index===steps.length-1?'Finish and remove tutorial':'Next →';
  tryIt.hidden=!step.key;tryIt.textContent='Open '+step.area+' ↗';
 }
 function ensureDialog(){
  if(dialog)return dialog;
  dialog=document.createElement('dialog');dialog.id='biglwaTutorialDialog';dialog.setAttribute('aria-labelledby','biglwaTourTitle');
  dialog.innerHTML='<div class="tutorial-head"><span id="biglwaTourPosition" class="tour-step"></span>'+
   '<button type="button" data-tour-close aria-label="Close tutorial">×</button></div>'+
   '<h2 id="biglwaTourTitle"></h2><p id="biglwaTourBody"></p>'+
   '<ul id="biglwaTourSymbolLegend" class="tour-symbol-key" aria-label="Big LWA symbols and their destinations" hidden></ul>'+
   '<div class="tour-controls"><button type="button" data-tour-back>← Back</button>'+
   '<button type="button" data-tour-next>Next →</button>'+
   '<button type="button" data-tour-try hidden>Open section ↗</button></div>';
  dialog.addEventListener('click',event=>{
   if(event.target===dialog||event.target.closest('[data-tour-close]')){dialog.close();return}
   if(event.target.closest('[data-tour-back]')){index=Math.max(0,index-1);renderStep();return}
   if(event.target.closest('[data-tour-next]')){
    if(index===steps.length-1){dismiss();return}
    index++;renderStep();return;
   }
   if(event.target.closest('[data-tour-try]')){
    const route=steps[index].key;
    dialog.close();
    if(route)window.openBIGLWAModule?.(route);
   }
  });
  document.body.append(dialog);return dialog;
 }
 function openTour(){
  style();index=0;ensureDialog();renderStep();
  if(!dialog.open)dialog.showModal();
 }
 function ensureSidebarGuide(){
  const sidebar=$('#studioApp .sidebar');if(!sidebar)return;
  if($('.biglwa-guide-launcher',sidebar))return;
  const button=document.createElement('button');
  button.type='button';button.className='biglwa-guide-launcher';
  button.textContent='ⓘ Site guide · symbols & tools';
  button.setAttribute('aria-label','Open guide to Big LWA symbols, controls, Orbit and publishing');
  button.addEventListener('click',openTour);
  (sidebar.querySelector('.sidebar-top')||sidebar).append(button);
 }
 function attach(){
  style();ensureSidebarGuide();
  const next=$('#studioApp .manifesto-card');
  if(!next)return false;
  card=next;style();currentUid=uid();
  card.classList.toggle('is-tutorial-dismissed',readDismissed());
  if(!$('.biglwa-tour-actions',card)){
   const actions=document.createElement('div');actions.className='biglwa-tour-actions';
   const start=document.createElement('button');start.type='button';start.dataset.tourStart='';
   start.textContent='? Take the site tour';start.setAttribute('aria-label','Start the Big LWA website tutorial');
   const remove=document.createElement('button');remove.type='button';remove.dataset.tourDismiss='';
   remove.textContent='×';remove.title='Remove tutorial card';remove.setAttribute('aria-label','Remove tutorial card from Studio');
   actions.append(start,remove);card.append(actions);
   start.addEventListener('click',openTour);
   remove.addEventListener('click',dismiss);
  }
  if(new URLSearchParams(location.search).get('tutorial')==='1'){
   history.replaceState(history.state,'',location.pathname+location.hash);
   queueMicrotask(openTour);
  }
  return true;
 }
 window.addEventListener('biglwa:identity-updated',()=>{if(card){currentUid=uid();card.classList.toggle('is-tutorial-dismissed',readDismissed())}});
 window.addEventListener('biglwa:customization-remote',event=>{
  if(event.detail?.customization?.session?.studioTutorialDismissed===true){
   try{localStorage.setItem(key(),'1')}catch{}
   card?.classList.add('is-tutorial-dismissed');
  }
 });
 document.addEventListener('biglwa:module-close',attach);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach,{once:true});
 // Reapply the guide when delayed Studio layout restoration replaces its
 // card. Keep the sidebar launcher available after dismissing the card.
 window.BigLWASiteGuide={open:openTour};
 let pending=false;
 const observer=new MutationObserver(()=>{
  if(card?.isConnected && $('.biglwa-tour-actions',card) &&
     $('#studioApp .sidebar .biglwa-guide-launcher'))return;
  if(pending)return;
  pending=true;
  requestAnimationFrame(()=>{pending=false;attach()});
 });
 observer.observe(document.documentElement,{subtree:true,childList:true});
 attach();
})();
