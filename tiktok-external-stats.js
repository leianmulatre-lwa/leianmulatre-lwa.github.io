/* BIG LWA TikTok follower metrics.
 * Prefer OAuth user.info.stats; when unavailable, use a public username-matched
 * observation, explicitly marked as external and potentially stale.
 * The external snapshot does not establish account ownership.
 */
(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const PUBLIC='https://biglwa-public-tiktok-snapshots.leianmulatre-284.workers.dev';
/* The public snapshot adapter exposes followers only. The owner-approved tracker
   summary supplies cumulative likes and the monthly statistic that counts toward
   Reach on the profile, without claiming provider authorization. */
const TRACKER='/assets/tiktok/tracker-summary.json?v=20261028-1';
const VALID=/^[a-zA-Z0-9._]{2,40}$/;
const numeric=v=>v===null||v===undefined||v===''?null:Number.isSafeInteger(Number(v))&&Number(v)>=0?Number(v):null;
let lastMessage='',busy=false,publicSnapshot=null,lastAttempt='',lastAttemptAt=0,lastState='',trackerSummary=null,trackerRequested=false;
const current=()=>{
 const uid=String(window.__biglwaIdentity?.uid||window.BigLWAAccountStorage?.uid||'');
 const state=window.__biglwaTikTokOrbit?.state;
 if(!uid||!state?.connected||state.uid!==uid)return null;
 const oauth=String(state.profile?.username||'').replace(/^@/,'').trim();
 let linked='';
 try{
  const url=new URL(String(window.BigLWAOrbitAccountLinks?.get?.()?.tiktok||''));
  if(url.protocol==='https:'&&['tiktok.com','www.tiktok.com','m.tiktok.com'].includes(url.hostname)&&!url.port){
   linked=decodeURIComponent(url.pathname).match(/^\/@([a-zA-Z0-9._]{2,40})\/?$/)?.[1]||'';
  }
 }catch{}
 if(oauth&&linked&&oauth.toLowerCase()!==linked.toLowerCase())return {uid,handle:'',profile:state.profile||{},mismatch:true};
 const handle=oauth||linked;
 return {uid,handle:VALID.test(handle)?handle:'',profile:state.profile||{},matchedToOAuth:!!oauth};
};
const trackerFor=account=>{
 if(!trackerSummary||!account?.handle)return null;
 if(String(trackerSummary.ownerUid||'')&&String(trackerSummary.ownerUid)!==account.uid)return null;
 return String(trackerSummary.handle||'').toLowerCase()===String(account.handle).toLowerCase()?trackerSummary:null;
};
const withTracker=account=>{
 const data=trackerFor(account);if(!data)return {};
 const extra={};
 const likes=numeric(data.totalLikes??data.likes);
 const monthlyStat=numeric(data.monthlyStat??data.monthlyViews);
 if(likes!==null)extra.likes=likes;
 if(monthlyStat!==null){extra.monthlyStat=monthlyStat;extra.monthlyStatLabel=String(data.monthlyStatLabel||'Monthly views');}
 if(data.observedAt)extra.trackerObservedAt=String(data.observedAt);
 if(data.source)extra.trackerSource=String(data.source);
 return extra;
};
const source=()=>{
 const account=current();if(!account||account.mismatch)return null;
 const tracker=withTracker(account),n=numeric(account.profile.follower_count);
 if(n!==null)return {...tracker,uid:account.uid,handle:account.handle,followers:n,
  following:numeric(account.profile.following_count),likes:tracker.likes??numeric(account.profile.likes_count),
  videoCount:numeric(account.profile.video_count),source:'TikTok authorized user.info.stats',
  verifiedFromProvider:true,checkedAt:new Date().toISOString()};
 const pub=publicSnapshot;
 if(pub&&pub.uid===account.uid&&pub.handle.toLowerCase()===account.handle.toLowerCase()&&numeric(pub.followers)!==null)
  return {...pub,...tracker,verifiedFromProvider:false,publicSnapshot:true};
 return null;
};
async function loadTracker(){
 if(trackerRequested)return trackerSummary;
 trackerRequested=true;
 try{
  const response=await fetch(TRACKER,{method:'GET',credentials:'omit',cache:'no-store'});
  if(!response.ok)return null;
  const data=await response.json();
  if(!data||!VALID.test(String(data.handle||'')))return null;
  trackerSummary=data;
  paint();
  window.dispatchEvent(new CustomEvent('biglwa:external-stats-updated'));
  return trackerSummary;
 }catch{return null}
}
function paint(){
 const row=$('#moduleWorkspace[data-module-key="orbit"] [data-orbit-row="tiktok"]');
 if(!row)return;
 const actions=$('.module-actions',row);if(!actions)return;
 let button=$('[data-tiktok-lookup]',actions);
 if(!button){
  button=document.createElement('button');button.type='button';button.className='module-action ghost';
  button.dataset.tiktokLookup='1';button.textContent='Refresh stats';
  button.addEventListener('click',()=>refresh(true));
  actions.append(button);
 }
 button.disabled=busy;
 button.textContent=busy?'Checking TikTok…':'Refresh stats';
 let help=$('[data-tiktok-lookup-status]',row);
 if(!help){
  help=document.createElement('small');help.dataset.tiktokLookupStatus='1';
  help.style.cssText='display:block;grid-column:1/-1;padding:2px 10px;color:#725365;font:500 10px/1.4 system-ui';
  row.append(help);
 }
 const member=current(),stats=source();
 help.replaceChildren();
 if(!member){help.textContent='Connect TikTok to check your account.';return}
 if(member.mismatch){help.textContent='Linked TikTok username differs from the OAuth username. Correct the link before syncing.';return}
 if(stats){
  const label=stats.verifiedFromProvider?'TikTok-reported':'Public @'+stats.handle+' · '+stats.source;
  help.textContent=label+' · '+stats.followers.toLocaleString()+' followers';
  if(stats.likes!==null)help.textContent+=' · '+stats.likes.toLocaleString()+' likes';
  if(stats.monthlyStat!=null)help.textContent+=' · '+stats.monthlyStat.toLocaleString()+' '+(stats.monthlyStatLabel||'monthly stat')+' toward reach';
  if(!stats.verifiedFromProvider){
   help.textContent+=' · external observation, not ownership verification';
   if(stats.sourceObservedAt)help.textContent+=' · source date '+stats.sourceObservedAt;
  }
  return;
 }
 help.append(document.createTextNode(lastMessage||(
  member.handle?'No readable public snapshot yet. TikTok authorized stats are unavailable.':
  'TikTok basic login does not provide @username. Link your public TikTok profile in Orbit to enable username-matched lookup.'
 )));
 if(member.handle){
  const a=document.createElement('a');
  a.href='https://www.tokportal.com/tool/tiktok-profile-analytics-checker/'+encodeURIComponent(member.handle);
  a.target='_blank';a.rel='noopener noreferrer';a.textContent=' · Open public checker ↗';
  a.style.cssText='color:#754054;font-weight:700';help.append(a);
 }
}
async function checkPublic(account){
 if(!account.handle)throw Error('Link your public TikTok @username in Orbit to check its public metrics.');
 const url=PUBLIC+'/tiktok/'+encodeURIComponent(account.handle);
 const response=await fetch(url,{method:'GET',mode:'cors',credentials:'omit',cache:'no-store'});
 if(!response.ok)throw Error('Public TikTok snapshot service is unavailable ('+response.status+').');
 const data=await response.json();
 if(!current()||current().uid!==account.uid)throw Error('TikTok connection changed during refresh.');
 if(data?.handle?.toLowerCase()!==account.handle.toLowerCase())throw Error('Public username did not match the connected account link.');
 if(!data.available||!data.matchedHandle||numeric(data.followers)===null)
  throw Error('No indexed public TikTok statistics for @'+account.handle+' yet.');
 publicSnapshot={
  uid:account.uid,handle:account.handle,followers:numeric(data.followers),
  following:numeric(data.following),videoCount:numeric(data.videoCount),likes:null,
  engagementRate:typeof data.engagementRate==='number'?data.engagementRate:null,
  sourceObservedAt:String(data.sourceObservedAt||''),source:'TokPortal public snapshot',
  sourceUrl:String(data.sourceUrl||''),checkedAt:String(data.checkedAt||new Date().toISOString())
 };
 return publicSnapshot;
}
async function refresh(manual=false){
 if(busy)return;
 const before=current();
 if(!before){lastMessage='Connect TikTok first.';paint();return}
 if(before.mismatch){lastMessage='TikTok usernames do not match.';paint();return}
 busy=true;lastMessage='Checking connected profile…';paint();
 try{
  if(manual)await window.__biglwaTikTokOrbit?.restore?.();
  const account=current();
  if(!account||account.uid!==before.uid)throw Error('Your TikTok connection is no longer active.');
  const approved=numeric(account.profile.follower_count)!==null;
  if(!approved){
   lastMessage='Looking up @'+(account.handle||'username')+' from the public source…';paint();
   await checkPublic(account);
   lastMessage='Public TikTok snapshot matched @'+account.handle+'.';
  }else{
   publicSnapshot=null;
   lastMessage='TikTok-authorized statistics retrieved.';
  }
  window.dispatchEvent(new CustomEvent('biglwa:external-stats-updated'));
 }catch(e){lastMessage=String(e?.message||'Refresh unavailable.').slice(0,190)}
 finally{busy=false;paint()}
}
let timer;
function queue(){
 clearTimeout(timer);timer=setTimeout(()=>{
  const acc=current(),identityKey=acc?.uid+':'+(acc?.handle||'');
  if(identityKey!==lastState){lastState=identityKey;publicSnapshot=null;lastMessage=''}
  paint();
  if(!acc||acc.mismatch||!acc.handle||numeric(acc.profile.follower_count)!==null)return;
  const key=acc.uid+':'+acc.handle.toLowerCase();
  if(lastAttempt===key&&Date.now()-lastAttemptAt<30*60*1000)return;
  lastAttempt=key;lastAttemptAt=Date.now();
  refresh(false);
 },100);
}
document.addEventListener('biglwa:tiktok-status',queue);
document.addEventListener('biglwa:module-open',queue);
window.addEventListener('biglwa:orbit-links-synced',queue);
window.addEventListener('biglwa:identity-updated',queue);
window.BigLWAExternalTiktok=Object.freeze({snapshot:source,refresh:()=>refresh(true)});
void loadTracker();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',queue,{once:true});else queue();
})();
