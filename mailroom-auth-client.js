// Browser bridge for the staged L’wazi Mailroom service. Firebase remains the
// rollback sender until the backend is deployed and enables auth delivery.
export const MAILROOM_API_ORIGIN="https://mailroom.biglwa.com";

export async function requestMailroomAuthEmail(user,type,{
  origin=MAILROOM_API_ORIGIN,fetchImpl=globalThis.fetch
}={}) {
  if(!user||typeof user.getIdToken!=="function")throw new Error("Sign in again to send this email.");
  if(!["verify","reset"].includes(type))throw new Error("Unsupported email action.");
  if(typeof fetchImpl!=="function")return {fallback:true};
  const endpoint=new URL("/v1/auth/email-action",origin);
  if(endpoint.protocol!=="https:")throw new Error("Mailroom requires HTTPS.");
  const token=await user.getIdToken();
  let response;
  try{
    response=await fetchImpl(endpoint,{method:"POST",mode:"cors",cache:"no-store",
      headers:{"Authorization":"Bearer "+token,"Content-Type":"application/json"},
      body:JSON.stringify({type})});
  }catch{
    return {fallback:true};
  }
  if(response.ok){
    const result=await response.json();
    return {fallback:false,status:result.status||"accepted_by_smtp"};
  }
  // These responses indicate that the staged service is unavailable or still
  // gated. Firebase remains the deliberate rollback during deployment.
  if([404,502,503].includes(response.status))return {fallback:true};
  if(response.status===429)throw new Error("Too many email requests. Wait a little, then try again.");
  if(response.status===401||response.status===403)throw new Error("Sign in again to send this email.");
  if(response.status===400&&type==="reset")
    throw new Error("This account does not use an email-and-password sign-in.");
  throw new Error("L’wazi Mailroom could not send that email.");
}
