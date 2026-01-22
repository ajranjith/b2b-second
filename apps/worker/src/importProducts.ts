import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../packages/db/.env") });
import * as XLSX from "xlsx";
import * as crypto from "crypto";
import * as fs from "fs";
import { ImportStatus, ImportType, PartType, db, disconnectWorkerPrisma } from "./lib/prisma";
import { withJobEnvelope } from "./lib/withJobEnvelope";
import { QUERIES } from "@repo/identity";

interface ImportArgs {
  type: "GENUINE" | "AFTERMARKET" | "BRANDED";
  file: string;
}

interface ExcelRow {
  Supplier?: string;
  "Product Code"?: string;
  Description?: string;
  "Full Description"?: string;
  "Discount Code"?: string;
  "Cost Price"?: number;
  "Retail Price"?: number;
  "Trade Price"?: number;
  "List Price"?: number;
  "Band 1"?: number;
  "Band 2"?: number;
  "Band 3"?: number;
  "Band 4"?: number;
  "Free Stock"?: number;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

function parseArgs(): ImportArgs {
  const args = process.argv.slice(2);
  const typeIndex = args.indexOf("--type");
  const fileIndex = args.indexOf("--file");

  if (typeIndex === -1 || fileIndex === -1) {
    console.error(
      "Usage: ts-node importProducts.ts --type GENUINE|AFTERMARKET|BRANDED --file <path-to-xlsx>",
    );
    process.exit(1);
  }

  const type = args[typeIndex + 1] as "GENUINE" | "AFTERMARKET" | "BRANDED";
  const file = args[fileIndex + 1];

  if (!["GENUINE", "AFTERMARKET", "BRANDED"].includes(type)) {
    console.error("Type must be GENUINE, AFTERMARKET, or BRANDED");
    process.exit(1);
  }

  if (!file) {
    console.error("File path is required");
    process.exit(1);
  }

  return { type, file };
}

function calculateFileHash(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash("sha256");
  hashSum.update(fileBuffer);
  return hashSum.digest("hex");
}

function validateRow(row: ExcelRow): ValidationResult {
  const errors: string[] = [];

  if (!row["Product Code"] || row["Product Code"].trim() === "") {
    errors.push("Product Code is required");
  }

  const description = row.Description || row["Full Description"];
  if (!description || description.trim() === "") {
    errors.push("Description is required");
  }

  const priceFields = [
    "Cost Price",
    "Retail Price",
    "Trade Price",
    "List Price",
    "Band 1",
    "Band 2",
    "Band 3",
    "Band 4",
  ] as const;

  for (const field of priceFields) {
    const value = row[field];
    if (value !== undefined && value !== null && value < 0) {
      errors.push(`${field} cannot be negative`);
    }
  }

  if (row["Free Stock"] !== undefined && row["Free Stock"] !== null && row["Free Stock"] < 0) {
    errors.push("Free Stock cannot be negative");
  }

  return { isValid: errors.length === 0, errors };
}

function parseDecimal(value: any): number | null {
  if (value === undefined || value === null || value === "") return null;
  const num = typeof value === "number" ? value : parseFloat(value);
  return Number.isNaN(num) ? null : num;
}

function parseIntValue(value: any): number | null {
  if (value === undefined || value === null || value === "") return null;
  const num = typeof value === "number" ? value : Number(value);
  return Number.isNaN(num) ? null : Math.floor(num);
}

const runImport = withJobEnvelope<ImportArgs, void>(
  {
    namespace: "A",
    jobId: "JOB-A-IMPORT-PRODUCTS",
    featureId: "REF-A-06",
    operationId: "API-A-06-02",
  },
  async (_ctx, { type, file }) => {
    console.log("Product Import Worker");
    console.log(`Type: ${type}`);
    console.log(`File: ${file}\n`);

    const filePath = path.isAbsolute(file) ? file : path.resolve(process.cwd(), file);

    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      process.exit(1);
    }

    const fileHash = calculateFileHash(filePath);

    const importType =
      type === "GENUINE" ? ImportType.PRODUCTS_GENUINE : ImportType.PRODUCTS_AFTERMARKET;
    const partType =
      type === "GENUINE"
        ? PartType.GENUINE
        : type === "BRANDED"
          ? PartType.BRANDED
          : PartType.AFTERMARKET;

    const batch = await db(QUERIES.IMPORT_BATCH_CREATE, (p) =>
      p.importBatch.create({
        data: {
          importType,
          fileName: path.basename(filePath),
          fileHash,
          filePath,
          status: ImportStatus.PROCESSING,
          totalRows: 0,
          validRows: 0,
          invalidRows: 0,
        },
      }),
    );

    console.log(`Import batch created: ${batch.id}`);

    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);

      await db(QUERIES.IMPORT_BATCH_STATUS_UPDATE, (p) =>
        p.importBatch.update({
          where: { id: batch.id },
          data: { totalRows: rows.length },
        }),
      );

      let validCount = 0;
      let invalidCount = 0;
      let processedCount = 0;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + 2;
        const validation = validateRow(row);

        await db(QUERIES.IMPORT_STAGING_ROWS_INSERT, (p) =>
          p.stgProductPriceRow.create({
            data: {
              batchId: batch.id,
              rowNumber,
              partType,
              supplier: row.Supplier || null,
              productCode: row["Product Code"] || null,
              description: row.Description || row["Full Description"] || null,
              discountCode: row["Discount Code"] || null,
              costPrice: parseDecimal(row["Cost Price"]),
              retailPrice: parseDecimal(row["Retail Price"]),
              tradePrice: parseDecimal(row["Trade Price"]),
              listPrice: parseDecimal(row["List Price"]),
              band1Price: parseDecimal(row["Band 1"]),
              band2Price: parseDecimal(row["Band 2"]),
              band3Price: parseDecimal(row["Band 3"]),
              band4Price: parseDecimal(row["Band 4"]),
              freeStock: parseIntValue(row["Free Stock"]),
              isValid: validation.isValid,
              validationErrors: validation.errors.length > 0 ? validation.errors.join("; ") : null,
              rawRowJson: row as any,
            },
          }),
        );

        if (validation.isValid) {
          validCount++;

          await db(QUERIES.IMPORT_PRODUCTS_UPSERT, (p) =>
            p.$transaction(async (tx) => {
              const product = await tx.product.upsert({
                where: { productCode: row["Product Code"]! },
                update: {
                  supplier: row.Supplier || null,
                  description: (row.Description || row["Full Description"])!,
                  discountCode: row["Discount Code"] || null,
                  partType,
                  isActive: true,
                },
                create: {
                  productCode: row["Product Code"]!,
                  supplier: row.Supplier || null,
                  description: (row.Description || row["Full Description"])!,
                  discountCode: row["Discount Code"] || null,
                  partType,
                  isActive: true,
                },
              });

              if (row["Free Stock"] !== undefined && row["Free Stock"] !== null) {
                await tx.productStock.upsert({
                  where: { productId: product.id },
                  update: {
                    freeStock: row["Free Stock"],
                    lastImportBatchId: batch.id,
                  },
                  create: {
                    productId: product.id,
                    freeStock: row["Free Stock"],
                    lastImportBatchId: batch.id,
                  },
                });
              }

              await tx.productPriceReference.upsert({
                where: { productId: product.id },
                update: {
                  costPrice: parseDecimal(row["Cost Price"]),
                  retailPrice: parseDecimal(row["Retail Price"]),
                  tradePrice: parseDecimal(row["Trade Price"]),
                  listPrice: parseDecimal(row["List Price"]),
                  minimumPrice: parseDecimal(row["Trade Price"])
                    ? parseDecimal(row["Trade Price"])! * 0.9
                    : null,
                  lastImportBatchId: batch.id,
                },
                create: {
                  productId: product.id,
                  costPrice: parseDecimal(row["Cost Price"]),
                  retailPrice: parseDecimal(row["Retail Price"]),
                  tradePrice: parseDecimal(row["Trade Price"]),
                  listPrice: parseDecimal(row["List Price"]),
                  minimumPrice: parseDecimal(row["Trade Price"])
                    ? parseDecimal(row["Trade Price"])! * 0.9
                    : null,
                  lastImportBatchId: batch.id,
                },
              });

              const bands = [
                { code: "1", price: row["Band 1"] },
                { code: "2", price: row["Band 2"] },
                { code: "3", price: row["Band 3"] },
                { code: "4", price: row["Band 4"] },
              ];

              for (const band of bands) {
                if (band.price !== undefined && band.price !== null) {
                  await tx.productPriceBand.upsert({
                    where: {
                      productId_bandCode: {
                        productId: product.id,
                        bandCode: band.code,
                      },
                    },
                    update: {
                      price: band.price,
                    },
                    create: {
                      productId: product.id,
                      bandCode: band.code,
                      price: band.price,
                    },
                  });
                }
              }
            }),
          );
        } else {
          invalidCount++;
          await db(QUERIES.IMPORT_ERRORS_LOG, (p) =>
            p.importError.create({
              data: {
                batchId: batch.id,
                rowNumber,
                errorMessage: validation.errors.join("; "),
                rawRowJson: row as any,
              },
            }),
          );
        }

        processedCount++;
        if (processedCount % 100 === 0) {
          console.log(
            `Processed ${processedCount}/${rows.length} rows (${validCount} valid, ${invalidCount} invalid)`,
          );
        }
      }

      let finalStatus: ImportStatus;
      if (invalidCount === 0) {
        finalStatus = ImportStatus.SUCCEEDED;
      } else if (validCount === 0) {
        finalStatus = ImportStatus.FAILED;
      } else {
        finalStatus = ImportStatus.SUCCEEDED_WITH_ERRORS;
      }

      await db(QUERIES.IMPORT_BATCH_STATUS_UPDATE, (p) =>
        p.importBatch.update({
          where: { id: batch.id },
          data: {
            validRows: validCount,
            invalidRows: invalidCount,
            status: finalStatus,
            completedAt: new Date(),
          },
        }),
      );

      console.log(`Import batch ${batch.id} completed with status: ${finalStatus}`);
    } catch (error) {
      console.error("\nImport failed:", error);
      await db(QUERIES.IMPORT_BATCH_STATUS_UPDATE, (p) =>
        p.importBatch.update({
          where: { id: batch.id },
          data: { status: ImportStatus.FAILED, completedAt: new Date() },
        }),
      );
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