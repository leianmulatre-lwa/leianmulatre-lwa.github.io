(()=>{
  const V='20260910-widget-drag-reset-v3';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];

  function ensureStyles(){
    let style=$('#biglwa-ui-coherence-style');
    if(!style){style=document.createElement('style');style.id='biglwa-ui-coherence-style';document.head.appendChild(style)}
    style.textContent=`
      #studioApp .topbar{grid-template-columns:minmax(150px,180px) minmax(360px,1fr) minmax(250px,350px)!important;gap:14px!important;align-items:center!important}
      #studioApp .topbar::before{content:none!important;display:none!important}
      #studioApp .studio-brand-row{display:flex!important;grid-column:1!important;align-items:center!important;justify-content:flex-start!important;min-width:0!important;width:100%!important;height:100%!important}
      #studioApp .studio-brand-row>a.brand.biglwa-block-brand{display:flex!important;align-items:center!important;justify-content:flex-start!important;width:124px!important;height:70px!important;min-width:124px!important;font-size:0!important;color:transparent!important;text-shadow:none!important;overflow:visible!important;text-decoration:none!important}
      #studioApp .studio-brand-row>a.brand.biglwa-block-brand img{display:block!important;width:115px!important;height:auto!important;max-width:115px!important;max-height:66px!important;object-fit:contain!important;object-position:left center!important;visibility:visible!important;opacity:1!important;filter:none!important;mix-blend-mode:normal!important}
      #studioApp .biglwa-top-block-logo{display:none!important}
      #studioApp .search-wrap{grid-column:2!important;max-width:none!important;width:100%!important;justify-self:stretch!important}
      #studioApp .top-actions{grid-column:3!important}
      #studioApp .profile-card{visibility:visible!important;opacity:1!important}
      #studioApp .profile-avatar{border-radius:14px!important}
      #studioApp .profile-copy>.eyebrow{display:none!important}
      #studioApp .profile-card{position:absolute!important;grid-template-columns:132px minmax(0,1fr)!important;align-items:center!important;min-height:232px!important;height:auto!important;padding:24px 26px!important}
      #studioApp .profile-card .profile-copy{grid-column:2!important;grid-row:1!important;align-self:center!important;padding-right:118px!important}
      #studioApp .profile-card .profile-display-name{margin:0 0 1px!important;font-family:Georgia,"Times New Roman",serif!important;font-size:25px!important;line-height:1.05!important}
      #studioApp .profile-card .profile-name-line h1{font-size:18px!important;letter-spacing:-.3px!important;font-weight:600!important}
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
      #studioApp .profile-card .real-rank{left:156px!important;right:24px!important;bottom:18px!important;padding-top:10px!important}
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
      #studioApp #wallpaperPanel:not(.panel-hidden){display:block!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;z-index:1000!important}
      #studioApp #wallpaperPanel{position:fixed!important;right:24px!important;top:92px!important;max-height:calc(100vh - 116px)!important;overflow:auto!important}
      #studioApp #editProfileBtn{display:inline-flex!important;align-items:center!important;justify-content:center!important;visibility:visible!important;opacity:1!important;min-width:146px!important}
      #studioApp .sidebar-theme-controls{display:grid!important;grid-template-columns:repeat(2,36px)!important}
      #studioApp .sidebar-theme-btn{display:grid!important;visibility:visible!important;opacity:1!important}
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
      #minimizedWidgetDock{display:flex;flex-direction:column;align-items:stretch;gap:6px;width:100%;margin:8px 0}
      #minimizedWidgetDock button{border:1px solid rgba(80,70,64,.16);border-radius:9px;background:rgba(255,255,255,.58);padding:7px 6px;color:inherit;font-size:10px;line-height:1.1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      body.sidebar-collapsed #minimizedWidgetDock button{width:34px;height:34px;padding:0;font-size:0;align-self:center}
      body.sidebar-collapsed #minimizedWidgetDock button::first-letter{font-size:12px}
      @media(max-width:980px){#studioApp .topbar{grid-template-columns:126px minmax(220px,1fr) minmax(210px,280px)!important}#studioApp .studio-brand-row>a.brand.biglwa-block-brand{width:105px!important;height:59px!important;min-width:105px!important}#studioApp .studio-brand-row>a.brand.biglwa-block-brand img{width:98px!important;max-width:98px!important;max-height:56px!important}}
      @media(max-width:720px){#studioApp .topbar{grid-template-columns:94px minmax(0,1fr) auto!important;gap:8px!important;padding-left:12px!important;padding-right:12px!important}#studioApp .studio-brand-row>a.brand.biglwa-block-brand{width:78px!important;height:44px!important;min-width:78px!important}#studioApp .studio-brand-row>a.brand.biglwa-block-brand img{width:73px!important;max-width:73px!important;max-height:42px!important}}
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
    `;
  }

  function ensureTopLogo(){
    const row=$('#studioApp .studio-brand-row');
    if(!row)return false;
    if(row.dataset.biglwaTopLogo==='1'&&row.querySelector('a.brand.biglwa-block-brand img'))return true;
    row.innerHTML='';
    const a=document.createElement('a');
    a.className='brand biglwa-block-brand';
    a.href='/studio';
    a.setAttribute('aria-label','BIGLWA Studio');
    const img=document.createElement('img');
    img.src='/assets/biglwa-header-ready.png?v=20260910-mutual-good-faith-2';
    img.alt='';
    img.setAttribute('aria-hidden','true');
    img.decoding='sync';
    a.appendChild(img);
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
  }

  function widgetId(el,index){return el.dataset.widgetId||el.id||(['profile-card','music-card','aura-card'].find(c=>el.classList.contains(c))||`widget-${index+1}`).replace(/-card$/,'')}
  function widgetLabel(el,id){return el.dataset.widgetLabel||$('h1,h2,.card-kicker',el)?.textContent?.trim()||id.replace(/[-_]/g,' ')}
  function widgetRoute(el,id){return el.dataset.widgetRoute||$('.arrow-btn[data-open]',el)?.dataset.open||id}
  function ensureControls(){
    const widgets=$$('#studioApp .profile-card,#studioApp .customizable-widget,#studioApp .masonry .card:not(.manifesto-card)');
    widgets.forEach((el,index)=>{
      const id=widgetId(el,index),label=widgetLabel(el,id),route=widgetRoute(el,id);
      el.dataset.widgetId=id;el.dataset.widgetLabel=label;el.dataset.widgetRoute=route;
      let controls=$(':scope > .widget-window-controls',el);if(!controls){controls=document.createElement('div');el.prepend(controls)}
      controls.className='widget-window-controls';controls.dataset.canonicalControls='1';controls.setAttribute('aria-label',`${label} window controls`);
      controls.innerHTML=`<button class="window-light green" type="button" data-expand-widget="${id}" aria-label="Open ${label} page" title="Open ${label} page"></button><button class="window-light yellow" type="button" data-rearrange-widget="${id}" aria-label="Rearrange widgets" title="Rearrange widgets" aria-pressed="false"></button><button class="window-light red" type="button" data-dock-widget="${id}" aria-label="Move ${label} to left toolbar" title="Move to left toolbar"></button>`;
      $$('.arrow-btn',el).forEach(b=>b.style.display='none');
    });
  }

  function ensureWidgetActions(){
    const app=$('#studioApp'),sidebar=$('#studioApp .sidebar');if(!app||!sidebar)return;
    let minimizedSection=$('#minimizedWidgets',sidebar);
    let dock=$('#minimizedWidgetDock',sidebar);
    if(!dock){
      if(!minimizedSection){minimizedSection=document.createElement('section');minimizedSection.id='minimizedWidgets';minimizedSection.className='minimized-widgets';minimizedSection.setAttribute('aria-label','Minimized widgets');minimizedSection.hidden=true;minimizedSection.innerHTML='<div class="minimized-label">MINIMIZED</div>';const top=$('.sidebar-top',sidebar)||sidebar;top.appendChild(minimizedSection)}
      dock=document.createElement('div');dock.id='minimizedWidgetDock';dock.className='minimized-widget-dock';minimizedSection.appendChild(dock);
    }
    const syncDock=()=>{if(minimizedSection)minimizedSection.hidden=dock.children.length===0};
    const selector='.profile-card,.customizable-widget,.masonry .card:not(.manifesto-card)';
    const widgets=$$(selector,app);
    let minimized=[];try{minimized=JSON.parse(localStorage.getItem('biglwaMinimizedWidgets')||'[]')}catch{}
    const saveMinimized=()=>{try{localStorage.setItem('biglwaMinimizedWidgets',JSON.stringify($$('.widget-is-minimized',app).map(w=>w.dataset.widgetId)))}catch{}};
    const addRestore=widget=>{
      const id=widget.dataset.widgetId;if(!id||$('[data-restore-widget="'+CSS.escape(id)+'"]',dock))return;
      const button=document.createElement('button');button.type='button';button.className='minimized-widget-btn';button.dataset.restoreWidget=id;
      const label=widget.dataset.widgetLabel||id.replace(/[-_]/g,' ');button.title='Restore '+label;button.setAttribute('aria-label','Restore '+label);
      button.innerHTML='<span class="restore-dot" aria-hidden="true"></span><b>'+label+'</b>';
      dock.appendChild(button);syncDock();
    };
    widgets.forEach((widget,index)=>{
      if(!widget.dataset.widgetId)widget.dataset.widgetId=widgetId(widget,index);
      if(!widget.dataset.widgetLabel)widget.dataset.widgetLabel=widgetLabel(widget,widget.dataset.widgetId);
      if(minimized.includes(widget.dataset.widgetId)){widget.classList.add('widget-is-minimized');addRestore(widget)}
    });
    syncDock();
    if(document.documentElement.dataset.biglwaWidgetCaptureBound!=='1'){
      document.documentElement.dataset.biglwaWidgetCaptureBound='1';
      document.addEventListener('click',event=>{
        const control=event.target.closest('[data-expand-widget],[data-rearrange-widget],[data-dock-widget],[data-restore-widget]');
        if(!control||!app.contains(control))return;
        event.preventDefault();event.stopImmediatePropagation();
        if(control.matches('[data-restore-widget]')){
          const widget=$('[data-widget-id="'+CSS.escape(control.dataset.restoreWidget)+'"]',app);
          if(widget)widget.classList.remove('widget-is-minimized');
          control.remove();saveMinimized();syncDock();return;
        }
        const widget=control.closest(selector);if(!widget)return;
        if(control.matches('[data-expand-widget]')){
          const opening=!widget.classList.contains('widget-is-expanded');
          $$('.widget-is-expanded',app).forEach(w=>w.classList.remove('widget-is-expanded'));
          widget.classList.toggle('widget-is-expanded',opening);
          control.setAttribute('aria-pressed',opening?'true':'false');
          return;
        }
        if(control.matches('[data-rearrange-widget]')){
          const active=!app.classList.contains('biglwa-rearrange-mode');
          app.classList.toggle('biglwa-rearrange-mode',active);
          $$(selector,app).forEach(w=>w.draggable=active);
          $$('[data-rearrange-widget]',app).forEach(b=>b.setAttribute('aria-pressed',active?'true':'false'));
          return;
        }
        widget.classList.remove('widget-is-expanded');
        widget.classList.add('widget-is-minimized');
        addRestore(widget);saveMinimized();
      },true);
    }
    if(app.dataset.widgetActionsBound==='1')return;app.dataset.widgetActionsBound='1';
    let dragging=null;
    app.addEventListener('click',event=>{
      const restore=event.target.closest('[data-restore-widget]');
      if(restore){const widget=$('[data-widget-id="'+CSS.escape(restore.dataset.restoreWidget)+'"]',app);if(widget)widget.classList.remove('widget-is-minimized');restore.remove();saveMinimized();syncDock();return}
      const green=event.target.closest('[data-expand-widget]');
      if(green){event.preventDefault();event.stopPropagation();const widget=green.closest(selector);if(!widget)return;const opening=!widget.classList.contains('widget-is-expanded');$$('.widget-is-expanded',app).forEach(w=>w.classList.remove('widget-is-expanded'));widget.classList.toggle('widget-is-expanded',opening);green.setAttribute('aria-pressed',opening?'true':'false');return}
      const yellow=event.target.closest('[data-rearrange-widget]');
      if(yellow){event.preventDefault();event.stopPropagation();const active=!app.classList.contains('biglwa-rearrange-mode');app.classList.toggle('biglwa-rearrange-mode',active);$$(selector,app).forEach(w=>w.draggable=false);$$('[data-rearrange-widget]',app).forEach(b=>b.setAttribute('aria-pressed',active?'true':'false'));return}
      const red=event.target.closest('[data-dock-widget]');
      if(red){event.preventDefault();event.stopPropagation();const widget=red.closest(selector);if(!widget)return;widget.classList.remove('widget-is-expanded');widget.classList.add('widget-is-minimized');addRestore(widget);saveMinimized();return}
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
      const railLocation=document.createElement('div');railLocation.className='profile-rail-location';railLocation.textContent=meta&&$('span',meta)?$('span',meta).textContent.replace(/^⌖\s*/,''):'';
      rail.appendChild(railLocation);card.prepend(rail);
    }
    const stats=$('.stats',card);
    if(stats&&!$('[data-profile-stat="projects"]',stats)){
      const projects=document.createElement('span');projects.dataset.profileStat='projects';projects.innerHTML='<b>24</b> Projects';
      const rooms=document.createElement('span');rooms.dataset.profileStat='rooms';rooms.innerHTML='<b>3</b> Rooms';
      stats.append(projects,rooms);
    }
    let display=$('.profile-display-name',card);
    if(!display&&copy){display=document.createElement('h2');display.className='profile-display-name';display.textContent='Leian Stanley';copy.prepend(display)}
    const saved=JSON.parse(localStorage.getItem('biglwaProfileDetails')||'null');
    if(saved){
      if(display&&saved.name)display.textContent=saved.name;
      if(handle&&saved.username)handle.textContent='@'+saved.username.replace(/^@/,'');
      if(bio&&saved.bio)bio.textContent=saved.bio;
      if(meta){
        const location=$('span',meta),website=$('a',meta);
        if(location&&saved.location)location.textContent='⌖ '+saved.location;const railLocation=$('.profile-rail-location',card);if(railLocation&&saved.location)railLocation.textContent=saved.location;
        if(website&&saved.website){website.textContent=saved.website;website.href=/^https?:\/\//.test(saved.website)?saved.website:'https://'+saved.website}
      }
    }
    const panel=$('#wallpaperPanel');if(!panel)return;
    if(!$('#profileDetailsEditor',panel)){
      const section=document.createElement('div');section.className='customize-section profile-details-section';section.id='profileDetailsEditor';
      section.innerHTML='<h3>Profile</h3><p>Edit the identity and biography shown on your card.</p><div class="profile-editor-grid"><label>Display name<input id="profileNameInput" maxlength="60"></label><label>Username<input id="profileUsernameInput" maxlength="30"></label><label class="full">Bio<textarea id="profileBioEditor" rows="3" maxlength="300"></textarea></label><label>Location<input id="profileLocationInput" maxlength="80"></label><label>Website<input id="profileWebsiteInput" maxlength="160"></label></div><button type="button" class="secondary-btn" id="saveProfileBtn" style="margin-top:10px">Save Profile</button>';
      const title=$('.panel-title',panel);if(title)title.insertAdjacentElement('afterend',section);else panel.prepend(section);
      $('#saveProfileBtn',panel).addEventListener('click',()=>{
        const details={name:$('#profileNameInput',panel).value.trim(),username:$('#profileUsernameInput',panel).value.trim().replace(/^@/,''),bio:$('#profileBioEditor',panel).value.trim(),location:$('#profileLocationInput',panel).value.trim(),website:$('#profileWebsiteInput',panel).value.trim()};
        localStorage.setItem('biglwaProfileDetails',JSON.stringify(details));
        if(display)display.textContent=details.name||'Your Name';
        if(handle)handle.textContent='@'+(details.username||'username');
        if(bio)bio.textContent=details.bio;
        if(meta){const loc=$('span',meta),web=$('a',meta);if(loc)loc.textContent=details.location?'⌖ '+details.location:'';const railLocation=$('.profile-rail-location',card);if(railLocation)railLocation.textContent=details.location;if(web){web.textContent=details.website;web.href=details.website?(/^https?:\/\//.test(details.website)?details.website:'https://'+details.website):'#'}}
        panel.classList.add('panel-hidden');const b=$('#editProfileBtn');if(b)b.setAttribute('aria-expanded','false');
      });
    }
    const fillEditor=()=>{
      $('#profileNameInput',panel).value=display?display.textContent.trim():'';
      $('#profileUsernameInput',panel).value=handle?handle.textContent.trim().replace(/^@/,''):'';
      $('#profileBioEditor',panel).value=bio?bio.textContent.trim():'';
      const loc=meta&&$('span',meta),web=meta&&$('a',meta);
      $('#profileLocationInput',panel).value=loc?loc.textContent.replace(/^⌖\s*/,'').trim():'';
      $('#profileWebsiteInput',panel).value=web?web.textContent.trim():'';
    };
    let button=$('#editProfileBtn',card);
    if(button&&button.dataset.biglwaProfileBound!=='2'){
      const fresh=button.cloneNode(true);button.replaceWith(fresh);button=fresh;button.dataset.biglwaProfileBound='2';button.type='button';button.textContent='Edit Profile';
      button.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const open=panel.classList.contains('panel-hidden');panel.hidden=false;panel.classList.toggle('panel-hidden',!open);button.setAttribute('aria-expanded',open?'true':'false');if(open)fillEditor()});
    }
    if(button){button.hidden=false;button.style.pointerEvents='auto';button.setAttribute('aria-controls','wallpaperPanel')}
    let close=$('#closePanel',panel);
    if(close&&close.dataset.biglwaProfileBound!=='2'){
      const fresh=close.cloneNode(true);close.replaceWith(fresh);close=fresh;close.dataset.biglwaProfileBound='2';
      close.addEventListener('click',e=>{e.preventDefault();panel.classList.add('panel-hidden');if(button)button.setAttribute('aria-expanded','false')});
    }
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
      if(a.dataset.biglwaPolicyLogo==='1'||a.querySelector('img')){done++;return}
      const img=document.createElement('img');
      img.src='/assets/biglwa-header-ready.png';
      img.alt='';
      img.setAttribute('aria-hidden','true');
      img.decoding='sync';
      img.style.cssText='display:block;width:auto;height:34px;max-height:34px;object-fit:contain;object-position:left center';
      a.textContent='';
      a.appendChild(img);
      a.dataset.biglwaPolicyLogo='1';
      done++;
    });
    return done===links.length;
  }

  function ensureResetValues(){
    const stats=$('#studioApp .profile-card .stats');
    if(stats){
      const nums=$$('b',stats);
      if(nums.length>0)nums[0].textContent='0';
      if(nums.length>1)nums[1].textContent='0';
      stats.dataset.biglwaReset='1';
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

  function run(){ensureStyles();ensureTopLogo();ensurePolicyBrands();ensureLoginSnake();ensureSidebar();ensureControls();ensureWidgetActions();ensureProfileEditor();ensureTheme();ensureResetValues()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
  window.addEventListener('load',()=>setTimeout(run,0),{once:true});
  setTimeout(run,140);
  const topLogoTimer=setInterval(()=>{if(ensureTopLogo())clearInterval(topLogoTimer)},400);
  const policyLogoTimer=setInterval(()=>{if(ensurePolicyBrands())clearInterval(policyLogoTimer)},400);
  const resetTimer=setInterval(()=>{ensureResetValues();clearInterval(resetTimer)},500);
  setTimeout(()=>{clearInterval(topLogoTimer);clearInterval(policyLogoTimer);clearInterval(resetTimer)},30000);
})();
