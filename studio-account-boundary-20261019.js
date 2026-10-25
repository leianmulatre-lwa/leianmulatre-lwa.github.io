/* BIGLWA startup privacy gate: never expose embedded prototype/profile data while auth restores. */
(()=>{'use strict';
 if(window.__biglwaAccountBoundaryStarted)return;
 window.__biglwaAccountBoundaryStarted=true;
 const doc=document,html=doc.documentElement;
 const owner=()=>String(window.BigLWAAccountStorage?.uid||'').trim();
 const isPublicProfile=()=>/^[a-z0-9._-]{5,24}$/i.test((new URLSearchParams(location.search).get('route')||location.pathname).replace(/^\/+|\/+$/g,''))&&!/^\/(?:studio|login|settings|privacy|about|terms|rights|archive)/i.test(location.pathname);
 let sanitized=false,revealed=false;
 const began=Date.now();
 function text(selector,value){
   doc.querySelectorAll('#studioApp '+selector).forEach(node=>{node.textContent=value});
 }
 function clearSeed(){
   if(sanitized || !owner() || isPublicProfile() || html.classList.contains('biglwa-preview-mode'))return;
   const app=doc.getElementById('studioApp');if(!app)return;
   sanitized=true;
   app.dataset.biglwaPendingOwner=owner();
   const own=window.__biglwaIdentity?.uid===owner()?window.__biglwaIdentity:null;
   text('.profile-display-name',own?.name||'Your Studio');
   text('.profile-name-line h1',own?.username?'@'+own.username:'@yourname');
   text('.profile-card .bio','Tell your story. This space belongs to you.');
   text('.profile-card .meta-row span','');
   text('.profile-card .meta-row a','');
   text('.profile-rail-location','');
   text('.aura-card p','Add your own Aura.');
   text('.weekly-mood-value','add this week’s #mood');
   doc.querySelectorAll('#studioApp .profile-card .stats').forEach(node=>node.replaceChildren());
   doc.querySelectorAll('#studioApp .profile-avatar,#studioApp .mini-avatar').forEach(node=>{
     node.style.backgroundImage='linear-gradient(rgba(10,7,13,.12),rgba(10,7,13,.4)),url("/assets/tv-no-signal.svg")';
     node.style.backgroundSize='cover';node.style.backgroundPosition='center';
     node.classList.remove('has-photo');node.classList.add('lwa-default-tv-avatar');
     node.style.fontFamily='"CS Bergamot Stitched",Georgia,serif';
     const chosen=String(own?.name||'').trim();
     const handle=String(own?.username||'').trim().replace(/^@/,'');
     node.textContent=chosen&&chosen.toLowerCase()!==handle.toLowerCase()?Array.from(chosen)[0].toLocaleUpperCase():'';
   });
   // A fresh account's initial cards are placeholders; only owner data may populate them.
   app.dataset.biglwaSeedCleared='1';
 }
 function reveal(){
   if(revealed)return;
   revealed=true;
   html.classList.remove('biglwa-startup-protected');
   html.classList.add('biglwa-startup-ready');
   clearInterval(ticker);
 }
 function check(){
   if(revealed)return;
   const app=doc.getElementById('studioApp');
   if(!app || !window.BigLWAAccountStorage?.isReady)return;
   if(isPublicProfile()){
     if(html.classList.contains('biglwa-preview-mode')){reveal();return;}
     if(Date.now()-began>10000){const studio=doc.getElementById('studioApp');if(studio){studio.hidden=true;studio.style.setProperty('display','none','important');}const login=doc.getElementById('loginPage');if(login){login.hidden=false;login.classList.add('is-active');const message=login.querySelector('#loginMessage');if(message)message.textContent='This profile could not be loaded safely. Refresh to try again.';}reveal();}
     return;
   }
   const uid=owner();
   if(!uid){reveal();return;}
   clearSeed();
   if(window.__biglwaIdentity?.uid!==uid)return;
   // Firebase has proved the account; wait for its own data before showing any cards.
   if(window.__biglwaAccountHydrated===true || Date.now()-began>7000)reveal();
 }
 const ticker=setInterval(check,80);
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',check,{once:true});
 window.addEventListener('biglwa:session-verified',check);
 window.addEventListener('biglwa:customization-remote',check);
 window.addEventListener('biglwa:public-profile-ready',check);
 window.addEventListener('biglwa:user-directory-ready',check);
 check();
})();