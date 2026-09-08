(() => {
  if (window.__biglwaStudioLogoV7) return;
  window.__biglwaStudioLogoV7 = true;
  const SRC = '/assets/biglwa-header-logo.png?v=20260908-8';
  const style = document.createElement('style');
  style.id = 'biglwa-studio-logo-v7-style';
  style.textContent = `
    #studioApp .studio-brand-row{display:flex!important;align-items:center!important;height:100%!important;min-width:176px!important;}
    #studioApp a.brand{display:flex!important;align-items:center!important;padding:0!important;line-height:1!important;text-decoration:none!important;overflow:visible!important;}
    #studioApp .studio-header-logo{display:block!important;width:auto!important;height:42px!important;max-width:190px!important;object-fit:contain!important;border:0!important;background:transparent!important;box-shadow:none!important;}
    @media(max-width:900px){#studioApp .studio-brand-row{min-width:148px!important}#studioApp .studio-header-logo{height:36px!important;max-width:160px!important}}
    @media(max-width:620px){#studioApp .studio-brand-row{min-width:122px!important}#studioApp .studio-header-logo{height:31px!important;max-width:132px!important}}
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