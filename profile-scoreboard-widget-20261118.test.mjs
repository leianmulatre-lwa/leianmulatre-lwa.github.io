import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import vm from 'node:vm';

const read=path=>readFileSync(new URL('./'+path,import.meta.url),'utf8');
const shells=['index.html','studio/index.html','404.html','live-studio-shell.html'];
const css=read('profile-stats-row-20261116.css');
const js=read('profile-stats-row-20261116.js');

test('owner-uploaded Alarm Clock face is first-party and actually loaded',()=>{
 assert(existsSync(new URL('./alarm clock 2.ttf',import.meta.url)),'alarm clock 2.ttf must be published');
 assert.match(css,/@font-face\{[\s\S]*?font-family:"BIGLWA Alarm Clock"/);
 assert.match(css,/src:url\("\/alarm%20clock%202\.ttf"\) format\("truetype"\)/);
 assert.match(css,/font-display:swap/);
});

test('profile counts are moved into one scoreboard widget without cloning or storage',()=>{
 assert.match(js,/biglwa-profile-scoreboard/);
 assert.match(js,/board\.append\(stats\)/);
 assert.doesNotMatch(js,/cloneNode|setDoc|localStorage|sessionStorage/);
 assert.match(css,/\.biglwa-profile-scoreboard\{[\s\S]*?grid-template-columns:repeat\(5/);
 assert.match(css,/\.biglwa-profile-scoreboard>.stats\.stats\{[\s\S]*?display:contents/);
 assert.match(css,/#studioApp#studioApp#studioApp[\s\S]*?"BIGLWA Alarm Clock"/);
 assert.match(css,/font-variant-numeric:tabular-nums lining-nums/);
 assert.match(css,/body\.night-mode[\s\S]*?biglwa-profile-scoreboard/);
});

test('runtime relocation keeps the original stats node inside the scoreboard',()=>{
 const events={};
 const node=tag=>({
  tag,className:'',children:[],parentElement:null,attrs:{},textContent:'',
  setAttribute(key,value){this.attrs[key]=value},
  querySelector(selector){
   if(selector.includes('biglwa-profile-scoreboard'))return this.children.find(child=>child.className==='biglwa-profile-scoreboard')||null;
   if(selector.includes('biglwa-profile-bio-roles'))return this.children.find(child=>child.className==='biglwa-profile-bio-roles')||null;
   return null;
  },
  prepend(item){this.children.unshift(item);item.parentElement=this},
  append(...items){for(const item of items){this.children.push(item);item.parentElement=this}},
  after(){},
  matches(){return false},
  closest(){return null},
  addEventListener(){},
  compareDocumentPosition(){return 0}
 });
 const profile=node('div'),bio=node('p'),stats=node('div'),line=node('div');
 profile.className='profile-copy';bio.className='bio';stats.className='stats';
 line.className='biglwa-profile-role-statline';
 bio.parentElement=profile;stats.parentElement=profile;line.parentElement=profile;
 profile.querySelector=selector=>{
  if(selector.includes('.bio'))return bio;
  if(selector.includes('.stats'))return stats;
  if(selector.includes('biglwa-profile-role-statline'))return line;
  return null;
 };
 const document={
  readyState:'complete',
  querySelector(selector){return selector.includes('.profile-card')?profile:null},
  createElement:node,
  addEventListener(){}
 };
 const scope={window:{addEventListener(){}},document,MutationObserver:class{observe(){}},requestAnimationFrame(fn){fn()},Node:{DOCUMENT_POSITION_PRECEDING:4},console};
 vm.runInNewContext(js,scope,{timeout:2000});
 const board=line.children.find(child=>child.className==='biglwa-profile-scoreboard');
 assert(board,'scoreboard widget created');
 assert.equal(board.attrs['aria-label'],'Profile scoreboard');
 assert.equal(stats.parentElement,board,'original stats node moved into scoreboard');
 assert.equal(line.children.filter(child=>child.className==='biglwa-profile-scoreboard').length,1,'no duplicate widget');
});

test('all Studio shells bust the first-party scoreboard font cache',()=>{
 for(const path of shells){
  const html=read(path);
  assert.match(html,/profile-stats-row-20261116\.css\?v=20261116-roles-stats-row-v2&scoreboard=20261118-1&font=20261118-2/,path);
  assert.match(html,/profile-stats-row-20261116\.js\?v=20261116-snapshot-1&desk=20261116-2&navigation=20261117-1&font=20261118-2/,path);
  assert.match(html,/alarm%20clock%202\.ttf|scoreboard=20261118-1/,path);
 }
});
