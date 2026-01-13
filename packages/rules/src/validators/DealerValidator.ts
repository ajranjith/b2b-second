/**
 * Dealer Validator
 * Business rules for dealer account validation
 */

import { PrismaClient } from '@prisma/client';
import { ValidationResult, FieldValidationError } from '../types';
import { ValidationError, DealerError } from '../errors';

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export interface DealerAccountInput {
    accountNo: string;
    companyName: string;
    mainEmail?: string | null;
    status?: string;
    entitlement?: string;
}

export class DealerValidator {
    constructor(private prisma: PrismaClient) { }

    /**
     * Validate dealer account data for creation/update
     */
    validateDealerAccount(data: DealerAccountInput): ValidationResult {
        const errors: FieldValidationError[] = [];

        // Account number required and non-empty
        if (!data.accountNo || data.accountNo.trim().length === 0) {
            errors.push({ field: 'accountNo', message: 'Account number is required', code: 'REQUIRED' });
        }

        // Company name required and non-empty
        if (!data.companyName || data.companyName.trim().length === 0) {
            errors.push({ field: 'companyName', message: 'Company name is required', code: 'REQUIRED' });
        }

        // Email format if provided
        if (data.mainEmail && !EMAIL_REGEX.test(data.mainEmail)) {
            errors.push({ field: 'mainEmail', message: 'Invalid email format', code: 'INVALID_FORMAT' });
        }

        // Valid status if provided
        const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
        if (data.status && !validStatuses.includes(data.status)) {
            errors.push({
                field: 'status',
                message: `Status must be one of: ${validStatuses.join(', ')}`,
                code: 'INVALID_VALUE'
            });
        }

        // Valid entitlement if provided
        const validEntitlements = ['GENUINE_ONLY', 'AFTERMARKET_ONLY', 'SHOW_ALL'];
        if (data.entitlement && !validEntitlements.includes(data.entitlement)) {
            errors.push({
                field: 'entitlement',
                message: `Entitlement must be one of: ${validEntitlements.join(', ')}`,
                code: 'INVALID_VALUE'
            });
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * Validate that dealer has all 3 required band assignments
     */
    async validateBandAssignments(dealerAccountId: string): Promise<ValidationResult> {
        const errors: FieldValidationError[] = [];
        const requiredPartTypes = ['GENUINE', 'AFTERMARKET', 'BRANDED'];

        const assignments = await this.prisma.dealerBandAssignment.findMany({
            where: { dealerAccountId },
            select: { partType: true, bandCode: true }
        });

        const assignedTypes = assignments.map(a => a.partType);

        for (const partType of requiredPartTypes) {
            if (!assignedTypes.includes(partType as any)) {
                errors.push({
                    field: 'bandAssignments',
                    message: `Missing band assignment for ${partType}`,
                    code: 'MISSING_BAND'
                });
            }
        }

        // Validate band codes are 1-4
        for (const assignment of assignments) {
            if (!['1', '2', '3', '4'].includes(assignment.bandCode)) {
                errors.push({
                    field: 'bandCode',
                    message: `Invalid band code ${assignment.bandCode} for ${assignment.partType}`,
                    code: 'INVALID_BAND_CODE'
                });
            }
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * Validate that dealer has at least one associated user
     */
    async validateUserAssociation(dealerAccountId: string): Promise<ValidationResult> {
        const errors: FieldValidationError[] = [];

        const userCount = await this.prisma.dealerUser.count({
            where: { dealerAccountId }
        });

        if (userCount === 0) {
            errors.push({
                field: 'users',
                message: 'Dealer account must have at least one associated user',
                code: 'NO_USER'
            });
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * Full dealer validation including all business rules
     */
    async validateDealer(dealerAccountId: string): Promise<ValidationResult> {
        const allErrors: FieldValidationError[] = [];

        // Check dealer exists
        const dealer = await this.prisma.dealerAccount.findUnique({
            where: { id: dealerAccountId },
            select: { accountNo: true, companyName: true, status: true, entitlement: true, mainEmail: true }
        });

        if (!dealer) {
            return {
                valid: false,
                errors: [{ field: 'dealerAccountId', message: 'Dealer account not found', code: 'NOT_FOUND' }]
            };
        }

        // Validate band assignments
        const bandResult = await this.validateBandAssignments(dealerAccountId);
        allErrors.push(...bandResult.errors);

        // Validate user association
        const userResult = await this.validateUserAssociation(dealerAccountId);
        allErrors.push(...userResult.errors);

        return { valid: allErrors.length === 0, errors: allErrors };
    }
}
