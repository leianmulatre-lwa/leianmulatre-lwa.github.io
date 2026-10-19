/* Security regression: no member may inherit founder/last-browser-owner studio data. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
const read=file=>readFileSync(new URL('./'+file,import.meta.url),'utf8');
const shell=read('index.html'),boundary=read('studio-account-boundary-20261019.js'),
  chrome=read('ui-coherence.js'),identity=read('account-identity.js'),
  dir=read('firebase-directory.js'),publicPreview=read('studio-preview.js'),
  styles=read('studio-appearance.js'),modules=read('module-pages.js'),
  wallpaper=read('wallpaper-cloud.js'),rules=read('firestore.rules');
assert.doesNotThrow(()=>new Script(boundary),'Privacy gate must parse');
assert.match(shell,/class="biglwa-startup-protected"/,'Generated app must be hidden before CSS/scripts paint');
assert.match(shell,/studio-account-boundary-20261019\.js/,'Privacy boundary loaded before other Studio scripts');
assert.match(shell,/html\.biglwa-startup-protected body>\*/,'Legacy paint hidden during auth restoration');
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
console.log('PASS privacy-gated first paint, UID account cache, cross-owner restore denial, neutral new-user defaults, widget readability and source Firestore policy');
