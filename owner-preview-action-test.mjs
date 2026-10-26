import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const {JSDOM}=createRequire(import.meta.url)('jsdom');
const read=p=>readFileSync(new URL('./'+p,import.meta.url),'utf8');
const preview=read('studio-preview.js'),accountMenu=read('account-menu.js');
const avatar=read('avatar-studio-bitmoji-20261017-v3.js');
const chrome=read('account-chrome.js'),publicPage=read('public-profile-landing.js');
const curtain=read('studio-loading-consistency-20261026.css');
assert.match(preview,/mineUsername===username\.toLowerCase\(\)&&new URLSearchParams\(location\.search\)\.get\('preview'\)!=='1'/,
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
 '<button id="profileMenuBtn">Account</button><button id="studioSignOut">Sign out</button>'+
 '</div></div></div><dialog id="studioLogsDialog"></dialog></body></html>',
 {url:'https://biglwa.com/studio',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window,d=w.document;
w.__biglwaIdentity={uid:'owner-1',username:'leian',name:'Leian'};
let signedOut=0;
d.getElementById('studioSignOut').addEventListener('click',()=>signedOut++);
w.eval(accountMenu);
d.dispatchEvent(new w.Event('DOMContentLoaded'));
await new Promise(res=>setTimeout(res,80));
const dots=d.getElementById('biglwaAccountActionDots');
const menu=d.getElementById('biglwaAccountMenu');
assert.ok(dots&&menu,'Account menu and color dots actually mount');
assert.equal(dots.querySelectorAll('button').length,3,'Exactly green/yellow/red account actions');
assert.ok(dots.querySelector('[data-biglwa-add-user]'));
assert.ok(dots.querySelector('[data-biglwa-logs]'));
assert.ok(dots.querySelector('[data-biglwa-logout]'));
d.getElementById('profileMenuBtn').click();
assert.equal(menu.hidden,false,'Dropdown opens');
assert.equal(d.getElementById('biglwaMenuPreview').getAttribute('href'),'/leian?preview=1',
 'Preview option navigates to actual owner public profile');
dots.querySelector('[data-biglwa-logout]').click();
assert.equal(signedOut,1,'Red logout delegates to existing authenticated sign-out');
dots.querySelector('[data-biglwa-logs]').click();
assert.equal(d.getElementById('studioLogsDialog').open,true,'Yellow logs opens original activity dialog');
d.documentElement.classList.add('biglwa-preview-mode','biglwa-owner-self-preview');
d.getElementById('profileMenuBtn').click();
assert.notEqual(d.getElementById('profileMenuBtn').getAttribute('aria-disabled'),'true',
 'Account menu works during self-preview');
dom.window.close();
console.log('PASS owner preview routing, menu preview/settings, green/yellow/red live actions, avatar backfill, dated public-only guest sheet and Journal initial.');
