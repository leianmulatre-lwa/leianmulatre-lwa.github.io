/* BIG LWA · optional, dismissible Studio tutorial.
   The pink manifesto is not part of the movable widget grid. Dismissing it
   frees the masonry slot; it never rearranges or deletes user-made widgets. */
(()=>{
 'use strict';
 if(window.__biglwaStudioOnboarding)return;
 window.__biglwaStudioOnboarding=true;
 const DISMISSED='biglwaStudioTutorialDismissed:v1:';
 const steps=[
  {title:'Welcome to Big LWA',area:'Studio',body:'This is your creative home. Your Studio holds your work, profile and widgets. Move tools where they feel convenient — your arrangement is saved.'},
  {title:'Find your way',area:'Studio',body:'Use the left shortcuts and the top navigation to open tools. Keyboard users can focus a widget handle, hold Alt and use the arrow keys to reorder it.'},
  {title:'Discover with Veve',area:'Veve',key:'veve',body:'Veve is an image-first discovery wall with public photos, games and ideas. Select photos to open their full captions, and customize which sections appear.'},
  {title:'Connect in Orbit',area:'Orbit',key:'orbit',body:'Orbit brings connected services together. Imported material starts privately; choose what to publish to Collective Feed.'},
  {title:'Create and collect',area:'Boards',key:'boards',body:'Collect Pinterest Pins in Boards, lock personal collections, or explicitly publish selected Pins to Veve. A locked board never publishes automatically.'},
  {title:'Learn and make',area:'Politc / Tools',key:'tools',body:'Politc offers civic resources. Tools provides local file utilities, including video trimming. Open either when you need it.'},
  {title:'Keep what matters',area:'Journal',key:'diary',body:'Journal stays private unless you deliberately choose to share it. Your saved Studio layout stays in place after refreshing or changing devices.'}
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
 function attach(){
  const next=$('#studioApp .manifesto-card');
  if(!next)return false;
  card=next;style();currentUid=uid();
  card.classList.toggle('is-tutorial-dismissed',readDismissed());
  if(!$('.biglwa-tour-actions',card)){
   const actions=document.createElement('div');actions.className='biglwa-tour-actions';
   const start=document.createElement('button');start.type='button';start.dataset.tourStart='';
   start.textContent='Explore Big LWA';start.setAttribute('aria-label','Start the Big LWA website tutorial');
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
 if(!attach()){
  const observer=new MutationObserver(()=>{if(attach())observer.disconnect()});
  observer.observe(document.documentElement,{subtree:true,childList:true});
  setTimeout(()=>observer.disconnect(),20000);
 }
})();
