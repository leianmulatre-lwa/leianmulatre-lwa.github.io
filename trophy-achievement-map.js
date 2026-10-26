/* BIG LWA achievement atlas: original UI inspired by classic game achievement maps. */
(()=>{'use strict';
 const ranks=['Chopped','007','Kiki surfing','Statement','Legend','Icon'];
 const icons=['✦','⌘','≈','⚑','★','♛'];
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const normalize=s=>String(s||'').trim().toLowerCase();
 function mount(host,trophies=[]){
  if(!host)return;
  const label=document.querySelector('.profile-copy .real-rank strong')?.textContent||'';
  const current=ranks.findIndex(r=>normalize(r)===normalize(label));
  const nodes=ranks.map((name,i)=>({id:'rank-'+i,name,icon:icons[i],x:[95,405,715,715,405,95][i],y:i<3?75:260,
   unlocked:current>=i,current:current===i,detail:current===i?'Your current BIG LWA rank.':current>i?'Reached on your rank journey.':'Not yet reached. Rank follows your account’s recorded standing.',kind:'Real Rank'}));
  const saved=Array.isArray(trophies)?trophies:[];
  saved.forEach((t,i)=>nodes.push({id:'trophy-'+i,name:t.title||'Trophy',icon:'◆',x:95+i%3*310,y:450+Math.floor(i/3)*150,
   unlocked:true,detail:[t.organization,t.date,t.result].filter(Boolean).join(' · ')||'A milestone you saved to your trophy case.',kind:'Saved trophy · self-reported',url:t.url}));
  // Single connected rank path: Chopped has exactly ONE neighbor (007);
  // saved personal trophies are independent, never extra rank connections.
  const lines=nodes.slice(1,6).map((n,i)=>{const p=nodes[i];
    return `<path data-rank-edge="${i}-${i+1}" d="M${p.x+29},${p.y+29} L${n.x+29},${n.y+29}" class="${n.unlocked?'earned':''}"/>`;
  }).join('');
  host.innerHTML=`<section class="trophy-atlas"><header class="trophy-atlas-header"><div><h2>Real Rank</h2><p>Real Rank · ${esc(current<0?'Awaiting account rank':ranks[current])} · ${saved.length} saved ${saved.length===1?'trophy':'trophies'}</p></div><div class="trophy-map-controls"><button type="button" data-map-zoom="out" aria-label="Zoom out achievement map">−</button><output aria-label="Map zoom">100%</output><button type="button" data-map-zoom="in" aria-label="Zoom in achievement map">+</button><button type="button" data-map-reset>Center map</button></div></header><p class="trophy-map-hint">Drag to explore · arrow keys to pan · select a tile for details</p><div class="trophy-map-viewport" tabindex="0" role="region" aria-label="Achievement map. Drag or use arrow keys to pan."><div class="trophy-map-world" style="height:${Math.max(610,590+Math.ceil(saved.length/3)*170)}px"><svg class="trophy-map-paths" width="1100" height="440" aria-hidden="true">${lines}</svg>${nodes.map(n=>`<button type="button" class="trophy-node ${n.unlocked?'earned':'locked'} ${n.current?'current':''}" data-achievement="${n.id}" style="left:${n.x}px;top:${n.y}px" aria-label="${esc(n.name+' · '+(n.unlocked?'unlocked':'locked'))}" aria-pressed="false"><span class="trophy-node-icon" aria-hidden="true">${n.icon}</span><span class="trophy-node-label">${esc(n.name)}</span><span class="trophy-node-state">${n.current?'Current rank':n.unlocked?'Unlocked':'Locked'}</span></button>`).join('')}${saved.length?'':'<p class="trophy-map-empty">Your saved trophies will appear here.<br>Add your first milestone below.</p>'}</div></div><aside class="trophy-map-detail" aria-live="polite"><strong>Select an achievement</strong><p>Follow the connected rank path or inspect a saved trophy. Locked ranks are shown without awarding progress.</p></aside></section>`;
  const viewport=host.querySelector('.trophy-map-viewport'),world=host.querySelector('.trophy-map-world'),detail=host.querySelector('.trophy-map-detail');
  let scale=Math.min(1,Math.max(.55,viewport.clientWidth/1050)),x=0,y=0,drag=null,moved=false;
  const paint=()=>{x=Math.min(40,Math.max(viewport.clientWidth-1100*scale-40,x));y=Math.min(40,Math.max(viewport.clientHeight-world.offsetHeight*scale-40,y));world.style.transform=`translate(${x}px,${y}px) scale(${scale})`;host.querySelector('output').value=Math.round(scale*100)+'%'};
  const select=id=>{const node=nodes.find(n=>n.id===id);if(!node)return;host.querySelectorAll('[data-achievement]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.achievement===id)));detail.innerHTML=`<span class="trophy-detail-kind">${esc(node.kind)}</span><strong>${esc(node.name)} · ${node.unlocked?'Unlocked':'Locked'}</strong><p>${esc(node.detail)}</p>`;if(node.url){try{const u=new URL(node.url);if(['https:','http:'].includes(u.protocol)){const a=document.createElement('a');a.href=u.href;a.target='_blank';a.rel='noopener noreferrer';a.textContent='Open saved proof ↗';detail.append(a)}}catch{}}};
  host.onclick=event=>{const zoom=event.target.closest('[data-map-zoom]');if(zoom){scale=Math.max(.45,Math.min(1.6,scale+(zoom.dataset.mapZoom==='in'?.15:-.15)));paint();return}if(event.target.closest('[data-map-reset]')){scale=Math.min(1,Math.max(.55,viewport.clientWidth/1050));x=y=0;paint();return}const tile=event.target.closest('[data-achievement]');if(tile&&!moved)select(tile.dataset.achievement)};
  viewport.addEventListener('pointerdown',e=>{if(e.button!==0)return;moved=false;drag={id:e.pointerId,sx:e.clientX,sy:e.clientY,x,y};});
  viewport.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;if(Math.hypot(e.clientX-drag.sx,e.clientY-drag.sy)>5){moved=true;viewport.setPointerCapture(e.pointerId);x=drag.x+e.clientX-drag.sx;y=drag.y+e.clientY-drag.sy;paint()}});
  const end=()=>{drag=null;setTimeout(()=>{moved=false},0)};viewport.addEventListener('pointerup',end);viewport.addEventListener('pointercancel',end);
  viewport.addEventListener('keydown',e=>{const delta={ArrowLeft:[60,0],ArrowRight:[-60,0],ArrowUp:[0,60],ArrowDown:[0,-60]}[e.key];if(!delta)return;e.preventDefault();e.stopPropagation();x+=delta[0];y+=delta[1];paint()});
  viewport.addEventListener('focusin',e=>{const n=nodes.find(n=>n.id===e.target.dataset?.achievement);if(n){x=viewport.clientWidth/2-(n.x+29)*scale;y=viewport.clientHeight/2-(n.y+29)*scale;paint()}});
  paint();if(current>=0)select('rank-'+current);
 }
 window.BigLWATrophyMap={mount};
})();
