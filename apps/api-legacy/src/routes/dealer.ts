import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { PartType, prisma } from "db";
import { CheckoutSchema, CartItemSchema } from "shared";
import { requireAuth, AuthenticatedRequest } from "../lib/auth";
import { dealerService, cartService, orderService } from "../lib/services";
import * as fs from "fs";
import * as path from "path";

const dealerRoutes: FastifyPluginAsync = async (server) => {
  const bannerDir = path.resolve(process.cwd(), "apps/web/public/brand/banners");
  const bannerUrlBase = "/brand/banners";

  const listBanners = () => {
    if (!fs.existsSync(bannerDir)) {
      return [];
    }
    return fs
      .readdirSync(bannerDir)
      .filter((file) => /\.(png|jpe?g|webp|svg)$/i.test(file))
      .map((file) => ({
        name: file,
        url: `${bannerUrlBase}/${file}`,
      }));
  };
  const archiveStaleNews = async () => {
    const now = new Date();
    const candidates = await prisma.newsArticle.findMany({
      where: {
        isPublished: true,
        isArchived: false,
        publishedAt: { not: null },
      },
      select: { id: true, publishedAt: true },
    });

    const staleIds = candidates
      .filter((article) => {
        if (!article.publishedAt) return false;
        const cutoff = new Date(article.publishedAt);
        cutoff.setMonth(cutoff.getMonth() + 6);
        return now > cutoff;
      })
      .map((article) => article.id);

    if (staleIds.length > 0) {
      await prisma.newsArticle.updateMany({
        where: { id: { in: staleIds } },
        data: { isArchived: true, archivedAt: now },
      });
    }
  };
  // GET /dealer/banners - Public banner list for dealer header
  server.get("/banners", async (_request, reply) => {
    return reply.send({ banners: listBanners() });
  });

  // GET /dealer/search - Search products with dealer pricing & entitlement filtering
  server.get(
    "/search",
    {
      preHandler: requireAuth,
    },
    async (request: AuthenticatedRequest, reply) => {
      const querySchema = z.object({
        q: z.string().min(1).optional(),
        limit: z.coerce.number().int().min(1).max(100).optional().default(20),
        partType: z.nativeEnum(PartType).optional(),
        inStockOnly: z.preprocess((val) => val === "true" || val === true, z.boolean()).optional(),
        sortBy: z.enum(["price", "code", "stock"]).optional(),
      });

      const validation = querySchema.safeParse(request.query);

      if (!validation.success) {
        return reply.status(400).send({
          error: "Validation Error",
          message: "Invalid query parameters",
          details: validation.error.issues,
        });
      }

      if (!request.user || request.user.role !== "DEALER" || !request.user.dealerAccountId) {
        return reply.status(request.user?.role !== "DEALER" ? 403 : 401).send({
          error: request.user?.role !== "DEALER" ? "Forbidden" : "Unauthorized",
          message: "Dealer access required",
        });
      }

      try {
        const result = await dealerService.searchProducts(
          request.user.dealerAccountId,
          validation.data,
        );

        return reply.status(200).send({
          results: result.results,
          count: result.count,
          query: validation.data.q || null,
          entitlement: result.entitlement,
          status: result.status,
        });
      } catch (error: any) {
        server.log.error(error);

        if (error.message === "Dealer account not found") {
          return reply.status(404).send({ error: "Not Found", message: error.message });
        }
        if (error.message === "Account inactive") {
          return reply.status(403).send({ error: "Forbidden", message: error.message });
        }

        return reply.status(500).send({
          error: "Internal Server Error",
          message: "An error occurred while searching products",
        });
      }
    },
  );

  // GET /dealer/product/:productCode - Get single product with pricing
  server.get(
    "/product/:productCode",
    {
      preHandler: requireAuth,
    },
    async (request: AuthenticatedRequest, reply) => {
      const paramsSchema = z.object({
        productCode: z.string().min(1),
      });

      const validation = paramsSchema.safeParse(request.params);

      if (!validation.success) {
        return reply.status(400).send({
          error: "Validation Error",
          message: "Invalid product code",
        });
      }

      if (!request.user?.dealerAccountId) {
        return reply.status(400).send({
          error: "Bad Request",
          message: "Dealer account ID not found",
        });
      }

      try {
        const product = await dealerService.getProductDetail(
          request.user.dealerAccountId,
          validation.data.productCode,
        );

        return reply.status(200).send(product);
      } catch (error: any) {
        server.log.error(error);

        if (error.code === "ITEM_SUPERSEDED") {
          return reply.status(409).send({
            error: "Conflict",
            code: "ITEM_SUPERSEDED",
            productCode: error.productCode,
            supersededBy: error.supersededBy,
            replacementExists: error.replacementExists,
          });
        }

        if (error.message === "Product not found") {
          return reply.status(404).send({ error: "Not Found", message: error.message });
        }

        return reply.status(500).send({
          error: "Internal Server Error",
          message: "An error occurred while fetching product",
        });
      }
    },
  );

  // GET /dealer/backorders - Get backorders for dealer
  server.get(
    "/backorders",
    {
      preHandler: requireAuth,
    },
    async (request: AuthenticatedRequest, reply) => {
      if (!request.user?.dealerAccountId) {
        return reply.status(400).send({
          error: "Bad Request",
          message: "Dealer account ID not found",
        });
      }

      try {
        const backorders = await dealerService.getBackorders(request.user.dealerAccountId);
        return reply.status(200).send({ backorders });
      } catch (error: any) {
        server.log.error(error);

        if (error.message === "Dealer account not found") {
          return reply.status(404).send({ error: "Not Found", message: error.message });
        }

        return reply.status(500).send({
          error: "Internal Server Error",
          message: "An error occurred while fetching backorders",
        });
      }
    },
  );

  // GET /dealer/cart - Get current cart
  server.get(
    "/cart",
    {
      preHandler: requireAuth,
    },
    async (request: AuthenticatedRequest, reply) => {
      if (!request.user?.dealerUserId || !request.user?.dealerAccountId) {
        return reply.status(400).send({
          error: "Bad Request",
          message: "User information not found",
        });
      }

      try {
        const cart = await cartService.getOrCreateCart(
          request.user.dealerUserId,
          request.user.dealerAccountId,
        );

        return reply.status(200).send(cart);
      } catch (error: any) {
        server.log.error(error);
        return reply.status(500).send({
          error: "Internal Server Error",
          message: "An error occurred while fetching cart",
        });
      }
    },
  );

  // POST /dealer/cart/items - Add item to cart
  server.post(
    "/cart/items",
    {
      preHandler: requireAuth,
    },
    async (request: AuthenticatedRequest, reply) => {
      const validation = CartItemSchema.safeParse(request.body);

      if (!validation.success) {
        return reply.status(400).send({
          error: "Validation Error",
          message: "Invalid cart item data",
          details: validation.error.issues,
        });
      }

      if (!request.user?.dealerUserId || !request.user?.dealerAccountId) {
        return reply.status(400).send({
          error: "Bad Request",
          message: "User information not found",
        });
      }

      try {
        const cart = await cartService.addItem(
          request.user.dealerUserId,
          request.user.dealerAccountId,
          validation.data,
        );

        return reply.status(200).send(cart);
      } catch (error: any) {
        server.log.error(error);

        if (error.message === "Product not found") {
          return reply.status(404).send({ error: "Not Found", message: error.message });
        }

        return reply.status(500).send({
          error: "Internal Server Error",
          message: "An error occurred while adding item to cart",
        });
      }
    },
  );

  // PATCH /dealer/cart/items/:id - Update cart item quantity
  server.patch(
    "/cart/items/:id",
    {
      preHandler: requireAuth,
    },
    async (request: AuthenticatedRequest, reply) => {
      const paramsSchema = z.object({
        id: z.string().uuid(),
      });

      const bodySchema = z.object({
        qty: z.number().int().positive().max(9999),
      });

      const paramsValidation = paramsSchema.safeParse(request.params);
      const bodyValidation = bodySchema.safeParse(request.body);

      if (!paramsValidation.success || !bodyValidation.success) {
        return reply.status(400).send({
          error: "Validation Error",
          message: "Invalid request data",
        });
      }

      if (!request.user?.dealerUserId || !request.user?.dealerAccountId) {
        return reply.status(400).send({
          error: "Bad Request",
          message: "User information not found",
        });
      }

      try {
        const cart = await cartService.updateItem(
          paramsValidation.data.id,
          request.user.dealerUserId,
          request.user.dealerAccountId,
          bodyValidation.data.qty,
        );

        return reply.status(200).send(cart);
      } catch (error: any) {
        server.log.error(error);

        if (error.code === "ITEM_SUPERSEDED") {
          return reply.status(409).send({
            error: "Conflict",
            code: "ITEM_SUPERSEDED",
            productCode: error.productCode,
            supersededBy: error.supersededBy,
            replacementExists: error.replacementExists,
          });
        }

        if (error.message === "Cart item not found") {
          return reply.status(404).send({ error: "Not Found", message: error.message });
        }

        return reply.status(500).send({
          error: "Internal Server Error",
          message: "An error occurred while updating cart item",
        });
      }
    },
  );

  // DELETE /dealer/cart/items/:id - Remove item from cart
  server.delete(
    "/cart/items/:id",
    {
      preHandler: requireAuth,
    },
    async (request: AuthenticatedRequest, reply) => {
      const paramsSchema = z.object({
        id: z.string().uuid(),
      });

      const validation = paramsSchema.safeParse(request.params);

      if (!validation.success) {
        return reply.status(400).send({
          error: "Validation Error",
          message: "Invalid cart item ID",
        });
      }

      if (!request.user?.dealerUserId || !request.user?.dealerAccountId) {
        return reply.status(400).send({
          error: "Bad Request",
          message: "User information not found",
        });
      }

      try {
        const cart = await cartService.removeItem(
          validation.data.id,
          request.user.dealerUserId,
          request.user.dealerAccountId,
        );

        return reply.status(200).send(cart);
      } catch (error: any) {
        server.log.error(error);

        if (error.message === "Cart item not found") {
          return reply.status(404).send({ error: "Not Found", message: error.message });
        }

        return reply.status(500).send({
          error: "Internal Server Error",
          message: "An error occurred while removing cart item",
        });
      }
    },
  );

  // DELETE /dealer/cart - Clear cart
  server.delete(
    "/cart",
    {
      preHandler: requireAuth,
    },
    async (request: AuthenticatedRequest, reply) => {
      if (!request.user?.dealerUserId || !request.user?.dealerAccountId) {
        return reply.status(400).send({
          error: "Bad Request",
          message: "User information not found",
        });
      }

      try {
        const cart = await cartService.clearCart(
          request.user.dealerUserId,
          request.user.dealerAccountId,
        );

        return reply.status(200).send(cart);
      } catch (error: any) {
        server.log.error(error);
        return reply.status(500).send({
          error: "Internal Server Error",
          message: "An error occurred while clearing cart",
        });
      }
    },
  );

  // POST /dealer/checkout - Create order from cart
  server.post(
    "/checkout",
    {
      preHandler: requireAuth,
    },
    async (request: AuthenticatedRequest, reply) => {
      const validation = CheckoutSchema.safeParse(request.body);

      if (!validation.success) {
        return reply.status(400).send({
          error: "Validation Error",
          message: "Invalid checkout data",
          details: validation.error.issues,
        });
      }

      if (!request.user?.dealerUserId || !request.user?.dealerAccountId) {
        return reply.status(400).send({
          error: "Bad Request",
          message: "User information not found",
        });
      }

      try {
        const order = await orderService.createOrder(
          request.user.dealerUserId,
          request.user.dealerAccountId,
          validation.data,
        );

        return reply.status(201).send(order);
      } catch (error: any) {
        server.log.error(error);

        if (error.message === "Cart is empty") {
          return reply.status(400).send({ error: "Bad Request", message: error.message });
        }

        if (error.code === "ITEM_SUPERSEDED") {
          return reply.status(409).send({
            error: "Conflict",
            code: "ITEM_SUPERSEDED",
            productCode: error.productCode,
            supersededBy: error.supersededBy,
            replacementExists: error.replacementExists,
          });
        }

        if (error.message.includes("not available") || error.message.includes("no price")) {
          return reply.status(400).send({ error: "Bad Request", message: error.message });
        }

        return reply.status(500).send({
          error: "Internal Server Error",
          message: "An error occurred while creating order",
        });
      }
    },
  );

  // GET /dealer/orders - Get order history
  server.get(
    "/orders",
    {
      preHandler: requireAuth,
    },
    async (request: AuthenticatedRequest, reply) => {
      const querySchema = z.object({
        limit: z.coerce.number().int().min(1).max(100).optional().default(20),
      });

      const validation = querySchema.safeParse(request.query);

      if (!validation.success) {
        return reply.status(400).send({
          error: "Validation Error",
          message: "Invalid query parameters",
        });
      }

      if (!request.user?.dealerAccountId) {
        return reply.status(400).send({
          error: "Bad Request",
          message: "Dealer account ID not found",
        });
      }

      try {
        const orders = await orderService.getOrders(
          request.user.dealerAccountId,
          validation.data.limit,
        );

        return reply.status(200).send({ orders });
      } catch (error: any) {
        server.log.error(error);
        return reply.status(500).send({
          error: "Internal Server Error",
          message: "An error occurred while fetching orders",
        });
      }
    },
  );

  // GET /dealer/orders/:id - Get order detail
  server.get(
    "/orders/:id",
    {
      preHandler: requireAuth,
    },
    async (request: AuthenticatedRequest, reply) => {
      const paramsSchema = z.object({
        id: z.string().uuid(),
      });

      const validation = paramsSchema.safeParse(request.params);

      if (!validation.success) {
        return reply.status(400).send({
          error: "Validation Error",
          message: "Invalid order ID",
        });
      }

      if (!request.user?.dealerAccountId) {
        return reply.status(400).send({
          error: "Bad Request",
          message: "Dealer account ID not found",
        });
      }

      try {
        const order = await orderService.getOrderDetail(
          validation.data.id,
          request.user.dealerAccountId,
        );

        return reply.status(200).send(order);
      } catch (error: any) {
        server.log.error(error);

        if (error.message === "Order not found") {
          return reply.status(404).send({ error: "Not Found", message: error.message });
        }

        return reply.status(500).send({
          error: "Internal Server Error",
          message: "An error occurred while fetching order",
        });
      }
    },
  );

  // GET /dealer/orders/export - Export dealer orders as CSV
  server.get(
    "/orders/export",
    {
      preHandler: requireAuth,
    },
    async (request: AuthenticatedRequest, reply) => {
      if (!request.user?.dealerAccountId) {
        return reply.status(400).send({
          error: "Bad Request",
          message: "Dealer account ID not found",
        });
      }

      try {
        const orders = await prisma.orderHeader.findMany({
          where: { dealerAccountId: request.user.dealerAccountId },
          include: {
            lines: true,
          },
          orderBy: { createdAt: "desc" },
        });

        const rows = [["Order No", "PO Ref", "Status", "Total", "Created At", "Lines Count"]];
        for (const order of orders) {
          rows.push([
            order.orderNo,
            order.poRef || "",
            order.status,
            Number(order.total || 0).toFixed(2),
            order.createdAt.toISOString(),
            String(order.lines.length),
          ]);
        }

        const csv = rows
          .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
          .join("\n");

        reply.header("Content-Type", "text/csv");
        reply.header(
          "Content-Disposition",
          `attachment; filename="orders-export-${Date.now()}.csv"`,
        );
        return reply.send(csv);
      } catch (error: any) {
        server.log.error(error);
        return reply.status(500).send({
          error: "Internal Server Error",
          message: "An error occurred while exporting orders",
        });
      }
    },
  );

  // GET /dealer/news - Published news list
  server.get(
    "/news",
    { preHandler: requireAuth },
    async (_request: AuthenticatedRequest, reply) => {
      await archiveStaleNews();
      const now = new Date();

      const news = await prisma.newsArticle.findMany({
        where: {
          isPublished: true,
          isArchived: false,
          OR: [{ startsAt: null }, { startsAt: { lte: now } }],
          AND: [
            {
              OR: [{ endsAt: null }, { endsAt: { gte: now } }],
            },
          ],
        },
        include: { attachments: true },
        orderBy: { publishedAt: "desc" },
      });

      return reply.status(200).send({ news });
    },
  );

  // GET /dealer/news/:id/attachments/:attachmentId/download
  server.get(
    "/news/:id/attachments/:attachmentId/download",
    { preHandler: requireAuth },
    async (request, reply) => {
      const paramsSchema = z.object({
        id: z.string(),
        attachmentId: z.string(),
      });
      const params = paramsSchema.parse(request.params);

      const attachment = await prisma.newsAttachment.findFirst({
        where: { id: params.attachmentId, articleId: params.id },
      });

      if (!attachment) {
        return reply.status(404).send({ error: "Not Found", message: "Attachment not found" });
      }

      const absolutePath = path.resolve(process.cwd(), attachment.blobPath);
      if (!fs.existsSync(absolutePath)) {
        return reply.status(404).send({ error: "Not Found", message: "File missing on disk" });
      }

      const stream = fs.createReadStream(absolutePath);
      reply.type(attachment.mimeType || "application/octet-stream");
      reply.header("Content-Disposition", `attachment; filename="${attachment.fileName}"`);
      return reply.send(stream);
    },
  );
};

export default dealerRoutes;
