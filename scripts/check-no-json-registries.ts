#!/usr/bin/env tsx
/**
 * CI Guardrail: No JSON Registries
 *
 * This script fails if any JSON registry files exist in the repo.
 * Registries MUST be TypeScript exports only.
 *
 * Run with: pnpm tsx scripts/check-no-json-registries.ts
 */

import { glob } from "glob";

async function main(): Promise<void> {
  console.log("Checking for forbidden JSON registry files...\n");

  // Patterns that indicate registry JSON files
  const forbiddenPatterns = [
    "**/*registry*.json",
    "**/registries/*.json",
    "**/registry/**/*.json",
    "**/features.json",
    "**/operations.json",
    "**/queries.json",
    "**/services.json",
  ];

  const ignorePatterns = [
    "**/node_modules/**",
    "**/.git/**",
    "**/dist/**",
    "**/build/**",
  ];

  const violations: string[] = [];

  for (const pattern of forbiddenPatterns) {
    const files = glob.sync(pattern, { ignore: ignorePatterns });
    violations.push(...files);
  }

  if (violations.length > 0) {
    console.log("FAIL: Found JSON registry files (forbidden):\n");
    for (const file of violations) {
      console.log(`  - ${file}`);
    }
    console.log("\nRegistries MUST be TypeScript exports only.");
    console.log("See packages/identity/src/index.ts for the correct pattern.");
    console.log("\nTo fix:");
    console.log("  1. Delete the JSON file(s) listed above");
    console.log("  2. Add entries to the TypeScript registries in packages/identity/src/index.ts");
    process.exit(1);
  }

  console.log("OK: No JSON registry files found.\n");
  console.log("Registries are TypeScript-only as required.");
  process.exit(0);
}

main().catch((error) => {
  console.error("Error running JSON registry check:", error);
  process.exit(1);
});
