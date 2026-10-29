/* Durable, UID-owned media pointers. Binary uploads remain in the existing R2
   bucket. Public readers receive approved media only, never private records. */
const keyFor=uid=>'profile-media-state/'+encodeURIComponent(uid)+'.json';
const fail=(message,status=400)=>{throw Object.assign(Error(message),{publicMessage:message,status})};
const axis=n=>Math.min(100,Math.max(0,Number.isFinite(Number(n))?Number(n):50));
export async function readMediaState(bucket,uid){return (await bucket.get(keyFor(uid)))?.json()||{uid}}
export async function updateMediaState(bucket,uid,changes){
 for(let retry=0;retry<4;retry++){
  const previous=await bucket.get(keyFor(uid)),data=previous?await previous.json():{uid};
  const next={...data,...changes,uid,updatedAt:Date.now()};
  const saved=await bucket.put(keyFor(uid),JSON.stringify(next),{httpMetadata:{contentType:'application/json',cacheControl:'no-store'},onlyIf:previous?{etagMatches:previous.etag}:{etagDoesNotMatch:'*'}});
  if(saved)return next;
 }
 fail('Profile changed on another device. Try again.',409);
}
async function ownedMedia(bucket,uid,value,type){
 if(value===null)return null;
 const raw=String(value||'');let url;try{url=new URL(raw)}catch{fail('Invalid profile media link.')}
 if(!['biglwa-instagram-api.leianmulatre-284.workers.dev','api.biglwa.com'].includes(url.hostname)||url.protocol!=='https:')fail('Choose media saved to your BIG LWA account.');
 const match=new RegExp('^/media/'+type+'/([^/]+)/([^/]+)$').exec(url.pathname);
 if(!match||decodeURIComponent(match[1])!==uid||!/^[-A-Za-z0-9_.]+$/.test(match[2]))fail('This file belongs to another account.',403);
 const folder=type==='profile-photo'?'profile-photos':'wallpapers';const object=await bucket.head(folder+'/'+uid+'/'+match[2]);
 if(!object||object.customMetadata?.uid!==uid)fail('This account file could not be found.',404);
 if(object.customMetadata?.state!=='approved')fail('This wallpaper was flagged and cannot be published yet.',403);
 return {url:url.href,kind:object.customMetadata?.kind==='video'?'video':'image',state:'approved'};
}
export async function mediaStateRoute(request,env,{user,json,preflight,allowed}){
 if(request.method==='OPTIONS')return preflight(request,env);
 const bucket=env.WALLPAPER_BUCKET;if(!bucket)fail('Account media unavailable.',503);
 const path=new URL(request.url).pathname,publicUid=/^\/media\/profile-state\/([A-Za-z0-9_-]{1,128})$/.exec(path);
 if(publicUid&&request.method==='GET'){
  const data=await readMediaState(bucket,publicUid[1]);
  return json({ok:true,uid:data.uid,photoKnown:Object.hasOwn(data,'profilePhotoUrl'),wallpaperKnown:Object.hasOwn(data,'wallpaperMedia'),profilePhotoUrl:data.profilePhotoUrl||'',profilePhotoPosition:data.profilePhotoPosition||{x:50,y:50},wallpaperMedia:data.wallpaperMedia||null,widgetAudience:data.widgetAudience||{}},200,request,env);
 }
 if(!allowed(request,env))fail('Origin not allowed.',403);
 const {uid}=await user(request,env);
 if(request.method==='GET')return json({ok:true,...await readMediaState(bucket,uid)},200,request,env);
 if(request.method!=='POST')fail('Unsupported request.',405);
 const reader=request.body?.getReader();let total=0;const chunks=[];if(reader)for(;;){const {value,done}=await reader.read();if(done)break;total+=value.length;if(total>12000){await reader.cancel();fail('Profile update is too large.',413)}chunks.push(value)}const bytes=new Uint8Array(total);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length}const raw=new TextDecoder().decode(bytes);
 let input;try{input=JSON.parse(raw)}catch{fail('Invalid profile update.')}
 const next={};
 if(Object.hasOwn(input,'profilePhotoUrl')){const photo=await ownedMedia(bucket,uid,input.profilePhotoUrl,'profile-photo');next.profilePhotoUrl=photo?.url||''}
 if(input.profilePhotoPosition)next.profilePhotoPosition={x:axis(input.profilePhotoPosition.x),y:axis(input.profilePhotoPosition.y)};
 if(Object.hasOwn(input,'wallpaperMedia'))next.wallpaperMedia=input.wallpaperMedia===null?null:await ownedMedia(bucket,uid,input.wallpaperMedia.url,'wallpaper');
 if(input.widgetAudience){next.widgetAudience={};for(const [key,value]of Object.entries(input.widgetAudience).slice(0,36)){if(/^[a-z][a-z0-9-]{0,35}$/.test(key)&&['everyone','members','private'].includes(value))next.widgetAudience[key]=value}}
 return json({ok:true,...await updateMediaState(bucket,uid,next)},200,request,env);
}
