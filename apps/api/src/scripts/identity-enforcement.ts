import * as path from "node:path";
import { spawn } from "node:child_process";
import { buildEnvelope, newSessionId, newTraceId } from "@repo/identity";
import { runWithContext } from "../lib/runtimeContext";
import { db, prisma } from "../lib/prisma";
import { checkDatabaseReachable } from "../../../../scripts/db-preflight";

type FailureExpectation = {
  description: string;
  fn: () => Promise<unknown>;
  expectedMessage: string;
};

const repoRoot = path.resolve(__dirname, "../../../../");

function runCommand(label: string, command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`\n[STAGE 1] Running ${label}: ${command} ${args.join(" ")}`);
    const child = spawn(command, args, {
      cwd: repoRoot,
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    child.once("error", reject);
    child.once("close", (code) => {
      if (code !== 0) {
        reject(new Error(`${label} failed with exit code ${code}`));
      } else {
        resolve();
      }
    });
  });
}

async function assertFailure({ description, fn, expectedMessage }: FailureExpectation) {
  try {
    await fn();
    throw new Error(`Expected failure for ${description}, but the operation succeeded.`);
  } catch (error: unknown) {
    const message = String((error as Error)?.message ?? error ?? "");
    if (!message.includes(expectedMessage)) {
      throw new Error(
        `Unexpected error for ${description}. Expected message to contain "${expectedMessage}", but got "${message}".`,
      );
    }
    console.log(`PASS: ${description} failed as expected (${expectedMessage}).`);
  }
}

function createAdminEnvelope() {
  return buildEnvelope({
    namespace: "A",
    traceId: newTraceId("A"),
    sessionId: newSessionId("A"),
    featureId: "REF-A-01",
    operationId: "API-A-01-01",
    method: "GET",
    path: "/api/bff/v1/admin/dashboard",
  });
}

async function testPrismaWithoutEnvelope() {
  console.log("\n[STAGE 1] Validating Prisma envelope guard without DB...");
  await assertFailure({
    description: "Direct Prisma call with no envelope",
    fn: async () => {
      await prisma.$queryRaw`SELECT 1`;
    },
    expectedMessage: "Identity Envelope",
  });
}

async function runStageOne() {
  await runCommand("Registry & route scan", "pnpm", ["tsx", "scripts/check-registry-and-routes.ts"]);
  await runCommand("TypeScript check", "pnpm", ["typecheck"]);
  await runCommand("Identity unit tests", "pnpm", ["test"]);
  await testPrismaWithoutEnvelope();
}

async function testMissingDbId() {
  const envelope = createAdminEnvelope();
  await assertFailure({
    description: "Enforced DB-ID requirement",
    fn: async () => {
      await runWithContext(envelope, async () => {
        await prisma.$queryRaw`SELECT 1`;
      });
    },
    expectedMessage: "No DB-ID",
  });
}

async function testNamespaceMismatch() {
  const envelope = createAdminEnvelope();
  await assertFailure({
    description: "Namespace mismatch when using Dealer DB on Admin envelope",
    fn: async () => {
      await runWithContext(envelope, async () => {
        await db("DB-D-01-01").$queryRaw`SELECT 1`;
      });
    },
    expectedMessage: "ENVELOPE_MISMATCH",
  });
}

async function testConcurrencySafety() {
  const envelope = createAdminEnvelope();
  const dbIds = ["DB-A-01-01", "DB-A-02-01", "DB-A-06-01"];

  await runWithContext(envelope, async () => {
    const tasks = Array.from({ length: 50 }, (_, index) => {
      const dbId = dbIds[index % dbIds.length];
      return async () => {
        const result = await db(dbId).$queryRaw<{ value: number }>`SELECT 1 AS value`;
        return { dbId, value: result[0]?.value ?? null };
      };
    });

    const start = Date.now();
    const responses = await Promise.all(tasks.map((task) => task()));
    const duration = Date.now() - start;

    if (responses.length !== 50) {
      throw new Error("Concurrency test did not execute 50 tasks.");
    }

    const seen = new Set<string>(responses.map((r) => r.dbId));
    console.log(`[STAGE 2] Concurrency proof ran in ${duration}ms; DB IDs: ${Array.from(seen).join(", ")}`);
  });
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

async function runStageTwo() {
  const state = await determineDbCheckState();
  if (!state.run) {
    console.log(`\nSKIPPED_DB_CHECKS: ${state.reason}`);
    return;
  }

  console.log("\n[STAGE 2] Running DB-backed identity proof...");
  await testMissingDbId();
  await testNamespaceMismatch();
  await testConcurrencySafety();
}

async function main() {
  try {
    await runStageOne();
    await runStageTwo();
    console.log("\nOK: Identity enforcement scripts completed.");
  } catch (error) {
    console.error("FAIL: Identity enforcement check failed.", error);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}
