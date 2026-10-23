import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
const read=path=>readFileSync(new URL('./'+path,import.meta.url),'utf8');
const instagram=read('instagram-orbit.js');
const css=read('unified-cards.css');
const feed=read('feed-view.js');
const session=read('session-restore.js');
const studio=read('studio-experience.js');
const ui=read('ui-coherence.js');
const tools=read('tools-studio.js');
const trim=read('tools-video-trim.js');
const home=read('index.html');
const modules=read('module-pages.js');
for(const [name,source] of [['instagram-orbit.js',instagram],['session-restore.js',session],['studio-experience.js',studio],['ui-coherence.js',ui],['module-pages.js',modules]]){
  assert.doesNotThrow(()=>new Script(source,{filename:name}),name+' parses');
}
const checks=[
 ['Instagram feed markup uses one media container',!instagram.includes("'<div class=\"biglwa-unified-media\">' + visual + '</div>'")&&instagram.includes("data-instagram-current=\"0\"")],
 ['Inactive slideshow photos remain invisible',css.includes('visibility:hidden!important')&&css.includes('img.is-on')],
 ['Slideshow handlers installed only once',feed.includes('frame._biglwaSlideController={hold,play}')&&feed.includes('if(frame._biglwaSlideController)')],
 ['Firebase auth resolves once per UID',session.includes('lastConfirmedUid===uid')],
 ['Temporary auth failure does not call finishAuth(null)',!session.includes('finishAuth(null)')&&session.includes('verifySession(attempt+1)')],
 ['Local file intake accepts up to 500 MB',tools.includes('MAX_LOCAL_FILE_BYTES=500*1024*1024')],
 ['Large FFmpeg conversions show memory warning',tools.includes('MEMORY_HEAVY_TRANSCODE=125*1024*1024')],
 ['Trim preview supports start/end',trim.includes('data-trim-start')&&trim.includes('data-trim-end')],
 ['Trim export is a true MediaRecorder workflow',trim.includes('new MediaRecorder(stream,recorderOptions)')&&trim.includes("await media.play()")],
 ['Stereo eject opens the existing song picker',studio.includes("eject.addEventListener('click'")&&studio.includes("selector.click()")],
 ['Collective Feed has Boards-style hover but obeys reduced motion',css.includes('translate3d(0,-5px,0) scale(1.008)')&&css.includes('prefers-reduced-motion:reduce')],
 ['Stream waveform separated from title',ui.includes('stream-screen>.stream-wave')&&ui.includes('bottom:12px!important')],
 ['Tools module loads new version',modules.includes('tools-studio.js?v=20261023-workshop-native-8')],
 ['Homepage loads fresh repaired scripts',home.includes('instagram-orbit.js?v=20261015-orange-cards-16')&&home.includes('studio-experience.js?v=20261021-heading-stability-8')]
];
for(const [name,ok] of checks)console.log((ok?'PASS':'FAIL')+' · '+name);
assert.ok(checks.every(([,ok])=>ok),'Feed/auth/tools regression failed');
console.log(checks.length+' source regression checks passed.');
