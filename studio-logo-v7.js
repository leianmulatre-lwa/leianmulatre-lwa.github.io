(() => {
  if (window.__biglwaStudioLogoV11) return;
  window.__biglwaStudioLogoV11 = true;

  const LOGO = '/assets/biglwa-header-logo.png?v=20260909-4';
  const style = document.createElement('style');
  style.id = 'biglwa-studio-logo-v11-style';
  style.textContent = `
    #studioApp .studio-brand-row{display:flex!important;align-items:center!important;height:100%!important;min-width:194px!important;overflow:visible!important;}
    #studioApp .studio-brand-row>a.brand{display:flex!important;align-items:center!important;width:186px!important;height:78px!important;padding:0!important;margin:0!important;line-height:0!important;text-decoration:none!important;font-size:0!important;color:transparent!important;background:none!important;overflow:visible!important;}
    #studioApp .studio-brand-row>a.brand .studio-block-logo{display:block!important;width:178px!important;height:auto!important;max-height:74px!important;object-fit:contain!important;object-position:left center!important;border:0!important;box-shadow:none!important;background:transparent!important;}
    @media(max-width:900px){#studioApp .studio-brand-row{min-width:166px!important}#studioApp .studio-brand-row>a.brand{width:158px!important;height:68px!important}#studioApp .studio-brand-row>a.brand .studio-block-logo{width:152px!important;max-height:64px!important}}
    @media(max-width:620px){#studioApp .studio-brand-row{min-width:144px!important}#studioApp .studio-brand-row>a.brand{width:138px!important;height:60px!important}#studioApp .studio-brand-row>a.brand .studio-block-logo{width:132px!important;max-height:56px!important}}
  `;
  document.head.appendChild(style);

  function apply(){
    document.querySelectorAll('#studioApp .studio-brand-row').forEach(row => {
      let a = row.querySelector('a.brand');
      if (!a) {
        a = document.createElement('a');
        a.className = 'brand';
        a.href = '/studio';
        row.replaceChildren(a);
      } else {
        [...row.children].forEach(child => { if (child !== a) child.remove(); });
      }
      const current = a.querySelector('img.studio-block-logo');
      if (!(current && current.getAttribute('src') === LOGO && a.children.length === 1)) {
        a.replaceChildren();
        const img = document.createElement('img');
        img.className = 'studio-block-logo';
        img.src = LOGO;
        img.alt = '';
        img.decoding = 'async';
        img.draggable = false;
        a.appendChild(img);
      }
      a.setAttribute('aria-label','BIGLWA Studio');
    });
  }

  let queued = false;
  const queue = () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; apply(); }); };
  new MutationObserver(queue).observe(document.documentElement,{subtree:true,childList:true});
  window.addEventListener('popstate',queue);
  document.addEventListener('click',()=>setTimeout(queue,0),true);
  setTimeout(apply,0);
  setTimeout(apply,150);
  setTimeout(apply,700);
})();