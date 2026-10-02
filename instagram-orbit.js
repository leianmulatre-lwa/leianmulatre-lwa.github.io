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
        status(error.message || 'Instagram connected, but the feed drafts could not be saved.');
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
  function restore() {
    if (!session()) return Promise.resolve();
    return Promise.all([api('/instagram/profile'), api('/instagram/media')]).then(function (responses) {
      state.profile = responses[0]; state.media = responses[1].data || []; state.connected = true; state.error = ''; render();
      return importToFeed().then(function () { render(); });
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
    return api('/session/exchange', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ handoff: handoff }) }).then(function (result) { saveSession(result.session); return restore(); }).then(function () { status('Instagram is connected to Orbit.'); }).catch(function (failure) { status(failure.message); });
  }
  function disconnect() { return api('/instagram/disconnect', { method: 'POST' }).catch(function () {}).then(function () { saveSession(''); state.connected = false; state.profile = null; state.media = []; render(); status('Instagram disconnected from Orbit.'); }); }
  function render() {
    try {
      all('[data-orbit-app="instagram"]').forEach(function (tile) { tile.classList.toggle('orbit-connected', state.connected); tile.setAttribute('aria-label', state.connected ? 'View connected Instagram account' : 'Connect Instagram'); var small = one('small', tile); if (small) small.textContent = state.connected ? 'Connected' : 'Connect'; });
      all('[data-orbit-path="instagram"]').forEach(function (input) { var row = input.closest('.module-orbit-row'); var actions = row ? one('.module-actions', row) : null; if (!actions) return; var button = one('[data-instagram-connect]', actions); if (!button) { button = document.createElement('button'); button.type = 'button'; button.className = 'module-action'; button.setAttribute('data-instagram-connect', '1'); actions.insertBefore(button, actions.firstChild); } button.textContent = state.connected ? 'Connected' : 'Connect Instagram'; button.setAttribute('aria-pressed', state.connected ? 'true' : 'false'); });
      renderFeed();
    } catch (error) { console.error('BIGLWA Instagram render isolated:', error); }
  }
  var INSTAGRAM_CARD_STYLE = [
    '#feedPageList>.instagram-feed-item{position:relative!important;min-width:0!important;overflow:visible!important;',
    'border:1px solid #dfd4ca!important;border-radius:16px!important;background:#f1e9e1!important;',
    'padding:0!important;box-shadow:3px 3px 0 #bd3f47!important;display:block!important;width:100%!important}',
    '#feedPageList>.instagram-feed-item:nth-child(6n+1){box-shadow:3px 3px 0 #bd3f47!important}',
    '#feedPageList>.instagram-feed-item:nth-child(6n+2){box-shadow:3px 3px 0 #d77b30!important}',
    '#feedPageList>.instagram-feed-item:nth-child(6n+3){box-shadow:3px 3px 0 #d1ad2f!important}',
    '#feedPageList>.instagram-feed-item:nth-child(6n+4){box-shadow:3px 3px 0 #4e8f61!important}',
    '#feedPageList>.instagram-feed-item:nth-child(6n+5){box-shadow:3px 3px 0 #416fa9!important}',
    '#feedPageList>.instagram-feed-item:nth-child(6n+6){box-shadow:3px 3px 0 #7955a0!important}',
    '#feedPageList>.instagram-feed-item>div{padding:0!important}',
    '#feedPageList>.instagram-feed-item img,#feedPageList>.instagram-feed-item video{border-radius:15px 15px 0 0!important}',
    '#feedPageList>.instagram-feed-item .biglwa-instagram-actions{position:absolute;top:10px;right:10px;z-index:8;display:flex;gap:6px}',
    '#feedPageList>.instagram-feed-item .biglwa-instagram-actions button,',
    '#feedPageList>.instagram-feed-item .biglwa-instagram-actions a{width:28px;height:28px;padding:0;border:1px solid rgba(255,255,255,.7);border-radius:50%;',
    'display:grid;place-items:center;color:#fff;text-decoration:none;font:800 13px/1 system-ui;cursor:pointer;',
    'box-shadow:0 2px 7px rgba(24,16,14,.24);background:#bd3f47}',
    '#feedPageList>.instagram-feed-item .biglwa-instagram-actions button:nth-child(2){background:#d1ad2f;color:#302719}',
    '#feedPageList>.instagram-feed-item .biglwa-instagram-actions a{background:#4e8f61}',
    '#feedPageList>.instagram-feed-item .biglwa-instagram-actions button:hover,',
    '#feedPageList>.instagram-feed-item .biglwa-instagram-actions a:hover{filter:brightness(1.08);transform:translateY(-1px)}'
  ].join('');
  if (!document.getElementById('biglwaInstagramCardStyle')) {
    var instagramStyle = document.createElement('style');
    instagramStyle.id = 'biglwaInstagramCardStyle';
    instagramStyle.textContent = INSTAGRAM_CARD_STYLE;
    (document.head || document.documentElement).appendChild(instagramStyle);
  }

  function feedHtml() {
    if (state.error) {
      return '<article class="module-list-item instagram-feed-item"><div><b>Instagram could not load</b><small>' + escapeText(state.error) + '</small></div></article>';
    }
    if (!state.connected) return '';
    var cards = state.media.slice(0, 20).map(function (item, index) {
      var visual = '';
      var media = item.media_url || item.thumbnail_url || '';
      if (item.media_type === 'VIDEO') {
        visual = '<video preload="metadata" poster="' + escapeText(item.thumbnail_url || '') + '" src="' + escapeText(item.media_url || '') + '" style="display:block;width:100%;height:auto;max-height:none;object-fit:contain;border-radius:15px 15px 0 0;background:#efe7dd"></video>';
      } else {
        visual = '<img src="' + escapeText(media) + '" alt="Instagram media" loading="lazy" style="display:block;width:100%;height:auto;max-height:none;object-fit:contain;border-radius:15px 15px 0 0;background:#efe7dd">';
      }
      var link = item.permalink || '#';
      return '<article class="module-list-item instagram-feed-item" data-instagram-index="' + index + '">' +
        '<div style="width:100%;padding:0">' +
          '<div class="biglwa-instagram-actions" aria-label="Instagram post actions">' +
            '<button type="button" data-instagram-hide aria-label="Remove from feed" title="Remove from feed">×</button>' +
            '<button type="button" data-instagram-hide aria-label="Archive" title="Archive">⌄</button>' +
            '<a href="' + escapeText(link) + '" target="_blank" rel="noopener noreferrer" data-instagram-open aria-label="Open on Instagram" title="Open on Instagram">↗</a>' +
          '</div>' +
          visual +
        '</div>' +
      '</article>';
    });
    if (!cards.length) cards.push('<article class="module-list-item instagram-feed-item"><div><b>Instagram is connected</b><small>No media was returned for this account.</small></div></article>');
    return cards.join('');
  }
  function renderFeed(list) {
    list = list || one('#feedPageList');
    if (!list) return;
    all('.instagram-feed-item', list).forEach(function (item) { item.remove(); });
    var html = feedHtml();
    if (html) list.insertAdjacentHTML('afterbegin', html);
  }
  if (window.BIGLWAFeedMount) window.BIGLWAFeedMount('Instagram', 'instagram-feed-item', renderFeed);
  document.addEventListener('click', function (event) {
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
