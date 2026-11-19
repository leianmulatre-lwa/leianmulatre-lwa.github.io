import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
const require=createRequire(import.meta.url),{JSDOM}=require('jsdom');
const read=path=>readFileSync(new URL('./'+path,import.meta.url),'utf8');
const shells=['index.html','studio/index.html','404.html','live-studio-shell.html'];
const attr=(page,key,kind='name')=>page.match(new RegExp('<meta\\s+[^>]*'+kind+'="'+key+'"[^>]*>','i'))?.[0].match(/content="([^"]+)"/)?.[1]||'';
const config=JSON.parse(read('data/discovery/topics.json'));
const sources=JSON.parse(read('data/discovery/sources.json'));
const snapshot=JSON.parse(read('assets/discovery/latest.json'));
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));

test('GT6 guide has crawlable metadata and source-honest copy',()=>{
 const page=read('gt6-live-preview/index.html');
 assert.equal((page.match(/<h1(?:\s|>)/g)||[]).length,1);
 assert.match(page,/<title>Watch GT6 Lives With People Online \| BIG LWA<\/title>/);
 assert.match(attr(page,'description'),/watch gt6 lives with people online/i);
 assert.equal(attr(page,'robots'),'index,follow,max-image-preview:large');
 assert.equal(attr(page,'canonical','property')||page.match(/<link rel="canonical" href="([^"]+)"/)?.[1],'https://biglwa.com/gt6-live-preview/');
 assert.equal(attr(page,'og:url','property'),'https://biglwa.com/gt6-live-preview/');
 assert.equal(attr(page,'twitter:card'),'summary_large_image');
 assert.match(page,/watch gt6 lives with people online/i);
 assert.match(page,/BIG LWA does not have a trustworthy GT6 live-status feed/);
 assert.match(page,/not a ranking, viewer count or live-status check/);
 assert.match(page,/No “live now” badge without proof/);
 assert.match(page,/They do not create a GT6 lobby/);
 assert.doesNotMatch(page,/\b\d[\d,]*\s+(?:people|viewers)\s+(?:online|watching)\b/i);
 assert.doesNotMatch(page,/<iframe/i);
 const structured=JSON.parse(page.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)?.[1]||'{}');
 assert.equal(structured['@graph'][0]['@type'],'WebPage');
 assert.equal(structured['@graph'][0]['url'],'https://biglwa.com/gt6-live-preview/');
 assert.equal(structured['@graph'][1]['@type'],'BreadcrumbList');
});

test('GT6 route is wired into sitemap, public guides, builder and four shells',()=>{
 assert.match(read('sitemap.xml'),/<url><loc>https:\/\/biglwa\.com\/gt6-live-preview\/<\/loc><\/url>/);
 for(const file of ['about/index.html','discover/index.html','online-games/index.html']){
  assert.match(read(file),/href="\/gt6-live-preview\/"/,file);
 }
 const builder=read('build-cloudflare-pages.mjs');
 const dirs=builder.match(/const publishDirs=new Set\(\[([\s\S]*?)\]\);/)?.[1]||'';
 const required=builder.match(/for\(const required of \[([^\]]+)\]\)/)?.[1]||'';
 assert.match(dirs,/'gt6-live-preview'/);
 assert.match(required,/'gt6-live-preview\/index\.html'/);
 for(const file of shells){
  const page=read(file);
  assert.match(page,/lwazi-discovery-extras\.js\?v=20261115-public-discovery-v6&gt6=20261118-1/,file);
  assert.match(page,/user-search-results\.js\?v=20261115-discovery-intent-v3&gt6=20261118-1/,file);
 }
});

test('Configured trend topics stay local, finite and source-attributed',()=>{
 assert.equal(config.v,'20261118-1');
 assert.match(config.note,/No arbitrary URLs, no viewer counts, no ranking/);
 assert.deepEqual(config.topics.map(topic=>topic.id),
  ['gt6-live','live-gaming','storage-transfer','file-type-changers','online-video-editors']);
 const sourceIds=new Set(sources.channels.map(source=>source.id));
 for(const topic of config.topics){
  assert.match(topic.guide,/^\/[a-z0-9-]+\/$/,topic.id);
  assert(existsSync(new URL('.'+topic.guide+'index.html',import.meta.url)),topic.guide);
  assert(topic.terms.length>0,topic.id);
  for(const sourceId of topic.sourceIds)assert(sourceId==='*'||sourceIds.has(sourceId),topic.id+' allows '+sourceId);
  assert(!topic.terms.some(term=>/https?:|javascript:/i.test(term)),topic.id+' has no URL pattern');
 }
 const gt6=config.topics.find(topic=>topic.id==='gt6-live');
 assert.deepEqual(gt6.sourceIds,['markiplier','cory','jacksepticeye','dream','cupquake']);
 assert(gt6.terms.some(term=>/gt6/i.test(term)));
 assert(gt6.terms.some(term=>/gta/i.test(term)));
 assert.doesNotMatch(JSON.stringify(config),/\blive now\b/i);
});

test('Discovery refresh contract keeps topic scans honest and provenance-bearing',()=>{
 const python=read('scripts/refresh-discovery.py');
 assert.match(python,/def scan_topics\(items, config\):/);
 assert.match(python,/result\['trends'\] = scan_topics/);
 assert.match(python,/sourceId=source\['id'\]/);
 assert.match(python,/kind='video'/);
 assert.match(python,/kind='story'/);
 assert(Array.isArray(snapshot.trends));
 assert.deepEqual(snapshot.trends.map(trend=>trend.id),config.topics.map(topic=>topic.id));
 for(const trend of snapshot.trends){
  assert.equal(trend.generatedAt,snapshot.generatedAt,trend.id);
  assert(Number.isInteger(trend.totalMatches),trend.id);
  assert(trend.items.length<=6,trend.id);
  assert.match(trend.guide,/^\/[a-z0-9-]+\/$/,trend.id);
  for(const item of trend.items){
   assert.match(item.url,/^https:\/\//,trend.id);
   assert(item.source&&item.sourceId&&item.publishedAt,trend.id);
   for(const forbidden of ['rank','viewerCount','viewers','liveStatus','liveNow'])assert(!(forbidden in item),forbidden);
  }
 }
 for(const video of snapshot.videos)assert(video.sourceId&&video.kind==='video');
 for(const story of snapshot.stories)assert(story.kind==='story');
});

test('L\'wazi sends only matching gaming and practical-intent queries to honest guides',()=>{
 const scope={window:{},console,URL,Array,Map,Set,Date,Math,String};
 vm.runInNewContext(read('lwazi-discovery-extras.js'),scope,{timeout:2000});
 const extras=scope.window.BigLWADiscoveryExtras;
 for(const query of ['watch gt6 lives with people online','gta vi live stream','grand theft auto vi gameplay']){
  assert.match(extras.discoveryIntentCards(query).join(''),/href="\/gt6-live-preview\/"/,query);
 }
 assert.equal(extras.discoveryIntentCards('gta 5 online').filter(card=>card.includes('/gt6-live-preview/')).length,0);
 for(const [query,text] of [
  ['storage transfer work','BIG LWA is not a general cloud-migration service'],
  ['file type changer','none is a universal file converter'],
  ['online video editor','not a full online video editor']
 ])assert.match(extras.toolIntentCards(query).join(''),new RegExp(text),query);
});

async function renderFeed(payload,{ok=true}={}){
 const dom=new JSDOM('<!doctype html><div id="gt6RecentSources"></div>',{
  url:'https://biglwa.com/gt6-live-preview/',runScripts:'outside-only'
 });
 const w=dom.window,calls=[];
 w.fetch=async (url,options)=>{
  calls.push({url,options});
  return {ok,json:async()=>payload};
 };
 w.eval(read('gt6-live-preview-20261118.js'));
 await tick();await tick();
 return {dom,calls,host:w.document.getElementById('gt6RecentSources')};
}

test('GT6 renderer shows attributed recent items and filters unsafe feed rows',async()=>{
 const generatedAt='2026-11-18T02:02:01.734524+00:00';
 const payload={generatedAt,trends:[{id:'gt6-live',items:[
  {title:'GT6 gameplay from an original channel',url:'https://www.youtube.com/watch?v=abcdefghijk',source:'Markiplier',sourceId:'markiplier',publishedAt:'2026-11-18T01:00:00+00:00'},
  {title:'Disallowed source',url:'https://www.youtube.com/watch?v=abcdefghijL',source:'Other',sourceId:'other',publishedAt:'2026-11-18T01:01:00+00:00'},
  {title:'Insecure source link',url:'http://www.youtube.com/watch?v=abcdefghijM',source:'CoryxKenshin',sourceId:'cory',publishedAt:'2026-11-18T01:02:00+00:00'},
  {title:'Off-host source link',url:'https://example.invalid/watch',source:'Dream',sourceId:'dream',publishedAt:'2026-11-18T01:03:00+00:00'}
 ]}]};
 const {dom,calls,host}=await renderFeed(payload);
 assert.equal(calls.length,1);
 assert.match(calls[0].url,/latest\.json\?topics=20261118-1/);
 assert.equal(calls[0].options.cache,'no-store');
 assert.match(host.textContent,/not a ranking, viewer count or live-status check/);
 assert.equal(host.querySelectorAll('.gt6-feed-item').length,1);
 const link=host.querySelector('.gt6-feed-item a');
 assert.match(link.href,/youtube\.com\/watch\?v=abcdefghijk/);
 assert.equal(link.target,'_blank');
 assert.equal(link.rel,'noopener noreferrer');
 assert.match(host.querySelector('.gt6-feed-byline').textContent,/^Markiplier · /);
 assert.doesNotMatch(host.textContent,/Disallowed source|Insecure source link|Off-host source link/);
 dom.window.close();

 const empty=await renderFeed({generatedAt,trends:[{id:'other',items:[]}]});
 assert.match(empty.host.textContent,/No GT6-tagged items were seen in the configured source scan/);
 empty.dom.window.close();

 const unavailable=await renderFeed(null,{ok:false});
 assert.match(unavailable.host.textContent,/configured source scan is temporarily unavailable/);
 unavailable.dom.window.close();
});
