import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
const read=x=>readFileSync(new URL('./'+x,import.meta.url),'utf8');
const data=[1,2,3,4,5].map(n=>read('site-'+n+'.txt')).join('');
const html=gunzipSync(Buffer.from(data,'base64')).toString('utf8');
console.log('LEGACY SIZE',html.length);
for(const term of ['step inside','Step Inside','loginPage','loginEmail','loginPassword','signInBtn','signInTab','loginSubmit','signInWithEmailAndPassword']){
 const rg=new RegExp(term,'gi');let m,n=0;
 while((m=rg.exec(html))&&n++<5){console.log('SOURCE',term,'POS',m.index,'CONTEXT',JSON.stringify(html.slice(Math.max(0,m.index-350),m.index+470)));}
 if(!n)console.log('ABSENT',term);
}
const login=html.indexOf('id="loginPage"');
console.log('LOGIN COMPONENT',JSON.stringify(html.slice(Math.max(0,login-140),login+5000)));
