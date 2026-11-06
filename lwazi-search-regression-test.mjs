import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const search = readFileSync(new URL('./user-search-results.js', import.meta.url), 'utf8');

assert.match(search, /bl-lwazi-button/, 'Lwazi assistant button is required');
assert.match(search, /take me to journal/, 'Journal navigation command is required');
assert.match(search, /BigLWA users/, 'User result section is required');
assert.match(search, /Books/, 'Book result section is required');
assert.match(search, /People, places & history/, 'Research result section is required');
assert.match(search, /Public Sqwidz/, 'Social publishing result section is required');
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
assert.match(search, /Community and academic research/, 'Community-centered sources must be visibly labeled');
assert.match(search, /bl-search-category-nav/, 'Lwazi must provide compact widget-style result category tabs');
assert.match(search, /data-bl-match="users"/, 'People search tab must be available');
assert.match(search, /extraTabs/, 'Expanded images, videos, places, history, widgets and maps tabs must be available');
assert.match(search, /fastLwaziResponse/, 'Simple and social questions must answer through the instant local path');
assert.match(search, /__biglwaLwaziConfig/, 'Lwazi must support a secure server-side provider adapter configuration');
