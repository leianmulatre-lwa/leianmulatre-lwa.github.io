import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const nodes=new Map();class El{constructor(){this.children=[];this.value='';this.readOnly=false}append(e){this.children.push(e)}setAttribute(){} }
for(const id of ['game','controls','status','title','help'])nodes.set(id,new El());
const document={getElementById:id=>nodes.get(id),createElement:()=>new El()};
vm.runInNewContext(read('./arcade/local.js'),{document,location:{search:'?game=sudoku'},URLSearchParams,Set});
const cells=nodes.get('game').children[0].children,check=nodes.get('controls').children[0];
assert.equal(cells.length,81);check.onclick();assert.match(nodes.get('status').textContent,/empty/);
const solution='534678912672195348198342567859761423426853791713924856961537284287419635345286179';
cells.forEach((cell,i)=>{if(!cell.readOnly)cell.value=solution[i]});check.onclick();assert.match(nodes.get('status').textContent,/Solved/);
cells[2].value='5';check.onclick();assert.match(nodes.get('status').textContent,/repeat/);
nodes.get('controls').children[1].onclick();assert.equal(cells[0].value,'5');assert.equal(cells[2].value,'');
const player=read('./arcade/player.js');assert.match(player,/allowScriptAccess:false/);assert.match(player,/allowNetworking:'none'/);assert.match(player,/openUrlMode:'deny'/);assert.match(player,/file.arrayBuffer/);assert.doesNotMatch(player,/window.open|XMLHttpRequest/);
const swf=Buffer.from(read('./arcade/flash-test.b64'),'base64');assert.equal(swf.subarray(0,3).toString(),'FWS');assert.equal(swf.readUInt32LE(4),swf.length);
assert.match(read('./.github/scripts/stage-ruffle.py'),/sha256\(data\).*SHA256/);
console.log('PASS local puzzle win/error/reset, Flash isolation, SWF fixture and pinned runtime staging');

assert.ok(read('./module-pages.js').includes("$$('[data-directory-play]',body).forEach"),'Directory binds every button without throwing');
