(function () {
  'use strict';
  if (window.__biglwaFacebookOrbit) { return; }

  var APP_ID = '1370423431874443';
  var API_VERSION = 'v25.0';
  var sdkPromise = null;
  var state = { connected: false, profile: null, photos: [], videos: [], permissions: [], error: '', noMediaNotified:false };

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

      // Advanced photo/video permissions are optional and must never block basic Facebook login.
      // Request them through a separate, explicit user click after Meta grants access.
      all('[data-orbit-connect="facebook"]').forEach(function (button) {
        var actions = button.closest('.module-actions');
        if (!actions) return;
        var mediaButton = one('[data-facebook-orbit-media]', actions);
        var needsMedia = state.connected && (!state.permissions.includes('user_photos') || !state.permissions.includes('user_videos'));
        if (needsMedia && !mediaButton) {
          mediaButton = document.createElement('button');
          mediaButton.type = 'button';
          mediaButton.className = 'module-action ghost';
          mediaButton.setAttribute('data-facebook-orbit-media','1');
          mediaButton.textContent = 'Allow Facebook media';
          actions.appendChild(mediaButton);
        } else if (!needsMedia && mediaButton) {
          mediaButton.remove();
        }
      });

      document.body.classList.toggle('facebook-orbit-connected', state.connected);

      /* The Orbit page's own Facebook row now uses the shared connect button
         (data-orbit-connect) so it hands the click to this client. It is labelled from the
         same state so a page left open shows Connected the moment login finishes. */
      all('[data-orbit-connect="facebook"]').forEach(function (button) {
        button.textContent = state.connected ? 'Reconnect Facebook' : 'Connect Facebook';
        button.setAttribute('aria-pressed', state.connected ? 'true' : 'false');
      });

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
        facebookApi('/me', { fields: 'id,name,picture.width(200).height(200)' + (hasPermission('user_link') ? ',link' : '') }),
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
        state.noMediaNotified=false;
        render();
      });
    });
  }

  function photoUrl(photo) {
    return photo && photo.images && photo.images.length ? photo.images[0].source : '';
  }

  // Connected Facebook media is a preview, not a published Big LWA post.
  // Use the same image-first shell, blue shadow, and compact in-image actions.
  function safeLink(value) {
    try { var url=new URL(String(value||''));return url.protocol==='https:'?url.href:''; }
    catch (_) { return ''; }
  }
  function facebookCard(item,kind) {
    var title=String(item.name||item.title||item.description||'Shared from Facebook').slice(0,180);
    var src=safeLink(kind==='video'?(item.picture||''):photoUrl(item));
    var clip=kind==='video'?safeLink(item.source):'';
    var url=safeLink(kind==='video'?item.permalink_url:item.link);
    if(!src&&!clip)return '';
    var id=String(item.id||'').replace(/[^a-zA-Z0-9_-]/g,'');
    var poster=src?'<img src="'+escapeText(src)+'" loading="lazy" decoding="async" alt="'+escapeText(title)+'">':'';
    var visual=kind==='video'&&clip
      ? '<video src="'+escapeText(clip)+'" '+(src?'poster="'+escapeText(src)+'" ':'')+' muted playsinline controls autoplay loop preload="metadata"></video>'
      : poster;
    var record=JSON.stringify({id:'facebook-'+id,source:'facebook',sourcePostId:id,caption:title,
      sourceUrl:url,imageUrls:src?[src]:[],videoUrl:clip}).replace(/"/g,'&quot;');
    return '<article class="module-list-item facebook-feed-item biglwa-unified-card" data-facebook-media="'+kind+
      '" data-post-id="facebook-'+escapeText(id)+'" data-source-id="'+escapeText(id)+'" data-send-record="'+record+
      '" style="--feed-card-rim:#1877f2;--feed-card-shadow:3px 3px 0 #1877f2,0 12px 25px -16px #5aa0ff">'+
      '<div class="biglwa-unified-media facebook-card-media">'+visual+
        '<div class="facebook-card-overlay"><span>'+escapeText(title)+'</span></div>'+
      '</div><span class="biglwa-unified-source">Facebook</span>'+
      (url?'<a class="facebook-card-source" href="'+escapeText(url)+'" target="_blank" rel="noopener noreferrer" aria-label="View original on Facebook">Original ↗</a>':'')+
      '</article>';
  }
  function renderFeedImports() {
    var list=one('#feedPageList');
    if(!list)return;
    all('.facebook-feed-item',list).forEach(function(card){card.remove();});
    if(!state.connected)return;
    var items=[];
    state.photos.forEach(function(photo){var html=facebookCard(photo,'photo');if(html)items.push(html);});
    state.videos.forEach(function(video){var html=facebookCard(video,'video');if(html)items.push(html);});
    if(!items.length) {
      // A status belongs to the page/status rail, never inside the masonry as a fake picture.
      if(!state.noMediaNotified){
        state.noMediaNotified=true;
        showStatus('Facebook connected. No accessible photos or videos returned. Check Meta permissions.');
      }
      return;
    }
    list.insertAdjacentHTML('afterbegin',items.join(''));
    if(window.__biglwaFeed?.registerSendCard){
      all('.facebook-feed-item[data-send-record]',list).forEach(function(card){
        try{window.__biglwaFeed.registerSendCard(card);}catch(error){console.warn('Facebook Feed action:',error);}
      });
    }
  }

  function connect() {
    loadSDK().then(function () {
      // Do not request App-Review-only permissions on the initial sign-in.
      window.FB.login(function (response) {
        if (!response || !response.authResponse) {
          state.connected = false;
          state.error = (response && (response.error_message || response.error))
            ? String(response.error_message || response.error)
            : 'Facebook authorization was cancelled or unavailable. Check Meta app roles and publish status.';
          showStatus(state.error);
          render();
          return;
        }
        state.connected = true;
        state.error = '';
        loadFacebookContent().then(function () {
          var mediaGranted = hasPermission('user_photos') || hasPermission('user_videos');
          showStatus(mediaGranted
            ? 'Facebook connected. Approved media is available in Collective Feed.'
            : 'Facebook connected. Media imports need separate Meta permissions; use Allow Facebook media when approved.');
          render();
        }).catch(function (error) {
          state.error = error.message || 'Facebook profile could not load.';
          showStatus(state.error);
          render();
        });
      }, { scope: 'public_profile', return_scopes: true });
    }).catch(function (error) {
      state.connected = false;
      state.error = error.message || 'Facebook Login could not start.';
      showStatus(state.error);
      render();
    });
  }

  function requestMediaAccess() {
    if (!state.connected || !window.FB || !window.FB.login) {
      showStatus('Connect Facebook before requesting photos and videos.');
      return;
    }
    window.FB.login(function (response) {
      if (!response || !response.authResponse) {
        showStatus('Facebook media access was not granted. Check user_photos and user_videos approval in Meta.');
        return;
      }
      loadFacebookContent().then(function () {
        showStatus(hasPermission('user_photos') || hasPermission('user_videos')
          ? 'Facebook media permissions updated.'
          : 'Facebook is connected, but Meta has not granted photo or video access.');
      }).catch(function () { showStatus('Facebook media could not be loaded. Try again later.'); });
    }, {scope:'user_photos,user_videos',auth_type:'rerequest',return_scopes:true});
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
    if (target.closest('[data-facebook-orbit-media]')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      requestMediaAccess();
      return;
    }
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
  /* Registering with the shared mount is what lets these cards survive a feed rebuild and
     pick up the Facebook accent, instead of only appearing on the click that opened the
     page and then being wiped by the next rebuild. */
  if (window.BIGLWAFeedMount) { window.BIGLWAFeedMount('Facebook', 'facebook-feed-item', renderFeedImports); }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', render, { once: true }); }
  else { render(); }
}());
