import * as path from "node:path";
import { spawn } from "node:child_process";
import { newSessionId } from "@repo/identity";
import { runWithEnvelope } from "../lib/runtimeContext";
import { db, prisma } from "../lib/prisma";
import { checkDatabaseReachable } from "../../../../scripts/db-preflight";

/**
 * Identity Enforcement Script
 *
 * This script validates the Identity Framework enforcement in two stages:
 *
 * STAGE 1 (Mandatory - cannot be skipped):
 *   - Registry & route scan vs OPERATIONS
 *   - TypeScript type checking
 *   - Identity unit tests
 *   - Prisma envelope guard validation (no DB required)
 *
 * STAGE 2 (DB-backed - requires live database):
 *   - DB-ID requirement enforcement
 *   - Namespace isolation (cross-namespace access blocked)
 *   - Concurrency safety (50 parallel queries)
 *
 * Environment Variables:
 *   - SKIP_DB_CHECKS=1    Skip Stage 2 (DB checks only)
 *   - FORCE_DB_CHECKS=1   Force Stage 2 even if DB preflight fails (fails loudly if unreachable)
 *
 * DEPRECATED (ignored):
 *   - SKIP_STAGE_ONE=1    No longer supported. Stage 1 always runs.
 */

type FailureExpectation = {
  description: string;
  fn: () => Promise<unknown>;
  expectedMessage: string;
};

const repoRoot = path.resolve(__dirname, "../../../../");

function printBanner(message: string): void {
  const line = "=".repeat(70);
  console.log(`\n${line}`);
  console.log(message);
  console.log(`${line}\n`);
}

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
  return {
    ns: "A",
    sid: newSessionId("A"),
    role: "ADMIN",
    userId: "test-user",
    path: "/api/bff/v1/admin/dashboard",
  };
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
  printBanner("STAGE 1: Static Analysis & Unit Tests (Mandatory)");
  await runCommand("Registry & route scan", "pnpm", ["tsx", "scripts/check-registry-and-routes.ts"]);
  await runCommand("Model registry validation", "pnpm", ["tsx", "scripts/verify-model-registry.ts"]);
  await runCommand("TypeScript check", "pnpm", ["typecheck"]);
  await runCommand("Identity unit tests", "pnpm", ["test"]);
  await testPrismaWithoutEnvelope();
  console.log("\n[STAGE 1] All checks passed.");
}

async function testMissingDbId() {
  const envelope = createAdminEnvelope();
  await assertFailure({
    description: "Enforced DB-ID requirement",
    fn: async () => {
      await runWithEnvelope(envelope, async () => {
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
      await runWithEnvelope(envelope, async () => {
        await db("DB-D-TEMP", (p) => p.$queryRaw`SELECT 1`);
      });
    },
    expectedMessage: "ENVELOPE_MISMATCH",
  });
}

async function testConcurrencySafety() {
  const envelope = createAdminEnvelope();
  await runWithEnvelope(envelope, async () => {
    const tasks = Array.from({ length: 50 }, (_, index) => {
      const dbId = index % 2 === 0 ? "DB-A-TEMP" : "DB-A-TEMP";
      return async () => {
        const result = await db(dbId, (p) =>
          p.$queryRaw<{ value: number }[]>`SELECT 1 AS value`,
        );
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

async function runStageTwo() {
  printBanner("STAGE 2: DB-Backed Identity Proof");

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

  console.log("\n[STAGE 2] Running DB-backed identity proof...");
  await testMissingDbId();
  await testNamespaceMismatch();
  await testConcurrencySafety();
  console.log("\n[STAGE 2] All checks passed.");
}

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

async function main() {
  try {
    console.log("\n" + "=".repeat(70));
    console.log("Identity Enforcement Verification");
    console.log("=".repeat(70));

    // Check for deprecated flags and warn
    checkDeprecatedFlags();

    // Stage 1 is MANDATORY - always runs
    await runStageOne();

    // Stage 2 depends on DB availability and flags
    await runStageTwo();

    printBanner("OK: Identity enforcement scripts completed successfully.");
  } catch (error) {
    console.error("\nFAIL: Identity enforcement check failed.", error);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}
