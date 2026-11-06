/* Pixel loading art belongs to the real module curtain, not a timed fake overlay.
   Art is decorative; the existing module status, bypass and readiness stay live. */
(()=>{'use strict';
 if(window.__biglwaPixelModuleCurtain)return;
 window.__biglwaPixelModuleCurtain=true;
 const root=()=>document.getElementById('studioApp');
 const upgrade=()=>{
  const app=root();if(!app)return;
  const curtains=app.querySelectorAll('.lwa-curtain[data-lwa-curtain="module"]');
  curtains.forEach(curtain=>{
   if(curtain.classList.contains('lwa-pixel-curtain'))return;
   const label=curtain.querySelector('.lwa-curtain-label');
   if(!label)return;
   const scene=document.createElement('div');
   scene.className='lwa-pixel-scene';scene.setAttribute('aria-hidden','true');
   const fig=(kind,src)=>{
    const span=document.createElement('span');span.className='lwa-pixel-figure lwa-pixel-'+kind;
    const img=document.createElement('img');img.src=src;img.alt='';
    img.decoding='async';img.draggable=false;img.width=64;img.height=64;
    span.append(img);return span;
   };
   scene.append(fig('globe','/assets/loading-globe-pixel-20261029.png'));
   const lights=document.createElement('span');lights.className='lwa-pixel-lights';
   for(let n=0;n<3;n++){const dot=document.createElement('i');dot.setAttribute('aria-hidden','true');lights.append(dot)}
   scene.append(lights,fig('blocks','/assets/loading-blocks-pixel-20261029.png'));
   curtain.insertBefore(scene,label);
   curtain.classList.add('lwa-pixel-curtain');
  });
 };
 let pending=false;
 const schedule=()=>{
  if(pending)return;pending=true;
  requestAnimationFrame(()=>{pending=false;upgrade()});
 };
 const start=()=>{
  upgrade();
  const app=root();if(!app)return;
  new MutationObserver(records=>{
   if(records.some(record=>[...record.addedNodes].some(node=>
      node.nodeType===1&&(node.matches?.('.lwa-curtain[data-lwa-curtain="module"]')||
      node.querySelector?.('.lwa-curtain[data-lwa-curtain="module"]')))))schedule();
  }).observe(app,{childList:true,subtree:true});
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
 else start();
})();