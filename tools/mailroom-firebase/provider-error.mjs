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

export function formatProviderFailure(method,httpStatus,payload) {
  const providerStatus=typeof payload?.error?.status==="string" &&
    /^[A-Z][A-Z0-9_]{0,63}$/.test(payload.error.status)
    ? payload.error.status : "";
  const message=safeMessage(payload?.error?.message);
  const labels=[String(httpStatus),providerStatus].filter(Boolean).join("; ");
  return "Identity Toolkit "+method+" failed ("+labels+")"+
    (message?": "+message:". Provider response details were withheld.");
}
