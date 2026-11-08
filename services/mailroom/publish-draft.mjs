#!/usr/bin/env node
/* Trusted administrator CLI. Firestore approved snapshot, not a Firebase native
 * template update. No email sending or SMTP credential access.
 */
import {getApps,initializeApp,applicationDefault} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import {planPublication} from "./published.mjs";

function options(argv){
  const flags={};
  for(const arg of argv){
    if(arg==="--apply")flags.apply=true;
    else if(/^--[a-z-]+=/.test(arg)){
      const at=arg.indexOf("=");flags[arg.slice(2,at)]=arg.slice(at+1);
    } else throw new Error("Unknown CLI argument");
  }
  if(!["verify","reset"].includes(flags.id))throw new Error("Expected --id=verify or --id=reset");
  if(!flags["admin-uid"])throw new Error("Expected --admin-uid=FIREBASE_UID");
  return flags;
}
async function run(){
  const opts=options(process.argv.slice(2));
  if(process.env.GOOGLE_CLOUD_PROJECT && process.env.GOOGLE_CLOUD_PROJECT!=="biglwa")
    throw new Error("Wrong Google Cloud project");
  const app=getApps().find(a=>a.options.projectId==="biglwa")||
    initializeApp({credential:applicationDefault(),projectId:"biglwa"});
  const db=getFirestore(app);
  const role=db.collection("developerAdmins").doc(opts["admin-uid"]);
  const source=db.collection("developerMailTemplates").doc(opts.id);
  const published=db.collection("developerMailPublished").doc(opts.id);
  const [r,s]=await Promise.all([role.get(),source.get()]);
  if(!r.exists||r.data()?.active!==true)throw new Error("Publisher is not an active developer");
  if(!s.exists)throw new Error("Save your letter in the Developer Console first");
  const p=planPublication({id:opts.id,draft:s.data(),adminUid:opts["admin-uid"]});
  process.stdout.write(JSON.stringify({project:"biglwa",id:opts.id,sourceRevision:p.sourceRevision,
    subject:p.copy.subject,sha256:p.sha256,mode:opts.apply?"apply requested":"PREVIEW ONLY"},null,2)+"\n");
  if(!opts.apply){
    process.stdout.write("No live messages changed. Approve with --apply --confirm-revision="+p.sourceRevision+
      " --confirm-sha256="+p.sha256+"\n");return;
  }
  if(Number(opts["confirm-revision"])!==p.sourceRevision||opts["confirm-sha256"]!==p.sha256)
    throw new Error("Must confirm exact revision and SHA-256 from preview");
  await db.runTransaction(async tx=>{
    const [fresh,again,prior]=await Promise.all([tx.get(source),tx.get(role),tx.get(published)]);
    if(!again.exists||again.data()?.active!==true)throw new Error("Developer role changed");
    if(!fresh.exists)throw new Error("Draft missing");
    const checked=planPublication({id:opts.id,draft:fresh.data(),adminUid:opts["admin-uid"]});
    if(checked.sha256!==p.sha256||checked.sourceRevision!==p.sourceRevision)
      throw new Error("Draft changed, rerun preview");
    tx.set(published,{...checked,previousRevision:prior.exists?prior.data().sourceRevision:null,
      publishedAt:new Date()});
  });
  process.stdout.write("Approved Mailroom snapshot published. This did NOT send email or change Firebase SMTP.\n");
}
run().catch(error=>{process.stderr.write("Mailroom approval refused: "+String(error.message||"error")+"\n");process.exitCode=1;});
