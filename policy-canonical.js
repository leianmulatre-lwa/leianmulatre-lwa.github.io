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
      <p class="policy-kicker">Affidavit of Good Faith · Founder’s Note &amp; User Agreement</p>
      <h1>Educational Purpose and Public Interest</h1>

      <section class="affidavit-section founder-note">
        <h2>Founder’s Note</h2>
        <p class="policy-lede">I, <strong>Leian</strong>, hereby affirm that the work, research, testimony, documentation, media, and public commentary connected to this project are being created in good faith and for the purpose of education, cultural preservation, public awareness, and community protection.</p>

        <p>This project is intended to help the American public better understand the historical, political, social, racial, technological, and cultural forces shaping our present moment. Its purpose is not to harm, exploit, harass, defame, or endanger any person or community, but to document truth, encourage critical thinking, and provide language for people who have been harmed, misled, silenced, surveilled, or taken advantage of by powerful institutions and systems.</p>

        <p>This work may address topics including, but not limited to, American empire, propaganda, racial capitalism, anti-Blackness, colorism, Haitian history and diaspora, queerness, gender, class, education, digital exploitation, artificial intelligence, platform culture, beauty standards, youth vulnerability, and the ways marginalized people are often used before they are protected.</p>

        <p>I affirm that the purpose of this work is to do good. It is intended to educate the public, amplify Black voices, honor Haitian and diasporic history, protect young people from exploitation, and create a record for future generations. It is also intended to help people understand how manipulation can occur through media, technology, institutions, culture, and social pressure.</p>

        <p>Any personal experiences shared through this project will be presented as testimony, reflection, memory, opinion, research, or documented evidence to the best of my ability. I affirm that I will make reasonable efforts to distinguish between fact, belief, interpretation, and allegation where appropriate. I further affirm that this project is not created for revenge, misinformation, or public harm, but for truth-telling, education, accountability, healing, and collective understanding.</p>

        <p>This project is bigger than one individual. It is an archive, a warning, a love letter, and a tool for those who come after us. Its purpose is to help people see what has been hidden, question what they have been taught, and protect themselves and their communities with knowledge.</p>

        <p>I make this statement voluntarily and in good faith.</p>
        <div class="affidavit-founder-signature"><span>Signed:</span><strong>Leian Stanley</strong><small>Founder, BIGLWA</small></div>
      </section>

      <section class="affidavit-section member-agreement">
        <p class="policy-kicker">For BIGLWA Members</p>
        <h2>Member Affidavit &amp; User Agreement</h2>
        <p>By submitting testimony, research, documentation, media, evidence, or a Rights &amp; Likeness report through BIGLWA, I affirm in good faith that:</p>
        <ol class="affidavit-list">
          <li>I am the person affected, the creator or rights holder of the work involved, or someone authorized to act on that person’s behalf.</li>
          <li>The information and materials I provide are accurate to the best of my knowledge. I will make reasonable efforts to distinguish documented fact from memory, belief, interpretation, opinion, and allegation.</li>
          <li>I am not knowingly submitting false, altered, misleading, or materially incomplete information for revenge, harassment, misinformation, exploitation, or public harm.</li>
          <li>I authorize BIGLWA to preserve and review the materials I submit, document the matter, evaluate appropriate platform action, and—when warranted—support takedown efforts, accountability measures, or referral to licensed counsel.</li>
          <li>I understand that submitting a report does not guarantee removal, a cease-and-desist letter, litigation, recovery, or legal representation. Using BIGLWA or receiving general platform support does not by itself create an attorney-client relationship.</li>
          <li>I understand that BIGLWA may restrict or reject a submission made in bad faith or one that threatens another person’s safety, privacy, dignity, or lawful rights.</li>
        </ol>
        <p class="policy-note"><strong>Member acknowledgment:</strong> By submitting materials under this agreement, I affirm that I have read and understood these statements and that my submission is made voluntarily, honestly, and in good faith.</p>
      </section>

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
      .affidavit-founder-signature small{font:11px Inter,system-ui,sans-serif;color:#766b64}
      .affidavit-section{margin-top:30px}
      .member-agreement{margin-top:46px;padding-top:34px;border-top:1px solid #d8cec5}
      .member-agreement>.policy-kicker{margin-bottom:8px}
      @media(max-width:760px){#rightsPage .rights-grid-three{grid-template-columns:1fr}}
    `;
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',apply,{once:true});
  else apply();
  window.addEventListener('load',()=>setTimeout(apply,0),{once:true});
  setTimeout(apply,180);
})();