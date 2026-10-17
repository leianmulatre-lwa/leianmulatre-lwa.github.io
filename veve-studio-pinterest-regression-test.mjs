import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
const read=path=>readFileSync(new URL('./'+path,import.meta.url),'utf8');
const veve=read('veve.js'),veveCss=read('veve.css'),pinterest=read('pinterest-orbit.js'),
 boardsCss=read('pinterest-boards.css'),onboarding=read('studio-onboarding.js'),
 modules=read('module-pages.js'),settings=read('settings/index.html'),
 brand=read('brand-policy.css'),index=read('index.html');
for(const [name,code] of [['veve.js',veve],['pinterest-orbit.js',pinterest],
 ['studio-onboarding.js',onboarding],['module-pages.js',modules]])
 assert.doesNotThrow(()=>new Script(code,{filename:name}),name+' must parse');
const checks=[
 ['Veve tiles omit visible photo captions',!veve.includes("'<p class=\"veve-caption\">'")&&veveCss.includes('.veve-photo .veve-caption{display:none')],
 ['Veve previews retain captions',veve.includes("d.querySelector('#vevePreviewCaptionText').textContent=caption")],
 ['Pinterest attribution appears without account names',veve.includes('Original Pinterest Pin ↗')&&veve.includes('veve-source-credit')],
 ['Owner can publish loaded board Pins',pinterest.includes('data-pn-publish-board')&&pinterest.includes('publishBoardToVeve')],
 ['Saved board lock blocks publication',pinterest.includes("if(saved&&boardLocks[id]===true)")&&pinterest.includes("boardLocks[board.id]===true||!(board.pins||[]).length")],
 ['Public board upload requires confirmation',pinterest.includes('window.confirm(')&&pinterest.includes('Collective Feed and Veve')],
 ['Bulk posts reuse verified publisher',pinterest.includes("await importer('pinterest',[media]")&&pinterest.includes('await publisher(postId)')],
 ['Pinterest 401 does not reset Big LWA login',!pinterest.includes("if(res.status===401){save('');resetView()}")&&pinterest.includes('needsReconnect:true')],
 ['Pinterest 401 attempts recovery before reconnect',pinterest.includes('recoverOrBindPinterestSession().catch')],
 ['Studio tutorial optional and dismissible',onboarding.includes('data-tour-dismiss')&&onboarding.includes('is-tutorial-dismissed')],
 ['Tutorial dismissal stored per user',onboarding.includes('biglwaStudioTutorialDismissed:v1:')&&onboarding.includes('studioTutorialDismissed:true')],
 ['Tutorial can be reopened from Settings',settings.includes('/studio?tutorial=1')],
 ['Journal initial shifted down',modules.includes('top:37%!important')],
 ['Supporter carousel uses bare PNG logos',brand.includes('.supporter-logo img')&&brand.includes('background:transparent!important')],
 ['New scripts referenced',index.includes('studio-onboarding.js?v=')&&index.includes('pinterest-orbit.js?v=20261016-original-pins-separate-1')],
 ['Board publish CSS loads',pinterest.includes('pinterest-boards.css?v=20261014-board-publish-4')&&boardsCss.includes('pn-board-publish-tools')]
];
for(const [name,ok] of checks)console.log((ok?'PASS':'FAIL')+' · '+name);
assert.ok(checks.every(x=>x[1]),'Veve, onboarding, Pinterest and supporter regression checks failed.');
console.log(checks.length+' combined regression checks passed.');
