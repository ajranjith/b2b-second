/**
 * Pricing Validator
 * Input validation for pricing operations
 */

import { ValidationResult, FieldValidationError, PricingInput } from '../types';

export class PricingValidator {
    /**
     * Validate pricing calculation input
     */
    validatePricingInput(input: PricingInput): ValidationResult {
        const errors: FieldValidationError[] = [];

        // Dealer account ID required
        if (!input.dealerAccountId) {
            errors.push({ field: 'dealerAccountId', message: 'Dealer account ID is required', code: 'REQUIRED' });
        }

        // Product code required
        if (!input.productCode) {
            errors.push({ field: 'productCode', message: 'Product code is required', code: 'REQUIRED' });
        }

        // Quantity must be positive integer
        if (input.qty === undefined || input.qty === null) {
            errors.push({ field: 'qty', message: 'Quantity is required', code: 'REQUIRED' });
        } else if (input.qty <= 0) {
            errors.push({ field: 'qty', message: 'Quantity must be greater than 0', code: 'INVALID_VALUE' });
        } else if (!Number.isInteger(input.qty)) {
            errors.push({ field: 'qty', message: 'Quantity must be a whole number', code: 'INVALID_VALUE' });
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * Validate band code is valid (1-4)
     */
    validateBandCode(code: string): ValidationResult {
        const errors: FieldValidationError[] = [];
        const validCodes = ['1', '2', '3', '4'];

        if (!code) {
            errors.push({ field: 'bandCode', message: 'Band code is required', code: 'REQUIRED' });
        } else if (!validCodes.includes(code)) {
            errors.push({
                field: 'bandCode',
                message: `Band code must be one of: ${validCodes.join(', ')}`,
                code: 'INVALID_VALUE'
            });
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * Validate price is positive
     */
    validatePrice(price: number): ValidationResult {
        const errors: FieldValidationError[] = [];

        if (price === undefined || price === null) {
            errors.push({ field: 'price', message: 'Price is required', code: 'REQUIRED' });
        } else if (price <= 0) {
            errors.push({ field: 'price', message: 'Price must be greater than 0', code: 'INVALID_VALUE' });
        }

        return { valid: errors.length === 0, errors };
    }
}
