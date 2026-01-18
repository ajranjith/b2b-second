# Phase 3 - Import Framework Status & Implementation Plan

**Date:** 2026-01-18
**Status:** ✅ Core Framework Exists | 🔨 Enhancements Needed

---

## ✅ EXISTING IMPLEMENTATION

### 1. Database Schema - COMPLETE

**Import Framework Tables:**
- ✅ `ImportBatch` - Tracks each import job with status, counts, metadata
- ✅ `ImportError` - Stores row-level validation errors with context
- ✅ Staging Tables:
  - `StgProductPriceRow` - Products (Genuine/Aftermarket/Branded)
  - `StgDealerAccountRow` - Dealer accounts
  - `StgSupersessionRow` - Part supersessions
  - `StgSpecialPriceRow` - Special pricing
  - `StgBackorderRow` - Backorder data

**Import Types (Enum):**
```typescript
enum ImportType {
  PRODUCTS_GENUINE
  PRODUCTS_AFTERMARKET
  PRODUCTS_MIXED
  DEALERS
  BACKORDERS
  BACKORDER_UPDATE
  SUPERSESSION
  SPECIAL_PRICES
  FULFILLMENT_STATUS
}
```

**Import Status (Enum):**
```typescript
enum ImportStatus {
  PROCESSING
  SUCCEEDED
  FAILED
  SUCCEEDED_WITH_ERRORS
}
```

### 2. Existing Import Workers - COMPLETE

#### A. Product Import ([importProducts.ts](apps/worker/src/importProducts.ts))

**✅ Follows UPSERT Strategy:**
```typescript
// Line 226-243: Product UPSERT
await tx.product.upsert({
    where: { productCode: row['Product Code']! },
    update: {
        supplier: row.Supplier || null,
        description: (row.Description || row['Full Description'])!,
        discountCode: row['Discount Code'] || null,
        partType,
        isActive: true
    },
    create: {
        productCode: row['Product Code']!,
        supplier: row.Supplier || null,
        description: (row.Description || row['Full Description'])!,
        discountCode: row['Discount Code'] || null,
        partType,
        isActive: true
    }
});
```

**✅ Key Features Implemented:**
- ✅ Import batch creation with file hash
- ✅ Row-by-row validation
- ✅ Staging table population (`StgProductPriceRow`)
- ✅ Validation errors stored in `ImportError`
- ✅ UPSERT for Product, ProductStock, ProductPriceReference, ProductPriceBand
- ✅ Transaction safety (Prisma transactions)
- ✅ Progress logging (every 100 rows)
- ✅ Final status determination (SUCCEEDED/FAILED/SUCCEEDED_WITH_ERRORS)
- ✅ Normalized keys (trim on product codes)

**✅ Non-Destructive:**
- Never truncates tables
- Only UPSERT operations
- Preserves existing data

#### B. Backorder Import ([importBackorders.ts](apps/worker/src/importBackorders.ts))

**✅ Key Features:**
- ✅ CSV parsing with flexible column mapping
- ✅ Zod schema validation
- ✅ Staging table (`StgBackorderRow`)
- ✅ Dataset activation (one active dataset at a time)
- ✅ Historical preservation (inactive datasets kept)

---

## 🔨 ENHANCEMENTS NEEDED

### 1. Reusable Import Service Framework

**Current State:** Import logic is duplicated across workers
**Needed:** Create a generic `ImportService` class

**Recommended Structure:**
```
apps/worker/src/services/
├── ImportService.ts          # Generic import framework
├── ProductImportService.ts   # Extends ImportService
├── BackorderImportService.ts # Extends ImportService
├── DealerImportService.ts    # Extends ImportService
└── SupersessionImportService.ts
```

**Generic Framework Should Provide:**
```typescript
abstract class ImportService<TRow, TStagingRow> {
  // Common lifecycle
  async createBatch(fileName: string, fileHash: string): Promise<ImportBatch>
  abstract validateRow(row: TRow, rowNumber: number): ValidationResult
  abstract parseRow(row: TRow): TStagingRow
  abstract processValidRows(batchId: string): Promise<void>
  async finishBatch(batchId: string, counts: Counts, status: ImportStatus): Promise<void>

  // Helpers
  async logError(batchId: string, rowNumber: number, error: string): Promise<void>
  async stageRow(batchId: string, rowNumber: number, row: TStagingRow, validation: ValidationResult): Promise<void>
}
```

### 2. Missing Import Types

Based on schema but not yet implemented:

- ❌ **Dealer Account Import** (`ImportType.DEALERS`)
  - Staging table exists: `StgDealerAccountRow`
  - Needs: Worker script + validation + UPSERT logic

- ❌ **Supersession Import** (`ImportType.SUPERSESSION`)
  - Staging table exists: `StgSupersessionRow`
  - Needs: Worker script + validation + UPSERT logic

- ❌ **Special Prices Import** (`ImportType.SPECIAL_PRICES`)
  - Staging table exists: `StgSpecialPriceRow`
  - Needs: Worker script + validation + UPSERT logic

- ❌ **Backorder Update** (`ImportType.BACKORDER_UPDATE`)
  - Table exists: `BackorderUpdateLine`
  - Needs: Worker script

- ❌ **Fulfillment Status** (`ImportType.FULFILLMENT_STATUS`)
  - Needs: Schema design + staging table + worker

### 3. Enhanced Validation

**Current:** Basic validation in worker code
**Needed:**
- ✅ Column existence validation
- ✅ Type validation (numbers, dates, enums)
- ✅ Business rule validation (e.g., price > 0, valid dealer status)
- ❌ Cross-reference validation (e.g., product exists, dealer exists)
- ❌ Duplicate detection within batch

### 4. Key Normalization

**Current:** Basic trim on product codes
**Needed:**
- Consistent uppercase for part numbers
- Trim all string fields
- Normalize dealer account numbers
- Standardize email addresses (lowercase)

**Example Enhancement:**
```typescript
function normalizePartNumber(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '');
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
```

### 5. Database UPSERT Strategy

**Current:** Using Prisma `upsert()` which works for PostgreSQL
**Note:** Your schema says SQL Server, but the code uses PostgreSQL

**For SQL Server MERGE (if switching DBs):**
```sql
MERGE INTO Product AS target
USING (VALUES (@productCode, @description, @partType)) AS source (productCode, description, partType)
ON target.productCode = source.productCode
WHEN MATCHED THEN
    UPDATE SET description = source.description, partType = source.partType
WHEN NOT MATCHED THEN
    INSERT (productCode, description, partType) VALUES (source.productCode, source.description, source.partType);
```

**Current PostgreSQL approach is correct:** Prisma handles UPSERT properly

---

## 📋 IMPLEMENTATION CHECKLIST

### Phase 3.1 - Generic Framework ✅ (Mostly Complete)

- [x] Import batch creation
- [x] Staging table pattern
- [x] Validation error logging
- [x] UPSERT strategy (no truncation)
- [x] Status tracking
- [ ] Extract to reusable service class

### Phase 3.2 - Product Imports ✅ COMPLETE

- [x] Genuine products
- [x] Aftermarket products
- [x] Branded products
- [x] UPSERT Product, Stock, Prices, Bands
- [x] File hash deduplication
- [x] Progress reporting

### Phase 3.3 - Backorder Imports ✅ COMPLETE

- [x] Backorder dataset import
- [x] Dataset activation (only one active)
- [x] Historical preservation
- [ ] Backorder update import

### Phase 3.4 - Missing Importers 🔨 TO DO

- [ ] Dealer account import
  - [ ] Create worker script
  - [ ] Validate account numbers (unique)
  - [ ] Validate email uniqueness
  - [ ] UPSERT dealer + user + band assignments
  - [ ] Handle business rules (3 band assignments required)

- [ ] Supersession import
  - [ ] Create worker script
  - [ ] Validate part codes exist
  - [ ] UPSERT supersessions
  - [ ] Handle chain supersessions

- [ ] Special prices import
  - [ ] Create worker script
  - [ ] Validate date ranges
  - [ ] UPSERT special prices
  - [ ] Handle expiration

### Phase 3.5 - Enhanced Validation 🔨 TO DO

- [ ] Column header validation (fail fast if columns missing)
- [ ] Cross-reference validation
- [ ] Duplicate detection
- [ ] Business rule validation

### Phase 3.6 - Key Normalization 🔨 TO DO

- [ ] Uppercase part numbers
- [ ] Lowercase emails
- [ ] Trim all strings
- [ ] Normalize account numbers

---

## 🎯 RECOMMENDED NEXT STEPS

### Priority 1: Refactor to Reusable Service

Create `ImportService` base class to reduce duplication:

```typescript
// apps/worker/src/services/ImportService.ts
import { PrismaClient, ImportBatch, ImportType, ImportStatus } from '@prisma/client';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ImportCounts {
  total: number;
  valid: number;
  invalid: number;
}

export abstract class ImportService<TRow = any> {
  constructor(protected prisma: PrismaClient) {}

  // Step 1: Create batch
  async createBatch(importType: ImportType, fileName: string, fileHash: string, filePath?: string): Promise<ImportBatch> {
    return this.prisma.importBatch.create({
      data: {
        importType,
        fileName,
        fileHash,
        filePath,
        status: ImportStatus.PROCESSING,
        totalRows: 0,
        validRows: 0,
        invalidRows: 0
      }
    });
  }

  // Step 2: Validate required columns
  abstract validateColumns(headers: string[]): { valid: boolean; missing: string[] };

  // Step 3: Validate individual row
  abstract validateRow(row: TRow, rowNumber: number): ValidationResult;

  // Step 4: Parse row to staging format
  abstract parseRow(row: TRow, batchId: string, rowNumber: number): any;

  // Step 5: Process valid rows (UPSERT logic)
  abstract processValidRows(batchId: string): Promise<number>;

  // Step 6: Finish batch
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
        completedAt: new Date()
      }
    });
  }

  // Helper: Log error
  async logError(batchId: string, rowNumber: number, errorMessage: string, rawRow?: any): Promise<void> {
    await this.prisma.importError.create({
      data: {
        batchId,
        rowNumber,
        errorMessage,
        rawRowJson: rawRow
      }
    });
  }

  // Normalize helpers
  protected normalizePartNumber(code: string): string {
    return code.trim().toUpperCase().replace(/\s+/g, '');
  }

  protected normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  protected trimString(value: string | null | undefined): string | null {
    return value?.trim() || null;
  }
}
```

### Priority 2: Implement Missing Importers

1. **Dealer Import** (highest business value)
2. **Supersession Import** (supports product catalog)
3. **Special Prices Import** (supports pricing)

### Priority 3: Add End-to-End Tests

```typescript
// apps/worker/tests/imports.test.ts
describe('Product Import', () => {
  it('should import valid products', async () => {
    const result = await importProducts({ file: 'test-data/valid-products.xlsx', type: 'GENUINE' });
    expect(result.status).toBe('SUCCEEDED');
    expect(result.validRows).toBe(10);
  });

  it('should handle invalid rows gracefully', async () => {
    const result = await importProducts({ file: 'test-data/mixed-products.xlsx', type: 'GENUINE' });
    expect(result.status).toBe('SUCCEEDED_WITH_ERRORS');
    expect(result.validRows).toBeGreaterThan(0);
    expect(result.invalidRows).toBeGreaterThan(0);
  });

  it('should UPSERT existing products', async () => {
    // First import
    await importProducts({ file: 'test-data/products-v1.xlsx', type: 'GENUINE' });
    const product1 = await prisma.product.findUnique({ where: { productCode: 'TEST001' } });

    // Second import with updated data
    await importProducts({ file: 'test-data/products-v2.xlsx', type: 'GENUINE' });
    const product2 = await prisma.product.findUnique({ where: { productCode: 'TEST001' } });

    expect(product1.description).not.toBe(product2.description); // Updated
    expect(product1.id).toBe(product2.id); // Same product (UPSERT, not INSERT)
  });
});
```

---

## 📊 CURRENT COMPLIANCE STATUS

### ✅ Non-Negotiable Constraints - COMPLIANT

| Constraint | Status | Implementation |
|-----------|--------|----------------|
| No table truncation | ✅ PASS | Only UPSERT operations used |
| Additive changes only | ✅ PASS | Schema uses migrations |
| UPSERT strategy | ✅ PASS | Prisma `upsert()` used throughout |
| Preserve historical orders | ✅ PASS | Orders never modified after creation |
| Store unitPrice at checkout | ✅ PASS | `OrderLine.unitPriceSnapshot` field |
| Never wipe tables | ✅ PASS | No truncate/delete operations |

### ✅ Import Framework Requirements - COMPLIANT

| Requirement | Status | Notes |
|------------|--------|-------|
| Create ImportBatch at start | ✅ PASS | Line 152 (products), Line 52 (backorders) |
| Validate required columns | ⚠️ PARTIAL | Happens implicitly, should be explicit |
| Per-row validation errors to ImportError | ✅ PASS | Line 316-323 (products) |
| Only write valid rows | ✅ PASS | Validation check before UPSERT |
| Finish batch with counts/status | ✅ PASS | Line 350-358 (products) |
| Normalized keys | ⚠️ PARTIAL | Basic trim, needs uppercase for parts |

---

## 🚀 PRODUCTION READINESS

**Current State:** Import framework is **80% production-ready**

**Ready for Production:**
- ✅ Product imports (Genuine, Aftermarket, Branded)
- ✅ Backorder dataset imports
- ✅ Error tracking and reporting
- ✅ Transaction safety
- ✅ UPSERT strategy (no data loss)

**Needs Work Before Production:**
- 🔨 Reusable service framework (reduce duplication)
- 🔨 Dealer account import
- 🔨 Supersession import
- 🔨 Enhanced key normalization
- 🔨 End-to-end test coverage
- 🔨 API endpoints for web upload (currently CLI only)

---

**Status:** ✅ **Core Framework Complete** | 🔨 **Enhancements Recommended**
