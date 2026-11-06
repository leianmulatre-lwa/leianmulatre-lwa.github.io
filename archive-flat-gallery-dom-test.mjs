import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {runInNewContext,Script} from 'node:vm';
const {JSDOM}=createRequire(import.meta.url)('jsdom');
const read=p=>readFileSync(new URL('./'+p,import.meta.url),'utf8');
const js=read('module-pages.js'),css=read('archive-flat-gallery-20261026.css');
const index=read('index.html');
assert.doesNotThrow(()=>new Script(js),'Current module JS parses');
const sample='<main id="studioApp"><div id="moduleWorkspace" data-module-key="archive">'+
'<section class="module-card wide archive-wall-shell">'+
'<div class="archive-toolbar"><div class="archive-toolbar-actions"><button>Manage connections</button><button>Import / refresh</button></div>'+
'<div class="archive-filter-bar"><button class="archive-filter-chip is-on" aria-pressed="true" data-archive-source-filter="all">All</button>'+
'<button class="archive-filter-chip" aria-pressed="false" data-archive-source-filter="tiktok">TikTok</button>'+
'<label class="archive-dupes"><input type="checkbox">Hide duplicates</label></div></div>'+
'<div class="archive-page-list">'+
'<article class="instagram-archive-card is-live archive-src-tiktok" style="--feed-card-shadow:3px 3px 0 #772dcc">'+
'<div class="instagram-archive-media"><div class="instagram-archive-piece"><img src="data:," alt=""></div>'+
'<div class="archive-browser-actions"><button data-archive-light="delete"></button><button data-archive-light="archive"></button><button data-archive-light="enlarge"></button></div>'+
'<div class="archive-card-overlay"><div class="archive-media-meta"><span>Oct 26</span><small>Caption</small></div>'+
'<label class="archive-live"><input type="checkbox" data-archive-live-input="a" checked>'+
'<span class="archive-live-track"><i></i></span><b>Live</b></label></div></div></article>'+
'</div></section></div></main>';
const dom=new JSDOM('<!doctype html><html><head><style>'+css+'</style></head><body>'+sample+'</body></html>',{pretendToBeVisual:true,url:'https://biglwa.com/studio'});
const d=dom.window.document,computed=selector=>dom.window.getComputedStyle(d.querySelector(selector));
assert.equal(computed('.archive-toolbar').display,'grid','Desktop toolbar has two columns, not stacked raw controls');
assert.match(computed('.archive-toolbar').gridTemplateColumns,/max-content/,'Left buttons / right filters columns exist');
assert.equal(computed('.archive-page-list').display,'grid','Card wall is an actual CSS grid');
assert.match(computed('.archive-page-list').gridTemplateColumns,/repeat\(8/,'Wide desktop gallery fits eight photos');
assert.equal(computed('.archive-filter-bar').justifyContent,'flex-end','Platform filters align on top right');
assert.equal(computed('.archive-card-overlay').position,'absolute','Caption and switch overlay the media');
assert.equal(computed('.archive-live').borderRadius,'999px','Live control renders as a pill');
assert.equal(computed('.archive-live input').opacity,'0','Native checkbox is visually hidden, not a bare form checkbox');
assert.equal(computed('.archive-browser-actions').position,'absolute','Window dots remain inside card');
assert.equal(d.querySelectorAll('.archive-app-compartment').length,0,'No duplicate collapsible navigation layer');
assert.ok(index.includes('/archive-flat-gallery-20261026.css?v=20261029-uniform-archive-1'),'Real site loads independent Archive CSS');
const source=js.slice(js.indexOf('    function groupCards(cardList,items,grouped,hideDupes){'),js.indexOf('\n  function renderArchive(){'));
const fn=runInNewContext(source+';groupCards',{});
const grouped={order:['A','B'],groups:new Map([['A',[0,2]],['B',[1]]])};
assert.equal(fn(['card-0,','card-1,','card-2,'],[],grouped,false),'card-0,card-2,card-1,','Flat gallery retains each stored card');
assert.equal(fn(['card-0,','card-1,','card-2,'],[],grouped,true),'card-0,card-1,','Hide duplicates removes later copies, not the original');
assert.ok(js.includes("f.sources=k==='all'?[]:[k]"),'Selecting a platform replaces, not stacks filters');
assert.ok(js.includes("input type=\"checkbox\" data-archive-live-input"),'Existing publish/unpublish listener is preserved');
assert.ok(js.includes("await postsApi?.publishOrbitPost?.(id)")&&js.includes("await postsApi?.setOrbitState?.(id,'archived')"),'Live state is account backed');
const helpers=js.slice(js.indexOf('  const ARCHIVE_GENERIC_SOURCES'),js.indexOf('  function archiveSourceRim'));
const sourceApi=runInNewContext(helpers+';({archiveItemSource,archiveSourceFromHost,archiveSourceLabel})',{location:{origin:'https://biglwa.com'},URL});
assert.equal(sourceApi.archiveItemSource({source:'',sourceUrl:'https://www.instagram.com/p/abc/'}),'instagram','A pasted Instagram link lands in Instagram');
assert.equal(sourceApi.archiveItemSource({source:'unknown',url:'https://www.tiktok.com/@x/video/1'}),'tiktok','A generic source still finds its app from the link');
assert.equal(sourceApi.archiveItemSource({source:'pinterest',sourceUrl:'https://www.instagram.com/p/x'}),'pinterest','An explicit saved source is not overridden by a link');
assert.equal(sourceApi.archiveItemSource({source:'snapchat'}),'snapchat');
assert.equal(sourceApi.archiveItemSource({}),'instagram','Unlabelled legacy cards keep their Instagram home');
assert.equal(sourceApi.archiveSourceLabel('snapchat'),'Snapchat','Snapchat has a named section');
assert.ok(js.includes("const pinnedSources=['instagram','tiktok','snapchat']"),'Snapchat is always offered next to All');
assert.ok(js.includes("biglwa:archive-rendered"),'A finished Archive draw announces itself so Highlights remount');
dom.window.close();
console.log('PASS actual computed Archive layout: two-column toolbar, top-right app chips, compact grid, in-card Live pill, flat grouping, duplicate logic, publish action.');
