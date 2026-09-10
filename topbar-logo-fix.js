(() => {
  if (window.__biglwaTopbarLogoFix) return;
  window.__biglwaTopbarLogoFix = true;

  const LOGO = '/assets/biglwa-header-user-final.png?v=20260910-2';
  const style = document.createElement('style');
  style.textContent = `
    #studioApp .topbar{position:sticky!important;overflow:visible!important}
    #studioApp .studio-brand-row{visibility:hidden!important}
    #studioApp .biglwa-topbar-logo-direct{
      position:absolute!important;
      left:18px!important;
      top:50%!important;
      transform:translateY(-50%)!important;
      width:158px!important;
      height:auto!important;
      display:block!important;
      z-index:99999!important;
      text-decoration:none!important;
      background:transparent!important;
      pointer-events:auto!important;
    }
    #studioApp .biglwa-topbar-logo-direct img{
      display:block!important;
      width:100%!important;
      height:auto!important;
      max-width:none!important;
      max-height:none!important;
      object-fit:contain!important;
      filter:none!important;
      opacity:1!important;
      visibility:visible!important;
      mix-blend-mode:normal!important;
      background:transparent!important;
      border:0!important;
      box-shadow:none!important;
    }
    @media(max-width:900px){#studioApp .biglwa-topbar-logo-direct{left:12px!important;width:132px!important}}
    @media(max-width:620px){#studioApp .biglwa-topbar-logo-direct{left:10px!important;width:112px!important}}
  `;
  document.head.appendChild(style);

  function apply(){
    const bar = document.querySelector('#studioApp .topbar');
    if (!bar) return;
    let link = bar.querySelector(':scope > .biglwa-topbar-logo-direct');
    if (!link){
      link = document.createElement('a');
      link.className = 'biglwa-topbar-logo-direct';
      link.href = '/studio';
      link.setAttribute('aria-label','BIGLWA Studio');
      const img = document.createElement('img');
      img.src = LOGO;
      img.alt = '';
      img.loading = 'eager';
      img.decoding = 'async';
      img.draggable = false;
      link.appendChild(img);
      bar.appendChild(link);
    } else {
      const img = link.querySelector('img');
      if (img && img.getAttribute('src') !== LOGO) img.src = LOGO;
    }
  }

  let queued = false;
  const queue = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; apply(); });
  };
  new MutationObserver(queue).observe(document.documentElement,{subtree:true,childList:true});
  document.addEventListener('click',()=>setTimeout(apply,0),true);
  window.addEventListener('popstate',apply);
  setTimeout(apply,0);
  setTimeout(apply,100);
  setTimeout(apply,500);
})();