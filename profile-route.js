(()=>{
  'use strict';
  const routeKey='route';
  const cssId='biglwa-public-profile-style';
  const rootId='biglwaPublicProfileRoute';

  const escapeHtml=(value)=>{
    return String(value??'').replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  };
  const readJSON=(key,fallback)=>{
    try{
      const value=JSON.parse(localStorage.getItem(key)||'null');
      return value??fallback;
    }catch{return fallback}
  };
  const normalizeUsername=(value)=>String(value||'').replace(/^@+/,'').trim().toLowerCase();
  const safeUrl=(value)=>{
    const raw=String(value||'').trim();
    if(!raw)return '';
    try{
      const u=new URL(/^https?:\/\//i.test(raw)?raw:'https://'+raw);
      return u.protocol==='http:'||u.protocol==='https:'?u.href:'';
    }catch{return ''}
  };

  function ensureStyle(){
    if(document.getElementById(cssId))return;
    const style=document.createElement('style');
    style.id=cssId;
    style.textContent=`
      body.biglwa-public-profile-active{margin:0;background:#f7f2eb!important;color:#211d1b!important;min-height:100vh;overflow:auto}
      body.biglwa-public-profile-active .route-screen{display:none!important}
      #${rootId}{min-height:100vh;box-sizing:border-box;padding:clamp(28px,7vw,96px) 20px 50px;display:grid;place-items:center;background:radial-gradient(circle at 20% 10%,rgba(216,95,109,.08),transparent 30%),radial-gradient(circle at 80% 80%,rgba(91,158,111,.08),transparent 28%),#f7f2eb;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      #${rootId} .public-profile-shell{width:min(980px,100%);display:grid;gap:14px}
      #${rootId} .public-profile-kicker{display:flex;justify-content:space-between;align-items:center;gap:12px;color:#746e68;font:650 10px/1.2 Inter,ui-sans-serif,system-ui,sans-serif;letter-spacing:1.4px;text-transform:uppercase}
      #${rootId} .public-profile-brand{color:#171514;text-decoration:none;font-weight:800;letter-spacing:1.2px}
      #${rootId} .public-profile-card{position:relative;display:grid;grid-template-columns:150px minmax(0,1fr);min-height:330px;border-radius:22px;overflow:hidden;background:linear-gradient(135deg,rgba(255,252,247,.96),rgba(247,238,233,.92));border:1px solid rgba(255,255,255,.76);box-shadow:0 26px 70px rgba(54,35,30,.14)}
      #${rootId} .public-profile-rail{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:26px 18px;border-right:1px solid rgba(62,50,45,.13);background:rgba(255,255,255,.22)}
      #${rootId} .public-profile-avatar{width:108px;height:108px;border-radius:20px;display:grid;place-items:center;background:#ddd2c9;color:#4d413a;font:700 48px/1 Georgia,"Times New Roman",serif;box-shadow:inset 0 0 0 1px rgba(255,255,255,.28)}
      #${rootId} .public-profile-loc{font-size:10px;line-height:1.35;text-align:center;color:#746e68;max-width:120px}
      #${rootId} .public-profile-copy{position:relative;padding:32px 34px 28px;display:flex;flex-direction:column}
      #${rootId} .public-profile-label{margin:0 0 5px;font-size:9px;line-height:1.2;font-weight:700;letter-spacing:1.7px;text-transform:uppercase;color:#756d67}
      #${rootId} .public-profile-name{margin:0;color:#171514;font:700 clamp(32px,5vw,50px)/.98 Georgia,"Times New Roman",serif;letter-spacing:-1.6px}
      #${rootId} .public-profile-handle{margin-top:7px;font:650 13px/1.25 Inter,ui-sans-serif,system-ui,sans-serif;color:#6e6862}
      #${rootId} .public-profile-bio{margin:28px 0 18px;max-width:650px;color:#2c2825;font:400 17px/1.48 Georgia,"Times New Roman",serif}
      #${rootId} .public-profile-meta{display:flex;flex-wrap:wrap;gap:12px 18px;padding-top:14px;border-top:1px solid rgba(62,50,45,.11);font-size:11px;color:#746e68}
      #${rootId} .public-profile-meta a{color:#b63e4f;text-decoration:none}
      #${rootId} .public-profile-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:auto;padding-top:24px}
      #${rootId} .public-profile-actions a,#${rootId} .public-profile-actions button{display:inline-flex;align-items:center;justify-content:center;min-height:36px;padding:0 15px;border-radius:999px;border:1px solid rgba(65,54,49,.15);background:rgba(255,255,255,.55);color:#211d1b;text-decoration:none;font:650 11px/1 Inter,ui-sans-serif,system-ui,sans-serif;cursor:pointer}
      #${rootId} .public-profile-actions .primary{background:#1d1b1a;color:#fff;border-color:#1d1b1a}
      #${rootId} .public-profile-note{color:#817871;font:500 10px/1.5 Inter,ui-sans-serif,system-ui,sans-serif}
      #${rootId} .public-profile-empty{width:min(640px,100%);padding:34px;border:1px solid rgba(65,54,49,.12);border-radius:20px;background:rgba(255,252,247,.84);box-shadow:0 20px 55px rgba(54,35,30,.10)}
      #${rootId} .public-profile-empty h1{margin:0 0 10px;font:700 34px/1 Georgia,"Times New Roman",serif;letter-spacing:-1px}
      #${rootId} .public-profile-empty p{margin:0;color:#6f6862;font:14px/1.5 Inter,ui-sans-serif,system-ui,sans-serif}
      @media(max-width:700px){
        #${rootId}{padding:18px 14px 30px}
        #${rootId} .public-profile-card{grid-template-columns:1fr;min-height:0}
        #${rootId} .public-profile-rail{flex-direction:row;justify-content:flex-start;padding:20px 22px;border-right:0;border-bottom:1px solid rgba(62,50,45,.13)}
        #${rootId} .public-profile-avatar{width:78px;height:78px;border-radius:16px;font-size:34px}
        #${rootId} .public-profile-copy{padding:24px 22px 22px}
        #${rootId} .public-profile-bio{font-size:15px;margin-top:22px}
      }
    `;
    document.head.appendChild(style);
  }

  function findProfile(route){
    const wanted=normalizeUsername(route);
    const saved=readJSON('biglwaProfileDetails',null);
    if(saved&&normalizeUsername(saved.username)===wanted)return saved;
    const directory=readJSON('biglwaUserDirectory',[]);
    if(!Array.isArray(directory))return null;
    const hit=directory.find((entry)=>normalizeUsername(entry?.username)===wanted);
    if(!hit)return null;
    if(saved&&normalizeUsername(saved.username)===normalizeUsername(hit.username))return saved;
    return null;
  }

  function build(profile){
    const username=String(profile.username||'').replace(/^@+/,'');
    const display=String(profile.name||username||'Big LWA');
    const bio=String(profile.bio||'');
    const location=String(profile.location||'');
    const website=safeUrl(profile.website);
    const mood=String(profile.mood||'');
    const initial=(display.trim().charAt(0)||username.charAt(0)||'B').toUpperCase();
    const link='/'+encodeURIComponent(username);
    const root=document.createElement('main');
    root.id=rootId;
    root.innerHTML=`
      <div class="public-profile-shell">
        <div class="public-profile-kicker">
          <a class="public-profile-brand" href="/">big lwa</a>
          <span>profile card · ${escapeHtml(link)}</span>
        </div>
        <section class="public-profile-card" aria-label="Public Big LWA profile">
          <aside class="public-profile-rail">
            <div class="public-profile-avatar" aria-hidden="true">${escapeHtml(initial)}</div>
            ${location?`<div class="public-profile-loc">⌖ ${escapeHtml(location)}</div>`:''}
          </aside>
          <div class="public-profile-copy">
            <div class="public-profile-label">Big LWA profile</div>
            <h1 class="public-profile-name">${escapeHtml(display)}</h1>
            <div class="public-profile-handle">@${escapeHtml(username)}</div>
            ${bio?`<p class="public-profile-bio">${escapeHtml(bio)}</p>`:''}
            <div class="public-profile-meta">
              ${location?`<span>⌖ ${escapeHtml(location)}</span>`:''}
              ${website?`<a href="${escapeHtml(website)}" target="_blank" rel="noopener noreferrer">${escapeHtml(website.replace(/^https?:\/\//,''))}</a>`:''}
              ${mood?`<span>#mood · ${escapeHtml(mood)}</span>`:''}
            </div>
            <div class="public-profile-actions">
              <a class="primary" href="/studio">enter studio</a>
              ${website?`<a href="${escapeHtml(website)}" target="_blank" rel="noopener noreferrer">visit work</a>`:''}
              <button type="button" data-copy-profile>copy profile link</button>
            </div>
          </div>
        </section>
        <div class="public-profile-note">This profile card is currently sourced from the saved profile on this browser. The username is real to that saved profile, but public cross-device publishing requires a shared profile database.</div>
      </div>
    `;
    root.querySelector('[data-copy-profile]')?.addEventListener('click',async(e)=>{
      const button=e.currentTarget;
      try{await navigator.clipboard.writeText(location.origin+link);button.textContent='copied';setTimeout(()=>button.textContent='copy profile link',1200)}
      catch{button.textContent='select the URL above'}
    });
    return root;
  }

  function boot(){
    let route='';
    try{route=new URLSearchParams(location.search).get(routeKey)||''}catch{}
    if(!route)return;
    if(route==='login')return;
    const profile=findProfile(route);
    if(!profile)return;

    ensureStyle();
    const existing=document.getElementById(rootId);if(existing)existing.remove();
    const root=build(profile);
    document.body.classList.add('biglwa-public-profile-active');
    document.documentElement.classList.remove('biglwa-boot-login');
    document.body.appendChild(root);
    document.title=`${profile.name||profile.username} · Big LWA`;
    document.documentElement.classList.add('biglwa-ready');
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,0),{once:true});
  else setTimeout(boot,0);
})();