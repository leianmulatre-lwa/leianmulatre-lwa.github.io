/* BIG LWA Studio recovery: idempotently restore two-week calendar and politc card.
   This runs independently of module-pages initialization and tolerates late Studio mounting. */
(() => {
  if (window.__biglwaStudioRecoveryV1) return;
  window.__biglwaStudioRecoveryV1 = true;
  const iso = d => [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
  const calendar = () => {
    const now = new Date(),start = new Date(now.getFullYear(),now.getMonth(),now.getDate()-now.getDay());
    const days = Array.from({length:14},(_,i) => new Date(start.getFullYear(),start.getMonth(),start.getDate()+i));
    const month=days[0].toLocaleString(undefined,{month:'short'})+' – '+days[13].toLocaleString(undefined,{month:'short',year:'numeric'});
    return '<div class="calendar-mini biglwa-two-week-recovered" aria-label="Two week calendar preview">'+
      '<div class="calendar-mini-head"><span>'+month+'</span><span>2 weeks</span></div>'+
      '<div class="calendar-mini-weekdays">'+['S','M','T','W','T','F','S'].map(x=>'<span>'+x+'</span>').join('')+'</div>'+
      '<div class="calendar-mini-grid">'+days.map(d=>'<span class="'+(iso(d)===iso(now)?'today':'')+'" aria-label="'+d.toDateString()+'">'+d.getDate()+'</span>').join('')+'</div></div>';
  };
  const ensure = () => {
    const root=document.querySelector('#studioApp');
    const masonry=root?.querySelector('.masonry');
    if(!masonry)return false;
    const cal=root.querySelector('#calendar');
    if(cal&&!cal.querySelector('.biglwa-two-week-recovered')&&!cal.querySelector('.calendar-mini')){
      const legacy=Array.from(cal.children).filter(el=>!el.matches('.card-head,.widget-window-controls,.window-controls,.widget-drag-handle,.card-cta'));
      legacy.forEach(el=>el.remove());
      const preview=document.createElement('div');
      preview.innerHTML=calendar();
      const cta=cal.querySelector('.card-cta');
      if(cta)cta.before(preview.firstElementChild);else cal.appendChild(preview.firstElementChild);
    }
    if(!root.querySelector('#politc')){
      const card=document.createElement('article');
      card.id='politc';card.className='card studio-politc-card';
      card.dataset.widgetRoute='politc';
      card.dataset.search='politc politics election nominees voter resources political pendulum wcw mcm hunting season cunting season';
      card.innerHTML='<div class="card-head"><div><span class="card-icon" aria-hidden="true">⚖</span><h2>politc</h2></div><button class="arrow-btn" type="button" data-open="politc" aria-label="Open politc">→</button></div><p class="sub">Election countdown, candidates by location, political pendulum, wanted posters and global news sources.</p><button class="card-cta" type="button" data-open="politc">Open politc →</button>';
      const room=root.querySelector('#rooms');
      if(room?.parentElement===masonry)room.insertAdjacentElement('afterend',card);else masonry.appendChild(card);
    }
    return true;
  };
  const style=document.createElement('style');
  style.textContent='#studioApp #calendar .biglwa-two-week-recovered{display:grid;gap:6px;margin:10px 0;padding:12px;border:1px solid rgba(130,100,90,.22);border-radius:12px;background:rgba(255,255,255,.12)}#studioApp #calendar .calendar-mini-head{display:flex;justify-content:space-between;font:600 11px system-ui}#studioApp #calendar .calendar-mini-weekdays,#studioApp #calendar .calendar-mini-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:3px}#studioApp #calendar .calendar-mini-weekdays span{text-align:center;font:700 9px system-ui}#studioApp #calendar .calendar-mini-grid span{display:grid;place-items:center;min-height:25px;border-radius:5px;background:rgba(150,140,130,.08);font:12px system-ui}#studioApp #calendar .calendar-mini-grid span.today{outline:2px solid currentColor;font-weight:800}';
  document.head.appendChild(style);
  let attempts=0;
  const timer=setInterval(()=>{ensure();if(++attempts>=30)clearInterval(timer)},500);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensure,{once:true});else ensure();
  window.addEventListener('pageshow',ensure);
  document.addEventListener('biglwa:module-close',ensure);
})();
