
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../packages/db/.env') });
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, ImportType, ImportStatus, PartType, Prisma } from '@prisma/client';
import * as xlsx from 'xlsx';
import { z } from 'zod';
import * as fs from 'fs';

// Argument parsing basics
const args = process.argv.slice(2);
const typeArg = args.find(a => a.startsWith('--type='));
const fileArg = args.find(a => a.startsWith('--file='));

if (!typeArg || !fileArg) {
    console.error('Usage: ts-node src/importProducts.ts --type=<GENUINE|AFTERMARKET> --file=<path>');
    process.exit(1);
}

const partTypeInput = typeArg.split('=')[1] as string;
const filePathInput = fileArg.split('=')[1] as string;

// Validate inputs
if (!['GENUINE', 'AFTERMARKET'].includes(partTypeInput)) {
    console.error('Invalid type. Must be GENUINE or AFTERMARKET');
    process.exit(1);
}
const partType = partTypeInput as PartType;
const importType = partType === 'GENUINE' ? ImportType.PRODUCTS_GENUINE : ImportType.PRODUCTS_AFTERMARKET;

const absoluteFilePath = path.resolve(process.cwd(), filePathInput);
if (!fs.existsSync(absoluteFilePath)) {
    console.error(`File not found: ${absoluteFilePath}`);
    process.exit(1);
}

// Database setup
const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Zod Schema for Row Validation
const RowSchema = z.object({
    productCode: z.string().min(1),
    description: z.string().min(1),
    listPrice: z.number().min(0).optional(),
    discountCode: z.string().optional(),
    supplier: z.string().optional(),
});

async function main() {
    console.log(`Starting import for ${partType} from ${absoluteFilePath}`);

    // 1. Create ImportBatch
    const fileBuffer = fs.readFileSync(absoluteFilePath);
    // In a real app we'd hash the file, for now just placeholder
    const fileHash = 'hash_' + Date.now();

    const batch = await prisma.importBatch.create({
        data: {
            importType,
            fileName: path.basename(absoluteFilePath),
            filePath: absoluteFilePath,
            fileHash,
            status: ImportStatus.PROCESSING
        }
    });

    try {
        // 2. Parse XLSX
        const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = xlsx.utils.sheet_to_json<any>(sheet);

        console.log(`Found ${rows.length} rows`);
        await prisma.importBatch.update({
            where: { id: batch.id },
            data: { totalRows: rows.length }
        });

        let validCount = 0;
        let invalidCount = 0;

        // 3. Process Rows
        for (let i = 0; i < rows.length; i++) {
            const rowFn = i + 2; // Excel row number (1-based, +header)
            const raw = rows[i];

            // Map Excel columns to Staging Fields
            // Expecting: 'Part No', 'Description', 'List Price', 'Discount Code', 'Supplier'
            const mapped: any = {
                batchId: batch.id,
                rowNumber: rowFn,
                partType, // From Arg
                productCode: raw['Part No'] ? String(raw['Part No']).trim() : undefined,
                description: raw['Description'],
                supplier: raw['Supplier'],
                discountCode: raw['Discount Code'],
                listPrice: raw['List Price'] ? Number(raw['List Price']) : undefined,
                // band1Price, band2Price... if they existed in excel
                rawRowJson: raw
            };

            // Validate
            const validation = RowSchema.safeParse(mapped);
            let isValid = validation.success;
            let validationErrors: string | null = null;
            if (!validation.success) {
                validationErrors = validation.error.issues.map(i => i.message).join(', ');
            }

            // Create Staging Row
            await prisma.stgProductPriceRow.create({
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
                // Create ImportError
                await prisma.importError.create({
                    data: {
                        batchId: batch.id,
                        rowNumber: rowFn,
                        errorMessage: validationErrors || 'Unknown error',
                        rawRowJson: raw
                    }
                });
            }
        }

        // 4. Upsert Valid Rows to Main Tables
        if (validCount > 0) {
            console.log(`Upserting ${validCount} valid products...`);

            const validRows = await prisma.stgProductPriceRow.findMany({
                where: { batchId: batch.id, isValid: true }
            });

            for (const row of validRows) {
                if (!row.productCode || !row.description) continue; // Should be caught by validation

                // Upsert Product
                const product = await prisma.product.upsert({
                    where: { productCode: row.productCode },
                    update: {
                        description: row.description,
                        supplier: row.supplier,
                        discountCode: row.discountCode,
                        partType: row.partType,
                        updatedAt: new Date()
                    },
                    create: {
                        productCode: row.productCode,
                        description: row.description,
                        supplier: row.supplier,
                        discountCode: row.discountCode,
                        partType: row.partType,
                    }
                });

                // Upsert PriceReference
                if (row.listPrice !== null) {
                    await prisma.productPriceReference.upsert({
                        where: { productId: product.id },
                        update: {
                            listPrice: row.listPrice,
                            updatedAt: new Date(),
                            lastImportBatchId: batch.id
                        },
                        create: {
                            productId: product.id,
                            listPrice: row.listPrice,
                            lastImportBatchId: batch.id
                        }
                    });
                }

                // Upsert Stock (Init if not exists)
                await prisma.productStock.upsert({
                    where: { productId: product.id },
                    update: {}, // Don't overwrite stock on price import? Or maybe we should? Prompt didn't specify stock in excel.
                    create: {
                        productId: product.id,
                        freeStock: 0,
                        lastImportBatchId: batch.id
                    }
                });

                // Upsert Band Prices (if provided)
                // For this sample, we don't have explicit band columns, skipping loop logic for '1'..'4'
                // If we did: check row.band1Price, row.band2Price...
            }
        }

        // 5. Update Batch Status
        await prisma.importBatch.update({
            where: { id: batch.id },
            data: {
                status: invalidCount > 0 ? ImportStatus.SUCCEEDED_WITH_ERRORS : ImportStatus.SUCCEEDED,
                validRows: validCount,
                invalidRows: invalidCount,
                completedAt: new Date()
            }
        });

        console.log(`Import finished. Valid: ${validCount}, Invalid: ${invalidCount}`);

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
