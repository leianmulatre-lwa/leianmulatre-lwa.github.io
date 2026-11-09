#!/usr/bin/env node
/* Trusted command-line only. Reads Firestore drafts, previews a Firebase
 * Identity Toolkit PATCH, applies ONLY with project+revision+SHA confirmation.
 * It NEVER reads, displays, updates or writes SMTP credentials.
 */
import {mkdir,writeFile} from "node:fs/promises";
import {homedir} from "node:os";
import {join} from "node:path";
import {planPublish,verifyPublishConfirmation} from "./publish-plan.mjs";
import {formatProviderFailure} from "./provider-error.mjs";

function flags(argv) {
  const result={};
  for(const arg of argv){
    if(arg==="--apply")result.apply=true;
    else if(/^--[a-z-]+=/.test(arg)){
      const i=arg.indexOf("="); result[arg.slice(2,i)]=arg.slice(i+1);
    } else throw new Error("Unknown argument: "+arg);
  }
  if(!["verify","reset"].includes(result.id))
    throw new Error("Specify --id=verify or --id=reset.");
  return result;
}
const ENDPOINT="https://identitytoolkit.googleapis.com/admin/v2/projects/biglwa/config";
async function execute() {
  const opts=flags(process.argv.slice(2));
  if (process.env.GOOGLE_CLOUD_PROJECT && process.env.GOOGLE_CLOUD_PROJECT!=="biglwa")
    throw new Error("Wrong GOOGLE_CLOUD_PROJECT.");
  if(process.env.GCLOUD_PROJECT && process.env.GCLOUD_PROJECT!=="biglwa")
    throw new Error("Wrong GCLOUD_PROJECT.");
  // Lazy imports: no browser credentials, service-account JSON committed, or
  // secrets in the repo. Use developer's own IAM/ADC credentials on a trusted PC.
  const [{getApps,initializeApp,applicationDefault},{getFirestore},{GoogleAuth}]=await Promise.all([
    import("firebase-admin/app"),import("firebase-admin/firestore"),import("google-auth-library")
  ]);
  const app=getApps().find(a=>a.options.projectId==="biglwa") ||
    initializeApp({credential:applicationDefault(),projectId:"biglwa"});
  const firestore=getFirestore(app);
  const readDraft=async()=>{
    const snap=await firestore.collection("developerMailTemplates").doc(opts.id).get();
    if(!snap.exists)throw new Error("Save this letter in the Developer Console first.");
    const d=snap.data();
    if(typeof d?.updatedBy!=="string"||!d.updatedBy||
       !Number.isSafeInteger(d.revision)||d.revision<1)
      throw new Error("Missing draft revision or editor identity.");
    const role=await firestore.collection("developerAdmins").doc(d.updatedBy).get();
    if(!role.exists||role.data()?.active!==true)
      throw new Error("The saved draft was not edited by a currently active developer.");
    return d;
  };
  const auth=new GoogleAuth({scopes:["https://www.googleapis.com/auth/identitytoolkit"]});
  const client=await auth.getClient();
  const token=await client.getAccessToken();
  if(!token.token)throw new Error("Missing Google application credentials.");
  const request=async(method,url,body)=>{
    const resp=await fetch(url,{
      method,
      headers:{"Authorization":"Bearer "+token.token,"Accept":"application/json",
        ...(body?{"Content-Type":"application/json"}:{})},
      body:body?JSON.stringify(body):undefined,
      signal:AbortSignal.timeout(12000)
    });
    if(!resp.ok){
      let providerError={};
      try { providerError=await resp.json(); } catch {}
      throw new Error(formatProviderFailure(method,resp.status,providerError));
    }
    return await resp.json();
  };
  const original=await request("GET",ENDPOINT);
  const draft=await readDraft();
  const plan=planPublish(opts.id,draft,original);
  process.stdout.write(JSON.stringify({
    project:"biglwa",templateId:opts.id,firestoreRevision:plan.revision,
    target:plan.target,changedFields:plan.changedFields,
    currentSender:"Firebase's existing custom SMTP setup — untouched",
    newSubject:plan.request.notification.sendEmail[plan.target].subject,
    fingerprint:plan.fingerprint,
    mode:opts.apply?"apply requested":"PREVIEW ONLY"
  },null,2)+"\n");
  if(!opts.apply){
    process.stdout.write("\nNo Firebase settings changed. To apply, re-run with --apply "+
      "--confirm-project=biglwa --confirm-revision="+plan.revision+
      " --confirm-fingerprint="+plan.fingerprint+"\n");
    return;
  }
  verifyPublishConfirmation(plan,{
    project:opts["confirm-project"],
    revision:Number(opts["confirm-revision"]),
    fingerprint:opts["confirm-fingerprint"]
  });
  if(plan.changedFields.length===0){process.stdout.write("Already matches saved Mailroom draft.\n");return;}
  // Re-fetch and refuse stale revisions/config, avoiding silent overwrites.
  const refreshedDraft=await readDraft();
  const refreshedConfig=await request("GET",ENDPOINT);
  const fresh=planPublish(opts.id,refreshedDraft,refreshedConfig);
  if(fresh.fingerprint!==plan.fingerprint ||
      fresh.changedFields.join(",")!==plan.changedFields.join(",") ||
      JSON.stringify(fresh.previous)!==JSON.stringify(plan.previous))
    throw new Error("Draft or remote Firebase template changed. Start a new preview.");
  const backups=join(homedir(),".biglwa-mailroom-backups");
  await mkdir(backups,{recursive:true,mode:0o700});
  const stamp=new Date().toISOString().replace(/[:.]/g,"-");
  const backupPath=join(backups,opts.id+"-"+stamp+".json");
  // Back up ONLY one template's previous 3 public copy fields, NEVER the full
  // config, which may contain private custom SMTP account information.
  await writeFile(backupPath,JSON.stringify({
    project:"biglwa",target:plan.target,revision:plan.revision,
    previous:plan.previous,fingerprint:plan.fingerprint
  },null,2),{flag:"wx",mode:0o600});
  const url=ENDPOINT+"?updateMask="+encodeURIComponent(plan.updateMask);
  const result=await request("PATCH",url,plan.request);
  const actual=result.notification?.sendEmail?.[plan.target];
  if(!actual||actual.subject!==fresh.request.notification.sendEmail[plan.target].subject||
      actual.body!==fresh.request.notification.sendEmail[plan.target].body)
    throw new Error("Firebase responded but template content was not confirmed. Inspect Authentication Templates manually.");
  process.stdout.write(JSON.stringify({
    status:"PUBLISHED",project:"biglwa",templateId:opts.id,
    revision:plan.revision,backupPath,
    smtp:"unchanged",changedFields:plan.changedFields
  },null,2)+"\n");
}
execute().catch(error=>{
  // Avoid printing provider response bodies or token details.
  process.stderr.write("Mailroom publish refused: "+String(error.message||"Unknown error")+"\n");
  process.exitCode=1;
});
