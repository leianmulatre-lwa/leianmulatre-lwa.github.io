/* BIG LWA Lwazi Tool Drop — local image adjustments, no upload. */
const PARAMS=[
 ['lightness','Lightness',-100,100],['brightness','Brightness',-100,100],
 ['contrast','Contrast',-100,100],['saturation','Saturation',-100,100],
 ['hue','Hue',-180,180],['vibrance','Vibrance',-100,100],
 ['exposure','Exposure',-100,100],['brilliance','Brilliance',-100,100],
 ['highlights','Highlights',-100,100],['shadows','Shadows',-100,100],
 ['warmth','Warmth',-100,100],['skin','Skin-color warmth¹',-100,100],
 ['blackpoint','Black point',0,100],['grain','Grain',0,100],
 ['sharpness','Sharpness',0,100],['vignette','Vignette',0,100]
];
const clamp=n=>Math.min(255,Math.max(0,n));
const val=n=>Number.isFinite(Number(n))?Number(n):0;
function styles(){
 if(document.getElementById('lwaLocalPhotoStyle'))return;
 const style=document.createElement('style');style.id='lwaLocalPhotoStyle';
 style.textContent=[
 '#studioApp .lwa-photo-editor{margin:15px 0;padding:13px;border:1px solid #bd998e;border-radius:12px;background:#faf2e9;display:grid;gap:12px;color:#2d2426}',
 '#studioApp .lwa-photo-editor h3{font:400 23px Georgia,serif;margin:0}',
 '#studioApp .lwa-photo-geometry,#studioApp .lwa-photo-export{display:flex;align-items:center;gap:8px;flex-wrap:wrap}',
 '#studioApp .lwa-photo-geometry button,#studioApp .lwa-photo-geometry select,#studioApp .lwa-photo-export button,#studioApp .lwa-photo-export select{border:1px solid #916773;border-radius:7px;background:#fff9f2;color:#422935;padding:7px 10px;min-height:34px;font:700 12px system-ui;cursor:pointer}',
 '#studioApp .lwa-photo-stage{display:grid;place-items:center;min-height:170px;background:repeating-conic-gradient(#ede1da 0 25%,#fcf7f2 0 50%) 0 0/16px 16px;border:1px solid #b89c92;border-radius:8px;overflow:hidden}',
 '#studioApp .lwa-photo-stage canvas{max-width:100%;max-height:440px;width:auto;height:auto;box-shadow:0 5px 15px #26161d2d}',
 '#studioApp .lwa-photo-sliders{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:9px}',
 '#studioApp .lwa-photo-sliders label{display:grid;grid-template-columns:1fr auto;gap:3px;font:650 11px system-ui;color:#4c3740}',
 '#studioApp .lwa-photo-sliders input{grid-column:1/-1;width:100%;accent-color:#a64f67}',
 '#studioApp .lwa-photo-note,#studioApp .lwa-photo-status{font:500 11px/1.5 system-ui;color:#6a5157;margin:0}',
 '#studioApp .lwa-photo-export [data-photo-export]{background:#893d52;color:#fff9ef}'
 ].join('\n');
 document.head.append(style);
}
function processPixels(canvas,values){
 const ctx=canvas.getContext('2d',{willReadFrequently:true});
 const w=canvas.width,h=canvas.height,frame=ctx.getImageData(0,0,w,h),pixels=frame.data;
 const V=id=>val(values[id])/100;
 const exposure=Math.pow(2,V('exposure')*1.6),light=V('lightness')*33,contrast=1+V('contrast')*.75;
 const bloom=V('brilliance'),high=V('highlights'),shadow=V('shadows'),warm=V('warmth'),skin=V('skin');
 const black=V('blackpoint'),grain=V('grain'),vignette=V('vignette'),sat=V('saturation'),vib=V('vibrance');
 const cx=w/2,cy=h/2,inv=1/Math.max(1,Math.hypot(cx,cy));
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const p=(y*w+x)*4;if(pixels[p+3]===0)continue;
  let r=pixels[p],g=pixels[p+1],b=pixels[p+2],l=(.2126*r+.7152*g+.0722*b)/255;
  const extra=(bloom*(1-Math.abs(l-.5)*2)*33)+(high*l*l*48)+(shadow*(1-l)*(1-l)*48)+light;
  r=(r*exposure-127)*contrast+127+extra;g=(g*exposure-127)*contrast+127+extra;b=(b*exposure-127)*contrast+127+extra;
  l=(.2126*r+.7152*g+.0722*b)/255;
  const pigment=Math.max(r,g,b)-Math.min(r,g,b);
  const s=1+sat*.85+vib*.85*(1-Math.min(1,pigment/140));
  r=l*255+(r-l*255)*s;g=l*255+(g-l*255)*s;b=l*255+(b-l*255)*s;
  r+=warm*23;b-=warm*23;g+=warm*5;
  // Broad warm-color heuristic, not detection or classification of human skin.
  const mask=(r>g*.92&&g>b*.72&&r>b&&Math.abs(r-g)<115)?1:0;
  r+=skin*17*mask;b-=skin*14*mask;
  const edge= vignette*65*Math.max(0,(Math.hypot(x-cx,y-cy)*inv-.25)/.75)**1.8;
  const dark=black*38*(1-Math.min(1,l*1.5));
  const noise=grain*(((x*71+y*233+(x*y)%997)%127)/63.5-1)*15;
  pixels[p]=clamp(r-edge-dark+noise);pixels[p+1]=clamp(g-edge-dark+noise);pixels[p+2]=clamp(b-edge-dark+noise);
 }
 if(values.sharpness>0){
  const input=new Uint8ClampedArray(pixels),amount=V('sharpness')*.7;
  for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
   const p=(y*w+x)*4;if(input[p+3]===0)continue;
   for(let c=0;c<3;c++){
    const around=(input[p-4+c]+input[p+4+c]+input[p-4*w+c]+input[p+4*w+c])/4;
    pixels[p+c]=clamp(input[p+c]+(input[p+c]-around)*amount);
   }
  }
 }
 ctx.putImageData(frame,0,0);
}
export function mountImageAdjuster(host,file,options={}){
 if(!host||!file)return null;
 if(!/^image\/(png|jpeg|webp|avif)$/i.test(file.type)||file.size>45*1024*1024){
  host.textContent='Local adjustments support PNG, JPEG, WebP and AVIF up to 45 MB.';return null;
 }
 styles();host.className='lwa-photo-editor';host.setAttribute('aria-label','Local photo adjustments');
 host.innerHTML='<h3>adjust & crop</h3>'+
 '<div class="lwa-photo-geometry"><label>Ratio <select data-photo-ratio><option value="original">Original</option><option value="1">1:1</option><option value=".8">4:5</option><option value=".75">3:4</option><option value=".5625">9:16</option><option value="1.777778">16:9</option></select></label>'+
 '<button type="button" data-photo-ccw>↶ Rotate</button><button type="button" data-photo-cw>Rotate ↷</button><button type="button" data-photo-flip>⇋ Flip</button><button type="button" data-photo-reset>Reset</button></div>'+
 '<div class="lwa-photo-stage"><canvas aria-label="Local adjusted photo preview"></canvas></div>'+
 '<div class="lwa-photo-sliders"></div>'+
 '<p class="lwa-photo-note">¹ Warm-color adjustment does not detect skin or people. Automatic rotoscoping requires a separate segmentation model and is not active. Nothing is uploaded.</p>'+
 '<div class="lwa-photo-export"><label>Export as <select data-photo-format><option value="image/png">PNG</option><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option></select></label><button type="button" data-photo-export>Export edited image</button></div>'+
 '<p class="lwa-photo-status" role="status">Loading photo…</p>';
 const grid=host.querySelector('.lwa-photo-sliders'),preview=host.querySelector('canvas'),status=host.querySelector('.lwa-photo-status');
 const values=Object.fromEntries(PARAMS.map(([k])=>[k,0]));
 const defs=[['zoom','Crop zoom',0,100],['panX','Move left/right',-100,100],['panY','Move up/down',-100,100],...PARAMS];
 for(const [key,labelName,min,max] of defs){
  values[key]=0;
  const label=document.createElement('label'),output=document.createElement('output'),input=document.createElement('input');
  label.textContent=labelName;output.textContent='0';
  input.type='range';input.min=String(min);input.max=String(max);input.value='0';input.step='1';input.dataset.photoValue=key;
  label.append(output,input);grid.append(label);
 }
 let photo=null,rotation=0,flip=false,disposed=false,frame=0,url=URL.createObjectURL(file);
 const render=(canvas,maxSide)=>{
  const w=photo.naturalWidth,h=photo.naturalHeight,swap=rotation%180!==0;
  const rw=swap?h:w,rh=swap?w:h;
  const selected=host.querySelector('[data-photo-ratio]').value;
  const ratio=selected==='original'?rw/rh:Number(selected);
  const cw=Math.min(rw,rh*ratio),ch=cw/ratio;
  const factor=Math.min(1,maxSide/Math.max(cw,ch));
  canvas.width=Math.max(1,Math.round(cw*factor));canvas.height=Math.max(1,Math.round(ch*factor));
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  if(host.querySelector('[data-photo-format]').value==='image/jpeg'){
   ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
  }
  const zoom=1+values.zoom/100*2;
  const panX=values.panX/100*(rw*zoom-cw)/2*factor,panY=values.panY/100*(rh*zoom-ch)/2*factor;
  ctx.save();ctx.translate(canvas.width/2-panX,canvas.height/2-panY);
  ctx.rotate(rotation*Math.PI/180);ctx.scale((flip?-1:1)*zoom*factor,zoom*factor);
  ctx.filter='brightness('+Math.max(.1,1+values.brightness/100)+') hue-rotate('+values.hue+'deg)';
  ctx.drawImage(photo,-w/2,-h/2);ctx.restore();
  processPixels(canvas,values);
 };
 const redraw=()=>{
  frame=0;if(disposed||!photo)return;
  try{render(preview,1000);status.textContent='Preview · '+preview.width+' × '+preview.height+' px · no upload'}
  catch(err){status.textContent='Preview failed: '+String(err.message||err)}
 };
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(redraw)};
 host.addEventListener('input',event=>{
  const range=event.target;if(!range?.dataset?.photoValue)return;
  values[range.dataset.photoValue]=val(range.value);
  range.closest('label').querySelector('output').textContent=range.value;schedule();
 });
 host.querySelector('[data-photo-ratio]').addEventListener('change',schedule);
 host.querySelector('[data-photo-format]').addEventListener('change',schedule);
 host.querySelector('[data-photo-ccw]').addEventListener('click',()=>{rotation=(rotation+270)%360;schedule()});
 host.querySelector('[data-photo-cw]').addEventListener('click',()=>{rotation=(rotation+90)%360;schedule()});
 host.querySelector('[data-photo-flip]').addEventListener('click',()=>{flip=!flip;schedule()});
 host.querySelector('[data-photo-reset]').addEventListener('click',()=>{
  rotation=0;flip=false;host.querySelector('[data-photo-ratio]').value='original';
  host.querySelectorAll('[data-photo-value]').forEach(input=>{
   input.value='0';values[input.dataset.photoValue]=0;input.closest('label').querySelector('output').textContent='0';
  });schedule();
 });
 host.querySelector('[data-photo-export]').addEventListener('click',async()=>{
  if(!photo||disposed)return;
  const button=host.querySelector('[data-photo-export]');button.disabled=true;
  try{
   status.textContent='Rendering edited photo on your device…';
   const output=document.createElement('canvas');render(output,2600);
   const mime=host.querySelector('[data-photo-format]').value;
   const blob=await new Promise(resolve=>output.toBlob(resolve,mime,.92));
   if(!blob)throw Error('The browser could not encode this image');
   const ext=mime==='image/png'?'png':mime==='image/webp'?'webp':'jpg';
   const filename=file.name.replace(/\.[^.]+$/,'').slice(0,90)+'-edited.'+ext;
   if(options.download)options.download(blob,filename);
   else {
    const link=document.createElement('a'),src=URL.createObjectURL(blob);
    link.href=src;link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(src),30000);
   }
   status.textContent='Exported locally · '+output.width+' × '+output.height+' px';
  }catch(err){status.textContent='Export failed: '+String(err.message||err)}
  finally{button.disabled=false}
 });
 photo=new Image();photo.onload=()=>{if(!disposed)redraw()};
 photo.onerror=()=>{status.textContent='This browser cannot decode this image.'};
 photo.src=url;
 return {dispose(){disposed=true;if(frame)cancelAnimationFrame(frame);if(url)URL.revokeObjectURL(url);url=''}};
}
