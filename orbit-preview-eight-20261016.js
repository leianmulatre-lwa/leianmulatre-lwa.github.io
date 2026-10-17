/* BIG LWA: eight interactive Studio planets, distinct from the full Orbit directory.
   Never report a saved quick link or legacy Meta Business login as personal OAuth. */
(()=>{
  'use strict';
  if(window.__biglwaStudioEightPlanets)return;
  window.__biglwaStudioEightPlanets=true;
  const APPS=[
    ['instagram','IG','Instagram'],
    ['youtube','YT','YouTube'],
    ['tumblr','T','Tumblr'],
    ['pinterest','P','Pinterest'],
    ['tiktok','TT','TikTok'],
    ['snapchat','SC','Snapchat'],
    ['calendar','GC','Google Calendar'],
    ['x','X','X']
  ];
  const MORE=[
    ['facebook','FB','Facebook'],
    ['drive','GD','Google Drive'],
    ['soundcloud','SC','SoundCloud'],
    ['spotify','SP','Spotify'],
    ['goodreads','GR','Goodreads'],
    ['letterboxd','LB','Letterboxd'],
    ['imdb','IMDb','IMDb']
  ];
  const allApps=[...APPS,...MORE];
  const byId=new Map(allApps.map(entry=>[entry[0],entry]));
  const allowed=new Set(byId.keys());
  let scheduled=false,observer,currentOwner='',featured=APPS.map(entry=>entry[0]),pending=new Set();
  const accountOwner=()=>String(window.BigLWAOrbitAccountLinks?.owner?.()||'');
  const storageKey=uid=>'biglwaStudioOrbitFeaturedV2:'+uid;
  function loadOwner(){
    const uid=accountOwner();
    if(uid===currentOwner)return;
    currentOwner=uid;
    featured=APPS.map(entry=>entry[0]);pending=new Set();
    if(!uid)return;
    try{
      const value=JSON.parse(sessionStorage.getItem(storageKey(uid))||'null');
      if(Array.isArray(value?.featured)&&value.featured.length===8 &&
        value.featured.every(id=>allowed.has(id))&&new Set(value.featured).size===8)featured=value.featured;
      pending=new Set(Array.isArray(value?.pending)?value.pending.filter(id=>allowed.has(id)):[]);
    }catch{}
  }
  function remember(){
    if(!currentOwner)return;
    try{sessionStorage.setItem(storageKey(currentOwner),JSON.stringify({featured,pending:[...pending]}))}catch{}
  }
  function rotated(){
    let changed=false;
    for(const id of [...pending]){
      if(!connected(id))continue;
      const idx=featured.indexOf(id);
      if(idx>=0){
        const next=MORE.find(([candidate])=>!featured.includes(candidate)&&!connected(candidate));
        if(next){featured[idx]=next[0];changed=true}
      }
      pending.delete(id);changed=true;
    }
    if(changed)remember();
  }
  const grid=()=>document.querySelector('#studioApp #orbit #orbitGrid');
  function openOrbit(){
    if(typeof window.openBIGLWAModule==='function')window.openBIGLWAModule('orbit');
    else location.assign('/studio?view=orbit');
  }
  function connected(id){
    // Only actual provider authorizations count. Link-only Quick Links never do.
    try{
      if(id==='instagram')return !!window.__biglwaInstagramOrbit?.state?.connected;
      if(id==='tiktok')return !!window.__biglwaTikTokOrbit?.state?.connected;
      if(id==='pinterest')return !!window.__biglwaPinterest?.state?.connected;
      if(id==='youtube'||id==='calendar'||id==='drive')return !!window.__biglwaGoogleOrbit?.state?.connected;
      if(['spotify','soundcloud','goodreads','letterboxd','imdb'].includes(id))
        return !!window.BigLWAOrbitAccountLinks?.get?.()?.[id];
      if(id==='facebook')return !!window.BigLWAFacebookPersonal?.state?.connected &&
        !!window.BigLWAFacebookPersonal?.state?.profile;
      return !!window.BigLWAOrbitOAuth?.get?.(id);
    }catch{return false}
  }
  function byIdApp(id){return byId.get(id)||APPS[0]}
  function createTile(id,glyph,label){
    const el=document.createElement('button');
    el.type='button';el.dataset.orbitApp=id;
    const planet=document.createElement('span');
    planet.className='orbit-glyph';planet.textContent=glyph;
    const title=document.createElement('b');title.textContent=label;
    const status=document.createElement('small');status.textContent='Connect';
    el.append(planet,title,status);
    return el;
  }
  function refresh(){
    scheduled=false;
    const root=grid();
    if(!root)return;
    loadOwner();
    rotated();
    const existing=Array.from(root.children).filter(el=>el.matches?.('button[data-orbit-app]'));
    const byId=new Map();
    for(const el of existing){
      const id=el.dataset.orbitApp;
      if(!featured.includes(id)||byId.has(id)){el.remove();continue}
      byId.set(id,el);
    }
    // Reuse the existing sphere, not a flat replacement or provider logo.
    for(const id of featured){
      const [,glyph,label]=byIdApp(id);
      let tile=byId.get(id);
      if(!tile)tile=createTile(id,glyph,label);
      let planet=tile.querySelector('.orbit-glyph');
      if(!planet){planet=document.createElement('span');planet.className='orbit-glyph';planet.textContent=glyph;tile.prepend(planet)}
      let title=tile.querySelector('b');
      if(!title){title=document.createElement('b');tile.append(title)}
      if(title.textContent!==label)title.textContent=label;
      let status=tile.querySelector('small');
      if(!status){status=document.createElement('small');tile.append(status)}
      const isConnected=connected(id);
      const text=isConnected?'Connected':'Connect';
      if(status.textContent!==text)status.textContent=text;
      if(tile.classList.contains('orbit-connected')!==isConnected)
        tile.classList.toggle('orbit-connected',isConnected);
      tile.setAttribute('aria-label',(isConnected?'Manage ':'Connect ')+label+(isConnected?' in Orbit':''));
      tile.dataset.orbitPreview='1';
      // DOM order itself is canonical, including for keyboard navigation.
      root.appendChild(tile);
    }
    const card=root.closest('#orbit');
    const note=card?.querySelector('.orbit-note');
    if(note&&!note.dataset.orbitError){
      const help='Tap a planet to connect. Connected planets open your Orbit settings.';
      if(note.textContent!==help)note.textContent=help;
    }
  }
  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(refresh);
  }
  function issue(message){
    const card=grid()?.closest('#orbit');
    const note=card?.querySelector('.orbit-note');
    if(note){note.dataset.orbitError='1';note.textContent=String(message)}
    else console.warn('Orbit:',message);
  }
  function startConnection(id){
    switch(id){
      case 'instagram': return window.__biglwaInstagramOrbit?.connect?.();
      case 'pinterest':return window.__biglwaPinterest?.connect?.();
      case 'tiktok':return window.__biglwaTikTokOrbit?.connect?.();
      case 'youtube':case 'calendar':case 'drive':return window.__biglwaGoogleOrbit?.connect?.();
      case 'spotify':case 'soundcloud':case 'goodreads':case 'letterboxd':case 'imdb':
        openOrbit();
        requestAnimationFrame(()=>document.querySelector(
          '#moduleWorkspace[data-module-key="orbit"] [data-orbit-row="'+id+'"] input[data-orbit-path]'
        )?.focus({preventScroll:false}));
        return;
      case 'facebook':return window.BigLWAFacebookPersonal?.connect?.();
      case 'tumblr':case 'snapchat':case 'x':return window.BigLWAOrbitOAuth?.connect?.(id);
    }
  }
  function click(event){
    const tile=event.target?.closest?.('#studioApp #orbit #orbitGrid > button[data-orbit-app]');
    if(!tile)return;
    const id=tile.dataset.orbitApp;
    if(!allowed.has(id))return;
    // The older provider SDKs add document-level capture listeners.
    // Handle the Studio preview once, before those handlers can divert to
    // Meta Business or a manually saved profile link.
    event.preventDefault();event.stopImmediatePropagation();
    if(connected(id)){openOrbit();return}
    loadOwner();
    if(currentOwner){pending.add(id);remember()}
    const started=startConnection(id);
    if(started===undefined){
      // Some clients begin a redirect and return void; only report missing
      // integrations when there is actually no client method available.
      const handlers={
        instagram:window.__biglwaInstagramOrbit?.connect,
        pinterest:window.__biglwaPinterest?.connect,
        tiktok:window.__biglwaTikTokOrbit?.connect,
        youtube:window.__biglwaGoogleOrbit?.connect,
        calendar:window.__biglwaGoogleOrbit?.connect,
        drive:window.__biglwaGoogleOrbit?.connect,
        spotify:openOrbit,soundcloud:openOrbit,goodreads:openOrbit,
        letterboxd:openOrbit,imdb:openOrbit,
        facebook:window.BigLWAFacebookPersonal?.connect,
        tumblr:window.BigLWAOrbitOAuth?.connect,
        snapchat:window.BigLWAOrbitOAuth?.connect,
        x:window.BigLWAOrbitOAuth?.connect
      };
      if(typeof handlers[id]!=='function')issue('The '+id+' connector is loading. Try again shortly.');
    }
    if(started&&typeof started.catch==='function')
      started.catch(error=>issue(error?.message||'Connection could not start. Try again.'));
    schedule();
  }
  const boot=()=>{
    schedule();
    // A single observer follows Studio shell rebuilds and restores its eight
    // planets without replacing account-specific connection state.
    if(!observer){
      const target=document.querySelector('#studioApp')||document.body;
      observer=new MutationObserver(records=>{
        if(records.some(record=>{
          if(record.target?.closest?.('#orbitGrid'))return false; // ignore our own small text updates
          return [...record.addedNodes,...record.removedNodes].some(node=>
            node.nodeType===1&&(node.id==='studioApp'||node.id==='orbitGrid'||node.id==='orbit'||node.querySelector?.('#orbitGrid'))
          );
        }))schedule();
      });
      observer.observe(target,{subtree:true,childList:true});
    }
  };
  window.addEventListener('click',click,true);
  for(const name of ['biglwa:tiktok-status','biglwa:pinterest-status','biglwa:new-orbit-status',
    'biglwa:facebook-personal-status','biglwa:google-state','biglwa:module-open',
    'biglwa:instagram-status','biglwa:session-verified']){
    document.addEventListener(name,schedule);
  }
  window.addEventListener('biglwa:orbit-links-synced',schedule);
  window.addEventListener('biglwa:orbit-imported',schedule);
  window.__biglwaStudioOrbitRefresh=schedule;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();