export const TIKTOK_IMPORT_OWNER='lxUOaCqJGpdgkLYgEsIvQ3xtN552';
const BASE='https://biglwa.com/assets/tiktok/leianstanley/';
export async function snapshotPostId(uid,id){const b=new TextEncoder().encode('tiktok:'+uid+':'+id);const hash=new Uint8Array(await crypto.subtle.digest('SHA-256',b));return 'orbit_'+Array.from(hash,b=>b.toString(16).padStart(2,'0')).join('').slice(0,40)}
export function buildTikTokSnapshotPost(snapshot,item,prior=null){
 if(snapshot.ownerUid!==TIKTOK_IMPORT_OWNER||snapshot.handle!=='leianstanley'||snapshot.ownerUsername!=='leian')throw Error('TikTok import owner mismatch');
 if(!/^\d{12,25}$/.test(item.id)||!new RegExp('^https://www\\.tiktok\\.com/@leianstanley/(video|photo)/'+item.id+'$').test(item.sourceUrl))throw Error('TikTok post identity mismatch');
 if(prior&&prior.uid!==snapshot.ownerUid)throw Error('Existing post belongs to a different account');
 if(prior&&(prior.importSnapshotId===snapshot.snapshotId||['archived','pending_delete','deleted'].includes(prior.archiveState)||['archived','deleted','pending_delete'].includes(prior.state)))return null;
 const asset=(url,kind)=>{if(typeof url!=='string'||!url.startsWith(BASE)||url.includes('..')||!new RegExp('^'+item.id+'-[a-z0-9-]+\\.'+(kind==='video'?'mp4':'(?:jpg|jpeg|png|webp|heic)')+'$').test(url.slice(BASE.length)))throw Error('Untrusted imported media');return url};
 const cover=asset(item.cover,'photo');if(!Array.isArray(item.media)||!item.media.length)throw Error('Empty TikTok media');
 const mediaItems=item.media.map((m,index)=>({index,url:asset(m.url,m.kind),thumbnailUrl:m.kind==='video'?cover:asset(m.url,'photo'),isPicture:m.kind!=='video',mediaType:m.kind==='video'?'VIDEO':'IMAGE'}));
 const pictures=mediaItems.filter(m=>m.isPicture).map(m=>m.url),video=mediaItems.find(m=>!m.isPicture)?.url;
 return {...(prior||{}),uid:snapshot.ownerUid,username:'leian',usernameLower:'leian',authorName:prior?.authorName||'Leian Stanley',source:'tiktok',sourcePostId:item.id,sourceUsername:snapshot.handle,sourceUrl:item.sourceUrl,
 caption:prior?.caption||item.caption||'TikTok post',sourceCaption:item.caption||'',mediaType:video?'VIDEO':pictures.length>1?'CAROUSEL':'IMAGE',videoUrl:video||null,thumbnailUrl:cover,imageUrl:pictures[0]||cover,imageUrls:pictures.length?pictures:[cover],mediaItems,
 orbitImported:true,sourceHostedMedia:false,importSnapshotId:snapshot.snapshotId,importProvenance:'owner-requested-public-import',sourceMetrics:item.stats||[],sourceObservedAt:snapshot.checkedAt,sourceCreatedAtMs:item.sourceCreatedAtMs,state:'approved',archiveState:'collective'};
}
