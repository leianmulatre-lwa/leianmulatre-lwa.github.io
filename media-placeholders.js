/* Shared social-image skeletons: reserve each image's aspect ratio, animate gently
 * while loading, and show a non-deceptive retry UI if the remote image fails.
 * TV test bars are intentionally reserved for the Stream player.
 */
(()=>{'use strict';
 if(window.__biglwaImagePlaceholdersV1)return;
 window.__biglwaImagePlaceholdersV1=true;
 const selector='.veve-photo-frame img,.biglwa-unified-media img,.biglwa-slide img,.instagram-archive-piece img,#pinterestBoards img,.pn-pin-photo img,.pinterest-pin img';
 const ratios=new Map();
 const targetShell=img=>img.closest('.veve-photo-frame,.biglwa-unified-media,.biglwa-slide,.instagram-archive-piece,.pn-pin-photo,.pinterest-pin');
 const ratioFor=img=>{
   const attr=Number(img.dataset.lwaAspect||img.getAttribute('data-media-aspect'));
   if(Number.isFinite(attr)&&attr>=.35&&attr<=3)return attr;
   const src=img.getAttribute('src')||'';
   return ratios.get(src)||.8;
 };
 const setRatio=(shell,ratio)=>{
  if(shell&&Number.isFinite(ratio)&&ratio>=.35&&ratio<=3)
   shell.style.setProperty('--lwa-image-aspect',String(ratio));
 };
 const addRetry=(shell,img)=>{
   if(!shell||shell.querySelector(':scope > .lwa-image-status'))return;
   const wrap=document.createElement('span');wrap.className='lwa-image-status';
   wrap.setAttribute('role','status');
   const message=document.createElement('span');message.textContent='Photo unavailable';
   const retry=document.createElement('button');retry.type='button';
   retry.textContent='Retry';retry.setAttribute('aria-label','Retry loading this photo');
   retry.onclick=()=>{
    if(retry.disabled)return;
    retry.disabled=true;wrap.remove();shell.classList.remove('lwa-image-failed');
    shell.classList.add('lwa-image-loading');
    const original=img.dataset.lwaOriginalUrl||img.getAttribute('src')||'';
    if(!original){failed(img);return}
    try{
      const url=new URL(original,location.href);
      if(url.origin===location.origin||url.hostname==='biglwa-instagram-api.leianmulatre-284.workers.dev')
        url.searchParams.set('lwa_retry','1');
      img.src=url.href;
    }catch{img.src=original}
   };
   wrap.append(message,retry);shell.append(wrap);
 };
 function failed(img){
   if(!img.matches(selector))return;
   const shell=targetShell(img);if(!shell)return;
   img.dataset.lwaImageState='failed';
   shell.classList.remove('lwa-image-loading','lwa-image-ready');
   shell.classList.add('lwa-image-failed');
   setRatio(shell,ratioFor(img));
   addRetry(shell,img);
 }
 function loaded(img){
   if(!img.matches(selector))return;
   const shell=targetShell(img);if(!shell)return;
   if(!img.naturalWidth||!img.naturalHeight){failed(img);return}
   const ratio=img.naturalWidth/img.naturalHeight;
   const src=img.dataset.lwaOriginalUrl||img.getAttribute('src')||'';
   if(ratios.size>200)ratios.clear();
   ratios.set(src,ratio);
   setRatio(shell,ratio);
   img.dataset.lwaImageState='ready';
   const siblings=[...shell.querySelectorAll('img')].filter(x=>!x.hasAttribute('aria-hidden')||x.getAttribute('aria-hidden')!=='true');
   const pending=siblings.some(x=>!x.complete);
   shell.classList.toggle('lwa-image-loading',pending);
   shell.classList.toggle('lwa-image-ready',!pending);
   shell.classList.remove('lwa-image-failed');
   shell.querySelector(':scope > .lwa-image-status')?.remove();
 }
 function initialize(img){
   if(!img?.matches?.(selector))return;
   const current=img.getAttribute('src')||'';
   if(img.dataset.lwaImageManaged==='1'&&img.dataset.lwaOriginalUrl===current)return;
   img.dataset.lwaImageManaged='1';
   img.dataset.lwaOriginalUrl=current;
   img.dataset.lwaImageState='loading';
   const shell=targetShell(img);if(!shell)return;
   setRatio(shell,ratioFor(img));
   shell.querySelector(':scope > .lwa-image-status')?.remove();
   shell.classList.remove('lwa-image-ready','lwa-image-failed');
   shell.classList.add('lwa-image-loading');
   if(img.complete){if(img.naturalWidth>0)loaded(img);else failed(img)}
 }
 // Error capture runs before any local retry handler but does not block it.
 // A card's own fallback image handler may still try its alternate image.
 document.addEventListener('load',event=>{
   if(event.target?.matches?.(selector))loaded(event.target);
 },true);
 document.addEventListener('error',event=>{
   const img=event.target;
   if(!img?.matches?.(selector))return;
   // Feed uses a dedicated alternate-source retry first.
   if(img.matches('img[data-feed-media]'))return;
   failed(img);
 },true);
 document.addEventListener('click',event=>{
   const button=event.target.closest?.('.lwa-image-status button');
   if(button)event.stopPropagation();
 },true);
 const apply=root=>{
   if(root.nodeType!==1&&root.nodeType!==9&&root.nodeType!==11)return;
   if(root.matches?.(selector))initialize(root);
   root.querySelectorAll?.(selector).forEach(initialize);
 };
 const start=()=>{
   apply(document);
   new MutationObserver(records=>{
     for(const record of records){
       if(record.type==='attributes'&&record.attributeName==='src')initialize(record.target);
       else for(const added of record.addedNodes)apply(added);
     }
   }).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['src']});
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
 else start();
})();
