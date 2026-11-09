export function parsePublicationOptions(argv) {
  const flags={};
  for(const arg of argv){
    if(arg==="--apply")flags.apply=true;
    else if(/^--[a-z0-9-]+=/.test(arg)){
      const at=arg.indexOf("=");flags[arg.slice(2,at)]=arg.slice(at+1);
    } else throw new Error("Unknown CLI argument: "+arg);
  }
  if(!["verify","reset"].includes(flags.id))throw new Error("Expected --id=verify or --id=reset");
  if(!flags["admin-uid"])throw new Error("Expected --admin-uid=FIREBASE_UID");
  return flags;
}
