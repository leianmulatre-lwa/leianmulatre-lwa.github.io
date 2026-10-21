/* BIGLWA Avatar: user-owned 360sona widget, Minecraft skins and Bitmoji. */
(()=>{
  if(window.__biglwaAvatarStudioV1)return;
  window.__biglwaAvatarStudioV1=true;
  const API='https://biglwa-instagram-api.leianmulatre-284.workers.dev';
  const SONA_EXAMPLE='https://360sona.com/w/k_JKIiB9soQQcIj77klMY';
  // Vanilla Minecraft player skin textures extracted from the 1.21.11 client;
  // hosted by an asset mirror. These are Minecraft's textures, not our
  // previous generated mannequin colors. Classic=4px, Slim=3px arms.
  const MINECRAFT_DEFAULT_SKINS=Object.freeze({
    steve:'https://assets.mcasset.cloud/1.21.11/assets/minecraft/textures/entity/player/wide/steve.png',
    alex:'https://assets.mcasset.cloud/1.21.11/assets/minecraft/textures/entity/player/slim/alex.png'
  });
  // A creator's shared widget is not a default for every member.
  const sonaUrl=value=>{
    try{
      const u=new URL(String(value||'').trim());
      return u.protocol==='https:'&&['360sona.com','www.360sona.com'].includes(u.hostname)&&
        !u.username&&!u.password&&!u.search&&!u.hash&&/^\/w\/[A-Za-z0-9_-]{8,96}\/?$/.test(u.pathname)
          ?u.origin+u.pathname:'';
    }catch{return ''}
  };
  const state={loadedUid:'',skinViewer:null,skinLibrary:null,avatar:null,busy:false,layout:null,minecraftSlim:false};
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
    const skinType=state.minecraftSlim?'alex':'steve';
    const atlasUrl=skin||MINECRAFT_DEFAULT_SKINS[skinType];
    const key=atlasUrl+':'+(large?'large':'small')+':'+skinType;
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
      const texture=atlasUrl;
      if(!texture)throw Error('Official Minecraft skin texture is unavailable.');
      const model=viewer.mount(root,texture,{large,slim:state.minecraftSlim,
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
  function renderSonaFrame(root,value,compact=false){
    if(!root)return false;
    const url=sonaUrl(value);
    if(!url){root.textContent='Add a valid 360sona display case URL.';return false;}
    disposeViewer(root);root.replaceChildren();
    const wrap=document.createElement('div');wrap.className='biglwa-sona-frame'+(compact?' is-compact':'');
    const iframe=document.createElement('iframe');
    iframe.src=url;iframe.title='Avatar · 360sona display case';
    iframe.width='265';iframe.height='170';iframe.loading='lazy';
    iframe.referrerPolicy='no-referrer';iframe.setAttribute('allow','fullscreen');
    iframe.setAttribute('data-sona-widget','1');iframe.style.border='0';
    // Preserve actual interaction (drag/rotate/pet gestures) in the compact display case.
    wrap.append(iframe);root.append(wrap);return true;
  }
  function mediaNode(){return one('#biglwaAvatarMedia')}
  function showAvatar(){
    syncEditorPreview();
    const view=mediaNode();if(!view)return;
    const a=state.avatar;
    if(a?.type==='minecraft'&&a.url){
      state.minecraftSlim=a.slim===true;
      renderMinecraftModel(view,a.url,false);
      return;
    }
    if(a?.type==='sona360'&&sonaUrl(a.url)){renderSonaFrame(view,a.url,true);return;}
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
  function openAvatarLarge(){
    const a=state.avatar;
    if(!a?.url||!state.loadedUid||state.loadedUid!==current()){openEditor();setStatus('Save your avatar first to open the interactive enlarged view.');return}
    let dialog=one('#biglwaAvatarLarge');
    if(!dialog){
      dialog=document.createElement('dialog');dialog.id='biglwaAvatarLarge';dialog.className='biglwa-avatar-lightbox';
      dialog.setAttribute('aria-label','Interactive Avatar preview');
      dialog.innerHTML='<div class="biglwa-avatar-lightbox-head"><strong>Avatar</strong><button type="button" data-avatar-lightbox-close aria-label="Close enlarged avatar">×</button></div>'+
        '<div id="biglwaAvatarLargeMedia" class="biglwa-avatar-lightbox-media"></div>'+
        '<div class="biglwa-avatar-lightbox-footer"><span data-avatar-lightbox-info>Interact with the avatar.</span>'+
        '<div class="biglwa-avatar-lightbox-controls"><button type="button" data-avatar-large-turn="-35" aria-label="Turn Minecraft avatar left">↶</button>'+
        '<button type="button" data-avatar-large-turn="35" aria-label="Turn Minecraft avatar right">↷</button>'+
        '<a data-avatar-large-external target="_blank" rel="noopener noreferrer">View on 360sona ↗</a></div></div>';
      dialog.addEventListener('close',()=>{const media=one('#biglwaAvatarLargeMedia',dialog);disposeViewer(media);media?.replaceChildren();});
      document.body.append(dialog);
    }
    const media=one('#biglwaAvatarLargeMedia',dialog),info=one('[data-avatar-lightbox-info]',dialog),external=one('[data-avatar-large-external]',dialog);
    dialog.querySelectorAll('[data-avatar-large-turn]').forEach(button=>button.hidden=a.type!=='minecraft');
    if(a.type==='sona360'&&sonaUrl(a.url)){
      renderSonaFrame(media,a.url);
      if(info)info.textContent='Interact directly with the 360sona display case.';
      if(external){external.hidden=false;external.href=sonaUrl(a.url);}
    }else if(a.type==='minecraft'){
      state.minecraftSlim=a.slim===true;
      renderMinecraftModel(media,a.url,true);
      if(info)info.textContent=(a.slim?'Alex':'Steve')+' · drag to rotate or use the arrows.';
      if(external)external.hidden=true;
    }else{
      showImageFallback(media,a.url);
      if(info)info.textContent='Saved Snapchat Bitmoji image.';
      if(external)external.hidden=true;
    }
    if(!dialog.open)dialog.showModal();
  }
  function render(){
    const card=one('#studioAvatarCard');if(!card)return;
    card.innerHTML='<div class="biglwa-avatar-head"><h2 class="card-kicker">Avatar</h2>'+
      '<div class="widget-window-controls avatar-window-controls" role="group" aria-label="Avatar widget controls">'+
      '<button type="button" class="window-light red" data-avatar-widget-action="remove" aria-label="Remove Avatar widget" title="Remove widget"></button>'+
      '<button type="button" class="window-light yellow" data-avatar-widget-action="archive" aria-label="Archive Avatar widget" title="Archive widget"></button>'+
      '<button type="button" class="window-light green" data-avatar-widget-action="enlarge" aria-label="Enlarge interactive Avatar" title="Enlarge interactive avatar"></button></div></div>'+
      '<button type="button" class="widget-drag-handle avatar-drag-handle" data-studio-drag-handle aria-label="Reorder Aura and Avatar widgets" title="Drag to move the Aura and Avatar widgets">'+
      '<svg viewBox="0 0 12 12" aria-hidden="true"><circle cx="3" cy="3" r="1" fill="currentColor"/><circle cx="9" cy="3" r="1" fill="currentColor"/><circle cx="3" cy="9" r="1" fill="currentColor"/><circle cx="9" cy="9" r="1" fill="currentColor"/></svg></button>'+
      '<div class="biglwa-avatar-media" id="biglwaAvatarMedia" aria-label="Interactive avatar preview"></div>'+ '';
    showAvatar();
  }
  function syncEditorPreview(){
    const preview=one('#biglwaAvatarProfilePreview');if(!preview)return;
    // An active source owns the entire editor; never respawn the old Xbox
    // iframe in the left-hand preview after switching to Minecraft or Snapchat.
    if(preview.closest('#profileAvatarEditor')?.classList.contains('has-active-avatar-source')){
      disposeViewer(preview);preview.replaceChildren();preview.dataset.avatarSrc='';
      return;
    }
    const url=state.avatar?.url||'';
    const kind=state.avatar?.type||'';
    const key=kind+':'+url;
    if(preview.dataset.avatarSrc===key)return;
    preview.dataset.avatarSrc=key;
    if(kind==='minecraft'&&url){state.minecraftSlim=state.avatar?.slim===true;renderMinecraftModel(preview,url,false);return}
    if(kind==='sona360'&&sonaUrl(url)){renderSonaFrame(preview,url,true);return}
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
      section.innerHTML='<h3>Avatar</h3>'+
        '<p>Connect your own 360sona display case, Minecraft skin, or Snapchat Bitmoji. Each account has its own saved avatar.</p>'+
        '<div class="biglwa-avatar-editor-layout"><div class="biglwa-avatar-profile-preview" id="biglwaAvatarProfilePreview" aria-label="Your current avatar"></div>'+
        '<div class="biglwa-avatar-editor-tools">'+
          '<div class="biglwa-avatar-actions" role="group" aria-label="Character creation choices">'+
            '<button type="button" data-avatar-source="sona360">360sona · Xbox</button>'+
            '<button type="button" data-avatar-source="minecraft">Minecraft skin</button>'+
            '<button type="button" data-avatar-source="bitmoji">Snapchat Bitmoji</button>'+
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
    const section=one('#profileAvatarEditor');if(section){section.classList.add('has-active-avatar-source');section.dataset.activeAvatarSource=name;}
    const preview=one('#biglwaAvatarProfilePreview');if(preview){disposeViewer(preview);preview.replaceChildren();preview.dataset.avatarSrc='';}
    if(name==='sona360'){
      const owned=state.avatar?.type==='sona360'?sonaUrl(state.avatar.url):'';
      mount.innerHTML='<p>Paste your public 360sona display-case link. Never enter your 360sona password into BIGLWA. Outfits and animation settings are controlled at 360sona.</p>'+
        '<label class="biglwa-sona-label" for="biglwaSonaWidgetURL">360sona widget link</label>'+
        '<input id="biglwaSonaWidgetURL" type="url" inputmode="url" autocomplete="off" spellcheck="false" placeholder="https://360sona.com/w/your-widget-id" aria-label="360sona display case URL">'+
        '<div class="biglwa-sona-actions"><button type="button" data-sona-preview>Preview</button><button type="button" data-sona-save>Save Avatar</button>'+
        '<button type="button" data-sona-example>Use supplied example</button></div>'+
        '<div id="biglwaSonaLivePreview" class="biglwa-sona-editor-preview" aria-label="360sona live display-case preview"><span>Your widget will appear here when you provide its link.</span></div>'+
        '<div class="biglwa-sona-creator-actions"><button type="button" data-sona-creator aria-expanded="false" aria-controls="biglwaSonaCreator">Create here ▾</button><a class="biglwa-sona-external" href="https://360sona.com/" target="_blank" rel="noopener noreferrer">Open creator in new tab ↗</a></div>'+ '<div id="biglwaSonaCreator" hidden><p>This is 360sona in a browser frame. If its website blocks embedding, use the new-tab link above, then paste the finished widget URL here.</p><iframe title="360sona avatar creator" loading="lazy" referrerpolicy="no-referrer" data-sona-editor></iframe></div>'+
        '<small class="biglwa-sona-note">Display case: 320 × 546, full avatar, original 360sona theme. BIGLWA does not control the third-party editor.</small>';
      const inp=one('#biglwaSonaWidgetURL',mount);
      if(inp)inp.value=owned;
      if(owned)renderSonaFrame(one('#biglwaSonaLivePreview',mount),owned);
    }else if(name==='bitmoji'){
      mount.innerHTML='<p>Use the Bitmoji from your connected Snapchat account. Connect Snapchat in Orbit first, then return here.</p>'+ 
        '<div id="biglwaBitmojiPreview" class="biglwa-bitmoji-preview"></div>'+ '<div class="biglwa-bitmoji-actions">'+ 
        '<button type="button" data-bitmoji-orbit>Connect Snapchat in Orbit</button> '+
        '<button type="button" data-bitmoji-refresh>Refresh Snapchat connection</button> '+
        '<button type="button" data-bitmoji-save>Save Snapchat Bitmoji</button>'+ 
        '<label class="biglwa-avatar-upload biglwa-minecraft-file-label">Import PNG <input type="file" data-avatar-import data-avatar-kind="bitmoji" accept="image/png,image/jpeg,image/webp" aria-label="Import Bitmoji image"></label></div>';
      renderBitmojiChoice();
      Promise.resolve().then(()=>window.BigLWAOrbitOAuth?.load?.()).then(
        ()=>{if(mount.isConnected&&mount.dataset.kind==='bitmoji')renderBitmojiChoice()}
      ).catch(error=>setStatus('Snapchat connection check: '+error.message));
    }else if(name==='minecraft'){
      mount.innerHTML='<p>Your Minecraft character appears below. Import a skin PNG to wrap its texture around the head, body, arms, and legs, then rotate the character to inspect it.</p>'+
        '<div class="biglwa-minecraft-variants" role="group" aria-label="Minecraft character model">'+
          '<button type="button" data-minecraft-model="steve" aria-pressed="'+String(!state.minecraftSlim)+'">Steve · classic</button>'+
          '<button type="button" data-minecraft-model="alex" aria-pressed="'+String(state.minecraftSlim)+'">Alex · slim</button></div>'+
        '<div id="biglwaMinecraftEditorModel" class="biglwa-minecraft-editor-model" aria-label="3D Minecraft character preview"></div>'+
        '<div class="biglwa-minecraft-controls">'+
          '<button type="button" data-minecraft-turn="-35" aria-label="Rotate Minecraft character left">↶ Rotate</button>'+
          '<button type="button" data-minecraft-turn="35" aria-label="Rotate Minecraft character right">Rotate ↷</button>'+
        '</div>'+
        '<label class="biglwa-avatar-upload biglwa-minecraft-file-label">Minecraft skin PNG<input type="file" data-avatar-import data-avatar-kind="minecraft" accept="image/png" aria-label="Choose a Minecraft skin PNG"></label>'+
        '<button type="button" data-minecraft-save'+(state.minecraftDraftFile?'':' disabled')+'>Save skin to my account</button>'+
        '<small class="biglwa-minecraft-note">Official vanilla Steve/Alex textures (1.21.11), classic 4-pixel or slim 3-pixel arms. Import 64×64/64×32/HD PNG for a custom skin. Drag to rotate.</small>';
      renderMinecraftModel(one('#biglwaMinecraftEditorModel',mount),state.minecraftDraftUrl||((state.avatar?.type==='minecraft'&&state.avatar.url)||''),true);
    }
    mount.dataset.kind=name;
    one('#profileAvatarEditor')?.querySelectorAll('[data-avatar-source]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.avatarSource===name)));
    if(name!=='bitmoji')cardStatus(name);
  }
  try{
    const avatarChannel=new BroadcastChannel('biglwa-avatar');
    avatarChannel.addEventListener('message',event=>{
      if(event.data?.type!=='saved'||!event.data.uid)return;
      if(event.data.uid!==(state.loadedUid||current()))return;
      state.loadedUid='';restore();
    });
  }catch{}
  function renderBitmojiChoice(){
    const root=one('#biglwaBitmojiPreview');if(!root)return;
    root.replaceChildren();
    const profile=window.BigLWAOrbitOAuth?.get?.('snapchat');
    const saveButton=one('[data-bitmoji-save]');
    const url=profile?.avatarUrl||'';
    // Keep the button actionable: a missing optional Bitmoji scope must explain
    // itself instead of making Save appear broken or silently unclickable.
    if(saveButton)saveButton.disabled=false;
    if(!url){
      root.textContent=profile?.needsReauth?'Snapchat session expired; reconnect from Orbit and allow Bitmoji access.'
        :profile?'Snapchat connected, but did not supply a Bitmoji image. Bitmoji permission is optional. Reconnect and allow it, or import a PNG below.'
        :'Connect Snapchat from Orbit to use its Bitmoji, or import a Bitmoji image below.';
      setStatus(root.textContent);return;
    }
    const img=new Image();img.src=url;img.alt='Your Snapchat Bitmoji';img.referrerPolicy='no-referrer';
    img.onerror=()=>{root.textContent='Snapchat Bitmoji preview is unavailable. Reconnect in Orbit or import an image below.';setStatus(root.textContent)};
    root.append(img);
    setStatus('Snapchat Bitmoji available. Select Use my Bitmoji to save it to your profile.');
  }
  document.addEventListener('biglwa:new-orbit-status',()=>{if(one('#biglwaAvatarSource')?.dataset.kind==='bitmoji')renderBitmojiChoice()});
  async function selectBitmoji(){
    setStatus('Checking your Snapchat Bitmoji…');
    await window.BigLWAOrbitOAuth?.load?.();
    const profile=window.BigLWAOrbitOAuth?.get?.('snapchat');
    if(!profile?.verifiedFromProvider||profile.needsReauth){
      setStatus('Snapchat is not authorized for this account. Reconnect it from Orbit.');return;
    }
    if(!profile.avatarUrl){
      setStatus('Snapchat did not share a Bitmoji image. Reconnect and approve Bitmoji access, or import a Bitmoji image below.');return;
    }
    if(state.busy)return;
    const button=one('#profileAvatarEditor [data-bitmoji-save]');
    if(button)button.disabled=true;
    try{
      const uri=new URL(profile.avatarUrl);
      if(uri.protocol!=='https:'||uri.username||uri.password)throw Error('Snapchat returned an invalid Bitmoji URL.');
      const f=await firebase();await f.auth.authStateReady();
      const user=f.auth.currentUser;
      if(!user)throw Error('Sign in to BIGLWA before saving Bitmoji.');
      const uid=user.uid;
      setStatus('Saving your Bitmoji to your account…');
      // Keep an owned copy in BigLWA storage when the provider allows CORS.
      // Some Snapchat image CDNs prevent cross-origin reads; then preserve the
      // authorized HTTPS image URL as a fallback without exposing an access token.
      let stored=false;
      try{
        const response=await fetch(uri.href,{mode:'cors',credentials:'omit',cache:'no-store'});
        if(response.ok){
          const blob=await response.blob();
          if(blob.size&&blob.size<=8*1024*1024&&['image/png','image/jpeg','image/webp'].includes(blob.type)){
            stored=await save(new File([blob],'snapchat-bitmoji'+(blob.type==='image/png'?'.png':blob.type==='image/webp'?'.webp':'.jpg'),{type:blob.type}),'bitmoji');
          }
        }
      }catch(error){console.info('Snapchat image cannot be copied across origins:',error?.message)}
      if(stored)return;
      await f.setDoc(f.doc(f.db,'users',uid),{
        studioAvatar:{type:'bitmoji',url:uri.href,updatedAt:f.serverTimestamp()}
      },{mergeFields:['studioAvatar']});
      if(f.auth.currentUser?.uid!==uid)throw Error('Account changed during save.');
      state.avatar={type:'bitmoji',url:uri.href};state.loadedUid=uid;
      showAvatar();
      try{const ch=new BroadcastChannel('biglwa-avatar');ch.postMessage({type:'saved',uid});ch.close()}catch{}
      window.dispatchEvent(new CustomEvent('biglwa:avatar-updated',{detail:{type:'bitmoji'}}));
      setStatus('Snapchat Bitmoji saved. Original Snapchat image may require reconnecting if its URL expires.');
    }catch(error){setStatus('Bitmoji save failed: '+(error?.message||'Please retry.'))}
    finally{if(button)button.disabled=false}
  }
  function cardStatus(name){
    setStatus(name==='sona360'?'Enter your 360sona display-case link and save it to your BIGLWA account.':name==='minecraft'?'The 3D character is ready. Select a PNG skin to texture your character.':'Choose a Snapchat Bitmoji.');
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
  async function save(file,kind,preset=null){
    if(state.busy)return;
    if(!['minecraft','bitmoji'].includes(kind))throw Error('Choose an avatar source first.');
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
        studioAvatar:{type:kind,url:result.url,
          ...(kind==='minecraft'?{slim:state.minecraftSlim}:{}),updatedAt:f.serverTimestamp()}
      },{mergeFields:['studioAvatar']});
      if(f.auth.currentUser?.uid!==uid)throw Error('Account switched before avatar was saved.');
      state.avatar={type:kind,url:result.url,...(kind==='minecraft'?{slim:state.minecraftSlim}:{})};
      showAvatar();setStatus(kind==='minecraft'?'Minecraft skin saved to your 3D avatar.':'Avatar saved to your BIG LWA account.');
      try{
        const channel=new BroadcastChannel('biglwa-avatar');
        channel.postMessage({type:'saved',uid});channel.close();
      }catch{}
      window.dispatchEvent(new CustomEvent('biglwa:avatar-updated',{detail:{type:kind}}));
      return true;
    }catch(error){setStatus(error?.message||'Avatar could not be saved.');return false;}
    finally{state.busy=false;}
  }
  async function saveMinecraftModelChoice(){
    if(state.busy||state.avatar?.type!=='minecraft'||!state.avatar.url)return;
    state.busy=true;
    try{
      const f=await firebase();await f.auth.authStateReady();const uid=f.auth.currentUser?.uid;
      if(!uid||uid!==state.loadedUid)throw Error('Account changed; model not saved.');
      await f.setDoc(f.doc(f.db,'users',uid),{
        studioAvatar:{type:'minecraft',url:state.avatar.url,slim:state.minecraftSlim,updatedAt:f.serverTimestamp()}
      },{mergeFields:['studioAvatar']});
      if(f.auth.currentUser?.uid!==uid)return;
      state.avatar={...state.avatar,slim:state.minecraftSlim};showAvatar();
      setStatus('Minecraft '+(state.minecraftSlim?'Alex':'Steve')+' model saved.');
      window.dispatchEvent(new CustomEvent('biglwa:avatar-updated',{detail:{type:'minecraft'}}));
    }catch(error){setStatus('Model preview updated; account save failed: '+(error.message||'Retry.'))}
    finally{state.busy=false;}
  }
  async function saveSona(){
    const input=one('#biglwaSonaWidgetURL');
    const url=sonaUrl(input?.value);
    if(!url){setStatus('Paste a valid HTTPS 360sona public link (https://360sona.com/w/…).');return false;}
    if(state.busy)return false;
    state.busy=true;setStatus('Saving your Avatar to your account…');
    try{
      const f=await firebase();await f.auth.authStateReady();
      const user=f.auth.currentUser;
      if(!user?.uid)throw Error('Sign in before saving your Avatar.');
      const uid=user.uid;
      await f.setDoc(f.doc(f.db,'users',uid),{
        studioAvatar:{type:'sona360',url,updatedAt:f.serverTimestamp()}
      },{mergeFields:['studioAvatar']});
      if(f.auth.currentUser?.uid!==uid)throw Error('Account switched. Reload your avatar.');
      state.avatar={type:'sona360',url};state.loadedUid=uid;
      showAvatar();
      renderSonaFrame(one('#biglwaSonaLivePreview'),url);
      try{const channel=new BroadcastChannel('biglwa-avatar');channel.postMessage({type:'saved',uid});channel.close()}catch{}
      window.dispatchEvent(new CustomEvent('biglwa:avatar-updated',{detail:{type:'sona360'}}));
      setStatus('Avatar saved to your own BIGLWA profile.');return true;
    }catch(error){setStatus('Avatar could not be saved: '+(error?.message||'Please retry.'));return false;}
    finally{state.busy=false}
  }
  async function restore(){
    try{
      const f=await firebase();await f.auth.authStateReady();
      const user=f.auth.currentUser;if(!user){state.loadedUid='';state.avatar=null;showAvatar();return;}
      if(state.loadedUid===user.uid)return;
      state.loadedUid=user.uid;
      // Never show the last signed-in person's avatar while this account loads.
      state.avatar=null;showAvatar();
      const snap=await f.getDoc(f.doc(f.db,'users',user.uid));
      if(state.loadedUid!==user.uid||f.auth.currentUser?.uid!==user.uid)return;
      const avatar=snap.data()?.studioAvatar;
      const url=avatar?.type==='sona360'?sonaUrl(avatar?.url):String(avatar?.url||'');
      const backedMedia=url&&(url.startsWith(API+'/media/profile-photo/')||url.startsWith(API+'/media/feed-image/')||
        (avatar?.type==='bitmoji'&&/^https:\/\/[^/]+\//.test(url)));
      if((avatar?.type==='sona360'&&url)||(['minecraft','mii','imvu','bitmoji'].includes(avatar?.type)&&backedMedia)){
        state.avatar={type:avatar.type,url,...(avatar.type==='minecraft'?{slim:avatar.slim===true}:{})};
        if(avatar.type==='minecraft')state.minecraftSlim=avatar.slim===true;
        showAvatar();setStatus('Saved Avatar restored from your account.');
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
      card.className='biglwa-avatar-card';card.setAttribute('aria-label','Avatar widget');
      card.dataset.search='xbox avatar 360sona minecraft bitmoji character';
      rail.append(card);render();restore();
    }else if(!one('#biglwaAvatarMedia',one('#studioAvatarCard'))){
      // Recover a widget whose children were replaced by Studio layout restore.
      render();restore();
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
    if(e.target.closest('#profileAvatarEditor [data-sona-example]')){
      e.preventDefault();
      const inp=one('#biglwaSonaWidgetURL');if(inp)inp.value=SONA_EXAMPLE;
      renderSonaFrame(one('#biglwaSonaLivePreview'),SONA_EXAMPLE);
      setStatus('Showing the supplied 360sona example. Save only if this is your display case.');
      return;
    }
    if(e.target.closest('#profileAvatarEditor [data-sona-preview]')){
      e.preventDefault();const url=sonaUrl(one('#biglwaSonaWidgetURL')?.value);
      if(!url){setStatus('Paste your public 360sona widget URL first.');return;}
      renderSonaFrame(one('#biglwaSonaLivePreview'),url);
      setStatus('Previewing your display case. Save to show it on your profile.');return;
    }
    const creator=e.target.closest('#profileAvatarEditor [data-sona-creator]');
    if(creator){
      e.preventDefault();const panel=one('#biglwaSonaCreator');if(!panel)return;
      panel.hidden=!panel.hidden;creator.setAttribute('aria-expanded',String(!panel.hidden));
      creator.textContent=panel.hidden?'Create here ▾':'Close creator ▴';
      const iframe=panel.querySelector('[data-sona-editor]');
      if(iframe){if(!panel.hidden&&!iframe.getAttribute('src'))iframe.src='https://360sona.com/';if(panel.hidden)iframe.removeAttribute('src');}
      return;
    }
    if(e.target.closest('#profileAvatarEditor [data-sona-save]')){e.preventDefault();await saveSona();return}
    const variant=e.target.closest('#profileAvatarEditor [data-minecraft-model]');
    if(variant){
      e.preventDefault();state.minecraftSlim=variant.dataset.minecraftModel==='alex';
      one('#profileAvatarEditor')?.querySelectorAll('[data-minecraft-model]').forEach(button=>button.setAttribute('aria-pressed',String((button.dataset.minecraftModel==='alex')===state.minecraftSlim)));
      await renderMinecraftModel(one('#biglwaMinecraftEditorModel'),state.minecraftDraftUrl||(state.avatar?.type==='minecraft'?state.avatar.url:''),true);
      if(state.avatar?.type==='minecraft'&&!state.minecraftDraftFile)await saveMinecraftModelChoice();
      else setStatus('Selected '+(state.minecraftSlim?'Alex slim arms':'Steve classic arms')+'. Save skin to keep this model.');
      return;
    }
    if(e.target.closest('#profileAvatarEditor [data-minecraft-save]')){
      e.preventDefault();await saveMinecraftDraft();return;
    }
    if(e.target.closest('[data-avatar-lightbox-close]')){e.preventDefault();one('#biglwaAvatarLarge')?.close();return}
    const largeRotate=e.target.closest('[data-avatar-large-turn]');
    if(largeRotate){e.preventDefault();one('#biglwaAvatarLargeMedia')?._biglwaMinecraftModel?.rotate(Number(largeRotate.dataset.avatarLargeTurn)||35);return}
    const origin=e.target.closest('#studioAvatarCard');
    const control=origin&&e.target.closest('[data-avatar-widget-action]');
    if(control){
      e.preventDefault();e.stopPropagation();
      if(control.dataset.avatarWidgetAction==='enlarge')openAvatarLarge();
      else if(control.dataset.avatarWidgetAction==='edit')openEditor();
      else if(control.dataset.avatarWidgetAction==='archive')setVisibility('archived');
      else if(window.confirm('Remove Avatar from Studio? Your saved avatar will remain in your account.'))setVisibility('removed');
      return;
    }
    const panel=e.target.closest('#profileAvatarEditor');
    if(!panel)return;
    if(e.target.closest('[data-bitmoji-orbit]')){
      e.preventDefault();
      if(window.openBIGLWAModule)window.openBIGLWAModule('orbit');
      else location.assign('/studio?view=orbit');
      return;
    }
    if(e.target.closest('[data-bitmoji-refresh]')){e.preventDefault();await window.BigLWAOrbitOAuth?.load?.();renderBitmojiChoice();return}
    if(e.target.closest('[data-bitmoji-save]')){e.preventDefault();await selectBitmoji();return}
    const sourceButton=e.target.closest('[data-avatar-source]');
    if(sourceButton){e.preventDefault();source(sourceButton.dataset.avatarSource);return}

  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape')one('#studioAvatarCard')?.classList.remove('avatar-is-expanded');
  });
  document.addEventListener('change',async e=>{
    const input=e.target.closest('#profileAvatarEditor [data-avatar-import]');
    if(!input?.files?.length)return;
    const file=input.files[0];
    const kind=input.dataset.avatarKind||one('#biglwaAvatarSource')?.dataset.kind||'bitmoji';
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
    let count=0;const timer=setInterval(()=>{if(mount()||++count>120)clearInterval(timer)},600);
    window.addEventListener('resize',()=>requestAnimationFrame(position));
    window.addEventListener('pageshow',mount);
    window.addEventListener('biglwa:session-verified',()=>requestAnimationFrame(()=>{mount();restore()}));
    document.addEventListener('biglwa:module-close',()=>requestAnimationFrame(mount));
    window.addEventListener('biglwa:identity-updated',()=>{one('#biglwaAvatarLarge')?.close();clearMinecraftDraft();appearanceUid=null;state.loadedUid='';state.avatar=null;showAvatar();restore();mount()});
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
#studioApp .hero:has(#biglwaAuraAvatarPair)>.hero-widget-rail>#biglwaAuraAvatarPair:is(.is-avatar-hidden,.is-aura-hidden){
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
#studioApp .hero:has(#biglwaAuraAvatarPair){
  display:grid!important;grid-template-columns:minmax(0,1fr)!important;grid-template-rows:auto auto auto!important;
  grid-auto-flow:row!important;align-content:start!important;overflow:visible!important;
}
#studioApp .hero:has(#biglwaAuraAvatarPair)>.profile-card{
  grid-column:1!important;grid-row:1!important;
}
#studioApp .hero:has(#biglwaAuraAvatarPair)>.hero-widget-rail{
  grid-column:1!important;grid-row:2!important;width:100%!important;max-width:none!important;
  display:grid!important;grid-template-columns:repeat(var(--biglwa-top-slot-count,3),minmax(0,1fr))!important;
  gap:14px!important;grid-auto-flow:row!important;grid-auto-rows:206px!important;
  align-items:stretch!important;overflow:visible!important;box-sizing:border-box!important;
}
#studioApp .hero:has(#biglwaAuraAvatarPair)>.hero-widget-rail>#biglwaAuraAvatarPair{
  grid-column:auto!important;grid-row:1!important;
  grid-template-columns:repeat(2,minmax(0,1fr))!important;min-height:0!important;
  width:100%!important;min-width:0!important;max-width:100%!important;gap:8px!important;
}
#studioApp .hero:has(#biglwaAuraAvatarPair)>.hero-widget-rail>:is(.music-card,.guest-check-card,.customizable-widget){
  grid-column:auto!important;grid-row:1!important;width:100%!important;min-width:0!important;max-width:100%!important;
  align-self:stretch!important;margin:0!important;
}
#studioApp .hero:has(#biglwaAuraAvatarPair)>.hero-action-bar{
  grid-column:1!important;grid-row:3!important;position:relative!important;margin-top:4px!important;
}
#studioApp .hero-widget-rail>#biglwaAuraAvatarPair>.aura-card,
#studioApp .hero-widget-rail>#biglwaAuraAvatarPair>#studioAvatarCard{
  height:206px!important;min-height:206px!important;max-height:206px!important;
  overflow:hidden!important;box-sizing:border-box!important;
}
#studioApp .hero:has(#biglwaAuraAvatarPair)>.hero-widget-rail>:is(.music-card,.guest-check-card,.customizable-widget){
  height:206px!important;min-height:206px!important;max-height:206px!important;
  overflow:hidden!important;
}
#studioApp .hero-widget-rail>#biglwaAuraAvatarPair>.aura-card{
  grid-template-columns:70px minmax(0,1fr)!important;column-gap:8px!important;
  padding:14px 12px!important;
}
#studioApp .hero-widget-rail>#biglwaAuraAvatarPair>.aura-card .aura-orb{
  width:66px!important;min-width:0!important;height:66px!important;max-height:66px!important;
}
#studioApp .hero-widget-rail>#biglwaAuraAvatarPair>#studioAvatarCard{
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
  display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:0;
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

/* Third-party 360sona retains control of stage, plate, palette and animations.
   BIGLWA embeds the public 320x546 display case without inventing an iframe API. */
#studioApp #profileAvatarEditor .biglwa-sona-label{display:block;font:700 12px/1.3 system-ui;margin:8px 0 3px}
#studioApp #profileAvatarEditor #biglwaSonaWidgetURL{box-sizing:border-box;width:100%;min-height:40px;
 border:1px solid rgba(85,70,70,.32);border-radius:8px;padding:9px 12px;
 background:var(--widget-bg,#fffaf5);color:inherit;font:600 12px/1.3 system-ui}
#studioApp #profileAvatarEditor .biglwa-sona-actions{display:flex;gap:8px;flex-wrap:wrap}
#studioApp #profileAvatarEditor .biglwa-sona-actions button{flex:1 1 105px}
/* 360sona bare embed is a landscape 265 x 170 display case, not a portrait iframe.
   Keep the provider's internal zoom/framing independent of BIG LWA dimensions. */
#studioApp #profileAvatarEditor .biglwa-sona-editor-preview{display:flex;align-items:center;justify-content:center;min-width:0;min-height:190px;border-radius:10px;background:linear-gradient(165deg,#20242a,#0b0d10);color:#e8eddc;border:1px solid #76b90055;padding:7px}
#studioApp #profileAvatarEditor .biglwa-sona-editor-preview>span{font:600 12px/1.5 system-ui;text-align:center}
#studioApp #profileAvatarEditor .biglwa-sona-editor-preview .biglwa-sona-frame{width:min(100%,530px);height:auto;aspect-ratio:265/170}
#studioApp #profileAvatarEditor .biglwa-sona-note{font:600 11px/1.45 system-ui;color:var(--widget-muted,#706867)}
#studioApp #profileAvatarEditor .biglwa-sona-external{display:inline-flex;text-decoration:underline;text-underline-offset:3px}
#studioApp .biglwa-sona-frame{position:relative;box-sizing:border-box;width:min(100%,530px);aspect-ratio:265/170;height:auto;overflow:hidden;margin:0 auto;border-radius:8px;background:transparent;border:0;box-shadow:none}
#studioApp .biglwa-sona-frame>iframe{display:block;width:100%!important;height:100%!important;min-height:0!important;max-width:none!important;border:0!important;background:transparent}
#studioApp .biglwa-sona-frame.is-compact{width:100%;height:100%;max-width:none;aspect-ratio:auto;border:0;border-radius:8px;box-shadow:none;pointer-events:auto}
#studioApp .biglwa-sona-frame.is-compact>iframe{position:absolute;inset:0;width:100%!important;height:100%!important;min-height:0!important;transform:none!important;pointer-events:auto}
#studioApp #studioAvatarCard .biglwa-avatar-media:has(.biglwa-sona-frame){background:transparent!important}
#studioApp #profileAvatarEditor .biglwa-avatar-profile-preview:has(.biglwa-sona-frame){display:block}
#studioApp #profileAvatarEditor .biglwa-avatar-profile-preview .biglwa-sona-frame.is-compact>iframe{transform:none!important}
@media(max-width:620px){#studioApp #profileAvatarEditor .biglwa-sona-editor-preview{padding:4px;overflow:auto}}
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
  #studioApp .hero:has(#biglwaAuraAvatarPair)>.hero-widget-rail{
    grid-template-columns:repeat(var(--biglwa-top-slot-count,2),minmax(0,1fr))!important
  }
  #studioApp .hero:has(#biglwaAuraAvatarPair)>.hero-widget-rail>#biglwaAuraAvatarPair{grid-column:auto!important}
  #studioApp .hero:has(#biglwaAuraAvatarPair)>.profile-card.profile-is-editing:has(#profileAvatarEditor:not([hidden])){
    grid-template-columns:minmax(0,1fr)!important
  }
  #studioApp .hero:has(#biglwaAuraAvatarPair)>.profile-card.profile-is-editing:has(#profileAvatarEditor:not([hidden])) .profile-identity-rail{display:none!important}
  #studioApp .hero:has(#biglwaAuraAvatarPair)>.profile-card.profile-is-editing:has(#profileAvatarEditor:not([hidden])) #wallpaperPanel{grid-column:1!important;grid-row:1!important}
}
@media(max-width:620px){
  #studioApp .hero:has(#biglwaAuraAvatarPair)>.hero-widget-rail{
    grid-template-columns:minmax(0,1fr)!important
  }
  #studioApp .hero:has(#biglwaAuraAvatarPair)>.hero-widget-rail>#biglwaAuraAvatarPair{
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
  style.textContent+=`
/* 2026-10-20 Avatar · Interactive display, accessible enlarge and editor reset */
#studioApp .biglwa-sona-frame.is-compact,
#studioApp .biglwa-sona-frame.is-compact>iframe{pointer-events:auto!important}
#studioApp #studioAvatarCard .biglwa-avatar-media{position:relative!important;touch-action:pan-y}
#studioApp #studioAvatarCard .biglwa-sona-frame.is-compact>iframe{touch-action:auto}





#studioApp #profileAvatarEditor.has-active-avatar-source .biglwa-avatar-editor-layout{grid-template-columns:minmax(0,1fr)!important}
#studioApp #profileAvatarEditor.has-active-avatar-source #biglwaAvatarProfilePreview{display:none!important}
#studioApp #profileAvatarEditor .biglwa-avatar-actions{grid-template-columns:repeat(3,minmax(0,1fr))!important}
#studioApp #profileAvatarEditor .biglwa-avatar-actions button[aria-pressed="true"]{border-color:#7c657b!important;box-shadow:inset 0 0 0 2px #7c657b55!important}
#studioApp #profileAvatarEditor .biglwa-minecraft-variants{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin:2px 0}
#studioApp #profileAvatarEditor .biglwa-minecraft-variants button{flex:1 1 110px;padding:7px 10px;border:1px solid #a4a39e;border-radius:8px;background:#f7eee5;cursor:pointer;font:700 11px system-ui}
#studioApp #profileAvatarEditor .biglwa-minecraft-variants button[aria-pressed="true"]{background:#f1d9eb;border-color:#976a96;box-shadow:inset 0 0 0 1px #976a96}
#studioApp #profileAvatarEditor .biglwa-bitmoji-actions{display:flex;align-items:stretch;flex-wrap:nowrap;gap:6px;width:100%;min-width:0;overflow-x:auto;padding:4px 1px 7px}
#studioApp #profileAvatarEditor .biglwa-bitmoji-actions > :is(button,label){display:inline-flex!important;flex:1 1 0!important;min-width:118px!important;width:auto!important;max-width:none!important;white-space:normal;line-height:1.2;text-align:center;padding:7px 6px!important;font-size:10px!important;min-height:38px!important}
#studioApp #profileAvatarEditor .biglwa-bitmoji-actions label input[type="file"]{width:1px;height:1px;position:absolute;clip-path:inset(50%);overflow:hidden}
#studioApp #profileAvatarEditor .biglwa-sona-creator-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
#studioApp #profileAvatarEditor .biglwa-sona-creator-actions>*{flex:1 1 150px;min-height:38px;box-sizing:border-box}
#studioApp #profileAvatarEditor #biglwaSonaCreator[hidden]{display:none!important}
#studioApp #profileAvatarEditor #biglwaSonaCreator{display:grid;gap:8px;max-width:100%;padding:8px;border:1px solid #76b90055;border-radius:10px;background:#20242a;color:#f0f0f0}
#studioApp #profileAvatarEditor #biglwaSonaCreator p{margin:2px!important;max-width:75ch;font:500 11px/1.4 system-ui}
#studioApp #profileAvatarEditor #biglwaSonaCreator iframe{display:block;width:100%;height:min(73vh,740px);min-height:420px;border:0;border-radius:8px;background:#111}
.biglwa-avatar-lightbox{box-sizing:border-box;position:fixed;margin:auto;padding:0;max-width:min(92vw,760px);width:min(92vw,760px);max-height:94vh;overflow:auto;background:#faf6f1;color:#3d3434;border:1px solid #76b90088;border-radius:16px;box-shadow:0 20px 70px #0006}
.biglwa-avatar-lightbox::backdrop{background:#171318b8;backdrop-filter:blur(4px)}
.biglwa-avatar-lightbox-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 17px;border-bottom:1px solid #ddd1ca;font:700 18px Georgia,serif}
.biglwa-avatar-lightbox-head button{cursor:pointer;min-height:32px;min-width:32px;border-radius:8px;border:1px solid #c8b9b9;background:white;font:700 24px/1 system-ui}
.biglwa-avatar-lightbox-media{display:grid;place-items:center;min-height:350px;max-height:65vh;overflow:auto;padding:10px;background:linear-gradient(165deg,#20242a,#0b0d10)}
.biglwa-avatar-lightbox-media .biglwa-sona-frame{width:min(100%,640px);height:auto;aspect-ratio:265/170;max-width:100%;overflow:hidden;border-radius:8px}
.biglwa-avatar-lightbox-media .biglwa-sona-frame>iframe{display:block;width:100%;height:100%;max-width:none;border:0}
.biglwa-avatar-lightbox-media .biglwa-mc-stage{height:55vh;min-height:330px;width:100%;touch-action:pan-y}
.biglwa-avatar-lightbox-media>img{object-fit:contain;max-width:100%;max-height:55vh}
.biglwa-avatar-lightbox-footer{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:9px;padding:10px 14px;font:600 11px/1.3 system-ui}
.biglwa-avatar-lightbox-controls{display:flex;align-items:center;gap:7px}
.biglwa-avatar-lightbox-controls button,.biglwa-avatar-lightbox-controls a{cursor:pointer;display:inline-flex;align-items:center;justify-content:center;min-height:33px;border:1px solid #c3bab5;border-radius:8px;padding:7px 10px;background:#fff;color:#4d3440;font:700 11px system-ui;text-decoration:none}
.biglwa-avatar-lightbox-controls [hidden]{display:none!important}
@media(max-width:650px){#studioApp #profileAvatarEditor .biglwa-bitmoji-actions>:is(button,label){min-width:106px!important} .biglwa-avatar-lightbox-media{max-height:66vh}}

/* Avatar and Aura share the user's persisted Aura hue.
   The provider's transparent bare mode lets this gradient show through. */
#studioApp #studioAvatarCard .biglwa-avatar-media,
#studioApp #studioAvatarCard .biglwa-avatar-media:has(.biglwa-sona-frame),
#studioApp #profileAvatarEditor .biglwa-sona-editor-preview,
#studioApp #profileAvatarEditor .biglwa-avatar-profile-preview:has(.biglwa-sona-frame){
 background:radial-gradient(ellipse at 48% 50%,rgba(var(--aura-rgb,216,95,109),.55) 0%,rgba(var(--aura-rgb,216,95,109),.22) 43%,rgba(var(--aura-rgb,216,95,109),.05) 75%,transparent 100%)!important;
}
#studioApp .biglwa-sona-frame{background:transparent!important}

`;
  document.head.append(style);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
