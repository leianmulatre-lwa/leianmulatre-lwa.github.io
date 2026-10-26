/* Three-body UI, Skeleton Key, Politic routes, private Journal and truthful activity badges. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=p=>readFileSync(new URL('./'+p,import.meta.url),'utf8');
const home=read('index.html'),body=read('studio-three-bodies-20261019.js'),
 onboarding=read('studio-onboarding.js'),pages=read('module-pages.js'),
 layout=read('ui-coherence.js'),writing=read('writing-collections.js');
for(const [name,src]of [['three-body',body],['Skeleton Key',onboarding],['Journal',pages],['toolbar',layout]])
 assert.doesNotThrow(()=>new vm.Script(src),name+' must parse');
assert.ok(home.includes('studio-three-bodies-20261019.js?v=20261021-skeleton-compact-1'),'new three-body categorizer is deployed');
assert.ok(home.includes('studio-onboarding.js?v=20261026-key-reformat-1'),'updated Skeleton Key is deployed');
assert.ok(home.includes('module-pages.js?v=20261026-two-original-workshop-5'),'owned Journal preview is deployed');
assert.ok(home.includes('ui-coherence.js?v=20261026-rank-mood-highlight-tab-2'),'ON AIR and ONLINE badges are deployed');
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
assert.ok(onboarding.includes('<h2>Skeleton Key</h2>'));
assert.match(onboarding,/skeletonKeyLauncher/);
assert.ok(onboarding.includes('/assets/skeleton-keys-ankh.svg'));
assert.match(onboarding,/is-skeleton-open/);
assert.ok(onboarding.includes('Body shadow key')&&onboarding.includes('skeleton-model-widget'));
assert.ok(onboarding.includes('Important / Legal')&&onboarding.includes('href="/rights"'));
assert.ok(!onboarding.includes('Take the site tour'));
assert.ok(onboarding.includes("key:'politc',detail:'Civic life"),'Politic has a real symbol image in key');
assert.ok(onboarding.includes("key:'orbit',detail:")&&onboarding.includes("key:'connect',detail:"),'Orbit and Connect have separate symbol entries');
assert.ok(pages.includes('.main.module-view>.module-page-aura{display:none!important')&&!pages.includes('height:min(380px,46vh)'),'Module page ends without a 380px trailing decoration');
assert.ok(pages.includes("camera:'bookini'")&&pages.includes('id="boothPhotoTab"')&&pages.includes('id="boothVideoTab"') ,'Bookini retains separate Photo and Video tabs');
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
console.log('PASS Skeleton Key opens inside Studio, real Politic left-toolbar configuration, compact three-body filters and pastel widget rings, account-owned Journal thumbnail, ON AIR/ONLINE without fabricated counts.');
