/* Decorative video never participates in authentication or module readiness. */
(()=>{
 const SELECTOR='#biglwaStartupScreen,#studioApp .lwa-curtain[data-lwa-curtain="module"]';
 const SOURCE='/super-8mm-film-effect-free-overlays-2160-ytshorts.savetube.me.mp4';
 const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
 const data=window.matchMedia('(prefers-reduced-data: reduce)');
 const records=new Map(),failed=new WeakSet();
 if(!document.getElementById('biglwaSuper8Styles')){
  const link=document.createElement('link');link.id='biglwaSuper8Styles';link.rel='stylesheet';link.href='/studio-loading-super8-20261128.css?v=1';document.head.append(link);
 }
 let pending=0,observer=null,disposed=false;
 function allowed(){return !document.hidden&&!motion.matches&&!data.matches&&!navigator.connection?.saveData}
 function visible(node){
  if(!node.isConnected||node.hidden||node.getAttribute('aria-hidden')==='true')return false;
  const style=getComputedStyle(node);
  return style.display!=='none'&&style.visibility!=='hidden'&&style.opacity!=='0'&&node.getClientRects().length>0;
 }
 function remove(node){
  const state=records.get(node);if(!state)return;
  records.delete(node);clearTimeout(state.timer);
  if(state.video){state.video.pause();state.video.removeAttribute('src');state.video.remove();state.video.load()}
 }
 function attach(node){
  if(records.has(node)||failed.has(node))return;
  const state={timer:0,video:null};records.set(node,state);
  // Brief curtains remain instant and never need to fetch a 4K decoration.
  state.timer=setTimeout(()=>{
   if(records.get(node)!==state||!allowed()||!visible(node)){remove(node);return}
   const video=document.createElement('video');state.video=video;
   video.className='biglwa-super8-overlay';video.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;pointer-events:none';video.setAttribute('aria-hidden','true');
   video.tabIndex=-1;video.muted=true;video.defaultMuted=true;video.loop=true;
   video.autoplay=true;video.playsInline=true;video.preload='none';video.disablePictureInPicture=true;
   video.addEventListener('playing',()=>video.classList.add('is-playing'),{once:true});
   video.addEventListener('error',()=>{if(records.get(node)===state){failed.add(node);remove(node)}},{once:true});
   node.prepend(video);video.src=SOURCE;
   video.play().catch(()=>{if(records.get(node)===state){failed.add(node);remove(node)}});
  },240);
 }
 function sync(){
  pending=0;if(disposed)return;
  for(const node of records.keys())if(!allowed()||!visible(node))remove(node);
  if(!allowed())return;
  for(const node of document.querySelectorAll(SELECTOR))if(visible(node))attach(node);else failed.delete(node);
 }
 function schedule(){if(!disposed&&!pending)pending=requestAnimationFrame(sync)}
 function relevant(m){
  if(m.type==='attributes')return m.target.matches?.(SELECTOR)||m.target.id==='studioApp'||m.target.classList?.contains('module-shell');
  return [...m.addedNodes,...m.removedNodes].some(n=>n.nodeType===1&&(n.matches?.(SELECTOR)||n.querySelector?.(SELECTOR)));
 }
 function start(){
  if(disposed)return;
  observer=new MutationObserver(ms=>{if(ms.some(relevant))schedule()});
  observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','aria-hidden','class','style']});
  sync();
 }
 function stop(){
  disposed=true;observer?.disconnect();if(pending)cancelAnimationFrame(pending);
  for(const node of records.keys())remove(node);
  document.removeEventListener('visibilitychange',schedule);
  window.removeEventListener('biglwa:startup-revealed',schedule);
  motion.removeEventListener?.('change',schedule);data.removeEventListener?.('change',schedule);
  navigator.connection?.removeEventListener?.('change',schedule);
  window.removeEventListener('pagehide',stop);
 }
 // The legacy bootstrap writes a fresh document; replace any previous observer.
 window.__biglwaSuper8Cleanup?.();window.__biglwaSuper8Cleanup=stop;
 document.addEventListener('visibilitychange',schedule);window.addEventListener('biglwa:startup-revealed',schedule);
 motion.addEventListener?.('change',schedule);data.addEventListener?.('change',schedule);
 navigator.connection?.addEventListener?.('change',schedule);
 window.addEventListener('pagehide',stop,{once:true});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
 else start();
 // First-paint markup may already exist when the async script arrives.
 if(document.readyState==='loading')sync();
})();
