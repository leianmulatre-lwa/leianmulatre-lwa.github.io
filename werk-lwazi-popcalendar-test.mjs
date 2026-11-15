import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=path=>fs.readFileSync(new URL('./'+path,import.meta.url),'utf8');
const calendar=read('pop-culture-calendar-20261114.js');
const pages=read('module-pages.js');
const adapter=read('visual-life-jobs.js');
const lwazi=read('user-search-results.js');
const windowCode=read('werk-browser-window-20261114.js');
const werk=read('politc-werk-20261114.js');
const shells=['index.html','studio/index.html','404.html','live-studio-shell.html'];

test('This Day in Pop Culture article creates accurate, credited January 20 anniversaries',()=>{
 const scope={window:{}};vm.runInNewContext(calendar,scope,{timeout:1500});
 const pop=scope.window.BigLWAPopCultureCalendar;
 assert.equal(pop.onDay('2026-01-20').length,6);
 assert.equal(pop.onDay('2026-01-21').length,0);
 assert.equal(pop.onDay('2026-11-20').length,0);
 const records=pop.onDay('2027-01-20');
 assert(records.some(e=>e.year===1954&&/National Negro Network/.test(e.title)));
 assert(records.some(e=>e.year===1986&&/First federal Martin Luther King/.test(e.title)));
 assert(records.some(e=>e.year===2006&&/High School Musical/.test(e.title)));
 assert(records.every(e=>e.pop&&e.readOnly&&/^https:\/\/writerofpop\.com\//.test(e.url)));
 assert(records.every(e=>e.description.length<220),'Use short original descriptions, not copied article text');
 assert(records.every(e=>e.month===1&&e.day===20),'No shifting an anniversary to other dates');
});
test('Calendar uses read-only sourced pop culture records without writing to Google or local event storage',()=>{
 assert.match(pages,/const popRows=key=>window\.BigLWAPopCultureCalendar\?\.onDay\(key\)\|\|\[\]/);
 assert.match(pages,/,\.\.\.popRows\(key\)/);
 assert.match(pages,/,\.\.\.popRows\(selected\)/);
 assert.match(pages,/e\.pop\?'Pop · '/);
 assert.match(pages,/data-calendar-pop-history/);
 assert.match(pages,/Read original article/);
 assert.match(pages,/rel="noopener noreferrer"/);
 assert.doesNotMatch(calendar,/localStorage|sessionStorage|fetch\(/);
 assert.match(read('geez-calendar-mode-test.mjs'),/Ge’ez/,'Ge’ez mode stays installed');
});
test('L’wazi Jobs returns real catalog cards only after a verified published feed',async()=>{
 const window={addEventListener:()=>{}};
 const document={readyState:'loading',addEventListener:()=>{},querySelector:()=>null,documentElement:{}};
 class MutationObserver{observe(){}}
 const published={schema:1,status:'published',generated_at:new Date().toISOString(),sources:['greenhouse','indeed'],jobs:[
  {title:'Creative Producer',company:'The New York Times',location:'Los Angeles, CA',source:'greenhouse',url:'https://job-boards.greenhouse.io/thenewyorktimes/jobs/2',postedAt:'2026-11-14'},
  {title:'Research Analyst',company:'Agency',location:'New York, NY',source:'indeed',url:'https://indeed.com/viewjob?jk=4'},
  {title:'Casting Coordinator',company:'Studio',location:'Los Angeles, CA',source:'indeed',url:'https://indeed.com/viewjob?jk=5'}
 ]};
 const scope={window,document,MutationObserver,URL,AbortController,setTimeout,clearTimeout,Date,console,
  fetch:async()=>({ok:true,json:async()=>published})};
 vm.runInNewContext(adapter,scope,{timeout:2000});
 const api=window.BigLWAVisualLife;
 assert.deepEqual(Array.from(api.searchLwazi('creative producer jobs')),[]);
 await api.loadFeed();
 assert.equal(api.getFeedInfo().count,3);
 assert.equal(api.searchLwazi('creative producer jobs')[0].title,'Creative Producer');
 assert.equal(api.searchLwazi('casting coordinator Los Angeles')[0].title,'Casting Coordinator');
 assert.equal(api.searchLwazi('legal jobs').length,0,'No invented legal jobs when not in feed');
 assert.equal(api.getJobByUrl('https://not-sourced.example/job'),null,'Preview only signed source job URLs');
 assert.equal(api.getJobByUrl(published.jobs[0].url).company,'The New York Times');
 const stale={...published,generated_at:'2020-01-01T00:00:00.000Z'};
 const newer={window:{addEventListener:()=>{}},document,MutationObserver,URL,AbortController,setTimeout,clearTimeout,Date,console,
  fetch:async()=>({ok:true,json:async()=>stale})};
 vm.runInNewContext(adapter,newer,{timeout:2000});
 await newer.window.BigLWAVisualLife.loadFeed();
 assert.equal(newer.window.BigLWAVisualLife.searchLwazi('creative').length,0);
});
test('L’wazi Jobs tab, original postings, and Werk Window are bound without remote iframe or LockDown code',()=>{
 assert.match(lwazi,/\['jobs','Jobs'\]/);
 assert.match(lwazi,/jobs:'Job postings'/);
 assert.match(lwazi,/section\('Job postings',jobCards\.map\(sourceJobCard\)/);
 assert.match(lwazi,/api\.searchLwazi\?\.\(clean,12\)/);
 assert.match(lwazi,/data-werk-preview-url/);
 assert.match(werk,/data-werk-window-open/);
 assert.match(werk,/dataset\.werkPreviewUrl=url/);
 assert.match(windowCode,/window\.BigLWAJobWindow=Object\.freeze/);
 assert.match(windowCode,/getJobByUrl/);
 assert.doesNotMatch(windowCode,/<iframe|srcdoc=|eval\(|new Function|LockDown|Respondus/i,'No third-party script execution or exam browser integration');
});
test('Four Studio shells load Calendar facts before module, and renewed job assets once',()=>{
 for(const path of shells){
  const c=read(path);
  assert.equal((c.match(/pop-culture-calendar-20261114\.js\?v=/g)||[]).length,1,path);
  assert.equal((c.match(/werk-browser-window-20261114\.js\?v=/g)||[]).length,1,path);
  assert.equal((c.match(/werk-browser-window-20261114\.css\?v=/g)||[]).length,1,path);
  assert(c.indexOf('pop-culture-calendar-20261114.js?v=')<c.indexOf('module-pages.js?v='),path);
  assert.match(c,/visual-life-jobs\.js\?v=20261114-werk-brands-1/);
  assert.match(c,/politc-werk-20261114\.js\?v=20261114-werk-brands-1/);
  assert.match(c,/user-search-results\.js\?v=[^"<>]*jobs=20261114-1/);
 }
});


function werkWindowHarness(adapterApi){
 const handlers={};
 const element=tag=>({
  tag,children:[],dataset:{},attributes:{},listeners:{},textContent:'',isConnected:false,open:false,
  append(...nodes){this.children.push(...nodes);},
  replaceChildren(...nodes){this.children=[...nodes];},
  setAttribute(name,value){this.attributes[name]=String(value);},
  addEventListener(event,handler){this.listeners[event]=handler;},
  focus(){this.focused=true;},
  showModal(){this.open=true;},
  close(){this.open=false;}
 });
 const dialog=element('dialog');
 const controls=Object.fromEntries([
  '.werk-window-close','.werk-window-query','.werk-window-list',
  '.werk-window-status','.werk-window-details'
 ].map(selector=>[selector,element(selector)]));
 dialog.querySelector=selector=>controls[selector]||null;
 const document={
  createElement:tag=>tag==='dialog'?dialog:element(tag),
  body:{append(node){node.isConnected=true;}},
  addEventListener:(name,cb)=>{handlers[name]=cb;}
 };
 const window={BigLWAVisualLife:adapterApi};
 vm.runInNewContext(windowCode,{window,document,URL,console},{timeout:1500});
 return {window,dialog,controls,handlers};
}
test('Werk Window opens the exact posting even when it is beyond the first 45 jobs',async()=>{
 const posts=Array.from({length:72},(_,i)=>({
  url:'https://careers.example.org/jobs/'+i,
  title:'Creative role '+i,company:'Studio '+i,location:'Los Angeles',
  source:'greenhouse',postedAt:'2026-11-14',searchTerm:'creative'
 }));
 const api={
  getFeedInfo:()=>({status:'connected'}),listVerified:()=>posts,
  getJobByUrl:url=>posts.find(p=>p.url===url)||null
 };
 const env=werkWindowHarness(api),chosen=posts[68];
 await env.window.BigLWAJobWindow.open({url:chosen.url});
 assert.equal(env.dialog.open,true);
 assert.equal(env.controls['.werk-window-list'].children[0].dataset.jobUrl,chosen.url);
 assert.equal(env.controls['.werk-window-list'].children[0].attributes['aria-pressed'],'true');
 assert.equal(env.controls['.werk-window-details'].children[1].textContent,chosen.title);
 assert.equal(env.controls['.werk-window-details'].children.at(-1).href,chosen.url);
 assert.match(env.controls['.werk-window-status'].textContent,/Showing 45 of 72/);
});
test('Werk Window waits for the published feed before resolving a clicked source job',async()=>{
 const chosen={url:'https://jobs.example.org/posting/987',title:'Assistant Casting Coordinator',
  company:'Casting Studio',location:'Los Angeles',source:'ashby'};
 let loaded=false,finish;
 const pending=new Promise(resolve=>{finish=resolve});
 const api={
  getFeedInfo:()=>({status:loaded?'connected':'pending'}),
  listVerified:()=>loaded?[chosen]:[],
  getJobByUrl:url=>loaded&&url===chosen.url?chosen:null,
  async loadFeed(){await pending;loaded=true;}
 };
 const env=werkWindowHarness(api);
 const opening=env.window.BigLWAJobWindow.open({url:chosen.url});
 assert.match(env.controls['.werk-window-status'].textContent,/Finding this posting/);
 finish();
 await opening;
 assert.equal(env.controls['.werk-window-details'].children[1].textContent,chosen.title);
 assert.equal(env.controls['.werk-window-list'].children[0].dataset.jobUrl,chosen.url);
});
test('Werk Window never fabricates a posting when clicked URL is missing from the latest feed',async()=>{
 const source='https://jobs.example.org/posting/no-longer-present';
 const env=werkWindowHarness({
  getFeedInfo:()=>({status:'connected'}),
  listVerified:()=>[],
  getJobByUrl:()=>null
 });
 await env.window.BigLWAJobWindow.open({url:source});
 const detail=env.controls['.werk-window-details'].children;
 assert.equal(detail[0].textContent,'Listing unavailable in Werk');
 assert.equal(detail.at(-1).href,source);
 assert.match(env.controls['.werk-window-status'].textContent,/not available/);
});
test('Job and Orbit fixes are cache-busted in each Studio shell',()=>{
 for(const path of shells){
  const html=read(path);
  assert.match(html,/werk-browser-window-20261114\.js\?v=20261114-job-selection-2/);
  assert.match(html,/orbit-space-20261114\.js\?v=20261114-visible-stars-3/);
 }
});
