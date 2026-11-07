#!/usr/bin/env node
/* BIG LWA current-tree audit for a clean future export. Does not inspect historical
 * commit objects, request credentials or mutate any repository files. */
import {readdirSync,statSync,readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const base=path.resolve(import.meta.dirname,'..');
const skip=new Set(['.git','node_modules','.venv','venv','__pycache__','.next','dist','coverage']);
const top=new Map(),all=[];
function walk(rel=''){
 const here=path.join(base,rel);
 for(const entry of readdirSync(here,{withFileTypes:true})){
  if(skip.has(entry.name))continue;
  const next=path.join(rel,entry.name),full=path.join(base,next);
  try{
   if(entry.isDirectory())walk(next);
   else if(entry.isFile()){
    const size=statSync(full).size;
    all.push({path:next.replaceAll('\\','/'),bytes:size});
    const bucket=next.split(path.sep)[0];
    top.set(bucket,(top.get(bucket)||0)+size);
   }
  }catch{/* Ignore independently removed temp files */ }
 }
}
walk();
const sorted=all.slice().sort((a,b)=>b.bytes-a.bytes);
const disk=Object.fromEntries([...top.entries()].sort((a,b)=>b[1]-a[1]).slice(0,20));
const entry=readFileSync(path.join(base,'index.html'),'utf8');
const scriptRe=/\/([a-z0-9._/-]+\.(?:js|mjs|css))\?v=/gi;
const links=new Set();
for(const match of entry.matchAll(scriptRe))links.add(match[1]);
const missing=[...links].filter(name=>!existsSync(path.join(base,name)));
const wrangler=readFileSync(path.join(base,'wrangler.toml'),'utf8');
const names=(wrangler.match(/^\s*required\s*=\s*\[([^\]]*)\]/m)?.[1]||'').match(/"([A-Z][A-Z_]+)"/g)||[];
const report={
 schema:1,
 audited_at:new Date().toISOString(),
 scope:'current checked-out tree only; excludes history and excluded working directories',
 file_count:all.length,source_bytes:all.reduce((sum,x)=>sum+x.bytes,0),
 buckets:disk,largest_files:sorted.slice(0,30),
 entrypoint_versioned_scripts:links.size,
 missing_versioned_entrypoint_assets:missing.sort(),
 worker_required_secret_names:names.map(x=>x.replaceAll('"','')),
 warnings:[
  'Git commit count does not determine download size; a shallow clone or clean archive can migrate the active site without moving all commit objects.',
  'Cloudflare Worker secrets are environment resources, not GitHub source files. A build can fail with correct source when required encrypted secrets are absent.',
  'This is a static file audit, not a logged-in Studio E2E or live OAuth/Cloudflare deployment test.'
 ]
};
const output=path.resolve(process.argv[2]||path.join(base,'seo-audits','repository-surface-audit.json'));
mkdirSync(path.dirname(output),{recursive:true});
writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log('BIG LWA source tree: '+all.length+' files, '+Math.round(report.source_bytes/1024/1024)+' MiB; versioned entrypoint assets: '+links.size+'; missing '+missing.length);
if(missing.length)console.warn('Missing referenced asset paths (review before exporting):',missing.slice(0,30));
console.log('Audit written:',output);
