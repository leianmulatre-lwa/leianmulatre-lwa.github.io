/* BIG LWA · compact scoreboard layout & account-scoped Skeleton Key controls.
   Does not duplicate, overwrite or reconstruct stats; only decorates existing node. */
(()=>{'use strict';
 if(window.__biglwaCompactScoreboard20261118)return;
 window.__biglwaCompactScoreboard20261118=true;
 const $=(s,r=document)=>r.querySelector(s);
 const uid=()=>String(window.BigLWAAccountStorage?.uid||window.__biglwaIdentity?.uid||'').trim();
 const preview=()=>!!window.__biglwaPublicStorageView||!!document.documentElement?.classList?.contains('biglwa-preview-mode');
 const hex=x=>String(x||'').toLowerCase()==='#ffffff'?'#ffffff':'';
 let appliedUid='',ink='',plate='maroon',acceptedInk='',acceptedPlate='maroon',writes=Promise.resolve(),scheduled=false;
 let clockPrefs={format:'12h',zone:''}, clockSaving=false;
 function validZone(value){
  if(typeof value!=='string'||value.length>100)return '';
  try{new Intl.DateTimeFormat('en-US',{timeZone:value});return value}catch{return ''}
 }
 function normalizeClock(value){
  return {format:value?.format==='24h'?'24h':'12h',zone:validZone(value?.zone)};
 }
 function clockParts(date,prefs){
  const options={hour:'2-digit',minute:'2-digit',hourCycle:prefs.format==='24h'?'h23':'h12',...(prefs.zone?{timeZone:prefs.zone}:{})};
  const parts=new Intl.DateTimeFormat('en-US',options).formatToParts(date);
  const part=type=>parts.find(p=>p.type===type)?.value||'';
  return {time:part('hour')+':'+part('minute'),period:part('dayPeriod'),zone:new Intl.DateTimeFormat('en-US',{...(prefs.zone?{timeZone:prefs.zone}:{}),timeZoneName:'short'}).formatToParts(date).find(p=>p.type==='timeZoneName')?.value||''};
 }
 function setText(node,value){if(node&&node.textContent!==value)node.textContent=value}
 function renderClock(){
  const board=$('#studioApp .profile-card:not(.profile-is-editing) .biglwa-profile-scoreboard');
  if(!board)return;
  let box=$('.biglwa-score-clock',board);
  if(!box){
   box=document.createElement('button');box.type='button';box.className='biglwa-score-clock';
   box.innerHTML='<span class="biglwa-score-clock-label">TIME</span><span class="biglwa-score-clock-face"><b>--:--</b><small></small></span><span class="biglwa-score-clock-zone"></span>';
   board.append(box);
  }
  const guest=preview(),prefs=guest?{format:'12h',zone:''}:clockPrefs;
  box.disabled=guest;
  const value=clockParts(new Date(),prefs);
  setText($('b',box),value.time);
  setText($('small',box),value.period);
  setText($('.biglwa-score-clock-zone',box),value.zone);
  box.title=guest?'Viewer local time':'Change clock format or time zone';
  const label='Time '+value.time+' '+value.period+' '+value.zone+(guest?'':'. Change clock settings');
  if(box.getAttribute('aria-label')!==label)box.setAttribute('aria-label',label);
 }
 function openClock(){
  if(preview())return;
  let dialog=$('#biglwaScoreClockDialog');
  if(!dialog){
   dialog=document.createElement('dialog');dialog.id='biglwaScoreClockDialog';dialog.className='biglwa-score-clock-dialog';
   dialog.setAttribute('aria-labelledby','biglwaScoreClockTitle');
   dialog.innerHTML='<form><h2 id="biglwaScoreClockTitle">Clock settings</h2><label>Time format<select name="format"><option value="12h">12-hour (AM / PM)</option><option value="24h">24-hour (military)</option></select></label><label>Time zone<select name="zone"></select></label><p role="status"></p><div><button type="button" data-clock-cancel>Cancel</button><button type="submit">Save</button></div></form>';
   document.body.append(dialog);
   $('[data-clock-cancel]',dialog).addEventListener('click',()=>dialog.close());
   $('form',dialog).addEventListener('submit',async event=>{
    event.preventDefault();if(clockSaving||preview())return;
    const next=normalizeClock({format:$('[name="format"]',dialog).value,zone:$('[name="zone"]',dialog).value}),owner=uid(),status=$('[role="status"]',dialog);
    if(!owner||!window.BigLWAUserDirectory?.saveCustomizations){setText(status,'Sign in to save clock settings.');return}
    clockSaving=true;const save=$('[type="submit"]',dialog);save.disabled=true;setText(status,'Saving…');
    try{
     const ok=await window.BigLWAUserDirectory.saveCustomizations({appearance:{scoreboardClock:next}});
     if(!ok||uid()!==owner||preview())throw Error('Clock settings not saved');
     clockPrefs=next;renderClock();dialog.close();
    }catch{setText(status,'Could not save clock settings. Please retry.')}
    finally{clockSaving=false;save.disabled=false}
   });
  }
  const select=$('[name="zone"]',dialog);
  const zones=typeof Intl.supportedValuesOf==='function'?Intl.supportedValuesOf('timeZone'):['America/Los_Angeles','America/Denver','America/Chicago','America/New_York','America/Port-au-Prince','Europe/London','Europe/Paris','Africa/Lagos','Asia/Kolkata','Asia/Tokyo','Australia/Sydney'];
  while(select.firstChild)select.removeChild(select.firstChild);
  for(const value of ['',...new Set(['UTC',...zones,...(clockPrefs.zone?[clockPrefs.zone]:[])])]){
   const option=document.createElement('option');option.value=value;option.textContent=value?value.replace(/_/g,' '):'Automatic (device time zone)';select.append(option);
  }
  select.value=clockPrefs.zone;$('[name="format"]',dialog).value=clockPrefs.format;setText($('[role="status"]',dialog),'');
  if(!dialog.open)dialog.showModal();
 }

 function repaint(){
  if(preview())return;
  const app=$('#studioApp');if(!app)return;
  if(ink)app.style.setProperty('--biglwa-score-ink',ink);
  else app.style.removeProperty('--biglwa-score-ink');
  const board=$('.biglwa-profile-scoreboard',app);
  if(board)board.dataset.scoreboardPlate=plate;
  const input=$('#skeletonScoreboardColor');
  if(input)input.value=ink||'';
  const select=$('#skeletonScoreboardPlate');
  if(select)select.value=plate;
  const status=$('#skeletonScoreboardStatus');
  if(status&&status.dataset.saving!=='1')status.textContent=ink?'White LED text':'LED text follows your Aura';
 }
 function hydrate(remote){
  const current=uid();
  if(!current||preview()||remote?.uid!==current)return;
  appliedUid=current;
  const s=remote?.customization?.appearance||{};
  ink=hex(s.scoreboardTextColor);
  plate=s.scoreboardPlate==='clear'?'clear':'maroon';
  acceptedInk=ink;acceptedPlate=plate;
  clockPrefs=normalizeClock(s.scoreboardClock);
  repaint();renderClock();
 }
 function ensurePrefs(){
  if(preview())return;
  const area=$('#biglwaSkeletonHub .skeleton-analytics-details');
  if(!area||area.querySelector('.skeleton-scoreboard-prefs'))return;
  const block=document.createElement('div');block.className='skeleton-scoreboard-prefs';
  block.setAttribute('aria-label','Scoreboard appearance');
  block.innerHTML='<strong>Real rankings · colors</strong>'+
    '<label>LED text <select id="skeletonScoreboardColor" aria-label="Scoreboard LED text color"><option value="">Current Aura</option><option value="#ffffff">White</option></select></label>'+

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
   clockPrefs=normalizeClock();const dialog=$('#biglwaScoreClockDialog');if(dialog?.open)dialog.close();
   if(uid()&&window.__biglwaRemoteCustomization?.uid===uid())hydrate(window.__biglwaRemoteCustomization);
  }
  ensurePrefs();
  repaint();renderClock();
 }

 // Keep the live scoreboard a right-hand tile instead of falling back on top
 // of the profile whenever layout CSS arrives a frame after the DOM.
 function verifyOnscreen(){
  const app=$('#studioApp'),hero=app?.querySelector('.hero'),
        card=hero?.querySelector('.profile-card:not(.profile-is-editing)'),
        board=card?.querySelector('.biglwa-profile-scoreboard');
  if(!hero||!board)return;
  // Clear the old class for sessions retaining previously applied JS state.
  hero.classList.remove('biglwa-scoreboard-onscreen-fallback');
  if((window.innerWidth||document.documentElement.clientWidth)<901)return;
  const profileRect=card.getBoundingClientRect?.(),boardRect=board.getBoundingClientRect?.();
  if(!profileRect||!boardRect||!profileRect.width)return;
  if(boardRect.left<profileRect.right+6){
   if(hero.dataset.biglwaScoreboardWarning!=='1'){
    hero.dataset.biglwaScoreboardWarning='1';
    console.warn('[BIG LWA] Scoreboard failed to occupy the right tile; check Studio grid styles.');
   }
  }else{delete hero.dataset.biglwaScoreboardWarning}
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
  setInterval(renderClock,1000);
  document.addEventListener('visibilitychange',renderClock);
  document.addEventListener('click',event=>{if(event.target?.closest?.('.biglwa-score-clock')&&!preview()){event.preventDefault();openClock()}});
  document.addEventListener('change',event=>{
   if(event.target?.id==='skeletonScoreboardColor')update('scoreboardTextColor',event.target.value);
   if(event.target?.id==='skeletonScoreboardPlate')update('scoreboardPlate',event.target.value);
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
   const app=$('#studioApp'),hero=app?.querySelector('.hero');
   if(hero)observed.observe(hero);
   const card=app?.querySelector('.profile-card');
   if(card)observed.observe(card);
   const board=card?.querySelector('.biglwa-profile-scoreboard');
   if(board)observed.observe(board);
   // The existing profile script may add the board after first paint.
   window.addEventListener('biglwa:profile-updated',()=>{
    const current=$('#studioApp .profile-card .biglwa-profile-scoreboard');
    if(current)observed.observe(current);
   });
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
