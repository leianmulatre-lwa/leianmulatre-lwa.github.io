/* BIG LWA public-source snapshot adapter. Original parser, not TokPortal code.
 * Reads publicly cached profile pages only, never private/login resources.
 * An external snapshot is NOT authentication or proof of ownership.
 */
const ALLOWED=new Set(['https://biglwa.com','https://www.biglwa.com']);
function answer(data,status=200,origin='',ttl=3600){
 const h={'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age='+ttl,'Vary':'Origin',
 'X-Content-Type-Options':'nosniff'};
 if(ALLOWED.has(origin)){h['Access-Control-Allow-Origin']=origin;h['Access-Control-Allow-Methods']='GET,OPTIONS';}
 return new Response(JSON.stringify(data),{status,headers:h});
}
const count=s=>{
 const m=String(s||'').match(/^([\d,]+)(?:\s*([kmb]))?$/i);
 if(!m)return null;const n=Number(m[1].replace(/,/g,'')),scale={k:1000,m:1e6,b:1e9}[m[2]?.toLowerCase()]||1;
 return Number.isSafeInteger(Math.round(n*scale))?Math.round(n*scale):null;
};
function parsePublicProfile(html,handle){
 const without=String(html).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
 .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]*>/g,' ')
 .replace(/&(?:nbsp|amp|lt|gt|quot|#39);/g,' ').replace(/\s+/g,' ').trim();
 const segment=without.match(/Profile metrics\s+([\s\S]{0,3000})/i)?.[1]||without;
 const metric=label=>{
  const match=segment.match(new RegExp('(?:^|\\b)'+label+'\\s*[:·-]?\\s*([\\d,.]+\\s*[KMB]?)\\b','i'));
  return match?count(match[1].trim()):null;
 };
 const followers=metric('Followers'),following=metric('Following');
 // Metrics are available only on TokPortal's cached, username-specific result page.
 // Never guess follower counts from its landing/search page or an unrelated handle.
 const video=segment.match(/(?:Total\s+)?videos\s*[:·-]?\s*([\d,]+)/i);
 const engagement=segment.match(/Engagement\s+rate\s*[:·-]?\s*([\d.]+)%/i);
 // Require the profile heading or author's label to identify this handle.
 const observed=without.toLowerCase();
 const normalizedHandle=handle.replaceAll('.', '\\.');
 const textMatch=new RegExp('(?:^|\\s)@\\s*'+normalizedHandle+'(?=\\s|$)','i').test(observed);
 const rawTitle=String(html).match(/<title\b[^>]*>([^<]{1,180})<\/title>/i)?.[1]?.trim()||'';
 const titleMatch=rawTitle.toLowerCase().startsWith(handle.toLowerCase()+' – tiktok performances');
 if((!textMatch&&!titleMatch)||followers===null)return null;
 const rawDate=without.match(/(?:Scraped|Last update:)\s*(\d{1,2}\/\d{1,2}\/\d{4}|[A-Za-z]+\s+\d{1,2},?\s+\d{4})/i)?.[1]||'';
 return {handle,matchedHandle:true,followers,following,videoCount:video?count(video[1]):null,
  engagementRate:engagement?Number(engagement[1]):null,sourceObservedAt:rawDate||null,
  source:'TokPortal public profile checker',authentication:'external_public_data'};
}

/* Public Snapchat Spotlight preview links; signed URLs remain source-hosted
 * and are not copied into BIG LWA storage. Exact source handle match required. */
function parsePublicSnapchat(html,handle){
 const text=String(html||'');
 const title=text.match(/<title[^>]*>([^<]{1,100})<\/title>/i)?.[1]?.trim()||'';
 if(!new RegExp('^'+handle.replaceAll('.', '\\.')+"'s Story$",'i').test(title))return null;
 const profile='https://story.snapchat.com/add/@'+handle,items=[];
 const re=/<video\b[^>]*\bsrc="([^"]{10,3000})"/gi;
 let match;
 while((match=re.exec(text))&&items.length<12){
   const url=match[1].replace(/&amp;/g,'&');
   if(!/^https:\/\/cf-st\.sc-cdn\.net\/[a-zA-Z0-9/_?=&.%:-]+$/.test(url))continue;
   if(!items.some(x=>x.mediaUrl===url))items.push({
     kind:'Spotlight',mediaUrl:url,sourceUrl:profile,
     external:true,verifiedFromProvider:false
   });
 }
 return {handle,matchedHandle:true,items,source:'Storyclone public Spotlight index',
  sourceUrl:'https://o.storyclone.com/u/'+encodeURIComponent(handle)+'/'};
}


/* First-party public source discovery. No calls to a third-party viewer's
 * protected /api.php, no cookies, private account data or bot challenges.
 * TikTok may withhold the public hydration payload; fail visibly then.
 */
function parseTikTokPublicPosts(html,handle){
 const posts=[],seen=new Set(),target=handle.toLowerCase(),limit=30;
 const scripts=[...String(html).matchAll(/<script\b[^>]*\bid=["'](?:SIGI_STATE|__UNIVERSAL_DATA_FOR_REHYDRATION__|__NEXT_DATA__)["'][^>]*>([\s\S]*?)<\/script>/gi)].slice(0,4);
 let traversed=0;
 const inspect=root=>{
  const stack=[root],visited=new Set();
  while(stack.length&&traversed++<12000&&posts.length<limit){
   const node=stack.pop();
   if(!node||typeof node!=='object'||visited.has(node))continue;visited.add(node);
   if(Array.isArray(node)){for(const row of node.slice(0,220))stack.push(row);continue}
   const id=String(node.id||node.video_id||'');
   const author=String(node.author?.uniqueId||node.author?.unique_id||
     node.authorInfo?.user?.uniqueId||node.authorInfo?.uniqueId||
     node.authorUniqueId||'').replace(/^@/,'');
   if(/^\d{12,25}$/.test(id)&&author.toLowerCase()===target&&!seen.has(id)){
    seen.add(id);
    const title=String(node.desc||node.title||'').slice(0,480);
    const cover=String(node.video?.cover||node.video?.dynamicCover||node.cover||'');
    let coverImageUrl='';
    try{const u=new URL(cover);if(u.protocol==='https:'&&!u.username&&!u.password)coverImageUrl=u.href}catch{}
    posts.push({id,handle,sourceUrl:'https://www.tiktok.com/@'+handle+'/video/'+id,
      title,coverImageUrl,source:'TikTok public profile'});
   }
   for(const [k,value] of Object.entries(node)){
    if(value&&typeof value==='object'&&k!=='video'&&k!=='stats'&&k!=='music'&&k!=='challenges')stack.push(value);
   }
  }
 };
 for(const [,serialized] of scripts){
  if(serialized.length>2500000)continue;
  try{inspect(JSON.parse(serialized.replace(/&quot;/g,'"').replace(/&amp;/g,'&')))}catch{}
 }
 return posts;
}
export {parsePublicProfile,parsePublicSnapchat};
export default {async fetch(request,env,ctx){
 const url=new URL(request.url),origin=request.headers.get('Origin')||'';
 if(request.method==='OPTIONS')return answer({ok:true},204,origin,0);
 if(request.method!=='GET')return answer({error:'GET only'},405,origin,0);
 if(url.pathname==='/health')return answer({ok:true,adapter:'public-tiktok-snapshot-v1'},200,origin,120);
 const publicPosts=url.pathname.match(/^\/tiktok\/([a-zA-Z0-9._]{2,40})\/posts\/?$/);
 if(publicPosts){
  const handle=publicPosts[1],sourceUrl='https://www.tiktok.com/@'+handle;
  try{
   const response=await fetch(sourceUrl,{headers:{Accept:'text/html'},
    method:'GET',redirect:'error',cf:{cacheTtl:900,cacheEverything:true}});
   const type=String(response.headers.get('Content-Type')||'');
   if(!response.ok||!type.includes('text/html'))throw Error('Public source unavailable');
   if(Number(response.headers.get('Content-Length')||0)>3000000)throw Error('Response too large');
   const html=(await response.text()).slice(0,3000000);
   const posts=parseTikTokPublicPosts(html,handle);
   return answer({available:posts.length>0,handle,matchedHandle:posts.length>0,
    items:posts,sourceUrl,checkedAt:new Date().toISOString(),
    message:posts.length?'Public TikTok posts found for @'+handle:
     'No verifiable public video records returned by TikTok.'},200,origin,posts.length?900:300);
  }catch{return answer({available:false,handle,items:[],sourceUrl,
   message:'TikTok did not return public profile data accessible to the importer.'},200,origin,300)}
 }
 const snapMatch=url.pathname.match(/^\/snapchat\/([a-zA-Z0-9._]{2,40})\/?$/);
 if(snapMatch){
  const handle=snapMatch[1],source='https://o.storyclone.com/u/'+encodeURIComponent(handle)+'/';
  try{
   const res=await fetch(source,{method:'GET',redirect:'error',
    headers:{Accept:'text/html'},cf:{cacheTtl:900,cacheEverything:true}});
   if(!res.ok||!String(res.headers.get('Content-Type')||'').includes('text/html'))
    return answer({available:false,handle,sourceUrl:source,message:'Public Snapchat index unavailable.'},200,origin,300);
   if(Number(res.headers.get('Content-Length')||0)>2000000)throw Error('Large response');
   const parsed=parsePublicSnapchat((await res.text()).slice(0,2000000),handle);
   if(!parsed)return answer({available:false,handle,sourceUrl:source,message:'Public page username did not match.'},200,origin,300);
   return answer({available:parsed.items.length>0,...parsed,checkedAt:new Date().toISOString()},200,origin,300);
  }catch{
   return answer({available:false,handle,sourceUrl:source,message:'Public Snapchat source unavailable.'},200,origin,300);
  }
 }
 const match=url.pathname.match(/^\/tiktok\/([a-zA-Z0-9._]{2,40})\/?$/);
 if(!match)return answer({error:'Unknown public profile route'},404,origin,120);
 const handle=match[1];const upstream='https://www.tokportal.com/tool/tiktok-profile-analytics-checker/'+encodeURIComponent(handle);
 try{
  const response=await fetch(upstream,{method:'GET',redirect:'follow',headers:{Accept:'text/html'},
   cf:{cacheTtl:21600,cacheEverything:true}});
  if(!response.ok)return answer({available:false,handle,source:upstream,message:'No publicly indexed snapshot returned.'},200,origin,900);
  const type=response.headers.get('Content-Type')||'';
  if(!type.includes('text/html'))throw Error('Not HTML');
  const length=Number(response.headers.get('Content-Length')||0);
  if(length>3000000)throw Error('Response too large');
  const html=(await response.text()).slice(0,3000000);
  const snapshot=parsePublicProfile(html,handle);
  if(!snapshot){
   // Only expose non-sensitive parser flags; do not copy source HTML, cookies
   // or hidden provider material to BIG LWA clients.
   const visible=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
     .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ')
     .replace(/<[^>]*>/g,' ').replace(/\s+/g,' ');
   return answer({available:false,handle,source:upstream,message:'No readable public counts for this profile.',
     diagnostics:{pageBytes:html.length,publicTitle:(html.match(/<title[^>]*>([^<]{1,140})<\/title>/i)?.[1]||'').slice(0,140),hasUsername:visible.toLowerCase().includes('@'+handle.toLowerCase()),
       hasMetrics:/Profile metrics/i.test(visible),hasFollowers:/Followers\s*[\d,]+/i.test(visible)}},200,origin,1800);
  }
  return answer({available:true,...snapshot,sourceUrl:upstream,checkedAt:new Date().toISOString()},200,origin,21600);
 }catch(error){
  return answer({available:false,handle,source:upstream,message:'External source unavailable.',reason:['Response too large','Not HTML'].includes(error?.message)?error.message:'Fetch blocked'},200,origin,900);
 }
}};
