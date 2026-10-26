/* Guest Check must never turn unauthenticated previews into a private note reader/writer. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
const read=p=>readFileSync(new URL('./'+p,import.meta.url),'utf8');
const client=read('guest-check-v2.js'),style=read('guest-check-v2.css'),
 rules=read('firestore.rules'),landing=read('public-profile-landing.js'),
 preview=read('studio-preview.js'),entry=read('index.html'),loading=read('studio-loading-consistency-20261026.css');
assert.doesNotThrow(()=>new Script(client),'Guest Check client parses');
assert.match(entry,/guest-check-v2\.js\?v=/,'Live shell must include member Guest Check');
assert.match(entry,/guest-check-v2\.css\?v=/,'Live shell must include notebook presentation');
assert.match(client,/if\(!user\?\.uid\)throw Error\('Sign in to leave a Guest Check/,'Signed-out visitors cannot submit');
assert.match(client,/form.hidden=!signedIn/,'Visitor composer hidden without a member account');
assert.match(client,/guestCheckPermission/,'Owner preference persisted');
assert.match(client,/approved Archive friends list/,'Connects-only UI describes the existing approved-member list');
assert.match(rules,/archiveFriends/,'Server checks approved connects from owner record');
assert.match(client,/f\.where\('visibility','==','public'\)/,'Preview only queries published entries');
assert.match(rules,/match \/guestCheckEntries\/\{ownerUid\}\/entries\/\{entryId\}/,'Dedicated public Guest Check records');
assert.match(rules,/request\.resource\.data\.authorUid == request\.auth\.uid/,'Writer UID validated by Firebase');
assert.match(rules,/request\.auth\.uid in get\(/,'Connects-only enforced on server');
assert.match(rules,/allow update: if false/,'No visitor can overwrite previous guest notes');
assert.match(landing,/BigLWAGuestCheck\?\.summary\?\./,'Public Studio uses real published ledger');
assert.match(landing,/BigLWAGuestCheck\?\.open\?\./,'Preview opens the same real Guest Check');
assert.match(preview,/The new public Guest Check is read-only/,'Signed-out preview gate lets visitor open guest ledger');
assert.match(style,/moduleWorkspace\[data-module-key="notes"\] \.module-heading/,'Sqwidz title below back button');
assert.match(style,/#biglwaStartupScreen \.biglwa-startup-logo/,'Startup logo has transparent backing');
assert.match(loading,/--lwa-loading-hero-height:clamp\(275px,43vh,355px\)/,'Existing bottom-half masking retained');
assert.doesNotMatch(entry,/#fcebd7/,'Old plaque removed from both startup render variants');
console.log('PASS guest check authentication, permission source, server-enforced connects, read-only previews, Sqwidz spacing, transparent stitched logo');
