(()=>{
  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const DB_NAME='biglwa-studio-media-v1';
  const STORE_NAME='wallpaper';
  const RECORD_KEY='active';
  const APPEARANCE_KEY='biglwaWidgetStyle';
  const WALLPAPER_SETTINGS_KEY='biglwaWallpaperSettings';
  const WIDGET_SELECTOR='#studioApp .profile-card,#studioApp .music-card,#studioApp .aura-card,#studioApp .mobile-dock.hero-action-bar,#studioApp .masonry .card:not(.manifesto-card)';
  let activeObjectUrl='';
  let restored=false;

  function ensureStyles(){
    let style=$('#biglwa-studio-appearance-style');
    if(!style){style=document.createElement('style');style.id='biglwa-studio-appearance-style';document.head.appendChild(style)}
    style.textContent=`
      /* Every control in Widgets & colors targets the visible Studio cards. */
      #studioApp .profile-card,
      #studioApp .music-card,
      #studioApp .aura-card,
      #studioApp .mobile-dock.hero-action-bar,
      #studioApp .masonry .card:not(.manifesto-card){
        background:var(--widget-bg,rgba(250,247,241,.84))!important;
        color:var(--widget-ink,#171717)!important;
        border-radius:var(--widget-radius,16px)!important;
        border-color:rgba(var(--aura-rgb,216,95,109),.18)!important;
        -webkit-backdrop-filter:blur(var(--widget-blur,18px))!important;
        backdrop-filter:blur(var(--widget-blur,18px))!important;
        transition:background .14s ease,border-radius .14s ease,border-color .14s ease,box-shadow .14s ease,color .14s ease!important;
      }
      #studioApp .masonry .card:not(.manifesto-card) .sub,
      #studioApp .masonry .card:not(.manifesto-card) p,
      #studioApp .music-card .music-row span,
      #studioApp .profile-card .meta-row,
      #studioApp .profile-card .stats,
      #studioApp .profile-card .profile-rail-location{color:var(--widget-muted,#77716b)!important}
      #studioApp .profile-card .profile-identity-rail{background:color-mix(in srgb,var(--widget-ink,#171717) 4%,transparent)!important}
      #studioApp .profile-card .profile-identity-rail #editProfileBtn,
      #studioApp .round-btn,
      #studioApp .verified{background:rgb(var(--aura-rgb,216,95,109))!important;color:var(--aura-button-ink,#fff)!important;box-shadow:0 7px 20px rgba(var(--aura-rgb,216,95,109),.24)!important}
      #studioApp .music-card .progress i{background:rgb(var(--aura-rgb,216,95,109))!important}
      #studioApp .aura-card .aura-orb{background:radial-gradient(circle at 55% 48%,rgba(var(--aura-rgb,216,95,109),1) 0 15%,rgba(var(--aura-rgb,216,95,109),.6) 31%,rgba(var(--aura-rgb,216,95,109),.2) 56%,transparent 73%)!important;box-shadow:0 0 calc(var(--aura-strength,30) * .65px) rgba(var(--aura-rgb,216,95,109),.58)!important}
      #studioApp.profile-editor-widgets .music-card,
      #studioApp.profile-editor-widgets .aura-card,
      #studioApp.profile-editor-widgets .mobile-dock.hero-action-bar,
      #studioApp.profile-editor-widgets .masonry .card:not(.manifesto-card){box-shadow:0 0 0 2px rgba(var(--aura-rgb,216,95,109),.55),0 14px 36px rgba(var(--aura-rgb,216,95,109),.14)!important}
      #studioApp.profile-editor-widgets .profile-card.profile-is-editing{min-height:380px!important}
      #studioApp.profile-editor-wallpaper .profile-card.profile-is-editing{min-height:470px!important}
      #studioApp .widget-live-connection{display:grid;grid-template-columns:32px minmax(0,1fr);gap:8px;align-items:center;margin:7px 0 12px;padding:9px 10px;border:1px solid rgba(var(--aura-rgb,216,95,109),.30);border-radius:11px;background:rgba(var(--aura-rgb,216,95,109),.08);font:10px/1.35 Inter,ui-sans-serif,system-ui,sans-serif}
      #studioApp .widget-live-connection i{display:block;width:30px;height:30px;border-radius:9px;background:rgb(var(--aura-rgb,216,95,109));box-shadow:0 5px 13px rgba(var(--aura-rgb,216,95,109),.28)}
      #studioApp .widget-live-connection strong,#studioApp .widget-live-connection span{display:block}#studioApp .widget-live-connection span{color:var(--widget-muted,#77716b);font-size:9px}
      #studioApp #profileWallpaperEditor .wallpaper-preview{position:relative;overflow:hidden;background-size:cover;background-position:center}
      #studioApp #profileWallpaperEditor .wallpaper-preview video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;display:none}
      #studioApp .wallpaper-media-context{grid-template-columns:1fr auto!important}
      #studioApp .wallpaper-safety-note{margin:8px 0!important;padding:8px 9px;border-radius:9px;background:rgba(var(--aura-rgb,216,95,109),.07);font-size:9px!important;line-height:1.45!important}
      #studioApp .wallpaper-safety-status{min-height:30px;margin:7px 0!important;padding:8px 9px;border:1px solid rgba(80,70,64,.14);border-radius:9px;background:rgba(255,255,255,.35);font-size:9px!important;line-height:1.45!important;color:var(--widget-muted,#77716b)!important}
      #studioApp .wallpaper-safety-status[data-state="checking"]{border-color:rgba(var(--aura-rgb,216,95,109),.44);color:rgb(var(--aura-rgb,216,95,109))!important}
      #studioApp .wallpaper-safety-status[data-state="error"],#studioApp .wallpaper-safety-status[data-state="held"]{border-color:rgba(166,48,48,.38);color:#983737!important}
      #studioApp .wallpaper-18-badge{display:none;width:max-content;margin:5px 0;padding:4px 7px;border-radius:999px;background:#1d1b1a;color:#fff;font:800 8px/1 Inter,ui-sans-serif,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase}
      #studioApp .wallpaper-18-badge.is-visible{display:block}
      #studioApp .wallpaper-button-row{display:grid;grid-template-columns:1fr auto;gap:7px;align-items:start}
      #studioApp .wallpaper-button-row .secondary-btn{margin:0!important}
      #studioApp .wallpaper-button-row .wallpaper-remove{width:auto!important;min-width:72px!important;background:rgba(255,255,255,.54)!important;color:var(--widget-ink,#272321)!important;border:1px solid rgba(65,54,49,.18)!important}
      #pageWallpaper>.biglwa-wallpaper-video{position:absolute;inset:-3%;z-index:0;display:none;width:106%;height:106%;object-fit:var(--page-size,cover);object-position:var(--page-position,center);pointer-events:none}
      #pageWallpaper.biglwa-video-wallpaper{background-image:none!important}
      #pageWallpaper.biglwa-video-wallpaper>.biglwa-wallpaper-video{display:block}
      #pageWallpaper::after{z-index:2}
      body.night-mode #studioApp .wallpaper-safety-status{background:rgba(255,255,255,.05);border-color:rgba(255,255,255,.14)}
      @media(max-width:900px){#studioApp.profile-editor-widgets .profile-card.profile-is-editing{min-height:410px!important}#studioApp.profile-editor-wallpaper .profile-card.profile-is-editing{min-height:520px!important}}
      @media(prefers-reduced-motion:reduce){#studioApp .profile-card,#studioApp .music-card,#studioApp .aura-card,#studioApp .mobile-dock.hero-action-bar,#studioApp .masonry .card{transition:none!important}}
    `;
  }

  function parseHex(value,fallback){
    const match=String(value||fallback).trim().match(/^#([0-9a-f]{6})$/i);
    const hex=(match?match[1]:fallback.replace('#',''));
    return [parseInt(hex.slice(0,2),16),parseInt(hex.slice(2,4),16),parseInt(hex.slice(4,6),16)];
  }

  function readAppearance(){
    return {
      color:$('#widgetColor')?.value||'#faf7f1',
      radius:$('#widgetRadius')?.value||'16',
      opacity:$('#widgetOpacity')?.value||'84',
      blur:$('#widgetBlur')?.value||'18',
      aura:$('#auraColor')?.value||'#d85f6d'
    };
  }

  function applyAppearance(save=true){
    const app=$('#studioApp');if(!app)return;
    const values=readAppearance();
    const [r,g,b]=parseHex(values.color,'#faf7f1'),alpha=Math.min(1,Math.max(.35,Number(values.opacity)/100));
    const luminance=(.2126*r+.7152*g+.0722*b)/255;
    const [ar,ag,ab]=parseHex(values.aura,'#d85f6d');
    const auraLuminance=(.2126*ar+.7152*ag+.0722*ab)/255;
    const properties={
      '--widget-bg':`rgba(${r},${g},${b},${alpha})`,
      '--widget-radius':`${values.radius}px`,
      '--widget-blur':`${values.blur}px`,
      '--widget-ink':luminance<.48?'#f8f4ee':'#171717',
      '--widget-muted':luminance<.48?'#d0c8c0':'#77716b',
      '--aura-rgb':`${ar},${ag},${ab}`,
      '--aura-button-ink':auraLuminance>.62?'#171717':'#ffffff'
    };
    [document.documentElement,app].forEach(root=>Object.entries(properties).forEach(([name,value])=>root.style.setProperty(name,value)));
    const labels={widgetRadiusValue:`${values.radius}px`,widgetOpacityValue:`${values.opacity}%`,widgetBlurValue:`${values.blur}px`};
    Object.entries(labels).forEach(([id,value])=>{const el=$('#'+id);if(el)el.textContent=value});
    const live=$('#widgetLiveConnection');
    if(live){const count=$$(WIDGET_SELECTOR).filter(widget=>!widget.classList.contains('widget-is-minimized')).length;const detail=$('span',live);if(detail)detail.textContent=`Connected to ${count} visible Studio widgets · changes apply instantly`}
    if(save)try{localStorage.setItem(APPEARANCE_KEY,JSON.stringify(values))}catch{}
  }

  function restoreAppearance(){
    let values=null;try{values=JSON.parse(localStorage.getItem(APPEARANCE_KEY)||'null')}catch{}
    if(values){
      const mapping={widgetColor:'color',widgetRadius:'radius',widgetOpacity:'opacity',widgetBlur:'blur',auraColor:'aura'};
      Object.entries(mapping).forEach(([id,key])=>{const input=$('#'+id);if(input&&values[key]!=null)input.value=values[key]});
    }
    applyAppearance(false);
  }

  function ensureWidgetConnection(){
    const section=$('#profileWidgetEditor')||$('[data-profile-editor-pane="widgets"]');if(!section)return;
    if(!$('#widgetLiveConnection',section)){
      const live=document.createElement('div');live.id='widgetLiveConnection';live.className='widget-live-connection';live.setAttribute('role','status');live.innerHTML='<i aria-hidden="true"></i><div><strong>Live Studio preview</strong><span>Connecting to visible widgets…</span></div>';
      const intro=$('p',section);if(intro)intro.insertAdjacentElement('afterend',live);else section.prepend(live);
    }
    if(section.dataset.biglwaAppearanceBound!=='1'){
      section.dataset.biglwaAppearanceBound='1';
      section.addEventListener('input',event=>{if(event.target.matches('#widgetColor,#widgetRadius,#widgetOpacity,#widgetBlur,#auraColor'))applyAppearance(true)});
      section.addEventListener('change',event=>{if(event.target.matches('#widgetColor,#widgetRadius,#widgetOpacity,#widgetBlur,#auraColor'))applyAppearance(true)});
      $('#resetWidgets',section)?.addEventListener('click',()=>queueMicrotask(()=>applyAppearance(true)));
    }
    restoreAppearance();
  }

  function openDatabase(){
    return new Promise((resolve,reject)=>{
      if(!('indexedDB'in window)){reject(new Error('Browser storage is unavailable.'));return}
      const request=indexedDB.open(DB_NAME,1);
      request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORE_NAME))request.result.createObjectStore(STORE_NAME,{keyPath:'id'})};
      request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error||new Error('Could not open wallpaper storage.'));
    });
  }

  async function readWallpaper(){
    const db=await openDatabase();
    try{return await new Promise((resolve,reject)=>{const request=db.transaction(STORE_NAME,'readonly').objectStore(STORE_NAME).get(RECORD_KEY);request.onsuccess=()=>resolve(request.result||null);request.onerror=()=>reject(request.error)})}
    finally{db.close()}
  }

  async function writeWallpaper(record){
    const db=await openDatabase();
    try{await new Promise((resolve,reject)=>{const tx=db.transaction(STORE_NAME,'readwrite');tx.objectStore(STORE_NAME).put(record);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Wallpaper save was interrupted.'))})}
    finally{db.close()}
  }

  async function deleteWallpaper(){
    const db=await openDatabase();
    try{await new Promise((resolve,reject)=>{const tx=db.transaction(STORE_NAME,'readwrite');tx.objectStore(STORE_NAME).delete(RECORD_KEY);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)})}
    finally{db.close()}
  }

  function getWallpaperElements(){
    const page=$('#pageWallpaper'),preview=$('#wallpaperPreview');if(!page||!preview)return {};
    let video=$('.biglwa-wallpaper-video',page);
    if(!video){video=document.createElement('video');video.className='biglwa-wallpaper-video';video.muted=true;video.defaultMuted=true;video.loop=true;video.playsInline=true;video.preload='metadata';video.setAttribute('aria-hidden','true');page.prepend(video)}
    let previewVideo=$('video',preview);
    if(!previewVideo){previewVideo=document.createElement('video');previewVideo.muted=true;previewVideo.defaultMuted=true;previewVideo.loop=true;previewVideo.playsInline=true;previewVideo.preload='metadata';previewVideo.setAttribute('aria-hidden','true');preview.appendChild(previewVideo)}
    return {page,preview,video,previewVideo};
  }

  function revokeActiveUrl(){if(activeObjectUrl){URL.revokeObjectURL(activeObjectUrl);activeObjectUrl=''}}

  function clearWallpaperDisplay(){
    const {page,preview,video,previewVideo}=getWallpaperElements();if(!page)return;
    revokeActiveUrl();
    page.classList.remove('custom-image','biglwa-video-wallpaper');page.style.removeProperty('--page-image');page.style.removeProperty('background-image');
    [video,previewVideo].forEach(media=>{media.pause();media.removeAttribute('src');media.load();media.style.display='none'});
    preview.style.removeProperty('background-image');preview.style.removeProperty('background-size');preview.style.removeProperty('background-position');
  }

  function currentWallpaperSettings(){
    return {fit:$('#fitSelect')?.value||'cover',position:$('#positionSelect')?.value||'center',blur:$('#blurRange')?.value||'0',aura:$('#auraRange')?.value||'30',overlay:$('#overlayRange')?.value||'18'};
  }

  function applyWallpaperSettings(save=true){
    const settings=currentWallpaperSettings(),{page,video,previewVideo}=getWallpaperElements();if(!page)return;
    page.style.setProperty('--page-size',settings.fit);page.style.backgroundSize=settings.fit;page.style.setProperty('--page-position',settings.position);page.style.backgroundPosition=settings.position;
    page.style.setProperty('--page-blur',`${settings.blur}px`);document.documentElement.style.setProperty('--aura-strength',settings.aura);$('#studioApp')?.style.setProperty('--aura-strength',settings.aura);page.style.setProperty('--page-overlay',Number(settings.overlay)/100);
    [video,previewVideo].forEach(media=>{media.style.objectFit=settings.fit;media.style.objectPosition=settings.position});
    const labels={blurValue:`${settings.blur}%`,auraValue:`${settings.aura}%`,overlayValue:`${settings.overlay}%`};Object.entries(labels).forEach(([id,value])=>{const el=$('#'+id);if(el)el.textContent=value});
    if(save)try{localStorage.setItem(WALLPAPER_SETTINGS_KEY,JSON.stringify(settings))}catch{}
  }

  function restoreWallpaperSettings(){
    let settings=null;try{settings=JSON.parse(localStorage.getItem(WALLPAPER_SETTINGS_KEY)||'null')}catch{}
    if(settings){const mapping={fitSelect:'fit',positionSelect:'position',blurRange:'blur',auraRange:'aura',overlayRange:'overlay'};Object.entries(mapping).forEach(([id,key])=>{const input=$('#'+id);if(input&&settings[key]!=null)input.value=settings[key]})}
    applyWallpaperSettings(false);
  }

  function setSafetyStatus(state,message,badge=''){
    const status=$('#wallpaperSafetyStatus');if(status){status.dataset.state=state;status.textContent=message}
    const mark=$('#wallpaper18Badge');if(mark){mark.textContent=badge;mark.classList.toggle('is-visible',Boolean(badge))}
  }

  async function applyWallpaperRecord(record){
    const {page,preview,video,previewVideo}=getWallpaperElements();if(!page||!record?.blob)return;
    clearWallpaperDisplay();
    const url=URL.createObjectURL(record.blob);activeObjectUrl=url;
    if(String(record.type).startsWith('video/')){
      page.classList.add('biglwa-video-wallpaper');
      [video,previewVideo].forEach(media=>{media.src=url;media.style.display='block'});
      if(!matchMedia('(prefers-reduced-motion: reduce)').matches){video.play().catch(()=>{});previewVideo.play().catch(()=>{})}
    }else{
      page.classList.add('custom-image');page.style.setProperty('--page-image',`url("${url}")`);
      preview.style.backgroundImage=`url("${url}")`;preview.style.backgroundSize='cover';preview.style.backgroundPosition='center';
    }
    applyWallpaperSettings(false);
    if(record.rating==='18+')setSafetyStatus('ready','Age-verified wallpaper active on this device.','18+ · verified');
    else setSafetyStatus('ready','Safety check passed · wallpaper saved in this browser.');
  }

  async function restoreWallpaper(){
    if(restored)return;restored=true;
    try{
      const record=await readWallpaper();
      if(record){
        if(record.rating==='18+'&&!await window.BIGLWAWallpaperSafety?.hasVerifiedAdultClaim?.()){
          clearWallpaperDisplay();setSafetyStatus('held','This saved wallpaper is held until the signed 18+ verification claim is present.','18+ · held');return;
        }
        await applyWallpaperRecord(record);try{localStorage.removeItem('biglwaWallpaper')}catch{};return;
      }
      if(localStorage.getItem('biglwaWallpaper')){clearWallpaperDisplay();setSafetyStatus('held','Your older wallpaper is preserved, but needs to be chosen again for the new safety check before it can display.');return}
      setSafetyStatus('idle','Choose a file to run a private, on-device safety check.');
    }catch{clearWallpaperDisplay();setSafetyStatus('error','Wallpaper storage is unavailable, so no custom media was shown.')}
  }

  async function processWallpaper(file,context,button,input){
    const safety=window.BIGLWAWallpaperSafety;
    if(!safety){setSafetyStatus('error','Safety scanning is unavailable, so this file was not applied.');return}
    button.disabled=true;input.disabled=true;setSafetyStatus('checking',file.type.startsWith('video/')?'Checking multiple frames from this video on your device…':'Checking this image on your device…');
    try{
      const result=await safety.scan(file,{context,onProgress:(current,total)=>setSafetyStatus('checking',`Checking frame ${current} of ${total} on your device…`)});
      if(result.status==='invalid'||result.status==='unavailable'){setSafetyStatus('error',result.message||'This file could not be safely checked, so it was not applied.');return}
      if(result.status==='block'){setSafetyStatus('error','This appears to be explicit photographic media, so it cannot be used as a wallpaper.');return}
      let rating='general';
      if(result.status==='age-restricted'){
        setSafetyStatus('checking','Adult or uncertain context detected. Checking signed age verification…','18+ · checking');
        if(!await safety.hasVerifiedAdultClaim()){setSafetyStatus('held','Held as 18+. A birthday entry is not enough, and secure age verification is not connected yet.','18+ · held');return}
        rating='18+';
      }
      const record={id:RECORD_KEY,blob:file,type:file.type,name:String(file.name||'wallpaper').slice(0,180),rating,context,checkedBy:result.engine,updatedAt:Date.now()};
      await writeWallpaper(record);try{localStorage.removeItem('biglwaWallpaper')}catch{}
      await applyWallpaperRecord(record);
    }catch{setSafetyStatus('error','The safety check could not finish, so this file was not applied.')}
    finally{button.disabled=false;input.disabled=false;input.value=''}
  }

  function ensureWallpaperEditor(){
    const section=$('#profileWallpaperEditor')||$('[data-profile-editor-pane="wallpaper"]');if(!section)return;
    const intro=$('p',section);if(intro)intro.textContent='Use one continuous image, animated GIF, or video wallpaper. Media stays on this device in the current Studio build.';
    let input=$('#wallpaperInput',section),button=$('#changeWallpaper',section);if(!input||!button)return;
    if(input.dataset.biglwaSafeMediaBound!=='1'){
      const fresh=input.cloneNode(true);fresh.dataset.biglwaSafeMediaBound='1';fresh.accept='image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,.mov';input.replaceWith(fresh);input=fresh;
    }
    if(button.dataset.biglwaSafeMediaBound!=='1'){
      const fresh=button.cloneNode(true);fresh.dataset.biglwaSafeMediaBound='1';fresh.textContent='Choose wallpaper';button.replaceWith(fresh);button=fresh;
    }
    let row=$('.wallpaper-button-row',section);
    if(!row){row=document.createElement('div');row.className='wallpaper-button-row';button.replaceWith(row);row.appendChild(button);const remove=document.createElement('button');remove.type='button';remove.id='removeWallpaper';remove.className='secondary-btn wallpaper-remove';remove.textContent='Remove';row.appendChild(remove)}
    if(!$('#wallpaperMediaContext',section)){
      const context=document.createElement('label');context.className='wallpaper-media-context';context.innerHTML='Media context<select id="wallpaperMediaContext"><option value="photo">Photo or video</option><option value="art">Artwork or illustration</option><option value="mixed">Mixed or other</option></select>';row.insertAdjacentElement('afterend',context);
      const note=document.createElement('p');note.className='wallpaper-safety-note';note.textContent='Artwork is reviewed in context, not automatically blocked. Likely explicit photographic nudity is blocked. Uncertain or adult-coded media is held as 18+ and needs verified age.';context.insertAdjacentElement('afterend',note);
      const badge=document.createElement('span');badge.id='wallpaper18Badge';badge.className='wallpaper-18-badge';note.insertAdjacentElement('afterend',badge);
      const status=document.createElement('p');status.id='wallpaperSafetyStatus';status.className='wallpaper-safety-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');badge.insertAdjacentElement('afterend',status);
    }
    if(section.dataset.biglwaSafeMediaBound!=='1'){
      section.dataset.biglwaSafeMediaBound='1';
      button.addEventListener('click',event=>{event.preventDefault();input.click()});
      input.addEventListener('change',()=>{const file=input.files?.[0];if(file)processWallpaper(file,$('#wallpaperMediaContext',section)?.value||'mixed',button,input)});
      $('#removeWallpaper',section)?.addEventListener('click',async()=>{try{await deleteWallpaper();try{localStorage.removeItem('biglwaWallpaper')}catch{}clearWallpaperDisplay();setSafetyStatus('idle','Custom wallpaper removed. Choose a file to run a new safety check.')}catch{setSafetyStatus('error','The wallpaper could not be removed from browser storage.')}});
      section.addEventListener('input',event=>{if(event.target.matches('#fitSelect,#positionSelect,#blurRange,#auraRange,#overlayRange'))applyWallpaperSettings(true)});
      section.addEventListener('change',event=>{if(event.target.matches('#fitSelect,#positionSelect,#blurRange,#auraRange,#overlayRange'))applyWallpaperSettings(true)});
    }
    restoreWallpaperSettings();restoreWallpaper();
  }

  function syncEditorState(){
    const app=$('#studioApp'),card=$('#studioApp .profile-card'),panel=$('#wallpaperPanel');if(!app||!card||!panel)return;
    const active=$('[data-profile-editor-tab][aria-selected="true"]',panel),key=active?.dataset.profileEditorTab||'profile';
    app.classList.remove('profile-editor-profile','profile-editor-wallpaper','profile-editor-widgets');
    if(card.classList.contains('profile-is-editing'))app.classList.add(`profile-editor-${key}`);
    const title=$('.panel-title strong',panel);if(title)title.textContent=key==='widgets'?'Edit widgets live':key==='wallpaper'?'Edit wallpaper':'Edit profile';
    const save=$('#saveProfileBtn',panel);if(save)save.textContent='Save changes';
  }

  function bindEditorState(){
    const panel=$('#wallpaperPanel'),tabs=$('#profileEditorTabs'),card=$('#studioApp .profile-card');if(!panel||!tabs||!card)return;
    if(tabs.dataset.biglwaLiveStateBound!=='1'){tabs.dataset.biglwaLiveStateBound='1';tabs.addEventListener('click',()=>queueMicrotask(syncEditorState));new MutationObserver(syncEditorState).observe(tabs,{attributes:true,subtree:true,attributeFilter:['aria-selected']})}
    if(card.dataset.biglwaLiveStateBound!=='1'){card.dataset.biglwaLiveStateBound='1';new MutationObserver(syncEditorState).observe(card,{attributes:true,attributeFilter:['class']})}
    syncEditorState();
  }

  function run(){ensureStyles();ensureWidgetConnection();ensureWallpaperEditor();bindEditorState()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
  window.addEventListener('load',()=>setTimeout(run,0),{once:true});
  window.addEventListener('pagehide',revokeActiveUrl,{once:true});
  setTimeout(run,220);
})();
