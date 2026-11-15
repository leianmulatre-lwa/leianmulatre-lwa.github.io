/* BIG LWA · College Radio in all 50 states and language-led World Radio
 * College listings are source-attributed directory entries, NOT guarantees
 * of a live stream. World rankings are Radio Browser click counts only.
 * Streams remain hosted by their originating stations.
 */
(()=>{'use strict';
if(window.BigLWARadioDirectory)return;
const COLLEGE_URL='/assets/radio/college-radio-50-states.json';
const API=['https://de1.api.radio-browser.info','https://nl1.api.radio-browser.info','https://at1.api.radio-browser.info'];
const COUNTRY_START=[
 ['HT','Haiti'],['DO','Dominican Republic'],['JM','Jamaica'],['CU','Cuba'],
 ['CA','Canada'],['MX','Mexico'],['BR','Brazil'],['CO','Colombia'],['AR','Argentina'],
 ['FR','France'],['GB','United Kingdom'],['ES','Spain'],['PT','Portugal'],['DE','Germany'],
 ['IT','Italy'],['GH','Ghana'],['NG','Nigeria'],['SN','Senegal'],['CI','Côte d’Ivoire'],
 ['KE','Kenya'],['ZA','South Africa'],['ET','Ethiopia'],['MA','Morocco'],['EG','Egypt'],
 ['IN','India'],['PK','Pakistan'],['BD','Bangladesh'],['LK','Sri Lanka'],['CN','China'],
 ['TW','Taiwan'],['JP','Japan'],['KR','South Korea'],['PH','Philippines'],['ID','Indonesia'],
 ['TR','Türkiye'],['UA','Ukraine'],['PL','Poland'],['AU','Australia'],['NZ','New Zealand']
];
const LANGUAGE_START=[
 ['','All languages'],['haitian creole','Kreyòl ayisyen / Haitian Creole'],
 ['english','English'],['spanish','Español / Spanish'],['french','Français / French'],
 ['portuguese','Português / Portuguese'],['arabic','العربية / Arabic'],
 ['yoruba','Yorùbá'],['igbo','Igbo'],['swahili','Kiswahili'],['akan','Akan / Twi'],
 ['wolof','Wolof'],['amharic','አማርኛ / Amharic'],['somali','Soomaali'],
 ['hindi','हिन्दी / Hindi'],['urdu','اردو / Urdu'],['bengali','বাংলা / Bangla'],
 ['tamil','தமிழ் / Tamil'],['mandarin','普通话 / Mandarin'],['chinese','中文 / Chinese'],
 ['japanese','日本語 / Japanese'],['korean','한국어 / Korean'],
 ['vietnamese','Tiếng Việt / Vietnamese'],['filipino','Filipino / Tagalog'],
 ['indonesian','Bahasa Indonesia'],['turkish','Türkçe'],['german','Deutsch'],
 ['italian','Italiano'],['russian','Русский'],['ukrainian','Українська']
];
const $=(s,root=document)=>root.querySelector(s);
const create=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=String(text);return e};
const text=(str,max=180)=>String(str??'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,max);
function safeLink(raw){
 try{
  const u=new URL(String(raw||''));const host=u.hostname.toLowerCase();
  if(u.protocol!=='https:'||u.username||u.password||!host||host==='localhost'||host.endsWith('.local')||host.endsWith('.internal')||host==='[::1]'||/^(\d{1,3}\.){3}\d{1,3}$/.test(host)||host.includes('%'))return '';
  return u.href;
 }catch{return ''}
}
function callsign(station){
 const words=String(station?.name||'').toUpperCase().match(/\b[A-Z]{3,5}\b/g)||[];
 return words.find(w=>/^[KW][A-Z]{2,4}$/.test(w))||'';
}
function verifiedStation(row,opts={}){
 if(!row||!row.stationuuid||row.lastcheckok!==1&&row.lastcheckok!==true)return null;
 const stream=safeLink(row.url_resolved||row.url);
 if(!stream||!['MP3','AAC','AAC+','OGG','OPUS','FLAC','HLS'].includes(String(row.codec||'MP3').toUpperCase()))return null;
 if(opts.country&&String(row.countrycode||'').toUpperCase()!==opts.country)return null;
 if(opts.name){
  const sign=callsign(opts);
  const hay=(' '+String(row.name||'').toUpperCase()+' ').replace(/[^A-Z0-9]+/g,' ');
  if(!sign||!new RegExp('(?:^| )'+sign+'(?: |$)').test(hay))return null;
 }
 return {
  id:text(row.stationuuid,80),title:text(row.name,130),country:text(row.country||'',90),
  countryCode:text(row.countrycode||'',2),state:text(row.state||'',80),
  language:text(row.language||'',90),tags:text(row.tags||'',140),
  homepage:safeLink(row.homepage),stream,
  votes:Math.max(0,Number(row.votes)||0),clicks:Math.max(0,Number(row.clickcount)||0),
  codec:text(row.codec||'',12)
 };
}
async function apiGet(path){
 let last=null;
 for(const host of API){
  const controller=new AbortController();
  const timeout=window.setTimeout(()=>controller.abort(),8000);
  try{
   const response=await fetch(host+path,{signal:controller.signal,headers:{Accept:'application/json'}});
   if(!response.ok)throw Error('Radio directory responded '+response.status);
   const body=await response.json();
   if(!Array.isArray(body))throw Error('Unexpected radio directory response');
   window.clearTimeout(timeout);
   return body;
  }catch(e){last=e;window.clearTimeout(timeout)}
 }
 throw last||Error('Radio directory not available');
}
async function collegeCatalog(){
 const r=await fetch(COLLEGE_URL,{headers:{Accept:'application/json'}});
 if(!r.ok)throw Error('US college directory failed to load');
 const data=await r.json();
 if(!data||!Array.isArray(data.stations)||new Set(data.stations.map(x=>x.stateCode)).size!==50)
  throw Error('College directory needs all 50 states');
 return data.stations;
}
function pickCollegeMatch(rows,station){
 const code=callsign(station),state=String(station.state||'').toLowerCase();
 const candidates=rows.map(row=>verifiedStation(row,{country:'US',name:station})).filter(Boolean);
 candidates.sort((a,b)=>{
  const score=r=>Number(r.state.toLowerCase()===state)*10+Math.log1p(r.votes)+Math.log1p(r.clicks)*.4;
  return score(b)-score(a);
 });
 // The station call letters and country must both match. State metadata can be
 // absent in the public directory, but never accept an explicit wrong state.
 return candidates.find(x=>!x.state||x.state.toLowerCase()===state)||null;
}
async function findCollegeStream(station){
 const call=callsign(station);
 if(!call)return null;
 const params=new URLSearchParams({name:call,countrycode:'US',hidebroken:'true',order:'votes',reverse:'true',limit:'50'});
 const rows=await apiGet('/json/stations/search?'+params);
 return pickCollegeMatch(rows,station);
}
const mounts=new WeakMap();
function mount(root,options={}){
 const target=$('#streamSectionDetail',root);
 if(!target||!$('#streamStations',target))return false;
 let section=$('#biglwaRadioDiscovery',target);
 if(section)return true;
 section=create('section','biglwa-radio-discovery');section.id='biglwaRadioDiscovery';
 section.innerHTML='<header class="biglwa-radio-discovery-head"><span class="stream-eyebrow">LWA RADIO / EXPLORER</span><h3>college &amp; world radio</h3><p>Discover one campus station per U.S. state, then travel through countries and languages. Streams belong to their broadcasters.</p></header>'+
 '<div class="biglwa-radio-switch" role="tablist" aria-label="Radio directories">'+
 '<button type="button" data-radio-directory-tab="usa" role="tab" aria-selected="true">United States · 50 states</button>'+
 '<button type="button" data-radio-directory-tab="world" role="tab" aria-selected="false">World radio · language</button></div>'+
 '<section class="biglwa-radio-state-area" data-radio-usa role="tabpanel" aria-label="United States college radio">'+
 '<div class="biglwa-radio-filters"><label>State<select data-radio-state><option value="">All 50 states</option></select></label>'+
 '<label>Find a college station<input data-radio-state-search type="search" placeholder="School, station or state"></label></div>'+
 '<p class="biglwa-radio-summary" data-radio-us-status role="status">Loading the college radio directory…</p>'+
 '<div class="biglwa-radio-cards" data-radio-state-list></div></section>'+
 '<section class="biglwa-radio-world-area" data-radio-world role="tabpanel" aria-label="Radio by country and language" hidden>'+
 '<div class="biglwa-radio-filters"><label>Country<select data-radio-country></select></label>'+
 '<label>Broadcast language<select data-radio-language></select></label>'+
 '<button type="button" data-radio-world-search>Discover stations</button></div>'+
 '<p class="biglwa-radio-summary" data-radio-world-status role="status">Choose a country and language. Popular means most-played within Radio Browser, not a global audience ranking.</p>'+
 '<div class="biglwa-radio-cards" data-radio-world-list></div>'+
 '<p class="biglwa-radio-credit">Station data: <a href="https://www.radio-browser.info/" target="_blank" rel="noopener noreferrer">Radio Browser</a>, a community-maintained directory. Your search contacts its public API; catalog entries and stream availability may change.</p></section>';
 target.append(section);
 const record={root,section,play:typeof options.play==='function'?options.play:null,us:[],req:0,worldOptionsRequested:false};
 mounts.set(section,record);
 section.addEventListener('click',event=>onClick(event,record));
 section.addEventListener('input',event=>{if(event.target.matches('[data-radio-state-search]'))renderUSA(record)});
 section.addEventListener('change',event=>{
  if(event.target.matches('[data-radio-state]'))renderUSA(record);
  if(event.target.matches('[data-radio-country],[data-radio-language]')){const el=$('[data-radio-world-status]',section);el.textContent='Selections changed. Choose Discover stations for current results.';}
 });
 setupWorldSelectors(record);
 collegeCatalog().then(rows=>{
  if(!section.isConnected)return;
  record.us=rows.slice().sort((a,b)=>a.state.localeCompare(b.state));
  const select=$('[data-radio-state]',section);
  for(const row of record.us){const option=create('option','',row.state);option.value=row.stateCode;select.append(option)}
  renderUSA(record);
 }).catch(error=>{$('[data-radio-us-status]',section).textContent='The U.S. college directory is currently unavailable. '+text(error.message,90)});
 return true;
}
function setupWorldSelectors(record){
 const country=$('[data-radio-country]',record.section),lang=$('[data-radio-language]',record.section);
 for(const [code,label] of COUNTRY_START){const o=create('option','',label);o.value=code;country.append(o)}
 for(const [code,label] of LANGUAGE_START){const o=create('option','',label);o.value=code;lang.append(o)}
 // Do not silently trigger loads or track listeners; refresh options once
 // when the member actively enters World Radio.
}
async function enrichWorldSelectors(record){
 if(record.worldOptionsRequested)return;
 record.worldOptionsRequested=true;
 const country=$('[data-radio-country]',record.section),lang=$('[data-radio-language]',record.section);
 const result=await Promise.allSettled([
  apiGet('/json/countrycodes?order=stationcount&reverse=true'),
  apiGet('/json/languages?order=stationcount&reverse=true')
 ]);
 if(!record.section.isConnected)return;
 if(result[0].status==='fulfilled'){
  const seen=new Set([...country.options].map(o=>o.value));
  for(const row of result[0].value){
   const code=String(row.iso_3166_1||'').toUpperCase();
   if(!/^[A-Z]{2}$/.test(code)||seen.has(code))continue;
   const option=create('option','',text(row.name||code,70));
   option.value=code;country.append(option);seen.add(code);
  }
 }
 if(result[1].status==='fulfilled'){
  const seen=new Set([...lang.options].map(o=>o.value));
  for(const row of result[1].value.slice(0,500)){
   const name=text(row.name,50).toLowerCase();
   if(!name||seen.has(name)||!/^[\p{L}\s'-]+$/u.test(name))continue;
   const option=create('option','',name);option.value=name;lang.append(option);seen.add(name);
  }
 }
}
function renderUSA(record){
 const section=record.section,select=$('[data-radio-state]',section);
 const state=select.value,search=$('[data-radio-state-search]',section).value.toLowerCase().trim();
 const rows=record.us.filter(row=>(!state||row.stateCode===state)&&(!search||[row.name,row.school,row.state,row.stateCode].join(' ').toLowerCase().includes(search)));
 const holder=$('[data-radio-state-list]',section);holder.replaceChildren();
 for(const station of rows){
  const card=create('article','biglwa-radio-card');
  card.append(create('small','radio-state-tag',station.state+' · '+station.stateCode),
    create('strong','',station.name),create('p','',station.school));
  const buttons=create('div','biglwa-radio-actions');
  const listen=create('button','','Find live stream');listen.type='button';listen.dataset.radioFind=station.stateCode;
  const link=create('a','','Official station ↗');link.href=safeLink(station.homepage)||'#';link.target='_blank';link.rel='noopener noreferrer';
  buttons.append(listen,link);card.append(buttons);
  holder.append(card);
 }
 $('[data-radio-us-status]',section).textContent=record.us.length?
  record.us.length+' states represented · '+rows.length+' station'+(rows.length===1?'':'s')+' shown. Official station listing does not mean an in-app stream is verified.':
  'Loading state listings…';
}
async function findAndPlay(record,button){
 const stateCode=button.dataset.radioFind,station=record.us.find(row=>row.stateCode===stateCode);
 if(!station)return;
 button.disabled=true;button.textContent='Checking stream…';
 try{
  const found=await findCollegeStream(station);
  if(!button.isConnected)return;
  if(!found){button.textContent='Live source unverified';button.title='Visit the official college station link';return}
  if(!record.play){button.textContent='Player unavailable';return}
  record.play({title:station.name,creator:station.school,subtitle:station.state,source:'College Radio · '+station.state,
    category:'podcast',provider:'radio',type:'radio station',audioUrl:found.stream,url:station.homepage});
  button.textContent='▶ Tuned in · try again';
 }catch(error){if(button.isConnected){button.textContent='Stream lookup unavailable';button.title=text(error.message,120)}}
 finally{if(button.isConnected)button.disabled=false}
}
async function discoverWorld(record){
 const section=record.section,code=$('[data-radio-country]',section).value,language=$('[data-radio-language]',section).value;
 const status=$('[data-radio-world-status]',section),holder=$('[data-radio-world-list]',section);
 if(!/^[A-Z]{2}$/.test(code)){status.textContent='Select a country first.';return}
 holder.replaceChildren();status.textContent='Finding stations that the directory recently checked…';
 const current=++record.req;
 const params=new URLSearchParams({countrycode:code,hidebroken:'true',order:'clickcount',reverse:'true',limit:'100'});
 if(language)params.set('language',language);
 try{
  const stations=await apiGet('/json/stations/search?'+params);
  if(current!==record.req||!section.isConnected)return;
  const unique=new Set(),valid=[];
  for(const row of stations){
   const s=verifiedStation(row,{country:code});
   if(!s||unique.has(s.id))continue;
   if(language&&!s.language.toLowerCase().split(',').map(x=>x.trim()).some(x=>x.includes(language)))continue;
   unique.add(s.id);valid.push(s);
   if(valid.length>=24)break;
  }
  if(!valid.length){
   status.textContent='No currently verified HTTPS streams matched this country and language. Try All languages or another country.';
   return;
  }
  status.textContent=valid.length+' stations · ranked by Radio Browser click counts (directory activity, not national ratings).';
  valid.forEach((s,index)=>{
   const card=create('article','biglwa-radio-card');
   card.append(create('small','radio-state-tag',(index+1)+'. '+(s.country||code)+' · '+(s.language||'Language not listed')),
    create('strong','',s.title),create('p','',(s.tags||s.codec||'Community-listed station')));
   const meta=create('small','radio-directory-count',s.clicks.toLocaleString()+' directory clicks · stream last reported healthy');
   const actions=create('div','biglwa-radio-actions');
   const play=create('button','','▶ Listen here');play.type='button';play.dataset.radioWorldPlay=s.id;
   actions.append(play);
   if(s.homepage){const a=create('a','','Station website ↗');a.href=s.homepage;a.target='_blank';a.rel='noopener noreferrer';actions.append(a)}
   card.append(meta,actions);holder.append(card);
  });
  record.world=valid;
 }catch(error){
  if(current===record.req&&section.isConnected)status.textContent='World Radio lookup unavailable. Please retry. '+text(error.message,90);
 }
}
function onClick(event,record){
 const button=event.target.closest('button');
 if(!button||!record.section.contains(button))return;
 if(button.dataset.radioDirectoryTab){
  const world=button.dataset.radioDirectoryTab==='world';
  $('[data-radio-usa]',record.section).hidden=world;
  $('[data-radio-world]',record.section).hidden=!world;
  record.section.querySelectorAll('[data-radio-directory-tab]').forEach(el=>el.setAttribute('aria-selected',String(el===button)));
  record.section.querySelectorAll('[data-radio-directory-tab]').forEach(el=>el.classList.toggle('is-active',el===button));
  if(world)enrichWorldSelectors(record).catch(()=>{});
  return;
 }
 if(button.dataset.radioFind){findAndPlay(record,button);return}
 if(button.hasAttribute('data-radio-world-search')){discoverWorld(record);return}
 if(button.dataset.radioWorldPlay){
  const item=(record.world||[]).find(x=>x.id===button.dataset.radioWorldPlay);
  if(!item||!record.play)return;
  record.play({title:item.title,creator:item.country||'World Radio',
   subtitle:item.language,source:'World Radio · directory-listed',category:'podcast',
   provider:'radio',type:'radio station',audioUrl:item.stream,url:item.homepage||item.stream});
 }
}
window.BigLWARadioDirectory={mount,safeLink,callsign,verifiedStation,pickCollegeMatch,findCollegeStream,discoverWorld,
 get count(){return COUNTRY_START.length},get statesUrl(){return COLLEGE_URL}};
})();