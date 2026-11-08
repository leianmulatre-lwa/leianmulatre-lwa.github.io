# Build L’wazi's SMTP server locally on Windows first

This is a LOCAL SANDBOX. It does not deliver live Firebase Authentication mail, does not publish DNS records, and does not affect existing Titan inboxes.

## Prerequisites
1. Windows 10/11 supported by Docker Desktop, with hardware virtualization/WSL 2 enabled.
2. Install Docker Desktop from https://docs.docker.com/desktop/setup/install/windows-install/ ; choose the WSL 2 Linux-container backend. Start Docker Desktop and make sure it says its engine is running.
3. Have Git installed, or download this branch's ZIP from GitHub.

## PowerShell quick start
Open PowerShell on your desktop. If you do not have a copy of the repository:

    git clone --branch feature/mailroom-stalwart-outbound-20261108 https://github.com/leianmulatre-lwa/leianmulatre-lwa.github.io.git
    cd leianmulatre-lwa.github.io

Start the loopback-only Stalwart sandbox:

    docker compose -f infra/mail/docker-compose.local.yml up -d

Check it:

    docker compose -f infra/mail/docker-compose.local.yml ps
    docker compose -f infra/mail/docker-compose.local.yml logs --tail 60 stalwart-local

Open http://127.0.0.1:8080 in the same PC browser to reach the **first-run** setup wizard. It may create administrator credentials; store them securely in a password manager and never post them in ChatGPT, screenshots, or GitHub. Use a TEST domain/configuration for early exploration, not real production biglwa.com outbound DNS or Firebase SMTP secrets.

If the wizard has been completed, it may no longer be available on 8080. Local diagnostics and a configured management service may become available on port 8443; a trusted TLS certificate for localhost is not expected.

All published ports are bound to 127.0.0.1 (this PC only). Loopback port 1465 maps to container submission port 465 for controlled local tests, but the hostname/certificate will not automatically be valid for Firebase. Do NOT point Firebase at localhost or a home router public address.

## Windows shell readiness checks

    docker --version
    docker compose version
    wsl --status

If Docker is not installed, install Docker Desktop first. If a command fails, copy its **nonsecret** error message rather than any passwords, keys or credentials.

## Stop without losing configured state

    docker compose -f infra/mail/docker-compose.local.yml down

Volumes persist across down/up. Do not add -v unless you deliberately want to delete local mailserver configuration.

## Local vs production

Running a container on your desktop proves the application can start, but production sender reputation requires a static publicly reachable IP, reverse DNS/PTR matching the forward record, unblocked outbound port 25, TLS and SPF/DKIM/DMARC. Home ISPs often block port 25 and refuse reverse DNS changes. A 24/7 service is also more reliable on a dedicated host.

Production uses a **different** compose file: infra/mail/docker-compose.yml and a separate VPS. That file intentionally isn't started in this walkthrough. Do not expose any public ports, change Cloudflare DNS, or enable Firebase SMTP until production infrastructure is ready, receiving-service routing has been reviewed, and full test messages pass.

Official references:
- https://docs.docker.com/desktop/setup/install/windows-install/
- https://stalw.art/docs/install/platform/docker/
