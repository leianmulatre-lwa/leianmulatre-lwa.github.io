/* Preserve public metadata through the legacy document.write loader.
 * Only the public homepage inherits homepage metadata. Account, callback and
 * unknown profile routes must never advertise themselves as the homepage.
 */
(() => {
  if (window.BigLWASEO) { window.BigLWASEO.install(); return; }
  const selector = 'title,meta[name="description"],meta[name="robots"],meta[property^="og:"],meta[name^="twitter:"],link[rel="canonical"],script[type="application/ld+json"],link[rel="icon"]';
  const homeTitle = 'Big LWA | Creative Social Network for Art, Music & Culture';
  const homeMarkup = [...document.head.querySelectorAll(selector)].map(node => node.outerHTML).join('');
  const isHome = () => ['/', '/index.html'].includes(location.pathname) && !location.search;
  const privateMarkup = '<meta name="robots" content="noindex,follow"><link rel="icon" href="/favicon.svg" type="image/svg+xml">';
  let observer;
  let currentHead;
  let lastMode;

  function sync() {
    const mode = isHome() ? 'home' : 'private';
    if (lastMode !== mode || currentHead !== document.head) {
      document.head.querySelectorAll(selector).forEach(node => {
        // Keep the app's route title outside the public homepage.
        if (node.tagName !== 'TITLE') node.remove();
      });
      if (mode === 'home') document.head.querySelectorAll('title').forEach(node => node.remove());
      document.head.insertAdjacentHTML('beforeend', mode === 'home' ? homeMarkup : privateMarkup);
      lastMode = mode;
      currentHead = document.head;
    }
    if (mode === 'home' && document.title !== homeTitle) document.title = homeTitle;
  }

  function install() {
    observer?.disconnect();
    sync();
    observer = new MutationObserver(sync);
    observer.observe(document.head, {childList: true, subtree: true, characterData: true});
  }

  function prepare(html) {
    const parsed = new DOMParser().parseFromString(html, 'text/html');
    parsed.head.querySelectorAll(selector).forEach(node => {
      if (isHome() || node.tagName !== 'TITLE') node.remove();
    });
    parsed.head.insertAdjacentHTML('beforeend', isHome() ? homeMarkup : privateMarkup);
    // Replace only the real head, preserving the legacy body/scripts byte-for-byte.
    const result = html.replace(/<head\b[^>]*>[\s\S]*?<\/head>/i, () => '<head>' + parsed.head.innerHTML + '</head>');
    return result.replace(/<\/body>/i, '<script src="/seo-head.js?v=20261017-1"></script></body>');
  }

  window.BigLWASEO = {prepare, install};
  for (const method of ['pushState', 'replaceState']) {
    const original = history[method];
    history[method] = function (...args) {
      const result = original.apply(this, args);
      queueMicrotask(sync);
      return result;
    };
  }
  window.addEventListener('popstate', sync);
  install();
})();
