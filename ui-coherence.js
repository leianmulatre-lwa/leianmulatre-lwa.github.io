(()=>{
  const V='20260910-profile-editor-4';
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
    const card=$('#studioApp .profile-card');
    if(!card)return;
    card.style.visibility='visible'; card.style.opacity='1';
    const eyebrow=$('.profile-copy > .eyebrow',card); if(eyebrow)eyebrow.remove();
    const bio=$('.bio',card);
    if(bio){const stored=localStorage.getItem('biglwaProfileBio');if(stored)bio.textContent=stored}
    const panel=$('#wallpaperPanel');
    if(!panel)return;

    if(!$('#profileBioEditor',panel)){
      const section=document.createElement('div');
      section.className='customize-section profile-bio-section';
      section.innerHTML='<h3>Bio</h3><p>Edit the biography shown on your profile card.</p><textarea id="profileBioEditor" rows="4" maxlength="300" aria-label="Profile bio"></textarea><button type="button" class="secondary-btn" id="saveProfileBtn">Save Profile</button>';
      const title=$('.panel-title',panel);
      if(title)title.insertAdjacentElement('afterend',section);else panel.prepend(section);
      const input=$('#profileBioEditor',panel);
      input.value=bio?bio.textContent.trim():'';
      input.style.cssText='width:100%;resize:vertical;margin:0 0 10px;padding:10px;border:1px solid rgba(80,70,64,.22);border-radius:9px;background:rgba(255,255,255,.72);color:inherit;font:inherit';
      input.addEventListener('input',()=>{if(bio)bio.textContent=input.value});
      $('#saveProfileBtn',panel).addEventListener('click',()=>{
        const value=input.value.trim();localStorage.setItem('biglwaProfileBio',value);if(bio)bio.textContent=value;
        panel.classList.add('panel-hidden');const b=$('#editProfileBtn');if(b)b.setAttribute('aria-expanded','false');
      });
    }

    let button=$('#editProfileBtn',card);
    if(button&&button.dataset.biglwaProfileBound!=='1'){
      const fresh=button.cloneNode(true);button.replaceWith(fresh);button=fresh;
      button.dataset.biglwaProfileBound='1';button.type='button';button.textContent='Edit Profile';
      button.addEventListener('click',e=>{
        e.preventDefault();e.stopPropagation();
        const open=panel.classList.contains('panel-hidden');
        panel.hidden=false;panel.classList.toggle('panel-hidden',!open);
        button.setAttribute('aria-expanded',open?'true':'false');
        if(open){const input=$('#profileBioEditor',panel);if(input&&bio)input.value=bio.textContent.trim()}
      });
    }
    if(button){button.hidden=false;button.style.pointerEvents='auto';button.setAttribute('aria-controls','wallpaperPanel')}
    let close=$('#closePanel',panel);
    if(close&&close.dataset.biglwaProfileBound!=='1'){
      const fresh=close.cloneNode(true);close.replaceWith(fresh);close=fresh;close.dataset.biglwaProfileBound='1';
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
