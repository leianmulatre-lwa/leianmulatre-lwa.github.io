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
   const native=el.getAttribute('title');
   if(native)el.dataset.studioHelp=native;
   el.removeAttribute('title');
  }
 }
 function show(el){
  if(hintsHidden)return;
  stripTitles(el);
  const text=(el?.dataset?.studioHelp||'').trim();
  if(!text){hide();return}
  clearTimeout(hideTimer);
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
 let dialog=null,input=null,original='',hsv={h:0,s:0,v:1};
 const clamp=(x,min=0,max=1)=>Math.min(max,Math.max(min,Number(x)||0));
 function hexToHsv(hex){
  const [r,g,b]=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
  const hi=Math.max(r,g,b),lo=Math.min(r,g,b),delta=hi-lo;
  let h=0;
  if(delta){if(hi===r)h=60*((g-b)/delta%6);else if(hi===g)h=60*((b-r)/delta+2);else h=60*((r-g)/delta+4)}
  return {h:(h+360)%360,s:hi?delta/hi:0,v:hi};
 }
 function hsvToHex({h,s,v}){
  const c=clamp(v)*clamp(s),x=c*(1-Math.abs((h/60)%2-1)),m=clamp(v)-c;
  const rgb=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];
  return '#'+rgb.map(n=>Math.round((n+m)*255).toString(16).padStart(2,'0')).join('');
 }
 function syncPlane(){
  if(!dialog)return;
  q('#studioColorPlane').style.setProperty('--plane-hue',hsv.h.toFixed(1));
  const dot=q('#studioColorPointer');
  dot.style.left=(hsv.s*100)+'%';dot.style.top=((1-hsv.v)*100)+'%';
  const plane=q('#studioColorPlane');
  plane.setAttribute('aria-valuenow',String(Math.round(hsv.s*100)));
  plane.setAttribute('aria-valuetext','Saturation '+Math.round(hsv.s*100)+'%, brightness '+Math.round(hsv.v*100)+'%');
  q('#studioColorHue').value=Math.round(hsv.h);
  q('#studioColorHueValue').textContent=Math.round(hsv.h)+'°';
 }
 function write(value){
  if(!/^#[\da-f]{6}$/i.test(value)||!input?.isConnected)return;
  const hex=value.toLowerCase();
  input.value=hex;input.dispatchEvent(new Event('input',{bubbles:true}));
  q('#studioColorSwatch').style.backgroundColor=hex;q('#studioColorHex').value=hex;
  ['Red','Green','Blue'].forEach((name,i)=>{
   const n=parseInt(hex.slice(1+i*2,3+i*2),16);
   q('#studioColor'+name).value=n;q('#studioColor'+name+'Value').textContent=n;
  });
  const next=hexToHsv(hex);
  hsv={h:next.s?next.h:hsv.h,s:next.s,v:next.v};
  syncPlane();
 }
 function close(cancel){
  if(cancel)write(original);else input?.dispatchEvent(new Event('change',{bubbles:true}));
  dialog.close();input?.focus();input=null;
 }
 function dragSurface(el,update){
  let active=false,previous=null;
  const move=event=>{
   if(!active)return;
   if(previous!==null&&event.pointerId!==undefined&&event.pointerId!==previous)return;
   const rect=el.getBoundingClientRect();
   if(!rect.width||!rect.height)return;
   update(clamp((event.clientX-rect.left)/rect.width),clamp((event.clientY-rect.top)/rect.height));
   event.preventDefault();
  };
  const stop=()=>{
   if(!active)return;active=false;previous=null;
   document.removeEventListener('pointermove',move);
   document.removeEventListener('pointerup',stop);
   document.removeEventListener('pointercancel',stop);
  };
  el.addEventListener('pointerdown',event=>{
   if(event.button!==undefined&&event.button!==0)return;
   active=true;previous=event.pointerId??null;
   el.focus?.();
   document.addEventListener('pointermove',move);
   document.addEventListener('pointerup',stop);
   document.addEventListener('pointercancel',stop);
   move(event);
   event.stopPropagation();
  });
 }
 function dragRange(el){
  dragSurface(el,(x)=>{
   const min=Number(el.min)||0,max=Number(el.max)||100,step=Number(el.step)||1;
   const value=Math.max(min,Math.min(max,Math.round((min+(max-min)*x)/step)*step));
   if(Number(el.value)!==value){el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}))}
  });
 }
 function openColor(el){
  hide();
  if(!dialog){
   dialog=document.createElement('dialog');dialog.id='studioColorDialog';dialog.className='biglwa-stitched-dialog';
   dialog.setAttribute('aria-labelledby','studioColorTitle');
   dialog.innerHTML=String.raw`<header class="studio-color-heading"><span class="studio-color-dots" aria-hidden="true"><i></i><i></i><i></i></span><h2 id="studioColorTitle">Choose color</h2></header>
    <div id="studioColorSwatch" aria-hidden="true"></div>
    <div class="studio-color-visual">
     <div id="studioColorPlane" role="slider" tabindex="0" aria-label="Saturation and brightness" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span id="studioColorPointer" aria-hidden="true"></span></div>
     <label class="studio-color-hue-label" for="studioColorHue">Hue <output id="studioColorHueValue">0°</output><input id="studioColorHue" type="range" min="0" max="360" step="1" aria-label="Hue"></label>
    </div>
    <label class="studio-color-hex-label">Hex color<input id="studioColorHex" type="text" maxlength="7" required spellcheck="false" pattern="#[0-9a-fA-F]{6}"></label>
    <details class="studio-color-rgb"><summary>Fine-tune RGB</summary><div class="studio-color-rgb-fields">`+['Red','Green','Blue'].map(name=>'<label>'+name+' <output id="studioColor'+name+'Value"></output><input id="studioColor'+name+'" aria-label="'+name+'" type="range" min="0" max="255" step="1"></label>').join('')+String.raw`</div></details>
    <div class="studio-color-actions"><button type="button" id="studioColorCancel">Cancel</button><button type="button" id="studioColorDone">Done</button></div>`;
   document.body.append(dialog);
   dialog.addEventListener('input',event=>{
    const id=event.target.id;
    if(id==='studioColorHex'){write(event.target.value);return}
    if(id==='studioColorHue'){hsv.h=clamp(event.target.value/360)*360;write(hsvToHex(hsv));return}
    if(['studioColorRed','studioColorGreen','studioColorBlue'].includes(id)){
     const hex='#'+['Red','Green','Blue'].map(name=>Number(q('#studioColor'+name).value).toString(16).padStart(2,'0')).join('');
     write(hex);
    }
   });
   dragSurface(q('#studioColorPlane'),(x,y)=>{
    hsv.s=x;hsv.v=1-y;write(hsvToHex(hsv));
   });
   q('#studioColorPlane').addEventListener('keydown',event=>{
    const step=event.shiftKey?.1:.015;
    if(event.key==='ArrowLeft')hsv.s=clamp(hsv.s-step);
    else if(event.key==='ArrowRight')hsv.s=clamp(hsv.s+step);
    else if(event.key==='ArrowUp')hsv.v=clamp(hsv.v+step);
    else if(event.key==='ArrowDown')hsv.v=clamp(hsv.v-step);
    else return;
    event.preventDefault();write(hsvToHex(hsv));
   });
   ['Hue','Red','Green','Blue'].forEach(name=>dragRange(q('#studioColor'+name)));
   q('#studioColorDone').onclick=()=>{
    const hex=q('#studioColorHex');if(!hex.checkValidity()){hex.reportValidity();return}
    close(false);
   };
   q('#studioColorCancel').onclick=()=>close(true);
   dialog.addEventListener('cancel',event=>{event.preventDefault();close(true)});
  }
  input=el;original=el.value;
  q('#studioColorTitle').textContent=(el.getAttribute('aria-label')||'Choose color').replace(/color$/i,'color');
  hsv=hexToHsv(original);
  write(original);
  if(!dialog.open)dialog.showModal();
 }
 document.addEventListener('click',event=>{const el=event.target.closest('#studioApp input[type="color"]');if(!el)return;event.preventDefault();event.stopPropagation();openColor(el)},true);
 document.addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key)&&event.target.matches('#studioApp input[type="color"]')){event.preventDefault();openColor(event.target)}},true);
 window.BigLWAStableInteractions={hideTooltip:hide,setHintsHidden,areHintsHidden:()=>hintsHidden};
})();
