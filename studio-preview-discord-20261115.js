/* BIG LWA · public Studio mock refinements + Discord community entry points. */
(() => {
  'use strict';
  const invite = 'https://discord.gg/TVByBPT94';
  const style = document.createElement('style');
  style.id = 'studio-preview-discord-polish';
  style.textContent = `
    /* Keep the curtain/laptop composition. Only polish the UI *inside* the screen. */
    #loginPage .login-studio-desktop {background:#d7bca9;color:#382b2a}
    #loginPage .login-mini-top {padding:1.35% 2.4%;background:#f6f0e7;gap:2%}
    #loginPage .login-mini-key {background:#d7b5a9;gap:8%}
    #loginPage .login-mini-key span {font-weight:750;letter-spacing:.015em}
    #loginPage .login-mini-widgets {gap:2%;padding:1.65%}
    #loginPage .login-mini-card {border-color:#b69c8e;border-radius:7px;background:#ead7c7;box-shadow:0 2px 3px #62433a24}
    #loginPage .login-mini-card header {background:#e9dacd;padding:3.3% 5.5%;color:#39252d}
    #loginPage .login-mini-card header small {color:#4d9b67;letter-spacing:0}
    #loginPage .login-mini-aura-art {background:radial-gradient(ellipse at 40% 50%,#d78a8e18,transparent 65%),repeating-linear-gradient(94deg,#45051a50 0 7%,transparent 7% 13%),linear-gradient(110deg,#7a0927,#c34a62 52%,#540b28)}
    #loginPage .login-mini-orbits {background:radial-gradient(ellipse at 27% 38%,#e0b2e6,transparent 48%),linear-gradient(140deg,#8e6a9e,#7b5883 60%,#263759)}
    #loginPage .login-mini-landscape {background:linear-gradient(#7eb4d7 0 52%,#dceee5 52% 58%,#61a73c 58% 80%,#2f7e37 80%)}
    #loginPage .login-mini-screen {background:radial-gradient(ellipse at 50% 52%,#5b2332,#17131b 78%)}
    #loginPage .login-mini-dock {background:#f7e8da;padding:.7% 2.4%}
    #loginPage .login-mini-explore-toggle {min-width:0;flex:1;max-width:56%;text-align:left;border:1px solid #d8a9a2;border-radius:30px;background:#efe3d8;color:#682638;padding:1% 2.2%;font:700 clamp(6px,.77vw,12px)/1.1 system-ui,sans-serif}
    #loginPage .login-mini-top>small {margin-right:2%}
    #loginPage .login-mini-radio {position:relative}
    #loginPage .login-mini-radio::before {content:'FM • NOW PLAYING';position:absolute;top:12%;left:6%;font:700 clamp(4px,.48vw,7px)/1 monospace;color:#72c989;letter-spacing:.09em}
    #loginPage .login-mini-radio::after {content:'◀    ▶    ▶▶';position:absolute;bottom:9%;left:28%;right:28%;border:1px solid #40654b;border-radius:3px;text-align:center;color:#8cde9c;background:#192b21;font:700 clamp(5px,.6vw,9px)/1.4 monospace}
    #studioApp .biglwa-discord-invite {display:flex;align-items:center;gap:9px;max-width:100%;width:fit-content;margin:12px 0;padding:9px 13px;border:1px solid #916a7b;border-radius:10px;background:#fbecdd;color:#602b43;font:700 12px/1.3 system-ui,sans-serif;text-decoration:none;box-shadow:0 2px 0 #68334821}
    #studioApp .biglwa-discord-invite:hover {background:#f6ded7;text-decoration:underline}
    #studioApp .biglwa-discord-invite:focus-visible {outline:3px solid #b35670;outline-offset:3px}
    #studioApp .biglwa-discord-invite small {font:500 11px/1.3 system-ui,sans-serif;opacity:.8}
  `;
  (document.head || document.documentElement).append(style);
  function makeLink(location) {
    const a = document.createElement('a');
    a.className = 'biglwa-discord-invite';
    a.dataset.discordLocation = location;
    a.href = invite;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.setAttribute('aria-label', 'Join the BIG LWA Discord community (opens Discord)');
    a.innerHTML = '<span aria-hidden="true">♧</span><span>Join BIG LWA on Discord <small>Community conversations ↗</small></span>';
    return a;
  }
  function mount() {
    const studio = document.getElementById('studioApp');
    if (!studio) return;
    const lounge = studio.querySelector('#moduleWorkspace[data-module-key="rooms"]');
    if (lounge && !lounge.querySelector('[data-discord-location="lounge"]')) {
      const scene = lounge.querySelector('.room-pixel-scene');
      const anchor = scene || lounge.querySelector('.room-mode-tabs');
      const link = makeLink('lounge');
      if (anchor) anchor.insertAdjacentElement('afterend', link);
      else lounge.append(link);
    }
    // The Skeleton Key may be re-rendered as Studio changes widgets.
    const headings = studio.querySelectorAll('h1,h2,h3,.card-kicker,.widget-title');
    for (const heading of headings) {
      if (heading.textContent.trim().toLowerCase() !== 'skeleton key') continue;
      const card = heading.closest('[data-widget-id],.studio-widget,.widget-card,.widget,article');
      if (!card || card === studio || card.querySelector('[data-discord-location="skeleton"]')) continue;
      const link = makeLink('skeleton');
      link.style.margin = '10px 0';
      const settings = [...card.querySelectorAll('a,button')].find(el=>el.textContent.trim().toLowerCase()==='settings');
      if (settings) settings.insertAdjacentElement('afterend',link);
      else heading.insertAdjacentElement('afterend',link);
      break;
    }
  }
  let queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; mount(); });
  }
  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();
})();
