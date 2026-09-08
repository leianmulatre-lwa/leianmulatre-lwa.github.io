(() => {
  if (window.__biglwaLoginFixV6) return;
  window.__biglwaLoginFixV6 = true;

  const SYMBOL = '/assets/login-symbol-logo.webp?v=20260908-6';
  const style = document.createElement('style');
  style.id = 'biglwa-login-fix-v6-style';
  style.textContent = `
    #loginPage .login-stage > .login-brand-row,
    #loginPage .login-stage > .login-brand,
    #loginPage .login-stage .biglwa-wordmark-img,
    #loginPage .login-stage .biglwa-login-emblem { display:none!important; }
    #loginPage .login-card > .biglwa-login-emblem { display:none!important; }
    #loginPage .login-symbol-logo{display:block!important;width:min(270px,72%)!important;height:auto!important;object-fit:contain!important;margin:18px auto 8px!important;background:transparent!important;filter:drop-shadow(0 8px 18px rgba(48,18,16,.10));}
    #loginPage #loginTitle,#loginPage #loginSubmit{font-family:'BiglwaAspen',Georgia,serif!important;font-weight:400!important;letter-spacing:.015em!important;}
    #loginPage #loginTitle{font-size:31px!important;line-height:1!important;}
    #loginPage #loginSubmit{font-size:20px!important;line-height:1.05!important;}
    @media(max-width:620px){#loginPage .login-symbol-logo{width:min(225px,70%)!important;margin-top:14px!important;}#loginPage #loginTitle{font-size:27px!important;}#loginPage #loginSubmit{font-size:18px!important;}}
  `;
  document.head.appendChild(style);

  function applyLoginBrand(){
    const page = document.getElementById('loginPage');
    const card = document.getElementById('loginCard');
    if (!page || !card) return;
    page.querySelectorAll('.login-stage > .login-brand-row, .login-stage > .login-brand').forEach(el => el.style.setProperty('display','none','important'));
    page.querySelectorAll('.biglwa-login-emblem').forEach(el => el.style.setProperty('display','none','important'));
    let img = card.querySelector('.login-symbol-logo');
    if (!img) {
      img = document.createElement('img');
      img.className = 'login-symbol-logo';
      img.src = SYMBOL;
      img.alt = 'BIGLWA symbol';
      img.decoding = 'async';
      const head = card.querySelector('.login-card-head');
      card.insertBefore(img, head || card.firstChild);
    } else if (!img.src.includes('login-symbol-logo.webp')) {
      img.src = SYMBOL;
    }
  }

  let queued = false;
  const queue = () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; applyLoginBrand(); }); };
  new MutationObserver(queue).observe(document.documentElement, {subtree:true, childList:true});
  document.addEventListener('click', () => setTimeout(queue,0), true);
  window.addEventListener('popstate', queue);
  setTimeout(applyLoginBrand, 0);
  setTimeout(applyLoginBrand, 250);
})();
