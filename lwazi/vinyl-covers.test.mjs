import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const search=read('user-search-results.js');
const styles=read('lwazi-music-discovery.css');
const ui=read('lwazi-search-ui.js');
const shells=['index.html','studio/index.html','404.html','live-studio-shell.html'];

function escapeHtml(v){
  return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function renderer(){
  const start=search.indexOf('    function songCard(s){');
  const end=search.indexOf('    function publicSqwibCard(',start);
  assert(start>=0&&end>start,'Song card renderer is identifiable');
  return new Function('esc',search.slice(start,end)+';return songCard')(escapeHtml);
}
test('song tiles are artwork-first, square, and linked without rectangular CTAs',()=>{
  const card=renderer()({
    trackName:'Hello & Goodbye',
    artistName:'Artist',
    collectionName:'Album',
    artworkUrl100:'https://is1-ssl.mzstatic.com/image/thumb/sample/100x100bb.jpg',
    trackViewUrl:'https://music.apple.com/us/album/sample/123'
  });
  assert.match(card,/bl-search-card bl-media-card bl-search-song/);
  assert.match(card,/bl-vinyl-record/);
  assert.match(card,/bl-vinyl-label/);
  assert.match(card,/600x600bb\.jpg/,'Real album art requests sleeve-resolution version');
  assert.match(card,/bl-vinyl-cover-link/,'Entire sleeve is an accessible link');
  assert.match(card,/aria-label="Open Hello &amp; Goodbye by Artist in Apple Music"/);
  assert.match(card,/rel="noopener noreferrer"/);
  assert.match(card,/Hello &amp; Goodbye/);
  assert.match(card,/class="bl-search-card-body"/);
  assert.doesNotMatch(card,/src="[^"]*100x100bb\.jpg"/,'Do not stretch tiny iTunes thumbnails');
  assert.equal((card.match(/<a /g)||[]).length,1,'One source action, not duplicate buttons');
  assert.equal((card.match(/<img /g)||[]).length,1);
});
test('a missing cover keeps the record and a safe, branded placeholder',()=>{
  const card=renderer()({trackName:'Unknown',artistName:'Unknown artist',artworkUrl100:'',trackViewUrl:'javascript:alert(1)'});
  assert.match(card,/bl-media-placeholder/);
  assert.match(card,/bl-vinyl-record/);
  assert.doesNotMatch(card,/<a /,'Unsafe music URL is never offered as a link');
});
test('Vinyl CSS is square and scoped only to Songs, preserving the shared dot controls',()=>{
  assert.match(styles,/#bl-section-songs \.bl-search-grid/);
  assert.match(styles,/aspect-ratio:1\/1!important/);
  assert.match(styles,/\.bl-search-song \.bl-search-card-media/);
  assert.match(styles,/\.bl-search-song \.bl-vinyl-record/);
  assert.match(styles,/\.bl-search-song a\.bl-vinyl-cover-link/);
  assert.match(styles,/\.bl-search-song \.bl-card-window-controls/);
  assert.match(styles,/z-index:8!important/,'Block/hide/open dots remain above sleeve link');
  assert.match(styles,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(styles,/bl-search-soundcloud-form/,'Keep existing SoundCloud preview and Tune actions');
  assert.match(styles,/music-linked-song/,'Keep linked Tunes in the song dialog');
  assert.doesNotMatch(styles,/padding:235px/,'Remove earlier conflicting tall result-card rule');
  assert.match(ui,/bl-card-window-controls/,'Veve result controls still exist');
});
test('all entrypoints render the same actual vinyl style rather than generic Veve rectangles',()=>{
  for(const path of shells){
    const html=read(path);
    assert.match(html,/lwazi-music-discovery\.css\?v=20261113-lp-preview-v3/,path+' loads actual sleeve CSS');
    assert.match(html,/lwazi-music-discovery\.js\?v=20261113-in-site-previews-v3/,path+' retains SoundCloud');
    assert.match(html,/user-search-results\.js\?v=[^"]*&vinyl=20261113-1/,path+' clears cached renderer');
    assert.equal((html.match(/lwazi-music-discovery\.css\?v=/g)||[]).length,1,path+' loads CSS once');
    assert.equal((html.match(/lwazi-music-discovery\.js\?v=/g)||[]).length,1,path+' loads music adapter once');
    assert(html.indexOf('lwazi-search-ui.css?v=')<html.indexOf('lwazi-music-discovery.css?v='),path+' places sleeve CSS after common Veve CSS');
  }
});
