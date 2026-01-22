/**
 * Example: Dealer Import with Identity Envelope
 *
 * This demonstrates the proper way to write worker jobs using the Identity Framework.
 * All database access goes through the scoped db(dbId) runner, ensuring:
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

// Load env before any other imports
dotenv.config({ path: path.resolve(__dirname, "../../../../packages/db/.env") });

import { ImportType, ImportStatus } from "@prisma/client";
import { withJobEnvelope, db, disconnectWorkerPrisma } from "../lib/withJobEnvelope";

// =============================================================================
// Types
// =============================================================================

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

// =============================================================================
// Job Definition
// =============================================================================

/**
 * Import dealers from Excel file
 *
 * DB-IDs used:
 * - DB-A-IMPORT-01: Create import batch
 * - DB-A-IMPORT-02: Insert staging rows
 * - DB-A-IMPORT-03: Log import errors
 * - DB-A-IMPORT-04: Update batch status
 * - DB-A-IMPORT-05: Upsert dealer accounts
 * - DB-A-IMPORT-06: Upsert dealer users
 * - DB-A-IMPORT-07: Upsert tier assignments
 */
const importDealers = withJobEnvelope<ImportInput, ImportResult>(
  {
    namespace: "A",
    jobId: "JOB-A-IMPORT-DEALERS",
    featureId: "REF-A-IMPORTS",
    operationId: "API-A-IMPORT-DEALERS",
  },
  async (ctx, input) => {
    const { file } = input;
    const { log } = ctx;

    // Resolve file path
    const filePath = path.isAbsolute(file) ? file : path.resolve(process.cwd(), file);

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Calculate file hash
    const fileBuffer = fs.readFileSync(filePath);
    const fileHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
    log.info("File hash calculated", { fileHash: fileHash.substring(0, 16) });

    // Step 1: Create import batch
    log.info("Creating import batch");
    const batch = await db("DB-A-IMPORT-01").importBatch.create({
      data: {
        importType: ImportType.DEALERS,
        fileName: path.basename(filePath),
        fileHash,
        filePath,
        status: ImportStatus.PROCESSING,
      },
    });
    log.info("Import batch created", { batchId: batch.id });

    try {
      // Step 2: Parse Excel file
      log.info("Parsing Excel file");
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);
      log.info("Excel parsed", { rowCount: rows.length });

      // Step 3: Validate columns
      const requiredColumns = ["Account No", "Company Name", "Email"];
      const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
      const missingColumns = requiredColumns.filter((col) => !headers.includes(col));

      if (missingColumns.length > 0) {
        throw new Error(`Missing required columns: ${missingColumns.join(", ")}`);
      }

      // Update total rows
      await db("DB-A-IMPORT-04").importBatch.update({
        where: { id: batch.id },
        data: { totalRows: rows.length },
      });

      let validCount = 0;
      let invalidCount = 0;

      // Step 4: Process each row
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i] as Record<string, unknown>;
        const rowNumber = i + 2; // Excel rows start at 1, header is row 1

        // Validate row
        const accountNo = String(row["Account No"] ?? "").trim();
        const companyName = String(row["Company Name"] ?? "").trim();
        const email = String(row["Email"] ?? "").trim().toLowerCase();

        const errors: string[] = [];
        if (!accountNo) errors.push("Account No is required");
        if (!companyName) errors.push("Company Name is required");
        if (!email) errors.push("Email is required");
        if (email && !email.includes("@")) errors.push("Invalid email format");

        const isValid = errors.length === 0;

        // Insert into staging table
        await db("DB-A-IMPORT-02").stgDealerAccountRow.create({
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
            rawRowJson: row,
          },
        });

        if (isValid) {
          validCount++;
        } else {
          invalidCount++;

          // Log validation error
          await db("DB-A-IMPORT-03").importError.create({
            data: {
              batchId: batch.id,
              rowNumber,
              errorCode: "VALIDATION_ERROR",
              errorMessage: errors.join("; "),
              rawRowJson: row,
            },
          });
        }

        // Progress log every 100 rows
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
        await db("DB-A-IMPORT-04").importBatch.update({
          where: { id: batch.id },
          data: {
            status: ImportStatus.FAILED,
            completedAt: new Date(),
            validRows: validCount,
            invalidRows: invalidCount,
          },
        });
        throw new Error("No valid rows to process");
      }

      // Step 5: Process valid rows (UPSERT into main tables)
      log.info("Upserting dealer accounts");

      const validStgRows = await db("DB-A-IMPORT-02").stgDealerAccountRow.findMany({
        where: { batchId: batch.id, isValid: true },
      });

      let processedCount = 0;

      for (const stgRow of validStgRows) {
        // Upsert dealer account
        const dealerAccount = await db("DB-A-IMPORT-05").dealerAccount.upsert({
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
        });

        // Handle tier assignments if provided
        if (stgRow.genuineTier) {
          await db("DB-A-IMPORT-07").dealerPriceTierAssignment.upsert({
            where: {
              accountNo_categoryCode: {
                accountNo: dealerAccount.accountNo,
                categoryCode: "GN",
              },
            },
            create: {
              accountNo: dealerAccount.accountNo,
              categoryCode: "GN",
              netTier: stgRow.genuineTier,
            },
            update: {
              netTier: stgRow.genuineTier,
            },
          });
        }

        if (stgRow.aftermarketEsTier) {
          await db("DB-A-IMPORT-07").dealerPriceTierAssignment.upsert({
            where: {
              accountNo_categoryCode: {
                accountNo: dealerAccount.accountNo,
                categoryCode: "ES",
              },
            },
            create: {
              accountNo: dealerAccount.accountNo,
              categoryCode: "ES",
              netTier: stgRow.aftermarketEsTier,
            },
            update: {
              netTier: stgRow.aftermarketEsTier,
            },
          });
        }

        if (stgRow.aftermarketBrTier) {
          await db("DB-A-IMPORT-07").dealerPriceTierAssignment.upsert({
            where: {
              accountNo_categoryCode: {
                accountNo: dealerAccount.accountNo,
                categoryCode: "BR",
              },
            },
            create: {
              accountNo: dealerAccount.accountNo,
              categoryCode: "BR",
              netTier: stgRow.aftermarketBrTier,
            },
            update: {
              netTier: stgRow.aftermarketBrTier,
            },
          });
        }

        processedCount++;
      }

      // Step 6: Finalize batch
      await db("DB-A-IMPORT-04").importBatch.update({
        where: { id: batch.id },
        data: {
          status: invalidCount > 0 ? ImportStatus.SUCCEEDED_WITH_ERRORS : ImportStatus.SUCCEEDED,
          completedAt: new Date(),
          validRows: validCount,
          invalidRows: invalidCount,
          successCount: processedCount,
          errorCount: invalidCount,
        },
      });

      log.info("Import completed", { processedCount });

      return {
        batchId: batch.id,
        totalRows: rows.length,
        validRows: validCount,
        invalidRows: invalidCount,
        processedCount,
      };
    } catch (error) {
      // Mark batch as failed
      await db("DB-A-IMPORT-04").importBatch.update({
        where: { id: batch.id },
        data: {
          status: ImportStatus.FAILED,
          completedAt: new Date(),
        },
      });
      throw error;
    }
  }
);

// =============================================================================
// CLI Entry Point
// =============================================================================

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
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("DEALER IMPORT (with Identity Envelope)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const input = parseArgs();
  console.log(`File: ${input.file}\n`);

  try {
    const result = await importDealers(input);

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("IMPORT REPORT");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Batch ID:    ${result.batchId}`);
    console.log(`Total Rows:  ${result.totalRows}`);
    console.log(`Valid:       ${result.validRows}`);
    console.log(`Invalid:     ${result.invalidRows}`);
    console.log(`Processed:   ${result.processedCount}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    if (result.invalidRows > 0) {
      console.log(`Check ImportError table for details:`);
      console.log(`  SELECT * FROM "ImportError" WHERE "batchId" = '${result.batchId}';\n`);
    }

    console.log("Import completed successfully!");
  } catch (error) {
    console.error("\nImport failed:", error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectWorkerPrisma();
  });
