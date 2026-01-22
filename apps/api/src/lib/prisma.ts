import { PrismaClient, type Prisma } from "@prisma/client";
import { getContext } from "@/lib/runtimeContext";
import { getCurrentDbId, runWithDbContext } from "@/lib/dbContext";
import { isValidDb } from "@repo/identity";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

prisma.$use(async (params, next) => {
  const context = getContext();
  const dbId = getCurrentDbId();

  // BLOCKER 1: Envelope must exist
  if (!context) {
    throw new Error("CRITICAL: No Identity Envelope - request context is missing. Wrap handler with withEnvelope().");
  }

  // BLOCKER 2: DB-ID must be in scope
  if (!dbId) {
    throw new Error("BLOCKER: No DB-ID in scope - use db(dbId) runner for all database operations.");
  }

  // BLOCKER 3: Namespace mismatch check
  const expectedPrefix = `DB-${context.namespace}-`;
  if (!dbId.startsWith(expectedPrefix)) {
    throw new Error(
      `ENVELOPE_MISMATCH: DB-ID '${dbId}' does not match request namespace '${context.namespace}'. ` +
        `Expected prefix '${expectedPrefix}'.`,
    );
  }

  const start = Date.now();
  const result = await next(params);
  const durationMs = Date.now() - start;

  // Audit log with full identity passport
  console.info("[DB_TRACE]", JSON.stringify({
    ns: context.namespace,
    sid: context.sessionId,
    ref: context.featureId,
    api: context.operationId,
    svc: (context as PrismaContextWithService)?.serviceId ?? null,
    dbId,
    model: params.model ?? "raw",
    action: params.action,
    durationMs,
    timestamp: new Date().toISOString(),
  }));

  return result;
});

type PrismaContextWithService = {
  serviceId?: string;
};

const proxyCache = new Map<string, PrismaClient>();

function wrapValue(value: unknown, dbId: string, cache: WeakMap<object, object>, parent: object) {
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

export function ensureDbId(dbId?: string): string {
  if (!dbId || !isValidDb(dbId)) {
    throw new Error("InvalidDbId: Provide a valid DB-A-* or DB-D-* identifier before executing queries.");
  }
  return dbId;
}

export function db(dbId: string): PrismaClient {
  const validId = ensureDbId(dbId);
  if (proxyCache.has(validId)) {
    return proxyCache.get(validId)!;
  }

  const proxied = createProxy(prisma, validId);
  proxyCache.set(validId, proxied);
  return proxied;
}

export function getDbComment(dbId: string): string {
  const context = getContext();
  const svc = (context as PrismaContextWithService)?.serviceId;
  return `/* DB=${dbId} | API=${context?.operationId ?? "unknown"} | REF=${context?.featureId ?? "unknown"} | SID=${context?.sessionId ?? "unknown"} | NS=${context?.namespace ?? "unknown"}${svc ? ` | SVC=${svc}` : ""} */`;
}

export type { Prisma };
