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
  {"title":"Symbol key","area":"Studio icons","body":"Hanger = Projects, chess piece = Arcade, notebook = Journal, map pin = Map, planets = Orbit connections, Feed = public posts and Archive = your saved media."},
  {"title":"The three colored dots","area":"Widget and post controls","body":"Red removes or deletes (read the confirmation and any 30-day countdown). Yellow minimizes a window or archives a post. Green enlarges or opens the full workspace. Their action depends on the card."},
  {"title":"Your workspace","area":"Studio","body":"Drag widget handles to arrange the Studio, use controls to customize it, and view your own public profile as others see it. Layout preferences are attached to your Big LWA account."},
  {"title":"Connect your world","area":"Orbit","key":"orbit","body":"Orbit links external accounts such as Pinterest and Instagram. Imported media goes first to your account-linked private collection for review. If a provider session expires, reconnect only that provider."},
  {"title":"Where do imports go?","area":"Orbit → Archive","key":"archive","body":"Imported photos and Pins are saved in your Archive/import library, NOT posted publicly by connection alone. Select media and explicitly publish to Collective Feed. Archiving or switching Live off hides a published post."},
  {"title":"Collective Feed vs Veve","area":"Veve","key":"veve","body":"Collective Feed contains content users deliberately share. Veve is the wider discovery wall for public photos, Sqwibs, games, and ideas. Importing through Orbit does not automatically publish to Veve."},
  {"title":"Boards and privacy","area":"Boards","key":"boards","body":"Boards gather Pins and collections. Private and locked boards do not automatically publish; choose what to share."},
  {"title":"Journal, Sqwib and Sqwip","area":"Journal","key":"diary","body":"Journal entries are private until their owner turns on sharing. Sqwib sharing/reposting follows the author’s permissions. Sqwip creates screenplay pages to the right."},
  {"title":"Creative tools","area":"Tools","key":"tools","body":"Tools converts files and trims video locally. ArtCraft has browser creative editors when the installed versions are available. Export your result to keep a copy."},
  {"title":"All yours","area":"Studio","body":"The pink tutorial card can be removed with X. Reopen this guide anytime from the Studio sidebar. You control publication, deletion, and public visibility."}
 ];
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
   #biglwaTutorialDialog .tour-step{font:800 11px system-ui;letter-spacing:.08em;text-transform:uppercase}
   #biglwaTutorialDialog .tour-controls{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
   #biglwaTutorialDialog .tour-controls button{min-height:38px;padding:10px 13px;
    border-radius:10px;border:1px solid #9d7871;background:#fffaf4;color:#322424;
    font:700 12px system-ui;cursor:pointer}
   #biglwaTutorialDialog .tour-controls [data-tour-next]{background:#462830;color:#fff}
   #biglwaTutorialDialog .tour-controls [data-tour-try]{margin-left:auto}
   #biglwaTutorialDialog button:focus-visible{outline:3px solid #b35d78;outline-offset:3px}
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
  $('#biglwaTourTitle',dialog).textContent=step.title;
  $('#biglwaTourBody',dialog).textContent=step.body;
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
