(function(){
'use strict';
if(window.__biglwaPinterest) return;
const API='https://biglwa-instagram-api.leianmulatre-284.workers.dev/pinterest/';
const KEY='biglwaPinterestSession';
let connected=false,profile={},boards=[],pins=[],boardId='',boardsNext='',pinsNext='',busy=false,message='';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const session=()=>{try{return sessionStorage.getItem(KEY)||''}catch{return ''}};
const save=v=>{if(v)sessionStorage.setItem(KEY,v);else sessionStorage.removeItem(KEY)};
const encode=bytes=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
function notice(text){message=text;render();let el=document.getElementById('pinterestNotice');if(!el){el=document.createElement('div');el.id='pinterestNotice';el.setAttribute('role','status');el.style.cssText='position:fixed;right:18px;bottom:18px;max-width:360px;padding:16px;background:#fff5eb;color:#302b28;border:1px solid #ccc;border-radius:12px;z-index:15000';document.body.append(el)}el.textContent=text;clearTimeout(notice.timer);notice.timer=setTimeout(()=>el.remove(),10000)}
async function api(path,body){
 const res=await fetch(API+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session()},...(body?{body:JSON.stringify(body)}:{})});
 const data=await res.json().catch(()=>({}));
 if(!res.ok){if(res.status===401){save('');connected=false;profile={};boards=[];pins=[];boardId='';boardsNext='';pinsNext=''}throw new Error(data.error||'Pinterest is not ready yet. Please try again after setup.')}
 return data;
}
async function run(fn){
 if(busy)return;busy=true;message='Loading Pinterest…';render();
 try{await fn();message=''}catch(e){notice(e.message)}
 finally{busy=false;render()}
}
async function connect(){await run(async()=>{
 await api('health');
 const verifier=encode(crypto.getRandomValues(new Uint8Array(32)));
 sessionStorage.setItem('pinterestVerifier',verifier);
 const challenge=encode(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier))));
 location.assign(API+'start?challenge='+encodeURIComponent(challenge));
})}
async function loadBoards(more=false){
 const data=await api('boards'+(more&&boardsNext?'?bookmark='+encodeURIComponent(boardsNext):''));
 boards=more?[...boards,...(data.items||[])]:data.items||[];boardsNext=data.bookmark||'';
}
async function restore(){if(!session())return;await run(async()=>{profile=await api('profile');connected=true;await loadBoards()})}
async function choose(id,more=false){if(!/^\d+$/.test(id))return;await run(async()=>{
 if(!more){boardId=id;pins=[];pinsNext=''}
 const data=await api('boards/'+id+'/pins'+(more&&pinsNext?'?bookmark='+encodeURIComponent(pinsNext):''));
 pins=more?[...pins,...(data.items||[])]:data.items||[];pinsNext=data.bookmark||'';
})}
async function disconnect(){await run(async()=>{await api('disconnect',{});save('');connected=false;profile={};boards=[];pins=[];boardId='';boardsNext='';pinsNext=''})}
function image(pin){
 const images=pin.media?.images||pin.media?.items?.[0]?.images||{};
 const candidate=images['600x']?.url||images['400x300']?.url||Object.values(images).find(x=>x?.url)?.url||pin.media?.cover_image_url;
 try{const u=new URL(candidate);return u.protocol==='https:'&& (u.hostname==='i.pinimg.com'||u.hostname.endsWith('.pinimg.com'))?u.href:''}catch{return ''}
}
function render(){
 document.querySelectorAll('[data-orbit-app="pinterest"]').forEach(el=>{el.classList.toggle('orbit-connected',connected);el.setAttribute('aria-label',connected?'Open Pinterest boards':'Connect Pinterest')});
 document.querySelectorAll('[data-orbit-path="pinterest"]').forEach(input=>{
 const actions=input.closest('.module-orbit-row')?.querySelector('.module-actions');if(!actions)return;
 let b=actions.querySelector('[data-pn-open]');if(!b){b=document.createElement('button');b.type='button';b.className='module-action';b.dataset.pnOpen='';actions.prepend(b)}b.textContent=connected?'View Pinterest boards':'Connect Pinterest';b.disabled=busy;
 });
 const body=document.getElementById('moduleWorkspaceBody');
 if(!body||document.getElementById('moduleRouteName')?.textContent!=='Boards')return;
 let panel=document.getElementById('pinterestBoards');
 if(!panel){panel=document.createElement('section');panel.id='pinterestBoards';panel.className='module-card';panel.style.marginTop='20px';const heading=body.querySelector('.module-heading');if(heading)heading.after(panel);else body.prepend(panel)}
 panel.setAttribute('aria-busy',String(busy));
 const disabled=busy?' disabled':'';
 panel.innerHTML='<h2>Pinterest boards</h2><p>'+(connected?'Connected as '+esc(profile.username||profile.business_name||'your Pinterest account'):'Connect Pinterest to browse your public boards and Pins here.')+'</p><div class="module-actions">'+
 (connected?'<button type="button" class="module-action" data-pn-refresh'+disabled+'>Refresh boards</button><button type="button" class="module-action" data-pn-disconnect'+disabled+'>Disconnect</button>':'<button type="button" class="module-action" data-pn-connect'+disabled+'>Connect Pinterest</button>')+
 '</div><p role="status">'+esc(message)+'</p>'+
 (connected?'<label for="pinterestBoardPicker">Choose a board</label><select id="pinterestBoardPicker" class="module-input"'+disabled+'><option value="">Select a public board</option>'+boards.map(b=>'<option value="'+esc(b.id)+'"'+(b.id===boardId?' selected':'')+'>'+esc(b.name)+'</option>').join('')+'</select>'+
 (boardsNext?'<button type="button" class="module-action" data-pn-more-boards'+disabled+'>Load more boards</button>':'')+
 (!boards.length&&!busy?'<p>No public boards were returned for this account.</p>':'')+
 '<div class="pinterest-pin-grid">'+pins.filter(p=>/^\d+$/.test(p.id)).map(p=>{const src=image(p);return '<a class="pinterest-pin" href="https://www.pinterest.com/pin/'+p.id+'/" target="_blank" rel="noopener noreferrer">'+(src?'<img loading="lazy" src="'+esc(src)+'" alt="'+esc(p.alt_text||p.title||'Pinterest Pin')+'">':'')+'<span>'+esc(p.title||p.description||'View Pin')+'</span><small>View on Pinterest ↗</small></a>'}).join('')+'</div>'+
 (boardId&&!pins.length&&!busy?'<p>No Pins were returned for this board.</p>':'')+
 (pinsNext?'<button type="button" class="module-action" data-pn-more-pins'+disabled+'>Load more Pins</button>':''):'');
}
document.addEventListener('change',e=>{if(e.target.id==='pinterestBoardPicker'){if(!e.target.value){boardId='';pins=[];pinsNext='';render()}else choose(e.target.value)}});
document.addEventListener('click',e=>{
 if(!(e.target instanceof Element))return;
 const b=e.target.closest('[data-pn-connect],[data-pn-open],[data-orbit-app="pinterest"],[data-pn-disconnect],[data-pn-refresh],[data-pn-more-boards],[data-pn-more-pins]');
 if(!b)return;e.preventDefault();e.stopImmediatePropagation();
 if(b.hasAttribute('data-pn-disconnect'))disconnect();
 else if(b.hasAttribute('data-pn-refresh'))run(async()=>{boardId='';pins=[];pinsNext='';await loadBoards()});
 else if(b.hasAttribute('data-pn-more-boards'))run(()=>loadBoards(true));
 else if(b.hasAttribute('data-pn-more-pins'))choose(boardId,true);
 else if(connected){window.openBIGLWAModule?.('boards');render()}
 else connect();
},true);
document.addEventListener('biglwa:module-open',render);
async function init(){
 const style=document.createElement('style');style.textContent='#pinterestBoards{font-size:16px}#pinterestBoards p,#pinterestBoards label{font-size:16px;line-height:1.5}#pinterestBoards button,#pinterestBoards select{font-size:14px;min-height:42px}#pinterestBoards button:disabled{opacity:.55;cursor:wait}.pinterest-pin-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,180px),1fr));gap:16px;margin:20px 0}.pinterest-pin{border:1px solid #d8cec5;border-radius:14px;overflow:hidden;display:flex;flex-direction:column;background:#fffaf3;color:#302b28;text-decoration:none}.pinterest-pin img{width:100%;height:230px;object-fit:cover}.pinterest-pin span,.pinterest-pin small{padding:10px 12px;overflow-wrap:anywhere}.pinterest-pin small{font-size:13px;margin-top:auto}.pinterest-pin:focus-visible{outline:3px solid #a53332}';document.head.append(style);
 const url=new URL(location.href),handoff=url.searchParams.get('pinterest_handoff'),error=url.searchParams.get('pinterest_error');
 if(handoff||error){url.searchParams.delete('pinterest_handoff');url.searchParams.delete('pinterest_error');history.replaceState(history.state,'',url.href)}
 if(error)notice(error);
 if(handoff){try{const result=await api('session',{handoff,verifier:sessionStorage.getItem('pinterestVerifier')||''});save(result.session);sessionStorage.removeItem('pinterestVerifier')}catch(e){notice(e.message);return}}
 render();await restore();
}
window.__biglwaPinterest={connect,restore,disconnect,render};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
}());