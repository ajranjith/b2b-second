import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../packages/db/.env") });
import * as XLSX from "xlsx";
import * as crypto from "crypto";
import * as fs from "fs";
import { ImportType, ImportStatus, db, disconnectWorkerPrisma } from "./lib/prisma";
import { withJobEnvelope } from "./lib/withJobEnvelope";
import { ProductImportService } from "./services/ProductImportService";
import { QUERIES } from "@repo/identity";

interface ImportArgs {
  file: string;
}

function parseArgs(): ImportArgs {
  const args = process.argv.slice(2);
  const fileIndex = args.indexOf("--file");

  if (fileIndex === -1) {
    console.error("Usage: ts-node importProductsDGS.ts --file <path-to-xlsx>");
    console.error(
      "Example: ts-node importProductsDGS.ts --file /mnt/data/DGS_Sample_150_GN_ES_BR.xlsx",
    );
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

const runImport = withJobEnvelope<ImportArgs, void>(
  {
    namespace: "A",
    jobId: "JOB-A-IMPORT-PRODUCTS-DGS",
    featureId: "REF-A-06",
    operationId: "API-A-06-02",
  },
  async (_ctx, { file }) => {
    console.log("DGS PRODUCT/PRICING/STOCK IMPORTER");
    console.log(`File: ${file}\n`);

    const filePath = path.isAbsolute(file) ? file : path.resolve(process.cwd(), file);

    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      process.exit(1);
    }

    const fileHash = calculateFileHash(filePath);
    console.log(`File hash: ${fileHash.substring(0, 16)}...`);

    const importService = new ProductImportService();

    console.log("Creating import batch...");
    const batch = await importService.createBatch(
      ImportType.PRODUCTS_MIXED,
      path.basename(filePath),
      fileHash,
      filePath,
    );
    console.log(`Import batch created: ${batch.id}`);

    try {
      console.log("Parsing Excel file...");
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet);

      console.log(`Found ${rows.length} rows`);

      console.log("Validating columns...");
      const headers =
        rows.length > 0 ? Object.keys(rows[0] as Record<string, unknown>) : [];
      const columnValidation = importService.validateColumns(headers);

      if (!columnValidation.valid) {
        console.error("Missing required columns:");
        columnValidation.missing.forEach((col) => console.error(`- ${col}`));

        await importService.markBatchFailed(
          batch.id,
          new Error(`Missing required columns: ${columnValidation.missing.join(", ")}`),
        );

        process.exit(1);
      }

      console.log("All required columns present");

      await db(QUERIES.IMPORT_BATCH_STATUS_UPDATE, (p) =>
        p.importBatch.update({
          where: { id: batch.id },
          data: { totalRows: rows.length },
        }),
      );

      let validCount = 0;
      let invalidCount = 0;

      console.log("Processing rows...");

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i] as any;
        const rowNumber = i + 2;

        const parsedRow = importService.parseRow(row, batch.id, rowNumber);

        await db(QUERIES.IMPORT_STAGING_ROWS_INSERT, (p) =>
          p.stgProductPriceRow.create({
            data: {
              batchId: parsedRow.batchId,
              rowNumber: parsedRow.rowNumber,
              partType: parsedRow.partType,
              supplier: parsedRow.supplier,
              productCode: parsedRow.productCode,
              description: parsedRow.description,
              discountCode: parsedRow.discountCode,
              freeStock: parsedRow.freeStock,
              band1Price: parsedRow.net1Price,
              band2Price: parsedRow.net2Price,
              band3Price: parsedRow.net3Price,
              band4Price: parsedRow.net4Price,
              isValid: parsedRow.isValid,
              validationErrors: parsedRow.validationErrors,
              rawRowJson: parsedRow.rawRowJson,
            },
          }),
        );

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

        if ((i + 1) % 25 === 0) {
          console.log(
            `Processed ${i + 1}/${rows.length} rows (${validCount} valid, ${invalidCount} invalid)`,
          );
        }
      }

      console.log("Row validation complete:");
      console.log(`Total: ${rows.length}`);
      console.log(`Valid: ${validCount}`);
      console.log(`Invalid: ${invalidCount}`);

      if (validCount === 0) {
        console.error("No valid rows to process");
        await importService.finishBatch(batch.id, {
          total: rows.length,
          valid: validCount,
          invalid: invalidCount,
        });
        process.exit(1);
      }

      console.log("Upserting products into database...");
      const processedCount = await importService.processValidRows(batch.id);

      await importService.finishBatch(batch.id, {
        total: rows.length,
        valid: validCount,
        invalid: invalidCount,
      });

      const finalStatus =
        invalidCount === 0
          ? ImportStatus.SUCCEEDED
          : validCount === 0
            ? ImportStatus.FAILED
            : ImportStatus.SUCCEEDED_WITH_ERRORS;

      console.log("FINAL IMPORT REPORT");
      console.log(`Import Batch ID: ${batch.id}`);
      console.log(`Total Rows:      ${rows.length}`);
      console.log(`Valid Rows:      ${validCount}`);
      console.log(`Invalid Rows:    ${invalidCount}`);
      console.log(`Processed:       ${processedCount}`);
      console.log(`Final Status:    ${finalStatus}`);

      if (invalidCount > 0) {
        console.log("Some rows had validation errors. Check ImportError table for details.");
        console.log(`Query: SELECT * FROM "ImportError" WHERE "batchId" = '${batch.id}';`);
      }

      console.log("Import completed successfully.");
      console.log("Portal search should now show these products.");
    } catch (error) {
      console.error("Import failed:", error);
      await importService.markBatchFailed(batch.id, error as Error);
      throw error;
    }
  },
);

async function main() {
  const args = parseArgs();
  await runImport(args);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectWorkerPrisma();
  });