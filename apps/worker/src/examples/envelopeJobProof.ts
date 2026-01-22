import { checkDatabaseReachable } from "../../../../scripts/db-preflight";
import { assertJobPayloadValid, buildJobPayload, newSessionId, newTraceId } from "@repo/identity";
import { db, disconnectWorkerPrisma, getJobContext, withJobEnvelope } from "../lib/withJobEnvelope";

type JobResult = {
  jobId: string;
  succeeded: boolean;
  message: string;
};

const happyJob = withJobEnvelope(
  {
    namespace: "A",
    jobId: "JOB-A-ENVELOPE-PROOF",
    featureId: "REF-A-01",
    operationId: "API-A-01-01",
  },
  async ({ log }) => {
    log.info("Happy path job starting");
    await db("DB-A-01-01").$queryRaw`SELECT 1`;
    await db("DB-A-02-01").$queryRaw`SELECT 1`;
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
    await db("DB-D-01-01").$queryRaw`SELECT 1`;
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

async function runWorkerUnitChecks(): Promise<void> {
  console.log("\n[STAGE 1] Running worker identity unit checks...");

  const validPayload = {
    ns: "A",
    tid: newTraceId("A"),
    sid: newSessionId("A"),
    ref: "REF-A-01",
    api: "API-A-01-01",
  };
  assertJobPayloadValid(validPayload);
  console.log("[STAGE 1] Valid job payload accepted.");

  try {
    assertJobPayloadValid({ ...validPayload, tid: "INVALID" });
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
}

async function determineDbCheckState() {
  const skipFlag = process.env.SKIP_DB_CHECKS === "1";
  const forceFlag = process.env.FORCE_DB_CHECKS === "1";

  if (skipFlag) {
    return { run: false, reason: "SKIP_DB_CHECKS=1" };
  }

  const preflight = await checkDatabaseReachable();
  if (forceFlag) {
    return {
      run: true,
      reason: preflight.reachable
        ? "FORCE_DB_CHECKS=1 (DB reachable)"
        : `FORCE_DB_CHECKS=1 (preflight: ${preflight.reason ?? "unknown"})`,
    };
  }

  if (preflight.reachable) {
    return { run: true };
  }

  return { run: false, reason: preflight.reason ?? "Database unreachable (preflight failed)" };
}

async function runWorkerDbProofs(): Promise<void> {
  const state = await determineDbCheckState();
  if (!state.run) {
    console.log(`\nSKIPPED_DB_CHECKS: ${state.reason}`);
    return;
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
    const success = message.includes("ENVELOPE_MISMATCH");
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
}

async function runProofs(): Promise<void> {
  try {
    await runWorkerUnitChecks();
    await runWorkerDbProofs();
    console.log("\nOK: Worker identity proofs completed.");
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
