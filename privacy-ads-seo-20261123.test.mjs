import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('./'+p,import.meta.url),'utf8');
test('first-party privacy UI and sponsor guard parse without loading Google ads',()=>{
 const consent=read('privacy-consent-20261123.js');
 const ads=read('ads-privacy-config-20261123.js');
 assert.doesNotThrow(()=>new vm.Script(consent));
 assert.doesNotThrow(()=>new vm.Script(ads));
 assert.match(consent,/analytics:false,personalization:false/);
 assert.match(consent,/Reject optional/);
 assert.match(consent,/biglwa:privacy-changed/);
 assert.match(consent,/not automatically uploaded/i);
 assert.match(ads,/enabled:false,certifiedCmpPublished:false,publisherApproved:false/);
 assert.match(ads,/Sponsored · Advertisement/);
 assert.match(ads,/profile-photos/);
 assert.doesNotMatch(ads,/ca-pub-\d+/);
});
test('Studio boot injects first-party preferences without advertising tags',()=>{
 const home=read('index.html');
 assert.match(home,/privacy-consent-20261123\.js/);
 assert.match(home,/ads-privacy-config-20261123\.js/);
 assert.match(home,/ads-sponsor-20261123\.css/);
 assert.match(home,/No BIG LWA subscription paywall/);
});
test('settings and public routes expose privacy and rejection',()=>{
 for(const path of ['settings/index.html','privacy/index.html','about/index.html','legal/index.html','discover/index.html','free-tools/index.html','online-games/index.html','free-media-player/index.html','free-content-customization/index.html','advertise/index.html']){
  const html=read(path);
  assert.match(html,/privacy-consent-20261123\.js/,path);
  assert.match(html,/privacy-consent-20261123\.css/,path);
 }
 assert.match(read('settings/index.html'),/data-open-biglwa-privacy/);
 assert.match(read('privacy/index.html'),/not a certified advertising consent platform/i);
});
test('feed omits paid records and sponsored inventory stays separate',()=>{
 const feed=read('feed-view.js');
 assert.match(feed,/filter\(post=>!isSponsoredPost\(post\)\)/);
 assert.match(feed,/previewPosts\.filter\(post=>!isSponsoredPost\(post\)/);
 assert.match(read('ads-sponsor-20261123.css'),/background:#fff!important/);
 assert.match(read('veve.js'),/No sponsored placements/);
});
test('distinct SEO guides are canonical, discoverable and truthful',()=>{
 const sitemap=read('sitemap.xml');
 const discover=read('discover/index.html');
 for(const page of ['free-media-player','free-content-customization','advertise']){
  const html=read(page+'/index.html');
  assert(html.includes('href="https://biglwa.com/'+page+'/"'));
  assert(sitemap.includes('<loc>https://biglwa.com/'+page+'/</loc>'));
  assert.match(html,/no BIG LWA subscription paywall|not currently active|subscription paywall|without a BIG LWA paywall/i);
 }
 assert.match(discover,/href="\/free-media-player\/"/);
 assert.match(discover,/href="\/free-content-customization\/"/);
 assert(!sitemap.includes('<loc>https://biglwa.com/studio/</loc>'));
});