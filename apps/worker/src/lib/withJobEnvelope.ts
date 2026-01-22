/**
 * Job Envelope Wrapper for Workers
 *
 * Provides enforced identity envelope context for background jobs.
 * Database access must be performed via db(dbId, fn) from ./prisma.
 */

import { AsyncLocalStorage } from "node:async_hooks";
import { Namespace, Envelope, buildEnvelope, newTraceId, newSessionId } from "@repo/identity";
import { disconnectWorkerPrisma } from "./prisma";

export interface JobEnvelope extends Envelope {
  jobId: string;
  jobStartedAt: Date;
}

export interface WithJobEnvelopeOptions {
  namespace: Namespace;
  jobId: string;
  featureId?: string;
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

const jobStorage = new AsyncLocalStorage<JobEnvelope>();

export function getJobContext(): JobEnvelope | undefined {
  return jobStorage.getStore();
}

export function getJobContextOrThrow(): JobEnvelope {
  const ctx = jobStorage.getStore();
  if (!ctx) {
    throw new Error("JOB_CONTEXT_MISSING: No job envelope in scope. Wrap job with withJobEnvelope().");
  }
  return ctx;
}

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
      console.log(
        JSON.stringify({
          level: "info",
          message,
          ...baseContext,
          ...data,
          timestamp: new Date().toISOString(),
        }),
      );
    },
    warn: (message: string, data?: Record<string, unknown>) => {
      console.warn(
        JSON.stringify({
          level: "warn",
          message,
          ...baseContext,
          ...data,
          timestamp: new Date().toISOString(),
        }),
      );
    },
    error: (message: string, error?: Error, data?: Record<string, unknown>) => {
      console.error(
        JSON.stringify({
          level: "error",
          message,
          error: error?.message,
          stack: error?.stack,
          ...baseContext,
          ...data,
          timestamp: new Date().toISOString(),
        }),
      );
    },
    debug: (message: string, data?: Record<string, unknown>) => {
      if (process.env.NODE_ENV === "development") {
        console.log(
          JSON.stringify({
            level: "debug",
            message,
            ...baseContext,
            ...data,
            timestamp: new Date().toISOString(),
          }),
        );
      }
    },
  };
}

export function withJobEnvelope<TInput, TResult>(
  options: WithJobEnvelopeOptions,
  handler: JobHandler<TInput, TResult>,
): (input: TInput) => Promise<TResult> {
  const { namespace, jobId, featureId, operationId } = options;

  const derivedFeatureId = featureId ?? `REF-${namespace}-JOB`;
  const derivedOperationId = operationId ?? `API-${namespace}-${jobId.replace(`JOB-${namespace}-`, "")}`;

  return async function wrappedJob(input: TInput): Promise<TResult> {
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
    log.info("Job started", { input: typeof input === "object" ? JSON.stringify(input) : String(input) });

    const startTime = Date.now();

    try {
      const result = await jobStorage.run(envelope, async () => handler({ envelope, log }, input));
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

export async function runJob<T>(
  options: WithJobEnvelopeOptions,
  handler: (ctx: JobContext) => Promise<T>,
): Promise<T> {
  const wrappedHandler = withJobEnvelope<void, T>(options, async (ctx) => handler(ctx));
  return wrappedHandler(undefined as void);
}

export { disconnectWorkerPrisma };
