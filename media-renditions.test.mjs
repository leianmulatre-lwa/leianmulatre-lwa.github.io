import test from 'node:test';
import assert from 'node:assert/strict';
import {PREVIEW_BYTES_MAX,PREVIEW_WIDTH,originalKey,derivativeKey,looksLikeWebp,
 validOriginalName,verifyParent} from './media-derivative-policy.mjs';
import {originalUploadName} from './media-renditions.js';
const uid='u123456789abcdefghijklmnopqrstuv';
const name='1763320000000-aBcDeFgHiJkLmNoPqRsTuV.jpg';

test('variant keys belong to exactly one owner and one original',()=>{
 assert.equal(originalKey(uid,name),'feed-images/'+uid+'/'+name);
 assert.equal(derivativeKey(uid,name),'feed-image-variants/'+uid+'/'+name+'.w'+PREVIEW_WIDTH+'.webp');
 assert.equal(originalUploadName({key:uid+'/'+name}),name);
 assert.equal(PREVIEW_BYTES_MAX,512*1024);
 assert.equal(validOriginalName('../secret.jpg'),false);
 assert.throws(()=>originalKey('../other',name));
 assert.throws(()=>derivativeKey(uid,'secret.jpg'));
});

test('variant uploads require the owner and a real photo',()=>{
 const good={customMetadata:{uid},httpMetadata:{contentType:'image/jpeg'}};
 assert.equal(verifyParent(good,uid),true);
 assert.equal(verifyParent(good,'someone-else'),false);
 assert.equal(verifyParent({...good,httpMetadata:{contentType:'video/mp4'}},uid),false);
 assert.equal(verifyParent(null,uid),false);
});

test('reject WebP content type spoofing',()=>{
 const header=Uint8Array.from([82,73,70,70,50,0,0,0,87,69,66,80,86,80,56,32]);
 assert.equal(looksLikeWebp(header),true);
 assert.equal(looksLikeWebp(header.buffer),true);
 assert.equal(looksLikeWebp(new Uint8Array(16)),false);
 assert.equal(looksLikeWebp(new Uint8Array(4)),false);
});
