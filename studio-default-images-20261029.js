/* User-chosen BIG LWA Studio default image previews.
   Preserves member-generated media and never replaces an interactive Map.
   The Map image appears ONLY after a failed frame or absent readiness signal. */
(()=>{'use strict';
 if(window.__biglwaStudioDefaultImages20261029)return;
 window.__biglwaStudioDefaultImages20261029=true;
 const base='/assets/studio-defaults/';
 const images={
  archive:base+'archive-windows-hill.webp?v=20261029-win-default-2',
  visualizr:base+'visualizr-dotted-canvas.webp',
  map:base+'map-bikini-bottom-fallback.webp',
  trophy:base+'trophy-achievement-made.webp'
 };
 const $=selector=>document.querySelector(selector);
 const frames=new Map();
 const make=(src,alt,cls)=>{
  const img=document.createElement('img');img.src=src;img.alt=alt;img.className=cls;img.loading='lazy';img.decoding='async';return img;
 };
 function archive(){
  const card=$('#studioApp #archive'),slot=card?.querySelector('.archive-photo-preview');
  if(!slot)return;
  // Never replace a custom member thumbnail, but repair an out-of-date
  // built-in thumbnail even when Studio marked its old default as complete.
  let img=slot.querySelector('img');
  if(img){
   const source=img.getAttribute('src')||'';
   if(source===images.archive&&slot.dataset.biglwaDefault20261029==='1')return;
   // Never replace member-provided media or a cloud-uploaded custom cover.
   if(!(/^data:image\/jpeg;base64,/.test(source)||/^(?:\/|\.\/)?(?:archive\/)?assets\/|(?:archive|polaroid|default|placeholder|sample)[\w/-]*\.(?:jpe?g|png|webp)(?:\?[^#]*)?/i.test(source)))return;
   img.src=images.archive;
  }else img=make(images.archive,'Green hillside under the classic blue Windows sky','biglwa-windows-archive-photo');
  img.classList.add('biglwa-windows-archive-photo');
  if(!img.parentElement)slot.append(img);
  slot.classList.add('biglwa-archive-default-windows');
  slot.dataset.biglwaDefault20261029='1';
 }
 function visualizr(){
  const card=$('#studioApp #projects');
  if(!card)return;
  const holder=card.querySelector('.studio-widget-scene');
  if(!holder||holder.dataset.biglwaDefault20261029==='1')return;
  const imgs=[...holder.querySelectorAll('img')];
  if(!imgs.length)return;
  if(imgs.some(img=>!/(?:projects-studio|studio-pink|projects-pink)/.test(img.getAttribute('src')||'')))return;
  imgs.forEach(img=>{img.src=images.visualizr;img.alt='Visual·eyez dotted paper canvas — eye out projects; create & load presentations';img.classList.add('biglwa-stick-visualizr-photo')});
  holder.dataset.biglwaDefault20261029='1';
  holder.classList.add('biglwa-default-visualizr-image');
 }
 function trophy(){
  const preview=$('#studioApp #trophyPreview');
  if(!preview||preview.querySelector('.biglwa-default-trophy-image'))return;
  const img=make(images.trophy,'Minecraft-style Achievement Made! The Beginning? banner','biglwa-default-trophy-image');
  preview.prepend(img); // Keep saved trophy counts and entries visible beneath the default.
 }
 function imageFallback(frame){
  if(frames.has(frame))return;
  const parent=frame.parentElement;
  if(!parent)return;
  const isMini=frame.id==='biglwaStudioMiniMap';
  const holder=document.createElement('div');
  holder.className='biglwa-map-error-fallback';
  holder.hidden=true;
  const img=make(images.map,'Tiny tropical island with palm trees in blue water','biglwa-map-island-image');
  const note=document.createElement('span');note.className='biglwa-map-error-note';note.textContent='Map could not open. Your saved pins are safe.';
  const retry=document.createElement('button');retry.type='button';retry.className='biglwa-map-image-retry';retry.textContent='Retry map ↻';
  holder.append(img,note,retry);
  parent.insertBefore(holder,frame.nextSibling);
  let timer=null;
  const state={holder,frame,ready:false,timer:null,failed:false};
  frames.set(frame,state);
  const setFailed=()=>{
   if(!frame.isConnected||state.ready)return;
   state.failed=true;
   holder.hidden=false;frame.classList.add('biglwa-map-unavailable');
  };
  const ready=()=>{
   state.ready=true;state.failed=false;
   clearTimeout(state.timer);
   holder.hidden=true;frame.classList.remove('biglwa-map-unavailable');
  };
  state.fail=setFailed;state.ok=ready;
  const wait=()=>{clearTimeout(state.timer);state.timer=setTimeout(setFailed,isMini?18000:22000)};
  state.wait=wait;
  frame.addEventListener('load',()=>{if(!state.ready)wait()});
  frame.addEventListener('error',setFailed);
  retry.addEventListener('click',()=>{
   state.ready=false;state.failed=false;holder.hidden=true;
   frame.classList.remove('biglwa-map-unavailable');frame.src=frame.src;
   wait();
  });
  wait();
 }
 window.addEventListener('message',event=>{
  if(event.origin!==location.origin||!event.data||typeof event.data!=='object')return;
  if(!['biglwa:map-ready','biglwa:map-failed'].includes(event.data.type))return;
  for(const [frame,state] of frames){
   if(event.source!==frame.contentWindow)continue;
   if(event.data.type==='biglwa:map-ready')state.ok();
   else{state.ready=false;clearTimeout(state.timer);state.fail();}
   break;
  }
 });
 let queued=false;
 function refresh(){
  queued=false;
  archive();visualizr();trophy();
  const mini=$('#biglwaStudioMiniMap');
  if(mini)imageFallback(mini);
  const full=$('#biglwaMapApp');
  if(full)imageFallback(full);
  for(const [frame,state] of frames)if(!frame.isConnected){clearTimeout(state.timer);frames.delete(frame)}
 }
 const schedule=()=>{
  if(queued)return;queued=true;
  (window.requestAnimationFrame||window.setTimeout)(refresh);
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{
  refresh();
  new MutationObserver(mutations=>{
   if(mutations.some(m=>m.type==='childList'&&[...m.addedNodes].some(n=>n.nodeType===1&&!n.classList?.contains('biglwa-map-error-fallback')&&!n.classList?.contains('biglwa-default-trophy-image'))))schedule();
  }).observe(document.querySelector('#studioApp')||document.body,{childList:true,subtree:true});
 },{once:true});
 else{
  refresh();
  new MutationObserver(mutations=>{
   if(mutations.some(m=>m.type==='childList'&&[...m.addedNodes].some(n=>n.nodeType===1&&!n.classList?.contains('biglwa-map-error-fallback')&&!n.classList?.contains('biglwa-default-trophy-image'))))schedule();
  }).observe(document.querySelector('#studioApp')||document.body,{childList:true,subtree:true});
 }
})();