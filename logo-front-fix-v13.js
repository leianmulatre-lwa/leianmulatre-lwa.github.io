(() => {
  if (window.__biglwaLogoFrontFixV13) return;
  window.__biglwaLogoFrontFixV13 = true;

  const LOGO = '/assets/biglwa-header-logo.png?v=20260909-5';
  const style = document.createElement('style');
  style.id = 'biglwa-logo-front-fix-v13-style';
  style.textContent = `
    /* Never show the old typed BIGLWA while the image is loading. */
    #studioApp .studio-brand-row>a.brand,
    .policy-page .policy-top .login-brand{
      font-size:0!important;
      color:transparent!important;
      text-shadow:none!important;
      text-indent:0!important;
    }
    #studioApp .studio-brand-row,
    .policy-page .policy-top{
      overflow:visible!important;
    }
    #studioApp .studio-brand-row>a.brand,
    .policy-page .policy-top .login-brand{
      position:relative!important;
      z-index:10000!important;
      isolation:isolate!important;
      overflow:visible!important;
      background:transparent!important;
    }
    #studioApp img.biglwa-front-logo,
    .policy-page img.biglwa-front-logo{
      display:block!important;
      position:relative!important;
      z-index:10001!important;
      opacity:1!important;
      visibility:visible!important;
      transform:none!important;
      filter:none!important;
      mix-blend-mode:normal!important;
      object-fit:contain!important;
      object-position:left center!important;
      pointer-events:auto!important;
      border:0!important;
      box-shadow:none!important;
      /* Opaque backing so the logo never visually disappears into the page. */
      background:#f7f1e9!important;
    }
    #studioApp .studio-brand-row>a.brand{display:flex!important;align-items:center!important;width:190px!important;height:78px!important;padding:0!important;margin:0!important;}
    #studioApp img.biglwa-front-logo{width:182px!important;height:72px!important;}
    .policy-page .policy-top .login-brand{display:flex!important;align-items:center!important;justify-content:flex-start!important;width:224px!important;height:88px!important;padding:0!important;margin:0!important;}
    .policy-page img.biglwa-front-logo{width:214px!important;height:84px!important;}
    @media(max-width:620px){
      #studioApp .studio-brand-row>a.brand{width:142px!important;height:60px!important}
      #studioApp img.biglwa-front-logo{width:136px!important;height:56px!important}
      .policy-page .policy-top .login-brand{width:174px!important;height:72px!important}
      .policy-page img.biglwa-front-logo{width:166px!important;height:68px!important}
    }
  `;
  document.head.appendChild(style);

  function putLogo(anchor, ariaLabel){
    if (!anchor) return;
    anchor.replaceChildren();
    anchor.textContent = '';
    anchor.setAttribute('aria-label', ariaLabel);
    const img = document.createElement('img');
    img.className = 'biglwa-front-logo';
    img.src = LOGO;
    img.alt = '';
    img.decoding = 'sync';
    img.loading = 'eager';
    img.fetchPriority = 'high';
    img.draggable = false;
    anchor.appendChild(img);
  }

  function apply(){
    document.querySelectorAll('#studioApp .studio-brand-row>a.brand').forEach(a => putLogo(a,'BIGLWA Studio'));
    document.querySelectorAll('.policy-page .policy-top .login-brand').forEach(a => putLogo(a,'BIGLWA'));
  }

  let queued = false;
  const queue = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; apply(); });
  };
  new MutationObserver(queue).observe(document.documentElement,{subtree:true,childList:true});
  window.addEventListener('popstate',queue);
  document.addEventListener('click',()=>setTimeout(queue,0),true);
  setTimeout(apply,0);
  setTimeout(apply,80);
  setTimeout(apply,250);
  setTimeout(apply,800);
})();