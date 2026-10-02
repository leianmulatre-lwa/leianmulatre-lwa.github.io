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

/* Meta compares the redirect URI against the value registered in the app dashboard as an
   exact string, so it is kept in a secret instead of being pinned to a hostname in code.
   The default covers the current worker; set INSTAGRAM_REDIRECT_URI when the worker moves,
   and the exact value the Worker will send is reported by /media/health so a stale
   registration is visible without reading source. */
const DEFAULT_INSTAGRAM_REDIRECT_URI = 'https://biglwa-instagram-api.leianmulatre-284.workers.dev/oauth/callback';

/* The studio is the site root. /studio is only a stub that forwards to /?route=studio and
   rebuilds the query from scratch, so the single-use handoff code that carries the new
   connection was silently dropped and the member landed back on an unconnected site with
   nothing to show for it. Every return path goes to the root so the handoff survives. */
function studioUrl(env, view) {
  const target = new URL(env.SITE_URL || 'https://biglwa.com');
  target.pathname = '/';
  target.searchParams.set('route', 'studio');
  if (view) target.searchParams.set('view', view);
  return target.toString();
}

function redirectUri(env) {
  const value = (env.INSTAGRAM_REDIRECT_URI || DEFAULT_INSTAGRAM_REDIRECT_URI).trim();
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error('INSTAGRAM_REDIRECT_URI is not a valid URL. Set it to the exact redirect URI registered in Meta.');
  }
  if (parsed.protocol !== 'https:') throw new Error('INSTAGRAM_REDIRECT_URI must use https, which Instagram requires.');
  /* Return the trimmed original rather than parsed.href: normalising could rewrite the
     string and break Meta's exact match, which is the failure this is meant to prevent. */
  return value;
}

/* Health output is diagnostic and must not itself fail, so a bad secret is reported
   rather than thrown when it is only being displayed. */
function safeRedirectUri(env) {
  try {
    return redirectUri(env);
  } catch (error) {
    return 'invalid: ' + error.message;
  }
}

async function startOAuth(url, env) {
  const requestedReturn = url.searchParams.get('return_to') || studioUrl(env, 'orbit');
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
  const longLived = longResponse.ok && !!longToken.access_token;
  const accessToken = longLived ? longToken.access_token : shortToken.access_token;
  /* A short-lived token lasts about an hour. Recording it as a 30-day session let a
     member believe they were still connected long after Instagram had expired the
     credential, which surfaced later as an unexplained feed failure. */
  const expiresIn = Number((longLived ? longToken.expires_in : shortToken.expires_in) || 3600);
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
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.error) {
    /* Instagram explains itself in the error body: an unsupported field, a token that
       needs a permission, or an expired login each come back with a specific message.
       Discarding it for a generic string left the feed failing silently with no way to
       tell a bad field from a dead session. */
    const detail = body && body.error && (body.error.message || body.error.error_user_msg);
    const error = new Error(detail ? 'Instagram: ' + detail : 'Instagram returned ' + response.status + ' for this request.');
    error.status = response.status || 502;
    error.instagramCode = body && body.error && body.error.code;
    throw error;
  }
  return body;
}

async function proxyProfile(request, env) {
  requireOrigin(request, env);
  const session = await sessionFromRequest(request, env);
  if (!session) return json({ error: 'Instagram session expired.' }, 401, request, env);
  /* Only the fields the feed actually reads. An unsupported field fails the whole
     request, and album children are never used here. */
  const profile = await graph('/me', session, 'username,name,profile_picture_url,followers_count,media_count');
  return json(profile, 200, request, env);
}

async function proxyMedia(request, env) {
  requireOrigin(request, env);
  const session = await sessionFromRequest(request, env);
  if (!session) return json({ error: 'Instagram session expired.' }, 401, request, env);

  /* Instagram returns /me/media in pages. Orbit should import the complete synced
     library, not just the first page returned by Graph. Follow every cursor until
     Instagram says there is no next page. */
  const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';
  const allMedia = [];
  let nextPath = '/me/media?fields=' + encodeURIComponent(fields);

  while (nextPath) {
    const page = await graph(nextPath, session);
    if (Array.isArray(page.data)) allMedia.push(...page.data);

    const next = page.paging && page.paging.next;
    if (!next) {
      nextPath = '';
    } else {
      const parsed = new URL(next);
      /* Never carry Instagram's access token from the paging URL back through our
         application. The server-side session token is the only credential used here. */
      parsed.searchParams.delete('access_token');
      nextPath = parsed.pathname + parsed.search;
    }
  }

  return json({ data: allMedia }, 200, request, env);
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
    return candidate.origin === site.origin ? candidate.toString() : studioUrl(env, 'orbit');
  } catch { return studioUrl(env, 'orbit'); }
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
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
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
    if (new URL(request.url).pathname.startsWith('/media/')) {
      const config = { ...env, SITE_URL: env.SITE_URL || 'https://biglwa.com' };
      try { return await mediaRoute(request, config); }
      catch (error) { return json({ error: error.publicMessage || 'Media service error. Please try again.' }, error.status || 500, request, config); }
    }
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
  const token = await response.json().catch(() => ({}));
  if (!response.ok || !token.access_token) {
    /* TikTok names the reason precisely: an invalid client_key/secret, a redirect URI
       that is not the one registered, or a scope the app has not been granted all look
       identical from the outside. Guessing a single cause sent people to the wrong
       setting, so report what TikTok actually said. */
    const code = token.error_code ?? (token.error && typeof token.error === 'object' ? token.error.code : token.error);
    const detail = token.error_description || (token.error && typeof token.error === 'object' ? token.error.message : '');
    const reason = detail || (code ? 'TikTok reported ' + code : 'TikTok returned HTTP ' + response.status + '.');
    ttFail('TikTok rejected this connection — ' + reason + (code ? ' (code ' + code + ')' : ''), 502);
  }
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
    const destination = new URL(studioUrl(env, 'orbit'));
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
  const token = await response.json().catch(() => ({}));
  if (!response.ok || !token.access_token) {
    const detail = token.message || token.error_description || (token.error && typeof token.error === 'object' ? token.error.message : '');
    pnFail('Pinterest rejected this connection — ' + (detail || 'HTTP ' + response.status + '.'), 502);
  }
  return token;
}
async function pnSave(env, id, token, previous) {
  const pnl = Math.max(60, Math.min(Number(token.refresh_token_expires_in || token.expires_in || 86400), 31536000));
  const saved = { ...token, expiresAt: Date.now() + Number(token.expires_in || 86400) * 1000 };
  /* A refresh replaces the whole record, so the cover cache is carried across by hand.
     Without this the reader would pay for six more Pinterest calls every hour. */
  if (previous && previous.pinCovers) saved.pinCovers = previous.pinCovers;
  await env.OAUTH_SESSIONS.put('pn:session:' + id, JSON.stringify(saved), { expirationTtl: pnl });
  return saved;
}

/* Pinterest's board list carries a name and a pin count but no dependable cover picture, so a
 * board grid can only be given real photos by asking for each board's first Pin. The
 * browser cannot do that itself: it would mean six extra calls on every page open against a
 * rate limit the app shares, and the results are the same every time. So it is done here,
 * once per session, and kept on the session record until the connection changes.
 *
 * Results are deliberately partial-tolerant. A board that is empty, private, or fails for
 * any reason is simply left without a cover, because one unhappy board must not cost the
 * reader the other five. */
const PN_COVER_LIMIT = 12;
const PN_COVER_TTL = 6 * 60 * 60 * 1000;

function pnPinImage(pin) {
  const images = pin?.media?.images || pin?.media?.items?.[0]?.images || {};
  const candidate = images['600x']?.url || images['400x300']?.url || images['237x']?.url ||
    Object.values(images).find((entry) => entry?.url)?.url || pin?.media?.cover_image_url;
  if (!candidate) return '';
  try {
    const parsed = new URL(candidate);
    /* Only Pinterest's own image host is echoed back, so a bad record cannot turn the
       preview into a request to somewhere the reader did not choose. */
    if (parsed.protocol !== 'https:') return '';
    const host = parsed.hostname.toLowerCase();
    if (host !== 'pinimg.com' && !host.endsWith('.pinimg.com')) return '';
    return parsed.href;
  } catch { return ''; }
}

async function pnBoardCovers(request, env, session, id) {
  const raw = String(new URL(request.url).searchParams.get('ids') || '');
  const wanted = [...new Set(raw.split(',').map((value) => value.trim()).filter((value) => /^\d{1,20}$/.test(value)))].slice(0, PN_COVER_LIMIT);
  if (!wanted.length) return { covers: {}, missing: [] };

  const cached = session.pinCovers && Date.now() - Number(session.pinCovers.at || 0) < PN_COVER_TTL ? session.pinCovers.map || {} : {};
  const covers = {};
  const missing = [];
  for (const boardId of wanted) {
    if (cached[boardId]) { covers[boardId] = cached[boardId]; continue; }
    missing.push(boardId);
  }
  if (missing.length) {
    /* Sequential rather than parallel: the limit here exists to be gentle with Pinterest,
       and six covers arriving a second apart looks the same as six arriving together. */
    for (const boardId of missing) {
      const response = await fetch('https://api.pinterest.com/v5/boards/' + boardId + '/pins?page_size=1', {
        headers: { Authorization: 'Bearer ' + session.access_token }
      });
      if (!response.ok) continue;
      const data = await response.json().catch(() => ({}));
      const image = pnPinImage((data.items || [])[0]);
      if (image) { covers[boardId] = image; cached[boardId] = image; }
    }
    session.pinCovers = { at: Date.now(), map: cached };
    await env.OAUTH_SESSIONS.put('pn:session:' + id, JSON.stringify(session));
  }
  return { covers, missing: missing.filter((boardId) => !covers[boardId]) };
}
async function pnRoute(request, env) {
  const url = new URL(request.url), path = url.pathname;
  if (request.method === 'OPTIONS') return corsPreflight(request, env);
  const missing = ['PINTEREST_APP_ID', 'PINTEREST_APP_SECRET', 'OAUTH_SESSIONS'].filter(k => !env[k]);
  if (path === '/pinterest/health') return json({ ok: !missing.length, missing, callback: pnCallback(request), version: 'pinterest-2' }, missing.length ? 503 : 200, request, env);
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
    const destination = new URL(studioUrl(env, 'boards'));
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
  const covers = path === '/pinterest/board-covers';
  if (request.method !== 'GET' || (!match && !covers && !['/pinterest/profile', '/pinterest/boards'].includes(path))) pnFail('Not found.', 404);
  if (session.expiresAt < Date.now() + 60000) {
    if (!session.refresh_token) pnFail('Pinterest session expired. Please reconnect.', 401);
    const fresh = await pnToken(env, { grant_type: 'refresh_token', refresh_token: session.refresh_token });
    if (!fresh.refresh_token) fresh.refresh_token = session.refresh_token;
    session = await pnSave(env, id, fresh, session);
  }
  if (covers) return json(await pnBoardCovers(request, env, session, id), 200, request, env);
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

/* ---------------------------------------------------------------------------
 * Account media (wallpapers) on R2.
 *
 * Set an R2 bucket binding named WALLPAPER_BUCKET on this Worker, pointing at the
 * existing bucket: wallpaper-bucket (account 284c464d6001dfdc30197132be75a680).
 * The S3 endpoint is for the dashboard and the AWS CLI only; the Worker reads R2
 * through this binding, so no access keys are ever needed in the browser.
 *
 * Members upload with their Firebase ID token; the Worker verifies the token with
 * Google, then stores the bytes under the caller's own uid. Firestore keeps the
 * review state, so a file held for moderation is never linked from a profile and its
 * key is a random 128-bit name that cannot be guessed.
 *
 *   GET    /media/health
 *   POST   /media/wallpaper?kind=image|video&state=pending|approved
 *   GET    /media/wallpaper/<uid>/<file>
 *   DELETE /media/wallpaper/<uid>/<file>
 *   POST   /media/profile-photo
 *   GET    /media/profile-photo/<uid>/<file>
 *   DELETE /media/profile-photo/<uid>/<file>
 */
const MEDIA_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MEDIA_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const MEDIA_EXTENSIONS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov' };
const MEDIA_MAX_IMAGE = 30 * 1024 * 1024;
const MEDIA_MAX_VIDEO = 120 * 1024 * 1024;
/* A profile picture is shown in a 34-106px circle, so it needs a far smaller ceiling than
   a wallpaper and is never a video. */
const MEDIA_MAX_PHOTO = 8 * 1024 * 1024;
const MEDIA_FOLDERS = { wallpaper: 'wallpapers', 'profile-photo': 'profile-photos', 'feed-image': 'feed-images' };

function mediaFail(message, status = 400) { const error = new Error(message); error.publicMessage = message; error.status = status; throw error; }

function mediaBucket(env) {
  const bucket = env.WALLPAPER_BUCKET || env.MEDIA_BUCKET || env.R2_BUCKET;
  if (!bucket) mediaFail('Media storage is not configured on this Worker yet.', 503);
  return bucket;
}

function mediaBucketReady(env) { return !!(env.WALLPAPER_BUCKET || env.MEDIA_BUCKET || env.R2_BUCKET); }

/* Verify Firebase ID tokens against Firebase Auth itself. The generic Google
 * OAuth tokeninfo endpoint is not the right verifier for Firebase Auth ID tokens. */
async function mediaUser(request, env) {
  const header = request.headers.get('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) mediaFail('Sign in to use account media.', 401);
  const apiKey = String(env.FIREBASE_API_KEY || 'AIzaSyAPUT8_pLNxdh5tbGpAmXBJiID3jVcA9DY').trim();
  const response = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + encodeURIComponent(apiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: token })
  });
  if (!response.ok) mediaFail('Your session expired. Sign in again to use account media.', 401);
  const payload = await response.json().catch(() => ({}));
  const info = Array.isArray(payload.users) ? payload.users[0] : null;
  const projectId = String(env.FIREBASE_PROJECT_ID || 'biglwa').trim();
  if (!info || !String(info.localId || '').trim()) mediaFail('That sign-in is not from this account system.', 403);
  if (projectId !== 'biglwa') mediaFail('That sign-in is not from this account system.', 403);
  const uid = String(info.localId || '').trim();
  if (info.disabled === true) mediaFail('That account cannot store media.', 403);
  if (info.emailVerified === false) mediaFail('Verify your email before saving account media.', 403);
  return { uid, email: String(info.email || '') };
}

function mediaSegment(pathname) {
  const match = /^\/media\/(wallpaper|profile-photo|feed-image)(?:\/|$)/.exec(pathname);
  return match ? match[1] : '';
}

function mediaKeyParts(pathname) {
  const segment = mediaSegment(pathname);
  if (!segment) mediaFail('Media not found.', 404);
  const parts = pathname.replace(/^\/media\/[^/]+\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  if (parts.length !== 2 || !parts[0] || !parts[1]) mediaFail('Media not found.', 404);
  if (!/^[A-Za-z0-9_-]{8,128}$/.test(parts[0]) || !/^[A-Za-z0-9._-]{1,120}$/.test(parts[1])) mediaFail('Media not found.', 404);
  return { uid: parts[0], name: parts[1], key: MEDIA_FOLDERS[segment] + '/' + parts[0] + '/' + parts[1] };
}

async function mediaLinkPreview(request, env) {
  requireOrigin(request, env);
  await mediaUser(request, env);
  const body = await request.json().catch(() => ({}));
  const raw = String(body.url || '').trim();
  let target;
  try { target = new URL(raw); } catch { mediaFail('Use a full http:// or https:// link.'); }
  if (!['http:', 'https:'].includes(target.protocol) || target.username || target.password) mediaFail('That link cannot be previewed.');
  const host = target.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || /^(127\\.|10\\.|192\\.168\\.|169\\.254\\.)/.test(host) || host === '::1' || host === '0.0.0.0') mediaFail('That link cannot be previewed.');
  const response = await fetch(target.toString(), { headers: { 'User-Agent': 'BIGLWA-Link-Preview/1.0' }, redirect: 'follow' });
  if (!response.ok) mediaFail('The linked page could not be previewed.', 502);
  const contentType = String(response.headers.get('content-type') || '').toLowerCase();
  if (!contentType.includes('text/html')) return json({ url: target.toString(), title: '', imageUrl: '', siteName: target.hostname }, 200, request, env);
  const html = (await response.text()).slice(0, 1000000);
  const meta = (name) => {
    const safe = name.replace(/[.*+?^$\\{\\}()|[\\]\\\\]/g, '\\\\async function mediaRoute(request, env) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return corsPreflight(request, env);
');
    const re1 = new RegExp('<meta[^>]+(?:property|name)=[\\\"\\\']' + safe + '[\\\"\\\'][^>]+content=[\\\"\\\']([^\\\"\\\']+)', 'i');
    const re2 = new RegExp('<meta[^>]+content=[\\\"\\\']([^\\\"\\\']+)[\\\"\\\'][^>]+(?:property|name)=[\\\"\\\']' + safe + '[\\\"\\\']', 'i');
    const match = html.match(re1) || html.match(re2);
    return match ? match[1].trim() : '';
  };
  const decode = (value) => value.replace(/&amp;/g, '&').replace(/&quot;/g, '\\"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  const image = decode(meta('og:image') || meta('twitter:image'));
  const title = decode(meta('og:title') || meta('twitter:title')) || target.hostname;
  return json({ url: target.toString(), title: title.slice(0, 240), imageUrl: image.slice(0, 2000), siteName: target.hostname }, 200, request, env);
}

async function mediaRoute(request, env) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return corsPreflight(request, env);
  if (url.pathname === '/media/link-preview' && request.method === 'POST') return mediaLinkPreview(request, env);
  const segment = mediaSegment(url.pathname);
  /* Lets the site confirm the binding is wired without signing anyone in. */
  if (url.pathname === '/media/health' && request.method === 'GET') {
    return json({
      ok: true,
      service: 'BIGLWA account media',
      bucket: 'wallpaper-bucket',
      configured: mediaBucketReady(env),
      /* Instagram rejects the connection when this does not match the app dashboard
         character for character, and that error surfaces only after the member has
         already clicked connect, so report the exact expected value here. */
      instagramRedirectUri: safeRedirectUri(env),
      methods: [
        'POST /media/wallpaper', 'GET /media/wallpaper/<uid>/<file>', 'DELETE /media/wallpaper/<uid>/<file>',
        'POST /media/profile-photo', 'GET /media/profile-photo/<uid>/<file>', 'DELETE /media/profile-photo/<uid>/<file>',
        'POST /media/feed-image', 'GET /media/feed-image/<uid>/<file>', 'DELETE /media/feed-image/<uid>/<file>'
      ]
    }, 200, request, env);
  }
  if (request.method === 'POST' && url.pathname.replace(/\/$/, '') === '/media/' + segment) {
    return mediaUpload(request, env, url, segment);
  }
  if (request.method === 'GET' && segment) return mediaServe(request, env, mediaKeyParts(url.pathname), segment);
  if (request.method === 'DELETE' && segment) return mediaDelete(request, env, mediaKeyParts(url.pathname));
  return json({ error: 'Not found' }, 404, request, env);
}

async function mediaUpload(request, env, url, segment = 'wallpaper') {
  const user = await mediaUser(request, env);
  const bucket = mediaBucket(env);
  const contentType = String(request.headers.get('Content-Type') || '').split(';')[0].trim().toLowerCase();
  /* The wallpaper is the only media that can be video and the only kind that waits for review. */
  const photo = segment !== 'wallpaper';
  const kind = !photo && url.searchParams.get('kind') === 'video' ? 'video' : 'image';
  const allowed = kind === 'video' ? MEDIA_VIDEO_TYPES : MEDIA_IMAGE_TYPES;
  if (!allowed.includes(contentType)) mediaFail('Choose a JPG, PNG, WebP, GIF, MP4, WebM, or MOV file.');
  const declared = Number(request.headers.get('Content-Length') || 0);
  const limit = photo ? MEDIA_MAX_PHOTO : kind === 'video' ? MEDIA_MAX_VIDEO : MEDIA_MAX_IMAGE;
  if (declared && declared > limit) mediaFail('That file is larger than the ' + Math.round(limit / 1024 / 1024) + ' MB limit for ' + (photo ? (segment === 'feed-image' ? 'feed images' : 'profile photos') : kind + 's') + '.', 413);
  const state = photo ? 'approved' : url.searchParams.get('state') === 'approved' ? 'approved' : 'pending';
  const body = await request.arrayBuffer();
  if (!body.byteLength) mediaFail('That file was empty.', 400);
  if (body.byteLength > limit) mediaFail('That file is larger than the ' + Math.round(limit / 1024 / 1024) + ' MB limit for ' + (photo ? (segment === 'feed-image' ? 'feed images' : 'profile photos') : kind + 's') + '.', 413);
  const createdAt = Date.now();
  const name = createdAt + '-' + randomToken(16) + '.' + MEDIA_EXTENSIONS[contentType];
  const key = MEDIA_FOLDERS[segment] + '/' + user.uid + '/' + name;
  await bucket.put(key, body, {
    httpMetadata: { contentType, cacheControl: (photo ? 'public, ' : 'private, ') + 'max-age=31536000, immutable' },
    customMetadata: { uid: user.uid, kind, state, name: String(url.searchParams.get('name') || '').slice(0, 120), createdAt: String(createdAt) }
  });
  return json({
    ok: true,
    key: user.uid + '/' + name,
    kind, state, contentType, size: body.byteLength, createdAt,
    url: url.origin + '/media/' + segment + '/' + user.uid + '/' + name
  }, 200, request, env);
}

async function mediaServe(request, env, { key }, segment) {
  const bucket = mediaBucket(env);
  const object = await bucket.get(key);
  if (!object) return json({ error: 'Media not found' }, 404, request, env);
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  /* A feed image belongs to a public post, so a shared cache is welcome to keep it. A
     wallpaper and a profile photo are read through a signed-in session instead, and are
     left out of shared caches. The key holds a random token either way, so a cached copy
     cannot be guessed at. */
  headers.set('Cache-Control', (segment === 'feed-image' ? 'public, ' : 'private, ') + 'max-age=31536000, immutable');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('ETag', object.httpEtag);
  const range = request.headers.get('Range');
  if (range && /^bytes=/.test(range) && typeof object.range === 'function') {
    const parsed = object.range(range);
    if (parsed) {
      headers.set('Content-Range', parsed.range);
      headers.set('Content-Length', String(object.size));
      return new Response(parsed.body, { status: 206, headers });
    }
  }
  headers.set('Content-Length', String(object.size));
  return new Response(object.body, { status: 200, headers });
}

async function mediaDelete(request, env, { uid, key }) {
  const user = await mediaUser(request, env);
  if (user.uid !== uid) mediaFail('You can only remove your own media.', 403);
  const bucket = mediaBucket(env);
  await bucket.delete(key);
  return json({ ok: true, key }, 200, request, env);
}
