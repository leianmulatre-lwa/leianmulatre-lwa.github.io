/* BIG LWA: prevent legacy card navigation from leaving the authenticated Studio for Map.
   This listener runs at window capture, before the older page router handlers. */
(()=>{
 if(window.__biglwaMapRouteGuardV1)return;window.__biglwaMapRouteGuardV1=true;
 const mapSelectors=[
   '#studioApp #map [data-open="map"]',
   '#studioApp #map .card-cta',
   '#studioApp #map .studio-mini-map-open',
   '#studioApp [data-sidebar-route="map"]',
   '#studioApp [data-shortcut-route="map"]',
   '#studioApp [data-open-module="map"]'
 ].join(',');
 const status=()=>{
   const map=document.querySelector('#studioApp #map');
   if(!map)return;
   let note=map.querySelector('.studio-map-route-status');
   if(!note){note=document.createElement('p');note.className='studio-map-route-status';note.setAttribute('role','status');map.appendChild(note);}
   note.textContent='Map is still loading. Please try again in a moment.';
 };
 window.addEventListener('click',event=>{
   if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
   if(document.documentElement.classList.contains('biglwa-preview-mode'))return;
   const control=event.target?.closest?.(mapSelectors);
   if(!control)return;
   event.preventDefault();
   event.stopImmediatePropagation();
   const open=window.openBIGLWAModule||window.BigLWAOpenModule;
   if(typeof open==='function'){
     try{open('map');return;}catch(err){console.warn('[BIGLWA] Map route error:',err);}
   }
   status();
 },true);
})();
