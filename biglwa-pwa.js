/* Home-screen installation and opt-in notification setup. No account event delivery yet. */
(()=>{
 if(window.__biglwaPwaReady)return;window.__biglwaPwaReady=true;
 const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
 const mobile=()=>matchMedia('(pointer: coarse)').matches;
 const portrait=()=>matchMedia('(orientation: portrait)').matches;
 const ios=()=>/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 document.documentElement.classList.toggle('biglwa-ios',ios());
 const settings=location.pathname.startsWith('/settings');
 const eligible=()=>settings||!!document.getElementById('studioApp')||location.pathname==='/'||/^\/studio\/?$/.test(location.pathname);
 if(!eligible())return;
 let registration=null,installPrompt=null,portraitAllowed=false;
 try{portraitAllowed=sessionStorage.getItem('biglwaAllowPortrait')==='1'}catch{}
 const status=document.createElement('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const setStatus=value=>{status.textContent=value;};
 const button=(label,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',fn);return b;};
 // A physical-device preference: the same account may have a different
 // dock preference on another phone. No change to saved desktop shortcuts.
 const dockKey='biglwaIosBottomDockModeV1';
 const readDockMode=()=>{try{return localStorage.getItem(dockKey)==='touch'?'touch':'always'}catch{return 'always'}};
 function dockPreference(){
  const wrap=document.createElement('label');wrap.className='biglwa-ios-dock-preference';
  const title=document.createElement('strong');title.textContent='Skeleton Key · bottom dock';
  const select=document.createElement('select');select.setAttribute('aria-label','Bottom dock visibility');
  for(const [value,label] of [['always','Always on bottom'],['touch','Reveal when bottom edge is touched']]){
   const option=document.createElement('option');option.value=value;option.textContent=label;select.append(option);
  }
  select.value=readDockMode();
  const hint=document.createElement('small');hint.textContent='Applies to this device in portrait and landscape. Touch just above the iOS home indicator to reveal a hidden dock.';
  select.addEventListener('change',()=>{try{localStorage.setItem(dockKey,select.value)}catch{}window.dispatchEvent(new Event('biglwa:ios-dock-mode'))});
  window.addEventListener('biglwa:ios-dock-mode',()=>{if(select.isConnected)select.value=readDockMode()});
  wrap.append(title,select,hint);return wrap;
 }
 function mountBottomDock(){
  if(!ios()||!document.getElementById('studioApp')||document.documentElement.classList.contains('biglwa-preview-mode')||window.__biglwaPublicStorageView)return;
  const root=document.documentElement;
  if(root.classList.contains('biglwa-ios-bottom-dock'))return;
  root.classList.add('biglwa-ios-bottom-dock');
  const edge=button('Show bottom dock',()=>reveal());edge.id='biglwaIosDockEdge';edge.setAttribute('aria-controls','biglwaIosDockRail');edge.setAttribute('aria-expanded','false');
  edge.innerHTML='<span aria-hidden="true"></span><span class="biglwa-dock-sr">Show bottom dock</span>';
  document.body.append(edge);
  let open=false,managing=false;
  const rail=()=>document.querySelector('#studioApp aside.sidebar');
  const touchMode=()=>readDockMode()==='touch';
  function sync(){
   root.dataset.biglwaDockMode=readDockMode();
   root.classList.toggle('biglwa-ios-dock-revealed',open||managing);
   root.classList.toggle('biglwa-ios-dock-managing',managing);
   const hidden=touchMode()&&!open&&!managing;
   edge.hidden=!hidden;edge.setAttribute('aria-expanded',String(!hidden));
   const dock=rail();if(dock){dock.id='biglwaIosDockRail';dock.inert=hidden;dock.setAttribute('aria-hidden',String(hidden))}
  }
  function reveal(){open=true;sync()}
  function close(){open=false;managing=false;sync()}
  function manage(){managing=true;open=true;sync();rail()?.querySelector('.biglwa-ios-dock-close')?.focus()}
  function wire(){
   const dock=rail();
   if(dock&&!dock.querySelector('.biglwa-ios-dock-close')){
    const done=button('Done editing shortcuts',close);done.className='biglwa-ios-dock-close';dock.prepend(done);
   }
   const hub=document.querySelector('#biglwaSkeletonHub');
   if(hub&&!hub.querySelector('.biglwa-ios-dock-preference')){
    const panel=document.createElement('div');panel.className='biglwa-ios-dock-options';
    panel.append(dockPreference(),button('Manage shortcuts & closed widgets',manage));
    hub.querySelector('.skeleton-quick-actions')?.after(panel);
   }
   // Only change state if needed: observers must not create a render loop.
   if(dock&&dock.id!=='biglwaIosDockRail')sync();
  }
  wire();sync();
  const app=document.getElementById('studioApp');
  new MutationObserver(wire).observe(app,{childList:true,subtree:true});
  edge.addEventListener('pointerdown',reveal);
  document.addEventListener('pointerdown',event=>{
   if(!touchMode()||managing)return;
   if(event.target.closest?.('#biglwaIosDockEdge,#biglwaIosDockRail'))return;
   if(open)close();
  },true);
  document.addEventListener('click',event=>{
   const key=event.target.closest?.('#skeletonKeyLauncher');
   // The original Key is a Studio card, so return from a module before opening it.
   if(key&&rail()?.contains(key)&&document.querySelector('#home.module-view'))document.getElementById('moduleBack')?.click();
  },true);
  window.addEventListener('click',event=>{
   if(touchMode()&&!managing&&event.target.closest?.('#biglwaIosDockRail :is([data-sidebar-route],#skeletonKeyLauncher,#skeletonVeveLauncher)'))setTimeout(close,0);
  },true);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&(open||managing)){close();if(touchMode())edge.focus()}});
  window.addEventListener('biglwa:ios-dock-mode',close);
  window.addEventListener('storage',event=>{if(event.key===dockKey)close()});
  matchMedia('(orientation: portrait)').addEventListener('change',close);
 }
 const cfg=async()=>{
  if(window.BIGLWA_PUSH_CONFIG)return window.BIGLWA_PUSH_CONFIG;
  await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='/biglwa-push-config.js';s.onload=resolve;s.onerror=reject;document.head.append(s);});
  return window.BIGLWA_PUSH_CONFIG;
 };
 const keyBytes=value=>Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-value.length%4)%4)),c=>c.charCodeAt(0));
 async function pilotAuth(config){
  const [appSdk,authSdk]=await Promise.all([import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'),import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js')]);
  const app=appSdk.getApps().find(a=>a.name==='[DEFAULT]')||appSdk.initializeApp(config.firebase);
  const auth=authSdk.getAuth(app);await auth.authStateReady();
  if(!auth.currentUser)throw Error('Sign in to BIG LWA before testing remote delivery.');
  return auth.currentUser;
 }
 async function sendRemoteTest(endpoint,user,sub){
  const response=await fetch(new URL('/v1/test',endpoint),{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+await user.getIdToken()},body:JSON.stringify({subscription:sub.toJSON()}),cache:'no-store',credentials:'omit',redirect:'error'});
  const result=await response.json().catch(()=>({}));
  if(!response.ok)throw Error(result.error||'Remote notification server unavailable.');
  return result;
 }
 const swReady='serviceWorker' in navigator&&window.isSecureContext?
  navigator.serviceWorker.register('/biglwa-sw.js',{scope:'/'}).then(()=>navigator.serviceWorker.ready).then(r=>{registration=r;return r;}).catch(()=>null):Promise.resolve(null);
 window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;});
 window.addEventListener('appinstalled',()=>{installPrompt=null;setStatus('BIG LWA is installed. Open it from your home screen.');});
 function mount(){
  if(settings){
   const host=document.getElementById('biglwaPwaControls');if(!host)return;
   host.append(status);
   if(ios())host.prepend(dockPreference());
   const install=button('Install BIG LWA',async()=>{
    if(standalone()){setStatus('You are already using the installed app.');return;}
    if(installPrompt){await installPrompt.prompt();installPrompt=null;return;}
    setStatus(ios()?'In Safari, tap Share → Add to Home Screen. If offered, turn on Open as Web App, then tap Add.':'Use your browser menu to install this app or add it to your home screen.');
   });
   const enable=button('Enable notifications / send a local test',async()=>{
    if(ios()&&!standalone()){setStatus('Install BIG LWA on your home screen and open it there before enabling notifications.');return;}
    if(!('Notification' in window)||!('serviceWorker' in navigator)){setStatus('Notifications are unavailable on this browser.');return;}
    if(!registration){setStatus('The app is still preparing. Try again once the notification service is ready.');return;}
    enable.disabled=true;
    try{
     // Request permission directly from this trusted tap, before awaiting any network request.
     const permission=Notification.permission==='granted'?'granted':await Notification.requestPermission();
     if(permission!=='granted'){setStatus('Notifications are off. You can change them in device settings.');return;}
     await registration.showNotification('BIG LWA',{body:'Your test notification is working.',icon:'/apple-touch-icon.png',tag:'biglwa-local-test',data:{url:'/studio'}});
     setStatus('Local test sent.');
    }catch(error){setStatus('Notification setup failed: '+(error.message||'Try again.'));}finally{enable.disabled=false;}
   });
   let prepared=null;
   const remote=button('Enable remote push / send a remote test',async()=>{
    if(!prepared){setStatus('The private remote pilot is not ready.');return;}
    if(ios()&&!standalone()){setStatus('Open BIG LWA from its home-screen icon first.');return;}
    remote.disabled=true;
    const {endpoint,user,expected}=prepared;
    try{
     // Invoke subscribe directly from this trusted click; all configuration,
     // service-worker setup and account discovery have already completed.
     const sub=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:expected});
     await refreshSubscription();
     await sendRemoteTest(endpoint,user,sub);
     setStatus('The push gateway accepted your remote test. Check your device notifications. Account event alerts are not connected yet.');
    }catch(error){setStatus('Remote push test failed: '+(error.message||'Try again. Disable an old subscription before retrying if the key changed.'));}
    finally{remote.disabled=false;}
   });
   remote.disabled=true;remote.hidden=true;
   void (async()=>{
    try{
     const config=await cfg();
     if(!config?.vapidKey||!config?.apiOrigin||!('PushManager' in window)||!await swReady)return;
     if(ios()&&!standalone())return;
     const endpoint=new URL(config.apiOrigin);
     if(endpoint.protocol!=='https:'||endpoint.username||endpoint.password||endpoint.pathname!=='/'||endpoint.search||endpoint.hash)throw Error('Invalid notification server configuration.');
     const user=await pilotAuth(config),expected=keyBytes(config.vapidKey);
     if(expected.length!==65||expected[0]!==4)throw Error('Invalid public VAPID key.');
     prepared={endpoint,user,expected};remote.hidden=false;remote.disabled=false;
    }catch(error){setStatus('Remote pilot is not ready: '+(error.message||'Sign in and retry.'));}
   })();
   const disable=button('Disable remote notifications on this device',async()=>{
    try{
     await swReady;
     const sub=await registration?.pushManager?.getSubscription();if(sub&&!await sub.unsubscribe())throw Error('Browser could not unsubscribe.');
     await refreshSubscription();
     setStatus('Remote subscription removed. To revoke local alerts too, turn off BIG LWA in device notification settings.');
    }catch(error){setStatus('Could not remove the subscription: '+(error.message||'Try again.'));}
   });
   disable.hidden=true;
   const refreshSubscription=async()=>{try{disable.hidden=!(await registration?.pushManager?.getSubscription());}catch{disable.hidden=true}};
   void swReady.then(refreshSubscription);
   host.prepend(install,enable,remote,disable);
   void swReady.then(r=>{if(!status.textContent)setStatus(r?'Notifications are opt-in. Tap to send a local test.':'Notification service unavailable.');});
   return;
  }
  mountBottomDock();
  if(!mobile())return;
  const link=document.createElement('a');link.id='biglwaPwaSettingsLink';link.href='/settings/#biglwaPwaSettings';link.textContent=standalone()?'App settings':'Install app';document.body.append(link);
  if(!standalone())return;
  const gate=document.createElement('dialog');gate.id='biglwaRotateGate';gate.setAttribute('role','dialog');gate.setAttribute('aria-label','Landscape Studio');gate.hidden=true;
  const img=document.createElement('img');img.src='/apple-touch-icon.png';img.alt='BIG LWA';const symbol=document.createElement('span');symbol.className='biglwa-pwa-rotate-symbol';symbol.setAttribute('aria-hidden','true');symbol.textContent='▯';
  const title=document.createElement('strong');title.textContent='Turn your screen for landscape Studio';
  const text=document.createElement('p');text.textContent='You can also use Studio in portrait.';
  const bypass=button('Continue in portrait',()=>{portraitAllowed=true;try{sessionStorage.setItem('biglwaAllowPortrait','1')}catch{}sync();});
  const preferences=document.createElement('a');preferences.href='/settings/#biglwaPwaSettings';preferences.textContent='App & notifications';
  gate.append(img,symbol,title,text,bypass,preferences);document.body.append(gate);
  const sync=()=>{
   const show=portrait()&&!portraitAllowed&&matchMedia('(max-width:700px)').matches;
   document.documentElement.classList.toggle('biglwa-pwa-rotate',show);
   gate.hidden=!show;
   if(show&&!gate.open)gate.showModal();
   else if(!show&&gate.open)gate.close();
  };
  gate.addEventListener('cancel',event=>{event.preventDefault();bypass.click()});
  matchMedia('(orientation: portrait)').addEventListener('change',sync);window.addEventListener('resize',sync);sync();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
