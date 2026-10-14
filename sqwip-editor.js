/* Sqwip — Big LWA Diary screenplay editor.
   Local-first, Fountain-compatible drafts. No third-party script service or assets. */
(function(){
'use strict';
const KEY='biglwaSqwipScriptsV1',ACTIVE='biglwaSqwipActiveV1';
const TYPES=['scene','action','character','dialogue','parenthetical','transition','note'];
const DEFAULT={scene:'INT. LOCATION - DAY',action:'Describe what happens…',character:'CHARACTER',dialogue:'Write dialogue…',parenthetical:'(quietly)',transition:'CUT TO:',note:'[[Production note]]'};
const NEXT={scene:'action',action:'action',character:'dialogue',dialogue:'character',parenthetical:'dialogue',transition:'scene',note:'action'};
let root=null,docs=[],active='',saveTimer=null;
const esc=x=>String(x==null?'':x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const id=()=>('sqwip_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8));
const fresh=()=>({id:id(),title:'Untitled screenplay',updatedAt:Date.now(),blocks:[{id:id(),type:'scene',text:'INT. LOCATION - DAY'},{id:id(),type:'action',text:''}]});
const current=()=>docs.find(d=>d.id===active)||docs[0];
function load(){
 try{docs=JSON.parse(localStorage.getItem(KEY)||'[]');if(!Array.isArray(docs))docs=[]}catch{docs=[]}
 docs=docs.filter(d=>d&&typeof d.id==='string'&&Array.isArray(d.blocks)).map(d=>({...d,title:String(d.title||'Untitled screenplay'),blocks:d.blocks.filter(b=>b&&TYPES.includes(b.type)&&typeof b.text==='string').map(b=>({...b,id:b.id||id()}))}));
 if(!docs.length)docs=[fresh()];
 try{active=localStorage.getItem(ACTIVE)||docs[0].id}catch{active=docs[0].id}
 if(!docs.some(d=>d.id===active))active=docs[0].id;
}
function persist(status='Saved privately on this device'){
 try{localStorage.setItem(KEY,JSON.stringify(docs));localStorage.setItem(ACTIVE,active);
  const el=root?.querySelector('#sqwipStatus');if(el)el.textContent=status;
 }catch{const el=root?.querySelector('#sqwipStatus');if(el)el.textContent='Storage full — export your screenplay now.'}
}
function schedule(){const d=current();if(d)d.updatedAt=Date.now();clearTimeout(saveTimer);saveTimer=setTimeout(()=>persist(),250);
 const el=root?.querySelector('#sqwipStatus');if(el)el.textContent='Saving…'}
function autoType(value,previous){
 const v=String(value||'').trim();
 if(/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.|EST\.)/i.test(v))return 'scene';
 if(/^(CUT TO:|FADE OUT:|DISSOLVE TO:|SMASH CUT TO:)/i.test(v))return 'transition';
 if(/^\[\[.*\]\]$/.test(v))return 'note';
 if(previous==='character'||previous==='parenthetical'||previous==='dialogue')return /^\(.+\)$/.test(v)?'parenthetical':'dialogue';
 if(/^[A-Z][A-Z0-9 .()'\-]{1,35}$/.test(v)&&v.replace(/[A-Z]/g,'').length<v.length)return 'character';
 return 'action';
}
function elementFountain(b){
 const t=String(b.text||'').replace(/\r/g,'').trim();
 if(!t)return '';
 if(b.type==='scene')return /^(INT\.|EXT\.|INT\/EXT\.|I\/E\.|EST\.)/i.test(t)?t.toUpperCase():'.'+t.toUpperCase();
 if(b.type==='character')return t.toUpperCase();
 if(b.type==='parenthetical')return /^\(/.test(t)?t:'('+t+')';
 if(b.type==='transition')return /^[A-Z][A-Z ]+:$/.test(t)?t:'>'+t.toUpperCase();
 if(b.type==='note')return /^\[\[/.test(t)?t:'[['+t+']]';
 return t;
}
function fountain(doc){
 const meta='Title: '+(doc.title||'Untitled screenplay')+'\nCredit: Written in Sqwip · Big LWA\n\n';
 return meta+doc.blocks.map(elementFountain).join('\n\n').trim()+'\n';
}
function parse(text){
 const lines=String(text||'').replace(/\r\n?/g,'\n').split('\n');
 const blocks=[];let previous='action';
 // Fountain title pages carry key/value meta; keep title separate from script.
 let seen=false;
 let title='';
 for(const line of lines){
  const value=line.trim();if(!value)continue;
  if(!seen&&/^Title:\s*/i.test(value)){title=value.replace(/^Title:\s*/i,'');continue}
  if(!seen&&/^(Credit|Author|Source|Draft date|Contact|Copyright):/i.test(value))continue;
  if(value==='---')continue;
  seen=true;
  const type=autoType(value,previous);
  const cleaned=type==='scene'&&value[0]==='.'?value.slice(1):type==='transition'&&value[0]==='>'?value.slice(1):value;
  blocks.push({id:id(),type,text:cleaned});
  previous=type;
 }
 return {title,blocks:blocks.length?blocks:[{id:id(),type:'scene',text:''}]};
}
function docOptions(){return docs.slice().sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0)).map(d=>'<option value="'+esc(d.id)+'"'+(d.id===active?' selected':'')+'>'+esc(d.title)+'</option>').join('')}
function render(){
 if(!root)return;
 const doc=current();if(!doc)return;
 root.innerHTML='<div class="sqwip-shell">'+
  '<div class="sqwip-toolbar"><div class="sqwip-heading"><small>BIG LWA / SCRIPT LAB</small><strong>sqwip</strong><span>screenplay studio</span></div>'+
  '<div class="sqwip-document-actions"><label class="sqwip-document-label">SCRIPT<select id="sqwipDocument" aria-label="Choose screenplay">'+docOptions()+'</select></label>'+
  '<button type="button" id="sqwipNew">+ new</button><button type="button" id="sqwipRename">rename</button><button type="button" id="sqwipDelete" class="is-danger">delete</button></div></div>'+
  '<div class="sqwip-editor-bar"><label>ELEMENT<select id="sqwipType" aria-label="Selected line format">'+TYPES.map(t=>'<option value="'+t+'">'+t+'</option>').join('')+'</select></label>'+
  '<button type="button" data-sqwip-insert="scene">+ scene</button><button type="button" data-sqwip-insert="character">+ character</button><button type="button" data-sqwip-insert="action">+ action</button>'+
  '<span class="sqwip-tool-spacer"></span><button type="button" id="sqwipImport">import</button><button type="button" id="sqwipExport">export .fountain</button><button type="button" id="sqwipPrint">print / PDF</button></div>'+
  '<div class="sqwip-page-container"><div class="sqwip-page" id="sqwipPage" aria-label="Screenplay editor">'+
  '<div class="sqwip-title-block"><strong>'+esc(doc.title)+'</strong><span>Written in Sqwip</span></div>'+
  '<div id="sqwipBlocks" class="sqwip-blocks">'+doc.blocks.map(b=>markup(b)).join('')+'</div>'+
  '<button type="button" id="sqwipAppend" class="sqwip-append">+ another line</button></div></div>'+
  '<footer class="sqwip-footer"><span id="sqwipStatus">Saved privately on this device</span>'+
  '<span id="sqwipCounts">'+metrics()+'</span>'+
  '<span>Enter · next line &nbsp; Tab · change format &nbsp; Ctrl/⌘ S · save</span></footer>'+
  '<input type="file" id="sqwipFile" accept=".fountain,.txt,text/plain" hidden></div>';
 bind();
}
function metrics(){const d=current();if(!d)return '';const wordCount=d.blocks.map(x=>x.text).join(' ').trim().split(/\s+/).filter(Boolean).length;return d.blocks.length+' elements · '+wordCount+' words'}
function markup(b){return '<div class="sqwip-line type-'+b.type+'" data-sqwip-id="'+esc(b.id)+'" data-sqwip-type="'+esc(b.type)+'">'+
 '<textarea rows="1" class="sqwip-line-input" aria-label="'+esc(b.type)+'" spellcheck="true" placeholder="'+esc(DEFAULT[b.type])+'">'+esc(b.text)+'</textarea></div>'}
function focusLine(id,atEnd=false){
 const line=Array.from(root.querySelectorAll('.sqwip-line')).find(e=>e.dataset.sqwipId===id);
 const editor=line?.querySelector('textarea');if(!editor)return;
 editor.focus();if(atEnd)editor.setSelectionRange(editor.value.length,editor.value.length);
 updateSelected(id);
}
function updateSelected(id){
 const b=current()?.blocks.find(x=>x.id===id);const control=root.querySelector('#sqwipType');if(control&&b)control.value=b.type;
}
function resize(el){if(!el)return;el.style.height='auto';el.style.height=Math.max(el.scrollHeight,21)+'px'}
function reflow(){root.querySelectorAll('.sqwip-line-input').forEach(resize)}
function replaceBlocks(){const area=root?.querySelector('#sqwipBlocks');if(!area)return;area.innerHTML=current().blocks.map(markup).join('');reflow();
 const count=root.querySelector('#sqwipCounts');if(count)count.textContent=metrics();
 schedule();
}
function addLine(afterId,type='action',text=''){
 const d=current();const pos=d.blocks.findIndex(x=>x.id===afterId);
 const element={id:id(),type,text};
 d.blocks.splice(pos<0?d.blocks.length:pos+1,0,element);
 replaceBlocks();focusLine(element.id);return element;
}
function lineAt(el){return current()?.blocks.find(b=>b.id===el?.closest('[data-sqwip-id]')?.dataset.sqwipId)}
function setType(b,type){if(!b||!TYPES.includes(type))return;b.type=type;
 const row=Array.from(root.querySelectorAll('.sqwip-line')).find(x=>x.dataset.sqwipId===b.id);
 if(row){row.className='sqwip-line type-'+type;row.dataset.sqwipType=type;row.querySelector('textarea').placeholder=DEFAULT[type];row.querySelector('textarea').setAttribute('aria-label',type)}
 updateSelected(b.id);schedule();
}
function download(filename,contents){
 const file=new Blob([contents],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(file),a=document.createElement('a');
 a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function bind(){
 const blocks=root.querySelector('#sqwipBlocks');
 blocks.addEventListener('focusin',e=>{const b=lineAt(e.target);if(b)updateSelected(b.id)});
 blocks.addEventListener('input',e=>{const input=e.target;if(!input.matches('textarea'))return;const b=lineAt(input);if(!b)return;b.text=input.value;resize(input);root.querySelector('#sqwipCounts').textContent=metrics();schedule()});
 blocks.addEventListener('keydown',e=>{
  if(!e.target.matches('textarea'))return;
  const input=e.target,b=lineAt(input);if(!b)return;
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();clearTimeout(saveTimer);persist('Saved');return}
  if(e.key==='Tab'){e.preventDefault();const i=TYPES.indexOf(b.type);setType(b,TYPES[(i+(e.shiftKey?TYPES.length-1:1))%TYPES.length]);return}
  if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();
   const caret=input.selectionStart;
   const before=input.value.slice(0,caret),after=input.value.slice(input.selectionEnd);
   b.text=before;
   let type=NEXT[b.type]||'action';
   if(b.type==='action'&&!before.trim())type='character';
   if(b.type==='dialogue'&&!before.trim())type='action';
   addLine(b.id,type,after);return;
  }
  if(e.key==='Backspace'&&input.selectionStart===0&&input.selectionEnd===0){
   const d=current(),index=d.blocks.findIndex(x=>x.id===b.id);
   if(index>0){e.preventDefault();const prev=d.blocks[index-1],caret=prev.text.length;prev.text+=b.text;d.blocks.splice(index,1);replaceBlocks();focusLine(prev.id);const editor=Array.from(root.querySelectorAll('.sqwip-line')).find(x=>x.dataset.sqwipId===prev.id)?.querySelector('textarea');editor?.setSelectionRange(caret,caret)}
  }
 });
 root.querySelector('#sqwipType').onchange=e=>{const line=document.activeElement?.closest?.('[data-sqwip-id]')||root.querySelector('.sqwip-line');setType(lineAt(line),e.target.value)};
 root.querySelectorAll('[data-sqwip-insert]').forEach(button=>button.onclick=()=>{
  const focused=document.activeElement?.closest?.('[data-sqwip-id]');
  addLine(focused?.dataset.sqwipId||current().blocks.at(-1)?.id,button.dataset.sqwipInsert);
 });
 root.querySelector('#sqwipAppend').onclick=()=>addLine(current().blocks.at(-1)?.id,'action');
 root.querySelector('#sqwipDocument').onchange=e=>{clearTimeout(saveTimer);persist();active=e.target.value;persist();render()};
 root.querySelector('#sqwipNew').onclick=()=>{clearTimeout(saveTimer);persist();const d=fresh();docs.unshift(d);active=d.id;persist();render();focusLine(d.blocks[0].id)};
 root.querySelector('#sqwipRename').onclick=()=>{const d=current();const name=window.prompt('Name this screenplay',d.title);if(name===null)return;d.title=name.trim().slice(0,120)||'Untitled screenplay';schedule();render()};
 root.querySelector('#sqwipDelete').onclick=()=>{if(!window.confirm('Delete this Sqwip screenplay from this browser? Export it first to keep a copy.'))return;docs=docs.filter(d=>d.id!==active);if(!docs.length)docs=[fresh()];active=docs[0].id;persist();render()};
 root.querySelector('#sqwipExport').onclick=()=>{const d=current();persist();download((d.title||'screenplay').replace(/[^a-z0-9_-]+/gi,'-').slice(0,75)+'.fountain',fountain(d))};
 root.querySelector('#sqwipImport').onclick=()=>root.querySelector('#sqwipFile').click();
 root.querySelector('#sqwipFile').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;if(file.size>2e6){root.querySelector('#sqwipStatus').textContent='Select a script smaller than 2 MB.';return}
  const raw=await file.text(),parsed=parse(raw);const d={id:id(),title:parsed.title||file.name.replace(/\.(fountain|txt)$/i,''),updatedAt:Date.now(),blocks:parsed.blocks};docs.unshift(d);active=d.id;persist('Imported');render()};
 root.querySelector('#sqwipPrint').onclick=()=>{clearTimeout(saveTimer);persist();window.print()};
 reflow();
}
function mount(host){if(!host)return;clearTimeout(saveTimer);root=host;load();render()}
window.BigLWASqwip={mount,parse,fountain,autoType,get documentCount(){return docs.length}};
})();
