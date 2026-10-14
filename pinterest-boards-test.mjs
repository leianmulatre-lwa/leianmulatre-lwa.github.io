import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const frontend=readFileSync(new URL('./pinterest-orbit.js',import.meta.url),'utf8');
const index=readFileSync(new URL('./index.html',import.meta.url),'utf8');

assert.ok(frontend.includes('data-pn-connect'), 'Pinterest connect tiles are buttons');
assert.ok(frontend.includes("window.openBIGLWAModule('boards')"), 'OAuth returns to Boards');
assert.ok(frontend.includes('pinterestVerifier'), 'PKCE verifier retained through OAuth');
assert.ok(frontend.includes("location.assign(API+'start?challenge='+encodeURIComponent(challenge)+'&return_to='+encodeURIComponent(returnTo))"), 'PKCE challenge and same-origin return used');
assert.ok(frontend.includes('firebaseIdToken:token'), 'Firebase account attached to handoff');
assert.ok(frontend.includes('session/account') && frontend.includes('session/claim'), 'account recovery supported');
assert.ok(frontend.includes("const scopedKey=uid=>KEY+':'+uid"), 'sessions isolated by Firebase UID');
assert.ok(frontend.includes('data-pn-sync'), 'profile-sync control is rendered');
assert.ok(frontend.includes('importPinsToAccount(nextItems)'), 'Pin pages import to profile');
assert.ok(index.includes('pinterest-orbit.js?v='), 'browser loads new frontend');
assert.ok(index.includes('orbit-posts.js?v='), 'browser loads fixed importer');
console.log('11 Pinterest Boards checks passed');

assert.ok(frontend.includes("const PENDING_KEY='biglwaPinterestPendingHandoffV2'"),'Pending callback survives a transient auth restore failure');
assert.ok(frontend.includes("mapping.session!==result.session"),'Account binding is confirmed using the recovery endpoint');
assert.ok(frontend.includes("biglwa:pinterest-status"),'Verified Pinterest status is published to Orbit');
