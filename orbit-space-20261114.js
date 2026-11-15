/* BIG LWA Orbit Space · lightweight original 2D star-warp treatment.
 * Visual reference only: https://github.com/o2bomb/space-warp
 * No Three.js, no imports, no networks, and no interaction interception.
 */
(()=>{'use strict';
 if(window.BigLWAOrbitSpace)return;
 const selectors=[
  ['#studioApp #orbit','widget',260],
  ['#studioApp #moduleWorkspace[data-module-key="orbit"]','page',500]
 ];
 const layers=new Map();
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');
 let frame=0,queued=false,last=0;
 const rand=Math.random;
 function seed(star,far=false){
  const angle=rand()*Math.PI*2,radial=Math.sqrt(rand());
  star.x=Math.cos(angle)*radial;star.y=Math.sin(angle)*radial;
  star.z=far?1.15:.13+rand();
  star.alpha=.68+rand()*.32;
  star.size=.8+rand()*1.1;
  star.phase=rand()*Math.PI*2;
  star.twinkleRate=1.2+rand()*3.1;
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
 // Independent, fixed-position stars twinkle while the warp particles fly past.
 // Their brightness cycles are intentionally out of phase rather than flashing
 // the entire sky simultaneously like a static CSS star texture.
 function seedTwinkle(count){
  return Array.from({length:count},()=>({
   x:rand(),y:rand(),size:.6+rand()*1.5,
   phase:rand()*Math.PI*2,rate:.65+rand()*2.6,
   tone:rand(),bright:.48+rand()*.52
  }));
 }
 function paint(layer,dt){
  const {ctx,width:w,height:h}=layer;
  if(!w||!h)return;
  ctx.clearRect(0,0,w,h);
  layer.elapsed+=dt;
  layer.pointerBurst*=Math.exp(-dt*2.7);
  // The reference space-warp starts fast and exponentially decelerates to
  // cruising speed. Repeat a smaller pulse when the pointer enters the widget.
  const launch=Math.pow(.5,layer.elapsed*1.5)*8;
  const warp=1+launch+layer.pointerBurst*6+layer.cursorMotion*4;
  for(const star of layer.twinkles){
   star.phase+=dt*star.rate;
   const glow=.12+.88*Math.pow((1+Math.sin(star.phase))/2,2.2);
   const alpha=star.bright*glow;
   const tint=star.tone>.83?'255,190,226':star.tone>.55?'208,226,255':'248,249,255';
   const px=star.x*w,py=star.y*h;
   ctx.fillStyle='rgba('+tint+','+(alpha*.18)+')';
   ctx.beginPath();ctx.arc(px,py,star.size*2.6,0,Math.PI*2);ctx.fill();
   ctx.fillStyle='rgba('+tint+','+alpha+')';
   ctx.beginPath();ctx.arc(px,py,star.size,0,Math.PI*2);ctx.fill();
  }
  // Smooth cursor position drives the vanishing point and warp velocity.
  // Only the canvas pixels move; pointer events and DOM/card layout never do.
  const easing=Math.min(1,dt*5.5);
  layer.cursorX+=(layer.cursorTargetX-layer.cursorX)*easing;
  layer.cursorY+=(layer.cursorTargetY-layer.cursorY)*easing;
  layer.cursorMotion*=Math.max(0,1-dt*1.9);
  const accelerated=layer.hover?1.35+layer.cursorMotion*1.4:1;
  const speed=dt*(layer.kind==='widget'?.24:.17)*Math.min(warp*accelerated,12);
  const cx=w*(.50+layer.cursorX*.44),cy=h*(.49+layer.cursorY*.38);
  for(const star of layer.stars){
   const z=star.z;
   const next=z-speed;
   const zoom=.20+.78/(z+.24);
   const nextZoom=.20+.78/(Math.max(.08,next)+.24);
   const x=cx+star.x*w*.54*zoom,y=cy+star.y*h*.54*zoom;
   const nx=cx+star.x*w*.54*nextZoom,ny=cy+star.y*h*.54*nextZoom;
   if(next<.08||Math.abs(nx-cx)>w*.72||Math.abs(ny-cy)>h*.7){
    seed(star,true);continue;
   }
   star.z=next;
   star.phase+=dt*star.twinkleRate;
   const twinkle=.32+.68*Math.pow((1+Math.sin(star.phase))/2,1.5);
   const alpha=Math.min(.98,(.36+(1.15-z)*.60)*star.alpha*twinkle);
   const shade=star.tint>.82?'255,190,222':star.tint>.53?'209,220,255':'246,247,255';
   const radius=star.size*(z<.42?1.35:1);
   // Bright individual points remain visible on first paint and at rest.
   ctx.fillStyle='rgba('+shade+','+(alpha*.18)+')';
   ctx.beginPath();ctx.arc(nx,ny,radius*2.6,0,Math.PI*2);ctx.fill();
   ctx.strokeStyle='rgba('+shade+','+(alpha*.84)+')';
   ctx.lineWidth=(z<.4?1.8:1.15)+(Math.min(8,warp)*.06);
   ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(nx,ny);ctx.stroke();
   ctx.fillStyle='rgba('+shade+','+alpha+')';
   ctx.beginPath();ctx.arc(nx,ny,radius,0,Math.PI*2);ctx.fill();
  }
 }
 function active(layer){
  if(!layer.target.isConnected||!layer.visible)return false;
  if(layer.kind==='page'&&(layer.target.hidden||layer.target.dataset?.moduleKey!=='orbit'))return false;
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
  const layer={target,canvas,ctx,kind,stars:[],twinkles:seedTwinkle(kind==='widget'?80:130),
   elapsed:0,pointerBurst:0,width:0,height:0,visible:!visibility,hover:false,
   cursorX:0,cursorY:0,cursorTargetX:0,cursorTargetY:0,cursorMotion:0};
  for(let i=0;i<count;i++){
   const star={};seed(star);layer.stars.push(star);
  }
  layers.set(target,layer);
  target.addEventListener('pointerenter',()=>{
   layer.hover=true;layer.pointerBurst=1.1;wake();
  },{passive:true});
  target.addEventListener('pointermove',event=>{
   if(event.pointerType==='touch'||reduced?.matches)return;
   const bounds=target.getBoundingClientRect();
   if(bounds.width<1||bounds.height<1)return;
   const nextX=Math.max(-.5,Math.min(.5,(event.clientX-bounds.left)/bounds.width-.5));
   const nextY=Math.max(-.5,Math.min(.5,(event.clientY-bounds.top)/bounds.height-.5));
   const move=Math.hypot(nextX-layer.cursorTargetX,nextY-layer.cursorTargetY);
   layer.cursorMotion=Math.min(1,layer.cursorMotion+move*2.4);
   if(move>.025)layer.pointerBurst=Math.min(2,layer.pointerBurst+move*.9);
   layer.cursorTargetX=nextX;layer.cursorTargetY=nextY;
   layer.hover=true;
  },{passive:true});
  target.addEventListener('pointerleave',()=>{
   layer.hover=false;layer.cursorTargetX=0;layer.cursorTargetY=0;layer.cursorMotion=0;
  },{passive:true});
  size(layer);
  // Reduced motion leaves a real, static starfield—not a blank black screen.
  paint(layer,0);
  visibility?.observe(target);
  resizing?.observe(target);
  wake();
 }
 function release(target,layer){
  visibility?.unobserve(target);resizing?.unobserve(target);
  layer.canvas.remove?.();
  layers.delete(target);
 }
 function detachPage(){
  // The module workspace is reused for every tool. Remove this canvas
  // before the Orbit data-module-key changes, or its intrinsic dimensions
  // become a normal-flow block and push the next widget far down the page.
  for(const [target,layer] of layers)if(layer.kind==='page')release(target,layer);
 }
 function sync(){
  queued=false;
  const desired=selectors.map(([selector,kind,count])=>[document.querySelector(selector),kind,count]);
  const allowed=new Set(desired.map(([target])=>target).filter(Boolean));
  for(const [target,layer] of layers){
   if(target.isConnected&&allowed.has(target))continue;
   release(target,layer);
  }
  for(const [node,kind,count] of desired){
   if(!node||(kind==='page'&&node.hidden))continue;
   const layer=layers.get(node);
   if(layer){
    // Studio may replace an Orbit card's children without replacing the card.
    // Restore the existing bitmap instead of leaving an invisible, orphaned layer.
    if(!layer.canvas.isConnected || (layer.canvas.parentElement&&layer.canvas.parentElement!==node)){
     node.insertBefore(layer.canvas,node.firstChild);
     size(layer);paint(layer,0);wake();
    }
   }else mount(node,kind,count);
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
 new MutationObserver(schedule).observe(document.documentElement,{
  childList:true,subtree:true,attributes:true,attributeFilter:['data-module-key','hidden']
 });
 document.addEventListener('biglwa:module-open',schedule);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)wake()});
 reduced?.addEventListener?.('change',()=>{
  if(reduced.matches){
   if(frame)cancelAnimationFrame(frame);frame=0;
   for(const layer of layers.values())paint(layer,0);
  }else wake();
 });
 window.addEventListener('resize',()=>{for(const layer of layers.values())size(layer);wake()},{passive:true});
 window.BigLWAOrbitSpace=Object.freeze({version:'20261114-twinkle-warp-widget-4',refresh:schedule,detachPage});
})();