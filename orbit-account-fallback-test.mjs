// Durable account fallback and Instagram OAuth acknowledgement regression.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const read = name => readFileSync(new URL('./' + name, import.meta.url), 'utf8');
const client = read('account-sync-client.js');
const storage = read('account-storage.js');
const worker = read('cloudflare-worker-instagram.js');
const connections = read('orbit-connections.js');
const provider = read('orbit-new-connect-20261018-v6.js');
const instagram = read('instagram-orbit.js');
const pages = read('module-pages.js');
const identity = read('account-identity.js');
const mailroom = read('developer/mailroom/app.js');
const wrangler = read('wrangler.toml');
const schema = read('account-sync-schema.sql');

const parseable = source => source
  .replace(/^import[\s\S]*?;\s*$/mg, '')
  .replace(/^export default /mg, 'const __defaultExport = ')
  .replace(/^export /mg, '');
for (const [name, source] of [['account-sync-client.js', client], ['account-storage.js', storage],
  ['cloudflare-worker-instagram.js', worker], ['orbit-connections.js', connections],
  ['orbit-new-connect-20261018-v6.js', provider], ['instagram-orbit.js', instagram],
  ['module-pages.js', pages], ['account-identity.js', identity],
  ['developer/mailroom/app.js', mailroom]]) {
  assert.doesNotThrow(() => new Script(parseable(source), { filename: name }), name + ' must parse');
}

assert.ok(client.includes("if (window.BigLWAAccountSync) return;"), 'client installs once');
assert.ok(client.includes("const API = 'https://biglwa-instagram-api.leianmulatre-284.workers.dev'"),
  'client uses the BIG LWA Worker');
assert.ok(client.includes("localStorage.setItem(queueKey(), JSON.stringify(queue))"),
  'queued writes survive a reload');
assert.ok(client.includes("fetch(API + '/account-sync/save'"), 'client posts to the durable save route');
assert.ok(client.includes("emit('biglwa:account-sync-queued'"), 'client reports a durable queue');
assert.ok(client.includes("emit('biglwa:account-synced'"), 'client reports a confirmed revision');
assert.ok(client.includes("if (response.status === 409 || body.code === 'conflict')"),
  'client stops on an optimistic-concurrency conflict');
assert.ok(client.includes("suppliedBase === null || suppliedBase === undefined || suppliedBase === ''"),
  'an omitted base revision is not coerced to zero');
assert.ok(client.includes("if (!uid && entry.uid) uid = String(entry.uid);"),
  'an early edit stays with the UID that made it');
assert.ok(client.includes("biglwa:account-sync-conflict"),
  'conflicts stop retrying and are reported');
assert.ok(!/(instagramSession|accessToken|client_secret|firebaseIdToken)/i.test(client),
  'provider credentials never enter the account outbox');

for (const shell of ['index.html', '404.html', 'studio/index.html', 'live-studio-shell.html']) {
  const source = read(shell);
  const clientAt = source.indexOf('account-sync-client.js?v=20261125-account-fallback-1');
  const storageAt = source.indexOf('account-storage.js?v=20261103-account-drafts-1&fallback=20261125-1');
  assert.ok(clientAt > -1, shell + ' loads the account fallback client');
  assert.ok(storageAt > clientAt, shell + ' loads storage after the fallback client');
  assert.ok(source.includes('/account-identity.js?v=20261029-preview-cache-1&fallback=20261125-1'),
    shell + ' busts the identity cache for the quota fallback');
  assert.ok(source.includes('/instagram-orbit.js?v=') &&
    source.slice(source.indexOf('/instagram-orbit.js?v=')).includes('igack=20261125-1'),
    shell + ' busts the Instagram acknowledgement cache');
  assert.ok(source.includes('/module-pages.js?v=') &&
    source.slice(source.indexOf('/module-pages.js?v=')).includes('igack=20261125-1'),
    shell + ' busts the Orbit live-row cache');
  assert.ok(!source.includes("igack=20261125-1'>'"),
    shell + ' keeps the cache-busted script tags valid JavaScript');
}
for (const shell of ['settings/index.html', 'map-app.html']) {
  const source = read(shell);
  assert.ok(source.indexOf('/account-sync-client.js?v=20261125-account-fallback-1') <
    source.indexOf('/account-storage.js?v='), shell + ' loads the fallback before account storage');
}

assert.ok(storage.includes("window.BigLWAAccountSync"), 'account storage reaches the fallback');
assert.ok(storage.includes("scope:'studioState'"), 'private collections use revisioned backup writes');
assert.ok(storage.includes("result.ok||result.queued"), 'a queued private write is durable');
assert.ok(connections.includes("scope: \"user\", path: \"users/\" + uid"),
  'Orbit records use the owner-only account fallback');
assert.ok(connections.includes("scope: \"public\",\n      path: \"usernames/\" + username"),
  'public profile links use the verified public fallback');
assert.ok(connections.includes("state?.user?.[\"users/\" + uid]?.value"),
  'public mirror reads the durable account state when Firestore quota fails');
assert.ok(connections.includes("if (fromDurable) { await writeDurable(); return; }"),
  'public metadata first tries Firestore, then the durable outbox');
assert.ok(provider.includes("orbitConnectedProfiles:profiles,orbitProfilesUpdatedAt:new Date().toISOString()"),
  'new Orbit providers mirror verified identity through the fallback');
assert.ok(identity.includes("scope: \"public\",\n      path: \"usernames/\" + name"),
  'a new username survives a Firestore quota rejection');
assert.ok(mailroom.includes("scope: \"developer\""), 'private Mailroom drafts use the fallback');
assert.ok(mailroom.includes("Firestore will mirror it when quota recovers."),
  'the fallback says the Firestore mirror is pending');
const mailroomPage = read('developer/mailroom/index.html');
assert.ok(mailroomPage.indexOf('/account-sync-client.js?v=20261125-account-fallback-1') <
  mailroomPage.indexOf('./app.js?v=20261125-account-fallback-1'),
  'Mailroom loads the durable client before its draft editor');

for (const route of ['/account-sync/health', '/account-sync/state',
  '/account-sync/save', '/account-sync/retry']) {
  assert.ok(worker.includes("url.pathname === '" + route + "'"), 'Worker serves ' + route);
}
assert.ok(worker.includes('BIGLWA_ACCOUNT_DB'), 'Worker uses the D1 binding');
assert.ok(worker.includes('account_sync_state'), 'D1 keeps revisioned state');
assert.ok(worker.includes('account_sync_mirror'), 'D1 keeps the Firestore mirror queue');
assert.ok(worker.includes("account-sync/' + uid + '/' + scope"), 'R2 keeps a private snapshot');
assert.ok(worker.includes('FIREBASE_SERVICE_ACCOUNT'), 'Firestore mirror credentials stay in a secret');
assert.ok(worker.includes('RSASSA-PKCS1-v1_5'), 'service-account JWTs are signed in the Worker');
assert.ok(worker.includes('firebaseUidFromToken(token, env)'), 'every account route verifies the Firebase user');
assert.ok(worker.includes("if (path !== 'users/' + uid) throw new Error('An account can only write its own document.')"),
  'an account cannot write another account document');
assert.ok(worker.includes("if (ACCOUNT_SYNC_DENY_FIELD.test(key))"), 'credentials cannot be persisted by the fallback');
assert.ok(worker.includes("if (validated.base !== null && current.revision > validated.base)"),
  'stale edits are rejected by revision');
assert.ok(worker.includes("Math.max(current.revision, Number(validated.base) || 0) + 1"),
  'a first D1 write adopts the existing Firestore revision');
assert.ok(worker.includes("if (!cron) requireOrigin(request, env);"),
  'cron mirror retries do not require a browser Origin');
assert.ok(worker.includes('RESOURCE_EXHAUSTED'), 'quota failures are retried by the mirror');
assert.ok(wrangler.includes('FIREBASE_PROJECT_ID = "biglwa"'), 'Worker knows the Firestore project');
assert.ok(wrangler.includes('binding = "BIGLWA_ACCOUNT_DB"'), 'D1 setup is documented for deployment');
assert.ok(wrangler.includes('--file=account-sync-schema.sql'), 'the D1 setup command points to the schema');
assert.ok(schema.includes('CREATE TABLE IF NOT EXISTS account_sync_state'), 'schema creates revisioned state');
assert.ok(schema.includes('CREATE TABLE IF NOT EXISTS account_sync_mirror'), 'schema creates the mirror queue');
assert.ok(!/(access_token|private_key|client_secret)/i.test(schema), 'schema contains no credentials');
assert.ok(!wrangler.includes('FIREBASE_SERVICE_ACCOUNT ='), 'service-account JSON is never committed');

assert.ok(instagram.includes("var orbitNoticeMessage = '';"), 'Instagram stores the return notice');
assert.ok(instagram.includes("function orbitNotice(message){"), 'Instagram writes the Orbit status node');
assert.ok(instagram.includes("document.addEventListener('biglwa:module-open'"),
  'Instagram replays the notice when Orbit opens');
assert.ok(instagram.includes("state.uid=activeAccountUid;"), 'Instagram state is bound to the signed-in account');
assert.ok(instagram.includes("lastUid=uid;activeAccountUid=uid;state.uid=uid;"),
  'background session restore also binds the Instagram state to the UID');
assert.ok(instagram.includes("notice: function(){return orbitNoticeMessage}"),
  'the OAuth notice survives Orbit repaints');
assert.ok(instagram.includes("'✓ Instagram is linked to your BIG LWA account.'"),
  'successful Instagram grants are acknowledged');
assert.ok(instagram.includes('state.accountSaveFailed = true'),
  'a failed Instagram account save is visible instead of silently green');
assert.ok(pages.includes("const ig=window.__biglwaInstagramOrbit?.state;"),
  'Orbit row reads the verified Instagram session');
assert.ok(pages.includes("accountSaveFailed:!!ig.accountSaveFailed"),
  'Orbit row reports pending Instagram account sync');
assert.ok(pages.includes("document.addEventListener('biglwa:instagram-restored'"),
  'Orbit repaints when Instagram finishes restoring');
assert.ok(pages.includes("const instagramNotice=String(window.__biglwaInstagramOrbit?.notice?.()||'');"),
  'each Orbit repaint replays the Instagram acknowledgement');

console.log('PASS · durable account outbox keeps quota-rejected writes');
console.log('PASS · Worker D1/R2 state mirrors to Firestore with revision checks');
console.log('PASS · Instagram OAuth returns show a verified Connected row and acknowledgement');
