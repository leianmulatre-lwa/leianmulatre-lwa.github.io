import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('./'+p,import.meta.url),'utf8');
const js=read('stream-radio-world-20261115.js'),css=read('stream-radio-world-20261115.css'),
 catalog=JSON.parse(read('assets/radio/college-radio-50-states.json')),
 guide=read('stream-guide.js');
const setup=(handler=async()=>({ok:true,json:async()=>[]}))=>{
 const win={setTimeout,clearTimeout};
 const document={};
 const ctx={window:win,document,console,URL,URLSearchParams,AbortController,fetch:handler};
 vm.runInNewContext(js,ctx);
 return win.BigLWARadioDirectory;
};
test('All fifty US states have one authentic college or student radio listing',()=>{
 assert.equal(catalog.stations.length,50);
 assert.equal(new Set(catalog.stations.map(x=>x.stateCode)).size,50);
 const expected='AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split(' ');
 assert.deepEqual([...new Set(catalog.stations.map(x=>x.stateCode))].sort(),expected.sort());
 for(const station of catalog.stations){
  assert(station.name&&station.school&&station.state);
  assert(/^https:\/\/[^?#\s]+/.test(station.homepage),'Official HTTPS station link for '+station.stateCode);
 }
 assert.match(catalog.sourceNote,/not individually confirmed/);
 assert(catalog.stations.find(x=>x.stateCode==='NV').name.includes('Beat'));
 assert.match(guide,/all 16 campus stations/,'Original California and other station list is still present');
});
test('Radio source validation rejects mixed content, local network and unchecked/broken streams',()=>{
 const radio=setup();
 assert.equal(radio.safeLink('http://station.example/live.mp3'),'');
 assert.equal(radio.safeLink('https://localhost/live.mp3'),'');
 assert.equal(radio.safeLink('https://127.0.0.1/test.mp3'),'');
 assert.equal(radio.safeLink('javascript:alert(1)'),'');
 assert.equal(radio.safeLink('https://radio.example.org/live.mp3'),'https://radio.example.org/live.mp3');
 const base={stationuuid:'fake-uuid',name:'KJHK',countrycode:'US',state:'Kansas',
  url_resolved:'https://live.example.org/kjhk.mp3',homepage:'https://kjhk.org/',lastcheckok:1,
  codec:'MP3',votes:10,clickcount:230};
 assert.equal(radio.verifiedStation({...base,lastcheckok:0},{country:'US'}),null);
 assert.equal(radio.verifiedStation({...base,url_resolved:'http://bad.example.com/live'},{country:'US'}),null);
 assert.equal(radio.verifiedStation({...base,countrycode:'GB'},{country:'US'}),null);
 assert.equal(radio.verifiedStation(base,{country:'US'}).clicks,230);
 assert.equal(radio.callsign({name:'91.5 The Beat · KUNV HD2'}),'KUNV');
});
test('Campus radio lookup only uses matching call letters and geography',()=>{
 const radio=setup();
 const station={name:'KJHK 90.7',state:'Kansas'};
 const base={stationuuid:'uuid',name:'KJHK 90.7 FM',countrycode:'US',state:'Kansas',
 url_resolved:'https://streams.example.com/kjhk.mp3',homepage:'https://kjhk.org/',lastcheckok:1,codec:'MP3'};
 assert.equal(radio.pickCollegeMatch([{...base,state:'California'}],station),null);
 assert.equal(radio.pickCollegeMatch([{...base,name:'KXYZ FM'}],station),null);
 assert.equal(radio.pickCollegeMatch([base],station).stream,'https://streams.example.com/kjhk.mp3');
 const ucla={...base,name:'UCLA Radio',state:'California',url_resolved:'https://streams.example.com/ucla.mp3'};
 assert.equal(radio.pickCollegeMatch([ucla],{name:'UCLA Radio',state:'California'}).title,'UCLA Radio');
 assert.equal(radio.pickCollegeMatch([{...ucla,name:'Other College Radio'}],{name:'UCLA Radio',state:'California'}),null);
});
test('On-demand college radio fallback checks country and name before playing',async()=>{
 const calls=[];
 const radio=setup(async url=>{
  calls.push(String(url));
  return {ok:true,json:async()=>[
   {stationuuid:'uuid-1',name:'WCBN 88.3',state:'Michigan',countrycode:'US',
    url_resolved:'https://streams.example.com/wcbn.mp3',homepage:'https://wcbn.org/',
    codec:'MP3',lastcheckok:1,clickcount:33}
  ]};
 });
 const matched=await radio.findCollegeStream({name:'WCBN 88.3',state:'Michigan'});
 assert.equal(matched.title,'WCBN 88.3');
 assert(calls.some(x=>x.includes('name=WCBN')&&x.includes('countrycode=US')&&x.includes('hidebroken=true')));
});
test('World Radio is filterable, ranks only by directory activity and keeps Music separated',()=>{
 assert.match(js,/countrycode:code,hidebroken:'true',order:'clickcount',reverse:'true'/);
 assert.match(js,/params\.set\('language',language\)/);
 assert.match(js,/World Radio lookup unavailable/);
 assert.match(js,/directory activity, not national ratings/);
 assert.match(js,/enrichWorldSelectors\(record\)/);
 assert.match(js,/stations\/search\?/);
 assert.match(js,/https:\/\/de1\.api\.radio-browser\.info/);
 assert.match(css,/biglwa-radio-world-area/);
 assert.match(guide,/window\.BigLWARadioDirectory\?\.mount\?\.\(root,\{play:playDirectoryRadio,unified:true\}\)/);
 assert.match(guide,/function retryCollegeRadio\(index\)/);
 assert.match(guide,/data-stream-radio-retry/);
 assert.match(guide,/\['music','music','CH 05'\]/);
 assert.doesNotMatch(js,/localStorage\.setItem|sessionStorage\.setItem|client_secret|refresh_token/);
});
test('All Studio entrypoints load radio assets exactly once',()=>{
 for(const path of ['index.html','studio/index.html','404.html','live-studio-shell.html']){
  const html=read(path);
  for(const asset of ['stream-radio-world-20261115.js','stream-radio-world-20261115.css']){
   assert.equal(html.split('/'+asset+'?v=').length-1,1,path+' '+asset);
  }
  assert(html.includes('&world=20261115-directory-v1'),path+' new Stream cache version');
 }
});
