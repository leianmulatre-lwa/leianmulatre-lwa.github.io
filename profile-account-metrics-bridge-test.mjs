import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {JSDOM}=require('jsdom');
const dom=new JSDOM('<!doctype html><html><body><main id="studioApp">'+
'<article class="profile-card"><div class="profile-copy">'+
'<div class="stats"><span data-profile-stat="likes">— Likes</span>'+
'<span data-profile-stat="reach">— Reach</span></div></div></article>'+
'</main></body></html>',{url:'https://biglwa.com/studio',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window;
const month=new Date().toISOString().slice(0,7);
let uid='metric-owner-a',persisted=[],data={
 uid,analyticsMonths:{},peopleConnections:{},orbitConnectedProfiles:{},
 connections:{tiktok:{username:'maker',sourceUserId:'tiktok-openid-1',stats:{
  followers:101,likes:654,monthlyReach:{month,metric:'reach',value:4321}
 },lastCheckedAt:'2026-10-23T12:00:00Z'}}
};
w.__biglwaIdentity={uid};
w.BigLWAUserDirectory={
 getAccountOverview:async()=>JSON.parse(JSON.stringify(data)),
 recordAnalyticsMonth:async(month,snapshot)=>{persisted.push({month,snapshot});return {...snapshot,observedAt:new Date().toISOString()}}
};
w.eval(readFileSync(new URL('./studio-account-insights.js',import.meta.url),'utf8'));
await w.BigLWAAccountInsights.refresh();
assert.equal(w.document.querySelector('#skeletonAnalytics'),null,'Analytics widget is deliberately not mounted');
assert.equal(w.__biglwaProfileMetrics.likes,654,'Likes reach the banner without Skeleton Key');
assert.equal(w.__biglwaProfileMetrics.reach,4321,'Reported monthly reach reaches the banner');
assert.equal(w.__biglwaProfileMetrics.reachMonth,month);
assert.equal(w.__biglwaProfileMetrics.followers,101);
assert.ok(persisted.length,'Month is backed up');
assert.equal(persisted.at(-1).snapshot.sources[0].likes,654,'Saving observations preserves likes');
assert.equal(persisted.at(-1).snapshot.sources[0].handle,'tiktok-openid-1','Saved metric is tied to provider account');
data={
 uid,peopleConnections:{},orbitConnectedProfiles:{},
 analyticsMonths:{[month]:{sources:[{id:'tiktok',handle:'tiktok-openid-1',likes:333,
  reach:{month,metric:'reach',value:2222}}]}},
 connections:{tiktok:{username:'maker',sourceUserId:'tiktok-openid-1',stats:{followers:101}}}
};
await w.BigLWAAccountInsights.refresh();
assert.equal(w.__biglwaProfileMetrics.likes,333,'Matching last monthly observation restores Likes');
assert.equal(w.__biglwaProfileMetrics.reach,2222,'Matching last monthly observation restores reach');
data.connections.tiktok.sourceUserId='changed-tiktok-open-id';
await w.BigLWAAccountInsights.refresh();
assert.equal(w.__biglwaProfileMetrics.likes,null,'Replaced TikTok account never inherits old likes');
assert.equal(w.__biglwaProfileMetrics.reach,null,'Replaced TikTok account never inherits old reach');
uid='metric-owner-b';w.__biglwaIdentity={uid};
data={uid,analyticsMonths:{},connections:{},peopleConnections:{},orbitConnectedProfiles:{}};
await w.BigLWAAccountInsights.refresh();
assert.equal(w.__biglwaProfileMetrics.likes,null,'Another member never inherits Likes');
assert.equal(w.__biglwaProfileMetrics.reach,null,'Another member never inherits reach');
await new Promise(r=>setTimeout(r,40));
console.log('PASS banner Likes and monthly reach without Skeleton Key, snapshot persistence, account isolation.');
