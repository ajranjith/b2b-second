/**
 * Rule Engine
 * Orchestrates validators and rules execution
 */

import { PrismaClient } from '@prisma/client';
import { ExecutionResult, ValidationResult, PriceCalculation, OrderContext } from '../types';
import { RuleContext } from './RuleContext';
import { ValidationError } from '../errors';

// Import validators
import { DealerValidator } from '../validators/DealerValidator';
import { ProductValidator } from '../validators/ProductValidator';
import { OrderValidator } from '../validators/OrderValidator';
import { PricingValidator } from '../validators/PricingValidator';

// Import rules
import { PricingRules } from '../rules/PricingRules';
import { InventoryRules } from '../rules/InventoryRules';
import { OrderRules } from '../rules/OrderRules';
import { EntitlementRules } from '../rules/EntitlementRules';

export interface RuleEngineConfig {
    strictMode?: boolean;
    logErrors?: boolean;
}

export class RuleEngine {
    private readonly config: RuleEngineConfig;

    // Validators
    public readonly dealerValidator: DealerValidator;
    public readonly productValidator: ProductValidator;
    public readonly orderValidator: OrderValidator;
    public readonly pricingValidator: PricingValidator;

    // Rules
    public readonly pricingRules: PricingRules;
    public readonly inventoryRules: InventoryRules;
    public readonly orderRules: OrderRules;
    public readonly entitlementRules: EntitlementRules;

    constructor(private prisma: PrismaClient, config: RuleEngineConfig = {}) {
        this.config = { strictMode: false, logErrors: true, ...config };

        // Initialize validators
        this.dealerValidator = new DealerValidator(prisma);
        this.productValidator = new ProductValidator(prisma);
        this.orderValidator = new OrderValidator(prisma);
        this.pricingValidator = new PricingValidator();

        // Initialize rules
        this.pricingRules = new PricingRules(prisma);
        this.inventoryRules = new InventoryRules(prisma);
        this.orderRules = new OrderRules(prisma);
        this.entitlementRules = new EntitlementRules();
    }

    /**
     * Create a rule context for a dealer
     */
    async createContext(dealerAccountId?: string, userId?: string): Promise<RuleContext> {
        return RuleContext.createContext(this.prisma, dealerAccountId, userId);
    }

    /**
     * Calculate price with full validation
     */
    async calculatePrice(
        dealerAccountId: string,
        productCode: string,
        qty: number
    ): Promise<ExecutionResult<PriceCalculation>> {
        const startTime = Date.now();

        try {
            // 1. Validate input
            const validation = this.pricingValidator.validatePricingInput({
                dealerAccountId,
                productCode,
                qty
            });

            if (!validation.valid) {
                return {
                    success: false,
                    validationErrors: validation.errors,
                    duration: Date.now() - startTime
                };
            }

            // 2. Check entitlement
            const context = await this.createContext(dealerAccountId);
            if (!context.dealer) {
                return {
                    success: false,
                    executionError: 'Dealer account not found',
                    duration: Date.now() - startTime
                };
            }

            // 3. Get product to check entitlement
            const product = await this.prisma.product.findUnique({
                where: { productCode },
                select: { partType: true, isActive: true }
            });

            if (!product) {
                return {
                    success: false,
                    executionError: `Product not found: ${productCode}`,
                    duration: Date.now() - startTime
                };
            }

            // 4. Check entitlement
            const canView = this.entitlementRules.canViewProduct(
                context.dealer.entitlement,
                product.partType
            );

            if (!canView) {
                return {
                    success: false,
                    executionError: 'Product not available for your account type',
                    duration: Date.now() - startTime
                };
            }

            // 5. Calculate price
            const result = await this.pricingRules.calculateDealerPrice({
                dealerAccountId,
                productCode,
                qty
            });

            return {
                success: result.success,
                data: result.data,
                executionError: result.error,
                duration: Date.now() - startTime
            };

        } catch (error) {
            if (this.config.logErrors) {
                console.error('[RuleEngine] Price calculation error:', error);
            }
            return {
                success: false,
                executionError: error instanceof Error ? error.message : 'Unknown error',
                duration: Date.now() - startTime
            };
        }
    }

    /**
     * Validate order before creation
     */
    async validateOrder(order: OrderContext): Promise<ValidationResult> {
        const errors = [...this.orderValidator.validateOrderCreate(order).errors];

        // Check dealer is active
        const canCreate = await this.orderRules.canCreateOrder(order.dealerAccountId);
        if (!canCreate.success) {
            errors.push({
                field: 'dealerAccountId',
                message: canCreate.error || 'Dealer cannot create orders',
                code: 'DEALER_INACTIVE'
            });
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * Check stock availability for multiple products
     */
    async checkStockAvailability(
        items: Array<{ productCode: string; qty: number }>
    ): Promise<ExecutionResult<Array<{ productCode: string; available: boolean; freeStock: number }>>> {
        const startTime = Date.now();

        try {
            const results = [];

            for (const item of items) {
                const product = await this.prisma.product.findUnique({
                    where: { productCode: item.productCode },
                    include: { stock: true }
                });

                if (!product) {
                    results.push({
                        productCode: item.productCode,
                        available: false,
                        freeStock: 0
                    });
                    continue;
                }

                const freeStock = product.stock?.freeStock ?? 0;
                results.push({
                    productCode: item.productCode,
                    available: freeStock >= item.qty,
                    freeStock
                });
            }

            return {
                success: true,
                data: results,
                duration: Date.now() - startTime
            };

        } catch (error) {
            return {
                success: false,
                executionError: error instanceof Error ? error.message : 'Stock check failed',
                duration: Date.now() - startTime
            };
        }
    }

    /**
     * Validate dealer has all required data
     */
    async validateDealerComplete(dealerAccountId: string): Promise<ValidationResult> {
        return this.dealerValidator.validateDealer(dealerAccountId);
    }
}
