/**
 * Product Validator
 * Business rules for product validation
 */

import { PrismaClient } from '@prisma/client';
import { ValidationResult, FieldValidationError } from '../types';

export interface ProductInput {
    productCode: string;
    description: string;
    partType: string;
    isActive?: boolean;
}

export class ProductValidator {
    constructor(private prisma: PrismaClient) { }

    /**
     * Validate product data for creation/update
     */
    validateProduct(data: ProductInput): ValidationResult {
        const errors: FieldValidationError[] = [];

        // Product code required and non-empty
        if (!data.productCode || data.productCode.trim().length === 0) {
            errors.push({ field: 'productCode', message: 'Product code is required', code: 'REQUIRED' });
        }

        // Description required and non-empty
        if (!data.description || data.description.trim().length === 0) {
            errors.push({ field: 'description', message: 'Description is required', code: 'REQUIRED' });
        }

        // Part type required and valid
        const validPartTypes = ['GENUINE', 'AFTERMARKET', 'BRANDED'];
        if (!data.partType) {
            errors.push({ field: 'partType', message: 'Part type is required', code: 'REQUIRED' });
        } else if (!validPartTypes.includes(data.partType)) {
            errors.push({
                field: 'partType',
                message: `Part type must be one of: ${validPartTypes.join(', ')}`,
                code: 'INVALID_VALUE'
            });
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * Validate that product has at least one price band
     */
    async validatePriceBands(productId: string): Promise<ValidationResult> {
        const errors: FieldValidationError[] = [];

        const bandCount = await this.prisma.productPriceBand.count({
            where: { productId }
        });

        if (bandCount === 0) {
            errors.push({
                field: 'bandPrices',
                message: 'Product must have at least one price band',
                code: 'NO_PRICES'
            });
        }

        // Validate band codes are 1-4
        const bands = await this.prisma.productPriceBand.findMany({
            where: { productId },
            select: { bandCode: true, price: true }
        });

        for (const band of bands) {
            if (!['1', '2', '3', '4'].includes(band.bandCode)) {
                errors.push({
                    field: 'bandCode',
                    message: `Invalid band code: ${band.bandCode}`,
                    code: 'INVALID_BAND_CODE'
                });
            }

            if (Number(band.price) <= 0) {
                errors.push({
                    field: 'price',
                    message: `Price must be positive for band ${band.bandCode}`,
                    code: 'INVALID_PRICE'
                });
            }
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * Validate product exists and is active
     */
    async validateProductExists(productCode: string): Promise<ValidationResult> {
        const errors: FieldValidationError[] = [];

        const product = await this.prisma.product.findUnique({
            where: { productCode },
            select: { id: true, isActive: true }
        });

        if (!product) {
            errors.push({
                field: 'productCode',
                message: `Product not found: ${productCode}`,
                code: 'NOT_FOUND'
            });
        } else if (!product.isActive) {
            errors.push({
                field: 'productCode',
                message: `Product is inactive: ${productCode}`,
                code: 'INACTIVE'
            });
        }

        return { valid: errors.length === 0, errors };
    }
}
