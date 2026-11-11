// Read-only BIG LWA mail DNS preflight. NEVER changes DNS or Firebase.
import { promises as dns } from "node:dns";
import { isIP } from "node:net";

const ROOT = "biglwa.com";
const DEFAULT_HOST = "mail.biglwa.com";
const TITAN_MX = new Set(["mx1.titan.email", "mx2.titan.email"]);
const canon = x => String(x||"").trim().replace(/\.$/,"").toLowerCase();

export function assessDns(snapshot, {host=DEFAULT_HOST,ip,selector=""}={}) {
  const errors=[], warnings=[], passed=[];
  const a=(snapshot.a||[]).map(canon);
  const ptr=(snapshot.ptr||[]).map(canon);
  const mx=(snapshot.mx||[]).map(x=>canon(x.exchange));
  const spf=(snapshot.spf||[]).map(x=>String(x).replace(/^["']|["']$/g,"").trim()).filter(x=>/^v=spf1(?:\s|$)/i.test(x));
  const dmarc=(snapshot.dmarc||[]).map(String).filter(x=>/^v=DMARC1(?:;|$)/i.test(x.trim()));
  if (isIP(ip)!==4) errors.push("MAIL_IPV4 must be the assigned static public IPv4 address.");
  if (canon(host)!==DEFAULT_HOST) warnings.push("This review assumes dedicated DNS-only hostname mail.biglwa.com.");
  if (!a.includes(ip)) errors.push("mail.biglwa.com must have a DNS-only A record for the assigned IP.");
  else passed.push("Mail hostname resolves to the intended IP.");
  if (!ptr.includes(canon(host))) errors.push("Host provider must set reverse DNS (PTR) to "+host+".");
  else passed.push("Host reverse DNS matches its sending hostname.");
  if (mx.length!==2 || mx.some(x=>!TITAN_MX.has(x)) || !mx.includes("mx1.titan.email") || !mx.includes("mx2.titan.email"))
    errors.push("Existing Titan MX records must stay in place. Stop and review any inbox routing change.");
  else passed.push("Current Titan MX inbound routing preserved.");
  if (spf.length!==1) errors.push("Apex must have exactly ONE SPF TXT record; edit the existing value rather than adding another.");
  else {
    passed.push("Exactly one apex SPF record.");
    if (!spf[0].includes("include:_spf.firebasemail.com")) warnings.push("Existing Firebase sender authorization is missing; review before cutover.");
    if (isIP(ip)===4 && !spf[0].includes("ip4:"+ip)) warnings.push("Mail server IP has not yet been included in the existing SPF record.");
    if (isIP(ip)===4 && spf[0].includes("ip4:"+ip)) passed.push("Mail server is included in apex SPF.");
  }
  if (dmarc.length!==1) errors.push("Expected exactly one _dmarc.biglwa.com TXT policy.");
  else passed.push("DMARC record present.");
  if(selector) {
    if(!/^[a-z0-9_-]{1,63}$/i.test(selector)) errors.push("DKIM selector has an invalid format.");
    else if(!(snapshot.dkim||[]).some(x=>/v=DKIM1/i.test(x))) warnings.push("Stalwart DKIM TXT record for selector "+selector+" is not published.");
    else passed.push("Stalwart DKIM selector found (cryptographic validation still required).");
  } else warnings.push("Set MAIL_DKIM_SELECTOR after Stalwart generates a key; do not guess the selector.");
  warnings.push("Confirm mail.biglwa.com is DNS-only (gray cloud), not proxied, in Cloudflare.");
  warnings.push("Confirm SMTP TLS certificate and authenticated send, outbound TCP/25, and real inbox SPF/DKIM/DMARC results.");
  return {ready:errors.length===0 && Boolean(selector) && warnings.filter(x=>/not yet|not published|missing/i.test(x)).length===0,passed,errors,warnings};
}
async function safe(fn) {
  try {return await fn()}catch(e){if(["ENODATA","ENOTFOUND","ENODOMAIN","ESERVFAIL"].includes(e.code))return [];throw e}
}
export async function collectDns({host=DEFAULT_HOST,ip,selector=""}={}) {
  const [a,ptr,mx,rootTxt,dmTxt,keyTxt]=await Promise.all([
    safe(()=>dns.resolve4(host)),safe(()=>isIP(ip)===4?dns.reverse(ip):Promise.resolve([])),
    safe(()=>dns.resolveMx(ROOT)),safe(()=>dns.resolveTxt(ROOT)),
    safe(()=>dns.resolveTxt("_dmarc."+ROOT)),
    selector?safe(()=>dns.resolveTxt(selector+"._domainkey."+ROOT)):Promise.resolve([])
  ]);
  return {a,ptr,mx,spf:rootTxt.map(x=>x.join("")),dmarc:dmTxt.map(x=>x.join("")),dkim:keyTxt.map(x=>x.join(""))};
}
if(process.argv[1] && import.meta.url===new URL("file://"+process.argv[1]).href) {
  const ip=process.env.MAIL_IPV4||"";
  const host=process.env.MAIL_HOST||DEFAULT_HOST;
  const selector=process.env.MAIL_DKIM_SELECTOR||"";
  const snapshot=await collectDns({host,ip,selector});
  const report=assessDns(snapshot,{host,ip,selector});
  process.stdout.write(JSON.stringify(report,null,2)+"\n");
  if(!report.ready)process.exitCode=1;
}
