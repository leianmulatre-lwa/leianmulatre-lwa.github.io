#!/usr/bin/env node
/* BIG LWA guarded public release packager.
   node scripts/performance/build-public-site.mjs --dry-run
   node scripts/performance/build-public-site.mjs --build
   Does not rewrite tracked files. Cleans only its generated dist/public directory.
*/
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const destination=path.join(root,'dist','public');
const build=process.argv.includes('--build');
const dry=process.argv.includes('--dry-run');
if(build===dry)throw Error('Choose exactly one of --dry-run or --build');
const neverPublic=['.git/','node_modules/','dist/','.github/','docs/','seo-audits/','qa/','evals/','scripts/','third_party/','screenshots/'];
const mirrors=['www-tokportal-com/','igexport-com/','ssstik-io/','igcomment-com/','o-storyclone-com/'];
const excludeFiles=new Set(['.gitignore','.firebaserc','AGENTS.md','README.md','wrangler.toml','CITATION.cff']);
const isTestSource=p=>/(?:^|\/)(?:[^/]+\.test\.mjs|[^/]+-test\.mjs|test_[^/]+\.py)$/.test(p);
const list=[];
function walk(dir=''){
 for(const entry of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){
  const rel=path.join(dir,entry.name).split(path.sep).join('/');
  if(neverPublic.some(p=>rel===p.slice(0,-1)||rel.startsWith(p)))continue;
  if(entry.isSymbolicLink())continue;
  if(entry.isDirectory())walk(rel);
  else if(entry.isFile())list.push({path:rel,size:fs.statSync(path.join(root,rel)).size});
 }
}
walk();
const isMirror=p=>mirrors.some(m=>p.startsWith(m));
const runtime=list.filter(f=>!isMirror(f.path)&&!isTestSource(f.path)&&/\.(?:html|js|css|json|svg|mjs)$/i.test(f.path));
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const mirrorReferences=[];
for(const prefix of mirrors){
 const rootName=prefix.slice(0,-1);
 const references=runtime.filter(f=>{
  const text=read(f.path);
  return text.includes('/'+prefix)||text.includes('"'+prefix)||text.includes("'"+prefix);
 }).map(f=>f.path).slice(0,12);
 if(references.length)mirrorReferences.push({prefix:rootName,referencedFrom:references});
}
const retained=new Set(mirrorReferences.map(r=>r.prefix+'/'));
const final=list.filter(f=>{
 if(excludeFiles.has(f.path)||isTestSource(f.path))return false;
 return !isMirror(f.path)||mirrors.some(m=>f.path.startsWith(m)&&retained.has(m));
});
const included=new Set(final.map(f=>f.path));
const originallyPresent=new Set(list.map(f=>f.path));
const essential=['index.html','studio/index.html','404.html','CNAME','robots.txt','sitemap.xml',
 'legal/index.html','about/index.html','privacy/index.html','terms/index.html',
 'rights/index.html','affidavit/index.html','map-app.html',
 'assets/studio-defaults/map-bikini-bottom-fallback.webp',
 // Never ship the Games rotator without its original image collection.
 'games bg/098fd5e1084e9f1d04223dcaa42387b9.jpg',
 'games bg/3unsgny5oup81.jpg',
 'games bg/860645.png',
 'games bg/ce4cuf5c0pp51.png',
 'games bg/games bg.jpg',
 'games bg/gta-homepage-icon.avif',
 'games bg/playstation_background_by_wintendo558_dhfen5k-fullview.jpg',
 'games bg/xbox-360-nxe-wallpapers-ai-upscaled-v0-aavwiqz5oup81.jpg'];
const missingEssential=essential.filter(p=>!included.has(p));
const missingRefs=[];
const preexistingMissingRefs=[];
const pathRe=/(?:src|href)\s*=\s*["'](\/[^"'<>\s]+?\.(?:js|css|html))(?:\?[^"']*)?["']/gi;
for(const f of final){
 if(!/\.(?:html|js)$/i.test(f.path))continue;
 const src=read(f.path);let match;
 while((match=pathRe.exec(src))){
  const dep=match[1].replace(/^\/+/,'');
  if(!included.has(dep)&&!included.has(dep.replace(/\/$/,'')+'/index.html')){
   const issue={from:f.path,dependency:dep};
   if(originallyPresent.has(dep)||originallyPresent.has(dep.replace(/\/$/,'')+'/index.html'))missingRefs.push(issue);
   else preexistingMissingRefs.push(issue);
  }
 }
}
const excluded=list.filter(f=>!included.has(f.path));
const report={
 kind:'public-release-packager-v1',mode:build?'build':'dry-run',
 includedFiles:final.length,includedBytes:final.reduce((sum,f)=>sum+f.size,0),
 excludedFiles:excluded.length,excludedBytes:excluded.reduce((sum,f)=>sum+f.size,0),
 mirrorReferences,missingEssential,missingRefs:missingRefs.slice(0,50),
 preexistingMissingRefs:preexistingMissingRefs.slice(0,30),
 restoredEditorsIncluded:included.has('bigapps/manifest.json'),
 warning:'Static references are not a complete runtime dependency graph. Signed-in browser testing is required before production.'
};
if(missingEssential.length||missingRefs.length){
 console.error(JSON.stringify(report,null,2));
 throw Error('Release packaging refused: required route or reference is missing.');
}
if(build){
 if(destination!==path.resolve(root,'dist/public'))throw Error('Unsafe artifact destination');
 fs.rmSync(destination,{recursive:true,force:true});
 for(const f of final){
  const target=path.join(destination,f.path);
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.copyFileSync(path.join(root,f.path),target);
 }
 fs.writeFileSync(path.join(destination,'release-inventory.json'),
  JSON.stringify({schema:1,fileCount:final.length,bytes:report.includedBytes,restoredEditorsIncluded:report.restoredEditorsIncluded},null,2)+'\n');
}
console.log(JSON.stringify(report,null,2));
