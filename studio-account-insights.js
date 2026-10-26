/* Owner-only monthly observations; unknown provider metrics never become zero. */
(()=>{
 'use strict';
 const q=(s,r=document)=>r.querySelector(s),uid=()=>window.BigLWAAccountStorage?.uid||window.__biglwaIdentity?.uid||'';
 const monthOf=date=>{const d=new Date(date);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')};
 let overview=null,owner='',selected=monthOf(Date.now()),pending=false,lastSnapshot='',connectionAPI=null;
 const number=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v))&&Number(v)>=0?Number(v):null;
 const format=v=>v==null?'Not supplied':new Intl.NumberFormat().format(v);
 // Stable last-known provider observations are user-scoped and only derived
 // from a verified, persisted provider profile. Never share across logins or
 // represent an unavailable field as a provider-verified zero.
 const cacheKey=accountUid=>'biglwaFollowerObservationsV2:'+accountUid;
 function previousCounts(accountUid){
   if(!accountUid)return {};
   try{const data=JSON.parse(localStorage.getItem(cacheKey(accountUid))||'{}');
     return data&&typeof data==='object'&&!Array.isArray(data)?data:{}}
   catch{return {}}
 }
 function sources(){
  const accountUid=uid();if(!accountUid)return [];
  const activeOverview=overview?.uid===accountUid?overview:{connections:{},orbitConnectedProfiles:{}};
  const last=previousCounts(accountUid),updates={...last},rows=[];
  const ingest=(id,record,count,checkedAt,metric='followers')=>{
    if(!record||!id)return;
    const handle=String(record.sourceUserId||record.username||'').trim().toLowerCase();
    const legacyHandle=String(record.username||'').trim().toLowerCase();
    const fresh=number(count),prev=last[id];
    const external=id==='tiktok'&&window.BigLWAExternalTiktok?.snapshot?.();
    const externalCount=external&&external.uid===accountUid?number(external.followers):null;
    const sameAccount=!!prev&&!!handle&&!!prev.handle&&(prev.handle===handle||prev.handle===legacyHandle);
    // A basic-profile fetch must not count as a verified follower measurement.
    const checked=String(checkedAt||record.countCheckedAt||'');
    const fallback=sameAccount&&prev?.provenance!=='external'?number(prev.followers):null;
    // A previously measured *provider* count takes precedence. Otherwise use
    // the owner-selected public-source snapshot and label its provenance.
    const recoveredByProvider=fresh===null&&fallback===null&&externalCount!==null&&external?.verifiedFromProvider===true;
    const externalVerified=fresh===null&&fallback===null&&externalCount!==null&&!recoveredByProvider;
    const value=fresh??fallback??externalCount;
    const observedAt=recoveredByProvider?new Date().toISOString():externalVerified?String(external.checkedAt||''):
      fresh!==null?(sameAccount&&prev.followers===fresh&&prev.observedAt?prev.observedAt:(checked||new Date().toISOString())):sameAccount?prev.observedAt||'':'';
    if(fresh!==null)updates[id]={followers:fresh,handle,observedAt,metric,provenance:'provider'};
    // Only genuine engagement counts from provider-authorized responses are used.
    const likes=number(record.stats?.likes??record.likes);
    const recoveredLikes=id==='tiktok'&&recoveredByProvider?number(external.likes):null;
    const receivedLikes=id==='tiktok'&&record.verifiedFromProvider!==false?(likes??recoveredLikes):null;
    const monthlyReach=record.stats?.monthlyReach??record.monthlyReach??record.reach??null;
    rows.push({id,followers:value,likes:receivedLikes,lastCheckedAt:observedAt,reach:monthlyReach,
      handle:String(record.sourceUserId||record.username||''),link:record.link||'',metric,
      isLastKnown:fresh===null&&fallback!==null,verified:(fresh!==null&&!!checked)||recoveredByProvider,
       externalVerified,source:externalVerified?'External public source':recoveredByProvider?'TikTok OAuth user.info.stats':null});
  };
  // Provider-checked live records take priority over old Firestore snapshots;
  // absent counts remain missing rather than becoming manufactured zeros.
  const merged={...(activeOverview.connections||{})};
  for(const [id,row]of Object.entries(activeOverview.orbitConnectedProfiles||{})){
    if(!Object.prototype.hasOwnProperty.call(merged,id))merged[id]=row;
  }
  for(const [id,row]of Object.entries(connectionAPI?.connections?.()||{})){
    merged[id]=row;
  }
  for(const [id,row]of Object.entries(merged)){
    if(row&&typeof row==='object')
      ingest(id,row,row.stats?.followers??row.followers,row.countCheckedAt||'');
  }
  // YouTube provides *subscribers*, not "followers". Include these as an
  // explicitly named source only when authenticated channel statistics exist.
  const google=window.__biglwaGoogleOrbit?.state;
  const channel=google?.connected?google.youtube:null;
  if(channel?.id && !rows.some(r=>r.id==='youtube')){
    const raw=channel.statistics?.hiddenSubscriberCount?null:channel.statistics?.subscriberCount;
    ingest('youtube',{username:channel.id,link:'https://www.youtube.com/channel/'+encodeURIComponent(channel.id)},
      raw,new Date().toISOString(),'subscribers');
  }
  // Provider sessions with no public profile URL (e.g. Snapchat), or
  // Facebook's separately authenticated profile, can still appear with an
  // honest unavailable count. Never invent followers from connection status.
  const live=[
    ['facebook',window.BigLWAFacebookPersonal?.get?.()],
    ['snapchat',window.BigLWAOrbitOAuth?.get?.('snapchat')],
    ['tumblr',window.BigLWAOrbitOAuth?.get?.('tumblr')],
    ['x',window.BigLWAOrbitOAuth?.get?.('x')]
  ];
  for(const [id,row]of live){
    if(row?.verifiedFromProvider&&!rows.some(s=>s.id===id))
      ingest(id,row,row.followers,row.lastVerifiedAt?new Date(row.lastVerifiedAt).toISOString():'');
  }
  if(JSON.stringify(last)!==JSON.stringify(updates)){
    try{localStorage.setItem(cacheKey(accountUid),JSON.stringify(updates))}catch{}
  }
  return rows;
 }
 function summarize(rows,month){
  const followerRows=rows.filter(s=>s.followers!=null);
   const likeRows=rows.filter(s=>s.likes!=null);
  // Reach must explicitly identify the calendar month and a reach metric. Never use views/likes.
  const reachRows=rows.filter(s=>s.reach?.month===month&&s.reach?.metric==='reach'&&number(s.reach?.value)!=null);
  return {likes:likeRows.length?likeRows.reduce((n,s)=>n+s.likes,0):null,followers:followerRows.length?followerRows.reduce((n,s)=>n+s.followers,0):null,reach:reachRows.length?reachRows.reduce((n,s)=>n+Number(s.reach.value),0):null,coverage:followerRows.length,reachCoverage:reachRows.length};
 }
 function publishProfileMetrics(){
  // The profile banner exists before Skeleton Key's analytics panel is mounted.
  // Publishing metrics must not depend on a widget being open or which month its
  // selector happens to show.
  const accountUid=uid(),known=!!accountUid;
  const currentMonth=monthOf(Date.now());
  const rows=known?sources():[];
  const current=summarize(rows,currentMonth);
  const saved=overview?.uid===accountUid?overview.analyticsMonths?.[currentMonth]:null;
  const matchedSaved=(saved?.sources||[]).filter(old=>old.handle&&rows.some(row=>
    row.id===old.id&&row.handle&&row.handle.toLowerCase()===String(old.handle).toLowerCase()));
  const savedSummary=matchedSaved.length?summarize(matchedSaved,currentMonth):{likes:null,reach:null};
  const followers=current.followers;
  window.__biglwaProfileMetrics={
    uid:accountUid,
    followers,
    followersDisplay:followers===null?'—':new Intl.NumberFormat().format(followers)+(current.coverage<rows.length?'+':''),
    likes:current.likes??savedSummary.likes,
    reach:current.reach??savedSummary.reach,
    reachMonth:currentMonth,
    likesSource:current.likes!==null?'connected providers':savedSummary.likes!==null?'last saved observation':'unavailable',
    reachSource:current.reach!==null?'connected providers':savedSummary.reach!==null?'last saved observation':'unavailable',
    sources:rows,
    connections:overview?.uid===accountUid?Object.keys(overview.peopleConnections||{}).length:null
  };
  window.dispatchEvent(new Event('biglwa:profile-metrics'));
 }
 function render(){
  publishProfileMetrics();
  const rank=q('#studioApp .profile-card .real-rank')||q('#skeletonRankMount .real-rank');if(rank){const label=typeof overview?.realRank==='string'?overview.realRank:'Chopped';const strong=q('strong',rank);if(strong&&strong.textContent!==label)strong.textContent=label;rank.setAttribute('aria-label','Real Rank: '+label);}
  const host=q('#skeletonAnalytics');if(!host)return;
  if(!q('.skeleton-analytics-grid',host)){
   host.innerHTML='<label>Account analytics <select aria-label="Analytics month"></select></label><div class="skeleton-analytics-grid"><div><strong data-metric="accounts">—</strong>Synced accounts</div><div><strong data-metric="followers">—</strong>Followers · snapshot</div><div><strong data-metric="likes">—</strong>Likes received · snapshot</div><div><strong data-metric="reach">—</strong>Monthly reach</div><div><strong data-metric="people">—</strong>People added</div></div><p class="analytics-coverage"></p><details><summary>Sources &amp; sync dates</summary><div class="analytics-sources"></div></details><p class="analytics-status" role="status"></p>';
   const select=q('select',host);for(let i=0;i<12;i++){const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-i);const o=document.createElement('option');o.value=monthOf(d);o.textContent=d.toLocaleDateString(undefined,{month:'short',year:'numeric'});select.append(o)}select.value=selected;select.onchange=()=>{selected=select.value;render()};
  }
  const current=selected===monthOf(Date.now()),saved=overview?.analyticsMonths?.[selected];
  const rows=current?sources():(saved?.sources||[]),stats=summarize(rows,selected);
  const known=!!overview&&owner===uid();
  const values={accounts:known&&(current||saved)?rows.length:null,followers:stats.followers,likes:stats.likes,reach:stats.reach,people:known?(current?Object.keys(overview.peopleConnections).length:saved?.connections??null):null};
  for(const [key,value]of Object.entries(values)){const node=q('[data-metric="'+key+'"]',host);const text=format(value);if(node.textContent!==text)node.textContent=text}
  const coverage=q('.analytics-coverage',host);coverage.textContent=stats.coverage+' of '+rows.length+' connected sources have reported audience counts (provider or externally sourced). Likes and monthly reach only appear when a source reports those exact metrics; video views and engagement estimates are not reach. Other sources are unavailable, not zero.';
  const list=q('.analytics-sources',host);const signature=JSON.stringify(rows.map(r=>[r.id,r.followers,r.lastCheckedAt]));if(list.dataset.snapshot!==signature){list.dataset.snapshot=signature;list.replaceChildren(...rows.map(row=>{const p=document.createElement('p');p.textContent=row.id+': '+format(row.followers)+' '+(row.metric||'followers')+' · '+(row.externalVerified?'externally sourced · TokPortal':row.lastCheckedAt?'provider reported '+new Date(row.lastCheckedAt).toLocaleDateString():'count unavailable')+(row.isLastKnown?' (last verified)':'');return p}))}
  q('.analytics-status',host).textContent=!uid()?'Sign in to see your private analytics.':!known?'Account data has not loaded yet.':!current&&!saved?'No observation saved for this month.':saved?.observedAt?'Observation: '+new Date(saved.observedAt).toLocaleString():'Latest available provider data; missing data is not zero.';

  // The source-of-truth profile metrics were already published above,
  // independently of the Skeleton Key widget and its selected month.
 }
 async function refresh(){
  attachSearch();
  const api=window.__biglwaConnections;if(api&&connectionAPI!==api){connectionAPI=api;api.onConnectionsChange(()=>{refresh()})}
  if(owner!==uid()){owner=uid();overview=null;lastSnapshot=''}
  if(owner&&!pending&&window.BigLWAUserDirectory?.getAccountOverview){pending=true;const expected=owner;try{const data=await window.BigLWAUserDirectory.getAccountOverview();if(uid()===expected&&data.uid===expected)overview=data}catch{}finally{pending=false}}
  render();saveObservation();
 }
 async function saveObservation(){
  if(!overview||overview.uid!==uid()||!window.BigLWAUserDirectory?.recordAnalyticsMonth)return;
  const month=monthOf(Date.now()),previous=overview.analyticsMonths?.[month]?.sources||[];
  const snapshot={sources:sources().map(({id,handle,followers,likes,lastCheckedAt,reach})=>{
    const old=previous.find(item=>item.id===id&&item.handle&&handle&&String(item.handle).toLowerCase()===handle.toLowerCase());
    const validReach=value=>value?.month===month&&value.metric==='reach'&&number(value.value)!=null
      ?{month,metric:'reach',value:Number(value.value)}:null;
    return {id,handle,followers,likes:likes??number(old?.likes),lastCheckedAt,
      reach:validReach(reach)||validReach(old?.reach)};
  }),connections:Object.keys(overview.peopleConnections||{}).length};
  const signature=uid()+month+JSON.stringify(snapshot);if(signature===lastSnapshot)return;lastSnapshot=signature;
  const expected=uid();try{const saved=await window.BigLWAUserDirectory.recordAnalyticsMonth(month,snapshot);if(uid()===expected&&overview?.uid===expected){overview.analyticsMonths[month]=saved;render()}}catch{lastSnapshot='';const status=q('#skeletonAnalytics .analytics-status');if(status)status.textContent='Current data shown; monthly observation could not be saved.'}
 }
 function attachSearch(){
  const mounts=[q('#studioApp #connect'),q('#studioApp #moduleWorkspace[data-module-key="connect"]')].filter(Boolean);
  for(const mount of mounts){
   if(q('.connect-user-search',mount))continue;
   q('.connect-people',mount)?.remove();
   const box=document.createElement('form');box.className='connect-user-search';box.setAttribute('role','search');box.innerHTML='<input type="search" placeholder="Find user" aria-label="Find user" autocomplete="off"><div class="connect-user-results" aria-live="polite"></div>';
   const header=q('.card-head,.module-heading',mount);if(header)header.after(box);else mount.prepend(box);
   let timer,sequence=0;const input=q('input',box),list=q('.connect-user-results',box);
   async function search(){const term=input.value.trim(),request=++sequence;list.replaceChildren();if(term.length<2)return;list.textContent='Searching…';try{const api=window.BigLWAUserDirectory;if(!api?.searchUsers)throw Error('User search is loading. Try again.');const found=await api.searchUsers(term);if(request!==sequence||input.value.trim()!==term||!box.isConnected)return;list.replaceChildren();if(!found.length){list.textContent='No matching users.';return}for(const person of found){const row=document.createElement('div'),link=document.createElement('a'),button=document.createElement('button');link.href='/'+encodeURIComponent(person.username);link.textContent=person.name?person.name+' · @'+person.username:'@'+person.username;button.type='button';const added=Object.values(overview?.peopleConnections||{}).some(p=>p.username===person.username);button.textContent=added?'Added':'Add';button.disabled=added;button.onclick=async()=>{button.disabled=true;try{const data=await api.addPerson(person.username);if(data.uid!==uid())return;overview=data;owner=data.uid;button.textContent='Added';render();saveObservation()}catch(error){button.disabled=false;button.textContent='Add';let notice=q('.connect-search-status',box);if(!notice){notice=document.createElement('p');notice.className='connect-search-status';notice.role='status';box.append(notice)}notice.textContent=error.message}};row.append(link,button);list.append(row)}}catch(error){if(request===sequence)list.textContent=error.message}}
   input.addEventListener('input',()=>{clearTimeout(timer);sequence++;timer=setTimeout(search,250)});box.onsubmit=event=>{event.preventDefault();clearTimeout(timer);search()};
  }
 }
 window.BigLWAAccountInsights={refresh,summarize};
 for(const event of ['biglwa:identity-updated','biglwa:user-directory-ready','biglwa:session-verified','biglwa:external-stats-updated'])window.addEventListener(event,refresh);
 document.addEventListener('biglwa:module-open',refresh);document.addEventListener('biglwa:new-orbit-status',refresh);document.addEventListener('biglwa:google-state',refresh);document.addEventListener('biglwa:facebook-personal-status',refresh);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});else refresh();
 setTimeout(refresh,1200);
})();
