/* BIG LWA L’wazi Workshop · Visual-Life job discovery.
 * Separate UI / data adapter. Werk-main (original job scraper) is not connected.
 * This component never invents job listings and never silently scrapes employers.
 * A future verified source may call BigLWAVisualLife.setJobs(validatedJobs).
 */
(function(){
'use strict';
if(window.BigLWAVisualLife)return;
const MAX_JOBS=60;
const $=(s,r=document)=>r.querySelector(s);
const clean=v=>String(v==null?'':v).trim().slice(0,160);
const esc=v=>clean(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let jobs=[],sourceStatus='pending';
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
  return {title,company,location,source,url,postedAt:clean(row.postedAt)};
 }).filter(Boolean);
}
function searchTargets(query,where){
 const term=clean(query)||'creative jobs';
 const place=clean(where)||'United States';
 return [
  {label:'USAJOBS',description:'Public-sector openings',url:'https://www.usajobs.gov/Search/Results?k='+encodeURIComponent(term)+'&l='+encodeURIComponent(place)},
  {label:'LinkedIn Jobs',description:'Employer and network listings',url:'https://www.linkedin.com/jobs/search/?keywords='+encodeURIComponent(term)+'&location='+encodeURIComponent(place)},
  {label:'Indeed',description:'Jobs from employers',url:'https://www.indeed.com/jobs?q='+encodeURIComponent(term)+'&l='+encodeURIComponent(place)}
 ];
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
 const dir=$('.craft-directory',root);if(!dir||dir.querySelector('[data-craft-card="visual-life"]'))return;
 const tile=document.createElement('article');
 tile.className='craft-tile craft-tile-home visual-life-workshop-tile';
 tile.dataset.craftCard='visual-life';
 tile.innerHTML='<div class="craft-tile-eyebrow">BIG LWA ORIGINAL · WORK + LIFE</div>'+
 '<div class="craft-tile-icon craft-arcade-block" aria-hidden="true"><div class="craft-block-pair"><span class="craft-block-main"><span class="visual-life-icon">V<span>✺</span></span></span></div></div>'+
 '<h3>visual-life</h3><p>Creative work, everyday opportunity and accountable job discovery.</p>'+
 '<div class="craft-engine-credits">Visualizr family · Jobs</div><button type="button" data-visual-life-open>Find jobs →</button>';
 const visualizr=dir.querySelector('[data-craft-card="visualizr"]');
 if(visualizr)visualizr.insertAdjacentElement('afterend',tile);else dir.appendChild(tile);
}
function render(panel){
 const role=clean($('[name=role]',panel)?.value),where=clean($('[name=location]',panel)?.value);
 const note=$('.visual-life-source-note',panel),grid=$('.visual-life-job-grid',panel);
 grid.replaceChildren();
 note.textContent=jobs.length?
   'Source adapter connected. Open each original posting to verify its details, employer and current availability.':
   'Werk-main source not yet available to this deployment. These buttons open searches at original job platforms. No scraped listings are being represented as current.';
 const all=jobs.length?jobs.filter(j=>[j.title,j.company,j.location].join(' ').toLowerCase().includes(role.toLowerCase())).slice(0,MAX_JOBS):[];
 if(all.length){
  all.forEach(job=>{
   const card=document.createElement('article');card.className='visual-life-job-card';
   card.innerHTML='<span class="craft-label">'+esc(job.source)+'</span><h3>'+esc(job.title)+'</h3><p>'+esc(job.company)+(job.location?' · '+esc(job.location):'')+'</p><a target="_blank" rel="noopener noreferrer" href="'+esc(job.url)+'">View original posting ↗</a>';
   grid.appendChild(card);
  });
 }
 searchTargets(role,where).forEach(item=>{
  const card=document.createElement('article');card.className='visual-life-job-card visual-life-search-link';
  card.innerHTML='<span class="craft-label">EXTERNAL SEARCH</span><h3>'+esc(item.label)+'</h3><p>'+esc(item.description)+'</p><a href="'+esc(item.url)+'" rel="noopener noreferrer" target="_blank">Search '+esc(item.label)+' ↗</a>';
  grid.appendChild(card);
 });
}
function open(root){
 const panel=ensure(root);if(!panel)return;
 panel.hidden=false;ensureCard(root);render(panel);
 panel.scrollIntoView({behavior:'smooth',block:'start'});
}
function setJobs(rows){
 jobs=normalizeJobs(rows);sourceStatus=jobs.length?'connected':'pending';
 const panel=document.querySelector('#craftVisualLifePanel');
 if(panel&&!panel.hidden)render(panel);
 return {accepted:jobs.length,status:sourceStatus};
}
window.BigLWAVisualLife={open,ensureCard,setJobs,normalizeJobs,searchTargets,getStatus:()=>sourceStatus,version:'1.0.0'};
})();
