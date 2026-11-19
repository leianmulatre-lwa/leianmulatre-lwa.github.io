/* BIG LWA · public Studio mock refinements + Discord community entry points. */
(() => {
  'use strict';
  const invite = 'https://discord.gg/TVByBPT94';
  const style = document.createElement('style');
  style.id = 'studio-preview-discord-polish';
  style.textContent = `
    @font-face{font-family:"BIGLWA Alarm Clock";src:url("/alarm%20clock%202.ttf") format("truetype");font-display:swap}
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
    #loginPage .login-mini-top>b {letter-spacing:-.035em}
    #loginPage .login-mini-card header small {display:inline-flex;align-items:center;gap:2px;font-size:0;letter-spacing:0}
    #loginPage .login-mini-card header small::after {content:'● ● ●';font:700 clamp(5px,.55vw,8px)/1 monospace;letter-spacing:0;background:linear-gradient(90deg,#58a679 0 35%,#e1b74f 35% 67%,#de5b60 67%);background-clip:text;-webkit-background-clip:text;color:transparent}
    #loginPage .login-mini-film i {border-width:2px;border-radius:3px;box-shadow:inset 0 0 9px #26141b44}
    #loginPage .login-mini-aura-art {text-shadow:0 1px 5px #430b20aa}
    #loginPage .login-mini-radio {position:relative}
    #loginPage .login-mini-radio::before {content:'FM • NOW PLAYING';position:absolute;top:12%;left:6%;font:700 clamp(4px,.48vw,7px)/1 monospace;color:#72c989;letter-spacing:.09em}
    #loginPage .login-mini-radio::after {content:'◀    ▶    ▶▶';position:absolute;bottom:9%;left:28%;right:28%;border:1px solid #40654b;border-radius:3px;text-align:center;color:#8cde9c;background:#192b21;font:700 clamp(5px,.6vw,9px)/1.4 monospace}
    #loginPage .login-mini-main *{box-sizing:border-box;min-width:0}
    #loginPage .login-mini-card{overflow:hidden}
    #loginPage .login-mini-card header{gap:2px;overflow:hidden}
    #loginPage .login-mini-window-dots{flex:none}
    #loginPage .login-mini-heading{overflow:hidden}
    #loginPage .login-mini-heading>b{overflow:hidden;text-overflow:ellipsis}
    #loginPage .login-mini-top{gap:4px;overflow:hidden}
    #loginPage .login-mini-top-right{flex-shrink:1;overflow:hidden;text-overflow:ellipsis}
    /* Laptop is a scaled Studio composition, not a separate desktop design. */
    #loginPage .login-studio-desktop {--mini-ink:#422b32;font-size:clamp(5px,.63vw,10px)!important}
    #loginPage .login-mini-top {min-height:0;height:8.8%;padding:.8% 2%;box-sizing:border-box}
    #loginPage .login-mini-brand {white-space:nowrap;font:400 clamp(9px,1.24vw,19px)/1 "CS Bergamot Stitched",Georgia,serif;color:#401a2b}
    #loginPage .login-mini-explore-toggle {max-width:none;flex:1;margin:0 8%;padding:.7% 1.6%;background:#eae6e0;color:#766d6b;border:0;text-align:left;font-size:clamp(5px,.78vw,11px)}
    #loginPage .login-mini-top-right {white-space:nowrap;color:#553f41;font-size:clamp(5px,.6vw,9px)}
    #loginPage .login-mini-content {grid-template-columns:5% minmax(0,1fr);min-height:0;flex:1}
    #loginPage .login-mini-key {padding:10% 0;gap:4%;border:0;background:#f9f5ee;justify-content:flex-start}
    #loginPage .login-mini-key>span,#loginPage .login-mini-key-tip {display:grid;place-items:center;width:78%;min-height:8%;margin:0 auto;color:#49333a;font:600 clamp(7px,1vw,15px)/1 Georgia,serif}
    #loginPage .login-mini-key-tip {margin-bottom:12%;height:13%;background:#f1e6d9;border-radius:6px}
    #loginPage .login-mini-symbol {display:inline-block;width:1.1em;height:1.1em;vertical-align:middle;object-fit:contain;flex:none}
    #loginPage .login-mini-key .login-mini-symbol {width:clamp(9px,1.23vw,17px);height:clamp(9px,1.23vw,17px)}
    #loginPage .login-mini-main {display:flex;flex-direction:column;gap:1.6%;padding:1% 1.3%;overflow:hidden;min-width:0;min-height:0;background:#ede2d7}
    #loginPage .login-mini-profile {display:flex;align-items:flex-start;gap:2%;height:25%;flex:0 0 25%;min-height:0;padding:1.5%;box-sizing:border-box;background:linear-gradient(120deg,#b4917e,#bba090 52%,#a98576);border-radius:7px;box-shadow:inset 0 0 20px #6b443524;color:#34232a}
    #loginPage .login-mini-profile-pic {display:grid;place-items:center;flex:0 0 9%;height:75%;border-radius:11px;background:linear-gradient(135deg,#49352f,#bc7758);color:#ffddbb;font:400 clamp(15px,2vw,29px)/1 "CS Bergamot Stitched",Georgia,serif}
    #loginPage .login-mini-profile-info {flex:1;display:flex;flex-direction:column;gap:6%;min-width:0}
    #loginPage .login-mini-profile-info>strong {font:400 clamp(9px,1.28vw,18px)/1.05 "CS Bergamot Stitched",Georgia,serif}
    #loginPage .login-mini-profile-info>small {font:600 clamp(5px,.64vw,9px)/1 system-ui,sans-serif}
    #loginPage .login-mini-scoreboard {display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:2%;padding:1% 1.4%;border:1px solid #64493b55;border-radius:5px;background:#fff8ef91;box-shadow:inset 0 1px 0 #fff9,0 1px 3px #3d231b21}
    #loginPage .login-mini-scoreboard>span {display:grid;place-items:center;min-width:0;border-right:1px solid #64493b2e}
    #loginPage .login-mini-scoreboard>span:last-child {border-right:0}
    #loginPage .login-mini-scoreboard b {font:700 clamp(9px,1.08vw,16px)/1 "BIGLWA Alarm Clock","Alarm Clock",monospace;font-variant-numeric:tabular-nums lining-nums;color:#4b1f32;letter-spacing:.04em}
    #loginPage .login-mini-scoreboard small {font:700 clamp(4px,.48vw,7px)/1.05 system-ui,sans-serif;color:#62444b;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%}
    #loginPage .login-mini-stories {display:flex;align-items:center;justify-content:space-around;gap:6px;flex:1;min-height:0}
    #loginPage .login-mini-stories i {display:grid;place-items:center;aspect-ratio:1;width:clamp(12px,2.1vw,31px);height:auto;max-height:100%;border-radius:50%;border:2px solid #ca7a57;background:radial-gradient(circle at 40% 40%,#b8907c,#46383b 76%);font-style:normal}
    #loginPage .login-mini-stories i:nth-child(2n) {background:radial-gradient(circle,#e7b47f,#82656f 72%)}
    #loginPage .login-mini-upper,#loginPage .login-mini-lower {display:grid;grid-template-columns:1.55fr .8fr .8fr 1.42fr;gap:1.35%;min-height:0}
    #loginPage .login-mini-upper {flex:1.15}
    #loginPage .login-mini-lower {flex:.85}
    #loginPage .login-mini-card {border-radius:6px;box-shadow:0 2px 3px #4e2b2b20;min-height:0}
    #loginPage .login-mini-card header {flex:none;height:22%;min-height:0;padding:2.5% 4%;box-sizing:border-box;font:400 clamp(7px,1vw,15px)/1 "CS Bergamot Stitched",Georgia,serif}
    #loginPage .login-mini-heading {display:inline-flex;gap:5px;align-items:center;min-width:0}
    #loginPage .login-mini-heading>b {font:inherit;white-space:nowrap}
    #loginPage .login-mini-heading>.login-mini-symbol {width:clamp(10px,1.1vw,17px);height:clamp(10px,1.1vw,17px)}
    #loginPage .login-mini-window-dots {display:inline-flex;gap:2px;align-items:center}
    #loginPage .login-mini-window-dots i {display:block;width:clamp(3px,.45vw,7px);height:clamp(3px,.45vw,7px);border-radius:50%;background:#50a66b}
    #loginPage .login-mini-window-dots i:nth-child(2) {background:#e6bd47}
    #loginPage .login-mini-window-dots i:nth-child(3) {background:#e25e62}
    #loginPage .login-mini-journal-paper {flex:1;display:flex;flex-direction:column;gap:0;padding:3% 4%;background:repeating-linear-gradient(to bottom,#fffaf2 0 20%,#9dc5d5 20.5%,#fffaf2 21% 39%);overflow:hidden}
    #loginPage .login-mini-journal-paper span {font:700 clamp(4px,.46vw,7px)/1.1 monospace;letter-spacing:.08em;color:#51434f}
    #loginPage .login-mini-journal-paper em {flex:1;border-right:1px solid #a76db3;margin-right:17%;opacity:.8}
    #loginPage .login-mini-aura-art {font:700 clamp(7px,.95vw,13px)/1.1 Georgia,serif;color:#322834;background:radial-gradient(ellipse at 45% 40%,#b69b82,#ab8b76)}
    #loginPage .login-mini-sun {display:inline-block;width:clamp(9px,1.4vw,20px);height:clamp(9px,1.4vw,20px);border-radius:50%;margin-right:6px;background:#f5a434;box-shadow:0 0 16px 7px #eeaa4d75}
    #loginPage .login-mini-avatar-stage {flex:1;position:relative;display:grid;place-items:center;background:linear-gradient(135deg,#ad8b7b,#b79e87);overflow:hidden}
    #loginPage .login-mini-avatar-person {position:relative;font:800 clamp(18px,2vw,29px)/1 Georgia,serif;color:#5b4130;transform:translateY(-5%);text-align:center}
    #loginPage .login-mini-avatar-person span {display:block;font-size:1.25em;color:#f0a332}
    #loginPage .login-mini-avatar-stage small {position:absolute;bottom:3%;left:4%;background:#ffffff99;color:#46404a;font:600 clamp(4px,.45vw,7px)/1 monospace}
    #loginPage .login-mini-tunes {background:#222424}
    #loginPage .login-mini-tunes header {background:#1f2424;color:#e9eee4}
    #loginPage .login-mini-tuner {margin:3% 4% 0;border:1px solid #56695d;border-radius:3px;color:#8cfcab;background:#0c1c14;padding:2%;font:700 clamp(4px,.57vw,8px)/1 monospace}
    #loginPage .login-mini-song {flex:1;min-height:0;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:3%;margin:2.5% 8%;border:1px solid #526456;border-radius:5px;background:repeating-linear-gradient(#0a2015 0 3px,#0e281a 3px 5px);color:#a6ffc4}
    #loginPage .login-mini-song small {font:700 clamp(4px,.4vw,6px)/1 monospace;letter-spacing:.09em}
    #loginPage .login-mini-song b {font:800 clamp(5px,.7vw,10px)/1 monospace}
    #loginPage .login-mini-song span {font:500 clamp(4px,.49vw,7px)/1 monospace}
    #loginPage .login-mini-eq {color:#68e49c;letter-spacing:.16em}
    #loginPage .login-mini-shortcuts {display:flex;justify-content:space-between;align-items:center;gap:1%;height:8%;flex:0 0 8%;padding:0 1%;border-radius:6px;background:#b59a86;color:#322e30}
    #loginPage .login-mini-shortcuts>span {display:flex;align-items:center;justify-content:center;gap:3px;flex:1;min-width:0;white-space:nowrap;font:600 clamp(4px,.57vw,8px)/1 system-ui,sans-serif}
    #loginPage .login-mini-shortcuts>span.selected {height:88%;border-radius:6px;background:#f39a37;color:#392126}
    #loginPage .login-mini-shortcuts .login-mini-symbol {width:1em;height:1em}
    #loginPage .login-mini-landscape {padding-bottom:4%}
    #loginPage .login-mini-film {align-items:center;padding:5%}
    #loginPage .login-mini-orbits {display:flex;align-items:center;justify-content:center;gap:6%;background:radial-gradient(circle at 25% 20%,#d8b1e0,transparent 48%),linear-gradient(135deg,#a27fba,#554b8c 75%)}
    #loginPage .login-mini-orbits i {width:13%;aspect-ratio:1;border:1px solid #fff1d4;border-radius:50%;box-shadow:0 0 7px #efe2fc9c;background:#f5e1c3}
    #loginPage .login-mini-orbits i:nth-child(2) {background:#e48aab}
    #loginPage .login-mini-orbits i:nth-child(3) {background:#8ed0b5}
    #loginPage .login-mini-orbits i:nth-child(4) {background:#cf9cd5}
    #loginPage .login-mini-feed p {flex:0 0 auto}
    #loginPage .login-mini-dock {height:4.7%;box-sizing:border-box}
    #loginPage .login-mini-radio::before,#loginPage .login-mini-radio::after {display:none}
    @media(max-width:650px){#loginPage .login-mini-scoreboard small{font-size:clamp(3px,.85vw,5px)}#loginPage .login-mini-shortcuts>span:nth-child(2),#loginPage .login-mini-shortcuts>span:nth-child(6){display:none}}
    #studioApp .biglwa-skeleton-hub .biglwa-discord-invite {margin:3px 0 7px;justify-self:start}
    #studioApp #moduleWorkspace[data-module-key="rooms"] .biglwa-discord-invite {margin:12px 0 16px}
    #studioApp .biglwa-discord-invite {display:flex;align-items:center;gap:9px;max-width:100%;width:fit-content;margin:12px 0;padding:9px 13px;border:1px solid #916a7b;border-radius:10px;background:#fbecdd;color:#602b43;font:700 12px/1.3 system-ui,sans-serif;text-decoration:none;box-shadow:0 2px 0 #68334821}
    #studioApp .biglwa-discord-invite[hidden] {display:none!important}
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
    // Target the actual Skeleton Key component, not a guessed widget heading.
    const hub = studio.querySelector('.biglwa-skeleton-hub');
    if (hub && !hub.querySelector('[data-discord-location="skeleton"]')) {
      const link = makeLink('skeleton');
      const title = hub.querySelector('.biglwa-skeleton-title');
      if (title) title.insertAdjacentElement('afterend', link);
      else hub.prepend(link);
    }
    // Lounge invitation stays in the Lounge view, not the private Room.
    const workspace = studio.querySelector('#moduleWorkspace[data-module-key="rooms"]');
    if (workspace) {
      let link = workspace.querySelector('[data-discord-location="lounge"]');
      const scene = workspace.querySelector('.room-pixel-scene');
      const tabs = workspace.querySelector('.room-mode-tabs');
      if (!link && (scene || tabs)) {
        link = makeLink('lounge');
        (scene || tabs).insertAdjacentElement('afterend', link);
      }
      if (link) {
        const selected = workspace.querySelector('[data-room-mode="lounge"][aria-selected="true"],[data-room-mode="lounge"].active,[data-room-mode="lounge"].is-active');
        const activeRoom = workspace.querySelector('[data-room-mode="room"][aria-selected="true"],[data-room-mode="room"].active,[data-room-mode="room"].is-active');
        const mode = workspace.dataset.roomMode || workspace.querySelector('[data-room-mode-panel]:not([hidden])')?.dataset.roomModePanel;
        const loungeActive = !!selected || mode === 'lounge' || (!activeRoom && !mode && !tabs);
        if (link.hidden === loungeActive) link.hidden = !loungeActive;
      }
    }
  }
  let queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; mount(); });
  }
  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-selected','class','data-room-mode','hidden']});
  document.addEventListener('click', event => {
    if (event.target?.closest?.('[data-room-mode]')) schedule();
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();
})();
