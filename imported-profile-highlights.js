/* Public highlights imported at the profile owner's request. Exact handle matching only. */
(()=>{'use strict';
 let data=null;
 const match=handle=>data&&((handle||'').toLowerCase()===data.handle||(location.pathname.replace(/\/$/,'')==='/leian'))?data:null;
 function open(group){
  document.querySelector('.imported-highlight-player')?.remove();
  const dialog=document.createElement('dialog');dialog.className='imported-highlight-player';
  if(!document.getElementById('highlight-phone-style')){
   const style=document.createElement('style');style.id='highlight-phone-style';style.textContent=`
   .imported-highlight-player{border:0!important;padding:0!important;background:transparent!important;color:#fff;width:max-content;max-width:calc(100vw - 12px);max-height:94dvh;overflow:visible}
   .imported-highlight-player::backdrop{background:#120d16b8;backdrop-filter:blur(5px)}
   .highlight-phone-layout{display:flex;align-items:center;justify-content:center;gap:12px}
   .highlight-phone{position:relative;height:min(78dvh,700px,calc((100vw - 112px)*19.5/9));aspect-ratio:9/19.5;background:#080808;border:5px solid #333;border-radius:38px;box-shadow:inset 0 0 0 2px #777,0 18px 65px #0009;overflow:hidden;padding:6px;box-sizing:border-box}
   .highlight-phone:after{content:'';position:absolute;bottom:8px;left:36%;width:28%;height:4px;border-radius:3px;background:#eee9;pointer-events:none}
   .highlight-phone-top{position:absolute;inset:13px 16px auto;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:8px;text-shadow:0 1px 4px #000}
   .highlight-phone-top strong{max-width:70%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:650 15px system-ui}
   .highlight-phone-close,.highlight-phone-arrow{display:grid!important;place-items:center!important;padding:0!important;border:1px solid #ffffff70!important;border-radius:50%!important;color:white!important;background:#17131dcc!important;cursor:pointer}
   .highlight-phone-close{width:28px;height:28px;font:22px system-ui!important}
   .highlight-phone-arrow{flex-shrink:0;width:36px;height:36px;font:30px/1 system-ui!important}
   .highlight-phone-arrow:disabled{opacity:.25;cursor:default}
   .highlight-phone-stage{width:100%;height:100%;display:grid;place-items:center;overflow:hidden;border-radius:28px;background:#080808}
   .highlight-phone-stage video,.highlight-phone-stage img{display:block;width:100%;height:100%;min-height:0;object-fit:contain}
   .highlight-phone-count{position:absolute;bottom:22px;left:50%;transform:translateX(-50%);padding:3px 9px;background:#0009;border-radius:12px;font:11px system-ui;pointer-events:none}
   .highlight-phone-stage video{padding:40px 0 38px;box-sizing:border-box}
   @media(max-width:480px){.highlight-phone-layout{gap:6px}.highlight-phone-arrow{width:30px;height:30px}.highlight-phone{height:min(78dvh,calc((100vw - 88px)*19.5/9))}}
   `;document.head.append(style);
  }
  const layout=document.createElement('div');layout.className='highlight-phone-layout';
  const phone=document.createElement('div');phone.className='highlight-phone';
  const top=document.createElement('div');top.className='highlight-phone-top';
  const title=document.createElement('strong');title.textContent=group.title;title.id='highlight-phone-title';dialog.setAttribute('aria-labelledby',title.id);
  const close=document.createElement('button');close.className='highlight-phone-close';close.textContent='×';close.setAttribute('aria-label','Close');close.onclick=()=>dialog.close();top.append(title,close);
  const stage=document.createElement('div');stage.className='highlight-phone-stage';
  const prev=document.createElement('button'),next=document.createElement('button'),count=document.createElement('span');prev.className=next.className='highlight-phone-arrow';count.className='highlight-phone-count';count.setAttribute('aria-live','polite');prev.textContent='‹';next.textContent='›';prev.setAttribute('aria-label','Previous');next.setAttribute('aria-label','Next');phone.append(top,stage,count);layout.append(prev,phone,next);
  let index=0;function draw(){stage.replaceChildren();const item=group.items[index];const media=document.createElement(item.kind==='video'?'video':'img');media.src=item.mediaUrl||item.thumbnail;media.referrerPolicy='no-referrer';if(item.kind==='video'){media.controls=true;media.playsInline=true;media.preload='metadata'}else media.alt=group.title+' '+(index+1);media.onerror=()=>{stage.replaceChildren();const msg=document.createElement('p');msg.textContent='This highlight is temporarily unavailable. Try the next one.';msg.style.padding='20px';msg.style.color='white';stage.append(msg)};stage.append(media);count.textContent=(index+1)+' / '+group.items.length;prev.disabled=index===0;next.disabled=index===group.items.length-1}
  prev.onclick=()=>{index--;draw()};next.onclick=()=>{index++;draw()};dialog.onclose=()=>dialog.remove();dialog.addEventListener('keydown',e=>{if(e.key==='ArrowRight'&&!next.disabled)next.click();if(e.key==='ArrowLeft'&&!prev.disabled)prev.click()});dialog.append(layout);document.body.append(dialog);draw();dialog.showModal();close.focus();
 }
 function bubble(group){const a=document.createElement('button');a.type='button';a.className='biglwa-story-bubble';a.dataset.source=group.platform||'instagram';a.dataset.importedHighlight='1';a.title='Open '+group.title;a.setAttribute('aria-label',a.title);const ring=document.createElement('span');ring.className='biglwa-story-ring';const inner=document.createElement('span');inner.className='biglwa-story-inner';const img=document.createElement('img');img.src=group.cover;img.alt='';img.style.cssText='width:100%;height:100%;border-radius:50%;object-fit:cover';inner.append(img);ring.append(inner);const name=document.createElement('span');name.className='biglwa-story-name';name.textContent=group.title;a.append(ring,name);a.onclick=()=>open(group);return a}
 window.BigLWAImportedHighlights={match,bubble};
 fetch('/assets/highlights/leianstanley.json?v=2',{credentials:'omit'}).then(r=>{if(!r.ok)throw Error('Unavailable');return r.json()}).then(value=>{if(value.handle!=='leianstanley'||!Array.isArray(value.highlights))return;data=value;window.dispatchEvent(new Event('biglwa:highlights-imported'))}).catch(()=>{});
})();
