import prisma from '../lib/prisma';
import { erpConnector } from './erpConnector';
import { OrderStatus, PartType } from '@prisma/client';

export interface OrderInput {
    dealerAccountId: string;
    dealerUserId: string;
    source: 'WEB' | 'ADMIN' | 'EDI';
    items: Array<{
        productCode: string;
        qty: number;
    }>;
}

export class OrderEngine {
    async createOrder(input: OrderInput) {
        console.log(`📦 [Order Engine] Processing order from ${input.source} for dealer ${input.dealerAccountId}`);

        // 1. Validation Logic
        const validatedLines = [];
        let orderTotal = 0;

        for (const item of input.items) {
            // Find product in local DB (nightly-synced replica simulation)
            const product = await prisma.product.findUnique({
                where: { productCode: item.productCode },
                include: {
                    refPrice: true,
                    stock: true
                }
            });

            if (!product) {
                throw new Error(`Invalid SKU: ${item.productCode}`);
            }

            if (product.stock && product.stock.freeStock < item.qty) {
                console.warn(`⚠️ [Order Engine] Short stock for ${item.productCode}: requested ${item.qty}, only ${product.stock.freeStock} available.`);
            }

            // Calculate price (simplified for now, usually uses PriceBand logic)
            const unitPrice = product.refPrice?.tradePrice || 0;
            const amount = unitPrice * item.qty;
            orderTotal += amount;

            validatedLines.push({
                productId: product.id,
                productCodeSnapshot: product.productCode,
                descriptionSnapshot: product.description,
                partTypeSnapshot: product.partType,
                qty: item.qty,
                unitPriceSnapshot: unitPrice,
                bandCodeSnapshot: 'DEFAULT'
            });
        }

        // 2. Persist Locally (Pre-Validation Success)
        const orderNo = `ORD-${Date.now()}`;
        const order = await prisma.orderHeader.create({
            data: {
                orderNo,
                dealerAccountId: input.dealerAccountId,
                dealerUserId: input.dealerUserId,
                status: OrderStatus.PROCESSING,
                total: orderTotal,
                lines: {
                    create: validatedLines
                }
            },
            include: {
                lines: true
            }
        });

        // 3. Push to ERP "Suspended" State
        try {
            const erpResult = await erpConnector.pushToSuspended(order);

            // Update local record with ERP reference
            await prisma.orderHeader.update({
                where: { id: order.id },
                data: {
                    status: OrderStatus.COMPLETED, // Map to completed when ERP accepts
                    comments: `ERP Synced: ${erpResult.erpReference}`
                }
            });

            return {
                success: true,
                orderNo,
                erpReference: erpResult.erpReference
            };
        } catch (error: any) {
            console.error(`❌ [Order Engine] ERP sync failed for ${orderNo}:`, error.message);

            // Keep as processing or update to failed
            await prisma.orderHeader.update({
                where: { id: order.id },
                data: {
                    status: OrderStatus.PENDING,
                    comments: `Sync Failed: ${error.message}`
                }
            });

            throw new Error(`Order validated but ERP sync failed: ${error.message}`);
        }
    }
}

export const orderEngine = new OrderEngine();
