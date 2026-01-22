import { ImportService, ValidationResult } from "./ImportService";
import { db } from "../lib/prisma";

interface SupersessionRow {
  FROMPARTNO?: string;
  TOPARTNO?: string;
  NOTE?: string;
}

interface ParsedSupersessionRow {
  batchId: string;
  rowNumber: number;
  originalPartCode: string | null;
  replacementPartCode: string | null;
  note: string | null;
  isValid: boolean;
  validationErrors: string | null;
  rawRowJson: any;
}

interface ChainResolutionResult {
  originalPartNo: string;
  latestPartNo: string;
  depth: number;
  hadLoop: boolean;
}

export class SupersessionImportService extends ImportService<SupersessionRow> {

  validateColumns(headers: string[]): { valid: boolean; missing: string[] } {
    const required = ["FROMPARTNO", "TOPARTNO"];
    const missing = required.filter((col) => !this.hasColumn(headers, col));
    return { valid: missing.length === 0, missing };
  }

  validateRow(row: SupersessionRow, rowNumber: number): ValidationResult {
    const errors: string[] = [];

    const fromValue = this.getColumnValue(row, "FROMPARTNO");
    const toValue = this.getColumnValue(row, "TOPARTNO");

    const error1 = this.validateRequired(fromValue, "FROMPARTNO");
    if (error1) errors.push(error1);

    const error2 = this.validateRequired(toValue, "TOPARTNO");
    if (error2) errors.push(error2);

    if (fromValue && toValue) {
      const fromNormalized = this.normalizePartNumber(String(fromValue));
      const toNormalized = this.normalizePartNumber(String(toValue));
      if (fromNormalized && toNormalized && fromNormalized === toNormalized) {
        errors.push("FROMPARTNO and TOPARTNO cannot be the same (self-referencing supersession)");
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  parseRow(row: SupersessionRow, batchId: string, rowNumber: number): ParsedSupersessionRow {
    const validation = this.validateRow(row, rowNumber);

    const fromPartNo = this.trimString(this.getColumnValue(row, "FROMPARTNO"));
    const toPartNo = this.trimString(this.getColumnValue(row, "TOPARTNO"));

    return {
      batchId,
      rowNumber,
      originalPartCode: this.normalizePartNumber(fromPartNo),
      replacementPartCode: this.normalizePartNumber(toPartNo),
      note: this.trimString(this.getColumnValue(row, "NOTE")),
      isValid: validation.isValid,
      validationErrors: validation.errors.length > 0 ? validation.errors.join("; ") : null,
      rawRowJson: row as any,
    };
  }

  async processValidRows(batchId: string): Promise<number> {
    const validRows = await db("DB-A-10-02", (p) =>
      p.stgSupersessionRow.findMany({
        where: { batchId, isValid: true },
      }),
    );

    let processedCount = 0;

    console.log("   Step 1/2: Upserting raw supersession links...");
    for (const row of validRows) {
      await db("DB-A-10-10", (p) =>
        p.supersession.upsert({
          where: {
            originalPartCode_replacementPartCode: {
              originalPartCode: row.originalPartCode!,
              replacementPartCode: row.replacementPartCode!,
            },
          },
          update: {
            note: row.note ?? null,
          },
          create: {
            originalPartCode: row.originalPartCode!,
            replacementPartCode: row.replacementPartCode!,
            note: row.note ?? null,
          },
        }),
      );

      processedCount++;
      if (processedCount % 100 === 0) {
        console.log(`      Processed ${processedCount}/${validRows.length} raw links`);
      }
    }

    console.log("   Step 2/2: Resolving supersession chains...");
    await this.resolveAllChains(batchId);

    return processedCount;
  }

  private async resolveAllChains(batchId: string): Promise<void> {
    const allSupersessions = await db("DB-A-10-10", (p) =>
      p.supersession.findMany({
        orderBy: { originalPartCode: "asc" },
      }),
    );

    const supersessionMap = new Map<string, string>();
    for (const link of allSupersessions) {
      supersessionMap.set(link.originalPartCode, link.replacementPartCode);
    }

    const uniqueStartingParts = new Set(allSupersessions.map((s) => s.originalPartCode));
    console.log(`      Found ${uniqueStartingParts.size} unique starting parts`);

    await db("DB-A-10-10", (p) => p.supersessionResolved.deleteMany({}));

    let resolvedCount = 0;
    let loopCount = 0;

    for (const startingPart of uniqueStartingParts) {
      const result = this.resolveChain(startingPart, supersessionMap);

      await db("DB-A-10-10", (p) =>
        p.supersessionResolved.create({
          data: {
            originalPartNo: result.originalPartNo,
            latestPartNo: result.latestPartNo,
            depth: result.depth,
            sourceBatchId: batchId,
          },
        }),
      );

      resolvedCount++;
      if (result.hadLoop) {
        loopCount++;
      }

      if (resolvedCount % 100 === 0) {
        console.log(
          `      Resolved ${resolvedCount}/${uniqueStartingParts.size} chains (${loopCount} loops detected)`,
        );
      }
    }

    console.log(`      Resolved ${resolvedCount} chains total (${loopCount} loops detected)`);
  }

  private resolveChain(
    startingPartNo: string,
    supersessionMap: Map<string, string>,
  ): ChainResolutionResult {
    const visited = new Set<string>();
    let currentPartNo = startingPartNo;
    let depth = 0;

    while (true) {
      if (visited.has(currentPartNo)) {
        return {
          originalPartNo: startingPartNo,
          latestPartNo: startingPartNo,
          depth,
          hadLoop: true,
        };
      }

      visited.add(currentPartNo);

      const nextPartNo = supersessionMap.get(currentPartNo);
      if (!nextPartNo) {
        break;
      }

      currentPartNo = nextPartNo;
      depth++;

      if (depth > 1000) {
        return {
          originalPartNo: startingPartNo,
          latestPartNo: startingPartNo,
          depth,
          hadLoop: true,
        };
      }
    }

    return {
      originalPartNo: startingPartNo,
      latestPartNo: currentPartNo,
      depth,
      hadLoop: false,
    };
  }

  async resolvePartNumber(partNo: string): Promise<string> {
    const normalized = this.normalizePartNumber(partNo);
    if (!normalized) return partNo;

    const resolved = await db("DB-A-10-10", (p) =>
      p.supersessionResolved.findFirst({
        where: { originalPartNo: normalized },
      }),
    );

    if (resolved) {
      return resolved.latestPartNo;
    }

    const allSupersessions = await db("DB-A-10-10", (p) => p.supersession.findMany());
    const supersessionMap = new Map<string, string>();
    for (const link of allSupersessions) {
      supersessionMap.set(link.originalPartCode, link.replacementPartCode);
    }

    const result = this.resolveChain(normalized, supersessionMap);
    return result.latestPartNo;
  }
}
