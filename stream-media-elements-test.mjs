
import {readFileSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';
const player=readFileSync(new URL('./stream-guide.js',import.meta.url),'utf8');
const shell=readFileSync(new URL('./index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('./stream-guide.css',import.meta.url),'utf8');
for(const name of ['youtube-video-element','tiktok-video-element','spotify-audio-element','media-played-ranges-mixin']){
 const path=new URL('./assets/media-elements/'+name+'.js',import.meta.url);
 assert(existsSync(path),'Self-hosted component missing: '+name);
}
assert.match(player,/function embeddedStreamLink/);
assert.match(player,/function onStreamMediaSubmit/);
assert.match(player,/streamMediaLinkForm/);
assert.match(player,/mediaTag\\('youtube'/);
assert.match(player,/mediaTag\\('spotify'/);
assert.match(player,/mediaTag\\('tiktok'/);
assert.match(css,/stream-media-link-form/);
assert.match(shell,/assets\\/media-elements\\/loader\\.js/);
assert.match(player,/www\\.youtube-nocookie\\.com\\/embed/);
assert.match(player,/window\\.customElements\\?\\.get/);
console.log('PASS Stream: pinned local Mux elements, guarded member links, creator-hosted fallbacks');
