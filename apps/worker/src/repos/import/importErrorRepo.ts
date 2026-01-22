import { db, Prisma } from "../../lib/prisma";
import { QUERIES } from "@repo/identity";

export async function createImportError(
  batchId: string,
  rowNumber: number,
  errorMessage: string,
  columnName?: string,
  errorCode?: string,
  rawRow?: unknown,
): Promise<void> {
  await db(QUERIES.IMPORT_ERRORS_LOG, (p) =>
    p.importError.create({
      data: {
        batchId,
        rowNumber,
        columnName,
        errorCode,
        errorMessage,
        rawRowJson: rawRow as Prisma.InputJsonValue | undefined,
      },
    }),
  );
}
