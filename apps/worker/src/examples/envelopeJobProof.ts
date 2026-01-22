import { assertJobPayloadValid, buildJobPayload, newSessionId, newTraceId } from "@repo/identity";
import { checkDatabaseReachable } from "../lib/dbPreflight";
import { db, disconnectWorkerPrisma } from "../lib/prisma";
import { getJobContext, withJobEnvelope } from "../lib/withJobEnvelope";

/**
 * Worker Identity Proof Script
 *
 * This script validates the Identity Framework enforcement for worker jobs:
 *
 * STAGE 1 (Mandatory - cannot be skipped):
 *   - Job payload validation (TID format, namespace matching)
 *   - Job context population within withJobEnvelope
 *
 * STAGE 2 (DB-backed - requires live database):
 *   - Happy path job execution with registered DB IDs
 *   - Namespace mismatch detection (cross-namespace access blocked)
 *
 * Environment Variables:
 *   - SKIP_DB_CHECKS=1    Skip Stage 2 (DB checks only)
 *   - FORCE_DB_CHECKS=1   Force Stage 2 even if DB preflight fails (fails loudly if unreachable)
 *
 * DEPRECATED (ignored):
 *   - SKIP_STAGE_ONE=1    No longer supported. Stage 1 always runs.
 */

type JobResult = {
  jobId: string;
  succeeded: boolean;
  message: string;
};

function printBanner(message: string): void {
  const line = "=".repeat(70);
  console.log(`\n${line}`);
  console.log(message);
  console.log(`${line}\n`);
}

const happyJob = withJobEnvelope(
  {
    namespace: "A",
    jobId: "JOB-A-ENVELOPE-PROOF",
    featureId: "REF-A-01",
    operationId: "API-A-01-01",
  },
  async ({ log }) => {
    log.info("Happy path job starting");
    await db("DB-A-01-01", (p) => p.$queryRaw`SELECT 1`);
    await db("DB-A-02-01", (p) => p.$queryRaw`SELECT 1`);
    log.info("Happy path job completed");
    return { success: true };
  },
);

const mismatchJob = withJobEnvelope(
  {
    namespace: "A",
    jobId: "JOB-A-ENVELOPE-MISMATCH",
    featureId: "REF-A-01",
    operationId: "API-A-01-02",
  },
  async () => {
    await db("DB-D-01-01", (p) => p.$queryRaw`SELECT 1`);
    return { success: true };
  },
);

export const exampleJobPayload = buildJobPayload({
  namespace: "A",
  traceId: newTraceId("A"),
  sessionId: newSessionId("A"),
  featureId: "REF-A-01",
  operationId: "API-A-01-01",
  method: "JOB",
  path: "JOB-A-EXAMPLE",
});

function checkDeprecatedFlags(): void {
  // SKIP_STAGE_ONE is deprecated and ignored
  if (process.env.SKIP_STAGE_ONE === "1") {
    printBanner(
      "WARNING: SKIP_STAGE_ONE is deprecated and will be IGNORED.\n" +
        "Stage 1 is mandatory and will still run.\n" +
        "Use SKIP_DB_CHECKS=1 to skip only the database checks (Stage 2).",
    );
  }
}

async function runWorkerUnitChecks(): Promise<void> {
  printBanner("STAGE 1: Worker Identity Unit Checks (Mandatory)");

  const validPayload = {
    ns: "A" as const,
    tid: newTraceId("A"),
    sid: newSessionId("A"),
    ref: "REF-A-01",
    api: "API-A-01-01",
  };
  assertJobPayloadValid(validPayload);
  console.log("[STAGE 1] Valid job payload accepted.");

  try {
    assertJobPayloadValid({ ...validPayload, ns: "A" as const, tid: "INVALID" });
    throw new Error("Invalid TID should have failed validation.");
  } catch (error) {
    if (String((error as Error)?.message).includes("JobPayloadInvalidTid")) {
      console.log("[STAGE 1] Invalid job payload rejected as expected.");
    } else {
      throw error;
    }
  }

  const contextJob = withJobEnvelope(
    {
      namespace: "A",
      jobId: "JOB-A-ENVELOPE-UNIT",
      featureId: "REF-A-01",
      operationId: "API-A-01-03",
    },
    async () => {
      const ctx = getJobContext();
      if (!ctx) {
        throw new Error("Job context missing inside withJobEnvelope.");
      }
      return true;
    },
  );
  await contextJob(undefined);
  console.log("[STAGE 1] Job context is populated within withJobEnvelope.");
  console.log("\n[STAGE 1] All checks passed.");
}

interface DbCheckState {
  run: boolean;
  reason?: string;
  failOnUnreachable?: boolean;
}

async function determineDbCheckState(): Promise<DbCheckState> {
  const skipFlag = process.env.SKIP_DB_CHECKS === "1";
  const forceFlag = process.env.FORCE_DB_CHECKS === "1";

  // SKIP_DB_CHECKS=1 explicitly skips Stage 2
  if (skipFlag) {
    return { run: false, reason: "SKIP_DB_CHECKS=1" };
  }

  // Check database reachability
  const preflight = await checkDatabaseReachable();

  // FORCE_DB_CHECKS=1 requires Stage 2 to run - fail if DB unreachable
  if (forceFlag) {
    if (!preflight.reachable) {
      return {
        run: false,
        reason: preflight.reason ?? "Database unreachable",
        failOnUnreachable: true,
      };
    }
    return { run: true, reason: "FORCE_DB_CHECKS=1 (DB reachable)" };
  }

  // Default: run if DB is reachable, skip otherwise
  if (preflight.reachable) {
    return { run: true };
  }

  return { run: false, reason: preflight.reason ?? "Database unreachable (preflight failed)" };
}

async function runWorkerDbProofs(): Promise<void> {
  printBanner("STAGE 2: Worker DB-Backed Identity Proof");

  const state = await determineDbCheckState();

  // If FORCE_DB_CHECKS=1 but DB is unreachable, fail loudly
  if (state.failOnUnreachable) {
    throw new Error(
      `DB_REQUIRED_BUT_UNREACHABLE: FORCE_DB_CHECKS=1 was set but database is not reachable.\n` +
        `Reason: ${state.reason}\n` +
        `Ensure DATABASE_URL is set and the database is running.`,
    );
  }

  if (!state.run) {
    console.log(`SKIPPED_DB_CHECKS: ${state.reason}`);
    console.log("To run Stage 2, ensure DATABASE_URL is set and the database is running.");
    console.log("To force Stage 2 (and fail if DB unreachable): FORCE_DB_CHECKS=1");
    return;
  }

  if (state.reason) {
    console.log(`[STAGE 2] ${state.reason}`);
  }

  console.log("\n[STAGE 2] Running worker DB-backed proofs...");
  const results: JobResult[] = [];

  try {
    await happyJob(undefined);
    results.push({
      jobId: "JOB-A-ENVELOPE-PROOF",
      succeeded: true,
      message: "Happy path job executed with DB-A-01-01 and DB-A-02-01.",
    });
  } catch (error) {
    results.push({
      jobId: "JOB-A-ENVELOPE-PROOF",
      succeeded: false,
      message: `Happy job failed: ${(error as Error)?.message}`,
    });
  }

  try {
    await mismatchJob(undefined);
    results.push({
      jobId: "JOB-A-ENVELOPE-MISMATCH",
      succeeded: false,
      message: "Mismatch job unexpectedly succeeded (should throw).",
    });
  } catch (error) {
    const message = String((error as Error)?.message ?? error);
    // Accept either ENVELOPE_MISMATCH (middleware level) or DB_NAMESPACE_MISMATCH (db() level)
    const success = message.includes("MISMATCH");
    results.push({
      jobId: "JOB-A-ENVELOPE-MISMATCH",
      succeeded: success,
      message: success
        ? `Mismatch job failed as expected (${message}).`
        : `Mismatch job failed with unexpected error: ${message}`,
    });
  }

  console.log("\nWorker DB Proof Results:");
  for (const result of results) {
    console.log(`  - ${result.jobId}: ${result.succeeded ? "PASS" : "FAIL"} – ${result.message}`);
  }

  const failed = results.some((result) => !result.succeeded);
  if (failed) {
    throw new Error("One or more worker DB proofs failed.");
  }

  console.log("\n[STAGE 2] All checks passed.");
}

async function runProofs(): Promise<void> {
  try {
    console.log("\n" + "=".repeat(70));
    console.log("Worker Identity Proof Verification");
    console.log("=".repeat(70));

    // Check for deprecated flags and warn
    checkDeprecatedFlags();

    // Stage 1 is MANDATORY - always runs
    await runWorkerUnitChecks();

    // Stage 2 depends on DB availability and flags
    await runWorkerDbProofs();

    printBanner("OK: Worker identity proofs completed successfully.");
  } catch (error) {
    console.error("\nFAIL: Worker identity proof failed.", error);
    process.exitCode = 1;
  } finally {
    await disconnectWorkerPrisma();
  }
}

if (require.main === module) {
  runProofs();
}
