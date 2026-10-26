/* BIG LWA R / LWAZI: page title | functional version controls | series block
   The version controls are moved, not cloned; upstream click listeners survive. */
(()=>{'use strict';
 if(window.__biglwaHeadingVersions20261026)return;
 window.__biglwaHeadingVersions20261026=true;
 const $=(s,r=document)=>r?.querySelector(s);
 const config={
  camera:{title:'bookini',selector:'.booth-tabs',icon:'bookini'},
  notes:{title:'sqwibz',selector:'.diary-section-nav'},
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
  const url='/assets/bigapps/blocks/'+icon+'.svg?v=20261026-1';
  let badge=$('.lwazi-series-badge',right);
  if(!badge){badge=document.createElement('span');badge.className='lwazi-series-badge';right.append(badge)}
  if(badge.dataset.lwaziIcon!==icon){
   badge.dataset.lwaziIcon=icon;badge.replaceChildren();
   const img=document.createElement('img');img.src=url;img.alt='';img.width=76;img.height=76;
   const caption=document.createElement('span');caption.textContent='R / LWAZI SERIEZ';
   badge.append(img,caption);badge.setAttribute('aria-label',icon+' · R/Lwazi series');
  }
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
    ['tools','lwazi'],['projects','visualizr']
  ];
  for(const [route,name]of routes){
    for(const link of document.querySelectorAll('#studioApp [data-shortcut-route="'+route+'"],#studioApp [data-sidebar-route="'+route+'"],#studioApp [data-open="'+route+'"]')){
      const label=link.querySelector('.hero-shortcut-label,.sidebar-route-label,.nav-label');
      if(label&&label.textContent.trim()!==name)label.textContent=name;
      if(link.getAttribute('aria-label')===({tools:'Tools',projects:'Projects'}[route]))link.setAttribute('aria-label',name);
    }
    const widget=document.querySelector('#studioApp #'+(route==='projects'?'projects':'tools')+' .card-head h2');
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
  if(item.journal)journalVersions(ws,right);
  if(item.icon)addMark(right,item.icon);
  heading.classList.add('module-heading--with-versions','module-heading--single-line');
  const sub=$(':scope > .module-heading-bottom > p',heading);
  if(key==='tools'&&sub)sub.textContent='Your werkshopeR. Meet the blocks of the R/Lwazi series: our own apps, designed fo/r you. 3 web-friendly originals and 4 advanced open-source R-editors.';
  if(key==='camera'&&sub)sub.textContent='Your own booth to capture or chat with other bookini’s on Big LWA.';
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
