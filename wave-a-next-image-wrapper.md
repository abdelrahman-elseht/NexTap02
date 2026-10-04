# Cloudflare/OpenNext `/_next/image` wrapper findings

## Result

Implemented a stable worker wrapper in [`worker-wrapper.mjs`](F:/projects/NexTap02-phase2/worker-wrapper.mjs) and changed Wrangler `main` to use it. The generated OpenNext worker remains the request delegate; only responses for the exact `/_next/image` path (with or without a trailing slash) are cloned and decorated with a server-generated `x-request-id`.

The wrapper preserves the generated worker's body, status, status text, and all existing headers by constructing `new Response(response.body, response)` and then setting only `x-request-id`. It does not inspect, fetch, rewrite, or expose R2/private image storage. It does not alter request routing, middleware, image validation, cache policy, or the generated OpenNext handler.

Durable-object exports are re-exported from the wrapper so the existing OpenNext Wrangler bindings continue to resolve:

- `DOQueueHandler`
- `DOShardedTagCache`
- `BucketCachePurge`

## Generated worker and package evidence

The generated `.open-next/worker.js` has this shape:

1. It imports the OpenNext image handlers and middleware.
2. It checks skew protection.
3. It handles `/cdn-cgi/image/*` and the configured Next image path before middleware.
4. It delegates all other requests to `middlewareHandler`, then `server-functions/default/handler.mjs`.
5. It exports `DOQueueHandler`, `DOShardedTagCache`, `BucketCachePurge`, and a default `{ fetch(...) }` worker.

The installed `@opennextjs/cloudflare` package is version `1.20.8`. Its local template has the same worker shape, and its build implementation copies that template into `.open-next/worker.js` on every build. Therefore editing the generated worker would be overwritten; a root wrapper selected through Wrangler `main` is the stable integration point.

The installed package's Wrangler template also uses `.open-next/worker.js` as `main`, with the same assets, service, R2 cache, and Images binding model. The project wrapper changes only the entrypoint; existing bindings remain in `wrangler.jsonc`.

## Validation

- `node --check worker-wrapper.mjs`: passed.
- Wrangler integration: `npx wrangler deploy --dry-run --config wrangler.jsonc`: passed; Wrangler read the assets and bundled the wrapper, then exited without deployment.
- Dry-run reported the existing bindings: `NEXT_INC_CACHE_R2_BUCKET`, `R2_BUCKET`, `WORKER_SELF_REFERENCE`, `IMAGES`, and `ASSETS`.
- Deterministic response helper behavior was reviewed and syntax-checked: body, `content-type`, `cache-control`, status, and existing headers are preserved while `x-request-id` is set.
- Direct Node importing of `.open-next/worker.js` is not a valid runtime check: the generated bundle contains Cloudflare/workerd-oriented imports and Node reports an `f:` URL scheme error on Windows. Wrangler's successful dry-run is the authoritative local integration check for this worker entrypoint.
- No deployment was performed.

## Scope and residual risk

The wrapper intentionally decorates only `/_next/image` responses. Other routes are returned unchanged from the generated worker. The wrapper does not guarantee that a response is an image; it preserves OpenNext's existing image handler behavior and adds the required request ID at the outer worker boundary.

The generated worker is build output and remains unmodified. Future OpenNext builds will continue to regenerate `.open-next/worker.js`; the root wrapper and Wrangler `main` setting remain intact.
