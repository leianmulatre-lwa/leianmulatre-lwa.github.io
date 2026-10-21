/* Regression: board-first UI, six-board recency, member isolation and one Stream status. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
const read=path=>readFileSync(new URL('./'+path,import.meta.url),'utf8');
const pinterest=read('pinterest-orbit.js');
const layout=read('ui-coherence.js');
const index=read('index.html');
assert.doesNotThrow(()=>new Script(pinterest),'Pinterest client parses');
assert.doesNotThrow(()=>new Script(layout),'Studio widget layout parses');
assert.ok(index.includes('/pinterest-orbit.js?v=20261021-private-auto-7'),'Fresh Boards script shipped');
assert.ok(index.includes('/ui-coherence.js?v=20261021-stable-navigation-28'),'Updated Stream and Room UI shipped');
assert.ok(pinterest.includes('const tiles=orderedBoards().map'),'Every board is shown without manual pagination');
assert.ok(pinterest.includes('authUid&&savedDrawerOpen?')&&pinterest.includes('savedBoardsMarkup()'), 'Private saved boards only appear in the optional management drawer');
assert.ok(pinterest.indexOf('boardGrid(disabled)+')<pinterest.indexOf("+'originalPinsMarkup;") || pinterest.indexOf('boardGrid(disabled)+')<pinterest.lastIndexOf('originalPinsMarkup;'),'Board grid appears before original Pins');
assert.ok(pinterest.includes('recentBoardKey=()=>authUid?'),'Recents key must come from signed-in account identity');
assert.ok(pinterest.includes('restoreBoardOrder();'),'Past selections restore after account verification');
assert.ok(pinterest.includes('if(!more){rememberBoardSelection(id);'),'Clicking a board updates its recency, not paging within it');
assert.ok(pinterest.includes('const ids=orderedBoards().filter')&&pinterest.includes('await loadCovers(ids)'),'Board covers load automatically in background batches');
const start=pinterest.indexOf(' const recentBoardKey=');
const end=pinterest.indexOf(' const storageGet=',start);
assert.ok(start>0&&end>start,'Board-recency logic can be isolated for unit testing');
const sample=pinterest.slice(start,end);
const saved=new Map();
const factory=new Function('saved',[
 "let authUid='memberA';",
 "let boards=Array.from({length:8},(_,i)=>({id:String(i+1),name:'Board '+(i+1)}));",
 "let renders=0;",
 "const localStorage={getItem:key=>saved.get(key)||null,setItem:(key,value)=>saved.set(key,value)};",
 "const render=()=>{renders++};",
 sample,
 "return {choose:rememberBoardSelection,order:()=>orderedBoards().map(x=>x.id),recent:()=>recentBoardIds.slice(),load:restoreBoardOrder,user:uid=>{authUid=uid;restoreBoardOrder()},renders:()=>renders};"
].join('\n'));
const h=factory(saved);
assert.deepEqual(h.order().slice(0,6),['1','2','3','4','5','6']);
assert.equal(h.choose('8'),true);
assert.deepEqual(h.order().slice(0,6),['8','1','2','3','4','5']);
assert.equal(h.choose('3'),true);
assert.deepEqual(h.order().slice(0,6),['3','8','1','2','4','5']);
assert.equal(h.choose('bad-pin'),false,'Invalid board id cannot alter order');
assert.equal(saved.has('biglwaPinterestRecentBoardsV1:memberA'),true);
h.user('memberB');
assert.equal(h.order()[0],'1','Another user must not inherit member A history');
assert.equal(h.choose('6'),true);
assert.deepEqual(h.order().slice(0,2),['6','1']);
h.user('memberA');
assert.deepEqual(h.order().slice(0,2),['3','8'],'Member A recents survive a user switch');
const h2=factory(saved);
h2.load();
assert.deepEqual(h2.order().slice(0,2),['3','8'],'Recents survive reload for the same account');
assert.ok(layout.includes("Array.from(screen.querySelectorAll(':scope > .on-air')).forEach(badge=>badge.remove())"),'Retired top ON AIR badge is removed');
assert.ok(layout.includes('#studioApp #stream .stream-screen>.on-air{display:none!important}'),'Top overlay suppressed on first paint');
assert.ok(layout.includes("status.textContent='ON AIR'"),'Single beneath-player ON AIR status remains');
assert.ok(layout.includes("status.textContent='ONLINE'"),'Room label remains ONLINE');
assert.ok(layout.includes('.room-presence-status::before')&&layout.includes('background:#3da568'),'Room has visible green dot');
assert.ok(!layout.includes("count.textContent='0 watching'"),'Do not simulate viewership');
console.log('PASS: all boards shown with recently selected boards first, originals after boards, per-account persistence, green ONLINE light and single ON AIR footer');
