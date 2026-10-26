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
  added:Array.isArray(raw.added)?raw.added.map(cleanItem).filter(Boolean).slice(0,12):[]
 });
 const normalize=(raw)=>{
  const result=empty();
  if(!raw||typeof raw!=='object')return result;
  for(const [k,v] of Object.entries(raw.imported||{})){
   if(/^\d{1,2}$/.test(k)&&Number(k)<24&&v&&typeof v==='object')result.imported[k]=safeEntry(v);
  }
  if(Array.isArray(raw.custom))result.custom=raw.custom.slice(0,8).map(c=>({...safeEntry(c),id:String(c?.id||'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,70)||'h'+Math.random().toString(36).slice(2)}));
  return result;
 };
 let state=empty(),publicState=null,stateOwner='',remoteLoaded=false,saveBusy=false;
 const isPreview=()=>!!window.__biglwaPublicStorageView||document.documentElement.classList.contains('biglwa-preview-mode');
 const get=()=>{if(isPreview())return publicState||empty();const who=owner();if(!who)return empty();if(stateOwner!==who){stateOwner=who;remoteLoaded=false;try{state=normalize(JSON.parse(localStorage.getItem(storageKey())||'null'))}catch{state=empty()}}return state};
 const source=()=>window.BigLWAImportedHighlights?.source?.()?.highlights||[];
 const status=(message)=>{const box=el('#biglwaHighlightStatus');if(box)box.textContent=message};
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
  platform:'new',items:x.added,customId:x.id
 }));
 function refresh(){window.dispatchEvent(new Event('biglwa:highlight-config-changed'))}
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
  const circle=make('span','highlight-edit-cover');
  const picture=document.createElement('img');picture.alt='Highlight cover preview';
  picture.src=data.cover||group.cover||'/assets/tv-no-signal.svg';applyCover(picture,data);circle.append(picture);
  const h=make('strong','',isImported?'Imported highlight '+(index+1):'Custom highlight');
  head.append(circle,h);wrap.append(head);
  const fields=make('div','highlight-edit-fields');
  const title=input('text',data.title||group.title||'','Name',value=>{data.title=value.slice(0,48);});
  title.querySelector('input').maxLength=48;fields.append(title);
  const covers=make('div','highlight-cover-controls');
  covers.append(input('text',data.cover||'','Cover image URL (optional)',value=>{
   const url=cleanUrl(value,true);if(url){data.cover=url;picture.src=url}
   else if(!value.trim()){data.cover='';picture.src=group.cover||'/assets/tv-no-signal.svg'}
  }));
  const upload=make('label','highlight-upload-label','Upload circle cover');
  const file=make('input');file.type='file';file.accept='image/jpeg,image/png,image/webp,image/gif';
  file.setAttribute('aria-label','Upload highlight cover');
  file.addEventListener('change',async()=>{
   try{status('Preparing cover…');const result=await toImage(file.files?.[0]);data.cover=result;picture.src=result;
    const field=covers.querySelector('input[type=text]');if(field)field.value='';status('Cover ready. Save Highlights to keep it.')}
   catch(e){status(e.message)}finally{file.value=''}
  });
  upload.append(file);covers.append(upload);
  for(const axis of ['x','y']){
   const label=make('label','','Cover '+(axis==='x'?'horizontal':'vertical')+' position');
   const range=make('input');range.type='range';range.min=0;range.max=100;range.value=String(data[axis]??50);
   range.addEventListener('input',()=>{data[axis]=Number(range.value);applyCover(picture,data)});
   label.append(range);covers.append(label);
  }fields.append(covers);
  const rows=make('div','highlight-edit-items');
  if(isImported){
   const items=group.items||[];
   const selection=data.order===null?[...Array(items.length).keys()]:data.order.filter(i=>i<items.length);
   const label=make('strong','',items.length+' imported items · choose visible content');
   rows.append(label);
   items.forEach((_,i)=>{
    const checkbox=make('input');checkbox.type='checkbox';checkbox.checked=selection.includes(i);
    const note=make('label','', (group.items[i]?.kind==='video'?'Video ':'Photo ')+(i+1));
    note.prepend(checkbox);
    checkbox.addEventListener('change',()=>{
     const all=data.order===null?[...Array(items.length).keys()]:data.order.slice();
     data.order=checkbox.checked?[...all.filter(v=>v!==i),i]:all.filter(v=>v!==i);
    });rows.append(note);
   });
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
  const groups=source();groups.slice(0,24).forEach((g,i)=>container.append(row(g,String(i),true,i)));
  get().custom.forEach((g,i)=>container.append(row({title:g.title,cover:g.cover,items:g.added},g.id,false,i)));
  if(!groups.length&&!get().custom.length)container.append(make('p','highlight-editor-intro','No imported highlights yet. Add one of your own below.'));
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
 function start(){
  if(!owner()||window.__biglwaPublicStorageView||document.documentElement.classList.contains('biglwa-preview-mode'))return;
  const panel=el('#studioApp #wallpaperPanel'),tabs=el('#profileEditorTabs',panel||document);
  if(!panel||!tabs||el('#biglwaHighlightEditorList',panel))return;
  const tab=make('button','','Highlights');tab.type='button';tab.dataset.profileEditorTab='highlights';
  tab.setAttribute('role','tab');tab.setAttribute('aria-controls','profileHighlightsEditor');tab.setAttribute('aria-selected','false');tab.tabIndex=-1;
  const wallpaper=el('[data-profile-editor-tab="wallpaper"]',tabs);
  if(wallpaper)wallpaper.before(tab);else tabs.append(tab);
  const pane=make('section','highlight-edit-pane');pane.id='profileHighlightsEditor';pane.dataset.profileEditorPane='highlights';pane.setAttribute('role','tabpanel');pane.hidden=true;
  pane.append(make('p','highlight-editor-intro','Edit your highlight names, individual content, and circle covers. Imported originals stay untouched.'));
  const rows=make('div','highlight-edit-list');rows.id='biglwaHighlightEditorList';pane.append(rows);
  const actions=make('div','highlight-edit-actions');
  const create=make('button','','+ New highlight');create.type='button';
  create.onclick=()=>{if(get().custom.length+source().length>=12){status('Maximum 12 highlights.');return}
    get().custom.push({id:'h'+Date.now().toString(36)+Math.random().toString(36).slice(2,7),...safeEntry({title:'New highlight'})});render();
  };
  const saveBtn=make('button','','Save highlights');saveBtn.type='button';saveBtn.dataset.highlightSave='1';saveBtn.onclick=save;
  actions.append(create,saveBtn);pane.append(actions);
  const photo=make('section','highlight-profile-photo');
  photo.append(make('strong','','Main profile picture'));
  photo.append(make('p','','Upload or replace your main profile picture. This uses BIG LWA’s account photo storage, not the highlight cover.'));
  const pic=make('input');pic.type='file';pic.accept='image/jpeg,image/png,image/webp,image/gif';pic.setAttribute('aria-label','Choose new profile picture');
  pic.onchange=async()=>{
   if(!pic.files?.[0])return;
   status('Uploading profile picture…');
   try{const api=await import('/account-photo.js');await api.uploadProfilePhoto(pic.files[0]);status('Profile picture saved to your account.')}
   catch(e){status(e.message||'Could not upload picture.')}finally{pic.value=''}
  };
  const clear=make('button','','Remove profile picture');clear.type='button';clear.onclick=async()=>{try{
   const api=await import('/account-photo.js');await api.removeProfilePhoto();status('Profile picture removed.');
  }catch(e){status(e.message)}};
  photo.append(pic,clear);pane.append(photo);
  const message=make('p','highlight-editor-status','');message.id='biglwaHighlightStatus';message.setAttribute('role','status');pane.append(message);
  const footer=el('#profileEditorActions',panel);
  if(footer)footer.before(pane);else panel.append(pane);
  tab.addEventListener('click',()=>{get();render();if(!remoteLoaded)remote()});
  const mainSave=el('#saveProfileBtn',panel);
  mainSave?.addEventListener('click',e=>{
   if(tab.getAttribute('aria-selected')!=='true')return;
   e.preventDefault();e.stopImmediatePropagation();save();
  },true);
  const cancel=el('#cancelProfileBtn',panel);
  cancel?.addEventListener('click',()=>{stateOwner='';get();render();refresh()},true);
  render();if(!remoteLoaded)remote();
 }
 let timer;
 function schedule(){clearTimeout(timer);timer=setTimeout(start,50)}
 for(const event of ['biglwa:identity-updated','biglwa:session-verified','biglwa:user-directory-ready','biglwa:highlights-imported','biglwa:customization-remote'])
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
 const observer=new MutationObserver(schedule);
 const ready=()=>{observer.observe(document.getElementById('studioApp')||document.body,{childList:true,subtree:true});schedule()};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
 window.BIGLWAHighlightEditor={get,customize,current,render,save};
})();
