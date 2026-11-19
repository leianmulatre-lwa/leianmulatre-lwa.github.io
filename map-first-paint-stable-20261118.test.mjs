import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('./'+path,import.meta.url),'utf8');
const map=read('map-app.html');

test('map body class and preview mode are decided before account storage can delay paint',()=>{
 const boot=map.slice(map.indexOf('(() => {'),map.indexOf('async function startMap()'));
 assert.match(boot,/const publicView=window\.parent!==window&&window\.parent\.__biglwaPublicStorageView/);
 assert.match(boot,/document\.body\.classList\.add\('embedded'\)/);
 assert.match(boot,/preview/);
 assert(boot.indexOf("classList.add('embedded')")<boot.indexOf('BigLWAAccountStorage.ready'),'embedded must not wait for account storage');
 assert(boot.indexOf('classList.add(\'preview\')')<boot.indexOf('BigLWAAccountStorage.ready'),'preview must not wait for account storage');
});

test('map stage uses stable deterministic box geometry before Leaflet loads',()=>{
 assert.match(map,/<style id="biglwaMapFirstPaint">[\s\S]*?<\/style>/);
 const stable=map.match(/<style id="biglwaMapFirstPaint">([\s\S]*?)<\/style>/)[1];
 assert.match(stable,/html,body\{[^}]*width:100%[^}]*height:100%/);
 assert.match(stable,/body\.embedded main[\s\S]*?grid-template-columns:minmax\(0,1fr\)/);
 assert.match(stable,/body\.embedded \.map-side[\s\S]*?width:100%[^}]*min-width:0/);
 assert.match(stable,/body\.embedded \.map-stage[\s\S]*?position:relative[^}]*height:390px[^}]*min-height:320px[^}]*overflow:hidden/);
 assert.match(stable,/body\.embedded #map[\s\S]*?width:100%[^}]*height:100%/);
 assert.match(stable,/body\.embedded\.preview \.map-stage[\s\S]*?height:100%/);
 assert.match(map,/<div class="map-stage">\s*<div id="map"/,'map-stage wraps #map');
});

test('map first-paint fix does not change routes, handoff, or existing cache tokens',()=>{
 assert.doesNotMatch(map,/\?m=/);
 assert.match(map,/map-lwa-discovery-20261114\.js\?v=20261114-inapp-desk-v2/);
 assert.match(map,/map-lwa-discovery-20261114\.css\?v=20261114-public-neighborhood-v1/);
 assert.match(map,/map-transport-hub-20261114\.js\?v=20261118-ride-estimates-v1/);
 assert.match(map,/map-transport-hub-20261114\.css\?v=20261118-ride-estimates-v1/);
 assert.match(map,/window\.BigLWAAccountStorage\.ready/);
});
