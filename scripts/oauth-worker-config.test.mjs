import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const config=readFileSync(path.join(root,'wrangler.toml'),'utf8');
const worker=readFileSync(path.join(root,'cloudflare-worker-instagram.js'),'utf8');

const expected=[
 'INSTAGRAM_APP_SECRET',
 'PINTEREST_APP_SECRET',
 'STATE_SECRET',
 'TIKTOK_CLIENT_SECRET',
 'SNAPCHAT_CLIENT_SECRET',
 'TUMBLR_CONSUMER_SECRET',
 'TUMBLR_CONSUMER_KEY',
 'X_CLIENT_SECRET',
 'FACEBOOK_PERSONAL_APP_SECRET'
];
const exact=key=>new RegExp('^'+key+'\\s*=\\s*["]([^"]+)["]','m');

test('existing deployment target and actual Worker entry point stay intact',()=>{
 assert.match(config,/^name\s*=\s*"biglwa-instagram-api"$/m);
 assert.match(config,/^main\s*=\s*"cloudflare-worker-instagram\.js"$/m);
 assert.ok(existsSync(path.join(root,'cloudflare-worker-instagram.js')));
 assert.match(worker,/async fetch\(request,\s*env\)/,'Must be an executable API Worker, not a static-assets-only upload');
 assert.doesNotMatch(config,/^\[assets\]$/m,'OAuth Worker must not silently become an assets-only Worker');
});

test('production KV and R2 stay configured, not replaced by preview resources',()=>{
 assert.match(config,/binding\s*=\s*"OAUTH_SESSIONS"/);
 assert.match(config,/id\s*=\s*"e438b6eecb074f428d8a7f92122b3ad8"/);
 assert.match(config,/binding\s*=\s*"WALLPAPER_BUCKET"/);
 assert.match(config,/bucket_name\s*=\s*"wallpaper-bucket"/);
 assert.match(config,/^\[previews\.vars\]$/m);
 assert.match(config,/id\s*=\s*"f804d7d809c749a8a9ac2a79e2255c90"/);
 assert.match(config,/bucket_name\s*=\s*"biglwa-preview-media"/);
});

test('all nine required secret names remain enforced; no credential values are in config',()=>{
 const section=config.match(/^\[secrets\]\s*\nrequired\s*=\s*\[([^\]]+)\]/m);
 assert.ok(section,'Missing [secrets].required enforcement');
 const actual=[...section[1].matchAll(/"([A-Z0-9_]+)"/g)].map(m=>m[1]);
 assert.deepEqual(new Set(actual),new Set(expected));
 assert.equal(actual.length,expected.length);
 const vars=config.match(/^\[vars\]\s*\n([\s\S]*?)(?=^\[|\Z)/m)?.[1]||'';
 assert.doesNotMatch(vars,/^\s*[A-Z0-9_]*(?:SECRET|PASSWORD|ACCESS_TOKEN|PRIVATE_KEY)[A-Z0-9_]*\s*=/m);
 assert.match(config,/^keep_vars\s*=\s*true$/m,'Preserve dashboard-managed public vars');
});

test('source keeps production callback origin and separate public site',()=>{
 assert.match(config,/^NEW_ORBIT_CALLBACK_ORIGIN\s*=\s*"https:\/\/api\.biglwa\.com"$/m);
 assert.match(config,/^SITE_URL\s*=\s*"https:\/\/biglwa\.com"$/m);
});

console.log('SAFE CHECK ONLY: no Cloudflare requests, secret reads, version uploads, or deployments.');
