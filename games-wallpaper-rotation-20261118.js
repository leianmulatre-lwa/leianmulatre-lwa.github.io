/* BIG LWA Games background rotation.
 * Use only the eight original image files inside this repository's "games bg"
 * directory. These must be copied to Cloudflare Pages by build-cloudflare-pages.mjs.
 * Never hotlink to third-party GitHub images or replace the user's artwork.
 */
(()=>{
 'use strict';
 if(window.__biglwaGamesWallpaperRotation)return;
 window.__biglwaGamesWallpaperRotation=true;

 const FILES=[
  '098fd5e1084e9f1d04223dcaa42387b9.jpg',
  '3unsgny5oup81.jpg',
  '860645.png',
  'ce4cuf5c0pp51.png',
  'games bg.jpg',
  'gta-homepage-icon.avif',
  'playstation_background_by_wintendo558_dhfen5k-fullview.jpg',
  'xbox-360-nxe-wallpapers-ai-upscaled-v0-aavwiqz5oup81.jpg'
 ];
 const PATH='/games%20bg/';
 const url=name=>PATH+encodeURIComponent(name);
 const ready=new Map();
 let index=0,version=0,observed=null,styled=null,observer=null;

 function workspace(){
  return document.querySelector('#studioApp #moduleWorkspace');
 }
 function clear(root){
  if(!root||root!==styled)return;
  ['background-image','background-position','background-size','background-repeat','background-attachment']
   .forEach(property=>root.style.removeProperty(property));
  delete root.dataset.gamesWallpaper;
  styled=null;
 }
 function available(src){
  if(!ready.has(src)){
   ready.set(src,new Promise(resolve=>{
    const probe=new Image();
    probe.onload=()=>resolve(true);
    probe.onerror=()=>resolve(false);
    probe.src=src;
   }));
  }
  return ready.get(src);
 }
 async function paint(){
  const root=workspace(),thisVersion=++version;
  if(!root||root.dataset.moduleKey!=='games'){
   clear(styled);return;
  }
  for(let checked=0;checked<FILES.length;checked++){
   const file=FILES[index%FILES.length],src=url(file);
   if(await available(src)){
    if(thisVersion!==version||root!==workspace()||root.dataset.moduleKey!=='games')return;
    if(styled&&styled!==root)clear(styled);
    styled=root;
    // The photo is a full-page backdrop behind the existing game windows.
    // A modest dark veil maintains contrast without hiding the picture.
    root.style.setProperty('background-image',
      'linear-gradient(rgba(21,17,27,.13),rgba(21,17,27,.13)),url("'+src+'")','important');
    root.style.setProperty('background-size','cover,cover','important');
    root.style.setProperty('background-position','center center,center center','important');
    root.style.setProperty('background-repeat','no-repeat,no-repeat','important');
    root.style.setProperty('background-attachment','scroll,scroll','important');
    root.dataset.gamesWallpaper=file;
    return;
   }
   index=(index+1)%FILES.length;
  }
  if(thisVersion===version){
   clear(styled);
   console.warn('[BIG LWA Games] No background images loaded from /games%20bg/. Check the Pages asset build.');
  }
 }
 function synchronize(){
  const root=workspace();
  if(root!==observed){
   observer?.disconnect();
   observed=root;
   if(root&&typeof MutationObserver==='function'){
    observer=new MutationObserver(()=>{void paint()});
    observer.observe(root,{attributes:true,attributeFilter:['data-module-key']});
   }
  }
  void paint();
 }
 function schedule(){requestAnimationFrame(synchronize)}
 document.addEventListener('biglwa:module-open',schedule);
 document.addEventListener('biglwa:module-close',schedule);
 window.addEventListener('biglwa:module-open',schedule);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()});
 setInterval(()=>{
  const root=workspace();
  if(!root||root.dataset.moduleKey!=='games'||document.hidden||
     window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
  index=(index+1)%FILES.length;
  void paint();
 },24000);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});
 else schedule();
})();
