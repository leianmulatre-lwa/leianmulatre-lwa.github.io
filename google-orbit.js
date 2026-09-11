(function () {
  'use strict';
  if (window.__biglwaGoogleOrbit) { return; }

  var CLIENT_ID = '208529705083-q6hlebsrlt1n5i78ubtubf1nrg9gv488.apps.googleusercontent.com';
  var SCOPES = [
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/drive.metadata.readonly',
    'https://www.googleapis.com/auth/calendar.readonly'
  ].join(' ');
  var tokenClient = null;
  var accessToken = '';
  var loadingPromise = null;
  var state = { connected: false, drive: [], calendar: [], youtube: null, error: '' };

  function one(selector, root) { return (root || document).querySelector(selector); }
  function all(selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }
  function escapeText(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }

  function showStatus(message) {
    var toast = one('#biglwaGoogleOrbitStatus');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'biglwaGoogleOrbitStatus';
      toast.setAttribute('role', 'status');
      toast.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:12000;max-width:330px;padding:11px 14px;border:1px solid rgba(80,70,64,.2);border-radius:12px;background:rgba(250,247,241,.96);box-shadow:0 12px 34px rgba(0,0,0,.14);font:600 11px/1.4 system-ui;color:#302b28';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    window.clearTimeout(showStatus.timer);
    showStatus.timer = window.setTimeout(function () { if (toast.parentNode) { toast.parentNode.removeChild(toast); } }, 6000);
  }

  function loadGoogleIdentity() {
    if (window.google && window.google.accounts && window.google.accounts.oauth2) { return Promise.resolve(); }
    if (loadingPromise) { return loadingPromise; }
    loadingPromise = new Promise(function (resolve, reject) {
      var prior = one('script[data-biglwa-google-identity]');
      if (prior) {
        prior.addEventListener('load', resolve, { once: true });
        prior.addEventListener('error', reject, { once: true });
        return;
      }
      var script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.setAttribute('data-biglwa-google-identity', '1');
      script.onload = resolve;
      script.onerror = function () { reject(new Error('Google Identity Services could not load.')); };
      document.head.appendChild(script);
    });
    return loadingPromise;
  }

  function googleApi(url) {
    return fetch(url, { headers: { Authorization: 'Bearer ' + accessToken } }).then(function (response) {
      if (response.ok) { return response.json(); }
      return response.text().then(function (body) { throw new Error('Google API ' + response.status + ': ' + body.slice(0, 180)); });
    });
  }

  function loadData() {
    var now = encodeURIComponent(new Date().toISOString());
    return Promise.allSettled([
      googleApi('https://www.googleapis.com/drive/v3/files?pageSize=5&orderBy=modifiedTime%20desc&fields=files(id,name,mimeType,modifiedTime,webViewLink)'),
      googleApi('https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=5&singleEvents=true&orderBy=startTime&timeMin=' + now),
      googleApi('https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true')
    ]).then(function (results) {
      if (results[0].status === 'fulfilled') { state.drive = results[0].value.files || []; }
      if (results[1].status === 'fulfilled') { state.calendar = results[1].value.items || []; }
      if (results[2].status === 'fulfilled') { state.youtube = (results[2].value.items || [])[0] || null; }
      render();
    });
  }

  function connect() {
    loadGoogleIdentity().then(function () {
      if (!tokenClient) {
        tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: function (response) {
            if (response.error) {
              state.error = response.error;
              showStatus('Google connection failed: ' + response.error);
              render();
              return;
            }
            accessToken = response.access_token;
            state.connected = true;
            state.error = '';
            showStatus('Google Orbit connected. Loading Calendar, Drive, and YouTube...');
            loadData().then(function () {
              showStatus('Google Calendar, Drive, and YouTube are connected.');
            }).catch(function (error) {
              state.error = error.message;
              showStatus(error.message);
              render();
            });
          }
        });
      }
      tokenClient.requestAccessToken({ prompt: state.connected ? '' : 'consent' });
    }).catch(function (error) {
      state.error = error.message;
      showStatus(error.message);
      render();
    });
  }

  function disconnect() {
    function done() {
      accessToken = '';
      state.connected = false;
      state.drive = [];
      state.calendar = [];
      state.youtube = null;
      render();
      showStatus('Google Orbit disconnected.');
    }
    if (accessToken && window.google && window.google.accounts && window.google.accounts.oauth2) {
      window.google.accounts.oauth2.revoke(accessToken, done);
    } else { done(); }
  }

  function preview(kind) {
    if (!state.connected) { return ''; }
    if (kind === 'drive') {
      return state.drive.slice(0, 3).map(function (item) { return '<li>' + escapeText(item.name) + '</li>'; }).join('');
    }
    if (kind === 'calendar') {
      return state.calendar.slice(0, 3).map(function (item) { return '<li>' + escapeText(item.summary || 'Untitled event') + '</li>'; }).join('');
    }
    if (kind === 'youtube' && state.youtube) {
      return '<li>' + escapeText((state.youtube.snippet && state.youtube.snippet.title) || 'YouTube channel') + '</li><li>' + escapeText((state.youtube.statistics && state.youtube.statistics.subscriberCount) || '0') + ' subscribers</li>';
    }
    return '';
  }

  function ensureFacebook() {
    var grid = one('#orbitGrid');
    if (!grid || one('[data-orbit-app="facebook"]', grid)) { return; }
    var tile = document.createElement('button');
    tile.type = 'button';
    tile.setAttribute('data-orbit-app', 'facebook');
    tile.innerHTML = '<span class="orbit-glyph">FB</span><b>Facebook</b><small>Link</small>';
    grid.appendChild(tile);
  }

  function render() {
    try {
      ensureFacebook();
      ['youtube', 'drive', 'calendar'].forEach(function (kind) {
        all('[data-orbit-app="' + kind + '"]').forEach(function (tile) {
          tile.setAttribute('aria-label', (state.connected ? 'View connected ' : 'Connect ') + kind);
          var small = one('small', tile);
          if (small) { small.textContent = state.connected ? 'Connected' : 'Connect'; }
          tile.classList.toggle('orbit-connected', state.connected);
        });
        all('[data-orbit-path="' + kind + '"]').forEach(function (input) {
          var row = input.closest('.module-orbit-row');
          var actions = row ? one('.module-actions', row) : null;
          if (!actions) { return; }
          var button = one('[data-google-orbit-connect="' + kind + '"]', actions);
          if (!button) {
            button = document.createElement('button');
            button.type = 'button';
            button.className = 'module-action';
            button.setAttribute('data-google-orbit-connect', kind);
            actions.insertBefore(button, actions.firstChild);
          }
          button.textContent = state.connected ? 'Connected' : 'Connect Google';
          button.setAttribute('aria-pressed', state.connected ? 'true' : 'false');
        });
        all('[data-google-orbit-card="' + kind + '"]').forEach(function (card) {
          var list = one('ul', card);
          if (list) { list.innerHTML = preview(kind) || '<li>' + (state.connected ? 'No recent items found.' : 'Not connected') + '</li>'; }
        });
      });
      document.body.classList.toggle('google-orbit-connected', state.connected);
    } catch (error) { window.console.error('BIGLWA Orbit render isolated:', error); }
  }

  document.addEventListener('click', function (event) {
    var target = event.target && event.target.closest ? event.target : null;
    if (!target) { return; }
    var tile = target.closest('[data-orbit-app="youtube"],[data-orbit-app="drive"],[data-orbit-app="calendar"],[data-google-orbit-connect]');
    if (tile) {
      event.preventDefault();
      event.stopImmediatePropagation();
      connect();
      return;
    }
    if (target.closest('[data-google-orbit-disconnect]')) { event.preventDefault(); disconnect(); return; }
    if (target.closest('[data-open="orbit"]')) { window.setTimeout(render, 0); }
  }, true);

  window.__biglwaGoogleOrbit = { connect: connect, disconnect: disconnect, state: state, render: render };
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', render, { once: true }); }
  else { render(); }
}());
