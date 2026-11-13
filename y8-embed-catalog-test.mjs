import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext,Script} from 'node:vm';
const read=path=>readFileSync(new URL('./'+path,import.meta.url),'utf8');
const src=read('y8-embeds-20261112.js'),pages=read('module-pages.js');
const index=read('index.html'),studio=read('studio/index.html');
assert.doesNotThrow(()=>new Script(src),'Y8 manifest is valid classic JavaScript');
assert.doesNotThrow(()=>new Script(pages),'Main module runtime remains valid classic JavaScript');
const ctx={window:{}};
runInNewContext(src,ctx);
const games=ctx.window.BigLWAY8EmbedCatalog;
assert(Array.isArray(games),'Y8 catalog is provided to existing Games page');
assert.equal(games.length,200,'Exactly 200 Y8 publisher-listed top games');
assert.equal(games[0].title,'Slope');
assert.equal(games[1].title,'Bartender: The Right Mix');
assert.equal(games[2].title,'Football Legends 2016');
assert.equal(games.at(-1).title,'Blonde Sofia: Ingrown Toenail');
assert.equal(new Set(games.map(g=>g.slug)).size,200,'No duplicate publisher slug');
for(let i=0;i<games.length;i++){
 const game=games[i],embed=new URL(game.href),original=new URL(game.original);
 assert.equal(game.rank,i+1,'Publisher popularity ranking is stable');
 assert.equal(embed.origin,'https://www.y8.com');
 assert.match(embed.pathname,/^\/embed\/[a-z0-9_-]+$/);
 assert.equal(original.origin,'https://www.y8.com');
 assert.equal(original.pathname,'/games/'+game.slug);
 assert.equal(game.launch,'embed');
 assert.equal(game.provider,'Y8');
 assert.match(game.image,/^https:\/\/(?:cdn2|img)\.y8\.com\//,"Y8 matching hosted game thumbnail");
 assert(['Driving & Racing','Sports','Action & Adventure','Puzzles & Strategy','Life & Creative','Arcade & Skill'].includes(game.category),'Category is registered');
 assert(['online','local','solo'].includes(game.multiplayerMode),'Multiplayer mode is classified');
}
assert(games.some(game=>game.title==='Slope Multiplayer'&&game.maybeMultiplayer),'Multiplayer discovery is supported');
assert(pages.includes('gameLibrary.push(...y8Games.map'),'New titles extend original Arcade library');
assert(pages.includes("target.hostname==='www.y8.com'"),'Only approved Y8 publisher embed host is eligible');
assert(pages.includes("showGameLinks(game); // Third-party websites use the honest original-site launcher"),'Other third-party sites are still launchers');
assert(pages.includes("frame.src=framed.href"),'No mirror or proxy');
assert(pages.includes("game.original?new URL(game.original):uri"),'Original game fallback is preserved');
assert(pages.includes('track(featuredColumns[2])') && pages.includes('items.concat(items)'),'Animated carousel has a bounded featured playlist');
assert(pages.includes('arcade-category-group'),'Full catalog renders category groups');
assert(!pages.includes('Live website attempted'),'No yellow game-loading warning is rendered');
for(const [name,html] of [['main',index],['Studio',studio]]){
 const manifest=html.indexOf('y8-embeds-20261112.js');
 const runtime=html.indexOf('module-pages.js?v=');
 assert(manifest>0&&manifest<runtime,name+' loads Y8 catalog before Games runtime');
 assert(html.includes('arcade-y8-20261112.css'),name+' loads Y8 styling');
}
const art=read('assets/arcade/y8-game-placeholder-20261112.svg');
assert(art.startsWith('<svg'),'Neutral placeholder art is deployed locally');
console.log('PASS: 200 Y8 most-popular publisher-listed embed links with original-page fallbacks and unchanged native Arcade.');
