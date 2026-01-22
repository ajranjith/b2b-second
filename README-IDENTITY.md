# Identity & Traceability Guidelines

This project enforces the Identity Passport contract end-to-end. Follow these steps every time you add new surface, DB access, or integrations.

## Registry Format

**IMPORTANT: Registries are TypeScript exports only. JSON registries are forbidden.**

All registries (FEATURES, OPERATIONS, QUERIES, SERVICES, RULES, QUEUES, NOTIFICATIONS, CACHES) are defined as TypeScript `as const` arrays in `packages/identity/src/index.ts`.

```typescript
// Example: Adding a new feature
export const FEATURES: readonly FeatureRegistryEntry[] = [
  // ... existing entries
  {
    namespace: "A",
    pathTemplate: "/api/bff/v1/admin/reports",
    featureId: "REF-A-09",
    description: "Admin reports",
  },
] as const;
```

**Why TypeScript-only?**
- Type safety: IDs are checked at compile time
- No runtime JSON parsing or file I/O
- Direct imports enable tree-shaking
- CI scripts can import registries directly

A CI guardrail (`scripts/check-no-json-registries.ts`) fails if any `*registry*.json` files appear in the repo.

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

Run the following locally to verify enforcement (CI runs the same commands).

> **IMPORTANT: Stage 1 cannot be skipped.** It always runs regardless of environment variables.
> The deprecated `SKIP_STAGE_ONE` flag is ignored and will print a warning.

### Environment Variables

| Variable | Effect |
|----------|--------|
| `SKIP_DB_CHECKS=1` | Skip Stage 2 (database checks only) |
| `FORCE_DB_CHECKS=1` | Force Stage 2; fail loudly if DB unreachable |
| `SKIP_STAGE_ONE=1` | **DEPRECATED** - Ignored. Stage 1 always runs. |

### Run Stage 1 only (no database required)

```bash
SKIP_DB_CHECKS=1 pnpm identity:verify
SKIP_DB_CHECKS=1 pnpm worker:identity-proof
```

### Run both stages (requires database)

```bash
# Ensure DATABASE_URL is set
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hotbray?schema=public"

# Run API identity verification (Stage 1 + Stage 2)
FORCE_DB_CHECKS=1 pnpm identity:verify

# Run Worker identity verification (Stage 1 + Stage 2)
FORCE_DB_CHECKS=1 pnpm worker:identity-proof
```

### Registry and route validation

```bash
pnpm check:registries
# or
pnpm tsx scripts/check-registry-and-routes.ts
```

### Check for forbidden JSON registries

```bash
pnpm check:no-json-registries
# or
pnpm tsx scripts/check-no-json-registries.ts
```

### Full verification (all checks)

```bash
pnpm verify:identity
```

## 6. What each stage validates

**Stage 1 (Mandatory - always runs):**
- Registry integrity (no duplicates, correct ID formats)
- Route handler coverage (all routes use withEnvelope)
- TypeScript type checking
- Identity unit tests
- Disallowed imports (no axios, node-fetch, direct @prisma/client)
- DB wrapper usage patterns (all Prisma calls via db(dbId))
- Prisma envelope guard (blocks direct access without Identity Envelope)

**Stage 2 (Requires database):**
- DB-ID enforcement (throws BLOCKER if db() wrapper not used)
- Namespace isolation (throws ENVELOPE_MISMATCH on cross-namespace access)
- Concurrency safety (50 parallel queries with correct tracing)
