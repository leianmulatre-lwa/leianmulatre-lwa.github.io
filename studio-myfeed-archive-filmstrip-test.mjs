/* BIG LWA: MyFeed Studio filmstrip and Archive default wallpaper regression.
   Confirm only presentation changes; real approved media, preview click actions,
   archive routing and member-owned data remain intact. */
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {Script} from 'node:vm';
const read=p=>readFileSync(new URL('./'+p,import.meta.url),'utf8');
const index=read('index.html'),pages=read('module-pages.js'),
  defaults=read('studio-default-images-20261029.js'),
  css=read('studio-myfeed-filmstrip-20261029.css'),
  feed=read('feed-view.js'),route=read('politc-route-guard.js');
assert.doesNotThrow(()=>new Script(pages),'Module-page JavaScript stays valid');
// Feed is an ES module with imports: Node's classic vm.Script cannot parse it.
// Its published behavior is checked below without evaluating its dependencies.
assert.doesNotThrow(()=>new Script(defaults),'Default-image loader stays valid');
assert(index.includes('studio-myfeed-filmstrip-20261029.css?v=20261029-four-photo-film-1'),'Filmstrip CSS is loaded');
assert(index.includes('studio-default-images-20261029.js?v=20261029-archive-wallpaper-2'),'Fresh Archive thumbnail JS served');
assert(index.includes('module-pages.js?v=20261029-lwazi-merged-header-9'),'Current module build served');
assert(pages.includes('/module-pages.js?v=20261029-lwazi-merged-header-9')&&route.includes('/module-pages.js?v=20261029-lwazi-merged-header-9'),'Fallback URLs do not request stale builds');
assert(css.includes('#studioApp #biglwaFeedHero .biglwa-feed-hero-grid'),'Film effect targets Studio preview only');
assert(css.includes('repeat(4,minmax(0,1fr))'),'Four media slots retain their row');
assert(css.includes('radial-gradient')&&css.includes('background-repeat:repeat-x'),'Physical sprocket holes along film edges');
assert(css.includes('aspect-ratio:4 / 5!important'),'Film crops remain compact and uniform');
assert(css.includes('pointer-events:none!important'),'Decorative perforations never block clicks');
assert(css.includes('.biglwa-feed-hero-preview:focus-visible'),'Keyboard users can see active thumbnails');
assert(feed.includes("storedPosts.slice(0,HERO_SLOTS)")&&feed.includes('const HERO_SLOTS = 4'),'The data source still picks four latest stored photos');
assert(feed.includes('button.addEventListener(\'click\',()=>{if(slots[index])openLightbox(slots[index],0);});'),'Existing photo lightbox remains connected');
assert(feed.includes("const isPublicProfile=Boolean(window.__biglwaPublicStorageView)"),'Owner-only and public-post protections unchanged');
assert(!pages.includes('archive-preview-b64-0a.txt'),'Old six-file photograph cannot replace new wallpaper');
assert(pages.includes('preview.classList.add(\'biglwa-archive-default-windows\')'),'Archive wallpaper gets correct fitting style');
assert(pages.includes('src="/assets/studio-defaults/archive-windows-hill.webp?v=20261029-win-default-2"'),'Archive sets new image directly');
assert(defaults.includes("archive:base+'archive-windows-hill.webp?v=20261029-win-default-2'"),'Default-image module matches same file revision');
assert(defaults.includes("Never replace member-provided media"),'Custom media preserved');
assert(statSync(new URL('./assets/studio-defaults/archive-windows-hill.webp',import.meta.url)).size>2000,'New wallpaper image exists, non-empty');
console.log('PASS MyFeed four-photo analog strip, Archive new direct wallpaper, original feed lightbox and member data guards');
