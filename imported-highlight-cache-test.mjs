import { existsSync, readFileSync, statSync } from 'node:fs';
import assert from 'node:assert/strict';

const raw = readFileSync('assets/highlights/leianstanley.json', 'utf8');
const data = JSON.parse(raw);
assert.equal(data.handle, 'leianstanley');
assert.equal(data.cache?.type, 'first-party-static');
assert.deepEqual(data.highlights.map((g) => g.title), ['🕺🏾', '♮', '✧', '+', '𖥔', 'moi']);
assert.deepEqual(data.highlights.map((g) => g.items.length), [38, 17, 47, 54, 42, 5]);
assert(!/token=|oh=|oe=|fbcdn|cdninstagram|rapidcdn|blob:|data:/i.test(raw), 'No signed, embedded or third-party media URLs remain');

const localPath = /^\/assets\/highlights\/[a-zA-Z0-9._-]{1,180}$/;
let items = 0;
for (const group of data.highlights) {
  assert.ok(localPath.test(group.cover || ''), `Owner-compatible cover path: ${group.cover}`);
  assert.ok(existsSync(`.${group.cover}`), `Cover exists: ${group.cover}`);
  assert(!('sourceCover' in group), 'Expired source covers are not retained');
  for (const item of group.items) {
    assert.ok(['photo', 'video'].includes(item.kind), `Known media kind: ${item.kind}`);
    for (const field of ['mediaUrl', 'thumbnail', 'poster']) {
      assert.ok(localPath.test(item[field] || ''), `Owner-compatible ${field}: ${item[field]}`);
      assert.ok(existsSync(`.${item[field]}`), `Cached file exists: ${item[field]}`);
    }
    assert.ok(statSync(`.${item.mediaUrl}`).size > 1000, `Cached media is not empty: ${item.mediaUrl}`);
    items++;
  }
}
assert.equal(items, 203);

const viewer = readFileSync('imported-profile-highlights.js', 'utf8');
assert(viewer.includes("fetch('/assets/highlights/leianstanley.json?v=20261118-first-party-cache-1',{credentials:'omit'})"));
assert(viewer.includes('credentials:\'omit\''), 'Public preview remains anonymous');
console.log('PASS: Imported Highlights use first-party cached media, preserve owner groups and public previews');
