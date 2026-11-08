// Signed-in member authentication email requests. The caller never supplies a
// recipient, message body, or action URL; Firebase Admin and approved Mailroom
// publications remain authoritative for all three.
const JSON_HEADERS = Object.freeze({
  "Content-Type":"application/json; charset=utf-8",
  "Cache-Control":"no-store",
  "X-Content-Type-Options":"nosniff",
  "Vary":"Origin"
});

const respond=(status,body,headers={})=>({status,body,headers:{...JSON_HEADERS,...headers}});
const fail=(status,error,headers)=>respond(status,{error},headers);

export function createMemberAuthApi({
  verifyToken,getUser,deliverAuth,allowAttempt,
  enabled=false,allowedOrigin="https://biglwa.com"
}) {
  if([verifyToken,getUser,deliverAuth,allowAttempt].some(fn=>typeof fn!=="function"))
    throw new Error("Member Mailroom dependencies must be explicitly supplied");
  return async function handle({method,path,origin,authorization,body}) {
    if(path!=="/v1/auth/email-action")return null;
    const cors=origin===allowedOrigin?{
      "Access-Control-Allow-Origin":allowedOrigin,
      "Access-Control-Allow-Headers":"authorization, content-type",
      "Access-Control-Allow-Methods":"POST, OPTIONS"
    }:{};
    if(method==="OPTIONS")return origin===allowedOrigin?
      {status:204,body:null,headers:{...JSON_HEADERS,...cors}}:fail(403,"origin_not_allowed");
    if(method!=="POST")return fail(404,"not_found");
    if(origin!==allowedOrigin)return fail(403,"origin_not_allowed");
    if(!enabled)return fail(503,"mail_delivery_not_enabled",cors);
    const authHeader=String(authorization||"");
    if(!/^Bearer [A-Za-z0-9_.-]+$/.test(authHeader))return fail(401,"sign_in_required",cors);
    if(!body||typeof body!=="object"||Array.isArray(body)||
      Object.keys(body).length!==1||!["verify","reset"].includes(body.type))
      return fail(400,"invalid_email_action",cors);
    try{
      const decoded=await verifyToken(authHeader.slice(7));
      if(!decoded||typeof decoded.uid!=="string"||!decoded.uid)
        return fail(401,"sign_in_required",cors);
      const account=await getUser(decoded.uid);
      if(!account||account.uid!==decoded.uid||account.disabled===true||!account.email||
        typeof decoded.email!=="string"||decoded.email!==account.email)
        return fail(403,"account_not_eligible",cors);
      if(body.type==="reset"&&
        !account.providerData?.some(provider=>provider.providerId==="password"))
        return fail(400,"password_sign_in_not_enabled",cors);
      if(body.type==="verify"&&account.emailVerified===true)
        return respond(200,{status:"already_verified",kind:"verify"},cors);
      if(!await allowAttempt({uid:decoded.uid,type:body.type}))
        return fail(429,"too_many_email_requests",cors);
      const result=await deliverAuth({uid:decoded.uid,type:body.type});
      return respond(result.status==="already_verified"?200:202,
        {status:result.status,kind:body.type},cors);
    }catch{
      // Never reveal SMTP, Firebase, publication, or account details.
      return fail(502,"mailroom_service_unavailable",cors);
    }
  };
}
