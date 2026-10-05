(function () {
  'use strict';
  if (window.__biglwaInstagramOrbit) return;

  var API = 'https://biglwa-instagram-api.leianmulatre-284.workers.dev';
  var SESSION_KEY = 'biglwaInstagramSession';
  var state = { connected: false, profile: null, media: [], error: '', importError: '', sessionLookupError: '', importsSaved: 0, importsSkipped: 0, importsPartial: 0, importAttempted: false, importWarning: '' };
  /* The same figures the Orbit panel shows, readable from the console, so a silent
     zero-import can be diagnosed without guessing. */
  window.__biglwaInstagramDiagnostics = state;
  window.__biglwaInstagramReturnCode = RETURNED_HANDOFF;
  /* Read the OAuth return code the moment this file evaluates, which is before
     module-pages.js runs its top-level canonicalizeLegacyView(). That call rewrites
     ?route=studio&view=orbit to /studio/orbit and drops every other query parameter,
     so a handoff read later at DOMContentLoaded was always already gone and the new
     session was silently thrown away. Holding it here survives the rewrite. */
  var RETURNED_HANDOFF = (function () {
    try { return new URL(window.location.href).searchParams.get('instagram_handoff') || ''; } catch (error) { return ''; }
  }());
  var RETURNED_ERROR = (function () {
    try { return new URL(window.location.href).searchParams.get('instagram_error') || ''; } catch (error) { return ''; }
  }());
  function one(selector, root) { return (root || document).querySelector(selector); }
  function all(selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }
  function escapeText(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function session() { try { return localStorage.getItem(SESSION_KEY) || ''; } catch (error) { return ''; } }
  function saveSession(value) { try { if (value) localStorage.setItem(SESSION_KEY, value); else localStorage.removeItem(SESSION_KEY); } catch (error) {} }
  async function firebaseContext() {
    const app = await import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js');
    const authMod = await import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js');
    const store = await import('https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js');
    const firebaseApp = app.getApps()[0] || app.initializeApp({ apiKey:'AIzaSyAPUT8_pLNxdh5tbGpAmXBJiID3jVcA9DY', authDomain:'biglwa.firebaseapp.com', projectId:'biglwa', appId:'1:83232670555:web:e04927b20458390b3b507e' });
    return { app: firebaseApp, auth: authMod.getAuth(firebaseApp), store };
  }
  async function firebaseAuthToken() {
    try {
      const ctx = await firebaseContext();
      return ctx.auth.currentUser ? await ctx.auth.currentUser.getIdToken() : '';
    } catch (error) { return ''; }
  }
  async function accountSession() {
    var token = await firebaseAuthToken();
    if (!token) return '';
    try {
      var result = await fetch(API + '/session/account', { headers: { Authorization: 'Bearer ' + token } });
      var body = await result.json().catch(function () { return {}; });
      if (!result.ok) {
        /* An unreachable account endpoint and an account with no Instagram session look
           identical if both collapse to "not connected", so they are kept apart. */
        state.sessionLookupError = result.status === 404
          ? 'BIGLWA could not reach your account to restore Instagram on this device.'
          : (body.error || 'Your account could not be read from BIGLWA.');
        return '';
      }
      if (!body.connected) { state.sessionLookupError = ''; return ''; }
      state.sessionLookupError = '';
      return body.session || '';
    } catch (error) { state.sessionLookupError = 'BIGLWA could not reach your account to restore Instagram on this device.'; return ''; }
  }
  async function persistAccount(profile, media) {
    try {
      const ctx = await firebaseContext();
      const user = ctx.auth.currentUser;
      if (!user) return false;
      await ctx.store.setDoc(ctx.store.doc(ctx.store.getFirestore(ctx.app), 'users', user.uid), {
        orbit: { instagram: { connected: true, profile: profile || null, mediaCount: Array.isArray(media) ? media.length : 0, mediaIds: Array.isArray(media) ? media.map(function (item) { return String(item.id || ''); }).filter(Boolean).slice(0, 1000) : [], syncedAt: ctx.store.serverTimestamp() } },
        updatedAt: ctx.store.serverTimestamp()
      }, { merge: true });
      return true;
    } catch (error) { console.warn('BIGLWA Orbit account persistence:', error); return false; }
  }
  async function waitForOrbitPosts() {
    for (var attempt = 0; attempt < 120; attempt += 1) {
      var importer = window.__biglwaOrbitPosts;
      if (importer && typeof importer.importOrbitMedia === 'function') return importer;
      await new Promise(function (resolve) { setTimeout(resolve, 50); });
    }
    return null;
  }
  async function importToFeed() {
    var who = window.__biglwaIdentity;
    var importer = await waitForOrbitPosts();
    if (!importer) {
      throw new Error('BIGLWA Orbit storage did not finish loading. Reload the page and reconnect Instagram.');
    }
    state.importAttempted = true;
    var result = await importer.importOrbitMedia('instagram', state.media, state.profile, who || {});
    state.importsSaved = result.imported || 0;
    state.importsSkipped = result.skipped || 0;
    state.importsPartial = result.partial || 0;
    state.importWarning = (result && result.warning) || '';
    window.dispatchEvent(new CustomEvent('biglwa:orbit-imported', {
      detail: { source: 'instagram', imported: state.importsSaved }
    }));
    if (window.__biglwaFeed && typeof window.__biglwaFeed.refresh === 'function') {
      window.__biglwaFeed.refresh();
    }
    return result;
  }
  function api(path, options) {
    var settings = options || {};
    settings.headers = Object.assign({}, settings.headers || {}, session() ? { Authorization: 'Bearer ' + session() } : {});
    return fetch(API + path, settings).then(function (response) { return response.json().catch(function () { return {}; }).then(function (body) { if (!response.ok) { var failure = new Error(body.error || 'Instagram request failed.'); failure.status = response.status; throw failure; } return body; }); });
  }
  function status(message) {
    var toast = one('#biglwaInstagramStatus');
    if (!toast) { toast = document.createElement('div'); toast.id = 'biglwaInstagramStatus'; toast.setAttribute('role', 'status'); toast.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:12000;max-width:330px;padding:11px 14px;border:1px solid rgba(80,70,64,.2);border-radius:12px;background:rgba(250,247,241,.96);box-shadow:0 12px 34px rgba(0,0,0,.14);font:600 11px/1.4 system-ui;color:#302b28'; document.body.appendChild(toast); }
    toast.textContent = message; clearTimeout(status.timer); status.timer = setTimeout(function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 6000);
  }
  /* /studio is a stub that rebuilds the query and would drop the handoff code, so the
     return goes to the site root the app actually runs from. */
  function connect() { window.location.assign(API + '/oauth/start?return_to=' + encodeURIComponent('https://biglwa.com/?route=studio&view=orbit')); }
  async function restore() {
    var savedSession = session();
    if (!savedSession) {
      savedSession = await accountSession();
      if (savedSession) saveSession(savedSession);
    }
    if (!savedSession) {
      if (state.sessionLookupError) status(state.sessionLookupError);
      return Promise.resolve();
    }
    return Promise.all([api('/instagram/profile'), api('/instagram/media')]).then(function (responses) {
      state.profile = responses[0]; state.media = responses[1].data || []; state.connected = true; state.error = ''; render();
      /* Loading and saving fail for different reasons and need different words. Sharing one
         catch made a failed save read as "Instagram could not load", so a member whose
         connection was healthy saw a broken connection and never learned the save failed. */
      return importToFeed().then(function (result) {
        state.importError = '';
        if (result && result.warning) status(result.warning);
        return persistAccount(state.profile, state.media);
      }).then(function () {
        render();
        window.dispatchEvent(new CustomEvent('biglwa:instagram-restored'));
        return true;
      }, function (importFailure) {
        state.importError = importFailure.message;
        state.error = '';
        render();
        status('Instagram is connected, but this device could not save it to your account: ' + importFailure.message);
        window.dispatchEvent(new CustomEvent('biglwa:instagram-restored'));
        return true;
      });
    }).catch(function (error) {
      /* Only an expired credential may end the connection. A dropped connection or an
         Instagram-side fault used to discard the session, so one bad moment forced the
         member through the whole authorisation flow again. */
      if (error.status === 401) { saveSession(''); state.connected = false; }
      state.error = error.message;
      render();
    });
  }
  function consumeHandoff() {
    var url = new URL(window.location.href); var handoff = url.searchParams.get('instagram_handoff') || RETURNED_HANDOFF; var error = url.searchParams.get('instagram_error') || RETURNED_ERROR; RETURNED_HANDOFF = ''; RETURNED_ERROR = '';
    if (error) { url.searchParams.delete('instagram_error'); history.replaceState({}, '', url.pathname + (url.search ? url.search : '') + url.hash); status(error); }
    if (!handoff) return restore();
    url.searchParams.delete('instagram_handoff'); history.replaceState({}, '', url.pathname + (url.search ? url.search : '') + url.hash);
    return firebaseAuthToken().then(function (firebaseIdToken) { return api('/session/exchange', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ handoff: handoff, firebaseIdToken: firebaseIdToken }) }); }).then(function (result) { saveSession(result.session); return restore(); }).then(function () { status('Instagram is connected to Orbit.'); }).catch(function (failure) { status(failure.message); });
  }
  function disconnect() { return api('/instagram/disconnect', { method: 'POST' }).catch(function () {}).then(function () { saveSession(''); state.connected = false; state.profile = null; state.media = []; render(); status('Instagram disconnected from Orbit.'); }); }
  function render() {
    try {
      all('[data-orbit-app="instagram"]').forEach(function (tile) { tile.classList.toggle('orbit-connected', state.connected); tile.setAttribute('aria-label', state.connected ? 'View connected Instagram account' : 'Connect Instagram'); var small = one('small', tile); if (small) small.textContent = state.connected ? 'Connected' : 'Connect'; });
      all('[data-orbit-path="instagram"]').forEach(function (input) { var row = input.closest('.module-orbit-row'); var actions = row ? one('.module-actions', row) : null; if (!actions) return; var button = one('[data-instagram-connect]', actions); if (!button) { button = document.createElement('button'); button.type = 'button'; button.className = 'module-action'; button.setAttribute('data-instagram-connect', '1'); actions.insertBefore(button, actions.firstChild); } button.textContent = state.connected ? 'Connected' : 'Connect Instagram'; button.setAttribute('aria-pressed', state.connected ? 'true' : 'false'); });
      renderFeed();
    } catch (error) { console.error('BIGLWA Instagram render isolated:', error); }
  }
  function importStatusHtml() {
    if (!state.connected || !state.importAttempted) return '';
    var parts = [];
    parts.push('Instagram returned ' + state.media.length + ' item' + (state.media.length === 1 ? '' : 's') + '.');
    parts.push('Saved to your BIGLWA account: ' + state.importsSaved + '.');
    if (state.importsSkipped) parts.push('Skipped (no usable picture): ' + state.importsSkipped + '.');
    if (state.importsPartial) parts.push('Only partly saved: ' + state.importsPartial + '. Your BIGLWA security rules still need publishing.');
    if (state.importWarning) parts.push(state.importWarning);
    return '<article class="module-list-item instagram-feed-item biglwa-instagram-import-status" data-instagram-import-status><div>' +
      '<b>Import status</b><small>' + escapeText(parts.join(' ')) + '</small>' +
      '<button type="button" class="module-action" data-instagram-resave>Save to BIGLWA again</button>' +
      '</div></article>';
  }
  function feedHtml() {
    if (state.error) {
      return '<article class="module-list-item instagram-feed-item"><div><b>Instagram could not load</b><small>' + escapeText(state.error) + '</small></div></article>';
    }
    if (state.importError) {
      return '<article class="module-list-item instagram-feed-item"><div><b>Instagram is connected but nothing was saved</b><small>' + escapeText(state.importError) + '</small>' +
        '<button type="button" class="module-action" data-instagram-resave>Try saving again</button></div></article>';
    }
    if (!state.connected) return '';
    var cards = state.media.slice(0, 20).map(function (item, index) {
      var children = item.children && Array.isArray(item.children.data) ? item.children.data.filter(function (child) {
        return child && (child.media_url || child.thumbnail_url);
      }) : [];
      var carousel = item.media_type === 'CAROUSEL_ALBUM' && children.length > 1;
      var mediaItems = carousel ? children : [item];
      var first = mediaItems[0] || item;
      var media = first.media_url || first.thumbnail_url || '';
      var visual = first.media_type === 'VIDEO'
        ? '<video data-instagram-media preload="metadata" poster="' + escapeText(first.thumbnail_url || '') + '" src="' + escapeText(first.media_url || '') + '" style="display:block;width:100%;height:auto;max-height:none;object-fit:contain;background:#efe7dd"></video>'
        : '<img data-instagram-media src="' + escapeText(media) + '" alt="Instagram media" loading="lazy" style="display:block;width:100%;height:auto;max-height:none;object-fit:contain;background:#efe7dd">';
      var tabs = carousel ? '<div class="biglwa-instagram-tabs" aria-label="Carousel photos">' + mediaItems.map(function (_, tabIndex) {
        return '<button type="button" class="biglwa-instagram-tab' + (tabIndex === 0 ? ' is-active' : '') + '" data-instagram-tab="' + tabIndex + '">' + (tabIndex + 1) + '</button>';
      }).join('') + '</div>' : '';
      var link = item.permalink || '#';
      return '<article class="module-list-item instagram-feed-item biglwa-instagram-card" data-instagram-index="' + index + '">' +
        '<div style="width:100%;padding:0">' +
          '<div class="biglwa-instagram-strip">' +
            tabs +
            '<div class="biglwa-instagram-actions" aria-label="Instagram post actions">' +
              '<button type="button" data-instagram-hide aria-label="Remove from feed" title="Remove from feed"></button>' +
              '<button type="button" data-instagram-hide aria-label="Archive" title="Archive"></button>' +
              '<a href="' + escapeText(link) + '" target="_blank" rel="noopener noreferrer" data-instagram-open aria-label="Open on Instagram" title="Open on Instagram"></a>' +
            '</div>' +
          '</div>' +
          visual +
        '</div>' +
      '</article>';
    });
    if (!cards.length) cards.push('<article class="module-list-item instagram-feed-item"><div><b>Instagram is connected</b><small>No media was returned for this account.</small></div></article>');
    return importStatusHtml() + cards.join('');
  }
  /* Instagram belongs in Archive. It is connected content, not a second renderer for
     the member's Studio/profile feed.

     This function used to delete the cards and insert nothing, and feedHtml() was never
     called from anywhere in the file. Instagram was also the only provider that never
     registered with the shared feed mount, so it was the only one that stayed invisible
     after connecting. Both are fixed here: the cards are inserted into the list, and the
     source is registered with the same mount TikTok, Pinterest and Facebook use. */
  function renderFeed(list) {
    list = list || one('#feedPageList');
    if (!list) return;
    all('.instagram-feed-item', list).forEach(function (item) { item.remove(); });
    var html = feedHtml();
    if (html) list.insertAdjacentHTML('afterbegin', html);
  }
  if (window.BIGLWAFeedMount) window.BIGLWAFeedMount('Instagram', 'instagram-feed-item', renderFeed);
  document.addEventListener('click', function (event) {
    var tab = event.target && event.target.closest ? event.target.closest('[data-instagram-tab]') : null;
    if (tab) {
      var card = tab.closest('.instagram-feed-item');
      var cardIndex = card ? Number(card.getAttribute('data-instagram-index')) : -1;
      var item = state.media[cardIndex];
      var children = item && item.children && Array.isArray(item.children.data) ? item.children.data.filter(function (child) {
        return child && (child.media_url || child.thumbnail_url);
      }) : [];
      var nextIndex = Number(tab.getAttribute('data-instagram-tab'));
      var next = children[nextIndex];
      if (card && next) {
        var media = next.media_url || next.thumbnail_url || '';
        var old = card.querySelector('[data-instagram-media]');
        if (old) {
          if (next.media_type === 'VIDEO') {
            var video = document.createElement('video');
            video.setAttribute('data-instagram-media','');
            video.controls = false;
            video.preload = 'metadata';
            video.poster = next.thumbnail_url || '';
            video.src = next.media_url || '';
            video.style.cssText = 'display:block;width:100%;height:auto;max-height:none;object-fit:contain;background:#efe7dd';
            old.replaceWith(video);
          } else {
            old.src = media;
            old.removeAttribute('poster');
          }
        }
        all('.biglwa-instagram-tab', card).forEach(function (button) { button.classList.remove('is-active'); });
        tab.classList.add('is-active');
      }
      return;
    }
    var resave = event.target && event.target.closest ? event.target.closest('[data-instagram-resave]') : null;
    if (resave) {
      event.preventDefault();
      event.stopImmediatePropagation();
      status('Saving your Instagram media to BIGLWA…');
      importToFeed().then(function (result) {
        state.importError = '';
        state.importAttempted = true;
        render();
        if (window.__biglwaFeed && typeof window.__biglwaFeed.refresh === 'function') window.__biglwaFeed.refresh();
        status('Saved ' + ((result && result.imported) || 0) + ' item(s) to your BIGLWA account.');
      }, function (failure) {
        state.importError = failure.message;
        render();
        status('Could not save: ' + failure.message);
      });
      return;
    }
    var hide = event.target && event.target.closest ? event.target.closest('[data-instagram-hide]') : null;
    if (hide) {
      var card = hide.closest('.instagram-feed-item');
      if (card) card.remove();
      return;
    }
 var target = event.target && event.target.closest ? event.target : null; if (!target) return; if (target.closest('[data-orbit-app="instagram"],[data-instagram-connect]')) { event.preventDefault(); event.stopImmediatePropagation(); connect(); return; } if (target.closest('[data-instagram-disconnect]')) { event.preventDefault(); disconnect(); return; } if (target.closest('[data-open="orbit"],[data-open="feed"]')) setTimeout(render, 80); }, true);
  window.__biglwaInstagramOrbit = { connect: connect, disconnect: disconnect, restore: restore, state: state, render: render, renderFeed: renderFeed };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { render(); consumeHandoff(); }, { once: true }); else { render(); consumeHandoff(); }
}());
