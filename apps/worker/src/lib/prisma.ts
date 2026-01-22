import { AsyncLocalStorage } from "node:async_hooks";
import { PrismaClient, Prisma, ImportBatch, ImportStatus, ImportType, PartType } from "@prisma/client";
import { getJobContext } from "./withJobEnvelope";
import { isValidDb } from "@repo/identity";

const dbStorage = new AsyncLocalStorage<{ dbId: string }>();

let workerPrisma: PrismaClient | null = null;

function getWorkerPrisma(): PrismaClient {
  if (!workerPrisma) {
    workerPrisma = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["warn", "error"],
    });

    workerPrisma.$use(async (params, next) => {
      const jobEnvelope = getJobContext();
      const dbId = dbStorage.getStore()?.dbId;

      if (!jobEnvelope) {
        throw new Error(
          "CRITICAL: No Job Envelope - job context is missing. Wrap job with withJobEnvelope().",
        );
      }

      if (!dbId) {
        throw new Error(
          "BLOCKER: No DB-ID in scope - use db(dbId, fn) runner for all database operations.",
        );
      }

      const expectedPrefix = `DB-${jobEnvelope.namespace}-`;
      if (!dbId.startsWith(expectedPrefix)) {
        throw new Error(
          `ENVELOPE_MISMATCH: DB-ID '${dbId}' does not match job namespace '${jobEnvelope.namespace}'. ` +
            `Expected prefix '${expectedPrefix}'.`,
        );
      }

      const start = Date.now();
      const result = await next(params);
      const durationMs = Date.now() - start;

      console.info(
        "[DB_TRACE]",
        JSON.stringify({
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
        }),
      );

      return result;
    });
  }

  return workerPrisma;
}

export async function db<T>(dbId: string, fn: (client: PrismaClient) => Promise<T>): Promise<T> {
  if (!dbId || !isValidDb(dbId)) {
    throw new Error(`InvalidDbId: Provide a valid DB-A-* or DB-D-* identifier. Received: '${dbId}'`);
  }

  return dbStorage.run({ dbId }, () => fn(getWorkerPrisma()));
}

export async function disconnectWorkerPrisma(): Promise<void> {
  if (workerPrisma) {
    await workerPrisma.$disconnect();
    workerPrisma = null;
  }
}

export type { Prisma, ImportBatch };
export { ImportStatus, ImportType, PartType };
