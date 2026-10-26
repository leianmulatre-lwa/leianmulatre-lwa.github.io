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
 #lwaProfileLoading{display:inline-flex!important;align-items:center;justify-content:center;gap:10px;
   flex:0 0 31px;min-width:31px;width:31px;height:20px;
   font:600 10px system-ui;color:inherit;white-space:nowrap;
   margin-left:4px;vertical-align:middle;overflow:visible;position:relative;z-index:2}
 #lwaProfileLoading>.lwa-dot{display:inline-block;flex:none}
 #lwaProfileLoading>.lwa-profile-loading-label[hidden]{display:none!important}
 @media(max-width:720px){#lwaProfileLoading{flex-basis:24px;min-width:24px;width:24px;margin-left:0;transform:scale(.82);transform-origin:left center}}
 /* Old login owns the only Studio-opening screen. No duplicate overlay. */
 #lwaStudioTransition{display:none!important}
 #lwaStudioTransition[hidden]{display:none!important}
 .lwa-legacy-studio-loading,.lwa-legacy-studio-loading *{
   font-family:"CS Bergamot Stitched",Georgia,serif!important}
 .lwa-legacy-studio-loading .lwa-legacy-loader-dots{
   display:block!important;margin:18px auto 0!important;
   width:17px!important;height:17px!important;background:#e65d6d}
 .lwa-legacy-studio-loading .lwa-legacy-loader-dots::before,
 .lwa-legacy-studio-loading .lwa-legacy-loader-dots::after{
   width:17px!important;height:17px!important}
 .lwa-legacy-studio-loading .lwa-legacy-loader-dots::before{left:-27px!important}
 .lwa-legacy-studio-loading .lwa-legacy-loader-dots::after{left:27px!important}
 #lwaStudioTransition .lwa-loading-center{display:grid;place-items:center;gap:28px}
 .lwa-loading-image{position:relative}
 .lwa-curtain{position:absolute;z-index:120;inset:0;display:flex;justify-content:center;align-items:center;flex-direction:column;gap:28px;background:#27060e url("/assets/login-curtain-film-grain-v2.webp") center center/cover no-repeat;color:#fff8ef;border-radius:inherit;pointer-events:none}
 /* Keep the landing-sized curtain, but prevent Veve tiles appearing below it
    during the first feed request. This changes visibility, not layout height. */
 /* Keep the feed mounted and laid out beneath one opaque curtain, rather
    than hiding tiles and revealing a broken gap if the curtain is shorter. */
 #studioApp .module-shell.lwa-curtain-veve-pending #biglwaVeve{visibility:visible!important}
 .lwa-curtain[data-lwa-curtain="module"]{pointer-events:auto}
 .lwa-curtain[data-lwa-curtain="module"] .lwa-dot{width:17px;height:17px;margin:8px 27px}
 .lwa-curtain[data-lwa-curtain="module"] .lwa-dot::before,
 .lwa-curtain[data-lwa-curtain="module"] .lwa-dot::after{width:17px;height:17px}
 .lwa-curtain[data-lwa-curtain="module"] .lwa-dot::before{left:-27px}
 .lwa-curtain[data-lwa-curtain="module"] .lwa-dot::after{left:27px}
 .lwa-curtain-progress{font:500 clamp(14px,1.7vw,19px)/1.5 system-ui;color:#ffebd9;max-width:85%;text-align:center;text-shadow:0 1px 4px #24040c}
 .lwa-curtain-bypass{border:1px solid rgba(255,244,234,.65);color:#fff6e9;background:rgba(31,9,21,.85);padding:12px 20px;border-radius:10px;font:700 clamp(14px,1.65vw,18px)/1.3 system-ui;letter-spacing:.02em;cursor:pointer;pointer-events:auto;transition:background .15s}
 .lwa-curtain-bypass:is(:hover,:focus-visible){background:#5b1429}
 .lwa-curtain-bypass:focus-visible{outline:3px solid #e7bc43;outline-offset:3px}
 .lwa-curtain[data-lwa-curtain="module"]{bottom:auto;min-height:320px;height:min(780px,calc(100dvh - 135px));border-radius:18px;overflow:hidden;justify-content:flex-start;padding-top:clamp(84px,14vh,145px);gap:24px;box-sizing:border-box}
 /* Fully mask the existing feed while first load is outstanding, including
    tiles deeper in the masonry below the former short curtain. */
 #studioApp .module-shell.lwa-curtain-veve-pending{
   min-height:max(520px,calc(100dvh - var(--biglwa-dock-top,64px) - 92px))!important;
   height:auto!important;max-height:none!important;overflow:visible!important;
   isolation:isolate;background:#27060e!important;border-radius:18px!important}
 /* A contiguous matching extension below the image-backed curtain covers the
    rest of the masonry while data loads, without stretching or cropping cards. */
 #studioApp .module-shell.lwa-curtain-veve-pending::after{
   content:"";position:absolute;inset:0;z-index:1499!important;pointer-events:none;
   background:#27060e url("/assets/login-curtain-film-grain-v2.webp") center top/cover no-repeat;
   border-radius:18px;min-height:100%}
 #studioApp .module-shell.lwa-curtain-veve-pending > :not(.lwa-curtain){visibility:visible!important}
 #studioApp .module-shell.lwa-curtain-veve-pending > .lwa-curtain{
   position:absolute!important;inset:0!important;width:100%!important;height:100%!important;
   min-height:100%!important;z-index:1500!important;transform:none!important;
   background-size:cover!important;background-position:center!important}
 #studioApp .lwa-curtain-label{
   font-family:"CS Bergamot Stitched",Georgia,serif!important;
   font-size:clamp(29px,4.4vw,56px)!important;font-weight:400!important;
   line-height:1.12!important;letter-spacing:.025em!important}
 #studioApp .lwa-curtain-bypass{margin-top:6px!important}
 .lwa-curtain[hidden]{display:none!important}
 .lwa-curtain .lwa-dot{color:#f26877}
 .lwa-curtain-label{font:400 clamp(20px,2.9vw,31px)/1.25 "CS Bergamot Stitched",Georgia,serif;letter-spacing:.025em;text-transform:lowercase!important;text-shadow:0 2px 5px #3c0610;text-align:center}
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
  const mark=document.querySelector('#studioApp .studio-brand-row')||document.querySelector('#studioApp .topbar');
  if(!mark)return;
  // This rail is also the persistent three-dot marker beside the top-left
  // stitched crest. Never tie its visibility to preview or load completion.
  // The signed-in toolbar can be remounted after hydration; reattach the
  // existing node rather than producing a duplicate or leaving it detached.
  if(!profile||!profile.isConnected){
   profile=document.getElementById('lwaProfileLoading')||document.createElement('span');
   profile.id='lwaProfileLoading';
   if(!profile.querySelector('.lwa-dot'))profile.append(make('falling'));
   let label=profile.querySelector('.lwa-profile-loading-label');
   if(!label){
    label=document.createElement('span');
    label.className='lwa-profile-loading-label';
    label.textContent='loading profile';
    profile.append(label);
   }
   label.hidden=true;
  }
  if(profile.parentElement!==mark)mark.append(profile);
  if(!profile.hasAttribute('role'))profile.setAttribute('aria-hidden','true');
  profile.hidden=false;
  // Startup and login-laptop loaders remain separate; this is solely the
  // already-existing top-left three-dot element.
 }
 let ownerProfileTimer=0;
 function setProfile(loading){
  ensure();
  if(profile){
   profile.hidden=false;
   const label=profile.querySelector('.lwa-profile-loading-label');
   if(label)label.hidden=!loading;
   if(loading){
    profile.setAttribute('role','status');
    profile.setAttribute('aria-label','Loading your profile');
    profile.removeAttribute('aria-hidden');
   }else{
    profile.removeAttribute('role');
    profile.removeAttribute('aria-label');
    profile.setAttribute('aria-hidden','true');
   }
  }
  if(!loading&&ownerProfileTimer){clearTimeout(ownerProfileTimer);ownerProfileTimer=0}
 }
 function pendingOwnerProfile(){
  if(document.documentElement.classList.contains('biglwa-preview-mode')||!studioVisible())return;
  setProfile(true);
  if(ownerProfileTimer)clearTimeout(ownerProfileTimer);
  ownerProfileTimer=setTimeout(()=>setProfile(false),7000);
 }
 for(const event of ['biglwa:identity-updated','biglwa:session-verified']){
  window.addEventListener(event,pendingOwnerProfile);
 }
 for(const event of ['biglwa:profile-metrics','biglwa:user-directory-ready']){
  window.addEventListener(event,()=>{if(!document.documentElement.classList.contains('biglwa-preview-mode'))setProfile(false)});
 }
 function hideTransition(){if(transitionTimer)clearTimeout(transitionTimer);if(transition)transition.hidden=true}
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
 let moduleKey='',moduleStarted=0,avatarStarted=0,avatarChanged=0,moduleCurtain=null,avatarCurtain=null,viewAnywayFor='';
 function curtain(container,label,kind){
  const el=document.createElement('div');el.className='lwa-curtain';el.dataset.lwaCurtain=kind;
  label=String(label||'loading').toLowerCase();
  el.setAttribute('role','status');el.setAttribute('aria-label',label);
  const mark=document.createElement('div');mark.className='lwa-curtain-brand';
  mark.setAttribute('aria-hidden','true');
  mark.innerHTML='<span class="lwa-curtain-brand-b">big</span><span class="lwa-curtain-brand-w">lwa</span>';
  el.append(mark);
  el.append(make(kind==='avatar'?'pulse':'floating'));
  const t=document.createElement('span');t.className='lwa-curtain-label';t.textContent=label;el.append(t);
  if(kind==='module'){
   const progress=document.createElement('span');progress.className='lwa-curtain-progress';
   progress.textContent='Preparing your view…';progress.setAttribute('aria-live','polite');el.append(progress);
   const skip=document.createElement('button');skip.type='button';skip.className='lwa-curtain-bypass';
   skip.textContent='Who’s you? →';skip.setAttribute('aria-label','View anyway before loading finishes');
   skip.title='View anyway';skip.addEventListener('click',event=>{
     event.preventDefault();event.stopPropagation();
     viewAnywayFor=moduleKey;el.hidden=true;container.classList.remove('lwa-curtain-veve-pending','lwa-curtain-loading');
   });el.append(skip);
  }
  container.append(el);return el
 }
 function unresolvedImages(el){
  // Lazy images outside the viewport intentionally remain incomplete until
  // someone scrolls. They must never hold an entire widget page hostage.
  return [...el.querySelectorAll('img:not([loading="lazy"])')].some(img=>!img.complete);
 }
 function loadingState(){
  if(!window.document?.getElementById)return;
  const app=document.getElementById('studioApp');if(!app)return;
  const space=app.querySelector('.main.module-view>.module-workspace');const shell=space?.querySelector('.module-shell');
  const key=space?.dataset.moduleKey||'';
  if(key&&key!==moduleKey){moduleKey=key;viewAnywayFor='';moduleStarted=Date.now();moduleCurtain?.parentElement?.classList.remove('lwa-curtain-veve-pending','lwa-curtain-loading');moduleCurtain?.remove();moduleCurtain=null;setTimeout(schedule,380)}
  if(!key){moduleKey='';viewAnywayFor='';moduleCurtain?.parentElement?.classList.remove('lwa-curtain-veve-pending','lwa-curtain-loading');moduleCurtain?.remove();moduleCurtain=null}
  if(shell&&key){
   if(!moduleCurtain||!shell.contains(moduleCurtain))moduleCurtain=curtain(shell,'Loading '+key,'module');
   moduleCurtain.querySelector('.lwa-curtain-label').textContent='loading '+key;
   const heading=shell.querySelector('.module-heading');const bounds=shell.getBoundingClientRect();const head=heading?.getBoundingClientRect();
   const curtainOffset=Math.max(0,(head?head.bottom:bounds.top)-bounds.top+16);shell.style.setProperty('--lwa-loading-top',curtainOffset+'px');moduleCurtain.style.top=curtainOffset+'px';
   const busy=space.querySelector('[aria-busy="true"]:not(.lwa-curtain)');
   const veve=key==='veve';
   const feed=veve?window.BigLWAVeve?.status?.():null;
   // The Veve API owns the data fetch lifecycle: public posts, Sqwidz, and
   // the final render. Do NOT wait for lazy photos below the landing viewport.
   const ready=veve?Boolean(feed?.ready&&feed?.mounted):
     (Date.now()-moduleStarted>=320 && !unresolvedImages(shell) && !busy);
   const visible=!ready&&viewAnywayFor!==key;
   moduleCurtain.hidden=!visible;
   if(visible)moduleCurtain.style.zIndex='1502';
   shell.classList.toggle('lwa-curtain-veve-pending',veve&&visible);
   shell.classList.toggle('lwa-curtain-loading',visible);
   const progress=moduleCurtain.querySelector('.lwa-curtain-progress');
   if(progress)progress.textContent=(veve
     ?String(feed?.stage||'Connecting to public collections…')
     :(busy?'Loading page data…':unresolvedImages(shell)?'Preparing images…':'Opening '+key+'…')).toLowerCase();
   // The view-anyway control is for Veve; every other widget can still be
   // revealed on demand if its own data request stalls.
   if(!visible&&veve)moduleCurtain.setAttribute('data-lwa-ready','true');
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
  if(!window.document?.getElementById){observe.disconnect();return}
  ensure();scan();schedule();
  const now=studioVisible();
  if(now&&!wasStudio){hideTransition();setProfile(true);window.dispatchEvent(new Event('biglwa:studio-opened'))}
  if(!now&&wasStudio)hideTransition();
  wasStudio=now;
 });
 function start(){ensure();scan();loadingState();observe.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','src','aria-busy','data-module-key']});document.addEventListener('load',schedule,true);document.addEventListener('error',schedule,true);document.addEventListener('biglwa:veve-load-state',schedule);}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
 window.BigLWALoadingDots={
  profile:setProfile,
  studio(){ensure();/* the single startup screen lives in index.html */},
  ready(){setProfile(false);hideTransition()}
 };
 // Capture legacy Step Inside clicks even when the visual CTA sits outside the form.
 // Never manufacture a signed-in state: Firebase remains the sole auth authority.
 document.addEventListener('click',event=>{
  const el=event.target.closest('button,[role="button"],[data-enter-studio],a');
  if(!el||studioVisible()||!el.closest('#loginPage'))return;
  const label=(el.textContent||el.getAttribute('aria-label')||'').trim().toLowerCase();
  if(!/^(step inside|sign in|log in|enter studio|continue)(\s*[→›»])?$/.test(label))return;
  const page=el.closest('#loginPage');
  const ownForm=el.closest('form');
  const visible=form=>!!form&&(form.getClientRects().length>0||getComputedStyle(form).display!=='none');
  const email=page.querySelector('#loginEmail');
  const form=ownForm||(email?.form&&visible(email.form)?email.form:null);
  // A CTA with no submit behavior must enter the existing auth form, not just show a loader.
  if(label.startsWith('step inside')&&(!form||!visible(form))){
   const tab=page.querySelector('#signInTab');
   if(tab){tab.click();return}
   email?.focus();return;
  }
  if(form&&!form.checkValidity())return;
  window.BigLWALoadingDots.studio();
  if(form&&el.tagName==='BUTTON'&&el.type==='button'&&!el.dataset.lwaSubmitBound){
   el.dataset.lwaSubmitBound='1';
   form.requestSubmit();
   queueMicrotask(()=>delete el.dataset.lwaSubmitBound);
  }else if(form&&!ownForm&&!el.hasAttribute('href')){
   form.requestSubmit();
  }
 },true);
 window.addEventListener('biglwa:session-verified',event=>{
  if(event.detail?.signedIn)window.BigLWALoadingDots?.ready();
  else hideTransition();
 });
})();
