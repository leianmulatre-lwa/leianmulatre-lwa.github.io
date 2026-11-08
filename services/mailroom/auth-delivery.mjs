// Internal-only Firebase action sender: NOT exposed through an HTTP route.
// Requires an authenticated, separately reviewed signup/recovery workflow.
import { composeMessage } from "./compose.mjs";
const ACTIONS = new Set(["verify","reset"]);
export function createAuthDelivery({
  auth, loadProfile, sendMail, enabled=false, onAccepted=async()=>{}
}) {
  if (!auth || typeof auth.getUser!=="function" ||
    typeof auth.generateEmailVerificationLink!=="function" ||
    typeof auth.generatePasswordResetLink!=="function" ||
    typeof loadProfile!=="function" || typeof sendMail!=="function")
    throw new Error("Missing trusted Firebase Admin or delivery dependencies.");
  return async function sendAuthAction({uid,type}) {
    if (!enabled) throw new Error("Custom Firebase authentication delivery remains disabled.");
    if (!ACTIONS.has(type) || typeof uid!=="string" || !uid)
      throw new Error("Unsupported authentication email event.");
    const account=await auth.getUser(uid);
    if (!account || !account.email || account.disabled)
      throw new Error("No eligible account.");
    if (type==="verify" && account.emailVerified===true)
      return {status:"already_verified"};
    const actionUrl=type==="verify"
      ? await auth.generateEmailVerificationLink(account.email)
      : await auth.generatePasswordResetLink(account.email);
    const profile=await loadProfile(uid);
    // Use reviewed default templates for auth delivery until a real
    // draft -> approved/published workflow is built.
    const letter=composeMessage({
      id:type,account,profile:profile||{},mode:"auth",actionUrl
    });
    const result=await sendMail(letter);
    await onAccepted({uid,type}); // store only event metadata; NEVER store link or token
    return {status:"accepted_by_smtp",result};
  };
}
