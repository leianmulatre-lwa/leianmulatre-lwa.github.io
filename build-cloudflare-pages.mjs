/* BIG LWA Cloudflare Pages release builder.
 * Deploy browser assets only. Never publish backend source, credentials,
 * test fixtures, Git history, third-party mirrors or project notes.
 * This is a safety boundary for deployment, not source-code obfuscation:
 * browser-delivered JS/CSS/HTML remains inspectable.
 */
import {readdirSync,statSync,cpSync,mkdirSync,rmSync,existsSync,writeFileSync} from 'node:fs';
import {join,extname,resolve,relative,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {installOrbitIdleArt} from './scripts/performance/orbit-idle-art.mjs';
import {generateOgImage} from './build-og-image.mjs';

const root=resolve(fileURLToPath(new URL('.',import.meta.url)));
const dest=join(root,'dist');
const publishDirs=new Set([
  'MiiEditor','about','affidavit','arcade','archive','assets','boards temp thumbnail','games bg','avatar','leian-mulatre',
  'cedarville-pnkfun1-cursive-font','cuteness-font','data-deletion',
  // Independently indexable, deliberately public, static feature guides.
  'discover','online-games','gt6-live-preview','fare-checker','live-shows','free-knowledge',
  'power-and-politics','connect-social-platforms','free-tools',
  'licenses','logout','privacy','rights','terms','settings','stars-and-stripes-font',
  'third-party','tools','wiimii'
]);
const topPublic=new Set(['404.html','index.html','robots.txt','sitemap.xml',
  'favicon.ico','apple-touch-icon.png']);
const allowedExt=new Set(['.html','.js','.css','.svg','.png','.webp','.jpg',
  '.jpeg','.gif','.avif','.ico','.ttf','.otf','.woff','.woff2','.txt','.xml',
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
const publishedGifs=[];
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
    if(ext==='.gif')publishedGifs.push(relative(dest,to).split(sep).join('/'));
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
  if(extname(name).toLowerCase()==='.gif')publishedGifs.push(name);
  count++;total+=sz;
}
for(const required of ['index.html','404.html','assets/login-curtain-film-grain-v2.webp','google0f54272f22b5ea1f.html','leian-mulatre/index.html','affidavit/index.html','free-tools/index.html','discover/index.html','online-games/index.html','gt6-live-preview/index.html','fare-checker/index.html','live-shows/index.html','free-knowledge/index.html','power-and-politics/index.html','connect-social-platforms/index.html',
  // Both Boards and Booth use these published decorative photos.
  'boards temp thumbnail/0b6e427c1b03b0a862e18119fc5a946d.jpg',
  'boards temp thumbnail/15b2005e7f894079f5461a5612b8b2ec.jpg',
  'boards temp thumbnail/1e11bab1fe6c29fc6c0eef146f0064d7.jpg',
  'boards temp thumbnail/2a7294cb4c09b2b863d15a023090d019.jpg',
  'boards temp thumbnail/5156b0b96eb6a8248e54280d2c6ba900.jpg',
  'boards temp thumbnail/61ba5b5f5dd60e46f636c9cde3479eae.jpg',
  'boards temp thumbnail/a4d68aa776aac96bb0054c628e7d3e18.jpg',
  'boards temp thumbnail/b8ce4928ebccf42c9ecc749fe0b347e9.jpg',
  'boards temp thumbnail/e642fae88aa023fc8124ead156cff138.jpg',
  'boards temp thumbnail/eecc0dabc950626bd32c902f28c4e7fa.jpg',
  'boards temp thumbnail/fb0612c7df6af82845036d2e3e06e32a.jpg',
  // Publish and verify actual repository Games wallpapers, never external imagery.
  'games bg/098fd5e1084e9f1d04223dcaa42387b9.jpg',
  'games bg/3unsgny5oup81.jpg',
  'games bg/860645.png',
  'games bg/ce4cuf5c0pp51.png',
  'games bg/games bg.jpg',
  'games bg/gta-homepage-icon.avif',
  'games bg/playstation_background_by_wintendo558_dhfen5k-fullview.jpg',
  'games bg/xbox-360-nxe-wallpapers-ai-upscaled-v0-aavwiqz5oup81.jpg']){
  if(!existsSync(join(dest,required)))throw Error('Missing required public asset: '+required);
}
for(const hidden of ['cloudflare-worker-instagram.js','new-orbit-oauth.js','public-tiktok-snapshot-worker.js','wrangler.toml','firestore.rules','.github']){
  if(existsSync(join(dest,hidden)))throw Error('Restricted development file reached public output: '+hidden);
}
if(count>19000)throw Error('Public file count exceeds Cloudflare Pages deployment safety limit.');
installOrbitIdleArt(dest,publishedGifs);
generateOgImage(join(dest,'assets/brand/og-biglwa.png'));
if(!existsSync(join(dest,'assets/brand/og-biglwa.png')))throw Error('Missing BIG LWA OG image');
// These are app routes; legal/about/settings pages keep their real HTML.
writeFileSync(join(dest,'_redirects'),
  '/studio /index.html 200\n/orbit /index.html 200\n');
console.log('BIG LWA Cloudflare release:',count,'public files,',Math.round(total/1048576)+' MiB');
console.log('Backend code, repository history, tests and developer documentation excluded.');
