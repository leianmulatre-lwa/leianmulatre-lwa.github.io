// Private per-member records. Authentication is independent of Firestore.
const headers={'Access-Control-Allow-Origin':'https://biglwa.com','Access-Control-Allow-Headers':'Authorization, Content-Type','Access-Control-Allow-Methods':'GET, PUT, OPTIONS','Cache-Control':'private, no-store'};
const reply=(value,status=200)=>Response.json(value,{status,headers});
export default {async fetch(request,env){
 if(request.method==='OPTIONS')return new Response(null,{headers});
 const path=new URL(request.url).pathname;
 if(!/^\/(locker-[1-4]|look)$/.test(path))return reply({},404);
 if(!['GET','PUT'].includes(request.method))return reply({},405);
 const token=request.headers.get('Authorization')?.match(/^Bearer (\S+)$/)?.[1];
 if(!token)return reply({},401);
 const auth=await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=AIzaSyAPUT8_pLNxdh5tbGpAmXBJiID3jVcA9DY',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({idToken:token})});
 if(!auth.ok)return reply({},auth.status===400?401:503);
 const uid=(await auth.json()).users?.[0]?.localId;
 if(!uid)return reply({},401);
 const key='private-studio-presets/v1/'+encodeURIComponent(uid)+path;
 const object=await env.PRESETS.get(key);
 const prior=object?await object.json():{revision:0,value:null};
 if(request.method==='GET')return reply(prior);
 if(Number(request.headers.get('content-length'))>128000)return reply({},413);
 const text=await request.text();if(text.length>128000)return reply({},413);
 let input;try{input=JSON.parse(text)}catch{return reply({},400)}
 if(input?.revision!==prior.revision)return reply({},409);
 if(!input.value||typeof input.value!=='object'||Array.isArray(input.value))return reply({},400);
 const next={revision:prior.revision+1,value:input.value};
 const saved=await env.PRESETS.put(key,JSON.stringify(next),{onlyIf:object?{etagMatches:object.etag}:{etagDoesNotMatch:'*'}});
 return saved?reply(next):reply({},409);
}};
