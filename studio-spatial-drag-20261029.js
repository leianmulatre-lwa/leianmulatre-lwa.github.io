/* Spatial Studio drag: handles can drop into occupied or empty grid cells.
   This is additive; the existing Alt+arrow reordering and red dock stay intact. */
(()=>{'use strict';
 if(window.__biglwaSpatialDragV1)return;window.__biglwaSpatialDragV1=true;
 const selector='#studioApp .masonry > [data-widget-id]';
 const owner=()=>String(window.__biglwaIdentity?.uid||'').trim();
 const allowed=()=>!!owner()&&!window.__biglwaPublicStorageView&&!document.documentElement.classList.contains('biglwa-preview-mode');
 const columns=()=>matchMedia('(max-width:620px)').matches?1:matchMedia('(max-width:980px)').matches?2:4;
 let active=null;
 const status=text=>{
   const target=document.querySelector('#biglwaStudioOrderStatus');
   if(target)target.textContent=text;
 };
 const getCards=parent=>[...parent.children].filter(el=>el.dataset.widgetId&&el.isConnected&&!el.classList.contains('widget-is-minimized'));
 const cellFromPointer=(parent,x,y,existing)=>{
   const rect=parent.getBoundingClientRect(),count=columns();
   const col=Math.max(1,Math.min(count,Math.floor((x-rect.left)/Math.max(1,rect.width/count))+1));
   const rows=[...new Set(existing.map(a=>Math.round(a.rect.top)))].sort((a,b)=>a-b);
   let row=1;
   if(rows.length){
     const first=rows[0],last=rows[rows.length-1];
     if(y>last+Math.max(85,(existing.filter(a=>Math.abs(a.rect.top-last)<24)[0]?.rect.height||120)*.6)){
       row=rows.length+Math.max(1,Math.ceil((y-last)/Math.max(100,existing[0]?.rect.height||160)));
     }else{
       let nearest=Infinity;
       rows.forEach((top,i)=>{const distance=Math.abs(y-top);if(distance<nearest){nearest=distance;row=i+1}});
     }
   }
   return {row:Math.min(50,row),col};
 };
 const slotIndex=(row,col,count)=>(row-1)*count+col-1;
 const assign=(parent,moving,chosen,measured)=>{
   const count=columns(),cards=getCards(parent),taken=new Set();
   // Preserve all other cards' reading order. Dropping into an occupied
   // cell inserts there; dropping into an empty cell leaves the gap intact.
   const existing=cards.filter(el=>el!==moving).map(el=>{
     const measuredRow=measured.find(item=>item.el===el);
     const pos=el.dataset.biglwaGridPosition?.split(':').map(Number);
     const row=pos&&pos.length===2&&pos[0]>0?pos[0]:measuredRow?.row||1;
     const col=pos&&pos.length===2&&pos[1]>0?Math.min(count,pos[1]):measuredRow?.col||1;
     return {el,index:slotIndex(row,col,count)};
   }).sort((a,b)=>a.index-b.index);
   // Reinsert from the chosen destination, pushing only colliding cells.
   const dest=slotIndex(chosen.row,chosen.col,count);
   const slots=new Map([[dest,moving]]);taken.add(dest);
   for(const item of existing){
     let index=item.index;
     while(taken.has(index))index++;
     taken.add(index);slots.set(index,item.el);
   }
   [...slots].sort((a,b)=>a[0]-b[0]).forEach(([index,el])=>{
     const row=Math.floor(index/count)+1,col=index%count+1;
     el.dataset.biglwaGridPosition=row+':'+col;
     el.style.gridRowStart=String(row);
     el.style.gridColumnStart=String(col);
     parent.appendChild(el);
   });
   parent.classList.add('biglwa-free-layout');
   window.BigLWAStudioLayout?.save?.();
   status((moving.dataset.widgetLabel||moving.dataset.widgetId)+' moved to row '+chosen.row+', column '+chosen.col+'. Layout saved.');
 };
 function begin(event){
   if(!allowed()||event.button!==0||active)return;
   const handle=event.target.closest?.('[data-studio-drag-handle]');
   const widget=handle?.closest?.('[data-widget-id]');
   const parent=widget?.parentElement;
   if(!parent?.matches?.('#studioApp .masonry'))return;
   if(event.target.closest('input,textarea,select'))return;
   event.preventDefault();event.stopImmediatePropagation();
   const cards=getCards(parent).map(el=>({el,rect:el.getBoundingClientRect()}));
   const unique=[...new Set(cards.map(a=>Math.round(a.rect.top)))].sort((a,b)=>a-b);
   const count=columns(),r=parent.getBoundingClientRect();
   const measured=cards.map(a=>({...a,row:unique.findIndex(y=>Math.abs(y-a.rect.top)<3)+1,
     col:Math.max(1,Math.min(count,Math.floor((a.rect.left-r.left)/Math.max(1,r.width/count))+1))}));
   const original=widget.getBoundingClientRect();
   const ghost=widget.cloneNode(true);ghost.className=widget.className+' biglwa-spatial-ghost';
   ghost.style.cssText='position:fixed!important;z-index:100000!important;pointer-events:none!important;opacity:.8!important;box-sizing:border-box!important;width:'+original.width+'px!important;height:'+original.height+'px!important;left:'+original.left+'px;top:'+original.top+'px;max-height:70vh!important;overflow:hidden!important;transform:none!important;';
   document.body.appendChild(ghost);
   const target=document.createElement('div');target.className='biglwa-spatial-target';
   target.setAttribute('aria-hidden','true');parent.append(target);
   const tail=document.createElement('div');tail.className='biglwa-spatial-tail';
   tail.setAttribute('aria-hidden','true');parent.append(tail);
   parent.classList.add('biglwa-spatial-dragging');
   active={widget,parent,ghost,target,tail,measured,initial:original,offsetX:event.clientX-original.left,offsetY:event.clientY-original.top,chosen:cellFromPointer(parent,event.clientX,event.clientY,measured),pointerId:event.pointerId};
   handle.setPointerCapture?.(event.pointerId);
   update(event);
 }
 function update(event){
   const a=active;if(!a||a.pointerId!==event.pointerId)return;
   event.preventDefault();
   a.ghost.style.left=(event.clientX-a.offsetX)+'px';
   a.ghost.style.top=(event.clientY-a.offsetY)+'px';
   a.chosen=cellFromPointer(a.parent,event.clientX,event.clientY,a.measured);
   const count=columns(),rect=a.parent.getBoundingClientRect(),colWidth=rect.width/count;
   // A fixed, noninteractive placeholder works even in a completely empty row.
   const chosen=a.chosen;
   a.target.style.left=(rect.left+(chosen.col-1)*colWidth+4)+'px';
   const rowTop=a.measured.find(item=>item.row===chosen.row)?.rect.top;
   const last=Math.max(rect.top,...a.measured.map(item=>item.rect.bottom));
   a.target.style.top=(rowTop??(last+(chosen.row-a.measured.reduce((n,item)=>Math.max(n,item.row),0)-1)*110+10))+'px';
   a.target.style.width=Math.max(40,colWidth-8)+'px';
   a.target.style.height=Math.max(56,Math.min(120,a.initial.height))+'px';
 }
 function end(event,cancel=false){
   const a=active;if(!a||a.pointerId!==event.pointerId)return;
   event.preventDefault();event.stopImmediatePropagation();
   active=null;
   a.ghost.remove();a.target.remove();a.tail.remove();
   a.parent.classList.remove('biglwa-spatial-dragging');
   const rect=a.parent.getBoundingClientRect();
   // Ignore drops into sidebar, but accept open grid space and its empty tail.
   const accepted=!cancel&&event.clientX>=rect.left-28&&event.clientX<=rect.right+28&&
     event.clientY>=rect.top-25&&event.clientY<=rect.bottom+220;
   if(accepted)assign(a.parent,a.widget,a.chosen,a.measured);
 }
 window.addEventListener('pointerdown',begin,true);
 window.addEventListener('pointermove',update,true);
 window.addEventListener('pointerup',e=>end(e),true);
 window.addEventListener('pointercancel',e=>end(e,true),true);
 window.addEventListener('blur',()=>{if(active){const a=active;active=null;a.ghost.remove();a.target.remove();a.tail.remove();a.parent.classList.remove('biglwa-spatial-dragging')}});
 // Snapshot restore sets individual coordinates. Make the grid honor them
 // only for owners with a recorded free-form layout.
 const sync=()=>{
   const app=document.querySelector('#studioApp');if(!app||!allowed())return;
   const parent=app.querySelector('.masonry');if(!parent)return;
   parent.classList.toggle('biglwa-free-layout',!!parent.querySelector('[data-biglwa-grid-position]'));
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});else sync();
 window.addEventListener('biglwa:studio-collapse-applied',sync);
})();