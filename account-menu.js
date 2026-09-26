/* BIGLWA account menu: the top-right greeting opens a small menu that leads to Settings. */
(() => {
  const TRIGGER_ID = 'profileMenuBtn';
  const MENU_ID = 'biglwaAccountMenu';

  const css = `
#${MENU_ID}{position:absolute;z-index:1200;min-width:196px;margin-top:8px;padding:6px;border-radius:14px;
  background:#fffdf9;border:1px solid rgba(117,92,79,.22);box-shadow:0 18px 44px rgba(43,32,28,.22)}
#${MENU_ID}[hidden]{display:none!important}
#${MENU_ID} .biglwa-account-menu-label{padding:7px 10px 6px;font:700 9px/1.2 Inter,ui-sans-serif,system-ui,sans-serif;
  letter-spacing:.12em;text-transform:uppercase;color:#8b8179}
#${MENU_ID} a{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 11px;border-radius:10px;
  font:600 14px/1.2 Inter,ui-sans-serif,system-ui,sans-serif;color:#221f1d;text-decoration:none}
#${MENU_ID} a:hover,#${MENU_ID} a:focus-visible{background:rgba(var(--aura-rgb,216,95,109),.12);color:#221f1d;outline:none}
#${MENU_ID} a::after{content:"\\2192";font-size:13px;color:#8b8179}
#${MENU_ID} a[aria-current="page"]{font-weight:700}
body.night-mode #${MENU_ID}{background:#2b2725;border-color:#4b443f;box-shadow:0 18px 44px rgba(0,0,0,.4)}
body.night-mode #${MENU_ID} a{color:#f3eee8}
body.night-mode #${MENU_ID} a:hover{background:rgba(var(--aura-rgb,216,95,109),.2);color:#fff}
body.night-mode #${MENU_ID} .biglwa-account-menu-label{color:#b6aaa2}
html.biglwa-preview-mode #${MENU_ID}{display:none!important}
@media(prefers-reduced-motion:reduce){#${MENU_ID}{transition:none}}
`;

  const ensureStyle = () => {
    if (document.getElementById('biglwa-account-menu-style')) return;
    const style = document.createElement('style');
    style.id = 'biglwa-account-menu-style';
    style.textContent = css;
    document.head.append(style);
  };

  const previewing = () => document.documentElement.classList.contains('biglwa-preview-mode');

  function close(menu, trigger) {
    if (!menu || menu.hidden) return;
    menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
  }

  function build(trigger) {
    if (document.getElementById(MENU_ID)) return document.getElementById(MENU_ID);

    ensureStyle();
    if (getComputedStyle(trigger).position === 'static') trigger.style.position = 'relative';

    const menu = document.createElement('div');
    menu.id = MENU_ID;
    menu.setAttribute('role', 'menu');
    menu.hidden = true;

    const label = document.createElement('p');
    label.className = 'biglwa-account-menu-label';
    label.textContent = 'Your account';

    const link = document.createElement('a');
    link.href = '/settings';
    link.setAttribute('role', 'menuitem');
    link.textContent = 'Settings';
    if (/\/settings\/?$/.test(location.pathname)) link.setAttribute('aria-current', 'page');

    menu.append(label, link);
    trigger.parentNode.insertBefore(menu, trigger.nextSibling);
    return menu;
  }

  function wire(trigger) {
    if (!trigger || trigger.dataset.biglwaAccountMenu === '1') return;
    trigger.dataset.biglwaAccountMenu = '1';

    const menu = build(trigger);
    trigger.setAttribute('aria-haspopup', 'menu');

    const toggle = (open) => {
      if (previewing()) return close(menu, trigger);
      menu.hidden = !open;
      trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    };

    trigger.addEventListener('click', (event) => {
      event.stopPropagation();
      if (previewing()) return close(menu, trigger);
      toggle(menu.hidden);
    });

    trigger.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowDown' || previewing()) return;
      event.preventDefault();
      toggle(true);
      menu.querySelector('a')?.focus();
    });

    menu.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close(menu, trigger);
        trigger.focus();
      }
    });

    menu.addEventListener('click', (event) => event.stopPropagation());

    document.addEventListener('click', () => close(menu, trigger));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !menu.hidden) {
        close(menu, trigger);
        trigger.focus();
      }
    });
    window.addEventListener('resize', () => close(menu, trigger));
  }

  async function start() {
    for (let attempt = 0; attempt < 60; attempt += 1) {
      const trigger = document.getElementById(TRIGGER_ID);
      if (trigger) return wire(trigger);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
  window.addEventListener('load', () => setTimeout(start, 0), { once: true });
})();
