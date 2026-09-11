(function () {
  'use strict';
  if (window.__biglwaFacebookOrbit) { return; }

  var APP_ID = '3959002817740866';
  var API_VERSION = 'v25.0';
  var sdkPromise = null;
  var state = { connected: false, profile: null, photos: [], videos: [], permissions: [], error: '' };

  function one(selector, root) { return (root || document).querySelector(selector); }
  function all(selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }
  function escapeText(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }

  function showStatus(message) {
    var toast = one('#biglwaFacebookOrbitStatus');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'biglwaFacebookOrbitStatus';
      toast.setAttribute('role', 'status');
      toast.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:12000;max-width:330px;padding:11px 14px;border:1px solid rgba(80,70,64,.2);border-radius:12px;background:rgba(250,247,241,.96);box-shadow:0 12px 34px rgba(0,0,0,.14);font:600 11px/1.4 system-ui;color:#302b28';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    window.clearTimeout(showStatus.timer);
    showStatus.timer = window.setTimeout(function () {
      if (toast.parentNode) { toast.parentNode.removeChild(toast); }
    }, 6000);
  }

  function loadSDK() {
    if (window.FB && window.FB.login) { return Promise.resolve(); }
    if (sdkPromise) { return sdkPromise; }
    sdkPromise = new Promise(function (resolve, reject) {
      var completed = false;
      var timeout = window.setTimeout(function () {
        if (!completed) { reject(new Error('Facebook Login took too long to load. Please try again.')); }
      }, 12000);

      window.fbAsyncInit = function () {
        try {
          window.FB.init({ appId: APP_ID, cookie: true, xfbml: false, version: API_VERSION });
          completed = true;
          window.clearTimeout(timeout);
          resolve();
        } catch (error) {
          completed = true;
          window.clearTimeout(timeout);
          reject(error);
        }
      };

      var existing = one('script[data-biglwa-facebook-sdk]');
      if (existing) { return; }
      var script = document.createElement('script');
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      script.setAttribute('data-biglwa-facebook-sdk', '1');
      script.onerror = function () {
        completed = true;
        window.clearTimeout(timeout);
        sdkPromise = null;
        reject(new Error('Facebook Login could not load. Check your connection and try again.'));
      };
      document.head.appendChild(script);
    });
    return sdkPromise;
  }

  function render() {
    try {
      all('[data-orbit-app="facebook"]').forEach(function (tile) {
        tile.setAttribute('aria-label', state.connected ? 'View connected Facebook account' : 'Connect Facebook');
        tile.classList.toggle('orbit-connected', state.connected);
        var small = one('small', tile);
        if (small) { small.textContent = state.connected ? 'Connected' : 'Connect'; }
      });

      all('[data-orbit-path="facebook"]').forEach(function (input) {
        var row = input.closest('.module-orbit-row');
        var actions = row ? one('.module-actions', row) : null;
        if (!actions) { return; }
        var button = one('[data-facebook-orbit-connect]', actions);
        if (!button) {
          button = document.createElement('button');
          button.type = 'button';
          button.className = 'module-action';
          button.setAttribute('data-facebook-orbit-connect', '1');
          actions.insertBefore(button, actions.firstChild);
        }
        button.textContent = state.connected ? 'Connected' : 'Connect Facebook';
        button.setAttribute('aria-pressed', state.connected ? 'true' : 'false');
      });

      document.body.classList.toggle('facebook-orbit-connected', state.connected);
      renderFeedImports();
    } catch (error) {
      window.console.error('BIGLWA Facebook Orbit render isolated:', error);
    }
  }

  function facebookApi(path, parameters) {
    return new Promise(function (resolve) {
      window.FB.api(path, parameters || {}, function (response) {
        resolve(response && !response.error ? response : null);
      });
    });
  }

  function readGrantedPermissions() {
    return facebookApi('/me/permissions').then(function (response) {
      state.permissions = response && response.data ? response.data.filter(function (item) {
        return item.status === 'granted';
      }).map(function (item) { return item.permission; }) : [];
    });
  }

  function hasPermission(name) { return state.permissions.indexOf(name) !== -1; }

  function loadFacebookContent() {
    return readGrantedPermissions().then(function () {
      var requests = [
        facebookApi('/me', { fields: 'id,name,email,link,picture.width(200).height(200)' }),
        hasPermission('user_photos') ? facebookApi('/me/photos', { type: 'uploaded', fields: 'id,name,images,created_time,link', limit: 12 }) : Promise.resolve(null),
        hasPermission('user_videos') ? facebookApi('/me/videos', { fields: 'id,title,description,source,picture,created_time,permalink_url', limit: 8 }) : Promise.resolve(null)
      ];
      return Promise.allSettled(requests).then(function (results) {
        var profile = results[0].status === 'fulfilled' ? results[0].value : null;
        var photos = results[1].status === 'fulfilled' ? results[1].value : null;
        var videos = results[2].status === 'fulfilled' ? results[2].value : null;
        if (profile) { state.profile = profile; }
        state.photos = photos && photos.data ? photos.data : [];
        state.videos = videos && videos.data ? videos.data : [];
        render();
      });
    });
  }

  function photoUrl(photo) {
    return photo && photo.images && photo.images.length ? photo.images[0].source : '';
  }

  function renderFeedImports() {
    var list = one('#feedPageList');
    if (!list) { return; }
    all('.facebook-feed-item', list).forEach(function (item) { item.remove(); });
    if (!state.connected) { return; }

    var items = [];
    state.photos.forEach(function (photo) {
      var source = photoUrl(photo);
      if (!source) { return; }
      items.push('<article class="module-list-item facebook-feed-item" data-facebook-media="photo"><div style="width:100%"><small>Facebook · photo</small><b style="display:block;margin:4px 0 8px">' + escapeText(photo.name || 'Shared from Facebook') + '</b><img src="' + escapeText(source) + '" alt="' + escapeText(photo.name || 'Facebook photo') + '" loading="lazy" style="display:block;width:100%;max-height:460px;object-fit:cover;border-radius:12px">' + (photo.link ? '<a class="module-action ghost" href="' + escapeText(photo.link) + '" target="_blank" rel="noopener noreferrer" style="display:inline-flex;margin-top:9px">View on Facebook</a>' : '') + '</div></article>');
    });
    state.videos.forEach(function (video) {
      var title = video.title || video.description || 'Shared from Facebook';
      var media = video.source ? '<video controls preload="metadata" poster="' + escapeText(video.picture || '') + '" style="display:block;width:100%;max-height:460px;border-radius:12px;background:#171414"><source src="' + escapeText(video.source) + '"></video>' : (video.picture ? '<img src="' + escapeText(video.picture) + '" alt="' + escapeText(title) + '" loading="lazy" style="display:block;width:100%;max-height:460px;object-fit:cover;border-radius:12px">' : '');
      items.push('<article class="module-list-item facebook-feed-item" data-facebook-media="video"><div style="width:100%"><small>Facebook · video</small><b style="display:block;margin:4px 0 8px">' + escapeText(title) + '</b>' + media + (video.permalink_url ? '<a class="module-action ghost" href="' + escapeText(video.permalink_url) + '" target="_blank" rel="noopener noreferrer" style="display:inline-flex;margin-top:9px">View on Facebook</a>' : '') + '</div></article>');
    });

    if (!items.length) {
      items.push('<article class="module-list-item facebook-feed-item"><div><b>Facebook is connected</b><small>No approved photos or videos were returned. Meta may still require testing access or App Review for those permissions.</small></div></article>');
    }
    list.insertAdjacentHTML('afterbegin', items.join(''));
  }

  function connect() {
    loadSDK().then(function () {
      window.FB.login(function (response) {
        if (!response || !response.authResponse) {
          state.connected = false;
          state.error = 'Facebook authorization was cancelled or unavailable.';
          showStatus(state.error);
          render();
          return;
        }
        state.connected = true;
        state.error = '';
        loadFacebookContent().then(function () {
          showStatus('Facebook is connected. Approved media is ready in Collective Feed.');
          render();
        });
      }, { scope: 'public_profile,email,user_photos,user_videos,user_link', return_scopes: true });
    }).catch(function (error) {
      state.connected = false;
      state.error = error.message || 'Facebook Login could not start.';
      showStatus(state.error);
      render();
    });
  }

  function disconnect() {
    function done() {
      state.connected = false;
      state.profile = null;
      state.photos = [];
      state.videos = [];
      state.permissions = [];
      state.error = '';
      showStatus('Facebook disconnected from Orbit.');
      render();
    }
    if (window.FB && window.FB.logout && state.connected) { window.FB.logout(done); }
    else { done(); }
  }

  document.addEventListener('click', function (event) {
    var target = event.target && event.target.closest ? event.target : null;
    if (!target) { return; }
    var connectTarget = target.closest('[data-orbit-app="facebook"],[data-facebook-orbit-connect]');
    if (connectTarget) {
      event.preventDefault();
      event.stopImmediatePropagation();
      connect();
      return;
    }
    if (target.closest('[data-facebook-orbit-disconnect]')) {
      event.preventDefault();
      disconnect();
      return;
    }
    if (target.closest('[data-open="orbit"],[data-open="feed"]')) { window.setTimeout(render, 80); }
  }, true);

  window.__biglwaFacebookOrbit = { connect: connect, disconnect: disconnect, state: state, render: render };
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', render, { once: true }); }
  else { render(); }
}());
