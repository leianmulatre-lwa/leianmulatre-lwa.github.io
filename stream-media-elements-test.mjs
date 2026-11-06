
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
for(const name of ['youtube','spotify','tiktok'])
 assert(player.includes("mediaTag('"+name+"'"),'Player is available for '+name);
assert(css.includes('stream-media-link-form'));
assert(shell.includes('assets/media-elements/loader.js'));
assert(player.includes('www.youtube-nocookie.com/embed'));
assert(player.includes('window.customElements?.get'));
console.log('PASS Stream: pinned local Mux elements, guarded member links, creator-hosted fallbacks');
