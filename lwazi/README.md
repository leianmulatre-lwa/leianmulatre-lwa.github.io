# L’wazi private engine pilot (November 2026)

This is a **separate, non-production** model router. On November 6, 2026, the isolated Cloudflare Worker `biglwa-lwazi-pilot` was uploaded and its `workers.dev` route was enabled. No model credentials or tester allowlist are configured, so inference stays disabled. An external HTTP health request has not been independently verified. No private writing or member data are committed. The main branch and existing Orbit Worker remain unchanged.

## Implemented

- Independent L’wazi voice/reasoning contract in policy.mjs, with source-integrity and no covert advertising.
- Signed Firebase ID token verification server-side (biglwa project), restricted to an explicit owner-controlled UID allowlist. Default: no one can invoke paid inference.
- Intent routing: quick requests to DeepSeek Flash (non-thinking for latency), research to Claude Sonnet, code-writing questions to Claude Opus; the other provider is a fallback for upstream failures.
- Normalized incremental SSE output (delta, done, error); bounded request sizes, HTTPS public-source metadata only, per-provider timeouts, secrets only on the Worker.
- Optional browser hook in ../lwazi-client.js. It is dormant until window.__biglwaLwaziEndpoint is configured before the script runs. Existing search and its browser fallback remain available.
- Search UI uses streamed partials and avoids reusing a previous question's answer across users and source contexts.

**Not implemented:** provider key setup, production deployment, public rate limiting/quotas, persistent memory, rich tool execution, user-facing consent/settings UI, trained voice weights, Cloudflare AI Gateway, or full source-text retrieval. Do not open this to the public without abuse limits and privacy review.

## Founder setup (keep keys out of GitHub and ChatGPT)

1. In the DeepSeek developer console, create an API key with a low usage cap; optionally do the same for Anthropic. The pilot needs **at least one**. Both let the router specialize and fall back.
2. In Firebase Console > Authentication > Users, locate **your own account UID**. Do not paste it publicly. Set a Cloudflare secret LWAZI_ALLOWED_UIDS to that exact UID (comma-separated to allow additional explicitly trusted testers).
3. The separate `biglwa-lwazi-pilot` Worker has already been uploaded with the Cloudflare API. Its configured address is https://biglwa-lwazi-pilot.leianmulatre-284.workers.dev . Do **not** deploy over `biglwa-instagram-api`. Later deployments may use npx wrangler deploy --config wrangler-lwazi.toml with the repo sources.
4. Set Worker secrets via Wrangler or Cloudflare dashboard:
   - npx wrangler secret put DEEPSEEK_API_KEY --config wrangler-lwazi.toml
   - npx wrangler secret put ANTHROPIC_API_KEY --config wrangler-lwazi.toml
   - npx wrangler secret put LWAZI_ALLOWED_UIDS --config wrangler-lwazi.toml
   Missing provider keys are fine if using only one provider.
5. Pilot health URL: https://biglwa-lwazi-pilot.leianmulatre-284.workers.dev/health should respond with service "lwazi" and ready true after adding at least one model key. A browser POST without a valid Firebase ID token should return 401 when access is configured. This health check does not invoke a billable model.
6. In a **staging branch only**, place an inline assignment **before** the L’wazi client script:
   window.__biglwaLwaziEndpoint = "https://biglwa-lwazi-pilot.leianmulatre-284.workers.dev/api/lwazi";
   Keep the endpoint public URL (not a secret) separate from provider keys. Test while signed into BIG LWA.
7. Verify search tabs, voice and Booth buttons, direct navigation commands, non-AI fallback, source links, answer streaming, response citations, and sign-out access denial before merging anything.

**Pilot consent:** The optional browser bridge asks for explicit session-only consent before any external API request. A full user-facing settings control remains to be built.

**Privacy:** Both models receive the user's question and at most six public source metadata entries. They do not receive journals, direct messages, imported media, social connection tokens or the founder's private essays. They may retain data according to their own API terms. Before non-founder access, add an explicit opt-in and a prominent provider disclosure.

**Security:** The Firebase ID token is verified using Google's public keys, project audience/issuer, signature and expiration; an origin check is not a replacement for authentication. This pilot allowlist is intentional; it is not a quota or production abuse control. Do not enable general access without WAF/rate limits and spend limits.

## Tests

- node --test lwazi/worker.test.mjs
- node --check lwazi/worker.mjs
- node --check lwazi-client.js

Review the identity policy and add *consented, private* voice examples later. Never embed private conversations in the public repository.

## Relevant docs

- DeepSeek Chat Completions: https://api-docs.deepseek.com/api/create-chat-completion/
- Anthropic Messages API: https://platform.claude.com/docs/en/api/messages/create
- Cloudflare Workers: https://developers.cloudflare.com/workers/
- Firebase verify ID tokens: https://firebase.google.com/docs/auth/admin/verify-id-tokens

## Free-first path (no DeepSeek or Anthropic credits)

The isolated Worker now contains a **Cloudflare Workers AI** adapter for `@cf/google/gemma-4-26b-a4b-it`. By default, paid provider calls are **denied** even if their API keys exist. The free AI adapter is **disabled** until the Cloudflare account plan is confirmed. **Do not switch it on blindly**: Cloudflare Workers Free stops at its daily 10,000 Neuron allocation, whereas Workers Paid can charge for overages. Cloudflare's connected OAuth integration does not have billing-read permission, so the model cannot verify the account plan.

After confirming Workers Free, add the `AI` binding to `biglwa-lwazi-pilot` and explicitly set `FREE_INFERENCE_ENABLED=true` in the isolated Worker's variables. Keep `ALLOW_PAID_PROVIDERS=false`. The worker uses Cloudflare Gemma by default, including research and code questions, and will refuse direct DeepSeek or Anthropic requests while paid providers are disabled. When your free allowance runs out, it must fail rather than silently falling through to a billable provider. Watch usage in Cloudflare's Workers AI dashboard.

The model is Cloudflare-hosted: this avoids buying an **external provider's** API credits, but it still processes prompts on Cloudflare infrastructure. Local WebGPU/Ollama inference is a possible next option for avoiding per-request cloud charges. There is no legitimate general-purpose way to unlock proprietary paid APIs at no cost.

For current official limits: https://developers.cloudflare.com/workers-ai/platform/pricing/ and the Gemma model page: https://developers.cloudflare.com/workers-ai/models/gemma-4-26b-a4b-it/.

### Activation — 2026-11-06

Founder confirmed **Workers Free**. The isolated L'wazi pilot enables `FREE_INFERENCE_ENABLED=true`, while `ALLOW_PAID_PROVIDERS=false`. Paid provider calls return `paid_providers_disabled`, even with DeepSeek/Anthropic API keys present. Free inference is subject to Cloudflare's daily Workers AI allowance. Paid model providers remain disabled. Production `biglwa.com` is not affected. If this account changes to Workers Paid, reassess usage and billing before continuing.
