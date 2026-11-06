/* BIG LWA: visual bridges for link-only satellites.
 * No automated scraping, hidden downloader, provider impersonation, or mass publishing.
 */
(()=>{
 'use strict';
 const SATELLITES=[
  ['vsco','VS','VSCO'],['bereal','BR','BeReal'],
  ['substack','S','Substack'],['xbox','XB','Xbox']
 ];
 const q=(s,r=document)=>r.querySelector(s);
 const links=()=>window.BigLWAOrbitAccountLinks?.get?.()||{};
 function linkFor(id){
  let u;try{u=new URL(String(links()[id]||''))}catch{return ''}
  if(u.protocol!=='https:'||u.username||u.password||u.port)return '';
  const allowed={vsco:['vsco.co','vsco.com'],bereal:['bere.al','bereal.com'],
   substack:['substack.com'],xbox:['xbox.com','xboxlive.com'],drive:['drive.google.com']};
  if(allowed[id]&&!allowed[id].some(host=>u.hostname===host||u.hostname.endsWith('.'+host)))return '';
  return u.href;
 }
 function makeLink(id,label){
  const a=document.createElement('a');
  a.className='biglwa-satellite-link';
  a.href=linkFor(id)||(id==='substack'?'https://substack.com/publish':'https://drive.google.com/');
  a.target='_blank';a.rel='noopener noreferrer';a.textContent=label+' ↗';
  return a;
 }
 function renderPlanets(){
  const grid=q('#studioApp .orbit-grid');
  if(!grid)return;
  for(const [id,short,label] of SATELLITES){
   let button=grid.querySelector('[data-orbit-app="'+id+'"]');
   if(!button){
    button=document.createElement('button');button.type='button';
    button.dataset.orbitApp=id;button.dataset.open='orbit';
    button.title='Manage '+label+' public profile link in Orbit';
    const icon=document.createElement('span');icon.className='orbit-glyph';icon.textContent=short;
    const name=document.createElement('b');name.textContent=label;
    const status=document.createElement('small');status.textContent='Link';
    button.append(icon,name,status);grid.append(button);
   }
   button.classList.toggle('is-linked',!!linkFor(id));
   const status=q('small',button);if(status)status.textContent=linkFor(id)?'Linked':'Link';
  }
 }
 function renderAvatar(){
  const host=q('#studioApp #avatar, #studioApp .studio-avatar-card, #studioApp [data-widget-route="avatar"]');
  if(!host)return;
  host.querySelector('[data-biglwa-xbox-shortcut]')?.remove();
  const url=linkFor('xbox');if(!url)return;
  const a=makeLink('xbox','Xbox gamertag');
  a.dataset.biglwaXboxShortcut='1';a.href=url;
  a.setAttribute('aria-label','Open your linked Xbox gamertag in a new tab');
  let actions=q('.card-actions, .avatar-actions, .card-body',host);
  (actions||host).append(a);
 }
 function renderSubstack(){
  const host=q('#moduleWorkspace[data-module-key="diary"]:not([hidden]) #moduleWorkspaceBody');
  if(!host)return;
  host.querySelector('[data-biglwa-substack-link]')?.remove();
  const bar=document.createElement('div');bar.className='biglwa-satellite-actions';
  bar.dataset.biglwaSubstackLink='1';
  const a=makeLink('substack','Write on Substack');
  // Open the writer's publication if linked; otherwise open Substack's own editor.
  bar.append(a);q('.module-heading',host)?.after(bar);
 }
 function renderCalendar(){
  const host=q('#moduleWorkspace[data-module-key="calendar"]:not([hidden]) #moduleWorkspaceBody');
  if(!host||q('#biglwaDatedExternal',host))return;
  const shell=q('.calendar-shell',host);if(!shell)return;
  const details=document.createElement('details');details.className='module-card wide';
  details.id='biglwaDatedExternal';details.style.marginTop='10px';
  const heading=document.createElement('summary');heading.textContent='Save a public social link to a calendar date';
  const form=document.createElement('form');form.className='module-form';form.style.marginTop='9px';
  const select=document.createElement('select');select.className='module-select';select.setAttribute('aria-label','Source');
  const platforms=[['bereal','BeReal'],['vsco','VSCO'],['substack','Substack'],
    ['instagram','Instagram'],['tiktok','TikTok'],['x','X'],['tumblr','Tumblr'],['pinterest','Pinterest']];
  for(const [value,label] of platforms){const option=document.createElement('option');option.value=value;option.textContent=label;select.append(option)}
  const date=document.createElement('input');date.type='date';date.className='module-input';
  date.required=true;date.value=localStorage.getItem('biglwaCalendarSelected')||new Date().toISOString().slice(0,10);
  const title=document.createElement('input');title.className='module-input';title.placeholder='Title of the post or memory';title.required=true;title.maxLength=120;
  const url=document.createElement('input');url.className='module-input';url.type='url';url.placeholder='Public post URL';url.required=true;url.maxLength=1600;
  const button=document.createElement('button');button.type='submit';button.className='module-action';button.textContent='Save dated link';
  const status=document.createElement('small');status.setAttribute('role','status');
  form.append(select,date,title,url,button,status);details.append(heading,form);shell.after(details);
  form.addEventListener('submit',e=>{
   e.preventDefault();
   let parsed;try{parsed=new URL(url.value.trim())}catch{status.textContent='Enter a valid public URL.';return}
   const domains={bereal:['bere.al','bereal.com'],vsco:['vsco.co','vsco.com'],
    substack:['substack.com'],instagram:['instagram.com'],tiktok:['tiktok.com'],
    x:['x.com','twitter.com'],tumblr:['tumblr.com'],pinterest:['pinterest.com']};
   const ok=(domains[select.value]||[]).some(h=>parsed.hostname===h||parsed.hostname.endsWith('.'+h));
   if(parsed.protocol!=='https:'||!ok||parsed.username||parsed.password||parsed.port){
    status.textContent='That public URL does not match the selected platform.';return;
   }
   const key='biglwaCalendarEvents';
   let saved=[];try{saved=JSON.parse(localStorage.getItem(key)||'[]')}catch{}
   if(!Array.isArray(saved))saved=[];
   if(saved.some(x=>x.date===date.value&&x.url===parsed.href)){status.textContent='Already saved for this date.';return}
   saved.push({title:title.value.trim().slice(0,120),date:date.value,time:'',
    meta:select.options[select.selectedIndex].text+' · '+parsed.href,source:select.value,url:parsed.href});
   try{localStorage.setItem(key,JSON.stringify(saved));status.textContent='Saved to this browser calendar.';
     window.openBIGLWAModule?.('calendar','',false);}
   catch{status.textContent='Calendar storage is unavailable.'}
  });
 }
 function renderSlides(){
  // Native slide editor may mount asynchronously; its own toolbar inserts Drive entry.
  const host=q('#lwaVisualSlides [data-drive-link]');
  if(host)host.href=linkFor('drive')||'https://drive.google.com/';
 }
 const apply=()=>{renderPlanets();renderAvatar();renderSubstack();renderCalendar();renderSlides()};
 window.addEventListener('biglwa:orbit-links-synced',apply);
 window.addEventListener('biglwa:identity-updated',apply);
 document.addEventListener('biglwa:module-open',apply);
 document.addEventListener('biglwa:visualz-render',apply);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();
