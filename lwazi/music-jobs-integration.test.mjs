import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const music=read('lwazi-music-discovery.js'),musicCss=read('lwazi-music-discovery.css'),jobsCode=read('visual-life-jobs.js');
const jobsCss=read('visual-life-jobs.css'),index=read('index.html'),search=read('user-search-results.js'),craft=read('tools-craft.js'),tunes=read('profile-music.js');
function envFor(script){
 const listeners=[];
 const window={addEventListener:(event,callback)=>listeners.push(event),BigLWAAccountStorage:{uid:'user-12345'}};
 const calls=[],storage=new Map(),localStorage={
   getItem:key=>storage.get(key)||null,
   setItem:(key,value)=>{calls.push(key);storage.set(key,value)}
 };
 const vmEnv={window,localStorage,sessionStorage:localStorage,location:{origin:'https://biglwa.com'},URL,console,CustomEvent:class{constructor(type){this.type=type}},document:{querySelector:()=>null},fetch:()=>{throw Error('Network forbidden by test')}};
 window.dispatchEvent=event=>calls.push(event.type);
 vm.runInNewContext(script,vmEnv,{timeout:2500});
 return {window,calls,storage};
}
const musicRuntime=envFor(music),api=musicRuntime.window.BigLWAMusicDiscovery;
assert.ok(api,'SoundCloud integration loads');
assert.equal(api.validateUrl('https://soundcloud.com/artist/track?utm_source=x'),'https://soundcloud.com/artist/track');
assert.equal(api.validateUrl('https://soundcloud.com/artist/track?secret_token=abc'),'https://soundcloud.com/artist/track','No private token enters Tunes storage');
for(const invalid of ['https://example.com/artist/track','javascript:alert(1)','http://soundcloud.com/a/b','https://soundcloud.com/a','https://soundcloud.com.evil.com/a/b','https://user:pass@soundcloud.com/a/b']){
 assert.equal(api.validateUrl(invalid),'','Reject unknown or insecure audio URLs');
}
assert.match(api.searchUrl('sza sos'),/soundcloud\.com\/search\/sounds\?q=sza%20sos/);
assert.match(api.searchMarkup('sza sos'),/Search SoundCloud/);
assert.match(api.searchMarkup('sza sos'),/Preview track/);
assert.match(api.searchMarkup('sza sos'),/bl-search-soundcloud-form/);
const saved=api.saveTrack({url:'https://soundcloud.com/artist/track?ref=outside',title:'Test',artist:'Artist'});
assert.equal(saved.saved,true);
assert.equal(api.getSaved().length,1);
assert.equal(api.saveTrack({url:'https://soundcloud.com/artist/track',title:'Test'}).saved,false,'Avoid duplicated saved links');
assert.ok(musicRuntime.calls.some(key=>key==='biglwaExternalTunesV1:user-12345'));
assert.equal(musicRuntime.storage.size,1,'Save only a reference, never an audio blob');
assert.match(music,/soundcloud\.com\/oembed\?format=json/);
assert.match(music,/w\.soundcloud\.com\/player\/\?url=/);
assert.doesNotMatch(music,/api\.soundcloud\.com\/tracks\?|download_audio|stream_url/,'Never scrape, copy, or claim full SoundCloud API search access');

const jobsRuntime=envFor(jobsCode),jobs=jobsRuntime.window.BigLWAVisualLife;
assert.ok(jobs,'Visual-Life adapter loads');
assert.equal(jobs.getStatus(),'pending','Unknown werk-main scraper must not fabricate jobs');
assert.equal(jobs.normalizeJobs([{title:'Artist',company:'Studio',source:'Job board',url:'https://jobs.example.com/artist'}]).length,1);
assert.equal(jobs.normalizeJobs([{title:'Artist',company:'Studio',source:'Job board',url:'https://localhost/internal'}]).length,0);
assert.equal(jobs.normalizeJobs([{title:'Artist',company:'Studio',source:'Job board',url:'javascript:alert(1)'}]).length,0);
assert.equal(jobs.normalizeJobs([{title:'Artist',company:'Studio',source:'Job board',url:'http://example.com/role'}]).length,0);
assert.equal(jobs.setJobs([]).status,'pending');
assert.equal(jobs.searchTargets('design','Los Angeles').length,3);
assert.ok(jobs.searchTargets('design','Los Angeles').every(x=>x.url.startsWith('https://')));
assert.match(jobsCode,/vendored werk-main \/ JobSpy feed has not been published/);
assert.match(jobsCode,/fetch\('\/data\/visual-life\/jobs.json'/,'Only read the fixed local jobs feed');
assert.doesNotMatch(jobsCode,/fetch\('https?:|XMLHttpRequest|scrapeJobs/,'Jobs module must not scrape board APIs directly in browsers');

for(const file of ['lwazi-music-discovery.js','lwazi-music-discovery.css','visual-life-jobs.js','visual-life-jobs.css'])assert.match(index,new RegExp(file.replaceAll('.','\\.')+'\\?v='),'New modules must be loaded by Studio entrypoint');
assert.match(search,/bl-vinyl-record/);
assert.match(search,/BigLWAMusicDiscovery\.searchMarkup\(clean\)/);
assert.match(search,/BigLWAMusicDiscovery\.attachSearch\(panel\)/);
assert.match(search,/category==='songs'/,'SoundCloud must appear when music category selected');
assert.match(musicCss,/repeating-radial-gradient/,'Vinyl is CSS, not unrelated copyrighted artwork');
assert.match(musicCss,/bl-search-music-vinyl/);
assert.match(tunes,/BigLWAMusicDiscovery\?\.attachTunes\(state\.dialog\)/);
assert.match(craft,/BigLWAVisualLife\?\.ensureCard\(root\)/);
assert.match(craft,/data-visual-life-open/);
assert.match(jobsCss,/craft-visual-life/);
console.log('PASS: consented SoundCloud search and embedding, linked Tunes, vinyl design, Visual-Life adapter, original-source links');

assert.match(jobsCode,/status!=='published'/,'Never claim jobs are live before feed publication');
assert.match(jobsCode,/96\*3600\*1000/,'Job records expire after 96h');
assert.match(read('scripts/visual_life_feed.py'),/from jobspy import scrape_jobs/,'Manual feed reuses the installed vendored Werk-Main scraper');
assert.match(read('scripts/visual_life_feed.py'),/raise ValueError\("No valid jobs returned/,'Never publish an empty scraped feed');
