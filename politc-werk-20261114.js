/* BIG LWA Politic · Werk: private saved searches and source-first job discovery.
 * No silent scraping, fabricated openings, or automatic public posting. */
(()=>{'use strict';
 if(window.BigLWAPolitcWerk)return;
 const $=(selector,root=document)=>root.querySelector(selector);
 const MAX_SAVED=15;
 const MAX_TEXT=100;
 const clean=(value,max=MAX_TEXT)=>String(value==null?'':value).trim().slice(0,max);
 const preview=()=>document.documentElement.classList.contains('biglwa-preview-mode')||Boolean(window.__biglwaPublicStorageView);
 const owner=()=>preview()?'':clean(window.__biglwaIdentity?.uid||'',128);
 const key=uid=>'biglwaPolitcWerkSearchesV1:'+uid;
 const fixedTargets=(role,location)=>[
  {label:'USAJOBS',description:'Federal and public-service careers',url:'https://www.usajobs.gov/Search/Results?k='+encodeURIComponent(role)+'&l='+encodeURIComponent(location)},
  {label:'LinkedIn Jobs',description:'Employer and network listings',url:'https://www.linkedin.com/jobs/search/?keywords='+encodeURIComponent(role)+'&location='+encodeURIComponent(location)},
  {label:'Indeed',description:'Find employer job postings',url:'https://www.indeed.com/jobs?q='+encodeURIComponent(role)+'&l='+encodeURIComponent(location)}
 ];
 function trustedUrl(raw){
  try{
   const url=new URL(raw);
   if(url.protocol!=='https:'||url.username||url.password)return '';
   if(!['www.usajobs.gov','www.linkedin.com','www.indeed.com'].includes(url.hostname.toLowerCase()))return '';
   return url.href;
  }catch{return '';}
 }
 function sourceTargets(role,location){
  const api=window.BigLWAVisualLife;
  const targets=api?.searchTargets?.(role,location);
  return (Array.isArray(targets)?targets:fixedTargets(role,location))
    .map(item=>({label:clean(item.label,35),description:clean(item.description,110),url:trustedUrl(item.url)}))
    .filter(item=>item.url&&item.label);
 }
 function readSaved(uid=owner()){
  if(!uid)return [];
  try{
   const parsed=JSON.parse(localStorage.getItem(key(uid))||'[]');
   if(!Array.isArray(parsed))return [];
   return parsed.slice(0,MAX_SAVED).filter(row=>row&&typeof row==='object')
    .map(row=>({role:clean(row.role),location:clean(row.location)||'United States'}))
    .filter(row=>row.role);
  }catch{return [];}
 }
 function writeSaved(uid,rows){
  if(!uid||uid!==owner())return false;
  try{localStorage.setItem(key(uid),JSON.stringify(rows.slice(0,MAX_SAVED)));return true;}catch{return false;}
 }
 function text(node,value){if(node)node.textContent=value;}
 function makeLink(url,label){
  const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=label;return a;
 }
 function status(panel,message){text($('#politcWerkStatus',panel),message);}
 function renderSaved(panel){
  const list=$('#politcWerkSavedList',panel);
  if(!list)return;
  list.replaceChildren();
  const uid=owner(),rows=readSaved(uid);
  const saveButton=$('[data-politc-werk-save]',panel);
  if(saveButton)saveButton.disabled=!uid;
  const note=$('#politcWerkPrivacyNote',panel);
  text(note,uid?'Private to this signed-in account on this device. Never posted to Politic or MyFeed.':'Sign in to save searches privately. You can still search without signing in.');
  if(!rows.length){
   const empty=document.createElement('p');empty.className='politc-werk-empty';
   empty.textContent=uid?'No saved searches yet. Add a role and location, then save it here.':'Saved searches are available when you sign in.';
   list.append(empty);return;
  }
  rows.forEach((item,index)=>{
   const row=document.createElement('div');row.className='politc-werk-saved-item';
   const name=document.createElement('span');name.className='politc-werk-saved-name';name.textContent=item.role+' · '+item.location;
   const run=document.createElement('button');run.type='button';run.dataset.werkRun=String(index);run.textContent='Search';run.setAttribute('aria-label','Run saved search '+item.role+' in '+item.location);
   const remove=document.createElement('button');remove.type='button';remove.dataset.werkRemove=String(index);remove.textContent='×';remove.setAttribute('aria-label','Remove saved search '+item.role);
   row.append(name,run,remove);list.append(row);
  });
 }
 function readSearch(panel){
  return {
   role:clean($('[name=werkRole]',panel)?.value),
   location:clean($('[name=werkLocation]',panel)?.value)||'United States'
  };
 }
 function appendSources(panel,role,location){
  const result=$('#politcWerkResults',panel);
  if(!result)return;
  const title=document.createElement('h3');title.textContent='Search at the source';
  const grid=document.createElement('div');grid.className='politc-werk-source-grid';
  sourceTargets(role,location).forEach(target=>{
   const item=document.createElement('article');item.className='politc-werk-source';
   const name=document.createElement('h4');name.textContent=target.label;
   const desc=document.createElement('p');desc.textContent=target.description;
   item.append(name,desc,makeLink(target.url,'Search '+target.label+' ↗'));
   grid.append(item);
  });
  result.append(title,grid);
 }
 function showVerified(panel,role,location){
  const results=$('#politcWerkResults',panel);
  if(!results)return;
  const api=window.BigLWAVisualLife;
  const matches=typeof api?.searchVerified==='function'?api.searchVerified(role,location):[];
  const prior=$('#politcWerkVerified',results);prior?.remove();
  if(!matches.length)return;
  const section=document.createElement('section');section.id='politcWerkVerified';
  section.className='politc-werk-verified';
  const h=document.createElement('h3');h.textContent='Verified feed snapshot';
  const notice=document.createElement('p');notice.textContent='These source-linked records came from a dated job feed. Confirm each opening is still accepting applications.';
  const grid=document.createElement('div');grid.className='politc-werk-source-grid';
  for(const job of matches.slice(0,12)){
   if(!job||!/^https:\/\//.test(String(job.url||'')))continue;
   const article=document.createElement('article');article.className='politc-werk-source';
   const title=document.createElement('h4');title.textContent=clean(job.title,160);
   const sub=document.createElement('p');sub.textContent=[job.company,job.location,job.source].filter(Boolean).map(x=>clean(x,160)).join(' · ');
   article.append(title,sub,makeLink(job.url,'Read original posting ↗'));grid.append(article);
  }
  if(!grid.children.length)return;
  section.append(h,notice,grid);results.prepend(section);
 }
 async function search(panel){
  const {role,location}=readSearch(panel);
  if(!role){status(panel,'Enter a role, industry or skill to begin.');$('[name=werkRole]',panel)?.focus();return;}
  const results=$('#politcWerkResults',panel);
  results.replaceChildren();appendSources(panel,role,location);
  status(panel,'Opened three source search options. Only original job sites can confirm current availability.');
  const seq=String((Number(panel.dataset.werkRequest||0)+1));panel.dataset.werkRequest=seq;
  const api=window.BigLWAVisualLife;
  if(!api?.loadFeed)return;
  try{await api.loadFeed();}
  catch{return;}
  if(!panel.isConnected||panel.dataset.werkRequest!==seq)return;
  showVerified(panel,role,location);
 }
 function mount(){
  const board=$('#studioApp #moduleWorkspace[data-module-key="politc"] .politc-board');
  if(!board)return;
  let panel=$('#politcWerk',board);
  if(panel){synchronize(panel);return;}
  panel=document.createElement('section');
  panel.id='politcWerk';panel.className='politc-panel politc-werk';
  panel.setAttribute('aria-label','Werk job search desk');
  panel.innerHTML='<header class="politc-werk-header"><div><p class="politc-werk-eyebrow">POLITC · WORK DESK</p><h2>werk</h2><p>Work is political. Find opportunities, keep your search terms, and follow the original listing before applying.</p></div><span aria-hidden="true">✳</span></header>'+
   '<form id="politcWerkForm" class="politc-werk-form"><label>Role, field or skill<input name="werkRole" type="search" maxlength="100" placeholder="Policy research, entertainment law, design…" autocomplete="off" required></label><label>Where?<input name="werkLocation" type="search" maxlength="100" value="United States" placeholder="City, state, or remote" autocomplete="off"></label><div class="politc-werk-actions"><button type="submit" class="politc-werk-find">Find work ↗</button><button type="button" data-politc-werk-save>Save search</button></div></form>'+
   '<p id="politcWerkStatus" class="politc-werk-status" role="status">Enter a role and location to find jobs at the source.</p><div id="politcWerkResults" aria-label="Job search links and verified feed results"></div>'+
   '<div class="politc-werk-saved"><div><h3>Saved searches</h3><small id="politcWerkPrivacyNote"></small></div><div id="politcWerkSavedList"></div></div>';
  board.prepend(panel);panel.dataset.werkOwner=owner();renderSaved(panel);
  $('#politcWerkForm',panel).addEventListener('submit',event=>{event.preventDefault();void search(panel);});
  panel.addEventListener('click',event=>{
   const save=event.target.closest('[data-politc-werk-save]');
   if(save){
    const uid=owner(),entry=readSearch(panel);
    if(!uid){status(panel,'Sign in to save searches; searching is available to everyone.');return;}
    if(!entry.role){status(panel,'Add a role or skill before saving.');return;}
    const rows=readSaved(uid);
    const unique=rows.filter(row=>row.role.toLowerCase()+'|'+row.location.toLowerCase()!==entry.role.toLowerCase()+'|'+entry.location.toLowerCase());
    if(writeSaved(uid,[entry,...unique])){renderSaved(panel);status(panel,'Saved privately on this device for your account.');}
    else status(panel,'Could not save this search on this device.');
    return;
   }
   const run=event.target.closest('[data-werk-run]'),remove=event.target.closest('[data-werk-remove]');
   if(!run&&!remove)return;
   const uid=owner();if(!uid)return;
   const index=Number((run||remove).dataset[run?'werkRun':'werkRemove']);
   const rows=readSaved(uid);
   if(!Number.isInteger(index)||index<0||index>=rows.length)return;
   if(run){
    $('[name=werkRole]',panel).value=rows[index].role;
    $('[name=werkLocation]',panel).value=rows[index].location;
    void search(panel);
   }else{
    rows.splice(index,1);
    if(writeSaved(uid,rows)){renderSaved(panel);status(panel,'Saved search removed.');}
   }
  });
 }
 function synchronize(panel){
  const next=owner();
  if(panel.dataset.werkOwner===next)return;
  panel.dataset.werkOwner=next;
  panel.dataset.werkRequest=String(Number(panel.dataset.werkRequest||0)+1);
  const role=$('[name=werkRole]',panel),where=$('[name=werkLocation]',panel);
  if(role)role.value='';
  if(where)where.value='United States';
  $('#politcWerkResults',panel)?.replaceChildren();
  status(panel,'Enter a role and location to find jobs at the source.');
  renderSaved(panel);
 }
 function sync(){const panel=$('#politcWerk');if(panel)synchronize(panel);else mount();}
 document.addEventListener('biglwa:module-open',event=>{if(event.detail?.key==='politc')mount();});
 for(const eventName of ['biglwa:session-verified','biglwa:public-profile-ready','biglwa:public-profile-ended'])window.addEventListener(eventName,sync);
 new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
 window.BigLWAPolitcWerk=Object.freeze({mount,readSaved,sourceTargets});
})();
