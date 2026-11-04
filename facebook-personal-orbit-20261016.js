/* BIG LWA personal Facebook Login, using a distinct Meta app and
   server-side authorization-code callback (no conflict with legacy FB SDK). */
(()=>{
 'use strict';
 if(window.BigLWAFacebookPersonal)return;
 const origin='https://api.biglwa.com',id='facebook-personal';
 const state={connected:false,profile:null,needsReauth:false,configured:false,missing:[]};
 let authPromise=null,refreshing=null,syncing=null;
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
 function renderSync(){
   const status=document.querySelector('#orbitPageStatus');
   if(!status)return;
   let panel=document.getElementById('facebookPersonalSync');
   if(!panel){
     panel=document.createElement('div');panel.id='facebookPersonalSync';
     const button=document.createElement('button');button.type='button';button.className='module-action';
     button.textContent='Sync Facebook Personal';button.onclick=()=>sync().catch(error=>{state.syncMessage=error.message;renderSync()});
     const access=document.createElement('button');access.type='button';access.className='module-action ghost';
     access.textContent='Grant personal content access';access.onclick=()=>connect().catch(error=>notice(error.message));
     const text=document.createElement('p');text.setAttribute('role','status');
     panel.append(button,access,text);status.after(panel);
   }
   panel.hidden=!state.connected;
   panel.querySelector('button').disabled=!!syncing;
   panel.querySelector('p').textContent=state.syncMessage||'Sync recent personal posts and photos to the Collective Feed.';
   if(state.connected&&!get()?.link)panel.querySelector('p').textContent+=' Facebook did not share a profile link. Reconnect to grant profile-link access, or use Facebook’s Link button to save your profile URL.';
 }
 async function syncHometown(uid){
   const data=await api('hometown','GET',await authToken());
   if(!data.hometown)return data.message;
   const auth=await fbFirebase();
   const fs=await import('https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js');
   if(auth.currentUser?.uid!==uid)throw Error('Account changed before saving hometown.');
   const home=data.hometown;
   await fs.setDoc(fs.doc(fs.getFirestore(auth.app),'mapPins','facebook-hometown-'+uid),{
     uid,title:'Hometown',detail:home.name,city:home.name,category:'Place',
     lat:home.lat,lng:home.lng,isPublic:false,source:'facebook-hometown',updatedAt:fs.serverTimestamp()
   });
   return 'Hometown added to your private map: '+home.name+'.';
 }
 async function sync(){
   if(syncing)return syncing;
   syncing=(async()=>{
     const auth=await fbFirebase();await auth.authStateReady();
     const uid=auth.currentUser?.uid;
     if(!uid)throw Error('Sign in to BIG LWA before syncing Facebook.');
     state.syncMessage='Syncing Facebook Personal…';renderSync();
     const data=await api('media','GET',await authToken());
     const writer=(window.__biglwaOrbitPosts||await import('/orbit-posts.js?v=20261017-personal-first-import-3')).saveExternalOrbitDraft;
     if(typeof writer!=='function')throw Error('Feed importer is still loading. Press Sync Facebook Personal to retry.');
     let imported=0,existing=0,failed=0,firstError='';
     for(const item of data.items||[]){
       if(auth.currentUser?.uid!==uid)throw Error('Account changed. Sign in again before syncing.');
       try{const result=await writer('facebook',{...item,expectedUid:uid},{publishToCollective:true});(result.created||result.published)?imported++:existing++}
       catch(error){failed++;if(!firstError)firstError=error.message||'Save failed.'}
     }
     const parts=[imported+' added to the Collective Feed; '+existing+' already saved.'];
     try{parts.push(await syncHometown(uid))}catch(error){parts.push(error.message)}
     if(failed)parts.push(failed+' could not be saved. '+firstError+' Retry sync.');
     if(data.missing?.length)parts.push('Grant personal content access to import '+data.missing.map(x=>x==='user_posts'?'posts':'photos').join(' and ')+'. Meta app approval may be required.');
     if(data.warnings?.length)parts.push(...data.warnings);
     if(!data.items?.length&&!data.missing?.length&&!data.warnings?.length)parts.push('Facebook returned no recent content.');
     state.syncMessage=parts.join(' ');
   })();
   try{return await syncing}finally{syncing=null;renderSync()}
 }
 function publish(){
   document.dispatchEvent(new CustomEvent('biglwa:facebook-personal-status'));
   renderSync();
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
       const links=window.BigLWAOrbitAccountLinks;
       if(state.profile?.link&&links?.save&&!links.get?.().facebook){
         try{await links.save('facebook',state.profile.link)}catch(error){console.warn('Facebook profile link could not be saved:',error.message)}
       }
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
   ...state.profile,link:state.profile.link||window.BigLWAOrbitAccountLinks?.get?.().facebook||'',id:'facebook',needsReauth:state.needsReauth,verifiedFromProvider:true
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
   if(result==='connected')load().then(()=>sync()).catch(error=>{state.syncMessage=error.message;renderSync()});
   else setTimeout(()=>notice(message),1000);
 }
 window.BigLWAFacebookPersonal=Object.freeze({load,connect,disconnect,sync,get,state});
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