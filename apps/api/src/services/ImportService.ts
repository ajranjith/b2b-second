import { PrismaClient, ImportStatus, ImportType, PartType, Prisma, DealerStatus, Entitlement } from 'db';
import * as bcrypt from 'bcrypt';
import * as XLSX from 'xlsx';
import * as crypto from 'crypto';
import * as fs from 'fs';

type SpecialPriceWindow = { startsAt: Date; endsAt: Date };

const SALT_ROUNDS = 10;

const DISCOUNT_CODE_MAP: Record<string, PartType> = {
    gn: PartType.GENUINE,
    es: PartType.AFTERMARKET,
    br: PartType.BRANDED
};

function normalizeKey(key: string) {
    return key.replace(/\s+/g, '').toLowerCase();
}

function getValue(row: Record<string, any>, candidates: string[]) {
    const rowKeys = Object.keys(row);
    for (const candidate of candidates) {
        const normalized = normalizeKey(candidate);
        const match = rowKeys.find((k) => normalizeKey(k) === normalized);
        if (match) return row[match];
    }
    return undefined;
}

function parseDecimal(value: any): Prisma.Decimal | null {
    if (value === undefined || value === null || value === '') return null;
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (Number.isNaN(num)) return null;
    return new Prisma.Decimal(num);
}

function parseIntValue(value: any): number | null {
    if (value === undefined || value === null || value === '') return null;
    const num = typeof value === 'number' ? value : Number(value);
    if (Number.isNaN(num)) return null;
    return Math.floor(num);
}

export class ImportService {
    constructor(private prisma: PrismaClient) { }

    calculateFileHash(filePath: string): string {
        const fileBuffer = fs.readFileSync(filePath);
        return crypto.createHash('sha256').update(fileBuffer).digest('hex');
    }

    async processImport(
        importType: ImportType,
        filePath: string,
        batchId: string,
        specialPriceWindow?: SpecialPriceWindow
    ) {
        switch (importType) {
            case ImportType.PRODUCTS_MIXED:
                return this.importProductsMixed(filePath, batchId);
            case ImportType.DEALERS:
                return this.importDealers(filePath, batchId);
            case ImportType.SUPERSESSION:
                return this.importSupersessions(filePath, batchId);
            case ImportType.SPECIAL_PRICES:
                if (!specialPriceWindow) {
                    throw new Error('Special price window is required');
                }
                return this.importSpecialPrices(filePath, batchId, specialPriceWindow);
            case ImportType.BACKORDER_UPDATE:
                return this.importBackorderUpdates(filePath, batchId);
            default:
                throw new Error(`Unsupported import type: ${importType}`);
        }
    }

    private async importProductsMixed(filePath: string, batchId: string) {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        await this.prisma.importBatch.update({
            where: { id: batchId },
            data: { totalRows: rows.length }
        });

        let validCount = 0;
        let invalidCount = 0;

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNumber = i + 2;

            const productCodeRaw = getValue(row, ['Product Code']);
            const descriptionRaw = getValue(row, ['Full Description']);
            const productCode = productCodeRaw ? String(productCodeRaw).trim() : '';
            const description = descriptionRaw ? String(descriptionRaw).trim() : '';
            const freeStock = parseIntValue(getValue(row, ['Free Stock']));
            const discountCodeRaw = getValue(row, ['Discount code', 'Discount Code']);
            const discountCode = discountCodeRaw ? String(discountCodeRaw).trim().toLowerCase() : '';

            const netPrices = Array.from({ length: 7 }, (_, idx) => {
                const value = getValue(row, [`Net ${idx + 1} Price`, `Net ${idx + 1}`]);
                return parseDecimal(value);
            });

            const errors: string[] = [];
            if (!productCode) errors.push('Product Code is required');
            if (!description) errors.push('Full Description is required');
            if (!discountCode || !DISCOUNT_CODE_MAP[discountCode]) {
                errors.push('Discount code must be gn, es, or br');
            }
            if (netPrices.some((price) => price === null)) {
                errors.push('All Net 1..7 Price columns are required');
            }

            await this.prisma.stgProductPriceRow.create({
                data: {
                    batchId,
                    rowNumber,
                    partType: DISCOUNT_CODE_MAP[discountCode] || PartType.GENUINE,
                    productCode: productCode || null,
                    description: description || null,
                    discountCode: discountCode || null,
                    freeStock: freeStock ?? null,
                    band1Price: netPrices[0],
                    band2Price: netPrices[1],
                    band3Price: netPrices[2],
                    band4Price: netPrices[3],
                    isValid: errors.length === 0,
                    validationErrors: errors.length > 0 ? errors.join('; ') : null,
                    rawRowJson: row as any
                }
            });

            if (errors.length > 0) {
                invalidCount++;
                await this.prisma.importError.create({
                    data: {
                        batchId,
                        rowNumber,
                        errorMessage: errors.join('; '),
                        rawRowJson: row as any
                    }
                });
                continue;
            }

            validCount++;

            await this.prisma.$transaction(async (tx) => {
                const product = await tx.product.upsert({
                    where: { productCode },
                    update: {
                        description,
                        discountCode,
                        partType: DISCOUNT_CODE_MAP[discountCode],
                        isActive: true
                    },
                    create: {
                        productCode,
                        description,
                        discountCode,
                        partType: DISCOUNT_CODE_MAP[discountCode],
                        isActive: true
                    }
                });

                if (freeStock !== null) {
                    await tx.productStock.upsert({
                        where: { productId: product.id },
                        update: { freeStock, lastImportBatchId: batchId },
                        create: { productId: product.id, freeStock, lastImportBatchId: batchId }
                    });
                }

                for (let idx = 0; idx < netPrices.length; idx++) {
                    const price = netPrices[idx];
                    if (!price) continue;
                    const tierCode = `NET${idx + 1}`;

                    await tx.productNetPrice.upsert({
                        where: {
                            productId_tierCode: {
                                productId: product.id,
                                tierCode
                            }
                        },
                        update: { price },
                        create: { productId: product.id, tierCode, price }
                    });

                    if (idx < 4) {
                        await tx.productPriceBand.upsert({
                            where: {
                                productId_bandCode: {
                                    productId: product.id,
                                    bandCode: String(idx + 1)
                                }
                            },
                            update: { price },
                            create: { productId: product.id, bandCode: String(idx + 1), price }
                        });
                    }
                }
            });
        }

        return this.finalizeBatch(batchId, validCount, invalidCount);
    }

    private async importDealers(filePath: string, batchId: string) {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        await this.prisma.importBatch.update({
            where: { id: batchId },
            data: { totalRows: rows.length }
        });

        let validCount = 0;
        let invalidCount = 0;

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNumber = i + 2;

            const accountNoRaw = getValue(row, ['Account Number']);
            const companyNameRaw = getValue(row, ['Company Name']);
            const firstNameRaw = getValue(row, ['First Name']);
            const lastNameRaw = getValue(row, ['Last Name']);
            const emailRaw = getValue(row, ['Email']);
            const genuineTierRaw = getValue(row, ['Genuine Parts Tier']);
            const aftermarketEsTierRaw = getValue(row, ['Aftermarket ES Tier']);
            const aftermarketBrTierRaw = getValue(row, ['Aftermarket B Tier', 'Aftermarket BR Tier']);
            const tempPasswordRaw = getValue(row, ['Temp password', 'Temp Password']);
            const statusRaw = getValue(row, ['Status']);
            const shippingMethodRaw = getValue(row, ['Default shipping Method', 'Default Shipping Method']);
            const notesRaw = getValue(row, ['Notes']);

            const accountNo = accountNoRaw ? String(accountNoRaw).trim() : '';
            const companyName = companyNameRaw ? String(companyNameRaw).trim() : '';
            const firstName = firstNameRaw ? String(firstNameRaw).trim() : '';
            const lastName = lastNameRaw ? String(lastNameRaw).trim() : '';
            const email = emailRaw ? String(emailRaw).trim().toLowerCase() : '';
            const tempPassword = tempPasswordRaw ? String(tempPasswordRaw) : '';
            const statusValue = statusRaw ? String(statusRaw).trim().toUpperCase() : '';
            const shippingMethod = shippingMethodRaw ? String(shippingMethodRaw).trim() : '';
            const notes = notesRaw ? String(notesRaw).trim() : '';
            const genuineTier = genuineTierRaw ? String(genuineTierRaw).trim().toUpperCase() : '';
            const aftermarketEsTier = aftermarketEsTierRaw ? String(aftermarketEsTierRaw).trim().toUpperCase() : '';
            const aftermarketBrTier = aftermarketBrTierRaw ? String(aftermarketBrTierRaw).trim().toUpperCase() : '';

            const errors: string[] = [];
            if (!accountNo) errors.push('Account Number is required');
            if (!firstName) errors.push('First Name is required');
            if (!lastName) errors.push('Last Name is required');
            if (!email) errors.push('Email is required');
            if (!tempPassword) errors.push('Temp password is required');
            if (!['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(statusValue)) {
                errors.push('Status must be Active, Inactive, or Suspended');
            }
            if (shippingMethod && !['Air', 'Sea', 'FedEx', 'DHL', 'Others'].includes(shippingMethod)) {
                errors.push('Default shipping method must be Air, Sea, FedEx, DHL, or Others');
            }
            if (shippingMethod === 'Others' && !notes) {
                errors.push('Notes required when shipping method is Others');
            }
            const tierValues = [genuineTier, aftermarketEsTier, aftermarketBrTier];
            if (tierValues.some((tier) => !/^NET[1-7]$/.test(tier))) {
                errors.push('Tier values must be Net1..Net7');
            }

            await this.prisma.stgDealerAccountRow.create({
                data: {
                    batchId,
                    rowNumber,
                    accountNo: accountNo || null,
                    companyName: companyName || null,
                    firstName: firstName || null,
                    lastName: lastName || null,
                    email: email || null,
                    status: statusValue || null,
                    defaultShippingMethod: shippingMethod || null,
                    shippingNotes: notes || null,
                    genuineTier: genuineTier || null,
                    aftermarketEsTier: aftermarketEsTier || null,
                    aftermarketBrTier: aftermarketBrTier || null,
                    isValid: errors.length === 0,
                    validationErrors: errors.length > 0 ? errors.join('; ') : null,
                    rawRowJson: row as any
                }
            });

            if (errors.length > 0) {
                invalidCount++;
                await this.prisma.importError.create({
                    data: {
                        batchId,
                        rowNumber,
                        errorMessage: errors.join('; '),
                        rawRowJson: row as any
                    }
                });
                continue;
            }

            validCount++;

            await this.prisma.$transaction(async (tx) => {
                const dealerAccount = await tx.dealerAccount.upsert({
                    where: { accountNo },
                    update: {
                        companyName: companyName || '',
                        status: statusValue as DealerStatus,
                        entitlement: Entitlement.SHOW_ALL,
                        mainEmail: email,
                        defaultShippingMethod: shippingMethod || null,
                        notes: notes || null,
                        contactFirstName: firstName,
                        contactLastName: lastName
                    },
                    create: {
                        accountNo,
                        companyName: companyName || '',
                        status: statusValue as DealerStatus,
                        entitlement: Entitlement.SHOW_ALL,
                        mainEmail: email,
                        defaultShippingMethod: shippingMethod || null,
                        notes: notes || null,
                        contactFirstName: firstName,
                        contactLastName: lastName
                    }
                });

                const passwordHash = await bcrypt.hash(tempPassword, SALT_ROUNDS);
                const appUser = await tx.appUser.upsert({
                    where: { email },
                    update: {
                        passwordHash,
                        isActive: statusValue === 'ACTIVE',
                        mustChangePassword: true,
                        emailNormalized: email
                    },
                    create: {
                        email,
                        emailNormalized: email,
                        passwordHash,
                        role: 'DEALER',
                        isActive: statusValue === 'ACTIVE',
                        mustChangePassword: true
                    }
                });

                await tx.dealerUser.upsert({
                    where: { userId: appUser.id },
                    update: {
                        dealerAccountId: dealerAccount.id,
                        firstName,
                        lastName,
                        isPrimary: true
                    },
                    create: {
                        dealerAccountId: dealerAccount.id,
                        userId: appUser.id,
                        firstName,
                        lastName,
                        isPrimary: true
                    }
                });

                const tierAssignments = [
                    { discountCode: 'gn', tierCode: genuineTier },
                    { discountCode: 'es', tierCode: aftermarketEsTier },
                    { discountCode: 'br', tierCode: aftermarketBrTier }
                ];

                for (const assignment of tierAssignments) {
                    await tx.dealerDiscountTier.upsert({
                        where: {
                            dealerAccountId_discountCode: {
                                dealerAccountId: dealerAccount.id,
                                discountCode: assignment.discountCode
                            }
                        },
                        update: { tierCode: assignment.tierCode },
                        create: {
                            dealerAccountId: dealerAccount.id,
                            discountCode: assignment.discountCode,
                            tierCode: assignment.tierCode
                        }
                    });

                    await tx.dealerPriceTierAssignment.upsert({
                        where: {
                            accountNo_categoryCode: {
                                accountNo,
                                categoryCode: assignment.discountCode
                            }
                        },
                        update: { netTier: assignment.tierCode },
                        create: {
                            accountNo,
                            categoryCode: assignment.discountCode,
                            netTier: assignment.tierCode
                        }
                    });
                }
            });
        }

        return this.finalizeBatch(batchId, validCount, invalidCount);
    }

    private async importSupersessions(filePath: string, batchId: string) {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        await this.prisma.importBatch.update({
            where: { id: batchId },
            data: { totalRows: rows.length }
        });

        let validCount = 0;
        let invalidCount = 0;

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNumber = i + 2;
            const originalPartCodeRaw = getValue(row, ['FROMPARTNO']);
            const replacementPartCodeRaw = getValue(row, ['TOPARTNO']);
            const originalPartCode = originalPartCodeRaw ? String(originalPartCodeRaw).trim().toUpperCase() : '';
            const replacementPartCode = replacementPartCodeRaw ? String(replacementPartCodeRaw).trim().toUpperCase() : '';

            const errors: string[] = [];
            if (!originalPartCode) errors.push('FROMPARTNO is required');
            if (!replacementPartCode) errors.push('TOPARTNO is required');

            await this.prisma.stgSupersessionRow.create({
                data: {
                    batchId,
                    rowNumber,
                    originalPartCode: originalPartCode || null,
                    replacementPartCode: replacementPartCode || null,
                    isValid: errors.length === 0,
                    validationErrors: errors.length > 0 ? errors.join('; ') : null,
                    rawRowJson: row as any
                }
            });

            if (errors.length > 0) {
                invalidCount++;
                await this.prisma.importError.create({
                    data: {
                        batchId,
                        rowNumber,
                        errorMessage: errors.join('; '),
                        rawRowJson: row as any
                    }
                });
                continue;
            }

            validCount++;

            await this.prisma.supersession.upsert({
                where: {
                    originalPartCode_replacementPartCode: {
                        originalPartCode,
                        replacementPartCode
                    }
                },
                update: { note: null },
                create: { originalPartCode, replacementPartCode }
            });

            await this.prisma.supersessionMap.create({
                data: {
                    fromPartNo: originalPartCode,
                    toPartNo: replacementPartCode,
                    sourceBatchId: batchId
                }
            });
        }

        await this.rebuildSupersessionResolved(batchId);

        return this.finalizeBatch(batchId, validCount, invalidCount);
    }

    private async rebuildSupersessionResolved(batchId: string) {
        const mappings = await this.prisma.supersessionMap.findMany({
            select: { fromPartNo: true, toPartNo: true }
        });

        const map = new Map<string, string>();
        for (const entry of mappings) {
            if (!entry.fromPartNo || !entry.toPartNo) continue;
            const from = entry.fromPartNo.trim().toUpperCase();
            const to = entry.toPartNo.trim().toUpperCase();
            if (!from || !to) continue;
            map.set(from, to);
        }

        const originals = Array.from(map.keys());
        const resolvedRows: Array<{
            originalPartNo: string;
            latestPartNo: string;
            depth: number;
            sourceBatchId: string;
        }> = [];

        for (const original of originals) {
            const visited = new Set<string>();
            let current = original;
            let depth = 0;
            let hasLoop = false;

            while (map.has(current)) {
                if (visited.has(current)) {
                    hasLoop = true;
                    break;
                }
                visited.add(current);
                current = map.get(current)!;
                depth += 1;
            }

            if (hasLoop) {
                await this.prisma.importError.create({
                    data: {
                        batchId,
                        rowNumber: 0,
                        columnName: 'FROMPARTNO',
                        errorMessage: `Supersession loop detected for ${original}`,
                        rawRowJson: { originalPartNo: original }
                    }
                });
                continue;
            }

            resolvedRows.push({
                originalPartNo: original,
                latestPartNo: current,
                depth,
                sourceBatchId: batchId
            });
        }

        if (resolvedRows.length === 0) {
            return;
        }

        await this.prisma.$transaction(async (tx) => {
            await tx.supersessionResolved.deleteMany({
                where: { originalPartNo: { in: resolvedRows.map((row) => row.originalPartNo) } }
            });

            await tx.supersessionResolved.createMany({
                data: resolvedRows.map((row) => ({
                    originalPartNo: row.originalPartNo,
                    latestPartNo: row.latestPartNo,
                    depth: row.depth,
                    sourceBatchId: row.sourceBatchId
                }))
            });
        });
    }

    private async importSpecialPrices(filePath: string, batchId: string, window: SpecialPriceWindow) {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        await this.prisma.importBatch.update({
            where: { id: batchId },
            data: { totalRows: rows.length }
        });

        let validCount = 0;
        let invalidCount = 0;

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNumber = i + 2;

            const productCodeRaw = getValue(row, ['Part No', 'PartNo', 'Part Number']);
            const discountCodeRaw = getValue(row, ['Discount Code', 'Discount code']);
            const descriptionRaw = getValue(row, ['Description']);
            const discountPrice = parseDecimal(getValue(row, ['Discount Price']));

            const productCode = productCodeRaw ? String(productCodeRaw).trim() : '';
            const discountCode = discountCodeRaw ? String(discountCodeRaw).trim().toLowerCase() : '';
            const description = descriptionRaw ? String(descriptionRaw).trim() : '';
            const errors: string[] = [];
            if (!productCode) errors.push('Part No is required');
            if (!discountCode || !DISCOUNT_CODE_MAP[discountCode]) {
                errors.push('Discount Code must be gn, es, or br');
            }
            if (!discountPrice) errors.push('Discount Price is required');

            await this.prisma.stgSpecialPriceRow.create({
                data: {
                    batchId,
                    rowNumber,
                    productCode: productCode || null,
                    discountCode: discountCode || null,
                    description: description || null,
                    discountPrice: discountPrice || null,
                    isValid: errors.length === 0,
                    validationErrors: errors.length > 0 ? errors.join('; ') : null,
                    rawRowJson: row as any
                }
            });

            if (errors.length > 0) {
                invalidCount++;
                await this.prisma.importError.create({
                    data: {
                        batchId,
                        rowNumber,
                        errorMessage: errors.join('; '),
                        rawRowJson: row as any
                    }
                });
                continue;
            }

            validCount++;

            await this.prisma.specialPrice.upsert({
                where: {
                    productCode_discountCode_startsAt_endsAt_dealerAccountId: {
                        productCode,
                        discountCode,
                        startsAt: window.startsAt,
                        endsAt: window.endsAt,
                        dealerAccountId: null
                    }
                },
                update: {
                    description: description || null,
                    discountPrice,
                    isActive: true,
                    importBatchId: batchId
                },
                create: {
                    productCode,
                    discountCode,
                    description: description || null,
                    discountPrice,
                    startsAt: window.startsAt,
                    endsAt: window.endsAt,
                    isActive: true,
                    importBatchId: batchId
                }
            });
        }

        return this.finalizeBatch(batchId, validCount, invalidCount);
    }

    private async importBackorderUpdates(filePath: string, batchId: string) {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        await this.prisma.importBatch.update({
            where: { id: batchId },
            data: { totalRows: rows.length }
        });

        let validCount = 0;
        let invalidCount = 0;

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNumber = i + 2;

            const accountNoRaw = getValue(row, ['Account Number']);
            const companyNameRaw = getValue(row, ['Company name', 'Company Name']);
            const portalOrderNoRaw = getValue(row, ['Portal Order Number']);
            const ourOrderNoRaw = getValue(row, ['Our Number / ERP Order Number', 'ERP Order Number', 'Our Number']);
            const totalItem = parseIntValue(getValue(row, ['Total item', 'Total Items']));
            const productCodeRaw = getValue(row, ['Product code/stock number', 'Product Code']);
            const descriptionRaw = getValue(row, ['Description']);
            const qtyOrdered = parseIntValue(getValue(row, ['Quantity ordered', 'Quantity Ordered']));
            const qtyOutstanding = parseIntValue(getValue(row, ['Quantity Outstanding']));
            const inWarehouse = parseIntValue(getValue(row, ['In Warehouse']));

            const accountNo = accountNoRaw ? String(accountNoRaw).trim() : '';
            const companyName = companyNameRaw ? String(companyNameRaw).trim() : '';
            const portalOrderNo = portalOrderNoRaw ? String(portalOrderNoRaw).trim() : '';
            const ourOrderNo = ourOrderNoRaw ? String(ourOrderNoRaw).trim() : '';
            const portalOrderKey = portalOrderNo || '';
            const ourOrderKey = ourOrderNo || '';
            const productCode = productCodeRaw ? String(productCodeRaw).trim() : '';
            const description = descriptionRaw ? String(descriptionRaw).trim() : '';

            const errors: string[] = [];
            if (!accountNo) errors.push('Account Number is required');
            if (!productCode) errors.push('Product code/stock number is required');
            if (qtyOrdered === null) errors.push('Quantity ordered is required');

            if (errors.length > 0) {
                invalidCount++;
                await this.prisma.importError.create({
                    data: {
                        batchId,
                        rowNumber,
                        errorMessage: errors.join('; '),
                        rawRowJson: row as any
                    }
                });
                continue;
            }

            validCount++;

            await this.prisma.backorderUpdateLine.upsert({
                where: {
                    batchId_accountNo_productCode_portalOrderNo_ourOrderNo: {
                        batchId,
                        accountNo,
                        productCode,
                        portalOrderNo: portalOrderKey,
                        ourOrderNo: ourOrderKey
                    }
                },
                update: {
                    companyName: companyName || null,
                    portalOrderNo: portalOrderKey,
                    ourOrderNo: ourOrderKey,
                    totalItem: totalItem ?? null,
                    description: description || null,
                    qtyOrdered: qtyOrdered ?? 0,
                    qtyOutstanding: qtyOutstanding ?? 0,
                    inWarehouse: inWarehouse ?? 0
                },
                create: {
                    batchId,
                    accountNo,
                    companyName: companyName || null,
                    portalOrderNo: portalOrderKey,
                    ourOrderNo: ourOrderKey,
                    totalItem: totalItem ?? null,
                    productCode,
                    description: description || null,
                    qtyOrdered: qtyOrdered ?? 0,
                    qtyOutstanding: qtyOutstanding ?? 0,
                    inWarehouse: inWarehouse ?? 0
                }
            });
        }

        return this.finalizeBatch(batchId, validCount, invalidCount);
    }

    private async finalizeBatch(batchId: string, validRows: number, invalidRows: number) {
        let status: ImportStatus;
        if (invalidRows === 0) status = ImportStatus.SUCCEEDED;
        else if (validRows === 0) status = ImportStatus.FAILED;
        else status = ImportStatus.SUCCEEDED_WITH_ERRORS;

        return this.prisma.importBatch.update({
            where: { id: batchId },
            data: {
                validRows,
                invalidRows,
                status,
                completedAt: new Date(),
                rowCount: validRows + invalidRows,
                successCount: validRows,
                errorCount: invalidRows
            }
        });
    }
}
