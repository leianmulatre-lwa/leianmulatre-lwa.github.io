/* Booth filmstrip: saved account captures take priority over page-picked sample
   stills from the same local collection as the Boards Studio thumbnail.
   Samples are decorative and never saved, uploaded, or attributed to a member.
   Public profile previews must never reveal private member captures. */
(()=>{'use strict';
 if(window.BigLWABoothPreview)return;
 const FALLBACK_SAMPLES=Object.freeze(["/boards%20temp%20thumbnail/0b6e427c1b03b0a862e18119fc5a946d.jpg","/boards%20temp%20thumbnail/15b2005e7f894079f5461a5612b8b2ec.jpg","/boards%20temp%20thumbnail/1e11bab1fe6c29fc6c0eef146f0064d7.jpg","/boards%20temp%20thumbnail/2a7294cb4c09b2b863d15a023090d019.jpg","/boards%20temp%20thumbnail/5156b0b96eb6a8248e54280d2c6ba900.jpg","/boards%20temp%20thumbnail/61ba5b5f5dd60e46f636c9cde3479eae.jpg","/boards%20temp%20thumbnail/a4d68aa776aac96bb0054c628e7d3e18.jpg","/boards%20temp%20thumbnail/b8ce4928ebccf42c9ecc749fe0b347e9.jpg","/boards%20temp%20thumbnail/e642fae88aa023fc8124ead156cff138.jpg","/boards%20temp%20thumbnail/eecc0dabc950626bd32c902f28c4e7fa.jpg","/boards%20temp%20thumbnail/fb0612c7df6af82845036d2e3e06e32a.jpg"]);
 const SAMPLE_URL=/^\/boards%20temp%20thumbnail\/[a-f0-9]{32}\.jpg$/;
 let owner='',captures=[],saved=[],loading=false,auth=null,watching=false;
 // Shuffle the fallback order once per document; later paints reuse it.
 const sampleOrder=new Map(FALLBACK_SAMPLES.map(url=>[url,Math.random()]));
 const failedSamples=new Set();
 const privateView=()=>!document.documentElement.classList.contains('biglwa-preview-mode')&&!window.__biglwaPublicStorageView;
 const uid=()=>String(auth?(auth.currentUser?.uid||''):(window.BigLWAAccountStorage?.uid||window.__biglwaIdentity?.uid||''));
 function boundary(){
  const next=uid();
  if(next!==owner){owner=next;captures=[];saved=[];}
  return privateView()&&!!owner;
 }
 function samplePool(){
  const boards=window.__biglwaBoardsTemporaryPhotos?.();
  const entries=Array.isArray(boards)&&boards.length?boards:FALLBACK_SAMPLES;
  const valid=entries.filter(x=>typeof x==='string'&&SAMPLE_URL.test(x)&&!failedSamples.has(x));
  for(const url of valid)if(!sampleOrder.has(url))sampleOrder.set(url,Math.random());
  return [...new Set(valid)].sort((a,b)=>sampleOrder.get(a)-sampleOrder.get(b));
 }
 function paint(){
  const host=document.querySelector('#studioApp #camera .contact-sheet');
  if(!host)return;
  // In public preview render only decorative sample photos. Never render,
  // read, or transfer the signed-in owner's private capture URLs.
  const owned=boundary();
  let strip=host.querySelector('.booth-recent-film');
  if(!strip){
   strip=document.createElement('aside');strip.className='booth-recent-film';
   host.append(strip);
  }
  const photos=owned?[...captures,...saved]
   .filter((x,i,a)=>x?.url&&a.findIndex(y=>y.url===x.url)===i).slice(0,4):[];
  const pool=samplePool();
  const samplesNeeded=Math.max(0,4-photos.length);
  const samples=Array.from({length:samplesNeeded},(_,i)=>
   pool.length?pool[i % pool.length]:'');
  const signature=(owned?owner:'public-samples-only')+'|'+
   photos.map(p=>p.url).join('|')+'|'+samples.join('|');
  strip.dataset.samplesOnly=String(!owned);
  strip.dataset.sampleCount=String(samples.filter(Boolean).length);
  strip.setAttribute('aria-label',owned?
   'Recent Booth photos with temporary sample images':
   'Sample Booth film-strip preview');
  if(strip.dataset.signature===signature)return;
  strip.dataset.signature=signature;
  strip.replaceChildren();
  for(let i=0;i<4;i++){
   const frame=document.createElement('span');
   frame.className='booth-recent-frame';
   if(photos[i]){
    const img=document.createElement('img');
    img.src=photos[i].url;img.alt='Recent Booth photo '+(i+1);
    img.loading='lazy';img.decoding='async';
    img.addEventListener('error',()=>{
     captures=captures.filter(p=>p.url!==img.src);
     saved=saved.filter(p=>p.url!==img.src);
     paint();
    },{once:true});
    frame.append(img);
   }else if(samples[i-photos.length]){
    const sample=samples[i-photos.length];
    frame.classList.add('booth-temporary-frame');
    frame.setAttribute('aria-label','Temporary preview image, not a saved Booth photo');
    const img=document.createElement('img');
    img.className='booth-temporary-photo';
    img.src=sample;img.alt='';img.setAttribute('aria-hidden','true');
    img.loading='eager';img.decoding='async';
    img.addEventListener('error',()=>{
     failedSamples.add(sample);paint();
    },{once:true});
    frame.append(img);
   }else{
    frame.setAttribute('aria-label','No photo available');
   }
   strip.append(frame);
  }
 }
 function capture(canvas){
  if(!boundary())return;
  const small=document.createElement('canvas');
  small.width=320;small.height=Math.round(canvas.height*320/canvas.width);
  small.getContext('2d').drawImage(canvas,0,0,small.width,small.height);
  captures.unshift({url:small.toDataURL('image/jpeg',.78)});
  captures=captures.slice(0,4);paint();
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
 document.addEventListener('biglwa:pinterest-preview-updated',paint);
 document.addEventListener('biglwa:feed-ready',refresh);
 document.addEventListener('biglwa:module-close',refresh);
 let pending=false;
 new MutationObserver(()=>{
  if(pending)return;pending=true;
  requestAnimationFrame(()=>{pending=false;paint()});
 }).observe(document.documentElement,{childList:true,subtree:true});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});else refresh();
})();