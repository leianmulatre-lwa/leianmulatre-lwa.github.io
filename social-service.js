/* First-party Sqwidz, presence and private DMs. All private paths are derived
   from a verified Firebase UID. R2 records are independent to avoid lost appends. */
const ROOT='social-v1/';
const fail=(message,status=400)=>{throw Object.assign(Error(message),{publicMessage:message,status})};
const clean=(v,n=2000)=>String(v||'').trim().slice(0,n);
const segment=v=>encodeURIComponent(String(v));
const reverse=()=>String(9999999999999-Date.now()).padStart(13,'0')+'_'+crypto.randomUUID();
const put=(b,k,v)=>b.put(ROOT+k,JSON.stringify(v),{httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'}});
const get=async(b,k)=>(await b.get(ROOT+k))?.json()||null;
async function list(b,prefix,limit=60,cursor){const page=await b.list({prefix:ROOT+prefix,limit,cursor});return {items:(await Promise.all(page.objects.map(o=>b.get(o.key).then(x=>x?.json())))).filter(Boolean),cursor:page.truncated?page.cursor:null}}
async function bytes(request,max=70000){
 const reader=request.body?.getReader();if(!reader)return new Uint8Array();
 let bytes=0,chunks=[];for(;;){const {value,done}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>max){await reader.cancel();fail('This update is too large.',413)}chunks.push(value)}
 const all=new Uint8Array(bytes);let offset=0;for(const chunk of chunks){all.set(chunk,offset);offset+=chunk.length}
 return all;
}
async function body(request){const all=await bytes(request);
 try{return JSON.parse(new TextDecoder().decode(all))}catch{fail('Invalid update.')}
}
async function directory(request,username){
 const name=clean(username,30).replace(/^@/,'').toLowerCase();if(!/^[a-z0-9._-]{1,30}$/.test(name))fail('Choose a BIG LWA username.');
 const r=await fetch('https://firestore.googleapis.com/v1/projects/biglwa/databases/(default)/documents/usernames/'+encodeURIComponent(name),{headers:{Authorization:request.headers.get('Authorization')||''}});
 if(!r.ok)fail('That member could not be found.',404);const d=(await r.json()).fields||{};
 const person={uid:d.uid?.stringValue,username:d.username?.stringValue||name,name:d.name?.stringValue||name};if(!person.uid)fail('That member could not be found.',404);return person;
}
async function meProfile(request,uid){
 const r=await fetch('https://firestore.googleapis.com/v1/projects/biglwa/databases/(default)/documents/users/'+segment(uid),{headers:{Authorization:request.headers.get('Authorization')||''}});
 if(!r.ok)fail('Your account could not be loaded.',503);return (await r.json()).fields||{};
}
function mediaURL(v){if(!v)return '';try{const u=new URL(v);if(u.protocol==='https:'&&!u.username&&!u.password&&u.href.length<1800)return u.href}catch{}fail('Use an HTTPS media link.')}
async function sourcePost(b,id,request){
 const post=await get(b,'posts/'+id+'.json');if(post)return post;
 if(id.startsWith('sz_'))return null;
 const response=await fetch('https://firestore.googleapis.com/v1/projects/biglwa/databases/(default)/documents/sqwibs/'+segment(id),{headers:{Authorization:request.headers.get('Authorization')||''}});
 if(!response.ok)return null;const f=(await response.json()).fields||{};
 return {id,uid:f.uid?.stringValue,text:f.text?.stringValue||'',visibility:f.visibility?.stringValue,allowResqwib:f.allowResqwib?.booleanValue===true,createdAt:Date.parse(f.createdAt?.timestampValue||'')||0};
}
export async function socialRoute(request,env,{user,json,preflight,allowed}){
 if(request.method==='OPTIONS')return preflight(request,env);
 const publicMedia=/^\/social\/post\/(sz_[A-Za-z0-9_-]{2,120})\/media$/.exec(new URL(request.url).pathname);
 if(publicMedia&&request.method==='GET'){
  const bucket=env.WALLPAPER_BUCKET,post=await get(bucket,'posts/'+publicMedia[1]+'.json');if(post?.visibility!=='public'||!post.asset)fail('Media unavailable.',404);
  const key=ROOT+'members/'+segment(post.uid)+'/uploads/'+post.asset;
  const asset=await bucket.get(key,{range:request.headers});if(!asset)fail('Media unavailable.',404);
  const headers=new Headers({'Content-Type':asset.httpMetadata?.contentType||'application/octet-stream','X-Content-Type-Options':'nosniff','Accept-Ranges':'bytes','Cache-Control':'private, no-store'});
  let status=200;if(asset.range){status=206;headers.set('Content-Range','bytes '+asset.range.offset+'-'+(asset.range.offset+asset.range.length-1)+'/'+asset.size);headers.set('Content-Length',String(asset.range.length))}else headers.set('Content-Length',String(asset.size));
  const origin=allowed(request,env);if(origin){headers.set('Access-Control-Allow-Origin',origin);headers.set('Vary','Origin')}return new Response(asset.body,{status,headers});
 }
 if(!allowed(request,env))fail('Origin not allowed.',403);
 const url=new URL(request.url),path=url.pathname.replace(/^\/social\//,''),b=env.WALLPAPER_BUCKET;
 if(!b)fail('Account storage is unavailable.',503);
 if(!['GET','POST'].includes(request.method))fail('Unsupported request.',405);
 const member=await user(request,env),uid=member.uid,own='members/'+segment(uid)+'/';
 if(path==='upload'&&request.method==='POST'){
  const data=await bytes(request,25*1024*1024),type=(request.headers.get('Content-Type')||'').split(';')[0];
  const ascii=(a,z)=>new TextDecoder().decode(data.slice(a,z));
  const signatures={'image/jpeg':data[0]===255&&data[1]===216&&data[2]===255,'image/png':data[0]===137&&ascii(1,4)==='PNG','image/webp':ascii(0,4)==='RIFF'&&ascii(8,12)==='WEBP','video/quicktime':ascii(4,8)==='ftyp','video/mp4':ascii(4,8)==='ftyp','video/webm':data[0]===26&&data[1]===69&&data[2]===223&&data[3]===163,'audio/webm':data[0]===26&&data[1]===69&&data[2]===223&&data[3]===163,'audio/mpeg':ascii(0,3)==='ID3'||(data[0]===255&&(data[1]&224)===224),'audio/wav':ascii(0,4)==='RIFF'&&ascii(8,12)==='WAVE','audio/ogg':ascii(0,4)==='OggS','audio/mp4':ascii(4,8)==='ftyp'};
  if(!signatures[type])fail('Choose a JPEG, PNG, WebP, MP4, MOV, WebM, MP3, WAV or Ogg file.');
  const id=crypto.randomUUID();await b.put(ROOT+own+'uploads/'+id,data,{httpMetadata:{contentType:type,cacheControl:'private, no-store'}});return json({ok:true,asset:id,type},200,request,env);
 }
 const input=request.method==='POST'?await body(request):{};
 const reply=v=>json({ok:true,...v},200,request,env);
 const requirePost=()=>{if(request.method!=='POST')fail('Use POST.',405)};
 if(path==='presence'){
  requirePost();await put(b,own+'presence.json',{at:Date.now(),online:input.online!==false});
  const profile=await meProfile(request,uid),connections=profile.peopleConnections?.mapValue?.fields||{};
  const ids=Object.keys(connections).slice(0,200),online=[];
  await Promise.all(ids.map(async id=>{const p=await get(b,'members/'+segment(id)+'/presence.json');if(p?.online&&Date.now()-p.at<100000)online.push(id)}));return reply({online});
 }
 if(path==='inbox')return reply(await list(b,own+'inbox/',100));
 if(path==='messages'){
  const target=await directory(request,request.method==='POST'?input.to:url.searchParams.get('to'));if(target.uid===uid)fail('Choose another member.');
  const thread=[uid,target.uid].sort().map(segment).join('/'),prefix='dm/'+thread+'/';
  if(request.method==='GET')return reply({...await list(b,prefix,60,url.searchParams.get('cursor')||undefined),person:target});
  const text=clean(input.text);if(!text)fail('Write a message first.');
  const profile=await meProfile(request,uid),sender={uid,username:profile.username?.stringValue||'',name:profile.name?.stringValue||''};
  if(!sender.username)fail('Set your BIG LWA username before sending.');
  const id=reverse(),message={id,uid,text,createdAt:Date.now()};await put(b,prefix+id+'.json',message);
  await Promise.all([put(b,own+'inbox/'+segment(target.uid)+'.json',{...target,updatedAt:message.createdAt}),put(b,'members/'+segment(target.uid)+'/inbox/'+segment(uid)+'.json',{...sender,updatedAt:message.createdAt})]);return reply({message});
 }
 if(path==='posts'){
  if(request.method==='GET'){const page=await list(b,'posts/',40,url.searchParams.get('cursor')||undefined);return reply({...page,items:page.items.filter(p=>p.visibility==='public')})}
  if(String(input.text||'').length>30000)fail('Long form supports up to 30,000 characters.');
  const text=clean(input.text,30000),kind=['sqwib','essay','photo','video','audio','live'].includes(input.kind)?input.kind:'sqwib';
  if(!text)fail('Write a caption or Sqwib first.');if(kind==='sqwib'&&text.length>1200)fail('Choose Long form for more than 1,200 characters.');
  let media=mediaURL(input.media),asset='';if(input.asset){asset=clean(input.asset,80);if(!/^[a-f0-9-]{36}$/.test(asset))fail('Invalid uploaded file.');const uploaded=await b.get(ROOT+own+'uploads/'+asset);if(!uploaded)fail('Upload the file with this account first.');const expected=kind==='photo'?'image/':kind==='audio'?'audio/':'video/';if(!uploaded.httpMetadata?.contentType?.startsWith(expected))fail('Choose the format that matches your file.');if(!['photo','video','audio'].includes(kind))fail('Choose Photo, Video or Audio for this file.')}if(['photo','video','audio','live'].includes(kind)&&!media&&!asset)fail('Add a media link.');
  const profile=await meProfile(request,uid),id='sz_'+reverse();
  if(asset)media=new URL('/social/post/'+id+'/media',request.url).href;
  const post={id,uid,asset,username:profile.username?.stringValue||'',name:profile.name?.stringValue||'',text,kind,media,portrait:input.portrait!==false,allowResqwib:input.allowResqwib===true,veve:input.veve===true,createdAt:Date.now(),visibility:'public'};
  if(!post.username)fail('Set your username before publishing.');await put(b,'posts/'+id+'.json',post);return reply({post});
 }
 if(path==='reshares')return reply(await list(b,'reshares/',100));
 if(path==='fish'){const saved=await list(b,own+'fish/',100);const items=(await Promise.all(saved.items.map(x=>sourcePost(b,x.id,request)))).filter(p=>p?.visibility==='public');return reply({items})}
 const match=/^post\/([A-Za-z0-9_-]{2,120})(?:\/(reply|float|ink|fish|resqwib|remove))?$/.exec(path);
 if(match){
  const id=match[1],action=match[2],p=await sourcePost(b,id,request);
  if(!p||p.visibility!=='public')fail('This Sqwib is unavailable.',404);
  if(!action){const [replies,reactions,mine,fish]=await Promise.all([list(b,'replies/'+id+'/',60),list(b,'reactions/'+id+'/',1000),get(b,'reactions/'+id+'/'+segment(uid)+'.json'),get(b,own+'fish/'+id+'.json')]);return reply({post:p,replies:replies.items,counts:{float:reactions.items.filter(x=>x.vote==='float').length,ink:reactions.items.filter(x=>x.vote==='ink').length,resqwib:reactions.items.filter(x=>x.resqwib).length},mine:{...mine,fish:!!fish}})}
  requirePost();
  if(action==='remove'){if(p.uid!==uid||!id.startsWith('sz_'))fail('Use the original author controls to withdraw this Sqwib.',403);await put(b,'posts/'+id+'.json',{...p,visibility:'private'});return reply({})}
  if(action==='reply'){const text=clean(input.text);if(!text)fail('Write your reply first.');const profile=await meProfile(request,uid),replyId=reverse();await put(b,'replies/'+id+'/'+replyId+'.json',{id:replyId,uid,username:profile.username?.stringValue||'',text,createdAt:Date.now()});return reply({})}
  if(action==='fish'){if(input.enabled===false)await b.delete(ROOT+own+'fish/'+id+'.json');else await put(b,own+'fish/'+id+'.json',{id,at:Date.now()});return reply({})}
  const key='reactions/'+id+'/'+segment(uid)+'.json',before=await b.get(ROOT+key),previous=before?await before.json():{};
  if(action==='resqwib'&&input.enabled!==false&&!p.allowResqwib)fail('The author disabled resqwibs.',403);
  const next={uid,vote:previous.vote||'',resqwib:previous.resqwib===true,at:Date.now()};if(action==='resqwib')next.resqwib=input.enabled!==false;else next.vote=input.enabled===false?'':action;
  const saved=await b.put(ROOT+key,JSON.stringify(next),{onlyIf:before?{etagMatches:before.etag}:{etagDoesNotMatch:'*'}});if(!saved)fail('Your reaction changed on another device. Try again.',409);
  if(action==='resqwib'){const index='reshares/'+segment(uid)+'_'+id+'.json';if(next.resqwib)await put(b,index,{uid,sourceId:id,createdAt:Date.now()});else await b.delete(ROOT+index)}
  return reply({mine:next});
 }
 fail('Not found.',404);
}
