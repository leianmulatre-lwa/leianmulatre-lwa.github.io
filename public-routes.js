/* BIGLWA public route bridge
 * Policy/information pages are public. Studio/Room remain auth-protected.
 * GitHub Pages sends extensionless paths through 404.html, so this bridge
 * restores the requested public page after the app boot chain loads.
 */
(() => {
  const ROUTES = {
    privacy: { id: 'privacyPage', title: 'Privacy' },
    terms: { id: 'termsPage', title: 'Terms' },
    rights: { id: 'rightsPage', title: 'Rights & Likeness' },
    affidavit: { id: 'affidavitPage', title: 'Affidavit of Good Faith' }
  };

  const getRoute = () => {
    try {
      const params = new URLSearchParams(location.search);
      const route = String(params.get('route') || '').replace(/^\/+|\/+$/g, '').toLowerCase();
      if (ROUTES[route]) return route;
    } catch {}
    const path = String(location.pathname || '').replace(/^\/+|\/+$/g, '').toLowerCase();
    return ROUTES[path] ? path : '';
  };

  const route = getRoute();
  if (!route) return;

  const state = ROUTES[route];

  const reveal = () => {
    const target = document.getElementById(state.id);
    if (!target) return false;

    const login = document.getElementById('loginPage');
    const studio = document.getElementById('studioApp');

    // The policy pages already exist in the main app markup. We only override
    // the route visibility; no authentication state is changed here.
    if (login) {
      login.hidden = true;
      login.style.setProperty('display', 'none', 'important');
    }
    if (studio) {
      studio.hidden = true;
      studio.style.setProperty('display', 'none', 'important');
    }

    document.querySelectorAll('.route-screen').forEach(page => {
      if (page !== target && page !== login && page !== studio) {
        page.style.setProperty('display', 'none', 'important');
      }
    });

    target.hidden = false;
    target.style.setProperty('display', 'block', 'important');
    target.style.setProperty('visibility', 'visible', 'important');

    document.body.classList.remove('login-route', 'studio-route');
    document.documentElement.classList.add('biglwa-public-route');
    document.title = 'BIGLWA — ' + state.title;

    // Restore the clean public URL after the GitHub Pages 404 handoff.
    if (location.pathname !== '/' + route) {
      try {
        history.replaceState({ biglwaPublicRoute: route }, '', '/' + route);
      } catch {}
    }
    return true;
  };

  const boot = () => {
    if (reveal()) return;
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      if (reveal() || attempts > 100) clearInterval(timer);
    }, 50);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  // Auth/account scripts can repaint route screens after boot. Keep the
  // public policy page visible without touching authentication.
  const observer = new MutationObserver(() => reveal());
  const startObserver = () => {
    if (document.body) observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'style', 'class'] });
  };
  if (document.body) startObserver();
  else document.addEventListener('DOMContentLoaded', startObserver, { once: true });
})();
