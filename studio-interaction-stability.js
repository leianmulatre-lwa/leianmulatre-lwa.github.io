/* Persistent Studio help and color editing. Pointer movement never closes a color draft. */
(()=>{
 'use strict';
 if(window.BigLWAStableInteractions)return;
 const q=s=>document.querySelector(s);
 let anchor=null,oldTitle='',hideTimer;
 const tip=document.createElement('div');tip.id='studioPersistentTooltip';tip.role='tooltip';tip.hidden=true;document.body.append(tip);
 function hide(){clearTimeout(hideTimer);if(anchor){if(oldTitle&&!anchor.title)anchor.title=oldTitle;anchor.removeAttribute('aria-describedby')}anchor=null;oldTitle='';tip.hidden=true}
 function show(el){clearTimeout(hideTimer);if(anchor===el)return;hide();anchor=el;oldTitle=el.title||el.dataset.studioHelp||'';if(!oldTitle)return;el.dataset.studioHelp=oldTitle;el.removeAttribute('title');el.setAttribute('aria-describedby',tip.id);tip.textContent=oldTitle;tip.hidden=false;const box=el.getBoundingClientRect();tip.style.left=Math.max(8,Math.min(box.right+8,innerWidth-240))+'px';tip.style.top=Math.max(8,Math.min(box.top,innerHeight-tip.offsetHeight-8))+'px'}
 function target(node){return node instanceof Element?node.closest('#studioApp [title],#studioApp [data-studio-help]'):null}
 document.addEventListener('pointerover',event=>{const el=target(event.target);if(el)show(el);if(tip.contains(event.target))clearTimeout(hideTimer)});
 document.addEventListener('pointerout',event=>{if(!anchor||(!anchor.contains(event.target)&&!tip.contains(event.target)))return;if(anchor.contains(event.relatedTarget)||tip.contains(event.relatedTarget))return;hideTimer=setTimeout(hide,220)});
 document.addEventListener('focusin',event=>{const el=target(event.target);if(el)show(el)});
 document.addEventListener('focusout',event=>{if(anchor?.contains(event.target)&&!anchor.contains(event.relatedTarget)&&!tip.contains(event.relatedTarget))hide()});
 window.addEventListener('scroll',hide,true);
 document.addEventListener('keydown',event=>{if(event.key==='Escape')hide()});
 let dialog=null,input=null,original='';
 function write(value){if(!/^#[\da-f]{6}$/i.test(value)||!input?.isConnected)return;input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));q('#studioColorSwatch').style.backgroundColor=value;q('#studioColorHex').value=value;['Red','Green','Blue'].forEach((name,i)=>{const n=parseInt(value.slice(1+i*2,3+i*2),16);q('#studioColor'+name).value=n;q('#studioColor'+name+'Value').textContent=n})}
 function close(cancel){if(cancel)write(original);else input?.dispatchEvent(new Event('change',{bubbles:true}));dialog.close();input?.focus();input=null}
 function openColor(el){hide();if(!dialog){dialog=document.createElement('dialog');dialog.id='studioColorDialog';dialog.setAttribute('aria-labelledby','studioColorTitle');dialog.innerHTML='<h2 id="studioColorTitle">Choose color</h2><div id="studioColorSwatch" aria-hidden="true"></div><label>Hex color<input id="studioColorHex" type="text" maxlength="7" required spellcheck="false" pattern="#[0-9a-fA-F]{6}"></label>'+['Red','Green','Blue'].map(name=>'<label>'+name+' <output id="studioColor'+name+'Value"></output><input id="studioColor'+name+'" aria-label="'+name+'" type="range" min="0" max="255"></label>').join('')+'<div class="studio-color-actions"><button type="button" id="studioColorCancel">Cancel</button><button type="button" id="studioColorDone">Done</button></div>';document.body.append(dialog);dialog.addEventListener('input',event=>{if(event.target.id==='studioColorHex'){write(event.target.value);return}const hex='#'+['Red','Green','Blue'].map(name=>Number(q('#studioColor'+name).value).toString(16).padStart(2,'0')).join('');write(hex)});q('#studioColorDone').onclick=()=>{const hex=q('#studioColorHex');if(!hex.checkValidity()){hex.reportValidity();return}close(false)};q('#studioColorCancel').onclick=()=>close(true);dialog.addEventListener('cancel',event=>{event.preventDefault();close(true)})}input=el;original=el.value;q('#studioColorTitle').textContent=el.getAttribute('aria-label')||'Choose color';write(original);if(!dialog.open)dialog.showModal()}
 document.addEventListener('click',event=>{const el=event.target.closest('#studioApp input[type="color"]');if(!el)return;event.preventDefault();event.stopPropagation();openColor(el)},true);
 document.addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key)&&event.target.matches('#studioApp input[type="color"]')){event.preventDefault();openColor(event.target)}},true);
 window.BigLWAStableInteractions={hideTooltip:hide};
})();
