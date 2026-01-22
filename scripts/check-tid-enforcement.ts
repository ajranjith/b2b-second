#!/usr/bin/env tsx
/**
 * CI Check: TID (Trace ID) Enforcement
 *
 * This script validates that:
 * 1. Internal BFF calls forward X-Trace-Id header
 * 2. Worker jobs include tid in payload
 * 3. Workers restore context before DB access
 *
 * Run with: pnpm tsx scripts/check-tid-enforcement.ts
 */

import * as fs from "fs";
import * as path from "path";
import { glob } from "glob";

interface Violation {
  file: string;
  line: number;
  rule: string;
  message: string;
  code: string;
}

const violations: Violation[] = [];

function addViolation(
  file: string,
  line: number,
  rule: string,
  message: string,
  code: string,
): void {
  violations.push({ file, line, rule, message, code });
}

async function checkFile(filePath: string): Promise<void> {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const relativePath = path.relative(process.cwd(), filePath);

  // Rule 1: Internal fetch calls must use bffClient or forward trace headers
  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // Check for raw fetch calls that might not forward trace headers
    if (
      line.includes("fetch(") &&
      !line.includes("bffClient") &&
      !line.includes("getTraceHeaders") &&
      !line.includes("x-trace-id") &&
      !line.includes("TRACE_HEADER") &&
      // Exclude test files and external API calls
      !relativePath.includes(".spec.") &&
      !relativePath.includes(".test.") &&
      !relativePath.includes("node_modules")
    ) {
      // Check if this is likely an internal call
      const isInternalCall =
        line.includes("/api/") ||
        line.includes("localhost") ||
        line.includes("INTERNAL_API");

      if (isInternalCall) {
        addViolation(
          relativePath,
          lineNum,
          "TID_FORWARD_MISSING",
          "Internal fetch call may not forward X-Trace-Id. Use bffClient or include trace headers.",
          line.trim(),
        );
      }
    }
  });

  // Rule 2: Worker job creation must include tid
  if (relativePath.includes("worker") || relativePath.includes("job")) {
    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // Check for job payloads without tid
      if (
        (line.includes("createJob") || line.includes("enqueue") || line.includes("dispatch")) &&
        !line.includes("tid") &&
        !line.includes("traceId") &&
        !line.includes("createJobPayloadFromContext") &&
        !line.includes("createStandaloneJobPayload") &&
        !line.includes("buildJobPayload")
      ) {
        // Look for the payload object in nearby lines
        const contextLines = lines.slice(Math.max(0, index - 5), index + 5).join("\n");
        if (
          contextLines.includes("{") &&
          !contextLines.includes("tid:") &&
          !contextLines.includes("traceId:")
        ) {
          addViolation(
            relativePath,
            lineNum,
            "JOB_TID_MISSING",
            "Job creation may not include tid in payload. Jobs must carry trace ID.",
            line.trim(),
          );
        }
      }
    });
  }

  // Rule 3: DB operations in workers must have context
  if (relativePath.includes("worker") || relativePath.includes("services/")) {
    let hasContextRestore = false;
    let hasDbOperation = false;
    let dbOperationLine = 0;
    let dbOperationCode = "";

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // Check for context restore patterns
      if (
        line.includes("runWithJobContext") ||
        line.includes("setWorkerContext") ||
        line.includes("assertWorkerContextBeforeDb") ||
        line.includes("runWithContext")
      ) {
        hasContextRestore = true;
      }

      // Check for Prisma operations
      if (
        (line.includes("prisma.") || line.includes("$queryRaw") || line.includes("$executeRaw")) &&
        !line.includes("//") &&
        !line.includes("*")
      ) {
        if (!hasDbOperation) {
          hasDbOperation = true;
          dbOperationLine = lineNum;
          dbOperationCode = line.trim();
        }
      }
    });

    // If file has DB operations but no context restore, flag it
    if (
      hasDbOperation &&
      !hasContextRestore &&
      !relativePath.includes(".spec.") &&
      !relativePath.includes(".test.") &&
      !relativePath.includes("seed") &&
      !relativePath.includes("migration")
    ) {
      addViolation(
        relativePath,
        dbOperationLine,
        "WORKER_CONTEXT_MISSING",
        "Worker file has DB operations but no context restoration. Use runWithJobContext or assertWorkerContextBeforeDb.",
        dbOperationCode,
      );
    }
  }
}

async function main(): Promise<void> {
  console.log("🔍 Checking TID enforcement...\n");

  // Find all TypeScript files in apps/
  const files = await glob("apps/**/*.ts", {
    ignore: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/*.d.ts",
      "**/check-tid-enforcement.ts",
    ],
  });

  console.log(`Found ${files.length} files to check.\n`);

  for (const file of files) {
    await checkFile(file);
  }

  // Report results
  if (violations.length === 0) {
    console.log("✅ No TID enforcement violations found!\n");
    process.exit(0);
  }

  console.log(`❌ Found ${violations.length} TID enforcement violation(s):\n`);

  // Group by rule
  const byRule = violations.reduce(
    (acc, v) => {
      if (!acc[v.rule]) acc[v.rule] = [];
      acc[v.rule].push(v);
      return acc;
    },
    {} as Record<string, Violation[]>,
  );

  for (const [rule, ruleViolations] of Object.entries(byRule)) {
    console.log(`\n📌 ${rule} (${ruleViolations.length} violations):`);
    console.log("─".repeat(60));

    for (const v of ruleViolations) {
      console.log(`  ${v.file}:${v.line}`);
      console.log(`  └─ ${v.message}`);
      console.log(`     Code: ${v.code.substring(0, 80)}${v.code.length > 80 ? "..." : ""}`);
      console.log();
    }
  }

  console.log("\n🔧 How to fix:");
  console.log("  - TID_FORWARD_MISSING: Use bffClient from @/lib/bffClient for internal calls");
  console.log("  - JOB_TID_MISSING: Use buildJobPayload(envelope) or createStandaloneJobPayload(ns)");
  console.log("  - WORKER_CONTEXT_MISSING: Wrap job execution with runWithJobContext(payload, fn)");
  console.log();

  process.exit(1);
}

main().catch((error) => {
  console.error("Error running TID enforcement check:", error);
  process.exit(1);
});
