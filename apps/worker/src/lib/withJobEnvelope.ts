/**
 * Job Envelope Wrapper for Workers
 *
 * This module provides the withJobEnvelope wrapper that enforces the Identity Framework
 * for background jobs and workers. It ensures:
 *
 * 1. Every job has an Identity Passport (NS + SID + REF + API + DB-ID)
 * 2. Namespace isolation is enforced
 * 3. All DB operations go through the scoped db(dbId) runner
 * 4. Full traceability in logs
 *
 * Usage:
 * ```ts
 * import { withJobEnvelope, db } from "@/lib/withJobEnvelope";
 *
 * const importDealer = withJobEnvelope(
 *   { namespace: "A", jobId: "JOB-A-IMPORT-DEALERS" },
 *   async (ctx) => {
 *     const dealers = await db("DB-A-02-01").$queryRaw`SELECT * FROM "DealerAccount"`;
 *     return { success: true, count: dealers.length };
 *   }
 * );
 *
 * // Execute the job
 * await importDealer({ file: "/path/to/file.xlsx" });
 * ```
 */

import { AsyncLocalStorage } from "node:async_hooks";
import { PrismaClient } from "@prisma/client";
import {
  Namespace,
  Envelope,
  buildEnvelope,
  newTraceId,
  newSessionId,
  isValidDb,
  isValidTid,
  isValidSid,
} from "@repo/identity";

// =============================================================================
// Types
// =============================================================================

export interface JobEnvelope extends Envelope {
  jobId: string;
  jobStartedAt: Date;
}

export interface WithJobEnvelopeOptions {
  /**
   * Namespace for this job: "A" for Admin, "D" for Dealer
   * Workers typically operate in Admin namespace
   */
  namespace: Namespace;

  /**
   * Job identifier from the JOBS registry (e.g., "JOB-A-IMPORT-DEALERS")
   */
  jobId: string;

  /**
   * Optional feature ID override. If not provided, derives from jobId
   */
  featureId?: string;

  /**
   * Optional operation ID override. If not provided, derives from jobId
   */
  operationId?: string;
}

export interface JobContext {
  envelope: JobEnvelope;
  log: JobLogger;
}

export interface JobLogger {
  info: (message: string, data?: Record<string, unknown>) => void;
  warn: (message: string, data?: Record<string, unknown>) => void;
  error: (message: string, error?: Error, data?: Record<string, unknown>) => void;
  debug: (message: string, data?: Record<string, unknown>) => void;
}

type JobHandler<TInput, TResult> = (ctx: JobContext, input: TInput) => Promise<TResult>;

// =============================================================================
// AsyncLocalStorage for Job Context
// =============================================================================

const jobStorage = new AsyncLocalStorage<JobEnvelope>();

/**
 * Get the current job envelope
 */
export function getJobContext(): JobEnvelope | undefined {
  return jobStorage.getStore();
}

/**
 * Get the current job envelope, throwing if not available
 */
export function getJobContextOrThrow(): JobEnvelope {
  const ctx = jobStorage.getStore();
  if (!ctx) {
    throw new Error("JOB_CONTEXT_MISSING: No job envelope in scope. Wrap job with withJobEnvelope().");
  }
  return ctx;
}

// =============================================================================
// DB-ID Scoped Context
// =============================================================================

const dbIdStorage = new AsyncLocalStorage<{ dbId: string }>();

/**
 * Get the current DB-ID from scoped context
 */
export function getCurrentDbId(): string | undefined {
  return dbIdStorage.getStore()?.dbId;
}

/**
 * Run a function with a DB-ID scope
 */
function runWithDbContext<T>(dbId: string, fn: () => T): T {
  return dbIdStorage.run({ dbId }, fn);
}

// =============================================================================
// Prisma Client with Enforcement
// =============================================================================

// Worker Prisma client - singleton
let workerPrisma: PrismaClient | null = null;

function getWorkerPrisma(): PrismaClient {
  if (!workerPrisma) {
    workerPrisma = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["warn", "error"],
    });

    // Add middleware for identity enforcement
    workerPrisma.$use(async (params, next) => {
      const jobEnvelope = getJobContext();
      const dbId = getCurrentDbId();

      // BLOCKER 1: Job envelope must exist
      if (!jobEnvelope) {
        throw new Error(
          "CRITICAL: No Job Envelope - job context is missing. Wrap job with withJobEnvelope()."
        );
      }

      // BLOCKER 2: DB-ID must be in scope
      if (!dbId) {
        throw new Error(
          "BLOCKER: No DB-ID in scope - use db(dbId) runner for all database operations."
        );
      }

      // BLOCKER 3: Namespace mismatch check
      const expectedPrefix = `DB-${jobEnvelope.namespace}-`;
      if (!dbId.startsWith(expectedPrefix)) {
        throw new Error(
          `ENVELOPE_MISMATCH: DB-ID '${dbId}' does not match job namespace '${jobEnvelope.namespace}'. ` +
          `Expected prefix '${expectedPrefix}'.`
        );
      }

      const start = Date.now();
      const result = await next(params);
      const durationMs = Date.now() - start;

      // Audit log with full identity passport
      console.info("[DB_TRACE]", JSON.stringify({
        ns: jobEnvelope.namespace,
        tid: jobEnvelope.traceId,
        sid: jobEnvelope.sessionId,
        ref: jobEnvelope.featureId,
        api: jobEnvelope.operationId,
        jobId: jobEnvelope.jobId,
        dbId,
        model: params.model ?? "raw",
        action: params.action,
        durationMs,
        timestamp: new Date().toISOString(),
      }));

      return result;
    });
  }

  return workerPrisma;
}

// =============================================================================
// DB Scoped Runner
// =============================================================================

// Cache for proxied clients
const proxyCache = new Map<string, PrismaClient>();

function wrapValue(value: unknown, dbId: string, cache: WeakMap<object, object>, parent: object): unknown {
  if (typeof value === "function") {
    // Wrap function calls to maintain dbId context through async operations
    // The async wrapper ensures Prisma's lazy promises resolve within the context
    return (...args: unknown[]) =>
      runWithDbContext(dbId, async () => {
        const result = (value as (...args: unknown[]) => unknown).apply(parent, args);
        // Await any promise/thenable to ensure context is maintained
        return result;
      });
  }

  if (typeof value === "object" && value !== null) {
    if (cache.has(value)) {
      return cache.get(value);
    }
    const proxy = new Proxy(value, createHandler(dbId, cache));
    cache.set(value, proxy);
    return proxy;
  }

  return value;
}

function createHandler(dbId: string, cache: WeakMap<object, object>): ProxyHandler<object> {
  return {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      return wrapValue(value, dbId, cache, target);
    },
  };
}

function createProxy(target: PrismaClient, dbId: string): PrismaClient {
  const cache = new WeakMap<object, object>();
  const proxy = new Proxy(target, createHandler(dbId, cache));
  cache.set(target, proxy);
  return proxy as PrismaClient;
}

/**
 * Get a scoped Prisma client for the given DB-ID
 *
 * This is the ONLY way to access the database in workers.
 * Each operation must specify its registered DB-ID.
 *
 * @example
 * const dealers = await db("DB-A-02-01").dealerAccount.findMany();
 * const users = await db("DB-A-02-02").$queryRaw`SELECT * FROM "DealerUser"`;
 */
export function db(dbId: string): PrismaClient {
  // Validate DB-ID format
  if (!dbId || !isValidDb(dbId)) {
    throw new Error(`InvalidDbId: Provide a valid DB-A-* or DB-D-* identifier. Received: '${dbId}'`);
  }

  // Validate namespace matches job context
  const jobEnvelope = getJobContext();
  if (jobEnvelope) {
    const expectedPrefix = `DB-${jobEnvelope.namespace}-`;
    if (!dbId.startsWith(expectedPrefix)) {
      throw new Error(
        `DB_NAMESPACE_MISMATCH: DB-ID '${dbId}' does not match job namespace '${jobEnvelope.namespace}'`
      );
    }
  }

  // Return cached proxy or create new one
  if (proxyCache.has(dbId)) {
    return proxyCache.get(dbId)!;
  }

  const proxied = createProxy(getWorkerPrisma(), dbId);
  proxyCache.set(dbId, proxied);
  return proxied;
}

// =============================================================================
// Job Logger
// =============================================================================

function createJobLogger(envelope: JobEnvelope): JobLogger {
  const baseContext = {
    ns: envelope.namespace,
    tid: envelope.traceId,
    sid: envelope.sessionId,
    ref: envelope.featureId,
    api: envelope.operationId,
    jobId: envelope.jobId,
  };

  return {
    info: (message: string, data?: Record<string, unknown>) => {
      console.log(JSON.stringify({
        level: "info",
        message,
        ...baseContext,
        ...data,
        timestamp: new Date().toISOString(),
      }));
    },
    warn: (message: string, data?: Record<string, unknown>) => {
      console.warn(JSON.stringify({
        level: "warn",
        message,
        ...baseContext,
        ...data,
        timestamp: new Date().toISOString(),
      }));
    },
    error: (message: string, error?: Error, data?: Record<string, unknown>) => {
      console.error(JSON.stringify({
        level: "error",
        message,
        error: error?.message,
        stack: error?.stack,
        ...baseContext,
        ...data,
        timestamp: new Date().toISOString(),
      }));
    },
    debug: (message: string, data?: Record<string, unknown>) => {
      if (process.env.NODE_ENV === "development") {
        console.log(JSON.stringify({
          level: "debug",
          message,
          ...baseContext,
          ...data,
          timestamp: new Date().toISOString(),
        }));
      }
    },
  };
}

// =============================================================================
// withJobEnvelope Wrapper
// =============================================================================

/**
 * Wrap a job handler with identity envelope enforcement
 *
 * This wrapper:
 * 1. Creates a job envelope with trace ID and session ID
 * 2. Sets up AsyncLocalStorage context
 * 3. Provides scoped db() access
 * 4. Logs job start/end with full identity passport
 *
 * @example
 * const importDealer = withJobEnvelope(
 *   { namespace: "A", jobId: "JOB-A-IMPORT-DEALERS" },
 *   async (ctx, input: { file: string }) => {
 *     ctx.log.info("Starting import", { file: input.file });
 *     const dealers = await db("DB-A-02-01").dealerAccount.findMany();
 *     return { success: true, count: dealers.length };
 *   }
 * );
 */
export function withJobEnvelope<TInput, TResult>(
  options: WithJobEnvelopeOptions,
  handler: JobHandler<TInput, TResult>
): (input: TInput) => Promise<TResult> {
  const { namespace, jobId, featureId, operationId } = options;

  // Derive feature/operation IDs from jobId if not provided
  // JOB-A-IMPORT-DEALERS -> REF-A-IMPORT, API-A-IMPORT-DEALERS
  const derivedFeatureId = featureId ?? `REF-${namespace}-JOB`;
  const derivedOperationId = operationId ?? `API-${namespace}-${jobId.replace(`JOB-${namespace}-`, "")}`;

  return async function wrappedJob(input: TInput): Promise<TResult> {
    // Create job envelope
    const traceId = newTraceId(namespace);
    const sessionId = newSessionId(namespace);

    const envelope: JobEnvelope = {
      ...buildEnvelope({
        namespace,
        traceId,
        sessionId,
        featureId: derivedFeatureId,
        operationId: derivedOperationId,
        method: "JOB",
        path: jobId,
      }),
      jobId,
      jobStartedAt: new Date(),
    };

    const log = createJobLogger(envelope);

    // Log job start
    log.info("Job started", {
      input: typeof input === "object" ? JSON.stringify(input) : String(input),
    });

    const startTime = Date.now();

    try {
      // Run handler within AsyncLocalStorage context
      const result = await jobStorage.run(envelope, async () => {
        return handler({ envelope, log }, input);
      });

      const durationMs = Date.now() - startTime;
      log.info("Job completed successfully", { durationMs });

      return result;
    } catch (error) {
      const durationMs = Date.now() - startTime;
      log.error("Job failed", error as Error, { durationMs });
      throw error;
    }
  };
}

// =============================================================================
// Standalone Job Execution
// =============================================================================

/**
 * Execute a one-off job with identity envelope
 *
 * Use this for simple scripts that need database access.
 *
 * @example
 * await runJob({ namespace: "A", jobId: "JOB-A-CLEANUP" }, async (ctx) => {
 *   const deleted = await db("DB-A-99-01").$executeRaw`DELETE FROM "TempData"`;
 *   ctx.log.info("Cleanup complete", { deleted });
 * });
 */
export async function runJob<T>(
  options: WithJobEnvelopeOptions,
  handler: (ctx: JobContext) => Promise<T>
): Promise<T> {
  const wrappedHandler = withJobEnvelope<void, T>(options, async (ctx) => handler(ctx));
  return wrappedHandler(undefined as void);
}

// =============================================================================
// Cleanup
// =============================================================================

/**
 * Disconnect the worker Prisma client
 * Call this when shutting down the worker
 */
export async function disconnectWorkerPrisma(): Promise<void> {
  if (workerPrisma) {
    await workerPrisma.$disconnect();
    workerPrisma = null;
    proxyCache.clear();
  }
}
