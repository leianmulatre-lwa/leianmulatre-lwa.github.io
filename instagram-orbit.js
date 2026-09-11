(function () {
  'use strict';
  if (window.__biglwaInstagramOrbit) return;

  var API = 'https://biglwa-instagram-api.leianmulatre-284.workers.dev';
  var SESSION_KEY = 'biglwaInstagramSession';
  var state = { connected: false, profile: null, media: [], error: '' };
  function one(selector, root) { return (root || document).querySelector(selector); }
  function all(selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }
  function escapeText(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function session() { try { return localStorage.getItem(SESSION_KEY) || ''; } catch (error) { return ''; } }
  function saveSession(value) { try { if (value) localStorage.setItem(SESSION_KEY, value); else localStorage.removeItem(SESSION_KEY); } catch (error) {} }
  function api(path, options) {
    var settings = options || {};
    settings.headers = Object.assign({}, settings.headers || {}, session() ? { Authorization: 'Bearer ' + session() } : {});
    return fetch(API + path, settings).then(function (response) { return response.json().catch(function () { return {}; }).then(function (body) { if (!response.ok) throw new Error(body.error || 'Instagram request failed.'); return body; }); });
  }
  function status(message) {
    var toast = one('#biglwaInstagramStatus');
    if (!toast) { toast = document.createElement('div'); toast.id = 'biglwaInstagramStatus'; toast.setAttribute('role', 'status'); toast.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:12000;max-width:330px;padding:11px 14px;border:1px solid rgba(80,70,64,.2);border-radius:12px;background:rgba(250,247,241,.96);box-shadow:0 12px 34px rgba(0,0,0,.14);font:600 11px/1.4 system-ui;color:#302b28'; document.body.appendChild(toast); }
    toast.textContent = message; clearTimeout(status.timer); status.timer = setTimeout(function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 6000);
  }
  function connect() { window.location.assign(API + '/oauth/start?return_to=' + encodeURIComponent('https://biglwa.com/studio?view=orbit')); }
  function restore() {
    if (!session()) return Promise.resolve();
    return Promise.all([api('/instagram/profile'), api('/instagram/media')]).then(function (responses) { state.profile = responses[0]; state.media = responses[1].data || []; state.connected = true; state.error = ''; render(); }).catch(function (error) { saveSession(''); state.connected = false; state.error = error.message; render(); });
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
  function renderFeed() {
    var list = one('#feedPageList'); if (!list) return;
    all('.instagram-feed-item', list).forEach(function (item) { item.remove(); });
    if (!state.connected) return;
    var cards = state.media.slice(0, 20).map(function (item) {
      var caption = item.caption || 'Shared from Instagram'; var visual = '';
      if (item.media_type === 'VIDEO') visual = '<video controls preload="metadata" poster="' + escapeText(item.thumbnail_url || '') + '" style="display:block;width:100%;max-height:520px;border-radius:12px;background:#171414"><source src="' + escapeText(item.media_url || '') + '"></video>';
      else visual = '<img src="' + escapeText(item.media_url || item.thumbnail_url || '') + '" alt="' + escapeText(caption) + '" loading="lazy" style="display:block;width:100%;max-height:520px;object-fit:cover;border-radius:12px">';
      return '<article class="module-list-item instagram-feed-item"><div style="width:100%"><small>Instagram · @' + escapeText(state.profile && state.profile.username || '') + '</small><b style="display:block;margin:4px 0 8px">' + escapeText(caption) + '</b>' + visual + (item.permalink ? '<a class="module-action ghost" href="' + escapeText(item.permalink) + '" target="_blank" rel="noopener noreferrer" style="display:inline-flex;margin-top:9px">View on Instagram</a>' : '') + '</div></article>';
    });
    if (!cards.length) cards.push('<article class="module-list-item instagram-feed-item"><div><b>Instagram is connected</b><small>No media was returned for this account.</small></div></article>');
    list.insertAdjacentHTML('afterbegin', cards.join(''));
  }
  document.addEventListener('click', function (event) { var target = event.target && event.target.closest ? event.target : null; if (!target) return; if (target.closest('[data-orbit-app="instagram"],[data-instagram-connect]')) { event.preventDefault(); event.stopImmediatePropagation(); connect(); return; } if (target.closest('[data-instagram-disconnect]')) { event.preventDefault(); disconnect(); return; } if (target.closest('[data-open="orbit"],[data-open="feed"]')) setTimeout(render, 80); }, true);
  window.__biglwaInstagramOrbit = { connect: connect, disconnect: disconnect, restore: restore, state: state, render: render };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { render(); consumeHandoff(); }, { once: true }); else { render(); consumeHandoff(); }
}());
