/**
 * Example: Dealer Import with Identity Envelope
 *
 * This demonstrates the proper way to write worker jobs using the Identity Framework.
 * All database access goes through the scoped db(dbId, fn) runner, ensuring:
 * - Every operation has a registered DB-ID
 * - Namespace isolation is enforced
 * - Full traceability in logs
 *
 * Usage:
 *   pnpm tsx apps/worker/src/examples/importDealersWithEnvelope.ts --file /path/to/dealers.xlsx
 */

import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import * as crypto from "crypto";
import * as XLSX from "xlsx";

dotenv.config({ path: path.resolve(__dirname, "../../../../packages/db/.env") });

import { ImportType, ImportStatus, Prisma, db, disconnectWorkerPrisma } from "../lib/prisma";
import { withJobEnvelope } from "../lib/withJobEnvelope";
import { QUERIES } from "@repo/identity";

interface ImportInput {
  file: string;
}

interface ImportResult {
  batchId: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  processedCount: number;
}

const importDealers = withJobEnvelope<ImportInput, ImportResult>(
  {
    namespace: "A",
    jobId: "JOB-A-IMPORT-DEALERS",
    featureId: "REF-A-06",
    operationId: "API-A-06-02",
  },
  async (ctx, input) => {
    const { file } = input;
    const { log } = ctx;

    const filePath = path.isAbsolute(file) ? file : path.resolve(process.cwd(), file);

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const fileBuffer = fs.readFileSync(filePath);
    const fileHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
    log.info("File hash calculated", { fileHash: fileHash.substring(0, 16) });

    log.info("Creating import batch");
    const batch = await db(QUERIES.IMPORT_BATCH_CREATE, (p) =>
      p.importBatch.create({
        data: {
          importType: ImportType.DEALERS,
          fileName: path.basename(filePath),
          fileHash,
          filePath,
          status: ImportStatus.PROCESSING,
        },
      }),
    );
    log.info("Import batch created", { batchId: batch.id });

    try {
      log.info("Parsing Excel file");
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);
      log.info("Excel parsed", { rowCount: rows.length });

      const requiredColumns = ["Account No", "Company Name", "Email"];
      const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
      const missingColumns = requiredColumns.filter((col) => !headers.includes(col));

      if (missingColumns.length > 0) {
        throw new Error(`Missing required columns: ${missingColumns.join(", ")}`);
      }

      await db(QUERIES.IMPORT_BATCH_STATUS_UPDATE, (p) =>
        p.importBatch.update({
          where: { id: batch.id },
          data: { totalRows: rows.length },
        }),
      );

      let validCount = 0;
      let invalidCount = 0;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i] as Record<string, unknown>;
        const rowNumber = i + 2;

        const accountNo = String(row["Account No"] ?? "").trim();
        const companyName = String(row["Company Name"] ?? "").trim();
        const email = String(row["Email"] ?? "").trim().toLowerCase();

        const errors: string[] = [];
        if (!accountNo) errors.push("Account No is required");
        if (!companyName) errors.push("Company Name is required");
        if (!email) errors.push("Email is required");
        if (email && !email.includes("@")) errors.push("Invalid email format");

        const isValid = errors.length === 0;

        await db(QUERIES.IMPORT_STAGING_ROWS_INSERT, (p) =>
          p.stgDealerAccountRow.create({
            data: {
              batchId: batch.id,
              rowNumber,
              accountNo: accountNo || null,
              companyName: companyName || null,
              email: email || null,
              firstName: String(row["First Name"] ?? "").trim() || null,
              lastName: String(row["Last Name"] ?? "").trim() || null,
              status: String(row["Status"] ?? "ACTIVE").trim() || null,
              defaultShippingMethod: String(row["Shipping Method"] ?? "").trim() || null,
              shippingNotes: String(row["Shipping Notes"] ?? "").trim() || null,
              genuineTier: String(row["Genuine Tier"] ?? "").trim() || null,
              aftermarketEsTier: String(row["ES Tier"] ?? "").trim() || null,
              aftermarketBrTier: String(row["BR Tier"] ?? "").trim() || null,
              isValid,
              validationErrors: errors.length > 0 ? errors.join("; ") : null,
              rawRowJson: row as Prisma.InputJsonValue,
            },
          }),
        );

        if (isValid) {
          validCount++;
        } else {
          invalidCount++;

          await db(QUERIES.IMPORT_ERRORS_LOG, (p) =>
            p.importError.create({
              data: {
                batchId: batch.id,
                rowNumber,
                errorCode: "VALIDATION_ERROR",
                errorMessage: errors.join("; "),
                rawRowJson: row as Prisma.InputJsonValue,
              },
            }),
          );
        }

        if ((i + 1) % 100 === 0) {
          log.info("Processing progress", {
            processed: i + 1,
            total: rows.length,
            valid: validCount,
            invalid: invalidCount,
          });
        }
      }

      log.info("Row validation complete", { valid: validCount, invalid: invalidCount });

      if (validCount === 0) {
        await db(QUERIES.IMPORT_BATCH_STATUS_UPDATE, (p) =>
          p.importBatch.update({
            where: { id: batch.id },
            data: {
              status: ImportStatus.FAILED,
              completedAt: new Date(),
              validRows: validCount,
              invalidRows: invalidCount,
            },
          }),
        );
        throw new Error("No valid rows to process");
      }

      log.info("Upserting dealer accounts");

      const validStgRows = await db(QUERIES.IMPORT_STAGING_ROWS_INSERT, (p) =>
        p.stgDealerAccountRow.findMany({
          where: { batchId: batch.id, isValid: true },
        }),
      );

      let processedCount = 0;

      for (const stgRow of validStgRows) {
        const dealerAccount = await db(QUERIES.IMPORT_DEALER_ACCOUNTS_UPSERT, (p) =>
          p.dealerAccount.upsert({
            where: { accountNo: stgRow.accountNo! },
            create: {
              accountNo: stgRow.accountNo!,
              companyName: stgRow.companyName!,
              status: stgRow.status === "ACTIVE" ? "ACTIVE" : "INACTIVE",
              defaultShippingMethod: stgRow.defaultShippingMethod,
              shippingNotes: stgRow.shippingNotes,
            },
            update: {
              companyName: stgRow.companyName!,
              defaultShippingMethod: stgRow.defaultShippingMethod,
              shippingNotes: stgRow.shippingNotes,
            },
          }),
        );

        if (stgRow.genuineTier) {
          await db(QUERIES.IMPORT_DEALER_TIERS_UPSERT, (p) =>
            p.dealerPriceTierAssignment.upsert({
              where: {
                accountNo_categoryCode: {
                  accountNo: dealerAccount.accountNo,
                  categoryCode: "GN",
                },
              },
              create: {
                accountNo: dealerAccount.accountNo,
                categoryCode: "GN",
                netTier: stgRow.genuineTier!,
              },
              update: {
                netTier: stgRow.genuineTier!,
              },
            }),
          );
        }

        if (stgRow.aftermarketEsTier) {
          await db(QUERIES.IMPORT_DEALER_TIERS_UPSERT, (p) =>
            p.dealerPriceTierAssignment.upsert({
              where: {
                accountNo_categoryCode: {
                  accountNo: dealerAccount.accountNo,
                  categoryCode: "ES",
                },
              },
              create: {
                accountNo: dealerAccount.accountNo,
                categoryCode: "ES",
                netTier: stgRow.aftermarketEsTier!,
              },
              update: {
                netTier: stgRow.aftermarketEsTier!,
              },
            }),
          );
        }

        if (stgRow.aftermarketBrTier) {
          await db(QUERIES.IMPORT_DEALER_TIERS_UPSERT, (p) =>
            p.dealerPriceTierAssignment.upsert({
              where: {
                accountNo_categoryCode: {
                  accountNo: dealerAccount.accountNo,
                  categoryCode: "BR",
                },
              },
              create: {
                accountNo: dealerAccount.accountNo,
                categoryCode: "BR",
                netTier: stgRow.aftermarketBrTier!,
              },
              update: {
                netTier: stgRow.aftermarketBrTier!,
              },
            }),
          );
        }

        processedCount++;
      }

      await db(QUERIES.IMPORT_BATCH_STATUS_UPDATE, (p) =>
        p.importBatch.update({
          where: { id: batch.id },
          data: {
            status: invalidCount > 0 ? ImportStatus.SUCCEEDED_WITH_ERRORS : ImportStatus.SUCCEEDED,
            completedAt: new Date(),
            validRows: validCount,
            invalidRows: invalidCount,
            successCount: processedCount,
            errorCount: invalidCount,
          },
        }),
      );

      log.info("Import completed", { processedCount });

      return {
        batchId: batch.id,
        totalRows: rows.length,
        validRows: validCount,
        invalidRows: invalidCount,
        processedCount,
      };
    } catch (error) {
      await db(QUERIES.IMPORT_BATCH_STATUS_UPDATE, (p) =>
        p.importBatch.update({
          where: { id: batch.id },
          data: {
            status: ImportStatus.FAILED,
            completedAt: new Date(),
          },
        }),
      );
      throw error;
    }
  }
);

function parseArgs(): ImportInput {
  const args = process.argv.slice(2);
  const fileIndex = args.indexOf("--file");

  if (fileIndex === -1 || !args[fileIndex + 1]) {
    console.error("Usage: tsx importDealersWithEnvelope.ts --file <path-to-xlsx>");
    process.exit(1);
  }

  return { file: args[fileIndex + 1] };
}

async function main() {
  console.log("DEALER IMPORT (with Identity Envelope)");

  const input = parseArgs();
  console.log(`File: ${input.file}\n`);

  try {
    const result = await importDealers(input);

    console.log("IMPORT REPORT");
    console.log(`Batch ID:    ${result.batchId}`);
    console.log(`Total Rows:  ${result.totalRows}`);
    console.log(`Valid:       ${result.validRows}`);
    console.log(`Invalid:     ${result.invalidRows}`);
    console.log(`Processed:   ${result.processedCount}`);

    if (result.invalidRows > 0) {
      console.log("Check ImportError table for details:");
      console.log(`SELECT * FROM "ImportError" WHERE "batchId" = '${result.batchId}';`);
    }

    console.log("Import completed successfully!");
  } catch (error) {
    console.error("Import failed:", error);
    process.exit(1);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectWorkerPrisma();
  });