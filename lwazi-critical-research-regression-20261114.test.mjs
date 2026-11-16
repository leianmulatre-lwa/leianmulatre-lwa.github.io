import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {SYSTEM_POLICY,routeMode} from './lwazi/policy.mjs';
const read=file=>readFileSync(new URL('./'+file,import.meta.url),'utf8');
const contextSource=read('lwazi-critical-context-20261114.js');
const resultsSource=read('user-search-results.js');
const researchSource=read('politc-research-desk-20261113.js');
const trackers=read('politc-post-election-results-20261113.js');
const library=JSON.parse(read('lwazi-source-library-v02.json'));
const shellNames=['index.html','studio/index.html','404.html','live-studio-shell.html'];
function context(){
 const window={};
 vm.runInNewContext(contextSource,{window});
 return window.BigLWACriticalContext;
}
test('looksmaxxing search does not sanitize incel-linked harms or reduce topic to grooming',()=>{
 const risk=context();
 for(const query of ['looksmaxxing','What is looksmaxxing?','How does softmaxxing relate?','PSL scale explained','What is hardmaxxing?']){
  const answer=risk.lookup(query)?.answer||'';
  assert.match(answer,/incel\/blackpill/i,query);
  assert.match(answer,/misogyny/i,query);
  assert.match(answer,/racist/i,query);
  assert.match(answer,/extreme|dangerous/i,query);
  assert.match(answer,/alternatives/i,query);
  assert.match(answer,/body.image|self.care/i,query);
 }
 for(const benign of ['How can I practice skin care?','I want to exercise safely','How are you?','I have body-image anxiety']){
  assert.equal(risk.lookup(benign),null,'No automatic extremist association: '+benign);
 }
 assert.equal(risk.lookup('i am looksmaxxing')?.kind,'critical-subculture');
 assert(risk.lookup('looksmaxxing').sources.every(s=>s.url.startsWith('https://')));
});
test('site UI shows grounded context in Search Only as well as AI modes',()=>{
 assert.match(resultsSource,/BigLWACriticalContext\?\.lookup\(clean\)/);
 assert.match(resultsSource,/answerArea\.hidden=!aiActive&&!criticalContext/);
 assert.match(resultsSource,/if\(!aiActive\)\{/);
 assert.match(resultsSource,/renderAnswer\(answerBody,criticalContext\.answer\)/);
 assert.match(resultsSource,/BigLWACriticalContext\?\.lookup\(q\)/);
 assert.match(resultsSource,/bl-lwazi-critical-sources/);
 assert.match(resultsSource,/lwazi-source-library-v02\.json\?v=20261114-risk-context-v3/);
 assert.match(SYSTEM_POLICY,/looksmaxxing/i);
 assert.match(SYSTEM_POLICY,/incel\/blackpill/i);
 assert.match(SYSTEM_POLICY,/misogyny/i);
 assert.match(SYSTEM_POLICY,/safe|alternatives/i);
 assert.match(SYSTEM_POLICY,/not to everyone/i);
 assert.equal(routeMode('what is looksmaxxing?'),'fast');
});
test('research source library now includes two actual reviewed studies',()=>{
 const items=library.public_sources.filter(x=>/^SA-LOOKS-0[12]$/.test(x.id));
 assert.equal(items.length,2);
 items.forEach(x=>assert.equal(x.role,'peer_reviewed_scholarship'));
 assert(items.some(x=>x.url.includes('10.1177/17416590251387245')));
 assert(items.some(x=>x.url.includes('PMC11896937')));
});
test('Politic has five sourced tracker records with data-preserving carousel',()=>{
 assert.doesNotThrow(()=>new vm.Script(trackers));
 assert.match(trackers,/const trackerPool=\[\.\.\.trackers,archiveCard,moneyCard\]/);
 assert.match(trackers,/showTrackers\(\)/);
 assert.match(trackers,/const cache=tag\('div','politc-live-card-cache'\)/);
 assert.match(trackers,/lanes\.forEach\(lane=>\{/);
 assert.match(trackers,/cache\.append\(visible\)/);
 assert.match(trackers,/lane\.prepend\(trackerPool\[\(first\+i\)%trackerPool\.length\]\)/);
 assert.match(trackers,/openInRoom\('archivegenocide'\)/);
 assert.match(trackers,/openInRoom\('whofundedgenocide'\)/);
 assert.match(trackers,/original FEC records|Original FEC records/);
});
test('ArchiveGenocide is searched via documented GET API without downloading graphic media',()=>{
 assert.doesNotThrow(()=>new vm.Script(researchSource));
 assert.match(researchSource,/api\.archivegenocide\.com\/v1\/clips/);
 assert.match(researchSource,/searchParams\.set\('per_page','8'\)/);
 assert.match(researchSource,/const rows=Array\.isArray\(data\?\.results\)/);
 assert.match(researchSource,/String\(record\.caption/);
 assert.match(researchSource,/record\.source_archive/);
 assert.match(researchSource,/archivegenocide\.com\/v\//);
 assert.match(researchSource,/text and source links only, never footage or thumbnails/);
 assert.doesNotMatch(researchSource,/record\.thumbnail_url|record\.media_url|innerHTML=record/);
});
test('WhoFundedGenocide includes methodology and FEC original without asserting guilt',()=>{
 assert.match(researchSource,/www\.whofundedgenocide\.com\/methodology\.html/);
 assert.match(researchSource,/www\.fec\.gov\/data\//);
 assert.match(researchSource,/A contribution alone does not prove beliefs/);
 assert.match(researchSource,/kind==='whofundedgenocide'/);
 assert.match(trackers,/does not establish a donor/);
 assert.match(researchSource,/No results were invented/);
});
test('all supported shells ship new critical-answer and archive scripts',()=>{
 for(const path of shellNames){
  const source=read(path);
  assert.match(source,/lwazi-critical-context-20261114\.js/);
  assert.match(source,/lwazi-critical-context-20261114\.css/);
  assert.match(source,/user-search-results\.js\?v=20261115-discovery-intent-v3/);
  assert(source.indexOf('lwazi-critical-context-20261114.js')<
   source.indexOf('user-search-results.js'),path);
  assert.match(source,/politc-post-election-results-20261113\.js\?v=20261114-five-tracks-7/);
  assert.match(source,/politc-research-desk-20261113\.js\?v=20261114-archives-2/);
 }
});
