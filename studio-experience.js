(()=>{
  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const ORDER_KEY='biglwaWidgetOrderV2';
  const GUEST_KEY='biglwaGuestChecksLocalV1';
  const LEGACY_NOTE_KEY='biglwaVisitorNotesLocal';
  const ACTIVITY_KEY='biglwaStudioActivityV1';
  const ACTIVITY_READ_KEY='biglwaStudioActivityReadAt';
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
    mail:'<svg class="visitor-mail-icon" viewBox="0 0 32 32" fill="none" aria-hidden="true"><circle cx="16" cy="16" r="14" stroke="currentColor" stroke-width="1.8"/><rect x="7.5" y="10.5" width="17" height="12" rx="1.5" stroke="currentColor" stroke-width="1.8"/><path d="m8.5 11.5 7.5 6 7.5-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    logout:'<img class="studio-logout-icon" src="/assets/logout.png?v=20260916-logout-1" alt="" width="64" height="64" aria-hidden="true">'
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
      #studioApp .hero-widget-rail>.music-card,#studioApp .hero-widget-rail>.aura-card,#studioApp .hero-widget-rail>.guest-check-card{position:relative!important;inset:auto!important;width:100%!important;min-width:0!important;max-width:none!important;height:auto!important;min-height:118px!important;max-height:none!important;margin:0!important;padding:16px 18px!important;box-sizing:border-box!important;overflow:visible!important}
      #studioApp .hero-widget-rail>.guest-check-card{min-height:150px!important}
      #studioApp .hero>.hero-action-bar{grid-column:1/-1!important;grid-row:2!important;margin:4px 0 0!important}
      #studioApp .profile-card.profile-is-editing{min-height:430px!important}
      #studioApp.profile-editor-wallpaper .profile-card.profile-is-editing{min-height:520px!important}
      #studioApp .profile-card #wallpaperPanel{max-height:480px!important;scrollbar-gutter:stable!important}
      #studioApp .profile-card #wallpaperPanel .panel-title,#studioApp .profile-editor-actions{background-color:transparent!important}
      #studioApp .profile-card #wallpaperPanel .panel-title{background-image:linear-gradient(to bottom,var(--widget-bg,rgba(250,247,241,.84)) 72%,transparent)!important;color:var(--widget-ink,#171717)!important}
      #studioApp .profile-editor-actions{background-image:linear-gradient(to top,var(--widget-bg,rgba(250,247,241,.84)) 76%,transparent)!important;color:var(--widget-ink,#171717)!important}
      #studioApp .profile-card .profile-identity-rail{box-sizing:border-box!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:flex-start!important;gap:10px!important;padding:20px 16px!important}
      #studioApp .profile-card .profile-identity-rail>.profile-avatar{flex:0 0 auto!important;margin:0 auto!important;position:relative!important;left:10px!important}
      #studioApp .profile-card .profile-identity-rail>#editProfileBtn{flex:0 0 auto!important;width:120px!important;max-width:120px!important;margin:0 auto!important}
      #studioApp .profile-card .profile-identity-rail>.profile-rail-location{flex:0 0 auto!important;width:120px!important;margin:0 auto!important;text-align:center!important;line-height:1.25!important}
      #studioApp .profile-card .profile-identity-rail>.weekly-mood-card{order:4!important;box-sizing:border-box;width:120px;min-height:58px;margin:2px auto 0;padding:9px 10px;border:1px solid rgba(var(--aura-rgb,216,95,109),.24);border-radius:12px;background:rgba(255,255,255,.42);color:var(--widget-ink,#171717);text-align:left;overflow:hidden}
      #studioApp:not(.profile-editor-wallpaper) .profile-card:not(.profile-is-editing) .profile-identity-rail{align-items:center!important;justify-content:flex-start!important;gap:10px!important;padding:18px 16px!important}
      #studioApp .weekly-mood-card>span,#studioApp .weekly-mood-card>strong{display:block}
      #studioApp .weekly-mood-card>span{margin-bottom:5px;font:750 7px/1 Inter,ui-sans-serif,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--widget-muted,#77716b)}
      #studioApp .weekly-mood-card>strong{font:600 11px/1.2 Georgia,"Times New Roman",serif;overflow-wrap:anywhere}
      #studioApp .weekly-mood-card[data-mood-style="diary"]{border-left:9px solid rgb(var(--aura-rgb,216,95,109));background:repeating-linear-gradient(to bottom,rgba(255,252,239,.88) 0,rgba(255,252,239,.88) 15px,rgba(122,160,184,.22) 16px)}
      #studioApp .weekly-mood-card[data-mood-style="widget"]{border-radius:var(--widget-radius,16px);background:var(--widget-bg,rgba(250,247,241,.84));box-shadow:0 7px 18px rgba(var(--aura-rgb,216,95,109),.13)}
      #studioApp .weekly-mood-card[data-mood-style="qwiky-note"]{transform:rotate(-1deg);border-color:#dec665;background:#fff4a9;box-shadow:2px 3px 0 rgba(72,56,36,.12);color:#372f28}
      #studioApp .profile-song-editor-mount{display:grid;gap:8px;margin:9px 0 12px;padding:11px;border:1px solid rgba(var(--aura-rgb,216,95,109),.22);border-radius:12px;background:rgba(var(--aura-rgb,216,95,109),.06)}
      #studioApp .profile-song-editor-wait{font:9px/1.4 Inter,ui-sans-serif,system-ui,sans-serif;color:var(--widget-muted,#77716b)}
      #studioApp .profile-song-editor-mount:has(.music-file-actions) .profile-song-editor-wait{display:none}
      #studioApp .profile-song-editor-mount .music-file-actions{display:flex!important;flex-wrap:wrap!important;gap:6px!important;margin:0!important}
      #studioApp .profile-song-editor-mount .music-meta-editor{display:grid!important;grid-template-columns:1fr 1fr;gap:7px;margin:0;padding:9px 0 0;border-top:1px solid rgba(70,58,52,.12)}
      #studioApp .profile-song-editor-mount button{border:1px solid rgba(70,58,52,.18);border-radius:999px;background:rgba(255,255,255,.56);color:inherit;padding:7px 10px;font:700 9px/1 Inter,ui-sans-serif,system-ui,sans-serif;cursor:pointer}
      #studioApp .profile-song-editor-mount .music-meta-editor label{display:grid;gap:4px;font:750 8px/1 Inter,ui-sans-serif,system-ui,sans-serif;letter-spacing:.07em;text-transform:uppercase}
      #studioApp .profile-song-editor-mount .music-meta-editor input{box-sizing:border-box;min-width:0;width:100%;padding:8px 9px;border:1px solid rgba(70,58,52,.18);border-radius:8px;background:rgba(255,255,255,.62);color:inherit;font:11px/1.25 Inter,ui-sans-serif,system-ui,sans-serif;text-transform:none;letter-spacing:0}
      #studioApp .profile-song-editor-mount .music-meta-editor button{grid-column:1/-1;justify-self:start}
      #studioApp .profile-song-editor-mount .music-status{margin:0!important}
      #studioApp .profile-aura-text-label{display:grid!important;gap:5px!important;font:700 9px/1.2 Inter,ui-sans-serif,system-ui,sans-serif!important;letter-spacing:.06em;text-transform:uppercase}
      #studioApp .profile-aura-text-label textarea{box-sizing:border-box;width:100%;padding:9px;border:1px solid rgba(80,70,64,.22);border-radius:9px;background:rgba(255,255,255,.65);color:inherit;font:12px/1.4 Georgia,"Times New Roman",serif;text-transform:none;letter-spacing:0;resize:vertical}

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
      #studioApp .music-card .music-file-actions button,#studioApp .visitor-log-actions button,#guestCheckDialog button,#studioLogsDialog button{border:1px solid rgba(70,58,52,.16);border-radius:999px;background:rgba(255,255,255,.52);color:inherit;padding:6px 9px;font:650 9px/1 Inter,ui-sans-serif,system-ui,sans-serif;cursor:pointer}
      #studioApp .music-card .music-file-actions button:hover,#studioApp .visitor-log-actions button:hover{background:rgba(255,255,255,.82)}
      #studioApp .music-card .music-status{min-height:13px;margin:6px 0 0;font:9px/1.35 Inter,ui-sans-serif,system-ui,sans-serif;color:var(--widget-muted,#77716b)}
      #studioApp .music-card .music-meta-editor{display:none;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px;padding-top:8px;border-top:1px solid rgba(70,58,52,.12)}
      #studioApp .music-card .music-meta-editor.is-open{display:grid}
      #studioApp .music-card .music-meta-editor label{display:grid;gap:3px;font:700 7px/1 Inter,ui-sans-serif,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase}
      #studioApp .music-card .music-meta-editor input{min-width:0;border:1px solid rgba(70,58,52,.16);border-radius:7px;background:rgba(255,255,255,.5);color:inherit;padding:6px 7px;font:10px/1.2 Inter,ui-sans-serif,system-ui,sans-serif}
      #studioApp .music-card .music-meta-editor button{grid-column:1/-1;justify-self:start}
      #studioApp .music-card .progress{cursor:pointer!important;height:5px!important;margin-top:9px!important;border-radius:999px!important;overflow:hidden!important}

      #studioApp .guest-check-card{--mail-accent:rgb(var(--aura-rgb,216,95,109));overflow:hidden!important}
      #studioApp .guest-check-card>.card-kicker{padding-right:56px!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      #studioApp .visitor-log-intro>div{min-width:0!important}
      #studioApp .visitor-log-intro strong,#studioApp .visitor-log-intro span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      #studioApp .visitor-log-actions{display:flex!important;align-items:center!important;flex-wrap:nowrap!important;gap:6px!important}
      #studioApp .visitor-log-actions button{white-space:nowrap!important;min-width:0!important;overflow:hidden!important;text-overflow:ellipsis!important}
      #studioApp .guest-check-card .widget-window-controls{z-index:12!important}
      #studioApp .guest-check-card .visitor-log-actions{position:relative!important;z-index:2!important}
      #studioApp .visitor-log-intro{display:block;margin:2px 0 10px}
      #studioApp .visitor-log-intro strong{display:block;font:700 13px/1.1 Georgia,"Times New Roman",serif}
      #studioApp .visitor-log-intro span{display:block;margin-top:3px;font:9px/1.35 Inter,ui-sans-serif,system-ui,sans-serif;color:var(--widget-muted,#77716b)}
      #studioApp .visitor-log-actions{display:flex;gap:6px;flex-wrap:wrap}
      #studioApp .visitor-log-actions button:first-child{background:var(--mail-accent);color:var(--aura-button-ink,#fff);border-color:transparent}
      #studioApp .visitor-log-count{margin-top:7px;font:8px/1.3 Inter,ui-sans-serif,system-ui,sans-serif;color:var(--widget-muted,#77716b)}
      #studioApp .hero-widget-rail>.guest-check-card{position:relative;display:block!important;min-height:216px!important;padding:0!important;border-radius:var(--widget-radius,16px)!important;overflow:hidden!important}
      #studioApp .guest-check-card>.card-kicker{display:none!important}
      #studioApp .guest-check-card>.widget-window-controls{position:absolute!important;right:13px!important;top:12px!important;z-index:7!important;margin:0!important}
      #studioApp .guest-check-card>.widget-drag-handle{top:10px!important;z-index:7!important}
      #studioApp .guest-check-sheet{position:absolute;inset:0;box-sizing:border-box;width:100%;height:100%;min-height:216px;margin:0!important;padding:30px 14px 12px;border:0!important;border-radius:inherit;background:repeating-linear-gradient(to bottom,#fffdf5 0,#fffdf5 30px,rgba(92,142,178,.24) 31px);box-shadow:inset 0 7px 0 rgba(var(--aura-rgb,216,95,109),.78),inset 0 10px 0 rgba(var(--aura-rgb,216,95,109),.18);color:#2d2824;overflow:hidden}
      #studioApp .guest-check-sheet::before{content:none}
      #studioApp .guest-check-sheet::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,rgba(255,255,255,.26),transparent 28%,rgba(69,47,37,.025));mix-blend-mode:multiply}
      #studioApp .guest-check-sheet-head{display:grid;grid-template-columns:minmax(0,1fr) 72px;align-items:center;gap:8px;margin:0 0 6px;padding:0 0 5px;border-bottom:2px solid rgba(var(--aura-rgb,216,95,109),.52);font:800 7px/1 Inter,ui-sans-serif,system-ui,sans-serif;letter-spacing:.13em;color:#665851}
      #studioApp .guest-check-sheet-head time{padding-left:9px;border-left:2px solid rgba(216,95,109,.78);text-align:right}
      #studioApp .guest-check-sheet-head time{letter-spacing:.04em;color:rgb(var(--aura-rgb,216,95,109))}
      #studioApp .guest-check-sheet .visitor-log-intro{margin:0 0 8px}
      #studioApp .guest-check-sheet .visitor-log-intro strong{font-family:"CS Bergamot Stitched",Georgia,"Times New Roman",serif;font-size:15px;font-weight:400;text-transform:lowercase;color:#211d1a}
      #studioApp .guest-check-sheet .visitor-log-intro span,#studioApp .guest-check-sheet .visitor-log-count{color:#736860!important}
      #studioApp .guest-check-sheet .visitor-log-actions button:not(:first-child){background:rgba(255,253,244,.82);color:#39322d}
      #studioApp .guest-check-lines{position:relative;z-index:2;height:62px;margin:0 0 7px;overflow:hidden;background:rgba(255,253,245,.78)}
      #studioApp .guest-check-lines-track{display:flex;flex-direction:column;will-change:transform}
      #studioApp .guest-check-line{box-sizing:border-box;display:grid;grid-template-columns:minmax(0,1fr) 72px;align-items:end;gap:8px;height:31px;min-height:31px;padding:0 4px 6px;overflow:hidden;border-bottom:1px solid rgba(92,142,178,.24);color:#3c332e;font:700 9px/1.05 "Comic Sans MS","Arial Rounded MT Bold",system-ui,sans-serif;white-space:nowrap}
      #studioApp .guest-check-entry{min-width:0;overflow:hidden;text-overflow:ellipsis}
      #studioApp .guest-check-date{align-self:stretch;display:flex;align-items:flex-end;justify-content:flex-end;padding:0 0 1px 9px;border-left:2px solid rgba(216,95,109,.66);color:#7d667f;font:700 7px/1 Inter,ui-sans-serif,system-ui,sans-serif;text-align:right}
      #studioApp .guest-check-line.is-placeholder{display:flex;align-items:flex-end}
      #studioApp .guest-check-line em{font-weight:500;color:#756861}
      #studioApp .guest-check-lines.is-filled .guest-check-lines-track{animation:biglwa-guest-lines-scroll 14s linear infinite}
      @keyframes biglwa-guest-lines-scroll{0%,8%{transform:translateY(0)}92%,100%{transform:translateY(-50%)}}
      /* Keep every card symbol and stitched heading on the same optical baseline. */
      #studioApp .masonry>.card>.card-icon,#studioApp .hero-widget-rail>.card>.card-icon{display:inline-flex!important;align-items:center!important;justify-content:center!important;vertical-align:middle!important;position:relative!important;top:0!important;transform:none!important;margin:0 9px 0 0!important;line-height:1!important}
      #studioApp .masonry>.card>h2,#studioApp .masonry>.card>h3,#studioApp .hero-widget-rail>.card>h2,#studioApp .hero-widget-rail>.card>h3{display:inline-flex!important;align-items:center!important;vertical-align:middle!important;margin-top:0!important;line-height:1!important}
      #studioApp .card .studio-symbol-mark{display:inline-flex!important;align-items:center!important;justify-content:center!important;vertical-align:middle!important;position:relative!important;top:0!important;transform:none!important;line-height:1!important}
      #studioApp .card .studio-symbol-image{display:block!important;width:100%!important;height:100%!important;object-fit:contain!important;object-position:center!important}
      #studioApp #feed .card-icon.studio-image-icon,#studioApp #diary .card-icon.studio-image-icon,#studioApp #learn .card-icon.studio-image-icon,#studioApp #notes .card-icon.studio-image-icon{width:28px!important;height:26px!important}
      #studioApp #projects .card-icon.studio-projects-mark,#studioApp #games .card-icon.games-chess-only-mark{width:28px!important;height:26px!important}
      #studioApp #closet .card-icon{width:28px!important;height:26px!important}
      #studioApp .card .card-icon svg,#studioApp .card .card-icon img{max-width:100%!important;max-height:100%!important}
      #studioApp .card .card-icon{display:inline-flex!important;align-items:center!important;justify-content:center!important;vertical-align:middle!important;line-height:1!important;position:relative!important;top:0!important;transform:none!important;margin-right:9px!important}
      /* Optical baseline correction for the taller/narrower supplied marks. */
      #studioApp #closet .card-icon,#studioApp #diary .card-icon,#studioApp #projects .card-icon,#studioApp #games .card-icon{transform:translateY(4px)!important}
      /* Use a real shared header row: each mark is centered beside its title. */
      #studioApp .biglwa-card-heading-row{display:flex!important;align-items:center!important;gap:10px!important;min-height:30px!important;margin:0 0 8px!important}
      #studioApp .biglwa-card-heading-row>.card-icon{flex:0 0 28px!important;width:28px!important;height:28px!important;margin:0!important;transform:none!important;align-self:center!important}
      #studioApp .biglwa-card-heading-row>h2{flex:0 0 auto!important;margin:0!important;line-height:1!important;align-self:center!important}

      #studioApp #closet .card-icon .studio-symbol-mark,#studioApp #diary .card-icon .studio-symbol-mark,#studioApp #projects .card-icon .studio-symbol-mark,#studioApp #games .card-icon .games-chess-mark{transform:translateY(0)!important}

      #studioApp #diary{background-color:#0b0b0d!important;background-image:url("/assets/composition-texture.webp?v=20260917-composition-2")!important;background-size:340px 227px!important;background-position:center top!important;color:#fff!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.18),0 18px 45px rgba(0,0,0,.22)!important}
      #studioApp #diary .biglwa-card-heading-row,#studioApp #diary>.sub{position:relative;z-index:2;text-shadow:0 1px 4px #000,0 0 9px #000}
      #studioApp #diary .biglwa-card-heading-row h2{color:#fff!important}
      #studioApp #diary .studio-diary-symbol img{filter:brightness(0) invert(1) drop-shadow(0 1px 3px #000)}
      #studioApp #diary>.sub{color:rgba(255,255,255,.88)!important}
      #studioApp #diary .diary-page{position:relative!important;display:grid!important;place-items:center!important;min-height:210px!important;aspect-ratio:auto!important;padding:24px!important;border:9px solid #101012!important;border-left-width:18px!important;border-radius:4px 13px 13px 4px!important;background-color:#0b0b0d!important;background-image:url("/assets/composition-texture.webp?v=20260917-composition-2")!important;background-size:340px 227px!important;background-position:center!important;background-blend-mode:normal!important;box-shadow:inset 5px 0 0 rgba(255,255,255,.28),0 13px 24px rgba(0,0,0,.32)!important;overflow:hidden!important}
      #studioApp #diary .diary-page img{display:none!important}
      #studioApp #diary .diary-page::before,#studioApp #diary .diary-page::after{content:none!important}
      #studioApp #diary .diary-cover-label{position:relative;display:grid;align-content:center;gap:9px;box-sizing:border-box;width:min(84%,290px);min-height:118px;padding:20px 24px 18px;border:4px double #171717;border-radius:4px 16px 16px 4px;background:#fff;color:#111;box-shadow:0 7px 0 rgba(0,0,0,.22),inset 0 0 0 2px rgba(0,0,0,.08);transform:rotate(-.55deg)}
      #studioApp #diary .diary-cover-label::before,#studioApp #diary .diary-cover-label::after{content:"";position:absolute;left:24px;right:24px;height:2px;background:#191919;opacity:.76}
      #studioApp #diary .diary-cover-label::before{top:58px}#studioApp #diary .diary-cover-label::after{top:91px}
      #studioApp #diary .diary-cover-label strong,#studioApp #diary .diary-cover-label span{position:relative;z-index:1;display:block;font-family:"Arial Rounded MT Bold","Comic Sans MS",Impact,sans-serif;font-weight:900;letter-spacing:-.035em;text-align:left}
      #studioApp #diary .diary-cover-label strong{font-size:30px;line-height:1;transform:rotate(-1deg)}
      #studioApp #diary .diary-cover-label span{font-size:14px;line-height:1.1;transform:rotate(.4deg)}

      #studioApp #games .games-library{position:relative;margin:12px 0 4px;padding:18px 18px 102px;border:9px solid #1c100e;border-radius:29px 29px 17px 17px;background:linear-gradient(90deg,#281310 0,#5e3327 12%,#754836 49%,#5b3025 87%,#25120f 100%);clip-path:none;box-shadow:inset 0 0 0 3px rgba(255,215,141,.14),inset 0 -76px 0 rgba(20,11,10,.55),inset 14px 0 18px rgba(0,0,0,.24),inset -14px 0 18px rgba(0,0,0,.24),0 21px 34px rgba(38,25,19,.24);overflow:hidden}
      #studioApp #games .games-arcade-brand{position:relative;isolation:isolate;overflow:hidden;margin:-4px 8px 16px;padding:6px 24px 11px;border:5px solid #160e0c;border-radius:18px 18px 8px 8px;background:radial-gradient(circle at 50% 0,rgba(255,249,190,.7),transparent 58%),#f2c450;clip-path:polygon(5% 9%,19% 9%,24% 0,76% 0,81% 9%,95% 9%,100% 19%,100% 100%,0 100%,0 19%);box-shadow:inset 0 0 0 3px rgba(255,255,255,.24),0 7px 0 #140d0b,0 12px 20px rgba(0,0,0,.28)}
      #studioApp #games .games-arcade-brand::before{content:"";position:absolute;inset:0;z-index:3;pointer-events:none;background:radial-gradient(circle,#fff5ad 0 2.4px,#e8bc4c 2.7px 4px,transparent 4.3px) left 7px center/13px 18px repeat-y,radial-gradient(circle,#fff5ad 0 2.4px,#e8bc4c 2.7px 4px,transparent 4.3px) right 7px center/13px 18px repeat-y,repeating-linear-gradient(to bottom,rgba(255,255,255,.08) 0 1px,rgba(20,8,7,.11) 2px 3px);mix-blend-mode:normal}
      #studioApp #games .games-arcade-brand::after{content:"";position:absolute;inset:-35%;z-index:4;pointer-events:none;background:repeating-radial-gradient(circle at 25% 30%,rgba(255,255,255,.34) 0 1px,transparent 1px 4px),repeating-radial-gradient(circle at 75% 65%,rgba(47,9,18,.28) 0 1px,transparent 1px 5px);opacity:.16;animation:biglwa-arcade-static .42s steps(2,end) infinite}
      #studioApp #games .games-arcade-brand img{position:relative;z-index:2}
      #studioApp #games .games-arcade-brand img:first-child{height:70px!important;margin:-12px auto -17px!important}
      #studioApp #games .games-arcade-brand img:last-child{width:min(90%,236px)!important;margin:-5px auto 0!important;mix-blend-mode:multiply!important}
      #studioApp #games .arcade-library-viewport{height:230px!important;padding:10px!important;border:10px solid #171313!important;border-radius:12px!important;background:#070909!important;clip-path:polygon(2% 0,98% 0,100% 100%,0 100%);box-shadow:inset 0 0 22px rgba(76,219,231,.16),0 6px 0 #0d0908!important;-webkit-mask-image:none!important;mask-image:none!important}
      #studioApp #games .games-library::before{content:none}
      #studioApp #games .games-library::after{content:none}
      #studioApp #games .arcade-control-deck{position:absolute;left:20px;right:20px;bottom:14px;z-index:4;display:flex;align-items:end;justify-content:center;gap:21px;height:66px;border-top:4px solid #170d0b;border-radius:15px 15px 9px 9px;background:linear-gradient(180deg,#85513d 0%,#6a3d2d 58%,#2b1714 59%,#3a201a 100%);clip-path:polygon(7% 0,93% 0,100% 100%,0 100%);box-shadow:inset 0 5px 8px rgba(255,220,164,.11),inset 0 -8px 10px rgba(12,6,5,.28);filter:drop-shadow(0 -4px 0 #180d0b) drop-shadow(0 6px 3px rgba(0,0,0,.28));transform:perspective(520px) rotateX(3deg);transform-origin:50% 100%}
      #studioApp #games .arcade-joystick{--stick:#dd5c70;position:relative;display:block;width:38px;height:61px;filter:drop-shadow(0 5px 2px rgba(0,0,0,.35))}
      #studioApp #games .arcade-joystick::before{content:"";position:absolute;left:50%;top:20px;width:7px;height:31px;border-radius:5px;background:linear-gradient(90deg,#171313,#555,#151111);transform:translateX(-50%)}
      #studioApp #games .arcade-joystick::after{content:"";position:absolute;left:50%;top:0;width:27px;height:27px;border-radius:50%;background:radial-gradient(circle at 36% 27%,rgba(255,255,255,.58),transparent 24%),var(--stick);box-shadow:inset -4px -5px 7px rgba(0,0,0,.22),0 0 0 2px rgba(17,10,9,.58);transform:translateX(-50%)}
      #studioApp #games .arcade-joystick>i{position:absolute;left:50%;bottom:5px;width:35px;height:13px;border:3px solid #140c0a;border-radius:50%;background:#281714;transform:translateX(-50%);box-shadow:inset 0 2px 0 rgba(255,255,255,.1)}
      #studioApp #games .arcade-joystick.is-yellow{--stick:#efc548}#studioApp #games .arcade-joystick.is-red{--stick:rgb(var(--aura-rgb,216,95,109))}#studioApp #games .arcade-joystick.is-green{--stick:#5ca975}
      @keyframes biglwa-arcade-static{0%{transform:translate(0,0)}25%{transform:translate(4%,-3%)}50%{transform:translate(-3%,4%)}75%{transform:translate(2%,3%)}100%{transform:translate(-2%,-2%)}}

      #studioApp .card h2,#studioApp .card h3,#studioApp .profile-card .profile-display-name,#studioApp .profile-card .profile-name-line h1,#studioApp .profile-card .real-rank strong,#studioApp .panel-title strong{font-family:"CS Bergamot Stitched",Georgia,"Times New Roman",serif!important;font-weight:400!important;letter-spacing:.01em!important;text-transform:lowercase!important}
      #studioApp .aura-card .aura-orb{animation:biglwa-aura-wobble 5.8s cubic-bezier(.45,.05,.55,.95) infinite;transform-origin:50% 50%;will-change:transform}
      @keyframes biglwa-aura-wobble{0%,100%{transform:translate3d(0,0,0) scale(1) rotate(0deg)}18%{transform:translate3d(4px,-3px,0) scale(1.055) rotate(-2.2deg)}42%{transform:translate3d(-3px,2px,0) scale(.965) rotate(1.8deg)}67%{transform:translate3d(3px,3px,0) scale(1.042) rotate(-1.4deg)}84%{transform:translate3d(-2px,-1px,0) scale(.985) rotate(1deg)}}
      @media(prefers-reduced-motion:reduce){#studioApp .aura-card .aura-orb,#studioApp .games-arcade-brand::after,#studioApp .guest-check-lines-track{animation:none!important}}

      #guestCheckDialog,#studioLogsDialog{width:min(560px,calc(100vw - 28px));max-height:min(720px,calc(100vh - 28px));padding:0;border:1px solid rgba(73,59,52,.18);border-radius:20px;background:#f8f2ec;color:#201d1b;box-shadow:0 28px 90px rgba(28,17,13,.34);overflow:auto}
      #guestCheckDialog::backdrop,#studioLogsDialog::backdrop{background:rgba(24,17,15,.54);backdrop-filter:blur(8px)}
      #guestCheckDialog .visitor-dialog-head,#studioLogsDialog .visitor-dialog-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:20px 22px 13px;border-bottom:1px solid rgba(73,59,52,.12)}
      #guestCheckDialog .visitor-dialog-head h2,#studioLogsDialog .visitor-dialog-head h2{margin:0;font:700 24px/1 Georgia,"Times New Roman",serif}
      #guestCheckDialog .visitor-dialog-head p,#studioLogsDialog .visitor-dialog-head p{margin:6px 0 0;font:12px/1.45 Inter,ui-sans-serif,system-ui,sans-serif;color:#766e68}
      #guestCheckDialog .visitor-dialog-close,#studioLogsDialog .visitor-dialog-close{width:31px;height:31px;padding:0;display:grid;place-items:center;font-size:18px}
      #guestCheckDialog .visitor-dialog-tabs{display:flex;gap:6px;padding:12px 22px 0}
      #guestCheckDialog .visitor-dialog-tabs button[aria-selected="true"]{background:rgb(var(--aura-rgb,216,95,109));border-color:transparent;color:var(--aura-button-ink,#fff)}
      #guestCheckDialog .visitor-dialog-pane{padding:15px 22px 22px}
      #guestCheckDialog .visitor-dialog-pane[hidden]{display:none}
      #guestCheckDialog label{display:grid;gap:5px;margin-bottom:10px;font:750 10px/1 Inter,ui-sans-serif,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase}
      #guestCheckDialog input,#guestCheckDialog textarea{box-sizing:border-box;width:100%;border:1px solid rgba(73,59,52,.18);border-radius:10px;background:rgba(255,255,255,.72);color:inherit;padding:10px 11px;font:12px/1.4 Inter,ui-sans-serif,system-ui,sans-serif;resize:vertical}
      #guestCheckDialog .visitor-dialog-primary{background:#1d1b1a;color:#fff;border-color:#1d1b1a;padding:9px 14px}
      #guestCheckDialog .visitor-form-note,#guestCheckDialog .visitor-form-status{margin:8px 0 0;font:10px/1.45 Inter,ui-sans-serif,system-ui,sans-serif;color:#766e68}
      #guestCheckDialog .visitor-own-profile-state{margin:0 0 13px;padding:11px 12px;border:1px solid rgba(var(--aura-rgb,216,95,109),.22);border-radius:11px;background:rgba(var(--aura-rgb,216,95,109),.07);font:11px/1.45 Inter,ui-sans-serif,system-ui,sans-serif;color:#615852}
      #guestCheckDialog .visitor-own-profile-state[hidden]{display:none}
      #guestCheckDialog .visitor-note-list{display:grid;gap:7px;margin-top:13px}
      #guestCheckDialog .visitor-note-item{padding:10px 11px;border:1px solid rgba(73,59,52,.11);border-radius:10px;background:rgba(255,255,255,.46);font:13px/1.4 Georgia,"Times New Roman",serif}
      #guestCheckDialog .visitor-note-item small{display:block;margin-top:4px;font:9px/1.3 Inter,ui-sans-serif,system-ui,sans-serif;color:#837a73}
      #guestCheckDialog .encryption-readiness{display:grid;grid-template-columns:30px 1fr;gap:8px;align-items:center;margin:0 0 12px;padding:9px 10px;border:1px solid rgba(var(--aura-rgb,216,95,109),.25);border-radius:11px;background:rgba(var(--aura-rgb,216,95,109),.07)}
      #guestCheckDialog .encryption-readiness svg{width:25px;height:25px;color:rgb(var(--aura-rgb,216,95,109))}
      #guestCheckDialog .encryption-readiness strong,#guestCheckDialog .encryption-readiness span{display:block}
      #guestCheckDialog .encryption-readiness strong{font:700 10px/1.2 Inter,ui-sans-serif,system-ui,sans-serif}
      #guestCheckDialog .encryption-readiness span{margin-top:2px;font:9px/1.35 Inter,ui-sans-serif,system-ui,sans-serif;color:#766e68}
      #guestCheckDialog .guest-gift-label{margin:2px 0 7px;font:750 10px/1 Inter,ui-sans-serif,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase}
      #guestCheckDialog .guest-gift-picker{display:grid;grid-template-columns:repeat(8,minmax(38px,1fr));gap:6px;margin-bottom:13px}
      #guestCheckDialog .guest-gift-picker label{display:block;margin:0;letter-spacing:0;text-transform:none}
      #guestCheckDialog .guest-gift-picker input{position:absolute;opacity:0;pointer-events:none}
      #guestCheckDialog .guest-gift-picker span{display:grid;place-items:center;min-height:38px;border:1px solid rgba(73,59,52,.14);border-radius:10px;background:rgba(255,255,255,.58);font-size:20px;cursor:pointer}
      #guestCheckDialog .guest-gift-picker input:checked+span{border-color:rgb(var(--aura-rgb,216,95,109));box-shadow:0 0 0 2px rgba(var(--aura-rgb,216,95,109),.16)}
      #studioLogsDialog .studio-log-list{display:grid;gap:8px;padding:15px 22px 22px}
      #studioLogsDialog .studio-log-item{display:grid;grid-template-columns:10px minmax(0,1fr) auto;gap:10px;align-items:start;padding:11px 12px;border:1px solid rgba(73,59,52,.12);border-radius:12px;background:rgba(255,255,255,.48)}
      #studioLogsDialog .studio-log-dot{width:9px;height:9px;margin-top:3px;border-radius:50%;background:rgb(var(--aura-rgb,216,95,109))}
      #studioLogsDialog .studio-log-item.is-private .studio-log-dot{background:#8d837c}
      #studioLogsDialog .studio-log-item strong,#studioLogsDialog .studio-log-item span{display:block}
      #studioLogsDialog .studio-log-item strong{font:700 12px/1.25 Inter,ui-sans-serif,system-ui,sans-serif}
      #studioLogsDialog .studio-log-item span{margin-top:3px;font:10px/1.4 Inter,ui-sans-serif,system-ui,sans-serif;color:#766e68}
      #studioLogsDialog .studio-log-item time{font:9px/1.2 Inter,ui-sans-serif,system-ui,sans-serif;color:#8a817a;white-space:nowrap}
      #studioLogsDialog .studio-log-empty{padding:24px 22px 28px;color:#766e68;font:12px/1.5 Inter,ui-sans-serif,system-ui,sans-serif;text-align:center}
      #studioLogsDialog .studio-mail-tabs{display:flex;gap:6px;padding:12px 22px 0}
      #studioLogsDialog .studio-mail-tabs button{border:1px solid rgba(73,59,52,.14);border-radius:999px;background:rgba(255,255,255,.45);color:inherit;padding:7px 11px;font:700 9px/1 Inter,ui-sans-serif,system-ui,sans-serif;cursor:pointer}
      #studioLogsDialog .studio-mail-tabs button[aria-selected="true"]{border-color:transparent;background:rgb(var(--aura-rgb,216,95,109));color:var(--aura-button-ink,#fff)}
      #studioLogsDialog .studio-mail-pane[hidden]{display:none}
      #studioLogsDialog .studio-message-pane{padding:16px 22px 22px}
      #studioLogsDialog .studio-message-pane label{display:grid;gap:5px;margin-bottom:11px;font:750 9px/1 Inter,ui-sans-serif,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase}
      #studioLogsDialog .studio-message-pane input,#studioLogsDialog .studio-message-pane textarea{box-sizing:border-box;width:100%;padding:10px 11px;border:1px solid rgba(73,59,52,.18);border-radius:10px;background:rgba(255,255,255,.72);color:inherit;font:12px/1.4 Inter,ui-sans-serif,system-ui,sans-serif;text-transform:none;letter-spacing:0;resize:vertical}
      #studioLogsDialog .studio-message-pane button{border:0;border-radius:999px;background:#1d1b1a;color:#fff;padding:9px 14px;font:700 10px/1 Inter,ui-sans-serif,system-ui,sans-serif;cursor:pointer}
      #studioLogsDialog .studio-message-status{min-height:14px;margin:8px 0 0;color:#766e68;font:10px/1.4 Inter,ui-sans-serif,system-ui,sans-serif}

      #studioApp .sidebar-theme-btn .biglwa-theme-icon{display:none!important}
      #studioApp .sidebar-theme-btn img{display:block!important;width:100%!important;height:100%!important;object-fit:contain!important;filter:brightness(0)!important;mix-blend-mode:normal!important}
      #studioApp #studioNotificationsBtn .visitor-mail-icon{width:20px;height:20px;display:block}
      #studioApp #studioSignOut .studio-logout-icon{display:block;width:22px;height:22px;object-fit:contain}
      #studioApp #studioSignOut,#studioApp #studioNotificationsBtn{display:grid;place-items:center;width:30px;height:30px;padding:0}
      #studioApp #studioNotificationsBtn .notif-dot[hidden]{display:none!important}
      #studioApp .profile-card.profile-is-editing{display:grid!important;grid-template-columns:minmax(150px,184px) minmax(0,1fr)!important;width:100%!important;min-height:540px!important;max-height:none!important;padding:0!important;overflow:hidden!important}
      #studioApp .profile-card.profile-is-editing .profile-identity-rail{grid-column:1!important;grid-row:1!important;align-self:stretch!important;padding:22px 18px!important;border-right:1px solid rgba(62,50,45,.12)!important;background:rgba(var(--aura-rgb,216,95,109),.05)!important}
      #studioApp .profile-card:not(.profile-is-editing) #wallpaperPanel{display:none!important}
      #studioApp .profile-card.profile-is-editing #wallpaperPanel.profile-inline-editor{position:static!important;inset:auto!important;grid-column:2!important;grid-row:1!important;display:block!important;visibility:visible!important;opacity:1!important;align-self:stretch!important;width:auto!important;min-width:0!important;max-width:none!important;max-height:none!important;margin:0!important;padding:22px 26px 24px!important;overflow:visible!important;transform:none!important;pointer-events:auto!important;border:0!important;border-radius:0!important;background:transparent!important;background-image:none!important;box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;z-index:auto!important}
      #studioApp .profile-card.profile-is-editing #wallpaperPanel .panel-title{position:static!important;margin:0 0 12px!important;padding:0 0 12px!important;border-bottom:1px solid rgba(73,59,52,.12)!important;background:none!important}
      #studioApp .profile-card.profile-is-editing .profile-editor-tabs{display:flex!important;flex-wrap:wrap!important;gap:7px!important;margin-bottom:16px!important;padding-bottom:12px!important}
      #studioApp .profile-card.profile-is-editing .profile-editor-tabs button{min-height:32px!important;padding:8px 12px!important;font-size:10px!important}
      #studioApp .profile-card.profile-is-editing #wallpaperPanel .customize-section h3{font-size:17px!important}
      #studioApp .profile-card.profile-is-editing #wallpaperPanel .customize-section p{font-size:12px!important;line-height:1.45!important}
      #studioApp .profile-card.profile-is-editing .profile-editor-grid label{font-size:11px!important;line-height:1.35!important}
      #studioApp .profile-card.profile-is-editing .profile-editor-grid input,#studioApp .profile-card.profile-is-editing .profile-editor-grid textarea,#studioApp .profile-card.profile-is-editing select{font-size:12px!important;line-height:1.35!important}
      #studioApp .profile-card.profile-is-editing .profile-editor-actions{position:static!important;display:grid!important;grid-template-columns:minmax(0,1fr) auto auto!important;align-items:center!important;gap:8px!important;margin:0 0 18px!important;padding:0 0 15px!important;border-top:0!important;border-bottom:1px solid rgba(73,59,52,.12)!important;background:none!important;background-image:none!important;visibility:visible!important;opacity:1!important}
      #studioApp .profile-card.profile-is-editing .profile-editor-actions button{display:inline-flex!important;visibility:visible!important;opacity:1!important;align-items:center!important;justify-content:center!important;width:auto!important;min-width:104px!important;min-height:36px!important;margin:0!important;padding:10px 14px!important}
      #studioApp .profile-card.profile-is-editing #saveProfileBtn{background:rgb(var(--aura-rgb,216,95,109))!important;color:var(--aura-button-ink,#fff)!important;border:0!important}
      #studioApp .profile-card.profile-is-editing #cancelProfileBtn{background:rgba(255,255,255,.48)!important;color:var(--widget-ink,#272321)!important;border:1px solid rgba(73,59,52,.16)!important}
      body.night-mode #studioApp .profile-card.profile-is-editing #cancelProfileBtn{background:#302c2a!important;border-color:#514a45!important;color:#eee7e0!important}
      #studioApp .profile-update-privacy{display:flex!important;align-items:flex-start!important;gap:8px!important;width:auto!important;min-width:0!important;margin:0!important;font:600 10px/1.35 Inter,ui-sans-serif,system-ui,sans-serif!important;color:var(--widget-muted,#6f6862)!important}
      #studioApp .profile-update-privacy input{width:15px!important;height:15px!important;margin:0!important;accent-color:rgb(var(--aura-rgb,216,95,109))!important}
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
      #studioApp #games .quiz>.games-block-mark{display:block;width:82%;height:auto;max-height:120px;margin:0 auto 12px;border-radius:7px;object-fit:contain;object-position:center;box-shadow:0 2px 5px rgba(31,24,21,.14);mix-blend-mode:multiply}
      #studioApp #games .games-preview-picker,#studioApp #games .games-external-preview{display:none!important}
      #studioApp #games .games-block-mark{border:0!important;outline:0!important;box-shadow:none!important}
      #studioApp #games .games-preview-picker{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:end;margin:0 0 10px;padding:8px 9px;border:1px solid rgba(70,58,52,.14);border-radius:9px;background:rgba(255,255,255,.36)}
      #studioApp #games .games-preview-picker label{display:grid;gap:4px;min-width:0;font:700 8px/1 Inter,ui-sans-serif,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase}
      #studioApp #games .games-preview-picker select{width:100%;min-width:0;border:1px solid rgba(70,58,52,.16);border-radius:7px;background:rgba(255,255,255,.62);color:inherit;padding:6px 8px;font:11px/1.2 Inter,ui-sans-serif,system-ui,sans-serif}
      #studioApp #games .games-preview-library-note{max-width:116px;font:8px/1.35 Inter,ui-sans-serif,system-ui,sans-serif;color:var(--widget-muted,#77716b);text-align:right}
      #studioApp #games .games-external-preview{margin:0 0 8px;padding:18px 16px;border:1px solid rgba(var(--aura-rgb,216,95,109),.2);border-radius:10px;background:color-mix(in srgb,var(--widget-bg,rgba(250,247,241,.84)) 72%,transparent);text-align:center}
      #studioApp #games .games-external-preview[hidden],#studioApp #games .games-block-mark[hidden]{display:none!important}
      #studioApp #games .games-preview-kicker{display:block;margin-bottom:7px;font:750 8px/1 Inter,ui-sans-serif,system-ui,sans-serif;letter-spacing:.12em;color:var(--widget-muted,#77716b)}
      #studioApp #games .games-external-preview h3{margin:0;font:700 22px/1.05 Georgia,"Times New Roman",serif;color:var(--widget-ink,#171717)}
      #studioApp #games .games-external-preview p{margin:7px auto 12px;max-width:300px;font:11px/1.4 Inter,ui-sans-serif,system-ui,sans-serif;color:var(--widget-muted,#77716b)}
      #studioApp #games .games-external-preview a{display:inline-block;padding:7px 11px;border-radius:999px;background:rgb(var(--aura-rgb,216,95,109));color:var(--aura-button-ink,#fff);font:700 10px/1 Inter,ui-sans-serif,system-ui,sans-serif;text-decoration:none}
      #studioApp #games .games-preview-coming-soon{display:inline-block;font:10px/1.35 Inter,ui-sans-serif,system-ui,sans-serif;color:var(--widget-muted,#77716b)}
      @media(max-width:560px){#studioApp #games .games-preview-picker{grid-template-columns:1fr}#studioApp #games .games-preview-library-note{max-width:none;text-align:left}}

      body.night-mode #studioApp #games .games-block-mark{mix-blend-mode:normal;filter:contrast(1.08)}

      body.night-mode #studioApp{color:var(--widget-ink,#f5eee7)!important}
      body.night-mode #studioApp .profile-card,body.night-mode #studioApp .music-card,body.night-mode #studioApp .aura-card,body.night-mode #studioApp .guest-check-card,body.night-mode #studioApp .mobile-dock.hero-action-bar,body.night-mode #studioApp .masonry .card:not(.manifesto-card){background:var(--widget-bg,rgba(250,247,241,.84))!important;border-color:rgba(var(--aura-rgb,216,95,109),.18)!important;color:var(--widget-ink,#171717)!important;box-shadow:0 18px 45px rgba(0,0,0,.25)!important}
      body.night-mode #studioApp #diary{background-color:#0b0b0d!important;background-image:url("/assets/composition-texture.webp?v=20260917-composition-2")!important;background-size:340px 227px!important;color:#fff!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.18),0 18px 45px rgba(0,0,0,.34)!important}
      body.night-mode #studioApp .profile-card .profile-identity-rail{background:color-mix(in srgb,var(--widget-ink,#171717) 4%,transparent)!important;border-color:rgba(var(--aura-rgb,216,95,109),.14)!important}
      body.night-mode #studioApp .profile-card .profile-name-line h1,body.night-mode #studioApp .profile-card .bio,body.night-mode #studioApp .profile-card .stats b,body.night-mode #studioApp .card-kicker{color:var(--widget-ink,#171717)!important}
      #studioApp .profile-card #wallpaperPanel{background:transparent!important;color:var(--widget-ink,#171717)!important}
      #studioApp .profile-card #wallpaperPanel .panel-title{background-image:linear-gradient(to bottom,var(--widget-bg,rgba(250,247,241,.84)) 72%,transparent)!important;color:var(--widget-ink,#171717)!important}
      #studioApp .profile-editor-actions{background-image:linear-gradient(to top,var(--widget-bg,rgba(250,247,241,.84)) 76%,transparent)!important;color:var(--widget-ink,#171717)!important}
      body.night-mode #studioApp #wallpaperPanel input,body.night-mode #studioApp #wallpaperPanel textarea,body.night-mode #studioApp #wallpaperPanel select,body.night-mode #studioApp .music-meta-editor input{background:#292625!important;border-color:#514b47!important;color:#f5eee7!important;color-scheme:dark}
      body.night-mode #studioApp .profile-editor-tabs button,body.night-mode #studioApp .music-file-actions button,body.night-mode #studioApp .visitor-log-actions button,body.night-mode #studioApp .widget-drag-handle{background:rgba(255,255,255,.07)!important;border-color:rgba(255,255,255,.13)!important;color:#eee6df!important}
      body.night-mode #studioApp .visitor-log-actions button:first-child{background:rgb(var(--aura-rgb,216,95,109))!important;color:var(--aura-button-ink,#fff)!important}
      body.night-mode #guestCheckDialog,body.night-mode #studioLogsDialog{background:#252220;color:#f5eee7;border-color:rgba(255,255,255,.13);color-scheme:dark}
      body.night-mode #guestCheckDialog .visitor-dialog-head,body.night-mode #guestCheckDialog .visitor-note-item,body.night-mode #studioLogsDialog .visitor-dialog-head,body.night-mode #studioLogsDialog .studio-log-item{border-color:rgba(255,255,255,.1)}
      body.night-mode #guestCheckDialog input,body.night-mode #guestCheckDialog textarea{background:#302c2a;border-color:#514a45;color:#f5eee7}
      body.night-mode #guestCheckDialog .visitor-dialog-head p,body.night-mode #guestCheckDialog .visitor-form-note,body.night-mode #guestCheckDialog .visitor-form-status,body.night-mode #guestCheckDialog .encryption-readiness span,body.night-mode #guestCheckDialog .visitor-note-item small,body.night-mode #studioLogsDialog .visitor-dialog-head p,body.night-mode #studioLogsDialog .studio-log-item span,body.night-mode #studioLogsDialog .studio-log-item time{color:#bbb1a9}
      body.night-mode #guestCheckDialog .visitor-own-profile-state{color:#d8cec6}
      body.night-mode #guestCheckDialog .visitor-note-item,body.night-mode #studioLogsDialog .studio-log-item{background:rgba(255,255,255,.04)}

      /* Compact the profile banner and top widget rail without changing their content. */
      #studioApp:not(.profile-editor-wallpaper) .hero>.profile-card:not(.profile-is-editing){height:286px!important;min-height:286px!important;max-height:286px!important;grid-template-columns:150px minmax(0,1fr)!important;gap:16px!important;padding:12px!important}
      #studioApp:not(.profile-editor-wallpaper) .profile-card:not(.profile-is-editing) .profile-identity-rail{gap:7px!important;padding:8px 12px!important}
      #studioApp:not(.profile-editor-wallpaper) .profile-card:not(.profile-is-editing) .profile-avatar{left:5px!important;width:100px!important;height:100px!important;border-radius:16px!important;font-size:46px!important}
      #studioApp:not(.profile-editor-wallpaper) .profile-card:not(.profile-is-editing) #editProfileBtn{width:110px!important;max-width:110px!important;min-height:30px!important;padding:7px 10px!important}
      #studioApp:not(.profile-editor-wallpaper) .profile-card:not(.profile-is-editing) .profile-rail-location{width:118px!important;font-size:10px!important}
      #studioApp:not(.profile-editor-wallpaper) .profile-card:not(.profile-is-editing) .profile-identity-rail>.weekly-mood-card{width:118px!important;min-height:52px!important;margin-top:0!important;padding:8px 9px!important}
      #studioApp:not(.profile-editor-wallpaper) .profile-card:not(.profile-is-editing) .profile-copy{padding:18px 22px 56px 0!important}
      #studioApp:not(.profile-editor-wallpaper) .profile-card:not(.profile-is-editing) .profile-name-line h1{font-size:28px!important}
      #studioApp:not(.profile-editor-wallpaper) .profile-card:not(.profile-is-editing) .bio{font-size:14px!important;line-height:1.3!important}
      #studioApp:not(.profile-editor-wallpaper) .profile-card:not(.profile-is-editing) .meta-row{margin-bottom:9px!important}
      #studioApp:not(.profile-editor-wallpaper) .profile-card:not(.profile-is-editing) .stats{padding-top:8px!important}
      #studioApp:not(.profile-editor-wallpaper) .profile-card:not(.profile-is-editing) .real-rank{left:166px!important;right:24px!important;bottom:13px!important}
      #studioApp:not(.profile-editor-wallpaper) .hero-widget-rail>.music-card,#studioApp:not(.profile-editor-wallpaper) .hero-widget-rail>.aura-card,#studioApp:not(.profile-editor-wallpaper) .hero-widget-rail>.guest-check-card{height:184px!important;min-height:184px!important;max-height:184px!important;overflow:hidden!important}
      #studioApp:not(.profile-editor-wallpaper) .hero-widget-rail>.music-card,#studioApp:not(.profile-editor-wallpaper) .hero-widget-rail>.aura-card{padding:14px 16px!important}
      #studioApp:not(.profile-editor-wallpaper) .guest-check-sheet{min-height:184px!important;padding:28px 12px 8px!important}
      #studioApp:not(.profile-editor-wallpaper) .guest-check-sheet-head{margin-bottom:3px!important;padding-bottom:3px!important}
      #studioApp:not(.profile-editor-wallpaper) .guest-check-sheet .visitor-log-intro{margin-bottom:4px!important}
      #studioApp:not(.profile-editor-wallpaper) .guest-check-lines{height:62px!important;margin-bottom:4px!important}
      #studioApp:not(.profile-editor-wallpaper) .guest-check-sheet .visitor-log-count{margin-top:2px!important}
      #studioApp:not(.profile-editor-wallpaper) .guest-check-sheet .visitor-log-actions button{padding:5px 8px!important}

      /* The editor preview uses the same three treatments as the saved mood card. */
      #studioApp .profile-mood-preview{position:relative;box-sizing:border-box;width:min(240px,100%);min-height:84px;margin:12px 0 2px;padding:14px 16px;overflow:hidden;color:#2e2926;text-align:left}
      #studioApp .weekly-mood-card[data-mood-style="diary"]{position:relative;border:1px solid #d9d3c8;border-left:1px solid #d9d3c8;border-radius:5px;background-color:#fffdf5;background-image:linear-gradient(90deg,transparent 0 12px,rgba(205,73,86,.42) 12px 13px,transparent 13px),repeating-linear-gradient(to bottom,transparent 0 15px,rgba(92,142,178,.24) 15px 16px);color:#2e2926}
      #studioApp .weekly-mood-card[data-mood-style="widget"]{border:1px solid rgba(var(--aura-rgb,216,95,109),.24);border-radius:var(--widget-radius,16px);background:var(--widget-bg,rgba(250,247,241,.84));color:var(--widget-ink,#171717);box-shadow:0 7px 18px rgba(var(--aura-rgb,216,95,109),.13)}
      #studioApp .weekly-mood-card[data-mood-style="qwiky-note"]{position:relative;border:1px solid #dec665;border-radius:2px 2px 12px 2px;background:linear-gradient(145deg,#fff8b5 0,#f6df72 78%,#dfc455 100%);color:#372f28;box-shadow:2px 3px 0 rgba(72,56,36,.12);transform:rotate(-1deg)}
      #studioApp .weekly-mood-card[data-mood-style="qwiky-note"]::after{content:"";position:absolute;right:0;bottom:0;width:15px;height:15px;background:linear-gradient(135deg,rgba(255,255,255,.1) 0 49%,#c6a944 50% 100%);clip-path:polygon(100% 0,100% 100%,0 100%)}

      /* Sidebar and account actions stay legible in both appearance modes. */
      #studioApp .profile-card .real-rank strong,body.night-mode #studioApp .profile-card .real-rank strong{color:#211e1c!important;-webkit-text-fill-color:#211e1c!important;text-shadow:none!important}
      #studioApp #studioSignOut .studio-logout-icon{filter:brightness(0)!important}
      body.night-mode #studioApp #studioSignOut .studio-logout-icon{filter:brightness(0) invert(1)!important}
      body.night-mode #studioApp .sidebar,body.night-mode #studioApp .sidebar button,body.night-mode #studioApp .sidebar a{color:#f4eee8!important}
      body.night-mode #studioApp .sidebar .sidebar-route-icon>img,body.night-mode #studioApp .sidebar .sidebar-route-icon img,body.night-mode #studioApp .sidebar .studio-symbol-image,body.night-mode #studioApp .sidebar .studio-symbol-source,body.night-mode #studioApp .sidebar-theme-btn img{filter:brightness(0) invert(1)!important}
      body.night-mode #studioApp .card h2,body.night-mode #studioApp .card h3{font-family:Georgia,"Times New Roman",serif!important;font-synthesis:none!important;text-shadow:none!important}
      body.night-mode #studioLogsDialog .studio-mail-tabs button{background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.13)}
      body.night-mode #studioLogsDialog .studio-mail-tabs button[aria-selected="true"]{background:rgb(var(--aura-rgb,216,95,109))}
      body.night-mode #studioLogsDialog .studio-message-pane input,body.night-mode #studioLogsDialog .studio-message-pane textarea{background:#302c2a;border-color:#514a45;color:#f5eee7}

      @media(max-width:1020px){#studioApp .hero{grid-template-columns:minmax(0,1fr) 284px!important;padding-left:16px!important;padding-right:16px!important}}
      @media(max-width:900px){#studioApp .hero{grid-template-columns:1fr!important;grid-template-rows:auto auto auto!important;padding:62px 12px 34px!important}#studioApp .hero>.profile-card{grid-column:1!important;grid-row:1!important}#studioApp .hero-widget-rail{grid-column:1!important;grid-row:2!important;grid-template-columns:repeat(3,minmax(0,1fr))!important}#studioApp .hero>.hero-action-bar{grid-column:1!important;grid-row:3!important}#studioApp .hero-widget-rail>.music-card,#studioApp .hero-widget-rail>.aura-card,#studioApp .hero-widget-rail>.guest-check-card{min-height:132px!important}}
      @media(max-width:700px){#studioApp .hero-widget-rail{grid-template-columns:1fr!important}#studioApp .hero-widget-rail>.music-card,#studioApp .hero-widget-rail>.aura-card,#studioApp .hero-widget-rail>.guest-check-card{height:auto!important;min-height:150px!important;max-height:none!important}#studioApp:not(.profile-editor-wallpaper) .hero>.profile-card:not(.profile-is-editing){height:auto!important;min-height:286px!important;max-height:none!important;grid-template-columns:120px minmax(0,1fr)!important}#studioApp:not(.profile-editor-wallpaper) .profile-card:not(.profile-is-editing) .real-rank{left:18px!important;right:18px!important}#studioApp .profile-card.profile-is-editing{grid-template-columns:1fr!important;min-height:0!important;overflow:hidden!important}#studioApp .profile-card.profile-is-editing .profile-identity-rail{grid-column:1!important;grid-row:1!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:flex-start!important;gap:9px!important;padding:14px!important;border-right:0!important;border-bottom:1px solid rgba(62,50,45,.12)!important}#studioApp .profile-card.profile-is-editing #wallpaperPanel.profile-inline-editor{grid-column:1!important;grid-row:2!important;padding:18px 16px 22px!important}#studioApp .profile-card.profile-is-editing .profile-editor-actions{grid-template-columns:1fr 1fr!important}#studioApp .profile-card.profile-is-editing .profile-update-privacy{grid-column:1/-1!important}#studioApp .profile-card.profile-is-editing .profile-editor-actions button{width:100%!important;min-width:0!important}#guestCheckDialog .guest-gift-picker{grid-template-columns:repeat(5,minmax(38px,1fr))}}
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

  function syncGuestPermissions(card=$('#guestCheckWidget')){
    const own=viewingOwnProfile();
    if(card){
      card.dataset.profileRelationship=own?'self':'visitor';
      const publicAction=$('.visitor-log-actions [data-open-guest="check"]',card);
      if(publicAction){
        publicAction.textContent=own?'View check-ins':'Say you wuz here';
        publicAction.setAttribute('aria-label',own?'View Guest Check entries on your profile':'Leave a Guest Check entry on this profile');
      }
    }
    const dialog=$('#guestCheckDialog');
    if(!dialog)return own;
    const publicTab=$('[data-visitor-tab="public"]',dialog),form=$('#visitorPublicForm',dialog),ownState=$('#visitorOwnProfileState',dialog);
    if(publicTab)publicTab.textContent=own?'Public notes':'Public note';
    if(form)form.hidden=own;
    if(ownState)ownState.hidden=!own;
    dialog.dataset.profileRelationship=own?'self':'visitor';
    return own;
  }

  function ensureGuestCheck(){
    const app=$('#studioApp'),hero=$('.hero',app);if(!app||!hero)return null;
    let card=$('#guestCheckWidget',app);
    if(!card){
      card=document.createElement('section');
      card.id='guestCheckWidget';card.className='guest-check-card glass small-card customizable-widget';
      card.dataset.widgetId='guest-check';card.dataset.widgetLabel='Guest Check';card.dataset.widgetRoute='guest-check';
      card.innerHTML='<div class="guest-check-sheet"><div class="guest-check-sheet-head"><span>GUEST BOOK</span><time></time></div><div class="visitor-log-intro"><div><strong>Who wuz here?</strong><span>Visitors can leave an affirmation and a little gift.</span></div></div><div class="guest-check-lines" aria-label="Recent Guest Check signatures"><div class="guest-check-lines-track"></div></div><div class="visitor-log-actions"><button type="button" data-open-guest="check">View check-ins</button></div><div class="visitor-log-count" aria-live="polite"></div></div>';
    }
    $(':scope > .card-kicker',card)?.remove();
    $('[data-open-guest="direct"]',card)?.remove();
    $('.mailbox-mark',card)?.remove();
    if(!$('.guest-check-lines',card)){$('.visitor-log-actions',card)?.insertAdjacentHTML('beforebegin','<div class="guest-check-lines" aria-label="Recent Guest Check signatures"><div class="guest-check-lines-track"></div></div>')}
    const guestDate=$('.guest-check-sheet-head time',card);if(guestDate)guestDate.textContent=new Date().toLocaleDateString(undefined,{month:'short',day:'numeric'});
    syncGuestPermissions(card);
    updateGuestCount(card);
    return card;
  }

  function ensureHeroRail(){
    const app=$('#studioApp'),hero=$('.hero',app);if(!app||!hero)return;
    let rail=$('#heroWidgetRail',hero);
    if(!rail){rail=document.createElement('aside');rail.id='heroWidgetRail';rail.className='hero-widget-rail';rail.setAttribute('aria-label','Studio profile widgets');const profile=$('.profile-card',hero);profile?.insertAdjacentElement('afterend',rail)}
    const guest=ensureGuestCheck();
    const cards=[$('.aura-card',app),$('.music-card',app),guest].filter(Boolean);
    cards.forEach(card=>{if(card.parentNode!==rail)rail.appendChild(card)});
    restoreOrder(rail);
  }

  function widgetLabel(widget){return widget.dataset.widgetLabel||$('.card-kicker,h2,h1',widget)?.textContent?.trim()||'widget'}

  function greenControl(widget){
    const id=widget.dataset.widgetId||widget.id||'widget',route=widget.dataset.widgetRoute||$('.arrow-btn[data-open]',widget)?.dataset.open||id;
    if(route==='guest-check'||id==='guest-check')return {attribute:'data-open-guest="check"',label:'Open Guest Check'};
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
    const titleInput=$('#studioTrackTitle'),artistInput=$('#studioTrackArtist');if(titleInput)titleInput.value=record.title||record.fileName?.replace(/\.[^.]+$/,'')||'Your track';if(artistInput)artistInput.value=record.artist||'Add artist';
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
    $('#studioTrackTitle',editor).value=title?.textContent||'Your track';$('#studioTrackArtist',editor).value=artist?.textContent||'Add artist';
    const profileMount=$('#profileSongEditorMount');if(profileMount)profileMount.append(actions,editor,status);
    restoreMusic();
  }

  function readGuestChecks(){
    try{
      const saved=JSON.parse(localStorage.getItem(GUEST_KEY)||'null');
      if(Array.isArray(saved))return saved;
      const legacy=JSON.parse(localStorage.getItem(LEGACY_NOTE_KEY)||'[]');
      return Array.isArray(legacy)?legacy.map(note=>({name:note.name||'',affirmation:note.message||'',gift:'💐',createdAt:note.createdAt||Date.now(),visibility:'device-preview'})):[];
    }catch{return[]}
  }
  function renderGuestCheckWidgetLines(card=$('#guestCheckWidget')){
    if(!card)return;
    const viewport=$('.guest-check-lines',card),track=$('.guest-check-lines-track',card);if(!viewport||!track)return;
    const entries=readGuestChecks().slice(-6).reverse(),scrolling=entries.length>2;
    const sequence=entries.length?(scrolling?entries.concat(entries):entries):[{name:'',affirmation:'open for the next signature…',gift:'',placeholder:true}];
    track.replaceChildren(...sequence.map(entry=>{
      const line=document.createElement('div');line.className='guest-check-line'+(entry.placeholder?' is-placeholder':'');
      if(entry.placeholder){line.textContent=entry.affirmation;return line}
      const copy=document.createElement('span');copy.className='guest-check-entry';copy.append(document.createTextNode(`${entry.name||'Anonymous'} wuz here ${entry.gift||''}`.trim()));
      if(entry.affirmation){const note=document.createElement('em');note.textContent=' · '+entry.affirmation;copy.appendChild(note)}
      const date=document.createElement('time');date.className='guest-check-date';date.dateTime=new Date(entry.createdAt||Date.now()).toISOString();date.textContent=new Date(entry.createdAt||Date.now()).toLocaleDateString(undefined,{month:'short',day:'numeric'});
      line.append(copy,date);
      return line;
    }));
    viewport.classList.toggle('is-filled',scrolling);
  }
  function updateGuestCount(card=$('#guestCheckWidget')){if(!card)return;const count=readGuestChecks().length,status=$('.visitor-log-count',card);if(status)status.textContent=count?`${count} guest check${count===1?'':'s'} saved in this browser`:(viewingOwnProfile()?'Guest book ready · only visitors can sign':'Be the first to say you wuz here');renderGuestCheckWidgetLines(card)}

  function renderGuestChecks(){
    const list=$('#visitorNoteList');if(!list)return;list.innerHTML='';
    const checks=readGuestChecks().slice(-12).reverse();
    if(!checks.length){const empty=document.createElement('div');empty.className='visitor-note-item';empty.textContent='No one has checked in yet.';list.appendChild(empty);return}
    checks.forEach(entry=>{const item=document.createElement('div');item.className='visitor-note-item';const title=document.createElement('div');title.textContent=`${entry.name||'Anonymous'} wuz here ${entry.gift||''}`.trim();item.appendChild(title);if(entry.affirmation){const affirmation=document.createElement('div');affirmation.textContent=entry.affirmation;item.appendChild(affirmation)}const meta=document.createElement('small');meta.textContent=new Date(entry.createdAt).toLocaleString();item.appendChild(meta);list.appendChild(item)});
  }

  async function getDraftKey(){
    let record=await dbGet('private-draft-key');if(record?.key)return record.key;
    const key=await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']);await dbPut({id:'private-draft-key',key,createdAt:Date.now()});return key;
  }

  async function saveEncryptedDraft(to,message){
    const key=await getDraftKey(),iv=crypto.getRandomValues(new Uint8Array(12)),payload=new TextEncoder().encode(JSON.stringify({to,message,createdAt:Date.now()}));
    const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,payload);await dbPut({id:'private-draft',iv,ciphertext,updatedAt:Date.now()});
  }

  function ensureGuestDialog(){
    let dialog=$('#guestCheckDialog');if(dialog)return dialog;
    const gifts=['💐','❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','🩷','🩵','🩶','✌🏽','💸','😻'];
    const giftOptions=gifts.map((gift,index)=>`<label><input type="radio" name="guestGift" value="${gift}" ${index===0?'checked':''}><span title="${gift}" aria-label="${gift}">${gift}</span></label>`).join('');
    dialog=document.createElement('dialog');dialog.id='guestCheckDialog';dialog.innerHTML='<div class="visitor-dialog-head"><div><h2>Guest Check</h2><p>Leave a little proof that you passed through.</p></div><button class="visitor-dialog-close" type="button" aria-label="Close">×</button></div><section class="visitor-dialog-pane" id="visitorPublicPane" data-visitor-pane="public"><p class="visitor-own-profile-state" id="visitorOwnProfileState" hidden>This is your profile. You can read Guest Check entries here, but only visitors can leave one.</p><form id="visitorPublicForm"><label>Name<input id="visitorNoteName" maxlength="60" autocomplete="name" placeholder="Your name"></label><label>Affirmation<textarea id="visitorNoteText" rows="3" maxlength="280" placeholder="Leave something kind…" required></textarea></label><div class="guest-gift-label">Add a gift</div><div class="guest-gift-picker" role="radiogroup" aria-label="Choose a Guest Check gift">'+giftOptions+'</div><button class="visitor-dialog-primary" type="submit">Say I wuz here</button><p class="visitor-form-note">Guest Check entries stay in this browser until public profiles and moderation are connected.</p><p class="visitor-form-status" id="visitorPublicStatus" role="status" aria-live="polite"></p></form><div class="visitor-note-list" id="visitorNoteList"></div></section>';
    document.body.appendChild(dialog);
    const showTab=key=>{$$('[data-visitor-tab]',dialog).forEach(tab=>tab.setAttribute('aria-selected',tab.dataset.visitorTab===key?'true':'false'));$$('[data-visitor-pane]',dialog).forEach(pane=>pane.hidden=pane.dataset.visitorPane!==key)};
    dialog.addEventListener('click',event=>{const tab=event.target.closest('[data-visitor-tab]');if(tab)showTab(tab.dataset.visitorTab);if(event.target===dialog||event.target.closest('.visitor-dialog-close'))dialog.close()});
    $('#visitorPublicForm',dialog).addEventListener('submit',event=>{event.preventDefault();if(viewingOwnProfile()){syncGuestPermissions();$('#visitorPublicStatus',dialog).textContent='You cannot sign Guest Check on your own profile.';return}const affirmation=$('#visitorNoteText',dialog).value.trim();if(!affirmation)return;const gift=$('input[name="guestGift"]:checked',dialog)?.value||'💐',checks=readGuestChecks();checks.push({name:$('#visitorNoteName',dialog).value.trim(),affirmation,gift,createdAt:Date.now(),visibility:'device-preview'});try{localStorage.setItem(GUEST_KEY,JSON.stringify(checks.slice(-50)))}catch{}$('#visitorNoteText',dialog).value='';$('#visitorPublicStatus',dialog).textContent='Your Guest Check is saved on this device.';renderGuestChecks();updateGuestCount()});
    dialog._showVisitorTab=showTab;syncGuestPermissions();showTab('public');renderGuestChecks();return dialog;
  }

  function openGuestDialog(){
    const dialog=ensureGuestDialog();syncGuestPermissions();dialog._showVisitorTab?.('public');renderGuestChecks();if(dialog.showModal&&!dialog.open)dialog.showModal();else dialog.setAttribute('open','');
  }

  function bindGuestActions(){
    const app=$('#studioApp');if(!app||app.dataset.guestActions==='1')return;app.dataset.guestActions='1';
    app.addEventListener('click',event=>{const button=event.target.closest('[data-open-guest]');if(!button)return;event.preventDefault();openGuestDialog()});
  }

  function readActivity(){try{const items=JSON.parse(localStorage.getItem(ACTIVITY_KEY)||'[]');return Array.isArray(items)?items:[]}catch{return[]}}
  function updateLogsDot(){
    const button=$('#studioNotificationsBtn');if(!button)return;const dot=$('.notif-dot',button);if(!dot)return;
    let readAt=0;try{readAt=Number(localStorage.getItem(ACTIVITY_READ_KEY)||0)}catch{}
    dot.hidden=!readActivity().some(item=>Number(item.createdAt)>readAt);
  }
  function recordActivity(detail={}){
    const title=String(detail.title||detail.label||'Studio updated').trim()||'Studio updated';
    const item={title,source:String(detail.source||'Studio'),detail:String(detail.detail||''),notified:detail.notified!==false,createdAt:Number(detail.createdAt)||Date.now()};
    const items=readActivity();items.push(item);try{localStorage.setItem(ACTIVITY_KEY,JSON.stringify(items.slice(-100)))}catch{}
    updateLogsDot();return item;
  }
  function renderLogs(){
    const list=$('#studioLogList');if(!list)return;const items=readActivity().slice().reverse();list.innerHTML='';
    if(!items.length){const empty=document.createElement('div');empty.className='studio-log-empty';empty.textContent='No Studio updates yet. Changes you save in widget pages will appear here.';list.appendChild(empty);return}
    items.forEach(entry=>{const row=document.createElement('article');row.className='studio-log-item'+(entry.notified?'':' is-private');const dot=document.createElement('i');dot.className='studio-log-dot';dot.setAttribute('aria-hidden','true');const copy=document.createElement('div');const title=document.createElement('strong');title.textContent=entry.title;const meta=document.createElement('span');meta.textContent=`${entry.source} · ${entry.notified?'Followers & connections notified':'Not shared with followers/connections'}${entry.detail?' · '+entry.detail:''}`;const time=document.createElement('time');time.dateTime=new Date(entry.createdAt).toISOString();time.textContent=new Date(entry.createdAt).toLocaleString();copy.append(title,meta);row.append(dot,copy,time);list.appendChild(row)});
  }
  function ensureLogsDialog(){
    let dialog=$('#studioLogsDialog');if(dialog)return dialog;
    dialog=document.createElement('dialog');dialog.id='studioLogsDialog';dialog.innerHTML='<div class="visitor-dialog-head"><div><h2>Logs</h2><p>Studio updates and private messages share this mail path.</p></div><button class="visitor-dialog-close" type="button" aria-label="Close Logs">×</button></div><div class="studio-mail-tabs" role="tablist"><button type="button" role="tab" data-studio-mail-tab="updates">Updates</button><button type="button" role="tab" data-studio-mail-tab="messages">Messages</button></div><section class="studio-mail-pane" data-studio-mail-pane="updates"><div class="studio-log-list" id="studioLogList"></div></section><section class="studio-mail-pane studio-message-pane" data-studio-mail-pane="messages" hidden><form id="studioMessageForm"><label>To<input id="studioMessageTo" maxlength="60" placeholder="@username" required></label><label>Message<textarea id="studioMessageText" rows="5" maxlength="2000" required></textarea></label><button type="submit">Save encrypted draft</button><p class="studio-message-status" id="studioMessageStatus" role="status" aria-live="polite"></p></form></section>';
    document.body.appendChild(dialog);
    const showTab=key=>{$$('[data-studio-mail-tab]',dialog).forEach(tab=>tab.setAttribute('aria-selected',tab.dataset.studioMailTab===key?'true':'false'));$$('[data-studio-mail-pane]',dialog).forEach(pane=>{pane.hidden=pane.dataset.studioMailPane!==key})};
    dialog.addEventListener('click',event=>{const tab=event.target.closest('[data-studio-mail-tab]');if(tab)showTab(tab.dataset.studioMailTab);if(event.target===dialog||event.target.closest('.visitor-dialog-close'))dialog.close()});
    $('#studioMessageForm',dialog)?.addEventListener('submit',async event=>{event.preventDefault();const to=$('#studioMessageTo',dialog).value.trim(),message=$('#studioMessageText',dialog).value.trim(),status=$('#studioMessageStatus',dialog);if(!to||!message)return;status.textContent='Encrypting draft on this device…';try{await saveEncryptedDraft(to,message);$('#studioMessageText',dialog).value='';status.textContent='Encrypted draft saved on this device. It has not been sent.'}catch{status.textContent='Encrypted draft storage is unavailable in this browser.'}});
    dialog._showStudioMailTab=showTab;showTab('updates');return dialog;
  }
  function openLogs(){
    const dialog=ensureLogsDialog();dialog._showStudioMailTab?.('updates');renderLogs();try{localStorage.setItem(ACTIVITY_READ_KEY,String(Date.now()))}catch{}updateLogsDot();if(dialog.showModal&&!dialog.open)dialog.showModal();else dialog.setAttribute('open','');
  }
  function bindActivity(){
    if(document.body.dataset.biglwaActivityBound==='1')return;document.body.dataset.biglwaActivityBound='1';
    window.BIGLWAActivity={record:recordActivity,open:openLogs,read:readActivity};
    window.addEventListener('biglwa:studio-update',event=>recordActivity(event.detail||{}));
    updateLogsDot();
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
    $('#guestCheckWidget .mailbox-mark',app)?.remove();
  }

  function currentProfileUsername(){
    try{const saved=JSON.parse(localStorage.getItem('biglwaProfileDetails')||'null');if(saved?.username)return '@'+String(saved.username).replace(/^@/,'')}catch{}
    const handle=$('#studioApp .profile-name-line h1')?.textContent?.trim();return handle||'@username';
  }

  function ensureDiaryCover(){
    const page=$('#studioApp #diary .diary-page');if(!page)return;
    let label=$('.diary-cover-label',page);
    if(!label){label=document.createElement('span');label.className='diary-cover-label';label.setAttribute('aria-hidden','true');label.innerHTML='<strong>Diary</strong><span></span>';page.appendChild(label)}
    const owner=$('span',label);if(owner)owner.textContent='Property of: '+currentProfileUsername();
  }

  function ensureArcadeCabinet(){
    const cabinet=$('#studioApp #games .games-library');if(!cabinet)return;
    const brand=$('.games-arcade-brand',cabinet),logos=brand?$$('img',brand):[];
    if(logos[1]){logos[1].src='/assets/arcade-wordmark.png?v=20260916-arcade-mask-1';logos[1].alt='ARCADE'}
    let controls=$('.arcade-control-deck',cabinet);
    if(!controls){
      controls=document.createElement('div');controls.className='arcade-control-deck';controls.setAttribute('aria-hidden','true');
      controls.innerHTML='<span class="arcade-joystick is-yellow"><i></i></span><span class="arcade-joystick is-red"><i></i></span><span class="arcade-joystick is-green"><i></i></span>';
      cabinet.appendChild(controls);
    }
  }

  function bindProfileVisualSync(){
    if(document.body.dataset.biglwaProfileVisualSync==='1')return;document.body.dataset.biglwaProfileVisualSync='1';
    window.addEventListener('biglwa:studio-update',event=>{if(event.detail?.source==='Profile')ensureDiaryCover();updateGuestCount()});
  }

  function ensureGamesPreviewPicker(){
    const app=$('#studioApp'),quiz=$('#games .quiz',app);
    if(!app||!quiz)return;
    $('#gamesPreviewPicker',quiz)?.remove();
    $$('.games-external-preview',quiz).forEach(preview=>preview.remove());
    quiz.classList.remove('games-preview-external');
    return;
    const library=[
      {id:'culture-quiz',name:'Culture Quiz',kind:'native',description:'Play the BIG LWA culture quiz on this page.'},
      {id:'run-3',name:'Run 3',kind:'external',description:'The endless runner from Coolmath Games.',url:'https://www.coolmathgames.com/0-run-3',source:'Coolmath Games'},
      {id:'fnaf',name:"Five Nights at Freddy's",kind:'external',description:'Official game listing for the FNAF series.',url:'https://store.steampowered.com/app/319510/Five_Nights_at_Freddys/',source:'Steam'},
      {id:'biglwa-arcade',name:'BIG LWA Arcade',kind:'hosted',description:'HTML5 games owned by or licensed to BIG LWA can live here.',source:'BIG LWA library'}
    ];
    let picker=$('#gamesPreviewPicker',quiz);
    if(!picker){
      picker=document.createElement('div');
      picker.id='gamesPreviewPicker';
      picker.className='games-preview-picker';
      picker.innerHTML='<label><span>Game preview</span><select id="gamesPreviewSelect" aria-label="Choose game preview"></select></label><span class="games-preview-library-note">Choose what visitors see in this card.</span>';
      quiz.insertAdjacentElement('afterbegin',picker);
    }
    const select=$('#gamesPreviewSelect',picker);
    if(!select)return;
    if(select.options.length!==library.length){
      select.replaceChildren(...library.map(game=>{
        const option=document.createElement('option');
        option.value=game.id;option.textContent=game.name;return option;
      }));
    }
    let external=$('#gamesExternalPreview',quiz);
    if(!external){
      external=document.createElement('div');
      external.id='gamesExternalPreview';
      external.className='games-external-preview';
      quiz.appendChild(external);
    }
    const image=$('.games-block-mark',quiz);
    const render=id=>{
      const game=library.find(item=>item.id===id)||library[0],native=game.kind==='native';
      if(image)image.hidden=!native;
      external.hidden=native;
      [...quiz.children].forEach(child=>{
        if(child!==picker&&child!==image&&child!==external)child.hidden=!native;
      });
      quiz.classList.toggle('games-preview-external',!native);
      if(native)return;
      external.replaceChildren();
      const kicker=document.createElement('span');kicker.className='games-preview-kicker';kicker.textContent=game.kind==='hosted'?'BIG LWA LIBRARY':'OFFICIAL LINK';
      const title=document.createElement('h3');title.textContent=game.name;
      const description=document.createElement('p');description.textContent=game.description;
      external.append(kicker,title,description);
      if(game.url){
        const link=document.createElement('a');link.href=game.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Open on '+game.source+' ↗';external.appendChild(link);
      }else{
        const note=document.createElement('span');note.className='games-preview-coming-soon';note.textContent='Ready for owned or licensed HTML5 games.';external.appendChild(note);
      }
    };
    if(select.dataset.gamesPreviewBound!=='1'){
      select.dataset.gamesPreviewBound='1';
      select.addEventListener('change',()=>{
        try{localStorage.setItem('biglwaGamesPreview',select.value)}catch{}
        render(select.value);
      });
    }
    let saved='';
    try{saved=localStorage.getItem('biglwaGamesPreview')||''}catch{}
    if(library.some(game=>game.id===saved))select.value=saved;
    render(select.value||'culture-quiz');
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

  function ensureCardHeadingRows(){
    const app=$('#studioApp');if(!app)return;
    [['#closet','#closet .card-icon','#closet h2'],['#diary','#diary .card-icon','#diary h2'],['#projects','#projects .card-icon','#projects h2'],['#games','#games .card-icon','#games h2']].forEach(([cardSel,iconSel,titleSel])=>{
      const card=$(cardSel,app),icon=$(iconSel,app),title=$(titleSel,app);if(!card||!icon||!title||icon.contains(title)||title.contains(icon))return;
      let row=$('.biglwa-card-heading-row',card);
      if(!row){
        if(icon.parentElement!==title.parentElement)return;
        row=document.createElement('div');row.className='biglwa-card-heading-row';icon.parentElement.insertBefore(row,icon);
      }
      if(icon.parentElement!==row)row.appendChild(icon);
      if(title.parentElement!==row)row.appendChild(title);
    });
  }

  function ensureThemeAndMailboxIcons(){
    const light=$('#lightModeBtn'),dark=$('#darkModeBtn');
    const ensureThemeImage=(button,src,label)=>{if(!button)return;let image=$('img',button);if(!image){image=document.createElement('img');button.replaceChildren(image)}image.src=src;image.alt='';image.setAttribute('aria-hidden','true');button.title=label;button.setAttribute('aria-label',label);$('.biglwa-theme-icon',button)?.remove()};
    ensureThemeImage(light,'/assets/login-sun-mask.png?v=20260913-theme-symbols-4','Light mode');
    ensureThemeImage(dark,'/assets/login-moon-mask.png?v=20260913-theme-symbols-4','Dark mode');
    const app=$('#studioApp'),signOut=$('#studioSignOut',app),candidate=$('#studioNotificationsBtn',app)||$('.top-actions .icon-btn[aria-label="Notifications"]',app)||$('.top-actions .icon-btn:not(#studioSignOut)',app);if(!candidate)return;
    if(signOut){signOut.setAttribute('aria-label','Sign out');signOut.title='Sign out';signOut.innerHTML=STUDIO_ICONS.logout}
    candidate.id='studioNotificationsBtn';candidate.type='button';candidate.setAttribute('aria-label','Open Logs');candidate.title='Logs';
    candidate.innerHTML=STUDIO_ICONS.mail+'<span class="notif-dot"></span>';
    if(candidate.dataset.logsBound!=='1'){candidate.dataset.logsBound='1';candidate.addEventListener('click',openLogs)}
    updateLogsDot();
  }

  function dockMusicControlsInProfile(){
    const mount=$('#profileSongEditorMount'),actions=$('#studioApp .music-file-actions'),editor=$('#studioMusicMetaEditor'),status=$('#studioMusicStatus');
    if(mount&&actions&&editor&&status)mount.append(actions,editor,status);
  }

  function removeSpotify(){
    $$('[data-orbit-app="spotify"]').forEach(item=>item.remove());
    $$('[data-orbit-save="spotify"],[data-orbit-open="spotify"],[data-orbit-path="spotify"],[data-orbit-auth="spotify"]').forEach(item=>item.closest('.module-orbit-row')?.remove());
  }

  function run(){ensureStyles();ensureHeroRail();ensureControls();bindDragging();upgradeMusic();dockMusicControlsInProfile();bindGuestActions();bindActivity();ensureDirectoryIcons();ensureDiaryCover();ensureArcadeCabinet();bindProfileVisualSync();ensureCardHeadingRows();ensureGamesPreviewPicker();bindWidgetSettingsActions();ensureThemeAndMailboxIcons();removeSpotify()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
  window.addEventListener('load',()=>setTimeout(run,0),{once:true});
  window.addEventListener('pagehide',revokeMusicUrls,{once:true});
  setTimeout(run,260);setTimeout(run,900);
})();
