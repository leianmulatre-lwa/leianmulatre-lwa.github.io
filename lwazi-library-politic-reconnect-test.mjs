import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const get=path=>readFileSync(new URL('./'+path,import.meta.url),'utf8');
const search=get('user-search-results.js'),book=get('lwazi-book-handoff-20261113.js');
const research=get('politc-research-desk-20261113.js');
const nav=get('lwazi-navigation-commands.js'),thumb=get('studio-lwazi-thumbnail-20261026.js');
const craft=get('tools-craft.js'),extras=get('lwazi-discovery-extras.js');
const pages=get('module-pages.js');
const shells=['index.html','studio/index.html','404.html','live-studio-shell.html'];
test('all new scripts parse and are loaded in every route shell',()=>{
 for(const [name,source] of [
  ['book',book],['research',research],['nav',nav],['thumbnail',thumb],['extras',extras]
 ])assert.doesNotThrow(()=>new vm.Script(source,{filename:name+'.js'}));
 for(const path of shells){
  const source=get(path);
  assert.match(source,/lwazi-book-handoff-20261113\.js/,path);
  assert.match(source,/politc-research-desk-20261113\.js/,path);
  assert.match(source,/lwazi-library-politic-research-20261113\.css/,path);
  assert.ok(source.indexOf('lwazi-book-handoff-20261113.js')<source.indexOf('user-search-results.js'),path);
 }
});
test('selected search book carries an exact work record into Library without saving on click',()=>{
 const writes=new Map(),opened=[],events={};
 const window={
  __biglwaUserCardsClose:()=>{},
  openBIGLWAModule:key=>opened.push(key)
 };
 const sessionStorage={
  setItem:(key,value)=>writes.set(key,value),
  getItem:key=>writes.get(key)||null
 };
 const document={addEventListener:(name,fn)=>events[name]=fn};
 vm.runInNewContext(book,{window,document,URL,sessionStorage,console,
  AbortController,setTimeout,clearTimeout,fetch:()=>Promise.reject(Error('offline'))});
 const card={classList:{contains:key=>key==='bl-search-book'},dataset:{
  blBookKey:'/works/OL45883W',blBookTitle:'The Fire Next Time',
  blBookAuthor:'James Baldwin',blBookYear:'1963',
  blBookCover:'https://covers.openlibrary.org/b/id/123-M.jpg'
 }};
 assert.equal(window.BigLWABookHandoff.openCard(card),true);
 assert.deepEqual(opened,['library']);
 const selected=JSON.parse(writes.get('biglwa:selected-book:v1'));
 assert.equal(selected.key,'/works/OL45883W');
 assert.equal(selected.title,'The Fire Next Time');
 assert.match(selected.url,/^https:\/\/openlibrary\.org\/works\//);
 assert.ok(events['biglwa:module-open'],'library listener exists');
 assert.match(search,/data-bl-book-title/);
 assert.match(search,/data-bl-book-cover/);
 assert.match(search,/BigLWABookHandoff\?\.openCard\(card\)/);
 assert.doesNotMatch(book,/localStorage\.setItem\(/,'Opening the result does not mutate the personal shelf');
 assert.match(book,/form\.requestSubmit\(\)/,'explicit save uses existing Library form');
 assert.match(pages,/renderCollection\('library'/);
});
test('Politic has real in-site Wikimedia search and an honest WikiLeaks archive index',()=>{
 assert.match(research,/en\.wikipedia\.org/);
 assert.match(research,/en\.wikisource\.org/);
 assert.match(research,/en\.wikinews\.org/);
 assert.match(research,/origin:'\*'/);
 assert.match(research,/srnamespace:0/);
 assert.match(research,/explaintext:1/);
 assert.match(research,/textContent/,'results and excerpts are text, not third-party scripts');
 assert.match(research,/wikileaks\.org\/search\/advanced/);
 assert.match(research,/Full-text search remains on its original website/);
 assert.doesNotMatch(research,/<iframe/i);
 assert.match(research,/biglwa:module-open/);
 assert.match(research,/event\.detail\?\.key==='politc'/);
});
test('R apps retain existing Workshop manifest validation and provide deterministic launch hooks',()=>{
 assert.match(craft,/BigLWACraftLaunch/);
 assert.match(craft,/biglwa:craft-ready/);
 assert.match(craft,/\/bigapps\/manifest\.json/);
 assert.match(craft,/row\?\.available===true&&row\.version===item\.version/);
 assert.match(thumb,/BigLWAOpenCraftApp/);
 assert.match(thumb,/openModule\('tools'\)/);
 assert.match(nav,/rApps/);
 for(const [query,id] of [
  ['open lightR','photocraft'],['launch paintR','vectorcraft'],
  ['open keyframeR','effectcraft'],['show fileR','pdfcraft'],
  ['open sqwibblR','image-desk']
 ]){
  let api;const window={addEventListener:()=>{}};const document={readyState:'loading',addEventListener:()=>{}};
  vm.runInNewContext(nav,{window,document,setTimeout:()=>{}});
  api=window.BigLWANavigationCommands;
  assert.equal(api.resolve(query)?.app,id,query);
 }
 assert.match(extras,/data-bl-craft-app/);
});
