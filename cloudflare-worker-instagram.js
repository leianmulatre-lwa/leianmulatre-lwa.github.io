const INSTAGRAM_AUTHORIZE_URL = 'https://www.instagram.com/oauth/authorize';
const INSTAGRAM_TOKEN_URL = 'https://api.instagram.com/oauth/access_token';
const INSTAGRAM_GRAPH_URL = 'https://graph.instagram.com';
const OAUTH_SCOPES = 'instagram_business_basic,instagram_business_manage_messages';
const SESSION_TTL = 60 * 60 * 24 * 60; // align storage with valid long-lived Instagram access tokens
const FIREBASE_WEB_API_KEY = 'AIzaSyAPUT8_pLNxdh5tbGpAmXBJiID3jVcA9DY';

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
  if (url.pathname === '/session/account' && request.method === 'GET') return accountSession(request, env);
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
  target.pathname = '/studio';
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
  // Do not force the user to log in to Instagram on every Orbit reconnection.
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
  const session = { accessToken, userId, longLived, createdAt: Date.now(), expiresAt: Date.now() + expiresIn * 1000 };
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
  const firebaseUid = await firebaseUidFromToken(String(body.firebaseIdToken || ''), env);
  const key = 'handoff:' + handoff;
  const sessionId = await env.OAUTH_SESSIONS.get(key);
  await env.OAUTH_SESSIONS.delete(key);
  if (!sessionId) return json({ error: 'Instagram handoff expired. Please reconnect.' }, 401, request, env);
  if (firebaseUid) {
    const current = await env.OAUTH_SESSIONS.get('session:' + sessionId, 'json');
    if (current) {
      current.firebaseUid = firebaseUid;
      await env.OAUTH_SESSIONS.put('session:' + sessionId, JSON.stringify(current), { expirationTtl: Math.min(Math.max(1, Math.ceil((current.expiresAt - Date.now()) / 1000)), SESSION_TTL) });
      await env.OAUTH_SESSIONS.put('firebase:' + firebaseUid, sessionId, { expirationTtl: Math.min(Math.max(1, Math.ceil((current.expiresAt - Date.now()) / 1000)), SESSION_TTL) });
    }
  }
  return json({ session: sessionId, persisted: !!firebaseUid }, 200, request, env);
}

async function firebaseUidFromToken(idToken, env) {
  if (!idToken) return '';
  try {
    const response = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + encodeURIComponent(FIREBASE_WEB_API_KEY), {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken })
    });
    const body = await response.json().catch(() => ({}));
    const user = body.users && body.users[0];
    return user && user.localId ? String(user.localId) : '';
  } catch (_) { return ''; }
}

// Keep Instagram's *provider* session alive where Meta permits it. This is
// wholly separate from Firebase and does not create, change or end Big LWA auth.
// Long-lived Instagram Login tokens become refreshable after 24h, while still
// valid. An inaccessible Meta endpoint leaves the existing grant untouched.
async function refreshInstagramSession(env, id, current) {
  if (!current || !current.accessToken || current.expiresAt <= Date.now()) return current;
  const now=Date.now();
  const fourteenDays=14 * 24 * 60 * 60 * 1000;
  const oneDay=24 * 60 * 60 * 1000;
  if(!(current.longLived || (current.longLived == null && current.expiresAt-Number(current.createdAt||now)>2*oneDay)) || current.expiresAt-now>fourteenDays ||
      now-Number(current.lastRefreshAt||current.createdAt||now)<oneDay) return current;
  try{
    const url=new URL(INSTAGRAM_GRAPH_URL+'/refresh_access_token');
    url.searchParams.set('grant_type','ig_refresh_token');
    url.searchParams.set('access_token',current.accessToken);
    const response=await fetch(url.toString());
    const payload=await response.json().catch(()=>({}));
    if(!response.ok||!payload.access_token||Number(payload.expires_in)<=0)
      return current;
    const next={...current,accessToken:payload.access_token,
      expiresAt:now+Number(payload.expires_in)*1000,lastRefreshAt:now,longLived:true};
    const seconds=Math.min(SESSION_TTL,Math.max(60,Math.ceil((next.expiresAt-now)/1000)));
    await env.OAUTH_SESSIONS.put('session:'+id,JSON.stringify(next),{expirationTtl:seconds});
    if(next.firebaseUid)await env.OAUTH_SESSIONS.put('firebase:'+next.firebaseUid,id,{expirationTtl:seconds});
    if(next.userId)await env.OAUTH_SESSIONS.put('user:'+next.userId,id,{expirationTtl:seconds});
    return next;
  }catch(error){
    console.warn('Instagram token refresh temporarily unavailable:',error);
    return current;
  }
}

async function accountSession(request, env) {
  requireOrigin(request, env);
  const header = request.headers.get('Authorization') || '';
  const idToken = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  const uid = await firebaseUidFromToken(idToken, env);
  if (!uid) return json({ error: 'Firebase account session required.' }, 401, request, env);
  const sessionId = await env.OAUTH_SESSIONS.get('firebase:' + uid);
  if (!sessionId) return json({ connected: false }, 200, request, env);
  const session = await env.OAUTH_SESSIONS.get('session:' + sessionId, 'json');
  if (!session || session.expiresAt < Date.now()) {
    return json({ connected: false, needsReconnect: true }, 200, request, env);
  }
  // A provider refresh never invalidates the logged-in Firebase identity.
  await refreshInstagramSession(env,sessionId,session);
  return json({ connected: true, session: sessionId }, 200, request, env);
}

async function sessionFromRequest(request, env) {
  const header = request.headers.get('Authorization') || '';
  const sessionId = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!sessionId) return null;
  const session = await env.OAUTH_SESSIONS.get('session:' + sessionId, 'json');
  if (!session || session.expiresAt < Date.now()) return null;
  const refreshed=await refreshInstagramSession(env,sessionId,session);
  return { id: sessionId, ...refreshed };
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
  const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,children{media_type,media_url,thumbnail_url}';
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
    if (session.firebaseUid) await env.OAUTH_SESSIONS.delete('firebase:' + session.firebaseUid);
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
  // Both official first-party domains are legitimate; the OAuth callback
  // returns to the same one that held the browser's PKCE verifier.
  const trusted = new Set([siteOrigin, 'https://biglwa.com', 'https://www.biglwa.com']);
  return trusted.has(origin) ? origin : '';
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
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Instagram-Session, X-Pinterest-Session, X-Orbit-Provider',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
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
    if (new URL(request.url).pathname.startsWith('/facebook-personal/')) {
      const config={...env,SITE_URL:env.SITE_URL||'https://biglwa.com'};
      try{return await facebookPersonalRoute(request,config)}
      catch(error){return json({error:'Facebook authorization could not be completed.'},502,request,config)}
    }
    if (/^\/(?:x|tumblr|snapchat)\//.test(new URL(request.url).pathname)) {
      const config={...env,SITE_URL:env.SITE_URL||'https://biglwa.com'};
      return handleAdditionalOrbit(request,config,mediaUser);
    }
    if (new URL(request.url).pathname.startsWith('/sqwip/')) {
      const config = { ...env, SITE_URL: env.SITE_URL || 'https://biglwa.com' };
      try { return await sqwipRoute(request, config); }
      catch (error) { return json({ error: error.publicMessage || 'Sqwip script storage is unavailable.' }, error.status || 500, request, config); }
    }
    if (new URL(request.url).pathname.startsWith('/stream/')) {
      const config = { ...env, SITE_URL: env.SITE_URL || 'https://biglwa.com' };
      try { return await streamRoute(request, config); }
      catch (error) { return json({ error: error.publicMessage || 'Stream service is unavailable. Please try again.' }, error.status || 500, request, config); }
    }
    if (new URL(request.url).pathname.startsWith('/media/')) {
      const config = { ...env, SITE_URL: env.SITE_URL || 'https://biglwa.com' };
      try { return await mediaRoute(request, config); }
      catch (error) { return json({ error: error.publicMessage || 'Media service error. Please try again.' }, error.status || 500, request, config); }
    }
    if (new URL(request.url).pathname === '/pinterest/saved') {
      const config={...env,SITE_URL:env.SITE_URL||'https://biglwa.com'};
      try{return await pnSavedRoute(request,config);}
      catch(error){return json({error:error.publicMessage||'Could not update saved collections.'},error.status||502,request,config);}
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
function ttReturnUrl(raw, env) {
  // Keep browser PKCE verifier on the same trusted host that launched OAuth.
  const fallback=studioUrl(env,'orbit');
  try{
    if(!raw)return fallback;
    const page=new URL(raw);
    if(page.protocol!=='https:' || !['biglwa.com','www.biglwa.com'].includes(page.hostname) || page.port) return fallback;
    if(!['/','/studio','/studio/'].includes(page.pathname))return fallback;
    page.hash='';page.pathname='/studio';page.search='?view=orbit';
    return page.href;
  }catch{return fallback;}
}
function ttCookie(request) { return (request.headers.get('Cookie') || '').split(';').map(s => s.trim()).find(s => s.startsWith('__Host-tt_oauth='))?.slice(16) || ''; }
function ttRedirect(location, cookie) { return new Response(null, { status: 302, headers: { Location: location, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'Set-Cookie': '__Host-tt_oauth=' + cookie + '; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=' + (cookie ? 600 : 0) } }); }
async function ttToken(env, params) {
  // TikTok Login Kit Web requires application/x-www-form-urlencoded.
  // Keep values and keys explicit; secrets are never logged or reflected.
  const body = new URLSearchParams();
  body.set('client_key', String(env.TIKTOK_CLIENT_KEY||'').trim());
  body.set('client_secret', String(env.TIKTOK_CLIENT_SECRET||'').trim());
  body.set('grant_type', String(params.grant_type||''));
  if (params.grant_type === 'authorization_code') {
    if (!params.code || !params.redirect_uri) ttFail('TikTok authorization data is incomplete. Restart from Orbit.', 400);
    body.set('code', String(params.code));
    body.set('redirect_uri', String(params.redirect_uri));
  } else if (params.grant_type === 'refresh_token') {
    if (!params.refresh_token) ttFail('TikTok refresh authorization is missing. Reconnect from Orbit.', 401);
    body.set('refresh_token', String(params.refresh_token));
  } else ttFail('Unsupported TikTok token grant.', 400);
  const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method:'POST',
    headers:{'Content-Type':'application/x-www-form-urlencoded',Accept:'application/json'},
    body
  });
  const token = await response.json().catch(() => ({}));
  if (!response.ok || !token.access_token) {
    /* TikTok names the reason precisely: an invalid client_key/secret, a redirect URI
       that is not the one registered, or a scope the app has not been granted all look
       identical from the outside. Guessing a single cause sent people to the wrong
       setting, so report what TikTok actually said. */
    const code = token.error_code ?? (token.error && typeof token.error === 'object' ? token.error.code : token.error);
    const detail = token.error_description || (token.error && typeof token.error === 'object' ? token.error.message : '');
    const reason = detail || (code ? 'TikTok reported ' + code : 'TikTok returned HTTP ' + response.status + '.');
    // TikTok's log_id lets support identify the failed exchange without
    // disclosing the one-time authorization code or client secret.
    const logId = /^[A-Za-z0-9_-]{8,100}$/.test(String(token.log_id||'')) ? String(token.log_id) : '';
    ttFail('TikTok rejected this connection — ' + reason + (code ? ' (code ' + code + ')' : '') + (logId ? ' · TikTok log ID: '+logId : ''), 502);
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
  if (path === '/tiktok/health') return json({ ok: !missing.length, missing, callback: ttCallback(request), version: 'tiktok-2', basicProfileOnly:env.TIKTOK_VIDEO_LIST_APPROVED!=='true' }, missing.length ? 503 : 200, request, env);
  if (missing.length) ttFail('Add these Cloudflare Worker settings: ' + missing.join(', '), 503);
  if (path === '/tiktok/start' && request.method === 'GET') {
    const challenge = url.searchParams.get('challenge') || '';
    if (!/^[A-Za-z0-9_-]{43}$/.test(challenge)) ttFail('Start TikTok connection from Orbit.', 400);
    const state = randomToken(32), browser = randomToken(32);
    const returnTo=ttReturnUrl(url.searchParams.get('return_to'),env);
    await env.OAUTH_SESSIONS.put('tt:state:' + state, JSON.stringify({ browser, challenge, callback: ttCallback(request), returnTo }), { expirationTtl: 600 });
    const dest = new URL('https://www.tiktok.com/v2/auth/authorize/');
    dest.search = new URLSearchParams({ client_key: env.TIKTOK_CLIENT_KEY, response_type: 'code', scope: env.TIKTOK_VIDEO_LIST_APPROVED==='true'?'user.info.basic,video.list':'user.info.basic', redirect_uri: ttCallback(request), state }).toString();
    return ttRedirect(dest.href, browser);
  }
  if (path === '/tiktok/callback' && request.method === 'GET') {
    const state = url.searchParams.get('state') || '';
    if (!state) return json({ ok: true, message: 'TikTok callback is installed. Start the connection from Orbit.', start: new URL('/tiktok/start', request.url).href }, 200, request, env);
    const saved = await env.OAUTH_SESSIONS.get('tt:state:' + state, 'json');
    if (!saved || !ttCookie(request) || saved.browser !== ttCookie(request)) ttFail('TikTok login expired or was opened in another browser. Start again from Orbit.', 400);
    await env.OAUTH_SESSIONS.delete('tt:state:' + state);
    const destination = new URL(ttReturnUrl(saved.returnTo,env));
    if (url.searchParams.has('error') || !url.searchParams.get('code')) {
      const providerError=(url.searchParams.get('error_description')||url.searchParams.get('error')||'').slice(0,180);
      destination.searchParams.set('tiktok_error', providerError?'TikTok authorization failed: '+providerError:'TikTok authorization was cancelled or denied. Please try again.');
      return ttRedirect(destination.href, '');
    }
    let token;
    try {
      token = await ttToken(env, { grant_type: 'authorization_code', code: url.searchParams.get('code'), redirect_uri: saved.callback });
    } catch (error) {
      // Do not strand people on a JSON response at the secret-bearing callback URL.
      // A failed code cannot be reused; return to Orbit to start a fresh attempt.
      destination.searchParams.set('tiktok_error', (error.publicMessage || 'TikTok authorization could not be completed.').slice(0,450));
      return ttRedirect(destination.href, '');
    }
    const id = randomToken(32), handoff = randomToken(32);
    await ttSave(env, id, token);
    await env.OAUTH_SESSIONS.put('tt:handoff:' + handoff, JSON.stringify({ id, challenge: saved.challenge }), { expirationTtl: 600 });
    destination.searchParams.set('tiktok_handoff', handoff);
    return ttRedirect(destination.href, '');
  }
  if (!allowedOrigin(request, env)) ttFail('Origin not allowed.', 403);
  if (path === '/tiktok/session/account' && request.method === 'GET') {
    const header=request.headers.get('Authorization')||'';
    const uid=await firebaseUidFromToken(header.startsWith('Bearer ')?header.slice(7).trim():'',env);
    if(!uid)return json({error:'Sign in to Big LWA first.'},401,request,env);
    const id=await env.OAUTH_SESSIONS.get('tt:firebase:'+uid);
    const session=id?await env.OAUTH_SESSIONS.get('tt:session:'+id,'json'):null;
    // An expired access token remains recoverable if its refresh grant is valid.
    // The profile route refreshes the access token after account restoration.
    return json(session&&(session.expiresAt>Date.now()||!!session.refresh_token)
      ?{connected:true,session:id}:{connected:false},200,request,env);
  }
  if (path === '/tiktok/session' && request.method === 'POST') {
    const body = await request.json();
    const handoff = String(body.handoff || '');
    if (!/^[A-Za-z0-9_-]{43}$/.test(handoff)) ttFail('Invalid TikTok handoff.', 400);
    const key = 'tt:handoff:' + handoff, saved = await env.OAUTH_SESSIONS.get(key, 'json');
    if (!saved) ttFail('TikTok connection expired. Please reconnect.', 401);
    const challenge = bytesToBase64Url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(body.verifier || '')))));
    if (challenge !== saved.challenge) ttFail('Reconnect TikTok from the same browser tab.', 401);
    const firebaseUid = await firebaseUidFromToken(String(body.firebaseIdToken || ''), env);
    if(!firebaseUid)ttFail('Sign in to Big LWA to finish connecting TikTok.',401);
    const entry=await env.OAUTH_SESSIONS.get('tt:session:'+saved.id,'json');
    if(!entry)ttFail('TikTok authorization expired. Please reconnect.',401);
    const previousId=await env.OAUTH_SESSIONS.get('tt:firebase:'+firebaseUid);
    await env.OAUTH_SESSIONS.put('tt:session:'+saved.id,JSON.stringify({...entry,firebaseUid}),{expirationTtl:Math.max(60,Math.min(Number(entry.refresh_expires_in||86400),31536000))});
    await env.OAUTH_SESSIONS.put('tt:firebase:'+firebaseUid,saved.id,{expirationTtl:Math.max(60,Math.min(Number(entry.refresh_expires_in||86400),31536000))});
    if(previousId&&previousId!==saved.id){
      const prior=await env.OAUTH_SESSIONS.get('tt:session:'+previousId,'json');
      if(prior?.firebaseUid===firebaseUid)await env.OAUTH_SESSIONS.delete('tt:session:'+previousId);
    }
    await env.OAUTH_SESSIONS.delete(key);
    return json({ session: saved.id, persisted: true }, 200, request, env);
  }
  const id = (request.headers.get('Authorization') || '').replace(/^Bearer /, '');
  let session = /^[A-Za-z0-9_-]{43}$/.test(id) ? await env.OAUTH_SESSIONS.get('tt:session:' + id, 'json') : null;
  if (!session) ttFail('TikTok session expired. Please reconnect.', 401);
  if (path === '/tiktok/disconnect' && request.method === 'POST') {
    if(session.firebaseUid)await env.OAUTH_SESSIONS.delete('tt:firebase:'+session.firebaseUid);
    await env.OAUTH_SESSIONS.delete('tt:session:' + id);
    return json({ ok: true }, 200, request, env);
  }
  if (request.method !== 'GET' || !['/tiktok/profile', '/tiktok/videos'].includes(path)) ttFail('Not found.', 404);
  if (session.expiresAt < Date.now() + 60000) {
    if (!session.refresh_token) ttFail('TikTok session expired. Please reconnect.', 401);
    const previous=session;
    session = await ttSave(env, id, await ttToken(env, { grant_type: 'refresh_token', refresh_token: session.refresh_token }));
    if(previous.firebaseUid){
      session.firebaseUid=previous.firebaseUid;
      await env.OAUTH_SESSIONS.put('tt:session:'+id,JSON.stringify(session),{expirationTtl:Math.max(60,Math.min(Number(session.refresh_expires_in||86400),31536000))});
    }
  }
  const videos = path === '/tiktok/videos';
  if(videos&&!String(session.scope||'').split(',').includes('video.list'))return json({videos:[],videoPermissionPending:true},200,request,env);
  const endpoint = videos ? 'video/list/?fields=id,title,video_description,cover_image_url,share_url,embed_link' : 'user/info/?fields=open_id,display_name,avatar_url';
  const response = await fetch('https://open.tiktokapis.com/v2/' + endpoint, {
    method: videos ? 'POST' : 'GET',
    headers: { Authorization: 'Bearer ' + session.access_token, 'Content-Type': 'application/json' },
    ...(videos ? { body: JSON.stringify({ max_count: 20 }) } : {})
  });
  const body = await response.json();
  if (!response.ok || (body.error && body.error.code !== 'ok')) ttFail('TikTok could not return ' + (videos ? 'videos. Check video.list access for this app.' : 'your profile. Check user.info.basic access for this app.'), 502);
  return json(videos ? { videos: body.data?.videos || [] } : (body.data?.user || {}), 200, request, env);
}


/* ── Big LWA Stream editorial system ──────────────────────────────────────────
   Original video stays hosted on YouTube; R2 keeps private review requests.
   No request becomes public programming until a verified moderator approves it.
   Audio/radio stations are discoverable external links, not rebroadcast here. */
const STREAM_REQUEST_PREFIX = 'stream/requests/';
const STREAM_APPROVED_PREFIX = 'stream/approved/';
const STREAM_CATEGORIES = ['podcast','lwa-tv','live'];
function streamFail(message, status=400) {
  const error=new Error(message);error.publicMessage=message;error.status=status;throw error;
}
function streamTrim(value,limit=160) { return String(value==null?'':value).trim().slice(0,limit); }
function streamVideoId(value) {
  let url;
  try { url=new URL(String(value||'')); } catch { return ''; }
  if(url.protocol!=='https:')return '';
  const host=url.hostname.toLowerCase();
  let id='';
  if(host==='youtu.be') id=url.pathname.split('/')[1]||'';
  else if(['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com'].includes(host)) {
    if(url.pathname==='/watch')id=url.searchParams.get('v')||'';
    else if(/^\/(shorts|live|embed)\/[^/]+/.test(url.pathname))id=url.pathname.split('/')[2]||'';
  }
  return /^[A-Za-z0-9_-]{11}$/.test(id)?id:'';
}
function streamOwnerKey(uid,id) {return STREAM_REQUEST_PREFIX+uid+'/'+id+'.json';}
async function streamObjects(bucket,prefix,max=100) {
  const list=await bucket.list({prefix,limit:Math.min(1000,max)});
  const files=(list.objects||[]).slice(0,max);
  const values=await Promise.all(files.map(async file=>{
    try {const obj=await bucket.get(file.key);return obj?await obj.json():null;}catch{return null;}
  }));
  return values.filter(Boolean);
}
async function streamEditor(request,user,env) {
  const header=request.headers.get('Authorization')||'';
  const token=header.startsWith('Bearer ')?header.slice(7).trim():'';
  // Reuse the existing Firestore moderationAdmins owner-lookup rule;
  // credentials never enter R2 or become publicly readable.
  const endpoint='https://firestore.googleapis.com/v1/projects/biglwa/databases/(default)/documents/moderationAdmins/'+encodeURIComponent(user.uid);
  const response=await fetch(endpoint,{headers:{Authorization:'Bearer '+token}});
  if(!response.ok)streamFail('Stream editorial access required.',403);
  const doc=await response.json().catch(()=>({}));
  if(doc.fields?.active?.booleanValue===false)streamFail('Stream editorial access required.',403);
  return true;
}
function streamPublic(item) {
  return {id:item.id,title:item.title,category:item.category,videoId:item.videoId,
    youtubeUrl:item.youtubeUrl,scheduledAt:item.scheduledAt,creditedCreator:item.creditedCreator||''};
}
async function streamRoute(request,env) {
  if(request.method==='OPTIONS')return corsPreflight(request,env);
  if(!allowedOrigin(request,env))streamFail('Origin not allowed.',403);
  const path=new URL(request.url).pathname;
  const bucket=mediaBucket(env);
  if(path==='/stream/health'&&request.method==='GET')
    return json({ok:true,service:'Big LWA Stream',requests:env.STREAM_REQUESTS_ENABLED==='true',scheduled:true},200,request,env);
  if(path==='/stream/programming'&&request.method==='GET') {
    const published=await streamObjects(bucket,STREAM_APPROVED_PREFIX,160);
    return json({items:published.filter(x=>x.status==='approved'&&x.videoId&&x.scheduledAt)
      .map(streamPublic).sort((a,b)=>String(a.scheduledAt).localeCompare(String(b.scheduledAt)))},200,request,env);
  }
  // Requests are a FUTURE feature. The API must reject POST even if an older
  // cached frontend or client attempts to use the old submission form.
  if(path==='/stream/requests'&&request.method==='POST'&&env.STREAM_REQUESTS_ENABLED!=='true')
    streamFail('Creator programming requests are coming in a future release.',403);
  if(!['/stream/requests','/stream/editorial'].includes(path))streamFail('Not found.',404);
  if(!['GET','POST'].includes(request.method))streamFail('Not found.',404);
  const user=await mediaUser(request,env);
  if(path==='/stream/requests'&&request.method==='GET') {
    const own=await streamObjects(bucket,STREAM_REQUEST_PREFIX+user.uid+'/',80);
    return json({items:own.sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))).slice(0,40)},200,request,env);
  }
  if(path==='/stream/requests'&&request.method==='POST') {
    if(Number(request.headers.get('Content-Length')||0)>12000)streamFail('Submission is too large.',413);
    const data=await request.json().catch(()=>({}));
    const title=streamTrim(data.title,110);
    const videoId=streamVideoId(data.youtubeUrl);
    const category=streamTrim(data.category,16);
    const note=streamTrim(data.note,550);
    const creditedCreator=streamTrim(data.creditedCreator,80);
    const timePreference=streamTrim(data.timePreference,100);
    const rights=streamTrim(data.rights,20);
    if(title.length<4||!videoId||!STREAM_CATEGORIES.includes(category))
      streamFail('Add a title, valid YouTube video link and programming category.');
    if(!['my-video','nomination'].includes(rights))
      streamFail('Please say whether you own the video or are nominating someone else.');
    const own=await streamObjects(bucket,STREAM_REQUEST_PREFIX+user.uid+'/',80);
    if(own.filter(x=>Date.now()-Date.parse(x.createdAt)<86400000).length>=5)
      streamFail('You can submit up to five programming requests per day.',429);
    const id=randomToken(12), now=new Date().toISOString();
    const entry={id,uid:user.uid,title,videoId,category,note,creditedCreator,timePreference,
      rights,status:'pending',youtubeUrl:'https://www.youtube.com/watch?v='+videoId,createdAt:now};
    await bucket.put(streamOwnerKey(user.uid,id),JSON.stringify(entry),{
      httpMetadata:{contentType:'application/json'},
      customMetadata:{kind:'stream-submission',status:'pending'}
    });
    return json({ok:true,id,status:'pending',message:'Sent for editorial review. No airtime is guaranteed.'},201,request,env);
  }
  await streamEditor(request,user,env);
  if(request.method==='GET') {
    const all=await streamObjects(bucket,STREAM_REQUEST_PREFIX,160);
    return json({items:all.sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)))},200,request,env);
  }
  const data=await request.json().catch(()=>({}));
  const uid=streamTrim(data.uid,128),id=streamTrim(data.id,64);
  const decision=streamTrim(data.decision,12);
  if(!/^[\w-]{4,128}$/.test(uid)||!/^[A-Za-z0-9_-]{12,64}$/.test(id)||!['approved','declined'].includes(decision))
    streamFail('Invalid review request.');
  const original=await bucket.get(streamOwnerKey(uid,id));
  if(!original)streamFail('Submission not found.',404);
  const entry=await original.json();
  if(entry.uid!==uid||entry.id!==id)streamFail('Submission mismatch.',409);
  const scheduledAt=decision==='approved'?new Date(String(data.scheduledAt||'')) : null;
  if(decision==='approved'&&(!Number.isFinite(scheduledAt?.valueOf())||scheduledAt.valueOf()<Date.now()-3600000||
    scheduledAt.valueOf()>Date.now()+366*86400000))
    streamFail('Choose a valid future programming date and time.');
  const updated={...entry,status:decision,scheduledAt:decision==='approved'?scheduledAt.toISOString():null,
    reviewedAt:new Date().toISOString(),reviewer:user.uid};
  await bucket.put(streamOwnerKey(uid,id),JSON.stringify(updated),{httpMetadata:{contentType:'application/json'}});
  const publishedKey=STREAM_APPROVED_PREFIX+id+'.json';
  if(decision==='approved'){
    await bucket.put(publishedKey,JSON.stringify(updated),{httpMetadata:{contentType:'application/json'}});
  } else await bucket.delete(publishedKey);
  return json({ok:true,id,status:decision},200,request,env);
}

function pnFail(message, status = 400) { const error = new Error(message); error.publicMessage = message; error.status = status; throw error; }
function pnCallback(request) { return new URL('/pinterest/callback', request.url).href; }
/* Keep the OAuth return on the very same first-party origin where the user
   started. PIN PKCE verifier lives in sessionStorage and does not cross from
   www.biglwa.com to biglwa.com. Never permit third-party redirect origins. */
function pnSafeReturnTo(value, env) {
  const fallback = studioUrl(env, 'orbit');
  if (!value) return fallback;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || !['biglwa.com', 'www.biglwa.com'].includes(url.hostname) || url.port) return fallback;
    if (!['/', '/studio', '/studio/boards'].includes(url.pathname)) return fallback;
    url.hash = '';
    url.pathname = '/studio';
    url.search = '?view=orbit';
    return url.href;
  } catch { return fallback; }
}

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
function pnSessionLifetime(session) {
  const until = Number(session?.refreshExpiresAt || session?.expiresAt || 0);
  if (!until) return 86400;
  return Math.max(60, Math.min(31536000, Math.ceil((until - Date.now()) / 1000)));
}
async function pnSave(env, id, token, previous) {
  const now = Date.now();
  const refreshExpiresAt = previous?.refreshExpiresAt || (now + Number(token.refresh_token_expires_in || token.expires_in || 86400) * 1000);
  const saved = {
    ...token,
    expiresAt: now + Number(token.expires_in || 86400) * 1000,
    refreshExpiresAt,
    ...(previous?.firebaseUid ? { firebaseUid: previous.firebaseUid } : {}),
    ...(previous?.pinCovers ? { pinCovers: previous.pinCovers } : {})
  };
  const ttl = pnSessionLifetime(saved);
  await env.OAUTH_SESSIONS.put('pn:session:' + id, JSON.stringify(saved), { expirationTtl: ttl });
  // Refreshing a Pinterest token must not discard the binding to its BIG LWA owner.
  if (saved.firebaseUid) await env.OAUTH_SESSIONS.put('pn:firebase:' + saved.firebaseUid, id, { expirationTtl: ttl });
  return saved;
}
async function pnBindSession(env, id, session, uid) {
  if (!uid) pnFail('Sign in to BIG LWA before connecting Pinterest.', 401);
  if (session.firebaseUid && session.firebaseUid !== uid) pnFail('This Pinterest connection belongs to a different BIG LWA account.', 403);
  // Only one active Pinterest authorization is associated with each BIG LWA user.
  // On reconnect, revoke the previous session so an older browser cannot revive it.
  const previousId = await env.OAUTH_SESSIONS.get('pn:firebase:' + uid);
  if (previousId && previousId !== id) {
    const previous = await env.OAUTH_SESSIONS.get('pn:session:' + previousId, 'json');
    if (previous?.firebaseUid === uid) await env.OAUTH_SESSIONS.delete('pn:session:' + previousId);
  }
  session.firebaseUid = uid;
  const ttl = pnSessionLifetime(session);
  await env.OAUTH_SESSIONS.put('pn:session:' + id, JSON.stringify(session), { expirationTtl: ttl });
  await env.OAUTH_SESSIONS.put('pn:firebase:' + uid, id, { expirationTtl: ttl });
  return { session: id, connected: true, persisted: true };
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
  if (!pin) return '';
  const images = pin?.media?.images || pin?.media?.items?.[0]?.images || pin?.images || {};
  const candidates = [
    images['600x'], images['400x300'], images['237x'], images.originals,
    images.original, ...Object.values(images),
    pin.image_url, pin.imageUrl, pin.image?.url, pin.media?.cover_image_url,
    pin.media?.image_url, pin.thumbnail_url, pin.media_url
  ];
  for (const item of candidates) {
    const raw = typeof item === 'string' ? item : item?.url || item?.src;
    try {
      const url = new URL(raw);
      const host = url.hostname.toLowerCase();
      if (url.protocol === 'https:' && (host === 'i.pinimg.com' || host.endsWith('.pinimg.com'))) {
        return url.href;
      }
    } catch { /* Ignore invalid candidates. */ }
  }
  return '';
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
      const response = await fetch('https://api.pinterest.com/v5/boards/' + boardId + '/pins?page_size=3', {
        headers: { Authorization: 'Bearer ' + session.access_token }
      });
      if (!response.ok) continue;
      const data = await response.json().catch(() => ({}));
      const images=(data.items||[]).slice(0,3).map(pnPinImage).filter(Boolean);
      if(images.length){
        const cover={url:images[0],images};
        covers[boardId]=cover;
        cached[boardId]=cover;
      }
    }
    session.pinCovers = { at: Date.now(), map: cached };
    await env.OAUTH_SESSIONS.put('pn:session:' + id, JSON.stringify(session), { expirationTtl: pnSessionLifetime(session) });
  }
  return { covers, missing: missing.filter((boardId) => !covers[boardId]) };
}
/* Big LWA user-owned collections are separate from Pinterest boards.
 * Current Pinterest OAuth grant is read-only. These collections are saved in
 * account-scoped R2, never sent to Pinterest without a future write grant. */
function pnSanitizeSavedLibrary(raw){
  const input=Array.isArray(raw?.boards)?raw.boards:[];
  if(input.length>40)pnFail('Maximum 40 saved collections.',413);
  const seen=new Set();let all=0;
  const boards=input.map(board=>{
    const id=String(board?.id||'').trim();
    const title=String(board?.title||'').trim().slice(0,100);
    if(!/^[a-zA-Z0-9_-]{3,80}$/.test(id)||!title||seen.has(id))pnFail('Invalid or duplicate saved collection.',400);
    seen.add(id);
    const rawPins=Array.isArray(board.pins)?board.pins:[];
    if(rawPins.length>400)pnFail('Maximum 400 Pins per collection.',413);
    const ids=new Set();const pins=[];
    for(const p of rawPins){
      const pinId=String(p?.id||'').trim();
      if(!/^\d{6,25}$/.test(pinId)||ids.has(pinId))continue;
      ids.add(pinId);
      const pinTitle=String(p.title||'Pinterest Pin').slice(0,300);
      const src=String(p.image||'');
      let image='';
      try{
        const parsed=new URL(src);
        if(parsed.protocol==='https:'&&(parsed.hostname==='i.pinimg.com'||parsed.hostname.endsWith('.pinimg.com')))image=parsed.href;
      }catch{}
      pins.push({id:pinId,title:pinTitle,image,url:'https://www.pinterest.com/pin/'+pinId+'/'});
    }
    all+=pins.length;
    return {id,title,pins};
  });
  if(all>1200)pnFail('Maximum 1,200 saved Pins across collections.',413);
  return {version:1,boards};
}
async function pnSavedRoute(request,env){
  if(request.method==='OPTIONS')return corsPreflight(request,env);
  if(!allowedOrigin(request,env))pnFail('Origin not allowed.',403);
  if(!['GET','POST'].includes(request.method))pnFail('Unsupported action.',405);
  const user=await mediaUser(request,env);
  const bucket=mediaBucket(env);
  const key='pinterest/saved/'+user.uid+'/library.json';
  if(request.method==='GET'){
    const stored=await bucket.get(key);
    const saved=stored?await stored.json().catch(()=>null):null;
    return json({ok:true,library:pnSanitizeSavedLibrary(saved)},200,request,env);
  }
  const length=Number(request.headers.get('Content-Length')||0);
  if(length>350000)pnFail('Saved collections exceed storage size.',413);
  const raw=await request.text();
  if(raw.length>350000)pnFail('Saved collections exceed storage size.',413);
  let data;try{data=JSON.parse(raw)}catch{pnFail('Invalid saved-collection data.',400)}
  const library=pnSanitizeSavedLibrary(data);
  await bucket.put(key,JSON.stringify(library),{
    httpMetadata:{contentType:'application/json; charset=utf-8',cacheControl:'private, no-store'},
    customMetadata:{uid:user.uid,kind:'biglwa-pinterest-saved'}
  });
  return json({ok:true,library},200,request,env);
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
    const returnTo = pnSafeReturnTo(url.searchParams.get('return_to'), env);
    await env.OAUTH_SESSIONS.put('pn:state:' + state, JSON.stringify({ browser, challenge, callback: pnCallback(request), returnTo }), { expirationTtl: 600 });
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
    const destination = new URL(pnSafeReturnTo(saved.returnTo, env));
    if (url.searchParams.has('error') || !url.searchParams.get('code')) {
      destination.searchParams.set('pinterest_error', 'Pinterest authorization was cancelled or denied. Please try again.');
      return pnRedirect(destination.href, '');
    }
    const token = await pnToken(env, { grant_type: 'authorization_code', code: url.searchParams.get('code'), redirect_uri: saved.callback });
    const id = randomToken(32), handoff = randomToken(32);
    await pnSave(env, id, token);
    await env.OAUTH_SESSIONS.put('pn:handoff:' + handoff, JSON.stringify({ id, challenge: saved.challenge }), { expirationTtl: 600 });
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
    const uid = await firebaseUidFromToken(String(body.firebaseIdToken || ''), env);
    if (!uid) pnFail('Sign in to BIG LWA to finish connecting Pinterest.', 401);
    const existing = await env.OAUTH_SESSIONS.get('pn:session:' + saved.id, 'json');
    if (!existing) pnFail('Pinterest connection expired. Please reconnect.', 401);
    const linked = await pnBindSession(env, saved.id, existing, uid);
    await env.OAUTH_SESSIONS.delete(key);
    return json(linked, 200, request, env);
  }
  // Recover an existing Pinterest connection from the verified BIG LWA account on any device.
  if (path === '/pinterest/session/account' && request.method === 'GET') {
    const header = request.headers.get('Authorization') || '';
    const uid = await firebaseUidFromToken(header.startsWith('Bearer ') ? header.slice(7).trim() : '', env);
    if (!uid) pnFail('Sign in to BIG LWA to restore Pinterest.', 401);
    const id = await env.OAUTH_SESSIONS.get('pn:firebase:' + uid);
    if (!id) return json({ connected: false }, 200, request, env);
    const existing = await env.OAUTH_SESSIONS.get('pn:session:' + id, 'json');
    if (!existing || existing.firebaseUid !== uid || (existing.expiresAt < Date.now() && !existing.refresh_token)) {
      await env.OAUTH_SESSIONS.delete('pn:firebase:' + uid);
      return json({ connected: false }, 200, request, env);
    }
    return json({ connected: true, session: id }, 200, request, env);
  }
  if (path === '/pinterest/session/claim' && request.method === 'POST') {
    const header = request.headers.get('Authorization') || '';
    const id = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!/^[A-Za-z0-9_-]{43}$/.test(id)) pnFail('Pinterest session expired. Please reconnect.', 401);
    const existing = await env.OAUTH_SESSIONS.get('pn:session:' + id, 'json');
    if (!existing) pnFail('Pinterest session expired. Please reconnect.', 401);
    const body = await request.json().catch(() => ({}));
    const uid = await firebaseUidFromToken(String(body.firebaseIdToken || ''), env);
    if (!uid) pnFail('Sign in to BIG LWA to restore Pinterest.', 401);
    return json(await pnBindSession(env, id, existing, uid), 200, request, env);
  }

  const id = (request.headers.get('Authorization') || '').replace(/^Bearer /, '');
  let session = /^[A-Za-z0-9_-]{43}$/.test(id) ? await env.OAUTH_SESSIONS.get('pn:session:' + id, 'json') : null;
  if (!session) pnFail('Pinterest session expired. Please reconnect.', 401);
  if (path === '/pinterest/disconnect' && request.method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const firebaseUid = await firebaseUidFromToken(String(body.firebaseIdToken || ''), env);
    if (!firebaseUid || (session.firebaseUid && session.firebaseUid !== firebaseUid)) pnFail('Sign in to the linked BIG LWA account to disconnect Pinterest.', 403);
    await env.OAUTH_SESSIONS.delete('pn:session:' + id);
    await env.OAUTH_SESSIONS.delete('pn:firebase:' + firebaseUid);
    return json({ ok: true }, 200, request, env);
  }

  const match = path.match(/^\/pinterest\/boards\/(\d+)\/pins$/);
  const covers = path === '/pinterest/board-covers';
  if (request.method !== 'GET' || (!match && !covers && !['/pinterest/profile', '/pinterest/boards', '/pinterest/pins'].includes(path))) pnFail('Not found.', 404);
  if (session.expiresAt < Date.now() + 60000) {
    if (!session.refresh_token) pnFail('Pinterest session expired. Please reconnect.', 401);
    const fresh = await pnToken(env, { grant_type: 'refresh_token', refresh_token: session.refresh_token });
    if (!fresh.refresh_token) fresh.refresh_token = session.refresh_token;
    session = await pnSave(env, id, fresh, session);
  }
  if (covers) return json(await pnBoardCovers(request, env, session, id), 200, request, env);
  const endpoint = match ? '/boards/' + match[1] + '/pins' : path === '/pinterest/boards' ? '/boards' : path === '/pinterest/pins' ? '/pins' : '/user_account';
  const target = new URL('https://api.pinterest.com/v5' + endpoint);
  if (endpoint !== '/user_account') {
    target.searchParams.set('page_size', '25');
    // Owner-created Pins are different from saved/repinned board content.
    // Never infer authorship from the board: only Pinterest's token-owned /pins
    // listing, excluding repins, is eligible for a BIG LWA profile draft.
    if (endpoint === '/pins') { target.searchParams.set('pin_filter','exclude_repins');target.searchParams.set('include_protected_pins','false'); }
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
 *   POST   /media/orbit-import
 *   GET    /media/orbit/<uid>/<file>
 */
const MEDIA_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MEDIA_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const MEDIA_EXTENSIONS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov' };
const MEDIA_MAX_IMAGE = 30 * 1024 * 1024;
const MEDIA_MAX_VIDEO = 120 * 1024 * 1024;
/* A profile picture is shown in a 34-106px circle, so it needs a far smaller ceiling than
   a wallpaper and is never a video. */
const MEDIA_MAX_PHOTO = 8 * 1024 * 1024;
const MEDIA_FOLDERS = { wallpaper: 'wallpapers', 'profile-photo': 'profile-photos', 'feed-image': 'feed-images', orbit: 'orbit' };

function mediaFail(message, status = 400) { const error = new Error(message); error.publicMessage = message; error.status = status; throw error; }

/* Sqwip screenplays belong ONLY to the authenticated BIG LWA user.
 * The cloud document is not stored in /posts or public R2 media URLs. */
const SQWIP_TYPES = new Set(['scene','action','character','dialogue','parenthetical','transition','shot']);
function sqwipCleanLibrary(data) {
  const input=Array.isArray(data?.documents)?data.documents:[];
  if(input.length>36) mediaFail('Sqwip library exceeds 36 scripts.',413);
  const docs=input.map(script=>{
    if(!/^[A-Za-z0-9_-]{3,128}$/.test(String(script?.id||'')))mediaFail('Invalid screenplay ID.');
    const blocks=Array.isArray(script.blocks)?script.blocks:[];
    if(blocks.length>1500)mediaFail('A screenplay exceeds 1500 elements.',413);
    return {
      id:String(script.id),title:String(script.title||'Untitled Screenplay').slice(0,130),
      author:String(script.author||'').slice(0,100),
      updatedAt:Number(script.updatedAt)||Date.now(),
      blocks:blocks.map(line=>{
        if(!/^[A-Za-z0-9_-]{3,128}$/.test(String(line?.id||'')))mediaFail('Invalid screenplay element.');
        const type=String(line.type||'action');
        if(!SQWIP_TYPES.has(type))mediaFail('Unsupported screenplay element.');
        const text=String(line.text||'');
        if(text.length>15000)mediaFail('A screenplay element is too long.',413);
        return {id:String(line.id),type,text};
      })
    };
  });
  const selected=String(data?.selectedId||'');
  const deletedIds=Array.isArray(data?.deletedIds)?data.deletedIds.filter(id=>/^[A-Za-z0-9_-]{3,128}$/.test(String(id))).slice(0,200):[];
  return {version:1,selectedId:docs.some(d=>d.id===selected)?selected:(docs[0]?.id||''),documents:docs.filter(doc=>!deletedIds.includes(doc.id)),deletedIds};
}
async function sqwipRoute(request,env) {
  if(request.method==='OPTIONS')return corsPreflight(request,env);
  if(!allowedOrigin(request,env))mediaFail('Origin not allowed.',403);
  if(new URL(request.url).pathname!=='/sqwip/library')mediaFail('Not found.',404);
  if(!['GET','POST'].includes(request.method))mediaFail('Unsupported request.',405);
  const user=await mediaUser(request,env);
  const key='sqwip/'+user.uid+'/library.json';
  const bucket=mediaBucket(env);
  if(request.method==='GET'){
    const object=await bucket.get(key);
    if(!object)return json({ok:true,library:{version:1,selectedId:'',documents:[],deletedIds:[]}},200,request,env);
    const saved=await object.json().catch(()=>null);
    return json({ok:true,library:sqwipCleanLibrary(saved)},200,request,env);
  }
  const length=Number(request.headers.get('content-length')||0);
  if(length>1500000)mediaFail('Screenplay library exceeds the 1.5 MB storage limit.',413);
  const raw=await request.text();
  if(raw.length>1500000)mediaFail('Screenplay library exceeds the 1.5 MB storage limit.',413);
  let submitted;
  try{submitted=JSON.parse(raw)}catch{mediaFail('Invalid screenplay JSON.')}
  const library=sqwipCleanLibrary(submitted);
  const encoded=JSON.stringify(library);
  if(encoded.length>1500000)mediaFail('Screenplay library exceeds the 1.5 MB storage limit.',413);
  await bucket.put(key,encoded,{
    httpMetadata:{contentType:'application/json; charset=utf-8',cacheControl:'private, no-store'},
    customMetadata:{uid:user.uid,kind:'sqwip-screenplays'}
  });
  return json({ok:true,count:library.documents.length},200,request,env);
}

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
  const match = /^\/media\/(wallpaper|profile-photo|feed-image|orbit)(?:\/|$)/.exec(pathname);
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
    const safe = name.replace(/[.*+?^$\${}()|[\]\\]/g, '\\$&');
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
// Profile music lives in the same R2 bucket as account media, but NEVER in
// Pinterest/Instagram session storage. Songs are private until their owner
// explicitly turns on public playback. Files are streamed to the browser.
const MUSIC_TYPES={
  'audio/mpeg':'mp3','audio/mp3':'mp3','audio/mp4':'m4a','audio/x-m4a':'m4a','audio/aac':'aac',
  'audio/ogg':'ogg','audio/wav':'wav','audio/x-wav':'wav','audio/webm':'webm',
  'audio/flac':'flac','audio/x-flac':'flac'
};
const MUSIC_LIMIT=75*1024*1024;
const MUSIC_PREFIX='profile-music/';
function musicSafe(value,length=100){return String(value||'').trim().slice(0,length)}
function musicId(value){return /^[A-Za-z0-9_-]{12,100}$/.test(value||'')}
function musicMetadata(entry){return {
  id:entry.id,title:entry.title,artist:entry.artist,public:entry.public===true,
  createdAt:entry.createdAt,updatedAt:entry.updatedAt,
  size:entry.size,contentType:entry.contentType
}}
async function musicRoute(request,env){
  const url=new URL(request.url),parts=url.pathname.split('/').filter(Boolean);
  const root='/media/profile-music';
  if(request.method==='OPTIONS')return corsPreflight(request,env);
  const method=request.method,bucket=mediaBucket(env);
  if(['POST','PATCH','DELETE'].includes(method)&&!allowedOrigin(request,env))
    mediaFail('Origin not allowed.',403);
  // POST binary track. Authenticate with Firebase; never read provider cookies.
  if(method==='POST'&&url.pathname===root){
    const user=await mediaUser(request,env);
    const mime=String(request.headers.get('content-type')||'').split(';')[0].toLowerCase();
    if(!MUSIC_TYPES[mime])mediaFail('Choose a supported MP3, M4A, AAC, OGG, WAV or WebM audio file.');
    const declared=Number(request.headers.get('content-length')||0);
    if(declared>MUSIC_LIMIT)mediaFail('Audio uploads must be under 75 MB.',413);
    const prefix=MUSIC_PREFIX+user.uid+'/',existing=await bucket.list({prefix,limit:100});
    if(existing.objects.filter(o=>o.key.endsWith('.json')).length>=12)
      mediaFail('Your profile can contain up to 12 songs.',413);
    const bytes=await request.arrayBuffer();
    if(!bytes.byteLength||bytes.byteLength>MUSIC_LIMIT)mediaFail('Audio must be between 1 byte and 75 MB.',413);
    const id=randomToken(16),name=id+'.'+MUSIC_TYPES[mime],createdAt=Date.now();
    const item={id,title:musicSafe(url.searchParams.get('title'))||'Untitled track',
      artist:musicSafe(url.searchParams.get('artist'))||'Unknown artist',public:false,
      createdAt,updatedAt:createdAt,size:bytes.byteLength,contentType:mime,file:name};
    await bucket.put(prefix+name,bytes,{
      httpMetadata:{contentType:mime,cacheControl:'private, no-store'},
      customMetadata:{uid:user.uid,kind:'profile-music',trackId:id}
    });
    try{
      await bucket.put(prefix+id+'.json',JSON.stringify(item),{
        httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'},
        customMetadata:{uid:user.uid,kind:'profile-music-metadata'}
      });
    }catch(error){await bucket.delete(prefix+name);throw error;}
    return json({ok:true,track:musicMetadata(item)},200,request,env);
  }
  if(parts[0]!=='media'||parts[1]!=='profile-music')mediaFail('Not found.',404);
  const uid=String(parts[2]||'');
  if(!/^[A-Za-z0-9_-]{2,128}$/.test(uid))mediaFail('Invalid profile.',404);
  const privateView=uid==='me';
  let viewer=null;
  if(privateView||method==='PATCH'||method==='DELETE'||(method==='GET'&&request.headers.has('Authorization'))){
    viewer=await mediaUser(request,env);
  }
  const ownerId=privateView?viewer.uid:uid;
  const owner=!!viewer&&viewer.uid===ownerId;
  if(method==='GET'&&parts.length===3){
    const listed=await bucket.list({prefix:MUSIC_PREFIX+ownerId+'/',limit:100});
    const tracks=[];
    for(const object of listed.objects.filter(item=>item.key.endsWith('.json')).slice(0,25)){
      const doc=await bucket.get(object.key);
      const data=doc?await doc.json().catch(()=>null):null;
      if(data?.id&&musicId(data.id)&&(data.public===true||owner)){
        const track=musicMetadata(data);
        track.url=url.origin+root+'/'+ownerId+'/'+data.id;
        tracks.push(track);
      }
    }
    tracks.sort((a,b)=>b.createdAt-a.createdAt);
    return json({ok:true,uid:ownerId,owner,tracks},200,request,env);
  }
  const id=String(parts[3]||'');
  if(!musicId(id)||parts.length!==4)mediaFail('Track not found.',404);
  const metadataKey=MUSIC_PREFIX+ownerId+'/'+id+'.json';
  const record=await bucket.get(metadataKey);
  const entry=record?await record.json().catch(()=>null):null;
  if(!entry||entry.id!==id)mediaFail('Track not found.',404);
  if(method==='PATCH'){
    if(!owner)mediaFail('You can edit only your own music.',403);
    const raw=await request.text();
    if(raw.length>3000)mediaFail('Invalid song details.',413);
    let values={};try{values=JSON.parse(raw)}catch{mediaFail('Invalid song details.')}
    if(values.title!==undefined)entry.title=musicSafe(values.title)||'Untitled track';
    if(values.artist!==undefined)entry.artist=musicSafe(values.artist)||'Unknown artist';
    if(values.public!==undefined)entry.public=values.public===true;
    entry.updatedAt=Date.now();
    await bucket.put(metadataKey,JSON.stringify(entry),{
      httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'},
      customMetadata:{uid:ownerId,kind:'profile-music-metadata'}
    });
    return json({ok:true,track:musicMetadata(entry)},200,request,env);
  }
  if(method==='DELETE'){
    if(!owner)mediaFail('You can remove only your own music.',403);
    await bucket.delete([MUSIC_PREFIX+ownerId+'/'+entry.file,metadataKey]);
    return json({ok:true},200,request,env);
  }
  if(method==='GET'){
    if(!entry.public&&!owner)mediaFail('Track not available.',404);
    const audioKey=MUSIC_PREFIX+ownerId+'/'+entry.file;
    const range=request.headers.get('Range');
    let rangeOpt;
    if(range&&/^bytes=\d+-\d*$/.test(range)){
      const [,start,end]=/^bytes=(\d+)-(\d*)$/.exec(range)||[];
      const offset=Number(start);
      const length=end?Number(end)-offset+1:undefined;
      if(Number.isSafeInteger(offset)&&offset<entry.size&&
         (length===undefined||(Number.isSafeInteger(length)&&length>0)))
        rangeOpt={offset,...(length?{length}: {})};
    }
    const object=await bucket.get(audioKey,rangeOpt?{range:rangeOpt}:{});
    if(!object)mediaFail('Track file not found.',404);
    const headers=new Headers({
      'Content-Type':entry.contentType,'Accept-Ranges':'bytes',
      'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'
    });
    const origin=request.headers.get('Origin');
    if(origin&&allowedOrigin(request,env)){
      headers.set('Access-Control-Allow-Origin',origin);headers.set('Vary','Origin');
    }
    if(rangeOpt){
      const end=Math.min(entry.size-1,rangeOpt.offset+(rangeOpt.length||entry.size)-1);
      headers.set('Content-Range','bytes '+rangeOpt.offset+'-'+end+'/'+entry.size);
      headers.set('Content-Length',String(end-rangeOpt.offset+1));
    }else headers.set('Content-Length',String(entry.size));
    return new Response(object.body,{status:rangeOpt?206:200,headers});
  }
  mediaFail('Unsupported action.',405);
}

async function mediaRoute(request, env) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return corsPreflight(request, env);
  if (url.pathname === '/media/link-preview' && request.method === 'POST') return mediaLinkPreview(request, env);
  if(url.pathname.startsWith('/media/profile-music'))return musicRoute(request,env);
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
        'POST /media/profile-music', 'GET /media/profile-music/<uid>', 'PATCH /media/profile-music/<uid>/<trackId>', 'POST /media/feed-image', 'GET /media/feed-image/<uid>/<file>', 'DELETE /media/feed-image/<uid>/<file>', 'POST /media/orbit-import (Instagram or Pinterest)', 'GET /media/orbit/<uid>/<file>'
      ]
    }, 200, request, env);
  }
  if (url.pathname === '/media/orbit-import' && request.method === 'POST') return orbitMediaImport(request, env);
  if (request.method === 'POST' && url.pathname.replace(/\/$/, '') === '/media/' + segment) {
    return mediaUpload(request, env, url, segment);
  }
  if (request.method === 'GET' && segment) return mediaServe(request, env, mediaKeyParts(url.pathname), segment);
  if (request.method === 'DELETE' && segment) return mediaDelete(request, env, mediaKeyParts(url.pathname));
  return json({ error: 'Not found' }, 404, request, env);
}


async function orbitMediaImport(request, env) {
  // Account identity comes solely from Firebase. A Pinterest grant failure
  // must not be reported as a failed BIG LWA login.
  const user = await mediaUser(request, env);
  const declaredProvider = String(request.headers.get('X-Orbit-Provider') || '').trim().toLowerCase();
  if (declaredProvider && !['pinterest', 'instagram'].includes(declaredProvider))
    mediaFail('Unrecognized Orbit source.', 400);
  const pinterestSessionId = String(request.headers.get('X-Pinterest-Session') || '').trim();
  const isPinterest = declaredProvider === 'pinterest' || (!declaredProvider && !!pinterestSessionId);
  const provider = isPinterest ? 'Pinterest' : 'Instagram';
  let orbitSessionId = isPinterest ? pinterestSessionId : String(request.headers.get('X-Instagram-Session') || '').trim();
  // Pinterest's UID-bound account session is authoritative, including when the
  // browser has lost its optional local cache. Never fall back to Instagram.
  if (isPinterest) {
    const linkedId = await env.OAUTH_SESSIONS.get('pn:firebase:' + user.uid);
    if (linkedId) orbitSessionId = linkedId;
    else if (!orbitSessionId) mediaFail('Reconnect Pinterest in Orbit. Your BIG LWA login is still active.', 401);
  }
  if (!orbitSessionId) mediaFail('Reconnect ' + provider + ' in Orbit. Your BIG LWA login is still active.', 401);
  let session = await env.OAUTH_SESSIONS.get((isPinterest ? 'pn:session:' : 'session:') + orbitSessionId, 'json');
  if (session?.firebaseUid && session.firebaseUid !== user.uid)
    mediaFail('The ' + provider + ' connection belongs to a different BIG LWA account.', 403);
  if (!session || !session.firebaseUid)
    mediaFail('Reconnect ' + provider + ' in Orbit. Your BIG LWA login is still active.', 401);
  if (isPinterest) {
    // Match the existing Pinterest profile/boards auto-refresh behavior on
    // the R2 media-import endpoint, too.
    if (session.expiresAt < Date.now() + 60000) {
      if (!session.refresh_token || (session.refreshExpiresAt && session.refreshExpiresAt <= Date.now()))
        mediaFail('Pinterest authorization expired. Reconnect Pinterest only; BIG LWA is still signed in.', 401);
      let fresh;
      try { fresh = await pnToken(env, { grant_type: 'refresh_token', refresh_token: session.refresh_token }); }
      catch { mediaFail('Pinterest refresh failed. Reconnect Pinterest in Orbit; your BIG LWA login is unchanged.', 401); }
      if (!fresh.refresh_token) fresh.refresh_token = session.refresh_token;
      session = await pnSave(env, orbitSessionId, fresh, session);
    }
    if (!session.access_token)
      mediaFail('Reconnect Pinterest in Orbit. Your BIG LWA login is still active.', 401);
  } else if (!session.accessToken || session.expiresAt < Date.now()) {
    mediaFail('Instagram authorization expired. Reconnect Instagram in Orbit; your BIG LWA login is unchanged.', 401);
  }

  const body = await request.json().catch(() => ({}));
  const items = Array.isArray(body.items) ? body.items : [];
  if (!items.length) return json({ ok: true, imported: [], failed: [] }, 200, request, env);
  if (items.length > 300) mediaFail('That Orbit import is too large. Refresh Orbit and try again.', 413);

  const imported = [];
  const failed = [];
  for (const item of items) {
    const sourcePostId = String(item.sourcePostId || '').trim();
    const index = Number.isFinite(Number(item.index)) ? Number(item.index) : 0;
    const rawUrl = String(item.url || '').trim();
    const mediaType = String(item.mediaType || 'IMAGE').toUpperCase();
    if (!sourcePostId || !rawUrl) {
      failed.push({ sourcePostId, index, error: 'Missing Orbit media URL.' });
      continue;
    }

    let target;
    try { target = new URL(rawUrl); }
    catch { failed.push({ sourcePostId, index, error: provider + ' returned an invalid media URL.' }); continue; }

    if (target.protocol !== 'https:' || !(isPinterest ? isPinterestMediaHost(target.hostname) : isInstagramMediaHost(target.hostname))) {
      failed.push({ sourcePostId, index, error: provider + ' returned an unsupported media host.' });
      continue;
    }

    let response;
    try {
      response = await fetch(target.toString(), {
        redirect: isPinterest ? 'manual' : 'follow',
        headers: { 'User-Agent': 'BIGLWA-Orbit-Media/1.0' }
      });
      // Pinterest CDN only: never follow arbitrary redirects or send tokens to URLs.
      if (!isPinterest && !response.ok) {
        target.searchParams.set('access_token', session.accessToken);
        response = await fetch(target.toString(), {
          redirect: 'follow',
          headers: { 'User-Agent': 'BIGLWA-Orbit-Media/1.0' }
        });
      }
    } catch {
      failed.push({ sourcePostId, index, error: provider + ' image could not be retrieved.' });
      continue;
    }
    let finalUrl = '';
    try { finalUrl = new URL(response.url || target.toString()); } catch {
      finalUrl = null;
    }
    if (!response.ok || !finalUrl || !(isPinterest ? isPinterestMediaHost(finalUrl.hostname) : isInstagramMediaHost(finalUrl.hostname))) {
      failed.push({ sourcePostId, index, error: provider + ' would not provide this media file.' });
      continue;
    }

    const contentType = String(response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!MEDIA_IMAGE_TYPES.includes(contentType) && (isPinterest || !MEDIA_VIDEO_TYPES.includes(contentType))) {
      failed.push({ sourcePostId, index, error: provider + ' returned an unsupported media type.' });
      continue;
    }

    const limit = MEDIA_VIDEO_TYPES.includes(contentType) ? MEDIA_MAX_VIDEO : MEDIA_MAX_IMAGE;
    const declared = Number(response.headers.get('content-length') || 0);
    if (declared && declared > limit) {
      failed.push({ sourcePostId, index, error: 'This Orbit media file is too large for BIGLWA storage.' });
      continue;
    }

    const bytes = await response.arrayBuffer();
    if (!bytes.byteLength || bytes.byteLength > limit) {
      failed.push({ sourcePostId, index, error: 'This Orbit media file could not be stored.' });
      continue;
    }

    const ext = MEDIA_EXTENSIONS[contentType] || (mediaType === 'VIDEO' ? 'mp4' : 'jpg');
    const fingerprint = await sha256Hex(provider.toLowerCase() + ':' + sourcePostId + ':' + index);
    const name = fingerprint.slice(0, 40) + '.' + ext;
    const key = MEDIA_FOLDERS.orbit + '/' + user.uid + '/' + name;
    await mediaBucket(env).put(key, bytes, {
      httpMetadata: { contentType, cacheControl: 'public, max-age=31536000, immutable' },
      customMetadata: {
        uid: user.uid,
        source: provider.toLowerCase(),
        sourcePostId,
        index: String(index),
        mediaType,
        originalUrl: rawUrl.slice(0, 1000)
      }
    });
    imported.push({
      sourcePostId,
      index,
      mediaType,
      contentType,
      key: user.uid + '/' + name,
      url: new URL('/media/orbit/' + encodeURIComponent(user.uid) + '/' + encodeURIComponent(name), request.url).toString()
    });
  }

  if (failed.length && !imported.length) {
    mediaFail('BIGLWA could not copy the ' + provider + ' images. Try again or reconnect Orbit.', 502);
  }
  return json({ ok: true, imported, failed }, 200, request, env);
}

function isPinterestMediaHost(hostname) {
  const host = String(hostname || '').toLowerCase().replace(/\.$/, '');
  return host === 'i.pinimg.com' || (host.endsWith('.pinimg.com') && host.length > '.pinimg.com'.length);
}
function isInstagramMediaHost(hostname) {
  const host = String(hostname || '').toLowerCase().replace(/\.$/, '');
  return host === 'instagram.com' || host.endsWith('.instagram.com')
    || host === 'cdninstagram.com' || host.endsWith('.cdninstagram.com')
    || host === 'fbcdn.net' || host.endsWith('.fbcdn.net')
    || host === 'fbsbx.com' || host.endsWith('.fbsbx.com')
    || host === 'facebook.com' || host.endsWith('.facebook.com');
}

async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(String(value));
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  return Array.from(digest).map((byte) => byte.toString(16).padStart(2, '0')).join('');
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


/* BIG LWA additional Orbit OAuth — X, Tumblr, Snapchat Login Kit.
 * Read-only profile authorization. Firebase session identifies the owner before
 * authorization; all tokens remain server-side in OAUTH_SESSIONS KV.
 * Callback is https://api.biglwa.com/{provider}/callback.
 */
const PROVIDERS={
 x:{id:'X_CLIENT_ID',secret:'X_CLIENT_SECRET',authorize:'https://twitter.com/i/oauth2/authorize',
    token:'https://api.x.com/2/oauth2/token',scope:'users.read tweet.read offline.access'},
 tumblr:{id:'TUMBLR_CONSUMER_KEY',secret:'TUMBLR_CONSUMER_SECRET',authorize:'https://www.tumblr.com/oauth2/authorize',
    token:'https://api.tumblr.com/v2/oauth2/token',scope:'basic offline_access'},
 snapchat:{id:'SNAPCHAT_CLIENT_ID',secret:'SNAPCHAT_CLIENT_SECRET',authorize:'https://accounts.snapchat.com/login/oauth2/authorize',
    token:'https://accounts.snapchat.com/login/oauth2/access_token',
    scope:'https://auth.snapchat.com/oauth2/api/user.external_id https://auth.snapchat.com/oauth2/api/user.display_name https://auth.snapchat.com/oauth2/api/user.bitmoji.avatar'}
};
const WORKER_ORIGIN='https://api.biglwa.com';
const FINISH_URL='https://biglwa.com/studio?view=orbit';
const SAFE_SITE=new Set(['https://biglwa.com','https://www.biglwa.com']);

function oaReply(body,status=200,request){
 const origin=request.headers.get('Origin')||'';
 const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Origin'};
 if(SAFE_SITE.has(origin)){
   headers['Access-Control-Allow-Origin']=origin;
   headers['Access-Control-Allow-Methods']='GET, POST, DELETE, OPTIONS';
   headers['Access-Control-Allow-Headers']='Authorization,Content-Type';
 }
 return new Response(JSON.stringify(body),{status,headers});
}
function oaError(message,status=400){const err=new Error(message);err.publicMessage=message;err.status=status;throw err}
function oaB64url(bytes){
 let str='';for(const b of bytes)str+=String.fromCharCode(b);
 return btoa(str).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function oaRandom(len=32){return oaB64url(crypto.getRandomValues(new Uint8Array(len)))}
async function oaChallenge(text){
 return oaB64url(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))));
}
function oaCallback(provider,env){
 const host=String((provider==='x'?env.NEW_ORBIT_CALLBACK_ORIGIN:null)||WORKER_ORIGIN).trim();
 if(!/^https:\/\/(?:api\.biglwa\.com|biglwa-instagram-api\.leianmulatre-284\.workers\.dev)$/.test(host))
   oaError('Orbit callback origin must be a trusted BIG LWA Worker hostname.',500);
 return host+'/'+provider+'/callback';
}
function oaRedirect(provider,status,error){
 const uri=new URL(FINISH_URL);
 uri.searchParams.set('orbit_provider',provider);
 uri.searchParams.set('orbit_status',status);
 if(error)uri.searchParams.set('orbit_error',String(error).slice(0,180));
 return new Response(null,{status:302,headers:{
  Location:uri.href,'Cache-Control':'no-store','Referrer-Policy':'no-referrer',
  'X-Content-Type-Options':'nosniff'
 }});
}
function oaConfigured(env,provider){
 const c=PROVIDERS[provider];
 return [c.id,c.secret,'OAUTH_SESSIONS'].filter(key=>!env[key]);
}
async function oaExchange(provider,code,verifier,env,callback){
 const c=PROVIDERS[provider],form=new URLSearchParams({
  grant_type:'authorization_code',code,client_id:String(env[c.id]),redirect_uri:callback
 });
 const headers={'Content-Type':'application/x-www-form-urlencoded'};
 if(provider==='x'){
  form.set('code_verifier',verifier);
  headers.Authorization='Basic '+btoa(env[c.id]+':'+env[c.secret]);
 }else if(provider==='tumblr'){
  form.set('client_secret',env[c.secret]);
 }else{
  headers.Authorization='Basic '+btoa(env[c.id]+':'+env[c.secret]);
 }
 const resp=await fetch(c.token,{method:'POST',headers,body:form});
 const result=await resp.json().catch(()=>({}));
 if(!resp.ok||!result.access_token)oaError(provider+' did not accept this authorization. Check its public client ID, callback and granted scopes.',502);
 return result;
}
function oaPhoto(url){
 try{const parsed=new URL(String(url||''));return parsed.protocol==='https:'?parsed.href:''}catch{return ''}
}
async function oaProfile(provider,token){
 const headers={Authorization:'Bearer '+token,'Accept':'application/json'};
 let endpoint,options={headers};
 if(provider==='x'){
  endpoint='https://api.x.com/2/users/me?user.fields=name,username,profile_image_url,public_metrics';
 }else if(provider==='tumblr'){
  endpoint='https://api.tumblr.com/v2/user/info';
 }else{
  endpoint='https://kit.snapchat.com/v1/me';
  options={method:'POST',headers:{...headers,'Content-Type':'application/json'},
   body:JSON.stringify({query:'query { me { externalId displayName bitmoji { avatar } } }'})};
 }
 const resp=await fetch(endpoint,options);
 const data=await resp.json().catch(()=>({}));
 if(!resp.ok)oaError(provider+' authorized, but its profile API could not be read. Confirm the app has the requested permissions.',502);
 if(provider==='x'){
   const u=data.data||{};
   if(!u.id||!u.username)oaError('X did not return an authorized profile.',502);
   return {id:'x',sourceUserId:String(u.id),name:String(u.name||u.username).slice(0,100),
    username:String(u.username).slice(0,80),avatarUrl:oaPhoto(u.profile_image_url),
    followers:Number(u.public_metrics?.followers_count)||0,
    link:'https://x.com/'+encodeURIComponent(u.username)};
 }
 if(provider==='tumblr'){
   const u=data.response?.user||{};
   if(!u.name)oaError('Tumblr did not return an authorized account.',502);
   const name=String(u.name).slice(0,80);
   const first=Array.isArray(u.blogs)?u.blogs.find(x=>x?.primary)||u.blogs[0]:null;
   const link=oaPhoto(first?.url)||('https://www.tumblr.com/'+encodeURIComponent(name));
   return {id:'tumblr',sourceUserId:name,username:name,name,avatarUrl:oaPhoto(first?.avatar_url),
    link};
 }
 const me=data.data?.me||data.data?.user||data.me||{};
 if(!me.externalId)oaError('Snapchat did not provide the requested Login Kit account identity.',502);
 const avatar=me.bitmoji?.avatar||me.bitmoji?.selfie||me.bitmojiAvatar||'';
 return {id:'snapchat',sourceUserId:String(me.externalId),name:String(me.displayName||'Snapchat account').slice(0,100),
  username:'',avatarUrl:oaPhoto(avatar),
  link:''};
}
async function handleAdditionalOrbit(request,env,getFirebaseUser){
 const url=new URL(request.url),parts=url.pathname.split('/').filter(Boolean);
 const provider=parts[0],action=parts[1];
 if(!PROVIDERS[provider]||parts.length!==2)return oaReply({error:'Not found'},404,request);
 if(request.method==='OPTIONS'){
  const o=request.headers.get('Origin')||'';
  if(!SAFE_SITE.has(o))return new Response(null,{status:403});
  return new Response(null,{status:204,headers:{
   'Access-Control-Allow-Origin':o,'Access-Control-Allow-Methods':'GET, POST, DELETE, OPTIONS',
   'Access-Control-Allow-Headers':'Authorization,Content-Type','Cache-Control':'no-store','Vary':'Origin'
  }});
 }
 try{
  const c=PROVIDERS[provider];
  if(action==='health'&&request.method==='GET'){
   const missing=oaConfigured(env,provider);
   return oaReply({ok:missing.length===0,provider,configured:missing.length===0,missing,
    callback:oaCallback(provider,env)},200,request);
  }
  if(action==='callback'&&request.method==='GET'){
   const state=url.searchParams.get('state')||'';
   if(!/^[A-Za-z0-9_-]{32,100}$/.test(state))return oaRedirect(provider,'failed','Invalid authorization state.');
   const key='new-orbit:'+provider+':state:'+state;
   const saved=await env.OAUTH_SESSIONS.get(key,'json');
   if(saved)await env.OAUTH_SESSIONS.delete(key);
   if(!saved||Date.now()-saved.createdAt>600000)return oaRedirect(provider,'failed','Connection expired; retry from Orbit.');
   if(url.searchParams.get('error'))return oaRedirect(provider,'failed','Authorization cancelled.');
   const code=url.searchParams.get('code')||'';
   if(!code)return oaRedirect(provider,'failed','No authorization code received.');
   const result=await oaExchange(provider,code,saved.verifier||'',env,oaCallback(provider,env));
   const profile=await oaProfile(provider,result.access_token);
   await env.OAUTH_SESSIONS.put('new-orbit:'+provider+':account:'+saved.uid,JSON.stringify({
     profile,accessToken:result.access_token,refreshToken:result.refresh_token||'',
     expiresAt:Date.now()+Math.max(60,Number(result.expires_in)||3600)*1000,createdAt:Date.now()
   }),{expirationTtl:7776000});
   return oaRedirect(provider,'connected');
  }
  if(!['start','session','disconnect','media'].includes(action))return oaReply({error:'Not found'},404,request);
  if(action==='start'&&request.method!=='POST')return oaReply({error:'POST required'},405,request);
  if(['session','media'].includes(action)&&request.method!=='GET')return oaReply({error:'GET required'},405,request);
  if(action==='disconnect'&&request.method!=='POST')return oaReply({error:'POST required'},405,request);
  const user=await getFirebaseUser(request,env);
  if(!user?.uid)oaError('Sign in to BIG LWA before connecting.',401);
  const accountKey='new-orbit:'+provider+':account:'+user.uid;
  if(action==='session'){
   const saved=await env.OAUTH_SESSIONS.get(accountKey,'json');
   const fresh=Boolean(saved?.expiresAt&&saved.expiresAt>Date.now());
   return oaReply({connected:!!saved,needsReauth:!!saved&&!fresh,profile:saved?.profile||null},200,request);
  }
  if(action==='disconnect'){
   await env.OAUTH_SESSIONS.delete(accountKey);
   return oaReply({ok:true,connected:false},200,request);
  }
  const missing=oaConfigured(env,provider);
  if(missing.length)return oaReply({error:'Provider is not configured yet.',missing},503,request);
  const state=oaRandom(32),verifier=provider==='x'?oaRandom(48):'';
  const callback=oaCallback(provider,env);
  const auth=new URL(c.authorize);
  auth.searchParams.set('response_type','code');
  auth.searchParams.set('client_id',env[c.id]);
  auth.searchParams.set('redirect_uri',callback);
  auth.searchParams.set('scope',c.scope);
  auth.searchParams.set('state',state);
  if(provider==='x'){
   auth.searchParams.set('code_challenge_method','S256');
   auth.searchParams.set('code_challenge',await oaChallenge(verifier));
  }
  await env.OAUTH_SESSIONS.put('new-orbit:'+provider+':state:'+state,
   JSON.stringify({uid:user.uid,verifier,createdAt:Date.now()}),{expirationTtl:600});
  return oaReply({ok:true,authorizeUrl:auth.href,provider},200,request);
 }catch(error){
  if(action==='callback')return oaRedirect(provider,'failed',error.publicMessage||'Authorization failed; try again.');
  return oaReply({error:error.publicMessage||'Provider connection failed.',
    ...(error.status===503?{missing:oaConfigured(env,provider)}:{})},error.status||502,request);
 }
}



/* Separate personal Facebook Login for the user's NEW Meta app.
 * Does not reuse or mutate the existing FB SDK/Business Login app.
 * Register https://api.biglwa.com/facebook-personal/callback in Meta's
 * Valid OAuth Redirect URIs. Keep FACEBOOK_PERSONAL_APP_SECRET server-side.
 */
const FB_PERSONAL_APP_ID_DEFAULT='1578748363462175';
const FB_PERSONAL_CALLBACK='https://api.biglwa.com/facebook-personal/callback';
const FB_PERSONAL_GRAPH='https://graph.facebook.com/v25.0';
function fbpConfig(env){
 const id=String(env.FACEBOOK_PERSONAL_APP_ID||FB_PERSONAL_APP_ID_DEFAULT).trim();
 const missing=[];
 if(!/^\d{10,30}$/.test(id))missing.push('FACEBOOK_PERSONAL_APP_ID');
 if(!env.FACEBOOK_PERSONAL_APP_SECRET)missing.push('FACEBOOK_PERSONAL_APP_SECRET');
 if(!env.OAUTH_SESSIONS)missing.push('OAUTH_SESSIONS');
 return {id,missing};
}
function fbpEnd(status,message=''){
 const url=new URL('https://biglwa.com/studio?view=orbit');
 url.searchParams.set('facebook_login',status);
 if(message)url.searchParams.set('facebook_login_error',message.slice(0,130));
 return new Response(null,{status:302,headers:{Location:url.toString(),'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
}
async function facebookPersonalRoute(request,env){
 const url=new URL(request.url);
 const action=url.pathname.slice('/facebook-personal/'.length);
 if(request.method==='OPTIONS')return corsPreflight(request,env);
 const config=fbpConfig(env);
 if(action==='health'&&request.method==='GET')
   return json({ok:config.missing.length===0,configured:config.missing.length===0,
     missing:config.missing,callback:FB_PERSONAL_CALLBACK,appId:config.id},200,request,env);
 if(action==='callback'&&request.method==='GET'){
   if(config.missing.length)return fbpEnd('failed','The new Facebook app is not configured yet.');
   const state=String(url.searchParams.get('state')||'');
   if(!/^[A-Za-z0-9_-]{32,100}$/.test(state))return fbpEnd('failed','Invalid OAuth state.');
   const key='facebook-personal:state:'+state;
   const saved=await env.OAUTH_SESSIONS.get(key,'json');
   if(saved)await env.OAUTH_SESSIONS.delete(key);
   if(!saved||!saved.uid||Date.now()-saved.createdAt>600000)
     return fbpEnd('failed','Connection expired. Retry from Orbit.');
   if(url.searchParams.get('error'))return fbpEnd('failed','Facebook authorization was cancelled.');
   const code=url.searchParams.get('code')||'';
   if(!code)return fbpEnd('failed','Facebook did not provide an authorization code.');
   try{
     const tokenUrl=new URL(FB_PERSONAL_GRAPH+'/oauth/access_token');
     tokenUrl.searchParams.set('client_id',config.id);
     tokenUrl.searchParams.set('client_secret',String(env.FACEBOOK_PERSONAL_APP_SECRET));
     tokenUrl.searchParams.set('redirect_uri',FB_PERSONAL_CALLBACK);
     tokenUrl.searchParams.set('code',code);
     const response=await fetch(tokenUrl.toString(),{headers:{Accept:'application/json'}});
     const token=await response.json().catch(()=>({}));
     if(!response.ok||!token.access_token)throw Error('Meta did not accept the authorization code.');
     const profileUrl=new URL(FB_PERSONAL_GRAPH+'/me');
     profileUrl.searchParams.set('fields','id,name,picture.width(200).height(200)');
     const meResponse=await fetch(profileUrl.toString(),{headers:{
       Authorization:'Bearer '+String(token.access_token),Accept:'application/json'
     }});
     const me=await meResponse.json().catch(()=>({}));
     if(!meResponse.ok||!me.id)throw Error('Meta did not return the authorized account.');
     const seconds=Math.max(60,Number(token.expires_in)||3600);
     const profile={id:'facebook',sourceUserId:String(me.id),name:String(me.name||'Facebook account').slice(0,100),
       avatarUrl:String(me.picture?.data?.url||'').slice(0,2048),link:'',verifiedFromProvider:true};
     await env.OAUTH_SESSIONS.put('facebook-personal:account:'+saved.uid,JSON.stringify({
       profile,accessToken:token.access_token,expiresAt:Date.now()+seconds*1000,createdAt:Date.now()
     }),{expirationTtl:7776000});
     return fbpEnd('connected');
   }catch(e){
     console.warn('New Facebook OAuth exchange failed:',e.message);
     return fbpEnd('failed','Facebook could not finish authorizing. Verify the Meta callback and app settings.');
   }
 }
 if(!['start','session','disconnect','media'].includes(action))
   return json({error:'Not found'},404,request,env);
 if((action==='start'||action==='disconnect')&&request.method!=='POST')
   return json({error:'POST required'},405,request,env);
 if(['session','media'].includes(action)&&request.method!=='GET')
   return json({error:'GET required'},405,request,env);
 // A browser signed into Facebook but not BIG LWA cannot claim another member's account.
 if(!allowedOrigin(request,env))return json({error:'Origin not allowed'},403,request,env);
 let user;
 try{user=await mediaUser(request,env)}
 catch{return json({error:'Sign in to BIG LWA before connecting Facebook.'},401,request,env)}
 const key='facebook-personal:account:'+user.uid;
 if(action==='session'){
   const session=env.OAUTH_SESSIONS?await env.OAUTH_SESSIONS.get(key,'json'):null;
   return json({connected:!!session,needsReauth:!!session&&session.expiresAt<=Date.now(),
     profile:session?.profile||null},200,request,env);
 }
 if(action==='media'){
   const session=env.OAUTH_SESSIONS?await env.OAUTH_SESSIONS.get(key,'json'):null;
   if(!session||session.expiresAt<=Date.now())return json({error:'Reconnect Facebook Personal to sync your content.'},401,request,env);
   const graph=async(path,fields)=>{
     const target=new URL(FB_PERSONAL_GRAPH+'/me/'+path);
     target.searchParams.set('limit','20');
     if(fields)target.searchParams.set('fields',fields);
     if(path==='photos')target.searchParams.set('type','uploaded');
     const response=await fetch(target,{headers:{Authorization:'Bearer '+session.accessToken}});
     const body=await response.json();
     if(!response.ok||body.error)throw Error('Facebook could not read '+path+'. Reconnect and grant content access; the Meta app may require permission approval.');
     return Array.isArray(body.data)?body.data:[];
   };
   try{
     const permissions=await graph('permissions');
     const granted=new Set(permissions.filter(p=>p.status==='granted').map(p=>p.permission));
     const missing=['user_posts','user_photos'].filter(p=>!granted.has(p));
     const items=[],warnings=[];
     for(const [permission,path,fields] of [
       ['user_posts','posts','id,message,permalink_url,full_picture,created_time'],
       ['user_photos','photos','id,name,link,images,created_time']
     ]){
       if(!granted.has(permission))continue;
       try{
         const rows=await graph(path,fields);
         items.push(...rows.map(row=>({id:String(row.id),sourcePostId:String(row.id),
           sourceUrl:row.permalink_url||row.link||(path==='photos'?'https://www.facebook.com/photo/?fbid=':'https://www.facebook.com/')+encodeURIComponent(row.id),
           caption:row.message||row.name||'Facebook '+(path==='posts'?'post':'photo'),
           thumbnailUrl:row.full_picture||row.images?.[0]?.source||'',
           sourceCreatedAtMs:Date.parse(row.created_time)||0,
           sourceUsername:session.profile?.name||'',mediaType:path==='photos'?'IMAGE':'POST'})));
       }catch(error){warnings.push(error.message)}
     }
     return json({items,missing,warnings,limit:40},200,request,env);
   }catch(error){return json({error:error.message},502,request,env)}
 }
 if(action==='disconnect'){
   if(env.OAUTH_SESSIONS)await env.OAUTH_SESSIONS.delete(key);
   return json({ok:true,connected:false},200,request,env);
 }
 if(config.missing.length)
   return json({error:'New Facebook app setup is incomplete.',missing:config.missing},503,request,env);
 const state=randomToken(32);
 await env.OAUTH_SESSIONS.put('facebook-personal:state:'+state,JSON.stringify({
   uid:user.uid,createdAt:Date.now()
 }),{expirationTtl:600});
 const auth=new URL('https://www.facebook.com/v25.0/dialog/oauth');
 auth.searchParams.set('client_id',config.id);
 auth.searchParams.set('redirect_uri',FB_PERSONAL_CALLBACK);
 auth.searchParams.set('response_type','code');
 auth.searchParams.set('scope','public_profile,user_posts,user_photos');
 auth.searchParams.set('auth_type','rerequest');
 auth.searchParams.set('state',state);
 return json({ok:true,authorizeUrl:auth.toString()},200,request,env);
}
