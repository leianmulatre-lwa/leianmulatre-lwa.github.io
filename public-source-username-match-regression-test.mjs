import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';

const read=file=>readFileSync(new URL('./'+file,import.meta.url),'utf8');
const worker=read('public-tiktok-snapshot-worker.js');
const external=read('tiktok-external-stats.js');
const showcase=read('profile-social-showcase.js');
const home=read('index.html');
const story=read('o-storyclone-com/index.html');

assert.doesNotThrow(()=>new Script(external),'TikTok auto stats parses');
assert.doesNotThrow(()=>new Script(showcase),'Spotlight and Highlight showcase parses');
const clean=worker.replace('export {parsePublicProfile,parsePublicSnapchat};','')
  .replace('export default','const __worker =');
assert.doesNotThrow(()=>new Script(clean),'Public-source Worker parses');
const {parsePublicProfile,parsePublicSnapchat,parseTikTokPublicPosts}=new Function(clean+
  '\nreturn {parsePublicProfile,parsePublicSnapchat,parseTikTokPublicPosts};')();

const ttHtml='<h1>@test.name</h1><section>Profile metrics</section>'+
 '<div>Followers</div><p>12,345</p><div>Following</div><p>99</p>'+
 '<div>Total videos</div><p>101</p>';
assert.equal(parsePublicProfile(ttHtml,'test.name').followers,12345);
assert.equal(parsePublicProfile('<title>test.name – TikTok Performances & Analytics – TokPortal</title><section>Profile metrics</section><div>Followers</div><p>12,345</p>','test.name')?.followers,12345,
 'A real indexed TokPortal page may identify its user in the document title');
assert.equal(parsePublicProfile('<h1><span>@</span><b>test.name</b></h1><section>Profile metrics</section><div>Followers</div><p>12,345</p>','test.name')?.followers,12345,
 'Split username headings must still match exactly');
assert.equal(parsePublicProfile(ttHtml,'testXname'),null,
 'A punctuation mismatch must never count as an identity match');
assert.equal(parsePublicProfile('<h1>@different</h1>Followers 123','test.name'),null);

const ownPost={ItemModule:{'7380029000012345678':{
 id:'7380029000012345678',author:{uniqueId:'my.creator'},
 desc:'Found my post',video:{cover:'https://p16-tiktokcdn.com/cover.jpg'}},
 '7380029000012345679':{id:'7380029000012345679',
 author:{uniqueId:'another.creator'},desc:'Not mine'}}};
const html='<script id="SIGI_STATE" type="application/json">'+JSON.stringify(ownPost)+'</script>';
assert.equal(parseTikTokPublicPosts(html,'my.creator').length,1,'Only exact public-account video matches import');
assert.equal(parseTikTokPublicPosts(html,'my.creator')[0].sourceUrl,
 'https://www.tiktok.com/@my.creator/video/7380029000012345678');
assert.equal(parseTikTokPublicPosts(html,'wrong.creator').length,0,'Do not import other accounts');
assert.equal(parseTikTokPublicPosts('No public hydration','my.creator').length,0,'No invented public videos');
assert.ok(worker.includes('/posts'), 'TikTok public post discovery route exists');
const matched=parsePublicSnapchat(story,'leianmulatre');
assert.equal(matched?.handle,'leianmulatre');
assert.equal(matched.items.length,3,'The supplied public Snapchat fixture lists three Spotlights');
assert.equal(parsePublicSnapchat(story,'leianstanley'),null,
 'Source page title must agree with the requested account username');
assert.ok(matched.items.every(x=>x.mediaUrl.startsWith('https://cf-st.sc-cdn.net/')));
assert.ok(!showcase.includes('localStorage.setItem(key(),JSON.stringify(snapItems)'),
 'Expiring source media must not be stored as owned uploads');

assert.ok(external.includes('data?.handle?.toLowerCase()!==account.handle.toLowerCase()'),
 'Never accept public stats for a different linked account');
assert.ok(external.includes('refresh(false)'), 'Try public stats on connect/link sync');
assert.ok(external.includes('verifiedFromProvider:false,publicSnapshot:true'),
 'Third-party counts must be visibly external');
assert.ok(home.includes('/tiktok-external-stats.js?v=20261023-username-public-match-1'));
assert.ok(home.includes('/profile-social-showcase.js?v=20261023-banner-story-rings-2'));
console.log('Public TikTok/Snapchat username-match checks passed.');
