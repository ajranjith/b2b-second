# Identity & Traceability Guidelines

This project enforces the Identity Passport contract end-to-end. Follow these steps every time you add new surface, DB access, or integrations.

## 1. Adding a new route

1. Register the feature/method combination in `packages/identity/src/index.ts`:
   * Add a `FEATURES` entry for the screen/path (`REF-A-xx` or `REF-D-xx`).
   * Add an `OPERATIONS` entry with the HTTP method, path template, namespace, and `API-*` ID.
2. Implement the route under `apps/api/app/api/bff/v1/...`.
3. Wrap the handler with `withEnvelope({ namespace: "A" | "D" }, handler)`.
4. Ensure no direct `fetch`, `axios`, or Prisma calls escape the wrapper—use `bffClient` and DTO validation.
5. Run `pnpm tsx scripts/check-registry-and-routes.ts` or `pnpm verify:identity` to confirm the new route is wired to the registry.

## 2. Adding a new DB query

1. Add the query to the `QUERIES` registry in `packages/identity/src/index.ts` (`DB-A-xx` or `DB-D-xx`).
2. Use the scoped runner: `await db("DB-A-xx-yy").model.operation(...)`.
3. Never import `@prisma/client` outside `apps/api/src/lib/prisma.ts` or `apps/worker/src/lib/withJobEnvelope.ts`.
4. The `db()` wrapper enforces namespace and log tags, so every operation automatically emits `[DB_TRACE]`.

## 3. Forbidden patterns

- **No direct HTTP clients**: ban `axios`, `node-fetch`, and global `fetch` inside BFF routes and services—use the shared `bffClient`.
- **No direct Prisma imports**: only `lib/prisma.ts` (API) and `lib/withJobEnvelope.ts` (workers) may import `@prisma/client`.
- **No DB access from UI**: all UI apps must call `/api/bff/v1/*` endpoints and rely on the DTO contracts in `@repo/lib`.
- **No bypass of withEnvelope**: every route must export HTTP handlers via the `withEnvelope` wrapper; the CI scan catches any wrapperless route.

## 4. Troubleshooting

- **ENVELOPE_MISMATCH**: check that you registered both the feature and operation with the correct namespace, and that the route path matches the template. Misaligned namespaces (e.g. a Dealer route under `/admin`) trigger this error.
- **BLOCKER: No DB-ID**: wrap your Prisma usage with `db("DB-A-xx-yy", fn)` or grab a proxied client through `db()` before invoking any `.find...` methods. The registry must contain the referenced `DB-*` ID.
- **CRITICAL: No Identity Envelope**: you invoked Prisma outside a `withEnvelope` context. Wrap the handler or job with `withEnvelope`/`withJobEnvelope` before accessing the database.

## 5. Command checklist

Run the following locally to verify enforcement (CI runs the same commands):

- `pnpm identity:verify` (attack + concurrency tests)
- `pnpm worker:identity-proof` (worker envelope proof)
- `pnpm tsx scripts/check-registry-and-routes.ts`
