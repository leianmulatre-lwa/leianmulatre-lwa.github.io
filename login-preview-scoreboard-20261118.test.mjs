import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
const read=path=>readFileSync(new URL('./'+path,import.meta.url),'utf8');
const player=read('login-archive-player.js');
const polish=read('studio-preview-discord-20261115.js');

test('Login mock browser uses one window-control set and a first-party scoreboard face',()=>{
 assert.doesNotThrow(()=>new Script(player));
 assert.doesNotMatch(player,/login-mini-window-dots/,'No duplicate mini-card window bars');
 assert.match(player,/querySelector\('\.login-laptop-lights'\)/,'Original laptop dots remain the controls');
 assert.match(player,/login-mini-scoreboard/);
 assert.match(player,/<b>00<\/b><small>your audience<\/small>/);
 assert.match(player,/<b>00<\/b><small>your connections<\/small>/);
 assert.match(player,/<b>00<\/b><small>your reach<\/small>/);
 assert.match(player,/aria-label="Example profile scoreboard; no account data"/);
 assert.doesNotMatch(player,/localStorage\.setItem|access_token|refresh_token/);
});

test('Login scoreboard styling loads Alarm Clock without inventing member data',()=>{
 assert.match(polish,/@font-face\{font-family:"BIGLWA Alarm Clock";src:url\("\/alarm%20clock%202\.ttf"\) format\("truetype"\);font-display:swap\}/);
 assert.match(polish,/#loginPage \.login-mini-scoreboard/);
 assert.match(polish,/font:700 clamp\(9px,1\.08vw,16px\)\/1 "BIGLWA Alarm Clock"/);
 assert.match(polish,/font-variant-numeric:tabular-nums lining-nums/);
 assert.doesNotMatch(polish,/login-mini-metrics/);
});

test('all shells bust the corrected login preview assets',()=>{
 for(const path of ['index.html','studio/index.html','404.html','live-studio-shell.html']){
  const html=read(path);
  assert.match(html,/login-archive-player\.js\?v=[^"']*scoreboard=20261118-1/,path);
 }
 assert.match(read('index.html'),/studio-preview-discord-20261115\.js\?v=[^"']*scoreboard=20261118-1/);
});
