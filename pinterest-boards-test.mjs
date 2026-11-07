import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const frontend=readFileSync(new URL('./pinterest-orbit.js',import.meta.url),'utf8');
const index=readFileSync(new URL('./index.html',import.meta.url),'utf8');

assert.ok(frontend.includes('data-pn-connect'), 'Pinterest connect tiles are buttons');
assert.ok(frontend.includes("window.openBIGLWAModule('boards')"), 'OAuth returns to Boards');
assert.ok(frontend.includes('pinterestVerifier'), 'PKCE verifier retained through OAuth');
assert.ok(frontend.includes("location.assign(API+'start?challenge='+encodeURIComponent(challenge)+'&return_to='+encodeURIComponent(returnTo))"), 'PKCE challenge and same-origin return used');
assert.ok(frontend.includes('firebaseIdToken:token'), 'Firebase account attached to handoff');
assert.ok(frontend.includes('session/account') && frontend.includes('session/claim'), 'account recovery supported');
assert.ok(frontend.includes("const scopedKey=uid=>KEY+':'+uid"), 'sessions isolated by Firebase UID');
assert.ok(frontend.includes('data-pn-sync'), 'profile-sync control is rendered');
assert.ok(frontend.includes("api('pins'+suffix)") && frontend.includes("await importPinsToAccount(originals)"), 'Only original Pins import privately to profile');
assert.ok(!frontend.includes('await importPinsToAccount(nextItems)'), 'Saved board Pins remain in Boards');
assert.ok(index.includes('pinterest-orbit.js?v='), 'browser loads new frontend');
assert.ok(index.includes('orbit-posts.js?v='), 'browser loads fixed importer');
console.log('11 Pinterest Boards checks passed');

assert.ok(frontend.includes("const PENDING_KEY='biglwaPinterestPendingHandoffV2'"),'Pending callback survives a transient auth restore failure');
assert.ok(frontend.includes("mapping.session!==result.session"),'Account binding is confirmed using the recovery endpoint');
assert.ok(frontend.includes("biglwa:pinterest-status"),'Verified Pinterest status is published to Orbit');

const worker=readFileSync(new URL('./cloudflare-worker-instagram.js',import.meta.url),'utf8');
const css=readFileSync(new URL('./pinterest-boards.css',import.meta.url),'utf8');
const pages=readFileSync(new URL('./module-pages.js',import.meta.url),'utf8');
const menu=readFileSync(new URL('./account-menu.js',import.meta.url),'utf8');
const feed=readFileSync(new URL('./feed-view.js',import.meta.url),'utf8');
assert.ok(css.includes('#pinterestBoards .pinterest-pin-grid{display:block;columns:'),'Pin images flow naturally in masonry columns');
assert.ok(css.includes('height:auto!important'),'Pin photographs are no longer fixed-height');
assert.ok(css.includes('box-shadow:4px 5px 0 #ce2842'),'Pins have red Pinterest-inspired shadows');
assert.ok(css.includes('height:218px'),'Boards are tall enough to show multiple photos');
assert.ok(frontend.includes('coverEntry?.images'),'board covers use multiple images');
assert.ok(frontend.includes('data-pn-publish'),'Pin cards can publish to Collective');
assert.ok(frontend.includes('data-pn-save-pin'),'Pin cards can save into Big LWA boards');
assert.ok(frontend.includes('data-pn-new-board'),'Big LWA saved board creation exists');
assert.ok(frontend.includes('data-pn-rename-board')&&frontend.includes('data-pn-remove-board'),'Saved board management exists');
assert.ok(frontend.includes('data-pn-edit-saved')&&frontend.includes('data-pn-remove-saved'),'Saved Pin edit and removal exists');
assert.ok(frontend.includes("getPreview(){"),'Studio Boards can use actual Pinterest Pins');
assert.ok(pages.includes('biglwa:pinterest-preview-updated'),'Studio Boards listens for fresh Pins');
assert.ok(pages.includes('studio-map-mini'),'Studio Map has saved marker preview');
assert.ok(pages.includes('Reload map only'),'Map errors offer in-place recovery');
assert.ok(worker.includes("key='pinterest/saved/'+user.uid+'/library.json'"),'Saved collections persist account-scoped in R2');
assert.ok(worker.includes("return json({ok:true,library}"),'Worker responds with persisted Saved collection');
assert.ok(!menu.includes("document.querySelectorAll('.login-public-footer nav, .site-policy-footer nav').forEach(addFooterLink)"),'Login footer no longer adds Settings link');
assert.ok(menu.includes("document.querySelectorAll('.login-public-footer nav a[href=\"/settings\"]').forEach(link=>link.remove())"),'old cached Settings link is removed from login footer');
assert.ok(feed.includes("const storedPosts=previewPosts.filter(post=>post.state==='approved'&&heroPhotoUrl(post))")&&feed.includes("const withImage=storedPosts;"),'Studio Feed preview count uses the filtered picture list');
console.log('Pinterest masonry, Saved, Studio and login footer regressions passed');

// The Studio thumbnail was intentionally redesigned from the old six-tile
// strip to a portrait-and-four mosaic. These assertions must track the live
// canonical Pinterest gallery rather than resurrect the obsolete renderer.
const studioThumb=readFileSync(new URL('./pinterest-red-consistency-20261016.css',import.meta.url),'utf8');
assert.ok(pages.includes('window.__biglwaRefreshBoardsThumbnail?.()'),'Studio delegates to the canonical Boards photo gallery');
assert.ok(frontend.includes('photos.length>=5'),'Studio gallery never exceeds five genuine photos');
assert.ok(frontend.includes("gallery.dataset.count=String(photos.length)"),'Studio gallery preserves actual photo count');
assert.ok(studioThumb.includes('grid-template-columns:minmax(0,1.24fr) repeat(2,minmax(0,1fr))'),
  'Studio Boards has the requested portrait-and-four layout');
assert.ok(!pages.includes("tiles.slice(0,6).map((item,i)=>"),'Old six-tile Studio renderer stays removed');
assert.ok(pages.includes("const linked=Boolean(window.__biglwaPinterest?.state?.connected)"),'the thumbnail reads verified Pinterest connection state');
assert.ok(pages.includes('Connect Pinterest to preview your Pins'),'owner sees an honest Connect prompt when no genuine photos exist');
assert.ok(pages.includes("studio-mini-map-open"),'the Studio map has an open-full-map action');
assert.ok(pages.includes("mini.loading='eager'"),'real mini-map loads on Studio without scrolling to it');
console.log('Studio Boards five-photo portrait mosaic and interactive Map checks passed');
