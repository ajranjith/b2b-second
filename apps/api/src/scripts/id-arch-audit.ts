#!/usr/bin/env tsx
/**
 * ID Architecture Audit Script
 *
 * Windows-friendly audit that validates ID Architecture implementation:
 * 1. All route handlers are guarded by withEnvelope (or explicitly exempted)
 * 2. No forbidden @prisma/client imports outside lib/prisma.ts
 * 3. No direct prisma.* usage outside the db(dbId, fn) pathway
 * 4. No bypass network calls (fetch/axios) outside approved wrappers
 * 5. TS registries (FEATURES/OPERATIONS/QUERIES) exist and are referenced
 *
 * Usage: pnpm id:audit
 */

import * as fs from "fs";
import * as path from "path";

// ============================================================
// Configuration
// ============================================================

const PROJECT_ROOT = path.resolve(__dirname, "../../../../");

interface AuditConfig {
  // Directories to scan for route handlers
  routeDirs: string[];
  // Directories to scan for source files
  sourceDirs: string[];
  // Files allowed to import @prisma/client directly
  prismaImportAllowlist: string[];
  // Files allowed to use prisma.* directly
  prismaUsageAllowlist: string[];
  // Files allowed to use fetch/axios directly
  networkCallAllowlist: string[];
  // Route files exempt from withEnvelope requirement
  routeExemptions: string[];
}

const config: AuditConfig = {
  routeDirs: [
    "apps/api/app/api/bff/v1",
  ],
  sourceDirs: [
    "apps/api/app",
    "apps/api/src",
    "apps/worker/src",
    "packages/shared/src",
    "packages/domain-pricing/src",
    "packages/domain-partners/src",
    "packages/rules/src",
  ],
  prismaImportAllowlist: [
    "lib/prisma.ts",
    "lib/dbContext.ts",
    "lib/withJobEnvelope.ts",
    "lib/workerPrisma.ts",
    "examples/", // Example files may import for demonstration
    // Domain packages use PrismaClient via DI - migration to db() pattern pending
    "packages/shared/src/services/",
    "packages/shared/src/email.ts",
    "packages/domain-pricing/",
    "packages/domain-partners/",
    "packages/rules/",
  ],
  prismaUsageAllowlist: [
    "lib/prisma.ts",
    "lib/dbContext.ts",
    "lib/withJobEnvelope.ts",
    "lib/workerPrisma.ts",
    // Domain packages use PrismaClient via DI - migration to db() pattern pending
    "packages/shared/src/services/",
    "packages/shared/src/email.ts",
    "packages/domain-pricing/",
    "packages/domain-partners/",
    "packages/rules/",
  ],
  networkCallAllowlist: [
    "lib/bffClient.ts",
    "lib/apiClient.ts",
    "lib/httpClient.ts",
  ],
  routeExemptions: [
    // Auth routes may have special handling
    "api/auth/",
    // Health check endpoints
    "api/health",
  ],
};

// ============================================================
// Types
// ============================================================

interface Violation {
  file: string;
  line: number;
  rule: string;
  message: string;
  code?: string;
  severity: "error" | "warning";
}

interface AuditResult {
  violations: Violation[];
  stats: {
    filesScanned: number;
    routeFilesScanned: number;
    routesWithEnvelope: number;
    routesWithoutEnvelope: number;
    prismaImportViolations: number;
    prismaUsageViolations: number;
    networkViolations: number;
    registryChecks: {
      featuresExists: boolean;
      operationsExists: boolean;
      queriesExists: boolean;
      featuresReferenced: boolean;
      operationsReferenced: boolean;
      queriesReferenced: boolean;
    };
  };
}

// ============================================================
// Utility Functions
// ============================================================

/**
 * Recursively find all files matching a pattern using Node fs (no bash)
 */
function findFiles(dir: string, pattern: RegExp, results: string[] = []): string[] {
  if (!fs.existsSync(dir)) {
    return results;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    // Skip node_modules and hidden directories
    if (entry.name === "node_modules" || entry.name.startsWith(".")) {
      continue;
    }

    if (entry.isDirectory()) {
      findFiles(fullPath, pattern, results);
    } else if (entry.isFile() && pattern.test(entry.name)) {
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * Find route.ts files specifically
 */
function findRouteFiles(baseDir: string): string[] {
  return findFiles(baseDir, /^route\.ts$/);
}

/**
 * Find all TypeScript/JavaScript files
 */
function findSourceFiles(baseDir: string): string[] {
  return findFiles(baseDir, /\.(ts|tsx|js|jsx)$/);
}

/**
 * Check if a file path matches any pattern in the allowlist
 */
function isAllowlisted(filePath: string, allowlist: string[]): boolean {
  const normalizedPath = filePath.replace(/\\/g, "/");
  return allowlist.some((pattern) => normalizedPath.includes(pattern));
}

/**
 * Read file content safely
 */
function readFileSafe(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}

// ============================================================
// Audit Checks
// ============================================================

/**
 * Check if route files use withEnvelope wrapper
 */
function auditRouteEnvelopes(result: AuditResult): void {
  console.log("\n[1/5] Checking route handlers for withEnvelope...\n");

  for (const routeDir of config.routeDirs) {
    const fullPath = path.join(PROJECT_ROOT, routeDir);
    const routeFiles = findRouteFiles(fullPath);

    for (const file of routeFiles) {
      result.stats.routeFilesScanned++;
      const relativePath = path.relative(PROJECT_ROOT, file).replace(/\\/g, "/");

      // Check if exempt
      if (config.routeExemptions.some((ex) => relativePath.includes(ex))) {
        console.log(`  EXEMPT: ${relativePath}`);
        continue;
      }

      const content = readFileSafe(file);
      if (!content) continue;

      // Check for HTTP method exports
      const hasGet = /export\s+(const|async\s+function)\s+GET\b/m.test(content);
      const hasPost = /export\s+(const|async\s+function)\s+POST\b/m.test(content);
      const hasPut = /export\s+(const|async\s+function)\s+PUT\b/m.test(content);
      const hasPatch = /export\s+(const|async\s+function)\s+PATCH\b/m.test(content);
      const hasDelete = /export\s+(const|async\s+function)\s+DELETE\b/m.test(content);

      const hasHttpMethods = hasGet || hasPost || hasPut || hasPatch || hasDelete;

      if (!hasHttpMethods) {
        continue; // Not a route handler
      }

      // Check for withEnvelope usage
      const usesEnvelope = content.includes("withEnvelope");

      if (usesEnvelope) {
        result.stats.routesWithEnvelope++;
        console.log(`  OK: ${relativePath}`);
      } else {
        result.stats.routesWithoutEnvelope++;
        result.violations.push({
          file: relativePath,
          line: 1,
          rule: "ROUTE_MISSING_ENVELOPE",
          message: "Route handler exports HTTP methods but does not use withEnvelope wrapper",
          severity: "error",
        });
        console.log(`  VIOLATION: ${relativePath} - missing withEnvelope`);
      }
    }
  }
}

/**
 * Check for forbidden @prisma/client imports
 */
function auditPrismaImports(result: AuditResult): void {
  console.log("\n[2/5] Checking for forbidden @prisma/client imports...\n");

  for (const sourceDir of config.sourceDirs) {
    const fullPath = path.join(PROJECT_ROOT, sourceDir);
    const sourceFiles = findSourceFiles(fullPath);

    for (const file of sourceFiles) {
      const relativePath = path.relative(PROJECT_ROOT, file).replace(/\\/g, "/");

      // Skip test files
      if (relativePath.includes(".test.") || relativePath.includes(".spec.")) {
        continue;
      }

      // Skip allowlisted files
      if (isAllowlisted(relativePath, config.prismaImportAllowlist)) {
        continue;
      }

      const content = readFileSafe(file);
      if (!content) continue;

      result.stats.filesScanned++;

      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check for @prisma/client import
        if (/import\s+.*\s+from\s+['"]@prisma\/client['"]/.test(line)) {
          result.stats.prismaImportViolations++;
          result.violations.push({
            file: relativePath,
            line: i + 1,
            rule: "FORBIDDEN_PRISMA_IMPORT",
            message: "Direct @prisma/client import bypasses trace logging. Import from @/lib/prisma instead.",
            code: line.trim(),
            severity: "error",
          });
          console.log(`  VIOLATION: ${relativePath}:${i + 1} - direct @prisma/client import`);
        }
      }
    }
  }

  if (result.stats.prismaImportViolations === 0) {
    console.log("  OK: No forbidden @prisma/client imports found");
  }
}

/**
 * Check for direct prisma.* usage outside db() wrapper
 */
function auditPrismaUsage(result: AuditResult): void {
  console.log("\n[3/5] Checking for direct prisma.* usage outside db() wrapper...\n");

  for (const sourceDir of config.sourceDirs) {
    const fullPath = path.join(PROJECT_ROOT, sourceDir);
    const sourceFiles = findSourceFiles(fullPath);

    for (const file of sourceFiles) {
      const relativePath = path.relative(PROJECT_ROOT, file).replace(/\\/g, "/");

      // Skip test files
      if (relativePath.includes(".test.") || relativePath.includes(".spec.")) {
        continue;
      }

      // Skip allowlisted files
      if (isAllowlisted(relativePath, config.prismaUsageAllowlist)) {
        continue;
      }

      const content = readFileSafe(file);
      if (!content) continue;

      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Skip comments
        if (line.trim().startsWith("//") || line.trim().startsWith("*")) {
          continue;
        }

        // Check for direct prisma.modelName usage (e.g., prisma.user, prisma.order)
        // But not inside db() callback or inside a comment
        if (/\bprisma\.[a-zA-Z]+\s*[.(]/.test(line) && !line.includes("db(") && !line.includes("//")) {
          result.stats.prismaUsageViolations++;
          result.violations.push({
            file: relativePath,
            line: i + 1,
            rule: "DIRECT_PRISMA_USAGE",
            message: "Direct prisma.* usage bypasses DB-ID tracing. Use db(dbId, fn) wrapper pattern.",
            code: line.trim(),
            severity: "error",
          });
          console.log(`  VIOLATION: ${relativePath}:${i + 1} - direct prisma usage`);
        }
      }
    }
  }

  if (result.stats.prismaUsageViolations === 0) {
    console.log("  OK: No direct prisma.* usage found outside allowed files");
  }
}

/**
 * Check for bypass network calls (fetch/axios) outside approved wrappers
 */
function auditNetworkCalls(result: AuditResult): void {
  console.log("\n[4/5] Checking for bypass network calls (fetch/axios)...\n");

  for (const sourceDir of config.sourceDirs) {
    const fullPath = path.join(PROJECT_ROOT, sourceDir);
    const sourceFiles = findSourceFiles(fullPath);

    for (const file of sourceFiles) {
      const relativePath = path.relative(PROJECT_ROOT, file).replace(/\\/g, "/");

      // Skip test files
      if (relativePath.includes(".test.") || relativePath.includes(".spec.")) {
        continue;
      }

      // Skip allowlisted files
      if (isAllowlisted(relativePath, config.networkCallAllowlist)) {
        continue;
      }

      const content = readFileSafe(file);
      if (!content) continue;

      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Skip comments
        if (line.trim().startsWith("//") || line.trim().startsWith("*")) {
          continue;
        }

        // Check for axios import
        if (/import\s+.*\s+from\s+['"]axios['"]/.test(line)) {
          result.stats.networkViolations++;
          result.violations.push({
            file: relativePath,
            line: i + 1,
            rule: "FORBIDDEN_AXIOS_IMPORT",
            message: "Direct axios import bypasses trace headers. Use bffClient from @/lib/bffClient.",
            code: line.trim(),
            severity: "error",
          });
          console.log(`  VIOLATION: ${relativePath}:${i + 1} - direct axios import`);
        }

        // Check for node-fetch import
        if (/import\s+.*\s+from\s+['"]node-fetch['"]/.test(line)) {
          result.stats.networkViolations++;
          result.violations.push({
            file: relativePath,
            line: i + 1,
            rule: "FORBIDDEN_NODE_FETCH_IMPORT",
            message: "Direct node-fetch import bypasses trace headers. Use bffClient from @/lib/bffClient.",
            code: line.trim(),
            severity: "error",
          });
          console.log(`  VIOLATION: ${relativePath}:${i + 1} - direct node-fetch import`);
        }

        // Check for global fetch usage in route handlers/services (internal calls)
        if (
          /\bfetch\s*\(/.test(line) &&
          !line.includes("bffClient") &&
          !line.includes("adminFetch") &&
          !line.includes("dealerFetch") &&
          (line.includes("/api/") || line.includes("localhost") || line.includes("INTERNAL"))
        ) {
          result.stats.networkViolations++;
          result.violations.push({
            file: relativePath,
            line: i + 1,
            rule: "GLOBAL_FETCH_INTERNAL_CALL",
            message: "Global fetch for internal API calls bypasses trace context. Use bffClient.",
            code: line.trim(),
            severity: "warning",
          });
          console.log(`  WARNING: ${relativePath}:${i + 1} - global fetch for internal call`);
        }
      }
    }
  }

  if (result.stats.networkViolations === 0) {
    console.log("  OK: No forbidden network call patterns found");
  }
}

/**
 * Check that TS registries exist and are referenced
 */
function auditRegistries(result: AuditResult): void {
  console.log("\n[5/5] Checking TS registries (FEATURES/OPERATIONS/QUERIES)...\n");

  const identityIndexPath = path.join(PROJECT_ROOT, "packages/identity/src/index.ts");
  const queriesPath = path.join(PROJECT_ROOT, "packages/identity/src/registries/queries.ts");

  // Check if registry files exist
  result.stats.registryChecks.featuresExists = fs.existsSync(identityIndexPath);
  result.stats.registryChecks.operationsExists = fs.existsSync(identityIndexPath);
  result.stats.registryChecks.queriesExists = fs.existsSync(queriesPath);

  if (!result.stats.registryChecks.featuresExists) {
    result.violations.push({
      file: "packages/identity/src/index.ts",
      line: 0,
      rule: "REGISTRY_MISSING",
      message: "FEATURES registry file does not exist",
      severity: "error",
    });
  }

  if (!result.stats.registryChecks.queriesExists) {
    result.violations.push({
      file: "packages/identity/src/registries/queries.ts",
      line: 0,
      rule: "REGISTRY_MISSING",
      message: "QUERIES registry file does not exist",
      severity: "error",
    });
  }

  // Check registry content
  const identityContent = readFileSafe(identityIndexPath);
  const queriesContent = readFileSafe(queriesPath);

  if (identityContent) {
    // Check FEATURES export
    if (/export\s+const\s+FEATURES\s*[=:]/.test(identityContent)) {
      console.log("  OK: FEATURES registry exists");
    } else {
      result.violations.push({
        file: "packages/identity/src/index.ts",
        line: 0,
        rule: "REGISTRY_NOT_EXPORTED",
        message: "FEATURES is not exported from identity package",
        severity: "error",
      });
    }

    // Check OPERATIONS export
    if (/export\s+const\s+OPERATIONS\s*[=:]/.test(identityContent)) {
      console.log("  OK: OPERATIONS registry exists");
    } else {
      result.violations.push({
        file: "packages/identity/src/index.ts",
        line: 0,
        rule: "REGISTRY_NOT_EXPORTED",
        message: "OPERATIONS is not exported from identity package",
        severity: "error",
      });
    }
  }

  if (queriesContent) {
    // Check QUERIES export
    if (/export\s+const\s+QUERIES\s*=/.test(queriesContent)) {
      console.log("  OK: QUERIES registry exists");
    } else {
      result.violations.push({
        file: "packages/identity/src/registries/queries.ts",
        line: 0,
        rule: "REGISTRY_NOT_EXPORTED",
        message: "QUERIES is not exported from queries registry",
        severity: "error",
      });
    }
  }

  // Check if registries are actually referenced in route handlers
  let featuresReferenced = false;
  let operationsReferenced = false;
  let queriesReferenced = false;

  for (const routeDir of config.routeDirs) {
    const fullPath = path.join(PROJECT_ROOT, routeDir);
    const routeFiles = findRouteFiles(fullPath);

    for (const file of routeFiles) {
      const content = readFileSafe(file);
      if (!content) continue;

      // Check for registry usage - either direct or via resolver functions
      if (content.includes("FEATURES") || content.includes("resolveFeatureId")) {
        featuresReferenced = true;
      }
      if (content.includes("OPERATIONS") || content.includes("resolveOperationId")) {
        operationsReferenced = true;
      }
      if (content.includes("QUERIES")) {
        queriesReferenced = true;
      }
      // withEnvelope internally uses the registries
      if (content.includes("withEnvelope")) {
        featuresReferenced = true;
        operationsReferenced = true;
      }
    }
  }

  // Also check services/repositories for QUERIES usage
  for (const sourceDir of config.sourceDirs) {
    const fullPath = path.join(PROJECT_ROOT, sourceDir);
    if (!fs.existsSync(fullPath)) continue;

    const sourceFiles = findSourceFiles(fullPath);
    for (const file of sourceFiles) {
      const content = readFileSafe(file);
      if (!content) continue;

      if (content.includes("QUERIES") && content.includes("@repo/identity")) {
        queriesReferenced = true;
      }
    }
  }

  result.stats.registryChecks.featuresReferenced = featuresReferenced;
  result.stats.registryChecks.operationsReferenced = operationsReferenced;
  result.stats.registryChecks.queriesReferenced = queriesReferenced;

  if (!featuresReferenced) {
    result.violations.push({
      file: "packages/identity",
      line: 0,
      rule: "REGISTRY_NOT_REFERENCED",
      message: "FEATURES registry is not referenced in route handlers",
      severity: "warning",
    });
    console.log("  WARNING: FEATURES registry is not referenced in route handlers");
  } else {
    console.log("  OK: FEATURES registry is referenced");
  }

  if (!operationsReferenced) {
    result.violations.push({
      file: "packages/identity",
      line: 0,
      rule: "REGISTRY_NOT_REFERENCED",
      message: "OPERATIONS registry is not referenced in route handlers",
      severity: "warning",
    });
    console.log("  WARNING: OPERATIONS registry is not referenced in route handlers");
  } else {
    console.log("  OK: OPERATIONS registry is referenced");
  }

  if (!queriesReferenced) {
    result.violations.push({
      file: "packages/identity",
      line: 0,
      rule: "REGISTRY_NOT_REFERENCED",
      message: "QUERIES registry is not referenced in services/repositories",
      severity: "warning",
    });
    console.log("  WARNING: QUERIES registry is not referenced");
  } else {
    console.log("  OK: QUERIES registry is referenced");
  }
}

// ============================================================
// Main Execution
// ============================================================

function printBanner(): void {
  console.log("\n" + "=".repeat(70));
  console.log("ID Architecture Audit");
  console.log("=".repeat(70));
}

function printSummary(result: AuditResult): void {
  console.log("\n" + "=".repeat(70));
  console.log("AUDIT SUMMARY");
  console.log("=".repeat(70));

  console.log("\nStatistics:");
  console.log(`  Files scanned: ${result.stats.filesScanned}`);
  console.log(`  Route files scanned: ${result.stats.routeFilesScanned}`);
  console.log(`  Routes with withEnvelope: ${result.stats.routesWithEnvelope}`);
  console.log(`  Routes without withEnvelope: ${result.stats.routesWithoutEnvelope}`);

  const errors = result.violations.filter((v) => v.severity === "error");
  const warnings = result.violations.filter((v) => v.severity === "warning");

  if (result.violations.length === 0) {
    console.log("\n" + "=".repeat(70));
    console.log("RESULT: PASS - All ID Architecture checks passed!");
    console.log("=".repeat(70) + "\n");
  } else {
    console.log("\n" + "-".repeat(70));
    console.log(`VIOLATIONS: ${errors.length} error(s), ${warnings.length} warning(s)`);
    console.log("-".repeat(70));

    // Group by rule
    const byRule: Record<string, Violation[]> = {};
    for (const v of result.violations) {
      if (!byRule[v.rule]) byRule[v.rule] = [];
      byRule[v.rule].push(v);
    }

    for (const [rule, violations] of Object.entries(byRule)) {
      const severity = violations[0].severity.toUpperCase();
      console.log(`\n[${severity}] ${rule} (${violations.length})`);
      for (const v of violations.slice(0, 5)) {
        console.log(`  - ${v.file}${v.line ? `:${v.line}` : ""}`);
        console.log(`    ${v.message}`);
        if (v.code) {
          console.log(`    Code: ${v.code.substring(0, 60)}${v.code.length > 60 ? "..." : ""}`);
        }
      }
      if (violations.length > 5) {
        console.log(`  ... and ${violations.length - 5} more`);
      }
    }

    console.log("\n" + "=".repeat(70));
    if (errors.length > 0) {
      console.log("RESULT: FAIL - ID Architecture audit found errors");
    } else {
      console.log("RESULT: PASS (with warnings) - No blocking errors, but warnings should be reviewed");
    }
    console.log("=".repeat(70) + "\n");
  }
}

async function main(): Promise<void> {
  printBanner();

  const result: AuditResult = {
    violations: [],
    stats: {
      filesScanned: 0,
      routeFilesScanned: 0,
      routesWithEnvelope: 0,
      routesWithoutEnvelope: 0,
      prismaImportViolations: 0,
      prismaUsageViolations: 0,
      networkViolations: 0,
      registryChecks: {
        featuresExists: false,
        operationsExists: false,
        queriesExists: false,
        featuresReferenced: false,
        operationsReferenced: false,
        queriesReferenced: false,
      },
    },
  };

  // Run all audit checks
  auditRouteEnvelopes(result);
  auditPrismaImports(result);
  auditPrismaUsage(result);
  auditNetworkCalls(result);
  auditRegistries(result);

  // Print summary
  printSummary(result);

  // Exit with error code if there are errors
  const errors = result.violations.filter((v) => v.severity === "error");
  if (errors.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("\nFATAL ERROR:", error);
  process.exit(1);
});
