/* BIG LWA R / LWAZI: page title | functional version controls | series block
   The version controls are moved, not cloned; upstream click listeners survive. */
(()=>{'use strict';
 if(window.__biglwaHeadingVersions20261026)return;
 window.__biglwaHeadingVersions20261026=true;
 const $=(s,r=document)=>r?.querySelector(s);
 const config={
  camera:{title:'booth',selector:'.booth-tabs',icon:'bookini'},
  stream:{title:'stream',stream:true},
  notes:{title:'sqwidz',icon:'sqwibblR'},
  projects:{title:'visualizr',selector:'.visualz-tabs',icon:'visualizr'},
  diary:{title:'Journal',journal:true},
  tools:{title:'lwazi',icon:'r-editor'}
 };
 const workspace=()=>$('#studioApp #moduleWorkspace');
 function rightSlot(heading){
  let right=$(':scope > .module-heading-right',heading);
  if(!right){
   right=document.createElement('div');
   right.className='module-heading-right module-version-right';
   const bottom=$(':scope > .module-heading-bottom',heading);
   if(bottom)heading.insertBefore(right,bottom);
   else heading.append(right);
  }
  right.classList.add('module-version-right');
  return right;
 }
 function addMark(right,icon){
  const url=icon==='visualizr'?'/assets/bigapps/icons/visualizr.png?v=20261026-stitched-v-2':icon==='sqwibblR'?'/assets/bigapps/icons/sqwibblR.png?v=20261026-original-stitch-1':'/assets/bigapps/blocks/'+icon+'.svg?v=20261026-1';
  let badge=$('.lwazi-series-badge',right);
  if(!badge){badge=document.createElement('span');badge.className='lwazi-series-badge';right.append(badge)}
  if(badge.dataset.lwaziIcon!==icon){
   badge.dataset.lwaziIcon=icon;badge.replaceChildren();
   const img=document.createElement('img');img.src=url;img.alt='';img.width=76;img.height=76;
   const caption=document.createElement('span');caption.textContent='R / LWAZI SERIEZ';
   badge.append(img,caption);badge.setAttribute('aria-label',icon+' · R/Lwazi series');
  }
 }
 function streamVersions(ws,right){
  // Stream delegates click handling to .biglwa-stream. A proxy in the heading
  // forwards clicks to the ORIGINAL (hidden) buttons without breaking that
  // delegation or losing the selection/data-loading logic.
  const native=$('.biglwa-stream .stream-channels',ws);
  if(!native)return;
  const options=[...native.querySelectorAll('[data-stream-tab]')];
  if(options.length!==4)return;
  let row=$('.module-heading-versions[data-version-stream]',right);
  if(!row){
   row=document.createElement('div');
   row.className='module-heading-versions stream-heading-versions';
   row.dataset.versionStream='1';
   row.setAttribute('role','tablist');
   row.setAttribute('aria-label','Stream channels');
   right.prepend(row);
  }
  for(const source of options){
   const mode=source.dataset.streamTab;
   let button=[...row.children].find(el=>el.dataset.streamHeadingTab===mode);
   if(!button){
    button=document.createElement('button');button.type='button';
    button.dataset.streamHeadingTab=mode;
    button.setAttribute('role','tab');
    const label=document.createElement('span');
    label.textContent=source.querySelector('b')?.textContent?.trim()||mode;
    button.append(label);
    button.addEventListener('click',()=>{
     const live=$('.biglwa-stream .stream-channels [data-stream-tab="'+mode+'"]',ws);
     live?.click();requestAnimationFrame(()=>streamVersions(ws,right));
    });
    row.append(button);
   }
   const active=source.getAttribute('aria-selected')==='true'||source.classList.contains('is-active');
   if(button.getAttribute('aria-selected')!==String(active))button.setAttribute('aria-selected',String(active));
   button.classList.toggle('is-active',active);
   button.tabIndex=active?0:-1;
  }
  ws.classList.add('stream-versions-in-header');
 }
 function journalVersions(ws,right){
  let nav=$('nav.module-heading-versions[data-version-journal]',right);
  if(!nav){
   nav=document.createElement('nav');nav.className='module-heading-versions';
   nav.dataset.versionJournal='1';nav.setAttribute('aria-label','Journal versions');
   for(const [mode,title,source]of [['edit','Write','#journalReturnEdit'],['read','Read','#journalViewButton']]){
    const b=document.createElement('button');b.type='button';b.dataset.journalHeadingVersion=mode;b.textContent=title;
    b.onclick=()=>$(source,ws)?.click();nav.append(b);
   }
   right.prepend(nav);
  }
  const edit=$('#journalViewButton',ws),reader=$('#journalReaderPanel',ws);
  nav.hidden=!edit;
  if(edit){
   const open=Boolean(reader&&!reader.hidden);
   nav.querySelectorAll('button').forEach(b=>{
    b.setAttribute('aria-pressed',String(b.dataset.journalHeadingVersion===(open?'read':'edit')));
   });
  }
 }
 function renameNavigation(){
  const routes=[
    ['tools','lwazi'],['projects','visualizr'],['camera','booth'],['notes','sqwidz']
  ];
  for(const [route,name]of routes){
    for(const link of document.querySelectorAll('#studioApp [data-shortcut-route="'+route+'"],#studioApp [data-sidebar-route="'+route+'"],#studioApp [data-open="'+route+'"]')){
      const label=link.querySelector('.hero-shortcut-label,.sidebar-route-label,.nav-label');
      if(label&&label.textContent.trim()!==name)label.textContent=name;
      if(link.getAttribute('aria-label')===({tools:'Tools',projects:'Projects',camera:'Booth',notes:'Sqwibz'}[route]))link.setAttribute('aria-label',name);
    }
    const widget=document.querySelector('#studioApp #'+route+' .card-head h2');
    if(widget&&widget.textContent.trim()!==name)widget.textContent=name;
  }
 }
 function install(){
  renameNavigation();
  const ws=workspace();if(!ws?.isConnected)return;
  const key=ws.dataset.moduleKey;
  const item=config[key];if(!item)return;
  // Project editor redraws the inside of the module page, so target its own
  // heading. Others use the regular Studio page header.
  const heading=key==='projects'
   ?$('.lwa-project-heading',ws)
   :$('#moduleWorkspaceBody > .module-heading',ws)||$('.module-heading',ws);
  if(!heading)return;
  const title=$('h1',heading);if(!title)return;
  if(title.textContent.trim()!==item.title)title.textContent=item.title;
  const right=rightSlot(heading);
  const controls=item.selector?$(item.selector,ws):null;
  if(controls){
   controls.classList.add('module-heading-versions');
   controls.setAttribute('aria-label','Choose '+item.title+' version');
   if(controls.parentElement!==right)right.prepend(controls);
  }
  if(item.stream)streamVersions(ws,right);
  if(item.journal)journalVersions(ws,right);
  if(item.icon)addMark(right,item.icon);
  // Show the original R-series block instead of a cramped stitched text label.
  right.querySelector('.werk-rz-mark')?.remove();
  heading.classList.add('module-heading--with-versions','module-heading--single-line');
  const sub=$(':scope > .module-heading-bottom > p',heading);
  if(key==='tools'&&sub)sub.textContent='Open a block to create, edit, keep or share. The folder below holds your BIG LWA tools.';
  if(key==='camera'&&sub)sub.textContent='Use our booth to feel yourself or chat with other bookiniz using Big LWA.';
 }
 let queued=false;
 function schedule(){
  if(queued)return;queued=true;
  requestAnimationFrame(()=>{queued=false;install()});
 }
 function boot(){
  const ws=workspace();if(!ws)return;
  const observer=new MutationObserver(records=>{
   if(records.some(rec=>rec.addedNodes.length||rec.removedNodes.length))schedule();
  });
  observer.observe(ws,{subtree:true,childList:true});
  document.addEventListener('biglwa:module-open',schedule);
  document.addEventListener('biglwa:visualz-render',schedule);
  document.addEventListener('click',e=>{if(e.target.closest('.module-heading-versions'))schedule()});
  install();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
