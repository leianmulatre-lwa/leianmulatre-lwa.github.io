import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../user-search-results.js',import.meta.url),'utf8');
const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('general conversation skips citation-source preparation',()=>{
 assert.match(source,/var sourcePreparation=needsResearchSources\?Promise\.all/);
 assert.match(source,/Promise\.resolve\(\[\[\],\[\]\]\)/);
 assert.match(source,/var answerPromise=lwaziMode==='off'\|\|\(options\.restore&&storedTurns\.length\)\?null:immediate\?Promise\.resolve\(immediate\):sourcePreparation\.then/);
 assert.doesNotMatch(source,/var answerPromise=immediate\?Promise\.resolve\(immediate\):Promise\.all/);
});
test('explicit research requests gather bounded sources',()=>{
 assert.match(source,/var needsResearchSources=wantsResearchSources\(clean\)/);
 assert.match(source,/libraryPromise,Promise\.race\(\[wikiDataPromise/);
 assert.match(source,/setTimeout\(function\(\)\{resolve\(\[\]\)\},1200\)/);
});
test('entrypoint loads new version of optimized search code',()=>{
 assert.match(index,/user-search-results\.js\?v=20261112-staging-direct-v6/);
});

test('search sources render independently as each category resolves',()=>{
 assert.match(source,/var discoveryParts=\[\[\],\[\],\[\],\[\],\[\],\[\]\],discoveryCompleted=0/);
 assert.match(source,/function renderDiscovery\(parts\)/);
 assert.match(source,/discoveryCompleted\+\+/);
 assert.match(source,/renderDiscovery\(discoveryParts\)/);
 assert.doesNotMatch(source,/Promise\.all\(\[userPromise,bookPromise,wikiPromise,libraryPromise,postPromise,songPromise\]\)/);
});
test('regular requests have a short bounded model wait and no second browser attempt after a failed bridge',()=>{
 assert.match(source,/__biglwaLwaziDeepThinking\?27000:13000/);
 assert.match(source,/if\(hookIssue\)return/);
 assert.match(source,/if\(!window\.__biglwaEnableBrowserLwazi\)return/);
});
