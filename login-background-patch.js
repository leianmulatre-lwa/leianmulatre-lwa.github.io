(() => {
  if (window.__biglwaLoginPhotoApplied) return;
  window.__biglwaLoginPhotoApplied = true;

  const style = document.createElement('style');
  style.id = 'biglwa-login-photo-style';
  style.textContent = `
    #loginPage.login-page{
      background-image:
        linear-gradient(90deg,rgba(246,240,233,.22) 0%,rgba(246,240,233,.05) 52%,rgba(24,20,19,.20) 100%),
        url('/assets/login-reference.webp?v=20260908-1')!important;
      background-size:cover!important;
      background-position:center center!important;
      background-repeat:no-repeat!important;
    }
    #loginPage.login-page::before{
      background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(28,22,21,.10))!important;
      opacity:1!important;
      mix-blend-mode:normal!important;
    }
    #loginPage .login-stage{position:relative;z-index:2}
    #loginPage .login-copy{max-width:720px;padding:24px 28px;border-radius:24px;background:rgba(250,247,241,.58);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);box-shadow:0 18px 50px rgba(40,28,25,.10)}
    #loginPage .login-copy h1,#loginPage .login-copy p,#loginPage .login-overline{color:#1d1917!important;text-shadow:none!important}
    #loginPage .login-copy h1 em{color:#8f3945!important;text-shadow:none!important}
    #loginPage .login-foot{color:#2e2926!important;background:rgba(250,247,241,.48);width:max-content;padding:8px 11px;border-radius:999px;backdrop-filter:blur(8px)}
    #loginPage .login-card{background:rgba(250,247,241,.90)!important;box-shadow:0 28px 80px rgba(27,19,18,.28)!important}
    #loginPage .biglwa-login-emblem{display:none!important}
    @media(max-width:900px){
      #loginPage.login-page{background-position:42% center!important}
      #loginPage .login-copy{margin:8vh 0 3vh;padding:20px}
    }
  `;
  document.head.appendChild(style);

  const cleanBrokenEmblem = () => {
    document.querySelectorAll('#loginPage img[alt*="BIGLWA" i],#loginPage img[alt*="emblem" i]').forEach(img => {
      if (img.classList.contains('biglwa-wordmark-img')) return;
      if (!img.complete || img.naturalWidth === 0 || img.classList.contains('biglwa-login-emblem')) img.remove();
    });
  };
  cleanBrokenEmblem();
  new MutationObserver(cleanBrokenEmblem).observe(document.documentElement,{subtree:true,childList:true});
})();