/* BIG LWA · Politic research desk.
   Real in-place Wikimedia discovery and source-index navigation.
   WikiLeaks provides a directory, NOT an invented public CORS document API.
   Never inject third-party HTML into Studio. */
(() => {
 'use strict';
 const SOURCES=Object.freeze({
  wikipedia:{label:'Wikipedia',host:'en.wikipedia.org',description:'Community-edited encyclopedia; cross-check contested claims.'},
  wikisource:{label:'Wikisource',host:'en.wikisource.org',description:'Freely available original texts and historical documents.'},
  wikinews:{label:'Wikinews',host:'en.wikinews.org',description:'Community-authored news archive, not a live official wire.'}
 });
 const LEAKS=[
  {name:'WikiLeaks archive search',description:'Official advanced search and collection filters.',url:'https://wikileaks.org/search/advanced'},
  {name:'Diplomatic cables',description:'Published diplomatic correspondence; context and authenticity vary.',url:'https://wikileaks.org/plusd/'},
  {name:'Guantánamo Files',description:'Historic detention-related records; allegations need independent corroboration.',url:'https://wikileaks.org/gitmo/'},
  {name:'WikiLeaks publications',description:'Catalog of published collections, not an endorsement of claims.',url:'https://wikileaks.org/'}
 ];
 const OFFICIAL=[
  {name:'U.S. National Archives',description:'Federal records and archival catalogs',url:'https://www.archives.gov/research'},
  {name:'Congress.gov',description:'Bill text, sponsors, actions, and legislative records',url:'https://www.congress.gov/'},
  {name:'GovInfo',description:'Official federal publications and documents',url:'https://www.govinfo.gov/'},
  {name:'UN Digital Library',description:'UN documents, reports and voting records',url:'https://digitallibrary.un.org/'}
 ];
 const make=(tag,className,content)=>{
  const e=document.createElement(tag);
  if(className)e.className=className;
  if(content!==undefined)e.textContent=String(content);return e;
 };
 const sourceUrl=(host,title)=>'https://'+host+'/wiki/'+encodeURIComponent(String(title).replaceAll(' ','_'));
 const api=(host,params)=>{
  const u=new URL('https://'+host+'/w/api.php');
  Object.entries({action:'query',format:'json',origin:'*',...params}).forEach(([k,v])=>u.searchParams.set(k,String(v)));
  return u.href;
 };
 const getJSON=async(url,timeout=9500)=>{
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);
  try{
   const response=await fetch(url,{signal:controller.signal,headers:{Accept:'application/json'}});
   if(!response.ok)throw Error('Source returned HTTP '+response.status);
   return await response.json();
  }finally{clearTimeout(timer);}
 };
 const stripMarkup=raw=>{
  const holder=document.createElement('div');
  holder.innerHTML=String(raw||'').slice(0,3000);
  return String(holder.textContent||'').replace(/\s+/g,' ').trim().slice(0,390);
 };
 function sourceLink(title,url){
  const a=make('a','politc-research-link',title+' ↗');a.href=url;a.target='_blank';
  a.rel='noopener noreferrer';return a;
 }
 let generation=0;
 function mount(){
  const container=document.querySelector('#moduleWorkspace[data-module-key="politc"] #moduleWorkspaceBody');
  if(!container||container.querySelector('#politcResearchDesk'))return;
  const desk=make('section','politc-research-desk');
  desk.id='politcResearchDesk';
  desk.setAttribute('aria-label','Politic research desk');
  const intro=make('div','politc-research-head');
  intro.append(make('div','politc-research-kicker','POLITIC · OPEN ARCHIVES'),
   make('h2','', 'The Reading Room'),
   make('p','','Search, examine, and compare source material without leaving BIG LWA. Claims are not facts merely because they appear in an archive.'));
  const form=make('form','politc-research-form');
  const label=make('label','', 'Search the record');
  const input=make('input');input.type='search';input.name='q';input.maxLength=150;
  input.required=true;input.autocomplete='off';input.placeholder='A policy, person, movement, law, historical event…';
  label.append(input);
  const picker=make('label','', 'Collection');
  const select=make('select');select.name='provider';
  [
   ['wikipedia','Encyclopedia · Wikipedia'],
   ['wikisource','Primary texts · Wikisource'],
   ['wikinews','News archive · Wikinews'],
   ['wikileaks','Leaked archives · WikiLeaks index'],
   ['official','Official source directory']
  ].forEach(([value,labelText])=>{const o=make('option','',labelText);o.value=value;select.append(o);});
  picker.append(select);
  const submit=make('button','politc-research-search','Research here');submit.type='submit';
  form.append(label,picker,submit);
  const state=make('p','politc-research-status','Use Wikipedia or Wikisource to read source excerpts here. Other archives have clearly labeled source links.');
  state.setAttribute('role','status');
  const results=make('div','politc-research-results');
  results.id='politcResearchResults';
  const viewer=make('article','politc-research-reader');
  viewer.hidden=true;viewer.setAttribute('aria-label','Selected source reader');
  desk.append(intro,form,state,results,viewer);
  const first=container.querySelector('.politc-board');
  if(first)container.insertBefore(desk,first);
  else container.insertBefore(desk,container.firstChild?.nextSibling||null);
  const display=(message)=>{state.textContent=message;};
  const resetReader=()=>{viewer.replaceChildren();viewer.hidden=true;};
  const cards=(rows,host)=>{
   results.replaceChildren();
   const list=make('div','politc-research-list');
   rows.forEach((entry,index)=>{
    const article=make('article','politc-research-item');
    const title=make('h3','',entry.title||'Untitled');
    const excerpt=make('p','',stripMarkup(entry.snippet));
    const actions=make('div','politc-research-actions');
    const read=make('button','', 'Read excerpt');read.type='button';
    read.addEventListener('click',()=>readRecord(host,entry.title,index));
    actions.append(read,sourceLink('Original '+SOURCES[select.value]?.label,sourceUrl(host,entry.title)));
    article.append(title,excerpt,actions);list.append(article);
   });
   results.append(list);
  };
  async function readRecord(host,title){
   const localGen=++generation;
   resetReader();viewer.hidden=false;
   viewer.append(make('p','','Reading source…'));
   display('Loading a source excerpt with attribution…');
   try{
    const data=await getJSON(api(host,{
     prop:'extracts|info',inprop:'url',explaintext:1,exchars:3800,
     titles:title,redirects:1
    }));
    if(localGen!==generation)return;
    const item=Object.values(data?.query?.pages||{})[0];
    const extract=String(item?.extract||'').trim().slice(0,3800);
    viewer.replaceChildren();
    viewer.append(make('span','politc-research-kicker',SOURCES[select.value]?.label+' · community-maintained source'),
     make('h3','',String(item?.title||title)),
     make('p','politc-research-excerpt',extract||'An extract is unavailable in this collection. Use Original source to inspect this record.'));
    const link=sourceLink('Original article, history, editors and licensing',
     sourceUrl(host,item?.title||title));
    viewer.append(link,make('p','politc-research-license',
     'Source: Wikimedia community contributors. Excerpt may be edited or shortened; the original page lists authors, revisions and reuse conditions.'));
    display('Source excerpt loaded. Compare with primary records where claims are contested.');
    viewer.scrollIntoView({behavior:'smooth',block:'nearest'});
   }catch(error){
    if(localGen!==generation)return;
    viewer.replaceChildren(make('p','', 'Could not retrieve an in-page excerpt. You can still open the attributed original.'));
    viewer.append(sourceLink('Open original source',sourceUrl(host,title)));
    display('Reader unavailable; search results remain accessible.');
   }
  }
  async function wikiSearch(kind,q){
   const localGen=++generation,source=SOURCES[kind];
   resetReader();results.replaceChildren();
   display('Searching '+source.label+'…');submit.disabled=true;
   try{
    const data=await getJSON(api(source.host,{list:'search',srsearch:q,
     srnamespace:0,srlimit:8,srprop:'snippet|timestamp'}));
    if(localGen!==generation)return;
    const items=Array.isArray(data?.query?.search)?data.query.search:[];
    cards(items,source.host);
    display(items.length?items.length+' '+source.label+' results · select Read excerpt to stay on BIG LWA.':
     'No results in '+source.label+'. Try different search terms.');
   }catch(error){
    if(localGen!==generation)return;
    display(source.label+' could not be reached. Search is not cached or fabricated.');
   }finally{submit.disabled=false;}
  }
  function directory(kind,q){
   ++generation;resetReader();results.replaceChildren();
   const pool=kind==='wikileaks'?LEAKS:OFFICIAL;
   const matches=pool.filter(x=>!q||[x.name,x.description].join(' ').toLowerCase().includes(q.toLowerCase()));
   const chosen=matches.length?matches:pool;
   const note=make('p','politc-research-note',kind==='wikileaks'?
    'WikiLeaks: browse collection names here. Full-text search remains on its original website; this is not an unverified copy or an iframe bypass.':
    'These verified institutions operate their own catalogs. Choose an official source for original records.');
   results.append(note);
   const list=make('div','politc-research-list');
   chosen.forEach(entry=>{
    const card=make('article','politc-research-item');
    card.append(make('h3','',entry.name),make('p','',entry.description),sourceLink('Open official collection',entry.url));
    list.append(card);
   });
   results.append(list);
   display(matches.length?matches.length+' matching collections in the directory.':
    'No exact match in the curated directory. Showing every available archive.');
  }
  form.addEventListener('submit',event=>{
   event.preventDefault();
   const kind=select.value,q=input.value.trim().slice(0,150);
   if(!q)return;
   if(kind in SOURCES)wikiSearch(kind,q);else directory(kind,q);
  });
  select.addEventListener('change',()=>{
   resetReader();results.replaceChildren();
   if(select.value==='wikileaks'||select.value==='official'){
    input.required=false;directory(select.value,input.value.trim());}
   else{input.required=true;display('Search '+SOURCES[select.value]?.label+' and read results directly in this panel.');}
  });
  // First tab always permits immediately opening a source after navigation.
  return desk;
 }
 window.BigLWAPolitcResearch={mount};
 document.addEventListener('biglwa:module-open',event=>{
  if(event.detail?.key==='politc')mount();
 });
})();