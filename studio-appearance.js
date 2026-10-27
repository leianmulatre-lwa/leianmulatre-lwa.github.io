(()=>{
  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const DB_NAME='biglwa-studio-media-v1';
  const STORE_NAME='wallpaper';
  const APPEARANCE_KEY='biglwaWidgetStyle';
  // Preferences belong to a verified Firebase UID, never to the last browser user.
  const activeUid=()=>String(window.BigLWAAccountStorage?.uid||window.__biglwaIdentity?.uid||'').trim();
  const ownedKey=base=>activeUid()?base+':'+activeUid():'';
  const saveOwned=(base,value)=>{const k=ownedKey(base);if(k)try{localStorage.setItem(k,JSON.stringify(value))}catch{}};
  const readOwned=base=>{const k=ownedKey(base);if(!k)return null;try{return JSON.parse(localStorage.getItem(k)||'null')}catch{return null}};
  const WALLPAPER_SETTINGS_KEY='biglwaWallpaperSettings';
  const WIDGET_SELECTOR='#studioApp .profile-card,#studioApp .music-card,#studioApp .aura-card,#studioApp .guest-check-card,#studioApp .mobile-dock.hero-action-bar,#studioApp .masonry .card:not(.manifesto-card),#studioApp .module-workspace .module-card,#studioApp .module-workspace .calendar-board,#studioApp .module-workspace .module-launcher';
  let activeObjectUrl='',activeWallpaperSource='',activeWallpaperKind='image';

  function ensureStyles(){
    let style=$('#biglwa-studio-appearance-style');
    if(!style){style=document.createElement('style');style.id='biglwa-studio-appearance-style';document.head.appendChild(style)}
    style.textContent=`
      /* Color chips + editable HEX value sit beside the native color wheel. */
      #studioApp .biglwa-color-choices{display:grid;gap:7px;padding:9px;margin:5px 0 12px;border:1px solid rgba(var(--aura-rgb,216,95,109),.24);border-radius:10px;background:rgba(255,255,255,.15)}
      #studioApp .biglwa-color-choices strong{font:650 11px/1.3 Inter,system-ui,sans-serif}
      #studioApp .biglwa-color-swatches{display:flex;flex-wrap:wrap;gap:7px}
      #studioApp .biglwa-color-swatch{width:30px;height:30px;min-width:30px;border-radius:8px;border:2px solid rgba(50,38,35,.32);background:var(--swatch);cursor:pointer;padding:0;box-sizing:border-box}
      #studioApp .biglwa-color-swatch[aria-pressed="true"]{outline:2px solid rgb(var(--aura-rgb,216,95,109));outline-offset:2px}
      #studioApp .biglwa-color-swatch:focus-visible{outline:3px solid #604a91;outline-offset:3px}
      #studioApp .biglwa-color-hex{display:flex;align-items:center;gap:7px;font:600 10px/1.25 Inter,system-ui,sans-serif}
      #studioApp .biglwa-color-hex input{width:96px!important;min-width:0!important;padding:6px 8px!important;border:1px solid rgba(90,76,73,.35);border-radius:7px;font:600 12px/1.3 ui-monospace,monospace;color:inherit;background:rgba(255,255,255,.7)}
      /* Every control in Widget & Aura targets the visible Studio cards. */
      #studioApp .profile-card,
      #studioApp .music-card,
      #studioApp .aura-card,
      #studioApp .guest-check-card,
      #studioApp .mobile-dock.hero-action-bar,
      #studioApp .masonry .card:not(.manifesto-card){
        background:var(--widget-bg,rgba(250,247,241,.84))!important;
        color:var(--widget-ink,#171717)!important;
        border-radius:var(--widget-radius,16px)!important;
        border-color:rgba(var(--aura-rgb,216,95,109),.18)!important;
        -webkit-backdrop-filter:none!important;
        backdrop-filter:none!important;
        background-clip:padding-box!important;
        transition:background .14s ease,border-color .14s ease,box-shadow .14s ease,color .14s ease!important;
      }
      #studioApp .module-workspace .module-card:not(.module-game-stage):not(:has(.diary-lined)),
      #studioApp .module-workspace .calendar-board,
      #studioApp .module-workspace .module-launcher,
      #studioApp .module-workspace .module-orbit-row,
      #studioApp .module-workspace .trophy-entry{
        background:var(--widget-bg,rgba(250,247,241,.84))!important;
        color:var(--widget-ink,#171717)!important;
        border-radius:var(--widget-radius,16px)!important;
        border-color:rgba(var(--aura-rgb,216,95,109),.18)!important;
        -webkit-backdrop-filter:none!important;
        backdrop-filter:none!important;
        background-clip:padding-box!important;
      }
      #studioApp .module-workspace{--module-page-blur:0px;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}
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
      #studioApp.profile-editor-widgets .guest-check-card,
      #studioApp.profile-editor-widgets .mobile-dock.hero-action-bar,
      #studioApp.profile-editor-widgets .masonry .card:not(.manifesto-card){box-shadow:0 0 0 2px rgba(var(--aura-rgb,216,95,109),.55),0 14px 36px rgba(var(--aura-rgb,216,95,109),.14)!important}
      #studioApp.profile-editor-widgets .profile-card.profile-is-editing{min-height:380px!important}
      #studioApp.profile-editor-wallpaper .profile-card.profile-is-editing{min-height:470px!important}
      #studioApp .widget-live-connection{display:grid;grid-template-columns:32px minmax(0,1fr);gap:8px;align-items:center;margin:7px 0 12px;padding:9px 10px;border:1px solid rgba(var(--aura-rgb,216,95,109),.30);border-radius:11px;background:rgba(var(--aura-rgb,216,95,109),.08);font:10px/1.35 Inter,ui-sans-serif,system-ui,sans-serif}
      #studioApp .widget-live-connection i{display:block;width:30px;height:30px;border-radius:9px;background:rgb(var(--aura-rgb,216,95,109));box-shadow:0 5px 13px rgba(var(--aura-rgb,216,95,109),.28)}
      #studioApp .widget-live-connection strong,#studioApp .widget-live-connection span{display:block}#studioApp .widget-live-connection span{color:var(--widget-muted,#77716b);font-size:9px}
      #studioApp .widget-opacity-control{margin:0 0 12px!important;padding:10px 11px!important;border:1px solid rgba(var(--aura-rgb,216,95,109),.28)!important;border-radius:11px!important;background:rgba(var(--aura-rgb,216,95,109),.07)!important;font-weight:700!important}
      #studioApp .widget-opacity-control input[type="range"]{accent-color:rgb(var(--aura-rgb,216,95,109))!important}
      #studioApp .widget-opacity-control #widgetOpacityValue{font-variant-numeric:tabular-nums}
      #studioApp #profileWallpaperEditor .wallpaper-preview{position:relative;overflow:hidden;background-size:cover;background-position:center}
      #studioApp #profileWallpaperEditor .wallpaper-preview video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;display:none}
      #studioApp .wallpaper-media-context{grid-template-columns:1fr auto!important}
      #studioApp .wallpaper-safety-note{margin:8px 0!important;padding:8px 9px;border-radius:9px;background:rgba(var(--aura-rgb,216,95,109),.07);font-size:9px!important;line-height:1.45!important}
      #studioApp .wallpaper-safety-status{min-height:30px;margin:7px 0!important;padding:8px 9px;border:1px solid rgba(80,70,64,.14);border-radius:9px;background:rgba(255,255,255,.35);font-size:9px!important;line-height:1.45!important;color:var(--widget-muted,#77716b)!important}
      #studioApp .wallpaper-safety-status[data-state="checking"]{border-color:rgba(var(--aura-rgb,216,95,109),.44);color:rgb(var(--aura-rgb,216,95,109))!important}
      #studioApp .wallpaper-safety-status[data-state="pending"]{border-color:rgba(194,139,27,.5);background:rgba(255,190,48,.11);color:#755109!important}
      #studioApp .wallpaper-safety-status[data-state="error"],#studioApp .wallpaper-safety-status[data-state="held"]{border-color:rgba(166,48,48,.38);color:#983737!important}
      #studioApp .wallpaper-18-badge{display:none;width:max-content;margin:5px 0;padding:4px 7px;border-radius:999px;background:#1d1b1a;color:#fff;font:800 8px/1 Inter,ui-sans-serif,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase}
      #studioApp .wallpaper-18-badge.is-visible{display:block}
      #studioApp .wallpaper-button-row{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:7px;align-items:start}
      #studioApp .wallpaper-button-row .wallpaper-adjust{border:1px dashed #95556b!important;background:#fff6ed!important;color:#613a4c!important;font:750 12px system-ui;padding:11px 16px;cursor:pointer}
      #studioApp #profileWallpaperEditor .wallpaper-position-native{display:none!important}
      @media(max-width:500px){#studioApp .wallpaper-button-row{grid-template-columns:minmax(0,1fr) auto auto;gap:4px}#studioApp .wallpaper-button-row .wallpaper-adjust{padding:10px 9px}}

      #studioApp .wallpaper-button-row .secondary-btn{margin:0!important}
      #studioApp .wallpaper-button-row .wallpaper-remove{width:auto!important;min-width:72px!important;background:rgba(255,255,255,.54)!important;color:var(--widget-ink,#272321)!important;border:1px solid rgba(65,54,49,.18)!important}
      #pageWallpaper>.biglwa-wallpaper-video{position:absolute;inset:-3%;z-index:0;display:none;width:106%;height:106%;object-fit:var(--page-size,cover);object-position:var(--page-position,center);pointer-events:none}
      #pageWallpaper.biglwa-video-wallpaper{background-image:none!important}
      #pageWallpaper.biglwa-video-wallpaper>.biglwa-wallpaper-video{display:block}
      #pageWallpaper::before{content:"";position:absolute;inset:0;z-index:1;pointer-events:none;background:linear-gradient(to top,rgba(var(--aura-rgb,216,95,109),.36) 0,rgba(var(--aura-rgb,216,95,109),.16) 18%,transparent 46%)}
      #pageWallpaper::after{z-index:2}
      body.night-mode #studioApp .wallpaper-safety-status{background:rgba(255,255,255,.05);border-color:rgba(255,255,255,.14)}
      body.night-mode #studioApp .wallpaper-safety-status[data-state="pending"]{background:rgba(255,190,48,.1);border-color:rgba(255,202,87,.44);color:#f2cf84!important}
      @media(max-width:900px){#studioApp.profile-editor-widgets .profile-card.profile-is-editing{min-height:410px!important}#studioApp.profile-editor-wallpaper .profile-card.profile-is-editing{min-height:520px!important}}
      @media(prefers-reduced-motion:reduce){#studioApp .profile-card,#studioApp .music-card,#studioApp .aura-card,#studioApp .guest-check-card,#studioApp .mobile-dock.hero-action-bar,#studioApp .masonry .card{transition:none!important}}
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
    const [r,g,b]=parseHex(values.color,'#faf7f1'),alpha=Math.min(1,Math.max(.20,(Number(values.opacity)||84)/100));
    const luminance=(.2126*r+.7152*g+.0722*b)/255;
    app.dataset.widgetInkTone=luminance<.48?'light':'dark';
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
    if(save)saveOwned(APPEARANCE_KEY,values)
  }

  function restoreAppearance(){
    let values=readOwned(APPEARANCE_KEY)
    if(values){
      const mapping={widgetColor:'color',widgetRadius:'radius',widgetOpacity:'opacity',widgetBlur:'blur',auraColor:'aura'};
      Object.entries(mapping).forEach(([id,key])=>{const input=$('#'+id);if(input&&values[key]!=null)input.value=values[key]});
    }
    applyAppearance(false);
  }

  function syncColorChoices(id){
    const input=$('#'+id),panel=$('#'+id+'Choices');if(!input||!panel)return;
    const value=String(input.value||'').toLowerCase();
    const hex=$('.biglwa-color-hex input',panel);
    if(hex&&document.activeElement!==hex)hex.value=value;
    $$('.biglwa-color-swatch',panel).forEach(btn=>btn.setAttribute('aria-pressed',String(btn.dataset.color===value)));
  }
  function installColorChoices(id,colors){
    const input=$('#'+id),label=input?.closest('label');
    if(!input||!label)return;
    const existing=$('#'+id+'Choices');
    if(existing){syncColorChoices(id);return}
    const panel=document.createElement('div');panel.id=id+'Choices';panel.className='biglwa-color-choices';
    const heading=document.createElement('strong');heading.textContent='Quick colors · or use the color wheel';panel.append(heading);
    const swatches=document.createElement('div');swatches.className='biglwa-color-swatches';
    colors.forEach(color=>{
      const chip=document.createElement('button');chip.type='button';chip.className='biglwa-color-swatch';
      chip.dataset.color=color;chip.style.setProperty('--swatch',color);
      chip.title='Choose '+color;chip.setAttribute('aria-label','Choose '+color);
      chip.addEventListener('click',()=>{input.value=color;input.dispatchEvent(new Event('input',{bubbles:true}));syncColorChoices(id)});
      swatches.append(chip);
    });panel.append(swatches);
    const hexLabel=document.createElement('label');hexLabel.className='biglwa-color-hex';
    const word=document.createElement('span');word.textContent='Hex';const hex=document.createElement('input');
    hex.type='text';hex.inputMode='text';hex.maxLength=7;hex.setAttribute('aria-label',id==='auraColor'?'Aura color hex':'Widget color hex');
    hex.addEventListener('change',()=>{
      const v=hex.value.trim();if(/^#[0-9a-fA-F]{6}$/.test(v)){input.value=v;input.dispatchEvent(new Event('input',{bubbles:true}))}
      syncColorChoices(id);
    });hexLabel.append(word,hex);panel.append(hexLabel);
    label.insertAdjacentElement('afterend',panel);
    input.addEventListener('input',()=>syncColorChoices(id));
    syncColorChoices(id);
  }

  function ensureWidgetConnection(){
    const section=$('#profileWidgetEditor')||$('[data-profile-editor-pane="widgets"]');if(!section)return;
    let live=$('#widgetLiveConnection',section);
    if(!live){
      live=document.createElement('div');live.id='widgetLiveConnection';live.className='widget-live-connection';live.setAttribute('role','status');live.innerHTML='<i aria-hidden="true"></i><div><strong>Live Studio preview</strong><span>Connecting to visible widgets…</span></div>';
      const intro=$('p',section);if(intro)intro.insertAdjacentElement('afterend',live);else section.prepend(live);
    }
    let opacity=$('#widgetOpacity',section),opacityLabel=opacity?.closest('label');
    if(!opacity){
      opacityLabel=document.createElement('label');opacityLabel.innerHTML='Widget opacity <span id="widgetOpacityValue">84%</span><input id="widgetOpacity" type="range" min="20" max="100" value="84" aria-label="Widget opacity">';
      opacity=$('#widgetOpacity',opacityLabel);
    }
    // The optional 20% see-through setting is real: no 72% rendering floor.
    opacity.min='20';opacity.max='100';opacity.step='1';
    opacityLabel.classList.add('widget-opacity-control');
    if(opacity.dataset.biglwaPointerDrag!=='1'){
      opacity.dataset.biglwaPointerDrag='1';
      let dragging=false,activePointer=null;
      const setFromPointer=event=>{
        if(!dragging||(activePointer!=null&&event.pointerId!=null&&event.pointerId!==activePointer))return;
        const bounds=opacity.getBoundingClientRect();if(bounds.width<=0)return;
        const fraction=Math.max(0,Math.min(1,(event.clientX-bounds.left)/bounds.width));
        const value=Math.round(20+80*fraction);
        if(Number(opacity.value)!==value){opacity.value=String(value);opacity.dispatchEvent(new Event('input',{bubbles:true}))}
        event.preventDefault();
      };
      const end=()=>{
        dragging=false;activePointer=null;
        document.removeEventListener('pointermove',setFromPointer);
        document.removeEventListener('pointerup',end);
        document.removeEventListener('pointercancel',end);
      };
      opacity.addEventListener('pointerdown',event=>{
        if(event.button!==undefined&&event.button!==0)return;
        dragging=true;activePointer=event.pointerId??null;
        document.addEventListener('pointermove',setFromPointer);
        document.addEventListener('pointerup',end);
        document.addEventListener('pointercancel',end);
        setFromPointer(event);
      });
    }
    const labelText=[...opacityLabel.childNodes].find(node=>node.nodeType===Node.TEXT_NODE&&node.textContent.trim());if(labelText)labelText.textContent='Widget opacity ';
    if(live.nextElementSibling!==opacityLabel)live.insertAdjacentElement('afterend',opacityLabel);
    if(section.dataset.biglwaAppearanceBound!=='1'){
      section.dataset.biglwaAppearanceBound='1';
      section.addEventListener('input',event=>{if(event.target.matches('#widgetColor,#widgetRadius,#widgetOpacity,#widgetBlur,#auraColor'))applyAppearance(true)});
      section.addEventListener('change',event=>{if(event.target.matches('#widgetColor,#widgetRadius,#widgetOpacity,#widgetBlur,#auraColor'))applyAppearance(true)});
      $('#resetWidgets',section)?.addEventListener('click',()=>queueMicrotask(()=>applyAppearance(true)));
    }
    // Aura hue and text now live together in Widget & Aura, not the Song pane.
    const auraInput=$('#auraColor'),auraLabel=auraInput?.closest('label');
    if(auraLabel&&auraLabel.parentElement!==section)section.appendChild(auraLabel);
    const auraText=$('#profileAuraTextInput')?.closest('label');
    if(auraText&&auraText.parentElement!==section)section.appendChild(auraText);
    installColorChoices('widgetColor',['#faf7f1','#fff7e1','#f6cad9','#d9c9f1','#b5dcd6','#23212b','#ffffff']);
    installColorChoices('auraColor',['#d85f6d','#f36b79','#f2cd39','#58aa70','#6787bf','#aa7adb','#ce8d60']);
    if(section.dataset.appearanceRestored!==activeUid()&&!$('#studioApp .profile-card.profile-is-editing')){restoreAppearance();section.dataset.appearanceRestored=activeUid()}
  }

  /* The wallpaper object store is gone: media lives on the account, not the device.
     The legacy database is cleared once so an old blob cannot linger. */
  async function purgeLegacyWallpaper(){
    if(!('indexedDB'in window))return;
    try{
      await new Promise((resolve,reject)=>{
        const request=indexedDB.open(DB_NAME,1);
        request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORE_NAME))request.result.createObjectStore(STORE_NAME,{keyPath:'id'})};
        request.onsuccess=()=>resolve(request.result);
        request.onerror=()=>reject(request.error||new Error('Could not open wallpaper storage.'));
      }).then(db=>new Promise((resolve,reject)=>{
        const tx=db.transaction(STORE_NAME,'readwrite');tx.objectStore(STORE_NAME).clear();
        tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);
      }));
    }catch{}
    try{localStorage.removeItem('biglwaWallpaper')}catch{}
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

  /* A wallpaper is now either a Cloudflare URL on the account or a short-lived local
     object URL for media that is still held for review. Nothing is persisted here. */
  function paintWallpaper(media){
    const {page,preview,video,previewVideo}=getWallpaperElements();
    if(!page||(!media?.url&&!media?.blob))return false;
    clearWallpaperDisplay();
    const url=media.blob?(activeObjectUrl=URL.createObjectURL(media.blob)):String(media.url);
    activeWallpaperSource=url;activeWallpaperKind=isVideoMedia(media)?'video':'image';
    if(isVideoMedia(media)){
      page.classList.add('biglwa-video-wallpaper');
      [video,previewVideo].forEach(el=>{el.src=url;el.style.display='block'});
      if(!matchMedia('(prefers-reduced-motion: reduce)').matches){video.play().catch(()=>{});previewVideo.play().catch(()=>{})}
    }else{
      page.classList.add('custom-image');page.style.setProperty('--page-image',`url("${url}")`);
      preview.style.backgroundImage=`url("${url}")`;preview.style.backgroundSize='cover';preview.style.backgroundPosition='center';
    }
    applyWallpaperSettings(false);
    return true;
  }

  const isVideoMedia=media=>media?.kind==='video'||/^video\//.test(String(media?.contentType||''));

  function clearWallpaperDisplay(){
    const {page,preview,video,previewVideo}=getWallpaperElements();if(!page)return;
    revokeActiveUrl();activeWallpaperSource='';activeWallpaperKind='image';
    page.classList.remove('custom-image','biglwa-video-wallpaper');page.style.removeProperty('--page-image');page.style.removeProperty('background-image');
    [video,previewVideo].forEach(media=>{media.pause();media.removeAttribute('src');media.load();media.style.display='none'});
    preview.style.removeProperty('background-image');preview.style.removeProperty('background-size');preview.style.removeProperty('background-position');
  }

  function setWallpaperPosition(value){
    const select=$('#positionSelect');if(!select)return;
    const candidate=String(value||'center');
    const valid=/^(?:center|top|left|right|bottom|(?:\d{1,3}(?:\.\d)?%\s+){1}\d{1,3}(?:\.\d)?%)$/.test(candidate)?candidate:'center';
    if(![...select.options].some(option=>option.value===valid)){
      select.querySelector('[data-custom-position]')?.remove();
      const option=document.createElement('option');option.value=valid;option.textContent='Custom alignment';option.dataset.customPosition='1';select.append(option);
    }
    select.value=valid;
  }
  function currentWallpaperSettings(){
    return {fit:$('#fitSelect')?.value||'cover',position:$('#positionSelect')?.value||'center',blur:$('#blurRange')?.value||'0',overlay:$('#overlayRange')?.value||'18'};
  }

  function applyWallpaperSettings(save=true){
    const settings=currentWallpaperSettings(),{page,preview,video,previewVideo}=getWallpaperElements();if(!page)return;
    page.style.setProperty('--page-size',settings.fit);page.style.backgroundSize=settings.fit;page.style.setProperty('--page-position',settings.position);page.style.backgroundPosition=settings.position;
    page.style.setProperty('--page-blur',`${settings.blur}px`);page.style.setProperty('--page-overlay',Number(settings.overlay)/100);
    if(preview){preview.style.backgroundSize=settings.fit;preview.style.backgroundPosition=settings.position}
    [video,previewVideo].forEach(media=>{media.style.objectFit=settings.fit;media.style.objectPosition=settings.position});
    const labels={blurValue:`${settings.blur}%`,overlayValue:`${settings.overlay}%`};Object.entries(labels).forEach(([id,value])=>{const el=$('#'+id);if(el)el.textContent=value});
    if(save)saveOwned(WALLPAPER_SETTINGS_KEY,settings)
  }

  function removeWallpaperAuraControl(){
    const input=$('#auraRange');
    if(input){const row=input.closest('label')||input.parentElement;if(row)row.remove();else input.remove()}
    const value=$('#auraValue');
    if(value){const row=value.closest('label')||value.parentElement;if(row)row.remove();else value.remove()}
    [document.documentElement,$('#studioApp')].filter(Boolean).forEach(root=>root.style.setProperty('--aura-strength','0'));
    try{localStorage.removeItem('biglwaAuraStrength');localStorage.removeItem('biglwaAuraValue')}catch{}
  }

  function restoreWallpaperSettings(){
    let settings=readOwned(WALLPAPER_SETTINGS_KEY)
    if(settings){const mapping={fitSelect:'fit',blurRange:'blur',overlayRange:'overlay'};Object.entries(mapping).forEach(([id,key])=>{const input=$('#'+id);if(input&&settings[key]!=null)input.value=settings[key]});setWallpaperPosition(settings.position)}
    applyWallpaperSettings(false);
  }

  function setSafetyStatus(state,message,badge=''){
    const status=$('#wallpaperSafetyStatus');if(status){status.dataset.state=state;status.textContent=message}
    const mark=$('#wallpaper18Badge');if(mark){mark.textContent=badge;mark.classList.toggle('is-visible',Boolean(badge))}
  }

  function wallpaperStatusCopy(media,rating){
    if(rating==='18+')return['ready','Age-verified wallpaper saved to your account.','18+ · verified'];
    if(media?.state==='held')return['pending','Held for review. This wallpaper is not shown on your public profile until a moderator approves it.','held for review'];
    if(media?.url)return['ready','Safety check passed · wallpaper saved to your account and shown on your profile.','saved to account'];
    return['idle','Choose a file to run a private, on-device safety check.',''];
  }

  /* The account doc is the source of truth, so signing in on another device restores the
     same wallpaper. Legacy device-only blobs are dropped, never migrated silently. */
  let restored=false,restoring=false;
  async function restoreWallpaper(){
    if(restored||restoring)return;restoring=true;
    const cloud=window.BIGLWAWallpaperCloud;
    try{
      if(!cloud){setSafetyStatus('idle','Choose a file to run a private, on-device safety check.');return}
      if(!await cloud.isSignedIn()){
        /* Not signed out for good: leave the guard open so the auth listener below can
           restore the wallpaper the moment the session is known. */
        restored=false;
        setSafetyStatus('idle','Sign in to load the wallpaper saved to your account.');
        return;
      }
      const media=await cloud.load();
      restored=true;
      if(media&&media.state==='approved'){
        paintWallpaper(media);
        const [state,message,badge]=wallpaperStatusCopy(media,null);
        setSafetyStatus(state,message,badge);
        return;
      }
      setSafetyStatus('idle','Choose a file to run a private, on-device safety check.');
    }catch{restored=true;clearWallpaperDisplay();setSafetyStatus('error','Your account wallpaper could not be loaded, so no custom media was shown.')}
    finally{restoring=false}
  }

  /* The session can resolve late on a cold load, or appear after a sign-in without a
     reload, so follow the auth state instead of deciding once at startup. */
  function watchAccountMedia(){
    const cloud=window.BIGLWAWallpaperCloud;
    if(!cloud||typeof cloud.onAuthStateChange!=='function')return;
    cloud.onAuthStateChange((user)=>{if(user){restored=false;restoring=false;restoreWallpaper()}});
  }

  function wallpaperReviewAlert(message){
    const uid=String(window.__biglwaIdentity?.uid||window.BigLWAAccountStorage?.uid||'');
    const item={title:'Wallpaper safety alert',source:'Wallpaper',detail:message,at:Date.now()};
    if(uid){
      const key='biglwaWallpaperLogV1:'+uid;
      try{
        const previous=JSON.parse(localStorage.getItem(key)||'[]');
        localStorage.setItem(key,JSON.stringify([item,...(Array.isArray(previous)?previous:[])].slice(0,12)));
      }catch{}
    }
    window.dispatchEvent(new CustomEvent('biglwa:studio-update',{detail:{...item,notified:false}}));
    document.dispatchEvent(new CustomEvent('biglwa:wallpaper-review-alert',{detail:item}));
  }
  async function processWallpaper(file,context,button,input){
    const safety=window.BIGLWAWallpaperSafety;
    const cloud=window.BIGLWAWallpaperCloud;
    button.disabled=true;input.disabled=true;setSafetyStatus('checking',file.type.startsWith('video/')?'Checking multiple frames from this video on your device…':'Checking this image on your device…');
    try{
      let result;
      if(safety){
        result=await safety.scan(file,{context,onProgress:(current,total)=>setSafetyStatus('checking',`Checking frame ${current} of ${total} on your device…`)});
      }else{
        const limit=file.type.startsWith('video/')?120*1024*1024:30*1024*1024;
        if(!cloud?.supported(file.type)||file.size>limit){setSafetyStatus('error',cloud?.supported(file.type)?'Keep videos under 120 MB and images under 30 MB.':'Choose a JPG, PNG, WebP, GIF, MP4, WebM, or MOV file.');return}
        result={status:'local-only',engine:'local preview fallback'};
      }
      if(result.status==='invalid'){setSafetyStatus('error',result.message||'This file could not be read safely.');return}
      if(result.status==='block'){setSafetyStatus('error','This appears to be explicit photographic media, so it cannot be used as a wallpaper.');wallpaperReviewAlert('A wallpaper upload was blocked by the safety scanner. It was not published.');return}
      let rating=result.status==='local-only'?'local-only':'general';
      if(result.status==='age-restricted'){
        setSafetyStatus('checking','Adult or uncertain context detected. Checking signed age verification…','18+ · checking');
        if(!await safety?.hasVerifiedAdultClaim?.()){setSafetyStatus('held','Held for review. A birthday entry is not enough, and secure age verification is not connected yet, so this wallpaper is not published.','18+ · held');wallpaperReviewAlert('A wallpaper was flagged for age verification and is not published.');return}
        rating='18+';
      }
      if(!cloud){setSafetyStatus('error','Account media is unavailable, so this wallpaper was not saved.');return}
      if(!await cloud.isSignedIn()){setSafetyStatus('held','Sign in to save this wallpaper to your account. Nothing was kept on this device.','not saved');return}
      setSafetyStatus('checking','Safety check passed · uploading to your account…');
      const confident=rating==='general'&&result.status===cloud.autoPublishStatus;
      const media=await cloud.upload(file,{state:confident?'approved':'pending'});
      if(confident){
        await cloud.publish(media,{approvedBy:'auto'});
        paintWallpaper(media);
        const [state,message,badge]=wallpaperStatusCopy(media,rating);
        setSafetyStatus(state,message,badge);
        document.dispatchEvent(new CustomEvent('biglwa:wallpaper-published',{detail:{username:cloud.username(),url:media.url,kind:media.kind}}));
        return;
      }
      /* Uncertain or adult-coded media is stored for a human, shown to the member, and
         never written to the public profile. */
      await cloud.review({media,verdict:result.status,context,kind:media.kind,scores:result.scores,name:file.name});
      wallpaperReviewAlert('A wallpaper was flagged or could not be verified and is waiting in the private moderation queue.');
      paintWallpaper({blob:file,kind:media.kind,contentType:media.contentType,state:'held'});
      const [state,message,badge]=wallpaperStatusCopy({state:'held'},rating);
      setSafetyStatus(state,message,badge);
    }catch(error){
      setSafetyStatus('error',error?.message||'The wallpaper could not be saved to your account.');
    }
    finally{button.disabled=false;input.disabled=false;input.value=''}
  }

  function ensureWallpaperEditor(){
    const section=$('#profileWallpaperEditor')||$('[data-profile-editor-pane="wallpaper"]');if(!section)return;
    const intro=$('p',section);    if(intro)intro.textContent='Use one continuous image, animated GIF, or video wallpaper. Media is checked on your device, then saved to your BIGLWA account so it follows you to any device and can be approved for your public profile.';
    let input=$('#wallpaperInput',section),button=$('#changeWallpaper',section);if(!input||!button)return;
    if(input.dataset.biglwaSafeMediaBound!=='1'){
      const fresh=input.cloneNode(true);fresh.dataset.biglwaSafeMediaBound='1';fresh.accept='image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,.mov';input.replaceWith(fresh);input=fresh;
    }
    if(button.dataset.biglwaSafeMediaBound!=='1'){
      const fresh=button.cloneNode(true);fresh.dataset.biglwaSafeMediaBound='1';fresh.textContent='Choose wallpaper';button.replaceWith(fresh);button=fresh;
    }
    let row=$('.wallpaper-button-row',section);
    if(!row){row=document.createElement('div');row.className='wallpaper-button-row';button.replaceWith(row);row.appendChild(button);const remove=document.createElement('button');remove.type='button';remove.id='removeWallpaper';remove.className='secondary-btn wallpaper-remove';remove.textContent='Remove';row.appendChild(remove)}
    if(!$('#adjustWallpaper',row)){
      const adjust=document.createElement('button');adjust.type='button';adjust.id='adjustWallpaper';adjust.className='secondary-btn wallpaper-adjust';adjust.textContent='Adjust';
      const remove=$('#removeWallpaper',row);if(remove)row.insertBefore(adjust,remove);else row.append(adjust);
    }
    // Fit and preset positions are still available inside Adjust; do not clutter the main editor.
    for(const id of ['fitSelect','positionSelect'])$('#'+id,section)?.closest('label')?.classList.add('wallpaper-position-native');
    const adjust=$('#adjustWallpaper',row);
    if(adjust&&adjust.dataset.biglwaAdjustBound!=='1'){
      adjust.dataset.biglwaAdjustBound='1';adjust.addEventListener('click',()=>{
        const editor=window.BIGLWAMediaAdjust;if(!editor){setSafetyStatus('error','Picture alignment controls have not loaded. Reload Studio to try again.');return}
        const elements=getWallpaperElements();
        const src=activeWallpaperSource||elements.previewVideo?.currentSrc||elements.previewVideo?.src||'';
        if(!src){setSafetyStatus('idle','Choose a wallpaper before adjusting it.');return}
        const settings=currentWallpaperSettings();
        editor.open({type:'wallpaper',url:src,video:activeWallpaperKind==='video',fit:settings.fit,position:settings.position,
          onSave:async changes=>{
            const fit=$('#fitSelect');if(fit)fit.value=changes.fit;
            setWallpaperPosition(changes.position);applyWallpaperSettings(true);
            // Keep the authenticated account and approved public preview aligned, not just this device.
            if(window.BigLWAUserDirectory?.saveCustomizations){
              const ok=await window.BigLWAUserDirectory.saveCustomizations({wallpaper:currentWallpaperSettings()});
              if(ok===false)throw Error('Your wallpaper position could not sync. Try Save changes.');
            }
          }});
      });
    }
    if(!$('#wallpaperMediaContext',section)){
      const context=document.createElement('label');context.className='wallpaper-media-context';context.innerHTML='Media context<select id="wallpaperMediaContext"><option value="photo">Photo or video</option><option value="art">Artwork or illustration</option><option value="mixed">Mixed or other</option></select>';row.insertAdjacentElement('afterend',context);
      const note=document.createElement('p');note.className='wallpaper-safety-note';note.textContent='Artwork is reviewed in context, not automatically blocked. Likely explicit photographic nudity is blocked. A confident clean scan publishes straight to your account. Uncertain or adult-coded media is uploaded for a moderator and stays off your public profile until approved.';context.insertAdjacentElement('afterend',note);
      const badge=document.createElement('span');badge.id='wallpaper18Badge';badge.className='wallpaper-18-badge';note.insertAdjacentElement('afterend',badge);
      const status=document.createElement('p');status.id='wallpaperSafetyStatus';status.className='wallpaper-safety-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');badge.insertAdjacentElement('afterend',status);
    }
    if(section.dataset.biglwaSafeMediaBound!=='1'){
      section.dataset.biglwaSafeMediaBound='1';
      button.addEventListener('click',event=>{event.preventDefault();input.click()});
      input.addEventListener('change',()=>{const file=input.files?.[0];if(file)processWallpaper(file,$('#wallpaperMediaContext',section)?.value||'mixed',button,input)});
      $('#removeWallpaper',section)?.addEventListener('click',async()=>{
        try{await window.BIGLWAWallpaperCloud?.removeWallpaper();clearWallpaperDisplay();setSafetyStatus('idle','Custom wallpaper removed from your account. Choose a file to run a new safety check.')}
        catch{setSafetyStatus('error','The wallpaper could not be removed from your account.')}
      });
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
    const title=$('.panel-title strong',panel);if(title)title.textContent=key==='picture'?'Edit profile picture':key==='widgets'?'Edit Widget & Aura':key==='wallpaper'?'Edit wallpaper':key==='media'?'Edit song':'Edit profile';
    const save=$('#saveProfileBtn',panel);if(save)save.textContent='Save changes';
  }

  function bindEditorState(){
    const panel=$('#wallpaperPanel'),tabs=$('#profileEditorTabs'),card=$('#studioApp .profile-card');if(!panel||!tabs||!card)return;
    if(tabs.dataset.biglwaLiveStateBound!=='1'){tabs.dataset.biglwaLiveStateBound='1';tabs.addEventListener('click',()=>queueMicrotask(syncEditorState));new MutationObserver(syncEditorState).observe(tabs,{attributes:true,subtree:true,attributeFilter:['aria-selected']})}
    if(card.dataset.biglwaLiveStateBound!=='1'){card.dataset.biglwaLiveStateBound='1';new MutationObserver(syncEditorState).observe(card,{attributes:true,attributeFilter:['class']})}
    syncEditorState();
  }

  window.BIGLWAStudioAppearance={
    save(){applyAppearance(true);applyWallpaperSettings(true);return true},
    apply(values={}){
      if($('#studioApp .profile-card.profile-is-editing'))return;
      try{
        if(values&&typeof values.appearance==='object'){
          const ap=values.appearance;
          const colorInput=$('#widgetColor');if(colorInput&&ap.color!=null)colorInput.value=ap.color;
          const radiusInput=$('#widgetRadius');if(radiusInput&&ap.radius!=null)radiusInput.value=String(ap.radius);
          const opacityInput=$('#widgetOpacity');if(opacityInput&&ap.opacity!=null)opacityInput.value=String(ap.opacity);
          const blurInput=$('#widgetBlur');if(blurInput&&ap.blur!=null)blurInput.value=String(ap.blur);
          const auraInput=$('#auraColor');if(auraInput&&ap.aura!=null)auraInput.value=ap.aura;
        }
        if(values&&typeof values.wallpaper==='object'){
          const ws=values.wallpaper;
          const fit=$('#fitSelect');if(fit&&ws.fit!=null)fit.value=ws.fit;
          if(ws.position!=null)setWallpaperPosition(ws.position);
          const blur=$('#blurRange');if(blur&&ws.blur!=null)blur.value=Number(ws.blur);
          const over=$('#overlayRange');if(over&&ws.overlay!=null)over.value=Number(ws.overlay);
        }
      }catch{}
      applyAppearance(false);applyWallpaperSettings(false);
      /* A signed-out preview passes the approved public media URL straight through. */
      if(values&&values.media&&values.media.url)paintWallpaper(values.media);
      try{applyAppearance(true);applyWallpaperSettings(true)}catch{}
    },
    media:paintWallpaper,
    clearMedia(){clearWallpaperDisplay()}
  };

  function run(){ensureStyles();ensureWidgetConnection();ensureWallpaperEditor();removeWallpaperAuraControl();bindEditorState()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
  purgeLegacyWallpaper();
  /* The cloud module is a separate script, so give it a moment before deciding the
     account has no wallpaper. */
  (async()=>{for(let i=0;i<40&&!window.BIGLWAWallpaperCloud;i++)await new Promise(r=>setTimeout(r,100));restored=false;restoreWallpaper();watchAccountMedia()})();
  window.addEventListener('load',()=>setTimeout(run,0),{once:true});
  window.addEventListener('pagehide',revokeActiveUrl,{once:true});
  setTimeout(run,220);
})();
