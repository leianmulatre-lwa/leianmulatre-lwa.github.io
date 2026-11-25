/* No fetch handler: don't cache private Studio content, OAuth or mutable application shells. */
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
// Standard Web Push, independent of the Firebase Messaging SDK.
// Fixed visible copy prevents private content and untrusted URLs on lock screens.
self.addEventListener('push',event=>{
 let message={};try{message=event.data?.json()||{}}catch{}
 const test=message.kind==='test';
 event.waitUntil(self.registration.showNotification('BIG LWA',{
  body:test?'Your remote test notification is working.':'You have a new update. Open Studio to view it.',
  icon:'/apple-touch-icon.png',tag:test?'biglwa-remote-test':'biglwa-update',data:{url:'/studio'}
 }));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();
 // Only navigate to our Studio; no untrusted notification links.
 event.waitUntil((async()=>{
  const url=new URL('/studio',self.location.origin).href;
  const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  const client=windows.find(w=>w.url===url||w.url.startsWith(url+'?'));
  if(client){await client.focus();return;}
  await self.clients.openWindow(url);
 })());
});
