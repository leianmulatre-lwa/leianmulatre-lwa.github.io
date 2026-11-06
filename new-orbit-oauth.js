/* BIG LWA additional Orbit OAuth — X, Tumblr, Snapchat Login Kit.
 * Read-only profile authorization. Firebase session identifies the owner before
 * authorization; all tokens remain server-side in OAUTH_SESSIONS KV.
 * Callback is https://api.biglwa.com/{provider}/callback.
 */
const PROVIDERS={
 x:{id:'X_CLIENT_ID',secret:'X_CLIENT_SECRET',authorize:'https://x.com/i/oauth2/authorize',
    token:'https://api.x.com/2/oauth2/token',scope:'users.read tweet.read offline.access'},
 tumblr:{id:'TUMBLR_CONSUMER_KEY',secret:'TUMBLR_CONSUMER_SECRET',authorize:'https://www.tumblr.com/oauth2/authorize',
    token:'https://api.tumblr.com/v2/oauth2/token',scope:'basic offline_access'},
 snapchat:{id:'SNAPCHAT_CLIENT_ID',secret:'SNAPCHAT_CLIENT_SECRET',authorize:'https://accounts.snapchat.com/accounts/oauth2/auth',
    token:'https://accounts.snapchat.com/accounts/oauth2/token',
    scope:'https://auth.snapchat.com/oauth2/api/user.external_id https://auth.snapchat.com/oauth2/api/user.display_name https://auth.snapchat.com/oauth2/api/user.bitmoji.avatar'}
};
const WORKER_ORIGIN='https://api.biglwa.com';
// Return directly to BIG LWA's canonical Studio entry point. The legacy /studio
// stub may strip query parameters, including the X callback result.
const FINISH_URL='https://biglwa.com/?route=studio&view=orbit';
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
 const host=String((provider==='x'?env.NEW_ORBIT_CALLBACK_ORIGIN:null)||WORKER_ORIGIN).trim();
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
// Classify X errors without reflecting raw error descriptions or secrets.
function oaXFailure(code,status=400,step='authorize'){
 const reason=String(code||'').toLowerCase();
 const hint=reason.includes('invalid_client')?'invalid_client: verify OAuth 2.0 Client ID, Client Secret and Web App type':
  reason.includes('redirect')?'redirect_uri_mismatch: register https://api.biglwa.com/x/callback exactly':
  reason.includes('invalid_scope')?'invalid_scope: check users.read, tweet.read, offline.access':
  reason.includes('invalid_grant')?'invalid_grant: code expired, reused, or PKCE verifier mismatch':
  reason.includes('access_denied')?'access_denied: member declined X access':
  reason.includes('unauthorized_client')?'unauthorized_client: check X OAuth 2.0 app settings':
  status===429?'rate_limited: retry after X rate limit':
  status===402?'api_access: check X API tier or available credits':
  status===401?'unauthorized: check X app credentials or token validity':
  'provider_error: check X OAuth app settings and API access';
 return 'X '+step+' failed (HTTP '+status+'): '+hint;
}
async function oaExchange(provider,code,verifier,env,callback){
 const c=PROVIDERS[provider],form=new URLSearchParams({
  grant_type:'authorization_code',code,redirect_uri:callback
 });
 // X's confidential-client flow authenticates with HTTP Basic, not a
 // duplicate client_id form credential. Public clients use client_id.
 if(provider!=='x')form.set('client_id',String(env[c.id]));
 const headers={'Content-Type':'application/x-www-form-urlencoded'};
 if(provider==='x'){
  form.set('code_verifier',verifier);
  headers.Authorization='Basic '+btoa(env[c.id]+':'+env[c.secret]);
 }else if(provider==='tumblr'){
  form.set('client_secret',env[c.secret]);
 }else{
  form.set('client_secret',env[c.secret]);
  form.set('code_verifier',verifier);
 }
 const resp=await fetch(c.token,{method:'POST',headers,body:form});
 const result=await resp.json().catch(()=>({}));
 if(!resp.ok||!result.access_token){
  const code=String(result.error||result.errors?.[0]?.code||result.title||'authorization_error');
  if(provider==='x')oaError(oaXFailure(code,resp.status,'token exchange'),502);
  oaError(provider+' OAuth token request failed (HTTP '+resp.status+', '+code.replace(/[^a-zA-Z0-9_.-]/g,'').slice(0,45)+'). Check registered callback and app credentials.',502);
 }
 return result;
}
// Refresh server-side OAuth access without asking the member to connect again.
async function oaRefreshSaved(provider,saved,env,key){
 if(!saved||!['x','tumblr'].includes(provider)||!saved.refreshToken||
    !saved.expiresAt||saved.expiresAt>Date.now()+60000)return saved;
 const conf=PROVIDERS[provider],form=new URLSearchParams({
  grant_type:'refresh_token',refresh_token:saved.refreshToken
 });
 if(provider!=='x')form.set('client_id',String(env[conf.id]));
 const headers={'Content-Type':'application/x-www-form-urlencoded'};
 if(provider==='x')headers.Authorization='Basic '+btoa(env[conf.id]+':'+env[conf.secret]);
 else form.set('client_secret',String(env[conf.secret]));
 try{
  const response=await fetch(conf.token,{method:'POST',headers,body:form});
  const result=await response.json().catch(()=>({}));
  if(!response.ok||!result.access_token)return saved;
  const next={...saved,accessToken:result.access_token,
   refreshToken:result.refresh_token||saved.refreshToken,
   expiresAt:Date.now()+Math.max(60,Number(result.expires_in)||2520)*1000};
  await env.OAUTH_SESSIONS.put(key,JSON.stringify(next),{expirationTtl:7776000});
  return next;
 }catch{return saved}
}
function oaPhoto(url){
 try{const parsed=new URL(String(url||''));return parsed.protocol==='https:'?parsed.href:''}catch{return ''}
}
async function oaProfile(provider,token){
 const headers={Authorization:'Bearer '+token,'Accept':'application/json',
  'User-Agent':'BIGLWA/1.0 (+https://biglwa.com; Tumblr OAuth integration)'};
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
 if(!resp.ok){
  if(provider==='x'){
   const error=String(data.title||data.error||data.errors?.[0]?.type||data.errors?.[0]?.code||'profile_error');
   oaError(oaXFailure(error,resp.status,'profile lookup'),502);
  }
  oaError(provider+' authorized, but its profile API could not be read. Confirm the app has the requested permissions.',502);
 }
 if(provider==='x'){
   const u=data.data||{};
   if(!u.id||!u.username)oaError('X did not return an authorized profile.',502);
   return {id:'x',sourceUserId:String(u.id),name:String(u.name||u.username).slice(0,100),
    username:String(u.username).slice(0,80),avatarUrl:oaPhoto(u.profile_image_url),
    followers:u.public_metrics?.followers_count!=null&&Number.isSafeInteger(Number(u.public_metrics.followers_count))&&Number(u.public_metrics.followers_count)>=0?Number(u.public_metrics.followers_count):null,
    link:'https://x.com/'+encodeURIComponent(u.username)};
 }
 if(provider==='tumblr'){
   const u=data.response?.user||{};
   if(!u.name)oaError('Tumblr did not return an authorized account.',502);
   // Tumblr account names and blog names can differ. Orbit should display
   // the *primary blog* and link its canonical public profile, not the
   // account identifier or a custom domain that the profile mirror rejects.
   const accountName=String(u.name).slice(0,80);
   const sourceBlogs=Array.isArray(u.blogs)?u.blogs:[];
   const blogs=sourceBlogs.filter(b=>/^[A-Za-z0-9-]{1,80}$/.test(String(b?.name||'')))
     .slice(0,30).map(b=>({
       name:String(b.name),title:String(b.title||b.name).slice(0,100),
       primary:!!b.primary,link:'https://www.tumblr.com/'+encodeURIComponent(b.name)
     }));
   const primary=blogs.find(b=>b.primary)||blogs[0];
   const blogName=primary?.name||accountName;
   const original=sourceBlogs.find(b=>b?.name===blogName)||{};
   return {id:'tumblr',sourceUserId:accountName,sourceBlogName:blogName,
     username:blogName,name:String(primary?.title||blogName).slice(0,100),
     avatarUrl:oaPhoto(original.avatar_url),link:'https://www.tumblr.com/'+encodeURIComponent(blogName),
     followers:original.followers!=null&&Number.isSafeInteger(Number(original.followers))&&Number(original.followers)>=0?Number(original.followers):null,
     likes:u.likes!=null&&Number.isSafeInteger(Number(u.likes))&&Number(u.likes)>=0?Number(u.likes):null,
     blogCount:blogs.length,blogs};
 }
 const me=data.data?.me||data.data?.user||data.me||{};
 if(!me.externalId)oaError('Snapchat did not provide the requested Login Kit account identity.',502);
 const avatar=me.bitmoji?.avatar||me.bitmoji?.selfie||me.bitmojiAvatar||'';
 // Some Snapchat accounts are allowed to expose a public profileLink.
 // This is an OPTIONAL second request: restricted GraphQL fields must never
 // make a valid Login Kit identity fail or masquerade displayName as username.
 let publicLink='',publicHandle='';
 try{
  const optional=await fetch('https://kit.snapchat.com/v1/me',{
   method:'POST',headers:{...headers,'Content-Type':'application/json'},
   body:JSON.stringify({query:'query { me { profileLink } }'})
  });
  if(optional.ok){
   const payload=await optional.json().catch(()=>({}));
   const uri=new URL(String(payload.data?.me?.profileLink||''));
   const host=uri.hostname.toLowerCase().replace(/^www\./,'');
   const match=uri.pathname.match(/^\/(?:add\/@?|@)([A-Za-z0-9._]{2,40})\/?$/);
   if(uri.protocol==='https:'&&['snapchat.com','story.snapchat.com'].includes(host)&&match){
    publicHandle=match[1];publicLink='https://www.snapchat.com/add/'+publicHandle;
   }
  }
 }catch{} // Ordinary accounts may not have profileLink access.
 return {id:'snapchat',sourceUserId:String(me.externalId),name:String(me.displayName||'Snapchat account').slice(0,100),
  username:publicHandle,avatarUrl:oaPhoto(avatar),link:publicLink};
}
export 
// Read-only import preview: API tokens stay in the Worker KV store.
// No imported text is published until the member selects it inside Sqwibz.
async function oaTextImports(provider,saved,env){
 if(!saved?.accessToken)oaError('Connect this account in Orbit before importing.',401);
 if(!saved.expiresAt||saved.expiresAt<=Date.now())
   oaError('This Orbit authorization expired. Reconnect the account.',401);
 if(!['x','tumblr'].includes(provider))
   oaError('This provider does not offer Sqwibz text imports.',422);
 const headers={Authorization:'Bearer '+saved.accessToken,Accept:'application/json',
  'User-Agent':'BIGLWA/1.0 (+https://biglwa.com; Tumblr OAuth integration)'};
 let uri;
 if(provider==='x'){
   if(saved.scopes&&!String(saved.scopes).split(/\s+/).includes('tweet.read'))
    oaError('X is connected for profile-only diagnostics. Reconnect with full X permissions to import posts.',403);
   const id=String(saved.profile?.sourceUserId||'');
   if(!/^\d{1,28}$/.test(id))oaError('X account identifier is missing. Reconnect X.',422);
   uri=new URL('https://api.x.com/2/users/'+id+'/tweets');
   uri.searchParams.set('max_results','30');
   uri.searchParams.set('exclude','retweets');
   uri.searchParams.set('tweet.fields','created_at');
 }else{
   const raw=String(saved.profile?.sourceBlogName||saved.profile?.username||'').trim();
   if(!/^[a-zA-Z0-9-]{1,80}$/.test(raw))oaError('Tumblr blog name missing. Reconnect Tumblr.',422);
   uri=new URL('https://api.tumblr.com/v2/blog/'+encodeURIComponent(raw)+'.tumblr.com/posts');
   uri.searchParams.set('limit','20');uri.searchParams.set('npf','true');
   // Tumblr documents API-key authorization for blog posts; keep key server-side.
   if(env.TUMBLR_CONSUMER_KEY)uri.searchParams.set('api_key',String(env.TUMBLR_CONSUMER_KEY));
 }
 const response=await fetch(uri.toString(),{headers});
 if(!response.ok){
   if(response.status===401||response.status===403)oaError(
     provider+' denied reading posts. Check your app authorization or API access.',response.status);
   if(response.status===402||response.status===429)oaError(
     provider+' API access or usage limit prevented imports.',response.status);
   oaError(provider+' posts are unavailable ('+response.status+').',502);
 }
 const data=await response.json().catch(()=>({}));
 const clean=v=>String(v||'').replace(/<[^>]*>/g,' ').replace(/&(?:amp|lt|gt|quot|#39);/g,' ').replace(/\s+/g,' ').trim().slice(0,1200);
 let items=[];
 if(provider==='x'){
   items=(Array.isArray(data.data)?data.data:[]).filter(x=>(x?.id_string||x?.id)&&x?.text).map(x=>({
     id:String(x.id),provider,text:clean(x.text),createdAt:x.created_at||'',
     url:'https://x.com/'+encodeURIComponent(saved.profile?.username||'i')+'/status/'+encodeURIComponent(String(x.id))
   }));
 }else{
   items=(Array.isArray(data.response?.posts)?data.response.posts:[]).filter(x=>x?.id&&['text','quote','blocks'].includes(x.type)).map(x=>{
     const blocks=Array.isArray(x.content)?x.content.filter(b=>b?.type==='text').map(b=>b.text):[];
     const isText=blocks.length>0||x.type==='text'||x.type==='quote';
     if(!isText)return null;
     const text=clean(blocks.join('\n')||[x.title,x.text,x.body,x.quote,x.source].filter(Boolean).join(' '));
     if(!text)return null;
     let url='';
     try{const parsed=new URL(String(x.post_url||''));if(parsed.protocol==='https:')url=parsed.href}catch{}
     return {id:String(x.id_string||x.id),provider,text,createdAt:x.date||'',url};
   }).filter(Boolean);
 }
 return {provider,count:items.length,items:items.slice(0,30)};
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
   if(url.searchParams.get('error'))return oaRedirect(provider,'failed',
    provider==='x'?oaXFailure(url.searchParams.get('error'),400,'authorization'):'Authorization cancelled.');
   const code=url.searchParams.get('code')||'';
   if(!code)return oaRedirect(provider,'failed','No authorization code received.');
   const result=await oaExchange(provider,code,saved.verifier||'',env,oaCallback(provider,env));
   const profile=await oaProfile(provider,result.access_token);
   await env.OAUTH_SESSIONS.put('new-orbit:'+provider+':account:'+saved.uid,JSON.stringify({
     profile,scopes:saved.scopes||PROVIDERS[provider].scope,accessToken:result.access_token,refreshToken:result.refresh_token||'',
     expiresAt:Date.now()+Math.max(60,Number(result.expires_in)||3600)*1000,createdAt:Date.now()
   }),{expirationTtl:7776000});
   return oaRedirect(provider,'connected');
  }
  if(!['start','session','disconnect','imports','public-post'].includes(action))return oaReply({error:'Not found'},404,request);
  if(action==='start'&&request.method!=='POST')return oaReply({error:'POST required'},405,request);
  if(action==='session'&&request.method!=='GET')return oaReply({error:'GET required'},405,request);
  if(action==='imports'&&request.method!=='GET')return oaReply({error:'GET required'},405,request);
  if(action==='disconnect'&&request.method!=='POST')return oaReply({error:'POST required'},405,request);
  const user=await getFirebaseUser(request,env);
  if(!user?.uid)oaError('Sign in to BIG LWA before connecting.',401);
  // A public post can be saved as an attributed Sqwidz import even when X
  // OAuth is temporarily unavailable. This is opt-in, not timeline scraping.
  if(action==='public-post'&&provider==='x'&&request.method==='GET'){
   const raw=url.searchParams.get('url')||'';
   let post;
   try{post=new URL(raw)}catch{oaError('Paste a complete public X post URL.',422)}
   const match=post.pathname.match(/^\/([A-Za-z0-9_]{1,15})\/status\/(\d{8,25})\/?$/);
   if(post.protocol!=='https:'||!['x.com','www.x.com','twitter.com','www.twitter.com'].includes(post.hostname)||post.port||!match)
     oaError('Use a public x.com/username/status/123... post URL.',422);
   const canonical='https://x.com/'+match[1]+'/status/'+match[2];
   const endpoint='https://publish.twitter.com/oembed?omit_script=true&url='+encodeURIComponent(canonical);
   let response;
   try{response=await fetch(endpoint,{headers:{Accept:'application/json'},redirect:'error'})}
   catch{oaError('X public post metadata is temporarily unavailable.',502)}
   if(!response.ok)oaError('X cannot embed this post. It may be private, unavailable or removed.',response.status===404?404:502);
   const data=await response.json().catch(()=>({}));
   const paragraph=String(data.html||'').match(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/i)?.[1]||'';
   const text=paragraph.replace(/<br\s*\/?\s*>/gi,' ').replace(/<[^>]*>/g,' ')
     .replace(/&(?:amp|lt|gt|quot|apos|#39);/g,' ').replace(/&#(\d+);/g,(_,n)=>{
       const code=Number(n);return code>=32&&code<=0x10ffff?String.fromCodePoint(code):' ';
     }).replace(/\s+/g,' ').trim().slice(0,1200);
   if(!text)oaError('X did not provide readable text for this public post.',422);
   return oaReply({provider:'x',count:1,publicLink:true,items:[{
     id:match[2],provider:'x',text,url:canonical,createdAt:'',
     authorName:String(data.author_name||match[1]).slice(0,100)
   }]},200,request);
  }

  const accountKey='new-orbit:'+provider+':account:'+user.uid;
  if(action==='session'){
   const saved=await oaRefreshSaved(provider,await env.OAUTH_SESSIONS.get(accountKey,'json'),env,accountKey);
   const fresh=Boolean(saved?.expiresAt&&saved.expiresAt>Date.now());
   return oaReply({connected:!!saved,needsReauth:!!saved&&!fresh,profile:saved?.profile||null,
    scopes:saved?.scopes||PROVIDERS[provider].scope},200,request);
  }
  if(action==='imports'){
    const saved=await oaRefreshSaved(provider,await env.OAUTH_SESSIONS.get(accountKey,'json'),env,accountKey);
    if(!saved)return oaReply({error:'Connect '+provider+' from Orbit before importing posts.'},401,request);
    const result=await oaTextImports(provider,saved,env);
    return oaReply(result,200,request);
  }
  if(action==='disconnect'){
   await env.OAUTH_SESSIONS.delete(accountKey);
   return oaReply({ok:true,connected:false},200,request);
  }
  const missing=oaConfigured(env,provider);
  if(missing.length)return oaReply({error:'Provider is not configured yet.',missing},503,request);
  // The optional reduced-scope X test isolates failures at the X consent
  // screen. It never changes normal full Connect X behavior.
  const probe=provider==='x'?await request.clone().json().catch(()=>({})):{};
  const profileOnly=probe?.mode==='profile-only';
  if(provider==='x'&&probe?.mode&&!['profile-only','full'].includes(probe.mode))
   return oaReply({error:'Invalid X authorization mode.'},422,request);
  const requestedScopes=profileOnly?'users.read':c.scope;
  const state=oaRandom(32),verifier=['x','snapchat'].includes(provider)?oaRandom(48):'';
  const callback=oaCallback(provider,env);
  const auth=new URL(c.authorize);
  auth.searchParams.set('response_type','code');
  auth.searchParams.set('client_id',env[c.id]);
  auth.searchParams.set('redirect_uri',callback);
  auth.searchParams.set('scope',requestedScopes);
  auth.searchParams.set('state',state);
  if(['x','snapchat'].includes(provider)){
   auth.searchParams.set('code_challenge_method','S256');
   auth.searchParams.set('code_challenge',await oaChallenge(verifier));
  }
  await env.OAUTH_SESSIONS.put('new-orbit:'+provider+':state:'+state,
   JSON.stringify({uid:user.uid,verifier,scopes:requestedScopes,createdAt:Date.now()}),{expirationTtl:600});
  // X documents OAuth scopes with RFC3986 %20 separators. URLSearchParams
  // emits form-style '+'; use explicit percent encoding for X authorization.
  const authorizeUrl=provider==='x'
    ?auth.href.replace(/([?&]scope=)[^&]*/,(_,head)=>head+encodeURIComponent(requestedScopes))
    :auth.href;
  return oaReply({ok:true,authorizeUrl,provider,scopeMode:profileOnly?'profile-only':'full'},200,request);
 }catch(error){
  if(action==='callback')return oaRedirect(provider,'failed',error.publicMessage||'Authorization failed; try again.');
  return oaReply({error:error.publicMessage||'Provider connection failed.',
    ...(error.status===503?{missing:oaConfigured(env,provider)}:{})},error.status||502,request);
 }
}
