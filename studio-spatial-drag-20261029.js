/* BIG LWA Studio — stable free-placement Pinterest columns, Oct 2026.
 * Never use a CSS grid track to infer a card's own height.
 * Each visible widget is measured at its final column width and positioned
 * below the preceding card in that column. Collapsed cards are included.
 * Dragging changes saved coordinates only, not the widget's mounted DOM. */
(()=>{'use strict';
 if(window.__biglwaSpatialDragV3)return;
 window.__biglwaSpatialDragV3=true;
 const APP='#studioApp',GAP=14,MIN_HEIGHT=46;
 const own=()=>String(window.__biglwaIdentity?.uid||'').trim();
 const mayEdit=()=>!!own()&&window.__biglwaPublicStorageView!==true
  &&!document.documentElement.classList.contains('biglwa-preview-mode');
 const findParent=()=>document.querySelector(APP+' .masonry');
 const raf=callback=>typeof requestAnimationFrame==='function'?requestAnimationFrame(callback):setTimeout(callback,0);
 const columns=()=>{
  const narrow=query=>typeof window.matchMedia==='function'&&window.matchMedia(query).matches;
  return narrow('(max-width:620px)')?1:narrow('(max-width:980px)')?2:4;
 };
 const isCard=el=>!!el?.dataset?.widgetId&&el.parentElement?.matches(APP+' .masonry');
 const shown=el=>isCard(el)&&!el.hidden&&!el.classList.contains('widget-is-minimized')
  &&getComputedStyle(el).display!=='none';
 const cards=parent=>[...parent.children].filter(shown);
 const slot=el=>{
  const match=/^(\d+):(\d+)$/.exec(el.dataset.biglwaGridPosition||'');
  if(!match)return null;
  const row=Number(match[1]),col=Number(match[2]);
  return row>=1&&row<=999&&col>=1&&col<=6?{row,col}:null;
 };
 const measured=el=>{
  // offsetHeight is untransformed and unaffected by hover scaling.
  // scrollHeight ensures content cannot paint outside the measured card.
  const rect=el.getBoundingClientRect();
  return Math.max(MIN_HEIGHT,Math.ceil(el.offsetHeight||0),
   Math.ceil(el.scrollHeight||0),Math.ceil(rect.height||0));
 };
 let drag=null,queued=false,observedParent=null,observer=null,resize=null,observedCards=new Set(),width=0;
 const note=message=>{const el=document.querySelector('#biglwaStudioOrderStatus');if(el)el.textContent=message};
 const schedule=()=>{if(queued)return;queued=true;raf(()=>{queued=false;layout()})};
 const bucketsFor=(parent,count)=>{
  const buckets=Array.from({length:count},()=>[]);
  const unassigned=[];
  cards(parent).forEach((el,index)=>{
   const pos=slot(el);
   if(!pos){unassigned.push({el,index});return}
   const col=((pos.col-1)%count+count)%count;
   buckets[col].push({el,row:pos.row,index});
  });
  buckets.forEach(items=>items.sort((a,b)=>a.row-b.row||a.index-b.index));
  // New/migrated widgets join the currently shortest column. Do not move
  // existing widgets or write layout to the account during hydration.
  unassigned.forEach(item=>{
   let chosen=0,smallest=Infinity;
   buckets.forEach((items,c)=>{
    const height=items.reduce((total,x)=>total+measured(x.el)+GAP,0);
    if(height<smallest){smallest=height;chosen=c}
   });
   buckets[chosen].push({...item,row:1000000+item.index});
  });
  return buckets;
 };
 const watch=parent=>{
  if(observedParent===parent)return;
  observer?.disconnect();resize?.disconnect();observedCards.clear();
  observedParent=parent;
  width=parent.getBoundingClientRect().width;
  if(typeof ResizeObserver==='function'){
   resize=new ResizeObserver(entries=>{
    // The parent height changes during every layout; only WIDTH matters.
    if(entries.some(entry=>entry.target!==parent)){schedule();return}
    const next=parent.getBoundingClientRect().width;
    if(Math.abs(next-width)>1){width=next;schedule()}
   });
   resize.observe(parent);
  }
  observer=new MutationObserver(records=>{
   if(records.some(r=>(r.type==='childList'&&r.target===parent)||
    (r.type==='attributes'&&r.target.parentElement===parent)))schedule();
  });
  observer.observe(parent,{childList:true,subtree:true,attributes:true,attributeFilter:['class','data-biglwa-grid-position','hidden']});
 };
 function resetLayout(parent){
  parent.classList.remove('biglwa-free-layout');
  parent.style.removeProperty('height');
  for(const el of [...parent.children].filter(el=>isCard(el)||el.matches?.('.manifesto-card'))){
   for(const key of ['position','left','top','width','grid-row-start','grid-row-end','grid-column-start','grid-column-end'])
    el.style.removeProperty(key);
  }
 }
 function layout(){
  const parent=findParent();
  if(!parent||!mayEdit())return;
  // The module router hides Studio's masonry while other pages are open.
  // Never measure its 0px hidden box or write stale widths back into widgets.
  // A route-close event below schedules fresh measurements after Studio returns.
  const main=parent.closest('.main');
  if(main?.classList.contains('module-view')||!(parent.clientWidth||parent.getBoundingClientRect().width)||
     getComputedStyle(parent).display==='none')return;
  watch(parent);
  const enabled=!!parent.querySelector(':scope > [data-widget-id][data-biglwa-grid-position]');
  if(!enabled){if(parent.classList.contains('biglwa-free-layout'))resetLayout(parent);return}
  parent.classList.add('biglwa-free-layout');
  const count=columns();
  const total=Math.max(1,parent.clientWidth||parent.getBoundingClientRect().width||960);
  const columnWidth=Math.max(90,(total-GAP*(count-1))/count);
  const groups=bucketsFor(parent,count);
  // Width must be set BEFORE measuring height. The previous implementation
  // measured from self-referential grid-row spans and caused stacked overlays.
  for(const el of cards(parent)){
   el.style.setProperty('position','absolute','important');
   el.style.setProperty('width',columnWidth+'px','important');
   el.style.removeProperty('grid-row-start');
   el.style.removeProperty('grid-row-end');
   el.style.removeProperty('grid-column-start');
   el.style.removeProperty('grid-column-end');
   if(resize&&!observedCards.has(el)){observedCards.add(el);resize.observe(el)}
  }
  const guide=parent.querySelector(':scope > .manifesto-card.is-skeleton-open');
  let guideHeight=0;
  if(guide&&getComputedStyle(guide).display!=='none'){
   guide.style.setProperty('position','absolute','important');
   guide.style.setProperty('width',columnWidth+'px','important');
   guide.style.setProperty('left','0px','important');guide.style.setProperty('top','0px','important');
   // A scrollable Skeleton Key only reserves its PAINTED height; accordion
   // scrollHeight includes hidden content and would push widgets far away.
   guideHeight=Math.max(MIN_HEIGHT,Math.ceil(guide.offsetHeight||0),
    Math.ceil(guide.getBoundingClientRect().height||0))+GAP;
   if(resize&&!observedCards.has(guide)){observedCards.add(guide);resize.observe(guide)}
  }
  if(drag)return;
  let maxHeight=Math.max(0,guideHeight-GAP);
  groups.forEach((items,col)=>{
   let top=col===0?guideHeight:0;
   const left=col*(columnWidth+GAP);
   items.forEach(({el})=>{
    const height=measured(el);
    el.style.setProperty('left',left+'px','important');
    el.style.setProperty('top',top+'px','important');
    // No fixed widget height: actual content and yellow collapse determine it.
    top+=height+GAP;
   });
   maxHeight=Math.max(maxHeight,Math.max(0,top-GAP));
  });
  parent.style.setProperty('height',Math.ceil(maxHeight)+'px','important');
  for(const el of [...observedCards])
   if(!el.isConnected||el.parentElement!==parent||(!shown(el)&&el!==guide)){
    resize?.unobserve(el);observedCards.delete(el);
   }
 }
 const selection=(parent,x,y,moving)=>{
  const count=columns(),bounds=parent.getBoundingClientRect();
  const col=Math.max(0,Math.min(count-1,Math.floor((x-bounds.left)/Math.max(1,bounds.width)*count)));
  const siblings=bucketsFor(parent,count)[col].filter(v=>v.el!==moving);
  let index=siblings.findIndex(({el})=>{
   const r=el.getBoundingClientRect();
   return y<r.top+r.height/2;
  });
  if(index<0)index=siblings.length;
  return {col,index,siblings};
 };
 const setDropPreview=(a)=>{
  const box=a.parent.getBoundingClientRect();
  const count=columns(),gap=GAP,w=Math.max(90,(box.width-gap*(count-1))/count);
  const {col,index,siblings}=a.selection;
  const next=siblings[index]?.el.getBoundingClientRect();
  const prev=siblings[index-1]?.el.getBoundingClientRect();
  const top=next?next.top:prev?prev.bottom+gap:box.top;
  a.target.style.left=(box.left+col*(w+gap))+'px';
  a.target.style.top=top+'px';
  a.target.style.width=w+'px';
  // The target is ALWAYS as tall as the real moving widget.
  a.target.style.height=a.height+'px';
 };
 const move=e=>{
  const a=drag;if(!a||a.pointerId!==e.pointerId)return;
  e.preventDefault();
  a.ghost.style.left=e.clientX-a.dx+'px';
  a.ghost.style.top=e.clientY-a.dy+'px';
  a.selection=selection(a.parent,e.clientX,e.clientY,a.widget);
  setDropPreview(a);
 };
 const down=e=>{
  if(!mayEdit()||e.button!==0||drag)return;
  const handle=e.target.closest?.('[data-studio-drag-handle]');
  const widget=handle?.closest?.('[data-widget-id]');
  const parent=widget?.parentElement;
  if(!parent?.matches?.(APP+' .masonry')||!shown(widget))return;
  if(e.target.closest?.('input,textarea,select'))return;
  e.preventDefault();e.stopImmediatePropagation();
  layout();
  const r=widget.getBoundingClientRect(),height=measured(widget);
  const ghost=widget.cloneNode(true);
  ghost.className=widget.className+' biglwa-spatial-ghost';
  ghost.removeAttribute('id');ghost.removeAttribute('data-widget-id');
  ghost.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
  // Prevent duplicate embedded players from executing in the preview.
  ghost.querySelectorAll('iframe,video,audio').forEach(el=>el.replaceWith(document.createElement('div')));
  ghost.setAttribute('aria-hidden','true');
  ghost.style.cssText='position:fixed!important;display:block!important;z-index:100000!important;pointer-events:none!important;opacity:.89!important;box-sizing:border-box!important;width:'+r.width+'px!important;height:'+height+'px!important;max-height:none!important;left:'+r.left+'px;top:'+r.top+'px;transform:none!important;overflow:hidden!important;';
  document.body.appendChild(ghost);
  const target=document.createElement('div');
  target.className='biglwa-spatial-target';target.setAttribute('aria-hidden','true');
  document.body.appendChild(target);
  parent.classList.add('biglwa-spatial-dragging');
  widget.classList.add('biglwa-spatial-origin');
  drag={handle,widget,parent,ghost,target,height,pointerId:e.pointerId,dx:e.clientX-r.left,dy:e.clientY-r.top,
   selection:selection(parent,e.clientX,e.clientY,widget)};
  try{handle.setPointerCapture?.(e.pointerId)}catch{}
  move(e);
 };
 const cleanup=()=>{
  const a=drag;drag=null;if(!a)return null;
  a.ghost.remove();a.target.remove();
  a.widget.classList.remove('biglwa-spatial-origin');
  a.parent.classList.remove('biglwa-spatial-dragging');
  try{a.handle.releasePointerCapture?.(a.pointerId)}catch{}
  return a;
 };
 const commit=a=>{
  const count=columns();
  const groups=bucketsFor(a.parent,count).map(list=>list.filter(item=>item.el!==a.widget));
  groups[a.selection.col].splice(a.selection.index,0,{el:a.widget});
  groups.forEach((list,c)=>list.forEach(({el},index)=>{
   // Slot migration: old sparse (row,col) values are compacted by column.
   // Each card keeps its node, iframe, player, event handlers and current data.
   const pos=(index+1)+':'+(c+1);
   if(el.dataset.biglwaGridPosition!==pos)el.dataset.biglwaGridPosition=pos;
  }));
  layout();
  window.BigLWAStudioLayout?.save?.();
  note((a.widget.dataset.widgetLabel||a.widget.dataset.widgetId)+' moved to column '+(a.selection.col+1)+', position '+(a.selection.index+1)+'.');
 };
 const up=(e,cancel=false)=>{
  if(!drag||drag.pointerId!==e.pointerId)return;
  e.preventDefault();e.stopImmediatePropagation();
  const a=cleanup();
  const box=a.parent.getBoundingClientRect();
  if(!cancel&&e.clientX>=box.left-28&&e.clientX<=box.right+28&&e.clientY>=box.top-25&&e.clientY<=box.bottom+200)
   commit(a);
  schedule();
 };
 window.addEventListener('pointerdown',down,true);
 window.addEventListener('pointermove',move,true);
 window.addEventListener('pointerup',e=>up(e),true);
 window.addEventListener('pointercancel',e=>up(e,true),true);
 window.addEventListener('blur',()=>{if(drag){cleanup();schedule()}});
 window.addEventListener('resize',schedule,{passive:true});
 window.addEventListener('biglwa:studio-collapse-applied',schedule);
 window.addEventListener('biglwa:skeleton-layout-changed',schedule);
 window.addEventListener('biglwa:customization-remote',schedule);
 // Module navigation changes visibility and available width without a window
 // resize; always recalculate on return with the same saved card positions.
 document.addEventListener('biglwa:module-close',schedule);
 document.addEventListener('biglwa:module-open',schedule);
 window.addEventListener('pageshow',schedule);
 window.addEventListener('popstate',schedule);
 // Some media previews resize after loading, without changing their parent.
 document.addEventListener('load',e=>{
  if(e.target.closest?.(APP+' .masonry'))schedule();
 },true);
 if(document.readyState==='loading')
  document.addEventListener('DOMContentLoaded',schedule,{once:true});
 else schedule();
})();
