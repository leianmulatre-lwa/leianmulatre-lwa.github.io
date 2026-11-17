/* BIG LWA responsive Feed image variant: preserves original bytes and metadata.
 * Works only for member-selected, directly uploaded nonanimated JPEG/PNG/WebP
 * photos. Never decodes remote social URLs or strips the stored original.
 */
export const PREVIEW_EDGE=480;
export const MAX_PREVIEW_BYTES=512*1024;
const SUPPORTED=new Set(['image/jpeg','image/png','image/webp']);

export async function makeFeedPreview(source,{maxEdge=PREVIEW_EDGE,quality=.76}={}){
 if(!(source instanceof Blob)||!SUPPORTED.has(source.type)||source.size<70000)return null;
 if(typeof createImageBitmap!=='function')return null;
 let bitmap=null;
 try{
  bitmap=await createImageBitmap(source,{imageOrientation:'from-image'});
  const w=bitmap.width,h=bitmap.height;
  if(!(w>0&&h>0&&w<=24000&&h<=24000))return null;
  const edge=Math.min(PREVIEW_EDGE,Math.max(96,Math.round(maxEdge)));
  const factor=Math.min(1,edge/Math.max(w,h));
  const width=Math.max(1,Math.round(w*factor)),height=Math.max(1,Math.round(h*factor));
  let blob=null;
  if(typeof OffscreenCanvas==='function'){
   const canvas=new OffscreenCanvas(width,height);
   canvas.getContext('2d',{alpha:true})?.drawImage(bitmap,0,0,width,height);
   blob=await canvas.convertToBlob({type:'image/webp',quality});
  }else if(typeof document!=='undefined'){
   const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
   canvas.getContext('2d',{alpha:true})?.drawImage(bitmap,0,0,width,height);
   blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',quality));
  }
  if(!blob||blob.type!=='image/webp'||blob.size<16||
     blob.size>MAX_PREVIEW_BYTES||blob.size>=source.size*.90)return null;
  return {blob,width,height,sourceBytes:source.size,previewBytes:blob.size};
 }catch{return null}
 finally{bitmap?.close?.()}
}

export function originalUploadName(uploaded){
 const key=String(uploaded?.key||'');
 const name=key.split('/').pop();
 if(!/^[0-9]{9,15}-[A-Za-z0-9_-]{12,80}\.(?:jpg|jpeg|png|webp)$/.test(name||''))return '';
 return name;
}
export async function uploadFeedPreview(source,uploaded,{worker,token}={}){
 const name=originalUploadName(uploaded);
 if(!name||!token||!/^https:\/\/[A-Za-z0-9._-]+$/.test(String(worker||'')))return null;
 const rendition=await makeFeedPreview(source);
 if(!rendition)return null;
 try{
  const response=await fetch(worker+'/media/feed-image-variant?original='+encodeURIComponent(name),{
   method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'image/webp'},
   body:rendition.blob
  });
  if(!response.ok)return null;
  const result=await response.json();
  const url=new URL(String(result?.url||''));
  if(url.origin!==worker||!url.pathname.startsWith('/media/feed-image-variant/'))return null;
  return {...rendition,url:url.href,key:result.key};
 }catch{return null}
}
