/* Studio Lwazi: the cabinet is a FRAME around the SAME three-track carousel
   pattern used by Games (arcade-library-viewport > arcade-track > arcade-game-tile).
   No content, app, or functionality in the Workshop is removed. */
(()=>{'use strict';
 if(window.__biglwaLwaziCabinetThumbV2)return;
 window.__biglwaLwaziCabinetThumbV2=true;
 const BLOCKS=[
  {name:'sqwibblR',id:'image-desk',icon:'/assets/bigapps/icons/sqwibblR.png?v=20261026-original-stitch-1'},
  {name:'visualizr',id:'visualizr',icon:'/assets/bigapps/icons/visualizr.png?v=20261026-stitched-v-2'},
  {name:'lightR',id:'photocraft',icon:'/assets/bigapps/icons/lightR.png?v=20261026-original-stitch-1'},
  {name:'paintR',id:'vectorcraft',icon:'/assets/bigapps/icons/paintR.png?v=20261026-original-stitch-1'},
  {name:'keyframeR',id:'effectcraft',icon:'/assets/bigapps/icons/keyframeR.png?v=20261026-original-stitch-1'},
  {name:'fileR',id:'pdfcraft',icon:'/assets/bigapps/icons/fileR.png?v=20261026-original-stitch-1'}
 ];
 function openModule(key){
  if(typeof window.openBIGLWAModule==='function')return window.openBIGLWAModule(key);
  if(typeof window.BigLWAOpenModule==='function')return window.BigLWAOpenModule(key);
  document.querySelector('#studioApp [data-sidebar-route="'+key+'"],#studioApp [data-open="'+key+'"]')?.click();
 }
 const tile=(app)=>{
  const el=document.createElement('button');
  el.type='button';el.className='arcade-game-tile lwazi-block-tile';
  el.dataset.lwaziApp=app.id;el.setAttribute('aria-label','Open '+app.name+' in lwazi');
  const img=document.createElement('img');img.src=app.icon;img.alt='';
  img.loading='lazy';img.decoding='async';img.width=160;img.height=160;
  const label=document.createElement('span');label.className='lwazi-block-name';label.textContent=app.name;
  el.append(img,label);
  el.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();openBlock(app)});
  return el;
 };
 function openBlock(app){
  if(app.id==='visualizr'){openModule('projects');return;}
  openModule('tools');
  // The real Workshop loads dynamically. Open the ORIGINAL editor launcher
  // after it mounts; never replace or clone its save/runtime controls.
  let count=0;
  const poll=()=>{
   const target=document.querySelector('#studioApp #craftSuite [data-craft-open="'+app.id+'"]');
   if(target&&!target.disabled){target.click();return;}
   if(++count<24)window.setTimeout(poll,200);
   else document.querySelector('#studioApp #craftSuite [data-craft-card="'+app.id+'"]')?.scrollIntoView({block:'center',behavior:'smooth'});
  };
  window.setTimeout(poll,180);
 }
 function mount(){
  const card=document.querySelector('#studioApp #tools, #studioApp article.card[data-widget="tools"]');
  if(!card||card.querySelector('.lwazi-cabinet-thumb'))return;
  const frame=document.createElement('div');
  frame.className='lwazi-cabinet-thumb';
  frame.setAttribute('role','group');frame.setAttribute('aria-label','Lwazi Workshop app carousel');
  const viewport=document.createElement('div');
  viewport.className='arcade-library-viewport';
  viewport.setAttribute('aria-label','Scroll through Lwazi app blocks');
  // Reuse the original Games carousel tracks and infinite duplicated tiles.
  for(const selection of [BLOCKS.slice(0,3),BLOCKS.slice(2,5),[BLOCKS[4],BLOCKS[5],BLOCKS[0]]]){
   const track=document.createElement('div');track.className='arcade-track';
   for(const app of [...selection,...selection])track.appendChild(tile(app));
   viewport.appendChild(track);
  }
  frame.appendChild(viewport);
  const open=document.createElement('button');open.type='button';
  open.className='lwazi-cabinet-open';open.setAttribute('aria-label','Open complete lwazi workshop');
  open.addEventListener('click',()=>openModule('tools'));
  const marquee=document.createElement('button');marquee.type='button';
  marquee.className='lwazi-cabinet-marquee';marquee.setAttribute('aria-label','Open complete lwazi workshop');
  marquee.addEventListener('click',()=>openModule('tools'));
  frame.append(marquee,open);
  const heading=card.querySelector('.biglwa-card-heading-row, .card-heading-row, .card-header');
  if(heading)heading.insertAdjacentElement('afterend',frame);
  else card.appendChild(frame);
 }
 let queued=false;
 const schedule=()=>{
  if(queued)return;queued=true;
  requestAnimationFrame(()=>{queued=false;mount()});
 };
 const start=()=>{
  mount();
  const root=document.querySelector('#studioApp')||document.body;
  new MutationObserver(schedule).observe(root,{subtree:true,childList:true});
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
 else start();
})();
