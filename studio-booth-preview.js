/* Owner-only Booth contact strip. Unsaved captures stay in memory; saved account
   photos reappear on reload without publishing private photos to profile visitors. */
(()=>{'use strict';
 if(window.BigLWABoothPreview)return;
 let owner='',captures=[],saved=[],loading=false,auth=null,watching=false;
 const privateView=()=>!document.documentElement.classList.contains('biglwa-preview-mode')&&!window.__biglwaPublicStorageView;
 const uid=()=>String(auth?.currentUser?.uid||window.BigLWAAccountStorage?.uid||window.__biglwaIdentity?.uid||'');
 function boundary(){const next=uid();if(next!==owner){owner=next;captures=[];saved=[];}return privateView()&&!!owner;}
 function paint(){
  const host=document.querySelector('#studioApp #camera .contact-sheet');if(!host)return;
  let strip=host.querySelector('.booth-recent-film');
  if(!boundary()){strip?.remove();return;}
  if(!strip){strip=document.createElement('aside');strip.className='booth-recent-film';strip.setAttribute('aria-label','Your recent Booth photos');host.append(strip);}
  const photos=[...captures,...saved].filter((x,i,a)=>a.findIndex(y=>y.url===x.url)===i).slice(0,4);
  const signature=owner+'|'+photos.map(p=>p.url).join('|');if(strip.dataset.signature===signature)return;
  strip.dataset.signature=signature;strip.replaceChildren();
  for(let i=0;i<4;i++){
   const frame=document.createElement('span');frame.className='booth-recent-frame';
   if(photos[i]){const img=document.createElement('img');img.src=photos[i].url;img.alt='Recent Booth photo '+(i+1);img.loading='lazy';img.addEventListener('error',()=>{captures=captures.filter(p=>p.url!==img.src);saved=saved.filter(p=>p.url!==img.src);paint()},{once:true});frame.append(img);}
   else {frame.textContent='';frame.setAttribute('aria-label','No recent Booth photo');}
   strip.append(frame);
  }
 }
 function capture(canvas){
  if(!boundary())return;
  const small=document.createElement('canvas');small.width=320;small.height=Math.round(canvas.height*320/canvas.width);
  small.getContext('2d').drawImage(canvas,0,0,small.width,small.height);
  captures.unshift({url:small.toDataURL('image/jpeg',.78)});captures=captures.slice(0,4);paint();
 }
 async function refresh(){
  paint();if(!privateView()||loading)return;loading=true;
  try{
   const [app,a,fs]=await Promise.all([import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'),import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js'),import('https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js')]);
   if(!app.getApps().length)return;
   auth=a.getAuth(app.getApps()[0]);await auth.authStateReady();
   if(!watching){watching=true;a.onAuthStateChanged(auth,()=>{boundary();paint();setTimeout(refresh,0)});}
   if(!boundary())return;const expected=owner;
   const records=await fs.getDocs(fs.query(fs.collection(fs.getFirestore(auth.app),'users',expected,'posts'),fs.where('source','==','photobooth')));
   if(uid()!==expected||!privateView())return;
   saved=records.docs.map(d=>({id:d.id,...d.data()})).filter(p=>p.uid===expected&&!['archived','pending_delete'].includes(p.state)&&!['archived','pending_delete'].includes(p.archiveState))
    .sort((a,b)=>(b.sourceCreatedAtMs||b.createdAt?.toMillis?.()||0)-(a.sourceCreatedAtMs||a.createdAt?.toMillis?.()||0))
    .map(p=>({url:p.imageUrl||p.thumbnailUrl||p.imageUrls?.[0]||''})).filter(p=>/^https:\/\//.test(p.url)).slice(0,12);
   paint();
  }catch(error){console.warn('Booth preview could not refresh:',error?.code||'unavailable');}
  finally{loading=false;}
 }
 window.BigLWABoothPreview=Object.freeze({capture,refresh});
 for(const event of ['biglwa:session-verified','biglwa:public-profile-ended','biglwa:orbit-imported'])window.addEventListener(event,refresh);
 window.addEventListener('biglwa:public-profile-ready',paint);
 document.addEventListener('biglwa:feed-ready',refresh);
 document.addEventListener('biglwa:module-close',refresh);
 let pending=false;
 new MutationObserver(()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;paint()})}).observe(document.documentElement,{childList:true,subtree:true});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});else refresh();
})();
