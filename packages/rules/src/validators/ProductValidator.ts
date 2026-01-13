/**
 * Product Validator
 * Business rules for product validation
 */

import { PrismaClient } from '@prisma/client';
import { ValidationResult, RuleError } from '../types';

export interface ProductInput {
    productCode: string;
    description: string;
    partType: string;
    isActive?: boolean;
}

export class ProductValidator {
    constructor(private prisma: PrismaClient) { }

    validateProduct(data: ProductInput): ValidationResult {
        const errors: RuleError[] = [];

        if (!data.productCode || data.productCode.trim().length === 0) {
            errors.push({ field: 'productCode', message: 'Product code is required', code: 'REQUIRED', severity: 'error' });
        }

        if (!data.description || data.description.trim().length === 0) {
            errors.push({ field: 'description', message: 'Description is required', code: 'REQUIRED', severity: 'error' });
        }

        const validPartTypes = ['GENUINE', 'AFTERMARKET', 'BRANDED'];
        if (!data.partType) {
            errors.push({ field: 'partType', message: 'Part type is required', code: 'REQUIRED', severity: 'error' });
        } else if (!validPartTypes.includes(data.partType)) {
            errors.push({
                field: 'partType',
                message: `Part type must be one of: ${validPartTypes.join(', ')}`,
                code: 'INVALID_VALUE',
                severity: 'error'
            });
        }

        return { valid: errors.length === 0, errors };
    }

    async validatePriceBands(productId: string): Promise<ValidationResult> {
        const errors: RuleError[] = [];

        const bandCount = await this.prisma.productPriceBand.count({
            where: { productId }
        });

        if (bandCount === 0) {
            errors.push({
                field: 'bandPrices',
                message: 'Product must have at least one price band',
                code: 'NO_PRICES',
                severity: 'critical'
            });
        }

        const bands = await this.prisma.productPriceBand.findMany({
            where: { productId },
            select: { bandCode: true, price: true }
        });

        for (const band of bands) {
            if (!['1', '2', '3', '4'].includes(band.bandCode)) {
                errors.push({
                    field: 'bandCode',
                    message: `Invalid band code: ${band.bandCode}`,
                    code: 'INVALID_BAND_CODE',
                    severity: 'error'
                });
            }

            if (Number(band.price) <= 0) {
                errors.push({
                    field: 'price',
                    message: `Price must be positive for band ${band.bandCode}`,
                    code: 'INVALID_PRICE',
                    severity: 'error'
                });
            }
        }

        return { valid: errors.length === 0, errors };
    }

    async validateProductExists(productCode: string): Promise<ValidationResult> {
        const errors: RuleError[] = [];

        const product = await this.prisma.product.findUnique({
            where: { productCode },
            select: { id: true, isActive: true }
        });

        if (!product) {
            errors.push({
                field: 'productCode',
                message: `Product not found: ${productCode}`,
                code: 'NOT_FOUND',
                severity: 'critical'
            });
        } else if (!product.isActive) {
            errors.push({
                field: 'productCode',
                message: `Product is inactive: ${productCode}`,
                code: 'INACTIVE',
                severity: 'error'
            });
        }

        return { valid: errors.length === 0, errors };
    }
}
