import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {JSDOM}=require('jsdom');
const read=p=>fs.readFileSync(new URL('./'+p,import.meta.url),'utf8');
const moduleCode=read('workshop-native-files.js');
const craftCode=read('tools-craft.js'),craftCss=read('tools-craft.css');
const workerCode=read('cloudflare-worker-instagram.js');
assert.ok(craftCode.includes("id=\"craftProjectVault\""),'Workshop mounts a distinct original editable-file shelf');
assert.ok(craftCode.includes("import('/workshop-native-files.js?v="),'Workshop loads native project controls');
assert.ok(craftCss.includes('.craft-project-vault')&&craftCss.includes('.craft-project-card-actions'));
assert.ok(workerCode.includes("workshopProjectRoute(request,env)"));
assert.ok(moduleCode.includes('file.slice((n-1)*start.chunkSize'),'Client sends chunks instead of loading full project into JS memory');
assert.ok(moduleCode.includes('window.showSaveFilePicker'),'Large downloads stream to disk when the browser supports it');
assert.ok(moduleCode.includes('Content-Length'),'Downloads verify native file size');
assert.ok(moduleCode.includes('await writer.close()'),'Streamed download is committed only when complete');
assert.ok(moduleCode.includes('writer.abort()'),'Incomplete streamed downloads are discarded');
assert.ok(!moduleCode.includes('localStorage.setItem'),'Native originals are not reduced to browser-local metadata');
assert.ok(craftCode.includes("params.set('biglwaHost','1')"),'Only the explicit open-only Rust PDF bridge is requested');
assert.ok(craftCode.includes("type:'pdfcraft:open'"),'Private originals go into the actual Rust import inbox');
assert.ok(craftCode.includes("message.type==='pdfcraft:queued'&&message.requestId===requestId"),'Each native file import must acknowledge its own request');
assert.ok(craftCode.includes("event.origin!==location.origin||event.source!==frame.contentWindow"),'A sibling or cross-origin frame cannot spoof a native file acknowledgement');
assert.ok(moduleCode.includes("item.app==='fileR'&&item.size<=75*1024*1024"),'Native automatic reopening is only enabled where the Rust bridge exists and memory is bounded');
assert.ok(moduleCode.includes("body.byteLength!==item.size"),'Incomplete private binary downloads may not be imported');
assert.ok(moduleCode.includes("await openOriginal(item,body)"),'The downloaded original is handed to the real editor, not a mock preview');


const dom=new JSDOM('<main><section id="craftProjectVault"></section></main>',{
 url:'https://biglwa.com/studio',runScripts:'outside-only'});
const win=dom.window,host=win.document.getElementById('craftProjectVault');
win.BigLWAAccountStorage={ready:new Promise(()=>{})}; // Avoid a live Firebase session in tests.
win.eval(moduleCode.replace('export function mountNativeProjectVault','function mountNativeProjectVault')+
  '\nwindow.createVaultTest=mountNativeProjectVault;');
const mounted=win.createVaultTest(host,{open:()=>true,active:()=> 'lightR'});
assert.ok(mounted&&typeof mounted.load==='function');
assert.equal(host.dataset.mounted,'1');
assert.equal(host.querySelector('#craftProjectApp').value,'lightR');
assert.equal(host.querySelector('#craftProjectInput').type,'file');
assert.ok(host.querySelector('.craft-project-status[role=status]'));
assert.ok(host.querySelector('[data-project-refresh]'));
assert.ok(host.querySelector('[data-project-cancel]').hidden);
assert.match(host.textContent,/keep actual editor project files private/i);
const before=host.innerHTML;
win.createVaultTest(host,{open:()=>false});
assert.equal(host.innerHTML,before,'Re-mount does not duplicate event handlers');
mounted.setEditor('fileR');
assert.equal(host.querySelector('#craftProjectApp').value,'fileR');
mounted.setEditor('unknown');
assert.equal(host.querySelector('#craftProjectApp').value,'fileR','Unknown apps cannot be selected');
win.close();
console.log('PASS: BIG LWA native editable Workshop UI mounted, accessible, bounded, and isolated from flat snapshots.');
