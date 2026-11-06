/* Studio-only behavior: keep real playback and widget routes unchanged. */
(()=>{
 'use strict';
 if(window.__biglwaStudioCoherenceNov05)return;
 window.__biglwaStudioCoherenceNov05=true;
 function reconcileStream(){
  const card=document.querySelector('#studioApp #stream');
  if(!card)return;
  const screen=card.querySelector('.stream-screen');
  if(!screen)return;
  // The card already has its full Open Stream CTA. The thumbnail gets only Dock stream.
  const old=card.querySelectorAll('.stream-preview-return');
  old.forEach(button=>{button.hidden=true;button.setAttribute('aria-hidden','true');button.tabIndex=-1});
  let dock=screen.querySelector('.bl-studio-dock-stream');
  if(!dock){
   dock=document.createElement('button');
   dock.type='button';dock.className='bl-studio-dock-stream';
   dock.textContent='Dock stream';dock.setAttribute('aria-label','Dock the current Stream video while browsing');
   dock.addEventListener('click',event=>{
    event.preventDefault();event.stopPropagation();
    const api=window.BigLWAStreamGuide;
    if(api&&typeof api.dock==='function'&&api.dock())return;
    dock.textContent='Start a channel first';
    window.setTimeout(()=>{if(dock.isConnected)dock.textContent='Dock stream'},1700);
   });
   screen.appendChild(dock);
  }
 }
 let pending=false;
 function schedule(){
  if(pending)return;
  pending=true;
  requestAnimationFrame(()=>{pending=false;reconcileStream()});
 }
 const start=()=>{
  reconcileStream();
  const root=document.querySelector('#studioApp');
  if(!root)return;
  new MutationObserver(records=>{
   if(records.some(record=>[...record.addedNodes].some(node=>node.nodeType===1&&(
     node.matches?.('#stream,.stream-screen,#biglwaPersistentStreamPlayer')||
     node.querySelector?.('#stream,.stream-screen')||
     node.parentElement?.closest?.('#stream')
   ))))schedule();
  }).observe(root,{childList:true,subtree:true});
  document.addEventListener('biglwa:stream-updated',schedule);
  document.addEventListener('biglwa:module-changed',schedule);
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
 else start();
})();
