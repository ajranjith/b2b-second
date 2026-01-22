import { AsyncLocalStorage } from "node:async_hooks";
import type { Envelope } from "@repo/identity";

/**
 * AsyncLocalStorage-based runtime context for Next.js route handlers.
 *
 * This module provides request-scoped context that works with Node.js runtime
 * in Next.js App Router route handlers. The context is automatically propagated
 * through async operations within the same request.
 *
 * Usage:
 * ```ts
 * // In route handler
 * import { runWithContext, getContext } from "@/lib/runtimeContext";
 *
 * export async function GET(req: NextRequest) {
 *   return runWithContext(envelope, async () => {
 *     // Context is available here and in all called functions
 *     const ctx = getContext();
 *     // ... handle request
 *   });
 * }
 * ```
 */

const runtimeStorage = new AsyncLocalStorage<Envelope>();

/**
 * Sets the context for the current async execution.
 * Note: Prefer `runWithContext` for automatic cleanup.
 *
 * @param envelope - The envelope to set as context
 */
export function setContext(envelope: Envelope): void {
  runtimeStorage.enterWith(envelope);
}

/**
 * Gets the current context envelope.
 *
 * @returns The current envelope or undefined if not in a context
 */
export function getContext(): Envelope | undefined {
  return runtimeStorage.getStore();
}

/**
 * Gets the current context envelope, throwing if not available.
 *
 * @returns The current envelope
 * @throws Error if no context is set
 */
export function getContextOrThrow(): Envelope {
  const ctx = runtimeStorage.getStore();
  if (!ctx) {
    throw new Error("RuntimeContextMissing: No envelope context is set for this request");
  }
  return ctx;
}

/**
 * Runs a function with the given envelope as context.
 * The context is automatically cleaned up after the function completes.
 *
 * @param envelope - The envelope to use as context
 * @param fn - The function to run with the context
 * @returns The result of the function
 */
export function runWithContext<T>(envelope: Envelope, fn: () => T): T {
  return runtimeStorage.run(envelope, fn);
}

/**
 * Runs an async function with the given envelope as context.
 * The context is automatically cleaned up after the promise resolves/rejects.
 *
 * @param envelope - The envelope to use as context
 * @param fn - The async function to run with the context
 * @returns A promise that resolves with the function result
 */
export async function runWithContextAsync<T>(envelope: Envelope, fn: () => Promise<T>): Promise<T> {
  return runtimeStorage.run(envelope, fn);
}

/**
 * Checks if a context is currently set.
 *
 * @returns true if a context is set, false otherwise
 */
export function hasContext(): boolean {
  return runtimeStorage.getStore() !== undefined;
}

/**
 * Gets the trace ID from the current context.
 * This is the primary correlation ID for distributed tracing.
 *
 * @returns The trace ID or undefined if no context
 */
export function getTraceId(): string | undefined {
  return runtimeStorage.getStore()?.traceId;
}

/**
 * Gets the trace ID from the current context, throwing if not available.
 * Use this when trace ID is mandatory for the operation.
 *
 * @returns The trace ID
 * @throws Error if no context or trace ID is set
 */
export function getTraceIdOrThrow(): string {
  const ctx = runtimeStorage.getStore();
  if (!ctx?.traceId) {
    throw new Error("TraceIdMissing: No trace ID is set for this request");
  }
  return ctx.traceId;
}

/**
 * Gets the session ID from the current context.
 *
 * @returns The session ID or undefined if no context
 */
export function getSessionId(): string | undefined {
  return runtimeStorage.getStore()?.sessionId;
}

/**
 * Gets the namespace from the current context.
 *
 * @returns The namespace or undefined if no context
 */
export function getNamespace(): string | undefined {
  return runtimeStorage.getStore()?.namespace;
}

/**
 * Gets the operation ID from the current context.
 *
 * @returns The operation ID or undefined if no context
 */
export function getOperationId(): string | undefined {
  return runtimeStorage.getStore()?.operationId;
}

/**
 * Gets the feature ID from the current context.
 *
 * @returns The feature ID or undefined if no context
 */
export function getFeatureId(): string | undefined {
  return runtimeStorage.getStore()?.featureId;
}
