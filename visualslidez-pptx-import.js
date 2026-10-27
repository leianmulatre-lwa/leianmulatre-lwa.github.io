/* BIG LWA VisualSlidez — safe native PowerPoint package importer.
   Keeps source bytes intact for lossless re-download; browser preview is best
   effort. No slide data is sent to any conversion server.
   XML is parsed as data, never evaluated as code or injected as HTML. */
(()=>{'use strict';
 if(window.BigLWAVisualPptx)return;
 const P='http://schemas.openxmlformats.org/presentationml/2006/main';
 const A='http://schemas.openxmlformats.org/drawingml/2006/main';
 const R='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
 const PKG='http://schemas.openxmlformats.org/package/2006/relationships';
 const LIM=120,MAX_SHP=400,MAX_IMAGE=14*1024*1024;
 const D=()=>new DOMParser();
 const children=(node,local)=>Array.from(node?.children||[]).filter(x=>!local||x.localName===local);
 const first=(node,local)=>children(node,local)[0]||null;
 const nested=(node,local)=>node?.getElementsByTagNameNS(A,local)?.[0]||null;
 const get=(n,k,d='')=>n?.getAttribute(k)??d;
 const str=(s,n=5000)=>String(s??'').slice(0,n);
 const hex=s=>/^[0-9a-f]{6}$/i.test(s||'')?'#'+s:'#392a33';
 const fmt=val=>Number.isFinite(Number(val))?Math.max(0,Number(val)):0;
 const px=(v,axis)=>Math.min(250,Math.max(-100,(fmt(v)/axis)*100));
 const parse=xml=>{const doc=D().parseFromString(xml,'application/xml');if(doc.getElementsByTagName('parsererror').length)throw Error('PowerPoint has malformed XML');return doc};
 const pathResolve=(base,target)=>{
   if(!target||/^([a-z][a-z0-9+.-]*:|\/\/)/i.test(target))return '';
   const url=new URL(target,'https://local.invalid/'+base);
   if(url.hostname!=='local.invalid'||!url.pathname.startsWith('/ppt/'))return '';
   return decodeURIComponent(url.pathname.slice(1));
 };
 const fileText=async(zip,path)=>zip.file(path)?zip.file(path).async('text'):'';
 const rgb=node=>{const solid=node?.localName==='solidFill'?node:nested(node,'solidFill');return solid?hex(get(nested(solid,'srgbClr'),'val','')):null};
 function rect(node,size){
   const transform=nested(node,'xfrm'),off=nested(transform,'off'),ext=nested(transform,'ext');
   const x=Number(get(off,'x',0)),y=Number(get(off,'y',0)),w=Number(get(ext,'cx',0)),h=Number(get(ext,'cy',0));
   return {x:px(x,size.w),y:px(y,size.h),w:px(w,size.w),h:px(h,size.h)};
 }
 function paragraph(el){
   const props=first(el,'pPr'),align=get(props,'algn','l');
   const runs=[];
   for(const c of children(el)){
     if(c.localName==='br'){runs.push({text:'\n'});continue}
     if(c.localName!=='r'&&c.localName!=='fld')continue;
     const rp=first(c,'rPr'),txt=nested(c,'t');
     const text=str(txt?.textContent||'',5000);if(!text)continue;
     const fontFace=str(get(nested(rp,'latin'),'typeface',''),120);
     runs.push({text,font:fontFace,size:fmt(get(rp,'sz',0))/100||null,
       color:rgb(rp),bold:get(rp,'b')==='1',italic:get(rp,'i')==='1',
       underline:get(rp,'u')==='sng',lang:str(get(rp,'lang',''),16)});
   }
   return {align,runs};
 }
 function textBlock(node,size){
   const body=children(node,'txBody')[0];
   if(!body)return null;
   const paragraphs=children(body,'p').map(paragraph);
   const content=paragraphs.map(p=>p.runs.map(r=>r.text).join('')).join('\n');
   if(!content.trim())return null;
   const spPr=children(node,'spPr')[0];
   const fill=rgb(spPr),line=rgb(nested(spPr,'ln'));
   return {kind:'text',...rect(spPr||node,size),fill,line,
     paragraphs,text:str(content,15000)};
 }
 function shape(node,size){
   const spPr=first(node,'spPr')||node;
   const text=textBlock(node,size);
   if(text)return text;
   const geometry=nested(spPr,'prstGeom');
   return {kind:'shape',...rect(spPr,size),fill:rgb(spPr),line:rgb(nested(spPr,'ln')),
     geometry:get(geometry,'prst','rect')};
 }
 async function picture(node,size,rel,zip,imageCache){
   const blip=nested(node,'blip'),rid=blip?.getAttributeNS(R,'embed')||get(blip,'r:embed');
   const target=rel.get(rid);
   const media=target&&zip.file(target);
   const ext=target?.split('.').pop()?.toLowerCase();
   const mime={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',webp:'image/webp'}[ext];
   const xfrm=nested(node,'xfrm'),mediaTitle=get(nested(node,'cNvPr'),'descr','Imported image');
   if(!media||!mime)return {kind:'unsupported',...rect(xfrm||node,size),title:'Unsupported embedded image preserved in source PowerPoint'};
   if((media._data?.uncompressedSize||0)>MAX_IMAGE)return {kind:'unsupported',...rect(xfrm||node,size),title:'Large image preserved in original'};
   if(!imageCache.has(target))imageCache.set(target,'data:'+mime+';base64,'+await media.async('base64'));
   return {kind:'image',...rect(xfrm||node,size),src:imageCache.get(target),alt:str(mediaTitle,200)};
 }
 function rels(doc,base){
   const links=new Map();
   for(const relation of Array.from(doc.getElementsByTagNameNS(PKG,'Relationship'))){
     if(get(relation,'TargetMode')==='External')continue;
     const target=pathResolve(base,get(relation,'Target'));
     if(target)links.set(get(relation,'Id'),target);
   }
   return links;
 }
 async function notesFor(zip,slidePath,relationshipMap){
   const notePath=[...relationshipMap.values()].find(p=>/^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(p));
   if(!notePath)return '';
   const xml=await fileText(zip,notePath);if(!xml)return '';
   const doc=parse(xml);
   return str([...doc.getElementsByTagNameNS(A,'t')].map(n=>n.textContent).filter(Boolean).join('\n'),3000);
 }
 async function readMetadata(zip){
   const props={};
   for(const [file,fields] of [
     ['docProps/core.xml',['title','subject','creator','lastModifiedBy','description','created','modified','keywords']],
     ['docProps/app.xml',['Application','Slides','Company','PresentationFormat','AppVersion']]
   ]){
     const content=await fileText(zip,file);if(!content)continue;
     const root=parse(content);
     for(const field of fields){
       const el=[...root.getElementsByTagName('*')].find(n=>n.localName===field);
       if(el)props[field]=str(el.textContent,400);
     }
   }
   return props;
 }
 async function load(file,JSZip){
   if(!JSZip)throw Error('PowerPoint archive library unavailable.');
   const binary=await file.arrayBuffer(),zip=await JSZip.loadAsync(binary);
   if(!zip.file('ppt/presentation.xml'))throw Error('Not a valid PowerPoint presentation.');
   const presentation=parse(await fileText(zip,'ppt/presentation.xml'));
   const slideSize=presentation.getElementsByTagNameNS(P,'sldSz')[0];
   const size={w:Number(get(slideSize,'cx'))||12192000,h:Number(get(slideSize,'cy'))||6858000};
   const slideNames=Object.keys(zip.files)
     .filter(n=>/^ppt\/slides\/slide\d+\.xml$/.test(n))
     .sort((a,b)=>Number(a.match(/slide(\d+)/)[1])-Number(b.match(/slide(\d+)/)[1]))
     .slice(0,LIM);
   if(!slideNames.length)throw Error('No standard PowerPoint slides found.');
   const imageCache=new Map(),slides=[];
   let incomplete=0;
   for(const name of slideNames){
     const xml=parse(await fileText(zip,name));
     const relationshipPath=name.replace(/\/([^/]+)$/, '/_rels/$1.rels');
     const linkXML=await fileText(zip,relationshipPath);
     const links=linkXML?rels(parse(linkXML),name):new Map();
     const tree=xml.getElementsByTagNameNS(P,'spTree')[0],items=[];
     const nodes=Array.from(tree?.children||[]).filter(n=>['pic','sp','cxnSp','graphicFrame','grpSp'].includes(n.localName)).slice(0,MAX_SHP);
     for(const n of nodes){
       if(n.localName==='pic')items.push(await picture(n,size,links,zip,imageCache));
       else if(n.localName==='sp')items.push(shape(n,size));
       else if(n.localName==='cxnSp')items.push(shape(n,size));
       else {
         incomplete++;
         items.push({kind:'unsupported',...rect(n,size),title:n.localName==='graphicFrame'?'Embedded chart or table preserved in source file':'Grouped artwork preserved in source file'});
       }
     }
     const bg=nested(first(xml.getElementsByTagNameNS(P,'cSld')[0],'bg'),'solidFill');
     const background=rgb(bg)||'#ffffff';
     const txt=items.filter(x=>x.kind==='text').map(x=>x.text).filter(Boolean);
     slides.push({
       title:str(txt[0]?.split('\n')[0]||'Slide '+(slides.length+1),300),
       body:str(txt.slice(1).join('\n'),6000),
       notes:await notesFor(zip,name,links),
       imported:true,sourceName:str(file.name,200),
       scene:{items,background,size,hasUnrendered:items.some(i=>i.kind==='unsupported')}
     });
   }
   return {slides,binary,metadata:{...await readMetadata(zip),fileName:str(file.name,200),fileSize:file.size,slideCount:slides.length,unsupportedBlocks:incomplete}};
 }
 const opt=(value,scale=1)=>Math.max(0,Number(value)||0)*scale;
 function paint(slide,host){
   if(!host||!slide?.scene)return;
   const stage=document.createElement('div');stage.className='vs-import-stage';
   stage.style.background=slide.scene.background||'#fff';
   stage.setAttribute('aria-label','Imported slide preview');
   const list=slide.scene.items||[];
   for(const item of list){
     const el=document.createElement('div');
     el.className='vs-layer vs-layer-'+item.kind;
     for(const [k,val] of [['left',item.x],['top',item.y],['width',item.w],['height',item.h]])
       el.style[k]=Math.max(0,Math.min(100,Number(val)||0))+'%';
     if(item.kind==='image'){
       const im=document.createElement('img');im.src=item.src;im.alt=item.alt||'';im.loading='lazy';im.draggable=false;
       el.append(im);
     }else if(item.kind==='text'){
       if(item.fill)el.style.background=item.fill;
       if(item.line)el.style.border='1px solid '+item.line;
       for(const para of item.paragraphs||[]){
         const p=document.createElement('p');p.style.textAlign=({ctr:'center',r:'right',just:'justify'}[para.align]||'left');
         for(const run of para.runs||[]){
           const span=document.createElement('span');span.textContent=run.text;
           if(run.font)span.style.fontFamily='"'+run.font.replace(/[^a-zA-Z0-9 ._-]/g,'')+'", Georgia, sans-serif';
           if(run.size)span.style.fontSize='clamp(4px,'+(run.size/7.5)+'vw,44px)';
           if(run.color)span.style.color=run.color;
           if(run.bold)span.style.fontWeight='bold';
           if(run.italic)span.style.fontStyle='italic';
           if(run.underline)span.style.textDecoration='underline';
           p.append(span);
         }
         el.append(p);
       }
     }else if(item.kind==='shape'){
       if(item.fill)el.style.background=item.fill;
       if(item.line)el.style.border='1px solid '+item.line;
       if(item.geometry==='ellipse')el.style.borderRadius='50%';
     }else{
       el.classList.add('vs-import-placeholder');
       el.textContent=item.title||'Object preserved in original PowerPoint';
     }
     stage.append(el);
   }
   host.replaceChildren(stage);
 }
 function idb(){
   return new Promise((resolve,reject)=>{
     if(!window.indexedDB)return reject(Error('IndexedDB unavailable'));
     const req=indexedDB.open('biglwa-visualslidez-v2',1);
     req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains('decks'))db.createObjectStore('decks')};
     req.onsuccess=()=>resolve(req.result);
     req.onerror=()=>reject(req.error||Error('Deck database error'));
   });
 }
 async function transact(key,data){
   const db=await idb();
   return new Promise((resolve,reject)=>{
     const tx=db.transaction('decks',data===undefined?'readonly':'readwrite');
     const store=tx.objectStore('decks'),req=data===undefined?store.get(key):store.put(data,key);
     req.onsuccess=()=>resolve(req.result);
     req.onerror=()=>reject(req.error);
     tx.oncomplete=()=>db.close();tx.onerror=()=>{db.close();reject(tx.error)};
   });
 }
 const sheet=document.createElement('style');sheet.id='biglwa-visual-pptx-style';
 sheet.textContent=`
  #lwaVisualSlides .vs-import-shell{display:grid;gap:9px}
  #lwaVisualSlides .vs-import-stage{position:relative;aspect-ratio:16/9;overflow:hidden;width:100%;background:#fff}
  #lwaVisualSlides .vs-slide:has(.vs-import-shell){padding:0!important;border-width:0!important;overflow:hidden}
  #lwaVisualSlides .vs-layer{position:absolute;box-sizing:border-box;overflow:hidden;overflow-wrap:anywhere}
  #lwaVisualSlides .vs-layer-image img{width:100%;height:100%;object-fit:fill;display:block}
  #lwaVisualSlides .vs-layer-text{white-space:pre-wrap;line-height:1.14;display:flex;flex-direction:column;align-items:stretch;justify-content:center}
  #lwaVisualSlides .vs-layer-text p{margin:0;line-height:1.14;white-space:pre-wrap}
  #lwaVisualSlides .vs-import-placeholder{border:1px dashed #ae8992;color:#795e65;background:#fff4e8;font:600 10px/1.3 system-ui;display:grid;place-items:center;padding:6px}
  #lwaVisualSlides .vs-import-note{font:500 11px/1.5 system-ui;color:#59454d;margin:6px 0}
  #lwaVisualSlides .vs-meta-panel{display:grid;gap:4px;border:1px solid #d4b5a6;padding:8px;background:#fffaf1;border-radius:8px;font:500 11px/1.4 system-ui}
 `;
 document.head.append(sheet);
 window.BigLWAVisualPptx={load,paint,persist:(key,slides,binary,metadata)=>transact(key,{slides,binary,metadata}),restore:key=>transact(key),clear:key=>transact(key,null)};
})();