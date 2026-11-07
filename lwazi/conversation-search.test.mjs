import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import {SYSTEM_POLICY} from './policy.mjs';

const source=readFileSync(new URL('../user-search-results.js',import.meta.url),'utf8');
const start=source.indexOf('    var lwaziConversationCount=0;');
const end=source.indexOf('    async function askLwazi(',start);
assert.ok(start>0&&end>start,'Found bounded local conversation router');
const scope={};
vm.runInNewContext(source.slice(start,end),scope,{timeout:1000});

test('search selects All immediately, then preserves a manually selected category',()=>{
  assert.match(source,/activateCategory\('all',false\);/);
  assert.match(source,/var activeCategory='all'/);
  assert.match(source,/activeCategory=category/);
  assert.match(source,/activateCategory\(activeCategory,false\)/);
  assert.doesNotMatch(source,/activateCategory\(qType/);
});

test('small talk receives a meaningful reply without requiring a model',()=>{
  assert.match(scope.conversationIntent('how are you?').reply,/you|code|curiosity/i);
  assert.match(scope.conversationIntent('who are you?').reply,/L’wazi/i);
  assert.match(scope.conversationIntent('who made this?').reply,/Leian/);
  assert.match(scope.conversationIntent('onika burgers').reply,/Onika = she/);
  assert.equal(scope.fastLwaziResponse('2 + 2?'),'4');
});

test('an ambiguous work attribution query does not get mistaken for site identity',()=>{
  assert.equal(scope.conversationIntent('Who made this song?'),null);
  assert.equal(scope.conversationIntent('Who made the Potato Salad?'),null);
  assert.equal(scope.conversationIntent('What is inflation?'),null);
});

test('site identity promotes verified first-party links, not a Wikipedia film match',()=>{
  assert.match(source,/lwaziSiteCard\('About BIG LWA'[\s\S]*?'\/about\/'\)/);
  assert.match(source,/lwaziSiteCard\('Privacy at BIG LWA'[\s\S]*?'\/privacy\/'\)/);
  assert.match(source,/var isSocialGreeting=!!\(conversation/);
});

test('model policy teaches identity and cultural literacy while avoiding false personhood',()=>{
  assert.match(SYSTEM_POLICY,/BIG LWA and L’wazi were created by Leian/);
  assert.match(SYSTEM_POLICY,/not a human/);
  assert.match(SYSTEM_POLICY,/recognizable online references or memes/);
});
