import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import vm from 'node:vm';
const read=p=>readFileSync(new URL('./'+p,import.meta.url),'utf8');
test('WLA on-demand shelf does not schedule or auto-tune TV',()=>{
 const js=read('stream-guide.js');new vm.Script(js);
 assert.match(js,/\['entertainment','news','wla'\]/);
 assert.match(js,/state\.category==='lwa-tv'&&state\.tvSection==='wla'\)\)return/);
 assert.match(js,/if\(onDemand\)return/);
 assert.match(js,/mountWla\(copy,detail\);return/);
 const wla=js.slice(js.indexOf('function mountWla('),js.indexOf('function renderCategory('));
 assert.doesNotMatch(wla,/<iframe|<script|cinejoy/i);
 assert.match(wla,/https:\/\/www\.justwatch\.com\/us\/search/);
 for(const file of ['index.html','studio/index.html','404.html','live-studio-shell.html'])assert.equal((read(file).match(/&wla=20261126-1/g)||[]).length,2);
});