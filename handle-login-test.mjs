import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeHandle, requestHandleCustomToken } from './handle-login-ui.js';

const read = (name) => readFileSync(new URL('./' + name, import.meta.url), 'utf8');
const worker = read('cloudflare-worker-instagram.js');

assert.equal(normalizeHandle('  @Sam.Kalina '), 'sam.kalina');
assert.equal(normalizeHandle('@@imanI'), 'imani');

assert.match(worker, /pathname === '\/auth\/handle-login' && request\.method === 'POST'/,
  'Worker exposes the handle login route');
assert.match(worker, /if \(!allowedOrigin\(request, env\)\) return json\(\{ error: 'Origin not allowed\.' \}, 403/,
  'Handle login is origin-gated');
assert.match(worker, /accountSyncFromFirestoreFields\(doc\?\.fields \|\| \{\}\)\.uid/,
  'Handle resolves through the public username directory');
assert.match(worker, /firebaseAdminUserByUid\(env, token, uid\)/,
  'Email is resolved server-side with Firebase Admin');
assert.match(worker, /result\.localId !== uid/,
  'The verified password must belong to the handle owner');
assert.match(worker, /customToken: await createHandleCustomToken/,
  'Only a short-lived custom token is returned');
assert.doesNotMatch(worker, /json\(\{ email:/,
  'No account email is returned to the browser');

const calls = [];
const okFetch = async (url, init) => {
  calls.push({ url, body: JSON.parse(init.body) });
  return { ok: true, status: 200, json: async () => ({ customToken: 'header.claims.signature' }) };
};
assert.equal(await requestHandleCustomToken('@Imani', 'valid-password', okFetch), 'header.claims.signature');
assert.equal(calls[0].url, 'https://api.biglwa.com/auth/handle-login');
assert.deepEqual(calls[0].body, { handle: 'imani', password: 'valid-password' });

await assert.rejects(() => requestHandleCustomToken('@ab', 'pw', okFetch), /5–24/);
await assert.rejects(() => requestHandleCustomToken('@imani', '', okFetch), /Enter your password/);
const denied = async () => ({ ok: false, status: 401, json: async () => ({ error: 'That handle and password did not match.' }) });
await assert.rejects(() => requestHandleCustomToken('@imani', 'wrong', denied), /did not match/);
const throttled = async () => ({ ok: false, status: 429, json: async () => ({}) });
await assert.rejects(() => requestHandleCustomToken('@imani', 'wrong', throttled), /Too many/);
const offline = async () => ({ ok: false, status: 503, json: async () => ({}) });
await assert.rejects(() => requestHandleCustomToken('@imani', 'pw', offline), /unavailable/);

const client = read('handle-login-ui.js');
assert.match(client, /signInWithCustomToken\(getAuth\(app\), token\)/,
  'Browser hands the custom token to Firebase Auth');
assert.match(client, /document\.addEventListener\('submit'[\s\S]*?true\)/,
  'Handle interception runs before the legacy submit listener');
for (const shell of ['index.html', '404.html', 'studio/index.html', 'live-studio-shell.html']) {
  assert.match(read(shell), /handle-login-ui\.js\?v=20261126-handle-1/, shell + ' loads the handle login bridge');
}
console.log('PASS · @handle resolves server-side and returns only a Firebase custom token');
console.log('PASS · handle normalization, throttling, and generic client errors');
