/* One optical rule for Studio widget headings. No account or layout storage. */
(()=>{
 const app=document.querySelector('#studioApp');if(!app)return;
 const SIZE=21,INK=18,FONT=20.25,GAP=4.5; // 75% of 28 / 24 / 27 / 6.
 const cache=new Map();let pending=false;
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true});
 const css=document.createElement('style');css.id='biglwa-heading-optical-rule';
 css.textContent=`
 #studioApp .card .biglwa-card-heading-row{display:flex!important;align-items:center!important;gap:${GAP}px!important;min-height:24px!important;margin:0 0 6px!important}
 #studioApp .card .biglwa-card-heading-row>h2,#studioApp .card .biglwa-card-heading-row>h3{font-size:${FONT}px!important;line-height:1!important;margin:0!important;align-self:center!important;transform:translateY(var(--heading-text-offset,0px))!important}
 #studioApp .card .biglwa-card-heading-row>.card-icon{position:relative!important;display:block!important;flex:0 0 ${SIZE}px!important;width:${SIZE}px!important;height:${SIZE}px!important;min-width:${SIZE}px!important;min-height:${SIZE}px!important;padding:0!important;margin:0!important;top:0!important;transform:none!important;overflow:visible!important;font-size:0!important;border:0!important;background:none!important}
 #studioApp .card .biglwa-card-heading-row>.card-icon .heading-normalized-glyph{position:absolute!important;inset:1.5px!important;display:block!important;width:${INK}px!important;height:${INK}px!important;max-width:none!important;max-height:none!important;transform:none!important}
 `;document.head.append(css);
 function bounds(src){
  if(cache.has(src))return cache.get(src);
  const promise=new Promise(resolve=>{const img=new Image();img.onload=()=>{
   try{const ratio=Math.min(1,512/Math.max(img.naturalWidth,img.naturalHeight));canvas.width=Math.ceil(img.naturalWidth*ratio);canvas.height=Math.ceil(img.naturalHeight*ratio);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;let l=canvas.width,t=canvas.height,r=-1,b=-1;for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)if(data[(y*canvas.width+x)*4+3]>16){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y)}resolve(r<0?null:{width:img.naturalWidth,height:img.naturalHeight,l:l/ratio,t:t/ratio,w:(r-l+1)/ratio,h:(b-t+1)/ratio});}catch{resolve(null)}
  };img.onerror=()=>resolve(null);img.src=src});cache.set(src,promise);return promise;
 }
 function important(el,values){for(const [key,value]of Object.entries(values))if(el.style.getPropertyValue(key)!==value)el.style.setProperty(key,value,'important')}
 async function normalize(icon){
  important(icon,{'width':SIZE+'px','height':SIZE+'px','flex-basis':SIZE+'px','margin':'0px','transform':'none','font-size':'0px'});
  const img=icon.querySelector('img');
  if(img){
   const src=img.currentSrc||img.src,box=await bounds(src);if(!box||!img.isConnected||(img.currentSrc||img.src)!==src)return;
   const scale=INK/Math.max(box.w,box.h),left=(SIZE-box.w*scale)/2-box.l*scale,top=(SIZE-box.h*scale)/2-box.t*scale;
   for(let parent=img.parentElement;parent&&parent!==icon;parent=parent.parentElement)important(parent,{'display':'contents','transform':'none'});
   important(img,{'position':'absolute','width':box.width*scale+'px','height':box.height*scale+'px','max-width':'none','max-height':'none','left':left+'px','top':top+'px','margin':'0px','transform':'none','object-fit':'contain'});
   icon.dataset.headingInk=[box.w*scale,box.h*scale].map(v=>v.toFixed(2)).join('×');return;
  }
  if(icon.querySelector('.heading-normalized-glyph'))return;
  const source=icon.querySelector('svg');
  if(source){const box=source.getBBox();if(box.width&&box.height){source.setAttribute('viewBox',`${box.x} ${box.y} ${box.width} ${box.height}`);source.setAttribute('preserveAspectRatio','xMidYMid meet');source.classList.add('heading-normalized-glyph');}return;}
  const glyph=icon.textContent.trim();if(!glyph)return;
  ctx.font='26px Georgia';const m=ctx.measureText(glyph),w=m.actualBoundingBoxLeft+m.actualBoundingBoxRight,h=m.actualBoundingBoxAscent+m.actualBoundingBoxDescent;if(!w||!h)return;
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('heading-normalized-glyph');svg.setAttribute('viewBox',`${-m.actualBoundingBoxLeft} ${-m.actualBoundingBoxAscent} ${w} ${h}`);svg.setAttribute('preserveAspectRatio','xMidYMid meet');svg.setAttribute('aria-hidden','true');
  const text=document.createElementNS(svg.namespaceURI,'text');text.setAttribute('x','0');text.setAttribute('y','0');text.setAttribute('font-family','Georgia');text.setAttribute('font-size','26');text.setAttribute('fill','currentColor');text.textContent=glyph;svg.append(text);icon.replaceChildren(svg);
 }
 function refresh(){
  pending=false;
  app.querySelectorAll('.card-icon').forEach(icon=>{
   const card=icon.closest('.card'),parent=icon.parentElement;if(!card||icon.closest('.sidebar,.module-page'))return;
   const title=[...parent.children].find(n=>n.matches('h2,h3'));if(!title)return;
   let row=parent;if(!row.classList.contains('biglwa-card-heading-row')){row=document.createElement('div');row.className='biglwa-card-heading-row';parent.insertBefore(row,icon);row.append(icon,title)}
   important(title,{'font-size':FONT+'px','line-height':'1','margin':'0px'});
   const font=getComputedStyle(title);ctx.font=`${font.fontWeight} ${FONT}px ${font.fontFamily}`;
   // Use Projects as the shared font reference, not a different baseline per word.
   const m=ctx.measureText('projects');const offset=((m.fontBoundingBoxDescent||0)-(m.fontBoundingBoxAscent||0)+m.actualBoundingBoxAscent-m.actualBoundingBoxDescent)/2;
   row.style.setProperty('--heading-text-offset',(Number.isFinite(offset)?offset:0)+'px');
   normalize(icon);
  });
 }
 function schedule(){if(pending)return;pending=true;requestAnimationFrame(refresh)}
 new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
 document.addEventListener('biglwa:widget-symbols-ready',schedule);
 document.fonts.ready.then(schedule);document.fonts.addEventListener('loadingdone',schedule);
 refresh();window.BigLWAHeadingRule={refresh,size:SIZE,ink:INK,font:FONT,gap:GAP};
})();
