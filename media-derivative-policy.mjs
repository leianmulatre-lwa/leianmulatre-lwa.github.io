/* BIG LWA · owner-scoped public Feed thumbnail contract.
   Derivatives are *not* supported for private wallpapers/profile photos.
   Names always come from the verified user's own, existing feed-image key.
*/
export const PREVIEW_BYTES_MAX=512*1024;
export const PREVIEW_WIDTH=480;
export const PREVIEW_MIME='image/webp';
export const ORIGINAL_TYPES=new Set(['image/jpeg','image/png','image/webp']);
export function validOriginalName(name){
 return typeof name==='string'&&/^[0-9]{9,15}-[A-Za-z0-9_-]{12,80}\.(?:jpg|jpeg|png|webp)$/.test(name);
}
export function originalKey(uid,name){
 if(!/^[A-Za-z0-9_-]{8,128}$/.test(String(uid)))throw Error('Invalid account scope.');
 if(!validOriginalName(name))throw Error('Invalid original media name.');
 return 'feed-images/'+uid+'/'+name;
}
export function derivativeKey(uid,name){
 originalKey(uid,name);
 return 'feed-image-variants/'+uid+'/'+name+'.w'+PREVIEW_WIDTH+'.webp';
}
export function looksLikeWebp(bytes){
 if(!bytes||bytes.byteLength<16)return false;
 const b=new Uint8Array(bytes.buffer||bytes,bytes.byteOffset||0,Math.min(bytes.byteLength,16));
 return b[0]===82&&b[1]===73&&b[2]===70&&b[3]===70&&
        b[8]===87&&b[9]===69&&b[10]===66&&b[11]===80;
}
export function verifyParent(parent,uid){
 return !!parent&&parent.customMetadata?.uid===uid&&
        ORIGINAL_TYPES.has(String(parent.httpMetadata?.contentType||'').toLowerCase());
}
