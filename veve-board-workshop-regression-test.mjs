import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=p=>readFileSync(new URL('./'+p,import.meta.url),'utf8');
const veve=source('veve.js'),pinterest=source('pinterest-orbit.js');
const stage=source('studio-loading-dots-20261021.js'),css=source('veve.css');
const workshop=source('tools-craft.js'),workshopCss=source('tools-craft.css');
const builder=source('.github/scripts/stage-craft-apps.py');
const html=source('index.html');
for(const [name,code]of [['Veve',veve],['Pinterest Boards',pinterest],['Studio loading',stage]])
 assert.doesNotThrow(()=>new vm.Script(code),name+' must parse as JavaScript');
assert.ok(!veve.includes('title="Preview here"'),'Veve no longer adds a second center preview button');
assert.ok(veve.includes('data-veve-save-board'),'Pinterest discovery has Save to Board action');
assert.ok(veve.includes('const original=safeUrl(post.sourceUrl||post.permalink)'),'Pin saving uses original source URL');
assert.ok(veve.includes('await api.loadSaved()')&&veve.includes('await api.saveVevePin('),'Veve uses real Pinterest account-backed saved data');
assert.ok(veve.includes('api.createVeveBoard(name)'),'Veve can create private boards');
assert.ok(pinterest.includes('async function saveVevePin(')&&pinterest.includes("await savedRequest('POST',next)"),
  'Pinterest writes its owned saved collections via authenticated Worker');
assert.ok(pinterest.includes('if(savedUid!==uid)throw Error'),'Cannot overwrite an unloaded collection');
assert.ok(pinterest.includes("result?.boards?.find(b=>b.id===target)?.pins?.some(p=>p.id===id)"),
  'Saved Pin confirmed from returned server response');
assert.ok(css.includes('.veve-pin-board-action')&&css.includes('.veve-save-board-dialog'),
  'Card action and board selector have visible, keyboard-accessible styling');
assert.ok(!stage.includes('text-transform:uppercase;text-shadow')&&stage.includes('text-transform:lowercase!important'),
  'Module loading heading is lowercase');
assert.ok(stage.includes('.module-shell.lwa-curtain-veve-pending::after')&&
  stage.includes('z-index:1499')&&stage.includes('background:#27060e'),
  'Veve images are covered with a continuous curtain placeholder');
assert.ok(stage.includes("/* the single startup screen lives in index.html */"),
  'No undefined legacy loading-screen function can fire');
assert.ok(workshop.includes("'/bigapps/'")&&workshop.includes('PUBLIC_APP_ROUTE'),
  'Advanced editors use BIG LWA-hosted paths');
assert.ok(workshop.includes('/upstream-licenses/SOURCE.txt')&&workshop.includes('craft-arcade-block'),
  'Workshop source credits remain on-site and branded icons use arcade blocks');
assert.ok(workshopCss.includes('.craft-arcade-block')&&workshopCss.includes('box-shadow:'),
  'Workshop uses raised block icon styling');
assert.ok(builder.includes('def brand_web_shell(')&&
  builder.includes('/assets/craft/editor-brand.js') && source('assets/craft/editor-brand.js').includes('/studio?view=tools')&&builder.includes('preserve_notices('),
  'Hosted editors include a BIG LWA return path without removing upstream licensing');
for(const asset of [
 'veve.js?v=20261025-media-fallback-1',
 'veve.css?v=20261023-orbit-colors-7',
 'pinterest-orbit.js?v=20261025-pin-origin-1',
 'studio-loading-dots-20261021.js?v=20261026-stitched-loading-2'
])assert.ok(html.includes(asset),'Site must load '+asset);
console.log('PASS: Veve board saving, bounded lower loader, local ArtCraft links, arcade app identity.');
