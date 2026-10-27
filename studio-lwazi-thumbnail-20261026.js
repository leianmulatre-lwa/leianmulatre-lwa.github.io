/* BIG LWA Studio — self-contained Lwazi Workshop carousel.
   Uses the familiar three moving arcade columns, but creates real accessible
   Workshop app buttons. The HD keyboard PNG is only a transparent frame. */
(()=>{'use strict';
 if(window.__biglwaLwaziCarouselV3)return;
 window.__biglwaLwaziCarouselV3=true;
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
   if($('.lwazi-cabinet-thumb [data-lwazi-carousel-version="3"]',card))return;
   const existing=$('.lwazi-cabinet-thumb',card);
   if(existing)existing.remove(); // retire only the old thumbnail, not Workshop.
   const frame=document.createElement('div');
   frame.className='lwazi-cabinet-thumb';
   frame.setAttribute('role','group');
   frame.setAttribute('aria-label','Lwazi Workshop: choose an app from the animated carousel');
   const viewport=document.createElement('div');
   viewport.className='arcade-library-viewport';
   viewport.dataset.lwaziCarouselVersion='3';
   viewport.setAttribute('aria-label','Lwazi app carousel');
   const cols=[
     [BLOCKS[0],BLOCKS[3],BLOCKS[4]],
     [BLOCKS[1],BLOCKS[4],BLOCKS[5]],
     [BLOCKS[2],BLOCKS[5],BLOCKS[0],BLOCKS[3]]
   ];
   for(const entries of cols){
     const track=document.createElement('div');
     track.className='arcade-track';
     // Double a finite row set for the same continuous-motion principle as Games.
     entries.forEach(app=>track.appendChild(tile(app)));
     entries.forEach(app=>track.appendChild(tile(app,true)));
     viewport.appendChild(track);
   }
   frame.appendChild(viewport);
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
