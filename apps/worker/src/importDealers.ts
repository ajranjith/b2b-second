import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../packages/db/.env") });
import * as XLSX from "xlsx";
import * as crypto from "crypto";
import * as fs from "fs";
import { ImportType, db, disconnectWorkerPrisma } from "./lib/prisma";
import { DealerImportService } from "./services/DealerImportService";
import { withJobEnvelope } from "./lib/withJobEnvelope";

interface ImportArgs {
  file: string;
}

function parseArgs(): ImportArgs {
  const args = process.argv.slice(2);
  const fileIndex = args.indexOf("--file");

  if (fileIndex === -1) {
    console.error("Usage: ts-node importDealers.ts --file <path-to-xlsx>");
    console.error("Example: ts-node importDealers.ts --file /mnt/data/Dealer_Accounts.xlsx");
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
    jobId: "JOB-A-IMPORT-DEALERS",
    featureId: "REF-A-06",
    operationId: "API-A-06-02",
  },
  async (_ctx, { file }) => {
    console.log("==============================================================");
    console.log("DEALER ACCOUNT IMPORTER");
    console.log("==============================================================");
    console.log(`   File: ${file}\n`);

    const filePath = path.isAbsolute(file) ? file : path.resolve(process.cwd(), file);
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      process.exit(1);
    }

    const fileHash = calculateFileHash(filePath);
    console.log(`File hash: ${fileHash.substring(0, 16)}...`);

    const importService = new DealerImportService();

    console.log("\nCreating import batch...");
    const batch = await importService.createBatch(
      ImportType.DEALERS,
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
        columnValidation.missing.forEach((col) => console.error(`   - ${col}`));

        await importService.markBatchFailed(
          batch.id,
          new Error(`Missing required columns: ${columnValidation.missing.join(", ")}`),
        );
        process.exit(1);
      }

      console.log("All required columns present");

      await db("DB-A-10-04", (p) =>
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

        await db("DB-A-10-02", (p) =>
          p.stgDealerAccountRow.create({
            data: {
              batchId: parsedRow.batchId,
              rowNumber: parsedRow.rowNumber,
              accountNo: parsedRow.accountNo,
              companyName: parsedRow.companyName,
              firstName: parsedRow.firstName,
              lastName: parsedRow.lastName,
              email: parsedRow.email,
              status: parsedRow.status,
              defaultShippingMethod: parsedRow.defaultShippingMethod,
              shippingNotes: parsedRow.shippingNotes,
              genuineTier: parsedRow.genuineTier,
              aftermarketEsTier: parsedRow.aftermarketEsTier,
              aftermarketBrTier: parsedRow.aftermarketBrTier,
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

        if ((i + 1) % 10 === 0) {
          console.log(
            `Processed ${i + 1}/${rows.length} rows (${validCount} valid, ${invalidCount} invalid)`,
          );
        }
      }

      console.log(`\nRow validation complete:`);
      console.log(`   Total: ${rows.length}`);
      console.log(`   Valid: ${validCount}`);
      console.log(`   Invalid: ${invalidCount}`);

      if (validCount === 0) {
        console.error("\nNo valid rows to process");
        await importService.finishBatch(batch.id, {
          total: rows.length,
          valid: validCount,
          invalid: invalidCount,
        });
        process.exit(1);
      }

      console.log("\nUpserting dealer accounts into database...");
      const processedCount = await importService.processValidRows(batch.id);

      await importService.finishBatch(batch.id, {
        total: rows.length,
        valid: validCount,
        invalid: invalidCount,
      });

      console.log("\nVerifying tier assignments...");
      const tierCounts = await db("DB-A-10-07", (p) =>
        p.dealerPriceTierAssignment.groupBy({
          by: ["accountNo"],
          _count: { _all: true },
        }),
      );
      const dealersWithComplete3Tiers = tierCounts.filter((dealer) => dealer._count._all === 3);

      console.log("\n==============================================================");
      console.log("FINAL IMPORT REPORT");
      console.log("==============================================================");
      console.log(`Import Batch ID:        ${batch.id}`);
      console.log(`Total Rows:             ${rows.length}`);
      console.log(`Valid Rows:             ${validCount}`);
      console.log(`Invalid Rows:           ${invalidCount}`);
      console.log(`Processed:              ${processedCount}`);
      console.log(`Dealers Created/Updated: ${processedCount}`);
      console.log(`Dealers with 3 Tiers:   ${dealersWithComplete3Tiers.length}`);

      const finalBatch = await db("DB-A-10-04", (p) =>
        p.importBatch.findUnique({
          where: { id: batch.id },
        }),
      );
      console.log(`Final Status:           ${finalBatch?.status}`);
      console.log("==============================================================\n");

      if (invalidCount > 0) {
        console.log("Some rows had validation errors. Check ImportError table for details.");
        console.log(`Query: SELECT * FROM "ImportError" WHERE "batchId" = '${batch.id}';\n`);
      }

      console.log("Import completed successfully!");
      console.log("Dealer accounts and tier assignments have been created/updated.\n");
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
