import { db, ImportBatch, ImportStatus, ImportType } from "../../lib/prisma";
import { QUERIES } from "@repo/identity";

export async function createImportBatch(
  importType: ImportType,
  fileName: string,
  fileHash: string,
  filePath?: string,
): Promise<ImportBatch> {
  return db(QUERIES.IMPORT_BATCH_CREATE, (p) =>
    p.importBatch.create({
      data: {
        importType,
        fileName,
        fileHash,
        filePath,
        status: ImportStatus.PROCESSING,
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
      },
    }),
  );
}

export async function updateImportBatch(
  batchId: string,
  data: {
    totalRows?: number;
    validRows?: number;
    invalidRows?: number;
    status?: ImportStatus;
    completedAt?: Date;
  },
): Promise<void> {
  await db(QUERIES.IMPORT_BATCH_STATUS_UPDATE, (p) =>
    p.importBatch.update({
      where: { id: batchId },
      data,
    }),
  );
}
