import { PrismaClient, ImportBatch, ImportType, ImportStatus } from "@prisma/client";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ImportCounts {
  total: number;
  valid: number;
  invalid: number;
}

export interface ImportResult {
  batchId: string;
  status: ImportStatus;
  counts: ImportCounts;
}

/**
 * Base class for all import services
 * Implements common import lifecycle:
 * 1. Create ImportBatch
 * 2. Validate required columns
 * 3. Parse and validate rows
 * 4. Stage valid/invalid rows
 * 5. Process valid rows (UPSERT)
 * 6. Finish batch with counts and status
 */
export abstract class ImportService<TRow = any> {
  constructor(protected prisma: PrismaClient) {}

  /**
   * Step 1: Create import batch
   */
  async createBatch(
    importType: ImportType,
    fileName: string,
    fileHash: string,
    filePath?: string,
  ): Promise<ImportBatch> {
    return this.prisma.importBatch.create({
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
    });
  }

  /**
   * Step 2: Validate required columns exist
   * Fail fast if critical columns are missing
   */
  abstract validateColumns(headers: string[]): { valid: boolean; missing: string[] };

  /**
   * Step 3: Validate individual row
   * Returns validation result with errors
   */
  abstract validateRow(row: TRow, rowNumber: number): ValidationResult;

  /**
   * Step 4: Parse row to staging format
   * Normalizes data and prepares for database insert
   */
  abstract parseRow(row: TRow, batchId: string, rowNumber: number): any;

  /**
   * Step 5: Process valid rows
   * Implements UPSERT logic for main tables
   * @returns number of rows successfully processed
   */
  abstract processValidRows(batchId: string): Promise<number>;

  /**
   * Step 6: Finish batch with final counts and status
   */
  async finishBatch(batchId: string, counts: ImportCounts): Promise<void> {
    let status: ImportStatus;
    if (counts.invalid === 0) {
      status = ImportStatus.SUCCEEDED;
    } else if (counts.valid === 0) {
      status = ImportStatus.FAILED;
    } else {
      status = ImportStatus.SUCCEEDED_WITH_ERRORS;
    }

    await this.prisma.importBatch.update({
      where: { id: batchId },
      data: {
        totalRows: counts.total,
        validRows: counts.valid,
        invalidRows: counts.invalid,
        status,
        completedAt: new Date(),
      },
    });
  }

  /**
   * Helper: Log import error
   */
  async logError(
    batchId: string,
    rowNumber: number,
    errorMessage: string,
    columnName?: string,
    errorCode?: string,
    rawRow?: any,
  ): Promise<void> {
    await this.prisma.importError.create({
      data: {
        batchId,
        rowNumber,
        columnName,
        errorCode,
        errorMessage,
        rawRowJson: rawRow,
      },
    });
  }

  /**
   * Helper: Mark batch as failed
   */
  async markBatchFailed(batchId: string, error?: Error): Promise<void> {
    await this.prisma.importBatch.update({
      where: { id: batchId },
      data: {
        status: ImportStatus.FAILED,
        completedAt: new Date(),
      },
    });

    if (error) {
      await this.logError(batchId, 0, error.message, undefined, "BATCH_ERROR");
    }
  }

  // ==================== NORMALIZATION HELPERS ====================

  /**
   * Normalize part number: trim and uppercase
   */
  protected normalizePartNumber(code: string | null | undefined): string | null {
    if (!code) return null;
    return code.trim().toUpperCase().replace(/\s+/g, "");
  }

  /**
   * Normalize email: trim and lowercase
   */
  protected normalizeEmail(email: string | null | undefined): string | null {
    if (!email) return null;
    return email.trim().toLowerCase();
  }

  /**
   * Trim string and return null if empty
   */
  protected trimString(value: string | null | undefined): string | null {
    if (value === undefined || value === null) return null;
    const trimmed = String(value).trim();
    return trimmed === "" ? null : trimmed;
  }

  /**
   * Parse decimal value, return null if invalid
   */
  protected parseDecimal(value: any): number | null {
    if (value === undefined || value === null || value === "") return null;
    const num = typeof value === "number" ? value : parseFloat(String(value));
    return isNaN(num) ? null : num;
  }

  /**
   * Parse integer value, return null if invalid
   */
  protected parseInt(value: any): number | null {
    if (value === undefined || value === null || value === "") return null;
    const num = typeof value === "number" ? value : Number(value);
    return isNaN(num) ? null : Math.floor(num);
  }

  /**
   * Validate decimal is non-negative
   */
  protected validateNonNegativeDecimal(value: any, fieldName: string): string | null {
    const num = this.parseDecimal(value);
    if (num === null) return null; // Null is OK (optional field)
    if (num < 0) return `${fieldName} cannot be negative`;
    return null;
  }

  /**
   * Validate integer is non-negative
   */
  protected validateNonNegativeInt(value: any, fieldName: string): string | null {
    const num = this.parseInt(value);
    if (num === null) return null; // Null is OK (optional field)
    if (num < 0) return `${fieldName} cannot be negative`;
    return null;
  }

  /**
   * Validate required field exists
   */
  protected validateRequired(value: any, fieldName: string): string | null {
    if (
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "")
    ) {
      return `${fieldName} is required`;
    }
    return null;
  }

  /**
   * Validate value is in allowed set
   */
  protected validateEnum<T extends string>(
    value: any,
    fieldName: string,
    allowedValues: readonly T[],
  ): string | null {
    if (!value) return null; // Null is OK (optional field)
    const stringValue = String(value).toLowerCase();
    const normalized = allowedValues.find((v) => v.toLowerCase() === stringValue);
    if (!normalized) {
      return `${fieldName} must be one of: ${allowedValues.join(", ")}`;
    }
    return null;
  }

  /**
   * Check if column exists in headers (case-insensitive)
   */
  protected hasColumn(headers: string[], columnName: string): boolean {
    return headers.some((h) => h.toLowerCase() === columnName.toLowerCase());
  }

  /**
   * Get column value (case-insensitive header match)
   */
  protected getColumnValue(row: any, columnName: string): any {
    // Try exact match first
    if (row[columnName] !== undefined) {
      return row[columnName];
    }

    // Try case-insensitive match
    const keys = Object.keys(row);
    const matchingKey = keys.find((k) => k.toLowerCase() === columnName.toLowerCase());
    return matchingKey ? row[matchingKey] : undefined;
  }
}
