import { PrismaClient, ImportType, PartType } from "@prisma/client";
import { ImportService, ValidationResult } from "./ImportService";

/**
 * DGS Sample File Format:
 * - Product Code
 * - Full Description
 * - Free Stock
 * - Net 1 Price, Net 2 Price, ..., Net 7 Price
 * - Discount code (gn=GENUINE, es=AFTERMARKET, br=BRANDED)
 */
interface DGSProductRow {
  "Product Code"?: string;
  "Full Description"?: string;
  "Free Stock"?: number | string;
  "Net 1 Price"?: number | string;
  "Net 2 Price"?: number | string;
  "Net 3 Price"?: number | string;
  "Net 4 Price"?: number | string;
  "Net 5 Price"?: number | string;
  "Net 6 Price"?: number | string;
  "Net 7 Price"?: number | string;
  "Discount code"?: string;
  Supplier?: string;
}

interface ParsedProductRow {
  batchId: string;
  rowNumber: number;
  productCode: string | null;
  description: string | null;
  discountCode: string | null;
  supplier: string | null;
  freeStock: number | null;
  net1Price: number | null;
  net2Price: number | null;
  net3Price: number | null;
  net4Price: number | null;
  net5Price: number | null;
  net6Price: number | null;
  net7Price: number | null;
  partType: PartType;
  isValid: boolean;
  validationErrors: string | null;
  rawRowJson: any;
}

export class ProductImportService extends ImportService<DGSProductRow> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  /**
   * Validate required columns exist in the Excel file
   */
  validateColumns(headers: string[]): { valid: boolean; missing: string[] } {
    const required = [
      "Product Code",
      "Full Description",
      "Free Stock",
      "Net 1 Price",
      "Net 2 Price",
      "Net 3 Price",
      "Net 4 Price",
      "Net 5 Price",
      "Net 6 Price",
      "Net 7 Price",
      "Discount code",
    ];

    const missing: string[] = [];
    for (const col of required) {
      if (!this.hasColumn(headers, col)) {
        missing.push(col);
      }
    }

    return {
      valid: missing.length === 0,
      missing,
    };
  }

  /**
   * Validate individual row
   */
  validateRow(row: DGSProductRow, rowNumber: number): ValidationResult {
    const errors: string[] = [];

    // Required: Product Code
    const productCodeError = this.validateRequired(row["Product Code"], "Product Code");
    if (productCodeError) errors.push(productCodeError);

    // Required: Full Description
    const descriptionError = this.validateRequired(row["Full Description"], "Full Description");
    if (descriptionError) errors.push(descriptionError);

    // Required: Discount code (must be gn, es, or br)
    const discountCode = this.trimString(row["Discount code"]);
    const discountCodeError = this.validateEnum(discountCode, "Discount code", ["gn", "es", "br"]);
    if (discountCodeError) errors.push(discountCodeError);

    // Free Stock: must be non-negative integer
    const freeStockError = this.validateNonNegativeInt(row["Free Stock"], "Free Stock");
    if (freeStockError) errors.push(freeStockError);

    // Net Prices: must be non-negative decimals
    for (let i = 1; i <= 7; i++) {
      const fieldName = `Net ${i} Price` as keyof DGSProductRow;
      const priceError = this.validateNonNegativeDecimal(row[fieldName], fieldName);
      if (priceError) errors.push(priceError);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Parse row to staging format with normalization
   */
  parseRow(row: DGSProductRow, batchId: string, rowNumber: number): ParsedProductRow {
    // Determine PartType from discount code
    const discountCode = this.trimString(row["Discount code"])?.toLowerCase();
    let partType: PartType;
    if (discountCode === "gn") {
      partType = PartType.GENUINE;
    } else if (discountCode === "br") {
      partType = PartType.BRANDED;
    } else {
      partType = PartType.AFTERMARKET; // es or default
    }

    const validation = this.validateRow(row, rowNumber);

    return {
      batchId,
      rowNumber,
      productCode: this.normalizePartNumber(row["Product Code"]),
      description: this.trimString(row["Full Description"]),
      discountCode: this.trimString(row["Discount code"]),
      supplier: this.trimString(row.Supplier),
      freeStock: this.parseInt(row["Free Stock"]),
      net1Price: this.parseDecimal(row["Net 1 Price"]),
      net2Price: this.parseDecimal(row["Net 2 Price"]),
      net3Price: this.parseDecimal(row["Net 3 Price"]),
      net4Price: this.parseDecimal(row["Net 4 Price"]),
      net5Price: this.parseDecimal(row["Net 5 Price"]),
      net6Price: this.parseDecimal(row["Net 6 Price"]),
      net7Price: this.parseDecimal(row["Net 7 Price"]),
      partType,
      isValid: validation.isValid,
      validationErrors: validation.errors.length > 0 ? validation.errors.join("; ") : null,
      rawRowJson: row,
    };
  }

  /**
   * Process valid rows: UPSERT products, stock, and net prices
   */
  async processValidRows(batchId: string): Promise<number> {
    // Get all valid rows from staging table
    const validRows = await this.prisma.stgProductPriceRow.findMany({
      where: {
        batchId,
        isValid: true,
      },
    });

    console.log(`\n📊 Processing ${validRows.length} valid products...`);

    let processedCount = 0;

    for (const row of validRows) {
      try {
        await this.prisma.$transaction(async (tx) => {
          // 1. UPSERT Product
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

          // 2. UPSERT ProductStock
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

          // 3. UPSERT ProductNetPrice (7 tiers: Net1..Net7)
          const netPrices = [
            { tierCode: "Net1", price: row.band1Price }, // Using band1Price for Net1 (schema mapping)
            { tierCode: "Net2", price: row.band2Price },
            { tierCode: "Net3", price: row.band3Price },
            { tierCode: "Net4", price: row.band4Price },
            { tierCode: "Net5", price: null }, // Not in StgProductPriceRow schema
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
        });

        processedCount++;

        if (processedCount % 25 === 0) {
          console.log(`   ✓ Processed ${processedCount}/${validRows.length} products`);
        }
      } catch (error) {
        console.error(`   ✗ Failed to process row ${row.rowNumber}:`, error);
        await this.logError(
          batchId,
          row.rowNumber,
          `Processing error: ${error instanceof Error ? error.message : String(error)}`,
          undefined,
          "PROCESSING_ERROR",
          row.rawRowJson,
        );
      }
    }

    console.log(`   ✅ Completed: ${processedCount}/${validRows.length} products processed\n`);
    return processedCount;
  }
}
