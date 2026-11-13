import assert from 'node:assert/strict';
import vm from 'node:vm';
import test from 'node:test';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const history=read('lwazi-history.js');
const search=read('user-search-results.js');
const css=read('lwazi-conversation-history.css');
const settings=read('settings/index.html');
const entrypoints=['index.html','studio/index.html','404.html','live-studio-shell.html'];
function storage(){
 const items=new Map();
 return {getItem:key=>items.has(key)?items.get(key):null,setItem:(key,v)=>items.set(key,v),
   removeItem:key=>items.delete(key)};
}
test('history is account-isolated, guest-only session history, bounded and erasable',()=>{
 const local=storage(),session=storage(),events=[];
 const win={dispatchEvent:e=>events.push(e),addEventListener(){}};
 const doc={readyState:'loading',addEventListener(){}};
 const ctx={window:win,document:doc,localStorage:local,sessionStorage:session,
   CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail}},
   Date,Math,JSON,Intl,console};
 vm.runInNewContext(history,ctx,{filename:'lwazi-history.js'});
 const api=win.BigLWALwaziHistory;
 assert(api,'Account-specific Lwazi history exported');
 api.setUid('alpha');
 const first=api.add('What is a political body?','deep');
 assert(first);
 assert.equal(api.read().length,1);
 assert.equal(api.read()[0].mode,'deep');
 assert(api.update(first,{turns:[{role:'user',text:'What is a political body?'},{role:'assistant',text:'A social identity shaped by institutions.'}]}));
 assert.equal(api.read()[0].turns.length,2);
 api.setUid('beta');
 assert.equal(api.read().length,0,'Another account cannot see first account history');
 api.add('A private search','npc');
 api.setUid('alpha');
 assert.equal(api.read().length,1,'Original account retains its own entries');
 assert.equal(api.group().length,1,'Month organization is deterministic');
 assert(api.clearMonth(api.group()[0].id));
 assert.equal(api.read().length,0);
 api.setUid('');
 api.add('Temporary guest query','off');
 assert.equal(api.read().length,1,'Guest history is in this session');
 assert.equal(local.getItem('biglwa:lwazi:history:v1:guest'),null,'No guest traces in persistent localStorage');
 assert(session.getItem('biglwa:lwazi:history:v1:guest'));
 api.setUid('beta');
 assert.equal(api.read().length,1);
 assert(api.clearAll());
 assert.equal(api.read().length,0);
 assert(events.some(e=>e.type==='biglwa:lwazi-history-changed'));
});
test('AI is off until icon NPC or Deep is selected and thread is continuable',()=>{
 assert.match(search,/var lwaziMode='off'/);
 assert.match(search,/data-lwazi-mode="off"/);
 assert.match(search,/data-lwazi-mode="npc"/);
 assert.match(search,/data-lwazi-mode="deep"/);
 assert.match(search,/var aiActive=lwaziMode!=='off'/);
 assert.match(search,/var answerPromise=lwaziMode==='off'\|\|/);
 assert.match(search,/if\(answerPromise\)answerPromise\.then/);
 assert.match(search,/bl-lwazi-continue-form/);
 assert.match(search,/followForm\.addEventListener\('submit'/);
 assert.match(search,/turns\.push\(\{role:'user',text:follow\},\{role:'assistant'/);
 assert.match(search,/var fullPrompt=/);
 assert.match(search,/openPanel\(entry\.q,\{historyId:entry\.id,restore:true\}\)/);
});
test('clicking main search resets submitted text and shows month-grouped history',()=>{
 assert.match(search,/search\.addEventListener\('pointerdown'/);
 assert.match(search,/search\.dataset\.blSubmitted==='1'/);
 assert.match(search,/search\.value=''/);
 assert.match(search,/search\.addEventListener\('input',showHistory\)/);
 assert.match(search,/bl-lwazi-history-month/);
 assert.match(search,/Manage history/);
});
test('latest answer shares the header with the close X, thread follows in the flow',()=>{
 assert.match(search,/<div class="bl-search-head"><article class="bl-lwazi-answer"/);
 assert.match(search,/bl-search-close/);
 assert.match(search,/<section class="bl-lwazi-conversation"/);
 assert.match(css,/#bl-studio-search-results>\.bl-search-head/);
 assert.match(css,/#bl-studio-search-results>\.bl-lwazi-conversation/);
 assert.match(css,/\.bl-lwazi-answer\[hidden\]/);
 assert.match(settings,/id="lwaziHistorySettings"/);
 assert.match(settings,/id="lwaziHistoryMonths"/);
 assert.match(settings,/data-lwazi-clear-all/);
 assert.match(settings,/lwazi-history\.js\?v=/);
});
test('all four Studio loaders use history before the search and scoped conversation CSS',()=>{
 for(const p of entrypoints){
  const html=read(p),a=html.indexOf('/lwazi-history.js?v='),b=html.indexOf('/user-search-results.js?v=');
  assert(a>=0&&a<b,p+' loads history before search');
  assert(html.includes('/lwazi-conversation-history.css?v='),p+' loads styles');
  assert.equal((html.match(/\/lwazi-history\.js\?v=/g)||[]).length,1,p+' history only once');
 }
});
