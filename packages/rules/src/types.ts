/**
 * Rule Engine Types
 * Defined by user requirements
 */

import { Prisma, PartType, DealerStatus, Entitlement } from '@prisma/client'

// Re-export for convenience
export { PartType, DealerStatus, Entitlement, Prisma }

// Rule result types
export interface RuleResult<T = any> {
    success: boolean
    data?: T
    errors?: RuleError[]
    warnings?: RuleWarning[]
}

export interface RuleError {
    code: string
    message: string
    field?: string
    severity: 'error' | 'critical'
}

export interface RuleWarning {
    code: string
    message: string
    field?: string
}

// Pricing types
export interface PricingContext {
    dealerAccountId: string
    dealerStatus: DealerStatus
    entitlement: Entitlement
    productId: string
    productCode: string
    partType: PartType
    quantity: number
}

export interface PricingResult {
    price: Prisma.Decimal
    bandCode: string
    minimumPriceApplied: boolean
    available: boolean
    reason?: string
    // Additional fields useful for UI
    unitPrice?: number
    totalPrice?: number
    currency?: string
    description?: string
}

// Order types
export interface OrderCreationContext {
    dealerAccountId: string
    dealerStatus: DealerStatus
    cartItems: Array<{
        productId: string
        productCode: string
        quantity: number
        unitPrice?: number // Helpful for validation
    }>
    dispatchMethod?: string
    poRef?: string
    notes?: string
}

export interface OrderValidationResult extends RuleResult {
    canProceed: boolean
    blockers?: string[]
}

// Entitlement types
export interface EntitlementCheck {
    dealerId: string
    partType: PartType
    action: 'view' | 'purchase' | 'quote'
}

export interface EntitlementResult {
    allowed: boolean
    reason?: string
}

// Inventory types
export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface StockInfo {
    productId: string;
    freeStock: number;
    status: StockStatus;
    available: boolean;
}

// ============================================================================
// Legacy / Helper Types (maintained for compatibility during refactor)
// ============================================================================

export interface ValidationResult {
    valid: boolean;
    errors: RuleError[];
}

export interface ExecutionResult<T> extends RuleResult<T> {
    executionError?: string;
    duration?: number;
}
