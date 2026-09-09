(() => {
  if (window.__biglwaPolicyBrandV9) return;
  window.__biglwaPolicyBrandV9 = true;

  const LOGO = '/assets/biglwa-header-logo.png?v=20260909-1';

  const style = document.createElement('style');
  style.id = 'biglwa-policy-brand-v9-style';
  style.textContent = `
    .policy-top .policy-header-logo{display:block;height:48px;width:auto;max-width:150px;object-fit:contain;border:0;box-shadow:none;background:transparent;}
    .policy-top .login-brand{display:flex!important;align-items:center!important;padding:0!important;line-height:1!important;text-decoration:none!important;}
    @media(max-width:620px){.policy-top .policy-header-logo{height:40px;max-width:128px}}
  `;
  document.head.appendChild(style);

  function replacePolicyHeaderLogo(){
    document.querySelectorAll('.policy-page .policy-top .login-brand').forEach(a => {
      const current = a.querySelector('img.policy-header-logo');
      if (current && current.getAttribute('src') === LOGO && a.children.length === 1) return;
      a.replaceChildren();
      const img = document.createElement('img');
      img.className = 'policy-header-logo';
      img.src = LOGO;
      img.alt = 'BIGLWA';
      img.decoding = 'async';
      a.appendChild(img);
      a.setAttribute('aria-label','BIGLWA');
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