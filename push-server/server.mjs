/* Private opt-in pilot. No broadcast endpoint, persistent subscriptions or automatic account events. */
import http from 'node:http';
import {initializeApp,applicationDefault} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getFirestore} from 'firebase-admin/firestore';
import webpush from 'web-push';
import {validateSubscription,pilotAllowed,permitTest,testPayload} from './policy.mjs';
const required=name=>{const v=process.env[name];if(!v)throw Error('Missing '+name);return v};
const origin=new URL(required('ALLOWED_ORIGIN'));
if(origin.protocol!=='https:'||origin.href!==origin.origin+'/')throw Error('ALLOWED_ORIGIN must be an HTTPS origin');
const allowed=new Set(required('PILOT_UIDS').split(',').map(x=>x.trim()).filter(Boolean));
if(!allowed.size)throw Error('PILOT_UIDS is empty');
const project=required('FIREBASE_PROJECT_ID');
initializeApp({credential:applicationDefault(),projectId:project});
const db=getFirestore(),auth=getAuth();
webpush.setVapidDetails(required('VAPID_SUBJECT'),required('VAPID_PUBLIC_KEY'),required('VAPID_PRIVATE_KEY'));
const headers={'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
function respond(res,status,data){res.writeHead(status,headers);res.end(JSON.stringify(data))}
async function readJson(req){
 if(!String(req.headers['content-type']||'').startsWith('application/json'))throw Error('bad content type');
 let size=0;const chunks=[];
 for await(const chunk of req){size+=chunk.length;if(size>8192)throw Error('body too large');chunks.push(chunk)}
 return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
const server=http.createServer(async(req,res)=>{
 if(req.url==='/health'&&req.method==='GET')return respond(res,200,{ok:true,pilot:true});
 if(req.url!=='/v1/test')return respond(res,404,{error:'Not found'});
 if(req.headers.origin!==origin.origin)return respond(res,403,{error:'Origin not permitted'});
 res.setHeader('Access-Control-Allow-Origin',origin.origin);
 res.setHeader('Vary','Origin');
 if(req.method==='OPTIONS'){
  res.writeHead(204,{'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Authorization, Content-Type','Access-Control-Max-Age':'600'});return res.end();
 }
 if(req.method!=='POST')return respond(res,405,{error:'Method not allowed'});
 const token=String(req.headers.authorization||'').match(/^Bearer ([A-Za-z0-9_.-]+)$/)?.[1];
 if(!token)return respond(res,401,{error:'Sign in to BIG LWA.'});
 let identity;try{identity=await auth.verifyIdToken(token,true)}catch{return respond(res,401,{error:'Session invalid or expired.'})}
 if(!pilotAllowed(identity.uid,allowed))return respond(res,403,{error:'Remote push is limited to the private pilot.'});
 let sub;try{sub=validateSubscription((await readJson(req)).subscription)}catch{}
 if(!sub)return respond(res,400,{error:'Unsupported or invalid push subscription.'});
 try{
  const now=Date.now(),ref=db.collection('privatePushPilotRateLimits').doc(identity.uid);
  const granted=await db.runTransaction(async tx=>{
   const old=await tx.get(ref);
   if(!permitTest(old.data()?.lastTestAt,now))return false;
   tx.set(ref,{lastTestAt:now});return true;
  });
  if(!granted){res.setHeader('Retry-After','60');return respond(res,429,{error:'Wait one minute before another remote test.'})}
  // Do not log or persist subscription URLs, keys, tokens or provider responses.
  await webpush.sendNotification(sub,testPayload(),{TTL:60,urgency:'normal',timeout:10000});
  return respond(res,200,{accepted:true});
 }catch(error){
  if(error.statusCode===404||error.statusCode===410)return respond(res,410,{error:'Subscription expired. Disable notifications and enable them again.'});
  return respond(res,502,{error:'Push gateway did not accept this test. Check the pilot configuration.'});
 }
});
server.requestTimeout=15000;server.headersTimeout=10000;
server.listen(Number(process.env.PORT||8080),'0.0.0.0');
