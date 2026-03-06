import { AsyncLocalStorage } from "node:async_hooks";
import { PrismaClient, Prisma, ImportBatch, ImportStatus, ImportType, PartType } from "@prisma/client";
import { getJobContext } from "./withJobEnvelope";
import { MODELS, QUERIES, type QueryDefEntry, type QueryKey, isValidDb } from "@repo/identity";

const dbStorage = new AsyncLocalStorage<{ dbId: string; allowedModels: readonly string[] }>();

let workerPrisma: PrismaClient | null = null;

function getWorkerPrisma(): PrismaClient {
  if (!workerPrisma) {
    workerPrisma = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["warn", "error"],
    });

    workerPrisma.$use(async (params, next) => {
      const jobEnvelope = getJobContext();
      const store = dbStorage.getStore();
      const dbId = store?.dbId;
      const allowedModels = store?.allowedModels ?? [];

      if (!jobEnvelope) {
        throw new Error(
          "CRITICAL: No Job Envelope - job context is missing. Wrap job with withJobEnvelope().",
        );
      }

      if (!dbId || !store) {
        throw new Error(
          "BLOCKER: No DB-ID in scope - use db(query, fn) runner for all database operations.",
        );
      }

      const expectedPrefix = `DB-${jobEnvelope.namespace}-`;
      if (!dbId.startsWith(expectedPrefix)) {
        throw new Error(
          `ENVELOPE_MISMATCH: DB-ID '${dbId}' does not match job namespace '${jobEnvelope.namespace}'. ` +
            `Expected prefix '${expectedPrefix}'.`,
        );
      }

      const modelName = params.model ?? "raw";
      if (params.model && !allowedModels.includes(params.model)) {
        throw new Error(`MODEL_MISMATCH: Query ${dbId} is not allowed to access model ${params.model}.`);
      }

      const modelId = params.model ? MODELS[params.model as keyof typeof MODELS] : "MDL-00-00";
      if (params.model && !modelId) {
        throw new Error(`REGISTRY_MISSING_MODEL_ID: No model ID for ${params.model}.`);
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
          model: modelName,
          modelId,
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

function resolveQueryDef(query: QueryKey | QueryDefEntry): QueryDefEntry {
  if (typeof query === "string") {
    return QUERIES[query];
  }
  return query;
}

export async function db<T>(query: QueryKey | QueryDefEntry, fn: (client: PrismaClient) => Promise<T>): Promise<T> {
  const def = resolveQueryDef(query);
  if (!def.id || !isValidDb(def.id)) {
    throw new Error(`InvalidDbId: Provide a valid DB-A-* or DB-D-* identifier. Received: '${def.id}'`);
  }

  return dbStorage.run({ dbId: def.id, allowedModels: def.models }, async () => {
    return await fn(getWorkerPrisma());
  });
}

export async function disconnectWorkerPrisma(): Promise<void> {
  if (workerPrisma) {
    await workerPrisma.$disconnect();
    workerPrisma = null;
  }
}

export type { Prisma, ImportBatch };
export { ImportStatus, ImportType, PartType };
