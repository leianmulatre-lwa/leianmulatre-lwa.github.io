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
   if(!['www.usajobs.gov','www.linkedin.com','www.indeed.com','www.google.com','skims.pinpointhq.com','job-boards.greenhouse.io','careers.pvh.com','www.chanel.com','www.michaelkors.com','corporate.abercrombie.com'].includes(url.hostname.toLowerCase()))return '';
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
  if(!uid||uid!==owner())return [];
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
 function sourceHost(raw){try{return new URL(String(raw)).hostname.replace(/^www\./,'')}catch{return 'source'}}
 function readNote(lines){const note=document.createElement('p');note.className='politc-werk-read';note.textContent='Read first · '+lines.filter(Boolean).join(' · ');return note;}
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
 function appendSourceHandoffs(results,role,location){
  const targets=sourceTargets(role,location);
  if(!targets.length)return;
  const section=document.createElement('section');section.className='politc-werk-discovery-links';
  const heading=document.createElement('h3');heading.textContent='Keep searching beyond BIG LWA';
  const description=document.createElement('p');
  description.textContent='These links search original employer careers pages or larger job indexes. They are not claimed as jobs found in this snapshot.';
  section.append(heading,description);
  const grid=document.createElement('div');grid.className='politc-werk-source-grid';
  for(const target of targets){
   const card=document.createElement('article');card.className='politc-werk-source';
   const link=makeLink(target.url,target.label+' ↗');
   const about=document.createElement('p');about.textContent=target.description;
   card.append(link,about,readNote([sourceHost(target.url)+' destination',target.description,'No third-party page was fetched; verify details after opening']));grid.append(card);
  }
  section.append(grid);results.append(section);
 }
 function appendJobCard(grid,job){
  const url=String(job?.url||'');
  if(!/^https:\/\//i.test(url))return false;
  const card=document.createElement('article');card.className='politc-werk-source politc-werk-job';
  const source=document.createElement('span');source.className='politc-werk-job-source';
  source.textContent=clean(job.source,65)||'JobSpy source';
  const title=document.createElement('h4');title.textContent=clean(job.title,160);
  const employer=document.createElement('p');employer.className='politc-werk-job-employer';
  employer.textContent=clean(job.company,160);
  const location=document.createElement('p');location.className='politc-werk-job-location';
  location.textContent=clean(job.location,120)||'Location not listed';
  const posted=clean(job.postedAt,35);
  card.append(source,title,employer,location);
  if(posted){
    const date=document.createElement('small');date.className='politc-werk-job-posted';
    date.textContent='Posted '+posted;card.append(date);
  }
  card.append(readNote([
   clean(job.source,65)||'JobSpy source',
   clean(job.company,160)||'Employer not supplied',
   clean(job.location,120)||'Location not supplied',
   posted?'Posted '+posted:'Posting date not supplied',
   'Source page not fetched by BIG LWA'
  ]));
  const preview=document.createElement('button');
  preview.type='button';preview.dataset.werkPreviewUrl=url;
  preview.textContent='Preview in Werk Window';
  preview.setAttribute('aria-label','Preview '+clean(job.title,100)+' in Werk Window');
  card.append(preview);
  const apply=makeLink(url,'View original posting ↗');
  apply.className='politc-werk-job-apply';
  card.append(apply);grid.append(card);
  return true;
 }
 function renderResults(panel,role,location){
  const results=$('#politcWerkResults',panel);
  if(!results)return;
  results.replaceChildren();
  const api=window.BigLWAVisualLife;
  const info=api?.getFeedInfo?.()||{};
  if(info.status!=='connected'){
    const empty=document.createElement('div');empty.className='politc-werk-result-empty';
    const title=document.createElement('h3');title.textContent='JobSpy listings not available yet';
    const message=document.createElement('p');
    message.textContent=info.status==='stale'?
      'The last JobSpy snapshot has expired. Listings are hidden until the owner runs the reviewed refresh.':
      'The werk-main / JobSpy scraper is installed, but no published snapshot is available. The site cannot run Python scrapers inside your browser.';
    empty.append(title,message);results.append(empty);
    appendSourceHandoffs(results,role,location);
    status(panel,'Local listings are unavailable, but you can search original careers pages below.');
    return;
  }
  const jobs=typeof api.searchVerified==='function'?api.searchVerified(role,location):[];
  const heading=document.createElement('div');heading.className='politc-werk-result-header';
  const count=document.createElement('h3');count.textContent=jobs.length+' matching '+(jobs.length===1?'job':'jobs');
  const details=document.createElement('p');details.className='politc-werk-snapshot-meta';
  details.textContent='JobSpy snapshot'+(info.generatedAt?' · '+new Date(info.generatedAt).toLocaleDateString():'')+
    (info.sources?.length?' · '+info.sources.join(', '):'')+' · Not a live vacancy check';
  heading.append(count,details);
  const context=document.createElement('section');context.className='politc-werk-source-context';
  context.append(readNote([
   'Published BIG LWA snapshot',
   info.generatedAt?'generated '+new Date(info.generatedAt).toLocaleDateString():'generation date unavailable',
   info.sources?.length?'sources: '+info.sources.join(', '):'source list unavailable',
   jobs.length+' records checked locally',
   'not a live vacancy check'
  ]));
  results.append(heading,context);
  const grid=document.createElement('div');grid.className='politc-werk-source-grid politc-werk-jobs';
  let displayed=0;
  for(const job of jobs.slice(0,20))if(appendJobCard(grid,job))displayed++;
  if(displayed)results.append(grid);
  else{
    const empty=document.createElement('p');empty.className='politc-werk-result-empty';
    empty.textContent='No matching jobs in this published JobSpy snapshot. Try a broader role or location. This does not mean there are no openings elsewhere.';
    results.append(empty);
    appendSourceHandoffs(results,role,location);
  }
  status(panel,displayed?displayed+' source-linked postings found in BIG LWA. Verify each opening before applying.':
    'No matches in this limited snapshot. Try the employer careers and wider job searches below.');
 }
 async function search(panel){
  const {role,location}=readSearch(panel);
  if(!role){status(panel,'Enter a role, industry or skill to begin.');$('[name=werkRole]',panel)?.focus();return;}
  const results=$('#politcWerkResults',panel);
  results.replaceChildren();
  status(panel,'Looking through the latest BIG LWA JobSpy source snapshot…');
  const seq=String(Number(panel.dataset.werkRequest||0)+1);
  panel.dataset.werkRequest=seq;
  const api=window.BigLWAVisualLife;
  if(!api?.loadFeed){
    status(panel,'The JobSpy listings adapter is unavailable. Please reload Werk.');
    return;
  }
  try{await api.loadFeed();}
  catch{status(panel,'Unable to read the JobSpy job feed right now.');return;}
  if(!panel.isConnected||panel.dataset.werkRequest!==seq)return;
  renderResults(panel,role,location);
 }
 function mount(){
  const board=$('#studioApp #moduleWorkspace[data-module-key="politc"] .politc-board');
  if(!board)return;
  const moduleBody=board.parentElement;
  let panel=$('#politcWerk',moduleBody);
  if(panel){synchronize(panel);return;}
  panel=document.createElement('section');
  panel.id='politcWerk';panel.className='politc-panel politc-werk';
  panel.setAttribute('aria-label','Werk job search desk');
  panel.innerHTML='<header class="politc-werk-header"><div><p class="politc-werk-eyebrow">POLITC · WORK DESK</p><h2>werk</h2><p>Work is political. Search employer names or job titles, save searches, and follow original listings. The local index is a limited snapshot, not every opening.</p></div><span aria-hidden="true">✳</span></header>'+
   '<form id="politcWerkForm" class="politc-werk-form"><label>Role, employer, field or skill<input name="werkRole" type="search" maxlength="100" placeholder="SKIMS, casting, entertainment law, design…" autocomplete="off" required></label><label>Where?<input name="werkLocation" type="search" maxlength="100" value="United States" placeholder="City, state, or remote" autocomplete="off"></label><div class="politc-werk-actions"><button type="submit" class="politc-werk-find">Search jobs</button><button type="button" data-politc-werk-save>Save search</button><button type="button" data-werk-window-open>Werk Window</button></div></form>'+
   '<p id="politcWerkStatus" class="politc-werk-status" role="status">Search the latest published JobSpy listings by role and location.</p><div id="politcWerkResults" aria-label="JobSpy job search results"></div>'+
   '<div class="politc-werk-saved"><div><h3>Saved searches</h3><small id="politcWerkPrivacyNote"></small></div><div id="politcWerkSavedList"></div></div>';
  // The Reading Room is mounted as a sibling before .politc-board.
  // Keep Werk ahead of both that desk and the election/tracker sections.
  moduleBody.insertBefore(panel,moduleBody.querySelector('#politcResearchDesk')||board);
  panel.dataset.werkOwner=owner();renderSaved(panel);
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
  status(panel,'Search the latest published JobSpy listings by role and location.');
  renderSaved(panel);
 }
 function sync(){const panel=$('#politcWerk');if(panel)synchronize(panel);else mount();}
 document.addEventListener('biglwa:module-open',event=>{if(event.detail?.key==='politc')mount();});
 for(const eventName of ['biglwa:session-verified','biglwa:public-profile-ready','biglwa:public-profile-ended'])window.addEventListener(eventName,sync);
 new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
 window.BigLWAPolitcWerk=Object.freeze({mount,readSaved,sourceTargets});
})();
