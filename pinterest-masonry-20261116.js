/* BIG LWA / Boards · dense natural-height masonry.
 * Source order remains unchanged; the first row is filled left-to-right,
 * and later pins move to the shortest available column, Pinterest-style.
 * Reflow responds to image loads, window resizing, and changed board contents.
 */
(()=>{'use strict';
 if(window.__biglwaPinterestMasonry20261116)return;
 window.__biglwaPinterestMasonry20261116=true;
 const roots=new WeakMap();
 const selectors='.pinterest-pin-grid,.pinterest-owned-grid';
 const isElement=n=>n&&n.nodeType===1;
 function attach(grid){
  if(roots.has(grid))return;
  let queued=0,previousWidth=0,disposed=false;
  const cardSelector=grid.matches('.pinterest-owned-grid')?'.pn-owned-pin-choice':'.pinterest-pin';
  const gap=12;
  const cardResize=new ResizeObserver(()=>schedule());
  const gridResize=new ResizeObserver(()=>schedule());
  const cardsSeen=new WeakSet();
  const schedule=()=>{
   if(disposed||queued)return;
   queued=requestAnimationFrame(()=>{queued=0;layout()});
  };
  function clear(){
   grid.style.removeProperty('height');
   grid.style.removeProperty('position');
   grid.style.removeProperty('display');
   for(const el of grid.querySelectorAll(':scope > '+cardSelector)){
    ['position','width','left','top','margin','transform','z-index'].forEach(p=>el.style.removeProperty(p));
   }
  }
  function layout(){
   if(!grid.isConnected){dispose();return}
   if(grid.hidden||grid.closest('[hidden]')||getComputedStyle(grid).display==='none'){
    grid.style.removeProperty('height');return;
   }
   const width=grid.clientWidth;
   if(width<90)return;
   const cards=[...grid.children].filter(el=>el.matches(cardSelector)&&!el.hidden);
   if(!cards.length){grid.style.setProperty('height','0px','important');return}
   const minWidth=width<530?132:164;
   const count=Math.max(1,Math.min(9,Math.floor((width+gap)/(minWidth+gap))));
   const itemWidth=(width-(count-1)*gap)/count;
   const heights=Array(count).fill(0);
   grid.style.setProperty('display','block','important');
   grid.style.setProperty('position','relative','important');
   grid.style.setProperty('width','100%','important');
   // Assign in DOM order: first N items go to columns 0..N-1.
   cards.forEach((card,index)=>{
    const column=index<count?index:heights.indexOf(Math.min(...heights));
    const x=column*(itemWidth+gap);
    card.style.setProperty('position','absolute','important');
    card.style.setProperty('left',x.toFixed(2)+'px','important');
    card.style.setProperty('top',heights[column].toFixed(2)+'px','important');
    card.style.setProperty('width',itemWidth.toFixed(2)+'px','important');
    card.style.setProperty('margin','0','important');
    card.style.setProperty('transform','none','important');
    card.style.setProperty('box-sizing','border-box','important');
    card.style.setProperty('z-index','1','important');
    const height=Math.max(72,Math.ceil(card.getBoundingClientRect().height));
    heights[column]+=height+gap;
    if(!cardsSeen.has(card)){
     cardsSeen.add(card);cardResize.observe(card);
     for(const img of card.querySelectorAll('img')){
      if(!img.complete)img.addEventListener('load',schedule,{once:true});
      img.addEventListener('error',schedule,{once:true});
     }
    }
   });
   grid.style.setProperty('height',Math.max(0,Math.max(...heights)-gap).toFixed(2)+'px','important');
   previousWidth=width;
  }
  const observer=new MutationObserver(records=>{
   if(records.some(r=>r.type==='childList'))schedule();
  });
  observer.observe(grid,{childList:true});
  gridResize.observe(grid);
  function dispose(){
   disposed=true;if(queued)cancelAnimationFrame(queued);
   observer.disconnect();cardResize.disconnect();gridResize.disconnect();
   clear();roots.delete(grid);
  }
  roots.set(grid,{schedule,dispose});
  schedule();
 }
 let scanQueued=0;
 function scan(){
  scanQueued=0;
  document.querySelectorAll('#studioApp #pinterestBoards '+selectors.split(',').join(',#studioApp #pinterestBoards ')).forEach(attach);
 }
 function queueScan(){if(scanQueued)return;scanQueued=requestAnimationFrame(scan)}
 const watcher=new MutationObserver(changes=>{
  if(changes.some(change=>[...change.addedNodes].some(isElement)))queueScan();
 });
 function init(){
  queueScan();
  const app=document.querySelector('#studioApp')||document.body;
  watcher.observe(app,{childList:true,subtree:true});
  window.addEventListener('resize',()=>queueScan(),{passive:true});
  document.addEventListener('biglwa:pinterest-preview-updated',queueScan);
  document.addEventListener('biglwa:module-open',queueScan);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();