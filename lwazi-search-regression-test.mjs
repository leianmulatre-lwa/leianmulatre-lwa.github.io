import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const search = readFileSync(new URL('./user-search-results.js', import.meta.url), 'utf8');
new Function(search);
assert.match(search, /insertAdjacentElement\('afterend',panel\)/, 'Search expands in document flow beneath Studio header');
assert.match(search, /position:relative/, 'Search results participate in layout');
assert.doesNotMatch(search, /right:-42px|right:-38px/, 'Assistant icon must not sit outside the input');
assert.match(search, /bl-lwazi-button/, 'Matching Lwazi symbol button is present');
assert.match(search, /\/assets\/lwazi-rainbow-stitch\.svg/, 'Assistant reuses Lwazi widget symbol');
assert.match(search, /bl-voice-button/, 'Voice-to-text button is present');
assert.match(search, /bl-camera-button/, 'Camera image-picker control is present');
assert.match(search, /bl-search-clear/, 'Quick clear X is present');
assert.match(search, /bl-search-category-nav/, 'Results are sectioned by symbols');
assert.match(search, /renderAnswer/, 'Formatted answers are rendered safely');
assert.doesNotMatch(search, /bl-search-query\"><input/, 'Do not render a duplicate results search field');
assert.match(search, /SpeechRecognition\|\|window\.webkitSpeechRecognition/, 'Browser speech recognition fallback is present');
assert.match(search, /aria-pressed/, 'Microphone exposes active state');
assert.match(search, /__biglwaSearchBound=1/, 'Legacy suggestion popover is suppressed');
assert.match(search, /data-lwazi-route/, 'Existing Studio widget commands are preserved');
assert.match(search, /take me to journal/, 'Journal navigation remains available');
assert.match(search, /BigLWA users/, 'Public profile search remains');
assert.match(search, /Public Sqwidz/, 'Published user content can appear with profiles');
assert.match(search, /publicSqwibs\(90\)/, 'Content comes from public publication API');
assert.match(search, /p\.visibility!=='public'/, 'No non-public Sqwidz should enter search cards');
assert.match(search, /Books/, 'Book search remains');
assert.match(search, /Songs/, 'Song search exists');
assert.match(search, /openlibrary\.org\/search\.json/, 'Open Library remains');
assert.match(search, /itunes\.apple\.com\/search/, 'Song search uses actual catalog');
assert.match(search, /en\.wikipedia\.org\/w\/api\.php/, 'Research search remains');
assert.match(search, /lwazi-source-library-v02\.json/, 'Research catalog is loaded');
assert.match(search, /sourceLibraryMatches/, 'Research sources are ranked');
assert.match(search, /Official or clinical reference/, 'Official guidance is not mislabeled as community scholarship');
assert.match(search, /__biglwaAskLwazi/, 'External Lwazi model integration hook is preserved');
assert.match(search, /critical_reasoning/, 'The Three Body reasoning charter reaches model hook and browser model');
assert.match(search, /if\(panel!==current/, 'Older searches cannot overwrite newer results');
assert.doesNotMatch(search, /Tumblr notes about|Bluesky.*Public posts about/, 'Never invent social search results');

for(const pathname of ['./index.html','./studio/index.html','./404.html']){
  const page=readFileSync(new URL(pathname,import.meta.url),'utf8');
  assert.match(page, /const searchScript='';/, pathname+' must remove legacy floating suggestion script');
  assert.match(page, /user-search-results\.js\?v=20261105-studio-search-voice-v05/, pathname+' must load fresh source');
  assert.doesNotMatch(page, /var box=null;var localFallback/, pathname+' must not create detached popup');
}
console.log('Lwazi search layout, discovery, voice, privacy and loader regressions passed');
