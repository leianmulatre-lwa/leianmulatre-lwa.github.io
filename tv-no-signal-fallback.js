/* Do not download or mirror provider video. Show the owner's supplied TV
   colour bars only when an image or in-site video fails to load. */
(()=>{'use strict';
 if(window.__biglwaSignalFallback)return;window.__biglwaSignalFallback=true;
 const fallback='/assets/tv-no-signal.svg';
 function failMedia(target){
  if(!target||target.dataset?.lwaSignalFallback==='1')return;
  if(target.tagName==='IMG'){
   const src=target.currentSrc||target.getAttribute('src')||'';
   if(!src||src.includes('tv-no-signal.svg'))return;
   target.dataset.lwaSignalFallback='1';
   target.classList.add('lwa-tv-no-signal-fallback');
   target.src=fallback;
   target.alt=(target.alt?.trim()?target.alt+' — ':'')+'No signal: image unavailable';
  }else if(target.tagName==='VIDEO'){
   target.dataset.lwaSignalFallback='1';
   target.classList.add('lwa-tv-no-signal-fallback');
   target.poster=fallback;
   target.setAttribute('aria-label',(target.getAttribute('aria-label')||'Video')+' — playback unavailable');
  }
 }
 document.addEventListener('error',event=>{
  if(event.target?.matches?.('img,video'))failMedia(event.target);
 },true);
 document.addEventListener('biglwa:module-open',()=>{
  document.querySelectorAll('img').forEach(img=>{
   if(img.complete&&img.naturalWidth===0)failMedia(img);
  });
 });
})();
