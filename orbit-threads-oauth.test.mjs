import assert from 'node:assert/strict';
import test from 'node:test';
import worker from './cloudflare-worker-instagram.js';

test('Threads authorizes a read-only profile, restores it for the same member, and disconnects', async (t) => {
  const records = new Map();
  const env = {
    THREADS_APP_ID: 'test-id',
    THREADS_APP_SECRET: 'test-secret',
    OAUTH_SESSIONS: {
      get: async (key) => records.get(key) ?? null,
      put: async (key, value) => { records.set(key, JSON.parse(value)); },
      delete: async (key) => { records.delete(key); }
    }
  };
  t.mock.method(globalThis, 'fetch', async (input, options) => {
    const url = new URL(input);
    if (url.hostname === 'identitytoolkit.googleapis.com') {
      const { idToken } = JSON.parse(options.body);
      return Response.json({ users: [{ localId: idToken, emailVerified: true }] });
    }
    assert.equal(url.hostname, 'graph.threads.net');
    if (url.pathname === '/oauth/access_token') {
      assert.equal(options.method, 'POST');
      assert.equal(options.body.get('client_id'), 'test-id');
      assert.equal(options.body.get('client_secret'), 'test-secret');
      assert.equal(options.body.get('redirect_uri'), 'https://api.biglwa.com/threads/callback');
      assert.equal(options.body.has('code_verifier'), false);
      return Response.json({ access_token: 'short-token' });
    }
    if (url.pathname === '/access_token') {
      assert.equal(url.searchParams.get('grant_type'), 'th_exchange_token');
      assert.equal(options.headers.Authorization, 'Bearer short-token');
      return Response.json({ access_token: 'long-token', expires_in: 5184000 });
    }
    assert.equal(url.pathname, '/me');
    assert.equal(options.headers.Authorization, 'Bearer long-token');
    return Response.json({ id: '1', username: 'test.member' });
  });
  const request = (path, method = 'GET', member = '') => worker.fetch(new Request(
    'https://api.biglwa.com/threads/' + path,
    {method, headers: member ? {Authorization: 'Bearer ' + member} : {}}
  ), env);
  assert.equal((await request('health')).status, 200);
  assert.equal((await request('start', 'POST')).status, 401);
  const start = await (await request('start', 'POST', 'member-a')).json();
  const authorize = new URL(start.authorizeUrl);
  assert.equal(authorize.hostname, 'www.threads.com');
  assert.equal(authorize.searchParams.get('scope'), 'threads_basic');
  assert.equal(authorize.searchParams.has('client_secret'), false);
  const callback = 'callback?code=test-code&state=' + authorize.searchParams.get('state');
  const done = await request(callback);
  assert.equal(done.status, 302);
  assert.match(done.headers.get('location'), /orbit_provider=threads&orbit_status=connected/);
  const replay = await request(callback);
  assert.match(replay.headers.get('location'), /orbit_status=failed/);
  const session = await (await request('session', 'GET', 'member-a')).json();
  assert.equal(session.connected, true);
  assert.equal(session.profile.link, 'https://www.threads.com/@test.member');
  assert.equal(JSON.stringify(session).includes('long-token'), false);
  assert.equal((await (await request('session', 'GET', 'member-b')).json()).connected, false);
  assert.equal((await request('imports', 'GET', 'member-a')).status, 404);
  await request('disconnect', 'POST', 'member-a');
  assert.equal((await (await request('session', 'GET', 'member-a')).json()).connected, false);
});
