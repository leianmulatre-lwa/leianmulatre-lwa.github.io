import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {JSDOM}=createRequire(import.meta.url)('jsdom');
const source=readFileSync(new URL('./profile-highlight-editor.js',import.meta.url),'utf8');
const css=readFileSync(new URL('./profile-highlight-editor.css',import.meta.url),'utf8');
const ui=readFileSync(new URL('./ui-coherence.js',import.meta.url),'utf8');
assert.ok(css.includes('row-gap:8px'),'Shortcut shelf moves only slightly closer to hero widgets');
assert.ok(ui.includes('placeholder="#keepitcute"')&&ui.includes("dataset.moodPreview"),'Mood is a removable example, not saved text');
const dom=new JSDOM('<!doctype html><html><head></head><body><main id="studioApp">'+
'<article class="profile-card"></article><div id="wallpaperPanel">'+
'<div id="profileEditorTabs"><button type="button" role="tab" data-profile-editor-tab="profile" aria-selected="true">Profile</button>'+
'<button type="button" data-profile-editor-tab="highlights">Highlights</button><button type="button" data-profile-editor-tab="wallpaper">Wallpaper</button></div>'+
'<div id="profileEditorActions"><button id="saveProfileBtn">Save changes</button><button id="cancelProfileBtn">Cancel</button></div>'+
'</div></main></body></html>',{url:'https://biglwa.com/studio',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window,doc=w.document;
w.__biglwaIdentity={uid:'u1'};
w.BigLWAAccountStorage={uid:'u1'};
const imported={highlights:[{title:'Original',cover:'/assets/highlights/original.jpg',items:[
 {kind:'image',mediaUrl:'https://example.com/original.jpg'},
 {kind:'video',mediaUrl:'https://example.com/original.mp4'}]}]};
w.BigLWAImportedHighlights={source:()=>imported};
let lastSave=null;
w.BigLWAUserDirectory={
 loadProfile:async()=>({uid:w.__biglwaIdentity.uid,customization:{session:{}}}),
 saveCustomizations:async data=>{lastSave=data;return true}
};
w.eval(source);
doc.dispatchEvent(new w.Event('DOMContentLoaded'));
await new Promise(r=>setTimeout(r,190));
const tab=doc.querySelector('[data-profile-editor-tab="highlights"]');
const pane=doc.getElementById('profileHighlightsEditor');
assert.ok(tab&&pane,'New Highlights tab mounts inside Edit Profile');
assert.equal(doc.querySelectorAll('[data-profile-editor-tab="highlights"]').length,1,'Existing Highlights tab reused, no duplicate');
assert.ok(doc.querySelector('.highlight-cover-adjust-heading')?.textContent.includes('Adjust preview photo'),'Photo preview adjustment controls explicitly labeled');
const circle=doc.querySelector('.highlight-edit-cover img');
const yCrop=[...doc.querySelectorAll('.highlight-cover-controls input[type="range"]')][1];
assert.ok(circle&&yCrop,'Circle photo preview and crop sliders available');
yCrop.value='73';yCrop.dispatchEvent(new w.Event('input',{bubbles:true}));
assert.equal(circle.style.objectPosition,'50% 73%','Preview crop updates live while editing');
assert.ok(ui.includes("highlightsTab.dataset.profileEditorTab='highlights'"),'Main Edit Profile exposes Highlights in navigation');
assert.ok(css.includes('.biglwa-rank-rail-label'),'Real Rank label is styled beneath Mood');
assert.match(css, /margin-top:29px!important/, 'Rank progress line lowered within banner');
assert.match(css, /font-size:clamp\(17px,1\.5vw,21px\)/,'Current rank status enlarged approximately 35%');

assert.equal(doc.querySelectorAll('#biglwaHighlightEditorList .highlight-edit-row').length,1,'Imported highlight is editable');
tab.setAttribute('aria-selected','true');
pane.hidden=false;
const title=doc.querySelector('#biglwaHighlightEditorList .highlight-edit-row input[type="text"]');
title.value='New title';title.dispatchEvent(new w.Event('input',{bubbles:true}));
await w.BIGLWAHighlightEditor.save();
assert.equal(lastSave.session.highlightEdits.imported['0'].title,'New title','Highlight title synced through owner customizations');
assert.equal(w.BIGLWAHighlightEditor.customize(imported.highlights[0],0).title,'New title','Edited name appears on banner');
const newHighlightButton=doc.querySelector('#profileHighlightsEditor > .highlight-edit-actions button');
assert.equal(newHighlightButton.textContent,'+ New highlight','Explicit New highlight control selected');
newHighlightButton.click();
assert.equal(w.BIGLWAHighlightEditor.get().custom.length,1,'A new Highlight is added to the owner account draft');
assert.equal(doc.querySelectorAll('#biglwaHighlightEditorList .highlight-edit-row').length,2,'New highlight can be created');
const custom=doc.querySelectorAll('#biglwaHighlightEditorList .highlight-edit-row')[1];
const customTitle=custom.querySelector('input[type="text"]');
customTitle.value='My work';customTitle.dispatchEvent(new w.Event('input',{bubbles:true}));
const media=custom.querySelector('input[type="url"]');media.value='https://example.com/mywork.jpg';
custom.querySelector('.highlight-edit-actions button').click();
await w.BIGLWAHighlightEditor.save();
assert.equal(lastSave.session.highlightEdits.custom[0].title,'My work');
assert.equal(w.BIGLWAHighlightEditor.current()[0].items[0].mediaUrl,'https://example.com/mywork.jpg');
assert.equal(imported.highlights[0].title,'Original','Original imported content never modified');
w.document.documentElement.classList.add('biglwa-preview-mode');
w.dispatchEvent(new w.CustomEvent('biglwa:public-profile-ready',{detail:{profile:{look:{highlights:{
 version:1,imported:{},custom:[{id:'visitor',title:'Public',cover:'',added:[{kind:'image',mediaUrl:'https://example.com/public.jpg'}]}]
}}}}}));
assert.equal(w.BIGLWAHighlightEditor.current()[0].title,'Public','Visitors see profile-owner public data, not their own edits');
w.document.documentElement.classList.remove('biglwa-preview-mode');
w.__biglwaIdentity.uid='u2';w.BigLWAAccountStorage.uid='u2';
assert.equal(w.BIGLWAHighlightEditor.current().length,0,'Account switch cannot leak previous owner highlights');
dom.window.close();
console.log('PASS: owner-only highlight editing, cloud save, immutable source, public preview isolation, mood and shortcut spacing.');
