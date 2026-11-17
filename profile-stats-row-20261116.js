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
  if(bio.parentElement!==line)line.prepend(bio);
  if(stats.parentElement!==line)line.append(stats);
  const roles=profile.querySelector('.biglwa-community-badges');
  if(roles&&line.nextElementSibling!==roles)line.after(roles);
  const highlights=profile.querySelector('.biglwa-stories-ribbon');
  if(roles&&highlights&&roles.nextElementSibling!==highlights)roles.after(highlights);
  if(highlights?.parentElement===line)line.after(highlights);
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