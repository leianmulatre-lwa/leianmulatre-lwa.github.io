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
 let registration=null,installPrompt=null,portraitAllowed=false,messaging=null,messagingSdk=null;
 const status=document.createElement('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const setStatus=value=>{status.textContent=value;};
 const button=(label,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',fn);return b;};
 const cfg=async()=>{
  if(window.BIGLWA_PUSH_CONFIG)return window.BIGLWA_PUSH_CONFIG;
  await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='/biglwa-push-config.js';s.onload=resolve;s.onerror=reject;document.head.append(s);});
  return window.BIGLWA_PUSH_CONFIG;
 };
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
   const enable=button('Enable notifications / send a test',async()=>{
    if(ios()&&!standalone()){setStatus('Install BIG LWA on your home screen and open it there before enabling notifications.');return;}
    if(!('Notification' in window)||!('serviceWorker' in navigator)){setStatus('Notifications are unavailable on this browser.');return;}
    if(!registration){setStatus('The app is still preparing. Try again once the notification service is ready.');return;}
    enable.disabled=true;
    try{
     // Request permission directly from this trusted tap, before awaiting any network request.
     const permission=Notification.permission==='granted'?'granted':await Notification.requestPermission();
     if(permission!=='granted'){setStatus('Notifications are off. You can change them in device settings.');return;}
     await registration.showNotification('BIG LWA',{body:'Your test notification is working.',icon:'/apple-touch-icon.png',tag:'biglwa-local-test',data:{url:'/studio'}});
     const config=await cfg();
     if(!config?.vapidKey){setStatus('Local test sent. Remote push delivery is not configured yet.');return;}
     if(!('PushManager' in window)){setStatus('Local test sent. Remote push is unsupported on this device.');return;}
     const [appSdk,msdk]=await Promise.all([import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'),import('https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging.js')]);
     if(!await msdk.isSupported()){setStatus('Local test sent. Firebase remote push is not supported here.');return;}
     const app=appSdk.getApps().find(a=>a.name==='biglwa-push')||appSdk.initializeApp(config.firebase,'biglwa-push');
     messagingSdk=msdk;messaging=msdk.getMessaging(app);
     const token=await msdk.getToken(messaging,{vapidKey:config.vapidKey,serviceWorkerRegistration:registration});
     // No account token storage or automated sender until the trusted backend is connected.
     setStatus(token?'Remote push registration succeeded. Account alerts are not connected yet.':'Local test sent; remote registration did not return a token.');
     if(token){const copy=button('Copy device token for Firebase test',async()=>{try{await navigator.clipboard.writeText(token);setStatus('Device token copied. Keep it private; use it only for a Firebase test.');}catch{setStatus('Clipboard unavailable.');}});copy.dataset.pwaToken='1';host.querySelector('[data-pwa-token]')?.remove();host.append(copy);}
    }catch(error){setStatus('Notification setup failed: '+(error.message||'Try again.'));}finally{enable.disabled=false;}
   });
   const disable=button('Disable remote notifications on this device',async()=>{
    try{
     const config=await cfg();
     if(config?.vapidKey&&await swReady){
      if(!messaging){
       const [appSdk,msdk]=await Promise.all([import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'),import('https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging.js')]);
       if(await msdk.isSupported()){messagingSdk=msdk;messaging=msdk.getMessaging(appSdk.getApps().find(a=>a.name==='biglwa-push')||appSdk.initializeApp(config.firebase,'biglwa-push'));}
      }
      if(messaging)await messagingSdk.deleteToken(messaging);
     }
     const sub=await registration?.pushManager?.getSubscription();if(sub)await sub.unsubscribe();
     host.querySelector('[data-pwa-token]')?.remove();
     setStatus('Remote subscription removed. To revoke local alerts too, turn off BIG LWA in device notification settings.');
    }catch(error){setStatus('Could not remove the subscription: '+(error.message||'Try again.'));}
   });
   host.prepend(install,enable,disable);
   void swReady.then(r=>setStatus(r?'Notifications are opt-in. Tap to send a local test.':'Notification service unavailable.'));
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
