/* BIG LWA: MyFeed Studio filmstrip and Archive default wallpaper regression.
   Confirm only presentation changes; real approved media, preview click actions,
   archive routing and member-owned data remain intact. */
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {Script,runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('./'+p,import.meta.url),'utf8');
const index=read('index.html'),pages=read('module-pages.js'),
  defaults=read('studio-default-images-20261029.js'),
  css=read('studio-myfeed-filmstrip-20261029.css'),
  feed=read('feed-view.js'),route=read('politc-route-guard.js');
assert.doesNotThrow(()=>new Script(pages),'Module-page JavaScript stays valid');
// Feed is an ES module with imports: Node's classic vm.Script cannot parse it.
// Its published behavior is checked below without evaluating its dependencies.
assert.doesNotThrow(()=>new Script(defaults),'Default-image loader stays valid');
assert(index.includes('studio-myfeed-filmstrip-20261029.css?v=20261029-dark-photo-negative-2'),'Filmstrip CSS is loaded');
assert(index.includes('studio-default-images-20261029.js?v=20261029-archive-wallpaper-2'),'Fresh Archive thumbnail JS served');
assert(index.includes('module-pages.js?v=20261029-lwazi-merged-header-9'),'Current module build served');
assert(pages.includes('/module-pages.js?v=20261029-lwazi-merged-header-9')&&route.includes('/module-pages.js?v=20261029-lwazi-merged-header-9'),'Fallback URLs do not request stale builds');
assert(css.includes('#studioApp #biglwaFeedHero .biglwa-feed-hero-grid'),'Film effect targets Studio preview only');
assert(css.includes('repeat(4,minmax(0,1fr))'),'Four media slots retain their row');
assert(css.includes('background:repeating-linear-gradient(90deg,')&&css.includes('.biglwa-feed-hero-grid::before')&&css.includes('.biglwa-feed-hero-grid::after'),'Current rectangular film perforations along both edges');
assert(css.includes('aspect-ratio:3 / 2!important'),'Four photo apertures retain consistent landscape proportions');
assert(css.includes('pointer-events:none!important'),'Decorative perforations never block clicks');
assert(css.includes('.biglwa-feed-hero-preview:focus-visible'),'Keyboard users can see active thumbnails');
assert(feed.includes("const storedPosts=previewPosts.filter(post=>heroPhotoUrl(post))")&&feed.includes('const HERO_SLOTS = 4'),'Four photo-only slots exclude video posters');
assert(feed.includes('openLightbox(post,Math.max(0,slideUrls(post).indexOf(selected)))'),'Filmstrip photo opens at the selected frame in the existing lightbox');
assert(index.includes('account-boot.js?v=20261029-feed-photos-only-2'),'Fresh account bootstrap on the live site');
assert(read('account-boot.js').includes('feed-view.js?v=20261029-contact-sheet-photo-only-2'),'Feed module cache version changes');
assert(css.includes('background:#171514!important')&&css.includes('padding:0!important'),'White outer card is removed');
const begin=feed.indexOf('const heroPhotoUrl = post => {'),end=feed.indexOf('\nlet heroOn =',begin);
assert(begin>=0&&end>begin,'Photograph selector is present');
const sandbox={
 pictureUrls:p=>p.testUrls||[],
 looksLikeVideoFile:u=>/\.(mp4|mov|m4v|webm)(\?|#|$)/i.test(String(u||'')),
 playableVideo:p=>p.videoUrl||'',
 orbitUrlFromKey:key=>key?'https://biglwa-instagram-api.leianmulatre-284.workers.dev/media/orbit/'+key:'',
 managedOrbitUrl:url=>String(url||'').includes('/media/orbit/')
};
runInNewContext(feed.slice(begin,end)+'\nthis.pickPhoto=heroPhotoUrl;',sandbox);
const photo='https://example.com/portrait.jpg',poster='https://example.com/reel-poster.jpg',video='https://example.com/reel.mp4';
const picture={mediaItems:[{isPicture:true,url:photo}],testUrls:[photo]};
const videoOnly={mediaItems:[{isPicture:false,url:video,thumbnailUrl:poster}],testUrls:[poster]};
const mixed={mediaItems:[{isPicture:false,url:video,thumbnailUrl:poster},{isPicture:true,url:photo}],testUrls:[poster,photo]};
const oldVideo={videoUrl:video,testUrls:[poster]};
const oldPhoto={imageUrl:photo,testUrls:[photo]};
assert.equal(sandbox.pickPhoto(picture),photo,'Real photographs enter the strip');
assert.equal(sandbox.pickPhoto(videoOnly),'','Video-only posters are excluded');
assert.equal(sandbox.pickPhoto(mixed),photo,'Mixed posts show their actual photograph');
assert.equal(sandbox.pickPhoto(oldVideo),'','Legacy video poster is excluded');
assert.equal(sandbox.pickPhoto(oldPhoto),photo,'Legacy image-only posts still qualify');
assert(feed.includes("const isPublicProfile=Boolean(window.__biglwaPublicStorageView)"),'Owner-only and public-post protections unchanged');
assert(!pages.includes('archive-preview-b64-0a.txt'),'Old six-file photograph cannot replace new wallpaper');
assert(pages.includes('preview.classList.add(\'biglwa-archive-default-windows\')'),'Archive wallpaper gets correct fitting style');
assert(pages.includes('src="/assets/studio-defaults/archive-windows-hill.webp?v=20261029-win-default-2"'),'Archive sets new image directly');
assert(defaults.includes("archive:base+'archive-windows-hill.webp?v=20261029-win-default-2'"),'Default-image module matches same file revision');
assert(defaults.includes("Never replace member-provided media"),'Custom media preserved');
assert(statSync(new URL('./assets/studio-defaults/archive-windows-hill.webp',import.meta.url)).size>2000,'New wallpaper image exists, non-empty');
console.log('PASS MyFeed four-photo analog strip, Archive new direct wallpaper, original feed lightbox and member data guards');
