/* Preview-only, same-origin L'wazi relay. No model credentials live in Pages.
 * The upstream Worker checks signed Firebase tokens and the private pilot UID allowlist.
 * Do not pass untrusted arbitrary upstream URLs or log request bodies. */
const TARGET='https://biglwa-lwazi-pilot.leianmulatre-284.workers.dev/api/lwazi';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
export async function onRequestPost({request}){
  const auth=request.headers.get('Authorization')||'';
  if(!/^Bearer [A-Za-z0-9._-]+$/.test(auth))return new Response('Authentication required',{status:401,headers});
  const contentLength=Number(request.headers.get('Content-Length')||0);
  if(contentLength>12000)return new Response('Request too large',{status:413,headers});
  let body;
  try{body=await request.text()}catch{return new Response('Invalid request',{status:400,headers})}
  if(body.length>12000)return new Response('Request too large',{status:413,headers});
  try{
    const upstream=await fetch(TARGET,{
      method:'POST',
      headers:{Authorization:auth,'Content-Type':'application/json','Accept':'text/event-stream'},
      body,
      redirect:'error',
      signal:AbortSignal.timeout(35000)
    });
    return new Response(upstream.body,{status:upstream.status,headers:{
      ...headers,'Content-Type':upstream.headers.get('Content-Type')||'application/json; charset=utf-8'
    }});
  }catch{
    return Response.json({error:'lwazi_pilot_unavailable'},{status:502,headers});
  }
}
export async function onRequestGet(){
  return new Response('Not found',{status:404,headers});
}
