import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=name=>readFileSync(new URL('./'+name,import.meta.url),'utf8');
const catalog=read('politc-poster-catalog-20261114.js');
const studio=read('module-pages.js');
const posterCSS=read('politc-poster-collection-20261114.css');
const songCSS=read('lwazi-search-result-bounds-20261114.css');
const shells=['index.html','studio/index.html','404.html','live-studio-shell.html'];
const originalCounts={hunting:6,cunting:22};
function data(){
 const window={};
 vm.runInNewContext(catalog,{window});
 return window.BigLWAPolitcPosterCatalog;
}
test('Politic includes exactly 100 hunting and 100 cunting curated subjects',()=>{
 const collection=data();
 assert.equal(collection.hunting.length+originalCounts.hunting,100);
 assert.equal(collection.cunting.length+originalCounts.cunting,100);
 const rows=collection.hunting.concat(collection.cunting);
 assert.equal(new Set(rows.map(x=>x.id)).size,rows.length,'IDs are stable and unique');
 assert.equal(new Set(rows.map(x=>x.name)).size,rows.length,'No accidental duplicate subject');
 for(const row of rows){
  assert(row.id.startsWith('curated-'));
  assert(['hunting','cunting'].includes(row.category));
  assert(['living','deceased','unknown'].includes(row.life));
  assert(row.note.length>=30&&row.note.length<240);
  assert.equal(new URL(row.source).hostname,'en.wikipedia.org');
  assert.equal(row.curated,true);
 }
 assert.match(studio,/curated\.push\(\.\.\.catalog\.hunting,\.\.\.catalog\.cunting\)/);
});
test('user-provided 25 names are represented without claiming nonexistent convictions',()=>{
 const c=data().hunting;
 for(const name of ['Adolf Hitler','Bill Clinton','Joseph Stalin','Pol Pot','Josef Mengele',
  'Hillary Clinton','Saddam Hussein','Adolf Eichmann','Charles Manson','Idi Amin',
  'Genghis Khan','Jeffrey Dahmer','Benito Mussolini','Ruhollah Khomeini',
  'Ted Bundy','John Wayne Gacy','Ivan the Terrible','Fidel Castro','Jim Jones',
  'Vlad the Impaler','Timothy McVeigh','Slobodan Milošević','Marquis de Sade',
  'Muammar Gaddafi','Jack the Ripper']){
  assert(c.some(x=>x.name===name),name);
 }
 for(const person of ['Bill Clinton','Hillary Clinton']){
  const record=c.find(x=>x.name===person);
  assert.equal(record.kind,'scrutiny');
  assert.equal(record.life,'living');
  assert.match(record.note,/no criminal/i);
  assert.doesNotMatch(record.note,/convicted|should be charged/i);
 }
 const unknown=c.find(x=>x.name==='Jack the Ripper');
 assert.equal(unknown.life,'unknown');
 assert.match(studio,/item\.name==='Jack the Ripper'\?'':/);
 assert.match(studio,/COURT CONVICTION/);
 assert.match(studio,/INDICTED · NO FINAL VERDICT/);
 assert.match(studio,/PUBLIC POLICY SCRUTINY/);
});
test('positive figures have documented achievements and noncriminal playful captions',()=>{
 const c=data().cunting;
 assert(c.some(x=>x.name==='Wangari Maathai'));
 assert(c.some(x=>x.name==='Pauli Murray'));
 assert(c.some(x=>x.name==='Octavia E. Butler'));
 assert(c.some(x=>x.name==='Laverne Cox'));
 assert(c.some(x=>x.name==='Ketanji Brown Jackson'));
 assert.match(studio,/Wanted for being too good for us/);
 assert.match(studio,/Wanted for stealing the whole scene/);
 assert.match(studio,/Achievements & source/);
 assert.match(studio,/Read source ↗/);
});
test('poster thumbnails use explicitly matched encyclopedia pages and free licenses',()=>{
 assert.match(studio,/wikiPortraits\[item\.id\]\|\|item\.wiki/);
 assert.match(studio,/piprop:'thumbnail\|name'/);
 assert.match(studio,/pilicense:'free'/);
 assert.match(studio,/pilimit:'15'/);
 assert.match(studio,/requestPortraits\(portraits\)/);
 assert.match(studio,/requestPortraits\(revealed\.map/);
 assert.match(studio,/creditCache\.set/);
 assert.match(studio,/commons\.wikimedia\.org\/wiki\/File:/);
 assert.match(studio,/host\.closest\('\.politc-person\[hidden\]'\)/);
 assert.match(studio,/image\.loading='lazy'/);
 assert.doesNotMatch(studio,/const titles=.*?cache.*?google\.com/s);
});
test('poster pagination has a stable hidden state, and life status drives photo styling',()=>{
 assert.match(studio,/const firstPage=isPoster\?24:people\.length/);
 assert.match(studio,/data-politc-paged="true"/);
 assert.match(studio,/data-politc-show-more/);
 assert.match(studio,/hidden\.slice\(0,24\)/);
 assert.match(studio,/revealed\.forEach\(card=>card\.hidden=false\)/);
 assert.match(studio,/class="politc-person politc-poster/);
 assert.match(posterCSS,/\.politc-person\[data-politc-paged\]\[hidden\]\{/);
 assert.match(posterCSS,/\.is-deceased \.politc-poster-photo img/);
 assert.match(posterCSS,/\.is-living \.politc-poster-photo img/);
 assert.match(posterCSS,/filter:grayscale\(1\)/);
 assert.match(posterCSS,/filter:none!important/);
 assert.match(posterCSS,/politc-poster-credit/);
});
test('large music results stay square and bounded without breaking the vinyl',()=>{
 assert.match(songCSS,/max-width:320px!important/);
 assert.match(songCSS,/max-height:320px!important/);
 assert.match(songCSS,/aspect-ratio:1\/1!important/);
 assert.match(songCSS,/\.bl-search-song\.bl-search-veve-card \.bl-search-card-media/);
 assert.match(songCSS,/object-fit:cover!important/);
 assert.match(songCSS,/\.bl-search-grid>\.bl-search-card/);
 assert.match(songCSS,/@media\(max-width:700px\)/);
});
test('all four Studio entrypoints load poster data before module pages and image bounds after music',()=>{
 for(const path of shells){
  const html=read(path);
  const posterAt=html.indexOf('politc-poster-catalog-20261114.js?v=');
  const moduleAt=html.indexOf('module-pages.js?v=');
  const musicAt=html.indexOf('lwazi-music-discovery.css?v=');
  const boundsAt=html.indexOf('lwazi-search-result-bounds-20261114.css?v=');
  assert(posterAt>=0&&posterAt<moduleAt,path+' loads poster catalog before render');
  assert(musicAt>=0&&musicAt<boundsAt,path+' loads bounds after the vinyl styling');
  assert.match(html,/politc-poster-collection-20261114\.css/);
  assert.match(html,/&posters=20261114-200-v1/);
  assert.equal((html.match(/politc-poster-catalog-20261114\.js\?v=/g)||[]).length,1,path);
 }
});
