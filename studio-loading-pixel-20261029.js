/* Build the current pixel scene before the loading curtain is inserted. */
(()=>{
 if(window.BigLWAPixelCurtain)return;
 function figure(kind,src){
  const span=document.createElement('span');
  span.className='lwa-pixel-figure lwa-pixel-'+kind;
  const img=document.createElement('img');
  img.src=src;img.alt='';img.draggable=false;img.width=64;img.height=64;
  span.append(img);
  return span;
 }
 function scene(){
  const el=document.createElement('div');
  el.className='lwa-pixel-scene';el.setAttribute('aria-hidden','true');
  const lights=document.createElement('span');lights.className='lwa-pixel-lights';
  for(let n=0;n<3;n++)lights.append(document.createElement('i'));
  el.append(figure('globe','/assets/loading-globe-pixel-20261029.png'),lights,
    figure('blocks','/assets/loading-blocks-pixel-20261029.png'));
  return el;
 }
 window.BigLWAPixelCurtain={scene};
})();
