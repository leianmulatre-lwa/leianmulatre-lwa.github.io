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
  if(layer.portal)layer.portal.style.setProperty('--orbit-tile',Math.max(1,Math.ceil(w/4))+'px');
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
  // The same 3D-style entry warp is shared by the thumbnail AND full page.
  // Cursor position steers the camera, NOT the velocity of the stars.
  const launch=Math.pow(.5,layer.elapsed*1.5)*8;
  const warp=1+launch;
  for(const star of layer.twinkles){
   star.phase+=dt*star.rate;
   const glow=.12+.88*Math.pow((1+Math.sin(star.phase))/2,2.2);
   const alpha=star.bright*glow;
   const tint=star.tone>.83?'255,190,226':star.tone>.55?'208,226,255':'248,249,255';
   const depth=.34+star.bright*.72;
   const px=star.x*w-layer.cursorX*w*.28*depth;
   const py=star.y*h-layer.cursorY*h*.28*depth;
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
  layer.target.style?.setProperty('--orbit-cursor-x',layer.cursorX.toFixed(3));
  layer.target.style?.setProperty('--orbit-cursor-y',layer.cursorY.toFixed(3));
  const speed=dt*.20*Math.min(warp,12);
  const cx=w*(.50+layer.cursorX*.28),cy=h*(.49+layer.cursorY*.28);
  for(const star of layer.stars){
   const z=star.z;
   const next=z-speed;
   const zoom=.20+.78/(z+.24);
   const nextZoom=.20+.78/(Math.max(.08,next)+.24);
   // Cursor parallax shifts nearby particles more than distant ones.
   // This makes the camera turn with the pointer in the small widget too.
   const parallaxX=-layer.cursorX*w*.22*(1.4-z);
   const parallaxY=-layer.cursorY*h*.22*(1.4-z);
   const x=cx+parallaxX+star.x*w*.54*zoom,y=cy+parallaxY+star.y*h*.54*zoom;
   const nx=cx+parallaxX+star.x*w*.54*nextZoom,ny=cy+parallaxY+star.y*h*.54*nextZoom;
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
   // Space-warp reference: luminous points STRETCH into radial trails during
   // launch, then visibly contract to dots as velocity decays.
   const distance=Math.max(.001,Math.hypot(nx-cx,ny-cy));
   const length=Math.min(Math.min(w,h)*.18,Math.max(0,launch)*Math.min(w,h)*.021);
   const tx=nx-(nx-cx)/distance*length;
   const ty=ny-(ny-cy)/distance*length;
   ctx.lineWidth=(z<.4?1.8:1.15)+(Math.min(8,warp)*.06);
   ctx.beginPath();ctx.moveTo(tx,ty);ctx.lineTo(nx,ny);ctx.stroke();
   ctx.fillStyle='rgba('+shade+','+alpha+')';
   ctx.beginPath();ctx.arc(nx,ny,radius,0,Math.PI*2);ctx.fill();
  }
 }
 function isInViewport(target){
  // Some Studio masonry/drag transitions deliver a stale IntersectionObserver
  // result even while the thumbnail is visibly on screen.
  const rect=target.getBoundingClientRect();
  const height=window.innerHeight||document.documentElement?.clientHeight||0;
  const width=window.innerWidth||document.documentElement?.clientWidth||0;
  if(!height||!width||!Number.isFinite(rect.top)||!Number.isFinite(rect.bottom))return true;
  return rect.bottom>=-90&&rect.top<=height+90&&rect.right>=-90&&rect.left<=width+90;
 }
 function active(layer){
  if(!layer.target.isConnected)return false;
  if(layer.kind==='page'&&(layer.target.hidden||layer.target.dataset?.moduleKey!=='orbit'))return false;
  if(!layer.target.getClientRects().length)return false;
  // Geometry is authoritative for a visible card; IntersectionObserver is a
  // performance hint only and must never freeze visible Orbit thumbnails.
  return isInViewport(layer.target);
 }
 // Each sample cuts a soft opening in the tiled layer. The newest point
 // stays open under a resting pointer; older parts close over 850 ms.
 function paintPortalTrail(layer,time){
  const trail=layer.trail;
  if(!trail)return;
  const point=layer.portalPointer;
  if(point){
   const head=trail[trail.length-1];
   if(!head||Math.hypot(point.x-head.x,point.y-head.y)>7){
    const steps=head?Math.min(8,Math.ceil(Math.hypot(point.x-head.x,point.y-head.y)/24)):1;
    for(let i=1;i<=steps;i++){
     const x=head?Math.round(head.x+(point.x-head.x)*i/steps):point.x;
     const y=head?Math.round(head.y+(point.y-head.y)*i/steps):point.y;
     trail.push({x,y,time});
    }
    if(trail.length>32)trail.splice(0,trail.length-32);
   }else{head.time=time}
  }
  while(trail.length && time-trail[0].time>=850)trail.shift();
  if(!trail.length){
   if(layer.portalMask){layer.portal?.style.removeProperty('mask-image');layer.portal?.style.removeProperty('-webkit-mask-image');layer.portalMask=''}
   return;
  }
  const radius=Math.min(99,Math.max(48,layer.width*.155));
  const mask=trail.map(({x,y,time:born})=>{
   const size=radius*Math.max(0,1-(time-born)/850);
   return 'radial-gradient(circle at '+x+'px '+y+'px,transparent '+(size*.64).toFixed(1)+'px,#000 '+size.toFixed(1)+'px)';
  }).join(',');
  if(mask!==layer.portalMask&&layer.portal){
   layer.portal.style.setProperty('mask-image',mask);
   layer.portal.style.setProperty('-webkit-mask-image',mask);
   layer.portal.style.setProperty('mask-composite','intersect');
   layer.portal.style.setProperty('-webkit-mask-composite','source-in');
   layer.portalMask=mask;
  }
 }
 function tick(time){
  frame=0;
  if(reduced?.matches||document.hidden)return;
  const dt=Math.min(.055,Math.max(0,(time-(last||time))/1000));
  if(last&&time-last<32){frame=requestAnimationFrame(tick);return}
  last=time;let any=false;
  for(const layer of layers.values()){
   if(!active(layer))continue;
   any=true;size(layer);paint(layer,Math.max(dt,.032));paintPortalTrail(layer,time);
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
  target.dataset.orbitSpaceMounted='true';
  const layer={target,canvas,ctx,kind,stars:[],twinkles:seedTwinkle(kind==='widget'?80:130),
   elapsed:0,width:0,height:0,visible:!visibility,hover:false,
   cursorX:0,cursorY:0,cursorTargetX:0,cursorTargetY:0,cursorMotion:0};
  for(let i=0;i<count;i++){
   const star={};seed(star);layer.stars.push(star);
  }
  if(kind==='widget'&&target.style){
   layer.trail=[];
   const portal=document.createElement('div');portal.className='orbit-portal-tiles';portal.setAttribute('aria-hidden','true');
   target.append(portal);layer.portal=portal;
  }
  layers.set(target,layer);
  target.addEventListener('pointerenter',()=>{
   layer.hover=true;wake();
  },{passive:true});
  target.addEventListener('pointermove',event=>{
   if(reduced?.matches)return;
   const bounds=target.getBoundingClientRect();
   if(bounds.width<1||bounds.height<1)return;
   if(layer.trail)layer.portalPointer={x:Math.round(event.clientX-bounds.left),y:Math.round(event.clientY-bounds.top)};
   const nextX=Math.max(-.5,Math.min(.5,(event.clientX-bounds.left)/bounds.width-.5));
   const nextY=Math.max(-.5,Math.min(.5,(event.clientY-bounds.top)/bounds.height-.5));
   const move=Math.hypot(nextX-layer.cursorTargetX,nextY-layer.cursorTargetY);
   layer.cursorMotion=Math.min(1,layer.cursorMotion+move*2.4);
   layer.cursorTargetX=nextX;layer.cursorTargetY=nextY;
   layer.hover=true;
  },{passive:true});
  target.addEventListener('pointerleave',()=>{
   layer.portalPointer=null;
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
  layer.canvas.remove?.();layer.portal?.remove();
  delete target.dataset?.orbitSpaceMounted;
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
    if(layer.portal&&layer.portal.parentElement!==node){node.append(layer.portal);layer.portal.style.setProperty('--orbit-tile',Math.max(1,Math.ceil(layer.width/4))+'px')}
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
 // Wake on scrolling back to the card after a long idle; don't permanently
 // stop the renderer after an inaccurate offscreen/hidden observer callback.
 window.addEventListener('scroll',wake,{passive:true,capture:true});
 window.BigLWAOrbitSpace=Object.freeze({version:'20261126-portal-tiles-7',refresh:schedule,detachPage});
 // Aura: DVD-style motion within the actual card, not the viewport. Use the
 // existing orb and its live theme color; no replacement widget or data writes.
 let aura=null,auraCard=null,auraFrame=0,auraLast=0,ax=0,ay=0,vx=66,vy=48,cursor=null,cursorMode=false;
 const pointerFine=window.matchMedia?.('(pointer:fine)');
 function auraBounds(){
  if(!aura||!auraCard)return {x:0,y:0};
  return {x:Math.max(0,auraCard.clientWidth-aura.offsetWidth-4),y:Math.max(0,auraCard.clientHeight-aura.offsetHeight-4)};
 }
 function reflect(pos,vel,max,dt){
  if(max<=0)return [0,vel];
  let n=Math.max(0,Math.min(max,pos))+vel*dt;
  if(n<0){n=-n;vel=Math.abs(vel)}else if(n>max){n=2*max-n;vel=-Math.abs(vel)}
  return [Math.max(0,Math.min(max,n)),vel];
 }
 function renderAura(time){
  auraFrame=0;
  if(!aura?.isConnected||!auraCard?.getClientRects().length||document.hidden||reduced?.matches)return;
  const dt=Math.min(.05,(time-(auraLast||time))/1000);auraLast=time;
  const bound=auraBounds();
  [ax,vx]=reflect(ax,vx,bound.x,dt);[ay,vy]=reflect(ay,vy,bound.y,dt);
  aura.style.setProperty('--aura-dvd-x',ax+'px');aura.style.setProperty('--aura-dvd-y',ay+'px');
  auraFrame=requestAnimationFrame(renderAura);
 }
 function wakeAura(){
  if(!auraFrame&&aura?.isConnected&&!document.hidden&&!reduced?.matches){auraLast=0;auraFrame=requestAnimationFrame(renderAura)}
 }
 function stopCursor(){
  cursorMode=false;cursor?.remove();cursor=null;document.documentElement.classList.remove('biglwa-aura-cursor');
  aura?.setAttribute('aria-pressed','false');
 }
 function moveCursor(event){
  if(!cursorMode||!cursor||event.pointerType==='touch')return;
  cursor.style.left=event.clientX+'px';cursor.style.top=event.clientY+'px';
  if(aura?.isConnected){const style=getComputedStyle(aura);cursor.style.background=style.background;cursor.style.boxShadow=style.boxShadow}
  cursor.hidden=false;document.documentElement.classList.add('biglwa-aura-cursor');
 }
 function toggleCursor(event){
  event?.preventDefault();event?.stopPropagation();
  if(cursorMode){stopCursor();return}
  if(!pointerFine?.matches||!aura?.isConnected)return;
  cursor=document.createElement('div');cursor.className='biglwa-aura-pointer';cursor.hidden=true;cursor.setAttribute('aria-hidden','true');
  document.body.append(cursor);cursorMode=true;aura.setAttribute('aria-pressed','true');
  if(event&&Number.isFinite(event.clientX)&&event.detail!==0)moveCursor(event);
 }
 const auraResize=typeof ResizeObserver==='function'?new ResizeObserver(()=>{
  const bound=auraBounds();ax=Math.min(ax,bound.x);ay=Math.min(ay,bound.y);
  aura?.style.setProperty('--aura-dvd-x',ax+'px');aura?.style.setProperty('--aura-dvd-y',ay+'px');wakeAura();
 }):null;
 function syncAura(){
  const next=document.querySelector('#studioApp .aura-card #auraOrb');
  if(next===aura){wakeAura();return}
  auraResize?.disconnect();if(auraFrame)cancelAnimationFrame(auraFrame);auraFrame=0;stopCursor();
  aura=next;auraCard=next?.closest('.aura-card');if(!aura||!auraCard)return;
  auraCard.classList.add('biglwa-aura-dvd');aura.setAttribute('role','button');aura.tabIndex=0;
  aura.setAttribute('aria-label','Use Aura as cursor; click again or press Escape to return');aura.setAttribute('aria-pressed','false');
  aura.addEventListener('click',toggleCursor);
  aura.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' ')toggleCursor(event)});
  const bound=auraBounds();ax=bound.x*.35;ay=bound.y*.35;vx=66;vy=48;
  aura.style.setProperty('--aura-dvd-x',ax+'px');aura.style.setProperty('--aura-dvd-y',ay+'px');
  auraResize?.observe(auraCard);auraResize?.observe(aura);wakeAura();
 }
 let auraQueued=false;
 function scheduleAura(){if(auraQueued)return;auraQueued=true;requestAnimationFrame(()=>{auraQueued=false;syncAura()})}
 new MutationObserver(scheduleAura).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','class']});
 document.addEventListener('pointermove',moveCursor,{passive:true});
 document.documentElement.addEventListener('pointerleave',()=>{if(cursorMode){cursor.hidden=true;document.documentElement.classList.remove('biglwa-aura-cursor')}});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&cursorMode)stopCursor()});
 window.addEventListener('blur',stopCursor);
 window.addEventListener('resize',scheduleAura,{passive:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){stopCursor();if(auraFrame)cancelAnimationFrame(auraFrame);auraFrame=0}else wakeAura()});
 reduced?.addEventListener?.('change',()=>{if(reduced.matches){if(auraFrame)cancelAnimationFrame(auraFrame);auraFrame=0}else wakeAura()});
 scheduleAura();
})();