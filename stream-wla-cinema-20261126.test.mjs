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
 assert.match(js,/api\.tvmaze\.com\/search\/shows/);
 assert.match(wla,/wlaSearchTitles\(query,controller.signal\)/);
 assert.match(js,/wikidata\.org\/w\/api\.php/);
 assert.match(wla,/api\.tvmaze\.com\/shows\//);
 assert.match(wla,/video\.controls=true/);
 for(const file of ['index.html','studio/index.html','404.html','live-studio-shell.html'])assert.equal((read(file).match(/&wla=20261127-7/g)||[]).length,2);
});

test('movie metadata falls back to the original search label when the detailed record omits it',async()=>{
 const js=read('stream-guide.js');const start=js.indexOf('async function wlaMovieSearch('),end=js.indexOf('async function wlaSearchTitles(',start);
 const scope={encodeURIComponent,wlaJSON:async url=>url.includes('wbsearchentities')?{search:[{id:'Q83495',label:'The Matrix',description:'1999 science fiction film'}]}:{entities:{Q83495:{id:'Q83495',claims:{P31:[{mainsnak:{datavalue:{value:{id:'Q11424'}}}}]}}}}};
 vm.runInNewContext(js.slice(start,end)+';globalThis.search=wlaMovieSearch;',scope);
 const rows=await scope.search('The Matrix');assert.equal(rows[0].title,'The Matrix');assert.equal(rows[0].year,'1999');
});


test('WLA shows source labels only for reviewed playback and provider entries',()=>{
 const js=read('stream-guide.js');const start=js.indexOf('const wlaOpenFilms='),end=js.indexOf('let wlaDaily=',start);const scope={};
 vm.runInNewContext(js.slice(start,end)+';globalThis.rows=wlaMerge(wlaOpenFilms,wlaTubiTitles);',scope);
 const general=scope.rows.find(x=>x.title==='The General');assert(general.video&&general.tubi);
 assert(scope.rows.filter(x=>x.video).length>=4);assert(scope.rows.filter(x=>x.tubi).length>=3);
 assert.match(js,/api\.tvmaze\.com\/schedule\?country=US/);assert.match(js,/browseToday\(\)/);
 assert.match(js,/WLA · free here/);assert.match(js,/Tubi · free with ads/);assert.match(js,/Title info only/);
 assert.match(js,/no sponsorship is implied/);
});


test('global discovery reuses WLA search and hands the selected title to Stream',()=>{
 const js=read('stream-guide.js'),search=read('user-search-results.js'),extras=read('lwazi-discovery-extras.js');
 assert.match(js,/searchWla:wlaGlobalSearch,openWlaSearchResult/);
 assert.match(js,/wlaPending=item/);assert.match(js,/renderRows\(\);select\(rows\[0\]\)/);
 assert.match(search,/searchWla\?\.\(clean\)/);assert.match(search,/extras\.wlaCards\?\.\(parts\[8\]\)/);
 assert.match(extras,/data-bl-wla-title/);assert.match(extras,/openWlaSearchResult\?\.\(id\)/);
 assert.match(extras,/WLA · Free here/);assert.match(extras,/Tubi · Free with ads/);
});
