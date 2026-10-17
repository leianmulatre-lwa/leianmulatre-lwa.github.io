(() => {
  if (window.__biglwaModulePagesReadyV3) return;
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const main = $('.main');
  if (!main) {
    // The Studio shell can mount after this script. Retry without marking the module ready.
    if (!window.__biglwaModulePagesWaitingForMain) {
      window.__biglwaModulePagesWaitingForMain = true;
      let attempts = 0;
      const wait = setInterval(() => {
        if (!document.querySelector('.main') && attempts++ < 90) return;
        clearInterval(wait);
        window.__biglwaModulePagesWaitingForMain = false;
        if (!document.querySelector('.main') || window.__biglwaModulePagesReadyV3) return;
        const script = document.createElement('script');
        script.src = '/module-pages.js?v=20261015-provider-setup-9';
        document.head.appendChild(script);
      }, 250);
    }
    return;
  }
  window.__biglwaModulePagesReadyV3 = true;

  const style = document.createElement('style');
  style.id = 'biglwa-module-pages-style-v3';
  style.textContent = `
  /* politc: user-supplied Nyame Baatanpa Studio symbol */
  #studioApp #politc .politc-studio-symbol{display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;flex-shrink:0}
  #studioApp #politc .politc-studio-symbol img{display:block;width:34px;height:34px;object-fit:contain}
  #moduleWorkspace[data-module-key="politc"] .module-heading h1:before{
    content:"";display:inline-block;width:37px;height:37px;vertical-align:-8px;margin-right:12px;
    background:url("/assets/politc-nyame-baatanpa.svg?v=20261014-1") center/contain no-repeat
  }
  body.night-mode #moduleWorkspace[data-module-key="politc"] .module-heading h1:before{filter:invert(1)}

  body.night-mode #studioApp #politc .politc-studio-symbol img{filter:invert(1)}
  /* politc: monochrome wanted-board editorial styling */
  .politc-board{--poster:#efe3cd;--ink:#28231e;display:grid;gap:18px}
  .politc-board .politc-banner{background:#332a24;color:#f4e8d3;padding:24px;border:4px double #d3b992;letter-spacing:.09em;text-align:center}
  .politc-banner h2{font:400 clamp(38px,6vw,74px)/1 "Bergamot Stitched",Georgia,serif;text-transform:lowercase;margin:5px 0}
  .politc-banner p{margin:0;font:12px/1.5 system-ui;letter-spacing:.08em;text-transform:uppercase}
  .politc-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
  .politc-panel{background:var(--poster);color:var(--ink);border:2px solid #534739;outline:1px solid #a8977e;outline-offset:-7px;padding:19px;min-width:0}
  .politc-panel h3{font:700 clamp(24px,3vw,40px)/1 Georgia,serif;letter-spacing:.085em;text-transform:uppercase;text-align:center;border-top:4px double #554637;border-bottom:4px double #554637;padding:10px 0;margin:0}
  .politc-panel .politc-sub{text-align:center;font:italic 13px/1.5 Georgia,serif}
  .politc-portraits{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px;margin:17px 0}
  .politc-person{border:1px solid #776554;background:#fbf5e8;padding:8px;text-align:center;min-width:0}
  .politc-person img{width:100%;height:150px;object-fit:cover;filter:grayscale(1) contrast(1.15);display:block;background:#d4cdc2}
  .politc-person strong{display:block;font:700 17px/1.2 Georgia,serif;overflow-wrap:anywhere;margin-top:8px}
  .politc-person small{display:block;font:12px/1.45 Georgia,serif;margin:4px 0}
  .politc-person button{border:1px solid #776554;background:transparent;color:inherit;padding:5px;cursor:pointer}
  .politc-form{display:grid;gap:8px}.politc-form input,.politc-form textarea,.politc-form select{min-width:0;width:100%;box-sizing:border-box;border:1px solid #776554;background:#fff9ec;color:#272321;padding:9px;font:13px system-ui}
  .politc-form button,.politc-source{display:inline-block;border:1px solid #493f33;padding:10px 12px;background:#342b25;color:#fff0d7;cursor:pointer;font:600 12px system-ui;text-decoration:none}
  .politc-form label{font:600 12px system-ui}
  .politc-resources{display:grid;grid-template-columns:repeat(auto-fit,minmax(175px,1fr));gap:10px;margin-top:15px}
  .politc-source{display:flex;flex-direction:column;gap:5px}.politc-source small{font-weight:400;color:#e9d7b9}
  .politc-pendulum{width:100%;accent-color:#583e35}
  .politc-value{font:600 14px system-ui;text-align:center;padding:12px;border:1px dashed #8d7b69}
  .politc-note{font:12px/1.5 system-ui;opacity:.85}
  @media(max-width:720px){.politc-grid{grid-template-columns:1fr}}


    .module-textarea.diary-lined{font:16px/28px Georgia,serif;min-height:360px;padding:14px 20px;background-color:#f5ecdf;background-image:repeating-linear-gradient(to bottom,transparent 0,transparent 27px,#bcc3c5 27px,#bcc3c5 28px);background-origin:content-box;background-attachment:local;color:#302b28}.night-mode .module-textarea.diary-lined{background-color:#302c28;background-image:repeating-linear-gradient(to bottom,transparent 0,transparent 27px,#59544e 27px,#59544e 28px);color:#f5ecdf}
    .module-workspace[hidden]{display:none!important}
    #studioApp #boards .studio-pinterest-board-preview{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;margin:9px 0;overflow:hidden;border-radius:12px;min-height:128px}
    #studioApp #boards .studio-pinterest-board-preview button{display:block;min-width:0;height:94px;padding:0;border:0;border-radius:6px;overflow:hidden;background:#dfc9c2;box-shadow:1px 2px 0 #dc2344;cursor:pointer}
    #studioApp #boards .studio-pinterest-board-preview img{display:block;width:100%;height:100%;object-fit:cover}
    #studioApp #boards .studio-pinterest-empty{grid-column:1/-1;padding:21px 10px;font:600 12px/1.5 system-ui;color:#806d63;text-align:center}
    #studioApp #boards.has-live-pinterest-preview .studio-pinterest-board-preview{grid-template-columns:repeat(3,minmax(0,1fr));grid-template-rows:repeat(2,91px);gap:5px;max-height:187px;min-height:0;align-content:start}
    #studioApp #boards.has-live-pinterest-preview .studio-pinterest-board-preview button{height:91px!important;overflow:hidden!important}
    #studioApp #boards.has-live-pinterest-preview .studio-pinterest-board-preview button:nth-child(n+7){display:none!important}
    #studioApp #feed #biglwaFeedHero .biglwa-feed-hero-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;grid-template-rows:minmax(0,1fr)!important;gap:7px!important;overflow:hidden!important}
    #studioApp #feed #biglwaFeedHero .biglwa-feed-hero-row{display:contents!important}
    #studioApp #feed #biglwaFeedHero .biglwa-feed-hero-grid>a,
    #studioApp #feed #biglwaFeedHero .biglwa-feed-hero-grid>.biglwa-feed-hero-empty{min-width:0;aspect-ratio:1/1;overflow:hidden}
    #studioApp #feed #biglwaFeedHero .biglwa-feed-hero-grid img{display:block;width:100%;height:100%;object-fit:cover}

    #studioApp #boards.has-live-pinterest-preview .studio-pinterest-board-preview img{width:100%!important;height:100%!important;object-fit:cover!important}
    #studioApp #boards.has-live-pinterest-preview .studio-pinterest-board-preview+.card-cta{margin-top:13px}


    #studioApp #map .studio-map-preview-slot{width:100%;min-width:0;overflow:hidden;padding:0;display:block}
    #studioApp #map .studio-mini-map{display:block;width:100%;height:205px!important;min-height:205px;border:1px solid #a2b7ac;border-radius:14px;background:#d9e8dc;box-shadow:2px 3px 0 #9fae9b;overflow:hidden}
    #studioApp #map .studio-mini-map-caption{font:650 11px/1.4 system-ui,sans-serif;padding:5px 2px 1px;color:#6d736b}
    #studioApp #map .studio-mini-map-caption .studio-mini-map-open{display:inline-flex;padding:2px 5px;border:0;border-radius:5px;background:transparent;color:#8b3642;font:750 11px/1.3 system-ui,sans-serif;text-decoration:underline;text-underline-offset:2px;cursor:pointer}
    #studioApp #map .studio-mini-map-caption .studio-mini-map-open:focus-visible{outline:2px solid #9f3546;outline-offset:2px}
    .studio-map-mini{position:relative;display:block;width:100%;height:143px;margin:0 0 8px;padding:0;border:1px solid #a4b6aa;border-radius:13px;overflow:hidden;cursor:pointer;background:repeating-linear-gradient(35deg,transparent 0 34px,#c8e5d5 35px 46px,transparent 47px 72px),repeating-linear-gradient(118deg,#ecf2db 0 31px,#b5d9d1 32px 39px,#eaf0dc 40px 87px);box-shadow:2px 3px 0 #9fae9b}
    .studio-map-mini:before{content:"";position:absolute;inset:-20px;background:repeating-linear-gradient(135deg,transparent 0 36px,#faf7e0d1 37px 44px,transparent 45px 89px);pointer-events:none}
    .studio-map-mini-title,.studio-map-mini-count{position:absolute;z-index:2;left:8px;padding:4px 8px;border-radius:7px;background:#f8faeadd;font:800 9px/1.2 ui-monospace,monospace;color:#295b52}
    .studio-map-mini-title{top:9px}.studio-map-mini-count{bottom:8px}
    .studio-map-preview-marker{position:absolute;z-index:3;display:grid;place-items:center;width:23px;height:23px;border:2px solid white;border-radius:50%;background:#c02f41;color:white;font:800 10px system-ui;box-shadow:0 2px 5px #283b3d66;transform:translate(-50%,-50%)}
    .studio-map-preview-empty{margin:6px 0;font:600 11px/1.3 system-ui;color:#6d7b67}


    .main.module-view>.hero,.main.module-view>.masonry,.main.module-view>.site-policy-footer{display:none!important}
    .module-workspace{position:relative;z-index:4;min-height:calc(100vh - 66px);padding:34px clamp(18px,4vw,54px) 110px;background:linear-gradient(180deg,rgba(246,240,233,.94),rgba(239,231,223,.97));color:#272321}
    .module-shell{max-width:1720px;margin:0 auto}
/* A widget page used to stop at 1160px inside a much wider window, which left the Collective
   Feed reading as a narrow strip down the middle with dead space either side. The feed is the
   one page that is mostly pictures, so it is also the one that reaches closest to the edges. */
.module-workspace[data-module-key="feed"]{padding-left:clamp(10px,1.4vw,24px)!important;padding-right:clamp(10px,1.4vw,24px)!important}
.module-workspace[data-module-key="feed"] .module-shell{max-width:1920px}
    .module-top{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:26px}
    .module-back{border:1px solid #d8cec5;background:rgba(255,255,255,.68);border-radius:999px;padding:9px 14px;font:600 11px/1 system-ui;letter-spacing:.02em;color:#3a3430;cursor:pointer}
    .module-back:hover{background:#fff}
    .module-route{font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:#8b8179}
    .module-heading{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:20px;align-items:end;padding-bottom:22px;border-bottom:1px solid #d9d0c8}
    .module-heading h1{margin:0;font:500 clamp(34px,6vw,66px)/.95 Georgia,serif;letter-spacing:-.04em}
    /* Calendar establishes the shared page-heading position. Feed keeps its
       wider masonry canvas, but its back button and header align precisely with
       Calendar's standard Studio gutter (including centered max-width shells). */
    .module-workspace[data-module-key="feed"]{
      --shared-heading-inset:clamp(18px,4vw,54px);
      --feed-canvas-inset:clamp(10px,1.4vw,24px);
      --feed-heading-offset:calc(var(--shared-heading-inset) - var(--feed-canvas-inset));
    }
    .module-workspace[data-module-key="feed"] :is(.module-top,.module-heading){
      width:calc(100% - var(--feed-heading-offset) - var(--feed-heading-offset));
      max-width:1720px;
      margin-left:auto;
      margin-right:auto;
      box-sizing:border-box;
    }
    .module-workspace[data-module-key="feed"] .module-heading h1{
      transform:none;
    }
    .module-heading p{max-width:700px;margin:12px 0 0;font-size:13px;line-height:1.6;color:#6e655f}
    .module-badge{align-self:start;border:1px solid #d8cec5;border-radius:999px;padding:8px 11px;font-size:9px;letter-spacing:.1em;text-transform:uppercase;background:rgba(255,255,255,.56);color:#746a64}
    .module-heading-actions{align-self:start;display:grid;justify-items:end;gap:9px;max-width:310px}
    .module-update-privacy{display:flex;align-items:flex-start;gap:8px;padding:9px 10px;border:1px solid #d8cec5;border-radius:12px;background:rgba(255,255,255,.48);font:600 11px/1.35 system-ui;color:#625a55;cursor:pointer}
    .module-update-privacy input{flex:0 0 auto;width:15px;height:15px;margin:0;accent-color:rgb(var(--aura-rgb,216,95,109))}
    .module-grid{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(250px,.75fr);gap:14px;margin-top:20px}
    .module-card{border:1px solid #ddd3ca;background:rgba(255,255,255,.58);border-radius:18px;padding:18px;box-shadow:0 10px 30px rgba(55,42,34,.05)}
    .module-card.wide{grid-column:1/-1}.module-card h2{font:600 18px/1.1 Georgia,serif;margin:0 0 6px}.module-card>p{margin:0 0 14px;font-size:11px;line-height:1.55;color:#766c66}
    /* Feed composer: one readable workspace rather than a stack of import banners
       and full-width buttons. Buttons keep their intrinsic text width. */
    .module-workspace[data-module-key="feed"] .biglwa-feed-compose-card{padding:clamp(14px,2vw,22px);overflow:visible}
    .module-workspace[data-module-key="feed"] .biglwa-feed-compose-head{
      display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-start;gap:8px 16px;margin-bottom:12px
    }
    .module-workspace[data-module-key="feed"] .biglwa-feed-compose-head h2{margin:0 0 6px}
    .module-workspace[data-module-key="feed"] .biglwa-feed-compose-head p{
      font:500 11px/1.5 system-ui;margin:0;color:#736760;max-width:650px
    }
    .module-workspace[data-module-key="feed"] .biglwa-feed-compose-form{display:grid;gap:12px;min-width:0}
    .module-workspace[data-module-key="feed"] .biglwa-feed-compose-fields{
      display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px;min-width:0
    }
    .module-workspace[data-module-key="feed"] .biglwa-feed-field{display:grid;gap:6px;min-width:0;font:700 11px/1.3 system-ui}
    .module-workspace[data-module-key="feed"] .biglwa-feed-field span{font:500 10px/1.3 system-ui;color:#80716d}
    .module-workspace[data-module-key="feed"] .biglwa-feed-field .module-input{
      width:100%;max-width:100%;min-width:0;box-sizing:border-box;margin:0;
      font:500 12px/1.45 system-ui;padding:11px 12px;border-radius:10px;min-height:42px
    }
    .module-workspace[data-module-key="feed"] #feedComposerCaption{
      resize:vertical;min-height:62px;max-height:180px;overflow-y:auto;white-space:pre-wrap
    }
    .module-workspace[data-module-key="feed"] .biglwa-feed-compose-actions{
      display:flex;flex-wrap:wrap;align-items:center;gap:10px;min-width:0
    }
    .module-workspace[data-module-key="feed"] .biglwa-feed-compose-actions .module-action,
    .module-workspace[data-module-key="feed"] #feedStreamExplore{
      display:inline-flex;align-items:center;justify-content:center;
      width:auto!important;max-width:100%;min-width:0;min-height:38px;
      box-sizing:border-box;padding:10px 15px!important;line-height:1.3!important;
      text-align:center;white-space:normal;overflow-wrap:anywhere;flex:none
    }
    .module-workspace[data-module-key="feed"] .biglwa-feed-compose-actions .biglwa-feed-publish-button{flex:0 1 auto}
    .module-workspace[data-module-key="feed"] .biglwa-feed-photo-picker{
      display:inline-flex;align-items:center;justify-content:center;gap:6px;
      min-height:38px;width:auto!important;max-width:100%;box-sizing:border-box;
      margin:0;padding:9px 14px;border:1px dashed #ac948a;border-radius:10px;
      cursor:pointer;font:700 11px/1.35 system-ui;white-space:normal
    }
    .module-workspace[data-module-key="feed"] .biglwa-feed-photo-picker>span{font-weight:500;color:#83726b}
    .module-workspace[data-module-key="feed"] .biglwa-feed-photo-picker>input{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}
    .module-workspace[data-module-key="feed"] .biglwa-feed-photo-picker:focus-within{outline:2px solid #a54d69;outline-offset:2px}
    .module-workspace[data-module-key="feed"] .biglwa-feed-compose-status:empty{display:none}
    .module-workspace[data-module-key="feed"] #biglwaFeedImportStatusRail{margin:0 0 12px;padding:0}
    .module-workspace[data-module-key="feed"] #biglwaFeedImportStatusRail[hidden]{display:none!important}
    .module-workspace[data-module-key="feed"] #biglwaFeedImportStatusRail .biglwa-instagram-import-status,
    .module-workspace[data-module-key="feed"] #biglwaFeedImportStatusRail .instagram-import-status{
      margin:0!important;padding:9px 12px!important;border:1px solid #dacdc4!important;
      border-radius:10px!important;box-shadow:none!important;background:rgba(255,255,255,.36)!important
    }
    .module-workspace[data-module-key="feed"] #biglwaFeedImportStatusRail small{font:500 11px/1.4 system-ui}
    .module-workspace[data-module-key="feed"] #biglwaFeedImportStatusRail b{font:700 11px/1.2 system-ui}
    .module-workspace[data-module-key="feed"] #biglwaFeedImportStatusRail .module-action{
      width:auto!important;max-width:100%;margin:6px 0 0;padding:8px 12px!important;min-height:32px
    }
    .module-workspace[data-module-key="feed"] #biglwaFeedThumbs{grid-column:1/-1;max-width:145px}
    @media(max-width:680px){
      .module-workspace[data-module-key="feed"] .biglwa-feed-compose-fields{grid-template-columns:1fr}
      .module-workspace[data-module-key="feed"] .biglwa-feed-compose-actions{align-items:stretch}
      .module-workspace[data-module-key="feed"] .biglwa-feed-compose-actions .module-action{flex:1 1 190px}
    }
        .module-form{display:grid;gap:8px}.module-form.two{grid-template-columns:1fr 1fr}.module-form.three{grid-template-columns:1.3fr 1fr .8fr}
    .module-input,.module-textarea,.module-select{width:100%;min-width:0;box-sizing:border-box;border:1px solid #d8cec5;background:rgba(255,255,255,.76);border-radius:11px;padding:10px 11px;font:11px/1.35 system-ui;color:#302b28;outline:none}
    .module-textarea{min-height:230px;resize:vertical;line-height:1.65}
    .module-input:focus,.module-textarea:focus,.module-select:focus{border-color:rgba(var(--aura-rgb,216,95,109),.7);box-shadow:0 0 0 3px rgba(var(--aura-rgb,216,95,109),.10)}
    .module-action{border:0;border-radius:11px;background:rgb(var(--aura-rgb,216,95,109));color:var(--aura-button-ink,#fff);padding:10px 13px;font:700 10px/1 system-ui;cursor:pointer}
    .module-action:disabled{opacity:.45;cursor:not-allowed}.module-action.secondary{background:#2a2725;color:#fff}.module-action.ghost{background:rgba(255,255,255,.65);color:#4f4742;border:1px solid #d8cec5}
    .module-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}
    .module-list{display:grid;gap:8px;margin-top:12px}.module-list-item{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;border:1px solid #dfd6cd;background:rgba(255,255,255,.5);border-radius:13px;padding:11px 12px}.module-list-item b,.module-list-item small{display:block}.module-list-item b{font-size:11px}.module-list-item small{font-size:9px;color:#857b74;margin-top:3px}.module-list-item button{border:0;background:transparent;color:#8b7e76;font-size:10px;cursor:pointer}
    .module-status{min-height:16px;margin-top:7px;font-size:9px;color:#81766f}.module-status.ok{color:#477650}
    .module-orbit{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.module-orbit-row{position:relative;border:1px solid #ddd3ca;background:rgba(255,255,255,.52);border-radius:14px;padding:11px 11px 44px}.module-orbit-row header{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}.module-orbit-row header b{font-size:11px}.module-orbit-row header span,.module-workspace .module-orbit-row header span{min-width:28px;height:26px;padding:0 7px;border-radius:999px;display:grid;place-items:center;background:#292523;color:#fff!important;font-size:8px;font-weight:800;-webkit-text-fill-color:#fff}
    /* Platform marker sits diagonally opposite the connection-status pill,
       away from titles, buttons, inputs, and profile information. */
    .module-orbit-row>.orbit-platform-badge,
    .module-workspace .module-orbit-row>.orbit-platform-badge{
      position:absolute;right:11px;bottom:10px;top:auto;left:auto;
      display:grid;place-items:center;min-width:27px;height:27px;
      width:auto;padding:0 7px;box-sizing:border-box;border-radius:999px;
      color:#fff!important;-webkit-text-fill-color:#fff!important;
      font:800 8px/1 system-ui;letter-spacing:.01em;
      pointer-events:none;z-index:1
    }
    .module-orbit-row header>.orbit-state{margin-left:auto}
    .orbit-field-label{display:block;font:700 8px/1.2 system-ui;letter-spacing:.08em;text-transform:uppercase;color:#8b8179;margin:8px 0 4px}
    /* Quick links: the same list the owner connects and a visitor clicks. Each source
       carries its own colour so a row of links is readable at a glance. */
    .orbit-quick{margin:14px 0 4px;padding:13px;border:1px solid #ddd3ca;border-radius:14px;background:rgba(255,255,255,.5)}
    .orbit-quick h3{margin:0 0 3px;font:700 11px/1.3 system-ui;letter-spacing:.04em;text-transform:uppercase;color:#6f645c}
    .orbit-quick p{margin:0 0 10px;font-size:10px;line-height:1.5;color:#8b8179}
    .orbit-quick-row{display:flex;flex-wrap:wrap;gap:9px}
    .orbit-quick-link{--accent:#8b8179;position:relative;display:flex;flex-direction:column;gap:1px;min-width:132px;padding:9px 26px 9px 11px;border-radius:12px;border:1px solid rgba(80,70,64,.16);background:#fffdf9;color:#2f2a27;text-decoration:none;box-shadow:0 2px 0 0 var(--accent),0 6px 14px -8px var(--accent);transition:transform .16s ease,box-shadow .16s ease}
    .orbit-quick-link:hover{transform:translateY(-1px);box-shadow:0 3px 0 0 var(--accent),0 10px 20px -8px var(--accent)}
    .orbit-quick-link:focus-visible{outline:3px solid #a53332;outline-offset:2px}
    .orbit-quick-link b{font:700 12px/1.3 system-ui}
    .orbit-quick-link small{font:600 10px/1.35 system-ui;color:#8b8179;overflow-wrap:anywhere}
    .orbit-quick-link i{position:absolute;right:9px;top:9px;font-style:normal;font-size:11px;color:var(--accent)}
    .orbit-quick-link.is-instagram{--accent:#c13584}.orbit-quick-link.is-tiktok{--accent:#0f8f95}.orbit-quick-link.is-pinterest{--accent:#e60023}.orbit-quick-link.is-facebook{--accent:#1877f2}.orbit-quick-link.is-youtube{--accent:#d0202f}.orbit-quick-link.is-soundcloud{--accent:#e2622a}
    .module-orbit-row.is-oauth{border-color:rgba(80,70,64,.24);background:rgba(255,255,255,.66)}
    .orbit-state{margin-left:auto;font:700 8px/1.6 system-ui;letter-spacing:.06em;text-transform:uppercase;color:#8b8179;padding:2px 7px;border-radius:999px;background:rgba(139,129,121,.14)}
    .module-orbit-row header .orbit-state+span{margin-left:6px}
    .orbit-state.is-on{color:#3f6b4a;background:rgba(63,107,74,.14)}
    .orbit-connected-card{display:flex;align-items:center;gap:10px;padding:8px;border-radius:12px;background:rgba(255,255,255,.7);border:1px solid rgba(80,70,64,.12)}
    .orbit-connected-card img{border-radius:50%;object-fit:cover;flex:0 0 auto;background:#e6dcd1}
    .orbit-connected-card span{min-width:0;flex:1}
    .orbit-connected-card b{display:block;font:700 12px/1.35 system-ui;overflow-wrap:anywhere}
    .orbit-connected-card small{display:block;font:600 10px/1.4 system-ui;color:#8b8179;overflow-wrap:anywhere}
    .orbit-hotlink{flex:0 0 auto;font:700 11px/1 system-ui;color:#a53332;text-decoration:none;padding:6px 9px;border-radius:9px;border:1px solid rgba(165,51,50,.28)}
    .orbit-hotlink:hover{background:rgba(165,51,50,.08)}
    .orbit-not-connected{margin:0;font-size:10px;color:#8b8179}
    .module-launchers{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.module-launcher{border:1px solid #ddd3ca;background:rgba(255,255,255,.58);border-radius:14px;padding:15px 12px;text-align:left;cursor:pointer}.module-launcher b{display:block;font-family:Georgia,serif;font-size:14px;margin-bottom:4px}.module-launcher small{font-size:9px;color:#81776f;line-height:1.35}
    .photobooth-stage{position:relative;min-height:420px;border:1px solid #cfc3ba;border-radius:18px;overflow:hidden;background:#171514;display:grid;place-items:center}
    .video-booth-soon{position:relative;overflow:hidden}
    .video-booth-head{display:flex;align-items:center;gap:9px;flex-wrap:wrap}
    .video-booth-head h2{margin:0}
    .coming-soon-badge{border-radius:999px;padding:3px 9px;background:rgba(var(--aura-rgb,216,95,109),.14);color:#8d3a49;font:700 9px/1 Inter,ui-sans-serif,system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase;white-space:nowrap}
    body.night-mode .coming-soon-badge{color:#f0b7c1}
    .video-booth-preview{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0;max-width:520px}
    .video-booth-tile{display:grid;place-items:center;aspect-ratio:3/4;border-radius:16px;border:1px solid #d8cec5;background:linear-gradient(160deg,#efe7e0,#ded3ca);color:#8a7f77;font:700 11px/1 Inter,ui-sans-serif,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase}
    body.night-mode .video-booth-tile{background:linear-gradient(160deg,#2b2724,#1d1a19);border-color:#4a423c;color:#a2968c}
    .video-booth-soon .module-action[disabled]{opacity:.5;cursor:not-allowed}
    .video-booth-status{font-size:9px;color:#81766f;margin:0 0 10px}
    .video-booth-checks{margin:0;padding:0;list-style:none;display:grid;gap:6px}
    .video-booth-checks li{position:relative;padding-left:22px;font-size:10px;line-height:1.5;color:#5c534c}
    .video-booth-checks li::before{content:"";position:absolute;left:0;top:2px;width:12px;height:12px;border-radius:4px;border:1px solid #c9bdb4;background:rgba(255,255,255,.6)}
    .video-booth-checks li[data-ready="1"]::before{background:#477650;border-color:#3d6444}
    .video-booth-checks li[data-ready="1"]::after{content:"";position:absolute;left:3px;top:5px;width:5px;height:2px;border-left:1.5px solid #fff;border-bottom:1.5px solid #fff;transform:rotate(-45deg)}
    .photobooth-stage.has-intro{min-height:0;aspect-ratio:3/2;background:#c9c0bd}
    .photobooth-stage .photobooth-intro{width:100%;height:100%;max-height:none;object-fit:cover;object-position:center;filter:contrast(1.02)}
    .photobooth-stage video,.photobooth-stage canvas,.photobooth-stage img{width:100%;height:100%;max-height:560px;object-fit:cover;display:block}
    .photobooth-stage .photo-empty{color:#ded7d0;text-align:center;font-size:12px;line-height:1.6;padding:24px}.photobooth-stage.flash:after{content:"";position:absolute;inset:0;background:white;animation:boothFlash .35s ease-out both;pointer-events:none}@keyframes boothFlash{0%{opacity:1}100%{opacity:0}}
    .photo-strip{display:grid;grid-template-columns:repeat(4,minmax(80px,1fr));gap:8px;margin-top:12px}.photo-strip figure{margin:0;position:relative;border-radius:12px;overflow:hidden;aspect-ratio:4/3;background:#ddd}.photo-strip img{width:100%;height:100%;object-fit:cover}.photo-strip a{position:absolute;right:6px;bottom:6px;border-radius:999px;background:rgba(20,18,17,.76);color:#fff;text-decoration:none;font:700 8px/1 system-ui;padding:6px 7px}
    #studioApp #camera .contact-sheet.photobooth-reference-preview{display:block!important;width:100%;height:auto!important;aspect-ratio:3/2;margin:12px 0 14px;padding:0!important;border:1px solid rgba(81,65,58,.18);border-radius:13px;overflow:hidden;background:#c9c0bd;box-shadow:0 7px 18px rgba(55,42,34,.13)}
    #studioApp #camera .contact-sheet.photobooth-reference-preview img{display:block;width:100%;height:100%;object-fit:cover;object-position:center 46%;filter:contrast(1.02);transform:scale(1.09);transform-origin:center 46%}
    #studioApp .biglwa-instagram-feed-preview{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin:10px 0 12px;padding:0;background:transparent;min-height:0}
    #studioApp .biglwa-instagram-preview-tile{display:block;min-width:0;padding:0;border:0;border-radius:10px;overflow:hidden;background:#7d3ec5;cursor:pointer;aspect-ratio:1/1}
    #studioApp .biglwa-instagram-preview-tile img{display:block;width:100%;height:100%;object-fit:cover;border-radius:10px}
    #studioApp .biglwa-instagram-preview-tile:hover{transform:translateY(-1px);filter:brightness(1.03)}
    .module-workspace[data-module-key="archive"] .instagram-archive-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:16px}
    /* The Tools page opens with the drop area rather than a grid of separate tool cards,
       because the file you bring decides which conversions get offered. */
    .tool-intake{margin:0 0 18px}
    .tool-drop{display:flex;flex-direction:column;align-items:center;gap:8px;padding:44px 24px;border:2px dashed rgba(var(--aura-rgb,216,95,109),.34);border-radius:var(--widget-radius,16px);background:var(--widget-bg,rgba(250,247,241,.84));text-align:center;cursor:pointer;transition:border-color .16s ease,background .16s ease,transform .16s ease}
    .tool-drop:hover,.tool-drop:focus-visible{border-color:rgba(var(--aura-rgb,216,95,109),.7)}
    .tool-drop.is-over{border-color:var(--aura,#d95f6d);background:rgba(var(--aura-rgb,216,95,109),.1);transform:scale(1.005)}
    .tool-drop strong{font-family:"CS Bergamot Stitched",Georgia,serif;font-size:26px;font-weight:400;text-transform:lowercase;color:var(--widget-ink,#272321)}
    .tool-drop span{font:600 12px/1.5 system-ui;color:#8a7a6c}
    .tool-drop em{font:500 11px/1.5 system-ui;font-style:normal;color:#a1958a;max-width:52ch}
    .tool-status{margin-top:10px;font:600 11px/1.5 system-ui;color:#6b5f57}
    .tool-progress{position:relative;margin-top:8px;height:8px;border-radius:999px;background:rgba(var(--aura-rgb,216,95,109),.16);overflow:hidden}
    .tool-progress span{position:absolute;inset:0 auto 0 0;width:0;border-radius:999px;background:var(--aura,#d95f6d);transition:width .25s ease}
    .tool-progress em{position:absolute;left:0;top:11px;font:600 10px/1.4 system-ui;font-style:normal;color:#8a7a6c}
    .tool-facts{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0 4px}
    .tool-facts span{padding:3px 10px;border-radius:999px;background:rgba(var(--aura-rgb,216,95,109),.1);font:700 10px/1.6 system-ui;color:#6b5f57}
    .tool-actions{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0 4px}
    .tool-note{margin:8px 0 0;font:500 11px/1.6 system-ui;color:#8a7a6c}
    .tool-group h3{margin:18px 0 0}
    .tool-done{display:flex;flex-direction:column;gap:2px;margin:12px 0 0;padding:12px 14px;border-radius:var(--widget-radius,14px);background:rgba(var(--aura-rgb,216,95,109),.09);border:1px solid rgba(var(--aura-rgb,216,95,109),.2)}
    .tool-done b{font:700 12px/1.5 system-ui;color:#3a332f}
    .tool-done span{font:600 11px/1.5 system-ui;color:#8a7a6c}
    .tool-directory,.tool-links{margin-top:18px}
    .tool-directory-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:12px}
    .tool-directory-item{display:flex;flex-direction:column;gap:2px;padding:12px 14px;border-radius:var(--widget-radius,14px);background:rgba(var(--aura-rgb,216,95,109),.07);border:1px solid rgba(var(--aura-rgb,216,95,109),.16);text-decoration:none}
    .tool-directory-item b{font:700 12px/1.5 system-ui;color:#3a332f}
    .tool-directory-item span{font:500 11px/1.5 system-ui;color:#8a7a6c}
    .tool-directory-item:hover{border-color:rgba(var(--aura-rgb,216,95,109),.44)}
    @media(max-width:900px){.tool-directory-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:560px){.tool-directory-grid{grid-template-columns:1fr}.tool-drop{padding:32px 16px}}

    /* Archive uses the same visual language as Collective Feed: source-coloured rims,
       a Live switch that keeps its colour when the picture above it goes grey, and a wall
       that stays in columns. Cards from every source are kept in their own source block,
       so the Archive is not an Instagram-only shelf. */
.module-workspace[data-module-key="archive"] .archive-wall-shell{display:block!important;padding:0!important;margin-top:18px}
    .module-workspace[data-module-key="archive"] .archive-page-list{display:block!important;margin:0!important}
    /* A stale cached render used to paint the cards flat straight under the list, which the
       block display above forced into one long vertical column. If a card is ever a direct
       child again, it should sit in the same responsive wall as the grouped grid below. */
    .module-workspace[data-module-key="archive"] .archive-page-list:not(:has(.archive-source-group)){display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px;align-items:start;min-width:0}
    @media(max-width:1180px){.module-workspace[data-module-key="archive"] .archive-page-list:not(:has(.archive-source-group)){grid-template-columns:repeat(3,minmax(0,1fr))}}
    @media(max-width:820px){.module-workspace[data-module-key="archive"] .archive-page-list:not(:has(.archive-source-group)){grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:520px){.module-workspace[data-module-key="archive"] .archive-page-list:not(:has(.archive-source-group)){grid-template-columns:1fr}}
    .module-workspace[data-module-key="archive"] .archive-source-group{margin:0 0 26px}
    .module-workspace[data-module-key="archive"] .archive-source-group{display:block;width:100%;min-width:0;grid-column:1/-1;clear:both}
    .module-workspace[data-module-key="archive"] .instagram-archive-grid{width:100%;min-width:0;max-width:none;grid-auto-flow:row;justify-content:stretch}
    .module-workspace[data-module-key="archive"] .instagram-archive-grid>.instagram-archive-card{width:100%;min-width:0;max-width:none}

    .module-workspace[data-module-key="archive"] .archive-group-head{display:flex;align-items:baseline;gap:10px;margin:0 0 10px;padding-bottom:6px;border-bottom:1px solid rgba(80,70,64,.14);font:700 12px/1.3 system-ui;color:#3a332f}
    .module-workspace[data-module-key="archive"] .archive-group-head em{font:700 9px/1.4 system-ui;font-style:normal;letter-spacing:.06em;text-transform:uppercase;color:#8a7a6c}
    .module-workspace[data-module-key="archive"] .archive-group-head .archive-group-repeats{color:#a8410f;background:rgba(168,65,15,.12);padding:2px 8px;border-radius:999px}
    .module-workspace[data-module-key="archive"] .instagram-archive-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px;align-items:start;min-width:0}
    @media(max-width:1180px){.module-workspace[data-module-key="archive"] .instagram-archive-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
    @media(max-width:820px){.module-workspace[data-module-key="archive"] .instagram-archive-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:520px){.module-workspace[data-module-key="archive"] .instagram-archive-grid{grid-template-columns:1fr}}
    .module-workspace[data-module-key="archive"] .instagram-archive-card{
      --feed-card-rim:#a52a0c;position:relative;min-width:0;overflow:hidden;
      border:1px solid rgba(var(--aura-rgb,216,95,109),.2);border-radius:11px;background:rgba(var(--aura-rgb,216,95,109),.09);
      box-shadow:3px 3px 0 var(--feed-card-rim,#a52a0c),0 12px 26px -18px rgba(var(--aura-rgb,216,95,109),.8);
      transition:filter .2s ease,background .2s ease,border-color .2s ease,box-shadow .2s ease;
      content-visibility:auto;contain-intrinsic-size:360px
    }
    /* Every stored card keeps the rim and colour of its own source whether it is on the
       Collective Feed or not, so a card is recognised as the same one that hangs on the wall.
       Only a card switched off is greyed, and then only its picture. */
.module-workspace[data-module-key="archive"] .instagram-archive-card.is-collective,
    .module-workspace[data-module-key="archive"] .instagram-archive-card.is-live,
    .module-workspace[data-module-key="archive"] .instagram-archive-card.is-archived{background:rgba(var(--aura-rgb,216,95,109),.09)!important;border-color:rgba(var(--aura-rgb,216,95,109),.2)!important;box-shadow:3px 3px 0 var(--feed-card-rim,#a52a0c)!important;filter:none;opacity:1}
    .module-workspace[data-module-key="archive"] .instagram-archive-card.is-off .instagram-archive-media,
    .module-workspace[data-module-key="archive"] .instagram-archive-card.is-archived .instagram-archive-media{filter:grayscale(1);opacity:.7}
    .module-workspace[data-module-key="archive"] .instagram-archive-card.is-off .instagram-archive-piece,
    .module-workspace[data-module-key="archive"] .instagram-archive-card.is-archived .instagram-archive-piece{background:#c7c7c7!important}
    .module-workspace[data-module-key="archive"] .instagram-archive-card.is-off .instagram-archive-strip,
    .module-workspace[data-module-key="archive"] .instagram-archive-card.is-archived .instagram-archive-strip{background:#c7c7c7;border-bottom-color:#b9b9b9}
    .module-workspace[data-module-key="archive"] .instagram-archive-card.is-pending-delete{background:#d96c67!important;border-color:#bd3f47!important;box-shadow:3px 3px 0 #9e3636!important;filter:none!important}
    .module-workspace[data-module-key="archive"] .instagram-archive-strip{height:15px;padding:1px 4px;display:flex;align-items:center;gap:3px;background:rgba(var(--aura-rgb,216,95,109),.17);border-bottom:1px solid rgba(var(--aura-rgb,216,95,109),.18);position:relative;z-index:8}
    .module-workspace[data-module-key="archive"] .instagram-archive-strip b{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:700 7px/11px system-ui;color:rgba(75,45,20,.78)}
    .module-workspace[data-module-key="archive"] .instagram-archive-strip i{width:8px;height:8px;flex:0 0 8px;border-radius:50%;display:block}
    .module-workspace[data-module-key="archive"] .instagram-archive-strip i:nth-last-child(3){background:#bd3f47}
    .module-workspace[data-module-key="archive"] .instagram-archive-strip i:nth-last-child(2){background:#d1ad2f}
    .module-workspace[data-module-key="archive"] .instagram-archive-strip i:nth-last-child(1){background:#4e8f61}
    .module-workspace[data-module-key="archive"] .archive-browser-actions{display:flex;align-items:center;gap:3px;margin-left:auto}
    .module-workspace[data-module-key="archive"] .archive-browser-actions button{
      width:19px!important;height:18px!important;min-width:19px!important;padding:0!important;
      display:grid!important;place-items:center!important;border:1px solid #b8a99d!important;
      border-radius:4px!important;background:#faf1e7!important;color:#593e35!important;
      font:800 13px/1 system-ui!important;cursor:pointer;box-shadow:none!important
    }
    .module-workspace[data-module-key="archive"] .archive-browser-actions button:hover,
    .module-workspace[data-module-key="archive"] .archive-browser-actions button:focus-visible{
      border-color:var(--feed-card-rim)!important;outline:1px solid var(--feed-card-rim)!important
    }
    .module-workspace[data-module-key="archive"] .archive-browser-actions button:disabled{opacity:.48;cursor:default}
    .module-workspace[data-module-key="archive"] .instagram-archive-media{display:grid;gap:1px;background:#c7c7c7}
    /* A four-piece carousel is laid out as a 2x2 tile instead of one tower, and every piece
       sits in a fixed frame, so a tall photo or a tall frame can never stretch one card into
       a whole page and swallow its row. Same bounding idea as the feed slides. */
    /* Match the Collective Feed: one media frame per card, never a stack of
       tall imported images that grows the wall down the page. */
    .module-workspace[data-module-key="archive"] .instagram-archive-media{position:relative;display:block!important;overflow:hidden;min-width:0}
    .module-workspace[data-module-key="archive"] .instagram-archive-piece{aspect-ratio:4/5;min-height:0!important;max-height:none!important}
    .module-workspace[data-module-key="archive"] .instagram-archive-piece img,
    .module-workspace[data-module-key="archive"] .instagram-archive-piece video{object-fit:contain;background:#f3e9df}
    .module-workspace[data-module-key="archive"] .archive-carousel-actions{position:absolute;left:7px;right:7px;top:50%;transform:translateY(-50%);display:flex;justify-content:space-between;pointer-events:none;z-index:4}
    .module-workspace[data-module-key="archive"] .archive-carousel-actions button{pointer-events:auto;width:28px;min-width:28px;height:32px;background:rgba(33,25,22,.72);border:1px solid rgba(255,255,255,.8);border-radius:9px;color:white;cursor:pointer;font:900 21px/1 system-ui;display:grid;place-items:center;box-shadow:0 2px 9px rgba(0,0,0,.2)}
    .module-workspace[data-module-key="archive"] .archive-carousel-actions button:hover,
    .module-workspace[data-module-key="archive"] .archive-carousel-actions button:focus-visible{background:#a8372d;outline:2px solid #fff}
    .module-workspace[data-module-key="archive"] .instagram-archive-card{content-visibility:visible;contain-intrinsic-size:auto}
    .module-workspace[data-module-key="archive"] .instagram-archive-media.is-tiles{grid-template-columns:repeat(2,minmax(0,1fr))}
    .module-workspace[data-module-key="archive"] .instagram-archive-piece{position:relative;min-width:0;overflow:hidden;background:#f28c28;aspect-ratio:5/6;min-height:112px;max-height:430px}
    .module-workspace[data-module-key="archive"] .instagram-archive-media.is-tiles .instagram-archive-piece{aspect-ratio:1/1;max-height:390px}
    .module-workspace[data-module-key="archive"] .instagram-archive-card.is-collective .instagram-archive-piece{background:#c7c7c7!important}
    .module-workspace[data-module-key="archive"] .instagram-archive-card.is-pending-delete .instagram-archive-piece{background:#d96c67!important}
    .module-workspace[data-module-key="archive"] .instagram-archive-piece img,.module-workspace[data-module-key="archive"] .instagram-archive-piece video{
      display:block;position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:inherit
    }
    .module-workspace[data-module-key="archive"] .instagram-archive-piece>span{position:absolute;right:7px;bottom:7px;padding:3px 5px;border-radius:999px;background:rgba(30,20,15,.7);color:#fff;font:800 7px/1 system-ui}
    .module-workspace[data-module-key="archive"] .archive-media-meta{padding:7px 8px;background:#f1e9e1;border-top:1px solid rgba(80,70,64,.12)}
    .module-workspace[data-module-key="archive"] .archive-media-meta span{display:block;font:700 9px/1.35 system-ui;color:#3a332f}
    .module-workspace[data-module-key="archive"] .archive-media-meta small{display:block;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#8a7a6c;font:600 8px/1.35 system-ui}
    .module-workspace[data-module-key="archive"] .archive-state-line{display:block;margin-top:5px;font:800 7px/1.35 system-ui;letter-spacing:.03em;text-transform:uppercase;color:#3f6b4a}
    .module-workspace[data-module-key="archive"] .archive-delete-warning{color:#bd3f47}
    .module-workspace[data-module-key="archive"] .archive-pending-note{position:relative;z-index:3;padding:6px 8px;background:#d96c67;color:#fff;font:700 8px/1.4 system-ui}
    /* Every Manage button in the Archive opens this popup, so Instagram is not the only
       connection that can be reached from it. It reuses the Orbit page's row classes. */
    .biglwa-popup-backdrop{position:fixed;inset:0;z-index:900;display:grid;place-items:center;padding:18px;background:rgba(48,38,33,.44);backdrop-filter:blur(3px)}
    .biglwa-popup{width:min(600px,96vw);max-height:86vh;overflow:auto;border:1px solid #ddd4ca;border-radius:18px;background:#fffaf3;box-shadow:3px 3px 0 rgba(80,70,64,.28),0 20px 44px -22px rgba(0,0,0,.4);padding:18px 20px}
    .biglwa-popup>header{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px}
    .biglwa-popup h2{margin:0;font:700 15px/1.2 system-ui;color:#2f2a27}
    .biglwa-popup p{margin:4px 0 0;font:500 10px/1.45 system-ui;color:#81766f}
    .biglwa-popup-close{width:26px;height:26px;flex:0 0 26px;border:0;border-radius:50%;background:#f1e9e1;color:#5a4f48;font:700 15px/1 system-ui;cursor:pointer}
    .biglwa-popup-rows{display:grid;gap:10px}
    /* The source filter chips sit under the toolbar and say which sources feed the cards. */
    .archive-filter-bar{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:10px}
    .archive-filter-chip{border:1px solid #ddd3ca;background:rgba(255,255,255,.6);border-radius:999px;padding:5px 11px;font:700 9px/1 system-ui;color:#5c534c;cursor:pointer}
    .archive-filter-chip.is-on{background:rgba(var(--aura-rgb,216,95,109),.16);border-color:rgba(var(--aura-rgb,216,95,109),.5);color:#8d3a49}
    .archive-dupes{display:flex;align-items:center;gap:6px;margin-left:auto;font:700 9px/1.2 system-ui;color:#5c534c;cursor:pointer}
    .archive-dupes input{accent-color:#a52a0c;width:14px;height:14px}
    /* The Live switch sits at the bottom of the card and is the one thing that keeps its
       colour when the picture above it has gone grey, so it can be turned back on. */
    .module-workspace[data-module-key="archive"] .archive-live{position:relative;display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:7px 8px;background:#efe7df;border-top:1px solid rgba(var(--aura-rgb,216,95,109),.18);cursor:pointer}
    .module-workspace[data-module-key="archive"] .archive-live input{position:absolute;opacity:0;width:1px;height:1px}
    .module-workspace[data-module-key="archive"] .archive-live-track{position:relative;width:26px;height:15px;flex:0 0 26px;border-radius:999px;background:#c0b7ae;transition:background .18s ease}
    .module-workspace[data-module-key="archive"] .archive-live-track i{position:absolute;top:2px;left:2px;width:11px;height:11px;border-radius:50%;background:#fff;transition:transform .18s ease}
    .module-workspace[data-module-key="archive"] .archive-live input:checked+.archive-live-track{background:rgb(var(--aura-rgb,216,95,109))}
    .module-workspace[data-module-key="archive"] .archive-live input:checked+.archive-live-track i{transform:translateX(11px)}
    .module-workspace[data-module-key="archive"] .archive-live b{font:800 9px/1.3 system-ui;color:#3a332f;letter-spacing:.02em;text-transform:uppercase}
    .module-workspace[data-module-key="archive"] .archive-live em{flex:1 1 100%;font:600 9px/1.3 system-ui;font-style:normal;color:#8a7a6c}
    .module-workspace[data-module-key="archive"] .archive-live.is-locked{cursor:default}
    .module-workspace[data-module-key="archive"] .archive-live.is-locked .archive-live-track{background:#d3cbc4}
    .module-workspace[data-module-key="archive"] .archive-toolbar{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin:0 0 12px}
    .module-workspace[data-module-key="archive"] .archive-toolbar-copy{min-width:0}
    .module-workspace[data-module-key="archive"] .archive-toolbar-copy h2{margin:0 0 4px}
    .module-workspace[data-module-key="archive"] .archive-toolbar-copy p{margin:0;max-width:720px}
    .module-workspace[data-module-key="archive"] .archive-toolbar-actions{display:flex;gap:7px;flex-wrap:wrap}
    .module-workspace[data-module-key="archive"] .archive-legend{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin:0 0 14px;font:600 9px/1.4 system-ui;color:#6f645c}
    .module-workspace[data-module-key="archive"] .archive-legend i{width:13px;height:13px;border-radius:4px;display:inline-block;border:1px solid rgba(80,70,64,.18)}
    .module-workspace[data-module-key="archive"] .archive-legend i.is-live{background:#f28c28}
    .module-workspace[data-module-key="archive"] .archive-legend i.is-archived{background:#c7c7c7;margin-left:8px}
    
    /* Crop photos to the card (never letterbox), but size each frame from its
       photograph's aspect ratio to preserve composition where possible. */
    .module-workspace[data-module-key="archive"] .instagram-archive-piece{
      aspect-ratio:var(--archive-photo-ratio,4/5)!important;
      height:auto!important;min-height:0!important;max-height:none!important;
      background:transparent!important
    }
    .module-workspace[data-module-key="archive"] .instagram-archive-media{
      background:transparent!important;overflow:hidden!important
    }
    .module-workspace[data-module-key="archive"] .instagram-archive-piece img,
    .module-workspace[data-module-key="archive"] .instagram-archive-piece video{
      width:100%!important;height:100%!important;object-fit:cover!important;
      object-position:center!important;background:transparent!important
    }
    .module-workspace[data-module-key="archive"] .instagram-archive-strip i{display:none!important}
    .module-workspace[data-module-key="archive"] .archive-color-guide{
      display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin:6px 0 22px;
      padding:13px 16px;border:1px solid #d3bdb0;border-radius:12px;
      background:rgba(255,250,242,.66);font:650 11px/1.45 system-ui;color:#594b43
    }
    .module-workspace[data-module-key="archive"] .archive-color-guide>b{
      font:850 10px/1.3 ui-monospace,monospace;color:#443630;letter-spacing:.075em
    }
    .module-workspace[data-module-key="archive"] .archive-color-guide-item{
      display:inline-flex;align-items:center;gap:9px;white-space:nowrap
    }
    .module-workspace[data-module-key="archive"] .archive-color-guide-item>i{
      display:inline-block;flex:0 0 13px;width:13px;height:13px;border:1px solid #fff5ed;
      border-radius:4px;background:#d7c8b5;box-shadow:2px 3px 0 #9b8075
    }
    .module-workspace[data-module-key="archive"] .archive-key-instagram{
      background:#7d3ec5!important;box-shadow:2px 3px 0 #7d3ec5,4px 5px 0 #ad82e7!important
    }
    .module-workspace[data-module-key="archive"] .archive-key-pinterest{
      background:#e60023!important;box-shadow:2px 3px 0 #e60023,4px 5px 0 #ae0026!important
    }
    .module-workspace[data-module-key="archive"] .archive-key-facebook{
      background:#1877f2!important;box-shadow:2px 3px 0 #1877f2!important
    }
    .module-workspace[data-module-key="archive"] .archive-key-tiktok{
      background:#191919!important;box-shadow:2px 3px 0 #111!important
    }
    .module-workspace[data-module-key="archive"] .archive-key-other{
      background:#8f756e!important;box-shadow:2px 3px 0 #96736c!important
    }
    .module-workspace[data-module-key="archive"] .archive-color-guide small{
      flex-basis:100%;color:#816d63;font:600 10px/1.45 system-ui
    }
    .module-workspace[data-module-key="archive"] .instagram-archive-card.is-off .instagram-archive-piece,
    .module-workspace[data-module-key="archive"] .instagram-archive-card.is-archived .instagram-archive-piece{
      background:transparent!important
    }
    .module-workspace[data-module-key="archive"] .archive-empty{
      padding:42px 24px;border:1px dashed #d8cec5;border-radius:14px;text-align:center;color:#81766f
    }
    .module-workspace[data-module-key="archive"] .archive-visibility-card{display:grid;gap:10px}
    .module-workspace[data-module-key="archive"] .archive-visibility-row label{display:grid;gap:5px;font:700 9px/1.2 system-ui}
    .module-workspace[data-module-key="archive"] .archive-friend-add{display:flex;gap:7px}
    .module-workspace[data-module-key="archive"] .archive-friend-add .module-input{flex:1}
    .module-workspace[data-module-key="archive"] .instagram-archive-card.archive-src-instagram:not(.is-pending-delete){--feed-card-rim:#f36b21;box-shadow:3px 3px 0 #f36b21,7px 7px 0 -2px #ffad52,0 14px 28px -13px #bd430b!important}
    .module-workspace[data-module-key="archive"] .instagram-archive-card.archive-src-tiktok{--feed-card-rim:#772dcc}
    .module-workspace[data-module-key="archive"] .instagram-archive-card.archive-src-facebook{--feed-card-rim:#1877f2}
    .module-workspace[data-module-key="archive"] .instagram-archive-card.archive-src-pinterest:not(.is-pending-delete){--feed-card-rim:#e60023;box-shadow:3px 3px 0 #e60023,6px 6px 0 -2px #ff5269,0 14px 26px -14px #ae0026!important}
    .module-workspace[data-module-key="archive"] .instagram-archive-card.archive-src-youtube{--feed-card-rim:#d0202f}
    .module-workspace[data-module-key="archive"] .instagram-archive-card.archive-src-soundcloud{--feed-card-rim:#e2622a}

    #studioApp #archive .archive-photo-preview{position:relative;display:block;width:100%;aspect-ratio:4/3;margin:10px 0 12px;padding:0;overflow:hidden;border:1px solid rgba(121,101,88,.22);border-radius:14px;background:#e9e1d9;box-shadow:0 6px 16px rgba(65,43,34,.10);cursor:pointer}
    #studioApp #archive .archive-photo-preview img{display:block;width:100%;height:100%;object-fit:cover;object-position:center 43%;filter:saturate(.96) contrast(1.01)}
    #studioApp #archive .archive-photo-preview::after{content:"";position:absolute;inset:0;pointer-events:none;box-shadow:inset 0 0 0 1px rgba(255,255,255,.26)}
    #studioApp #archive .archive-photo-preview.archive-preview-load-failed::before{content:"Archive preview";position:absolute;inset:0;display:grid;place-items:center;color:#7d6f66;font:700 12px/1 Inter,ui-sans-serif,system-ui,sans-serif;letter-spacing:.04em}
    #studioApp #notes .note-paper.has-saved-writing{display:flex!important;align-items:flex-start!important;justify-content:flex-start!important}
    #studioApp #notes .note-paper .studio-writing-preview-text{position:relative;z-index:2;display:-webkit-box!important;max-width:100%;margin:0!important;padding:0 0 22px!important;overflow:hidden!important;-webkit-box-orient:vertical;-webkit-line-clamp:4;color:#3c3021!important;font:600 17px/1.45 "Comic Sans MS","Bradley Hand","Segoe Print",cursive!important;white-space:pre-wrap;overflow-wrap:anywhere}
    #studioApp #notes .note-paper .studio-writing-preview-meta{position:absolute;right:22px;bottom:15px;z-index:3;margin:0!important;color:#765f35;font:800 8px/1 Inter,ui-sans-serif,system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase}
    #studioApp #diary .diary-page.has-saved-writing{position:relative;display:block!important;min-height:0;aspect-ratio:3/2;padding:0!important;border-radius:10px;overflow:hidden;background:#fffdf4!important;box-shadow:0 5px 14px #49342120}
    #studioApp #diary .diary-page.has-saved-writing::before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent 0 12%,rgba(198,70,83,.48) 12% 12.5%,transparent 12.5%),repeating-linear-gradient(to bottom,transparent 0,transparent 27px,rgba(96,132,157,.28) 28px);pointer-events:none}
    #studioApp #diary .studio-diary-preview{position:absolute;inset:14px 16px 12px 15%;z-index:2;display:flex;flex-direction:column;justify-content:flex-start;overflow:hidden;text-align:left;color:#312a27}
    #studioApp #diary .diary-page{position:relative;isolation:isolate}
    #studioApp #notes .studio-private-writing,
    #studioApp #diary .studio-private-writing,
    #studioApp #diary .studio-public-journal-heading{display:block;position:relative;z-index:4;padding:15px;color:#5f4237;background:#f8eddfb5;font:800 12px/1.45 Georgia,serif}
    #studioApp #diary .studio-public-journal-excerpt{position:relative;z-index:4;text-align:left;padding:8px 20px;margin:0;white-space:pre-wrap;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;font:600 12px/1.65 Georgia,serif;color:#3e342e}
    #studioApp #diary .diary-page .studio-journal-initial{
      position:absolute!important;z-index:9;left:50%!important;top:37%!important;
      width:64px!important;height:64px!important;max-width:20%!important;
      display:flex!important;align-items:center!important;justify-content:center!important;
      box-sizing:border-box!important;padding:0!important;margin:0!important;
      border:0!important;border-radius:0!important;background:transparent!important;color:#292323;
      font-family:"CS Bergamot Stitched",Georgia,serif!important;font-weight:700!important;
      font-size:clamp(25px,5vw,48px)!important;line-height:1!important;letter-spacing:0!important;text-align:center!important;
      box-shadow:none!important;pointer-events:none!important;transform:translate(-50%,-50%) rotate(-2deg)!important
    }
    @media(max-width:520px){#studioApp #diary .diary-page .studio-journal-initial{width:52px!important;height:52px!important;font-size:36px!important}}
    #studioApp #diary .studio-diary-preview small{display:block;margin:0 0 6px;font:800 8px/1 Inter,ui-sans-serif,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#8a6d67}
    #studioApp #diary .studio-diary-preview p{display:-webkit-box;margin:0;overflow:hidden;-webkit-box-orient:vertical;-webkit-line-clamp:5;white-space:pre-wrap;overflow-wrap:anywhere;font:600 14px/28px Georgia,"Times New Roman",serif}
    body.night-mode #studioApp #diary .diary-page.has-saved-writing{filter:saturate(.86) brightness(.82)}
    .calendar-shell{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(260px,.7fr);gap:14px;margin-top:20px}.calendar-board{border:1px solid #ddd3ca;background:rgba(255,255,255,.58);border-radius:18px;padding:16px}.calendar-toolbar{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:12px}.calendar-toolbar h2{margin:0;font:600 20px Georgia,serif}.calendar-weekdays,.calendar-days{display:grid;grid-template-columns:repeat(7,1fr);gap:5px}.calendar-weekdays span{text-align:center;font:700 8px/1.2 system-ui;text-transform:uppercase;letter-spacing:.08em;color:#8b8179;padding:7px 2px}.calendar-day{position:relative;min-height:88px;border:1px solid #e0d7cf;border-radius:11px;background:rgba(255,255,255,.5);padding:7px;text-align:left;cursor:pointer;color:inherit}.calendar-day.other{opacity:.35}.calendar-day.today{box-shadow:inset 0 0 0 2px rgba(var(--aura-rgb,216,95,109),.55)}.calendar-day.selected{background:rgba(var(--aura-rgb,216,95,109),.12);border-color:rgba(var(--aura-rgb,216,95,109),.55)}.calendar-day-num{font:700 10px system-ui}.calendar-event-chip{display:block;margin-top:5px;padding:4px 5px;border-radius:7px;background:#eee1dc;font:700 8px/1.2 system-ui;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.calendar-mini{margin:11px 0 10px;padding:10px;border:1px solid rgba(117,92,79,.16);border-radius:12px;background:rgba(255,255,255,.26)}.calendar-mini-head{display:flex;justify-content:space-between;font:700 9px system-ui;margin-bottom:7px}.calendar-mini-weekdays,.calendar-mini-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:3px}.calendar-mini-weekdays span{padding:2px 0;text-align:center;color:#8b8179;font:800 7px/1 system-ui;text-transform:uppercase}.calendar-mini-grid span{display:grid;place-items:center;min-height:24px;border-radius:6px;font:8px system-ui;background:rgba(255,255,255,.45)}.calendar-mini-grid .today{background:rgba(var(--aura-rgb,216,95,109),.18);box-shadow:inset 0 0 0 1px rgba(var(--aura-rgb,216,95,109),.5);font-weight:800}
    .dyk-game{display:grid;grid-template-columns:minmax(0,1fr) 250px;gap:14px;margin-top:20px}.dyk-card{min-height:360px;border:1px solid #ddd3ca;background:rgba(255,255,255,.62);border-radius:24px;padding:28px;display:flex;flex-direction:column;justify-content:space-between}.dyk-kicker{font:700 9px system-ui;text-transform:uppercase;letter-spacing:.12em;color:#8b8179}.dyk-question{font:500 clamp(25px,4vw,42px)/1.08 Georgia,serif;margin:16px 0 24px}.dyk-options{display:grid;gap:8px}.dyk-option{border:1px solid #d9d0c7;background:rgba(255,255,255,.72);border-radius:12px;padding:12px 13px;text-align:left;font:600 11px system-ui;cursor:pointer}.dyk-option.correct{background:#edf6ee;border-color:#7ea787}.dyk-option.wrong{background:#f8eaea;border-color:#b98080}.dyk-option:disabled{cursor:default}.dyk-source{margin-top:13px;font-size:9px;line-height:1.5;color:#7b716a}.dyk-source a{color:inherit}.dyk-score{font:500 48px/1 Georgia,serif;margin:10px 0}.dyk-side small{font-size:9px;color:#847a73}
    .module-map{height:520px;border-radius:17px;overflow:hidden;border:1px solid #d6cbc2;background:#ddd}.map-coordinate{font:9px/1.5 ui-monospace,SFMono-Regular,monospace;color:#80756e;margin:7px 0}.map-pin-list{max-height:360px;overflow:auto}.studio-map-card{min-height:170px}.studio-map-preview-slot{margin:10px 0}.studio-map-visual{height:78px;border:1px solid #d8cec5;border-radius:12px;background:radial-gradient(circle at 30% 55%,rgba(var(--aura-rgb,216,95,109),.35) 0 4px,transparent 5px),radial-gradient(circle at 67% 32%,#202020 0 3px,transparent 4px),linear-gradient(35deg,transparent 48%,rgba(80,70,62,.14) 49% 51%,transparent 52%),linear-gradient(125deg,#e9e1d8,#f7f1ea);position:relative;overflow:hidden}.studio-map-visual:before,.studio-map-visual:after{content:"";position:absolute;border:1px solid rgba(90,79,70,.16);border-radius:50%;width:120px;height:90px}.studio-map-visual:before{left:-20px;top:25px}.studio-map-visual:after{right:-26px;top:-30px}.studio-map-pins-preview{overflow:hidden;border:1px solid rgba(112,96,84,.22);border-radius:12px;background:rgba(255,255,255,.38)}.studio-map-pins-tab{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px;border-bottom:1px solid rgba(112,96,84,.16);background:rgba(var(--aura-rgb,216,95,109),.08)}.studio-map-pins-tab span{font:800 8px/1 system-ui;letter-spacing:.11em;text-transform:uppercase}.studio-map-pins-tab b{display:grid;place-items:center;min-width:20px;height:20px;padding:0 6px;border-radius:999px;background:rgba(var(--aura-rgb,216,95,109),.15);font:800 8px/1 system-ui}.studio-map-pins-list{display:grid;padding:3px 9px}.studio-map-pin-row{display:grid;grid-template-columns:9px minmax(0,1fr);gap:8px;align-items:center;padding:8px 1px;border-bottom:1px solid rgba(112,96,84,.1)}.studio-map-pin-row:last-child{border-bottom:0}.studio-map-pin-dot{width:7px;height:7px;border-radius:50%;background:rgb(var(--aura-rgb,216,95,109));box-shadow:0 0 0 3px rgba(var(--aura-rgb,216,95,109),.1)}.studio-map-pin-copy{min-width:0}.studio-map-pin-copy b,.studio-map-pin-copy small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.studio-map-pin-copy b{font:700 9px/1.2 system-ui}.studio-map-pin-copy small{margin-top:3px;color:#847a73;font:8px/1.25 system-ui}.studio-map-more{padding:6px 10px 9px;color:#847a73;font:700 8px/1.2 system-ui}.night-mode .studio-map-pins-preview{background:rgba(255,255,255,.045);border-color:rgba(255,255,255,.12)}.night-mode .studio-map-pins-tab{border-color:rgba(255,255,255,.1)}.night-mode .studio-map-pin-row{border-color:rgba(255,255,255,.08)}.night-mode .studio-map-pin-copy small,.night-mode .studio-map-more{color:#b9aea6}
    .closet-connect{display:flex;gap:8px;align-items:center}.closet-connect .module-input{flex:1}.depop-mark{width:40px;height:40px;border-radius:12px;background:#ff3f55;color:#fff;display:grid;place-items:center;font:900 9px system-ui;letter-spacing:.04em}
    #studioApp .trophies-card{min-height:260px;display:flex;flex-direction:column}#studioApp .trophies-card .card-cta{margin-top:auto}
    #studioApp .trophy-preview{display:grid;gap:7px;margin:14px 0 16px;min-height:84px}
    #studioApp .trophy-preview-empty{display:grid;grid-template-columns:38px minmax(0,1fr);grid-template-rows:auto auto;column-gap:10px;align-content:center;min-height:82px;padding:10px 12px;border:1px dashed rgba(103,91,82,.28);border-radius:13px;background:rgba(255,255,255,.28)}
    #studioApp .trophy-preview-mark{grid-row:1/3;width:36px;height:36px;display:grid;place-items:center;border-radius:50%;background:rgba(var(--aura-rgb,216,95,109),.14);color:rgb(var(--aura-rgb,216,95,109));font-size:16px}
    #studioApp .trophy-preview-empty b{align-self:end;font:700 10px/1.2 system-ui}#studioApp .trophy-preview-empty small{align-self:start;margin-top:3px;color:#81776f;font:9px/1.35 system-ui}
    #studioApp .trophy-preview-count{font:700 8px/1 system-ui;letter-spacing:.1em;text-transform:uppercase;color:#887d75}
    #studioApp .trophy-preview-item{display:grid;grid-template-columns:8px minmax(0,1fr) auto;gap:8px;align-items:center;padding:8px 9px;border:1px solid rgba(116,101,91,.18);border-radius:10px;background:rgba(255,255,255,.38)}
    #studioApp .trophy-preview-dot{width:7px;height:7px;border-radius:50%;background:var(--trophy-color,#b58a32)}#studioApp .trophy-preview-item b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:700 9px/1.2 system-ui}#studioApp .trophy-preview-item small{font:8px/1.2 system-ui;color:#887d75}
    .trophy-page-grid{grid-template-columns:minmax(280px,.72fr) minmax(0,1.28fr)}
    .trophy-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.trophy-field{display:grid;gap:5px}.trophy-field.full{grid-column:1/-1}.trophy-field>span{font:700 8px/1.2 system-ui;letter-spacing:.08em;text-transform:uppercase;color:#81766f}
    .trophy-list{display:grid;gap:9px;margin-top:14px}.trophy-entry{--trophy-color:#b58a32;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;padding:13px 14px;border:1px solid #ddd3ca;border-left:3px solid var(--trophy-color);border-radius:13px;background:rgba(255,255,255,.48)}
    .trophy-entry.kind-achievement,.trophy-preview-item.kind-achievement,.trophy-entry.kind-milestone,.trophy-preview-item.kind-milestone{--trophy-color:#5b8a70}.trophy-entry.kind-race,.trophy-preview-item.kind-race,.trophy-entry.kind-record,.trophy-preview-item.kind-record{--trophy-color:#c66c4c}.trophy-entry.kind-athletic-result,.trophy-preview-item.kind-athletic-result,.trophy-entry.kind-license,.trophy-preview-item.kind-license,.trophy-entry.kind-certification,.trophy-preview-item.kind-certification{--trophy-color:#597ea8}.trophy-entry.kind-diploma,.trophy-preview-item.kind-diploma,.trophy-entry.kind-degree,.trophy-preview-item.kind-degree,.trophy-entry.kind-ged,.trophy-preview-item.kind-ged{--trophy-color:#765b9a}.trophy-entry.kind-honor,.trophy-preview-item.kind-honor,.trophy-entry.kind-scholarship,.trophy-preview-item.kind-scholarship{--trophy-color:#b85d76}
    .trophy-entry-head{display:flex;gap:7px;align-items:center;flex-wrap:wrap}.trophy-entry h3{margin:0;font:600 15px/1.2 Georgia,serif}.trophy-kind{display:inline-flex;padding:4px 6px;border-radius:999px;background:color-mix(in srgb,var(--trophy-color) 14%,transparent);color:var(--trophy-color);font:800 7px/1 system-ui;letter-spacing:.07em;text-transform:uppercase}
    .trophy-meta,.trophy-result{margin:6px 0 0;font-size:9px;line-height:1.45;color:#7a7069}.trophy-result{color:#4d4642;font-weight:650}.trophy-proof{display:inline-block;margin-top:8px;color:#62564f;font:700 8px/1.3 system-ui;text-underline-offset:3px}.trophy-entry-actions{display:flex;gap:5px;align-items:start}.trophy-entry-actions button{border:1px solid #d8cec5;background:rgba(255,255,255,.58);border-radius:999px;padding:6px 8px;color:#6e625b;font:700 8px/1 system-ui;cursor:pointer}
    .trophy-empty{display:grid;place-items:center;text-align:center;min-height:190px;padding:22px;border:1px dashed #d8cec5;border-radius:14px;background:rgba(255,255,255,.25)}.trophy-empty-mark{width:54px;height:54px;display:grid;place-items:center;margin-bottom:10px;border-radius:50%;background:rgba(var(--aura-rgb,216,95,109),.12);color:rgb(var(--aura-rgb,216,95,109));font-size:22px}.trophy-empty b{font:600 17px/1.2 Georgia,serif}.trophy-empty p{max-width:300px;margin:6px 0 0;color:#7d736c;font-size:9px;line-height:1.5}
    .module-chat{height:300px;overflow:auto;display:grid;align-content:start;gap:7px;padding:8px;border:1px solid #ded5cd;border-radius:14px;background:rgba(255,255,255,.36)}.module-bubble{max-width:78%;padding:9px 11px;border-radius:13px;background:#fff;font-size:11px;line-height:1.45}.module-bubble.mine{margin-left:auto;background:#efdad3}
    .module-quiz button{width:100%;text-align:left;margin-top:7px;border:1px solid #d9d0c7;background:rgba(255,255,255,.62);border-radius:11px;padding:10px;font-size:10px;cursor:pointer}.module-quiz button.correct{border-color:#7ea787;background:#edf6ee}.module-quiz button.wrong{border-color:#b98080;background:#f8eaea}
    body.night-mode .module-workspace{background:linear-gradient(180deg,rgba(31,29,28,.97),rgba(25,23,22,.98));color:#f3eee8}.night-mode .module-card,.night-mode .module-list-item,.night-mode .module-orbit-row,.night-mode .module-launcher,.night-mode .module-input,.night-mode .module-textarea,.night-mode .module-select,.night-mode .module-chat,.night-mode .calendar-board,.night-mode .calendar-day,.night-mode .dyk-card,.night-mode .dyk-option,.night-mode .trophy-entry,.night-mode .trophy-empty,.night-mode .module-update-privacy{border-color:#504943;background:rgba(45,41,39,.78);color:#f4eee8}.night-mode .module-heading{background:transparent;border-color:rgba(244,238,232,.22);color:inherit}.night-mode .module-heading p,.night-mode .module-card>p,.night-mode .module-list-item small,.night-mode .module-route,.night-mode .module-status,.night-mode .module-launcher small,.night-mode .dyk-source,.night-mode .dyk-side small,.night-mode .trophy-meta,.night-mode .trophy-empty p,.night-mode .trophy-field>span{color:#b6aaa2}.night-mode .module-back,.night-mode .module-action.ghost,.night-mode .trophy-entry-actions button{background:#302c2a;border-color:#514a45;color:#eee7e0}.night-mode .trophy-result,.night-mode .trophy-proof{color:#e8dfd8}.night-mode .module-bubble{background:#3b3633}.night-mode .module-bubble.mine{background:#5a3d3e}.night-mode .calendar-event-chip{background:#594746}
    @media(max-width:850px){.module-grid,.calendar-shell,.dyk-game,.trophy-page-grid{grid-template-columns:1fr}.module-card.wide{grid-column:1}.module-launchers{grid-template-columns:repeat(2,minmax(0,1fr))}.module-form.two,.module-form.three{grid-template-columns:1fr}.module-orbit{grid-template-columns:1fr}.module-heading{grid-template-columns:1fr}.module-heading-actions{justify-items:start;max-width:none}.module-badge{justify-self:start}.calendar-day{min-height:68px}.photo-strip{grid-template-columns:repeat(2,1fr)}}
    @media(max-width:560px){.calendar-board{padding:9px}.calendar-days,.calendar-weekdays{gap:2px}.calendar-day{min-height:52px;padding:4px}.calendar-event-chip{font-size:0;width:6px;height:6px;border-radius:50%;padding:0}.module-map{height:420px}.trophy-form-grid{grid-template-columns:1fr}.trophy-field.full{grid-column:1}.trophy-entry{grid-template-columns:1fr}.trophy-entry-actions{justify-content:flex-start}}

    .module-game-stage{grid-column:1/-1}
    .module-game-stage-head{display:flex;align-items:end;justify-content:space-between;gap:16px;margin-bottom:12px}
    .module-game-stage-head h2{margin:0 0 5px;font:400 24px/1 "CS Bergamot Stitched",Georgia,serif;text-transform:lowercase}
    .module-game-stage-head p{margin:0!important}
    .module-game-stage-head span{font:700 9px/1 system-ui;letter-spacing:.1em;text-transform:uppercase;color:#8b8179}
    .module-game-viewport{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;height:330px;overflow:hidden;position:relative;padding:3px 0;border-radius:16px;-webkit-mask-image:linear-gradient(to bottom,transparent 0,#000 7%,#000 93%,transparent 100%);mask-image:linear-gradient(to bottom,transparent 0,#000 7%,#000 93%,transparent 100%)}
    .module-game-track{display:flex;flex-direction:column;gap:9px;min-width:0;animation:biglwaModuleArcadeScroll 32s linear infinite}
    .module-game-track:nth-child(2){animation-duration:38s;animation-delay:-12s}
    .module-game-track:nth-child(3){animation-duration:35s;animation-delay:-21s}
    .module-game-tile{position:relative;display:block;flex:0 0 auto;height:94px;min-width:0;overflow:hidden;border:1px solid #ddd3ca;border-radius:13px;background:#eee5dc;box-shadow:0 7px 16px rgba(55,42,34,.1);text-decoration:none;color:#fff;transition:transform .18s ease,box-shadow .18s ease}
    .module-game-tile:hover{transform:translateY(-2px);box-shadow:0 10px 20px rgba(55,42,34,.16)}
    .module-game-tile img{display:block;width:100%;height:100%;object-fit:cover}
    .module-game-tile:after{content:"";position:absolute;inset:0;background:linear-gradient(to bottom,transparent 38%,rgba(22,17,16,.82))}
    .module-game-tile span{position:absolute;right:8px;bottom:8px;left:8px;z-index:1;overflow:hidden;font:700 11px/1.05 system-ui;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.55);white-space:nowrap;text-overflow:ellipsis}
    .module-game-tile small{position:absolute;right:8px;top:8px;z-index:1;padding:4px 6px;border-radius:999px;background:rgba(20,17,16,.62);font:700 8px/1 system-ui;color:#fff;opacity:0;transition:opacity .18s ease}
    .module-game-tile:hover small,.module-game-tile:focus-visible small{opacity:1}
    .module-game-stage .module-status{margin-top:10px}
    .module-game-submit{grid-column:1/-1}
    .module-game-submit h2{font:400 24px/1 "CS Bergamot Stitched",Georgia,serif;text-transform:lowercase}
    .module-game-form{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;align-items:end}
    .module-game-form label{display:block}
    .module-game-form label>span{display:block;margin:0 0 5px;font:700 8px/1.2 system-ui;letter-spacing:.08em;text-transform:uppercase;color:#8b8179}
    .module-game-form .module-action{min-height:36px}
    .module-game-submit-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:10px}
    .module-game-image-preview{display:block;width:52px;height:36px;object-fit:cover;border:1px solid #d8cec5;border-radius:7px;background:#eee5dc}
    .module-game-submit .module-status{margin:0}
    .night-mode .module-game-tile{border-color:#514a45;background:#302c2a}
    .night-mode .module-game-form label>span{color:#b6aaa2}
    @keyframes biglwaModuleArcadeScroll{from{transform:translateY(0)}to{transform:translateY(-50%)}}
    @media (prefers-reduced-motion:reduce){.module-game-track,.module-arcade-folder-depth::after{animation:none!important}}
    @media(max-width:850px){.module-game-viewport{height:290px}.module-game-form{grid-template-columns:1fr}}
    @media(max-width:560px){.module-game-stage{padding:15px 14px 108px!important;border-width:8px!important}.module-game-viewport{grid-template-columns:repeat(2,minmax(0,1fr));height:310px}.module-game-track:nth-child(3){display:none}.module-game-stage-head{grid-template-columns:1fr;justify-items:center;gap:3px;margin-inline:4px!important;padding-inline:18px}.module-game-stage-head>span{font-size:8px}.module-arcade-marquee img:first-child{height:67px!important}.module-arcade-controls{left:17px!important;right:17px!important;gap:16px!important}.module-arcade-joystick{transform:scale(.86);transform-origin:50% 100%}}

    .module-game-action{width:100%;padding:0;appearance:none;font:inherit;text-align:left;cursor:pointer}
    .module-game-action:focus-visible{outline:3px solid rgba(var(--aura-rgb,216,95,109),.75);outline-offset:3px}
    .module-culture-quiz[hidden]{display:none!important}
    .culture-quiz-head{display:flex;align-items:start;justify-content:space-between;gap:16px;margin-bottom:18px}
    .culture-quiz-progress{font:700 9px/1 system-ui;letter-spacing:.1em;text-transform:uppercase;color:#8b8179}
    .culture-quiz-question{max-width:760px;margin:13px 0 18px;font:500 clamp(22px,3vw,34px)/1.12 Georgia,serif}
    .culture-quiz-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
    .culture-quiz-options button{min-height:48px;border:1px solid #d9d0c7;background:rgba(255,255,255,.7);border-radius:12px;padding:11px 13px;text-align:left;font:600 11px/1.35 system-ui;color:inherit;cursor:pointer}
    .culture-quiz-options button:hover:not(:disabled){border-color:rgba(var(--aura-rgb,216,95,109),.6);transform:translateY(-1px)}
    .culture-quiz-options button.correct{background:#edf6ee;border-color:#7ea787}
    .culture-quiz-options button.wrong{background:#f8eaea;border-color:#b98080}
    .culture-quiz-options button:disabled{cursor:default}
    .culture-quiz-feedback{min-height:24px;margin-top:14px;font-size:11px;line-height:1.6;color:#6e655f}
    .culture-quiz-source{display:block;margin-top:6px;font-size:9px}
    .culture-quiz-source a{color:inherit;text-underline-offset:3px}
    .culture-quiz-feedback .module-action{display:block;margin-top:12px}
    .culture-quiz-result{padding:18px 0 8px}
    .culture-quiz-result>p:last-of-type{color:#766c66;font-size:12px}
    .culture-quiz-score{margin:14px 0 4px;font:500 clamp(44px,8vw,70px)/1 Georgia,serif}
    .module-game-form{grid-template-columns:1fr;align-items:stretch}
    .module-game-source-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
    .module-game-source-grid label{min-width:0}
    .module-game-source-grid label>small{display:block;margin-top:5px;color:#8b8179;font-size:9px}
    .module-file-input{font-size:10px}
    .module-game-submit-row{align-items:center}
    .module-game-image-preview{width:72px;height:52px;flex:0 0 auto}
    .night-mode .culture-quiz-options button{border-color:#514a45;background:#302c2a;color:#f4eee8}
    .night-mode .culture-quiz-options button.correct{background:#294335;border-color:#648e6e}
    .night-mode .culture-quiz-options button.wrong{background:#4a3030;border-color:#a66c6c}
    .night-mode .culture-quiz-feedback,.night-mode .culture-quiz-result>p:last-of-type{color:#c3b8b0}
    .night-mode .culture-quiz-progress,.night-mode .module-game-source-grid label>small{color:#b6aaa2}
    @media(max-width:850px){.module-game-source-grid{grid-template-columns:1fr}}
    @media(max-width:560px){.culture-quiz-options{grid-template-columns:1fr}.culture-quiz-head{align-items:start}}
    
    .politc-live-track{display:flex;width:100%;height:19px;overflow:hidden;border-radius:12px;background:#ddd5c9;border:1px solid #aa9d90}
    .politc-live-track>span{display:block;height:100%;flex:none}
    .politc-live-chamber{display:grid;gap:8px;margin:13px 0;padding:8px 0}
    .politc-live-chamber>strong{font:700 17px Georgia,serif}
    .politc-live-chamber>small{font:600 12px/1.4 system-ui}
    .politc-live-progress{height:20px;width:100%;overflow:hidden;background:#ddd6ce;border-radius:13px;border:1px solid #ab9c8f;margin:12px 0}
    .politc-live-progress>span{display:block;height:100%;background:#6e5f7c;transition:width .3s ease}
    .politc-live-state{padding:10px 0;min-height:60px}
    /* Widget pages share the Studio customization and carry the blur through the page edge. */
    .module-workspace{position:relative;isolation:isolate;border-radius:0;min-height:calc(100vh - 66px);padding-bottom:54px;-webkit-backdrop-filter:blur(var(--widget-blur,18px));backdrop-filter:blur(var(--widget-blur,18px));background:linear-gradient(180deg,color-mix(in srgb,var(--widget-bg,rgba(246,240,233,.94)) 96%,transparent) 0%,color-mix(in srgb,var(--widget-bg,rgba(239,231,223,.96)) 92%,transparent) 100%);color:var(--widget-ink,#272321)}
    .module-workspace:before{content:none}
    .module-workspace>*{position:relative;z-index:1}
    .module-workspace:after{content:"";display:block;width:min(100%,1160px);height:1px;margin:24px auto 0;background:linear-gradient(90deg,transparent,rgba(117,92,79,.16) 7%,rgba(117,92,79,.16) 93%,transparent)}
    body.night-mode .module-workspace{background:linear-gradient(180deg,color-mix(in srgb,var(--widget-bg,rgba(31,29,28,.97)) 96%,#191716) 0%,color-mix(in srgb,var(--widget-bg,rgba(25,23,22,.96)) 92%,#191716) 100%)}
    .module-page-aura{display:none}
    .main.module-view{padding-bottom:0!important}
    .main.module-view>.module-page-aura{display:block;position:relative;z-index:4;height:min(380px,46vh);min-height:230px;margin:0;pointer-events:none;background:linear-gradient(to top,rgba(var(--aura-rgb,216,95,109),.48) 0%,rgba(var(--aura-rgb,216,95,109),.18) 43%,transparent 100%)}
    body.night-mode .module-workspace:after{background:linear-gradient(90deg,transparent,rgba(224,210,199,.17) 12%,rgba(224,210,199,.17) 88%,transparent)}
    body.night-mode #studioApp .calendar-mini{border-color:rgba(255,255,255,.12);background:rgba(255,255,255,.045)}
    body.night-mode #studioApp .calendar-mini-grid span{background:rgba(255,255,255,.075);color:var(--widget-ink,#f4eee8)}
    .module-workspace .module-card,.module-workspace .calendar-board,.module-workspace .dyk-card,.module-workspace .trophy-entry,.module-workspace .module-launcher,.module-workspace .module-orbit-row{background:var(--widget-bg,rgba(255,255,255,.58));color:var(--widget-ink,#272321);border-radius:var(--widget-radius,16px);border-color:rgba(var(--aura-rgb,216,95,109),.18);-webkit-backdrop-filter:blur(var(--widget-blur,18px));backdrop-filter:blur(var(--widget-blur,18px))}
    .module-workspace .module-heading h1,.module-workspace .module-card h2,.module-workspace .module-card h3,.module-workspace .module-launcher b,.module-workspace .calendar-toolbar h2,.module-workspace .trophy-entry h3,.module-workspace .culture-quiz-question{font-family:"CS Bergamot Stitched",Georgia,"Times New Roman",serif!important;font-weight:400!important;letter-spacing:.01em!important;text-transform:lowercase!important}
    body.night-mode .module-workspace .module-heading h1,body.night-mode .module-workspace .module-card h2,body.night-mode .module-workspace .module-card h3,body.night-mode .module-workspace .module-qwiky-label strong{font-family:"CS Bergamot Stitched",Georgia,"Times New Roman",serif!important;font-synthesis:none!important;letter-spacing:0!important;text-shadow:none!important}
    .module-workspace .module-action{background:rgb(var(--aura-rgb,216,95,109));color:var(--aura-button-ink,#fff)}
    .module-workspace .module-card:has(.diary-lined){border:9px solid #111113;border-left-width:18px;background-color:#0b0b0d;background-image:url("/assets/composition-texture.webp?v=20260917-composition-2");background-size:340px 227px;background-blend-mode:normal;box-shadow:inset 6px 0 0 rgba(255,255,255,.25),0 14px 30px rgba(0,0,0,.28)}
    .module-workspace .module-diary-cover-label{position:relative;display:grid;gap:7px;width:min(420px,calc(100% - 28px));margin:0 0 18px;padding:18px 22px 17px;border:4px double #171717;border-radius:4px 15px 15px 4px;background:#fff;color:#111;box-shadow:0 6px 0 rgba(0,0,0,.2);transform:rotate(-.35deg)}
    .module-workspace .module-diary-cover-label::before,.module-workspace .module-diary-cover-label::after{content:"";position:absolute;left:22px;right:22px;height:2px;background:#171717;opacity:.72}.module-workspace .module-diary-cover-label::before{top:58px}.module-workspace .module-diary-cover-label::after{top:91px}
    .module-workspace .module-diary-cover-label strong,.module-workspace .module-diary-cover-label span{position:relative;z-index:1;font-family:"Arial Rounded MT Bold","Comic Sans MS",Impact,sans-serif;font-weight:900;letter-spacing:-.035em}.module-workspace .module-diary-cover-label strong{font-size:31px;line-height:1}.module-workspace .module-diary-cover-label span{font-size:15px;line-height:1.1}
    .module-workspace .module-card:has(.diary-lined) .diary-lined{border:3px solid #171717;background-color:#fffdf4;color:#2f2a27;box-shadow:0 7px 0 rgba(0,0,0,.2)}
    .module-workspace[data-module-key="diary"] .module-status{display:inline-block;margin-top:12px;padding:6px 9px;border-radius:999px;background:rgba(10,10,12,.82);color:#fff}
    .module-workspace .module-game-stage{position:relative;padding:24px 24px 118px;border:11px solid #1b0e0c;border-radius:34px 34px 18px 18px;background:linear-gradient(90deg,#25120f,#65382a 13%,#784b38 50%,#603226 87%,#21100e);clip-path:none;box-shadow:inset 0 0 0 3px rgba(255,218,145,.14),inset 0 -88px 0 rgba(17,9,8,.58),inset 17px 0 20px rgba(0,0,0,.22),inset -17px 0 20px rgba(0,0,0,.22),0 24px 38px rgba(34,23,18,.27)}
    /* A real two-layer manila folder: raised back tab, recessed lip, and textured front. */
    .module-workspace .module-arcade-folder-depth{--folder-front:#f4cb5d;position:relative;isolation:isolate;overflow:hidden;margin:0 18px;padding:39px 12px 12px;border:5px solid #150d0b;border-radius:22px 22px 12px 12px;background:linear-gradient(140deg,#a97936,#835325 65%,#69421e);box-shadow:inset 0 0 0 3px rgba(255,255,255,.08),0 8px 0 #120b0a,0 14px 22px rgba(0,0,0,.25)}
    .module-workspace .module-arcade-folder-depth::before{content:"";position:absolute;z-index:1;top:9px;left:15px;width:44%;height:44px;border:1px solid #b48433;border-radius:9px 12px 0 0;clip-path:polygon(0 0,85% 0,100% 56%,100% 100%,0 100%);background:repeating-linear-gradient(115deg,rgba(105,59,11,.045) 0 1px,transparent 1px 8px),linear-gradient(150deg,#f9dd8c,#e6ad45);box-shadow:inset 0 2px 1px rgba(255,255,255,.42)}
    .module-workspace .module-arcade-folder-depth::after{content:"";position:absolute;z-index:1;top:34px;left:13px;right:13px;height:17px;pointer-events:none;border-radius:6px;background:linear-gradient(#eab85a,#bb8531);box-shadow:0 3px 7px rgba(69,35,10,.23)}
    .module-workspace .module-game-stage-head{position:relative;z-index:2;isolation:isolate;overflow:hidden;display:block;min-height:147px;margin:0;padding:0;border:2px solid #daae4c;border-radius:10px 14px 12px 12px;background:repeating-linear-gradient(115deg,rgba(115,70,20,.035) 0 1px,transparent 1px 7px),linear-gradient(155deg,#ffe28d 0%,#f5cf65 59%,#e9b44f 100%);color:#1c1410;box-shadow:inset 0 2px 1px rgba(255,255,229,.66),inset 0 -5px 8px rgba(137,79,15,.14),0 3px 0 #b98a38,0 7px 10px rgba(59,32,12,.26)}
    .module-workspace .module-game-stage-head::before{content:"";position:absolute;inset:8px;z-index:3;pointer-events:none;border:1px solid rgba(165,109,25,.20);border-radius:7px 10px 9px 9px}
    .module-workspace .module-game-stage-head::after{content:none}
    .module-workspace .module-arcade-marquee{position:absolute;inset:0;z-index:4;pointer-events:none}.module-workspace .module-arcade-marquee img{position:absolute;display:block;height:auto!important;max-height:94px!important;object-fit:contain;object-position:center;margin:0}.module-workspace .module-arcade-marquee img:first-child{left:50%;top:51%;right:auto!important;width:clamp(92px,15%,170px)!important;transform:translate(-50%,-50%)}.module-workspace .module-arcade-marquee img:nth-child(2){top:-28px;right:4%;width:min(34%,210px);transform:none;filter:drop-shadow(0 4px 3px rgba(28,12,8,.36))}
    .module-workspace .module-arcade-wordmark{position:absolute;top:6px;right:17px;z-index:5;color:#ffefc1;text-shadow:1px 2px 0 #8e2120,2px 3px 0 #391514;font:900 clamp(12px,1.8vw,23px)/1 Impact,"Arial Black",sans-serif;letter-spacing:.075em;pointer-events:none}
    .module-workspace .module-game-stage-head>span{position:absolute;right:27px;bottom:14px;z-index:5;color:#564426!important}
    .module-workspace .module-game-stage-head p{color:#564426!important}
    .module-workspace .module-game-viewport{isolation:isolate;height:clamp(440px,50vw,560px);margin-top:19px;padding:14px;border:14px solid #141111;border-radius:17px;background:#020506;clip-path:none;outline:6px solid rgba(46,20,16,.7);outline-offset:0;box-shadow:inset 0 30px 35px rgba(0,0,0,.84),inset 25px 0 32px rgba(0,0,0,.72),inset -25px 0 32px rgba(0,0,0,.72),inset 0 -24px 30px rgba(0,0,0,.68),0 9px 0 #0c0807,0 17px 27px rgba(0,0,0,.3);-webkit-mask-image:none;mask-image:none}
    .module-workspace .module-game-viewport::after{content:"";position:absolute;inset:0;z-index:8;border-radius:2px;pointer-events:none;background:linear-gradient(to bottom,rgba(0,0,0,.65),transparent 12%,transparent 87%,rgba(0,0,0,.56)),linear-gradient(to right,rgba(0,0,0,.54),transparent 9%,transparent 91%,rgba(0,0,0,.54));box-shadow:inset 0 0 38px 15px rgba(0,0,0,.48),inset 0 0 4px 1px rgba(102,225,229,.18)}
    .module-workspace .module-game-stage::before{content:none}
    .module-workspace .module-game-stage::after{content:none}
    .module-workspace .module-arcade-controls{position:absolute;left:28px;right:28px;bottom:17px;display:flex;align-items:end;justify-content:center;gap:28px;height:75px;background:transparent;overflow:visible}
    .module-workspace .module-arcade-controls::before{content:"";position:absolute;inset:0;z-index:0;border-top:5px solid #170d0b;border-radius:17px 17px 12px 12px;background:linear-gradient(180deg,#85513d 0%,#744332 54%,#5d352b 100%);box-shadow:inset 0 6px 9px rgba(255,220,164,.11),inset 0 -6px 9px rgba(12,6,5,.2);filter:drop-shadow(0 -5px 0 #180d0b) drop-shadow(0 7px 4px rgba(0,0,0,.24));pointer-events:none}
    .module-workspace .module-arcade-joystick{--stick:#dd5c70;position:relative;bottom:20px;z-index:2;width:44px;height:68px;filter:drop-shadow(0 5px 2px rgba(0,0,0,.35))}.module-workspace .module-arcade-joystick::before{content:"";position:absolute;left:50%;top:23px;width:8px;height:34px;border-radius:5px;background:linear-gradient(90deg,#171313,#5b5b5b,#151111);transform:translateX(-50%)}.module-workspace .module-arcade-joystick::after{content:"";position:absolute;left:50%;top:0;width:31px;height:31px;border-radius:50%;background:radial-gradient(circle at 36% 27%,rgba(255,255,255,.58),transparent 24%),var(--stick);box-shadow:inset -5px -6px 8px rgba(0,0,0,.22),0 0 0 2px rgba(17,10,9,.58);transform:translateX(-50%)}.module-workspace .module-arcade-joystick>i{position:absolute;left:50%;bottom:5px;width:40px;height:14px;border:3px solid #140c0a;border-radius:50%;background:#281714;transform:translateX(-50%);box-shadow:inset 0 2px 0 rgba(255,255,255,.1)}
    .module-workspace .module-arcade-joystick.is-yellow{--stick:#efc548}.module-workspace .module-arcade-joystick.is-red{--stick:rgb(var(--aura-rgb,216,95,109))}.module-workspace .module-arcade-joystick.is-green{--stick:#5ca975}
    @media(max-width:560px){.module-workspace .module-arcade-folder-depth{margin-inline:4px;padding:31px 7px 9px}.module-workspace .module-arcade-folder-depth::before{top:7px;left:9px;width:48%;height:37px}.module-workspace .module-arcade-folder-depth::after{top:29px;left:8px;right:8px}.module-workspace .module-game-viewport{height:420px;padding:9px;border-width:10px}.module-workspace .module-game-stage-head{min-height:102px;margin:0!important}.module-workspace .module-game-stage-head>span{display:none}.module-workspace .module-arcade-marquee img:first-child{width:clamp(72px,23%,118px)!important;max-height:72px!important}.module-workspace .module-arcade-marquee img:nth-child(2){top:-19px;width:min(34%,150px)}}
    /* Games run inside the cabinet now, in the emulator screen, instead of sending the reader
       off to a whole other site. Play keeps them here; the Open ↗ link stays as the escape
       hatch, styled the same as the converter links on the Tools page. */
    .module-workspace .module-arcade-play{padding:24px!important}
    .module-workspace .module-arcade-screen{position:relative;isolation:isolate;height:clamp(340px,46vw,560px);margin-top:19px;border:10px solid #141111;border-radius:16px;background:#020506;overflow:hidden;box-shadow:inset 0 0 0 1px rgba(102,225,229,.16),inset 0 24px 30px rgba(0,0,0,.8);resize:both;min-width:240px;min-height:200px;max-width:100%}
    .module-workspace .module-arcade-screen::after{content:"BIG LWA";position:absolute;right:0;bottom:0;left:0;z-index:1;padding:5px 10px;background:linear-gradient(to top,rgba(0,0,0,.72),transparent);color:#d9f7f8;font:800 7px/1 system-ui;letter-spacing:.18em;text-transform:uppercase;pointer-events:none;opacity:.7}
    .module-workspace .module-arcade-screen iframe{display:block;width:100%;height:100%;border:0;background:#fff;transform-origin:top left}
    .module-arcade-deck{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:16px}
    .module-arcade-play .module-game-stage-head>span{position:static;display:block;margin-top:10px;color:#564426!important}
    /* The animated carousel and selected game share the SAME cabinet screen. */
    .module-workspace .module-game-viewport.is-playing{display:flex!important;flex-direction:column;gap:0;padding:0!important;overflow:hidden!important;animation:none!important}
    .module-workspace .module-game-viewport.is-playing::after{pointer-events:none}
    .module-workspace .module-game-viewport.is-playing>.arcade-player-head{z-index:9;display:flex;align-items:center;justify-content:space-between;gap:12px;background:#221b19;color:#fff2d8;padding:9px 12px;font:700 12px/1.3 system-ui}
    .module-workspace .module-game-viewport.is-playing>.arcade-player-head strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n    .module-workspace .arcade-unavailable{display:grid;place-content:center;gap:12px;height:100%;min-height:200px;background:#171313;color:#fff2d8;text-align:center;padding:24px}.module-workspace .arcade-unavailable p{max-width:480px;font:12px/1.5 system-ui}.module-workspace .arcade-unavailable a,.module-workspace .arcade-unavailable button{justify-self:center}
    .module-workspace .module-game-viewport.is-playing>iframe{z-index:2;display:block;border:0;background:#fff;width:100%;flex:1;min-height:0}
    .module-workspace .module-game-viewport.is-playing>.arcade-player-deck{z-index:9;display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:9px 12px;background:#221b19;color:#fff2d8}
    .module-workspace .arcade-player-deck span{margin-right:auto;font:600 10px/1.4 system-ui;opacity:.85}
    .module-workspace .module-game-viewport.is-quiz{display:block!important;overflow-y:auto!important;background:#efe8dd;padding:12px!important}
    .module-workspace .module-game-viewport.is-quiz .module-culture-quiz{display:block!important;margin:0!important;min-height:100%;background:transparent}
    .module-workspace .module-game-viewport.is-quiz .arcade-return{margin:0 0 12px}
    .module-workspace .module-game-viewport:fullscreen{width:100vw;height:100vh;max-height:none;border-radius:0}
    @media(max-width:560px){.module-workspace .arcade-player-deck span{flex-basis:100%}}
    /* Link launcher: never show a browser "refused to connect" frame by default. */
    .module-workspace .module-game-viewport.is-launcher{background:#160e0d;color:#fff1d7}
    .module-workspace .arcade-game-launcher{z-index:3;display:flex;flex-direction:column;flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:clamp(12px,2.2vw,24px);gap:20px}
    .module-workspace .arcade-game-feature{display:grid;grid-template-columns:minmax(120px,.65fr) minmax(220px,1fr);align-items:center;gap:clamp(12px,2.8vw,32px);flex:1}
    .module-workspace .arcade-game-cover{width:100%;height:clamp(180px,23vw,285px);object-fit:cover;border:3px solid #edcf8a;border-radius:15px;background:#3b2820;box-shadow:5px 5px 0 #795f3c}
    .module-workspace .arcade-game-details{min-width:0}
    .module-workspace .arcade-game-provider{display:block;color:#efc76d;font:700 10px/1.3 system-ui;text-transform:uppercase;letter-spacing:.12em}
    .module-workspace .arcade-game-details h3{color:#fff5dd;font:400 clamp(24px,3.8vw,42px)/1.08 "CS Bergamot Stitched",Georgia,serif;margin:8px 0 13px;text-transform:lowercase}
    .module-workspace .arcade-game-details p{color:#e0d3c4;font:500 12px/1.65 system-ui;margin:0 0 14px;max-width:440px}
    .module-workspace .arcade-game-launch-actions{display:flex;flex-wrap:wrap;gap:8px}
    .module-workspace .arcade-game-launch-actions a,.module-workspace .arcade-game-launch-actions button,.module-workspace .arcade-game-links button{min-height:38px}
    .module-workspace .arcade-game-notice{display:block;margin:10px 0 0;color:#d9c2aa;font:500 10px/1.5 system-ui}
    .module-workspace .arcade-game-links{border-top:1px solid #795f3c;padding-top:12px}
    .module-workspace .arcade-game-links>span{font:700 10px/1.2 system-ui;text-transform:uppercase;letter-spacing:.12em;color:#efc76d}
    .module-workspace .arcade-game-quicklinks{display:flex;gap:10px;overflow-x:auto;padding:10px 1px 5px;scrollbar-width:thin}
    .module-workspace .arcade-quickgame{flex:0 0 110px;display:grid;gap:4px;min-height:0!important;padding:5px;border:1px solid #6e5a49;border-radius:10px;background:#30221e;color:#fff1d7;text-align:left;cursor:pointer}
    .module-workspace .arcade-quickgame.is-current{border-color:#efc76d;box-shadow:inset 0 0 0 1px #efc76d}
    .module-workspace .arcade-quickgame img{display:block;width:100%;height:50px;border-radius:6px;object-fit:cover}
    .module-workspace .arcade-quickgame span{font:600 10px/1.3 system-ui;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
    .module-workspace .arcade-quickgame:focus-visible{outline:3px solid #efc76d;outline-offset:2px}
    @media(max-width:690px){.module-workspace .arcade-game-feature{grid-template-columns:1fr}.module-workspace .arcade-game-cover{height:170px;object-position:center}.module-workspace .arcade-game-launcher{gap:14px}.module-workspace .arcade-game-details h3{font-size:25px}}

    /* Collapsible directory: native details/summary handles keyboard, pointer and touch. */
    .module-game-directory details{width:100%}
    .module-game-directory .arcade-directory-toggle{display:flex;gap:12px;align-items:center;cursor:pointer;list-style:none;padding:4px 2px 8px;user-select:none}
    .module-game-directory .arcade-directory-toggle::-webkit-details-marker{display:none}
    .module-game-directory .arcade-directory-toggle>span:first-child{font:400 24px/1.2 "CS Bergamot Stitched",Georgia,serif;text-transform:lowercase}
    .module-game-directory .arcade-directory-toggle small{font:600 11px/1.35 system-ui;color:#74675e;margin-left:auto}
    .module-game-directory .arcade-directory-chevron{font:700 24px/1 system-ui;transition:transform .2s ease;transform:rotate(0deg)}
    .module-game-directory details[open] .arcade-directory-chevron{transform:rotate(180deg)}
    .module-game-directory .arcade-directory-toggle:focus-visible{outline:3px solid #a53332;outline-offset:4px;border-radius:5px}
    .module-game-directory details>p{margin:2px 0 12px}
    .night-mode .module-game-directory .arcade-directory-toggle small{color:#ddd0c1}
    .module-game-directory h2{font:400 24px/1 "CS Bergamot Stitched",Georgia,serif;text-transform:lowercase}
    .module-game-directory-list{display:grid;gap:6px;margin-top:12px}
    .module-game-directory-row{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid #e5dccf;background:rgba(255,255,255,.55);border-radius:11px;padding:8px 10px}
    .module-game-directory-row b{display:flex;align-items:center;gap:9px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:700 11px/1.3 system-ui;color:#3a332f}
    .module-game-directory-row b img{width:34px;height:20px;flex:0 0 auto;object-fit:cover;border-radius:4px;background:#eee5dc}
    .module-game-directory-actions{display:flex;align-items:center;gap:6px;flex:0 0 auto}
    .night-mode .module-game-directory-row{border-color:#514a45;background:#302c2a}
    .night-mode .module-game-directory-row b{color:#e9e2da}
    @media(max-width:560px){.module-workspace .module-arcade-screen{height:420px;border-width:8px}.module-game-directory-row{align-items:flex-start;flex-direction:column}.module-game-directory-actions{flex-wrap:wrap}}
    .module-station-preview{position:relative;isolation:isolate;height:clamp(250px,40vw,510px);margin:20px 0 0;overflow:hidden;border:9px solid #181313;border-radius:22px;background:#120d10;box-shadow:inset 0 0 0 2px rgba(255,255,255,.06),0 17px 34px rgba(25,15,17,.22)}
    .module-station-preview::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,8,12,.04),rgba(8,8,12,.12) 50%,rgba(8,8,12,.85));pointer-events:none}
    .module-station-preview img{display:block;width:100%;height:100%;object-fit:cover;object-position:center;filter:saturate(.98) contrast(1.06)}
    .module-station-preview figcaption{position:absolute;right:24px;bottom:22px;left:24px;z-index:2;display:flex;align-items:end;justify-content:space-between;gap:16px;color:#fff}
    .module-station-preview figcaption span{display:inline-flex;align-items:center;gap:7px;padding:7px 10px;border:1px solid rgba(255,255,255,.18);border-radius:999px;background:rgba(14,10,13,.66);font:800 9px/1 Inter,ui-sans-serif,system-ui,sans-serif;letter-spacing:.13em;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
    .module-station-preview figcaption span i{width:7px;height:7px;border-radius:50%;background:#ef5d72;box-shadow:0 0 10px rgba(239,93,114,.82)}
    .module-station-preview figcaption strong{font:400 clamp(28px,5vw,54px)/.9 "CS Bergamot Stitched",Georgia,"Times New Roman",serif;text-shadow:0 3px 18px rgba(0,0,0,.92)}
    .module-workspace[data-module-key="notes"] .module-card:has(.qwiky-note-input){position:relative;overflow:hidden;border-radius:4px 4px 24px 4px;background:linear-gradient(145deg,#fff6a5,#f0d660);color:#3b3020;box-shadow:0 18px 35px rgba(70,52,22,.18);transform:rotate(-.25deg)}
    .module-workspace[data-module-key="notes"] .module-card:has(.qwiky-note-input)::after{content:"";position:absolute;right:0;bottom:0;width:52px;height:52px;background:linear-gradient(135deg,rgba(159,125,44,.30) 0 49%,#fff5a1 50%);filter:drop-shadow(-3px -3px 3px rgba(79,57,22,.10));pointer-events:none}
    .module-qwiky-label{display:flex;align-items:end;justify-content:space-between;gap:16px;margin-bottom:14px;padding-bottom:11px;border-bottom:1px solid rgba(93,68,28,.2)}
    .module-qwiky-label strong{font:400 clamp(26px,4vw,43px)/.9 "CS Bergamot Stitched",Georgia,"Times New Roman",serif;text-transform:lowercase}
    .module-qwiky-label span{color:#715c36;font:800 8px/1 Inter,ui-sans-serif,system-ui,sans-serif;letter-spacing:.11em;text-transform:uppercase}
    .module-workspace .qwiky-note-input{min-height:380px;border:0;border-radius:0;background:repeating-linear-gradient(to bottom,transparent 0,transparent 31px,rgba(111,82,33,.16) 32px);color:#3b3020;font:19px/32px "Comic Sans MS","Bradley Hand","Segoe Print",cursive;padding:8px 14px;box-shadow:none;resize:vertical}
    .module-workspace .qwiky-note-input:focus{border:0;box-shadow:inset 0 0 0 2px rgba(109,79,29,.16)}
    .module-workspace[data-module-key="notes"] .module-status{color:#705b36}
    body.night-mode .module-workspace[data-module-key="notes"] .module-card:has(.qwiky-note-input){filter:saturate(.82) brightness(.82)}
    @media(max-width:620px){.module-station-preview{height:260px;border-width:6px}.module-station-preview figcaption{right:14px;bottom:14px;left:14px}.module-qwiky-label{align-items:start;flex-direction:column}.module-workspace .qwiky-note-input{min-height:310px;font-size:17px}}
    @keyframes biglwaModuleArcadeStatic{0%{transform:translate(0,0)}25%{transform:translate(4%,-3%)}50%{transform:translate(-3%,4%)}75%{transform:translate(2%,3%)}100%{transform:translate(-2%,-2%)}}
  `;
  document.head.appendChild(style);

  const workspace = document.createElement('section');
  workspace.id = 'moduleWorkspace';
  workspace.className = 'module-workspace';
  workspace.hidden = true;
  workspace.innerHTML = `<div class="module-shell"><div class="module-top"><button class="module-back" id="moduleBack" type="button">← Studio</button><span class="module-route">BIGLWA / Studio / <b id="moduleRouteName">Module</b></span></div><div id="moduleWorkspaceBody"></div></div>`;
  const footer = $('.site-policy-footer', main);
  if (footer) main.insertBefore(workspace, footer); else main.appendChild(workspace);
  const pageAura = document.createElement('div');
  pageAura.className = 'module-page-aura';
  pageAura.setAttribute('aria-hidden','true');
  if (footer) main.insertBefore(pageAura, footer); else main.appendChild(pageAura);

  const body = $('#moduleWorkspaceBody');
  const routeName = $('#moduleRouteName');
  const moduleBack = $('#moduleBack');
const known = new Set(['create','veve','calendar','orbit','feed','connect','camera','diary','stream','library','archive','closet','trophies','rooms','room','boards','notes','projects','project','games','learn','didyouknow','map','tools','reviews','politc']);
const labels = {create:'Create',veve:'veve',calendar:'Calendar',orbit:'Orbit',feed:'Feed',connect:'Connect',camera:'Photobooth',diary:'Journal',stream:'Stream',library:'Library',archive:'Archive',closet:'Closet',trophies:'Trophies',rooms:'The Lounge',room:'The Lounge',boards:'Boards',notes:'Sqwib Note',projects:'Projects',project:'Projects',games:'Games',learn:'Did You Know?',didyouknow:'Did You Know?',map:'Map',tools:'Tools',reviews:'Wallpaper Reviews',politc:'politc'};
  const desc = {create:'Start something and send it to the right part of BIGLWA.',veve:'Public discovery, user-selected sections and shared culture, shaped by real posts.',calendar:'Your events and deadlines, with Google Calendar managed through Orbit.',orbit:'Connect Instagram, TikTok, and Pinterest, and keep every other profile link in one place as a shareable link list.',feed:'Publish a picture and a caption to the collective feed.',connect:'Invite friends to join BIGLWA.',camera:'A real browser photobooth: start the camera, pose, capture, retake, and save a frame without uploading it.',diary:'A private writing page that autosaves in this browser.',stream:'Tune into LWA Radio, LWA TV, Live and Ballroom / CCTV—independent videos, campus stations, mixtapes and Twitch.',library:'Build a returnable shelf of texts, PDFs, links, cases, and research.',archive:'Record materials worth preserving with enough context to find them again.',closet:'Draft preloved or creative listings and keep a Depop connection path beside them.',trophies:'Keep awards, achievements, athletic results, race finishes, and the links that verify them in one personal trophy case.',rooms:'A shared-space prototype for conversation and working together.',boards:'Create visual/reference boards with names and context.',notes:'A fast private sticky note that autosaves.',projects:'Track projects and collaborative work in progress.',games:'Small culture games and learning interactions.',learn:'A playable Did You Know? deck with answers, score, context, and sources.',map:'Pin places, memories, and projects. Your saved map stays in this browser.',tools:'Drop a file and it works out what to offer: convert video and audio, compress PDFs and images, or hand anything else to a converter online.',politc:'The people, politics, and power board — community nominations, the pendulum, voting resources, and world news.'};

  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const readJSON = (k, fallback=[]) => { try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(fallback)); } catch { return fallback; } };
  const writeJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const quietUpdateKey = key => `biglwaQuietUpdate_${key}`;
  const heading = (key, extra='') => `<div class="module-heading"><div><h1>${esc(labels[key] || key)}</h1><p>${esc(desc[key] || 'A working BIGLWA space.')}${extra ? ` <strong>${esc(extra)}</strong>` : ''}</p></div><div class="module-heading-actions"><span class="module-badge">working page</span><label class="module-update-privacy"><input type="checkbox" data-silent-update="${esc(key)}" ${localStorage.getItem(quietUpdateKey(key))==='1'?'checked':''}><span>Do not notify followers/connections of this update</span></label></div></div>`;
  const recordStudioUpdate = (key, title, detail='') => {
    const silent=$(`[data-silent-update="${CSS.escape(key)}"]`,body)?.checked||false;
    window.dispatchEvent(new CustomEvent('biglwa:studio-update',{detail:{title,source:labels[key]||key,detail,notified:!silent}}));
  };
  const listHtml = (items, type='item') => items.length ? items.map((x,i)=>`<div class="module-list-item"><div><b>${esc(x.title || x.name || x.text || type)}</b><small>${esc(x.meta || x.detail || x.date || '')}</small></div><button type="button" data-remove-item="${i}" aria-label="Remove">remove</button></div>`).join('') : `<div class="module-status">Nothing saved yet.</div>`;
  const safeOpen = url => { if(!url) return; const target=/^https?:\/\//i.test(url)?url:`https://${url}`; window.open(target,'_blank','noopener'); };
  const TROPHY_STORAGE = 'biglwaTrophiesV1';
  const trophyKinds = {'award':'Award','honor':'Honor / distinction','scholarship':'Scholarship / fellowship','achievement':'Achievement','milestone':'Personal milestone','record':'Record / personal best','race':'Race / marathon','athletic-result':'Athletic result','license':'License','certification':'Certification','diploma':'Diploma','degree':'Degree','ged':'GED / equivalency'};
  const trophyKindValue = value => Object.prototype.hasOwnProperty.call(trophyKinds,String(value||'')) ? String(value) : 'achievement';
  const trophyMonthValue = value => {const match=String(value||'').trim().match(/^(\d{4})-(0[1-9]|1[0-2])/);return match?`${match[1]}-${match[2]}`:''};
  const readTrophies = () => {
    const value=readJSON(TROPHY_STORAGE,[]);
    if(!Array.isArray(value))return [];
    return value.filter(item=>item&&typeof item==='object'&&String(item.title||'').trim()).map(item=>({title:String(item.title||'').trim(),kind:trophyKindValue(item.kind),organization:String(item.organization||'').trim(),date:trophyMonthValue(item.date),result:String(item.result||'').trim(),url:String(item.url||'').trim()}));
  };
  const normalizeExternalUrl = raw => {
    const value=String(raw||'').trim();if(!value)return '';
    if(/^[a-z][a-z0-9+.-]*:/i.test(value)&&!/^https?:\/\//i.test(value))return null;
    try{const parsed=new URL(/^https?:\/\//i.test(value)?value:`https://${value}`);return parsed.protocol==='http:'||parsed.protocol==='https:'?parsed.href:null}catch{return null}
  };
  const formatTrophyDate = value => {
    const month=trophyMonthValue(value);if(!month)return '';
    const [year,index]=month.split('-').map(Number),date=new Date(Date.UTC(year,index-1,1));
    return date.toLocaleDateString(undefined,{year:'numeric',month:'long',timeZone:'UTC'});
  };
  const trophyProofLabel = url => {
    try{const host=new URL(url).hostname.toLowerCase().replace(/^www\./,'');return host==='athletic.net'||host.endsWith('.athletic.net')?'View on Athletic.net ↗':'View result or proof ↗'}catch{return 'View result or proof ↗'}
  };
  const trophyEntriesMarkup = items => items.length ? items.map((item,index)=>{
    const kind=trophyKindValue(item.kind),meta=[item.organization,formatTrophyDate(item.date)].filter(Boolean).join(' · '),url=normalizeExternalUrl(item.url);
    return `<article class="trophy-entry kind-${kind}"><div><div class="trophy-entry-head"><span class="trophy-kind">${esc(trophyKinds[kind])}</span><h3>${esc(item.title)}</h3></div>${meta?`<p class="trophy-meta">${esc(meta)}</p>`:''}${item.result?`<p class="trophy-result">${esc(item.result)}</p>`:''}${url?`<a class="trophy-proof" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(trophyProofLabel(url))}</a>`:''}</div><div class="trophy-entry-actions"><button type="button" data-trophy-edit="${index}" aria-label="Edit ${esc(item.title)}">edit</button><button type="button" data-trophy-remove="${index}" aria-label="Remove ${esc(item.title)}">remove</button></div></article>`;
  }).join('') : `<div class="trophy-empty"><div><span class="trophy-empty-mark" aria-hidden="true">★</span><b>Your trophy case is ready.</b><p>Add an award, personal milestone, athletic result, or completed marathon when you have one to celebrate.</p></div></div>`;
  function syncTrophyCard(){
    const preview=$('#trophyPreview'),card=$('#trophies');if(!preview||!card)return;
    const items=readTrophies();
    preview.innerHTML=items.length?`<div class="trophy-preview-count">${items.length} ${items.length===1?'entry':'entries'} saved</div>${items.slice(0,3).map(item=>{const kind=trophyKindValue(item.kind);return `<div class="trophy-preview-item kind-${kind}"><span class="trophy-preview-dot" aria-hidden="true"></span><b>${esc(item.title)}</b><small>${esc(trophyKinds[kind])}</small></div>`}).join('')}`:`<div class="trophy-preview-empty"><span class="trophy-preview-mark" aria-hidden="true">★</span><b>No trophies yet</b><small>Add your first award, finish, record, or milestone.</small></div>`;
  }

  function renderCollection(key, fields, sample=[]){
    const storage=`biglwaModule_${key}`;
    const items=readJSON(storage,sample);
    const fieldMarkup=fields.map(f=>`<input class="module-input" name="${f.name}" placeholder="${esc(f.placeholder)}" ${f.type?`type="${f.type}"`:''}>`).join('');
    const feature=key==='stream'?`<figure class="module-station-preview"><img src="/assets/station-radio-room.webp?v=20260916-station-1" alt="Sticker-covered radio booth lit in red and blue with a host at a microphone" width="1920" height="1080" loading="lazy" decoding="async"><figcaption><span><i></i> ON AIR</span><strong>the station</strong></figcaption></figure>`:'';
    body.innerHTML = heading(key) + feature + `<div class="module-grid"><section class="module-card"><h2>Add</h2><p>Saved locally in this prototype.</p><form class="module-form" id="moduleCollectionForm">${fieldMarkup}<div class="module-actions"><button class="module-action" type="submit">Save</button>${key==='projects'?'<button class="module-action secondary" id="projectFeedUpload" type="button">Upload to Collective Feed</button>':''}</div></form><div class="module-status" id="moduleStatus"></div></section><section class="module-card"><h2>Saved</h2><div class="module-list" id="moduleCollectionList">${listHtml(items,key)}</div></section></div>`;
    const form=$('#moduleCollectionForm',body), list=$('#moduleCollectionList',body), status=$('#moduleStatus',body);
    const render=()=>{const cur=readJSON(storage,[]);list.innerHTML=listHtml(cur,key)};
    const syncWidget=()=>{if(key==='stream')document.dispatchEvent(new CustomEvent('biglwa:stream-updated'))};
    form.addEventListener('submit',e=>{e.preventDefault();const fd=new FormData(form);const vals=Object.fromEntries(fd.entries());const title=(vals.title||vals.name||'').trim();if(!title){status.textContent='Give it a name first.';return;}const meta=fields.slice(1).map(f=>vals[f.name]).filter(Boolean).join(' · ');const cur=readJSON(storage,[]);cur.unshift({title,meta,date:new Date().toLocaleDateString()});writeJSON(storage,cur);form.reset();status.textContent='Saved.';status.classList.add('ok');render();syncWidget();});
    const projectFeedUpload=$('#projectFeedUpload',body);if(projectFeedUpload)projectFeedUpload.onclick=async()=>{const fd=new FormData(form),title=String(fd.get('title')||'').trim(),meta=fields.slice(1).map(f=>String(fd.get(f.name)||'').trim()).filter(Boolean).join(' · ');if(!title){status.textContent='Give the project a name first.';return}projectFeedUpload.disabled=true;status.textContent='Uploading draft…';try{await window.__biglwaCollectivePublish?.createStudioDraft({source:'projects',title,caption:[title,meta].filter(Boolean).join(' · ')});status.textContent='Project saved to your account as a private feed draft. Open Collective Feed to choose whether to post it.';status.classList.add('ok')}catch(err){console.error(err);status.textContent=err?.message||'Could not upload the project.';status.classList.remove('ok')}finally{projectFeedUpload.disabled=false}};
    list.addEventListener('click',e=>{const b=e.target.closest('[data-remove-item]');if(!b)return;const cur=readJSON(storage,[]);cur.splice(Number(b.dataset.removeItem),1);writeJSON(storage,cur);render();syncWidget();});
  }

  function monthKey(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`}
  function dayKey(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
  function calendarGridDate(year,month,index){const first=new Date(year,month,1);return new Date(year,month,1-first.getDay()+index)}
  function miniCalendarMarkup(){
    const now=new Date(), start=new Date(now);start.setDate(now.getDate()-now.getDay());
    const dates=Array.from({length:14},(_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);return d});
    const end=dates[13],monthLabel=start.getMonth()===end.getMonth()?start.toLocaleString(undefined,{month:'long'}):`${start.toLocaleString(undefined,{month:'short'})} – ${end.toLocaleString(undefined,{month:'short'})}`;
    const cells=dates.map(d=>`<span class="${dayKey(d)===dayKey(now)?'today':''}" aria-label="${d.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'})}">${d.getDate()}</span>`).join('');
    return `<div class="calendar-mini" aria-label="Two week calendar preview"><div class="calendar-mini-head"><span>${monthLabel}</span><span>2 weeks</span></div><div class="calendar-mini-weekdays">${['S','M','T','W','T','F','S'].map(day=>`<span>${day}</span>`).join('')}</div><div class="calendar-mini-grid">${cells}</div></div>`;
  }

  let calendarGeneration=0;
  function renderCalendar(){
    const instance=++calendarGeneration;
    const storage='biglwaCalendarEvents';
    let view=readJSON('biglwaCalendarView',null);if(!view||!Number.isInteger(view.year)||!Number.isInteger(view.month))view={year:new Date().getFullYear(),month:new Date().getMonth()};
    let selected=localStorage.getItem('biglwaCalendarSelected')||dayKey(new Date()),remote=[],syncMessage='',loaded='',requestId=0;
    const events=()=>readJSON(storage,[]);
    const active=()=>instance===calendarGeneration&&routeName.textContent==='Calendar'&&!workspace.hidden;
    const onDay=(e,key)=>{if(e.start?.date)return key>=e.start.date&&key<(e.end?.date||e.start.date+'x');const s=new Date(e.start?.dateTime),end=new Date(e.end?.dateTime||e.start?.dateTime),day=new Date(key+'T00:00:00'),next=new Date(day);next.setDate(next.getDate()+1);return s<next&&end>=day&&(end>day||s.getTime()===end.getTime())};
    const googleRows=key=>remote.filter(e=>onDay(e,key)).map(e=>({title:e.summary||'Untitled Google event',meta:'Google · '+(e.start?.date?'All day':new Date(e.start.dateTime).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})),google:true,url:e.htmlLink||''}));
    const draw=()=>{
      const all=events(),connected=window.__biglwaGoogleOrbit?.state.connected;
      const days=Array.from({length:42},(_,i)=>{const d=calendarGridDate(view.year,view.month,i),key=dayKey(d),items=[...all.filter(x=>x.date===key),...googleRows(key)];return '<button class="calendar-day '+(d.getMonth()!==view.month?'other ':'')+(selected===key?'selected ':'')+(key===dayKey(new Date())?'today':'')+'" data-cal-date="'+key+'" type="button"><span class="calendar-day-num">'+d.getDate()+'</span>'+items.slice(0,3).map(e=>'<span class="calendar-event-chip">'+esc(e.google?'G · '+e.title:e.title)+'</span>').join('')+(items.length>3?'<small>+'+(items.length-3)+' more</small>':'')+'</button>'}).join('');
      const local=all.filter(x=>x.date===selected),google=googleRows(selected);
      body.innerHTML=heading('calendar')+'<p class="module-status" role="status">'+esc(syncMessage||(connected?'Google Calendar connected through Orbit.':'Connect Google Calendar in Orbit to see your events here.'))+'</p><div class="module-actions"><button class="module-action ghost" id="calOrbit" type="button">Manage in Orbit</button>'+(connected?'<button class="module-action ghost" id="calRefresh" type="button">Refresh Google events</button>':'')+'</div><div class="calendar-shell"><section class="calendar-board"><div class="calendar-toolbar"><div class="module-actions"><button class="module-action ghost" id="calPrev" aria-label="Previous month">←</button><button class="module-action ghost" id="calToday">Today</button></div><h2>'+new Date(view.year,view.month,1).toLocaleString(undefined,{month:'long',year:'numeric'})+'</h2><button class="module-action ghost" id="calNext" aria-label="Next month">→</button></div><div class="calendar-weekdays">'+['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(x=>'<span>'+x+'</span>').join('')+'</div><div class="calendar-days">'+days+'</div></section><aside class="module-card"><h2>'+new Date(selected+'T12:00:00').toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'})+'</h2><p>Google events are read-only. New events below are saved in this browser.</p><form class="module-form" id="calendarEventForm"><input class="module-input" name="title" placeholder="Event title" required><input class="module-input" type="time" name="time"><button class="module-action" type="submit">Add local event</button></form><div class="module-list" id="calendarSelectedEvents">'+listHtml(local,'event')+google.map(e=>'<div class="module-list-item"><div><b>'+esc(e.title)+'</b><small>'+esc(e.meta)+'</small></div></div>').join('')+'</div></aside></div>';
      const change=n=>{const d=new Date(view.year,view.month+n,1);view={year:d.getFullYear(),month:d.getMonth()};writeJSON('biglwaCalendarView',view);remote=[];draw();load()};
      $('#calPrev',body).onclick=()=>change(-1);$('#calNext',body).onclick=()=>change(1);
      $('#calToday',body).onclick=()=>{const n=new Date();view={year:n.getFullYear(),month:n.getMonth()};selected=dayKey(n);writeJSON('biglwaCalendarView',view);localStorage.setItem('biglwaCalendarSelected',selected);remote=[];loaded='';draw();load()};
      $('#calOrbit',body).onclick=()=>openModule('orbit');
      const refresh=$('#calRefresh',body);if(refresh)refresh.onclick=()=>{loaded='';load()};
      $$('.calendar-day',body).forEach(btn=>btn.onclick=()=>{selected=btn.dataset.calDate;localStorage.setItem('biglwaCalendarSelected',selected);draw()});
      $('#calendarEventForm',body).onsubmit=e=>{e.preventDefault();const fd=new FormData(e.currentTarget),title=String(fd.get('title')||'').trim(),time=fd.get('time')||'';if(!title)return;const cur=events();cur.push({title,date:selected,time,meta:[selected,time].filter(Boolean).join(' · ')});writeJSON(storage,cur);draw()};
      $('#calendarSelectedEvents',body).onclick=e=>{const b=e.target.closest('[data-remove-item]');if(!b)return;const cur=events(),indexes=cur.map((x,i)=>x.date===selected?i:-1).filter(i=>i>=0),idx=indexes[Number(b.dataset.removeItem)];if(idx!==undefined){cur.splice(idx,1);writeJSON(storage,cur);draw()}};
    };
    async function load(){
      const orbit=window.__biglwaGoogleOrbit;if(!orbit?.state.connected||!orbit.calendarEvents)return;
      const key=view.year+'-'+view.month;if(loaded===key)return;loaded=key;const id=++requestId;
      syncMessage='Loading Google events…';draw();
      try{const start=calendarGridDate(view.year,view.month,0),end=calendarGridDate(view.year,view.month,42);const items=await orbit.calendarEvents(start.toISOString(),end.toISOString());if(id!==requestId||!active())return;remote=items;syncMessage='Google events refreshed from Orbit.'}
      catch(e){if(id!==requestId||!active())return;remote=[];loaded='';syncMessage=e.message}
      if(active())draw();
    }
    draw();load();
  }

  /* Primary Orbit contains API-backed accounts. Link-only destinations live in Planetary. */
  const ORBIT_APPS=[
    ['instagram','IG','Instagram','#f36b21'],['facebook','FB','Facebook','#1658be'],
    ['tiktok','TT','TikTok','#772dcc'],['pinterest','P','Pinterest','#e60023'],
    ['x','𝕏','X','#080808'],['snapchat','SC','Snapchat','#ffeb00'],
    ['tumblr','T','Tumblr','#1b304b'],['youtube','YT','YouTube','#d0202f']
  ];
  const PLANETARY_APPS=[
    ['soundcloud','SC','SoundCloud','#e2622a'],['spotify','SP','Spotify','#1db954'],
    ['drive','GD','Google Drive','#0f9d58'],['calendar','GC','Google Calendar','#4285f4'],
    ['goodreads','GR','Goodreads','#7a5c3e'],['letterboxd','LB','Letterboxd','#2c3440'],
    ['imdb','IMDb','IMDb','#e6a800']
  ];
  const ORBIT_CONNECTED=new Set(['instagram','tiktok','pinterest','facebook','youtube']);
  const ORBIT_LIVE=new Set(['instagram','tiktok','pinterest','facebook','youtube']);
  const ORBIT_APP_NAMES=Object.fromEntries([...ORBIT_APPS,...PLANETARY_APPS].map(([k,,n])=>[k,n]));
  /* Each API's chip wears that API's own colour. They were all one black pill, which read as
     a row of dead black dots with unreadable lettering rather than as a list of services.
     The lettering is pinned white on top so it survives the widget colour rules above. */
  const orbitBadge=(g,tint)=>'<span class="orbit-platform-badge" aria-hidden="true" style="background:'+tint+'">'+esc(g)+'</span>';
  const orbitLinks=()=>window.BigLWAOrbitAccountLinks?.get?.() ?? readJSON('biglwaOrbitLinks',{});
  const orbitConnected=()=>{
    const rows=[];
    for(const id of ['x','snapchat','tumblr']){const item=window.BigLWAOrbitOAuth?.get?.(id);if(item)rows.push(item)}
    try{rows.push(...Object.values(window.__biglwaConnections?.connections?.()||{}).filter(row=>row&&row.id&&row.link))}catch{}
    // The account mirror is asynchronous. If the Pinterest API has actually
    // verified a signed-in user's profile, show that verified connection right
    // away rather than falsely showing NOT CONNECTED until Firestore finishes.
    // Never infer connectivity from a stale local session string alone.
    try{
      const pn=window.__biglwaPinterest?.state;
      const viewerUid=String(window.__biglwaIdentity?.uid||'');
      if(pn?.connected&&pn.uid&&(!viewerUid||pn.uid===viewerUid)&&pn.profile?.username){
        const name=String(pn.profile.username).trim();
        if(name)rows.push({id:'pinterest',label:'Pinterest',
          username:name,name:pn.profile.business_name||name,
          avatarUrl:pn.profile.profile_image||'',
          link:'https://www.pinterest.com/'+encodeURIComponent(name)+'/',
          verifiedFromProvider:true});
      }
    }catch{}
    // Display verified TikTok authorization immediately, even while the public
    // account mirror is catching up. Basic Login Kit does not expose @username,
    // so do not invent a profile URL from the display name.
    try{
      const tt=window.__biglwaTikTokOrbit?.state;
      const uid=String(window.__biglwaIdentity?.uid||'');
      if(tt?.connected&&tt.uid&&(!uid||tt.uid===uid)&&tt.profile?.open_id){
        rows.push({id:'tiktok',label:'TikTok',name:tt.profile.display_name||'TikTok account',
          username:'',avatarUrl:tt.profile.avatar_url||'',
          link:'https://www.tiktok.com/',verifiedFromProvider:true});
      }
    }catch{}
    /* Facebook authorises in the browser through its own SDK, so its state lives on the
       client, not in the shared connections hub. It is merged here so the Orbit page's row
       says Connected when that login has completed. */
    try{
      const fb=window.__biglwaFacebookOrbit?.state;
      if(fb?.connected)rows.push({id:'facebook',name:fb.profile?.name||'Facebook',username:fb.profile?.name,link:fb.profile?.link||window.BigLWAOrbitAccountLinks?.get?.().facebook||'',avatarUrl:fb.profile?.picture?.data?.url||''});
    }catch{}
    // New personal Facebook OAuth is independent of the legacy Business Login.
    try{const personal=window.BigLWAFacebookPersonal?.get?.();if(personal)rows.push(personal)}catch{}
    return rows;
  };
  function orbitCount(key,value){
   if(value==null)return '';
   const n=Number(value);
   if(!Number.isFinite(n))return '';
   if(n>=1e6)return (n/1e6).toFixed(1).replace(/\.0$/,'')+'M';
   if(n>=1e3)return (n/1e3).toFixed(1).replace(/\.0$/,'')+'K';
   return String(n);
  }
  /* A source that is not connected has no record at all, so the row itself is missing.
     Reading it as empty is the whole answer here: the card says "not connected" and there
     are simply no counts to show. */
  function orbitStat(label,key,row){
   const n=orbitCount(key,row?.stats?.[key]);
   return n?n+' '+label:'';
  }
  /* The quick links sit above everything: what a visitor can reach, and what the owner can
     connect. Both sides read from the same list so the two never disagree. */
  // De-duplicate by canonical destination, not source: Pinterest can arrive twice
  // from the account mirror and a locally confirmed provider.
  function orbitLinkKey(raw){
    try {
      const url=new URL(String(raw||'').trim());
      if(!['http:','https:'].includes(url.protocol))return '';
      const host=url.hostname.toLowerCase().replace(/^(?:www|m|mobile)\./,'').replace(/^twitter\.com$/,'x.com');
      const path=decodeURIComponent(url.pathname).replace(/\/+$/,'').toLowerCase();
      const identity=new URLSearchParams();
      for(const key of ['id','v','user','username','page_id','channel']){
        if(url.searchParams.has(key))identity.set(key,url.searchParams.get(key)||'');
      }
      return host+path+(identity.size?'?'+identity.toString():'');
    }catch{return ''}
  }
  function orbitQuickLinks(){
    // One visible quick link per platform, and one per normalized destination.
    // Provider-verified links win over old manually saved links; neither entry is
    // deleted from Firestore or the provider account when its duplicate is hidden.
    const seenDestinations=new Set(),seenProviders=new Set(),chips=[];
    const add=(provider,href,label,handle,cls)=>{
      const key=orbitLinkKey(href),id=String(provider||'').toLowerCase();
      if(!key||seenDestinations.has(key)||seenProviders.has(id))return;
      const parsed=new URL(href);
      const isProviderHome=parsed.pathname==='/' || !parsed.pathname;
      if(isProviderHome&&['facebook','instagram','tiktok','pinterest','youtube'].includes(id))return;
      seenDestinations.add(key);seenProviders.add(id);
      chips.push({href,label,handle,cls});
    };
    orbitConnected().forEach(row=>{
      if(row&&row.link)add(row.id,row.link,row.label||ORBIT_APP_NAMES[row.id]||row.id,
        row.username?'@'+row.username:(row.name||''),'is-connected is-'+row.id);
    });
    Object.entries(orbitLinks()).forEach(([k,url])=>{
      if(url)add(k,url,ORBIT_APP_NAMES[k]||k,'Saved link','is-saved is-'+k);
    });
    if(!chips.length)return '';
    return '<section class="orbit-quick" aria-label="Your links"><h3>Quick links</h3><p>These are the places people can reach you. Anyone viewing your profile sees the same links.</p><div class="orbit-quick-row">'+
      chips.map(({href,label,handle,cls})=>'<a class="orbit-quick-link '+esc(cls||'')+'" href="'+esc(href)+'" target="_blank" rel="noopener noreferrer"><b>'+esc(label)+'</b>'+(handle?'<small>'+esc(handle)+'</small>':'')+'<i aria-hidden="true">↗</i></a>').join('')+
      '</div></section>';
  }
  /* The source clients each own their own connect button, so the Orbit page hands the click
     over rather than reimplementing the OAuth start. */
  const ORBIT_HANDS=key=>{const map={instagram:window.__biglwaInstagramOrbit,tiktok:window.__biglwaTikTokOrbit,pinterest:window.__biglwaPinterest,facebook:window.BigLWAFacebookPersonal,youtube:window.__biglwaGoogleOrbit,x:window.BigLWAOrbitOAuth,snapchat:window.BigLWAOrbitOAuth,tumblr:window.BigLWAOrbitOAuth};return Boolean(map[key])};
   function renderOrbitPage(){
    // Only show a real OAuth button once its public app key, secret and callback
    // are actually available. Until then an account-linked profile URL works.
    for(const id of ['x','snapchat','tumblr']){
      const live=window.BigLWAOrbitOAuth?.configured?.(id)?.configured===true;
      // Always expose the OAuth connection action. Missing public IDs show a
      // precise setup message instead of replacing the provider with a URL-only
      // field and hiding its Connect control altogether.
      ORBIT_CONNECTED.add(id);
      if(live)ORBIT_LIVE.add(id);
      else ORBIT_LIVE.delete(id)
    }
    const links=orbitLinks();
    const connected=Object.fromEntries(orbitConnected().map(r=>[r.id,r]));
    const legacyCount=window.BigLWAOrbitAccountLinks?.localPending?.()?.length||0;
    body.innerHTML=heading('orbit')+`<div class="module-grid"><section class="module-card wide"><h2>Your orbit</h2><p>Connect your platforms or save a profile link. Your Orbit destinations follow your Big LWA account; imports require a supported provider authorization.</p><div class="module-status" id="orbitPageStatus"></div>${legacyCount?'<button type="button" class="module-action ghost" id="orbitImportLocalLinks">Move '+legacyCount+' saved browser link(s) to my account</button>':''}${orbitQuickLinks()}<div class="module-orbit">${[...ORBIT_APPS,...PLANETARY_APPS].map(([k,g,n,t])=>{
     if(ORBIT_CONNECTED.has(k)){
      const row=connected[k],pending=!ORBIT_LIVE.has(k);
      const stats=[orbitStat('followers','followers',row),orbitStat('posts','mediaCount',row),orbitStat('boards','boards',row)].filter(Boolean).join(' · ');
      return `<div class="module-orbit-row is-oauth" data-orbit-row="${k}"><header><b>${n}</b>${row?(row.needsReauth?'<em class="orbit-state">Reconnect required</em>':'<em class="orbit-state is-on">Connected</em>'):'<em class="orbit-state">Not connected</em>'}</header><div class="orbit-main">`+
       (row?`<div class="orbit-connected-card">${row.avatarUrl?'<img src="'+esc(row.avatarUrl)+'" alt="" width="46" height="46">':''}<span><b>${esc(row.name||row.username||'Connected')}</b>${row.username?'<small>@'+esc(row.username)+'</small>':''}${stats?'<small>'+stats+'</small>':''}</span>${row.link?'<a class="orbit-hotlink" href="'+esc(row.link)+'" target="_blank" rel="noopener noreferrer">Open ↗</a>':''}</div>`
        :'<div class="orbit-not-connected">Connect to show your account preview.</div>')+'</div>'+
       `<div class="module-actions"><button class="module-action" type="button" data-orbit-connect="${k}" ${!pending&&!ORBIT_HANDS(k)?'disabled':''}>${k==='facebook'?'Facebook':(row?'Reconnect ':'Connect ')+n}</button>${k==='facebook'?'<button class="module-action ghost" type="button" data-facebook-legacy-connect="1">Meta Business</button>':''}${row?`<button class="module-action ghost" type="button" data-orbit-unlink="${k}">Unlink</button>`:''}${orbitBadge(g,t)}</div>`+
       (k==='facebook'?`<div class="orbit-facebook-profile"><label for="orbitFacebookPublicLink">Public Facebook profile or Page link</label><div class="orbit-facebook-profile-actions"><input class="module-input" id="orbitFacebookPublicLink" data-orbit-path="facebook" type="url" inputmode="url" value="${esc(links.facebook||row?.link||'')}" placeholder="https://facebook.com/your.profile"><button class="module-action" type="button" data-orbit-save="facebook">Save</button></div></div>`:'')+
       (['snapchat','tumblr','x','youtube'].includes(k)?`<div class="orbit-fallback-profile"><label>Public ${esc(n)} profile link</label><div class="orbit-fallback-actions"><input class="module-input" data-orbit-path="${k}" type="url" inputmode="url" value="${esc(links[k]||row?.link||'')}" placeholder="Paste public profile URL"><button class="module-action" type="button" data-orbit-save="${k}">Save</button></div></div>`:'')+'</div>';
     }
     return `<div class="module-orbit-row is-profile-link" data-orbit-row="${k}"><header><b>${n}</b><em class="orbit-state${links[k]?' is-on':''}">${links[k]?'Linked':'Not linked'}</em></header><div class="orbit-main"><div class="orbit-link-summary">${links[k]?'Your profile link is saved.':'Add a public profile or page link.'}</div></div><div class="module-actions"><button class="module-action" type="button" data-orbit-save="${k}">Save link</button><button class="module-action ghost" type="button" data-orbit-open="${k}" ${links[k]?'':'disabled'}>Open profile</button>${orbitBadge(g,t)}</div><div class="orbit-link-utility"><label for="orbit-link-${k}">Public profile / page</label><input id="orbit-link-${k}" class="module-input" data-orbit-path="${k}" type="url" value="${esc(links[k]||'')}" placeholder="https://…"></div></div>`;
     }).join('')}</div></section></div>`;
    /* Looked up after the markup exists, so the status line is the node that is actually
       on the page rather than one from a previous render. */
    const status=$('#orbitPageStatus',body);
    const say=text=>{if(status){status.textContent=text;status.classList.add('ok')}};
    body.onclick=async e=>{
     const importLinks=e.target.closest('#orbitImportLocalLinks');
     if(importLinks){
       importLinks.disabled=true;say('Importing saved browser links…');
       try{
         const count=await window.BigLWAOrbitAccountLinks?.importLocalLinks?.();
         say((count||0)+' profile link(s) saved to your account.');renderOrbitPage();
       }catch(error){say(error?.message||'Could not import browser links.');importLinks.disabled=false}
       return;
     }
const legacyFb=e.target.closest('[data-facebook-legacy-connect]');
     if(legacyFb){
       if(window.__biglwaFacebookOrbit?.connect)window.__biglwaFacebookOrbit.connect();
       else say('Original Facebook Login is still loading. Try again.');
       return;
     }
     const connect=e.target.closest('[data-orbit-connect]');
     if(connect){
       const k=connect.dataset.orbitConnect;
       if(['x','snapchat','tumblr'].includes(k)){
         connect.disabled=true;say('Checking '+ORBIT_APP_NAMES[k]+' authorization…');
         try{await window.BigLWAOrbitOAuth.connect(k)}
         catch(error){say(error?.message||'Authorization is not ready yet.');connect.disabled=false}
         return;
       }
       if(!ORBIT_LIVE.has(k)){say('This provider is not configured for sign-in yet.');return;}
       const client={instagram:window.__biglwaInstagramOrbit,tiktok:window.__biglwaTikTokOrbit,pinterest:window.__biglwaPinterest,facebook:window.BigLWAFacebookPersonal,youtube:window.__biglwaGoogleOrbit}[k];
       if(!client?.connect){say('That connection is still loading. Try again in a moment.');return;}
       if(k==='facebook'){
         connect.disabled=true;
         try{await client.connect();}catch(error){say(error?.message||'Facebook Login could not start. Check Meta app settings.');}
         finally{if(connect.isConnected)connect.disabled=false;}
       }else client.connect();
       return;
     }
     const unlink=e.target.closest('[data-orbit-unlink]');
     if(unlink){
       const k=unlink.dataset.orbitUnlink;unlink.disabled=true;say('Unlinking…');
       try{
         if(['x','snapchat','tumblr'].includes(k))await window.BigLWAOrbitOAuth.disconnect(k);
         else if(k==='facebook'&&window.BigLWAFacebookPersonal?.state?.connected)await window.BigLWAFacebookPersonal.disconnect();
         else if(k==='facebook'&&window.__biglwaFacebookOrbit?.state?.connected)await window.__biglwaFacebookOrbit.disconnect();
         else await window.__biglwaConnections?.forget?.(k);
         say(ORBIT_APP_NAMES[k]+' unlinked.');renderOrbitPage();
       }catch(error){say(error?.message||'Unable to unlink this connection.');unlink.disabled=false}
       return;
     }
     const save=e.target.closest('[data-orbit-save]');
     if(save){
       const k=save.dataset.orbitSave,url=$('[data-orbit-path="'+k+'"]',body).value.trim();
       const manager=window.BigLWAOrbitAccountLinks;
       save.disabled=true;say('Saving '+(ORBIT_APP_NAMES[k]||'Orbit')+' link to your account…');
       try{
         if(!manager?.save)throw Error('Account link storage is still loading.');
         if(k==='facebook'&&url){
           const candidate=new URL(url);
           const host=candidate.hostname.toLowerCase();
           if(candidate.protocol!=='https:'||!['facebook.com','www.facebook.com','m.facebook.com','fb.com','www.fb.com'].includes(host))
             throw Error('Please enter your real public Facebook profile or Page HTTPS link.');
         }
         const linkKey=orbitLinkKey(url);
         if(linkKey&&Object.entries(orbitLinks()).some(([other,saved])=>other!==k&&orbitLinkKey(saved)===linkKey))
           throw Error('This quick link is already saved under another Orbit source.');
         if(linkKey&&orbitConnected().some(row=>row&&row.id!==k&&orbitLinkKey(row.link)===linkKey))
           throw Error('This destination is already connected in Orbit; it cannot be added twice.');
         await manager.save(k,url);
         say((ORBIT_APP_NAMES[k]||'Orbit')+' link saved to your BIGLWA account.');
         renderOrbitPage();
       }catch(error){say(error?.message||'Could not save this Orbit link.')}
       finally{save.disabled=false}
       return;
     }
     const open=e.target.closest('[data-orbit-open]');
     if(open){safeOpen(orbitLinks()[open.dataset.orbitOpen])}
    };
     /* A connection that finishes elsewhere, or after an unlink, repaints the page.
        The subscription is registered once for the whole page, not once per render: the
        page is redrawn on every connection change, and a listener added each time would
        call back once per past render and repaint in a loop. */
     orbitWatch();
   }
   /* The viewer is repainted by the connections watcher, not by the markup, so the current
      route is checked at fire time. Registering here also means the guard is genuinely once
      even if the module is opened and closed repeatedly. */
   document.addEventListener('biglwa:tiktok-status',()=>{
     if(routeName.textContent==='Orbit'&&!workspace.hidden)renderOrbitPage();
   });
   document.addEventListener('biglwa:pinterest-status',()=>{
     if(routeName.textContent==='Orbit'&&!workspace.hidden)renderOrbitPage();
   });
   document.addEventListener('biglwa:new-orbit-status',()=>{
     if(routeName.textContent==='Orbit'&&!workspace.hidden)renderOrbitPage();
   });
   document.addEventListener('biglwa:facebook-personal-status',()=>{
     if(routeName.textContent==='Orbit'&&!workspace.hidden)renderOrbitPage();
   });

   window.addEventListener('biglwa:orbit-links-synced',()=>{
     if(routeName.textContent==='Orbit'&&!workspace.hidden)renderOrbitPage();
   });
   let orbitWatched=false;
   function orbitWatch(){
     if(orbitWatched)return;
     const hub=window.__biglwaConnections;
     if(!hub?.onConnectionsChange)return;
     orbitWatched=true;
     hub.onConnectionsChange(()=>{if(routeName.textContent==='Orbit'&&!body.hidden)renderOrbitPage()});
   }

  function profileUsername(){
    try{const saved=JSON.parse(localStorage.getItem('biglwaProfileDetails')||'null');if(saved?.username)return '@'+String(saved.username).replace(/^@/,'')}catch{}
    return $('.profile-name-line h1')?.textContent?.trim()||'@username';
  }

  function renderWriting(key){
    // Visitors can read an explicitly shared Journal snapshot, but NEVER
    // the owner's unshared local drafts, Sqwib notes or Sqwip screenplays.
    if(document.documentElement.classList.contains('biglwa-preview-mode')){
      body.innerHTML=heading(key)+'<div class="module-grid"><section class="module-card wide" id="publicWritingReader"><h2>'+ (key==='diary'?'Journal':'Sqwib Note') +'</h2><p>Checking access…</p></section></div>';
      const host=$('#publicWritingReader',body);
      if(key!=='diary'){
        host.innerHTML='<h2>🔒 Sqwib Note</h2><p>This note is private to its owner.</p>';
        return;
      }
      const username=(()=>{try{return decodeURIComponent(location.pathname.split('/').filter(Boolean)[0]||'')}catch{return ''}})();
      const reader=window.BigLWAUserDirectory?.loadPublicProfile?.(username);
      if(!reader){host.innerHTML='<h2>Journal</h2><p>Journal reading is unavailable.</p>';return;}
      Promise.resolve(reader).then(profile=>{
        if(!host.isConnected)return;
        if(profile?.journalVisibility!=='public'||!profile.publicJournal){
          host.innerHTML='<h2>Journal</h2><p>This Journal has not been shared publicly.</p>';return;
        }
        host.innerHTML='<h2>Journal</h2><p class="journal-reader-intro">An entry from '+esc(profile.name||profile.username||'this member')+'</p>'+
          '<article class="journal-reading-sheet">'+esc(profile.publicJournal).split(String.fromCharCode(10)).join('<br>')+'</article>';
      }).catch(()=>{if(host.isConnected)host.innerHTML='<h2>Journal</h2><p>Could not load Journal.</p>'});
      return;
    }
    const storage=`biglwaDraft_${key}`;
    const title=key==='diary'
      ? `<div class="module-diary-cover-label is-compact"><span>Journal · ${esc(profileUsername())}</span></div>`
      : '<div class="sqwib-private-kicker">🔒 private · pin it before it floats away</div>'+
        '<nav class="diary-section-nav" role="tablist" aria-label="Sqwib writing tools"><button type="button" data-diary-view="notes" role="tab" aria-controls="diaryWritingSection" aria-selected="true"><span aria-hidden="true">▤</span> Sqwib Note</button><button type="button" data-diary-view="sqwip" role="tab" aria-controls="sqwipWritingSection" aria-selected="false"><span aria-hidden="true">♢</span> Sqwip <small>screenplay</small></button></nav>';
    body.innerHTML=heading(key)+`<div class="module-grid"><section class="module-card wide">${title}<div id="diaryWritingSection" role="tabpanel" aria-label="${key==='diary'?'Journal writing':'Sqwib Note writing'}"><form id="moduleWritingForm" class="module-form"><textarea class="module-textarea ${key==='diary'?'diary-lined':'qwiky-note-input'}" id="moduleWritingArea" name="writing" placeholder="Write here…">${esc(localStorage.getItem(storage)||'')}</textarea><div class="module-actions"><button class="module-action" id="moduleWritingSave" type="submit">Save</button>${key==='diary'?'<button class="module-action secondary" id="moduleWritingFeed" type="button">Send to Collective Feed drafts</button><button class="module-action ghost" id="journalViewButton" type="button">View journal</button>':''}</div><div class="module-status" id="moduleWritingStatus">${key==='diary'?'Private draft · choose to make a snapshot viewable':'🔒 Locked note · only you can read this'}</div></form></div>${key==='diary'?'<section class="journal-owner-share" id="journalShareControls"><div><b>Journal visibility</b><p>Private by default. Publishing shares only the current Journal text. Sqwib Note and Sqwip remain private.</p></div><div class="journal-owner-share-actions"><button type="button" class="module-action" id="journalPublish">Make journal viewable</button><button type="button" class="module-action ghost" id="journalUnpublish">Hide shared journal</button></div><p id="journalShareStatus" role="status">Only you can see this draft until you publish it.</p></section><section id="journalReaderPanel" class="journal-reader-panel" hidden><div class="journal-reader-controls"><b>Journal · reading mode</b><button type="button" class="module-action ghost" id="journalReturnEdit">✎ Edit journal</button></div><article class="journal-reading-sheet" id="journalReaderText"></article></section>':''}${key==='notes'?'<div id="sqwipWritingSection" role="tabpanel" aria-label="Private Sqwip screenplay maker" hidden></div>':''}</section></div>`;
    const form=$('#moduleWritingForm',body),area=$('#moduleWritingArea',body),status=$('#moduleWritingStatus',body);let t;
    let collection=null;
    const save=(explicit=false)=>{
      try{
        collection?.saveCurrent();
        localStorage.setItem(storage,area.value);
        status.textContent=explicit?'Saved. Studio preview updated.':'Saved locally.';
        status.classList.add('ok');
        document.dispatchEvent(new CustomEvent('biglwa:writing-saved',{detail:{key,value:area.value}}));
      }catch(error){
        status.textContent='Could not save on this device: '+String(error?.message||error);
        status.classList.remove('ok');
      }
    };
    area.addEventListener('input',()=>{status.textContent='Saving…';status.classList.remove('ok');clearTimeout(t);t=setTimeout(()=>save(false),350)});
    form.addEventListener('submit',event=>{event.preventDefault();clearTimeout(t);save(true)});
    // The collection migrates the original single draft in place. Switching entries
    // mirrors the current text to the legacy key for Studio preview and public publishing.
    if(window.BigLWAWritingCollections?.mount){
      collection=window.BigLWAWritingCollections.mount({
        kind:key,form,area,status,
        onSelection:()=>{clearTimeout(t)},
      });
    }
    if(key==='notes'){
      const publisher=$('#diaryWritingSection',body);
      if(publisher){
        const areaSection=document.createElement('section');
        areaSection.id='sqwibPublishArea';
        areaSection.className='sqwib-publish-inline';
        areaSection.setAttribute('aria-label','Veve publishing options');
        areaSection.innerHTML=
          '<button type="button" data-sqwib-control="publish" title="Publish a public copy to Veve; your private working note stays private">Publish to Veve ↗</button>'+
          '<label class="sqwib-permission" title="Allow others to resqwib a published copy"><input type="checkbox" id="sqwibAllowResqwib"><span>Allow resqwibs</span></label>'+
          '<span id="sqwibPublishStatus" class="sqwib-publish-status" role="status">private draft</span>'+
          '<details class="sqwib-published-history"><summary>Published notes</summary><p>Published copies can be unpublished here. Your working draft stays private.</p><div id="sqwibPublishedList" aria-label="Your published Sqwibs"></div></details>';
        // Keep publishing beside Save, not as a second full-size panel below the note.
        form.querySelector('.module-actions').append(areaSection);
        const publicApi=()=>window.BigLWASqwibs;
        const announce=m=>{const node=$('#sqwibPublishStatus',areaSection);if(node)node.textContent=m};
        const list=$('#sqwibPublishedList',areaSection);
        const refreshSqwibs=async()=>{
          if(!publicApi())return;
          try{
            const published=await publicApi().mySqwibs();
            if(!list.isConnected)return;
            list.innerHTML=published.length?published.map(item=>
              '<article class="sqwib-published-item" data-sqwib-id="'+esc(item.id)+'"><p>'+esc(String(item.text||'').slice(0,240))+'</p>'+
              '<div class="sqwib-published-actions"><span>'+(item.visibility==='public'?'Public':'Unpublished')+'</span>'+
              (item.visibility==='public'
                ?'<label class="sqwib-permission"><input type="checkbox" data-sqwib-allow="'+esc(item.id)+'" '+(item.allowResqwib===true?'checked':'')+'> resqwibs allowed</label>'+
                 '<button type="button" data-sqwib-control="unpublish" data-sqwib-id="'+esc(item.id)+'">Unpublish</button>'
                :'')+'</div></article>').join(''):'<p>No published Sqwibs yet.</p>';
          }catch(error){announce('Could not read published Sqwibs: '+(error?.message||'Check account permissions'))}
        };
        const pub=$('[data-sqwib-control="publish"]',areaSection);
        pub.onclick=async()=>{
          const raw=area.value.trim();
          if(!raw){announce('Write something above before publishing.');return}
          if(raw.length>1200){announce('Public Sqwibs must be 1,200 characters or fewer. Your private draft remains unchanged.');return}
          if(!publicApi()){announce('Account publishing is still loading. Try again shortly.');return}
          pub.disabled=true;announce('Publishing your Sqwib publicly…');
          try{
            await publicApi().publish(raw,$('#sqwibAllowResqwib',areaSection).checked);
            announce('Published to Veve. Your private working draft remains on this device.');
            await refreshSqwibs();
          }catch(error){announce(error?.message||'Could not publish. Your note remains private.')}
          finally{pub.disabled=false}
        };
        areaSection.addEventListener('click',async event=>{
          const btn=event.target.closest('[data-sqwib-control="unpublish"]');
          if(!btn)return;
          btn.disabled=true;
          try{await publicApi().unpublish(btn.dataset.sqwibId);announce('Sqwib unpublished. Its resqwib copies are no longer displayed.');await refreshSqwibs()}
          catch(error){announce(error?.message||'Could not change visibility.');btn.disabled=false}
        });
        areaSection.addEventListener('change',async event=>{
          const input=event.target.closest('[data-sqwib-allow]');
          if(!input)return;
          input.disabled=true;
          try{await publicApi().permission(input.dataset.sqwibAllow,input.checked);
            announce(input.checked?'Author permission enabled for resqwibs.':'Resqwib permission withdrawn. Existing reshares are hidden from Veve.');
            await refreshSqwibs()
          }catch(error){announce(error?.message||'Could not update permission.');input.checked=!input.checked}
          finally{input.disabled=false}
        });
        refreshSqwibs();
      }
    }
    if(key==='notes'){
      // Sqwib Note owns Sqwip. Existing screenplay documents retain their original
      // account-scoped and cloud storage keys; Journal no longer mounts the editor.
      const tabs=Array.from(body.querySelectorAll('[data-diary-view]'));
      const notebook=$('#diaryWritingSection',body),screenplay=$('#sqwipWritingSection',body);
      tabs.forEach(tab=>tab.addEventListener('click',()=>{
        const showSqwip=tab.dataset.diaryView==='sqwip';
        notebook.hidden=showSqwip;
        screenplay.hidden=!showSqwip;
        tabs.forEach(btn=>btn.setAttribute('aria-selected',String(btn===tab)));
        if(showSqwip&&!screenplay.dataset.sqwipMounted){
          if(window.BigLWASqwip?.mount){
            window.BigLWASqwip.mount(screenplay);
            screenplay.dataset.sqwipMounted='true';
          }else screenplay.textContent='Sqwip is loading. Refresh to open the screenplay editor.';
        }
      }));
    }
    if(key==='diary'){
      const reader=$('#journalReaderPanel',body),readerText=$('#journalReaderText',body);
      const journalSection=$('#diaryWritingSection',body),share=$('#journalShareControls',body);
      const view=$('#journalViewButton',body),back=$('#journalReturnEdit',body);
      const syncReader=()=>{readerText.textContent=area.value.trim()||'Your journal has no entries yet.';};
      view.onclick=()=>{
        syncReader();journalSection.hidden=true;share.hidden=true;
        reader.hidden=false;reader.scrollIntoView({behavior:'smooth',block:'start'});
      };
      back.onclick=()=>{reader.hidden=true;journalSection.hidden=false;share.hidden=false;area.focus()};
      const publish=$('#journalPublish',body),unpublish=$('#journalUnpublish',body),shareStatus=$('#journalShareStatus',body);
      const setVisibility=async viewable=>{
        const api=window.BigLWAUserDirectory?.publishJournal;
        if(typeof api!=='function'){shareStatus.textContent='The public Journal service is still loading. Refresh and retry.';return}
        if(viewable&&!area.value.trim()){shareStatus.textContent='Write an entry before making the Journal viewable.';return}
        publish.disabled=true;unpublish.disabled=true;
        shareStatus.textContent=viewable?'Publishing read-only Journal…':'Hiding shared Journal…';
        try{
          const result=await api(area.value,viewable);
          shareStatus.textContent=result.viewable?'Journal viewable on your public profile as a read-only snapshot.':'Journal hidden from public view. Your private draft remains saved.';
        }catch(err){
          shareStatus.textContent=err?.message||'The Journal visibility change was not saved.';
        }finally{publish.disabled=false;unpublish.disabled=false}
      };
      publish.onclick=()=>setVisibility(true);
      unpublish.onclick=()=>setVisibility(false);
      const currentUser=profileUsername().replace(/^@/,'');
      window.BigLWAUserDirectory?.loadPublicProfile?.(currentUser).then(profile=>{
        if(!shareStatus.isConnected)return;
        shareStatus.textContent=profile?.journalVisibility==='public'
          ?'A Journal snapshot is viewable on your profile. Changes remain private until you publish again.'
          :'Private · only you can see this draft.';
      }).catch(()=>{});
    }
    if($('#moduleWritingFeed',body))$('#moduleWritingFeed',body).onclick=async()=>{const value=area.value.trim(),status=$('#moduleWritingStatus',body);if(!value){status.textContent='Write something first.';status.classList.remove('ok');return}const button=$('#moduleWritingFeed',body);button.disabled=true;status.textContent='Uploading draft…';try{await window.__biglwaCollectivePublish?.createStudioDraft({source:key,title:key==='diary'?'Journal entry':'Sqwib Note',caption:value});status.textContent='Saved to your account as a private feed draft. Open Collective Feed to choose whether to post it.';status.classList.add('ok')}catch(err){console.error(err);status.textContent=err?.message||'Could not upload this draft.';status.classList.remove('ok')}finally{button.disabled=false}};
  }

  function renderFeed(){
    /* The feed is rendered by feed-view.js: posts live in Firestore under their author
       and may carry a picture, so the old per-device text-only prototype is gone rather
       than left to overwrite the real feed on its next render. The shell stays here so
       the route still has a heading, a composer to upgrade, and the shared list the
       connected sources pour into. */
    body.innerHTML=heading('feed')+`<div class="module-grid biglwa-feed-module-grid">
       <section class="module-card wide biglwa-feed-compose-card" aria-labelledby="biglwaFeedComposeHeading">
        <div class="biglwa-feed-compose-head">
         <div><h2 id="biglwaFeedComposeHeading">post to the feed</h2><p>Share a link or photo, with an optional caption. Your caption is saved with your post.</p></div>
         <div class="biglwa-feed-heading-tools">
          <button class="module-action ghost" type="button" id="feedStreamExplore">Explore Veve ↗</button>
          <button class="module-action ghost" type="button" id="feedOrbitDraftToggle" aria-controls="biglwaOrbitDrafts" aria-expanded="false">View pins ready to post</button>
          <label for="biglwaFeedSort">Sort <select id="biglwaFeedSort" class="module-input" aria-label="Sort Collective Feed"><option value="latest">Latest</option><option value="popular">Popular</option><option value="daily">Daily shuffle</option><option value="oldest">Oldest</option></select></label>
         </div>
        </div>
        <div id="biglwaFeedImportStatusRail" class="biglwa-feed-import-rail" aria-label="Connected account import status" hidden></div>
        <div id="biglwaOrbitDrafts" hidden></div>
        <form class="module-form biglwa-feed-compose-form" id="feedComposer">
         <div class="biglwa-feed-compose-fields">
          <label class="biglwa-feed-field" for="feedComposerUrl">Link <span>(optional)</span><input class="module-input" id="feedComposerUrl" name="url" type="url" inputmode="url" placeholder="Paste a link to share"></label>
          <label class="biglwa-feed-field" for="feedComposerCaption">Caption <span>(optional · 500 characters)</span><textarea class="module-input" id="feedComposerCaption" name="caption" maxlength="500" rows="2" placeholder="Add a caption or context…"></textarea></label>
         </div>
         <div class="biglwa-feed-compose-actions">
          <label class="biglwa-pick biglwa-feed-photo-picker"><input type="file" id="biglwaFeedPicker" accept="image/jpeg,image/png,image/webp,image/gif">＋ Add photo <span>(optional)</span></label>
          <button class="module-action biglwa-feed-publish-button" type="submit">Post to Collective Feed</button>
         </div>
         <output class="module-status biglwa-feed-compose-status" id="biglwaFeedStatus" role="status" aria-live="polite"></output>
        </form>
       </section>
       <section class="module-card wide biglwa-feed-wall-card"><h2>Collective Feed</h2><div class="module-list" id="feedPageList"></div></section>
      </div>`;
    const streamExplore=$('#feedStreamExplore',body);
    if(streamExplore)streamExplore.onclick=()=>window.BigLWAOpenModule?.('veve');
  }

  function renderConnect(){
    const invite='https://biglwa.com/login';
    body.innerHTML=heading('connect')+'<section class="module-card wide" style="margin-top:20px"><h2>Invite your people.</h2><p>Send a friend this link to join BIGLWA. They can choose Create account on the welcome page.</p><label for="biglwaInvite">Join BIGLWA link</label><input class="module-input" id="biglwaInvite" readonly value="'+invite+'"><div class="module-actions"><button type="button" class="module-action" id="copyBiglwaInvite">Copy invite link</button><button type="button" class="module-action ghost" id="shareBiglwaInvite">Share invitation</button></div><p class="module-status" id="inviteStatus" role="status"></p></section>';
    const status=$('#inviteStatus',body);
    async function copy(){try{await navigator.clipboard.writeText(invite);status.textContent='Invite link copied.'}catch{const input=$('#biglwaInvite',body);input.focus();input.select();status.textContent='Select and copy the link above to share it.'}}
    $('#copyBiglwaInvite',body).onclick=copy;
    $('#shareBiglwaInvite',body).onclick=async()=>{if(!navigator.share){await copy();return}try{await navigator.share({title:'Join BIGLWA',text:'Join me on BIGLWA — a space for creativity, culture, and connection.',url:invite});status.textContent='Invitation shared.'}catch(e){if(e.name!=='AbortError')await copy()}};
  }

  let activeCameraStream=null;
  function stopCamera(){if(activeCameraStream){activeCameraStream.getTracks().forEach(t=>t.stop());activeCameraStream=null}}
  function renderCamera(){
    stopCamera();
    body.innerHTML=heading('camera')+`<div class="module-grid"><section class="module-card wide"><h2>Photobooth</h2><p>Your camera feed stays in the browser. Nothing is uploaded by starting the booth or taking a frame.</p><div class="photobooth-stage has-intro" id="photoStage"><img class="photobooth-intro" src="/assets/photobooth-before-use.webp?v=20260923-preview-800" alt="Three friends posing together in a black-and-white photobooth portrait" width="800" height="533" loading="lazy" decoding="async"></div><div class="module-actions"><button class="module-action" id="photoStart" type="button">Start camera</button><button class="module-action secondary" id="photoCapture" type="button" disabled>Capture</button><button class="module-action ghost" id="photoFlip" type="button" disabled>Flip camera</button><label class="module-action ghost">Use existing photo<input id="cameraFile" type="file" accept="image/*" hidden></label></div><div class="photo-strip" id="photoStrip"></div><div class="module-status" id="photoStatus">Camera permission is requested only when you press Start camera.</div></section>${renderVideoBooth()}</div>`;
    const stage=$('#photoStage',body),cap=$('#photoCapture',body),flip=$('#photoFlip',body),status=$('#photoStatus',body),strip=$('#photoStrip',body);let facing='user',latestPhotoBlob=null;
    const start=async()=>{try{stopCamera();activeCameraStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:facing},audio:false});stage.classList.remove('has-intro');stage.innerHTML='<video id="boothVideo" autoplay playsinline muted></video>';$('#boothVideo',body).srcObject=activeCameraStream;cap.disabled=false;flip.disabled=false;status.textContent='Photobooth ready.';status.classList.add('ok')}catch(err){status.textContent='Camera could not start. Check browser camera permission or use an existing photo.'}};
    $('#photoStart',body).onclick=start; $('#photoFlip',body).onclick=async()=>{facing=facing==='user'?'environment':'user';await start()};
    cap.onclick=()=>{const v=$('#boothVideo',body);if(!v||!v.videoWidth)return;stage.classList.add('flash');setTimeout(()=>stage.classList.remove('flash'),380);const c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;c.getContext('2d').drawImage(v,0,0,c.width,c.height);const url=c.toDataURL('image/jpeg',.9);fetch(url).then(r=>r.blob()).then(blob=>{latestPhotoBlob=blob});const fig=document.createElement('figure');fig.innerHTML=`<img src="${url}" alt="Photobooth capture"><a href="${url}" download="biglwa-photobooth-${Date.now()}.jpg">save</a><button type="button" class="module-action secondary photo-feed-upload" style="margin-top:5px;width:100%">Upload to Collective Feed</button>`;strip.prepend(fig);status.textContent='Captured. Save it if you want to keep it.';fig.querySelector('.photo-feed-upload').onclick=async()=>{const button=fig.querySelector('.photo-feed-upload');button.disabled=true;status.textContent='Uploading photo draft…';try{await window.__biglwaCollectivePublish?.createStudioDraft({source:'photobooth',title:'Photobooth',caption:'Photobooth capture',blob:latestPhotoBlob});status.textContent='Photo saved to your account as a private feed draft. Open Collective Feed to choose whether to post it.';status.classList.add('ok')}catch(err){console.error(err);status.textContent=err?.message||'Could not upload the photo.';status.classList.remove('ok')}finally{button.disabled=false}}};
    $('#cameraFile',body).onchange=e=>{const f=e.target.files?.[0];if(!f)return;latestPhotoBlob=f;const url=URL.createObjectURL(f);stage.classList.remove('has-intro');stage.innerHTML=`<img src="${url}" alt="Selected photo">`;cap.disabled=true;status.textContent='Local photo preview — choose Upload to Collective Feed when you want to save it.';let old=$('.photo-feed-upload',body);if(old)old.remove();const button=document.createElement('button');button.type='button';button.className='module-action secondary photo-feed-upload';button.textContent='Upload to Collective Feed';button.style.marginTop='8px';button.onclick=async()=>{button.disabled=true;status.textContent='Uploading photo draft…';try{await window.__biglwaCollectivePublish?.createStudioDraft({source:'photobooth',title:'Photobooth',caption:'Photobooth photo',blob:latestPhotoBlob});status.textContent='Photo saved to your account as a private feed draft. Open Collective Feed to choose whether to post it.';status.classList.add('ok')}catch(err){console.error(err);status.textContent=err?.message||'Could not upload the photo.';status.classList.remove('ok')}finally{button.disabled=false}};status.insertAdjacentElement('afterend',button)};
  }

  /* Video Booth: a random one-to-1 video chat booth, held back until the safety work
     below it is finished. Nothing here starts a camera or a call. */
  function renderVideoBooth(){
    return `<section class="module-card wide video-booth-soon" aria-labelledby="videoBoothTitle">
      <div class="video-booth-head">
        <h2 id="videoBoothTitle">Video Booth</h2>
        <span class="coming-soon-badge">Coming soon</span>
      </div>
      <p>Get matched with one person from the community for a private video booth. Filter who you would rather meet, and skip or end a booth whenever you want.</p>
      <div class="video-booth-preview" aria-hidden="true"><span class="video-booth-tile you">You</span><span class="video-booth-tile them">Them</span></div>
      <div class="module-actions">
        <button class="module-action" type="button" disabled aria-disabled="true">Start a booth</button>
        <button class="module-action secondary" type="button" disabled aria-disabled="true">Next booth</button>
      </div>
      <p class="video-booth-status">This booth is not open yet. It stays closed until the safety tools below are ready.</p>
      <ul class="video-booth-checks">
        <li data-ready="0">Report and block controls, with a fast way out of every booth</li>
        <li data-ready="0">A queue and camera check before anyone is matched</li>
        <li data-ready="0">Moderation review of reported booths</li>
        <li data-ready="0">Age and consent rules agreed before the first match</li>
      </ul>
    </section>`;
  }

  const TRENDING_ROOMS=[['lounge','The Lounge','BIGLWA home room'],['minecraft','#minecraft','Trending room'],['fortnite','#fortnite','Trending room'],['deadbydaylight','#deadbydaylight','Trending room'],['rocketleague','#rocketleague','Trending room'],['biglwa','#biglwa','Trending room'],['arcade','#arcade','Trending room'],['support','#support','Trending room'],['gov','#gov','Trending room'],['substack','#substack','Trending room'],['katseye','#katseye','Trending conversation'],['adela','#adela','Trending conversation']];
  const roomStorageKey = slug => slug==='lounge' ? 'biglwaRoomMessages' : 'biglwaRoomMessages_'+slug;
  const customRoomSlug = name => 'custom-'+name.toLowerCase().replace(/^#/,'').replace(/[^a-z0-9-]/g,'');
  const readCustomRooms = () => { const v=readJSON('biglwaCustomRooms',[]); return Array.isArray(v)?v.filter(x=>typeof x==='string'&&x):[]; };
  const writeCustomRooms = list => writeJSON('biglwaCustomRooms', list);
  const roomList = () => TRENDING_ROOMS.map(([slug,name,desc])=>({slug,name,desc})).concat(readCustomRooms().map(name=>({slug:customRoomSlug(name),name:normalizeRoomName(name),desc:'Custom room'})));
  function normalizeRoomName(raw){
    let name=String(raw||'').trim().replace(/\s+/g,'-');
    if(name&&name[0]!=='#')name='#'+name;
    return name;
  }

  function renderPolitc(){
    const categories=[
      {id:'wcw',name:'WCW',subtitle:'Woman Crush Wednesday · appreciation & recognition'},
      {id:'mcm',name:'MCM',subtitle:'Man Crush Monday · appreciation & recognition'},
      {id:'hunting',name:'Hunting Season',subtitle:'Public records, institutional power & accountability · no harassment'},
      {id:'cunting',name:'Cunting Season',subtitle:'Baddies · icons, creators & cultural standouts'}
    ];
    const storageKey='biglwaPolitcNominationsV1';
    const items=readJSON(storageKey,[]);
    const nominations=Array.isArray(items)?items:[];
    const hiddenCurated=readJSON('biglwaPolitcHiddenCuratedV1',[]);
    const curatedHidden=new Set(Array.isArray(hiddenCurated)?hiddenCurated:[]);
    // Curated introductory records are examples for browsing, not verdicts on
    // anyone's character or invitations to target them.
    const curated=[{"id":"curated-1","category":"cunting","name":"Zendaya","note":"Actor and producer; screen and fashion figure.","source":"https://www.britannica.com/biography/Zendaya","photo":"","curated":true},{"id":"curated-2","category":"cunting","name":"Beyoncé","note":"Singer, songwriter and cultural innovator.","source":"https://www.britannica.com/biography/Beyonce","photo":"","curated":true},{"id":"curated-3","category":"cunting","name":"Rihanna","note":"Singer, entrepreneur and beauty industry founder.","source":"https://www.britannica.com/biography/Rihanna","photo":"","curated":true},{"id":"curated-4","category":"cunting","name":"Jennifer Lawrence","note":"Academy Award-winning actor.","source":"https://www.britannica.com/biography/Jennifer-Lawrence","photo":"","curated":true},{"id":"curated-5","category":"cunting","name":"Anne Hathaway","note":"Academy Award-winning actor.","source":"https://www.britannica.com/biography/Anne-Hathaway-American-actress","photo":"","curated":true},{"id":"curated-6","category":"cunting","name":"Ida B. Wells","note":"Journalist and anti-lynching civil rights organizer.","source":"https://www.nps.gov/people/ida-b-wells-barnett.htm","photo":"","curated":true},{"id":"curated-7","category":"cunting","name":"Malcolm X","note":"Black liberation leader and human-rights advocate.","source":"https://www.britannica.com/biography/Malcolm-X","photo":"","curated":true},{"id":"curated-8","category":"cunting","name":"Martin Luther King Jr.","note":"Civil rights organizer and Nobel Peace Prize laureate.","source":"https://www.nps.gov/malu/index.htm","photo":"","curated":true},{"id":"curated-9","category":"cunting","name":"Elaine Brown","note":"Former chair of the Black Panther Party.","source":"https://www.britannica.com/biography/Elaine-Brown","photo":"","curated":true},{"id":"curated-10","category":"cunting","name":"Kathleen Cleaver","note":"Black Panther Party leader and legal scholar.","source":"https://en.wikipedia.org/wiki/Kathleen_Cleaver","photo":"","curated":true},{"id":"curated-11","category":"cunting","name":"Ericka Huggins","note":"Black Panther Party organizer and educator.","source":"https://en.wikipedia.org/wiki/Ericka_Huggins","photo":"","curated":true},{"id":"curated-12","category":"cunting","name":"Fred Hampton","note":"Black Panther Party organizer and community leader.","source":"https://en.wikipedia.org/wiki/Fred_Hampton","photo":"","curated":true},{"id":"curated-13","category":"cunting","name":"Bobby Seale","note":"Co-founder of the Black Panther Party.","source":"https://www.britannica.com/biography/Bobby-Seale","photo":"","curated":true},{"id":"curated-14","category":"cunting","name":"Huey P. Newton","note":"Co-founder of the Black Panther Party.","source":"https://www.britannica.com/biography/Huey-P-Newton","photo":"","curated":true},{"id":"curated-15","category":"hunting","name":"Derek Chauvin","note":"Convicted in connection with George Floyd’s murder; public court record.","source":"https://www.justice.gov/opa/pr/former-minneapolis-police-officer-derek-chauvin-sentenced-more-20-years-prison-depriving","photo":"","curated":true},{"id":"curated-16","category":"hunting","name":"Jeffrey Epstein","note":"Convicted sex offender; documented institutional accountability issues.","source":"https://www.justice.gov/epstein","photo":"","curated":true},{"id":"curated-17","category":"hunting","name":"Elon Musk","note":"Billionaire technology executive; examine ownership and public influence.","source":"https://www.britannica.com/money/Elon-Musk","photo":"","curated":true},{"id":"curated-18","category":"hunting","name":"Jeff Bezos","note":"Amazon founder; examine concentrated wealth and corporate power.","source":"https://www.britannica.com/money/Jeff-Bezos","photo":"","curated":true},{"id":"curated-19","category":"hunting","name":"Peter Thiel","note":"Billionaire investor and political donor; examine public influence.","source":"https://www.britannica.com/money/Peter-Thiel","photo":"","curated":true},{"id":"curated-20","category":"hunting","name":"Cornell University · Chi Phi case","note":"2026 civil lawsuit concerning alleged sexual assault in 2024 and Cornell’s response. Investigation reopened; allegations disputed and not established in court.","source":"https://www.nbcchicago.com/news/local/cornell-7-what-happened-with-the-case-what-to-know-as-prosecutor-reopens-investigation/3995362/","photo":"","curated":true},{"id":"curated-21","category":"cunting","name":"Angela Davis","note":"Scholar and organizer for prison abolition, civil rights, and liberation.","source":"https://www.britannica.com/biography/Angela-Davis","photo":"","curated":true},{"id":"curated-22","category":"cunting","name":"Fannie Lou Hamer","note":"Voting-rights organizer and Mississippi Freedom Democratic Party leader.","source":"https://www.nps.gov/people/fannie-lou-hamer.htm","photo":"","curated":true},{"id":"curated-23","category":"cunting","name":"Shirley Chisholm","note":"First Black woman elected to the U.S. Congress.","source":"https://history.house.gov/People/Listing/C/CHISHOLM,-Shirley-Anita-(C000371)/","photo":"","curated":true},{"id":"curated-24","category":"cunting","name":"Audre Lorde","note":"Poet and activist whose writing shaped Black feminist thought.","source":"https://www.poetryfoundation.org/poets/audre-lorde","photo":"","curated":true},{"id":"curated-25","category":"cunting","name":"bell hooks","note":"Feminist theorist and writer on race, love, education, and power.","source":"https://www.britannica.com/biography/bell-hooks","photo":"","curated":true},{"id":"curated-26","category":"cunting","name":"Toni Morrison","note":"Nobel Prize–winning novelist and editor.","source":"https://www.nobelprize.org/prizes/literature/1993/morrison/facts/","photo":"","curated":true},{"id":"curated-27","category":"cunting","name":"Nina Simone","note":"Singer, pianist, and civil-rights voice.","source":"https://www.britannica.com/biography/Nina-Simone","photo":"","curated":true},{"id":"curated-28","category":"cunting","name":"Tarana Burke","note":"Organizer who founded the Me Too movement.","source":"https://metoomvmt.org/get-to-know-us/tarana-burke-founder/","photo":"","curated":true}];
    const visibleNominations=[...curated.filter(item=>!curatedHidden.has(item.id)),...nominations];

    const photoData = new Map();
    const states='AL Alabama|AK Alaska|AZ Arizona|AR Arkansas|CA California|CO Colorado|CT Connecticut|DE Delaware|DC District of Columbia|FL Florida|GA Georgia|HI Hawaii|ID Idaho|IL Illinois|IN Indiana|IA Iowa|KS Kansas|KY Kentucky|LA Louisiana|ME Maine|MD Maryland|MA Massachusetts|MI Michigan|MN Minnesota|MS Mississippi|MO Missouri|MT Montana|NE Nebraska|NV Nevada|NH New Hampshire|NJ New Jersey|NM New Mexico|NY New York|NC North Carolina|ND North Dakota|OH Ohio|OK Oklahoma|OR Oregon|PA Pennsylvania|RI Rhode Island|SC South Carolina|SD South Dakota|TN Tennessee|TX Texas|UT Utah|VT Vermont|VA Virginia|WA Washington|WV West Virginia|WI Wisconsin|WY Wyoming'.split('|').map(s=>[s.slice(0,2),s.slice(3)]);
    const savedState=localStorage.getItem('biglwaPolitcVotingState')||'';
    const savedZip=localStorage.getItem('biglwaPolitcVotingZip')||'';

    const resources=[
      ['Vote.gov','Federal registration and voter information','https://vote.gov/'],
      ['US Election Assistance Commission','How elections work and official state election offices','https://www.eac.gov/voters'],
      ['USA.gov election results','Find election results and voting information','https://www.usa.gov/voting-and-elections'],
      ['Al Jazeera','International reporting and live coverage','https://www.aljazeera.com/'],
      ['Genocide Watch','Country alerts and genocide-prevention research','https://www.genocidewatch.com/'],
      ['United Nations','UN news, humanitarian reporting and resolutions','https://news.un.org/en/'],
      ['UN Human Rights','Independent reporting, statements and investigations','https://www.ohchr.org/en']
    ];
    // Verified Wikimedia page titles, never free-form searches that can attach
    // an unrelated person's photo to a case or nomination.
    const wikiPortraits={
      'curated-1':'Zendaya','curated-2':'Beyoncé','curated-3':'Rihanna',
      'curated-4':'Jennifer Lawrence','curated-5':'Anne Hathaway',
      'curated-6':'Ida B. Wells','curated-7':'Malcolm X','curated-8':'Martin Luther King Jr.',
      'curated-9':'Elaine Brown','curated-10':'Kathleen Cleaver','curated-11':'Ericka Huggins',
      'curated-12':'Fred Hampton','curated-13':'Bobby Seale','curated-14':'Huey P. Newton',
      'curated-15':'Derek Chauvin','curated-16':'Jeffrey Epstein',
      'curated-17':'Elon Musk','curated-18':'Jeff Bezos','curated-19':'Peter Thiel',
      'curated-21':'Angela Davis','curated-22':'Fannie Lou Hamer',
      'curated-23':'Shirley Chisholm','curated-24':'Audre Lorde',
      'curated-25':'bell hooks','curated-26':'Toni Morrison',
      'curated-27':'Nina Simone','curated-28':'Tarana Burke'
    };
    // Wikimedia Commons files checked by title; these portraits remain usable
    // even if the Wikipedia API request is blocked on the visitor's browser.
    const verifiedPosterPhotos={
      'curated-1':'https://commons.wikimedia.org/wiki/Special:FilePath/Zendaya_2024.jpg?width=480',
      'curated-2':'https://commons.wikimedia.org/wiki/Special:FilePath/Beyonc%C3%A9_accepts_the_Innovator_award_at_iHeart_Awards_2024.jpg?width=480',
      'curated-3':'https://commons.wikimedia.org/wiki/Special:FilePath/Rihanna_Fenty_2018.png?width=480'
    };
    const portrait=item=>{
      const monogram=String(item.name||'').split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toLocaleUpperCase();
      const record=item.category==='hunting';
      const wiki=wikiPortraits[item.id]||'';
      return '<article class="politc-person politc-poster'+(record?' is-record':' is-icon')+'">'+
        '<div class="politc-poster-eyebrow">'+(record?'PUBLIC RECORD · CASE FILE':'WANTED · FOR ICON STATUS')+'</div>'+
        '<div class="politc-poster-photo"'+(wiki?' data-politc-wiki="'+esc(wiki)+'"':'')+(verifiedPosterPhotos[item.id]?' data-politc-verified="'+esc(verifiedPosterPhotos[item.id])+'"':'')+'>'+
         (item.photo?'<img src="'+esc(item.photo)+'" alt="Portrait of '+esc(item.name)+'" loading="lazy" decoding="async">':
          '<span class="politc-poster-monogram" aria-hidden="true">'+esc(monogram)+'</span>')+
        '</div>'+
        '<strong>'+esc(item.name)+'</strong>'+
        '<details class="politc-poster-context"><summary>Details & source ↗</summary>'+
         (item.note?'<p>'+esc(item.note)+'</p>':'')+
         (item.source?'<a href="'+esc(item.source)+'" target="_blank" rel="noopener noreferrer">Read source ↗</a>':'<span>Personal nomination · not verified</span>')+
        '</details>'+
        '<button type="button" class="politc-poster-remove" data-politc-delete="'+esc(item.id)+'" aria-label="Remove '+esc(item.name)+'">×</button>'+
      '</article>';
    };
    const panel=(cat)=>{
      const isPoster=cat.id==='hunting'||cat.id==='cunting';
      const people=visibleNominations.filter(x=>x.category===cat.id);
      return '<section class="politc-panel politc-collection-panel'+(isPoster?' politc-vintage-panel':'')+'" data-politc-season="'+cat.id+'">'+
        '<div class="politc-season-head"><div><h3>'+esc(cat.name)+'</h3><p class="politc-sub">'+esc(cat.subtitle)+'</p></div>'+
        '<div class="politc-season-tools"><span class="politc-record-count">'+people.length+' entries</span>'+
        '<button class="politc-nominate-button" type="button" data-politc-nominate="'+cat.id+'" aria-controls="politc-nominate-'+cat.id+'" aria-expanded="false">✦ Nominate</button></div></div>'+
        '<div class="politc-portraits">'+(people.length?people.map(portrait).join(''):'<p class="politc-note politc-empty">No entries yet. Nominate someone to begin.</p>')+'</div>'+
        '<div class="politc-nomination-drawer" id="politc-nominate-'+cat.id+'" hidden>'+
        '<form class="politc-form" data-politc-form="'+cat.id+'"><label>Nominee<input required name="name" maxlength="70" placeholder="Name"></label><label>Photo (black & white on display)<input name="photo" type="file" accept="image/*"></label><label>Caption / context<textarea name="note" maxlength="280" rows="2" placeholder="Provide grounded context"></textarea></label><label>Evidence / profile link (optional)<input name="source" type="url" placeholder="https://"></label><button type="submit">Add nomination</button><small>Saved privately on this device, not published. No threats, addresses, personal contact details, or harassment. Distinguish allegations from findings.</small></form></div></section>';
    };
    const val=Math.min(100,Math.max(0,Number(localStorage.getItem('biglwaPolitcPendulum')||50)));
    const electionDate=new Date('2026-11-03T00:00:00-08:00');
    const caNominees=[['Xavier Becerra','Democratic'],['Steve Hilton','Republican']];
    const stateOptions=states.map(([code,name])=>'<option value="'+code+'" '+(savedState===code?'selected':'')+'>'+esc(name)+'</option>').join('');
    const nomineeCards=()=>savedState==='CA'?'<div class="politc-portraits">'+caNominees.map(([name,party])=>'<article class="politc-person"><div style="height:100px;display:grid;place-items:center;background:#ddd4c7;font:28px Georgia,serif" aria-hidden="true">'+esc(name.split(' ').map(x=>x[0]).join(''))+'</div><strong>'+esc(name)+'</strong><small>'+esc(party)+' · Governor</small></article>').join('')+'</div><p class="politc-note">California statewide governor nominees. District and local candidates vary by residential address. Verify against the official certified list.</p>': '<p class="politc-note">Candidates vary by state, county and voting district. Use “See my ballot & nominees” to view the applicable roster; no names are guessed from a ZIP code.</p>';
    const electionPanel='<section class="politc-panel politc-election-zone" style="grid-column:1/-1;background:var(--widget-bg,#f7f3eb);color:var(--widget-ink,#28231e);border:1px solid rgba(120,120,120,.22);outline:0;border-radius:var(--widget-radius,16px)"><div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap"><div><span style="font:600 11px system-ui;letter-spacing:.12em;text-transform:uppercase">Election desk · United States</span><h3 style="text-align:left;border:0;padding:5px 0;font:400 30px Georgia,serif;letter-spacing:0;text-transform:none">November 3, 2026 · General Election</h3></div><div id="politcCountdown" style="font:700 clamp(22px,4vw,44px)/1.2 Georgia,serif" aria-live="off"></div></div><p class="politc-note">Countdown to Election Day (Pacific time). Earlier state or local special elections may have different dates.</p><div class="politc-form" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr));align-items:end"><label>Voting state<select id="politcState"><option value="">Choose state</option>'+stateOptions+'</select></label><label>ZIP code (optional)<input id="politcZip" inputmode="numeric" maxlength="5" pattern="[0-9]{5}" placeholder="Your voting ZIP" value="'+esc(savedZip)+'"></label><a class="politc-source" href="https://www.vote411.org/ballot" target="_blank" rel="noopener noreferrer">See my ballot & nominees ↗</a></div><p class="politc-note">Select your voting residence, not your current physical location. ZIP alone cannot identify every voting district. Your selection is stored only on this device.</p><h3 style="font:400 25px Georgia,serif;text-align:left;border:0;padding:8px 0;letter-spacing:0;text-transform:none">Nominees & candidates <span id="politcStateLabel" style="font:13px system-ui"></span></h3><div id="politcNominees">'+nomineeCards()+'</div><div class="politc-resources" id="politcElectionLinks"></div></section>';
    body.innerHTML=heading('politc')+'<div class="politc-board"><div class="politc-grid">'+electionPanel+categories.map(panel).join('')+'</div>'+
      '<section class="politc-panel"><h3>Political Pendulum · Live</h3><p class="politc-sub">Current congressional seat balance, updated from published membership data. This is not a measure of public opinion or ideology.</p><div id="politcLiveBalance" aria-live="polite" class="politc-live-state">Checking House and Senate membership…</div><p class="politc-note"><a href="https://github.com/unitedstates/congress-legislators" target="_blank" rel="noopener noreferrer">Congress Legislators data ↗</a> · Independents shown separately.</p></section>'+
      '<section class="politc-panel"><h3>Project 2025 Tracker · Live</h3><p class="politc-sub">Community-reported policy implementation status, not an endorsement.</p><div id="politcProject2025" aria-live="polite" class="politc-live-state">Checking tracked objectives…</div><p class="politc-note"><a href="https://www.project2025.observer/en" target="_blank" rel="noopener noreferrer">View Project 2025 Tracker and its underlying evidence ↗</a></p></section>'+
      '<section class="politc-panel" id="politcEpsteinObserver"><h3>Epstein Observer · Fallout Tracker</h3>'+
 '<p class="politc-sub">A public, independent tracker of documents and reported institutional consequences related to Jeffrey Epstein. Investigate claims through the cited records rather than relying on a name or a status alone.</p>'+
 '<div class="politc-resources">'+
 '<a class="politc-source" href="https://epstein.observer/" target="_blank" rel="noopener noreferrer">Open Epstein Observer ↗<small>Search the independent fallout tracker, profiles and document references</small></a>'+
 '<a class="politc-source" href="https://www.justice.gov/epstein" target="_blank" rel="noopener noreferrer">DOJ Epstein Library ↗<small>Search official disclosures, redacted releases and source materials</small></a>'+
 '<a class="politc-source" href="https://oversight.house.gov/release/oversight-committee-releases-epstein-records-provided-by-the-department-of-justice/" target="_blank" rel="noopener noreferrer">House Oversight releases ↗<small>Committee notices and records with publication context</small></a>'+
 '<a class="politc-source" href="https://vault.fbi.gov/jeffrey-epstein/" target="_blank" rel="noopener noreferrer">FBI Vault ↗<small>Publicly released records and FOIA files</small></a></div>'+
 '<p class="politc-note">Epstein Observer is a third-party research project, not an official agency source. Inclusion or mention in records is not evidence of criminal wrongdoing. Respect survivors and do not republish sensitive personal information. Open source links for current updates; Big LWA does not independently validate its counts or statuses.</p></section>'+
       '<div style="display:flex;justify-content:flex-end;grid-column:1/-1"><button type="button" class="politc-source" id="politcLiveRefresh" style="cursor:pointer">↻ Refresh live data</button></div>'+
      '<section class="politc-panel"><h3>Vote · Data · Resources</h3><p class="politc-sub">Research, register, read critically, and follow humanitarian developments directly from their sources.</p><div class="politc-resources">'+resources.map(r=>'<a class="politc-source" target="_blank" rel="noopener noreferrer" href="'+esc(r[2])+'">'+esc(r[0])+'<small>'+esc(r[1])+'</small></a>').join('')+'</div><p class="politc-note">External sources open in a new tab. These are resource links, not an invented live news or election-data feed. Political news and estimates should be checked against primary sources.</p></section></div>';
    // Progressive disclosure and priority order: live verification, quick
    // resources, election desk, then cultural and accountability collections.
    const board=body.querySelector('.politc-board');
    const grid=board?.querySelector('.politc-grid');
    if(board&&grid){
      const standalone=[...board.children].filter(node=>node.matches('section.politc-panel'));
      const trackers=standalone.slice(0,3);
      const election=grid.querySelector('.politc-election-zone');
      const resourcePanel=standalone.find(node=>/Vote · Data · Resources/i.test(node.querySelector('h3')?.textContent||''));
      const refreshBlock=[...board.children].find(node=>node.querySelector('#politcLiveRefresh'));
      const liveZone=document.createElement('section');
      liveZone.className='politc-live-zone';
      liveZone.setAttribute('aria-label','Live political trackers');
      const liveTitle=document.createElement('h2');
      liveTitle.textContent='Live trackers';
      liveZone.append(liveTitle,...trackers);
      if(refreshBlock)liveZone.append(refreshBlock);
      if(election)board.insertBefore(election,grid);
      board.insertBefore(liveZone,grid);
      if(resourcePanel){
        resourcePanel.classList.add('politc-resource-zone');
        board.insertBefore(resourcePanel,grid);
      }
    }
    const stateSelect=$('#politcState',body),zipField=$('#politcZip',body),nomineeArea=$('#politcNominees',body),stateLabel=$('#politcStateLabel',body),links=$('#politcElectionLinks',body),clock=$('#politcCountdown',body);
    const updateClock=()=>{const ms=electionDate-Date.now();clock.textContent=ms>0?Math.ceil(ms/86400000)+' days left':ms>-86400000?'Election Day':'Election passed';};
    updateClock();const ticker=setInterval(()=>{if(!body.contains(clock)){clearInterval(ticker);return;}updateClock();},60000);
    const syncElection=()=>{
      const code=stateSelect.value;try{localStorage.setItem('biglwaPolitcVotingState',code);localStorage.setItem('biglwaPolitcVotingZip',zipField.value.trim())}catch{}
      stateLabel.textContent=code?'· '+states.find(x=>x[0]===code)?.[1]:'· Select a state';
      nomineeArea.innerHTML=code==='CA'?'<div class="politc-portraits">'+caNominees.map(([name,party])=>'<article class="politc-person"><div style="height:100px;display:grid;place-items:center;background:#ddd4c7;font:28px Georgia,serif" aria-hidden="true">'+esc(name.split(' ').map(x=>x[0]).join(''))+'</div><strong>'+esc(name)+'</strong><small>'+esc(party)+' · Governor</small></article>').join('')+'</div><p class="politc-note">These are the statewide governor nominees; district and local ballots depend on residence.</p>':'<p class="politc-note">Nominee lists depend on the state and voting district. Open your official ballot guide to see the verified candidates for your address.</p>';
      const urls=code==='CA'?[['Certified California candidates','https://elections.cdn.sos.ca.gov/statewide-elections/2026-general/cert-list-candidates.pdf'],['California ballot lookup','https://www.sos.ca.gov/elections/polling-place'],['California voter guide','https://www.sos.ca.gov/elections/upcoming-elections/general-election-november-3-2026']]:[['Find state election office','https://www.usa.gov/state-election-office'],['Look up candidates by address','https://www.vote411.org/ballot']];
      links.innerHTML=urls.map(([label,url])=>'<a class="politc-source" href="'+url+'" target="_blank" rel="noopener noreferrer">'+esc(label)+' ↗</a>').join('');
    };
    stateSelect.addEventListener('change',syncElection);zipField.addEventListener('change',syncElection);syncElection();
    const balance=$('#politcLiveBalance',body),project=$('#politcProject2025',body),refresh=$('#politcLiveRefresh',body);
    const liveEndpoint='https://biglwa-politc-live.leianmulatre-284.workers.dev/politc';
    const percent=(n,total)=>total>0?Math.max(0,Math.min(100,(Number(n)||0)*100/total)):0;
    const number=n=>Number(n||0).toLocaleString();
    const chamber=(title,data)=>{
      const total=Number(data?.occupied)||0;if(total<=0)return '';
      const d=Number(data.Democrat)||0,r=Number(data.Republican)||0,i=Number(data.Independent)||0,o=Number(data.Other)||0;
      return '<div class="politc-live-chamber"><strong>'+esc(title)+'</strong><div class="politc-live-track" role="img" aria-label="'+esc(title)+': '+number(d)+' Democratic, '+number(r)+' Republican, '+number(i+o)+' other seats">'+
        '<span style="width:'+percent(d,total)+'%;background:#3d76b7"></span>'+
        '<span style="width:'+percent(i+o,total)+'%;background:#8b8b8b"></span>'+
        '<span style="width:'+percent(r,total)+'%;background:#b44b50"></span></div>'+
        '<small>Democratic '+number(d)+' · Republican '+number(r)+' · Independent / other '+number(i+o)+' · '+number(total)+' occupied</small></div>';
    };
    const timestamp=iso=>{const date=new Date(iso);return Number.isNaN(date.getTime())?'Date unavailable':date.toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'})};
    const showPolitcData=(data,isCached=false)=>{
      const checked='<p class="politc-note">'+(isCached?'Previously checked':'Checked')+' '+esc(timestamp(data.checkedAt))+(isCached?' · cached, not current':' · refreshes about every 15 minutes')+'</p>';
      if(data.congress?.state==='ok'&&data.congress.house?.occupied&&data.congress.senate?.occupied){
        balance.innerHTML=chamber('House of Representatives',data.congress.house)+chamber('Senate',data.congress.senate)+checked;
      }else{
        balance.innerHTML='<p class="politc-note">Live membership data unavailable. <a href="https://clerk.house.gov/" target="_blank" rel="noopener noreferrer">House Clerk</a> · <a href="https://www.senate.gov/senators/" target="_blank" rel="noopener noreferrer">Senate</a>.</p>';
      }
      const p=data.project2025;
      if(p?.state==='ok'&&p.total>0){
        const weighted=Math.min(100,Math.max(0,Number(p.weightedPct)||0));
        project.innerHTML='<div style="display:flex;align-items:baseline;justify-content:space-between;gap:8px"><strong style="font:600 28px Georgia,serif">'+number(weighted)+'%</strong><small>'+number(p.total)+' tracked objectives</small></div>'+
          '<div class="politc-live-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+weighted+'" aria-label="Project 2025 Tracker weighted progress"><span style="width:'+weighted+'%"></span></div>'+
          '<p style="font:600 12px/1.6 system-ui">'+number(p.done)+' completed · '+number(p.inProgress)+' in progress · '+number(p.notStarted)+' remaining</p>'+
          '<p class="politc-note">Tracker method: completed counts fully; in progress counts half. Not a percentage of laws passed or effects on people.</p>'+checked;
      }else{
        project.innerHTML='<p class="politc-note">Live tracker data unavailable. Open the source to see its latest published statuses.</p>';
      }
    };
    let lastVerified=readJSON('biglwaPolitcLastVerified',null);if(lastVerified&&lastVerified.checkedAt)showPolitcData(lastVerified,true);
    const refreshPolitc=async()=>{
      refresh.disabled=true;refresh.textContent='Checking sources…';
      try{
        const response=await fetch(liveEndpoint,{cache:'no-store'});
        if(!response.ok)throw Error('Live endpoint unavailable');
        const data=await response.json();if(!data||data.version!==1)throw Error('Invalid live data');
        if(!balance.isConnected||!project.isConnected)return;
        if(data.congress?.state==='ok'||data.project2025?.state==='ok'){
          writeJSON('biglwaPolitcLastVerified',data);lastVerified=data;showPolitcData(data);
        }else if(!lastVerified){balance.textContent='Could not verify live Congress data.';project.textContent='Could not verify tracker data.'}
      }catch(error){
        if(!lastVerified){balance.textContent='Live balance unavailable — see source link.';project.textContent='Live tracker unavailable — see source link.'}
        console.warn('BIGLWA politc live refresh:',error);
      }finally{if(refresh.isConnected){refresh.disabled=false;refresh.textContent='↻ Refresh live data'}}
    };
    refresh.addEventListener('click',refreshPolitc);
    if(window.__biglwaPolitcLiveTimer)clearInterval(window.__biglwaPolitcLiveTimer);
    window.__biglwaPolitcLiveTimer=setInterval(()=>{if(!balance.isConnected){clearInterval(window.__biglwaPolitcLiveTimer);return;}refreshPolitc();},900000);
    refreshPolitc();
    // Wikimedia only supplies images for explicitly named, existing public
    // figures. Empty / blocked results retain the intentional monogram.
    const portraits=[...body.querySelectorAll('.politc-poster-photo[data-politc-wiki]')];
    const cache=window.__biglwaPolitcWikimediaCache||(window.__biglwaPolitcWikimediaCache=new Map());
    const pending=portraits.filter(el=>!cache.has(el.dataset.politcWiki));
    const hydrateImage=(host,url)=>{
      if(!host?.isConnected||!url||host.querySelector('img'))return;
      try{
        const parsed=new URL(url);
        if(parsed.protocol!=='https:'||!/(^|\.)wikimedia\.org$/.test(parsed.hostname))return;
      }catch{return}
      const image=new Image();
      image.alt='Portrait of '+host.closest('.politc-person')?.querySelector('strong')?.textContent;
      image.loading='lazy';image.decoding='async';
      image.onload=()=>{if(!host.isConnected)return;host.querySelector('.politc-poster-monogram')?.remove();host.append(image);};
      image.onerror=()=>{};
      image.src=url;
    };
    portraits.forEach(el=>{const val=el.dataset.politcVerified||cache.get(el.dataset.politcWiki);if(val)hydrateImage(el,val)});
    if(pending.length){
      const titles=[...new Set(pending.map(el=>el.dataset.politcWiki))];
      const uri='https://en.wikipedia.org/w/api.php?'+new URLSearchParams({
        action:'query',format:'json',redirects:'1',prop:'pageimages',
        pithumbsize:'480',titles:titles.join('|'),origin:'*'
      });
      fetch(uri,{mode:'cors'}).then(r=>{if(!r.ok)throw Error('Wiki thumbnails unavailable');return r.json()})
      .then(data=>{
        const pages=Object.values(data?.query?.pages||{});
        const found=new Map(pages.map(page=>[String(page.title||''),String(page.thumbnail?.source||'')]));
        const redirects=new Map((data?.query?.redirects||[]).map(row=>[String(row.from||''),String(row.to||'')]));
        for(const name of titles){const resolved=redirects.get(name)||name;cache.set(name,found.get(resolved)||'');}
        for(const el of portraits)hydrateImage(el,el.dataset.politcVerified||cache.get(el.dataset.politcWiki));
      }).catch(async()=>{
        // Wikipedia's multi-title endpoint can be denied by browsers or a privacy
        // extension. Try per-person article summaries as a second source; only
        // accept actual Wikimedia-hosted portraits, never approximate name matches.
        await Promise.allSettled(titles.map(async name=>{
          const url='https://en.wikipedia.org/api/rest_v1/page/summary/'+encodeURIComponent(name.replaceAll(' ','_'));
          try{
            const response=await fetch(url,{mode:'cors'});
            if(!response.ok)throw Error('No article thumbnail');
            const info=await response.json();
            cache.set(name,String(info.thumbnail?.source||info.originalimage?.source||''));
          }catch{cache.set(name,'')}
        }));
        for(const el of portraits)hydrateImage(el,el.dataset.politcVerified||cache.get(el.dataset.politcWiki));
      });
    }
    body.querySelectorAll('[data-politc-nominate]').forEach(button=>button.addEventListener('click',()=>{
      const drawer=body.querySelector('#politc-nominate-'+button.dataset.politcNominate);
      if(!drawer)return;
      const opening=drawer.hidden;
      drawer.hidden=!opening;
      button.setAttribute('aria-expanded',String(opening));
      if(opening)drawer.querySelector('input[name="name"]')?.focus();
    }));
    body.querySelectorAll('[data-politc-delete]').forEach(button=>button.addEventListener('click',()=>{
      const target=String(button.dataset.politcDelete||'');
      try{
        if(target.startsWith('curated-')){
          curatedHidden.add(target);
          writeJSON('biglwaPolitcHiddenCuratedV1',[...curatedHidden]);
        }else{
          writeJSON(storageKey,nominations.filter(x=>String(x.id)!==target));
        }
        renderPolitc();
      }catch(e){alert('Unable to save changes on this device.')}
    }));
    body.querySelectorAll('[data-politc-form]').forEach(form=>form.addEventListener('submit',async(e)=>{
      e.preventDefault();const fd=new FormData(form),name=String(fd.get('name')||'').trim(),note=String(fd.get('note')||'').trim(),source=String(fd.get('source')||'').trim();
      if(!name)return;
      const file=fd.get('photo');let photo='';
      if(file instanceof File&&file.size){
        if(file.size>2*1024*1024){alert('Please use an image smaller than 2 MB.');return;}
        photo=await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result||''));reader.onerror=()=>resolve('');reader.readAsDataURL(file);});
      }
      try{writeJSON(storageKey,[...nominations,{id:String(Date.now())+'-'+Math.random().toString(36).slice(2,7),category:form.dataset.politcForm,name,note,source,photo}]);renderPolitc()}
      catch(err){alert('This browser could not save the nomination. Try a smaller photo.');}
    }));
  }

  function renderRoom(){
    let slug=String(localStorage.getItem('biglwaActiveRoom')||'lounge');
    const allRooms=roomList();
    if(!allRooms.some(r=>r.slug===slug))slug='lounge';
    const room=allRooms.find(r=>r.slug===slug)||allRooms[0],storage=roomStorageKey(room.slug);
    const messages=readJSON(storage,[{text:'Welcome to '+room.name+'.',mine:false}]);
    const chip=(r,i)=>`<button class="module-launcher" type="button" data-room="${i}" ${r.slug===slug?'aria-pressed="true"':''}><b>${esc(r.name)}</b><small>${esc(r.desc)}</small></button>`;
    body.innerHTML=heading('rooms')+`<div class="module-grid">
      <section class="module-card wide"><h2>Trending rooms</h2><p>Tap a room to drop in — conversation stays local for now.</p><div class="module-launchers" id="trendingRooms">${allRooms.map((r,i)=>chip(r,i)).join('')}</div></section>
      <section class="module-card wide"><div class="room-head" style="display:flex;align-items:center;gap:10px"><h2>${esc(room.name)}</h2><span style="font-size:11px;padding:2px 8px;border:1px solid rgba(127,127,127,.35);border-radius:999px;color:#999;text-transform:uppercase;letter-spacing:.08em">${esc(room.slug==='lounge'?'home':room.slug.slice(0,7)==='custom-'?'custom':'trending')}</span></div><div class="module-chat" id="roomChat">${messages.map(m=>`<div class="module-bubble ${m.mine?'mine':''}">${esc(m.text)}</div>`).join('')}</div><form class="module-form two" id="roomForm" style="margin-top:8px"><input class="module-input" name="text" placeholder="Say something in ${esc(room.name)}…"><button class="module-action" type="submit">Send</button></form><div class="module-status">Local prototype — real room sync comes with the backend. Messages stay in this browser.</div></section>
      <section class="module-card wide"><h2>Create a room</h2><p>Names start with <strong>#</strong> and spaces become <strong>-</strong> (e.g. <em>#my hangout</em> → <em>#my-hangout</em>).</p><form class="module-form two" id="createRoomForm" style="margin-top:8px"><input class="module-input" name="room" placeholder="#new-room" maxlength="32" autocomplete="off"><button class="module-action" type="submit">Create room</button></form><div class="module-status" id="createRoomStatus">Created rooms are saved in this browser and appear in the trending list above.</div></section>
    </div>`;
    const goTo=k=>{const target=allRooms[Number(k)];if(!target)return;localStorage.setItem('biglwaActiveRoom',target.slug);openModule('rooms','',false)};
    $('#trendingRooms',body).onclick=e=>{const b=e.target.closest('[data-room]');if(b)goTo(b.dataset.room)};
    $('#createRoomForm',body).onsubmit=e=>{e.preventDefault();const status=$('#createRoomStatus',body);let raw=(new FormData(e.currentTarget).get('room')||'').trim();const name=normalizeRoomName(raw);if(!name){status.textContent='Type a room name first.';return}if(name.length>32){status.textContent='Room names are capped at 32 characters.';return}if(readCustomRooms().some(x=>normalizeRoomName(x).toLowerCase()===name.toLowerCase())){status.textContent='That room already exists in your list.';return}const list=readCustomRooms();list.push(name);writeCustomRooms(list);localStorage.setItem('biglwaActiveRoom',customRoomSlug(name));openModule('rooms','',false)};
    $('#roomForm',body).onsubmit=e=>{e.preventDefault();const text=(new FormData(e.currentTarget).get('text')||'').trim();if(!text)return;const cur=readJSON(storage,[]);cur.push({text,mine:true});writeJSON(storage,cur);openModule('rooms','',false)};
  }

  function downloadBlob(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},0)}
  function renderTools(){
    body.innerHTML=heading('tools')+'<div class="tool-studio" id="toolStudio"></div>';
    /* The intake page is its own module so the file work stays away from the module router. */
    import('/tools-studio.js?v=20261014-artcraft-creative-lab-3')
      .then(mod=>mod.mountToolsStudio($('#toolStudio',body),{downloadBlob}))
      .catch(error=>{
        $('#toolStudio',body).innerHTML='<section class="module-card wide"><h2>Tools could not start</h2><p>Give the page a refresh and it will load again.</p></section>';
        console.error('BIGLWA Tools:',error);
      });
  }


  function renderGames(){
    const gameLibrary=[
      {title:'culture quiz',image:'/assets/culture-quiz-cubes.png',internal:'cultureQuiz'},
      {title:'2048',image:'/assets/arcade/2048.svg',href:'https://biglwa.com/arcade-puzzles.html?game=2048'},
      {title:'crossword',image:'/assets/arcade/crossword.svg',href:'https://biglwa.com/arcade-puzzles.html?game=crossword'},
      {title:'fireboy & watergirl 5',image:'/assets/arcade/fireboy-watergirl.png',href:'https://www.coolmathgames.com/0-fireboy-and-watergirl-5-elements'},
      {title:'sugar, sugar',image:'/assets/arcade/sugar-sugar.png',href:'https://www.coolmathgames.com/0-sugar-sugar'},
      {title:'slither.io',image:'/assets/arcade/slither-io.jpg',href:'https://slither.io/'},
      {title:'raft wars',image:'/assets/arcade/rat-wars.png',href:'https://www.coolmathgames.com/0-raft-wars'},
      {title:'sudoku',image:'/assets/arcade/sudoku.jpg',href:'https://www.coolmathgames.com/0-sudoku'},
      {title:'wordle',image:'/assets/arcade/wordle.png',href:'https://www.nytimes.com/games/wordle/index.html'},
      {title:'worldguessr',image:'/assets/arcade/worldguessr.jpg',href:'https://worldguessr.com/'},
      {title:'cookie clicker',image:'/assets/arcade/cookie-clicker.jpg',href:'https://orteil.dashnet.org/cookieclicker/'},
      {title:'chess',image:'/assets/arcade/chess.jpg',href:'https://www.chess.com/play/online'},
      {title:'fancy pants',image:'/assets/arcade/fancy-man.webp',href:'https://www.coolmathgames.com/0-fancy-pants-adventures'},
      {title:'n+',image:'/assets/arcade/nplus.webp',href:'https://www.coolmathgames.com/0-n-game'},
      {title:'run 3',image:'/assets/arcade/run-3.png',href:'https://www.coolmathgames.com/0-run-3'},
      {title:'five nights at freddy’s',image:'/assets/arcade/five-nights-at-freddys.jpg',href:'https://store.steampowered.com/app/319510/Five_Nights_at_Freddys/'},
      {title:'swords & sandals ii',image:'/assets/arcade/swords-and-sandals.jpg',href:'https://www.coolmathgames.com/0-swords-and-sandals-2'}
    ];
    const tile=(game,index)=>game.internal==='cultureQuiz'
      ?'<button class="module-game-tile module-game-action" type="button" data-play-culture-quiz aria-label="Play Culture Quiz"><img src="'+esc(game.image)+'" alt="" width="320" height="180" loading="lazy" decoding="async"><span>'+esc(game.title)+'</span><small>play ↗</small></button>'
      :'<button class="module-game-tile module-game-action" type="button" data-play-external="'+index+'" aria-label="Play '+esc(game.title)+' in the arcade"><img src="'+esc(game.image)+'" alt="'+esc(game.title)+'" width="320" height="180" loading="lazy" decoding="async"><span>'+esc(game.title)+'</span><small>choose ▶</small></button>';
    const track=items=>items.concat(items).map(game=>tile(game,gameLibrary.indexOf(game))).join('');
    const seeAlso=game=>{const href=game.internal==='cultureQuiz'?'':esc(game.href||'');return '<div class="module-game-directory-row" data-directory-index="'+gameLibrary.indexOf(game)+'"><b><img src="'+esc(game.image)+'" alt="" width="68" height="40" loading="lazy" decoding="async">'+esc(game.title)+'</b><div class="module-game-directory-actions">'+(game.internal==='cultureQuiz'?'<button class="module-action ghost" type="button" data-directory-culture>Play in arcade</button>':'<button class="module-action ghost" type="button" data-directory-play>Play in screen</button><a class="module-action ghost" href="'+href+'" target="_blank" rel="noopener noreferrer">Open ↗</a>')+'</div></div>'};
    body.innerHTML=heading('games')+
      '<div class="module-grid module-games-grid">'+
        '<section class="module-card module-game-stage wide"><div class="biglwa-arcade-player" id="biglwaArcadePlayer" aria-live="polite"><span class="biglwa-arcade-portrait" aria-hidden="true">◉</span><span><strong>playing as guest</strong><small>your avatar joins the arcade · set it in Studio</small></span></div><div class="module-arcade-folder-depth"><span class="module-arcade-wordmark" aria-hidden="true">ARCADE</span><div class="module-game-stage-head"><div class="module-arcade-marquee" aria-label="BIG LWA Arcade"><img src="/assets/games-lwa-blocks-exact.webp" alt="BIG LWA" width="1200" height="675"></div><span id="arcadeEmulatorTitle">choose a game</span></div></div><div class="module-game-viewport" id="arcadeScreen" aria-label="Arcade game selection and player"><div class="module-game-track">'+track(gameLibrary.slice(0,5))+'</div><div class="module-game-track">'+track(gameLibrary.slice(4,10))+'</div><div class="module-game-track">'+track(gameLibrary.slice(9))+'</div></div><div class="module-arcade-controls" aria-hidden="true"><span class="module-arcade-joystick is-yellow"><i></i></span><span class="module-arcade-joystick is-red"><i></i></span><span class="module-arcade-joystick is-green"><i></i></span></div><div class="module-status">Games try loading directly from the original provider in this screen. If embedding is blocked, use Game links or Pop-out.</div></section>'+
        '<section class="module-card module-game-directory wide"><details id="arcadeDirectoryDetails"><summary class="arcade-directory-toggle"><span>all games</span><small>'+gameLibrary.length+' titles · expand or collapse</small><span class="arcade-directory-chevron" aria-hidden="true">⌄</span></summary><p>Choose a game to try playing in the cabinet, or open it directly at the original game provider.</p><div class="module-game-directory-list" id="arcadeDirectory">'+gameLibrary.map(seeAlso).join('')+'</div></details></section>'+
        '<section class="module-card module-culture-quiz wide" id="cultureQuizPanel" hidden><div class="culture-quiz-head"><div><h2>culture quiz</h2><p>Four quick questions about culture, history, and keeping its context.</p></div><button class="module-action ghost" type="button" data-close-culture-quiz>Close</button></div><div id="cultureQuizContent" aria-live="polite"></div></section>'+
        '<section class="module-card module-game-submit"><h2>want to add a game?</h2><p>Suggest a game with a link or game file and an image link or image file. Saved in this browser for review; uploads are not automatically hosted.</p><form class="module-game-form" id="gameSuggestForm">'+
          '<label><span>Game name</span><input class="module-input" name="title" required maxlength="80" placeholder="Game title"></label>'+
          '<div class="module-game-source-grid"><label><span>Game link (optional)</span><input class="module-input" name="gameLink" type="text" inputmode="url" placeholder="https://…"></label><label><span>Or upload game file</span><input class="module-input module-file-input" name="gameFile" type="file" accept=".html,.htm,.zip,.swf,text/html,application/zip,application/x-shockwave-flash"><small>HTML, ZIP, or SWF file</small></label></div>'+
          '<div class="module-game-source-grid"><label><span>Image link (optional)</span><input class="module-input" name="imageLink" type="text" inputmode="url" placeholder="https://…"></label><label><span>Or upload image file</span><input class="module-input module-file-input" name="imageFile" type="file" accept="image/*"><small>PNG, JPG, GIF, or WebP</small></label></div>'+
          '<div class="module-game-submit-row"><button class="module-action" type="submit">Save suggestion</button><img class="module-game-image-preview" id="gameSuggestImagePreview" alt="Game cover preview" hidden><div class="module-status" id="gameSuggestStatus" aria-live="polite"></div></div>'+
        '</form></section>'+
      '</div>';

    const showArcadeIdentity=async()=>{
      const badge=$('#biglwaArcadePlayer',body);
      if(!badge)return;
      try{
        const root='https://www.gstatic.com/firebasejs/12.18.0/';
        const [appModule,authModule,store]=await Promise.all([
          import(root+'firebase-app.js'),import(root+'firebase-auth.js'),import(root+'firebase-firestore.js')
        ]);
        const app=appModule.getApps()[0];if(!app)return;
        const auth=authModule.getAuth(app);await auth.authStateReady();
        const user=auth.currentUser;
        if(!user||!badge.isConnected)return;
        const record=(await store.getDoc(store.doc(store.getFirestore(app),'users',user.uid))).data()?.studioAvatar||null;
        if(auth.currentUser?.uid!==user.uid||!badge.isConnected)return;
        const trusted='https://biglwa-instagram-api.leianmulatre-284.workers.dev/media/profile-photo/';
        const raw=String(record?.url||'');
        const url=raw.startsWith(trusted)?raw:'';
        const label=record?.type==='mii'?String(record?.preset?.name||'your Mii').slice(0,32):record?.type==='minecraft'?'minecraft character':'your character';
        badge.querySelector('strong').textContent='playing as '+(record?.type?label:'yourself');
        badge.querySelector('small').textContent=url?'account character synced · ready to play':'set a character in Studio Avatar';
        const holder=badge.querySelector('.biglwa-arcade-portrait');
        if(url){
          const img=document.createElement('img');img.src=url;img.alt='';
          img.onerror=()=>img.replaceWith(document.createTextNode('◉'));
          holder.replaceChildren(img);
        }
      }catch(error){console.warn('[BIGLWA Arcade] Avatar preview unavailable:',error)}
    };
    showArcadeIdentity();
    const cultureQuestions=dykQuestions;
    const culturePanel=$('#cultureQuizPanel',body);
    const cultureContent=$('#cultureQuizContent',body);
    let cultureIndex=0,cultureScore=0,cultureAnswered=false;
    const drawCultureQuestion=()=>{
      cultureAnswered=false;
      if(cultureIndex>=cultureQuestions.length){
        cultureContent.innerHTML='<div class="culture-quiz-result"><span class="culture-quiz-progress">quiz complete</span><p class="culture-quiz-score">'+cultureScore+' / '+cultureQuestions.length+'</p><p>You finished the culture quiz.</p><button class="module-action" type="button" data-culture-replay>Play again</button></div>';
        return;
      }
      const item=cultureQuestions[cultureIndex];
      cultureContent.innerHTML='<span class="culture-quiz-progress">question '+(cultureIndex+1)+' of '+cultureQuestions.length+'</span><h3 class="culture-quiz-question">'+esc(item.q)+'</h3><div class="culture-quiz-options">'+item.a.map((answer,index)=>'<button type="button" data-culture-answer="'+index+'">'+esc(answer)+'</button>').join('')+'</div><div class="culture-quiz-feedback" id="cultureQuizFeedback">Choose an answer to reveal the context.</div>';
    };
    drawCultureQuestion();
    const emulatorScreen=$('#arcadeScreen',body);
    const emulatorTitle=$('#arcadeEmulatorTitle',body);
    const previewMarkup=emulatorScreen.innerHTML;
    const cultureOriginalParent=culturePanel.parentElement;
    const restoreArcade=()=>{
      if(document.fullscreenElement===emulatorScreen)document.exitFullscreen().catch(()=>{});
      if(culturePanel.parentElement===emulatorScreen){culturePanel.hidden=true;cultureOriginalParent.append(culturePanel)}
      emulatorScreen.classList.remove('is-playing','is-quiz','is-launcher','is-embed');
      emulatorScreen.innerHTML=previewMarkup;
      emulatorTitle.textContent='choose a game';
    };
    const openCultureQuiz=()=>{
      restoreArcade();
      cultureIndex=0;cultureScore=0;drawCultureQuestion();
      emulatorScreen.classList.add('is-playing','is-quiz');
      emulatorTitle.textContent='now playing · culture quiz';
      emulatorScreen.replaceChildren();
      culturePanel.hidden=false;
      emulatorScreen.append(culturePanel);
      culturePanel.querySelectorAll('[data-arcade-return]').forEach(button=>button.remove());
      culturePanel.insertAdjacentHTML('afterbegin','<button type="button" class="module-action ghost arcade-return" data-arcade-return>← back to games</button>');
      emulatorScreen.scrollIntoView({behavior:'smooth',block:'center'});
    };
    $$('[data-directory-culture]',body).forEach(button=>button.addEventListener('click',openCultureQuiz));
    // A remote game's site can forbid frames via CSP frame-ancestors or X-Frame-Options.
    // Neither a different iframe URL nor a client-side "proxy" removes that restriction.
    // Preview the link inside Big LWA first; use a user-initiated pop-out to actually play.
    const restrictsEmbed=uri=>/(^|\.)coolmathgames\.com$|(^|\.)nytimes\.com$|(^|\.)chess\.com$|(^|\.)steampowered\.com$/.test(uri.hostname.toLowerCase());
    const providerName=uri=>{
      const host=uri.hostname.replace(/^www\./,'');
      if(host.endsWith('coolmathgames.com'))return 'Coolmath Games';
      if(host.endsWith('nytimes.com'))return 'The New York Times Games';
      if(host.endsWith('chess.com'))return 'Chess.com';
      if(host.endsWith('steampowered.com'))return 'Steam';
      return host;
    };
    let selectedGame=null;
    const makeAction=(text,action,extraClass)=>{
      const button=document.createElement('button');
      button.type='button';
      button.className='module-action'+(extraClass?' '+extraClass:'');
      button.dataset[action]='';
      button.textContent=text;
      return button;
    };
    const createPlayerHead=game=>{
      const head=document.createElement('div');
      head.className='arcade-player-head';
      const name=document.createElement('strong');
      name.textContent=game.title;
      head.append(name,makeAction('← games','arcadeReturn','ghost'));
      return head;
    };
    const createOpenLink=(uri,text,extraClass)=>{
      const link=document.createElement('a');
      link.className='module-action'+(extraClass?' '+extraClass:'');
      link.href=uri.href;
      link.target='_blank';
      link.rel='noopener noreferrer';
      link.textContent=text;
      return link;
    };
    const showGameLinks=game=>{
      if(!game?.href)return;
      let uri;
      try{uri=new URL(game.href)}catch{return}
      if(uri.protocol!=='https:')return;
      restoreArcade();
      selectedGame=game;
      emulatorTitle.textContent='select a game · '+game.title;
      emulatorScreen.classList.add('is-playing','is-launcher');
      const main=document.createElement('div');
      main.className='arcade-game-launcher';
      const cover=document.createElement('img');
      cover.className='arcade-game-cover';
      cover.src=game.image;
      cover.alt='';
      cover.loading='eager';
      const details=document.createElement('div');
      details.className='arcade-game-details';
      const label=document.createElement('span');
      label.className='arcade-game-provider';
      label.textContent='Hosted by '+providerName(uri);
      const heading=document.createElement('h3');
      heading.textContent=game.title;
      const description=document.createElement('p');
      const steam=uri.hostname==='store.steampowered.com';
      const blocked=restrictsEmbed(uri);
      description.textContent=steam
        ? 'This is a PC game sold through Steam, not a browser game. Open its listing to play with an installed copy.'
        : blocked
          ? 'This provider usually restricts embedded windows. You can still try the original game URL here, or launch it in a pop-out.'
          : 'This game stays hosted by its original provider. Try it inside Big LWA, or open the original game page.';
      const actions=document.createElement('div');
      actions.className='arcade-game-launch-actions';
      if(!steam){
        actions.append(makeAction('Play in pop-out ↗','arcadePopup',''));
      }
      actions.append(createOpenLink(uri,steam?'View on Steam ↗':'Open game page ↗','ghost'));
      if(!steam) actions.append(makeAction('Try in this screen','arcadeTryEmbed','ghost'));
      actions.append(makeAction('Copy game link','arcadeCopy','ghost'));
      const note=document.createElement('small');
      note.className='arcade-game-notice';
      note.setAttribute('role','status');
      note.textContent=blocked?'Embedding may be denied by this provider; the original host link remains available.':'External games remain hosted by their original providers.';
      details.append(label,heading,description,actions,note);
      const feature=document.createElement('div');
      feature.className='arcade-game-feature';
      feature.append(cover,details);
      const directory=document.createElement('div');
      directory.className='arcade-game-links';
      const directoryTitle=document.createElement('span');
      directoryTitle.textContent='Choose another game';
      directory.append(directoryTitle);
      const quick=document.createElement('div');
      quick.className='arcade-game-quicklinks';
      gameLibrary.forEach((entry,index)=>{
        const button=document.createElement('button');
        button.type='button';
        button.className='arcade-quickgame'+(entry===game?' is-current':'');
        button.dataset.arcadeSelectGame=String(index);
        button.setAttribute('aria-label','Select '+entry.title);
        const img=document.createElement('img');
        img.src=entry.image;
        img.alt='';
        img.loading='lazy';
        const title=document.createElement('span');
        title.textContent=entry.title;
        button.append(img,title);
        quick.append(button);
      });
      directory.append(quick);
      main.append(feature,directory);
      emulatorScreen.replaceChildren(createPlayerHead(game),main);
      emulatorScreen.scrollIntoView({behavior:'smooth',block:'center'});
    };
    const tryEmbedded=()=>{
      if(!selectedGame?.href)return;
      const uri=new URL(selectedGame.href);
      if(uri.protocol!=='https:' || uri.hostname==='store.steampowered.com')return showGameLinks(selectedGame);
      const game=selectedGame;
      emulatorScreen.classList.remove('is-launcher');
      emulatorScreen.classList.add('is-embed');
      emulatorTitle.textContent='trying in-screen player · '+game.title;
      const head=createPlayerHead(game);
      const frame=document.createElement('iframe');
      // Keep BIG LWA's own puzzles in compact in-cabinet mode, rather than
      // cropping their full standalone page inside a short external frame.
      const framed=new URL(uri.href);
      if(framed.origin===location.origin&&framed.pathname==='/arcade-puzzles.html')framed.searchParams.set('embed','1');
      frame.src=framed.href;
      frame.tabIndex=0;
      frame.title='In-screen player for '+game.title;
      frame.setAttribute('allow','autoplay; fullscreen; gamepad');
      frame.setAttribute('allowfullscreen','');
      frame.setAttribute('referrerpolicy','strict-origin-when-cross-origin');
      const deck=document.createElement('div');
      deck.className='arcade-player-deck';
      const help=document.createElement('span');
      help.textContent=restrictsEmbed(uri)?'Provider may refuse the embed. Use Game links or Pop-out if it does.':'If the player does not load, use Game links or Pop-out.';
      deck.append(help,makeAction('Game links','arcadePreview','ghost'),makeAction('Pop-out ↗','arcadePopup','ghost'),makeAction('Fullscreen','arcadeFullscreen','ghost'),createOpenLink(uri,'Open ↗','ghost'));
      emulatorScreen.replaceChildren(head,frame,deck);
      if(framed.origin===location.origin){
        frame.addEventListener('load',()=>{
          // Arrow keys should control the selected game, not scroll the page.
          try{frame.focus({preventScroll:true})}catch{}
        },{once:true});
      }
    };
    // First attempt the original host directly; never proxy, copy, or rewrite
    // third-party frame security headers or claim to host their game.
    const playGame=game=>{
      if(!game?.href)return;
      showGameLinks(game);
      try{
        // Hosts that deny iframes must not be forced into an unusable game window.
        // Keep an explicit Try in this screen option for members who want it.
        const target=new URL(game.href);
        if(target.hostname!=='store.steampowered.com'&&!restrictsEmbed(target))tryEmbedded();
      }catch{}
    };
    const popOutGame=()=>{
      if(!selectedGame?.href)return;
      // This is called directly from a click to avoid the browser's pop-up blocker.
      const popup=window.open(selectedGame.href,'biglwaArcadePopout','popup=yes,width=1120,height=780');
      if(popup){
        try{popup.opener=null;popup.focus()}catch{}
      }else{
        const note=emulatorScreen.querySelector('.arcade-game-notice');
        if(note)note.textContent='Pop-out blocked by your browser. Use Open game page ↗ instead.';
      }
    };
    emulatorScreen.addEventListener('click',async event=>{
      const target=event.target.closest('button');
      if(!target)return;
      if(target.matches('[data-arcade-return]')){selectedGame=null;restoreArcade();return}
      if(target.matches('[data-arcade-preview]')){if(selectedGame)showGameLinks(selectedGame);return}
      if(target.matches('[data-arcade-popup]')){popOutGame();return}
      if(target.matches('[data-arcade-try-embed]')){tryEmbedded();return}
      if(target.matches('[data-arcade-copy]')){
        try{
          await navigator.clipboard.writeText(selectedGame?.href||'');
          const notice=emulatorScreen.querySelector('.arcade-game-notice');
          if(notice)notice.textContent='Game link copied.';
        }catch{
          const notice=emulatorScreen.querySelector('.arcade-game-notice');
          if(notice)notice.textContent='Copy unavailable. Use Open game page ↗ to retrieve the link.';
        }
        return;
      }
      if(target.matches('[data-arcade-select-game]')){
        const game=gameLibrary[Number(target.dataset.arcadeSelectGame)];
        if(game?.internal==='cultureQuiz'){selectedGame=null;openCultureQuiz()}
        else playGame(game);
        return;
      }
      if(target.matches('[data-arcade-fullscreen]')){
        if(document.fullscreenElement===emulatorScreen)document.exitFullscreen().catch(()=>{});
        else emulatorScreen.requestFullscreen().catch(()=>{});
        return;
      }
      if(target.matches('[data-play-culture-quiz]')){selectedGame=null;openCultureQuiz();return}
      if(target.matches('[data-play-external]')){playGame(gameLibrary[Number(target.dataset.playExternal)]);return}
    });
    $('[data-directory-play]',body).forEach(button=>button.addEventListener('click',()=>playGame(gameLibrary[Number(button.closest('[data-directory-index]').dataset.directoryIndex)])));
    $('[data-close-culture-quiz]',culturePanel).onclick=restoreArcade;
    cultureContent.onclick=event=>{
      const answerButton=event.target.closest('[data-culture-answer]');
      if(answerButton&&!cultureAnswered){
        cultureAnswered=true;
        const item=cultureQuestions[cultureIndex];
        const picked=Number(answerButton.dataset.cultureAnswer);
        const buttons=$$('[data-culture-answer]',cultureContent);
        buttons.forEach((button,index)=>{
          button.disabled=true;
          if(index===item.correct)button.classList.add('correct');
          else if(index===picked)button.classList.add('wrong');
        });
        if(picked===item.correct)cultureScore++;
        const feedback=$('#cultureQuizFeedback',cultureContent);
        feedback.innerHTML=(picked===item.correct?'<strong>Correct.</strong> ':'<strong>Not quite.</strong> ')+esc(item.context)+'<span class="culture-quiz-source">Source: <a href="'+esc(item.url)+'" target="_blank" rel="noopener noreferrer">'+esc(item.source)+' ↗</a></span><button class="module-action" type="button" data-culture-next>'+(cultureIndex+1<cultureQuestions.length?'Next question →':'See score →')+'</button>';
      }
      if(event.target.closest('[data-culture-next]')){cultureIndex++;drawCultureQuestion()}
      if(event.target.closest('[data-culture-replay]')){cultureIndex=0;cultureScore=0;drawCultureQuestion()}
    };

    // Veve directs its game cards to this SAME in-cabinet player, never a separate iframe.
    if(window.__biglwaArcadeRequestListener)window.removeEventListener('biglwa:arcade-request-game',window.__biglwaArcadeRequestListener);
    const handleArcadeRequest=event=>{
      const kind=String(event?.detail?.kind||'').toLowerCase();
      if(!body.contains(emulatorScreen))return;
      if(window.__biglwaArcadeRequestedGame===kind)delete window.__biglwaArcadeRequestedGame;
      if(kind==='culture'){selectedGame=null;openCultureQuiz();return}
      const selected=gameLibrary.find(game=>game.href&&new URL(game.href).searchParams.get('game')===kind);
      if(selected)playGame(selected);
    };
    window.__biglwaArcadeRequestListener=handleArcadeRequest;
    window.addEventListener('biglwa:arcade-request-game',handleArcadeRequest);
    if(window.__biglwaArcadeRequestedGame){
      const pending=window.__biglwaArcadeRequestedGame;
      delete window.__biglwaArcadeRequestedGame;
      handleArcadeRequest({detail:{kind:pending}});
    }
    const form=$('#gameSuggestForm',body);
    const gameLinkInput=$('[name="gameLink"]',form);
    const imageLinkInput=$('[name="imageLink"]',form);
    const gameFileInput=$('[name="gameFile"]',form);
    const imageFileInput=$('[name="imageFile"]',form);
    const imagePreview=$('#gameSuggestImagePreview',body);
    const status=$('#gameSuggestStatus',body);
    let previewObjectUrl='';
    const clearPreviewObjectUrl=()=>{if(previewObjectUrl){URL.revokeObjectURL(previewObjectUrl);previewObjectUrl=''}};
    const updateImagePreview=()=>{
      clearPreviewObjectUrl();
      const file=imageFileInput.files&&imageFileInput.files[0];
      const value=imageLinkInput.value.trim();
      if(file){previewObjectUrl=URL.createObjectURL(file);imagePreview.src=previewObjectUrl;imagePreview.hidden=false}
      else if(/^https?:\/\//i.test(value)){imagePreview.src=value;imagePreview.hidden=false}
      else{imagePreview.hidden=true;imagePreview.removeAttribute('src')}
    };
    imageFileInput.onchange=updateImagePreview;
    imageLinkInput.oninput=updateImagePreview;
    imagePreview.onerror=()=>{imagePreview.hidden=true;imagePreview.removeAttribute('src');status.textContent='Cover preview unavailable. The image link or upload can still be saved.'};
    const isWebUrl=value=>{try{return ['http:','https:'].includes(new URL(value).protocol)}catch(_){return false}};
    const openSuggestionsDatabase=()=>new Promise((resolve,reject)=>{
      if(!('indexedDB' in window)){reject(new Error('Browser storage is unavailable'));return}
      const request=indexedDB.open('biglwaGameSuggestionsDB',1);
      request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains('suggestions'))db.createObjectStore('suggestions',{keyPath:'id',autoIncrement:true})};
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(request.error||new Error('Could not open browser storage'));
      request.onblocked=()=>reject(new Error('Browser storage is busy; try again in a moment'));
    });
    form.onsubmit=async event=>{
      event.preventDefault();
      const data=new FormData(form);
      const title=String(data.get('title')||'').trim();
      const gameLink=String(data.get('gameLink')||'').trim();
      const imageLink=String(data.get('imageLink')||'').trim();
      const gameFile=gameFileInput.files&&gameFileInput.files[0]||null;
      const imageFile=imageFileInput.files&&imageFileInput.files[0]||null;
      const allowedGameFile=gameFile&&/\.(html?|zip|swf)$/i.test(gameFile.name);
      if(gameLink&&!isWebUrl(gameLink)){status.textContent='Use a complete http or https game link.';return}
      if(!gameLink&&!gameFile){status.textContent='Add a game link or choose a game file.';return}
      if(gameFile&&!allowedGameFile){status.textContent='Choose an HTML, ZIP, or SWF game file.';return}
      if(imageLink&&!isWebUrl(imageLink)){status.textContent='Use a complete http or https image link.';return}
      if(!imageLink&&!imageFile){status.textContent='Add an image link or choose an image file.';return}
      if(imageFile&&!imageFile.type.startsWith('image/')){status.textContent='Choose a supported image file.';return}
      status.className='module-status';status.textContent='Saving in this browser…';
      const submitButton=$('button[type="submit"]',form);submitButton.disabled=true;
      let db;
      try{
        db=await openSuggestionsDatabase();
        await new Promise((resolve,reject)=>{
          const transaction=db.transaction('suggestions','readwrite');
          transaction.objectStore('suggestions').add({title,gameLink,imageLink,gameFile,imageFile,createdAt:new Date().toISOString()});
          transaction.oncomplete=resolve;
          transaction.onerror=()=>reject(transaction.error||new Error('Could not save suggestion'));
          transaction.onabort=()=>reject(transaction.error||new Error('Could not save suggestion'));
        });
        status.className='module-status ok';
        status.textContent='Saved on this browser for review.';
        form.reset();updateImagePreview();
      }catch(error){
        status.className='module-status';
        status.textContent=error&&error.name==='QuotaExceededError'?'Browser storage is full. Remove some saved site data and try again.':'Could not save here. Check browser storage settings and try again.';
      }finally{
        if(db)db.close();
        submitButton.disabled=false;
      }
    };
  }

  const dykQuestions=[
    {q:'Which borough is widely recognized as the birthplace of hip-hop culture in the 1970s?',a:['The Bronx','Queens','Brooklyn','Manhattan'],correct:0,context:'Hip-hop developed through block parties, DJs, MCs, breaking, and graffiti culture in the Bronx during the 1970s.',source:'Smithsonian — Hip-Hop History',url:'https://nmaahc.si.edu/explore/stories/hip-hop-history'},
    {q:'The Haitian Revolution began in which year?',a:['1776','1789','1791','1804'],correct:2,context:'The uprising that began in 1791 became the Haitian Revolution; Haiti declared independence in 1804.',source:'Encyclopaedia Britannica — Haitian Revolution',url:'https://www.britannica.com/topic/Haitian-Revolution'},
    {q:'In ballroom culture, what is a “house” best understood as?',a:['Only a venue','A chosen-family and competitive collective','A record label','A dance step'],correct:1,context:'Houses have functioned as chosen families, support systems, and competitive units within ballroom communities.',source:'National Museum of African American History and Culture — Ballroom',url:'https://nmaahc.si.edu/'},
    {q:'Which practice best helps an archive preserve meaning rather than just objects?',a:['Removing dates','Keeping provenance and context','Sorting only by popularity','Deleting conflicting accounts'],correct:1,context:'Provenance, source information, dates, and surrounding context help future readers understand what an object meant and where it came from.',source:'Society of American Archivists — archival principles',url:'https://www2.archivists.org/'}
  ];
  function renderLearn(){
    let index=Number(localStorage.getItem('biglwaDYKIndex')||0)%dykQuestions.length;let score=Number(localStorage.getItem('biglwaDYKScore')||0);let answered=false;
    const draw=()=>{const item=dykQuestions[index];body.innerHTML=heading('learn')+`<div class="dyk-game"><section class="dyk-card"><div><span class="dyk-kicker">Card ${index+1} of ${dykQuestions.length}</span><div class="dyk-question">${esc(item.q)}</div><div class="dyk-options">${item.a.map((x,i)=>`<button class="dyk-option" type="button" data-dyk-answer="${i}">${esc(x)}</button>`).join('')}</div><div class="dyk-source" id="dykContext">Choose an answer to reveal the context and source.</div></div><div class="module-actions"><button class="module-action" id="dykNext" type="button" disabled>Next card →</button><button class="module-action ghost" id="dykReset" type="button">Reset score</button></div></section><aside class="module-card dyk-side"><h2>Score</h2><div class="dyk-score">${score}</div><small>Correct answers in this run. This is meant to teach, not punish a wrong guess.</small></aside></div>`;
      $$('.dyk-option',body).forEach(btn=>btn.onclick=()=>{if(answered)return;answered=true;const choice=Number(btn.dataset.dykAnswer),ok=choice===item.correct;$$('.dyk-option',body).forEach((b,i)=>{b.disabled=true;if(i===item.correct)b.classList.add('correct')});if(!ok)btn.classList.add('wrong');if(ok){score++;localStorage.setItem('biglwaDYKScore',score)}$('#dykContext',body).innerHTML=`${esc(item.context)} <a href="${item.url}" target="_blank" rel="noopener">${esc(item.source)} ↗</a>`;$('#dykNext',body).disabled=false;$('.dyk-score',body).textContent=score});
      $('#dykNext',body).onclick=()=>{index=(index+1)%dykQuestions.length;localStorage.setItem('biglwaDYKIndex',index);answered=false;draw()}; $('#dykReset',body).onclick=()=>{score=0;localStorage.setItem('biglwaDYKScore','0');answered=false;draw()};
    };draw();
  }

  function archiveStateFor(item){
    const raw=String(item?.archiveState||"").toLowerCase();
    if(raw==="pending_delete" || String(item?.state||"").toLowerCase()==="pending_delete") return "pending_delete";
    if(raw==="archived" || String(item?.state||"").toLowerCase()==="archived") return "archived";
    if(raw==="collective" || String(item?.state||"").toLowerCase()==="saved" || String(item?.state||"").toLowerCase()==="approved") return "collective";
    return raw || "saved";
  }
  function deletionCountdownText(value){
    const ms=typeof value?.toMillis==="function" ? value.toMillis() : (value instanceof Date ? value.getTime() : Date.parse(value||""));
    if(!Number.isFinite(ms)) return "30 days until deletion";
    const days=Math.max(0,Math.ceil((ms-Date.now())/86400000));
    return days+" day"+(days===1?"":"s")+" until deletion";
  }
  function archiveSourceTheme(source){
    return ({
      instagram:{rim:"#a52a0c",glow:"#962fbf",hot:"#fa7e1e"},
      tiktok:{rim:"#111111",glow:"#25f4ee",hot:"#fe2c55"},
      facebook:{rim:"#1877f2",glow:"#5aa0ff"},
      pinterest:{rim:"#e60023",glow:"#ff5269",hot:"#ae0026"},
      youtube:{rim:"#d0202f",glow:"#fff6ec",hot:"#ff0033"},
      soundcloud:{rim:"#ff5500",glow:"#ffb13b",hot:"#c93f00"}
    })[String(source||"").toLowerCase()]||{rim:"#a52a0c",glow:"#d95f6d"};
  }
  function archiveSourceRim(source){return archiveSourceTheme(source).rim}
  function archiveSourceShadow(source){
    const key=String(source||"").toLowerCase(),t=archiveSourceTheme(key);
    if(key==="youtube") return "0 0 0 2px "+t.rim+",3px 3px 0 "+t.glow+",0 13px 28px -16px "+t.rim;
    if(key==="instagram") return "3px 3px 0 "+t.rim+",-2px 9px 22px -15px "+t.glow+",8px 14px 26px -18px "+t.hot;
    if(key==="tiktok") return "3px 3px 0 "+t.rim+",-2px 8px 20px -14px "+t.glow+",8px 13px 24px -16px "+t.hot;
    if(t.hot) return "3px 3px 0 "+t.rim+",0 12px 25px -16px "+t.glow+",0 0 18px -12px "+t.hot;
    return "3px 3px 0 "+t.rim+",0 12px 25px -16px "+t.glow;
  }
  function archiveMediaPieces(item){
    const validImage=url=>{
      if(typeof url!=='string'||!url.trim())return false;
      try{
        const parsed=new URL(url,location.origin);
        if(!['http:','https:'].includes(parsed.protocol))return false;
        if(/(^|\.)pinterest\.com$/.test(parsed.hostname)&&/^\/(pin|ideas|search)\b/.test(parsed.pathname))return false;
        return true;
      }catch{return false}
    };
    const fromPieces=Array.isArray(item.mediaItems)?item.mediaItems
      .filter(piece=>piece&&(validImage(piece.url)||validImage(piece.thumbnailUrl)))
      .map(piece=>({...piece,url:validImage(piece.url)?piece.url:piece.thumbnailUrl,
        thumbnailUrl:validImage(piece.thumbnailUrl)?piece.thumbnailUrl:''})):[];
    if(fromPieces.length)return fromPieces;
    const fromUrls=Array.isArray(item.imageUrls)?item.imageUrls.filter(validImage):[];
    if(fromUrls.length)return fromUrls.map((url,i)=>({
      index:i,url,thumbnailUrl:url,mediaType:item.mediaType||"IMAGE"
    }));
    if(validImage(item.imageUrl))return [{index:0,url:item.imageUrl,thumbnailUrl:item.imageUrl,mediaType:item.mediaType||"IMAGE"}];
    const img=item?.media?.images||item?.images||{};
    const candidates=[img['600x'],img.originals,img['237x'],item?.image_url,item?.thumbnail_url];
    for(const entry of candidates){
      const src=typeof entry==='string'?entry:entry?.url;
      if(validImage(src))return [{index:0,url:src,thumbnailUrl:src,mediaType:'IMAGE'}];
    }
    return [];
  }
  function archivePieceMarkup(piece,index,total,cardIndex){
    const link=piece.url;
    const isVideo=String(piece.mediaType||'').toUpperCase()==='VIDEO'||/\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(link);
    const visual=isVideo
      ? '<video src="'+esc(link)+'" poster="'+esc(piece.thumbnailUrl||'')+'" muted playsinline preload="none" controls></video>'
      : '<img src="'+esc(link)+'"'+(piece.thumbnailUrl&&piece.thumbnailUrl!==link?' data-archive-fallback="'+esc(piece.thumbnailUrl)+'"':'')+' alt="Archive item '+cardIndex+(total>1?' '+(index+1):'')+'" loading="lazy" decoding="async">';
    return '<div class="instagram-archive-piece">'+visual+'</div>';
  }

  function archiveOpenImage(url){
    if(!url)return;
    try{window.open(url,"_blank","noopener,noreferrer");}catch{}
  }

  const PIECES_PER_CARD=4;
  /* Two cards can be the same picture reached twice: the same photo saved to the wall and
   also held in the Archive, or one carousel that arrived on two days. Sorting them together
   and saying how many are involved makes the repeats visible straight away, instead of a
   reader spotting them by eye across a wall of near-identical cards. */
  function archiveFingerprint(item){
    const pieces=Array.isArray(item.mediaItems)&&item.mediaItems.length
      ? item.mediaItems.map(piece=>String(piece?.url||''))
      : (Array.isArray(item.imageUrls)?item.imageUrls:[]);
    const first=(pieces.find(Boolean)||String(item.imageUrl||'')).split('?')[0];
    const caption=String(item.caption||'').trim().toLowerCase().slice(0,80);
    return (caption?'c:'+caption:'|')+'|'+(first?first.split('/').pop():String(item.sourcePostId||item.id));
  }
  function archiveGroups(items){
    const order=[];
    const groups=new Map();
    /* Sorted by source so the wall reads as source blocks rather than a mixed shelf. */
    [...items.keys()].sort((a,b)=>{
      const sa=String(items[a].source||'').toLowerCase(), sb=String(items[b].source||'').toLowerCase();
      if(sa!==sb)return sa<sb?-1:1;
      return (items[b].sourceCreatedAtMs||0)-(items[a].sourceCreatedAtMs||0);
    }).forEach(index=>{
      const key=archiveFingerprint(items[index]);
      if(!groups.has(key)){groups.set(key,[]);order.push(key)}
      groups.get(key).push(index);
    });
    return {order,groups,sorted:order.flatMap(key=>groups.get(key))};
  }
    function groupCards(cardList,items,grouped,hideDupes){
    const names={instagram:'Instagram',tiktok:'TikTok',facebook:'Facebook',pinterest:'Pinterest',google:'Google',soundcloud:'SoundCloud',youtube:'YouTube',biglwa:'Big LWA',studio:'Studio'};
    // Fingerprints identify duplicates, not layout rows. All posts from a
    // source belong in ONE full-width grid; otherwise unique photos create
    // an endless series of single-card horizontal rows.
    const sourceGroups=new Map();
    grouped.order.forEach(fingerprint=>{
      const indexes=grouped.groups.get(fingerprint)||[];
      const visible=hideDupes?indexes.slice(0,1):indexes;
      for(const index of visible){
        const source=String(items[index]?.source||'instagram').toLowerCase();
        if(!sourceGroups.has(source))sourceGroups.set(source,[]);
        sourceGroups.get(source).push(index);
      }
    });
    const repeatCount=source=>{
      let count=0;
      grouped.order.forEach(key=>{
        const indices=grouped.groups.get(key)||[];
        if(indices.length>1&&String(items[indices[0]]?.source||'instagram').toLowerCase()===source)
          count+=indices.length-1;
      });
      return count;
    };
    return [...sourceGroups].map(([source,indexes])=>
      '<section class="archive-source-group" data-archive-source="'+esc(source)+'">'+
      '<h3 class="archive-group-head">'+esc(names[source]||source)+
      '<em class="archive-group-count">'+indexes.length+' stored'+(hideDupes?' (unique)':'')+'</em>'+
      (repeatCount(source)?'<em class="archive-group-repeats">'+repeatCount(source)+' additional copies of one picture or matching photos</em>':'')+'</h3>'+
      '<div class="instagram-archive-grid" data-archive-group="'+esc(source)+'">'+
      indexes.map(index=>cardList[index]).join('')+'</div></section>'
    ).join('');
  }

  function renderArchive(){
    const orbit=window.__biglwaInstagramOrbit;
    const postsApi=window.__biglwaOrbitPosts;
    const previewMode=document.documentElement.classList.contains('biglwa-preview-mode');
    const previewUsername=(()=>{try{return decodeURIComponent(location.pathname.replace(/^\/+|\/+$/g,''))}catch{return ''}})();
    let archiveMedia=[];
    let archiveCursor=null;
    let archiveHasMore=false;
    let archiveInitialized=false;
    let archiveLoading=false;
    const FILTER_KEY='biglwaArchiveFilters';
    const sourceNameOf=item=>String(item.source||'instagram').toLowerCase();
    const readFilters=()=>{let f={sources:[],hideDupes:false};try{f={sources:[],hideDupes:false,...JSON.parse(localStorage.getItem(FILTER_KEY)||'null')}}catch{}if(!Array.isArray(f.sources))f.sources=[];return f};
    const saveFilters=f=>{try{localStorage.setItem(FILTER_KEY,JSON.stringify(f))}catch{}};

    const loadInitial=async()=>{
      const rows=previewMode
        ? await window.BigLWAUserDirectory?.loadArchiveForUsername?.(previewUsername)||[]
        : await postsApi?.loadArchive?.();
      archiveMedia=Array.isArray(rows)?rows:[];
      archiveCursor=rows?.nextCursor||null;
      archiveHasMore=Boolean(rows?.hasMore);
      archiveInitialized=true;
    };

    const loadMore=async()=>{
      if(previewMode||archiveLoading||!archiveHasMore||!archiveCursor)return;
      archiveLoading=true;
      const button=$('#archiveLoadMore',body),status=$('#archiveInstagramStatus',body);
      if(button)button.disabled=true;
      if(status)status.textContent='Loading older Archive photos…';
      try{
        const rows=await postsApi?.loadArchive?.(undefined,48,archiveCursor);
        const next=Array.isArray(rows)?rows:[];
        archiveMedia=archiveMedia.concat(next);
        archiveCursor=rows?.nextCursor||null;
        archiveHasMore=Boolean(rows?.hasMore);
        await draw();
      }catch(error){
        if(status)status.textContent=error?.message||'Older Archive photos could not be loaded.';
      }finally{
        archiveLoading=false;
      }
    };

    const draw=async()=>{
      const owner=!previewMode;
      // Do not capture archiveMedia before loadInitial() resolves. The first
      // render previously kept the pre-fetch [] and falsely showed an empty wall.
      let settings={visibility:'private',friends:[]},profile=orbit?.state?.profile||{},status='';
      try{
            if(owner){
          settings=await postsApi?.getArchiveSettings?.()||settings;
          if(!archiveInitialized) await loadInitial();
          profile=orbit?.state?.profile||profile;
        }else{
          const publicProfile=await window.BigLWAUserDirectory?.loadPublicProfile?.(previewUsername);
          settings={visibility:publicProfile?.archiveVisibility||'private',friends:[]};
          profile=publicProfile||profile;
          if(settings.visibility!=='friends'){
            body.innerHTML=heading('archive')+'<div class="module-grid"><section class="module-card wide"><h2>Archive</h2><p>This Archive is private. The owner has not made it viewable to friends.</p></section></div>';
            return;
          }
          if(!archiveInitialized) await loadInitial();
          if(!archiveMedia.length)status='This friend has not shared any archived content yet.';
        }
      }catch(error){
        console.error('BIGLWA Archive:',error);
        status=error?.message||'The Archive could not be loaded.';
      }

    const media=archiveMedia;
    const username=profile.username||profile.name||previewUsername||'BIGLWA member';
      const filters=readFilters();
      const seenSources=[...new Set(media.map(sourceNameOf))];
      const union=[...new Set([...seenSources,...filters.sources])];
      const allowed=new Set(filters.sources);
      const filtering=filters.sources.length>0;
      const mediaShown=filtering?media.filter(item=>allowed.has(sourceNameOf(item))):media;
      const hideDupes=filters.hideDupes;
      const cardList=mediaShown.map((item,index)=>{
        const pieces=archiveMediaPieces(item);
        const first=pieces[0]?.url||'';
        const caption=String(item.caption||'').trim();
        const date=item.sourceCreatedAt?new Date(item.sourceCreatedAt).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'}):'Archive';
        const state=archiveStateFor(item);
        const posted=state==='collective';
        const pending=state==='pending_delete';
        const archived=state==='archived';
        /* Every source is kept in the Archive, and each card keeps its own rim so a TikTok
           card or a Facebook card can be told from an Instagram one at a glance. A card that
           is live keeps its colour and appears on the Collective Feed; one switched off greys
           its picture and stays here only. */
        const source=String(item.source||'instagram').toLowerCase();
        const themes={
          instagram:{rim:'#f36b21',shadow:'3px 3px 0 #f36b21,7px 7px 0 -2px #ffad52,0 14px 28px -13px #bd430b'},
          pinterest:{rim:'#e60023',shadow:'3px 3px 0 #e60023,6px 6px 0 -2px #ff5269,0 14px 26px -14px #ae0026'},
          tiktok:{rim:'#772dcc',shadow:'3px 3px 0 #772dcc,7px 7px 0 -2px #b77cff,0 14px 28px -13px #4a187f'},
          facebook:{rim:'#1877f2',shadow:'3px 3px 0 #1877f2,0 12px 25px -16px #5aa0ff'},
          youtube:{rim:'#d0202f',shadow:'0 0 0 2px #d0202f,3px 3px 0 #fff6ec,0 13px 28px -16px #d0202f'},
          soundcloud:{rim:'#ff5500',shadow:'3px 3px 0 #ff5500,0 12px 25px -16px #ffb13b'},
          google:{rim:'#4285f4',shadow:'3px 3px 0 #4285f4,0 12px 25px -16px #34a853'}
        };
        const visualTheme=themes[source]||{rim:'#a52a0c',shadow:'3px 3px 0 #a52a0c'};
        const rim=visualTheme.rim;
        // Like Collective Feed, show ONE media frame per post—not a long tower.
        // Carousel buttons cycle through every item without growing the card.
        const visualPieces=pieces.length?archivePieceMarkup(pieces[0],0,pieces.length,index+1):'';
        const carouselControls=pieces.length>1
          ? '<div class="archive-carousel-actions"><button type="button" data-archive-step="-1" aria-label="Previous photo">‹</button><button type="button" data-archive-step="1" aria-label="Next photo">›</button></div>'+
            '<div class="archive-carousel-dots" role="group" aria-label="Carousel positions">'+
             pieces.slice(0,12).map((_,n)=>'<button type="button" data-archive-index="'+n+'" class="archive-carousel-dot'+(n===0?' is-active':'')+'" aria-current="'+(n===0?'true':'false')+'" aria-label="Show photo '+(n+1)+' of '+pieces.length+'"></button>').join('')+
            '</div>'
          : '';
        const liveSwitch=pending
          ? '<div class="archive-live is-locked"><span class="archive-live-track" aria-hidden="true"><i></i></span><b>Deleting soon</b></div>'
          : owner
            ? '<label class="archive-live" data-archive-live="'+esc(item.id)+'">'
              +'<input type="checkbox" data-archive-live-input="'+esc(item.id)+'"'+(posted?' checked':'')+'>'
              +'<span class="archive-live-track" aria-hidden="true"><i></i></span>'
              +'<b>'+(posted?'Live':'Not live')+'</b>'
              +'<em>'+(posted?'Showing on the Collective Feed':'Only kept here')+'</em>'
              +'</label>'
            : '<div class="archive-live is-locked"><span class="archive-live-track" aria-hidden="true"><i></i></span><b>'+(posted?'Live':'Not live')+'</b></div>';
        const statusLine=posted
          ? '<small class="archive-state-line">Live · on the Collective Feed</small>'
          : archived
            ? '<small class="archive-state-line">Not live · kept here only</small>'
            : '';
        const actions=owner
          ? '<div class="archive-browser-actions biglwa-feed-lights" aria-label="Archive window controls">'+
             '<button type="button" data-archive-delete data-archive-light="delete" aria-label="Remove this post" title="Remove post (30-day recovery)"></button>'+
             '<button type="button" data-archive-light="archive" aria-label="'+(posted?'Take off Collective Feed':'Publish to Collective Feed')+'" title="'+(posted?'Archive post':'Publish post')+'"></button>'+
             '<button type="button" data-archive-enlarge data-archive-light="enlarge" aria-label="Enlarge image" title="Enlarge image"></button>'+
            '</div>'
          : '';
        const pendingMeta=pending
          ? '<div class="archive-pending-note">⚠ '+esc(deletionCountdownText(item.deletionAt))+'</div>'
          : '';
        // The card is ONE clipped photograph, with tiny controls and metadata
        // inside its bounds. There is no separate blank title bar or white footer.
        return '<article class="instagram-archive-card '+(posted?'is-live':'is-off')+' is-'+esc(state.replace(/_/g,'-'))+' archive-src-'+esc(source)+'" style="--feed-card-rim:'+rim+';--feed-card-shadow:'+visualTheme.shadow+'" data-archive-id="'+esc(item.id)+'" data-post-id="'+esc(item.id)+'" data-archive-url="'+esc(first)+'">'+
          '<div class="instagram-archive-media">'+
            (visualPieces||'<div class="biglwa-pin-empty"><small>Image unavailable · original link may have expired</small></div>')+
            carouselControls+actions+
            '<div class="archive-card-overlay">'+
              '<div class="archive-media-meta"><span>'+esc(date)+'</span><small>'+esc(caption||'@'+username)+'</small>'+statusLine+'</div>'+
              liveSwitch+
            '</div>'+
            pendingMeta+
          '</div>'+
        '</article>';
      });
    const grouped=archiveGroups(mediaShown);
      const cards=groupCards(cardList,mediaShown,grouped,hideDupes);

      const count=mediaShown.length;
      const visibility=owner
        ? '<section class="module-card wide archive-visibility-card"><h2>Archive visibility</h2><p>Your Archive is private to you by default. Friends can only see it when you turn this on and add their BIGLWA username.</p>'+
          '<div class="archive-visibility-row"><label><span>Who can view this Archive?</span><select class="module-select" id="archiveVisibility"><option value="private" '+(settings.visibility==='private'?'selected':'')+'>Only me</option><option value="friends" '+(settings.visibility==='friends'?'selected':'')+'>Friends</option></select></label></div>'+
          '<div class="archive-friend-add"><input class="module-input" id="archiveFriendUsername" placeholder="@username"><button class="module-action" id="archiveAddFriend" type="button">Add friend</button><button class="module-action ghost" id="archiveRemoveFriend" type="button">Remove</button></div>'+
          '<div class="module-status" id="archiveFriendStatus">'+(settings.visibility==='friends'?(settings.friends?.length||0)+' friend access slot(s) enabled.':'Archive is private.')+'</div></section>'
        : '';

      body.innerHTML=heading('archive',count?count+' card'+(count===1?'':'s')+' stored':'')+
        '<div class="module-grid">'+
        '<section class="module-card wide archive-wall-shell">'+
          '<div class="archive-toolbar"><div class="archive-toolbar-copy"><h2>Archive</h2><p>Each source has its own colored card rim, and carousels stay inside one card. Turn Live off to hide a post from Collective Feed while keeping it here.</p></div>'+
    (owner?'<div class="archive-toolbar-actions"><button class="module-action ghost" id="archiveConnections" type="button">Manage connections</button><button class="module-action" id="archiveRefreshInstagram" type="button">Import / refresh</button></div>'+
          (union.length?'<div class="archive-filter-bar" id="archiveFilterBar">'+
            union.map(k=>'<button type="button" class="archive-filter-chip '+((filtering?allowed.has(k):true)?'is-on':'')+'" data-archive-source-filter="'+esc(k)+'">'+esc({instagram:'Instagram',tiktok:'TikTok',facebook:'Facebook',pinterest:'Pinterest',google:'Google',soundcloud:'SoundCloud',youtube:'YouTube',biglwa:'Big LWA',studio:'Studio'}[k]||k)+'</button>').join('')+
            '<label class="archive-dupes"><input type="checkbox" id="archiveHideDupes"'+(hideDupes?' checked':'')+'><span>Hide duplicates</span></label></div>':'')+
          '':'')+
          '</div>'+
          '<div class="module-status" id="archiveInstagramStatus">'+esc(status||(owner?(media.length?'Imported cards are saved to your account.':'Connect Instagram or Pinterest in Orbit, then refresh imports.'):'Shared with friends.'))+'</div>'+
          '<div class="archive-color-guide" aria-label="Card shadow color key">'+
  '<b>SHADOW KEY</b>'+
  '<span class="archive-color-guide-item"><i class="archive-key-instagram" aria-hidden="true"></i>Instagram · purple</span>'+
  '<span class="archive-color-guide-item"><i class="archive-key-pinterest" aria-hidden="true"></i>Pinterest · red</span>'+
  '<span class="archive-color-guide-item"><i class="archive-key-facebook" aria-hidden="true"></i>Facebook · blue</span>'+
  '<span class="archive-color-guide-item"><i class="archive-key-tiktok" aria-hidden="true"></i>TikTok · black</span>'+
  '<span class="archive-color-guide-item"><i class="archive-key-other" aria-hidden="true"></i>Other source</span>'+
  '<small>Card shadow = origin · Live = on Collective Feed · Grey photo = not live</small>'+
 '</div>'+
          (cards?'<div class="archive-page-list">'+cards+'</div>':'<div class="archive-empty">'+(media.length&&!mediaShown.length?'No cards match the filters you chose.':'No media has been imported yet.')+'</div>')+
          (owner&&archiveHasMore?'<div class="module-actions" style="justify-content:center;margin-top:18px"><button class="module-action ghost" id="archiveLoadMore" type="button">Load older photos</button></div>':'')+
        '</section>'+visibility+'</div>';

    // Both owners and approved friends can browse carousel cards. Old media
    // URLs get a second chance via their saved thumbnail when an image fails.
    const wall=$('.archive-page-list',body);
    // Derive the image's natural proportions on load, clamped to avoid a
    // panoramic thumbnail swallowing the whole grid. Carousel slides update too.
    const fitArchivePhoto=media=>{
      if(!(media instanceof HTMLElement))return;
      const w=media.naturalWidth||media.videoWidth||0,h=media.naturalHeight||media.videoHeight||0;
      if(!w||!h)return;
      const ratio=Math.max(.65,Math.min(1.55,w/h));
      media.closest('.instagram-archive-piece')?.style.setProperty('--archive-photo-ratio',String(ratio));
    };
    wall?.addEventListener('load',event=>{
      if(event.target.matches?.('.instagram-archive-piece img'))fitArchivePhoto(event.target);
    },true);
    wall?.addEventListener('loadedmetadata',event=>{
      if(event.target.matches?.('.instagram-archive-piece video'))fitArchivePhoto(event.target);
    },true);
    wall?.querySelectorAll('.instagram-archive-piece img').forEach(img=>{if(img.complete)fitArchivePhoto(img)});
    wall?.addEventListener('error',event=>{
      const image=event.target.closest?.('img[data-archive-fallback]');
      if(!image)return;
      const fallback=image.dataset.archiveFallback;
      image.removeAttribute('data-archive-fallback');
      if(fallback)image.src=fallback;
    },true);
    wall?.addEventListener('click',event=>{
      const arrow=event.target.closest('[data-archive-step]');
      const dot=event.target.closest('[data-archive-index]');
      if(!arrow&&!dot)return;
      event.preventDefault();event.stopPropagation();
      const card=(arrow||dot).closest('[data-archive-id]');
      if(!card)return;
      const item=mediaShown.find(row=>String(row.id)===String(card.dataset.archiveId));
      if(!item)return;
      const pieces=archiveMediaPieces(item);
      if(pieces.length<2)return;
      const index=dot?Number(dot.dataset.archiveIndex)
        :(Number(card.dataset.archiveSlide||0)+Number(arrow.dataset.archiveStep)+pieces.length)%pieces.length;
      card.dataset.archiveSlide=String(index);
      card.querySelectorAll('[data-archive-index]').forEach(button=>{
        const active=Number(button.dataset.archiveIndex)===index;
        button.classList.toggle('is-active',active);
        button.setAttribute('aria-current',active?'true':'false');
      });
      card.dataset.archiveUrl=pieces[index].url;
      const frame=card.querySelector('.instagram-archive-piece');
      if(frame)frame.outerHTML=archivePieceMarkup(pieces[index],index,pieces.length,1);
    });
    if(owner){
        $('#archiveConnections',body)?.addEventListener('click',()=>openConnectionsPopup());
        const filterBar=$('#archiveFilterBar',body);
        filterBar?.addEventListener('click',async(event)=>{
          const chip=event.target.closest('[data-archive-source-filter]');
          if(!chip)return;
          const k=chip.dataset.archiveSourceFilter;
          const f=readFilters();
          if(!f.sources.length)f.sources=Array.from(filterBar.querySelectorAll('[data-archive-source-filter]')).map(n=>n.dataset.archiveSourceFilter);
          if(f.sources.includes(k))f.sources=f.sources.filter(x=>x!==k);else f.sources.push(k);
          saveFilters(f);await draw();
        });
        $('#archiveHideDupes',body)?.addEventListener('change',async(event)=>{
          const f=readFilters();f.hideDupes=event.target.checked;saveFilters(f);await draw();
        });
        $('#archiveRefreshInstagram',body)?.addEventListener('click',async()=>{
          const button=$('#archiveRefreshInstagram',body),st=$('#archiveInstagramStatus',body);
          button.disabled=true;if(st)st.textContent='Syncing connected Orbit sources, including Pinterest…';
          try{
            // Do not let a disconnected Instagram account block Pinterest sync.
            const sources=[orbit?.restore?.bind(orbit),window.__biglwaPinterest?.restore?.bind(window.__biglwaPinterest)].filter(Boolean);
            await Promise.allSettled(sources.map(fn=>fn()));
            if(window.__biglwaPinterest?.syncAllBoards)await window.__biglwaPinterest.syncAllBoards();
            archiveInitialized=false;archiveMedia=[];archiveCursor=null;archiveHasMore=false;
            await draw();
          }catch(error){if(st)st.textContent=error?.message||'The Archive could not refresh its connected Orbit imports.'}finally{button.disabled=false}
        });
        $('#archiveLoadMore',body)?.addEventListener('click',loadMore);
        $('#archiveVisibility',body)?.addEventListener('change',async(event)=>{
          const st=$('#archiveFriendStatus',body);event.target.disabled=true;
          try{const value=await postsApi?.setArchiveVisibility?.(event.target.value);if(st)st.textContent=value==='friends'?'Archive is viewable to the friends you add below.':'Archive is private to you.';await draw()}catch(error){if(st)st.textContent=error?.message||'Visibility could not be saved.'}finally{event.target.disabled=false}
        });
        $('#archiveRemoveFriend',body)?.addEventListener('click',async()=>{
          const input=$('#archiveFriendUsername',body),st=$('#archiveFriendStatus',body),button=$('#archiveRemoveFriend',body);
          button.disabled=true;
          try{await postsApi?.removeArchiveFriend?.(input.value);input.value='';if(st)st.textContent='Friend removed from Archive access.';await draw()}catch(error){if(st)st.textContent=error?.message||'Friend could not be removed.'}finally{button.disabled=false}
        });
        $('#archiveAddFriend',body)?.addEventListener('click',async()=>{
          const input=$('#archiveFriendUsername',body),st=$('#archiveFriendStatus',body),button=$('#archiveAddFriend',body);
          button.disabled=true;
          try{await postsApi?.addArchiveFriend?.(input.value);input.value='';if(st)st.textContent='Friend added to Archive access.';await draw()}catch(error){if(st)st.textContent=error?.message||'Friend could not be added.'}finally{button.disabled=false}
        });
        Array.from(body.querySelectorAll('[data-archive-live-input]')).forEach(control=>control.addEventListener('change',async()=>{
          const id=control.dataset.archiveLiveInput,st=$('#archiveInstagramStatus',body);
          control.disabled=true;
          try{
            if(control.checked)await postsApi?.publishOrbitPost?.(id);
            else await postsApi?.setOrbitState?.(id,'archived');
            await draw();
          }catch(error){
            control.disabled=false;control.checked=!control.checked;
            if(st)st.textContent=error?.message||'That card could not be updated.';
          }
        }));
        $('.archive-page-list',body)?.addEventListener('click',async(event)=>{
          const deleteButton=event.target.closest('[data-archive-delete]');
          const archiveLight=event.target.closest('[data-archive-light="archive"]');
          const enlargeButton=event.target.closest('[data-archive-enlarge]');
          const card=event.target.closest('[data-archive-id]');
          if(!card)return;
          const id=card.dataset.archiveId;
          if(enlargeButton){archiveOpenImage(card.dataset.archiveUrl||'');return}
          if(archiveLight){const checkbox=card.querySelector('[data-archive-live-input]');if(checkbox&&!checkbox.disabled)checkbox.click();return}
          if(deleteButton){
            if(!window.confirm('Remove this post from the Collective Feed? It will stay in your Archive for 30 days before deletion.')) return;
            deleteButton.disabled=true;
            try{
              await postsApi?.removeOrbitPost?.(id);
              await draw();
            }catch(error){
              deleteButton.disabled=false;
              const st=$('#archiveInstagramStatus',body);
              if(st)st.textContent=error?.message||'That post could not be scheduled for deletion.';
            }
          }
        });
      }
};
    draw();
  }

  /* The Archive's Manage button covers every Orbit connection at once: the same rows as the
     Orbit page, so Instagram is not the only source that can be reached from here. OAuth ones
     connect, reconnect, and unlink in place; the plain-link ones hand over to the Orbit page,
     which already owns their paste-a-link fields. */
  function openConnectionsPopup(){
    const clients={instagram:window.__biglwaInstagramOrbit,tiktok:window.__biglwaTikTokOrbit,pinterest:window.__biglwaPinterest,facebook:window.__biglwaFacebookOrbit,youtube:window.__biglwaGoogleOrbit};
    const connected=Object.fromEntries(orbitConnected().map(r=>[r.id,r]));
    const rows=[...ORBIT_APPS,...PLANETARY_APPS].map(([k,g,n,t])=>{
      if(ORBIT_CONNECTED.has(k)){
        const row=connected[k];
        return '<div class="module-orbit-row is-oauth" data-orbit-row="'+esc(k)+'"><header><b>'+esc(n)+'</b>'+(row?'<em class="orbit-state is-on">Connected</em>':'<em class="orbit-state">Not connected</em>')+'</header>'+orbitBadge(g,t)+
          (row?'<div class="orbit-connected-card">'+(row.avatarUrl?'<img src="'+esc(row.avatarUrl)+'" alt="" width="46" height="46">':'')+'<span><b>'+esc(row.name||row.username||'Connected')+'</b>'+(row.username?'<small>@'+esc(row.username)+'</small>':'')+'</span><a class="orbit-hotlink" href="'+esc(row.link)+'" target="_blank" rel="noopener noreferrer">Open ↗</a></div>':'<p class="orbit-not-connected">Connect to fill this in and add your public link.</p>')+
          '<div class="module-actions"><button class="module-action" type="button" data-orbit-connect="'+esc(k)+'" '+(!ORBIT_LIVE.has(k)?'disabled':'')+'>'+(!ORBIT_LIVE.has(k)?'Coming soon':(row?'Reconnect':'Connect'))+' '+esc(n)+'</button>'+(row?'<button class="module-action ghost" type="button" data-orbit-unlink="'+esc(k)+'">Unlink</button>':'')+'</div></div>';
      }
      return '<div class="module-orbit-row"><header><b>'+esc(n)+'</b>'+'</header>'+orbitBadge(g,t)+'<p class="orbit-not-connected">'+(orbitLinks()[k]?'A public link is saved for this source.':'Kept as a plain profile link.')+'</p><div class="module-actions"><button class="module-action ghost" type="button" data-orbit-manage="'+esc(k)+'">Manage in Orbit</button></div></div>';
    }).join('');
    const root=document.createElement('div');
    root.className='biglwa-popup-backdrop';
    root.dataset.biglwaPopup='connections';
    root.innerHTML='<div class="biglwa-popup" role="dialog" aria-modal="true" aria-label="Manage connections">'+
      '<header><div><h2>Manage connections</h2><p>Connect, reconnect, or unlink every Orbit source from one place.</p></div><button class="biglwa-popup-close" type="button" aria-label="Close">×</button></header>'+
      '<div class="biglwa-popup-rows">'+rows+'</div></div>';
    document.body.appendChild(root);
    const dismiss=()=>{root.remove();document.removeEventListener('keydown',onKey)};
    const onKey=event=>{if(event.key==='Escape')dismiss()};
    document.addEventListener('keydown',onKey);
    root.addEventListener('click',event=>{
      if(event.target.closest('.biglwa-popup-close')||event.target===root){dismiss();return}
      const connect=event.target.closest('[data-orbit-connect]');
      if(connect){const k=connect.dataset.orbitConnect;if(clients[k]?.connect)clients[k].connect();else {dismiss();openModule('orbit')}return}
      const unlink=event.target.closest('[data-orbit-unlink]');
      if(unlink){const k=unlink.dataset.orbitUnlink;unlink.disabled=true;window.__biglwaConnections?.forget?.(k).then(()=>{dismiss();openConnectionsPopup()});return}
      const manage=event.target.closest('[data-orbit-manage]');
      if(manage){dismiss();openModule('orbit');return}
    });
  }

  function renderCloset(){
    const storage='biglwaModule_closet',depopKey='biglwaDepopPath';const items=readJSON(storage,[]),depop=localStorage.getItem(depopKey)||'';
    body.innerHTML=heading('closet')+`<div class="module-grid"><section class="module-card"><h2>Depop connection</h2><p>Keep a store/profile path here now; we can wire a real connection/import flow later.</p><div class="closet-connect"><span class="depop-mark">DEPOP</span><input class="module-input" id="depopPath" value="${esc(depop)}" placeholder="https://depop.com/yourshop"></div><div class="module-actions"><button class="module-action" id="saveDepop" type="button">Save path</button><button class="module-action ghost" id="openDepop" type="button" ${depop?'':'disabled'}>Open Depop</button></div><div class="module-status" id="depopStatus"></div></section><section class="module-card"><h2>Add closet item</h2><form class="module-form" id="closetForm"><input class="module-input" name="title" placeholder="Item name" required><div class="module-form two"><input class="module-input" name="price" placeholder="Price"><input class="module-input" name="size" placeholder="Size"></div><input class="module-input" name="condition" placeholder="Condition / notes"><input class="module-input" name="link" placeholder="Optional listing link"><button class="module-action" type="submit">Save item</button><button class="module-action secondary" id="closetFeedUpload" type="button">Add to Collective Feed</button></form></section><section class="module-card wide"><h2>Your closet</h2><div class="module-list" id="closetList">${listHtml(items,'item')}</div></section></div>`;
    const render=()=>{$('#closetList',body).innerHTML=listHtml(readJSON(storage,[]),'item')};$('#saveDepop',body).onclick=()=>{const v=$('#depopPath',body).value.trim();localStorage.setItem(depopKey,v);$('#depopStatus',body).textContent=v?'Depop path saved.':'Depop path cleared.';$('#openDepop',body).disabled=!v};$('#openDepop',body).onclick=()=>safeOpen(localStorage.getItem(depopKey)||'');$('#closetForm',body).onsubmit=e=>{e.preventDefault();const fd=new FormData(e.currentTarget),title=(fd.get('title')||'').trim();if(!title)return;const meta=[fd.get('price'),fd.get('size'),fd.get('condition'),fd.get('link')].filter(Boolean).join(' · ');const cur=readJSON(storage,[]);cur.unshift({title,meta});writeJSON(storage,cur);e.currentTarget.reset();render()};$('#closetFeedUpload',body).onclick=async()=>{const fd=new FormData($('#closetForm',body)),title=String(fd.get('title')||'').trim(),url=String(fd.get('link')||'').trim();const status=$('#depopStatus',body);const button=$('#closetFeedUpload',body);if(!title){status.textContent='Add the closet item details first.';return}if(!url){status.textContent='Add a listing link before sending this item to the feed.';return}button.disabled=true;status.textContent='Uploading feed draft…';try{await window.__biglwaCollectivePublish?.createStudioDraft({source:'closet',title,caption:title,sourceUrl:url});status.textContent='Closet item saved to your account as a private feed draft. Open Collective Feed to choose whether to post it.';status.classList.add('ok')}catch(err){console.error(err);status.textContent=err?.message||'Could not upload the closet item.';status.classList.remove('ok')}finally{button.disabled=false}};$('#closetList',body).onclick=e=>{const b=e.target.closest('[data-remove-item]');if(!b)return;const cur=readJSON(storage,[]);cur.splice(Number(b.dataset.removeItem),1);writeJSON(storage,cur);render()};
  }

  function renderTrophies(){
    body.innerHTML=heading('trophies')+`<div class="module-grid trophy-page-grid"><section class="module-card"><h2 id="trophyFormTitle">Add to your trophy case</h2><p>Everything is optional except the title. Add an Athletic.net page or another public result link when you want proof attached.</p><form class="module-form" id="trophyForm"><input type="hidden" name="editIndex" id="trophyEditIndex"><div class="trophy-form-grid"><label class="trophy-field full"><span>Title</span><input class="module-input" name="title" placeholder="Award, credential, race, achievement, or milestone" required></label><label class="trophy-field"><span>Type</span><select class="module-select" name="kind"><optgroup label="Recognition"><option value="award">Award</option><option value="honor">Honor / distinction</option><option value="scholarship">Scholarship / fellowship</option></optgroup><optgroup label="Education &amp; credentials"><option value="license">License</option><option value="certification">Certification</option><option value="diploma">Diploma</option><option value="degree">Degree</option><option value="ged">GED / equivalency</option></optgroup><optgroup label="Milestones &amp; athletics"><option value="achievement">Achievement</option><option value="milestone">Personal milestone</option><option value="record">Record / personal best</option><option value="race">Race / marathon</option><option value="athletic-result">Athletic result</option></optgroup></select></label><label class="trophy-field"><span>Month &amp; year</span><input class="module-input" name="date" type="month" placeholder="YYYY-MM"></label><label class="trophy-field full"><span>Organization or event</span><input class="module-input" name="organization" placeholder="School, licensing body, race, league, workplace, or presenter"></label><label class="trophy-field full"><span>Result or details</span><input class="module-input" name="result" placeholder="Credential, finish time, placement, distinction, or note"></label><label class="trophy-field full"><span>Result or proof link</span><input class="module-input" name="url" inputmode="url" placeholder="https://www.athletic.net/… or another public page"></label></div><div class="module-actions"><button class="module-action" id="trophySave" type="submit">Save trophy</button><button class="module-action ghost" id="trophyCancel" type="button" hidden>Cancel edit</button></div><div class="module-status" id="trophyStatus" role="status" aria-live="polite"></div></form></section><section class="module-card"><h2>Trophy case</h2><p>No placeholders—only the awards, credentials, finishes, results, and milestones you choose to save.</p><div class="trophy-list" id="trophyList">${trophyEntriesMarkup(readTrophies())}</div></section></div>`;
    const form=$('#trophyForm',body),list=$('#trophyList',body),status=$('#trophyStatus',body),editField=$('#trophyEditIndex',body),saveButton=$('#trophySave',body),cancelButton=$('#trophyCancel',body),formTitle=$('#trophyFormTitle',body);
    const draw=()=>{list.innerHTML=trophyEntriesMarkup(readTrophies())};
    const leaveEdit=()=>{form.reset();editField.value='';saveButton.textContent='Save trophy';cancelButton.hidden=true;formTitle.textContent='Add to your trophy case'};
    form.addEventListener('submit',event=>{
      event.preventDefault();const fd=new FormData(form),title=String(fd.get('title')||'').trim();
      if(!title){status.textContent='Give this trophy or achievement a title first.';status.classList.remove('ok');return}
      const url=normalizeExternalUrl(fd.get('url'));if(url===null){status.textContent='Use a valid public web link beginning with http:// or https://.';status.classList.remove('ok');return}
      const item={title,kind:trophyKindValue(fd.get('kind')),organization:String(fd.get('organization')||'').trim(),date:trophyMonthValue(fd.get('date')),result:String(fd.get('result')||'').trim(),url};
      const items=readTrophies(),rawIndex=String(fd.get('editIndex')||''),index=rawIndex===''?-1:Number(rawIndex),editing=Number.isInteger(index)&&index>=0&&index<items.length;
      if(editing)items[index]=item;else items.unshift(item);writeJSON(TROPHY_STORAGE,items);leaveEdit();draw();syncTrophyCard();status.textContent=editing?'Changes saved.':'Added to your trophy case.';status.classList.add('ok');
    });
    cancelButton.addEventListener('click',()=>{leaveEdit();status.textContent='Edit cancelled.';status.classList.remove('ok')});
    list.addEventListener('click',event=>{
      const editButton=event.target.closest('[data-trophy-edit]'),removeButton=event.target.closest('[data-trophy-remove]');if(!editButton&&!removeButton)return;
      const index=Number((editButton||removeButton).dataset[editButton?'trophyEdit':'trophyRemove']),items=readTrophies(),item=items[index];if(!item)return;
      if(removeButton){items.splice(index,1);writeJSON(TROPHY_STORAGE,items);leaveEdit();draw();syncTrophyCard();status.textContent='Removed from your trophy case.';status.classList.remove('ok');return}
      form.elements.title.value=item.title;form.elements.kind.value=trophyKindValue(item.kind);form.elements.organization.value=item.organization;form.elements.date.value=trophyMonthValue(item.date);form.elements.result.value=item.result;form.elements.url.value=item.url;editField.value=String(index);saveButton.textContent='Save changes';cancelButton.hidden=false;formTitle.textContent='Edit trophy';status.textContent='Editing '+item.title+'.';status.classList.remove('ok');form.scrollIntoView({behavior:'smooth',block:'start'});
    });
  }

  let activeMap=null;
  function renderMap(){
    // The map is an isolated embedded app. If its data/API fails it must never
    // redirect the signed-in Studio or trigger a sign-out/navigation fallback.
    body.innerHTML=heading('map')+`<style>#biglwaMapApp{width:100%;height:820px;border:0;border-radius:16px;background:#f6f0e9;display:block}#biglwaMapStatus{margin:0 0 10px;font:600 12px/1.45 system-ui;color:#6b5448}@media(max-width:760px){#biglwaMapApp{height:1050px}}</style>
      <section aria-label="BIG LWA map">
      <p id="biglwaMapStatus" role="status">Loading your map inside Studio…</p>
      <iframe id="biglwaMapApp" src="/map-app.html?embed=1&v=20261014-studio-real-map-controls-4" loading="eager" referrerpolicy="same-origin"
       title="BIG LWA interactive map and saved pins" allow="geolocation 'self'; fullscreen" allowfullscreen></iframe>
      <button type="button" class="module-action ghost" id="biglwaMapRetry">Reload map only</button>
      </section>`;
    const frame=$('#biglwaMapApp',body),status=$('#biglwaMapStatus',body);
    if(!frame||!status)return;
    let ready=false;
    const timer=setTimeout(()=>{
      if(!frame.isConnected||ready)return;
      status.textContent='Map is taking longer than expected. You can retry without leaving or signing out of Studio.';
    },12000);
    frame.addEventListener('load',()=>{
      ready=true;clearTimeout(timer);
      if(!frame.isConnected)return;
      status.textContent='Map opened in Studio. Your account session remains on the main page.';
    });
    frame.addEventListener('error',()=>{
      clearTimeout(timer);
      status.textContent='The map could not load. Select Reload map only; your Studio remains open.';
    });
    const retry=$('#biglwaMapRetry',body);
    if(retry)retry.onclick=()=>{
      ready=false;
      status.textContent='Retrying the map without reloading Studio…';
      frame.src='/map-app.html?embed=1&v=20261014-studio-real-map-controls-4';
    };
  }

  /* Wallpaper moderation. Reachable only from the member's own profile, and only the
     member and accounts listed in moderationAdmins ever see a decision button. */
  const reviewCard=(item,canDecide)=>{
    const when=item.createdAt&&item.createdAt.toDate?item.createdAt.toDate().toLocaleString():'';
    const media=item.mediaUrl?`<div class="review-media">${item.kind==='video'?`<video src="${esc(item.mediaUrl)}" controls muted playsinline></video>`:`<img src="${esc(item.mediaUrl)}" alt="Wallpaper awaiting review" loading="lazy">`}</div>`:'<p class="review-missing">The stored file is no longer available.</p>';
    const scores=Object.entries(item.scores||{}).slice(0,4).map(([k,v])=>`<span>${esc(k)} ${(Number(v)*100||0).toFixed(0)}%</span>`).join('');
    const actions=canDecide?`<div class="review-actions"><button type="button" class="review-approve" data-review-approve="${item.id}">Approve for profile</button><button type="button" class="review-reject" data-review-reject="${item.id}">Reject and delete</button></div>`:'<p class="review-note">A moderator decides this one.</p>';
    return `<article class="review-card" data-review-id="${item.id}"><header><b>@${esc(item.username||'member')}</b><span>${esc(item.verdict||'uncertain')} · ${esc(item.context||'mixed')}${when?' · '+esc(when):''}</span></header>${media}${scores?`<div class="review-scores">${scores}</div>`:''}${actions}<p class="review-status" data-review-status="${item.id}"></p></article>`;
  };

  async function renderReviews(){
    const cloud=window.BIGLWAWallpaperCloud;
    body.innerHTML=heading('reviews')+'<div class="module-grid"><section class="module-card wide"><h2>Wallpaper reviews</h2><p id="reviewStatus">Loading…</p><div id="reviewList" class="review-list"></div></section></div>';
    if(!cloud){$('#reviewStatus',body).textContent='Account media is unavailable right now.';return}
    const admin=await cloud.isAdmin();
    const items=await cloud.reviews({pendingOnly:true});
    const status=$('#reviewStatus',body);
    status.textContent=admin
      ? (items.length?`${items.length} wallpaper${items.length===1?'':'s'} waiting on you.`:'Nothing is waiting for review.')
      : (items.length?`${items.length} of your wallpapers are waiting on a moderator.`:'You have no wallpapers waiting on review.');
    $('#reviewList',body).innerHTML=items.length?items.map(item=>reviewCard(item,admin)).join(''):'<p class="review-empty">No pending media.</p>';
    body.onclick=async e=>{
      const approve=e.target.closest('[data-review-approve]'),reject=e.target.closest('[data-review-reject]');
      if(!approve&&!reject)return;
      const id=(approve||reject).dataset.reviewApprove||(approve||reject).dataset.reviewReject;
      const say=$('[data-review-status="'+id+'"]',body);say.textContent='Saving…';
      try{await cloud.decide(id,approve?'approve':'reject');say.textContent=approve?'Approved and published to the profile.':'Rejected and deleted.';setTimeout(()=>renderReviews(),900)}
      catch(err){say.textContent=err?.message||'That decision could not be saved.'}
    };
  }

  function renderVeve(){
    body.innerHTML=heading('veve')+'<div id="biglwaVeve" class="veve-root"><p role="status">Loading public discovery…</p></div>';
    const root=$('#biglwaVeve',body);
    if(window.BigLWAVeve?.mount)window.BigLWAVeve.mount(root);
    else root.innerHTML='<p role="alert">Veve is loading. Please refresh and try again.</p>';
  }
  function renderCreate(){const mods=['calendar','feed','projects','trophies','camera','diary','boards','closet','archive','stream','map','orbit'];body.innerHTML=heading('create')+`<div class="module-grid"><section class="module-card wide"><h2>Choose where this belongs</h2><div class="module-launchers">${mods.map(k=>`<button class="module-launcher" type="button" data-module-launch="${k}"><b>${labels[k]}</b><small>${desc[k]}</small></button>`).join('')}</div></section></div>`;body.onclick=e=>{const b=e.target.closest('[data-module-launch]');if(b)openModule(b.dataset.moduleLaunch)}};

  let activeModuleKey='';
  function openModule(rawKey, context='', push=true){
    stopCamera();let key=(rawKey||'').toLowerCase();if(key==='politic'||key==='politics')key='politc';
    if(activeModuleKey==='stream'&&key!=='stream')window.BigLWAStreamGuide?.parkInStudio?.();if(key==='room')key='rooms';if(key==='project')key='projects';if(key==='didyouknow')key='learn';if(!known.has(key))key='create';activeModuleKey=key;workspace.dataset.moduleKey=key;main.classList.add('module-view');workspace.hidden=false;routeName.textContent=labels[key]||key;
    if(key==='calendar')renderCalendar();else if(key==='orbit')renderOrbitPage();else if(key==='diary'||key==='notes')renderWriting(key);else if(key==='feed')renderFeed();else if(key==='connect')renderConnect();else if(key==='camera')renderCamera();else if(key==='rooms')renderRoom();else if(key==='politc')renderPolitc();else if(key==='tools')renderTools();else if(key==='games')renderGames();else if(key==='learn')renderLearn();else if(key==='closet')renderCloset();else if(key==='archive')renderArchive();else if(key==='trophies')renderTrophies();else if(key==='map')renderMap();else if(key==='reviews')renderReviews();else if(key==='create')renderCreate();else if(key==='veve')renderVeve();else if(key==='library')renderCollection('library',[{name:'title',placeholder:'Resource title'},{name:'detail',placeholder:'URL, author, or collection'}],[]);else if(key==='boards')renderCollection('boards',[{name:'title',placeholder:'Board name'},{name:'detail',placeholder:'What belongs here?'}],[{title:'My Inspiration',meta:'visual references'}]);else if(key==='projects')renderCollection('projects',[{name:'title',placeholder:'Project name'},{name:'detail',placeholder:'Status · collaborators · next step'}],[]);else if(key==='stream'){body.innerHTML=heading('stream')+'<div id="biglwaStreamGuide"></div>';if(window.BigLWAStreamGuide?.mount)window.BigLWAStreamGuide.mount($('#biglwaStreamGuide',body));else body.innerHTML=heading('stream')+'<section class="module-card"><h2>Stream is loading</h2><p>Refresh to try again.</p></section>'}document.dispatchEvent(new CustomEvent('biglwa:module-open',{detail:{key}}));window.scrollTo({top:0,behavior:'instant'});if(push){try{history.pushState({biglwaModule:key},'',(key==='map'||key==='politc')?`/studio?panel=${encodeURIComponent(key)}`:(key==='orbit'?'/studio?view=orbit':`/studio/${encodeURIComponent(key)}`))}catch{}}
  }
  window.openBIGLWAModule=openModule;
  document.addEventListener('biglwa:google-state',()=>{if(routeName.textContent==='Calendar'&&!workspace.hidden)renderCalendar()});
  window.addEventListener('biglwa:orbit-imported',()=>{
    if(activeModuleKey==='archive') renderArchive();
    if(activeModuleKey==='feed'){
      if(window.__biglwaFeed&&typeof window.__biglwaFeed.refresh==='function') window.__biglwaFeed.refresh();
    }
  });
  window.addEventListener('biglwa:orbit-state-changed',()=>{
    if(activeModuleKey==='archive') renderArchive();
    if(activeModuleKey==='feed'){
      if(window.__biglwaFeed&&typeof window.__biglwaFeed.refresh==='function') window.__biglwaFeed.refresh();
    }
  });

  window.BigLWAOpenModule = (key) => openModule(key);
  const syncVeveLogoLabel=()=>{
    const logo=document.querySelector('#studioApp .studio-brand-row > a.brand.biglwa-block-brand');
    if(!logo)return;
    const title=activeModuleKey==='veve'?'Return to Studio':'Open Veve';
    logo.setAttribute('aria-label',title);
    logo.setAttribute('title',title);
  };
  document.addEventListener('biglwa:module-open',syncVeveLogoLabel);
  document.addEventListener('biglwa:module-close',syncVeveLogoLabel);
  // The BIGLWA crest toggles between Studio and Veve without reloading the
  // signed-in session or interrupting any other modules or their stored data.
  document.addEventListener('click',event=>{
    const logo=event.target?.closest?.('#studioApp .studio-brand-row > a.brand.biglwa-block-brand');
    if(!logo||document.documentElement.classList.contains('biglwa-preview-mode'))return;
    event.preventDefault();event.stopImmediatePropagation();
    if(activeModuleKey==='veve')closeModule();
    else openModule('veve');
  },true);
  function closeModule(push=true){if(activeModuleKey==='stream')window.BigLWAStreamGuide?.parkInStudio?.();stopCamera();if(activeMap){try{activeMap.remove()}catch{}activeMap=null}activeModuleKey='';delete workspace.dataset.moduleKey;main.classList.remove('module-view');workspace.hidden=true;body.innerHTML='';routeName.textContent='Module';document.dispatchEvent(new CustomEvent('biglwa:module-close'));if(push){try{history.pushState({},'', '/studio')}catch{}}}
  moduleBack.addEventListener('click',()=>closeModule());
  workspace.addEventListener('change',event=>{
    const control=event.target.closest('[data-silent-update]');if(!control)return;
    localStorage.setItem(quietUpdateKey(control.dataset.silentUpdate),control.checked?'1':'0');
  });
  workspace.addEventListener('submit',event=>{
    if(!activeModuleKey||activeModuleKey==='create')return;
    const values=[...new FormData(event.target).values()].some(value=>String(value||'').trim());if(!values)return;
    setTimeout(()=>recordStudioUpdate(activeModuleKey,`${labels[activeModuleKey]||'Studio'} updated`,'Saved from its widget page'),0);
  });
  workspace.addEventListener('click',event=>{
    const control=event.target.closest('[data-orbit-save],#saveDepop');if(!control||!activeModuleKey)return;
    setTimeout(()=>recordStudioUpdate(activeModuleKey,`${labels[activeModuleKey]||'Studio'} settings updated`,'Saved from its widget page'),0);
  });

  function writingPreviewValue(key){
    try{return String(localStorage.getItem('biglwaDraft_'+key)||'').trim()}catch{return ''}
  }
  function writingPreviewDate(key){
    try{
      const uid=String(window.__biglwaIdentity?.uid||window.__biglwaAuth?.currentUser?.uid||'guest').trim()||'guest';
      const collection=JSON.parse(localStorage.getItem('biglwaWritingCollectionV1:'+uid+':'+key)||'null');
      const entry=collection?.entries?.find(item=>item.id===collection.currentId);
      const d=new Date(entry?.updatedAt||entry?.createdAt||'');
      if(Number.isFinite(d.getTime())){
        return d.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
      }
    }catch{}
    return '';
  }
  function syncWritingPreviews(){
    // A signed-out visitor must never inherit the device owner's locally
    // stored writing. Journal shares only an explicit public snapshot.
    if(document.documentElement.classList.contains('biglwa-preview-mode')){
      const note=$('#studioApp #notes .note-paper');
      if(note){
        note.innerHTML='<span class="studio-private-writing">🔒 Sqwib Note · private</span>';
        note.setAttribute('aria-label','Sqwib Note is private');
      }
      const page=$('#studioApp #diary .diary-page');
      if(page){
        const username=(()=>{try{return decodeURIComponent(location.pathname.split('/').filter(Boolean)[0]||'')}catch{return ''}})();
        if(page.dataset.publicJournalUsername!==username){
          page.dataset.publicJournalUsername=username;
          page.innerHTML='<span class="studio-private-writing">Journal · checking visibility…</span>';
          Promise.resolve(window.BigLWAUserDirectory?.loadPublicProfile?.(username)).then(profile=>{
            if(!page.isConnected||page.dataset.publicJournalUsername!==username)return;
            if(profile?.journalVisibility==='public'&&profile.publicJournal){
              page.innerHTML='<span class="studio-public-journal-heading">Journal · viewable</span><p class="studio-public-journal-excerpt"></p>';
              page.querySelector('p').textContent=String(profile.publicJournal).slice(0,165);
            }else{
              page.innerHTML='<span class="studio-private-writing">🔒 Journal · private</span>';
            }
          }).catch(()=>{if(page.isConnected)page.innerHTML='<span class="studio-private-writing">Journal unavailable</span>'});
        }
      }
      return;
    }
    const journalInitial=()=>{
      let name='';
      try{
        const saved=JSON.parse(localStorage.getItem('biglwaProfileDetails')||'null');
        name=String(saved?.name||saved?.displayName||'').trim();
      }catch{}
      if(!name)name=String($('#studioApp .profile-display-name')?.textContent||$('#studioApp .profile-name-line h1')?.textContent||'').trim();
      return (Array.from(name.replace(/^@/,'').trim())[0]||'✦').toLocaleUpperCase();
    };
    const noteLabel=$('#studioApp #notes .card-head h2');
    if(noteLabel&&noteLabel.textContent.trim()!=='Sqwib Note')noteLabel.textContent='Sqwib Note';
    const journalLabel=$('#studioApp #diary .card-head h2');
    if(journalLabel&&journalLabel.textContent.trim()!=='Journal')journalLabel.textContent='Journal';
    const noteCard=$('#notes'),notePaper=noteCard&&$('.note-paper',noteCard),note=writingPreviewValue('notes');
    if(notePaper){
      if(notePaper._biglwaPlaceholderHTML===undefined)notePaper._biglwaPlaceholderHTML=notePaper.innerHTML;
      notePaper.classList.toggle('has-saved-writing',!!note);
      if(note){
        const savedAt=writingPreviewDate('notes')||new Date().toLocaleDateString(undefined,{month:'short',day:'numeric'});
        notePaper.innerHTML='<p class="studio-writing-preview-text">'+esc(note)+'</p><span class="studio-writing-preview-meta">saved '+esc(savedAt)+'</span>';
        notePaper.setAttribute('aria-label','Private Sqwib Note preview');
      }else{
        notePaper.innerHTML=notePaper._biglwaPlaceholderHTML||'';
        notePaper.setAttribute('aria-label','Open private Sqwib Note');
      }
    }
    const diaryCard=$('#diary'),diaryPage=diaryCard&&$('.diary-page',diaryCard),diary=writingPreviewValue('diary');
    if(diaryPage){
      if(diaryPage._biglwaPlaceholderHTML===undefined)diaryPage._biglwaPlaceholderHTML=diaryPage.innerHTML;
      diaryPage.classList.toggle('has-saved-writing',!!diary);
      if(diary){
        const savedAt=writingPreviewDate('diary')||new Date().toLocaleDateString(undefined,{month:'short',day:'numeric'});
        diaryPage.innerHTML='<div class="studio-diary-preview"><small>latest entry · '+esc(savedAt)+'</small><p>'+esc(diary)+'</p></div>';
        diaryPage.setAttribute('aria-label','Open Journal');
      }else{
        diaryPage.innerHTML=diaryPage._biglwaPlaceholderHTML||'';
        diaryPage.setAttribute('aria-label','Open Journal');
      }
      let nametag=$('.studio-journal-initial',diaryPage);
      if(!nametag){
        nametag=document.createElement('span');
        nametag.className='studio-journal-initial';
        nametag.setAttribute('aria-label','Journal owner initial');
        diaryPage.appendChild(nametag);
      }
      const initial=journalInitial();if(nametag.textContent!==initial)nametag.textContent=initial;
    }
  }

  function readMapPreviewPins(){
    try{
      const value=JSON.parse(localStorage.getItem('biglwaMapPins')||'[]');
      return Array.isArray(value)?value.filter(pin=>pin&&typeof pin==='object'):[];
    }catch{return []}
  }
  function syncMapCardPreview(){
    const mapCard=$('#map');if(!mapCard)return;
    let slot=$('.studio-map-preview-slot',mapCard);
    if(!slot){
      slot=document.createElement('div');
      slot.className='studio-map-preview-slot';
      slot.setAttribute('aria-label','Interactive street map preview with saved pins');
      const oldVisual=$('.studio-map-visual',mapCard),cta=$('.card-cta',mapCard);
      if(oldVisual)oldVisual.replaceWith(slot);
      else if(cta)cta.before(slot);else mapCard.appendChild(slot);
    }
    // Real Leaflet map, as used by the full Map page. Do not redraw or reload
    // the iframe on focus/scroll: doing so makes tile layers flicker or reset.
    let mini=$('#biglwaStudioMiniMap',slot);
    if(!mini){
      slot.replaceChildren();
      mini=document.createElement('iframe');
      mini.id='biglwaStudioMiniMap';
      mini.className='studio-mini-map';
      mini.title='Interactive mini map — pan, zoom, and see saved locations';
      mini.src='/map-app.html?embed=1&preview=1&v=20261014-studio-real-map-controls-2';
      mini.loading='eager';
      mini.referrerPolicy='same-origin';
      mini.setAttribute('allow','geolocation \'self\'');
      slot.appendChild(mini);
      const status=document.createElement('p');
      status.className='studio-mini-map-caption';
      status.innerHTML='Drag to explore · +/- to zoom · <button type="button" class="studio-mini-map-open" data-open="map">Open full map ↗</button>';
      slot.appendChild(status);
    }
    const pins=readMapPreviewPins();
    const caption=$('.studio-mini-map-caption',slot);
    if(caption){
      const message=pins.length
        ?pins.length+' saved spot'+(pins.length===1?'':'s')+' · drag to explore'
        :'Interactive map · drag to explore and zoom';
      caption.innerHTML='<span>'+message+'</span> · <button type="button" class="studio-mini-map-open" data-open="map">Open full map ↗</button>';
    }
    if(mini.dataset.pinCount!==String(pins.length)){
      mini.dataset.pinCount=String(pins.length);
      if(mini.contentWindow)mini.contentWindow.postMessage({type:'biglwa:map-preview-refresh'},location.origin);
    }
  }

  function enhanceStudioCards(){
    // Update legacy Studio dock/navigation copy as well as the Journal widget.
    // Preserve the existing route IDs ("diary", "notes") and their saved data.
    document.querySelectorAll('#studioApp [data-open="diary"],#studioApp a[href="#diary"]').forEach(control=>{
      const leaf=[...control.querySelectorAll('b,span,small')].filter(node=>!node.children.length);
      if(!leaf.length&&!control.children.length)leaf.push(control);
      leaf.forEach(node=>{if(/^diary$/i.test(node.textContent.trim()))node.textContent='Journal'});
    });
    document.querySelectorAll('#studioApp [data-open="notes"],#studioApp a[href="#notes"]').forEach(control=>{
      const leaf=[...control.querySelectorAll('b,span,small')].filter(node=>!node.children.length);
      if(!leaf.length&&!control.children.length)leaf.push(control);
      leaf.forEach(node=>{if(/^(qwiky|quick|sqwib)\s*note$/i.test(node.textContent.trim()))node.textContent='Sqwib Note'});
    });
    const cameraCard=$('#camera'),cameraPreview=cameraCard&&$('.contact-sheet',cameraCard);
    if(cameraPreview){cameraPreview.classList.add('photobooth-reference-preview');cameraPreview.setAttribute('aria-label','Black-and-white photobooth preview');cameraPreview.innerHTML='<img src="/assets/photobooth-before-use.webp?v=20260923-preview-800" alt="Three friends posing together in a black-and-white photobooth portrait" width="800" height="533" loading="lazy">'}
    const archiveCard=$('#archive');
    if(archiveCard){
      archiveCard.dataset.widgetRoute='archive';

      // Deterministic Archive body: keep only the header/window controls,
      // then build exactly one temporary preview from the approved upload.
      [...archiveCard.children].forEach(el=>{
        if(el.matches('.card-head,.widget-window-controls,.window-controls,.widget-drag-handle'))return;
        el.remove();
      });

      const head=$('.card-head',archiveCard);
      const arrow=head&&$('.arrow-btn',head);
      if(arrow){arrow.dataset.open='archive';arrow.setAttribute('aria-label','Open Archive')}

      const copy=document.createElement('p');
      copy.className='sub';
      copy.textContent='Keep memories, media, references, and works in progress close.';

      const preview=document.createElement('button');
      preview.type='button';
      preview.className='archive-photo-preview';
      preview.dataset.open='archive';
      preview.setAttribute('aria-label','Open Archive');
      preview.innerHTML='<img alt="Polaroid photograph of three friends relaxing together on a bed" width="360" height="638" loading="eager" decoding="sync">';
      const archiveImg=$('img',preview);
      const archiveParts=[
        '/assets/archive-preview-b64-0a.txt?v=20260918-inline-3',
        '/assets/archive-preview-b64-0b.txt?v=20260918-inline-3',
        '/assets/archive-preview-b64-1.txt?v=20260918-inline-3',
        '/assets/archive-preview-b64-2.txt?v=20260918-inline-3',
        '/assets/archive-preview-b64-3.txt?v=20260918-inline-3',
        '/assets/archive-preview-b64-4.txt?v=20260918-inline-3'
      ];
      Promise.all(archiveParts.map(url=>fetch(url,{cache:'no-store'}).then(response=>{
        if(!response.ok)throw new Error('Archive preview chunk failed: '+response.status);
        return response.text();
      }))).then(parts=>{
        const data=parts.join('').replace(/\\s+/g,'');
        if(archiveImg)archiveImg.src='data:image/jpeg;base64,'+data;
      }).catch(error=>{
        console.error(error);
        preview.classList.add('archive-preview-load-failed');
      });

      const cta=document.createElement('button');
      cta.className='card-cta';
      cta.type='button';
      cta.dataset.open='archive';
      cta.textContent='Open Archive →';

      archiveCard.append(copy,preview,cta);
    }
    for(const [id,title,copy,key] of [['calendar','Calendar','Your schedule, connected through Orbit.','calendar'],['connect','Connect','Invite friends to your creative community.','connect']]){
      const card=$('#'+id);if(!card)continue;
      [...card.children].forEach(el=>{if(!el.matches('.card-head,.widget-window-controls,.window-controls'))el.remove()});
      const content=document.createElement('div');content.innerHTML=(id==='calendar'?miniCalendarMarkup():'')+'<p>'+copy+'</p><button class="module-action" type="button" data-open="'+key+'">'+(key==='calendar'?'Open Calendar':'Invite friends')+'</button>';card.append(content);
    }
    function syncCollectiveFeedPreview(feedCard){
      if(!feedCard)return;
      const hero=$('#biglwaFeedHero',feedCard);
      if(!hero)return;
      // Use the SAME approved Firestore posts as Collective Feed, not a private
      // Archive import or Instagram-only data. feed-view.js owns rendering.
      const feed=window.__biglwaFeed;
      if(feed?.refresh){
        Promise.resolve(feed.refresh()).catch(error=>
          console.warn('Studio Collective Feed thumbnail refresh:',error));
      }else if(feed?.renderHero){
        feed.renderHero(true);
      }
    }
    function syncStudioBoardsPreview(){
      const card=$('#boards');if(!card)return;
      card.dataset.widgetRoute='boards';
      let slot=$('#biglwaStudioBoardsPreview',card);
      if(!slot){
        slot=document.createElement('div');
        slot.id='biglwaStudioBoardsPreview';
        slot.className='studio-pinterest-board-preview';
        slot.setAttribute('aria-label','Your connected Pinterest Pins');
        const cta=$('.card-cta',card);
        if(cta)cta.before(slot);else card.appendChild(slot);
      }
      const state=window.__biglwaPinterest?.state;
      const viewer=String(window.__biglwaIdentity?.uid||'');
      const tiles=(state?.connected&&(!viewer||state.uid===viewer))
        ?(window.__biglwaPinterest?.getPreview?.()||[]):[];
      const signature=tiles.slice(0,6).map(item=>item.url).join('|');
      if(state?.connected&&(!viewer||state.uid===viewer)){
        // After Pinterest connects, don't allow static placeholder art
        // to remain behind the live pin grid, even while Pins are loading.
        [...card.children].forEach(child=>{
          if(child===slot||child.matches('.card-head,.sub,.card-cta,.widget-window-controls,.window-controls,.widget-drag-handle'))return;
          child.remove();
        });
        card.classList.add('has-live-pinterest-preview');
      }else{
        // Do not falsely display the generic collage as a Pinterest account.
        card.classList.remove('has-live-pinterest-preview');
      }
      if(slot.dataset.signature===signature)return;
      slot.dataset.signature=signature;
      slot.innerHTML=tiles.length
        ?tiles.slice(0,6).map((item,i)=>
          '<button type="button" data-open="boards" aria-label="Open Pinterest Boards">'+
          '<img src="'+esc(item.url)+'" loading="lazy" decoding="async" alt="Pinterest Pin '+(i+1)+'"></button>').join('')
        :'<button type="button" class="studio-pinterest-empty" data-open="boards">'+(state?.connected?'Open Boards to load your Pins':'Connect Pinterest to preview your Pins')+'</button>';
    }
    const feedCard=$('#feed');
    if(feedCard){
      feedCard.dataset.widgetRoute='feed';
      let hero=$('#biglwaFeedHero',feedCard);
      if(!hero){
        hero=document.createElement('div');hero.id='biglwaFeedHero';hero.className='biglwa-feed-hero';
        const cta=$('.card-cta',feedCard);
        if(cta)cta.before(hero);else feedCard.appendChild(hero);
      }
      syncCollectiveFeedPreview(feedCard);
      const refresh=()=>syncCollectiveFeedPreview(feedCard);
      if(!feedCard.dataset.previewBound){
        feedCard.dataset.previewBound='1';
        document.addEventListener('biglwa:feed-ready',refresh);

        window.addEventListener('biglwa:orbit-imported',refresh);
        window.addEventListener('biglwa:orbit-state-changed',refresh);
        document.addEventListener('biglwa:pinterest-status',refresh);
      }
    }
    syncStudioBoardsPreview();
    const boardsCard=$('#boards');
    if(boardsCard&&!boardsCard.dataset.pinPreviewBound){
      boardsCard.dataset.pinPreviewBound='1';
      document.addEventListener('biglwa:pinterest-preview-updated',syncStudioBoardsPreview);
      document.addEventListener('biglwa:pinterest-status',syncStudioBoardsPreview);
    }
    let mapCard=$('#map');
    if(!mapCard){
      const masonry=$('#studioApp .masonry');
      if(masonry){
        mapCard=document.createElement('article');
        mapCard.id='map';
        mapCard.className='card studio-map-card';
        mapCard.dataset.search='map places pins memories projects locations geography';
        mapCard.dataset.widgetRoute='map';
        mapCard.innerHTML='<div class="card-head"><div><span class="card-icon" aria-hidden="true">⌖</span><h2>Map</h2></div><button class="arrow-btn" type="button" data-open="map" aria-label="Open Map">→</button></div><p class="sub">Pin places, memories, and projects.</p><div class="studio-map-preview-slot" aria-live="polite"></div><button class="card-cta" type="button" data-open="map">Open Map →</button>';
        const calendar=$('#calendar');
        if(calendar&&calendar.parentElement===masonry)calendar.insertAdjacentElement('afterend',mapCard);else masonry.appendChild(mapCard);
      }
    }
    if(mapCard){
      mapCard.classList.add('studio-map-card');
      mapCard.dataset.widgetRoute='map';
      mapCard.dataset.search=(mapCard.dataset.search||'')+' map places pins memories projects locations geography';
      const arrow=$('.arrow-btn',mapCard);if(arrow){arrow.dataset.open='map';arrow.setAttribute('aria-label','Open Map')}
      mapCard.querySelectorAll('.card-cta').forEach(button=>{button.dataset.open='map'});
      syncMapCardPreview();
    }
    if(!$('#politc')){
      const masonry=$('#studioApp .masonry');
      if(masonry){
        const card=document.createElement('article');
        card.id='politc';card.className='card studio-politc-card';
        card.dataset.widgetRoute='politc';
        card.dataset.search='politc politics political pendulum votes election voting united nations un al jazeera genocide watch wcw mcm hunting season cunting season';
        card.innerHTML='<div class="card-head"><div><span class="card-icon politc-studio-symbol" aria-hidden="true"><img src="/assets/politc-nyame-baatanpa.svg?v=20261014-1" alt="" width="34" height="34"></span><h2>politc</h2></div><button class="arrow-btn" type="button" data-open="politc" aria-label="Open politc">→</button></div><p class="sub">Wanted posters, WCW, MCM, Hunting Season, Cunting Season, the political pendulum, and world civic resources.</p><button class="card-cta" type="button" data-open="politc">Open politc →</button>';
        const roomsCard=$('#rooms');if(roomsCard&&roomsCard.parentElement===masonry)roomsCard.insertAdjacentElement('afterend',card);else masonry.appendChild(card);
      }
    }
    // Recovered Studio cards must receive the same symbol and route as newly created cards.
    const politcCard=$('#studioApp #politc');
    if(politcCard){
      politcCard.dataset.widgetRoute='politc';
      const badge=$('.card-icon',politcCard);
      if(badge&&!badge.querySelector('img[src*="politc-nyame-baatanpa"]')){
        badge.classList.add('politc-studio-symbol');
        badge.innerHTML='<img src="/assets/politc-nyame-baatanpa.svg?v=20261014-1" alt="" width="34" height="34">';
      }
      politcCard.querySelectorAll('.card-cta,.arrow-btn').forEach(button=>{button.dataset.open='politc';button.setAttribute('aria-label','Open politc');});
    }
    if(!$('#tools')){
      const masonry=$('#studioApp .masonry');
      if(masonry){
        const toolsCard=document.createElement('article');
        toolsCard.id='tools';
        toolsCard.className='card studio-tools-card';
        toolsCard.dataset.search='tools pdf compression youtube mp3 mp4 download converter file image audio video convert';
        toolsCard.dataset.widgetRoute='tools';
        toolsCard.innerHTML='<div class="card-head"><div><span class="card-icon" aria-hidden="true">🛠</span><h2>Tools</h2></div><button class="arrow-btn" type="button" data-open="tools" aria-label="Open Tools">→</button></div><p class="sub">Drop any file and it is sorted out automatically — convert video or audio, compress a PDF or image, or send it to a converter online.</p><button class="card-cta" type="button" data-open="tools">Open Tools →</button>';
        const mapRef=$('#map');
        if(mapRef&&mapRef.parentElement===masonry)mapRef.insertAdjacentElement('afterend',toolsCard);else masonry.appendChild(toolsCard);
      }
    }
  }
  setTimeout(()=>{enhanceStudioCards();syncTrophyCard();syncWritingPreviews()},80);
  window.addEventListener('storage',event=>{if(event.key==='biglwaMapPins')syncMapCardPreview();if(event.key==='biglwaDraft_notes'||event.key==='biglwaDraft_diary')syncWritingPreviews()});
  window.addEventListener('focus',()=>{syncMapCardPreview();syncWritingPreviews()});
  document.addEventListener('biglwa:writing-saved',syncWritingPreviews);
  document.addEventListener('biglwa:module-close',()=>{syncMapCardPreview();syncWritingPreviews()});

  document.addEventListener('click',e=>{if(e.target.closest('#moduleWorkspace'))return;const directory=e.target.closest('.hero-action-bar a[href^="#"]');const mobile=e.target.closest('#mobileCreate');const trigger=e.target.closest('[data-open],.arrow-btn');if(!directory&&!mobile&&!trigger)return;let key=mobile?'veve':directory?(directory.getAttribute('href')||'').replace(/^#/,''):trigger.dataset.open;if(key==='home'){e.preventDefault();e.stopImmediatePropagation();closeModule();window.scrollTo({top:0,behavior:'smooth'});return}if(key==='desk')key='create';const card=trigger?.closest('.card');const cardKey=card?.id;if(!known.has(String(key||'').toLowerCase())&&cardKey)key=cardKey;if(!key&&cardKey)key=cardKey;if(!key||!known.has(String(key).toLowerCase()))return;e.preventDefault();e.stopImmediatePropagation();openModule(key,trigger?.dataset.open||'')},true);
  const cleanStudioModulePath=()=>{try{const parts=location.pathname.replace(/^\/+|\/+$/g,'').split('/').filter(Boolean).map(x=>decodeURIComponent(x).toLowerCase());if(parts[0]!=='studio'||parts.length!==2)return '';return known.has(parts[1])?parts[1]:''}catch{return ''}};
  const routeViewFromUrl=()=>{const params=new URLSearchParams(location.search);if(location.pathname.replace(/\/+$/,'')==='/studio'&&['map','politc'].includes(params.get('panel')))return params.get('panel');const legacy=params.get('view');return legacy&&known.has(legacy.toLowerCase())?legacy.toLowerCase():cleanStudioModulePath()};
  const canonicalizeLegacyView=()=>{const legacy=new URLSearchParams(location.search).get('view');if(!legacy||!known.has(legacy.toLowerCase())||legacy.toLowerCase()==='orbit')return;try{history.replaceState({biglwaModule:legacy.toLowerCase()},'',['map','politc'].includes(legacy.toLowerCase())?`/studio?panel=${encodeURIComponent(legacy.toLowerCase())}`:`/studio/${encodeURIComponent(legacy.toLowerCase())}`)}catch{}};
  window.addEventListener('popstate',()=>{const v=routeViewFromUrl();if(v)openModule(v,'',false);else closeModule(false)});
  // Map stays on the authenticated Studio route, even when an older deep link is opened.
  const deepPanel=location.pathname.match(/^\/studio\/(map|politc)\/?$/i);
  if(deepPanel){const panel=deepPanel[1].toLowerCase();try{history.replaceState({biglwaModule:panel},'','/studio?panel='+panel)}catch{}}
  canonicalizeLegacyView();
  const initialView=routeViewFromUrl();if(initialView)setTimeout(()=>openModule(initialView,'',false),80);
})();
