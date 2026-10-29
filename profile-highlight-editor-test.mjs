import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {JSDOM}=createRequire(import.meta.url)('jsdom');
const source=readFileSync(new URL('./profile-highlight-editor.js',import.meta.url),'utf8');
const css=readFileSync(new URL('./profile-highlight-editor.css',import.meta.url),'utf8');
const brandCss=readFileSync(new URL('./brand-policy.css',import.meta.url),'utf8');
const ui=readFileSync(new URL('./ui-coherence.js',import.meta.url),'utf8');
assert.ok(css.includes('row-gap:8px'),'Shortcut shelf moves only slightly closer to hero widgets');
assert.ok(ui.includes('placeholder="#keepitcute"')&&ui.includes("dataset.moodPreview"),'Mood is a removable example, not saved text');
const dom=new JSDOM('<!doctype html><html><head></head><body><main id="studioApp">'+
'<article class="profile-card"></article><div id="wallpaperPanel">'+
'<div id="profileEditorTabs"><button type="button" role="tab" data-profile-editor-tab="profile" aria-selected="true">Profile</button>'+
'<button type="button" data-profile-editor-tab="picture">Profile Picture</button><button type="button" data-profile-editor-tab="wallpaper">Wallpaper</button></div>'+
'<div id="profileEditorActions"><button id="saveProfileBtn">Save changes</button><button id="cancelProfileBtn">Cancel</button></div>'+
'</div><div id="moduleWorkspace" data-module-key="archive"><section class="archive-wall-shell"><div class="archive-toolbar"><div class="archive-toolbar-actions"></div><div class="archive-filter-bar"></div></div><div class="archive-page-list"></div></section></div></main></body></html>',{url:'https://biglwa.com/studio',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window,doc=w.document;
w.__biglwaIdentity={uid:'u1'};
w.BigLWAAccountStorage={uid:'u1'};
w.__biglwaInstagramOrbit={state:{connected:true,profile:{username:'testowner'}}};
w.localStorage.setItem('biglwaArchiveFilters',JSON.stringify({sources:['instagram'],hideDupes:false}));
const imported={handle:'testowner',highlights:[{title:'Original',cover:'/assets/highlights/original.jpg',items:[
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
const tab=doc.querySelector('[data-profile-editor-tab="picture"]');
const pane=doc.getElementById('profilePictureEditor');
const archivePane=doc.getElementById('archiveHighlightsPanel');
const highlightButton=doc.querySelector('.archive-highlights-button');
assert.ok(brandCss.includes('.mini-avatar.has-photo'),'Loaded photo hides any late initial overlays');
assert.ok(tab&&pane,'Main profile photo uploader mounts in Profile Picture section');
assert.ok(archivePane&&highlightButton,'Archive has Highlights editor and a control to reveal it');
assert.equal(doc.querySelectorAll('[data-profile-editor-tab="highlights"]').length,0,'No duplicate Highlights tab in profile editor');
assert.equal(tab.textContent,'Profile Picture');
assert.ok(archivePane.hidden,'Highlights panel does not crowd Archive gallery until requested');
assert.ok(doc.querySelector('.archive-page-list'),'Existing Archive gallery remains intact');
// The Archive toolbar is refreshed independently of the Highlights panel.
const actions=doc.querySelector('.archive-toolbar-actions');
actions.replaceChildren(); // reproduces a refresh that removes Highlights
assert.equal(doc.querySelector('.archive-highlights-button'),null);
assert.ok(doc.querySelector('#archiveHighlightsPanel'),'Editor survives the toolbar refresh');
w.BIGLWAHighlightEditor.mountArchive();
const restored=doc.querySelector('.archive-highlights-button');
assert.ok(restored,'Highlights action is restored when the editor still exists');
assert.strictEqual(doc.querySelector('#archiveHighlightsPanel'),archivePane,'Editor is reused, not duplicated');
assert.equal(doc.querySelectorAll('#archiveHighlightsPanel').length,1,'Only one editor panel exists');
restored.click();
assert.equal(restored.getAttribute('aria-expanded'),'true','Recovered button still opens the panel');
assert.equal(archivePane.hidden,false,'Recovered action shows the existing editor');
restored.click();
assert.equal(archivePane.hidden,true,'Recovered button also closes the panel');

const go=doc.querySelector('.profile-highlight-archive-link button');
assert.equal(go?.textContent,'Go to Archive','Profile Picture links directly to Highlights in Archive');
let opened='';w.openBIGLWAModule=k=>{opened=k};go.click();
assert.equal(opened,'archive');assert.ok(!archivePane.hidden,'Profile link expands Highlights inside Archive');
const imageCard=doc.querySelectorAll('#biglwaHighlightEditorList .highlight-item-card')[0];
const videoCard=doc.querySelectorAll('#biglwaHighlightEditorList .highlight-item-card')[1];
assert.ok(imageCard?.querySelector('label.archive-live.highlight-item-live input[type="checkbox"]'),'Highlight photos use the same live switch as the rest of the site');
assert.equal(imageCard.querySelector('input[type="checkbox"]').className,'highlight-item-live-input','The floating checkmark is replaced by the switch');
assert.equal(videoCard.querySelector('.highlight-item-send'),null,'Videos keep their single job and get no Send to');
const send=imageCard.querySelector('details.highlight-item-send');
assert.equal(send?.querySelector('summary')?.textContent,'Send to','Image highlights offer a Send to menu');
for(const destination of ['feed','veve','boards'])
 assert.ok(send.querySelector('[data-highlight-send="'+destination+'"]'),'Send to offers '+destination);
let feedDraft=null,publishedId='';
w.fetch=async()=>{throw new Error('blocked')};
w.__biglwaCollectivePublish={createFeedDraft:async args=>{feedDraft=args;return {id:'feed_1'}}};
w.__biglwaOrbitPosts={publishOrbitPost:async id=>{publishedId=id}};
send.querySelector('[data-highlight-send="feed"]').click();
await new Promise(r=>setTimeout(r,40));
assert.equal(feedDraft?.url,'https://example.com/original.jpg','My Feed keeps the original photo link when a direct copy is blocked');
assert.equal(feedDraft?.caption,'Original','The highlight name becomes the Feed caption');
assert.equal(publishedId,'feed_1','Send to My Feed publishes the draft to the Collective Feed');
assert.equal(send.querySelector('.highlight-item-send-status').textContent,'Posted to My Feed.');
send.querySelector('[data-highlight-send="boards"]').click();
await new Promise(r=>setTimeout(r,30));
const boardsSaved=JSON.parse(w.localStorage.getItem('biglwaModule_boards')||'[]');
assert.equal(boardsSaved[0]?.photo,'https://example.com/original.jpg','Send to Boards stores the highlight photo');
assert.equal(send.querySelector('.highlight-item-send-status').textContent,'Saved to Boards.');
w.localStorage.setItem('biglwaArchiveFilters',JSON.stringify({sources:['tiktok'],hideDupes:false}));
w.BIGLWAHighlightEditor.mountArchive();
assert.ok(doc.querySelector('.archive-highlights-button').hidden,'Highlights action hides on a TikTok shelf');
assert.ok(archivePane.hidden,'Highlights panel hides on a TikTok shelf');
w.localStorage.setItem('biglwaArchiveFilters',JSON.stringify({sources:['pinterest'],hideDupes:false}));
w.BIGLWAHighlightEditor.mountArchive();
assert.ok(doc.querySelector('.archive-highlights-button').hidden,'Highlights action hides on a Pinterest shelf');
w.localStorage.setItem('biglwaArchiveFilters',JSON.stringify({sources:['instagram'],hideDupes:false}));
w.BIGLWAHighlightEditor.mountArchive();
assert.ok(!doc.querySelector('.archive-highlights-button').hidden,'Highlights stay available on the Instagram shelf');
w.localStorage.setItem('biglwaArchiveFilters',JSON.stringify({sources:[],hideDupes:false}));
w.BIGLWAHighlightEditor.mountArchive();
assert.ok(doc.querySelector('.archive-highlights-button').hidden,'All cannot show another app’s Highlights');
w.BigLWASocialShowcase={isConnected:key=>key==='snapchat',
  highlightsFor:key=>key==='snapchat'?[{platform:'snapchat',title:'Spotlight preview',cover:'',
   items:[{kind:'video',mediaUrl:'https://example.com/snap.mp4'}],_importKey:'snapchat:0'}]:[]};
w.localStorage.setItem('biglwaArchiveFilters',JSON.stringify({sources:['snapchat'],hideDupes:false}));
w.BIGLWAHighlightEditor.mountArchive();
assert.ok(!doc.querySelector('.archive-highlights-button').hidden,'Snapchat Highlights action appears only for its connected app');
doc.querySelector('.archive-highlights-button').click();
assert.ok(doc.querySelector('#biglwaHighlightEditorList')?.textContent.includes('Spotlight preview'),'Snapchat shows Spotlight data');
assert.ok(!doc.querySelector('#biglwaHighlightEditorList')?.textContent.includes('Original'),'Snapchat never shows Instagram data');
w.localStorage.setItem('biglwaArchiveFilters',JSON.stringify({sources:['facebook'],hideDupes:false}));
w.BIGLWAHighlightEditor.mountArchive();
assert.ok(doc.querySelector('.archive-highlights-button').hidden,'Facebook has no Highlight button without imported Highlight groups');
imported.highlights.push({title:'Facebook story',platform:'facebook',items:[{kind:'image',mediaUrl:'https://example.com/fb.jpg'}]});
w.BIGLWAHighlightEditor.mountArchive();
assert.ok(!doc.querySelector('.archive-highlights-button').hidden,'Facebook shows Highlight button only with real imported groups');
doc.querySelector('.archive-highlights-button').click();
assert.ok(doc.querySelector('#biglwaHighlightEditorList')?.textContent.includes('Facebook story'),'Facebook owns its own story group');
assert.ok(!doc.querySelector('#biglwaHighlightEditorList')?.textContent.includes('Original'),'Facebook never shows Instagram groups');
w.localStorage.setItem('biglwaArchiveFilters',JSON.stringify({sources:['instagram'],hideDupes:false}));
w.BIGLWAHighlightEditor.mountArchive();
w.dispatchEvent(new w.CustomEvent('biglwa:archive-rendered',{detail:{sources:[],count:1,owner:true}}));
await new Promise(r=>setTimeout(r,80));
assert.ok(doc.querySelector('.archive-highlights-button'),'Archive redraw remounts the Highlights action');
assert.ok(doc.querySelector('.highlight-cover-adjust-heading')?.textContent.includes('Adjust preview photo'),'Photo preview adjustment controls explicitly labeled');
const circle=doc.querySelector('.highlight-edit-cover img');
const yCrop=[...doc.querySelectorAll('.highlight-cover-controls input[type="range"]')][1];
assert.ok(circle&&yCrop,'Circle photo preview and crop sliders available');
yCrop.value='73';yCrop.dispatchEvent(new w.Event('input',{bubbles:true}));
assert.equal(circle.style.objectPosition,'50% 73%','Preview crop updates live while editing');
assert.ok(ui.includes("pictureTab.dataset.profileEditorTab='picture'")&&ui.includes("showTab('picture')"),'Main Edit Profile leads with Profile Picture');
assert.ok(ui.includes("rankRow.insertBefore(rankLabel,rankTitle||rankRow.firstChild)"),'REAL RANK label is moved directly before the current rank title');
assert.ok(ui.includes("rankLabel.classList.remove('biglwa-rank-rail-label')"),'Old above-avatar label placement is retired');
assert.ok(css.includes('.rank-label.biglwa-rank-inline-label'),'REAL RANK is styled inline with rank title');
assert.ok(css.includes('grid-template-columns:max-content max-content minmax(80px,1fr) max-content'),'Rank row keeps title, progress and next status on one line');
assert.match(css, /margin-top:29px!important/, 'Rank progress line lowered within banner');
assert.match(css, /font-size:clamp\(17px,1\.5vw,21px\)/,'Current rank status enlarged approximately 35%');

assert.equal(doc.querySelectorAll('#biglwaHighlightEditorList .highlight-edit-row').length,1,'Imported highlight is editable');
highlightButton.setAttribute('aria-expanded','true');
const title=doc.querySelector('#biglwaHighlightEditorList .highlight-edit-row input[type="text"]');
title.value='New title';title.dispatchEvent(new w.Event('input',{bubbles:true}));
await w.BIGLWAHighlightEditor.save();
assert.equal(lastSave.session.highlightEdits.imported['0'].title,'New title','Highlight title synced through owner customizations');
assert.equal(w.BIGLWAHighlightEditor.customize(imported.highlights[0],0).title,'New title','Edited name appears on banner');
const newHighlightButton=doc.querySelector('#archiveHighlightsPanel > .highlight-edit-actions button');
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
console.log('PASS: Profile Picture first, Archive-only Highlights editor, gallery preserved, cloud save, immutable imports, public preview isolation.');
