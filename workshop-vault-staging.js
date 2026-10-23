/* BIG LWA isolated Workshop staging Worker.
 * No social OAuth, no production Worker replacement, no access to production R2.
 * The private vault implementation is copied from the tested main API revision.
 * R2 binding must point ONLY to the isolated biglwa-preview-media bucket.
 */
export default {
 async fetch(request, env) {
  try {
   const pathname=new URL(request.url).pathname;
   if(request.method==='OPTIONS') return corsPreflight(request,env);
   if(pathname==='/health'||pathname==='/') return json({ok:true,environment:'workshop-staging',socialLoginEnabled:false,productionStorage:false},200,request,env);
   if(!pathname.startsWith('/media/workshop-projects')) return json({error:'Not found'},404,request,env);
   return await workshopProjectRoute(request,env);
  } catch(error) {
   return json({error:error.publicMessage||'Staging project storage error.'},error.status||500,request,env);
  }
 }
};

function randomToken(size) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

function bytesToBase64Url(bytes) {
  let value = '';
  bytes.forEach((byte) => { value += String.fromCharCode(byte); });
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}



function allowedOrigin(request, env) {
  const origin = request.headers.get('Origin') || '';
  const siteOrigin = new URL(env.SITE_URL).origin;
  // Both official first-party domains are legitimate; the OAuth callback
  // returns to the same one that held the browser's PKCE verifier.
  const trusted = new Set([siteOrigin, 'https://biglwa.com', 'https://www.biglwa.com']);
  return trusted.has(origin) ? origin : '';
}

function requireOrigin(request, env) {
  if (!allowedOrigin(request, env)) throw new Error('Origin not allowed.');
}

function corsPreflight(request, env) {
  const origin = allowedOrigin(request, env);
  if (!origin) return new Response(null, { status: 403 });
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

function json(body, status, request, env) {
  const origin = allowedOrigin(request, env);
  const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
  if (origin) Object.assign(headers, corsHeaders(origin));
  return new Response(JSON.stringify(body), { status, headers });
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Instagram-Session, X-Pinterest-Session, X-Orbit-Provider',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Vary': 'Origin'
  };
}



function mediaFail(message, status = 400) { const error = new Error(message); error.publicMessage = message; error.status = status; throw error; }



function mediaBucket(env) {
  const bucket = env.WALLPAPER_BUCKET || env.MEDIA_BUCKET || env.R2_BUCKET;
  if (!bucket) mediaFail('Media storage is not configured on this Worker yet.', 503);
  return bucket;
}



async function mediaUser(request, env) {
  const header = request.headers.get('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) mediaFail('Sign in to use account media.', 401);
  const apiKey = String(env.FIREBASE_API_KEY || 'AIzaSyAPUT8_pLNxdh5tbGpAmXBJiID3jVcA9DY').trim();
  const response = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + encodeURIComponent(apiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: token })
  });
  if (!response.ok) mediaFail('Your session expired. Sign in again to use account media.', 401);
  const payload = await response.json().catch(() => ({}));
  const info = Array.isArray(payload.users) ? payload.users[0] : null;
  const projectId = String(env.FIREBASE_PROJECT_ID || 'biglwa').trim();
  if (!info || !String(info.localId || '').trim()) mediaFail('That sign-in is not from this account system.', 403);
  if (projectId !== 'biglwa') mediaFail('That sign-in is not from this account system.', 403);
  const uid = String(info.localId || '').trim();
  if (info.disabled === true) mediaFail('That account cannot store media.', 403);
  if (info.emailVerified === false) mediaFail('Verify your email before saving account media.', 403);
  return { uid, email: String(info.email || '') };
}



/* BIG LWA Workshop native project vault (R2, owner-only).
 * Stores the ORIGINAL binary export, not a flattened image or Firestore blob.
 * Every request resolves Firebase identity independently; client-supplied UIDs,
 * paths and filenames never determine R2 ownership. Binary downloads are
 * attachment-only and cannot be accessed by public media routes.
 *
 * 8 MiB multipart pieces keep browser requests below edge upload limits.
 * The server validates expected piece lengths and finished object size.
 * Staged uploads are not listed as projects. A cancellation endpoint aborts
 * an incomplete R2 multipart upload; abandoned sessions can be cleaned
 * separately after their expiry (they cannot be accessed by other users).
 */
const WORKSHOP_PROJECT_CHUNK=8*1024*1024;
const WORKSHOP_PROJECT_MAX=25*1024*1024;
const WORKSHOP_PROJECT_LIMIT=8;
const WORKSHOP_PROJECT_APPS=new Set(['sqwibblR','lightR','paintR','keyframeR','fileR','other']);
function workshopId(raw){return /^[A-Za-z0-9_-]{22}$/.test(raw||'')?raw:'';}
function workshopProjectName(value){
  return String(value||'Untitled project').replace(/[\x00-\x1f\x7f<>:"/\\|?*]/g,'_').trim().slice(0,160)||'Untitled project';
}
function workshopProjectPrefix(uid){return 'workshop-projects/'+uid+'/';}
function workshopProjectSummary(data){
  return {id:data.id,name:data.name,app:data.app,size:data.size,
    createdAt:data.createdAt,contentType:'application/octet-stream'};
}
async function workshopProjectRoute(request,env){
  const url=new URL(request.url),root='/media/workshop-projects';
  const pieces=url.pathname.slice(root.length).split('/').filter(Boolean);
  const method=request.method;
  if(['POST','PUT','DELETE'].includes(method)&&!allowedOrigin(request,env))
    mediaFail('Origin not allowed.',403);
  // GET, including project LIST, must authenticate. No anonymous metadata.
  const user=await mediaUser(request,env),bucket=mediaBucket(env);
  const prefix=workshopProjectPrefix(user.uid);
  const id=pieces.length?workshopId(pieces[0]):'';
  if(pieces.length&&!id)mediaFail('Project not found.',404);
  const projectKey=id?prefix+id+'.bin':'';
  const uploadKey=id?prefix+id+'.upload.json':'';
  const metaKey=id?prefix+id+'.meta.json':'';
  if(!pieces.length&&method==='GET'){
    const listing=await bucket.list({prefix,limit:1000});
    const keys=(listing.objects||[]).map(o=>o.key).filter(k=>k.endsWith('.meta.json')).slice(0,WORKSHOP_PROJECT_LIMIT);
    const rows=await Promise.all(keys.map(async key=>{
      const object=await bucket.get(key);
      if(!object)return null;
      const data=await object.json().catch(()=>null);
      return data&&workshopId(data.id)?workshopProjectSummary(data):null;
    }));
    return json({ok:true,projects:rows.filter(Boolean).sort((a,b)=>b.createdAt-a.createdAt),
      truncated:!!listing.truncated},200,request,env);
  }
  if(!pieces.length&&method==='POST'){
    const data=await request.json().catch(()=>null);
    if(!data||typeof data!=='object')mediaFail('Provide project name, editor, and file size.',400);
    const name=workshopProjectName(data.name),app=String(data.app||'other');
    const size=Number(data.size);
    if(!WORKSHOP_PROJECT_APPS.has(app))mediaFail('Choose a recognized BIG LWA editor.',400);
    if(!Number.isSafeInteger(size)||size<1||size>WORKSHOP_PROJECT_MAX)
      mediaFail('A project must be between 1 byte and 500 MB.',413);
    const listed=await bucket.list({prefix,limit:1000});
    const objects=listed.objects||[];
    if(objects.filter(o=>o.key.endsWith('.meta.json')).length>=WORKSHOP_PROJECT_LIMIT)
      mediaFail('This account has reached its project shelf capacity.',413);
    // Multipart uploads do not count as finished projects, but must still be
    // bounded or a client can create unlimited abandoned R2 sessions.
    let pending=0;
    for(const entry of objects.filter(o=>o.key.endsWith('.upload.json'))){
      const stateObject=await bucket.get(entry.key);
      const state=await stateObject?.json().catch(()=>null);
      if(!state||!workshopId(state.id)||!state.uploadId){
        continue; // Do not automatically delete incomplete or unfamiliar state.
      }
      const expired=Date.now()-Number(state.createdAt)>24*60*60*1000;
      if(expired){
        try{
          await bucket.resumeMultipartUpload(prefix+state.id+'.bin',state.uploadId).abort();
          await bucket.delete(entry.key);
        }catch{
          // Do not silently discard orphaned or unverified sessions.
          pending++;
        }
      }else pending++;
    }
    if(pending>=3)mediaFail('Finish or cancel an existing project upload before starting another.',429);
    const newId=randomToken(16),newKey=prefix+newId+'.bin',createdAt=Date.now();
    const upload=await bucket.createMultipartUpload(newKey,{
      httpMetadata:{contentType:'application/octet-stream',cacheControl:'private, no-store'},
      customMetadata:{uid:user.uid,app,createdAt:String(createdAt)}
    });
    const state={id:newId,uploadId:upload.uploadId,name,app,size,createdAt,
      partCount:Math.ceil(size/WORKSHOP_PROJECT_CHUNK)};
    await bucket.put(prefix+newId+'.upload.json',JSON.stringify(state),{
      httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'}
    });
    return json({ok:true,id:newId,partCount:state.partCount,chunkSize:WORKSHOP_PROJECT_CHUNK,
      maxBytes:WORKSHOP_PROJECT_MAX},201,request,env);
  }
  if(id&&pieces.length===3&&pieces[1]==='part'&&method==='PUT'){
    const stateObj=await bucket.get(uploadKey);
    if(!stateObj)mediaFail('Upload session not found or already finalized.',404);
    const state=await stateObj.json();
    if(Date.now()-state.createdAt>24*60*60*1000)mediaFail('Upload session expired; create a new upload.',410);
    const part=Number(pieces[2]);
    if(!Number.isSafeInteger(part)||part<1||part>state.partCount)mediaFail('Invalid project part number.',400);
    const expected=part<state.partCount?WORKSHOP_PROJECT_CHUNK:
      state.size-WORKSHOP_PROJECT_CHUNK*(state.partCount-1);
    const length=Number(request.headers.get('Content-Length')||0);
    if(length&&length!==expected)mediaFail('Chunk length does not match the expected file section.',400);
    if(!request.body)mediaFail('Upload part is empty.',400);
    // Consume at most 8 MiB per request, never the full 500 MB native project.
    const bytes=await request.arrayBuffer();
    if(bytes.byteLength!==expected)mediaFail('Chunk length does not match the expected file section.',400);
    const upload=bucket.resumeMultipartUpload(projectKey,state.uploadId);
    const uploaded=await upload.uploadPart(part,bytes);
    return json({ok:true,id,partNumber:uploaded.partNumber,etag:uploaded.etag},200,request,env);
  }
  if(id&&pieces.length===2&&pieces[1]==='complete'&&method==='POST'){
    const stateObj=await bucket.get(uploadKey);
    if(!stateObj)mediaFail('Upload session not found.',404);
    const state=await stateObj.json(),data=await request.json().catch(()=>({}));
    const parts=Array.isArray(data.parts)?data.parts:[];
    if(parts.length!==state.partCount)mediaFail('Upload is missing project sections.',400);
    const uploadedParts=parts.map((part,i)=>{
      if(part?.partNumber!==i+1||typeof part.etag!=='string'||!/^[a-zA-Z0-9_"-]{1,128}$/.test(part.etag))
        mediaFail('Invalid project section receipt.',400);
      return {partNumber:i+1,etag:part.etag};
    });
    const upload=bucket.resumeMultipartUpload(projectKey,state.uploadId);
    const object=await upload.complete(uploadedParts);
    if(object.size!==state.size){
      await bucket.delete(projectKey);
      mediaFail('Project size verification failed. The incomplete copy was discarded.',422);
    }
    const record={id,name:state.name,app:state.app,size:object.size,createdAt:state.createdAt};
    await bucket.put(metaKey,JSON.stringify(record),{
      httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'}
    });
    await bucket.delete(uploadKey);
    return json({ok:true,project:workshopProjectSummary(record)},201,request,env);
  }
  if(id&&pieces.length===2&&pieces[1]==='upload'&&method==='DELETE'){
    const stateObj=await bucket.get(uploadKey);
    if(!stateObj)mediaFail('Upload session not found.',404);
    const state=await stateObj.json();
    await bucket.resumeMultipartUpload(projectKey,state.uploadId).abort();
    await bucket.delete(uploadKey);
    return json({ok:true},200,request,env);
  }
  if(id&&pieces.length===1&&method==='GET'){
    const meta=await bucket.get(metaKey);
    if(!meta)mediaFail('Project not found.',404);
    const data=await meta.json();
    const object=await bucket.get(projectKey);
    if(!object)mediaFail('Project file is missing.',404);
    const headers=new Headers({
      'Content-Type':'application/octet-stream',
      'Content-Disposition':"attachment; filename*=UTF-8''"+encodeURIComponent(workshopProjectName(data.name)),
      'Cache-Control':'private, no-store',
      'X-Content-Type-Options':'nosniff',
      'Content-Security-Policy':"default-src 'none'",
      'Content-Length':String(object.size)
    });
    const origin=allowedOrigin(request,env);
    if(origin)Object.entries(corsHeaders(origin)).forEach(([key,value])=>headers.set(key,value));
    return new Response(object.body,{status:200,headers});
  }
  if(id&&pieces.length===1&&method==='DELETE'){
    if(!await bucket.get(metaKey))mediaFail('Project not found.',404);
    await bucket.delete([metaKey,projectKey]);
    return json({ok:true},200,request,env);
  }
  mediaFail('Unsupported Workshop project action.',405);
}

