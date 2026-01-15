import { PrismaClient, ImportType, PartType, ImportStatus } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export class AdminService {
    constructor(private prisma: PrismaClient) { }

    private calculateFileHash(filePath: string): string {
        const fileBuffer = fs.readFileSync(filePath);
        return crypto.createHash('sha256').update(fileBuffer).digest('hex');
    }

    async processProductImport(type: 'GENUINE' | 'AFTERMARKET' | 'BRANDED', filePath: string) {
        const fileHash = this.calculateFileHash(filePath);
        const fileName = path.basename(filePath);
        const importType = type === 'GENUINE' ? ImportType.PRODUCTS_GENUINE : ImportType.PRODUCTS_AFTERMARKET;
        const partType = type === 'GENUINE' ? PartType.GENUINE : (type === 'BRANDED' ? PartType.BRANDED : PartType.AFTERMARKET);

        const batch = await this.prisma.importBatch.create({
            data: {
                importType,
                fileName,
                fileHash,
                filePath,
                status: ImportStatus.PROCESSING,
                totalRows: 0,
                validRows: 0,
                invalidRows: 0
            }
        });

        try {
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const rows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

            await this.prisma.importBatch.update({
                where: { id: batch.id },
                data: { totalRows: rows.length }
            });

            let validCount = 0;
            for (const row of rows) {
                // Simplified logic for brevity in this step, similar to worker
                const productCode = row['Product Code'];
                if (!productCode) continue;

                await this.prisma.$transaction(async (tx: any) => {
                    const product = await tx.product.upsert({
                        where: { productCode },
                        update: {
                            description: row['Description'] || row['Full Description'] || '',
                            partType,
                            isActive: true
                        },
                        create: {
                            productCode,
                            description: row['Description'] || row['Full Description'] || '',
                            partType,
                            isActive: true
                        }
                    });

                    if (row['Free Stock'] !== undefined) {
                        await tx.productStock.upsert({
                            where: { productId: product.id },
                            update: { freeStock: Number(row['Free Stock']), lastImportBatchId: batch.id },
                            create: { productId: product.id, freeStock: Number(row['Free Stock']), lastImportBatchId: batch.id }
                        });
                    }
                });
                validCount++;
            }

            await this.prisma.importBatch.update({
                where: { id: batch.id },
                data: {
                    validRows: validCount,
                    status: ImportStatus.SUCCEEDED,
                    completedAt: new Date()
                }
            });

            return batch;
        } catch (e) {
            await this.prisma.importBatch.update({
                where: { id: batch.id },
                data: { status: ImportStatus.FAILED, completedAt: new Date() }
            });
            throw e;
        }
    }
}
