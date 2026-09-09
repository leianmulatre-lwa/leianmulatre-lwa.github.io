(() => {
  if (window.__biglwaStudioLogoV9) return;
  window.__biglwaStudioLogoV9 = true;
  const SRC = '/assets/biglwa-header-logo.png?v=20260909-1';
  const style = document.createElement('style');
  style.id = 'biglwa-studio-logo-v9-style';
  style.textContent = `
    #studioApp .studio-brand-row{display:flex!important;align-items:center!important;height:100%!important;min-width:140px!important;}
    #studioApp a.brand{display:flex!important;align-items:center!important;padding:0!important;line-height:1!important;text-decoration:none!important;overflow:visible!important;}
    #studioApp .studio-header-logo{display:block!important;height:54px!important;width:auto!important;max-width:150px!important;object-fit:contain!important;border:0!important;box-shadow:none!important;}
    @media(max-width:900px){#studioApp .studio-brand-row{min-width:126px!important}#studioApp .studio-header-logo{height:48px!important;max-width:138px!important}}
    @media(max-width:620px){#studioApp .studio-brand-row{min-width:110px!important}#studioApp .studio-header-logo{height:42px!important;max-width:122px!important}}
  `;
  document.head.appendChild(style);
  const apply = () => {
    document.querySelectorAll('#studioApp a.brand').forEach(a => {
      const current = a.querySelector('img.studio-header-logo');
      if (current && current.getAttribute('src') === SRC && a.children.length === 1) return;
      a.replaceChildren();
      const img = document.createElement('img');
      img.className = 'studio-header-logo';
      img.src = SRC;
      img.alt = 'BIGLWA';
      img.decoding = 'async';
      a.appendChild(img);
      a.setAttribute('aria-label','BIGLWA Studio');
    });
  };
  let queued = false;
  const queue = () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; apply(); }); };
  new MutationObserver(queue).observe(document.documentElement,{subtree:true,childList:true});
  window.addEventListener('popstate',queue);
  document.addEventListener('click',()=>setTimeout(queue,0),true);
  setTimeout(apply,0);
  setTimeout(apply,300);
})();