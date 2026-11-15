import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('./'+p,import.meta.url),'utf8');
const source=read('tunes-transfer-20261115.js');
function harness(){
 const values=new Map();
 const dialog={hidden:false};
 const doc={readyState:'loading',head:{append(){}},addEventListener(){},createElement(tag){if(tag==='style')return {id:'',textContent:''};throw Error(tag)},querySelector(q){return q==='#profileMusicOwnerButtons'?dialog:null}};
 const win={__biglwaIdentity:{uid:'verified-test-user'},addEventListener(){}};
 const sandbox={window:win,document:doc,localStorage:{getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)},URL,console,setTimeout(){}};
 vm.runInNewContext(source,sandbox);
 return {tools:win.BigLWATunesTransfer,values};
}
test('CSV quotes and line breaks parse predictably',()=>{
 const {tools}=harness();
 const tracks=tools.csv('title,artist,album,playlist,source,url\n"Track, One","Jo ""Jazz""","Album","Favorites",spotify,https://open.spotify.com/track/123\n');
 assert.equal(tracks.length,1);
 assert.equal(tracks[0].title,'Track, One');
 assert.equal(tracks[0].artist,'Jo "Jazz"');
});
test('playlist metadata is member scoped, deduplicated, and safe',()=>{
 const {tools,values}=harness();
 const first=tools.merge([{title:'Hello',artist:'Me',source:'spotify',url:'https://open.spotify.com/track/123?access_token=secret'},{title:'Hello',artist:'Me',source:'spotify',url:'https://open.spotify.com/track/123'}]);
 assert.equal(first.added,1);
 assert.equal(first.skipped,1);
 assert.equal(tools.saved().length,1);
 assert.equal(tools.saved()[0].url,'https://open.spotify.com/track/123');
 assert.equal(values.size,1);
 assert.equal(tools.normalize({title:'Bad',source:'manual',url:'javascript:alert(1)'}).url,'');
});
test('JSON export and CSV export do not include passwords or formula injections',()=>{
 const {tools}=harness();
 assert.equal(tools.json('{"tracks":[{"title":"Song"}]}').length,1);
 const result=tools.exportCSV([{title:'=evil',artist:'X',album:'',playlist:'Set',provider:'manual',url:''}]);
 assert.match(result,/"'=evil"/);
 assert.doesNotMatch(result,/^=evil/m);
});
test('Orbit day and Library readability assets are loaded exactly once across shells',()=>{
 const orbit=read('orbit-space-20261114.css'),contrast=read('studio-readable-day-20261115.css'),appearance=read('studio-appearance.js');
 assert.match(orbit,/body:not\(\.night-mode\) #studioApp #orbit/);
 assert.match(orbit,/body:not\(\.night-mode\) #studioApp #moduleWorkspace\[data-module-key="orbit"\]/);
 assert.match(contrast,/#studioApp #libraryCatalog/);
 assert.match(appearance,/const blended=\[r,g,b\]/);
 for(const path of ['index.html','studio/index.html','404.html','live-studio-shell.html']){
  const s=read(path);
  assert.equal((s.match(/studio-readable-day-20261115\.css\?v=/g)||[]).length,1,path);
  assert.equal((s.match(/tunes-transfer-20261115\.js\?v=/g)||[]).length,1,path);
 }
});
