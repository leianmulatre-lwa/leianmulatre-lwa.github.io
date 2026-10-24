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
 if(!new RegExp('(?:^|\\s)@'+handle.replace(/[.*+?^${}()|[\]\\]/g,'\\if(!observed.includes('@'+handle.toLowerCase())||followers===null)return null;')+'(?=\\s|$)','i').test(observed)||followers===null)return null;
 const rawDate=without.match(/(?:Scraped|Last update:)\s*(\d{1,2}\/\d{1,2}\/\d{4}|[A-Za-z]+\s+\d{1,2},?\s+\d{4})/i)?.[1]||'';
 return {handle,matchedHandle:true,followers,following,videoCount:video?count(video[1]):null,
  engagementRate:engagement?Number(engagement[1]):null,sourceObservedAt:rawDate||null,
  source:'TokPortal public profile checker',authentication:'external_public_data'};
}
export {parsePublicProfile};
export default {async fetch(request,env,ctx){
 const url=new URL(request.url),origin=request.headers.get('Origin')||'';
 if(request.method==='OPTIONS')return answer({ok:true},204,origin,0);
 if(request.method!=='GET')return answer({error:'GET only'},405,origin,0);
 if(url.pathname==='/health')return answer({ok:true,adapter:'public-tiktok-snapshot-v1'},200,origin,120);
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
  if(!snapshot)return answer({available:false,handle,source:upstream,message:'No readable public counts for this profile.'},200,origin,1800);
  return answer({available:true,...snapshot,sourceUrl:upstream,checkedAt:new Date().toISOString()},200,origin,21600);
 }catch(error){
  return answer({available:false,handle,source:upstream,message:'External source unavailable.',reason:['Response too large','Not HTML'].includes(error?.message)?error.message:'Fetch blocked'},200,origin,900);
 }
}};
