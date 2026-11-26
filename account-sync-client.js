/* BIG LWA durable account-write outbox.
 *
 * Firestore remains the first writer. This client only takes over when a write is
 * rejected for quota or cannot reach Firebase; the queued edit is sent to the BIG
 * LWA Worker, which stores it in D1/R2 and mirrors it into Firestore when quota
 * recovers. Nothing here holds provider tokens or passwords.
 */
(() => {
  'use strict';
  if (window.BigLWAAccountSync) return;

  const API = 'https://biglwa-instagram-api.leianmulatre-284.workers.dev';
  const QUEUE_KEY = 'biglwaAccountSyncQueueV1:';
  const FIREBASE_CONFIG = {
    apiKey: 'AIzaSyAPUT8_pLNxdh5tbGpAmXBJiID3jVcA9DY',
    authDomain: 'biglwa.firebaseapp.com',
    projectId: 'biglwa',
    appId: '1:83232670555:web:e04927b20458390b3b507e'
  };

  let uid = '';
  let authPromise = null;
  let flushing = false;
  let timer = 0;

  const emit = (type, detail) => {
    try { window.dispatchEvent(new CustomEvent(type, { detail })); } catch (_) {}
  };
  const queueKey = () => QUEUE_KEY + (uid || 'anon');
  function readQueue() {
    try {
      const value = JSON.parse(localStorage.getItem(queueKey()) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (_) { return []; }
  }
  function writeQueue(queue) {
    try { localStorage.setItem(queueKey(), JSON.stringify(queue)); }
    catch (error) { emit('biglwa:account-sync-error', { error: error.message }); }
  }
  function auth() {
    if (!authPromise) {
      authPromise = Promise.all([
        import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js')
      ]).then(([app, authMod]) => {
        const instance = app.getApps()[0] || app.initializeApp(FIREBASE_CONFIG);
        return authMod.getAuth(instance);
      }).catch(error => { authPromise = null; throw error; });
    }
    return authPromise;
  }
  async function identity() {
    const auth = await auth();
    await auth.authStateReady();
    const current = auth.currentUser;
    if (!current) throw new Error('Sign in to BIG LWA before saving to your account.');
    uid = current.uid;
    return { uid, token: await current.getIdToken() };
  }
  function normalize(entry) {
    if (!entry || typeof entry !== 'object') return null;
    const scope = String(entry.scope || '');
    const path = String(entry.path || '');
    const editId = String(entry.editId || '');
    if (!['studioState', 'user', 'public', 'developer'].includes(scope)) return null;
    if (!path || path.length > 240) return null;
    if (!/^[A-Za-z0-9_-]{1,80}$/.test(editId)) return null;
    const suppliedBase = entry.baseRevision;
    const baseRevision = suppliedBase === null || suppliedBase === undefined || suppliedBase === ''
      ? null
      : (Number.isSafeInteger(Number(suppliedBase)) ? Math.max(0, Number(suppliedBase)) : null);
    return { uid: String(entry.uid || ''), scope, path, value: entry.value,
      baseRevision, editId, attempts: 0, nextAt: 0 };
  }
  function queue(entry, error = '') {
    // An edit made before Firebase finishes restoring still belongs to the UID
    // that made it. Keep it under that owner so a later sign-in can flush it.
    if (!uid && entry.uid) uid = String(entry.uid);
    const queue = readQueue();
    const existing = queue.findIndex(item => item.editId === entry.editId &&
      item.scope === entry.scope && item.path === entry.path);
    const saved = { ...entry, error, attempts: Number(entry.attempts) || 0,
      nextAt: Number(entry.nextAt) || 0, queuedAt: Date.now() };
    if (existing >= 0) queue[existing] = saved;
    else queue.push(saved);
    writeQueue(queue);
    emit('biglwa:account-sync-queued', { scope: entry.scope, path: entry.path, error });
    schedule();
    return { ok: false, queued: true, error: error || 'Saved on this device; cloud sync will retry.' };
  }
  async function send(entry) {
    const { uid: signedInUid, token } = await identity();
    if (entry.uid && entry.uid !== signedInUid) {
      return { ok: false, code: 'invalid', error: 'Sign in as the account that made this edit.' };
    }
    const response = await fetch(API + '/account-sync/save', {
      method: 'POST',
      cache: 'no-store',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...entry, uid: signedInUid })
    });
    const body = await response.json().catch(() => ({}));
    if (response.status === 409 || body.code === 'conflict') {
      return { ok: false, code: 'conflict', revision: body.revision,
        error: body.error || 'A newer cloud revision exists.' };
    }
    if (response.status === 400 || response.status === 403) {
      return { ok: false, code: 'invalid', error: body.error || 'That account write was refused.' };
    }
    if (!response.ok) {
      throw new Error(body.error || 'Account backup sync is unavailable.');
    }
    emit('biglwa:account-synced', { scope: entry.scope, path: entry.path,
      revision: body.revision, mirrored: !!body.mirrored });
    return { ok: true, queued: false, revision: body.revision,
      mirrored: !!body.mirrored, snapshot: !!body.snapshot };
  }
  async function save(entry) {
    const clean = normalize(entry);
    if (!clean) return { ok: false, code: 'invalid', error: 'That account write was not valid.' };
    try { return await send(clean); }
    catch (error) { return queue(clean, error.message); }
  }
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(() => { flush().catch(() => {}); }, 15000);
  }
  async function flush() {
    if (flushing || !uid) return { sent: 0, pending: readQueue().length };
    flushing = true;
    let sent = 0;
    try {
      for (const entry of readQueue()) {
        if (Date.now() < Number(entry.nextAt || 0)) continue;
        try {
          const result = await send(entry);
          const queue = readQueue();
          const index = queue.findIndex(item => item.editId === entry.editId &&
            item.scope === entry.scope && item.path === entry.path);
          if (index < 0) continue;
          if (result.ok || result.code === 'invalid') {
            queue.splice(index, 1);
            writeQueue(queue);
            if (result.ok) sent += 1;
            continue;
          }
          if (result.code === 'conflict') {
            // A newer revision needs a human decision or a fresh read. Keep the
            // edit on this device, but stop hammering the Worker with retries.
            queue[index] = { ...entry, conflict: true, error: result.error || '',
              nextAt: Date.now() + 24 * 60 * 60 * 1000 };
            writeQueue(queue);
            emit('biglwa:account-sync-conflict', { scope: entry.scope, path: entry.path });
            continue;
          }
          const attempts = Number(entry.attempts || 0) + 1;
          queue[index] = { ...entry, attempts, error: result.error || '',
            nextAt: Date.now() + Math.min(15 * 60 * 1000, 5000 * (2 ** Math.min(attempts, 7))) };
          writeQueue(queue);
        } catch (error) {
          const queue = readQueue();
          const index = queue.findIndex(item => item.editId === entry.editId &&
            item.scope === entry.scope && item.path === entry.path);
          if (index >= 0) {
            const attempts = Number(entry.attempts || 0) + 1;
            queue[index] = { ...entry, attempts, error: error.message,
              nextAt: Date.now() + Math.min(15 * 60 * 1000, 5000 * (2 ** Math.min(attempts, 7))) };
            writeQueue(queue);
          }
        }
      }
    } finally { flushing = false; }
    const pending = readQueue().length;
    if (pending) schedule();
    return { sent, pending };
  }
  async function state() {
    const { token } = await identity();
    const response = await fetch(API + '/account-sync/state', {
      cache: 'no-store', headers: { Authorization: 'Bearer ' + token }
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || 'Could not read account backup state.');
    return body.state || {};
  }
  async function retryMirror() {
    const { token } = await identity();
    const response = await fetch(API + '/account-sync/retry', {
      method: 'POST', cache: 'no-store', headers: { Authorization: 'Bearer ' + token }
    });
    return response.json().catch(() => ({}));
  }
  const ready = identity().then(() => true).catch(() => false);
  // A queued edit is durable on this device even before Firebase finishes restoring.
  window.addEventListener('online', () => { flush().catch(() => {}); });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') flush().catch(() => {});
  });
  window.addEventListener('biglwa:account-sync-queued', () => schedule());

  window.BigLWAAccountSync = Object.freeze({
    ready, save,
    enqueue: entry => {
      const clean = normalize(entry);
      return clean ? queue(clean, 'Queued for retry.')
        : { ok: false, code: 'invalid', error: 'That account write was not valid.' };
    },
    flush, state, retryMirror,
    get uid() { return uid; },
    get pending() { return readQueue().map(({ value, ...entry }) => entry); }
  });
})();
