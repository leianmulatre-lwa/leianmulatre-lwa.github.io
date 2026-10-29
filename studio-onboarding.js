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
  {"title":"Meet L’wazi","area":"Your agent","body":"L’wazi introduces your Studio and starts your Veve with the interests you chose. You stay in control: edit interests and sensitivity anytime in Settings. Optional identity and heritage answers stay private and are never used to infer your interests."},
  {"title":"Skeleton Key","area":"Studio icons","visual":"symbols","body":"These are the same symbols used across your Studio. Find the matching icon in the sidebar or shortcut bar."},
  {"title":"The three colored dots","area":"Widget and post controls","visual":"colored-dots-title","body":"Red removes or deletes (read the confirmation and any 30-day countdown). Yellow minimizes a window or archives a post. Green enlarges or opens the full workspace. Their action depends on the card."},
  {"title":"Your workspace","area":"Studio","body":"Drag widget handles to arrange the Studio, use controls to customize it, and view your own public profile as others see it. Layout preferences are attached to your Big LWA account."},
  {"title":"Connect your world","area":"Orbit","key":"orbit","body":"Orbit links external accounts such as Pinterest and Instagram. Imported media goes first to your account-linked private collection for review. If a provider session expires, reconnect only that provider."},
  {"title":"Where do imports go?","area":"Orbit → Archive","key":"archive","body":"Imported photos and Pins are saved in your Archive/import library, NOT posted publicly by connection alone. Select media and explicitly publish to Collective Feed. Archiving or switching Live off hides a published post."},
  {"title":"myfeed vs Veve","area":"Veve","key":"veve","body":"MyFeed is your public publishing page; Veve is the discovery wall for published photos, Sqwibs, games and ideas. Your chosen interests help order eligible public posts in Veve. Only public content is considered, and you can edit your preferences in Settings. Orbit imports never publish automatically."},
  {"title":"Boards and privacy","area":"Boards","key":"boards","body":"Boards gather Pins and collections. Private and locked boards do not automatically publish; choose what to share."},
  {"title":"Journal, Sqwib and Sqwip","area":"Journal","key":"diary","body":"Journal entries are private until their owner turns on sharing. Sqwib sharing/reposting follows the author’s permissions. Sqwip creates screenplay pages to the right."},
  {"title":"Creative tools","area":"Tools","key":"tools","body":"Tools converts files and trims video locally. ArtCraft has browser creative editors when the installed versions are available. Export your result to keep a copy."},
  {"title":"All yours","area":"Studio","body":"The pink tutorial card can be removed with X. Reopen this guide anytime from the Studio sidebar. You control publication, deletion, and public visibility."}
 ];
 // Prefer the user's REAL rendered navigation symbols. Their shortcut bar can
 // be customized, so the guide also searches the Sidebar and Studio widgets.
 // Fallbacks match existing Big LWA assets/glyphs, never generic UI clip art.
 const symbolKey=[
  {label:'Studio',key:'studio',detail:'Return to your Studio home',fallbackAsset:'/assets/studio-tipi-symbol.svg?v=20261026-1'},
  {label:'Projects',key:'projects',detail:'Your creative work',fallbackAsset:'/assets/projects-symbol.svg?v=20260924-projects-symbol-1'},
  {label:'Politic',key:'politc',detail:'Civic life and global context',fallbackAsset:'/assets/politc-nyame-baatanpa.svg?v=20261014-1'},
  {label:'Arcade',key:'games',detail:'Games and puzzles',fallback:'♟'},
  {label:'Journal',key:'diary',detail:'Entries and writing',fallback:'▱'},
  {label:'Map',key:'map',detail:'Pinned places',fallback:'⌖'},
  {label:'Orbit',key:'orbit',detail:'Your connected account planets',fallback:'◎'},
  {label:'Connect',key:'connect',detail:'Find and connect with people',fallback:'✣'},
  {label:'myfeed',key:'feed',detail:'Your public posts',fallbackAsset:'/assets/feed-symbol-generated.png'},
  {label:'Archive',key:'archive',detail:'Your saved media',fallback:'▤'},
  {label:'Boards',key:'boards',detail:'Pins and collections',fallback:'⊞'},
  {label:'Sqwidz',key:'notes',detail:'Quick notes',fallbackAsset:'/assets/quick-notes-symbol-generated.png'},
  {label:'Calendar',key:'calendar',detail:'Dates and events',fallback:'▦'},
  {label:'Veve',key:'veve',detail:'Discover what’s happening',fallback:'✺'},
  {label:'Library',key:'library',detail:'Books and collections',fallback:'▥'}
 ];
 function findRealSymbol(entry){
  const key=entry.key;
  // Studio has one canonical mark, independent of whichever shortcut icon a
  // theme or old saved layout happens to put in the rail.
  if(key==='studio'||key==='home'){
   const img=document.createElement('img');
   img.src='/assets/studio-tipi-symbol.svg?v=20261026-1';img.alt='';
   return img;
  }
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
  if(!document.getElementById('biglwaDialogSystemCss')){const shared=document.createElement('link');shared.id='biglwaDialogSystemCss';shared.rel='stylesheet';shared.href='/assets/biglwa-dialog.css?v=20261025-shared-popups-1';document.head.append(shared)}
  const css=document.createElement('style');css.id='biglwaTourStyles';
  css.textContent=`
   #studioApp .manifesto-card.is-tutorial-dismissed{display:none!important}
   #studioApp #biglwaSkeletonKeysToggle{display:inline-grid!important;place-items:center!important;flex:0 0 auto!important;width:auto!important;min-width:0!important;max-width:100%!important;white-space:nowrap;font:750 12px/1.2 system-ui!important;height:32px!important;min-height:32px!important;box-sizing:border-box;margin:0!important;padding:7px 11px!important;border:1px solid #6c2741!important;border-radius:8px!important;background:#68233e!important;color:#fff6ec!important;cursor:pointer!important;box-shadow:0 2px 4px rgba(67,25,42,.18)!important}
   #studioApp #biglwaSkeletonKeysToggle img{display:block;width:18px;height:26px;object-fit:contain;filter:invert(1)}
   #studioApp .top-actions{display:flex!important;align-items:center!important;justify-content:flex-end!important;min-width:0!important;gap:8px!important}
   #studioApp .biglwa-body-guide #biglwaSkeletonKeysToggle{order:-1;align-self:center!important}
   #studioApp .top-actions .mini-avatar{flex-shrink:0!important}
   #studioApp .biglwa-skeleton-title{display:flex;align-items:center;gap:10px;min-width:0}
   #studioApp .biglwa-skeleton-title img{width:23px;height:36px;flex:0 0 23px;display:block;object-fit:contain}
   #studioApp .biglwa-skeleton-hub .skeleton-rainbow-heading{font:800 11px/1.3 system-ui;letter-spacing:.065em;text-transform:lowercase;margin:5px 0 0}
   #studioApp #biglwaSkeletonKeysToggle:hover,#studioApp #biglwaSkeletonKeysToggle:focus-visible{background:#4e142e!important;outline:2px solid #a65c7f!important;outline-offset:2px}
   #studioApp .manifesto-card.is-skeleton-open{display:block!important;min-height:230px;max-height:none!important;overflow:visible!important}
   #studioApp .manifesto-card.is-skeleton-open>:not(.biglwa-tour-actions):not(.biglwa-skeleton-hub){display:none!important}
   #studioApp .manifesto-card .biglwa-skeleton-hub[hidden]{display:none!important}
   #studioApp .manifesto-card .biglwa-skeleton-hub{display:grid;gap:11px;margin:0;padding:16px 12px 8px;color:#4a3344}
   #studioApp .biglwa-skeleton-hub h2{font:400 27px/1.1 "CS Bergamot Stitched",Georgia,serif;margin:0}
   #studioApp .biglwa-skeleton-hub .skeleton-subtitle{font:650 11px/1.35 Georgia,serif;color:#7a5369;letter-spacing:.02em;margin:0}
   #studioApp .biglwa-skeleton-hub h3{font:800 12px/1.3 system-ui;letter-spacing:.07em;text-transform:uppercase;margin:5px 0 0}
   #studioApp .biglwa-skeleton-squares{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
   #studioApp .biglwa-skeleton-squares button{display:flex;align-items:center;gap:7px;min-width:0;min-height:57px;text-align:left;cursor:pointer;padding:8px;border:1px solid #c8a5b4;border-radius:9px;background:#fff3f5;color:#533549;font:750 11px/1.3 system-ui;box-shadow:2px 3px 0 rgba(67,36,54,.13)}
   #studioApp .biglwa-skeleton-squares button:hover,#studioApp .biglwa-skeleton-squares button:focus-visible{transform:translateY(-1px);outline:2px solid #9a6485;outline-offset:1px}
   #studioApp .biglwa-skeleton-squares img{width:27px;height:27px;object-fit:contain;flex-shrink:0}
   #studioApp .biglwa-skeleton-squares .skeleton-tile-glyph{display:grid;place-items:center;flex:0 0 27px;width:27px;height:27px;font:800 22px Georgia,serif}
   #studioApp .biglwa-skeleton-hub .tour-symbol-key{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px;list-style:none;padding:7px;margin:0;max-height:235px;overflow:auto;background:rgba(255,255,255,.65);border:1px solid #d9b9c6;border-radius:9px}
   #studioApp .biglwa-skeleton-hub .tour-symbol-item{display:flex;gap:6px;align-items:center;min-width:0;list-style:none}
   #studioApp .biglwa-skeleton-hub .tour-symbol-mark{display:grid;place-items:center;flex:0 0 30px;width:30px;height:30px;overflow:hidden}
   #studioApp .biglwa-skeleton-hub .tour-symbol-mark img,#studioApp .biglwa-skeleton-hub .tour-symbol-mark svg{max-width:28px;max-height:28px;object-fit:contain}
   #studioApp .biglwa-skeleton-hub .tour-symbol-description{display:grid;min-width:0;font:650 10px/1.2 system-ui}
   #studioApp .biglwa-skeleton-hub .tour-symbol-description small{font:450 9px/1.25 system-ui;color:#806776}
   #studioApp .biglwa-skeleton-hub .skeleton-key-note{font:500 10px/1.35 Georgia,serif;color:#80667c;margin:0}
   #studioApp .biglwa-skeleton-hub .skeleton-platform-key{min-width:0}
   #studioApp .biglwa-skeleton-hub .skeleton-platform-key>summary{cursor:pointer;min-height:29px;display:flex;align-items:center}
   #studioApp .biglwa-skeleton-hub .skeleton-platform-key summary:focus-visible{outline:2px solid #96576e;outline-offset:2px}


   @media(max-width:680px){#studioApp .biglwa-skeleton-hub .tour-symbol-key{grid-template-columns:1fr}}

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
   #studioApp .manifesto-card.is-skeleton-open{display:flex!important;flex-direction:column;box-sizing:border-box}
   #studioApp .manifesto-card.is-skeleton-open .biglwa-tour-actions{position:static!important;order:-1;align-self:flex-end;max-width:100%;flex-wrap:wrap;margin:0 0 12px!important}
   #studioApp .manifesto-card.is-skeleton-open .biglwa-skeleton-hub{padding:0;min-width:0}
   #studioApp .biglwa-skeleton-hub .tour-symbol-key[hidden]{display:none!important}
   #studioApp .biglwa-skeleton-squares button{display:grid;grid-template-columns:30px minmax(0,1fr);gap:10px;padding:10px;min-height:64px}
   #studioApp .biglwa-skeleton-squares .skeleton-icon-box{display:grid;place-items:center;width:30px;height:30px;aspect-ratio:1;border:0;background:none;overflow:hidden}
   #studioApp .biglwa-skeleton-squares .skeleton-icon-box>img{width:26px;height:26px;object-fit:contain}
   #studioApp .skeleton-tile-label{min-width:0;line-height:1.35;overflow-wrap:break-word}
   #studioApp .biglwa-skeleton-title{display:grid;grid-template-columns:36px minmax(0,1fr);gap:10px;align-items:center}
   #studioApp .biglwa-skeleton-title img{width:36px;height:36px;object-fit:contain}
   @media(prefers-reduced-motion:reduce){#biglwaTutorialDialog *{scroll-behavior:auto!important}}

   /* Veve is paired with Skeleton Key at the fixed top of the tools rail. */
   #studioApp .sidebar-top>.skeleton-quick-actions{
    position:sticky!important;top:0!important;z-index:7!important;
    display:flex!important;flex-direction:row!important;align-items:center!important;
    justify-content:center!important;gap:8px!important;min-height:39px!important;
    width:100%!important;box-sizing:border-box!important;flex:0 0 auto!important;
    padding:3px 2px!important;margin:0 0 5px!important;
    background:var(--skeleton-rail-surface,#f7ede8)!important
   }
   #studioApp .skeleton-quick-actions #skeletonKeyLauncher,
   #studioApp .skeleton-quick-actions #skeletonVeveLauncher{
    display:grid!important;place-items:center!important;flex:0 0 33px!important;
    width:33px!important;height:33px!important;min-height:33px!important;
    margin:0!important;padding:5px!important;border-radius:8px!important;
    border:1px solid transparent!important;background:transparent!important;
    color:#312b32!important;cursor:pointer!important;box-shadow:none!important
   }
   #studioApp .skeleton-quick-actions #skeletonKeyLauncher img{
    display:block!important;width:20px!important;height:23px!important;
    object-fit:contain!important;filter:brightness(0) saturate(100%)!important
   }
   #studioApp .skeleton-quick-actions #skeletonVeveLauncher .skeleton-veve-mark{
    display:block;font:700 25px/1 Georgia,serif!important;color:inherit!important
   }
   #studioApp .skeleton-quick-actions button:hover,
   #studioApp .skeleton-quick-actions button:focus-visible{
    background:rgba(130,70,99,.14)!important;border-color:currentColor!important;
    outline:2px solid #a86d88!important;outline-offset:1px
   }
   body.sidebar-collapsed #studioApp .sidebar-top>.skeleton-quick-actions{
    flex-direction:column!important;gap:6px!important;
    min-height:78px!important;padding:4px 0!important
   }
   body.sidebar-collapsed #studioApp .sidebar-top>#sidebarCollapse{top:91px!important}
   #studioApp .biglwa-skeleton-hub .skeleton-hint-setting{
    display:flex;align-items:center;gap:9px;padding:9px 10px;margin:0;
    border:1px solid #c9a9b6;border-radius:9px;
    background:#fff4f5;color:#4d3442;font:650 11px/1.4 system-ui
   }
   #studioApp .biglwa-skeleton-hub .skeleton-hint-setting input{accent-color:#88415c;width:15px;height:15px;flex-shrink:0}
   body:not(.night-mode) #studioApp{--skeleton-rail-surface:#f7ede8}
   body:not(.night-mode) #studioApp #biglwaSkeletonHub,
   body:not(.night-mode) #studioApp #biglwaSkeletonHub :is(h2,h3,summary,label,strong,a){color:#392d37!important}
   body:not(.night-mode) #studioApp #biglwaSkeletonHub :is(p,small,figcaption){color:#66545f!important}
   body.night-mode #studioApp{--skeleton-rail-surface:#25212a}
   body.night-mode #studioApp .skeleton-quick-actions :is(#skeletonKeyLauncher,#skeletonVeveLauncher){color:#fff2ec!important}
   body.night-mode #studioApp .skeleton-quick-actions #skeletonKeyLauncher img{filter:brightness(0) invert(1)!important}
   body.night-mode #studioApp #biglwaSkeletonHub{color:#f8f0f3!important}
   body.night-mode #studioApp #biglwaSkeletonHub :is(h2,h3,summary,label,strong,a){color:#fff3ee!important}
   body.night-mode #studioApp #biglwaSkeletonHub :is(p,small,figcaption){color:#dfcfd9!important}
   body.night-mode #studioApp #biglwaSkeletonHub :is(.tour-symbol-key,.skeleton-hint-setting,.biglwa-skeleton-squares button,.skeleton-model-widget){
    background:#342c38!important;color:#fff2ec!important;border-color:#80677c!important
   }
   body.night-mode #studioApp #biglwaSkeletonHub :is(.tour-symbol-mark,svg,.skeleton-tile-glyph){color:#fff2ec!important}
   body.night-mode #studioApp #biglwaSkeletonHub .tour-symbol-mark img{filter:brightness(0) invert(1)!important}
   body.night-mode #studioApp #biglwaSkeletonHub .skeleton-hint-setting{color:#fff2ec!important}

   /* Key and Veve: subtle mint, not the old red/pink primary control styling. */
   #studioApp .skeleton-quick-actions :is(#skeletonKeyLauncher,#skeletonVeveLauncher){
    background:rgba(70,156,101,.12)!important;
    border:1px solid rgba(46,113,70,.25)!important;
    color:#2a6b46!important;
   }
   #studioApp .skeleton-quick-actions #skeletonKeyLauncher img{
    filter:brightness(0) saturate(100%) invert(32%) sepia(16%) saturate(1542%) hue-rotate(90deg) brightness(90%)!important;
   }
   #studioApp .skeleton-quick-actions :is(#skeletonKeyLauncher,#skeletonVeveLauncher):is(:hover,:focus-visible){
    background:rgba(70,156,101,.24)!important;
    border-color:#3b8c5a!important;
    outline:2px solid #569c70!important;outline-offset:1px;
   }
   body.night-mode #studioApp .skeleton-quick-actions :is(#skeletonKeyLauncher,#skeletonVeveLauncher){
    background:rgba(97,184,129,.17)!important;
    border-color:rgba(162,225,186,.40)!important;
    color:#c4f2d2!important;
   }
   body.night-mode #studioApp .skeleton-quick-actions #skeletonKeyLauncher img{
    filter:brightness(0) saturate(100%) invert(83%) sepia(29%) saturate(297%) hue-rotate(84deg) brightness(103%)!important;
   }
   body.night-mode #studioApp .skeleton-quick-actions :is(#skeletonKeyLauncher,#skeletonVeveLauncher):is(:hover,:focus-visible){
    background:rgba(97,184,129,.30)!important;outline-color:#a4d8b6!important;
   }
  `;
  document.head.append(css);
 }
 async function dismiss(){
  currentUid=uid();
  try{localStorage.setItem(key(),'1')}catch{}
  card?.classList.remove('is-skeleton-open');
  $('#biglwaSkeletonHub',card)?.setAttribute('hidden','');
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
  dialog=document.createElement('dialog');dialog.id='biglwaTutorialDialog';dialog.className='biglwa-dialog';dialog.setAttribute('aria-labelledby','biglwaTourTitle');
  dialog.innerHTML='<div class="tutorial-head"><span class="biglwa-dialog-lights" aria-hidden="true"><i></i><i></i><i></i></span><span id="biglwaTourPosition" class="tour-step"></span>'+
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
 function ensureSkeletonToolbar(){
  // The text launcher leads the filters and replaces the old body heading.
  const sidebar=$('#studioApp .sidebar'),top=sidebar?.querySelector('.sidebar-top');
  if(sidebar)sidebar.setAttribute('aria-label','Skeleton Key');
  if(top){
   let quick=$('#biglwaSkeletonQuickActions',top);
   if(!quick){quick=document.createElement('div');quick.id='biglwaSkeletonQuickActions';quick.className='skeleton-quick-actions';quick.setAttribute('role','group');quick.setAttribute('aria-label','Skeleton Key and Veve');top.prepend(quick)}
   let launcher=$('#skeletonKeyLauncher',top);
   if(!launcher){
    launcher=document.createElement('button');launcher.id='skeletonKeyLauncher';launcher.type='button';launcher.className='biglwa-guide-launcher';
    launcher.title='Skeleton Key';launcher.setAttribute('aria-label','Open Skeleton Key');
    launcher.innerHTML='<img src="/assets/skeleton-keys-ankh.svg" alt="" aria-hidden="true">';
    launcher.addEventListener('click',openSkeleton);
   }
   if(launcher.parentElement!==quick)quick.append(launcher);
   let veve=$('#skeletonVeveLauncher',top);
   if(!veve){
    veve=document.createElement('button');veve.id='skeletonVeveLauncher';veve.className='skeleton-veve-launcher';
    veve.type='button';veve.title='Open Veve';veve.setAttribute('aria-label','Open Veve');
    veve.innerHTML='<span aria-hidden="true" class="skeleton-veve-mark">✺</span>';
    veve.addEventListener('click',()=>{
     const open=window.openBIGLWAModule||window.BigLWAOpenModule;
     if(typeof open==='function')open('veve');
    });
   }
   if(veve.parentElement!==quick)quick.append(veve);
  }
  $('#biglwaBodyGuide')?.remove();
  return !!top;
 }
 function skeletonHub(){
  if(!card)return null;
  let hub=$('#biglwaSkeletonHub',card);
  if(hub)return hub;
  hub=document.createElement('section');hub.id='biglwaSkeletonHub';hub.className='biglwa-skeleton-hub';hub.hidden=true;
  hub.setAttribute('aria-label','Skeleton Key for the individual');
  hub.innerHTML='<div class="biglwa-skeleton-title"><img src="/assets/skeleton-keys-ankh.svg" alt="" aria-hidden="true"><h2>Skeleton Key</h2><a class="skeleton-settings" href="/settings">Settings</a></div>'+
   '<details class="skeleton-analytics-details"><summary>Account analytics · monthly</summary><section id="skeletonAnalytics" aria-label="Account analytics"></section></details>'+
   '<details class="skeleton-body-legend"><summary>Body shadow key</summary><div class="skeleton-body-models">'+
   '<figure style="--model-shadow:#d9c6ee"><div class="skeleton-model-widget"><i></i><span></span></div><figcaption>Individual</figcaption></figure>'+
   '<figure style="--model-shadow:#f7cddd"><div class="skeleton-model-widget"><i></i><span></span></div><figcaption>Social</figcaption></figure>'+
   '<figure style="--model-shadow:#f8d4b0"><div class="skeleton-model-widget"><i></i><span></span></div><figcaption>Political</figcaption></figure></div>'+
   '<label class="skeleton-body-setting"><input type="checkbox" id="skeletonBodyIndicators" checked> Show body shadows on hover</label></details>'+ 
   '<details class="skeleton-platform-key"><summary>Platform shadow key</summary><div class="skeleton-platform-content">'+
   '<p class="skeleton-shadow-explanation">Each tile has one platform-colored shadow. Its ivory face stays consistent across the network.</p>'+
   (window.BigLWAShadowKey?.render?.('skeleton')||'<p class="skeleton-shadow-explanation">Platform preview is loading.</p>')+
   '</div></details>'+
   '<details class="skeleton-symbol-details"><summary>Symbol key</summary><ul class="tour-symbol-key" id="biglwaSkeletonSymbols" aria-label="Visual key images for Studio tools"></ul></details>'+
   '<details class="skeleton-legal"><summary>Important / Legal</summary><nav><a href="/about">About</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/rights">Rights</a><a href="/data-deletion">Data deletion</a></nav></details>'+
   '<label class="skeleton-hint-setting"><input type="checkbox" id="skeletonHideHints"> Hide hover hints and previews</label>';
  hub.querySelectorAll(':scope > details').forEach(section=>section.addEventListener('toggle',()=>{if(section.open)hub.querySelectorAll(':scope > details').forEach(other=>{if(other!==section)other.open=false})}));
  $('.skeleton-analytics-details',hub).addEventListener('toggle',event=>{if(event.target.open)window.BigLWAAccountInsights?.refresh?.()});
  $('.skeleton-platform-key',hub).addEventListener('toggle',event=>{
    if(!event.target.open)return;
    const slot=$('.skeleton-platform-content',hub);
    const markup=window.BigLWAShadowKey?.render?.('skeleton');
    if(markup&&slot){
      const obsolete=slot.querySelector('.module-shadow-key,.skeleton-shadow-explanation:last-child');
      if(obsolete)obsolete.outerHTML=markup;
      else slot.insertAdjacentHTML('beforeend',markup);
    }
  });
  $('.skeleton-symbol-details',hub).addEventListener('toggle',event=>{if(event.target.open)renderSymbolKey($('#biglwaSkeletonSymbols',hub))});
  const indicators=$('#skeletonBodyIndicators',hub);indicators.checked=window.BigLWAThreeBodies?.enabled?.()!==false;
  indicators.addEventListener('change',()=>window.BigLWAThreeBodies?.setEnabled(indicators.checked));
  const hints=$('#skeletonHideHints',hub);
  hints.checked=window.BigLWAStableInteractions?.areHintsHidden?.()===true;
  hints.addEventListener('change',()=>window.BigLWAStableInteractions?.setHintsHidden?.(hints.checked));
  window.addEventListener('biglwa:hints-preference',event=>{
   if(hints.isConnected)hints.checked=!!event.detail?.hidden;
  });
  card.appendChild(hub);
  // Keep the original Real Rank bar and status on the profile banner.
  window.BigLWAAccountInsights?.refresh?.();
  return hub;
 }
 function openSkeleton(){
  if(!card?.isConnected)attach();
  if(!card)return;
  const hub=skeletonHub();
  if(!hub)return;
  card.classList.remove('is-tutorial-dismissed');
  card.classList.add('is-skeleton-open');
  hub.hidden=false;
  // The visible class overrides the saved dismissal only for this open session.
  card.scrollIntoView?.({behavior:'smooth',block:'nearest'});
 }

 function openAnalytics(metric='followers'){
  if(document.documentElement.classList.contains('biglwa-preview-mode')||window.__biglwaPublicStorageView)return false;
  const workspace=$('#moduleWorkspace');
  if(workspace&&!workspace.hidden){
    const back=$('#moduleBack');
    if(back)back.click();
  }
  if(!card?.isConnected)attach();
  openSkeleton();
  const hub=$('#biglwaSkeletonHub',card||document);
  const details=hub?.querySelector('.skeleton-analytics-details');
  if(!details)return false;
  details.open=true;
  window.BigLWAAccountInsights?.refresh?.();
  requestAnimationFrame(()=>{
    const target=hub.querySelector('[data-metric="'+String(metric).replace(/[^a-z]/g,'')+'"]')||details.querySelector('summary');
    details.scrollIntoView?.({behavior:'smooth',block:'center'});
    // Move focus without interfering with the input the person was using.
    const summary=details.querySelector('summary');
    summary?.setAttribute('tabindex','-1');
    summary?.focus?.({preventScroll:true});
  });
  return true;
 }
 function attach(){
  style();ensureSkeletonToolbar();
  const next=$('#studioApp .manifesto-card');
  if(!next)return false;
  card=next;style();currentUid=uid();
  if(!card.classList.contains('is-skeleton-open'))card.classList.toggle('is-tutorial-dismissed',readDismissed());
  const hub=skeletonHub();
  if(!readDismissed()){card.classList.add('is-skeleton-open');hub.hidden=false}
  if(!$('.biglwa-tour-actions',card)){
   const actions=document.createElement('div');actions.className='biglwa-tour-actions';

   const remove=document.createElement('button');remove.type='button';remove.dataset.tourDismiss='';
   remove.textContent='×';remove.title='Close Skeleton Key';remove.setAttribute('aria-label','Close Skeleton Key');
   actions.append(remove);card.append(actions);
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
 window.BigLWASiteGuide={open:openTour,openKeys:openSkeleton,openAnalytics};
 let pending=false;
 const observer=new MutationObserver(()=>{
  if(card?.isConnected && $('.biglwa-tour-actions',card) &&
     $('#skeletonKeyLauncher') && $('#biglwaSkeletonHub'))return;
  if(pending)return;
  pending=true;
  requestAnimationFrame(()=>{pending=false;attach()});
 });
 observer.observe(document.documentElement,{subtree:true,childList:true});
 attach();
})();
