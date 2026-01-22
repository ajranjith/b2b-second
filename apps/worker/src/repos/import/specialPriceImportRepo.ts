import { db } from "../../lib/prisma";
import { QUERIES } from "@repo/identity";

export async function listValidSpecialPriceRows(batchId: string) {
  return db(QUERIES.IMPORT_STAGING_ROWS_INSERT, (p) =>
    p.stgSpecialPriceRow.findMany({
      where: { batchId, isValid: true },
    }),
  );
}

export async function findProductByCode(productCode: string) {
  return db(QUERIES.IMPORT_SPECIAL_PRICES_UPSERT, (p) =>
    p.product.findUnique({
      where: { productCode },
    }),
  );
}

export async function findExistingSpecialPrice(params: {
  productCode: string;
  discountCode: string;
  startDate: Date;
  endDate: Date;
}) {
  const { productCode, discountCode, startDate, endDate } = params;
  return db(QUERIES.IMPORT_SPECIAL_PRICES_UPSERT, (p) =>
    p.specialPrice.findFirst({
      where: {
        productCode,
        discountCode,
        startsAt: startDate,
        endsAt: endDate,
        dealerAccountId: null,
      },
    }),
  );
}

export async function updateSpecialPrice(params: {
  id: string;
  discountPrice: number;
  description: string | null;
  batchId: string;
}) {
  const { id, discountPrice, description, batchId } = params;
  return db(QUERIES.IMPORT_SPECIAL_PRICES_UPSERT, (p) =>
    p.specialPrice.update({
      where: { id },
      data: {
        discountPrice,
        description,
        importBatchId: batchId,
        source: "IMPORT",
        sourceBatchId: batchId,
      },
    }),
  );
}

export async function createSpecialPrice(params: {
  productCode: string;
  discountCode: string;
  description: string | null;
  discountPrice: number;
  startDate: Date;
  endDate: Date;
  batchId: string;
}) {
  const { productCode, discountCode, description, discountPrice, startDate, endDate, batchId } = params;
  return db(QUERIES.IMPORT_SPECIAL_PRICES_UPSERT, (p) =>
    p.specialPrice.create({
      data: {
        productCode,
        discountCode,
        description,
        discountPrice,
        startsAt: startDate,
        endsAt: endDate,
        importBatchId: batchId,
        source: "IMPORT",
        sourceBatchId: batchId,
      },
    }),
  );
}

export async function findActiveSpecialPrice(productCode: string, asOfDate: Date) {
  return db(QUERIES.IMPORT_SPECIAL_PRICES_UPSERT, (p) =>
    p.specialPrice.findFirst({
      where: {
        productCode,
        startsAt: { lte: asOfDate },
        endsAt: { gte: asOfDate },
      },
      orderBy: { createdAt: "desc" },
    }),
  );
}

export async function listActiveSpecialPrices(startDate: Date, endDate: Date) {
  return db(QUERIES.IMPORT_SPECIAL_PRICES_UPSERT, (p) =>
    p.specialPrice.findMany({
      where: {
        OR: [
          { startsAt: { gte: startDate, lte: endDate } },
          { endsAt: { gte: startDate, lte: endDate } },
          { startsAt: { lte: startDate }, endsAt: { gte: endDate } },
        ],
      },
      orderBy: { startsAt: "asc" },
    }),
  );
}

export async function deleteExpiredSpecialPrices(
  beforeDate: Date,
): Promise<{ count: number }> {
  return db(QUERIES.IMPORT_SPECIAL_PRICES_UPSERT, (p) =>
    p.specialPrice.deleteMany({
      where: {
        endsAt: { lt: beforeDate },
      },
    }),
  );
}
