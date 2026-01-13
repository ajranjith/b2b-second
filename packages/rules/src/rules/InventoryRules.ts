/**
 * Inventory Rules
 * Stock availability and status rules
 */

import { PrismaClient } from '@prisma/client';
import { RuleResult, StockInfo, StockStatus } from '../types';
import { InventoryError } from '../errors';

const LOW_STOCK_THRESHOLD = 10;

export class InventoryRules {
    constructor(private prisma: PrismaClient) { }

    /**
     * Check if sufficient stock is available for a product
     */
    async checkAvailability(productId: string, requestedQty: number): Promise<RuleResult<boolean>> {
        try {
            const stock = await this.prisma.productStock.findUnique({
                where: { productId },
                select: { freeStock: true }
            });

            const available = stock?.freeStock ?? 0;

            if (available < requestedQty) {
                return {
                    success: false,
                    data: false,
                    error: `Insufficient stock: requested ${requestedQty}, available ${available}`,
                    errorCode: 'INSUFFICIENT_STOCK'
                };
            }

            return { success: true, data: true };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Stock check failed',
                errorCode: 'INVENTORY_ERROR'
            };
        }
    }

    /**
     * Get detailed stock status for a product
     */
    async getStockStatus(productId: string): Promise<RuleResult<StockInfo>> {
        try {
            const stock = await this.prisma.productStock.findUnique({
                where: { productId },
                select: { freeStock: true }
            });

            const freeStock = stock?.freeStock ?? 0;
            const status = this.determineStockStatus(freeStock);

            return {
                success: true,
                data: {
                    productId,
                    freeStock,
                    status,
                    available: freeStock > 0
                }
            };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get stock status',
                errorCode: 'INVENTORY_ERROR'
            };
        }
    }

    /**
     * Determine stock status based on quantity
     */
    determineStockStatus(freeStock: number): StockStatus {
        if (freeStock <= 0) {
            return 'OUT_OF_STOCK';
        }
        if (freeStock <= LOW_STOCK_THRESHOLD) {
            return 'LOW_STOCK';
        }
        return 'IN_STOCK';
    }

    /**
     * Get stock status for multiple products
     */
    async getStockStatusBatch(productIds: string[]): Promise<RuleResult<StockInfo[]>> {
        try {
            const stocks = await this.prisma.productStock.findMany({
                where: { productId: { in: productIds } },
                select: { productId: true, freeStock: true }
            });

            const stockMap = new Map(stocks.map(s => [s.productId, s.freeStock]));

            const results: StockInfo[] = productIds.map(productId => {
                const freeStock = stockMap.get(productId) ?? 0;
                return {
                    productId,
                    freeStock,
                    status: this.determineStockStatus(freeStock),
                    available: freeStock > 0
                };
            });

            return { success: true, data: results };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Batch stock check failed',
                errorCode: 'INVENTORY_ERROR'
            };
        }
    }
}
