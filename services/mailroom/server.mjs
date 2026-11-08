// Start only on a trusted host/proxy. Never deploy as a static Pages file.
import {createServer} from "node:http";
import {buildRuntime} from "./runtime.mjs";

const MAX_BODY=2048;
function readBody(request) {
  return new Promise((resolve,reject)=>{
    let size=0;const parts=[];
    request.on("data",chunk=>{
      size+=chunk.length;
      if(size>MAX_BODY){reject(Object.assign(new Error("Request too large"),{status:413}));request.pause();return;}
      parts.push(chunk);
    });
    request.on("end",()=>{
      try{resolve(size?JSON.parse(Buffer.concat(parts).toString("utf8")):null);}
      catch{reject(Object.assign(new Error("Invalid JSON"),{status:400}));}
    });
    request.on("error",reject);
  });
}
export function startHttpServer(handler,{host="127.0.0.1",port=8789}={}) {
  const server=createServer(async (req,res)=>{
    try {
      const path=new URL(req.url||"/","http://localhost").pathname;
      if (req.method==="POST" && req.headers["content-type"]?.split(";")[0]?.trim()!=="application/json"){
        res.writeHead(415,{"Content-Type":"application/json","Cache-Control":"no-store"});
        res.end('{"error":"json_required"}');return;
      }
      const body=req.method==="POST"?await readBody(req):null;
      const output=await handler({
        method:req.method,path,origin:req.headers.origin||"",
        authorization:req.headers.authorization||"",body
      });
      res.writeHead(output.status,output.headers);
      res.end(output.body===null?"":JSON.stringify(output.body));
    }catch(error){
      // Do not emit identity, action URLs, secrets, request bodies or SMTP errors.
      res.writeHead(error.status===413?413:error.status===400?400:500,{
        "Content-Type":"application/json","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"
      });
      res.end(JSON.stringify({error:error.status===413?"payload_too_large":error.status===400?"invalid_json":"internal_error"}));
    }
  });
  server.headersTimeout=15000;
  server.requestTimeout=20000;
  server.listen(port,host);
  return server;
}
if (process.argv[1] && import.meta.url===new URL("file://"+process.argv[1]).href) {
  const runtime=await buildRuntime(process.env);
  const cloudRun=Boolean(process.env.K_SERVICE);
  const host=process.env.MAILROOM_LISTEN_HOST || (cloudRun ? "0.0.0.0" : "127.0.0.1");
  const port=Number(process.env.MAILROOM_LISTEN_PORT || process.env.PORT || (cloudRun ? 8080 : 8789));
  if (!Number.isInteger(port)||port<1||port>65535)
    throw new Error("Invalid listen port.");
  // Public bind is explicitly disallowed. Use a secure reverse proxy + TLS.
  if(!["127.0.0.1","::1"].includes(host) &&
    !(cloudRun && host==="0.0.0.0" && process.env.MAILROOM_EXPOSED_STAGE==="true"))
    throw new Error("Non-loopback bind requires an explicit Cloud Run staging gate.");
  startHttpServer(runtime.handler,{host,port});
  process.stdout.write("Big LWA Mailroom backend listening locally. Live sending is gated.\\n");
}
