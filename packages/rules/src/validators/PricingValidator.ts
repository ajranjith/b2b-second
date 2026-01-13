/**
 * Pricing Validator
 * Input validation for pricing operations
 */

import { ValidationResult, RuleError } from '../types';

export interface PricingInput {
    dealerAccountId: string;
    productCode: string;
    quantity: number;
}

export class PricingValidator {
    validatePricingInput(input: PricingInput): ValidationResult {
        const errors: RuleError[] = [];

        if (!input.dealerAccountId) {
            errors.push({ field: 'dealerAccountId', message: 'Dealer account ID is required', code: 'REQUIRED', severity: 'error' });
        }

        if (!input.productCode) {
            errors.push({ field: 'productCode', message: 'Product code is required', code: 'REQUIRED', severity: 'error' });
        }

        if (input.quantity === undefined || input.quantity === null) {
            errors.push({ field: 'quantity', message: 'Quantity is required', code: 'REQUIRED', severity: 'error' });
        } else if (input.quantity <= 0) {
            errors.push({ field: 'quantity', message: 'Quantity must be greater than 0', code: 'INVALID_VALUE', severity: 'error' });
        } else if (!Number.isInteger(input.quantity)) {
            errors.push({ field: 'quantity', message: 'Quantity must be a whole number', code: 'INVALID_VALUE', severity: 'error' });
        }

        return { valid: errors.length === 0, errors };
    }

    validateBandCode(code: string): ValidationResult {
        const errors: RuleError[] = [];
        const validCodes = ['1', '2', '3', '4'];

        if (!code) {
            errors.push({ field: 'bandCode', message: 'Band code is required', code: 'REQUIRED', severity: 'error' });
        } else if (!validCodes.includes(code)) {
            errors.push({
                field: 'bandCode',
                message: `Band code must be one of: ${validCodes.join(', ')}`,
                code: 'INVALID_VALUE',
                severity: 'error'
            });
        }

        return { valid: errors.length === 0, errors };
    }

    validatePrice(price: number): ValidationResult {
        const errors: RuleError[] = [];

        if (price === undefined || price === null) {
            errors.push({ field: 'price', message: 'Price is required', code: 'REQUIRED', severity: 'error' });
        } else if (price <= 0) {
            errors.push({ field: 'price', message: 'Price must be greater than 0', code: 'INVALID_VALUE', severity: 'error' });
        }

        return { valid: errors.length === 0, errors };
    }
}
