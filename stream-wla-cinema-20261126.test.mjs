import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import vm from 'node:vm';
const read=p=>readFileSync(new URL('./'+p,import.meta.url),'utf8');
test('WLA on-demand shelf does not schedule or auto-tune TV',()=>{
 const js=read('stream-guide.js');new vm.Script(js);
 assert.match(js,/wla-skull-mask/);assert.match(read('stream-guide.css'),/assets\/wla-skull-mask\.png/);
 assert.match(js,/\['entertainment','news','wla'\]/);
 assert.match(js,/state\.category==='lwa-tv'&&state\.tvSection==='wla'\)\)return/);
 assert.match(js,/if\(onDemand\)return/);
 assert.match(js,/mountWla\(copy,detail\);return/);
 const wla=js.slice(js.indexOf('function mountWla('),js.indexOf('function renderCategory('));
 assert.doesNotMatch(wla,/<iframe|<script|cinejoy/i);
 assert.doesNotMatch(wla,/justwatch\.com|target="_blank".*method="get"/);
 assert.match(wla,/event\.preventDefault\(\)/);
 assert.match(wla,/api\.tvmaze\.com\/search\/shows/);
 assert.match(wla,/wlaMovieSearch\(query,controller.signal\)/);
 assert.match(js,/wikidata\.org\/w\/api\.php/);
 assert.match(wla,/api\.tvmaze\.com\/shows\//);
 assert.match(wla,/video\.controls=true/);
 for(const file of ['index.html','studio/index.html','404.html','live-studio-shell.html'])assert.equal((read(file).match(/&wla=20261127-5/g)||[]).length,2);
});

test('movie metadata falls back to the original search label when the detailed record omits it',async()=>{
 const js=read('stream-guide.js');const start=js.indexOf('async function wlaMovieSearch('),end=js.indexOf('function mountWla(',start);
 const scope={encodeURIComponent,wlaJSON:async url=>url.includes('wbsearchentities')?{search:[{id:'Q83495',label:'The Matrix',description:'1999 science fiction film'}]}:{entities:{Q83495:{id:'Q83495',claims:{P31:[{mainsnak:{datavalue:{value:{id:'Q11424'}}}}]}}}}};
 vm.runInNewContext(js.slice(start,end)+';globalThis.search=wlaMovieSearch;',scope);
 const rows=await scope.search('The Matrix');assert.equal(rows[0].title,'The Matrix');assert.equal(rows[0].year,'1999');
});
