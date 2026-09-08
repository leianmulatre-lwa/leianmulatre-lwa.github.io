(() => {
  if (window.__biglwaSiteFixesV4) return;
  window.__biglwaSiteFixesV4 = true;

  const ASSET_V = '20260908-1';
  const emblem = `/assets/biglwa-emblem.webp?v=${ASSET_V}`;
  const games = `/assets/games-lwa-blocks.webp?v=${ASSET_V}`;
  const wordmark = `/assets/biglwa-wordmark-aspen.svg?v=${ASSET_V}`;

  const css = document.createElement('style');
  css.id = 'biglwa-site-fixes-v4-style';
  css.textContent = `
    @font-face{font-family:'BiglwaAspen';src:url('/assets/fonts/aspen-biglwa.woff2?v=${ASSET_V}') format('woff2');font-style:normal;font-weight:400;font-display:swap}
    .brand,.login-brand{font-family:'BiglwaAspen',Georgia,serif}
    .biglwa-login-emblem,.biglwa-sidebar-emblem,.biglwa-games-card-logo,.biglwa-games-module-logo,.biglwa-wordmark-img{object-fit:contain}
    .biglwa-login-emblem,.biglwa-sidebar-emblem{background:transparent!important}
    .orbit-v4-note{margin:0 0 14px;font-size:10px;line-height:1.55;color:#7d736c}
    .night-mode .orbit-v4-note{color:#b6aaa2}
  `;
  document.head.appendChild(css);

  const fixImages = () => {
    document.querySelectorAll('.biglwa-login-emblem,.biglwa-sidebar-emblem,img[alt="BIGLWA emblem"],img[alt="BIG LWA emblem"]').forEach(img => {
      if (!(img instanceof HTMLImageElement)) return;
      if (img.dataset.realBiglwaEmblem === '1') return;
      img.src = emblem;
      img.alt = '';
      img.dataset.realBiglwaEmblem = '1';
    });
    document.querySelectorAll('.biglwa-games-card-logo,.biglwa-games-module-logo').forEach(img => {
      if (!(img instanceof HTMLImageElement)) return;
      if (img.dataset.realBiglwaGames === '1') return;
      img.src = games;
      img.alt = '';
      img.dataset.realBiglwaGames = '1';
    });
    document.querySelectorAll('.biglwa-wordmark-img').forEach(img => {
      if (!(img instanceof HTMLImageElement)) return;
      if (img.dataset.realBiglwaWordmark === '1') return;
      img.src = wordmark;
      img.alt = '';
      img.dataset.realBiglwaWordmark = '1';
    });
  };

  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const readJSON = (key, fallback={}) => { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; } };
  const writeJSON = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const safeOpen = url => {
    if (!url) return;
    try {
      const u = new URL(url, location.href);
      if (!/^https?:$/.test(u.protocol)) return;
      window.open(u.href, '_blank', 'noopener,noreferrer');
    } catch {}
  };

  const orbitApps = [
    ['instagram','IG','Instagram'],
    ['facebook','FB','Facebook'],
    ['x','X','X'],
    ['pinterest','P','Pinterest'],
    ['youtube','YT','YouTube'],
    ['tiktok','TT','TikTok'],
    ['twitch','TW','Twitch'],
    ['linkedin','IN','LinkedIn'],
    ['tumblr','T','Tumblr'],
    ['substack','S','Substack']
  ];

  const patchOrbit = () => {
    const route = document.querySelector('#moduleRouteName')?.textContent?.trim().toLowerCase();
    const body = document.querySelector('#moduleWorkspaceBody');
    if (route !== 'orbit' || !body) return;
    const grid = body.querySelector('.module-orbit');
    if (!grid || grid.dataset.orbitV4 === '1') return;

    const links = readJSON('biglwaOrbitLinks', {});
    const auth = readJSON('biglwaOrbitAuthPaths', {});
    grid.innerHTML = orbitApps.map(([key,glyph,name]) => `
      <div class="module-orbit-row">
        <header><b>${name}</b><span>${glyph}</span></header>
        <label class="orbit-field-label">Public profile / page</label>
        <input class="module-input" data-orbit-v4-path="${key}" value="${esc(links[key] || '')}" placeholder="Paste profile URL">
        <label class="orbit-field-label">Future login / authorization path</label>
        <input class="module-input" data-orbit-v4-auth="${key}" value="${esc(auth[key] || '')}" placeholder="OAuth, login, or developer callback path">
        <div class="module-actions">
          <button class="module-action" type="button" data-orbit-v4-save="${key}">Save</button>
          <button class="module-action ghost" type="button" data-orbit-v4-open="${key}" ${links[key] ? '' : 'disabled'}>Open profile</button>
        </div>
      </div>`).join('');
    grid.dataset.orbitV4 = '1';

    const intro = grid.closest('.module-card')?.querySelector(':scope > p');
    if (intro) intro.textContent = 'Connect the creative/social platforms that belong in your BIGLWA orbit. Calendar syncing stays in Calendar. Public profile links and future login/authorization paths are kept separate so real connections can be wired later.';
  };

  document.addEventListener('click', e => {
    const save = e.target.closest('[data-orbit-v4-save]');
    const open = e.target.closest('[data-orbit-v4-open]');
    if (save) {
      const key = save.dataset.orbitV4Save;
      const path = document.querySelector(`[data-orbit-v4-path="${key}"]`)?.value.trim() || '';
      const authPath = document.querySelector(`[data-orbit-v4-auth="${key}"]`)?.value.trim() || '';
      const links = readJSON('biglwaOrbitLinks', {});
      const auth = readJSON('biglwaOrbitAuthPaths', {});
      path ? links[key] = path : delete links[key];
      authPath ? auth[key] = authPath : delete auth[key];
      writeJSON('biglwaOrbitLinks', links);
      writeJSON('biglwaOrbitAuthPaths', auth);
      const status = document.querySelector('#orbitPageStatus');
      if (status) { status.textContent = `${orbitApps.find(a => a[0] === key)?.[2] || 'Orbit'} paths saved.`; status.classList.add('ok'); }
      const openButton = document.querySelector(`[data-orbit-v4-open="${key}"]`);
      if (openButton) openButton.disabled = !path;
    }
    if (open) safeOpen(readJSON('biglwaOrbitLinks', {})[open.dataset.orbitV4Open]);
  }, true);

  let queued = false;
  const apply = () => {
    queued = false;
    fixImages();
    patchOrbit();
  };
  const queue = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(apply);
  };
  new MutationObserver(queue).observe(document.documentElement, {subtree:true, childList:true});
  window.addEventListener('popstate', queue);
  document.addEventListener('click', () => setTimeout(queue, 0), true);
  setTimeout(apply, 0);
})();
