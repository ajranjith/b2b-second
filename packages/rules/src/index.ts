/**
 * Rules Package - Main Exports
 * 
 * Comprehensive rule engine for business logic:
 * - Validators: Input and data validation
 * - Rules: Business logic implementation
 * - Engine: Orchestration and context management
 */

// ============================================================================
// Types and Errors
// ============================================================================
export * from './types';
export * from './errors';

// ============================================================================
// Validators
// ============================================================================
export * from './validators';

// ============================================================================
// Rules
// ============================================================================
export * from './rules';

// ============================================================================
// Engine
// ============================================================================
export * from './engine';

// ============================================================================
// Legacy Exports (keep for backward compatibility)
// ============================================================================
export { PricingService, EntitlementError as LegacyEntitlementError, type PriceResult } from './PricingService';

// CartRules and CheckoutRules - keep existing functionality
import { PricingService } from './PricingService';

export class CartRules {
    constructor(private pricingService: PricingService) { }

    async calculateCartTotals(dealerAccountId: string, items: { productCode: string; qty: number }[]) {
        let subtotal = 0;
        const lineDetails = [];

        for (const item of items) {
            const pricing = await this.pricingService.calculatePrice(dealerAccountId, item.productCode, item.qty);
            subtotal += pricing.totalPrice;
            lineDetails.push(pricing);
        }

        return {
            subtotal,
            currency: 'GBP',
            items: lineDetails
        };
    }
}

export class CheckoutRules {
    constructor(private pricingService: PricingService) { }

    async createOrderSnapshot(dealerAccountId: string, dealerUserId: string, items: { productCode: string; qty: number }[]) {
        const cartCalculation = await new CartRules(this.pricingService).calculateCartTotals(dealerAccountId, items);

        const orderLines = cartCalculation.items.map(item => ({
            productCode: item.productCode,
            qty: item.qty,
            unitPrice: item.unitPrice,
            lineTotal: item.totalPrice,
            description: item.description,
            bandCode: item.bandCode,
            minPriceApplied: item.minPriceApplied
        }));

        return {
            dealerAccountId,
            dealerUserId,
            status: 'PROCESSING',
            subtotal: cartCalculation.subtotal,
            total: cartCalculation.subtotal,
            currency: cartCalculation.currency,
            lines: orderLines
        };
    }
}
