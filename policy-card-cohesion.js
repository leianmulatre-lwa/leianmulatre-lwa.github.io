(() => {
  const publicLinks = [
    { label: 'About', href: '/about/' },
    { label: 'Privacy', href: '/privacy', route: 'privacy' },
    { label: 'Terms', href: '/terms', route: 'terms' },
    { label: 'Good Faith', href: '/affidavit', route: 'affidavit' },
    { label: 'Rights & Likeness', href: '/rights', route: 'rights' }
  ];

  const publicBrandPattern = /\bBII?GLWA\b/g;
  const replacePublicBrand = (value) => value.replace(publicBrandPattern, 'Big LWA');

  const normalizePublicBrand = () => {
    document.querySelectorAll('.policy-page').forEach((page) => {
      const walker = document.createTreeWalker(page, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      while (node) {
        const normalized = replacePublicBrand(node.nodeValue);
        if (normalized !== node.nodeValue) node.nodeValue = normalized;
        node = walker.nextNode();
      }

      page.querySelectorAll('[aria-label]').forEach((element) => {
        const label = element.getAttribute('aria-label');
        if (!label) return;
        const normalized = replacePublicBrand(label);
        if (normalized !== label) element.setAttribute('aria-label', normalized);
      });
    });
  };

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
    founder.textContent = 'Big LWA · Founded by Leian Stanley · All rights reserved.';
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

  const addThreeBodyContext = () => {
    const card = document.querySelector('#rightsPage .rights-card');
    if (!card || card.querySelector('.three-body-model')) return;

    const courtHeading = Array.from(card.children).find(
      (element) => element.tagName === 'H2' && element.textContent.trim() === 'When court becomes necessary'
    );
    if (!courtHeading) return;

    const context = document.createElement('section');
    context.className = 'three-body-model';
    context.setAttribute('aria-labelledby', 'threeBodyModelTitle');
    context.innerHTML = `
      <p class="three-body-kicker">Context</p>
      <h2 id="threeBodyModelTitle">The three-body model</h2>
      <p>Medical anthropologists Nancy Scheper-Hughes and Margaret Lock describe three connected ways of understanding the body:</p>
      <div class="three-body-grid">
        <div><strong>Individual body</strong><span>Your lived experience of your own body and self.</span></div>
        <div><strong>Social body</strong><span>The meanings and stories a culture projects onto bodies.</span></div>
        <div><strong>Body politic</strong><span>How institutions and systems regulate, surveil, and control individual and collective bodies.</span></div>
      </div>
      <p>For Big LWA, likeness rights cross all three. A stolen image, abusive deepfake, impersonation, or misuse of creative work can affect someone personally, reshape how others see them, and reduce their power inside the systems circulating that material. Protection therefore has to preserve consent, context, authorship, and a usable record of what happened—not only the file itself.</p>
      <p class="three-body-source">Framework: <a href="https://doi.org/10.1525/maq.1987.1.1.02a00020" target="_blank" rel="noopener noreferrer"><cite>The Mindful Body</cite> (1987)</a>.</p>
    `;
    courtHeading.before(context);
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
      let footer = shell.querySelector('.policy-public-footer');
      if (!footer) {
        footer = makePublicFooter('policy-public-footer', route);
        shell.append(footer);
      }
      let carousel = footer.querySelector('.public-supporters');
      if (!carousel) {
        carousel = makeSupporterSection('public-supporters');
        footer.append(carousel);
      }
      renderSupporters(carousel);
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

  const makeSupporterSection = (className) => {
    const section = document.createElement('section');
    section.className = `supporter-carousel ${className}`;
    section.hidden = true;
    section.setAttribute('aria-label', 'Supported by researchers and alumni at');

    const heading = document.createElement('div');
    heading.className = 'supporter-heading';
    const title = document.createElement('h2');
    title.textContent = 'supported by researchers and alumni at';
    heading.append(title);

    const viewport = document.createElement('div');
    viewport.className = 'supporter-viewport';
    const track = document.createElement('div');
    track.className = 'supporter-track';
    viewport.append(track);
    section.append(heading, viewport);
    return section;
  };

  const renderSupporters = (section) => {
    if (!section) return;
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

  const formatAboutSupporters = () => {
    const footer = document.querySelector('body.about-site > .public-page-footer');
    if (!footer) return;
    let carousel = footer.querySelector('.public-supporters');
    if (!carousel) {
      carousel = makeSupporterSection('public-supporters');
      footer.append(carousel);
    }
    renderSupporters(carousel);
  };

  const formatLoginTail = () => {
    const page = document.getElementById('loginPage');
    if (!page) return;
    let tail = page.querySelector('.login-public-tail');
    if (!tail) {
      tail = document.createElement('div');
      tail.className = 'login-public-tail';

      const supporters = makeSupporterSection('login-supporters');

      tail.append(supporters, makePublicFooter('login-public-footer'));
      page.append(tail);
    }
    renderSupporters(tail.querySelector('.login-supporters'));
  };

  const apply = () => {
    formatPrivacy();
    formatRights();
    addThreeBodyContext();
    formatPolicyFooters();
    formatAboutSupporters();
    addStudioAboutLink();
    formatLoginTail();
    normalizePublicBrand();
  };

  apply();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply, { once: true });
  }
  window.addEventListener('load', apply, { once: true });
})();
