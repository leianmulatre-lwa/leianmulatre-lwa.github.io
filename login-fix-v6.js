(() => {
  if (window.__biglwaLoginFixV6) return;
  window.__biglwaLoginFixV6 = true;

  const style = document.createElement('style');
  style.id = 'biglwa-login-fix-v6-style';
  style.textContent = `
    #loginPage .login-stage > .login-brand-row,
    #loginPage .login-stage > .login-brand,
    #loginPage .login-stage .biglwa-wordmark-img,
    #loginPage .login-stage .biglwa-login-emblem,
    #loginPage .login-card > .biglwa-login-emblem,
    #loginPage .login-symbol-logo { display:none!important; }
    #loginPage #loginTitle,#loginPage #loginSubmit{font-family:'BiglwaAspen',Georgia,serif!important;font-weight:400!important;letter-spacing:.015em!important;}
    #loginPage #loginTitle{font-size:31px!important;line-height:1!important;}
    #loginPage #loginSubmit{font-size:20px!important;line-height:1.05!important;}
    @media(max-width:620px){#loginPage #loginTitle{font-size:27px!important;}#loginPage #loginSubmit{font-size:18px!important;}}
  `;
  document.head.appendChild(style);

  function applyLoginBrand(){
    const page = document.getElementById('loginPage');
    if (!page) return;
    page.querySelectorAll('.login-stage > .login-brand-row, .login-stage > .login-brand, .biglwa-login-emblem, .login-symbol-logo').forEach(el => el.style.setProperty('display','none','important'));
  }

  let queued = false;
  const queue = () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; applyLoginBrand(); }); };
  new MutationObserver(queue).observe(document.documentElement, {subtree:true, childList:true});
  document.addEventListener('click', () => setTimeout(queue,0), true);
  window.addEventListener('popstate', queue);
  setTimeout(applyLoginBrand, 0);
  setTimeout(applyLoginBrand, 250);
})();