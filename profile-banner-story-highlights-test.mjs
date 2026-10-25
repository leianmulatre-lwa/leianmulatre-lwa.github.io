import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {JSDOM}=require('jsdom');
const code=readFileSync(new URL('./profile-social-showcase.js',import.meta.url),'utf8');
const index=readFileSync(new URL('./index.html',import.meta.url),'utf8');
assert.ok(index.includes('/profile-social-showcase.js?v=20261024-auto-connected-showcase-5'));

const dom=new JSDOM('<!doctype html><html><head></head><body>'+
'<main id="studioApp"><article class="profile-card">'+
'<div class="profile-copy"><div class="profile-name-line"><h1>@founder</h1></div>'+
'<div class="stats"><span data-profile-stat="followers">100 Followers</span>'+
'<span data-profile-stat="following">20 Following</span>'+
'<span data-profile-stat="connections">2 Connections</span>'+
'<span data-profile-stat="reach">100 Reach</span>'+
'<span data-profile-stat="likes"><b>50</b> Likes</span></div>'+
'</div></article></main></body></html>',{
 url:'https://biglwa.com/studio',pretendToBeVisual:true,runScripts:'outside-only'
});
const w=dom.window,doc=w.document;
w.__biglwaIdentity={uid:'uid-test'};
w.BigLWAOrbitOAuth={get:id=>id==='snapchat'?{verifiedFromProvider:true,username:'leianmulatre'}:null};
w.__biglwaConnections={connections:()=>({instagram:{username:'leianstanley'}})};
w.BigLWAOrbitAccountLinks={get:()=>({snapchat:'https://www.snapchat.com/add/leianmulatre'})};
w.localStorage.setItem('biglwaPublicShowcaseV1:uid-test',JSON.stringify([
 {platform:'instagram',kind:'Highlight',url:'https://www.instagram.com/stories/highlights/1234567890123456'}
]));
const media='https://cf-st.sc-cdn.net/d/public-video-1';
w.fetch=async url=>({ok:true,json:async()=>({
 matchedHandle:true,handle:'leianmulatre',available:true,
 items:[{kind:'Spotlight',mediaUrl:media},{kind:'Spotlight',mediaUrl:'https://cf-st.sc-cdn.net/d/public-video-2'}]
})});
w.eval(code);
doc.dispatchEvent(new w.Event('DOMContentLoaded'));
await new Promise(resolve=>setTimeout(resolve,360));
const card=doc.querySelector('#studioApp .profile-card');
const stats=card.querySelector('.stats'), likes=stats.querySelector('[data-profile-stat="likes"]');
const row=card;
const rail=card.querySelector('[data-biglwa-public-showcase]');
assert.ok(row,'Profile banner exists');
assert.equal(stats.parentElement,card.querySelector('.profile-copy'),'Metrics must remain in original profile copy');
assert.equal(rail.parentElement,card,'Highlights must mount on the banner, not beside Likes');
assert.ok(likes,'Likes remains intact');
assert.equal(rail.querySelector('.biglwa-stories-track').lastElementChild.dataset.source,'new','Add highlight moves after other highlights');
assert.ok(rail.querySelectorAll('.biglwa-story-bubble[data-source="snapchat"]').length>=2,'Public Snapchat stories become circles');
assert.equal(rail.querySelectorAll('.biglwa-story-bubble[data-source="instagram"]').length,1,'Saved Instagram Highlight gets its own ring');
assert.equal(rail.querySelectorAll('.biglwa-story-bubble[data-source="new"]').length,1,'Add ring present');
assert.equal(card.querySelector('[data-biglwa-public-showcase-editor]'),null,'Old editor no longer sits in the banner');
assert.ok(doc.body.querySelector('[data-biglwa-public-showcase-editor]'),'Editor is in accessible floating layer');
const spotlight=rail.querySelector('.biglwa-story-bubble[data-source="snapchat"]');
spotlight.click();
assert.ok(doc.querySelector('.biglwa-story-popup video'),'Spotlight circle opens source-hosted video');
assert.equal(doc.querySelector('.biglwa-story-popup video').getAttribute('src'),media);
doc.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
assert.equal(doc.querySelector('.biglwa-story-popup'),null,'Escape closes Story popup');
rail.querySelector('.biglwa-story-bubble[data-source="new"]').click();
assert.ok(doc.querySelector('[data-biglwa-public-showcase-editor][open]'),'New bubble opens Highlights editor');
doc.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
assert.equal(doc.querySelector('[data-biglwa-public-showcase-editor]').open,false);
dom.window.close();

// A fresh member with only authorized account identity + one stored public
// Snapchat URL receives their original Highlight and Spotlight automatically.
// No platform-specific paste widget or second account login is required.
const autoDom=new JSDOM('<!doctype html><html><head></head><body>'+
 '<main id="studioApp"><article class="profile-card"><div class="profile-copy">'+
 '<div class="stats"><span data-profile-stat="likes">Likes</span></div>'+
 '</div></article></main></body></html>',{
 url:'https://biglwa.com/studio',pretendToBeVisual:true,runScripts:'outside-only'
});
const aw=autoDom.window,ad=aw.document;
aw.__biglwaIdentity={uid:'owner-two'};
aw.__biglwaInstagramOrbit={state:{connected:true,
 profile:{username:'owner.ig',profile_picture_url:'https://example.org/owned-avatar.jpg'},
 media:[{id:'highlight-1',username:'owner.ig',
 permalink:'https://www.instagram.com/stories/highlights/1234567890123456/'}]}};
aw.__biglwaConnections={connections:()=>({instagram:{username:'owner.ig'}})};
aw.BigLWAOrbitOAuth={get:id=>id==='snapchat'?{verifiedFromProvider:true,username:''}:null};
const urls={snapchat:'https://www.snapchat.com/add/snapowner'};
aw.BigLWAOrbitAccountLinks={ready:()=>true,owner:()=> 'owner-two',get:()=>({...urls}),
 save:async(provider,url)=>{urls[provider]=url;return true}};
aw.fetch=async()=>({ok:true,json:async()=>({available:true,matchedHandle:true,handle:'snapowner',
 items:[{kind:'Spotlight',mediaUrl:'https://cf-st.sc-cdn.net/d/auto-spotlight'}]})});
aw.eval(code);
ad.dispatchEvent(new aw.Event('DOMContentLoaded'));
await new Promise(resolve=>setTimeout(resolve,400));
const banner=ad.querySelector('#studioApp .profile-card');
const autoIg=banner.querySelectorAll('.biglwa-story-bubble[data-source="instagram"]');
const autoSnap=banner.querySelectorAll('.biglwa-story-bubble[data-source="snapchat"]');
assert.equal(autoIg.length,1,'A genuine Highlight permalink returned by the connected IG account auto-populates');
assert.equal(autoSnap.length,1,'Snapchat public username sourced from a saved profile URL fetches Spotlight automatically');
assert.equal(urls.instagram,'https://www.instagram.com/owner.ig/','IG OAuth public URL saved to account without paste');
assert.ok(autoIg[0].querySelector('.biglwa-story-inner img'),'Use authenticated IG profile avatar, no IG logo');
assert.equal(banner.querySelector('.biglwa-stories-track').lastElementChild.dataset.source,'new','Plus stays last');
assert.equal(ad.querySelector('[data-biglwa-public-showcase-editor] form').parentElement.open,false,
 'Manual link fallback is collapsed by default');
autoSnap[0].click();
assert.equal(ad.querySelector('.biglwa-story-popup video')?.getAttribute('src'),
 'https://cf-st.sc-cdn.net/d/auto-spotlight');
// No pinned Highlight IDs available: the connected IG profile remains a
// native BIG LWA dialog rather than unexpectedly opening an external tab.
aw.__biglwaInstagramOrbit.state.media=[];
aw.dispatchEvent(new aw.Event('biglwa:instagram-restored'));
await new Promise(resolve=>setTimeout(resolve,150));
const fallback=ad.querySelector('.biglwa-story-bubble[data-source="instagram"]');
assert.ok(fallback,'Connected Instagram still appears when Highlight metadata is absent');
fallback.click();
assert.match(ad.querySelector('.biglwa-story-popup strong')?.textContent||'',/Instagram profile/);
assert.equal(ad.querySelector('.biglwa-story-popup a')?.getAttribute('href'),
 'https://www.instagram.com/owner.ig/');
autoDom.window.close();
console.log('Profile banner linked identity + automatic source Highlight and Spotlight passed.');

