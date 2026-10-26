/* BIG LWA — put existing working version switches beside page titles.
   No fake tabs: use the actual controls and preserve their event handlers. */
(()=>{'use strict';
 if(window.__biglwaHeadingVersions20261026)return;
 window.__biglwaHeadingVersions20261026=true;
 const $=(s,r=document)=>r?.querySelector(s);
 const root=()=>$('#studioApp #moduleWorkspace');
 const variants={
  camera:'.booth-tabs',
  notes:'.diary-section-nav',
  projects:'.visualz-tabs',project:'.visualz-tabs',visualz:'.visualz-tabs'
 };
 function install(){
  const workspace=root();if(!workspace||!workspace.isConnected)return;
  const key=workspace.dataset.moduleKey||'';
  const heading=$('.module-heading',workspace),body=$('.module-body',workspace)||$('#moduleWorkspaceBody',workspace)||workspace;
  if(!heading)return;
  const h1=$('h1',heading);if(!h1)return;
  const names={camera:'bookini',tools:'tewlz',notes:'sqwibz',projects:'visualz',project:'visualz',visualz:'visualz'};
  if(names[key]&&h1.textContent.trim()!==names[key])h1.textContent=names[key];
  const copy=$('.module-heading-bottom p',heading)||$('.module-heading-copy p',heading);
  if(copy&&key==='camera')copy.textContent="Your own booth to capture or chat with other bookini’s on Big LWA.";
  if(copy&&key==='tools')copy.textContent='Creative toolz to make, edit, convert, and keep your files.';
  let target=$(variants[key]||'#not-present',workspace);
  // The Visualz canvas has its own inner heading and delegated handlers.
  let location=heading;
  if(['projects','project','visualz'].includes(key)){
   const inner=$('#lwaProjects .lwa-project-heading',workspace);
   if(inner)location=inner;
  }
  if(target){
   if(!location.contains(target)){
    const copy=location.querySelector('h1');
    if(copy)copy.insertAdjacentElement('afterend',target);
    else location.append(target);
   }
   target.classList.add('module-heading-versions');
   target.setAttribute('aria-label','Choose '+(names[key]||key)+' version');
  }
  if(key==='diary'){
   let actions=$('.module-heading-versions[data-version-journal]',heading);
   if(!actions){
    actions=document.createElement('nav');actions.className='module-heading-versions';
    actions.dataset.versionJournal='';actions.setAttribute('aria-label','Journal writing and reading');
    const edit=document.createElement('button');edit.type='button';edit.dataset.journalHeadingVersion='edit';edit.textContent='Write';
    const read=document.createElement('button');read.type='button';read.dataset.journalHeadingVersion='read';read.textContent='Read';
    edit.onclick=()=>$('#journalReturnEdit',workspace)?.click();
    read.onclick=()=>$('#journalViewButton',workspace)?.click();
    actions.append(edit,read);h1.after(actions);
   }
   const reading=$('#journalReaderPanel',workspace);
   const isRead=reading&&reading.hidden===false;
   actions.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.journalHeadingVersion===(isRead?'read':'edit'))));
   // Reading mode is only available for owners with a rendered journal editor.
   actions.hidden=!$('#journalViewButton',workspace);
  }
 }
 let scheduled=false;
 const schedule=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;install()})};
 const boot=()=>{
  const workspace=root();
  if(workspace)new MutationObserver(records=>{
   if(records.some(r=>r.addedNodes.length||r.removedNodes.length))schedule();
  }).observe(workspace,{childList:true,subtree:true});
  document.addEventListener('biglwa:module-open',()=>setTimeout(schedule,0));
  document.addEventListener('biglwa:visualz-render',schedule);
  document.addEventListener('click',e=>{if(e.target.closest('.module-heading-versions'))setTimeout(schedule,0)});
  install();
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
