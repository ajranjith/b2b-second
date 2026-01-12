import { PricingService } from './PricingService';
export * from './PricingService';
import { PrismaClient } from '@prisma/client';

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
    // Logic to prepare OrderHeader and OrderLine structures from a Cart
    // This effectively snapshots the prices at the moment of checkout.

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
            status: 'PROCESSING', // Initial status
            subtotal: cartCalculation.subtotal,
            total: cartCalculation.subtotal, // Tax logic would go here
            currency: cartCalculation.currency,
            lines: orderLines
        };
    }
}
