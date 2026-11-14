import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read=path=>readFileSync(new URL('./'+path,import.meta.url),'utf8');
const werk=read('politc-werk-20261114.js');
const jobs=read('visual-life-jobs.js');
const css=read('politc-werk-20261114.css');
const shells=['index.html','studio/index.html','404.html','live-studio-shell.html'];

function harness(source,{feed=null}={}){
 const data=new Map();let publicView=false;
 const domEvents={};
 const document={
  readyState:'loading',
  addEventListener:(name,cb)=>{domEvents[name]=cb},
  querySelector:()=>null,
  documentElement:{classList:{contains:()=>publicView}}
 };
 const window={__biglwaIdentity:{uid:'owner-a'},addEventListener:()=>{},__biglwaPublicStorageView:false};
 const localStorage={
  getItem:key=>data.get(key)||null,
  setItem:(key,value)=>data.set(key,value)
 };
 const MutationObserver=class{observe(){}};
 const context={
  window,document,localStorage,MutationObserver,URL,console,
  encodeURIComponent,Date,AbortController,setTimeout,clearTimeout,
  fetch:async()=>({ok:true,json:async()=>feed}),
  CustomEvent:class{}
 };
 vm.runInNewContext(source,context,{timeout:2000});
 return {window,document,data,localStorage,domEvents,publicView:value=>{publicView=value}};
}
test('Werk is loaded exactly once in each Studio shell and appears first without moving Politic trackers',()=>{
 for(const name of shells){
  const shell=read(name);
  assert.equal((shell.match(/politc-werk-20261114\.js\?v=/g)||[]).length,1,name);
  assert.equal((shell.match(/politc-werk-20261114\.css\?v=/g)||[]).length,1,name);
  assert.equal((shell.match(/visual-life-jobs\.js\?v=/g)||[]).length,1,name);
  assert.match(shell,/politc-werk-20261114\.js\?v=20261114-jobspy-inline-2/,'New Werk script must beat the previous cached external search UI');
  assert.match(shell,/visual-life-jobs\.js\?v=20261114-jobspy-inline-2/,'Visual-Life must use the same fresh JobSpy adapter');
  assert(shell.indexOf('module-pages.js?v=')<shell.indexOf('politc-werk-20261114.js?v='),name);
 }
 assert.match(werk,/moduleBody\.insertBefore\(panel,moduleBody\.querySelector\('#politcResearchDesk'\)\|\|board\)/);
 assert.match(werk,/document\.addEventListener\('biglwa:module-open'/);
 assert.match(css,/#studioApp #moduleWorkspace\[data-module-key="politc"\] #politcWerk/);
 assert.match(css,/body\.night-mode/);
 assert.match(read('module-pages.js'),/board\.insertBefore\(liveZone,grid\)/);
});
test('Werk keeps source URLs safe but renders JobSpy postings rather than outbound search portals',()=>{
 const {window}=harness(werk);
 const targets=window.BigLWAPolitcWerk.sourceTargets('policy analyst','Los Angeles');
 assert.equal(targets.length,3);
 assert.deepEqual(Array.from(targets,x=>new URL(x.url).hostname),[
  'www.usajobs.gov','www.linkedin.com','www.indeed.com'
 ]);
 assert(targets.every(x=>x.url.startsWith('https://')));
 assert(new URL(targets[0].url).searchParams.get('k')==='policy analyst');
 assert(new URL(targets[1].url).searchParams.get('location')==='Los Angeles');
 assert.doesNotMatch(werk,/fetch\('https?:|XMLHttpRequest|scrapeJobs/);
 assert.match(werk,/rel='noopener noreferrer'/);
 assert.match(werk,/api\.searchVerified\(role,location\)/);
 assert.match(werk,/function appendJobCard\(grid,job\)/,'Inline job cards are the primary results');
 assert.match(werk,/politc-werk-jobs/,'Werk results grid is a job grid');
 assert.match(werk,/View original posting/,'Only actual job cards require outbound application links');
 assert.doesNotMatch(werk,/function appendSources\(/,'External board search cards are not rendered');
 assert.doesNotMatch(werk,/Search at the source/,'Search is not delegated to external portals');
 assert.match(werk,/JobSpy listings not available yet/,'Missing source is disclosed rather than fabricated');

});
test('Saved searches are scoped to current user and hidden from guests or public preview',()=>{
 const env=harness(werk);
 env.data.set('biglwaPolitcWerkSearchesV1:owner-a',JSON.stringify([
  {role:'Law clerk',location:'Los Angeles'},
  {role:'Policy analyst',location:'Remote'}
 ]));
 env.data.set('biglwaPolitcWerkSearchesV1:owner-b',JSON.stringify([
  {role:'Designer',location:'Miami'}
 ]));
 const api=env.window.BigLWAPolitcWerk;
 assert.equal(api.readSaved().length,2);
 assert.equal(api.readSaved('owner-b').length,0,'Cannot request another account’s saved searches');
 env.window.__biglwaIdentity={uid:'owner-b'};
 assert.equal(api.readSaved().length,1);
 assert.equal(api.readSaved('owner-a').length,0);
 env.publicView(true);
 assert.equal(api.readSaved().length,0,'No private saved searches displayed in profile preview');
 env.publicView(false);
 env.window.__biglwaIdentity=null;
 assert.equal(api.readSaved().length,0,'Guest cannot access prior saved searches');
});
test('Visual-Life only offers in-site job matches after a fresh validated feed is loaded',async()=>{
 const fresh={
  schema:1,status:'published',generated_at:new Date().toISOString(),
  jobs:[
   {title:'Policy Analyst',company:'Agency',location:'Los Angeles',source:'Job Board',url:'https://jobs.example.org/policy'},
   {title:'Policy Analyst',company:'Agency',location:'Chicago',source:'Job Board',url:'https://jobs.example.org/chicago'},
   {title:'Artist',company:'Studio',location:'Los Angeles',source:'Job Board',url:'https://jobs.example.org/art'}
  ]
 };
 const {window}=harness(jobs,{feed:fresh});
 const api=window.BigLWAVisualLife;
 assert.equal(api.searchVerified('Policy Analyst','Los Angeles').length,0,'No unvalidated user-supplied jobs');
 assert.equal(api.setJobs(fresh.jobs).accepted,3);
 assert.equal(api.searchVerified('Policy Analyst','Los Angeles').length,0,'Calling setJobs alone cannot claim a published feed');
 await api.loadFeed();
 const results=api.searchVerified('Policy Analyst','Los Angeles');
 assert.equal(results.length,1);
 assert.equal(results[0].url,'https://jobs.example.org/policy');
 assert.equal(api.getStatus(),'connected');
 assert.equal(api.getFeedInfo().status,'connected');
 assert.equal(api.getFeedInfo().count,3);
 assert.equal(api.getFeedInfo().sources.length,0,'Missing source metadata remains empty');

 assert.equal(api.searchVerified('Artist','Los Angeles').length,1);
 const stale={...fresh,generated_at:'2025-01-01T00:00:00.000Z'};
 const old=harness(jobs,{feed:stale}).window.BigLWAVisualLife;
 await old.loadFeed();
 assert.equal(old.searchVerified('Policy Analyst','Los Angeles').length,0,'Expired feed hidden');
 assert.equal(old.getStatus(),'stale');
});

test('A reviewed JobSpy refresh explicitly dispatches Pages after publishing its feed',()=>{
 const flow=read('.github/workflows/visual-life-feed.yml');
 assert.match(flow,/actions: write/,'Pages dispatch has a scoped Actions permission');
 assert.match(flow,/git push origin HEAD:main/,'The source snapshot is committed first');
 assert.match(flow,/JOBSPY_FEED_UPDATED=1/,'Dispatch is gated on changed job records');
 assert.match(flow,/if: env.JOBSPY_FEED_UPDATED == '1'/);
 assert.match(flow,/gh workflow run deploy-pages.yml --ref main/,'GITHUB_TOKEN pushes do not themselves launch Pages');
 assert.doesNotMatch(flow,/^\s+schedule:/m,'No unreviewed recurring scraper schedule');
});
