/* Owner-only monthly observations; unknown provider metrics never become zero. */
(()=>{
 'use strict';
 const q=(s,r=document)=>r.querySelector(s),uid=()=>window.BigLWAAccountStorage?.uid||window.__biglwaIdentity?.uid||'';
 const monthOf=date=>{const d=new Date(date);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')};
 let overview=null,owner='',selected=monthOf(Date.now()),pending=false,lastSnapshot='',connectionAPI=null;
 const number=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v))&&Number(v)>=0?Number(v):null;
 const format=v=>v==null?'Not supplied':new Intl.NumberFormat().format(v);
 // One number grammar for every audience figure. followers stays exact below
 // one million; reach and likes abbreviate thousands/millions with k/m.
 const fallbackMetric=(kind,value)=>{
   if(value==null||value===''||!Number.isFinite(Number(value))||Number(value)<0)return '—';
   const amount=Number(value),trim=v=>String(Math.round(v*10)/10).replace(/\.0$/,'');
   if(String(kind).toLowerCase()==='followers')return amount>=1e6?trim(amount/1e6)+'m+':format(amount);
   if(['reach','likes'].includes(String(kind).toLowerCase())){
     if(amount>=1e6)return trim(amount/1e6)+'m+';
     if(amount>=1000)return trim(amount/1000)+'k+';
   }
   return format(amount);
 };
 const metricFormat=(kind,value)=>typeof window.__biglwaFormatMetric==='function'
   ?window.__biglwaFormatMetric(kind,value):fallbackMetric(kind,value);
 // A provider user ID (numeric Facebook id or TikTok open_id) is identity, not
 // a public handle. Only real vanity usernames may appear after the "@".
 const cleanHandle=value=>{
   const handle=String(value==null?'':value).trim().replace(/^@+/,'');
   if(!handle||/^-\d/.test(handle)||/^\d{6,}$/.test(handle)||handle.length>40||/\s/.test(handle))return '';
   return handle;
 };
 // A profile URL is only a fallback for the vanity handle itself. Never turn a
 // route (profile.php, /people/..., /share) into a fake @handle.
 const RESERVED_HANDLES=/^(?:profile|people|pages|groups|share|watch|photo|photos|video|videos|reel|reels|story|stories|login|home|channel|user|@)$/i;
 const linkHandle=(link,host)=>{
   try{
     const url=new URL(String(link||''));
     if(host&&url.hostname.replace(/^www\./,'')!==host)return '';
     const segment=decodeURIComponent(url.pathname).split('/').filter(Boolean).pop()||'';
     const handle=cleanHandle(segment.replace(/^@/,''));
     if(!handle||RESERVED_HANDLES.test(handle)||/\.(?:php|html?|aspx?)$/i.test(handle))return '';
     return handle;
   }catch{return ''}
 };
 const displayHandle=record=>{
   if(!record||typeof record!=='object')return '';
   const direct=cleanHandle(record.username);
   if(direct)return direct;
   // Providers that only expose a profile URL still have a real vanity handle.
   // Numeric ids are rejected by cleanHandle, so this never leaks an id.
   return linkHandle(record.link,'facebook.com')||linkHandle(record.link);
 };
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
    const handle=displayHandle(record);
    const username=cleanHandle(record.username);
    const sourceUserId=String(record.sourceUserId||'').trim();
    // Identity used to match saved observations survives a handle change.
    const accountKey=sourceUserId||username;
    const fresh=number(count),prev=last[id];
    const external=id==='tiktok'&&window.BigLWAExternalTiktok?.snapshot?.();
    const externalMine=!!external&&external.uid===accountUid;
    const externalCount=externalMine?number(external.followers):null;
    const priorKey=prev?.accountKey||prev?.sourceUserId||'';
    const stableId=sourceUserId||'';
    // A provider stable id wins over a display name. Replacing the TikTok
    // account (new open_id) must never inherit the previous account's counts,
    // even when the visible username is reused.
    // Caches written before accountKey existed lower-cased the provider id.
    const legacyKey=String(prev?.handle||'').toLowerCase();
    const sameStable=!!stableId&&(priorKey===stableId||(!priorKey&&legacyKey===stableId.toLowerCase()));
    const differsStable=!!stableId&&!!priorKey&&priorKey!==stableId;
    const sameHandle=!differsStable&&!!handle&&!!prev?.handle&&String(prev.handle).toLowerCase()===handle.toLowerCase();
    const sameAccount=!!prev&&(sameStable||sameHandle);
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
    if(fresh!==null)updates[id]={followers:fresh,handle,accountKey,sourceUserId,observedAt,metric,provenance:'provider'};
    // Likes are cumulative provider counts; accept them from any connected app
    // and fall back to the owner-approved external TikTok tracker snapshot.
    const providerLikes=record.verifiedFromProvider===false?null:number(record.stats?.likes??record.likes);
    const externalLikes=externalMine?number(external.likes):null;
    const receivedLikes=providerLikes??externalLikes;
    const monthlyReach=record.stats?.monthlyReach??record.monthlyReach??record.reach??null;
    // Monthly views are reach. Pinterest publishes monthly_views directly; the
    // public TikTok tracker exposes its own monthly statistic for the same window.
    const monthlyViews=number(record.stats?.monthlyViews??record.monthlyViews);
    const monthlyInteractions=number(record.stats?.monthlyInteractions??record.monthlyInteractions);
    const monthlyStat=externalMine?number(external.monthlyStat):null;
    const monthlyStatLabel=externalMine?String(external.monthlyStatLabel||''):'';
    rows.push({id,followers:value,likes:receivedLikes,monthlyViews,monthlyInteractions,monthlyStat,monthlyStatLabel,
      lastCheckedAt:observedAt,reach:monthlyReach,
      handle,username,accountKey,sourceUserId,link:record.link||'',metric,
      displayName:id==='facebook'?String(record.name||record.displayName||'').trim().slice(0,75):'',
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
  // Live account identities take precedence over stale saved provider IDs.
  const linked=window.BigLWAOrbitAccountLinks?.get?.()||{};
  const tiktok=window.__biglwaTikTokOrbit?.state;
  const tikProfile=tiktok?.connected&&tiktok.uid===accountUid?tiktok.profile:null;
  const tikLink=String(linked.tiktok||'');
  const publicTiktok=window.BigLWAExternalTiktok?.snapshot?.();
  const publicHandle=publicTiktok?.uid===accountUid&&(merged.tiktok||tikProfile||tikLink)?cleanHandle(publicTiktok.handle):'';
  const tikHandle=cleanHandle(tikProfile?.username)||linkHandle(tikProfile?.profile_deep_link,'tiktok.com')||
    linkHandle(tikProfile?.link,'tiktok.com')||linkHandle(tikLink,'tiktok.com')||
    linkHandle(merged.tiktok?.link,'tiktok.com')||publicHandle;
  if(tikHandle){
    const existing=merged.tiktok||{};
    merged.tiktok={...existing,...(tikProfile||{}),username:tikHandle,
      link:String(tikProfile?.profile_deep_link||tikProfile?.link||tikLink||existing.link||''),
      sourceUserId:String(tikProfile?.open_id||existing.sourceUserId||'')};
  }
  // Personal Facebook and Business Login use different authorization paths.
  const personal=window.BigLWAFacebookPersonal?.get?.();
  const business=window.__biglwaFacebookOrbit?.state;
  const fbProfile=personal?.verifiedFromProvider?personal:
    business?.connected&&business.profile?{...business.profile,verifiedFromProvider:true}:null;
  if(fbProfile){
    const prior=merged.facebook||{};
    const switched=prior.sourceUserId&&fbProfile.sourceUserId&&prior.sourceUserId!==fbProfile.sourceUserId;
    const base=switched?{}:prior;
    merged.facebook={...base,...fbProfile,
      username:cleanHandle(fbProfile.username)||linkHandle(fbProfile.link,'facebook.com')||
        linkHandle(linked.facebook,'facebook.com')||'',
      link:fbProfile.link||linked.facebook||base.link||''};
  }
  const insta=window.__biglwaInstagramOrbit?.state;
  if(insta?.connected&&insta.profile){
    const prev=merged.instagram||{},profile=insta.profile;
    merged.instagram={...prev,...profile,
      sourceUserId:String(profile.id||prev.sourceUserId||''),
      username:cleanHandle(profile.username)||prev.username,
      stats:{...(prev.stats||{}),...(profile.stats||{}),
        followers:profile.followers_count??prev.stats?.followers}};
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
  // Reach covers a calendar month. A source may report it explicitly, or publish
  // monthly views / its monthly tracker statistic (the product owner's definition
  // is that monthly views and the TikTok monthly stat both count as reach).
  const reachValue=source=>{
   if(source.reach?.month===month&&source.reach?.metric==='reach'&&number(source.reach?.value)!=null)return Number(source.reach.value);
   const views=number(source.monthlyViews);if(views!=null)return views;
   return number(source.monthlyStat);
  };
  const reachRows=rows.filter(source=>reachValue(source)!=null);
  return {likes:likeRows.length?likeRows.reduce((n,s)=>n+s.likes,0):null,followers:followerRows.length?followerRows.reduce((n,s)=>n+s.followers,0):null,reach:reachRows.length?reachRows.reduce((n,s)=>n+reachValue(s),0):null,coverage:followerRows.length,reachCoverage:reachRows.length};
 }
 function publishProfileMetrics(){
  // Never publish the viewer's own aggregates into somebody else's public
  // profile. The preview owns the strip from the viewed member's publicStats.
  if(document.documentElement.classList.contains('biglwa-preview-mode')||window.__biglwaPublicStorageView)return;
  // The profile banner exists before Skeleton Key's analytics panel is mounted.
  // Publishing metrics must not depend on a widget being open or which month its
  // selector happens to show.
  const accountUid=uid(),known=!!accountUid;
  const currentMonth=monthOf(Date.now());
  const rows=known?sources():[];
  const current=summarize(rows,currentMonth);
  const saved=overview?.uid===accountUid?overview.analyticsMonths?.[currentMonth]:null;
  const matchedSaved=(saved?.sources||[]).filter(old=>old&&rows.some(row=>
    row.id===old.id&&((row.accountKey&&old.accountKey&&row.accountKey===old.accountKey)||
      (row.accountKey&&old.handle&&String(old.handle)===row.accountKey)||
      (row.handle&&old.handle&&row.handle.toLowerCase()===String(old.handle).toLowerCase()))));
  const savedSummary=matchedSaved.length?summarize(matchedSaved,currentMonth):{likes:null,reach:null};
  const followers=current.followers;
  window.__biglwaProfileMetrics={
    uid:accountUid,
    followers,
    followersDisplay:metricFormat('followers',followers),
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
 let publicPublishAt=0,publicPending=false,publicSignature='';
 async function sharePublicMetrics(){
   const now=Date.now(),metrics=window.__biglwaProfileMetrics,who=uid();
   if(publicPending||now-publicPublishAt<120000||!who||metrics?.uid!==who||
     document.documentElement.classList.contains('biglwa-preview-mode')||window.__biglwaPublicStorageView)return;
   const name=String(window.__biglwaIdentity?.username||'').toLowerCase().trim();
   if(!/^[a-z0-9._-]{5,24}$/.test(name))return;
   const snapshot={
     followers:number(metrics.followers),likes:number(metrics.likes),reach:number(metrics.reach),
     connections:number(metrics.connections),
     realRank:typeof overview?.realRank==='string'?overview.realRank.slice(0,48):'Chopped',
     observedAt:new Date().toISOString()
   };
   const signature=JSON.stringify({...snapshot,observedAt:''});
   if(signature===publicSignature)return;
   publicPending=true;publicPublishAt=now;
   try{
     const [{getApps},{getAuth},{getFirestore,doc,getDoc,setDoc,deleteField,serverTimestamp}]=await Promise.all([
       import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'),
       import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js'),
       import('https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js')
     ]);
     const app=getApps()[0],user=app&&getAuth(app).currentUser;
     if(!user||user.uid!==who)return;
     const db=getFirestore(app);
     const owner=await getDoc(doc(db,'users',who));
     const ref=doc(db,'usernames',name),profile=await getDoc(ref);
     if(!profile.exists()||profile.data()?.uid!==who)return;
     if(owner.data()?.accountVisibility==='private'){
      // Keep no public aggregate mirror for a private account, including one
      // written before the account was switched to private.
      if(publicSignature==='private:'+name)return;
      await setDoc(ref,{publicStats:deleteField(),updatedAt:serverTimestamp()},{merge:true});
      publicSignature='private:'+name;
      return;
     }
     await setDoc(ref,{publicStats:snapshot,updatedAt:serverTimestamp()},{merge:true});
     publicSignature=signature;
   }catch(error){console.info('Public aggregate stats mirror deferred:',error?.message||error)}
   finally{publicPending=false}
 }
 function render(){
  publishProfileMetrics();
  if(!document.documentElement.classList.contains('biglwa-preview-mode'))void sharePublicMetrics();
  const rank=q('#studioApp .profile-card .real-rank')||q('#skeletonRankMount .real-rank');if(rank){const label=typeof overview?.realRank==='string'?overview.realRank:'Chopped';const strong=q('strong',rank);if(strong&&strong.textContent!==label)strong.textContent=label;rank.setAttribute('aria-label','Real Rank: '+label);}
  const host=q('#skeletonAnalytics');if(!host)return;
  if(!q('.skeleton-analytics-grid',host)){
   host.innerHTML='<label>Account analytics <select aria-label="Analytics month"></select></label><div class="skeleton-analytics-grid"><div><strong data-metric="accounts">—</strong>Synced accounts</div><div><strong data-metric="followers">—</strong>Followers · snapshot</div><div><strong data-metric="likes">—</strong>Likes received · snapshot</div><div><strong data-metric="reach">—</strong>Monthly reach</div><div><strong data-metric="people">—</strong>People added</div></div><p class="analytics-coverage"></p><section class="skeleton-provider-breakdown" aria-label="Audience by connected platform"><h3>By connected app</h3><div class="analytics-sources"></div></section><p class="analytics-status" role="status"></p>';
   const select=q('select',host);for(let i=0;i<12;i++){const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-i);const o=document.createElement('option');o.value=monthOf(d);o.textContent=d.toLocaleDateString(undefined,{month:'short',year:'numeric'});select.append(o)}select.value=selected;select.onchange=()=>{selected=select.value;render()};
  }
  const current=selected===monthOf(Date.now()),saved=overview?.analyticsMonths?.[selected];
  const rows=current?sources():(saved?.sources||[]),stats=summarize(rows,selected);
  const known=!!overview&&owner===uid();
  const values={accounts:known&&(current||saved)?rows.length:null,followers:stats.followers,likes:stats.likes,reach:stats.reach,people:known?(current?Object.keys(overview.peopleConnections).length:saved?.connections??null):null};
  const metricKinds={accounts:'count',followers:'followers',likes:'likes',reach:'reach',people:'count'};
  for(const [key,value]of Object.entries(values)){const node=q('[data-metric="'+key+'"]',host);const text=value==null?'Not supplied':metricFormat(metricKinds[key],value);if(node.textContent!==text)node.textContent=text}
  const coverage=q('.analytics-coverage',host);coverage.textContent=stats.coverage+' of '+rows.length+' connected sources have reported audience counts (provider or externally sourced). Likes are cumulative provider counts. Reach includes an explicit monthly reach metric, monthly views, and the TikTok monthly tracker statistic; other per-video views and engagement estimates are not treated as monthly reach. Other sources are unavailable, not zero.';
  const list=q('.analytics-sources',host);
  const signature=JSON.stringify(rows.map(r=>[r.id,r.handle,r.displayName,r.followers,r.likes,r.monthlyViews,r.monthlyInteractions,r.monthlyStat,r.monthlyStatLabel,r.reach,r.lastCheckedAt]));
  if(list.dataset.snapshot!==signature){
    list.dataset.snapshot=signature;list.replaceChildren();
    for(const row of rows){
      const entry=document.createElement('div');entry.className='skeleton-provider-stat';
      const icon=document.createElement('img');
      if(/^(instagram|tiktok|pinterest|x|tumblr|youtube|facebook|snapchat)$/.test(row.id)){
        icon.src='/assets/orbit-icons/'+row.id+'.svg';icon.alt='';icon.loading='lazy';icon.width=23;icon.height=23;
      }else{icon.alt='';icon.style.display='none'}
      const copy=document.createElement('div'),title=document.createElement('strong'),meta=document.createElement('small');
      title.textContent=row.id.charAt(0).toUpperCase()+row.id.slice(1)+(row.handle?' · @'+row.handle:row.displayName?' · '+row.displayName:'');
      const segments=[metricFormat('followers',row.followers)+' '+(row.metric||'followers')];
      if(row.likes!=null)segments.push(metricFormat('likes',row.likes)+' likes');
      if(number(row.monthlyViews)!=null)segments.push(metricFormat('reach',row.monthlyViews)+' monthly views'+(row.id==='instagram'?' · Meta':' · reach'));
      if(number(row.monthlyInteractions)!=null)segments.push(metricFormat('count',row.monthlyInteractions)+' month-to-date interactions');
      if(number(row.monthlyStat)!=null){
        const label=/avg\s*likes/i.test(String(row.monthlyStatLabel||''))?'TikTok avg likes/mo':
          (String(row.monthlyStatLabel||'').trim()||'monthly tracker stat');
        segments.push(metricFormat('reach',row.monthlyStat)+' monthly reach ('+label+')');
      }
      if(row.reach?.month===selected&&row.reach.metric==='reach'&&number(row.reach.value)!=null)segments.push(metricFormat('reach',row.reach.value)+' reported reach');
      meta.textContent=segments.join(' · ')+(row.isLastKnown?' · last known':row.lastCheckedAt?' · checked '+new Date(row.lastCheckedAt).toLocaleDateString():'');
      copy.append(title,meta);entry.append(icon,copy);list.append(entry);
    }
    if(!rows.length)list.textContent='Connect an account in Orbit to show verified social statistics.';
  }
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
  const snapshot={sources:sources().map(({id,handle,displayName,username,accountKey,sourceUserId,followers,likes,monthlyViews,monthlyInteractions,monthlyStat,monthlyStatLabel,lastCheckedAt,reach})=>{
    const old=previous.find(item=>item.id===id&&(
      (accountKey&&item.accountKey&&accountKey===item.accountKey)||
      (handle&&item.handle&&String(item.handle).toLowerCase()===handle.toLowerCase())));
    const validReach=value=>value?.month===month&&value.metric==='reach'&&number(value.value)!=null
      ?{month,metric:'reach',value:Number(value.value)}:null;
    return {id,handle,displayName,accountKey,username:username||cleanHandle(old?.username)||handle,followers,
      likes:likes??number(old?.likes),monthlyViews:monthlyViews??number(old?.monthlyViews),
      monthlyInteractions:monthlyInteractions??number(old?.monthlyInteractions),
      monthlyStat:monthlyStat??number(old?.monthlyStat),monthlyStatLabel:monthlyStatLabel||old?.monthlyStatLabel||'',lastCheckedAt,
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
 // A provider/tracker refresh can complete after the first profile paint. Let
 // that update through the 120s write throttle once so visitors see the full
 // combined Reach instead of waiting for the next owner visit.
 window.addEventListener('biglwa:external-stats-updated',()=>{publicPublishAt=0});
 window.addEventListener('biglwa:instagram-restored',refresh);
 for(const event of ['biglwa:identity-updated','biglwa:user-directory-ready','biglwa:session-verified','biglwa:external-stats-updated'])window.addEventListener(event,refresh);
 document.addEventListener('biglwa:module-open',refresh);document.addEventListener('biglwa:new-orbit-status',refresh);document.addEventListener('biglwa:google-state',refresh);document.addEventListener('biglwa:facebook-personal-status',refresh);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});else refresh();
 setTimeout(refresh,1200);
})();
