// Orbit OAuth return parameters and durable account syncing regression.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const read = name => readFileSync(new URL('./' + name, import.meta.url), 'utf8');
const html = read('index.html');
const pages = read('module-pages.js');
const hub = read('orbit-connections.js');
const provider = read('orbit-new-connect-20261018-v6.js');
const facebook = read('facebook-personal-orbit-20261016.js');
const instagram = read('instagram-orbit.js');
const tiktok = read('tiktok-orbit.js');
const pinterest = read('pinterest-orbit.js');
const worker = read('cloudflare-worker-instagram.js');

const parseable = source => source
  .replace(/^import .*?;\s*$/mg, '')
  .replace(/^export default .*?;\s*$/mg, '')
  .replace(/^export /mg, '');
for (const [name, source] of [['module-pages.js', pages], ['orbit-connections.js', hub],
  ['orbit-new-connect-20261018-v6.js', provider],
  ['facebook-personal-orbit-20261016.js', facebook],
  ['tiktok-orbit.js', tiktok], ['instagram-orbit.js', instagram],
  ['pinterest-orbit.js', pinterest]]) {
  assert.doesNotThrow(() => new Script(parseable(source), { filename: name }), name + ' must parse');
}

const callbackParams = ['orbit_return', 'instagram_handoff', 'instagram_error',
  'pinterest_handoff', 'pinterest_error', 'tiktok_handoff', 'tiktok_error',
  'orbit_provider', 'orbit_status', 'orbit_error',
  'facebook_login', 'facebook_login_error'];
for (const key of callbackParams) {
  assert.ok(pages.includes("'" + key + "'"), 'Orbit router knows ' + key);
  assert.ok(html.includes("'" + key + "'"), 'legacy history rewrites keep ' + key);
}
assert.ok(pages.includes('ORBIT_CALLBACK_PARAMS.some(key=>params.has(key))'),
  'Orbit router treats every callback flag as an explicit return');
assert.ok(pages.includes("row.accountSaveFailed?'<em class=\"orbit-state\">Account sync pending</em>'"),
  'Orbit row reports a failed account save instead of claiming full connection');

function sourceString(name) {
  const match = html.match(new RegExp('const ' + name + '=("(?:\\\\.|[^"\\\\])*");'));
  assert.ok(match, name + ' is installed in the actual HTML patch');
  return JSON.parse(match[1]);
}
function invoke(statement, path, search = '') {
  const calls = [], location = { pathname: path, search };
  const history = { replaceState(...args) { calls.push(args.at(-1)); } };
  new Function('location', 'history', 'URLSearchParams', statement)(location, history, URLSearchParams);
  return calls;
}
const privateLogin = sourceString('preservePrivatePath');
const privateStudio = sourceString('preserveStudioPath');
const callbackUrls = [
  '?route=studio&view=orbit&orbit_provider=tumblr&orbit_status=connected',
  '?view=orbit&orbit_provider=x&orbit_status=failed&orbit_error=expired',
  '?view=orbit&facebook_login=connected',
  '?view=orbit&facebook_login_error=denied',
  '?view=orbit&instagram_handoff=one-use-code',
  '?view=orbit&tiktok_handoff=one-use-code',
  '?view=orbit&pinterest_handoff=one-use-code'
];
for (const query of callbackUrls) {
  assert.deepEqual(invoke(privateLogin, '/', query), [], 'login rewrite keeps callback ' + query);
  assert.deepEqual(invoke(privateStudio, '/studio', query), [], 'Studio rewrite keeps callback ' + query);
}
assert.deepEqual(invoke(privateLogin, '/privacy'), ['/'], 'ordinary login navigation is still canonical');
assert.deepEqual(invoke(privateStudio, '/studio', '?route=unknown'), ['/studio'], 'unrelated Studio queries are still cleaned');

assert.ok(instagram.includes("searchParams.get('instagram_handoff')"), 'Instagram reads its one-use handoff');
assert.ok(tiktok.includes("searchParams.get('tiktok_handoff')"), 'TikTok reads its one-use handoff');
assert.ok(pinterest.includes("searchParams.get('pinterest_handoff')"), 'Pinterest reads its one-use handoff');
assert.ok(worker.includes("url.searchParams.set('facebook_login',status)"), 'Facebook personal callback returns a status flag');
assert.ok(worker.includes("searchParams.set('orbit_status',status)"), 'Tumblr/X callbacks return a status flag');

for (const [name, source] of [['X/Snapchat/Tumblr', provider], ['Facebook', facebook],
  ['Instagram', instagram], ['TikTok', tiktok]]) {
  assert.ok(source.includes("biglwa:orbit-callback-return"),
    name + ' marks a consumed OAuth return for the Studio router');
}
// Pinterest is injected after module-pages.js, so its handoff params are still
// present when the router decides to keep the Orbit panel open.
assert.ok(html.indexOf('/pinterest-orbit.js?') > html.indexOf('/module-pages.js?'),
  'Pinterest runs after the router and does not need a consumed-callback marker');
assert.ok(pages.includes("sessionStorage.getItem('biglwa:orbit-callback-return')"),
  'Orbit router reads the consumed-callback marker');
assert.ok(pages.includes("sessionStorage.removeItem('biglwa:orbit-callback-return')"),
  'Orbit router consumes the marker exactly once');
assert.ok(pages.includes('recentOrbitCallback'),
  'Orbit router keeps a marked return across both router checks');
assert.ok(pages.includes('age<15000'), 'callback marker is short-lived and cannot pin a stale ?view=orbit');

assert.ok(hub.includes('return { outcome: "save-failed", record };'),
  'central hub distinguishes a provider reply from a successful account write');
assert.ok(hub.includes('next[source.id] = { ...record, accountSaveFailed: true };'),
  'failed account write is visible on the row');
assert.ok(hub.includes('if (record?.accountSaveFailed) continue;'),
  'failed account write is not published as a public link');
assert.ok(hub.includes('export async function recordProvider(uid, id, record)'),
  'provider clients can save verified connections to the account hub');
assert.ok(hub.includes('recordProvider,\n    publishPublicLinks:'),
  'account writer is exposed to classic provider scripts');
assert.ok(hub.includes("window.dispatchEvent(new CustomEvent('biglwa:orbit-connections-ready'))"),
  'classic scripts are told when the shared writer is ready');
assert.ok(hub.includes('facebook: ["facebook.com", "www.facebook.com", "fb.com", "www.fb.com"],'),
  'Facebook profile links are allowed in the public mirror');

assert.ok(provider.includes('const disconnectedNow=new Set();'),
  'mirroring tracks explicit disconnects separately from session errors');
assert.ok(provider.includes('if(disconnectedNow.has(id)){delete profiles[id];continue}'),
  'an absent provider state no longer erases the account record');
assert.ok(provider.includes('const profiles={...previous};'),
  'mirroring starts from the account record, not an empty map');
assert.ok(provider.includes('publishPublicLinks?.(uid)'),
  'public mirror uses the verified account uid');

assert.ok(facebook.includes('async function persistAccount(uid,profile,needsReauth)'),
  'Facebook personal converts provider verification into an account record');
assert.ok(facebook.includes("hub.recordProvider(uid,'facebook',record)"),
  'Facebook personal writes through the shared account writer');
assert.ok(facebook.includes('await persistAccount(user.uid,state.profile,state.needsReauth)'),
  'Facebook restore persists the verified connection');
assert.ok(facebook.includes("window.__biglwaConnections?.forget?.('facebook')"),
  'Facebook disconnect clears the account record');
assert.ok(facebook.includes('verifiedFromProvider:true,accountSaveFailed:!!state.accountSaveFailed'),
  'Facebook row shows when the account save is still pending');

for (const shell of ['index.html', 'studio/index.html', '404.html', 'live-studio-shell.html']) {
  const source = read(shell);
  for (const script of ['module-pages.js', 'orbit-new-connect-20261018-v6.js',
    'facebook-personal-orbit-20261016.js', 'tiktok-orbit.js', 'instagram-orbit.js',
    'pinterest-orbit.js', 'account-boot.js']) {
    const match = source.match(new RegExp('/' + script.replace(/\./g, '\\.') + '\\?v=[^"\'\\s]+'));
    assert.ok(match, shell + ' serves ' + script);
    assert.ok(match[0].includes('orbitsync=20261124-1'),
      shell + ' serves the repaired ' + script + ' with the account-sync cache key');
    assert.ok(match[0].includes('callback=20261124-2'),
      shell + ' serves the repaired ' + script + ' with the callback-return cache key');
  }
}
assert.ok(pages.includes("script.src = '/module-pages.js?v=") &&
  pages.includes('callback=20261124-2'),
  'the deferred module-pages loader cannot resurrect the old cached bundle');
assert.ok(read('politc-route-guard.js').includes('callback=20261124-2'),
  'the politc route guard recognizes the freshly loaded module bundle');
for (const source of [read('account-boot.js'), read('settings-photo.js')]) {
  assert.ok(source.includes('./orbit-connections.js?v=') && source.includes('orbitsync=20261124-1'),
    'shared connection hub has a fresh cache key');
}

console.log('PASS · OAuth callbacks survive both history rewrites');
console.log('PASS · failed account saves are visible and never published');
console.log('PASS · provider mirrors preserve account state across partial checks');
console.log('PASS · Facebook personal connection is bound to the BIG LWA account');
