/* BIG LWA Workshop · native editable project shelf.
 * This intentionally saves the actual downloaded project file (layers, timeline,
 * pages and format intact), NOT a raster snapshot and NOT a renamed image.
 * Native WASM editor file import still uses each editor's own Open command;
 * a separate Rust command bridge is needed before automatic reopening.
 */
const API='https://biglwa-instagram-api.leianmulatre-284.workers.dev/media/workshop-projects';
const MAX_BYTES=500*1024*1024;
const EDITORS=new Set(['sqwibblR','lightR','paintR','keyframeR','fileR','other']);
let authPromise=null;
async function identity(){
  if(!authPromise){
    authPromise=Promise.all([
      import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js')
    ]).then(([appModule,authModule])=>{
      const app=appModule.getApps()[0];
      if(!app)throw Error('BIG LWA sign-in is still loading.');
      return authModule.getAuth(app);
    }).catch(err=>{authPromise=null;throw err});
  }
  const auth=await authPromise;
  await auth.authStateReady();
  if(!auth.currentUser)throw Error('Sign in to BIG LWA to use your private project shelf.');
  return auth.currentUser;
}
async function call(path='',options={}){
  const user=await identity(),token=await user.getIdToken();
  const headers=new Headers(options.headers||{});
  headers.set('Authorization','Bearer '+token);
  const response=await fetch(API+path,{...options,headers,cache:'no-store'});
  if(!response.ok){
    let reason;
    try{reason=(await response.json()).error}catch{}
    if(response.status===404&&path==='')throw Error('Private project storage is not deployed to the BIG LWA Worker yet.');
    throw Error(reason||('Project storage responded with HTTP '+response.status+'.'));
  }
  return response;
}
async function json(path='',options={}){return (await call(path,options)).json()}
const sizeLabel=n=>n>1024*1024?(n/1024/1024).toFixed(1)+' MB':Math.ceil(n/1024)+' KB';
const dateLabel=n=>new Date(n||Date.now()).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'});
function downloadBlob(blob,name){
  const href=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=href;link.download=name||'Workshop-project';link.style.display='none';
  document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(href),60000);
}
async function downloadNativeProject(item){
  const response=await call('/'+encodeURIComponent(item.id));
  // Never let the browser navigate directly to an authenticated binary route:
  // it would lose the Firebase bearer token and could expose an error page.
  // The downloaded Blob is exactly the editor's original opaque native file.
  const data=await response.blob();
  if(data.size!==item.size)throw Error('The downloaded project was incomplete. No file was saved.');
  downloadBlob(data,item.name);
}
export function mountNativeProjectVault(host,{open,active}={}){
  if(!host||host.dataset.mounted==='1')return;
  host.dataset.mounted='1';
  host.innerHTML=
    '<div class="craft-project-heading"><div><span class="craft-vault-eyebrow">04 / EDITABLE FILES</span>'+
      '<h3>your native projects</h3><p>Keep actual editor project files private. Export inside your editor, save that file here, and later download the original to reopen using the editor’s Open command.</p></div>'+
      '<div class="craft-project-controls"><select id="craftProjectApp" aria-label="Editor for saved project">'+
       ['sqwibblR','lightR','paintR','keyframeR','fileR','other'].map(app=>'<option value="'+app+'">'+app+'</option>').join('')+
      '</select><label class="craft-project-save">Save editable file<input id="craftProjectInput" type="file" aria-label="Choose an original editable project file"></label>'+
      '<button type="button" data-project-refresh>Refresh shelf</button>'+
      '<button type="button" data-project-cancel hidden>Cancel upload</button></div></div>'+
    '<p class="craft-project-status" role="status" aria-live="polite">Your project files are private to your BIG LWA account.</p>'+
    '<div class="craft-project-list" aria-label="Private original editable projects"></div>';
  const selector=host.querySelector('#craftProjectApp'),picker=host.querySelector('#craftProjectInput');
  const status=host.querySelector('.craft-project-status'),list=host.querySelector('.craft-project-list');
  const refreshButton=host.querySelector('[data-project-refresh]'),cancelButton=host.querySelector('[data-project-cancel]');
  const state={busy:false,cancelled:false,controller:null,uploadId:null,projects:[],uid:null};
  function say(message){status.textContent=message}
  function clearList(message){list.replaceChildren();if(message){const empty=document.createElement('p');empty.textContent=message;list.append(empty)}}
  async function load(){
    if(state.busy||!host.isConnected)return;
    say('Checking your private project shelf…');
    try{
      const user=await identity(),payload=await json();
      if(!host.isConnected)return;
      state.uid=user.uid;state.projects=payload.projects||[];
      render();
      say(state.projects.length?state.projects.length+' editable project'+(state.projects.length===1?'':'s')+' securely stored.':'No editable projects saved yet.');
      if(payload.truncated)say('Project shelf results were truncated. Contact BIG LWA support before deleting anything.');
    }catch(err){state.projects=[];clearList('No projects available.');say(err.message)}
  }
  function render(){
    list.replaceChildren();
    if(!state.projects.length){clearList('Your editable projects will appear here.');return}
    for(const item of state.projects){
      if(!item||!EDITORS.has(item.app)||!/^[\w-]{22}$/.test(item.id))continue;
      const card=document.createElement('article');card.className='craft-project-card';
      const glyph=document.createElement('span');glyph.className='craft-project-glyph';glyph.textContent=item.app==='other'?'✦':item.app.slice(0,1).toUpperCase();
      const details=document.createElement('div');details.className='craft-project-details';
      const name=document.createElement('strong');name.textContent=item.name||'Untitled project';
      const meta=document.createElement('small');meta.textContent=item.app+' · '+sizeLabel(item.size)+' · '+dateLabel(item.createdAt);
      details.append(name,meta);
      const actions=document.createElement('div');actions.className='craft-project-card-actions';
      const download=document.createElement('button');download.type='button';download.textContent='Download original';
      download.addEventListener('click',async()=>{
        if(state.busy)return;
        state.busy=true;download.disabled=true;say('Retrieving the original editable file…');
        try{await downloadNativeProject(item);say('Original project downloaded. Open it inside '+item.app+'.')}
        catch(err){say(err.message)}finally{state.busy=false;download.disabled=false}
      });
      actions.append(download);
      if(item.app!=='other'){
        const edit=document.createElement('button');edit.type='button';edit.textContent='Open editor';
        edit.addEventListener('click',()=>{
          if(typeof open==='function'&&open(item.app))say('Editor opened. Use its Open command on your downloaded original file.');
          else say('That editor is not available in this deployment.');
        });
        actions.append(edit);
      }
      const remove=document.createElement('button');remove.type='button';remove.textContent='Remove';remove.className='craft-project-remove';
      remove.addEventListener('click',async()=>{
        if(state.busy||!window.confirm('Permanently delete '+item.name+' from your private BIG LWA project shelf?'))return;
        state.busy=true;remove.disabled=true;
        try{await json('/'+encodeURIComponent(item.id),{method:'DELETE'});say('Project removed.');state.busy=false;await load()}
        catch(err){say(err.message)}finally{state.busy=false;remove.disabled=false}
      });
      actions.append(remove);
      card.append(glyph,details,actions);list.append(card);
    }
  }
  async function upload(file){
    if(state.busy)return;
    if(!file||file.size<1||file.size>MAX_BYTES){say('Select a non-empty native project file no larger than 500 MB.');return}
    const app=selector.value;
    if(!EDITORS.has(app)){say('Choose the editor that created this project.');return}
    state.busy=true;state.cancelled=false;state.controller=new AbortController();
    picker.disabled=selector.disabled=refreshButton.disabled=true;
    cancelButton.hidden=false;state.uploadId=null;
    try{
      const start=await json('',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:file.name,app,size:file.size})});
      state.uploadId=start.id;
      if(!start.id||!Number.isSafeInteger(start.partCount)||!Number.isSafeInteger(start.chunkSize))
        throw Error('The cloud upload session is invalid.');
      const parts=[];
      for(let n=1;n<=start.partCount;n++){
        if(state.cancelled)throw Error('Upload cancelled.');
        const section=file.slice((n-1)*start.chunkSize,Math.min(file.size,n*start.chunkSize));
        say('Uploading native project section '+n+' of '+start.partCount+' · '+Math.round(((n-1)/start.partCount)*100)+'%');
        const receipt=await json('/'+encodeURIComponent(start.id)+'/part/'+n,{
          method:'PUT',headers:{'Content-Type':'application/octet-stream'},body:section,signal:state.controller.signal
        });
        parts.push({partNumber:n,etag:receipt.etag});
      }
      if(state.cancelled)throw Error('Upload cancelled.');
      const finished=await json('/'+encodeURIComponent(start.id)+'/complete',{
        method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({parts})
      });
      if(!finished?.ok)throw Error('Storage did not confirm the complete project.');
      state.uploadId=null;
      say('Native project saved privately to BIG LWA. The original editable format was preserved.');
      state.busy=false;await load();
    }catch(err){
      if(state.uploadId){
        try{await json('/'+encodeURIComponent(state.uploadId)+'/upload',{method:'DELETE'})}catch{}
      }
      state.uploadId=null;
      say(state.cancelled?'Upload cancelled. The local original was not changed.':err.message);
    }finally{
      state.busy=false;state.controller=null;
      picker.disabled=selector.disabled=refreshButton.disabled=false;
      cancelButton.hidden=true;
    }
  }
  picker.addEventListener('change',()=>{const file=picker.files?.[0];picker.value='';if(file)upload(file)});
  cancelButton.addEventListener('click',()=>{state.cancelled=true;state.controller?.abort();say('Cancelling the upload…')});
  refreshButton.addEventListener('click',load);
  host.addEventListener('biglwa:project-vault-reload',load);
  const current=typeof active==='function'?active():'';
  if(EDITORS.has(current))selector.value=current;
  Promise.resolve(window.BigLWAAccountStorage?.ready).then(load).catch(err=>say(err.message));
  return {load,setEditor(app){if(EDITORS.has(app))selector.value=app}};
}
