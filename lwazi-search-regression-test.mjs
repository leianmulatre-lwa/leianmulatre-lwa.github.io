import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const search = readFileSync(new URL('./user-search-results.js', import.meta.url), 'utf8');

assert.match(search, /bl-lwazi-button/, 'Lwazi assistant button is required');
assert.match(search, /take me to journal/, 'Journal navigation command is required');
assert.match(search, /BigLWA users/, 'User result section is required');
assert.match(search, /Books/, 'Book result section is required');
assert.match(search, /Places, people, politics, cinema & history/, 'Research result section is required');
assert.match(search, /Social notes/, 'Social result section is required');
assert.match(search, /openlibrary\.org\/search\.json/, 'Book discovery source is required');
assert.match(search, /en\.wikipedia\.org\/w\/api\.php/, 'History and politics research source is required');
assert.match(search, /control\.click/, 'Widget commands must activate existing Studio controls');
assert.match(search, /position:relative/, 'Search results must participate in page flow');
assert.match(search, /insertAdjacentElement/, 'Search results must be inserted under the Studio header');
assert.match(search, /covers\.openlibrary\.org/, 'Book cards must include cover images');
assert.match(search, /wikipediaImages/, 'Research cards must request embedded images');
assert.match(search, /__biglwaAskLwazi/, 'Lwazi must support an existing AI integration hook');
assert.match(search, /LanguageModel/, 'Lwazi must support browser AI when available');
assert.match(search, /lwazi-source-library-v02\.json/, 'Lwazi must load the versioned public source library');
assert.match(search, /sourceLibraryMatches/, 'Library results must be ranked by query relevance');
assert.match(search, /Marginalized research source/, 'Community-centered sources must be visibly labeled');
