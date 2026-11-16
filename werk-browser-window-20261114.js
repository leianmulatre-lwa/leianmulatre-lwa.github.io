/* BIG LWA Werk Window · an in-site browser-like job explorer.
   It does NOT iframe foreign job sites, handle applications, or imitate a
   privileged browser. External job pages open by explicit user action. */
(()=>{
 'use strict';
 if(window.BigLWAJobWindow)return;
 const $=(q,r=document)=>r.querySelector(q);
 const clean=v=>String(v==null?'':v).trim().slice(0,180);
 let modal=null,selected='',query='',openGeneration=0;
 function trusted(url){
  try{
   const u=new URL(url);return u.protocol==='https:'&&!u.username&&!u.password&&!/^(?:localhost|127\.|10\.|192\.168\.)/i.test(u.hostname);
  }catch{return false;}
 }
 function jobs(){
  const api=window.BigLWAVisualLife;
  return api?.getFeedInfo?.().status==='connected'?api?.listVerified?.()||[]:[];
 }
 function make(tag,cls,txt){
  const e=document.createElement(tag);
  if(cls)e.className=cls;
  if(txt!==undefined)e.textContent=clean(txt);
  return e;
 }
 function link(url,text){
  const a=make('a','werk-window-original',text);
  a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;
 }
 function detail(job){
  const wrap=$('.werk-window-details',modal);if(!wrap)return;
  wrap.replaceChildren();
  if(!job){
   wrap.append(make('h3','', 'Choose a source-linked posting'));
   wrap.append(make('p','','Select a role on the left to inspect its public listing details.'));
   return;
  }
  const source=make('span','werk-window-meta',job.source||'Employer listing');
  const title=make('h3','',job.title||'Role');
  const employer=make('p','werk-window-company',job.company||'Employer');
  const location=make('p','',job.location||'Location not listed');
  const date=make('p','werk-window-meta',job.postedAt?'Posted '+job.postedAt:'Posting date unavailable');
  const warning=make('p','werk-window-note','Source snapshot, not a live vacancy check. Review details and apply on the original employer or board page.');
  wrap.append(source,title,employer,location,date,warning);
  if(trusted(job.url))wrap.append(link(job.url,'Open original posting ↗'));
 }
 function render(){
  if(!modal)return;
  const source=$('.werk-window-list',modal);
  const status=$('.werk-window-status',modal);
  const all=jobs();
  source.replaceChildren();
  if(!all.length){
   status.textContent='No published job snapshot is available. This window cannot run remote scrapers or load job-site content.';
   detail(null);return;
  }
  const normalized=query.toLowerCase().trim();
  const terms=normalized.split(/\s+/).filter(Boolean);
  const eligible=all.filter(job=>terms.every(t=>[job.title,job.company,job.location,job.source,job.searchTerm].join(' ').toLowerCase().includes(t)));
  let matched=eligible.slice(0,45);
  // Direct-open URLs are more important than the first 45 rows.
  // Keep the selected verified posting visible even if it is row 46–240.
  if(selected&&!matched.some(job=>job.url===selected)){
   const wanted=eligible.find(job=>job.url===selected);
   if(wanted)matched=[wanted,...matched.slice(0,44)];
  }
  status.textContent='Showing '+matched.length+' of '+eligible.length+' matching postings · '+all.length+' source-linked jobs in the latest snapshot';
  if(!matched.length){source.append(make('p','werk-window-empty','No matching records in this snapshot. Try a broader search.'));detail(null);return;}
  if(!matched.some(job=>job.url===selected))selected=matched[0].url;
  for(const job of matched){
   const button=make('button','werk-window-list-item');
   button.type='button';button.dataset.jobUrl=job.url;
   button.setAttribute('aria-pressed',String(selected===job.url));
   button.append(make('strong','',job.title),make('small','',[job.company,job.location].filter(Boolean).join(' · ')));
   source.append(button);
  }
  detail(matched.find(j=>j.url===selected)||matched[0]);
 }
 function ensure(){
  if(modal?.isConnected)return modal;
  modal=document.createElement('dialog');modal.className='werk-browser-window';
  modal.setAttribute('aria-label','Werk Window job search');
  modal.innerHTML='<div class="werk-window-chrome"><span class="werk-window-traffic" aria-hidden="true"><i></i><i></i><i></i></span><strong>Werk Window</strong><button type="button" class="werk-window-close" aria-label="Close Werk Window">×</button></div>'+
  '<div class="werk-window-bar"><label>Find in published jobs<input class="werk-window-query" type="search" maxlength="100" placeholder="Role, company, location…" autocomplete="off"></label><span class="werk-window-address">BIG LWA · public source index</span></div>'+
  '<p class="werk-window-status" role="status"></p><div class="werk-window-content"><div class="werk-window-list" aria-label="Found postings"></div><section class="werk-window-details" aria-label="Selected job details"></section></div>';
  document.body.append(modal);
  $('.werk-window-close',modal).addEventListener('click',()=>modal.close());
  $('.werk-window-query',modal).addEventListener('input',e=>{openGeneration++;query=e.target.value;selected='';render()});
  $('.werk-window-list',modal).addEventListener('click',e=>{
   const item=e.target.closest('button[data-job-url]');if(!item)return;
   selected=item.dataset.jobUrl;render();
  });
  modal.addEventListener('click',e=>{if(e.target===modal)modal.close()});
  return modal;
 }
 async function open({url='',search=''}={}){
  const box=ensure(),generation=++openGeneration;
  query=clean(search);
  selected='';
  const requested=trusted(url)?String(url):'';
  const input=$('.werk-window-query',box);
  input.value=query;
  if(!box.open)box.showModal();
  input.focus({preventScroll:true});
  const api=window.BigLWAVisualLife;
  // L’wazi and Politic may render a sourced card before Werk Window has
  // loaded its own local feed. Wait for that same vetted snapshot.
  if(requested&&api?.getFeedInfo?.().status!=='connected'&&typeof api?.loadFeed==='function'){
   $('.werk-window-list',box).replaceChildren();
   $('.werk-window-details',box).replaceChildren();
   $('.werk-window-status',box).textContent='Finding this posting in the published Werk index…';
   try{await api.loadFeed()}catch{/* the status below explains unavailable source data */}
   if(generation!==openGeneration||!box.open)return;
  }
  const match=requested&&api?.getJobByUrl?.(requested);
  selected=match?.url||'';
  render();
  if(requested&&!match){
   const status=$('.werk-window-status',box),details=$('.werk-window-details',box);
   status.textContent='This listing is not available in the current published Werk snapshot.';
   details.replaceChildren(
    make('h3','','Listing unavailable in Werk'),
    make('p','','The source feed is missing, expired, or no longer contains this posting. Verify the original before applying.'),
    link(requested,'Open original posting ↗')
   );
  }
 }
 document.addEventListener('click',event=>{
  const item=event.target.closest?.('[data-werk-preview-url]');
  if(item){event.preventDefault();open({url:item.dataset.werkPreviewUrl});return}
  const browse=event.target.closest?.('[data-werk-window-open]');
  if(browse){event.preventDefault();open({search:browse.dataset.werkWindowSearch||''});}
 });
 window.BigLWAJobWindow=Object.freeze({open,version:'1.1.0'});
})();
