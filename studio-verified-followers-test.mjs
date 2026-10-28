import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{JSDOM}=require('jsdom');
const read=path=>readFileSync(new URL('./'+path,import.meta.url),'utf8');
const app=read('ui-coherence.js'),insights=read('studio-account-insights.js');
const html=read('index.html'),worker=read('cloudflare-worker-instagram.js');
const watch=read('orbit-connections.js');
assert.doesNotThrow(()=>new Function(insights),'Audience analytics must parse');
assert.doesNotThrow(()=>new Function(app),'Studio UI must parse');
assert.match(worker,/export default/,'ES-module Worker is present (syntax checked in worker CI)');
assert.ok(!app.includes("value.textContent='0';\n          followersFound=true"),'No unconditional follower reset');
assert.match(watch,/count\(details.followers\)/,'Only provider-supplied counts are accepted');
assert.match(watch,/followers: followers \?\? preserved/,'Missing API count retains last verified account value');
assert.match(worker,/TIKTOK_USER_STATS_APPROVED/,'TikTok stats permission opt-in is supported');
assert.match(html,/studio-followers\.css\?v=20261028-high-contrast-1/);
for(const id of ['instagram','tiktok','pinterest','x','youtube','tumblr','facebook','snapchat'])
 assert.match(read('assets/orbit-icons/'+id+'.svg'),/<svg\b/,'Local '+id+' icon is present');
const dom=new JSDOM('<!doctype html><html><body><main id="studioApp">'+
 '<article class="profile-card"><div class="stats"></div></article><div id="connect"></div></main>'+
 '<section id="skeletonAnalytics"></section></body></html>',{url:'https://biglwa.com/studio',
 pretendToBeVisual:true,runScripts:'outside-only'});
const w=dom.window,d=w.document,uid='test-owner-a';
const clone=x=>JSON.parse(JSON.stringify(x));
let account={uid,connections:{
 instagram:{username:'myhandle',stats:{followers:150},lastCheckedAt:'2026-10-20T12:00:00Z'},
 pinterest:{username:'mypins',stats:{followers:null,monthlyViews:2154},lastCheckedAt:'2026-10-20T12:00:00Z'},
 tiktok:{username:'mytt',stats:{followers:60},lastCheckedAt:'2026-10-20T12:00:00Z'}},
 orbitConnectedProfiles:{x:{username:'myx',followers:90,countCheckedAt:'2026-10-20T12:00:00Z'}},
 peopleConnections:{},analyticsMonths:{}};
w.__biglwaIdentity={uid};w.BigLWAAccountStorage={uid};
w.BigLWAUserDirectory={getAccountOverview:async()=>clone(account),
 recordAnalyticsMonth:async(m,s)=>({...s,observedAt:'2026-10-22T18:00:00Z'})};
w.eval(insights);d.dispatchEvent(new w.Event('DOMContentLoaded'));await new Promise(r=>setTimeout(r,55));
const stat=()=>w.__biglwaProfileMetrics;
assert.equal(stat().followers,300,'Sum includes only provider-verified Instagram, TikTok and X');
assert.equal(stat().followersDisplay,'300+','Incomplete sources use + rather than falsely claiming full audience total');
assert.equal(stat().sources.find(x=>x.id==='pinterest').followers,null);
assert.equal(stat().sources.find(x=>x.id==='pinterest').monthlyViews,2154);
assert.equal(stat().reach,null,'Views are not unique monthly reach');
assert.ok(read('studio-onboarding.js').includes('openAnalytics};'),'Skeleton Key exports analytics navigation');
assert.ok(read('studio-followers.css').includes('color:#090909!important'),'Profile stat ink is high contrast');
assert.ok(!app.includes('function showFollowersPanel('),'Old follower dropdown removed');
const block=app.slice(app.indexOf('  function syncRealProfileMetrics(){'),app.indexOf('  function latestStreamTitle(){'));
assert.ok(block.startsWith('  function syncRealProfileMetrics(){'));
w.eval('(()=>{const $=(s,r=document)=>r.querySelector(s);'+block+'window.__testProfilePaint=syncRealProfileMetrics})()');
w.__testProfilePaint();
const trigger=d.querySelector('[data-profile-stat="followers"]');
assert.equal(trigger.querySelector('b').textContent,'300+');
let selectedMetric=null;
w.BigLWASiteGuide={openAnalytics:metric=>{selectedMetric=metric;return true}};
trigger.click();
assert.equal(selectedMetric,'followers','Followers opens Skeleton Key analytics');
assert.equal(d.querySelector('#biglwaFollowersPopover'),null,'Legacy follower dropdown has been retired');
d.querySelector('[data-profile-stat="likes"]').click();
assert.equal(selectedMetric,'likes','Likes also navigates to Skeleton Key');
account.connections.instagram.stats.followers=null;
await w.BigLWAAccountInsights.refresh();
assert.equal(stat().followers,300,'Omitted follower field retains owner-scoped last verified value');
assert.equal(stat().sources.find(x=>x.id==='instagram').isLastKnown,true);
account.connections.instagram.stats.followers=0;
await w.BigLWAAccountInsights.refresh();
assert.equal(stat().followers,150,'Actual verified zero supersedes a previous positive figure');
w.__biglwaIdentity={uid:'test-owner-b'};w.BigLWAAccountStorage.uid='test-owner-b';
account={uid:'test-owner-b',connections:{},orbitConnectedProfiles:{},peopleConnections:{},analyticsMonths:{}};
await w.BigLWAAccountInsights.refresh();w.__testProfilePaint();
assert.equal(stat().followers,null,"New owner never inherits previous owner\'s followers");
assert.equal(d.querySelector('[data-profile-stat="followers"] b').textContent,'—');
// Let the analytics module's one-time 1200ms startup refresh finish before
// tearing down JSDOM, so a pending save cannot access a destroyed document.
await new Promise(r=>setTimeout(r,1350));
w.close();
console.log('PASS provider follower totals, missing counts, real zero, per-app badges and per-UID privacy.');

assert.match(insights,/connectionAPI\?\.connections\?\.\(\)/,'Latest connected provider responses power follower counts');
assert.ok(read('studio-account-insights.js').includes('window.BigLWAAccountInsights={refresh,summarize}'),'Skeleton analytics refresh uses provider data');
