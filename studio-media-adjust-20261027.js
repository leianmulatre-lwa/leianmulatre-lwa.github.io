/* BIG LWA shared drag-to-position editor for wallpapers and profile pictures.
   Coordinates stay normalized (percentages), so layouts remain responsive. */
(()=>{
'use strict';
if(window.BIGLWAMediaAdjust)return;
const css=String.raw`
#biglwaMediaAdjust{box-sizing:border-box;width:min(660px,calc(100vw - 22px));max-height:95dvh;overflow:auto;padding:17px 21px 19px;border:2px solid #784351;border-radius:15px;background:#fff8f1;color:#372b2f;box-shadow:inset 0 0 0 5px #fff8f1,inset 0 0 0 6px #d7aaaa,0 22px 70px #17081199}
#biglwaMediaAdjust::backdrop{background:#1f0d17a8;backdrop-filter:blur(4px)}
#biglwaMediaAdjust header{display:flex;align-items:center;gap:12px;border-bottom:1px dashed #c4a5a6;padding:1px 2px 11px;margin-bottom:12px}
#biglwaMediaAdjust .media-adjust-dots{display:flex;gap:5px;align-items:center}
#biglwaMediaAdjust .media-adjust-dots i{width:9px;height:9px;border-radius:50%;border:1px solid #8c6666;background:#e16772}
#biglwaMediaAdjust .media-adjust-dots i:nth-child(2){background:#e8bd61}
#biglwaMediaAdjust .media-adjust-dots i:nth-child(3){background:#70a580}
#biglwaMediaAdjust h2{font:400 23px/1.1 "CS Bergamot Stitched",Georgia,serif;margin:0}
#biglwaMediaAdjust .media-adjust-help{font:600 12px/1.4 system-ui;margin:3px 0 11px;color:#654958}
#biglwaMediaAdjust .media-adjust-stage{width:100%;height:clamp(200px,35vh,310px);overflow:hidden;position:relative;border:2px solid #775065;border-radius:10px;background:repeating-conic-gradient(#e2d2c7 0 25%,#f0e4dc 0 50%) 0 0/20px 20px;touch-action:none;cursor:grab;outline-offset:3px}
#biglwaMediaAdjust .media-adjust-stage.is-dragging{cursor:grabbing}
#biglwaMediaAdjust .media-adjust-stage.is-photo{margin:0 auto;width:min(245px,65vw);height:min(245px,65vw);border-radius:50%;box-shadow:0 0 0 5px #f6dfdd,0 4px 20px #432a3455}
#biglwaMediaAdjust .media-adjust-stage img,#biglwaMediaAdjust .media-adjust-stage video{position:absolute;inset:0;width:100%;height:100%;display:block;object-fit:cover;object-position:50% 50%;pointer-events:none;user-select:none}
#biglwaMediaAdjust .media-adjust-controls{display:flex;gap:10px;flex-wrap:wrap;align-items:end;margin-top:12px}
#biglwaMediaAdjust .media-adjust-controls label{display:grid;gap:5px;min-width:125px;font:700 11px/1.2 system-ui}
#biglwaMediaAdjust .media-adjust-controls select{font:600 12px system-ui;border:1px solid #c2a0a7;border-radius:8px;background:#fffdf9;color:#3f3135;padding:9px}
#biglwaMediaAdjust button{font:700 12px system-ui;border:1px solid #b99fa5;border-radius:8px;background:#fffaf5;color:#543e47;cursor:pointer;padding:10px 14px}
#biglwaMediaAdjust button:focus-visible,#biglwaMediaAdjust select:focus-visible,#biglwaMediaAdjust .media-adjust-stage:focus-visible{outline:2px solid #653f83;outline-offset:3px}
#biglwaMediaAdjust .media-adjust-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:15px;padding-top:13px;border-top:1px dashed #c4a5a6}
#biglwaMediaAdjust .media-adjust-actions .media-adjust-commit{background:#794559;color:#fff8f0;border-color:#794559}
#biglwaMediaAdjust .media-adjust-status{font:600 11px/1.4 system-ui;color:#9a4141}
@media(max-width:480px){#biglwaMediaAdjust{padding:13px}#biglwaMediaAdjust .media-adjust-stage{height:210px}}
`;
const style=document.createElement('style');style.id='biglwa-media-adjust-style';style.textContent=css;document.head.append(style);
const clamp=x=>Math.max(0,Math.min(100,Number(x)||0));
const parsePosition=value=>{
 const parts=String(value||'center').toLowerCase().trim().split(/\s+/);
 const keyword=(value,axis)=>value==='center'?50:value===(axis===0?'left':'top')?0:value===(axis===0?'right':'bottom')?100:/^\d+(?:\.\d+)?%$/.test(value||'')?clamp(parseFloat(value)):null;
 const x=keyword(parts[0],0),y=keyword(parts[1],1);
 if(x!==null&&y!==null)return {x,y};
 if(parts.length===1&&x!==null)return {x,y:50};
 if(parts.length===1){const vertical=keyword(parts[0],1);if(vertical!==null)return {x:50,y:vertical}}
 return {x:50,y:50};
};
const positionString=(x,y)=>clamp(x).toFixed(1)+'% '+clamp(y).toFixed(1)+'%';
let dialog=null,state=null,stage=null,media=null,status=null;
function setup(){
 if(dialog)return;
 dialog=document.createElement('dialog');dialog.id='biglwaMediaAdjust';
 dialog.innerHTML='<header><span class="media-adjust-dots" aria-hidden="true"><i></i><i></i><i></i></span><h2 id="mediaAdjustTitle">Adjust picture</h2></header><p class="media-adjust-help">Drag the image to frame it. Use the arrow keys for small adjustments.</p><div id="mediaAdjustStage" class="media-adjust-stage" role="slider" tabindex="0" aria-label="Drag image position" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50"></div><div class="media-adjust-controls"><label id="mediaAdjustFitLabel">Fit<select id="mediaAdjustFit"><option value="cover">Fill frame</option><option value="contain">Show whole image</option></select></label><button id="mediaAdjustCenter" type="button">Center</button><span class="media-adjust-status" id="mediaAdjustStatus" role="status"></span></div><footer class="media-adjust-actions"><button id="mediaAdjustCancel" type="button">Cancel</button><button id="mediaAdjustSave" class="media-adjust-commit" type="button">Save position</button></footer>';
 dialog.setAttribute('aria-labelledby','mediaAdjustTitle');
 document.body.append(dialog);
 stage=dialog.querySelector('#mediaAdjustStage');status=dialog.querySelector('#mediaAdjustStatus');
 const fit=dialog.querySelector('#mediaAdjustFit');
 const update=()=>{
  if(!state||!media)return;
  media.style.objectPosition=positionString(state.x,state.y);
  media.style.objectFit=state.fit;
  stage.setAttribute('aria-valuenow',String(Math.round(state.x)));
  stage.setAttribute('aria-valuetext','Horizontal '+Math.round(state.x)+'%, vertical '+Math.round(state.y)+'%');
 };
 fit.addEventListener('change',()=>{if(state){state.fit=fit.value;update()}});
 dialog.querySelector('#mediaAdjustCenter').addEventListener('click',()=>{if(state){state.x=50;state.y=50;update()}});
 let down=null;
 const stop=()=>{
  if(!down)return;down=null;stage.classList.remove('is-dragging');
  document.removeEventListener('pointermove',move);
  document.removeEventListener('pointerup',stop);
  document.removeEventListener('pointercancel',stop);
 };
 const move=e=>{
  if(!down||!state)return;
  if(down.id!=null&&e.pointerId!=null&&e.pointerId!==down.id)return;
  const width=stage.clientWidth,height=stage.clientHeight;
  const naturalW=media?.tagName==='VIDEO'?media.videoWidth:media?.naturalWidth;
  const naturalH=media?.tagName==='VIDEO'?media.videoHeight:media?.naturalHeight;
  let rangeX=-width,rangeY=-height;
  if(naturalW>0&&naturalH>0&&width>0&&height>0){
   const scale=state.fit==='contain'?Math.min(width/naturalW,height/naturalH):Math.max(width/naturalW,height/naturalH);
   rangeX=width-naturalW*scale;rangeY=height-naturalH*scale;
  }
  // 0 aligns the near edge; 100 aligns the far edge. The image moves exactly with the pointer.
  const dx=e.clientX-down.startX,dy=e.clientY-down.startY;
  state.x=clamp(down.x+(Math.abs(rangeX)>0.5?dx/rangeX*100:0));
  state.y=clamp(down.y+(Math.abs(rangeY)>0.5?dy/rangeY*100:0));
  update();e.preventDefault();
 };
 stage.addEventListener('pointerdown',e=>{
  if(!state||(e.button!==undefined&&e.button!==0))return;
  down={id:e.pointerId??null,startX:e.clientX,startY:e.clientY,x:state.x,y:state.y};
  stage.classList.add('is-dragging');stage.focus();
  document.addEventListener('pointermove',move);document.addEventListener('pointerup',stop);document.addEventListener('pointercancel',stop);
  e.preventDefault();
 });
 stage.addEventListener('keydown',e=>{
  if(!state)return;
  const step=e.shiftKey?10:2;
  if(e.key==='ArrowLeft')state.x=clamp(state.x-step);
  else if(e.key==='ArrowRight')state.x=clamp(state.x+step);
  else if(e.key==='ArrowUp')state.y=clamp(state.y-step);
  else if(e.key==='ArrowDown')state.y=clamp(state.y+step);
  else return;
  e.preventDefault();update();
 });
 const close=()=>{stop();if(dialog.open)dialog.close();state=null;media=null;status.textContent=''};
 dialog.querySelector('#mediaAdjustCancel').addEventListener('click',close);
 dialog.addEventListener('cancel',e=>{e.preventDefault();close()});
 dialog.querySelector('#mediaAdjustSave').addEventListener('click',async()=>{
  if(!state)return;
  const fn=state.onSave,data={x:state.x,y:state.y,fit:state.fit,position:positionString(state.x,state.y)};
  const button=dialog.querySelector('#mediaAdjustSave');
  button.disabled=true;status.textContent='Saving position…';
  try{await fn(data);close()}catch(error){status.textContent=error?.message||'Could not save position.'}
  finally{button.disabled=false}
 });
 dialog.addEventListener('close',()=>{stop();state=null;media=null});
}
function open({type='wallpaper',url='',video=false,position='center',fit='cover',onSave}={}){
 setup();
 if(!url||typeof onSave!=='function')return false;
 if(dialog.open)dialog.close();
 const xy=parsePosition(position);
 state={...xy,fit:fit==='contain'?'contain':'cover',onSave};
 stage.className='media-adjust-stage'+(type==='photo'?' is-photo':'');
 dialog.querySelector('#mediaAdjustTitle').textContent=type==='photo'?'Adjust profile picture':'Adjust wallpaper';
 dialog.querySelector('#mediaAdjustFitLabel').hidden=type==='photo';
 const fitField=dialog.querySelector('#mediaAdjustFit');fitField.value=state.fit;
 stage.replaceChildren();
 media=document.createElement(video?'video':'img');media.draggable=false;
 if(video){media.muted=true;media.loop=true;media.playsInline=true;media.autoplay=true;media.controls=false;media.src=url;media.addEventListener('loadedmetadata',()=>media.play().catch(()=>{}),{once:true})}
 else {media.alt='Image positioning preview';media.src=url}
 media.style.objectFit=state.fit;media.style.objectPosition=positionString(state.x,state.y);
 stage.append(media);
 stage.setAttribute('aria-valuenow',String(Math.round(state.x)));
 stage.setAttribute('aria-valuetext','Horizontal '+Math.round(state.x)+'%, vertical '+Math.round(state.y)+'%');
 status.textContent='';
 dialog.showModal();
 stage.focus();
 return true;
}
window.BIGLWAMediaAdjust={open,parsePosition,positionString};
})();
