import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../packages/db/.env') });
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, PartType, ImportType, ImportStatus } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as crypto from 'crypto';
import * as fs from 'fs';

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

interface ImportArgs {
    type: 'GENUINE' | 'AFTERMARKET' | 'BRANDED';
    file: string;
}

interface ExcelRow {
    Supplier?: string;
    'Product Code'?: string;
    Description?: string;
    'Full Description'?: string;  // Synonym for Description
    'Discount Code'?: string;
    'Cost Price'?: number;
    'Retail Price'?: number;
    'Trade Price'?: number;
    'List Price'?: number;
    'Band 1'?: number;
    'Band 2'?: number;
    'Band 3'?: number;
    'Band 4'?: number;
    'Free Stock'?: number;
}

interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

function parseArgs(): ImportArgs {
    const args = process.argv.slice(2);
    const typeIndex = args.indexOf('--type');
    const fileIndex = args.indexOf('--file');

    if (typeIndex === -1 || fileIndex === -1) {
        console.error('❌ Usage: ts-node importProducts.ts --type GENUINE|AFTERMARKET|BRANDED --file <path-to-xlsx>');
        process.exit(1);
    }

    const type = args[typeIndex + 1] as 'GENUINE' | 'AFTERMARKET';
    const file = args[fileIndex + 1];

    if (!['GENUINE', 'AFTERMARKET', 'BRANDED'].includes(type)) {
        console.error('❌ Type must be GENUINE, AFTERMARKET, or BRANDED');
        process.exit(1);
    }

    if (!file) {
        console.error('❌ File path is required');
        process.exit(1);
    }

    return { type, file };
}

function calculateFileHash(filePath: string): string {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
}

function validateRow(row: ExcelRow, rowNumber: number): ValidationResult {
    const errors: string[] = [];

    // Required fields
    if (!row['Product Code'] || row['Product Code'].trim() === '') {
        errors.push('Product Code is required');
    }

    // Accept either Description or Full Description
    const description = row.Description || row['Full Description'];
    if (!description || description.trim() === '') {
        errors.push('Description is required');
    }

    // Price validations
    const priceFields = [
        'Cost Price', 'Retail Price', 'Trade Price', 'List Price',
        'Band 1', 'Band 2', 'Band 3', 'Band 4'
    ] as const;

    for (const field of priceFields) {
        const value = row[field];
        if (value !== undefined && value !== null && value < 0) {
            errors.push(`${field} cannot be negative`);
        }
    }

    // Stock validation
    if (row['Free Stock'] !== undefined && row['Free Stock'] !== null && row['Free Stock'] < 0) {
        errors.push('Free Stock cannot be negative');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

function parseDecimal(value: any): number | null {
    if (value === undefined || value === null || value === '') return null;
    const num = typeof value === 'number' ? value : parseFloat(value);
    return isNaN(num) ? null : num;
}

function parseInt(value: any): number | null {
    if (value === undefined || value === null || value === '') return null;
    const num = typeof value === 'number' ? value : Number(value);
    return isNaN(num) ? null : Math.floor(num);
}

async function main() {
    const { type, file } = parseArgs();

    console.log('📦 Product Import Worker');
    console.log(`   Type: ${type}`);
    console.log(`   File: ${file}\n`);

    // Resolve file path
    const filePath = path.isAbsolute(file) ? file : path.resolve(process.cwd(), file);

    if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        process.exit(1);
    }

    console.log(`📂 Reading file: ${filePath}`);

    // Calculate file hash
    const fileHash = calculateFileHash(filePath);
    console.log(`🔐 File hash: ${fileHash.substring(0, 16)}...`);

    // Create import batch
    console.log('\n📝 Creating import batch...');
    const importType = type === 'GENUINE' ? ImportType.PRODUCTS_GENUINE : ImportType.PRODUCTS_AFTERMARKET;
    const partType = type === 'GENUINE' ? PartType.GENUINE : (type === 'BRANDED' ? PartType.BRANDED : PartType.AFTERMARKET);

    const batch = await prisma.importBatch.create({
        data: {
            importType,
            fileName: path.basename(filePath),
            fileHash,
            filePath,
            status: ImportStatus.PROCESSING,
            totalRows: 0,
            validRows: 0,
            invalidRows: 0
        }
    });

    console.log(`✅ Import batch created: ${batch.id}`);

    try {
        // Read Excel file
        console.log('\n📊 Parsing Excel file...');
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);

        console.log(`   Found ${rows.length} rows\n`);

        // Update total rows
        await prisma.importBatch.update({
            where: { id: batch.id },
            data: { totalRows: rows.length }
        });

        let validCount = 0;
        let invalidCount = 0;
        let processedCount = 0;

        // Process each row
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNumber = i + 2; // Excel rows start at 1, header is row 1

            // Validate row
            const validation = validateRow(row, rowNumber);

            // Insert into staging table
            await prisma.stgProductPriceRow.create({
                data: {
                    batchId: batch.id,
                    rowNumber,
                    partType,
                    supplier: row.Supplier || null,
                    productCode: row['Product Code'] || null,
                    description: row.Description || row['Full Description'] || null,
                    discountCode: row['Discount Code'] || null,
                    costPrice: parseDecimal(row['Cost Price']),
                    retailPrice: parseDecimal(row['Retail Price']),
                    tradePrice: parseDecimal(row['Trade Price']),
                    listPrice: parseDecimal(row['List Price']),
                    band1Price: parseDecimal(row['Band 1']),
                    band2Price: parseDecimal(row['Band 2']),
                    band3Price: parseDecimal(row['Band 3']),
                    band4Price: parseDecimal(row['Band 4']),
                    freeStock: parseInt(row['Free Stock']),
                    isValid: validation.isValid,
                    validationErrors: validation.errors.length > 0 ? validation.errors.join('; ') : null,
                    rawRowJson: row as any
                }
            });

            if (validation.isValid) {
                validCount++;

                // Upsert product data
                await prisma.$transaction(async (tx) => {
                    // 1. Upsert Product
                    const product = await tx.product.upsert({
                        where: { productCode: row['Product Code']! },
                        update: {
                            supplier: row.Supplier || null,
                            description: (row.Description || row['Full Description'])!,
                            discountCode: row['Discount Code'] || null,
                            partType,
                            isActive: true
                        },
                        create: {
                            productCode: row['Product Code']!,
                            supplier: row.Supplier || null,
                            description: (row.Description || row['Full Description'])!,
                            discountCode: row['Discount Code'] || null,
                            partType,
                            isActive: true
                        }
                    });

                    // 2. Upsert ProductStock
                    if (row['Free Stock'] !== undefined && row['Free Stock'] !== null) {
                        await tx.productStock.upsert({
                            where: { productId: product.id },
                            update: {
                                freeStock: row['Free Stock'],
                                lastImportBatchId: batch.id
                            },
                            create: {
                                productId: product.id,
                                freeStock: row['Free Stock'],
                                lastImportBatchId: batch.id
                            }
                        });
                    }

                    // 3. Upsert ProductPriceReference
                    await tx.productPriceReference.upsert({
                        where: { productId: product.id },
                        update: {
                            costPrice: parseDecimal(row['Cost Price']),
                            retailPrice: parseDecimal(row['Retail Price']),
                            tradePrice: parseDecimal(row['Trade Price']),
                            listPrice: parseDecimal(row['List Price']),
                            minimumPrice: parseDecimal(row['Trade Price']) ? parseDecimal(row['Trade Price'])! * 0.9 : null,
                            lastImportBatchId: batch.id
                        },
                        create: {
                            productId: product.id,
                            costPrice: parseDecimal(row['Cost Price']),
                            retailPrice: parseDecimal(row['Retail Price']),
                            tradePrice: parseDecimal(row['Trade Price']),
                            listPrice: parseDecimal(row['List Price']),
                            minimumPrice: parseDecimal(row['Trade Price']) ? parseDecimal(row['Trade Price'])! * 0.9 : null,
                            lastImportBatchId: batch.id
                        }
                    });

                    // 4. Upsert ProductPriceBand (4 bands)
                    const bands = [
                        { code: '1', price: row['Band 1'] },
                        { code: '2', price: row['Band 2'] },
                        { code: '3', price: row['Band 3'] },
                        { code: '4', price: row['Band 4'] }
                    ];

                    for (const band of bands) {
                        if (band.price !== undefined && band.price !== null) {
                            await tx.productPriceBand.upsert({
                                where: {
                                    productId_bandCode: {
                                        productId: product.id,
                                        bandCode: band.code
                                    }
                                },
                                update: {
                                    price: band.price
                                },
                                create: {
                                    productId: product.id,
                                    bandCode: band.code,
                                    price: band.price
                                }
                            });
                        }
                    }
                });
            } else {
                invalidCount++;

                // Log validation errors
                await prisma.importError.create({
                    data: {
                        batchId: batch.id,
                        rowNumber,
                        errorMessage: validation.errors.join('; '),
                        rawRowJson: row as any
                    }
                });
            }

            processedCount++;

            // Log progress every 100 rows
            if (processedCount % 100 === 0) {
                console.log(`   Processed ${processedCount}/${rows.length} rows (${validCount} valid, ${invalidCount} invalid)`);
            }
        }

        console.log(`\n✅ Processing complete!`);
        console.log(`   Total: ${rows.length}`);
        console.log(`   Valid: ${validCount}`);
        console.log(`   Invalid: ${invalidCount}`);

        // Determine final status
        let finalStatus: ImportStatus;
        if (invalidCount === 0) {
            finalStatus = ImportStatus.SUCCEEDED;
        } else if (validCount === 0) {
            finalStatus = ImportStatus.FAILED;
        } else {
            finalStatus = ImportStatus.SUCCEEDED_WITH_ERRORS;
        }

        // Update batch with final counts and status
        await prisma.importBatch.update({
            where: { id: batch.id },
            data: {
                validRows: validCount,
                invalidRows: invalidCount,
                status: finalStatus,
                completedAt: new Date()
            }
        });

        console.log(`\n📊 Import batch ${batch.id} completed with status: ${finalStatus}`);

        // Generate Validation Report
        const report = {
            total: validCount,
            genuine: partType === PartType.GENUINE ? validCount : 0,
            aftermarket: partType === PartType.AFTERMARKET ? validCount : 0,
            branded: partType === PartType.BRANDED ? validCount : 0
        };

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 FINAL IMPORT REPORT');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Total Products: ${report.total}`);
        console.log(`- GENUINE:     ${report.genuine}`);
        console.log(`- AFTERMARKET: ${report.aftermarket}`);
        console.log(`- BRANDED:     ${report.branded}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
        console.error('\n❌ Import failed:', error);

        // Update batch status to FAILED
        await prisma.importBatch.update({
            where: { id: batch.id },
            data: {
                status: ImportStatus.FAILED,
                completedAt: new Date()
            }
        });

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
