/* BIG LWA · compact scoreboard layout & account-scoped Skeleton Key controls.
   Does not duplicate, overwrite or reconstruct stats; only decorates existing node. */
(()=>{'use strict';
 if(window.__biglwaCompactScoreboard20261118)return;
 window.__biglwaCompactScoreboard20261118=true;
 const $=(s,r=document)=>r.querySelector(s);
 const uid=()=>String(window.BigLWAAccountStorage?.uid||window.__biglwaIdentity?.uid||'').trim();
 const preview=()=>!!window.__biglwaPublicStorageView||!!document.documentElement?.classList?.contains('biglwa-preview-mode');
 const hex=x=>typeof x==='string'&&/^#[0-9a-f]{6}$/i.test(x)?x.toLowerCase():'';
 let appliedUid='',ink='',plate='maroon',acceptedInk='',acceptedPlate='maroon',writes=Promise.resolve(),scheduled=false;
 const DEFAULT_AURA='#d85f6d';
 function auraHex(){
  const app=$('#studioApp');
  if(!app||typeof getComputedStyle!=='function')return DEFAULT_AURA;
  const rgb=getComputedStyle(app).getPropertyValue('--aura-rgb').trim().split(',').map(Number);
  return rgb.length===3&&rgb.every(x=>Number.isInteger(x)&&x>=0&&x<=255)?'#'+rgb.map(x=>x.toString(16).padStart(2,'0')).join(''):DEFAULT_AURA;
 }
 function repaint(){
  if(preview())return;
  const app=$('#studioApp');if(!app)return;
  if(ink)app.style.setProperty('--biglwa-score-ink',ink);
  else app.style.removeProperty('--biglwa-score-ink');
  const board=$('.biglwa-profile-scoreboard',app);
  if(board)board.dataset.scoreboardPlate=plate;
  const input=$('#skeletonScoreboardColor');
  if(input&&document.activeElement!==input)input.value=ink||auraHex();
  const select=$('#skeletonScoreboardPlate');
  if(select)select.value=plate;
  const status=$('#skeletonScoreboardStatus');
  if(status&&status.dataset.saving!=='1')status.textContent=ink?'Custom LEDs · '+ink:'LED text follows your Aura';
 }
 function hydrate(remote){
  const current=uid();
  if(!current||preview()||remote?.uid!==current)return;
  appliedUid=current;
  const s=remote?.customization?.appearance||{};
  ink=hex(s.scoreboardTextColor);
  plate=s.scoreboardPlate==='clear'?'clear':'maroon';
  acceptedInk=ink;acceptedPlate=plate;
  repaint();
 }
 function ensurePrefs(){
  if(preview())return;
  const area=$('#biglwaSkeletonHub .skeleton-analytics-details');
  if(!area||area.querySelector('.skeleton-scoreboard-prefs'))return;
  const block=document.createElement('div');block.className='skeleton-scoreboard-prefs';
  block.setAttribute('aria-label','Scoreboard appearance');
  block.innerHTML='<strong>Profile scoreboard · colors</strong>'+
    '<label>LED text <input id="skeletonScoreboardColor" type="color" aria-label="Scoreboard LED text color" value="#d85f6d"></label>'+
    '<button type="button" id="skeletonScoreboardUseAura">Use current Aura</button>'+
    '<label>Outer frame <select id="skeletonScoreboardPlate" aria-label="Scoreboard outer frame"><option value="maroon">Maroon red</option><option value="clear">Clear</option></select></label>'+
    '<p class="skeleton-scoreboard-status" id="skeletonScoreboardStatus" role="status">LED text follows your Aura</p>';
  area.append(block);repaint();
 }
 function synchronize(){
  const app=$('#studioApp'),profile=app?.querySelector('.profile-card:not(.profile-is-editing)');
  const board=profile?.querySelector('.biglwa-profile-scoreboard');
  const hero=profile?.closest('.hero');
  if(hero&&board)hero.classList.add('biglwa-scoreboard-ready');
  if(uid()!==appliedUid){
   ink='';plate='maroon';acceptedInk='';acceptedPlate='maroon';appliedUid=uid();
   if(uid()&&window.__biglwaRemoteCustomization?.uid===uid())hydrate(window.__biglwaRemoteCustomization);
  }
  ensurePrefs();
  repaint();
 }

 // Guard against late profile styles stretching the banner back to full width.
 // Never put the live data or scoreboard offscreen; do not duplicate counts.
 function verifyOnscreen(){
  const app=$('#studioApp'),hero=app?.querySelector('.hero'),
        card=hero?.querySelector('.profile-card:not(.profile-is-editing)'),
        board=card?.querySelector('.biglwa-profile-scoreboard');
  if(!hero||!board)return;
  const desktop=(window.innerWidth||document.documentElement.clientWidth)>1200;
  if(!desktop){hero.classList.remove('biglwa-scoreboard-onscreen-fallback');return}
  if(hero.classList.contains('biglwa-scoreboard-onscreen-fallback'))return;
  const frame=hero.getBoundingClientRect?.(),box=board.getBoundingClientRect?.();
  if(!frame||!box||!frame.width)return;
  if(box.width<80||box.left>=frame.right-30||box.right>Math.min(frame.right,window.innerWidth||frame.right)+12){
   hero.classList.add('biglwa-scoreboard-onscreen-fallback');
   console.warn('[BIG LWA] Scoreboard layout fell outside Studio; using safe on-banner position.');
  }
 }
 function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{
  scheduled=false;synchronize();
  requestAnimationFrame(verifyOnscreen);
 })}

 function update(setting,value){
  if(preview()||!uid()||!window.BigLWAUserDirectory?.saveCustomizations)return;
  const previousInk=acceptedInk,previousPlate=acceptedPlate,owner=uid();
  if(setting==='scoreboardTextColor')ink=hex(value);
  else plate=value==='clear'?'clear':'maroon';
  repaint();
  const status=$('#skeletonScoreboardStatus');
  if(status){status.dataset.saving='1';status.textContent='Saving to your account…'}
  const sent=setting==='scoreboardTextColor'?ink:plate;
  writes=writes.catch(()=>{}).then(async()=>{
   const ok=await window.BigLWAUserDirectory.saveCustomizations({appearance:{[setting]:sent}});
   if(!ok||uid()!==owner)throw Error('Account scoreboard setting was not saved');
   if(setting==='scoreboardTextColor')acceptedInk=sent;else acceptedPlate=sent;
   if(status?.isConnected){delete status.dataset.saving;status.textContent='Saved to your account'}
  }).catch(err=>{
   if(uid()===owner){ink=previousInk;plate=previousPlate;repaint()}
   if(status?.isConnected){delete status.dataset.saving;status.textContent='Save failed · please retry'}
   console.warn('[BIG LWA] Scoreboard style:',err);
  });
 }
 function start(){
  schedule();
  document.addEventListener('input',event=>{
   if(event.target?.id==='skeletonScoreboardColor'&&uid()&&!preview()){
    ink=hex(event.target.value);repaint();
   }
  });
  document.addEventListener('change',event=>{
   if(event.target?.id==='skeletonScoreboardColor')update('scoreboardTextColor',event.target.value);
   if(event.target?.id==='skeletonScoreboardPlate')update('scoreboardPlate',event.target.value);
  });
  document.addEventListener('click',event=>{
   if(event.target?.closest?.('#skeletonScoreboardUseAura'))update('scoreboardTextColor','');
  });
  window.addEventListener('biglwa:customization-remote',event=>{hydrate(event.detail);schedule()});
  document.addEventListener('biglwa:community-profile-updated',schedule);
  document.addEventListener('biglwa:profile-updated',schedule);
  window.addEventListener('resize',()=>{
   $('#studioApp .hero')?.classList.remove('biglwa-scoreboard-onscreen-fallback');
   schedule();
  });
  if(typeof ResizeObserver!=='undefined'){
   const observed=new ResizeObserver(()=>requestAnimationFrame(verifyOnscreen));
   const hero=$('#studioApp .hero');
   if(hero)observed.observe(hero);
  }

  const host=$('#studioApp')||document.body;
  const observer=new MutationObserver(records=>{
   if(records.some(x=>x.addedNodes?.length&&[...x.addedNodes].some(n=>n.nodeType===1&&(n.matches?.('.profile-card,.biglwa-profile-scoreboard,#biglwaSkeletonHub')||n.querySelector?.('.biglwa-profile-scoreboard,.skeleton-analytics-details')))))schedule();
  });
  observer.observe(host,{childList:true,subtree:true});
  schedule();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
