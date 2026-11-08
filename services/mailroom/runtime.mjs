// Privileged runtime for an independent Node 22+ service, not GitHub Pages/Orbit Worker.
import { createMailroomApi } from "./api.mjs";
import { createAuthDelivery } from "./auth-delivery.mjs";

function requireEnv(env,key) {
  const value=String(env[key]||"").trim();
  if (!value) throw new Error("Missing server-only setting: "+key);
  return value;
}
function smtpConfig(env) {
  const host=requireEnv(env,"MAILROOM_SMTP_HOST");
  const port=Number(env.MAILROOM_SMTP_PORT||465);
  const user=requireEnv(env,"MAILROOM_SMTP_USER");
  const pass=requireEnv(env,"MAILROOM_SMTP_PASSWORD");
  const sender=String(env.MAILROOM_FROM||"lwazi@biglwa.com").toLowerCase().trim();
  if (![465,587].includes(port) || !/^[a-z0-9.-]+$/i.test(host) ||
      sender!=="lwazi@biglwa.com" || /[\r\n]/.test(user+pass) ||
      (env.MAILROOM_SMTP_TLS_SERVERNAME && !/^[a-z0-9.-]+$/i.test(env.MAILROOM_SMTP_TLS_SERVERNAME)))
    throw new Error("Invalid SMTP transport configuration.");
  return {
    host,port,secure:port===465,requireTLS:port===587,
    auth:{user,pass},tls:{rejectUnauthorized:true,
      servername:env.MAILROOM_SMTP_TLS_SERVERNAME || host},
    connectionTimeout:12000,greetingTimeout:12000,socketTimeout:20000,
    disableFileAccess:true,disableUrlAccess:true
  };
}
export async function buildRuntime(env=process.env) {
  if(env.FIREBASE_PROJECT_ID && env.FIREBASE_PROJECT_ID!=="biglwa")
    throw new Error("Firebase project ID mismatch.");
  const enabled=env.MAILROOM_ENABLE_TEST_SEND==="true";
  const authDeliveryEnabled=env.MAILROOM_ENABLE_AUTH_DELIVERY==="true";
  // Two independent manual gates. Auth delivery also requires an integration
  // with a trusted server workflow; there is deliberately no HTTP endpoint for it.
  const appModule=await import("firebase-admin/app");
  const authModule=await import("firebase-admin/auth");
  const storeModule=await import("firebase-admin/firestore");
  const app=appModule.getApps().find(a=>a.options.projectId==="biglwa") ||
    appModule.initializeApp({credential:appModule.applicationDefault(),projectId:"biglwa"});
  const auth=authModule.getAuth(app);
  const db=storeModule.getFirestore(app);
  let transporter=null;
  if(enabled || authDeliveryEnabled) {
    const {default:nodemailer}=await import("nodemailer");
    transporter=nodemailer.createTransport(smtpConfig(env));
  }
  const sendMail=async mail => {
    if (!transporter) throw new Error("SMTP sending not enabled.");
    // Mail identity and recipients are selected from verified Firebase records.
    const result=await transporter.sendMail({
      from:{name:"L’wazi 🤎 | Big LWA",address:"lwazi@biglwa.com"},
      to:mail.to,subject:mail.subject,text:mail.text,html:mail.html,headers:mail.headers
    });
    if(!result.accepted?.includes(mail.to))
      throw new Error("SMTP server did not accept message.");
    return {accepted:true};
  };
  const loadProfile=async uid => {
    const snap=await db.collection("users").doc(uid).get();
    return snap.exists ? snap.data() : {};
  };
  const handler=createMailroomApi({
    verifyToken:token=>auth.verifyIdToken(token,true),
    getUser:uid=>auth.getUser(uid),
    getAdmin:async uid=>{
      const snap=await db.collection("developerAdmins").doc(uid).get();
      return snap.exists?snap.data():null;
    },
    getProfile:loadProfile,
    getTemplate:async id=>{
      const snap=await db.collection("developerMailTemplates").doc(id).get();
      return snap.exists?snap.data():null;
    },
    sendMail,enabled
  });
  const deliverAuth=createAuthDelivery({
    auth,loadProfile,sendMail,enabled:authDeliveryEnabled
  });
  return {handler,deliverAuth};
}
