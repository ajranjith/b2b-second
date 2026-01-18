import { PrismaClient, ImportType } from '@prisma/client';
import { ImportService, ValidationResult } from './ImportService';

interface SpecialPriceRow {
  'Part No'?: string;
  'Discount Code'?: string;
  'Description'?: string;
  'Discount Price'?: number | string;
}

interface ParsedSpecialPriceRow {
  batchId: string;
  rowNumber: number;
  partNo: string | null;
  partNoNormalized: string | null;
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
      throw new Error('Start date must be before end date');
    }

    // Warn if date range is in the past
    const now = new Date();
    if (endDate < now) {
      console.warn('⚠️  Warning: End date is in the past. This special pricing will not be active.');
    }
  }

  validateColumns(headers: string[]): { valid: boolean; missing: string[] } {
    const required = ['Part No', 'Discount Code', 'Description', 'Discount Price'];
    const missing = required.filter(col => !this.hasColumn(headers, col));
    return { valid: missing.length === 0, missing };
  }

  validateRow(row: SpecialPriceRow, rowNumber: number): ValidationResult {
    const errors: string[] = [];

    // Required: Part No
    const error1 = this.validateRequired(row['Part No'], 'Part No');
    if (error1) errors.push(error1);

    // Required: Discount Code
    const error2 = this.validateRequired(row['Discount Code'], 'Discount Code');
    if (error2) errors.push(error2);

    // Required: Description
    const error3 = this.validateRequired(row['Description'], 'Description');
    if (error3) errors.push(error3);

    // Required: Discount Price (must be non-negative)
    const priceError = this.validateNonNegativeDecimal(row['Discount Price'], 'Discount Price');
    if (priceError) errors.push(priceError);

    // Additional validation: Discount Price must be > 0
    const price = this.parseDecimal(row['Discount Price']);
    if (price !== null && price === 0) {
      errors.push('Discount Price must be greater than 0');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  parseRow(row: SpecialPriceRow, batchId: string, rowNumber: number): ParsedSpecialPriceRow {
    const validation = this.validateRow(row, rowNumber);

    const partNo = this.trimString(row['Part No']);
    const discountCode = this.trimString(row['Discount Code']);

    return {
      batchId,
      rowNumber,
      partNo,
      partNoNormalized: this.normalizePartNumber(partNo),
      discountCode: discountCode?.toLowerCase() || null,
      description: this.trimString(row['Description']),
      discountPrice: this.parseDecimal(row['Discount Price']),
      isValid: validation.isValid,
      validationErrors: validation.errors.length > 0 ? validation.errors.join('; ') : null,
      rawRowJson: row as any
    };
  }

  async processValidRows(batchId: string): Promise<number> {
    const validRows = await this.prisma.stgSpecialPriceRow.findMany({
      where: { batchId, isValid: true }
    });

    let processedCount = 0;

    console.log(`   Date Range: ${this.importOptions.startDate.toISOString().split('T')[0]} to ${this.importOptions.endDate.toISOString().split('T')[0]}`);

    for (const row of validRows) {
      await this.prisma.$transaction(async (tx) => {
        // 1. Find the Product by normalized part number
        const product = await tx.product.findUnique({
          where: { productCode: row.partNoNormalized! }
        });

        if (!product) {
          // Log warning: Product not found
          await this.logError(
            batchId,
            row.rowNumber,
            `Product not found for Part No: ${row.partNo}`,
            'Part No',
            'PRODUCT_NOT_FOUND',
            row.rawRowJson
          );
          return;
        }

        // 2. UPSERT SpecialPrice by (productId, startDate, endDate)
        // Note: We use a unique constraint on productId + startDate + endDate
        // Multiple overlapping special prices are allowed (last one wins in resolver)
        await tx.specialPrice.upsert({
          where: {
            productId_startDate_endDate: {
              productId: product.id,
              startDate: this.importOptions.startDate,
              endDate: this.importOptions.endDate
            }
          },
          update: {
            discountPrice: row.discountPrice!,
            description: row.description,
            discountCode: row.discountCode,
            lastImportBatchId: batchId,
            updatedAt: new Date()
          },
          create: {
            productId: product.id,
            startDate: this.importOptions.startDate,
            endDate: this.importOptions.endDate,
            discountPrice: row.discountPrice!,
            description: row.description,
            discountCode: row.discountCode,
            lastImportBatchId: batchId,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      });

      processedCount++;

      if (processedCount % 50 === 0) {
        console.log(`      Processed ${processedCount}/${validRows.length} special prices`);
      }
    }

    return processedCount;
  }

  /**
   * Get active special price for a product at a given date
   */
  async getActiveSpecialPrice(productId: string, asOfDate: Date = new Date()): Promise<number | null> {
    const specialPrice = await this.prisma.specialPrice.findFirst({
      where: {
        productId,
        startDate: { lte: asOfDate },
        endDate: { gte: asOfDate }
      },
      orderBy: { createdAt: 'desc' } // If multiple overlapping, use most recent
    });

    return specialPrice?.discountPrice || null;
  }

  /**
   * Get all active special prices for a date range
   */
  async getActiveSpecialPrices(startDate: Date, endDate: Date): Promise<any[]> {
    return await this.prisma.specialPrice.findMany({
      where: {
        OR: [
          // Special price starts within range
          {
            startDate: { gte: startDate, lte: endDate }
          },
          // Special price ends within range
          {
            endDate: { gte: startDate, lte: endDate }
          },
          // Special price spans entire range
          {
            startDate: { lte: startDate },
            endDate: { gte: endDate }
          }
        ]
      },
      include: {
        product: {
          select: {
            productCode: true,
            description: true
          }
        }
      },
      orderBy: { startDate: 'asc' }
    });
  }

  /**
   * Clean up expired special prices (optional maintenance)
   */
  async cleanupExpiredPrices(beforeDate: Date = new Date()): Promise<number> {
    const result = await this.prisma.specialPrice.deleteMany({
      where: {
        endDate: { lt: beforeDate }
      }
    });

    return result.count;
  }
}
