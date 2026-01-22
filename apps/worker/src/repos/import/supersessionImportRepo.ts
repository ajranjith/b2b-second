import { db } from "../../lib/prisma";
import { QUERIES } from "@repo/identity";

export async function listValidSupersessionRows(batchId: string) {
  return db(QUERIES.IMPORT_STAGING_ROWS_INSERT, (p) =>
    p.stgSupersessionRow.findMany({
      where: { batchId, isValid: true },
    }),
  );
}

export async function upsertSupersessionLink(row: any): Promise<void> {
  await db(QUERIES.IMPORT_SUPERSESSIONS_UPSERT, (p) =>
    p.supersession.upsert({
      where: {
        originalPartCode_replacementPartCode: {
          originalPartCode: row.originalPartCode!,
          replacementPartCode: row.replacementPartCode!,
        },
      },
      update: {
        note: row.note ?? null,
      },
      create: {
        originalPartCode: row.originalPartCode!,
        replacementPartCode: row.replacementPartCode!,
        note: row.note ?? null,
      },
    }),
  );
}

export async function listAllSupersessions() {
  return db(QUERIES.IMPORT_SUPERSESSIONS_UPSERT, (p) =>
    p.supersession.findMany({
      orderBy: { originalPartCode: "asc" },
    }),
  );
}

export async function clearSupersessionResolved(): Promise<void> {
  await db(QUERIES.IMPORT_SUPERSESSIONS_UPSERT, (p) => p.supersessionResolved.deleteMany({}));
}

export async function createSupersessionResolved(data: {
  originalPartNo: string;
  latestPartNo: string;
  depth: number;
  sourceBatchId: string;
}): Promise<void> {
  await db(QUERIES.IMPORT_SUPERSESSIONS_UPSERT, (p) =>
    p.supersessionResolved.create({ data }),
  );
}

export async function findResolvedSupersession(originalPartNo: string) {
  return db(QUERIES.IMPORT_SUPERSESSIONS_UPSERT, (p) =>
    p.supersessionResolved.findFirst({
      where: { originalPartNo },
    }),
  );
}

export async function listAllSupersessionLinks() {
  return db(QUERIES.IMPORT_SUPERSESSIONS_UPSERT, (p) => p.supersession.findMany());
}
