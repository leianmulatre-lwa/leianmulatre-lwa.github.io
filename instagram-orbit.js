(function () {
  'use strict';
  if (window.__biglwaInstagramOrbit) return;

  var API = 'https://biglwa-instagram-api.leianmulatre-284.workers.dev';
  var SESSION_KEY = 'biglwaInstagramSession';
  var state = { connected: false, profile: null, media: [], error: '', importsSaved: 0 };
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
    const token = await firebaseAuthToken();
    if (!token) return '';
    try {
      const result = await fetch(API + '/session/account', { headers: { Authorization: 'Bearer ' + token } });
      const body = await result.json().catch(function () { return {}; });
      return body.connected ? (body.session || '') : '';
    } catch (error) { return ''; }
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
  function importToFeed() {
    var who = window.__biglwaIdentity;
    var importer = window.__biglwaOrbitPosts;
    if (!importer || typeof importer.importOrbitMedia !== 'function') return Promise.resolve();
    return importer.importOrbitMedia('instagram', state.media, state.profile, who || {})
      .then(function (result) {
        state.importsSaved = result.imported || 0;
        if (window.__biglwaFeed && typeof window.__biglwaFeed.refresh === 'function') window.__biglwaFeed.refresh();
        return result;
      })
      .catch(function (error) {
        console.error('BIGLWA Instagram draft import:', error);
        status(error.message || 'Instagram connected, but the imported media could not be saved to Big LWA.');
      });
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
    if (!savedSession) return Promise.resolve();
    return Promise.all([api('/instagram/profile'), api('/instagram/media')]).then(function (responses) {
      state.profile = responses[0]; state.media = responses[1].data || []; state.connected = true; state.error = ''; render(); window.dispatchEvent(new CustomEvent('biglwa:instagram-restored'));
      return Promise.all([importToFeed(), persistAccount(state.profile, state.media)]).then(function () { render(); });
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
    var url = new URL(window.location.href); var handoff = url.searchParams.get('instagram_handoff'); var error = url.searchParams.get('instagram_error');
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
  function feedHtml() {
    if (state.error) {
      return '<article class="module-list-item instagram-feed-item"><div><b>Instagram could not load</b><small>' + escapeText(state.error) + '</small></div></article>';
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
    return cards.join('');
  }
  /* Instagram belongs in Archive. It is connected content, not a second renderer for
     the member's Studio/profile feed. Older builds registered this source with the shared
     feed mount, which made every connected photo compete with the Collective Feed layout. */
  function renderFeed(list) {
    list = list || one('#feedPageList');
    if (!list) return;
    all('.instagram-feed-item', list).forEach(function (item) { item.remove(); });
  }
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
