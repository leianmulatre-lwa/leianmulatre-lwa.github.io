/* BIG LWA L’wazi Workshop · Visual-Life job discovery.
 * Separate UI / data adapter. Werk-main (original job scraper) is not connected.
 * This component never invents job listings and never silently scrapes employers.
 * A future verified source may call BigLWAVisualLife.setJobs(validatedJobs).
 */
(function(){
'use strict';
if(window.BigLWAVisualLife)return;
const MAX_JOBS=240;
const $=(s,r=document)=>r.querySelector(s);
const clean=v=>String(v==null?'':v).trim().slice(0,160);
const esc=v=>clean(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let jobs=[],sourceStatus='pending',sourceTimestamp='',sourceLoading=null,pendingOpen=false,feedVerified=false,feedMeta={};
function externalUrl(raw){
 try{
  const url=new URL(raw);
  if(url.protocol!=='https:'||url.username||url.password)return '';
  const host=url.hostname.toLowerCase();
  if(host==='localhost'||host.endsWith('.local')||/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host))return '';
  return url.href;
 }catch{return ''}
}
function normalizeJobs(rows){
 if(!Array.isArray(rows))return [];
 const used=new Set();
 return rows.slice(0,MAX_JOBS).map(row=>{
  if(!row||typeof row!=='object')return null;
  const url=externalUrl(row.url);
  const title=clean(row.title),company=clean(row.company),location=clean(row.location),source=clean(row.source);
  if(!url||!title||!company||!source)return null;
  const id=url+'|'+title.toLowerCase();if(used.has(id))return null;used.add(id);
  return {title,company,location,source,url,postedAt:clean(row.postedAt),searchTerm:clean(row.searchTerm)};
 }).filter(Boolean);
}
/* Verified official careers pages, not invented postings. */
const BRAND_CAREERS=[
 {aliases:['skims','nikeskims'],label:'SKIMS careers',url:'https://skims.pinpointhq.com/'},
 {aliases:['glossier'],label:'Glossier careers',url:'https://job-boards.greenhouse.io/glossier'},
 {aliases:['calvin klein'],label:'Calvin Klein careers',url:'https://careers.pvh.com/calvinklein/us/en'},
 {aliases:['chanel'],label:'CHANEL careers',url:'https://www.chanel.com/us/careers/'},
 {aliases:['michael kors'],label:'Michael Kors careers',url:'https://www.michaelkors.com/careers.html'},
 {aliases:['abercrombie','abercrombie and fitch'],label:'Abercrombie careers',url:'https://corporate.abercrombie.com/Careers/'}
];
function companyCareers(query){
 const words=' '+clean(query).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()+' ';
 return BRAND_CAREERS.find(entry=>entry.aliases.some(alias=>words.includes(' '+alias+' ')))||null;
}
function searchTargets(query,where){
 const term=clean(query)||'creative jobs',place=clean(where)||'United States';
 const federal=/\b(government|federal|public sector|civil service|policy)\b/i.test(term);
 const targets=[
  federal
   ?{label:'USAJOBS',description:'Federal and public-sector openings',url:'https://www.usajobs.gov/Search/Results?k='+encodeURIComponent(term)+'&l='+encodeURIComponent(place)}
   :{label:'Google Jobs',description:'Search beyond BIG LWA’s published index',url:'https://www.google.com/search?q='+encodeURIComponent(term+' jobs '+place)},
  {label:'LinkedIn Jobs',description:'Employer and network listings',url:'https://www.linkedin.com/jobs/search/?keywords='+encodeURIComponent(term)+'&location='+encodeURIComponent(place)},
  {label:'Indeed',description:'Listings from more employers',url:'https://www.indeed.com/jobs?q='+encodeURIComponent(term)+'&l='+encodeURIComponent(place)}
 ];
 const brand=companyCareers(term);
 if(brand)targets.unshift({label:brand.label,description:'Official employer career opportunities',url:brand.url});
 return targets;
}
function addSourceOptions(grid,role,where){
 const section=document.createElement('div');section.className='visual-life-external';
 const note=document.createElement('p');note.textContent='BIG LWA’s snapshot is not the entire job market. Continue on these original sources:';
 section.append(note);
 for(const target of searchTargets(role,where)){
  const link=document.createElement('a');link.href=target.url;link.target='_blank';link.rel='noopener noreferrer';
  link.textContent=target.label+' ↗';link.title=target.description;section.append(link);
 }
 grid.append(section);
}
/* Share only accepted, non-expired source records with Politic Werk.
 * Searches do not contact job boards or create proxy scraping requests. */
function searchVerified(role,where){
 if(!feedVerified||sourceStatus!=='connected')return [];
 const irrelevant=new Set(['job','jobs','role','roles','opening','openings','career','careers','hiring','find','show','me','at','for','in','with','from','the','a','an']);
 const tokens=clean(role).toLowerCase().replace(/[^a-z0-9]+/g,' ').split(/\s+/).filter(term=>term&&!irrelevant.has(term));
 const place=clean(where).toLowerCase();
 const wide=!place||['united states','usa','us','anywhere'].includes(place);
 return jobs.filter(job=>{
  const searchable=[job.title,job.company,job.searchTerm].join(' ').toLowerCase();
  const roleMatch=tokens.every(term=>searchable.includes(term));
  const loc=job.location.toLowerCase();
  const placePart=place.split(',')[0].trim();
  const locationMatch=wide||loc.includes(place)||Boolean(placePart)&&loc.includes(placePart)
    ||(place==='remote'&&loc.includes('remote'));
  return roleMatch&&locationMatch;
 }).slice(0,20).map(job=>({...job}));
}
function searchLwazi(query,limit=12){
 if(!feedVerified||sourceStatus!=='connected')return [];
 const stop=new Set(['find','show','me','all','real','actual','latest','current','open','jobs','job','postings','roles','opportunities','available','near','please','work','hiring','for','in','at','from','with','the','a','an','and','or','i','want','am','looking','search']);
 const terms=clean(query).toLowerCase().replace(/[^a-z0-9 ]/g,' ').split(/\s+/)
  .filter(token=>token.length>1&&!stop.has(token));
 const scored=jobs.map(job=>{
   const title=job.title.toLowerCase(),company=job.company.toLowerCase();
   const location=job.location.toLowerCase(),term=job.searchTerm.toLowerCase();
   let score=0,matches=0;
   for(const word of terms){
     if(title.includes(word)){score+=4;matches++;}
     else if(company.includes(word)){score+=3;matches++;}
     else if(location.includes(word)){score+=2;matches++;}
     else if(term.includes(word)){score+=1;matches++;}
   }
   return {job,score,matches};
 }).filter(entry=>terms.length===0||entry.matches>=Math.min(terms.length,2));
 return scored.sort((a,b)=>b.matches-a.matches||b.score-a.score)
  .slice(0,Math.max(0,Math.min(20,Number(limit)||12))).map(entry=>({...entry.job}));
}
function listVerified(){
 if(!feedVerified||sourceStatus!=='connected')return [];
 return jobs.map(job=>({...job}));
}
function getJobByUrl(url){
 if(typeof url!=='string'||!url.startsWith('https://'))return null;
 const match=listVerified().find(job=>job.url===url);
 return match||null;
}
function getFeedInfo(){
 return {
  status:feedVerified&&sourceStatus==='connected'?'connected':sourceStatus==='stale'?'stale':'pending',
  generatedAt:feedMeta.generatedAt||'',
  searchTerm:feedMeta.searchTerm||'',
  sources:[...(feedMeta.sources||[])],
  count:feedVerified?jobs.length:0
 };
}
function ensure(root){
 if(!root)return null;
 const current=$('#craftVisualLifePanel',root);
 if(current)return current;
 const panel=document.createElement('section');
 panel.id='craftVisualLifePanel';
 panel.className='craft-visual-life';
 panel.hidden=true;panel.setAttribute('aria-label','Visual-Life job discovery');
 panel.innerHTML='<div class="visual-life-head"><div><span class="craft-label">Visualizr · Visual-Life</span><h2>Visual-Life</h2><p>Find work worth considering. Follow the employer or verified listing, not a fabricated job card.</p></div><button type="button" data-visual-life-close aria-label="Close Visual-Life">×</button></div>'+
 '<form class="visual-life-search"><label>Role or skill<input name="role" value="creative director" maxlength="100" autocomplete="off"></label><label>Location<input name="location" value="United States" maxlength="90" autocomplete="off"></label><button type="submit">Find opportunities</button></form>'+
 '<div class="visual-life-source-note" role="status"></div><div class="visual-life-job-grid"></div>';
 const dir=$('.craft-directory',root);
 if(dir)dir.insertAdjacentElement('afterend',panel);else root.appendChild(panel);
 panel.addEventListener('click',event=>{
  if(event.target.closest('[data-visual-life-close]'))panel.hidden=true;
 });
 panel.addEventListener('submit',event=>{event.preventDefault();render(panel)});
 return panel;
}
function ensureCard(root){
 // Job discovery remains available from Visualizr/Politic/L'wazi, but it is
 // not an image or document editor. Keep the Workshop limited to actual tools.
 root.querySelector('[data-craft-card="visual-life"]')?.remove();
}

function render(panel){
 const role=clean($('[name=role]',panel)?.value),where=clean($('[name=location]',panel)?.value);
 const note=$('.visual-life-source-note',panel),grid=$('.visual-life-job-grid',panel);
 grid.replaceChildren();
 const info=getFeedInfo();
 if(info.status!=='connected'){
  note.textContent=sourceStatus==='stale'?
   'The JobSpy source snapshot has expired; previously retrieved listings are hidden until the reviewed feed is updated.':
   'The vendored werk-main / JobSpy feed has not been published yet. Visual-Life cannot run a Python scraper in the browser.';
  addSourceOptions(grid,role,where);
  return;
 }
 const filtered=searchVerified(role,where);
 note.textContent='JobSpy snapshot'+(sourceTimestamp?' · '+sourceTimestamp:'')+
  ' · '+filtered.length+' matching results. Listings are source-linked, not confirmed live; verify each original posting.';
 if(!filtered.length){
  const none=document.createElement('p');
  none.className='visual-life-empty';
  none.textContent='No matching jobs in this published snapshot. Try broader keywords or location.';
  grid.append(none);addSourceOptions(grid,role,where);return;
 }
 filtered.forEach(job=>{
  const card=document.createElement('article');card.className='visual-life-job-card';
  const source=document.createElement('span');source.className='craft-label';source.textContent=job.source;
  const title=document.createElement('h3');title.textContent=job.title;
  const desc=document.createElement('p');desc.textContent=[job.company,job.location].filter(Boolean).join(' · ');
  const link=document.createElement('a');link.href=job.url;link.target='_blank';
  link.rel='noopener noreferrer';link.textContent='View original posting ↗';
  card.append(source,title,desc,link);grid.appendChild(card);
 });
}
async function loadFeed(){
 if(sourceLoading)return sourceLoading;
 sourceLoading=(async()=>{
  try{
   const controller=new AbortController(),stop=setTimeout(()=>controller.abort(),7000);
   let response;
   try{response=await fetch('/data/visual-life/jobs.json',{cache:'no-store',signal:controller.signal,headers:{Accept:'application/json'}})}
   finally{clearTimeout(stop)}
   if(!response.ok)throw Error('Job source feed unavailable');
   const data=await response.json();
   if(data?.schema!==1||data?.status!=='published'||!Array.isArray(data?.jobs))return;
   const published=Date.parse(data.generated_at||'');
   if(!Number.isFinite(published)||Date.now()-published>96*3600*1000||published>Date.now()+3600*1000){sourceStatus='stale';jobs=[];return}
   sourceTimestamp=new Date(published).toLocaleDateString();
   feedMeta={generatedAt:data.generated_at,searchTerm:clean(data.search_term),sources:Array.isArray(data.sources)?data.sources.map(clean):[]};
   setJobs(data.jobs);
   feedVerified=jobs.length>0;
  }catch{sourceStatus='pending'}
 })();
 return sourceLoading;
}
function open(root){
 const panel=ensure(root);if(!panel)return;
 panel.hidden=false;ensureCard(root);render(panel);
 loadFeed().then(()=>{if(panel.isConnected&&!panel.hidden)render(panel)});
 panel.scrollIntoView({behavior:'smooth',block:'start'});
}
function setJobs(rows){
 jobs=normalizeJobs(rows);sourceStatus=jobs.length?'connected':'pending';
 const panel=document.querySelector('#craftVisualLifePanel');
 if(panel&&!panel.hidden)render(panel);
 return {accepted:jobs.length,status:sourceStatus};
}
function install(){
 const project=document.querySelector('#moduleWorkspace[data-module-key="projects"]');
 const tabs=project?.querySelector('.visualz-tabs');
 if(tabs&&!tabs.querySelector('[data-visual-life-open]')){
  const link=document.createElement('button');link.type='button';link.className='visual-life-entry';
  link.textContent='visual·life';link.dataset.visualLifeOpen='';link.setAttribute('aria-pressed','false');
  link.addEventListener('click',()=>{project.classList.add('visual-life-active');tabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===link)));open(project);});
  tabs.append(link);
  tabs.addEventListener('click',event=>{if(event.target.closest('[data-visualz-mode]')){project.classList.remove('visual-life-active');project.querySelector('#craftVisualLifePanel')?.remove();}});
 }
 if(project&&!project.__lifeCloseBound){project.__lifeCloseBound=true;project.addEventListener('click',event=>{if(event.target.closest('[data-visual-life-close]')){project.classList.remove('visual-life-active');project.querySelector('[data-visualz-mode].active')?.click();}});}
 const root=document.querySelector('#craftSuite');if(!root)return;
 ensureCard(root);
 if(pendingOpen){pendingOpen=false;open(root)}
 if(root.__visualLifeBound)return;
 root.__visualLifeBound=true;
 root.addEventListener('click',event=>{
  const button=event.target.closest('[data-visual-life-open]');
  if(!button||!root.contains(button))return;
  event.preventDefault();open(root);
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
else install();
new MutationObserver(install).observe(document.documentElement,{childList:true,subtree:true});
window.BigLWAVisualLife={open,ensureCard,setJobs,normalizeJobs,searchTargets,searchVerified,searchLwazi,listVerified,getJobByUrl,getFeedInfo,loadFeed,getStatus:()=>sourceStatus,getSourceTimestamp:()=>sourceTimestamp,version:'1.4.0'};
})();
