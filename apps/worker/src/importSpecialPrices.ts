import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../packages/db/.env") });
import * as XLSX from "xlsx";
import * as crypto from "crypto";
import * as fs from "fs";
import { ImportType, db, disconnectWorkerPrisma } from "./lib/prisma";
import { SpecialPriceImportService } from "./services/SpecialPriceImportService";
import { withJobEnvelope } from "./lib/withJobEnvelope";
import { QUERIES } from "@repo/identity";

interface ImportArgs {
  file: string;
  startDate: string;
  endDate: string;
}

function parseArgs(): ImportArgs {
  const args = process.argv.slice(2);
  const fileIndex = args.indexOf("--file");
  const startDateIndex = args.indexOf("--start-date");
  const endDateIndex = args.indexOf("--end-date");

  if (fileIndex === -1 || startDateIndex === -1 || endDateIndex === -1) {
    console.error(
      "Usage: ts-node importSpecialPrices.ts --file <path-to-xlsx> --start-date <YYYY-MM-DD> --end-date <YYYY-MM-DD>",
    );
    process.exit(1);
  }

  const file = args[fileIndex + 1];
  const startDate = args[startDateIndex + 1];
  const endDate = args[endDateIndex + 1];

  if (!file) {
    console.error("File path is required");
    process.exit(1);
  }

  if (!startDate || !endDate) {
    console.error("Start date and end date are required (format: YYYY-MM-DD)");
    process.exit(1);
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
    console.error("Invalid date format. Use YYYY-MM-DD");
    process.exit(1);
  }

  return { file, startDate, endDate };
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
    jobId: "JOB-A-IMPORT-SPECIAL-PRICES",
    featureId: "REF-A-06",
    operationId: "API-A-06-02",
  },
  async (_ctx, { file, startDate, endDate }) => {
    console.log("==============================================");
    console.log("SPECIAL PRICE IMPORTER");
    console.log("==============================================");
    console.log(`File:       ${file}`);
    console.log(`Start Date: ${startDate}`);
    console.log(`End Date:   ${endDate}\n`);

    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    if (parsedStartDate >= parsedEndDate) {
      console.error("Start date must be before end date");
      process.exit(1);
    }

    const filePath = path.isAbsolute(file) ? file : path.resolve(process.cwd(), file);

    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      process.exit(1);
    }

    const fileHash = calculateFileHash(filePath);
    console.log(`File hash: ${fileHash.substring(0, 16)}...`);

    const importService = new SpecialPriceImportService({
      startDate: parsedStartDate,
      endDate: parsedEndDate,
    });

    console.log("\nCreating import batch...");
    const batch = await importService.createBatch(
      ImportType.SPECIAL_PRICES,
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

      await db(QUERIES.IMPORT_BATCH_STATUS_UPDATE, (p) =>
        p.importBatch.update({
          where: { id: batch.id },
          data: { totalRows: rows.length },
        }),
      );

      let validCount = 0;
      let invalidCount = 0;

      console.log("\nProcessing rows...");
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i] as any;
        const rowNumber = i + 2;

        const parsedRow = importService.parseRow(row, batch.id, rowNumber);

        await db(QUERIES.IMPORT_STAGING_ROWS_INSERT, (p) =>
          p.stgSpecialPriceRow.create({
            data: {
              batchId: parsedRow.batchId,
              rowNumber: parsedRow.rowNumber,
              productCode: parsedRow.productCode,
              discountCode: parsedRow.discountCode,
              description: parsedRow.description,
              discountPrice: parsedRow.discountPrice,
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

        if ((i + 1) % 50 === 0) {
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

      console.log("\nUpserting special prices...");
      const processedCount = await importService.processValidRows(batch.id);

      await importService.finishBatch(batch.id, {
        total: rows.length,
        valid: validCount,
        invalid: invalidCount,
      });

      console.log("\nGenerating statistics...");
      const totalSpecialPrices = await db(QUERIES.IMPORT_SPECIAL_PRICES_UPSERT, (p) => p.specialPrice.count());
      const activeSpecialPrices = await db(QUERIES.IMPORT_SPECIAL_PRICES_UPSERT, (p) =>
        p.specialPrice.count({
          where: {
            startsAt: { lte: new Date() },
            endsAt: { gte: new Date() },
          },
        }),
      );

      const thisRangeCount = await db(QUERIES.IMPORT_SPECIAL_PRICES_UPSERT, (p) =>
        p.specialPrice.count({
          where: {
            startsAt: parsedStartDate,
            endsAt: parsedEndDate,
          },
        }),
      );

      console.log("\n==============================================");
      console.log("FINAL IMPORT REPORT");
      console.log("==============================================");
      console.log(`Import Batch ID:          ${batch.id}`);
      console.log(`Total Rows:               ${rows.length}`);
      console.log(`Valid Rows:               ${validCount}`);
      console.log(`Invalid Rows:             ${invalidCount}`);
      console.log(`Processed:                ${processedCount}`);
      console.log("\nSpecial Price Statistics:");
      console.log(`Total Special Prices:     ${totalSpecialPrices}`);
      console.log(`Active Today:             ${activeSpecialPrices}`);
      console.log(`This Date Range:          ${thisRangeCount}`);
      console.log(`Date Range:               ${startDate} to ${endDate}`);

      const finalBatch = await db(QUERIES.IMPORT_BATCH_STATUS_UPDATE, (p) =>
        p.importBatch.findUnique({
          where: { id: batch.id },
        }),
      );
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
  },
);

async function main() {
  const args = parseArgs();
  await runImport(args);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectWorkerPrisma();
  });