import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
const policy=readFileSync('account-storage-policy.js','utf8'),source=readFileSync('account-storage.js','utf8');
const cloud=new Map();let fail=false;
async function device(owner,legacy={}){
 class Storage{constructor(){this.data=new Map(Object.entries(legacy))}getItem(k){return this.data.get(String(k))??null}setItem(k,v){this.data.set(String(k),String(v))}removeItem(k){this.data.delete(String(k))}get length(){return this.data.size}key(i){return [...this.data.keys()][i]}}
 const auth={currentUser:owner?{uid:owner}:null,authStateReady:async()=>{}};
 const f={getFirestore:()=>({}),collection:(_, ...p)=>p.join('/'),doc:(_, ...p)=>p.join('/'),serverTimestamp:()=>123,
 getDocs:async ref=>{if(fail)throw Error('offline');return {docs:[...cloud].filter(([k])=>k.startsWith(ref+'/')).map(([k,v])=>({id:k.split('/').at(-1),data:()=>v}))}},
 onSnapshot:()=>()=>{},getDoc:async ref=>({data:()=>cloud.get(ref)}),
 runTransaction:async(_,fn)=>{if(fail)throw Error('offline');return fn({get:async ref=>({data:()=>cloud.get(ref)}),set:(ref,value)=>cloud.set(ref,value)})}};
 const window={addEventListener:()=>{},dispatchEvent:()=>{},parent:null};window.parent=window;
 const context=vm.createContext({window,Storage,localStorage:new Storage(),TextEncoder,URLSearchParams,crypto:webcrypto,console,Blob,URL,
 document:{readyState:'loading',addEventListener:()=>{},getElementById:()=>null,documentElement:{classList:{contains:()=>false}}},
 location:{pathname:'/studio',search:'',reload:()=>{}},CustomEvent:class{},setTimeout:()=>1,clearTimeout:()=>{},
 modules:{app:{getApps:()=>[{}],initializeApp:()=>({})},auth:{getAuth:()=>auth,onAuthStateChanged:()=>{}},firestore:f}});
 vm.runInContext(policy,context);
 vm.runInContext(source.replace(/import\('https:\/\/www.gstatic.com\/firebasejs\/12.18.0\/firebase-(app|auth|firestore).js'\)/g,(_,name)=>`Promise.resolve(modules.${name})`),context);
 await window.BigLWAAccountStorage.ready;return context;
}
const a=await device('a',{biglwaLibraryCatalogV1:'["legacy"]',biglwaTikTokSession:'secret'});
assert.equal(a.localStorage.getItem('biglwaLibraryCatalogV1'),null,'legacy is not silently claimed');
await a.window.BigLWAAccountStorage.importLegacy();assert.equal(a.localStorage.getItem('biglwaLibraryCatalogV1'),'["legacy"]');
assert.equal([...cloud.keys()].some(k=>k.includes('TikTok')),false,'credentials excluded');
const b=await device('b');assert.equal(b.localStorage.getItem('biglwaLibraryCatalogV1'),null,'second account isolated');
const fresh=await device('a');assert.equal(fresh.localStorage.getItem('biglwaLibraryCatalogV1'),'["legacy"]','new device restores cloud');
a.localStorage.setItem('biglwaLibraryCatalogV1','["first device"]');await a.window.BigLWAAccountStorage.flush();
fresh.localStorage.setItem('biglwaLibraryCatalogV1','["second device"]');await fresh.window.BigLWAAccountStorage.flush();
assert.equal(cloud.get('users/a/studioState/biglwaLibraryCatalogV1').value,'["first device"]','conflict does not overwrite');
assert.match(fresh.window.BigLWAAccountStorage.status,/Another device/);
assert.equal(fresh.localStorage.getItem('biglwaLibraryCatalogV1'),'["second device"]','conflict retained locally');
a.localStorage.removeItem('biglwaLibraryCatalogV1');await a.window.BigLWAAccountStorage.flush();
assert.equal(cloud.get('users/a/studioState/biglwaLibraryCatalogV1').value,null,'deletion tombstone');
const restored=await device('a');assert.equal(restored.localStorage.getItem('biglwaLibraryCatalogV1'),null);
fail=true;restored.localStorage.setItem('biglwaMapPins','[{"title":"Offline"}]');await restored.window.BigLWAAccountStorage.flush();assert.match(restored.window.BigLWAAccountStorage.status,/cloud sync needs retry/);fail=false;await restored.window.BigLWAAccountStorage.flush();assert.equal(cloud.get('users/a/studioState/biglwaMapPins').value,'[{"title":"Offline"}]');
restored.window.__biglwaPublicStorageView=true;assert.equal(restored.localStorage.getItem('biglwaMapPins'),null);assert.throws(()=>restored.localStorage.setItem('biglwaMapPins','[]'),/read-only/);
assert.equal(a.window.BigLWAStoragePolicy.validValue('data:image/png;base64,abc'),false);
console.log('PASS account isolation, opt-in migration, credential exclusion, cross-device restore, conflict preservation, tombstones, retry and visitor write protection');
const dir=readFileSync('firebase-directory.js','utf8');assert.ok(!dir.includes('await autoSyncSignedInAccount();'));assert.ok(dir.includes("where('state','==','approved')"));
const map=readFileSync('map-app.html','utf8');assert.ok(map.includes("(async () => {\n  'use strict';\n  await window.BigLWAAccountStorage.ready;"));assert.ok(!map.includes('await window.BigLWAAccountStorage.ready;this._cancel'));
console.log('PASS startup avoids stale profile upload, public archive filtered fallback and map hydration order');
