import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = file => fs.readFileSync(new URL(file, import.meta.url), 'utf8');
const origin = 'https://biglwa.com';
const sitemap = read('sitemap.xml');
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
assert.equal(new Set(urls).size, urls.length, 'Sitemap URLs must be unique');
for (const url of urls) {
  const parsed = new URL(url);
  assert.equal(parsed.origin, origin);
  const file = parsed.pathname === '/' ? 'index.html' : parsed.pathname.slice(1) + 'index.html';
  const head = read(file).match(/<head>([\s\S]*?)<\/head>/i)[1];
  const canonical = [...head.matchAll(/<link rel="canonical" href="([^"]+)"/g)];
  assert.equal(canonical.length, 1, `${file}: one canonical`);
  assert.equal(canonical[0][1], url, `${file}: sitemap and canonical agree`);
  assert.match(head, /name="robots" content="index,follow/);
  assert.equal([...head.matchAll(/<title>/g)].length, 1);
  assert.match(head, /name="description" content="[^"]{50,170}"/);
  assert.match(head, /name="twitter:card" content="summary_large_image"/);
  const image = head.match(/property="og:image" content="([^"]+)"/)[1];
  assert.equal(new URL(image).origin, origin);
  const png = fs.readFileSync(new URL(new URL(image).pathname.slice(1), import.meta.url));
  assert.equal(png.toString('ascii', 1, 4), 'PNG');
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
  assert.match(head, /property="og:image:alt" content="[^"]+"/);
  for (const [, data] of head.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    const schema = JSON.parse(data);
    assert.equal(schema['@context'], 'https://schema.org');
    assert.equal(schema.url, url);
  }
  console.log(`PASS public metadata, social image and sitemap: ${url}`);
}
assert.match(read('settings/index.html'), /name="robots" content="noindex,nofollow"/);
assert.doesNotMatch(read('robots.txt'), /^Disallow:\s*\/settings/m, 'Crawlers must see Settings noindex');
assert.match(read('robots.txt'), /Sitemap: https:\/\/biglwa.com\/sitemap.xml/);
assert.match(read('favicon.svg'), /viewBox="0 0 64 64"/);
console.log('PASS crawlable Settings noindex and favicon');
