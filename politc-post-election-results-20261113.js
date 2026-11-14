/* BIG LWA Politic · post-election studio, public election results & county geography.
   No voter rolls, addresses, personal vote records or guessed party/precinct maps. */
(()=>{'use strict';
 const ELECTION_END=new Date('2026-11-04T00:00:00-08:00').getTime();
 const OFFICIAL_LA='https://results.lavote.gov/electionresults/json?electionid=4348';
 const OFFICIAL_CA='https://electionresults.sos.ca.gov/returns/governor';
 const OFFICIAL_MAP='https://electionresults.sos.ca.gov/maps/';
 const BOUNDARIES='https://raw.githubusercontent.com/plotly/datasets/master/geojson-counties-fips.json';
 // A clearly dated copy of published LA County returns for fallback ONLY.
 // Never describe these as current, certified, or statewide.
 const SNAPSHOT={Timestamp:'2026-11-10T17:01:24.383',Election:{
  ContestGroups:[
   {Name:'Governor',Contests:[{Title:'GOVERNOR',Type:'Candidate',AdditionalText:'Los Angeles County Results Only',Candidates:[
    {Name:'XAVIER BECERRA',Party:'Democratic',Votes:2257836},
    {Name:'STEVE HILTON',Party:'Republican',Votes:823543}]}]},
   {Name:'Attorney General',Contests:[{Title:'ATTORNEY GENERAL',Type:'Candidate',AdditionalText:'Los Angeles County Results Only',Candidates:[
    {Name:'ROB BONTA',Party:'Democratic',Votes:2212982},
    {Name:'MICHAEL E. GATES',Party:'Republican',Votes:798564}]}]}
 ]}};
 const tag=(name,className,txt)=>{
  const el=document.createElement(name);
  if(className)el.className=className;
  if(txt!==undefined)el.textContent=String(txt);
  return el;
 };
 const link=(url,label)=>{
  const a=tag('a','politc-results-source',label+' ↗');a.href=url;a.target='_blank';
  a.rel='noopener noreferrer';return a;
 };
 const stamp=iso=>{
  try{const value=new Date(iso);if(!Number.isFinite(value.getTime()))return 'Time unavailable';
   return new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit',timeZone:'America/Los_Angeles',timeZoneName:'short'}).format(value);
  }catch{return 'Time unavailable';}
 };
 const fetchJSON=async(url,ms=10500)=>{
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),ms);
  try{
   const res=await fetch(url,{signal:controller.signal,cache:'no-store',headers:{Accept:'application/json'}});
   if(!res.ok)throw Error('HTTP '+res.status);
   return await res.json();
  }finally{clearTimeout(timer);}
 };
 const sourceContests=data=>{
  const groups=data?.Election?.ContestGroups||[];
  if(!Array.isArray(groups))return [];
  return groups.flatMap(group=>(Array.isArray(group.Contests)?group.Contests:[])
   .map(contest=>({group:String(group.Name||'Other').slice(0,85),
     title:String(contest.Title||'Untitled').slice(0,140),
     scope:String(contest.AdditionalText||'').slice(0,130),
     type:String(contest.Type||''),
     candidates:(Array.isArray(contest.Candidates)?contest.Candidates:[])
       .filter(c=>Number.isFinite(c.Votes)&&c.Votes>=0)
       .slice(0,28).map(c=>({name:String(c.Name||'').slice(0,100),
         party:String(c.Party||'').slice(0,50),votes:Math.floor(c.Votes)}))
   })).filter(row=>row.candidates.length);
 };
 function compactElection(body){
  const zone=body.querySelector('.politc-election-zone');
  if(!zone||zone.querySelector('.politc-post-election-details'))return;
  if(Date.now()<ELECTION_END)return;
  const details=tag('details','politc-post-election-details');
  const sum=tag('summary','politc-post-election-summary');
  const lead=tag('span','politc-post-election-lead');
  lead.append(tag('span','politc-post-election-kicker','ELECTION DESK · UNITED STATES'),
   tag('strong','','November 3, 2026 · General Election'),
   tag('small','','Election Day passed · count and certification may continue'));
  sum.append(lead,tag('span','politc-post-election-expand','View ballot tools & nominees ▾'));
  details.append(sum);
  const content=tag('div','politc-post-election-content');
  // Existing controls remain in DOM, with their original listeners and IDs.
  while(zone.firstChild)content.append(zone.firstChild);
  details.append(content);zone.append(details);
  zone.classList.add('politc-election-is-past');
  zone.removeAttribute('style');
  zone.setAttribute('aria-label','2026 election desk · compact completed-election mode');
 }
 function makeResults(body){
  const board=body.querySelector('.politc-board');
  const live=board?.querySelector('.politc-live-zone');
  if(!board||!live||board.querySelector('#politcElectionResultExplorer'))return;
  const section=tag('section','politc-result-explorer');
  section.id='politcElectionResultExplorer';
  const details=tag('details','politc-result-details');
  const summary=tag('summary','politc-result-summary');
  const label=tag('span','politc-result-summary-label');
  label.append(tag('span','politc-result-kicker','2026 · RESULTS & COUNTY MAP'),
   tag('strong','','See election returns & voter-map data'),
   tag('small','','Los Angeles County reporting · California county geography · source linked'));
  summary.append(label,tag('span','politc-result-open','Explore the results & map ▾'));
  const panel=tag('div','politc-result-panel');
  const sourceNote=tag('p','politc-result-note',
   'Unofficial returns change while votes are counted. These LA County totals are not statewide totals, and a county outline is not a map of how anyone voted.');
  const controls=tag('div','politc-result-tabs');
  const resultsButton=tag('button','is-active','Election results');resultsButton.type='button';
  const mapButton=tag('button','','California counties');mapButton.type='button';
  controls.append(resultsButton,mapButton);
  const results=tag('div','politc-result-feed');
  results.setAttribute('aria-label','Los Angeles County election results');
  const mapHolder=tag('div','politc-county-map-wrap');mapHolder.hidden=true;
  const foot=tag('div','politc-result-footer');
  foot.append(link('https://www.sos.ca.gov/elections/upcoming-elections/general-election-november-3-2026','CA canvass and certification timeline'),
   link(OFFICIAL_CA,'California statewide results'),
   link('https://www.lavote.gov/home/voting-elections/current-elections/election-results/live-results','LA County reporting'),
   link(OFFICIAL_MAP,'Official CA election maps'));
  panel.append(sourceNote,controls,results,mapHolder,foot);
  details.append(summary,panel);section.append(details);
  board.insertBefore(section,live);
  // Reading Room belongs directly AFTER the existing live trackers.
  const reader=body.querySelector('#politcResearchDesk');
  if(reader){live.insertAdjacentElement('afterend',reader);reader.classList.add('politc-after-live');}
  const status=tag('p','politc-result-status','LA County · Nov 3, 2026 general election');
  status.setAttribute('role','status');results.append(status);
  let current=SNAPSHOT,liveLoaded=false,loader=null;
  const sorted=()=>sourceContests(current);
  const count=n=>Number(n||0).toLocaleString('en-US');
  function drawResults(){
   const items=sorted();
   results.replaceChildren();
   const top=tag('div','politc-result-head');
   top.append(tag('h3','','Los Angeles County · 2026 returns'),
    tag('p','politc-result-status', (liveLoaded?'Official county feed · ':'Dated fallback · ')+stamp(current.Timestamp)+
      (liveLoaded?' · subject to canvass':' · NOT current · refresh attempted on open')));
   results.append(top);
   const field=tag('label','politc-result-filter-label','Find a race');
   const search=tag('input','politc-result-filter');
   search.type='search';search.placeholder='Governor, U.S. Representative, measure…';
   search.maxLength=100;field.append(search);results.append(field);
   const grid=tag('div','politc-result-race-grid');results.append(grid);
   const render=()=>{
    grid.replaceChildren();
    const q=search.value.trim().toLocaleLowerCase();
    const filtered=items.filter(item=>!q||(item.title+' '+item.group+' '+item.candidates.map(x=>x.name).join(' ')).toLowerCase().includes(q)).slice(0,24);
    if(!filtered.length){grid.append(tag('p','politc-result-status','No matching contests in this dataset. Check the original county feed for more.'));return;}
    filtered.forEach(item=>{
     const card=tag('article','politc-result-race');
     card.append(tag('small','',item.group),tag('h4','',item.title));
     const total=item.candidates.reduce((n,c)=>n+c.votes,0);
     const ranked=[...item.candidates].sort((a,b)=>b.votes-a.votes);
     ranked.slice(0,6).forEach(c=>{
      const row=tag('div','politc-result-vote');
      const title=tag('span','',c.name+(c.party?' · '+c.party:''));
      const n=tag('b','',count(c.votes));
      const bar=tag('span','politc-result-vote-bar');
      const fraction=total>0?100*c.votes/total:0;
      const fill=tag('i');fill.style.width=Math.max(0,Math.min(100,fraction))+'%';
      bar.append(fill);row.append(title,n,bar);card.append(row);
     });
     card.append(tag('p','politc-result-scope',item.scope||'Los Angeles County contest returns; verify complete district totals where applicable.'));
     grid.append(card);
    });
   };
   search.addEventListener('input',render);render();
   const source=tag('p','politc-result-source-line');
   source.append('Source: Los Angeles County RR/CC JSON · ',
    link(OFFICIAL_LA,'Download original returns'),
    ' · Returns are not a race call, certification, voter record, or statewide total.');
   results.append(source);
  }
  async function updateResults(){
   if(loader)return loader;
   loader=(async()=>{
    try{
     const data=await fetchJSON(OFFICIAL_LA);
     if(!data?.Election?.ContestGroups||!Number.isFinite(Date.parse(data.Timestamp)))throw Error('Unexpected results format');
     current=data;liveLoaded=true;
    }catch(error){
     current=SNAPSHOT;liveLoaded=false;
    }finally{drawResults();loader=null;}
   })();return loader;
  }
  function setTab(which){
   const showMap=which==='map';
   results.hidden=showMap;mapHolder.hidden=!showMap;
   mapButton.classList.toggle('is-active',showMap);
   resultsButton.classList.toggle('is-active',!showMap);
   if(showMap)loadCountyMap();
  }
  resultsButton.addEventListener('click',()=>setTab('results'));
  mapButton.addEventListener('click',()=>setTab('map'));
  drawResults();
  details.addEventListener('toggle',()=>{if(details.open)updateResults();});
  let mapLoaded=false;
  function loadCountyMap(){
   if(mapLoaded)return;mapLoaded=true;
   const text=tag('p','politc-result-status','Loading California county boundaries…');
   mapHolder.append(text);
   fetchJSON(BOUNDARIES,15000).then(data=>{
    const features=(Array.isArray(data?.features)?data.features:[])
     .filter(f=>/^06\d{3}$/.test(String(f?.id||''))&&f.geometry);
    if(features.length<55)throw Error('California county data unavailable.');
    mapHolder.replaceChildren();
    const title=tag('div','politc-county-map-heading');
    title.append(tag('h3','','California county explorer'),
     tag('p','','County outlines are geographic boundaries only—not precinct data, vote shares, or a map of individual voters.'));
    const chooser=tag('label','politc-result-filter-label','Find county');
    const select=tag('select','politc-result-filter');
    const sortedFeatures=[...features].sort((a,b)=>String(a.properties?.name||'').localeCompare(String(b.properties?.name||'')));
    sortedFeatures.forEach(feature=>{
     const opt=tag('option','',String(feature.properties?.name||feature.id)+' County');
     opt.value=String(feature.id);select.append(opt);
    });
    chooser.append(select);
    const frame=tag('div','politc-county-map-grid');
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 560 630');svg.setAttribute('role','group');
    svg.setAttribute('aria-label','Interactive California county boundary map');
    svg.classList.add('politc-county-svg');
    const detail=tag('div','politc-county-detail');
    const bounds={west:-125,east:-113.8,north:42.7,south:32};
    const proj=point=>{
     const lon=Number(point?.[0]),lat=Number(point?.[1]);
     if(!Number.isFinite(lon)||!Number.isFinite(lat))return null;
     return [40+(lon-bounds.west)/(bounds.east-bounds.west)*480,
      15+(bounds.north-lat)/(bounds.north-bounds.south)*590];
    };
    const rings=feature=>{
     const geom=feature.geometry;
     if(geom.type==='Polygon')return geom.coordinates;
     if(geom.type==='MultiPolygon')return geom.coordinates.flatMap(poly=>poly);
     return [];
    };
    function outline(feature){
     let result='';
     for(const ring of rings(feature)){
      if(!Array.isArray(ring)||ring.length<3)continue;
      const pts=ring.map(proj).filter(Boolean);
      if(pts.length<3)continue;
      result+='M'+pts.map(([x,y])=>x.toFixed(1)+' '+y.toFixed(1)).join('L')+'Z';
     }
     return result;
    }
    let selected='06037';
    const shapes=new Map();
    function choose(fips){
     selected=String(fips||'06037');select.value=selected;
     for(const [code,el] of shapes)el.classList.toggle('is-selected',code===selected);
     const county=features.find(feature=>String(feature.id)===selected);
     const name=String(county?.properties?.name||'Unknown')+' County';
     detail.replaceChildren(tag('h4','',name),
      tag('p','','County shapes are not an election statistic. For live district and precinct details, use each election office’s reporting portal.'));
     if(selected==='06037'){
      detail.append(tag('p','','LA County results are available in the Election results tab above.'),
       link(OFFICIAL_LA,'LA County official results JSON'),
       link('https://results.lavote.gov/','LA County election returns'));
     }else{
      detail.append(tag('p','','Only LA County has an integrated contest feed in this pilot. Other counties are shown geographically, not with guessed vote totals.'),
       link(OFFICIAL_CA,'Statewide and county returns'),
       link('https://www.sos.ca.gov/elections/voting-resources/county-elections-offices','Find county election office'));
     }
    }
    for(const feature of features){
     const path=document.createElementNS('http://www.w3.org/2000/svg','path');
     path.setAttribute('d',outline(feature));
     path.setAttribute('data-fips',String(feature.id));
     path.setAttribute('tabindex','0');path.setAttribute('role','button');
     path.setAttribute('aria-label',String(feature.properties?.name||feature.id)+' County');
     const titleEl=document.createElementNS('http://www.w3.org/2000/svg','title');
     titleEl.textContent=String(feature.properties?.name||feature.id)+' County';
     path.append(titleEl);
     path.addEventListener('click',()=>choose(feature.id));
     path.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(feature.id);}});
     shapes.set(String(feature.id),path);svg.append(path);
    }
    select.addEventListener('change',()=>choose(select.value));
    frame.append(svg,detail);mapHolder.append(title,chooser,frame);
    choose('06037');
    const source=tag('p','politc-result-source-line');
    source.append('County boundaries: public Plotly US county GeoJSON. ',
     link(BOUNDARIES,'Geometry source'),'. See official California election maps for verified thematic vote data.');
    mapHolder.append(source);
   }).catch(()=>{
    text.textContent='County geometry is temporarily unavailable. No map values are fabricated.';
    mapHolder.append(link(OFFICIAL_MAP,'View official California election maps'));
   });
  }
 }
 function mount(){
  const body=document.querySelector('#moduleWorkspace[data-module-key="politc"] #moduleWorkspaceBody');
  if(!body)return;
  compactElection(body);makeResults(body);
 }
 window.BigLWAPolitcPostElection={mount,sourceContests,snapshot:SNAPSHOT};
 document.addEventListener('biglwa:module-open',ev=>{if(ev.detail?.key==='politc')mount()});
})();