import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
const read=path=>readFileSync(new URL('./'+path,import.meta.url),'utf8');

test('Login preview reuses the three original laptop dots and removes duplicate controls',()=>{
 const player=read('login-archive-player.js'),css=read('brand-policy.css');
 assert.doesNotThrow(()=>new Script(player));
 assert.match(player,/querySelector\('\.login-laptop-lights'\)/);
 assert.match(player,/for\(const color of \['red','yellow','green'\]\)/);
 assert.match(player,/original\.replaceWith\(button\)/);
 assert.match(player,/color==='red'\?'close'/);
 assert.match(player,/color==='yellow'\?'minimize'/);
 assert.match(player,/setCartoonWindow\(laptop\.dataset\.cartoonWindow==='open'\?'minimized':'open'\)/);
 assert.doesNotMatch(player,/login-cartoon-controls|login-mini-cartoon-restore|data-login-cartoon-restore/);
 assert.doesNotMatch(css,/#loginPage \.login-cartoon-controls|#loginPage \.login-mini-cartoon-restore/);
 assert.match(css,/#loginPage \.login-laptop \.login-laptop-lights\{[^}]*right:15\.6%!important/);
 assert.match(css,/\.login-laptop-lights>button\.red::before/);
 assert.match(css,/\.login-laptop-lights>button\.yellow::before/);
 assert.match(css,/\.login-laptop-lights>button\.green::before/);
});

test('Crawlable discovery links are tucked inside red-curtain laptop preview',()=>{
 const player=read('login-archive-player.js'),css=read('brand-policy.css');
 assert.match(player,/desktop\.append\(explore\)/);
 assert.match(player,/explore\.hidden=true/);
 assert.match(player,/login-mini-explore-toggle/);
 assert.match(player,/exploreToggle\.setAttribute\('aria-expanded','true'\)/);
 assert.match(player,/explore\.querySelector\('a'\)\?\.focus\(\)/);
 assert.match(player,/event\.key==='Escape'/);
 assert.match(css,/#loginPage \.login-explore-links\{display:none!important\}/);
 assert.match(css,/\.login-explore-links\.is-open\{/);
 assert.match(css,/login-curtain-film-grain-v2\.webp/);
 assert.match(css,/\.login-explore-links a:first-of-type/);
 for(const path of ['index.html','studio/index.html','404.html','live-studio-shell.html']){
  const html=read(path);
  assert.match(html,/desktop=20261115-login-curtain-controls-v2/,path+' busts laptop script and style cache');
  for(const slug of ['discover','online-games','fare-checker','live-shows','free-knowledge','free-tools']){
   assert(html.includes('href="/'+slug+'/"'),path+' links '+slug);
  }
 }
});
