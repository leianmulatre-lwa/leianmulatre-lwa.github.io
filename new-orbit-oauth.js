/* BIG LWA additional Orbit OAuth — X, Tumblr, Snapchat Login Kit.
 * Read-only profile authorization. Firebase session identifies the owner before
 * authorization; all tokens remain server-side in OAUTH_SESSIONS KV.
 * Callback is https://api.biglwa.com/{provider}/callback.
 */
const PROVIDERS={
 x:{id:'X_CLIENT_ID',secret:'X_CLIENT_SECRET',authorize:'https://twitter.com/i/oauth2/authorize',
    token:'https://api.x.com/2/oauth2/token',scope:'users.read tweet.read offline.access'},
 tumblr:{id:'TUMBLR_CONSUMER_KEY',secret:'TUMBLR_CONSUMER_SECRET',authorize:'https://www.tumblr.com/oauth2/authorize',
    token:'https://api.tumblr.com/v2/oauth2/token',scope:'basic offline_access'},
 snapchat:{id:'SNAPCHAT_CLIENT_ID',secret:'SNAPCHAT_CLIENT_SECRET',authorize:'https://accounts.snapchat.com/login/oauth2/authorize',
    token:'https://accounts.snapchat.com/login/oauth2/access_token',
    scope:'https://auth.snapchat.com/oauth2/api/user.display_name https://auth.snapchat.com/oauth2/api/user.bitmoji.avatar'}
};
const WORKER_ORIGIN='https://api.biglwa.com';
const FINISH_URL='https://biglwa.com/studio?view=orbit';
const SAFE_SITE=new Set(['https://biglwa.com','https://www.biglwa.com']);

function oaReply(body,status=200,request){
 const origin=request.headers.get('Origin')||'';
 const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Origin'};
 if(SAFE_SITE.has(origin)){
   headers['Access-Control-Allow-Origin']=origin;
   headers['Access-Control-Allow-Methods']='GET, POST, DELETE, OPTIONS';
   headers['Access-Control-Allow-Headers']='Authorization,Content-Type';
 }
 return new Response(JSON.stringify(body),{status,headers});
}
function oaError(message,status=400){const err=new Error(message);err.publicMessage=message;err.status=status;throw err}
function oaB64url(bytes){
 let str='';for(const b of bytes)str+=String.fromCharCode(b);
 return btoa(str).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function oaRandom(len=32){return oaB64url(crypto.getRandomValues(new Uint8Array(len)))}
async function oaChallenge(text){
 return oaB64url(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))));
}
function oaCallback(provider,env){
 const host=String(env.NEW_ORBIT_CALLBACK_ORIGIN||WORKER_ORIGIN).trim();
 if(!/^https:\/\/(?:api\.biglwa\.com|biglwa-instagram-api\.leianmulatre-284\.workers\.dev)$/.test(host))
   oaError('Orbit callback origin must be a trusted BIG LWA Worker hostname.',500);
 return host+'/'+provider+'/callback';
}
function oaRedirect(provider,status,error){
 const uri=new URL(FINISH_URL);
 uri.searchParams.set('orbit_provider',provider);
 uri.searchParams.set('orbit_status',status);
 if(error)uri.searchParams.set('orbit_error',String(error).slice(0,180));
 return new Response(null,{status:302,headers:{
  Location:uri.href,'Cache-Control':'no-store','Referrer-Policy':'no-referrer',
  'X-Content-Type-Options':'nosniff'
 }});
}
function oaConfigured(env,provider){
 const c=PROVIDERS[provider];
 return [c.id,c.secret,'OAUTH_SESSIONS'].filter(key=>!env[key]);
}
async function oaExchange(provider,code,verifier,env,callback){
 const c=PROVIDERS[provider],form=new URLSearchParams({
  grant_type:'authorization_code',code,client_id:String(env[c.id]),redirect_uri:callback
 });
 const headers={'Content-Type':'application/x-www-form-urlencoded'};
 if(provider==='x'){
  form.set('code_verifier',verifier);
  headers.Authorization='Basic '+btoa(env[c.id]+':'+env[c.secret]);
 }else if(provider==='tumblr'){
  form.set('client_secret',env[c.secret]);
 }else{
  headers.Authorization='Basic '+btoa(env[c.id]+':'+env[c.secret]);
 }
 const resp=await fetch(c.token,{method:'POST',headers,body:form});
 const result=await resp.json().catch(()=>({}));
 if(!resp.ok||!result.access_token)oaError(provider+' did not accept this authorization. Check its public client ID, callback and granted scopes.',502);
 return result;
}
function oaPhoto(url){
 try{const parsed=new URL(String(url||''));return parsed.protocol==='https:'?parsed.href:''}catch{return ''}
}
async function oaProfile(provider,token){
 const headers={Authorization:'Bearer '+token,'Accept':'application/json'};
 let endpoint,options={headers};
 if(provider==='x'){
  endpoint='https://api.x.com/2/users/me?user.fields=name,username,profile_image_url,public_metrics';
 }else if(provider==='tumblr'){
  endpoint='https://api.tumblr.com/v2/user/info';
 }else{
  endpoint='https://kit.snapchat.com/v1/me';
  options={method:'POST',headers:{...headers,'Content-Type':'application/json'},
   body:JSON.stringify({query:'query { me { externalId displayName bitmoji { avatar } } }'})};
 }
 const resp=await fetch(endpoint,options);
 const data=await resp.json().catch(()=>({}));
 if(!resp.ok)oaError(provider+' authorized, but its profile API could not be read. Confirm the app has the requested permissions.',502);
 if(provider==='x'){
   const u=data.data||{};
   if(!u.id||!u.username)oaError('X did not return an authorized profile.',502);
   return {id:'x',sourceUserId:String(u.id),name:String(u.name||u.username).slice(0,100),
    username:String(u.username).slice(0,80),avatarUrl:oaPhoto(u.profile_image_url),
    followers:Number(u.public_metrics?.followers_count)||0,
    link:'https://x.com/'+encodeURIComponent(u.username)};
 }
 if(provider==='tumblr'){
   const u=data.response?.user||{};
   if(!u.name)oaError('Tumblr did not return an authorized account.',502);
   const name=String(u.name).slice(0,80);
   const first=Array.isArray(u.blogs)?u.blogs.find(x=>x?.primary)||u.blogs[0]:null;
   const link=oaPhoto(first?.url)||('https://www.tumblr.com/'+encodeURIComponent(name));
   return {id:'tumblr',sourceUserId:name,username:name,name,avatarUrl:oaPhoto(first?.avatar_url),
    link};
 }
 const me=data.data?.me||data.data?.user||data.me||{};
 if(!me.externalId)oaError('Snapchat did not provide the requested Login Kit account identity.',502);
 const avatar=me.bitmoji?.avatar||me.bitmoji?.selfie||me.bitmojiAvatar||'';
 return {id:'snapchat',sourceUserId:String(me.externalId),name:String(me.displayName||'Snapchat account').slice(0,100),
  username:'',avatarUrl:oaPhoto(avatar),
  link:'https://www.snapchat.com/'};
}
export async function handleAdditionalOrbit(request,env,getFirebaseUser){
 const url=new URL(request.url),parts=url.pathname.split('/').filter(Boolean);
 const provider=parts[0],action=parts[1];
 if(!PROVIDERS[provider]||parts.length!==2)return oaReply({error:'Not found'},404,request);
 if(request.method==='OPTIONS'){
  const o=request.headers.get('Origin')||'';
  if(!SAFE_SITE.has(o))return new Response(null,{status:403});
  return new Response(null,{status:204,headers:{
   'Access-Control-Allow-Origin':o,'Access-Control-Allow-Methods':'GET, POST, DELETE, OPTIONS',
   'Access-Control-Allow-Headers':'Authorization,Content-Type','Cache-Control':'no-store','Vary':'Origin'
  }});
 }
 try{
  const c=PROVIDERS[provider];
  if(action==='health'&&request.method==='GET'){
   const missing=oaConfigured(env,provider);
   return oaReply({ok:missing.length===0,provider,configured:missing.length===0,missing,
    callback:oaCallback(provider,env)},200,request);
  }
  if(action==='callback'&&request.method==='GET'){
   const state=url.searchParams.get('state')||'';
   if(!/^[A-Za-z0-9_-]{32,100}$/.test(state))return oaRedirect(provider,'failed','Invalid authorization state.');
   const key='new-orbit:'+provider+':state:'+state;
   const saved=await env.OAUTH_SESSIONS.get(key,'json');
   if(saved)await env.OAUTH_SESSIONS.delete(key);
   if(!saved||Date.now()-saved.createdAt>600000)return oaRedirect(provider,'failed','Connection expired; retry from Orbit.');
   if(url.searchParams.get('error'))return oaRedirect(provider,'failed','Authorization cancelled.');
   const code=url.searchParams.get('code')||'';
   if(!code)return oaRedirect(provider,'failed','No authorization code received.');
   const result=await oaExchange(provider,code,saved.verifier||'',env,oaCallback(provider,env));
   const profile=await oaProfile(provider,result.access_token);
   await env.OAUTH_SESSIONS.put('new-orbit:'+provider+':account:'+saved.uid,JSON.stringify({
     profile,accessToken:result.access_token,refreshToken:result.refresh_token||'',
     expiresAt:Date.now()+Math.max(60,Number(result.expires_in)||3600)*1000,createdAt:Date.now()
   }),{expirationTtl:7776000});
   return oaRedirect(provider,'connected');
  }
  if(!['start','session','disconnect'].includes(action))return oaReply({error:'Not found'},404,request);
  if(action==='start'&&request.method!=='POST')return oaReply({error:'POST required'},405,request);
  if(action==='session'&&request.method!=='GET')return oaReply({error:'GET required'},405,request);
  if(action==='disconnect'&&request.method!=='POST')return oaReply({error:'POST required'},405,request);
  const user=await getFirebaseUser(request,env);
  if(!user?.uid)oaError('Sign in to BIG LWA before connecting.',401);
  const accountKey='new-orbit:'+provider+':account:'+user.uid;
  if(action==='session'){
   const saved=await env.OAUTH_SESSIONS.get(accountKey,'json');
   const fresh=Boolean(saved?.expiresAt&&saved.expiresAt>Date.now());
   return oaReply({connected:!!saved,needsReauth:!!saved&&!fresh,profile:saved?.profile||null},200,request);
  }
  if(action==='disconnect'){
   await env.OAUTH_SESSIONS.delete(accountKey);
   return oaReply({ok:true,connected:false},200,request);
  }
  const missing=oaConfigured(env,provider);
  if(missing.length)return oaReply({error:'Provider is not configured yet.',missing},503,request);
  const state=oaRandom(32),verifier=provider==='x'?oaRandom(48):'';
  const callback=oaCallback(provider,env);
  const auth=new URL(c.authorize);
  auth.searchParams.set('response_type','code');
  auth.searchParams.set('client_id',env[c.id]);
  auth.searchParams.set('redirect_uri',callback);
  auth.searchParams.set('scope',c.scope);
  auth.searchParams.set('state',state);
  if(provider==='x'){
   auth.searchParams.set('code_challenge_method','S256');
   auth.searchParams.set('code_challenge',await oaChallenge(verifier));
  }
  await env.OAUTH_SESSIONS.put('new-orbit:'+provider+':state:'+state,
   JSON.stringify({uid:user.uid,verifier,createdAt:Date.now()}),{expirationTtl:600});
  return oaReply({ok:true,authorizeUrl:auth.href,provider},200,request);
 }catch(error){
  if(action==='callback')return oaRedirect(provider,'failed',error.publicMessage||'Authorization failed; try again.');
  return oaReply({error:error.publicMessage||'Provider connection failed.',
    ...(error.status===503?{missing:oaConfigured(env,provider)}:{})},error.status||502,request);
 }
}
