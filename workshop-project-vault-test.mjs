import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import vm from 'node:vm';

const source=readFileSync(new URL('./cloudflare-worker-instagram.js',import.meta.url),'utf8');
const files=new Map(),sessions=new Map();
let uploadSerial=0;
function bytesOf(value){
  if(value instanceof ArrayBuffer)return new Uint8Array(value);
  if(value instanceof Uint8Array)return value;
  return new TextEncoder().encode(String(value));
}
const bucket={
  async put(key,value,options={}){
    files.set(key,{bytes:bytesOf(value),options});
    return {key,size:files.get(key).bytes.byteLength};
  },
  async get(key){
    const row=files.get(key);if(!row)return null;
    return {size:row.bytes.byteLength,body:new Blob([row.bytes]).stream(),
      json:async()=>JSON.parse(new TextDecoder().decode(row.bytes)),
      arrayBuffer:async()=>row.bytes.buffer.slice(row.bytes.byteOffset,row.bytes.byteOffset+row.bytes.byteLength)};
  },
  async delete(keys){for(const key of Array.isArray(keys)?keys:[keys])files.delete(key)},
  async list({prefix}){return {objects:[...files.keys()].filter(key=>key.startsWith(prefix)).map(key=>({key})),truncated:false}},
  async createMultipartUpload(key,opts){
    const uploadId='up'+(++uploadSerial);sessions.set(uploadId,{key,opts,parts:new Map()});
    return {uploadId,key};
  },
  resumeMultipartUpload(key,uploadId){
    const s=sessions.get(uploadId);
    if(!s||s.key!==key)throw Error('No matching multipart upload');
    return {
      async uploadPart(n,value){
        const bytes=bytesOf(value),etag='etag-'+n+'-'+bytes.byteLength;
        s.parts.set(n,{bytes,etag});return {partNumber:n,etag};
      },
      async complete(parts){
        for(const part of parts){
          const known=s.parts.get(part.partNumber);
          if(!known||known.etag!==part.etag)throw Error('Wrong upload receipt');
        }
        const size=parts.reduce((sum,p)=>sum+s.parts.get(p.partNumber).bytes.byteLength,0);
        const all=new Uint8Array(size);let offset=0;
        for(const p of parts){const b=s.parts.get(p.partNumber).bytes;all.set(b,offset);offset+=b.byteLength}
        files.set(key,{bytes:all,options:s.opts});sessions.delete(uploadId);
        return {key,size};
      },
      async abort(){sessions.delete(uploadId)}
    };
  }
};
const env={
  SITE_URL:'https://biglwa.com',FIREBASE_PROJECT_ID:'biglwa',
  WALLPAPER_BUCKET:bucket,OAUTH_SESSIONS:{get:async()=>null,put:async()=>{}}
};
async function fakeFetch(input,options){
  const req=new Request(input,options),url=new URL(req.url);
  if(url.hostname==='identitytoolkit.googleapis.com'){
    const token=(await req.json()).idToken;
    const uid=({'member-a':'user-alpha','member-b':'user-bravo'})[token];
    return Response.json({users:uid?[{localId:uid,emailVerified:true}]:[]},{status:uid?200:401});
  }
  throw Error('Unexpected external request '+url);
}
const context={URL,URLSearchParams,Request,Response,Headers,Blob,TextDecoder,TextEncoder,console,
  crypto:webcrypto,fetch:fakeFetch,
  btoa:s=>Buffer.from(s,'binary').toString('base64'),
  atob:s=>Buffer.from(s,'base64').toString('binary')};
vm.runInNewContext(source.replace('export default {','const fakeWorker = {')+
  '\nglobalThis.testWorker=fakeWorker.fetch.bind(fakeWorker);',context,{filename:'cloudflare-worker-instagram.js'});
const worker=context.testWorker;
function req(path,{method='GET',token='member-a',origin='https://biglwa.com',body=null,type='application/json'}={}){
  const headers={Origin:origin,...(token?{Authorization:'Bearer '+token}:{})};
  if(body!==null)headers['Content-Type']=type;
  return new Request('https://api.biglwa.com'+path,{method,headers,...(body===null?{}:{body})});
}
async function data(request){const response=await worker(request,env);return {status:response.status,data:await response.json()}}
let done=0;
async function check(name,fn){await fn();done++;console.log('PASS '+name)}
let id,etag;
await check('no anonymous listing or initiation',async()=>{
  assert.equal((await data(req('/media/workshop-projects',{token:''}))).status,401);
  assert.equal((await data(req('/media/workshop-projects',{method:'POST',token:'',body:'{}'}))).status,401);
});
await check('block writes from untrusted origin',async()=>{
  assert.equal((await data(req('/media/workshop-projects',{method:'POST',origin:'https://evil.example',
    body:JSON.stringify({name:'secret.pcraft',app:'lightR',size:4})}))).status,403);
});
await check('create private native project upload',async()=>{
  const r=await data(req('/media/workshop-projects',{method:'POST',
    body:JSON.stringify({name:'Portrait.pcraft',app:'lightR',size:4})}));
  assert.equal(r.status,201);id=r.data.id;
  assert.match(id,/^[\w-]{22}$/);assert.equal(r.data.partCount,1);
  assert.ok([...files.keys()].some(k=>k==='workshop-projects/user-alpha/'+id+'.upload.json'));
});
await check('wrong chunk rejected; correct native bytes preserved',async()=>{
  const bad=await data(req('/media/workshop-projects/'+id+'/part/1',{method:'PUT',
    type:'application/octet-stream',body:new Uint8Array([1,2])}));
  assert.equal(bad.status,400);
  const yes=await data(req('/media/workshop-projects/'+id+'/part/1',{method:'PUT',
    type:'application/octet-stream',body:new Uint8Array([1,2,3,4])}));
  assert.equal(yes.status,200);etag=yes.data.etag;assert.equal(yes.data.partNumber,1);
});
await check('cross account cannot add chunks or finalize',async()=>{
  assert.equal((await data(req('/media/workshop-projects/'+id+'/part/1',{method:'PUT',token:'member-b',
    type:'application/octet-stream',body:new Uint8Array([4,3,2,1])}))).status,404);
  assert.equal((await data(req('/media/workshop-projects/'+id+'/complete',{method:'POST',token:'member-b',
    body:JSON.stringify({parts:[{partNumber:1,etag}]})}))).status,404);
});
await check('cannot finalize with missing or forged receipt',async()=>{
  assert.equal((await data(req('/media/workshop-projects/'+id+'/complete',{method:'POST',body:'{"parts":[]}'}))).status,400);
  const wrong=await data(req('/media/workshop-projects/'+id+'/complete',{method:'POST',
    body:JSON.stringify({parts:[{partNumber:1,etag:'forged'}]})}));
  assert.equal(wrong.status,500); // test bucket mimics R2 rejecting a receipt
});
await check('finish native project and list only for rightful owner',async()=>{
  const saved=await data(req('/media/workshop-projects/'+id+'/complete',{method:'POST',
    body:JSON.stringify({parts:[{partNumber:1,etag}]})}));
  assert.equal(saved.status,201);assert.equal(saved.data.project.size,4);
  const own=await data(req('/media/workshop-projects'));
  assert.equal(own.status,200);assert.equal(own.data.projects.length,1);
  assert.equal(own.data.projects[0].name,'Portrait.pcraft');
  const other=await data(req('/media/workshop-projects',{token:'member-b'}));
  assert.equal(other.data.projects.length,0);
});
await check('native download is private binary attachment',async()=>{
  const foreign=await worker(req('/media/workshop-projects/'+id,{token:'member-b'}),env);
  assert.equal(foreign.status,404);
  const good=await worker(req('/media/workshop-projects/'+id),env);
  assert.equal(good.status,200);
  assert.equal(good.headers.get('Content-Type'),'application/octet-stream');
  assert.match(good.headers.get('Content-Disposition'),/attachment/);
  assert.deepEqual([...new Uint8Array(await good.arrayBuffer())],[1,2,3,4]);
});
await check('user B cannot delete user A project; user A can',async()=>{
  assert.equal((await data(req('/media/workshop-projects/'+id,{method:'DELETE',token:'member-b'}))).status,404);
  assert.equal((await data(req('/media/workshop-projects/'+id,{method:'DELETE'}))).status,200);
  assert.equal((await worker(req('/media/workshop-projects/'+id),env)).status,404);
});
await check('multipart upload supports files larger than one chunk',async()=>{
  const whole=8*1024*1024+5;
  const start=await data(req('/media/workshop-projects',{method:'POST',
    body:JSON.stringify({name:'Timeline.native',app:'keyframeR',size:whole})}));
  assert.equal(start.data.partCount,2);
  const receipts=[];
  for(let n=1;n<=2;n++){
    const body=new Uint8Array(n===1?8*1024*1024:5);
    body.fill(n);
    const r=await data(req('/media/workshop-projects/'+start.data.id+'/part/'+n,{
      method:'PUT',body,type:'application/octet-stream'}));
    assert.equal(r.status,200);receipts.push({partNumber:n,etag:r.data.etag});
  }
  const done=await data(req('/media/workshop-projects/'+start.data.id+'/complete',{method:'POST',
    body:JSON.stringify({parts:receipts})}));
  assert.equal(done.status,201);assert.equal(done.data.project.size,whole);
});
await check('upload size and filename sanitation enforced',async()=>{
  assert.equal((await data(req('/media/workshop-projects',{method:'POST',
    body:JSON.stringify({name:'ab',app:'lightR',size:500*1024*1024+1})}))).status,413);
  const start=await data(req('/media/workshop-projects',{method:'POST',
    body:JSON.stringify({name:'../bad"<file>.psd',app:'lightR',size:3})}));
  assert.equal(start.status,201);
  assert.equal((await data(req('/media/workshop-projects/'+start.data.id+'/upload',{method:'DELETE'}))).status,200);
});
console.log('PASS '+done+' Workshop native project vault regression scenarios');
