/* Member-only TikTok audience refresh.
 * TikTok OAuth is the only source of machine-readable authorized audience counts.
 * Its public creator embed displays counts visually, but cannot be used as a
 * cross-origin stats API. TokPortal's checker has no keyless profile GET API.
 */
(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const current=()=>{
 const uid=String(window.__biglwaIdentity?.uid||window.BigLWAAccountStorage?.uid||'');
 const state=window.__biglwaTikTokOrbit?.state;
 if(!uid||!state?.connected||state.uid!==uid)return null;
 let handle=String(state.profile?.username||'').replace(/^@/,'');
 try{
  const link=window.BigLWAOrbitAccountLinks?.get?.()?.tiktok;
  const url=new URL(link);
  if(!handle&&url.protocol==='https:'&&['tiktok.com','www.tiktok.com','m.tiktok.com'].includes(url.hostname))
   handle=decodeURIComponent(url.pathname).match(/^\/@([a-zA-Z0-9._]{2,40})\/?$/)?.[1]||'';
 }catch{}
 return {uid,handle,profile:state.profile||{}};
};
const numeric=v=>v===null||v===undefined||v===''?null:Number.isSafeInteger(Number(v))&&Number(v)>=0?Number(v):null;
const source=()=>{
 const account=current();if(!account)return null;
 const n=numeric(account.profile.follower_count);
 if(n===null)return null;
 return {uid:account.uid,handle:account.handle,followers:n,following:numeric(account.profile.following_count),
  likes:numeric(account.profile.likes_count),videoCount:numeric(account.profile.video_count),
  source:'TikTok authorized user.info.stats',verifiedFromProvider:true};
};
let lastMessage='',busy=false;
function paint(){
 const row=$('#moduleWorkspace[data-module-key="orbit"] [data-orbit-row="tiktok"]');
 if(!row)return;
 const actions=$('.module-actions',row);if(!actions)return;
 let button=$('[data-tiktok-lookup]',actions);
 if(!button){
  button=document.createElement('button');button.type='button';button.className='module-action ghost';
  button.dataset.tiktokLookup='1';button.textContent='Refresh stats';
  button.addEventListener('click',refresh);
  actions.append(button);
 }
 button.disabled=busy;
 button.textContent=busy?'Checking TikTok…':'Refresh stats';
 let help=$('[data-tiktok-lookup-status]',row);
 if(!help){help=document.createElement('small');help.dataset.tiktokLookupStatus='1';
  help.style.cssText='display:block;grid-column:1/-1;padding:2px 10px;color:#725365;font:500 10px/1.4 system-ui';
  row.append(help)}
 const member=current(),stats=source();
 help.replaceChildren();
 if(!member){help.textContent='Connect TikTok in Orbit to refresh your own account.';return}
 if(stats){
  help.textContent='✓ TikTok-reported · '+stats.followers.toLocaleString()+' followers';
  if(stats.likes!==null)help.textContent+=' · '+stats.likes.toLocaleString()+' received likes';
  return;
 }
 help.append(document.createTextNode(lastMessage||'TikTok connected; numeric stats are not included in the current permission.'));
 if(member.handle&&/^[a-zA-Z0-9._]{2,40}$/.test(member.handle)){
  const a=document.createElement('a');a.href='https://www.tiktok.com/@'+member.handle;
  a.target='_blank';a.rel='noopener noreferrer';a.textContent=' · View public counts ↗';
  a.style.cssText='color:#754054;font-weight:700';
  help.append(a);
 }
}
async function refresh(){
 if(busy)return;
 const before=current();
 if(!before){lastMessage='Connect TikTok to check account stats.';paint();return}
 busy=true;lastMessage='Checking TikTok authorization…';paint();
 try{
  await window.__biglwaTikTokOrbit?.restore?.();
  if(!current()||current().uid!==before.uid)throw Error('Your TikTok connection is no longer active.');
  const stats=source();
  lastMessage=stats?'TikTok profile counts updated.':
   'TikTok did not return numeric counts for this connection. Public counts remain viewable on the original profile.';
  window.dispatchEvent(new CustomEvent('biglwa:external-stats-updated'));
 }catch(e){lastMessage=String(e?.message||'Refresh unavailable.').slice(0,150)}
 finally{busy=false;paint()}
}
let timer;
function queue(){clearTimeout(timer);timer=setTimeout(paint,50)}
document.addEventListener('biglwa:tiktok-status',queue);
document.addEventListener('biglwa:module-open',queue);
window.addEventListener('biglwa:orbit-links-synced',queue);
window.addEventListener('biglwa:identity-updated',()=>{lastMessage='';queue()});
window.BigLWAExternalTiktok=Object.freeze({snapshot:source,refresh});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',queue,{once:true});else queue();
})();
