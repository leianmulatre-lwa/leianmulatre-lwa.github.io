import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('Pages preview uses bound same-origin Lwazi relay while primary domain keeps Worker route',()=>{
 const html=read('index.html');
 assert.match(html,/location\.hostname\.endsWith\("\.biglwa-web-staging\.pages\.dev"\)\?"\/api\/lwazi"/);
 assert.match(html,/biglwa-lwazi-pilot\.leianmulatre-284\.workers\.dev\/api\/lwazi/);
});
test('search explains missing binding and upstream outages without hiding results',()=>{
 const search=read('user-search-results.js');
 assert.match(search,/pilot_binding_missing\|lwazi_pilot_unavailable\|upstream_health_failed/);
 assert.match(search,/Search results and Studio navigation are still available/);
});
