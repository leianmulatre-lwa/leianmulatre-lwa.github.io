/* Home-screen installation and opt-in notification setup. No account event delivery yet. */
(()=>{
 if(window.__biglwaPwaReady)return;window.__biglwaPwaReady=true;
 const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
 const mobile=()=>matchMedia('(pointer: coarse)').matches;
 const portrait=()=>matchMedia('(orientation: portrait)').matches;
 const ios=()=>/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 const settings=location.pathname.startsWith('/settings');
 const eligible=()=>settings||location.pathname==='/'||/^\/studio\/?$/.test(location.pathname);
 if(!eligible())return;
 let registration=null,installPrompt=null,portraitAllowed=false;
 const status=document.createElement('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const setStatus=value=>{status.textContent=value;};
 const button=(label,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',fn);return b;};
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
   const install=button('Install BIG LWA',async()=>{
    if(standalone()){setStatus('You are already using the installed app.');return;}
    if(installPrompt){await installPrompt.prompt();installPrompt=null;return;}
    setStatus(ios()?'In Safari, open Share → Add to Home Screen, then launch BIG LWA from its icon.':'Use your browser menu to install this app or add it to your home screen.');
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
     setStatus('Local test sent. Remote push delivery is not configured yet unless the private pilot button below is available.');
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
     setStatus('Remote subscription removed. To revoke local alerts too, turn off BIG LWA in device notification settings.');
    }catch(error){setStatus('Could not remove the subscription: '+(error.message||'Try again.'));}
   });
   host.prepend(install,enable,remote,disable);
   void swReady.then(r=>{if(!status.textContent)setStatus(r?'Notifications are opt-in. Tap to send a local test.':'Notification service unavailable.');});
   return;
  }
  if(!mobile())return;
  const link=document.createElement('a');link.id='biglwaPwaSettingsLink';link.href='/settings/#biglwaPwaSettings';link.textContent=standalone()?'App settings':'Install app';document.body.append(link);
  if(!standalone())return;
  const gate=document.createElement('section');gate.id='biglwaRotateGate';gate.setAttribute('role','dialog');gate.setAttribute('aria-label','Landscape Studio');gate.hidden=true;
  const img=document.createElement('img');img.src='/apple-touch-icon.png';img.alt='BIG LWA';const symbol=document.createElement('span');symbol.className='biglwa-pwa-rotate-symbol';symbol.setAttribute('aria-hidden','true');symbol.textContent='▯';
  const title=document.createElement('strong');title.textContent='a bigger world awaits.';
  const text=document.createElement('p');text.textContent='Turn your screen to enter Studio. Landscape is designed for the best experience.';
  const bypass=button('Continue in portrait',()=>{portraitAllowed=true;sync();});
  const preferences=document.createElement('a');preferences.href='/settings/#biglwaPwaSettings';preferences.textContent='App & notifications';
  gate.append(img,symbol,title,text,bypass,preferences);document.body.append(gate);
  const sync=()=>{const show=portrait()&&!portraitAllowed&&matchMedia('(max-width:700px)').matches;gate.hidden=!show;document.documentElement.classList.toggle('biglwa-pwa-rotate',show);};
  matchMedia('(orientation: portrait)').addEventListener('change',sync);window.addEventListener('resize',sync);sync();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
