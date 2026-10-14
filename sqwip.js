/* BIG LWA Sqwip — an independent, local-first screenplay writing desk.
   Does not load scripts from other websites or imply YouMeScript integration.
   Existing Diary entries remain in their original storage key. */
(function(){
'use strict';
if(window.BigLWASqwip)return;
const TYPES=[
 ['scene','Scene Heading','INT. LOCATION - DAY'],
 ['action','Action','Describe what happens on screen…'],
 ['character','Character','CHARACTER NAME'],
 ['dialogue','Dialogue','What the character says…'],
 ['parenthetical','Parenthetical','(quietly)'],
 ['transition','Transition','CUT TO:'],
 ['shot','Shot','CLOSE ON:']
];
const TYPE_NAMES=new Map(TYPES.map(entry=>[entry[0],entry[1]]));
const KEYS=TYPES.map(entry=>entry[0]);
const IDLE_KEY='biglwaSqwipV1';
const MAX_DOCS=36,MAX_BLOCKS=1500,MAX_CHARS=15000,MAX_FILE=2*1024*1024;
let host=null,state=null,namespace='',timer=null,selectedBlock='',loadingError='',listening=false;
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const uid=()=>String(window.__biglwaIdentity?.uid||'').trim();
const key=()=>IDLE_KEY+':'+(uid()||'browser-guest');
const newId=()=>typeof crypto?.randomUUID==='function'?crypto.randomUUID():'sq_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,10);
function block(type='action',text=''){return {id:newId(),type:TYPE_NAMES.has(type)?type:'action',text:String(text||'').slice(0,MAX_CHARS)}}
function newDoc(title='Untitled Screenplay'){return {id:newId(),title,author:'',updatedAt:Date.now(),blocks:[block('scene')]} }
function cleanDocument(raw){
 if(!raw||typeof raw!=='object')return null;
 return {id:String(raw.id||newId()).slice(0,120),title:String(raw.title||'Untitled Screenplay').slice(0,130),
  author:String(raw.author||'').slice(0,100),updatedAt:Number(raw.updatedAt)||Date.now(),
  blocks:(Array.isArray(raw.blocks)?raw.blocks:[]).slice(0,MAX_BLOCKS)
   .map(x=>({id:String(x?.id||newId()).slice(0,120),type:TYPE_NAMES.has(x?.type)?x.type:'action',
     text:String(x?.text||'').slice(0,MAX_CHARS)}))}
}
function loadStore(){
 namespace=key();loadingError='';
 try{
  const raw=localStorage.getItem(namespace);
  if(raw){
   const parsed=JSON.parse(raw);
   const docs=(Array.isArray(parsed?.documents)?parsed.documents:[]).slice(0,MAX_DOCS).map(cleanDocument).filter(Boolean);
   if(docs.length)return {documents:docs,selectedId:docs.some(d=>d.id===parsed.selectedId)?parsed.selectedId:docs[0].id};
  }
 }catch(error){console.warn('SQWIP load:',error);loadingError='Saved scripts could not be opened. Export any recoverable browser data before clearing storage.'}
 const first=newDoc();
 return {documents:[first],selectedId:first.id};
}
const current=()=>state?.documents.find(d=>d.id===state.selectedId)||state?.documents[0];
function saveNow(){
 if(!state)return false;
 clearTimeout(timer);
 const d=current();if(d)d.updatedAt=Date.now();
 try{
  localStorage.setItem(namespace,JSON.stringify(state));
  setStatus('Saved in this browser · export a backup',true);
  updateCounts();return true;
 }catch(error){
  console.error('SQWIP browser save:',error);
  setStatus('Save failed: browser storage is full or unavailable. Export your script now.',false);
  return false;
 }
}
function queueSave(){
 const status=host?.querySelector('#sqwipSaveStatus');
 if(status){status.textContent='Saving…';status.dataset.ok='false'}
 clearTimeout(timer);timer=setTimeout(saveNow,420);
 updateCounts();
}
function setStatus(value,ok){
 const el=host?.querySelector('#sqwipSaveStatus');if(!el)return;
 el.textContent=value;el.dataset.ok=String(Boolean(ok));
}
function filename(text){return String(text||'screenplay').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80)||'screenplay'}
function currentLine(){return current()?.blocks.find(x=>x.id===selectedBlock)||current()?.blocks[0]}
function positionOf(element){
 const selection=window.getSelection();
 if(!selection?.rangeCount||!element.contains(selection.anchorNode))return element.textContent.length;
 const probe=selection.getRangeAt(0).cloneRange();
 probe.selectNodeContents(element);
 try{probe.setEnd(selection.anchorNode,selection.anchorOffset);return probe.toString().length}
 catch{return element.textContent.length}
}
function focusBlock(id,caret='end'){
 const element=host?.querySelector('.sqwip-text[data-id="'+CSS.escape(id)+'"]');
 if(!element)return;
 element.focus();
 const node=element.firstChild||element.appendChild(document.createTextNode(''));
 const length=node.textContent?.length||0;
 const n=caret==='start'?0:typeof caret==='number'?Math.min(Math.max(caret,0),length):length;
 const range=document.createRange();range.setStart(node,n);range.collapse(true);
 const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);
 selectedBlock=id;updateTypePicker();
}
function nextType(type){
 return ({scene:'action',action:'action',character:'dialogue',dialogue:'action',parenthetical:'dialogue',transition:'scene',shot:'action'})[type]||'action';
}
function updateTypePicker(){
 const line=currentLine();const picker=host?.querySelector('#sqwipElementType');
 if(picker&&line)picker.value=line.type;
 host?.querySelectorAll('.sqwip-line.is-focused').forEach(node=>node.classList.remove('is-focused'));
 const active=host?.querySelector('.sqwip-text[data-id="'+CSS.escape(selectedBlock)+'"]');
 active?.closest('.sqwip-line')?.classList.add('is-focused');
}
function wordCount(doc){
 return doc.blocks.reduce((count,line)=>count+(line.text.trim().match(/\S+/g)||[]).length,0);
}
function estimatePages(doc){
 const lineCount=doc.blocks.reduce((count,line)=>count+Math.max(1,Math.ceil(line.text.length/(line.type==='dialogue'?35:60))),0);
 return Math.max(1,Math.ceil((lineCount+13)/55));
}
function updateCounts(){
 const d=current();if(!d)return;
 const el=host?.querySelector('#sqwipPageCount');
 if(el)el.textContent=estimatePages(d)+' estimated page(s) · '+wordCount(d)+' words · '+d.blocks.length+' elements';
 const scenes=host?.querySelector('#sqwipScenes');
 if(scenes&&scenes.dataset.signature!==d.blocks.filter(x=>x.type==='scene').map(x=>x.id+':'+x.text).join('|'))renderScenes();
}
function renderScenes(){
 const doc=current(),panel=host?.querySelector('#sqwipScenes');if(!panel||!doc)return;
 const scenes=doc.blocks.filter(x=>x.type==='scene');
 panel.dataset.signature=scenes.map(x=>x.id+':'+x.text).join('|');
 panel.innerHTML='<strong>Scenes</strong>'+(scenes.length?scenes.map((line,i)=>
  '<button type="button" data-sqwip-jump="'+esc(line.id)+'">'+String(i+1).padStart(2,'0')+' · '+esc(line.text.trim()||'Untitled scene')+'</button>').join(''):'<p>Add a scene heading to start an outline.</p>');
}
function renderBlocks(focusId='',caret='end'){
 const doc=current(),container=host?.querySelector('#sqwipPages');if(!container||!doc)return;
 if(!doc.blocks.length)doc.blocks.push(block('scene'));
 container.innerHTML=doc.blocks.map((item,i)=>
  '<div class="sqwip-line sqwip-type-'+item.type+'" data-sqwip-line="'+esc(item.id)+'">'+
   '<span class="sqwip-line-num" aria-hidden="true">'+(i+1)+'</span>'+
   '<div class="sqwip-text" contenteditable="true" spellcheck="true" role="textbox" aria-multiline="false"'+
     ' data-id="'+esc(item.id)+'" data-placeholder="'+esc(TYPES.find(x=>x[0]===item.type)?.[2]||'')+'" aria-label="'+esc(TYPE_NAMES.get(item.type))+'"></div></div>'
  ).join('');
 doc.blocks.forEach(item=>{
  const editor=container.querySelector('.sqwip-text[data-id="'+CSS.escape(item.id)+'"]');
  if(editor)editor.textContent=item.text;
 });
 renderScenes();updateCounts();
 if(focusId)requestAnimationFrame(()=>focusBlock(focusId,caret));
}
function setType(type){
 const d=current(),line=currentLine();
 if(!d||!line||!TYPE_NAMES.has(type))return;
 line.type=type;
 if(['scene','character','transition','shot'].includes(type))line.text=line.text.toUpperCase();
 renderBlocks(line.id);queueSave();
}
function insertAfter(anchorId,type='action',text='',caret='end'){
 const d=current();if(!d)return;
 if(d.blocks.length>=MAX_BLOCKS){setStatus('This draft is at the 1,500-element limit. Export a copy.',false);return}
 const index=d.blocks.findIndex(x=>x.id===anchorId);
 const added=block(type,text);d.blocks.splice(index<0?d.blocks.length:index+1,0,added);
 renderBlocks(added.id,caret);queueSave();
 return added;
}
function handleEnter(editor){
 const doc=current(),line=currentLine();if(!doc||!line)return;
 const offset=positionOf(editor),text=editor.textContent||'';
 const before=text.slice(0,offset),after=text.slice(offset);
 line.text=before.slice(0,MAX_CHARS);
 const upcoming=nextType(line.type);
 if(['scene','character','transition','shot'].includes(line.type))line.text=line.text.toUpperCase();
 const inserted=insertAfter(line.id,upcoming,after,'start');
 if(inserted)selectedBlock=inserted.id;
}
function handleBackspace(editor){
 const doc=current(),index=doc?.blocks.findIndex(x=>x.id===editor.dataset.id);
 if(!doc||index<=0)return false;
 const before=doc.blocks[index-1],line=doc.blocks[index];
 const offset=before.text.length;
 if(before.text.length+line.text.length>MAX_CHARS)return false;
 before.text+=line.text;doc.blocks.splice(index,1);
 renderBlocks(before.id,offset);queueSave();
 return true;
}
function handleBlockKey(event,editor){
 const d=current(),line=d?.blocks.find(x=>x.id===editor.dataset.id);
 if(!line)return;
 const shortcut=event.altKey&&!event.ctrlKey&&!event.metaKey?Number(event.key):0;
 if(shortcut>=1&&shortcut<=TYPES.length){event.preventDefault();selectedBlock=line.id;setType(TYPES[shortcut-1][0]);return}
 const cmd=event.metaKey||event.ctrlKey;
 if(cmd&&event.key.toLowerCase()==='s'){event.preventDefault();saveNow();return}
 if(cmd&&event.key==='Enter'){event.preventDefault();insertAfter(line.id,'scene','','start');return}
 if(cmd||event.altKey)return;
 if(event.key==='Tab'){
  event.preventDefault();
  const index=KEYS.indexOf(line.type),next=KEYS[(index+(event.shiftKey?KEYS.length-1:1))%KEYS.length];
  selectedBlock=line.id;setType(next);return;
 }
 if(event.key==='Enter'){event.preventDefault();handleEnter(editor);return}
 if(event.key==='Backspace'&&positionOf(editor)===0){
  if(handleBackspace(editor))event.preventDefault();return;
 }
 if(['ArrowUp','ArrowDown'].includes(event.key)){
  const position=positionOf(editor),length=(editor.textContent||'').length;
  if(event.key==='ArrowUp'&&position!==0)return;
  if(event.key==='ArrowDown'&&position!==length)return;
  const index=d.blocks.findIndex(x=>x.id===line.id);
  const other=d.blocks[index+(event.key==='ArrowUp'?-1:1)];
  if(other){event.preventDefault();focusBlock(other.id,event.key==='ArrowUp'?'end':'start')}
 }
}
function refreshSelector(){
 const picker=host?.querySelector('#sqwipScriptSelect'),d=current();
 if(!picker)return;
 picker.innerHTML=state.documents.map(row=>'<option value="'+esc(row.id)+'"'+(row.id===state.selectedId?' selected':'')+'>'+esc(row.title||'Untitled Screenplay')+'</option>').join('');
 const title=host.querySelector('#sqwipTitle'),author=host.querySelector('#sqwipAuthor');
 if(title)title.value=d?.title||'';
 if(author)author.value=d?.author||'';
 renderBlocks();
}
function downloadable(text,name,type){
 const link=document.createElement('a'),url=URL.createObjectURL(new Blob([text],{type}));
 link.href=url;link.download=name;link.style.display='none';document.body.appendChild(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),5000);
}
function fountain(doc){
 const lines=['Title: '+(doc.title||'Untitled Screenplay'),'Author: '+(doc.author||'BIG LWA'),'', ''];
 doc.blocks.forEach((item,i)=>{
  let text=item.text.trimEnd();
  if(['scene','character','transition','shot'].includes(item.type))text=text.toUpperCase();
  if(item.type==='transition'&&text&&!text.startsWith('>'))text='> '+text;
  if(item.type==='shot'&&text&&!text.startsWith('!'))text='!'+text;
  if(item.type==='character'&&text&&!text.startsWith('@'))text='@'+text;
  lines.push(text);
  if(!['character','parenthetical'].includes(item.type))lines.push('');
 });
 return lines.join('\n').trimEnd()+'\n';
}
function toPlainText(doc){return doc.title+'\nby '+(doc.author||'Anonymous')+'\n\n'+doc.blocks.map(b=>b.text).join('\n\n')+'\n'}
function parseFountain(source){
 const text=String(source||'').replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n');
 const blocks=[];let title='',author='',header=true,previous='action';
 for(const original of text.split('\n')){
  const trimmed=original.trim();if(header&&/^Title:\s*/i.test(trimmed)){title=trimmed.replace(/^Title:\s*/i,'');continue}
  if(header&&/^(Author|Authors):\s*/i.test(trimmed)){author=trimmed.replace(/^(Author|Authors):\s*/i,'');continue}
  if(!trimmed){header=false;previous=previous==='character'?'character':'action';continue}
  header=false;
  const upper=trimmed===trimmed.toUpperCase()&&/[A-Z]/.test(trimmed);
  let type='action',value=trimmed;
  if(/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.|EST\.)(\s|$)/i.test(trimmed)||/^\.[A-Z]/.test(trimmed)){type='scene';value=trimmed.replace(/^\./,'')}
  else if(trimmed.startsWith('>')||(/(TO:|FADE OUT\.?)$/.test(trimmed)&&upper)){type='transition';value=trimmed.replace(/^>\s*/,'')}
  else if(trimmed.startsWith('!')){type='shot';value=trimmed.replace(/^!/,'')}
  else if(/^\(.+\)$/.test(trimmed)){type='parenthetical'}
  else if(trimmed.startsWith('@')||(upper&&trimmed.length<44&&!/[.!?]$/.test(trimmed))){type='character';value=trimmed.replace(/^@/,'')}
  else if(['character','parenthetical','dialogue'].includes(previous)){type='dialogue'}
  blocks.push(block(type,value));previous=type;
  if(blocks.length>=MAX_BLOCKS)break;
 }
 return {title,author,blocks:blocks.length?blocks:[block('scene')]};
}
function exportCurrent(format){
 const doc=current();if(!doc)return;
 if(format==='fountain')downloadable(fountain(doc),filename(doc.title)+'.fountain','text/plain;charset=utf-8');
 else if(format==='text')downloadable(toPlainText(doc),filename(doc.title)+'.txt','text/plain;charset=utf-8');
 else if(format==='json')downloadable(JSON.stringify(doc,null,2),filename(doc.title)+'.sqwip.json','application/json');
 else if(format==='print'){saveNow();document.body.classList.add('sqwip-print-mode');window.print();setTimeout(()=>document.body.classList.remove('sqwip-print-mode'),1000)}
}
async function importFile(file){
 if(!file)return;
 if(file.size>MAX_FILE){setStatus('Script file is too large (2 MB maximum).',false);return}
 try{
  const text=await file.text();
  let draft;
  if(file.name.toLowerCase().endsWith('.json')){
   const content=JSON.parse(text);
   draft=cleanDocument(content.document||content);
   if(!draft)throw Error('Invalid Sqwip script');
  }else draft={...newDoc(),...parseFountain(text)};
  if(state.documents.length>=MAX_DOCS)throw Error('Script library is full: export or remove an old script first.');
  draft.id=newId();
  draft.title=String(draft.title||file.name.replace(/\.(fountain|txt)$/i,'')||'Imported script').slice(0,130);
  draft.blocks=draft.blocks.length?draft.blocks:[block('scene')];
  state.documents.push(draft);state.selectedId=draft.id;
  refreshSelector();queueSave();setStatus('Script imported · saved in this browser',true);
 }catch(error){console.warn('SQWIP import:',error);setStatus('Could not import that Fountain, text or Sqwip JSON file.',false)}
}
function onClick(event){
 const button=event.target.closest('button');if(!button||!host.contains(button))return;
 const jump=button.dataset.sqwipJump;
 if(jump){focusBlock(jump,'start');return}
 if(button.dataset.sqwipAdd){const d=current();insertAfter(selectedBlock||d.blocks.at(-1)?.id,button.dataset.sqwipAdd);return}
 if(button.dataset.sqwipExport){exportCurrent(button.dataset.sqwipExport);return}
 if(button.id==='sqwipNew'){
  if(state.documents.length>=MAX_DOCS){setStatus('Up to 36 scripts can be kept in this browser. Export and delete one first.',false);return}
  const draft=newDoc();state.documents.push(draft);state.selectedId=draft.id;selectedBlock='';
  saveNow();refreshSelector();focusBlock(draft.blocks[0].id,'start');return;
 }
 if(button.id==='sqwipDuplicate'){
  const original=current(),copy=cleanDocument(JSON.parse(JSON.stringify(original)));
  if(state.documents.length>=MAX_DOCS||!copy)return;
  copy.id=newId();copy.title=(copy.title+' (copy)').slice(0,130);
  copy.blocks=copy.blocks.map(line=>({...line,id:newId()}));
  state.documents.push(copy);state.selectedId=copy.id;saveNow();refreshSelector();return;
 }
 if(button.id==='sqwipDelete'){
  if(state.documents.length===1){setStatus('Keep at least one script. You can clear its contents or create a new draft.',false);return}
  if(!window.confirm('Delete this script from this browser? This cannot be undone without a saved backup.'))return;
  state.documents=state.documents.filter(doc=>doc.id!==state.selectedId);
  state.selectedId=state.documents[0].id;saveNow();refreshSelector();
 }
 if(button.id==='sqwipImportButton'){host.querySelector('#sqwipImportFile')?.click()}
 if(button.id==='sqwipSave'){saveNow()}
}
function onInput(event){
 const editor=event.target.closest('.sqwip-text');
 if(editor){
  const line=current()?.blocks.find(item=>item.id===editor.dataset.id);
  if(!line)return;
  line.text=(editor.textContent||'').replace(/\u00a0/g,' ').slice(0,MAX_CHARS);
  selectedBlock=line.id;queueSave();return;
 }
 if(event.target.id==='sqwipTitle'||event.target.id==='sqwipAuthor'){
  const d=current();if(!d)return;
  if(event.target.id==='sqwipTitle')d.title=event.target.value.slice(0,130);
  else d.author=event.target.value.slice(0,100);
  queueSave();
 }
}
function onChange(event){
 const target=event.target;
 if(target.id==='sqwipScriptSelect'){
  saveNow();state.selectedId=target.value;selectedBlock='';refreshSelector();return;
 }
 if(target.id==='sqwipElementType'){setType(target.value);return}
 if(target.id==='sqwipImportFile'){importFile(target.files?.[0]);target.value=''}
}
function onPaste(event){
 const editor=event.target.closest('.sqwip-text');if(!editor)return;
 event.preventDefault();
 const content=event.clipboardData?.getData('text/plain')||'';
 if(!content)return;
 const selection=window.getSelection();
 if(selection?.rangeCount){
  const range=selection.getRangeAt(0);
  range.deleteContents();range.insertNode(document.createTextNode(content.replace(/\r\n?/g,'\n')));
  range.collapse(false);selection.removeAllRanges();selection.addRange(range);
 }
 const line=current()?.blocks.find(item=>item.id===editor.dataset.id);
 if(line){line.text=(editor.textContent||'').slice(0,MAX_CHARS);queueSave()}
}
function mount(root){
 if(!root)return;
 if(host&&host!==root)saveNow();
 host=root;state=loadStore();selectedBlock='';
 host.classList.add('sqwip-root');
 host.innerHTML='<div class="sqwip-shell">'+
  '<div class="sqwip-top"><div><span class="sqwip-eyebrow">BIG LWA · THE WRITER’S DESK</span><h2>sqwip<span class="sqwip-cursor">_</span></h2><p>Screenplay formatting, scenes and dialogue. Private browser autosave · export a backup.</p></div>'+
  '<div class="sqwip-doc-toolbar"><label>Screenplay <select id="sqwipScriptSelect" aria-label="Choose screenplay"></select></label><button id="sqwipNew" type="button">+ New</button><button id="sqwipDuplicate" type="button">Duplicate</button><button id="sqwipDelete" type="button" class="sqwip-danger">Delete</button></div></div>'+
  '<div class="sqwip-details"><label>Title <input id="sqwipTitle" maxlength="130" placeholder="Untitled Screenplay" autocomplete="off"></label>'+
  '<label>Written by <input id="sqwipAuthor" maxlength="100" placeholder="Author" autocomplete="off"></label>'+
  '<span id="sqwipSaveStatus" role="status">Saved locally</span></div>'+
  '<div class="sqwip-toolstrip"><label>Element <select id="sqwipElementType" aria-label="Current screenplay element">'+
  TYPES.map(item=>'<option value="'+item[0]+'">'+item[1]+'</option>').join('')+'</select></label>'+
  '<button type="button" data-sqwip-add="scene">+ Scene</button><button type="button" data-sqwip-add="character">+ Character</button><button type="button" data-sqwip-add="action">+ Action</button>'+
  '<div class="sqwip-file-actions"><button type="button" id="sqwipImportButton">Import</button><button type="button" data-sqwip-export="fountain">.fountain</button><button type="button" data-sqwip-export="text">.txt</button><button type="button" data-sqwip-export="json">Backup</button><button type="button" data-sqwip-export="print">Print / PDF</button><input id="sqwipImportFile" type="file" accept=".fountain,.txt,.json,text/plain,application/json" hidden></div></div>'+
  '<div class="sqwip-workbench"><aside class="sqwip-sidebar"><div id="sqwipScenes"></div><div class="sqwip-shortcuts"><b>Writing shortcuts</b>'+
  '<p><kbd>Enter</kbd> next element</p><p><kbd>Tab</kbd> cycle format</p><p><kbd>Shift + Tab</kbd> previous</p><p><kbd>Alt + 1–7</kbd> choose element</p><p><kbd>⌘ / Ctrl + Enter</kbd> new scene</p><p><kbd>⌘ / Ctrl + S</kbd> save</p></div></aside>'+
  '<div class="sqwip-paper-wrap"><div class="sqwip-paper" role="document" aria-label="Screenplay editor">'+
  '<div class="sqwip-paper-heading">BIG LWA / SQWIP · DRAFT</div><div id="sqwipPages"></div></div>'+
  '<footer class="sqwip-bottom"><span id="sqwipPageCount"></span><button type="button" id="sqwipSave">Save now</button></footer></div></div>'+
  '</div>';
 host.addEventListener('click',onClick);
 host.addEventListener('input',onInput);
 host.addEventListener('change',onChange);
 host.addEventListener('focusin',event=>{
  const el=event.target.closest('.sqwip-text');
  if(el){selectedBlock=el.dataset.id;updateTypePicker()}
 });
 host.addEventListener('keydown',event=>{const el=event.target.closest('.sqwip-text');if(el)handleBlockKey(event,el)});
 host.addEventListener('paste',onPaste);
 refreshSelector();
 if(loadingError)setStatus(loadingError,false);else setStatus('Saved in this browser · export a backup',true);
}
if(!listening){
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')saveNow()});
 window.addEventListener('beforeunload',saveNow);
 document.addEventListener('biglwa:auth-state',()=>{if(host?.isConnected&&key()!==namespace)mount(host)});
 listening=true;
}
window.BigLWASqwip={mount,serialize:()=>state?JSON.parse(JSON.stringify(state)):null,
 get types(){return TYPES.map(x=>x[0])},
 parseFountain,fountain,wordCount,estimatePages};
})();