// Only standard browser-owned push gateways may receive outbound requests.
// Reject arbitrary URLs to avoid an SSRF relay.
const key=/^[A-Za-z0-9_-]+$/;
export function validateSubscription(input){
 if(!input||typeof input!=='object'||typeof input.endpoint!=='string'||input.endpoint.length>2048)return null;
 let url;try{url=new URL(input.endpoint)}catch{return null}
 if(url.protocol!=='https:'||url.port||url.username||url.password||url.hash||url.pathname==='/'||url.search)return null;
 const h=url.hostname;
 if(!(h==='fcm.googleapis.com'||h==='updates.push.services.mozilla.com'||h==='web.push.apple.com'||h.endsWith('.push.apple.com')||h.endsWith('.notify.windows.com')))return null;
 const p=input.keys?.p256dh,a=input.keys?.auth;
 if(typeof p!=='string'||typeof a!=='string'||p.length!==87||a.length!==22||!key.test(p)||!key.test(a)||!p.startsWith('B'))return null;
 return {endpoint:url.href,keys:{p256dh:p,auth:a}};
}
export function pilotAllowed(uid,allowed){return typeof uid==='string'&&uid.length>0&&allowed.has(uid)}
export function permitTest(last,now){return !Number.isFinite(last)||now-last>=60000}
export function testPayload(){return JSON.stringify({kind:'test'})}
