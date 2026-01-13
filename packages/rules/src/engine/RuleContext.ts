/**
 * Rule Context
 * Provides context for rule evaluation including Prisma client and dealer info
 */

import { PrismaClient } from '@prisma/client';

// Define dealer shape locally since generic DealerContext was removed from types
export interface RuleContextDealer {
    dealerAccountId: string;
    accountNo: string;
    companyName: string;
    status: string;
    entitlement: string;
    bandAssignments: Array<{ partType: string; bandCode: string }>;
}

export interface RuleContextData {
    prisma: PrismaClient;
    dealer?: RuleContextDealer;
    userId?: string;
    requestId?: string;
    timestamp?: Date;
}

export class RuleContext {
    public readonly prisma: PrismaClient;
    public readonly dealer?: RuleContextDealer;
    public readonly userId?: string;
    public readonly requestId: string;
    public readonly timestamp: Date;

    constructor(data: RuleContextData) {
        this.prisma = data.prisma;
        this.dealer = data.dealer;
        this.userId = data.userId;
        this.requestId = data.requestId || this.generateRequestId();
        this.timestamp = data.timestamp || new Date();
    }

    private generateRequestId(): string {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Create context from Prisma client and dealer ID
     */
    static async createContext(
        prisma: PrismaClient,
        dealerAccountId?: string,
        userId?: string
    ): Promise<RuleContext> {
        let dealer: RuleContextDealer | undefined;

        if (dealerAccountId) {
            const dealerData = await prisma.dealerAccount.findUnique({
                where: { id: dealerAccountId },
                include: {
                    bandAssignments: {
                        select: { partType: true, bandCode: true }
                    }
                }
            });

            if (dealerData) {
                dealer = {
                    dealerAccountId: dealerData.id,
                    accountNo: dealerData.accountNo,
                    companyName: dealerData.companyName,
                    status: dealerData.status,
                    entitlement: dealerData.entitlement,
                    bandAssignments: dealerData.bandAssignments.map(ba => ({
                        partType: ba.partType,
                        bandCode: ba.bandCode
                    }))
                };
            }
        }

        return new RuleContext({ prisma, dealer, userId });
    }

    /**
     * Get band code for a specific part type
     */
    getBandCodeForPartType(partType: string): string | undefined {
        return this.dealer?.bandAssignments.find(ba => ba.partType === partType)?.bandCode;
    }

    /**
     * Check if dealer has a specific entitlement
     */
    hasEntitlement(entitlement: string): boolean {
        return this.dealer?.entitlement === entitlement;
    }

    /**
     * Check if dealer is active
     */
    isDealerActive(): boolean {
        return this.dealer?.status === 'ACTIVE';
    }

    /**
     * Get dealer account ID or throw if not set
     */
    requireDealerAccountId(): string {
        if (!this.dealer?.dealerAccountId) {
            throw new Error('Dealer context required but not set');
        }
        return this.dealer.dealerAccountId;
    }

    /**
     * Clone context with additional data
     */
    with(overrides: Partial<RuleContextData>): RuleContext {
        return new RuleContext({
            prisma: overrides.prisma || this.prisma,
            dealer: overrides.dealer || this.dealer,
            userId: overrides.userId || this.userId,
            requestId: this.requestId, // Keep same request ID
            timestamp: this.timestamp
        });
    }
}
