/* The film layer is born with the curtain; only playback is optional. */
(()=>{
 const SELECTOR='#biglwaStartupScreen';
 const POSTER='/assets/loading-super8-poster-20261128.webp',SOURCE='/assets/loading-super8-20261128.webm';
 const motion=window.matchMedia('(prefers-reduced-motion: reduce)'),data=window.matchMedia('(prefers-reduced-data: reduce)');
 const records=new Map();let pending=0,observer,disposed=false;
 if(!document.getElementById('biglwaSuper8Styles')){
  const link=document.createElement('link');link.id='biglwaSuper8Styles';link.rel='stylesheet';link.href='/studio-loading-super8-20261128.css?v=5';document.head.append(link);
 }
 const allowed=()=>!document.hidden&&!motion.matches&&!data.matches&&!navigator.connection?.saveData;
 function visible(node){
  if(!node.isConnected||node.hidden||node.getAttribute('aria-hidden')==='true')return false;
  const s=getComputedStyle(node);return s.display!=='none'&&s.visibility!=='hidden'&&s.opacity!=='0'&&node.getClientRects().length>0;
 }
 function attach(node){
  if(records.has(node))return records.get(node);
  let video=node.querySelector(':scope > .biglwa-super8-overlay');
  if(!video){video=document.createElement('video');video.className='biglwa-super8-overlay';video.poster=POSTER;video.setAttribute('aria-hidden','true');video.tabIndex=-1;node.prepend(video)}
  video.muted=true;video.defaultMuted=true;video.loop=true;video.playsInline=true;video.preload='none';video.disablePictureInPicture=true;
  const state={video,failed:false,active:false};records.set(node,state);
  const fallback=()=>{if(records.get(node)!==state||!state.active)return;state.failed=true;pause(state)};
  video.addEventListener('error',fallback);
  state.cleanup=()=>video.removeEventListener('error',fallback);
  return state;
 }
 function pause(state){
  if(!state.active)return;state.active=false;
  state.video.pause();state.video.removeAttribute('src');state.video.load();
 }
 function sync(){
  pending=0;if(disposed)return;
  for(const stray of document.querySelectorAll('.biglwa-super8-overlay'))if(!stray.closest(SELECTOR)){stray.pause?.();stray.removeAttribute('src');stray.remove();stray.load?.()}
  for(const [node,state] of records){if(!node.isConnected){pause(state);state.cleanup();records.delete(node)}}
  for(const node of document.querySelectorAll(SELECTOR)){
   const state=attach(node);
   if(!visible(node)||!allowed()){pause(state);continue}
   if(!state.active&&!state.failed){state.active=true;state.video.src=SOURCE;state.video.play().catch(()=>{if(state.active){state.failed=true;pause(state)}})}
  }
 }
 function schedule(){if(!disposed&&!pending)pending=requestAnimationFrame(sync)}
 function relevant(m){return m.type==='attributes'?m.target.matches?.(SELECTOR)||m.target.id==='studioApp'||m.target.classList?.contains('module-shell'):[...m.addedNodes,...m.removedNodes].some(n=>n.nodeType===1&&(n.matches?.(SELECTOR+',.biglwa-super8-overlay')||n.querySelector?.(SELECTOR+',.biglwa-super8-overlay')))}
 function start(){if(disposed)return;observer=new MutationObserver(ms=>{if(ms.some(relevant))schedule()});observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','aria-hidden','class','style']});sync()}
 function stop(){disposed=true;observer?.disconnect();if(pending)cancelAnimationFrame(pending);for(const state of records.values()){pause(state);state.cleanup()}records.clear();document.removeEventListener('visibilitychange',schedule);window.removeEventListener('biglwa:startup-revealed',schedule);motion.removeEventListener?.('change',schedule);data.removeEventListener?.('change',schedule);navigator.connection?.removeEventListener?.('change',schedule);window.removeEventListener('pagehide',stop)}
 window.__biglwaSuper8Cleanup?.();window.__biglwaSuper8Cleanup=stop;
 document.addEventListener('visibilitychange',schedule);window.addEventListener('biglwa:startup-revealed',schedule);motion.addEventListener?.('change',schedule);data.addEventListener?.('change',schedule);navigator.connection?.addEventListener?.('change',schedule);window.addEventListener('pagehide',stop,{once:true});
 if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',start,{once:true});sync()}else start();
})();
