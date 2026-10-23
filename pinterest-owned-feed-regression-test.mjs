// Pinterest originals must not be confused with saved board content.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=name=>readFileSync(new URL('./'+name,import.meta.url),'utf8');
const pn=read('pinterest-orbit.js'),worker=read('cloudflare-worker-instagram.js');
const posts=read('orbit-posts.js'),feed=read('feed-view.js');
const pages=read('module-pages.js'),html=read('index.html'),css=read('pinterest-created-feed-20261016.css');
assert.doesNotThrow(()=>new vm.Script(pn),'Pinterest browser must parse');
const feedModule=feed.replace(/^import .*$/gm,'').replace(/^export default .*$/gm,'').replace(/^export /gm,'');
assert.doesNotThrow(()=>new vm.Script(feedModule),'Feed ES module body must parse');
assert.match(worker,/path === '\/pinterest\/pins' \? '\/pins'/,'GET /pins is separate from board Pins');

assert.ok(worker.includes("target.searchParams.set('pin_filter','exclude_repins')"),'Repins are not imported as the creator own originals');
assert.ok(pn.includes("api('pins'+suffix)")&&pn.includes("await importPinsToAccount(originals)"),'Original user Pins import to profile');
assert.ok(!pn.includes('await importPinsToAccount(nextItems)'),'Board saves do not become profile posts');
assert.ok(pn.includes('data-pn-more-created'),'Owner Pin pagination is available');
assert.ok(pn.includes("||image(p);const id="),'Saved board thumbnails remain visible without reimport');
assert.ok(!pn.includes("BIGLWAFeedMount('Pinterest'"),'Saved board Pins are not mounted publicly');
assert.ok(posts.includes("pinterestOrigin: raw?.biglwaPinterestOrigin === 'created'"),'Original Pin identity is persisted');
assert.ok(feed.includes('p.pinterestOrigin==="created"'),'Feed review excludes saved board Pins');
assert.ok(pages.includes('id="feedOrbitDraftToggle"')&&pages.includes('id="biglwaFeedSort"'),'Feed review toggle and sort exist');
assert.ok(feed.includes('let draftTrayOpen = false')&&feed.includes('panel.hidden=!draftTrayOpen||!drafts.length'),'Private drafts are collapsed at first load');
assert.ok(feed.includes('sortedFeed(scoped).map((post) => {')&&feed.includes('posts.filter(usablePost).filter(post=>{'),'Sort control changes public Feed order');
assert.ok(!feed.includes('biglwa-draft-card:nth-child(6n+2)'),'No yellow/orange alternating Pinterest draft colors');
assert.ok(feed.includes('data-draft-source="pinterest"')&&feed.includes('#e60023'),'Draft shadows reflect Pinterest source red');
assert.ok(css.includes('#pinterestBoards .pinterest-owned-grid'),'Boards and created Pin previews are separate');
assert.ok(html.includes('pinterest-created-feed-20261016.css?v='),'New UI styles reach GitHub Pages');
console.log('PASS Pinterest originals, board saves, private review, owner pagination, source red, and Feed sort');

