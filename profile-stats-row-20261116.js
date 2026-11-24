/* Studio profile: keep self-declared badges and verified statistics together.
 * Do not clone, calculate, or republish any count. Only relocate existing nodes.
 */
(()=>{'use strict';
 if(window.__biglwaProfileStatsRow20261116)return;
 window.__biglwaProfileStatsRow20261116=true;
 let requested=false;
 function align(){
  requested=false;
  const profile=document.querySelector('#studioApp .profile-card:not(.profile-is-editing) .profile-copy');
  if(!profile)return;
  const bio=profile.querySelector('.bio');
  let stats=profile.querySelector('.stats');
  if(!bio)return;
  // The profile's stats may arrive after profile hydration. Keep the live
  // metrics renderer as the single owner of all five counts.
  if(!stats){
   stats=document.createElement('div');
   stats.className='stats';
   profile.append(stats);
   window.__biglwaSyncProfileMetrics?.();
  }
  let line=profile.querySelector(':scope > .biglwa-profile-role-statline');
  if(!line){
   line=document.createElement('div');line.className='biglwa-profile-role-statline';
   bio.before(line);
  }
  let left=line.querySelector(':scope > .biglwa-profile-bio-roles');
  if(!left){left=document.createElement('div');left.className='biglwa-profile-bio-roles';line.prepend(left);}
  if(bio.parentElement!==left)left.prepend(bio);
  let board=line.querySelector(':scope > .biglwa-profile-scoreboard');
  if(!board){
   board=document.createElement('section');
   board.className='biglwa-profile-scoreboard';
   board.setAttribute('aria-label','Real rankings scoreboard');
   line.append(board);
  }
  let header=board.querySelector(':scope > .biglwa-scoreboard-header');
  if(!header){
   header=document.createElement('div');
   header.className='biglwa-scoreboard-header';
   header.setAttribute('aria-hidden','true');
   header.textContent='REAL ★ RANKINGS';
   board.prepend(header);
  }
  if(header.textContent!=='REAL ★ RANKINGS')header.textContent='REAL ★ RANKINGS';
  // These are decorative, like the original scoreboard dots; do not register
  // a second set of Studio window actions.
  if(!header.querySelector('.biglwa-scoreboard-lights')){
   const lights=document.createElement('span');
   lights.className='biglwa-scoreboard-lights';
   lights.setAttribute('aria-hidden','true');
   for(const color of ['green','yellow','red']){
    const light=document.createElement('span');
    light.className='window-light '+color;
    lights.append(light);
   }
   header.append(lights);
  }
  board.setAttribute('aria-label','Real rankings scoreboard');
  if(stats.parentElement!==board)board.append(stats);
  // The profile grid was sometimes left at full width, sending an absolutely
  // positioned scoreboard entirely offscreen. Mark its ancestor at the same
  // moment we create the board; the CSS also has a :has fallback.
  profile.closest('.hero')?.classList.add('biglwa-scoreboard-ready');
  const roles=profile.querySelector('.biglwa-community-badges');
  if(roles&&roles.parentElement!==left)left.append(roles);
  const highlights=profile.querySelector('.biglwa-stories-ribbon');
  if(highlights&&line.nextElementSibling!==highlights)line.after(highlights);
  if(highlights?.parentElement===line)line.after(highlights);
  const rank=profile.querySelector(':scope > .real-rank');
  // Hydrated profiles could leave REAL RANK above the Edit Profile button.
  // Keep the ONE real label beside the existing title, progress and next rank.
  const rankLabel=rank?.querySelector('.rank-label')||
    profile.closest('.profile-card')?.querySelector('.profile-identity-rail .rank-label,.biglwa-rank-rail-label');
  const rankTitle=rank?.querySelector('strong');
  if(rank&&rankLabel&&rankLabel.parentElement!==rank)rank.insertBefore(rankLabel,rankTitle||rank.firstChild);
  if(rankLabel&&rankLabel.textContent.trim()!=='REAL ★ RANK')rankLabel.textContent='REAL ★ RANK';
  if(rankTitle){
   rankTitle.setAttribute('role','link');
   rankTitle.setAttribute('tabindex','0');
   rankTitle.setAttribute('aria-label','View '+(rankTitle.textContent.trim()||'Real Rank')+' in Trophies');
   rankTitle.setAttribute('title','Open Trophies');
  }
  if(highlights&&rank&&(highlights.compareDocumentPosition(rank)&Node.DOCUMENT_POSITION_PRECEDING))rank.before(highlights);
 }
 function schedule(){
  if(requested)return;requested=true;requestAnimationFrame(align);
 }
 function openRankTrophies(event){
  const target=event.target?.closest?.('#studioApp .profile-card:not(.profile-is-editing) .real-rank strong[role="link"]');
  if(!target)return;
  if(event.type==='keydown'&&!['Enter',' '].includes(event.key))return;
  event.preventDefault();
  if(typeof window.openBIGLWAModule==='function'){
   window.openBIGLWAModule('trophies');
   return;
  }
  // Use the site's existing trophies launcher when the module router is
  // not yet initialized. Do not create a second URL or a dummy button.
  document.querySelector('#studioApp [data-sidebar-route="trophies"],#studioApp [data-open="trophies"],#studioApp [data-widget-route="trophies"]')?.click();
 }
 function init(){
  schedule();
  document.addEventListener('click',openRankTrophies);
  document.addEventListener('keydown',openRankTrophies);
  const host=document.querySelector('#studioApp')||document.body;
  const observer=new MutationObserver(list=>{
   if(list.some(x=>x.type==='childList'&&
       (x.target.matches?.('.profile-copy,.biglwa-profile-role-statline')||
        x.target.closest?.('.profile-copy'))))schedule();
  });
  observer.observe(host,{childList:true,subtree:true});
  document.addEventListener('biglwa:community-profile-updated',schedule);
  document.addEventListener('biglwa:profile-updated',schedule);
  window.addEventListener('biglwa:profile-updated',schedule);
  window.addEventListener('resize',schedule);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();