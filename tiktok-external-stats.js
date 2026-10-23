/* BIG LWA external TikTok public-source snapshot.
 * Connect first, attach the public @handle, then read a publicly cached
 * TokPortal profile page through our isolated read-only Cloudflare adapter.
 * External publication of a number is not proof of TikTok ownership.
 */
(()=>{
'use strict';
const ORIGIN='https://biglwa-public-tiktok-snapshots.leianmulatre-284.workers.dev';
const PREFIX='biglwaExternalTiktokStatsV1:';
const handleOf=url=>{try{const u=new URL(url);if(u.protocol!=='https:'||!['www.tiktok.com','tiktok.com','m.tiktok.com'].includes(u.hostname))return '';return decodeURIComponent(u.pathname).match(/^\/@([A-Za-z0-9._]{2,40})\/?$/)?.[1]||''}catch{return ''}};
const owner=()=>String(window.__biglwaIdentity?.uid||window.BigLWAAccountStorage?.uid||'');
const connected=()=>{
 const uid=owner(),state=window.__biglwaTikTokOrbit?.state;
 if(!uid||!state?.connected||state.uid!==uid)return null;
 const raw=window.BigLWAOrbitAccountLinks?.get?.()?.tiktok||'';
 const oauthHandle=String(state.profile?.username||'').replace(/^@/,'');
 const savedHandle=handleOf(raw);
 if(oauthHandle&&savedHandle&&oauthHandle.toLowerCase()!==savedHandle.toLowerCase())return null;
 const handle=oauthHandle||savedHandle;
 if(!/^[A-Za-z0-9._]{2,40}$/.test(handle))return null;
 return {uid,handle,oauthMatched:!!oauthHandle};
};
let current=null,flight=null,checking='';
function cacheKey(account){return PREFIX+account.uid+':'+account.handle.toLowerCase()}
function previous(account){
 try{const row=JSON.parse(localStorage.getItem(cacheKey(account))||'null');
  return row?.handle?.toLowerCase()===account.handle.toLowerCase()&&row?.uid===account.uid?row:null}catch{return null}
}
function snapshot(){
 const account=connected();
 if(!account)return null;
 const item=previous(account);
 if(!item?.available||!Number.isSafeInteger(Number(item.followers))||Number(item.followers)<0)return null;
 return {...item,oauthMatched:account.oauthMatched};
}
function notify(){
 window.dispatchEvent(new CustomEvent('biglwa:external-stats-updated'));
 renderStatus();
}
function renderStatus(){
 const row=document.querySelector('#moduleWorkspace[data-module-key="orbit"] [data-orbit-row="tiktok"]');
 if(!row)return;
 const actions=row.querySelector('.module-actions');
 if(!actions)return;
 let button=actions.querySelector('[data-tiktok-lookup]');
 if(!button){
  button=document.createElement('button');button.className='module-action ghost';
  button.type='button';button.dataset.tiktokLookup='1';
  button.textContent='Refresh public stats';button.addEventListener('click',()=>refresh(true));
  actions.append(button);
 }
 const record=snapshot();
 let line=row.querySelector('[data-tiktok-lookup-status]');
 if(!line){line=document.createElement('small');line.dataset.tiktokLookupStatus='1';
  line.style.cssText='display:block;grid-column:1/-1;padding:2px 10px;color:#725365;font:500 10px/1.4 system-ui';
  row.append(line)}
 line.textContent=!connected()?'Connect TikTok and save your @profile URL for external public counts.':
  record?'Externally sourced · @'+record.handle+' · '+new Intl.NumberFormat().format(record.followers)+' followers · TokPortal snapshot':
  'Public stats will appear if TokPortal has this profile indexed.';
}
async function refresh(force=false){
 const account=connected();
 renderStatus();
 if(!account)return;
 const old=previous(account),age=Date.now()-Number(old?.checkedAtMs||0);
 if(!force&&age>=0&&age<6*3600000)return;
 const id=cacheKey(account);
 if(flight&&checking===id)return flight;
 if(flight)return;
 checking=id;
 flight=(async()=>{
   try{
    const controller=new AbortController(); // fetch has a finite browser timeout below
    const response=await fetch(ORIGIN+'/tiktok/'+encodeURIComponent(account.handle),{
     cache:'no-store',signal:controller.signal,mode:'cors'});
    if(!response.ok)throw Error('External source unavailable.');
    const item=await response.json();
    if(owner()!==account.uid||connected()?.handle?.toLowerCase()!==account.handle.toLowerCase())return;
    if(item.handle?.toLowerCase()!==account.handle.toLowerCase())throw Error('External handle mismatch.');
    const stored={...item,uid:account.uid,handle:account.handle,checkedAtMs:Date.now(),
      available:item.available===true&&Number.isSafeInteger(Number(item.followers))};
    localStorage.setItem(id,JSON.stringify(stored));
    notify();
   }catch(e){console.warn('External TikTok snapshot unavailable:',e.message);renderStatus()}
 })();
 try{await flight}finally{flight=null;checking=''}
}
let timer;
function changed(){
 clearTimeout(timer);timer=setTimeout(()=>{renderStatus();refresh(false)},220);
}
document.addEventListener('biglwa:tiktok-status',changed);
document.addEventListener('biglwa:module-open',changed);
document.addEventListener('biglwa:new-orbit-status',changed);
window.addEventListener('biglwa:identity-updated',changed);
window.addEventListener('biglwa:orbit-links-synced',changed);
window.BigLWAExternalTiktok=Object.freeze({snapshot,refresh});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',changed,{once:true});
else changed();
})();
