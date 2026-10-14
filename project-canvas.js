/* Big LWA Projects: visual, locally persisted creative workspace. */
(()=>{'use strict';
if(window.__biglwaProjectCanvas)return;
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let active=null,boards=[],current='',drag=null,saveTimer=null;
const uid=()=>window.__biglwaIdentity?.uid||'guest';
const key=()=> 'biglwaProjectCanvas:v1:'+uid();
const id=()=>String(Date.now())+Math.random().toString(36).slice(2,7);
function load(){
 try{boards=JSON.parse(localStorage.getItem(key())||'[]');if(!Array.isArray(boards))boards=[]}catch{boards=[]}
 if(!boards.length){
  let legacy=[];try{legacy=JSON.parse(localStorage.getItem('biglwaModule_projects')||'[]')}catch{}
  if(Array.isArray(legacy)&&legacy.length)boards=legacy.map((p,i)=>({id:id(),title:p.title||'Untitled project',items:[{id:id(),type:'note',text:p.detail||p.meta||'',x:48,y:45}]}));
 }
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
 else content='<textarea data-field="text" placeholder="Write an idea…">'+esc(item.text)+'</textarea>';
 return '<article class="lwa-project-item '+esc(item.type)+'" data-card="'+esc(item.id)+'" style="left:'+Number(item.x||0)+'px;top:'+Number(item.y||0)+'px"><header data-drag><span>⠿ '+esc(item.type)+'</span><button data-delete="'+esc(item.id)+'" aria-label="Delete card" title="Delete card">×</button></header>'+content+'</article>';
}
function render(){
 const root=$('#lwaProjects');if(!root)return;
 root.innerHTML='<div class="lwa-project-toolbar"><div><h2>projects · canvas</h2><p>Make room for ideas, references, and works in progress.</p></div><div class="lwa-project-controls"><button data-new-board>+ New project</button><select aria-label="Choose project" id="lwaProjectChoice">'+boards.map(b=>'<option value="'+esc(b.id)+'"'+(b.id===current?' selected':'')+'>'+esc(b.title)+'</option>').join('')+'</select><button data-rename>Rename</button><button data-remove-board>Delete project</button></div></div><div class="lwa-project-tools"><button data-add="note">+ Note</button><button data-add="image">+ Image</button><button data-add="link">+ Link</button><button data-add="tasks">+ Tasks</button><span id="lwaProjectStatus" role="status">Saved in this browser · private draft</span></div><div class="lwa-project-board" id="lwaProjectBoard"><div class="lwa-project-guide">Drag cards to arrange your workspace · edit cards in place</div>'+(board()?.items||[]).map(card).join('')+'</div><p class="lwa-project-foot">Projects are currently browser-saved drafts, not yet synced across devices or shared with collaborators.</p>';
}
function mount(){
 const body=$('#moduleWorkspaceBody');if(!body||$('#moduleRouteName')?.textContent!=='Projects')return;
 load();
 body.innerHTML='<section id="lwaProjects"></section>';
 render();
}
function add(type){
 if(!board())return;
 const item={id:id(),type,text:'',url:'',x:38+(board().items.length%5)*35,y:65+(board().items.length%5)*40};
 if(type==='image'){const url=prompt('Image URL (https://)');if(!url)return;try{const u=new URL(url);if(u.protocol!=='https:')throw Error();item.url=u.href}catch{return alert('Enter a valid HTTPS image URL.')}}
 if(type==='link'){const url=prompt('Reference URL (https://)');if(!url)return;try{const u=new URL(url);if(!['https:','http:'].includes(u.protocol))throw Error();item.url=u.href}catch{return alert('Enter a valid web URL.')}}
 board().items.push(item);save();render();
}
document.addEventListener('biglwa:module-open',e=>{if(e.detail?.key==='projects'||e.detail?.key==='project')mount()});
document.addEventListener('click',e=>{
 const root=e.target.closest('#lwaProjects');if(!root)return;
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.add){add(b.dataset.add);return}
 if(b.hasAttribute('data-new-board')){const title=prompt('Project title','New project');if(!title?.trim())return;const next={id:id(),title:title.trim(),items:[]};boards.push(next);current=next.id;save();render()}
 if(b.hasAttribute('data-rename')&&board()){const title=prompt('Rename project',board().title);if(title?.trim()){board().title=title.trim();save();render()}}
 if(b.hasAttribute('data-remove-board')&&board()&&confirm('Delete this project and its cards?')){boards=boards.filter(b=>b.id!==current);current=boards[0]?.id||'';save();render()}
 if(b.dataset.delete&&board()){board().items=board().items.filter(i=>i.id!==b.dataset.delete);save();render()}
});
document.addEventListener('change',e=>{
 if(e.target.id==='lwaProjectChoice'){current=e.target.value;render();return}
 const itemEl=e.target.closest('#lwaProjects [data-card]');if(!itemEl||!board())return;
 const item=board().items.find(i=>i.id===itemEl.dataset.card);if(item&&e.target.dataset.field){item[e.target.dataset.field]=e.target.value;save()}
});
document.addEventListener('input',e=>{
 const itemEl=e.target.closest('#lwaProjects [data-card]');if(!itemEl||!board()||!e.target.dataset.field)return;
 const item=board().items.find(i=>i.id===itemEl.dataset.card);if(item){item[e.target.dataset.field]=e.target.value;save()}
});
document.addEventListener('pointerdown',e=>{
 const handle=e.target.closest('#lwaProjects [data-drag]');if(!handle||e.target.closest('button'))return;
 const el=handle.closest('[data-card]'),canvas=$('#lwaProjectBoard');if(!canvas)return;
 const rect=canvas.getBoundingClientRect(),r=el.getBoundingClientRect();
 drag={el,id:el.dataset.card,ox:e.clientX-r.left,oy:e.clientY-r.top,rect};handle.setPointerCapture?.(e.pointerId);e.preventDefault();
});
document.addEventListener('pointermove',e=>{
 if(!drag)return;
 const x=Math.max(0,Math.round(e.clientX-drag.rect.left-drag.ox)),y=Math.max(0,Math.round(e.clientY-drag.rect.top-drag.oy));
 drag.el.style.left=x+'px';drag.el.style.top=y+'px';
});
document.addEventListener('pointerup',()=>{
 if(!drag)return;
 const item=board()?.items.find(i=>i.id===drag.id);
 if(item){item.x=parseInt(drag.el.style.left,10)||0;item.y=parseInt(drag.el.style.top,10)||0;save()}
 drag=null;
});
window.__biglwaProjectCanvas={mount};
const css=document.createElement('style');css.textContent=`
#lwaProjects{font-family:system-ui,sans-serif;color:#302b28}
.lwa-project-toolbar{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;margin:14px 0 16px}
.lwa-project-toolbar h2{font:600 30px Georgia,serif;margin:0}.lwa-project-toolbar p{font-size:13px;margin:5px 0;color:#766a61}
.lwa-project-controls,.lwa-project-tools{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
#lwaProjects button,#lwaProjects select{cursor:pointer;border:1px solid #d9ccc1;border-radius:10px;padding:10px 12px;background:#fff9f1;color:#302b28;font:600 12px system-ui}
#lwaProjects button:hover{background:#f5dfc9}.lwa-project-tools{padding:12px 0}.lwa-project-tools span{margin-left:auto;font-size:11px;color:#756d66}
.lwa-project-board{position:relative;overflow:auto;min-height:720px;min-width:100%;border:1px solid #ded2c4;border-radius:18px;background-color:#f4eee4;background-image:radial-gradient(#cbbeb0 1px,transparent 1px);background-size:22px 22px}
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
`;document.head.append(css);
})();