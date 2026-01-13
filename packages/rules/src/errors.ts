/**
 * Rule Engine Custom Errors
 * Structured error classes for different failure types
 */

// ============================================================================
// Base Error
// ============================================================================

export class RuleError extends Error {
    public readonly code: string;
    public readonly details?: Record<string, unknown>;

    constructor(message: string, code: string = 'RULE_ERROR', details?: Record<string, unknown>) {
        super(message);
        this.name = 'RuleError';
        this.code = code;
        this.details = details;
    }
}

// ============================================================================
// Validation Errors
// ============================================================================

export interface FieldError {
    field: string;
    message: string;
}

export class ValidationError extends RuleError {
    public readonly fieldErrors: FieldError[];

    constructor(message: string, fieldErrors: FieldError[] = []) {
        super(message, 'VALIDATION_ERROR', { fieldErrors });
        this.name = 'ValidationError';
        this.fieldErrors = fieldErrors;
    }

    static fromField(field: string, message: string): ValidationError {
        return new ValidationError(message, [{ field, message }]);
    }

    static fromFields(errors: FieldError[]): ValidationError {
        const message = errors.map(e => `${e.field}: ${e.message}`).join('; ');
        return new ValidationError(message, errors);
    }
}

// ============================================================================
// Entitlement Error
// ============================================================================

export class EntitlementError extends RuleError {
    public readonly dealerEntitlement?: string;
    public readonly productPartType?: string;

    constructor(
        message: string = 'Product not available',
        dealerEntitlement?: string,
        productPartType?: string
    ) {
        super(message, 'ENTITLEMENT_ERROR', { dealerEntitlement, productPartType });
        this.name = 'EntitlementError';
        this.dealerEntitlement = dealerEntitlement;
        this.productPartType = productPartType;
    }
}

// ============================================================================
// Pricing Errors
// ============================================================================

export class PricingError extends RuleError {
    public readonly productCode?: string;
    public readonly bandCode?: string;

    constructor(message: string, productCode?: string, bandCode?: string) {
        super(message, 'PRICING_ERROR', { productCode, bandCode });
        this.name = 'PricingError';
        this.productCode = productCode;
        this.bandCode = bandCode;
    }

    static noPriceAvailable(productCode: string, bandCode: string): PricingError {
        return new PricingError(
            `No price available for product ${productCode} at band ${bandCode}`,
            productCode,
            bandCode
        );
    }

    static productNotFound(productCode: string): PricingError {
        return new PricingError(`Product not found: ${productCode}`, productCode);
    }

    static productInactive(productCode: string): PricingError {
        return new PricingError(`Product is inactive: ${productCode}`, productCode);
    }
}

// ============================================================================
// Inventory Errors
// ============================================================================

export class InventoryError extends RuleError {
    public readonly productCode?: string;
    public readonly requestedQty?: number;
    public readonly availableQty?: number;

    constructor(message: string, productCode?: string, requestedQty?: number, availableQty?: number) {
        super(message, 'INVENTORY_ERROR', { productCode, requestedQty, availableQty });
        this.name = 'InventoryError';
        this.productCode = productCode;
        this.requestedQty = requestedQty;
        this.availableQty = availableQty;
    }

    static insufficientStock(productCode: string, requested: number, available: number): InventoryError {
        return new InventoryError(
            `Insufficient stock for ${productCode}: requested ${requested}, available ${available}`,
            productCode,
            requested,
            available
        );
    }
}

// ============================================================================
// Order Errors
// ============================================================================

export class OrderError extends RuleError {
    public readonly orderId?: string;
    public readonly orderStatus?: string;

    constructor(message: string, orderId?: string, orderStatus?: string) {
        super(message, 'ORDER_ERROR', { orderId, orderStatus });
        this.name = 'OrderError';
        this.orderId = orderId;
        this.orderStatus = orderStatus;
    }

    static cannotModify(orderId: string, status: string): OrderError {
        return new OrderError(
            `Cannot modify order ${orderId} in ${status} status`,
            orderId,
            status
        );
    }

    static notFound(orderId: string): OrderError {
        return new OrderError(`Order not found: ${orderId}`, orderId);
    }
}

// ============================================================================
// Dealer Errors
// ============================================================================

export class DealerError extends RuleError {
    public readonly dealerAccountId?: string;

    constructor(message: string, dealerAccountId?: string) {
        super(message, 'DEALER_ERROR', { dealerAccountId });
        this.name = 'DealerError';
        this.dealerAccountId = dealerAccountId;
    }

    static notFound(dealerAccountId: string): DealerError {
        return new DealerError(`Dealer account not found: ${dealerAccountId}`, dealerAccountId);
    }

    static inactive(dealerAccountId: string): DealerError {
        return new DealerError(`Dealer account is inactive: ${dealerAccountId}`, dealerAccountId);
    }

    static missingBandAssignment(dealerAccountId: string, partType: string): DealerError {
        return new DealerError(
            `Dealer ${dealerAccountId} has no band assignment for ${partType}`,
            dealerAccountId
        );
    }
}
