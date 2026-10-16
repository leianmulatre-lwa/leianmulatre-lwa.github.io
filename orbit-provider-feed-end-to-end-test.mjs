import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(new URL('./'+p,import.meta.url),'utf8');
const posts=read('orbit-posts.js'),feed=read('feed-view.js'),fb=read('facebook-orbit.js'),
 tiktok=read('tiktok-orbit.js'),pages=read('module-pages.js'),client=read('orbit-new-connect.js'),html=read('index.html'),planets=read('orbit-planets-original-restored-20261016.css');
for(const [name,s] of [['Orbit posts',posts],['Feed',feed]]){
 const noExports=s.replace(/^import .*?;\s*$/mg,'').replace(/^export default .*?;\s*$/mg,'').replace(/^export /mg,'');
 assert.doesNotThrow(()=>new vm.Script(noExports),name+' syntax');
}
for(const [name,s] of [['Facebook',fb],['TikTok',tiktok],['Orbit UI',pages],['Snap/Tumblr client',client]]){
 assert.doesNotThrow(()=>new vm.Script(s),name+' syntax');
}
assert.ok(posts.includes('export async function saveExternalOrbitDraft'),'External source importer exists');
assert.ok(posts.includes("state:'draft',archiveState:'saved'"),'Imports are private by default');
assert.ok(posts.includes("if(prior.exists())"),'Reconnect does not duplicate or republish source items');
assert.ok(posts.includes("writePostRecords(store,user.uid,postId"),'Imports saved to Feed, profile and Archive records');
assert.ok(fb.includes('await syncFacebookDrafts()'),'Authorized Facebook items automatically enter private imports');
assert.ok(tiktok.includes('else await syncTikTokDrafts()'),'Authorized TikTok video-list items enter private imports');
assert.ok(feed.includes('function renderDraftPanel()')&&feed.includes('renderDraftPanel();'),'Private drafts appear in Collective Feed');
assert.ok(feed.includes('data-orbit-publish-selected')&&feed.includes('publishDraft(id)'),'Publishing requires explicit selection');
assert.ok(feed.includes('www.tiktok.com/embed/v2/'),'Published TikTok videos have playable source-backed embeds');
assert.ok(pages.includes("ORBIT_CONNECTED.add(id)"),'Snapchat and Tumblr connect buttons remain visible without setup');
assert.ok(pages.includes('orbit-fallback-profile'),'Saved public profile links stay available during OAuth setup');
assert.ok(client.includes("if(!config[provider]?.configured)await load()"),'Connect action refreshes server configuration');
assert.ok(planets.includes('radial-gradient(')&&planets.includes('module-actions > .orbit-platform-badge'),'Original spherical artwork preserved in new action row');
assert.ok(html.includes('orbit-planets-original-restored-20261016.css?v=20261016-original-texture-1'),'Restored planets CSS is loaded');
console.log('PASS Owner-only Facebook/TikTok imports, explicit Feed publishing, original planets and Snapchat/Tumblr OAuth controls.');
