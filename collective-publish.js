/* BIGLWA Studio -> Collective Feed
 * Every upload starts as a private Firestore draft. The member explicitly posts it from Feed.
 *
 * This file used to write /posts and users/{uid}/posts itself and stop there, so anything
 * created here never reached the Archive and the owner fields came from
 * window.__biglwaIdentity, which is empty on a cold load and produced cards with no
 * attributable owner. Both writes now go through orbit-posts.js, which owns the definition
 * of a post write and keeps the canonical record and the per-owner indexes in one batch.
 */
const FIREBASE_CONFIG={apiKey:"AIzaSyAPUT8_pLNxdh5tbGpAmXBJiID3jVcA9DY",authDomain:"biglwa.firebaseapp.com",projectId:"biglwa",appId:"1:83232670555:web:e04927b20458390b3b507e"};
const WORKER="https://biglwa-instagram-api.leianmulatre-284.workers.dev";
let refs;
async function firebase(){if(!refs){const [{initializeApp,getApps},store,{getAuth}]=await Promise.all([import("https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js"),import("https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js"),import("https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js")]);const app=getApps()[0]||initializeApp(FIREBASE_CONFIG);refs={auth:getAuth(app),db:store.getFirestore(app),doc:store.doc,setDoc:store.setDoc,serverTimestamp:store.serverTimestamp};}return refs}
const clean=v=>String(v==null?"":v).trim();

/* orbit-posts.js is a separate module instance, reached through the handle it publishes.
   Wait briefly rather than assuming document order, then fail loudly instead of silently
   writing a second, divergent copy of the post. */
async function postWriter(){
  for(let i=0;i<60;i++){
    const writer=window.__biglwaOrbitPosts?.savePostRecords;
    if(typeof writer==="function") return writer;
    await new Promise(r=>setTimeout(r,50));
  }
  throw new Error("The feed is still loading. Try again in a moment.");
}

async function uploadBlob(blob){if(!(blob instanceof Blob)||!blob.size)throw new Error("Choose or capture an image first.");const {auth}=await firebase(),user=auth.currentUser;if(!user)throw new Error("Sign in before uploading to the collective feed.");const token=await user.getIdToken();const type=clean(blob.type)||"image/jpeg";const res=await fetch(WORKER+"/media/feed-image",{method:"POST",headers:{"Authorization":"Bearer "+token,"Content-Type":type},body:blob});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.error||"The image could not be uploaded.");return data}
/* A social network may block automated previews. Keep its original user
 * link usable without claiming that BIG LWA copied or verified the content.
 * Unknown domains still use the existing guarded Worker and fail normally. */
function knownSocialProvider(host){
 const pairs=[
  ['instagram',['instagram.com']],['tiktok',['tiktok.com']],
  ['snapchat',['snapchat.com']],['facebook',['facebook.com','fb.watch']],
  ['pinterest',['pinterest.com','pin.it']],['x',['x.com','twitter.com']],
  ['tumblr',['tumblr.com']],['youtube',['youtube.com','youtu.be']],
  ['spotify',['spotify.com']],['soundcloud',['soundcloud.com']],
  ['twitch',['twitch.tv']],['goodreads',['goodreads.com']],
  ['letterboxd',['letterboxd.com']],['depop',['depop.com']],
  ['imdb',['imdb.com']],['vsco',['vsco.co']],['bereal',['bere.al']],
  ['threads',['threads.net']],['discord',['discord.com','discord.gg']],
  ['reddit',['reddit.com']],['bandcamp',['bandcamp.com']],
  ['drive',['drive.google.com','docs.google.com']],['calendar',['calendar.google.com']],
  ['google',['google.com']],['substack',['substack.com']],
  ['xbox',['xbox.com','xboxlive.com']],['whatsapp',['whatsapp.com','wa.me']],
  ['telegram',['telegram.org','t.me']],['vimeo',['vimeo.com']]
 ];
 return pairs.find(([,hosts])=>hosts.some(domain=>host===domain||host.endsWith('.'+domain)))?.[0]||'';
}
async function linkPreview(url){
 const value=clean(url);
 if(!/^https:\/\//i.test(value))throw new Error('Use a full HTTPS link.');
 const parsed=new URL(value);
 if(parsed.username||parsed.password||parsed.port)throw new Error('Links containing credentials or custom ports are not supported.');
 const host=parsed.hostname.toLowerCase();
 if(host==='localhost'||host.endsWith('.localhost')||host.endsWith('.local')||
    /^(127\.|10\.|192\.168\.|169\.254\.)/.test(host)||host==='::1'||host==='0.0.0.0')
   throw new Error('That link cannot be previewed.');
 const provider=knownSocialProvider(host);
 try{
  const {auth}=await firebase();
  if(!auth.currentUser)throw new Error('Sign in before importing a link.');
  const res=await fetch(WORKER+'/media/link-preview',{method:'POST',
   headers:{'Content-Type':'application/json','Authorization':'Bearer '+(await auth.currentUser.getIdToken())},
   body:JSON.stringify({url:value})});
  const data=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error(data.error||'The link preview could not be loaded.');
  return {...data,provider:provider||''};
 }catch(error){
  if(!provider)throw error;
  // Source link is still useful even when its OG image is blocked.
  return {url:value,title:provider.charAt(0).toUpperCase()+provider.slice(1)+' link',
    imageUrl:'',siteName:host,provider,previewUnavailable:true};
 }
}


async function createFeedDraft({url,blob,caption}={}){const {auth,serverTimestamp}=await firebase();const user=auth.currentUser;if(!user)throw new Error("Sign in to post to the collective feed.");const identity=window.__biglwaIdentity||{};const link=clean(url);if(!link&&!blob)throw new Error("Add a link or choose a photo.");let preview=null;if(link)preview=await linkPreview(link);let imageUrl="",imageKey=null;if(blob){const uploaded=await uploadBlob(blob);imageUrl=uploaded.url||"";imageKey=uploaded.key||null;}const id="feed_"+crypto.randomUUID().replace(/-/g,"");const now=Date.now();const data={uid:user.uid,username:clean(identity.username),usernameLower:clean(identity.usernameLower||identity.username).replace(/^@/,"").toLowerCase(),authorName:clean(identity.name||identity.username||user.displayName||""),caption:clean(caption).slice(0,500),imageUrl:imageUrl||preview?.imageUrl||null,imageKey:imageKey||null,imageUrls:(imageUrl?[imageUrl]:preview?.imageUrl?[preview.imageUrl]:[]),imageKeys:imageKey?[imageKey]:[],mediaItems:imageUrl?[{index:0,url:imageUrl,key:imageKey||null}]:[],source:"biglwa",sourcePostId:id,sourceUrl:link||null,thumbnailUrl:preview?.imageUrl||imageUrl||null,linkTitle:preview?.title||"",mediaType:imageUrl||preview?.imageUrl?"IMAGE":"LINK",orbitImported:false,studioImported:false,state:"draft",archiveState:"saved",sourceCreatedAtMs:now,createdAt:serverTimestamp(),updatedAt:serverTimestamp()};const saved=await (await postWriter())(user.uid,id,data,{archiveState:"saved"});return {id,...saved}}

async function createStudioDraft({source,title,caption,blob,sourceUrl}={}){const {auth,serverTimestamp}=await firebase();const user=auth.currentUser;if(!user)throw new Error("Sign in to upload to the collective feed.");const identity=window.__biglwaIdentity||{};let imageUrl="",imageKey=null;if(blob){const uploaded=await uploadBlob(blob);imageUrl=uploaded.url||"";imageKey=uploaded.key||null;}const id="studio_"+crypto.randomUUID().replace(/-/g,"");const now=Date.now();const data={uid:user.uid,username:clean(identity.username),usernameLower:clean(identity.usernameLower||identity.username).replace(/^@/,"").toLowerCase(),authorName:clean(identity.name||identity.username||user.displayName||""),caption:clean(caption),imageUrl:imageUrl||null,imageKey:imageKey||null,imageUrls:imageUrl?[imageUrl]:[],imageKeys:imageKey?[imageKey]:[],mediaItems:imageUrl?[{index:0,url:imageUrl,key:imageKey||null}]:[],source:clean(source||"studio").toLowerCase(),sourcePostId:id,sourceUrl:clean(sourceUrl)||null,linkTitle:clean(title)||"",mediaType:imageUrl?"IMAGE":"TEXT",orbitImported:false,studioImported:true,state:"draft",archiveState:"saved",sourceCreatedAtMs:now,createdAt:serverTimestamp(),updatedAt:serverTimestamp()};const saved=await (await postWriter())(user.uid,id,data,{archiveState:"saved"});return {id,...saved}}
window.__biglwaCollectivePublish={createStudioDraft,createFeedDraft,uploadBlob};