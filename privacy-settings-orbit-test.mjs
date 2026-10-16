import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=p=>readFileSync(new URL('./'+p,import.meta.url),'utf8');
const facebook=read('facebook-orbit.js'),settings=read('settings-account.js'),
  html=read('settings/index.html'),directory=read('firebase-directory.js'),
  preview=read('studio-preview.js'),collections=read('writing-collections.js'),
  rules=read('firestore.rules'),planets=read('orbit-planets-20261015.css'),orbit=read('module-pages.js'),google=read('google-orbit.js'),home=read('index.html');
for(const [name,code] of [['facebook-orbit.js',facebook],['settings-account.js',settings],['writing-collections.js',collections],['google-orbit.js',google],['module-pages.js',orbit]]){
 assert.doesNotThrow(()=>new vm.Script(code),name+' must parse');
}
assert.ok(facebook.includes('config_id: loginConfiguration()')&&!facebook.includes("scope: 'public_profile', return_scopes: true"),'Business Login uses its approved Meta configuration instead of unsupported ad hoc scopes');
assert.ok(!facebook.includes("'id,name,email,picture"),'Graph profile fields must not require email');
assert.ok(home.includes('facebook-orbit.js?v=20261016-private-import-sync-4'));
assert.ok(html.includes('id="privateAccountToggle"')&&html.includes('id="requestAccountDeletion"'));
assert.ok(settings.includes("async function setPrivateAccount")&&settings.includes("sdk.deleteField()"),'Private projection clears personal public metadata');
assert.ok(settings.includes("accountDeletionRequest:")&&settings.includes("status:'pending'"),'Deletion request stays reviewable');
assert.ok(settings.includes("This request does not immediately")===false,'Only the actual page explains deletion processing');
assert.ok(preview.includes('biglwa-preview-private')&&preview.includes('.masonry')&&preview.includes('.guest-check-card'));
assert.ok(directory.includes("accountVisibility:data.accountVisibility==='private'?'private':'public'"));
assert.ok(directory.includes("privateMode?deleteField():clean(profile.bio)"),'Account resync respects private setting');
assert.ok(rules.includes('match /users/{userId}/writingCollections/{kind} {'));
assert.ok(rules.includes("allow read, write: if isOwner(userId)"));
assert.ok(collections.includes('async function hydrateCloud()')&&collections.includes('async function syncCloud()'));
assert.ok(collections.includes('deletedIds[current.id]=timestamp()'),'Deleted notes do not silently reappear');
assert.ok(collections.includes('Cloud sync unavailable')||collections.includes('Cloud sync needs your private Firestore permissions'));
assert.ok(planets.includes('box-shadow:3px 3px 0 #f36b21')&&planets.includes('box-shadow:3px 3px 0 #d70024'));
assert.ok(planets.includes('#ffebec 73%')&&planets.includes('#f2899b'));
assert.ok(google.includes("window.openBIGLWAModule('orbit')")&&!google.includes("hide planetary"));
assert.ok(orbit.includes("data-orbit-save")&&orbit.includes("data-orbit-open"),'New provider profile URLs remain usable');
assert.ok(!rules.includes('accountIsPublic(resource.data.uid)'), 'Do not break public Feed queries until filters are migrated');
assert.ok(home.includes('orbit-new-connect.js?v=20261016-return-status-3'));
console.log('PASS Meta OAuth scope, safe private profile controls, deletion requests, owner-only writing sync, provider setup and planet palette');
