import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {JSDOM}=require('jsdom');
const read=p=>readFileSync(new URL('./'+p,import.meta.url),'utf8');
const html=read('tools/image-desk.html'),suite=read('tools-craft.js'),css=read('tools-craft.css'),studio=read('tools-studio.js');
assert.ok(suite.includes('CRAFT_ICON_NAME')&&suite.includes('craft-block-png'),'Workspace cards use new transparent PNG artwork');
assert.ok(css.includes('.craft-block-png'),'Workshop image positioning styles exist');
assert.ok(html.includes('icons/sqwibblR.png'),'sqwibblR native editor uses its matching favicon');
const matches=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
assert.equal(matches.length,1,'Image Desk has one local editor script and no external script hosts');
new vm.Script(matches[0][1],{filename:'ImageDesk-inline.js'});
assert.match(html,/BIG LWA · sqwibblR/i);
assert.match(html,/id="openImage"/);
assert.match(html,/id="openProject"/);
assert.match(html,/id="saveProject"/);
assert.match(html,/id="saveCloudSnapshot"/,'Native editor offers explicit account preview save');
assert.match(suite,/BIGLWA_WORKSHOP_SAVE_IMAGE/,'Workshop validates first-party iframe snapshot saves');
assert.match(suite,/requestId:event\.data\.requestId/,'Workshop acknowledges only the matching editor save request');
assert.match(suite,/event\.data\.app&&event\.data\.app!==editor/,'Only the active editor can receive its requested save');
assert.match(suite,/BigLWAAccountStorage/,'Workshop writes snapshots only in authenticated account context');
assert.match(suite,/data:image\/webp;base64/,'Private account previews are reconstructed client-side');

assert.match(html,/id="exportPng"/);
assert.match(html,/id="exportJpg"/);
assert.match(suite,/image-desk\.html/);
assert.match(suite,/credit:'PhotoCraft'/);
assert.match(suite,/credit:'VectorCraft'/);
assert.match(suite,/credit:'EffectCraft'/);
assert.match(suite,/credit:'PdfCraft'/);
assert.match(css,/\.craft-tile-home/);
assert.match(suite,/function blockArtwork\(item\)/,'Five Workshop icons have a shared renderer');
assert.match(suite,/CRAFT_ICON_NAME/,'The proper PNG is chosen for each editor');
assert.match(suite,/sqwibblR/,'The original green BIG LWA editor is also included');
assert.match(suite,/craft-block-png/,'Studio renders trimmed transparent PNG artwork');
assert.match(css,/\.craft-arcade-block \.craft-block-png/,'Workshop sizes icons without stretching');
assert.match(suite,/blockArtwork\(item\)\+'<\/div>'/,'Every creative app tile uses an approved stitched cube');
const pngHeader=Buffer.from('89504e470d0a1a0a','hex');
for(const name of ['sqwibblR','lightR','paintR','keyframeR','fileR']){
 const png=readFileSync(new URL('./assets/bigapps/icons/'+name+'.png',import.meta.url));
 assert.ok(png.subarray(0,8).equals(pngHeader),name+' favicon is a real PNG');
 assert.equal(png.readUInt32BE(16),160,name+' icon has consistent width');
 assert.equal(png.readUInt32BE(20),160,name+' icon has consistent height');
 assert.ok(png.includes(Buffer.from('tRNS'))||png[25]===6,name+' PNG contains transparency');
}
assert.match(read('.github/scripts/stage-craft-apps.py'),/type="image\/png"/,'Native browser editors advertise the new PNG favicons');
assert.doesNotMatch(suite,/craft-block-glyph[^\n]*<i><\/i>/,'Remove game-controller RGB dots from alphabet blocks');
assert.ok(studio.includes('tools-craft.js?v=20261026-original-blocks-lwazi-2'));
assert.match(suite,/\/bigapps\/manifest\.json/,'Uses renamed manifest');
assert.doesNotMatch(suite,/\/craftapps\//,'No legacy paths in editor launcher');
assert.match(suite,/PUBLIC_APP_ROUTE/,'Public URLs use canonical names');
assert.match(suite,/craft-capital-r/,'Visible app headings have a distinct uppercase R');
assert.match(suite,/BIGLWA_PATREON/,'Workshop links to founder Patreon');
assert.match(suite,/craftAccountVault/,'Cloud snapshots have a visible first-party shelf');
assert.match(suite,/id="craftPanelSaveFile"/,'Preview save lives in the Workshop header, not over native tools');
assert.match(css,/\.craft-panel-save/,'Workshop header controls are styled');
assert.match(read('assets/craft/editor-brand.js'),/dock\.hidden=true/,'Expanded dock does not cover editing by default');
assert.match(read('assets/craft/editor-brand.js'),/mini\.hidden=embedded/,'Embedded editor has no duplicate floating toolbar');
assert.match(read('assets/craft/editor-brand.css'),/data-biglwa-embedded="true"/,'Rust editor canvas is unobstructed');

assert.match(read('account-storage-policy.js'),/biglwaWorkshopSnapshotsV1/,'Private snapshots use the allowlisted account-synced key');
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

for(const name of ['sqwibblR','lightR','paintR','keyframeR','fileR'])assert.ok(suite.includes("name:'"+name+"'"),'Workshop shows '+name);
