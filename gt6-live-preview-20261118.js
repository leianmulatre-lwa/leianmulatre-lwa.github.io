/* BIG LWA · GT6 live-preview guide feed renderer.
 * Reads the same first-party configured-topic scan produced by
 * scripts/refresh-discovery.py. Never invents live status, viewer counts or rank.
 */
(()=>{
 'use strict';
 const host=document.getElementById('gt6RecentSources');
 if(!host||window.__biglwaGt6FeedV1)return;
 window.__biglwaGt6FeedV1=true;
 const allowedSources=new Set(['markiplier','cory','jacksepticeye','dream','cupquake']);
 const safeUrl=value=>{
  try{
   const url=new URL(String(value||''));
   return url.protocol==='https:'&&['youtube.com','www.youtube.com','youtu.be','www.youtu.be'].includes(url.hostname)?url.href:'';
  }catch{return '';}
 };
 const date=value=>{
  const parsed=new Date(value);
  return Number.isNaN(parsed.getTime())?'Publisher date unavailable':
   parsed.toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'});
 };
 const empty=message=>{
  host.replaceChildren();
  const note=document.createElement('p');note.className='gt6-feed-note';note.textContent=message;
  host.append(note);
 };
 const render=(data)=>{
  const trend=(Array.isArray(data?.trends)?data.trends:[]).find(item=>item?.id==='gt6-live');
  const items=Array.isArray(trend?.items)?trend.items:[];
  const scanned=date(data?.generatedAt);
  if(!items.length){
   empty('No GT6-tagged items were seen in the configured source scan'+(scanned!=='Publisher date unavailable'?' on '+scanned:'')+'. Check the original broadcaster for current status.');
   return;
  }
  host.replaceChildren();
  const note=document.createElement('p');note.className='gt6-feed-note';
  note.textContent='Recently seen in configured sources · '+scanned+' · not a ranking, viewer count or live-status check.';
  host.append(note);
  const list=document.createElement('ul');list.className='gt6-feed-list';
  for(const item of items){
   if(!item||!allowedSources.has(String(item.sourceId||'')))continue;
   const url=safeUrl(item.url);
   if(!url)continue;
   const row=document.createElement('li');row.className='gt6-feed-item';row.dataset.sourceId=String(item.sourceId||'');
   const link=document.createElement('a');link.href=url;link.target='_blank';link.rel='noopener noreferrer';
   link.textContent=item.title||'Open original source';
   const byline=document.createElement('p');byline.className='gt6-feed-byline';
   byline.textContent=(item.source||'Configured source')+' · '+date(item.publishedAt);
   row.append(link,byline);list.append(row);
  }
  if(!list.children.length){
   empty('No GT6-tagged items were seen in the configured source scan. Check the original broadcaster for current status.');
   return;
  }
  host.append(list);
 };
 const load=async()=>{
  try{
   const response=await fetch('/assets/discovery/latest.json?topics=20261118-1',{cache:'no-store'});
   if(!response.ok)throw Error('Feed unavailable');
   render(await response.json());
  }catch{
   empty('The configured source scan is temporarily unavailable. Check the original broadcaster for current status.');
  }
 };
 load();
})();
