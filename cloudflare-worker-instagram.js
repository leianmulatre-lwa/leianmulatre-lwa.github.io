const INSTAGRAM_AUTHORIZE_URL = 'https://www.instagram.com/oauth/authorize';
const INSTAGRAM_TOKEN_URL = 'https://api.instagram.com/oauth/access_token';
const INSTAGRAM_GRAPH_URL = 'https://graph.instagram.com';
const OAUTH_SCOPES = 'instagram_business_basic,instagram_business_manage_messages';
const SESSION_TTL = 60 * 60 * 24 * 30;

export default {
  async fetch(request, env) {
    try {
      return await route(request, env);
    } catch (error) {
      console.error('BIGLWA Instagram Worker:', error);
      return json({ error: 'Instagram service error. Please try again.' }, 500, request, env);
    }
  }
};

async function route(request, env) {
  assertEnvironment(env);
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return corsPreflight(request, env);
  if (url.pathname === '/' || url.pathname === '/health') {
    return json({ ok: true, service: 'BIGLWA Instagram API' }, 200, request, env);
  }
  if (url.pathname === '/oauth/start' && request.method === 'GET') return startOAuth(url, env);
  if (url.pathname === '/oauth/callback' && request.method === 'GET') return finishOAuth(url, env);
  if (url.pathname === '/session/exchange' && request.method === 'POST') return exchangeHandoff(request, env);
  if (url.pathname === '/instagram/profile' && request.method === 'GET') return proxyProfile(request, env);
  if (url.pathname === '/instagram/media' && request.method === 'GET') return proxyMedia(request, env);
  if (url.pathname === '/instagram/disconnect' && request.method === 'POST') return disconnect(request, env);
  if (url.pathname === '/meta/webhook') return webhook(request, env, url);
  if (url.pathname === '/instagram-deauthorize' && request.method === 'POST') return deauthorize(request, env);
  if (url.pathname === '/data-deletion' && request.method === 'POST') return dataDeletion(request, env, url);
  return json({ error: 'Not found' }, 404, request, env);
}

function assertEnvironment(env) {
  const missing = ['INSTAGRAM_APP_ID', 'INSTAGRAM_APP_SECRET', 'SITE_URL', 'STATE_SECRET', 'OAUTH_SESSIONS']
    .filter((name) => !env[name]);
  if (missing.length) throw new Error('Missing Worker bindings: ' + missing.join(', '));
}

function redirectUri(env) {
  return 'https://biglwa-instagram-api.leianmulatre-284.workers.dev/oauth/callback';
}

async function startOAuth(url, env) {
  const requestedReturn = url.searchParams.get('return_to') || env.SITE_URL + '/studio?view=orbit';
  const returnTo = safeReturnUrl(requestedReturn, env);
  const nonce = randomToken(32);
  const state = nonce + '.' + bytesToBase64Url(await hmac(env.STATE_SECRET, nonce));
  await env.OAUTH_SESSIONS.put('state:' + state, JSON.stringify({ returnTo, createdAt: Date.now() }), { expirationTtl: 600 });
  const authorization = new URL(INSTAGRAM_AUTHORIZE_URL);
  authorization.searchParams.set('client_id', env.INSTAGRAM_APP_ID);
  authorization.searchParams.set('redirect_uri', redirectUri(env));
  authorization.searchParams.set('response_type', 'code');
  authorization.searchParams.set('scope', OAUTH_SCOPES);
  authorization.searchParams.set('force_reauth', 'true');
  return Response.redirect(authorization.toString(), 302);
}

async function finishOAuth(url, env) {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  if (!state) return redirectError(env.SITE_URL, 'Instagram returned no security state.');
  const stateParts = state.split('.');
  if (stateParts.length !== 2 || !timingSafeEqual(base64UrlToBytes(stateParts[1]), await hmac(env.STATE_SECRET, stateParts[0]))) {
    return redirectError(env.SITE_URL, 'Instagram returned an invalid security state.');
  }
  const stateKey = 'state:' + state;
  const saved = await env.OAUTH_SESSIONS.get(stateKey, 'json');
  await env.OAUTH_SESSIONS.delete(stateKey);
  if (!saved) return redirectError(env.SITE_URL, 'Instagram connection expired. Please try again.');
  if (error || !code) return redirectError(saved.returnTo, 'Instagram authorization was cancelled.');

  const form = new FormData();
  form.set('client_id', env.INSTAGRAM_APP_ID);
  form.set('client_secret', env.INSTAGRAM_APP_SECRET);
  form.set('grant_type', 'authorization_code');
  form.set('redirect_uri', redirectUri(env));
  form.set('code', code.replace(/#_$/, ''));
  const tokenResponse = await fetch(INSTAGRAM_TOKEN_URL, { method: 'POST', body: form });
  const shortToken = await tokenResponse.json();
  if (!tokenResponse.ok || !shortToken.access_token) throw new Error('Instagram token exchange failed.');

  const exchange = new URL(INSTAGRAM_GRAPH_URL + '/access_token');
  exchange.searchParams.set('grant_type', 'ig_exchange_token');
  exchange.searchParams.set('client_secret', env.INSTAGRAM_APP_SECRET);
  exchange.searchParams.set('access_token', shortToken.access_token);
  const longResponse = await fetch(exchange.toString());
  const longToken = await longResponse.json();
  const accessToken = longResponse.ok && longToken.access_token ? longToken.access_token : shortToken.access_token;
  const expiresIn = Number(longToken.expires_in || SESSION_TTL);
  const sessionId = randomToken(32);
  const userId = String(shortToken.user_id || '');
  const session = { accessToken, userId, createdAt: Date.now(), expiresAt: Date.now() + expiresIn * 1000 };
  await env.OAUTH_SESSIONS.put('session:' + sessionId, JSON.stringify(session), { expirationTtl: Math.min(expiresIn, SESSION_TTL) });
  if (userId) await env.OAUTH_SESSIONS.put('user:' + userId, sessionId, { expirationTtl: Math.min(expiresIn, SESSION_TTL) });
  const handoff = randomToken(24);
  await env.OAUTH_SESSIONS.put('handoff:' + handoff, sessionId, { expirationTtl: 120 });
  const destination = new URL(saved.returnTo);
  destination.searchParams.set('instagram_handoff', handoff);
  return Response.redirect(destination.toString(), 302);
}

async function exchangeHandoff(request, env) {
  requireOrigin(request, env);
  const body = await request.json().catch(() => ({}));
  const handoff = String(body.handoff || '');
  if (!handoff) return json({ error: 'Missing handoff code.' }, 400, request, env);
  const key = 'handoff:' + handoff;
  const sessionId = await env.OAUTH_SESSIONS.get(key);
  await env.OAUTH_SESSIONS.delete(key);
  if (!sessionId) return json({ error: 'Instagram handoff expired. Please reconnect.' }, 401, request, env);
  return json({ session: sessionId }, 200, request, env);
}

async function sessionFromRequest(request, env) {
  const header = request.headers.get('Authorization') || '';
  const sessionId = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!sessionId) return null;
  const session = await env.OAUTH_SESSIONS.get('session:' + sessionId, 'json');
  if (!session || session.expiresAt < Date.now()) return null;
  return { id: sessionId, ...session };
}

async function graph(path, session, fields) {
  const url = new URL(INSTAGRAM_GRAPH_URL + path);
  if (fields) url.searchParams.set('fields', fields);
  url.searchParams.set('access_token', session.accessToken);
  const response = await fetch(url.toString());
  const body = await response.json();
  if (!response.ok || body.error) throw new Error('Instagram Graph request failed.');
  return body;
}

async function proxyProfile(request, env) {
  requireOrigin(request, env);
  const session = await sessionFromRequest(request, env);
  if (!session) return json({ error: 'Instagram session expired.' }, 401, request, env);
  const profile = await graph('/me', session, 'user_id,username,name,account_type,profile_picture_url,followers_count,media_count');
  return json(profile, 200, request, env);
}

async function proxyMedia(request, env) {
  requireOrigin(request, env);
  const session = await sessionFromRequest(request, env);
  if (!session) return json({ error: 'Instagram session expired.' }, 401, request, env);
  const media = await graph('/me/media', session, 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,children{media_type,media_url,thumbnail_url}');
  return json(media, 200, request, env);
}

async function disconnect(request, env) {
  requireOrigin(request, env);
  const session = await sessionFromRequest(request, env);
  if (session) {
    await env.OAUTH_SESSIONS.delete('session:' + session.id);
    if (session.userId) await env.OAUTH_SESSIONS.delete('user:' + session.userId);
  }
  return json({ ok: true }, 200, request, env);
}

async function webhook(request, env, url) {
  if (request.method === 'GET') {
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');
    if (mode === 'subscribe' && env.WEBHOOK_VERIFY_TOKEN && token === env.WEBHOOK_VERIFY_TOKEN) {
      return new Response(challenge || '', { status: 200 });
    }
    return new Response('Forbidden', { status: 403 });
  }
  if (request.method === 'POST') {
    const raw = await request.text();
    const signature = request.headers.get('x-hub-signature-256') || '';
    if (!(await validMetaSignature(raw, signature, env.INSTAGRAM_APP_SECRET))) return new Response('Forbidden', { status: 403 });
    return new Response('EVENT_RECEIVED', { status: 200 });
  }
  return new Response('Method not allowed', { status: 405 });
}

async function deauthorize(request, env) {
  const form = await request.formData();
  const payload = await parseSignedRequest(String(form.get('signed_request') || ''), env.INSTAGRAM_APP_SECRET);
  if (payload && payload.user_id) {
    const sessionId = await env.OAUTH_SESSIONS.get('user:' + payload.user_id);
    if (sessionId) await env.OAUTH_SESSIONS.delete('session:' + sessionId);
    await env.OAUTH_SESSIONS.delete('user:' + payload.user_id);
  }
  return json({ ok: true }, 200, request, env);
}

async function dataDeletion(request, env, url) {
  const form = await request.formData();
  const payload = await parseSignedRequest(String(form.get('signed_request') || ''), env.INSTAGRAM_APP_SECRET);
  const confirmationCode = randomToken(16);
  if (payload && payload.user_id) {
    const sessionId = await env.OAUTH_SESSIONS.get('user:' + payload.user_id);
    if (sessionId) await env.OAUTH_SESSIONS.delete('session:' + sessionId);
    await env.OAUTH_SESSIONS.delete('user:' + payload.user_id);
  }
  return json({ url: env.SITE_URL + '/data-deletion?code=' + confirmationCode, confirmation_code: confirmationCode }, 200, request, env);
}

async function parseSignedRequest(value, secret) {
  const parts = value.split('.');
  if (parts.length !== 2) return null;
  const expected = await hmac(secret, parts[1]);
  if (!timingSafeEqual(base64UrlToBytes(parts[0]), expected)) return null;
  try { return JSON.parse(new TextDecoder().decode(base64UrlToBytes(parts[1]))); } catch { return null; }
}

async function validMetaSignature(body, header, secret) {
  if (!header.startsWith('sha256=')) return false;
  const expected = await hmac(secret, body);
  return timingSafeEqual(hexToBytes(header.slice(7)), expected);
}

async function hmac(secret, value) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value)));
}

function randomToken(size) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

function bytesToBase64Url(bytes) {
  let value = '';
  bytes.forEach((byte) => { value += String.fromCharCode(byte); });
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(normalized + '='.repeat((4 - normalized.length % 4) % 4));
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}

function hexToBytes(value) {
  if (!/^[0-9a-f]+$/i.test(value) || value.length % 2) return new Uint8Array();
  return Uint8Array.from(value.match(/.{2}/g), (pair) => parseInt(pair, 16));
}

function timingSafeEqual(left, right) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) mismatch |= left[index] ^ right[index];
  return mismatch === 0;
}

function safeReturnUrl(value, env) {
  try {
    const candidate = new URL(value);
    const site = new URL(env.SITE_URL);
    return candidate.origin === site.origin ? candidate.toString() : site.origin + '/studio?view=orbit';
  } catch { return env.SITE_URL + '/studio?view=orbit'; }
}

function redirectError(destination, message) {
  const url = new URL(destination);
  url.searchParams.set('instagram_error', message);
  return Response.redirect(url.toString(), 302);
}

function allowedOrigin(request, env) {
  const origin = request.headers.get('Origin') || '';
  const siteOrigin = new URL(env.SITE_URL).origin;
  return origin === siteOrigin ? origin : '';
}

function requireOrigin(request, env) {
  if (!allowedOrigin(request, env)) throw new Error('Origin not allowed.');
}

function corsPreflight(request, env) {
  const origin = allowedOrigin(request, env);
  if (!origin) return new Response(null, { status: 403 });
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

function json(body, status, request, env) {
  const origin = allowedOrigin(request, env);
  const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
  if (origin) Object.assign(headers, corsHeaders(origin));
  return new Response(JSON.stringify(body), { status, headers });
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Vary': 'Origin'
  };
}
