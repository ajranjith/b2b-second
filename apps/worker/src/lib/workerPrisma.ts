/**
 * Worker Prisma utilities with trace context support
 *
 * This module provides database access utilities for workers that
 * ensure trace IDs are always included in logs and operations.
 */

import { isValidDb } from "@repo/identity";
import {
  getWorkerContext,
  getWorkerTraceId,
  getWorkerTraceIdOrThrow,
  assertWorkerContextBeforeDb,
} from "./workerContext";

/**
 * Ensure a valid DB ID is provided for the operation
 * Throws with context information if invalid
 */
export function ensureDbId(dbId?: string): string {
  if (!dbId || !isValidDb(dbId)) {
    const context = getWorkerContext();
    const tid = context?.traceId ?? "unknown";
    const message = `Missing or invalid DB ID (DB-A/DB-D) for worker operation [tid=${tid}]`;
    throw new Error(message);
  }

  return dbId;
}

/**
 * Get a SQL comment string with trace context for query logging
 * Format: /* [DB-ID:{dbId};tid={traceId};ns={namespace}] * /
 */
export function getDbComment(dbId: string): string {
  const context = getWorkerContext();
  const tid = context?.traceId ?? "unknown";
  const meta = context
    ? `tid=${tid};ns=${context.namespace};sid=${context.sessionId ?? "none"};ref=${context.featureId ?? "none"};api=${context.operationId ?? "none"}`
    : `tid=${tid};ns=unknown`;
  return `/* [DB-ID:${dbId};${meta}] */`;
}

/**
 * Get trace context for logging purposes
 * Returns a structured object suitable for JSON logging
 */
export function getDbLogContext(dbId: string): Record<string, string | undefined> {
  const context = getWorkerContext();
  return {
    dbId,
    tid: context?.traceId,
    ns: context?.namespace,
    sid: context?.sessionId,
    ref: context?.featureId,
    api: context?.operationId,
    jobId: context?.jobId,
  };
}

/**
 * Assert that we have trace context before DB operations
 * Use this at the start of service functions to enforce tracing
 */
export function assertTraceContextBeforeDb(dbId: string): void {
  const tid = getWorkerTraceId();
  if (!tid) {
    throw new Error(`WorkerTraceIdMissingBeforeDb: Cannot execute DB operation ${dbId} without trace ID`);
  }
}

/**
 * Log a DB operation with full trace context
 */
export function logDbOperation(
  dbId: string,
  operation: string,
  durationMs?: number,
  error?: Error,
): void {
  const context = getWorkerContext();
  const logEntry = {
    type: "worker_db_operation",
    dbId,
    operation,
    tid: context?.traceId ?? "unknown",
    ns: context?.namespace,
    sid: context?.sessionId,
    ref: context?.featureId,
    api: context?.operationId,
    jobId: context?.jobId,
    durationMs,
    error: error?.message,
    timestamp: new Date().toISOString(),
  };

  if (error) {
    console.error(JSON.stringify(logEntry));
  } else {
    console.log(JSON.stringify(logEntry));
  }
}

/**
 * Wrap a Prisma query with trace logging for workers
 * Usage: await withDbTrace("DB-A-01-01", () => prisma.user.findMany())
 */
export async function withDbTrace<T>(dbId: string, fn: () => Promise<T>): Promise<T> {
  assertTraceContextBeforeDb(dbId);

  const start = Date.now();
  try {
    const result = await fn();
    logDbOperation(dbId, "success", Date.now() - start);
    return result;
  } catch (error) {
    logDbOperation(dbId, "error", Date.now() - start, error as Error);
    throw error;
  }
}

/**
 * Create a logging wrapper that includes trace context
 */
export function createWorkerLogger(component: string) {
  return {
    info: (message: string, data?: Record<string, unknown>) => {
      const context = getWorkerContext();
      console.log(
        JSON.stringify({
          level: "info",
          component,
          message,
          tid: context?.traceId,
          ns: context?.namespace,
          jobId: context?.jobId,
          ...data,
          timestamp: new Date().toISOString(),
        }),
      );
    },
    warn: (message: string, data?: Record<string, unknown>) => {
      const context = getWorkerContext();
      console.warn(
        JSON.stringify({
          level: "warn",
          component,
          message,
          tid: context?.traceId,
          ns: context?.namespace,
          jobId: context?.jobId,
          ...data,
          timestamp: new Date().toISOString(),
        }),
      );
    },
    error: (message: string, error?: Error, data?: Record<string, unknown>) => {
      const context = getWorkerContext();
      console.error(
        JSON.stringify({
          level: "error",
          component,
          message,
          error: error?.message,
          stack: error?.stack,
          tid: context?.traceId,
          ns: context?.namespace,
          jobId: context?.jobId,
          ...data,
          timestamp: new Date().toISOString(),
        }),
      );
    },
  };
}
