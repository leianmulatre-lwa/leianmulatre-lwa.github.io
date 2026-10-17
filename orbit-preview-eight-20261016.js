/* BIG LWA Studio Orbit preview: exactly eight existing planet surfaces.
   The full Orbit page and all provider authorizations are left untouched. */
(()=>{
  'use strict';
  const APPS=[
    ['instagram','IG','Instagram'],
    ['youtube','YT','YouTube'],
    ['tumblr','T','Tumblr'],
    ['pinterest','P','Pinterest'],
    ['tiktok','TT','TikTok'],
    ['snapchat','SC','Snapchat'],
    ['calendar','GC','Google Calendar'],
    ['x','𝕏','X']
  ];
  let scheduled=false;
  function openOrbit(){
    if(typeof window.openBIGLWAModule==='function')window.openBIGLWAModule('orbit');
    else window.location.assign('/studio?view=orbit');
  }
  function refresh(){
    scheduled=false;
    const grid=document.querySelector('#studioApp #orbitGrid');
    if(!grid)return;
    // Keep original tiles wherever they exist: their click handlers,
    // imported-account state and existing spherical artwork belong to them.
    for(const [id,glyph,label] of APPS){
      let tile=Array.from(grid.children).find(el=>el.matches?.('button[data-orbit-app="'+id+'"]'));
      if(!tile){
        tile=document.createElement('button');
        tile.type='button';
        tile.dataset.orbitApp=id;
        tile.dataset.orbitPreviewFallback='true';
        const planet=document.createElement('span');
        planet.className='orbit-glyph';
        planet.textContent=glyph;
        const title=document.createElement('b');
        title.textContent=label;
        const state=document.createElement('small');
        state.textContent='Open Orbit';
        tile.append(planet,title,state);
        tile.setAttribute('aria-label','Open '+label+' in Orbit');
        tile.addEventListener('click',event=>{
          event.preventDefault();
          event.stopPropagation();
          openOrbit();
        });
        grid.appendChild(tile);
      }
    }
  }
  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(refresh);
  }
  // The Studio shell is re-created on some navigations, so reinstate any
  // missing preview entries without duplicating existing planets.
  const boot=()=>{
    schedule();
    const root=document.getElementById('studioApp')||document.body;
    const observer=new MutationObserver(records=>{
      if(records.some(record=>record.addedNodes.length||record.removedNodes.length))schedule();
    });
    observer.observe(root,{childList:true,subtree:true});
    document.addEventListener('biglwa:module-open',schedule);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();