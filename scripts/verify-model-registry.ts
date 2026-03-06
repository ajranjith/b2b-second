#!/usr/bin/env tsx
/**
 * CI Check: Prisma MODEL registry validation
 *
 * Validates:
 * 1) All prisma schema models exist in MODELS registry
 * 2) MODELS registry has no extra entries not in schema
 * 3) QUERIES entries reference valid MODELS and use valid DB IDs
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { MODELS, QUERIES } from "../packages/identity/src/index";

const repoRoot = path.resolve(__dirname, "..");
const schemaPath = path.join(repoRoot, "packages", "db", "prisma", "schema.prisma");

function extractModelNames(schema: string): string[] {
  const matches = schema.matchAll(/^model\s+(\w+)\s+/gm);
  return Array.from(matches, (match) => match[1]);
}

function fail(message: string): never {
  console.error(`\nMODEL_REGISTRY_ERROR: ${message}`);
  process.exit(1);
}

function main() {
  if (!fs.existsSync(schemaPath)) {
    fail(`schema.prisma not found at ${schemaPath}`);
  }

  const schema = fs.readFileSync(schemaPath, "utf-8");
  const schemaModels = extractModelNames(schema);
  const schemaSet = new Set(schemaModels);

  const registryModels = Object.keys(MODELS);
  const registrySet = new Set(registryModels);

  const missingInRegistry = schemaModels.filter((m) => !registrySet.has(m));
  const extraInRegistry = registryModels.filter((m) => !schemaSet.has(m));

  if (missingInRegistry.length > 0) {
    fail(`MODELS registry missing: ${missingInRegistry.join(", ")}`);
  }

  if (extraInRegistry.length > 0) {
    fail(`MODELS registry has extra entries not in schema: ${extraInRegistry.join(", ")}`);
  }

  for (const [key, entry] of Object.entries(QUERIES)) {
    if (!/^DB-[AD]-\d{2}-\d{2}$/.test(entry.id)) {
      fail(`QUERIES.${key} has invalid DB ID: ${entry.id}`);
    }

    for (const model of entry.models) {
      if (!(model in MODELS)) {
        fail(`QUERIES.${key} references unknown model '${model}'.`);
      }
    }
  }

  console.log("OK: MODEL registry and QUERIES mapping are valid.");
}

main();
