/**
 * Rule Engine Types
 * Shared types for validators, rules, and engine
 */

import { Prisma } from '@prisma/client';

// Re-export Prisma enums for convenience
export { PartType, Entitlement, DealerStatus, OrderStatus } from '@prisma/client';

// ============================================================================
// Result Types
// ============================================================================

export interface RuleResult<T> {
    success: boolean;
    data?: T;
    error?: string;
    errorCode?: string;
}

export interface ValidationResult {
    valid: boolean;
    errors: FieldValidationError[];
}

export interface FieldValidationError {
    field: string;
    message: string;
    code?: string;
}

// ============================================================================
// Context Types
// ============================================================================

export interface DealerContext {
    dealerAccountId: string;
    accountNo: string;
    companyName: string;
    status: string;
    entitlement: string;
    bandAssignments: BandAssignment[];
}

export interface BandAssignment {
    partType: string;
    bandCode: string;
}

export interface ProductContext {
    productId: string;
    productCode: string;
    description: string;
    partType: string;
    isActive: boolean;
    freeStock?: number;
}

export interface OrderContext {
    orderId?: string;
    dealerAccountId: string;
    dealerUserId: string;
    status?: string;
    lines: OrderLineContext[];
}

export interface OrderLineContext {
    productCode: string;
    qty: number;
    unitPrice?: number;
    bandCode?: string;
}

// ============================================================================
// Pricing Types
// ============================================================================

export interface PriceCalculation {
    productId: string;
    productCode: string;
    description: string;
    partType: string;
    qty: number;
    bandCode: string;
    unitPrice: number;
    totalPrice: number;
    minPriceApplied: boolean;
    currency: string;
    available: boolean;
}

export interface PricingInput {
    dealerAccountId: string;
    productCode: string;
    qty: number;
}

// ============================================================================
// Stock Types
// ============================================================================

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface StockInfo {
    productId: string;
    freeStock: number;
    status: StockStatus;
    available: boolean;
}

// ============================================================================
// Rule Definitions
// ============================================================================

export interface Rule<TInput, TOutput> {
    name: string;
    description?: string;
    execute(input: TInput): Promise<RuleResult<TOutput>>;
}

export interface Validator<T> {
    validate(data: T): ValidationResult;
}

// ============================================================================
// Engine Types
// ============================================================================

// Note: RuleEngineConfig is defined in engine/RuleEngine.ts

export interface ExecutionResult<T> {
    success: boolean;
    data?: T;
    validationErrors?: FieldValidationError[];
    executionError?: string;
    duration?: number;
}

