/* Persistent Studio help and color editing. Pointer movement never closes a color draft. */
(()=>{
 'use strict';
 if(window.BigLWAStableInteractions)return;
 const q=s=>document.querySelector(s);
 const HINTS_PREFIX='biglwaStudioHideHintsV1:';
 const uid=()=>String(window.__biglwaIdentity?.uid||'guest');
 const hintsKey=()=>HINTS_PREFIX+uid();
 const readHidden=()=>{try{return localStorage.getItem(hintsKey())==='1'}catch{return false}};
 let hintsHidden=readHidden();
 let anchor=null,hideTimer;
 const tip=document.createElement('div');tip.id='studioPersistentTooltip';tip.role='tooltip';tip.hidden=true;document.body.append(tip);
 // A hint never accepts the pointer, and its browser-native title never
 // comes back after hiding (that was producing the stuck dark tooltip).
 function hide(){
  clearTimeout(hideTimer);
  anchor?.removeAttribute('aria-describedby');
  anchor=null;tip.hidden=true;
 }
 function stripTitles(scope){
  if(!scope)return;
  const nodes=[];
  if(scope.nodeType===1&&scope.matches?.('[title]'))nodes.push(scope);
  scope.querySelectorAll?.('[title]').forEach(el=>nodes.push(el));
  for(const el of nodes){
   if(!el.closest?.('#studioApp'))continue;
   if(el.title)el.dataset.studioHelp=el.title;
   el.removeAttribute('title');
  }
 }
 function show(el){
  if(hintsHidden)return;
  stripTitles(el);
  const text=(el?.dataset?.studioHelp||'').trim();
  if(!text){hide();return}
  if(anchor===el&&!tip.hidden)return;
  hide();anchor=el;
  el.setAttribute('aria-describedby',tip.id);
  tip.textContent=text.slice(0,180);
  tip.hidden=false;
  const bounds=el.getBoundingClientRect();
  tip.style.left=Math.max(8,Math.min(bounds.right+8,innerWidth-tip.offsetWidth-8))+'px';
  tip.style.top=Math.max(8,Math.min(bounds.top,innerHeight-tip.offsetHeight-8))+'px';
 }
 function target(node){return node instanceof Element?node.closest('#studioApp [title],#studioApp [data-studio-help]'):null}
 function applyHintsPreference(){
  hide();
  const app=q('#studioApp');if(app){
   app.dataset.hintsHidden=hintsHidden?'true':'false';
   stripTitles(app);
  }
  window.dispatchEvent(new CustomEvent('biglwa:hints-preference',{detail:{hidden:hintsHidden}}));
 }
 function setHintsHidden(value){
  hintsHidden=!!value;
  try{localStorage.setItem(hintsKey(),hintsHidden?'1':'0')}catch{}
  applyHintsPreference();
 }
 const titleObserver=new MutationObserver(records=>{
  for(const record of records){
   if(record.type==='attributes'&&record.attributeName==='title')stripTitles(record.target);
   else for(const node of record.addedNodes)stripTitles(node);
  }
 });
 titleObserver.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['title']});
 window.addEventListener('biglwa:identity-updated',()=>{hintsHidden=readHidden();applyHintsPreference()});
 window.addEventListener('storage',event=>{if(event.key===hintsKey()){hintsHidden=readHidden();applyHintsPreference()}});
 // Apply immediately so DOMContentLoaded cannot dismiss an actively-read hint.
 applyHintsPreference();
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{
  stripTitles(q('#studioApp')||document.body);
 },{once:true});
 document.addEventListener('pointerover',event=>{
  const el=target(event.target);
  if(el)show(el);
  else if(anchor&&!anchor.contains(event.target))hide();
 });
 document.addEventListener('pointerout',event=>{
  if(!anchor||!anchor.contains(event.target))return;
  if(event.relatedTarget&&anchor.contains(event.relatedTarget))return;
  // Brief tolerance for crossing nested controls; never sticky after leaving.
  hideTimer=setTimeout(hide,65);
 });
 document.addEventListener('pointerdown',hide,true);
 document.addEventListener('focusin',event=>{
  const el=target(event.target);
  if(el)show(el);else hide();
 });
 document.addEventListener('focusout',event=>{
  if(anchor?.contains(event.target)&&(!event.relatedTarget||!anchor.contains(event.relatedTarget)))hide();
 });
 document.addEventListener('visibilitychange',()=>{if(document.hidden)hide()});
 window.addEventListener('blur',hide);
 window.addEventListener('scroll',hide,true);
 document.addEventListener('keydown',event=>{if(event.key==='Escape')hide()});
 let dialog=null,input=null,original='';
 function write(value){if(!/^#[\da-f]{6}$/i.test(value)||!input?.isConnected)return;input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));q('#studioColorSwatch').style.backgroundColor=value;q('#studioColorHex').value=value;['Red','Green','Blue'].forEach((name,i)=>{const n=parseInt(value.slice(1+i*2,3+i*2),16);q('#studioColor'+name).value=n;q('#studioColor'+name+'Value').textContent=n})}
 function close(cancel){if(cancel)write(original);else input?.dispatchEvent(new Event('change',{bubbles:true}));dialog.close();input?.focus();input=null}
 function openColor(el){hide();if(!dialog){dialog=document.createElement('dialog');dialog.id='studioColorDialog';dialog.setAttribute('aria-labelledby','studioColorTitle');dialog.innerHTML='<h2 id="studioColorTitle">Choose color</h2><div id="studioColorSwatch" aria-hidden="true"></div><label>Hex color<input id="studioColorHex" type="text" maxlength="7" required spellcheck="false" pattern="#[0-9a-fA-F]{6}"></label>'+['Red','Green','Blue'].map(name=>'<label>'+name+' <output id="studioColor'+name+'Value"></output><input id="studioColor'+name+'" aria-label="'+name+'" type="range" min="0" max="255"></label>').join('')+'<div class="studio-color-actions"><button type="button" id="studioColorCancel">Cancel</button><button type="button" id="studioColorDone">Done</button></div>';document.body.append(dialog);dialog.addEventListener('input',event=>{if(event.target.id==='studioColorHex'){write(event.target.value);return}const hex='#'+['Red','Green','Blue'].map(name=>Number(q('#studioColor'+name).value).toString(16).padStart(2,'0')).join('');write(hex)});q('#studioColorDone').onclick=()=>{const hex=q('#studioColorHex');if(!hex.checkValidity()){hex.reportValidity();return}close(false)};q('#studioColorCancel').onclick=()=>close(true);dialog.addEventListener('cancel',event=>{event.preventDefault();close(true)})}input=el;original=el.value;q('#studioColorTitle').textContent=el.getAttribute('aria-label')||'Choose color';write(original);if(!dialog.open)dialog.showModal()}
 document.addEventListener('click',event=>{const el=event.target.closest('#studioApp input[type="color"]');if(!el)return;event.preventDefault();event.stopPropagation();openColor(el)},true);
 document.addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key)&&event.target.matches('#studioApp input[type="color"]')){event.preventDefault();openColor(event.target)}},true);
 window.BigLWAStableInteractions={hideTooltip:hide,setHintsHidden,areHintsHidden:()=>hintsHidden};
})();
