import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../user-search-results.js',import.meta.url),'utf8');
const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('general conversation skips citation-source preparation',()=>{
 assert.match(source,/var sourcePreparation=needsResearchSources\?Promise\.all/);
 assert.match(source,/Promise\.resolve\(\[\[\],\[\]\]\)/);
 assert.match(source,/var answerPromise=immediate\?Promise\.resolve\(immediate\):sourcePreparation\.then/);
 assert.doesNotMatch(source,/Promise\.all\(\[libraryPromise,Promise\.race\(\[wikiDataPromise/);
});
test('research still gathers bounded sources',()=>{
 assert.match(source,/var needsResearchSources=/);
 assert.match(source,/libraryPromise,Promise\.race\(\[wikiDataPromise/);
 assert.match(source,/setTimeout\(function\(\)\{resolve\(\[\]\)\},1200\)/);
});
test('entrypoint loads new version of optimized search code',()=>{
 assert.match(index,/user-search-results\.js\?v=20261107-fast-answer-v2/);
});
