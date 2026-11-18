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
  const stats=profile.querySelector('.stats');
  if(!bio||!stats)return;
  let line=profile.querySelector(':scope > .biglwa-profile-role-statline');
  if(!line){
   line=document.createElement('div');line.className='biglwa-profile-role-statline';
   bio.before(line);
  }
  let left=line.querySelector(':scope > .biglwa-profile-bio-roles');
  if(!left){left=document.createElement('div');left.className='biglwa-profile-bio-roles';line.prepend(left);}
  if(bio.parentElement!==left)left.prepend(bio);
  if(stats.parentElement!==line)line.append(stats);
  const roles=profile.querySelector('.biglwa-community-badges');
  if(roles&&roles.parentElement!==left)left.append(roles);
  const highlights=profile.querySelector('.biglwa-stories-ribbon');
  if(highlights&&line.nextElementSibling!==highlights)line.after(highlights);
  if(highlights?.parentElement===line)line.after(highlights);
  const rankLabel=profile.querySelector('.real-rank .rank-label');
  if(rankLabel&&rankLabel.textContent.trim()!=='REAL ✦ RANK')rankLabel.textContent='REAL ✦ RANK';
  const rank=profile.querySelector(':scope > .real-rank');
  if(highlights&&rank&&(highlights.compareDocumentPosition(rank)&Node.DOCUMENT_POSITION_PRECEDING))rank.before(highlights);
 }
 function schedule(){
  if(requested)return;requested=true;requestAnimationFrame(align);
 }
 function init(){
  schedule();
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
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();