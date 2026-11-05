/* BIG LWA editor shell: replace only exact former window titles before first paint.
 * Keep upstream source, copyright and license notices untouched. */
(()=>{
 'use strict';
 const path=location.pathname.toLowerCase();
 const app={
  '/bigapps/lightr/':{old:'PhotoCraft',name:'lightR'},
  '/bigapps/paintr/':{old:'VectorCraft',name:'paintR'},
  '/bigapps/keyframer/':{old:'EffectCraft',name:'keyframeR'},
  '/bigapps/filer/':{old:'PdfCraft',name:'fileR'},
  '/bigapps/photocraft/':{old:'PhotoCraft',name:'lightR'},
  '/bigapps/vectorcraft/':{old:'VectorCraft',name:'paintR'},
  '/bigapps/effectcraft/':{old:'EffectCraft',name:'keyframeR'},
  '/bigapps/pdfcraft/':{old:'PdfCraft',name:'fileR'}
 };
 const item=Object.entries(app).find(([prefix])=>path.startsWith(prefix))?.[1];
 if(!item)return;
 const fix=()=>{
  for(const node of document.querySelectorAll('title,h1,h2,h3,[role="heading"]')){
   if(node.closest?.('.biglwa-editor-chrome'))continue;
   if(node.children.length===0&&node.textContent.trim()===item.old)
     node.textContent=item.name;
  }
  if(document.title.trim()===item.old)document.title='BIG LWA · '+item.name;
 };
 let queued=false;
 const schedule=()=>{
  if(queued)return;queued=true;
  queueMicrotask(()=>{queued=false;fix()});
 };
 const observer=new MutationObserver(records=>{
  if(records.some(r=>r.type==='childList'||r.type==='characterData'))schedule();
 });
 observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fix,{once:true});
 else fix();
})();