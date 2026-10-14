/* Big LWA Avatar Studio: account-backed snapshot/skin and a licensed Unity-WebGL extension slot.
   Do not bundle the proprietary IMVUnity Unity package here. */
(()=>{
  if(window.__biglwaAvatarStudioV1)return;
  window.__biglwaAvatarStudioV1=true;
  const API='https://biglwa-instagram-api.leianmulatre-284.workers.dev';
  const state={loadedUid:'',skinViewer:null,skinLibrary:null,avatar:null,busy:false,layout:null};
  const one=(selector,root=document)=>root.querySelector(selector);
  const current=()=>window.__biglwaIdentity?.uid||'';
  let firebasePromise=null;
  async function firebase(){
    if(!firebasePromise)firebasePromise=Promise.all([
      import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js')
    ]).then(([appMod,authMod,store])=>{
      const app=appMod.getApps()[0];
      if(!app)throw Error('BIGLWA account is still loading.');
      return {auth:authMod.getAuth(app),db:store.getFirestore(app),...store};
    });
    return firebasePromise;
  }
  const setStatus=(message)=>{const el=one('#biglwaAvatarStatus');if(el)el.textContent=message};
  function disposeViewer(){try{state.skinViewer?.dispose()}catch{}state.skinViewer=null;}
  function mediaNode(){
    return one('#biglwaAvatarMedia');
  }
  function showAvatar(){
    const view=mediaNode();if(!view)return;
    disposeViewer();
    view.replaceChildren();
    const a=state.avatar;
    if(!a?.url){view.innerHTML='<div class="biglwa-avatar-empty" aria-hidden="true">◉<span>your character</span></div>';return;}
    if(a.type==='minecraft'){
      const canvas=document.createElement('canvas');canvas.width=220;canvas.height=260;view.append(canvas);
      const render=()=>{
        if(!window.skinview3d?.SkinViewer){showImageFallback(view,a.url);setStatus('3D preview unavailable. Your saved Minecraft skin is still ready.');return;}
        try{
          const viewer=new window.skinview3d.SkinViewer({canvas,width:220,height:260,skin:a.url,zoom:0.8});
          viewer.autoRotate=true;
          if(window.skinview3d.IdleAnimation)viewer.animation=new window.skinview3d.IdleAnimation();
          state.skinViewer=viewer;
        }catch(error){showImageFallback(view,a.url);setStatus(error?.message||'3D preview not available on this device.');}
      };
      if(window.skinview3d?.SkinViewer){render();return;}
      if(!state.skinLibrary){
        state.skinLibrary=new Promise((resolve,reject)=>{
          const script=document.createElement('script');
          script.src='https://cdn.jsdelivr.net/npm/skinview3d@3.4.2/bundles/skinview3d.bundle.min.js';
          script.async=true;script.onload=resolve;script.onerror=()=>reject(Error('Could not load the Minecraft preview engine.'));
          document.head.append(script);
        }).catch(error=>{state.skinLibrary=null;throw error});
      }
      state.skinLibrary.then(()=>{if(mediaNode()===view&&state.avatar?.url===a.url)render()}).catch(()=>{if(mediaNode()===view)showImageFallback(view,a.url)});
    }else showImageFallback(view,a.url);
  }
  function showImageFallback(view,url){
    disposeViewer();view.replaceChildren();
    const image=new Image();image.src=url;image.alt='Saved avatar image';image.loading='lazy';
    image.onerror=()=>{view.textContent='Stored avatar image could not be loaded.'};
    view.append(image);
  }
  function render(){
    const card=one('#studioAvatarCard');if(!card)return;
    card.innerHTML='<div class="biglwa-avatar-head"><h2 class="card-kicker">Avatar</h2>'+
      '<div class="widget-window-controls avatar-window-controls" role="group" aria-label="Avatar widget controls">'+
        '<button type="button" class="window-light red" data-avatar-widget-action="remove" aria-label="Remove Avatar widget" title="Remove Avatar widget"></button>'+
        '<button type="button" class="window-light yellow" data-avatar-widget-action="archive" aria-label="Archive Avatar widget" title="Archive Avatar widget"></button>'+
        '<button type="button" class="window-light green" data-avatar-widget-action="expand" aria-label="Enlarge Avatar widget" title="Enlarge Avatar widget"></button></div></div>'+
      '<button type="button" class="widget-drag-handle avatar-drag-handle" data-studio-drag-handle aria-label="Move Aura and Avatar widgets" title="Drag to move the Aura / Avatar pair">'+
        '<svg viewBox="0 0 12 12" aria-hidden="true"><circle cx="3" cy="3" r="1" fill="currentColor"/><circle cx="9" cy="3" r="1" fill="currentColor"/><circle cx="3" cy="9" r="1" fill="currentColor"/><circle cx="9" cy="9" r="1" fill="currentColor"/></svg></button>'+
      '<div class="biglwa-avatar-media" id="biglwaAvatarMedia" aria-label="Avatar preview"></div>'+
      '<div class="biglwa-avatar-actions" role="group" aria-label="Avatar sources">'+
        '<button type="button" data-avatar-source="minecraft">Minecraft</button>'+
        '<button type="button" data-avatar-source="mii">Mii editor</button>'+
        '<button type="button" data-avatar-source="imvu">IMVU / Unity</button></div>'+
      '<div class="biglwa-avatar-source" id="biglwaAvatarSource"></div>'+
      '<small id="biglwaAvatarStatus" role="status">Choose a character source above.</small>';
    showAvatar();
  }
  function source(name){
    const mount=one('#biglwaAvatarSource');if(!mount)return;
    const input='<label class="biglwa-avatar-upload">Import image<input type="file" data-avatar-import accept="image/png,image/jpeg,image/webp" hidden></label>';
    if(name==='minecraft'){
      mount.innerHTML='<p>Upload a Minecraft skin texture (64 × 64 or 64 × 32) for a 3D preview.</p>'+
        '<label class="biglwa-avatar-upload">Import Minecraft skin<input type="file" data-avatar-import data-avatar-kind="minecraft" accept="image/png" hidden></label>';
    }else if(name==='mii'){
      mount.innerHTML='<p>Build and save a Mii-inspired avatar right here on BIG LWA.</p>'+
        '<iframe id="biglwaMiiEditorFrame" title="Big LWA on-site character maker" loading="lazy" src="/avatar/mii-editor.html?v=20261014-mii-maker-1" allow="clipboard-write"></iframe>'+input;
    }else{
      mount.innerHTML='<p>Import an IMVU avatar snapshot now. Live IMVU models need an authorized Unity WebGL export; a .unitypackage is not directly browser-runnable.</p>'+input+
        '<button type="button" data-avatar-unity-open>Open installed Unity scene</button>';
    }
    mount.dataset.kind=name;
    cardStatus(name);
  }
  function cardStatus(name){
    setStatus(name==='mii'?'Edit below, then choose Save to Big LWA.':name==='minecraft'?'Choose a skin PNG to import.':'IMVU snapshot import is available; Unity scene needs a WebGL build.');
  }
  async function verifySkin(file){
    if(file.type!=='image/png')throw Error('Minecraft skins must be PNG files.');
    const url=URL.createObjectURL(file);
    try{
      const img=await new Promise((resolve,reject)=>{
        const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('Cannot read skin PNG.'));image.src=url;
      });
      if(!((img.naturalWidth===64&&[32,64].includes(img.naturalHeight))||
        (img.naturalWidth===128&&[64,128].includes(img.naturalHeight))))
          throw Error('Use a Minecraft skin texture (64×64, 64×32 or HD 128px equivalent).');
    }finally{URL.revokeObjectURL(url)}
  }
  async function save(file,kind){
    if(state.busy)return;
    if(!['minecraft','mii','imvu'].includes(kind))throw Error('Choose an avatar source first.');
    if(!['image/png','image/jpeg','image/webp'].includes(file?.type))throw Error('Choose PNG, JPG, or WebP.');
    if(file.size>8*1024*1024)throw Error('Image must be 8 MB or less.');
    if(kind==='minecraft')await verifySkin(file);
    state.busy=true;setStatus('Uploading your avatar to your BIGLWA account…');
    try{
      const f=await firebase();await f.auth.authStateReady();
      const user=f.auth.currentUser;
      if(!user)throw Error('Sign in to BIGLWA to save your avatar.');
      const uid=user.uid,token=await user.getIdToken();
      const response=await fetch(API+'/media/profile-photo',{
        method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':file.type},body:file
      });
      const result=await response.json().catch(()=>({}));
      if(!response.ok||!result.url)throw Error(result.error||'Avatar image could not be uploaded.');
      await f.setDoc(f.doc(f.db,'users',uid),{
        studioAvatar:{type:kind,url:result.url,updatedAt:f.serverTimestamp()}
      },{mergeFields:['studioAvatar']});
      if(f.auth.currentUser?.uid!==uid)throw Error('Account switched before avatar was saved.');
      state.avatar={type:kind,url:result.url};
      showAvatar();setStatus('Avatar saved to your BIGLWA account.');
      window.dispatchEvent(new CustomEvent('biglwa:avatar-updated',{detail:{type:kind}}));
      return true;
    }catch(error){setStatus(error?.message||'Avatar could not be saved.');return false;}
    finally{state.busy=false;}
  }
  async function restore(){
    try{
      const f=await firebase();await f.auth.authStateReady();
      const user=f.auth.currentUser;if(!user){state.loadedUid='';state.avatar=null;showAvatar();return;}
      if(state.loadedUid===user.uid)return;
      state.loadedUid=user.uid;
      const snap=await f.getDoc(f.doc(f.db,'users',user.uid));
      if(state.loadedUid!==user.uid)return;
      const avatar=snap.data()?.studioAvatar;
      if(avatar?.url&&['minecraft','mii','imvu'].includes(avatar.type)&&(avatar.url.startsWith(API+'/media/profile-photo/')||avatar.url.startsWith(API+'/media/feed-image/'))){
        state.avatar={type:avatar.type,url:avatar.url};
        showAvatar();setStatus('Saved avatar restored from your account.');
      }
    }catch(error){setStatus('Could not load account avatar: '+(error?.message||'Please try again.'))}
  }
  const VISIBILITY_PREFIX='biglwaAvatarWidgetVisibility:v2:';
  let appearanceUid=null;
  function readVisibility(){
    const uid=current()||'guest';
    if(appearanceUid===uid)return;
    appearanceUid=uid;
    try{state.visibility=localStorage.getItem(VISIBILITY_PREFIX+uid)||'shown'}catch{state.visibility='shown'}
  }
  function setVisibility(next){
    readVisibility();state.visibility=next;
    try{localStorage.setItem(VISIBILITY_PREFIX+appearanceUid,next)}catch{}
    const card=one('#studioAvatarCard');if(card)card.classList.remove('avatar-is-expanded');
    position();
  }
  function position(){
    const app=one('#studioApp'),rail=one('#studioApp #heroWidgetRail')||one('#studioApp .hero-widget-rail');
    const aura=one('#studioApp .aura-card'),card=one('#studioAvatarCard');
    if(!app||!rail||!aura||!card)return;
    readVisibility();
    let pair=one('#biglwaAuraAvatarPair');
    if(!pair){
      pair=document.createElement('div');
      pair.id='biglwaAuraAvatarPair';
      pair.className='biglwa-aura-avatar-pair';
      pair.dataset.widgetId='aura-avatar-pair';
      pair.dataset.widgetLabel='Aura and Avatar';
      rail.insertBefore(pair,aura.parentElement===rail?aura:rail.firstChild);
      // Honor the existing Studio drag order, even though this paired slot is
      // created after the main widget rail has restored its own children.
      try{
        const order=JSON.parse(localStorage.getItem('biglwaWidgetOrderV2')||'{}')[rail.id];
        if(Array.isArray(order)&&order.includes('aura-avatar-pair')){
          const after=order.slice(order.indexOf('aura-avatar-pair')+1)
            .map(id=>[...rail.children].find(el=>el.dataset?.widgetId===id)).find(Boolean);
          if(after)rail.insertBefore(pair,after);else rail.append(pair);
        }
      }catch{}
    }
    if(pair.parentElement!==rail)rail.appendChild(pair);
    if(aura.parentElement!==pair)pair.prepend(aura);
    if(card.parentElement!==pair)pair.appendChild(card);
    // The old absolute positioning caused overlap with the stereo and navigation.
    // Use real CSS grid tracks: two equal halves in one original Aura slot.
    if(card.style.position||card.style.left||card.style.width||card.style.top)card.removeAttribute('style');
    if(aura.style.getPropertyValue('width'))aura.style.removeProperty('width');
    const avatarHidden=state.visibility!=='shown';
    const auraHidden=aura.classList.contains('widget-is-minimized')||aura.classList.contains('widget-is-docked')||aura.hidden;
    card.hidden=avatarHidden;
    pair.classList.toggle('is-avatar-hidden',avatarHidden);
    pair.classList.toggle('is-aura-hidden',Boolean(auraHidden));
    pair.classList.toggle('are-both-hidden',avatarHidden&&Boolean(auraHidden));
    let restore=one('[data-avatar-restore]',aura);
    if(!restore){
      restore=document.createElement('button');
      restore.type='button';restore.dataset.avatarRestore='1';restore.className='biglwa-avatar-restore';
      restore.textContent='Restore Avatar +';
      aura.append(restore);
    }
    restore.hidden=!avatarHidden;
    // Honor the member's Aura palette and theme rather than hardcoding beige.
    const colors=getComputedStyle(aura);
    const tokens={
      '--avatar-panel-bg':colors.backgroundColor,
      '--avatar-panel-image':colors.backgroundImage,
      '--avatar-panel-blur':colors.backdropFilter||'none',
      '--avatar-panel-ink':colors.color,
      '--avatar-panel-radius':colors.borderRadius,
      '--avatar-panel-border':colors.borderColor,
      '--avatar-panel-shadow':colors.boxShadow
    };
    for(const [key,val] of Object.entries(tokens))if(val&&card.style.getPropertyValue(key)!==val)card.style.setProperty(key,val);
  }
  function mount(){
    const rail=one('#studioApp #heroWidgetRail')||one('#studioApp .hero-widget-rail');
    const aura=one('#studioApp .aura-card');
    if(!rail||!aura)return false;
    if(!one('#studioAvatarCard')){
      const card=document.createElement('section');card.id='studioAvatarCard';
      card.className='biglwa-avatar-card';card.setAttribute('aria-label','Avatar Studio widget');
      card.dataset.search='avatar mii minecraft imvu character';
      rail.append(card);render();restore();
    }
    position();return true;
  }
  document.addEventListener('click',async e=>{
    if(e.target.closest('[data-avatar-restore]')){e.preventDefault();setVisibility('shown');return;}
    const origin=e.target.closest('#studioAvatarCard');if(!origin)return;
    const control=e.target.closest('[data-avatar-widget-action]');
    if(control){
      e.preventDefault();
      if(control.dataset.avatarWidgetAction==='expand'){
        const active=origin.classList.toggle('avatar-is-expanded');
        control.setAttribute('aria-pressed',String(active));
        control.title=active?'Return Avatar to Studio':'Enlarge Avatar widget';
      }else if(control.dataset.avatarWidgetAction==='archive')setVisibility('archived');
      else if(confirm('Remove the Avatar widget from Studio? Your saved character stays in your BIG LWA account and can be restored.'))setVisibility('removed');
      return;
    }
    const sourceButton=e.target.closest('[data-avatar-source]');
    if(sourceButton){source(sourceButton.dataset.avatarSource);return}
    if(e.target.closest('[data-avatar-unity-open]')){
      const sourceArea=one('#biglwaAvatarSource');if(!sourceArea)return;
      try{
        const resp=await fetch('/avatar/unity/index.html',{cache:'no-store'});
        const manifest=resp.ok?await resp.text():'';
        if(resp.ok&&/(createUnityInstance|UnityLoader)/.test(manifest)){const frame=document.createElement('iframe');frame.title='Licensed Unity WebGL avatar scene';
          frame.sandbox='allow-scripts allow-same-origin';frame.src='/avatar/unity/index.html';
          frame.style.cssText='width:100%;height:300px;border:0;border-radius:10px';
          frame.dataset.biglwaUnityFrame='1';sourceArea.replaceChildren(frame);
          setStatus('Unity WebGL build detected. The avatar scene can communicate with BIGLWA through the approved bridge.');
        }else setStatus('No licensed Unity WebGL export is installed yet.');
      }catch{setStatus('Unity WebGL build is not installed yet.')}
    }
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape')one('#studioAvatarCard')?.classList.remove('avatar-is-expanded');
  });
  // A licensed WebGL build gets the stored image URL, never a member's access token.
  window.addEventListener('message',async event=>{
    if(event.origin!==location.origin)return;
    if(event.data?.type==='biglwa:mii-created'){
      const frame=one('#biglwaMiiEditorFrame');
      if(!frame||event.source!==frame.contentWindow)return;
      let ok=false;
      try{
        const png=event.data.image;
        if(typeof png!=='string'||!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(png)||png.length>1100000)throw Error('Character export is too large or invalid.');
        const response=await fetch(png);
        const blob=await response.blob();
        ok=Boolean(await save(new File([blob],'biglwa-mii-avatar.png',{type:'image/png'}),'mii'));
      }catch(error){setStatus(error?.message||'Could not save this character.');}
      frame.contentWindow?.postMessage({type:'biglwa:mii-save-result',message:ok?'Character saved to your BIG LWA account.':'Saving failed. Check the Avatar status and try again.'},location.origin);
      return;
    }
    if(event.data?.type!=='biglwa:unity-ready')return;
    const frame=one('#studioAvatarCard [data-biglwa-unity-frame]');
    if(!frame||event.source!==frame.contentWindow)return;
    frame.contentWindow.postMessage({
      type:'biglwa:avatar-context',
      avatar:state.avatar?{type:state.avatar.type,url:state.avatar.url}:null
    },location.origin);
    setStatus('Unity scene connected. Live IMVU avatars still require an approved integration.');
  });
  document.addEventListener('change',async e=>{
    const file=e.target.closest('#studioAvatarCard [data-avatar-import]');
    if(!file?.files?.length)return;
    await save(file.files[0],file.dataset.avatarKind||one('#biglwaAvatarSource')?.dataset.kind||'mii');
    file.value='';
  });
  let started=false;
  function start(){
    if(started)return;started=true;
    let queued=false;
    let auraObserved=null;
    const colorWatch=new MutationObserver(()=>requestAnimationFrame(position));
    const watchAura=()=>{const aura=one('#studioApp .aura-card');if(aura&&aura!==auraObserved){colorWatch.disconnect();auraObserved=aura;colorWatch.observe(aura,{attributes:true,attributeFilter:['class','style','hidden']});}};
    const obs=new MutationObserver(()=>{
      watchAura();
      if(queued)return;
      queued=true;requestAnimationFrame(()=>{queued=false;mount();});
    });
    obs.observe(document.body,{subtree:true,childList:true});
    let count=0;const timer=setInterval(()=>{mount();if(++count>60)clearInterval(timer)},600);
    window.addEventListener('resize',()=>requestAnimationFrame(position));
    window.addEventListener('pageshow',mount);
    window.addEventListener('biglwa:identity-updated',()=>{appearanceUid=null;state.loadedUid='';restore();mount()});
    mount();watchAura();
  }
  const style=document.createElement('style');style.id='biglwaAvatarLayoutV3';style.textContent=`
#studioApp .hero-widget-rail>.biglwa-aura-avatar-pair{
  position:relative!important;display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;
  gap:10px!important;align-items:stretch!important;align-content:start!important;
  width:100%!important;min-width:0!important;max-width:100%!important;
  margin:0!important;padding:0!important;box-sizing:border-box!important;overflow:visible!important;
}
#studioApp .hero-widget-rail>.biglwa-aura-avatar-pair:is(.is-avatar-hidden,.is-aura-hidden){
  grid-template-columns:minmax(0,1fr)!important;
}
#studioApp .hero-widget-rail>.biglwa-aura-avatar-pair.are-both-hidden{display:none!important}
#studioApp .hero-widget-rail>.biglwa-aura-avatar-pair>.aura-card{
  position:relative!important;inset:auto!important;grid-column:auto!important;grid-row:auto!important;
  width:100%!important;min-width:0!important;max-width:none!important;
  height:100%!important;min-height:236px!important;max-height:none!important;
  margin:0!important;padding:14px 12px!important;box-sizing:border-box!important;
  overflow:hidden!important;
}
#studioApp .hero-widget-rail>.biglwa-aura-avatar-pair>.aura-card.widget-is-minimized,
#studioApp .hero-widget-rail>.biglwa-aura-avatar-pair>.aura-card.widget-is-docked{display:none!important}
#studioApp .hero-widget-rail>.biglwa-aura-avatar-pair>.aura-card .card-kicker{
  margin-right:50px!important;max-width:calc(100% - 54px)!important;
}
#studioApp .hero-widget-rail>.biglwa-aura-avatar-pair>.aura-card .aura-orb{
  width:min(74px,35%)!important;height:auto!important;aspect-ratio:1!important;
  min-width:58px!important;margin:8px auto!important;
}
#studioApp .hero-widget-rail>.biglwa-aura-avatar-pair>.aura-card p{
  font-size:clamp(12px,1vw,16px)!important;overflow-wrap:anywhere!important;
}
#studioApp #studioAvatarCard{
  position:relative!important;inset:auto!important;grid-column:auto!important;grid-row:auto!important;
  z-index:6!important;box-sizing:border-box!important;display:flex!important;flex-direction:column!important;
  gap:8px!important;width:100%!important;min-width:0!important;max-width:none!important;
  height:100%!important;min-height:236px!important;max-height:none!important;
  margin:0!important;padding:14px 12px!important;overflow:visible!important;
  border:1px solid var(--avatar-panel-border,rgba(100,80,70,.2))!important;
  border-radius:var(--avatar-panel-radius,var(--widget-radius,18px))!important;
  background:var(--avatar-panel-bg,var(--widget-bg,rgba(250,247,241,.9)))!important;
  background-image:var(--avatar-panel-image,none)!important;
  backdrop-filter:var(--avatar-panel-blur,none)!important;
  color:var(--avatar-panel-ink,var(--widget-ink,#302725))!important;
  box-shadow:var(--avatar-panel-shadow,0 10px 22px rgba(76,52,51,.13))!important;
}
#studioApp #studioAvatarCard[hidden]{display:none!important}
#studioApp #studioAvatarCard .biglwa-avatar-head{display:block!important;position:relative!important;min-height:29px!important;margin:0 0 3px!important}
#studioApp #studioAvatarCard .biglwa-avatar-head .card-kicker{
  font:400 clamp(16px,1.5vw,24px)/1.1 Georgia,'Times New Roman',serif!important;
  text-transform:none!important;letter-spacing:0!important;margin:0!important;
  padding:0 64px 0 0!important;color:inherit!important;max-width:100%!important
}
#studioApp #studioAvatarCard .avatar-window-controls{
  position:absolute!important;right:0!important;top:1px!important;left:auto!important;bottom:auto!important;
  z-index:15!important;display:flex!important;flex-direction:row!important;gap:5px!important;
  visibility:visible!important;opacity:1!important;pointer-events:auto!important;
  width:auto!important;height:auto!important;padding:0!important;background:transparent!important;
}
#studioApp #studioAvatarCard .avatar-window-controls button.window-light{
  display:block!important;flex:0 0 10px!important;width:10px!important;height:10px!important;
  min-height:10px!important;min-width:10px!important;padding:0!important;border-radius:50%!important;
  border:1px solid rgba(0,0,0,.17)!important;
}
#studioApp #studioAvatarCard .avatar-window-controls .red{background:#df5b56!important}
#studioApp #studioAvatarCard .avatar-window-controls .yellow{background:#e5bd45!important}
#studioApp #studioAvatarCard .avatar-window-controls .green{background:#58a36d!important}
#studioApp #studioAvatarCard .avatar-drag-handle{
  position:absolute!important;top:13px!important;left:50%!important;right:auto!important;
  transform:translateX(-50%)!important;display:grid!important;place-items:center!important;
  z-index:16!important;width:23px!important;height:18px!important;min-height:18px!important;
  padding:0!important;margin:0!important;border:0!important;border-radius:6px!important;
  background:rgba(55,47,43,.09)!important;color:inherit!important;
  cursor:grab!important;touch-action:none!important;
}
#studioApp #studioAvatarCard .avatar-drag-handle svg{height:12px;width:12px}
#studioApp #studioAvatarCard .biglwa-avatar-media{
  position:relative!important;min-height:80px!important;flex:1 0 86px!important;
  max-height:160px!important;overflow:hidden!important;
  border:1px solid rgba(90,70,60,.2)!important;border-radius:12px!important;
  background:rgba(255,255,255,.13)!important;display:grid!important;place-items:center!important;
}
#studioApp #studioAvatarCard .biglwa-avatar-media canvas{max-width:100%!important;max-height:142px!important}
#studioApp #studioAvatarCard .biglwa-avatar-media>img{display:block!important;max-width:100%!important;max-height:142px!important;object-fit:contain!important}
#studioApp #studioAvatarCard .biglwa-avatar-empty{display:grid;gap:4px;place-items:center;color:var(--avatar-panel-ink,#85767a);opacity:.65;font:34px Georgia,serif}
#studioApp #studioAvatarCard .biglwa-avatar-empty span{font:650 10px system-ui}
#studioApp #studioAvatarCard .biglwa-avatar-actions{
  display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;
  gap:5px!important;margin:2px 0!important;min-width:0!important
}
#studioApp #studioAvatarCard .biglwa-avatar-actions button{
  width:100%!important;min-width:0!important;max-width:none!important;min-height:31px!important;
  padding:5px 3px!important;font:700 10px/1.2 system-ui!important;
  border:1px solid rgba(100,80,70,.22)!important;border-radius:8px!important;
  background:rgba(255,255,255,.38)!important;color:inherit!important;white-space:normal!important;
  cursor:pointer!important;overflow-wrap:anywhere!important;
}
#studioApp #studioAvatarCard .biglwa-avatar-source{
  display:grid!important;gap:6px!important;min-width:0!important;
  font:11px/1.35 system-ui!important;overflow-wrap:anywhere!important;
}
#studioApp #studioAvatarCard .biglwa-avatar-source p{margin:0!important}
#studioApp #studioAvatarCard .biglwa-avatar-source :is(button,a,.biglwa-avatar-upload){
  display:block;box-sizing:border-box;width:100%;min-width:0;padding:8px!important;
  border:1px solid rgba(100,80,70,.25)!important;border-radius:8px!important;
  background:rgba(255,255,255,.42)!important;color:inherit!important;text-align:center!important;
  text-decoration:none!important;cursor:pointer!important;
}
#studioApp #studioAvatarCard .biglwa-avatar-upload{display:flex!important;align-items:center!important;justify-content:center!important}
#studioApp #studioAvatarCard #biglwaMiiEditorFrame{
  display:block!important;width:100%!important;min-height:520px!important;height:520px!important;
  border:1px solid rgba(100,80,70,.22)!important;border-radius:10px!important;background:rgba(255,255,255,.2)!important;
}
#studioApp #studioAvatarCard #biglwaAvatarStatus{display:block!important;min-width:0!important;font:10px/1.4 system-ui!important;opacity:.8}
#studioApp .biglwa-avatar-restore{
  position:absolute!important;right:9px!important;bottom:8px!important;z-index:12!important;
  width:auto!important;min-height:24px!important;padding:4px 8px!important;
  font:700 10px/1 system-ui!important;border:1px solid rgba(80,70,65,.3)!important;
  border-radius:99px!important;background:rgba(255,255,255,.6)!important;color:inherit!important;cursor:pointer!important
}
#studioApp .biglwa-avatar-restore[hidden]{display:none!important}
#studioApp #studioAvatarCard.avatar-is-expanded{
  position:fixed!important;left:7vw!important;top:5vh!important;right:7vw!important;bottom:5vh!important;
  width:86vw!important;max-width:none!important;height:90vh!important;max-height:90vh!important;
  min-height:0!important;z-index:10020!important;overflow:auto!important;padding:24px!important;
  border:1px solid var(--avatar-panel-border,#c9b9ad)!important;
  box-shadow:0 0 0 100vmax rgba(22,16,18,.63),0 22px 70px rgba(0,0,0,.32)!important;
}
#studioApp #studioAvatarCard.avatar-is-expanded .biglwa-avatar-media{flex:0 0 180px!important;max-height:240px!important}
#studioApp #studioAvatarCard.avatar-is-expanded .biglwa-avatar-actions{max-width:480px!important}
#studioApp #studioAvatarCard.avatar-is-expanded #biglwaMiiEditorFrame{min-height:580px!important;height:580px!important}
@media(max-width:620px){
  #studioApp .hero-widget-rail>.biglwa-aura-avatar-pair{grid-template-columns:minmax(0,1fr)!important}
  #studioApp .hero-widget-rail>.biglwa-aura-avatar-pair>.aura-card{min-height:170px!important}
  #studioApp #studioAvatarCard{min-height:215px!important}
}
`;
  document.head.append(style);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
