
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../packages/db/.env') });
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, ImportType, ImportStatus, Prisma } from '@prisma/client';
import { z } from 'zod';
import * as fs from 'fs';
import { parse } from 'csv-parse/sync';

// Arg parsing
const args = process.argv.slice(2);
const fileArg = args.find(a => a.startsWith('--file='));

if (!fileArg) {
    console.error('Usage: ts-node src/importBackorders.ts --file=<path>');
    process.exit(1);
}

const filePathInput = fileArg.split('=')[1] as string;
const absoluteFilePath = path.resolve(process.cwd(), filePathInput);

if (!fs.existsSync(absoluteFilePath)) {
    console.error(`File not found: ${absoluteFilePath}`);
    process.exit(1);
}

// DB Setup
const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Zod Schema
const BackorderRowSchema = z.object({
    accountNo: z.string().min(1),
    ourNo: z.string().min(1),
    itemNo: z.string().min(1),
    part: z.string().min(1),
    qtyOrdered: z.number().int().min(0).optional(),
    qtyOutstanding: z.number().int().min(0).optional()
});

async function main() {
    console.log(`Starting backorder import from ${absoluteFilePath}`);

    const fileContent = fs.readFileSync(absoluteFilePath, 'utf-8');
    const fileHash = 'hash_' + Date.now();

    // 1. Create ImportBatch
    const batch = await prisma.importBatch.create({
        data: {
            importType: ImportType.BACKORDERS,
            fileName: path.basename(absoluteFilePath),
            filePath: absoluteFilePath,
            fileHash,
            status: ImportStatus.PROCESSING
        }
    });

    try {
        // 2. Parse CSV
        const rows = parse(fileContent, {
            columns: true, // Auto-discover headers
            skip_empty_lines: true,
            trim: true
        }) as any[];

        console.log(`Found ${rows.length} rows`);
        await prisma.importBatch.update({
            where: { id: batch.id },
            data: { totalRows: rows.length }
        });

        let validCount = 0;
        let invalidCount = 0;

        // 3. Process & Stage Rows
        for (let i = 0; i < rows.length; i++) {
            const raw = rows[i];
            const rowFn = i + 2; // +1 for 0-index, +1 for header

            // Map keys based on sample CSV headers: 'Account', 'Order No', 'Part No', 'Qty Ordered', 'Qty Outstanding'
            // Need to map consistent with StgBackorderRow fields
            const mapped: any = {
                batchId: batch.id,
                rowNumber: rowFn,
                accountNo: raw['Account No'] || raw['Account'],
                customerName: raw['Customer Name'], // Optional in sample
                yourOrderNo: raw['Your Order No'], // Optional
                ourNo: raw['Our No'] || raw['Order No'], // Support both column names
                itemNo: raw['Itm'] || raw['Item No'] || String(i),
                part: raw['Part'] || raw['Part No'],
                description: raw['Descriptio'] || raw['Description'],
                qtyOrdered: (raw['Q Ord'] || raw['Qty Ordered']) ? parseInt(raw['Q Ord'] || raw['Qty Ordered'], 10) : 0,
                qtyOutstanding: (raw['Q/O'] || raw['Qty Outstanding']) ? parseInt(raw['Q/O'] || raw['Qty Outstanding'], 10) : 0,
                inWh: (raw['In WH'] || raw['In Wh']) ? parseInt(raw['In WH'] || raw['In Wh'], 10) : 0,
                rawRowJson: raw
            };

            const validation = BackorderRowSchema.safeParse(mapped);
            let isValid = validation.success;
            let validationErrors: string | null = null;
            if (!validation.success) {
                validationErrors = validation.error.issues.map(i => i.message).join(', ');
            }

            await prisma.stgBackorderRow.create({
                data: {
                    ...mapped,
                    isValid,
                    validationErrors
                }
            });

            if (isValid) {
                validCount++;
            } else {
                invalidCount++;
                await prisma.importError.create({
                    data: {
                        batchId: batch.id,
                        rowNumber: rowFn,
                        errorMessage: validationErrors || 'Unknown error',
                        rawRowJson: raw as any
                    }
                });
            }
        }

        // 4. Decision Logic
        if (invalidCount > 0) {
            console.warn(`Batch failed due to ${invalidCount} invalid rows.`);
            await prisma.importBatch.update({
                where: { id: batch.id },
                data: {
                    status: ImportStatus.FAILED,
                    validRows: validCount,
                    invalidRows: invalidCount,
                    completedAt: new Date()
                }
            });
            // Do NOT touch BackorderDataset
        } else {
            // All Valid -> Transactional Swap
            console.log('All rows valid. Performing transactional swap of BackorderDataset.');

            await prisma.$transaction(async (tx) => {
                // 1. Deactivate old
                await tx.backorderDataset.updateMany({
                    where: { isActive: true },
                    data: { isActive: false }
                });

                // 2. Create new dataset
                const dataset = await tx.backorderDataset.create({
                    data: {
                        batchId: batch.id,
                        status: ImportStatus.SUCCEEDED,
                        isActive: true,
                    }
                });

                // 3. Insert Lines from Staging
                // Efficiency: In a real app we might use `insert into ... select ...` SQL. 
                // For Prisma, we iterate.
                const stagingRows = await tx.stgBackorderRow.findMany({
                    where: { batchId: batch.id }
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
                            inWh: row.inWh || 0
                        }
                    });
                }

                // 4. Mark Batch Succeeded
                await tx.importBatch.update({
                    where: { id: batch.id },
                    data: {
                        status: ImportStatus.SUCCEEDED,
                        validRows: validCount,
                        invalidRows: 0,
                        completedAt: new Date()
                    }
                });
            });

            console.log('Backorder import transaction completed successfully.');
        }

    } catch (e: any) {
        console.error('Import failed', e);
        await prisma.importBatch.update({
            where: { id: batch.id },
            data: {
                status: ImportStatus.FAILED,
                completedAt: new Date()
            }
        });
        process.exit(1);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
