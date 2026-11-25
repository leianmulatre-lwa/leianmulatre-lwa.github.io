/* No fetch handler: don't cache private Studio content, OAuth or mutable application shells. */
importScripts('/biglwa-push-config.js');
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
// Only initialize FCM after the project has a real public Web Push key.
if(self.BIGLWA_PUSH_CONFIG.vapidKey){
 importScripts('https://www.gstatic.com/firebasejs/12.18.0/firebase-app-compat.js','https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging-compat.js');
 firebase.initializeApp(self.BIGLWA_PUSH_CONFIG.firebase);
 const messaging=firebase.messaging();
 // The sender must use generic lock-screen copy. For data-only messages,
 // show only a neutral notification; no private content is exposed.
 messaging.onBackgroundMessage(payload=>{
  if(payload.notification)return; // FCM already displayed the notification.
  return self.registration.showNotification('BIG LWA',{body:'You have a new update. Open Studio to view it.',icon:'/apple-touch-icon.png',tag:'biglwa-update',data:{url:'/studio'}});
 });
}
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
