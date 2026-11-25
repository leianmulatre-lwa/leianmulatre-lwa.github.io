/* Public browser configuration only. Never put a Firebase service account or private VAPID key here. */
globalThis.BIGLWA_PUSH_CONFIG=Object.freeze({
 firebase:{
  "apiKey": "AIzaSyAPUT8_pLNxdh5tbGpAmXBJiID3jVcA9DY",
  "authDomain": "biglwa.firebaseapp.com",
  "projectId": "biglwa",
  "storageBucket": "biglwa.firebasestorage.app",
  "messagingSenderId": "83232670555",
  "appId": "1:83232670555:web:e04927b20458390b3b507e"
},
 // Independent BIG LWA sender. Leave blank until a private pilot is deployed.
 // Only a public VAPID key and HTTPS API origin belong in the browser.
 transport:'web-push',
 vapidKey:'',
 apiOrigin:''
});
