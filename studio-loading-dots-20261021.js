/* BIG LWA loading states: CSS-only dots inspired by nzbin/three-dots.
   Respect reduced motion. These indicators show actual browser work. */
(function(){
 if(window.__biglwaDotsBooted)return;window.__biglwaDotsBooted=true;
 const css=`
 .lwa-dot{display:inline-block;width:7px;height:7px;background:currentColor;border-radius:50%;position:relative;vertical-align:middle;flex:none}
 .lwa-dot::before,.lwa-dot::after{content:"";position:absolute;width:7px;height:7px;border-radius:50%;background:currentColor}
 .lwa-dot{color:#e65d6d}.lwa-dot::before{left:-11px;background:#e7bc43}.lwa-dot::after{left:11px;background:#4ba76a}
 .lwa-dot-pulse{animation:lwaPulse 1s ease-in-out infinite}
 .lwa-dot-pulse::before{animation:lwaPulse 1s ease-in-out -.2s infinite}
 .lwa-dot-pulse::after{animation:lwaPulse 1s ease-in-out .2s infinite}
 @keyframes lwaPulse{0%,100%{opacity:.35;transform:scale(.55)}50%{opacity:1;transform:scale(1)}}
 .lwa-dot-floating{animation:lwaFloat 1.1s ease-in-out infinite}
 .lwa-dot-floating::before{animation:lwaFloat 1.1s ease-in-out -.2s infinite}
 .lwa-dot-floating::after{animation:lwaFloat 1.1s ease-in-out .2s infinite}
 @keyframes lwaFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
 .lwa-dot-falling{animation:lwaFall 1.05s ease-in-out infinite}
 .lwa-dot-falling::before{animation:lwaFall 1.05s ease-in-out -.22s infinite}
 .lwa-dot-falling::after{animation:lwaFall 1.05s ease-in-out .22s infinite}
 @keyframes lwaFall{0%{transform:translateY(-7px);opacity:0}55%{transform:translateY(2px);opacity:1}100%{transform:translateY(7px);opacity:0}}
 #lwaProfileLoading{display:inline-flex;align-items:center;gap:15px;font:600 10px system-ui;color:inherit;white-space:nowrap;margin-left:12px}
 #lwaProfileLoading[hidden]{display:none!important}
 #lwaStudioTransition{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;pointer-events:none;background:rgba(250,246,242,.93);font:600 13px system-ui;color:#473248}
 #lwaStudioTransition[hidden]{display:none!important}
 #lwaStudioTransition .lwa-loading-center{display:grid;place-items:center;gap:28px}
 .lwa-loading-image{position:relative}
 .lwa-curtain{position:absolute;z-index:120;inset:0;display:flex;justify-content:center;align-items:center;flex-direction:column;gap:28px;background:#27060e url("/assets/login-curtain-film-grain-v2.webp") center center/cover no-repeat;color:#fff8ef;border-radius:inherit;pointer-events:none}
 .lwa-curtain[data-lwa-curtain="module"]{bottom:auto;min-height:220px;height:min(520px,calc(100dvh - 210px));border-radius:18px;overflow:hidden;justify-content:flex-start;padding-top:clamp(65px,12vh,115px);box-sizing:border-box}
 .lwa-curtain[hidden]{display:none!important}
 .lwa-curtain .lwa-dot{color:#f26877}
 .lwa-curtain-label{font:600 11px/1.4 system-ui;letter-spacing:.07em;text-transform:uppercase;text-shadow:0 1px 2px #3c0610}
 #studioApp .module-shell{position:relative}
 #studioAvatarCard{position:relative;isolation:isolate}
 #studioApp .topbar{position:relative;z-index:5}
 .lwa-loading-image::after{content:"";position:absolute;left:50%;top:50%;color:#543a65;display:block;width:7px;height:7px;border-radius:50%;background:currentColor;box-shadow:-11px 0 currentColor,11px 0 currentColor;animation:lwaPulse 1s ease-in-out infinite}
 .lwa-loading-image[data-lwa-loaded="1"]::after{display:none}
 @media(prefers-reduced-motion:reduce){.lwa-dot,.lwa-dot::before,.lwa-dot::after,.lwa-loading-image::after{animation:none!important}}
 `;
 const style=document.createElement('style');style.id='lwaLoadingDotsStyles';style.textContent=css;document.head.append(style);
 const make=(type)=>{const el=document.createElement('i');el.className='lwa-dot lwa-dot-'+type;el.setAttribute('aria-hidden','true');return el};
 let profile=null,transition=null,transitionTimer=null,transitionShownAt=0;
 function ensure(){
  if(!document.getElementById('studioApp'))return;
  if(!profile){
   const mark=document.querySelector('#studioApp .studio-brand-row')||document.querySelector('#studioApp .topbar');
   if(mark){profile=document.createElement('span');profile.id='lwaProfileLoading';profile.setAttribute('role','status');profile.setAttribute('aria-label','Loading your profile');profile.append(make('falling'));const label=document.createElement('span');label.textContent='Loading profile';profile.append(label);mark.append(profile);profile.hidden=true}
  }
  if(!transition){transition=document.createElement('div');transition.id='lwaStudioTransition';transition.hidden=true;const center=document.createElement('div');center.className='lwa-loading-center';center.append(make('floating'));const label=document.createElement('span');label.textContent='Taking you to Studio';center.append(label);transition.append(center);document.body.append(transition)}
 }
 function setProfile(loading){ensure();if(profile)profile.hidden=!loading}
 function hideTransition(){if(transitionTimer)clearTimeout(transitionTimer);if(!transition)return;const remaining=Math.max(0,720-(Date.now()-transitionShownAt));transitionTimer=setTimeout(()=>{transition.hidden=true},remaining)}
 function studioVisible(){return !!document.querySelector('#studioApp.is-active')}
 // Image pulse is only drawn while an image actually has network work outstanding.
 function imagePending(img){return img instanceof HTMLImageElement && !img.complete && !img.dataset.lwaLoadingBound}
 function bindImage(img){
  if(!imagePending(img))return;
  img.dataset.lwaLoadingBound='1';
  const parent=img.parentElement;
  if(!parent || !parent.matches('.biglwa-feed-hero-preview,.biglwa-slide,.instagram-archive-piece,.feed-card-media,.veve-card-media'))return;
  parent.classList.add('lwa-loading-image');parent.style.position='relative';
  const done=()=>{parent.classList.remove('lwa-loading-image');img.dataset.lwaLoaded='1'};
  img.addEventListener('load',done,{once:true});img.addEventListener('error',done,{once:true});if(img.complete)done();
 }
 const scan=()=>document.querySelectorAll('#studioApp img').forEach(bindImage);
 let moduleKey='',moduleStarted=0,avatarStarted=0,avatarChanged=0,moduleCurtain=null,avatarCurtain=null;
 function curtain(container,label,kind){const el=document.createElement('div');el.className='lwa-curtain';el.dataset.lwaCurtain=kind;el.setAttribute('role','status');el.setAttribute('aria-label',label);el.append(make(kind==='avatar'?'pulse':'floating'));const t=document.createElement('span');t.className='lwa-curtain-label';t.textContent=label;el.append(t);container.append(el);return el}
 function unresolvedImages(el){return [...el.querySelectorAll('img')].some(img=>!img.complete)}
 function loadingState(){
  const app=document.getElementById('studioApp');if(!app)return;
  const space=app.querySelector('.main.module-view>.module-workspace');const shell=space?.querySelector('.module-shell');
  const key=space?.dataset.moduleKey||'';
  if(key&&key!==moduleKey){moduleKey=key;moduleStarted=Date.now();moduleCurtain?.remove();moduleCurtain=null;setTimeout(schedule,380)}
  if(!key){moduleKey='';moduleCurtain?.remove();moduleCurtain=null}
  if(shell&&key){
   if(!moduleCurtain||!shell.contains(moduleCurtain))moduleCurtain=curtain(shell,'Loading '+key,'module');
   const heading=shell.querySelector('.module-heading');const bounds=shell.getBoundingClientRect();const head=heading?.getBoundingClientRect();
   moduleCurtain.style.top=Math.max(0,(head?head.bottom:bounds.top)-bounds.top+12)+'px';
   const busy=space.querySelector('[aria-busy="true"]:not(.lwa-curtain)');
   moduleCurtain.hidden=Date.now()-moduleStarted>=320 && !unresolvedImages(shell) && !busy;
  }
  const avatar=app.querySelector('#studioAvatarCard');
  if(avatar){
   if(!avatarCurtain||!avatar.contains(avatarCurtain)){avatarCurtain=curtain(avatar,'Loading avatar','avatar');avatarStarted=Date.now();setTimeout(schedule,380)}
   const presentation=avatar.querySelector('#biglwaAvatarMedia > :not(.lwa-curtain),canvas,iframe,img');
   const pending=unresolvedImages(avatar)||!!avatar.querySelector('[aria-busy="true"]');
   avatarCurtain.hidden=!!presentation && !pending && Date.now()-avatarStarted>320;
  }
 }
 const schedule=(()=>{let pending=false;return()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;loadingState()})}})();
 let wasStudio=studioVisible();
 const observe=new MutationObserver(()=>{
  ensure();scan();schedule();
  const now=studioVisible();
  if(now&&!wasStudio){hideTransition();setProfile(true);window.dispatchEvent(new Event('biglwa:studio-opened'))}
  if(!now&&wasStudio)hideTransition();
  wasStudio=now;
 });
 function start(){ensure();scan();loadingState();observe.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','src','aria-busy','data-module-key']});document.addEventListener('load',schedule,true);document.addEventListener('error',schedule,true);}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
 window.BigLWALoadingDots={
  profile:setProfile,
  studio(){ensure();if(transition){transition.hidden=false;transitionShownAt=Date.now();clearTimeout(transitionTimer);transitionTimer=setTimeout(()=>{transition.hidden=true},9000)}},
  ready(){setProfile(false);hideTransition()}
 };
 document.addEventListener('click',event=>{
  const el=event.target.closest('button,[role="button"],[data-enter-studio]');
  if(!el||studioVisible()||!el.closest('#loginPage'))return;
  const label=(el.textContent||el.getAttribute('aria-label')||'').trim().toLowerCase();
  if(!/step inside|sign in|log in|enter studio|create account|continue/.test(label))return;
  const form=el.closest('form');
  if(form&&typeof form.checkValidity==='function'&&!form.checkValidity())return;
  window.BigLWALoadingDots.studio();
  /* Some vintage login CTAs were type=button with no form submission path.
     Delegate only in that case; native submit buttons retain their original auth handler. */
  if(form&&el.tagName==='BUTTON'&&el.type==='button'&&!el.dataset.lwaSubmitBound){
    el.dataset.lwaSubmitBound='1';form.requestSubmit();queueMicrotask(()=>delete el.dataset.lwaSubmitBound);
  }
 },true);
})();
