/* Internal trusted Firebase link generation. Not an HTTP endpoint. */
import {composeMessage} from "./compose.mjs";
import {requireApprovedCopy} from "./published.mjs";
const ACTIONS=new Set(["verify","reset"]);
export function createApprovedAuthDelivery({
  auth,loadProfile,loadPublishedTemplate,sendMail,enabled=false,onAccepted=async()=>{}
}){
  if(!auth||typeof auth.getUser!=="function"||
    typeof auth.generateEmailVerificationLink!=="function"||
    typeof auth.generatePasswordResetLink!=="function"||
    [loadProfile,loadPublishedTemplate,sendMail,onAccepted].some(fn=>typeof fn!=="function"))
    throw new Error("Missing trusted Mailroom delivery dependency");
  return async function deliver({uid,type}){
    if(!enabled)throw new Error("Custom Firebase authentication delivery remains disabled");
    if(typeof uid!=="string"||!uid||!ACTIONS.has(type))
      throw new Error("Unsupported authentication email event");
    const account=await auth.getUser(uid);
    if(!account||!account.email||account.disabled)throw new Error("Ineligible account");
    if(type==="verify"&&account.emailVerified===true)return {status:"already_verified"};
    // Fail before generating a security link unless a reviewed publication exists.
    const publication=await loadPublishedTemplate(type);
    const template=requireApprovedCopy(type,publication);
    const link=type==="verify"?
      await auth.generateEmailVerificationLink(account.email):
      await auth.generatePasswordResetLink(account.email);
    const profile=await loadProfile(uid);
    const letter=composeMessage({id:type,account,profile:profile||{},template,mode:"auth",actionUrl:link});
    await sendMail(letter);
    await onAccepted({uid,type,sourceRevision:publication.sourceRevision});
    return {status:"accepted_by_smtp"};
  };
}
