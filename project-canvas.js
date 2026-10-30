/* Big LWA Projects: visual, locally persisted creative workspace. */
(()=>{'use strict';
if(window.__biglwaProjectCanvas)return;
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let active=null,boards=[],current='',drag=null,saveTimer=null,projectUploadBusy=false,canvasMode='visualeyez';
const PROJECT_W=1850,PROJECT_H=1300;
let zoomLevel=1;
const uid=()=>window.__biglwaIdentity?.uid||'guest';
const key=()=> 'biglwaProjectCanvas:v1:'+uid();
const zoomKey=()=> 'biglwaProjectZoom:v1:'+uid();
function setZoom(value){
  const n=Number(value);
  if(!Number.isFinite(n))return;
  zoomLevel=Math.max(.4,Math.min(1.5,Math.round(n*10)/10));
  try{localStorage.setItem(zoomKey(),String(zoomLevel))}catch{}
  const space=$('#lwaProjectSpace'),plane=$('#lwaProjectPlane'),label=$('#lwaProjectZoomLabel');
  if(space){space.style.width=(PROJECT_W*zoomLevel)+'px';space.style.height=(PROJECT_H*zoomLevel)+'px'}
  if(plane)plane.style.transform='scale('+zoomLevel+')';
  if(label)label.textContent=Math.round(zoomLevel*100)+'%';
  const out=$('#lwaProjectZoomOut'),inside=$('#lwaProjectZoomIn');
  if(out)out.disabled=zoomLevel<=.4;
  if(inside)inside.disabled=zoomLevel>=1.5;
}
const id=()=>String(Date.now())+Math.random().toString(36).slice(2,7);
function load(){
 try{boards=JSON.parse(localStorage.getItem(key())||'[]');if(!Array.isArray(boards))boards=[]}catch{boards=[]}
 if(!boards.length){
  let legacy=[];try{legacy=JSON.parse(localStorage.getItem('biglwaModule_projects')||'[]')}catch{}
  if(Array.isArray(legacy)&&legacy.length)boards=legacy.map((p,i)=>({id:id(),title:p.title||'Untitled project',items:[{id:id(),type:/^https:\/\//i.test(p.photo||'')?'image':'note',url:/^https:\/\//i.test(p.photo||'')?p.photo:'',text:p.detail||p.title||p.meta||'',x:48,y:45}]}));
 }
 // The old empty state made every + button silently return because board() was null.
 if(!boards.length)boards=[{id:id(),title:'My first project',items:[]}];
 current=boards.some(b=>b.id===current)?current:(boards[0]?.id||'');
}
function save(){clearTimeout(saveTimer);saveTimer=setTimeout(()=>{try{localStorage.setItem(key(),JSON.stringify(boards))}catch(e){setStatus('Could not save in this browser. Check storage space.')}},160)}
function setStatus(t){const el=$('#lwaProjectStatus');if(el)el.textContent=t}
const board=()=>boards.find(b=>b.id===current);
function card(item){
 let content='';
 if(item.type==='image')content='<img src="'+esc(item.url||'')+'" alt="'+esc(item.text||'Project reference')+'" loading="lazy"><textarea placeholder="Image caption" data-field="text">'+esc(item.text)+'</textarea>';
 else if(item.type==='link')content='<input aria-label="Link URL" data-field="url" placeholder="https://…" value="'+esc(item.url)+'"><textarea data-field="text" placeholder="Reference name">'+esc(item.text)+'</textarea><a href="'+esc(/^https?:\/\//i.test(item.url||'')?item.url:'#')+'" target="_blank" rel="noopener noreferrer">Open reference ↗</a>';
 else if(item.type==='tasks')content='<textarea data-field="text" placeholder="One task per line; prefix completed tasks with [x]">'+esc(item.text)+'</textarea><small>Use [x] for finished tasks</small>';
 else if(item.type==='note'){
  const kind=String(item.textKind||'Normal');
  const kinds=['Normal','Title','Scene heading','Action','Character','Dialogue','Parenthetical','Transition','Shot'];
  content='<label class="lwa-note-text-kind">Text format <select data-field="textKind" aria-label="Note text formatting">'+kinds.map(v=>'<option'+(kind===v?' selected':'')+'>'+v+'</option>').join('')+'</select></label><textarea data-field="text" placeholder="Write an idea…">'+esc(item.text)+'</textarea>';
 }
 else content='<textarea data-field="text" placeholder="Write an idea…">'+esc(item.text)+'</textarea>';
 return '<article class="lwa-project-item '+esc(item.type)+(item.type==='note'?' lwa-note-'+esc(String(item.textKind||'Normal').toLowerCase().replace(/[^a-z]+/g,'-')):'')+'" data-card="'+esc(item.id)+'" style="left:'+Number(item.x||0)+'px;top:'+Number(item.y||0)+'px"><header data-drag><span>⠿ '+esc(item.type)+'</span><button data-delete="'+esc(item.id)+'" aria-label="Delete card" title="Delete card">×</button></header>'+content+'</article>';
}
function render(){
 const root=$('#lwaProjects');if(!root)return;
 const pageHeading='<div class="module-heading lwa-project-heading"><div class="module-heading-copy"><h1>visualizr</h1></div><div class="module-heading-bottom"><p>Your visualeyez boards and visualslidez presentations, in one workspace.</p></div></div>';
 const tabBar='<nav class="visualz-tabs" aria-label="Visualz workspaces"><button type="button" data-visualz-mode="visualeyez" aria-pressed="'+(canvasMode==='visualeyez')+'" class="'+(canvasMode==='visualeyez'?'active':'')+'">visual·eyez</button><button type="button" data-visualz-mode="visualslidez" aria-pressed="'+(canvasMode==='visualslidez')+'" class="'+(canvasMode==='visualslidez'?'active':'')+'">visual·slidez</button></nav>';
 if(canvasMode==='visualslidez'){
  root.innerHTML=pageHeading+tabBar+'<section id="lwaVisualSlides" aria-label="Slide canvas"><p>Loading visual·slidez…</p></section>';
  document.dispatchEvent(new CustomEvent('biglwa:visualz-render'));
  import('/visualslidez.js?v=20261029-readable-thumbs-1').then(()=>window.BigLWAVisualSlidez?.mount(root.querySelector('#lwaVisualSlides'))).catch(()=>{const stage=root.querySelector('#lwaVisualSlides');if(stage)stage.textContent='Slides could not start; the existing boards are safe.'});return;
 }
 root.innerHTML=pageHeading+'<div class="visualz-top-row">'+tabBar+'<span id="lwaProjectStatus" role="status">Private account backup · sync status in Settings</span></div><div class="lwa-project-toolbar"><div class="lwa-project-controls"><button data-new-board>+ New project</button><select aria-label="Choose project" id="lwaProjectChoice">'+boards.map(b=>'<option value="'+esc(b.id)+'"'+(b.id===current?' selected':'')+'>'+esc(b.title)+'</option>').join('')+'</select><button data-rename>Rename</button><button data-remove-board>Delete project</button></div><div class="lwa-project-zoom" role="group" aria-label="Zoom project canvas"><button type="button" id="lwaProjectZoomOut" data-project-zoom="-1" aria-label="Zoom out">−</button><output id="lwaProjectZoomLabel" aria-live="polite">100%</output><button type="button" id="lwaProjectZoomIn" data-project-zoom="1" aria-label="Zoom in">+</button><button type="button" data-project-zoom="fit">Fit</button><button type="button" data-project-zoom="reset">100%</button></div></div><div class="lwa-project-tools"><button data-add="note">+ Note</button><button data-open-project-picker>+ Image</button><button data-add="link">+ Link</button><button data-add="tasks">+ Tasks</button></div><div class="lwa-project-board" id="lwaProjectBoard"><div class="lwa-project-space" id="lwaProjectSpace"><div class="lwa-project-plane" id="lwaProjectPlane"><div class="lwa-project-guide">Drag cards to arrange your workspace · edit cards in place</div>'+(board()?.items||[]).map(card).join('')+'</div></div></div><dialog id="lwaProjectImagePicker" aria-label="Add an image to Projects"><div class="lwa-project-picker-head"><h3>Add an image</h3><button type="button" data-close-project-picker aria-label="Close image picker">×</button></div><p>Choose an image from your connected Orbit library, or drop an image directly into this project.</p><div class="lwa-project-picker-actions"><button type="button" data-choose-orbit>Choose from Orbit</button><label class="lwa-project-file-label">Upload an image<input type="file" id="lwaProjectFileInput" accept="image/jpeg,image/png,image/webp,image/gif" hidden></label></div><div class="lwa-project-drop" id="lwaProjectDrop" tabindex="0" role="button" aria-label="Drop or select an image">Drop image here, or click to browse your files</div><div id="lwaProjectOrbitGallery" class="lwa-project-orbit-gallery" hidden></div><p class="lwa-project-picker-status" id="lwaProjectPickerStatus" role="status"></p></dialog><p class="lwa-project-foot">Project layouts sync privately to your account. Uploaded image files are copied into your account’s BIGLWA R2 media bucket.</p>';
 // Keep add actions inside the deck's lower corner, not as a separate
 // full-width toolbar above the canvas. Delegated click handlers remain intact.
 const tools=root.querySelector('.lwa-project-tools');
 const deck=root.querySelector('#lwaProjectBoard');
 if(tools&&deck){
  const shell=document.createElement('div');shell.className='lwa-project-deck-shell';
  deck.before(shell);shell.append(deck,tools);
  let pan=null;
  deck.addEventListener('pointerdown',event=>{
   if(event.button!==0||event.target.closest('button,a,input,textarea,select,[data-card],.lwa-project-tools'))return;
   pan={id:event.pointerId,x:event.clientX,y:event.clientY,left:deck.scrollLeft,top:deck.scrollTop};
   deck.classList.add('is-panning');deck.setPointerCapture?.(event.pointerId);event.preventDefault();
  });
  deck.addEventListener('pointermove',event=>{
   if(!pan||pan.id!==event.pointerId)return;
   deck.scrollLeft=pan.left-(event.clientX-pan.x);deck.scrollTop=pan.top-(event.clientY-pan.y);
  });
  const end=event=>{if(!pan||(event?.pointerId!==undefined&&event.pointerId!==pan.id))return;
   try{deck.releasePointerCapture?.(pan.id)}catch{}pan=null;deck.classList.remove('is-panning')};
  deck.addEventListener('pointerup',end);deck.addEventListener('pointercancel',end);
  deck.addEventListener('lostpointercapture',end);
 }
 setZoom(zoomLevel);
 document.dispatchEvent(new CustomEvent('biglwa:visualz-render'));
}
function mount(){
 const body=$('#moduleWorkspaceBody');if(!body||!['visualz','visualizr'].includes($('#moduleRouteName')?.textContent))return;
 load();
 try{zoomLevel=Math.max(.4,Math.min(1.5,Number(localStorage.getItem(zoomKey()))||1))}catch{zoomLevel=1}
 body.innerHTML='<section id="lwaProjects"></section>';
 render();
}
function add(type){
 if(!board())return;
 const item={id:id(),type,text:'',url:'',x:38+(board().items.length%5)*35,y:65+(board().items.length%5)*40};
 if(type==='image'){openImagePicker();return;}
 if(type==='link'){const url=prompt('Reference URL (https://)');if(!url)return;try{const u=new URL(url);if(!['https:','http:'].includes(u.protocol))throw Error();item.url=u.href}catch{return alert('Enter a valid web URL.')}}
 board().items.push(item);save();render();
}

function appendImage(url,label=''){
 if(!board())throw Error('Create a project first.');
 let parsed;try{parsed=new URL(url)}catch{throw Error('Invalid image location.')}
 if(parsed.protocol!=='https:')throw Error('Only HTTPS images can be added.');
 const item={id:id(),type:'image',text:label,url:parsed.href,
  x:38+(board().items.length%5)*35,y:65+(board().items.length%5)*40};
 board().items.push(item);save();render();
}
function pickerStatus(message){
 const el=$('#lwaProjectPickerStatus');if(el)el.textContent=message;
}
function openImagePicker(){
 if(!board()){load();if(!board()){setStatus('Create a project first.');return;}}
 const picker=$('#lwaProjectImagePicker');if(!picker)return;
 pickerStatus('Your Orbit images stay in BIGLWA media storage. Your project is a private draft on this browser.');
 const gallery=$('#lwaProjectOrbitGallery');if(gallery){gallery.hidden=true;gallery.replaceChildren()}
 if(typeof picker.showModal==='function')picker.showModal();else picker.setAttribute('open','');
 loadOrbitImagePicker().catch(error=>pickerStatus(error?.message||'Could not load Orbit photos.'));
}
function getProjectImageToken(){
 return Promise.all([
  import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'),
  import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js')
 ]).then(async ([firebase,authAPI])=>{
  const app=firebase.getApps()[0];
  if(!app)throw Error('Sign in to upload your image.');
  const auth=authAPI.getAuth(app);await auth.authStateReady();
  if(!auth.currentUser)throw Error('Sign in to BIGLWA to save images.');
  return auth.currentUser.getIdToken();
 });
}
async function uploadProjectImage(file){
 if(projectUploadBusy)return;
 if(!file||!/^image\/(jpeg|png|webp|gif)$/.test(file.type))throw Error('Choose a JPG, PNG, WebP, or GIF image.');
 if(file.size>8*1024*1024)throw Error('Images must be 8 MB or smaller.');
 projectUploadBusy=true;pickerStatus('Saving image in your BIGLWA media bucket…');
 try{
  const token=await getProjectImageToken();
  const response=await fetch('https://biglwa-instagram-api.leianmulatre-284.workers.dev/media/feed-image',{
   method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':file.type},body:file
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok||!data.url)throw Error(data.error||'Upload could not be completed.');
  appendImage(data.url,file.name.replace(/\.[^.]+$/,''));
 }finally{projectUploadBusy=false}
}
async function loadOrbitImagePicker(){
 const panel=$('#lwaProjectOrbitGallery');if(!panel)return;
 panel.hidden=false;panel.replaceChildren();panel.textContent='Loading images saved to your BIGLWA account…';
 try{
   // Orbit is an ES module. It may load after Projects opens on a deep link.
   const api=window.__biglwaOrbitPosts || await import('./orbit-posts.js');
   if(!api?.storedOrbitImageUrls)throw Error('Orbit storage is unavailable. Sign in and retry.');
   const saved=await api.storedOrbitImageUrls('');
   if(!panel.isConnected)return;
   const permitted=url=>{
     try{const u=new URL(url);return u.protocol==='https:'&&
        u.hostname==='biglwa-instagram-api.leianmulatre-284.workers.dev'&&
        new RegExp('^/media/(orbit|feed-image)/[A-Za-z0-9_-]+/').test(u.pathname);
     }catch{return false}
   };
   const images=[...new Set(Object.values(saved||{}).flat().filter(permitted))];
   // Some older synced records store picture URLs only in Archive, not the Orbit index.
   if(!images.length&&typeof api.loadArchive==='function'){
     let cursor=null;
     for(let page=0;page<5;page++){
       const rows=await api.loadArchive(null,48,cursor);
       for(const entry of rows||[]){
         const urls=[entry.imageUrl,...(entry.imageUrls||[]),...(entry.mediaItems||[]).flatMap(x=>[x?.url,x?.thumbnailUrl])];
         for(const url of urls)if(permitted(url)&&!images.includes(url))images.push(url);
       }
       if(!rows?.hasMore||!rows?.nextCursor)break;
       cursor=rows.nextCursor;
     }
   }
   if(!panel.isConnected)return;
   if(!images.length){
     panel.textContent='No stored Orbit images yet. In Orbit, connect or refresh Instagram/Pinterest and save the media to your account.';
     pickerStatus('You can still upload or drop any JPG, PNG, WebP or GIF into this project.');
     return;
   }
   panel.replaceChildren();
   panel.__imageUrls=images.slice(0,250);
   for(const [index,url] of panel.__imageUrls.entries()){
     const button=document.createElement('button');button.type='button';
     button.dataset.selectOrbitImage=String(index);
     button.title='Add stored Orbit image to project';
     const image=document.createElement('img');image.src=url;image.alt='Saved Orbit photo';image.loading='lazy';
     image.onerror=()=>{button.disabled=true;button.title='Stored copy could not load; resync this image in Orbit';button.classList.add('is-unavailable')};
     button.append(image);panel.append(button);
   }
   pickerStatus('Showing '+panel.__imageUrls.length+' stored account photo(s). Select one to add it to your project.');
 }catch(error){panel.textContent=error?.message||'Could not load saved Orbit photos.';pickerStatus('You can still drag or upload an image directly.')}
}

document.addEventListener('biglwa:module-open',e=>{if(e.detail?.key==='projects'||e.detail?.key==='project')mount()});
document.addEventListener('click',e=>{
 const root=e.target.closest('#lwaProjects');if(!root)return;
 const b=e.target.closest('button');if(!b)return;
 if(b.hasAttribute('data-visualz-mode')){canvasMode=b.dataset.visualzMode==='visualslidez'?'visualslidez':'visualeyez';render();return}
 if(canvasMode!=='visualeyez')return;
 if(b.hasAttribute('data-project-zoom')){
   const action=b.dataset.projectZoom;
   if(action==='fit')setZoom(Math.min(1,($('#lwaProjectBoard')?.clientWidth||800)/PROJECT_W));
   else if(action==='reset')setZoom(1);
   else setZoom(zoomLevel+Number(action)*.1);
   return;
 }
 if(b.hasAttribute('data-open-project-picker')){e.preventDefault();openImagePicker();return}
 if(b.dataset.add){add(b.dataset.add);return}
 if(b.hasAttribute('data-new-board')){const title=prompt('Project title','New project');if(!title?.trim())return;const next={id:id(),title:title.trim(),items:[]};boards.push(next);current=next.id;save();render()}
 if(b.hasAttribute('data-rename')&&board()){const title=prompt('Rename project',board().title);if(title?.trim()){board().title=title.trim();save();render()}}
 if(b.hasAttribute('data-remove-board')&&board()&&confirm('Delete this project and its cards?')){boards=boards.filter(b=>b.id!==current);if(!boards.length)boards=[{id:id(),title:'My first project',items:[]}];current=boards[0].id;save();render()}
 if(b.dataset.delete&&board()){board().items=board().items.filter(i=>i.id!==b.dataset.delete);save();render()}
});
document.addEventListener('change',e=>{
 if(canvasMode!=='visualeyez')return;
 if(e.target.id==='lwaProjectChoice'){current=e.target.value;render();return}
 const itemEl=e.target.closest('#lwaProjects [data-card]');if(!itemEl||!board())return;
 const item=board().items.find(i=>i.id===itemEl.dataset.card);if(item&&e.target.dataset.field){
  item[e.target.dataset.field]=e.target.value;save();
  if(e.target.dataset.field==='textKind'){
    [...itemEl.classList].filter(k=>k.startsWith('lwa-note-')).forEach(k=>itemEl.classList.remove(k));
    itemEl.classList.add('lwa-note-'+String(item.textKind||'Normal').toLowerCase().replace(/[^a-z]+/g,'-'));
  }
}
});
document.addEventListener('input',e=>{
 const itemEl=e.target.closest('#lwaProjects [data-card]');if(!itemEl||!board()||!e.target.dataset.field)return;
 const item=board().items.find(i=>i.id===itemEl.dataset.card);if(item){item[e.target.dataset.field]=e.target.value;save()}
});

document.addEventListener('click',async e=>{
 const dialog=e.target.closest('#lwaProjectImagePicker');if(!dialog)return;
 const btn=e.target.closest('button');
 if(btn?.hasAttribute('data-close-project-picker')){dialog.close();return;}
 if(btn?.hasAttribute('data-choose-orbit')){await loadOrbitImagePicker();return;}
 if(btn?.hasAttribute('data-select-orbit-image')){
   const url=$('#lwaProjectOrbitGallery')?.__imageUrls?.[Number(btn.dataset.selectOrbitImage)];
   if(url)try{appendImage(url);setStatus('Added stored Orbit image to project.')}catch(error){pickerStatus(error.message)}
   return;
 }
 if(e.target.closest('#lwaProjectDrop')){$('#lwaProjectFileInput')?.click();return;}
});
document.addEventListener('change',async e=>{
 if(e.target.id!=='lwaProjectFileInput')return;
 const file=e.target.files?.[0];if(!file)return;
 try{await uploadProjectImage(file);setStatus('Uploaded image into your project and BIGLWA media storage.')}
 catch(error){pickerStatus(error.message);}
});
document.addEventListener('dragover',e=>{
 const drop=e.target.closest('#lwaProjectDrop,#lwaProjectBoard');if(!drop)return;
 if(![...e.dataTransfer?.types||[]].includes('Files'))return;
 e.preventDefault();drop.classList.add('is-drag-over');
});
document.addEventListener('dragleave',e=>e.target.closest('#lwaProjectDrop,#lwaProjectBoard')?.classList.remove('is-drag-over'));
document.addEventListener('drop',async e=>{
 const target=e.target.closest('#lwaProjectDrop,#lwaProjectBoard');if(!target)return;
 const file=[...e.dataTransfer.files].find(f=>f.type.startsWith('image/'));
 if(!file)return;e.preventDefault();target.classList.remove('is-drag-over');
 try{await uploadProjectImage(file);setStatus('Dropped image saved to BIGLWA media storage.')}
 catch(error){pickerStatus(error.message);setStatus(error.message);}
});
document.addEventListener('pointerdown',e=>{
 const handle=e.target.closest('#lwaProjects [data-drag]');if(!handle||e.target.closest('button'))return;
 const el=handle.closest('[data-card]'),canvas=$('#lwaProjectBoard');if(!canvas)return;
 const rect=$('#lwaProjectPlane').getBoundingClientRect(),r=el.getBoundingClientRect();
 drag={el,id:el.dataset.card,ox:e.clientX-r.left,oy:e.clientY-r.top,rect};handle.setPointerCapture?.(e.pointerId);e.preventDefault();
});
document.addEventListener('pointermove',e=>{
 if(!drag)return;
 const x=Math.max(0,Math.round((e.clientX-drag.rect.left-drag.ox)/zoomLevel)),y=Math.max(0,Math.round((e.clientY-drag.rect.top-drag.oy)/zoomLevel));
 drag.el.style.left=x+'px';drag.el.style.top=y+'px';
});
document.addEventListener('pointerup',()=>{
 if(!drag)return;
 const item=board()?.items.find(i=>i.id===drag.id);
 if(item){item.x=parseInt(drag.el.style.left,10)||0;item.y=parseInt(drag.el.style.top,10)||0;save()}
 drag=null;
});
// A photo sent from the Collective Feed belongs on the current canvas, not in
// the retired biglwaModule_projects list. Persist synchronously across navigation.
function addFeedImage(url,label=''){
 if(!boards.length)load();
 appendImage(url,label);
 clearTimeout(saveTimer);
 localStorage.setItem(key(),JSON.stringify(boards));
 return true;
}
window.__biglwaProjectCanvas={mount,openImagePicker,loadOrbitImagePicker,addFeedImage};
 // Deep links and lazy script loading can fire biglwa:module-open before this script is ready.
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{
   if(document.querySelector('#moduleWorkspace:not([hidden])[data-module-key="projects"]'))mount();
 },{once:true});
 else if(document.querySelector('#moduleWorkspace:not([hidden])[data-module-key="projects"]'))mount();
const css=document.createElement('style');css.textContent=`
#lwaProjects{font-family:system-ui,sans-serif;color:#302b28}
.visualz-tabs{display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap;margin:0 10px 0 0;min-width:0}
.visualz-tabs>button{font:400 19px "CS Bergamot Stitched",Georgia,serif!important;border:1px solid #c3a89b;border-radius:9px;padding:7px 12px;background:#fffaf0;white-space:nowrap}
.visualz-tabs>button.active{background:#6d3d57!important;color:white!important}
.visualz-top-row{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:4px 0 12px}.visualz-top-row #lwaProjectStatus{margin-left:auto;text-align:right;font:500 11px/1.4 system-ui;color:#756d66}.visualz-tabs [data-visualz-share-slot]{display:flex;align-items:center;flex:1;justify-content:flex-end}
.lwa-project-toolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin:4px 0 6px}
.lwa-project-heading{margin:0 0 18px;padding-bottom:14px;border-bottom:1px solid #d4b8b3}
.lwa-project-heading h1{font:400 clamp(34px,6vw,66px)/.95 "CS Bergamot Stitched",Georgia,serif!important;letter-spacing:-.04em!important}
.lwa-project-heading p{max-width:700px;margin:12px 0 0;font-size:13px;line-height:1.6;color:#6e655f}


.lwa-project-controls,.lwa-project-tools{display:flex;align-items:center;gap:7px;flex-wrap:wrap;min-width:0}.lwa-project-controls{flex:1 1 560px}.lwa-project-zoom{margin-left:auto}
#lwaProjects button,#lwaProjects select{cursor:pointer;border:1px solid #d9ccc1;border-radius:10px;padding:10px 12px;background:#fff9f1;color:#302b28;font:600 12px system-ui}
#lwaProjects button:hover{background:#f5dfc9}.lwa-project-tools{padding:12px 0}.lwa-project-tools span{margin-left:auto;font-size:11px;color:#756d66}
.lwa-project-board{position:relative;overflow:auto;height:min(72vh,760px);min-height:420px;min-width:100%;border:1px solid #ded2c4;border-radius:18px;background-color:#f4eee4;background-image:radial-gradient(#cbbeb0 1px,transparent 1px);background-size:22px 22px}
.lwa-project-space{position:relative;min-width:0;min-height:0}
.lwa-project-plane{position:absolute;top:0;left:0;width:1850px;height:1300px;transform-origin:0 0}
.lwa-project-zoom{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.lwa-project-zoom output{min-width:46px;text-align:center;font:700 12px system-ui}
#lwaProjects .lwa-project-zoom button{padding:8px 11px;min-width:37px}
#lwaProjects .lwa-project-zoom button:disabled{opacity:.45;cursor:not-allowed}
.lwa-project-guide{position:absolute;top:12px;left:16px;color:#897c6d;font-size:12px;pointer-events:none}
.lwa-project-item{position:absolute;width:240px;min-height:120px;box-sizing:border-box;padding:0 12px 12px;background:#fffaf0;border:1px solid #dfd2c2;border-radius:12px;box-shadow:0 10px 24px #392b221f;overflow:hidden}
.lwa-project-item.note{background:#ffeda1}.lwa-project-item.tasks{background:#e4f1e8}.lwa-project-item.link{background:#e7ebfc}
.lwa-project-item header{display:flex;justify-content:space-between;align-items:center;cursor:grab;touch-action:none;font-size:11px;text-transform:capitalize;font-weight:700;padding:5px 0}
.lwa-project-item header button{border:0!important;padding:3px 8px!important;background:transparent!important;font-size:19px!important}
.lwa-project-item textarea{display:block;min-height:90px;width:100%;resize:vertical;border:0;outline:0;background:transparent;font:13px/1.5 system-ui;color:#292522;box-sizing:border-box}
.lwa-project-item input{display:block;max-width:100%;box-sizing:border-box;margin:7px 0;padding:8px;border:1px solid #d9ccc1;border-radius:6px}
.lwa-project-item img{width:100%;max-height:250px;object-fit:cover;border-radius:8px}
.lwa-project-item a{font-size:12px}.lwa-project-item small{font-size:10px}
.lwa-project-foot{font-size:12px;color:#7c7167;padding:12px 0}
#lwaProjectImagePicker{border:1px solid #cfc0b2;border-radius:18px;max-width:min(580px,92vw);
 width:92vw;max-height:85vh;padding:20px;background:#fffaf2;color:#352923;box-shadow:0 22px 80px #0007}
#lwaProjectImagePicker::backdrop{background:#14100cb0}
.lwa-project-picker-head{display:flex;justify-content:space-between;align-items:center;gap:12px}
.lwa-project-picker-head h3{font:400 29px "CS Bergamot Stitched",Georgia,serif!important;margin:0}
.lwa-project-picker-actions{display:flex;gap:10px;flex-wrap:wrap;margin:16px 0}
.lwa-project-file-label{display:inline-flex;align-items:center;padding:10px 12px;border:1px solid #d9ccc1;border-radius:10px;background:#fff1de;font:700 12px system-ui;cursor:pointer}
.lwa-project-drop{display:grid;place-items:center;min-height:125px;padding:15px;border:2px dashed #b5a69a;border-radius:12px;text-align:center;font:600 13px/1.5 system-ui;cursor:pointer}
.lwa-project-drop.is-drag-over,#lwaProjectBoard.is-drag-over{border-color:#bd4968;background:#fce6e9}
.lwa-project-orbit-gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(95px,1fr));gap:8px;max-height:290px;overflow:auto;margin:15px 0}
.lwa-project-orbit-gallery[hidden]{display:none}
.lwa-project-orbit-gallery button{height:104px!important;padding:0!important;overflow:hidden}
.lwa-project-orbit-gallery img{width:100%;height:100%;object-fit:cover}
.lwa-project-picker-status{font:600 11px/1.5 system-ui;color:#79675c}

`;css.textContent+=`
 #lwaProjects .lwa-project-item.note .lwa-note-text-kind{display:flex;gap:6px;align-items:center;justify-content:space-between;padding:4px 7px;font:600 10px/1.3 system-ui;color:#684a54}
 #lwaProjects .lwa-project-item.note .lwa-note-text-kind select{max-width:140px;min-width:90px;border:1px solid #cbb7ad;border-radius:5px;background:#fff8f0;font:600 10px system-ui;color:#372a35}
 #lwaProjects .lwa-project-item.lwa-note-scene-heading textarea,#lwaProjects .lwa-project-item.lwa-note-transition textarea,#lwaProjects .lwa-project-item.lwa-note-character textarea{text-transform:uppercase;font-family:ui-monospace,monospace;letter-spacing:.02em}
 #lwaProjects .lwa-project-item.lwa-note-dialogue textarea,#lwaProjects .lwa-project-item.lwa-note-parenthetical textarea{font-family:ui-monospace,monospace;text-align:center;padding-left:14%;padding-right:14%}
 #lwaProjects .lwa-project-item.lwa-note-action textarea,#lwaProjects .lwa-project-item.lwa-note-shot textarea{font-family:ui-monospace,monospace}
`;
document.head.append(css);
})();