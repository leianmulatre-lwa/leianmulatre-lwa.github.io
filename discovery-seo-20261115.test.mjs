import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {existsSync,readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('./'+path,import.meta.url),'utf8');
const topics=['discover','online-games','fare-checker','live-shows','free-knowledge','power-and-politics','connect-social-platforms'];
const url=slug=>'https://biglwa.com/'+slug+'/';
const title=page=>page.match(/<title>([^<]+)<\/title>/)?.[1]||'';
const attr=(page,key,kind='name')=>page.match(new RegExp('<meta\\s+[^>]*'+kind+'="'+key+'"[^>]*>','i'))?.[0].match(/content="([^"]+)"/)?.[1]||'';

test('Seven unique, readable public guides have descriptive titles and crawl metadata',()=>{
 const titles=new Set(),descs=new Set();
 for(const slug of topics){
  const p=read(slug+'/index.html'),t=title(p),d=attr(p,'description');
  assert.equal((p.match(/<h1(?:\s|>)/g)||[]).length,1,slug+' has one H1');
  assert(t.length>=32&&t.length<=75,slug+' title '+t.length);
  assert(d.length>=110&&d.length<=180,slug+' desc '+d.length);
  assert(!titles.has(t),slug+' unique title');titles.add(t);
  assert(!descs.has(d),slug+' unique description');descs.add(d);
  assert(p.includes('<link rel="canonical" href="'+url(slug)+'">'),slug+' canonical');
  assert.equal(attr(p,'robots'),'index,follow,max-image-preview:large',slug);
  assert.equal(attr(p,'og:url','property'),url(slug),slug);
  assert.equal(attr(p,'og:image','property'),'https://biglwa.com/assets/brand/og-biglwa.png',slug);
  assert.equal(attr(p,'twitter:card'),'summary_large_image',slug);
  assert.match(p,/href="#content">Skip to content/,slug);
  assert.match(p,/discovery-pages-20261115\.css/,slug);
  assert(p.includes('href="/discover/"'),slug+' links to discovery hub');
  assert(p.includes('href="/studio'),slug+' links to Studio');
  const json=p.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)?.[1];
  const graph=JSON.parse(json||'{}')['@graph']||[];
  assert(graph.some(x=>x['@type']==='WebPage'&&x.url===url(slug)),slug+' WebPage schema');
  assert(graph.some(x=>x['@type']==='BreadcrumbList'),slug+' breadcrumbs');
  assert(p.replace(/<[^>]+>/g,' ').split(/\s+/).length>350,slug+' meaningful content');
 }
 const css=read('discovery-pages-20261115.css');
 assert.match(css,/@media\(prefers-color-scheme:dark\)/);
 assert.match(css,/:focus-visible/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});

test('Sitemap and public internal links cover new routes without exposing private Studio to indexing',()=>{
 const sitemap=read('sitemap.xml'),about=read('about/index.html'),robots=read('robots.txt');
 const urls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
 assert.equal(new Set(urls).size,urls.length,'No duplicate sitemap entries');
 for(const slug of topics){
  assert(urls.includes(url(slug)),slug+' in sitemap');
  assert(about.includes('href="/'+slug+'/"'),slug+' linked from About');
  assert(!robots.includes('Disallow: /'+slug),slug+' is crawlable');
 }
 assert(read('free-tools/index.html').includes('href="/discover/"'));
 assert(!urls.some(x=>x.includes('/studio')||x.includes('/settings')));
 assert.match(robots,/Sitemap: https:\/\/biglwa\.com\/sitemap\.xml/);
});

test('Feature guides do not contain broken public-page links',()=>{
 const missing=[];
 for(const slug of [...topics,'free-tools']){
  const p=read(slug+'/index.html');
  for(const m of p.matchAll(/href="(\/[^"#?]*)[^"]*"/g)){
   const link=m[1];
   if(link==='/'||link==='/studio'||link==='/login'||link.startsWith('/assets/'))continue;
   const name=link.replace(/^\/+|\/+$/g,'');
   if(!existsSync(new URL('./'+name+'/index.html',import.meta.url)) &&
      !existsSync(new URL('./'+name,import.meta.url)))missing.push(slug+' -> '+link);
  }
 }
 assert.deepEqual(missing,[]);
});

test('Pages explicitly state native multiplayer, live-fare and live-show limitations',()=>{
 assert.match(read('online-games/index.html'),/not currently offer a universal native multiplayer server/);
 assert.match(read('fare-checker/index.html'),/not receive authorized live quote data yet/);
 assert.match(read('live-shows/index.html'),/not a guarantee that a channel is currently live/);
 const book=read('free-knowledge/index.html');
 assert.match(book,/Wikipedia/);assert.match(book,/Project Gutenberg/);
 assert.match(book,/primary source/);
 assert.match(read('power-and-politics/index.html'),/not a literal threat or endorsement of violence/);
 const orbit=read('connect-social-platforms/index.html');
 assert.match(orbit,/Connecting a platform is optional/);
 assert.match(orbit,/permissions and supported endpoints/);
});

test('The login laptop shares user-selected manifesto, visible links and careful mobile styling',()=>{
 for(const file of ['index.html','studio/index.html','404.html','live-studio-shell.html']){
  const s=read(file);
  assert.match(s,/a bigger you,<br><em>with control\.<\/em>/,file);
  assert.match(s,/connect your platforms\. see your social body/,file);
  assert.match(s,/class="login-laptop-copy"[\s\S]{0,800}<p class="login-manifesto-line">/,file);
  assert.match(s,/one rule: the law starts with you/,file);
  assert.match(s,/login-explore-links/,file);
  assert.match(s,/login-laptop-copy>p:not\(\.login-overline\):not\(\.login-manifesto-line\)/,file);
  assert.match(s,/login-explore-links a:focus-visible/,file);
  assert.match(s,/lwazi-discovery-extras\.js\?v=20261115-public-discovery-v6/,file);
  assert.match(s,/user-search-results\.js\?v=20261115-discovery-intent-v3/,file);
  assert.match(s,/<meta name="theme-color" content="#250c17">/,file);
 }
 assert.match(read('live-studio-payload.html'),/A bigger you\.<br><em>With control\.<\/em>/);
});

test('Lwazi directs only relevant search intents to genuine public guides and Studio',()=>{
 const scope={window:{},console,URL,Array,Map,Set,Date,Math,String};
 vm.runInNewContext(read('lwazi-discovery-extras.js'),scope,{timeout:1800});
 const cards=scope.window.BigLWADiscoveryExtras.discoveryIntentCards;
 for(const [q,slug] of [
  ['online multiplayer games','online-games'],
  ['fare checker uber lyft','fare-checker'],
  ['watch live shows','live-shows'],
  ['eat the rich','power-and-politics'],
  ['free encyclopedia','free-knowledge'],
  ['free knowledge books','free-knowledge'],
  ['connect my social platforms','connect-social-platforms']
 ])assert(cards(q).join('').includes('href="/'+slug+'/"'),q);
 assert.equal(cards('what is free will').length,0);
 assert.equal(cards('the weather today').length,0);
 assert.equal(cards('x'.repeat(220)).length,0);
 assert.match(read('user-search-results.js'),/extras\.discoveryIntentCards\?\.\(clean\)/);
});

test('Privacy and data deletion now have accurate open graph previews and schema',()=>{
 for(const slug of ['privacy','data-deletion']){
  const p=read(slug+'/index.html');
  assert.equal(attr(p,'robots'),'index,follow,max-image-preview:large',slug);
  assert.equal(attr(p,'og:url','property'),url(slug),slug);
  assert.equal(attr(p,'og:image','property'),'https://biglwa.com/assets/brand/og-biglwa.png',slug);
  assert.equal(attr(p,'twitter:card'),'summary_large_image',slug);
  assert.equal(JSON.parse(p.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)?.[1]||'{}')['@type'],'WebPage',slug);
 }
});

test('Cloudflare Pages dist includes every public guide and never rewrites it into the login SPA',()=>{
 const builder=read('build-cloudflare-pages.mjs');
 const dirs=builder.match(/const publishDirs=new Set\(\[([\s\S]*?)\]\);/)?.[1]||'';
 const required=builder.match(/for\(const required of \[([^\]]+)\]\)/)?.[1]||'';
 for(const slug of [...topics,'free-tools']){
  assert(dirs.includes("'"+slug+"'"),slug+' must be in Pages publishDirs');
  assert(required.includes("'"+slug+"/index.html'"),slug+' must be verified in actual dist');
 }
 assert.match(builder,/writeFileSync\(join\(dest,'_redirects'\)/);
 assert.doesNotMatch(builder,/\/discover \/index\.html 200|\/online-games \/index\.html 200/,'Do not rewrite public guides to the login SPA');
 assert.match(builder,/if\(existsSync\(join\(dest,hidden\)\)\)/,'Restricted backend code remains excluded');
});
