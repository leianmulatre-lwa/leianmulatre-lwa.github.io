(() => {
  if (window.__biglwaStudioLogoV8) return;
  window.__biglwaStudioLogoV8 = true;

  const style = document.createElement('style');
  style.id = 'biglwa-studio-logo-v8-style';
  style.textContent = `
    #studioApp .studio-brand-row{display:flex!important;align-items:center!important;height:100%!important;min-width:182px!important;}
    #studioApp a.brand{display:flex!important;align-items:center!important;padding:0!important;line-height:1!important;text-decoration:none!important;overflow:visible!important;}
    #studioApp .studio-composite-logo{display:flex;align-items:center;gap:7px;height:52px;transform:translateY(-1px)}
    #studioApp .studio-composite-logo .big-word{font-family:'BiglwaAspen',Georgia,serif;font-size:43px;line-height:.9;letter-spacing:-2.2px;color:#171313;white-space:nowrap}
    #studioApp .lwa-blocks{position:relative;width:49px;height:47px;display:block;flex:0 0 49px}
    #studioApp .lwa-block{position:absolute;width:24px;height:24px;display:grid;place-items:center;border:1.5px solid #1f1b19;background:#f1dfbd;color:#171313;font-family:'BiglwaAspen',Georgia,serif;font-size:17px;line-height:1;box-shadow:inset -2px -2px 0 rgba(91,58,35,.14);text-transform:lowercase}
    #studioApp .lwa-block.l{left:12px;top:0;background:#ead7b8;border-color:#6f382e;transform:rotate(-1deg)}
    #studioApp .lwa-block.w{left:0;top:22px;background:#d9e2df;border-color:#315c68;transform:rotate(1deg)}
    #studioApp .lwa-block.a{right:0;top:22px;background:#eee0a9;border-color:#a88821;transform:rotate(-1deg)}
    #studioApp .lwa-block.l span{display:inline-block;transform:translateY(-1px);font-size:18px}
    @media(max-width:900px){#studioApp .studio-brand-row{min-width:160px!important}#studioApp .studio-composite-logo{transform:scale(.9);transform-origin:left center}}
    @media(max-width:620px){#studioApp .studio-brand-row{min-width:136px!important}#studioApp .studio-composite-logo{transform:scale(.78);transform-origin:left center}}
  `;
  document.head.appendChild(style);

  const apply = () => {
    document.querySelectorAll('#studioApp a.brand').forEach(a => {
      if (a.querySelector('.studio-composite-logo')) return;
      a.replaceChildren();
      const logo = document.createElement('span');
      logo.className = 'studio-composite-logo';
      logo.setAttribute('aria-hidden','true');
      logo.innerHTML = `
        <span class="big-word">big</span>
        <span class="lwa-blocks">
          <span class="lwa-block l"><span>l</span></span>
          <span class="lwa-block w"><span>w</span></span>
          <span class="lwa-block a"><span>a</span></span>
        </span>`;
      a.appendChild(logo);
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