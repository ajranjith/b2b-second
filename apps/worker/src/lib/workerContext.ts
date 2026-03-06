/**
 * Worker Context for Job Execution
 *
 * This module provides context management for worker jobs, ensuring
 * trace IDs are properly carried through job payloads and restored
 * before any database operations.
 */

import { AsyncLocalStorage } from "node:async_hooks";
import {
  Envelope,
  JobPayload,
  Namespace,
  assertJobPayloadValid,
  buildEnvelope,
  newTraceId,
} from "@repo/identity";

/**
 * Worker-specific envelope that may have optional fields
 * (since workers don't always have full request context)
 */
export interface WorkerEnvelope {
  namespace: Namespace;
  traceId: string;
  sessionId?: string;
  featureId?: string;
  operationId?: string;
  jobId?: string;
}

const workerStorage = new AsyncLocalStorage<WorkerEnvelope>();

/**
 * Set the worker context using enterWith
 */
export function setWorkerContext(envelope: WorkerEnvelope): void {
  workerStorage.enterWith(envelope);
}

/**
 * Get the current worker context
 */
export function getWorkerContext(): WorkerEnvelope | undefined {
  return workerStorage.getStore();
}

/**
 * Get the current worker context, throwing if not available
 */
export function getWorkerContextOrThrow(): WorkerEnvelope {
  const ctx = workerStorage.getStore();
  if (!ctx) {
    throw new Error("WorkerContextMissing: No worker context is set for this job");
  }
  return ctx;
}

/**
 * Get the trace ID from the current worker context
 */
export function getWorkerTraceId(): string | undefined {
  return workerStorage.getStore()?.traceId;
}

/**
 * Get the trace ID from the current worker context, throwing if not available
 */
export function getWorkerTraceIdOrThrow(): string {
  const ctx = workerStorage.getStore();
  if (!ctx?.traceId) {
    throw new Error("WorkerTraceIdMissing: No trace ID is set for this job");
  }
  return ctx.traceId;
}

/**
 * Run a function with worker context from a job payload
 * Validates the payload has required trace ID before execution
 */
export function runWithJobContext<T>(payload: JobPayload, fn: () => T): T {
  // Validate job payload has required trace ID
  assertJobPayloadValid(payload);

  const envelope: WorkerEnvelope = {
    namespace: payload.ns,
    traceId: payload.tid,
    sessionId: payload.sid,
    featureId: payload.ref,
    operationId: payload.api,
  };

  return workerStorage.run(envelope, fn);
}

/**
 * Run an async function with worker context from a job payload
 */
export async function runWithJobContextAsync<T>(payload: JobPayload, fn: () => Promise<T>): Promise<T> {
  // Validate job payload has required trace ID
  assertJobPayloadValid(payload);

  const envelope: WorkerEnvelope = {
    namespace: payload.ns,
    traceId: payload.tid,
    sessionId: payload.sid,
    featureId: payload.ref,
    operationId: payload.api,
  };

  return workerStorage.run(envelope, fn);
}

/**
 * Create a job payload from the current worker context
 * Useful when spawning child jobs
 */
export function createJobPayloadFromContext(): JobPayload {
  const ctx = getWorkerContextOrThrow();
  return {
    ns: ctx.namespace,
    tid: ctx.traceId,
    sid: ctx.sessionId,
    ref: ctx.featureId,
    api: ctx.operationId,
  };
}

/**
 * Create a new job payload with a fresh trace ID for standalone jobs
 * (jobs not spawned from an existing request context)
 */
export function createStandaloneJobPayload(namespace: Namespace): JobPayload {
  return {
    ns: namespace,
    tid: newTraceId(namespace),
  };
}

/**
 * Assert that we have a valid worker context before DB operations
 * Call this at the start of any function that accesses the database
 */
export function assertWorkerContextBeforeDb(): void {
  const ctx = workerStorage.getStore();
  if (!ctx) {
    throw new Error("WorkerContextMissingBeforeDb: Cannot access database without worker context");
  }
  if (!ctx.traceId) {
    throw new Error("WorkerTraceIdMissingBeforeDb: Cannot access database without trace ID");
  }
}

/**
 * Check if we have a valid worker context
 */
export function hasWorkerContext(): boolean {
  return workerStorage.getStore() !== undefined;
}

/**
 * Get the namespace from the current worker context
 */
export function getWorkerNamespace(): Namespace | undefined {
  return workerStorage.getStore()?.namespace;
}
