import { PrismaClient, ImportType } from "@prisma/client";
import { ImportService, ValidationResult } from "./ImportService";

interface SpecialPriceRow {
  "Part No"?: string;
  "Discount Code"?: string;
  Description?: string;
  "Discount Price"?: number | string;
}

interface ParsedSpecialPriceRow {
  batchId: string;
  rowNumber: number;
  productCode: string | null;
  discountCode: string | null;
  description: string | null;
  discountPrice: number | null;
  isValid: boolean;
  validationErrors: string | null;
  rawRowJson: any;
}

interface SpecialPriceImportOptions {
  startDate: Date;
  endDate: Date;
}

export class SpecialPriceImportService extends ImportService<SpecialPriceRow> {
  private importOptions: SpecialPriceImportOptions;

  constructor(prisma: PrismaClient, options: SpecialPriceImportOptions) {
    super(prisma);
    this.importOptions = options;
    this.validateDateRange(options.startDate, options.endDate);
  }

  private validateDateRange(startDate: Date, endDate: Date): void {
    if (startDate >= endDate) {
      throw new Error("Start date must be before end date");
    }
  }

  validateColumns(headers: string[]): { valid: boolean; missing: string[] } {
    const required = ["Part No", "Discount Code", "Description", "Discount Price"];
    const missing = required.filter((col) => !this.hasColumn(headers, col));
    return { valid: missing.length === 0, missing };
  }

  validateRow(row: SpecialPriceRow, rowNumber: number): ValidationResult {
    const errors: string[] = [];

    const error1 = this.validateRequired(row["Part No"], "Part No");
    if (error1) errors.push(error1);

    const error2 = this.validateRequired(row["Discount Code"], "Discount Code");
    if (error2) errors.push(error2);

    const error3 = this.validateRequired(row["Description"], "Description");
    if (error3) errors.push(error3);

    const priceError = this.validateNonNegativeDecimal(row["Discount Price"], "Discount Price");
    if (priceError) errors.push(priceError);

    const price = this.parseDecimal(row["Discount Price"]);
    if (price !== null && price === 0) {
      errors.push("Discount Price must be greater than 0");
    }

    return { isValid: errors.length === 0, errors };
  }

  parseRow(row: SpecialPriceRow, batchId: string, rowNumber: number): ParsedSpecialPriceRow {
    const validation = this.validateRow(row, rowNumber);

    const partNo = this.trimString(row["Part No"]);
    const discountCode = this.trimString(row["Discount Code"]);

    return {
      batchId,
      rowNumber,
      productCode: this.normalizePartNumber(partNo),
      discountCode: discountCode?.toUpperCase() || null,
      description: this.trimString(row["Description"]),
      discountPrice: this.parseDecimal(row["Discount Price"]),
      isValid: validation.isValid,
      validationErrors: validation.errors.length > 0 ? validation.errors.join("; ") : null,
      rawRowJson: row as any,
    };
  }

  async processValidRows(batchId: string): Promise<number> {
    const validRows = await this.prisma.stgSpecialPriceRow.findMany({
      where: { batchId, isValid: true },
    });

    let processedCount = 0;

    console.log(
      `   Date Range: ${this.importOptions.startDate.toISOString().split("T")[0]} to ${this.importOptions.endDate.toISOString().split("T")[0]}`,
    );

    for (const row of validRows) {
      await this.prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({
          where: { productCode: row.productCode! },
        });

        if (!product) {
          await this.logError(
            batchId,
            row.rowNumber,
            `Product not found for Part No: ${row.productCode}`,
            "Part No",
            "PRODUCT_NOT_FOUND",
            row.rawRowJson,
          );
          return;
        }

        const existing = await tx.specialPrice.findFirst({
          where: {
            productCode: row.productCode!,
            discountCode: row.discountCode!,
            startsAt: this.importOptions.startDate,
            endsAt: this.importOptions.endDate,
            dealerAccountId: null,
          },
        });

        if (existing) {
          await tx.specialPrice.update({
            where: { id: existing.id },
            data: {
              discountPrice: row.discountPrice!,
              description: row.description,
              importBatchId: batchId,
              source: "IMPORT",
              sourceBatchId: batchId,
            },
          });
        } else {
          await tx.specialPrice.create({
            data: {
              productCode: row.productCode!,
              discountCode: row.discountCode!,
              description: row.description,
              discountPrice: row.discountPrice!,
              startsAt: this.importOptions.startDate,
              endsAt: this.importOptions.endDate,
              importBatchId: batchId,
              source: "IMPORT",
              sourceBatchId: batchId,
            },
          });
        }
      });

      processedCount++;
      if (processedCount % 50 === 0) {
        console.log(`      Processed ${processedCount}/${validRows.length} special prices`);
      }
    }

    return processedCount;
  }

  async getActiveSpecialPrice(
    productCode: string,
    asOfDate: Date = new Date(),
  ): Promise<number | null> {
    const specialPrice = await this.prisma.specialPrice.findFirst({
      where: {
        productCode,
        startsAt: { lte: asOfDate },
        endsAt: { gte: asOfDate },
      },
      orderBy: { createdAt: "desc" },
    });

    return specialPrice ? Number(specialPrice.discountPrice) : null;
  }

  async getActiveSpecialPrices(startDate: Date, endDate: Date): Promise<any[]> {
    return await this.prisma.specialPrice.findMany({
      where: {
        OR: [
          { startsAt: { gte: startDate, lte: endDate } },
          { endsAt: { gte: startDate, lte: endDate } },
          { startsAt: { lte: startDate }, endsAt: { gte: endDate } },
        ],
      },
      orderBy: { startsAt: "asc" },
    });
  }

  async cleanupExpiredPrices(beforeDate: Date = new Date()): Promise<number> {
    const result = await this.prisma.specialPrice.deleteMany({
      where: {
        endsAt: { lt: beforeDate },
      },
    });

    return result.count;
  }
}
