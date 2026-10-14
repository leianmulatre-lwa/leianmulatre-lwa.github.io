(function () {
  'use strict';
  if (window.__biglwaInstagramOrbit) return;

  var API = 'https://biglwa-instagram-api.leianmulatre-284.workers.dev';
  var SESSION_KEY = 'biglwaInstagramSession';
  var activeAccountUid = '';
  var state = { connected: false, profile: null, media: [], hostedById: {}, error: '', importError: '', sessionLookupError: '', importsSaved: 0, importsSkipped: 0, importsPartial: 0, importAttempted: false, importWarning: '' };
  /* The same figures the Orbit panel shows, readable from the console, so a silent
     zero-import can be diagnosed without guessing. */
  window.__biglwaInstagramDiagnostics = state;
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
  function scopedSessionKey(uid) { return uid ? SESSION_KEY + ':' + uid : ''; }
  function session() {
    const uid=activeAccountUid || window.__biglwaIdentity?.uid || '';
    if(!uid)return '';
    const key=scopedSessionKey(uid);
    for(const store of [localStorage,sessionStorage]){
      try{const value=store.getItem(key);if(value)return value}catch{}
    }
    // Legacy global tokens may be unbound to this account; do not silently
    // use a previous member's authorization just because the device has one.
    return '';
  }
  function saveSession(value) {
    const uid=activeAccountUid || window.__biglwaIdentity?.uid || '';
    if(!uid)return;
    const key=scopedSessionKey(uid);
    try{if(value)localStorage.setItem(key,value);else localStorage.removeItem(key)}catch{}
    try{localStorage.removeItem(SESSION_KEY)}catch{}
  }
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
      // OAuth handoff can return before Firebase finishes restoring this login.
      // Waiting here is essential: otherwise the Worker creates only a browser
      // credential and cannot connect Instagram to the member's account.
      await ctx.auth.authStateReady();
      activeAccountUid=ctx.auth.currentUser?.uid||'';
      return ctx.auth.currentUser ? await ctx.auth.currentUser.getIdToken() : '';
    } catch (error) { return ''; }
  }
  async function accountSession() {
    var token = await firebaseAuthToken();
    if (!token) {
      state.sessionLookupError='Sign in to your BIGLWA account to restore Instagram.';
      return '';
    }
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
    state.hostedById = {...state.hostedById,...((result && result.hostedById) || {})};
    renderFeed();
    window.dispatchEvent(new CustomEvent('biglwa:orbit-imported', {
      detail: { source: 'instagram', imported: state.importsSaved }
    }));
    if (window.__biglwaFeed && typeof window.__biglwaFeed.refresh === 'function') {
      window.__biglwaFeed.refresh();
    }
    return result;
  }
  /* Connecting saves on its own, but the first save can land before the account is fully
     ready: Orbit storage still booting, the login token refreshing, or a rules change not
     visible yet. Rather than leaving that to a button, a failed save is retried a few times
     on its own. The final attempt rethrows so the panel can still say what went wrong. */
  async function saveToFeedWithRetry() {
    var delays = [1200, 4000, 9000];
    var attempt = 0;
    for (;;) {
      try {
        return await importToFeed();
      } catch (failure) {
        if (attempt >= delays.length) throw failure;
        var wait = delays[attempt];
        attempt += 1;
        await new Promise(function (resolve) { setTimeout(resolve, wait); });
        if (!state.connected) throw failure;
      }
    }
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
    // The canonical connection belongs to the authenticated account on the
    // Worker, not this device. Refresh it first on every restore.
    var savedSession = await accountSession();
    if(savedSession)saveSession(savedSession);
    else if(!state.sessionLookupError){
      // The Worker confirmed there is no authorized account connection.
      // Keep the public profile record and saved R2 photos; only hide live import.
      state.connected=false;
      state.profile=null;
      state.media=[];
      state.error='';
      render();
      return false;
    } else {
      // A transient account-service fault should not erase an existing session.
      savedSession=session();
    }
    if(!savedSession) {
      if(state.sessionLookupError)status(state.sessionLookupError);
      return false;
    }
    return Promise.all([api('/instagram/profile'), api('/instagram/media')]).then(async function (responses) {
      state.profile = responses[0]; state.media = responses[1].data || []; state.connected = true; state.error = '';
      // Saved R2 URLs survive device changes. Restore these before refreshing from Instagram.
      try{
        const saved=await window.__biglwaOrbitPosts?.storedOrbitImageUrls?.('instagram');
        if(saved)state.hostedById={...state.hostedById,...saved};
      }catch(error){console.warn('Instagram stored photos restore:',error)}
      render();
      /* Loading and saving fail for different reasons and need different words. Sharing one
         catch made a failed save read as "Instagram could not load", so a member whose
         connection was healthy saw a broken connection and never learned the save failed. */
      return saveToFeedWithRetry().then(function (result) {
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
      if (error.status === 401) {
        // A browser credential can be stale even when the Firebase-linked
        // account is healthy. Retry recovery once without disconnecting.
        return accountSession().then(next=>{
          if(next && next!==savedSession){saveSession(next);return restore();}
          state.error='Instagram authorization expired. Reconnect to refresh permission.';
          state.connected=false;render();return false;
        });
      }
      state.error = error.message;
      render();return false;
    });
  }
  function consumeHandoff() {
    var url = new URL(window.location.href); var handoff = url.searchParams.get('instagram_handoff') || RETURNED_HANDOFF; var error = url.searchParams.get('instagram_error') || RETURNED_ERROR;
    window.__biglwaInstagramReturnCode = handoff;
    if (error) { url.searchParams.delete('instagram_error'); history.replaceState({}, '', url.pathname + (url.search ? url.search : '') + url.hash); status(error); }
    if (!handoff) return restore();
    url.searchParams.delete('instagram_handoff'); history.replaceState({}, '', url.pathname + (url.search ? url.search : '') + url.hash);
    return firebaseAuthToken().then(function (firebaseIdToken) {
      if(!firebaseIdToken)throw new Error('Sign in to BIGLWA before linking Instagram. Connection was not saved.');
      return api('/session/exchange', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ handoff: handoff, firebaseIdToken: firebaseIdToken }) });
    }).then(function (result) {
      if(!result.persisted || !result.session)throw new Error('Instagram was not linked to your BIGLWA account. Please retry.');
      saveSession(result.session);
      return restore();
    }).then(function () { status('Instagram is linked to your BIGLWA account.'); }).catch(function (failure) { status(failure.message); });
  }
  function disconnect() { return api('/instagram/disconnect', { method: 'POST' }).catch(function () {}).then(function () { saveSession(''); state.connected = false; state.profile = null; state.media = []; state.hostedById = {}; render(); status('Instagram disconnected from Orbit.'); }); }
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
    var healthy = !state.importError && state.importsSaved > 0 && !state.importsPartial && !state.importWarning;
    parts.push('Instagram returned ' + state.media.length + ' item' + (state.media.length === 1 ? '' : 's') + '.');
    parts.push(healthy
      ? 'Saved automatically to your BIGLWA account: ' + state.importsSaved + '.'
      : 'Saved to your BIGLWA account: ' + state.importsSaved + '.');
    if (state.importsSkipped) parts.push('Skipped (no usable picture): ' + state.importsSkipped + '.');
    if (state.importsPartial) parts.push('Only partly saved: ' + state.importsPartial + '. Your BIGLWA security rules still need publishing.');
    if (state.importWarning) parts.push(state.importWarning);
    /* Saving is automatic, so the retry button only appears when something actually went
       wrong. It used to be shown on every connected account, which made an import that had
       already succeeded look like it still needed a button pressed. */
    var retry = '';
    if (!healthy) {
      retry = '<button type="button" class="module-action" data-instagram-resave>' +
        (state.importError ? 'Try saving again' : 'Save anything that did not make it') + '</button>';
    }
    return '<article class="module-list-item biglwa-instagram-import-status" data-instagram-import-status><div>' +
      '<b>Import status</b><small>' + escapeText(parts.join(' ')) + '</small>' +
      retry +
      '</div></article>';
  }
  function feedHtml() {
    if (state.error) {
      return '<article class="module-list-item instagram-feed-item"><div><b>Instagram could not load</b><small>' + escapeText(state.error) + '</small></div></article>';
    }
    var pendingCopies=state.connected&&state.media.some(item=>!(state.hostedById[String(item.id||'')]||[]).length);
    var importWarning = state.importError||pendingCopies
      ? '<article class="module-list-item instagram-import-status"><div><b>'+ (state.importError?'Instagram storage needs attention':'Finish saving Instagram images') +'</b><small>'+escapeText(state.importError||'Instagram source previews are visible while BIGLWA copies the originals to account storage.')+'</small><button type="button" class="module-action" data-instagram-resave>Retry saving photos</button></div></article>'
      : '';
    if (!state.connected) return '';
    var cards = state.media.slice(0, 20).map(function (item, index) {
      var children = item.children && Array.isArray(item.children.data) ? item.children.data.filter(function (child) {
        return child && (child.media_url || child.thumbnail_url);
      }) : [];
      /* A post with a dozen photos is a stack, not a slideshow, so it settles on the first
         picture instead of drawing a numbered tab for every one of them. */
      var manyPhotos = children.length >= 8;
      var carousel = item.media_type === 'CAROUSEL_ALBUM' && children.length > 1 && !manyPhotos;
      var mediaItems = carousel ? children : [item];
      var first = mediaItems[0] || item;
      var hosted = state.hostedById[String(item.id || '')] || [];
      // Never show expiring CDN links as the connected card's permanent image.
      // For video or carousel posts, the persisted picture is the R2 poster.
      var media = hosted[0] || '';
      // Provider pictures may be shown temporarily while the R2 copy is in
      // progress, but only our own R2 URLs are persisted in account records.
      var sourcePreview = String(first.thumbnail_url || first.media_url || item.thumbnail_url || item.media_url || '');
      if(sourcePreview&&!/^https:\/\//i.test(sourcePreview))sourcePreview='';
      var livePreview = !media && state.connected ? sourcePreview : '';
      var shown=media||livePreview;
      var visual = shown
        ? '<img data-instagram-media src="' + escapeText(shown) + '" data-instagram-preview="' + escapeText(shown) + '"' +
          (media&&sourcePreview&&sourcePreview!==media?' data-instagram-fallback="'+escapeText(sourcePreview)+'"':'') +
          (media?' data-biglwa-hosted="true"':' data-biglwa-hosted="pending"') +
          ' alt="Instagram media preview" loading="lazy" style="display:block;width:100%;height:auto;object-fit:contain;background:#efe7dd">'
        : '<div class="biglwa-unavailable-media">This Instagram image is not available yet. Choose Retry saving photos to restore its stored copy.</div>';
      var tabs = carousel ? '<div class="biglwa-instagram-tabs" aria-label="Carousel photos">' + mediaItems.map(function (_, tabIndex) {
        return '<button type="button" class="biglwa-instagram-tab' + (tabIndex === 0 ? ' is-active' : '') + '" data-instagram-tab="' + tabIndex + '">' + (tabIndex + 1) + '</button>';
      }).join('') + '</div>' : '<span class="biglwa-instagram-tabs" aria-hidden="true"></span>';
      var link = item.permalink || '#';
      var cardId = 'instagram-' + escapeText(item.id || ('item-' + index));
      /* The + tray belongs on every card on the wall, so these cards carry one too. The
         picture record is handed to the feed as a data attribute, which is what lets the
         same tray send to a board, a project or the map. */
      var sendBar = typeof window.__biglwaFeed === 'object' && typeof window.__biglwaFeed.sendBarMarkup === 'function'
        ? window.__biglwaFeed.sendBarMarkup()
        : '';
      var sendRecord = JSON.stringify({
        id: cardId,
        source: 'instagram',
        sourcePostId: String(item.id || ''),
        caption: item.caption || '',
        sourceUrl: item.permalink || '',
        imageUrls: hosted.length ? hosted.filter(Boolean) : (shown ? [shown] : [])
      }).replace(/"/g, '&quot;');
      return '<article class="module-list-item instagram-feed-item biglwa-instagram-card" style="--feed-card-rim:#7d3ec5;--feed-card-shadow:3px 3px 0 #7d3ec5,7px 7px 0 -2px #ad82e7,0 14px 28px -13px #5d2999" data-instagram-index="' + index + '"' +
        ' data-post-id="' + cardId + '" data-source-id="' + escapeText(item.id || '') + '" data-send-record="' + sendRecord + '">' +
        '<div style="width:100%;padding:0">' +
          '<div class="biglwa-instagram-strip">' +
            tabs +
            '<div class="biglwa-instagram-actions" aria-label="Instagram post actions">' +

              '<a href="' + escapeText(link) + '" target="_blank" rel="noopener noreferrer" data-instagram-open aria-label="Open on Instagram" title="Open on Instagram"></a>' +
            '</div>' +
          '</div>' +
          '<div class="biglwa-unified-media">' + visual + '</div>' +
        '</div>' +
        '<span class="biglwa-unified-source">Instagram</span>' +
        sendBar +
      '</article>';
    });
    if (!cards.length) cards.push('<article class="module-list-item instagram-feed-item"><div><b>Instagram is connected</b><small>No media was returned for this account.</small></div></article>');
    return importWarning + importStatusHtml() + cards.join('');
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
    all('.biglwa-instagram-wall', list).forEach(function (wall) { wall.remove(); });
    all('.instagram-feed-item,.instagram-import-status,.biglwa-instagram-import-status', list).forEach(function (item) { item.remove(); });
    var html = feedHtml();
    if (html) list.insertAdjacentHTML('afterbegin', html);
    // Account import health is page-level information, not a photo. Keep it
    // above the Pinterest-style wall instead of consuming a masonry slot.
    var module = list.closest('.module-workspace[data-module-key="feed"]');
    var grid = module && one('.module-grid', module);
    if(grid){
      var statusRail=one('#biglwaFeedImportStatusRail',module);
      if(!statusRail){
        statusRail=document.createElement('aside');
        statusRail.id='biglwaFeedImportStatusRail';
        statusRail.className='biglwa-feed-import-rail';
        statusRail.setAttribute('aria-label','Connected account import status');
        grid.insertAdjacentElement('beforebegin',statusRail);
      }
      statusRail.querySelectorAll('[data-instagram-import-status],.instagram-import-status').forEach(function(n){n.remove()});
      all('[data-instagram-import-status],.instagram-import-status',list).forEach(function(n){statusRail.appendChild(n)});
      statusRail.hidden=!statusRail.children.length;
    }
    /* These cards are not saved posts, so the wall is told what each one holds in order for
       their + tray to work the same way as the tray on a saved card. */
    if (window.__biglwaFeed && typeof window.__biglwaFeed.registerSendCard === 'function') {
      all('[data-send-record]', list).forEach(function (card) { window.__biglwaFeed.registerSendCard(card); });
    }
    guardPictures(list);
  }
  /* A card that cannot show a picture is not an option worth offering, so a picture that
     fails is swapped for the thumbnail, and a card whose picture and thumbnail both fail is
     taken off the wall. The preview that finally rendered is written back into the record
     so the saved card keeps the picture that actually worked. */
  function guardPictures(list) {
    var dropped = 0;
    all('img[data-instagram-media]', list).forEach(function (img) {
      img.addEventListener('error', function () {
        var fallback = img.getAttribute('data-instagram-fallback');
        if (fallback && img.src !== fallback) {
          img.src = fallback;
          img.setAttribute('data-instagram-fallback', '');
          img.setAttribute('data-instagram-preview', fallback);
          var card = img.closest('[data-send-record]');
          if (card) retargetSendRecord(card, fallback);
          return;
        }
        var holder = img.closest('.biglwa-instagram-card');
        if (holder) { const unavailable=document.createElement('div'); unavailable.className='biglwa-unavailable-media'; unavailable.textContent='Instagram image unavailable — open original source.'; img.replaceWith(unavailable); holder.classList.add('biglwa-image-unavailable'); dropped += 1; }
      });
      if (img.complete && img.naturalWidth === 0) img.dispatchEvent(new Event('error'));
    });
    all('video[data-instagram-media]', list).forEach(function (video) {
      video.addEventListener('error', function () {
        var poster = video.getAttribute('poster');
        if (!poster) {
          var holder = video.closest('.biglwa-instagram-card');
          if (holder) { holder.remove(); dropped += 1; }
          return;
        }
        var still = document.createElement('img');
        still.setAttribute('data-instagram-media', '');
        still.setAttribute('data-instagram-preview', poster);
        still.src = poster;
        still.alt = 'Instagram media';
        still.style.cssText = 'display:block;width:100%;height:auto;object-fit:contain;background:#efe7dd';
        video.replaceWith(still);
        var card = video.closest('[data-send-record]');
        if (card) retargetSendRecord(card, poster);
      });
    });
    if (dropped) {
      var note = one('#biglwaInstagramStatus');
      if (note) note.textContent = dropped + ' post' + (dropped === 1 ? '' : 's') + ' hidden because the picture would not load.';
    }
  }
  /* When a picture falls back to its thumbnail, the card's own record is corrected so the
     + tray, the Archive and the saved copy all point at the picture that loads. */
  function retargetSendRecord(card, url) {
    var record = card.getAttribute('data-send-record');
    if (!record) return;
    try {
      var data = JSON.parse(record);
      data.imageUrls = [url];
      card.setAttribute('data-send-record', JSON.stringify(data).replace(/"/g, '&quot;'));
      if (window.__biglwaFeed && typeof window.__biglwaFeed.registerSendCard === 'function') {
        window.__biglwaFeed.registerSendCard(card);
      }
    } catch (error) {
      console.warn('BIGLWA Instagram: could not correct a card picture', error);
    }
  }
  /* The feed module boots after this one, so the first render has no tray to hand out and
     no way to register the pictures. It announces itself when it is ready and the cards
     are drawn again with their + in place. */
  document.addEventListener('biglwa:feed-ready', function () { renderFeed(); });
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
        var saved = state.hostedById[String(item.id || '')] || [];
        var media = saved[nextIndex] || (state.connected?String(next.thumbnail_url||next.media_url||''):'');
        var old = card.querySelector('[data-instagram-media],.biglwa-unavailable-media');
        if(old){
          if(media){
            var img=document.createElement('img');
            img.setAttribute('data-instagram-media','');
            img.setAttribute('data-instagram-preview',media);
            img.loading='lazy';img.src=media;
            img.alt='Instagram picture stored in BIGLWA';
            img.style.cssText='display:block;width:100%;height:auto;object-fit:contain;background:#efe7dd';
            old.replaceWith(img);
          }else{
            var placeholder=document.createElement('div');
            placeholder.className='biglwa-unavailable-media';
            placeholder.textContent='This carousel image has not been copied to BIGLWA yet.';
            old.replaceWith(placeholder);
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
 var target = event.target && event.target.closest ? event.target : null; if (!target) return; if (target.closest('[data-orbit-app="instagram"],[data-instagram-connect]')) { event.preventDefault(); event.stopImmediatePropagation(); if(!state.connected)connect(); else window.openBIGLWAModule?.('orbit'); return; } if (target.closest('[data-instagram-disconnect]')) { event.preventDefault(); disconnect(); return; } if (target.closest('[data-open="orbit"],[data-open="feed"]')) setTimeout(render, 80); }, true);
  window.__biglwaInstagramOrbit = { connect: connect, disconnect: disconnect, restore: restore, state: state, render: render, renderFeed: renderFeed };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { render(); consumeHandoff(); }, { once: true }); else { render(); consumeHandoff(); }
}());
