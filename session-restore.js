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
function lastViewFromLocal(){
  try{return clean(localStorage.getItem("biglwaLastStudioView"))}catch{return""}
}
function setLastView(key){
  const value=clean(key).toLowerCase();
  if(!value)return;
  try{localStorage.setItem("biglwaLastStudioView",value)}catch{}
  try{window.BigLWAUserDirectory?.saveCustomizations?.({session:{lastView:value}})}catch{}
}
function restoreLastView(remote){
  if(location.pathname!="/studio")return;
  // An explicit Studio panel beats an older last-view preference.
  const panel=clean(qs().get('panel')).toLowerCase();
  const current=['map','politc'].includes(panel)?panel:clean(qs().get("view")).toLowerCase();
  const saved=clean(remote?.customization?.session?.lastView)||lastViewFromLocal();
  if(current||!saved||typeof window.openBIGLWAModule!=="function")return;
  setTimeout(()=>{try{window.openBIGLWAModule(saved,"",false)}catch{}},140);
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
let lastConfirmedUid,authListenerAttached=false,starting=false;
function resolveVerifiedUser(user){
  const uid=user?.uid||'';
  // Multiple widgets all listen for Firebase auth. A repeated notification
  // about the same user is NOT another sign-in or a reason to repaint pages.
  if(lastConfirmedUid===uid)return;
  lastConfirmedUid=uid;
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
  verifySession();
  window.addEventListener("biglwa:customization-remote",event=>restoreLastView(event.detail));
  document.addEventListener("biglwa:module-open",event=>setLastView(event.detail?.key||""));
  document.addEventListener("biglwa:module-close",()=>{
    if(location.pathname==="/studio")try{localStorage.setItem("biglwaLastStudioView","")}catch{}
  });
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();
