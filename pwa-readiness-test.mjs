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
assert(client.includes('messagingSdk.deleteToken')&&client.includes('sub.unsubscribe()'));
assert(client.includes('Continue in portrait')&&client.includes('Remote push delivery is not configured yet.'));
for(const path of ['index.html','studio/index.html','404.html','live-studio-shell.html','settings/index.html']){
 const shell=read(path);assert(shell.includes('/biglwa.webmanifest'));assert(shell.includes('/biglwa-pwa.js?v=1'));assert(shell.includes('viewport-fit=cover'));
}
console.log('PASS install manifest, shell wiring, opt-in notification controls, no fetch cache, portrait alternative');
