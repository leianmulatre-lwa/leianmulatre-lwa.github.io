import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('./'+path,import.meta.url),'utf8');
const page=read('free-tools/index.html');
const about=read('about/index.html');
const sitemap=read('sitemap.xml');
const extras=read('lwazi-discovery-extras.js');
const search=read('user-search-results.js');

test('Free tools is crawlable with unique descriptive metadata and an accessible H1',()=>{
 const title=page.match(/<title>([^<]+)<\/title>/)?.[1];
 const desc=page.match(/<meta name="description" content="([^"]+)"/)?.[1];
 assert(title?.length>=35&&title.length<=65,title);
 assert(desc?.length>=110&&desc.length<=170,desc);
 assert.match(page,/<meta name="robots" content="index,follow/);
 assert.match(page,/<link rel="canonical" href="https:\/\/biglwa\.com\/free-tools\/"/);
 assert.match(page,/<meta property="og:url" content="https:\/\/biglwa\.com\/free-tools\/"/);
 assert.match(page,/<meta property="og:image"/);
 assert.match(page,/<script type="application\/ld\+json">/);
 const json=page.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/)?.[1];
 const schema=JSON.parse(json);
 assert.equal(schema.url,'https://biglwa.com/free-tools/');
 assert.equal(schema['@type'],'WebPage');
 assert.equal((page.match(/<h1>/g)||[]).length,1);
 assert.match(sitemap,/<loc>https:\/\/biglwa\.com\/free-tools\/<\/loc>/);
 assert.match(about,/href="\/free-tools\/"/,'Public About page offers an internal link');
 assert(!/href="\/studio\/[^"]+"/.test(page),'No undocumented dynamic panel routes');
 assert.match(page,/href="\/studio\?view=tools"/);
 assert.match(page,/href="\/studio\?view=projects"/);
 assert.match(page,/href="\/studio\?view=games"/);
 assert.match(page,/<a href="\/privacy\/">Privacy<\/a>/);
});

test('Search intent maps free Adobe, free games and slide alternatives to actual Studio routes',()=>{
 const win={};
 vm.runInNewContext(extras,{window:win,console,URL,Math,Date,Array,String,Object,Set,Map},{timeout:1800});
 const tool=win.BigLWADiscoveryExtras;
 const photo=tool.toolIntentCards('free adobe photoshop alternative').join('');
 const game=tool.toolIntentCards('free games online').join('');
 const slides=tool.toolIntentCards('free microsoft powerpoint google slides alternative').join('');
 assert.match(photo,/data-bl-craft-app="photocraft"/);
 assert.match(photo,/data-bl-craft-app="vectorcraft"/);
 assert.match(photo,/data-bl-craft-app="effectcraft"/);
 assert.match(photo,/data-bl-craft-app="pdfcraft"/);
 assert.match(game,/data-lwazi-route="games"/);
 assert.match(slides,/data-lwazi-route="projects"/);
 assert.match(slides,/visualslidez/);
 assert.doesNotMatch(slides,/data-bl-craft-app="photocraft"/);
 assert.deepEqual(Array.from(tool.toolIntentCards('What is free will?')),[]);
 assert.match(search,/extras\.toolIntentCards\?\.\(clean\)/);
});

test('SEO and visual guide explain capability boundaries with system dark mode',()=>{
 assert.match(page,/not an Adobe Photoshop copy/);
 assert.match(page,/not a full substitute for Word/);
 assert.match(page,/not affiliated with Adobe, Microsoft or Google/);
 assert.match(page,/@media\(prefers-color-scheme:dark\)/);
 assert.match(page,/a:focus-visible,button:focus-visible/);
 assert.match(page,/--ink:#f7eff7/,'Dark mode text is light');
 assert.match(page,/--ink:#392b32/,'Light mode text is dark');
});
