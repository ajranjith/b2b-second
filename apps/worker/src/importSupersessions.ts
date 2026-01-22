import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../packages/db/.env") });
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, ImportType } from "@prisma/client";
import * as XLSX from "xlsx";
import * as crypto from "crypto";
import * as fs from "fs";
import { SupersessionImportService } from "./services/SupersessionImportService";

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

interface ImportArgs {
  file: string;
}

function parseArgs(): ImportArgs {
  const args = process.argv.slice(2);
  const fileIndex = args.indexOf("--file");

  if (fileIndex === -1) {
    console.error("Usage: ts-node importSupersessions.ts --file <path-to-xlsx>");
    process.exit(1);
  }

  const file = args[fileIndex + 1];

  if (!file) {
    console.error("File path is required");
    process.exit(1);
  }

  return { file };
}

function calculateFileHash(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash("sha256");
  hashSum.update(fileBuffer);
  return hashSum.digest("hex");
}

async function main() {
  const { file } = parseArgs();

  console.log("==============================================");
  console.log("SUPERSESSION IMPORTER");
  console.log("==============================================");
  console.log(`File: ${file}\n`);

  const filePath = path.isAbsolute(file) ? file : path.resolve(process.cwd(), file);

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const fileHash = calculateFileHash(filePath);
  console.log(`File hash: ${fileHash.substring(0, 16)}...`);

  const importService = new SupersessionImportService(prisma);

  console.log("\nCreating import batch...");
  const batch = await importService.createBatch(
    ImportType.SUPERSESSION,
    path.basename(filePath),
    fileHash,
    filePath,
  );
  console.log(`Import batch created: ${batch.id}`);

  try {
    console.log("\nParsing Excel file...");
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

    console.log(`Found ${rows.length} rows`);

    console.log("\nValidating columns...");
    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
    const columnValidation = importService.validateColumns(headers);

    if (!columnValidation.valid) {
      console.error("Missing required columns:");
      columnValidation.missing.forEach((col) => console.error(`  - ${col}`));

      await importService.markBatchFailed(
        batch.id,
        new Error(`Missing required columns: ${columnValidation.missing.join(", ")}`),
      );

      process.exit(1);
    }

    console.log("All required columns present");

    await prisma.importBatch.update({
      where: { id: batch.id },
      data: { totalRows: rows.length },
    });

    let validCount = 0;
    let invalidCount = 0;

    console.log("\nProcessing rows...");

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] as any;
      const rowNumber = i + 2;

      const parsedRow = importService.parseRow(row, batch.id, rowNumber);

      await prisma.stgSupersessionRow.create({
        data: {
          batchId: parsedRow.batchId,
          rowNumber: parsedRow.rowNumber,
          originalPartCode: parsedRow.originalPartCode,
          replacementPartCode: parsedRow.replacementPartCode,
          note: parsedRow.note,
          isValid: parsedRow.isValid,
          validationErrors: parsedRow.validationErrors,
          rawRowJson: parsedRow.rawRowJson,
        },
      });

      if (parsedRow.isValid) {
        validCount++;
      } else {
        invalidCount++;
        await importService.logError(
          batch.id,
          rowNumber,
          parsedRow.validationErrors || "Validation failed",
          undefined,
          "VALIDATION_ERROR",
          row,
        );
      }

      if ((i + 1) % 100 === 0) {
        console.log(
          `Processed ${i + 1}/${rows.length} rows (${validCount} valid, ${invalidCount} invalid)`,
        );
      }
    }

    console.log(
      `\nRow validation complete: total=${rows.length} valid=${validCount} invalid=${invalidCount}`,
    );

    if (validCount === 0) {
      console.error("No valid rows to process");
      await importService.finishBatch(batch.id, {
        total: rows.length,
        valid: validCount,
        invalid: invalidCount,
      });
      process.exit(1);
    }

    console.log("\nProcessing supersessions (UPSERT + resolve chains)...");
    const processedCount = await importService.processValidRows(batch.id);

    await importService.finishBatch(batch.id, {
      total: rows.length,
      valid: validCount,
      invalid: invalidCount,
    });

    console.log("\nGenerating statistics...");

    const totalSupersessions = await prisma.supersession.count();
    const totalResolved = await prisma.supersessionResolved.count();
    const avgDepth = await prisma.supersessionResolved.aggregate({
      _avg: { depth: true },
    });
    const maxDepth = await prisma.supersessionResolved.aggregate({
      _max: { depth: true },
    });

    console.log("\n==============================================");
    console.log("FINAL IMPORT REPORT");
    console.log("==============================================");
    console.log(`Import Batch ID:          ${batch.id}`);
    console.log(`Total Rows:               ${rows.length}`);
    console.log(`Valid Rows:               ${validCount}`);
    console.log(`Invalid Rows:             ${invalidCount}`);
    console.log(`Processed:                ${processedCount}`);
    console.log("\nSupersession Statistics:");
    console.log(`Raw Links:                ${totalSupersessions}`);
    console.log(`Resolved Chains:          ${totalResolved}`);
    console.log(`Avg Chain Depth:          ${avgDepth._avg.depth?.toFixed(2) || 0}`);
    console.log(`Max Chain Depth:          ${maxDepth._max.depth || 0}`);

    const finalBatch = await prisma.importBatch.findUnique({
      where: { id: batch.id },
    });
    console.log(`Final Status:             ${finalBatch?.status}\n`);

    if (invalidCount > 0) {
      console.log("Some rows had validation errors. Check ImportError table for details.");
      console.log(`Query: SELECT * FROM "ImportError" WHERE "batchId" = '${batch.id}';\n`);
    }

    console.log("Import completed successfully.");
  } catch (error) {
    console.error("\nImport failed:", error);
    await importService.markBatchFailed(batch.id, error as Error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
