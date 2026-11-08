import {createHash} from "node:crypto";

export function nextRateLimitState(attempts,now,{max=3,windowMs=15*60*1000}={}) {
  const recent=(Array.isArray(attempts)?attempts:[])
    .filter(value=>Number.isSafeInteger(value)&&value>now-windowMs&&value<=now);
  if(recent.length>=max)return {allowed:false,attempts:recent};
  return {allowed:true,attempts:[...recent,now]};
}

export function createFirestoreRateLimiter({db,now=()=>Date.now(),max=3,windowMs=15*60*1000}) {
  if(!db||typeof db.runTransaction!=="function")throw new Error("Firestore rate limiter requires a database");
  return async ({uid,type})=>{
    if(typeof uid!=="string"||!uid||!["verify","reset"].includes(type))return false;
    const key=createHash("sha256").update("member:"+uid+":"+type).digest("hex");
    const ref=db.collection("mailroomDeliveryLimits").doc(key);
    return db.runTransaction(async tx=>{
      const snap=await tx.get(ref);
      const state=nextRateLimitState(snap.exists?snap.data()?.attempts:[],now(),{max,windowMs});
      tx.set(ref,{attempts:state.attempts,updatedAtMs:now()});
      return state.allowed;
    });
  };
}
