import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const js=readFileSync(new URL('./sqwip-editor.js',import.meta.url),'utf8');
const css=readFileSync(new URL('./sqwip-editor.css',import.meta.url),'utf8');
const pages=readFileSync(new URL('./module-pages.js',import.meta.url),'utf8');
const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
const mockWindow={};
vm.runInNewContext(js,{window:mockWindow,console,Date,Math});
const editor=mockWindow.BigLWASqwip;
assert.ok(editor,'Sqwip editor exports its mount');
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS '+name)}
test('Diary removes the Property-of sticker and preserves Diary editor and Feed upload',()=>{
 assert.ok(!pages.includes('Property of: '));
 for(const part of ['data-diary-view="diary"','data-diary-view="sqwip"',
  'id="moduleDiaryWriting"','id="moduleSqwip" hidden',
  'BigLWASqwip.mount(sqwip)','moduleWritingFeed','moduleWritingSave'])
  assert.ok(pages.includes(part),'missing '+part);
});
test('Sqwip classifies and renders standard screenplay elements',()=>{
 assert.equal(editor.autoType('INT. STUDIO - NIGHT','action'),'scene');
 assert.equal(editor.autoType('EXT. STREET - DAY','action'),'scene');
 assert.equal(editor.autoType('CUT TO:','action'),'transition');
 assert.equal(editor.autoType('JORDAN','action'),'character');
 assert.equal(editor.autoType('(quietly)','character'),'parenthetical');
 assert.equal(editor.autoType('I missed you.','character'),'dialogue');
 assert.equal(editor.autoType('She enters the room.','action'),'action');
});
test('Fountain export includes title, scene, character, parenthetical and dialogue',()=>{
 const script=editor.fountain({title:'Serpents and the Rainbow',blocks:[
  {type:'scene',text:'INT. HAMILTON ESTATE - NIGHT'},
  {type:'action',text:'The door opens.'},
  {type:'character',text:'Leyan'},
  {type:'parenthetical',text:'(softly)'},
  {type:'dialogue',text:'I am home.'},
  {type:'transition',text:'FADE OUT:'}
 ]});
 assert.ok(script.startsWith('Title: Serpents and the Rainbow'));
 for(const term of ['INT. HAMILTON ESTATE - NIGHT','LEYAN','(softly)','I am home.','FADE OUT:'])
  assert.ok(script.includes(term),'missing '+term);
});
test('Fountain import recovers title, scenes and characters',()=>{
 const parsed=editor.parse('Title: New Script\nCredit: By A. Writer\n\nINT. ROOM - DAY\n\nAVA\n\nHello.\n\nCUT TO:');
 assert.equal(parsed.title,'New Script');
 assert.ok(parsed.blocks.some(x=>x.type==='scene'&&x.text==='INT. ROOM - DAY'));
 assert.ok(parsed.blocks.some(x=>x.type==='character'&&x.text==='AVA'));
 assert.ok(parsed.blocks.some(x=>x.type==='transition'));
});
test('Multi-script storage and keyboard shortcuts are functional',()=>{
 for(const feature of ['localStorage.setItem(KEY','localStorage.setItem(ACTIVE',
  "if(e.key==='Tab')","if(e.key==='Enter'&&!e.shiftKey)","if(e.key==='Backspace'",
  "e.key.toLowerCase()==='s'",'sqwipNew','sqwipRename','sqwipDelete',
  'sqwipFile','sqwipExport','sqwipPrint',"window.print()"])
  assert.ok(js.includes(feature),'missing '+feature);
 assert.ok(!js.includes('fetch('),'scripts must not be uploaded to a third party');
});
test('Screenplay styling is responsive and printable',()=>{
 for(const part of ['.sqwip-page{','.sqwip-line.type-character','.sqwip-line.type-dialogue',
  '.sqwip-line.type-scene','.sqwip-line.type-parenthetical','@media print','@page{size:letter',
  '.sqwip-document-actions','.sqwip-footer'])
  assert.ok(css.includes(part),'missing '+part);
 assert.ok(pages.includes('.module-diary-switch'));
});
test('Sqwip assets loaded before Diary module with cache busting',()=>{
 assert.ok(html.includes('/sqwip-editor.css?v=20261013-initial-1'));
 assert.ok(html.includes('/sqwip-editor.js?v=20261013-initial-1'));
 assert.ok(html.includes('/module-pages.js?v=20261013-sqwip-editor-1'));
 assert.ok(html.indexOf('/sqwip-editor.js?v=')<html.indexOf('/module-pages.js?v='));
});
console.log(passed+' Sqwip checks passed');
