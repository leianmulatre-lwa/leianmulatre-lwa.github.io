import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const search=read('user-search-results.js'),music=read('lwazi-music-discovery.js');
const vinylCss=read('lwazi-music-discovery.css'),css=read('lwazi-results-expansion.css');
const extras=read('lwazi-discovery-extras.js');
const shells=['index.html','studio/index.html','404.html','live-studio-shell.html'];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function songCard(){
 const start=search.indexOf('    function songCard(s){'),end=search.indexOf('    function publicSqwibCard(',start);
 assert(start>=0&&end>start);
 return new Function('esc',search.slice(start,end)+';return songCard')(esc);
}
test('Songs use real licensed previews on-site without auto-playing search or downloading tracks',()=>{
 const sample={trackName:'Test & Sound',artistName:'Singer',artworkUrl100:'https://is1.mzstatic.com/image/thumb/demo/100x100bb.jpg',trackViewUrl:'https://music.apple.com/us/song/123',previewUrl:'https://audio-ssl.itunes.apple.com/itunes-assets/test.m4a'};
 const card=songCard()(sample);
 assert.match(card,/data-bl-song-preview="https:\/\/audio-ssl\.itunes\.apple\.com\//);
 assert.match(card,/data-bl-song-title="Test &amp; Sound"/);
 assert.match(card,/Play preview/);
 assert.match(card,/600x600bb\.jpg/);
 assert.match(card,/bl-vinyl-cover-link/);
 assert(!card.includes('<audio'),'Audio is created only on click, not on every search tile');
 const invalid=songCard()({...sample,previewUrl:'https://evil.example.test/track.m4a'});
 assert.doesNotMatch(invalid,/data-bl-song-preview/);
 assert.match(invalid,/Open Test &amp; Sound by Singer in Apple Music/);
 assert.match(music,/function validApplePreview/);
 assert.match(music,/root\.addEventListener\('click'/);
 assert.match(music,/event\.preventDefault\(\);event\.stopPropagation\(\)/);
 assert.match(music,/audio\.controls=true/);
 assert.match(music,/audio\.play\(\)\.catch/);
 assert.match(music,/function stopPreview\(\)/);
 assert.doesNotMatch(music,/download_audio|stream_url/);
});
test('SoundCloud search is only mounted when the Songs tab is open',()=>{
 assert.match(search,/activeCategory==='songs'&&!isSocialGreeting&&window\.BigLWAMusicDiscovery/);
 assert.match(search,/if\(section\.id===sectionId\('SoundCloud'\)\)return category==='songs'/);
 assert.match(search,/fromClick&&\['songs','widgets','places','stream'\]\.includes\(category\)/);
 assert.doesNotMatch(search,/if\(!isSocialGreeting&&window\.BigLWAMusicDiscovery&&/);
});
test('Vinyl record becomes prominent, with no loss of artwork accuracy',()=>{
 assert.match(vinylCss,/left:32%!important;width:109%!important/);
 assert.match(vinylCss,/width:80%!important;max-width:80%!important/);
 assert.match(vinylCss,/repeating-radial-gradient/);
 assert.match(vinylCss,/bl-lwazi-audio-preview/);
 assert.match(vinylCss,/prefers-reduced-motion:reduce/);
});
test('Chat follow-ups show one chronological reply, not the old answer twice',()=>{
 assert.match(search,/var threaded=turns\.length>2/);
 assert.match(search,/threaded=true/);
 assert.match(search,/answerArea\.hidden=!aiActive\|\|threaded/);
 assert.match(search,/turns\.forEach\(function\(turn,index\)/);
 assert.match(search,/card\.dataset\.latest=String/);
 assert.match(search,/liveTurn\.text=String\(response/);
 assert.match(search,/var last=turnArea\.lastElementChild/);
 assert.doesNotMatch(search,/var past=turns\.slice/);
 assert.match(css,/data-role="assistant"\]\[data-latest="true"/);
 assert.match(css,/max-width:none!important/);
 assert.match(css,/repeat\(auto-fit,minmax/);
});
test('Widget directory, curated Stream video cards and route planning expose real controls',()=>{
 const window={BigLWAStreamGuide:{featured:[{
   id:'markiplier-scary',title:'Markiplier',subtitle:'3 SCARY GAMES #9',creator:'Markiplier',videoId:'abHGyg4LKn4',source:'Gaming',url:'https://www.youtube.com/watch?v=abHGyg4LKn4'
 }]}};
 const document={querySelectorAll:()=>[]};
 vm.runInNewContext(extras,{window,document,URL,console,setTimeout});
 const api=window.BigLWADiscoveryExtras;
 assert(api);
 const widgets=api.widgetCards();
 assert(widgets.length>=18);
 assert(widgets.some(c=>c.includes('data-lwazi-route="stream"')));
 assert(widgets.some(c=>c.includes('data-lwazi-route="map"')));
 assert(widgets.some(c=>c.includes('data-lwazi-route="diary"')));
 const videos=api.videoCards('scary games');
 assert.equal(videos.length,1);
 assert.match(videos[0],/data-bl-watch-stream="markiplier-scary"/);
 assert.match(videos[0],/i\.ytimg\.com\/vi\/abHGyg4LKn4\/hqdefault\.jpg/);
 assert.match(videos[0],/Watch on Stream/);
 assert.match(api.placeCards()[0],/option value="transit"/);
 assert.match(api.placeCards()[0],/option value="walking"/);
 assert.match(api.placeCards()[0],/bl-lwazi-transit-form/);
 assert.doesNotMatch(extras,/window\.open\(/);
 assert.doesNotMatch(extras,/google\.com\/maps\/dir/);
 assert.match(extras,/biglwa:lwazi-map-trip/);
 assert.match(extras,/Show route on BIG LWA/);
 assert.match(extras,/window\.open\(url\.href/);
 assert.match(search,/extras\.videoCards\(clean,activeCategory==='stream'\)/);
 assert.match(search,/extras\.widgetCards\(\)/);
 assert.match(search,/extras\.placeCards\(\)/);
 assert.doesNotMatch(search,/else if\(category==='widgets'\)goRoute\('library'\)/);
 assert.doesNotMatch(search,/else if\(category==='places'\)goRoute\('map'\)/);
});
test('all Studio routes load results, music player and extras in correct order',()=>{
 shells.forEach(path=>{
  const s=read(path);
  const order=['lwazi-discovery-extras.js?v=','user-search-results.js?v='];
  assert(s.indexOf(order[0])>0&&s.indexOf(order[0])<s.indexOf(order[1]),path+' loads extras before results');
  assert.match(s,/lwazi-music-discovery\.js\?v=20261113-in-site-previews-v3/);
  assert.match(s,/lwazi-music-discovery\.css\?v=20261113-lp-preview-v3/);
  assert.match(s,/lwazi-results-expansion\.css\?v=20261113-width-thread-v1/);
  assert.equal((s.match(/lwazi-discovery-extras\.js\?v=/g)||[]).length,1,path+' loads extras exactly once');
 });
});
