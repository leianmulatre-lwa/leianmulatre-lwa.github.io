import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
const read=path=>readFileSync(new URL('./'+path,import.meta.url),'utf8');
const pages=read('module-pages.js'),worker=read('cloudflare-worker-instagram.js'),
  links=read('external-link-policy-20261018.js'),recovery=read('studio-recovery.js'),
  ui=read('ui-coherence.js'),index=read('index.html');
for(const [label,source] of [['module-pages',pages],['external-link-policy',links],['studio-recovery',recovery],['ui-coherence',ui]])
 assert.doesNotThrow(()=>new Script(source),label+' must parse');
assert.ok(pages.includes("const playGame=game=>")&&pages.includes("if(target.hostname!=='store.steampowered.com'"),'Playable Arcade tiles enter the emulator');
assert.ok(pages.includes('arcade-frame-keypad')&&pages.includes('frame.contentWindow?.postMessage'),'2048 direction pad forwards into emulator');
assert.ok(links.includes("anchor.setAttribute('target','_blank')")&&links.includes("url.origin===location.origin"),'Outbound links use new tabs but local navigation remains in site');
assert.ok(pages.includes("notes:'Sqwibz'")&&ui.includes("return 'Sqwibz'"),'Sqwibz navigation names use new name');
assert.ok(recovery.includes("data-dock-widget=\\"politc\\"")&&recovery.includes("dataset.widgetId='politc'"),'Politic widget docks to toolbar');
assert.ok(worker.includes("async function oaTextImports")&&worker.includes("action==='imports'"),'X/Tumblr authenticated imports backend exists');
assert.ok(pages.includes('sqwibzOrbitImports')&&pages.includes("sqwibzOrbitImports:imported"),'Imported posts saved privately to owner account');
assert.ok(pages.includes("Make private Sqwibz note")&&pages.includes(".writing-collection-new"),'An imported post creates a separate draft');
assert.ok(pages.includes('Spotlight imports require Snapchat Public Profile API access'),'Unavailable Spotlights are not faked');
assert.ok(index.includes('external-link-policy-20261018.js'),'Outbound link policy is loaded');
console.log('PASS: Arcade default play and controls, safe outgoing links, Sqwibz account imports, Politic dock.');
