// Prevent silent regressions to the saved politc + two-week Studio build.
// This script checks local source only; it does not use account data or external APIs.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = file => fs.readFileSync(file, 'utf8');
const index = read('index.html');
const modules = read('module-pages.js');
const recovery = read('studio-recovery.js');
const feedPolish = read('feed-polish.js');
const mapRouteGuard = read('map-route-guard.js');
const politcRouteGuard = read('politc-route-guard.js');
const uiCoherence = read('ui-coherence.js');
const robots = read('robots.txt');
const sitemap = read('sitemap.xml');
const about = read('about/index.html');
const settings = read('settings/index.html');
const required = ['base-v1.html','bootstrap-v2.html','studio-recovery.js','feed-polish.js','map-route-guard.js','politc-route-guard.js','assets/politc-nyame-baatanpa.svg','module-pages.js','studio-preview.js','pinterest-orbit.js','site-1.txt','site-2.txt','site-3.txt','site-4.txt','site-5.txt'];
for (const file of required) assert.ok(fs.existsSync(file), 'Missing runtime file: '+file);
assert.match(index, /<html lang="en">/);
assert.match(index, /studio-recovery\.js\?v=/);
assert.match(index, /module-pages\.js\?v=/);
assert.match(index, /<noscript>/);
assert.match(modules, /function renderPolitc\(/);
assert.match(modules, /else if\(key==='politc'\)renderPolitc\(\)/);
assert.match(modules, /function miniCalendarMarkup\(/);
assert.match(modules, /miniCalendarMarkup\(\)/);
assert.match(modules, /window\.BigLWAOpenModule/);
assert.match(modules, /key==='map'\?'\/studio\?panel=map'/);
assert.match(index, /map-route-guard\.js\?v=/);
assert.match(mapRouteGuard, /window\.addEventListener\('click'/);
assert.match(index, /politc-route-guard\.js\?v=/);
assert.match(politcRouteGuard, /opener\('politc'\)/);
assert.match(politcRouteGuard, /stopImmediatePropagation/);
assert.match(uiCoherence, /'tools','politc'/);
assert.match(modules, /politc-nyame-baatanpa\.svg/);
assert.match(modules, /params\.get\('panel'\)==='map'/);
assert.match(recovery, /data-open="politc"/);
assert.match(index, /feed-polish\\.js\\?v=/);
assert.match(feedPolish, /data-publish-connected/);
assert.match(feedPolish, /biglwa-card-options/);
assert.match(recovery, /biglwa-two-week-recovered/);
assert.match(robots, /Sitemap: https:\/\/biglwa\.com\/sitemap\.xml/);
assert.match(sitemap, /https:\/\/biglwa\.com\/about\//);
assert.match(about, /rel="canonical"/);
assert.match(settings, /noindex,nofollow/);
const mainScript=index.match(/<script>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(mainScript,'Missing main inline app loader');
for (const [name, source] of [['index inline loader',mainScript],['module pages',modules],['Studio recovery',recovery],['Feed polish',feedPolish],['Map route guard',mapRouteGuard],['Politc route guard',politcRouteGuard]]) {
  new vm.Script(source,{filename:name});
  console.log('PASS syntax:',name);
}
console.log('PASS source integrity: politc route, two-week calendar, public SEO and required runtime files');
