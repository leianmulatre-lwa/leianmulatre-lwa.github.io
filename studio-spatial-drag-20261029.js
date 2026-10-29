/* BIG LWA Studio spatial Pinterest flow.
   Explicit drag selects column and insertion order; a measured 4px-row CSS
   grid stacks cards independently. Collapsing a widget never reserves the
   height of its taller neighbors, and no card content is remounted. */
(()=>{'use strict';
 if(window.__biglwaSpatialDragV2)return;window.__biglwaSpatialDragV2=true;
 const selector='#studioApp .masonry > [data-widget-id]';
 const owner=()=>String(window.__biglwaIdentity?.uid||'').trim();
 const allowed=()=>!!owner()&&!window.__biglwaPublicStorageView&&!document.documentElement.classList.contains('biglwa-preview-mode');
 const columns=()=>{
  const matches=query=>typeof window.matchMedia==='function'&&window.matchMedia(query).matches;
  return matches('(max-width:620px)')?1:matches('(max-width:980px)')?2:4;
 };
 const ROW_PX=4,GAP_PX=14;
 const visible=el=>el.dataset.widgetId&&el.isConnected&&!el.hidden&&!el.classList.contains('widget-is-minimized')&&
  window.getComputedStyle(el).display!=='none';
 const getCards=parent=>[...parent.children].filter(visible);
 const slot=el=>{
  const m=/^(\d+):(\d+)$/.exec(el.dataset.biglwaGridPosition||'');
  return m?{row:Math.max(1,Number(m[1])),col:Math.max(1,Number(m[2]))}:null;
 };
 const visualColumn=(col,count)=>((col-1)%count)+1;
 let active=null,queued=false,parentObserver=null,resizeObserver=null,observed=new Set(),watchedParent=null,lastWidth=0;
 const status=text=>{const node=document.querySelector('#biglwaStudioOrderStatus');if(node)node.textContent=text};
 const raf=fn=>typeof window.requestAnimationFrame==='function'?window.requestAnimationFrame(fn):window.setTimeout(fn,0);
 const schedule=()=>{if(queued)return;queued=true;raf(()=>{queued=false;sync()})};
 const group=(parent,count)=>{
  const buckets=Array.from({length:count},()=>[]);
  const cards=getCards(parent);
  cards.forEach((el,index)=>{
   const pos=slot(el);
   if(pos){
    buckets[visualColumn(pos.col,count)-1].push({el,row:pos.row,index});
   }else{
    // New widgets enter the shortest existing column, not a global row.
    const lengths=buckets.map(b=>b.reduce((sum,item)=>sum+Math.max(50,item.el.getBoundingClientRect().height||100)+GAP_PX,0));
    const col=lengths.indexOf(Math.min(...lengths));
    buckets[col].push({el,row:1e7+index,index});
   }
  });
  buckets.forEach(items=>items.sort((a,b)=>a.row-b.row||a.index-b.index));
  return buckets;
 };
 const flow=parent=>{
  if(!parent.classList.contains('biglwa-free-layout'))return;
  const count=columns(),buckets=group(parent,count);
  buckets.forEach((items,col)=>{
   let start=1;
   items.forEach(({el})=>{
    const measured=el.getBoundingClientRect().height||el.offsetHeight||46;
    const span=Math.max(12,Math.ceil((measured+GAP_PX)/ROW_PX));
    if(el.style.gridColumnStart!==String(col+1))el.style.gridColumnStart=String(col+1);
    if(el.style.gridRowStart!==String(start))el.style.gridRowStart=String(start);
    if(el.style.gridRowEnd!=='span '+span)el.style.gridRowEnd='span '+span;
    start+=span;
   });
  });
 };
 const watch=parent=>{
  if(parent===watchedParent)return;
  parentObserver?.disconnect();resizeObserver?.disconnect();observed.clear();
  watchedParent=parent;lastWidth=parent.getBoundingClientRect().width;
  if(typeof window.ResizeObserver==='function'){
   resizeObserver=new window.ResizeObserver(entries=>{
    if(entries.some(entry=>entry.target!==parent)){schedule();return}
    const width=parent.getBoundingClientRect().width;
    if(Math.abs(width-lastWidth)>.5){lastWidth=width;schedule()}
   });
   resizeObserver.observe(parent);
  }
  parentObserver=new MutationObserver(records=>{
   if(records.some(r=>r.type==='childList'&&r.target===parent||
      r.type==='attributes'&&r.target.matches?.('[data-widget-id]')))schedule();
  });
  parentObserver.observe(parent,{childList:true,attributes:true,attributeFilter:['class','data-biglwa-grid-position'],subtree:true});
 };
 const sync=()=>{
  const app=document.querySelector('#studioApp');if(!app||!allowed())return;
  const parent=app.querySelector('.masonry');if(!parent)return;
  watch(parent);
  const hasSlots=!!parent.querySelector('[data-biglwa-grid-position]');
  parent.classList.toggle('biglwa-free-layout',hasSlots);
  if(!hasSlots)return;
  if(resizeObserver){
   for(const el of getCards(parent))if(!observed.has(el)){observed.add(el);resizeObserver.observe(el)}
   for(const el of [...observed])if(!el.isConnected||el.parentElement!==parent){resizeObserver.unobserve(el);observed.delete(el)}
  }
  if(!active)flow(parent);
 };
 const assign=(parent,moving,chosen)=>{
  const count=columns(),buckets=group(parent,count);
  for(const bucket of buckets){const i=bucket.findIndex(item=>item.el===moving);if(i!==-1)bucket.splice(i,1)}
  const col=Math.max(0,Math.min(count-1,chosen.col-1)),bucket=buckets[col];
  bucket.splice(Math.max(0,Math.min(bucket.length,chosen.index)),0,{el:moving});
  // Convert old global-grid row numbers to dense per-column insertion order.
  // This deliberately does not move the widget's DOM *content* out of masonry.
  const reading=[];
  const max=Math.max(0,...buckets.map(items=>items.length));
  for(let row=0;row<max;row++)for(let c=0;c<count;c++){
   const item=buckets[c][row];if(!item)continue;
   item.el.dataset.biglwaGridPosition=(row+1)+':'+(c+1);
   reading.push(item.el);
  }
  reading.forEach(el=>parent.appendChild(el));
  parent.classList.add('biglwa-free-layout');
  flow(parent);
  window.BigLWAStudioLayout?.save?.();
  status((moving.dataset.widgetLabel||moving.dataset.widgetId)+' moved to column '+chosen.col+', position '+(chosen.index+1)+'. Layout saved.');
 };
 const destination=(parent,x,y)=>{
  const rect=parent.getBoundingClientRect(),count=columns();
  const col=Math.max(1,Math.min(count,Math.floor(((x-rect.left)/Math.max(1,rect.width))*count)+1));
  const items=group(parent,count)[col-1];
  let index=items.findIndex(({el})=>{
   const r=el.getBoundingClientRect();
   return y<r.top+r.height/2;
  });
  if(index<0)index=items.length;
  return {col,index};
 };
 function update(event){
  const a=active;if(!a||a.pointerId!==event.pointerId)return;
  event.preventDefault();
  a.ghost.style.left=(event.clientX-a.offsetX)+'px';
  a.ghost.style.top=(event.clientY-a.offsetY)+'px';
  a.chosen=destination(a.parent,event.clientX,event.clientY);
  const rect=a.parent.getBoundingClientRect(),count=columns(),width=rect.width/count;
  const items=group(a.parent,count)[a.chosen.col-1];
  const next=items[a.chosen.index]?.el.getBoundingClientRect();
  const prev=items[a.chosen.index-1]?.el.getBoundingClientRect();
  const top=next?next.top-7:prev?prev.bottom+9:rect.top+8;
  a.target.style.left=(rect.left+(a.chosen.col-1)*width+4)+'px';
  a.target.style.top=top+'px';
  a.target.style.width=Math.max(40,width-8)+'px';
  a.target.style.height=Math.max(36,Math.min(70,a.initial.height))+'px';
 }
 function begin(event){
  if(!allowed()||event.button!==0||active)return;
  const handle=event.target.closest?.('[data-studio-drag-handle]'),widget=handle?.closest?.('[data-widget-id]');
  const parent=widget?.parentElement;
  if(!parent?.matches?.('#studioApp .masonry')||!visible(widget))return;
  if(event.target.closest('input,textarea,select'))return;
  event.preventDefault();event.stopImmediatePropagation();
  const original=widget.getBoundingClientRect();
  const ghost=widget.cloneNode(true);ghost.className=widget.className+' biglwa-spatial-ghost';
  ghost.style.cssText='position:fixed!important;z-index:100000!important;pointer-events:none!important;opacity:.8!important;box-sizing:border-box!important;width:'+original.width+'px!important;height:'+original.height+'px!important;left:'+original.left+'px;top:'+original.top+'px;max-height:70vh!important;overflow:hidden!important;transform:none!important;';
  document.body.appendChild(ghost);
  const target=document.createElement('div');target.className='biglwa-spatial-target';target.setAttribute('aria-hidden','true');parent.append(target);
  const tail=document.createElement('div');tail.className='biglwa-spatial-tail';tail.setAttribute('aria-hidden','true');parent.append(tail);
  parent.classList.add('biglwa-spatial-dragging');
  active={widget,parent,ghost,target,tail,initial:original,offsetX:event.clientX-original.left,offsetY:event.clientY-original.top,pointerId:event.pointerId,chosen:destination(parent,event.clientX,event.clientY)};
  handle.setPointerCapture?.(event.pointerId);
  update(event);
 }
 function end(event,cancel=false){
  const a=active;if(!a||a.pointerId!==event.pointerId)return;
  event.preventDefault();event.stopImmediatePropagation();
  active=null;
  a.ghost.remove();a.target.remove();a.tail.remove();a.parent.classList.remove('biglwa-spatial-dragging');
  const rect=a.parent.getBoundingClientRect();
  const accepted=!cancel&&event.clientX>=rect.left-28&&event.clientX<=rect.right+28&&event.clientY>=rect.top-25&&event.clientY<=rect.bottom+220;
  if(accepted){assign(a.parent,a.widget,a.chosen);schedule()}
 }
 window.addEventListener('pointerdown',begin,true);
 window.addEventListener('pointermove',update,true);
 window.addEventListener('pointerup',event=>end(event),true);
 window.addEventListener('pointercancel',event=>end(event,true),true);
 window.addEventListener('blur',()=>{
  if(!active)return;
  const a=active;active=null;a.ghost.remove();a.target.remove();a.tail.remove();a.parent.classList.remove('biglwa-spatial-dragging');
 });
 window.addEventListener('resize',schedule,{passive:true});
 window.addEventListener('biglwa:studio-collapse-applied',schedule);
 window.addEventListener('biglwa:customization-remote',schedule);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
})();
