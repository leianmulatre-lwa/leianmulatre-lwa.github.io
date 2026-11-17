import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createRequire} from 'node:module';
const {JSDOM}=createRequire(import.meta.url)('jsdom');const read=p=>readFileSync(p,'utf8');
test('switching boards does not reuse an unrelated in-flight request',async()=>{
 const w=new JSDOM('',{url:'https://biglwa.com',runScripts:'outside-only'}).window;
 const source=read('pinterest-orbit.js'),start=source.indexOf(' let pinsRequestKey='),end=source.indexOf(' async function loadCreatedPins',start);
 w.eval(`let authUid='owner',boardId='1',pins=[],pinsNext='',pinsPromise=null,diagnostic='';const pending={};const api=path=>new Promise(resolve=>pending[path]=resolve);const render=()=>{};${source.slice(start,end)};window.runRace=async()=>{const a=loadPins('1');boardId='2';const b=loadPins('2');pending['boards/1/pins']({items:[{id:'old'}]});await a;pending['boards/2/pins']({items:[{id:'new'}]});await b;return pins[0].id;};`);
 assert.equal(await w.runRace(),'new');w.close();
});
test('Visual-Life opens beside the visual workspaces without leaving the project',async()=>{
 const w=new JSDOM('<div id="moduleWorkspace" data-module-key="projects"><nav class="visualz-tabs"><button class="active" data-visualz-mode="visualeyez">visual·eyez</button></nav></div>',{url:'https://biglwa.com/studio',runScripts:'outside-only'}).window;
 w.HTMLElement.prototype.scrollIntoView=function(){};w.fetch=async()=>({ok:false});w.eval(read('visual-life-jobs.js'));w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
 w.document.querySelector('[data-visual-life-open]').click();assert(w.document.querySelector('#moduleWorkspace').classList.contains('visual-life-active'));assert.equal(w.document.querySelector('#craftVisualLifePanel').hidden,false);
 w.document.querySelector('[data-visualz-mode]').click();assert(!w.document.querySelector('#moduleWorkspace').classList.contains('visual-life-active'));w.close();
});
test('landing waits for visible lazy images but not offscreen images',()=>{
 const w=new JSDOM('<main><img loading="lazy"></main>',{runScripts:'outside-only'}).window;
 const s=read('studio-loading-dots-20261021.js');w.eval(s.slice(s.indexOf(' function unresolvedImages'),s.indexOf(' function loadingState'))+';window.pending=unresolvedImages');
 const img=w.document.querySelector('img');Object.defineProperty(img,'complete',{value:false,configurable:true});img.getBoundingClientRect=()=>({width:100,height:100,top:10,bottom:110});
 assert.equal(w.pending(w.document.querySelector('main')),true);
 img.getBoundingClientRect=()=>({width:100,height:100,top:5000,bottom:5100});assert.equal(w.pending(w.document.querySelector('main')),false);
 img.getBoundingClientRect=()=>({width:100,height:100,top:10,bottom:110});Object.defineProperty(img,'complete',{value:true});assert.equal(w.pending(w.document.querySelector('main')),false);w.close();
});
