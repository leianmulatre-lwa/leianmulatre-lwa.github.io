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
assert(index.includes('studio-myfeed-filmstrip-20261029.css?v=20261029-orbit-rainbow-film-3'),'Filmstrip CSS is loaded');
assert(index.includes('studio-default-images-20261029.js?v=20261029-archive-wallpaper-2'),'Fresh Archive thumbnail JS served');
assert(index.includes('module-pages.js?v=20261029-single-panel-10'),'Current module build served');
assert(pages.includes('/module-pages.js?v=20261029-single-panel-10')&&route.includes('/module-pages.js?v=20261029-single-panel-10'),'Fallback URLs do not request stale builds');
assert(css.includes('#studioApp #biglwaFeedHero .biglwa-feed-hero-grid'),'Film effect targets Studio preview only');
assert(css.includes('repeat(4,minmax(0,1fr))'),'Four media slots retain their row');
assert(css.includes('background:repeating-linear-gradient(90deg,')&&css.includes('.biglwa-feed-hero-grid::before')&&css.includes('.biglwa-feed-hero-grid::after'),'Current rectangular film perforations along both edges');
assert(css.includes('aspect-ratio:3 / 2!important'),'Four photo apertures retain consistent landscape proportions');
assert(css.includes('pointer-events:none!important'),'Decorative perforations never block clicks');
assert(css.includes('.biglwa-feed-hero-preview:focus-visible'),'Keyboard users can see active thumbnails');
assert(feed.includes("const storedPosts=previewPosts.filter(post=>heroPhotoUrl(post))")&&feed.includes('const HERO_SLOTS = 4'),'Four photo-only slots exclude video posters');
assert(feed.includes('openLightbox(post,Math.max(0,slideUrls(post).indexOf(selected)))'),'Filmstrip photo opens at the selected frame in the existing lightbox');
assert(index.includes('account-boot.js?v=20261029-film-shuffle-3'),'Fresh account bootstrap on the live site');
assert(read('account-boot.js').includes('feed-view.js?v=20261029-owned-photo-shuffle-3'),'Feed module cache version changes');
assert(css.includes('background:#171514!important')&&css.includes('padding:0!important'),'White outer card is removed');
assert(css.includes("/* Orbit's rainbow signature") && css.includes('.biglwa-feed-hero-head span::after'),
  'Orbit-inspired rainbow is confined to the existing counter, not the member photos');
assert(css.includes('#e45a65') && css.includes('#69b984') && css.includes('#9d83c9'),
  'Rainbow accents include red, green and violet');
assert(css.includes('radial-gradient(circle at 13% 32%') && css.includes('repeating-linear-gradient(0deg,transparent 0 22px'),
  'Subtle emulsion grain and scratches are applied behind photo frames');
assert(css.includes('pointer-events:none!important'),
  'Color ribbon is decorative and cannot intercept clicks');

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


/* Four MyFeed frames must be shuffled from the signed-in or viewed member's
   approved picture pool, never copied from the public wall or stock samples. */
assert(feed.includes("const previewPosts=isPublicProfile?posts:(verifiedUid&&studioOwnerUid===verifiedUid?studioOwnPosts:[])"),
  'Owner contact strip stays scoped to the signed-in UID, never the public wall');
assert(feed.includes("post.state==='approved'&&heroPhotoUrl(post)"),
  'Draft, archived and pending-deletion posts never enter the shuffle');
assert(feed.includes("anchor.hidden=!storedPosts.length&&!requiresSync"),
  'A profile with no pictures does not show fixed default photos');
assert(feed.includes("window.setInterval(shuffleVisibleHero,HERO_SHUFFLE_MS)") &&
  feed.includes("const HERO_SHUFFLE_MS = 45000"),
  'Four-photo preview reshuffles periodically without changing post data');
assert(feed.includes("document.hidden") && feed.includes("anchor.matches(':hover,:focus-within')"),
  'Shuffling pauses for hidden tabs, hovered film or keyboard interaction');
const shuffleBegin=feed.indexOf('const heroPostKey = post =>');
const shuffleEnd=feed.indexOf('\nfunction renderHero(',shuffleBegin);
assert(shuffleBegin>=0&&shuffleEnd>shuffleBegin,'Shuffle helper is present');
const shuffleEnv={heroPhotoUrl:post=>post.imageUrl,HERO_SLOTS:4};
runInNewContext(feed.slice(shuffleBegin,shuffleEnd)+'\nthis.pick=shuffleHeroPosts;',shuffleEnv);
const pictures=Array.from({length:10},(_,i)=>({id:'member-'+i,imageUrl:'https://example.com/real-'+i+'.jpg'}));
const beforeOrder=pictures.map(p=>p.id);
const frameOne=shuffleEnv.pick(pictures);
const frameTwo=shuffleEnv.pick(pictures,frameOne.map(p=>p.id+':'+p.imageUrl));
assert.equal(frameOne.length,4,'Exactly four actual photos are selected');
assert.equal(new Set(frameOne.map(p=>p.id)).size,4,'No duplicate photographs in four slots');
assert.equal(new Set(frameTwo.map(p=>p.id)).size,4,'Reshuffled frames remain unique');
assert(frameTwo.every(p=>!frameOne.includes(p)),'When enough photos exist, next shuffle avoids current photos');
assert.deepEqual(pictures.map(p=>p.id),beforeOrder,'Shuffling never mutates the stored feed order');
const few=pictures.slice(0,3);
const fewOne=shuffleEnv.pick(few);
const fewTwo=shuffleEnv.pick(few,fewOne.map(p=>p.id+':'+p.imageUrl));
assert.notDeepEqual(fewTwo.map(p=>p.id),fewOne.map(p=>p.id),
  'Smaller photo collections still change order rather than repeat unchanged');
assert.deepEqual(shuffleEnv.pick([]),[],'Empty library does not invent default photos');

// Archive preview image becomes grayscale only while hovering the Studio widget;
// imported/member media, photo dimensions and navigation are not rewritten.
const defaultStyle=read('studio-default-images-20261029.css');
assert(index.includes('studio-default-images-20261029.css?v=20261029-archive-bw-hover-3'),'Current Archive grayscale stylesheet is served');
assert(defaultStyle.includes('#studioApp #archive:hover .archive-photo-preview img'),'Entire Studio Archive widget triggers grayscale on hover');
assert(defaultStyle.includes('#studioApp #archive:hover .archive-photo-preview.biglwa-archive-default-windows img.biglwa-windows-archive-photo'),'Default Windows thumbnail wins specificity over its original filter:none!important');
assert(defaultStyle.includes('filter:grayscale(1)!important'),'Hover makes preview black-and-white');
assert(defaultStyle.includes('transition:filter 1100ms ease-in-out!important'),'Grayscale fades gradually in and out over 1.1 seconds');
assert(defaultStyle.includes('@media(prefers-reduced-motion:reduce)'),'Reduced-motion users do not receive extra animation');
assert(!defaultStyle.includes('#studioApp #archive:hover{filter:'),'Only the photo changes, not the Archive text or buttons');
console.log('PASS MyFeed four-photo analog strip, Archive new direct wallpaper, original feed lightbox and member data guards');
