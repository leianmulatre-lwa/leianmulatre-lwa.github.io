/* Regression guard: Music integration is a truthful placeholder until OAuth is approved. */
import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('./'+path,import.meta.url),'utf8');
const guide=read('stream-guide.js'),theme=read('stream-guide.css'),
 stereo=read('studio-upper-rail-size-contract-20261103.css'),
 loader=read('studio-yellow-collapse-20261026.js');
test('Stream JS is valid and music is a fifth tab but not a fake programmed station',()=>{
 assert.doesNotThrow(()=>new vm.Script(guide));
 assert.match(guide,/\['music','music','CH 05'\]/);
 assert.match(guide,/programmedCategories=\(\)=>categories\.filter\(\(\[id\]\)=>id!=='music'\)/);
 assert.match(guide,/state\.category==='music'/);
 assert.match(guide,/function musicStandby\(/);
 assert.match(guide,/function musicSetupMarkup\(/);
 assert.match(guide,/if\(grid\)grid\.hidden=false/);
 assert.match(guide,/stream-music-other-channels/);
 assert.match(guide,/data-stream-open-tunes/);
 const setup=guide.slice(guide.indexOf('function musicSetupMarkup(){'),guide.indexOf('function renderCategory(){'));
 assert.doesNotMatch(setup,/fetch\(|XMLHttpRequest|client_secret|access_token/);
 const win={};
 vm.runInNewContext(guide,{window:win,console,URL,Date,document:{readyState:'loading',addEventListener(){}},setTimeout(){}});
 const rows=win.BigLWAStreamGuide.getDailyGuide('2026-11-15');
 assert.equal(rows.some(row=>row.category==='music'),false,'Music must not masquerade as curated broadcast slots');
 assert.equal(rows.find(row=>row.category==='podcast').slots.length,24);
});
test('Provider setup states and navigation do not pretend to be OAuth connections',()=>{
 for(const name of ['Spotify','Apple Music','SoundCloud','YouTube Music'])assert(guide.includes("label:'"+name+"'"));
 assert.match(guide,/Profile linked · API not connected/);
 assert.match(guide,/Awaiting API authorization/);
 assert.match(guide,/href="\/studio\/orbit"/);
 assert.match(guide,/profileMusicOpen/);
 assert.match(guide,/Cloudflare/);
});
test('Music has a five-column responsive layout with no fake player or links',()=>{
 assert.match(theme,/grid-template-columns:repeat\(5,minmax\(0,1fr\)\)!important/);
 assert.match(theme,/stream-music-provider-grid/);
 assert.match(theme,/@media\(max-width:750px\)/);
 assert.match(theme,/\.stream-music-other-channels/);
});
test('Stereo seek bar lives at bottom of CRT without an absolute overlay',()=>{
 assert.match(stereo,/stereo-display>\.stereo-time-scale\{/);
 assert.match(stereo,/margin-top:auto!important/);
 assert.match(stereo,/bottom:auto!important/);
 assert.match(stereo,/display:flex!important;flex-direction:column!important/);
 assert.match(loader,/timeline=20261115-bottom-v1/);
});
test('Every public Studio shell loads fresh Stream assets',()=>{
 for(const path of ['index.html','studio/index.html','404.html','live-studio-shell.html']){
  const html=read(path);
  assert.equal((html.match(/stream-guide\.js\?v=[^"]+&music=20261115-ch05-1/g)||[]).length,1,path+' JS');
  assert.equal((html.match(/stream-guide\.css\?v=[^"]+&music=20261115-ch05-1/g)||[]).length,1,path+' CSS');
 }
});
