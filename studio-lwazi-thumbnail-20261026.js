/* The BIG LWA keyboard cabinet is the lwazi Studio thumbnail, not a new application, logo,
   or replacement header symbol. Keep the existing workshop launcher and route. */
(()=>{'use strict';
 if(window.__biglwaLwaziCabinetThumbV1)return;
 window.__biglwaLwaziCabinetThumbV1=true;
 const findCard=()=>document.querySelector('#studioApp #tools, #studioApp article.card[data-widget="tools"]');
 function mount(){
  const card=findCard();
  if(!card||card.querySelector(':scope > .lwazi-cabinet-thumb'))return;
  const preview=document.createElement('button');
  preview.type='button';
  preview.className='lwazi-cabinet-thumb';
  preview.setAttribute('aria-label','Open lwazi workshop');
  preview.title='Open lwazi';
  preview.addEventListener('click',event=>{
    event.preventDefault();
    const launcher=card.querySelector('[data-open="tools"], [data-sidebar-route="tools"]')||
      document.querySelector('#studioApp [data-sidebar-route="tools"],#studioApp .sidebar [data-open="tools"]');
    if(launcher && launcher!==preview){launcher.click();return;}
    if(typeof window.openBIGLWAModule==='function'){window.openBIGLWAModule('tools');return;}
    if(typeof window.BigLWAOpenModule==='function'){window.BigLWAOpenModule('tools');}
  });
  const heading=card.querySelector('.biglwa-card-heading-row, .card-heading-row, .card-header');
  if(heading)heading.insertAdjacentElement('afterend',preview);
  else card.appendChild(preview);
 }
 let queued=false;
 const schedule=()=>{
  if(queued)return;queued=true;
  requestAnimationFrame(()=>{queued=false;mount()});
 };
 const start=()=>{mount();
   const root=document.querySelector('#studioApp')||document.body;
   new MutationObserver(schedule).observe(root,{subtree:true,childList:true});
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
 else start();
})();