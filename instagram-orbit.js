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
    '#feedPageList>.instagram-feed-item img,#feedPageList>.instagram-feed-item video{border-radius:0!important}',
    '#feedPageList>.instagram-feed-item .biglwa-instagram-strip{height:30px;box-sizing:border-box;padding:4px 6px 4px 7px;',
    'display:flex;align-items:center;justify-content:flex-end;gap:4px;position:relative;z-index:8;',
    'background:rgba(var(--aura-rgb,216,95,109),.78);border-radius:15px 15px 0 0;',
    'border-bottom:1px solid rgba(255,255,255,.28)}',
    '#feedPageList>.instagram-feed-item .biglwa-instagram-actions{display:flex;align-items:center;gap:4px;margin-left:auto}',
    '#feedPageList>.instagram-feed-item .biglwa-instagram-actions button,',
    '#feedPageList>.instagram-feed-item .biglwa-instagram-actions a{width:20px;height:20px;min-width:20px;padding:0;border:1px solid rgba(255,255,255,.62);',
    'border-radius:50%;display:grid;place-items:center;color:#fff;text-decoration:none;font:800 10px/1 system-ui;',
    'cursor:pointer;box-shadow:0 1px 3px rgba(24,16,14,.18);background:#bd3f47}',
    '#feedPageList>.instagram-feed-item .biglwa-instagram-actions button:nth-child(2){background:#d1ad2f;color:#302719}',
    '#feedPageList>.instagram-feed-item .biglwa-instagram-actions a{background:#4e8f61}',
    '#feedPageList>.instagram-feed-item .biglwa-instagram-actions button:hover,',
    '#feedPageList>.instagram-feed-item .biglwa-instagram-actions a:hover{filter:brightness(1.08);transform:translateY(-1px)}',
    '#feedPageList>.instagram-feed-item .biglwa-instagram-tabs{display:flex;align-items:flex-end;gap:3px;min-width:0;margin-right:auto;height:22px}',
    '#feedPageList>.instagram-feed-item .biglwa-instagram-tab{height:18px;min-width:19px;padding:0 6px;border:0;',
    'border-radius:5px 5px 2px 2px;background:rgba(255,255,255,.28);color:#fff;font:800 8px/18px system-ui;cursor:pointer;',
    'box-shadow:inset 0 -1px 0 rgba(255,255,255,.2)}',
    '#feedPageList>.instagram-feed-item .biglwa-instagram-tab.is-active{background:#f1e9e1;color:#5f514a;height:21px;',
    'box-shadow:0 -1px 0 rgba(255,255,255,.35)}'
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
      return '<article class="module-list-item instagram-feed-item" data-instagram-index="' + index + '">' +
        '<div style="width:100%;padding:0">' +
          '<div class="biglwa-instagram-strip">' +
            tabs +
            '<div class="biglwa-instagram-actions" aria-label="Instagram post actions">' +
              '<button type="button" data-instagram-hide aria-label="Remove from feed" title="Remove from feed">×</button>' +
              '<button type="button" data-instagram-hide aria-label="Archive" title="Archive">⌄</button>' +
              '<a href="' + escapeText(link) + '" target="_blank" rel="noopener noreferrer" data-instagram-open aria-label="Open on Instagram" title="Open on Instagram">↗</a>' +
            '</div>' +
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
