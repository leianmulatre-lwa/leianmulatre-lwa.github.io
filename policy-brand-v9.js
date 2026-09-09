(() => {
  if (window.__biglwaPolicyBrandV12) return;
  window.__biglwaPolicyBrandV12 = true;

  const LOGO = '/assets/biglwa-header-logo.png?v=20260909-4';

  const style = document.createElement('style');
  style.id = 'biglwa-policy-brand-v12-style';
  style.textContent = `
    .policy-top .login-brand{display:flex!important;align-items:center!important;justify-content:flex-start!important;width:224px!important;height:88px!important;padding:0!important;margin:0!important;line-height:0!important;text-decoration:none!important;font-size:0!important;color:transparent!important;background:none!important;overflow:visible!important;}
    .policy-top .login-brand .policy-block-logo{display:block!important;width:214px!important;height:auto!important;max-height:84px!important;object-fit:contain!important;object-position:left center!important;border:0!important;box-shadow:none!important;background:transparent!important;}
    #rightsPage .rights-grid.three-body-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;}
    @media(max-width:900px){#rightsPage .rights-grid.three-body-grid{grid-template-columns:1fr!important;}}
    @media(max-width:620px){.policy-top .login-brand{width:174px!important;height:72px!important}.policy-top .login-brand .policy-block-logo{width:166px!important;max-height:68px!important}}
  `;
  document.head.appendChild(style);

  function replacePolicyHeaderLogo(){
    document.querySelectorAll('.policy-page .policy-top .login-brand').forEach(a => {
      const current = a.querySelector('img.policy-block-logo');
      if (current && current.getAttribute('src') === LOGO && a.children.length === 1) return;
      a.replaceChildren();
      a.textContent = '';
      a.removeAttribute('style');
      a.setAttribute('aria-label','BIGLWA');
      const img = document.createElement('img');
      img.className = 'policy-block-logo';
      img.src = LOGO;
      img.alt = '';
      img.decoding = 'async';
      img.draggable = false;
      a.appendChild(img);
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

  function keepThreeBodies(){
    const grid = document.querySelector('#rightsPage .rights-grid');
    if (!grid) return;
    [...grid.children].forEach(card => {
      const text = (card.textContent || '').replace(/\s+/g,' ').trim();
      if (/^04\b/.test(text) || text.includes('Escalation can be real')) card.remove();
    });
    grid.classList.add('three-body-grid');
  }

  function apply(){
    replacePolicyHeaderLogo();
    updateAffidavitSignature();
    keepThreeBodies();
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
  setTimeout(apply,150);
  setTimeout(apply,700);
})();