import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import vm from 'node:vm';
const read=p=>readFileSync(new URL('./'+p,import.meta.url),'utf8');
const wlaSection=()=>{const js=read('stream-guide.js');new vm.Script(js);return js.slice(js.indexOf('function mountWla('),js.indexOf('function renderCategory('))};

test('FMHY shelf browses reviewed legal leads inside WLA without embedding pages',()=>{
 const js=read('stream-guide.js'),wla=wlaSection(),css=read('stream-guide.css');
 assert.match(js,/const wlaFmhyGuide='https:\/\/fmhy\.net\/movies'/);
 assert.match(js,/const wlaFmhySources=\[/);
 assert.match(js,/FMHY is a directory, not a playback license/);
 assert.match(wla,/data-wla-filter="fmhy"/);
 assert.match(wla,/wla-fmhy-browser/);
 assert.match(wla,/fmhy\.net \/ movies/);
 assert.match(wla,/filter==='fmhy'\?!!item\.fmhy/);
 assert.match(wla,/FMHY · reviewed legal lead/);
 assert.doesNotMatch(wla,/<iframe|<script|magnet:\?|torrent|streaming[ -]?server/i);
 assert.match(css,/\.biglwa-stream \.wla-fmhy-browser\[hidden\]/);
 assert.match(css,/\.biglwa-stream \.wla-source-fmhy/);
 for(const file of ['index.html','studio/index.html','404.html','live-studio-shell.html'])assert.equal((read(file).match(/&wla=20261127-9/g)||[]).length,2);
});

test('IMDb ratings use public metadata and never add third-party streams',()=>{
 const js=read('stream-guide.js'),wla=wlaSection();
 assert.match(js,/v3-cinemeta\.strem\.io\/meta\//);
 assert.match(js,/item\.imdbRating=rating/);
 assert.match(js,/imdb:s\.externals\?\.imdb/);
 assert.match(js,/P345/);
 assert.match(wla,/IMDb ★ /);
 assert.match(wla,/wla-imdb-rating/);
 assert.match(wla,/wla-source-imdb/);
 assert.match(wla,/does not extract, proxy or host third-party streams/);
});

test('WLA titles can be saved to the private Library like Veve books',()=>{
 const js=read('stream-guide.js'),wla=wlaSection();
 assert.match(js,/const wlaLibraryItem=item=>/);
 assert.match(wla,/hasTitle\?\.\(libraryItem\)/);
 assert.match(wla,/BigLWAAccountStorage/);
 assert.match(wla,/await account\.ready/);
 assert.match(wla,/if\(!account\.uid\)throw Error\('Sign in to save titles to your Library\.'\)/);
 assert.match(wla,/__biglwaLibraryCatalog\.addTitle\(libraryItem\)/);
 assert.match(wla,/Save to Library/);
 assert.match(wla,/Added .+ to your private Library shelf/);
 assert.match(wla,/wla-save-library/);
});
