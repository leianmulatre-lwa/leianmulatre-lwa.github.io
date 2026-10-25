/* Public TikTok creator profile, using TikTok's documented Creator Profile Embed.
 * Uses only an active BIG LWA owner's TikTok connection and a user-provided
 * or provider-reported public @handle. Never downloads or duplicates media.
 */
(()=>{
 'use strict';
 const q=(s,r=document)=>r?.querySelector(s),clean=s=>String(s||'').replace(/^@/,'').trim();
 const valid=s=>/^[a-zA-Z0-9._]{2,40}$/.test(s);
 let currentKey='',loadedFor='',bound=false;
 function activeAccount(){
  const uid=String(window.__biglwaIdentity?.uid||window.BigLWAAccountStorage?.uid||'');
  const t=window.__biglwaTikTokOrbit?.state;
  return uid&&t?.connected&&t.uid===uid?{uid,profile:t.profile||{}}:null;
 }
 function creator(){
  const user=activeAccount();if(!user)return null;
  const oauthName=clean(user.profile.username);
  let saved='';
  try{const u=new URL(String(window.BigLWAOrbitAccountLinks?.get?.()?.tiktok||''));
   if(u.protocol==='https:'&&['www.tiktok.com','tiktok.com','m.tiktok.com'].includes(u.hostname)){
    saved=decodeURIComponent(u.pathname).match(/^\/@([a-zA-Z0-9._]{2,40})\/?$/)?.[1]||'';
   }
  }catch{}
  if(oauthName&&saved&&oauthName.toLowerCase()!==saved.toLowerCase())return null;
  const handle=oauthName||saved;
  if(!valid(handle))return null;
  return {handle,verified:!!oauthName,uid:user.uid};
 }
 function display(){
  // Retired TikTok creator panels: myfeed uses its universal Link field.
  // Orbit still performs background authorized/public content synchronization.
  document.querySelectorAll('[data-biglwa-tiktok-creator]').forEach(node=>node.remove());
  currentKey='';
 }
 let pending=false;
 function refresh(){
  if(pending)return;pending=true;
  requestAnimationFrame(()=>{pending=false;display()});
 }
 for(const event of ['biglwa:tiktok-status','biglwa:orbit-links-synced','biglwa:identity-updated',
                      'biglwa:tiktok-creator-link-saved','biglwa:profile-metrics','biglwa:session-verified']){
   (event==='biglwa:tiktok-status'?document:window).addEventListener(event,refresh);
 }
 document.addEventListener('biglwa:tiktok-status',refresh);
 document.addEventListener('biglwa:module-open',refresh);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});else refresh();
})();
