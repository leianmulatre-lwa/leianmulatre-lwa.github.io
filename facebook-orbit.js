(function () {
  'use strict';
  if (window.__biglwaFacebookOrbit) { return; }

  var APP_ID = '3959002817740866';
  var API_VERSION = 'v25.0';
  var sdkPromise = null;
  var state = { connected: false, profile: null, error: '' };

  function one(selector, root) { return (root || document).querySelector(selector); }
  function all(selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }

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
    } catch (error) {
      window.console.error('BIGLWA Facebook Orbit render isolated:', error);
    }
  }

  function loadProfile() {
    return new Promise(function (resolve) {
      window.FB.api('/me', { fields: 'id,name,picture' }, function (response) {
        if (response && !response.error) { state.profile = response; }
        resolve();
      });
    });
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
        loadProfile().then(function () {
          showStatus('Facebook is connected to Orbit.');
          render();
        });
      }, { scope: 'public_profile,email', return_scopes: true });
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
    if (target.closest('[data-open="orbit"]')) { window.setTimeout(render, 0); }
  }, true);

  window.__biglwaFacebookOrbit = { connect: connect, disconnect: disconnect, state: state, render: render };
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', render, { once: true }); }
  else { render(); }
}());
