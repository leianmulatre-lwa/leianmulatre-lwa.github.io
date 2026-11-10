const {JSDOM}=require('jsdom'),fs=require('fs'),vm=require('vm'),assert=require('assert'),zlib=require('zlib');
const base=zlib.gunzipSync(Buffer.from([1,2,3,4,5].map(i=>fs.readFileSync('site-'+i+'.txt','utf8')).join(''),'base64')).toString();
for(const path of ['index.html','studio/index.html','404.html','live-studio-shell.html']){
 const src=fs.readFileSync(path,'utf8');
 const line=src.split('\n').find(l=>l.includes('html=html.replace(/<div class="room-scene">'));
 const ctx={html:base};vm.runInNewContext(line,ctx);
 const dom=new JSDOM(ctx.html),w=dom.window,d=w.document;
 const holder=d.querySelector('#studioApp #rooms .room-photo-preview');
 assert(holder,'Selector matches real decompressed Studio');
 const style=w.getComputedStyle(holder);
 assert.equal(style.aspectRatio.replace(/\s/g,''),'4/3');assert.equal(style.position,'relative');
 for(const night of [false,true,false]){
 d.body.classList.toggle('night-mode',night);
 const img=holder.querySelector(night?'.room-dark':'.room-light');
 const css=w.getComputedStyle(img);
 assert.equal(css.position,'absolute');assert.equal(css.width,'100%');assert.equal(css.height,'100%');assert.equal(css.objectFit,'cover');assert.equal(css.display,'block');
 }
 console.log('PASS actual Studio: landscape frame and light/dark crops '+path);
 dom.window.close();
}
