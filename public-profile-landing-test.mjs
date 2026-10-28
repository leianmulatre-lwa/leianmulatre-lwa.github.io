import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {JSDOM}=createRequire(import.meta.url)('jsdom');
const landing=readFileSync(new URL('./public-profile-landing.js',import.meta.url),'utf8');
const planets=readFileSync(new URL('./orbit-preview-eight-20261016.js',import.meta.url),'utf8');
const preview=readFileSync(new URL('./studio-preview.js',import.meta.url),'utf8');
const sharing=readFileSync(new URL('./profile-module-sharing.js',import.meta.url),'utf8');
const feed=readFileSync(new URL('./feed-view.js',import.meta.url),'utf8');
const login=readFileSync(new URL('./login-stitch-polish.css',import.meta.url),'utf8');
const index=readFileSync(new URL('./index.html',import.meta.url),'utf8');
assert.ok(feed.includes('const externalVideo=tiktokEmbed && !playable'),'Stored video preferred over external TikTok embed');
assert.ok(feed.includes('!playable && !shown.length && !externalVideo'),'No duplicate external link footer below imported media');
assert.ok(preview.includes('publicStats')&&preview.includes('biglwa-preview-mode #studioApp .sidebar'),'Public metrics and no owner sidebar');
const guestCss=readFileSync(new URL('./guest-check-v2.css',import.meta.url),'utf8');
const rankCss=readFileSync(new URL('./profile-highlight-editor.css',import.meta.url),'utf8');
const appearance=readFileSync(new URL('./studio-appearance.js',import.meta.url),'utf8');
const menu=readFileSync(new URL('./account-menu.js',import.meta.url),'utf8');
assert.ok(preview.includes("function syncPublicWidgets()"),'Public preview has explicit shared-widget visibility');
assert.ok(preview.includes("visible.has(key)?'1':'0'"),'Unshared widgets do not become public automatically');
assert.ok(preview.includes('biglwa-preview-mode #studioApp .masonry >'),'Public grid is filtered');
assert.ok(preview.includes("if(!document.getElementById('biglwaPreviewBanner'))buildBanner()"),'Preview notice restores after late Studio hydration');
assert.ok(preview.includes("window.__biglwaPublicStorageView=true"),'Owner-local drafts are disabled at public preview activation');
assert.ok(preview.includes('if(preview.snapshot)return'),'Reapplying public appearance does not overwrite viewer theme backup');
assert.ok(appearance.includes("if(!document.documentElement.classList.contains('biglwa-preview-mode'))"),'Viewer preferences never persist imported public appearance');
assert.ok(guestCss.includes('repeating-linear-gradient(to bottom'),'Guest Check public sheet retains its ruled-paper treatment');
assert.ok(landing.includes('background:transparent!important;color:#111'),'Public Avatar does not paint a mismatched beige panel');
assert.ok(rankCss.includes('color:#000!important;opacity:1!important'),'REAL RANK label and status display readable black ink');
assert.ok(menu.includes('location.assign(previewLink.href)'),'Owner Preview Profile does a full public-route navigation');
assert.ok(index.includes('/studio-preview.js?v=20261027-public-preview-parity-4'),'Both routes use the refreshed public profile runtime');
assert.ok(sharing.includes('publicOrbit(root)')&&sharing.includes('publicBoards(root)'),'Orbit and Boards are handled as public read-only modules');
assert.ok(index.includes('/public-profile-landing.js')&&index.includes('/login-stitch-polish.css'),'Public landing and stitch theme loaded');
assert.ok(login.includes('stitched-crest-mask'),'Login emblem retains stitched shape');
assert.ok(preview.includes('html.biglwa-preview-mode #studioApp .main{margin-left:0!important'),'Public profile expands into the hidden sidebar space');
assert.ok(preview.includes('top:var(--biglwa-preview-banner-h,0px)!important'),'Sticky header uses the measured preview notice height');
assert.ok(preview.includes('decorateVisitorShortcuts()'),'Visitor shortcut rail stays populated');
assert.ok(!landing.includes("make('button','View Orbit connections'"),'No duplicate View Orbit CTA on visitors');
const dom=new JSDOM('<!doctype html><html><head></head><body><main id="studioApp"><article id="boards"><div class="card-head"><h2>Boards</h2></div><div id="connect-pinterest">Connect Pinterest</div></article><article id="diary"><button class="diary-page"><img src="/assets/diary-notebook-closeup.svg"></button></article><article id="orbit"><div id="orbitGrid"></div><p class="orbit-note"></p></article><article class="guest-check-card"></article><article id="map"><button type="button" data-open="map">Open Map</button></article><article id="studioAvatarCard"></article></main></body></html>',{url:'https://biglwa.com/leian',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window,doc=w.document;
doc.documentElement.classList.add('biglwa-preview-mode');
w.BigLWAUserDirectory={loadArchiveForUsername:async()=>[
 {state:'approved',source:'pinterest',thumbnailUrl:'https://example.com/a.jpg'},
 {state:'private',source:'pinterest',thumbnailUrl:'https://example.com/private.jpg'}
]};
w.BigLWAStudioPreview={prompt:(value)=>w.lastPrompt=value};
w.BigLWAGuestCheck={
 summary:(node,profile)=>{node.textContent='Published entries for @'+profile.username;w.summaryOwner=profile.uid},
 open:()=>{w.guestOpens=(w.guestOpens||0)+1}
};
w.eval(landing);
w.eval(planets);
doc.dispatchEvent(new w.Event('DOMContentLoaded'));
const ownerProfile={uid:'ownerA',username:'leian',name:'Leian',journalVisibility:'private',
 profilePhotoUrl:'https://example.com/avatar.jpg',
 socials:[{id:'instagram',label:'Instagram',url:'https://www.instagram.com/leian/'},
 {id:'youtube',label:'YouTube',url:'https://www.youtube.com/@leian'}]};
w.__biglwaViewedProfile=ownerProfile;
w.dispatchEvent(new w.CustomEvent('biglwa:public-profile-ready',{detail:{profile:ownerProfile}}));
await new Promise(r=>setTimeout(r,360));
assert.equal(doc.querySelectorAll('.biglwa-public-board-slot').length,6,'Exactly two rows of three board previews');
assert.equal(doc.querySelectorAll('.biglwa-public-board-slot img').length,1,'Only approved owner Pinterest media rendered');
assert.ok(!doc.querySelector('.biglwa-public-boards-home').textContent.includes('Connect Pinterest'));
assert.equal(doc.querySelector('.biglwa-public-journal-initial').textContent,'L');
const book=doc.querySelector('#diary .diary-page');
const letter=doc.querySelector('.biglwa-public-journal-initial');
const bookCover=book.querySelector('img');
w.dispatchEvent(new w.Event('biglwa:public-mirror-ready'));
await new Promise(r=>setTimeout(r,180));
assert.equal(doc.querySelector('.biglwa-public-journal-initial'),letter,'Journal initial is stable after public mirror refresh');
assert.equal(doc.querySelector('#diary .diary-page img'),bookCover,'Journal notebook cover is not replaced');
const instagram=doc.querySelector('#orbitGrid [data-orbit-app="instagram"]');
const youtube=doc.querySelector('#orbitGrid [data-orbit-app="youtube"]');
const calendar=doc.querySelector('#orbitGrid [data-orbit-app="calendar"]');
assert.equal(instagram.querySelector('small').textContent,'Linked','Owner Instagram planet has published status');
assert.equal(youtube.querySelector('small').textContent,'Linked','Owner YouTube planet has published status');
assert.equal(calendar.querySelector('small').textContent,'Not shared','Private Calendar is never invented as linked');
assert.equal(calendar.disabled,true,'Unshared planet cannot start OAuth');
let opened='';
w.open=(url)=>{opened=url;return {}};
instagram.click();
assert.equal(opened,'https://www.instagram.com/leian/','Clicking public planet opens owner hyperlink');
assert.ok(doc.querySelector('.biglwa-public-avatar-preview img'),'Visitor sees public avatar/profile image');
assert.equal(doc.querySelectorAll('#map [data-open="map"]').length,1,'Map has one existing CTA');
doc.querySelector('#map [data-open="map"]').click();
assert.equal(w.lastPrompt,'view this member’s published map','Map gated until account creation');
assert.equal(w.summaryOwner,'ownerA','Visitor sheet reads the owner-scoped published entries');
assert.ok(doc.querySelector('.biglwa-guest-v2-preview'),'Public profile contains the live Guest Check summary');
doc.querySelector('.biglwa-public-guest-open').click();
assert.equal(w.guestOpens,1,'Read-only visitor opens the actual shared Guest Check rather than a fake dialog');
w.dispatchEvent(new w.Event('biglwa:public-profile-ended'));
assert.equal(doc.querySelector('.biglwa-public-boards-home'),null,'Leaving preview removes visitor data');
dom.window.close();
console.log('PASS public Studio: approved Boards, locked Journal initial, verified avatar projection, dated Guest Check and gated Map; originals protected.');
