import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const {JSDOM}=createRequire(import.meta.url)('jsdom');
const read=name=>readFileSync(new URL('./'+name,import.meta.url),'utf8');
const ui=read('module-version-header-20261026.js'),css=read('lwazi-header-series-20261026.css');
const modulePages=read('module-pages.js'),craft=read('tools-craft.js'),editor=read('assets/craft/editor-brand.js');
const index=read('index.html'),projects=read('project-canvas.js');
assert.match(css,/grid-template-columns:minmax\(0,1fr\) minmax\(0,max-content\)!important/,'Header title and versions are two grid columns');
assert.match(css,/grid-column:2!important;grid-row:1!important/,'Switch and R badge are on TITLE row');
assert.match(ui,/right\.prepend\(controls\)/,'Real mode controls move instead of being replaced with dead controls');
assert.match(craft,/assets\/bigapps\/icons\//,'Original R-editor PNG blocks restored in Workshop');
assert.match(editor,/assets\/bigapps\/icons\//,'Original R-editor PNG blocks restored in native editors');
assert.match(craft,/WEB_FRIENDLY\.map\(webAppCard\)/,'Visualizr remains a standalone Workshop card');
assert.match(craft,/assets\/bigapps\/icons\/visualizr\.png/,'New transparent pink Visualizr PNG is used in Lwazi');
assert.doesNotMatch(craft,/\{id:'bookini',name:'bookini'/,'Bookini is no longer a separate Workshop app');
assert.match(craft,/2 web-friendly BIG LWA apps and 4 advanced/,'Workshop count reflects removal of standalone Bookini');
assert.match(modulePages,/tools:'lwazi'/,'Lwazi route title');
assert.match(modulePages,/projects:'visualizr'/,'Visualizr route title');
assert.match(index,/lwazi-header-series-20261026\.css/,'New heading layout reaches published site');
assert.match(projects,/\['visualz','visualizr'\]/,'Project mounting preserves legacy route names');
for(const [name,letter] of [['visualizr','𝖛'],['bookini','𝖇'],['r-editor','𝖗']]){
 const svg=read('assets/bigapps/blocks/'+name+'.svg');
 assert.match(svg,/<svg /,'Stitched cube SVG is valid source for '+name);
 assert.ok(svg.includes('>'+letter+'</text>'),'Correct monogram on '+name+' block');
}
const source='<main id="studioApp"><div id="moduleWorkspace" data-module-key="notes"><div id="moduleWorkspaceBody">'+
 '<header class="module-heading"><div class="module-heading-copy"><h1>Sqwibz</h1></div><div class="module-heading-bottom"><p>Notes</p></div></header>'+
 '<section class="module-card"><nav class="diary-section-nav"><button data-diary-view="notes">Sqwib</button><button data-diary-view="sqwip">Sqwip</button></nav></section>'+
 '</div></div></main>';
const dom=new JSDOM('<!doctype html><html><head></head><body>'+source+'</body></html>',{
 url:'https://biglwa.com/studio',runScripts:'outside-only',pretendToBeVisual:true
});
const win=dom.window,doc=win.document,ws=doc.querySelector('#moduleWorkspace');
let clicks=0;
const original=doc.querySelector('[data-diary-view="sqwip"]');
original.addEventListener('click',()=>clicks++);
win.eval(ui);
doc.dispatchEvent(new win.Event('DOMContentLoaded'));
const settle=()=>new Promise(resolve=>setTimeout(resolve,90));
await settle();
let h=doc.querySelector('.module-heading');
assert.ok(h.classList.contains('module-heading--with-versions'));
assert.equal(original.closest('.module-heading-right'),h.querySelector('.module-heading-right'),
 'The actual Sqwip version switch belongs beside the heading');
original.click();assert.equal(clicks,1,'Mode switch retained its original click listener');
ws.dataset.moduleKey='camera';
ws.querySelector('#moduleWorkspaceBody').innerHTML='<header class="module-heading"><div class="module-heading-copy"><h1>Booth</h1></div><div class="module-heading-bottom"><p>Camera</p></div></header><nav class="booth-tabs"><button id="boothPhotoTab">Photo</button><button id="boothVideoTab">Video</button></nav>';
await settle();
h=ws.querySelector('.module-heading');
assert.equal(h.querySelector('h1').textContent,'bookini');
assert.equal(h.querySelector('.booth-tabs').parentElement,h.querySelector('.module-heading-right'));
assert.match(h.querySelector('.lwazi-series-badge img').src,/bookini\.svg/);
ws.dataset.moduleKey='tools';
ws.querySelector('#moduleWorkspaceBody').innerHTML='<header class="module-heading"><div class="module-heading-copy"><h1>Tools</h1></div><div class="module-heading-bottom"><p>Old text</p></div></header>';
await settle();
h=ws.querySelector('.module-heading');
assert.equal(h.querySelector('h1').textContent,'lwazi');
assert.match(h.querySelector('.module-heading-bottom p').textContent,/2 web-friendly BIG LWA apps and 4 advanced open-source R-editors/);
assert.match(h.querySelector('.lwazi-series-badge img').src,/r-editor\.svg/);
ws.dataset.moduleKey='projects';
ws.querySelector('#moduleWorkspaceBody').innerHTML='<section id="lwaProjects"><header class="module-heading lwa-project-heading"><div class="module-heading-copy"><h1>visualz</h1></div><div class="module-heading-bottom"><p>Projects</p></div></header><nav class="visualz-tabs"><button data-visualz-mode="visualeyez">visualeyez</button><button data-visualz-mode="visualslidez">visualslidez</button></nav></section>';
doc.dispatchEvent(new win.Event('biglwa:visualz-render'));
await settle();
h=ws.querySelector('.lwa-project-heading');
assert.equal(h.querySelector('h1').textContent,'visualizr');
assert.equal(h.querySelector('.visualz-tabs').parentElement,h.querySelector('.module-heading-right'));
assert.match(h.querySelector('.lwazi-series-badge img').src,/visualizr\.png/);
dom.window.close();
console.log('PASS Lwazi: restored original R-editor block art; same-row functional versions; new Visualizr PNG; Bookini Photo Booth preserved; 2+4 distinction.');
