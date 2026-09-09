(() => {
  if (window.__biglwaPolicyBrandV10) return;
  window.__biglwaPolicyBrandV10 = true;

  const LOGO = '/assets/biglwa-header-logo.png?v=20260909-2';

  const style = document.createElement('style');
  style.id = 'biglwa-policy-brand-v10-style';
  style.textContent = `
    .policy-top .login-brand{display:block!important;width:156px!important;height:66px!important;padding:0!important;margin:0!important;line-height:0!important;text-decoration:none!important;font-size:0!important;color:transparent!important;background-image:url('${LOGO}')!important;background-repeat:no-repeat!important;background-position:left center!important;background-size:contain!important;overflow:hidden!important;}
    .policy-top .login-brand>*{display:none!important;}
    @media(max-width:620px){.policy-top .login-brand{width:132px!important;height:58px!important}}
  `;
  document.head.appendChild(style);

  function replacePolicyHeaderLogo(){
    document.querySelectorAll('.policy-page .policy-top .login-brand').forEach(a => {
      a.replaceChildren();
      a.textContent = '';
      a.setAttribute('aria-label','BIGLWA');
      a.style.setProperty('background-image', `url("${LOGO}")`, 'important');
    });
  }

  function updateAffidavitSignature(){
    const card = document.querySelector('#affidavitPage .policy-card');
    if (!card) return;

    const note = card.querySelector('.author-note');
    if (note) note.innerHTML = "<strong>Author's statement.</strong> This is Leian Stanley's published affidavit for the BIGLWA project. It is not a member-submission form or a declaration other users are asked to sign.";

    const byline = card.querySelector('.affidavit-byline');
    if (byline) byline.innerHTML = '<b>Signed: Leian Stanley</b><span>Printed Name: Leian Stanley</span><span>Date: 06/23/26</span>';
  }

  function apply(){
    replacePolicyHeaderLogo();
    updateAffidavitSignature();
  }

  let queued = false;
  const queue = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; apply(); });
  };

  new MutationObserver(queue).observe(document.documentElement,{subtree:true,childList:true});
  document.addEventListener('click',()=>setTimeout(queue,0),true);
  window.addEventListener('popstate',queue);
  setTimeout(apply,0);
  setTimeout(apply,300);
})();