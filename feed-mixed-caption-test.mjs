import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=name=>readFileSync(new URL('./'+name,import.meta.url),'utf8');
const orbit=read('orbit-feed.js'),pages=read('module-pages.js'),feed=read('feed-view.js'),
  publisher=read('collective-publish.js'),html=read('index.html'),boot=read('account-boot.js');
for(const [p,source] of [['orbit-feed.js',orbit],['module-pages.js',pages],['collective-publish.js',publisher]]){
 assert.doesNotThrow(()=>new vm.Script(source,{filename:p}),p+' syntax');
}
assert.doesNotThrow(()=>new vm.Script(feed.replace(/^import .*$/gm,'').replace(/^export default .*$/gm,'').replace(/^export /gm,'')));
assert.match(pages,/id="feedComposerCaption" name="caption" maxlength="500"/);
assert.match(pages,/id="biglwaFeedStatus" role="status"/);
assert.match(pages,/id="biglwaFeedImportStatusRail"[^>]*hidden/);
assert.match(pages,/id="biglwaOrbitDrafts" hidden/);
assert.match(pages,/biglwa-feed-compose-actions/);
assert.ok(!pages.includes('No caption field is stored.'));
assert.ok(pages.includes('.biglwa-feed-compose-actions .module-action')&&pages.includes('width:auto!important'));
assert.ok(pages.includes('.biglwa-feed-photo-picker')&&pages.includes('max-width:100%'));
assert.ok(pages.includes('#feedComposerCaption')&&pages.includes('resize:vertical'));
assert.match(feed,/const caption = String\(data\.get\("caption"\) \|\| ""\)\.trim\(\)\.slice\(0,500\)/);
assert.match(feed,/createFeedDraft\(\{ url, blob: file \|\| null, caption \}\)/);
assert.match(publisher,/async function createFeedDraft\(\{url,blob,caption\}=\{\}\)/);
assert.ok(publisher.includes('caption:clean(caption).slice(0,500)'));
assert.ok(feed.includes('biglwa-lightbox-caption')&&feed.includes('esc(String(post.caption).slice(0,500))'));
assert.ok(feed.includes("esc(String(post.caption||'Collective feed media').slice(0,160))"));
assert.ok(html.includes('module-pages.js?v=20261017-orbit-geometry-1'));
assert.ok(html.includes('orbit-feed.js?v=20261015-mixed-source-6'));
assert.ok(html.includes('collective-publish.js?v=20261015-captions-2'));
assert.ok(boot.includes('feed-view.js?v=20261016-review-toggle-source-colors-4'));
console.log('PASS caption composer, Firestore persistence, expanded caption and responsive buttons');
const start=orbit.indexOf('  function feedSource(card){'),end=orbit.indexOf('  function sweep() {',start);
assert.ok(start>=0&&end>start,'mixing algorithm installed in provider mount sweep');
const helpers=new Function('document',orbit.slice(start,end)+'\nreturn {mixFeedCards,interleaveFeedSources,feedSource};')({
 activeElement:null
});
const card=(source,i)=>{
 const name=source==='instagram'?'instagram-feed-item':source==='pinterest'?'pinterest-feed-item':'facebook-feed-item';
 return {name:source+'-'+i,classList:{contains:value=>value===name},dataset:{},matches:selector=>selector.startsWith('.biglwa-pin-post,')};
};
const cards=[
 ...Array.from({length:24},(_,i)=>card('instagram',i)),
 ...Array.from({length:3},(_,i)=>card('facebook',i)),
 ...Array.from({length:3},(_,i)=>card('pinterest',i))
];
const mixed=helpers.mixFeedCards(cards);
assert.equal(mixed.length,cards.length);
assert.equal(new Set(mixed).size,cards.length,'no duplicate/replaced posts');
for(const source of ['instagram','facebook','pinterest']){
 const original=cards.filter(x=>x.name.startsWith(source));
 assert.deepEqual(mixed.filter(x=>x.name.startsWith(source)),original,'retain '+source+' chronological order');
}
const positions=src=>mixed.map((x,i)=>x.name.startsWith(src)?i:-1).filter(x=>x>=0);
assert.ok(Math.min(...positions('facebook'))<12&&Math.min(...positions('pinterest'))<12);
assert.ok(Math.max(...positions('facebook'))>17&&Math.max(...positions('pinterest'))>17,
 'rare sources are spread through the wall, not collected at the end');
// The layout pass should preserve nodes in-place once ordering is stable.
let mutations=0;const list={
 children:[...cards],
 contains:()=>false,
 append(...nodes){mutations++;this.children=[...nodes];}
};
helpers.interleaveFeedSources(list);
assert.equal(mutations,1);
assert.deepEqual(list.children,mixed);
helpers.interleaveFeedSources(list);
assert.equal(mutations,1,'observer does not loop on an unchanged wall');
console.log('PASS source-balanced masonry is stable across redraws and preserves each source order');
