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
    let card=one('#studioAvatarCard');
    if(!card)return;
    card.innerHTML='<div class="biglwa-avatar-head"><strong>avatar</strong><span>✦ character studio</span></div>'+
      '<div class="biglwa-avatar-media" id="biglwaAvatarMedia" aria-label="Avatar preview"></div>'+
      '<div class="biglwa-avatar-actions"><button type="button" data-avatar-source="minecraft">Minecraft skin</button>'+
      '<button type="button" data-avatar-source="mii">Mii editor</button>'+
      '<button type="button" data-avatar-source="imvu">IMVU / Unity</button></div>'+
      '<div class="biglwa-avatar-source" id="biglwaAvatarSource"></div>'+
      '<small id="biglwaAvatarStatus" role="status">Choose a source to make an avatar.</small>';
    showAvatar();
  }
  function source(name){
    const mount=one('#biglwaAvatarSource');
    if(!mount)return;
    const input='<label class="biglwa-avatar-upload">Import image<input type="file" data-avatar-import accept="image/png,image/jpeg,image/webp" hidden></label>';
    if(name==='minecraft'){
      mount.innerHTML='<p>Import a Minecraft skin PNG (64×64 or classic 64×32) for an interactive 3D preview.</p>'+
        '<label class="biglwa-avatar-upload">Import Minecraft skin<input type="file" data-avatar-import data-avatar-kind="minecraft" accept="image/png" hidden></label>';
    }else if(name==='mii'){
      mount.innerHTML='<p>Use the archived Mii editor, then import an exported screenshot. Direct save-data extraction is not enabled.</p>'+
        '<a href="https://archive.org/details/mii-editor" target="_blank" rel="noopener noreferrer">Open Mii Editor archive ↗</a>'+input;
    }else{
      mount.innerHTML='<p>IMVUnity requires a licensed Unity WebGL build. This slot supports avatar snapshots now; live IMVU loading needs an approved SDK build and IMVU authorization.</p>'+input+
        '<button type="button" data-avatar-unity-open>Check for Unity WebGL build</button>';
    }
    mount.dataset.kind=name;
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
    }catch(error){setStatus(error?.message||'Avatar could not be saved.');}
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
  function position(){
    const hero=one('#studioApp .hero'),aura=one('#studioApp .aura-card'),card=one('#studioAvatarCard');
    if(!hero||!aura||!card)return;
    const h=hero.getBoundingClientRect(),a=aura.getBoundingClientRect();
    if(!h.width||!a.width)return;
    if(!state.layout)state.layout={originalAuraWidth:a.width};
    const original=state.layout.originalAuraWidth;
    const space=h.right-a.left-16;
    // Wide screens: the avatar occupies half the Aura width, sharing one row.
    if(original>=460&&space>=460&&window.innerWidth>800){
      const auraWidth=Math.max(220,Math.floor((original-10)*2/3));
      const avatarWidth=Math.floor(auraWidth/2);
      aura.style.setProperty('width',auraWidth+'px','important');
      const r=aura.getBoundingClientRect();
      card.style.cssText='position:absolute!important;left:'+(r.right-h.left+10)+'px!important;top:'+(r.top-h.top)+'px!important;width:'+avatarWidth+'px!important;min-height:'+Math.max(195,r.height)+'px!important';
      hero.style.setProperty('min-height',Math.ceil(r.bottom-h.top+18)+'px','important');
      return;
    }
    aura.style.removeProperty('width');
    const r=aura.getBoundingClientRect();
    const rightSpace=h.right-r.right-18;
    if(rightSpace>=180&&window.innerWidth>700){
      card.style.cssText='position:absolute!important;left:'+(r.right-h.left+10)+'px!important;top:'+(r.top-h.top)+'px!important;width:'+Math.min(230,Math.max(150,Math.floor(r.width/2)),rightSpace-9)+'px!important;min-height:'+Math.max(195,r.height)+'px!important';
      return;
    }
    card.style.cssText='position:absolute!important;left:'+(r.left-h.left)+'px!important;top:'+(r.bottom-h.top+12)+'px!important;width:'+Math.max(180,Math.min(r.width,360))+'px!important;min-height:195px!important';
    hero.style.setProperty('min-height',Math.ceil(r.bottom-h.top+230)+'px','important');
  }

  function mount(){
    const hero=one('#studioApp .hero'),aura=one('#studioApp .aura-card');
    if(!hero||!aura)return false;
    if(!one('#studioAvatarCard')){
      const card=document.createElement('section');card.id='studioAvatarCard';
      card.className='biglwa-avatar-card';card.setAttribute('aria-label','Avatar Studio widget');
      aura.insertAdjacentElement('afterend',card);render();restore();
    }
    position();return true;
  }
  document.addEventListener('click',async e=>{
    const origin=e.target.closest('#studioAvatarCard');if(!origin)return;
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
  // A licensed WebGL build gets the stored image URL, never a member's access token.
  window.addEventListener('message',event=>{
    if(event.origin!==location.origin||event.data?.type!=='biglwa:unity-ready')return;
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
    const obs=new MutationObserver(()=>{if(!one('#studioAvatarCard'))mount()});
    obs.observe(document.body,{subtree:true,childList:true});
    let count=0;const timer=setInterval(()=>{mount();if(++count>60)clearInterval(timer)},600);
    window.addEventListener('resize',()=>requestAnimationFrame(position));
    window.addEventListener('pageshow',()=>{state.layout=null;mount();});
    window.addEventListener('biglwa:identity-updated',()=>{state.loadedUid='';restore()});
    mount();
  }
  const style=document.createElement('style');style.textContent=`
#studioAvatarCard{box-sizing:border-box;z-index:8;padding:14px;border-radius:18px;border:1px solid #dda0a2;
 background:rgba(239,233,223,.96);box-shadow:0 10px 22px #4c343320;overflow:hidden;color:#302725}
#studioAvatarCard .biglwa-avatar-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:9px}
#studioAvatarCard .biglwa-avatar-head strong{font:400 25px "CS Bergamot Stitched",Georgia,serif}
#studioAvatarCard .biglwa-avatar-head span{font:600 9px/1.2 system-ui;color:#82756a}
#studioAvatarCard .biglwa-avatar-media{width:100%;min-height:132px;max-height:260px;border:1px solid #c8b9a9;
 background:linear-gradient(140deg,#f8f0e7,#e6dfd2);border-radius:12px;display:grid;place-items:center;overflow:hidden}
#studioAvatarCard .biglwa-avatar-media canvas{max-width:100%;height:auto}
#studioAvatarCard .biglwa-avatar-media>img{display:block;width:100%;max-height:240px;object-fit:contain}
#studioAvatarCard .biglwa-avatar-empty{display:grid;gap:5px;place-items:center;font:50px Georgia,serif;color:#917e89}
#studioAvatarCard .biglwa-avatar-empty span{font:700 10px system-ui}
#studioAvatarCard .biglwa-avatar-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;margin:10px 0}
#studioAvatarCard button,#studioAvatarCard .biglwa-avatar-upload,#studioAvatarCard a{border:1px solid #cdbcb2;
 border-radius:8px;background:#fff8ef;color:#3a3031;font:650 10px/1.3 system-ui;padding:8px 5px;
 text-align:center;text-decoration:none;cursor:pointer}
#studioAvatarCard .biglwa-avatar-source{display:grid;gap:7px;font:11px/1.4 system-ui}
#studioAvatarCard .biglwa-avatar-source p{margin:5px 0}
#studioAvatarCard .biglwa-avatar-upload{display:inline-flex;align-items:center;justify-content:center}
#studioAvatarCard #biglwaAvatarStatus{display:block;margin-top:6px;font:10px/1.4 system-ui;color:#786b68}
@media(max-width:600px){#studioAvatarCard .biglwa-avatar-actions{grid-template-columns:1fr}}
`;
  document.head.append(style);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
