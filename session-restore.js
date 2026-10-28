/* BIGLWA session restore
 * Keeps the last Studio module on the signed-in account and resolves Firebase auth before
 * the login surface is allowed to flash on a Studio refresh.
 *
 * Wrapped because this loads as a classic script. wallpaper-cloud.js is also a classic
 * script with a top-level `const FIREBASE_CONFIG`, and two classic scripts declaring the
 * same name collide in the global lexical scope: the second one throws a SyntaxError, which
 * kills the whole file. Nothing here is meant to be global.
 */
(() => {
const FIREBASE_CONFIG={apiKey:"AIzaSyAPUT8_pLNxdh5tbGpAmXBJiID3jVcA9DY",authDomain:"biglwa.firebaseapp.com",projectId:"biglwa",appId:"1:83232670555:web:e04927b20458390b3b507e"};
let authPromise;
async function getAuth(){
  if(!authPromise) authPromise=(async()=>{
    const [{initializeApp,getApps},{getAuth}]=await Promise.all([
      import("https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js")
    ]);
    const app=getApps()[0]||initializeApp(FIREBASE_CONFIG);
    return getAuth(app);
  })().catch(error=>{authPromise=null;throw error});
  return authPromise;
}
const qs=()=>new URLSearchParams(location.search);
const clean=v=>String(v||"").trim();
const SCOPED_VIEW_PREFIX='biglwaLastStudioView:v2:';
// Null marks the *unresolved* first auth check. An initial signed-out result
// has uid === '', and must still call finishAuth() to reveal the login page.
let lastConfirmedUid=null,restoreScheduled=false,pendingView='';
const currentUid=()=>lastConfirmedUid||window.__biglwaIdentity?.uid||'';
const scopedViewKey=()=>currentUid()?SCOPED_VIEW_PREFIX+currentUid():'';
function lastViewFromLocal(){
  const key=scopedViewKey();
  if(!key)return '';
  try{return clean(localStorage.getItem(key)).toLowerCase()}catch{return ''}
}
function setLastView(key){
  const value=clean(key).toLowerCase();
  if(!/^[a-z][a-z0-9-]{0,35}$/.test(value))return;
  if(!currentUid()){pendingView=value;return}
  const storageKey=scopedViewKey();
  try{localStorage.setItem(storageKey,value);localStorage.removeItem('biglwaLastStudioView')}catch{}
  try{window.BigLWAUserDirectory?.saveCustomizations?.({session:{lastView:value}})}catch{}
}
function requestedRoute(){
  if(location.pathname!=='/studio')return true;
  const params=qs();
  // OAuth return is deliberate, while a stale plain ?view=orbit is not.
  return params.has('panel')||params.has('nav')||params.has('orbit_return')||
     (params.has('view') && params.get('view')!=='orbit')||
     params.has('instagram_handoff')||params.has('instagram_error');
}
function restoreLastView(remote){
  if(!currentUid()||requestedRoute()||restoreScheduled||
     document.documentElement.classList.contains('biglwa-preview-mode'))return;
  // Never reopen a module over an intentional navigation performed while auth
  // or cloud customizations were loading.
  if(document.querySelector('#studioApp .main.module-view #moduleWorkspace[data-module-key]'))return;
  const local=lastViewFromLocal();
  let saved=local||clean(remote?.customization?.session?.lastView||remote?.session?.lastView).toLowerCase();
  // Old unscoped / remote Orbit defaults cause surprise redirects. Only an
  // explicit Orbit navigation or a fresh account-scoped selection restores it.
  if(!local&&saved==='orbit')saved='studio';
  if(!saved||saved==='studio'||!/^[a-z][a-z0-9-]{0,35}$/.test(saved))return;
  restoreScheduled=true;
  setTimeout(()=>{
    if(requestedRoute()||document.querySelector('#studioApp .main.module-view #moduleWorkspace[data-module-key]'))return;
    if(typeof window.openBIGLWAModule==='function'){
      try{window.openBIGLWAModule(saved,'',false)}catch(error){console.warn('[BIGLWA] Restore last Studio view:',error)}
    }
  },180);
}
function finishAuth(user){
  // Some legacy login routes can be painted before the Firebase callback.
  // Once Firebase has verified the member, do not leave them on a duplicate
  // credential form. Public profile and policy pages are never overridden.
  if(user && !document.documentElement.classList.contains('biglwa-preview-mode') &&
    ['/', '/login', '/studio'].includes(location.pathname)){
    const login=document.getElementById('loginPage');
    const studio=document.getElementById('studioApp');
    if(login?.classList.contains('is-active') && studio){
      login.classList.remove('is-active');
      studio.classList.add('is-active');
      if(location.pathname==='/login')try{history.replaceState(history.state,'','/studio')}catch{}
    }
  }
  document.body.classList.remove("biglwa-session-pending");
  document.body.classList.add("biglwa-auth-resolved");
  if(user) document.body.classList.add("biglwa-session-signed-in");
  else document.body.classList.remove("biglwa-session-signed-in");
  if(user){
    try{
      const remote=window.__biglwaRemoteCustomization;
      restoreLastView(remote);
    }catch{}
  }
}
let authListenerAttached=false,starting=false,repairingScreen=false;
async function repairLateLoginPaint(){
  if(!lastConfirmedUid||repairingScreen)return;
  const login=document.getElementById('loginPage');
  if(!login?.classList.contains('is-active'))return;
  repairingScreen=true;
  try{
    const auth=await getAuth();
    await auth.authStateReady();
    // Only Firebase can establish sign-in. A Pinterest status/401 is never
    // enough to open or close the Big LWA login screen.
    if(auth.currentUser?.uid===lastConfirmedUid &&
       document.getElementById('loginPage')?.classList.contains('is-active')){
      finishAuth(auth.currentUser);
    }
  }catch(error){console.warn('[BIGLWA] Login display verification delayed:',error)}
  finally{repairingScreen=false}
}
function guardLoginScreen(){
  const login=document.getElementById('loginPage');
  if(!login)return;
  const observer=new MutationObserver(()=>{if(lastConfirmedUid)repairLateLoginPaint()});
  observer.observe(login,{attributes:true,attributeFilter:['class']});
}
function resolveVerifiedUser(user){
  const uid=user?.uid||'';
  // Multiple widgets all listen for Firebase auth. A repeated notification
  // about the same user is NOT another sign-in or a reason to repaint pages.
  if(lastConfirmedUid===uid)return;
  lastConfirmedUid=uid;
  restoreScheduled=false;
  if(uid&&pendingView){const next=pendingView;pendingView='';setLastView(next)}
  finishAuth(user);
  try{window.dispatchEvent(new CustomEvent('biglwa:session-verified',{detail:{uid,signedIn:!!uid}}))}catch{}
  if(user) setTimeout(()=>restoreLastView(window.__biglwaRemoteCustomization),250);
}
async function verifySession(attempt=0){
  if(starting)return;starting=true;
  try{
    const auth=await getAuth();
    await auth.authStateReady();
    resolveVerifiedUser(auth.currentUser);
    if(!authListenerAttached){
      authListenerAttached=true;
      auth.onAuthStateChanged(user=>resolveVerifiedUser(user),
        error=>{console.warn('[BIGLWA] Auth observation interrupted:',error);});
    }
  }catch(error){
    // Offline/CDN failure is not equivalent to signing out. Never force the
    // login screen during a transient initialization error.
    console.warn('[BIGLWA] Session verification delayed:',error);
    document.body.classList.add('biglwa-session-check-delayed');
    if(attempt<3)setTimeout(()=>{starting=false;verifySession(attempt+1)},1000*(attempt+1));
    else{
      document.body.classList.remove('biglwa-session-pending');
      document.body.classList.add('biglwa-auth-check-unavailable');
      window.dispatchEvent(new CustomEvent('biglwa:session-check-failed'));
    }
  }finally{starting=false;}
}
async function boot(){
  document.body.classList.add("biglwa-session-pending");
  guardLoginScreen();
  verifySession();
  window.addEventListener("biglwa:customization-remote",event=>restoreLastView(event.detail));
  document.addEventListener("biglwa:module-open",event=>setLastView(event.detail?.key||""));
  document.addEventListener("biglwa:module-close",()=>{
    // Returning home is a real last-view choice. Clear the cloud-synced stale
    // module too, rather than clearing only the device's local key.
    setLastView('studio');
    restoreScheduled=true;
  });
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();
