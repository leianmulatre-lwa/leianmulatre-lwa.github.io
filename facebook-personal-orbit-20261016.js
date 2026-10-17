/* BIG LWA personal Facebook Login, using a distinct Meta app and
   server-side authorization-code callback (no conflict with legacy FB SDK). */
(()=>{
 'use strict';
 if(window.BigLWAFacebookPersonal)return;
 const origin='https://api.biglwa.com',id='facebook-personal';
 const state={connected:false,profile:null,needsReauth:false,configured:false,missing:[]};
 let authPromise=null,refreshing=null;
 const notice=text=>{
   const el=document.querySelector('#orbitPageStatus');
   if(el)el.textContent=text;
   else if(text)console.info('BIG LWA Facebook:',text);
 };
 function fbFirebase(){
   if(!authPromise)authPromise=Promise.all([
     import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'),
     import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js')
   ]).then(([app,auth])=>{
     const a=app.getApps()[0]||app.initializeApp({
       apiKey:'AIzaSyAPUT8_pLNxdh5tbGpAmXBJiID3jVcA9DY',
       authDomain:'biglwa.firebaseapp.com',projectId:'biglwa',
       appId:'1:83232670555:web:e04927b20458390b3b507e'
     });
     return auth.getAuth(a);
   }).catch(error=>{authPromise=null;throw error});
   return authPromise;
 }
 async function authToken(){
   const auth=await fbFirebase();
   await auth.authStateReady();
   if(!auth.currentUser)throw Error('Sign in to BIG LWA before connecting Facebook.');
   return auth.currentUser.getIdToken();
 }
 async function api(action,method='GET',token=''){
   const response=await fetch(origin+'/'+id+'/'+action,{
     method,headers:token?{Authorization:'Bearer '+token}:{},cache:'no-store'
   });
   const data=await response.json().catch(()=>({}));
   if(!response.ok)throw Error(data.error||(response.status===404?'Facebook OAuth route has not been deployed.':'Facebook request failed.'));
   return data;
 }
 function publish(){
   document.dispatchEvent(new CustomEvent('biglwa:facebook-personal-status'));
 }
 async function load(){
   if(refreshing)return refreshing;
   refreshing=(async()=>{
     try{
       const health=await api('health');
       state.configured=Boolean(health.configured);
       state.missing=Array.isArray(health.missing)?health.missing:[];
     }catch(error){state.configured=false;state.missing=[];state.configurationError=error.message}
     try{
       const token=await authToken();
       const account=await api('session','GET',token);
       state.connected=!!account.connected;
       state.profile=account.profile||null;
       state.needsReauth=!!account.needsReauth;
     }catch{state.connected=false;state.profile=null;state.needsReauth=false}
     publish();
     return state;
   })();
   try{return await refreshing}finally{refreshing=null}
 }
 async function connect(){
   await load();
   if(!state.configured){
     throw Error(state.missing.length
       ?'To enable your new Facebook app, set '+state.missing.join(' and ')+' in your Cloudflare Worker secrets, then reconnect.'
       :'The new Facebook OAuth API is not ready. Check the API deployment.');
   }
   const token=await authToken();
   const response=await api('start','POST',token);
   const uri=new URL(String(response.authorizeUrl||''));
   if(uri.protocol!=='https:'||uri.hostname!=='www.facebook.com')
     throw Error('Facebook returned an untrusted login address.');
   location.assign(uri.toString());
 }
 async function disconnect(){
   const token=await authToken();
   await api('disconnect','POST',token);
   state.connected=false;state.profile=null;state.needsReauth=false;publish();
 }
 function get(){return state.connected&&state.profile?{
   ...state.profile,id:'facebook',needsReauth:state.needsReauth,verifiedFromProvider:true
 }:null}
 function callbackNotice(){
   const url=new URL(location.href);
   const result=url.searchParams.get('facebook_login')||'';
   if(!['connected','failed'].includes(result))return;
   const error=url.searchParams.get('facebook_login_error')||'';
   url.searchParams.delete('facebook_login');
   url.searchParams.delete('facebook_login_error');
   history.replaceState(history.state,'',url.toString());
   const message=result==='connected'?'Personal Facebook account connected.':
     'Facebook connection failed: '+(error||'Please try again.');
   setTimeout(()=>notice(message),1000);
 }
 window.BigLWAFacebookPersonal=Object.freeze({load,connect,disconnect,get,state});
 function boot(){
   callbackNotice();
   load().catch(error=>console.warn('New Facebook connection check:',error));
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
 else boot();
 document.addEventListener('biglwa:module-open',()=>{
   if(document.querySelector('#moduleWorkspace[data-module-key="orbit"]'))load();
 });
})();