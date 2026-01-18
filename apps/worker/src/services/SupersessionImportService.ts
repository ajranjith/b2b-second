import { PrismaClient, ImportType } from '@prisma/client';
import { ImportService, ValidationResult } from './ImportService';

interface SupersessionRow {
  'FROMPARTNO'?: string;
  'TOPARTNO'?: string;
}

interface ParsedSupersessionRow {
  batchId: string;
  rowNumber: number;
  fromPartNo: string | null;
  fromPartNoNormalized: string | null;
  toPartNo: string | null;
  toPartNoNormalized: string | null;
  isValid: boolean;
  validationErrors: string | null;
  rawRowJson: any;
}

interface ChainResolutionResult {
  originalPartNo: string;
  latestPartNo: string;
  chainLength: number;
  hasLoop: boolean;
  loopDetectedAt?: string;
}

export class SupersessionImportService extends ImportService<SupersessionRow> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  validateColumns(headers: string[]): { valid: boolean; missing: string[] } {
    const required = ['FROMPARTNO', 'TOPARTNO'];
    const missing = required.filter(col => !this.hasColumn(headers, col));
    return { valid: missing.length === 0, missing };
  }

  validateRow(row: SupersessionRow, rowNumber: number): ValidationResult {
    const errors: string[] = [];

    // Required: FROMPARTNO
    const error1 = this.validateRequired(row.FROMPARTNO, 'FROMPARTNO');
    if (error1) errors.push(error1);

    // Required: TOPARTNO
    const error2 = this.validateRequired(row.TOPARTNO, 'TOPARTNO');
    if (error2) errors.push(error2);

    // Validate not self-referencing
    if (row.FROMPARTNO && row.TOPARTNO) {
      const fromNormalized = this.normalizePartNumber(row.FROMPARTNO);
      const toNormalized = this.normalizePartNumber(row.TOPARTNO);

      if (fromNormalized === toNormalized) {
        errors.push('FROMPARTNO and TOPARTNO cannot be the same (self-referencing supersession)');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  parseRow(row: SupersessionRow, batchId: string, rowNumber: number): ParsedSupersessionRow {
    const validation = this.validateRow(row, rowNumber);

    const fromPartNo = this.trimString(row.FROMPARTNO);
    const toPartNo = this.trimString(row.TOPARTNO);

    return {
      batchId,
      rowNumber,
      fromPartNo,
      fromPartNoNormalized: this.normalizePartNumber(fromPartNo),
      toPartNo,
      toPartNoNormalized: this.normalizePartNumber(toPartNo),
      isValid: validation.isValid,
      validationErrors: validation.errors.length > 0 ? validation.errors.join('; ') : null,
      rawRowJson: row as any
    };
  }

  async processValidRows(batchId: string): Promise<number> {
    const validRows = await this.prisma.stgSupersessionRow.findMany({
      where: { batchId, isValid: true }
    });

    let processedCount = 0;

    // Step 1: UPSERT raw supersession links
    console.log('   Step 1/2: Upserting raw supersession links...');
    for (const row of validRows) {
      await this.prisma.supersession.upsert({
        where: {
          fromPartNo: row.fromPartNoNormalized!
        },
        update: {
          toPartNo: row.toPartNoNormalized!,
          lastImportBatchId: batchId,
          updatedAt: new Date()
        },
        create: {
          fromPartNo: row.fromPartNoNormalized!,
          toPartNo: row.toPartNoNormalized!,
          lastImportBatchId: batchId,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      processedCount++;

      if (processedCount % 100 === 0) {
        console.log(`      Processed ${processedCount}/${validRows.length} raw links`);
      }
    }

    // Step 2: Resolve all chains and rebuild SupersessionResolved table
    console.log('   Step 2/2: Resolving supersession chains...');
    await this.resolveAllChains(batchId);

    return processedCount;
  }

  /**
   * Resolves supersession chains for all parts and rebuilds SupersessionResolved table
   */
  private async resolveAllChains(batchId: string): Promise<void> {
    // Get all supersession links
    const allSupersessions = await this.prisma.supersession.findMany({
      orderBy: { fromPartNo: 'asc' }
    });

    // Build adjacency map for fast lookup
    const supersessionMap = new Map<string, string>();
    for (const link of allSupersessions) {
      supersessionMap.set(link.fromPartNo, link.toPartNo);
    }

    // Get unique starting parts (all FROMPARTNO values)
    const uniqueStartingParts = new Set(allSupersessions.map(s => s.fromPartNo));

    console.log(`      Found ${uniqueStartingParts.size} unique starting parts`);

    // Clear existing resolved supersessions (rebuild strategy)
    // Note: This is safe because we're only clearing the resolved cache, not the raw data
    await this.prisma.supersessionResolved.deleteMany({});

    let resolvedCount = 0;
    let loopCount = 0;

    // Resolve chain for each starting part
    for (const startingPart of uniqueStartingParts) {
      const result = this.resolveChain(startingPart, supersessionMap);

      // Insert into SupersessionResolved
      await this.prisma.supersessionResolved.create({
        data: {
          originalPartNo: result.originalPartNo,
          latestPartNo: result.latestPartNo,
          chainLength: result.chainLength,
          hasLoop: result.hasLoop,
          loopDetectedAt: result.loopDetectedAt || null,
          lastResolvedBatchId: batchId,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      resolvedCount++;

      if (result.hasLoop) {
        loopCount++;
      }

      if (resolvedCount % 100 === 0) {
        console.log(`      Resolved ${resolvedCount}/${uniqueStartingParts.size} chains (${loopCount} loops detected)`);
      }
    }

    console.log(`      ✅ Resolved ${resolvedCount} chains total (${loopCount} loops detected)`);
  }

  /**
   * Resolves a single supersession chain
   * Follows FROMPARTNO → TOPARTNO until no next link exists
   * Detects loops by tracking visited parts
   */
  private resolveChain(
    startingPartNo: string,
    supersessionMap: Map<string, string>
  ): ChainResolutionResult {
    const visited = new Set<string>();
    let currentPartNo = startingPartNo;
    let chainLength = 0;
    let hasLoop = false;
    let loopDetectedAt: string | undefined;

    // Follow chain until we reach the end or detect a loop
    while (true) {
      // Check if we've visited this part before (loop detection)
      if (visited.has(currentPartNo)) {
        hasLoop = true;
        loopDetectedAt = currentPartNo;
        break;
      }

      // Mark as visited
      visited.add(currentPartNo);

      // Look up next part in chain
      const nextPartNo = supersessionMap.get(currentPartNo);

      // If no next part, we've reached the end of the chain
      if (!nextPartNo) {
        break;
      }

      // Move to next part
      currentPartNo = nextPartNo;
      chainLength++;

      // Safety check: prevent infinite loops (should never happen with visited set, but extra safety)
      if (chainLength > 1000) {
        console.warn(`⚠️  Chain for ${startingPartNo} exceeded 1000 hops, treating as loop`);
        hasLoop = true;
        loopDetectedAt = currentPartNo;
        break;
      }
    }

    return {
      originalPartNo: startingPartNo,
      latestPartNo: currentPartNo,
      chainLength,
      hasLoop,
      loopDetectedAt
    };
  }

  /**
   * Public method to resolve a specific part number (for on-demand queries)
   */
  async resolvePartNumber(partNo: string): Promise<string> {
    const normalized = this.normalizePartNumber(partNo);
    if (!normalized) return partNo;

    // Check resolved cache first
    const resolved = await this.prisma.supersessionResolved.findUnique({
      where: { originalPartNo: normalized }
    });

    if (resolved) {
      // If loop detected, return original part
      if (resolved.hasLoop) {
        console.warn(`⚠️  Loop detected for ${partNo}, returning original part`);
        return partNo;
      }
      return resolved.latestPartNo;
    }

    // If not in cache, resolve on-the-fly
    const allSupersessions = await this.prisma.supersession.findMany();
    const supersessionMap = new Map<string, string>();
    for (const link of allSupersessions) {
      supersessionMap.set(link.fromPartNo, link.toPartNo);
    }

    const result = this.resolveChain(normalized, supersessionMap);

    if (result.hasLoop) {
      console.warn(`⚠️  Loop detected for ${partNo}, returning original part`);
      return partNo;
    }

    return result.latestPartNo;
  }
}
