/**
 * Dealer Validator
 * Business rules for dealer account validation
 */

import { PrismaClient } from '@prisma/client';
import { ValidationResult, RuleError } from '../types';

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

    validateDealerAccount(data: DealerAccountInput): ValidationResult {
        const errors: RuleError[] = [];

        if (!data.accountNo || data.accountNo.trim().length === 0) {
            errors.push({ field: 'accountNo', message: 'Account number is required', code: 'REQUIRED', severity: 'error' });
        }

        if (!data.companyName || data.companyName.trim().length === 0) {
            errors.push({ field: 'companyName', message: 'Company name is required', code: 'REQUIRED', severity: 'error' });
        }

        if (data.mainEmail && !EMAIL_REGEX.test(data.mainEmail)) {
            errors.push({ field: 'mainEmail', message: 'Invalid email format', code: 'INVALID_FORMAT', severity: 'error' });
        }

        const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
        if (data.status && !validStatuses.includes(data.status)) {
            errors.push({
                field: 'status',
                message: `Status must be one of: ${validStatuses.join(', ')}`,
                code: 'INVALID_VALUE',
                severity: 'error'
            });
        }

        const validEntitlements = ['GENUINE_ONLY', 'AFTERMARKET_ONLY', 'SHOW_ALL'];
        if (data.entitlement && !validEntitlements.includes(data.entitlement)) {
            errors.push({
                field: 'entitlement',
                message: `Entitlement must be one of: ${validEntitlements.join(', ')}`,
                code: 'INVALID_VALUE',
                severity: 'error'
            });
        }

        return { valid: errors.length === 0, errors };
    }

    async validateBandAssignments(dealerAccountId: string): Promise<ValidationResult> {
        const errors: RuleError[] = [];
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
                    code: 'MISSING_BAND',
                    severity: 'critical'
                });
            }
        }

        for (const assignment of assignments) {
            if (!['1', '2', '3', '4'].includes(assignment.bandCode)) {
                errors.push({
                    field: 'bandCode',
                    message: `Invalid band code ${assignment.bandCode} for ${assignment.partType}`,
                    code: 'INVALID_BAND_CODE',
                    severity: 'error'
                });
            }
        }

        return { valid: errors.length === 0, errors };
    }

    async validateUserAssociation(dealerAccountId: string): Promise<ValidationResult> {
        const errors: RuleError[] = [];

        const userCount = await this.prisma.dealerUser.count({
            where: { dealerAccountId }
        });

        if (userCount === 0) {
            errors.push({
                field: 'users',
                message: 'Dealer account must have at least one associated user',
                code: 'NO_USER',
                severity: 'critical'
            });
        }

        return { valid: errors.length === 0, errors };
    }

    async validateDealer(dealerAccountId: string): Promise<ValidationResult> {
        const allErrors: RuleError[] = [];

        const dealer = await this.prisma.dealerAccount.findUnique({
            where: { id: dealerAccountId },
            select: { accountNo: true, companyName: true, status: true, entitlement: true, mainEmail: true }
        });

        if (!dealer) {
            return {
                valid: false,
                errors: [{ field: 'dealerAccountId', message: 'Dealer account not found', code: 'NOT_FOUND', severity: 'critical' }]
            };
        }

        const bandResult = await this.validateBandAssignments(dealerAccountId);
        allErrors.push(...bandResult.errors);

        const userResult = await this.validateUserAssociation(dealerAccountId);
        allErrors.push(...userResult.errors);

        return { valid: allErrors.length === 0, errors: allErrors };
    }
}
