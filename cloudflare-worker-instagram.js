const INSTAGRAM_AUTHORIZE_URL = 'https://www.instagram.com/oauth/authorize';
const INSTAGRAM_TOKEN_URL = 'https://api.instagram.com/oauth/access_token';
const INSTAGRAM_GRAPH_URL = 'https://graph.instagram.com';
const OAUTH_SCOPES = 'instagram_business_basic,instagram_business_manage_messages';
const SESSION_TTL = 60 * 60 * 24 * 30;

const instagramWorker = {
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
  authorization.searchParams.set('state', state);
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

/* TikTok Login Kit Web. Uses the existing OAUTH_SESSIONS KV binding.
 * Set TIKTOK_CLIENT_KEY and secret TIKTOK_CLIENT_SECRET in Cloudflare.
 * Register https://biglwa-instagram-api.leianmulatre-284.workers.dev/tiktok/callback
 * under Login Kit > Web. Tokens stay in KV, never in browser responses.
 */
export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname.startsWith('/pinterest/')) {
      const config = { ...env, SITE_URL: env.SITE_URL || 'https://biglwa.com' };
      try { return await pnRoute(request, config); }
      catch (error) { return json({ error: error.publicMessage || 'Pinterest connection failed. Please try again.' }, error.status || 502, request, config); }
    }
    if (!new URL(request.url).pathname.startsWith('/tiktok/')) return instagramWorker.fetch(request, env);
    env = { ...env, SITE_URL: env.SITE_URL || 'https://biglwa.com' };
    try { return await ttRoute(request, env); }
    catch (error) { return json({ error: error.publicMessage || 'TikTok service could not complete the request. Please reconnect.' }, error.status || 502, request, env); }
  }
};
function ttFail(message, status = 400) { const error = new Error(message); error.publicMessage = message; error.status = status; throw error; }
function ttCallback(request) { return new URL('/tiktok/callback', request.url).href; }
function ttCookie(request) { return (request.headers.get('Cookie') || '').split(';').map(s => s.trim()).find(s => s.startsWith('__Host-tt_oauth='))?.slice(16) || ''; }
function ttRedirect(location, cookie) { return new Response(null, { status: 302, headers: { Location: location, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'Set-Cookie': '__Host-tt_oauth=' + cookie + '; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=' + (cookie ? 600 : 0) } }); }
async function ttToken(env, params) {
  const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', { method: 'POST', body: new URLSearchParams({ client_key: env.TIKTOK_CLIENT_KEY, client_secret: env.TIKTOK_CLIENT_SECRET, ...params }) });
  const token = await response.json();
  if (!response.ok || !token.access_token) ttFail('TikTok token exchange failed. Check that the client key, secret and Web redirect URI belong to the same TikTok app environment, then reconnect.', 502);
  return token;
}
async function ttSave(env, id, token) {
  const ttl = Math.max(60, Math.min(Number(token.refresh_expires_in || token.expires_in || 86400), 31536000));
  const saved = { ...token, expiresAt: Date.now() + Number(token.expires_in || 86400) * 1000 };
  await env.OAUTH_SESSIONS.put('tt:session:' + id, JSON.stringify(saved), { expirationTtl: ttl });
  return saved;
}
async function ttRoute(request, env) {
  const url = new URL(request.url), path = url.pathname;
  if (request.method === 'OPTIONS') return corsPreflight(request, env);
  const missing = ['TIKTOK_CLIENT_KEY', 'TIKTOK_CLIENT_SECRET', 'OAUTH_SESSIONS'].filter(k => !env[k]);
  if (path === '/tiktok/health') return json({ ok: !missing.length, missing, callback: ttCallback(request), version: 'tiktok-1' }, missing.length ? 503 : 200, request, env);
  if (missing.length) ttFail('Add these Cloudflare Worker settings: ' + missing.join(', '), 503);
  if (path === '/tiktok/start' && request.method === 'GET') {
    const challenge = url.searchParams.get('challenge') || '';
    if (!/^[A-Za-z0-9_-]{43}$/.test(challenge)) ttFail('Start TikTok connection from Orbit.', 400);
    const state = randomToken(32), browser = randomToken(32);
    await env.OAUTH_SESSIONS.put('tt:state:' + state, JSON.stringify({ browser, challenge, callback: ttCallback(request) }), { expirationTtl: 600 });
    const dest = new URL('https://www.tiktok.com/v2/auth/authorize/');
    dest.search = new URLSearchParams({ client_key: env.TIKTOK_CLIENT_KEY, response_type: 'code', scope: 'user.info.basic,video.list', redirect_uri: ttCallback(request), state }).toString();
    return ttRedirect(dest.href, browser);
  }
  if (path === '/tiktok/callback' && request.method === 'GET') {
    const state = url.searchParams.get('state') || '';
    if (!state) return json({ ok: true, message: 'TikTok callback is installed. Start the connection from Orbit.', start: new URL('/tiktok/start', request.url).href }, 200, request, env);
    const saved = await env.OAUTH_SESSIONS.get('tt:state:' + state, 'json');
    if (!saved || !ttCookie(request) || saved.browser !== ttCookie(request)) ttFail('TikTok login expired or was opened in another browser. Start again from Orbit.', 400);
    await env.OAUTH_SESSIONS.delete('tt:state:' + state);
    const destination = new URL('/studio?view=orbit', env.SITE_URL);
    if (url.searchParams.has('error') || !url.searchParams.get('code')) {
      destination.searchParams.set('tiktok_error', 'TikTok authorization was cancelled or denied. Please try again.');
      return ttRedirect(destination.href, '');
    }
    const token = await ttToken(env, { grant_type: 'authorization_code', code: url.searchParams.get('code'), redirect_uri: saved.callback });
    const id = randomToken(32), handoff = randomToken(32);
    await ttSave(env, id, token);
    await env.OAUTH_SESSIONS.put('tt:handoff:' + handoff, JSON.stringify({ id, challenge: saved.challenge }), { expirationTtl: 120 });
    destination.searchParams.set('tiktok_handoff', handoff);
    return ttRedirect(destination.href, '');
  }
  if (!allowedOrigin(request, env)) ttFail('Origin not allowed.', 403);
  if (path === '/tiktok/session' && request.method === 'POST') {
    const body = await request.json();
    const handoff = String(body.handoff || '');
    if (!/^[A-Za-z0-9_-]{43}$/.test(handoff)) ttFail('Invalid TikTok handoff.', 400);
    const key = 'tt:handoff:' + handoff, saved = await env.OAUTH_SESSIONS.get(key, 'json');
    if (!saved) ttFail('TikTok connection expired. Please reconnect.', 401);
    const challenge = bytesToBase64Url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(body.verifier || '')))));
    if (challenge !== saved.challenge) ttFail('Reconnect TikTok from the same browser tab.', 401);
    await env.OAUTH_SESSIONS.delete(key);
    return json({ session: saved.id }, 200, request, env);
  }
  const id = (request.headers.get('Authorization') || '').replace(/^Bearer /, '');
  let session = /^[A-Za-z0-9_-]{43}$/.test(id) ? await env.OAUTH_SESSIONS.get('tt:session:' + id, 'json') : null;
  if (!session) ttFail('TikTok session expired. Please reconnect.', 401);
  if (path === '/tiktok/disconnect' && request.method === 'POST') {
    await env.OAUTH_SESSIONS.delete('tt:session:' + id);
    return json({ ok: true }, 200, request, env);
  }
  if (request.method !== 'GET' || !['/tiktok/profile', '/tiktok/videos'].includes(path)) ttFail('Not found.', 404);
  if (session.expiresAt < Date.now() + 60000) {
    if (!session.refresh_token) ttFail('TikTok session expired. Please reconnect.', 401);
    session = await ttSave(env, id, await ttToken(env, { grant_type: 'refresh_token', refresh_token: session.refresh_token }));
  }
  const videos = path === '/tiktok/videos';
  const endpoint = videos ? 'video/list/?fields=id,title,video_description,cover_image_url,share_url' : 'user/info/?fields=open_id,display_name,avatar_url';
  const response = await fetch('https://open.tiktokapis.com/v2/' + endpoint, {
    method: videos ? 'POST' : 'GET',
    headers: { Authorization: 'Bearer ' + session.access_token, 'Content-Type': 'application/json' },
    ...(videos ? { body: JSON.stringify({ max_count: 20 }) } : {})
  });
  const body = await response.json();
  if (!response.ok || (body.error && body.error.code !== 'ok')) ttFail('TikTok could not return ' + (videos ? 'videos. Check video.list access for this app.' : 'your profile. Check user.info.basic access for this app.'), 502);
  return json(videos ? { videos: body.data?.videos || [] } : (body.data?.user || {}), 200, request, env);
}

function pnFail(message, status = 400) { const error = new Error(message); error.publicMessage = message; error.status = status; throw error; }
function pnCallback(request) { return new URL('/pinterest/callback', request.url).href; }
function pnCookie(request) { return (request.headers.get('Cookie') || '').split(';').map(s => s.trim()).find(s => s.startsWith('__Host-pn_oauth='))?.slice(16) || ''; }
function pnRedirect(location, cookie) { return new Response(null, { status: 302, headers: { Location: location, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'Set-Cookie': '__Host-pn_oauth=' + cookie + '; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=' + (cookie ? 600 : 0) } }); }
async function pnToken(env, params) {
  const response = await fetch('https://api.pinterest.com/v5/oauth/token', {
    method: 'POST', headers: { Authorization: 'Basic ' + btoa(env.PINTEREST_APP_ID + ':' + env.PINTEREST_APP_SECRET), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params)
  });
  const token = await response.json();
  if (!response.ok || !token.access_token) pnFail('Pinterest could not authorize this connection. Check the approved app ID, app secret and registered redirect URI, then reconnect.', 502);
  return token;
}
async function pnSave(env, id, token) {
  const pnl = Math.max(60, Math.min(Number(token.refresh_token_expires_in || token.expires_in || 86400), 31536000));
  const saved = { ...token, expiresAt: Date.now() + Number(token.expires_in || 86400) * 1000 };
  await env.OAUTH_SESSIONS.put('pn:session:' + id, JSON.stringify(saved), { expirationTtl: pnl });
  return saved;
}
async function pnRoute(request, env) {
  const url = new URL(request.url), path = url.pathname;
  if (request.method === 'OPTIONS') return corsPreflight(request, env);
  const missing = ['PINTEREST_APP_ID', 'PINTEREST_APP_SECRET', 'OAUTH_SESSIONS'].filter(k => !env[k]);
  if (path === '/pinterest/health') return json({ ok: !missing.length, missing, callback: pnCallback(request), version: 'pinterest-1' }, missing.length ? 503 : 200, request, env);
  if (missing.length) pnFail('Add these Cloudflare Worker settings: ' + missing.join(', '), 503);
  if (path === '/pinterest/start' && request.method === 'GET') {
    const challenge = url.searchParams.get('challenge') || '';
    if (!/^[A-Za-z0-9_-]{43}$/.test(challenge)) pnFail('Start Pinterest connection from Orbit.', 400);
    const state = randomToken(32), browser = randomToken(32);
    await env.OAUTH_SESSIONS.put('pn:state:' + state, JSON.stringify({ browser, challenge, callback: pnCallback(request) }), { expirationTtl: 600 });
    const dest = new URL('https://www.pinterest.com/oauth/');
    dest.search = new URLSearchParams({ client_id: env.PINTEREST_APP_ID, response_type: 'code', scope: 'boards:read,pins:read,user_accounts:read', redirect_uri: pnCallback(request), state }).toString();
    return pnRedirect(dest.href, browser);
  }
  if (path === '/pinterest/callback' && request.method === 'GET') {
    const state = url.searchParams.get('state') || '';
    if (!state) return json({ ok: true, message: 'Pinterest callback is installed. Start the connection from Orbit.', start: new URL('/pinterest/start', request.url).href }, 200, request, env);
    const saved = await env.OAUTH_SESSIONS.get('pn:state:' + state, 'json');
    if (!saved || !pnCookie(request) || saved.browser !== pnCookie(request)) pnFail('Pinterest login expired or was opened in another browser. Start again from Orbit.', 400);
    await env.OAUTH_SESSIONS.delete('pn:state:' + state);
    const destination = new URL('/studio?view=boards', env.SITE_URL);
    if (url.searchParams.has('error') || !url.searchParams.get('code')) {
      destination.searchParams.set('pinterest_error', 'Pinterest authorization was cancelled or denied. Please try again.');
      return pnRedirect(destination.href, '');
    }
    const token = await pnToken(env, { grant_type: 'authorization_code', code: url.searchParams.get('code'), redirect_uri: saved.callback });
    const id = randomToken(32), handoff = randomToken(32);
    await pnSave(env, id, token);
    await env.OAUTH_SESSIONS.put('pn:handoff:' + handoff, JSON.stringify({ id, challenge: saved.challenge }), { expirationTtl: 120 });
    destination.searchParams.set('pinterest_handoff', handoff);
    return pnRedirect(destination.href, '');
  }
  if (!allowedOrigin(request, env)) pnFail('Origin not allowed.', 403);
  if (path === '/pinterest/session' && request.method === 'POST') {
    const body = await request.json();
    const handoff = String(body.handoff || '');
    if (!/^[A-Za-z0-9_-]{43}$/.test(handoff)) pnFail('Invalid Pinterest handoff.', 400);
    const key = 'pn:handoff:' + handoff, saved = await env.OAUTH_SESSIONS.get(key, 'json');
    if (!saved) pnFail('Pinterest connection expired. Please reconnect.', 401);
    const challenge = bytesToBase64Url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(body.verifier || '')))));
    if (challenge !== saved.challenge) pnFail('Reconnect Pinterest from the same browser tab.', 401);
    await env.OAUTH_SESSIONS.delete(key);
    return json({ session: saved.id }, 200, request, env);
  }
  const id = (request.headers.get('Authorization') || '').replace(/^Bearer /, '');
  let session = /^[A-Za-z0-9_-]{43}$/.test(id) ? await env.OAUTH_SESSIONS.get('pn:session:' + id, 'json') : null;
  if (!session) pnFail('Pinterest session expired. Please reconnect.', 401);
  if (path === '/pinterest/disconnect' && request.method === 'POST') {
    await env.OAUTH_SESSIONS.delete('pn:session:' + id);
    return json({ ok: true }, 200, request, env);
  }

  const match = path.match(/^\/pinterest\/boards\/(\d+)\/pins$/);
  if (request.method !== 'GET' || (!match && !['/pinterest/profile', '/pinterest/boards'].includes(path))) pnFail('Not found.', 404);
  if (session.expiresAt < Date.now() + 60000) {
    if (!session.refresh_token) pnFail('Pinterest session expired. Please reconnect.', 401);
    const fresh = await pnToken(env, { grant_type: 'refresh_token', refresh_token: session.refresh_token });
    if (!fresh.refresh_token) fresh.refresh_token = session.refresh_token;
    session = await pnSave(env, id, fresh);
  }
  const endpoint = match ? '/boards/' + match[1] + '/pins' : path === '/pinterest/boards' ? '/boards' : '/user_account';
  const target = new URL('https://api.pinterest.com/v5' + endpoint);
  if (endpoint !== '/user_account') {
    target.searchParams.set('page_size', '25');
    const bookmark = url.searchParams.get('bookmark');
    if (bookmark) { if (bookmark.length > 4096) pnFail('Invalid page.', 400); target.searchParams.set('bookmark', bookmark); }
  }
  const response = await fetch(target.href, { headers: { Authorization: 'Bearer ' + session.access_token } });
  const data = await response.json();
  if (!response.ok) {
    if (response.status === 401) pnFail('Pinterest session expired. Please reconnect.', 401);
    if (response.status === 429) pnFail('Pinterest is limiting requests. Please try again later.', 429);
    pnFail('Pinterest could not return this content. Check that this account has access to the trial app and selected board.', response.status === 403 ? 403 : 502);
  }
  return json(data, 200, request, env);
}
