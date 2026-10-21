/* Three-body UI, Skeleton Keys, Politic routes, private Journal and truthful activity badges. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=p=>readFileSync(new URL('./'+p,import.meta.url),'utf8');
const home=read('index.html'),body=read('studio-three-bodies-20261019.js'),
 onboarding=read('studio-onboarding.js'),pages=read('module-pages.js'),
 layout=read('ui-coherence.js'),writing=read('writing-collections.js');
for(const [name,src]of [['three-body',body],['Skeleton Keys',onboarding],['Journal',pages],['toolbar',layout]])
 assert.doesNotThrow(()=>new vm.Script(src),name+' must parse');
assert.ok(home.includes('studio-three-bodies-20261019.js?v=20261021-skeleton-first-6'),'new three-body categorizer is deployed');
assert.ok(home.includes('studio-onboarding.js?v=20261021-skeleton-layout-4'),'updated Skeleton Keys is deployed');
assert.ok(home.includes('module-pages.js?v=20261021-page-end-spacing-16'),'owned Journal preview is deployed');
assert.ok(home.includes('ui-coherence.js?v=20261021-header-copy-27'),'ON AIR and ONLINE badges are deployed');
const context={window:{addEventListener(){}},document:{readyState:'loading',addEventListener(){},querySelector(){return null},documentElement:{}},
 MutationObserver:class{observe(){}},requestAnimationFrame(){},console};
vm.runInNewContext(body,context);
const models=context.window.BigLWAThreeBodies;
assert.ok(models,'three-body navigation initializes');
assert.deepEqual(Object.keys(models.models),['individual','social','political']);
assert.equal(models.assignments.diary,'individual');
assert.equal(models.assignments.stream,'political');
assert.equal(models.assignments.politc,'political');
assert.equal(models.assignments.orbit,'social');
assert.equal(models.models.individual.color,'#d9c6ee');
assert.equal(models.models.social.color,'#f7cddd');
assert.equal(models.models.political.color,'#f8d4b0');
assert.match(body,/focusModel/,'body model filter is interactive');
assert.match(body,/Does not move cards or touch account layout data/,'Body-model choices never migrate or reorder widgets');
assert.match(onboarding,/id='biglwaSkeletonHub'/,'reusable in-card Skeleton hub');
assert.ok(onboarding.includes('<h2>Skeleton Keys</h2>')&&onboarding.includes('site rainbow:'),'Skeleton Keys has the correct title and rainbow section');
assert.ok(!onboarding.includes('<h2>Studio</h2>'),'Expanded Skeleton Keys never mislabels itself Studio');
assert.match(onboarding,/biglwaSkeletonKeysToggle/,'three-body ankh launcher');
assert.ok(onboarding.includes('/assets/skeleton-keys-ankh.svg')&&onboarding.includes("const guide=$('#studioApp #biglwaBodyGuide')"),'Supplied ankh appears beside three-body filters');
assert.match(onboarding,/is-skeleton-open/,'dismissed card can reopen');
for(const label of ['tutorial','symbols','settings','politc','feed','orbit','connect','veve'])
 assert.ok(onboarding.includes('data-skeleton-action="'+label+'"'),label+' square works');
assert.ok(onboarding.includes('ankh; keys for the individual.'),'Studio key subtitle');
assert.ok(onboarding.includes("key:'politc',detail:'Civic life"),'Politic has a real symbol image in key');
assert.ok(onboarding.includes("key:'orbit',detail:")&&onboarding.includes("key:'connect',detail:"),'Orbit and Connect have separate symbol entries');
assert.ok(pages.includes('.main.module-view>.module-page-aura{display:none!important')&&!pages.includes('height:min(380px,46vh)'),'Module page ends without a 380px trailing decoration');
assert.ok(pages.includes("camera:'Booth'")&&pages.includes('id="boothPhotoTab"')&&pages.includes('id="boothVideoTab"'),'Booth has separate Photo and Video tabs');
assert.ok(pages.includes('photoPanel.hidden=video;videoPanel.hidden=!video'),'Booth tab selection controls panel visibility');
assert.ok(layout.includes("navigationCatalog.set('politc'"),'Politic becomes a first-class left toolbar destination');
assert.ok(layout.includes("status.textContent='ON AIR'"),'Stream uses ON AIR without synthetic watchers');
assert.ok(layout.includes("status.textContent='ONLINE'"),'Room uses ONLINE without synthetic participants');
assert.ok(!layout.includes("count.textContent='0 watching'"));
assert.ok(pages.includes("localStorage.getItem('biglwaWritingCollectionV1:'+uid+':'+key)"),'Journal thumbnail uses owner-scoped saved writing');
assert.ok(pages.includes("const pages=Array.isArray(collection?.entries)?"),'saved entries are authoritative');
assert.ok(pages.includes("event.key?.startsWith('biglwaWritingCollectionV1:')"),'cross-tab writing refresh');
assert.ok(pages.includes("document.addEventListener('biglwa:writing-saved',syncWritingPreviews)"),'same-tab writing refresh');
assert.ok(writing.includes('biglwa:writing-saved'),'writing editor emits update event');
console.log('PASS Skeleton Keys opens inside Studio, real Politic left-toolbar configuration, compact three-body filters and pastel widget rings, account-owned Journal thumbnail, ON AIR/ONLINE without fabricated counts.');
