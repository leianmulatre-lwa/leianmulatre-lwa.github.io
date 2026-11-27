import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const config=readFileSync(path.join(root,'wrangler.toml'),'utf8');
const worker=readFileSync(path.join(root,'cloudflare-worker-instagram.js'),'utf8');
const read=name=>readFileSync(path.join(root,name),'utf8');
const tiktok=read('tiktok-orbit.js');
const instagram=read('instagram-orbit.js');
const facebook=read('facebook-orbit.js');
const pages=read('module-pages.js');
const routeGuard=read('politc-route-guard.js');

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

test('TikTok uses the production Login Kit key and the registered callback',()=>{
  assert.match(config,/^TIKTOK_CLIENT_KEY\s*=\s*"awtd7mu4k7rn1pay"$/m,'Sandbox key produces TikTok invalid_client');
  assert.match(worker,/function ttCallback\(request,\s*env\)/);
  assert.match(worker,/env\?\.NEW_ORBIT_CALLBACK_ORIGIN/);
  assert.doesNotMatch(worker,/workers\.dev\/tiktok\/callback/);
  assert.match(tiktok,/https:\/\/api\.biglwa\.com\/tiktok\/callback/);
});

test('OAuth callback-return marker is written before module-pages evaluates',()=>{
  assert.match(tiktok,/if\(CALLBACK_HANDOFF\|\|CALLBACK_ERROR\)markCallbackReturn\(\)/);
  assert.match(instagram,/if \(RETURNED_HANDOFF \|\| RETURNED_ERROR\) markCallbackReturn\(\)/);
  assert.match(pages,/biglwa:orbit-callback-return/);
});

test('legacy Facebook Business state is UID-bound and Archive uses personal OAuth',()=>{
  assert.match(facebook,/UID_BINDING_KEY\s*=\s*'biglwa:facebook-business-uid'/);
  assert.match(facebook,/function currentUid\(\)/);
  assert.match(facebook,/boundUid\(\) !== currentUid\(\)/);
  assert.match(pages,/facebook:window\.BigLWAFacebookPersonal/);
  assert.doesNotMatch(pages,/facebook:window\.__biglwaFacebookOrbit/);
});

test('changed runtime files are cache-busted in every shell and self-loader',()=>{
  const key='orbitex=20261127-1';
  const hasKey=(source,name,label)=>{
    const at=source.indexOf('/'+name+'?v=');
    assert.ok(at>-1,label+' loads '+name);
    assert.ok(source.slice(at).split(/["'<>]/)[0].includes(key),label+' busts '+name);
  };
  for(const shell of ['index.html','404.html','studio/index.html','live-studio-shell.html']){
    const source=read(shell);
    for(const name of ['facebook-orbit.js','tiktok-orbit.js','instagram-orbit.js','module-pages.js'])hasKey(source,name,shell);
  }
  hasKey(pages,'module-pages.js','module-pages.js self-loader');
  hasKey(routeGuard,'module-pages.js','politc-route-guard.js');
});

console.log('SAFE CHECK ONLY: no Cloudflare requests, secret reads, version uploads, or deployments.');
