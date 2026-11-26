import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=p=>readFileSync(new URL('./'+p,import.meta.url),'utf8');
const manifest=JSON.parse(read('biglwa.webmanifest'));
assert.equal(manifest.display,'standalone');assert.equal(manifest.scope,'/');assert.equal(manifest.start_url,'/studio');
assert.equal(manifest.orientation,'any','Portrait alternative remains available');
const config=read('biglwa-push-config.js'),client=read('biglwa-pwa.js'),worker=read('biglwa-sw.js');
for(const s of [config,client,worker])assert.doesNotThrow(()=>new vm.Script(s));
assert(!/addEventListener\(['"]fetch/.test(worker),'Private and mutable site content must not be cached by service worker');
assert(client.includes('Notification.requestPermission()')&&client.includes('registration.showNotification'));
assert(client.includes('sub.unsubscribe()')&&client.includes('registration.pushManager.subscribe'));
assert(client.includes('Continue in portrait')&&client.includes('Local test sent.'));
for(const path of ['index.html','studio/index.html','404.html','live-studio-shell.html','settings/index.html']){
 const shell=read(path);assert(shell.includes('/biglwa.webmanifest'));assert(shell.includes('/biglwa-pwa.js?v=4'));assert(shell.includes('viewport-fit=cover'));
}
console.log('PASS install manifest, shell wiring, opt-in notification controls, no fetch cache, portrait alternative');

assert(client.indexOf('const sub=await registration.pushManager.subscribe')<client.indexOf('await sendRemoteTest(endpoint,user,sub)'),'Subscribe occurs before remote network call');

const iosCSS=read('biglwa-pwa.css');
for(const path of ['index.html','studio/index.html','404.html','live-studio-shell.html']){
 const shell=read(path);
 assert.equal((shell.match(/\/biglwa-pwa\.css\?v=4/g)||[]).length,2,path+' both iOS stylesheets refreshed');
}
assert.match(iosCSS,/--ios-rail:76px/);
assert.match(iosCSS,/--ios-rail:42px/);
assert.match(iosCSS,/--ios-home-left:max\(8px,calc\(var\(--ios-left\) - 12px\)\)/);
assert.match(iosCSS,/#moduleWorkspace:not\(\[hidden\]\)::before/);
assert.match(iosCSS,/right:100%;width:var\(--ios-left\)/);
assert.match(iosCSS,/grid-auto-flow:row dense!important/);
assert.match(iosCSS,/--ios-score-width:clamp\(178px,25vw,242px\)/);
assert.match(iosCSS,/scroll-snap-type:x proximity/);
console.log('PASS iOS landscape rail, safe-area background, compact scoreboard and upper widget reflow');

assert.match(iosCSS,/--ios-rail-inset:min\(16px,var\(--ios-right\)\)/);
assert.match(iosCSS,/min-width:var\(--ios-reserved\)!important;max-width:var\(--ios-reserved\)!important/);

assert.match(client,/biglwaIosBottomDockModeV1/);
assert.match(client,/Always on bottom/);
assert.match(client,/Reveal when bottom edge is touched/);
assert.match(client,/edge\.addEventListener\('pointerdown',reveal\)/);
assert.match(client,/matchMedia\('\(orientation: portrait\)'\)\.addEventListener\('change',close\)/);
assert.match(iosCSS,/--ios-reserved:0px!important/);
assert.match(iosCSS,/inset:auto 0 0 0!important/);
assert.match(iosCSS,/translateY\(105%\)/);
assert.match(iosCSS,/overflow-x:auto!important;overflow-y:hidden!important/);
assert.match(iosCSS,/#studioSidebarShortcuts/);
assert.match(iosCSS,/#skeletonKeyLauncher,#skeletonVeveLauncher,\.sidebar-theme-btn/);
assert.match(iosCSS,/biglwa-ios-dock-managing/);
console.log('PASS iOS bottom dock, per-device preference, touch reveal, orientation and existing shortcut controls');
