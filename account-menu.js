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
#studioApp #${TRIGGER_ID} .welcome{
  display:flex;flex-direction:column;justify-content:center;align-self:center;
  position:relative;top:7px;line-height:1.2;
}
#studioApp #${TRIGGER_ID} .welcome strong{line-height:1.2;}
#${TRIGGER_ID}[aria-disabled="true"]{cursor:default}
@media(prefers-reduced-motion:reduce){#${MENU_ID}{transition:none}}
`;

  const SIGNED_OUT_HINT = 'Sign in to open your settings';
  /* Reuse Connect artwork and the NATIVE Logs and log-out controllers. */
  const actionStyle=document.createElement('style');
  actionStyle.id='biglwa-account-dots-style';
  actionStyle.textContent=`\n #biglwaAccountActionDots{display:inline-flex;align-items:center;gap:9px;margin:0 0 0 13px;flex:none;position:relative;z-index:1001}\n#studioApp #biglwaAccountActionDots>button{display:inline-grid!important;place-items:center!important;width:26px!important;height:26px!important;min-width:26px!important;padding:4px!important;border:1px solid rgba(40,27,29,.2)!important;border-radius:50%!important;box-shadow:inset 0 1px rgba(255,255,255,.44)!important;margin:0!important;cursor:pointer!important;position:relative}\n#studioApp #biglwaAccountActionDots [data-biglwa-open-connect]{background:#48b579!important}#studioApp #biglwaAccountActionDots [data-biglwa-open-connect]{display:grid!important;place-items:center!important;padding:0!important}
#studioApp #biglwaAccountActionDots [data-biglwa-open-connect]>.card-icon,
#studioApp #biglwaAccountActionDots [data-biglwa-open-connect]>img,
#studioApp #biglwaAccountActionDots [data-biglwa-open-connect]>svg{
  display:grid!important;place-items:center!important;position:static!important;
  inset:auto!important;transform:none!important;margin:0 auto!important;
  width:12px!important;height:12px!important;max-width:12px!important;max-height:12px!important;
  padding:0!important;line-height:1!important
}
#studioApp #biglwaAccountActionDots [data-biglwa-open-connect] .card-icon img,
#studioApp #biglwaAccountActionDots [data-biglwa-open-connect] .card-icon svg{
  display:block!important;width:12px!important;height:12px!important;
  max-width:12px!important;max-height:12px!important;
  margin:auto!important;transform:none!important;position:static!important
}\n#studioApp #biglwaAccountActionDots #studioNotificationsBtn{background:#f0c84e!important}\n#studioApp #biglwaAccountActionDots #studioSignOut{background:#f16b79!important}\n#studioApp #biglwaAccountActionDots img,#studioApp #biglwaAccountActionDots svg{display:block!important;width:15px!important;height:15px!important;max-width:15px!important;max-height:15px!important;object-fit:contain!important}#studioApp #biglwaAccountActionDots [data-biglwa-open-connect] img,#studioApp #biglwaAccountActionDots [data-biglwa-open-connect] svg{width:12px!important;height:12px!important;max-width:12px!important;max-height:12px!important}\n#studioApp #biglwaAccountActionDots .visitor-mail-icon,#studioApp #biglwaAccountActionDots .studio-logout-icon{width:15px!important;height:15px!important}\n#studioApp #biglwaAccountActionDots button:focus-visible{outline:2px solid #382e34!important;outline-offset:2px!important}\nhtml.biglwa-preview-mode:not(.biglwa-owner-self-preview) #biglwaAccountActionDots{display:none!important}\n@media(max-width:590px){#biglwaAccountActionDots{gap:7px!important;margin-left:8px!important;margin-right:2px!important}#studioApp #biglwaAccountActionDots>button{width:24px!important;height:24px!important;min-width:24px!important}}\n`;
  actionStyle.textContent+=`
  #studioApp #studioNotificationsBtn[data-wallpaper-flagged="true"]::after{content:"";position:absolute;right:-2px;top:-3px;width:8px;height:8px;background:#d64c58;border:2px solid #fffaf5;border-radius:50%;pointer-events:none}
  #biglwaWallpaperLogPopover{position:absolute;right:0;top:37px;z-index:10030;display:grid;gap:8px;width:min(310px,calc(100vw - 32px));max-height:min(380px,58vh);overflow:auto;padding:12px;border:1px solid #a9898b;border-radius:11px;background:#fff9f3;color:#32282b;box-shadow:0 16px 40px #1c102c40;font:12px/1.4 system-ui}
  #biglwaWallpaperLogPopover[hidden]{display:none!important}
  #biglwaWallpaperLogPopover .wallpaper-log-heading{display:flex;justify-content:space-between;align-items:center;gap:8px;font-weight:760}
  #biglwaWallpaperLogPopover .wallpaper-log-heading button{font:inherit;cursor:pointer;padding:2px 7px;border-radius:6px;border:1px solid #b99da6;background:#fff}
  #biglwaWallpaperLogPopover .wallpaper-log-entry{padding:8px;border:1px solid #dfcdd0;border-radius:8px;background:#fff3ec}
  #biglwaWallpaperLogPopover .wallpaper-log-entry strong,#biglwaWallpaperLogPopover .wallpaper-log-entry span{display:block}
  #biglwaWallpaperLogPopover .wallpaper-log-entry span{font-size:11px;margin-top:2px}
  `;
  document.head.append(actionStyle);
  function installActionDots(trigger){
    let wrapper=document.getElementById('biglwaAccountActionDots');
    if(!wrapper){
      wrapper=document.createElement('div');wrapper.id='biglwaAccountActionDots';
      wrapper.setAttribute('role','group');wrapper.setAttribute('aria-label','Account actions');
      trigger.insertAdjacentElement('afterend',wrapper);
    }
    let add=wrapper.querySelector('[data-biglwa-open-connect]');
    if(!add){
      add=document.createElement('button');add.type='button';add.dataset.biglwaOpenConnect='true';
      add.title='Open Connect · find and add people';add.setAttribute('aria-label','Open Connect to find and add people');
      const connect=document.querySelector('#studioApp #connect .card-icon img,#studioApp #connect .card-icon svg,#studioApp [data-shortcut-route="connect"] img,#studioApp [data-sidebar-route="connect"] img,#studioApp #connect .card-icon');
      if(connect){
        const icon=connect.cloneNode(true);icon.removeAttribute('id');
        icon.setAttribute('aria-hidden','true');add.append(icon);
      }else{
        add.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M20 8v6m-3-3h6"/></svg>';
      }
      add.addEventListener('click',event=>{
        event.preventDefault();event.stopPropagation();
        // Connect is for finding and adding people, never for creating a new login.
        if(typeof window.openBIGLWAModule==='function'){window.openBIGLWAModule('connect');return}
        const trigger=document.querySelector('#studioApp [data-open="connect"],#studioApp [data-sidebar-route="connect"]');
        if(trigger){trigger.click();return}
        window.location.assign('/studio?panel=connect');
      });
      wrapper.append(add);
    }
    function walletLogs(){
      const uid=String(window.__biglwaIdentity?.uid||window.BigLWAAccountStorage?.uid||'');
      if(!uid)return [];
      try{const records=JSON.parse(localStorage.getItem('biglwaWallpaperLogV1:'+uid)||'[]');return Array.isArray(records)?records.slice(0,12):[]}catch{return []}
    }
    function installWallpaperLogs(logs){
      if(logs.dataset.wallpaperLogBound==='1')return;
      logs.dataset.wallpaperLogBound='1';
      let panel=wrapper.querySelector('#biglwaWallpaperLogPopover');
      if(!panel){
        panel=document.createElement('section');panel.id='biglwaWallpaperLogPopover';
        panel.hidden=true;panel.setAttribute('role','region');panel.setAttribute('aria-label','Wallpaper safety alerts');
        wrapper.appendChild(panel);
      }
      const update=()=>{
        const entries=walletLogs();
        logs.dataset.wallpaperFlagged=String(entries.length>0);
        if(entries.length)logs.title='Logs · '+entries.length+' wallpaper safety alert'+(entries.length===1?'':'s');
      };
      const show=()=>{
        const entries=walletLogs();
        if(!entries.length)return;
        if(!panel.hidden){panel.hidden=true;return}
        panel.replaceChildren();
        const top=document.createElement('div');top.className='wallpaper-log-heading';
        const heading=document.createElement('strong');heading.textContent='Wallpaper safety · Logs';
        const close=document.createElement('button');close.type='button';close.textContent='Close';close.addEventListener('click',()=>{panel.hidden=true});
        top.append(heading,close);panel.append(top);
        for(const entry of entries){
          const item=document.createElement('div');item.className='wallpaper-log-entry';
          const title=document.createElement('strong');title.textContent=entry.title||'Wallpaper review';
          const detail=document.createElement('span');detail.textContent=entry.detail||'A wallpaper needs review.';
          const when=document.createElement('span');when.textContent=Number.isFinite(entry.at)?new Date(entry.at).toLocaleString():'';
          item.append(title,detail,when);panel.append(item);
        }
        panel.hidden=false;
      };
      logs.addEventListener('click',show);
      document.addEventListener('biglwa:wallpaper-review-alert',update);
      update();
    }
    const reconcile=()=>{
      const logs=document.getElementById('studioNotificationsBtn');
      const logout=document.getElementById('studioSignOut');
      wrapper.querySelector('[data-biglwa-logs]')?.remove();
      if(logs&&logs.parentElement!==wrapper){logs.title='Logs';logs.setAttribute('aria-label','Logs');wrapper.append(logs)}
      if(logs)installWallpaperLogs(logs);
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
    const ownsThisPreview=()=>{
      if(document.documentElement.classList.contains('biglwa-owner-self-preview'))return true;
      const mine=String(window.__biglwaIdentity?.username||'').trim().toLowerCase().replace(/^@/,'');
      const route=decodeURIComponent(location.pathname.replace(/^\/+|\/+$/g,'')).toLowerCase();
      // URL alone cannot make another member's page the signed-in owner's
      // preview. Require an authenticated matching identity AND active preview.
      return !!mine && route===mine &&
        new URLSearchParams(location.search).get('preview')==='1' &&
        window.BigLWAStudioPreview?.state?.().active===true;
    };
    previewLink.addEventListener('click',event=>{
      const mine=String(window.__biglwaIdentity?.username||'').trim().toLowerCase().replace(/^@/,'');
      if(!/^[a-z0-9._-]{5,24}$/.test(mine)){event.preventDefault();return}
      // A full navigation is intentional: loading the visitor's route
      // initializes the read-only public projection rather than owner Studio.
      event.preventDefault();event.stopImmediatePropagation();
      location.assign(ownsThisPreview()?'/studio':'/'+encodeURIComponent(mine)+'?preview=1');
    });
    const updatePreview=()=>{
      const mine=String(window.__biglwaIdentity?.username||'').trim().toLowerCase().replace(/^@/,'');
      const back=ownsThisPreview();
      previewLink.href=back?'/studio':/^[a-z0-9._-]{5,24}$/.test(mine)?'/'+encodeURIComponent(mine)+'?preview=1':'#';
      previewLink.textContent=back?'Return to profile':'Preview my profile';
      previewLink.setAttribute('aria-label',back?'Return to your Studio profile':'Preview your profile as a visitor');
    };
    updatePreview();
    menu.addEventListener('pointerdown',updatePreview);
    window.addEventListener('biglwa:preview-owner-state',updatePreview);
    // The public module may initialize after this account menu is built.
    new MutationObserver(updatePreview).observe(document.documentElement,{
      attributes:true,attributeFilter:['class']
    });
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
      menu.querySelector('#biglwaMenuPreview')?.dispatchEvent(new Event('pointerdown',{bubbles:true}));
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
