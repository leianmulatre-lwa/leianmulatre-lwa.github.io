import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=path=>readFileSync(new URL('./'+path,import.meta.url),'utf8');
const pjs=read('politc-post-election-results-20261113.js');
const pcss=read('politc-post-election-20261113.css');
const mapjs=read('map-lwa-experience-20261113.js');
const mapcss=read('map-lwa-experience-20261113.css');
const map=read('map-app.html');
const mod=read('module-pages.js');
const shells=['index.html','studio/index.html','404.html','live-studio-shell.html'];
test('both new interactive scripts parse and deployed pages load them',()=>{
 assert.doesNotThrow(()=>new vm.Script(pjs));
 assert.doesNotThrow(()=>new vm.Script(mapjs));
 for(const path of shells){
  const text=read(path);
  assert.match(text,/politc-post-election-results-20261113\.js/);
  assert.match(text,/politc-post-election-20261113\.css/);
  assert.ok(text.indexOf('politc-research-desk-20261113.js')<
   text.indexOf('politc-post-election-results-20261113.js'),
   'Research room must mount before post-election placement');
 }
 assert.match(map,/map-lwa-experience-20261113\.js\?v=20261113-go-v5/);
 assert.match(map,/map-lwa-experience-20261113\.css\?v=20261113-go-v5/);
 assert.match(mod,/20261113-inpage-navigation-go-5/);
});
test('post-election desk is compact by default; original form controls are preserved',()=>{
 assert.match(pjs,/Date\.now\(\)<ELECTION_END/);
 assert.match(pjs,/document\.createElement\(/);
 assert.match(pjs,/while\(zone\.firstChild\)content\.append\(zone\.firstChild\)/);
 assert.match(pcss,/\.politc-election-zone\.politc-election-is-past/);
 assert.match(pcss,/\.politc-post-election-summary/);
 assert.match(pjs,/details\.append\(sum\)/);
 assert.doesNotMatch(pjs,/localStorage\.(?:removeItem|clear)\(/);
});
test('Election, results and Reading Room occupy one responsive row',()=>{
 const research=read('politc-research-desk-20261113.js');
 assert.match(pjs,/board\.insertBefore\(topRow,live\)/);
 assert.match(pjs,/topRow\.append\(election,section,reader\)/);
 assert.match(pjs,/politc-three-up/);
 assert.match(pjs,/politc-card-expanded/);
 assert.match(pjs,/fold\.addEventListener\('toggle',sync\)/);
 assert.match(pcss,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(pcss,/max-width:1120px/);
 assert.match(pcss,/max-width:760px/);
 assert.match(pcss,/\.politc-three-up > \.politc-card-expanded/);
 // Expanding never takes over the three-column grid.
 assert.doesNotMatch(pcss, /\.politc-three-up > \.politc-card-expanded\{\s*grid-column:1\/-1!important/);
 assert.match(pcss, /\.politc-three-up > section\.politc-card-expanded\{\s*grid-column:auto!important/);
 assert.match(pcss, /align-items:start!important/);
 assert.match(pcss, /\.politc-three-up \.politc-research-form\{\s*grid-template-columns:minmax\(0,1fr\)!important/);
 assert.match(pcss, /max-height:min\(76vh,840px\)!important/);
 assert.match(research,/politc-research-fold/);
 assert.match(research,/foldSummary\.append\(intro,foldButton\)/);
 assert.match(research,/foldBody\.append\(form,state,results,viewer\)/);
 assert.match(research,/fold\.append\(foldSummary,foldBody\)/);
 assert.match(pjs,/const live=board\?\.querySelector\('\.politc-live-zone'\)/);
});
test('politician photos use matched Commons entries and safe placeholders',()=>{
 const ctx={window:{},document:{addEventListener:()=>{}},
  Date,URL,AbortController,setTimeout,clearTimeout,fetch:()=>{}};
 vm.runInNewContext(pjs,ctx);
 const resolve=ctx.window.BigLWAPolitcPostElection.portraitInfo;
 const x=resolve('Xavier Becerra'),steve=resolve(' STEVE  HILTON ');
 assert.equal(x.file,'HHS Xavier Becerra.jpg');
 assert.match(x.credit,/public domain/);
 assert.equal(steve.file,'Steve Hilton Madera 2026.jpg');
 assert.match(steve.credit,/CC BY-SA 4\.0/);
 assert.equal(resolve('Generic unrelated person'),null);
 assert.match(pjs,/commons\.wikimedia\.org\/wiki\/Special:FilePath\//);
 assert.match(pjs,/commons\.wikimedia\.org\/wiki\/File:/);
 assert.match(pjs,/photo\.addEventListener\('error'/);
 assert.match(pjs,/frame\.append\(fallback\(\)\)/);
 assert.match(pjs,/person\.append\(portrait\(c\.name\),title\)/);
 assert.match(pjs,/hydrateNominees\(body\)/);
 assert.match(pjs,/observer\.observe\(area,\{childList:true\}\)/);
});

test('official LA result shape is parsed from real source and never invents a race call',()=>{
 const context={window:{},document:{addEventListener:()=>{}},
  Date,URL,AbortController,setTimeout,clearTimeout,fetch:()=>{}};
 vm.runInNewContext(pjs,context);
 const parse=context.window.BigLWAPolitcPostElection.sourceContests;
 const sample={Election:{ContestGroups:[{Name:'Governor',Contests:[{
  Title:'GOVERNOR',Type:'Candidate',AdditionalText:'Los Angeles County Results Only',
  Candidates:[{Name:'A',Party:'Independent',Votes:20},{Name:'B',Party:'Democratic',Votes:15}]
 }]}]}};
 const out=parse(sample);
 assert.equal(out.length,1);assert.equal(out[0].title,'GOVERNOR');
 assert.equal(out[0].candidates[0].votes,20);
 assert.match(pjs,/results\.lavote\.gov\/electionresults\/json\?electionid=4348/);
 assert.match(pjs,/UNOFFICIAL|Unofficial/);
 assert.match(pjs,/NOT current/);
 assert.match(pjs,/2026-11-10T17:01:24/);
 assert.equal(parse({Election:{ContestGroups:[]}}).length,0);
 assert.doesNotMatch(pjs,/data-voter-address|navigator\.geolocation|localStorage\.setItem/);
});
test('county map shows geographic outlines only with no guessed county-level vote counts',()=>{
 assert.match(pjs,/geojson-counties-fips\.json/);
 assert.match(pjs,/^.*only LA County has an integrated contest feed.*$/im);
 assert.match(pjs,/county outline is not a map of how anyone voted/);
 assert.match(pjs,/role','button'/);
 assert.match(pjs,/e\.key==='Enter'/);
 assert.match(pcss,/\.politc-county-svg path\.is-selected/);
});
test('Live trackers are compact and independently stacked beneath each top card',()=>{
 assert.match(pjs,/politc-independent-deck/);
 assert.match(pjs,/topRow\.replaceWith\(deck\)/);
 assert.match(pjs,/trackers=\[\.\.\.live\.children\]/);
 assert.match(pjs,/lane\.append\(topCard\)/);
 assert.match(pjs,/lane\.append\(card\)/);
 assert.match(pjs,/prev\.addEventListener\('click',\(\)=>rotate\(-1\)\)/);
 assert.match(pjs,/next\.addEventListener\('click',\(\)=>rotate\(1\)\)/);
 assert.match(pjs,/live\.remove\(\)/);
 assert.match(pcss,/grid-template-columns:132px repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(pcss,/height:305px!important/);
 assert.match(pcss,/overflow-y:auto!important/);
 assert.match(pcss,/\.politc-live-rail/);
});

test('Go uses a real route with explicit GPS consent and voice controls',()=>{
 const nav=read('map-lwa-navigate-20261113.js');
 const router=read('map-lwa-router-20261113.js');
 assert.doesNotThrow(()=>new vm.Script(nav));
 assert.match(nav,/get\('mapNavGo'\)/);
 assert.match(nav,/watchPosition\(/);
 assert.match(nav,/clearWatch\(watchId\)/);
 assert.match(nav,/event\.detail/);
 assert.match(nav,/route\.maneuvers\.length>0/);
 assert.match(nav,/biglwa:map-navigation-route/);
 assert.match(nav,/SpeechSynthesisUtterance/);
 assert.match(nav,/SpeechRecognition\|\|window\.webkitSpeechRecognition/);
 assert.match(nav,/Replan from my location/);
 assert.match(nav,/pagehide/);
 assert.match(nav,/onPath\(planned\.points,where\)/);
 assert.match(router,/begin_shape_index/);
 assert.match(router,/verbal_pre_transition_instruction/);
 assert.match(mapjs,/biglwa:map-navigation-route/);
 assert.match(mapjs,/biglwa:map-navigation-reset/);
 assert.match(map,/map-lwa-navigate-20261113\.js/);
});

test('main Map holds permanent canvas on left and independent right-side tabs',()=>{
 assert.match(mapjs,/map-workspace-split/);
 assert.match(mapjs,/sidebar\.replaceChildren\(deskHead,tabbar,panes\)/);
 assert.match(mapjs,/selectDeskTab=\(key,userAction=false\)/);
 for(const id of ['mapPlanPane','mapEditPane','mapSavedPane','mapPublicPane'])
  assert.ok(mapjs.includes(id));
 assert.match(mapjs,/role','tablist'/);
 assert.match(mapjs,/aria-controls/);
 assert.match(mapjs,/bridge\.map\.invalidateSize/);
 assert.match(mapcss,/min-width: 960px/);
 assert.match(mapcss,/grid-template-columns:minmax\(0,1fr\) minmax\(350px,0\.96fr\)/);
 assert.match(mapcss,/\.map-tool-panels\{/);
 assert.match(mapcss,/overflow:auto;overscroll-behavior:contain/);
 assert.match(mapcss,/\.map-workspace-pane\[hidden\]\{display:none!important\}/);
 assert.match(mapcss,/max-width: 959px/);
});
