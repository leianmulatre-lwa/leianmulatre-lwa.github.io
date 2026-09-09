(() => {
  if (window.__biglwaPolicyBrandV11) return;
  window.__biglwaPolicyBrandV11 = true;

  const LOGO = '/assets/biglwa-header-logo.png?v=20260909-2';

  const style = document.createElement('style');
  style.id = 'biglwa-policy-brand-v11-style';
  style.textContent = `
    .policy-top .login-brand{display:block!important;width:156px!important;height:66px!important;padding:0!important;margin:0!important;line-height:0!important;text-decoration:none!important;font-size:0!important;color:transparent!important;background-image:url('${LOGO}')!important;background-repeat:no-repeat!important;background-position:left center!important;background-size:contain!important;overflow:hidden!important;}
    .policy-top .login-brand>*{display:none!important;}
    #rightsPage .rights-grid.three-body-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;}
    @media(max-width:900px){#rightsPage .rights-grid.three-body-grid{grid-template-columns:1fr!important;}}
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
  setTimeout(apply,300);
})();