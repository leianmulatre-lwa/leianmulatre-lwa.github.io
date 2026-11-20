# BIG LWA outbound SMTP / Stalwart
Status: **staged configuration, NOT deployed**. This must run on a separate persistent Linux host. It does not run on GitHub Pages, Cloudflare Pages, or the Orbit Worker.

## Existing mail that must remain working
The live biglwa.com zone currently has Titan incoming MX records, priority 10 mx1.titan.email and priority 20 mx2.titan.email. Firebase verification mail is separately authorized by a current apex SPF include for _spf.firebasemail.com and existing firebase1/firebase2 DKIM CNAME records. Titan has a separate DKIM record, and a DMARC policy exists. Do not delete or overwrite them. The proposed mail.biglwa.com host is not yet published.

This deployment is **outbound-only**: Titan keeps receiving account email and replies. We are NOT migrating inboxes or MX records.

## Prerequisites — before deploying
1. Obtain a persistent VPS/Linux machine with a static public IPv4, clean sender reputation, Docker Engine/Compose, persistent disks and backups. Check with the provider that outbound TCP/25 is NOT blocked. Without it, direct mail delivery to other providers cannot be relied upon.
2. Ask the host provider to set PTR/reverse DNS for the actual IPv4 address to mail.biglwa.com; Cloudflare cannot set the PTR for somebody else's IP space.
3. After knowing the actual IPv4 address, create a DNS-only (gray cloud) A record at mail.biglwa.com. Do not proxy it through Cloudflare's HTTP proxy.
4. Configure the host firewall: SSH only for trusted administrators, inbound 465 for authenticated submission (Firebase), 443 only as required for TLS certificate issuance or protected administration. Do not publish incoming port 25, IMAP 993, POP3 995, ManageSieve 4190 or bootstrap 8080 to the public internet. Avoid unverified fixed-IP allowlisting for Firebase egress.
5. Before making mail available to Firebase, prove SMTP AUTH, TLS certificates, abuse limits and logging on the server.

## First-time Stalwart installation
- Copy docker-compose.yml to the host and execute: docker compose up -d
- Check startup status: docker compose ps
- Get the temporary bootstrap credentials/instructions: docker compose logs stalwart
- Open its local setup wizard through SSH tunnel, e.g. ssh -L 8080:127.0.0.1:8080 admin@YOUR_SERVER_IPV4 then use http://127.0.0.1:8080 from that local computer.
- Set server hostname to mail.biglwa.com and domain to biglwa.com; let Stalwart generate DKIM keys and issue a trusted TLS certificate. Save the permanent administrator credentials securely.
- **Choose MANUAL DNS management.** Do NOT give Stalwart Cloudflare-zone write access. The standard automatic DNS wizard can publish SPF/DMARC and automatic client discovery records that may conflict with the existing Titan/Firebase setup.
- Review requested certificate challenge names. In manual DNS mode Stalwart may require autoconfig, autodiscover, mta-sts and ua-auto-config records; those may already be used by Titan. Coordinate DNS and ACME method carefully and never overwrite existing provider records to obtain a certificate.
- Restart after wizard: docker compose restart stalwart. Configure submission to require authentication, strong TLS, sender-address authorization, appropriate limits and no open relay. The initial admin service must be protected; do not leave a public setup wizard or publicly open management UI.
- Important: if biglwa.com is configured as a local Stalwart domain, an outgoing message to another @biglwa.com recipient might be delivered to a Stalwart local mailbox instead of Titan. Set up and test appropriate split delivery/routing to Titan before using the service for regular messages.
- Ensure lwazi@biglwa.com exists as a real monitored Titan inbox or alias if it will be the sender/return path. Otherwise bounces and replies may be lost.

## DNS plan, not yet applied
- A: mail.biglwa.com → real static VPS IPv4; Cloudflare proxy OFF (DNS only).
- PTR: VPS IPv4 → mail.biglwa.com; managed by IP provider.
- SPF: modify the ONE existing SPF TXT record to add a mechanism for the static outgoing server IP, while preserving Firebase and any other existing legitimate senders. Never add a second SPF TXT.
- DKIM: add Stalwart's actual generated selector and public key as a separate TXT; preserve Firebase and Titan keys.
- DMARC: preserve existing policy until test emails show aligned SPF and DKIM.
- MX: PRESERVE BOTH Titan records. The new SMTP host is not a replacement for inbound email.
- Certificate: a valid publicly trusted mail.biglwa.com TLS certificate is required. Never tell Firebase to skip certificate verification or accept self-signed certs.

Run the read-only post-provision check:
MAIL_IPV4=YOUR_REAL_IPV4 MAIL_DKIM_SELECTOR=YOUR_GENERATED_SELECTOR node infra/mail/check-dns.mjs

The script changes nothing. Green DNS checks do not prove inbox acceptance: test authenticated submission, outbound 25, TLS and actual Gmail/Outlook arrival with SPF/DKIM/DMARC passing.

## Firebase Authentication connection — ONLY after tests
When ready, go to Firebase → Authentication → Templates → SMTP settings:
- Sender: lwazi@biglwa.com (real monitored sender).
- Host: mail.biglwa.com.
- Port: 465.
- SMTP user: full account as configured inside Stalwart.
- SMTP password: unique credential entered in Firebase only, not GitHub or chat.
- Security: SSL/TLS on 465.

Only enable/save after the server and real inbox delivery have passed tests. Test full verification and password reset with accounts you control; preserve a rollback path. The Mailroom Node backend is an optional separate path for richer HTML and names, and must not independently duplicate Firebase auth event mail.

Official references:
https://www.stalwart.email/docs/install/platform/docker/
https://www.stalwart.email/docs/install/requirements/
https://developers.cloudflare.com/dns/proxy-status/use-cases/
https://www.stalwart.email/docs/mta/outbound/routing/
