/* BIG LWA Orbit Space · lightweight original 2D star-warp treatment.
 * Visual reference only: https://github.com/o2bomb/space-warp
 * No Three.js, no imports, no networks, and no interaction interception.
 */
(()=>{'use strict';
 if(window.BigLWAOrbitSpace)return;
 const selectors=[
  ['#studioApp #orbit','widget',68],
  ['#studioApp #moduleWorkspace[data-module-key="orbit"]','page',115]
 ];
 const layers=new Map();
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');
 let frame=0,queued=false,last=0;
 const rand=Math.random;
 function seed(star,far=false){
  const angle=rand()*Math.PI*2,radial=Math.sqrt(rand());
  star.x=Math.cos(angle)*radial;star.y=Math.sin(angle)*radial;
  star.z=far?1.15:.15+rand();
  star.alpha=.3+rand()*.65;
  star.tint=rand();
 }
 function size(layer){
  if(!layer.target.isConnected)return;
  const rect=layer.target.getBoundingClientRect();
  const w=Math.max(0,Math.round(rect.width)),h=Math.max(0,Math.round(rect.height));
  if(w<35||h<35||w===layer.width&&h===layer.height)return;
  layer.width=w;layer.height=h;
  // Avoid enormous backing stores on high-DPI phones or tall pages.
  const dpi=Math.min(window.devicePixelRatio||1,1.4,1600/Math.max(w,h));
  layer.canvas.width=Math.max(1,Math.round(w*dpi));
  layer.canvas.height=Math.max(1,Math.round(h*dpi));
  layer.ctx.setTransform(layer.canvas.width/w,0,0,layer.canvas.height/h,0,0);
 }
 function paint(layer,dt){
  const {ctx,width:w,height:h}=layer;
  if(!w||!h)return;
  ctx.clearRect(0,0,w,h);
  const accelerated=layer.hover?1.8:1;
  const speed=dt*(layer.kind==='widget'?.09:.075)*accelerated;
  const cx=w*.52,cy=h*.48;
  for(const star of layer.stars){
   const z=star.z;
   const next=z-speed;
   const zoom=.13+.68/(z+.2);
   const nextZoom=.13+.68/(Math.max(.08,next)+.2);
   const x=cx+star.x*w*.54*zoom,y=cy+star.y*h*.54*zoom;
   const nx=cx+star.x*w*.54*nextZoom,ny=cy+star.y*h*.54*nextZoom;
   if(next<.08||Math.abs(nx-cx)>w*.72||Math.abs(ny-cy)>h*.7){
    seed(star,true);continue;
   }
   star.z=next;
   const alpha=Math.min(.8,(1.15-z)*.67*star.alpha);
   if(alpha<=0)continue;
   const shade=star.tint>.82?'255,176,211':star.tint>.53?'192,199,255':'237,238,255';
   ctx.strokeStyle='rgba('+shade+','+(alpha*.76)+')';
   ctx.lineWidth=z<.35?1.4:.8;
   ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(nx,ny);ctx.stroke();
   ctx.fillStyle='rgba('+shade+','+alpha+')';
   ctx.beginPath();ctx.arc(nx,ny,z<.4?1.15:.68,0,Math.PI*2);ctx.fill();
  }
 }
 function active(layer){
  if(!layer.target.isConnected||!layer.visible)return false;
  if(!layer.target.getClientRects().length)return false;
  return true;
 }
 function tick(time){
  frame=0;
  if(reduced?.matches||document.hidden)return;
  const dt=Math.min(.055,Math.max(0,(time-(last||time))/1000));
  if(last&&time-last<32){frame=requestAnimationFrame(tick);return}
  last=time;let any=false;
  for(const layer of layers.values()){
   if(!active(layer))continue;
   any=true;size(layer);paint(layer,Math.max(dt,.032));
  }
  if(any)frame=requestAnimationFrame(tick);
 }
 function wake(){
  if(frame||reduced?.matches||document.hidden)return;
  last=0;
  frame=requestAnimationFrame(tick);
 }
 const visibility=typeof IntersectionObserver==='function'
  ?new IntersectionObserver(entries=>{
     for(const entry of entries){
      const layer=layers.get(entry.target);
      if(layer)layer.visible=entry.isIntersecting;
     }
     wake();
   },{rootMargin:'80px'}):null;
 const resizing=typeof ResizeObserver==='function'
  ?new ResizeObserver(entries=>{
    for(const entry of entries){
     const layer=layers.get(entry.target);
     if(layer)size(layer);
    }
   }):null;
 function mount(target,kind,count){
  if(layers.has(target))return;
  // The dedicated canvas is intentionally not a focusable/interactive element.
  const canvas=document.createElement('canvas');
  canvas.className='orbit-space-canvas';
  canvas.setAttribute('aria-hidden','true');
  const ctx=canvas.getContext('2d',{alpha:true});
  if(!ctx)return;
  target.insertBefore(canvas,target.firstChild);
  const layer={target,canvas,ctx,kind,stars:[],width:0,height:0,visible:!visibility,hover:false};
  for(let i=0;i<count;i++){
   const star={};seed(star);layer.stars.push(star);
  }
  layers.set(target,layer);
  target.addEventListener('pointerenter',()=>{layer.hover=true},{passive:true});
  target.addEventListener('pointerleave',()=>{layer.hover=false},{passive:true});
  size(layer);
  // Reduced motion leaves a real, static starfield—not a blank black screen.
  paint(layer,0);
  visibility?.observe(target);
  resizing?.observe(target);
  wake();
 }
 function sync(){
  queued=false;
  for(const [target,layer] of layers){
   if(target.isConnected)continue;
   visibility?.unobserve(target);resizing?.unobserve(target);
   layers.delete(target);
  }
  for(const [selector,kind,count] of selectors){
   const node=document.querySelector(selector);
   if(node)mount(node,kind,count);
  }
 }
 function schedule(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(sync);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});
 else schedule();
 // Studio replaces its module workspace on navigation; remount without
 // changing the underlying OAuth and account-link state.
 new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
 document.addEventListener('biglwa:module-open',schedule);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)wake()});
 reduced?.addEventListener?.('change',()=>{
  if(reduced.matches){
   if(frame)cancelAnimationFrame(frame);frame=0;
   for(const layer of layers.values())paint(layer,0);
  }else wake();
 });
 window.addEventListener('resize',()=>{for(const layer of layers.values())size(layer);wake()},{passive:true});
 window.BigLWAOrbitSpace=Object.freeze({version:'20261114-space-1',refresh:schedule});
})();