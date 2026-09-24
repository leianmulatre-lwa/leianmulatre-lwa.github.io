(()=>{
  const V='20260910-widget-drag-reset-v3';
  const DOCKED_WIDGET_KEY='biglwaDockedWidgetsV3';
  const NAV_SHORTCUT_KEY='biglwaSidebarShortcutsV3';
  const SHORTCUT_LIMIT=8;
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];

  function readWidgetShortcuts(){
    try{
      const saved=JSON.parse(localStorage.getItem(DOCKED_WIDGET_KEY)||'null');
      if(Array.isArray(saved))return [...new Set(saved.map(String).filter(Boolean))];
      return [];
    }catch{return[]}
  }
  function writeWidgetShortcuts(items){
    const next=[...new Set((items||[]).map(String).filter(Boolean))];
    try{localStorage.setItem(DOCKED_WIDGET_KEY,JSON.stringify(next))}catch{}
    return next;
  }
  function readNavigationShortcuts(fallback=[]){
    try{
      const saved=JSON.parse(localStorage.getItem(NAV_SHORTCUT_KEY)||'null');
      if(Array.isArray(saved))return [...new Set(saved.map(String).filter(key=>key&&key!=='create'))].slice(0,SHORTCUT_LIMIT);
    }catch{}
    return [...new Set(fallback.map(String).filter(key=>key&&key!=='create'))].slice(0,SHORTCUT_LIMIT);
  }
  function writeNavigationShortcuts(items){
    const next=[...new Set((items||[]).map(String).filter(key=>key&&key!=='create'))].slice(0,SHORTCUT_LIMIT);
    try{localStorage.setItem(NAV_SHORTCUT_KEY,JSON.stringify(next))}catch{}
    return next;
  }

  function ensureStyles(){
    let style=$('#biglwa-ui-coherence-style');
    if(!style){style=document.createElement('style');style.id='biglwa-ui-coherence-style';document.head.appendChild(style)}
    style.textContent=`
      #studioApp .widget-drag-handle{position:absolute!important;top:13px!important;left:50%!important;z-index:20!important;display:grid!important;place-items:center!important;width:23px!important;height:18px!important;margin:0!important;padding:0!important;border:0!important;border-radius:6px!important;background:rgba(55,47,43,.10)!important;color:var(--widget-muted,#746e68)!important;cursor:grab!important;touch-action:none!important;line-height:1!important;transform:translateX(-50%)!important}
      #studioApp .widget-drag-handle:active{cursor:grabbing!important}
      #studioApp .widget-drag-handle svg{width:12px!important;height:12px!important;display:block!important}
      #studioApp .widget-drag-handle:focus-visible{outline:2px solid rgb(var(--aura-rgb,216,95,109));outline-offset:2px}
      #studioApp .topbar{grid-template-columns:minmax(150px,180px) minmax(360px,1fr) minmax(250px,350px)!important;gap:14px!important;align-items:center!important}
      #studioApp .topbar::before{content:none!important;display:none!important}
      #studioApp .studio-brand-row{display:flex!important;grid-column:1!important;align-items:center!important;justify-content:flex-start!important;min-width:0!important;width:100%!important;height:100%!important}
      #studioApp .studio-brand-row>a.brand.biglwa-block-brand{display:flex!important;align-items:center!important;justify-content:flex-start!important;width:124px!important;height:70px!important;min-width:124px!important;margin-left:-22px!important;font-size:0!important;color:#171514!important;text-shadow:none!important;overflow:visible!important;text-decoration:none!important}
      #studioApp .studio-brand-row>a.brand.biglwa-block-brand .biglwa-topbar-crest{display:block!important;width:115px!important;height:66px!important;flex:0 0 115px!important;color:#171514!important}
      body.night-mode #studioApp .studio-brand-row>a.brand.biglwa-block-brand .biglwa-topbar-crest{color:#fff6ec!important}
      #studioApp .studio-brand-row>a.brand.biglwa-block-brand::before,#studioApp .studio-brand-row>a.brand.biglwa-block-brand::after{content:none!important;display:none!important}
      #studioApp .biglwa-top-block-logo{display:none!important}
      #studioApp .search-wrap{grid-column:2!important;max-width:none!important;width:100%!important;justify-self:stretch!important}
      #studioApp .top-actions{grid-column:3!important}
      #studioApp .profile-card{visibility:visible!important;opacity:1!important}
      #studioApp .profile-avatar{border-radius:14px!important}
      #studioApp .profile-copy>.eyebrow{display:none!important}
      #studioApp .profile-card{position:absolute!important;grid-template-columns:132px minmax(0,1fr)!important;align-items:center!important;min-height:232px!important;height:auto!important;padding:24px 26px!important}
      #studioApp .profile-card .profile-copy{grid-column:2!important;grid-row:1!important;align-self:center!important;padding-right:118px!important}
      #studioApp .profile-card .profile-display-name{margin:0 0 1px!important;font-family:"CS Bergamot Stitched",Georgia,"Times New Roman",serif!important;font-size:25px!important;line-height:1.05!important}
      #studioApp .profile-card .profile-name-line h1{font-family:"CS Bergamot Stitched",Georgia,"Times New Roman",serif!important;font-size:18px!important;letter-spacing:.01em!important;font-weight:400!important}
      #studioApp .profile-card #editProfileBtn{position:absolute!important;top:20px!important;right:22px!important;width:auto!important;min-width:0!important;padding:8px 13px!important;font-size:12px!important;line-height:1!important}
      #studioApp .profile-card>.widget-window-controls{position:absolute!important;right:22px!important;bottom:18px!important;margin:0!important}
      #studioApp .profile-card .bio{margin-top:10px!important}
      #studioApp .profile-card{width:min(700px,calc(100% - 340px))!important;height:250px!important;min-height:250px!important;max-height:250px!important;bottom:auto!important;padding:28px 30px!important;grid-template-columns:118px minmax(0,1fr)!important;gap:26px!important;border-radius:22px!important;background:linear-gradient(135deg,rgba(255,252,247,.94),rgba(247,238,233,.90))!important;border:1px solid rgba(255,255,255,.74)!important;box-shadow:0 20px 55px rgba(54,35,30,.14)!important;overflow:hidden!important}
      #studioApp .profile-card .profile-avatar{width:118px!important;height:118px!important;border-radius:18px!important;font-family:Georgia,"Times New Roman",serif!important;font-size:54px!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.16)!important}
      #studioApp .profile-card .profile-copy{display:block!important;padding-right:100px!important;font-family:Inter,ui-sans-serif,system-ui,sans-serif!important}
      #studioApp .profile-card .profile-display-name{font-family:Inter,ui-sans-serif,system-ui,sans-serif!important;font-size:27px!important;line-height:1.08!important;font-weight:760!important;letter-spacing:-.8px!important;margin:0 0 2px!important}
      #studioApp .profile-card .profile-name-line{gap:6px!important;margin-bottom:12px!important}
      #studioApp .profile-card .profile-name-line h1{font-family:Inter,ui-sans-serif,system-ui,sans-serif!important;font-size:14px!important;line-height:1.2!important;font-weight:600!important;letter-spacing:.1px!important;color:var(--widget-muted,#6e6962)!important}
      #studioApp .profile-card .verified{width:16px!important;height:16px!important;font-size:10px!important}
      #studioApp .profile-card .bio{font-family:Inter,ui-sans-serif,system-ui,sans-serif!important;font-size:14px!important;line-height:1.48!important;max-width:430px!important;color:var(--widget-ink,#272321)!important;margin:0 0 12px!important}
      #studioApp .profile-card .meta-row{font-size:11px!important;color:var(--widget-muted,#746c66)!important;gap:14px!important;margin-bottom:10px!important}
      #studioApp .profile-card .meta-row a{color:rgb(var(--aura-rgb,216,95,109))!important}
      #studioApp .profile-card .stats{font-size:11px!important;gap:18px!important;margin:0!important;color:var(--widget-muted,#746c66)!important}
      #studioApp .profile-card .stats b{font-size:13px!important;color:var(--widget-ink,#272321)!important}
      #studioApp .profile-card .real-rank{position:absolute!important;left:174px!important;right:30px!important;bottom:24px!important;max-width:none!important;margin:0!important;padding-top:11px!important;border-top:1px solid rgba(80,65,58,.11)!important;grid-template-columns:auto auto minmax(80px,1fr) auto!important}
      #studioApp .profile-card #editProfileBtn{background:rgba(255,255,255,.52)!important;color:var(--widget-ink,#272321)!important;border:1px solid rgba(65,54,49,.18)!important;box-shadow:none!important;font-weight:650!important;letter-spacing:.1px!important}
      #studioApp .profile-card #editProfileBtn:hover{background:rgba(255,255,255,.88)!important;box-shadow:0 6px 16px rgba(50,37,32,.08)!important}
      #studioApp .profile-card>.widget-window-controls{left:30px!important;right:auto!important;bottom:24px!important}
      @media(max-width:900px){#studioApp .profile-card{width:auto!important;right:14px!important;height:auto!important;min-height:285px!important;max-height:none!important;grid-template-columns:86px minmax(0,1fr)!important;padding:22px!important;gap:18px!important}#studioApp .profile-card .profile-avatar{width:86px!important;height:86px!important;font-size:40px!important}#studioApp .profile-card .profile-copy{padding-right:0!important}#studioApp .profile-card .real-rank{left:22px!important;right:22px!important;bottom:24px!important}#studioApp .profile-card>.widget-window-controls{display:none!important}#studioApp .hero{min-height:560px!important}#studioApp .music-card{left:14px!important;right:14px!important;top:370px!important;width:auto!important}#studioApp .aura-card{left:14px!important;top:370px!important}}
      /* Reference-led identity dashboard */
      #studioApp .profile-card{left:22px!important;top:22px!important;width:min(880px,calc(100% - 330px))!important;height:270px!important;min-height:270px!important;max-height:270px!important;padding:0!important;display:grid!important;grid-template-columns:132px minmax(0,1fr)!important;gap:0!important;align-items:stretch!important;border-radius:18px!important;overflow:hidden!important}
      #studioApp .profile-card .profile-identity-rail{grid-column:1!important;grid-row:1!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:14px!important;padding:22px 16px!important;border-right:1px solid rgba(62,50,45,.13)!important;background:rgba(255,255,255,.20)!important}
      #studioApp .profile-card .profile-avatar{width:96px!important;height:96px!important;border-radius:18px!important;font-size:48px!important}
      #studioApp .profile-card .profile-rail-location{font-family:Inter,ui-sans-serif,system-ui,sans-serif!important;font-size:9px!important;line-height:1.3!important;text-align:center!important;color:var(--widget-muted,#706963)!important}
      #studioApp .profile-card .profile-copy{grid-column:2!important;grid-row:1!important;display:block!important;align-self:stretch!important;padding:24px 24px 58px 24px!important;font-family:Inter,ui-sans-serif,system-ui,sans-serif!important}
      #studioApp .profile-card .profile-display-name{font-family:Inter,ui-sans-serif,system-ui,sans-serif!important;font-size:9px!important;line-height:1.2!important;font-weight:650!important;letter-spacing:1.8px!important;text-transform:uppercase!important;color:var(--widget-muted,#756d67)!important;margin:0 0 4px!important}
      #studioApp .profile-card .profile-name-line{margin:0 0 8px!important}
      #studioApp .profile-card .profile-name-line h1{font-family:Georgia,"Times New Roman",serif!important;font-size:29px!important;line-height:1!important;font-weight:700!important;letter-spacing:-1px!important;color:var(--widget-ink,#171717)!important}
      #studioApp .profile-card .bio{font-family:Georgia,"Times New Roman",serif!important;font-size:13px!important;line-height:1.38!important;max-width:510px!important;margin:0 0 7px!important;color:var(--widget-ink,#2c2825)!important}
      #studioApp .profile-card .meta-row{margin:0 0 13px!important;font-size:10px!important}
      #studioApp .profile-card .meta-row>span{display:none!important}
      #studioApp .profile-card .stats{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:0!important;margin:0!important;padding-top:11px!important;border-top:1px solid rgba(62,50,45,.11)!important}
      #studioApp .profile-card .stats span{display:flex!important;flex-direction:column!important;gap:2px!important;padding-right:16px!important;border-right:1px solid rgba(62,50,45,.10)!important;font-family:Georgia,"Times New Roman",serif!important;font-size:10px!important;color:var(--widget-muted,#6f6862)!important}
      #studioApp .profile-card .stats span:last-child{border-right:0!important}
      #studioApp .profile-card .stats b{font-family:Georgia,"Times New Roman",serif!important;font-size:15px!important;line-height:1!important;color:var(--widget-ink,#171717)!important}
      #studioApp .profile-card .real-rank{left:156px!important;right:24px!important;bottom:15px!important;padding-top:10px!important;row-gap:4px!important}
      #studioApp .profile-card .real-rank-explanation{grid-column:1/-1!important;display:block!important;margin-top:2px!important;font:10px/1.35 Inter,ui-sans-serif,system-ui,sans-serif!important;color:var(--widget-muted,#746c66)!important;max-width:620px!important}

      #studioApp .profile-card #editProfileBtn{top:20px!important;right:22px!important;background:#1d1b1a!important;color:#fff!important;border:0!important;border-radius:999px!important;padding:8px 17px!important;font-family:Inter,ui-sans-serif,system-ui,sans-serif!important;font-size:11px!important;font-weight:550!important}
      #studioApp .profile-card>.widget-window-controls{display:none!important}
      #studioApp .hero{min-height:430px!important}
      #studioApp .profile-card{width:640px!important}
      #studioApp .music-card{left:684px!important;top:22px!important;bottom:auto!important;width:330px!important;z-index:4!important}
      #studioApp .aura-card{left:1028px!important;top:22px!important;bottom:auto!important;width:145px!important;z-index:4!important}
      #studioApp .hero{min-height:330px!important}
      @media(max-width:1250px) and (min-width:901px){
        #studioApp .profile-card{width:calc(100% - 44px)!important}
        #studioApp .music-card{left:22px!important;top:306px!important;width:330px!important}
        #studioApp .aura-card{left:366px!important;top:306px!important;width:145px!important}
        #studioApp .hero{min-height:430px!important}
      }
      @media(max-width:900px){#studioApp .profile-card{left:14px!important;top:20px!important;width:calc(100% - 28px)!important;height:auto!important;min-height:330px!important;max-height:none!important;grid-template-columns:100px minmax(0,1fr)!important}#studioApp .profile-card .profile-identity-rail{padding:18px 10px!important}#studioApp .profile-card .profile-avatar{width:76px!important;height:76px!important;font-size:36px!important}#studioApp .profile-card .profile-copy{padding:22px 16px 72px!important}#studioApp .profile-card .stats{grid-template-columns:1fr 1fr!important;row-gap:9px!important}#studioApp .profile-card .real-rank{left:116px!important;right:16px!important}}
      #studioApp .profile-editor-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}
      #studioApp .profile-editor-grid label{display:block!important;margin:0!important;font-size:10px!important}
      #studioApp .profile-editor-grid label.full{grid-column:1/-1}
      #studioApp .profile-editor-grid input,#studioApp .profile-editor-grid textarea{display:block;width:100%;margin-top:4px;padding:9px;border:1px solid rgba(80,70,64,.22);border-radius:8px;background:rgba(255,255,255,.72);color:inherit;font:inherit}
      #studioApp .profile-editor-grid textarea{resize:vertical}
      #studioApp #wallpaperPanel.wallpaper-panel{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}
      #studioApp #editProfileBtn{display:inline-flex!important;align-items:center!important;justify-content:center!important;visibility:visible!important;opacity:1!important;min-width:146px!important}
      #studioApp .sidebar-theme-controls{display:grid!important;grid-template-columns:repeat(2,36px)!important}
      #studioApp .sidebar-theme-btn{display:grid!important;visibility:visible!important;opacity:1!important}
      body.night-mode #studioApp .sidebar-theme-btn img{filter:brightness(0) invert(1)!important;mix-blend-mode:normal!important}
      body.night-mode #studioApp .sidebar-theme-btn[aria-pressed="true"] img{filter:brightness(0)!important;mix-blend-mode:normal!important}
      #studioApp #sidebarCollapse{display:flex!important;align-items:center!important;justify-content:center!important;gap:7px!important;width:100%!important;min-height:34px!important;border:1px solid rgba(80,70,64,.14)!important;border-radius:10px!important;background:rgba(255,255,255,.46)!important;color:inherit!important;margin:0 0 12px!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important}
      body.biglwa-sidebar-hidden #studioApp .sidebar{transform:translateX(-105%)!important;pointer-events:none!important}
      body.biglwa-sidebar-hidden #studioApp .main{margin-left:0!important}
      body.biglwa-sidebar-hidden #studioApp .page-wallpaper{left:0!important}
      #biglwaSidebarShowTab{position:fixed;left:0;top:94px;z-index:70;width:28px;height:52px;border:1px solid rgba(70,62,58,.18);border-left:0;border-radius:0 11px 11px 0;background:rgba(249,246,240,.94);backdrop-filter:blur(10px);display:none;align-items:center;justify-content:center;font-size:18px;box-shadow:0 4px 14px rgba(0,0,0,.08)}
      body.biglwa-sidebar-hidden #biglwaSidebarShowTab{display:flex!important}
      .widget-window-controls{display:flex!important;visibility:visible!important;opacity:1!important;align-items:center!important;gap:6px!important;pointer-events:auto!important;z-index:20!important}
      .widget-window-controls .window-light{display:block!important;visibility:visible!important;opacity:1!important;width:10px!important;height:10px!important;min-width:10px!important;min-height:10px!important;border-radius:50%!important;padding:0!important;border:0!important;cursor:pointer!important}
      .widget-window-controls .window-light.green{background:#58a36d!important}
      .widget-window-controls .window-light.yellow{background:#e5bd45!important}
      .widget-window-controls .window-light.red{background:#df5b56!important}
      body.sidebar-collapsed #studioApp .sidebar-theme-controls{display:flex!important;flex-direction:column!important;grid-template-columns:none!important;align-items:center!important;justify-content:center!important;gap:7px!important;width:100%!important}
      body.sidebar-collapsed #studioApp .sidebar-theme-btn{width:32px!important;height:32px!important;min-width:32px!important;margin:0!important;padding:0!important}
      #studioApp .widget-is-minimized{display:none!important}
      #studioApp .widget-is-expanded{position:fixed!important;inset:96px 44px 34px 132px!important;width:auto!important;height:auto!important;max-width:none!important;max-height:none!important;margin:0!important;z-index:10000!important;overflow:auto!important;column-span:none!important}
      body.sidebar-collapsed #studioApp .widget-is-expanded{left:78px!important}
      #studioApp.biglwa-rearrange-mode .masonry .card,
      #studioApp.biglwa-rearrange-mode .hero .profile-card,
      #studioApp.biglwa-rearrange-mode .hero .music-card,
      #studioApp.biglwa-rearrange-mode .hero .aura-card{outline:2px dashed rgba(var(--aura-rgb,216,95,109),.62)!important;outline-offset:3px!important;cursor:grab!important}
      #studioApp.biglwa-rearrange-mode .widget-dragging{cursor:grabbing!important}
      #studioApp .widget-dragging{opacity:.4!important}
      #studioApp .biglwa-drag-ghost{position:fixed!important;z-index:50000!important;pointer-events:none!important;opacity:.85!important;box-shadow:0 24px 60px rgba(20,14,10,.28)!important;border-radius:18px!important}
      #studioApp .biglwa-drop-slot{outline:3px solid rgba(var(--aura-rgb,216,95,109),.85)!important;outline-offset:4px!important;border-radius:18px!important;transform:scale(.985)!important;transition:transform .12s ease!important}
      #studioApp .sidebar{overflow:hidden!important}
      #studioApp .sidebar-top{overflow-y:auto!important;overscroll-behavior:contain;scrollbar-width:thin;padding-right:2px}
      #studioApp .sidebar-section{--sidebar-section-rgb:216,95,109;position:relative;display:flex;flex-direction:column;gap:5px;margin:0 0 8px;padding:8px 5px 8px 8px;border-left:2px solid rgba(var(--sidebar-section-rgb),.66);background:linear-gradient(90deg,rgba(var(--sidebar-section-rgb),.09),rgba(var(--sidebar-section-rgb),.015) 78%,transparent);border-radius:3px 9px 9px 3px}
      #studioApp .sidebar-primary-widgets{--sidebar-section-rgb:80,148,101}
      #studioApp .sidebar-primary-widgets[hidden]{display:none!important}
      #studioApp .sidebar-shortcuts{--sidebar-section-rgb:220,169,61}
      #studioApp .sidebar-rest-tools{--sidebar-section-rgb:216,95,109}
      #studioApp .sidebar-rest-tools[hidden]{display:none!important}
      #studioApp .sidebar-section nav{display:flex!important;flex-direction:column;gap:4px}
      #studioApp .sidebar-rest-tools .nav-item{position:relative;padding:9px 8px;border-radius:8px;font-size:10px}
      #studioApp .sidebar-route-control,#studioApp .sidebar-shortcut-open,#studioApp .sidebar-navigation-open{position:relative;box-sizing:border-box;display:flex;align-items:center;justify-content:center;gap:0;width:36px;height:36px;min-height:36px;margin:0 auto;padding:0;border:0;border-radius:9px;background:transparent;color:inherit;text-align:center;text-decoration:none;font:650 10px/1.15 Inter,ui-sans-serif,system-ui,sans-serif;cursor:pointer}
      #studioApp .sidebar-route-control:hover,#studioApp .sidebar-shortcut-open:hover,#studioApp .sidebar-navigation-open:hover{background:rgba(255,255,255,.52)}
      #studioApp .sidebar-route-icon{display:grid;flex:0 0 21px;width:21px;height:21px;place-items:center;font:700 15px/1 Georgia,serif}
      #studioApp .sidebar-route-icon>svg,#studioApp .sidebar-route-icon>img,#studioApp .sidebar-route-icon>.studio-symbol-mark{display:block;width:21px!important;height:21px!important;object-fit:contain}
      #studioApp .sidebar-shortcut-row,#studioApp .sidebar-navigation-row{position:relative;display:grid;grid-template-columns:17px 36px 17px;gap:3px;align-items:center;justify-content:center;min-height:38px;border-radius:9px}
      #studioApp .sidebar-shortcut-open{min-width:0}
      #studioApp .sidebar-shortcut-open b,#studioApp .sidebar-navigation-open b{display:none!important}
      #studioApp .sidebar-shortcut-drag,#studioApp .sidebar-shortcut-action{display:grid;width:17px;height:28px;place-items:center;padding:0;border:0;border-radius:6px;background:transparent;color:rgba(74,64,58,.55);cursor:grab;touch-action:none}
      #studioApp .sidebar-shortcut-action{cursor:pointer;font:750 14px/1 system-ui}
      #studioApp .sidebar-minimized-state{display:grid;width:17px;height:28px;place-items:center;color:rgba(151,61,69,.72);font:800 11px/1 system-ui}
      #studioApp .sidebar-shortcut-drag svg{display:block;width:10px;height:14px}
      #studioApp .sidebar-shortcut-drag:hover,#studioApp .sidebar-shortcut-action:hover{background:rgba(255,255,255,.58);color:inherit}
      #studioApp .sidebar-navigation-row.is-available::after,#studioApp .sidebar-widget-restore-row.is-minimized::after{content:"";position:absolute;right:20px;top:4px;width:6px;height:6px;border-radius:50%;pointer-events:none}
      #studioApp .sidebar-navigation-row.is-available::after{border:1px solid #d85f6d;background:rgba(216,95,109,.14);box-shadow:0 0 0 2px rgba(216,95,109,.08)}
      #studioApp .sidebar-widget-restore-row.is-minimized::after{background:#d85f6d;box-shadow:0 0 0 2px rgba(216,95,109,.14)}
      #studioApp .sidebar-primary-widgets .sidebar-widget-restore-row.is-minimized::after{background:#5b9e6f;box-shadow:0 0 0 2px rgba(91,158,111,.14)}
      #studioApp .sidebar-route-control.is-current,#studioApp .sidebar-shortcut-open.is-current,#studioApp .sidebar-navigation-open.is-current{background:rgba(var(--aura-rgb,216,95,109),.12);box-shadow:inset 0 0 0 1px rgba(var(--aura-rgb,216,95,109),.22)}
      #studioApp .sidebar-route-control.is-current::after,#studioApp .sidebar-shortcut-open.is-current::after,#studioApp .sidebar-navigation-open.is-current::after{content:"";position:absolute;right:7px;top:50%;width:9px;height:9px;border-radius:50%;transform:translateY(-50%);background:radial-gradient(circle at 42% 40%,rgba(255,255,255,.94) 0 11%,rgb(var(--aura-rgb,216,95,109)) 36%,rgba(var(--aura-rgb,216,95,109),.18) 72%,transparent 74%);box-shadow:0 0 9px rgba(var(--aura-rgb,216,95,109),.72);animation:biglwa-sidebar-aura 3.8s ease-in-out infinite}
      #studioApp .sidebar-shortcuts .minimized-label{display:none!important}
      #studioApp .minimized-label{display:none!important}
      #studioApp #minimizedWidgets{display:block!important;margin:0;padding:0;border:0;background:none}
      #minimizedWidgetDock,#studioSidebarShortcutDock,#studioSidebarAvailableDock,#studioSidebarDockedWidgetDock{display:flex!important;flex-direction:column;align-items:stretch;gap:4px;width:100%;margin:0}
      #studioApp .sidebar-widget-restore-row{position:relative}
      #studioApp .sidebar-navigation-row{touch-action:none}
      #studioApp .sidebar-navigation-row:active .sidebar-shortcut-drag{cursor:grabbing}
      #studioApp .sidebar-navigation-row.is-dragging{opacity:.38}
      #studioApp .sidebar-section.is-shortcut-drop-target{outline:2px dashed rgba(var(--sidebar-section-rgb),.78);outline-offset:2px}
      #studioApp .sidebar-route-control.is-docked{background:rgba(255,255,255,.52);box-shadow:inset 0 0 0 1px rgba(var(--sidebar-section-rgb),.3)}
      #studioApp .sidebar-route-control.is-docked::before{content:"↩";position:absolute;right:7px;top:50%;transform:translateY(-50%);font:700 10px/1 Inter,system-ui,sans-serif;color:rgb(var(--sidebar-section-rgb))}
      #studioApp .hero-action-bar{grid-template-columns:repeat(var(--studio-action-count,9),minmax(70px,1fr))!important}
      #studioApp .biglwa-nav-project-symbol{display:block!important;width:30px!important;height:27px!important;object-fit:contain!important;object-position:center!important}#studioApp .biglwa-library-fallback{display:block!important;width:29px!important;height:23px!important;color:currentColor!important}
      #studioApp .biglwa-archive-horizontal-symbol{display:inline-grid!important;place-items:center!important;width:30px!important;height:27px!important;line-height:1!important;transform:rotate(90deg)!important;transform-origin:center!important}
      #studioApp .biglwa-archive-horizontal-symbol img,#studioApp .biglwa-archive-horizontal-symbol svg{display:block!important;max-width:27px!important;max-height:27px!important}
      #studioApp .hero-action-bar>a[data-shortcut-route="projects"]>img,#studioApp .hero-action-bar>a[data-shortcut-route="archive"]>.biglwa-archive-horizontal-symbol{margin:0 auto 5px!important}
      body.night-mode #studioApp .hero-action-bar .biglwa-nav-project-symbol{filter:brightness(0) invert(1)!important}
      #studioApp .sidebar-shortcut-status{min-height:0;margin:0;padding:0 4px;color:#8b6b25;font:650 8px/1.35 Inter,ui-sans-serif,system-ui,sans-serif;transition:opacity .18s ease}
      #studioApp .sidebar-shortcut-save{display:flex;align-items:center;justify-content:center;width:100%;min-height:30px;margin:3px 0 0;padding:7px 8px;border:1px solid rgba(157,116,26,.24);border-radius:8px;background:rgba(255,255,255,.42);color:inherit;font:700 9px/1 Inter,ui-sans-serif,system-ui,sans-serif;cursor:pointer}
      #studioApp .sidebar-shortcut-save:hover{background:rgba(255,255,255,.68)}
      @keyframes biglwa-sidebar-aura{0%,100%{transform:translateY(-50%) scale(.88) translateX(0)}35%{transform:translateY(-56%) scale(1.08) translateX(-1px)}68%{transform:translateY(-45%) scale(.96) translateX(1px)}}
      body.night-mode #studioApp .sidebar-section{background:linear-gradient(90deg,rgba(var(--sidebar-section-rgb),.12),rgba(var(--sidebar-section-rgb),.025) 78%,transparent)}
      #studioApp .sidebar,#studioApp .sidebar button,#studioApp .sidebar a{color:#282523!important}
      body.night-mode #studioApp .sidebar,body.night-mode #studioApp .sidebar button,body.night-mode #studioApp .sidebar a{color:#f4eee8!important}
      body.night-mode #studioApp .sidebar .sidebar-route-icon>img,body.night-mode #studioApp .sidebar .sidebar-route-icon img,body.night-mode #studioApp .sidebar .studio-symbol-image,body.night-mode #studioApp .sidebar .studio-symbol-source{filter:brightness(0) invert(1)!important}
      body.night-mode #studioApp .sidebar-route-control:hover,body.night-mode #studioApp .sidebar-shortcut-open:hover,body.night-mode #studioApp .sidebar-navigation-open:hover,body.night-mode #studioApp .sidebar-shortcut-drag:hover,body.night-mode #studioApp .sidebar-shortcut-action:hover{background:rgba(255,255,255,.08)}
      body.night-mode #studioApp .sidebar-shortcut-drag,body.night-mode #studioApp .sidebar-shortcut-action{color:rgba(240,231,224,.58)}
      body.sidebar-collapsed #studioApp .sidebar-section{padding:7px 3px;border-left-width:2px}
      body.sidebar-collapsed #studioApp .sidebar-route-control,body.sidebar-collapsed #studioApp .sidebar-shortcut-open,body.sidebar-collapsed #studioApp .sidebar-navigation-open{justify-content:center;width:36px;height:36px;min-height:36px;padding:0;margin:auto;font-size:0}
      body.sidebar-collapsed #studioApp .sidebar-route-control b,body.sidebar-collapsed #studioApp .sidebar-shortcut-open b,body.sidebar-collapsed #studioApp .sidebar-navigation-open b,body.sidebar-collapsed #studioApp .sidebar-shortcut-status{display:none!important}
      body.sidebar-collapsed #studioApp .sidebar-shortcut-save{width:36px;min-height:32px;margin:3px auto;padding:0;font-size:0}
      body.sidebar-collapsed #studioApp .sidebar-shortcut-save::before{content:"✓";font-size:14px}
      body.sidebar-collapsed #studioApp .sidebar-shortcut-row,body.sidebar-collapsed #studioApp .sidebar-navigation-row{grid-template-columns:0 36px 0;gap:0}
      body.sidebar-collapsed #studioApp .sidebar-shortcut-drag,body.sidebar-collapsed #studioApp .sidebar-shortcut-action{width:0;overflow:hidden;opacity:0;pointer-events:none}
      body.sidebar-collapsed #studioApp .sidebar-route-control.is-current::after,body.sidebar-collapsed #studioApp .sidebar-shortcut-open.is-current::after,body.sidebar-collapsed #studioApp .sidebar-navigation-open.is-current::after{right:2px;top:5px;width:7px;height:7px}
      @media(prefers-reduced-motion:reduce){#studioApp .sidebar-route-control.is-current::after,#studioApp .sidebar-shortcut-open.is-current::after,#studioApp .sidebar-navigation-open.is-current::after{animation:none}}
      @media(max-width:980px){#studioApp .topbar{grid-template-columns:126px minmax(220px,1fr) minmax(210px,280px)!important}#studioApp .studio-brand-row>a.brand.biglwa-block-brand{width:105px!important;height:59px!important;min-width:105px!important}#studioApp .studio-brand-row>a.brand.biglwa-block-brand .biglwa-topbar-crest{width:98px!important;height:56px!important;flex-basis:98px!important}}
      @media(max-width:720px){#studioApp .topbar{grid-template-columns:94px minmax(0,1fr) auto!important;gap:8px!important;padding-left:12px!important;padding-right:12px!important}#studioApp .studio-brand-row>a.brand.biglwa-block-brand{width:78px!important;height:44px!important;min-width:78px!important}#studioApp .studio-brand-row>a.brand.biglwa-block-brand .biglwa-topbar-crest{width:73px!important;height:42px!important;flex-basis:73px!important}}
      /* 2026-09-10 studio hero: clean two-column auto-flow grid so drag-reorder actually moves cards */
      #studioApp .hero{display:grid!important;grid-template-columns:minmax(420px,1fr) 300px!important;grid-auto-rows:auto!important;grid-auto-flow:dense!important;column-gap:18px!important;row-gap:18px!important;align-items:start!important;align-content:start!important;padding:52px 3.5% 40px 4.8%!important;min-height:0!important;height:auto!important;max-height:none!important}
      #studioApp .hero .profile-card{position:relative!important;grid-column:auto!important;grid-row:span 2!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;width:100%!important;min-width:0!important;max-width:none!important;height:auto!important;min-height:266px!important;max-height:none!important;margin:0!important;align-self:stretch!important}
      #studioApp .hero .music-card{position:relative!important;grid-column:auto!important;grid-row:auto!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;width:100%!important;min-width:0!important;max-width:none!important;height:128px!important;min-height:128px!important;max-height:128px!important;margin:0!important}
      #studioApp .hero .aura-card{position:relative!important;grid-column:auto!important;grid-row:auto!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;width:100%!important;min-width:0!important;max-width:none!important;height:128px!important;min-height:128px!important;max-height:128px!important;margin:0!important}
      #studioApp .hero .mobile-dock.hero-action-bar{grid-column:1 / -1!important;grid-row:auto!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;width:100%!important;position:relative!important;margin:6px 0 0!important}
      @media(max-width:1200px){#studioApp .hero{grid-template-columns:minmax(360px,1fr) 280px!important}#studioApp .hero .music-card{height:112px!important;min-height:112px!important;max-height:112px!important}#studioApp .hero .aura-card{height:112px!important;min-height:112px!important;max-height:112px!important}}
      @media(max-width:900px){
        #studioApp .hero{grid-template-columns:1fr!important;grid-template-rows:auto auto auto!important;padding:66px 12px 38px!important;row-gap:14px!important}
        #studioApp .hero .profile-card{grid-column:1!important;grid-row:1!important;width:100%!important;min-height:270px!important}
        #studioApp .hero .music-card{grid-column:1!important;grid-row:2!important;width:100%!important;height:96px!important;min-height:96px!important;max-height:96px!important}
        #studioApp .hero .aura-card{grid-column:1!important;grid-row:3!important;width:100%!important;height:96px!important;min-height:96px!important;max-height:96px!important}
        #studioApp .hero .mobile-dock.hero-action-bar{grid-column:1!important;grid-row:4!important}
      }
      /* Expanded widget must override hero grid & masonry layout rules */
      #studioApp .hero .widget-is-expanded,
      #studioApp .masonry .widget-is-expanded,
      #studioApp .profile-card.widget-is-expanded,
      #studioApp .music-card.widget-is-expanded,
      #studioApp .aura-card.widget-is-expanded{position:fixed!important;inset:96px 44px 34px 132px!important;width:auto!important;height:auto!important;max-width:none!important;max-height:none!important;min-width:0!important;min-height:0!important;margin:0!important;z-index:10000!important;overflow:auto!important;display:block!important;left:132px!important;right:44px!important;top:96px!important;bottom:34px!important}
      body.sidebar-collapsed #studioApp .hero .widget-is-expanded,
      body.sidebar-collapsed #studioApp .masonry .widget-is-expanded{left:78px!important}
      #studioApp .widget-is-expanded>.widget-window-controls{position:sticky!important;top:0!important;right:0!important;left:auto!important;margin:0 0 10px auto!important;width:max-content!important}
      /* Profile editing stays inside the profile card instead of opening a floating panel. */
      #studioApp .profile-card .profile-identity-rail #editProfileBtn{position:static!important;inset:auto!important;width:100%!important;min-width:0!important;max-width:100px!important;margin:0!important;padding:7px 8px!important;border-radius:999px!important;font-size:9px!important;line-height:1.1!important;white-space:nowrap!important}
      #studioApp .profile-card .profile-identity-rail>.profile-avatar{order:1!important}
      #studioApp .profile-card .profile-identity-rail>#editProfileBtn{order:2!important;margin-top:0!important}
      #studioApp .profile-card .profile-identity-rail>.profile-rail-location{order:3!important;margin-top:0!important}
      #studioApp .profile-card.profile-is-editing{min-height:420px!important}
      #studioApp .profile-card.profile-is-editing .profile-identity-rail{justify-content:flex-start!important}
      #studioApp .profile-card.profile-is-editing .profile-copy{display:none!important}
      #studioApp .profile-card #wallpaperPanel{position:static!important;inset:auto!important;grid-column:2!important;grid-row:1!important;align-self:stretch!important;width:auto!important;max-width:none!important;max-height:390px!important;margin:0!important;padding:19px 22px 18px!important;overflow:auto!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
      #studioApp .profile-card #wallpaperPanel.panel-hidden{display:none!important}
      #studioApp .profile-card #wallpaperPanel:not(.panel-hidden){display:block!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;z-index:auto!important}
      #studioApp .profile-card #wallpaperPanel .panel-title{position:sticky;top:-19px;z-index:3;margin:-19px -22px 10px;padding:16px 22px 9px;background:linear-gradient(to bottom,rgba(250,246,240,.98) 72%,rgba(250,246,240,0))}
      #studioApp .profile-card #wallpaperPanel .panel-title strong{font:600 18px/1.1 Georgia,"Times New Roman",serif}
      #studioApp .profile-card #wallpaperPanel .panel-title button{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;color:inherit;cursor:pointer}
      #studioApp .profile-editor-tabs{display:flex;gap:5px;margin:0 0 12px;padding-bottom:10px;border-bottom:1px solid rgba(75,63,57,.12)}
      #studioApp .profile-editor-tabs button{border:1px solid rgba(75,63,57,.16);border-radius:999px;background:rgba(255,255,255,.48);padding:7px 10px;color:inherit;font:700 8px/1 system-ui;letter-spacing:.04em;cursor:pointer}
      #studioApp .profile-editor-tabs button[aria-selected="true"]{border-color:rgba(var(--aura-rgb,216,95,109),.55);background:rgba(var(--aura-rgb,216,95,109),.13);color:rgb(var(--aura-rgb,216,95,109))}
      #studioApp #wallpaperPanel [data-profile-editor-pane][hidden]{display:none!important}
      #studioApp #wallpaperPanel .customize-section{margin:0!important;padding:0!important;border:0!important}
      #studioApp #wallpaperPanel .customize-section h3{margin:0 0 5px!important;font:600 14px/1.2 Georgia,"Times New Roman",serif!important}
      #studioApp #wallpaperPanel .profile-editor-grid{gap:7px!important}
      #studioApp #wallpaperPanel .profile-editor-grid input,#studioApp #wallpaperPanel .profile-editor-grid textarea{box-sizing:border-box!important;padding:8px 9px!important}
      #studioApp .profile-editor-actions{position:sticky;bottom:-18px;z-index:3;display:flex;gap:7px;margin:12px -22px -18px;padding:10px 22px 16px;background:linear-gradient(to top,rgba(250,246,240,.98) 76%,rgba(250,246,240,0))}
      #studioApp .profile-editor-actions button{width:auto!important;min-width:112px!important;margin:0!important;padding:9px 13px!important}
      #studioApp .profile-editor-actions .profile-editor-cancel{background:rgba(255,255,255,.54)!important;color:var(--widget-ink,#272321)!important;border:1px solid rgba(65,54,49,.18)!important;box-shadow:none!important}
      body.night-mode #studioApp .profile-card #wallpaperPanel .panel-title{background:linear-gradient(to bottom,rgba(41,37,35,.98) 72%,rgba(41,37,35,0))}
      body.night-mode #studioApp .profile-editor-actions{background:linear-gradient(to top,rgba(41,37,35,.98) 76%,rgba(41,37,35,0))}
      body.night-mode #studioApp .profile-editor-tabs button{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.16)}
      body.night-mode #studioApp #wallpaperPanel .profile-editor-grid input,body.night-mode #studioApp #wallpaperPanel .profile-editor-grid textarea,body.night-mode #studioApp #wallpaperPanel select{background:#302c2a!important;border-color:#514a45!important;color:#f3eee8!important}
      @media(max-width:900px){#studioApp .profile-card.profile-is-editing{min-height:460px!important}#studioApp .profile-card #wallpaperPanel{max-height:430px!important;padding-left:16px!important;padding-right:16px!important}#studioApp .profile-card #wallpaperPanel .panel-title{margin-left:-16px!important;margin-right:-16px!important;padding-left:16px!important;padding-right:16px!important}#studioApp .profile-editor-actions{margin-left:-16px!important;margin-right:-16px!important;padding-left:16px!important;padding-right:16px!important}}
      @media(max-width:620px){#studioApp .profile-card.profile-is-editing{grid-template-columns:1fr!important;min-height:610px!important}#studioApp .profile-card.profile-is-editing .profile-identity-rail{grid-column:1!important;grid-row:1!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:flex-start!important;gap:9px!important;padding:12px 14px!important;border-right:0!important;border-bottom:1px solid rgba(62,50,45,.13)!important}#studioApp .profile-card.profile-is-editing .profile-avatar{width:58px!important;height:58px!important}#studioApp .profile-card.profile-is-editing .profile-rail-location{text-align:center!important}#studioApp .profile-card #wallpaperPanel{grid-column:1!important;grid-row:2!important;max-height:510px!important}.profile-editor-grid{grid-template-columns:1fr!important}.profile-editor-grid label.full{grid-column:1!important}}
      /* Restored bio banner: wide profile identity surface, separate from editor mode. */
      #studioApp:not(.profile-editor-wallpaper) .hero{grid-template-columns:1fr!important;grid-template-rows:auto auto!important;gap:16px!important}
      #studioApp:not(.profile-editor-wallpaper) .hero>.profile-card:not(.profile-is-editing){position:relative!important;grid-column:1!important;grid-row:1!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;width:100%!important;height:348px!important;min-height:348px!important;max-height:348px!important;display:grid!important;grid-template-columns:174px minmax(0,1fr)!important;gap:22px!important;padding:14px!important;box-sizing:border-box!important}
      #studioApp:not(.profile-editor-wallpaper) .profile-card:not(.profile-is-editing) .profile-identity-rail{grid-column:1!important;grid-row:1!important;align-self:stretch!important;justify-content:flex-start!important;padding:0!important;border-right:0!important;background:transparent!important}
      #studioApp:not(.profile-editor-wallpaper) .profile-card:not(.profile-is-editing) .profile-avatar{width:120px!important;height:120px!important;margin:0!important;border-radius:18px!important;font-size:54px!important}
      #studioApp:not(.profile-editor-wallpaper) .profile-card:not(.profile-is-editing) .profile-copy{grid-column:2!important;grid-row:1!important;align-self:stretch!important;padding:28px 30px 66px 0!important}
      #studioApp:not(.profile-editor-wallpaper) .profile-card:not(.profile-is-editing) .profile-display-name{display:none!important}
      #studioApp:not(.profile-editor-wallpaper) .profile-card:not(.profile-is-editing) .profile-name-line{margin:0 0 9px!important}
      #studioApp:not(.profile-editor-wallpaper) .profile-card:not(.profile-is-editing) .profile-name-line h1{font-family:"CS Bergamot Stitched",Georgia,"Times New Roman",serif!important;font-size:31px!important;line-height:1!important;font-weight:400!important;letter-spacing:.01em!important;text-transform:lowercase!important;margin:0!important}
      #studioApp:not(.profile-editor-wallpaper) .profile-card:not(.profile-is-editing) .bio{font-family:Georgia,"Times New Roman",serif!important;font-size:16px!important;line-height:1.35!important;max-width:760px!important;margin:0 0 7px!important}
      #studioApp:not(.profile-editor-wallpaper) .profile-card:not(.profile-is-editing) .meta-row{margin:0 0 13px!important;font-size:12px!important}
      #studioApp:not(.profile-editor-wallpaper) .profile-card:not(.profile-is-editing) .stats{grid-template-columns:repeat(4,minmax(0,1fr))!important;margin:0!important;padding-top:11px!important}
      #studioApp:not(.profile-editor-wallpaper) .profile-card:not(.profile-is-editing) .real-rank{left:188px!important;right:30px!important;bottom:18px!important}
      #studioApp:not(.profile-editor-wallpaper) .hero-widget-rail{grid-column:1!important;grid-row:2!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:16px!important}
      @media(max-width:900px){#studioApp:not(.profile-editor-wallpaper) .hero>.profile-card:not(.profile-is-editing){height:auto!important;min-height:340px!important;max-height:none!important;grid-template-columns:86px minmax(0,1fr)!important;gap:18px!important;padding:22px!important}#studioApp:not(.profile-editor-wallpaper) .profile-card:not(.profile-is-editing) .profile-avatar{width:86px!important;height:86px!important;font-size:40px!important}#studioApp:not(.profile-editor-wallpaper) .profile-card:not(.profile-is-editing) .profile-copy{padding:10px 0 58px!important}#studioApp:not(.profile-editor-wallpaper) .profile-card:not(.profile-is-editing) .real-rank{left:22px!important;right:22px!important}#studioApp:not(.profile-editor-wallpaper) .hero-widget-rail{grid-template-columns:1fr!important}}
      /* Station artwork turns the Stream preview into a real broadcast booth. */
      #studioApp #stream .stream-screen{position:relative;isolation:isolate;min-height:238px;padding:18px;overflow:hidden;border:5px solid #181313;border-radius:14px;background:#120d10;color:#fff;box-shadow:inset 0 0 0 2px rgba(255,255,255,.05),0 8px 0 #2a1918}
      #studioApp #stream .stream-station-photo{position:absolute;inset:0;z-index:-2;display:block;width:100%;height:100%;object-fit:cover;object-position:center;filter:saturate(.94) contrast(1.08) brightness(.72)}
      #studioApp #stream .stream-screen::before{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(180deg,rgba(8,7,12,.15),rgba(8,7,12,.34) 45%,rgba(8,7,12,.86));pointer-events:none}
      #studioApp #stream .stream-screen::after{content:"";position:absolute;inset:0;z-index:3;background:repeating-linear-gradient(to bottom,rgba(255,255,255,.035) 0 1px,transparent 1px 4px);mix-blend-mode:overlay;pointer-events:none}
      #studioApp #stream .stream-screen>.on-air,#studioApp #stream .stream-screen>strong,#studioApp #stream .stream-screen>span,#studioApp #stream .stream-screen>.stream-wave{position:relative;z-index:2}
      #studioApp #stream .stream-screen>strong{display:block;margin-top:102px;font-family:"CS Bergamot Stitched",Georgia,"Times New Roman",serif!important;font-size:24px;line-height:1;color:#fff;text-shadow:0 2px 13px rgba(0,0,0,.9)}
      #studioApp #stream .stream-screen>span{display:block;margin-top:7px;color:rgba(255,255,255,.82);font:700 10px/1 Inter,ui-sans-serif,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase}
      #studioApp #stream .stream-wave{position:absolute;left:18px;right:18px;bottom:54px;height:28px;opacity:.74}
      #studioApp #stream .on-air{display:inline-flex;padding:6px 9px;border-radius:999px;background:rgba(16,12,15,.74);-webkit-backdrop-filter:blur(7px);backdrop-filter:blur(7px);box-shadow:0 0 0 1px rgba(255,255,255,.14)}
      /* Qwiky Note keeps the stitched BIGLWA headers, but writes on a tactile sticky note. */
      #studioApp #notes .card-head h2{font-family:"CS Bergamot Stitched",Georgia,"Times New Roman",serif!important;text-transform:lowercase!important}
      #studioApp #notes .note-paper{position:relative;isolation:isolate;min-height:210px;padding:54px 28px 28px;border:0!important;border-radius:3px 3px 17px 3px!important;background:repeating-linear-gradient(to bottom,transparent 0,transparent 28px,rgba(119,92,38,.15) 29px),linear-gradient(145deg,#fff6a5,#f1d866)!important;color:#3c3021!important;font-family:"Comic Sans MS","Bradley Hand","Segoe Print",cursive!important;font-size:20px!important;line-height:1.45!important;text-align:left!important;transform:rotate(-.55deg);box-shadow:0 12px 22px rgba(69,49,23,.18),inset 0 0 28px rgba(255,255,255,.28)!important;overflow:hidden}
      #studioApp #notes .note-paper::before{content:"QWIKY NOTE";position:absolute;left:20px;top:16px;padding:5px 8px;border:1px solid rgba(75,55,25,.18);background:rgba(255,248,196,.76);color:#67512f;font:900 8px/1 Inter,ui-sans-serif,system-ui,sans-serif;letter-spacing:.15em;transform:rotate(-1.5deg)}
      #studioApp #notes .note-paper::after{content:"";position:absolute;right:0;bottom:0;width:34px;height:34px;background:linear-gradient(135deg,rgba(172,139,52,.28) 0 49%,#fff5a0 50%);filter:drop-shadow(-2px -2px 2px rgba(84,64,29,.11))}
      #studioApp #notes .note-paper span{position:absolute;right:22px;bottom:15px;margin:0!important;color:#765f35;font:800 8px/1 Inter,ui-sans-serif,system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase}
      body.night-mode #studioApp #notes .note-paper{filter:saturate(.84) brightness(.82)}
      @media(max-width:680px){#studioApp #stream .stream-screen{min-height:210px}#studioApp #stream .stream-screen>strong{margin-top:82px;font-size:21px}#studioApp #notes .note-paper{min-height:185px;font-size:18px}}
    `;
  }

  function ensureTopLogo(){
    const row=$('#studioApp .studio-brand-row');
    if(!row)return false;
    if(row.dataset.biglwaTopLogo==='1'&&row.querySelector('a.brand.biglwa-block-brand .biglwa-topbar-crest'))return true;
    row.innerHTML='';
    const a=document.createElement('a');
    a.className='brand biglwa-block-brand';
    a.href='/studio';
    a.setAttribute('aria-label','BIGLWA Studio');
    const mark=document.createElement('span');
    mark.className='biglwa-stitched-crest biglwa-topbar-crest';
    mark.setAttribute('aria-hidden','true');
    a.appendChild(mark);
    row.appendChild(a);
    row.dataset.biglwaTopLogo='1';
    return true;
  }

  function ensureLoginSnake(){
    const card=$('#loginCard')||$('#loginPage .login-card');
    if(!card)return;
    let mark=$('#loginCardSnakeMark',card);
    if(!mark){mark=document.createElement('div');mark.id='loginCardSnakeMark';mark.setAttribute('aria-hidden','true');const head=$('.login-card-head',card);if(head)head.insertAdjacentElement('afterend',mark);else card.prepend(mark)}
  }

  function ensureSidebar(){
    const sidebar=$('#studioApp .sidebar');if(!sidebar)return;
    document.body.classList.remove('biglwa-sidebar-hidden');
    $('#biglwaSidebarShowTab')?.remove();
    const top=$('.sidebar-top',sidebar);
    let toggle=$('#sidebarCollapse',sidebar);
    if(!toggle){
      toggle=document.createElement('button');
      toggle.id='sidebarCollapse';
      toggle.className='sidebar-collapse';
      toggle.type='button';
      top?.prepend(toggle);
    }
    const setCollapsed=(collapsed)=>{
      document.body.classList.toggle('sidebar-collapsed',collapsed);
      toggle.setAttribute('aria-expanded',collapsed?'false':'true');
      toggle.setAttribute('aria-label',collapsed?'Expand side navigation':'Collapse side navigation');
      toggle.setAttribute('title',collapsed?'Expand side navigation':'Collapse side navigation');
      toggle.innerHTML=collapsed?'<span aria-hidden="true">›</span><b>More</b>':'<span aria-hidden="true">‹</span><b>Hide</b>';
      try{localStorage.setItem('biglwaSidebarCollapsed',collapsed?'1':'0')}catch{}
    };
    const fresh=toggle.cloneNode(true);
    toggle.replaceWith(fresh);
    toggle=fresh;
    toggle.addEventListener('click',()=>setCollapsed(!document.body.classList.contains('sidebar-collapsed')));
    try{setCollapsed(localStorage.getItem('biglwaSidebarCollapsed')==='1')}catch{setCollapsed(false)}

    const legacyNavigation=$$(':scope > nav a,:scope > nav button',top);
    legacyNavigation.forEach((control,index)=>rememberNavigation(control,SHORTCUT_LIMIT+index));
    let primary=$('#studioSidebarPrimary',top);
    if(!primary){primary=document.createElement('section');primary.id='studioSidebarPrimary';primary.className='sidebar-section sidebar-primary-widgets';primary.setAttribute('aria-label','Widgets minimized from the Studio')}
    let shortcuts=$('#studioSidebarShortcuts',top);
    if(!shortcuts){shortcuts=document.createElement('section');shortcuts.id='studioSidebarShortcuts';shortcuts.className='sidebar-section sidebar-shortcuts';shortcuts.setAttribute('aria-label','Shortcut bar, maximum eight');shortcuts.innerHTML='<nav id="studioSidebarShortcutDock" aria-label="Shortcut bar destinations"></nav><p class="sidebar-shortcut-status" role="status" aria-live="polite"></p><button class="sidebar-shortcut-save" id="saveSidebarShortcuts" type="button">Save shortcuts</button>'}
    if(!$('#saveSidebarShortcuts',shortcuts)){const save=document.createElement('button');save.id='saveSidebarShortcuts';save.className='sidebar-shortcut-save';save.type='button';save.textContent='Save shortcuts';shortcuts.appendChild(save)}
    if(primary.previousElementSibling!==toggle)toggle.insertAdjacentElement('afterend',primary);
    if(shortcuts.previousElementSibling!==primary)primary.insertAdjacentElement('afterend',shortcuts);
    let rest=$('#studioSidebarRest',top);
    if(!rest){rest=document.createElement('section');rest.id='studioSidebarRest';rest.className='sidebar-section sidebar-rest-tools';top.appendChild(rest)}
    rest.setAttribute('aria-label','Available shortcut destinations');
    $$(':scope > nav',top).forEach(nav=>nav.remove());
    $$(':scope > nav:not(#studioSidebarAvailableDock),:scope > .sidebar-navigation-row,:scope > [data-sidebar-widget]',rest).forEach(item=>item.remove());
    let availableDock=$('#studioSidebarAvailableDock',rest);
    if(!availableDock){availableDock=document.createElement('nav');availableDock.id='studioSidebarAvailableDock';availableDock.setAttribute('aria-label','Available shortcut destinations, still active in the Studio');rest.prepend(availableDock)}
    let dockedWidgetDock=$('#studioSidebarDockedWidgetDock',rest);
    if(!dockedWidgetDock){dockedWidgetDock=document.createElement('div');dockedWidgetDock.id='studioSidebarDockedWidgetDock';dockedWidgetDock.setAttribute('aria-label','Widgets closed from the Studio');rest.appendChild(dockedWidgetDock)}
    let widgetDockSection=$('#minimizedWidgets',top);
    if(!widgetDockSection){widgetDockSection=document.createElement('div');widgetDockSection.id='minimizedWidgets';widgetDockSection.className='minimized-widgets';widgetDockSection.innerHTML='<div class="minimized-label" aria-hidden="true"></div><div class="minimized-widget-dock" id="minimizedWidgetDock"></div>'}
    widgetDockSection.hidden=false;widgetDockSection.classList.remove('sidebar-section','sidebar-shortcuts');widgetDockSection.setAttribute('aria-label','Widgets closed from the Studio');
    if(widgetDockSection.parentElement!==primary)primary.appendChild(widgetDockSection);
    primary.hidden=!$('[data-shortcut-row]',widgetDockSection);
    rest.hidden=!$('[data-sidebar-route-row]',availableDock)&&!$('[data-shortcut-row]',dockedWidgetDock);
  }

  const navigationCatalog=new Map();
  let initialNavigationShortcuts=null;
  let draggedNavigationKey='';
  function navigationKey(control){
    return String(control?.dataset?.sidebarRoute||control?.dataset?.policyRoute||control?.dataset?.open||(control?.getAttribute?.('href')||'').replace(/^.*#/,'')||'').trim().toLowerCase();
  }
  function navigationLabel(control,key){
    if(key==='notes')return 'Qwiky Note';
    return String(control?.querySelector?.(':scope > b,:scope > span:last-child')?.textContent||control?.getAttribute?.('aria-label')||key).trim();
  }
  function navigationSymbolMarkup(control,label){
    if(!control)return '•';
    const clone=control.cloneNode(true);
    clone.querySelectorAll(':scope > b').forEach(node=>node.remove());
    [...clone.children].forEach(node=>{if(node.tagName==='SPAN'&&node.textContent.trim()===label)node.remove()});
    const wrapper=clone.querySelector(':scope > .sidebar-route-icon');
    if(wrapper&&clone.children.length===1&&!clone.textContent.trim().replace(wrapper.textContent.trim(),''))return wrapper.innerHTML||wrapper.textContent||'•';
    return clone.innerHTML.trim()||clone.textContent.trim()||'•';
  }
  function rememberNavigation(control,order){
    const key=navigationKey(control);if(!key||key==='create')return '';
    const label=navigationLabel(control,key),existing=navigationCatalog.get(key),fromGenerated=!!control.closest?.('#studioSidebarShortcuts,#studioSidebarRest');
    const symbolHTML=navigationSymbolMarkup(control,label);
    navigationCatalog.set(key,{key,label,href:control.getAttribute?.('href')||existing?.href||'#'+key,policyRoute:control.dataset?.policyRoute||existing?.policyRoute||'',symbolHTML:(!fromGenerated&&symbolHTML)||existing?.symbolHTML||symbolHTML||'•',order:existing?.order??order});
    return key;
  }
  function createSidebarNavigationRow(entry,zone){
    const connected=zone==='shortcut';
    const row=document.createElement('div');row.className=`sidebar-navigation-row ${connected?'is-shortcut':'is-available'}`;row.draggable=false;row.dataset.sidebarRouteRow=entry.key;row.dataset.shortcutZone=zone;row.title=connected?`${entry.label} · connected to shortcut bar`:`${entry.label} · active in Studio, not on shortcut bar`;
    const drag=document.createElement('button');drag.type='button';drag.className='sidebar-shortcut-drag';drag.dataset.shortcutDragHandle=entry.key;drag.setAttribute('aria-label',`Drag ${entry.label} ${connected?'out of':'into'} the shortcut bar`);drag.title='Drag to move';drag.innerHTML='<svg viewBox="0 0 10 14" aria-hidden="true"><circle cx="3" cy="3" r="1" fill="currentColor"/><circle cx="7" cy="3" r="1" fill="currentColor"/><circle cx="3" cy="7" r="1" fill="currentColor"/><circle cx="7" cy="7" r="1" fill="currentColor"/><circle cx="3" cy="11" r="1" fill="currentColor"/><circle cx="7" cy="11" r="1" fill="currentColor"/></svg>';
    const open=entry.policyRoute?document.createElement('a'):document.createElement('button');
    if(open.tagName==='BUTTON')open.type='button';else{open.href=entry.href||('/'+entry.key);open.dataset.policyRoute=entry.policyRoute}
    open.className='sidebar-navigation-open';open.dataset.sidebarRoute=entry.key;open.setAttribute('aria-label','Open '+entry.label);
    const mark=document.createElement('span');mark.className='sidebar-route-icon';mark.setAttribute('aria-hidden','true');mark.innerHTML=entry.symbolHTML||'•';
    const action=document.createElement('button');action.type='button';action.className='sidebar-shortcut-action';action.dataset[connected?'removeShortcut':'addShortcut']=entry.key;action.textContent=connected?'−':'+';action.setAttribute('aria-label',connected?`Disconnect ${entry.label} from shortcut bar`:`Add ${entry.label} to shortcut bar`);action.title=action.getAttribute('aria-label');
    open.append(mark);row.append(drag,open,action);return row;
  }
  function createHeroShortcut(entry,existing){
    const link=existing||document.createElement('a');link.href=entry.href&&entry.href.startsWith('/')?entry.href:'#'+entry.key;link.dataset.shortcutRoute=entry.key;
    if(entry.policyRoute)link.dataset.policyRoute=entry.policyRoute;else delete link.dataset.policyRoute;
    link.setAttribute('aria-label',entry.label);
    if(!existing||entry.key==='projects'||entry.key==='archive'){
      link.innerHTML=(entry.symbolHTML||'•')+'<span></span>';
      link.querySelector(':scope > span:last-child').textContent=entry.label;
    }else{const label=link.querySelector(':scope > span:last-child');if(label)label.textContent=entry.label}
    return link;
  }
  function syncSidebarShortcutSystem(){
    const app=$('#studioApp'),top=$('.sidebar-top',app),bar=$('.hero-action-bar',app),shortcutDock=$('#studioSidebarShortcutDock',app),rest=$('#studioSidebarRest',app),availableDock=$('#studioSidebarAvailableDock',app);if(!app||!top||!bar||!shortcutDock||!rest||!availableDock)return;
    const currentHeroLinks=$$('a',bar).filter(link=>link.id!=='mobileCreate');
    const heroKeys=currentHeroLinks.map((link,index)=>rememberNavigation(link,index)).filter(Boolean);
    refreshNavigationCatalogFromWidgets(app);
    if((!initialNavigationShortcuts||!initialNavigationShortcuts.length)&&heroKeys.length)initialNavigationShortcuts=heroKeys.slice(0,SHORTCUT_LIMIT);
    if(!initialNavigationShortcuts?.length)return;
    let shortcuts=readNavigationShortcuts(initialNavigationShortcuts).filter(key=>navigationCatalog.has(key));
    let hasSavedShortcuts=false;try{hasSavedShortcuts=localStorage.getItem(NAV_SHORTCUT_KEY)!==null}catch{}
    if(!hasSavedShortcuts)shortcuts=initialNavigationShortcuts.filter(key=>navigationCatalog.has(key)).slice(0,SHORTCUT_LIMIT);
    shortcuts=writeNavigationShortcuts(shortcuts);
    shortcutDock.replaceChildren(...shortcuts.map(key=>createSidebarNavigationRow(navigationCatalog.get(key),'shortcut')));
    const available=[...navigationCatalog.values()].filter(entry=>!shortcuts.includes(entry.key)).sort((a,b)=>a.order-b.order);
    availableDock.replaceChildren(...available.map(entry=>createSidebarNavigationRow(entry,'available')));
    const existingByKey=new Map(currentHeroLinks.map(link=>[navigationKey(link),link]));
    let create=$('#mobileCreate',bar);if(!create){create=document.createElement('button');create.id='mobileCreate';create.type='button';create.innerHTML='＋<span>Create</span>'}
    const links=shortcuts.map(key=>createHeroShortcut(navigationCatalog.get(key),existingByKey.get(key)));
    const split=Math.ceil(links.length/2);bar.replaceChildren(...links.slice(0,split),create,...links.slice(split));bar.style.setProperty('--studio-action-count',String(links.length+1));
    setSidebarCurrent(app,app.dataset.currentStudioRoute||'');
    const saveShortcutButton=$('#saveSidebarShortcuts',app);
    if(saveShortcutButton&&saveShortcutButton.dataset.biglwaBound!=='1'){saveShortcutButton.dataset.biglwaBound='1';saveShortcutButton.addEventListener('click',()=>{const saved=writeNavigationShortcuts($$('[data-sidebar-route-row]',shortcutDock).map(row=>row.dataset.sidebarRouteRow));showShortcutStatus(app,`${saved.length} shortcut${saved.length===1?'':'s'} saved.`);window.dispatchEvent(new CustomEvent('biglwa:studio-update',{detail:{title:'Shortcut bar updated',source:'Studio navigation',detail:`${saved.length} shortcuts saved`,notified:false}}))})}
    syncPrimaryWidgetDock(app);
    bindSidebarShortcutDrag(app);
  }

  function moveNavigationShortcut(app,key,connected,targetKey=''){
    if(!navigationCatalog.has(key))return false;
    const current=readNavigationShortcuts(initialNavigationShortcuts||[]).filter(item=>navigationCatalog.has(item));
    const without=current.filter(item=>item!==key);
    if(connected){
      if(!current.includes(key)&&without.length>=SHORTCUT_LIMIT){showShortcutStatus(app,'Shortcut bar is full. Remove one first.');return false}
      const targetIndex=targetKey===key?Math.min(Math.max(current.indexOf(key),0),without.length):(targetKey?without.indexOf(targetKey):-1);
      without.splice(targetIndex<0?without.length:targetIndex,0,key);
    }
    writeNavigationShortcuts(without);
    syncSidebarShortcutSystem();
    showShortcutStatus(app,connected?'Connected to shortcut bar.':'Still active in Studio · shortcut disconnected.');
    return true;
  }

  function bindSidebarShortcutDrag(app){
    if(!app||app.dataset.biglwaShortcutDragBound==='1')return;app.dataset.biglwaShortcutDragBound='1';
    let state=null;
    const clear=()=>{if(!state)return;state.row.classList.remove('is-dragging');$$('.is-shortcut-drop-target',app).forEach(zone=>zone.classList.remove('is-shortcut-drop-target'));try{state.handle.releasePointerCapture(state.pointerId)}catch{}state=null};
    app.addEventListener('pointerdown',event=>{
      const handle=event.target.closest('[data-shortcut-drag-handle]');if(!handle)return;
      const row=handle.closest('[data-sidebar-route-row]');if(!row)return;
      event.preventDefault();state={handle,row,key:row.dataset.sidebarRouteRow,pointerId:event.pointerId};row.classList.add('is-dragging');try{handle.setPointerCapture(event.pointerId)}catch{}
    });
    app.addEventListener('pointermove',event=>{
      if(!state)return;const hit=document.elementFromPoint(event.clientX,event.clientY);$$('.is-shortcut-drop-target',app).forEach(zone=>zone.classList.remove('is-shortcut-drop-target'));
      const zone=hit?.closest('#studioSidebarShortcuts,#studioSidebarRest');if(zone)zone.classList.add('is-shortcut-drop-target');event.preventDefault();
    });
    app.addEventListener('pointerup',event=>{
      if(!state)return;const hit=document.elementFromPoint(event.clientX,event.clientY),shortcutZone=hit?.closest('#studioSidebarShortcuts'),restZone=hit?.closest('#studioSidebarRest'),target=hit?.closest('[data-sidebar-route-row]');
      const key=state.key;if(shortcutZone)moveNavigationShortcut(app,key,true,target?.dataset.sidebarRouteRow||'');else if(restZone)moveNavigationShortcut(app,key,false);clear();
    });
    app.addEventListener('pointercancel',clear);
  }

  function widgetId(el,index){return el.dataset.widgetId||el.id||(['profile-card','music-card','aura-card'].find(c=>el.classList.contains(c))||`widget-${index+1}`).replace(/-card$/,'')}
  function widgetLabel(el,id){return el.dataset.widgetLabel||$('h1,h2,.card-kicker',el)?.textContent?.trim()||id.replace(/[-_]/g,' ')}
  function widgetRoute(el,id){return el.dataset.widgetRoute||$('.arrow-btn[data-open]',el)?.dataset.open||id}
  const fullWidgetRoutes=new Set(['create','calendar','orbit','feed','connect','camera','diary','stream','library','archive','closet','trophies','rooms','room','boards','notes','projects','games','learn','didyouknow','map','tools']);
  function greenControlAction(route,id){
    if(route==='guest-check'||id==='guest-check')return {attribute:'data-open-guest="check"',label:'Open Guest Check'};
    if(fullWidgetRoutes.has(route))return {attribute:`data-open="${route}"`,label:`Open full ${route.replace(/[-_]/g,' ')} interface`};
    return {attribute:`data-open-widget-settings="${id}"`,label:'Open full widget customization interface'};
  }
  const greenSidebarWidgetIds=new Set(['music','aura','guest-check']);
  const widgetFallbackIcons={music:'♫',aura:'◌','guest-check':'✓'};
  function ensureRedWidgetDock(app){
    const rest=$('#studioSidebarRest',app);if(!rest)return null;
    let dock=$('#studioSidebarDockedWidgetDock',rest);
    if(!dock){dock=document.createElement('div');dock.id='studioSidebarDockedWidgetDock';dock.setAttribute('aria-label','Widgets closed from the Studio');rest.appendChild(dock)}
    return dock;
  }
  function restoreDockForWidget(app,widget,greenDock=$('#minimizedWidgetDock',app)){
    return greenSidebarWidgetIds.has(widget?.dataset?.widgetId||'')?greenDock:ensureRedWidgetDock(app);
  }
  function widgetIconMarkup(widget){
    if(!widget)return '';
    const id=widget.dataset.widgetId||widget.id||'',label=widget.dataset.widgetLabel||id.replace(/[-_]/g,' ');
    const source=$('.card-icon,.mailbox-mark,.studio-symbol-mark',widget);
    if(source){
      const markup=(source.matches('img,svg')?source.outerHTML:source.innerHTML).trim();
      if(markup)return markup;
      const text=source.textContent.trim();if(text)return text;
    }
    return widgetFallbackIcons[id]||(label.trim()[0]||'•').toUpperCase();
  }
  function shortcutButtonMarkup(widget){
    const id=widget.dataset.widgetId,label=widget.dataset.widgetLabel||id.replace(/[-_]/g,' '),route=widget.dataset.widgetRoute||id;
    const icon=widgetIconMarkup(widget);
    const row=document.createElement('div');row.className='sidebar-shortcut-row sidebar-widget-restore-row is-minimized';row.dataset.shortcutRow=id;row.dataset.widgetRoute=route;row.dataset.shortcutZone='minimized';row.title=`${label} · minimized from the Studio`;
    const spacer=document.createElement('span');spacer.setAttribute('aria-hidden','true');
    const restore=document.createElement('button');restore.type='button';restore.className='sidebar-shortcut-open';restore.dataset.restoreWidget=id;restore.title='Return '+label+' to the Studio';restore.setAttribute('aria-label','Return '+label+' to the Studio');
    const mark=document.createElement('span');mark.className='sidebar-route-icon';mark.setAttribute('aria-hidden','true');mark.innerHTML=icon;
    const state=document.createElement('span');state.className='sidebar-minimized-state';state.setAttribute('aria-hidden','true');state.textContent='↥';
    restore.append(mark);row.append(spacer,restore,state);return row;
  }
  function refreshMinimizedWidgetIcons(app){
    if(!app)return;
    $$('.sidebar-widget-restore-row[data-shortcut-row]',app).forEach(row=>{
      const id=row.dataset.shortcutRow||'',widget=id?$('[data-widget-id="'+CSS.escape(id)+'"]',app):null,mark=$('.sidebar-route-icon',row);if(!widget||!mark)return;
      const icon=widgetIconMarkup(widget);if(icon&&mark.innerHTML!==icon)mark.innerHTML=icon;
    });
  }
  function applyPreferredStudioSymbols(app){
    if(!app)return;
    const projectMarkup='<img class="studio-symbol-image biglwa-nav-project-symbol" src="/assets/projects-symbol.png?v=20260914-projects-1" alt="" aria-hidden="true">';
    const projectWidget=$('#projects',app);
    const projectIcon=projectWidget&&$('.card-icon,.studio-symbol-mark',projectWidget);
    if(projectIcon){projectIcon.innerHTML=projectMarkup;projectIcon.classList.add('studio-image-icon')}

    const libraryWidget=$('#library',app);
    const libraryEntry=navigationCatalog.get('library');
    let libraryMarkup=widgetIconMarkup(libraryWidget)||libraryEntry?.symbolHTML||'';
    if(!libraryMarkup||/^[◇◆◈▰•]+$/.test(String(libraryMarkup).replace(/<[^>]+>/g,'').trim()))libraryMarkup='<svg class="biglwa-library-fallback" viewBox="0 0 26 34" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="5" height="25" rx="1.5"/><path d="M8 7h3M8 26h3"/><rect x="11" y="6" width="5" height="24" rx="1.5"/><path d="M16 9h3M16 27h3"/><rect x="19" y="3" width="4" height="26" rx="1.4"/></g></svg>';
    const archiveMarkup='<span class="biglwa-archive-horizontal-symbol" aria-hidden="true">'+libraryMarkup+'</span>';
    const archiveWidget=$('#archive',app);
    const archiveIcon=archiveWidget&&$('.card-icon,.studio-symbol-mark',archiveWidget);
    if(archiveIcon)archiveIcon.innerHTML=archiveMarkup;

    const projectEntry=navigationCatalog.get('projects');if(projectEntry)projectEntry.symbolHTML=projectMarkup;
    const archiveEntry=navigationCatalog.get('archive');if(archiveEntry)archiveEntry.symbolHTML=archiveMarkup;
  }
  function refreshNavigationCatalogFromWidgets(app){
    if(!app)return;
    applyPreferredStudioSymbols(app);
    navigationCatalog.forEach((entry,key)=>{
      const widget=$('[data-widget-route="'+CSS.escape(key)+'"]',app)||$('#'+CSS.escape(key),app)||(key==='rooms'?$('#room',app):key==='room'?$('#rooms',app):null);
      const icon=widgetIconMarkup(widget);if(icon)entry.symbolHTML=icon;
    });
    applyPreferredStudioSymbols(app);
  }
  function syncPrimaryWidgetDock(app){
    if(!app)return;
    const primary=$('#studioSidebarPrimary',app),rest=$('#studioSidebarRest',app),greenDock=$('#minimizedWidgetDock',primary||app),redDock=ensureRedWidgetDock(app);if(!primary||!greenDock)return;
    $$('.sidebar-widget-restore-row[data-shortcut-row]',app).forEach(row=>{
      const target=greenSidebarWidgetIds.has(row.dataset.shortcutRow||'')?greenDock:redDock;
      if(target&&row.parentElement!==target)target.appendChild(row);
    });
    refreshMinimizedWidgetIcons(app);
    primary.hidden=!$('[data-shortcut-row]',greenDock);
    if(rest)rest.hidden=!$('[data-sidebar-route-row]',rest)&&!$('[data-shortcut-row]',redDock);
  }
  function setSidebarCurrent(app,key=''){
    const normalized=String(key||'').replace(/^#/,'').toLowerCase();
    app.dataset.currentStudioRoute=normalized;
    $$('.sidebar-route-control,.sidebar-shortcut-open,.sidebar-navigation-open,.hero-action-bar a,.hero-action-bar button',app).forEach(control=>{
      const controlKey=(control.dataset.sidebarWidget||control.dataset.sidebarRoute||control.dataset.shortcutRoute||control.dataset.widgetRoute||control.dataset.open||(control.getAttribute('href')||'').replace(/^#/, '')||(control.id==='mobileCreate'?'create':'')).toLowerCase();
      const current=!!normalized&&(controlKey===normalized||(normalized==='rooms'&&controlKey==='room')||(normalized==='create'&&controlKey==='desk'));
      control.classList.toggle('is-current',current);
      if(current)control.setAttribute('aria-current','page');else control.removeAttribute('aria-current');
    });
  }
  function showShortcutStatus(app,message){
    const status=$('.sidebar-shortcut-status',app);if(!status)return;status.textContent=message;clearTimeout(status._clearTimer);status._clearTimer=setTimeout(()=>{status.textContent=''},2600);
  }
  function openWidgetDestination(app,id,route=''){
    const widget=id?$('[data-widget-id="'+CSS.escape(id)+'"]',app):null;
    const destination=(route||widget?.dataset.widgetRoute||id||'').toLowerCase();
    if(destination==='home'||destination==='studio'){$('.hero-action-bar a[href="#home"]',app)?.click();setSidebarCurrent(app,'home');return}
    if(destination==='guest-check'||id==='guest-check'){$('[data-open-guest="check"]',widget||app)?.click();setSidebarCurrent(app,'guest-check');return}
    if(fullWidgetRoutes.has(destination)&&typeof window.openBIGLWAModule==='function'){window.openBIGLWAModule(destination);setSidebarCurrent(app,destination);return}
    if(destination==='profile'||destination==='profile-card'||destination==='aura'||destination==='music'||widget){
      const edit=$('#editProfileBtn',app);if(edit&&!$('.profile-card',app)?.classList.contains('profile-is-editing'))edit.click();
      setTimeout(()=>{$('[data-profile-editor-tab="widgets"]',app)?.click();setSidebarCurrent(app,destination==='aura'||destination==='music'?destination:'profile')},0);
    }
  }
  function ensureControls(){
    const widgets=$$('#studioApp .profile-card,#studioApp .customizable-widget,#studioApp .masonry .card:not(.manifesto-card)');
    widgets.forEach((el,index)=>{
      const id=widgetId(el,index),label=widgetLabel(el,id),route=widgetRoute(el,id);
      el.dataset.widgetId=id;el.dataset.widgetLabel=label;el.dataset.widgetRoute=route;
      let controls=$(':scope > .widget-window-controls',el);if(!controls){controls=document.createElement('div');el.prepend(controls)}
      controls.className='widget-window-controls';controls.dataset.canonicalControls='1';controls.setAttribute('aria-label',`${label} window controls`);
      const green=greenControlAction(route,id);
      controls.innerHTML=`<button class="window-light green" type="button" ${green.attribute} aria-label="${green.label}" title="${green.label}"></button><button class="window-light yellow" type="button" data-minimize-widget="${id}" aria-label="Minimize ${label}" title="Minimize ${label}"></button><button class="window-light red" type="button" data-dock-widget="${id}" aria-label="Move ${label} to left toolbar" title="Move to left toolbar"></button>`;
      $$('.arrow-btn',el).forEach(b=>b.style.display='none');
      let handle=$('[data-studio-drag-handle]',el);
      if(!handle){
        handle=document.createElement('button');handle.type='button';handle.className='widget-drag-handle';handle.dataset.studioDragHandle='1';handle.setAttribute('aria-label','Move '+label);handle.title='Drag to reorder';handle.innerHTML='<svg viewBox="0 0 12 12" aria-hidden="true"><circle cx="3" cy="3" r="1" fill="currentColor"/><circle cx="9" cy="3" r="1" fill="currentColor"/><circle cx="3" cy="9" r="1" fill="currentColor"/><circle cx="9" cy="9" r="1" fill="currentColor"/></svg>';
      }
      if(handle.parentElement!==el)el.prepend(handle);
    });
  }

  function bindStableStudioInteractions(){
    if(document.documentElement.dataset.biglwaStableInteractions==='1')return;
    document.documentElement.dataset.biglwaStableInteractions='1';
    const widgetSelector='.profile-card,.customizable-widget,.masonry .card:not(.manifesto-card)';
    const getApp=()=>$('#studioApp');
    const syncDock=(dock,section)=>{if(section)section.hidden=!$('[data-shortcut-row]',dock)};
    const ensureDock=app=>{
      let section=$('#studioSidebarPrimary',app),mount=$('#minimizedWidgets',app),dock=$('#minimizedWidgetDock',app);
      if(!section){section=document.createElement('section');section.id='studioSidebarPrimary';section.className='sidebar-section sidebar-primary-widgets';section.setAttribute('aria-label','Widgets minimized from the Studio');const shortcuts=$('#studioSidebarShortcuts',app),top=$('.sidebar-top',app)||app;if(shortcuts)shortcuts.insertAdjacentElement('beforebegin',section);else top.appendChild(section)}
      if(!mount){mount=document.createElement('div');mount.id='minimizedWidgets';mount.className='minimized-widgets';mount.setAttribute('aria-label','Widgets closed from the Studio');mount.innerHTML='<div class="minimized-label" aria-hidden="true"></div>';section.appendChild(mount)}
      if(mount.parentElement!==section)section.appendChild(mount);
      if(!dock){dock=document.createElement('div');dock.id='minimizedWidgetDock';dock.className='minimized-widget-dock';mount.appendChild(dock)}
      return {section,dock};
    };
    const saveMinimized=app=>writeWidgetShortcuts($$(widgetSelector,app).filter(widget=>widget.classList.contains('widget-is-minimized')).map(widget=>widget.dataset.widgetId).filter(Boolean));
    const addRestore=(app,widget)=>{
      const id=widget.dataset.widgetId;if(!id)return;
      const {dock:greenDock}=ensureDock(app),dock=restoreDockForWidget(app,widget,greenDock);
      if(!dock||$('[data-shortcut-row="'+CSS.escape(id)+'"]',app))return true;
      dock.appendChild(shortcutButtonMarkup(widget));saveMinimized(app);syncPrimaryWidgetDock(app);return true;
    };
    const restoreWidget=(app,id,row)=>{
      const widget=id?$('[data-widget-id="'+CSS.escape(id)+'"]',app):null;
      if(widget){widget.classList.remove('widget-is-minimized','widget-is-docked');const green=$('[data-expand-widget]',widget);if(green)green.setAttribute('aria-pressed','false')}
      if(row)row.remove();
      const {section,dock}=ensureDock(app);syncDock(dock,section);saveMinimized(app);syncPrimaryWidgetDock(app);
    };
    const setTheme=mode=>{
      const isDark=mode==='dark';document.body.classList.toggle('night-mode',isDark);
      const light=$('#lightModeBtn'),dark=$('#darkModeBtn');
      if(light)light.setAttribute('aria-pressed',isDark?'false':'true');
      if(dark)dark.setAttribute('aria-pressed',isDark?'true':'false');
      try{localStorage.setItem('biglwaTheme',mode)}catch{}
    };
    const toggleEditorFallback=button=>{
      const card=button.closest('.profile-card'),panel=card?($('#wallpaperPanel',card)||$('#wallpaperPanel')):$('#wallpaperPanel');
      const opening=!card?.classList.contains('profile-is-editing');
      if(card)card.classList.toggle('profile-is-editing',opening);
      if(panel){panel.hidden=!opening;panel.classList.toggle('panel-hidden',!opening)}
      button.setAttribute('aria-expanded',opening?'true':'false');button.textContent=opening?'Cancel':'Edit profile';
    };
    document.addEventListener('click',event=>{
      const target=event.target&&event.target.closest?event.target.closest('button,a'):null;if(!target)return;
      if(target.id==='lightModeBtn'||target.dataset.theme==='light'){event.preventDefault();event.stopImmediatePropagation();setTheme('light');return}
      if(target.id==='darkModeBtn'||target.dataset.theme==='dark'){event.preventDefault();event.stopImmediatePropagation();setTheme('dark');return}
      const app=getApp();if(!app||!app.contains(target))return;
      const sidebarWidget=target.closest('[data-sidebar-widget]');
      if(sidebarWidget){event.preventDefault();event.stopImmediatePropagation();const id=sidebarWidget.dataset.sidebarWidget,widget=$('[data-widget-id="'+CSS.escape(id)+'"]',app);if(widget?.classList.contains('widget-is-minimized')){restoreWidget(app,id,$('[data-shortcut-row="'+CSS.escape(id)+'"]',app));return}openWidgetDestination(app,id,id);return}
      const sidebarRoute=target.closest('[data-sidebar-route]');
      if(sidebarRoute&&!sidebarRoute.dataset.policyRoute){event.preventDefault();event.stopImmediatePropagation();openWidgetDestination(app,sidebarRoute.dataset.sidebarRoute,sidebarRoute.dataset.sidebarRoute);return}
      const removeShortcut=target.closest('[data-remove-shortcut]');
      if(removeShortcut){event.preventDefault();event.stopImmediatePropagation();moveNavigationShortcut(app,removeShortcut.dataset.removeShortcut,false);return}
      const addShortcut=target.closest('[data-add-shortcut]');
      if(addShortcut){event.preventDefault();event.stopImmediatePropagation();moveNavigationShortcut(app,addShortcut.dataset.addShortcut,true);return}
      const shortcut=target.closest('[data-widget-shortcut]');
      if(shortcut){event.preventDefault();event.stopImmediatePropagation();openWidgetDestination(app,shortcut.dataset.widgetShortcut,shortcut.dataset.widgetRoute);return}
      if(target.id==='editProfileBtn'){
        if(target.dataset.biglwaProfileBound==='3')return;
        event.preventDefault();event.stopImmediatePropagation();toggleEditorFallback(target);return;
      }
      const restore=target.closest('[data-restore-widget]');
      if(restore){event.preventDefault();event.stopImmediatePropagation();restoreWidget(app,restore.dataset.restoreWidget,restore.closest('[data-shortcut-row]')||restore);return}
      const control=target.closest('.widget-window-controls [data-expand-widget],.widget-window-controls [data-open-widget-settings],.widget-window-controls [data-minimize-widget],.widget-window-controls [data-dock-widget]');
      if(!control)return;
      event.preventDefault();event.stopImmediatePropagation();
      const widget=control.closest(widgetSelector);if(!widget)return;
      if(control.matches('[data-expand-widget],[data-open-widget-settings]')){
        if(control.hasAttribute('data-open-widget-settings')){
          const edit=$('#editProfileBtn',app);if(edit)edit.click();
          setTimeout(()=>{$('[data-profile-editor-tab="widgets"]',app)?.click()},0);
          return;
        }
        widget.classList.remove('widget-is-minimized','widget-is-docked');
        const opening=!widget.classList.contains('widget-is-expanded');$$('.widget-is-expanded',app).forEach(item=>item.classList.remove('widget-is-expanded'));widget.classList.toggle('widget-is-expanded',opening);control.setAttribute('aria-pressed',opening?'true':'false');
        saveMinimized(app);return;
      }
      if(control.matches('[data-minimize-widget]')){
        widget.classList.remove('widget-is-expanded');
        const green=$('[data-expand-widget]',widget);if(green)green.setAttribute('aria-pressed','false');
        return;
      }
      const {section,dock}=ensureDock(app);
      const added=addRestore(app,widget);if(!added)return;
      widget.classList.remove('widget-is-expanded');widget.classList.add('widget-is-minimized','widget-is-docked');
      syncDock(dock,section);saveMinimized(app);syncPrimaryWidgetDock(app);
    },true);
    try{setTheme(localStorage.getItem('biglwaTheme')==='dark'?'dark':'light')}catch{setTheme('light')}
    document.addEventListener('biglwa:module-open',event=>{const app=getApp();if(app)setSidebarCurrent(app,event.detail?.key||'')});
    document.addEventListener('biglwa:module-close',()=>{const app=getApp();if(app)setSidebarCurrent(app,'')});
  }

  function ensureWidgetActions(){
    const app=$('#studioApp'),sidebar=$('#studioApp .sidebar');if(!app)return;
    let minimizedSection=sidebar?$('#studioSidebarPrimary',sidebar):$('#studioSidebarPrimary',app);
    let minimizedMount=sidebar?$('#minimizedWidgets',sidebar):$('#minimizedWidgets',app);
    let dock=sidebar?$('#minimizedWidgetDock',sidebar):$('#minimizedWidgetDock',app);
    if(!dock){
      if(!minimizedSection){minimizedSection=document.createElement('section');minimizedSection.id='studioSidebarPrimary';minimizedSection.className='sidebar-section sidebar-primary-widgets';minimizedSection.setAttribute('aria-label','Widgets minimized from the Studio');const shortcuts=$('#studioSidebarShortcuts',sidebar||app),top=$('.sidebar-top',sidebar)||sidebar||app;if(shortcuts)shortcuts.insertAdjacentElement('beforebegin',minimizedSection);else top.appendChild(minimizedSection)}
      if(!minimizedMount){minimizedMount=document.createElement('div');minimizedMount.id='minimizedWidgets';minimizedMount.className='minimized-widgets';minimizedMount.setAttribute('aria-label','Widgets closed from the Studio');minimizedMount.innerHTML='<div class="minimized-label" aria-hidden="true"></div>';minimizedSection.appendChild(minimizedMount)}
      dock=document.createElement('div');dock.id='minimizedWidgetDock';dock.className='minimized-widget-dock';minimizedMount.appendChild(dock);
    }
    if(minimizedMount&&minimizedMount.parentElement!==minimizedSection)minimizedSection.appendChild(minimizedMount);
    const syncDock=()=>syncPrimaryWidgetDock(app);
    const selector='.profile-card,.customizable-widget,.masonry .card:not(.manifesto-card)';
    const widgets=$$(selector,app);
    const minimized=readWidgetShortcuts();
    const saveMinimized=()=>writeWidgetShortcuts($$(selector,app).filter(widget=>widget.classList.contains('widget-is-minimized')).map(widget=>widget.dataset.widgetId).filter(Boolean));
    const addRestore=widget=>{
      const id=widget.dataset.widgetId,targetDock=restoreDockForWidget(app,widget,dock);if(!id||!targetDock||$('[data-shortcut-row="'+CSS.escape(id)+'"]',app))return true;
      targetDock.appendChild(shortcutButtonMarkup(widget));syncDock();saveMinimized();return true;
    };
    widgets.forEach((widget,index)=>{
      if(!widget.dataset.widgetId)widget.dataset.widgetId=widgetId(widget,index);
      if(!widget.dataset.widgetLabel)widget.dataset.widgetLabel=widgetLabel(widget,widget.dataset.widgetId);
      if(minimized.includes(widget.dataset.widgetId)){widget.classList.add('widget-is-minimized','widget-is-docked');addRestore(widget)}else{widget.classList.remove('widget-is-minimized','widget-is-docked')}
    });
    $$('.sidebar-widget-restore-row[data-shortcut-row]',app).forEach(row=>{if(!$('[data-widget-id="'+CSS.escape(row.dataset.shortcutRow||'')+'"]',app))row.remove()});
    saveMinimized();
    syncDock();syncPrimaryWidgetDock(app);
    if(document.documentElement.dataset.biglwaWidgetCaptureBound!=='1'){
      document.documentElement.dataset.biglwaWidgetCaptureBound='1';
      document.addEventListener('click',event=>{
        const control=event.target.closest('[data-expand-widget],[data-minimize-widget],[data-rearrange-widget],[data-dock-widget],[data-restore-widget]');
        if(!control||!app.contains(control))return;
        event.preventDefault();event.stopImmediatePropagation();
        if(control.matches('[data-restore-widget]')){
          const widget=$('[data-widget-id="'+CSS.escape(control.dataset.restoreWidget)+'"]',app);
          if(widget)widget.classList.remove('widget-is-minimized','widget-is-docked');
          control.closest('[data-shortcut-row]')?.remove();saveMinimized();syncDock();syncPrimaryWidgetDock(app);return;
        }
        const widget=control.closest(selector);if(!widget)return;
        if(control.matches('[data-expand-widget]')){
          const opening=!widget.classList.contains('widget-is-expanded');
          $$('.widget-is-expanded',app).forEach(w=>w.classList.remove('widget-is-expanded'));
          widget.classList.toggle('widget-is-expanded',opening);
          control.setAttribute('aria-pressed',opening?'true':'false');
          return;
        }
        if(control.matches('[data-minimize-widget]')){widget.classList.remove('widget-is-expanded');const green=$('[data-expand-widget]',widget);if(green)green.setAttribute('aria-pressed','false');return}
        if(control.matches('[data-rearrange-widget]')){
          const active=!app.classList.contains('biglwa-rearrange-mode');
          app.classList.toggle('biglwa-rearrange-mode',active);
          $$(selector,app).forEach(w=>w.draggable=active);
          $$('[data-rearrange-widget]',app).forEach(b=>b.setAttribute('aria-pressed',active?'true':'false'));
          return;
        }
        widget.classList.remove('widget-is-expanded');
        widget.classList.add('widget-is-minimized');
        addRestore(widget);saveMinimized();syncPrimaryWidgetDock(app);
      },true);
    }
    if(app.dataset.widgetActionsBound==='1')return;app.dataset.widgetActionsBound='1';
    let dragging=null;
    app.addEventListener('click',event=>{
      const restore=event.target.closest('[data-restore-widget]');
      if(restore){const widget=$('[data-widget-id="'+CSS.escape(restore.dataset.restoreWidget)+'"]',app);if(widget)widget.classList.remove('widget-is-minimized','widget-is-docked');restore.closest('[data-shortcut-row]')?.remove();saveMinimized();syncDock();syncPrimaryWidgetDock(app);return}
      const green=event.target.closest('[data-expand-widget]');
      if(green){event.preventDefault();event.stopPropagation();const widget=green.closest(selector);if(!widget)return;const opening=!widget.classList.contains('widget-is-expanded');$$('.widget-is-expanded',app).forEach(w=>w.classList.remove('widget-is-expanded'));widget.classList.toggle('widget-is-expanded',opening);green.setAttribute('aria-pressed',opening?'true':'false');return}
      const minimize=event.target.closest('[data-minimize-widget]');
      if(minimize){event.preventDefault();event.stopPropagation();const widget=minimize.closest(selector);if(!widget)return;widget.classList.remove('widget-is-expanded');const green=$('[data-expand-widget]',widget);if(green)green.setAttribute('aria-pressed','false');return}
      const yellow=event.target.closest('[data-rearrange-widget]');
      if(yellow){event.preventDefault();event.stopPropagation();const active=!app.classList.contains('biglwa-rearrange-mode');app.classList.toggle('biglwa-rearrange-mode',active);$$(selector,app).forEach(w=>w.draggable=false);$$('[data-rearrange-widget]',app).forEach(b=>b.setAttribute('aria-pressed',active?'true':'false'));return}
      const red=event.target.closest('[data-dock-widget]');
      if(red){event.preventDefault();event.stopPropagation();const widget=red.closest(selector);if(!widget)return;widget.classList.remove('widget-is-expanded');widget.classList.add('widget-is-minimized','widget-is-docked');addRestore(widget);saveMinimized();syncPrimaryWidgetDock(app);return}
    });
    const orderKey='biglwaWidgetOrder';
    const readOrder=()=>{try{return JSON.parse(localStorage.getItem(orderKey)||'{}')}catch{return{}}};
    const writeOrder=()=>{
      const order=readOrder();
      $$(selector,app).forEach(w=>{
        const p=w.parentNode;if(!p||!p.id)return;
        const id=w.dataset.widgetId;if(!id)return;
        if(!order[p.id])order[p.id]=[];
        const list=order[p.id];
        if(!list.includes(id))list.push(id);
      });
      Object.keys(order).forEach(k=>{if(!$('#'+CSS.escape(k),app))delete order[k]});
      try{localStorage.setItem(orderKey,JSON.stringify(order))}catch{}
    };
    const savedOrder=readOrder();
    Object.keys(savedOrder).forEach(key=>{
      const parent=$('#'+CSS.escape(key),app);if(!parent)return;
      savedOrder[key].forEach(id=>{const w=$('[data-widget-id="'+CSS.escape(id)+'"]',app);if(w&&w.parentNode===parent)parent.appendChild(w)});
    });
    let dragStart=null,ghost=null,dragMove=0,dragSlot=null,dragOffX=0,dragOffY=0;
    app.addEventListener('pointerdown',event=>{
      if(!app.classList.contains('biglwa-rearrange-mode'))return;
      if(event.target.closest('.widget-window-controls,button,a,input,textarea,select,[data-restore-widget]'))return;
      const widget=event.target.closest(selector);if(!widget)return;
      const r=widget.getBoundingClientRect();
      dragStart={widget,x:event.clientX,y:event.clientY,parent:widget.parentNode};
      dragOffX=event.clientX-(r.left-8);dragOffY=event.clientY-(r.top-8);
      dragMove=0;
    });
    app.addEventListener('pointermove',event=>{
      if(!dragStart)return;
      const dx=event.clientX-dragStart.x,dy=event.clientY-dragStart.y;
      if(dragMove===0&&Math.hypot(dx,dy)<6)return;
      if(dragMove===0){
        dragMove=1;
        const r=dragStart.widget.getBoundingClientRect();
        ghost=dragStart.widget.cloneNode(true);ghost.classList.add('biglwa-drag-ghost');ghost.classList.remove('widget-dragging','biglwa-drop-slot');
        ghost.style.width=r.width+'px';ghost.style.height=r.height+'px';ghost.style.left=(r.left-8)+'px';ghost.style.top=(r.top-8)+'px';ghost.style.margin='0';
        document.body.appendChild(ghost);
        dragStart.widget.classList.add('widget-dragging');
      }
      ghost.style.left=(event.clientX-dragOffX)+'px';
      ghost.style.top=(event.clientY-dragOffY)+'px';
      const hit=document.elementFromPoint(event.clientX,event.clientY);
      const target=hit&&hit.closest(selector);
      if(dragSlot&&dragSlot!==target)dragSlot.classList.remove('biglwa-drop-slot');
      dragSlot=null;
      if(target&&target!==dragStart.widget&&target.parentNode===dragStart.parent){dragSlot=target;target.classList.add('biglwa-drop-slot')}
      event.preventDefault();
    });
    app.addEventListener('pointerup',event=>{
      if(!dragStart)return;
      dragStart.widget.classList.remove('widget-dragging');
      const widget=dragStart.widget,parent=dragStart.parent;
      if(dragMove&&dragSlot){
        const before=event.clientY<dragSlot.getBoundingClientRect().top+dragSlot.getBoundingClientRect().height/2;
        parent.insertBefore(widget,before?dragSlot:dragSlot.nextSibling);
        writeOrder();
      }
      if(dragSlot)dragSlot.classList.remove('biglwa-drop-slot');
      if(ghost&&ghost.parentNode)ghost.parentNode.removeChild(ghost);
      ghost=null;dragSlot=null;dragStart=null;dragMove=0;
    });
    app.addEventListener('pointercancel',()=>{if(dragStart)dragStart.widget.classList.remove('widget-dragging');if(dragSlot)dragSlot.classList.remove('biglwa-drop-slot');if(ghost&&ghost.parentNode)ghost.parentNode.removeChild(ghost);ghost=null;dragSlot=null;dragStart=null;dragMove=0});
  }

  function renderWeeklyMood(card,text='add this week’s #mood',style='qwiky-note'){
    if(!card)return;
    const allowed=new Set(['diary','widget','qwiky-note']);
    card.dataset.moodStyle=allowed.has(style)?style:'qwiky-note';
    const value=$('.weekly-mood-value',card);if(value)value.textContent=text||'add this week’s #mood';
  }

  function renderAuraCopy(text='Focused\nbut dreaming.'){
    const copy=$('#studioApp .aura-card p');if(!copy)return;
    const lines=String(text||'Focused\nbut dreaming.').split(/\n+/).map(line=>line.trim()).filter(Boolean);
    copy.replaceChildren();
    const lead=document.createElement('strong');lead.textContent=lines.shift()||'Focused';copy.appendChild(lead);
    if(lines.length)copy.appendChild(document.createElement('br'),document.createTextNode(lines.join(' ')));
  }

  function ensureProfileEditor(){
    const card=$('#studioApp .profile-card'); if(!card)return;
    card.style.visibility='visible';card.style.opacity='1';
    const eyebrow=$('.profile-copy > .eyebrow',card);if(eyebrow)eyebrow.remove();
    const copy=$('.profile-copy',card);
    const handle=$('.profile-name-line h1',card);
    const bio=$('.bio',card);
    const meta=$('.meta-row',card);
    let rail=$('.profile-identity-rail',card);
    if(!rail){
      rail=document.createElement('div');rail.className='profile-identity-rail';
      const avatar=$('.profile-avatar',card);if(avatar)rail.appendChild(avatar);
      card.prepend(rail);
    }
    let railLocation=$('.profile-rail-location',rail);
    if(!railLocation){railLocation=document.createElement('div');railLocation.className='profile-rail-location';railLocation.textContent=meta&&$('span',meta)?$('span',meta).textContent.replace(/^⌖\s*/,''):'';rail.appendChild(railLocation)}
    let moodCard=$('#weeklyMoodCard',rail);
    if(!moodCard){moodCard=document.createElement('div');moodCard.id='weeklyMoodCard';moodCard.className='weekly-mood-card';moodCard.innerHTML='<span>this week’s #mood</span><strong class="weekly-mood-value">add this week’s #mood</strong>';rail.appendChild(moodCard)}
    if(!moodCard.dataset.moodStyle)renderWeeklyMood(moodCard,$('.weekly-mood-value',moodCard)?.textContent||'add this week’s #mood','qwiky-note');
    const stats=$('.stats',card);
    if(stats&&!$('[data-profile-stat="projects"]',stats)){
      const projects=document.createElement('span');projects.dataset.profileStat='projects';projects.innerHTML='<b>24</b> Projects';
      const rooms=document.createElement('span');rooms.dataset.profileStat='rooms';rooms.innerHTML='<b>3</b> Rooms';
      stats.append(projects,rooms);
    }
    let display=$('.profile-display-name',card);
    if(!display&&copy){display=document.createElement('h2');display.className='profile-display-name';display.textContent='Leian Stanley';copy.prepend(display)}
    let saved=null;try{saved=JSON.parse(localStorage.getItem('biglwaProfileDetails')||'null')}catch{}
    if(saved){
      if(display&&saved.name)display.textContent=saved.name;
      if(handle&&saved.username)handle.textContent='@'+saved.username.replace(/^@/,'');
      if(bio&&saved.bio)bio.textContent=saved.bio;
      if(meta){
        const location=$('span',meta),website=$('a',meta);
        if(location&&saved.location)location.textContent='⌖ '+saved.location;const railLocation=$('.profile-rail-location',card);if(railLocation&&saved.location)railLocation.textContent=saved.location;
        if(website&&saved.website){website.textContent=saved.website;website.href=/^https?:\/\//.test(saved.website)?saved.website:'https://'+saved.website}
      }
      renderWeeklyMood(moodCard,saved.mood,saved.moodStyle);
      if(saved.auraText)renderAuraCopy(saved.auraText);
    }
    const panel=$('#wallpaperPanel');if(!panel)return;
    panel.classList.remove('wallpaper-panel','glass');
    panel.classList.add('profile-inline-editor');
    panel.dataset.inlineProfileEditor='1';
    panel.setAttribute('aria-label','Edit profile and Studio appearance');
    if(panel.parentNode!==card)card.appendChild(panel);
    const panelTitle=$('.panel-title',panel),panelTitleText=panelTitle&&$('strong',panelTitle);if(panelTitleText)panelTitleText.textContent='Edit profile';
    let profileSection=$('#profileDetailsEditor',panel);
    if(!profileSection){
      profileSection=document.createElement('div');profileSection.className='customize-section profile-details-section';profileSection.id='profileDetailsEditor';
      profileSection.innerHTML='<h3>Profile details</h3><p>Edit the identity and biography shown on your card.</p><div class="profile-editor-grid"><label>Display name<input id="profileNameInput" maxlength="60" autocomplete="name"></label><label>Username<input id="profileUsernameInput" maxlength="30" autocomplete="username"></label><label class="full">Bio<textarea id="profileBioEditor" rows="3" maxlength="300"></textarea></label><label>Location<input id="profileLocationInput" maxlength="80"></label><label>Website<input id="profileWebsiteInput" maxlength="160" inputmode="url"></label><label class="full">This week’s #mood<input id="profileMoodInput" maxlength="80" placeholder="soft launch, big dreams…"></label><label>Mood card style<select id="profileMoodStyle"><option value="qwiky-note">Qwiky Note</option><option value="diary">Diary</option><option value="widget">Widget</option></select></label></div>';
      if(panelTitle)panelTitle.insertAdjacentElement('afterend',profileSection);else panel.prepend(profileSection);
    }
    $('#profileMoodPreview',profileSection)?.remove();
    profileSection.dataset.profileEditorPane='profile';profileSection.setAttribute('role','tabpanel');
    let mediaSection=$('#profileMediaEditor',panel);
    if(!mediaSection){mediaSection=document.createElement('div');mediaSection.id='profileMediaEditor';mediaSection.className='customize-section profile-media-section';mediaSection.dataset.profileEditorPane='media';mediaSection.setAttribute('role','tabpanel');mediaSection.innerHTML='<h3>Song &amp; Aura</h3><p>Choose the song shown on your card and write the words beneath your Aura.</p><div id="profileSongEditorMount" class="profile-song-editor-mount"><span class="profile-song-editor-wait">Song controls are connecting…</span></div><label class="profile-aura-text-label">Aura text<textarea id="profileAuraTextInput" rows="2" maxlength="100" placeholder="Focused&#10;but dreaming."></textarea></label>';panel.appendChild(mediaSection)}
    const sections=$$('.customize-section',panel),wallpaperSection=sections.find(section=>section!==profileSection&&section!==mediaSection&&!section.classList.contains('widget-style-section')),widgetSection=sections.find(section=>section.classList.contains('widget-style-section'));
    if(wallpaperSection){wallpaperSection.id=wallpaperSection.id||'profileWallpaperEditor';wallpaperSection.dataset.profileEditorPane='wallpaper';wallpaperSection.setAttribute('role','tabpanel')}
    if(widgetSection){widgetSection.id=widgetSection.id||'profileWidgetEditor';widgetSection.dataset.profileEditorPane='widgets';widgetSection.setAttribute('role','tabpanel')}
    let tabs=$('#profileEditorTabs',panel);
    if(!tabs){tabs=document.createElement('div');tabs.id='profileEditorTabs';tabs.className='profile-editor-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Profile editor sections');tabs.innerHTML='<button type="button" role="tab" aria-controls="profileDetailsEditor" data-profile-editor-tab="profile">Profile</button><button type="button" role="tab" aria-controls="profileMediaEditor" data-profile-editor-tab="media">Song &amp; Aura</button><button type="button" role="tab" aria-controls="profileWallpaperEditor" data-profile-editor-tab="wallpaper">Wallpaper</button><button type="button" role="tab" aria-controls="profileWidgetEditor" data-profile-editor-tab="widgets">Widgets &amp; colors</button>';if(panelTitle)panelTitle.insertAdjacentElement('afterend',tabs);else panel.prepend(tabs)}
    if(!tabs.querySelector('[data-profile-editor-tab="media"]')){const mediaTab=document.createElement('button');mediaTab.type='button';mediaTab.setAttribute('role','tab');mediaTab.setAttribute('aria-controls','profileMediaEditor');mediaTab.dataset.profileEditorTab='media';mediaTab.textContent='Song & Aura';tabs.querySelector('[data-profile-editor-tab="wallpaper"]')?.insertAdjacentElement('beforebegin',mediaTab)}
    let actions=$('#profileEditorActions',panel);
    if(!actions){actions=document.createElement('div');actions.id='profileEditorActions';actions.className='profile-editor-actions';panel.appendChild(actions)}
    let saveAction=$('#saveProfileBtn',actions);if(!saveAction){saveAction=document.createElement('button');saveAction.type='button';saveAction.className='secondary-btn profile-editor-save';saveAction.id='saveProfileBtn';saveAction.textContent='Save changes';actions.appendChild(saveAction)}
    let cancelAction=$('#cancelProfileBtn',actions);if(!cancelAction){cancelAction=document.createElement('button');cancelAction.type='button';cancelAction.className='secondary-btn profile-editor-cancel';cancelAction.id='cancelProfileBtn';cancelAction.textContent='Cancel';actions.appendChild(cancelAction)}
    let updatePrivacy=$('#profileUpdatePrivacy',actions);
    if(!updatePrivacy){
      updatePrivacy=document.createElement('label');updatePrivacy.id='profileUpdatePrivacy';updatePrivacy.className='profile-update-privacy';
      updatePrivacy.innerHTML='<input id="profileSilentUpdate" type="checkbox"><span>Do not notify followers/connections of this update</span>';
      actions.prepend(updatePrivacy);
    }
    if(actions.previousElementSibling!==tabs)tabs.insertAdjacentElement('afterend',actions);
    actions.hidden=false;saveAction.hidden=false;cancelAction.hidden=false;
    const showTab=key=>{$$('[data-profile-editor-pane]',panel).forEach(pane=>{pane.hidden=pane.dataset.profileEditorPane!==key});$$('[data-profile-editor-tab]',tabs).forEach(tab=>{const active=tab.dataset.profileEditorTab===key;tab.setAttribute('aria-selected',active?'true':'false');tab.tabIndex=active?0:-1})};
    if(tabs.dataset.biglwaTabsBound!=='1'){tabs.dataset.biglwaTabsBound='1';tabs.addEventListener('click',event=>{const tab=event.target.closest('[data-profile-editor-tab]');if(tab)showTab(tab.dataset.profileEditorTab)})}
    const syncMoodPreview=()=>renderWeeklyMood(moodCard,$('#profileMoodInput',panel)?.value.trim()||'add this week’s #mood',$('#profileMoodStyle',panel)?.value||'qwiky-note');
    if(profileSection.dataset.biglwaMoodPreviewBound!=='1'){
      profileSection.dataset.biglwaMoodPreviewBound='1';
      profileSection.addEventListener('input',event=>{if(event.target.matches('#profileMoodInput,#profileMoodStyle'))syncMoodPreview()});
      profileSection.addEventListener('change',event=>{if(event.target.matches('#profileMoodInput,#profileMoodStyle'))syncMoodPreview()});
    }
    const fillEditor=()=>{
      $('#profileNameInput',panel).value=display?display.textContent.trim():'';
      $('#profileUsernameInput',panel).value=handle?handle.textContent.trim().replace(/^@/,''):'';
      $('#profileBioEditor',panel).value=bio?bio.textContent.trim():'';
      const loc=meta&&$('span',meta),web=meta&&$('a',meta);
      $('#profileLocationInput',panel).value=loc?loc.textContent.replace(/^⌖\s*/,'').trim():'';
      $('#profileWebsiteInput',panel).value=web?web.textContent.trim():'';
      const moodValue=$('.weekly-mood-value',moodCard)?.textContent||'';
      $('#profileMoodInput',panel).value=moodValue==='add this week’s #mood'?'':moodValue;
      $('#profileMoodStyle',panel).value=moodCard.dataset.moodStyle||'qwiky-note';
      const aura=$('#studioApp .aura-card p');$('#profileAuraTextInput',panel).value=aura?aura.innerText.trim():'Focused\nbut dreaming.';
      syncMoodPreview();
    };
    let button=$('#editProfileBtn',card),moodBeforeEdit=null;
    const endEdit=()=>{card.classList.remove('profile-is-editing');panel.classList.add('panel-hidden');panel.hidden=true;button?.setAttribute('aria-expanded','false');if(button)button.textContent='Edit profile'};
    const cancelEdit=()=>{if(moodBeforeEdit){renderWeeklyMood(moodCard,moodBeforeEdit.text,moodBeforeEdit.style);moodBeforeEdit=null}fillEditor();endEdit()};
    const startEdit=()=>{moodBeforeEdit={text:$('.weekly-mood-value',moodCard)?.textContent||'add this week’s #mood',style:moodCard.dataset.moodStyle||'qwiky-note'};fillEditor();showTab('profile');panel.hidden=false;panel.classList.remove('panel-hidden');card.classList.add('profile-is-editing');button?.setAttribute('aria-expanded','true');if(button)button.textContent='Cancel'};
    if(button&&button.dataset.biglwaProfileBound!=='3'){
      const fresh=button.cloneNode(true);button.replaceWith(fresh);button=fresh;button.dataset.biglwaProfileBound='3';button.type='button';button.textContent='Edit profile';
      button.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if(card.classList.contains('profile-is-editing'))cancelEdit();else startEdit()});
    }
    if(button){button.hidden=false;button.style.pointerEvents='auto';button.setAttribute('aria-controls','wallpaperPanel');rail.insertBefore(button,railLocation||null)}
    const saveButton=$('#saveProfileBtn',panel);
    if(saveButton&&saveButton.dataset.biglwaProfileBound!=='3'){
      saveButton.dataset.biglwaProfileBound='3';saveButton.addEventListener('click',()=>{
        const details={name:$('#profileNameInput',panel).value.trim(),username:$('#profileUsernameInput',panel).value.trim().replace(/^@/,''),bio:$('#profileBioEditor',panel).value.trim(),location:$('#profileLocationInput',panel).value.trim(),website:$('#profileWebsiteInput',panel).value.trim(),mood:$('#profileMoodInput',panel).value.trim(),moodStyle:$('#profileMoodStyle',panel).value,auraText:$('#profileAuraTextInput',panel).value.trim()};
        try{localStorage.setItem('biglwaProfileDetails',JSON.stringify(details));if(details.username){const directory=JSON.parse(localStorage.getItem('biglwaUserDirectory')||'[]');const next=Array.isArray(directory)?directory.filter(user=>String(user?.username||'').toLowerCase()!==details.username.toLowerCase()):[];next.push({username:details.username,name:details.name||'',url:'/'+encodeURIComponent(details.username)});localStorage.setItem('biglwaUserDirectory',JSON.stringify(next))}}catch{} try{window.BigLWAUserDirectory?.saveProfile?.(details)}catch{}
        try{window.BIGLWAStudioAppearance?.save?.()}catch{}
        if(display)display.textContent=details.name||'Your Name';if(handle)handle.textContent='@'+(details.username||'username');if(bio)bio.textContent=details.bio;
        if(meta){const loc=$('span',meta),web=$('a',meta);if(loc)loc.textContent=details.location?'⌖ '+details.location:'';const railLocation=$('.profile-rail-location',card);if(railLocation)railLocation.textContent=details.location;if(web){web.textContent=details.website;web.href=details.website?(/^https?:\/\//.test(details.website)?details.website:'https://'+details.website):'#'}}
        renderWeeklyMood(moodCard,details.mood,details.moodStyle);moodBeforeEdit=null;renderAuraCopy(details.auraText);$('#saveStudioMusicMeta',panel)?.click();
        window.dispatchEvent(new CustomEvent('biglwa:studio-update',{detail:{title:'Profile updated',source:'Profile',detail:'Identity, mood, song, Aura, and profile formatting changed',notified:!$('#profileSilentUpdate',panel)?.checked}}));
        endEdit();
      })
    }
    const cancel=$('#cancelProfileBtn',panel);if(cancel&&cancel.dataset.biglwaProfileBound!=='3'){cancel.dataset.biglwaProfileBound='3';cancel.addEventListener('click',cancelEdit)}
    let close=$('#closePanel',panel);
    if(close&&close.dataset.biglwaProfileBound!=='3'){
      const fresh=close.cloneNode(true);close.replaceWith(fresh);close=fresh;close.dataset.biglwaProfileBound='3';
      close.addEventListener('click',e=>{e.preventDefault();cancelEdit()});
    }
    if(!card.classList.contains('profile-is-editing')){panel.classList.add('panel-hidden');panel.hidden=true;showTab('profile')}
  }

  function ensureTheme(){
    const light=$('#lightModeBtn');
    const dark=$('#darkModeBtn');
    if(!light||!dark)return;
    const setTheme=(mode)=>{
      const isDark=mode==='dark';
      document.body.classList.toggle('night-mode',isDark);
      light.setAttribute('aria-pressed',isDark?'false':'true');
      dark.setAttribute('aria-pressed',isDark?'true':'false');
      try{localStorage.setItem('biglwaTheme',mode)}catch{}
    };
    light.onclick=()=>setTheme('light');
    dark.onclick=()=>setTheme('dark');
    try{setTheme(localStorage.getItem('biglwaTheme')==='dark'?'dark':'light')}catch{setTheme('light')}
  }

  function ensurePolicyBrands(){
    const links=$$('.policy-page .policy-top > .login-brand, .policy-page header.policy-top .login-brand');
    if(!links.length)return false;
    let done=0;
    links.forEach(a=>{
      let mark=a.querySelector('.biglwa-policy-emblem');
      const valid=mark&&mark.tagName==='SPAN'&&mark.classList.contains('biglwa-stitched-crest');
      if(!valid){
        a.replaceChildren();
        mark=document.createElement('span');
        mark.className='biglwa-stitched-crest biglwa-policy-emblem';
        mark.setAttribute('aria-hidden','true');
        a.appendChild(mark);
      }else{
        [...a.children].forEach(child=>{if(child!==mark)child.remove()});
      }
      a.dataset.biglwaPolicyLogo='1';
      a.setAttribute('aria-label','Big LWA home');
      done++;
    });
    return done===links.length;
  }

  function ensureStudioHeadersLowercase(){
    const app=$('#studioApp');if(!app)return;
    $$('.masonry .card h2,.hero h2,.profile-card h2,.panel-title strong',app).forEach(el=>{
      el.childNodes.forEach(node=>{if(node.nodeType===Node.TEXT_NODE)node.textContent=node.textContent.toLowerCase()});
      el.style.setProperty('text-transform','lowercase','important');
    });
  }

  function ensureProfileInitial(){
    const card=$('#studioApp .profile-card');if(!card)return;
    const avatar=$('.profile-avatar',card);if(!avatar||avatar.querySelector('img'))return;
    const existing=avatar.textContent.trim();
    if(existing){avatar.dataset.profileInitial=existing.charAt(0).toUpperCase();avatar.dataset.profilePictureLocked='1';return}
    let saved=null;try{saved=JSON.parse(localStorage.getItem('biglwaProfileDetails')||'null')}catch{}
    const candidates=[saved?.username,window.__biglwaProfileUsername,$('.profile-name-line h1',card)?.textContent,$('.mini-avatar')?.textContent,$('#loginUsername')?.value];
    const username=candidates.map(value=>String(value||'').trim().replace(/^@/,'')).find(value=>value&&value!=='LS')||'B';
    const initial=username.charAt(0).toUpperCase();
    avatar.textContent=initial;avatar.dataset.profileInitial=initial;avatar.dataset.profilePictureLocked='1';avatar.setAttribute('aria-label',`Profile picture initial ${initial}`);
  }

  function syncRealProfileMetrics(){
    const app=$('#studioApp');if(!app)return false;
    const stats=$('.profile-card .stats',app);if(!stats)return false;
    const source=window.__biglwaProfileMetrics&&typeof window.__biglwaProfileMetrics==='object'?window.__biglwaProfileMetrics:{};
    const number=(key)=>Number.isFinite(Number(source[key]))?String(Math.max(0,Number(source[key]))):'0';
    const metrics=[['followers','Followers'],['following','Following'],['connections','Connections'],['reach','Reach']];
    const current=[...stats.children].map(item=>[item.dataset.profileStat||'',item.textContent.replace(/\\s+/g,' ').trim()]);
    const expected=metrics.map(([key,label])=>[key,number(key)+' '+label]);
    const same=current.length===expected.length&&current.every((item,i)=>item[0]===expected[i][0]&&item[1]===expected[i][1]);
    if(!same){
      stats.replaceChildren(...metrics.map(([key,label])=>{
        const item=document.createElement('span');item.dataset.profileStat=key;
        const value=document.createElement('b');value.textContent=number(key);
        item.append(value,document.createTextNode(' '+label));return item;
      }));
    }
    stats.dataset.biglwaMetricSource='real-profile-metrics';
    return true;
  }

  function latestStreamTitle(){
    try{const saved=JSON.parse(localStorage.getItem('biglwaModule_stream')||'[]');const title=Array.isArray(saved)&&saved[0]?.title?String(saved[0].title).trim():'';return title||'After Hours: u up?'}catch{return 'After Hours: u up?'}
  }

  function syncStreamWidget(){
    const app=$('#studioApp');if(!app)return;
    const streamTitle=latestStreamTitle();
    $$('.stream-card,.streaming-card,[data-widget-route="stream"],[data-widget-id="stream"],#stream',app).forEach(card=>{
      const header=$('.card-head h2,.card-head h3',card);if(header)header.textContent='Stream';
      const screen=$('.stream-screen',card)||card;
      let photo=$('.stream-station-photo',screen);
      if(!photo){photo=document.createElement('img');photo.className='stream-station-photo';photo.src='/assets/station-radio-room.webp?v=20260916-station-1';photo.alt='Sticker-covered radio booth lit in red and blue with a host at a microphone';photo.width=1920;photo.height=1080;photo.decoding='async';screen.prepend(photo)}
      const title=$('strong',screen);if(title)title.textContent=streamTitle;
      const counts=$$('span,.stream-watching-count',screen).filter(el=>/watching|viewers?|watchers?|streaming/i.test(el.textContent));
      const count=counts.shift();counts.forEach(extra=>extra.remove());
      if(count)count.textContent='0 watching';
      else{const status=document.createElement('span');status.className='stream-watching-count';status.textContent='0 watching';screen.appendChild(status)}
    });
  }

  function syncQwikyNoteWidget(){
    const card=$('#studioApp #notes');if(!card)return;
    const header=$('.card-head h2,.card-head h3',card);if(header)header.textContent='Qwiky Note';
    const sub=$('.sub',card);if(sub)sub.textContent='Pin a thought before it floats away.';
    card.dataset.widgetLabel='Qwiky Note';card.dataset.search=(card.dataset.search||'')+' qwiky sticky note';
    const note=$('.note-paper',card);if(note){note.setAttribute('aria-label','Open Qwiky Note');note.title='Open Qwiky Note'}
  }

  function ensureRealWorldDefaults(){
    const app=$('#studioApp');if(!app)return;
    syncRealProfileMetrics();
    $$('.feed-card .feed-list,#feed .feed-list',app).forEach(feedList=>{
      feedList.replaceChildren();feedList.dataset.biglwaReset='1';
    });
    syncStreamWidget();
    syncQwikyNoteWidget();
    if(document.documentElement.dataset.biglwaStreamSyncBound!=='1'){
      document.documentElement.dataset.biglwaStreamSyncBound='1';
      document.addEventListener('biglwa:stream-updated',syncStreamWidget);
    }
  }

  function ensureRealWorldMetricsObserver(){
    if(document.documentElement.dataset.biglwaMetricsObserver==='1')return;
    const target=$('#studioApp')||document.body;if(!target)return;
    document.documentElement.dataset.biglwaMetricsObserver='1';
    new MutationObserver(()=>{syncRealProfileMetrics()}).observe(target,{subtree:true,childList:true,characterData:true});
    syncRealProfileMetrics();
  }

  function ensureResetValues(){
    const stats=$('#studioApp .profile-card .stats');
    if(stats){
      const items=$$('span',stats);
      let followersFound=false;
      items.forEach(item=>{
        const label=item.textContent.trim().toLowerCase();
        const value=$('b',item);
        if(!value)return;
        if(/\\bfollow(?:ers|ing)?\\b/.test(label)){
          value.textContent='0';
          followersFound=true;
        }
        if(/\\bprojects?\\b|\\brooms?\\b/.test(label))value.textContent='0';
      });
      const nums=$$('b',stats);
      if(!followersFound&&nums.length>0)nums[0].textContent='0';
      stats.dataset.biglwaReset='1';
    }
    const rank=$('#studioApp .profile-card .real-rank');
    if(rank){
      const value=$('strong',rank),track=$('.rank-track i',rank),next=$('.rank-next',rank);
      if(value)value.textContent='Chopped';
      if(track)track.style.width='0%';
      if(next)next.textContent='next: 007';
      if(!$('.real-rank-explanation',rank)){const explanation=document.createElement('small');explanation.className='real-rank-explanation';explanation.textContent='Real Rank reflects your progress, participation, and standing inside BIG LWA.';rank.appendChild(explanation)}
      rank.setAttribute('aria-label','Real Rank: Chopped, progressing toward 007. Real Rank reflects your progress, participation, and standing inside BIG LWA.');
      rank.dataset.biglwaDefault='chopped';
    }
    const feedList=$('#studioApp .feed-card .feed-list');
    if(feedList){
      if(!feedList.dataset.biglwaReset){
        feedList.dataset.biglwaReset='1';
        feedList.innerHTML='';
        const empty=document.createElement('div');
        empty.style.cssText='grid-column:1/-1;padding:14px 4px 6px;color:var(--muted,#8a837c);font-size:12px;text-align:center;font-family:Inter,ui-sans-serif,system-ui,sans-serif';
        empty.textContent='No updates yet.';
        feedList.appendChild(empty);
      }
    }
  }

  function run(){ensureStyles();ensureProfileEditor();bindStableStudioInteractions();ensureTopLogo();ensurePolicyBrands();ensureLoginSnake();syncQwikyNoteWidget();ensureSidebar();ensureControls();syncSidebarShortcutSystem();ensureWidgetActions();syncPrimaryWidgetDock($('#studioApp'));ensureProfileInitial();ensureStudioHeadersLowercase();ensureRealWorldDefaults();ensureRealWorldMetricsObserver();ensureTheme();ensureResetValues()}
  if(document.documentElement.dataset.biglwaSymbolSyncBound!=='1'){
    document.documentElement.dataset.biglwaSymbolSyncBound='1';
    document.addEventListener('biglwa:widget-symbols-ready',()=>{const app=$('#studioApp');if(!app)return;refreshNavigationCatalogFromWidgets(app);syncSidebarShortcutSystem();refreshMinimizedWidgetIcons(app)});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
  window.addEventListener('load',()=>setTimeout(run,0),{once:true});
  setTimeout(run,140);
  setTimeout(run,900);
  setTimeout(run,1600);
  setTimeout(run,2600);
  setTimeout(run,4200);
  const topLogoTimer=setInterval(()=>{if(ensureTopLogo())clearInterval(topLogoTimer)},400);
  const policyLogoTimer=setInterval(()=>{if(ensurePolicyBrands())clearInterval(policyLogoTimer)},400);
  const resetTimer=setInterval(()=>{ensureResetValues();clearInterval(resetTimer)},500);
  setTimeout(()=>{clearInterval(topLogoTimer);clearInterval(policyLogoTimer);clearInterval(resetTimer)},30000);
})();
