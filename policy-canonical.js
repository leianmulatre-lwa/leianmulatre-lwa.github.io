(()=>{
  const $=(selector,root=document)=>root.querySelector(selector);

  const links=(active)=>{
    const pages=[['privacy','Privacy'],['terms','Terms'],['rights','Rights & Likeness'],['affidavit','Affidavit of Good Faith']];
    return `<nav class="policy-links">${pages.filter(([id])=>id!==active).map(([id,label])=>`<a href="/${id}" data-policy-route="${id}">${label}</a>`).join('')}</nav>`;
  };

  const rights=`
    <article class="policy-card policy-rights-card">
      <div class="window-lights policy-lights" aria-hidden="true"><span class="window-light red"></span><span class="window-light yellow"></span><span class="window-light green"></span></div>
      <p class="policy-kicker">Rights &amp; Likeness Promise</p>
      <h1>Your social body is part of your body.</h1>
      <p class="policy-lede">Your face, voice, name, persona, archive, creative labor, and the context around them deserve meaningful protection. BIGLWA’s goal is to make that protection part of the product—not something you have to beg a platform for after harm is already done.</p>
      <div class="rights-grid rights-grid-three">
        <div><b>01 · You keep authorship</b><p>Posting here does not make BIGLWA the owner of your work.</p></div>
        <div><b>02 · Likeness is not a free asset</b><p>Impersonation, abusive deepfakes, nonconsensual sexualization, and identity extraction are treated as serious violations.</p></div>
        <div><b>03 · We help build the paper trail</b><p>When possible, we can help preserve evidence and organize the chronology of a reported violation.</p></div>
      </div>
      <h2>When court becomes necessary</h2>
      <p>If a matter warrants litigation, representation must be accepted by a licensed attorney under a separate engagement. That protects you too: it ensures someone legally authorized, conflict-checked, and accountable is actually responsible for the case. BIGLWA can build toward that infrastructure without pretending every report automatically becomes a lawsuit.</p>
      <p class="policy-note"><strong>Design principle:</strong> protection should be visible. As reporting and provenance tools are built, BIGLWA should show users what was preserved, what action was requested, and what stage a rights matter is in.</p>
      ${links('rights')}
    </article>`;

  const affidavit=`
    <article class="policy-card policy-affidavit-card">
      <div class="window-lights policy-lights" aria-hidden="true"><span class="window-light red"></span><span class="window-light yellow"></span><span class="window-light green"></span></div>
      <p class="policy-kicker">Affidavit of Good Faith · September 7, 2026</p>
      <h1>I am asking to be protected in good faith.</h1>
      <p class="policy-lede">When a BIGLWA member asks us to act on a violation of their likeness, authorship, privacy, or social body, the request should begin with a clear record of what they believe happened and why they believe intervention is justified.</p>
      <h2>Member declaration</h2>
      <p>By submitting a Rights &amp; Likeness report under this declaration, I state in good faith that:</p>
      <ol class="affidavit-list">
        <li>I am the person affected by the reported conduct, the owner or creator of the affected work, or someone authorized to act for that person.</li>
        <li>I have a good-faith belief that the use, copying, impersonation, publication, commercialization, synthetic recreation, disclosure, or other conduct I am reporting is unauthorized, nonconsensual, misleading, exploitative, or otherwise violates rights I hold or am authorized to assert.</li>
        <li>The facts, chronology, links, screenshots, files, communications, and other evidence I provide are accurate to the best of my knowledge, and I have not knowingly altered or omitted material information for the purpose of misleading BIGLWA or another party.</li>
        <li>I authorize BIGLWA to preserve the materials I submit for the purpose of documenting the report, evaluating platform action, supporting takedown or cease-and-desist correspondence, and—where appropriate—coordinating referral to licensed counsel.</li>
        <li>I understand that a report does not guarantee removal, a cease-and-desist, litigation, recovery, or representation, and that legal representation requires a separate written engagement with a licensed attorney.</li>
      </ol>
      <h2>BIGLWA’s reciprocal good-faith commitment</h2>
      <p>BIGLWA will not knowingly use a rights report as a pretext to appropriate a member’s identity, work, evidence, or story. We will aim to preserve the context of the complaint, limit access to what is reasonably necessary, document actions taken, and avoid representing that a legal remedy is guaranteed when it is not.</p>
      <div class="affidavit-signoff"><b>Execution note</b><p>This page states BIGLWA’s standard good-faith declaration. It is not automatically a notarized affidavit, court filing, or sworn declaration merely because it appears on the site. If a particular jurisdiction, platform, or legal proceeding requires a signed declaration under penalty of perjury, notarization, or other formal execution, BIGLWA or retained counsel should provide the proper form for that matter.</p></div>
      <div class="affidavit-founder-signature"><span>Signed,</span><strong>Leian Stanley</strong></div>
      ${links('affidavit')}
    </article>`;

  function replacePage(id,markup){
    const page=$(id);
    const old=page&&$('.policy-card',page);
    if(old) old.outerHTML=markup;
  }

  function apply(){
    replacePage('#rightsPage',rights);
    replacePage('#affidavitPage',affidavit);
    let style=$('#biglwa-rights-affidavit-style');
    if(!style){style=document.createElement('style');style.id='biglwa-rights-affidavit-style';document.head.appendChild(style)}
    style.textContent=`
      #rightsPage .rights-grid-three{grid-template-columns:repeat(3,minmax(0,1fr))}
      .affidavit-founder-signature{display:flex;flex-direction:column;align-items:flex-end;gap:4px;margin:34px 0 8px;font-family:Georgia,serif;color:#332c28}
      .affidavit-founder-signature span{font-size:13px;font-family:Inter,system-ui,sans-serif;color:#766b64}
      .affidavit-founder-signature strong{font-size:25px;font-style:italic;font-weight:500}
      @media(max-width:760px){#rightsPage .rights-grid-three{grid-template-columns:1fr}}
    `;
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',apply,{once:true});
  else apply();
  window.addEventListener('load',()=>setTimeout(apply,0),{once:true});
  setTimeout(apply,180);
})();