(() => {
  if (window.__biglwaLogoFrontFixV15) return;
  window.__biglwaLogoFrontFixV15 = true;

  const LOGO = '/assets/biglwa-header-logo.png?v=20260909-7';
  const style = document.createElement('style');
  style.id = 'biglwa-logo-front-fix-v15-style';
  style.textContent = `
    #studioApp .studio-brand-row>a.brand,
    .policy-page .policy-top .login-brand{
      font-size:0!important;
      color:transparent!important;
      text-shadow:none!important;
      text-indent:0!important;
    }
    #studioApp .studio-brand-row,
    .policy-page .policy-top{overflow:visible!important;}
    #studioApp .studio-brand-row>a.brand,
    .policy-page .policy-top .login-brand{
      position:relative!important;
      z-index:10000!important;
      isolation:isolate!important;
      overflow:visible!important;
      background:transparent!important;
    }
    #studioApp img.biglwa-front-logo,
    .policy-page img.biglwa-front-logo{
      display:block!important;
      position:relative!important;
      z-index:10001!important;
      opacity:1!important;
      visibility:visible!important;
      transform:none!important;
      filter:none!important;
      mix-blend-mode:normal!important;
      object-fit:contain!important;
      object-position:left center!important;
      pointer-events:auto!important;
      border:0!important;
      box-shadow:none!important;
      background:#f7f1e9!important;
    }
    #studioApp .studio-brand-row>a.brand{display:flex!important;align-items:center!important;width:190px!important;height:78px!important;padding:0!important;margin:0!important;}
    #studioApp img.biglwa-front-logo{width:182px!important;height:72px!important;}
    .policy-page .policy-top .login-brand{display:flex!important;align-items:center!important;justify-content:flex-start!important;width:224px!important;height:88px!important;padding:0!important;margin:0!important;}
    .policy-page img.biglwa-front-logo{width:214px!important;height:84px!important;}
    #rightsPage .rights-grid.three-body-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;}
    @media(max-width:900px){#rightsPage .rights-grid.three-body-grid{grid-template-columns:1fr!important;}}
    @media(max-width:620px){
      #studioApp .studio-brand-row>a.brand{width:142px!important;height:60px!important}
      #studioApp img.biglwa-front-logo{width:136px!important;height:56px!important}
      .policy-page .policy-top .login-brand{width:174px!important;height:72px!important}
      .policy-page img.biglwa-front-logo{width:166px!important;height:68px!important}
    }
  `;
  document.head.appendChild(style);

  function putLogo(anchor, ariaLabel){
    if (!anchor) return;
    const current = anchor.querySelector('img.biglwa-front-logo');
    if (current && current.getAttribute('src') === LOGO && anchor.children.length === 1) return;
    anchor.replaceChildren();
    anchor.textContent = '';
    anchor.setAttribute('aria-label', ariaLabel);
    const img = document.createElement('img');
    img.className = 'biglwa-front-logo';
    img.src = LOGO;
    img.alt = '';
    img.decoding = 'sync';
    img.loading = 'eager';
    img.fetchPriority = 'high';
    img.draggable = false;
    anchor.appendChild(img);
  }

  function updateAffidavit(){
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
    document.querySelectorAll('#studioApp .studio-brand-row>a.brand').forEach(a => putLogo(a,'BIGLWA Studio'));
    document.querySelectorAll('.policy-page .policy-top .login-brand').forEach(a => putLogo(a,'BIGLWA'));
    updateAffidavit();
    keepThreeBodies();
  }

  let queued = false;
  const queue = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; apply(); });
  };
  new MutationObserver(queue).observe(document.documentElement,{subtree:true,childList:true});
  window.addEventListener('popstate',queue);
  document.addEventListener('click',()=>setTimeout(queue,0),true);
  setTimeout(apply,0);
  setTimeout(apply,60);
  setTimeout(apply,180);
  setTimeout(apply,650);
})();