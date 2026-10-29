/* BIG LWA Studio — horizontal, accessible Lwazi Workshop carousel.
   One continuous native-scrolling row of six real editor tiles, repeated once
   for a seamless loop. Browser artwork is decorative; controls stay clickable. */
(()=>{'use strict';
 if(window.__biglwaLwaziCarouselV4)return;
 window.__biglwaLwaziCarouselV4=true;
 const BLOCKS=[
  {name:'sqwibblR',id:'image-desk',icon:'/assets/bigapps/icons/sqwibblR.png?v=20261026-original-stitch-1'},
  {name:'visualizr',id:'visualizr',icon:'/assets/bigapps/icons/visualizr.png?v=20261026-stitched-v-2'},
  {name:'lightR',id:'photocraft',icon:'/assets/bigapps/icons/lightR.png?v=20261026-original-stitch-1'},
  {name:'paintR',id:'vectorcraft',icon:'/assets/bigapps/icons/paintR.png?v=20261026-original-stitch-1'},
  {name:'keyframeR',id:'effectcraft',icon:'/assets/bigapps/icons/keyframeR.png?v=20261026-original-stitch-1'},
  {name:'fileR',id:'pdfcraft',icon:'/assets/bigapps/icons/fileR.png?v=20261026-original-stitch-1'}
 ];
 const $=(selector,root=document)=>root.querySelector(selector);
 function openModule(key){
   if(typeof window.openBIGLWAModule==='function')return window.openBIGLWAModule(key);
   if(typeof window.BigLWAOpenModule==='function')return window.BigLWAOpenModule(key);
   $('#studioApp [data-sidebar-route="'+key+'"],#studioApp [data-open="'+key+'"]')?.click();
 }
 function openApp(app){
   if(app.id==='visualizr'){openModule('projects');return;}
   openModule('tools');
   // Work with the existing Lwazi editor router; never reimplement editors.
   let tries=0;
   const tryLaunch=()=>{
     const button=$('#studioApp #craftSuite [data-craft-open="'+app.id+'"]')||
                  $('#studioApp [data-craft-open="'+app.id+'"]');
     if(button&&!button.disabled){button.click();return;}
     if(++tries<35){setTimeout(tryLaunch,160);return;}
     $('#studioApp [data-craft-card="'+app.id+'"]')?.scrollIntoView({block:'center',behavior:'smooth'});
   };
   setTimeout(tryLaunch,180);
 }
 function tile(app,duplicate=false){
   const el=document.createElement('button');
   el.type='button';el.className='arcade-game-tile lwazi-block-tile';
   el.dataset.lwaziApp=app.id;
   el.setAttribute('aria-label','Open '+app.name+' in Lwazi');
   if(duplicate){el.tabIndex=-1;el.setAttribute('aria-hidden','true');}
   const image=document.createElement('img');
   image.src=app.icon;image.alt='';image.loading=duplicate?'lazy':'eager';
   image.decoding='async';image.width=160;image.height=160;
   const name=document.createElement('span');
   name.className='lwazi-block-name';name.textContent=app.name;
   el.append(image,name);
   el.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openApp(app)});
   return el;
 }
 function mount(){
   const card=$('#studioApp #tools')||$('#studioApp article.card[data-widget="tools"]');
   if(!card)return;
   if($('.lwazi-cabinet-thumb [data-lwazi-carousel-version="4"]',card))return;
   const existing=$('.lwazi-cabinet-thumb',card);
   if(existing)existing.remove(); // retire only the old thumbnail, not Workshop.
   const frame=document.createElement('div');
   frame.className='lwazi-cabinet-thumb';
   frame.setAttribute('role','group');
   frame.setAttribute('aria-label','Lwazi Workshop: choose an app from the animated carousel');
   const viewport=document.createElement('div');
   viewport.className='arcade-library-viewport';
   viewport.dataset.lwaziCarouselVersion='4';
   viewport.tabIndex=0;
   viewport.setAttribute('role','region');
   viewport.setAttribute('aria-label','Lwazi creative apps — horizontal carousel; use arrow keys or swipe');
   const track=document.createElement('div');
   track.className='arcade-track lwazi-horizontal-track';
   BLOCKS.forEach(app=>track.appendChild(tile(app)));
   BLOCKS.forEach(app=>track.appendChild(tile(app,true)));
   viewport.appendChild(track);
   // Native scrolling keeps swipes, trackpad and keyboard access functional.
   // A second identical set makes continuous motion seamless.
   let pausedUntil=0,hovered=false,visible=true,previous=0;
   const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)');
   const cycleLength=()=>{
     const original=track.children[0],repeat=track.children[BLOCKS.length];
     return original&&repeat?Math.max(0,repeat.offsetLeft-original.offsetLeft):0;
   };
   function shift(delta){
     pausedUntil=performance.now()+4000;
     const cycle=cycleLength();
     let next=viewport.scrollLeft+delta;
     if(cycle>0){if(next>=cycle)next-=cycle;if(next<0)next+=cycle;}
     viewport.scrollLeft=next;
   }
   viewport.addEventListener('keydown',event=>{
     if(event.key!=='ArrowRight'&&event.key!=='ArrowLeft')return;
     event.preventDefault();event.stopPropagation();
     shift((event.key==='ArrowRight'?1:-1)*Math.max(75,viewport.clientWidth*.55));
   });
   viewport.addEventListener('pointerenter',()=>{hovered=true;});
   viewport.addEventListener('pointerleave',()=>{hovered=false;});
   viewport.addEventListener('focusin',()=>{hovered=true;});
   viewport.addEventListener('focusout',event=>{
     if(!viewport.contains(event.relatedTarget))hovered=false;
   });
   viewport.addEventListener('scroll',()=>{
     const cycle=cycleLength();
     if(cycle>0 && viewport.scrollLeft>=cycle)viewport.scrollLeft-=cycle;
   },{passive:true});
   if(typeof IntersectionObserver==='function'){
     const visibility=new IntersectionObserver(entries=>{
       visible=entries.some(entry=>entry.isIntersecting);
       if(!viewport.isConnected)visibility.disconnect();
     },{threshold:.01});
     visibility.observe(viewport);
   }
   function animate(now){
     if(!viewport.isConnected)return; // Stop on widget re-mount; no orphaned loops.
     const dt=previous?Math.min(50,now-previous):0;
     previous=now;
     if(visible&&!hovered&&!reducedMotion?.matches&&!document.hidden&&now>pausedUntil){
       const cycle=cycleLength();
       if(cycle>0){
         viewport.scrollLeft+=dt*.024; // ~24px/second, intentionally gentle.
         if(viewport.scrollLeft>=cycle)viewport.scrollLeft-=cycle;
       }
     }
     requestAnimationFrame(animate);
   }
   requestAnimationFrame(animate);
   frame.appendChild(viewport);
   const nav=document.createElement('nav');
   nav.className='lwazi-carousel-controls';
   nav.setAttribute('aria-label','Browse creative tools');
   for(const [direction,label,glyph] of [[-1,'Previous creative tools','‹'],[1,'Next creative tools','›']]){
     const button=document.createElement('button');
     button.type='button';button.textContent=glyph;
     button.setAttribute('aria-label',label);
     button.addEventListener('click',event=>{
       event.preventDefault();event.stopPropagation();
       shift(direction*Math.max(75,viewport.clientWidth*.60));
     });
     nav.appendChild(button);
   }
   frame.appendChild(nav);

   function hitbox(cls,description){
     const el=document.createElement('button');
     el.type='button';el.className=cls;el.setAttribute('aria-label',description);
     el.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openModule('tools')});
     return el;
   }
   frame.append(hitbox('lwazi-cabinet-marquee','Open complete Lwazi Workshop'),
                hitbox('lwazi-cabinet-open','Open complete Lwazi Workshop'));
   const heading=[...card.children].find(el=>el.matches('.biglwa-card-heading-row,.card-head,.card-heading-row,.card-header,.widget-heading'));
   if(heading)heading.insertAdjacentElement('afterend',frame);
   else card.appendChild(frame);
 }
 let scheduled=false;
 function schedule(){
   if(scheduled)return;
   scheduled=true;
   requestAnimationFrame(()=>{scheduled=false;mount()});
 }
 function start(){
   mount();
   const app=$('#studioApp')||document.body;
   new MutationObserver(schedule).observe(app,{subtree:true,childList:true});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
 else start();
})();
