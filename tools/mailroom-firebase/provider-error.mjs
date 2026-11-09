const SAFE_ERROR_WORDS = /\b(argument|body|email|field|format|html|mask|payload|subject|template|value)\b|not (?:allowed|supported)|required|unknown/i;

function safeMessage(value) {
  if (typeof value !== "string" || !SAFE_ERROR_WORDS.test(value)) return "";
  return value.slice(0,4000)
    .replace(/<[\s\S]*>/g,"[html]")
    .replace(/https?:\/\/[^\s"']+/gi,"[url]")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,"[email]")
    .replace(/[\r\n\t]+/g," ")
    .replace(/\s{2,}/g," ")
    .trim()
    .slice(0,400);
}

function safeToken(value,pattern) {
  return typeof value==="string" && pattern.test(value) ? value.slice(0,200) : "";
}

function safeDetails(details) {
  if(!Array.isArray(details)) return [];
  const result=[];
  for(const detail of details.slice(0,5)) {
    const type=safeToken(String(detail?.["@type"]||"").split("/").pop(),/^[A-Za-z][A-Za-z0-9.]{0,99}$/);
    if(type) result.push("type="+type);
    const reason=safeToken(detail?.reason,/^[A-Z][A-Z0-9_]{0,99}$/);
    if(reason) result.push("reason="+reason);
    const violations=[
      ...(Array.isArray(detail?.fieldViolations)?detail.fieldViolations:[]),
      ...(Array.isArray(detail?.violations)?detail.violations:[])
    ];
    for(const violation of violations.slice(0,5)) {
      const field=safeToken(violation?.field,/^[A-Za-z][A-Za-z0-9_.\[\]-]{0,199}$/);
      const violationType=safeToken(violation?.type,/^[A-Z][A-Z0-9_]{0,99}$/);
      const description=safeMessage(violation?.description);
      if(field) result.push("field="+field);
      if(violationType) result.push("violation="+violationType);
      if(description) result.push("detail="+description);
    }
  }
  return result.slice(0,10);
}

export function formatProviderFailure(method,httpStatus,payload) {
  const providerStatus=typeof payload?.error?.status==="string" &&
    /^[A-Z][A-Z0-9_]{0,63}$/.test(payload.error.status)
    ? payload.error.status : "";
  const message=safeMessage(payload?.error?.message);
  const details=safeDetails(payload?.error?.details);
  const labels=[String(httpStatus),providerStatus].filter(Boolean).join("; ");
  const summary=[message,...details].filter(Boolean).join("; ");
  return "Identity Toolkit "+method+" failed ("+labels+")"+
    (summary?": "+summary:". Provider response details were withheld.");
}
