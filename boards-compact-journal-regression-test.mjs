/* BIGLWA Boards single-row controls and permanent notebook cover. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
const read=path=>readFileSync(new URL('./'+path,import.meta.url),'utf8');
const pinterest=read('pinterest-orbit.js'),css=read('pinterest-boards.css'),
 module=read('module-pages.js'),index=read('index.html');
assert.doesNotThrow(()=>new Script(pinterest),'Pinterest Boards must be valid JavaScript');
assert.doesNotThrow(()=>new Script(module),'Journal module must be valid JavaScript');
assert.ok(index.includes('pinterest-orbit.js?v=20261028-oauth-return-2'),
 'Page must load new Boards UI instead of cached version');
assert.ok(pinterest.includes("pinterest-boards.css?v="),
 'New compact CSS must be loaded');
assert.ok(pinterest.includes('<h2>board</h2>'),'One-word board heading');
assert.ok(!pinterest.includes("panel.innerHTML='<h2>Pinterest boards</h2>"),'No duplicate Pinterest boards heading');
assert.ok(pinterest.includes('Pinterest connected')&&pinterest.includes('pn-orbit-planet'),'Pinterest source shown with planet status');
assert.ok(pinterest.includes('↗ Qwiklinkz')&&pinterest.includes('target="_blank" rel="noopener noreferrer"'),'Qwiklinkz opens connected profile in new tab');
assert.ok(pinterest.includes('pn-primary-head')&&pinterest.includes('pn-head-controls'),'Refresh and Sync on header row');
assert.ok(pinterest.includes('pn-new-board-combo')&&pinterest.includes('data-pn-new-board'),'Create new board at top-right');
assert.ok(pinterest.includes('data-pn-manage-boards')&&pinterest.includes("savedDrawerOpen=!savedDrawerOpen"),'Arrow beside New board reveals management');
assert.ok(pinterest.includes("authUid&&savedDrawerOpen?"),'Saved drawer only visible to signed-in owner and when intentionally opened');
assert.ok(pinterest.includes("savedBoardsMarkup()+'</div>':'')"),'Saved contents live in compact management drawer');
assert.ok(!pinterest.includes(":'')+savedBoardsMarkup()+originalPinsMarkup;"),'No lower always-open Saved on BIGLWA section');
assert.ok(pinterest.includes('id="pnActiveBoardTitle"'),'Active board selector explains its purpose');
assert.ok(pinterest.includes('pn-current-board-bar')&&pinterest.includes('pn-selection-toolbar'),'Single toolbar for choosing and privately saving');
assert.ok(pinterest.includes('hydrateBrowse(')&&pinterest.includes('Keep private in Archive'),'Boards automatically load additional pages and allow private saving');
assert.ok(pinterest.includes('publishSelection(ids,destination)')&&pinterest.includes("window.confirm('Post '"),'Board privacy is separate from myfeed publishing');
assert.ok(pinterest.includes('showAllBoards?entries:entries.slice(0,6)'),'Six recent boards appear, with other boards available on demand');
assert.ok(pinterest.indexOf('boardGrid(disabled)+')<pinterest.lastIndexOf("(originalView?originalPinsMarkup:'')"),'Original Pins follow boards');
assert.ok(css.includes('#pinterestBoards .pn-primary-head')&&css.includes('#pinterestBoards .pn-current-board-bar'),'Header and row styles scoped to Boards');
assert.ok(css.includes('flex-wrap:nowrap')&&css.includes('pn-board-view-actions'),'Single-line toolbar on desktop');
assert.ok(css.includes('position:absolute!important;z-index:60'),'Saved management is overlay, not full-page segment');
assert.ok(module.includes('The composition notebook is the permanent Studio thumbnail'),'Journal cover is permanent');
assert.ok(!module.includes("diaryPage.innerHTML='<div class=\"studio-diary-preview\""),'No saved-entry excerpt replaces notebook');
assert.ok(!module.includes("diaryPage.classList.toggle('has-saved-writing'"),'Saved writing never changes notebook appearance');
assert.ok(module.includes("window.__biglwaIdentity")&&module.includes("biglwaOwnProfileV1:'+uid"),'Real-name initial retrieved from owner-scoped identity');
assert.ok(module.includes("return (Array.from(name)[0]||'✦').toLocaleUpperCase()"),'Notebook shows actual name initial');
console.log('PASS compact Board header, Qwiklinkz, one-row active-board actions, private drawer, ordered board grid, and permanent owner-initial Journal cover');
