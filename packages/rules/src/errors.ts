// packages/rules/src/errors.ts

export class BusinessRuleError extends Error {
    constructor(
        message: string,
        public code: string,
        public field?: string
    ) {
        super(message)
        this.name = 'BusinessRuleError'
    }
}

export class PricingRuleError extends BusinessRuleError {
    constructor(message: string, field?: string) {
        super(message, 'PRICING_ERROR', field)
        this.name = 'PricingRuleError'
    }
}

export class EntitlementError extends BusinessRuleError {
    constructor(message: string, field?: string) {
        super(message, 'ENTITLEMENT_ERROR', field)
        this.name = 'EntitlementError'
    }
}

export class OrderValidationError extends BusinessRuleError {
    constructor(message: string, field?: string) {
        super(message, 'ORDER_VALIDATION_ERROR', field)
        this.name = 'OrderValidationError'
    }
}

export class InventoryRuleError extends BusinessRuleError {
    constructor(message: string, field?: string) {
        super(message, 'INVENTORY_ERROR', field)
        this.name = 'InventoryRuleError'
    }
}
