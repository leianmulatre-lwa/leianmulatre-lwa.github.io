/* Big LWA politc live-data relay. Independent from all account/OAuth Workers. */
const CONGRESS='https://unitedstates.github.io/congress-legislators/legislators-current.json';
const PROJECT='https://www.project2025.observer/en';
const STATES=new Set('AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split(' '));
const cors=origin=>({
 'Access-Control-Allow-Origin':['https://biglwa.com','https://www.biglwa.com'].includes(origin)?origin:'https://biglwa.com',
 'Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'
});
const get=url=>fetch(url,{headers:{Accept:'text/html,application/json;q=0.9','User-Agent':'BigLWA-Politc-Data/1.0 (+https://biglwa.com/about/)'},signal:AbortSignal.timeout(8500),cf:{cacheTtl:900,cacheEverything:true}});
function countSeats(rows,today,chamber){
 const counts={Democrat:0,Republican:0,Independent:0,Other:0};
 for(const row of rows){const term=row?.terms?.at(-1);if(!term||term.type!==chamber||!STATES.has(term.state)||term.start>today||term.end<today)continue;
  if(Object.hasOwn(counts,term.party)&&term.party!=='Other')counts[term.party]++;else counts.Other++;}
 return {...counts,occupied:Object.values(counts).reduce((a,b)=>a+b,0),chamber};
}
async function seats(){
 try{const res=await get(CONGRESS);if(!res.ok)throw Error('upstream');const data=await res.json();if(!Array.isArray(data)||data.length<300)throw Error('invalid');
 const date=new Date().toISOString().slice(0,10),house=countSeats(data,date,'rep'),senate=countSeats(data,date,'sen');
 if(house.occupied<300||senate.occupied<90)throw Error('incomplete');return {state:'ok',source:CONGRESS,house,senate};
 }catch(err){return {state:'unavailable',source:CONGRESS};}
}
/* Read the observer's current visible SSR summary, not its old HTML layout.
 * Fail closed when counts disagree; no guessing from percentages.
 */
function parseTracker(html){
 const plain=String(html).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ')
  .replace(/<[^>]*>/g,' ').replace(/&(?:nbsp|#160);/gi,' ').replace(/\s+/g,' ').trim();
 const summary=plain.match(/(\d{1,4})\s+Completed\s+(\d{1,4})\s+In Progress\s+(\d{1,4})\s+Not Started\b/i);
 const legacy=plain.match(/(\d{1,4})\s+Total\s+(\d{1,4})\s+Done\s+(\d{1,4})\s+In Progress\b/i);
 const totalLabel=plain.match(/Total\s+Objectives\s+(\d{1,4})\b/i);
 let total,done,inProgress,notStarted;
 if(summary){
  [done,inProgress,notStarted]=summary.slice(1).map(Number);
  total=done+inProgress+notStarted;
  if(totalLabel&&Number(totalLabel[1])!==total)return null;
 }else if(legacy){
  [total,done,inProgress]=legacy.slice(1).map(Number);notStarted=total-done-inProgress;
  if(totalLabel&&Number(totalLabel[1])!==total)return null;
 }else return null;
 if(total<50||total>2000||done<0||inProgress<0||notStarted<0||
    done+inProgress+notStarted!==total)return null;
 return {total,done,inProgress,notStarted,
  completedPct:+(100*done/total).toFixed(1),
  weightedPct:Math.round(100*(done+inProgress/2)/total)};
}
async function tracker(){
 try{const res=await get(PROJECT);if(!res.ok)throw Error('upstream');const counts=parseTracker(await res.text());if(!counts)throw Error('unreadable');
 return {state:'ok',source:PROJECT,...counts,method:'Completed objectives count fully; in-progress objectives count as one-half. A tracker-specific measure, not a measure of impact.'};
 }catch(err){return {state:'unavailable',source:PROJECT,reason:'Tracker counts could not be verified.'};}
}
addEventListener('fetch',event=>event.respondWith((async()=>{
 const req=event.request,url=new URL(req.url),headers=cors(req.headers.get('Origin')||'');
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='GET')return new Response('Method not allowed',{status:405,headers});
 if(url.pathname==='/health')return new Response(JSON.stringify({ok:true,version:'politc-live-v2'}),{headers:{...headers,'Content-Type':'application/json','Cache-Control':'no-store'}});
 if(url.pathname!=='/politc')return new Response('Not found',{status:404,headers});
 const cache=caches.default,key=new Request(url.origin+'/politc');
 if(!url.searchParams.has('refresh')){const cached=await cache.match(key);if(cached){const response=new Response(cached.body,cached);for(const [k,v] of Object.entries(headers))response.headers.set(k,v);return response;}}
 const [congress,project2025]=await Promise.all([seats(),tracker()]);
 const payload={version:1,checkedAt:new Date().toISOString(),congress,project2025};
 const response=new Response(JSON.stringify(payload),{headers:{...headers,'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age=900','X-Content-Type-Options':'nosniff'}});
 if(congress.state==='ok'||project2025.state==='ok')event.waitUntil(cache.put(key,response.clone()));
 return response;
})()));