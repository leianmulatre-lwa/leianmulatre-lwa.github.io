/* BIG LWA Minecraft skin mannequin. No third-party script required.
   Uses the actual Minecraft skin atlas on six faces of each 3D body part.
   Minecraft skin atlas sizes: 64×64 (modern), 64×32 (classic), HD multiples.
   License: site-authored UI. Does not include any Mojang assets. */
(function(){
  'use strict';
  if(window.BigLWAMinecraftViewer)return;
  const STYLE_ID='biglwa-minecraft-mannequin-css';
  const css=`
.biglwa-mc-stage{position:relative;box-sizing:border-box;display:grid;place-items:center;
  width:100%;height:100%;min-height:125px;overflow:hidden;border-radius:10px;
  background:radial-gradient(ellipse at 50% 40%,rgba(255,255,255,.14),transparent 70%);
  user-select:none;-webkit-user-select:none;touch-action:pan-y;outline:none}
.biglwa-mc-stage:focus-visible{outline:2px solid #4b966c;outline-offset:-2px}
.biglwa-mc-stage .biglwa-mc-scene{position:relative;width:132px;height:138px;
  perspective:680px;perspective-origin:50% 40%;transform-style:preserve-3d}
.biglwa-mc-stage .biglwa-mc-turntable{position:absolute;width:0;height:0;left:50%;top:2px;
  transform-style:preserve-3d;transform:rotateX(-9deg) rotateY(-27deg);
  will-change:transform}
.biglwa-mc-stage .biglwa-mc-part{position:absolute;transform-style:preserve-3d}
.biglwa-mc-stage .biglwa-mc-face{position:absolute;display:block;box-sizing:border-box;
  background-color:#bf9472;background-repeat:no-repeat;image-rendering:pixelated;backface-visibility:hidden}
.biglwa-mc-stage .biglwa-mc-hat .biglwa-mc-face{background-color:transparent}
.biglwa-mc-stage .biglwa-mc-help{position:absolute;bottom:5px;right:8px;
  font:600 9px/1.2 system-ui;color:inherit;opacity:.62;pointer-events:none}
.biglwa-mc-stage.biglwa-mc-large{height:286px;min-height:230px;
  border:1px solid rgba(92,75,65,.17);background:radial-gradient(circle at center,#f9f5ed72,#8b7a6c16)}
.biglwa-mc-stage.biglwa-mc-large .biglwa-mc-scene{height:260px}
.biglwa-mc-stage.biglwa-mc-large .biglwa-mc-turntable{top:0}
.biglwa-mc-stage.biglwa-mc-large .biglwa-mc-help{bottom:10px}
@media(prefers-reduced-motion:reduce){.biglwa-mc-stage .biglwa-mc-turntable{will-change:auto}}
`;
  function style(){
    if(document.getElementById(STYLE_ID))return;
    const tag=document.createElement('style');tag.id=STYLE_ID;tag.textContent=css;document.head.append(tag);
  }
  const V=(u,v,w,h)=>[u,v,w,h];
  // Face atlas order: front, back, left, right, top, bottom.
  const maps={
    head:[V(8,8,8,8),V(24,8,8,8),V(16,8,8,8),V(0,8,8,8),V(8,0,8,8),V(16,0,8,8)],
    torso:[V(20,20,8,12),V(32,20,8,12),V(28,20,4,12),V(16,20,4,12),V(20,16,8,4),V(28,16,8,4)],
    rightArm:[V(44,20,4,12),V(52,20,4,12),V(48,20,4,12),V(40,20,4,12),V(44,16,4,4),V(48,16,4,4)],
    leftArm:[V(36,52,4,12),V(44,52,4,12),V(40,52,4,12),V(32,52,4,12),V(36,48,4,4),V(40,48,4,4)],
    rightLeg:[V(4,20,4,12),V(12,20,4,12),V(8,20,4,12),V(0,20,4,12),V(4,16,4,4),V(8,16,4,4)],
    leftLeg:[V(20,52,4,12),V(28,52,4,12),V(24,52,4,12),V(16,52,4,12),V(20,48,4,4),V(24,48,4,4)],
    hat:[V(40,8,8,8),V(56,8,8,8),V(48,8,8,8),V(32,8,8,8),V(40,0,8,8),V(48,0,8,8)]
  };
  function makeFace(name,width,height,depth,uv,unit,url,atlasWidth,atlasHeight){
    const face=document.createElement('span');
    face.className='biglwa-mc-face biglwa-mc-'+name;
    const isSide=name==='left'||name==='right';
    const isTop=name==='top'||name==='bottom';
    const fw=(isSide?depth:width)*unit;
    const fh=(isTop?depth:height)*unit;
    const xo=(width*unit-fw)/2,yo=(height*unit-fh)/2;
    face.style.width=fw+'px';face.style.height=fh+'px';
    face.style.left=xo+'px';face.style.top=yo+'px';
    const transforms={
      front:'translateZ('+(depth*unit/2)+'px)',
      back:'rotateY(180deg) translateZ('+(depth*unit/2)+'px)',
      left:'rotateY(-90deg) translateZ('+(width*unit/2)+'px)',
      right:'rotateY(90deg) translateZ('+(width*unit/2)+'px)',
      top:'rotateX(90deg) translateZ('+(height*unit/2)+'px)',
      bottom:'rotateX(-90deg) translateZ('+(height*unit/2)+'px)'
    };
    face.style.transform=transforms[name];
    const [x,y]=uv;face.style.backgroundImage='url("'+url.replace(/"/g,'%22')+'")';
    face.style.backgroundSize=(atlasWidth*unit)+'px '+(atlasHeight*unit)+'px';
    face.style.backgroundPosition=(-x*unit)+'px '+(-y*unit)+'px';
    return face;
  }
  function bodyPart(name,rect,map,unit,url,atlasW,atlasH){
    const [left,top,depth,width,height]=rect;
    const part=document.createElement('div');part.className='biglwa-mc-part biglwa-mc-'+name;
    part.style.width=width*unit+'px';part.style.height=height*unit+'px';
    part.style.left=(left*unit)+'px';part.style.top=(top*unit)+'px';
    const sides=['front','back','left','right','top','bottom'];
    sides.forEach((side,i)=>part.append(makeFace(side,width,height,depth,map[i],unit,url,atlasW,atlasH)));
    return part;
  }
  function mount(root,url,{large=false,slim=false,onError}={}){
    if(!root)throw Error('Minecraft preview target missing');
    style();root.replaceChildren();
    const holder=document.createElement('div');
    holder.className='biglwa-mc-stage'+(large?' biglwa-mc-large':'');
    holder.setAttribute('role','img');
    holder.setAttribute('aria-label','Rotatable Minecraft character wearing the selected skin');
    holder.tabIndex=0;
    const scene=document.createElement('div');scene.className='biglwa-mc-scene';
    const turntable=document.createElement('div');turntable.className='biglwa-mc-turntable';
    scene.append(turntable);holder.append(scene);
    const hint=document.createElement('span');hint.className='biglwa-mc-help';
    hint.textContent='drag to rotate';holder.append(hint);root.append(holder);
    let disposed=false,down=false,lastX=0,lastY=0,rotation=-27,tilt=-9;
    const unit=large?6:3.65;
    const img=new Image();
    img.decoding='async';
    const ready=new Promise((resolve,reject)=>{
      img.onload=()=>{
        if(disposed){resolve(false);return}
        if(img.naturalWidth%64!==0||!([64,32].includes(img.naturalHeight*64/img.naturalWidth))){
          const error=Error('Choose a valid 64×64 or 64×32 Minecraft skin PNG (HD skins also supported).');
          onError?.(error);reject(error);return;
        }
        const legacy=img.naturalHeight/img.naturalWidth===0.5;
        const atlasW=64,atlasH=legacy?32:64;
        const all=[
          ['head',[-4,0,8,8,8],maps.head],
          ['torso',[-4,8,4,8,12],maps.torso],
          ['rightArm',[-8,8,4,slim?3:4,12],maps.rightArm],
          ['leftArm',[4,8,4,slim?3:4,12],legacy?maps.rightArm:maps.leftArm],
          ['rightLeg',[-4,20,4,4,12],maps.rightLeg],
          ['leftLeg',[0,20,4,4,12],legacy?maps.rightLeg:maps.leftLeg]
        ];
        for(const [name,box,map] of all){
          turntable.append(bodyPart(name,box,map,unit,url,atlasW,atlasH));
        }
        if(!legacy){turntable.append(bodyPart('hat',[-4.35,-.35,8.7,8.7,8.7],maps.hat,unit,url,atlasW,atlasH));}
        // Place the top of the 32-pixel figure above the center of the scene.
        turntable.style.transformOrigin='0 '+(16*unit)+'px 0';
        turntable.style.transform='rotateX('+tilt+'deg) rotateY('+rotation+'deg)';
        resolve(true);
      };
      img.onerror=()=>{
        const e=Error('The skin texture could not be loaded. Check the image URL.');
        if(!disposed)onError?.(e);
        reject(e);
      };
    });
    // Keep layout stable for the fixed-height Studio card and wider editor.
    turntable.style.marginTop=(large?9:6)+'px';
    img.src=url;
    function redraw(){turntable.style.transform='rotateX('+tilt+'deg) rotateY('+rotation+'deg)'}
    function pointerDown(event){if(event.button!==0)return;down=true;lastX=event.clientX;lastY=event.clientY;holder.setPointerCapture?.(event.pointerId)}
    function pointerMove(event){if(!down)return;rotation+=(event.clientX-lastX)*.8;tilt=Math.max(-35,Math.min(35,tilt-(event.clientY-lastY)*.35));lastX=event.clientX;lastY=event.clientY;redraw()}
    function pointerUp(){down=false}
    function keyDown(event){if(event.key==='ArrowLeft'||event.key==='ArrowRight'){rotation+=event.key==='ArrowLeft'?-22:22;event.preventDefault();redraw();}else if(event.key==='ArrowUp'||event.key==='ArrowDown'){tilt=Math.max(-35,Math.min(35,tilt+(event.key==='ArrowUp'?8:-8)));event.preventDefault();redraw()}}
    holder.addEventListener('pointerdown',pointerDown);holder.addEventListener('pointermove',pointerMove);
    holder.addEventListener('pointerup',pointerUp);holder.addEventListener('pointercancel',pointerUp);
    holder.addEventListener('keydown',keyDown);
    return {element:holder,ready,rotate(delta){rotation+=delta;redraw()},dispose(){
      disposed=true;holder.removeEventListener('pointerdown',pointerDown);holder.removeEventListener('pointermove',pointerMove);
      holder.removeEventListener('pointerup',pointerUp);holder.removeEventListener('pointercancel',pointerUp);
      holder.removeEventListener('keydown',keyDown);img.onload=null;img.onerror=null;holder.remove();
    }};
  }
  // Visible preview before the user uploads anything. This is a generated
  // neutral character skin, not a copyrighted game texture.
  let previewAtlas='';
  function defaultSkin(){
    if(previewAtlas)return previewAtlas;
    const c=document.createElement('canvas');c.width=64;c.height=64;
    const ctx=c.getContext('2d');
    if(!ctx)return '';
    const fill=(color,x,y,w,h)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h)};
    fill('#b78e70',0,0,64,64);
    // Distinguish body, legs, arms and head using the same UV locations as
    // a real exported Minecraft 64x64 skin. Upload replaces every face.
    fill('#9b7457',0,0,32,16);
    fill('#b88d6b',0,8,32,8);
    fill('#5b4039',8,0,8,3);
    fill('#5b4039',8,8,8,2);
    fill('#332722',10,12,1,1);fill('#332722',13,12,1,1);
    fill('#5185a9',16,16,24,16);
    fill('#4c789e',16,32,24,16);
    fill('#5185a9',32,48,16,16);
    fill('#5185a9',40,16,16,16);
    fill('#384e72',0,16,16,16);
    fill('#384e72',16,48,16,16);
    // Opaque head overlay isn't needed for default preview.
    previewAtlas=c.toDataURL('image/png');
    return previewAtlas;
  }
  window.BigLWAMinecraftViewer={mount,defaultSkin};
})();