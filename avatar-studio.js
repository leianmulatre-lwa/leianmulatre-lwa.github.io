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
  const setStatus=message=>{for(const id of ['#biglwaAvatarStatus','#biglwaAvatarCompactStatus']){const el=one(id);if(el)el.textContent=message;}};
  function disposeViewer(root){
    if(!root)return;
    try{root._biglwaMinecraftModel?.dispose()}catch{}
    root._biglwaMinecraftModel=null;
  }
  let mannequinPromise=null;
  function loadMannequin(){
    if(window.BigLWAMinecraftViewer)return Promise.resolve(window.BigLWAMinecraftViewer);
    if(!mannequinPromise){
      mannequinPromise=new Promise((resolve,reject)=>{
        const script=document.createElement('script');
        script.src='/avatar/minecraft-mannequin.js?v=20261014-model-4';
        script.async=true;
        script.onload=()=>window.BigLWAMinecraftViewer?resolve(window.BigLWAMinecraftViewer):reject(Error('Minecraft model script loaded without the viewer.'));
        script.onerror=()=>reject(Error('Minecraft model could not load from BIG LWA.'));
        document.head.append(script);
      }).catch(error=>{mannequinPromise=null;throw error});
    }
    return mannequinPromise;
  }
  async function renderMinecraftModel(root,skin,large=false){
    if(!root)return false;
    const key=(skin||'default')+':'+(large?'large':'small');
    if(root.dataset.minecraftSkin===key&&root._biglwaMinecraftModel)return true;
    disposeViewer(root);
    root.dataset.minecraftSkin=key;
    root.replaceChildren();
    const loading=document.createElement('span');
    loading.className='biglwa-minecraft-loading';
    loading.textContent='Loading Minecraft character…';
    root.append(loading);
    try{
      const viewer=await loadMannequin();
      if(!root.isConnected||root.dataset.minecraftSkin!==key)return false;
      const texture=skin||viewer.defaultSkin();
      if(!texture)throw Error('Could not create Minecraft preview texture.');
      const model=viewer.mount(root,texture,{large,
        onError:error=>{if(root.dataset.minecraftSkin===key)setStatus(error?.message||'Minecraft texture could not load.');}
      });
      root._biglwaMinecraftModel=model;
      await model.ready;
      return true;
    }catch(error){
      if(root.isConnected&&root.dataset.minecraftSkin===key){
        disposeViewer(root);
        root.replaceChildren();
        const alert=document.createElement('p');
        alert.className='biglwa-minecraft-error';alert.textContent='3D Minecraft character unavailable: '+(error?.message||'Could not render skin.');
        root.append(alert);
        setStatus(alert.textContent);
      }
      return false;
    }
  }
  function mediaNode(){return one('#biglwaAvatarMedia')}
  function showAvatar(){
    syncEditorPreview();
    const view=mediaNode();if(!view)return;
    const a=state.avatar;
    if(a?.type==='minecraft'&&a.url){
      renderMinecraftModel(view,a.url,false);
      return;
    }
    disposeViewer(view);view.dataset.minecraftSkin='';
    view.replaceChildren();
    if(!a?.url){
      view.innerHTML='<div class="biglwa-avatar-empty" aria-hidden="true">◉<span>your character</span></div>';
      return;
    }
    showImageFallback(view,a.url);
  }
  function showImageFallback(view,url){
    disposeViewer(view);view.replaceChildren();
    const image=new Image();image.src=url;image.alt='Saved avatar image';image.loading='lazy';
    image.onerror=()=>{view.textContent='Stored avatar image could not be loaded.'};
    view.append(image);
  }
  function render(){
    const card=one('#studioAvatarCard');if(!card)return;
    card.innerHTML='<div class="biglwa-avatar-head"><h2 class="card-kicker">Avatar</h2>'+
      '<div class="widget-window-controls avatar-window-controls" role="group" aria-label="Avatar widget controls">'+
      '<button type="button" class="window-light red" data-avatar-widget-action="remove" aria-label="Remove Avatar widget" title="Remove widget"></button>'+
      '<button type="button" class="window-light yellow" data-avatar-widget-action="archive" aria-label="Archive Avatar widget" title="Archive widget"></button>'+
      '<button type="button" class="window-light green" data-avatar-widget-action="edit" aria-label="Customize Avatar" title="Customize Avatar"></button></div></div>'+
      '<button type="button" class="widget-drag-handle avatar-drag-handle" data-studio-drag-handle aria-label="Reorder Aura and Avatar widgets" title="Drag to move the Aura and Avatar widgets">'+
      '<svg viewBox="0 0 12 12" aria-hidden="true"><circle cx="3" cy="3" r="1" fill="currentColor"/><circle cx="9" cy="3" r="1" fill="currentColor"/><circle cx="3" cy="9" r="1" fill="currentColor"/><circle cx="9" cy="9" r="1" fill="currentColor"/></svg></button>'+
      '<div class="biglwa-avatar-media" id="biglwaAvatarMedia" aria-label="Saved avatar preview"></div>';
    showAvatar();
  }
  function syncEditorPreview(){
    const preview=one('#biglwaAvatarProfilePreview');if(!preview)return;
    const url=state.avatar?.url||'';
    const kind=state.avatar?.type||'';
    const key=kind+':'+url;
    if(preview.dataset.avatarSrc===key)return;
    preview.dataset.avatarSrc=key;
    if(kind==='minecraft'&&url){renderMinecraftModel(preview,url,false);return}
    disposeViewer(preview);preview.replaceChildren();
    if(url){const img=new Image();img.src=url;img.alt='Your saved character';preview.append(img)}
    else preview.innerHTML='<span aria-hidden="true">◉</span><small>No saved character yet</small>';
  }
  function mountEditor(){
    const panel=one('#studioApp #wallpaperPanel'),tabs=one('#profileEditorTabs',panel||document);
    if(!panel||!tabs)return false;
    if(!one('[data-profile-editor-tab="avatar"]',tabs)){
      const tab=document.createElement('button');
      tab.type='button';tab.setAttribute('role','tab');tab.dataset.profileEditorTab='avatar';
      tab.setAttribute('aria-controls','profileAvatarEditor');tab.setAttribute('aria-selected','false');
      tab.textContent='Avatar';tabs.append(tab);
    }
    let section=one('#profileAvatarEditor',panel);
    if(!section){
      section=document.createElement('section');section.id='profileAvatarEditor';
      section.className='customize-section biglwa-avatar-profile-section';
      section.dataset.profileEditorPane='avatar';section.setAttribute('role','tabpanel');section.hidden=true;
      section.innerHTML='<h3>Character studio</h3>'+
        '<p>Build or import a character here. Studio displays the saved result without squeezing these controls into its preview.</p>'+
        '<div class="biglwa-avatar-editor-layout"><div class="biglwa-avatar-profile-preview" id="biglwaAvatarProfilePreview" aria-label="Your current avatar"></div>'+
        '<div class="biglwa-avatar-editor-tools">'+
          '<div class="biglwa-avatar-actions" role="group" aria-label="Character creation choices">'+
            '<button type="button" data-avatar-source="minecraft">Minecraft skin</button>'+
            '<button type="button" data-avatar-source="mii">Mii character maker</button>'+
            '<button type="button" data-avatar-source="imvu">IMVU / Unity</button>'+
          '</div><div class="biglwa-avatar-source" id="biglwaAvatarSource"></div>'+
          '<p id="biglwaAvatarStatus" role="status" aria-live="polite">Choose a character source to get started.</p>'+
        '</div></div>';
      panel.append(section);
    }
    syncEditorPreview();
    return true;
  }
  function openEditor(){
    mountEditor();
    const profile=one('#studioApp .profile-card');
    const trigger=one('#editProfileBtn',profile||document);
    if(!profile?.classList.contains('profile-is-editing')&&trigger)trigger.click();
    mountEditor();
    const tab=one('#profileEditorTabs [data-profile-editor-tab="avatar"]');
    if(tab)tab.click();
    // Stay inside the original profile banner: the same tabbed editor used for Aura.
    profile?.scrollIntoView?.({block:'start',behavior:'smooth'});
  }
  function source(name){
    const mount=one('#biglwaAvatarSource');if(!mount)return;
    const input='<label class="biglwa-avatar-upload">Import image<input type="file" data-avatar-import accept="image/png,image/jpeg,image/webp" hidden></label>';
    if(name==='minecraft'){
      mount.innerHTML='<p>Your Minecraft character appears below. Import a skin PNG to wrap its texture around the head, body, arms, and legs, then rotate the character to inspect it.</p>'+
        '<div id="biglwaMinecraftEditorModel" class="biglwa-minecraft-editor-model" aria-label="3D Minecraft character preview"></div>'+
        '<div class="biglwa-minecraft-controls">'+
          '<button type="button" data-minecraft-turn="-35" aria-label="Rotate Minecraft character left">↶ Rotate</button>'+
          '<button type="button" data-minecraft-turn="35" aria-label="Rotate Minecraft character right">Rotate ↷</button>'+
        '</div>'+
        '<label class="biglwa-avatar-upload biglwa-minecraft-file-label">Minecraft skin PNG<input type="file" data-avatar-import data-avatar-kind="minecraft" accept="image/png" aria-label="Choose a Minecraft skin PNG"></label>'+
        '<button type="button" data-minecraft-save'+(state.minecraftDraftFile?'':' disabled')+'>Save skin to my account</button>'+
        '<small class="biglwa-minecraft-note">Supports standard 64×64 or 64×32 skins and HD versions. Drag the character to turn it; use ← and → when focused.</small>';
      renderMinecraftModel(one('#biglwaMinecraftEditorModel',mount),state.minecraftDraftUrl||((state.avatar?.type==='minecraft'&&state.avatar.url)||''),true);
    }else if(name==='mii'){
      // Uploaded MiiEditor is Adobe AIR + SWF, not HTML/JS. A modern browser
      // cannot execute it as a normal file. No loading spinner, Flash emulator
      // or unrelated replacement editor is presented as if it were the original.
      mount.innerHTML='<section class="biglwa-mii-legacy-status" role="status">'+
        '<strong>Original Mii Editor · desktop archive</strong>'+
        '<p>Your uploaded 2007 Mii Editor is an Adobe AIR application (<code>classicGUI.swf</code>), not a browser-based editor. Its original editing interface cannot run here without a supported runtime or a real web port.</p>'+
        '<a href="https://github.com/leianmulatre-lwa/leianmulatre-lwa.github.io/tree/main/MiiEditor" target="_blank" rel="noopener noreferrer">View your original Mii Editor files ↗</a>'+
        '</section>'+
        '<p>To use an avatar on BIG LWA now, upload a PNG, JPG, or WebP snapshot of your Mii.</p>'+input;
    }else{
      mount.innerHTML='<p>Import an IMVU avatar snapshot now. Live IMVU models need an authorized Unity WebGL export; a .unitypackage is not directly browser-runnable.</p>'+input+
        '<button type="button" data-avatar-unity-open>Open installed Unity scene</button>';
    }
    mount.dataset.kind=name;
    cardStatus(name);
  }
  function cardStatus(name){
    setStatus(name==='mii'?'Original AIR files retained; browser editing needs a proper web port. You can save a Mii image to your account now.':name==='minecraft'?'The 3D character is ready. Select a PNG skin to texture your character.':'IMVU snapshot import is available; Unity scene needs a WebGL build.');
  }
  async function verifySkin(file){
    if(file.type!=='image/png')throw Error('Minecraft skins must be PNG files.');
    const url=URL.createObjectURL(file);
    try{
      const img=await new Promise((resolve,reject)=>{
        const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('Cannot read skin PNG.'));image.src=url;
      });
      if(img.naturalWidth<64||img.naturalWidth>1024||img.naturalWidth%64!==0||
        !(img.naturalHeight===img.naturalWidth||img.naturalHeight*2===img.naturalWidth))
          throw Error('Use a Minecraft skin PNG (64×64, 64×32, or a proportional HD skin).');
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
      showAvatar();setStatus(kind==='minecraft'?'Minecraft skin saved to your 3D avatar.':'Avatar saved to your BIG LWA account.');
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
      // Honor only the current account's canonical Studio order. Applying
      // the retired V2 drag key here caused the pair to jump after refresh.
      const order=window.BigLWAStudioLayout?.snapshot?.()?.order?.[rail.id];
      if(Array.isArray(order)&&order.includes('aura-avatar-pair')){
        const after=order.slice(order.indexOf('aura-avatar-pair')+1)
          .map(id=>[...rail.children].find(el=>el.dataset?.widgetId===id)).find(Boolean);
        if(after)rail.insertBefore(pair,after);else rail.append(pair);
      }
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
    // Make either remaining A take the pair's full width. Update from the same
    // source of truth used by the Avatar restore control, including after reload.
    pair.dataset.visibleMembers=avatarHidden&&auraHidden?'none':avatarHidden?'aura':auraHidden?'avatar':'both';
    // If Avatar was removed/archived, show its missing A in the GREEN sidebar
    // alongside minimized Aura. This row is not a canonical widget row: its
    // button deliberately uses data-avatar-restore so the Avatar handler owns it.
    const greenDock=one('#studioApp #minimizedWidgetDock');
    let sidebarRestore=one('#biglwaAvatarSidebarRestore',app);
    if(avatarHidden&&greenDock){
      if(!sidebarRestore){
        sidebarRestore=document.createElement('div');
        sidebarRestore.id='biglwaAvatarSidebarRestore';
        sidebarRestore.className='sidebar-shortcut-row sidebar-avatar-restore-row is-minimized';
        sidebarRestore.dataset.shortcutRow='avatar';
        sidebarRestore.innerHTML='<span aria-hidden="true"></span>'+
          '<button type="button" class="sidebar-shortcut-open" data-avatar-restore aria-label="Restore Avatar to Studio" title="Avatar removed · restore Avatar"><span class="sidebar-route-icon" aria-hidden="true">A<sup>+</sup></span></button>'+
          '<span class="sidebar-minimized-state" aria-hidden="true">↥</span>';
      }
      if(sidebarRestore.parentElement!==greenDock)greenDock.append(sidebarRestore);
      const primary=one('#studioSidebarPrimary',app);
      if(primary)primary.hidden=false;
    }else if(sidebarRestore){sidebarRestore.remove();}
    // The pair always consumes ONE ordinary top-widget slot, split into two halves.
    // Recalculate that slot count when music, Guest Check, Aura or Avatar is hidden.
    const topCards=[...rail.children].filter(el=>
      el===pair||el.matches('.music-card,.guest-check-card,.customizable-widget'));
    const visible=topCards.filter(el=>
      el!==pair||!(avatarHidden&&auraHidden)).filter(el=>
      !el.hidden&&!el.classList.contains('widget-is-minimized')&&
      !el.classList.contains('widget-is-docked')&&getComputedStyle(el).display!=='none');
    const count=String(Math.max(1,visible.length));
    if(rail.style.getPropertyValue('--biglwa-top-slot-count')!==count)
      rail.style.setProperty('--biglwa-top-slot-count',count);
    let restore=one('[data-avatar-restore]',aura);
    if(!restore){
      restore=document.createElement('button');
      restore.type='button';restore.dataset.avatarRestore='1';restore.className='biglwa-avatar-restore';
      restore.textContent='Restore Avatar +';
      aura.append(restore);
    }
    restore.hidden=!avatarHidden||Boolean(auraHidden);
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
  function clearMinecraftDraft(){
    if(state.minecraftDraftUrl){URL.revokeObjectURL(state.minecraftDraftUrl);state.minecraftDraftUrl='';}
    state.minecraftDraftFile=null;
  }
  async function saveMinecraftDraft(){
    const file=state.minecraftDraftFile;
    if(!file||state.busy){setStatus(state.busy?'Saving your skin…':'Select a Minecraft skin PNG first.');return}
    const saveButton=one('[data-minecraft-save]');
    if(saveButton){saveButton.disabled=true;saveButton.textContent='Saving character…';}
    const ok=await save(file,'minecraft');
    if(ok){
      const newSkin=state.avatar?.url||'';
      // Recreate the editor viewer from the permanent account URL before
      // releasing the local selected-file URL.
      const host=one('#biglwaMinecraftEditorModel');
      if(host&&newSkin)await renderMinecraftModel(host,newSkin,true);
      clearMinecraftDraft();
      setStatus('Your Minecraft skin is on your 3D character and saved to your BIG LWA account.');
    }else setStatus('The character preview is ready, but the account save failed. Choose “Save skin to my account” to retry.');
    if(saveButton){saveButton.disabled=!state.minecraftDraftFile;saveButton.textContent='Save skin to my account';}
  }
  document.addEventListener('click',async e=>{
    if(e.target.closest('[data-avatar-restore]')){e.preventDefault();setVisibility('shown');return}
    const rotate=e.target.closest('#profileAvatarEditor [data-minecraft-turn]');
    if(rotate){
      e.preventDefault();one('#biglwaMinecraftEditorModel')?._biglwaMinecraftModel?.rotate(Number(rotate.dataset.minecraftTurn)||35);
      return;
    }
    if(e.target.closest('#profileAvatarEditor [data-minecraft-save]')){
      e.preventDefault();await saveMinecraftDraft();return;
    }
    const origin=e.target.closest('#studioAvatarCard');
    const control=origin&&e.target.closest('[data-avatar-widget-action]');
    if(control){
      e.preventDefault();e.stopPropagation();
      if(control.dataset.avatarWidgetAction==='edit')openEditor();
      else if(control.dataset.avatarWidgetAction==='archive')setVisibility('archived');
      else if(window.confirm('Remove the Avatar widget from Studio? Your saved avatar will remain in your account.'))setVisibility('removed');
      return;
    }
    const panel=e.target.closest('#profileAvatarEditor');
    if(!panel)return;
    const sourceButton=e.target.closest('[data-avatar-source]');
    if(sourceButton){e.preventDefault();source(sourceButton.dataset.avatarSource);return}
    if(e.target.closest('[data-avatar-unity-open]')){
      const sourceArea=one('#biglwaAvatarSource',panel);if(!sourceArea)return;
      try{
        const resp=await fetch('/avatar/unity/index.html',{cache:'no-store'});
        const manifest=resp.ok?await resp.text():'';
        if(resp.ok&&/(createUnityInstance|UnityLoader)/.test(manifest)){
          const frame=document.createElement('iframe');frame.title='Licensed Unity WebGL avatar scene';
          frame.sandbox='allow-scripts allow-same-origin';frame.src='/avatar/unity/index.html';
          frame.style.cssText='width:100%;min-height:340px;border:0;border-radius:10px';
          frame.dataset.biglwaUnityFrame='1';sourceArea.replaceChildren(frame);
          setStatus('Unity WebGL build found. Use your authorized IMVU integration.');
        }else setStatus('A licensed Unity WebGL export is not installed yet. IMVUnity .unitypackage files cannot run directly in a browser.');
      }catch{setStatus('Unity WebGL is not installed yet.')}
    }
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape')one('#studioAvatarCard')?.classList.remove('avatar-is-expanded');
  });
  // A licensed WebGL build gets the stored image URL, never a member's access token.
  window.addEventListener('message',async event=>{
    if(event.origin!==location.origin)return;
    if(event.data?.type!=='biglwa:unity-ready')return;
    const frame=one('#profileAvatarEditor [data-biglwa-unity-frame]');
    if(!frame||event.source!==frame.contentWindow)return;
    frame.contentWindow.postMessage({
      type:'biglwa:avatar-context',
      avatar:state.avatar?{type:state.avatar.type,url:state.avatar.url}:null
    },location.origin);
    setStatus('Unity scene connected. Live IMVU avatars still require an approved integration.');
  });
  document.addEventListener('change',async e=>{
    const input=e.target.closest('#profileAvatarEditor [data-avatar-import]');
    if(!input?.files?.length)return;
    const file=input.files[0];
    const kind=input.dataset.avatarKind||one('#biglwaAvatarSource')?.dataset.kind||'mii';
    if(kind==='minecraft'){
      try{
        await verifySkin(file);
        // The local object URL is shown immediately: no account or network
        // request is needed to see the PNG mapped onto the mannequin.
        if(state.minecraftDraftUrl)URL.revokeObjectURL(state.minecraftDraftUrl);
        state.minecraftDraftFile=file;
        state.minecraftDraftUrl=URL.createObjectURL(file);
        await renderMinecraftModel(one('#biglwaMinecraftEditorModel'),state.minecraftDraftUrl,true);
        const retry=one('#profileAvatarEditor [data-minecraft-save]');
        if(retry)retry.disabled=false;
        setStatus('Skin applied to your Minecraft character. Saving it to your account…');
        await saveMinecraftDraft();
      }catch(error){setStatus(error?.message||'Could not preview the Minecraft skin.');}
      input.value='';return;
    }
    await save(file,kind);input.value='';
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
      queued=true;requestAnimationFrame(()=>{queued=false;mount();mountEditor();});
    });
    obs.observe(document.body,{subtree:true,childList:true});
    // Body and document theme toggles do not necessarily mutate Aura's own style.
    const paletteWatch=new MutationObserver(()=>requestAnimationFrame(position));
    paletteWatch.observe(document.body,{attributes:true,attributeFilter:['class','style']});
    paletteWatch.observe(document.documentElement,{attributes:true,attributeFilter:['class','style']});
    let count=0;const timer=setInterval(()=>{mount();if(++count>60)clearInterval(timer)},600);
    window.addEventListener('resize',()=>requestAnimationFrame(position));
    window.addEventListener('pageshow',mount);
    window.addEventListener('biglwa:identity-updated',()=>{clearMinecraftDraft();appearanceUid=null;state.loadedUid='';restore();mount()});
    mount();mountEditor();watchAura();
  }
  const style=document.createElement('style');style.id='biglwaAvatarLayoutV4';style.textContent=`
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

@media(max-width:620px){
  #studioApp .hero-widget-rail>.biglwa-aura-avatar-pair{grid-template-columns:minmax(0,1fr)!important}
  #studioApp .hero-widget-rail>.biglwa-aura-avatar-pair>.aura-card{min-height:170px!important}
  #studioApp #studioAvatarCard{min-height:215px!important}
}


/* The pair is ONE card-sized slot in the row. If one A is hidden,
   the remaining A fills that slot, not the entire rail. */
#studioApp:not(.profile-editor-wallpaper) .hero:has(#biglwaAuraAvatarPair)>.hero-widget-rail>#biglwaAuraAvatarPair:is(.is-avatar-hidden,.is-aura-hidden){
  grid-column:auto!important;grid-row:1!important;
  grid-template-columns:minmax(0,1fr)!important;
}
#studioApp .hero-widget-rail>#biglwaAuraAvatarPair.is-avatar-hidden>.aura-card,
#studioApp .hero-widget-rail>#biglwaAuraAvatarPair.is-aura-hidden>#studioAvatarCard{
  grid-column:1/-1!important;width:100%!important;min-width:0!important;max-width:100%!important;
}
#studioApp .hero-widget-rail>#biglwaAuraAvatarPair.is-avatar-hidden>#studioAvatarCard{display:none!important}
#studioApp #biglwaAvatarSidebarRestore .sidebar-route-icon{
  position:relative;font:900 21px/1 Georgia,serif;letter-spacing:-.07em;
}
#studioApp #biglwaAvatarSidebarRestore .sidebar-route-icon sup{
  position:absolute;right:-8px;top:-5px;font:900 10px/1 system-ui;color:#397d53;
}
#studioApp #biglwaAvatarSidebarRestore.is-minimized::after{
  content:"";position:absolute;right:20px;top:4px;width:6px;height:6px;
  border-radius:50%;background:#5b9e6f;box-shadow:0 0 0 2px #5b9e6f24;
}

/* Keep Avatar a preview; all source selectors live in Customize Profile. */
#studioApp:not(.profile-editor-wallpaper) .hero:has(#biglwaAuraAvatarPair){
  display:grid!important;grid-template-columns:minmax(0,1fr)!important;grid-template-rows:auto auto auto!important;
  grid-auto-flow:row!important;align-content:start!important;overflow:visible!important;
}
#studioApp:not(.profile-editor-wallpaper) .hero:has(#biglwaAuraAvatarPair)>.profile-card{
  grid-column:1!important;grid-row:1!important;
}
#studioApp:not(.profile-editor-wallpaper) .hero:has(#biglwaAuraAvatarPair)>.hero-widget-rail{
  grid-column:1!important;grid-row:2!important;width:100%!important;max-width:none!important;
  display:grid!important;grid-template-columns:repeat(var(--biglwa-top-slot-count,3),minmax(0,1fr))!important;
  gap:14px!important;grid-auto-flow:row!important;grid-auto-rows:206px!important;
  align-items:stretch!important;overflow:visible!important;box-sizing:border-box!important;
}
#studioApp:not(.profile-editor-wallpaper) .hero:has(#biglwaAuraAvatarPair)>.hero-widget-rail>#biglwaAuraAvatarPair{
  grid-column:auto!important;grid-row:1!important;
  grid-template-columns:repeat(2,minmax(0,1fr))!important;min-height:0!important;
  width:100%!important;min-width:0!important;max-width:100%!important;gap:8px!important;
}
#studioApp:not(.profile-editor-wallpaper) .hero:has(#biglwaAuraAvatarPair)>.hero-widget-rail>:is(.music-card,.guest-check-card,.customizable-widget){
  grid-column:auto!important;grid-row:1!important;width:100%!important;min-width:0!important;max-width:100%!important;
  align-self:stretch!important;margin:0!important;
}
#studioApp:not(.profile-editor-wallpaper) .hero:has(#biglwaAuraAvatarPair)>.hero-action-bar{
  grid-column:1!important;grid-row:3!important;position:relative!important;margin-top:4px!important;
}
#studioApp:not(.profile-editor-wallpaper) .hero-widget-rail>#biglwaAuraAvatarPair>.aura-card,
#studioApp:not(.profile-editor-wallpaper) .hero-widget-rail>#biglwaAuraAvatarPair>#studioAvatarCard{
  height:206px!important;min-height:206px!important;max-height:206px!important;
  overflow:hidden!important;box-sizing:border-box!important;
}
#studioApp:not(.profile-editor-wallpaper) .hero:has(#biglwaAuraAvatarPair)>.hero-widget-rail>:is(.music-card,.guest-check-card,.customizable-widget){
  height:206px!important;min-height:206px!important;max-height:206px!important;
  overflow:hidden!important;
}
#studioApp:not(.profile-editor-wallpaper) .hero-widget-rail>#biglwaAuraAvatarPair>.aura-card{
  grid-template-columns:70px minmax(0,1fr)!important;column-gap:8px!important;
  padding:14px 12px!important;
}
#studioApp:not(.profile-editor-wallpaper) .hero-widget-rail>#biglwaAuraAvatarPair>.aura-card .aura-orb{
  width:66px!important;min-width:0!important;height:66px!important;max-height:66px!important;
}
#studioApp:not(.profile-editor-wallpaper) .hero-widget-rail>#biglwaAuraAvatarPair>#studioAvatarCard{
  padding:10px 11px!important;gap:6px!important;
  border-radius:var(--widget-radius,18px)!important;background:var(--avatar-panel-bg,#cec3b9)!important;
  background-image:var(--avatar-panel-image,none)!important;color:var(--avatar-panel-ink,#302725)!important;
}
#studioApp #studioAvatarCard .avatar-window-controls{top:4px!important;right:2px!important;gap:5px!important}
#studioApp #studioAvatarCard .biglwa-avatar-head{flex:0 0 24px!important;height:24px!important}
#studioApp #studioAvatarCard .biglwa-avatar-head .card-kicker{
  font-family:"CS Bergamot Stitched",Georgia,serif!important;font-weight:400!important;
  font-size:clamp(18px,1.35vw,23px)!important;padding-right:72px!important;text-transform:lowercase!important
}
#studioApp #studioAvatarCard .biglwa-avatar-media{
  flex:1 1 115px!important;min-height:98px!important;max-height:none!important;
  margin:0!important;border-radius:9px!important;overflow:hidden!important
}
#studioApp #studioAvatarCard .biglwa-avatar-media canvas{max-height:136px!important;width:auto!important}
#studioApp #studioAvatarCard .biglwa-avatar-media img{max-height:136px!important;width:auto!important}
#studioApp #studioAvatarCard .biglwa-avatar-empty{font:24px/1 Georgia,serif!important}
#studioApp #studioAvatarCard .biglwa-avatar-empty span{font:700 9px/1.3 system-ui!important}
#studioApp #studioAvatarCard .biglwa-avatar-edit-link{
  display:block!important;flex:0 0 28px!important;width:100%!important;min-height:28px!important;
  padding:6px!important;box-sizing:border-box!important;border:1px solid rgba(80,65,50,.2)!important;
  border-radius:8px!important;background:rgba(255,255,255,.36)!important;color:inherit!important;
  font:700 10px/1.3 system-ui!important;cursor:pointer!important;text-align:center!important;
}
#studioApp #studioAvatarCard .biglwa-avatar-edit-link:hover{background:rgba(255,255,255,.6)!important}
#studioApp #profileAvatarEditor{display:block;min-width:0;overflow:visible!important}
#studioApp #profileAvatarEditor[hidden]{display:none!important}
#studioApp #profileAvatarEditor .biglwa-avatar-editor-layout{
  display:grid;grid-template-columns:minmax(160px,240px) minmax(0,1fr);gap:20px;align-items:start;
  margin-top:15px;
}
#studioApp #profileAvatarEditor .biglwa-avatar-profile-preview{
  display:grid;place-items:center;min-height:210px;aspect-ratio:1;
  border:1px solid rgba(100,80,70,.27);border-radius:16px;
  background:rgba(255,255,255,.25);color:var(--widget-ink,#493c41);overflow:hidden;
}
#studioApp #profileAvatarEditor .biglwa-avatar-profile-preview img{display:block;max-width:95%;max-height:235px;object-fit:contain}
#studioApp #profileAvatarEditor .biglwa-avatar-profile-preview>span{font:65px Georgia,serif;opacity:.6}
#studioApp #profileAvatarEditor .biglwa-avatar-profile-preview>small{font:650 11px system-ui}
#studioApp #profileAvatarEditor .biglwa-avatar-editor-tools{display:grid;gap:12px;min-width:0}
#studioApp #profileAvatarEditor .biglwa-avatar-actions{
  display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:0;
}
#studioApp #profileAvatarEditor .biglwa-avatar-actions button,
#studioApp #profileAvatarEditor :is(.biglwa-avatar-upload,.biglwa-avatar-source button,.biglwa-avatar-source a){
  box-sizing:border-box;min-width:0;width:100%;min-height:38px;padding:9px 12px;
  border:1px solid rgba(80,70,60,.25);border-radius:9px;
  background:rgba(255,255,255,.48);color:inherit;font:700 12px/1.3 system-ui;
  display:flex;align-items:center;justify-content:center;text-align:center;text-decoration:none;cursor:pointer;
}
#studioApp #profileAvatarEditor .biglwa-avatar-source{display:grid;gap:8px;min-width:0;font:12px/1.4 system-ui}
#studioApp #profileAvatarEditor .biglwa-avatar-source p{margin:5px 0!important}
#studioApp #profileAvatarEditor .biglwa-minecraft-editor-model{
  display:grid;place-items:center;min-height:286px;height:286px;overflow:hidden;
  border-radius:12px;background:rgba(255,255,255,.14);
}
#studioApp .biglwa-avatar-media>.biglwa-mc-stage{height:100%!important;min-height:0!important}
#studioApp .biglwa-avatar-profile-preview>.biglwa-mc-stage{min-height:210px!important;height:100%!important}
#studioApp #profileAvatarEditor .biglwa-minecraft-controls{
  display:flex;justify-content:center;gap:8px;align-items:center;margin:0!important;
}
#studioApp #profileAvatarEditor .biglwa-minecraft-controls button{
  width:auto!important;flex:1 1 auto!important;max-width:160px!important;
  min-height:28px!important;padding:5px 8px!important;
}
#studioApp #profileAvatarEditor .biglwa-minecraft-file-label{
  display:grid!important;gap:5px!important;justify-items:stretch!important;cursor:pointer!important;
}
#studioApp #profileAvatarEditor .biglwa-minecraft-file-label input[type="file"]{
  display:block!important;width:100%!important;min-width:0!important;max-width:100%!important;
  font:11px/1.2 system-ui;color:inherit;
}
#studioApp #profileAvatarEditor [data-minecraft-save]{
  display:block!important;border-radius:8px;border:1px solid #467b56;
  background:#e9f3e7;color:#24452f;min-height:36px;
  font:700 12px/1.2 system-ui;cursor:pointer;
}
#studioApp #profileAvatarEditor [data-minecraft-save]:disabled{opacity:.55;cursor:not-allowed}
#studioApp #profileAvatarEditor .biglwa-minecraft-note{
  display:block;max-width:70ch;font:11px/1.45 system-ui;opacity:.78;
}
#studioApp .biglwa-minecraft-loading,
#studioApp .biglwa-minecraft-error{
  display:grid;place-items:center;min-height:100%;margin:0;padding:9px;
  text-align:center;font:600 11px/1.45 system-ui;
}

#studioApp #profileAvatarEditor .biglwa-mii-legacy-status{
  max-width:690px;padding:15px 16px;margin:4px 0 11px;
  border:1px solid rgba(100,80,70,.22);border-radius:12px;
  background:rgba(255,255,255,.27);color:inherit;
}
#studioApp #profileAvatarEditor .biglwa-mii-legacy-status strong{display:block;margin-bottom:6px;font:700 16px Georgia,serif}
#studioApp #profileAvatarEditor .biglwa-mii-legacy-status p{margin:0 0 9px!important;max-width:75ch}
#studioApp #profileAvatarEditor .biglwa-mii-legacy-status a{font:700 12px/1.4 system-ui;text-underline-offset:3px;color:inherit}
#studioApp #profileAvatarEditor #biglwaAvatarStatus{display:block;font:12px/1.45 system-ui;min-height:18px;margin:0}
/* Avatar is an ordinary tab of the existing profile banner, NOT a fixed modal. */
#studioApp .hero:has(#biglwaAuraAvatarPair)>.profile-card.profile-is-editing:has(#profileAvatarEditor:not([hidden])){
  position:relative!important;inset:auto!important;top:auto!important;left:auto!important;right:auto!important;
  bottom:auto!important;transform:none!important;z-index:auto!important;
  display:grid!important;grid-template-columns:minmax(150px,184px) minmax(0,1fr)!important;
  grid-column:1!important;grid-row:1!important;
  width:100%!important;height:auto!important;min-height:370px!important;max-height:none!important;
  overflow:visible!important;padding:0!important;margin:0!important;isolation:isolate!important;
  box-shadow:var(--widget-shadow,0 10px 22px rgba(30,15,18,.1))!important;
}
#studioApp .hero:has(#biglwaAuraAvatarPair)>.profile-card.profile-is-editing:has(#profileAvatarEditor:not([hidden])) #wallpaperPanel{
  position:static!important;inset:auto!important;transform:none!important;
  grid-column:2!important;grid-row:1!important;align-self:stretch!important;
  height:auto!important;max-height:none!important;min-height:0!important;
  overflow:visible!important;min-width:0!important;width:100%!important;
}
#studioApp .hero:has(#biglwaAuraAvatarPair)>.profile-card.profile-is-editing:has(#profileAvatarEditor:not([hidden])) .profile-identity-rail{
  position:relative!important;top:auto!important;align-self:start!important;max-height:none!important;
}
#studioApp .hero:has(#biglwaAuraAvatarPair)>.profile-card.profile-is-editing:has(#profileAvatarEditor:not([hidden])) .profile-editor-actions{
  position:static!important;
}
@media(max-width:900px){
  #studioApp:not(.profile-editor-wallpaper) .hero:has(#biglwaAuraAvatarPair)>.hero-widget-rail{
    grid-template-columns:repeat(var(--biglwa-top-slot-count,2),minmax(0,1fr))!important
  }
  #studioApp:not(.profile-editor-wallpaper) .hero:has(#biglwaAuraAvatarPair)>.hero-widget-rail>#biglwaAuraAvatarPair{grid-column:auto!important}
  #studioApp .hero:has(#biglwaAuraAvatarPair)>.profile-card.profile-is-editing:has(#profileAvatarEditor:not([hidden])){
    grid-template-columns:minmax(0,1fr)!important
  }
  #studioApp .hero:has(#biglwaAuraAvatarPair)>.profile-card.profile-is-editing:has(#profileAvatarEditor:not([hidden])) .profile-identity-rail{display:none!important}
  #studioApp .hero:has(#biglwaAuraAvatarPair)>.profile-card.profile-is-editing:has(#profileAvatarEditor:not([hidden])) #wallpaperPanel{grid-column:1!important;grid-row:1!important}
}
@media(max-width:620px){
  #studioApp:not(.profile-editor-wallpaper) .hero:has(#biglwaAuraAvatarPair)>.hero-widget-rail{
    grid-template-columns:minmax(0,1fr)!important
  }
  #studioApp:not(.profile-editor-wallpaper) .hero:has(#biglwaAuraAvatarPair)>.hero-widget-rail>#biglwaAuraAvatarPair{
    grid-template-columns:repeat(2,minmax(0,1fr))!important;grid-column:1!important
  }
  #studioApp #profileAvatarEditor .biglwa-avatar-editor-layout{grid-template-columns:minmax(0,1fr)}
  #studioApp #profileAvatarEditor .biglwa-avatar-profile-preview{max-width:200px;min-height:150px}
  #studioApp #profileAvatarEditor .biglwa-avatar-actions{grid-template-columns:minmax(0,1fr)}
  #studioApp .hero:has(#biglwaAuraAvatarPair)>.profile-card.profile-is-editing:has(#profileAvatarEditor:not([hidden])){
    position:relative!important;left:auto!important;top:auto!important;width:100%!important;height:auto!important;max-height:none!important;transform:none!important
  }
}
`;
  document.head.append(style);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
