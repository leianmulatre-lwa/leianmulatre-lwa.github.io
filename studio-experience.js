(()=>{
  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const ORDER_KEY='biglwaWidgetOrderV2';
  const NOTE_KEY='biglwaVisitorNotesLocal';
  const MEDIA_DB='biglwa-studio-experience-v1';
  const MEDIA_STORE='records';
  const FULL_WIDGET_ROUTES=new Set(['create','calendar','orbit','feed','connect','camera','diary','stream','library','archive','closet','trophies','rooms','room','boards','notes','projects','games','learn','didyouknow','map']);
  const STUDIO_ICONS={
    teepee:'<svg class="studio-teepee-icon" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M3 27h26M6 27 17.5 7M26 27 14.5 7M12.5 27 16 21l3.5 6" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    hanger:'<span class="studio-symbol-mark studio-hanger-symbol" aria-hidden="true"><img class="studio-symbol-image" src="/assets/projects-symbol.png?v=20260914-projects-1" alt="" width="315" height="416" loading="eager" decoding="async"></span>',
    projects:'<span class="studio-symbol-mark studio-projects-symbol" aria-hidden="true"><img class="studio-symbol-image" src="/assets/projects-symbol.png?v=20260914-projects-1" alt="" width="1254" height="1254" loading="eager" decoding="async"></span>',
    feed:'<span class="studio-symbol-mark studio-feed-symbol" aria-hidden="true"><img class="studio-symbol-image" src="/assets/feed-symbol-generated.png?v=20260914-feed-1" alt="" width="377" height="280" loading="eager" decoding="async"></span>',
    diary:'<span class="studio-symbol-mark studio-diary-symbol" aria-hidden="true"><img class="studio-symbol-image" src="/assets/diary-symbol-generated.png?v=20260914-symbol-cutover-1" alt="" width="282" height="347" loading="eager" decoding="async"></span>',
    check:'<span class="studio-symbol-mark studio-check-symbol" aria-hidden="true"><img class="studio-symbol-image" src="/assets/did-you-know-symbol-generated.png?v=20260914-symbol-cutover-1" alt="" width="407" height="375" loading="eager" decoding="async"></span>',
    quickNotes:'<span class="studio-symbol-mark studio-quick-notes-symbol" aria-hidden="true"><img class="studio-symbol-image" src="/assets/quick-notes-symbol-generated.png?v=20260914-quick-notes-1" alt="" width="375" height="413" loading="eager" decoding="async"></span>',
    mail:'<svg class="visitor-mail-icon" viewBox="0 0 32 32" fill="none" aria-hidden="true"><circle cx="16" cy="16" r="14" stroke="currentColor" stroke-width="1.8"/><rect x="7.5" y="10.5" width="17" height="12" rx="1.5" stroke="currentColor" stroke-width="1.8"/><path d="m8.5 11.5 7.5 6 7.5-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };
  let musicUrl='';
  let coverUrl='';
  let musicRestored=false;

  function ensureStyles(){
    let style=$('#biglwa-studio-experience-style');
    if(!style){style=document.createElement('style');style.id='biglwa-studio-experience-style';document.head.appendChild(style)}
    style.textContent=`
      /* Keep the profile editor and the three small widgets in one calm composition. */
      #studioApp .hero{grid-template-columns:minmax(0,1fr) minmax(286px,326px)!important;grid-template-rows:auto auto!important;grid-auto-flow:row!important;gap:16px 18px!important;align-items:start!important;align-content:start!important;padding:40px 16px 34px!important}
      #studioApp .hero>.profile-card{grid-column:1!important;grid-row:1!important;align-self:start!important;min-height:282px!important}
      #studioApp .hero-widget-rail{grid-column:2!important;grid-row:1!important;display:grid!important;grid-template-columns:1fr!important;gap:12px!important;align-content:start!important;min-width:0!important}
      #studioApp .hero-widget-rail>.music-card,#studioApp .hero-widget-rail>.aura-card,#studioApp .hero-widget-rail>.visitor-log-card{position:relative!important;inset:auto!important;width:100%!important;min-width:0!important;max-width:none!important;height:auto!important;min-height:118px!important;max-height:none!important;margin:0!important;padding:16px 18px!important;box-sizing:border-box!important;overflow:visible!important}
      #studioApp .hero-widget-rail>.visitor-log-card{min-height:142px!important}
      #studioApp .hero>.hero-action-bar{grid-column:1/-1!important;grid-row:2!important;margin:4px 0 0!important}
      #studioApp .profile-card.profile-is-editing{min-height:430px!important}
      #studioApp.profile-editor-wallpaper .profile-card.profile-is-editing{min-height:520px!important}
      #studioApp .profile-card #wallpaperPanel{max-height:480px!important;scrollbar-gutter:stable!important}
      #studioApp .profile-card #wallpaperPanel .panel-title,#studioApp .profile-editor-actions{background-color:transparent!important}
      #studioApp .profile-card #wallpaperPanel .panel-title{background-image:linear-gradient(to bottom,rgba(250,246,240,.98) 72%,rgba(250,246,240,0))!important}
      #studioApp .profile-editor-actions{background-image:linear-gradient(to top,rgba(250,246,240,.98) 76%,rgba(250,246,240,0))!important}

      #studioApp .hero-widget-rail>.customizable-widget,#studioApp .masonry>.card:not(.manifesto-card){position:relative!important}
      #studioApp .widget-window-controls{top:13px!important;right:14px!important;left:auto!important;bottom:auto!important;position:absolute!important}
      #studioApp .widget-drag-handle{position:absolute!important;top:13px!important;right:auto!important;left:50%!important;z-index:6!important;display:grid!important;place-items:center!important;width:23px!important;height:18px!important;margin:0!important;padding:0!important;border:0!important;border-radius:6px!important;background:rgba(55,47,43,.08)!important;color:var(--widget-muted,#746e68)!important;cursor:grab!important;touch-action:none!important;line-height:1!important;transform:translateX(-50%)!important}
      #studioApp .widget-drag-handle:active{cursor:grabbing!important}
      #studioApp .widget-drag-handle svg{width:12px;height:12px;display:block}
      #studioApp .widget-drag-handle:focus-visible{outline:2px solid rgb(var(--aura-rgb,216,95,109));outline-offset:2px}
      #studioApp .widget-dragging-active{opacity:.62!important;transform:scale(.985)!important;box-shadow:0 18px 38px rgba(30,20,17,.22)!important;z-index:35!important}
      #studioApp .widget-drop-target{outline:2px solid rgb(var(--aura-rgb,216,95,109))!important;outline-offset:3px!important}
      #studioApp .hero-widget-rail .card-kicker{padding-right:100px!important;margin-bottom:10px!important}

      #studioApp .music-card .music-row{align-items:center!important;gap:10px!important}
      #studioApp .music-card .album-art{position:relative!important;overflow:hidden!important;isolation:isolate!important;flex:0 0 48px!important;width:48px!important;height:48px!important;border-radius:10px!important;display:grid!important;place-items:center!important;background:#221d1d!important;color:#f6a4b4!important}
      #studioApp .music-card .album-art img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:2}
      #studioApp .music-card .album-art.has-cover>span{opacity:0}
      #studioApp .music-card .music-copy{min-width:0;flex:1}
      #studioApp .music-card .music-copy strong,#studioApp .music-card .music-copy span{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      #studioApp .music-card .music-copy strong{font:700 14px/1.2 Inter,ui-sans-serif,system-ui,sans-serif!important}
      #studioApp .music-card .music-copy span{font:10px/1.3 Inter,ui-sans-serif,system-ui,sans-serif!important;color:var(--widget-muted,#77716b)!important}
      #studioApp .music-card .music-file-actions{display:flex;gap:6px;margin-top:10px}
      #studioApp .music-card .music-file-actions button,#studioApp .visitor-log-actions button,#visitorLogDialog button{border:1px solid rgba(70,58,52,.16);border-radius:999px;background:rgba(255,255,255,.52);color:inherit;padding:6px 9px;font:650 9px/1 Inter,ui-sans-serif,system-ui,sans-serif;cursor:pointer}
      #studioApp .music-card .music-file-actions button:hover,#studioApp .visitor-log-actions button:hover{background:rgba(255,255,255,.82)}
      #studioApp .music-card .music-status{min-height:13px;margin:6px 0 0;font:9px/1.35 Inter,ui-sans-serif,system-ui,sans-serif;color:var(--widget-muted,#77716b)}
      #studioApp .music-card .music-meta-editor{display:none;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px;padding-top:8px;border-top:1px solid rgba(70,58,52,.12)}
      #studioApp .music-card .music-meta-editor.is-open{display:grid}
      #studioApp .music-card .music-meta-editor label{display:grid;gap:3px;font:700 7px/1 Inter,ui-sans-serif,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase}
      #studioApp .music-card .music-meta-editor input{min-width:0;border:1px solid rgba(70,58,52,.16);border-radius:7px;background:rgba(255,255,255,.5);color:inherit;padding:6px 7px;font:10px/1.2 Inter,ui-sans-serif,system-ui,sans-serif}
      #studioApp .music-card .music-meta-editor button{grid-column:1/-1;justify-self:start}
      #studioApp .music-card .progress{cursor:pointer!important;height:5px!important;margin-top:9px!important;border-radius:999px!important;overflow:hidden!important}

      #studioApp .visitor-log-card{--mail-accent:rgb(var(--aura-rgb,216,95,109))}
      #studioApp .visitor-log-card .mailbox-mark{position:relative;width:44px;height:44px;flex:0 0 44px;border:0;opacity:.92}
      #studioApp .visitor-log-card .mailbox-mark::before,#studioApp .visitor-log-card .mailbox-mark::after{content:none!important;display:none!important}
      #studioApp .visitor-log-card .mailbox-mark .visitor-mail-icon{display:block;width:44px;height:44px}
      #studioApp .visitor-log-intro{display:flex;gap:11px;align-items:center;margin:2px 0 10px}
      #studioApp .visitor-log-intro strong{display:block;font:700 13px/1.1 Georgia,"Times New Roman",serif}
      #studioApp .visitor-log-intro span{display:block;margin-top:3px;font:9px/1.35 Inter,ui-sans-serif,system-ui,sans-serif;color:var(--widget-muted,#77716b)}
      #studioApp .visitor-log-actions{display:flex;gap:6px;flex-wrap:wrap}
      #studioApp .visitor-log-actions button:first-child{background:var(--mail-accent);color:var(--aura-button-ink,#fff);border-color:transparent}
      #studioApp .visitor-log-count{margin-top:7px;font:8px/1.3 Inter,ui-sans-serif,system-ui,sans-serif;color:var(--widget-muted,#77716b)}

      #visitorLogDialog{width:min(520px,calc(100vw - 28px));max-height:min(680px,calc(100vh - 28px));padding:0;border:1px solid rgba(73,59,52,.18);border-radius:20px;background:#f8f2ec;color:#201d1b;box-shadow:0 28px 90px rgba(28,17,13,.34);overflow:hidden}
      #visitorLogDialog::backdrop{background:rgba(24,17,15,.54);backdrop-filter:blur(8px)}
      #visitorLogDialog .visitor-dialog-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:20px 22px 13px;border-bottom:1px solid rgba(73,59,52,.12)}
      #visitorLogDialog .visitor-dialog-head h2{margin:0;font:700 24px/1 Georgia,"Times New Roman",serif}
      #visitorLogDialog .visitor-dialog-head p{margin:6px 0 0;font:10px/1.45 Inter,ui-sans-serif,system-ui,sans-serif;color:#766e68}
      #visitorLogDialog .visitor-dialog-close{width:31px;height:31px;padding:0;display:grid;place-items:center;font-size:18px}
      #visitorLogDialog .visitor-dialog-tabs{display:flex;gap:6px;padding:12px 22px 0}
      #visitorLogDialog .visitor-dialog-tabs button[aria-selected="true"]{background:rgb(var(--aura-rgb,216,95,109));border-color:transparent;color:var(--aura-button-ink,#fff)}
      #visitorLogDialog .visitor-dialog-pane{padding:15px 22px 22px}
      #visitorLogDialog .visitor-dialog-pane[hidden]{display:none}
      #visitorLogDialog label{display:grid;gap:5px;margin-bottom:10px;font:750 8px/1 Inter,ui-sans-serif,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase}
      #visitorLogDialog input,#visitorLogDialog textarea{box-sizing:border-box;width:100%;border:1px solid rgba(73,59,52,.18);border-radius:10px;background:rgba(255,255,255,.72);color:inherit;padding:10px 11px;font:12px/1.4 Inter,ui-sans-serif,system-ui,sans-serif;resize:vertical}
      #visitorLogDialog .visitor-dialog-primary{background:#1d1b1a;color:#fff;border-color:#1d1b1a;padding:9px 14px}
      #visitorLogDialog .visitor-form-note,#visitorLogDialog .visitor-form-status{margin:8px 0 0;font:9px/1.45 Inter,ui-sans-serif,system-ui,sans-serif;color:#766e68}
      #visitorLogDialog .visitor-own-profile-state{margin:0 0 13px;padding:11px 12px;border:1px solid rgba(var(--aura-rgb,216,95,109),.22);border-radius:11px;background:rgba(var(--aura-rgb,216,95,109),.07);font:10px/1.45 Inter,ui-sans-serif,system-ui,sans-serif;color:#615852}
      #visitorLogDialog .visitor-own-profile-state[hidden]{display:none}
      #visitorLogDialog .visitor-note-list{display:grid;gap:7px;margin-top:13px}
      #visitorLogDialog .visitor-note-item{padding:9px 10px;border:1px solid rgba(73,59,52,.11);border-radius:10px;background:rgba(255,255,255,.46);font:11px/1.4 Georgia,"Times New Roman",serif}
      #visitorLogDialog .visitor-note-item small{display:block;margin-top:4px;font:8px/1.3 Inter,ui-sans-serif,system-ui,sans-serif;color:#837a73}
      #visitorLogDialog .encryption-readiness{display:grid;grid-template-columns:30px 1fr;gap:8px;align-items:center;margin:0 0 12px;padding:9px 10px;border:1px solid rgba(var(--aura-rgb,216,95,109),.25);border-radius:11px;background:rgba(var(--aura-rgb,216,95,109),.07)}
      #visitorLogDialog .encryption-readiness svg{width:25px;height:25px;color:rgb(var(--aura-rgb,216,95,109))}
      #visitorLogDialog .encryption-readiness strong,#visitorLogDialog .encryption-readiness span{display:block}
      #visitorLogDialog .encryption-readiness strong{font:700 10px/1.2 Inter,ui-sans-serif,system-ui,sans-serif}
      #visitorLogDialog .encryption-readiness span{margin-top:2px;font:8px/1.35 Inter,ui-sans-serif,system-ui,sans-serif;color:#766e68}

      #studioApp .sidebar-theme-btn .biglwa-theme-icon{display:none!important}
      #studioApp .sidebar-theme-btn img{display:block!important;width:100%!important;height:100%!important;object-fit:contain!important;filter:brightness(0)!important;mix-blend-mode:normal!important}
      #studioApp #studioNotificationsBtn .visitor-mail-icon{width:20px;height:20px;display:block}
      #studioApp .hero-action-bar a[href="#home"]>.studio-teepee-icon{display:block;width:22px;height:22px;margin:0 auto 2px}
      #studioApp .studio-symbol-mark{display:grid;place-items:center;overflow:hidden;flex:0 0 auto}
      #studioApp .studio-symbol-source{display:block;width:100%;height:100%;overflow:visible;filter:none}\n      #studioApp .studio-symbol-image{display:block;width:100%;height:100%;object-fit:contain;filter:none}
      #studioApp[data-widget-ink-tone="light"] .studio-symbol-source,#studioApp[data-widget-ink-tone="light"] .studio-symbol-image{filter:invert(1)}
      #studioApp .sidebar .studio-symbol-source,#studioApp .sidebar .studio-symbol-image{filter:none}
      body.night-mode #studioApp .sidebar .studio-symbol-source,body.night-mode #studioApp .sidebar .studio-symbol-image{filter:invert(1)}
      #studioApp .hero-action-bar .studio-feed-symbol{width:29px;height:21px;margin:0 auto 2px}
      #studioApp .hero-action-bar .studio-diary-symbol{width:23px;height:23px;margin:0 auto 2px}
      #studioApp .sidebar .nav-item>.studio-quick-notes-symbol{width:22px!important;height:22px!important}
      #studioApp #feed .card-icon.studio-image-icon,#studioApp #diary .card-icon.studio-image-icon,#studioApp #learn .card-icon.studio-image-icon,#studioApp #notes .card-icon.studio-image-icon{display:inline-grid!important;place-items:center;width:30px;height:27px;font-size:0!important;overflow:visible}
      #studioApp #feed .studio-feed-symbol{width:32px;height:24px}
      #studioApp #diary .studio-diary-symbol{width:27px;height:27px}
      #studioApp #learn .studio-check-symbol{width:29px;height:27px}
      #studioApp #notes .studio-quick-notes-symbol{width:27px;height:27px}
      #studioApp #projects .card-icon.studio-hanger-mark{display:inline-grid!important;width:26px;height:26px;place-items:center;font-size:0!important}
      #studioApp #projects .card-icon.studio-projects-mark{display:inline-grid!important;width:26px;height:26px;place-items:center;font-size:0!important}
      #studioApp #projects .studio-projects-symbol{display:inline-grid;width:26px;height:26px;place-items:center}
      #studioApp #closet .studio-hanger-symbol{display:inline-grid;width:25px;height:25px;place-items:center}
      #studioApp #closet .card-icon .studio-hanger-icon{display:block;width:25px;height:25px}
      #studioApp #archive .card-icon.archive-horizontal-mark{font-family:Georgia,"Times New Roman",serif;font-size:24px;line-height:1}
      #studioApp #games .card-icon.games-chess-only-mark{display:inline-grid!important;width:26px;height:26px;place-items:center;font-size:0!important}
      #studioApp #games .games-chess-mark{font:22px/1 Georgia,"Times New Roman",serif}
      #studioApp #games .quiz>.games-block-mark{display:block;width:100%;height:auto;max-height:160px;margin:0 0 14px;border-radius:7px;object-fit:contain;object-position:center;box-shadow:0 2px 5px rgba(31,24,21,.14);mix-blend-mode:multiply}
      body.night-mode #studioApp #games .games-block-mark{mix-blend-mode:normal;filter:contrast(1.08)}

      body.night-mode #studioApp{color:var(--widget-ink,#f5eee7)!important}
      body.night-mode #studioApp .profile-card,body.night-mode #studioApp .music-card,body.night-mode #studioApp .aura-card,body.night-mode #studioApp .visitor-log-card,body.night-mode #studioApp .mobile-dock.hero-action-bar,body.night-mode #studioApp .masonry .card:not(.manifesto-card){background:var(--widget-bg,rgba(250,247,241,.84))!important;border-color:rgba(var(--aura-rgb,216,95,109),.18)!important;color:var(--widget-ink,#171717)!important;box-shadow:0 18px 45px rgba(0,0,0,.25)!important}
      body.night-mode #studioApp .profile-card .profile-identity-rail{background:color-mix(in srgb,var(--widget-ink,#171717) 4%,transparent)!important;border-color:rgba(var(--aura-rgb,216,95,109),.14)!important}
      body.night-mode #studioApp .profile-card .profile-name-line h1,body.night-mode #studioApp .profile-card .bio,body.night-mode #studioApp .profile-card .stats b,body.night-mode #studioApp .card-kicker{color:var(--widget-ink,#171717)!important}
      body.night-mode #studioApp .profile-card #wallpaperPanel{background:transparent!important;color:#f5eee7!important}
      body.night-mode #studioApp .profile-card #wallpaperPanel .panel-title{background-image:linear-gradient(to bottom,rgba(34,31,30,.99) 72%,rgba(34,31,30,0))!important}
      body.night-mode #studioApp .profile-editor-actions{background-image:linear-gradient(to top,rgba(34,31,30,.99) 76%,rgba(34,31,30,0))!important}
      body.night-mode #studioApp #wallpaperPanel input,body.night-mode #studioApp #wallpaperPanel textarea,body.night-mode #studioApp #wallpaperPanel select,body.night-mode #studioApp .music-meta-editor input{background:#292625!important;border-color:#514b47!important;color:#f5eee7!important;color-scheme:dark}
      body.night-mode #studioApp .profile-editor-tabs button,body.night-mode #studioApp .music-file-actions button,body.night-mode #studioApp .visitor-log-actions button,body.night-mode #studioApp .widget-drag-handle{background:rgba(255,255,255,.07)!important;border-color:rgba(255,255,255,.13)!important;color:#eee6df!important}
      body.night-mode #studioApp .visitor-log-actions button:first-child{background:rgb(var(--aura-rgb,216,95,109))!important;color:var(--aura-button-ink,#fff)!important}
      body.night-mode #visitorLogDialog{background:#252220;color:#f5eee7;border-color:rgba(255,255,255,.13);color-scheme:dark}
      body.night-mode #visitorLogDialog .visitor-dialog-head,body.night-mode #visitorLogDialog .visitor-note-item{border-color:rgba(255,255,255,.1)}
      body.night-mode #visitorLogDialog input,body.night-mode #visitorLogDialog textarea{background:#302c2a;border-color:#514a45;color:#f5eee7}
      body.night-mode #visitorLogDialog .visitor-dialog-head p,body.night-mode #visitorLogDialog .visitor-form-note,body.night-mode #visitorLogDialog .visitor-form-status,body.night-mode #visitorLogDialog .encryption-readiness span,body.night-mode #visitorLogDialog .visitor-note-item small{color:#bbb1a9}
      body.night-mode #visitorLogDialog .visitor-own-profile-state{color:#d8cec6}
      body.night-mode #visitorLogDialog .visitor-note-item{background:rgba(255,255,255,.04)}

      @media(max-width:1020px){#studioApp .hero{grid-template-columns:minmax(0,1fr) 284px!important;padding-left:16px!important;padding-right:16px!important}}
      @media(max-width:900px){#studioApp .hero{grid-template-columns:1fr!important;grid-template-rows:auto auto auto!important;padding:62px 12px 34px!important}#studioApp .hero>.profile-card{grid-column:1!important;grid-row:1!important}#studioApp .hero-widget-rail{grid-column:1!important;grid-row:2!important;grid-template-columns:repeat(3,minmax(0,1fr))!important}#studioApp .hero>.hero-action-bar{grid-column:1!important;grid-row:3!important}#studioApp .hero-widget-rail>.music-card,#studioApp .hero-widget-rail>.aura-card,#studioApp .hero-widget-rail>.visitor-log-card{min-height:132px!important}}
      @media(max-width:700px){#studioApp .hero-widget-rail{grid-template-columns:1fr!important}#studioApp .hero-widget-rail>.music-card,#studioApp .hero-widget-rail>.aura-card,#studioApp .hero-widget-rail>.visitor-log-card{min-height:112px!important}#studioApp .profile-card.profile-is-editing{min-height:650px!important}#studioApp.profile-editor-wallpaper .profile-card.profile-is-editing{min-height:720px!important}#studioApp .profile-card #wallpaperPanel{max-height:570px!important}}
      @media(prefers-reduced-motion:reduce){#studioApp .widget-dragging-active{transform:none!important}}
    `;
  }

  function openDatabase(){
    return new Promise((resolve,reject)=>{
      if(!('indexedDB'in window)){reject(new Error('Browser storage is unavailable.'));return}
      const request=indexedDB.open(MEDIA_DB,1);
      request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(MEDIA_STORE))request.result.createObjectStore(MEDIA_STORE,{keyPath:'id'})};
      request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error||new Error('Could not open media storage.'));
    });
  }

  async function dbGet(id){
    const db=await openDatabase();
    try{return await new Promise((resolve,reject)=>{const request=db.transaction(MEDIA_STORE,'readonly').objectStore(MEDIA_STORE).get(id);request.onsuccess=()=>resolve(request.result||null);request.onerror=()=>reject(request.error)})}
    finally{db.close()}
  }

  async function dbPut(record){
    const db=await openDatabase();
    try{await new Promise((resolve,reject)=>{const tx=db.transaction(MEDIA_STORE,'readwrite');tx.objectStore(MEDIA_STORE).put(record);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('The save was interrupted.'))})}
    finally{db.close()}
  }

  function viewingOwnProfile(){
    const app=$('#studioApp');
    if(!app)return true;
    const relationship=(app.dataset.profileRelationship||document.body.dataset.profileRelationship||'').toLowerCase();
    if(['visitor','other','guest'].includes(relationship))return false;
    if(['self','owner','own'].includes(relationship))return true;
    const ownerId=app.dataset.profileOwnerUid||app.dataset.profileOwnerId||document.body.dataset.profileOwnerUid||document.body.dataset.profileOwnerId||'';
    const viewerId=app.dataset.viewerUid||app.dataset.viewerId||document.body.dataset.viewerUid||document.body.dataset.viewerId||'';
    if(ownerId&&viewerId)return ownerId===viewerId;
    /* The current Studio route is the signed-in member's own profile. Default to self
       until a public profile explicitly supplies a relationship or both user ids. */
    return true;
  }

  function syncVisitorPermissions(card=$('#visitorLogWidget')){
    const own=viewingOwnProfile();
    if(card){
      card.dataset.profileRelationship=own?'self':'visitor';
      const publicAction=$('[data-open-visitor="public"]',card);
      if(publicAction){
        publicAction.textContent=own?'View public notes':'Leave public note';
        publicAction.setAttribute('aria-label',own?'View public notes on your profile':'Leave a public note on this profile');
      }
    }
    const dialog=$('#visitorLogDialog');
    if(!dialog)return own;
    const publicTab=$('[data-visitor-tab="public"]',dialog),form=$('#visitorPublicForm',dialog),ownState=$('#visitorOwnProfileState',dialog);
    if(publicTab)publicTab.textContent=own?'Public notes':'Public note';
    if(form)form.hidden=own;
    if(ownState)ownState.hidden=!own;
    dialog.dataset.profileRelationship=own?'self':'visitor';
    return own;
  }

  function ensureVisitorLog(){
    const app=$('#studioApp'),hero=$('.hero',app);if(!app||!hero)return null;
    let card=$('#visitorLogWidget',app);
    if(!card){
      card=document.createElement('section');
      card.id='visitorLogWidget';card.className='visitor-log-card glass small-card customizable-widget';
      card.dataset.widgetId='visitor-log';card.dataset.widgetLabel='Visitor Log';card.dataset.widgetRoute='visitor-log';
      card.innerHTML='<div class="card-kicker">Visitor Log</div><div class="visitor-log-intro"><span class="mailbox-mark" aria-hidden="true"></span><div><strong>Your mailbox</strong><span>Public notes and private conversations begin here.</span></div></div><div class="visitor-log-actions"><button type="button" data-open-visitor="public">Public note</button><button type="button" data-open-visitor="direct">Direct message</button></div><div class="visitor-log-count" aria-live="polite"></div>';
    }
    syncVisitorPermissions(card);
    updateVisitorCount(card);
    return card;
  }

  function ensureHeroRail(){
    const app=$('#studioApp'),hero=$('.hero',app);if(!app||!hero)return;
    let rail=$('#heroWidgetRail',hero);
    if(!rail){rail=document.createElement('aside');rail.id='heroWidgetRail';rail.className='hero-widget-rail';rail.setAttribute('aria-label','Studio profile widgets');const profile=$('.profile-card',hero);profile?.insertAdjacentElement('afterend',rail)}
    const visitor=ensureVisitorLog();
    const cards=[$('.aura-card',app),$('.music-card',app),visitor].filter(Boolean);
    cards.forEach(card=>{if(card.parentNode!==rail)rail.appendChild(card)});
    restoreOrder(rail);
  }

  function widgetLabel(widget){return widget.dataset.widgetLabel||$('.card-kicker,h2,h1',widget)?.textContent?.trim()||'widget'}

  function greenControl(widget){
    const id=widget.dataset.widgetId||widget.id||'widget',route=widget.dataset.widgetRoute||$('.arrow-btn[data-open]',widget)?.dataset.open||id;
    if(route==='visitor-log'||id==='visitor-log')return {attribute:'data-open-visitor="public"',label:'Open Visitor Log mailbox'};
    if(FULL_WIDGET_ROUTES.has(route))return {attribute:`data-open="${route}"`,label:`Open full ${route.replace(/[-_]/g,' ')} interface`};
    return {attribute:`data-open-widget-settings="${id}"`,label:'Open full widget customization interface'};
  }

  function ensureControls(){
    $$('#studioApp .hero-widget-rail>.customizable-widget,#studioApp .masonry>.card:not(.manifesto-card)').forEach((widget,index)=>{
      if(!widget.dataset.widgetId)widget.dataset.widgetId=widget.id||`studio-widget-${index+1}`;
      if(!widget.dataset.widgetLabel)widget.dataset.widgetLabel=widgetLabel(widget);
      let controls=$(':scope>.widget-window-controls',widget);
      if(!controls){controls=document.createElement('div');controls.className='widget-window-controls';widget.prepend(controls)}
      if(!$('.window-light.green',controls)){const green=greenControl(widget);controls.insertAdjacentHTML('afterbegin',`<button class="window-light green" type="button" ${green.attribute} aria-label="${green.label}" title="${green.label}"></button><button class="window-light yellow" type="button" data-minimize-widget="${widget.dataset.widgetId}" aria-label="Minimize ${widget.dataset.widgetLabel}"></button><button class="window-light red" type="button" data-dock-widget="${widget.dataset.widgetId}" aria-label="Move ${widget.dataset.widgetLabel} to toolbar"></button>`)}
      let handle=$('[data-studio-drag-handle]',widget);
      if(!handle){
        handle=document.createElement('button');handle.type='button';handle.className='widget-drag-handle';handle.dataset.studioDragHandle='1';handle.setAttribute('aria-label',`Move ${widget.dataset.widgetLabel}`);handle.title='Drag to reorder';handle.innerHTML='<svg viewBox="0 0 12 12" aria-hidden="true"><circle cx="3" cy="3" r="1" fill="currentColor"/><circle cx="9" cy="3" r="1" fill="currentColor"/><circle cx="3" cy="9" r="1" fill="currentColor"/><circle cx="9" cy="9" r="1" fill="currentColor"/></svg>';
      }
      if(handle.parentElement!==widget)widget.prepend(handle);
    });
  }

  function readOrders(){try{return JSON.parse(localStorage.getItem(ORDER_KEY)||'{}')}catch{return{}}}
  function saveOrder(parent){
    if(!parent?.id)return;
    const order=readOrders();order[parent.id]=[...parent.children].filter(child=>child.dataset?.widgetId).map(child=>child.dataset.widgetId);
    try{localStorage.setItem(ORDER_KEY,JSON.stringify(order))}catch{}
  }
  function restoreOrder(parent){
    if(!parent?.id)return;
    const ids=readOrders()[parent.id];if(!Array.isArray(ids))return;
    ids.forEach(id=>{const child=[...parent.children].find(item=>item.dataset?.widgetId===id);if(child)parent.appendChild(child)});
  }

  function bindDragging(){
    const app=$('#studioApp');if(!app||app.dataset.studioDirectDrag==='1')return;app.dataset.studioDirectDrag='1';
    let state=null;
    const clear=()=>{if(!state)return;state.widget.classList.remove('widget-dragging-active');$$('.widget-drop-target',state.parent).forEach(item=>item.classList.remove('widget-drop-target'));try{state.handle.releasePointerCapture(state.pointerId)}catch{}state=null};
    app.addEventListener('pointerdown',event=>{
      const handle=event.target.closest('[data-studio-drag-handle]');if(!handle)return;
      const widget=handle.closest('[data-widget-id]'),parent=widget?.parentElement;if(!widget||!parent||(!parent.matches('#heroWidgetRail,.masonry')))return;
      event.preventDefault();state={handle,widget,parent,pointerId:event.pointerId};widget.classList.add('widget-dragging-active');try{handle.setPointerCapture(event.pointerId)}catch{}
    });
    app.addEventListener('pointermove',event=>{
      if(!state||event.pointerId!==state.pointerId)return;
      const hit=document.elementFromPoint(event.clientX,event.clientY),target=hit?.closest('[data-widget-id]');
      $$('.widget-drop-target',state.parent).forEach(item=>item.classList.remove('widget-drop-target'));
      if(!target||target===state.widget||target.parentElement!==state.parent)return;
      target.classList.add('widget-drop-target');
      const rect=target.getBoundingClientRect(),horizontal=getComputedStyle(state.parent).gridTemplateColumns.split(' ').length>1;
      const before=horizontal?event.clientX<rect.left+rect.width/2:event.clientY<rect.top+rect.height/2;
      state.parent.insertBefore(state.widget,before?target:target.nextSibling);
    });
    app.addEventListener('pointerup',event=>{if(!state||event.pointerId!==state.pointerId)return;saveOrder(state.parent);clear()});
    app.addEventListener('pointercancel',clear);
    app.addEventListener('keydown',event=>{
      const handle=event.target.closest('[data-studio-drag-handle]');if(!handle||!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key))return;
      const widget=handle.closest('[data-widget-id]'),parent=widget?.parentElement;if(!widget||!parent)return;
      const previous=['ArrowUp','ArrowLeft'].includes(event.key),sibling=previous?widget.previousElementSibling:widget.nextElementSibling;if(!sibling?.dataset?.widgetId)return;
      event.preventDefault();parent.insertBefore(widget,previous?sibling:sibling.nextSibling);saveOrder(parent);handle.focus();
    });
  }

  function revokeMusicUrls(){if(musicUrl){URL.revokeObjectURL(musicUrl);musicUrl=''}if(coverUrl){URL.revokeObjectURL(coverUrl);coverUrl=''}}
  function setMusicStatus(message){const status=$('#studioMusicStatus');if(status)status.textContent=message}
  function formatTime(value){if(!Number.isFinite(value)||value<0)return '0:00';const minutes=Math.floor(value/60),seconds=Math.floor(value%60);return `${minutes}:${String(seconds).padStart(2,'0')}`}

  function applyMusicRecord(record){
    const audio=$('#studioAudio'),art=$('#studioAlbumArt'),image=$('img',art),title=$('#studioMusicTitle'),artist=$('#studioMusicArtist');if(!audio||!record)return;
    revokeMusicUrls();
    if(record.audioBlob){musicUrl=URL.createObjectURL(record.audioBlob);audio.src=musicUrl}
    if(record.coverBlob&&image){coverUrl=URL.createObjectURL(record.coverBlob);image.src=coverUrl;image.hidden=false;art.classList.add('has-cover')}
    else if(image){image.hidden=true;image.removeAttribute('src');art.classList.remove('has-cover')}
    if(title)title.textContent=record.title||record.fileName?.replace(/\.[^.]+$/,'')||'Your track';
    if(artist)artist.textContent=record.artist||'Add artist';
    setMusicStatus(record.audioBlob?'Ready · saved on this device':'Choose an audio file to play.');
  }

  async function restoreMusic(){
    if(musicRestored)return;musicRestored=true;
    try{const record=await dbGet('music');if(record)applyMusicRecord(record);else setMusicStatus('Choose a track or replace the cover.')}
    catch{setMusicStatus('Music storage is unavailable in this browser.')}
  }

  async function updateMusic(patch){
    const current=await dbGet('music')||{id:'music'};const next={...current,...patch,id:'music',updatedAt:Date.now()};await dbPut(next);applyMusicRecord(next);return next;
  }

  function upgradeMusic(){
    const card=$('#studioApp .music-card');if(!card||card.dataset.realPlayer==='1')return;card.dataset.realPlayer='1';
    const row=$('.music-row',card),art=$('.album-art',card),copy=row?.children?.[1],play=$('#playBtn',card),progress=$('.progress',card),progressBar=$('#musicProgress',card);if(!row||!art||!copy||!play||!progress||!progressBar)return;
    art.id='studioAlbumArt';art.innerHTML='<span aria-hidden="true">♪</span><img alt="Album cover" hidden>';
    copy.classList.add('music-copy');const title=$('strong',copy),artist=$('span',copy);if(title)title.id='studioMusicTitle';if(artist)artist.id='studioMusicArtist';
    const audio=document.createElement('audio');audio.id='studioAudio';audio.preload='metadata';card.appendChild(audio);
    const actions=document.createElement('div');actions.className='music-file-actions';actions.innerHTML='<button type="button" id="chooseStudioTrack">Track file</button><button type="button" id="chooseStudioCover">Cover</button><button type="button" id="editStudioMusicMeta">Details</button><input id="studioTrackInput" type="file" accept="audio/mpeg,audio/mp4,audio/aac,audio/ogg,audio/wav,audio/webm,.mp3,.m4a,.aac,.ogg,.wav,.webm" hidden><input id="studioCoverInput" type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden>';
    const editor=document.createElement('div');editor.className='music-meta-editor';editor.id='studioMusicMetaEditor';editor.innerHTML='<label>Title<input id="studioTrackTitle" maxlength="100"></label><label>Artist<input id="studioTrackArtist" maxlength="100"></label><button type="button" id="saveStudioMusicMeta">Save details</button>';
    const status=document.createElement('p');status.className='music-status';status.id='studioMusicStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
    progress.insertAdjacentElement('afterend',actions);actions.insertAdjacentElement('afterend',editor);editor.insertAdjacentElement('afterend',status);
    progress.setAttribute('role','slider');progress.tabIndex=0;progress.setAttribute('aria-label','Track position');progress.setAttribute('aria-valuemin','0');progress.setAttribute('aria-valuemax','100');progress.setAttribute('aria-valuenow','0');
    const sync=()=>{const fraction=audio.duration?audio.currentTime/audio.duration:0;progressBar.style.width=`${fraction*100}%`;progress.setAttribute('aria-valuenow',String(Math.round(fraction*100)));progress.title=`${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`};
    play.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();if(!audio.src){$('#studioTrackInput').click();setMusicStatus('Choose an audio file first.');return}if(audio.paused)audio.play().catch(()=>setMusicStatus('Playback needs another tap.'));else audio.pause()},{capture:true});
    audio.addEventListener('play',()=>{play.textContent='❚❚';play.setAttribute('aria-label','Pause track')});audio.addEventListener('pause',()=>{play.textContent='▶';play.setAttribute('aria-label','Play track')});audio.addEventListener('ended',()=>{play.textContent='▶';sync()});audio.addEventListener('timeupdate',sync);audio.addEventListener('loadedmetadata',sync);
    const seek=clientX=>{if(!audio.duration)return;const rect=progress.getBoundingClientRect();audio.currentTime=Math.max(0,Math.min(1,(clientX-rect.left)/rect.width))*audio.duration};
    progress.addEventListener('click',event=>seek(event.clientX));progress.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight'].includes(event.key)||!audio.duration)return;event.preventDefault();audio.currentTime=Math.max(0,Math.min(audio.duration,audio.currentTime+(event.key==='ArrowRight'?5:-5)))});
    $('#chooseStudioTrack',card).addEventListener('click',()=>$('#studioTrackInput',card).click());$('#chooseStudioCover',card).addEventListener('click',()=>$('#studioCoverInput',card).click());
    $('#editStudioMusicMeta',card).addEventListener('click',()=>{editor.classList.toggle('is-open');$('#studioTrackTitle',editor).value=$('#studioMusicTitle',card).textContent;$('#studioTrackArtist',editor).value=$('#studioMusicArtist',card).textContent});
    $('#saveStudioMusicMeta',editor).addEventListener('click',async()=>{try{await updateMusic({title:$('#studioTrackTitle',editor).value.trim()||'Your track',artist:$('#studioTrackArtist',editor).value.trim()||'Add artist'});editor.classList.remove('is-open')}catch{setMusicStatus('The track details could not be saved.')}});
    $('#studioTrackInput',card).addEventListener('change',async event=>{const file=event.target.files?.[0];event.target.value='';if(!file)return;if(!file.type.startsWith('audio/')||file.size>75*1024*1024){setMusicStatus('Choose an audio file under 75 MB.');return}setMusicStatus('Saving track…');try{await updateMusic({audioBlob:file,fileName:String(file.name).slice(0,180),title:file.name.replace(/\.[^.]+$/,'').slice(0,100)})}catch{setMusicStatus('This browser could not save the track.')}});
    $('#studioCoverInput',card).addEventListener('change',async event=>{const file=event.target.files?.[0];event.target.value='';if(!file)return;if(!/^image\/(jpeg|png|webp|gif)$/.test(file.type)||file.size>15*1024*1024){setMusicStatus('Choose a JPG, PNG, WebP, or GIF cover under 15 MB.');return}setMusicStatus('Reviewing cover on this device…');try{const result=await window.BIGLWAWallpaperSafety?.scan(file,{context:'mixed'});if(result&&['invalid','block','age-restricted'].includes(result.status)){setMusicStatus(result.status==='block'?'That cover cannot be used.':'That cover needs review before it can display.');return}await updateMusic({coverBlob:file,coverReview:result?.status==='local-only'?'pending':'complete'});if(result?.status==='local-only')setMusicStatus('Cover preview active locally · review pending.')}catch{setMusicStatus('The cover could not be saved.')}});
    restoreMusic();
  }

  function readNotes(){try{const notes=JSON.parse(localStorage.getItem(NOTE_KEY)||'[]');return Array.isArray(notes)?notes:[]}catch{return[]}}
  function updateVisitorCount(card=$('#visitorLogWidget')){if(!card)return;const count=readNotes().length,status=$('.visitor-log-count',card);if(status)status.textContent=count?`${count} local note${count===1?'':'s'} in this browser`:(viewingOwnProfile()?'Mailbox ready · only visitors can leave public notes':'Be the first visitor to leave a public note')}

  function renderNotes(){
    const list=$('#visitorNoteList');if(!list)return;list.innerHTML='';
    readNotes().slice(-3).reverse().forEach(note=>{const item=document.createElement('div');item.className='visitor-note-item';const text=document.createElement('div');text.textContent=note.message;const meta=document.createElement('small');meta.textContent=`${note.name||'Anonymous'} · ${new Date(note.createdAt).toLocaleString()}`;item.append(text,meta);list.appendChild(item)});
  }

  async function getDraftKey(){
    let record=await dbGet('private-draft-key');if(record?.key)return record.key;
    const key=await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']);await dbPut({id:'private-draft-key',key,createdAt:Date.now()});return key;
  }

  async function saveEncryptedDraft(to,message){
    const key=await getDraftKey(),iv=crypto.getRandomValues(new Uint8Array(12)),payload=new TextEncoder().encode(JSON.stringify({to,message,createdAt:Date.now()}));
    const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,payload);await dbPut({id:'private-draft',iv,ciphertext,updatedAt:Date.now()});
  }

  function ensureVisitorDialog(){
    let dialog=$('#visitorLogDialog');if(dialog)return dialog;
    dialog=document.createElement('dialog');dialog.id='visitorLogDialog';dialog.innerHTML='<div class="visitor-dialog-head"><div><h2>Visitor Log</h2><p>A mailbox for notes now—and verified private conversations next.</p></div><button class="visitor-dialog-close" type="button" aria-label="Close">×</button></div><div class="visitor-dialog-tabs" role="tablist"><button type="button" role="tab" data-visitor-tab="public" aria-controls="visitorPublicPane">Public notes</button><button type="button" role="tab" data-visitor-tab="direct" aria-controls="visitorDirectPane">Direct message</button></div><section class="visitor-dialog-pane" id="visitorPublicPane" data-visitor-pane="public"><p class="visitor-own-profile-state" id="visitorOwnProfileState" hidden>This is your profile. You can read public notes here, but only visitors can leave one.</p><form id="visitorPublicForm"><label>Name (optional)<input id="visitorNoteName" maxlength="60" autocomplete="name"></label><label>Note<textarea id="visitorNoteText" rows="4" maxlength="500" required></textarea></label><button class="visitor-dialog-primary" type="submit">Save note preview</button><p class="visitor-form-note">This preview stays in this browser until public profiles and moderation are connected.</p><p class="visitor-form-status" id="visitorPublicStatus" role="status" aria-live="polite"></p></form><div class="visitor-note-list" id="visitorNoteList"></div></section><section class="visitor-dialog-pane" id="visitorDirectPane" data-visitor-pane="direct" hidden><div class="encryption-readiness"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="3" stroke="currentColor" stroke-width="1.7"/><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="15" r="1.2" fill="currentColor"/></svg><div><strong>Encrypted draft storage is active</strong><span>Actual user-to-user E2EE stays off until recipient-key verification and ciphertext-only backend rules are connected.</span></div></div><form id="visitorDirectForm"><label>To<input id="visitorDirectTo" maxlength="60" placeholder="@username" required></label><label>Message<textarea id="visitorDirectText" rows="5" maxlength="2000" required></textarea></label><button class="visitor-dialog-primary" type="submit">Save encrypted draft</button><p class="visitor-form-status" id="visitorDirectStatus" role="status" aria-live="polite"></p></form></section>';
    document.body.appendChild(dialog);
    const showTab=key=>{$$('[data-visitor-tab]',dialog).forEach(tab=>tab.setAttribute('aria-selected',tab.dataset.visitorTab===key?'true':'false'));$$('[data-visitor-pane]',dialog).forEach(pane=>pane.hidden=pane.dataset.visitorPane!==key)};
    dialog.addEventListener('click',event=>{const tab=event.target.closest('[data-visitor-tab]');if(tab)showTab(tab.dataset.visitorTab);if(event.target===dialog||event.target.closest('.visitor-dialog-close'))dialog.close()});
    $('#visitorPublicForm',dialog).addEventListener('submit',event=>{event.preventDefault();if(viewingOwnProfile()){syncVisitorPermissions();$('#visitorPublicStatus',dialog).textContent='You cannot leave a public note on your own profile.';return}const message=$('#visitorNoteText',dialog).value.trim();if(!message)return;const notes=readNotes();notes.push({name:$('#visitorNoteName',dialog).value.trim(),message,createdAt:Date.now(),visibility:'device-preview'});try{localStorage.setItem(NOTE_KEY,JSON.stringify(notes.slice(-30)))}catch{}$('#visitorNoteText',dialog).value='';$('#visitorPublicStatus',dialog).textContent='Note preview saved on this device.';renderNotes();updateVisitorCount()});
    $('#visitorDirectForm',dialog).addEventListener('submit',async event=>{event.preventDefault();const to=$('#visitorDirectTo',dialog).value.trim(),message=$('#visitorDirectText',dialog).value.trim(),status=$('#visitorDirectStatus',dialog);if(!to||!message)return;status.textContent='Encrypting draft on this device…';try{await saveEncryptedDraft(to,message);$('#visitorDirectText',dialog).value='';status.textContent='Encrypted draft saved on this device. It has not been sent.'}catch{status.textContent='Encrypted draft storage is unavailable in this browser.'}});
    dialog._showVisitorTab=showTab;syncVisitorPermissions();showTab('public');renderNotes();return dialog;
  }

  function openVisitorDialog(tab='public'){
    const dialog=ensureVisitorDialog();syncVisitorPermissions();dialog._showVisitorTab?.(tab);renderNotes();if(dialog.showModal&&!dialog.open)dialog.showModal();else dialog.setAttribute('open','');
  }

  function bindVisitorActions(){
    const app=$('#studioApp');if(!app||app.dataset.visitorActions==='1')return;app.dataset.visitorActions='1';
    app.addEventListener('click',event=>{const button=event.target.closest('[data-open-visitor]');if(!button)return;event.preventDefault();openVisitorDialog(button.dataset.openVisitor||'public')});
  }

  function ensureDirectoryIcons(){
    const app=$('#studioApp');if(!app)return;
    if(!$('#studioSymbolFilterDefs')){
      const defs=document.createElementNS('http://www.w3.org/2000/svg','svg');
      defs.id='studioSymbolFilterDefs';defs.setAttribute('aria-hidden','true');defs.setAttribute('width','0');defs.setAttribute('height','0');
      defs.style.cssText='position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
      defs.innerHTML='<defs><filter id="studioSymbolKnockout" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -.333333 -.333333 -.333333 1 0"/><feComponentTransfer><feFuncA type="linear" slope="10" intercept="-.5"/></feComponentTransfer></filter></defs>';
      document.body.appendChild(defs);
    }
    const replaceDirectorySymbol=(href,iconClass,markup)=>{
      const link=$(`.hero-action-bar a[href="${href}"]`,app);if(!link)return;
      const current=$('.'+iconClass,link);
      const nextSrc=(markup.match(/<img[^>]+src="([^"]+)/)||[])[1]||'';
      const currentImage=current?.querySelector('.studio-symbol-image');
      if(current&&currentImage?.getAttribute('src')===nextSrc)return;
      if(current){current.outerHTML=markup;return}
      [...link.childNodes].filter(node=>node.nodeType===Node.TEXT_NODE).forEach(node=>node.remove());
      link.insertAdjacentHTML('afterbegin',markup);
    };
    const replaceCardSymbol=(selector,iconClass,markup)=>{
      const icon=$(selector,app);if(!icon)return;
      const nextSrc=(markup.match(/<img[^>]+src="([^"]+)/)||[])[1]||'';
      const currentImage=icon.querySelector('.studio-symbol-image');
      if(icon.classList.contains(iconClass)&&currentImage?.getAttribute('src')===nextSrc)return;
      icon.classList.add('studio-image-icon',iconClass);icon.innerHTML=markup;
    };
    const studioLink=$('.hero-action-bar a[href="#home"]',app);
    if(studioLink&&!$('.studio-teepee-icon',studioLink)){
      [...studioLink.childNodes].filter(node=>node.nodeType===Node.TEXT_NODE).forEach(node=>node.remove());
      studioLink.insertAdjacentHTML('afterbegin',STUDIO_ICONS.teepee);
    }
    replaceDirectorySymbol('#feed','studio-feed-symbol',STUDIO_ICONS.feed);
    replaceDirectorySymbol('#diary','studio-diary-symbol',STUDIO_ICONS.diary);
    replaceCardSymbol('#feed .card-icon','studio-feed-card-icon',STUDIO_ICONS.feed);
    replaceCardSymbol('#diary .card-icon','studio-diary-card-icon',STUDIO_ICONS.diary);
    replaceCardSymbol('#learn .card-icon','studio-learn-card-icon',STUDIO_ICONS.check);
    const notesLink=$('.sidebar .nav-item[href="#notes"]',app),notesNavIcon=notesLink?.querySelector(':scope > span');
    if(notesNavIcon&&!notesNavIcon.classList.contains('studio-quick-notes-symbol'))notesNavIcon.outerHTML=STUDIO_ICONS.quickNotes;
    replaceCardSymbol('#notes .card-icon','studio-notes-card-icon',STUDIO_ICONS.quickNotes);
    const projects=$('#projects .card-icon',app);
    if(projects&&!projects.classList.contains('studio-projects-mark')){projects.classList.add('studio-projects-mark');projects.innerHTML=STUDIO_ICONS.projects}
    const archive=$('#archive .card-icon',app);
    if(archive){archive.classList.add('archive-horizontal-mark');archive.textContent='▤'}
    const games=$('#games .card-icon',app);
    if(games&&!games.classList.contains('games-chess-only-mark')){games.classList.add('games-chess-only-mark');games.innerHTML='<span class="games-chess-mark" aria-hidden="true">♟</span>'}
    const quiz=$('#games .quiz',app);
    if(quiz&&!$('.games-block-mark',quiz)){quiz.insertAdjacentHTML('afterbegin','<img class="games-block-mark" src="/assets/culture-quiz-cubes.png?v=20260915-culture-quiz-cubes-1" alt="" aria-hidden="true" width="1672" height="941">')}
    replaceCardSymbol('#closet .card-icon','studio-closet-hanger-icon',STUDIO_ICONS.hanger);
    const mailbox=$('#visitorLogWidget .mailbox-mark',app);
    if(mailbox&&!$('.visitor-mail-icon',mailbox))mailbox.innerHTML=STUDIO_ICONS.mail;
  }

  function bindWidgetSettingsActions(){
    const app=$('#studioApp');if(!app||app.dataset.widgetSettingsPath==='1')return;app.dataset.widgetSettingsPath='1';
    app.addEventListener('click',event=>{
      const control=event.target.closest('[data-open-widget-settings]');if(!control)return;
      event.preventDefault();event.stopPropagation();
      const card=$('.profile-card',app),edit=$('#editProfileBtn',card);
      if(card&&!card.classList.contains('profile-is-editing'))edit?.click();
      requestAnimationFrame(()=>{$('[data-profile-editor-tab="widgets"]',card)?.click()});
    });
  }

  function ensureThemeAndMailboxIcons(){
    const light=$('#lightModeBtn'),dark=$('#darkModeBtn');
    const ensureThemeImage=(button,src,label)=>{if(!button)return;let image=$('img',button);if(!image){image=document.createElement('img');button.replaceChildren(image)}image.src=src;image.alt='';image.setAttribute('aria-hidden','true');button.title=label;button.setAttribute('aria-label',label);$('.biglwa-theme-icon',button)?.remove()};
    ensureThemeImage(light,'/assets/login-sun-mask.png?v=20260913-theme-symbols-4','Light mode');
    ensureThemeImage(dark,'/assets/login-moon-mask.png?v=20260913-theme-symbols-4','Dark mode');
    const app=$('#studioApp'),candidate=$('.top-actions .icon-btn[aria-label="Notifications"]',app)||$('.top-actions .icon-btn',app);if(!candidate)return;
    candidate.id='studioNotificationsBtn';candidate.type='button';candidate.setAttribute('aria-label','Open Visitor Log');candidate.title='Visitor Log';
    candidate.innerHTML=STUDIO_ICONS.mail+'<span class="notif-dot"></span>';
    if(candidate.dataset.visitorBound!=='1'){candidate.dataset.visitorBound='1';candidate.addEventListener('click',()=>openVisitorDialog('public'))}
  }

  function run(){ensureStyles();ensureHeroRail();ensureControls();bindDragging();upgradeMusic();bindVisitorActions();ensureDirectoryIcons();bindWidgetSettingsActions();ensureThemeAndMailboxIcons()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
  window.addEventListener('load',()=>setTimeout(run,0),{once:true});
  window.addEventListener('pagehide',revokeMusicUrls,{once:true});
  setTimeout(run,260);setTimeout(run,900);
})();
