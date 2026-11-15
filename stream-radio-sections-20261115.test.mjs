import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('./'+p,import.meta.url),'utf8');
const js=read('stream-guide.js'),css=read('stream-guide.css');
test('all five Stream sections remain in the main selector',()=>{
 assert.doesNotThrow(()=>new vm.Script(js));
 const ids=['podcast','lwa-tv','live','sqwibz','music'];
 for(const id of ids)assert(js.includes("['"+id+"'"),id+' must stay in the navigation');
 assert.match(js,/categories\.map\(c=>'<button class="stream-tab"/);
 assert.match(js,/if\(grid\)grid\.hidden=false/);
 assert.match(css,/\.stream-nav \.stream-channels\{\s*display:grid!important/);
 assert.match(css,/grid-template-columns:repeat\(5,minmax\(0,1fr\)\)!important/);
});
test('Music setup view leaves a way back to each original Stream section',()=>{
 assert.match(js,/stream-music-other-channels/);
 assert.match(js,/categories\.filter\(\(\[id\]\)=>id!=='music'\)\.map/);
 assert.match(js,/if\(state\.category==='music'\)state\.category='podcast'/);
 assert.match(css,/\.stream-music-other-channels button/);
});
test('Daily Discovery is built after re-rendering channel copy, not before',()=>{
 const category=js.slice(js.indexOf('function renderCategory(){'),js.indexOf('function renderStations(query){'));
 const parser=category.indexOf('renderFeaturedSlots();');
 assert(parser>0,'Final renderCategory call must restore the discovery gallery');
 assert.match(js,/paintCategories\(\);renderGrid\(\);renderCategory\(\)/);
 assert.doesNotMatch(js,/paintCategories\(\);renderGrid\(\);renderFeaturedSlots\(\);renderCategory\(\)/);
});
test('LWA Radio directory preserves campus stations and additional real listening sources',()=>{
 assert.match(js,/all 16 campus stations/);
 assert.match(js,/function renderRadioExtras\(\)/);
 assert.match(js,/featured\.filter\(item=>item\.category==='podcast'/);
 assert.match(js,/renderRadioExtras\(\)/);
 for(const marker of ['soulection-001','soulection-002','soulection-003','soulection-radio','boilerroom','larray-podcast','nyt-daily','owen-dreams']){
  assert(js.includes("id:'"+marker+"'"),'Missing original source: '+marker);
 }
 assert.match(js,/Original source ↗/);
 assert.match(js,/const clip=item\.videoId&&/);
 assert.match(css,/stream-radio-extras-grid/);
});
test('Studio entrypoints load the refreshed tab and Radio content without duplicate assets',()=>{
 for(const path of ['index.html','studio/index.html','404.html','live-studio-shell.html']){
  const source=read(path);
  for(const asset of ['stream-guide.js','stream-guide.css']){
   assert.equal((source.match(new RegExp(asset.replaceAll('.','\\.')+'\\?v=','g'))||[]).length,1,path+' '+asset);
   assert(source.includes('/'+asset+'?v=')&&source.includes('&radio=20261115-restore-sections-1'),path+' cache revision');
  }
 }
});
