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
  })();
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
  const current=clean(qs().get("view")).toLowerCase();
  const saved=clean(remote?.customization?.session?.lastView)||lastViewFromLocal();
  if(current||!saved||typeof window.openBIGLWAModule!=="function")return;
  setTimeout(()=>{try{window.openBIGLWAModule(saved,"",false)}catch{}},140);
}
function finishAuth(user){
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
async function boot(){
  document.body.classList.add("biglwa-session-pending");
  try{
    const auth=await getAuth();
    try{await auth.authStateReady()}catch{}
    finishAuth(auth.currentUser);
    auth.onAuthStateChanged(user=>{
      finishAuth(user);
      if(user) setTimeout(()=>restoreLastView(window.__biglwaRemoteCustomization),250);
    });
  }catch(error){
    console.warn("[BIGLWA] Session restore unavailable:",error);
    finishAuth(null);
  }
  window.addEventListener("biglwa:customization-remote",event=>restoreLastView(event.detail));
  document.addEventListener("biglwa:module-open",event=>setLastView(event.detail?.key||""));
  document.addEventListener("biglwa:module-close",()=>{
    if(location.pathname==="/studio")try{localStorage.setItem("biglwaLastStudioView","")}catch{}
  });
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();
