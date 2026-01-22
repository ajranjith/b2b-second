#!/usr/bin/env tsx
/**
 * CI Check: Registry Validation and Route Handler Coverage
 *
 * This script validates that:
 * 1. All route handlers (route.ts) have entries in OPERATIONS registry
 * 2. All OPERATIONS entries have corresponding route handlers
 * 3. Registry IDs are unique and follow correct format
 * 4. Repositories/services use db(dbId) wrapper with registered IDs
 * 5. No disallowed imports (axios, node-fetch, direct @prisma/client)
 * 6. No global fetch in route handlers/services (must use bffClient)
 *
 * Run with: pnpm tsx scripts/check-registry-and-routes.ts
 */

import * as fs from "fs";
import * as path from "path";
import { glob } from "glob";
import {
  FEATURES,
  OPERATIONS,
  SERVICES,
  QUERIES,
  resolveOperationId,
  resolveFeatureId,
  type Namespace,
} from "../packages/identity/src/index";

interface Violation {
  file: string;
  line: number;
  rule: string;
  message: string;
  code?: string;
}

const violations: Violation[] = [];

function addViolation(
  file: string,
  line: number,
  rule: string,
  message: string,
  code?: string,
): void {
  violations.push({ file, line, rule, message, code });
}

/**
 * Extract route path from file path
 * e.g., apps/api/app/api/bff/v1/admin/dashboard/route.ts -> /api/bff/v1/admin/dashboard
 */
function extractRoutePath(filePath: string): string | null {
  const match = filePath.match(/apps[\\/]api[\\/]app(.+)[\\/]route\.ts$/);
  if (!match) return null;
  // Normalize path separators and convert [param] to registry format
  return match[1].replace(/\\/g, "/");
}

/**
 * Determine namespace from route path
 */
function determineNamespace(routePath: string): Namespace | null {
  if (routePath.includes("/admin/")) return "A";
  if (routePath.includes("/dealer/")) return "D";
  return null;
}

/**
 * Parse route handlers and validate against OPERATIONS registry
 */
async function checkRouteHandlers(): Promise<void> {
  console.log("📂 Checking route handler coverage against OPERATIONS registry...\n");

  const routeFiles = glob.sync("apps/api/app/api/bff/v1/**/route.ts", {
    ignore: ["**/node_modules/**"],
  });

  const registeredRoutes = new Set<string>();
  const foundRoutes: Array<{ path: string; method: string; namespace: Namespace }> = [];

  for (const routeFile of routeFiles) {
    const content = fs.readFileSync(routeFile, "utf-8");
    const relativePath = path.relative(process.cwd(), routeFile).replace(/\\/g, "/");
    const routePath = extractRoutePath(routeFile);

    if (!routePath) continue;

    const namespace = determineNamespace(routePath);
    if (!namespace) {
      addViolation(
        relativePath,
        1,
        "ROUTE_UNKNOWN_NAMESPACE",
        `Cannot determine namespace for route '${routePath}'. Expected /admin/ or /dealer/ in path.`,
      );
      continue;
    }

    // Check for exported HTTP methods
    const methods: string[] = [];
    if (/export\s+(const|async\s+function)\s+GET\b/m.test(content)) methods.push("GET");
    if (/export\s+(const|async\s+function)\s+POST\b/m.test(content)) methods.push("POST");
    if (/export\s+(const|async\s+function)\s+PUT\b/m.test(content)) methods.push("PUT");
    if (/export\s+(const|async\s+function)\s+PATCH\b/m.test(content)) methods.push("PATCH");
    if (/export\s+(const|async\s+function)\s+DELETE\b/m.test(content)) methods.push("DELETE");

    // Check if route uses withEnvelope
    const usesEnvelope = content.includes("withEnvelope");
    if (methods.length > 0 && !usesEnvelope) {
      addViolation(
        relativePath,
        1,
        "ROUTE_MISSING_ENVELOPE",
        `Route handler exports ${methods.join(", ")} but does not use withEnvelope wrapper.`,
      );
    }

    // Check each method against OPERATIONS registry
    for (const method of methods) {
      const operationId = resolveOperationId(method, routePath, namespace);

      if (!operationId) {
        addViolation(
          relativePath,
          1,
          "ROUTE_NOT_IN_REGISTRY",
          `Route ${method} ${routePath} (ns=${namespace}) is not registered in OPERATIONS.`,
        );
      } else {
        registeredRoutes.add(`${method}:${namespace}:${routePath}`);
        foundRoutes.push({ path: routePath, method, namespace });
        console.log(`  ✓ ${method} ${routePath} → ${operationId}`);
      }
    }

    // Check feature resolution
    const featureId = resolveFeatureId(routePath, namespace);
    if (!featureId && methods.length > 0) {
      addViolation(
        relativePath,
        1,
        "ROUTE_FEATURE_NOT_IN_REGISTRY",
        `Route ${routePath} (ns=${namespace}) has no matching FEATURES entry.`,
      );
    }
  }

  // Check for orphaned OPERATIONS entries (registered but no route handler)
  console.log("\n📋 Checking for orphaned OPERATIONS entries...\n");
  for (const op of OPERATIONS) {
    const key = `${op.method}:${op.namespace}:${op.pathTemplate}`;
    // Only check for exact matches in BFF routes
    if (op.pathTemplate.startsWith("/api/bff/v1/")) {
      const found = foundRoutes.some(
        (r) =>
          r.method === op.method &&
          r.namespace === op.namespace &&
          matchPathTemplate(op.pathTemplate, r.path),
      );
      if (!found) {
        console.log(`  ⚠️ Orphaned: ${op.method} ${op.pathTemplate} (${op.operationId})`);
        // Not a violation, just a warning - the route might be planned but not implemented yet
      }
    }
  }
}

/**
 * Match a path template against an actual path
 */
function matchPathTemplate(template: string, actual: string): boolean {
  const normalizedTemplate = template.replace(/\/+$/, "");
  const normalizedActual = actual.replace(/\/+$/, "");
  const escaped = normalizedTemplate
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\\\[([^/]+)\\\]/g, "[^/]+");
  const regex = new RegExp(`^${escaped}$`);
  return regex.test(normalizedActual);
}

/**
 * Validate registry integrity using actual TS constants
 */
async function checkRegistryIntegrity(): Promise<void> {
  console.log("\n📋 Validating registry integrity...\n");

  // Check FEATURES
  console.log("  Checking FEATURES registry:");
  const featurePaths = new Map<string, string>();
  for (const feature of FEATURES) {
    const key = `${feature.namespace}:${feature.pathTemplate}`;
    if (featurePaths.has(key)) {
      addViolation(
        "packages/identity/src/index.ts",
        0,
        "REGISTRY_DUPLICATE_PATH",
        `Duplicate FEATURES path: ${feature.pathTemplate} (ns=${feature.namespace})`,
      );
    }
    featurePaths.set(key, feature.featureId);

    // Validate format
    if (!/^REF-[AD]-\d{2}$/.test(feature.featureId)) {
      addViolation(
        "packages/identity/src/index.ts",
        0,
        "REGISTRY_INVALID_ID_FORMAT",
        `Feature ID '${feature.featureId}' does not match format REF-{A|D}-##`,
      );
    }

    // Validate namespace prefix
    const expectedPrefix = `REF-${feature.namespace}-`;
    if (!feature.featureId.startsWith(expectedPrefix)) {
      addViolation(
        "packages/identity/src/index.ts",
        0,
        "REGISTRY_NAMESPACE_MISMATCH",
        `Feature '${feature.featureId}' prefix doesn't match namespace '${feature.namespace}'`,
      );
    }
  }
  console.log(`    ✓ ${FEATURES.length} entries, ${featurePaths.size} unique paths`);

  // Check OPERATIONS
  console.log("  Checking OPERATIONS registry:");
  const operationIds = new Set<string>();
  for (const op of OPERATIONS) {
    if (operationIds.has(op.operationId)) {
      addViolation(
        "packages/identity/src/index.ts",
        0,
        "REGISTRY_DUPLICATE_OPERATION",
        `Duplicate operation ID: ${op.operationId}`,
      );
    }
    operationIds.add(op.operationId);

    // Validate format
    if (!/^API-[AD]-\d{2}-\d{2}$/.test(op.operationId)) {
      addViolation(
        "packages/identity/src/index.ts",
        0,
        "REGISTRY_INVALID_ID_FORMAT",
        `Operation ID '${op.operationId}' does not match format API-{A|D}-##-##`,
      );
    }

    // Validate namespace prefix
    const expectedPrefix = `API-${op.namespace}-`;
    if (!op.operationId.startsWith(expectedPrefix)) {
      addViolation(
        "packages/identity/src/index.ts",
        0,
        "REGISTRY_NAMESPACE_MISMATCH",
        `Operation '${op.operationId}' prefix doesn't match namespace '${op.namespace}'`,
      );
    }

    // Validate featureId reference
    const referencedFeature = FEATURES.find(
      (f) => f.featureId === op.featureId && f.namespace === op.namespace,
    );
    if (!referencedFeature) {
      addViolation(
        "packages/identity/src/index.ts",
        0,
        "REGISTRY_INVALID_REFERENCE",
        `Operation '${op.operationId}' references unknown feature '${op.featureId}'`,
      );
    }
  }
  console.log(`    ✓ ${OPERATIONS.length} entries, ${operationIds.size} unique IDs`);

  // Check SERVICES
  console.log("  Checking SERVICES registry:");
  const serviceIds = new Set<string>();
  for (const svc of SERVICES) {
    if (serviceIds.has(svc.serviceId)) {
      addViolation(
        "packages/identity/src/index.ts",
        0,
        "REGISTRY_DUPLICATE_SERVICE",
        `Duplicate service ID: ${svc.serviceId}`,
      );
    }
    serviceIds.add(svc.serviceId);

    // Validate format
    if (!/^SVC-[AD]-\d{2}-\d{2}$/.test(svc.serviceId)) {
      addViolation(
        "packages/identity/src/index.ts",
        0,
        "REGISTRY_INVALID_ID_FORMAT",
        `Service ID '${svc.serviceId}' does not match format SVC-{A|D}-##-##`,
      );
    }

    // Validate namespace prefix
    const expectedPrefix = `SVC-${svc.namespace}-`;
    if (!svc.serviceId.startsWith(expectedPrefix)) {
      addViolation(
        "packages/identity/src/index.ts",
        0,
        "REGISTRY_NAMESPACE_MISMATCH",
        `Service '${svc.serviceId}' prefix doesn't match namespace '${svc.namespace}'`,
      );
    }
  }
  console.log(`    ✓ ${SERVICES.length} entries, ${serviceIds.size} unique IDs`);

  // Check QUERIES
  console.log("  Checking QUERIES registry:");
  const queryIds = new Set<string>();
  for (const query of QUERIES) {
    if (queryIds.has(query.queryId)) {
      addViolation(
        "packages/identity/src/index.ts",
        0,
        "REGISTRY_DUPLICATE_QUERY",
        `Duplicate query ID: ${query.queryId}`,
      );
    }
    queryIds.add(query.queryId);

    // Validate format
    if (!/^DB-[AD]-\d{2}-\d{2}$/.test(query.queryId)) {
      addViolation(
        "packages/identity/src/index.ts",
        0,
        "REGISTRY_INVALID_ID_FORMAT",
        `Query ID '${query.queryId}' does not match format DB-{A|D}-##-##`,
      );
    }

    // Validate namespace prefix
    const expectedPrefix = `DB-${query.namespace}-`;
    if (!query.queryId.startsWith(expectedPrefix)) {
      addViolation(
        "packages/identity/src/index.ts",
        0,
        "REGISTRY_NAMESPACE_MISMATCH",
        `Query '${query.queryId}' prefix doesn't match namespace '${query.namespace}'`,
      );
    }
  }
  console.log(`    ✓ ${QUERIES.length} entries, ${queryIds.size} unique IDs`);
}

/**
 * Check for disallowed imports in source files
 */
async function checkDisallowedImports(): Promise<void> {
  console.log("\n🚫 Checking for disallowed imports...\n");

  const ignorePatterns = [
    "**/node_modules/**",
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/lib/bffClient.ts", // bffClient is allowed to use fetch
    "**/lib/prisma.ts", // prisma.ts is allowed to import @prisma/client
    "**/lib/dbContext.ts", // dbContext may need prisma types
  ];
  const sourceFiles = [
    ...glob.sync("apps/api/app/**/*.ts", { ignore: ignorePatterns }),
    ...glob.sync("apps/api/src/**/*.ts", { ignore: ignorePatterns }),
    ...glob.sync("apps/worker/src/**/*.ts", { ignore: ignorePatterns }),
  ];

  const disallowedPatterns = [
    {
      pattern: /import\s+.*\s+from\s+['"]axios['"]/,
      rule: "DISALLOWED_IMPORT_AXIOS",
      message: "Use bffClient from @/lib/bffClient instead of axios",
    },
    {
      pattern: /import\s+.*\s+from\s+['"]node-fetch['"]/,
      rule: "DISALLOWED_IMPORT_NODE_FETCH",
      message: "Use bffClient from @/lib/bffClient instead of node-fetch",
    },
    {
      pattern: /import\s+.*\s+from\s+['"]@prisma\/client['"]/,
      rule: "DISALLOWED_IMPORT_PRISMA_CLIENT",
      message: "Import from @/lib/prisma instead. Direct @prisma/client imports bypass trace logging.",
    },
  ];

  for (const file of sourceFiles) {
    const content = fs.readFileSync(file, "utf-8");
    const relativePath = path.relative(process.cwd(), file).replace(/\\/g, "/");
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const { pattern, rule, message } of disallowedPatterns) {
        if (pattern.test(line)) {
          addViolation(relativePath, i + 1, rule, message, line.trim());
        }
      }
    }
  }
}

/**
 * Check for global fetch usage in route handlers and services
 */
async function checkGlobalFetchUsage(): Promise<void> {
  console.log("\n🌐 Checking for global fetch usage...\n");

  const fetchIgnorePatterns = [
    "**/node_modules/**",
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/lib/bffClient.ts",
  ];
  const targetFiles = [
    ...glob.sync("apps/api/app/api/**/*.ts", { ignore: fetchIgnorePatterns }),
    ...glob.sync("apps/api/src/services/**/*.ts", { ignore: fetchIgnorePatterns }),
    ...glob.sync("apps/api/src/routes/**/*.ts", { ignore: fetchIgnorePatterns }),
  ];

  for (const file of targetFiles) {
    const content = fs.readFileSync(file, "utf-8");
    const relativePath = path.relative(process.cwd(), file).replace(/\\/g, "/");
    const lines = content.split("\n");

    // Check if file imports bffClient or has trace header handling
    const hasBffClient =
      content.includes("bffClient") ||
      content.includes("adminFetch") ||
      content.includes("dealerFetch") ||
      content.includes("getTraceHeaders");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Look for fetch( calls that are not inside bffClient usage
      if (
        /\bfetch\s*\(/.test(line) &&
        !line.includes("//") &&
        !line.includes("bffClient") &&
        !line.includes("adminFetch") &&
        !line.includes("dealerFetch")
      ) {
        // Check if this looks like an internal call
        const isLikelyInternal =
          line.includes("/api/") ||
          line.includes("localhost") ||
          line.includes("INTERNAL_API") ||
          line.includes("process.env");

        if (isLikelyInternal && !hasBffClient) {
          addViolation(
            relativePath,
            i + 1,
            "GLOBAL_FETCH_USAGE",
            "Use bffClient from @/lib/bffClient for internal calls. Global fetch bypasses trace context.",
            line.trim(),
          );
        }
      }
    }
  }
}

/**
 * Check that db() wrapper is used with registered DB IDs
 */
async function checkDbWrapperUsage(): Promise<void> {
  console.log("\n🔍 Checking db() wrapper usage...\n");

  const dbIgnorePatterns = ["**/node_modules/**", "**/*.test.ts", "**/*.spec.ts"];
  const serviceFiles = [
    ...glob.sync("apps/api/src/services/**/*.ts", { ignore: dbIgnorePatterns }),
    ...glob.sync("apps/api/src/repositories/**/*.ts", { ignore: dbIgnorePatterns }),
    ...glob.sync("apps/worker/src/services/**/*.ts", { ignore: dbIgnorePatterns }),
  ];

  // Get all registered DB IDs
  const registeredDbIds = new Set(QUERIES.map((q) => q.queryId));

  for (const file of serviceFiles) {
    const content = fs.readFileSync(file, "utf-8");
    const relativePath = path.relative(process.cwd(), file).replace(/\\/g, "/");
    const lines = content.split("\n");

    // Check for db() calls and extract DB IDs
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Match db("DB-X-XX-XX") pattern
      const dbCallMatch = line.match(/\bdb\s*\(\s*["']([^"']+)["']\s*\)/);
      if (dbCallMatch) {
        const dbId = dbCallMatch[1];

        // Check if DB ID is registered
        if (!registeredDbIds.has(dbId)) {
          addViolation(
            relativePath,
            i + 1,
            "UNREGISTERED_DB_ID",
            `DB ID '${dbId}' is not registered in QUERIES registry.`,
            line.trim(),
          );
        }

        // Check DB ID format
        if (!/^DB-[AD]-\d{2}-\d{2}$/.test(dbId)) {
          addViolation(
            relativePath,
            i + 1,
            "INVALID_DB_ID_FORMAT",
            `DB ID '${dbId}' does not match format DB-{A|D}-##-##`,
            line.trim(),
          );
        }
      }

      // Check for direct prisma usage without db() wrapper
      if (
        /\bprisma\./.test(line) &&
        !line.includes("//") &&
        !line.includes("db(") &&
        !relativePath.includes("lib/prisma") &&
        !relativePath.includes("lib/dbContext")
      ) {
        addViolation(
          relativePath,
          i + 1,
          "DIRECT_PRISMA_ACCESS",
          "Direct prisma access without db() wrapper bypasses trace logging.",
          line.trim(),
        );
      }
    }
  }
}

async function main(): Promise<void> {
  console.log("🚀 Registry and Route Validation\n");
  console.log("=".repeat(70) + "\n");

  await checkRouteHandlers();
  await checkRegistryIntegrity();
  await checkDisallowedImports();
  await checkGlobalFetchUsage();
  await checkDbWrapperUsage();

  console.log("\n" + "=".repeat(70));

  // Report results
  if (violations.length === 0) {
    console.log("\n✅ All registry and route checks passed!\n");
    process.exit(0);
  }

  console.log(`\n❌ Found ${violations.length} violation(s):\n`);

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
    console.log("─".repeat(70));

    for (const v of ruleViolations) {
      console.log(`  ${v.file}${v.line ? `:${v.line}` : ""}`);
      console.log(`  └─ ${v.message}`);
      if (v.code) {
        console.log(`     Code: ${v.code.substring(0, 80)}${v.code.length > 80 ? "..." : ""}`);
      }
      console.log();
    }
  }

  console.log("\n🔧 How to fix:");
  console.log("  - ROUTE_MISSING_ENVELOPE: Wrap handlers with withEnvelope({ namespace: 'A'|'D' }, handler)");
  console.log("  - ROUTE_NOT_IN_REGISTRY: Add entry to OPERATIONS in packages/identity/src/index.ts");
  console.log("  - ROUTE_FEATURE_NOT_IN_REGISTRY: Add entry to FEATURES in packages/identity/src/index.ts");
  console.log("  - REGISTRY_DUPLICATE_*: Remove duplicate entry in registry");
  console.log("  - REGISTRY_INVALID_ID_FORMAT: Use correct format (REF-A-01, API-A-01-01, DB-A-01-01)");
  console.log("  - REGISTRY_NAMESPACE_MISMATCH: Match ID prefix with entry namespace");
  console.log("  - REGISTRY_INVALID_REFERENCE: Ensure featureId/operationId references exist");
  console.log("  - DISALLOWED_IMPORT_*: Use approved alternatives (bffClient, @/lib/prisma)");
  console.log("  - GLOBAL_FETCH_USAGE: Use adminFetch/dealerFetch from @/lib/bffClient");
  console.log("  - UNREGISTERED_DB_ID: Add entry to QUERIES in packages/identity/src/index.ts");
  console.log("  - DIRECT_PRISMA_ACCESS: Use db('DB-X-XX-XX').model.operation() pattern");
  console.log();

  process.exit(1);
}

main().catch((error) => {
  console.error("Error running registry validation:", error);
  process.exit(1);
});
