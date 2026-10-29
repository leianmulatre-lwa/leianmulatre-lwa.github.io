/* BIG LWA owner-controlled Highlight editor for the existing Edit Profile panel.
   Original imported media remains unchanged. We save only titles, covers,
   selection/order and explicitly added media. Small JPEG circle-cover previews
   are capped to avoid unbounded Firestore data or browser-only blob URLs. */
(()=>{'use strict';
 const el=(s,root=document)=>root.querySelector(s);
 const each=(s,root=document)=>[...root.querySelectorAll(s)];
 const owner=()=>String(window.__biglwaIdentity?.uid||window.BigLWAAccountStorage?.uid||'');
 const storageKey=()=>owner()?'biglwaHighlightEditsV1:'+owner():'';
 const cleanUrl=(raw,image=false)=>{
  const value=String(raw||'').trim();
  if(image&&/^data:image\/jpeg;base64,[A-Za-z0-9+/=]{1,36000}$/.test(value))return value;
  if(value.startsWith('/assets/highlights/')&&image&&/^\/assets\/highlights\/[a-zA-Z0-9._-]+$/.test(value))return value;
  try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&u.href.length<1300?u.href:''}catch{return ''}
 };
 const cleanItem=(raw)=>{
  const mediaUrl=cleanUrl(raw?.mediaUrl);
  return mediaUrl?{kind:raw.kind==='video'?'video':'image',mediaUrl}:null;
 };
 const empty=()=>({version:1,imported:{},custom:[]});
 const safeEntry=(raw={})=>({
  title:String(raw.title||'').trim().slice(0,48),
  cover:cleanUrl(raw.cover,true),x:Math.max(0,Math.min(100,Number(raw.x)||50)),
  y:Math.max(0,Math.min(100,Number(raw.y)||50)),hidden:!!raw.hidden,
  order:Array.isArray(raw.order)?[...new Set(raw.order.filter(x=>Number.isInteger(x)&&x>=0&&x<100))].slice(0,50):null,
  added:Array.isArray(raw.added)?raw.added.map(cleanItem).filter(Boolean).slice(0,12):[],
  platform:['snapchat','facebook'].includes(raw.platform)?raw.platform:'instagram'
 });
 const normalize=(raw)=>{
  const result=empty();
  if(!raw||typeof raw!=='object')return result;
  for(const [k,v] of Object.entries(raw.imported||{})){
   if((/^\d{1,2}$/.test(k)&&Number(k)<24||/^(?:snapchat|facebook):(?:\d|1\d|2[0-3])$/.test(k))&&v&&typeof v==='object')result.imported[k]=safeEntry(v);
  }
  if(Array.isArray(raw.custom))result.custom=raw.custom.slice(0,8).map(c=>({...safeEntry(c),id:String(c?.id||'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,70)||'h'+Math.random().toString(36).slice(2)}));
  return result;
 };
 let state=empty(),publicState=null,stateOwner='',remoteLoaded=false,saveBusy=false;
 const isPreview=()=>!!window.__biglwaPublicStorageView||document.documentElement.classList.contains('biglwa-preview-mode');
 const get=()=>{if(isPreview())return publicState||empty();const who=owner();if(!who)return empty();if(stateOwner!==who){stateOwner=who;remoteLoaded=false;try{state=normalize(JSON.parse(localStorage.getItem(storageKey())||'null'))}catch{state=empty()}}return state};
 const archiveSource=()=>{
  try{
   const parsed=JSON.parse(localStorage.getItem('biglwaArchiveFilters')||'null');
   return Array.isArray(parsed?.sources)&&parsed.sources.length===1
     ?String(parsed.sources[0]).toLowerCase():'all';
  }catch{return 'all'}
 };
 const platformOf=group=>String(group?.platform||'instagram').toLowerCase();
 const source=()=>{
  const platform=archiveSource();
  if(!['instagram','snapchat','facebook'].includes(platform))return [];
  const data=window.BigLWAImportedHighlights?.source?.();
  const sourceHandle=String(data?.handle||'').toLowerCase();
  // The static legacy Instagram snapshot is not a universal import. Never
  // expose another member's collection just because they opened Archive.
  const live=window.__biglwaInstagramOrbit?.state;
  const connected=window.__biglwaConnections?.connections?.()?.instagram;
  const verifiedHandles=[live?.connected?live.profile?.username:null,
    connected?.verifiedFromProvider?connected.username:null]
    .map(value=>String(value||'').replace(/^@/,'').toLowerCase()).filter(Boolean);
  const linked=window.BigLWASocialShowcase?.highlightsFor?.(platform)||[];
  if(sourceHandle&&!verifiedHandles.includes(sourceHandle))return linked;
  const imported=Array.isArray(data?.highlights)?data.highlights:[];
  return [...imported.map((group,i)=>({...group,_importKey:String(i)}))
   .filter(group=>platformOf(group)===platform),...linked];
 };
 const status=message=>{const box=el('#biglwaHighlightStatus');if(box)box.textContent=message};
 const pictureStatus=message=>{const box=el('#biglwaProfilePictureStatus');if(box)box.textContent=message};
 function applyCover(img,record){
  img.style.objectPosition=(record.x??50)+'% '+(record.y??50)+'%';
 }
 function customize(group,index){
  const entry=get().imported[String(index)];
  if(!entry)return {...group};
  if(entry.hidden)return null;
  const count=Array.isArray(group.items)?group.items.length:0;
  const order=entry.order===null?[...Array(count).keys()]:entry.order.filter(i=>i<count);
  return {...group,title:entry.title||group.title,cover:entry.cover||group.cover,
   coverX:entry.x,coverY:entry.y,
   items:[...order.map(i=>group.items[i]),...entry.added]};
 }
 const current=()=>get().custom.filter(x=>!x.hidden&&x.added.length).map(x=>({
  title:x.title||'Highlight',cover:x.cover||'',coverX:x.x,coverY:x.y,
  platform:platformOf(x),items:x.added,customId:x.id
 }));
 function refresh(){window.dispatchEvent(new Event('biglwa:highlight-config-changed'))}
 // A provider owns its own Highlights. No global or cross-app button.
 function highlightsInScope(){
  const platform=archiveSource();
  if(platform==='instagram'||platform==='snapchat')return true;
  // Facebook can opt in when genuine imported Highlight groups exist.
  return platform==='facebook'&&source().length>0;
 }
 function saveHighlightToBoards(imageUrl,caption,sourceUrl){
  let items=[];
  try{const raw=JSON.parse(localStorage.getItem('biglwaModule_boards')||'[]');items=Array.isArray(raw)?raw:[]}catch{}
  items.unshift({
   title:(caption||'Highlight photo').slice(0,120),
   meta:[imageUrl,sourceUrl||''].filter(Boolean).join(' · '),
   photo:imageUrl,sourceUrl:sourceUrl||'',date:new Date().toLocaleDateString()
  });
  localStorage.setItem('biglwaModule_boards',JSON.stringify(items.slice(0,500)));
  document.dispatchEvent(new CustomEvent('biglwa:boards-updated'));
  return 'Saved to Boards.';
 }
 async function copyHighlightImage(imageUrl){
  const response=await fetch(imageUrl,{mode:'cors',credentials:'omit'});
  if(!response.ok)throw Error('The original photo blocked the copy.');
  const blob=await response.blob();
  if(!blob.size||!/^image\//i.test(blob.type))throw Error('The original photo blocked the copy.');
  return blob;
 }
 async function copyHighlightToFeed(imageUrl,caption,sourceUrl){
  const publisher=window.__biglwaCollectivePublish;
  if(typeof publisher?.createFeedDraft!=='function')throw Error('The Collective Feed is still loading. Try again in a moment.');
  let blob=null;
  try{blob=await copyHighlightImage(imageUrl)}catch{}
  /* A copied image is uploaded into BIG LWA storage. When the source refuses that copy the
     post still goes out as a link back to the original rather than failing outright. */
  const draft=blob
   ?await publisher.createFeedDraft({blob,caption})
   :await publisher.createFeedDraft({url:sourceUrl||imageUrl,caption});
  if(!draft?.id)throw Error('That highlight could not be posted.');
  const orbit=window.__biglwaOrbitPosts;
  if(typeof orbit?.publishOrbitPost==='function')await orbit.publishOrbitPost(draft.id);
  else if(typeof orbit?.setOrbitState==='function')await orbit.setOrbitState(draft.id,'approved');
  return draft.id;
 }
 async function featureHighlightOnVeve(postId){
  const [{getApps,initializeApp},{getAuth},{getFirestore,doc,updateDoc,setDoc}]=await Promise.all([
   import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'),
   import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js'),
   import('https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js')
  ]);
  const app=getApps()[0]||initializeApp({
   apiKey:'AIzaSyAPUT8_pLNxdh5tbGpAmXBJiID3jVcA9DY',
   authDomain:'biglwa.firebaseapp.com',projectId:'biglwa',appId:'1:83232670555:web:e04927b20458390b3b507e'
  });
  const user=getAuth(app).currentUser;
  if(!user)throw Error('Sign in to send a highlight to Veve.');
  const db=getFirestore(app);
  const patch={veveFeatured:true,veveOptOut:false};
  await updateDoc(doc(db,'posts',postId),patch);
  try{await setDoc(doc(db,'users',user.uid,'posts',postId),patch,{merge:true})}catch(error){console.warn('Veve profile mirror could not update:',error)}
  document.dispatchEvent(new CustomEvent('biglwa:feed-ready'));
 }
 async function sendHighlightPhoto(destination,imageUrl,caption,sourceUrl){
  if(destination==='boards')return saveHighlightToBoards(imageUrl,caption,sourceUrl);
  const postId=await copyHighlightToFeed(imageUrl,caption,sourceUrl);
  if(destination==='veve'){
   await featureHighlightOnVeve(postId);
   return 'Sent to Veve. The post stays on your Collective Feed.';
  }
  return 'Posted to My Feed.';
 }
 async function remote(){
  if(!owner()||remoteLoaded)return;
  try{
   const snap=await window.BigLWAUserDirectory?.loadProfile?.();
   if(snap?.uid===owner()&&snap.customization?.session?.highlightEdits){
    state=normalize(snap.customization.session.highlightEdits);
    localStorage.setItem(storageKey(),JSON.stringify(state));
   }
   if(snap?.uid===owner())remoteLoaded=true;
  }catch{}
  refresh();render();
 }
 function toImage(file){
  return new Promise((resolve,reject)=>{
   if(!file||!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)||file.size>5*1024*1024)
    return reject(Error('Use a JPG, PNG, GIF or WebP under 5 MB.'));
   const url=URL.createObjectURL(file),image=new Image();
   const finish=()=>URL.revokeObjectURL(url);
   image.onerror=()=>{finish();reject(Error('Could not read this picture.'))};
   image.onload=()=>{
    try{
     const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
     const ctx=canvas.getContext('2d');if(!ctx)throw Error('Image editing is unavailable.');
     const side=Math.min(image.naturalWidth,image.naturalHeight),x=(image.naturalWidth-side)/2,y=(image.naturalHeight-side)/2;
     ctx.drawImage(image,x,y,side,side,0,0,128,128);
     const data=canvas.toDataURL('image/jpeg',.57);
     if(data.length>36000)throw Error('This cover is too complex to sync. Try a simpler image.');
     finish();resolve(data);
    }catch(error){finish();reject(error)}
   };
   image.src=url;
  });
 }
 async function uploadHighlightImage(file){
  if(!file||!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)||file.size>8*1024*1024)
   throw Error('Choose a JPG, PNG, WebP or GIF under 8 MB.');
  const [{initializeApp,getApps},{getAuth}]=await Promise.all([
   import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'),
   import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js')
  ]);
  const app=getApps()[0]||initializeApp({
   apiKey:'AIzaSyAPUT8_pLNxdh5tbGpAmXBJiID3jVcA9DY',
   authDomain:'biglwa.firebaseapp.com',projectId:'biglwa',appId:'1:83232670555:web:e04927b20458390b3b507e'
  });
  const auth=getAuth(app);await auth.authStateReady();
  const user=auth.currentUser;
  if(!user||user.uid!==owner())throw Error('Sign in to your own account before uploading highlight media.');
  const response=await fetch('https://biglwa-instagram-api.leianmulatre-284.workers.dev/media/feed-image',{
   method:'POST',headers:{Authorization:'Bearer '+await user.getIdToken(),'Content-Type':file.type},body:file
  });
  const payload=await response.json().catch(()=>({}));
  if(!response.ok)throw Error(payload.error||'Image upload failed.');
  const url=cleanUrl(payload.url);
  if(!url)throw Error('The upload did not return a usable image URL.');
  return url;
 }
 const make=(tag,className,text)=>{const n=document.createElement(tag);if(className)n.className=className;if(text!=null)n.textContent=text;return n};
 const input=(type,value,label,action)=>{
  const l=make('label','',label),n=document.createElement(type==='textarea'?'textarea':'input');
  if(type!=='textarea')n.type=type; n.value=value??''; if(type==='textarea')n.rows=3;
  n.addEventListener('input',()=>action(n.value));l.append(n);return l;
 };
 function row(group,key,isImported,index){
  const data=isImported?get().imported[key]||safeEntry({title:group.title,cover:group.cover}):group;
  const wrap=make('section','highlight-edit-row');
  wrap.dataset.highlightRow=key;
  const head=make('div','highlight-edit-row-head');
  wrap.dataset.highlightImported=isImported?'true':'false';
  const circle=make('span','highlight-edit-cover');
  const picture=document.createElement('img');picture.alt='Highlight cover preview';
  picture.src=data.cover||group.cover||'/assets/tv-no-signal.svg';applyCover(picture,data);circle.append(picture);
  const h=make('strong','',isImported?'Imported highlight '+(index+1):'Custom highlight');
  const adjustButton=make('button','highlight-cover-adjust-button','Adjust');
  adjustButton.type='button';adjustButton.setAttribute('aria-pressed','false');
  adjustButton.setAttribute('aria-label','Adjust '+(data.title||group.title||'highlight')+' circle cover by dragging');
  const headActions=make('div','highlight-row-head-actions');
  headActions.append(h,adjustButton);
  head.append(circle,headActions);wrap.append(head);
  // Explicit opt-in dragging: crop positions are persisted with the existing
  // Highlight record (x/y), without modifying the imported original image.
  let adjusting=false,drag=null;
  const clamp=v=>Math.max(0,Math.min(100,Math.round(v)));
  const place=(x,y)=>{data.x=clamp(x);data.y=clamp(y);applyCover(picture,data)};
  const enableAdjust=on=>{
   adjusting=on;drag=null;
   circle.classList.toggle('is-adjusting',on);
   circle.style.touchAction=on?'none':'';
   circle.tabIndex=on?0:-1;
   adjustButton.setAttribute('aria-pressed',String(on));
   adjustButton.textContent=on?'Done':'Adjust';
   circle.setAttribute('aria-label',on?'Drag to reposition cover. Arrow keys also work.':'Highlight cover preview');
  };
  adjustButton.addEventListener('click',()=>{enableAdjust(!adjusting);if(adjusting)circle.focus()});
  circle.addEventListener('pointerdown',event=>{
   if(!adjusting||event.button!==0)return;
   event.preventDefault();
   drag={pointer:event.pointerId,x:event.clientX,y:event.clientY,coverX:data.x??50,coverY:data.y??50};
   try{circle.setPointerCapture(event.pointerId)}catch{}
  });
  circle.addEventListener('pointermove',event=>{
   if(!adjusting||!drag||drag.pointer!==event.pointerId)return;
   event.preventDefault();
   const box=circle.getBoundingClientRect();
   const size=Math.max(1,box.width);
   place(drag.coverX+(event.clientX-drag.x)*100/size,drag.coverY+(event.clientY-drag.y)*100/size);
  });
  const endDrag=event=>{if(drag?.pointer===event.pointerId)drag=null};
  circle.addEventListener('pointerup',endDrag);
  circle.addEventListener('pointercancel',endDrag);
  circle.addEventListener('lostpointercapture',()=>{drag=null});
  circle.addEventListener('keydown',event=>{
   if(!adjusting||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
   event.preventDefault();
   const step=event.shiftKey?10:3;
   place((data.x??50)+(event.key==='ArrowLeft'?-step:event.key==='ArrowRight'?step:0),
         (data.y??50)+(event.key==='ArrowUp'?-step:event.key==='ArrowDown'?step:0));
  });
  const fields=make('div','highlight-edit-fields');
  const title=input('text',data.title||group.title||'','Name',value=>{data.title=value.slice(0,48);});
  title.querySelector('input').maxLength=48;fields.append(title);
  const covers=make('div','highlight-cover-controls');
  covers.append(make('p','highlight-cover-adjust-hint','Select Adjust above, then drag the circle cover to reposition it.'));
  const advanced=make('details','highlight-cover-advanced');
  advanced.append(make('summary','','Cover image URL (optional)'));
  advanced.append(input('text',data.cover||'','Paste direct HTTPS cover URL',value=>{
   const url=cleanUrl(value,true);if(url){data.cover=url;picture.src=url;applyCover(picture,data)}
   else if(!value.trim()){data.cover='';picture.src=group.cover||'/assets/tv-no-signal.svg';applyCover(picture,data)}
  }));
  covers.append(advanced);
  const upload=make('label','highlight-upload-label','Upload circle cover');
  const file=make('input');file.type='file';file.accept='image/jpeg,image/png,image/webp,image/gif';
  file.setAttribute('aria-label','Upload highlight cover');
  file.addEventListener('change',async()=>{
   try{status('Preparing cover…');const result=await toImage(file.files?.[0]);data.cover=result;picture.src=result;
    const field=covers.querySelector('input[type=text]');if(field)field.value='';status('Cover ready. Save Highlights to keep it.')}
   catch(e){status(e.message)}finally{file.value=''}
  });
  upload.append(file);covers.append(upload);
  fields.append(covers);
  const rows=make('div','highlight-edit-items');
  if(isImported){
   const items=group.items||[];
   const selection=data.order===null?[...Array(items.length).keys()]:data.order.filter(i=>i<items.length);
   const label=make('strong','',items.length+' imported items · choose visible content');
   rows.append(label);
   const gallery=make('div','highlight-item-gallery');
   gallery.setAttribute('aria-label','Choose highlights to show live on the profile');
   items.forEach((item,i)=>{
    const kind=item?.kind==='video'?'video':'image';
    const card=make('div','highlight-item-card');
    const checkbox=make('input');checkbox.type='checkbox';checkbox.checked=selection.includes(i);
    checkbox.className='highlight-item-live-input';
    checkbox.setAttribute('aria-label',(checkbox.checked?'Keep ':'Show ')+(kind==='video'?'video ':'photo ')+(i+1)+' live');
    const preview=make('span','highlight-item-media');
    const thumb=cleanUrl(item?.thumbnail||item?.poster||item?.cover,true);
    const photo=cleanUrl(item?.mediaUrl,true);
    if(kind==='video'&&!thumb){
     const video=make('video');video.muted=true;video.defaultMuted=true;video.playsInline=true;video.preload='metadata';
     video.poster=cleanUrl(group.cover,true)||'/assets/tv-no-signal.svg';
     if(photo)video.src=photo;
     preview.append(video);
    }else{
     const image=make('img');image.alt='';image.loading='lazy';image.referrerPolicy='no-referrer';
     image.src=thumb||(kind==='image'?photo:'')||cleanUrl(group.cover,true)||'/assets/tv-no-signal.svg';
     image.onerror=()=>{image.onerror=null;image.src=cleanUrl(group.cover,true)||'/assets/tv-no-signal.svg'};
     preview.append(image);
    }
    const kindTag=make('span','highlight-item-kind',kind==='video'?'▶ Video':'Photo');
    const name=make('span','highlight-item-name',''+(i+1));
    const live=make('b','',checkbox.checked?'Live':'Hidden');
    const liveSwitch=make('label','archive-live highlight-item-live');
    const liveTrack=make('span','archive-live-track');liveTrack.setAttribute('aria-hidden','true');liveTrack.append(make('i'));
    liveSwitch.append(checkbox,liveTrack,live);
    card.dataset.live=String(checkbox.checked);
    card.append(preview,kindTag,name,liveSwitch);
    checkbox.addEventListener('change',()=>{
     const all=data.order===null?[...Array(items.length).keys()]:data.order.slice();
     data.order=checkbox.checked?[...all.filter(v=>v!==i),i]:all.filter(v=>v!==i);
     card.dataset.live=String(checkbox.checked);
     live.textContent=checkbox.checked?'Live':'Hidden';
     checkbox.setAttribute('aria-label',(checkbox.checked?'Keep ':'Show ')+(kind==='video'?'video ':'photo ')+(i+1)+' live');
    });
    /* A highlight photo can leave the Archive for the Feed, Veve, or the Boards list the
       same way a Pinterest card can. Videos keep their single job: playing in place. */
    if(kind==='image'){
     const send=make('details','highlight-item-send');
     send.append(make('summary','','Send to'));
     const menu=make('div','highlight-item-send-menu');
     const sendStatus=make('small','highlight-item-send-status');sendStatus.setAttribute('role','status');
     for(const [destination,label] of [['feed','My Feed'],['veve','Veve'],['boards','Boards']]){
      const button=make('button','',label);button.type='button';button.dataset.highlightSend=destination;
      button.addEventListener('click',async()=>{
       if(button.dataset.busy==='1')return;
       const imageUrl=photo||thumb;
       if(!imageUrl){sendStatus.textContent='This photo has no direct image link.';return}
       button.dataset.busy='1';
       menu.querySelectorAll('button').forEach(other=>other.disabled=true);
       sendStatus.textContent='Sending to '+label+'…';
       try{
        sendStatus.textContent=await sendHighlightPhoto(destination,imageUrl,
          String(group.title||data.title||'Highlight').slice(0,300),
          cleanUrl(item?.sourceUrl||item?.permalink||''));
        send.open=false;
       }catch(error){sendStatus.textContent=error?.message||'Could not send this photo.'}
       finally{menu.querySelectorAll('button').forEach(other=>other.disabled=false);button.dataset.busy='0'}
      });
      menu.append(button);
     }
     send.append(menu,sendStatus);
     card.append(send);
    }
    gallery.append(card);
   });
   rows.append(gallery);
  }else rows.append(make('strong','','Highlight content'));
  const added=make('div','highlight-extra-media');
  const updateAdded=()=>{added.replaceChildren();
   data.added.forEach((media,i)=>{
    const entry=make('div','highlight-row-actions');
    entry.append(make('span','', (media.kind==='video'?'Video ':'Image ')+(i+1)));
    const remove=make('button','','Remove');remove.type='button';
    remove.addEventListener('click',()=>{data.added.splice(i,1);updateAdded()});entry.append(remove);added.append(entry);
   });
  };updateAdded();
  const mediaForm=make('div','highlight-edit-actions');
  const url=make('input');url.type='url';url.placeholder='https://… image or video URL';url.setAttribute('aria-label','Add image or video to highlight');
  const type=make('select');type.setAttribute('aria-label','New highlight media type');
  for(const k of ['image','video']){const option=make('option','',k==='image'?'Image':'Video');option.value=k;type.append(option)}
  const add=make('button','','Add content');add.type='button';
  add.onclick=()=>{const item=cleanItem({kind:type.value,mediaUrl:url.value});
   if(!item){status('Use a direct HTTPS image or video link.');return}
   if(data.added.length>=12){status('Maximum 12 additional items per highlight.');return}
   data.added.push(item);url.value='';updateAdded();
  };const mediaUploadLabel=make('label','highlight-upload-label','Upload photo');
  const photoFile=make('input');photoFile.type='file';photoFile.accept='image/jpeg,image/png,image/webp,image/gif';
  photoFile.setAttribute('aria-label','Upload new highlight photo to BIG LWA');
  photoFile.addEventListener('change',async()=>{
   if(!photoFile.files?.[0])return;
   try{
    status('Uploading image to BIG LWA…');
    const photoUrl=await uploadHighlightImage(photoFile.files[0]);
    if(data.added.length>=12){status('Maximum 12 additional items per highlight.');return}
    data.added.push({kind:'image',mediaUrl:photoUrl});
    updateAdded();status('Photo uploaded. Save Highlights to publish it.');
   }catch(e){status(e.message||'Photo upload failed.')}finally{photoFile.value=''}
  });mediaUploadLabel.append(photoFile);
  mediaForm.append(url,type,add,mediaUploadLabel);
  rows.append(added,mediaForm);fields.append(rows);
  const controls=make('div','highlight-row-actions');
  const hidden=make('label','','Hide from banner');const checked=make('input');checked.type='checkbox';checked.checked=data.hidden;checked.onchange=()=>{data.hidden=checked.checked;wrap.setAttribute('aria-disabled',String(data.hidden))};hidden.prepend(checked);controls.append(hidden);
  if(!isImported){
   const remove=make('button','','Delete highlight');remove.type='button';remove.onclick=()=>{state.custom=state.custom.filter(h=>h.id!==data.id);render()};
   controls.append(remove);
  }
  fields.append(controls);wrap.append(fields);wrap.setAttribute('aria-disabled',String(data.hidden));
  if(isImported)get().imported[key]=data;
  return wrap;
 }
 function render(){
  const container=el('#biglwaHighlightEditorList');if(!container)return;
  if(!owner()){container.replaceChildren();return;}
  const oldFocus=document.activeElement?.dataset?.highlightRow;
  container.replaceChildren();
  const platform=archiveSource(),groups=source();
  const custom=get().custom.filter(g=>platformOf(g)===platform);
  container.dataset.highlightPlatform=platform;
  container.dataset.highlightLayout=platform==='snapchat'||(groups.length+custom.length<=1)?'single':'masonry';
  groups.slice(0,24).forEach((g,i)=>container.append(row(g,g._importKey||String(i),true,i)));
  custom.forEach((g,i)=>container.append(row(g,g.id,false,i)));
  if(!groups.length&&!custom.length)container.append(make('p','highlight-editor-intro','No '+platform+' highlights imported yet. Add one of your own below.'));
  if(oldFocus)el('[data-highlight-row="'+oldFocus+'"]',container)?.focus?.();
 }
 async function save(){
  if(saveBusy)return;
  const who=owner();if(!who){status('Sign in to save highlights.');return}
  saveBusy=true;status('Saving highlights to your BIG LWA account…');
  const payload=normalize(get());
  try{
   const saved=await window.BigLWAUserDirectory?.saveCustomizations?.({session:{highlightEdits:payload}});
   if(saved!==true||owner()!==who)throw Error('Account sync could not be confirmed. Changes were not published.');
   state=payload;
   localStorage.setItem(storageKey(),JSON.stringify(payload));remoteLoaded=true;
   status('Highlights saved to your account.');refresh();render();
  }catch(e){status(e.message||'Could not save highlights.')}finally{saveBusy=false}
 }
 let archiveExpanded=false,archiveLastSource='';
 function mountArchive(){
  if(!owner()||isPreview())return;
  const shell=el('#studioApp #moduleWorkspace[data-module-key="archive"] .archive-wall-shell');
  if(!shell)return;
  const toolbar=el('.archive-toolbar',shell);
  if(!toolbar)return;
  const actions=el('.archive-filter-bar',toolbar)||toolbar;
  const platform=archiveSource(),allowed=highlightsInScope();
  if(archiveLastSource!==platform){archiveExpanded=false;archiveLastSource=platform}
  if(!allowed)archiveExpanded=false;
  // Archive refreshes its action row without necessarily replacing the highlights
  // editor below it. Reconnect the button even when the panel already exists.
  const ensureButton=()=>{
   let button=el('.archive-highlights-button',shell);
   if(!button){
    button=make('button','module-action ghost archive-highlights-button','Highlights');
    button.type='button';
    button.addEventListener('click',()=>{
     if(!highlightsInScope())return;
     const current=el('#archiveHighlightsPanel',shell);
     if(!current)return;
     archiveExpanded=!archiveExpanded;
     current.hidden=!archiveExpanded;
     button.setAttribute('aria-expanded',String(archiveExpanded));
     button.classList.toggle('is-active',archiveExpanded);
     if(archiveExpanded){get();render();if(!remoteLoaded)remote()}
    });
   }
   button.setAttribute('aria-controls','archiveHighlightsPanel');
   button.setAttribute('aria-expanded',String(archiveExpanded));
   button.classList.toggle('is-active',archiveExpanded);
   button.hidden=!allowed;
   button.setAttribute('aria-label',platform==='snapchat'?'Snapchat Highlights':platform==='facebook'?'Facebook Highlights':'Instagram Highlights');
   if(actions&&button.parentElement!==actions)actions.append(button);
   else if(!actions&&button.parentElement!==toolbar)toolbar.prepend(button);
   return button;
  };
  const existing=el('#archiveHighlightsPanel',shell);
  if(existing){
   const heading=el('h2',existing),title=platform==='snapchat'?'Snapchat Spotlights':platform==='facebook'?'Facebook Highlights':'Instagram Highlights';if(heading&&heading.textContent!==title)heading.textContent=title;
   if(toolbar.nextElementSibling!==existing)toolbar.insertAdjacentElement('afterend',existing);
   existing.hidden=!allowed||!archiveExpanded;
   ensureButton();
   return;
  }
  // If only the editor was replaced, do not leave an obsolete button behind.
  el('.archive-highlights-button',shell)?.remove();
  const pane=make('section','archive-highlights-panel highlight-edit-pane');
  pane.id='archiveHighlightsPanel';
  const header=make('div','archive-highlights-heading');
  header.append(make('h2','',platform==='snapchat'?'Snapchat Spotlights':platform==='facebook'?'Facebook Highlights':'Instagram Highlights'),make('p','highlight-editor-intro','Manage this app’s highlights on your profile banner. Imported originals stay untouched.'));
  pane.append(header);
  const rows=make('div','highlight-edit-list');rows.id='biglwaHighlightEditorList';pane.append(rows);
  const controls=make('div','highlight-edit-actions');
  const create=make('button','','+ New highlight');create.type='button';
  create.addEventListener('click',()=>{
   if(get().custom.length+source().length>=12){status('Maximum 12 highlights.');return}
   get().custom.push({id:'h'+Date.now().toString(36)+Math.random().toString(36).slice(2,7),...safeEntry({title:'New highlight',platform:archiveSource()})});
   render();
  });
  const saveBtn=make('button','','Save highlights');saveBtn.type='button';saveBtn.dataset.highlightSave='1';
  saveBtn.addEventListener('click',save);
  controls.append(create,saveBtn);pane.append(controls);
  const message=make('p','highlight-editor-status','');message.id='biglwaHighlightStatus';
  message.setAttribute('role','status');pane.append(message);
  toolbar.insertAdjacentElement('afterend',pane);
  pane.hidden=!allowed||!archiveExpanded;
  ensureButton();
  if(allowed&&archiveExpanded){get();render();if(!remoteLoaded)remote()}
 }
 function openArchive(){
  if(!highlightsInScope()){
   try{const f=JSON.parse(localStorage.getItem('biglwaArchiveFilters')||'{}')||{};
    localStorage.setItem('biglwaArchiveFilters',JSON.stringify({...f,sources:['instagram']}))}catch{}
  }
  archiveLastSource=archiveSource();
  archiveExpanded=highlightsInScope();
  if(typeof window.openBIGLWAModule==='function')window.openBIGLWAModule('archive');
  else if(typeof window.BigLWAOpenModule==='function')window.BigLWAOpenModule('archive');
  mountArchive();
  const pane=el('#archiveHighlightsPanel');
  if(pane&&archiveExpanded){
   pane.hidden=false;get();render();if(!remoteLoaded)remote();
   const button=el('.archive-highlights-button',pane.parentElement);
   if(button){button.setAttribute('aria-expanded','true');button.classList.add('is-active')}
  }
 }
 function start(){
  if(!owner()||isPreview())return;
  mountArchive();
  const panel=el('#studioApp #wallpaperPanel'),tabs=el('#profileEditorTabs',panel||document);
  if(!panel||!tabs||el('#profilePictureEditor',panel))return;
  let tab=el('[data-profile-editor-tab="picture"]',tabs);
  if(!tab){
   tab=make('button','','Profile Picture');tab.type='button';tab.dataset.profileEditorTab='picture';
   tabs.prepend(tab);
  }
  tab.textContent='Profile Picture';
  tab.setAttribute('role','tab');tab.setAttribute('aria-controls','profilePictureEditor');tab.tabIndex=-1;
  const pane=make('section','highlight-edit-pane profile-picture-pane');
  pane.id='profilePictureEditor';pane.dataset.profileEditorPane='picture';pane.setAttribute('role','tabpanel');pane.hidden=true;
  const photo=make('section','highlight-profile-photo');
  photo.append(make('strong','','Main profile picture'));
  photo.append(make('p','','Upload or replace your main profile picture. Your photo and its alignment are saved directly to your BIG LWA account.'));
  const photoPreview=make('div','highlight-profile-photo-preview');photoPreview.setAttribute('role','img');photoPreview.setAttribute('aria-label','Current profile picture alignment');
  photo.append(photoPreview);
  const showPhotoPreview=(url,position={x:50,y:50})=>{
    photoPreview.style.backgroundImage=url?'url('+JSON.stringify(url)+')':'none';
    photoPreview.style.backgroundPosition=(position.x??50)+'% '+(position.y??50)+'%';
    photoPreview.classList.toggle('has-photo',Boolean(url));
  };
  (async()=>{try{
    const api=await import('/account-photo.js?v=20261027-adjust-position-1');
    const details=await api.getProfilePhotoDetails();
    if(photoPreview.isConnected&&owner()&&!isPreview()){showPhotoPreview(details.url,details.position);api.applyProfilePhotoPosition(details.position)}
  }catch{}})();
  const pic=make('input');pic.type='file';pic.accept='image/jpeg,image/png,image/webp,image/gif';pic.setAttribute('aria-label','Choose new profile picture');
  pic.onchange=async()=>{
   if(!pic.files?.[0])return;
   pictureStatus('Uploading profile picture…');
   try{const api=await import('/account-photo.js?v=20261027-adjust-position-1');const result=await api.uploadProfilePhoto(pic.files[0]);showPhotoPreview(result.url,{x:50,y:50});pictureStatus('Profile picture saved to your account. Use Adjust to position it.') }
   catch(e){pictureStatus(e.message||'Could not upload picture.')}finally{pic.value=''}
  };
  const clear=make('button','','Remove profile picture');clear.type='button';clear.onclick=async()=>{
   try{const api=await import('/account-photo.js?v=20261027-adjust-position-1');await api.removeProfilePhoto();showPhotoPreview('',{x:50,y:50});pictureStatus('Profile picture removed.') }
   catch(e){pictureStatus(e.message)}
  };
  const adjust=make('button','highlight-profile-adjust','Adjust');adjust.type='button';adjust.id='adjustProfilePicture';
  adjust.addEventListener('click',async()=>{
    try{
      const api=await import('/account-photo.js?v=20261027-adjust-position-1');
      const current=await api.getProfilePhotoDetails();
      if(!current.url){pictureStatus('Choose a profile picture before adjusting it.');return}
      const editor=window.BIGLWAMediaAdjust;
      if(!editor){pictureStatus('Alignment editor unavailable. Reload Studio to try again.');return}
      editor.open({type:'photo',url:current.url,position:(current.position.x??50)+'% '+(current.position.y??50)+'%',fit:'cover',
        onSave:async changes=>{
          await api.saveProfilePhotoPosition(changes);
          showPhotoPreview(current.url,changes);
          pictureStatus('Profile picture alignment saved to your account.');
        }});
    }catch(e){pictureStatus(e.message||'Could not open profile picture adjustment.')}
  });
  const actions=make('div','highlight-profile-photo-actions');actions.append(pic,adjust,clear);
  photo.append(actions);pane.append(photo);
  const archiveLink=make('div','profile-highlight-archive-link');
  archiveLink.append(make('p','','Highlights are managed in Archive.'));
  const open=make('button','module-action ghost','Go to Archive');
  open.type='button';open.addEventListener('click',openArchive);archiveLink.append(open);
  pane.append(archiveLink);
  const message=make('p','highlight-editor-status','');message.id='biglwaProfilePictureStatus';
  message.setAttribute('role','status');pane.append(message);
  const footer=el('#profileEditorActions',panel);
  if(footer)footer.before(pane);else panel.append(pane);
 }
 let timer;
 function schedule(){if(timer)return;timer=setTimeout(()=>{timer=null;start()},50)}
 for(const event of ['biglwa:identity-updated','biglwa:session-verified','biglwa:user-directory-ready','biglwa:highlights-imported','biglwa:customization-remote','biglwa:archive-rendered','biglwa:snapchat-showcase-ready'])
  window.addEventListener(event,detail=>{
   if(event==='biglwa:customization-remote'){
    const snapshot=detail.detail;
    if(snapshot?.uid===owner()&&snapshot.customization?.session?.highlightEdits){
     stateOwner=owner();state=normalize(snapshot.customization.session.highlightEdits);
     try{localStorage.setItem(storageKey(),JSON.stringify(state))}catch{}
     remoteLoaded=true;refresh();render();
    }else remoteLoaded=false;
   }
   if(event==='biglwa:identity-updated'||event==='biglwa:session-verified'){
    stateOwner='';remoteLoaded=false;get();render();if(owner()&&!isPreview())remote();
   }
   if(event==='biglwa:highlights-imported')render();
   schedule();
  });
 window.addEventListener('biglwa:public-profile-ready',event=>{
   publicState=normalize(event.detail?.profile?.look?.highlights);
   refresh();
 });
 window.addEventListener('biglwa:module-close',()=>{archiveExpanded=false});
 const observer=new MutationObserver(schedule);
 const ready=()=>{observer.observe(document.getElementById('studioApp')||document.body,{childList:true,subtree:true});schedule()};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
 window.BIGLWAHighlightEditor={get,customize,current,render,save,mount:start,mountArchive,openArchive};
})();
