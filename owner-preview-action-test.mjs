import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const {JSDOM}=createRequire(import.meta.url)('jsdom');
const read=p=>readFileSync(new URL('./'+p,import.meta.url),'utf8');
const preview=read('studio-preview.js'),accountMenu=read('account-menu.js');
const avatar=read('avatar-studio-bitmoji-20261017-v3.js');
const chrome=read('account-chrome.js'),publicPage=read('public-profile-landing.js');
const curtain=read('studio-loading-consistency-20261026.css');
assert.match(preview,/mineUsername===username\.toLowerCase\(\)&&!PREVIEW_REQUESTED/,
 'Self profile can explicitly enter the real visitor preview');
assert.match(preview,/location\.pathname\+location\.search!==preview\.path/,
 'Preview link query is not erased during forced page routing');
assert.match(preview,/biglwa-owner-self-preview/,'Only self-preview keeps account dropdown enabled');
assert.match(avatar,/publishStudioAvatar\(f,uid,state\.avatar\)/,
 'Saving a real Avatar also publishes an owner-matched public reference');
assert.match(avatar,/publishStudioAvatar\(f,user\.uid,state\.avatar,snap\)/,
 'Existing saved Avatars are backfilled for public profiles');
assert.match(chrome,/renderJournalCoverInitial\(name\)/,'Journal initial uses display name');
assert.match(publicPage,/Avatar not shared/,'Missing character never falls back to an initial');
assert.match(publicPage,/publicGuestEntriesVisibility/,'Only explicitly published Guest Check notes can be public');
assert.match(curtain,/--lwa-loading-hero-height:clamp\(275px,43vh,355px\)/,
 'Top curtain is fixed-height, not stretched to feed');

const dom=new JSDOM('<!doctype html><html><head></head><body>'+
 '<div id="studioApp"><div class="topbar"><div class="account-right">'+
 '<button id="profileMenuBtn">Account</button>'+
 '<button id="studioNotificationsBtn"><img class="visitor-mail-icon" src="/assets/mail-symbol.svg" alt=""></button>'+
 '<button id="studioSignOut"><img class="studio-logout-icon" src="/assets/logout-symbol.svg" alt=""></button>'+
 '</div></div><section id="connect"><span class="card-icon"><img src="/assets/connect-symbol.svg" alt=""></span></section></div>'+
 '<dialog id="studioLogsDialog"></dialog></body></html>',
 {url:'https://biglwa.com/studio',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window,d=w.document;
w.__biglwaIdentity={uid:'owner-1',username:'leian',name:'Leian'};
let signedOut=0;
d.getElementById('studioSignOut').addEventListener('click',()=>signedOut++);
d.getElementById('studioNotificationsBtn').addEventListener('click',()=>d.getElementById('studioLogsDialog').setAttribute('open',''));
w.eval(accountMenu);
d.dispatchEvent(new w.Event('DOMContentLoaded'));
await new Promise(res=>setTimeout(res,80));
const dots=d.getElementById('biglwaAccountActionDots');
const menu=d.getElementById('biglwaAccountMenu');
assert.ok(dots&&menu,'Account menu and color dots actually mount');
assert.ok((d.getElementById('profileMenuBtn').compareDocumentPosition(dots) & 4)!==0,
 'Profile avatar/greeting comes before green/yellow/red account dots');
assert.match(d.getElementById('biglwa-account-dots-style').textContent,/gap:9px/,
 'Colored account dots have slightly more breathing room');
assert.match(d.getElementById('biglwa-account-menu-style').textContent,/\.welcome\{[^}]*top:7px/,'Welcome text is shifted down to visually center beside avatar');
assert.match(d.getElementById('biglwa-account-dots-style').textContent,/place-items:center!important/,'The green Add Friends symbol is centered without altering it');
assert.match(d.getElementById('biglwa-account-dots-style').textContent,/\[data-biglwa-open-connect\] img[^}]*width:12px/,
 'Connect icon itself is smaller without changing the button symbol');
assert.equal(dots.querySelectorAll('button').length,3,'Exactly green/yellow/red account actions');
assert.ok(dots.querySelector('[data-biglwa-open-connect]'));
assert.equal(dots.querySelector('[data-biglwa-open-connect] img')?.getAttribute('src'),'/assets/connect-symbol.svg','Connect action reuses the actual Connect icon');
let openedConnect=0;
w.openBIGLWAModule=module=>{if(module==='connect')openedConnect++};
dots.querySelector('[data-biglwa-open-connect]').click();
assert.equal(openedConnect,1,'Green Connect button routes to people without leaving the account');
assert.equal(signedOut,0,'Opening Connect does not sign the member out');
assert.equal(dots.querySelector('#studioNotificationsBtn'),d.getElementById('studioNotificationsBtn'),'The original Logs/mail button is MOVED, not duplicated');
assert.equal(dots.querySelector('#studioSignOut'),d.getElementById('studioSignOut'),'Original logout button and listener preserved');
assert.equal(d.querySelectorAll('#studioNotificationsBtn').length,1,'Exactly ONE native mail/logs button');
assert.equal(dots.querySelector('[data-biglwa-logs]'),null,'Broken replacement Logs control removed');
assert.match(d.getElementById('biglwa-account-dots-style').textContent,/width:26px!important/,'Buttons shrunk to 26px');
d.getElementById('profileMenuBtn').click();
assert.equal(menu.hidden,false,'Dropdown opens');
assert.equal(d.getElementById('biglwaMenuPreview').getAttribute('href'),'/leian?preview=1',
 'Preview option navigates to actual owner public profile');
dots.querySelector('#studioSignOut').click();
assert.equal(signedOut,1,'Red logout runs the ORIGINAL authenticated sign-out action');
dots.querySelector('#studioNotificationsBtn').click();
assert.equal(d.getElementById('studioLogsDialog').open,true,'Yellow original mail/Logs button opens the REAL Logs dialog');
d.documentElement.classList.add('biglwa-preview-mode','biglwa-owner-self-preview');
d.getElementById('profileMenuBtn').click();
assert.notEqual(d.getElementById('profileMenuBtn').getAttribute('aria-disabled'),'true',
 'Account menu works during self-preview');
dom.window.close();
console.log('PASS owner preview routing, menu preview/settings, green/yellow/red live actions, avatar backfill, dated public-only guest sheet and Journal initial.');
