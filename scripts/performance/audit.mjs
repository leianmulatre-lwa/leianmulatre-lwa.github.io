#!/usr/bin/env node
/* BIG LWA / read-only repository and entrypoint budget audit.
 * Run: node scripts/performance/audit.mjs --json
 *      node scripts/performance/audit.mjs --check
 * This DOES NOT inspect member files, upload anything, or change artifacts.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root=path.resolve(import.meta.dirname||path.dirname(new URL(import.meta.url).pathname),'../..');
const args=new Set(process.argv.slice(2));
const tracked=execFileSync('git',['ls-files','-z'],{cwd:root,encoding:'buffer'})
 .toString('utf8').split('\0').filter(Boolean);
const files=tracked.map(name=>{
 const file=path.join(root,name);
 let bytes=0;
 try{const stat=fs.statSync(file);if(stat.isFile())bytes=stat.size;}catch{}
 return {name,bytes};
}).filter(entry=>entry.bytes>0);
const fileSizes=new Map(files.map(e=>['/'+e.name.replaceAll('\\','/'),e.bytes]));
const bytes=files.reduce((sum,e)=>sum+e.bytes,0);
const byExtension={};
const byArea={};
for(const file of files){
 const ext=path.extname(file.name).toLowerCase()||'(no extension)';
 const area=file.name.includes('/')?file.name.split('/')[0]:'(root files)';
 byExtension[ext]??={count:0,bytes:0};byExtension[ext].count++;byExtension[ext].bytes+=file.bytes;
 byArea[area]??={count:0,bytes:0};byArea[area].count++;byArea[area].bytes+=file.bytes;
}
const routes=[
 'index.html','studio/index.html','legal/index.html',
 'about/index.html','privacy/index.html','terms/index.html','rights/index.html',
 'affidavit/index.html','map-app.html','404.html','robots.txt','sitemap.xml'
];
const missingRoutes=routes.filter(name=>!fs.existsSync(path.join(root,name)));
function shellAudit(file){
 const html=fs.readFileSync(path.join(root,file),'utf8');
 // This counts the literal references inside the current dynamically assembled
 // HTML shell. It is NOT a network waterfall or proof of resource execution.
 const seen={js:new Set(),css:new Set()};
 const re=/(?:src|href)\s*=\s*["'](\/[^"'<>\s]+?\.(js|css))(?:\?[^"']*)?["']/gi;
 let match;
 while((match=re.exec(html))){
  seen[match[2].toLowerCase()].add(match[1]);
 }
 const paths={};
 for(const ext of ['js','css']){
  const names=[...seen[ext]];
  paths[ext]={count:names.length,rawBytes:names.reduce((a,p)=>a+(fileSizes.get(p)||0),0),
   missingSource:names.filter(p=>!fileSizes.has(p)),
   heaviest:names.map(p=>({path:p,bytes:fileSizes.get(p)||0}))
    .sort((a,b)=>b.bytes-a.bytes).slice(0,12)};
 }
 return {source:file,shellBytes:Buffer.byteLength(html),js:paths.js,css:paths.css,
  evalBootstrap:/\(\s*0\s*,\s*eval\s*\)\s*\(/.test(html)};
}
const entrypoints={landing:shellAudit('index.html'),studio:shellAudit('studio/index.html')};
const sortMap=(map,n)=>Object.entries(map).sort((a,b)=>b[1].bytes-a[1].bytes)
 .slice(0,n).map(([name,totals])=>({name,...totals}));
const report={generatedAt:new Date().toISOString(),kind:'source-audit-not-page-speed',
 trackedFileCount:files.length,trackedBytes:bytes,missingRoutes,
 largestTrackedFiles:[...files].sort((a,b)=>b.bytes-a.bytes).slice(0,16),
 largestAreas:sortMap(byArea,20),largestExtensions:sortMap(byExtension,20),
 entrypoints,limits:{landingJsRefs:116,landingCssRefs:92,
   landingJsRawBytes:2900000,landingCssRawBytes:930000,
   studioJsRefs:114,studioCssRefs:92,
   studioJsRawBytes:2900000,studioCssRawBytes:930000,
   trackedBytes:145000000}};
const warnings=[];
if(missingRoutes.length)warnings.push('Required source routes missing: '+missingRoutes.join(', '));
for(const [key,limits] of [['landing',['landingJsRefs','landingCssRefs','landingJsRawBytes','landingCssRawBytes']],['studio',['studioJsRefs','studioCssRefs','studioJsRawBytes','studioCssRawBytes']]]){
 const [jsCount,cssCount,jsBytes,cssBytes]=limits.map(x=>report.limits[x]);
 const x=entrypoints[key];
 if(x.js.count>jsCount)warnings.push(key+': JS ref count '+x.js.count+' exceeds '+jsCount);
 if(x.css.count>cssCount)warnings.push(key+': CSS ref count '+x.css.count+' exceeds '+cssCount);
 if(x.js.rawBytes>jsBytes)warnings.push(key+': JS raw bytes '+x.js.rawBytes+' exceeds '+jsBytes);
 if(x.css.rawBytes>cssBytes)warnings.push(key+': CSS raw bytes '+x.css.rawBytes+' exceeds '+cssBytes);
 if(x.js.missingSource.length)warnings.push(key+': missing JS source refs '+x.js.missingSource.slice(0,10).join(', '));
 if(x.css.missingSource.length)warnings.push(key+': missing CSS source refs '+x.css.missingSource.slice(0,10).join(', '));
}
if(bytes>report.limits.trackedBytes)warnings.push('Tracked bytes '+bytes+' exceed '+report.limits.trackedBytes);
report.warnings=warnings;
if(args.has('--json'))console.log(JSON.stringify(report,null,2));
else{
 console.log('BIG LWA source performance audit · read only');
 console.log('Tracked: '+files.length+' files / '+(bytes/1e6).toFixed(2)+' MB');
 for(const [name,x] of Object.entries(entrypoints)){
  console.log(name+': '+x.js.count+' JS refs ('+(x.js.rawBytes/1e6).toFixed(2)+' MB source), '+
   x.css.count+' CSS refs ('+(x.css.rawBytes/1e6).toFixed(2)+' MB source)');
 }
 console.log('Top tracked areas: '+sortMap(byArea,5).map(x=>x.name+' '+(x.bytes/1e6).toFixed(1)+' MB').join('; '));
 if(warnings.length)console.warn('Review: '+warnings.join(' | '));
 else console.log('Source guardrail passed. This is NOT a browser performance result.');
}
if(args.has('--check')&&warnings.length)process.exitCode=1;
