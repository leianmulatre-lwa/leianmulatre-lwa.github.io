/* BIGLWA account menu: the top-right greeting opens a small menu that leads to Settings. */
(() => {
  const TRIGGER_ID = 'profileMenuBtn';
  const MENU_ID = 'biglwaAccountMenu';

  const css = `
#${MENU_ID}{position:absolute;top:calc(100% + 10px);right:0;left:auto;z-index:1200;min-width:196px;padding:6px;
  border-radius:14px;background:#fffdf9;border:1px solid rgba(117,92,79,.22);box-shadow:0 18px 44px rgba(43,32,28,.22)}
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
html.biglwa-preview-mode:not(.biglwa-owner-self-preview) #${MENU_ID}{display:none!important}
#${TRIGGER_ID}{cursor:pointer}
#${TRIGGER_ID}[aria-disabled="true"]{cursor:default}
@media(prefers-reduced-motion:reduce){#${MENU_ID}{transition:none}}
`;

  const SIGNED_OUT_HINT = 'Sign in to open your settings';
  /* Reuse Connect artwork and the NATIVE Logs and log-out controllers. */
  const actionStyle=document.createElement('style');
  actionStyle.id='biglwa-account-dots-style';
  actionStyle.textContent="\n#biglwaAccountActionDots{display:inline-flex;align-items:center;gap:5px;margin:0 9px 0 3px;flex:none;position:relative;z-index:1001}\n#studioApp #biglwaAccountActionDots>button{display:inline-grid!important;place-items:center!important;width:26px!important;height:26px!important;min-width:26px!important;padding:4px!important;border:1px solid rgba(40,27,29,.2)!important;border-radius:50%!important;box-shadow:inset 0 1px rgba(255,255,255,.44)!important;margin:0!important;cursor:pointer!important;position:relative}\n#studioApp #biglwaAccountActionDots [data-biglwa-add-user]{background:#48b579!important}\n#studioApp #biglwaAccountActionDots #studioNotificationsBtn{background:#f0c84e!important}\n#studioApp #biglwaAccountActionDots #studioSignOut{background:#f16b79!important}\n#studioApp #biglwaAccountActionDots img,#studioApp #biglwaAccountActionDots svg{display:block!important;width:15px!important;height:15px!important;max-width:15px!important;max-height:15px!important;object-fit:contain!important}\n#studioApp #biglwaAccountActionDots .visitor-mail-icon,#studioApp #biglwaAccountActionDots .studio-logout-icon{width:15px!important;height:15px!important}\n#studioApp #biglwaAccountActionDots button:focus-visible{outline:2px solid #382e34!important;outline-offset:2px!important}\nhtml.biglwa-preview-mode:not(.biglwa-owner-self-preview) #biglwaAccountActionDots{display:none!important}\n@media(max-width:590px){#biglwaAccountActionDots{gap:4px!important;margin-right:4px!important}#studioApp #biglwaAccountActionDots>button{width:24px!important;height:24px!important;min-width:24px!important}}\n";
  document.head.append(actionStyle);
  function installActionDots(trigger){
    let wrapper=document.getElementById('biglwaAccountActionDots');
    if(!wrapper){
      wrapper=document.createElement('div');wrapper.id='biglwaAccountActionDots';
      wrapper.setAttribute('role','group');wrapper.setAttribute('aria-label','Account actions');
      trigger.parentNode.insertBefore(wrapper,trigger);
    }
    let add=wrapper.querySelector('[data-biglwa-add-user]');
    if(!add){
      add=document.createElement('button');add.type='button';add.dataset.biglwaAddUser='true';
      add.title='Add user';add.setAttribute('aria-label','Add user');
      const connect=document.querySelector('#studioApp #connect .card-icon img,#studioApp #connect .card-icon svg,#studioApp [data-shortcut-route="connect"] img,#studioApp [data-sidebar-route="connect"] img,#studioApp #connect .card-icon');
      if(connect){
        const icon=connect.cloneNode(true);icon.removeAttribute('id');
        icon.setAttribute('aria-hidden','true');add.append(icon);
      }else{
        add.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M20 8v6m-3-3h6"/></svg>';
      }
      add.addEventListener('click',event=>{
        event.stopPropagation();
        if(!window.confirm('Add another user? You will sign out of this account first.'))return;
        const out=document.getElementById('studioSignOut');
        if(!out){window.alert('Sign out is unavailable in this view.');return}
        sessionStorage.setItem('biglwaOpenAddUser','1');out.click();
        let count=0;
        const openCreate=()=>{
          const login=document.getElementById('loginPage'),tab=document.getElementById('createTab');
          if(login?.classList.contains('is-active')&&tab){
            sessionStorage.removeItem('biglwaOpenAddUser');tab.click();return true
          }
          return false;
        };
        if(!openCreate()){
          const poll=setInterval(()=>{
            if(openCreate()||++count>80){clearInterval(poll);if(count>80)sessionStorage.removeItem('biglwaOpenAddUser')}
          },100);
        }
      });
      wrapper.append(add);
    }
    const reconcile=()=>{
      const logs=document.getElementById('studioNotificationsBtn');
      const logout=document.getElementById('studioSignOut');
      wrapper.querySelector('[data-biglwa-logs]')?.remove();
      if(logs&&logs.parentElement!==wrapper){logs.title='Logs';logs.setAttribute('aria-label','Logs');wrapper.append(logs)}
      if(logout&&logout.parentElement!==wrapper){logout.title='Log out';logout.setAttribute('aria-label','Log out');wrapper.append(logout)}
      return !!(logs&&logout);
    };
    if(!reconcile()){
      let attempts=0;
      const retry=setInterval(()=>{if(reconcile()||++attempts>=40)clearInterval(retry)},125);
    }
  }

  const ensureStyle = () => {
    if (document.getElementById('biglwa-account-menu-style')) return;
    const style = document.createElement('style');
    style.id = 'biglwa-account-menu-style';
    style.textContent = css;
    document.head.append(style);
  };

  const previewing = () => document.documentElement.classList.contains('biglwa-preview-mode') && !document.documentElement.classList.contains('biglwa-owner-self-preview');

  /* The greeting chip is public chrome on a profile, so it stays visible for visitors.
     Preview mode is how this app already reports "not the signed-in owner", so when it
     is on, say so on the chip instead of letting it look like a dead menu button. */
  function syncAffordance(trigger) {
    if (!trigger) return;
    if (previewing()) {
      trigger.setAttribute('aria-disabled', 'true');
      trigger.setAttribute('title', SIGNED_OUT_HINT);
    } else {
      trigger.removeAttribute('aria-disabled');
      trigger.removeAttribute('title');
    }
  }

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

    const previewLink=document.createElement('a');
    previewLink.id='biglwaMenuPreview';
    previewLink.setAttribute('role','menuitem');
    previewLink.textContent='Preview my profile';
    previewLink.href='#';
    previewLink.addEventListener('click',event=>{
      const mine=String(window.__biglwaIdentity?.username||'').trim().toLowerCase().replace(/^@/,'');
      if(!/^[a-z0-9._-]{5,24}$/.test(mine)){event.preventDefault();return}
      previewLink.href='/'+encodeURIComponent(mine)+'?preview=1';
      if(document.documentElement.classList.contains('biglwa-owner-self-preview')){
        event.preventDefault();location.assign('/studio');return;
      }
    });
    const updatePreview=()=>{
      const mine=String(window.__biglwaIdentity?.username||'').trim().toLowerCase().replace(/^@/,'');
      previewLink.href=/^[a-z0-9._-]{5,24}$/.test(mine)?'/'+encodeURIComponent(mine)+'?preview=1':'#';
      previewLink.textContent=document.documentElement.classList.contains('biglwa-owner-self-preview')?'Return to my Studio':'Preview my profile';
    };
    updatePreview();
    menu.addEventListener('pointerdown',updatePreview);
    menu.append(label,link,previewLink);
    trigger.parentNode.insertBefore(menu, trigger.nextSibling);
    installActionDots(trigger);
    /* An absolutely positioned box is placed against the containing block's padding edge,
       so a padded chip leaves the menu hanging past it. Cancel that padding to line the
       menu's own edge up with the chip's. */
    const padRight = parseFloat(getComputedStyle(trigger).paddingRight) || 0;
    if (padRight) menu.style.right = padRight + 'px';
    return menu;
  }

  function wire(trigger) {
    if (!trigger || trigger.dataset.biglwaAccountMenu === '1') return;
    trigger.dataset.biglwaAccountMenu = '1';

    const menu = build(trigger);
    trigger.setAttribute('aria-haspopup', 'menu');
    syncAffordance(trigger);

    /* standDown() drops biglwa-preview-mode once the visitor turns out to be the
       signed-in owner, which is the moment the menu starts working. */
    new MutationObserver(() => {
      syncAffordance(trigger);
      if (previewing()) close(menu, trigger);
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

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

  /* Settings is an account action, not a link on the public login screen.
     Keep it in the signed-in account menu and Studio footer only. */
  function addFooterLink(nav) {
    if (!nav || nav.querySelector('a[href="/settings"]')) return;
    const link = document.createElement('a');
    link.href = '/settings';
    link.textContent = 'Settings';
    const sibling = nav.querySelector('a');
    if (sibling?.className) link.className = sibling.className;
    nav.append(link);
  }

  function addFooterLinks() {
    if(!document.body||!document.documentElement)return;
    // Remove stale dynamically inserted links from the public login footer,
    // including ones placed by an older cached version of this script.
    document.querySelectorAll('.login-public-footer nav a[href="/settings"]').forEach(link=>link.remove());
    document.querySelectorAll('.site-policy-footer nav').forEach(addFooterLink);
  }

  function watchFooters() {
    if (!document.body) return;
    new MutationObserver(addFooterLinks).observe(document.body, { childList: true, subtree: true });
    addFooterLinks();
  }

  function openPendingAddUser(){
    if(sessionStorage.getItem('biglwaOpenAddUser')!=='1')return;
    const login=document.getElementById('loginPage');
    const create=document.getElementById('createTab');
    if(login?.classList.contains('is-active')&&create){
      sessionStorage.removeItem('biglwaOpenAddUser');
      create.click();
      return true;
    }
    return false;
  }
  async function start() {
    watchFooters();
    if(sessionStorage.getItem('biglwaOpenAddUser')==='1'){
      let tries=0;
      const poll=setInterval(()=>{
        if(openPendingAddUser()||++tries>100)clearInterval(poll);
      },100);
    }
    for (let attempt = 0; attempt < 60; attempt += 1) {
      const trigger = document.getElementById(TRIGGER_ID);
      if (trigger) {
        wire(trigger);
        addFooterLinks();
        return;
      }
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
