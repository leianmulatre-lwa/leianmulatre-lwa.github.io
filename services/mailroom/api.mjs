// Admin-only test-send HTTP logic. Intentionally no public member-mail endpoint.
import { composeMessage } from "./compose.mjs";

const TEMPLATE_IDS = new Set(["verify","reset","email-change","mfa"]);
const JSON_HEADERS = Object.freeze({
  "Content-Type":"application/json; charset=utf-8",
  "Cache-Control":"no-store",
  "X-Content-Type-Options":"nosniff",
  "Vary":"Origin"
});
export function createRateLimiter({max=3,windowMs=5*60*1000,now=()=>Date.now()}={}) {
  const byUid = new Map();
  return uid => {
    const t=now();
    const recent=(byUid.get(uid)||[]).filter(x=>x>t-windowMs);
    if (recent.length>=max) {byUid.set(uid,recent);return false;}
    recent.push(t);byUid.set(uid,recent);
    // Dev-only memory limit; use a shared durable limiter before multiple replicas.
    if(byUid.size>1000)for(const [k,v] of byUid)if(v.every(x=>x<=t-windowMs))byUid.delete(k);
    return true;
  };
}
const respond=(status,body,headers={})=>({status,body,headers:{...JSON_HEADERS,...headers}});
const fail=(status,error,headers)=>respond(status,{error},headers);

export function createMailroomApi({
  verifyToken, getUser, getAdmin, getProfile, getTemplate, sendMail,
  enabled=false, authDeliveryEnabled=false,
  allowedOrigin="https://biglwa.com", allowAttempt=createRateLimiter()
}) {
  if ([verifyToken,getUser,getAdmin,getProfile,getTemplate,sendMail].some(x=>typeof x!=="function"))
    throw new Error("Mailroom dependencies must be explicitly supplied.");
  return async function handle({method,path,origin,authorization,body}) {
    if (method==="GET"&&path==="/health") return respond(200,{
      status:"ok",sendEnabled:enabled,authDeliveryEnabled
    });
    const cors = origin===allowedOrigin ? {
      "Access-Control-Allow-Origin":allowedOrigin,
      "Access-Control-Allow-Headers":"authorization, content-type",
      "Access-Control-Allow-Methods":"POST, OPTIONS"
    } : {};
    if (method==="OPTIONS"&&path==="/v1/admin/test-email") {
      return origin===allowedOrigin ? {status:204,body:null,headers:{...JSON_HEADERS,...cors}} : fail(403,"origin_not_allowed");
    }
    if (path!=="/v1/admin/test-email"||method!=="POST") return fail(404,"not_found");
    if (origin!==allowedOrigin) return fail(403,"origin_not_allowed");
    if (!enabled) return fail(503,"mail_delivery_not_enabled",cors);
    const authHeader=String(authorization||"");
    if(!/^Bearer [A-Za-z0-9_.-]+$/.test(authHeader))return fail(401,"sign_in_required",cors);
    if(!body || typeof body!=="object" || Array.isArray(body) ||
       Object.keys(body).length!==1 || typeof body.templateId!=="string" ||
       !TEMPLATE_IDS.has(body.templateId))return fail(400,"invalid_test_request",cors);
    try {
      const decoded=await verifyToken(authHeader.slice(7));
      if (!decoded || typeof decoded.uid!=="string" || !decoded.uid ||
          decoded.email_verified!==true)return fail(403,"verified_developer_required",cors);
      const [role,account]=await Promise.all([getAdmin(decoded.uid),getUser(decoded.uid)]);
      if(role?.active!==true || !account || account.uid!==decoded.uid ||
         account.emailVerified!==true || !account.email ||
         account.disabled===true || decoded.email!==account.email)
        return fail(403,"verified_developer_required",cors);
      if(!allowAttempt(decoded.uid))return fail(429,"too_many_test_emails",cors);
      const [profile,saved] = await Promise.all([
        getProfile(decoded.uid), getTemplate(body.templateId)
      ]);
      const letter=composeMessage({
        id:body.templateId,account,profile:profile||{},
        template:saved||undefined,mode:"test"
      });
      await sendMail(letter);  // Sender chooses SMTP service; never takes untrusted recipient.
      return respond(202,{status:"accepted_by_smtp",kind:body.templateId},cors);
    }catch {
      // Never return SMTP credentials, Firebase errors or an email address to the client.
      return fail(502,"mailroom_service_unavailable",cors);
    }
  };
}
