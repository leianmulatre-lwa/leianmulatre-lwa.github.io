# Third-party source kept separately from BIG LWA

Imported upstream code lives here with its original metadata, tests, and licensing. This keeps the website's root README, license, dependency metadata, and test discovery tied to BIG LWA rather than another project.

- `tweepy/` — preserved Tweepy Python 4.17.0 files, MIT license and original tests. Its 140 recorded X API HTTP fixtures are in `tweepy/cassettes/`, preserving exact Git blob contents without publishing them as BIG LWA root files. These are upstream test recordings, not a means of bypassing X permissions. It is **not** automatically executed by the existing JavaScript Cloudflare Worker. Provider API usage remains subject to X's authorization, pricing, and rate limits.

Do not edit vendor copies as if they were first-party application code; track upstream changes and verify the license first.
