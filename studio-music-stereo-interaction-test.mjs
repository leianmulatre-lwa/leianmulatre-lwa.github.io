/* Exercise the actual stereo builder against a DOM. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const {JSDOM}=createRequire(import.meta.url)('jsdom');
const source=readFileSync(new URL('./studio-experience.js',import.meta.url),'utf8');
const start=source.indexOf('  function upgradeMusic(){');
const stop=source.indexOf('\n  // Use the same audio element for tracks stored',start);
assert(start>0&&stop>start,'Production music upgrader is extractable');
const upgradeSource=source.slice(start,stop);
const html=[
'<!doctype html><html><body><main id="studioApp">',
'<section class="music-card" data-widget-id="music"><h2 class="card-kicker">NOW PLAYING</h2>',
'<div class="widget-window-controls"><button class="window-light green"></button>',
'<button class="window-light yellow"></button><button class="window-light red"></button></div>',
'<button class="widget-drag-handle">Drag</button>',
'<div class="music-row"><div class="album-art">♪</div><div class="music-copy"><strong>Almeda</strong><span>Solange</span></div>',
'<button type="button" id="playBtn">▶</button></div>',
'<div class="progress"><i id="musicProgress"></i></div></section>',
'<div id="profileSongEditorMount"></div></main></body></html>'
].join('');
const dom=new JSDOM(html,{runScripts:'outside-only',url:'https://biglwa.com/studio',pretendToBeVisual:true});
const w=dom.window,d=w.document;
const wrapStart="(function(){const $=(s,r=document)=>r.querySelector(s);const formatTime=n=>String(n);"+
"const setMusicStatus=message=>window.__testMusicStatus=message;"+
"const restoreMusic=()=>{};const updateMusic=async()=>{};\n";
w.eval(wrapStart+upgradeSource+"\n upgradeMusic();})()");
const card=d.querySelector('.music-card'),audio=d.querySelector('#studioAudio');
const deck=d.querySelector('.stereo-control-deck');
assert(card.classList.contains('stereo-music-widget'),'Original music DOM upgraded');
assert.equal(deck.querySelectorAll('button').length,4,'Rewind, play, forward and eject are real buttons');
const rewind=deck.querySelector('.stereo-rewind'),forward=deck.querySelector('.stereo-forward');
const play=d.querySelector('#playBtn'),eject=d.querySelector('#studioMusicEject');
assert(rewind&&forward&&play&&eject);
assert.equal(rewind.getAttribute('aria-label'),'Rewind 10 seconds');
assert.equal(forward.getAttribute('aria-label'),'Forward 10 seconds');
assert.equal(eject.getAttribute('aria-label'),'Eject current track and choose a different song');
const originalShell=d.querySelector('.stereo-shell'),originalPlay=play;
Object.defineProperty(audio,'duration',{configurable:true,get:()=>120});
audio.currentTime=35;
rewind.click();assert.equal(audio.currentTime,25,'Rewind moves ten seconds backward');
forward.click();assert.equal(audio.currentTime,35,'Forward moves ten seconds ahead');
audio.currentTime=3;rewind.click();assert.equal(audio.currentTime,0,'Rewind clamps to zero');
audio.currentTime=118;forward.click();assert.equal(audio.currentTime,120,'Forward clamps to end');
card.classList.add('studio-upper-square','studio-header-only','studio-music-square');
audio.currentTime=63;
rewind.click();assert.equal(audio.currentTime,53,'Rewind still works in the square layout');
forward.click();assert.equal(audio.currentTime,63,'Forward still works in the square layout');
assert.strictEqual(d.querySelector('.stereo-shell'),originalShell,'Square does not rebuild or reset stereo DOM');
assert.strictEqual(d.querySelector('#playBtn'),originalPlay,'Play control remains the same element');
let pickerClicks=0;
d.querySelector('#studioTrackInput').addEventListener('click',()=>{pickerClicks++});
eject.click();
assert.equal(pickerClicks,1,'Eject opens real track replacement picker');
assert.match(w.__testMusicStatus,/Choose a new song/);
const css=readFileSync(new URL('./studio-widget-visibility-music-20261102.css',import.meta.url),'utf8');
assert(css.includes('Stereo rebuild v3: TWO true header rows'));
assert(css.includes('padding:72px 12px 14px')&&css.includes('padding:70px 9px 9px'),'Both variants reserve header space');
assert(css.includes('grid-template-columns:repeat(3,minmax(0,1fr)) 25px'),'Square deck has four distinct buttons');
assert(css.includes('music-card.stereo-music-widget.studio-header-only.studio-music-square.studio-upper-square'),
 'Pair layout cannot override the square stereo header');
assert(css.includes('card-kicker.studio-collapse-keep'),'Now Playing is not behind the FM dial');
assert(css.includes('widget-window-controls.widget-window-controls'),'Three dots have independent stacking');
dom.window.close();
console.log('PASS actual music rewind/forward/eject, full/square layout selectors and intact player DOM');
