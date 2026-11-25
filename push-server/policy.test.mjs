import test from 'node:test';
import assert from 'node:assert/strict';
import {validateSubscription,pilotAllowed,permitTest,testPayload} from './policy.mjs';
const keys={p256dh:'B'+'A'.repeat(86),auth:'A'.repeat(22)};
const withEndpoint=endpoint=>({endpoint,keys});
test('allowed browser gateways only',()=>{
 for(const url of ['https://web.push.apple.com/Q123','https://fcm.googleapis.com/fcm/send/abc','https://updates.push.services.mozilla.com/wpush/v2/abc','https://wns2.notify.windows.com/abc'])assert(validateSubscription(withEndpoint(url)),url);
 for(const url of ['http://web.push.apple.com/Q123','https://web.push.apple.com.evil.test/Q123','https://push.apple.com@evil.test/abc','https://127.0.0.1/abc','https://web.push.apple.com:444/abc','https://web.push.apple.com/','https://web.push.apple.com/a#x','https://web.push.apple.com/a?x=1'])assert.equal(validateSubscription(withEndpoint(url)),null,url);
 assert.equal(validateSubscription({endpoint:'https://web.push.apple.com/a',keys:{p256dh:'bad',auth:'bad'}}),null);
});
test('pilot allowlist and one-minute rate limit',()=>{
 assert(pilotAllowed('owner',new Set(['owner'])));assert(!pilotAllowed('other',new Set(['owner'])));
 assert(permitTest(undefined,1000));assert(!permitTest(1000,60999));assert(permitTest(1000,61000));
});
test('payload has no account data or arbitrary message text',()=>assert.deepEqual(JSON.parse(testPayload()),{kind:'test'}));
