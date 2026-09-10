(() => {
  if (window.__biglwaStableRuntime) return;
  window.__biglwaStableRuntime = true;

  const LOGO = '/assets/biglwa-header-user-final.png?v=20260910-clean';
  const SEAL = '/assets/biglwa-seal-black.png?v=20260910-clean';
  const GAMES = '/assets/games-lwa-blocks.webp?v=20260910-clean';

  const style = document.createElement('style');
  style.id = 'biglwa-stable-runtime-style';
  style.textContent = `
    @font-face{font-family:'BiglwaAspen';src:url('/assets/fonts/aspen-biglwa.woff2') format('woff2');font-style:normal;font-weight:400;font-display:swap}
    #loginPage .login-stage>.login-brand-row,#loginPage .login-stage>.login-brand{display:none!important}
    #loginPage #loginTitle,#loginPage #loginSubmit{font-family:'BiglwaAspen',Georgia,serif!important;font-weight:400!important}
    #loginPage.login-page{background-image:linear-gradient(90deg,rgba(246,240,233,.22),rgba(246,240,233,.05) 52%,rgba(24,20,19,.20)),url('/assets/login-reference.webp')!important;background-size:cover!important;background-position:center!important;background-repeat:no-repeat!important}
    #loginPage .login-card{background:rgba(250,247,241,.90)!important;box-shadow:0 28px 80px rgba(27,19,18,.28)!important}
    #studioApp .studio-brand-row>a.brand,.policy-page .policy-top .login-brand{font-size:0!important;color:transparent!important;text-shadow:none!important;background:transparent!important;display:flex!important;align-items:center!important;justify-content:flex-start!important;overflow:visible!important}
    #studioApp .studio-brand-row>a.brand::before,#studioApp .studio-brand-row>a.brand::after,.policy-page .policy-top .login-brand::before,.policy-page .policy-top .login-brand::after{content:none!important;display:none!important}
    #studioApp .studio-brand-row>a.brand{width:138px!important;height:62px!important;padding:0!important;margin:0!important}
    .policy-page .policy-top .login-brand{width:158px!important;height:70px!important;padding:0!important;margin:0!important}
    .biglwa-stable-logo{display:block!important;width:100%!important;height:100%!important;object-fit:contain!important;object-position:left center!important;border:0!important;box-shadow:none!important;filter:none!important;background:transparent!important;opacity:1!important;visibility:visible!important}
    #rightsPage .rights-grid.three-body-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}
    #affidavitPage .policy-card[data-stable-affidavit='1']{visibility:visible!important}
    .policy-card .policy-seal{display:block;width:min(220px,42vw);height:auto;margin:2px auto 18px;object-fit:contain;opacity:.9}
    .policy-card .policy-kicker{text-align:center}.policy-card h1{text-align:center;max-width:820px;margin-left:auto;margin-right:auto}
    .policy-card .affidavit-copy{max-width:800px;margin:0 auto}.policy-card .affidavit-copy p{font-size:13px;line-height:1.72;color:#514843;margin:0 0 16px}
    .policy-card .author-note{max-width:800px;margin:0 auto 20px;padding:11px 14px;border-left:3px solid #1e1b19;background:rgba(246,240,233,.7);font-size:11px;line-height:1.55;color:#675d57}
    .policy-card .affidavit-byline{max-width:800px;margin:26px auto 0;padding:18px 20px;border:1px solid #d8ccc2;border-radius:15px;background:rgba(255,255,255,.36)}
    .policy-card .affidavit-byline b{font-family:'BiglwaAspen',Georgia,serif;font-size:18px;font-weight:400}.policy-card .affidavit-byline span{display:block;margin-top:6px;font-size:12px;color:#6f655f}
    .orbit-field-label{display:block;margin:8px 0 4px;font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:#7d736c}
    @media(max-width:900px){#rightsPage .rights-grid.three-body-grid{grid-template-columns:1fr!important}}
    @media(max-width:620px){#studioApp .studio-brand-row>a.brand{width:114px!important;height:52px!important}.policy-page .policy-top .login-brand{width:132px!important;height:60px!important}}
  `;
  document.head.appendChild(style);

  const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const readJSON=(key,fallback={})=>{try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback))}catch{return fallback}};
  const writeJSON=(key,value)=>localStorage.setItem(key,JSON.stringify(value));

  function putLogo(anchor,label){
    if(!anchor) return;
    let img=anchor.querySelector(':scope > img.biglwa-stable-logo');
    if(!img){
      anchor.replaceChildren();
      img=document.createElement('img');
      img.className='biglwa-stable-logo';
      img.alt='';
      img.decoding='async';
      img.loading='eager';
      img.draggable=false;
      anchor.appendChild(img);
    }
    if(img.getAttribute('src')!==LOGO) img.src=LOGO;
    anchor.setAttribute('aria-label',label);
  }

  function applyBranding(){
    document.querySelectorAll('#studioApp .studio-brand-row>a.brand').forEach(a=>putLogo(a,'BIGLWA Studio'));
    document.querySelectorAll('.policy-page .policy-top .login-brand').forEach(a=>putLogo(a,'BIGLWA'));
    document.querySelectorAll('#loginPage .login-stage>.login-brand-row,#loginPage .login-stage>.login-brand').forEach(el=>el.remove());
    document.querySelectorAll('.biglwa-games-card-logo,.biglwa-games-module-logo').forEach(img=>{if(img instanceof HTMLImageElement&&img.getAttribute('src')!==GAMES){img.src=GAMES;img.alt=''}});
  }

  const affidavitHTML = `
    <img class="policy-seal" src="${SEAL}" alt="" decoding="async">
    <p class="policy-kicker">Personal affidavit · June 23, 2026</p>
    <h1>Affidavit of Good Faith, Educational Purpose, and Public Interest</h1>
    <p class="author-note"><strong>Author's statement.</strong> This is Leian Stanley's published affidavit for the BIGLWA project. It is not a member-submission form or a declaration other users are asked to sign.</p>
    <div class="affidavit-copy">
      <p>I, Leian, hereby affirm that the work, research, testimony, documentation, media, and public commentary connected to this project are being created in good faith and for the purpose of education, cultural preservation, public awareness, and community protection.</p>
      <p>This project is intended to help the American public better understand the historical, political, social, racial, technological, and cultural forces shaping our present moment. Its purpose is not to harm, exploit, harass, defame, or endanger any person or community, but to document truth, encourage critical thinking, and provide language for people who have been harmed, misled, silenced, surveilled, or taken advantage of by powerful institutions and systems.</p>
      <p>This work may address topics including, but not limited to, American empire, propaganda, racial capitalism, anti-Blackness, colorism, Haitian history and diaspora, queerness, gender, class, education, digital exploitation, artificial intelligence, platform culture, beauty standards, youth vulnerability, and the ways marginalized people are often used before they are protected.</p>
      <p>I affirm that the purpose of this work is to do good. It is intended to educate the public, amplify Black voices, honor Haitian and diasporic history, protect young people from exploitation, and create a record for future generations. It is also intended to help people understand how manipulation can occur through media, technology, institutions, culture, and social pressure.</p>
      <p>Any personal experiences shared through this project will be presented as testimony, reflection, memory, opinion, research, or documented evidence to the best of my ability. I affirm that I will make reasonable efforts to distinguish between fact, belief, interpretation, and allegation where appropriate. I further affirm that this project is not created for revenge, misinformation, or public harm, but for truth-telling, education, accountability, healing, and collective understanding.</p>
      <p>This project is bigger than one individual. It is an archive, a warning, a love letter, and a tool for those who come after us. Its purpose is to help people see what has been hidden, question what they have been taught, and protect themselves and their communities with knowledge.</p>
      <p>I make this statement voluntarily and in good faith.</p>
    </div>
    <div class="affidavit-byline"><b>Signed: Leian Stanley</b><span>Printed Name: Leian Stanley</span><span>Date: 06/23/26</span></div>
    <nav class="policy-links"><a href="/privacy" data-policy-route="privacy">Privacy</a><a href="/terms" data-policy-route="terms">Terms</a><a href="/rights" data-policy-route="rights">Rights &amp; Likeness</a></nav>`;

  function applyPolicies(){
    const affidavit=document.querySelector('#affidavitPage .policy-card');
    if(affidavit&&affidavit.dataset.stableAffidavit!=='1'){
      affidavit.innerHTML=affidavitHTML;
      affidavit.dataset.stableAffidavit='1';
    }
    const grid=document.querySelector('#rightsPage .rights-grid');
    if(grid){
      [...grid.children].forEach(card=>{
        const text=(card.textContent||'').replace(/\s+/g,' ').trim();
        if(/^04\b/.test(text)||text.includes('Escalation can be real')) card.remove();
      });
      grid.classList.add('three-body-grid');
    }
  }

  const orbitApps=[['instagram','IG','Instagram'],['facebook','FB','Facebook'],['x','X','X'],['pinterest','P','Pinterest'],['youtube','YT','YouTube'],['tiktok','TT','TikTok'],['twitch','TW','Twitch'],['linkedin','IN','LinkedIn'],['tumblr','T','Tumblr'],['substack','S','Substack']];
  function patchOrbit(){
    const route=document.querySelector('#moduleRouteName')?.textContent?.trim().toLowerCase();
    const body=document.querySelector('#moduleWorkspaceBody');
    if(route!=='orbit'||!body) return;
    const grid=body.querySelector('.module-orbit');
    if(!grid||grid.dataset.stableOrbit==='1') return;
    const links=readJSON('biglwaOrbitLinks',{}),auth=readJSON('biglwaOrbitAuthPaths',{});
    grid.innerHTML=orbitApps.map(([key,glyph,name])=>`<div class="module-orbit-row"><header><b>${name}</b><span>${glyph}</span></header><label class="orbit-field-label">Public profile / page</label><input class="module-input" data-orbit-path="${key}" value="${esc(links[key]||'')}" placeholder="Paste profile URL"><label class="orbit-field-label">Future login / authorization path</label><input class="module-input" data-orbit-auth="${key}" value="${esc(auth[key]||'')}" placeholder="OAuth, login, or callback path"><div class="module-actions"><button class="module-action" type="button" data-orbit-save="${key}">Save</button><button class="module-action ghost" type="button" data-orbit-open="${key}" ${links[key]?'':'disabled'}>Open profile</button></div></div>`).join('');
    grid.dataset.stableOrbit='1';
    const intro=grid.closest('.module-card')?.querySelector(':scope > p');
    if(intro) intro.textContent='Connect the creative and social platforms that belong in your BIGLWA orbit. Calendar syncing stays in Calendar; public profile links and future login paths stay separate.';
  }

  document.addEventListener('click',e=>{
    const save=e.target.closest('[data-orbit-save]');
    const open=e.target.closest('[data-orbit-open]');
    if(save){
      const key=save.dataset.orbitSave;
      const path=document.querySelector(`[data-orbit-path="${key}"]`)?.value.trim()||'';
      const authPath=document.querySelector(`[data-orbit-auth="${key}"]`)?.value.trim()||'';
      const links=readJSON('biglwaOrbitLinks',{}),auth=readJSON('biglwaOrbitAuthPaths',{});
      path?links[key]=path:delete links[key]; authPath?auth[key]=authPath:delete auth[key];
      writeJSON('biglwaOrbitLinks',links); writeJSON('biglwaOrbitAuthPaths',auth);
      const button=document.querySelector(`[data-orbit-open="${key}"]`); if(button) button.disabled=!path;
    }
    if(open){const url=readJSON('biglwaOrbitLinks',{})[open.dataset.orbitOpen];if(url){try{const u=new URL(url,location.href);if(/^https?:$/.test(u.protocol))window.open(u.href,'_blank','noopener,noreferrer')}catch{}}}
  },true);

  let queued=false;
  function apply(){queued=false;applyBranding();applyPolicies();patchOrbit()}
  function queue(){if(queued)return;queued=true;requestAnimationFrame(apply)}
  new MutationObserver(queue).observe(document.documentElement,{subtree:true,childList:true});
  window.addEventListener('popstate',queue);
  setTimeout(apply,0);
})();