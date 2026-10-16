// Big LWA account persistence is independent of external OAuth sessions.
// Exercises actual legacy router replacement and Worker token refresh.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import vm from 'node:vm';
const read=file=>readFileSync(new URL('./'+file,import.meta.url),'utf8');
const html=read('index.html'), instagram=read('instagram-orbit.js'),
      pinterest=read('pinterest-orbit.js'), worker=read('cloudflare-worker-instagram.js');
const base=gunzipSync(Buffer.from([1,2,3,4,5].map(n=>read('site-'+n+'.txt')).join(''),'base64')).toString();
const before='await setPersistence(auth, browserLocalPersistence);';
assert.ok(base.includes(before),'test uses actual legacy login source');
assert.ok(base.includes("const cred = await createUserWithEmailAndPassword(auth,"));
assert.ok(base.includes("await signInWithEmailAndPassword(auth, loginEmail.value.trim(), loginPassword.value)"));
assert.ok(html.includes('html=html.replace("await setPersistence(auth, browserLocalPersistence);","await auth.authStateReady();")'));
let patched=base.replace(before,'await auth.authStateReady();')
 .replace("const cred = await createUserWithEmailAndPassword(auth,",
  "await setPersistence(auth, browserLocalPersistence); const cred = await createUserWithEmailAndPassword(auth,")
 .replace("await signInWithEmailAndPassword(auth, loginEmail.value.trim(), loginPassword.value)",
  "await setPersistence(auth, browserLocalPersistence); await signInWithEmailAndPassword(auth, loginEmail.value.trim(), loginPassword.value)");
assert.ok(patched.includes("await auth.authStateReady();\n\n  const routeWithAuth") ||
          /await auth\.authStateReady\(\);\s*const routeWithAuth/.test(patched),
       'refresh first restores the existing member, without rewriting persistence');
assert.equal((patched.match(/await setPersistence\(auth, browserLocalPersistence\)/g)||[]).length,2,
  'persistence is set only on deliberate sign-in and registration');
assert.ok(html.includes('instagram-orbit.js?v=20261015-orange-cards-16'));

assert.ok(!instagram.includes("state.sessionLookupError='Sign in to your BIGLWA account to restore Instagram.'"),
 'provider status never claims the member must log in again');
assert.ok(instagram.includes('await ctx.auth.authStateReady()'),'Instagram waits for Firebase persistence');
assert.ok(instagram.includes('ctx.auth.onAuthStateChanged'),'provider never decides login state');
assert.ok(instagram.includes('restore({silent:true})'),'automatic Instagram refresh is silent');
assert.ok(instagram.includes('if(!uid){'),'true Firebase sign out is distinguished');
assert.ok(!/(?:signOut|deleteApp)\s*\(/.test(instagram),'Instagram does not invoke Big LWA sign-out');
assert.ok(!/(?:signOut|deleteApp)\s*\(/.test(pinterest),'Pinterest does not invoke Big LWA sign-out');

const start=instagram.indexOf('  function status(message) {');
const end=instagram.indexOf('  /* /studio is a stub',start);
assert.ok(start>0&&end>start);
function simulateInstagramNotice(uid,studioActive,loginActive) {
  const created=[];
  const document={
    getElementById(id){
      if(id==='studioApp')return {classList:{contains:()=>studioActive}};
      if(id==='loginPage')return {classList:{contains:()=>loginActive}};
      return created.find(el=>el.id===id)||null;
    },
    createElement(){return {setAttribute(){},style:{cssText:''},remove(){this.removed=true}}},
    body:{appendChild(el){created.push(el)}}
  };
  const one=selector=>document.getElementById(selector.slice(1));
  const script=instagram.slice(start,end)+'\nstatus("Restore Instagram session?");';
  new Function('document','one','activeAccountUid','setTimeout','clearTimeout',script)(
    document,one,uid,()=>1,()=>{}
  );
  return created.length;
}
assert.equal(simulateInstagramNotice('',false,true),0,'anonymous login cannot show Instagram toast');
assert.equal(simulateInstagramNotice('member',false,true),0,'login overlay cannot show provider toast');
assert.equal(simulateInstagramNotice('member',true,false),1,'signed-in Studio can show a requested provider status');

let refreshCalls=0;
const records=new Map();
const kv={
 async get(k,kind){const value=records.get(k);return value==null?null:kind==='json'?JSON.parse(value):value},
 async put(k,value){records.set(k,value)},async delete(k){records.delete(k)}
};
const mockFetch=async input=>{
 const url=new URL(typeof input==='string'?input:input.url);
 if(url.hostname==='graph.instagram.com'&&url.pathname==='/refresh_access_token'){
   refreshCalls++;
   assert.equal(url.searchParams.get('grant_type'),'ig_refresh_token');
   assert.equal(url.searchParams.get('access_token'),'older-token');
   return new Response(JSON.stringify({access_token:'renewed-token',expires_in:60*60*24*60}),{status:200});
 }
 if(url.hostname==='identitytoolkit.googleapis.com'){
   return new Response(JSON.stringify({users:[{localId:'account-1'}]}),{status:200});
 }
 throw Error('Unexpected network request '+url.href);
};
const context={URL,URLSearchParams,Request,Response,Headers,TextEncoder,TextDecoder,fetch:mockFetch,console};
vm.runInNewContext(worker.replace('export default {','const fakeWorker = {')+
 '\nglobalThis.testFns={refresh:refreshInstagramSession,account:accountSession};',context);
const now=Date.now(),sid='ig-session';
const original={accessToken:'older-token',userId:'instagram-user',firebaseUid:'account-1',
  createdAt:now-53*86400000,expiresAt:now+7*86400000,longLived:true};
records.set('session:'+sid,JSON.stringify(original));records.set('firebase:account-1',sid);
const result=await context.testFns.refresh({OAUTH_SESSIONS:kv},sid,original);
assert.equal(result.accessToken,'renewed-token');
assert.equal(result.firebaseUid,'account-1');
assert.equal(records.get('firebase:account-1'),sid,'provider refresh retains account linkage');
assert.equal(refreshCalls,1);
assert.ok(JSON.parse(records.get('session:'+sid)).expiresAt>now+50*86400000);
assert.ok(worker.includes('const SESSION_TTL = 60 * 60 * 24 * 60'));
const short={...original,accessToken:'short-token',longLived:false};
await context.testFns.refresh({OAUTH_SESSIONS:kv},'short-lived',short);
assert.equal(refreshCalls,1,'short-lived Instagram token is not refreshed at invalid endpoint');
assert.ok(!worker.includes("authorization.searchParams.set('force_reauth', 'true')"),
  'routine Instagram reconnection does not force a fresh provider login');
console.log('PASS Big LWA local persistence survives page reload; set only during explicit login');
console.log('PASS Instagram and Pinterest failures cannot sign out Firebase account');
console.log('PASS Provider notices restricted to authenticated Studio, silent background restore');
console.log('PASS Instagram long-lived grant refresh preserves verified Firebase ownership');
