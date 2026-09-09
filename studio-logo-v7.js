(() => {
  if (window.__biglwaStudioLogoV10) return;
  window.__biglwaStudioLogoV10 = true;

  const LOGO = '/assets/biglwa-header-logo.png?v=20260909-2';
  const style = document.createElement('style');
  style.id = 'biglwa-studio-logo-v10-style';
  style.textContent = `
    #studioApp .studio-brand-row{display:flex!important;align-items:center!important;height:100%!important;min-width:176px!important;overflow:visible!important;}
    #studioApp .studio-brand-row>a.brand{display:block!important;width:166px!important;height:72px!important;padding:0!important;margin:0!important;line-height:0!important;text-decoration:none!important;font-size:0!important;color:transparent!important;background-image:url('${LOGO}')!important;background-repeat:no-repeat!important;background-position:left center!important;background-size:contain!important;overflow:hidden!important;}
    #studioApp .studio-brand-row>a.brand>*{display:none!important;}
    @media(max-width:900px){#studioApp .studio-brand-row{min-width:150px!important}#studioApp .studio-brand-row>a.brand{width:145px!important;height:64px!important}}
    @media(max-width:620px){#studioApp .studio-brand-row{min-width:126px!important}#studioApp .studio-brand-row>a.brand{width:122px!important;height:56px!important}}
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
        a.replaceChildren();
      }
      a.textContent = '';
      a.setAttribute('aria-label','BIGLWA Studio');
      a.style.setProperty('background-image', `url("${LOGO}")`, 'important');
    });
  }

  let queued = false;
  const queue = () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; apply(); }); };
  new MutationObserver(queue).observe(document.documentElement,{subtree:true,childList:true});
  window.addEventListener('popstate',queue);
  document.addEventListener('click',()=>setTimeout(queue,0),true);
  setTimeout(apply,0);
  setTimeout(apply,200);
  setTimeout(apply,800);
})();