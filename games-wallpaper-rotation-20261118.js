/* Games wallpaper rotation: classic pixel tiles, public-domain/Unlicense.
 * Source: https://github.com/peteroupc/classic-wallpaper (Unlicense).
 * Behind the Games workspace, never above playable content. */
(()=>{'use strict';
 if(window.__biglwaGamesWallpaperRotation)return;
 window.__biglwaGamesWallpaperRotation=true;
 const SOURCE='https://raw.githubusercontent.com/peteroupc/classic-wallpaper/main/';
 const ART=['boxes.png','dzigzagcyan.png','truchet2color.png','circlec.png'];
 let index=0,last=null;
 function apply(){
  const root=document.querySelector('#studioApp #moduleWorkspace[data-module-key="games"]');
  if(!root||root.hidden||getComputedStyle(root).display==='none')return;
  if(root!==last){last=root;index=0;}
  const image='url("'+SOURCE+ART[index%ART.length]+'")';
  // A semitransparent site-surface veil maintains text legibility.
  root.style.setProperty('background-image','linear-gradient(rgba(250,244,235,.91),rgba(250,244,235,.91)),'+image,'important');
  root.style.setProperty('background-size','auto,128px 128px','important');
  root.style.setProperty('background-repeat','repeat,repeat','important');
  root.dataset.gamesWallpaper=ART[index%ART.length];
 }
 function next(){const root=document.querySelector('#studioApp #moduleWorkspace[data-module-key="games"]');
  if(document.hidden||!root||root.hidden||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  index=(index+1)%ART.length;apply();
 }
 document.addEventListener('biglwa:module-open',apply);
 document.addEventListener('visibilitychange',apply);
 window.addEventListener('biglwa:studio-layout-changed',apply);
 setInterval(next,24000);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();