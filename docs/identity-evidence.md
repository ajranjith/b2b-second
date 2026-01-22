# Identity Enforcement Evidence

## Environment Variables

| Variable | Effect |
|----------|--------|
| `SKIP_DB_CHECKS=1` | Skip Stage 2 (database checks only) |
| `FORCE_DB_CHECKS=1` | Force Stage 2; fail loudly if DB unreachable |
| `SKIP_STAGE_ONE=1` | **DEPRECATED** - Ignored. Stage 1 always runs. |

> **Stage 1 cannot be skipped.** It is mandatory and always runs.

## Correct Commands

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

### Full verification (all checks)

```bash
pnpm verify:identity
```

## What each stage validates

**Stage 1 (Mandatory - always runs):**
- Registry & route scan vs OPERATIONS
- TypeScript type checking
- Identity unit tests
- Prisma envelope guard (blocks direct access without Identity Envelope)

**Stage 2 (Requires database):**
- DB-ID enforcement (throws BLOCKER if db() wrapper not used)
- Namespace isolation (throws ENVELOPE_MISMATCH on cross-namespace access)
- Concurrency safety (50 parallel queries with correct tracing)

## Command outputs (database state aware)

### identity:verify with SKIP_DB_CHECKS=1

```
======================================================================
Identity Enforcement Verification
======================================================================

======================================================================
STAGE 1: Static Analysis & Unit Tests (Mandatory)
======================================================================

[STAGE 1] Running Registry & route scan: pnpm tsx scripts/check-registry-and-routes.ts
... (typecheck + tests)
[STAGE 1] Validating Prisma envelope guard without DB...
PASS: Direct Prisma call with no envelope failed as expected (Identity Envelope).

[STAGE 1] All checks passed.

======================================================================
STAGE 2: DB-Backed Identity Proof
======================================================================

SKIPPED_DB_CHECKS: SKIP_DB_CHECKS=1
To run Stage 2, ensure DATABASE_URL is set and the database is running.
To force Stage 2 (and fail if DB unreachable): FORCE_DB_CHECKS=1

======================================================================
OK: Identity enforcement scripts completed successfully.
======================================================================
```

### identity:verify with FORCE_DB_CHECKS=1 (database up)

```
======================================================================
Identity Enforcement Verification
======================================================================

======================================================================
STAGE 1: Static Analysis & Unit Tests (Mandatory)
======================================================================

[STAGE 1] Running Registry & route scan: pnpm tsx scripts/check-registry-and-routes.ts
... (typecheck + tests)
[STAGE 1] All checks passed.

======================================================================
STAGE 2: DB-Backed Identity Proof
======================================================================

[STAGE 2] FORCE_DB_CHECKS=1 (DB reachable)

[STAGE 2] Running DB-backed identity proof...
PASS: Enforced DB-ID requirement failed as expected (No DB-ID).
PASS: Namespace mismatch when using Dealer DB on Admin envelope failed as expected (ENVELOPE_MISMATCH).
[DB_TRACE] {"ns":"A","sid":"SID-A-...","ref":"REF-A-01","api":"API-A-01-01",...}
[STAGE 2] Concurrency proof ran in 184ms; DB IDs: DB-A-01-01, DB-A-02-01, DB-A-06-01

[STAGE 2] All checks passed.

======================================================================
OK: Identity enforcement scripts completed successfully.
======================================================================
```

### identity:verify with FORCE_DB_CHECKS=1 (database down)

```
======================================================================
Identity Enforcement Verification
======================================================================

======================================================================
STAGE 1: Static Analysis & Unit Tests (Mandatory)
======================================================================

[STAGE 1] Running Registry & route scan: pnpm tsx scripts/check-registry-and-routes.ts
... (typecheck + tests)
[STAGE 1] All checks passed.

======================================================================
STAGE 2: DB-Backed Identity Proof
======================================================================

FAIL: Identity enforcement check failed. Error: DB_REQUIRED_BUT_UNREACHABLE: FORCE_DB_CHECKS=1 was set but database is not reachable.
Reason: DATABASE_URL (or primary/replica) is not configured.
Ensure DATABASE_URL is set and the database is running.
```

### Using deprecated SKIP_STAGE_ONE=1

```
======================================================================
WARNING: SKIP_STAGE_ONE is deprecated and will be IGNORED.
Stage 1 is mandatory and will still run.
Use SKIP_DB_CHECKS=1 to skip only the database checks (Stage 2).
======================================================================

======================================================================
STAGE 1: Static Analysis & Unit Tests (Mandatory)
======================================================================

[STAGE 1] Running Registry & route scan: pnpm tsx scripts/check-registry-and-routes.ts
... (Stage 1 continues as normal)
```

### worker:identity-proof with SKIP_DB_CHECKS=1

```
======================================================================
Worker Identity Proof Verification
======================================================================

======================================================================
STAGE 1: Worker Identity Unit Checks (Mandatory)
======================================================================

[STAGE 1] Valid job payload accepted.
[STAGE 1] Invalid job payload rejected as expected.
[STAGE 1] Job context is populated within withJobEnvelope.

[STAGE 1] All checks passed.

======================================================================
STAGE 2: Worker DB-Backed Identity Proof
======================================================================

SKIPPED_DB_CHECKS: SKIP_DB_CHECKS=1
To run Stage 2, ensure DATABASE_URL is set and the database is running.
To force Stage 2 (and fail if DB unreachable): FORCE_DB_CHECKS=1

======================================================================
OK: Worker identity proofs completed successfully.
======================================================================
```

### worker:identity-proof with FORCE_DB_CHECKS=1 (database up)

```
======================================================================
Worker Identity Proof Verification
======================================================================

======================================================================
STAGE 1: Worker Identity Unit Checks (Mandatory)
======================================================================

[STAGE 1] Valid job payload accepted.
[STAGE 1] Invalid job payload rejected as expected.
[STAGE 1] Job context is populated within withJobEnvelope.

[STAGE 1] All checks passed.

======================================================================
STAGE 2: Worker DB-Backed Identity Proof
======================================================================

[STAGE 2] FORCE_DB_CHECKS=1 (DB reachable)

[STAGE 2] Running worker DB-backed proofs...
Worker DB Proof Results:
  - JOB-A-ENVELOPE-PROOF: PASS – Happy path job executed with DB-A-01-01 and DB-A-02-01.
  - JOB-A-ENVELOPE-MISMATCH: PASS – Mismatch job failed as expected (DB_NAMESPACE_MISMATCH...).

[STAGE 2] All checks passed.

======================================================================
OK: Worker identity proofs completed successfully.
======================================================================
```

## Sample `[DB_TRACE]` log emitted by Prisma middleware

```json
{
  "ns": "A",
  "sid": "SID-A-01ARZ3NDEKTSV4RRFFQ69G5F",
  "ref": "REF-A-01",
  "api": "API-A-01-01",
  "svc": null,
  "dbId": "DB-A-01-01",
  "model": "DealerAccount",
  "action": "findMany",
  "durationMs": 12,
  "timestamp": "2026-01-01T12:34:56.789Z"
}
```

## Sample `ENVELOPE_MISMATCH` failure output

```
ENVELOPE_MISMATCH: DB-ID 'DB-D-01-01' does not match request namespace 'A'. Expected prefix 'DB-A-'.
```

## Sample `BLOCKER: No DB-ID` failure output

```
BLOCKER: No DB-ID in scope - use db(dbId) runner for all database operations.
```

## Sample `DB_REQUIRED_BUT_UNREACHABLE` failure output

```
DB_REQUIRED_BUT_UNREACHABLE: FORCE_DB_CHECKS=1 was set but database is not reachable.
Reason: DATABASE_URL (or primary/replica) is not configured.
Ensure DATABASE_URL is set and the database is running.
```

## CI Integration

The CI job named `Identity Enforcement` runs both stages:

1. **Stage 1** always runs (mandatory)
2. **Stage 2** runs when:
   - Database is reachable (auto-detected), OR
   - `FORCE_DB_CHECKS=1` is set (fails if DB unreachable)

When `FORCE_DB_CHECKS=1` is set but the database is unreachable, the job fails with `DB_REQUIRED_BUT_UNREACHABLE` to prevent silent skipping of critical checks.

When neither flag is set and the database is unreachable, the job prints `SKIPPED_DB_CHECKS` and exits successfully, preventing false negatives while keeping Stage 1 enforcement guarantees.
