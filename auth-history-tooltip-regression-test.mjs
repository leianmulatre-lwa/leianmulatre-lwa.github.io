// Regression: signed-in Back/Forward and BFCache never paint the legacy login;
// hover hints remain steady across child labels and internal scrolling.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import vm from 'node:vm';
const read=path=>readFileSync(new URL('./'+path,import.meta.url),'utf8');
const shellPaths=['index.html','studio/index.html','404.html','live-studio-shell.html'];
const source=gunzipSync(Buffer.from([1,2,3,4,5].map(n=>read('site-'+n+'.txt')).join(''),'base64')).toString();
const legacyRoute=source.match(/window\.addEventListener\('popstate',\(\)=>\{\s*requestedRoute = currentRoute\(\);[\s\S]*?else showLogin\(\);\s*\}\);/)?.[0];
assert(legacyRoute,'Actual legacy login-on-popstate code is present');
const navigators=[];
for(const path of shellPaths){
 const shell=read(path);
 const beforeLiteral=shell.match(/const historyRouterBefore=("(?:\\.|[^"\\])*");/)?.[1];
 const afterLiteral=shell.match(/const historyRouterAfter=("(?:\\.|[^"\\])*");/)?.[1];
 assert(beforeLiteral&&afterLiteral,path+' contains safe history replacement');
 const before=JSON.parse(beforeLiteral),after=JSON.parse(afterLiteral);
 assert.equal(before,legacyRoute,path+' targets the actual legacy handler');
 assert.match(after,/auth\.authStateReady\(\)/,path+' verifies persisted Firebase auth');
 assert.match(after,/event\.persisted/,path+' supports BFCache pageshow');
 assert.match(after,/__biglwaIsPublicProfilePath/,path+' preserves visitor routes');
 assert(shell.includes("html=html.replace(historyRouterBefore,historyRouterAfter)"),path+' installs the fix before writing legacy Studio');
 assert(shell.includes("session-restore.js?v=20261112-bfcache-history-1"),path+' cache-busts session restore');
 assert(shell.includes("studio-interaction-stability.js?v=20261112-hover-stable-1"),path+' cache-busts hint fix');
 const patched=source.replace("let activeUser = null;","let activeUser = null;\nlet authForRoutes = null;")
  .replace("const auth = getAuth(initializeApp(firebaseConfig));",
   "const auth = getAuth(initializeApp(firebaseConfig));\n  authForRoutes = auth;")
  .replace(before,after);
 assert(patched.includes('function reconcileHistorySession()'),path+' installs reconciliation');
 assert.doesNotThrow(()=>new vm.Script(after),path+' routing code compiles');
 navigators.push(after);
}
const after=navigators[0];
async function simulate({path='/studio',user={uid:'signed-in'},kind='popstate',preview=false}={}){
 const events=new Map(),calls=[];
 let releaseAuth;
 const readiness=new Promise(resolve=>releaseAuth=resolve);
 const auth={currentUser:user,authStateReady:()=>readiness};
 const win={__biglwaIsPublicProfilePath:p=>/^\/another-member$/.test(p),addEventListener:(event,fn)=>events.set(event,fn)};
 const doc={documentElement:{classList:{contains:name=>preview&&name==='biglwa-preview-mode'}}};
 const loc={pathname:path};
 const setup=new Function('window','document','location','console','Promise','authForRoutes',
  'showStudio','showLogin','showPolicy','currentRoute',
  'let requestedRoute;let activeUser=null;\n'+after);
 setup(win,doc,loc,console,Promise,auth,verified=>calls.push(['studio',verified.uid]),
  ()=>calls.push(['login']),name=>calls.push(['policy',name]),()=>loc.pathname.replace(/^\//,'')||'login');
 const handler=events.get(kind);
 assert(handler,kind+' handler registered');
 handler(kind==='pageshow'?{persisted:true}:{});
 if(path==='/privacy')assert.deepEqual(calls,[['policy','privacy']],'Policy route navigates synchronously');
 else assert.equal(calls.length,0,'No repaint before verified auth');
 releaseAuth();
 await readiness;await Promise.resolve();await Promise.resolve();
 return calls;
}
assert.deepEqual(await simulate(),[['studio','signed-in']],'Back returns to verified Studio');
assert.deepEqual(await simulate({kind:'pageshow'}),[['studio','signed-in']],'BFCache return restores Studio without login');
assert.deepEqual(await simulate({user:null}),[['login']],'A verified sign-out can show login');
assert.deepEqual(await simulate({path:'/another-member'}),[],'Public member visit is not converted to login or owner studio');
assert.deepEqual(await simulate({preview:true}),[],'Owner preview navigation stays isolated');
assert.deepEqual(await simulate({path:'/privacy'}),[['policy','privacy']],'Public policy navigation remains available');
const restore=read('session-restore.js'),hints=read('studio-interaction-stability.js');
assert.match(restore,/window\.addEventListener\('pageshow',\(\)=>verifySession\(\)\)/,'Session re-verifies on BFCache');
assert.match(restore,/window\.addEventListener\('popstate',\(\)=>verifySession\(\)\)/,'Session re-verifies on Back');
assert.match(restore,/if\(lastConfirmedUid===uid\)\{/,'Same UID can refresh stale login paint');
assert.match(restore,/location\.pathname==='\/'/,'Signed-in root entry is canonicalized without push');
assert.match(hints,/function scheduleHide\(\)/,'Pointer exit is tolerant');
assert.match(hints,/anchor\?\.contains\(event\.target\)/,'Moving within a control retains the hint');
assert.match(hints,/const control=hinted\.closest/,'Nested glyphs share their parent button');
assert.match(hints,/Reposition the hint rather than hiding/,'Scroll repositions instead of flashing');
console.log('PASS authenticated history, BFCache, public profiles, route isolation and stable hover hints');
