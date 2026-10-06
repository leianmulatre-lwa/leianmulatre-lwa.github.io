(() => {
  if (window.__biglwaModulePagesReadyV3) return;
  window.__biglwaModulePagesReadyV3 = true;

  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const main = $('.main');
  if (!main) return;

  const style = document.createElement('style');
  style.id = 'biglwa-module-pages-style-v3';
  style.textContent = `

    .module-textarea.diary-lined{font:16px/28px Georgia,serif;min-height:360px;padding:14px 20px;background-color:#f5ecdf;background-image:repeating-linear-gradient(to bottom,transparent 0,transparent 27px,#bcc3c5 27px,#bcc3c5 28px);background-origin:content-box;background-attachment:local;color:#302b28}.night-mode .module-textarea.diary-lined{background-color:#302c28;background-image:repeating-linear-gradient(to bottom,transparent 0,transparent 27px,#59544e 27px,#59544e 28px);color:#f5ecdf}
    .module-workspace[hidden]{display:none!important}
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
    .module-heading p{max-width:700px;margin:12px 0 0;font-size:13px;line-height:1.6;color:#6e655f}
    .module-badge{align-self:start;border:1px solid #d8cec5;border-radius:999px;padding:8px 11px;font-size:9px;letter-spacing:.1em;text-transform:uppercase;background:rgba(255,255,255,.56);color:#746a64}
    .module-heading-actions{align-self:start;display:grid;justify-items:end;gap:9px;max-width:310px}
    .module-update-privacy{display:flex;align-items:flex-start;gap:8px;padding:9px 10px;border:1px solid #d8cec5;border-radius:12px;background:rgba(255,255,255,.48);font:600 11px/1.35 system-ui;color:#625a55;cursor:pointer}
    .module-update-privacy input{flex:0 0 auto;width:15px;height:15px;margin:0;accent-color:rgb(var(--aura-rgb,216,95,109))}
    .module-grid{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(250px,.75fr);gap:14px;margin-top:20px}
    .module-card{border:1px solid #ddd3ca;background:rgba(255,255,255,.58);border-radius:18px;padding:18px;box-shadow:0 10px 30px rgba(55,42,34,.05)}
    .module-card.wide{grid-column:1/-1}.module-card h2{font:600 18px/1.1 Georgia,serif;margin:0 0 6px}.module-card>p{margin:0 0 14px;font-size:11px;line-height:1.55;color:#766c66}
    .module-form{display:grid;gap:8px}.module-form.two{grid-template-columns:1fr 1fr}.module-form.three{grid-template-columns:1.3fr 1fr .8fr}
    .module-input,.module-textarea,.module-select{width:100%;min-width:0;box-sizing:border-box;border:1px solid #d8cec5;background:rgba(255,255,255,.76);border-radius:11px;padding:10px 11px;font:11px/1.35 system-ui;color:#302b28;outline:none}
    .module-textarea{min-height:230px;resize:vertical;line-height:1.65}
    .module-input:focus,.module-textarea:focus,.module-select:focus{border-color:rgba(var(--aura-rgb,216,95,109),.7);box-shadow:0 0 0 3px rgba(var(--aura-rgb,216,95,109),.10)}
    .module-action{border:0;border-radius:11px;background:rgb(var(--aura-rgb,216,95,109));color:var(--aura-button-ink,#fff);padding:10px 13px;font:700 10px/1 system-ui;cursor:pointer}
    .module-action:disabled{opacity:.45;cursor:not-allowed}.module-action.secondary{background:#2a2725;color:#fff}.module-action.ghost{background:rgba(255,255,255,.65);color:#4f4742;border:1px solid #d8cec5}
    .module-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}
    .module-list{display:grid;gap:8px;margin-top:12px}.module-list-item{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;border:1px solid #dfd6cd;background:rgba(255,255,255,.5);border-radius:13px;padding:11px 12px}.module-list-item b,.module-list-item small{display:block}.module-list-item b{font-size:11px}.module-list-item small{font-size:9px;color:#857b74;margin-top:3px}.module-list-item button{border:0;background:transparent;color:#8b7e76;font-size:10px;cursor:pointer}
    .module-status{min-height:16px;margin-top:7px;font-size:9px;color:#81766f}.module-status.ok{color:#477650}
    .module-orbit{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.module-orbit-row{border:1px solid #ddd3ca;background:rgba(255,255,255,.52);border-radius:14px;padding:11px}.module-orbit-row header{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}.module-orbit-row header b{font-size:11px}.module-orbit-row header span,.module-workspace .module-orbit-row header span{min-width:28px;height:26px;padding:0 7px;border-radius:999px;display:grid;place-items:center;background:#292523;color:#fff!important;font-size:8px;font-weight:800;-webkit-text-fill-color:#fff}
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
    .orbit-quick-link.is-instagram{--accent:#c13584}.orbit-quick-link.is-tiktok{--accent:#0f8f95}.orbit-quick-link.is-pinterest{--accent:#cf4632}.orbit-quick-link.is-facebook{--accent:#1877f2}.orbit-quick-link.is-youtube{--accent:#d0202f}.orbit-quick-link.is-soundcloud{--accent:#e2622a}
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
    #studioApp .biglwa-instagram-preview-tile{display:block;min-width:0;padding:0;border:0;border-radius:10px;overflow:hidden;background:#f28c28;cursor:pointer;aspect-ratio:1/1}
    #studioApp .biglwa-instagram-preview-tile img{display:block;width:100%;height:100%;object-fit:cover;border-radius:10px}
    #studioApp .biglwa-instagram-preview-tile:hover{transform:translateY(-1px);filter:brightness(1.03)}
    #studioApp[data-module-key="archive"] .instagram-archive-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:16px}
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
    /* Archive uses the same visual language as Collective Feed: a responsive
       masonry wall, source-coloured shadow, browser-strip controls, and a live/off state. */
    #studioApp[data-module-key="archive"] .archive-wall-shell{display:block!important;padding:0!important;margin-top:18px}
    #studioApp[data-module-key="archive"] .archive-page-list{
      display:block!important;column-count:5!important;column-width:auto!important;column-gap:18px!important;column-fill:balance;
      margin:0!important
    }
    #studioApp[data-module-key="archive"] .archive-page-list>*{break-inside:avoid;min-width:0;width:100%;margin:0 0 18px}
    @media(max-width:1560px){#studioApp[data-module-key="archive"] .archive-page-list{column-count:4!important}}
    @media(max-width:1180px){#studioApp[data-module-key="archive"] .archive-page-list{column-count:3!important}}
    @media(max-width:820px){#studioApp[data-module-key="archive"] .archive-page-list{column-count:2!important}}
    @media(max-width:520px){#studioApp[data-module-key="archive"] .archive-page-list{column-count:1!important}}
    #studioApp[data-module-key="archive"] .archive-pin{
      --feed-card-rim:#a52a0c;position:relative;min-width:0;overflow:hidden;
      border:1px solid #dfd4ca;border-radius:14px;background:#f1e9e1;display:block;width:100%;
      box-shadow:3px 3px 0 var(--feed-card-rim),0 14px 28px -18px color-mix(in srgb,var(--feed-card-rim) 62%,transparent);
      transition:filter .2s ease,opacity .2s ease,box-shadow .2s ease
    }
    #studioApp[data-module-key="archive"] .archive-pin.is-live{filter:grayscale(1);opacity:.9}
    #studioApp[data-module-key="archive"] .archive-pin.is-archived{filter:none;opacity:1}
    #studioApp[data-module-key="archive"] .archive-pin.is-pending-delete{
      filter:none;opacity:1;background:#d96c67!important;border-color:#bd3f47!important;
      box-shadow:3px 3px 0 #9e3636,0 14px 28px -18px rgba(158,54,54,.55)
    }
    #studioApp[data-module-key="archive"] .archive-browser-strip{
      height:15px;padding:1px 4px!important;gap:3px;box-sizing:border-box;display:flex;align-items:center;
      background:rgba(var(--aura-rgb,216,95,109),.17)!important;border:0!important;
      border-radius:14px 14px 0 0;position:relative;z-index:8
    }
    #studioApp[data-module-key="archive"] .archive-live-badge{
      display:inline-flex;align-items:center;padding:2px 5px;border-radius:999px;
      font:800 6px/1 system-ui;letter-spacing:.08em;text-transform:uppercase;
      color:#3f6b4a;background:rgba(63,107,74,.14);margin-right:auto
    }
    #studioApp[data-module-key="archive"] .archive-live-badge.is-archived{
      color:#6e625b;background:rgba(110,98,91,.13)
    }
    #studioApp[data-module-key="archive"] .archive-live-badge.is-pending{
      color:#fff;background:#bd3f47
    }
    #studioApp[data-module-key="archive"] .archive-browser-actions{display:flex;align-items:center;gap:3px;margin-left:auto}
    #studioApp[data-module-key="archive"] .archive-browser-actions button{
      width:8px!important;height:8px!important;min-width:8px!important;padding:0!important;border:0!important;
      border-radius:50%!important;display:block!important;color:transparent!important;font-size:0!important;
      line-height:0!important;cursor:pointer;box-shadow:none!important
    }
    #studioApp[data-module-key="archive"] .archive-browser-actions [data-archive-delete]{background:#bd3f47}
    #studioApp[data-module-key="archive"] .archive-browser-actions [data-archive-toggle]{background:#d1ad2f}
    #studioApp[data-module-key="archive"] .archive-browser-actions [data-archive-enlarge]{background:#4e8f61}
    #studioApp[data-module-key="archive"] .archive-browser-actions button:disabled{opacity:.48;cursor:default}
    #studioApp[data-module-key="archive"] .archive-media{position:relative;background:#c7c7c7}
    #studioApp[data-module-key="archive"] .archive-pin.is-archived .archive-media{background:#efe7dd}
    #studioApp[data-module-key="archive"] .archive-pin.is-pending-delete .archive-media{background:#d96c67}
    #studioApp[data-module-key="archive"] .archive-media img,#studioApp[data-module-key="archive"] .archive-media video{
      display:block;width:100%;height:auto;max-height:none;aspect-ratio:auto;object-fit:contain;background:inherit
    }
    #studioApp[data-module-key="archive"] .archive-photo-count{
      position:absolute;right:8px;top:8px;z-index:3;padding:3px 8px;border-radius:999px;
      background:rgba(24,16,14,.55);color:#fff;font:700 9px/1.5 system-ui
    }
    #studioApp[data-module-key="archive"] .archive-meta{
      padding:10px 12px 12px;background:#c7c7c7;color:#4f4f4f;
      border-top:1px solid rgba(80,70,64,.12)
    }
    #studioApp[data-module-key="archive"] .archive-pin.is-archived .archive-meta{background:#f28c28;color:#5a321d}
    #studioApp[data-module-key="archive"] .archive-pin.is-pending-delete .archive-meta{background:#d96c67;color:#fff}
    #studioApp[data-module-key="archive"] .archive-meta b{
      display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
      font:700 9px/1.35 system-ui
    }
    #studioApp[data-module-key="archive"] .archive-meta small{
      display:block;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
      color:inherit;opacity:.76;font:600 8px/1.35 system-ui
    }
    #studioApp[data-module-key="archive"] .archive-state-line{
      display:block;margin-top:5px;font:800 7px/1.35 system-ui;letter-spacing:.03em;text-transform:uppercase
    }
    #studioApp[data-module-key="archive"] .archive-delete-warning{color:#fff}
    #studioApp[data-module-key="archive"] .archive-toolbar{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin:0 0 12px}
    #studioApp[data-module-key="archive"] .archive-toolbar-copy{min-width:0}
    #studioApp[data-module-key="archive"] .archive-toolbar-copy h2{margin:0 0 4px}
    #studioApp[data-module-key="archive"] .archive-toolbar-copy p{margin:0;max-width:720px}
    #studioApp[data-module-key="archive"] .archive-toolbar-actions{display:flex;gap:7px;flex-wrap:wrap}
    #studioApp[data-module-key="archive"] .archive-legend{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin:0 0 14px;font:600 9px/1.4 system-ui;color:#6f645c}
    #studioApp[data-module-key="archive"] .archive-legend i{width:13px;height:13px;border-radius:4px;display:inline-block;border:1px solid rgba(80,70,64,.18)}
    #studioApp[data-module-key="archive"] .archive-legend i.is-live{background:#c7c7c7}
    #studioApp[data-module-key="archive"] .archive-legend i.is-archived{background:#f28c28;margin-left:8px}
    #studioApp[data-module-key="archive"] .archive-empty{
      padding:42px 24px;border:1px dashed #d8cec5;border-radius:14px;text-align:center;color:#81766f
    }
    #studioApp[data-module-key="archive"] .archive-pin.archive-src-instagram{--feed-card-rim:#a52a0c}
    #studioApp[data-module-key="archive"] .archive-pin.archive-src-tiktok{--feed-card-rim:#111111}
    #studioApp[data-module-key="archive"] .archive-pin.archive-src-facebook{--feed-card-rim:#1877f2}
    #studioApp[data-module-key="archive"] .archive-pin.archive-src-pinterest{--feed-card-rim:#e60023}
    #studioApp[data-module-key="archive"] .archive-pin.archive-src-youtube{--feed-card-rim:#d0202f}
    #studioApp[data-module-key="archive"] .archive-pin.archive-src-soundcloud{--feed-card-rim:#e2622a}
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
    .module-workspace .module-arcade-folder-depth{--folder-front:#f1c451;position:relative;isolation:isolate;overflow:hidden;margin:0 18px;padding:52px 7px 7px;border:5px solid #150d0b;border-radius:22px 22px 11px 11px;background:linear-gradient(145deg,#a87631 0%,#78491f 74%);clip-path:none;box-shadow:inset 0 0 0 3px rgba(255,255,255,.08),0 8px 0 #120b0a,0 14px 22px rgba(0,0,0,.25)}
    .module-workspace .module-arcade-folder-depth::before{content:"";position:absolute;left:0;top:0;z-index:1;width:58%;height:72px;background:var(--folder-front);clip-path:polygon(0 0,73% 0,86% 73%,100% 73%,100% 100%,0 100%);box-shadow:inset 0 0 0 3px rgba(255,255,255,.18),0 5px 11px rgba(45,23,12,.22)}
    .module-workspace .module-arcade-folder-depth::after{content:"";position:absolute;inset:-24%;z-index:5;pointer-events:none;background:repeating-radial-gradient(circle at 25% 30%,rgba(255,255,255,.38) 0 1px,transparent 1px 4px),repeating-radial-gradient(circle at 75% 65%,rgba(47,9,18,.3) 0 1px,transparent 1px 5px),repeating-linear-gradient(to bottom,rgba(255,255,255,.07) 0 1px,rgba(20,8,7,.1) 2px 3px);opacity:.2;animation:biglwaModuleArcadeStatic .42s steps(2,end) infinite}
    .module-workspace .module-game-stage-head{position:relative;z-index:2;isolation:isolate;overflow:visible;display:block;min-height:126px;margin:0;padding:0;border:0;border-radius:13px 13px 7px 7px;background:var(--folder-front);color:#1c1410;clip-path:none;box-shadow:inset 0 0 0 3px rgba(255,255,255,.2),0 -4px 10px rgba(46,22,11,.22)}
    .module-workspace .module-game-stage-head::before{content:"";position:absolute;inset:0;z-index:3;pointer-events:none;background:radial-gradient(circle,#fff5ad 0 3px,#e8bc4c 3.3px 4.8px,transparent 5.1px) left 9px center/16px 22px repeat-y,radial-gradient(circle,#fff5ad 0 3px,#e8bc4c 3.3px 4.8px,transparent 5.1px) right 9px center/16px 22px repeat-y}
    .module-workspace .module-game-stage-head::after{content:none}
    .module-workspace .module-arcade-marquee{position:absolute;inset:0;z-index:2}.module-workspace .module-arcade-marquee img{position:absolute;display:block;height:auto;max-width:100%;object-fit:contain;object-position:center;margin:0}.module-workspace .module-arcade-marquee img:first-child{left:50%;top:55%;width:min(25%,170px);transform:translate(-50%,-50%)}.module-workspace .module-arcade-marquee img:last-child{top:-39px;right:4%;width:min(40%,276px);mix-blend-mode:normal;filter:drop-shadow(0 4px 3px rgba(28,12,8,.36))}
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
    @media(max-width:560px){.module-workspace .module-arcade-folder-depth{margin-inline:4px;padding:39px 5px 5px}.module-workspace .module-arcade-folder-depth::before{width:58%;height:54px}.module-workspace .module-game-viewport{height:420px;padding:9px;border-width:10px}.module-workspace .module-game-stage-head{min-height:96px;margin:0!important}.module-workspace .module-game-stage-head>span{display:none}.module-workspace .module-arcade-marquee img:first-child{width:min(29%,126px);height:auto!important}.module-workspace .module-arcade-marquee img:last-child{top:-28px;width:min(40%,180px)}}
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
const known = new Set(['create','calendar','orbit','feed','connect','camera','diary','stream','library','archive','closet','trophies','rooms','room','boards','notes','projects','project','games','learn','didyouknow','map','tools','reviews']);
const labels = {create:'Create',calendar:'Calendar',orbit:'Orbit',feed:'Feed',connect:'Connect',camera:'Photobooth',diary:'Diary',stream:'Stream',library:'Library',archive:'Archive',closet:'Closet',trophies:'Trophies',rooms:'The Lounge',room:'The Lounge',boards:'Boards',notes:'Qwiky Note',projects:'Projects',project:'Projects',games:'Games',learn:'Did You Know?',didyouknow:'Did You Know?',map:'Map',tools:'Tools',reviews:'Wallpaper Reviews'};
  const desc = {create:'Start something and send it to the right part of BIGLWA.',calendar:'Your events and deadlines, with Google Calendar managed through Orbit.',orbit:'Connect Instagram, TikTok, and Pinterest, and keep every other profile link in one place as a shareable link list.',feed:'Publish a picture and a caption to the collective feed.',connect:'Invite friends to join BIGLWA.',camera:'A real browser photobooth: start the camera, pose, capture, retake, and save a frame without uploading it.',diary:'A private writing page that autosaves in this browser.',stream:'Plan a screening, talk, radio set, workshop, or live session.',library:'Build a returnable shelf of texts, PDFs, links, cases, and research.',archive:'Record materials worth preserving with enough context to find them again.',closet:'Draft preloved or creative listings and keep a Depop connection path beside them.',trophies:'Keep awards, achievements, athletic results, race finishes, and the links that verify them in one personal trophy case.',rooms:'A shared-space prototype for conversation and working together.',boards:'Create visual/reference boards with names and context.',notes:'A fast private sticky note that autosaves.',projects:'Track projects and collaborative work in progress.',games:'Small culture games and learning interactions.',learn:'A playable Did You Know? deck with answers, score, context, and sources.',map:'Pin places, memories, and projects. Your saved map stays in this browser.',tools:'Drop a file and it works out what to offer: convert video and audio, compress PDFs and images, or hand anything else to a converter online.'};

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

  /* Instagram, TikTok, and Pinterest are connected with real authorization, so they are
     not asked for a hand-pasted login path any more. The rest keep a plain profile link
     because there is nothing to authorize against here. */
  const ORBIT_APPS=[['instagram','IG','Instagram','#c1355a'],['facebook','FB','Facebook','#1877f2'],['tiktok','TT','TikTok','#111111'],['pinterest','P','Pinterest','#e60023'],['soundcloud','SC','SoundCloud','#e2622a'],['youtube','YT','YouTube','#d0202f'],['drive','GD','Google Drive','#0f9d58'],['calendar','GC','Google Calendar','#4285f4'],['goodreads','GR','Goodreads','#7a5c3e'],['letterboxd','LB','Letterboxd','#2c3440'],['imdb','IMDb','IMDb','#e6a800']];
  const ORBIT_CONNECTED=new Set(['instagram','tiktok','pinterest']);
  const ORBIT_APP_NAMES=Object.fromEntries(ORBIT_APPS.map(([k,,n])=>[k,n]));
  /* Each API's chip wears that API's own colour. They were all one black pill, which read as
     a row of dead black dots with unreadable lettering rather than as a list of services.
     The lettering is pinned white on top so it survives the widget colour rules above. */
  const orbitBadge=(g,tint)=>'<span style="background:'+tint+'">'+esc(g)+'</span>';
  const orbitLinks=()=>readJSON('biglwaOrbitLinks',{});
  const orbitConnected=()=>{try{return Object.values(window.__biglwaConnections?.connections?.()||{})}catch{return[]}};
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
  function orbitQuickLinks(){
   const connected=orbitConnected().filter(row=>row&&row.link);
   const saved=Object.entries(orbitLinks()).filter(([k,url])=>url&&!ORBIT_CONNECTED.has(k));
   if(!connected.length&&!saved.length)return '';
   const chip=(href,label,handle,cls)=>'<a class="orbit-quick-link '+(cls||'')+'" href="'+esc(href)+'" target="_blank" rel="noopener noreferrer"><b>'+esc(label)+'</b>'+(handle?'<small>'+esc(handle)+'</small>':'')+'<i aria-hidden="true">↗</i></a>';
   return '<section class="orbit-quick" aria-label="Your links"><h3>Quick links</h3><p>These are the places people can reach you. Anyone viewing your profile sees the same links.</p><div class="orbit-quick-row">'+
    connected.map(row=>chip(row.link,row.label,row.username?'@'+row.username:(row.name||''),'is-connected is-'+row.id)).join('')+
    saved.map(([k,url])=>chip(url,(ORBIT_APP_NAMES[k]||k),'Saved link','is-saved is-'+k)).join('')+
    '</div></section>';
  }
  /* The source clients each own their own connect button, so the Orbit page hands the click
     over rather than reimplementing the OAuth start. */
  const ORBIT_HANDS=()=>{const c=window.__biglwaConnections;if(!c)return false;const map={instagram:window.__biglwaInstagramOrbit,tiktok:window.__biglwaTikTokOrbit,pinterest:window.__biglwaPinterest};return Object.values(map).every(Boolean)};
   function renderOrbitPage(){
    const links=orbitLinks();
    const connected=Object.fromEntries(orbitConnected().map(r=>[r.id,r]));
    body.innerHTML=heading('orbit')+`<div class="module-grid"><section class="module-card wide"><h2>Your orbit</h2><p>Instagram, TikTok, and Pinterest connect with real authorization, so they sign in properly and fill in your profile details for you. Everything else is a link you paste. Calendar syncing lives in Calendar, not Orbit.</p>${orbitQuickLinks()}<div class="module-orbit">${ORBIT_APPS.map(([k,g,n,t])=>{
     if(ORBIT_CONNECTED.has(k)){
      const row=connected[k];
      const stats=[orbitStat('followers','followers',row),orbitStat('posts','mediaCount',row),orbitStat('boards','boards',row)].filter(Boolean).join(' · ');
      return `<div class="module-orbit-row is-oauth" data-orbit-row="${k}"><header><b>${n}</b>${orbitBadge(g,t)}${row?'<em class="orbit-state is-on">Connected</em>':'<em class="orbit-state">Not connected</em>'}</header>`+
       (row?`<div class="orbit-connected-card">${row.avatarUrl?'<img src="'+esc(row.avatarUrl)+'" alt="" width="46" height="46">':''}<span><b>${esc(row.name||row.username||'Connected')}</b>${row.username?'<small>@'+esc(row.username)+'</small>':''}${stats?'<small>'+stats+'</small>':''}</span><a class="orbit-hotlink" href="${esc(row.link)}" target="_blank" rel="noopener noreferrer">Open ↗</a></div>`
        :'<p class="orbit-not-connected">Connect to fill this in and add your public link.</p>')+
       `<div class="module-actions"><button class="module-action" type="button" data-orbit-connect="${k}" ${ORBIT_HANDS()?'':'disabled'}>${row?'Reconnect':'Connect'} ${n}</button>${row?`<button class="module-action ghost" type="button" data-orbit-unlink="${k}">Unlink</button>`:''}</div></div>`;
     }
     return `<div class="module-orbit-row"><header><b>${n}</b>${orbitBadge(g,t)}</header><label class="orbit-field-label">Public profile / page</label><input class="module-input" data-orbit-path="${k}" value="${esc(links[k]||'')}" placeholder="Paste profile URL"><div class="module-actions"><button class="module-action" type="button" data-orbit-save="${k}">Save</button><button class="module-action ghost" type="button" data-orbit-open="${k}" ${links[k]?'':'disabled'}>Open profile</button></div></div>`;
     }).join('')}</div><div class="module-status" id="orbitPageStatus"></div></section></div>`;
    /* Looked up after the markup exists, so the status line is the node that is actually
       on the page rather than one from a previous render. */
    const status=$('#orbitPageStatus',body);
    const say=text=>{if(status){status.textContent=text;status.classList.add('ok')}};
    body.onclick=e=>{
     const connect=e.target.closest('[data-orbit-connect]');
     if(connect){const k=connect.dataset.orbitConnect;const client={instagram:window.__biglwaInstagramOrbit,tiktok:window.__biglwaTikTokOrbit,pinterest:window.__biglwaPinterest}[k];if(client?.connect)client.connect();else say('That connection is still loading. Try again in a moment.');return}
     const unlink=e.target.closest('[data-orbit-unlink]');
     if(unlink){const k=unlink.dataset.orbitUnlink;say('Unlinking…');window.__biglwaConnections?.forget?.(k).then(()=>{say(ORBIT_APP_NAMES[k]+' unlinked.');renderOrbitPage()});return}
     const save=e.target.closest('[data-orbit-save]');
     if(save){const k=save.dataset.orbitSave,url=$('[data-orbit-path="'+k+'"]',body).value.trim(),all=orbitLinks();url?all[k]=url:delete all[k];writeJSON('biglwaOrbitLinks',all);say((ORBIT_APP_NAMES[k]||'Orbit')+' link saved.');renderOrbitPage();return}
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
    const storage=`biglwaDraft_${key}`;
    const title=key==='diary'?`<div class="module-diary-cover-label"><strong>Diary</strong><span>Property of: ${esc(profileUsername())}</span></div>`:'<div class="module-qwiky-label"><strong>Qwiky Note</strong><span>pin it before it floats away</span></div>';
    body.innerHTML=heading(key)+`<div class="module-grid"><section class="module-card wide">${title}<form id="moduleWritingForm" class="module-form"><textarea class="module-textarea ${key==='diary'?'diary-lined':'qwiky-note-input'}" id="moduleWritingArea" name="writing" placeholder="Write here…">${esc(localStorage.getItem(storage)||'')}</textarea><div class="module-actions"><button class="module-action" id="moduleWritingSave" type="submit">Save</button><button class="module-action secondary" id="moduleWritingFeed" type="button">Upload to Collective Feed</button></div><div class="module-status" id="moduleWritingStatus">Private to this browser · autosaves while you write</div></form></section></div>`;
    const form=$('#moduleWritingForm',body),area=$('#moduleWritingArea',body),status=$('#moduleWritingStatus',body);let t;
    const save=(explicit=false)=>{
      localStorage.setItem(storage,area.value);
      status.textContent=explicit?'Saved. Studio preview updated.':'Saved locally.';
      status.classList.add('ok');
      document.dispatchEvent(new CustomEvent('biglwa:writing-saved',{detail:{key,value:area.value}}));
    };
    area.addEventListener('input',()=>{status.textContent='Saving…';status.classList.remove('ok');clearTimeout(t);t=setTimeout(()=>save(false),350)});
    form.addEventListener('submit',event=>{event.preventDefault();clearTimeout(t);save(true)});
    $('#moduleWritingFeed',body).onclick=async()=>{const value=area.value.trim(),status=$('#moduleWritingStatus',body);if(!value){status.textContent='Write something first.';status.classList.remove('ok');return}const button=$('#moduleWritingFeed',body);button.disabled=true;status.textContent='Uploading draft…';try{await window.__biglwaCollectivePublish?.createStudioDraft({source:key,title:key==='diary'?'Diary entry':'Qwiky Note',caption:value});status.textContent='Saved to your account as a private feed draft. Open Collective Feed to choose whether to post it.';status.classList.add('ok')}catch(err){console.error(err);status.textContent=err?.message||'Could not upload this draft.';status.classList.remove('ok')}finally{button.disabled=false}};
  }

  function renderFeed(){
    /* The feed is rendered by feed-view.js: posts live in Firestore under their author
       and may carry a picture, so the old per-device text-only prototype is gone rather
       than left to overwrite the real feed on its next render. The shell stays here so
       the route still has a heading, a composer to upgrade, and the shared list the
       connected sources pour into. */
    body.innerHTML=heading('feed')+`<div id="biglwaOrbitDrafts" hidden></div><div class="module-grid"><section class="module-card"><h2>Post to the feed</h2><p>Share a link with an automatic thumbnail, or add a photo with it. No caption field is stored.</p><form class="module-form" id="feedComposer"><input class="module-input" name="url" type="url" inputmode="url" placeholder="Paste a link"><label class="biglwa-pick" style="width:max-content"><input type="file" id="biglwaFeedPicker" accept="image/jpeg,image/png,image/webp,image/gif">Add a photo <span style="font-weight:500;color:#8b8179">(optional)</span></label><button class="module-action" type="submit">Post to Collective Feed</button></form></section><section class="module-card wide"><h2>Collective Feed</h2><div class="module-list" id="feedPageList"></div></section></div>`;
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

  const TRENDING_ROOMS=[['lounge','The Lounge','BIGLWA home room'],['minecraft','#minecraft','Trending room'],['fortnite','#fortnite','Trending room'],['deadbydaylight','#deadbydaylight','Trending room'],['rocketleague','#rocketleague','Trending room'],['biglwa','#biglwa','Trending room'],['arcade','#arcade','Trending room'],['support','#support','Trending room'],['gov','#gov','Trending room'],['substack','#substack','Trending room']];
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
    import('/tools-studio.js?v=20261005-tools-1')
      .then(mod=>mod.mountToolsStudio($('#toolStudio',body),{downloadBlob}))
      .catch(error=>{
        $('#toolStudio',body).innerHTML='<section class="module-card wide"><h2>Tools could not start</h2><p>Give the page a refresh and it will load again.</p></section>';
        console.error('BIGLWA Tools:',error);
      });
  }


  function renderGames(){
    const gameLibrary=[
      {title:'culture quiz',image:'/assets/culture-quiz-cubes.png',internal:'cultureQuiz'},
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
    const tile=game=>game.internal==='cultureQuiz'
      ?'<button class="module-game-tile module-game-action" type="button" data-play-culture-quiz aria-label="Play Culture Quiz"><img src="'+esc(game.image)+'" alt="" width="320" height="180" loading="lazy" decoding="async"><span>'+esc(game.title)+'</span><small>play ↗</small></button>'
      :'<a class="module-game-tile" href="'+esc(game.href)+'" target="_blank" rel="noopener noreferrer" aria-label="Open '+esc(game.title)+'"><img src="'+esc(game.image)+'" alt="'+esc(game.title)+'" width="320" height="180" loading="lazy" decoding="async"><span>'+esc(game.title)+'</span><small>open ↗</small></a>';
    const track=items=>items.concat(items).map(tile).join('');
    body.innerHTML=heading('games')+
      '<div class="module-grid module-games-grid">'+
        '<section class="module-card module-game-stage wide"><div class="module-arcade-folder-depth"><div class="module-game-stage-head"><div class="module-arcade-marquee" aria-label="BIG LWA Arcade"><img src="/assets/games-lwa-blocks-exact.webp" alt="BIG LWA" width="1200" height="675"><img src="/assets/arcade-wordmark-transparent.png?v=20260917-arcade-depth-15" alt="ARCADE" width="550" height="130"></div><span>animated preview</span></div></div><div class="module-game-viewport" aria-label="Animated arcade library"><div class="module-game-track">'+track(gameLibrary.slice(0,5))+'</div><div class="module-game-track">'+track(gameLibrary.slice(4,10))+'</div><div class="module-game-track">'+track(gameLibrary.slice(9))+'</div></div><div class="module-arcade-controls" aria-hidden="true"><span class="module-arcade-joystick is-yellow"><i></i></span><span class="module-arcade-joystick is-red"><i></i></span><span class="module-arcade-joystick is-green"><i></i></span></div><div class="module-status">External games open in a new tab. Suggestions are saved privately in this browser for review.</div></section>'+
        '<section class="module-card module-culture-quiz wide" id="cultureQuizPanel" hidden><div class="culture-quiz-head"><div><h2>culture quiz</h2><p>Four quick questions about culture, history, and keeping its context.</p></div><button class="module-action ghost" type="button" data-close-culture-quiz>Close</button></div><div id="cultureQuizContent" aria-live="polite"></div></section>'+
        '<section class="module-card module-game-submit"><h2>want to add a game?</h2><p>Suggest a game with a link or game file and an image link or image file. Saved in this browser for review; uploads are not automatically hosted.</p><form class="module-game-form" id="gameSuggestForm">'+
          '<label><span>Game name</span><input class="module-input" name="title" required maxlength="80" placeholder="Game title"></label>'+
          '<div class="module-game-source-grid"><label><span>Game link (optional)</span><input class="module-input" name="gameLink" type="text" inputmode="url" placeholder="https://…"></label><label><span>Or upload game file</span><input class="module-input module-file-input" name="gameFile" type="file" accept=".html,.htm,.zip,.swf,text/html,application/zip,application/x-shockwave-flash"><small>HTML, ZIP, or SWF file</small></label></div>'+
          '<div class="module-game-source-grid"><label><span>Image link (optional)</span><input class="module-input" name="imageLink" type="text" inputmode="url" placeholder="https://…"></label><label><span>Or upload image file</span><input class="module-input module-file-input" name="imageFile" type="file" accept="image/*"><small>PNG, JPG, GIF, or WebP</small></label></div>'+
          '<div class="module-game-submit-row"><button class="module-action" type="submit">Save suggestion</button><img class="module-game-image-preview" id="gameSuggestImagePreview" alt="Selected cover preview" hidden><div class="module-status" id="gameSuggestStatus" aria-live="polite"></div></div>'+
        '</form></section>'+
      '</div>';

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
    $$('[data-play-culture-quiz]',body).forEach(button=>button.addEventListener('click',()=>{
      cultureIndex=0;cultureScore=0;drawCultureQuestion();culturePanel.hidden=false;
      culturePanel.scrollIntoView({behavior:'smooth',block:'center'});
    }));
    $('[data-close-culture-quiz]',culturePanel).onclick=()=>{culturePanel.hidden=true};
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
      else if(value){imagePreview.src=value;imagePreview.hidden=false}
      else{imagePreview.hidden=true;imagePreview.removeAttribute('src')}
    };
    imageFileInput.onchange=updateImagePreview;
    imageLinkInput.oninput=updateImagePreview;
    imagePreview.onerror=()=>{if(!previewObjectUrl)imagePreview.hidden=true};
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
  function archiveSourceRim(source){
    return ({
      instagram:"#a52a0c",
      tiktok:"#111111",
      facebook:"#1877f2",
      pinterest:"#e60023",
      youtube:"#d0202f",
      soundcloud:"#e2622a"
    })[String(source||"").toLowerCase()]||"#a52a0c";
  }
  function archiveMediaPieces(item){
    if(Array.isArray(item.mediaItems)&&item.mediaItems.length)return item.mediaItems.filter(piece=>piece&&piece.url);
    if(Array.isArray(item.imageUrls)&&item.imageUrls.length)return item.imageUrls.filter(Boolean).map((url,i)=>({
      index:i,url,thumbnailUrl:url,mediaType:item.mediaType||"IMAGE"
    }));
    return item.imageUrl?[{index:0,url:item.imageUrl,thumbnailUrl:item.imageUrl,mediaType:item.mediaType||"IMAGE"}]:[];
  }
  function archiveOpenImage(url){
    if(!url)return;
    try{window.open(url,"_blank","noopener,noreferrer");}catch{}
  }
  function renderArchive(){
    const orbit=window.__biglwaInstagramOrbit;
    const postsApi=window.__biglwaOrbitPosts;
    const previewMode=document.documentElement.classList.contains('biglwa-preview-mode');
    const previewUsername=(()=>{try{return decodeURIComponent(location.pathname.replace(/^\/+|\/+$/g,''))}catch{return ''}})();
    const draw=async()=>{
      const owner=!previewMode;
      let media=[],settings={visibility:'private',friends:[]},profile=orbit?.state?.profile||{},status='';
      try{
        if(owner){
          settings=await postsApi?.getArchiveSettings?.()||settings;
          media=await postsApi?.loadArchive?.()||[];
          profile=orbit?.state?.profile||profile;
        }else{
          const publicProfile=await window.BigLWAUserDirectory?.loadPublicProfile?.(previewUsername);
          settings={visibility:publicProfile?.archiveVisibility||'private',friends:[]};
          if(settings.visibility!=='friends'){
            body.innerHTML=heading('archive')+'<div class="module-grid"><section class="module-card wide"><h2>Archive</h2><p>This Archive is private. The owner has not made it viewable to friends.</p></section></div>';
            return;
          }
          media=await window.BigLWAUserDirectory?.loadArchiveForUsername?.(previewUsername)||[];
          profile=publicProfile||profile;
          if(!media.length)status='This friend has not shared any archived content yet.';
        }
      }catch(error){
        console.error('BIGLWA Archive:',error);
        status=error?.message||'The Archive could not be loaded.';
      }
      const username=profile.username||profile.name||previewUsername||'BIGLWA member';
      const cards=media.map((item,index)=>{
        const pieces=archiveMediaPieces(item);
        const first=pieces[0]?.url||'';
        const caption=String(item.caption||'').trim();
        const date=item.sourceCreatedAt?new Date(item.sourceCreatedAt).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'}):'';
        const state=archiveStateFor(item);
        const live=state==='collective';
        const pending=state==='pending_delete';
        const archived=state==='archived';
        const source=String(item.source||'instagram').toLowerCase();
        const rim=archiveSourceRim(source);
        const imageMarkup=first
          ? ((String(pieces[0]?.mediaType||'').toUpperCase()==='VIDEO')
              ? '<video src="'+esc(first)+'" poster="'+esc(pieces[0]?.thumbnailUrl||'')+'" muted playsinline preload="metadata" controls></video>'
              : '<img src="'+esc(first)+'" alt="Archived media '+(index+1)+'" loading="lazy" decoding="async">')
          : '<div class="biglwa-pin-empty"><small>Media unavailable</small></div>';
        const count=pieces.length>1?'<span class="archive-photo-count">'+pieces.length+' photos</span>':'';
        const stateBadge=pending
          ? '<span class="archive-live-badge is-pending">DELETING</span>'
          : live
            ? '<span class="archive-live-badge">LIVE</span>'
            : '<span class="archive-live-badge is-archived">ARCHIVED</span>';
        const actions=owner
          ? '<div class="archive-browser-actions" aria-label="Archive post actions">'+
            '<button type="button" data-archive-delete aria-label="Delete this post" title="Delete"></button>'+
            '<button type="button" data-archive-toggle aria-label="'+esc(live?'Turn live off and archive this post':'Turn live on and publish this post')+'" title="'+esc(live?'Archive':'Make live')+'" '+(pending?'disabled':'')+'></button>'+
            '<button type="button" data-archive-enlarge aria-label="Open this photo" title="Open this photo"></button>'+
            '</div>'
          : '';
        const metaLine=live
          ? '<small class="archive-state-line">LIVE · currently on Collective Feed</small>'
          : archived
            ? '<small class="archive-state-line">ARCHIVED · off Collective Feed</small>'
            : pending
              ? '<small class="archive-state-line archive-delete-warning">⚠ '+esc(deletionCountdownText(item.deletionAt))+'</small>'
              : '<small class="archive-state-line">Saved</small>';
        return '<article class="archive-pin biglwa-pin-post is-'+esc(state.replace(/_/g,'-'))+' archive-src-'+esc(source)+'" style="--feed-card-rim:'+rim+'" data-archive-id="'+esc(item.id)+'" data-archive-url="'+esc(first)+'">'+
          '<div class="biglwa-instagram-browser-strip archive-browser-strip">'+stateBadge+actions+'</div>'+
          '<div class="archive-media">'+imageMarkup+count+'</div>'+
          '<div class="archive-meta"><b>'+esc(caption?caption.split('\n')[0].slice(0,70):(source==='instagram'?'Instagram photo':source))+'</b>'+
          '<small>'+esc(caption||('@'+username)+(date?' · '+date:''))+'</small>'+metaLine+'</div>'+
          '</article>';
      }).join('');
      const count=media.length;
      const visibility=owner
        ? '<section class="module-card wide archive-visibility-card"><h2>Archive visibility</h2><p>Your Archive is private to you by default. Friends can only see it when you turn this on and add their BIGLWA username.</p>'+
          '<div class="archive-visibility-row"><label><span>Who can view this Archive?</span><select class="module-select" id="archiveVisibility"><option value="private" '+(settings.visibility==='private'?'selected':'')+'>Only me</option><option value="friends" '+(settings.visibility==='friends'?'selected':'')+'>Friends</option></select></label></div>'+
          '<div class="archive-friend-add"><input class="module-input" id="archiveFriendUsername" placeholder="@username"><button class="module-action" id="archiveAddFriend" type="button">Add friend</button><button class="module-action ghost" id="archiveRemoveFriend" type="button">Remove</button></div>'+
          '<div class="module-status" id="archiveFriendStatus">'+(settings.visibility==='friends'?(settings.friends?.length||0)+' friend access slot(s) enabled.':'Archive is private.')+'</div></section>'
        : '';
      body.innerHTML=heading('archive',count?count+' photo'+(count===1?'':'s'):'')+
        '<div class="module-grid">'+
        '<section class="module-card wide archive-wall-shell">'+
          '<div class="archive-toolbar"><div class="archive-toolbar-copy"><h2>Archive</h2><p>Everything saved to your account lives here. <strong>LIVE</strong> means it is still on Collective Feed. Yellow switches it off and archives it.</p></div>'+
          (owner?'<div class="archive-toolbar-actions"><button class="module-action ghost" id="archiveOrbit" type="button">Manage Instagram connection</button><button class="module-action" id="archiveRefreshInstagram" type="button">Import / refresh</button></div>':'')+
          '</div>'+
          '<div class="module-status" id="archiveInstagramStatus">'+esc(status||(owner?(orbit?.state?.connected?'Imported from @'+username+'.':'Connect Instagram in Orbit, then import your archive.'):'Shared with friends.'))+'</div>'+
          '<p class="archive-legend"><i class="is-live"></i>LIVE · on Collective Feed<i class="is-archived"></i>ARCHIVED · off Collective Feed</p>'+
          (cards?'<div class="archive-page-list" id="archivePageList">'+cards+'</div>':'<div class="archive-empty">No media has been imported yet.</div>')+
        '</section>'+visibility+'</div>';
      if(owner){
        $('#archiveOrbit',body)?.addEventListener('click',()=>openModule('orbit'));
        $('#archiveRefreshInstagram',body)?.addEventListener('click',async()=>{
          const button=$('#archiveRefreshInstagram',body),st=$('#archiveInstagramStatus',body);
          button.disabled=true;if(st)st.textContent='Refreshing Instagram into your Archive + Collective Feed…';
          try{await orbit?.restore?.();await draw()}catch(error){if(st)st.textContent=error?.message||'Instagram could not be refreshed.'}finally{button.disabled=false}
        });
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
        $('#archivePageList',body)?.addEventListener('click',async(event)=>{
          const deleteButton=event.target.closest('[data-archive-delete]');
          const toggleButton=event.target.closest('[data-archive-toggle]');
          const enlargeButton=event.target.closest('[data-archive-enlarge]');
          const card=event.target.closest('[data-archive-id]');
          if(!card)return;
          const id=card.dataset.archiveId;
          if(enlargeButton){
            archiveOpenImage(card.dataset.archiveUrl);
            return;
          }
          if(toggleButton){
            toggleButton.disabled=true;
            try{
              const current=archiveStateFor(media.find(row=>row.id===id)||{});
              if(current==='collective') await postsApi?.archiveOrbitPost?.(id);
              else await postsApi?.publishOrbitPost?.(id);
              await draw();
            }catch(error){
              toggleButton.disabled=false;
              const st=$('#archiveInstagramStatus',body);
              if(st)st.textContent=error?.message||'That post could not be updated.';
            }
            return;
          }
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
    body.innerHTML=heading('map')+`<style>#biglwaMapApp{width:100%;height:820px;border:0;border-radius:16px;background:#f6f0e9}@media(max-width:760px){#biglwaMapApp{height:1250px}}</style><iframe id="biglwaMapApp" src="/map-app.html?v=20260918-safety-notice-2&embed=1" title="BIGLWA interactive map and saved pins" allow="geolocation 'self'; fullscreen" allowfullscreen></iframe>`;
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

  function renderCreate(){const mods=['calendar','feed','projects','trophies','camera','diary','boards','closet','archive','stream','map','orbit'];body.innerHTML=heading('create')+`<div class="module-grid"><section class="module-card wide"><h2>Choose where this belongs</h2><div class="module-launchers">${mods.map(k=>`<button class="module-launcher" type="button" data-module-launch="${k}"><b>${labels[k]}</b><small>${desc[k]}</small></button>`).join('')}</div></section></div>`;body.onclick=e=>{const b=e.target.closest('[data-module-launch]');if(b)openModule(b.dataset.moduleLaunch)}};

  let activeModuleKey='';
  function openModule(rawKey, context='', push=true){
    stopCamera();let key=(rawKey||'').toLowerCase();if(key==='room')key='rooms';if(key==='project')key='projects';if(key==='didyouknow')key='learn';if(!known.has(key))key='create';activeModuleKey=key;workspace.dataset.moduleKey=key;main.classList.add('module-view');workspace.hidden=false;routeName.textContent=labels[key]||key;
    if(key==='calendar')renderCalendar();else if(key==='orbit')renderOrbitPage();else if(key==='diary'||key==='notes')renderWriting(key);else if(key==='feed')renderFeed();else if(key==='connect')renderConnect();else if(key==='camera')renderCamera();else if(key==='rooms')renderRoom();else if(key==='tools')renderTools();else if(key==='games')renderGames();else if(key==='learn')renderLearn();else if(key==='closet')renderCloset();else if(key==='archive')renderArchive();else if(key==='trophies')renderTrophies();else if(key==='map')renderMap();else if(key==='reviews')renderReviews();else if(key==='create')renderCreate();else if(key==='library')renderCollection('library',[{name:'title',placeholder:'Resource title'},{name:'detail',placeholder:'URL, author, or collection'}],[]);else if(key==='boards')renderCollection('boards',[{name:'title',placeholder:'Board name'},{name:'detail',placeholder:'What belongs here?'}],[{title:'My Inspiration',meta:'visual references'}]);else if(key==='projects')renderCollection('projects',[{name:'title',placeholder:'Project name'},{name:'detail',placeholder:'Status · collaborators · next step'}],[]);else if(key==='stream')renderCollection('stream',[{name:'title',placeholder:'Broadcast title'},{name:'detail',placeholder:'Date · time · format'}]);document.dispatchEvent(new CustomEvent('biglwa:module-open',{detail:{key}}));window.scrollTo({top:0,behavior:'instant'});if(push){try{history.pushState({biglwaModule:key},'',`/studio/${encodeURIComponent(key)}`)}catch{}}
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

  function closeModule(push=true){stopCamera();if(activeMap){try{activeMap.remove()}catch{}activeMap=null}activeModuleKey='';delete workspace.dataset.moduleKey;main.classList.remove('module-view');workspace.hidden=true;body.innerHTML='';routeName.textContent='Module';document.dispatchEvent(new CustomEvent('biglwa:module-close'));if(push){try{history.pushState({},'', '/studio')}catch{}}}
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
  function syncWritingPreviews(){
    const noteCard=$('#notes'),notePaper=noteCard&&$('.note-paper',noteCard),note=writingPreviewValue('notes');
    if(notePaper){
      if(notePaper._biglwaPlaceholderHTML===undefined)notePaper._biglwaPlaceholderHTML=notePaper.innerHTML;
      notePaper.classList.toggle('has-saved-writing',!!note);
      if(note){
        const savedAt=new Date().toLocaleDateString(undefined,{month:'short',day:'numeric'});
        notePaper.innerHTML='<p class="studio-writing-preview-text">'+esc(note)+'</p><span class="studio-writing-preview-meta">saved '+esc(savedAt)+'</span>';
        notePaper.setAttribute('aria-label','Qwiky Note preview: '+note.slice(0,120));
      }else{
        notePaper.innerHTML=notePaper._biglwaPlaceholderHTML||'';
        notePaper.setAttribute('aria-label','Open Qwiky Note');
      }
    }
    const diaryCard=$('#diary'),diaryPage=diaryCard&&$('.diary-page',diaryCard),diary=writingPreviewValue('diary');
    if(diaryPage){
      if(diaryPage._biglwaPlaceholderHTML===undefined)diaryPage._biglwaPlaceholderHTML=diaryPage.innerHTML;
      diaryPage.classList.toggle('has-saved-writing',!!diary);
      if(diary){
        const savedAt=new Date().toLocaleDateString(undefined,{month:'short',day:'numeric'});
        diaryPage.innerHTML='<div class="studio-diary-preview"><small>latest entry · '+esc(savedAt)+'</small><p>'+esc(diary)+'</p></div>';
        diaryPage.setAttribute('aria-label','Diary preview: '+diary.slice(0,120));
      }else{
        diaryPage.innerHTML=diaryPage._biglwaPlaceholderHTML||'';
        diaryPage.setAttribute('aria-label','Open diary');
      }
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
      slot=document.createElement('div');slot.className='studio-map-preview-slot';slot.setAttribute('aria-live','polite');
      const oldVisual=$('.studio-map-visual',mapCard),cta=$('.card-cta',mapCard);
      if(oldVisual)oldVisual.replaceWith(slot);else if(cta)mapCard.insertBefore(slot,cta);else mapCard.appendChild(slot);
    }
    const pins=readMapPreviewPins();
    if(!pins.length){
      slot.innerHTML='<div class="studio-map-visual" role="img" aria-label="Map placeholder until you save a pinned spot"></div>';
      return;
    }
    const visible=pins.slice(0,3);
    const rows=visible.map(pin=>{
      const title=pin.title||pin.placeName||'Pinned spot';
      const meta=pin.area||pin.address||pin.placeType||pin.category||'Saved place';
      return '<div class="studio-map-pin-row"><span class="studio-map-pin-dot" aria-hidden="true"></span><div class="studio-map-pin-copy"><b>'+esc(title)+'</b><small>'+esc(meta)+'</small></div></div>';
    }).join('');
    const more=pins.length>visible.length?'<div class="studio-map-more">+'+(pins.length-visible.length)+' more pinned spot'+(pins.length-visible.length===1?'':'s')+'</div>':'';
    slot.innerHTML='<div class="studio-map-pins-preview"><div class="studio-map-pins-tab"><span>Pinned Spots</span><b>'+pins.length+'</b></div><div class="studio-map-pins-list">'+rows+'</div>'+more+'</div>';
  }

  function enhanceStudioCards(){
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
    function syncInstagramFeedPreview(feedCard){
      if(!feedCard)return;
      const hero=$('#biglwaFeedHero',feedCard);
      if(!hero)return;
      const state=window.__biglwaInstagramOrbit?.state;
      const live=Array.isArray(state?.media)?state.media:[];
      const archiveLoader=window.__biglwaOrbitPosts?.loadArchive;
      const draw=(records)=>{
        const pieces=[];
        (Array.isArray(records)?records:[]).forEach(item=>{
          const children=Array.isArray(item?.children?.data)?item.children.data.filter(x=>x&&(x.media_url||x.thumbnail_url)):[];
          if(children.length) pieces.push(...children.map(x=>({url:x.media_url||x.thumbnail_url,type:x.media_type||item.media_type})));
          else if(item?.media_url||item?.thumbnail_url) pieces.push({url:item.media_url||item.thumbnail_url,type:item.media_type});
        });
        const four=pieces.filter(x=>x.url).slice(0,4);
        if(!four.length)return;
        hero.hidden=false;
        hero.classList.add('biglwa-instagram-feed-preview');
        hero.setAttribute('aria-label','Four latest Instagram photos from connected account');
        hero.innerHTML=four.map((item,i)=>'<button type="button" class="biglwa-instagram-preview-tile" data-open="archive" aria-label="Open Instagram Archive"><img src="'+esc(item.url)+'" alt="Instagram photo '+(i+1)+'" loading="lazy" decoding="async"></button>').join('');
      };
      if(live.length){draw(live);return;}
      if(typeof archiveLoader==='function'){
        archiveLoader().then(records=>draw(records)).catch(()=>{});
      }
    }

    const feedCard=$('#feed');
    if(feedCard){
      feedCard.dataset.widgetRoute='feed';
      let hero=$('#biglwaFeedHero',feedCard);
      if(!hero){
        hero=document.createElement('div');
        hero.id='biglwaFeedHero';
        hero.className='biglwa-feed-hero';
        hero.setAttribute('aria-label','Four latest Collective Feed posts');
        const cta=$('.card-cta',feedCard);
        if(cta)feedCard.insertBefore(hero,cta);else feedCard.appendChild(hero);
      }
      hero.setAttribute('aria-label','Four latest Collective Feed post thumbnails');
      if(window.__biglwaFeed?.refresh){setTimeout(()=>window.__biglwaFeed.refresh(),0)}
      syncInstagramFeedPreview(feedCard);
      window.addEventListener('biglwa:instagram-restored',()=>syncInstagramFeedPreview(feedCard),{once:true});
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

  document.addEventListener('click',e=>{if(e.target.closest('#moduleWorkspace'))return;const directory=e.target.closest('.hero-action-bar a[href^="#"]');const mobile=e.target.closest('#mobileCreate');const trigger=e.target.closest('[data-open],.arrow-btn');if(!directory&&!mobile&&!trigger)return;let key=mobile?'create':directory?(directory.getAttribute('href')||'').replace(/^#/,''):trigger.dataset.open;if(key==='home'){e.preventDefault();e.stopImmediatePropagation();closeModule();window.scrollTo({top:0,behavior:'smooth'});return}if(key==='desk')key='create';const card=trigger?.closest('.card');const cardKey=card?.id;if(!known.has(String(key||'').toLowerCase())&&cardKey)key=cardKey;if(!key&&cardKey)key=cardKey;if(!key||!known.has(String(key).toLowerCase()))return;e.preventDefault();e.stopImmediatePropagation();openModule(key,trigger?.dataset.open||'')},true);
  const cleanStudioModulePath=()=>{try{const parts=location.pathname.replace(/^\/+|\/+$/g,'').split('/').filter(Boolean).map(x=>decodeURIComponent(x).toLowerCase());if(parts[0]!=='studio'||parts.length!==2)return '';return known.has(parts[1])?parts[1]:''}catch{return ''}};
  const routeViewFromUrl=()=>{const legacy=new URLSearchParams(location.search).get('view');return legacy&&known.has(legacy.toLowerCase())?legacy.toLowerCase():cleanStudioModulePath()};
  const canonicalizeLegacyView=()=>{const legacy=new URLSearchParams(location.search).get('view');if(!legacy||!known.has(legacy.toLowerCase()))return;try{history.replaceState({biglwaModule:legacy.toLowerCase()},'',`/studio/${encodeURIComponent(legacy.toLowerCase())}`)}catch{}};
  window.addEventListener('popstate',()=>{const v=routeViewFromUrl();if(v)openModule(v,'',false);else closeModule(false)});
  canonicalizeLegacyView();
  const initialView=routeViewFromUrl();if(initialView)setTimeout(()=>openModule(initialView,'',false),80);
})();
