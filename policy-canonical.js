(()=>{
  const V='20260910-policy-canonical-1';
  const $=(s,r=document)=>r.querySelector(s);

  const header=(page)=>{
    const top=$('.policy-top',page);
    if(!top)return;
    top.innerHTML=`<a class="policy-brand-canonical" href="/" data-return-home aria-label="BIGLWA"><img src="/assets/biglwa-header-user-final.png?v=${V}" alt="BIGLWA"></a><a class="policy-back" href="/studio" data-return-app>Back</a>`;
  };

  const links=(active)=>{
    const items=[['privacy','Privacy'],['terms','Terms'],['rights','Rights & Likeness'],['affidavit','Affidavit of Good Faith']];
    return `<nav class="policy-links">${items.filter(([id])=>id!==active).map(([id,label])=>`<a href="/${id}" data-policy-route="${id}">${label}</a>`).join('')}</nav>`;
  };

  const privacy=`
    <article class="policy-card" data-canonical-policy="1">
      <div class="window-lights policy-lights" aria-hidden="true"><span class="window-light red"></span><span class="window-light yellow"></span><span class="window-light green"></span></div>
      <p class="policy-kicker">Privacy Policy</p>
      <h1>Privacy should feel like shelter.</h1>
      <p class="policy-lede">BIGLWA is built around a simple rule: information you give us to use the product should not quietly become permission to define, profile, sell, or recreate you.</p>

      <h2>What account information we use</h2>
      <p>BIGLWA uses Firebase services to process the account information needed to sign you in and operate your profile. That can include your email address, chosen username, authentication identifier, and basic account or verification status. Your email is an authentication credential; BIGLWA does not use the part before the @ sign as a substitute identity, display name, or public username.</p>

      <h2>What stays local</h2>
      <p>Studio appearance choices may be stored in your browser unless a feature clearly offers cloud sync. Local preferences are meant to customize your own experience, not to create a hidden public profile about you.</p>

      <h2>Your identity and creative work stay yours</h2>
      <p>You retain ownership of the content you create and the rights you hold in your name, image, voice, persona, likeness, and other original material. Using BIGLWA does not transfer ownership of those things to BIGLWA.</p>

      <h2>No sale of your personhood</h2>
      <p>BIGLWA does not sell your personal information or creative work. BIGLWA also does not intentionally use private member content to train generative models without a separate, affirmative opt-in that explains what is being authorized.</p>

      <h2>Rights, safety, and evidence</h2>
      <p>If you submit a safety, privacy, authorship, or likeness report, BIGLWA may preserve the records and evidence you provide so the report can be documented, reviewed, and—when appropriate—used to support platform action, takedown requests, or other accountability steps. Access should be limited to what is reasonably necessary for that purpose.</p>

      <h2>Your choices</h2>
      <p>You may request access to, correction of, or deletion of personal information BIGLWA controls, subject to information we may need to retain for security, fraud prevention, legal obligations, or an active rights or safety matter.</p>

      <h2>Policy status</h2>
      <p>This is BIGLWA's current product privacy policy and should continue to be reviewed as the platform's data systems grow. Features that materially change what data is collected, shared, or retained should be reflected here before they are treated as normal platform behavior.</p>
      ${links('privacy')}
    </article>`;

  const terms=`
    <article class="policy-card" data-canonical-policy="1">
      <div class="window-lights policy-lights" aria-hidden="true"><span class="window-light red"></span><span class="window-light yellow"></span><span class="window-light green"></span></div>
      <p class="policy-kicker">Terms of Use</p>
      <h1>You are not the product.</h1>
      <p class="policy-lede">These terms are meant to make the relationship legible: you can use BIGLWA without giving BIGLWA ownership of your identity, authorship, likeness, or creative life.</p>

      <h2>Your account</h2>
      <p>Public usernames are generally 5–24 characters. Three- and four-character usernames are reserved for special request. A username must be unique to one account so a BIGLWA profile can function as a reliable identity card and link across other platforms. You are responsible for keeping your login credentials secure and for activity performed through your account.</p>

      <h2>You keep your work</h2>
      <p>You retain the rights you hold in original content you post to BIGLWA. By posting, you give BIGLWA only the limited, non-exclusive permission reasonably necessary to host, display, transmit, format, back up, and otherwise operate that content as part of the service. That operational permission is not a transfer of ownership.</p>

      <h2>Identity and likeness protections</h2>
      <p>Do not use BIGLWA to impersonate another person, scrape people for identity exploitation, publish nonconsensual intimate material, create or distribute abusive or deceptive synthetic likenesses, doxx someone, falsely claim authorship, or commercially exploit another person's identity or work without authorization.</p>

      <h2>Publication is not legal registration</h2>
      <p>BIGLWA may preserve dates, authorship context, publication history, or other metadata, but platform metadata is not a substitute for copyright registration, trademark registration, contracts, releases, or other formal legal protections that may apply to a particular work or dispute.</p>

      <h2>Enforcement</h2>
      <p>BIGLWA may remove content, limit or disable accounts, preserve relevant evidence, support takedown requests, or prepare cease-and-desist communications when platform rules or rights protections are implicated. Serious or repeated abuse may lead to permanent loss of access.</p>

      <h2>Legal help is separate</h2>
      <p>Using BIGLWA, submitting a report, or receiving platform assistance does not automatically create an attorney-client relationship. Legal representation, litigation, or individualized legal advice requires a separate written engagement with licensed counsel.</p>

      <h2>Policy status</h2>
      <p>These are BIGLWA's current product terms. They are a strong operating-policy draft and should be reviewed by licensed counsel before BIGLWA relies on them as final legal terms for a large public launch.</p>
      ${links('terms')}
    </article>`;

  function apply(){
    const p=$('#privacyPage');
    if(p){header(p);const shell=$('.policy-shell',p);const old=$('.policy-card',p);if(old)old.outerHTML=privacy;else shell?.insertAdjacentHTML('beforeend',privacy)}
    const t=$('#termsPage');
    if(t){header(t);const shell=$('.policy-shell',t);const old=$('.policy-card',t);if(old)old.outerHTML=terms;else shell?.insertAdjacentHTML('beforeend',terms)}

    let style=$('#biglwa-policy-canonical-style');
    if(!style){style=document.createElement('style');style.id='biglwa-policy-canonical-style';document.head.appendChild(style)}
    style.textContent=`
      .policy-page .policy-card[data-canonical-policy="1"]{visibility:visible!important}
      .policy-page .policy-brand-canonical{display:flex!important;align-items:center!important;text-decoration:none!important}
      .policy-page .policy-brand-canonical img{display:block!important;width:140px!important;height:auto!important;max-height:74px!important;object-fit:contain!important;object-position:left center!important;visibility:visible!important;opacity:1!important}
      @media(max-width:620px){.policy-page .policy-brand-canonical img{width:112px!important;max-height:60px!important}}
    `;
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
  window.addEventListener('load',()=>setTimeout(apply,0),{once:true});
  setTimeout(apply,180);
})();
