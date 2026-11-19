import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('./'+path,import.meta.url),'utf8');
const js=read('politc-werk-20261114.js');
const css=read('politc-werk-20261114.css');
const shells=['index.html','studio/index.html','404.html','live-studio-shell.html'];

test('Werk reads published source facts before showing original links',()=>{
 assert.match(js,/function sourceHost\(raw\)/);
 assert.match(js,/function readNote\(lines\)/);
 assert.match(js,/card\.append\(link,about,readNote\(\[sourceHost\(target\.url\)/);
 assert.match(js,/card\.append\(readNote\(\[\s*clean\(job\.source/);
 assert.match(js,/Source page not fetched by BIG LWA/);
 assert.match(js,/const context=document\.createElement\('section'\);context\.className='politc-werk-source-context'/);
 assert.match(js,/'Published BIG LWA snapshot'/);
 assert.match(js,/'not a live vacancy check'/);
 assert.match(js,/await api\.loadFeed\(\)/);
 assert.match(js,/if\(!panel\.isConnected\|\|panel\.dataset\.werkRequest!==seq\)return/);
 assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|<iframe|srcdoc=/);
});

test('Werk keeps every original search, save, preview and source control',()=>{
 for(const token of ['politcWerkForm','data-politc-werk-save','data-werk-window-open','dataset.werkPreviewUrl','View original posting','Search jobs','Werk Window'])
  assert(js.includes(token),token);
 assert.match(js,/makeLink\(target\.url,target\.label\+' ↗'\)/);
 assert.match(js,/makeLink\(url,'View original posting ↗'\)/);
});

test('Werk panel is compact without removing source notices or accessibility',()=>{
 assert.match(css,/padding:clamp\(11px,1\.8vw,18px\)!important/);
 assert.match(css,/margin-bottom:10px/);
 assert.match(css,/font:400 clamp\(27px,3vw,39px\)\/1 "Stars and Stripes"/);
 assert.match(css,/min-height:34px;padding:7px 10px/);
 assert.match(css,/grid-template-columns:repeat\(auto-fit,minmax\(min\(100%,190px\),1fr\)\)/);
 assert.match(css,/\.politc-werk-source-context/);
 assert.match(css,/\.politc-werk-read/);
 assert.match(css,/body\.night-mode[\s\S]*?politc-werk-source/);
 assert.match(css,/\.politc-werk-actions button:focus-visible/);
});

test('all Studio shells bust the compact source-reading Werk build',()=>{
 for(const path of shells){
  const html=read(path);
  assert.match(html,/politc-werk-20261114\.js\?v=20261114-werk-brands-1&read=20261118-1/,path);
  assert.match(html,/politc-werk-20261114\.css\?v=20261114-werk-brands-1&read=20261118-1/,path);
 }
});
