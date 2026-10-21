/* Owner-only monthly observations; unknown provider metrics never become zero. */
(()=>{
 'use strict';
 const q=(s,r=document)=>r.querySelector(s),uid=()=>window.BigLWAAccountStorage?.uid||window.__biglwaIdentity?.uid||'';
 const monthOf=date=>{const d=new Date(date);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')};
 let overview=null,owner='',selected=monthOf(Date.now()),pending=false,lastSnapshot='',connectionAPI=null;
 const number=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v))&&Number(v)>=0?Number(v):null;
 const format=v=>v==null?'Not supplied':new Intl.NumberFormat().format(v);
 function sources(){
  if(!overview||overview.uid!==uid())return [];
  const rows=Object.entries(overview.connections||{}).map(([id,row])=>({id,followers:number(row.stats?.followers),lastCheckedAt:row.lastCheckedAt||'',reach:row.stats?.monthlyReach}));
  for(const [id,row]of Object.entries(overview.orbitConnectedProfiles||{}))if(!rows.some(x=>x.id===id))rows.push({id,followers:null,lastCheckedAt:'',reach:null});
  return rows;
 }
 function summarize(rows,month){
  const followerRows=rows.filter(s=>s.followers!=null);
  // Reach must explicitly identify the calendar month and a reach metric. Never use views/likes.
  const reachRows=rows.filter(s=>s.reach?.month===month&&s.reach?.metric==='reach'&&number(s.reach?.value)!=null);
  return {followers:followerRows.length?followerRows.reduce((n,s)=>n+s.followers,0):null,reach:reachRows.length?reachRows.reduce((n,s)=>n+Number(s.reach.value),0):null,coverage:followerRows.length,reachCoverage:reachRows.length};
 }
 function render(){
  const host=q('#skeletonAnalytics');if(!host)return;
  if(!q('.skeleton-analytics-grid',host)){
   host.innerHTML='<label>Account analytics <select aria-label="Analytics month"></select></label><div class="skeleton-analytics-grid"><div><strong data-metric="accounts">—</strong>Synced accounts</div><div><strong data-metric="followers">—</strong>Followers · snapshot</div><div><strong data-metric="reach">—</strong>Monthly reach</div><div><strong data-metric="people">—</strong>People added</div></div><p class="analytics-coverage"></p><details><summary>Sources &amp; sync dates</summary><div class="analytics-sources"></div></details><p class="analytics-status" role="status"></p>';
   const select=q('select',host);for(let i=0;i<12;i++){const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-i);const o=document.createElement('option');o.value=monthOf(d);o.textContent=d.toLocaleDateString(undefined,{month:'short',year:'numeric'});select.append(o)}select.value=selected;select.onchange=()=>{selected=select.value;render()};
  }
  const current=selected===monthOf(Date.now()),saved=overview?.analyticsMonths?.[selected];
  const rows=current?sources():(saved?.sources||[]),stats=summarize(rows,selected);
  const known=!!overview&&owner===uid();
  const values={accounts:known&&(current||saved)?rows.length:null,followers:stats.followers,reach:stats.reach,people:known?(current?Object.keys(overview.peopleConnections).length:saved?.connections??null):null};
  for(const [key,value]of Object.entries(values)){const node=q('[data-metric="'+key+'"]',host);const text=format(value);if(node.textContent!==text)node.textContent=text}
  const coverage=q('.analytics-coverage',host);coverage.textContent=stats.coverage+' of '+rows.length+' synced accounts supply followers. Totals may include the same people across platforms. Monthly reach is shown only when a provider supplies it.';
  const list=q('.analytics-sources',host);const signature=JSON.stringify(rows.map(r=>[r.id,r.followers,r.lastCheckedAt]));if(list.dataset.snapshot!==signature){list.dataset.snapshot=signature;list.replaceChildren(...rows.map(row=>{const p=document.createElement('p');p.textContent=row.id+': '+format(row.followers)+' followers · '+(row.lastCheckedAt?'synced '+new Date(row.lastCheckedAt).toLocaleDateString():'sync date unavailable');return p}))}
  q('.analytics-status',host).textContent=!uid()?'Sign in to see your private analytics.':!known?'Account data has not loaded yet.':!current&&!saved?'No observation saved for this month.':saved?.observedAt?'Observation: '+new Date(saved.observedAt).toLocaleString():'Latest available provider data; missing data is not zero.';
  const rank=q('#skeletonRankMount .real-rank');if(rank){const label=typeof overview?.realRank==='string'?overview.realRank:'Chopped';const strong=q('strong',rank);if(strong&&strong.textContent!==label)strong.textContent=label;rank.setAttribute('aria-label','Real Rank: '+label);}
  window.__biglwaProfileMetrics={followers:values.followers,connections:values.people,reach:values.reach};window.dispatchEvent(new Event('biglwa:profile-metrics'));
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
  const month=monthOf(Date.now()),snapshot={sources:sources().map(({id,followers,lastCheckedAt,reach})=>({id,followers,lastCheckedAt,reach:reach?.month===month&&reach.metric==='reach'&&number(reach.value)!=null?{month,metric:'reach',value:Number(reach.value)}:null})),connections:Object.keys(overview.peopleConnections).length};
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
 for(const event of ['biglwa:identity-updated','biglwa:user-directory-ready','biglwa:session-verified'])window.addEventListener(event,refresh);
 document.addEventListener('biglwa:module-open',refresh);document.addEventListener('biglwa:new-orbit-status',refresh);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});else refresh();
 setTimeout(refresh,1200);
})();
