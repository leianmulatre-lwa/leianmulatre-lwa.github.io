import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {JSDOM}=require('jsdom');
const read=p=>readFileSync(new URL('./'+p,import.meta.url),'utf8');
const html=read('tools/image-desk.html'),suite=read('tools-craft.js'),css=read('tools-craft.css'),studio=read('tools-studio.js');
const matches=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
assert.equal(matches.length,1,'Image Desk has one local editor script and no external script hosts');
new vm.Script(matches[0][1],{filename:'ImageDesk-inline.js'});
assert.match(html,/BIG LWA · image desk/i);
assert.match(html,/id="openImage"/);
assert.match(html,/id="openProject"/);
assert.match(html,/id="saveProject"/);
assert.match(html,/id="exportPng"/);
assert.match(html,/id="exportJpg"/);
assert.match(suite,/image-desk\.html/);
assert.match(suite,/credit:'PhotoCraft'/);
assert.match(suite,/credit:'VectorCraft'/);
assert.match(suite,/credit:'EffectCraft'/);
assert.match(suite,/credit:'PdfCraft'/);
assert.match(css,/\.craft-tile-home/);
assert.ok(studio.includes('tools-craft.js?v=20261022-local-arcade-4'));
assert.match(studio,/data-lwa-edit-image/,'Tools offers direct native image editing after sniffing a file');
assert.match(suite,/function editFile\(file\)/,'Workshop accepts the selected image');
assert.match(suite,/BIGLWA_IMAGE_DESK_IMPORT/,'Workshop passes files to the local editor');
assert.match(html,/event\.origin!==location\.origin/,'Image Desk rejects cross-origin file messages');
assert.match(html,/event\.source!==window\.parent/,'Image Desk only accepts messages from its Tools parent');
const dom=new JSDOM(html,{url:'https://biglwa.com/tools/image-desk.html',runScripts:'outside-only'});
const win=dom.window,document=win.document;
let downloads=0;
win.HTMLAnchorElement.prototype.click=function(){downloads++};
win.URL.createObjectURL=()=> 'blob:https://biglwa.com/test-file';
win.URL.revokeObjectURL=()=>{};
win.HTMLCanvasElement.prototype.getContext=function(){
 if(!this._fakeCtx){
  this._fakeCtx={
   save(){},restore(){},clearRect(){},drawImage(){},translate(){},scale(){},rotate(){},
   beginPath(){},moveTo(){},lineTo(){},stroke(){},arc(){},fill(){},fillText(){},
   fillRect(){},set globalAlpha(x){},set strokeStyle(x){},set lineCap(x){},set lineJoin(x){},
   set lineWidth(x){},set fillStyle(x){},set font(x){},set textBaseline(x){}
  };
 }
 return this._fakeCtx;
};
win.HTMLCanvasElement.prototype.toDataURL=()=> 'data:image/png;base64,AAAA';
win.HTMLCanvasElement.prototype.toBlob=cb=>cb(new win.Blob(['png'],{type:'image/png'}));
win.HTMLCanvasElement.prototype.setPointerCapture=function(){};
win.HTMLCanvasElement.prototype.releasePointerCapture=function(){};
win.HTMLCanvasElement.prototype.hasPointerCapture=()=>false;
win.eval(matches[0][1]);
const status=()=>document.getElementById('status').textContent;
assert.match(status(),/New local canvas/);
const count=()=>document.querySelectorAll('.layerrow').length;
assert.equal(count(),1);
document.querySelector('#addLayer').click();
assert.equal(count(),2,'Can create editable layers');
assert.equal(document.querySelector('#undo').disabled,false);
document.querySelector('#undo').click();
assert.equal(count(),1,'Undo restores layer stack');
document.querySelector('#redo').click();
assert.equal(count(),2,'Redo restores layer stack');
document.querySelector('[data-tool="text"]').click();
assert.match(status(),/Text/);
document.querySelector('#exportPng').click();
await new Promise(r=>setTimeout(r,0));
assert.equal(downloads,1,'PNG export triggers local download');
document.querySelector('#saveProject').click();
assert.equal(downloads,2,'Editable project export triggers local download');
assert.equal([...document.querySelectorAll('script[src]')].length,0,'No remote scripts or CDN editors in native desk');
win.close();
console.log('PASS BIG LWA native image editor: valid JS, layers, undo/redo, text, exports, and clear source attribution.');
