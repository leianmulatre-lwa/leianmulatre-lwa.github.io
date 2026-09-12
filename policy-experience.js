(() => {
  const makePrivacyRow = () => {
    const card = document.querySelector('#privacyPage .policy-card');
    if (!card || card.dataset.privacyRow === '1') return Boolean(card);

    const headings = [...card.querySelectorAll(':scope > h2')].slice(0, 3);
    if (headings.length !== 3 || headings.some(heading => !heading.nextElementSibling?.matches('p'))) return false;

    const row = document.createElement('div');
    row.className = 'privacy-principles';
    row.setAttribute('aria-label', 'Privacy principles');

    headings.forEach((heading, index) => {
      const copy = heading.nextElementSibling;
      const section = document.createElement('section');
      section.className = 'privacy-principle';

      const number = document.createElement('span');
      number.className = 'privacy-number';
      number.setAttribute('aria-hidden', 'true');
      number.textContent = String(index + 1).padStart(2, '0');

      section.append(number, heading, copy);
      row.append(section);
    });

    const lede = card.querySelector(':scope > .policy-lede');
    if (lede) lede.insertAdjacentElement('afterend', row);
    else card.prepend(row);
    card.dataset.privacyRow = '1';
    return true;
  };

  const apply = () => makePrivacyRow();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply, { once: true });
  else apply();
  window.addEventListener('load', apply, { once: true });
  setTimeout(apply, 240);
})();
