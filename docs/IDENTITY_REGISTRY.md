# Identity Registry Guide

This guide explains how to add routes, services, and queries to the B2B Portal while maintaining full traceability and namespace isolation.

> **IMPORTANT:** Registries are TypeScript exports only. JSON registries are forbidden.
> All registry definitions live in `packages/identity/src/index.ts` as `as const` arrays.
> A CI guardrail (`scripts/check-no-json-registries.ts`) enforces this policy.

## Overview

Every operation in the system is tracked through a chain of IDs:

```
Request → TID (Trace) → SID (Session) → REF (Feature) → API (Operation) → SVC (Service) → DB (Query)
```

All IDs include a namespace prefix (`A` for Admin, `D` for Dealer) to enforce isolation.

## ID Formats

| ID Type | Format | Example | Description |
|---------|--------|---------|-------------|
| TID | `TID-{NS}-{ULID}` | `TID-A-01ARZ3NDEKTSV4RRFFQ69G5FAV` | Trace ID (auto-generated) |
| SID | `SID-{NS}-{ULID}` | `SID-D-01ARZ3NDEKTSV4RRFFQ69G5FAV` | Session ID (auto-minted) |
| REF | `REF-{NS}-##` | `REF-A-01` | Feature reference |
| API | `API-{NS}-##-##` | `API-A-01-01` | API operation |
| SVC | `SVC-{NS}-##-##` | `SVC-A-01-01` | Service identifier |
| DB | `DB-{NS}-##-##` | `DB-A-01-01` | Database query |

## Adding a New Route

### Step 1: Register the Feature

Add an entry to `FEATURES` in `packages/identity/src/index.ts`:

```typescript
export const FEATURES: readonly FeatureRegistryEntry[] = [
  // ... existing entries
  {
    namespace: "A", // or "D" for dealer
    pathTemplate: "/api/bff/v1/admin/reports",
    featureId: "REF-A-09",
    description: "Admin reports",
  },
] as const;
```

### Step 2: Register the Operation(s)

Add entries to `OPERATIONS` for each HTTP method:

```typescript
export const OPERATIONS: readonly OperationRegistryEntry[] = [
  // ... existing entries
  {
    namespace: "A",
    method: "GET",
    pathTemplate: "/api/bff/v1/admin/reports",
    operationId: "API-A-09-01",
    featureId: "REF-A-09",
    description: "List admin reports",
  },
  {
    namespace: "A",
    method: "POST",
    pathTemplate: "/api/bff/v1/admin/reports",
    operationId: "API-A-09-02",
    featureId: "REF-A-09",
    description: "Generate admin report",
  },
] as const;
```

### Step 3: Create the Route Handler

Create the route file at `apps/api/app/api/bff/v1/admin/reports/route.ts`:

```typescript
import type { NextRequest } from "next/server";
import { requireRole } from "@/auth/requireRole";
import { fail, ok } from "@/lib/response";
import { withEnvelope } from "@/lib/withEnvelope";

async function handleGET(request: NextRequest) {
  const auth = requireRole(request, "ADMIN");
  if (!auth.ok) {
    return fail({ message: auth.message }, auth.status);
  }

  // Your logic here
  return ok({ reports: [] });
}

async function handlePOST(request: NextRequest) {
  const auth = requireRole(request, "ADMIN");
  if (!auth.ok) {
    return fail({ message: auth.message }, auth.status);
  }

  const body = await request.json();
  // Your logic here
  return ok({ reportId: "..." });
}

export const GET = withEnvelope({ namespace: "A" }, handleGET);
export const POST = withEnvelope({ namespace: "A" }, handlePOST);
```

**Important:** Always wrap handlers with `withEnvelope`. The wrapper:
- Mints TID if missing (or validates existing TID namespace)
- Mints SID if missing (sets HttpOnly cookie)
- Resolves REF and API from registries
- Enforces namespace bouncer checks
- Stores envelope in AsyncLocalStorage

## Adding a New Service

### Step 1: Register the Service

Add to `SERVICES` in `packages/identity/src/index.ts`:

```typescript
export const SERVICES: readonly ServiceRegistryEntry[] = [
  // ... existing entries
  {
    namespace: "A",
    serviceId: "SVC-A-09-01",
    featureId: "REF-A-09",
    description: "Report generation service",
  },
] as const;
```

### Step 2: Create the Service

```typescript
// apps/api/src/services/reportService.ts
import { getContext } from "@/lib/runtimeContext";
import { db } from "@/lib/prisma";

export async function generateReport(params: ReportParams) {
  const ctx = getContext();
  // ctx contains: namespace, traceId, sessionId, featureId, operationId

  // Use db() wrapper with registered DB ID
  const data = await db("DB-A-09-01").report.findMany({
    where: { ... }
  });

  return data;
}
```

## Adding a New Query

### Step 1: Register the Query

Add to `QUERIES` in `packages/identity/src/index.ts`:

```typescript
export const QUERIES: readonly QueryRegistryEntry[] = [
  // ... existing entries
  {
    namespace: "A",
    queryId: "DB-A-09-01",
    operationId: "API-A-09-01",
    description: "Fetch report data",
    owningModule: "reports",
    expectedLatencyMs: 500,
  },
] as const;
```

### Step 2: Use the Query

```typescript
import { db } from "@/lib/prisma";

// The db() function requires a registered DB ID
const reports = await db("DB-A-09-01").report.findMany({
  where: { status: "active" }
});
```

**Important:** Every Prisma call MUST go through `db(dbId)`. The middleware:
- Validates the DB ID exists in QUERIES registry
- Logs the query with full trace context (ns, sid, ref, api, svc, dbId)
- Throws `DBIdMissing` if called without wrapper

## Making Internal API Calls

Use the namespace-specific BFF clients:

```typescript
import { adminFetch, dealerFetch, bffFetch } from "@/lib/bffClient";

// In Admin context - use adminFetch
const data = await adminFetch.get("/api/internal/stats");

// In Dealer context - use dealerFetch
const orders = await dealerFetch.get("/api/internal/orders");

// Dynamic namespace selection
const client = bffFetch(context.namespace);
const result = await client.post("/api/internal/action", { data });
```

**Important:** These clients:
- Auto-forward X-Trace-Id, X-Session-Id, and other trace headers
- Throw `BffClientNamespaceMismatch` if context namespace doesn't match
- Throw `BffClientContextMissing` if no runtime context

## Worker Jobs

Jobs must carry trace context:

```typescript
import { buildJobPayload, assertJobPayloadValid } from "@repo/identity";
import { runWithJobContext } from "@/lib/workerContext";

// Creating a job
const payload = buildJobPayload(envelope);
await queue.add("process-report", { ...data, ...payload });

// Processing a job
async function processJob(job: Job) {
  assertJobPayloadValid(job.data);

  await runWithJobContext(job.data, async () => {
    // Context is restored - db() calls will have trace info
    await db("DB-A-09-02").report.update({ ... });
  });
}
```

## Namespace Isolation (Bouncer Checks)

The system enforces strict namespace isolation:

1. **TID namespace must match route namespace**
   - Admin TID (`TID-A-*`) can only access Admin routes
   - Dealer TID (`TID-D-*`) can only access Dealer routes

2. **BFF clients enforce context namespace**
   - `adminFetch` throws if called from Dealer context
   - `dealerFetch` throws if called from Admin context

3. **DB IDs must match namespace**
   - `DB-A-*` IDs for Admin operations
   - `DB-D-*` IDs for Dealer operations

## CI Enforcement

The CI pipeline validates:

1. **Registry Validation** (`scripts/check-registry-and-routes.ts`)
   - All route handlers use `withEnvelope`
   - No duplicate IDs in registries
   - ID formats are correct
   - Namespace prefixes match

2. **TID Enforcement** (`scripts/check-tid-enforcement.ts`)
   - Internal fetch calls forward trace headers
   - Job payloads include TID
   - Workers restore context before DB access

3. **ESLint Rules**
   - No direct `@prisma/client` imports (use `@/lib/prisma`)
   - No `axios` or `node-fetch` (use `bffClient`)
   - No global `fetch` in route handlers/services

4. **Unit Tests**
   - Bouncer logic (namespace mismatch → error)
   - ID resolution functions
   - Registry integrity (no duplicates, correct format)

## Quick Reference

### Adding a New Admin Feature

1. Add `REF-A-##` to `FEATURES`
2. Add `API-A-##-##` to `OPERATIONS` for each method
3. Add `SVC-A-##-##` to `SERVICES` if creating service
4. Add `DB-A-##-##` to `QUERIES` for each query
5. Create route with `withEnvelope({ namespace: "A" }, handler)`
6. Use `db("DB-A-##-##")` for Prisma calls

### Adding a New Dealer Feature

1. Add `REF-D-##` to `FEATURES`
2. Add `API-D-##-##` to `OPERATIONS` for each method
3. Add `SVC-D-##-##` to `SERVICES` if creating service
4. Add `DB-D-##-##` to `QUERIES` for each query
5. Create route with `withEnvelope({ namespace: "D" }, handler)`
6. Use `db("DB-D-##-##")` for Prisma calls

## Logging Output

All logs include trace context:

```json
{
  "ns": "A",
  "sid": "SID-A-01ARZ3NDEKTSV4RRFFQ69G5FAV",
  "ref": "REF-A-01",
  "api": "API-A-01-01",
  "svc": "SVC-A-01-01",
  "dbId": "DB-A-01-01",
  "model": "report",
  "action": "findMany",
  "durationMs": 45
}
```

This enables:
- End-to-end request tracing
- Performance monitoring per query
- Audit trails by feature/operation
- Debugging with full context
