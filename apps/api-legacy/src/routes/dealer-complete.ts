import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { PrismaClient, OrderStatus } from "@prisma/client";
import { requireAuth, AuthenticatedRequest } from "../lib/auth";
import { CartServiceV2 } from "../services/CartServiceV2";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();
const cartService = new CartServiceV2(prisma);

/**
 * Complete dealer feature endpoints
 */
const dealerCompleteRoutes: FastifyPluginAsync = async (fastify) => {
  // ==================== CART ENDPOINTS ====================

  /**
   * GET /dealer/cart
   * Get current cart with refreshed prices
   */
  fastify.get(
    "/cart",
    {
      preHandler: requireAuth,
    },
    async (request: AuthenticatedRequest, reply) => {
      const user = request.user;

      if (!user?.dealerUserId || !user?.dealerAccountId) {
        return reply.code(401).send({ error: "Not authenticated as dealer" });
      }

      try {
        const cart = await cartService.getOrCreateCart(user.dealerUserId, user.dealerAccountId);

        return reply.send(cart);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({ error: "Failed to fetch cart" });
      }
    },
  );

  /**
   * POST /dealer/cart/items
   * Add item to cart
   */
  fastify.post(
    "/cart/items",
    {
      preHandler: requireAuth,
    },
    async (request: AuthenticatedRequest, reply) => {
      const addItemSchema = z.object({
        productId: z.string().uuid(),
        qty: z.number().int().min(1).max(9999),
      });

      const validation = addItemSchema.safeParse(request.body);

      if (!validation.success) {
        return reply.code(400).send({
          error: "Validation Error",
          details: validation.error.issues,
        });
      }

      const user = request.user;

      if (!user?.dealerUserId || !user?.dealerAccountId) {
        return reply.code(401).send({ error: "Not authenticated as dealer" });
      }

      try {
        const cart = await cartService.addItem(
          user.dealerUserId,
          user.dealerAccountId,
          validation.data,
        );

        return reply.send(cart);
      } catch (error: any) {
        fastify.log.error(error);

        if (error.message === "Product not found") {
          return reply.code(404).send({ error: "Product not found" });
        }

        return reply.code(500).send({ error: "Failed to add item to cart" });
      }
    },
  );

  /**
   * PATCH /dealer/cart/items/:itemId
   * Update cart item quantity
   */
  fastify.patch<{ Params: { itemId: string } }>(
    "/cart/items/:itemId",
    {
      preHandler: requireAuth,
    },
    async (request: AuthenticatedRequest, reply) => {
      const updateItemSchema = z.object({
        qty: z.number().int().min(1).max(9999),
      });

      const validation = updateItemSchema.safeParse(request.body);

      if (!validation.success) {
        return reply.code(400).send({
          error: "Validation Error",
          details: validation.error.issues,
        });
      }

      const user = request.user;

      if (!user?.dealerUserId || !user?.dealerAccountId) {
        return reply.code(401).send({ error: "Not authenticated as dealer" });
      }

      const { itemId } = request.params;

      try {
        const cart = await cartService.updateItem(
          itemId,
          user.dealerUserId,
          user.dealerAccountId,
          validation.data.qty,
        );

        return reply.send(cart);
      } catch (error: any) {
        fastify.log.error(error);

        if (error.message === "Cart item not found") {
          return reply.code(404).send({ error: "Cart item not found" });
        }

        return reply.code(500).send({ error: "Failed to update cart item" });
      }
    },
  );

  /**
   * DELETE /dealer/cart/items/:itemId
   * Remove item from cart
   */
  fastify.delete<{ Params: { itemId: string } }>(
    "/cart/items/:itemId",
    {
      preHandler: requireAuth,
    },
    async (request: AuthenticatedRequest, reply) => {
      const user = request.user;

      if (!user?.dealerUserId || !user?.dealerAccountId) {
        return reply.code(401).send({ error: "Not authenticated as dealer" });
      }

      const { itemId } = request.params;

      try {
        const cart = await cartService.removeItem(itemId, user.dealerUserId, user.dealerAccountId);

        return reply.send(cart);
      } catch (error: any) {
        fastify.log.error(error);

        if (error.message === "Cart item not found") {
          return reply.code(404).send({ error: "Cart item not found" });
        }

        return reply.code(500).send({ error: "Failed to remove cart item" });
      }
    },
  );

  // ==================== CHECKOUT ENDPOINT ====================

  /**
   * POST /dealer/checkout
   * Create suspended order + order export file
   */
  fastify.post(
    "/checkout",
    {
      preHandler: requireAuth,
    },
    async (request: AuthenticatedRequest, reply) => {
      const checkoutSchema = z.object({
        dispatchMethod: z.string().max(50).optional(),
        poRef: z.string().max(100).optional(),
        notes: z.string().max(500).optional(),
      });

      const validation = checkoutSchema.safeParse(request.body);

      if (!validation.success) {
        return reply.code(400).send({
          error: "Validation Error",
          details: validation.error.issues,
        });
      }

      const user = request.user;

      if (!user?.dealerUserId || !user?.dealerAccountId) {
        return reply.code(401).send({ error: "Not authenticated as dealer" });
      }

      try {
        // Get snapshotted cart
        const snapshot = await cartService.snapshotCartForCheckout(
          user.dealerUserId,
          user.dealerAccountId,
        );

        if (snapshot.items.length === 0) {
          return reply.code(400).send({ error: "Cart is empty" });
        }

        // Get dealer account
        const dealerAccount = await prisma.dealerAccount.findUnique({
          where: { id: user.dealerAccountId },
          select: { accountNo: true, companyName: true, status: true },
        });

        if (!dealerAccount) {
          return reply.code(404).send({ error: "Dealer account not found" });
        }

        if (dealerAccount.status !== "ACTIVE") {
          return reply.code(403).send({ error: "Account is not active" });
        }

        // Create order in transaction
        const order = await prisma.$transaction(async (tx) => {
          // Generate order number
          const orderCount = await tx.orderHeader.count();
          const orderNo = `ORD-${String(orderCount + 1).padStart(6, "0")}`;

          // Create order header
          const newOrder = await tx.orderHeader.create({
            data: {
              orderNo,
              dealerAccountId: user.dealerAccountId!,
              dealerUserId: user.dealerUserId!,
              status: OrderStatus.SUSPENDED,
              dispatchMethod: validation.data.dispatchMethod,
              poRef: validation.data.poRef,
              notes: validation.data.notes,
              subtotal: snapshot.subtotal,
              total: snapshot.subtotal,
              currency: "GBP",
              lines: {
                create: snapshot.items.map((item) => ({
                  productId: item.productId,
                  qty: item.qty,
                  unitPriceSnapshot: item.unitPriceSnapshot,
                  lineTotal: item.lineTotal,
                })),
              },
            },
            include: {
              lines: {
                include: {
                  product: {
                    select: {
                      productCode: true,
                      description: true,
                      partType: true,
                    },
                  },
                },
              },
            },
          });

          // Create order export lines
          for (const item of snapshot.items) {
            const product = await tx.product.findUnique({
              where: { id: item.productId },
              select: { productCode: true, description: true, partType: true },
            });

            if (product) {
              await tx.orderExportLine.create({
                data: {
                  orderHeaderId: newOrder.id,
                  accountNo: dealerAccount.accountNo,
                  lineType: "ORDER",
                  productCode: product.productCode,
                  description: product.description,
                  partType: product.partType,
                  qty: item.qty,
                  unitPrice: item.unitPriceSnapshot,
                },
              });
            }
          }

          // Clear cart
          await tx.cartItem.deleteMany({
            where: {
              cart: { dealerUserId: user.dealerUserId },
            },
          });

          return newOrder;
        });

        return reply.send({
          success: true,
          order: {
            id: order.id,
            orderNo: order.orderNo,
            status: order.status,
            subtotal: order.subtotal,
            total: order.total,
            currency: order.currency,
            createdAt: order.createdAt,
            lines: order.lines.map((line) => ({
              id: line.id,
              productCode: line.product.productCode,
              description: line.product.description,
              partType: line.product.partType,
              qty: line.qty,
              unitPrice: line.unitPriceSnapshot,
              lineTotal: line.lineTotal,
            })),
          },
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({ error: "Checkout failed" });
      }
    },
  );

  // ==================== ORDER ENDPOINTS ====================

  /**
   * GET /dealer/orders
   * Get dealer's orders
   */
  fastify.get(
    "/orders",
    {
      preHandler: requireAuth,
    },
    async (request: AuthenticatedRequest, reply) => {
      const querySchema = z.object({
        limit: z.coerce.number().int().min(1).max(100).optional().default(20),
        offset: z.coerce.number().int().min(0).optional().default(0),
        status: z.nativeEnum(OrderStatus).optional(),
      });

      const validation = querySchema.safeParse(request.query);

      if (!validation.success) {
        return reply.code(400).send({
          error: "Validation Error",
          details: validation.error.issues,
        });
      }

      const user = request.user;

      if (!user?.dealerAccountId) {
        return reply.code(401).send({ error: "Not authenticated as dealer" });
      }

      const { limit, offset, status } = validation.data;

      try {
        const where: any = { dealerAccountId: user.dealerAccountId };
        if (status) {
          where.status = status;
        }

        const [orders, totalCount] = await Promise.all([
          prisma.orderHeader.findMany({
            where,
            include: {
              lines: {
                include: {
                  product: {
                    select: {
                      productCode: true,
                      description: true,
                      partType: true,
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: "desc" },
            take: limit,
            skip: offset,
          }),
          prisma.orderHeader.count({ where }),
        ]);

        return reply.send({
          orders: orders.map((order) => ({
            id: order.id,
            orderNo: order.orderNo,
            status: order.status,
            subtotal: order.subtotal,
            total: order.total,
            currency: order.currency,
            dispatchMethod: order.dispatchMethod,
            poRef: order.poRef,
            notes: order.notes,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            lineCount: order.lines.length,
            lines: order.lines.map((line) => ({
              id: line.id,
              productCode: line.product.productCode,
              description: line.product.description,
              partType: line.product.partType,
              qty: line.qty,
              unitPrice: line.unitPriceSnapshot,
              lineTotal: line.lineTotal,
            })),
          })),
          pagination: {
            total: totalCount,
            limit,
            offset,
            hasMore: offset + limit < totalCount,
          },
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({ error: "Failed to fetch orders" });
      }
    },
  );

  /**
   * GET /dealer/orders/export
   * Export orders to CSV
   */
  fastify.get(
    "/orders/export",
    {
      preHandler: requireAuth,
    },
    async (request: AuthenticatedRequest, reply) => {
      const user = request.user;

      if (!user?.dealerAccountId) {
        return reply.code(401).send({ error: "Not authenticated as dealer" });
      }

      try {
        const exportLines = await prisma.orderExportLine.findMany({
          where: {
            orderHeader: { dealerAccountId: user.dealerAccountId },
          },
          include: {
            orderHeader: {
              select: {
                orderNo: true,
                createdAt: true,
                status: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        });

        // Generate CSV
        const csvLines = [
          "Order No,Account No,Line Type,Product Code,Description,Part Type,Qty,Unit Price,Created At,Status",
        ];

        for (const line of exportLines) {
          csvLines.push(
            [
              line.orderHeader.orderNo,
              line.accountNo,
              line.lineType,
              line.productCode,
              `"${line.description}"`,
              line.partType,
              line.qty,
              line.unitPrice,
              line.createdAt.toISOString(),
              line.orderHeader.status,
            ].join(","),
          );
        }

        const csv = csvLines.join("\n");

        reply.header("Content-Type", "text/csv");
        reply.header(
          "Content-Disposition",
          `attachment; filename="orders-export-${Date.now()}.csv"`,
        );
        return reply.send(csv);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({ error: "Failed to export orders" });
      }
    },
  );

  // ==================== BACKORDER ENDPOINTS ====================

  /**
   * GET /dealer/backorders
   * Get dealer's backorders
   */
  fastify.get(
    "/backorders",
    {
      preHandler: requireAuth,
    },
    async (request: AuthenticatedRequest, reply) => {
      const user = request.user;

      if (!user?.dealerAccountId) {
        return reply.code(401).send({ error: "Not authenticated as dealer" });
      }

      try {
        const dealerAccount = await prisma.dealerAccount.findUnique({
          where: { id: user.dealerAccountId },
          select: { accountNo: true },
        });

        if (!dealerAccount) {
          return reply.code(404).send({ error: "Dealer account not found" });
        }

        // Get active backorder dataset
        const activeDataset = await prisma.backorderDataset.findFirst({
          where: { isActive: true },
          orderBy: { createdAt: "desc" },
        });

        if (!activeDataset) {
          return reply.send({ backorders: [], datasetId: null });
        }

        // Get backorder rows for this dealer
        const backorders = await prisma.backorderRow.findMany({
          where: {
            datasetId: activeDataset.id,
            accountNo: dealerAccount.accountNo,
          },
          orderBy: { orderDate: "desc" },
        });

        return reply.send({
          backorders: backorders.map((bo) => ({
            id: bo.id,
            accountNo: bo.accountNo,
            orderNo: bo.orderNo,
            orderDate: bo.orderDate,
            partCode: bo.partCode,
            description: bo.description,
            qtyOrdered: bo.qtyOrdered,
            qtyOutstanding: bo.qtyOutstanding,
            orderValue: bo.orderValue,
          })),
          datasetId: activeDataset.id,
          datasetCreatedAt: activeDataset.createdAt,
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({ error: "Failed to fetch backorders" });
      }
    },
  );

  /**
   * GET /dealer/backorders/export
   * Export backorders to CSV
   */
  fastify.get(
    "/backorders/export",
    {
      preHandler: requireAuth,
    },
    async (request: AuthenticatedRequest, reply) => {
      const user = request.user;

      if (!user?.dealerAccountId) {
        return reply.code(401).send({ error: "Not authenticated as dealer" });
      }

      try {
        const dealerAccount = await prisma.dealerAccount.findUnique({
          where: { id: user.dealerAccountId },
          select: { accountNo: true },
        });

        if (!dealerAccount) {
          return reply.code(404).send({ error: "Dealer account not found" });
        }

        const activeDataset = await prisma.backorderDataset.findFirst({
          where: { isActive: true },
          orderBy: { createdAt: "desc" },
        });

        if (!activeDataset) {
          return reply.code(404).send({ error: "No active backorder dataset" });
        }

        const backorders = await prisma.backorderRow.findMany({
          where: {
            datasetId: activeDataset.id,
            accountNo: dealerAccount.accountNo,
          },
          orderBy: { orderDate: "desc" },
        });

        // Generate CSV
        const csvLines = [
          "Account No,Order No,Order Date,Part Code,Description,Qty Ordered,Qty Outstanding,Order Value",
        ];

        for (const bo of backorders) {
          csvLines.push(
            [
              bo.accountNo,
              bo.orderNo,
              bo.orderDate?.toISOString().split("T")[0] || "",
              bo.partCode,
              `"${bo.description}"`,
              bo.qtyOrdered,
              bo.qtyOutstanding,
              bo.orderValue,
            ].join(","),
          );
        }

        const csv = csvLines.join("\n");

        reply.header("Content-Type", "text/csv");
        reply.header(
          "Content-Disposition",
          `attachment; filename="backorders-export-${Date.now()}.csv"`,
        );
        return reply.send(csv);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({ error: "Failed to export backorders" });
      }
    },
  );

  // ==================== SUPPORT ENDPOINT ====================

  /**
   * POST /dealer/support
   * Send support request
   */
  fastify.post(
    "/support",
    {
      preHandler: requireAuth,
    },
    async (request: AuthenticatedRequest, reply) => {
      const supportSchema = z.object({
        subject: z.string().min(5).max(200),
        message: z.string().min(10).max(2000),
        category: z.enum(["ORDER", "PRICING", "ACCOUNT", "TECHNICAL", "OTHER"]).optional(),
      });

      const validation = supportSchema.safeParse(request.body);

      if (!validation.success) {
        return reply.code(400).send({
          error: "Validation Error",
          details: validation.error.issues,
        });
      }

      const user = request.user;

      if (!user?.dealerUserId || !user?.dealerAccountId) {
        return reply.code(401).send({ error: "Not authenticated as dealer" });
      }

      const { subject, message, category } = validation.data;

      try {
        const dealerUser = await prisma.dealerUser.findUnique({
          where: { id: user.dealerUserId },
          include: {
            user: { select: { email: true } },
            dealerAccount: { select: { accountNo: true, companyName: true } },
          },
        });

        if (!dealerUser) {
          return reply.code(404).send({ error: "Dealer user not found" });
        }

        // TODO: Send email to support
        const supportEmail = process.env.SUPPORT_EMAIL || "support@example.com";

        fastify.log.info(`Support request from ${dealerUser.user.email}:`);
        fastify.log.info(`Subject: ${subject}`);
        fastify.log.info(`Category: ${category || "N/A"}`);
        fastify.log.info(`Message: ${message}`);

        // In production, send actual email:
        // await emailService.sendSupportRequest({
        //   to: supportEmail,
        //   from: dealerUser.user.email,
        //   subject: `[${category || 'SUPPORT'}] ${subject}`,
        //   html: `
        //     <p><strong>From:</strong> ${dealerUser.firstName} ${dealerUser.lastName}</p>
        //     <p><strong>Email:</strong> ${dealerUser.user.email}</p>
        //     <p><strong>Account:</strong> ${dealerUser.dealerAccount.accountNo} - ${dealerUser.dealerAccount.companyName}</p>
        //     <p><strong>Category:</strong> ${category || 'N/A'}</p>
        //     <hr>
        //     <p>${message}</p>
        //   `
        // });

        return reply.send({
          success: true,
          message: "Support request submitted successfully. We will respond within 24 hours.",
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({ error: "Failed to submit support request" });
      }
    },
  );
};

export default dealerCompleteRoutes;
