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
 ['Boards offer explicit private Archive and selected public destinations',pinterest.includes('Keep private in Archive')&&pinterest.includes('Post to MyFeed')&&pinterest.includes('Post to Veve')],
 ['Saved boards can be locked',pinterest.includes('data-pn-lock-board')&&pinterest.includes('boardLocks[board.id]===true')],
 ['Boards requires confirmation for selected public posts',pinterest.includes("window.confirm('Post '")&&pinterest.includes('picked.length')],
 ['Bulk posts reuse verified publisher',pinterest.includes("await importer('pinterest',[media]")&&pinterest.includes('await publisher(postId)')],
 ['Pinterest 401 does not reset Big LWA login',!pinterest.includes("if(res.status===401){save('');resetView()}")&&pinterest.includes('needsReconnect:true')],
 ['Pinterest 401 attempts recovery before reconnect',pinterest.includes('recoverOrBindPinterestSession().catch')],
 ['Studio tutorial optional and dismissible',onboarding.includes('data-tour-dismiss')&&onboarding.includes('is-tutorial-dismissed')],
 ['Tutorial dismissal stored per user',onboarding.includes('biglwaStudioTutorialDismissed:v1:')&&onboarding.includes('studioTutorialDismissed:true')],
 ['Tutorial can be reopened from Settings',settings.includes('/studio?tutorial=1')],
 ['Journal initial shifted down',modules.includes('top:37%!important')],
 ['Supporter carousel uses bare PNG logos',brand.includes('.supporter-logo img')&&brand.includes('background:transparent!important')],
 ['New scripts referenced',index.includes('studio-onboarding.js?v=')&&index.includes('pinterest-orbit.js?v=20261028-oauth-return-2')],
 ['Board styles load for private collections',pinterest.includes('pinterest-boards.css?v=')&&boardsCss.includes('pn-board-view-actions')]
];
for(const [name,ok] of checks)console.log((ok?'PASS':'FAIL')+' · '+name);
assert.ok(checks.every(x=>x[1]),'Veve, onboarding, Pinterest and supporter regression checks failed.');
console.log(checks.length+' combined regression checks passed.');
