import { PrismaClient, type Prisma } from "@prisma/client";
import { getEnvelopeOrThrow, getDbIdOrThrow, runWithDbId } from "@/lib/runtimeContext";

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
  const envelope = getEnvelopeOrThrow();
  const dbId = getDbIdOrThrow();

  const expectedPrefix = `DB-${envelope.ns}-`;
  if (!dbId.startsWith(expectedPrefix)) {
    console.error("DB_SCOPE_MISMATCH", {
      ns: envelope.ns,
      sid: envelope.sid,
      dbId,
      expectedPrefix,
      path: envelope.path,
    });
    throw new Error("DB_SCOPE_MISMATCH");
  }

  const start = Date.now();
  const result = await next(params);
  const durationMs = Date.now() - start;

  console.info("[DB_TRACE]", {
    ns: envelope.ns,
    sid: envelope.sid,
    dbId,
    model: params.model ?? "raw",
    action: params.action,
    durationMs,
  });

  return result;
});

export async function db<T>(
  dbId: string,
  fn: (client: PrismaClient) => Promise<T>,
): Promise<T> {
  return runWithDbId(dbId, async () => fn(prisma));
}

export type { Prisma };
