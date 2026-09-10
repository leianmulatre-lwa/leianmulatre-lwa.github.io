(()=>{
  const V='20260910-profile-card-style-6';
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
      @media(max-width:900px){#studioApp .profile-card{width:auto!important;right:14px!important;height:auto!important;min-height:285px!important;max-height:none!important;grid-template-columns:86px minmax(0,1fr)!important;padding:22px!important;gap:18px!important}#studioApp .profile-card .profile-avatar{width:86px!important;height:86px!important;font-size:40px!important}#studioApp .profile-card .profile-copy{padding-right:0!important}#studioApp .profile-card .real-rank{left:22px!important;right:22px!important;bottom:24px!important}#studioApp .profile-card>.widget-window-controls{display:none!important}}
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
      @media(max-width:980px){#studioApp .topbar{grid-template-columns:126px minmax(220px,1fr) minmax(210px,280px)!important}#studioApp .studio-brand-row>a.brand.biglwa-block-brand{width:105px!important;height:59px!important;min-width:105px!important}#studioApp .studio-brand-row>a.brand.biglwa-block-brand img{width:98px!important;max-width:98px!important;max-height:56px!important}}
      @media(max-width:720px){#studioApp .topbar{grid-template-columns:94px minmax(0,1fr) auto!important;gap:8px!important;padding-left:12px!important;padding-right:12px!important}#studioApp .studio-brand-row>a.brand.biglwa-block-brand{width:78px!important;height:44px!important;min-width:78px!important}#studioApp .studio-brand-row>a.brand.biglwa-block-brand img{width:73px!important;max-width:73px!important;max-height:42px!important}}
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

  function ensureProfileEditor(){
    const card=$('#studioApp .profile-card'); if(!card)return;
    card.style.visibility='visible';card.style.opacity='1';
    const eyebrow=$('.profile-copy > .eyebrow',card);if(eyebrow)eyebrow.remove();
    const copy=$('.profile-copy',card);
    const handle=$('.profile-name-line h1',card);
    const bio=$('.bio',card);
    const meta=$('.meta-row',card);
    let display=$('.profile-display-name',card);
    if(!display&&copy){display=document.createElement('h2');display.className='profile-display-name';display.textContent='Leian Stanley';copy.prepend(display)}
    const saved=JSON.parse(localStorage.getItem('biglwaProfileDetails')||'null');
    if(saved){
      if(display&&saved.name)display.textContent=saved.name;
      if(handle&&saved.username)handle.textContent='@'+saved.username.replace(/^@/,'');
      if(bio&&saved.bio)bio.textContent=saved.bio;
      if(meta){
        const location=$('span',meta),website=$('a',meta);
        if(location&&saved.location)location.textContent='⌖ '+saved.location;
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
        if(meta){const loc=$('span',meta),web=$('a',meta);if(loc)loc.textContent=details.location?'⌖ '+details.location:'';if(web){web.textContent=details.website;web.href=details.website?(/^https?:\/\//.test(details.website)?details.website:'https://'+details.website):'#'}}
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

  function run(){ensureStyles();ensureTopLogo();ensurePolicyBrands();ensureLoginSnake();ensureSidebar();ensureControls();ensureProfileEditor();ensureTheme()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
  window.addEventListener('load',()=>setTimeout(run,0),{once:true});
  setTimeout(run,140);
  const topLogoTimer=setInterval(()=>{if(ensureTopLogo())clearInterval(topLogoTimer)},400);
  const policyLogoTimer=setInterval(()=>{if(ensurePolicyBrands())clearInterval(policyLogoTimer)},400);
  setTimeout(()=>{clearInterval(topLogoTimer);clearInterval(policyLogoTimer)},30000);
})();
