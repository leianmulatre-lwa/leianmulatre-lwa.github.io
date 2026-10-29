import assert from 'node:assert/strict';
import {socialRoute} from './social-service.js';
const data=new Map();let version=0,current='alice',quota=false;
const bucket={async put(key,value,options={}){const old=data.get(key);if(options.onlyIf?.etagMatches&&old?.etag!==options.onlyIf.etagMatches)return null;if(options.onlyIf?.etagDoesNotMatch==='*'&&old)return null;const record={value,etag:String(++version),httpMetadata:options.httpMetadata};data.set(key,record);return record},async get(key){const o=data.get(key);return o?{etag:o.etag,httpMetadata:o.httpMetadata,size:o.value.byteLength||o.value.length,body:o.value,json:async()=>JSON.parse(o.value)}:null},async delete(key){data.delete(key)},async list({prefix,limit=1000,cursor}){let keys=[...data.keys()].filter(x=>x.startsWith(prefix)).sort();if(cursor)keys=keys.filter(x=>x>cursor);const result=keys.slice(0,limit);return {objects:result.map(key=>({key})),truncated:keys.length>limit,cursor:result.at(-1)}}};
const oldFetch=globalThis.fetch;
globalThis.fetch=async url=>{if(quota)return Response.json({error:'quota'},{status:429});const path=new URL(url).pathname,kind=path.split('/').at(-2),id=decodeURIComponent(path.split('/').at(-1));if(kind==='usernames'){if(!['alice','bob','eve'].includes(id))return Response.json({}, {status:404});return Response.json({fields:{uid:{stringValue:id},username:{stringValue:id},name:{stringValue:id}}})}if(kind==='sqwibs')return Response.json({fields:{uid:{stringValue:'bob'},text:{stringValue:'legacy'},visibility:{stringValue:'public'},allowResqwib:{booleanValue:true}}});return Response.json({fields:{username:{stringValue:id},name:{stringValue:id},peopleConnections:{mapValue:{fields:{bob:{mapValue:{fields:{username:{stringValue:'bob'},name:{stringValue:'Bob'}}}}}}}}})};
const helpers={user:async()=>({uid:current}),json:(d,status)=>Response.json(d,{status}),preflight:()=>new Response(null,{status:204}),allowed:r=>r.headers.get('Origin')==='https://biglwa.com'};
async function call(path,body,origin='https://biglwa.com'){return socialRoute(new Request('https://api.biglwa.com/social/'+path,{method:body===undefined?'GET':'POST',headers:{Origin:origin},...(body===undefined?{}:{body:JSON.stringify(body)})}),{WALLPAPER_BUCKET:bucket},helpers).then(r=>r.json())}
try{
 await assert.rejects(call('posts',undefined,'https://evil.test'),/Origin/);
 const created=await call('posts',{text:'A public thought #art',allowResqwib:true,veve:false});const id=created.post.id;assert.equal(created.post.uid,'alice');
 current='bob';await call('post/'+id+'/float',{enabled:true});await call('post/'+id+'/ink',{enabled:true});let details=await call('post/'+id);assert.equal(details.counts.float,0);assert.equal(details.counts.ink,1);assert.equal(details.mine.vote,'ink');
 await call('post/'+id+'/reply',{text:'a reply'});await call('post/'+id+'/fish',{enabled:true});assert.equal((await call('fish')).items.length,1);
 current='eve';assert.equal((await call('fish')).items.length,0);await assert.rejects(call('post/'+id+'/remove',{}),/author controls/);
 current='bob';await call('messages',{to:'alice',text:'Private hello'});assert.equal((await call('messages?to=alice')).items[0].text,'Private hello');
 current='alice';assert.equal((await call('messages?to=bob')).items[0].text,'Private hello');assert.equal((await call('inbox')).items[0].uid,'bob');
 current='eve';assert.equal((await call('messages?to=bob')).items.length,0);assert.equal((await call('inbox')).items.length,0);
 current='alice';await call('post/'+id+'/remove',{});assert.equal((await call('posts')).items.length,0);await assert.rejects(call('post/'+id),/unavailable/);
 current='bob';assert.equal((await call('fish')).items.length,0,'Withdrawn text is excluded from bookmarks');
 await call('post/legacy-id/reply',{text:'Legacy replies work'});assert.equal((await call('post/legacy-id')).replies.length,1);
 await call('presence',{online:true});current='alice';const roster=await call('presence',{online:true});assert.deepEqual(roster.online,['bob']);assert.equal(roster.people[0].username,'bob');quota=true;await assert.rejects(call('presence',{online:true}),/quota/);quota=false;
 await assert.rejects(call('posts',{text:'x',kind:'video',media:'javascript:alert(1)'}),/HTTPS/);
 await assert.rejects(call('posts',{text:'x'.repeat(30001),kind:'essay'}),/30,000/);

 const raw=new Uint8Array([137,80,78,71,13,10,26,10]);
 const uploaded=await socialRoute(new Request('https://api.biglwa.com/social/upload',{method:'POST',headers:{Origin:'https://biglwa.com','Content-Type':'image/png'},body:raw}),{WALLPAPER_BUCKET:bucket},helpers).then(r=>r.json());
 assert(uploaded.asset);const asset=uploaded.asset;
 current='eve';await assert.rejects(call('posts',{text:'steal upload',kind:'photo',asset}),/this account/);
 current='alice';const photo=(await call('posts',{text:'photo caption',kind:'photo',asset})).post;
 const publicImage=await socialRoute(new Request('https://api.biglwa.com/social/post/'+photo.id+'/media'),{WALLPAPER_BUCKET:bucket},{...helpers,user:()=>{throw Error('No auth needed for published binary')}});
 assert.equal(publicImage.status,200);assert.equal(publicImage.headers.get('Content-Type'),'image/png');
 await call('post/'+photo.id+'/remove',{});await assert.rejects(socialRoute(new Request('https://api.biglwa.com/social/post/'+photo.id+'/media'),{WALLPAPER_BUCKET:bucket},helpers),/unavailable/);
 console.log('PASS social backend: private DMs and bookmarks, verified authors, votes, legacy replies, withdrawals, presence and input limits');
}finally{globalThis.fetch=oldFetch}
