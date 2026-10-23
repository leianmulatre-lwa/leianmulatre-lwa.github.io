/* Security regression: no member may inherit founder/last-browser-owner studio data. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
const read=file=>readFileSync(new URL('./'+file,import.meta.url),'utf8');
const shell=read('index.html'),boundary=read('studio-account-boundary-20261019.js'),
  chrome=read('ui-coherence.js'),identity=read('account-identity.js'),
  dir=read('firebase-directory.js'),publicPreview=read('studio-preview.js'),
  styles=read('studio-appearance.js'),modules=read('module-pages.js'),
  wallpaper=read('wallpaper-cloud.js'),rules=read('firestore.rules'),
  music=read('studio-experience.js'),orbit=read('orbit-account-links.js'),storage=read('account-storage.js'),
  feed=read('feed-view.js');
assert.doesNotThrow(()=>new Script(boundary),'Privacy gate must parse');
assert.match(shell,/class="biglwa-startup-protected"/,'Generated app must be hidden before CSS/scripts paint');
assert.match(shell,/studio-account-boundary-20261019\.js/,'Privacy boundary loaded before other Studio scripts');
assert.match(shell,/html\.biglwa-startup-protected body > :not\(#biglwaStartupScreen\)/,'Legacy paint hidden while keeping exactly one startup overlay visible');
assert.match(boundary,/if\(window\.__biglwaIdentity\?\.uid!==uid\)return/,'Do not reveal another account');
assert.match(boundary,/function clearSeed\(\)/,'Always discard starter owner-specific markup');
assert.match(boundary,/Tell your story\. This space belongs to you/,'New account gets neutral placeholder');
assert.doesNotMatch(identity,/localStorage\.getItem\(LEGACY_KEY\)/,'No global username inheritance');
assert.match(chrome,/biglwaOwnProfileV1:/,'UID-scoped owner profile data');
assert.doesNotMatch(chrome,/localStorage\.getItem\('biglwaProfileDetails'\)/,'Cannot import previous user profile');
assert.doesNotMatch(chrome,/Leian Stanley/,'No hardcoded founder as default');
assert.match(chrome,/remote\.uid!==ownUid\(\)/,'Async Firestore profile update must match owner');
assert.match(dir,/remote\.uid===owner/,'Server profile restore must match owner UID');
for(const [name,src] of [['firebase directory',dir],['public preview',publicPreview],['modules',modules],['wallpaper',wallpaper]]){
 assert.doesNotMatch(src,/localStorage\.getItem\(["']biglwaProfileDetails["']\)/,'Unscoped legacy storage in '+name);
}
assert.match(styles,/const ownedKey=base=>activeUid\(\)/,'Widget preferences use account keys');
assert.match(styles,/Math\.max\(\.72,/,'Widget opacity cannot make backgrounds disappear');
assert.match(rules,/match \/users\/\{userId\} \{[\s\S]*?allow read, create, delete: if isOwner\(userId\)/,'Owner Firestore rule in source');
assert.match(rules,/match \/posts\/\{postId\} \{[\s\S]*?allow read: if resource\.data\.state == 'approved'/,'Collective posts stay draft-private');

assert.match(shell,/id="biglwa-first-paint"/,'Initial response paints the same red curtain, not an ivory flash');
assert.match(music,/return 'music:'\+uid/,'Locally stored tracks are keyed to verified owner');
assert.doesNotMatch(music,/dbGet\('music'\)/,'No shared-browser music slot');
assert.match(music,/biglwaGuestChecksLocalV2:/,"Guest Check does not reuse another member\'s local notes");
assert.doesNotMatch(orbit,/localStorage\.setItem\('biglwaOrbitLinks'/,'Orbit cannot publish a shared-browser cache');
assert.match(storage,/legacyOwner===uid\?policy\.keys:\[\]/,'Legacy collections require matching historical owner');

assert.match(feed,/studioOwnPosts=user\?profilePosts\.filter\(p=>p\.uid===user\.uid&&p\.state==='approved'\)/,'Studio thumbnails require matching owner UID and published state');
assert.match(feed,/const previewPosts=isPublicProfile\?posts:/,'Public profiles and private Studios use different thumbnail sources');
assert.match(feed,/posts = rootPosts/,'Community Collective Feed and Veve still use approved public posts');

assert.match(boundary,/if\(html\.classList\.contains\('biglwa-preview-mode'\)\)/,"Public profile stays masked until viewed owner's data loads");

// Exercise the startup boundary with two separate Firebase identities, both given
// the same stale founder DOM. The actual renderer must discard those seeded details.
function simulateMember(uid, identityUid=uid){
  const classNames=new Set(['biglwa-startup-protected']);
  const html={classList:{
    contains:v=>classNames.has(v),add:v=>classNames.add(v),remove:v=>classNames.delete(v)
  }};
  function stub(content){
    return {textContent:content,style:{removeProperty(){}},classList:{remove(){}},replaceChildren(){this.textContent=''}};
  }
  const seeded=new Map([
    ['.profile-display-name',stub('Leian Stanley')],
    ['.profile-name-line h1',stub('@founder')],
    ['.profile-card .bio',stub('Previous member private biography')],
    ['.profile-card .meta-row span',stub('Founders location')],
    ['.profile-card .meta-row a',stub('founder.com')],
    ['.profile-rail-location',stub('Founder City')],
    ['.aura-card p',stub('Founder Aura')],
    ['.weekly-mood-value',stub('Founder Mood')],
    ['.profile-card .stats',stub('1.2k Followers')],
    ['.profile-avatar',stub('LS')],
    ['.mini-avatar',stub('LS')]
  ]);
  const app={dataset:{},style:{setProperty(){}},classList:{contains(){return true}}};
  const doc={
    readyState:'complete',documentElement:html,addEventListener(){},
    getElementById:id=>id==='studioApp'?app:null,
    querySelectorAll:selector=>{const value=seeded.get(selector.replace(/^#studioApp /,''));return value?[value]:[]}
  };
  const win={BigLWAAccountStorage:{uid,isReady:true},
    __biglwaIdentity:{uid:identityUid,name:'New Member '+uid,username:'member'+uid},
    __biglwaAccountHydrated:true,
    addEventListener(){}};
  new Script(boundary).runInNewContext({
    window:win,document:doc,location:{pathname:'/studio',search:''},
    URLSearchParams,Date,clearInterval(){},setInterval(){return 1}
  });
  return {classNames,seeded,app};
}
for(const uid of ['usera','userb']){
 const state=simulateMember(uid);
 assert.equal(state.seeded.get('.profile-display-name').textContent,'New Member '+uid);
 assert.equal(state.seeded.get('.profile-card .bio').textContent,'Tell your story. This space belongs to you.');
 assert.equal(state.seeded.get('.profile-name-line h1').textContent,'@member'+uid);
 assert.equal(state.seeded.get('.aura-card p').textContent,'Add your own Aura.');
 assert.equal(state.seeded.get('.profile-card .stats').textContent,'');
 assert.ok(!state.classNames.has('biglwa-startup-protected'),'Verified owner may see own Studio');
}
const mismatch=simulateMember('userb','usera');
assert.ok(mismatch.classNames.has('biglwa-startup-protected'),'Mismatched UID must not expose another account');

assert.ok(read('account-chrome.js').includes('const realName=clean(who.name)'),'PFP initial derives from real name');
assert.ok(!read('ui-coherence.js').includes('const candidates=[saved?.username'),'Studio cannot overwrite real-name initial with a username');
console.log('PASS two-account owner-isolation startup simulation, dark-first paint, UID-scoped media and Orbit, verified legacy import, widget backgrounds and Firestore source assertions');
