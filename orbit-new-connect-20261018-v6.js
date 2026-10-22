/* Orbit X / Tumblr / Snapchat OAuth client.
 * No provider credentials enter browser storage; Firebase ID tokens are sent
 * to BIG LWA Worker only over TLS for user-bound start/session/disconnect.
 */
(()=>{
 'use strict';
 if(window.BigLWAOrbitOAuth)return;
 const base='https://api.biglwa.com';
 const providerIds=['x','snapchat','tumblr'];
 const callbackNotice=(()=>{
   try{
     const url=new URL(location.href);
     const id=url.searchParams.get('orbit_provider')||'';
     const status=url.searchParams.get('orbit_status')||'';
     if(!providerIds.includes(id)||!['connected','failed'].includes(status))return null;
     const message=url.searchParams.get('orbit_error')||'';
     for(const k of ['orbit_provider','orbit_status','orbit_error'])url.searchParams.delete(k);
     history.replaceState(history.state,'',url.href);
     return {id,status,error:message};
   }catch{return null}
 })();
 const config=Object.fromEntries(providerIds.map(id=>[id,{configured:false,missing:[],checked:false}]));
 const state={};
 let refsPromise=null,refreshing=null,loggedInUid='',authObserver=null;
 let mirrorPromise=null;
 const notify=()=>document.dispatchEvent(new CustomEvent('biglwa:new-orbit-status'));
 function callbackMessage(){
   if(!callbackNotice)return;
   const id=callbackNotice.id;
   const name=id==='x'?'X':id==='snapchat'?'Snapchat':'Tumblr';
   return notice(callbackNotice.status==='connected'
     ?name+' authorization returned. Your saved Orbit connection is being checked.'
     :name+' connection was not completed. '+(callbackNotice.error||'Please retry from Orbit.'));
 }
 function firebase(){
   if(!refsPromise)refsPromise=Promise.all([
     import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'),
     import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js')
   ]).then(([app,auth])=>{
     const instance=app.getApps()[0]||app.initializeApp({
       apiKey:'AIzaSyAPUT8_pLNxdh5tbGpAmXBJiID3jVcA9DY',
       authDomain:'biglwa.firebaseapp.com',projectId:'biglwa',
       appId:'1:83232670555:web:e04927b20458390b3b507e'
     });
     const currentAuth=auth.getAuth(instance);
    // The OAuth script can load before Firebase restores the browser session.
    // Refresh the provider state after the signed-in account resolves.
    if(!authObserver)authObserver=auth.onAuthStateChanged(currentAuth,user=>{
      if((user?.uid||'')!==loggedInUid)Promise.resolve().then(()=>load()).catch(
        error=>console.warn('Orbit OAuth auth restore:',error));
    });
    return currentAuth;
   }).catch(e=>{refsPromise=null;throw e});
   return refsPromise;
 }
 async function token(){
   const auth=await firebase();await auth.authStateReady();
   if(!auth.currentUser)throw Error('Sign in to BIG LWA before connecting a provider.');
   return {uid:auth.currentUser.uid,idToken:await auth.currentUser.getIdToken()};
 }
 async function query(provider,path,method='GET',idToken=''){
   const response=await fetch(base+'/'+provider+'/'+path,{
     method,headers:idToken?{Authorization:'Bearer '+idToken}:{},cache:'no-store'
   });
   const data=await response.json().catch(()=>({}));
   if(!response.ok)throw Error(data.error||(response.status===404?'OAuth endpoint not deployed yet.':'Provider request failed.'));
   return data;
 }
 function get(id){return state[id]||null}
 function configured(id){return config[id]||{configured:false,missing:[],checked:false}}
 function notice(message){
   const p=document.querySelector('#orbitPageStatus');
   if(p){p.textContent=String(message);p.classList.toggle('ok',false);return true}
   return false;
 }
 async function load(){
   if(refreshing)return refreshing;
   refreshing=(async()=>{
     const answers=await Promise.all(providerIds.map(async id=>{
       let health={configured:false,checked:true,missing:[]};
       try{const value=await query(id,'health');health={...value,checked:true}}
       catch(error){health.error=error.message}
       return [id,health];
     }));
     for(const [id,health] of answers)config[id]=health;
     try{
       const auth=await firebase();await auth.authStateReady();
       const user=auth.currentUser;const uid=user?.uid||'';
       if(!uid){loggedInUid='';for(const id of providerIds)delete state[id];notify();return}
       const idToken=await user.getIdToken();
       // Configuration health must not suppress a previously saved account session.
       if(loggedInUid!==uid)for(const id of providerIds)delete state[id];
       const results=await Promise.all(providerIds.map(async id=>{
         try{return [id,await query(id,'session','GET',idToken)]}
         catch(error){return [id,{sessionError:error?.message||'Session unavailable'}]}
       }));
       if((await firebase()).currentUser?.uid!==uid)return;
       loggedInUid=uid;
       for(const [id,response] of results){
         if(response?.sessionError){
           console.warn('Orbit '+id+' connection check:',response.sessionError);
           continue;
         }
         if(response?.connected&&response.profile){
           const profile=response.profile;
           const publicProfile={...profile};
           // Tumblr may return a custom domain, while the public link mirror
           // intentionally accepts official provider hosts only. Use Tumblr's
           // canonical profile URL for the shareable public destination.
           if(id==='tumblr' && publicProfile.username){
             try{
               const original=new URL(String(publicProfile.link||''));
               if(!original.hostname.endsWith('tumblr.com'))
                 publicProfile.link='https://www.tumblr.com/'+encodeURIComponent(publicProfile.username);
             }catch{
               publicProfile.link='https://www.tumblr.com/'+encodeURIComponent(publicProfile.username);
             }
           }
           state[id]={...publicProfile,id,needsReauth:!!response.needsReauth,
             verifiedFromProvider:true,lastVerifiedAt:Date.now()};
         }else delete state[id];
       }
     }catch(error){console.warn('Orbit new provider restore:',error)}
     if(loggedInUid)await mirrorProfiles(loggedInUid);
     notify();
   })();
   try{await refreshing}finally{refreshing=null}
 }
 async function mirrorProfiles(uid){
   if(mirrorPromise)return mirrorPromise;
   mirrorPromise=(async()=>{
     const auth=await firebase();await auth.authStateReady();
     if(auth.currentUser?.uid!==uid)return;
     const {getFirestore,doc,getDoc,setDoc,serverTimestamp}=await import(
       'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js');
     const db=getFirestore(auth.app),ref=doc(db,'users',uid);
     const snapshot=await getDoc(ref);
     if(auth.currentUser?.uid!==uid)return;
     const profiles={};
     for(const id of providerIds){
       const row=state[id];if(!row?.verifiedFromProvider)continue;
       let link='';
       try{
         const u=new URL(String(row.link||''));
         const host=u.hostname.toLowerCase();
         if(u.protocol==='https:'&&u.pathname!=='/'&&
           (id==='x'&&['x.com','www.x.com','twitter.com','www.twitter.com'].includes(host)||
            id==='tumblr'&&(host==='tumblr.com'||host==='www.tumblr.com'||host.endsWith('.tumblr.com'))||
            id==='snapchat'&&['snapchat.com','www.snapchat.com'].includes(host)))link=u.href;
       }catch{}
       if(link)profiles[id]={link,name:String(row.name||id).slice(0,100),
         label:id==='x'?'X':id==='tumblr'?'Tumblr':'Snapchat',
         username:String(row.username||'').slice(0,80),
         ...(id==='tumblr'?{blogCount:Math.max(0,Number(row.blogCount)||0)}:{})};
     }
     const previous=snapshot.data()?.orbitConnectedProfiles||{};
     if(JSON.stringify(previous)!==JSON.stringify(profiles)){
       await setDoc(ref,{orbitConnectedProfiles:profiles,orbitProfilesUpdatedAt:serverTimestamp()},
         {mergeFields:['orbitConnectedProfiles','orbitProfilesUpdatedAt']});
     }
     // The public usernames mirror is separate from the account-only record.
     await window.__biglwaConnections?.publishPublicLinks?.();
   })();
   try{await mirrorPromise}catch(error){console.warn('Orbit public profile mirror:',error)}
   finally{mirrorPromise=null}
 }
 async function connect(provider){
   if(!providerIds.includes(provider))throw Error('Unknown Orbit provider.');
   // Recheck on each click; credentials may have been added since page load.
   if(!config[provider]?.configured)await load();
   const health=config[provider];
   if(!health?.configured){
     const missing=health?.missing||[];
     const portal=provider==='snapchat'?'Snap Kit Developer Portal → Login Kit'
       :provider==='tumblr'?'Tumblr Applications → Consumer Key':'Developer Portal';
     throw Error(missing.length
       ? portal+': add '+missing.join(' and ')+' in Cloudflare Workers settings; then click Connect again.'
       : 'OAuth is not ready for '+provider+'. Check developer settings and try again.');
   }
   const user=await token();
   notice('Opening '+provider+' authorization…');
   const result=await query(provider,'start','POST',user.idToken);
   const uri=new URL(String(result.authorizeUrl||''));
   const valid=provider==='x'?['twitter.com','x.com']:provider==='tumblr'?['www.tumblr.com']:['accounts.snapchat.com'];
   if(uri.protocol!=='https:'||!valid.includes(uri.hostname))throw Error('Provider returned an invalid authorization destination.');
   window.location.assign(uri.href);
 }
 async function disconnect(provider){
   if(!providerIds.includes(provider))throw Error('Unknown provider.');
   const user=await token();
   await query(provider,'disconnect','POST',user.idToken);
   delete state[provider];
   await mirrorProfiles(user.uid);
   notify();
 }
 window.BigLWAOrbitOAuth=Object.freeze({load,connect,disconnect,get,configured,state});
 let callbackShown=false;
 const boot=()=>load().then(()=>{
   if(!callbackShown){callbackShown=callbackMessage()!==false}
 }).catch(error=>console.warn('New Orbit OAuth bootstrap:',error));
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
 else boot();
 document.addEventListener('biglwa:module-open',()=>{
   if(document.querySelector('#moduleWorkspace[data-module-key="orbit"]'))boot();
 });
 // OAuth return, restored logins, and returning tabs share one session truth.
 const resume=()=>{if(document.visibilityState==='hidden')return;load().catch(
   error=>console.warn('Orbit OAuth resume:',error))};
 window.addEventListener('pageshow',resume);
 window.addEventListener('focus',resume);
 document.addEventListener('visibilitychange',resume);
 window.addEventListener('biglwa:session-verified',resume);
 window.addEventListener('biglwa:identity-updated',resume);
})();
