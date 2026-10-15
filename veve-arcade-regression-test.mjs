import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
for(const name of ['./veve.js','./pinterest-orbit.js','./feed-polish.js']){
  assert.doesNotThrow(()=>new Script(read(name),{filename:name}),name+' parses');
}
const html=read('./arcade-puzzles.html');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'Arcade puzzles inline game script is present');
assert.doesNotThrow(()=>new Script(script,{filename:'arcade-puzzles inline'}),'Arcade puzzle JS parses');
const veve=read('./veve.js'),pages=read('./module-pages.js'),feed=read('./feed-view.js'),pin=read('./pinterest-orbit.js'),chrome=read('./feed-polish.js');
const cases=[
  ['Veve single wall',veve.includes('A single mixed Pinterest-style wall')],
  ['Veve embedded media',veve.includes('function openMedia(post)')&&veve.includes('openMedia(p)')],
  ['Veve green preview',veve.includes('data-veve-view')],
  ['Source links are Pinterest originals',veve.includes('Original Pinterest Pin ↗')],
  ['Anonymous account usage counts use ten-account bands',veve.includes('Math.floor(ids/10)*10')],
  ['Veve has on-site game tiles',veve.includes("['2048','2048']")&&veve.includes("['crossword','crossword']")],
  ['Arcade links to on-site puzzle games',pages.includes('/arcade-puzzles.html?game=2048')&&pages.includes('/arcade-puzzles.html?game=crossword')],
  ['Crossword and 2048 boards work',html.includes('crossGrid')&&html.includes('grid2048')&&html.includes('function renderCross')],
  ['Board locks are account synced',pin.includes('pinterestBoardLocks:next')&&pin.includes('boardLocks[fromBoard]===true')],
  ['Saved videos render inline with controls',feed.includes('const soleVideo = playable')&&feed.includes('autoplay loop></video>')],
  ['Green saved video uses canonical player',chrome.includes('previewPost?.(card.dataset.postId)')],
  ['Private content not treated as public',veve.includes("p.visibility!=='private'")&&veve.includes("p.veveOptOut!==true")]
];
for(const [name,ok] of cases){console.log((ok?'PASS ':'FAIL ')+name);}
assert.ok(cases.every(([,ok])=>ok),'Veve/Arcade regression checks failed');
console.log(cases.length+' Veve/Arcade integration checks passed');
