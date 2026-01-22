import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../packages/db/.env") });
import { z } from "zod";
import * as fs from "fs";
import { parse } from "csv-parse/sync";
import { ImportType, ImportStatus, db, disconnectWorkerPrisma } from "./lib/prisma";
import { withJobEnvelope } from "./lib/withJobEnvelope";

// Arg parsing
const args = process.argv.slice(2);
const fileArg = args.find((a) => a.startsWith("--file="));

if (!fileArg) {
  console.error("Usage: ts-node src/importBackorders.ts --file=<path>");
  process.exit(1);
}

const filePathInput = fileArg.split("=")[1] as string;
const absoluteFilePath = path.resolve(process.cwd(), filePathInput);

if (!fs.existsSync(absoluteFilePath)) {
  console.error(`File not found: ${absoluteFilePath}`);
  process.exit(1);
}

// Zod Schema
const BackorderRowSchema = z.object({
  accountNo: z.string().min(1),
  ourNo: z.string().min(1),
  itemNo: z.string().min(1),
  part: z.string().min(1),
  qtyOrdered: z.number().int().min(0).optional(),
  qtyOutstanding: z.number().int().min(0).optional(),
});

const runImport = withJobEnvelope<{ filePath: string }, void>(
  {
    namespace: "A",
    jobId: "JOB-A-IMPORT-BACKORDERS",
    featureId: "REF-A-06",
    operationId: "API-A-06-02",
  },
  async (_ctx, { filePath }) => {
    console.log(`Starting backorder import from ${filePath}`);

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const fileHash = `hash_${Date.now()}`;

    const batch = await db("DB-A-10-01", (p) =>
      p.importBatch.create({
        data: {
          importType: ImportType.BACKORDERS,
          fileName: path.basename(filePath),
          filePath,
          fileHash,
          status: ImportStatus.PROCESSING,
        },
      }),
    );

    try {
      const rows = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as any[];

      console.log(`Found ${rows.length} rows`);
      await db("DB-A-10-04", (p) =>
        p.importBatch.update({
          where: { id: batch.id },
          data: { totalRows: rows.length },
        }),
      );

      let validCount = 0;
      let invalidCount = 0;

      for (let i = 0; i < rows.length; i++) {
        const raw = rows[i];
        const rowFn = i + 2;

        const mapped: any = {
          batchId: batch.id,
          rowNumber: rowFn,
          accountNo: raw["Account No"] || raw["Account"],
          customerName: raw["Customer Name"],
          yourOrderNo: raw["Your Order No"],
          ourNo: raw["Our No"] || raw["Order No"],
          itemNo: raw["Itm"] || raw["Item No"] || String(i),
          part: raw["Part"] || raw["Part No"],
          description: raw["Descriptio"] || raw["Description"],
          qtyOrdered:
            raw["Q Ord"] || raw["Qty Ordered"] ? parseInt(raw["Q Ord"] || raw["Qty Ordered"], 10) : 0,
          qtyOutstanding:
            raw["Q/O"] || raw["Qty Outstanding"]
              ? parseInt(raw["Q/O"] || raw["Qty Outstanding"], 10)
              : 0,
          inWh: raw["In WH"] || raw["In Wh"] ? parseInt(raw["In WH"] || raw["In Wh"], 10) : 0,
          rawRowJson: raw,
        };

        const validation = BackorderRowSchema.safeParse(mapped);
        let isValid = validation.success;
        let validationErrors: string | null = null;
        if (!validation.success) {
          validationErrors = validation.error.issues.map((issue) => issue.message).join(", ");
        }

        await db("DB-A-10-02", (p) =>
          p.stgBackorderRow.create({
            data: {
              ...mapped,
              isValid,
              validationErrors,
            },
          }),
        );

        if (isValid) {
          validCount++;
        } else {
          invalidCount++;
          await db("DB-A-10-03", (p) =>
            p.importError.create({
              data: {
                batchId: batch.id,
                rowNumber: rowFn,
                errorMessage: validationErrors || "Unknown error",
                rawRowJson: raw as any,
              },
            }),
          );
        }
      }

      if (invalidCount > 0) {
        console.warn(`Batch failed due to ${invalidCount} invalid rows.`);
        await db("DB-A-10-04", (p) =>
          p.importBatch.update({
            where: { id: batch.id },
            data: {
              status: ImportStatus.FAILED,
              validRows: validCount,
              invalidRows: invalidCount,
              completedAt: new Date(),
            },
          }),
        );
        return;
      }

      console.log("All rows valid. Performing transactional swap of BackorderDataset.");

      await db("DB-A-10-12", (p) =>
        p.$transaction(async (tx) => {
          await tx.backorderDataset.updateMany({
            where: { isActive: true },
            data: { isActive: false },
          });

          const dataset = await tx.backorderDataset.create({
            data: {
              batchId: batch.id,
              status: ImportStatus.SUCCEEDED,
              isActive: true,
            },
          });

          const stagingRows = await tx.stgBackorderRow.findMany({
            where: { batchId: batch.id },
          });

          for (const row of stagingRows) {
            await tx.backorderLine.create({
              data: {
                datasetId: dataset.id,
                accountNo: row.accountNo!,
                customerName: row.customerName,
                yourOrderNo: row.yourOrderNo,
                ourNo: row.ourNo!,
                itemNo: row.itemNo!,
                part: row.part!,
                description: row.description,
                qtyOrdered: row.qtyOrdered || 0,
                qtyOutstanding: row.qtyOutstanding || 0,
                inWh: row.inWh || 0,
              },
            });
          }

          await tx.importBatch.update({
            where: { id: batch.id },
            data: {
              status: ImportStatus.SUCCEEDED,
              validRows: validCount,
              invalidRows: 0,
              completedAt: new Date(),
            },
          });
        }),
      );

      console.log("Backorder import transaction completed successfully.");
    } catch (error) {
      console.error("Import failed", error);
      await db("DB-A-10-04", (p) =>
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
  },
);

async function main() {
  await runImport({ filePath: absoluteFilePath });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectWorkerPrisma();
  });
