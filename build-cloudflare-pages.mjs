/* BIG LWA Cloudflare Pages release builder.
 * Deploy browser assets only. Never publish backend source, credentials,
 * test fixtures, Git history, third-party mirrors or project notes.
 * This is a safety boundary for deployment, not source-code obfuscation:
 * browser-delivered JS/CSS/HTML remains inspectable.
 */
import {readdirSync,statSync,cpSync,mkdirSync,rmSync,existsSync,writeFileSync} from 'node:fs';
import {join,extname,resolve,relative,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {generateOgImage} from './build-og-image.mjs';

const root=resolve(fileURLToPath(new URL('.',import.meta.url)));
const dest=join(root,'dist');
const publishDirs=new Set([
  'MiiEditor','about','arcade','archive','assets','avatar',
  'cedarville-pnkfun1-cursive-font','cuteness-font','data-deletion',
  'licenses','logout','privacy','settings','stars-and-stripes-font',
  'third-party','tools','wiimii'
]);
const topPublic=new Set(['404.html','index.html','robots.txt','sitemap.xml',
  'favicon.ico','apple-touch-icon.png']);
const allowedExt=new Set(['.html','.js','.css','.svg','.png','.webp','.jpg',
  '.jpeg','.gif','.ico','.ttf','.otf','.woff','.woff2','.txt','.xml',
  '.json','.webmanifest','.swf','.wasm','.data','.mp3','.wav','.ogg',
  '.mp4','.webm','.b64','.bin']);
const internalFiles=new Set([
  'cloudflare-worker-instagram.js','new-orbit-oauth.js',
  'public-tiktok-snapshot-worker.js','wrangler.toml','firebase.json',
  'firestore.rules','AGENTS.md','EDITOR-SOURCES.md',
  'TOOLS-WORKSHOP-SOURCES.md','CNAME'
]);
const maxBytes=25*1024*1024;
let count=0,total=0;
rmSync(dest,{recursive:true,force:true});
mkdirSync(dest,{recursive:true});
function copyPublic(src,dst){
  for(const dirent of readdirSync(src,{withFileTypes:true})){
    if(dirent.name.startsWith('.') || dirent.name==='dist')continue;
    const from=join(src,dirent.name),to=join(dst,dirent.name);
    if(dirent.isSymbolicLink())continue;
    if(dirent.isDirectory()){
      mkdirSync(to,{recursive:true});
      copyPublic(from,to);
      continue;
    }
    if(!dirent.isFile())continue;
    const ext=extname(dirent.name).toLowerCase();
    if(!allowedExt.has(ext)&&!(ext==='.md'&&['licenses','third-party'].includes(relative(root,from).split(sep)[0])))continue;
    if(dirent.name.endsWith('.map') || dirent.name.endsWith('.test.js'))continue;
    const sz=statSync(from).size;
    if(sz>maxBytes)throw Error('Cloudflare Pages asset exceeds 25MiB: '+relative(root,from));
    mkdirSync(dst,{recursive:true});
    cpSync(from,to);
    count++;total+=sz;
  }
}
for(const dirent of readdirSync(root,{withFileTypes:true})){
  const name=dirent.name;
  if(dirent.isSymbolicLink())continue;
  if(dirent.isDirectory()){
    if(publishDirs.has(name)){
      const target=join(dest,name);
      mkdirSync(target,{recursive:true});
      copyPublic(join(root,name),target);
    }
    continue;
  }
  if(!dirent.isFile()||internalFiles.has(name))continue;
  if(!topPublic.has(name)&&!allowedExt.has(extname(name).toLowerCase()))continue;
  if(name.endsWith('.test.js')||name.endsWith('.spec.js'))continue;
  const sz=statSync(join(root,name)).size;
  if(sz>maxBytes)throw Error('Oversized top-level website asset: '+name);
  cpSync(join(root,name),join(dest,name));
  count++;total+=sz;
}
for(const required of ['index.html','404.html','assets/login-curtain-film-grain-v2.webp']){
  if(!existsSync(join(dest,required)))throw Error('Missing required public asset: '+required);
}
for(const hidden of ['cloudflare-worker-instagram.js','new-orbit-oauth.js','public-tiktok-snapshot-worker.js','wrangler.toml','firestore.rules','.github']){
  if(existsSync(join(dest,hidden)))throw Error('Restricted development file reached public output: '+hidden);
}
if(count>19000)throw Error('Public file count exceeds Cloudflare Pages deployment safety limit.');
generateOgImage(join(dest,'assets/brand/og-biglwa.png'));
if(!existsSync(join(dest,'assets/brand/og-biglwa.png')))throw Error('Missing BIG LWA OG image');
// These are app routes; legal/about/settings pages keep their real HTML.
writeFileSync(join(dest,'_redirects'),
  '/studio /index.html 200\n/orbit /index.html 200\n');
console.log('BIG LWA Cloudflare release:',count,'public files,',Math.round(total/1048576)+' MiB');
console.log('Backend code, repository history, tests and developer documentation excluded.');
