(()=>{
  const V='20260910-real-img-topbar-3';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];

  function ensureStyles(){
    let style=$('#biglwa-ui-coherence-style');
    if(!style){style=document.createElement('style');style.id='biglwa-ui-coherence-style';document.head.appendChild(style)}
    style.textContent=`
      #studioApp .topbar{grid-template-columns:minmax(150px,180px) minmax(360px,1fr) minmax(250px,350px)!important;gap:14px!important;align-items:center!important}
      #studioApp .topbar::before{content:none!important;display:none!important}
      #studioApp .studio-brand-row{display:flex!important;grid-column:1!important;align-items:center!important;justify-content:flex-start!important;min-width:0!important;width:100%!important;height:100%!important}
      #studioApp .studio-brand-row>a.brand.biglwa-block-brand{display:flex!important;align-items:center!important;justify-content:flex-start!important;width:150px!important;height:84px!important;min-width:150px!important;font-size:0!important;color:transparent!important;text-shadow:none!important;overflow:visible!important;text-decoration:none!important}
      #studioApp .studio-brand-row>a.brand.biglwa-block-brand img{display:block!important;width:140px!important;height:auto!important;max-width:140px!important;max-height:79px!important;object-fit:contain!important;object-position:left center!important;visibility:visible!important;opacity:1!important;filter:none!important;mix-blend-mode:normal!important}
      #studioApp .biglwa-top-block-logo{display:none!important}
      #studioApp .search-wrap{grid-column:2!important;max-width:none!important;width:100%!important;justify-self:stretch!important}
      #studioApp .top-actions{grid-column:3!important}
      #studioApp .sidebar-top>nav{display:none!important}
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
      @media(max-width:980px){#studioApp .topbar{grid-template-columns:126px minmax(220px,1fr) minmax(210px,280px)!important}#studioApp .studio-brand-row>a.brand.biglwa-block-brand{width:126px!important;height:71px!important;min-width:126px!important}#studioApp .studio-brand-row>a.brand.biglwa-block-brand img{width:118px!important;max-width:118px!important;max-height:67px!important}}
      @media(max-width:720px){#studioApp .topbar{grid-template-columns:94px minmax(0,1fr) auto!important;gap:8px!important;padding-left:12px!important;padding-right:12px!important}#studioApp .studio-brand-row>a.brand.biglwa-block-brand{width:94px!important;height:53px!important;min-width:94px!important}#studioApp .studio-brand-row>a.brand.biglwa-block-brand img{width:88px!important;max-width:88px!important;max-height:50px!important}}
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
    img.src='/assets/biglwa-header-ready.png?v=20260910-real-img-topbar-2';
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
    const top=$('.sidebar-top',sidebar);if(top)$$(':scope > nav',top).forEach(n=>n.remove());
    let hide=$('#sidebarCollapse',sidebar);
    if(!hide){hide=document.createElement('button');hide.id='sidebarCollapse';hide.className='sidebar-collapse';hide.type='button';hide.innerHTML='<span aria-hidden="true">â€¹</span><b>Hide</b>';top?.prepend(hide)}
    const fresh=hide.cloneNode(true);hide.replaceWith(fresh);hide=fresh;
    hide.setAttribute('aria-label','Hide left toolbar');hide.setAttribute('title','Hide left toolbar');hide.setAttribute('aria-expanded','true');
    let show=$('#biglwaSidebarShowTab');if(!show){show=document.createElement('button');show.id='biglwaSidebarShowTab';show.type='button';show.innerHTML='â€º';show.setAttribute('aria-label','Show left toolbar');show.setAttribute('title','Show left toolbar');document.body.appendChild(show)}
    const setHidden=(hidden)=>{document.body.classList.toggle('biglwa-sidebar-hidden',hidden);try{localStorage.setItem('biglwaSidebarHidden',hidden?'1':'0')}catch{}};
    hide.addEventListener('click',()=>setHidden(true));show.onclick=()=>setHidden(false);
    try{setHidden(localStorage.getItem('biglwaSidebarHidden')==='1')}catch{}
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

  function run(){ensureStyles();ensureTopLogo();ensureLoginSnake();ensureSidebar();ensureControls()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
  window.addEventListener('load',()=>setTimeout(run,0),{once:true});
  setTimeout(run,140);
  const topLogoTimer=setInterval(()=>{if(ensureTopLogo())clearInterval(topLogoTimer)},400);
  setTimeout(()=>clearInterval(topLogoTimer),30000);
})();
