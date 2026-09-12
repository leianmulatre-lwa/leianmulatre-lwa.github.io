(() => {
  const makeNumber = (value) => {
    const number = document.createElement('span');
    number.className = 'policy-number';
    number.setAttribute('aria-hidden', 'true');
    number.textContent = String(value).padStart(2, '0');
    return number;
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

  const apply = () => {
    formatPrivacy();
    formatRights();
  };

  apply();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply, { once: true });
  }
  window.addEventListener('load', apply, { once: true });
})();
