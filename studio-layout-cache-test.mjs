import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
const read=path=>readFileSync(new URL('./'+path,import.meta.url),'utf8');
const layout=read('ui-coherence.js'),veve=read('veve.js'),
  settings=read('settings/index.html'),cache=read('settings-cache.js'),home=read('index.html'),
  directDrag=read('studio-experience.js'),avatar=read('avatar-studio.js');
for(const [path,source] of [['ui-coherence.js',layout],['veve.js',veve],['settings-cache.js',cache]]){
  assert.doesNotThrow(()=>new Script(source,{filename:path}),path+' should parse');
}
const checks=[
 ['Account scoped storage',layout.includes('biglwaStudioLayoutV4:')&&layout.includes('scopedLayoutKey()')],
 ['Persist exact DOM order',layout.includes('const snapshot=realDomOrder(app);')],
 ['Remote timestamp conflict guard',layout.includes('localTime>remoteTime?local:remoteLayout')],
 ['No startup layout writes',layout.includes('Never save during startup or on periodic run()')],
 ['Cloud-backed saves',layout.includes('saveCustomizations({layout:snapshot})')],
 ['Politc and Tools default priority',layout.includes("['politc','politic','tools','calendar'")],
 ['Assistive keyboard reorder',layout.includes('Alt+ArrowLeft')&&layout.includes('event.altKey')],
 ['Accessible move announcement',layout.includes("setAttribute('aria-live','polite')")],
 ['Late widgets stable',layout.includes('biglwaLayoutMembership')],
 ['Veve no date-based jitter',!veve.includes("const salt=new Date().toISOString().slice(0,10)")&&veve.includes("const salt=String(state.uid||'guest')")],
 ['Settings Cache section',settings.includes('id="cache"')&&settings.includes('id="clearTemporaryCache"')],
 ['Cache preserves layouts, sign-in, projects',!cache.includes('localStorage.clear(')&&!cache.includes('sessionStorage.clear(')&&!cache.includes('indexedDB.deleteDatabase(')],
 ['Settings cache script installed',settings.includes('/settings-cache.js?v=20261014-safe-cache-1')],
 ['Fresh Studio layout script',home.includes('ui-coherence.js?v=20261015-arcade-stream-sqwib-10')],
 ['Direct drag saves canonical account layout',directDrag.includes('window.BigLWAStudioLayout.save()')],
 ['Direct drag ignores retired V2 restore',directDrag.includes('if(window.BigLWAStudioLayout)return')],
 ['Aura/Avatar honors scoped order',avatar.includes('window.BigLWAStudioLayout?.snapshot?.()?.order?.[rail.id]')&&!avatar.includes("localStorage.getItem('biglwaWidgetOrderV2')")],
 ['Direct drag latest cache',home.includes('studio-experience.js?v=20261015-eject-fixed-cloud-3')]
];
for(const [label,ok] of checks){console.log((ok?'PASS':'FAIL')+' · '+label)}
assert.ok(checks.every(([,ok])=>ok),'Studio layout/cache accessibility regression');
console.log('Validated '+checks.length+' Studio layout/cache safeguards.');
