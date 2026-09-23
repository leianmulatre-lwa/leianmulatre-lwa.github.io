(function(){
const style=document.createElement('style');style.textContent='.biglwa-room-user-search{margin:12px 0 16px}.biglwa-room-user-search label{display:grid;gap:6px}.biglwa-room-user-search label>span{font-size:9px;text-transform:uppercase;letter-spacing:.12em;color:var(--widget-muted,#77716b)}.biglwa-room-user-search input{width:100%;box-sizing:border-box;border:1px solid #d9d0c6;border-radius:10px;background:rgba(255,255,255,.66);padding:9px 10px;font:inherit;font-size:12px;outline:none}.biglwa-room-user-search input:focus{border-color:rgba(var(--aura-rgb,216,95,109),.7);box-shadow:0 0 0 3px rgba(var(--aura-rgb,216,95,109),.1)}.biglwa-room-search-results{display:grid;gap:5px;margin-top:7px}.biglwa-room-user-result{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;border:1px solid #ddd4ca;border-radius:9px;background:rgba(255,255,255,.55);padding:8px 10px;text-align:left;cursor:pointer}.biglwa-room-user-result b{font-size:11px}.biglwa-room-user-result span{font-size:10px;color:var(--widget-muted,#77716b);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.biglwa-room-search-empty{font-size:10px;color:var(--widget-muted,#77716b);margin:4px 0}';document.head.append(style);
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function directory(){var out=[];try{var v=JSON.parse(localStorage.getItem('biglwaUserDirectory')||'[]');if(Array.isArray(v))out=out.concat(v)}catch(e){}if(Array.isArray(window.__biglwaUsers))out=out.concat(window.__biglwaUsers);return out.filter(function(u){return u&&String(u.username||'').trim()})}
function room(){return document.querySelector('#studioApp [data-widget-route="rooms"],#studioApp [data-widget-route="room"],#studioApp #rooms,#studioApp #room')}
function ensure(){
 var card=room();if(!card)return;
 var box=card.querySelector('.biglwa-room-user-search');
 if(!box){box=document.createElement('div');box.className='biglwa-room-user-search';box.innerHTML='<label><span>Find a user</span><input type="search" autocomplete="off" spellcheck="false" placeholder="Search username…"></label><div class="biglwa-room-search-results" aria-live="polite" hidden></div>';var target=card.querySelector('.room-footer,.room-body,.card-body,.module-body')||card;target.prepend(box)}
 var input=box.querySelector('input'),results=box.querySelector('.biglwa-room-search-results');if(!input||input.dataset.biglwaBound==='1')return;
 input.dataset.biglwaBound='1';
 function render(){
  var q=input.value.trim().replace(/^@/,'').toLowerCase();
  if(!q){results.hidden=true;results.replaceChildren();return}
  var matches=directory().filter(function(u){return String(u.username).toLowerCase().indexOf(q)!==-1}).slice(0,12);
  results.hidden=false;
  if(!matches.length){results.innerHTML='<p class="biglwa-room-search-empty">No users found yet.</p>';return}
  results.innerHTML=matches.map(function(u){return '<button type="button" class="biglwa-room-user-result" data-username="'+esc(u.username)+'"><b>@'+esc(u.username)+'</b><span>'+esc(u.name||'')+'</span></button>'}).join('')
 }
 input.addEventListener('input',render);
 results.addEventListener('click',function(e){var b=e.target.closest('[data-username]');if(!b)return;window.dispatchEvent(new CustomEvent('biglwa:user-search',{detail:{username:b.dataset.username}}));var list=directory(),u=list.find(function(x){return String(x.username).toLowerCase()===b.dataset.username.toLowerCase()});if(u)location.href=(u.url||'/studio')});
}
function run(){ensure();requestAnimationFrame(ensure)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
window.addEventListener('biglwa:module-open',run);
})();