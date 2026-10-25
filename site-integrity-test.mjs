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
const feedView = read('feed-view.js');
const orbitPosts = read('orbit-posts.js');
const instagramOrbit = read('instagram-orbit.js');
const pinterestOrbit = read('pinterest-orbit.js');
const sqwipStyles = read('sqwip.css');
const mapRouteGuard = read('map-route-guard.js');
const politcRouteGuard = read('politc-route-guard.js');
const uiCoherence = read('ui-coherence.js');
const sessionRestore = read('session-restore.js');
const orbitLinks = read('orbit-account-links.js');
const orbitConnections = read('orbit-connections.js');
const orbitFeed = read('orbit-feed.js');
const projectCanvas = read('project-canvas.js');
const avatarStudio = read('avatar-studio-bitmoji-20261017-v3.js');
const veve = read('veve.js');
const sqwibPublic = read('sqwib-public.js');
const tiktokOrbit = read('tiktok-orbit.js');
const robots = read('robots.txt');
const sitemap = read('sitemap.xml');
const about = read('about/index.html');
const settings = read('settings/index.html');
const required = ['veve.js','veve.css','sqwib-public.js','base-v1.html','bootstrap-v2.html','studio-recovery.js','feed-polish.js','map-route-guard.js','politc-route-guard.js','orbit-account-links.js','avatar-studio-bitmoji-20261017-v3.js','assets/politc-nyame-baatanpa.svg','module-pages.js','studio-preview.js','pinterest-orbit.js','site-1.txt','site-2.txt','site-3.txt','site-4.txt','site-5.txt'];
for (const file of required) assert.ok(fs.existsSync(file), 'Missing runtime file: '+file);
assert.match(index, /<html lang="en">/);
assert.match(index, /const orbitBrandPlanetsCss=/);
assert.match(index, /\.orbit-grid button\{[\s\S]*?flex-direction:column!important/);
assert.match(index, /\.orbit-grid b,#studioApp \.orbit-grid small\{[\s\S]*?white-space:normal!important/);
assert.match(index, /position:relative!important;inset:auto!important/);
assert.doesNotMatch(index, /padding-right:38px/);
assert.match(index, /studio-recovery\.js\?v=/);
assert.match(index, /module-pages\.js\?v=/);
assert.match(index, /<noscript>/);
assert.match(index, /orbit-account-links\.js\?v=/);
assert.match(instagramOrbit, /authStateReady\(\)/);
assert.match(instagramOrbit, /result\.persisted/);
assert.match(instagramOrbit, /scopedSessionKey/);
assert.match(orbitPosts, /biglwaInstagramSession:/);
assert.match(orbitConnections, /recoverInstagramSession/);
assert.match(orbitLinks, /orbitLinksUpdatedAt/);
assert.match(orbitLinks, /mergeFields:/);
assert.match(modules, /--feed-heading-offset:calc/);
assert.match(modules, /module-workspace\[data-module-key="feed"\] :is\(\.module-top,\.module-heading\)/);
assert.match(modules, /module-workspace\[data-module-key="feed"\] \.module-heading h1\{\s*transform:none/);
assert.match(projectCanvas, /module-heading lwa-project-heading/);
assert.match(projectCanvas, /<h1>visualz<\/h1>/);
assert.match(projectCanvas, /visualslidez\.js\?v=/);
assert.match(modules, /visualz:'visualz'/);
assert.match(projectCanvas, /\.lwa-project-toolbar\{display:flex/);
assert.match(orbitFeed, /rim:'#f36b21'/); // Current Instagram: orange, not legacy purple.
assert.match(orbitFeed, /rim:'#772dcc'/); // TikTok: purple.
assert.match(index, /feed-polish\.js\?v=/);
assert.match(index, /project-canvas\.js\?v=/);
assert.match(index, /tiktok-orbit\.js\?v=20261024-myfeed-migration-proof-1/);
assert.match(feedPolish, /biglwa-feed-lights/);
assert.match(feedPolish, /data-feed-light/);
assert.match(feedPolish, /data-post-/);
assert.match(feedPolish, /data-live-feed-op/);
assert.match(feedView, /data-feed-owned/);
assert.match(projectCanvas, /CS Bergamot Stitched/);
assert.match(projectCanvas, /loadOrbitImagePicker/);
assert.match(projectCanvas, /uploadProjectImage/);
assert.match(projectCanvas, /media\/feed-image/);
assert.match(projectCanvas, /My first project/);
assert.match(projectCanvas, /storedOrbitImageUrls/);
assert.match(orbitPosts, /const paths=\['posts','archive'\]/);
assert.match(feedPolish, /top:8px;right:8px;left:auto/);
assert.match(instagramOrbit, /data-biglwa-hosted="pending"/);
// Asset URLs may use a versioned filename instead of a query parameter:
const avatarAsset=index.match(/\/(avatar-studio(?:-[a-z0-9-]+)?\.js)(?:\?v=[a-z0-9-]+)?/i);
assert.ok(avatarAsset,'Avatar Studio must be loaded in the site shell');
assert.ok(fs.existsSync(avatarAsset[1]),'Referenced Avatar Studio release file is missing');
for (const [label,pattern] of [
  ['Orbit OAuth', /\/(orbit-new-connect(?:-[a-z0-9-]+)?\.js)(?:\?v=[a-z0-9-]+)?/i],
  ['Arcade cabinet', /\/(arcade-(?:silhouette-corrected|folder-unified)(?:-[a-z0-9-]+)?\.css)(?:\?v=[a-z0-9-]+)?/i]
]){
  const asset=index.match(pattern);
  assert.ok(asset,label+' asset must be linked in the shell');
  assert.ok(fs.existsSync(asset[1]),label+' release file must exist');
}
assert.match(index, /veve\.css\?v=/);
assert.match(index, /veve\.js\?v=/);
assert.match(index, /sqwib-public\.js\?v=/);
assert.match(modules, /function renderVeve\(/);
assert.match(modules, /mobile\?'veve'/);
assert.match(modules, /sqwibPublishArea/);
assert.match(sqwibPublic, /allowResqwib/);
assert.match(sqwibPublic, /visibility:'public'/);
assert.match(veve, /where\('state','==','approved'\)/);
assert.match(veve, /BigLWASqwibs\.publicSqwibs/);
assert.match(veve, /vevePrefs/);
assert.match(instagramOrbit, /biglwaFeedImportStatusRail/);
const minecraftModel=read('avatar/minecraft-mannequin.js');
assert.match(avatarStudio, /\/avatar\/minecraft-mannequin\.js/);
assert.match(avatarStudio, /renderMinecraftModel/);
assert.match(avatarStudio, /data-avatar-kind="minecraft"/);
assert.match(avatarStudio, /data-minecraft-save/);
assert.match(minecraftModel, /function bodyPart/);
assert.match(minecraftModel, /function makeFace/);
assert.match(minecraftModel, /function defaultSkin/);
assert.match(minecraftModel, /pointermove/);
assert.doesNotMatch(avatarStudio, /skinview3d\.bundle\.min\.js/);
assert.match(avatarStudio, /studioAvatar:/);
// The active Xbox Avatar has no IMVU or nonworking Mii editor options.
assert.match(avatarStudio, /data-avatar-source="sona360"/);
assert.doesNotMatch(avatarStudio, /data-avatar-source="(?:mii|imvu)"/);
assert.match(avatarStudio, /renderSonaFrame/);
assert.match(avatarStudio, /data-sona-save/);
assert.match(avatarStudio, /profileAvatarEditor/);
assert.match(avatarStudio, /data-avatar-widget-action="enlarge"/);
assert.doesNotMatch(avatarStudio, /data-avatar-edit>/);
assert.match(avatarStudio, /--biglwa-top-slot-count/);
assert.match(avatarStudio, /grid-auto-rows:206px/);
assert.match(avatarStudio, /The pair is ONE card-sized slot/);
assert.match(avatarStudio, /grid-column:auto!important/);
assert.match(avatarStudio, /Avatar is an ordinary tab/);
assert.doesNotMatch(avatarStudio, /z-index:10040/);
assert.doesNotMatch(read('arcade-puzzles.html'), /data-tab="quest"/);
assert.match(read('avatar/arcade-character.js'), /biglwaQuestCompleted/);
assert.doesNotMatch(modules.slice(modules.indexOf('function renderGames(){'),modules.indexOf('const dykQuestions=[',modules.indexOf('function renderGames(){'))), /title:'character quest'/);
assert.doesNotMatch(veve, /id:'quest'/);
assert.doesNotMatch(avatarStudio, /data-avatar-unity-open/);

assert.match(tiktokOrbit, /CALLBACK_HANDOFF/);
assert.match(tiktokOrbit, /lastError/);
assert.match(modules, /orbit-main/); // Provider diagnostics are no longer injected into planet previews.
assert.match(modules, /orbitPageStatus/); // Detailed OAuth errors belong in the page status area.
assert.match(tiktokOrbit, /location\.origin \+ '\/studio\?view=orbit'/);

assert.match(feedView, /instagram: \{ rim:"#f36b21"/);

assert.match(modules, /function renderPolitc\(/);
assert.match(modules, /else if\(key==='politc'\)renderPolitc\(\)/);
assert.match(modules, /function miniCalendarMarkup\(/);
assert.match(modules, /miniCalendarMarkup\(\)/);
assert.match(modules, /window\.BigLWAOpenModule/);
assert.match(modules, /\(key==='map'\|\|key==='politc'\)/);
assert.match(index, /map-route-guard\.js\?v=/);
assert.match(mapRouteGuard, /window\.addEventListener\('click'/);
assert.match(index, /politc-route-guard\.js\?v=/);
assert.match(politcRouteGuard, /opener\('politc'\)/);
assert.match(politcRouteGuard, /stopImmediatePropagation/);
assert.match(uiCoherence, /'tools','politc'/);
assert.match(modules, /politc-nyame-baatanpa\.svg/);
assert.match(modules, /if\(key==='notes'\)/);
assert.doesNotMatch(modules, /if\(key==='diary'\)\{\s*\/\/ Diary journal and Sqwip/);
assert.match(sqwipStyles, /\[data-module-key="notes"\] \.diary-section-nav/);
assert.match(orbitPosts, /storedOrbitImageUrls/);
assert.match(orbitPosts, /if \(durable && !hosted\) return null/);
assert.match(feedView, /durableOrbitPhotos/);
assert.match(feedView, /data-feed-resync/);
assert.match(instagramOrbit, /hostedById/);
assert.match(pinterestOrbit, /hostedPinUrls/);
assert.match(index, /orbit-posts\.js\?v=/);
assert.match(modules, /\['map','politc'\]\.includes\(params\.get\('panel'\)\)/);
assert.match(sessionRestore, /\['map','politc'\]\.includes\(panel\)/);
assert.match(recovery, /data-open="politc"/);
assert.match(index, /feed-polish\.js\?v=/);
assert.match(feedPolish, /data-publish-connected/);
assert.match(feedPolish, /biglwa-card-options/);
assert.match(recovery, /biglwa-two-week-recovered/);
assert.match(robots, /Sitemap: https:\/\/biglwa\.com\/sitemap\.xml/);
assert.match(sitemap, /https:\/\/biglwa\.com\/about\//);
assert.match(about, /rel="canonical"/);
assert.match(settings, /noindex,nofollow/);
const mainScript=index.match(/<script>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(mainScript,'Missing main inline app loader');
for (const [name, source] of [['index inline loader',mainScript],['module pages',modules],['Studio recovery',recovery],['Feed polish',feedPolish],['Project canvas',projectCanvas],['Avatar Studio',avatarStudio],['Veve discovery',veve],['Sqwib public controls',sqwibPublic],['TikTok Orbit',tiktokOrbit],['Map route guard',mapRouteGuard],['Politc route guard',politcRouteGuard]]) {
  new vm.Script(source,{filename:name});
  console.log('PASS syntax:',name);
}
console.log('PASS source integrity: politc route, two-week calendar, public SEO and required runtime files');


// Visualz has one shared heading on both tabs; navigation replaces the
// former duplicate giant cards and preserves the existing editor.
const slides=read('visualslidez.js'),sharing=read('profile-module-sharing.js');
assert.match(projectCanvas, /root.innerHTML=pageHeading\+'<section id="lwaVisualSlides"/);
assert.match(projectCanvas, /root.innerHTML=pageHeading\+'<div class="visualz-top-row"/);
assert.match(projectCanvas, /<div class="lwa-project-toolbar"/);
assert.match(projectCanvas, /visual·eyez/);
assert.match(projectCanvas, /visual·slidez/);
assert.match(slides, /data-visualz-mode="visualslidez"/);
assert.match(sharing, /#lwaVisualSlides \.vs-buttons/);
assert.match(sharing, /lead\.after\(bar\)/);
assert.match(sharing, /biglwa:visualz-toolbar-ready/);
// TikTok imports belong only in MyFeed; connection outcomes stay owner-only.
assert.doesNotMatch(tiktokOrbit, /row\.append\(panel\)/);
assert.match(tiktokOrbit, /\[data-tiktok-public-import\]'\)\.forEach\(node=>node\.remove\(\)\)/);
assert.match(tiktokOrbit, /notified:false/);
assert.match(tiktokOrbit, /biglwa:studio-update/);
assert.match(tiktokOrbit, /<\/div><\/details>/);
