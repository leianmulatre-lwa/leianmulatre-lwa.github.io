import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('./'+p,import.meta.url),'utf8');
const entry=read('index.html'), modules=read('module-pages.js'), css=read('orbit-cards-unified-20261016.css');
const original=read('bootstrap-v2.html');
const expected={
  'module-pages.js':'20261017-orbit-inline-links-1',
  'orbit-cards-unified-20261016.css':'20261017-orbit-inline-links-1',
  'arcade-silhouette-corrected-20261017.css':'20261017-side-depth-7',
  'pinterest-orbit.js':'20261017-boards-label-3',
  'orbit-preview-eight-20261016.js':'20261016-featured-refill-4',
  'account-boot.js':'20261017-feed-provider-fix-5'
};
for(const [path,version] of Object.entries(expected)){
 assert.ok(entry.includes('/'+path+'?v='+version),'Entry point must load current '+path);
}
const assetRefs=[...entry.matchAll(/(?:src|href)="\/([^"?#]+)\?v=([^"]+)"/g)].map(([,path])=>path);
const codeAssets=assetRefs.filter(path=>/\\.(?:js|css)$/i.test(path));
assert.equal(codeAssets.length,new Set(codeAssets).size,'No duplicated executable JavaScript or CSS assets');
// Reusing an image for preload and actual display is intentional.
assert.match(modules,/function orbitLinkEditor\(k,name,url\)/,'Link editor in current renderer');
assert.match(modules,/data-orbit-edit-link="\$\{k\}"/,'Link action is in the same row as Connect');
assert.doesNotMatch(modules,/<div class="orbit-link-utility">/,'Do not reintroduce separate profile link row');
assert.match(modules,/grid\.dataset\.orbitSized='140'/,'Compact 140px cards actually enforced');
assert.match(css,/\.orbit-link-dialog\[open\]/,'Link dialogs have working modal styling');
assert.doesNotMatch(modules,/module-pages\.js\?v=20261015-provider-setup-9/,'No stale renderer retry path');
assert.ok(original.includes('id=\\"orbitGrid\\"'),'Studio shell contains Orbit grid');
console.log('PASS: active entry versions, single assets, compact Orbit dialog, no legacy render fallback');
