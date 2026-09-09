(() => {
  if (window.__biglwaPolicyResetV8) return;
  window.__biglwaPolicyResetV8 = true;

  const SEAL = '/assets/biglwa-seal-black.png?v=20260908-10';
  const PENDING = 'biglwaPendingNewAccount';

  const style = document.createElement('style');
  style.id = 'biglwa-policy-reset-v8-style';
  style.textContent = `
    #loginPage .login-card{font-family:'BiglwaAspen',Georgia,serif!important;}
    #loginPage .login-card input{font-family:Inter,ui-sans-serif,system-ui,sans-serif!important;}
    #loginPage .login-card .login-privacy,#loginPage .login-card .login-message{font-family:Inter,ui-sans-serif,system-ui,sans-serif!important;}
    #loginPage .login-seal{display:block;width:min(250px,64%);height:auto;margin:2px auto 10px;object-fit:contain;opacity:.96;}
    .policy-card .policy-seal{display:block;width:min(220px,42vw);height:auto;margin:2px auto 18px;object-fit:contain;opacity:.9;}
    .policy-card .policy-kicker{text-align:center;}
    .policy-card h1{text-align:center;max-width:820px;margin-left:auto;margin-right:auto;}
    .policy-card .affidavit-copy{max-width:800px;margin:0 auto;}
    .policy-card .affidavit-copy p{font-size:13px;line-height:1.72;color:#514843;margin:0 0 16px;}
    .policy-card .affidavit-byline{max-width:800px;margin:26px auto 0;padding:18px 20px;border:1px solid #d8ccc2;border-radius:15px;background:rgba(255,255,255,.36);font-family:Inter,ui-sans-serif,system-ui,sans-serif;}
    .policy-card .affidavit-byline b{font-family:'BiglwaAspen',Georgia,serif;font-size:18px;font-weight:400;}
    .policy-card .affidavit-byline span{display:block;margin-top:6px;font-size:12px;color:#6f655f;}
    .policy-card .author-note{max-width:800px;margin:0 auto 20px;padding:11px 14px;border-left:3px solid #1e1b19;background:rgba(246,240,233,.7);font-size:11px;line-height:1.55;color:#675d57;font-family:Inter,ui-sans-serif,system-ui,sans-serif;}
    #studioApp .real-rank[data-rank='chopped'] .rank-track i{width:0!important;}
    #studioApp .profile-card.fresh-profile .verified{display:none!important;}
    #studioApp .profile-card.fresh-profile .eyebrow{letter-spacing:1.6px;}
    @media(max-width:620px){#loginPage .login-seal{width:min(205px,66%)}.policy-card .policy-seal{width:min(180px,54vw)}}
  `;
  document.head.appendChild(style);

  const addSeal = (root, cls) => {
    if (!root || root.querySelector(`.${cls}`)) return;
    const img = document.createElement('img');
    img.src = SEAL;
    img.className = cls;
    img.alt = 'BIGLWA seal';
    img.decoding = 'async';
    const target = root.querySelector('.login-card-head,.policy-kicker,h1') || root.firstChild;
    root.insertBefore(img, target);
  };

  const affidavitHTML = `
    <img class="policy-seal" src="${SEAL}" alt="BIGLWA seal" decoding="async">
    <p class="policy-kicker">Personal affidavit · June 23, 2026</p>
    <h1>Affidavit of Good Faith, Educational Purpose, and Public Interest</h1>
    <p class="author-note"><strong>Author's statement.</strong> This is Leian Mulatre's published affidavit for the BIGLWA project. It is not a member-submission form or a declaration other users are asked to sign.</p>
    <div class="affidavit-copy">
      <p>I, Leian, hereby affirm that the work, research, testimony, documentation, media, and public commentary connected to this project are being created in good faith and for the purpose of education, cultural preservation, public awareness, and community protection.</p>
      <p>This project is intended to help the American public better understand the historical, political, social, racial, technological, and cultural forces shaping our present moment. Its purpose is not to harm, exploit, harass, defame, or endanger any person or community, but to document truth, encourage critical thinking, and provide language for people who have been harmed, misled, silenced, surveilled, or taken advantage of by powerful institutions and systems.</p>
      <p>This work may address topics including, but not limited to, American empire, propaganda, racial capitalism, anti-Blackness, colorism, Haitian history and diaspora, queerness, gender, class, education, digital exploitation, artificial intelligence, platform culture, beauty standards, youth vulnerability, and the ways marginalized people are often used before they are protected.</p>
      <p>I affirm that the purpose of this work is to do good. It is intended to educate the public, amplify Black voices, honor Haitian and diasporic history, protect young people from exploitation, and create a record for future generations. It is also intended to help people understand how manipulation can occur through media, technology, institutions, culture, and social pressure.</p>
      <p>Any personal experiences shared through this project will be presented as testimony, reflection, memory, opinion, research, or documented evidence to the best of my ability. I affirm that I will make reasonable efforts to distinguish between fact, belief, interpretation, and allegation where appropriate. I further affirm that this project is not created for revenge, misinformation, or public harm, but for truth-telling, education, accountability, healing, and collective understanding.</p>
      <p>This project is bigger than one individual. It is an archive, a warning, a love letter, and a tool for those who come after us. Its purpose is to help people see what has been hidden, question what they have been taught, and protect themselves and their communities with knowledge.</p>
      <p>I make this statement voluntarily and in good faith.</p>
    </div>
    <div class="affidavit-byline"><b>Signed: Leian Mulatre</b><span>Printed Name: Leian Mulatre</span><span>Date: 06/23/26</span></div>
    <nav class="policy-links"><a href="/privacy" data-policy-route="privacy">Privacy</a><a href="/terms" data-policy-route="terms">Terms</a><a href="/rights" data-policy-route="rights">Rights &amp; Likeness</a></nav>`;

  const applyPolicies = () => {
    const loginCard = document.getElementById('loginCard');
    if (loginCard) addSeal(loginCard, 'login-seal');
    ['privacyPage','termsPage','rightsPage'].forEach(id => {
      const card = document.querySelector(`#${id} .policy-card`);
      if (card) addSeal(card, 'policy-seal');
    });
    const affidavit = document.querySelector('#affidavitPage .policy-card');
    if (affidavit && affidavit.dataset.personalAffidavit !== '1') {
      affidavit.innerHTML = affidavitHTML;
      affidavit.dataset.personalAffidavit = '1';
    }
  };

  const applyFreshProfile = () => {
    if (localStorage.getItem('biglwaRealRank') !== 'chopped') return;
    const card = document.querySelector('#studioApp .profile-card');
    if (!card) return;
    card.classList.add('fresh-profile');
    const welcome = document.querySelector('#studioApp .welcome strong')?.textContent?.trim() || 'newmember';
    const username = welcome.toLowerCase().replace(/\s+/g,'');
    const name = card.querySelector('.profile-name-line h1');
    if (name) name.textContent = '@' + username;
    const avatar = card.querySelector('.profile-avatar');
    if (avatar) avatar.textContent = (username[0] || 'B').toUpperCase();
    const eyebrow = card.querySelector('.eyebrow');
    if (eyebrow) eyebrow.textContent = 'NEW MEMBER · BUILD YOUR STUDIO';
    const bio = card.querySelector('.bio');
    if (bio) bio.textContent = 'Add a bio, identity, and creative focus in Edit Profile.';
    const meta = card.querySelector('.meta-row');
    if (meta) {
      const span = meta.querySelector('span');
      const link = meta.querySelector('a');
      if (span) span.textContent = '⌖ Add location';
      if (link) { link.textContent = `biglwa.com/${username}`; link.href = '#'; }
    }
    const stats = card.querySelectorAll('.stats span');
    if (stats[0]) stats[0].innerHTML = '<b>0</b> Followers';
    if (stats[1]) stats[1].innerHTML = '<b>0</b> Following';
    const rank = card.querySelector('.real-rank');
    if (rank) {
      rank.dataset.rank = 'chopped';
      rank.setAttribute('aria-label','Real Rank: Chopped, progressing toward 007');
      const strong = rank.querySelector('strong');
      const next = rank.querySelector('.rank-next');
      const fill = rank.querySelector('.rank-track i');
      if (strong) strong.textContent = 'Chopped';
      if (next) next.textContent = '007';
      if (fill) fill.style.width = '0%';
    }
  };

  const resetFreshAccount = () => {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('biglwa')) localStorage.removeItem(key);
    });
    localStorage.setItem('biglwaRealRank','chopped');
    localStorage.setItem('biglwaFreshProfile','1');
    sessionStorage.removeItem(PENDING);
    location.reload();
  };

  const loginCard = document.getElementById('loginCard');
  loginCard?.addEventListener('submit', () => {
    if (loginCard.dataset.mode === 'create') sessionStorage.setItem(PENDING, String(Date.now()));
  }, true);
  document.getElementById('signInTab')?.addEventListener('click', () => sessionStorage.removeItem(PENDING), true);

  const maybeReset = () => {
    const started = Number(sessionStorage.getItem(PENDING) || 0);
    if (!started || Date.now() - started > 30000) return;
    const studio = document.getElementById('studioApp');
    const submit = document.getElementById('loginSubmit');
    if (studio?.classList.contains('is-active') && submit && !submit.disabled && Date.now() - started > 1200) resetFreshAccount();
  };

  let queued = false;
  const apply = () => {
    queued = false;
    applyPolicies();
    applyFreshProfile();
    maybeReset();
  };
  const queue = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(apply);
  };
  new MutationObserver(queue).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  document.addEventListener('click',()=>setTimeout(queue,0),true);
  window.addEventListener('popstate',queue);
  setInterval(maybeReset,350);
  setTimeout(apply,0);
  setTimeout(apply,300);
})();