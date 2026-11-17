# BIG LWA · Media upload and delivery upgrade contract
**Status: proposal for branch integration, not a live media migration**

## Existing implementation, confirmed from source

- `wrangler.toml` already binds a `WALLPAPER_BUCKET` R2 bucket to `cloudflare-worker-instagram.js`, so do not purchase a second storage system or change a production binding simply to optimize imports.
- The Worker already authorizes write/delete operations with Firebase identity and separates media into account-scoped paths such as `wallpapers/<uid>/...` and `profile-photos/<uid>/...`.
- Current maximums in source are 30 MiB for general images, 120 MiB for videos and 8 MiB for a profile photograph. The upload handler reads the complete `arrayBuffer()` before writing; it creates a random object key, with no image format conversion or byte-content deduplication in that path.
- `mediaServe` currently returns the stored original bytes and sets an ETag and cache headers. It does **not** create scaled variants. The code comment describing wallpaper/profile photo reads as signed-in does not by itself prove authenticated GET enforcement; review visibility and authorization before changing this route.
- Pinterest has an ID-based SHA-256 used for stable post IDs; that is not the same as deduplicating identical image bytes.

## The image-quality trick, precisely

A 60 KB thumbnail can *look* as crisp as a multi-megabyte photo when both are displayed in a small card. It cannot contain the same recoverable detail at 100% zoom as the original.

Keep the authentic master in storage, but don't send it for every 160-pixel card:

| User surface | Suggested encoding | Width / delivery | Access |
| --- | --- | --- | --- |
| Skeleton/Boards/Archive preview | blur placeholder + AVIF/WebP thumbnail | tiny 24-48px placeholder, then 160-480px rendition | Only user-visible images |
| Standard wall and profile | AVIF/WebP or JPEG fallback | match CSS width × device pixel ratio, usually 640-1440px | When visible |
| Lightbox, file editor and print | high-quality rendition or authentic original | original dimensions by explicit user action | Owner / authorized viewer |
| Animated image/video | poster for grid; deferred video stream | poster 320-640px, video only after play | Correct rights and consent |

Use `<picture>`/`srcset`/`sizes`, `loading=lazy`, `decoding=async`, and intrinsic `width`/`height` or `aspect-ratio` to prevent layout shifts. Do **not** rely on CSS `object-fit` to reduce transferred bytes.

## Upload contract (backward-compatible target)

1. Verify Firebase ownership, MIME by content signature, total bytes, file permissions and target usage. Do not accept raw source URL fetches without SSRF and provider-authorization protections.
2. Compute an SHA-256 for **actual bytes**. Optionally check account-owned objects for duplicates, under the same owner scope only. Do not publicly reveal whether another user's object matches.
3. Reject unsupported or needlessly large media before expensive processing; for actual photos, inspect decoded dimensions and upload selected derivatives.
4. Store one original master plus small renditions; do not hold multiple raw base64 copies in Firestore, localStorage, search indices, page HTML and R2 simultaneously.
5. Store compact metadata with `uid`, object key, hash, MIME, width, height, permissions, original provider/source, created time, variants and expiration/deletion links. Strip optional EXIF location only as appropriate to rights and privacy; avoid altering protected source records silently.
6. Return only authorized signed or access-controlled media endpoints as appropriate. Use short-lived signatures or authenticated Worker GETs for private records; public published images may use cacheable public URLs.
7. Cache immutable versioned derivative responses and preserve safe invalidation/deletion. Never cache OAuth session, private search, unpublished media, user-specific tokens, or error responses publicly.
8. After upload, background-derive larger renditions if necessary. Keep an explicit processing state and a safe original display fallback; don't block Studio first paint.
9. For import sources: import only what the account owner selected, store official IDs and references where copying isn't necessary, refresh public feeds with provider-approved APIs, and honor user deletion/revocation.

## Performance and cost gates

Before wiring this into current Worker handlers, measure original-vs-variant bytes, compute time on entry-level mobile, peak memory, first paint, R2 storage volume, R2 request counts, and how many times content is decoded or converted. Test transparency, GIF animation, portraits and deep skin tones for artifacts, text-filled screenshots, accessibility, cropping, 3:4 / 9:16 proportions, EXIF rotation, alpha, and full-screen viewers. Visual similarity needs to be judged on **actual display sizes**, not just a file-size target.

**Do not touch the existing R2 bucket, OAuth secrets, live account media, or canonical project build in this branch until the upload contract and authorization model are confirmed.**
