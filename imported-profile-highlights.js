/* Public highlights imported at the profile owner's request. Exact handle matching only. */
(()=>{'use strict';
 let data=null;
 const match=handle=>data&&((handle||'').toLowerCase()===data.handle||(!window.__biglwaIdentity?.uid&&location.pathname.replace(/\/$/,'')==='/leian'))?data:null;
 function open(group){
  document.querySelector('.imported-highlight-player')?.remove();
  const dialog=document.createElement('dialog');dialog.className='imported-highlight-player';
  dialog.style.cssText='width:min(460px,90vw);max-height:90vh;padding:14px;border:1px solid #b9947d;border-radius:16px;background:#fff7ec;color:#402c31;box-shadow:0 20px 90px #0008';
  const top=document.createElement('div');top.style.cssText='display:flex;justify-content:space-between;align-items:center;gap:12px';
  const title=document.createElement('strong');title.textContent=group.title;
  const close=document.createElement('button');close.textContent='Close';close.onclick=()=>dialog.close();top.append(title,close);
  const stage=document.createElement('div');stage.style.cssText='height:min(60vh,580px);background:#181517;margin:12px 0;display:grid;place-items:center;border-radius:10px;overflow:hidden';
  const nav=document.createElement('div');nav.style.cssText='display:flex;justify-content:space-between;align-items:center';
  const prev=document.createElement('button'),next=document.createElement('button'),count=document.createElement('span');prev.textContent='Previous';next.textContent='Next';nav.append(prev,count,next);
  const source=document.createElement('a');source.href=data.source;source.target='_blank';source.rel='noopener noreferrer';source.textContent='Source: IGExport · @'+data.handle+' ↗';source.style.cssText='display:block;margin-top:12px;font:12px system-ui';
  const note=document.createElement('small');note.textContent='Imported '+new Date(data.checkedAt).toLocaleDateString()+'. Source media may expire; open the source for the latest highlights.';
  let index=0;function draw(){stage.replaceChildren();const item=group.items[index];const media=document.createElement(item.kind==='video'?'video':'img');media.src=item.mediaUrl||item.thumbnail;media.style.cssText='width:100%;height:100%;object-fit:contain';media.referrerPolicy='no-referrer';if(item.kind==='video'){media.controls=true;media.playsInline=true;media.preload='metadata'}else media.alt=group.title+' '+(index+1);media.onerror=()=>{stage.replaceChildren();const msg=document.createElement('p');msg.textContent='This source media is unavailable. Open IGExport below to reload the original.';msg.style.padding='20px';msg.style.color='white';stage.append(msg)};stage.append(media);count.textContent=(index+1)+' / '+group.items.length;prev.disabled=index===0;next.disabled=index===group.items.length-1}
  prev.onclick=()=>{index--;draw()};next.onclick=()=>{index++;draw()};dialog.onclose=()=>dialog.remove();dialog.addEventListener('keydown',e=>{if(e.key==='ArrowRight'&&!next.disabled)next.click();if(e.key==='ArrowLeft'&&!prev.disabled)prev.click()});dialog.append(top,stage,nav,source,note);document.body.append(dialog);draw();dialog.showModal();close.focus();
 }
 function bubble(group){const a=document.createElement('a');a.className='biglwa-story-bubble';a.dataset.source='instagram';a.dataset.importedHighlight='1';a.href=data.source;a.target='_blank';a.rel='noopener noreferrer';a.setAttribute('aria-label','Open highlight '+group.title+' · '+group.items.length+' items');const ring=document.createElement('span');ring.className='biglwa-story-ring';const inner=document.createElement('span');inner.className='biglwa-story-inner';const img=document.createElement('img');img.src=group.cover;img.alt='';img.style.cssText='width:100%;height:100%;border-radius:50%;object-fit:cover';inner.append(img);ring.append(inner);const name=document.createElement('span');name.className='biglwa-story-name';name.textContent=group.title;a.append(ring,name);a.onclick=e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();open(group)};return a}
 window.BigLWAImportedHighlights={match,bubble};
 fetch('/assets/highlights/leianstanley.json?v=1',{credentials:'omit'}).then(r=>{if(!r.ok)throw Error('Unavailable');return r.json()}).then(value=>{if(value.handle!=='leianstanley'||!Array.isArray(value.highlights))return;data=value;window.dispatchEvent(new Event('biglwa:highlights-imported'))}).catch(()=>{});
})();
