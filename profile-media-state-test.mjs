import assert from 'node:assert/strict';
import {mediaStateRoute} from './profile-media-state.js';
const data=new Map();let version=0,uid='owner';
const bucket={async get(k){const o=data.get(k);return o?{etag:o.etag,json:async()=>JSON.parse(o.value)}:null},async head(k){return data.get(k)?.metadata||null},async put(k,value,opts={}){const old=data.get(k);if(opts.onlyIf?.etagMatches&&old?.etag!==opts.onlyIf.etagMatches)return null;if(opts.onlyIf?.etagDoesNotMatch==='*'&&old)return null;const o={value,etag:String(++version)};data.set(k,o);return o}};
for(const [folder,name,state]of [['profile-photos','photo.jpg','approved'],['wallpapers','clean.webp','approved'],['wallpapers','flagged.jpg','pending']])data.set(folder+'/owner/'+name,{metadata:{customMetadata:{uid:'owner',state,kind:'image'}}});
const helpers={user:async()=>{if(!uid)throw Object.assign(Error('Sign in'),{status:401});return {uid}},json:(v,status)=>Response.json(v,{status}),preflight:()=>new Response(null),allowed:r=>r.headers.get('Origin')==='https://biglwa.com'};
async function call(path='',value){const response=await mediaStateRoute(new Request('https://api.biglwa.com/media/profile-state'+path,{method:value?'POST':'GET',headers:{Origin:'https://biglwa.com'},...(value?{body:JSON.stringify(value)}:{})}),{WALLPAPER_BUCKET:bucket},helpers);return response.json()}
const photo='https://biglwa-instagram-api.leianmulatre-284.workers.dev/media/profile-photo/owner/photo.jpg';
assert.equal((await call()).uid,'owner');await call('',{profilePhotoUrl:photo,widgetAudience:{notes:'private',games:'everyone',evil:'invented'}});let saved=await call('/owner');assert.equal(saved.profilePhotoUrl,photo);assert.equal(saved.widgetAudience.notes,'private');assert(!saved.widgetAudience.evil);
uid='visitor';await assert.rejects(call('',{profilePhotoUrl:photo}),/another account/);uid='owner';await assert.rejects(call('',{wallpaperMedia:{url:'https://biglwa-instagram-api.leianmulatre-284.workers.dev/media/wallpaper/owner/flagged.jpg'}}),/flagged/);
await call('',{wallpaperMedia:{url:'https://biglwa-instagram-api.leianmulatre-284.workers.dev/media/wallpaper/owner/clean.webp'}});await call('',{profilePhotoPosition:{x:-40,y:200}});saved=await call('/owner');assert.deepEqual(saved.profilePhotoPosition,{x:0,y:100});assert.equal(saved.wallpaperMedia.state,'approved');assert.equal(saved.profilePhotoUrl,photo,'Partial appearance saves preserve the selected photo');
uid='';saved=await call('/owner');assert.equal(saved.profilePhotoUrl,photo,'Signed-out preview reads approved cloud photo without Firestore');await assert.rejects(call('',{profilePhotoUrl:photo}),/Sign in/);
uid='owner';await call('',{profilePhotoUrl:null,wallpaperMedia:null});saved=await call('/owner');assert(saved.photoKnown&&saved.wallpaperKnown);assert.equal(saved.profilePhotoUrl,'');assert.equal(saved.wallpaperMedia,null,'Deletion tombstones prevent old Firestore mirrors resurrecting media');
console.log('PASS durable profile media: UID ownership, approved-only wallpapers, cloud preview, partial writes, audience validation and deletion tombstones');
const originalFetch=globalThis.fetch;
try{
 globalThis.fetch=async()=>Response.json({users:[{localId:'uploaded-owner',emailVerified:true}]});
 const worker=(await import('./cloudflare-worker-instagram.js')).default;
 const upload=await worker.fetch(new Request('https://api.biglwa.com/media/profile-photo',{method:'POST',headers:{Authorization:'Bearer test','Content-Type':'image/jpeg',Origin:'https://biglwa.com'},body:new Uint8Array([255,216,255,224,1,2,3])}),{WALLPAPER_BUCKET:bucket,SITE_URL:'https://biglwa.com'});
 assert.equal(upload.status,200);const saved=await upload.json();const publicRead=await worker.fetch(new Request('https://api.biglwa.com/media/profile-state/uploaded-owner'),{WALLPAPER_BUCKET:bucket,SITE_URL:'https://biglwa.com'});assert.equal((await publicRead.json()).profilePhotoUrl,saved.url);
 console.log('PASS Worker upload immediately records the approved cloud photo for signed-out profile previews');
}finally{globalThis.fetch=originalFetch}
