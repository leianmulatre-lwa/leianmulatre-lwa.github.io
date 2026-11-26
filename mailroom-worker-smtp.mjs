/* Worker SMTP submission for Big LWA Mailroom.
 * Cloudflare Workers allow outbound TCP on 465/587; port 25 is blocked. Secrets
 * come only from the Worker environment and are never returned to the browser. */
import { connect } from "cloudflare:sockets";
import {
  base64Utf8, createSmtpMessage, dotStuff, mailSmtpConfig, smtpAuthPlain
} from "./mailroom-worker-mail.mjs";

const CRLF = "\r\n";
const encoder = new TextEncoder();
const decoder = new TextDecoder();

class SmtpSession {
  constructor(socket) {
    this.socket = socket;
    this.reader = socket.readable.getReader();
    this.writer = socket.writable.getWriter();
    this.partial = "";
    this.lines = [];
    this.closed = false;
  }

  async readLine() {
    while (!this.lines.length) {
      const { value, done } = await this.reader.read();
      if (done) throw new Error("SMTP connection closed before a reply arrived.");
      this.partial += decoder.decode(value, { stream: true });
      const parts = this.partial.split("\n");
      this.partial = parts.pop() || "";
      for (const part of parts) this.lines.push(part.replace(/\r$/, ""));
    }
    return this.lines.shift();
  }

  async readResponse() {
    let code = 0;
    let text = "";
    while (true) {
      const line = await this.readLine();
      const current = Number(line.slice(0, 3));
      if (!code) code = current;
      text += (text ? CRLF : "") + line;
      if (!Number.isFinite(current) || line.length === 3 || line[3] === " ") return { code, text };
    }
  }

  async command(line, expected) {
    await this.writer.write(encoder.encode(line + CRLF));
    const response = await this.readResponse();
    if (!expected.includes(response.code))
      throw new Error("SMTP command was refused (" + response.code + ").");
    return response;
  }

  async writeRaw(value) {
    await this.writer.write(encoder.encode(value));
  }

  async close() {
    if (this.closed) return;
    this.closed = true;
    try { this.writer.close(); } catch (_) {}
    try { this.socket.close(); } catch (_) {}
  }
}

function withTimeout(promise, ms, message) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then((value) => { clearTimeout(timer); resolve(value); },
      (error) => { clearTimeout(timer); reject(error); });
  });
}

export async function sendSmtpMail(config, message) {
  const mail = mailSmtpConfig(config);
  const socket = connect({ hostname: mail.host, port: mail.port }, {
    secureTransport: mail.port === 465 ? "on" : "starttls"
  });
  let session = new SmtpSession(socket);
  try {
    await withTimeout(session.readResponse(), 15000, "SMTP greeting timed out.");
    let ehlo = await withTimeout(session.command("EHLO biglwa.com", [250]), 15000, "SMTP greeting timed out.");
    if (mail.port === 587) {
      if (!/\bSTARTTLS\b/i.test(ehlo.text)) throw new Error("SMTP server does not offer STARTTLS.");
      await withTimeout(session.command("STARTTLS", [220]), 15000, "SMTP upgrade timed out.");
      session = new SmtpSession(socket.startTls());
      ehlo = await withTimeout(session.command("EHLO biglwa.com", [250]), 15000, "SMTP greeting timed out.");
    }
    if (/\bPLAIN\b/i.test(ehlo.text)) {
      await withTimeout(session.command("AUTH PLAIN " + smtpAuthPlain(mail.user, mail.pass), [235]),
        15000, "SMTP authentication timed out.");
    } else if (/\bLOGIN\b/i.test(ehlo.text)) {
      await withTimeout(session.command("AUTH LOGIN", [334]), 15000, "SMTP authentication timed out.");
      await withTimeout(session.command(base64Utf8(mail.user), [334]), 15000, "SMTP authentication timed out.");
      await withTimeout(session.command(base64Utf8(mail.pass), [235]), 15000, "SMTP authentication timed out.");
    } else {
      throw new Error("SMTP server does not offer a supported authentication method.");
    }
    await withTimeout(session.command("MAIL FROM:<" + mail.from + ">", [250]), 15000, "SMTP send timed out.");
    const to = message.match(/^To: <([^>]+)>/m)?.[1] || "";
    if (!to) throw new Error("SMTP recipient is missing.");
    await withTimeout(session.command("RCPT TO:<" + to + ">", [250, 251]), 15000, "SMTP send timed out.");
    await withTimeout(session.command("DATA", [354]), 15000, "SMTP send timed out.");
    await withTimeout(session.writeRaw(dotStuff(message)), 15000, "SMTP send timed out.");
    await withTimeout(session.command(".", [250]), 30000, "SMTP send timed out.");
    try { await session.command("QUIT", [221]); } catch (_) {}
    return { accepted: true };
  } finally {
    await session.close();
  }
}
