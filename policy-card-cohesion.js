(() => {
  const publicLinks = [
    { label: 'About', href: '/about/' },
    { label: 'Privacy', href: '/privacy', route: 'privacy' },
    { label: 'Terms', href: '/terms', route: 'terms' },
    { label: 'Good Faith', href: '/affidavit', route: 'affidavit' },
    { label: 'Rights & Likeness', href: '/rights', route: 'rights' }
  ];

  const makeNumber = (value) => {
    const number = document.createElement('span');
    number.className = 'policy-number';
    number.setAttribute('aria-hidden', 'true');
    number.textContent = String(value).padStart(2, '0');
    return number;
  };

  const makePublicFooter = (className, currentRoute) => {
    const footer = document.createElement('footer');
    footer.className = `public-page-footer ${className}`;

    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'Footer navigation');
    publicLinks.forEach(({ label, href, route }) => {
      const link = document.createElement('a');
      link.href = href;
      link.textContent = label;
      if (route) link.dataset.policyRoute = route;
      if (route === currentRoute) link.setAttribute('aria-current', 'page');
      nav.append(link);
    });

    const founder = document.createElement('p');
    founder.textContent = 'BIGLWA · Founded by Leian Stanley';
    footer.append(nav, founder);
    return footer;
  };

  const formatPrivacy = () => {
    const page = document.getElementById('privacyPage');
    if (!page) return;

    const title = page.querySelector('.policy-card h1');
    if (title) title.textContent = 'Privacy should be the bare minimum.';
    if (page.querySelector('.privacy-principles')) return;

    const lede = page.querySelector('.policy-lede');
    if (!lede) return;

    const pairs = [];
    let heading = lede.nextElementSibling;
    for (let index = 0; index < 3; index += 1) {
      const copy = heading && heading.nextElementSibling;
      if (!heading || heading.tagName !== 'H2' || !copy || copy.tagName !== 'P') return;
      pairs.push([heading, copy]);
      heading = copy.nextElementSibling;
    }

    const grid = document.createElement('div');
    grid.className = 'policy-principles privacy-principles';
    grid.setAttribute('aria-label', 'Privacy principles');
    lede.insertAdjacentElement('afterend', grid);

    pairs.forEach(([cardHeading, cardCopy], index) => {
      const card = document.createElement('section');
      card.className = 'policy-principle';
      card.append(makeNumber(index + 1), cardHeading, cardCopy);
      grid.append(card);
    });
  };

  const formatRights = () => {
    const grid = document.querySelector('#rightsPage .rights-grid');
    if (!grid) return;

    grid.classList.add('policy-principles', 'rights-principles');
    grid.setAttribute('aria-label', 'Rights and likeness principles');

    Array.from(grid.children).forEach((card, index) => {
      if (index > 2) {
        card.remove();
        return;
      }
      if (card.classList.contains('policy-principle')) return;

      const originalTitle = card.querySelector('b');
      if (!originalTitle) return;
      const label = originalTitle.textContent.trim();
      const match = label.match(/^(\d+)\s*·\s*(.+)$/);
      const number = match ? match[1] : index + 1;
      const title = match ? match[2] : label;
      const heading = document.createElement('h2');
      heading.textContent = title;

      card.classList.add('policy-principle');
      card.insertBefore(makeNumber(number), originalTitle);
      originalTitle.replaceWith(heading);
    });
  };

  const formatPolicyFooters = () => {
    const routes = {
      privacyPage: 'privacy',
      termsPage: 'terms',
      affidavitPage: 'affidavit',
      rightsPage: 'rights'
    };

    Object.entries(routes).forEach(([id, route]) => {
      const page = document.getElementById(id);
      const shell = page && page.querySelector('.policy-shell');
      if (!page || !shell) return;
      page.classList.add('has-public-footer');
      if (!shell.querySelector('.policy-public-footer')) {
        shell.append(makePublicFooter('policy-public-footer', route));
      }
    });
  };

  const addStudioAboutLink = () => {
    const nav = document.querySelector('#studioApp .site-policy-footer nav');
    if (!nav || nav.querySelector('a[href="/about/"]')) return;
    const link = document.createElement('a');
    link.href = '/about/';
    link.textContent = 'About';
    nav.prepend(link);
  };

  const makeSupporterLogo = (supporter) => {
    const wrapper = document.createElement(supporter.href ? 'a' : 'span');
    wrapper.className = 'supporter-logo';
    if (supporter.href) {
      wrapper.href = supporter.href;
      wrapper.target = '_blank';
      wrapper.rel = 'noopener noreferrer';
    }

    const logo = document.createElement('img');
    logo.src = supporter.src;
    logo.alt = supporter.name;
    logo.loading = 'lazy';
    logo.decoding = 'async';
    wrapper.append(logo);
    return wrapper;
  };

  const renderSupporters = (section) => {
    const supporters = Array.isArray(window.BIGLWA_SUPPORTERS)
      ? window.BIGLWA_SUPPORTERS.filter((item) => item && item.name && item.src)
      : [];
    if (!supporters.length) {
      section.hidden = true;
      return;
    }

    section.hidden = false;
    const track = section.querySelector('.supporter-track');
    if (!track || track.children.length) return;
    track.style.setProperty('--supporter-duration', `${Math.max(30, supporters.length * 7)}s`);

    [false, true].forEach((duplicate) => {
      const group = document.createElement('div');
      group.className = 'supporter-group';
      if (duplicate) group.setAttribute('aria-hidden', 'true');
      supporters.forEach((supporter) => group.append(makeSupporterLogo(supporter)));
      track.append(group);
    });
  };

  const formatLoginTail = () => {
    const page = document.getElementById('loginPage');
    if (!page) return;
    let tail = page.querySelector('.login-public-tail');
    if (!tail) {
      tail = document.createElement('div');
      tail.className = 'login-public-tail';

      const supporters = document.createElement('section');
      supporters.className = 'login-supporters';
      supporters.hidden = true;
      supporters.setAttribute('aria-label', 'BIGLWA supporters and collaborators');

      const heading = document.createElement('div');
      heading.className = 'supporter-heading';
      const titleWrap = document.createElement('div');
      const kicker = document.createElement('p');
      kicker.className = 'supporter-kicker';
      kicker.textContent = 'In good company';
      const title = document.createElement('h2');
      title.textContent = 'Supporters & collaborators.';
      titleWrap.append(kicker, title);
      const description = document.createElement('p');
      description.textContent = 'The people and organizations helping BIGLWA build brighter worlds.';
      heading.append(titleWrap, description);

      const viewport = document.createElement('div');
      viewport.className = 'supporter-viewport';
      const track = document.createElement('div');
      track.className = 'supporter-track';
      viewport.append(track);
      supporters.append(heading, viewport);

      tail.append(supporters, makePublicFooter('login-public-footer'));
      page.append(tail);
    }
    renderSupporters(tail.querySelector('.login-supporters'));
  };

  const apply = () => {
    formatPrivacy();
    formatRights();
    formatPolicyFooters();
    addStudioAboutLink();
    formatLoginTail();
  };

  apply();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply, { once: true });
  }
  window.addEventListener('load', apply, { once: true });
})();
