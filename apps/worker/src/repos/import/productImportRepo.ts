import { db } from "../../lib/prisma";
import { QUERIES } from "@repo/identity";

export async function listValidProductRows(batchId: string) {
  return db(QUERIES.IMPORT_STAGING_ROWS_INSERT, (p) =>
    p.stgProductPriceRow.findMany({
      where: {
        batchId,
        isValid: true,
      },
    }),
  );
}

export async function upsertProductFromRow(batchId: string, row: any): Promise<void> {
  await db(QUERIES.IMPORT_PRODUCTS_UPSERT, (p) =>
    p.$transaction(async (tx) => {
      const product = await tx.product.upsert({
        where: { productCode: row.productCode! },
        update: {
          supplier: row.supplier,
          description: row.description!,
          discountCode: row.discountCode,
          partType: row.partType,
          isActive: true,
          updatedAt: new Date(),
        },
        create: {
          productCode: row.productCode!,
          supplier: row.supplier,
          description: row.description!,
          discountCode: row.discountCode,
          partType: row.partType,
          isActive: true,
        },
      });

      if (row.freeStock !== null) {
        await tx.productStock.upsert({
          where: { productId: product.id },
          update: {
            freeStock: row.freeStock,
            lastImportBatchId: batchId,
            updatedAt: new Date(),
          },
          create: {
            productId: product.id,
            freeStock: row.freeStock,
            lastImportBatchId: batchId,
          },
        });
      }

      const netPrices = [
        { tierCode: "Net1", price: row.band1Price },
        { tierCode: "Net2", price: row.band2Price },
        { tierCode: "Net3", price: row.band3Price },
        { tierCode: "Net4", price: row.band4Price },
        { tierCode: "Net5", price: null },
        { tierCode: "Net6", price: null },
        { tierCode: "Net7", price: null },
      ];

      for (const netPrice of netPrices) {
        if (netPrice.price !== null && netPrice.price !== undefined) {
          await tx.productNetPrice.upsert({
            where: {
              productId_tierCode: {
                productId: product.id,
                tierCode: netPrice.tierCode,
              },
            },
            update: {
              price: netPrice.price,
              updatedAt: new Date(),
            },
            create: {
              productId: product.id,
              tierCode: netPrice.tierCode,
              price: netPrice.price,
            },
          });
        }
      }
    }),
  );
}
