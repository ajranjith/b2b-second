// packages/rules/src/engine/RuleEngine.ts
import { PrismaClient } from '@prisma/client'
import { PricingRules } from '../rules/PricingRules'
import { OrderRules } from '../rules/OrderRules'
import { EntitlementRules } from '../rules/EntitlementRules'

export class RuleEngine {
    public pricing: PricingRules
    public orders: OrderRules
    public entitlements: typeof EntitlementRules

    constructor(private prisma: PrismaClient) {
        this.pricing = new PricingRules(prisma)
        this.orders = new OrderRules(prisma)
        this.entitlements = EntitlementRules
    }

    /**
     * Initialize rule engine with database connection
     */
    static create(prisma: PrismaClient): RuleEngine {
        return new RuleEngine(prisma)
    }
}

// Export singleton instance
export const createRuleEngine = (prisma: PrismaClient) => RuleEngine.create(prisma)
