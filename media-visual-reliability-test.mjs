import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
const read=p=>readFileSync(new URL('./'+p,import.meta.url),'utf8');
const signal=read('tv-no-signal-fallback.js'),ui=read('media-placeholders.js'),css=read('media-placeholders.css');
const veve=read('veve.js'),posts=read('orbit-posts.js'),pins=read('pinterest-orbit.js'),index=read('index.html');
for(const code of [signal,ui,veve,pins])assert.doesNotThrow(()=>new Script(code));
assert.ok(signal.includes("target.closest('.veve-photo-frame,.biglwa-unified-media"),'Veve/Feed avoid test bars');
assert.ok(ui.includes("new MutationObserver"),'Catch newly rendered/lazy media');
assert.ok(ui.includes('img.naturalWidth/img.naturalHeight'),'Reserve known photo ratio');
assert.ok(ui.includes("shell.classList.add('lwa-image-loading')"),'Display stable loading stage');
assert.ok(ui.includes("shell.classList.add('lwa-image-failed')"),'Display meaningful failure stage');
assert.ok(ui.includes("img.dataset.lwaOriginalUrl"),'Retry original media rather than broken no-signal asset');
assert.match(css,/aspect-ratio:var\(--lwa-image-aspect,4\/5\)/);
assert.match(css,/prefers-reduced-motion:reduce/);
assert.ok(index.includes('/media-placeholders.js?v='),'Site initializes image skeletons');
const a=veve.indexOf('function uniquePublicPhotos(rows){');
const b=veve.indexOf('function loadProgress(stage){',a);
assert.ok(a>0&&b>a,'Veve has account/source-aware dedupe');
const unique=new Function(veve.slice(a,b)+'return uniquePublicPhotos;')();
const photo=(id,owner='ownerA',origin='unknown',fingerprint='')=>({
 id:'post_'+id,uid:owner,source:'pinterest',sourcePostId:id,
 sourceUrl:'https://www.pinterest.com/pin/'+id+'/',
 pinterestOrigin:origin,pinterestOriginVerified:origin!=='unknown',sourceImageFingerprint:fingerprint
});
const p1=photo('7388888888888888888'),p2=photo('7388888888888888888');
assert.equal(unique([p1,p2]).length,1,'Same pin ID, owner and provenance collapses');
assert.equal(unique([p1,{...p2,uid:'otherOwner'}]).length,2,'Another member may repin publicly');
assert.equal(unique([photo('7388888888888888888','ownerA','created'),photo('7388888888888888888','ownerA','board')]).length,2,'Different proven Board and original roles remain');
assert.equal(unique([photo('7388888888888888888'),photo('7388888888888888889')]).length,2,'Similar Pins with separate IDs remain until validated');
const fp='pinimg:'+'a'.repeat(32);
assert.equal(unique([photo('7388888888888888888','ownerA','created',fp),photo('7388888888888888889','ownerA','created',fp)]).length,1,'Same verified image fingerprint and same source role collapses');
assert.ok(pins.includes("biglwaPinterestOrigin:original?'created':'board'"),'Manual imports preserve board/create provenance');
assert.ok(pins.includes("biglwaPinterestOrigin:'board',biglwaPinterestBoardId:String(id)"),'Board publish stores Board source');
assert.ok(posts.includes('pinterestOriginVerified:pinOriginVerified'),'Importer persists verified provenance');
assert.ok(posts.includes('sourceImageFingerprint:sourcePinFingerprint'),'Importer saves stable Pinterest original-image fingerprint');
assert.ok(veve.includes('veve-pin-provenance'),'Veve labels confirmed source type');
console.log('PASS Veve loading placeholders and provenance-preserving Pinterest dedupe');
